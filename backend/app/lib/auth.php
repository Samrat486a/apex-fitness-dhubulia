<?php
declare(strict_types=1);

/*
 * Authentication & authorisation on top of PHP sessions.
 * The session only stores the user id; role and status are re-read from MySQL on every
 * request, so promoting/deactivating someone takes effect immediately.
 */

function find_user_by_id(int $id): ?array
{
    $stmt = db()->prepare('SELECT * FROM users WHERE id = ?');
    $stmt->execute([$id]);
    return $stmt->fetch() ?: null;
}

function find_user_by_email(string $email): ?array
{
    $stmt = db()->prepare('SELECT * FROM users WHERE email = ?');
    $stmt->execute([strtolower($email)]);
    return $stmt->fetch() ?: null;
}

/** The signed-in user, or null. */
function current_user(): ?array
{
    static $cached = false;
    if ($cached !== false) {
        return $cached;
    }
    session_boot();
    $id = (int) ($_SESSION['user_id'] ?? 0);
    $user = $id > 0 ? find_user_by_id($id) : null;
    if ($user && !(int) $user['is_active']) {
        $user = null;
    }
    return $cached = $user;
}

function require_login(): array
{
    $user = current_user();
    if (!$user) {
        json_error('Please sign in to continue.', 401, [], 'UNAUTHENTICATED');
    }
    return $user;
}

function require_admin(): array
{
    $user = require_login();
    if ($user['role'] !== 'admin') {
        json_error('You do not have access to this area.', 403, [], 'FORBIDDEN');
    }
    return $user;
}

function login_user(array $user): void
{
    session_rotate();
    $_SESSION['user_id'] = (int) $user['id'];
    unset($_SESSION['csrf']);   // new session → new CSRF token
    db()->prepare('UPDATE users SET last_login_at = NOW() WHERE id = ?')->execute([$user['id']]);
}

/** The user as the React app sees it (never includes the password hash or staff notes). */
function public_user(array $u): array
{
    return [
        'id'               => (int) $u['id'],
        'name'             => $u['name'],
        'email'            => $u['email'],
        'phone'            => $u['phone'],
        'role'             => $u['role'],
        'dateOfBirth'      => $u['date_of_birth'],
        'gender'           => $u['gender'],
        'address'          => $u['address'],
        'onboardingStatus' => $u['onboarding_status'],
        'emailOptIn'       => (bool) $u['email_opt_in'],
        'whatsappOptIn'    => (bool) $u['whatsapp_opt_in'],
        'createdAt'        => $u['created_at'],
    ];
}

/**
 * Personal details (membership form + profile). Email must stay unique.
 * @return array{name:string,email:string,phone:?string,date_of_birth:?string,gender:?string,address:string}
 */
function validate_personal_input(array $in, array &$errors, int $userId): array
{
    $today = new DateTimeImmutable(today());
    $data = [
        'name'          => v_string($in, 'name', $errors, 2, 120, 'Full name'),
        'email'         => v_email($in, 'email', $errors),
        'phone'         => v_phone($in, 'phone', $errors),
        'date_of_birth' => v_date($in, 'dateOfBirth', $errors, 'Date of birth', true,
            $today->modify('-100 years')->format('Y-m-d'), $today->modify('-10 years')->format('Y-m-d')),
        'gender'        => v_enum($in, 'gender', $errors, ['male', 'female', 'other', 'prefer_not'], 'gender'),
        'address'       => v_text($in, 'address', $errors, 5, 500, 'Address'),
    ];
    if (!isset($errors['email'])) {
        $other = find_user_by_email($data['email']);
        if ($other && (int) $other['id'] !== $userId) {
            $errors['email'] = 'Another account already uses this email.';
        }
    }
    return $data;
}

function save_personal_details(int $userId, array $d): void
{
    db()->prepare('UPDATE users SET name = ?, email = ?, phone = ?, date_of_birth = ?, gender = ?, address = ? WHERE id = ?')
        ->execute([$d['name'], $d['email'], $d['phone'], $d['date_of_birth'], $d['gender'], $d['address'], $userId]);
}
