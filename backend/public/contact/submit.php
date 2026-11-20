<?php
declare(strict_types=1);

require __DIR__ . '/../_init.php';
allow_methods('POST');
require_csrf();
rate_limit('contact:' . client_ip(), 5, 3600);

$in = json_body();
$errors = [];
$name = v_string($in, 'name', $errors, 2, 120, 'Name');
$email = v_email($in, 'email', $errors);
$phone = v_phone($in, 'phone', $errors, false);
$topic = v_enum($in, 'topic', $errors, ['membership', 'personal_training', 'visit', 'general'], 'topic') ?? 'general';
$message = v_text($in, 'message', $errors, 10, 2000, 'Message');
fail_if_errors($errors);

$user = current_user();
db()->prepare('INSERT INTO contact_messages (user_id, name, email, phone, topic, message, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)')
    ->execute([$user ? (int) $user['id'] : null, $name, $email, $phone, $topic, $message, client_ip()]);

json_success('Thanks! Our team will get back to you within one working day.', null, 201);
