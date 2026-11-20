<?php
declare(strict_types=1);

require __DIR__ . '/../_init.php';
allow_methods('POST');
require_csrf();
rate_limit('register:' . client_ip(), 8, 3600);

$in = json_body();
$errors = [];
$name = v_string($in, 'name', $errors, 2, 120, 'Full name');
$email = v_email($in, 'email', $errors);
$phone = v_phone($in, 'phone', $errors);
$password = v_password($in, 'password', $errors);
if (!isset($errors['password']) && !hash_equals($password, (string) ($in['confirmPassword'] ?? ''))) {
    $errors['confirmPassword'] = 'Passwords don’t match.';
}
if (!v_bool($in, 'acceptTerms')) {
    $errors['acceptTerms'] = 'Please accept the terms to continue.';
}
if (!isset($errors['email']) && find_user_by_email($email)) {
    $errors['email'] = 'An account with this email already exists. Try signing in.';
}
fail_if_errors($errors);

db()->prepare('INSERT INTO users (name, email, phone, password_hash) VALUES (?, ?, ?, ?)')
    ->execute([$name, $email, $phone, password_hash($password, PASSWORD_DEFAULT)]);
$user = find_user_by_id((int) db()->lastInsertId());
login_user($user);

json_success('Welcome to Apex Fitness!', ['user' => public_user($user), 'csrfToken' => csrf_token()], 201);
