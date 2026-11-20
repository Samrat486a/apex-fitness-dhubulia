<?php
declare(strict_types=1);

/*
 * CSRF protection for every state-changing request (POST):
 *   1. The browser must send X-CSRF-Token matching the token in the session
 *      (the React app reads it from GET /auth/session.php).
 *   2. If the browser sends an Origin header, it must be our own site.
 */

function csrf_token(): string
{
    session_boot();
    if (empty($_SESSION['csrf']) || !is_string($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf'];
}

function require_csrf(): void
{
    session_boot();

    $origin = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
    if ($origin !== '') {
        $host = (string) ($_SERVER['HTTP_HOST'] ?? '');
        $originHost = (string) parse_url($origin, PHP_URL_HOST) . (parse_url($origin, PHP_URL_PORT) ? ':' . parse_url($origin, PHP_URL_PORT) : '');
        $allowed = in_array($origin, (array) config('cors_allowed_origins', []), true);
        if (!$allowed && strcasecmp($originHost, $host) !== 0) {
            json_error('Request origin not allowed.', 403, [], 'BAD_ORIGIN');
        }
    }

    $sent = (string) ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
    $expected = (string) ($_SESSION['csrf'] ?? '');
    if ($sent === '' || $expected === '' || !hash_equals($expected, $sent)) {
        json_error('Your session has expired. Please refresh and try again.', 419, [], 'CSRF_INVALID');
    }
}
