<?php
declare(strict_types=1);

require __DIR__ . '/../_init.php';
allow_methods('GET');

$rows = db()->query('SELECT * FROM membership_plans WHERE is_active = 1 ORDER BY sort_order, duration_days')->fetchAll();
json_success('OK', ['plans' => array_map('public_plan', $rows)]);
