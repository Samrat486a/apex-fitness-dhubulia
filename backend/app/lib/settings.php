<?php
declare(strict_types=1);

/*
 * Gym settings (contact details, opening hours, reminder switches) stored in `settings`.
 * Only keys listed in SETTINGS_SCHEMA can be read publicly or changed by staff.
 */

const SETTINGS_SCHEMA = [
    // key                    => [public?, type]
    'gym_name'             => [true,  'string'],
    'gym_tagline'          => [true,  'string'],
    'gym_address'          => [true,  'string'],
    'gym_phone'            => [true,  'string'],
    'gym_whatsapp'         => [true,  'string'],
    'gym_email'            => [true,  'string'],
    'gym_hours_weekdays'   => [true,  'string'],
    'gym_hours_weekends'   => [true,  'string'],
    'gym_map_url'          => [true,  'url'],
    'gym_map_query'        => [true,  'map'],
    'reminders_email'      => [false, 'bool'],
    'reminders_whatsapp'   => [false, 'bool'],
    'reminders_dashboard'  => [false, 'bool'],
    'reminder_first_days'  => [false, 'days'],
    'reminder_second_days' => [false, 'days'],
];

/** @return array<string,string> */
function settings_all(bool $refresh = false): array
{
    static $cache = null;
    if ($cache === null || $refresh) {
        $cache = [];
        foreach (db()->query('SELECT setting_key, setting_value FROM settings') as $row) {
            $cache[$row['setting_key']] = (string) $row['setting_value'];
        }
    }
    return $cache;
}

function setting(string $key, string $default = ''): string
{
    return settings_all()[$key] ?? $default;
}

function setting_bool(string $key, bool $default = true): bool
{
    $v = settings_all()[$key] ?? null;
    return $v === null ? $default : $v === '1';
}

function setting_int(string $key, int $default): int
{
    $v = settings_all()[$key] ?? null;
    return is_numeric($v) ? (int) $v : $default;
}

/** Gym details shown on the website and member dashboard. */
function public_gym_info(): array
{
    $all = settings_all();
    return [
        'name'          => $all['gym_name'] ?? 'Apex Fitness',
        'tagline'       => $all['gym_tagline'] ?? '',
        'address'       => $all['gym_address'] ?? '',
        'phone'         => $all['gym_phone'] ?? '',
        'whatsapp'      => $all['gym_whatsapp'] ?? '',
        'email'         => $all['gym_email'] ?? '',
        'hoursWeekdays' => $all['gym_hours_weekdays'] ?? '',
        'hoursWeekends' => $all['gym_hours_weekends'] ?? '',
        'mapUrl'        => $all['gym_map_url'] ?? '',
        // What the embedded map shows: a place name or "lat, lng". Falls back to the address.
        'mapQuery'      => ($all['gym_map_query'] ?? '') !== '' ? $all['gym_map_query'] : ($all['gym_address'] ?? ''),
    ];
}

/** Settings as the admin form sees them (typed values). */
function admin_settings(): array
{
    $out = [];
    foreach (SETTINGS_SCHEMA as $key => [, $type]) {
        $raw = setting($key);
        $out[$key] = match ($type) {
            'bool' => $raw === '1',
            'days' => (int) ($raw ?: 0),
            default => $raw,
        };
    }
    return $out;
}

/** @param array<string,mixed> $input */
function save_settings(array $input): void
{
    $errors = [];
    $clean = [];
    foreach (SETTINGS_SCHEMA as $key => [, $type]) {
        if (!array_key_exists($key, $input)) {
            continue;
        }
        $value = $input[$key];
        switch ($type) {
            case 'bool':
                $clean[$key] = filter_var($value, FILTER_VALIDATE_BOOLEAN) ? '1' : '0';
                break;
            case 'days':
                $n = filter_var($value, FILTER_VALIDATE_INT);
                if ($n === false || $n < 1 || $n > 30) {
                    $errors[$key] = 'Use a number of days between 1 and 30.';
                }
                $clean[$key] = (string) $n;
                break;
            case 'map':
                // place name / address, or "latitude, longitude"
                $s = trim(preg_replace('/\s+/u', ' ', (string) $value) ?? '');
                if (preg_match('/^(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)$/', $s, $m)
                    && (abs((float) $m[1]) > 90 || abs((float) $m[2]) > 180)) {
                    $errors[$key] = 'Those coordinates are out of range.';
                }
                $clean[$key] = mb_substr($s, 0, 200);
                break;
            case 'url':
                $s = trim((string) $value);
                if ($s !== '' && !preg_match('#^https://#i', $s)) {
                    $errors[$key] = 'Use a full https:// link.';
                }
                $clean[$key] = mb_substr($s, 0, 500);
                break;
            default:
                $clean[$key] = mb_substr(trim((string) $value), 0, 300);
        }
    }
    $first = (int) ($clean['reminder_first_days'] ?? setting('reminder_first_days', '5'));
    $second = (int) ($clean['reminder_second_days'] ?? setting('reminder_second_days', '3'));
    if (!isset($errors['reminder_second_days']) && $second >= $first) {
        $errors['reminder_second_days'] = 'The second reminder must come after the first (fewer days left).';
    }
    fail_if_errors($errors);

    $stmt = db()->prepare('INSERT INTO settings (setting_key, setting_value) VALUES (?, ?)
                           ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)');
    foreach ($clean as $k => $v) {
        $stmt->execute([$k, $v]);
    }
    settings_all(true);
}
