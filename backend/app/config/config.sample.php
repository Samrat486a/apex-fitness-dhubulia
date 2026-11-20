<?php
declare(strict_types=1);

/*
 * Apex Fitness — configuration template.
 * Copy to config.php (git-ignored) and fill in real values. This file is never served.
 */
return [
    'env' => 'development',                  // 'production' on the live server
    'timezone' => 'Asia/Kolkata',            // gym-local time: membership days roll over at local midnight
    'app_url' => 'http://localhost:5173',    // public website URL (used in emails)

    'db' => [
        'host' => '127.0.0.1',
        'port' => 3306,
        'name' => 'apex_fitness',
        'user' => 'root',
        'pass' => '',
    ],

    'security' => [
        'session_name'  => 'apex_session',
        'session_days'  => 30,
        'cookie_secure' => false,            // true in production (HTTPS)
        'client_ip_header' => '',            // e.g. 'HTTP_X_FORWARDED_FOR' behind a proxy/CDN
        // Only for hosts whose cron can just call a URL: /api/cron/reminders.php?key=… (24+ chars).
        // Generate: php -r "echo bin2hex(random_bytes(24));"   Leave empty to disable the URL trigger.
        'cron_key' => '',
    ],

    // Only needed if the React app is served from a different origin than /api.
    'cors_allowed_origins' => ['http://localhost:5173'],

    /*
     * Email reminders.
     *   driver 'log'  → messages are written to storage/logs (local development)
     *   driver 'smtp' → real email (Hostinger: smtp.hostinger.com, port 465, encryption 'ssl')
     *   driver 'mail' → PHP mail()
     */
    'mail' => [
        'driver'     => 'log',
        'host'       => 'smtp.hostinger.com',
        'port'       => 465,
        'encryption' => 'ssl',               // 'ssl' (465) or 'tls' (587, STARTTLS)
        'username'   => '',
        'password'   => '',
        'from_email' => 'no-reply@apexfitness.example',
        'from_name'  => 'Apex Fitness',
    ],

    /*
     * WhatsApp reminders via the WhatsApp Business Cloud API (Meta).
     *   driver 'log'       → written to storage/logs (local development)
     *   driver 'cloud_api' → real messages. Business-initiated messages must use an approved
     *                        template. Create one (e.g. "membership_expiry") with two body
     *                        parameters: {{1}} = member name, {{2}} = days remaining.
     */
    'whatsapp' => [
        'driver'          => 'log',
        'phone_number_id' => '',
        'access_token'    => '',
        'api_version'     => 'v20.0',
        'template_name'   => 'membership_expiry',
        'template_lang'   => 'en',
        'default_country_code' => '91',
    ],
];
