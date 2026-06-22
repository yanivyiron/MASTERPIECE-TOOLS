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
import re

from base import BaseDocument, now_iso, new_uuid
from auth import (
    verify_owner, verify_user, get_user_record, issue_otp, verify_otp, issue_jwt,
    require_owner, require_user, require_perm,
    change_owner_password, change_owner_email, get_owner_email,
    list_team_members, create_team_member, update_team_member, delete_team_member,
    DEFAULT_PERMISSIONS,
)
from email_service import (
    send_email, render_rfq_owner, render_rfq_customer,
    email_configured, get_notify_email, send_test_email,
)
from translate_service import translate_fields, llm_configured
from ai_assistant import run_assistant, execute_undo, extract_attachment_text
from web_importer import crawl_site

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


class QuoteAttachment(BaseModel):
    name: str
    type: Optional[str] = ""
    size: int = 0
    data: str = ""        # data: URL or base64 payload
    uploadedAt: Optional[str] = None


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
    attachments: List[QuoteAttachment] = []


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
    attachments: List[Dict[str, Any]] = []
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
    translations: Optional[Dict[str, Dict[str, str]]] = None
    autoTranslate: bool = True


class CategoryIn(BaseModel):
    slug: str = Field(min_length=1, max_length=80)
    name: str = Field(min_length=1, max_length=120)
    description: Optional[str] = ""
    image: Optional[str] = ""
    icon: Optional[str] = ""
    order: int = 0
    translations: Optional[Dict[str, Dict[str, str]]] = None
    autoTranslate: bool = True


# ---- Team / RBAC ----
class TeamMemberIn(BaseModel):
    email: EmailStr
    name: str = Field(min_length=1, max_length=120)
    role: str = Field(pattern="^(admin|member)$")
    password: str = Field(min_length=8, max_length=128)
    permissions: Optional[Dict[str, bool]] = None


class TeamMemberPatch(BaseModel):
    name: Optional[str] = None
    role: Optional[str] = Field(default=None, pattern="^(admin|member)$")
    permissions: Optional[Dict[str, bool]] = None
    active: Optional[bool] = None
    password: Optional[str] = Field(default=None, min_length=8, max_length=128)


# ---- Custom email blast ----
class EmailAttachment(BaseModel):
    name: str
    type: Optional[str] = ""
    data: str                 # base64 (without data: prefix) OR data URL


class BulkEmailRequest(BaseModel):
    recipients: List[EmailStr] = Field(min_length=1, max_length=2000)
    subject: str = Field(min_length=1, max_length=300)
    html: Optional[str] = ""
    text: Optional[str] = ""
    attachments: List[EmailAttachment] = []
    templateId: Optional[str] = None


class SingleEmailRequest(BaseModel):
    """Used when the recipient is determined by the URL (e.g. /admin/customers/{email}/email)."""
    subject: str = Field(min_length=1, max_length=300)
    html: Optional[str] = ""
    text: Optional[str] = ""
    attachments: List[EmailAttachment] = []
    templateId: Optional[str] = None


# ---- Email templates ----
class EmailTemplateIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    subject: str = Field(min_length=1, max_length=300)
    html: str = Field(min_length=1)
    description: Optional[str] = ""
    kind: Optional[str] = "custom"  # custom | rfq_owner | rfq_customer | reply


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


async def _send_quote_emails(qid: str, payload: dict, attachments: Optional[List[dict]] = None):
    """Background task — best-effort SMTP using DB config."""
    try:
        owner_email = await get_notify_email()
        await send_email(
            to=owner_email,
            subject=f"[Masterpiece] New RFQ — {qid} from {payload.get('company')}",
            html=render_rfq_owner({**payload, "id": qid, "createdAt": now_iso()}),
            reply_to=payload.get("email"),
            attachments=attachments,
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
    # Forward attachments to the owner email
    att_payload = []
    for a in (body.attachments or []):
        att_payload.append({"name": a.name, "type": a.type, "data": a.data})
    background.add_task(_send_quote_emails, qobj.qid, body.model_dump(), att_payload)
    return {"ok": True, "qid": qobj.qid, "email_mode": ("smtp" if await email_configured() else "mock")}


# ============================================================
# Admin auth
# ============================================================
@api.post("/admin/auth/login")
async def admin_login(body: LoginRequest):
    user = await verify_user(body.email, body.password)
    if not user:
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
    user = await get_user_record(body.email)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email")
    if not verify_otp(body.email, body.code):
        raise HTTPException(status_code=401, detail="Invalid or expired code")
    token = issue_jwt(user["email"], role=user["role"], permissions=user.get("permissions"))
    return {"ok": True, "token": token, "owner": {
        "email": user["email"], "name": user.get("name") or "Owner",
        "role": user["role"], "permissions": user.get("permissions") or {},
    }}


@api.get("/admin/me")
async def admin_me(auth=Depends(require_user)):
    user = await get_user_record(auth["sub"])
    return {
        "email": auth["sub"],
        "role": auth.get("role"),
        "name": (user or {}).get("name"),
        "permissions": (user or {}).get("permissions") or auth.get("perm") or {},
        "email_configured": await email_configured(),
        "llm_configured": llm_configured(),
    }


@api.post("/admin/account/change-password")
async def admin_change_password(body: ChangePasswordRequest, auth=Depends(require_user)):
    # Owner can change owner password
    if auth.get("role") == "owner":
        ok = await change_owner_password(body.currentPassword, body.newPassword)
        if not ok:
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        return {"ok": True}
    # Team member changing their own password
    user = await verify_user(auth["sub"], body.currentPassword)
    if not user:
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    # locate id and update
    from bson import ObjectId  # noqa
    rec = await db.team_members.find_one({"email": auth["sub"]})
    if not rec:
        raise HTTPException(status_code=404, detail="User not found")
    await update_team_member(str(rec["_id"]), password=body.newPassword)
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
async def admin_list_quotes(auth=Depends(require_perm("quotes.read")), limit: int = 100, status_filter: Optional[str] = None):
    q: Dict[str, Any] = {}
    if status_filter:
        q["status"] = status_filter
    rows = await db.quotes.find(q).sort("createdAt", -1).limit(min(max(limit, 1), 500)).to_list(None)
    for r in rows:
        r.pop("_id", None)
    return {"quotes": rows, "count": len(rows)}


@api.patch("/admin/quotes/{qid}")
async def admin_update_quote(qid: str, body: QuoteUpdate, auth=Depends(require_perm("quotes.edit"))):
    patch = {k: v for k, v in body.model_dump(exclude_none=True).items()}
    if not patch:
        return {"ok": True, "noop": True}
    patch["updatedAt"] = now_iso()
    result = await db.quotes.update_one({"qid": qid}, {"$set": patch})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Quote not found")
    return {"ok": True}


@api.delete("/admin/quotes/{qid}")
async def admin_delete_quote(qid: str, auth=Depends(require_perm("quotes.delete"))):
    res = await db.quotes.delete_one({"qid": qid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Quote not found")
    return {"ok": True}


@api.post("/admin/quotes/{qid}/reply")
async def admin_reply_quote(qid: str, body: QuoteReply, auth=Depends(require_perm("quotes.reply"))):
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
        {"$set": {"status": "replied", "updatedAt": now_iso()},
         "$push": {"replies": {"at": now_iso(), "by": auth["sub"], "subject": subject, "message": message, "mode": res.get("mode")}}},
    )
    return {"ok": True, "mode": res.get("mode")}


# ============================================================
# Admin customers (derived)
# ============================================================
@api.get("/admin/customers")
async def admin_list_customers(auth=Depends(require_perm("customers.read"))):
    pipeline = [
        {"$group": {
            "_id": "$email",
            "firstName": {"$first": "$firstName"},
            "lastName": {"$first": "$lastName"},
            "company": {"$last": "$company"},
            "country": {"$last": "$country"},
            "phone": {"$last": "$phone"},
            "industry": {"$last": "$industry"},
            "lastContact": {"$max": "$createdAt"},
            "quoteCount": {"$sum": 1},
        }},
        {"$sort": {"lastContact": -1}},
    ]
    rows = await db.quotes.aggregate(pipeline).to_list(None)
    # Merge in CRM overrides (notes, tags) stored separately
    overrides = {o["email"]: o async for o in db.customer_overrides.find({})}
    out = []
    for r in rows:
        email = r["_id"]
        merged = {"email": email, **{k: v for k, v in r.items() if k != "_id"}}
        ov = overrides.get(email) or {}
        merged["notes"] = ov.get("notes") or ""
        merged["tags"] = ov.get("tags") or []
        merged["blocked"] = bool(ov.get("blocked"))
        out.append(merged)
    return {"customers": out, "count": len(out)}


@api.put("/admin/customers/{email}")
async def admin_update_customer(email: str, body: Dict[str, Any], auth=Depends(require_perm("customers.edit"))):
    patch = {k: body[k] for k in ("notes", "tags", "blocked") if k in body}
    patch["email"] = email.lower().strip()
    patch["updatedAt"] = now_iso()
    await db.customer_overrides.update_one({"email": patch["email"]}, {"$set": patch}, upsert=True)
    return {"ok": True}


@api.delete("/admin/customers/{email}")
async def admin_delete_customer(email: str, auth=Depends(require_perm("customers.delete"))):
    """Delete ALL of a customer's quotes + the override record."""
    e = email.lower().strip()
    qres = await db.quotes.delete_many({"email": e})
    await db.customer_overrides.delete_one({"email": e})
    return {"ok": True, "deletedQuotes": qres.deleted_count}


@api.post("/admin/customers/{email}/email")
async def admin_email_customer(email: str, body: SingleEmailRequest, auth=Depends(require_perm("customers.email"))):
    """Send a single targeted email to one customer (with optional attachments)."""
    e = email.lower().strip()
    atts = [a.model_dump() for a in (body.attachments or [])]
    res = await send_email(
        to=e,
        subject=body.subject,
        html=body.html or body.text or "",
        text=body.text or None,
        reply_to=await get_notify_email(),
        attachments=atts,
    )
    await db.customer_emails.insert_one({
        "to": e, "subject": body.subject, "by": auth["sub"], "at": now_iso(),
        "mode": res.get("mode"), "ok": res.get("ok"),
        "attachmentCount": len(atts),
    })
    return res


# ============================================================
# Admin settings
# ============================================================
@api.put("/admin/settings")
async def admin_put_settings(body: Dict[str, Any], auth=Depends(require_perm("settings.edit"))):
    """Replace the site settings document. Body may be either {data:{...}} or the raw settings object.
    Recursively unwraps repeated {data:{...}} wrappings to defend against accidental round-tripping
    of the GET response straight back into PUT."""
    data = body
    # Unwrap until we hit the leaf object (max 10 hops as a safety cap)
    for _ in range(10):
        if isinstance(data, dict) and "data" in data and isinstance(data["data"], dict):
            # Heuristic: only unwrap if the inner dict looks like settings (no top-level known field outside it)
            inner_keys = set(data["data"].keys())
            # If the inner dict has its own "data" key, keep going; otherwise it's the leaf
            if "data" in inner_keys and isinstance(data["data"]["data"], dict):
                data = data["data"]
                continue
            data = data["data"]
            break
        break
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


@api.post("/admin/settings/repair")
async def admin_settings_repair(auth=Depends(require_owner)):
    """One-shot maintenance: unwrap any over-nested {data:{data:{...}}} that crept in due to the
    pre-fix accumulation bug."""
    doc = await db.settings.find_one({"_id": "site"}) or {}
    data = doc.get("data")
    hops = 0
    while isinstance(data, dict) and "data" in data and isinstance(data["data"], dict) and hops < 20:
        data = data["data"]
        hops += 1
    if hops == 0:
        return {"ok": True, "hops": 0, "note": "Already flat."}
    await db.settings.update_one({"_id": "site"}, {"$set": {"data": data, "updatedAt": now_iso()}}, upsert=True)
    return {"ok": True, "hops": hops}


# ============================================================
# Site overrides — the Wix-like visual editor backend
# ============================================================
# Every editable block on the public site has a key like "home.hero.title" or
# "footer.copyright". When the owner edits, we store the override here.
# The public /api/settings exposes them, the site reads them through SiteConfigContext.

class OverridePut(BaseModel):
    key: str = Field(min_length=1, max_length=120, pattern=r"^[a-zA-Z0-9_.-]+$")
    value: Any = None


@api.get("/admin/site-overrides")
async def admin_get_overrides(auth=Depends(require_perm("settings.read"))):
    doc = await db.settings.find_one({"_id": "site"}) or {}
    return {"overrides": (doc.get("data") or {}).get("site_overrides") or {}}


@api.put("/admin/site-overrides")
async def admin_put_override(body: OverridePut, auth=Depends(require_perm("settings.edit"))):
    doc = await db.settings.find_one({"_id": "site"}) or {}
    data = (doc.get("data") or {})
    overrides = data.get("site_overrides") or {}
    overrides[body.key] = body.value
    data["site_overrides"] = overrides
    await db.settings.update_one({"_id": "site"}, {"$set": {"data": data, "updatedAt": now_iso()}}, upsert=True)
    return {"ok": True, "key": body.key}


@api.delete("/admin/site-overrides/{key:path}")
async def admin_delete_override(key: str, auth=Depends(require_perm("settings.edit"))):
    doc = await db.settings.find_one({"_id": "site"}) or {}
    data = (doc.get("data") or {})
    overrides = data.get("site_overrides") or {}
    if key in overrides:
        del overrides[key]
        data["site_overrides"] = overrides
        await db.settings.update_one({"_id": "site"}, {"$set": {"data": data, "updatedAt": now_iso()}}, upsert=True)
    return {"ok": True}


# ============================================================
# Email test
# ============================================================
@api.post("/admin/email/test")
async def admin_email_test(body: EmailTestRequest, auth=Depends(require_perm("settings.edit"))):
    res = await send_test_email(body.to)
    return res


# ============================================================
# Admin products (CRUD) — with auto-translation
# ============================================================
@api.get("/admin/products")
async def admin_list_products(auth=Depends(require_perm("products.read"))):
    rows = await db.products.find({}).sort("createdAt", -1).to_list(None)
    for r in rows:
        r["id"] = str(r.pop("_id"))
    return {"products": rows, "count": len(rows)}


@api.post("/admin/products")
async def admin_create_product(body: ProductIn, auth=Depends(require_perm("products.edit"))):
    doc = body.model_dump()
    # Auto-translate if requested and no translations supplied
    if doc.get("autoTranslate") and not doc.get("translations") and llm_configured():
        try:
            doc["translations"] = await translate_fields(doc.get("name", ""), doc.get("desc", ""))
        except Exception as e:
            logger.warning("auto-translate failed: %s", e)
    doc["createdAt"] = now_iso()
    doc["updatedAt"] = now_iso()
    result = await db.products.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return {"ok": True, "product": doc}


@api.put("/admin/products/{pid}")
async def admin_update_product(pid: str, body: ProductIn, auth=Depends(require_perm("products.edit"))):
    from bson import ObjectId
    try:
        oid = ObjectId(pid)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid product id")
    patch = body.model_dump()
    if patch.get("autoTranslate") and not patch.get("translations") and llm_configured():
        try:
            patch["translations"] = await translate_fields(patch.get("name", ""), patch.get("desc", ""))
        except Exception as e:
            logger.warning("auto-translate failed: %s", e)
    patch["updatedAt"] = now_iso()
    result = await db.products.update_one({"_id": oid}, {"$set": patch})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"ok": True}


@api.delete("/admin/products/{pid}")
async def admin_delete_product(pid: str, auth=Depends(require_perm("products.delete"))):
    from bson import ObjectId
    try:
        oid = ObjectId(pid)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid product id")
    result = await db.products.delete_one({"_id": oid})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"ok": True}


@api.post("/admin/products/{pid}/translate")
async def admin_retranslate_product(pid: str, auth=Depends(require_perm("products.edit"))):
    from bson import ObjectId
    try:
        oid = ObjectId(pid)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid product id")
    doc = await db.products.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    if not llm_configured():
        raise HTTPException(status_code=400, detail="Translation engine not configured")
    tr = await translate_fields(doc.get("name", ""), doc.get("desc", ""))
    await db.products.update_one({"_id": oid}, {"$set": {"translations": tr, "updatedAt": now_iso()}})
    return {"ok": True, "translations": tr}


# ============================================================
# Admin categories (CRUD) — with auto-translation
# ============================================================
@api.get("/admin/categories")
async def admin_list_categories(auth=Depends(require_perm("categories.read"))):
    rows = await db.categories.find({}).sort("order", 1).to_list(None)
    for r in rows:
        r["id"] = str(r.pop("_id"))
    return {"categories": rows, "count": len(rows)}


@api.get("/categories")
async def public_list_categories():
    rows = await db.categories.find({}).sort("order", 1).to_list(None)
    for r in rows:
        r["id"] = str(r.pop("_id"))
    return {"categories": rows}


@api.post("/admin/categories")
async def admin_create_category(body: CategoryIn, auth=Depends(require_perm("categories.edit"))):
    doc = body.model_dump()
    if doc.get("autoTranslate") and not doc.get("translations") and llm_configured():
        try:
            doc["translations"] = await translate_fields(doc.get("name", ""), doc.get("description", ""))
        except Exception as e:
            logger.warning("auto-translate (category) failed: %s", e)
    doc["createdAt"] = now_iso()
    doc["updatedAt"] = now_iso()
    res = await db.categories.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    doc.pop("_id", None)
    return {"ok": True, "category": doc}


@api.put("/admin/categories/{cid}")
async def admin_update_category(cid: str, body: CategoryIn, auth=Depends(require_perm("categories.edit"))):
    from bson import ObjectId
    try:
        oid = ObjectId(cid)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id")
    patch = body.model_dump()
    if patch.get("autoTranslate") and not patch.get("translations") and llm_configured():
        try:
            patch["translations"] = await translate_fields(patch.get("name", ""), patch.get("description", ""))
        except Exception as e:
            logger.warning("auto-translate (category) failed: %s", e)
    patch["updatedAt"] = now_iso()
    r = await db.categories.update_one({"_id": oid}, {"$set": patch})
    if r.matched_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"ok": True}


@api.delete("/admin/categories/{cid}")
async def admin_delete_category(cid: str, auth=Depends(require_perm("categories.delete"))):
    from bson import ObjectId
    try:
        oid = ObjectId(cid)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id")
    r = await db.categories.delete_one({"_id": oid})
    if r.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"ok": True}


# ============================================================
# Team / RBAC — owner only
# ============================================================
@api.get("/admin/team")
async def admin_list_team(auth=Depends(require_perm("team.read"))):
    members = await list_team_members()
    return {
        "members": members,
        "permissionTemplates": DEFAULT_PERMISSIONS,
        "roles": ["admin", "member"],
    }


@api.post("/admin/team")
async def admin_create_team(body: TeamMemberIn, auth=Depends(require_owner)):
    member: Optional[dict] = None
    try:
        member = await create_team_member(body.email, body.name, body.role, body.password, body.permissions)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if member is None:
        raise HTTPException(status_code=500, detail="Failed to create member")
    # Welcome email (best effort)
    site_url = (await db.settings.find_one({"_id": "site"}) or {}).get("data", {}).get("primaryDomain") or "your team panel"
    try:
        await send_email(
            to=member["email"],
            subject="You've been invited to the Masterpiece Tools panel",
            html=(
                f"<div style='font-family:Arial;padding:20px'>"
                f"<h2 style='color:#FF6B1A'>Welcome, {member['name']}</h2>"
                f"<p>You now have <strong>{member['role']}</strong> access to the Masterpiece Tools owner panel.</p>"
                f"<p>Sign in at <strong>{site_url}/admin/login</strong> with this email and the temporary password you received from the owner. Please change it after first login.</p>"
                f"</div>"
            ),
        )
    except Exception as e:
        logger.warning("Welcome email failed for %s: %s", member["email"], e)
    return {"ok": True, "member": member}


@api.patch("/admin/team/{mid}")
async def admin_patch_team(mid: str, body: TeamMemberPatch, auth=Depends(require_owner)):
    ok = await update_team_member(
        mid,
        name=body.name, role=body.role, permissions=body.permissions,
        active=body.active, password=body.password,
    )
    if not ok:
        raise HTTPException(status_code=404, detail="Member not found")
    return {"ok": True}


@api.delete("/admin/team/{mid}")
async def admin_remove_team(mid: str, auth=Depends(require_owner)):
    ok = await delete_team_member(mid)
    if not ok:
        raise HTTPException(status_code=404, detail="Member not found")
    return {"ok": True}


# ============================================================
# Bulk / custom email blast
# ============================================================
@api.post("/admin/email/blast")
async def admin_email_blast(body: BulkEmailRequest, background: BackgroundTasks, auth=Depends(require_perm("customers.email"))):
    """Send a customizable email to many recipients (BCC each, optional template + attachments)."""
    html_body = body.html or ""
    text_body = body.text or ""
    # Substitute template if requested
    if body.templateId:
        from bson import ObjectId
        try:
            tpl = await db.email_templates.find_one({"_id": ObjectId(body.templateId)})
        except Exception:
            tpl = None
        if tpl:
            html_body = tpl.get("html") or html_body
    atts = [a.model_dump() for a in (body.attachments or [])]
    # Fire-and-forget so the UI returns immediately
    async def _do():
        sent, failed = 0, 0
        for r in body.recipients:
            res = await send_email(
                to=r, subject=body.subject, html=html_body, text=text_body or None,
                reply_to=await get_notify_email(), attachments=atts,
            )
            if res.get("ok"):
                sent += 1
            else:
                failed += 1
            await db.customer_emails.insert_one({
                "to": r, "subject": body.subject, "by": auth["sub"], "at": now_iso(),
                "mode": res.get("mode"), "ok": res.get("ok"), "blast": True,
                "attachmentCount": len(atts),
            })
        logger.info("Bulk email finished: %d sent, %d failed", sent, failed)
    background.add_task(_do)
    return {"ok": True, "queued": len(body.recipients), "mode": ("smtp" if await email_configured() else "mock")}


@api.get("/admin/email/history")
async def admin_email_history(auth=Depends(require_perm("customers.email")), limit: int = 100):
    rows = await db.customer_emails.find({}).sort("at", -1).limit(min(max(limit, 1), 500)).to_list(None)
    for r in rows:
        r["id"] = str(r.pop("_id"))
    return {"history": rows, "count": len(rows)}


# ============================================================
# Email templates
# ============================================================
@api.get("/admin/email/templates")
async def admin_list_email_templates(auth=Depends(require_perm("templates.read"))):
    rows = await db.email_templates.find({}).sort("name", 1).to_list(None)
    for r in rows:
        r["id"] = str(r.pop("_id"))
    return {"templates": rows, "count": len(rows)}


@api.post("/admin/email/templates")
async def admin_create_email_template(body: EmailTemplateIn, auth=Depends(require_perm("templates.edit"))):
    doc = body.model_dump()
    doc["createdAt"] = now_iso()
    doc["updatedAt"] = now_iso()
    res = await db.email_templates.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    doc.pop("_id", None)
    return {"ok": True, "template": doc}


@api.put("/admin/email/templates/{tid}")
async def admin_update_email_template(tid: str, body: EmailTemplateIn, auth=Depends(require_perm("templates.edit"))):
    from bson import ObjectId
    try:
        oid = ObjectId(tid)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id")
    patch = body.model_dump()
    patch["updatedAt"] = now_iso()
    r = await db.email_templates.update_one({"_id": oid}, {"$set": patch})
    if r.matched_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"ok": True}


@api.delete("/admin/email/templates/{tid}")
async def admin_delete_email_template(tid: str, auth=Depends(require_perm("templates.edit"))):
    from bson import ObjectId
    try:
        oid = ObjectId(tid)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id")
    r = await db.email_templates.delete_one({"_id": oid})
    if r.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Template not found")
    return {"ok": True}


# ============================================================
# AI Assistant (Masterpiece Studio AI) — conversations + memory + undo
# ============================================================
class AiAttachment(BaseModel):
    name: str
    type: Optional[str] = ""
    size: int = 0
    data: str = ""  # data: URL or raw base64


class AiSendMessage(BaseModel):
    message: str = Field(min_length=1, max_length=8000)
    attachments: List[AiAttachment] = []


class AiEditMessage(BaseModel):
    message: str = Field(min_length=1, max_length=8000)
    attachments: List[AiAttachment] = []


class AiConversationRename(BaseModel):
    title: str = Field(min_length=1, max_length=120)


async def _ai_owner_perms(auth: dict) -> Dict[str, bool]:
    """Return permission dict from JWT (owner gets EVERYTHING by default)."""
    perms = auth.get("perm") or {}
    if auth.get("role") == "owner":
        return {k: True for k in [
            "quotes.edit", "quotes.reply", "quotes.delete",
            "products.edit", "products.delete",
            "categories.edit", "categories.delete",
            "settings.edit",
            "customers.email",
        ]}
    return perms


async def _ai_caller(auth: dict) -> Dict[str, Any]:
    user = await get_user_record(auth["sub"])
    return {
        "email": auth["sub"],
        "name": (user or {}).get("name") or auth.get("sub"),
        "role": auth.get("role") or "owner",
        "permissions": await _ai_owner_perms(auth),
    }


async def _ai_site_summary() -> Dict[str, Any]:
    settings_doc = await db.settings.find_one({"_id": "site"}) or {}
    settings_data = (settings_doc.get("data") or {})
    settings_data.pop("smtpPassword", None)
    quotes_total = await db.quotes.count_documents({})
    quotes_open = await db.quotes.count_documents({"status": {"$in": ["new", "in-progress"]}})
    products = await db.products.find({}, {"name": 1, "slug": 1, "category": 1}).limit(50).to_list(None)
    for p in products:
        p["id"] = str(p.pop("_id"))
    cats = await db.categories.find({}).to_list(None)
    for c in cats:
        c["id"] = str(c.pop("_id"))
    return {
        "settings": settings_data,
        "stats": {
            "quotes_total": quotes_total,
            "quotes_open": quotes_open,
            "products_total": len(products),
            "categories_total": len(cats),
        },
        "products_sample": products[:20],
        "categories": cats,
    }


def _conv_history(messages: List[dict]) -> List[Dict[str, Any]]:
    """Flatten messages → [{role, content}] for the AI prompt."""
    out = []
    for m in messages or []:
        if m.get("role") == "user":
            out.append({"role": "user", "content": m.get("content") or ""})
        else:
            out.append({"role": "assistant", "content": m.get("content") or ""})
    return out


@api.get("/admin/ai/conversations")
async def ai_list_conversations(auth=Depends(require_user)):
    rows = await db.ai_conversations.find({"by": auth["sub"]}, {"messages": 0}).sort("updatedAt", -1).to_list(None)
    out = []
    for r in rows:
        r["id"] = str(r.pop("_id"))
        out.append(r)
    return {"conversations": out, "count": len(out)}


@api.post("/admin/ai/conversations")
async def ai_create_conversation(auth=Depends(require_user)):
    doc = {
        "by": auth["sub"],
        "title": "New chat",
        "messages": [],
        "createdAt": now_iso(),
        "updatedAt": now_iso(),
    }
    res = await db.ai_conversations.insert_one(doc)
    doc["id"] = str(res.inserted_id)
    doc.pop("_id", None)
    return doc


@api.get("/admin/ai/conversations/{cid}")
async def ai_get_conversation(cid: str, auth=Depends(require_user)):
    from bson import ObjectId
    try:
        oid = ObjectId(cid)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id")
    doc = await db.ai_conversations.find_one({"_id": oid, "by": auth["sub"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    doc["id"] = str(doc.pop("_id"))
    return doc


@api.patch("/admin/ai/conversations/{cid}")
async def ai_rename_conversation(cid: str, body: AiConversationRename, auth=Depends(require_user)):
    from bson import ObjectId
    try:
        oid = ObjectId(cid)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id")
    res = await db.ai_conversations.update_one(
        {"_id": oid, "by": auth["sub"]},
        {"$set": {"title": body.title, "updatedAt": now_iso()}},
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


@api.delete("/admin/ai/conversations/{cid}")
async def ai_delete_conversation(cid: str, auth=Depends(require_user)):
    from bson import ObjectId
    try:
        oid = ObjectId(cid)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id")
    res = await db.ai_conversations.delete_one({"_id": oid, "by": auth["sub"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


async def _ai_send(*, conversation_id: str, auth: dict, message: str, attachments: Optional[List[AiAttachment]] = None, drop_after_index: Optional[int] = None) -> dict:
    """Append user message, run the AI, append assistant response, persist + log actions."""
    from bson import ObjectId
    try:
        oid = ObjectId(conversation_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid conversation id")
    convo = await db.ai_conversations.find_one({"_id": oid, "by": auth["sub"]})
    if not convo:
        raise HTTPException(status_code=404, detail="Conversation not found")

    msgs: List[dict] = convo.get("messages") or []
    if drop_after_index is not None:
        msgs = msgs[: drop_after_index]

    # Extract attachment text for the AI + sanitize (no raw base64 stored in message context)
    enriched_atts = []
    stored_atts = []
    for att in (attachments or []):
        text = extract_attachment_text(att.name, att.type, att.data)
        enriched_atts.append({
            "name": att.name, "type": att.type, "size": att.size, "text": text,
        })
        stored_atts.append({
            "name": att.name, "type": att.type, "size": att.size,
            "hasText": bool(text), "preview": (text or "")[:240],
        })

    user_msg = {
        "id": new_uuid(), "role": "user", "content": message,
        "attachments": stored_atts, "at": now_iso(),
    }
    msgs.append(user_msg)

    caller = await _ai_caller(auth)
    site_summary = await _ai_site_summary()

    async def _send(*, to, subject, html, text=None):
        return await send_email(to=to, subject=subject, html=html, text=text, reply_to=await get_notify_email())

    result = await run_assistant(
        db=db,
        user_message=message,
        history=_conv_history(msgs[:-1]),
        permissions=caller["permissions"],
        send_email_fn=_send,
        by_email=caller["email"],
        by_name=caller["name"],
        role=caller["role"],
        site_summary=site_summary,
        session_id=f"mpt-ai-{conversation_id}",
        attachments=enriched_atts,
    )

    # Persist any actions to a separate audit collection so we can undo them later.
    action_records = []
    for a in result.get("actions") or []:
        rec = {
            "by": caller["email"],
            "at": now_iso(),
            "conversationId": conversation_id,
            "tool": a.get("tool"),
            "args": a.get("args"),
            "result": a.get("result"),
            "undone": False,
        }
        ins = await db.ai_actions.insert_one(rec)
        rec["id"] = str(ins.inserted_id)
        rec.pop("_id", None)
        # Don't persist huge snapshots in the message itself; keep the recipe though.
        action_records.append({
            "id": rec["id"],
            "tool": rec["tool"],
            "args": rec["args"],
            "result": rec["result"],
            "undone": False,
            "undoable": bool(((rec.get("result") or {}).get("_undo"))),
        })

    assistant_msg = {
        "id": new_uuid(),
        "role": "assistant",
        "content": result.get("reply") or "",
        "actions": action_records,
        "at": now_iso(),
    }
    msgs.append(assistant_msg)

    # Auto-title from first user message
    title = convo.get("title") or "New chat"
    if title == "New chat" and message:
        title = (message[:60] + ("…" if len(message) > 60 else "")).strip()

    await db.ai_conversations.update_one(
        {"_id": oid},
        {"$set": {"messages": msgs, "updatedAt": now_iso(), "title": title}},
    )

    return {
        "ok": True,
        "conversationId": conversation_id,
        "userMessage": user_msg,
        "assistantMessage": assistant_msg,
    }


@api.post("/admin/ai/conversations/{cid}/messages")
async def ai_send_message(cid: str, body: AiSendMessage, auth=Depends(require_user)):
    return await _ai_send(conversation_id=cid, auth=auth, message=body.message, attachments=body.attachments)


@api.patch("/admin/ai/conversations/{cid}/messages/{message_id}")
async def ai_edit_message(cid: str, message_id: str, body: AiEditMessage, auth=Depends(require_user)):
    """Edit a previous USER message and re-run the AI from that point."""
    from bson import ObjectId
    try:
        oid = ObjectId(cid)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id")
    convo = await db.ai_conversations.find_one({"_id": oid, "by": auth["sub"]})
    if not convo:
        raise HTTPException(status_code=404, detail="Conversation not found")
    msgs = convo.get("messages") or []
    idx = next((i for i, m in enumerate(msgs) if m.get("id") == message_id and m.get("role") == "user"), None)
    if idx is None:
        raise HTTPException(status_code=404, detail="User message not found")
    return await _ai_send(conversation_id=cid, auth=auth, message=body.message, attachments=body.attachments, drop_after_index=idx)


@api.post("/admin/ai/actions/{aid}/undo")
async def ai_undo_action(aid: str, auth=Depends(require_user)):
    from bson import ObjectId
    try:
        oid = ObjectId(aid)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id")
    rec = await db.ai_actions.find_one({"_id": oid})
    if not rec or rec.get("by") != auth["sub"]:
        raise HTTPException(status_code=404, detail="Action not found")
    if rec.get("undone"):
        return {"ok": False, "error": "Already undone"}
    undo = (rec.get("result") or {}).get("_undo")
    if not undo:
        raise HTTPException(status_code=400, detail="Action is not undoable")

    caller = await _ai_caller(auth)

    async def _send(*, to, subject, html, text=None):
        return await send_email(to=to, subject=subject, html=html, text=text, reply_to=await get_notify_email())

    res = await execute_undo(db, undo, caller["permissions"], _send, caller["email"])
    if res.get("ok"):
        await db.ai_actions.update_one({"_id": oid}, {"$set": {"undone": True, "undoneAt": now_iso(), "undoResult": res}})
        # Mirror "undone" flag inside the conversation message (safe — only matches messages that have the action)
        try:
            await db.ai_conversations.update_one(
                {"by": auth["sub"], "messages": {"$elemMatch": {"actions.id": str(oid)}}},
                {"$set": {"messages.$[m].actions.$[a].undone": True}},
                array_filters=[
                    {"m.actions.id": str(oid)},
                    {"a.id": str(oid)},
                ],
            )
        except Exception as e:
            logger.warning("Could not mirror undone flag into conversation: %s", e)
    return res


# ---------- AI documents ----------
@api.get("/admin/ai/documents")
async def ai_list_documents(auth=Depends(require_user), limit: int = 100):
    rows = await db.documents.find({}).sort("createdAt", -1).limit(min(max(limit, 1), 500)).to_list(None)
    for r in rows:
        r["id"] = str(r.pop("_id"))
    return {"documents": rows, "count": len(rows)}


@api.get("/admin/ai/documents/{did}")
async def ai_get_document(did: str, auth=Depends(require_user)):
    from bson import ObjectId
    try:
        oid = ObjectId(did)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id")
    doc = await db.documents.find_one({"_id": oid})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    doc["id"] = str(doc.pop("_id"))
    return doc


@api.delete("/admin/ai/documents/{did}")
async def ai_delete_document(did: str, auth=Depends(require_user)):
    from bson import ObjectId
    try:
        oid = ObjectId(did)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid id")
    res = await db.documents.delete_one({"_id": oid})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


# ============================================================
# Website importer
# ============================================================
class CrawlRequest(BaseModel):
    url: str = Field(min_length=4, max_length=500)
    max_pages: int = Field(default=6, ge=1, le=25)
    same_domain: bool = True


class ImportItem(BaseModel):
    """A single item the user wants to bring into the catalog/docs from a crawl."""
    type: str = Field(pattern="^(product|document|note)$")
    # For product
    slug: Optional[str] = ""
    name: Optional[str] = ""
    desc: Optional[str] = ""
    image: Optional[str] = ""
    category: Optional[str] = "precision-gauges"
    # For document
    title: Optional[str] = ""
    content: Optional[str] = ""
    sourceUrl: Optional[str] = ""
    autoTranslate: bool = True


class WebImportRequest(BaseModel):
    items: List[ImportItem] = Field(min_length=1, max_length=200)


@api.post("/admin/web/crawl")
async def admin_web_crawl(body: CrawlRequest, auth=Depends(require_user)):
    """Crawl a URL + same-domain links. Owner / team can preview, then choose what to import."""
    try:
        pages = await crawl_site(body.url, max_pages=body.max_pages, same_domain_only=body.same_domain)
        return {"ok": True, "url": body.url, "pages": pages, "count": len(pages)}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@api.post("/admin/web/import")
async def admin_web_import(body: WebImportRequest, auth=Depends(require_user)):
    """Persist the items the user picked from a crawl preview into products / documents."""
    created_products: List[dict] = []
    created_docs: List[dict] = []
    for it in body.items:
        if it.type == "product":
            if not it.name:
                continue
            slug = (it.slug or re.sub(r"[^a-z0-9]+", "-", it.name.lower())[:60].strip("-")) or new_uuid()[:10]
            doc = {
                "slug": slug,
                "name": it.name.strip(),
                "desc": it.desc or "",
                "category": it.category or "precision-gauges",
                "subcategory": "",
                "image": it.image or "",
                "specSheet": "",
                "specSheetName": "",
                "specs": {},
                "features": [],
                "leadTime": "2-4 weeks",
                "badge": "precision",
                "sourceUrl": it.sourceUrl or "",
                "createdAt": now_iso(),
                "updatedAt": now_iso(),
            }
            if it.autoTranslate and llm_configured():
                try:
                    doc["translations"] = await translate_fields(doc["name"], doc.get("desc") or "")
                except Exception:
                    pass
            r = await db.products.insert_one(doc)
            created_products.append({"id": str(r.inserted_id), "name": doc["name"], "slug": slug})
        elif it.type in ("document", "note"):
            doc = {
                "title": it.title or it.name or "Imported note",
                "type": "markdown",
                "content": it.content or it.desc or "",
                "sourceUrl": it.sourceUrl or "",
                "createdBy": auth["sub"],
                "createdAt": now_iso(),
            }
            r = await db.documents.insert_one(doc)
            created_docs.append({"id": str(r.inserted_id), "title": doc["title"]})
    return {"ok": True, "products": created_products, "documents": created_docs}


# Legacy single-shot endpoint kept for the smoke test we already wrote
class AiChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=4000)
    history: List[Dict[str, str]] = Field(default_factory=list)


@api.post("/admin/ai/chat")
async def admin_ai_chat(body: AiChatRequest, auth=Depends(require_user)):
    """One-off (stateless) chat — used for legacy/smoke testing."""
    caller = await _ai_caller(auth)

    async def _send(*, to, subject, html, text=None):
        return await send_email(to=to, subject=subject, html=html, text=text, reply_to=await get_notify_email())

    result = await run_assistant(
        db=db,
        user_message=body.message,
        history=body.history or [],
        permissions=caller["permissions"],
        send_email_fn=_send,
        by_email=caller["email"],
        by_name=caller["name"],
        role=caller["role"],
        site_summary=await _ai_site_summary(),
        session_id=f"mpt-ai-legacy-{auth['sub']}",
    )
    return result


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
