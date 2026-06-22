"""Email sending — SMTP via stdlib (env-configurable). Falls back to console log if not configured."""
import os
import smtplib
import logging
from email.message import EmailMessage
from typing import Optional, List

logger = logging.getLogger(__name__)


def _smtp_env() -> dict:
    return {
        "host": os.environ.get("SMTP_HOST", ""),
        "port": int(os.environ.get("SMTP_PORT", "587")),
        "user": os.environ.get("SMTP_USER", ""),
        "password": os.environ.get("SMTP_PASSWORD", ""),
        "from_email": os.environ.get("FROM_EMAIL", "noreply@masterpiece-tools.com"),
        "from_name": os.environ.get("FROM_NAME", "Masterpiece Innovations B.V."),
        "use_tls": os.environ.get("SMTP_USE_TLS", "true").lower() == "true",
    }


def email_configured() -> bool:
    env = _smtp_env()
    return bool(env["host"] and env["user"] and env["password"])


def send_email(
    to: str,
    subject: str,
    html: str,
    text: Optional[str] = None,
    reply_to: Optional[str] = None,
    cc: Optional[List[str]] = None,
) -> dict:
    """Send a single email. Returns {ok, mode, error?}.

    If SMTP is not configured the email is logged (mode=mock) — useful in preview.
    """
    env = _smtp_env()
    if not email_configured():
        logger.info("[MOCK EMAIL] to=%s subject=%s reply_to=%s", to, subject, reply_to)
        logger.info("[MOCK EMAIL BODY]\n%s", text or html)
        return {"ok": True, "mode": "mock"}

    msg = EmailMessage()
    msg["From"] = f"{env['from_name']} <{env['from_email']}>"
    msg["To"] = to
    if cc:
        msg["Cc"] = ", ".join(cc)
    if reply_to:
        msg["Reply-To"] = reply_to
    msg["Subject"] = subject
    msg.set_content(text or "Please view this email in HTML.")
    msg.add_alternative(html, subtype="html")

    try:
        with smtplib.SMTP(env["host"], env["port"], timeout=20) as s:
            s.ehlo()
            if env["use_tls"]:
                s.starttls()
                s.ehlo()
            s.login(env["user"], env["password"])
            s.send_message(msg)
        return {"ok": True, "mode": "smtp"}
    except Exception as e:
        logger.exception("SMTP send failed")
        return {"ok": False, "mode": "smtp", "error": str(e)}


# ---------- HTML templates ----------
def render_rfq_owner(q: dict) -> str:
    items_html = "".join(
        f"<tr><td style=padding:6px;border:1px solid #eee>{i['name']}</td>"
        f"<td style=padding:6px;border:1px solid #eee;text-align:right>{i['qty']}</td>"
        f"<td style=padding:6px;border:1px solid #eee>{i.get('notes','')}</td></tr>"
        for i in (q.get("items") or [])
    )
    files_html = "".join(f"<li>{f}</li>" for f in (q.get("files") or []))
    return f"""
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:640px;margin:auto;color:#111">
      <div style="background:#000;color:#fff;padding:24px;border-bottom:4px solid #FF6B1A">
        <div style="color:#FF6B1A;font-size:11px;letter-spacing:.25em;text-transform:uppercase">New RFQ</div>
        <h1 style="margin:8px 0 0 0;font-size:22px">Quote request — {q.get('id','')}</h1>
        <div style="color:#bbb;font-size:13px;margin-top:6px">Submitted {q.get('createdAt')}</div>
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
