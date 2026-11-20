<?php
declare(strict_types=1);

require __DIR__ . '/../_init.php';
allow_methods('GET');
require_admin();

/*
 * GET ?q=search&status=all|active|expiring|expired|upcoming|none|pending&plan=<planId>
 *     &sort=newest|name|expiry&page=1&perPage=20
 */
$status = query_param('status', 'all');
$planId = (int) query_param('plan', '0');
$sort = query_param('sort', 'newest');
['page' => $page, 'perPage' => $perPage] = pagination();

$rows = admin_member_rows(mb_substr(query_param('q'), 0, 100));
$rows = array_values(array_filter($rows, static function ($r) use ($status, $planId) {
    $m = $r['membership'];
    if ($planId > 0 && (!$m || $m['planId'] !== $planId)) {
        return false;
    }
    return match ($status) {
        'all'     => true,
        'pending' => $m !== null && $m['verificationStatus'] === 'pending',
        default   => row_status($r) === $status,
    };
}));

usort($rows, static function ($a, $b) use ($sort) {
    return match ($sort) {
        'name'   => strcasecmp($a['user']['name'], $b['user']['name']),
        'expiry' => ($a['membership']['expiryDate'] ?? '9999') <=> ($b['membership']['expiryDate'] ?? '9999'),
        default  => strcmp((string) $b['user']['created_at'], (string) $a['user']['created_at']),
    };
});

$result = paginate($rows, $page, $perPage);
$result['items'] = array_map(static fn ($r) => admin_customer($r['user'], $r['membership']), $result['items']);
json_success('OK', $result);
