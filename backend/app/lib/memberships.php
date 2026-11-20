<?php
declare(strict_types=1);

/*
 * Membership rules — the single source of truth (the React app mirrors them in
 * src/lib/membership.ts only for live previews in forms):
 *
 *   expiry_date    = start_date + duration_days
 *   days_remaining = expiry_date − today        (today in gym-local time)
 *   status         = upcoming  (today < start_date)
 *                    expired   (days_remaining ≤ 0)
 *                    expiring  (days_remaining ≤ first reminder, default 5)
 *                    active    (otherwise)
 */

function today(): string
{
    return date('Y-m-d');
}

function days_between(string $from, string $to): int
{
    return (int) (new DateTimeImmutable($from))->diff(new DateTimeImmutable($to))->format('%r%a');
}

function calc_expiry(string $startDate, int $durationDays): string
{
    return (new DateTimeImmutable($startDate))->modify('+' . $durationDays . ' days')->format('Y-m-d');
}

/** @return array{status:string,daysRemaining:int,daysElapsed:int,progress:float} */
function membership_state(array $m): array
{
    $today = today();
    $duration = max(1, (int) $m['duration_days']);
    $remaining = days_between($today, (string) $m['expiry_date']);
    $elapsed = days_between((string) $m['start_date'], $today);

    if ($today < $m['start_date']) {
        $status = 'upcoming';
    } elseif ($remaining <= 0) {
        $status = 'expired';
    } elseif ($remaining <= setting_int('reminder_first_days', 5)) {
        $status = 'expiring';
    } else {
        $status = 'active';
    }

    return [
        'status'        => $status,
        'daysRemaining' => max(0, min($remaining, $duration)),
        'daysElapsed'   => max(0, min($elapsed, $duration)),
        'progress'      => round(max(0, min(1, $elapsed / $duration)), 4),
    ];
}

/** A membership row as the React app sees it. */
function public_membership(array $m): array
{
    return array_merge([
        'id'                 => (int) $m['id'],
        'userId'             => (int) $m['user_id'],
        'planId'             => $m['plan_id'] !== null ? (int) $m['plan_id'] : null,
        'planName'           => $m['plan_name'],
        'purchaseDate'       => $m['purchase_date'],
        'startDate'          => $m['start_date'],
        'durationDays'       => (int) $m['duration_days'],
        'expiryDate'         => $m['expiry_date'],
        'verificationStatus' => $m['verification_status'],
        'source'             => $m['source'],
        'receiptNumber'      => $m['receipt_number'],
        'createdAt'          => $m['created_at'],
    ], membership_state($m));
}

/** All memberships of a user, newest first (cancelled ones hidden). */
function user_memberships(int $userId): array
{
    $stmt = db()->prepare('SELECT * FROM memberships WHERE user_id = ? AND is_cancelled = 0 ORDER BY start_date DESC, id DESC');
    $stmt->execute([$userId]);
    return $stmt->fetchAll();
}

/**
 * The membership to show on the dashboard:
 *   1. a running one (latest expiry wins), else
 *   2. the next upcoming one, else
 *   3. the most recently expired one.
 * Rejected memberships are never "current".
 */
function pick_current_membership(array $rows): ?array
{
    $today = today();
    $rows = array_values(array_filter($rows, static fn ($m) => $m['verification_status'] !== 'rejected'));
    $running = array_filter($rows, static fn ($m) => $m['start_date'] <= $today && $m['expiry_date'] > $today);
    if ($running) {
        usort($running, static fn ($a, $b) => strcmp($b['expiry_date'], $a['expiry_date']));
        return $running[0];
    }
    $upcoming = array_filter($rows, static fn ($m) => $m['start_date'] > $today);
    if ($upcoming) {
        usort($upcoming, static fn ($a, $b) => strcmp($a['start_date'], $b['start_date']));
        return reset($upcoming);
    }
    usort($rows, static fn ($a, $b) => strcmp($b['expiry_date'], $a['expiry_date']));
    return $rows[0] ?? null;
}

function current_membership(int $userId): ?array
{
    return pick_current_membership(user_memberships($userId));
}

function find_plan(int $id): ?array
{
    $stmt = db()->prepare('SELECT * FROM membership_plans WHERE id = ?');
    $stmt->execute([$id]);
    return $stmt->fetch() ?: null;
}

function public_plan(array $p): array
{
    $features = json_decode((string) ($p['features'] ?? '[]'), true);
    return [
        'id'           => (int) $p['id'],
        'slug'         => $p['slug'],
        'name'         => $p['name'],
        'durationDays' => (int) $p['duration_days'],
        'price'        => $p['price'] !== null ? (float) $p['price'] : null,
        'tagline'      => $p['tagline'],
        'features'     => is_array($features) ? array_values(array_map('strval', $features)) : [],
        'isFeatured'   => (bool) $p['is_featured'],
        'isActive'     => (bool) $p['is_active'],
        'sortOrder'    => (int) $p['sort_order'],
    ];
}

/**
 * Validates membership fields from a form.
 * @return array{plan:array,purchase_date:string,start_date:string,duration_days:int,expiry_date:string,receipt_number:?string}
 */
function validate_membership_input(array $in, array &$errors): array
{
    $plan = null;
    $planId = filter_var($in['planId'] ?? null, FILTER_VALIDATE_INT);
    if ($planId) {
        $plan = find_plan((int) $planId);
    }
    if (!$plan) {
        $errors['planId'] = 'Choose your membership plan.';
    }

    $today = new DateTimeImmutable(today());
    $twoYearsAgo = $today->modify('-2 years')->format('Y-m-d');
    $purchase = v_date($in, 'purchaseDate', $errors, 'Purchase date', true, $twoYearsAgo, $today->format('Y-m-d'));
    $start = v_date($in, 'startDate', $errors, 'Start date', true, $twoYearsAgo, $today->modify('+90 days')->format('Y-m-d'));
    if ($purchase && $start && $start < $purchase) {
        $errors['startDate'] = 'Start date can’t be before the purchase date.';
    }

    $duration = v_int(
        ['durationDays' => $in['durationDays'] ?? ($plan['duration_days'] ?? null)],
        'durationDays', $errors, 1, 730, 'Membership duration'
    );

    $receipt = trim((string) ($in['receiptNumber'] ?? ''));
    if (mb_strlen($receipt) > 60) {
        $errors['receiptNumber'] = 'Receipt number is too long.';
    }

    return [
        'plan'           => $plan ?? [],
        'purchase_date'  => (string) $purchase,
        'start_date'     => (string) $start,
        'duration_days'  => $duration,
        'expiry_date'    => $start && $duration > 0 ? calc_expiry($start, $duration) : '',
        'receipt_number' => $receipt !== '' ? $receipt : null,
    ];
}

/** Inserts a validated membership and returns the stored row. */
function create_membership(int $userId, array $data, string $source): array
{
    $pdo = db();
    $pdo->prepare(
        'INSERT INTO memberships (user_id, plan_id, plan_name, purchase_date, start_date, duration_days, expiry_date,
                                  verification_status, source, receipt_number)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    )->execute([
        $userId,
        (int) $data['plan']['id'],
        $data['plan']['name'],
        $data['purchase_date'],
        $data['start_date'],
        $data['duration_days'],
        $data['expiry_date'],
        $source === 'admin' ? 'verified' : 'pending',
        $source,
        $data['receipt_number'],
    ]);
    $id = (int) $pdo->lastInsertId();
    $stmt = $pdo->prepare('SELECT * FROM memberships WHERE id = ?');
    $stmt->execute([$id]);
    return $stmt->fetch();
}
