<?php
declare(strict_types=1);

require __DIR__ . '/_init.php';
allow_methods('GET');

// Health check: confirms PHP, the database and the private storage folder are working.
// Never reveals paths, versions or credentials.
db()->query('SELECT 1');
$tables = (int) db()->query("SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE()
                             AND table_name IN ('users','membership_plans','memberships','notifications','settings','contact_messages','rate_limits')")->fetchColumn();
$storageOk = is_dir(storage_path('logs')) && is_writable(storage_path('logs')) && is_writable(storage_path('sessions'));

json_success('Apex Fitness API is running', [
    'time'     => date('c'),
    'database' => $tables === 7 ? 'ok' : 'missing tables — import database/schema.sql',
    'storage'  => $storageOk ? 'ok' : 'not writable — check app/storage permissions',
    'https'    => is_https(),
]);
