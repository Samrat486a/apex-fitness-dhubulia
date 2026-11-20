<?php
declare(strict_types=1);

require __DIR__ . '/../_init.php';
allow_methods('POST');
require_csrf();

$in = json_body();
$errors = [];
$email = v_email($in, 'email', $errors);
$password = (string) ($in['password'] ?? '');
if ($password === '') {
    $errors['password'] = 'Password is required.';
}
fail_if_errors($errors);

// Per-IP and per-account limits slow down password guessing.
rate_limit('login-ip:' . client_ip(), 30, 900);
rate_limit('login-acct:' . sha1($email), 8, 900);

$user = find_user_by_email($email);
// Verify against a dummy hash when the account doesn't exist, so timing doesn't reveal it.
$hash = $user['password_hash'] ?? '$2y$10$usesomesillystringfore7hnbRJHxXVLeakoG8K30oukPsA.ztMG';
if (!password_verify($password, $hash) || !$user) {
    json_error('Email or password is incorrect.', 401, [], 'INVALID_CREDENTIALS');
}
if (!(int) $user['is_active']) {
    json_error('This account is disabled. Please contact Apex Fitness.', 403, [], 'ACCOUNT_DISABLED');
}

if (password_needs_rehash($user['password_hash'], PASSWORD_DEFAULT)) {
    db()->prepare('UPDATE users SET password_hash = ? WHERE id = ?')
        ->execute([password_hash($password, PASSWORD_DEFAULT), $user['id']]);
}
rate_limit_clear('login-acct:' . sha1($email));
login_user($user);

json_success('Signed in.', ['user' => public_user($user), 'csrfToken' => csrf_token()]);
