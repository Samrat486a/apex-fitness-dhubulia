<?php
declare(strict_types=1);

require __DIR__ . '/../_init.php';
allow_methods('POST');
require_csrf();
$user = require_login();
$userId = (int) $user['id'];

$in = json_body();
$errors = [];
$personal = validate_personal_input($in, $errors, $userId);
fail_if_errors($errors);

save_personal_details($userId, $personal);
db()->prepare('UPDATE users SET email_opt_in = ?, whatsapp_opt_in = ? WHERE id = ?')->execute([
    v_bool($in, 'emailOptIn', (bool) $user['email_opt_in']) ? 1 : 0,
    v_bool($in, 'whatsappOptIn', (bool) $user['whatsapp_opt_in']) ? 1 : 0,
    $userId,
]);

json_success('Profile updated.', ['user' => public_user(find_user_by_id($userId))]);
