# Masterpiece Tools — Product Requirements Document

## Original Problem Statement
> "My current website is Masterpiece-tools.com. Copy the entire website 1:1, make it 10x professional, configure SEO, smoother/better animations. Add 'add to basket feature'. Implement Portuguese support + English (default), Dutch, German, French. Make quotation process smoother and automatically email to yaniv@masterpiece-innovations.com. Create an owner panel to manage quotes, products (CRUD), customers, edit site info, and reply via email."

## Brand & Contact (Source of Truth)
- **Company:** Masterpiece Innovations B.V.
- **Address:** Van Heuven Goedhartlaan, 1181 LE Amstelveen, Netherlands
- **Phone / WhatsApp:** +31 6 25363610
- **Email:** yaniv@masterpiece-innovations.com
- **LinkedIn:** https://www.linkedin.com/company/masterpiece-innovations-b-v/?viewAsMember=true
- **Website (source):** https://www.masterpiece-tools.com

## Phase 1 — Frontend MVP (✅ COMPLETE — June 2026)

### Implemented
- 18 real products scraped from the original site (precision gauges + cutting tools) with real images
- 5-language i18n: EN (default), NL, DE, FR, PT — full translation dictionary
- Dark, industrial design (orange accent #ff6b1a) with parallax, marquees, scroll progress, micro-animations, Tilt3D, SpotlightCard
- Add to Basket flow with persistent drawer + Quote Basket page
- Multi-step Request-a-Quote (RFQ) wizard with file upload UI (mocked)
- SEO: Helmet OG/Twitter/Organization JSON-LD
- Admin Panel UI (mock data only):
  - Dashboard
  - Quotes (filter, status, reply UI)
  - Products (CRUD UI)
  - Customers (with quote history)
  - Site Settings (full CMS with company info, WhatsApp, LinkedIn, email provider, notifications, defaults)
- Floating WhatsApp button (bottom right, animated, language-aware greeting, toggleable from Admin)
- Header LinkedIn link (top bar + main row), Footer LinkedIn link — driven by Admin config
- Page transitions via framer-motion AnimatePresence
- Technical Specification PDF viewer on every product detail page:
  - 8 real PDFs downloaded from masterpiece-tools.com and self-hosted at `/specs/<slug>.pdf`
  - Industrial-themed modal with inline PDF (`<object>`), download, open-in-new-tab, ESC to close
- Route aliases (`/request-quote`, `/quote`, `/rfq` → `/request-a-quote`) + catch-all to home
- Mock admin auth (email/password + 6-digit OTP shown in UI for demo)

### Architecture
```
/app
├── frontend/
│   ├── public/
│   │   └── specs/*.pdf            (8 product spec PDFs, served at /specs/...)
│   ├── src/
│   │   ├── App.js                 (router + providers + AnimatePresence)
│   │   ├── components/
│   │   │   ├── FloatingWhatsApp.jsx
│   │   │   ├── PdfViewerModal.jsx
│   │   │   ├── animations.jsx     (ScrollProgress, Reveal, Tilt3D, SpotlightCard, Marquee)
│   │   │   ├── layout/{Header,Footer}.jsx
│   │   │   ├── sections/          (Hero + 10+ home sections)
│   │   │   └── ui/                (shadcn components)
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   ├── BasketContext.jsx
│   │   │   ├── LanguageContext.jsx
│   │   │   └── SiteConfigContext.jsx
│   │   ├── i18n/translations.js   (5 languages, ~80 keys each)
│   │   ├── pages/
│   │   │   ├── Home, Products, ProductDetail, CategoryPage, About, RequestQuote, Basket
│   │   │   └── admin/{Login,AdminLayout,Dashboard,Quotes,Products,Customers,Settings}.jsx
│   │   └── mock.js                (PRODUCTS, CATEGORIES, MOCK_QUOTES, MOCK_CUSTOMERS, MOCK_ADMIN)
├── backend/                       (FastAPI scaffold — not yet wired)
├── contracts.md                   (Phase-2 API blueprint)
└── memory/{PRD.md, test_credentials.md}
```

### Mock data persistence (until Phase 2)
- `mpt_lang` — current UI language
- `mpt_site_config` — editable site-wide config (admin Settings)
- `mpt_admin_session` — admin JWT placeholder
- `mpt_basket` — quote basket
- `mpt_quotes` — submitted RFQ history

---

## Phase 2 — Backend (🔜 NEXT, awaiting user go-ahead)

### P0
- FastAPI + MongoDB integration (Motor)
- Models: products, quotes, customers, settings, admin_users, otp_codes, email_log
- REST API per `/app/contracts.md`
- Real email integration (provider TBD — Resend / SendGrid / SMTP)
  - Owner notification on new RFQ → yaniv@masterpiece-innovations.com
  - Customer confirmation email on RFQ submit
  - Reply from admin panel to customer (threaded)
- JWT admin auth + email-OTP (and/or Emergent-managed Google login)

### P1
- Secure file uploads for RFQ drawings (PDF / STEP / DXF / IMG ≤ 25 MB)
- Owner-uploaded product PDF specifications (via Admin)
- Reply-to-customer from Admin Quotes page
- Pagination + search on Admin lists

### P2
- Dynamic sitemap.xml
- Rate limiting on RFQ + admin endpoints
- Audit log for admin actions
- End-to-end automated testing (Playwright)

---

## Recent Changes (June 2026)
- Added inline PDF viewer modal + 8 self-hosted technical-spec PDFs on product detail pages
- Fixed header text overlap by introducing short navigation labels for all 5 languages
- Added floating WhatsApp button with admin toggle, configurable number, multilingual greeting
- Added LinkedIn anchors in both header (top bar + nav) and footer — driven by Admin Settings
- Smoothed page transitions via framer-motion AnimatePresence
- Expanded Admin Settings into a true CMS: Company info, WhatsApp, social links, email provider, notifications, defaults
- Added route aliases (`/request-quote`, `/quote`, `/rfq`) + 404 catch-all redirect to home
- Fixed NL hero h1 clipping with `hyphens-auto break-words`
- 100% testing-agent green (10/10) on iteration_2

## Backlog / Future
- Phase-2 backend (above)
- Dynamic per-product CMS image uploads
- Customer self-service portal (track quote status)
- Multi-currency display
- Stripe/PayPal optional checkout for ready-stock items
