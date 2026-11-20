<?php
declare(strict_types=1);

/**
 * Loaded by every API endpoint (via public/_init.php) and by the cron scripts.
 * This folder (app/) must live OUTSIDE the public web root in production.
 */

define('APP_DIR', __DIR__);

ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);
mb_internal_encoding('UTF-8');

/* ── Configuration ── */

// APEX_CONFIG lets automated tests point at a separate config/database. Never set it on the live server.
$configFile = (PHP_SAPI === 'cli-server' || PHP_SAPI === 'cli') && getenv('APEX_CONFIG') ? (string) getenv('APEX_CONFIG') : APP_DIR . '/config/config.php';
if (!is_file($configFile)) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => false, 'message' => 'Server not configured: copy app/config/config.sample.php to config.php.', 'code' => 'NOT_CONFIGURED']);
    exit;
}
$GLOBALS['__config'] = require $configFile;

/** Read a config value with dot notation, e.g. config('db.name'). */
function config(string $key, $default = null)
{
    $value = $GLOBALS['__config'];
    foreach (explode('.', $key) as $part) {
        if (!is_array($value) || !array_key_exists($part, $value)) {
            return $default;
        }
        $value = $value[$part];
    }
    return $value;
}

function is_production(): bool
{
    return config('env') === 'production';
}

/** Absolute path inside the private storage folder (logs, sessions). */
function storage_path(string $sub = ''): string
{
    $base = rtrim((string) (config('storage_dir') ?: APP_DIR . '/storage'), '/');
    return $sub === '' ? $base : $base . '/' . ltrim($sub, '/');
}

// Membership days roll over at the gym's local midnight.
date_default_timezone_set((string) config('timezone', 'Asia/Kolkata'));

/* ── Libraries ── */

require_once APP_DIR . '/lib/http.php';
require_once APP_DIR . '/lib/errors.php';
require_once APP_DIR . '/config/database.php';
require_once APP_DIR . '/lib/session.php';
require_once APP_DIR . '/lib/csrf.php';
require_once APP_DIR . '/lib/rate_limit.php';
require_once APP_DIR . '/lib/validate.php';
require_once APP_DIR . '/lib/auth.php';
require_once APP_DIR . '/lib/settings.php';
require_once APP_DIR . '/lib/memberships.php';
require_once APP_DIR . '/lib/mailer.php';
require_once APP_DIR . '/lib/whatsapp.php';
require_once APP_DIR . '/lib/notifications.php';
require_once APP_DIR . '/lib/reminders.php';
require_once APP_DIR . '/lib/admin.php';

/* ── Every web request ── */

if (PHP_SAPI !== 'cli') {
    send_security_headers();
    handle_cors();
}
