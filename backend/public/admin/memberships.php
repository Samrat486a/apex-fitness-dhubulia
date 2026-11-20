<?php
declare(strict_types=1);

require __DIR__ . '/../_init.php';
allow_methods('GET');
require_admin();

/*
 * Every membership record (all purchases and renewals), newest first.
 * GET ?q=&status=all|active|expiring|expired|upcoming&verification=all|pending|verified|rejected&plan=&page=
 */
$status = query_param('status', 'all');
$verification = query_param('verification', 'all');
$planId = (int) query_param('plan', '0');
$q = mb_substr(query_param('q'), 0, 100);
['page' => $page, 'perPage' => $perPage] = pagination();

$sql = 'SELECT m.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone
        FROM memberships m JOIN users u ON u.id = m.user_id WHERE m.is_cancelled = 0';
$params = [];
if ($q !== '') {
    $sql .= ' AND (u.name LIKE ? OR u.email LIKE ? OR u.phone LIKE ? OR m.receipt_number LIKE ?)';
    $like = '%' . addcslashes($q, '%_\\') . '%';
    array_push($params, $like, $like, $like, $like);
}
if (in_array($verification, ['pending', 'verified', 'rejected'], true)) {
    $sql .= ' AND m.verification_status = ?';
    $params[] = $verification;
}
if ($planId > 0) {
    $sql .= ' AND m.plan_id = ?';
    $params[] = $planId;
}
$stmt = db()->prepare($sql . ' ORDER BY m.start_date DESC, m.id DESC');
$stmt->execute($params);

$items = [];
foreach ($stmt->fetchAll() as $row) {
    $m = public_membership($row);
    if ($status !== 'all' && $m['status'] !== $status) {
        continue;
    }
    $items[] = $m + ['userName' => $row['user_name'], 'userEmail' => $row['user_email'], 'userPhone' => $row['user_phone']];
}
json_success('OK', paginate($items, $page, $perPage));
