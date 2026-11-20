<?php
declare(strict_types=1);

/*
 * Membership expiry reminders.
 *
 * Which reminder is due depends on days remaining (defaults: first = 5, second = 3):
 *   days ≤ 0       → "expired"          (only within 7 days of expiry, never for old history)
 *   days ≤ second  → "reminder_second"  ("…expires in 3 days")
 *   days ≤ first   → "reminder_first"   ("…expires in 5 days")
 * Using windows instead of exact days means a missed cron run still sends the reminder
 * the next time it runs, with the correct number of days in the message.
 *
 * Channels: dashboard, email, WhatsApp (each can be switched off in /admin/settings;
 * members can opt out of email/WhatsApp in their profile → recorded as "skipped").
 *
 * Duplicates are impossible: see notify_once() — UNIQUE (membership_id, type, channel).
 * A renewed member is not reminded about their old membership (a later one exists).
 *
 * Triggers: the cron script (app/cron/reminders.php), the admin "Run reminders now"
 * button, and lazily on admin/member dashboard loads (run_reminders_if_due()).
 */

/** @return array{title:string,message:string} */
function reminder_copy(string $type, string $name, int $days, string $expiry): array
{
    $first = first_name($name);
    $date = (new DateTimeImmutable($expiry))->format('j M Y');
    if ($type === 'expired') {
        return [
            'title'   => 'Your membership has expired',
            'message' => "Hi $first, your Apex Fitness membership expired on $date. Visit the front desk to renew and get straight back to training.",
        ];
    }
    $span = plural_days($days);
    return [
        'title'   => "Membership expires in $span",
        'message' => "Hi $first, your Apex Fitness membership expires in $span (on $date). Renew at the front desk to keep your training streak going.",
    ];
}

function due_reminder_type(int $daysRemaining): ?string
{
    $firstDays = setting_int('reminder_first_days', 5);
    $secondDays = setting_int('reminder_second_days', 3);
    if ($daysRemaining <= 0) {
        return $daysRemaining >= -7 ? 'expired' : null;
    }
    if ($daysRemaining <= $secondDays) {
        return 'reminder_second';
    }
    if ($daysRemaining <= $firstDays) {
        return 'reminder_first';
    }
    return null;
}

/**
 * Creates and sends every reminder that is due (for one member, or everyone).
 * @return array{checked:int,created:int,sent:int,failed:int,skipped:int,retried:int}
 */
function run_reminders(?int $onlyUserId = null): array
{
    $summary = ['checked' => 0, 'created' => 0, 'sent' => 0, 'failed' => 0, 'skipped' => 0, 'retried' => 0];
    $firstDays = setting_int('reminder_first_days', 5);

    $sql = "SELECT m.*, u.name, u.email, u.phone, u.email_opt_in, u.whatsapp_opt_in,
                   DATEDIFF(m.expiry_date, CURDATE()) AS days_remaining
            FROM memberships m
            JOIN users u ON u.id = m.user_id AND u.is_active = 1
            WHERE m.is_cancelled = 0
              AND m.verification_status <> 'rejected'
              AND m.start_date <= CURDATE()
              AND m.expiry_date BETWEEN DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND DATE_ADD(CURDATE(), INTERVAL ? DAY)
              AND NOT EXISTS (
                  SELECT 1 FROM memberships later
                  WHERE later.user_id = m.user_id AND later.id <> m.id AND later.is_cancelled = 0
                    AND later.verification_status <> 'rejected' AND later.expiry_date > m.expiry_date
              )";
    $params = [$firstDays];
    if ($onlyUserId !== null) {
        $sql .= ' AND m.user_id = ?';
        $params[] = $onlyUserId;
    }
    $stmt = db()->prepare($sql);
    $stmt->execute($params);

    $channels = [
        'dashboard' => setting_bool('reminders_dashboard'),
        'email'     => setting_bool('reminders_email'),
        'whatsapp'  => setting_bool('reminders_whatsapp'),
    ];

    foreach ($stmt->fetchAll() as $m) {
        $summary['checked']++;
        $days = (int) $m['days_remaining'];
        $type = due_reminder_type($days);
        if ($type === null) {
            continue;
        }
        ['title' => $title, 'message' => $message] = reminder_copy($type, (string) $m['name'], $days, (string) $m['expiry_date']);

        foreach ($channels as $channel => $enabled) {
            if (!$enabled) {
                continue;
            }
            $recipient = null;
            $skipReason = null;
            if ($channel === 'email') {
                $recipient = $m['email'];
                if (!(int) $m['email_opt_in']) {
                    $skipReason = 'Member turned off email alerts';
                }
            } elseif ($channel === 'whatsapp') {
                $recipient = $m['phone'];
                if (!(int) $m['whatsapp_opt_in']) {
                    $skipReason = 'Member turned off WhatsApp alerts';
                } elseif (!$m['phone']) {
                    $skipReason = 'No phone number on file';
                }
            }

            $id = notify_once((int) $m['user_id'], (int) $m['id'], $type, $channel, $title, $message, $recipient,
                $skipReason ? 'skipped' : 'pending', $skipReason);
            if ($id === null) {
                continue;   // already created on an earlier run → never sent twice
            }
            $summary['created']++;
            if ($skipReason) {
                $summary['skipped']++;
                continue;
            }
            $result = dispatch_notification($id, ['days' => max(0, $days), 'expiry' => $m['expiry_date']]);
            $summary[$result === 'sent' ? 'sent' : 'failed']++;
        }
    }

    $summary['retried'] = retry_failed_notifications($onlyUserId);
    return $summary;
}

/**
 * Automatic retries for email/WhatsApp that failed (network hiccup, provider limit…):
 * at most 3 attempts, at least 30 minutes apart, only for reminders from the last 2 days.
 */
function retry_failed_notifications(?int $onlyUserId = null): int
{
    $sql = "SELECT id FROM notifications
            WHERE status IN ('failed','pending') AND channel IN ('email','whatsapp') AND attempts < 3
              AND updated_at < DATE_SUB(NOW(), INTERVAL 30 MINUTE)
              AND created_at > DATE_SUB(NOW(), INTERVAL 2 DAY)";
    $params = [];
    if ($onlyUserId !== null) {
        $sql .= ' AND user_id = ?';
        $params[] = $onlyUserId;
    }
    $stmt = db()->prepare($sql . ' LIMIT 50');
    $stmt->execute($params);
    $count = 0;
    foreach ($stmt->fetchAll(PDO::FETCH_COLUMN) as $id) {
        dispatch_notification((int) $id);
        $count++;
    }
    return $count;
}

/** Runs the full reminder job at most once per hour when triggered by page loads. */
function run_reminders_if_due(): void
{
    $last = setting('reminders_last_run');
    if ($last !== '' && strtotime($last) > time() - 3600) {
        return;
    }
    db()->prepare("INSERT INTO settings (setting_key, setting_value) VALUES ('reminders_last_run', ?)
                   ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)")->execute([date('Y-m-d H:i:s')]);
    try {
        run_reminders();
    } catch (Throwable $e) {
        log_error('Lazy reminder run failed: ' . $e->getMessage());
    }
}
