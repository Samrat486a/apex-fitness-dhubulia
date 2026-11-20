<?php
declare(strict_types=1);

require __DIR__ . '/../_init.php';
allow_methods('POST');
require_csrf();
require_admin();
rate_limit('reminders-run', 20, 3600);

$summary = run_reminders();
db()->prepare("INSERT INTO settings (setting_key, setting_value) VALUES ('reminders_last_run', ?)
               ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)")->execute([date('Y-m-d H:i:s')]);

$msg = $summary['created'] === 0
    ? 'All caught up — no new reminders were due.'
    : sprintf('%d new reminder(s): %d sent, %d failed, %d skipped.', $summary['created'], $summary['sent'], $summary['failed'], $summary['skipped']);
json_success($msg, ['summary' => $summary]);
