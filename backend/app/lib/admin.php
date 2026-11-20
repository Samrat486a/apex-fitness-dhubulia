<?php
declare(strict_types=1);

/*
 * Admin list helpers. A single gym has hundreds to a few thousand members, so we load
 * members + their memberships with two indexed queries and work out each member's
 * current membership in PHP (same rules as the member dashboard), then filter/paginate.
 */

/**
 * Every member with their current membership.
 * @return list<array{user:array,membership:?array}>
 */
function admin_member_rows(string $search = ''): array
{
    $sql = "SELECT * FROM users WHERE role = 'member'";
    $params = [];
    if ($search !== '') {
        $sql .= ' AND (name LIKE ? OR email LIKE ? OR phone LIKE ?)';
        $like = '%' . addcslashes($search, '%_\\') . '%';
        $params = [$like, $like, $like];
    }
    $stmt = db()->prepare($sql . ' ORDER BY created_at DESC');
    $stmt->execute($params);
    $users = $stmt->fetchAll();
    if (!$users) {
        return [];
    }

    $ids = array_map(static fn ($u) => (int) $u['id'], $users);
    $in = implode(',', array_fill(0, count($ids), '?'));
    $mstmt = db()->prepare("SELECT * FROM memberships WHERE is_cancelled = 0 AND user_id IN ($in)");
    $mstmt->execute($ids);
    $byUser = [];
    foreach ($mstmt->fetchAll() as $m) {
        $byUser[(int) $m['user_id']][] = $m;
    }

    $rows = [];
    foreach ($users as $u) {
        $current = pick_current_membership($byUser[(int) $u['id']] ?? []);
        $rows[] = ['user' => $u, 'membership' => $current ? public_membership($current) : null];
    }
    return $rows;
}

/** Compact customer shape for admin tables. */
function admin_customer(array $u, ?array $membership): array
{
    return [
        'id'               => (int) $u['id'],
        'name'             => $u['name'],
        'email'            => $u['email'],
        'phone'            => $u['phone'],
        'gender'           => $u['gender'],
        'onboardingStatus' => $u['onboarding_status'],
        'isActive'         => (bool) $u['is_active'],
        'emailOptIn'       => (bool) $u['email_opt_in'],
        'whatsappOptIn'    => (bool) $u['whatsapp_opt_in'],
        'createdAt'        => $u['created_at'],
        'lastLoginAt'      => $u['last_login_at'],
        'membership'       => $membership,
    ];
}

/** "none" for members without a membership, otherwise the membership status. */
function row_status(array $row): string
{
    return $row['membership']['status'] ?? 'none';
}

/**
 * Delivery status of notifications, grouped by membership → type → channel.
 * @param list<int> $membershipIds
 * @return array<int,array<string,array<string,array{status:string,error:?string,sentAt:?string}>>>
 */
function notification_status_map(array $membershipIds): array
{
    if (!$membershipIds) {
        return [];
    }
    $in = implode(',', array_fill(0, count($membershipIds), '?'));
    $stmt = db()->prepare("SELECT membership_id, type, channel, status, error, sent_at FROM notifications WHERE membership_id IN ($in)");
    $stmt->execute($membershipIds);
    $map = [];
    foreach ($stmt->fetchAll() as $n) {
        $map[(int) $n['membership_id']][$n['type']][$n['channel']] = [
            'status' => $n['status'],
            'error'  => $n['error'],
            'sentAt' => $n['sent_at'],
        ];
    }
    return $map;
}

/** @return array{page:int,perPage:int} */
function pagination(): array
{
    $page = max(1, (int) query_param('page', '1'));
    $perPage = min(100, max(5, (int) query_param('perPage', '20')));
    return ['page' => $page, 'perPage' => $perPage];
}

/** @return array{items:list<mixed>,total:int,page:int,perPage:int,pages:int} */
function paginate(array $items, int $page, int $perPage): array
{
    $total = count($items);
    $pages = max(1, (int) ceil($total / $perPage));
    $page = min($page, $pages);
    return [
        'items'   => array_values(array_slice($items, ($page - 1) * $perPage, $perPage)),
        'total'   => $total,
        'page'    => $page,
        'perPage' => $perPage,
        'pages'   => $pages,
    ];
}
