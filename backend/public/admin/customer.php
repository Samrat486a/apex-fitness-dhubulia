<?php
declare(strict_types=1);

require __DIR__ . '/../_init.php';
allow_methods('GET', 'POST');
require_admin();

$id = (int) (request_method() === 'GET' ? query_param('id') : (json_body()['id'] ?? 0));
$user = $id > 0 ? find_user_by_id($id) : null;
if (!$user || $user['role'] !== 'member') {
    json_error('Customer not found.', 404, [], 'NOT_FOUND');
}

function customer_payload(array $user): array
{
    $rows = user_memberships((int) $user['id']);
    $current = pick_current_membership($rows);
    $n = db()->prepare('SELECT n.*, u.name AS user_name FROM notifications n JOIN users u ON u.id = n.user_id
                        WHERE n.user_id = ? ORDER BY n.created_at DESC, n.id DESC LIMIT 40');
    $n->execute([$user['id']]);
    return [
        'customer'      => admin_customer($user, $current ? public_membership($current) : null)
            + ['dateOfBirth' => $user['date_of_birth'], 'address' => $user['address'], 'notes' => $user['notes']],
        'memberships'   => array_map('public_membership', $rows),
        'notifications' => array_map('public_notification', $n->fetchAll()),
    ];
}

if (request_method() === 'GET') {
    json_success('OK', customer_payload($user));
}

require_csrf();
$in = json_body();
$action = (string) ($in['action'] ?? '');
$errors = [];

switch ($action) {
    case 'update_profile':
        $personal = validate_personal_input($in, $errors, $id);
        $notes = v_text($in, 'notes', $errors, 0, 2000, 'Notes');
        fail_if_errors($errors);
        save_personal_details($id, $personal);
        db()->prepare('UPDATE users SET notes = ?, is_active = ?, email_opt_in = ?, whatsapp_opt_in = ? WHERE id = ?')->execute([
            $notes !== '' ? $notes : null,
            v_bool($in, 'isActive', (bool) $user['is_active']) ? 1 : 0,
            v_bool($in, 'emailOptIn', (bool) $user['email_opt_in']) ? 1 : 0,
            v_bool($in, 'whatsappOptIn', (bool) $user['whatsapp_opt_in']) ? 1 : 0,
            $id,
        ]);
        $message = 'Customer updated.';
        break;

    case 'add_membership':
        // Staff record a membership/renewal sold at the desk → verified immediately.
        $data = validate_membership_input($in, $errors);
        fail_if_errors($errors);
        $row = create_membership($id, $data, 'admin');
        db()->prepare("UPDATE users SET onboarding_status = 'member' WHERE id = ?")->execute([$id]);
        notify_dashboard($id, (int) $row['id'], 'membership_added', 'New membership recorded',
            sprintf('Apex Fitness recorded your %s membership: %s → %s.', $row['plan_name'],
                (new DateTimeImmutable($row['start_date']))->format('j M Y'),
                (new DateTimeImmutable($row['expiry_date']))->format('j M Y')));
        run_reminders($id);
        $message = 'Membership recorded.';
        break;

    case 'update_membership':
        $mid = (int) ($in['membershipId'] ?? 0);
        $stmt = db()->prepare('SELECT * FROM memberships WHERE id = ? AND user_id = ?');
        $stmt->execute([$mid, $id]);
        $existing = $stmt->fetch();
        if (!$existing) {
            json_error('Membership not found.', 404, [], 'NOT_FOUND');
        }
        $data = validate_membership_input($in, $errors);
        fail_if_errors($errors);
        db()->prepare('UPDATE memberships SET plan_id = ?, plan_name = ?, purchase_date = ?, start_date = ?, duration_days = ?,
                       expiry_date = ?, receipt_number = ? WHERE id = ?')
            ->execute([$data['plan']['id'], $data['plan']['name'], $data['purchase_date'], $data['start_date'],
                $data['duration_days'], $data['expiry_date'], $data['receipt_number'], $mid]);
        $message = 'Membership updated.';
        break;

    case 'verify_membership':
        $mid = (int) ($in['membershipId'] ?? 0);
        $status = v_enum($in, 'status', $errors, ['verified', 'rejected', 'pending'], 'status');
        fail_if_errors($errors);
        $stmt = db()->prepare('UPDATE memberships SET verification_status = ? WHERE id = ? AND user_id = ?');
        $stmt->execute([$status, $mid, $id]);
        if ($stmt->rowCount() && $status === 'verified') {
            notify_dashboard($id, $mid, 'membership_verified', 'Membership verified',
                'Apex Fitness has verified your membership. You’re all set — see you on the floor!');
        }
        $message = 'Verification updated.';
        break;

    case 'set_password':
        // Member forgot their password: staff set a temporary one and hand it over in person.
        $password = v_password($in, 'password', $errors);
        fail_if_errors($errors);
        db()->prepare('UPDATE users SET password_hash = ? WHERE id = ?')->execute([password_hash($password, PASSWORD_DEFAULT), $id]);
        $message = 'Password reset. Share it with the member in person and ask them to change it.';
        break;

    case 'cancel_membership':
        $mid = (int) ($in['membershipId'] ?? 0);
        db()->prepare('UPDATE memberships SET is_cancelled = 1 WHERE id = ? AND user_id = ?')->execute([$mid, $id]);
        $message = 'Membership removed.';
        break;

    default:
        json_error('Unknown action.', 400, [], 'BAD_ACTION');
}

json_success($message, customer_payload(find_user_by_id($id)));
