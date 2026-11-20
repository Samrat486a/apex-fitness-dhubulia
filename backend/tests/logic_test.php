<?php
declare(strict_types=1);

/**
 * Unit tests for the membership + reminder rules (no database needed).
 *
 *   php backend/tests/logic_test.php
 *
 * Settings/config/database helpers are stubbed so the pure functions in app/lib can be
 * exercised directly. Exit code 0 = all passed.
 */

date_default_timezone_set('Asia/Kolkata');

// ── stubs for helpers normally provided by bootstrap/settings/errors ──
$GLOBALS['__settings'] = ['reminder_first_days' => '5', 'reminder_second_days' => '3'];
function setting_int(string $k, int $d): int { return isset($GLOBALS['__settings'][$k]) ? (int) $GLOBALS['__settings'][$k] : $d; }
function setting(string $k, string $d = ''): string { return $GLOBALS['__settings'][$k] ?? $d; }
function setting_bool(string $k, bool $d = true): bool { return ($GLOBALS['__settings'][$k] ?? ($d ? '1' : '0')) === '1'; }
function config(string $k, $d = null) { return ['whatsapp.default_country_code' => '91'][$k] ?? $d; }
function log_line(string $c, string $m): void {}
function log_error(string $m): void {}

$lib = dirname(__DIR__) . '/app/lib/';
require $lib . 'validate.php';
require $lib . 'memberships.php';
require $lib . 'whatsapp.php';
require $lib . 'notifications.php';
require $lib . 'reminders.php';

$failures = 0;
$count = 0;
function check(string $name, $expected, $actual): void
{
    global $failures, $count;
    $count++;
    if ($expected === $actual) {
        echo "  ✓ $name\n";
        return;
    }
    $failures++;
    echo "  ✗ $name\n      expected: " . var_export($expected, true) . "\n      actual:   " . var_export($actual, true) . "\n";
}

$today = today();
$d = static fn (int $offset) => (new DateTimeImmutable($today))->modify(($offset >= 0 ? '+' : '') . $offset . ' days')->format('Y-m-d');
$m = static fn (int $startOffset, int $duration) => [
    'start_date' => $d($startOffset), 'duration_days' => $duration,
    'expiry_date' => calc_expiry($d($startOffset), $duration), 'verification_status' => 'verified',
];

echo "Expiry calculation\n";
check('30-day plan from 1 Oct expires 31 Oct', '2026-10-31', calc_expiry('2026-10-01', 30));
check('90-day plan crosses year end', '2027-01-29', calc_expiry('2026-10-31', 90));
check('365-day plan across a leap day', '2028-02-29', calc_expiry('2027-03-01', 365));
check('180-day plan from 1 Apr expires 28 Sep', '2026-09-28', calc_expiry('2026-04-01', 180));

echo "Membership state\n";
check('starts today → full days remaining', ['active', 30], array_values(array_intersect_key(membership_state($m(0, 30)), ['status' => 1, 'daysRemaining' => 1])));
check('6 days left → active', 'active', membership_state($m(-24, 30))['status']);
check('5 days left → expiring', ['expiring', 5], [membership_state($m(-25, 30))['status'], membership_state($m(-25, 30))['daysRemaining']]);
check('3 days left → expiring', 3, membership_state($m(-27, 30))['daysRemaining']);
check('expiry date is today → expired, 0 days', ['expired', 0], [membership_state($m(-30, 30))['status'], membership_state($m(-30, 30))['daysRemaining']]);
check('starts in future → upcoming', 'upcoming', membership_state($m(3, 30))['status']);
check('progress halfway', 0.5, membership_state($m(-15, 30))['progress']);

echo "Reminder windows (first = 5, second = 3)\n";
check('6 days → nothing', null, due_reminder_type(6));
check('5 days → first', 'reminder_first', due_reminder_type(5));
check('4 days → first (missed cron still sends)', 'reminder_first', due_reminder_type(4));
check('3 days → second', 'reminder_second', due_reminder_type(3));
check('1 day → second', 'reminder_second', due_reminder_type(1));
check('0 days → expired notice', 'expired', due_reminder_type(0));
check('7 days after expiry → expired notice', 'expired', due_reminder_type(-7));
check('8 days after expiry → nothing (no spam for old history)', null, due_reminder_type(-8));
$GLOBALS['__settings'] = ['reminder_first_days' => '7', 'reminder_second_days' => '2'];
check('custom windows: 7 days → first', 'reminder_first', due_reminder_type(7));
check('custom windows: 3 days → first', 'reminder_first', due_reminder_type(3));
check('custom windows: 2 days → second', 'reminder_second', due_reminder_type(2));
$GLOBALS['__settings'] = ['reminder_first_days' => '5', 'reminder_second_days' => '3'];

echo "Reminder copy\n";
$copy = reminder_copy('reminder_second', 'Arjun Das', 3, '2026-10-04');
check('title', 'Membership expires in 3 days', $copy['title']);
check('message contains the required sentence', true, str_contains($copy['message'], 'your Apex Fitness membership expires in 3 days'));
check('singular day', 'Membership expires in 1 day', reminder_copy('reminder_second', 'A', 1, '2026-10-04')['title']);

echo "Current membership selection\n";
$old = ['id' => 1] + $m(-100, 30);
$running = ['id' => 2] + $m(-10, 90);
$renewal = ['id' => 3] + $m(80, 90);
check('running beats upcoming renewal', 2, pick_current_membership([$old, $running, $renewal])['id']);
check('upcoming when nothing is running', 3, pick_current_membership([$old, $renewal])['id']);
check('latest expired when all expired', 1, pick_current_membership([$old])['id']);
check('rejected never current', null, pick_current_membership([['id' => 9, 'verification_status' => 'rejected'] + $m(-5, 30)]));

echo "Phone numbers\n";
$e = [];
check('10 digits → +91', '+919830011223', v_phone(['p' => '98300 11223'], 'p', $e));
check('+91 prefix kept', '+919830011223', v_phone(['p' => '+91 98300-11223'], 'p', $e));
check('leading 0 removed', '+919830011223', v_phone(['p' => '09830011223'], 'p', $e));
$e = [];
v_phone(['p' => '12345'], 'p', $e);
check('invalid number rejected', true, isset($e['p']));
check('WhatsApp format', '919830011223', whatsapp_number('+919830011223'));
check('WhatsApp adds country code', '919830011223', whatsapp_number('9830011223'));

echo "\n" . ($failures ? "✗ $failures of $count checks failed\n" : "✓ All $count checks passed\n");
exit($failures ? 1 : 0);
