# Masterpiece Tools — Product Requirements Document

## Original Problem Statement
> Copy masterpiece-tools.com 1:1, make it 10x more professional, configure SEO, smoother animations. Add "add to basket". Implement Portuguese + EN (default), NL, DE, FR. Smoother quotation process that auto-emails yaniv@masterpiece-innovations.com. Owner panel to manage quotes, products (CRUD), customers, site info; reply via email. **Launch-ready.**

## Brand & Source of Truth
- **Company:** Masterpiece Innovations B.V.
- **Address:** Van Heuven Goedhartlaan, 1181 LE Amstelveen, Netherlands
- **Phone / WhatsApp:** +31 6 25363610
- **Email:** yaniv@masterpiece-innovations.com
- **LinkedIn:** https://www.linkedin.com/company/masterpiece-innovations-b-v/?viewAsMember=true

## Phase 1 — Frontend (✅ COMPLETE)
- 18 real products with self-hosted PDFs, dark industrial design, parallax + Tilt3D animations
- 5-language i18n (EN/NL/DE/FR/PT) — comprehensive translation dictionary (~150+ keys/lang)
- SEO: per-page `<SEO>` component with hreflang for 5 languages, OG, Twitter, canonical, structured data (Organization, WebSite, Product), static `/robots.txt` + `/sitemap.xml`
- Floating WhatsApp button (admin-toggleable, admin-configured number)
- Header LinkedIn (top bar + main row) + Footer LinkedIn — admin-configured
- Page transitions via framer-motion AnimatePresence
- Inline PDF viewer modal on product pages (8 real PDFs hosted at `/specs/*.pdf`)
- Add-to-basket + persistent drawer + 3-step RFQ wizard with searchable country combobox (admin can restrict)
- Route aliases (`/request-quote`, `/quote`, `/rfq` → `/request-a-quote`) + catch-all `*` → `/`

## Phase 2 — Backend (✅ COMPLETE — June 2026)
**FastAPI + MongoDB + JWT/OTP auth + SMTP email**

### Public endpoints
- `GET  /api/health` — status + email-configured flag
- `GET  /api/settings` — public settings hydration
- `POST /api/quotes` — submit RFQ, persists to MongoDB, fires owner + customer emails (mock when SMTP unset)

### Admin endpoints (require Bearer JWT)
- `POST /api/admin/auth/login` (email+password → OTP)
- `POST /api/admin/auth/verify` (OTP → JWT, 7-day TTL)
- `GET  /api/admin/me`
- `GET  /api/admin/quotes` (list + filter by status)
- `PATCH /api/admin/quotes/{qid}` (update status / notes)
- `POST /api/admin/quotes/{qid}/reply` (sends email, appends to replies log)
- `GET  /api/admin/customers` (aggregated from quotes)
- `PUT  /api/admin/settings` (persist site settings)

### Email
- `smtplib` via env-configured SMTP. Mocks to console when not configured.
- Beautiful HTML templates: `render_rfq_owner`, `render_rfq_customer`
- Tests: 20/20 pytest pass

## Admin Panel (✅ COMPLETE)
- **Brand & Logo** — text + image upload, used everywhere via `SiteConfigContext`
- **Company Info** — name, address, phone, email, RFQ time, certifications
- **WhatsApp** — number + enable/disable toggle
- **Social** — LinkedIn URL, website URL
- **SEO** — title, description, OG image upload (1200×630)
- **Domain** — primary domain field + step-by-step DNS setup instructions
- **Allowed Countries** — searchable 195-country grid; bulk presets (EU/UK, Allow all)
- **Email Provider** — SMTP/SendGrid/Resend/Mailgun selector + credentials
- **Notifications** — per-event toggles
- **Defaults** — default language
- **Products CRUD** — image + PDF upload, custom products, hide/override base products

## Launch Checklist
- ✅ Real backend with persistence (MongoDB)
- ✅ Owner email + password + OTP auth
- ✅ RFQ goes to MongoDB + (optional) SMTP email
- ✅ International SEO (hreflang × 5, sitemap, structured data)
- ✅ Multi-language UI
- ✅ Admin CMS
- ⏳ Set production env vars: `JWT_SECRET`, `SMTP_HOST/USER/PASSWORD`, `CORS_ORIGINS`
- ⏳ Connect domain at hosting layer (instructions in Admin → Settings → Domain)

## Architecture
```
/app
├── backend/
│   ├── server.py            FastAPI app (auth, quotes, settings, customers)
│   ├── auth.py              JWT + bcrypt + email OTP
│   ├── email_service.py     SMTP via stdlib + HTML templates
│   ├── base.py              BaseDocument + PyObjectId
│   └── tests/backend_test.py 20 pytest tests (100% pass)
├── frontend/
│   ├── public/specs/        8 real product PDFs
│   ├── public/robots.txt + sitemap.xml
│   └── src/
│       ├── lib/api.js                       fetch wrapper + JWT
│       ├── i18n/translations.js             5-lang dictionary
│       ├── data/countries.js                195 countries
│       ├── context/SiteConfigContext.jsx    global editable config
│       ├── components/
│       │   ├── CountryCombobox.jsx          searchable picker
│       │   ├── FloatingWhatsApp.jsx
│       │   ├── PdfViewerModal.jsx
│       │   ├── SEO.jsx                      hreflang + OG + canonical
│       │   └── Logo.jsx                     admin-editable
│       ├── hooks/useResolvedProducts.js     merges base+custom+overrides
│       └── pages/admin/{Settings,Products,Quotes,Customers}.jsx
```

## Phase 3 — Massive Admin Expansion (✅ COMPLETE — Feb 2026)

### Backend
- **Multi-user RBAC**: owner + admin + member roles with per-resource granular permissions (`quotes.edit`, `products.delete`, `settings.edit`, etc.)
- **Team management**: `/api/admin/team` CRUD; invited members get a welcome email; password-change endpoint works for owner + team.
- **Categories**: full CRUD with auto-translation; public `/api/categories` for the website.
- **Quote attachments**: customers can attach files on RFQ; forwarded to owner email; persisted on the quote.
- **Quote delete + customer delete**: full CRUD on operational data.
- **Customer overrides**: notes / tags / blocked flag per customer.
- **Bulk email blast**: `/api/admin/email/blast` with optional templates + base64 attachments + history audit.
- **Email templates**: CRUD store, reusable from the blast UI.
- **SMTP presets**: 9 presets including GoDaddy (Pro + legacy Workspace).
- **Auto-translation**: products and categories auto-translate to NL/DE/FR/PT on create/update via Emergent LLM (Claude Sonnet 4.5 in `translate_service.py`).

### AI Studio (NEW — Phase 4)
- **Masterpiece Studio AI** — embedded panel-only assistant at `/admin/ai`, owner + team only.
- Powered by Claude Sonnet 4.5 via Emergent Universal LLM Key.
- **Knows caller name, role and exact permissions**, refuses tasks they can't perform.
- **Tools** (all permission-checked):
  - Read: get_settings, list_products, list_categories, list_quotes, list_documents, search_web, fetch_url.
  - Write: update_settings, create/update/delete product, retranslate_product, create/update/delete category, update_quote, reply_to_quote, send_email, create/delete document.
- **Conversations / memory**: persistent threads (`db.ai_conversations`) per user.
- **Edit-and-rerun**: edit any past USER message; the AI replays from there.
- **Undo per action**: every mutating tool stores an `_undo` recipe; one-click revert from the action card; supports settings, products (incl. delete via snapshot restore), categories, quotes, documents.
- **Audit log**: every action persisted to `db.ai_actions`.
- **Web fetch & search**: AI can `fetch_url` (read clean text from any page) and `search_web` (DuckDuckGo top 5).
- **Document generation**: AI can write Markdown/HTML/text documents stored in `db.documents` and downloadable from the panel.
- General Q&A also supported (planning, drafting, math, translation, etc.).

### Frontend
- **AI Studio page** (`/admin/ai`): two-pane layout, threads sidebar, real-time-feeling chat with typing indicator, suggestion chips, edit-and-resend (hover any user bubble), tool-action cards with Undo button, owner-only badge + Universal Key reminder.
- **Basket auto-clears after a successful quote submission** (Feb 2026 fix).

### Architecture additions
```
/app/backend/
├── ai_assistant.py    Studio AI runtime + tool registry + undo executor
├── translate_service.py  Auto-translation via Emergent LLM
/app/frontend/src/pages/admin/
├── AiStudio.jsx       Full conversational chat UI for the panel AI
```

## Phase 6 — Production-ready polish (✅ COMPLETE — Feb 2026)

### Wix-like visual editor (live on the public site)
- `SiteConfigContext.text(key, fallback)` + `setOverride/resetOverride` API.
- `<EditableText k="..." as="h1">…</EditableText>` wrapper for any block.
- `<FloatingEditToggle />` floats at bottom-left **only when an admin is logged in** and only on PUBLIC pages — pressing it turns on dashed outlines + pencil icons next to every editable text.
- Double-click any block (or pencil) → inline editor → Save → `PUT /api/admin/site-overrides` → MongoDB → propagates to all visitors instantly.
- Reset-to-default per block (orange "Reset" button).
- Already wired into Hero (badge, title1/2, subtitle, both CTAs, feature card text), CallToAction (title + desc), MicronPrecision (eyebrow + title), PrecisionShowcase (eyebrow + 2-line title). Adding more blocks is just `<EditableText k="key">…</EditableText>` — no schema migration needed.

### Web Importer + AI crawl
- `/admin/import` page: paste any URL → crawl same-domain pages (configurable depth, capped at 25) → see a tree with checkboxes per page / heading / image → pick what you want → "Import as products" or "Import as documents" (auto-translated, slug generated).
- AI tool `crawl_website({url, max_pages?, same_domain?})` so the assistant can also pull catalogs into the DB.
- Backend module `web_importer.py` does polite HTTP-only crawling (no JS execution), parses titles/headings/images/links, returns clean text.

### AI vision (OCR + LLM)
- **Tesseract OCR** built-in for every uploaded image — text extracted automatically and fed into the AI prompt.
- **Vision LLM fallback**: new tool `describe_image({name, mime, dataUrl})` uses Gemini 2.5 Flash via Emergent Universal Key for semantic description (materials, surface finish, ISO codes, dimensions) when OCR returns little text.
- All three of pypdf / pytesseract / Pillow are now in `requirements.txt`.

### Site overrides API (Wix engine)
- `GET  /api/admin/site-overrides` → current map.
- `PUT  /api/admin/site-overrides` `{key, value}` → upsert.
- `DELETE /api/admin/site-overrides/{key}` → reset to default.
- Public `/api/settings` returns the `site_overrides` map so unauthenticated visitors see the same edits.
- `/admin/categories` — full CRUD UI with auto-translation toggle.
- `/admin/team` — owner-only Team & permissions page with per-resource permission checkboxes (`quotes.edit`, `products.delete`, …); invite flow + delete.
- `/admin/templates` — email template builder with live HTML preview, multiple kinds (custom / reply / rfq_owner / rfq_customer / newsletter).
- `/admin/blast` — bulk-email composer: filter customers, select recipients, choose a template, paste HTML, attach files, send → background queue with audit history.
- `/admin/customers` — now wired to real `/api/admin/customers`; per-customer notes / tags / blocked flag; inline "Send custom email" dialog with live preview; delete (wipes quotes too).
- `/admin/quotes` — wired to live MongoDB: list + filter + status change + admin notes + reply (real email send) + **download attachments** + delete + past-replies log.
- **AI Studio file upload** — paperclip button in the composer accepts PDF / text / CSV / JSON / HTML / images (up to 8 MB total); backend extracts text (via `pypdf`) and feeds it to the model so the AI can answer questions about the file.
- **RFQ form file attachments** are now actually base64-encoded and sent (under 8 MB cap) — visible in the admin Quotes detail pane.

## Bugs fixed in this batch
- **Settings nested-data accumulation**: `PUT /api/admin/settings` now recursively unwraps `{data:{data:{...}}}` before storing. New `POST /api/admin/settings/repair` (owner-only) one-shot maintenance endpoint.
- **`/api/admin/customers/{email}/email`**: now uses a new `SingleEmailRequest` schema (no `recipients` required, since the URL already names the recipient).
- **Owner login form**: inputs now have `type="email"` / `type="password"` + `data-testid` (owner-login-email/password) for e2e testability.
- **AI hallucination guard**: system prompt now explicitly forbids claiming a setting is "already X" without checking the live snapshot.
