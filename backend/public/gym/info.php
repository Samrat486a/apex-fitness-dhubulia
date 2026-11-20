<?php
declare(strict_types=1);

require __DIR__ . '/../_init.php';
allow_methods('GET');

json_success('OK', ['gym' => public_gym_info()]);
