<?php
declare(strict_types=1);

require __DIR__ . '/../_init.php';
allow_methods('GET', 'POST');
require_admin();

if (request_method() === 'GET') {
    ['page' => $page, 'perPage' => $perPage] = pagination();
    $rows = db()->query('SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 500')->fetchAll();
    $items = array_map(static fn ($m) => [
        'id' => (int) $m['id'], 'name' => $m['name'], 'email' => $m['email'], 'phone' => $m['phone'],
        'topic' => $m['topic'], 'message' => $m['message'], 'status' => $m['status'], 'createdAt' => $m['created_at'],
    ], $rows);
    json_success('OK', paginate($items, $page, $perPage));
}

require_csrf();
$in = json_body();
$errors = [];
$status = v_enum($in, 'status', $errors, ['new', 'handled'], 'status');
fail_if_errors($errors);
db()->prepare('UPDATE contact_messages SET status = ? WHERE id = ?')->execute([$status, (int) ($in['id'] ?? 0)]);
json_success('Message updated.');
