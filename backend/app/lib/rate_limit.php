<?php
declare(strict_types=1);

/**
 * Fixed-window rate limit stored in MySQL (works on shared hosting, no Redis needed).
 * Stops with HTTP 429 once $max hits happen inside $windowSeconds for the same bucket.
 */
function rate_limit(string $bucket, int $max, int $windowSeconds): void
{
    $key = substr($bucket, 0, 120);
    $pdo = db();
    $pdo->prepare('DELETE FROM rate_limits WHERE window_end < NOW()')->execute();
    $pdo->prepare(
        'INSERT INTO rate_limits (bucket, hits, window_end) VALUES (?, 1, DATE_ADD(NOW(), INTERVAL ? SECOND))
         ON DUPLICATE KEY UPDATE hits = hits + 1'
    )->execute([$key, $windowSeconds]);

    $stmt = $pdo->prepare('SELECT hits, TIMESTAMPDIFF(SECOND, NOW(), window_end) AS wait_s FROM rate_limits WHERE bucket = ?');
    $stmt->execute([$key]);
    $row = $stmt->fetch();
    if ($row && (int) $row['hits'] > $max) {
        $wait = max(1, (int) $row['wait_s']);
        header('Retry-After: ' . $wait);
        json_error('Too many attempts. Please wait ' . (int) ceil($wait / 60) . ' minute(s) and try again.', 429, [], 'RATE_LIMITED');
    }
}

function rate_limit_clear(string $bucket): void
{
    db()->prepare('DELETE FROM rate_limits WHERE bucket = ?')->execute([substr($bucket, 0, 120)]);
}
