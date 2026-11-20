<?php
declare(strict_types=1);

require __DIR__ . '/../_init.php';
allow_methods('GET', 'POST');
$user = require_login();
$userId = (int) $user['id'];

if (request_method() === 'GET') {
    $rows = user_memberships($userId);
    $current = pick_current_membership($rows);
    json_success('OK', [
        'current' => $current ? public_membership($current) : null,
        'history' => array_map('public_membership', $rows),
    ]);
}

/*
 * POST: the member links a membership they bought at the gym (first time or renewal).
 * Body: personal details (name, email, phone, dateOfBirth, gender, address)
 *     + membership (planId, purchaseDate, startDate, durationDays, receiptNumber?)
 * The expiry date is always calculated here — never trusted from the browser.
 */
require_csrf();
rate_limit('membership:' . $userId, 10, 3600);

$in = json_body();
$errors = [];
$personal = validate_personal_input($in, $errors, $userId);
$membership = validate_membership_input($in, $errors);

// The same membership can't be linked twice (same start date + plan).
if (!$errors) {
    $dup = db()->prepare('SELECT id FROM memberships WHERE user_id = ? AND plan_id = ? AND start_date = ? AND is_cancelled = 0');
    $dup->execute([$userId, $membership['plan']['id'], $membership['start_date']]);
    if ($dup->fetchColumn()) {
        $errors['startDate'] = 'You have already added this membership.';
    }
}
fail_if_errors($errors);

$row = db_transaction(static function () use ($userId, $personal, $membership): array {
    save_personal_details($userId, $personal);
    db()->prepare("UPDATE users SET onboarding_status = 'member' WHERE id = ?")->execute([$userId]);
    return create_membership($userId, $membership, 'member');
});

notify_dashboard($userId, (int) $row['id'], 'membership_added', 'Membership linked',
    sprintf('Your %s membership (%s → %s) is now on your dashboard. Our team will verify it against your front-desk receipt.',
        $row['plan_name'],
        (new DateTimeImmutable($row['start_date']))->format('j M Y'),
        (new DateTimeImmutable($row['expiry_date']))->format('j M Y')));

// If it is already close to expiry, the first reminder appears straight away.
run_reminders($userId);

json_success('Membership added to your dashboard.', [
    'membership' => public_membership($row),
    'user'       => public_user(find_user_by_id($userId)),
], 201);
