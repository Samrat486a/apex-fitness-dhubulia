<?php
declare(strict_types=1);

require __DIR__ . '/../_init.php';
allow_methods('GET');
require_admin();

// Page loads double as a safety net for the cron job (at most once an hour).
run_reminders_if_due();

$rows = admin_member_rows();
$counts = ['active' => 0, 'expiring' => 0, 'expired' => 0, 'upcoming' => 0, 'none' => 0];
$byPlan = [];
$pending = 0;
$expiringSoon = [];
foreach ($rows as $r) {
    $status = row_status($r);
    $counts[$status]++;
    $m = $r['membership'];
    if ($m) {
        if ($status !== 'expired') {
            $byPlan[$m['planName']] = ($byPlan[$m['planName']] ?? 0) + 1;
        }
        if ($m['verificationStatus'] === 'pending') {
            $pending++;
        }
        if ($status === 'expiring') {
            $expiringSoon[] = admin_customer($r['user'], $m);
        }
    }
}
usort($expiringSoon, static fn ($a, $b) => $a['membership']['daysRemaining'] <=> $b['membership']['daysRemaining']);

$monthStart = date('Y-m-01');
$newThisMonth = count(array_filter($rows, static fn ($r) => substr((string) $r['user']['created_at'], 0, 10) >= $monthStart));

$n = db()->query("SELECT
        SUM(status = 'sent' AND channel = 'email' AND created_at > DATE_SUB(NOW(), INTERVAL 30 DAY))    AS email_sent,
        SUM(status = 'sent' AND channel = 'whatsapp' AND created_at > DATE_SUB(NOW(), INTERVAL 30 DAY)) AS whatsapp_sent,
        SUM(status = 'failed')  AS failed,
        SUM(status = 'pending') AS pending
    FROM notifications")->fetch();

$recentSignups = array_map(static fn ($r) => admin_customer($r['user'], $r['membership']), array_slice($rows, 0, 5));
$messages = db()->query("SELECT id, name, email, phone, topic, message, status, created_at FROM contact_messages ORDER BY created_at DESC LIMIT 5")->fetchAll();

ksort($byPlan);
json_success('OK', [
    'stats' => [
        'totalMembers'        => count($rows),
        'active'              => $counts['active'] + $counts['upcoming'],
        'expiring'            => $counts['expiring'],
        'expired'             => $counts['expired'],
        'noMembership'        => $counts['none'],
        'pendingVerification' => $pending,
        'newThisMonth'        => $newThisMonth,
        'emailSent30d'        => (int) ($n['email_sent'] ?? 0),
        'whatsappSent30d'     => (int) ($n['whatsapp_sent'] ?? 0),
        'failedNotifications' => (int) ($n['failed'] ?? 0),
    ],
    'byPlan'         => array_map(static fn ($k, $v) => ['plan' => $k, 'count' => $v], array_keys($byPlan), array_values($byPlan)),
    'expiringSoon'   => array_slice($expiringSoon, 0, 6),
    'recentSignups'  => $recentSignups,
    'recentMessages' => array_map(static fn ($m) => [
        'id' => (int) $m['id'], 'name' => $m['name'], 'email' => $m['email'], 'phone' => $m['phone'],
        'topic' => $m['topic'], 'message' => $m['message'], 'status' => $m['status'], 'createdAt' => $m['created_at'],
    ], $messages),
    'remindersLastRun' => setting('reminders_last_run') ?: null,
]);
