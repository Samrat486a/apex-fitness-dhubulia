<?php
declare(strict_types=1);

/**
 * Finds the private app/ folder and loads it. Every endpoint starts with:
 *   require __DIR__ . '/../_init.php';
 *
 * Where app/ lives:
 *   Hostinger:  /home/uXXXX/apex_app  (outside public_html)
 *   XAMPP:      /Applications/XAMPP/xamppfiles/apex_app
 *   Override:   SetEnv APEX_APP_DIR /absolute/path in .htaccess
 */
(function (): void {
    $candidates = array_filter([
        getenv('APEX_APP_DIR') ?: ($_SERVER['APEX_APP_DIR'] ?? null),
        __DIR__ . '/../../apex_app',
        __DIR__ . '/../../../apex_app',
        __DIR__ . '/../../../../apex_app',
        __DIR__ . '/../app',                       // running straight from the repository
    ]);
    foreach ($candidates as $dir) {
        if (is_file($dir . '/bootstrap.php')) {
            require_once $dir . '/bootstrap.php';
            return;
        }
    }
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => false, 'message' => 'Server not configured: application folder not found.', 'code' => 'APP_NOT_FOUND']);
    exit;
})();
