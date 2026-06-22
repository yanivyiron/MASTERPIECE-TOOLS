"""Masterpiece Tools — FastAPI backend (v2.1).

Everything the owner needs to configure is exposed via /api/admin/* — so the website is
fully self-serviceable. No env vars required for day-to-day operation.

Endpoints
---------
Public:
  GET    /api/health
  GET    /api/settings              — public site settings (sensitive fields stripped)
  POST   /api/quotes                — submit RFQ + send notification emails

Owner / admin (JWT bearer):
  POST   /api/admin/auth/login      — email+password → triggers OTP
  POST   /api/admin/auth/verify     — email+code → JWT
  POST   /api/admin/account/change-password
  POST   /api/admin/account/change-email
  GET    /api/admin/me
  GET    /api/admin/quotes
  PATCH  /api/admin/quotes/{id}
  POST   /api/admin/quotes/{id}/reply
  GET    /api/admin/customers
  PUT    /api/admin/settings        — replace site settings
  POST   /api/admin/email/test      — owner-triggered SMTP probe
  GET    /api/admin/products
  POST   /api/admin/products
  PUT    /api/admin/products/{id}
  DELETE /api/admin/products/{id}
"""
from fastapi import FastAPI, APIRouter, HTTPException, Depends, BackgroundTasks
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from pathlib import Path
from datetime import datetime, timezone
import os
import logging

from base import BaseDocument, now_iso, new_uuid
from auth import (
    verify_owner, issue_otp, verify_otp, issue_jwt, require_owner,
    change_owner_password, change_owner_email, get_owner_email,
)
from email_service import (
    send_email, render_rfq_owner, render_rfq_customer,
    email_configured, get_notify_email, send_test_email,
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("mpt")

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI(title="Masterpiece Tools API", version="2.1.0")
api = APIRouter(prefix="/api")

# Settings fields that must NEVER leave the backend
SENSITIVE_SETTINGS = {"smtpPassword"}


# ============================================================
# Models
# ============================================================
class StatusCheck(BaseModel):
    id: str = Field(default_factory=new_uuid)
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class StatusCheckCreate(BaseModel):
    client_name: str


class QuoteItem(BaseModel):
    id: Optional[str] = None
    slug: Optional[str] = None
    name: Optional[str] = None
    qty: int = 1
    notes: Optional[str] = ""
    image: Optional[str] = None


class QuoteCreate(BaseModel):
    firstName: str = Field(min_length=1, max_length=80)
    lastName: Optional[str] = ""
    email: EmailStr
    company: str = Field(min_length=1, max_length=120)
    country: Optional[str] = ""
    phone: Optional[str] = ""
    industry: Optional[str] = ""
    message: Optional[str] = ""
    productTypes: Dict[str, bool] = {}
    items: List[QuoteItem] = []
    files: List[str] = []


class Quote(BaseDocument):
    qid: str = Field(default_factory=lambda: f"Q-{new_uuid()[:8].upper()}")
    firstName: str
    lastName: Optional[str] = ""
    email: str
    company: str
    country: Optional[str] = ""
    phone: Optional[str] = ""
    industry: Optional[str] = ""
    message: Optional[str] = ""
    productTypes: Dict[str, bool] = {}
    items: List[Dict[str, Any]] = []
    files: List[str] = []
    status: str = "new"
    adminNotes: Optional[str] = ""
    createdAt: str = Field(default_factory=now_iso)
    updatedAt: str = Field(default_factory=now_iso)


class QuoteUpdate(BaseModel):
    status: Optional[str] = None
    adminNotes: Optional[str] = None


class QuoteReply(BaseModel):
    message: str = Field(min_length=1, max_length=10000)
    subject: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class VerifyRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=4, max_length=8)


class ChangePasswordRequest(BaseModel):
    currentPassword: str = Field(min_length=1)
    newPassword: str = Field(min_length=8, max_length=128)


class ChangeEmailRequest(BaseModel):
    newEmail: EmailStr
    currentPassword: str = Field(min_length=1)


class EmailTestRequest(BaseModel):
    to: EmailStr


class ProductIn(BaseModel):
    slug: str = Field(min_length=1, max_length=120)
    name: str = Field(min_length=1, max_length=200)
    desc: Optional[str] = ""
    category: str = "precision-gauges"
    subcategory: Optional[str] = ""
    image: Optional[str] = ""
    specSheet: Optional[str] = ""          # data URL or absolute URL
    specSheetName: Optional[str] = ""
    specs: Dict[str, Any] = {}
    features: List[str] = []
    leadTime: Optional[str] = "2-4 weeks"
    badge: Optional[str] = "precision"


# ============================================================
# Helpers
# ============================================================
def _strip_sensitive(d: dict) -> dict:
    return {k: v for k, v in (d or {}).items() if k not in SENSITIVE_SETTINGS}


# ============================================================
# Public endpoints
# ============================================================
@api.get("/health")
async def health():
    return {
        "ok": True,
        "service": "masterpiece-tools-api",
        "version": "2.1.0",
        "email_configured": await email_configured(),
        "owner_email": await get_owner_email(),
    }


@api.get("/")
async def root():
    return {"message": "Masterpiece Tools API"}


@api.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    obj = StatusCheck(client_name=input.client_name)
    doc = obj.model_dump()
    doc["timestamp"] = doc["timestamp"].isoformat()
    await db.status_checks.insert_one(doc)
    return obj


@api.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    rows = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    for r in rows:
        if isinstance(r.get("timestamp"), str):
            r["timestamp"] = datetime.fromisoformat(r["timestamp"])
    return rows


@api.get("/settings")
async def get_public_settings():
    """Public read of site settings (sensitive fields like SMTP password stripped)."""
    doc = await db.settings.find_one({"_id": "site"})
    if not doc:
        return {"data": {}}
    return {"data": _strip_sensitive(doc.get("data", {})), "updatedAt": doc.get("updatedAt")}


async def _send_quote_emails(qid: str, payload: dict):
    """Background task — best-effort SMTP using DB config."""
    try:
        owner_email = await get_notify_email()
        await send_email(
            to=owner_email,
            subject=f"[Masterpiece] New RFQ — {qid} from {payload.get('company')}",
            html=render_rfq_owner({**payload, "id": qid, "createdAt": now_iso()}),
            reply_to=payload.get("email"),
        )
        await send_email(
            to=payload.get("email"),
            subject=f"Masterpiece Tools — your quote request {qid}",
            html=render_rfq_customer({**payload, "id": qid}),
        )
    except Exception as e:
        logger.exception("Quote email send failed: %s", e)


@api.post("/quotes")
async def submit_quote(body: QuoteCreate, background: BackgroundTasks):
    qobj = Quote(**body.model_dump())
    doc = qobj.to_mongo()
    await db.quotes.insert_one(doc)
    background.add_task(_send_quote_emails, qobj.qid, body.model_dump())
    return {"ok": True, "qid": qobj.qid, "email_mode": ("smtp" if await email_configured() else "mock")}


# ============================================================
# Admin auth
# ============================================================
@api.post("/admin/auth/login")
async def admin_login(body: LoginRequest):
    if not await verify_owner(body.email, body.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    code = issue_otp(body.email)
    sent = await send_email(
        to=body.email,
        subject="Your Masterpiece owner verification code",
        html=f"<p style='font-family:Arial'>Your verification code is <strong style='font-size:24px;letter-spacing:6px'>{code}</strong>.<br/>This code expires in 10 minutes.</p>",
    )
    payload: Dict[str, Any] = {"ok": True, "email_mode": sent.get("mode", "mock"), "ttlSeconds": 600}
    # In dev / when SMTP isn't configured we surface the code so the owner can still log in.
    if not await email_configured():
        payload["demoCode"] = code
    return payload


@api.post("/admin/auth/verify")
async def admin_verify(body: VerifyRequest):
    owner_email = await get_owner_email()
    if body.email.lower().strip() != owner_email.lower().strip():
        raise HTTPException(status_code=401, detail="Invalid email")
    if not verify_otp(body.email, body.code):
        raise HTTPException(status_code=401, detail="Invalid or expired code")
    token = issue_jwt(body.email)
    return {"ok": True, "token": token, "owner": {"email": owner_email, "name": "Owner", "role": "owner"}}


@api.get("/admin/me")
async def admin_me(auth=Depends(require_owner)):
    return {"email": auth["sub"], "role": auth.get("role"), "email_configured": await email_configured()}


@api.post("/admin/account/change-password")
async def admin_change_password(body: ChangePasswordRequest, auth=Depends(require_owner)):
    ok = await change_owner_password(body.currentPassword, body.newPassword)
    if not ok:
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    return {"ok": True}


@api.post("/admin/account/change-email")
async def admin_change_email(body: ChangeEmailRequest, auth=Depends(require_owner)):
    if not await verify_owner(await get_owner_email(), body.currentPassword):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    await change_owner_email(body.newEmail)
    return {"ok": True, "newEmail": body.newEmail}


# ============================================================
# Admin quotes
# ============================================================
@api.get("/admin/quotes")
async def admin_list_quotes(auth=Depends(require_owner), limit: int = 100, status_filter: Optional[str] = None):
    q: Dict[str, Any] = {}
    if status_filter:
        q["status"] = status_filter
    rows = await db.quotes.find(q).sort("createdAt", -1).limit(min(max(limit, 1), 500)).to_list(None)
    for r in rows:
        r.pop("_id", None)
    return {"quotes": rows, "count": len(rows)}


@api.patch("/admin/quotes/{qid}")
async def admin_update_quote(qid: str, body: QuoteUpdate, auth=Depends(require_owner)):
    patch = {k: v for k, v in body.model_dump(exclude_none=True).items()}
    if not patch:
        return {"ok": True, "noop": True}
    patch["updatedAt"] = now_iso()
    result = await db.quotes.update_one({"qid": qid}, {"$set": patch})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Quote not found")
    return {"ok": True}


@api.post("/admin/quotes/{qid}/reply")
async def admin_reply_quote(qid: str, body: QuoteReply, auth=Depends(require_owner)):
    doc = await db.quotes.find_one({"qid": qid})
    if not doc:
        raise HTTPException(status_code=404, detail="Quote not found")
    message = body.message.strip()
    subject = body.subject or f"Re: your Masterpiece quote {qid}"
    res = await send_email(
        to=doc["email"],
        subject=subject,
        html=f"<div style='font-family:Arial;line-height:1.6'>{message}</div>",
        reply_to=await get_notify_email(),
    )
    await db.quotes.update_one(
        {"qid": qid},
        {"$push": {"replies": {"at": now_iso(), "by": auth["sub"], "subject": subject, "message": message, "mode": res.get("mode")}}},
    )
    return {"ok": True, "mode": res.get("mode")}


# ============================================================
# Admin customers (derived)
# ============================================================
@api.get("/admin/customers")
async def admin_list_customers(auth=Depends(require_owner)):
    pipeline = [
        {"$group": {
            "_id": "$email",
            "firstName": {"$first": "$firstName"},
            "lastName": {"$first": "$lastName"},
            "company": {"$last": "$company"},
            "country": {"$last": "$country"},
            "lastContact": {"$max": "$createdAt"},
            "quoteCount": {"$sum": 1},
        }},
        {"$sort": {"lastContact": -1}},
    ]
    rows = await db.quotes.aggregate(pipeline).to_list(None)
    out = [{"email": r["_id"], **{k: v for k, v in r.items() if k != "_id"}} for r in rows]
    return {"customers": out, "count": len(out)}


# ============================================================
# Admin settings
# ============================================================
@api.put("/admin/settings")
async def admin_put_settings(body: Dict[str, Any], auth=Depends(require_owner)):
    """Replace the site settings document. Body may be either {data:{...}} or the raw settings object."""
    data = body.get("data") if "data" in body else body
    if not isinstance(data, dict):
        raise HTTPException(status_code=400, detail="Body must be an object")

    # If smtpPassword is empty string, preserve the previously-stored value so the UI
    # doesn't accidentally wipe the password when the field is blank.
    if data.get("smtpPassword") == "":
        existing = await db.settings.find_one({"_id": "site"})
        prior_pw = (existing or {}).get("data", {}).get("smtpPassword")
        if prior_pw:
            data["smtpPassword"] = prior_pw

    await db.settings.update_one(
        {"_id": "site"},
        {"$set": {"data": data, "updatedAt": now_iso()}},
        upsert=True,
    )
    return {"ok": True, "updatedAt": now_iso()}


# ============================================================
# Email test
# ============================================================
@api.post("/admin/email/test")
async def admin_email_test(body: EmailTestRequest, auth=Depends(require_owner)):
    res = await send_test_email(body.to)
    return res


# ============================================================
# Admin products (CRUD)
# ============================================================
@api.get("/admin/products")
async def admin_list_products(auth=Depends(require_owner)):
    rows = await db.products.find({}).sort("createdAt", -1).to_list(None)
    for r in rows:
        r["id"] = str(r.pop("_id"))
    return {"products": rows, "count": len(rows)}


@api.post("/admin/products")
async def admin_create_product(body: ProductIn, auth=Depends(require_owner)):
    doc = body.model_dump()
    doc["createdAt"] = now_iso()
    doc["updatedAt"] = now_iso()
    result = await db.products.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return {"ok": True, "product": doc}


@api.put("/admin/products/{pid}")
async def admin_update_product(pid: str, body: ProductIn, auth=Depends(require_owner)):
    from bson import ObjectId
    try:
        oid = ObjectId(pid)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid product id")
    patch = body.model_dump()
    patch["updatedAt"] = now_iso()
    result = await db.products.update_one({"_id": oid}, {"$set": patch})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"ok": True}


@api.delete("/admin/products/{pid}")
async def admin_delete_product(pid: str, auth=Depends(require_owner)):
    from bson import ObjectId
    try:
        oid = ObjectId(pid)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid product id")
    result = await db.products.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"ok": True}


# ============================================================
# Wire up
# ============================================================
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db():
    client.close()
