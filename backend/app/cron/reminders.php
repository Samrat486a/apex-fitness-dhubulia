<?php
declare(strict_types=1);

/**
 * Daily membership reminder job.
 *
 *   Hostinger → Advanced → Cron Jobs → "PHP", every day at 09:00:
 *       /usr/bin/php /home/uXXXX/apex_app/cron/reminders.php
 *   XAMPP (macOS):
 *       /Applications/XAMPP/xamppfiles/bin/php /Applications/XAMPP/xamppfiles/apex_app/cron/reminders.php
 *
 * Safe to run as often as you like (hourly is fine): every reminder is created once
 * per membership, type and channel, so nothing is ever sent twice.
 */

if (PHP_SAPI !== 'cli') {
    http_response_code(404);
    exit;
}

require dirname(__DIR__) . '/bootstrap.php';

$summary = run_reminders();
db()->prepare("INSERT INTO settings (setting_key, setting_value) VALUES ('reminders_last_run', ?)
               ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)")->execute([date('Y-m-d H:i:s')]);

$line = sprintf('checked=%d created=%d sent=%d failed=%d skipped=%d retried=%d',
    $summary['checked'], $summary['created'], $summary['sent'], $summary['failed'], $summary['skipped'], $summary['retried']);
log_line('cron', 'reminders ' . $line);
echo '[' . date('Y-m-d H:i:s') . "] Apex reminders: $line\n";
