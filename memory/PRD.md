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

## Backlog (P2)
- Migrate Admin Products UI to call backend `/api/admin/products` (currently localStorage)
- Migrate Admin Settings UI to also persist to `/api/admin/settings` (currently localStorage only)
- Customer-self-service quote tracking
- Stripe checkout for ready-stock items
- File upload to S3 / object storage (currently base64 in JSON)
- Audit log table + admin actions history
- E2E Playwright suite

## Test status (Iteration 4)
- Backend pytest: **20/20 PASS** (`/app/backend/tests/backend_test.py`)
- Frontend e2e: **100% on requested flows** (RFQ, country combobox, i18n NL/PT)
