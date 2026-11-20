<?php
declare(strict_types=1);

/**
 * Reminder job over HTTP — for hosts whose cron can only call a URL.
 *
 *   https://YOUR-DOMAIN/api/cron/reminders.php?key=YOUR_CRON_KEY
 *
 * Disabled unless security.cron_key is set in config.php (use a long random value).
 * Prefer the CLI cron (app/cron/reminders.php) when your host supports it. Running it
 * more often than needed is harmless: reminders are never sent twice.
 */

require __DIR__ . '/../_init.php';
allow_methods('GET', 'POST');

$expected = (string) config('security.cron_key', '');
$given = query_param('key');
if ($expected === '' || strlen($expected) < 24 || !hash_equals($expected, $given)) {
    json_error('Not found.', 404, [], 'NOT_FOUND');
}
rate_limit('cron-url', 12, 3600);

$summary = run_reminders();
db()->prepare("INSERT INTO settings (setting_key, setting_value) VALUES ('reminders_last_run', ?)
               ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)")->execute([date('Y-m-d H:i:s')]);
log_line('cron', 'url trigger ' . json_encode($summary));
json_success('Reminders processed.', ['summary' => $summary]);
