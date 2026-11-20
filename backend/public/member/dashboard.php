<?php
declare(strict_types=1);

require __DIR__ . '/../_init.php';
allow_methods('GET');
$user = require_login();
$userId = (int) $user['id'];

// Make sure any reminder that is due for this member exists before we show the inbox.
try {
    run_reminders($userId);
} catch (Throwable $e) {
    log_error('Member reminder run failed: ' . $e->getMessage());
}

$rows = user_memberships($userId);
$current = pick_current_membership($rows);

$stmt = db()->prepare("SELECT * FROM notifications WHERE user_id = ? AND channel = 'dashboard' ORDER BY created_at DESC, id DESC LIMIT 6");
$stmt->execute([$userId]);
$notifications = array_map('public_notification', $stmt->fetchAll());

$unread = db()->prepare("SELECT COUNT(*) FROM notifications WHERE user_id = ? AND channel = 'dashboard' AND read_at IS NULL");
$unread->execute([$userId]);

json_success('OK', [
    'user'          => public_user($user),
    'membership'    => $current ? public_membership($current) : null,
    'historyCount'  => count($rows),
    'notifications' => $notifications,
    'unreadCount'   => (int) $unread->fetchColumn(),
    'gym'           => public_gym_info(),
]);
