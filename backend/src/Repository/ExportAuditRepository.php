<?php

declare(strict_types=1);

namespace App\Repository;

use App\Config\Database;
use App\Security\Principal;
use PDO;

/**
 * The export audit trail.
 *
 * Bulk export is the one operation on this platform that turns a permission
 * into a portable copy of other people's data, so it is the one operation that
 * is recorded unconditionally — successes, refusals and throttles alike. A log
 * that only records what succeeded cannot tell you who was probing.
 */
final class ExportAuditRepository
{
    public const OUTCOME_ALLOWED      = 'allowed';
    public const OUTCOME_DENIED       = 'denied';
    public const OUTCOME_RATE_LIMITED = 'rate_limited';
    public const OUTCOME_TRUNCATED    = 'truncated';

    /**
     * @param array<string, mixed> $filters
     */
    public function record(
        Principal $principal,
        string $dataset,
        string $outcome,
        int $rowCount,
        array $filters,
        ?string $reason,
        string $ipAddress,
        string $userAgent,
    ): void {
        $stmt = Database::connection()->prepare(
            'INSERT INTO export_audit
                (user_id, keycloak_id, actor_email, actor_role, dataset, outcome, row_count, filters, reason, ip_address, user_agent)
             VALUES
                (:user_id, :keycloak_id, :email, :role, :dataset, :outcome, :rows, :filters, :reason, :ip, :ua)'
        );

        $stmt->bindValue(':user_id', $principal->userId, PDO::PARAM_INT);
        $stmt->bindValue(':keycloak_id', $principal->subject);
        $stmt->bindValue(':email', $principal->email);
        $stmt->bindValue(':role', $principal->role);
        $stmt->bindValue(':dataset', $dataset);
        $stmt->bindValue(':outcome', $outcome);
        $stmt->bindValue(':rows', $rowCount, PDO::PARAM_INT);
        $stmt->bindValue(':filters', json_encode($filters, JSON_UNESCAPED_UNICODE) ?: '{}');
        $stmt->bindValue(':reason', $reason);

        // Stored as packed bytes so both IPv4 and IPv6 fit, and so the column
        // cannot be casually eyeballed in a query result.
        $packed = @inet_pton($ipAddress);
        $stmt->bindValue(':ip', $packed === false ? null : $packed, $packed === false ? PDO::PARAM_NULL : PDO::PARAM_LOB);

        $stmt->bindValue(':ua', mb_substr($userAgent, 0, 512));

        $stmt->execute();
    }

    /**
     * @return array{items: list<array<string, mixed>>, total: int}
     */
    public function paginate(int $limit, int $offset, ?string $outcome = null): array
    {
        $pdo = Database::connection();

        $clause = $outcome === null ? '' : ' WHERE outcome = :outcome';

        $countStmt = $pdo->prepare('SELECT COUNT(*) FROM export_audit' . $clause);
        if ($outcome !== null) {
            $countStmt->bindValue(':outcome', $outcome);
        }
        $countStmt->execute();
        $total = (int) $countStmt->fetchColumn();

        $stmt = $pdo->prepare(
            'SELECT id, actor_email, actor_role, dataset, outcome, row_count, filters, reason,
                    user_agent, requested_at, ip_address
               FROM export_audit' . $clause . '
              ORDER BY requested_at DESC, id DESC
              LIMIT :limit OFFSET :offset'
        );
        if ($outcome !== null) {
            $stmt->bindValue(':outcome', $outcome);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $items = [];
        foreach ($stmt->fetchAll() as $row) {
            $ip = $row['ip_address'] ?? null;
            $row['ip_address'] = \is_string($ip) && $ip !== '' ? (@inet_ntop($ip) ?: null) : null;
            $row['filters']    = \is_string($row['filters']) ? json_decode($row['filters'], true) : null;
            $items[] = $row;
        }

        return ['items' => $items, 'total' => $total];
    }
}
