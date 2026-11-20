<?php
declare(strict_types=1);

require __DIR__ . '/../_init.php';
allow_methods('GET', 'POST');
require_admin();

if (request_method() === 'GET') {
    $rows = db()->query('SELECT p.*, (SELECT COUNT(*) FROM memberships m WHERE m.plan_id = p.id AND m.is_cancelled = 0) AS uses
                         FROM membership_plans p ORDER BY sort_order, duration_days')->fetchAll();
    json_success('OK', ['plans' => array_map(static fn ($p) => public_plan($p) + ['memberships' => (int) $p['uses']], $rows)]);
}

// POST { id?, name, durationDays, price?, tagline, features[], isFeatured, isActive, sortOrder }
require_csrf();
$in = json_body();
$errors = [];
$id = (int) ($in['id'] ?? 0);
$name = v_string($in, 'name', $errors, 2, 80, 'Plan name');
$duration = v_int($in, 'durationDays', $errors, 1, 730, 'Duration');
$price = null;
if (($in['price'] ?? '') !== '' && $in['price'] !== null) {
    if (!is_numeric($in['price']) || (float) $in['price'] < 0 || (float) $in['price'] > 1000000) {
        $errors['price'] = 'Enter a valid price (or leave empty to hide it).';
    } else {
        $price = round((float) $in['price'], 2);
    }
}
$tagline = v_string($in, 'tagline', $errors, 0, 160, 'Tagline');
$features = array_values(array_filter(array_map(
    static fn ($f) => mb_substr(trim((string) $f), 0, 120),
    is_array($in['features'] ?? null) ? $in['features'] : []
)));
if (count($features) > 10) {
    $errors['features'] = 'Use at most 10 features.';
}
$sort = (int) ($in['sortOrder'] ?? 0);
fail_if_errors($errors);

$slug = trim(preg_replace('/[^a-z0-9]+/', '-', strtolower($name)) ?? '', '-') ?: 'plan';
$params = [$name, $duration, $price, $tagline ?: null, json_encode($features, JSON_UNESCAPED_UNICODE),
    v_bool($in, 'isFeatured') ? 1 : 0, v_bool($in, 'isActive', true) ? 1 : 0, $sort];

if ($id > 0) {
    if (!find_plan($id)) {
        json_error('Plan not found.', 404, [], 'NOT_FOUND');
    }
    db()->prepare('UPDATE membership_plans SET name = ?, duration_days = ?, price = ?, tagline = ?, features = ?, is_featured = ?, is_active = ?, sort_order = ? WHERE id = ?')
        ->execute([...$params, $id]);
} else {
    $exists = db()->prepare('SELECT COUNT(*) FROM membership_plans WHERE slug = ?');
    $exists->execute([$slug]);
    if ((int) $exists->fetchColumn() > 0) {
        $slug .= '-' . substr(bin2hex(random_bytes(3)), 0, 4);
    }
    db()->prepare('INSERT INTO membership_plans (name, duration_days, price, tagline, features, is_featured, is_active, sort_order, slug) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)')
        ->execute([...$params, $slug]);
    $id = (int) db()->lastInsertId();
}
json_success('Plan saved.', ['plan' => public_plan(find_plan($id))]);
