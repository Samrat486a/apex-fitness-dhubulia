<?php
declare(strict_types=1);

/*
 * Notification history + delivery.
 *
 * Every notification is a row in `notifications` (one per channel). Rows tied to a
 * membership are protected by UNIQUE (membership_id, type, channel): notify_once()
 * uses INSERT IGNORE, so however often the reminder job runs — cron, page loads,
 * two servers at once — each reminder is created, and therefore sent, exactly once.
 */

/**
 * Creates the notification row unless it already exists.
 * @return int|null new row id, or null if this notification was already recorded
 */
function notify_once(int $userId, ?int $membershipId, string $type, string $channel, string $title, string $message, ?string $recipient, string $status = 'pending', ?string $error = null): ?int
{
    $stmt = db()->prepare(
        'INSERT IGNORE INTO notifications (user_id, membership_id, type, channel, status, title, message, recipient, error)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    $stmt->execute([$userId, $membershipId, $type, $channel, $status, $title, $message, $recipient, $error]);
    return $stmt->rowCount() === 1 ? (int) db()->lastInsertId() : null;
}

function find_notification(int $id): ?array
{
    $stmt = db()->prepare('SELECT n.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone
                           FROM notifications n JOIN users u ON u.id = n.user_id WHERE n.id = ?');
    $stmt->execute([$id]);
    return $stmt->fetch() ?: null;
}

/**
 * Delivers one notification row on its channel and records the outcome.
 * @param array{days?:int,expiry?:string} $context extra data for templates
 */
function dispatch_notification(int $id, array $context = []): string
{
    $n = find_notification($id);
    if (!$n || $n['status'] === 'sent' || $n['status'] === 'skipped') {
        return $n['status'] ?? 'missing';
    }

    $ok = true;
    $error = null;
    if ($n['channel'] === 'email') {
        $html = email_layout(
            $n['title'],
            '<p>' . nl2br(htmlspecialchars($n['message'], ENT_QUOTES, 'UTF-8')) . '</p>',
            'Open my dashboard',
            rtrim((string) config('app_url', ''), '/') . '/dashboard'
        );
        [$ok, $error] = send_mail((string) $n['recipient'], $n['title'] . ' · Apex Fitness', $n['message'], $html);
    } elseif ($n['channel'] === 'whatsapp') {
        $template = null;
        if (in_array($n['type'], ['reminder_first', 'reminder_second'], true)) {
            $days = $context['days'] ?? null;
            if ($days === null && $n['membership_id'] !== null) {   // a retry: work out today's figure
                $stmt = db()->prepare('SELECT expiry_date FROM memberships WHERE id = ?');
                $stmt->execute([$n['membership_id']]);
                $expiry = $stmt->fetchColumn();
                $days = $expiry ? max(0, days_between(today(), (string) $expiry)) : null;
            }
            if ($days !== null) {
                $template = ['name' => first_name((string) $n['user_name']), 'days' => (int) $days];
            }
        }
        [$ok, $error] = send_whatsapp((string) $n['recipient'], $n['message'], $template);
    }

    $status = $ok ? 'sent' : 'failed';
    db()->prepare(
        "UPDATE notifications SET status = ?, error = ?, attempts = attempts + 1, sent_at = IF(? = 'sent', NOW(), sent_at) WHERE id = ?"
    )->execute([$status, $error, $status, $id]);
    return $status;
}

function first_name(string $name): string
{
    $parts = preg_split('/\s+/', trim($name)) ?: [];
    return $parts[0] ?? $name;
}

function plural_days(int $n): string
{
    return $n === 1 ? '1 day' : $n . ' days';
}

/** A notification as the React app sees it. */
function public_notification(array $n): array
{
    $out = [
        'id'           => (int) $n['id'],
        'type'         => $n['type'],
        'channel'      => $n['channel'],
        'status'       => $n['status'],
        'title'        => $n['title'],
        'message'      => $n['message'],
        'read'         => $n['read_at'] !== null,
        'createdAt'    => $n['created_at'],
        'sentAt'       => $n['sent_at'],
    ];
    if (array_key_exists('user_name', $n)) {
        $out += [
            'userId'       => (int) $n['user_id'],
            'userName'     => $n['user_name'],
            'recipient'    => $n['recipient'],
            'membershipId' => $n['membership_id'] !== null ? (int) $n['membership_id'] : null,
            'attempts'     => (int) $n['attempts'],
            'error'        => $n['error'],
        ];
    }
    return $out;
}

/** Records (and delivers) a dashboard-only notification, e.g. "membership added". */
function notify_dashboard(int $userId, ?int $membershipId, string $type, string $title, string $message): void
{
    $id = notify_once($userId, $membershipId, $type, 'dashboard', $title, $message, null);
    if ($id !== null) {
        dispatch_notification($id);
    }
}
