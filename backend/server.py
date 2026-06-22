"""Masterpiece Tools — FastAPI backend.

Endpoints
---------
Public:
  GET    /api/health
  GET    /api/settings              — public site settings (logo, links, allowedCountries, hero/SEO copy)
  POST   /api/quotes                — submit RFQ + send notification emails (best-effort SMTP)

Owner / admin (JWT bearer):
  POST   /api/admin/auth/login      — email+password → triggers OTP, returns demoCode in dev
  POST   /api/admin/auth/verify     — email+code → JWT
  GET    /api/admin/me              — current owner
  GET    /api/admin/quotes          — list submitted RFQs
  PATCH  /api/admin/quotes/{id}     — update status / notes
  PUT    /api/admin/settings        — replace settings doc
  POST   /api/admin/customers       — (no-op for now)
  GET    /api/admin/customers       — derived from quotes
"""
from fastapi import FastAPI, APIRouter, HTTPException, Depends, BackgroundTasks, status
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from pathlib import Path
from datetime import datetime, timezone
import os
import logging
import uuid

from base import BaseDocument, now_iso, new_uuid
from auth import (
    verify_owner, issue_otp, verify_otp, issue_jwt, require_owner,
    OWNER_EMAIL,
)
from email_service import send_email, render_rfq_owner, render_rfq_customer, email_configured

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("mpt")

# Mongo
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

# FastAPI
app = FastAPI(title="Masterpiece Tools API", version="2.0.0")
api = APIRouter(prefix="/api")

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
    status: str = "new"           # new / contacted / quoted / won / lost
    adminNotes: Optional[str] = ""
    createdAt: str = Field(default_factory=now_iso)
    updatedAt: str = Field(default_factory=now_iso)


class QuoteUpdate(BaseModel):
    status: Optional[str] = None
    adminNotes: Optional[str] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class VerifyRequest(BaseModel):
    email: EmailStr
    code: str = Field(min_length=4, max_length=8)


class Settings(BaseDocument):
    # Mirrors the frontend SiteConfigContext defaults — kept as a flat dict to avoid lock-in.
    data: Dict[str, Any] = {}
    updatedAt: str = Field(default_factory=now_iso)


# ============================================================
# Public endpoints
# ============================================================
@api.get("/health")
async def health():
    return {
        "ok": True,
        "service": "masterpiece-tools-api",
        "version": "2.0.0",
        "email_configured": email_configured(),
        "owner_email": OWNER_EMAIL,
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
    """Public, read-only view of the site settings (used by the frontend to hydrate config)."""
    doc = await db.settings.find_one({"_id": "site"})
    if not doc:
        return {"data": {}}
    return {"data": doc.get("data", {}), "updatedAt": doc.get("updatedAt")}


def _send_quote_emails(qid: str, payload: dict, owner_email: str):
    """Background task — best-effort SMTP."""
    try:
        send_email(
            to=owner_email,
            subject=f"[Masterpiece] New RFQ — {qid} from {payload.get('company')}",
            html=render_rfq_owner({**payload, "id": qid, "createdAt": now_iso()}),
            reply_to=payload.get("email"),
        )
        send_email(
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
    owner_email = os.environ.get("NOTIFY_EMAIL") or OWNER_EMAIL
    background.add_task(_send_quote_emails, qobj.qid, body.model_dump(), owner_email)
    return {"ok": True, "qid": qobj.qid, "email_mode": ("smtp" if email_configured() else "mock")}


# ============================================================
# Admin auth
# ============================================================
@api.post("/admin/auth/login")
async def admin_login(body: LoginRequest):
    if not verify_owner(body.email, body.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    code = issue_otp(body.email)
    sent = send_email(
        to=body.email,
        subject="Your Masterpiece owner verification code",
        html=f"<p style='font-family:Arial'>Your verification code is <strong style='font-size:24px;letter-spacing:6px'>{code}</strong>.<br/>This code expires in 10 minutes.</p>",
    )
    payload: Dict[str, Any] = {"ok": True, "email_mode": sent.get("mode", "mock"), "ttlSeconds": 600}
    # In dev / preview without SMTP configured we surface the code in the response for testing.
    if not email_configured():
        payload["demoCode"] = code
    return payload


@api.post("/admin/auth/verify")
async def admin_verify(body: VerifyRequest):
    if body.email.lower().strip() != OWNER_EMAIL.lower().strip():
        raise HTTPException(status_code=401, detail="Invalid email")
    if not verify_otp(body.email, body.code):
        raise HTTPException(status_code=401, detail="Invalid or expired code")
    token = issue_jwt(body.email)
    return {"ok": True, "token": token, "owner": {"email": OWNER_EMAIL, "name": "Owner", "role": "owner"}}


@api.get("/admin/me")
async def admin_me(auth=Depends(require_owner)):
    return {"email": auth["sub"], "role": auth.get("role")}


# ============================================================
# Admin quotes
# ============================================================
@api.get("/admin/quotes")
async def admin_list_quotes(auth=Depends(require_owner), limit: int = 100, status_filter: Optional[str] = None):
    q: Dict[str, Any] = {}
    if status_filter:
        q["status"] = status_filter
    rows = await db.quotes.find(q).sort("createdAt", -1).limit(min(max(limit, 1), 500)).to_list(None)
    out = []
    for r in rows:
        r.pop("_id", None)
        out.append(r)
    return {"quotes": out, "count": len(out)}


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


class QuoteReply(BaseModel):
    message: str = Field(min_length=1, max_length=10000)
    subject: Optional[str] = None


@api.post("/admin/quotes/{qid}/reply")
async def admin_reply_quote(qid: str, body: QuoteReply, auth=Depends(require_owner)):
    """Send an email reply to the customer for this quote."""
    doc = await db.quotes.find_one({"qid": qid})
    if not doc:
        raise HTTPException(status_code=404, detail="Quote not found")
    message = body.message.strip()
    subject = body.subject or f"Re: your Masterpiece quote {qid}"
    res = send_email(
        to=doc["email"],
        subject=subject,
        html=f"<div style='font-family:Arial;line-height:1.6'>{message}</div>",
        reply_to=os.environ.get("REPLY_TO_EMAIL") or OWNER_EMAIL,
    )
    # Append to a replies log on the document
    await db.quotes.update_one(
        {"qid": qid},
        {"$push": {"replies": {"at": now_iso(), "by": auth["sub"], "subject": subject, "message": message, "mode": res.get("mode")}}},
    )
    return {"ok": True, "mode": res.get("mode")}


# ============================================================
# Admin customers (derived view)
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
    """Replace the site settings document. Body should be the full settings object."""
    data = body.get("data") or body
    await db.settings.update_one(
        {"_id": "site"},
        {"$set": {"data": data, "updatedAt": now_iso()}},
        upsert=True,
    )
    return {"ok": True, "updatedAt": now_iso()}


# ============================================================
# Wire up app
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
