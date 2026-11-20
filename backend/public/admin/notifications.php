<?php
declare(strict_types=1);

require __DIR__ . '/../_init.php';
allow_methods('GET', 'POST');
require_admin();

if (request_method() === 'GET') {
    // GET ?channel=all|dashboard|email|whatsapp&status=all|pending|sent|failed|skipped&q=&page=
    ['page' => $page, 'perPage' => $perPage] = pagination();
    $where = ['1 = 1'];
    $params = [];
    $channel = query_param('channel', 'all');
    if (in_array($channel, ['dashboard', 'email', 'whatsapp'], true)) {
        $where[] = 'n.channel = ?';
        $params[] = $channel;
    }
    $status = query_param('status', 'all');
    if (in_array($status, ['pending', 'sent', 'failed', 'skipped'], true)) {
        $where[] = 'n.status = ?';
        $params[] = $status;
    }
    $q = mb_substr(query_param('q'), 0, 100);
    if ($q !== '') {
        $where[] = '(u.name LIKE ? OR u.email LIKE ? OR n.recipient LIKE ?)';
        $like = '%' . addcslashes($q, '%_\\') . '%';
        array_push($params, $like, $like, $like);
    }
    $whereSql = implode(' AND ', $where);

    $count = db()->prepare("SELECT COUNT(*) FROM notifications n JOIN users u ON u.id = n.user_id WHERE $whereSql");
    $count->execute($params);
    $total = (int) $count->fetchColumn();
    $pages = max(1, (int) ceil($total / $perPage));
    $page = min($page, $pages);

    $stmt = db()->prepare("SELECT n.*, u.name AS user_name FROM notifications n JOIN users u ON u.id = n.user_id
                           WHERE $whereSql ORDER BY n.created_at DESC, n.id DESC LIMIT $perPage OFFSET " . (($page - 1) * $perPage));
    $stmt->execute($params);

    $totals = db()->query("SELECT channel, status, COUNT(*) AS c FROM notifications GROUP BY channel, status")->fetchAll();
    json_success('OK', [
        'items'   => array_map('public_notification', $stmt->fetchAll()),
        'total'   => $total, 'page' => $page, 'perPage' => $perPage, 'pages' => $pages,
        'summary' => array_map(static fn ($r) => ['channel' => $r['channel'], 'status' => $r['status'], 'count' => (int) $r['c']], $totals),
    ]);
}

// POST { id } → retry a failed/pending email or WhatsApp message (same row, never a duplicate).
require_csrf();
$id = (int) (json_body()['id'] ?? 0);
$n = $id > 0 ? find_notification($id) : null;
if (!$n) {
    json_error('Notification not found.', 404, [], 'NOT_FOUND');
}
if (!in_array($n['status'], ['failed', 'pending'], true)) {
    json_error('Only failed or pending messages can be retried.', 409, [], 'NOT_RETRYABLE');
}
$status = dispatch_notification($id);
$fresh = find_notification($id);
json_success($status === 'sent' ? 'Message sent.' : 'Still failing: ' . ($fresh['error'] ?? 'unknown error'), ['notification' => public_notification($fresh)]);
