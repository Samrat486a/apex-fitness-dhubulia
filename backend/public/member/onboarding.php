<?php
declare(strict_types=1);

require __DIR__ . '/../_init.php';
allow_methods('POST');
require_csrf();
$user = require_login();

// Answer to "Have you already purchased an Apex Fitness membership?"
$in = json_body();
$errors = [];
$answer = v_enum($in, 'answer', $errors, ['member', 'not_member'], 'answer');
fail_if_errors($errors);

db()->prepare('UPDATE users SET onboarding_status = ? WHERE id = ?')->execute([$answer, $user['id']]);
json_success('Saved.', ['user' => public_user(find_user_by_id((int) $user['id']))]);
