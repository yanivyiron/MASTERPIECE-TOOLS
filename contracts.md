# Masterpiece Tools — Backend Contracts (Phase 2)

## Overview
Phase 1 (frontend with mock data) is complete. Backend will:
1. Persist products, quotes, customers
2. Send transactional emails (RFQ to owner, replies to customers)
3. Authenticate admin (email + password + email-OTP code)
4. Store admin settings (SMTP credentials encrypted)

## Mocked data to replace
- `/app/frontend/src/mock.js` → PRODUCTS, CATEGORIES, SUBCATEGORIES, MOCK_QUOTES, MOCK_CUSTOMERS, MOCK_ADMIN
- `/app/frontend/src/context/AuthContext.jsx` → requestCode / verifyCode (currently localStorage + console.log code)
- `/app/frontend/src/pages/RequestQuote.jsx` → submit handler saves to localStorage `mpt_quotes`
- `/app/frontend/src/pages/admin/Settings.jsx` → settings stored in localStorage `mpt_admin_settings`

## API Endpoints (FastAPI, prefix `/api`)

### Public
- `GET  /api/products` → list (filter by category, subcategory, search)
- `GET  /api/products/:slug` → detail
- `GET  /api/categories` → list with subcategories
- `POST /api/quotes` → submit RFQ. Body: { name, email, company, country?, phone?, industry?, message?, items[], files[] (multipart) }. Side-effect: send email to owner + confirmation to customer.

### Admin (JWT)
- `POST /api/admin/auth/request-code` → { email, password } → emails 6-digit code, returns ok
- `POST /api/admin/auth/verify`       → { email, code } → returns JWT
- `GET  /api/admin/me`                → returns current admin
- `GET  /api/admin/quotes`            → list (filter status/search)
- `PATCH /api/admin/quotes/:id`       → update status / notes
- `POST /api/admin/quotes/:id/reply`  → send email reply to customer (body: { subject, message })
- `GET  /api/admin/customers`         → list with quote history
- `CRUD /api/admin/products`          → POST/PUT/DELETE
- `GET/PUT /api/admin/settings`       → SMTP config, notify email, defaults

## MongoDB Collections
- `products`     { id (uuid), slug, name_i18n {en,nl,de,fr,pt}, desc_i18n, category, subcategory, image, images[], specs{}, leadTime, badge, createdAt, updatedAt }
- `categories`   { id, slug, name_i18n, desc_i18n, image }
- `quotes`       { id (Q-YYYY-XXX), status, customer{}, items[], notes, attachments[], total?, createdAt, updatedAt, repliedAt? }
- `customers`    { id, name, company, email (unique), country, phone, quotesCount, totalValue, createdAt }
- `admin_users`  { id, email, passwordHash, role, createdAt }
- `otp_codes`    { email, code, expiresAt } (TTL index)
- `admin_settings` { emailProvider, smtpHost, smtpPort, smtpUser, smtpPassword (encrypted), notifyEmail, fromEmail, fromName, notifyOnNewQuote, notifyOnReply, defaultLanguage }
- `email_log`    { to, subject, body, status, sentAt }

## Email Service
- Pluggable: SMTP (default), SendGrid, Resend, Mailgun
- Owner notification email on new quote → uses `notifyEmail` setting (default yaniv@masterpiece-innovations.com)
- Customer confirmation email on RFQ submit
- Reply emails sent from admin panel

## Frontend Integration Points
- Replace mock.js imports with axios calls to `${REACT_APP_BACKEND_URL}/api/...`
- AuthContext: replace requestCode/verifyCode with real API calls, persist JWT in localStorage
- ProductCard/Products: fetch from `/api/products`
- RequestQuote: POST `/api/quotes` (multipart for files)
- Admin Quotes/Products/Customers: fetch + mutate via admin endpoints
- Admin Settings: GET/PUT settings, do NOT return decrypted passwords

## Auth Flow
1. Owner enters email + password → POST /api/admin/auth/request-code
2. Backend verifies password, emails 6-digit OTP
3. Owner enters OTP → POST /api/admin/auth/verify → returns JWT
4. JWT stored in localStorage, sent as `Authorization: Bearer <token>` for admin endpoints
5. Initial admin seeded: yaniv@masterpiece-innovations.com (password set via env or first-time setup)

## SEO (already done in Phase 1)
- index.html: OpenGraph, Twitter cards, structured data (Organization)
- Each page: Helmet with custom title and description
- Next iteration: dynamic sitemap.xml from products
