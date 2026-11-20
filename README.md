# Apex Fitness — Dhubulia

Website + member dashboard + admin panel for **Apex Fitness**, a physical gym.
Members buy their membership **at the front desk**; the website lets them link it, see their
days remaining and get renewal reminders. **No online payments** anywhere.

| Layer | Tech |
|---|---|
| Frontend | React 19 · TypeScript · Tailwind CSS 4 · Vite · React Router |
| Backend | PHP 8 (plain PHP, no framework) — JSON API in `backend/public` |
| Database | MySQL 8 / MariaDB 10.4+ (managed in phpMyAdmin) |
| Auth | PHP sessions (HttpOnly cookie) + CSRF token, bcrypt passwords |

---

## What's included

**Public site** — Home (hero, stats, programs, plans, facilities, how-it-works, coaching,
testimonials, member CTA), `/programs` and a detail page per program (`/programs/<slug>`:
overview, who it's for, results, session breakdown, sample week), `/membership` (subscription
plans + FAQ), `/about`, `/contact` (form saved to MySQL + map).

**Members** — `/register` → *"Have you already purchased an Apex Fitness membership?"*
→ **Yes**: personal + membership form (expiry calculated live) · **Not yet**: how to join.
`/dashboard`: status, plan, start/expiry, days remaining, progress ring, renewal banner,
notifications, profile, gym info, quick actions. Sub-pages for membership history/renewals,
notifications (with email/WhatsApp delivery history) and profile (reminder opt-outs, password).

**Admin** (`/admin`) — Overview KPIs · Customers (search/filter/sort, detail page with edit,
record/verify/edit/remove memberships, password reset) · Memberships (verify member submissions)
· Expiring Soon (5-day / 3-day / expired groups with Email/WhatsApp/Dashboard delivery status)
· Expired Members · Notifications (filter, retry failed) · Membership Plans · Inquiries · Settings.

### Membership rules (single source of truth: `backend/app/lib/memberships.php`)

```
expiry_date    = start_date + duration_days
days_remaining = expiry_date − today          (gym time, Asia/Kolkata)
```

### Reminder system (`backend/app/lib/reminders.php`)

* **5 days left** → first reminder, **3 days left** → second reminder, **expired** → one notice
  (only within 7 days of expiry). Days are configurable in Admin → Settings.
* Channels: **dashboard**, **email** (SMTP), **WhatsApp** (WhatsApp Business Cloud API).
* **No duplicates, ever:** every notification row is unique on `(membership_id, type, channel)`;
  the job does `INSERT IGNORE` first and only sends when the row was actually created — safe with
  cron, page-load triggers and manual runs at the same time.
* Windows, not exact days: if cron misses a day, the reminder still goes out next run with the right day count.
* Renewed members aren't reminded about their old membership.
* Failed email/WhatsApp retries automatically (max 3 attempts, 30 min apart) or via Admin → Notifications.
* Everything is stored in the `notifications` table (history, status, error, attempts).

Triggers: daily cron (`backend/app/cron/reminders.php`), Admin "Run reminders now", and as a
safety net on admin/member dashboard loads.

---

## Project layout

```
Apex Fitness Dhubulia/
├── src/                         React app
│   ├── config/site.ts           ALL marketing copy, images, stats, trainers (edit here)
│   ├── lib/api.ts               API client (live PHP) + mode switch
│   ├── lib/mock.ts              in-browser demo backend (preview only, never in live builds)
│   ├── lib/membership.ts        date rules mirrored for live form previews
│   ├── components/              ui/, layout/, home/, membership/, dashboard/, admin/
│   └── pages/                   public pages, Auth, Onboarding, dashboard/*, admin/*
├── public/                      favicon, .htaccess (SPA routing + security headers)
└── backend/
    ├── public/                  → web folder  (XAMPP: htdocs/apex/api   Hostinger: public_html/api)
    │   ├── auth/  member/  plans/  gym/  contact/  admin/      JSON endpoints
    │   └── _init.php            finds and loads app/
    ├── app/                     → PRIVATE, outside the web root
    │   ├── bootstrap.php  config/  lib/  cron/reminders.php  storage/
    ├── database/schema.sql      tables
    ├── database/seed.sql        plans + gym settings
    ├── scripts/                 create-admin.php, sync-xampp.sh
    └── tests/logic_test.php     membership & reminder rule tests
```

API responses always look like `{ "success": true, "message": "…", "data": {…} }` or
`{ "success": false, "message": "…", "code": "…", "errors": { field: "…" } }`.

---

## Run it locally

### 1. Database (phpMyAdmin)
1. Start **MySQL** and **Apache** (XAMPP → Manage Servers).
2. phpMyAdmin → **New** → database `apex_fitness`, collation `utf8mb4_unicode_ci`.
3. Select it → **Import** → `backend/database/schema.sql`, then **Import** → `backend/database/seed.sql`.

### 2. Backend
```bash
cp backend/app/config/config.sample.php backend/app/config/config.php
```
Edit DB credentials if needed (XAMPP default: `root` / empty password). Then copy the backend into XAMPP:
```bash
npm run backend:sync
```
Check http://localhost/apex/api/ → `"Apex Fitness API is running"`.

> **Apple Silicon note:** XAMPP's macOS build is Intel-only and needs Rosetta
> (`softwareupdate --install-rosetta`). Alternatively use Homebrew: `brew install php mariadb`,
> then run `php -S localhost:8080 -t backend/public` and start Vite with
> `API_PROXY=http://localhost:8080 API_PREFIX= npm run dev`.

### 3. Frontend
```bash
npm install
cp .env.example .env.local      # VITE_API_MODE=live
npm run dev                     # http://localhost:5173 — /api is proxied to XAMPP
```

### 4. First admin account
Register normally on the site, then in phpMyAdmin → SQL:
```sql
UPDATE users SET role = 'admin', onboarding_status = 'not_member' WHERE email = 'you@example.com';
```
or `php backend/scripts/create-admin.php you@example.com "Your Name"`.

### Design preview without PHP (demo mode)
```bash
npm run dev:demo
```
Everything runs in the browser with demo data (demo logins are shown on the login page).
Production builds always use `live` (`.env.production`) and never include the demo code.

---

## Email & WhatsApp

In `backend/app/config/config.php`:

* **Email** — `mail.driver = 'smtp'` with your mailbox (Hostinger: `smtp.hostinger.com`, 465, `ssl`).
  `'log'` writes messages to `app/storage/logs` instead of sending (default for development).
* **WhatsApp** — `whatsapp.driver = 'cloud_api'`, `phone_number_id`, `access_token` from Meta
  (WhatsApp Business → API Setup). Create an approved **utility template** named
  `membership_expiry` with body e.g.
  *"Hi {{1}}, your Apex Fitness membership expires in {{2}} days. Visit the front desk to renew."*

## Cron (daily reminders)

Hostinger → Advanced → Cron Jobs → every day 09:00:
```
/usr/bin/php /home/uXXXX/apex_app/cron/reminders.php
```
Safe to run hourly — duplicates are impossible.

## Deploy (Hostinger)
```bash
npm run deploy:package -- yourdomain.com
```
builds `deploy/` (website + API, private `apex_app`, database files, zips) with a production
config for your domain. Full step-by-step guide: **[DEPLOYMENT.md](DEPLOYMENT.md)**.

## Performance
* Glows use CSS gradients (no `filter: blur`), below-the-fold home sections use `content-visibility`,
  images are lazy-loaded with responsive `srcset`, and dashboards/admin are code-split.
* `src/lib/effects.ts` turns off the heavier effects (cursor spotlight, grid glow, backdrop blur,
  floating cards) on low-end devices, data-saver mode, touch screens and reduced-motion settings.

## Tests
```bash
npm run typecheck
npm run backend:test          # membership + reminder rules (no database needed)
```
End-to-end API test (69 checks: auth, memberships, reminders, admin, security) against a
**separate, freshly imported test database** — it creates users and memberships:
```bash
APEX_CONFIG=/path/to/test-config.php php -S localhost:8090 -t backend/public
APEX_CONFIG=/path/to/test-config.php npm run backend:test:api -- http://localhost:8090
```
`APEX_CONFIG` (a config file pointing at the test database) only works from the command line /
PHP's built-in server — it is ignored on the live server.

---

## Replace before going live
* **Logo** — the official logo is in `public/brand/` (`apex-logo.webp`, small `apex-logo-sm.webp`,
  `apple-touch-icon.png`, and `public/favicon.png`). Replace those files to update it everywhere.
* **Photos** — placeholder Unsplash images in `src/config/site.ts` (`IMAGES`, programs, facilities,
  and `COACH.image` — swap in the real coach photo).
* **Content** — stats (e.g. "60+ premium equipment"), testimonials and program details in
  `src/config/site.ts` are sample copy. `DEFAULT_PLANS` there is shown if the server is unreachable.
* **Prices** — sample plan prices in `seed.sql`; edit in Admin → Membership Plans.
* **Contact details** — phone/WhatsApp/email/address are placeholders; edit in Admin → Settings.
