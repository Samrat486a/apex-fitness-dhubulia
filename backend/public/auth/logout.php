<?php
declare(strict_types=1);

require __DIR__ . '/../_init.php';
allow_methods('POST');
require_csrf();

session_destroy_completely();
json_success('Signed out.');
