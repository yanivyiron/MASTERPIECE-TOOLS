#!/usr/bin/env python3
"""Seed three production-ready marketing email templates into the panel."""
import os
import requests
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
api_url = ""
with (ROOT / "frontend" / ".env").open() as f:
    for line in f:
        if line.startswith("REACT_APP_BACKEND_URL="):
            api_url = line.split("=", 1)[1].strip()

EMAIL = "yaniv@masterpiece-innovations.com"
PASS = "Master2025!"

login = requests.post(f"{api_url}/api/admin/auth/login", json={"email": EMAIL, "password": PASS}).json()
verify = requests.post(f"{api_url}/api/admin/auth/verify",
                       json={"email": EMAIL, "code": login["demoCode"]}).json()
token = verify["token"]
H = {"Authorization": f"Bearer {token}"}

# Idempotency — remove any template whose name matches one we are about to create.
existing = requests.get(f"{api_url}/api/admin/email/templates", headers=H).json().get("templates", [])
NAMES = {"Welcome — New Customer", "Quote follow-up — 7 day", "New product launch — Aerospace gauges"}
for t in existing:
    if t.get("name") in NAMES:
        requests.delete(f"{api_url}/api/admin/email/templates/{t['id']}", headers=H)


BRAND_HEADER = """
<div style="background:#0a0a0a;padding:32px 40px;text-align:left;border-bottom:3px solid #FF6B1A">
  <table cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td style="padding-right:14px;vertical-align:middle">
        <div style="width:38px;height:38px;background:#FF6B1A;transform:rotate(45deg);"></div>
      </td>
      <td style="vertical-align:middle">
        <div style="color:#fff;font-family:Helvetica,Arial,sans-serif;font-weight:900;font-size:20px;letter-spacing:-0.3px;line-height:1.05">Masterpiece Tools</div>
        <div style="color:#9a9a9a;font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.18em;text-transform:uppercase;margin-top:2px">Precision Innovations</div>
      </td>
    </tr>
  </table>
</div>
"""

BRAND_FOOTER = """
<div style="background:#0a0a0a;color:#666;padding:24px 40px;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.6">
  Masterpiece Innovations B.V. · Van Heuven Goedhartlaan, 1181 LE Amstelveen, Netherlands<br />
  <a href="https://www.masterpiece-tools.com" style="color:#FF6B1A;text-decoration:none">www.masterpiece-tools.com</a> · <a href="mailto:yaniv@masterpiece-innovations.com" style="color:#FF6B1A;text-decoration:none">yaniv@masterpiece-innovations.com</a>
  <div style="margin-top:14px;color:#444;font-size:11px">You receive this email because you previously requested a quote from Masterpiece Tools. Reply with the word <strong>UNSUBSCRIBE</strong> and we will remove you immediately.</div>
</div>
"""


def email(subject, body_html):
    return f"""<div style="margin:0;padding:0;background:#1a1a1a;font-family:Helvetica,Arial,sans-serif">
{BRAND_HEADER}
<div style="background:#fff;color:#1a1a1a;padding:40px;font-size:15px;line-height:1.7">
{body_html}
</div>
{BRAND_FOOTER}
</div>"""


welcome_body = """
<div style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#FF6B1A;font-weight:700;margin-bottom:8px">Welcome</div>
<h1 style="font-size:28px;font-weight:900;margin:0 0 18px;line-height:1.15;color:#000">Welcome to Masterpiece Tools</h1>
<p>Hi <strong>{{firstName}}</strong>,</p>
<p>Thank you for reaching out. You've just made contact with one of Europe's most demanding precision tool makers.</p>
<p>What you can expect from us:</p>
<ul style="padding-left:22px">
  <li><strong>24–48h RFQ response</strong> — no exceptions, no bots.</li>
  <li><strong>Aerospace-grade tolerances</strong> down to ±0.001 mm with full traceability.</li>
  <li><strong>European supply chain</strong> — ISO/EN compliant, fully audited.</li>
</ul>
<p>If you have a drawing, photo or spec sheet — just reply to this email and attach it. We will scope it for you.</p>
<p style="margin-top:30px">Best regards,<br/><strong>Yaniv Bar</strong><br/><span style="color:#666">Director · Masterpiece Innovations B.V.</span></p>
<div style="margin-top:30px"><a href="https://www.masterpiece-tools.com/products" style="display:inline-block;background:#FF6B1A;color:#fff;text-decoration:none;padding:14px 28px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;font-size:13px">Browse our catalog →</a></div>
"""


follow_up_body = """
<div style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#FF6B1A;font-weight:700;margin-bottom:8px">Quote follow-up</div>
<h1 style="font-size:28px;font-weight:900;margin:0 0 18px;line-height:1.15;color:#000">Did your quote land at the right time?</h1>
<p>Hi <strong>{{firstName}}</strong>,</p>
<p>A week ago we sent you our quote for the parts you requested.</p>
<p>Just checking in — sometimes projects move on a different timeline, and we want to make sure you have everything you need to make a decision.</p>
<ul style="padding-left:22px">
  <li>Would you like us to <strong>adjust the lead time</strong> or batch size?</li>
  <li>Need a <strong>second variant</strong> at a different tolerance?</li>
  <li>Or did the project pivot, and we should park this for a later round?</li>
</ul>
<p>Any answer is fine — just hit reply and we will adapt.</p>
<p style="margin-top:30px">Best regards,<br/><strong>Yaniv Bar</strong><br/><span style="color:#666">Director · Masterpiece Innovations B.V.</span></p>
"""


launch_body = """
<div style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#FF6B1A;font-weight:700;margin-bottom:8px">New release</div>
<h1 style="font-size:28px;font-weight:900;margin:0 0 18px;line-height:1.15;color:#000">A new line of aerospace gauges, made in the EU</h1>
<p>Hi <strong>{{firstName}}</strong>,</p>
<p>We've just added a new line of <strong>aerospace-grade precision gauges</strong> to our catalog — built for tolerances that aerospace, defense and advanced engineering programs cannot compromise on.</p>
<p>Highlights:</p>
<ul style="padding-left:22px">
  <li>Sub-micron tolerance — verified ±0.001 mm.</li>
  <li>ISO 1502 thread profiles &amp; ISO/EN compliant.</li>
  <li>Full DIN A4 spec sheet + 3D model on request.</li>
  <li>Stocked in NL — typical lead time 2–4 weeks.</li>
</ul>
<p>Want a sample drawing or the certified spec sheet? Hit reply and we'll send it over within 24 hours.</p>
<div style="margin-top:24px;margin-bottom:18px"><a href="https://www.masterpiece-tools.com/request-a-quote" style="display:inline-block;background:#FF6B1A;color:#fff;text-decoration:none;padding:14px 28px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;font-size:13px">Request a quote →</a></div>
<p style="margin-top:30px">Best regards,<br/><strong>Yaniv Bar</strong><br/><span style="color:#666">Director · Masterpiece Innovations B.V.</span></p>
"""

templates = [
    {
        "name": "Welcome — New Customer",
        "kind": "newsletter",
        "subject": "Welcome to Masterpiece Tools — your RFQ is in our hands",
        "description": "Send to first-time customers shortly after their first RFQ. Variable: {{firstName}}.",
        "html": email("Welcome", welcome_body),
    },
    {
        "name": "Quote follow-up — 7 day",
        "kind": "newsletter",
        "subject": "Quick check-in on your Masterpiece quote",
        "description": "Send 7 days after sending a quote that hasn't been replied to. Variable: {{firstName}}.",
        "html": email("Quote follow-up", follow_up_body),
    },
    {
        "name": "New product launch — Aerospace gauges",
        "kind": "newsletter",
        "subject": "New: a line of aerospace-grade gauges, made in the EU",
        "description": "Use for product announcements or new-catalog blasts. Variable: {{firstName}}.",
        "html": email("New release", launch_body),
    },
]

created = []
for t in templates:
    r = requests.post(f"{api_url}/api/admin/email/templates", json=t, headers=H)
    r.raise_for_status()
    created.append(t["name"])

print("✓ Seeded templates:")
for n in created:
    print("   •", n)
print("\nVisible at /admin/templates and selectable from /admin/blast.")
