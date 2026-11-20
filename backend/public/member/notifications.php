<?php
declare(strict_types=1);

require __DIR__ . '/../_init.php';
allow_methods('GET', 'POST');
$user = require_login();
$userId = (int) $user['id'];

if (request_method() === 'GET') {
    $stmt = db()->prepare("SELECT * FROM notifications WHERE user_id = ? AND channel = 'dashboard' ORDER BY created_at DESC, id DESC LIMIT 100");
    $stmt->execute([$userId]);
    $items = array_map('public_notification', $stmt->fetchAll());

    // Delivery history for the other channels, so members can see what was sent where.
    $d = db()->prepare("SELECT channel, status, type, sent_at, created_at FROM notifications
                        WHERE user_id = ? AND channel IN ('email','whatsapp') ORDER BY created_at DESC LIMIT 50");
    $d->execute([$userId]);
    json_success('OK', ['items' => $items, 'deliveries' => array_map(static fn ($r) => [
        'channel' => $r['channel'], 'status' => $r['status'], 'type' => $r['type'],
        'sentAt' => $r['sent_at'], 'createdAt' => $r['created_at'],
    ], $d->fetchAll())]);
}

// POST { id } marks one as read, { all: true } marks everything read.
require_csrf();
$in = json_body();
if (v_bool($in, 'all')) {
    db()->prepare("UPDATE notifications SET read_at = NOW() WHERE user_id = ? AND channel = 'dashboard' AND read_at IS NULL")->execute([$userId]);
} else {
    $id = filter_var($in['id'] ?? null, FILTER_VALIDATE_INT);
    if (!$id) {
        json_error('Notification not found.', 404, [], 'NOT_FOUND');
    }
    db()->prepare("UPDATE notifications SET read_at = COALESCE(read_at, NOW()) WHERE id = ? AND user_id = ? AND channel = 'dashboard'")->execute([$id, $userId]);
}
json_success('Marked as read.');
