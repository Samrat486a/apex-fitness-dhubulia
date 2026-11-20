# Deploying Apex Fitness (Hostinger)

Written for **Hostinger hPanel** (Business / Premium web hosting). Any host with PHP 8.1+,
MySQL/MariaDB and Apache or LiteSpeed works the same way — only the menu names differ.

**Time needed:** about 30 minutes.

---

## 0. Requirements

| | |
|---|---|
| PHP | **8.1 or newer** (8.2/8.3 recommended) with `pdo_mysql`, `mbstring`, `curl`, `openssl` — all on by default at Hostinger |
| Database | MySQL 8 or MariaDB 10.4+ |
| Web server | Apache or LiteSpeed with `.htaccess` (Hostinger = LiteSpeed ✓) |
| SSL | Required — logins only work over HTTPS |

On your computer: Node.js 20+ (already installed).

---

## 1. Build the upload package (on your Mac)

```bash
cd ~/Desktop/"Apex Fitness"/"Apex Fitness Dhubulia"
npm install
npm run deploy:package -- yourdomain.com
```

This creates `deploy/`:

| Item | Goes to |
|---|---|
| `public_html.zip` | your domain's **public_html** (the website + `api/`) |
| `apex_app.zip` | **next to** public_html — private code, config and logs (never public) |
| `database/schema.sql`, `database/seed.sql` | imported in phpMyAdmin |

The production `apex_app/config/config.php` is generated for your domain with a random cron key.
Your local development passwords are never included.

---

## 2. Create the database

1. hPanel → **Databases → MySQL Databases** → create:
   - database name, e.g. `u123456789_apex`
   - user, e.g. `u123456789_apex` — use a strong generated password and **write it down**
2. Click **Enter phpMyAdmin** next to the new database.
3. **Import** → choose `deploy/database/schema.sql` → Go.
4. **Import** again → `deploy/database/seed.sql` → Go.
   You should now see 7 tables, and `membership_plans` has 4 rows.

---

## 3. Upload the files

hPanel → **Files → File Manager**.

1. Open `public_html`. Delete Hostinger's default `default.php` / `index.php` if present.
2. Upload `public_html.zip` → right-click → **Extract** → into `public_html` → delete the zip.
   - Turn on **Show hidden files** (settings ⚙) and check that `public_html/.htaccess` and
     `public_html/api/.htaccess` exist.
3. Go **one level up** (to the folder that contains `public_html` — usually
   `domains/yourdomain.com/`). Upload `apex_app.zip` → **Extract** here → delete the zip.

You should end up with:

```
domains/yourdomain.com/
├── apex_app/          ← private (config, code, logs)
└── public_html/
    ├── index.html, assets/, brand/, .htaccess, robots.txt, sitemap.xml
    └── api/
```

> If your site's root is `/home/u123456789/public_html` (older accounts), put `apex_app` in
> `/home/u123456789/apex_app` instead — the API finds it in either place. For any other
> location, edit `public_html/api/.htaccess` and enable the `SetEnv APEX_APP_DIR …` line.

---

## 4. Fill in the settings

Open `apex_app/config/config.php` in File Manager (right-click → **Edit**) and replace every `CHANGE_ME`:

| Setting | Value |
|---|---|
| `db.name`, `db.user`, `db.pass` | from step 2 |
| `mail.password` | password of `no-reply@yourdomain.com` (step 6) |

Leave `db.host` as `localhost` on Hostinger. Save.

---

## 5. PHP version and SSL

1. hPanel → **Advanced → PHP Configuration** → choose **PHP 8.2** (or newer) → Save.
2. hPanel → **Security → SSL** → make sure SSL is **Active** for the domain (free Let's Encrypt).
   The site already redirects every `http://` request to `https://`.

### ✅ Check it

Open `https://yourdomain.com/api/`. You should see:

```json
{"success":true,"message":"Apex Fitness API is running","data":{"database":"ok","storage":"ok","https":true}}
```

Then open `https://yourdomain.com` — the website should load, including deep links like
`https://yourdomain.com/programs/apex-hiit` when you refresh the page.

---

## 6. Email (membership reminders)

1. hPanel → **Emails** → create the mailbox **`no-reply@yourdomain.com`**.
2. Put its password in `config.php` → `mail.password` (step 4). The SMTP server
   (`smtp.hostinger.com`, port 465, SSL) is already set.
3. hPanel → **Emails → Email deliverability** (or DNS): make sure **SPF** and **DKIM** are enabled
   so reminders don't land in spam.

To check: Admin → Notifications shows every email with **Sent** / **Failed** and the exact error.

---

## 7. Create your admin account

1. On the website, **Create account** with your own email.
2. phpMyAdmin → your database → **SQL** tab → run (with your email):
   ```sql
   UPDATE users SET role = 'admin', onboarding_status = 'not_member' WHERE email = 'you@example.com';
   ```
3. Sign out and sign in again → you land on **/admin**.

Then in the admin panel:
- **Settings** → real phone, WhatsApp number, email, address, opening hours, Google Maps link.
- **Membership Plans** → your real prices (the seeded prices are samples).

---

## 8. Daily reminder job (cron)

hPanel → **Advanced → Cron Jobs** → **Custom**:

| Field | Value |
|---|---|
| Command | `/usr/bin/php /home/u123456789/domains/yourdomain.com/apex_app/cron/reminders.php` |
| Schedule | every day at 09:00 (`0 9 * * *`) — hourly (`0 * * * *`) is also fine |

Replace `u123456789` and `yourdomain.com` with yours (File Manager shows the full path at the top).

**If your host only allows URL cron jobs**, use:
```
https://yourdomain.com/api/cron/reminders.php?key=YOUR_CRON_KEY
```
(`YOUR_CRON_KEY` = `security.cron_key` in `config.php`.)

Reminders are never sent twice, however often the job runs. The admin dashboard also runs it
once an hour as a safety net.

---

## 9. WhatsApp reminders (optional, when ready)

Reminders are recorded in the dashboard and sent by email right away. To also send WhatsApp:

1. [Meta Business Suite](https://business.facebook.com) → set up **WhatsApp Business Platform (Cloud API)**
   with a phone number that is **not** used in the normal WhatsApp app.
2. **WhatsApp Manager → Message templates** → create a **Utility** template named
   `membership_expiry`, language English, body for example:
   *"Hi {{1}}, your Apex Fitness membership expires in {{2}} days. Visit the front desk to renew."*
   Wait for approval.
3. Create a **System User** with a **permanent access token** (`whatsapp_business_messaging` permission).
4. In `config.php` → `whatsapp`: set `driver` to `'cloud_api'`, fill `phone_number_id` and `access_token`.

Until then (`driver` = `'log'`), WhatsApp messages are only written to `apex_app/storage/logs`.

---

## 10. Final checklist

- [ ] `https://yourdomain.com/api/` → database **ok**, storage **ok**, https **true**
- [ ] Create a test member, add a membership → dashboard shows the dates
- [ ] Admin → Settings saved with real contact details; Plans have real prices
- [ ] Contact form message appears in Admin → Inquiries
- [ ] Cron job created
- [ ] A test reminder email arrives (add a membership that ends in 3 days, then Admin → Expiring Soon → **Run reminders now**)
- [ ] Delete test accounts you don't need (phpMyAdmin → `users`)

---

## Updating the site later

1. `npm run deploy:package -- yourdomain.com`
2. Upload & extract `public_html.zip` over `public_html` (overwrite).
3. For backend changes, upload the changed files inside `apex_app/` — **but keep your server's
   `apex_app/config/config.php`** (the package contains a fresh one with `CHANGE_ME` values).

## Backups

hPanel → **Files → Backups** (daily on most plans). Before big changes, also export the database
in phpMyAdmin (**Export → Quick → SQL**).

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Refreshing `/programs/...` gives 404 | `public_html/.htaccess` is missing — enable *Show hidden files* and re-extract |
| `/api/` says *application folder not found* | `apex_app` isn't next to `public_html` (step 3) or set `APEX_APP_DIR` in `public_html/api/.htaccess` |
| `/api/` says *Server not configured* | `apex_app/config/config.php` is missing |
| *The service is temporarily unavailable* | Wrong database details in `config.php`. The real reason is in `apex_app/storage/logs/app-YYYY-MM-DD.log` |
| `/api/` shows `"storage": "not writable"` | File Manager → `apex_app/storage` → permissions **755** (folders) |
| Sign-in "works" but you're logged out again | Site is opened over `http://` — activate SSL (step 5) |
| Emails don't arrive | Admin → Notifications → open the failed email to see the error; check `mail.password`, SPF/DKIM |
| Too many requests (429) | Login/contact rate limits protect against abuse — wait a few minutes |

Logs: `apex_app/storage/logs/` (one file per day).
