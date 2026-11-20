<?php
declare(strict_types=1);

/**
 * Creates an admin account, or promotes an existing account to admin.
 *
 *   php backend/scripts/create-admin.php owner@example.com "Owner Name"
 *
 * You'll be asked for a password (not echoed). Run it with the same PHP that serves the site
 * (XAMPP: /Applications/XAMPP/xamppfiles/bin/php).
 */

if (PHP_SAPI !== 'cli') {
    exit(1);
}
require dirname(__DIR__) . '/app/bootstrap.php';

[$script, $email, $name] = array_pad($argv, 3, '');
$email = strtolower(trim($email));
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fwrite(STDERR, "Usage: php create-admin.php email@example.com \"Full Name\"\n");
    exit(1);
}

$existing = find_user_by_email($email);
if ($existing) {
    db()->prepare("UPDATE users SET role = 'admin', is_active = 1 WHERE id = ?")->execute([$existing['id']]);
    echo "✓ {$email} is now an admin.\n";
    exit(0);
}

echo 'Password for the new admin (min 8 chars, letters + a number): ';
system('stty -echo');
$password = trim((string) fgets(STDIN));
system('stty echo');
echo "\n";

$errors = [];
v_password(['password' => $password], 'password', $errors);
if ($errors) {
    fwrite(STDERR, '✗ ' . $errors['password'] . "\n");
    exit(1);
}

db()->prepare("INSERT INTO users (name, email, password_hash, role, onboarding_status) VALUES (?, ?, ?, 'admin', 'not_member')")
    ->execute([$name !== '' ? $name : 'Apex Admin', $email, password_hash($password, PASSWORD_DEFAULT)]);
echo "✓ Admin account created for {$email}. Sign in at /login.\n";
