<?php
declare(strict_types=1);

require __DIR__ . '/../_init.php';
allow_methods('GET', 'POST');
require_admin();

if (request_method() === 'POST') {
    require_csrf();
    save_settings(json_body());
}

json_success(request_method() === 'POST' ? 'Settings saved.' : 'OK', [
    'settings' => admin_settings(),
    'channels' => [
        'emailDriver'    => (string) config('mail.driver', 'log'),
        'whatsappDriver' => (string) config('whatsapp.driver', 'log'),
    ],
    'remindersLastRun' => setting('reminders_last_run') ?: null,
]);
