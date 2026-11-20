<?php
declare(strict_types=1);

/*
 * HTTP helpers: consistent JSON responses, request parsing, CORS, security headers.
 *
 * Every response has the same shape:
 *   { "success": true,  "message": "…", "data": { … } }
 *   { "success": false, "message": "…", "errors": { field: "…" }, "code": "…" }
 */

function send_json(array $body, int $status): void
{
    if (!headers_sent()) {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
    }
    echo json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
    exit;
}

function json_success(string $message = 'OK', $data = null, int $status = 200): void
{
    $body = ['success' => true, 'message' => $message];
    if ($data !== null) {
        $body['data'] = $data;
    }
    send_json($body, $status);
}

/** @param array<string,string> $errors field → message (for form validation) */
function json_error(string $message, int $status = 400, array $errors = [], ?string $code = null): void
{
    $body = ['success' => false, 'message' => $message];
    if ($code !== null) {
        $body['code'] = $code;
    }
    if ($errors) {
        $body['errors'] = $errors;
    }
    send_json($body, $status);
}

function request_method(): string
{
    return strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
}

/** Only allow the listed HTTP methods for this endpoint. */
function allow_methods(string ...$methods): void
{
    if (!in_array(request_method(), $methods, true)) {
        header('Allow: ' . implode(', ', $methods));
        json_error('Method not allowed.', 405, [], 'METHOD_NOT_ALLOWED');
    }
}

/** Decoded JSON request body (max 256 KB). */
function json_body(): array
{
    static $body = null;
    if ($body !== null) {
        return $body;
    }
    $limit = 256 * 1024;
    $raw = file_get_contents('php://input', false, null, 0, $limit + 1) ?: '';
    if (strlen($raw) > $limit) {
        json_error('Request is too large.', 413, [], 'PAYLOAD_TOO_LARGE');
    }
    if ($raw === '') {
        return $body = [];
    }
    $decoded = json_decode($raw, true);
    if (!is_array($decoded)) {
        json_error('Invalid JSON body.', 400, [], 'INVALID_JSON');
    }
    return $body = $decoded;
}

/** Query-string parameter as a trimmed string. */
function query_param(string $key, string $default = ''): string
{
    $v = $_GET[$key] ?? $default;
    return is_string($v) ? trim($v) : $default;
}

function client_ip(): string
{
    $remote = substr((string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0'), 0, 45);
    $header = (string) config('security.client_ip_header', '');
    if ($header === '' || !isset($_SERVER[$header]) || !is_string($_SERVER[$header])) {
        return $remote;
    }
    $parts = array_map('trim', explode(',', $_SERVER[$header]));
    $ip = $header === 'HTTP_X_FORWARDED_FOR' ? (string) end($parts) : $parts[0];
    return filter_var($ip, FILTER_VALIDATE_IP) ? substr($ip, 0, 45) : $remote;
}

function is_https(): bool
{
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || (($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https')
        || ((int) ($_SERVER['SERVER_PORT'] ?? 0) === 443);
}

/** Security headers for every API response. */
function send_security_headers(): void
{
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: DENY');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'");
    header('Cache-Control: no-store');
    if (is_https()) {
        header('Strict-Transport-Security: max-age=31536000; includeSubDomains');
    }
    header_remove('X-Powered-By');
}

/**
 * CORS with an explicit allow-list (never "*", because requests carry cookies).
 * Same-origin requests (the normal production setup) need no CORS at all.
 */
function handle_cors(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin !== '') {
        $allowed = (array) config('cors_allowed_origins', []);
        if (in_array($origin, $allowed, true)) {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
            header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
            header('Access-Control-Max-Age: 600');
            header('Vary: Origin');
        }
    }
    if (request_method() === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}
