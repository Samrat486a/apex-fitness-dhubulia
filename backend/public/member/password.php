<?php
declare(strict_types=1);

require __DIR__ . '/../_init.php';
allow_methods('POST');
require_csrf();
$user = require_login();
rate_limit('password:' . $user['id'], 10, 3600);

$in = json_body();
$errors = [];
if (!password_verify((string) ($in['currentPassword'] ?? ''), $user['password_hash'])) {
    $errors['currentPassword'] = 'Current password is incorrect.';
}
$new = v_password($in, 'newPassword', $errors);
fail_if_errors($errors);

db()->prepare('UPDATE users SET password_hash = ? WHERE id = ?')->execute([password_hash($new, PASSWORD_DEFAULT), $user['id']]);
session_rotate();
json_success('Password changed.', ['csrfToken' => csrf_token()]);
