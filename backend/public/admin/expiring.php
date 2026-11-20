<?php
declare(strict_types=1);

require __DIR__ . '/../_init.php';
allow_methods('GET');
require_admin();

/*
 * Members grouped by reminder stage, with the delivery status of that stage's reminder:
 *   first   → days remaining in (second, first]   e.g. 4–5 days
 *   second  → days remaining in (0, second]       e.g. 1–3 days
 *   expired → current membership has expired
 */
$first = setting_int('reminder_first_days', 5);
$second = setting_int('reminder_second_days', 3);

$rows = array_values(array_filter(admin_member_rows(), static fn ($r) => in_array(row_status($r), ['expiring', 'expired'], true)));
$map = notification_status_map(array_map(static fn ($r) => (int) $r['membership']['id'], $rows));

$groups = ['first' => [], 'second' => [], 'expired' => []];
foreach ($rows as $r) {
    $m = $r['membership'];
    $days = (int) $m['daysRemaining'];
    if ($m['status'] === 'expired') {
        $group = 'expired';
        $type = 'expired';
    } elseif ($days <= $second) {
        $group = 'second';
        $type = 'reminder_second';
    } elseif ($days <= $first) {
        $group = 'first';
        $type = 'reminder_first';
    } else {
        continue;
    }
    $delivery = $map[(int) $m['id']][$type] ?? [];
    $groups[$group][] = admin_customer($r['user'], $m) + [
        'reminderType' => $type,
        'delivery'     => [
            'dashboard' => $delivery['dashboard'] ?? null,
            'email'     => $delivery['email'] ?? null,
            'whatsapp'  => $delivery['whatsapp'] ?? null,
        ],
    ];
}
foreach ($groups as &$g) {
    usort($g, static fn ($a, $b) => strcmp($a['membership']['expiryDate'], $b['membership']['expiryDate']));
}
unset($g);
$groups['expired'] = array_reverse($groups['expired']);   // most recently expired first

json_success('OK', ['firstDays' => $first, 'secondDays' => $second] + $groups);
