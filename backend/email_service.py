"""Email sending — SMTP via stdlib.

Config precedence:
  1. db.settings.data.smtp* (admin-configured via the website panel)
  2. environment variables (for production deploys)
  3. mock mode (logs to console, useful in preview)
"""
import os
import smtplib
import logging
from email.message import EmailMessage
from typing import Optional, List

from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

load_dotenv(Path(__file__).parent / ".env")

logger = logging.getLogger(__name__)

_MONGO = AsyncIOMotorClient(os.environ["MONGO_URL"])
_DB = _MONGO[os.environ["DB_NAME"]]


async def _smtp_config() -> dict:
    """Merge DB-admin settings + env. DB takes precedence when a field is non-empty."""
    doc = await _DB.settings.find_one({"_id": "site"}) or {}
    data = (doc.get("data") or {}) if doc else {}
    return {
        "host": data.get("smtpHost") or os.environ.get("SMTP_HOST", ""),
        "port": int(data.get("smtpPort") or os.environ.get("SMTP_PORT", "587") or 587),
        "user": data.get("smtpUser") or os.environ.get("SMTP_USER", ""),
        "password": data.get("smtpPassword") or os.environ.get("SMTP_PASSWORD", ""),
        "from_email": data.get("fromEmail") or os.environ.get("FROM_EMAIL", "noreply@masterpiece-tools.com"),
        "from_name": data.get("fromName") or os.environ.get("FROM_NAME", "Masterpiece Innovations B.V."),
        "use_tls": True if str(data.get("smtpUseTls", "true")).lower() != "false" else False,
        "notify_email": data.get("notifyEmail") or os.environ.get("NOTIFY_EMAIL", "yaniv@masterpiece-innovations.com"),
        "reply_to": data.get("notifyEmail") or os.environ.get("REPLY_TO_EMAIL", "yaniv@masterpiece-innovations.com"),
    }


async def email_configured() -> bool:
    cfg = await _smtp_config()
    return bool(cfg["host"] and cfg["user"] and cfg["password"])


async def get_notify_email() -> str:
    cfg = await _smtp_config()
    return cfg["notify_email"]


def _do_send(cfg: dict, to: str, subject: str, html: str, text: Optional[str], reply_to: Optional[str], cc: Optional[List[str]], attachments: Optional[List[dict]] = None) -> dict:
    msg = EmailMessage()
    msg["From"] = f"{cfg['from_name']} <{cfg['from_email']}>"
    msg["To"] = to
    if cc:
        msg["Cc"] = ", ".join(cc)
    if reply_to:
        msg["Reply-To"] = reply_to
    msg["Subject"] = subject
    msg.set_content(text or "Please view this email in HTML.")
    msg.add_alternative(html, subtype="html")
    # Attach files (data URLs or raw base64)
    if attachments:
        import base64
        for att in attachments:
            try:
                raw = att.get("data") or ""
                mime = att.get("type") or "application/octet-stream"
                name = att.get("name") or "attachment"
                if raw.startswith("data:"):
                    head, payload = raw.split(",", 1)
                    if not mime or mime == "application/octet-stream":
                        mime_part = head[5:].split(";")[0]
                        if mime_part:
                            mime = mime_part
                else:
                    payload = raw
                file_bytes = base64.b64decode(payload)
                maintype, _, subtype = mime.partition("/")
                msg.add_attachment(file_bytes, maintype=maintype or "application", subtype=subtype or "octet-stream", filename=name)
            except Exception as e:
                logger.warning("Could not attach %s: %s", att.get("name"), e)
    try:
        with smtplib.SMTP(cfg["host"], cfg["port"], timeout=30) as s:
            s.ehlo()
            if cfg["use_tls"]:
                s.starttls()
                s.ehlo()
            s.login(cfg["user"], cfg["password"])
            s.send_message(msg)
        return {"ok": True, "mode": "smtp"}
    except Exception as e:
        logger.exception("SMTP send failed")
        return {"ok": False, "mode": "smtp", "error": str(e)}


async def send_email(
    to: str,
    subject: str,
    html: str,
    text: Optional[str] = None,
    reply_to: Optional[str] = None,
    cc: Optional[List[str]] = None,
    attachments: Optional[List[dict]] = None,
) -> dict:
    """Send a single email. Returns {ok, mode, error?}. Falls back to mock when SMTP unset."""
    cfg = await _smtp_config()
    if not (cfg["host"] and cfg["user"] and cfg["password"]):
        logger.info("[MOCK EMAIL] to=%s subject=%s reply_to=%s attachments=%s", to, subject, reply_to, len(attachments or []))
        logger.info("[MOCK EMAIL BODY]\n%s", text or html)
        return {"ok": True, "mode": "mock"}
    return _do_send(cfg, to, subject, html, text, reply_to, cc, attachments)


async def send_test_email(to: str) -> dict:
    """Owner-triggered SMTP probe."""
    cfg = await _smtp_config()
    if not (cfg["host"] and cfg["user"] and cfg["password"]):
        return {"ok": False, "mode": "mock", "error": "SMTP not configured. Set host/user/password in Admin → Settings → Email Provider."}
    html = (
        "<div style='font-family:Arial;padding:20px'>"
        "<h2 style='color:#FF6B1A'>✓ SMTP works</h2>"
        f"<p>This is a test email from your Masterpiece Tools admin panel. If you can read this, your email provider is correctly configured.</p>"
        f"<p style='color:#666;font-size:12px'>Sent via {cfg['host']}:{cfg['port']} as {cfg['user']}</p>"
        "</div>"
    )
    return _do_send(cfg, to=to, subject="Masterpiece Tools — SMTP test", html=html, text="SMTP works.", reply_to=None, cc=None, attachments=None)


# ---------- HTML templates ----------
def render_rfq_owner(q: dict) -> str:
    items_html = "".join(
        f"<tr><td style=padding:6px;border:1px solid #eee>{i.get('name','')}</td>"
        f"<td style=padding:6px;border:1px solid #eee;text-align:right>{i.get('qty','')}</td>"
        f"<td style=padding:6px;border:1px solid #eee>{i.get('notes','')}</td></tr>"
        for i in (q.get("items") or [])
    )
    files_html = "".join(f"<li>{f}</li>" for f in (q.get("files") or []))
    return f"""
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:640px;margin:auto;color:#111">
      <div style="background:#000;color:#fff;padding:24px;border-bottom:4px solid #FF6B1A">
        <div style="color:#FF6B1A;font-size:11px;letter-spacing:.25em;text-transform:uppercase">New RFQ</div>
        <h1 style="margin:8px 0 0 0;font-size:22px">Quote request — {q.get('id','')}</h1>
        <div style="color:#bbb;font-size:13px;margin-top:6px">Submitted {q.get('createdAt','')}</div>
      </div>
      <div style="padding:20px;background:#fafafa">
        <h2 style="font-size:14px;margin:0 0 10px 0;color:#666">Customer</h2>
        <p style="margin:0;line-height:1.6">
          <strong>{q.get('firstName','')} {q.get('lastName','')}</strong> — {q.get('company','')}<br/>
          <a href="mailto:{q.get('email','')}">{q.get('email','')}</a> · {q.get('phone') or '—'}<br/>
          {q.get('country') or '—'} · {q.get('industry') or '—'}
        </p>
        <h2 style="font-size:14px;margin:20px 0 10px 0;color:#666">Product types</h2>
        <p style="margin:0">
          {'✓ Precision Gauge ' if (q.get('productTypes') or {}).get('gauge') else ''}
          {'✓ Cutting Tool ' if (q.get('productTypes') or {}).get('cutting') else ''}
          {f"+ {len(q.get('items') or [])} basket items" if q.get('items') else ''}
        </p>
        {f"<h2 style=font-size:14px;margin:20px 0 10px 0;color:#666>Basket</h2><table style=width:100%;border-collapse:collapse;font-size:13px><thead><tr><th align=left style=padding:6px;border:1px solid #eee>Product</th><th align=right style=padding:6px;border:1px solid #eee>Qty</th><th align=left style=padding:6px;border:1px solid #eee>Notes</th></tr></thead><tbody>{items_html}</tbody></table>" if items_html else ''}
        {f"<h2 style=font-size:14px;margin:20px 0 10px 0;color:#666>Requirements</h2><p style=margin:0;line-height:1.6;white-space:pre-wrap>{q.get('message','')}</p>" if q.get('message') else ''}
        {f"<h2 style=font-size:14px;margin:20px 0 10px 0;color:#666>Attachments</h2><ul style=margin:0;padding-left:18px>{files_html}</ul>" if files_html else ''}
      </div>
      <div style="padding:16px 20px;background:#000;color:#888;font-size:11px;text-align:center">
        Masterpiece Innovations B.V. · Van Heuven Goedhartlaan, 1181 LE Amstelveen, NL
      </div>
    </div>
    """


def render_rfq_customer(q: dict) -> str:
    return f"""
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:640px;margin:auto;color:#111">
      <div style="background:#000;color:#fff;padding:24px">
        <div style="color:#FF6B1A;font-size:11px;letter-spacing:.25em;text-transform:uppercase">Quote received</div>
        <h1 style="margin:8px 0 0 0;font-size:22px">Thanks for your request, {q.get('firstName','') or 'there'}</h1>
      </div>
      <div style="padding:20px;line-height:1.6">
        <p>We've received your RFQ <strong>#{q.get('id','')}</strong> and our engineering team will respond within <strong>24&ndash;48 hours</strong>.</p>
        <p>If you need to add details, simply reply to this email and we'll attach it to your file.</p>
        <p style="margin-top:24px;color:#666;font-size:13px">Best regards,<br/>The Masterpiece Tools team</p>
      </div>
      <div style="padding:16px 20px;background:#000;color:#888;font-size:11px;text-align:center">
        Masterpiece Innovations B.V. · +31 6 25363610 · yaniv@masterpiece-innovations.com
      </div>
    </div>
    """
