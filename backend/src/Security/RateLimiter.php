<?php

declare(strict_types=1);

namespace App\Security;

use App\Config\Database;
use App\Http\HttpException;

/**
 * Sliding-window rate limiter backed by MySQL.
 *
 * Durable on purpose. An in-process counter resets every time PHP-FPM recycles
 * a worker, and an in-memory store would be the caching layer this project
 * explicitly does not want. Counting rows in a narrow, well-indexed table is
 * fast enough for the volumes here and cannot be reset by restarting the API.
 */
final class RateLimiter
{
    /** Rows older than this are pruned opportunistically. */
    private const RETENTION_SECONDS = 86_400;

    /** Prune roughly one request in fifty rather than on every write. */
    private const PRUNE_ODDS = 50;

    /**
     * Record a hit and fail if the caller is over quota.
     *
     * The hit is recorded *before* the check, so a caller who keeps hammering a
     * limited endpoint keeps extending their own window rather than getting a
     * free request the moment the oldest one ages out.
     *
     * @throws HttpException 429 with a Retry-After header.
     */
    public function hit(string $bucket, string $actor, int $max, int $windowSeconds): void
    {
        $pdo = Database::connection();

        $insert = $pdo->prepare('INSERT INTO rate_limit_hits (bucket, actor) VALUES (:bucket, :actor)');
        $insert->execute([':bucket' => $bucket, ':actor' => $this->fingerprint($actor)]);

        $count = $pdo->prepare(
            'SELECT COUNT(*) AS hits, MIN(hit_at) AS oldest
               FROM rate_limit_hits
              WHERE bucket = :bucket
                AND actor  = :actor
                AND hit_at > (NOW(3) - INTERVAL :window SECOND)'
        );
        $count->bindValue(':bucket', $bucket);
        $count->bindValue(':actor', $this->fingerprint($actor));
        $count->bindValue(':window', $windowSeconds, \PDO::PARAM_INT);
        $count->execute();

        /** @var array{hits: int, oldest: ?string} $row */
        $row = $count->fetch() ?: ['hits' => 0, 'oldest' => null];

        $this->maybePrune($pdo);

        if ((int) $row['hits'] <= $max) {
            return;
        }

        $retryAfter = $windowSeconds;
        if (\is_string($row['oldest'])) {
            $oldest     = strtotime($row['oldest']);
            $retryAfter = max(1, $windowSeconds - (time() - (int) $oldest));
        }

        throw new HttpException(
            429,
            'rate_limited',
            'Too many requests. Please wait before trying again.',
            ['retry_after_seconds' => $retryAfter, 'limit' => $max, 'window_seconds' => $windowSeconds],
            ['Retry-After' => (string) $retryAfter]
        );
    }

    /**
     * How many hits remain in the current window, without recording one.
     * Used to show the export screen an honest quota before the user commits.
     *
     * @return array{used: int, remaining: int, resets_in: int}
     */
    public function status(string $bucket, string $actor, int $max, int $windowSeconds): array
    {
        $stmt = Database::connection()->prepare(
            'SELECT COUNT(*) AS hits, MIN(hit_at) AS oldest
               FROM rate_limit_hits
              WHERE bucket = :bucket
                AND actor  = :actor
                AND hit_at > (NOW(3) - INTERVAL :window SECOND)'
        );
        $stmt->bindValue(':bucket', $bucket);
        $stmt->bindValue(':actor', $this->fingerprint($actor));
        $stmt->bindValue(':window', $windowSeconds, \PDO::PARAM_INT);
        $stmt->execute();

        /** @var array{hits: int, oldest: ?string} $row */
        $row  = $stmt->fetch() ?: ['hits' => 0, 'oldest' => null];
        $used = (int) $row['hits'];

        $resetsIn = 0;
        if ($used > 0 && \is_string($row['oldest'])) {
            $resetsIn = max(0, $windowSeconds - (time() - (int) strtotime($row['oldest'])));
        }

        return [
            'used'      => $used,
            'remaining' => max(0, $max - $used),
            'resets_in' => $resetsIn,
        ];
    }

    /**
     * Actors are stored as a keyed hash, not in the clear.
     *
     * The limiter is keyed by things like a user's Keycloak id or a raw IP.
     * Hashing keeps the table from becoming a second, unaudited copy of who
     * used the platform and from where.
     */
    private function fingerprint(string $actor): string
    {
        $pepper = \App\Support\Env::get('RATE_LIMIT_PEPPER', 'youlearn-local-pepper') ?? '';

        return hash_hmac('sha256', $actor, $pepper);
    }

    private function maybePrune(\PDO $pdo): void
    {
        if (random_int(1, self::PRUNE_ODDS) !== 1) {
            return;
        }

        $stmt = $pdo->prepare('DELETE FROM rate_limit_hits WHERE hit_at < (NOW(3) - INTERVAL :ttl SECOND) LIMIT 5000');
        $stmt->bindValue(':ttl', self::RETENTION_SECONDS, \PDO::PARAM_INT);
        $stmt->execute();
    }
}
