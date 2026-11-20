#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# Builds a ready-to-upload hosting package.
#
#   npm run deploy:package -- apexfitness.in
#
# Output (deploy/):
#   public_html/        → upload the CONTENTS into your domain's public_html
#     index.html, assets/, brand/, .htaccess, robots.txt, sitemap.xml
#     api/              → the PHP API (backend/public)
#   apex_app/           → upload as a folder NEXT TO public_html (not inside it)
#     config/config.php → production settings, pre-filled for your domain:
#                         fill in the database + email passwords (CHANGE_ME)
#   database/           → schema.sql + seed.sql for phpMyAdmin
#   public_html.zip, apex_app.zip  (same content, for hPanel's "Extract")
#
# Your local backend/app/config/config.php (dev passwords) is NEVER copied.
# deploy/ is git-ignored because config.php contains secrets once you fill it in.
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
cd "$(dirname "$0")/../.."

DOMAIN="${1:-}"
DOMAIN="${DOMAIN#https://}"; DOMAIN="${DOMAIN#http://}"; DOMAIN="${DOMAIN%%/*}"
if [[ -z "$DOMAIN" || "$DOMAIN" != *.* ]]; then
  echo "Usage: npm run deploy:package -- your-domain.com" >&2
  exit 1
fi
SITE="https://$DOMAIN"
OUT="deploy"

echo "▸ Building the website for $SITE"
rm -rf "$OUT" dist
npm run build >/dev/null
grep -q "apex_demo_db" dist/assets/*.js && { echo "✗ demo code found in the build — check .env.production (VITE_API_MODE=live)" >&2; exit 1; }

mkdir -p "$OUT/public_html/api" "$OUT/apex_app" "$OUT/database"

echo "▸ Website  → $OUT/public_html"
cp -R dist/. "$OUT/public_html/"
# Absolute URLs for link previews (WhatsApp/Facebook need them)
SITE="$SITE" perl -0pi -e 's#(<meta property="og:type" content="website" />)#$1\n    <meta property="og:url" content="$ENV{SITE}/" />\n    <meta property="og:image" content="$ENV{SITE}/brand/og-image.jpg" />\n    <link rel="canonical" href="$ENV{SITE}/" />#' "$OUT/public_html/index.html"

cat > "$OUT/public_html/robots.txt" <<EOF
User-agent: *
Disallow: /dashboard
Disallow: /admin
Disallow: /onboarding
Disallow: /api/
Sitemap: $SITE/sitemap.xml
EOF

PAGES="/ /programs /membership /about /contact /login /register"
# program pages: only slugs inside the PROGRAMS list of src/config/site.ts
for slug in $(awk '/^export const PROGRAMS/{f=1} /^export const FACILITIES/{f=0} f' src/config/site.ts | grep -o "slug: '[a-z0-9-]*'" | sed "s/slug: '//; s/'//"); do PAGES="$PAGES /programs/$slug"; done
{
  echo '<?xml version="1.0" encoding="UTF-8"?>'
  echo '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
  for p in $PAGES; do echo "  <url><loc>$SITE$p</loc></url>"; done
  echo '</urlset>'
} > "$OUT/public_html/sitemap.xml"

echo "▸ API      → $OUT/public_html/api"
cp -R backend/public/. "$OUT/public_html/api/"

echo "▸ App      → $OUT/apex_app (private)"
rsync -a \
  --exclude 'config/config.php' \
  --exclude 'storage/logs/*' --exclude 'storage/sessions/*' \
  backend/app/ "$OUT/apex_app/"
mkdir -p "$OUT/apex_app/storage/logs" "$OUT/apex_app/storage/sessions"
touch "$OUT/apex_app/storage/logs/.gitkeep" "$OUT/apex_app/storage/sessions/.gitkeep"

CRON_KEY="$(php -r 'echo bin2hex(random_bytes(24));' 2>/dev/null || openssl rand -hex 24)"
cat > "$OUT/apex_app/config/config.php" <<EOF
<?php
declare(strict_types=1);

/*
 * Apex Fitness — PRODUCTION settings for $DOMAIN
 * Fill in every CHANGE_ME before uploading. This file must stay in apex_app/ (never public_html).
 */
return [
    'env' => 'production',
    'timezone' => 'Asia/Kolkata',
    'app_url' => '$SITE',

    // hPanel → Databases → MySQL Databases (Hostinger names look like u123456789_apex)
    'db' => [
        'host' => 'localhost',
        'port' => 3306,
        'name' => 'CHANGE_ME_database_name',
        'user' => 'CHANGE_ME_database_user',
        'pass' => 'CHANGE_ME_database_password',
    ],

    'security' => [
        'session_name'     => 'apex_session',
        'session_days'     => 30,
        'cookie_secure'    => true,          // site must run on HTTPS (hPanel → SSL)
        'client_ip_header' => '',            // set to 'HTTP_X_FORWARDED_FOR' only if you put Cloudflare in front
        'cron_key'         => '$CRON_KEY',   // for the URL cron: $SITE/api/cron/reminders.php?key=…
    ],

    // Website and API are on the same domain → no cross-origin access needed.
    'cors_allowed_origins' => [],

    // hPanel → Emails → create no-reply@$DOMAIN, then put its password below.
    'mail' => [
        'driver'     => 'smtp',
        'host'       => 'smtp.hostinger.com',
        'port'       => 465,
        'encryption' => 'ssl',
        'username'   => 'no-reply@$DOMAIN',
        'password'   => 'CHANGE_ME_email_password',
        'from_email' => 'no-reply@$DOMAIN',
        'from_name'  => 'Apex Fitness',
    ],

    // WhatsApp Business Cloud API (Meta). Keep 'log' until your template is approved — see DEPLOYMENT.md.
    'whatsapp' => [
        'driver'          => 'log',
        'phone_number_id' => '',
        'access_token'    => '',
        'api_version'     => 'v20.0',
        'template_name'   => 'membership_expiry',
        'template_lang'   => 'en',
        'default_country_code' => '91',
    ],
];
EOF

cp backend/database/schema.sql backend/database/seed.sql "$OUT/database/"

echo "▸ Zipping"
( cd "$OUT/public_html" && zip -qr ../public_html.zip . )
( cd "$OUT" && zip -qr apex_app.zip apex_app )

echo ""
echo "✓ Package ready in $OUT/"
echo "  Next: follow DEPLOYMENT.md — upload, import the database, then fill in the CHANGE_ME"
echo "  values in apex_app/config/config.php (easiest in hPanel → File Manager after uploading)."
echo "  Cron key (also in config.php): $CRON_KEY"
