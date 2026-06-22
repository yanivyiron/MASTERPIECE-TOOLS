"""Masterpiece Studio AI — the in-panel assistant.

Capabilities
------------
- General Q&A (the AI is also a smart conversational helper, not just a tool-runner).
- Caller-aware: knows the user's name, role, and exact permission set.
- Tool-use loop (up to 4 hops per turn).
- Persistent threads / memory handled by server.py (conversations + messages collections).
- Every mutating tool returns a `_undo` recipe so changes can be reversed.
- Document creation (saved in MongoDB, downloadable from frontend).
- Web fetch & import (pull product info from a URL, summarise an article, etc.).
"""
from __future__ import annotations

import base64
import json
import logging
import os
import re
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse

import httpx
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from translate_service import translate_fields, llm_configured

logger = logging.getLogger(__name__)

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY", "")
MODEL_PROVIDER = "anthropic"
MODEL_NAME = "claude-sonnet-4-6"

# ------------------------------------------------------------
# Whitelists
# ------------------------------------------------------------
ALLOWED_SETTINGS_KEYS = {
    "companyName", "companyTagline", "companyAddress",
    "logoText", "contactEmail", "contactPhone", "notifyEmail",
    "whatsappEnabled", "whatsappNumber",
    "linkedinUrl", "websiteUrl",
    "defaultLanguage", "rfqResponseTime", "certifications",
    "allowedCountries",
    "primaryDomain", "seoTitle", "seoDescription",
    "fromEmail", "fromName",
    "notifyOnNewQuote", "notifyOnReply",
}

EDITABLE_PRODUCT_FIELDS = (
    "name", "slug", "desc", "category", "subcategory", "image", "specSheet", "specSheetName",
    "specs", "features", "leadTime", "badge", "translations",
)
EDITABLE_CATEGORY_FIELDS = ("name", "slug", "description", "image", "icon", "order", "translations")


def _now_iso() -> str:
    from datetime import datetime, timezone
    return datetime.now(timezone.utc).isoformat()


def _strip_html(html: str, max_len: int = 12000) -> str:
    """Very basic HTML → text conversion for AI consumption."""
    text = re.sub(r"<script[\s\S]*?</script>", " ", html or "", flags=re.I)
    text = re.sub(r"<style[\s\S]*?</style>", " ", text, flags=re.I)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text[:max_len]


# ============================================================
# Tool implementations
# ============================================================
async def tool_get_settings(db: AsyncIOMotorDatabase, args: Dict[str, Any], **_) -> Dict[str, Any]:
    doc = await db.settings.find_one({"_id": "site"}) or {}
    data = (doc.get("data") or {})
    data.pop("smtpPassword", None)
    return {"ok": True, "data": data}


async def tool_update_settings(db: AsyncIOMotorDatabase, args: Dict[str, Any], *, can_edit: bool, **_) -> Dict[str, Any]:
    if not can_edit:
        return {"ok": False, "error": "Missing permission settings.edit"}
    patch = args.get("patch") or {}
    if not isinstance(patch, dict) or not patch:
        return {"ok": False, "error": "patch must be a non-empty object"}
    safe = {k: v for k, v in patch.items() if k in ALLOWED_SETTINGS_KEYS}
    rejected = [k for k in patch.keys() if k not in ALLOWED_SETTINGS_KEYS]
    if not safe:
        return {"ok": False, "error": f"No allowed settings keys in patch. Rejected: {rejected}"}
    doc = await db.settings.find_one({"_id": "site"}) or {}
    data = (doc.get("data") or {})
    before = {k: data.get(k) for k in safe.keys()}
    data.update(safe)
    await db.settings.update_one({"_id": "site"}, {"$set": {"data": data, "updatedAt": _now_iso()}}, upsert=True)
    return {"ok": True, "applied": safe, "rejected": rejected,
            "_undo": {"tool": "update_settings", "args": {"patch": before}}}


async def tool_list_products(db: AsyncIOMotorDatabase, args: Dict[str, Any], **_) -> Dict[str, Any]:
    q = args.get("query") or ""
    rows = await db.products.find({}).sort("createdAt", -1).limit(int(args.get("limit", 50))).to_list(None)
    out = []
    for r in rows:
        r["id"] = str(r.pop("_id"))
        haystack = (r.get("name", "") + " " + r.get("slug", "") + " " + (r.get("desc") or "")).lower()
        if not q or q.lower() in haystack:
            out.append({k: r.get(k) for k in ("id", "name", "slug", "category", "badge", "leadTime")})
    return {"ok": True, "products": out, "count": len(out)}


async def tool_create_product(db: AsyncIOMotorDatabase, args: Dict[str, Any], *, can_edit: bool, **_) -> Dict[str, Any]:
    if not can_edit:
        return {"ok": False, "error": "Missing permission products.edit"}
    p = args.get("product") or {}
    if not p.get("name") or not p.get("slug"):
        return {"ok": False, "error": "product.name and product.slug are required"}
    doc = {
        "slug": str(p["slug"]).strip(),
        "name": str(p["name"]).strip(),
        "desc": p.get("desc", ""),
        "category": p.get("category", "precision-gauges"),
        "subcategory": p.get("subcategory", ""),
        "image": p.get("image", ""),
        "specSheet": p.get("specSheet", ""),
        "specSheetName": p.get("specSheetName", ""),
        "specs": p.get("specs", {}),
        "features": p.get("features", []),
        "leadTime": p.get("leadTime", "2-4 weeks"),
        "badge": p.get("badge", "precision"),
        "createdAt": _now_iso(),
        "updatedAt": _now_iso(),
    }
    if p.get("autoTranslate", True) and llm_configured():
        try:
            doc["translations"] = await translate_fields(doc["name"], doc.get("desc") or "")
        except Exception as e:
            logger.warning("auto-translate failed: %s", e)
    res = await db.products.insert_one(doc)
    pid = str(res.inserted_id)
    return {"ok": True, "id": pid, "name": doc["name"],
            "_undo": {"tool": "delete_product", "args": {"id": pid}}}


async def tool_update_product(db: AsyncIOMotorDatabase, args: Dict[str, Any], *, can_edit: bool, **_) -> Dict[str, Any]:
    if not can_edit:
        return {"ok": False, "error": "Missing permission products.edit"}
    pid = args.get("id")
    patch = args.get("patch") or {}
    if not pid or not patch:
        return {"ok": False, "error": "id and patch are required"}
    try:
        oid = ObjectId(pid)
    except Exception:
        return {"ok": False, "error": "Invalid product id"}
    safe = {k: v for k, v in patch.items() if k in EDITABLE_PRODUCT_FIELDS}
    if not safe:
        return {"ok": False, "error": "No editable fields in patch"}
    before = await db.products.find_one({"_id": oid})
    if not before:
        return {"ok": False, "error": "Product not found"}
    prior = {k: before.get(k) for k in safe.keys()}
    safe["updatedAt"] = _now_iso()
    res = await db.products.update_one({"_id": oid}, {"$set": safe})
    return {"ok": res.matched_count > 0, "matched": res.matched_count,
            "_undo": {"tool": "update_product", "args": {"id": pid, "patch": prior}}}


async def tool_delete_product(db: AsyncIOMotorDatabase, args: Dict[str, Any], *, can_delete: bool, **_) -> Dict[str, Any]:
    if not can_delete:
        return {"ok": False, "error": "Missing permission products.delete"}
    pid = args.get("id")
    try:
        oid = ObjectId(pid)
    except Exception:
        return {"ok": False, "error": "Invalid product id"}
    snap = await db.products.find_one({"_id": oid})
    if not snap:
        return {"ok": False, "error": "Product not found"}
    snap.pop("_id", None)
    await db.products.delete_one({"_id": oid})
    return {"ok": True, "_undo": {"tool": "_restore_product", "args": {"snapshot": snap}}}


async def tool_retranslate_product(db: AsyncIOMotorDatabase, args: Dict[str, Any], *, can_edit: bool, **_) -> Dict[str, Any]:
    if not can_edit:
        return {"ok": False, "error": "Missing permission products.edit"}
    pid = args.get("id")
    try:
        oid = ObjectId(pid)
    except Exception:
        return {"ok": False, "error": "Invalid product id"}
    doc = await db.products.find_one({"_id": oid})
    if not doc:
        return {"ok": False, "error": "Product not found"}
    if not llm_configured():
        return {"ok": False, "error": "Translation engine not configured"}
    prior = doc.get("translations")
    tr = await translate_fields(doc.get("name", ""), doc.get("desc", ""))
    await db.products.update_one({"_id": oid}, {"$set": {"translations": tr, "updatedAt": _now_iso()}})
    return {"ok": True, "translations": tr,
            "_undo": {"tool": "update_product", "args": {"id": pid, "patch": {"translations": prior or {}}}}}


async def tool_list_categories(db: AsyncIOMotorDatabase, args: Dict[str, Any], **_) -> Dict[str, Any]:
    rows = await db.categories.find({}).sort("order", 1).to_list(None)
    out = []
    for r in rows:
        r["id"] = str(r.pop("_id"))
        out.append({k: r.get(k) for k in ("id", "slug", "name", "description", "order")})
    return {"ok": True, "categories": out, "count": len(out)}


async def tool_create_category(db: AsyncIOMotorDatabase, args: Dict[str, Any], *, can_edit: bool, **_) -> Dict[str, Any]:
    if not can_edit:
        return {"ok": False, "error": "Missing permission categories.edit"}
    c = args.get("category") or {}
    if not c.get("name") or not c.get("slug"):
        return {"ok": False, "error": "category.name and category.slug are required"}
    doc = {
        "slug": str(c["slug"]).strip(),
        "name": str(c["name"]).strip(),
        "description": c.get("description", ""),
        "image": c.get("image", ""),
        "icon": c.get("icon", ""),
        "order": int(c.get("order", 0)),
        "createdAt": _now_iso(),
        "updatedAt": _now_iso(),
    }
    if c.get("autoTranslate", True) and llm_configured():
        try:
            doc["translations"] = await translate_fields(doc["name"], doc.get("description") or "")
        except Exception as e:
            logger.warning("auto-translate failed: %s", e)
    res = await db.categories.insert_one(doc)
    cid = str(res.inserted_id)
    return {"ok": True, "id": cid, "name": doc["name"],
            "_undo": {"tool": "delete_category", "args": {"id": cid}}}


async def tool_update_category(db: AsyncIOMotorDatabase, args: Dict[str, Any], *, can_edit: bool, **_) -> Dict[str, Any]:
    if not can_edit:
        return {"ok": False, "error": "Missing permission categories.edit"}
    cid = args.get("id")
    patch = args.get("patch") or {}
    try:
        oid = ObjectId(cid)
    except Exception:
        return {"ok": False, "error": "Invalid id"}
    safe = {k: v for k, v in patch.items() if k in EDITABLE_CATEGORY_FIELDS}
    if not safe:
        return {"ok": False, "error": "No editable fields"}
    before = await db.categories.find_one({"_id": oid})
    if not before:
        return {"ok": False, "error": "Category not found"}
    prior = {k: before.get(k) for k in safe.keys()}
    safe["updatedAt"] = _now_iso()
    await db.categories.update_one({"_id": oid}, {"$set": safe})
    return {"ok": True, "_undo": {"tool": "update_category", "args": {"id": cid, "patch": prior}}}


async def tool_delete_category(db: AsyncIOMotorDatabase, args: Dict[str, Any], *, can_delete: bool, **_) -> Dict[str, Any]:
    if not can_delete:
        return {"ok": False, "error": "Missing permission categories.delete"}
    cid = args.get("id")
    try:
        oid = ObjectId(cid)
    except Exception:
        return {"ok": False, "error": "Invalid id"}
    snap = await db.categories.find_one({"_id": oid})
    if not snap:
        return {"ok": False, "error": "Category not found"}
    snap.pop("_id", None)
    await db.categories.delete_one({"_id": oid})
    return {"ok": True, "_undo": {"tool": "_restore_category", "args": {"snapshot": snap}}}


async def tool_list_quotes(db: AsyncIOMotorDatabase, args: Dict[str, Any], **_) -> Dict[str, Any]:
    q = {}
    if args.get("status"):
        q["status"] = args["status"]
    rows = await db.quotes.find(q).sort("createdAt", -1).limit(int(args.get("limit", 25))).to_list(None)
    out = []
    for r in rows:
        r.pop("_id", None)
        out.append({k: r.get(k) for k in ("qid", "firstName", "lastName", "company", "email", "country", "status", "createdAt")})
    return {"ok": True, "quotes": out, "count": len(out)}


async def tool_update_quote(db: AsyncIOMotorDatabase, args: Dict[str, Any], *, can_edit: bool, **_) -> Dict[str, Any]:
    if not can_edit:
        return {"ok": False, "error": "Missing permission quotes.edit"}
    qid = args.get("qid")
    patch = args.get("patch") or {}
    safe = {k: patch[k] for k in ("status", "adminNotes") if k in patch}
    if not qid or not safe:
        return {"ok": False, "error": "qid and patch (status/adminNotes) are required"}
    before = await db.quotes.find_one({"qid": qid})
    if not before:
        return {"ok": False, "error": "Quote not found"}
    prior = {k: before.get(k) for k in safe.keys()}
    safe["updatedAt"] = _now_iso()
    await db.quotes.update_one({"qid": qid}, {"$set": safe})
    return {"ok": True, "_undo": {"tool": "update_quote", "args": {"qid": qid, "patch": prior}}}


async def tool_reply_quote(db: AsyncIOMotorDatabase, args: Dict[str, Any], *, can_reply: bool, send_email_fn, by_email: str, **_) -> Dict[str, Any]:
    if not can_reply:
        return {"ok": False, "error": "Missing permission quotes.reply"}
    qid = args.get("qid")
    msg = (args.get("message") or "").strip()
    subject = args.get("subject")
    if not qid or not msg:
        return {"ok": False, "error": "qid and message are required"}
    doc = await db.quotes.find_one({"qid": qid})
    if not doc:
        return {"ok": False, "error": "Quote not found"}
    if not subject:
        subject = f"Re: your Masterpiece quote {qid}"
    html = f"<div style='font-family:Arial;line-height:1.6'>{msg}</div>"
    res = await send_email_fn(to=doc["email"], subject=subject, html=html)
    await db.quotes.update_one(
        {"qid": qid},
        {"$set": {"status": "replied", "updatedAt": _now_iso()},
         "$push": {"replies": {"at": _now_iso(), "by": by_email, "subject": subject, "message": msg, "mode": res.get("mode"), "via": "ai"}}},
    )
    return {"ok": True, "mode": res.get("mode"), "to": doc["email"]}


async def tool_send_email(db: AsyncIOMotorDatabase, args: Dict[str, Any], *, can_email: bool, send_email_fn, by_email: str, **_) -> Dict[str, Any]:
    if not can_email:
        return {"ok": False, "error": "Missing permission customers.email"}
    to = (args.get("to") or "").strip()
    subject = (args.get("subject") or "").strip()
    html = args.get("html") or ""
    text = args.get("text") or ""
    if not to or not subject or not (html or text):
        return {"ok": False, "error": "to, subject and html/text are required"}
    res = await send_email_fn(to=to, subject=subject, html=html or None, text=text or None)
    await db.customer_emails.insert_one({
        "to": to, "subject": subject, "by": by_email, "at": _now_iso(),
        "mode": res.get("mode"), "ok": res.get("ok"), "via": "ai-assistant",
    })
    return {"ok": True, "mode": res.get("mode"), "to": to}


# ---- Documents ----
async def tool_create_document(db: AsyncIOMotorDatabase, args: Dict[str, Any], *, by_email: str, **_) -> Dict[str, Any]:
    title = (args.get("title") or "").strip()
    content = args.get("content") or ""
    kind = (args.get("type") or "markdown").strip().lower()
    if not title or not content:
        return {"ok": False, "error": "title and content are required"}
    doc = {
        "title": title,
        "type": kind,
        "content": content,
        "createdBy": by_email,
        "createdAt": _now_iso(),
    }
    res = await db.documents.insert_one(doc)
    did = str(res.inserted_id)
    return {"ok": True, "id": did, "title": title,
            "_undo": {"tool": "delete_document", "args": {"id": did}}}


async def tool_list_documents(db: AsyncIOMotorDatabase, args: Dict[str, Any], **_) -> Dict[str, Any]:
    q = (args.get("query") or "").lower()
    rows = await db.documents.find({}).sort("createdAt", -1).limit(int(args.get("limit", 30))).to_list(None)
    out = []
    for r in rows:
        r["id"] = str(r.pop("_id"))
        if not q or q in (r.get("title", "")).lower():
            out.append({k: r.get(k) for k in ("id", "title", "type", "createdAt", "createdBy")})
    return {"ok": True, "documents": out, "count": len(out)}


async def tool_delete_document(db: AsyncIOMotorDatabase, args: Dict[str, Any], **_) -> Dict[str, Any]:
    try:
        oid = ObjectId(args.get("id"))
    except Exception:
        return {"ok": False, "error": "Invalid id"}
    snap = await db.documents.find_one({"_id": oid})
    if not snap:
        return {"ok": False, "error": "Not found"}
    snap.pop("_id", None)
    await db.documents.delete_one({"_id": oid})
    return {"ok": True, "_undo": {"tool": "_restore_document", "args": {"snapshot": snap}}}


# ---- Web fetch / search ----
async def tool_fetch_url(_db, args: Dict[str, Any], **_) -> Dict[str, Any]:
    url = (args.get("url") or "").strip()
    if not url:
        return {"ok": False, "error": "url is required"}
    try:
        parsed = urlparse(url)
        if parsed.scheme not in ("http", "https"):
            return {"ok": False, "error": "Only http(s) URLs allowed"}
        async with httpx.AsyncClient(timeout=25.0, follow_redirects=True, headers={"User-Agent": "MasterpieceAI/1.0"}) as c:
            r = await c.get(url)
        text = _strip_html(r.text or "")
        return {
            "ok": True, "url": url, "status": r.status_code,
            "contentType": r.headers.get("content-type", ""),
            "title": (re.search(r"<title>([^<]+)</title>", r.text or "", re.I) or [None, ""])[1].strip()[:200],
            "text": text,
        }
    except Exception as e:
        return {"ok": False, "error": str(e)}


async def tool_search_web(_db, args: Dict[str, Any], **_) -> Dict[str, Any]:
    """Lightweight web search via DuckDuckGo's HTML endpoint. Returns top 5 results."""
    query = (args.get("query") or "").strip()
    if not query:
        return {"ok": False, "error": "query is required"}
    try:
        async with httpx.AsyncClient(timeout=20.0, follow_redirects=True, headers={"User-Agent": "Mozilla/5.0 MasterpieceAI/1.0"}) as c:
            r = await c.get("https://duckduckgo.com/html/", params={"q": query})
        html = r.text or ""
        # Extract result links
        results = []
        for m in re.finditer(r'<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([^<]+)</a>', html):
            url = m.group(1)
            title = re.sub(r"<[^>]+>", "", m.group(2)).strip()
            # DuckDuckGo wraps real URL inside `uddg=` param
            mm = re.search(r"uddg=([^&]+)", url)
            if mm:
                try:
                    from urllib.parse import unquote
                    url = unquote(mm.group(1))
                except Exception:
                    pass
            results.append({"title": title, "url": url})
            if len(results) >= 5:
                break
        return {"ok": True, "query": query, "results": results}
    except Exception as e:
        return {"ok": False, "error": str(e)}


# ---- Internal restore tools used by undo ----
async def tool_restore_product(db: AsyncIOMotorDatabase, args: Dict[str, Any], **_) -> Dict[str, Any]:
    snap = args.get("snapshot") or {}
    if not snap:
        return {"ok": False, "error": "snapshot required"}
    res = await db.products.insert_one(snap)
    return {"ok": True, "id": str(res.inserted_id)}


async def tool_restore_category(db: AsyncIOMotorDatabase, args: Dict[str, Any], **_) -> Dict[str, Any]:
    snap = args.get("snapshot") or {}
    if not snap:
        return {"ok": False, "error": "snapshot required"}
    res = await db.categories.insert_one(snap)
    return {"ok": True, "id": str(res.inserted_id)}


async def tool_restore_document(db: AsyncIOMotorDatabase, args: Dict[str, Any], **_) -> Dict[str, Any]:
    snap = args.get("snapshot") or {}
    if not snap:
        return {"ok": False, "error": "snapshot required"}
    res = await db.documents.insert_one(snap)
    return {"ok": True, "id": str(res.inserted_id)}


def make_tool_registry(db, perms: Dict[str, bool], send_email_fn, by_email: str) -> Dict[str, Any]:
    can_settings = perms.get("settings.edit", False)
    can_prod = perms.get("products.edit", False)
    can_prod_del = perms.get("products.delete", False)
    can_cat = perms.get("categories.edit", False)
    can_cat_del = perms.get("categories.delete", False)
    can_quote = perms.get("quotes.edit", False)
    can_reply = perms.get("quotes.reply", False)
    can_email = perms.get("customers.email", False)
    return {
        "get_settings": lambda a: tool_get_settings(db, a),
        "update_settings": lambda a: tool_update_settings(db, a, can_edit=can_settings),
        "list_products": lambda a: tool_list_products(db, a),
        "create_product": lambda a: tool_create_product(db, a, can_edit=can_prod),
        "update_product": lambda a: tool_update_product(db, a, can_edit=can_prod),
        "delete_product": lambda a: tool_delete_product(db, a, can_delete=can_prod_del),
        "retranslate_product": lambda a: tool_retranslate_product(db, a, can_edit=can_prod),
        "list_categories": lambda a: tool_list_categories(db, a),
        "create_category": lambda a: tool_create_category(db, a, can_edit=can_cat),
        "update_category": lambda a: tool_update_category(db, a, can_edit=can_cat),
        "delete_category": lambda a: tool_delete_category(db, a, can_delete=can_cat_del),
        "list_quotes": lambda a: tool_list_quotes(db, a),
        "update_quote": lambda a: tool_update_quote(db, a, can_edit=can_quote),
        "reply_to_quote": lambda a: tool_reply_quote(db, a, can_reply=can_reply, send_email_fn=send_email_fn, by_email=by_email),
        "send_email": lambda a: tool_send_email(db, a, can_email=can_email, send_email_fn=send_email_fn, by_email=by_email),
        # Documents
        "create_document": lambda a: tool_create_document(db, a, by_email=by_email),
        "list_documents": lambda a: tool_list_documents(db, a),
        "delete_document": lambda a: tool_delete_document(db, a),
        # Web
        "fetch_url": lambda a: tool_fetch_url(db, a),
        "search_web": lambda a: tool_search_web(db, a),
        # Internal restores (undo)
        "_restore_product": lambda a: tool_restore_product(db, a),
        "_restore_category": lambda a: tool_restore_category(db, a),
        "_restore_document": lambda a: tool_restore_document(db, a),
    }


# ============================================================
# Heavily-trained system prompt
# ============================================================
SYSTEM_PROMPT = """You are **Masterpiece Studio AI**, the embedded assistant inside the private owner panel of **Masterpiece Innovations B.V.** — a premium Dutch industrial brand (Amstelveen, NL) selling **aerospace-grade precision gauges and custom carbide cutting tools** to manufacturers in aerospace, defense, automotive and advanced engineering.

You serve TWO purposes:
  (A) A friendly general-purpose assistant (chat, planning, drafting, calculations, translation, explanations, etc.) — answer like a smart colleague.
  (B) An operator: with the user's permission, you READ and CHANGE the live website through a fixed set of TOOLS.

═════════════════════════════════════════════════════════════
CALLER CONTEXT  (always provided to you on every turn)
═════════════════════════════════════════════════════════════
Each turn you receive the caller's:
  • name, email
  • role:        "owner" | "admin" | "member"
  • permissions: a JSON map of fine-grained booleans (e.g. quotes.reply, settings.edit, products.delete)

NEVER do an action they don't have permission for — the platform will block you anyway, but you should refuse politely.
ALWAYS address them by name when replying.

═════════════════════════════════════════════════════════════
TOOLS (you can call any combination per turn)
═════════════════════════════════════════════════════════════
READ:
  • get_settings()                              → current site settings (no smtpPassword)
  • list_products({ query?, limit? })
  • list_categories({})
  • list_quotes({ status?, limit? })             status = new | in-progress | replied | closed
  • list_documents({ query?, limit? })           → AI-generated documents
  • search_web({ query })                        → top 5 search results (DuckDuckGo)
  • fetch_url({ url })                           → fetches a webpage and returns title + clean text

WRITE (all mutating tools auto-store an undo recipe):
  • update_settings({ patch:{…} })   Allowed keys ONLY:
        companyName · companyTagline · companyAddress · logoText
        contactEmail · contactPhone · notifyEmail
        whatsappEnabled · whatsappNumber
        linkedinUrl · websiteUrl
        defaultLanguage · rfqResponseTime · certifications · allowedCountries
        primaryDomain · seoTitle · seoDescription
        fromEmail · fromName · notifyOnNewQuote · notifyOnReply
  • create_product({ product:{slug,name,desc,category,image,specs,leadTime,badge} })
  • update_product({ id, patch:{…} })
  • delete_product({ id })
  • retranslate_product({ id })                  → regenerate NL/DE/FR/PT
  • create_category({ category:{slug,name,description,icon,order} })
  • update_category({ id, patch:{…} })
  • delete_category({ id })
  • update_quote({ qid, patch:{ status?, adminNotes? } })
  • reply_to_quote({ qid, message, subject? })   → SENDS a real email
  • send_email({ to, subject, html|text })       → SENDS a real email
  • create_document({ title, content, type })    type = markdown | html | text
  • delete_document({ id })

═════════════════════════════════════════════════════════════
HARD RULES (non-negotiable)
═════════════════════════════════════════════════════════════
1. Reply ALWAYS with one strict JSON object — no markdown fences, no preamble:
       {
         "reply":   "<plain-text shown to the user>",
         "actions": [ { "tool":"<name>", "args":{…} }, ... ],
         "done":    true | false
       }
   • If you need data first (settings, products, web), emit those READ actions and set done=false. The platform feeds the results back.
   • When done, set done=true.

2. Never invent IDs, qids, slugs, emails, URLs, specs, prices. Ask or look them up first.

3. Never expose credentials, smtpPassword, JWT, or API keys.

4. Settings whitelisting: stick to allowed keys; the platform will reject anything else.

5. Emails / replies / mass actions are REAL. Before send_email or reply_to_quote, ALWAYS preview subject+body in `reply` so the user can stop you. Send only after explicit consent ("send it", "go ahead", "yes", "confirm", "sim", "envoyer").

6. Destructive operations (delete_*): require clear user approval. Always remind them they can press "Undo" on the action card.

7. Multilingual: reply in the user's language. If they switch, follow.

8. Brand voice: confident, precise, technically literate, slightly minimal — never salesy.
   Proof-points to lean on: "aerospace-grade", "ISO/EN compliant", "full traceability",
   "European supply chain", "24–48h RFQ response".
   B2B formal register in any customer-facing copy.

9. When making product/category copy, KEEP numbers, tolerances, ISO codes, dimensions exactly. Don't fabricate specs.

10. General questions (math, planning, drafting, translation, explanations…) — just answer in `reply`, no actions needed.

═════════════════════════════════════════════════════════════
EXAMPLES
═════════════════════════════════════════════════════════════
USER (owner): "Change SEO title to 'Aerospace Precision Specialists | Masterpiece Innovations'."
→ {"reply":"Updating the SEO title now.","actions":[{"tool":"update_settings","args":{"patch":{"seoTitle":"Aerospace Precision Specialists | Masterpiece Innovations"}}}],"done":true}

USER (owner): "What products do I have?"
→ HOP 1: {"reply":"Let me check.","actions":[{"tool":"list_products","args":{"limit":50}}],"done":false}
→ HOP 2 (after data): {"reply":"You have 18 products — 12 precision gauges and 6 cutting tools…","actions":[],"done":true}

USER (member without quotes.delete): "Delete quote Q-12345."
→ {"reply":"You don't have permission to delete quotes. I can change its status to 'closed' instead — want me to?","actions":[],"done":true}

USER: "Find the spec page on stryker.com for their thread gauges and import it as a new product."
→ HOP 1 fetch_url / search_web — HOP 2 propose the new product — HOP 3 (after user confirms) create_product.

USER: "Draft me a 1-page sales sheet for the M6 thread gauge."
→ create_document({ title:"M6 Thread Gauge — Sales Sheet", type:"markdown", content:"# …" })
"""

# ============================================================
# JSON extraction
# ============================================================
JSON_BLOCK_RE = re.compile(r"\{[\s\S]*\}")


def _extract_json(text: str) -> Optional[dict]:
    if not text:
        return None
    t = text.strip()
    if t.startswith("```"):
        t = t.strip("`")
        if t.lower().startswith("json"):
            t = t[4:].strip()
        if t.endswith("```"):
            t = t[:-3].strip()
    try:
        return json.loads(t)
    except Exception:
        pass
    m = JSON_BLOCK_RE.search(t)
    if not m:
        return None
    try:
        return json.loads(m.group(0))
    except Exception:
        return None


# ============================================================
# Main entry — one user turn
# ============================================================
async def run_assistant(
    *,
    db,
    user_message: str,
    history: List[Dict[str, Any]],
    permissions: Dict[str, bool],
    send_email_fn,
    by_email: str,
    by_name: str,
    role: str,
    site_summary: Dict[str, Any],
    session_id: str,
) -> Dict[str, Any]:
    """Run a single user turn. Returns {reply, actions:[{tool,args,result}], done}."""
    if not EMERGENT_LLM_KEY:
        return {"reply": "AI Assistant is not configured. EMERGENT_LLM_KEY missing.", "actions": [], "done": True}
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
    except Exception:
        return {"reply": "AI dependency missing (emergentintegrations).", "actions": [], "done": True}

    convo = [
        f"=== Caller ===\nName:  {by_name}\nEmail: {by_email}\nRole:  {role}\nPermissions: {json.dumps(permissions)}",
        "=== Live site snapshot ===",
        json.dumps(site_summary, indent=2, default=str),
        "=== Conversation memory (older first) ===",
    ]
    for h in history[-30:]:
        r = (h.get("role") or "user").upper()
        c = h.get("content") or ""
        convo.append(f"[{r}] {c}")
    convo.append("=== Current user message ===")
    convo.append(user_message)
    convo.append("Reply ONLY with the strict JSON object described in the system rules.")
    composed = "\n".join(convo)

    tools = make_tool_registry(db, permissions, send_email_fn, by_email)
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=SYSTEM_PROMPT,
    ).with_model(MODEL_PROVIDER, MODEL_NAME)

    final_reply = ""
    all_actions: List[Dict[str, Any]] = []

    for _ in range(4):
        try:
            text = await chat.send_message(UserMessage(text=composed))
        except Exception as e:
            logger.exception("AI chat failed")
            return {"reply": f"AI request failed: {e}", "actions": all_actions, "done": True}

        data = _extract_json(text or "")
        if not data or not isinstance(data, dict):
            return {"reply": (text or "").strip() or "(no response)", "actions": all_actions, "done": True}

        final_reply = data.get("reply") or final_reply
        actions = data.get("actions") or []
        done = bool(data.get("done", True))

        hop_results = []
        for act in actions:
            tool = act.get("tool")
            args = act.get("args") or {}
            fn = tools.get(tool)
            if not fn:
                result = {"ok": False, "error": f"Unknown tool: {tool}"}
            else:
                try:
                    result = await fn(args)
                except Exception as e:
                    logger.exception("Tool %s failed", tool)
                    result = {"ok": False, "error": str(e)}
            rec = {"tool": tool, "args": args, "result": result}
            all_actions.append(rec)
            hop_results.append(rec)

        if done or not actions:
            break
        composed = (
            "Tool execution results:\n" + json.dumps(hop_results, indent=2, default=str) +
            "\nContinue. Reply ONLY with the strict JSON object."
        )

    return {"reply": final_reply or "Done.", "actions": all_actions, "done": True}


# ============================================================
# Undo executor
# ============================================================
async def execute_undo(db, undo_recipe: Dict[str, Any], permissions: Dict[str, bool], send_email_fn, by_email: str) -> Dict[str, Any]:
    tools = make_tool_registry(db, permissions, send_email_fn, by_email)
    tool = undo_recipe.get("tool")
    args = undo_recipe.get("args") or {}
    fn = tools.get(tool)
    if not fn:
        return {"ok": False, "error": f"Cannot undo: unknown tool {tool}"}
    try:
        return await fn(args)
    except Exception as e:
        return {"ok": False, "error": str(e)}
