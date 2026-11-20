<?php
declare(strict_types=1);

require __DIR__ . '/../_init.php';
allow_methods('GET');

// Who is signed in (or null) + the CSRF token the app must send with every POST.
$user = current_user();
json_success('OK', [
    'user'      => $user ? public_user($user) : null,
    'csrfToken' => csrf_token(),
]);
