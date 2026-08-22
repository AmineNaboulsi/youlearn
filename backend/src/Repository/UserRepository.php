<?php

declare(strict_types=1);

namespace App\Repository;

use App\Config\Database;
use App\Http\HttpException;
use PDO;

/**
 * The local mirror of Keycloak users.
 *
 * Nothing here authenticates anyone — there is no password column. These rows
 * exist so course authorship and enrolment can be foreign keys, and so a
 * reporting query can join a name without a round trip to the IdP.
 */
final class UserRepository
{
    /**
     * Create or refresh the mirror row for a verified token subject.
     *
     * @return array<string, mixed>
     */
    public function syncFromToken(string $keycloakId, string $email, string $name, string $role): array
    {
        $pdo = Database::connection();

        // The role always comes from the token, so demoting someone in Keycloak
        // takes effect on their very next request rather than at some later sync.
        $upsert = $pdo->prepare(
            'INSERT INTO users (keycloak_id, name, email, role, is_active, last_seen_at)
                  VALUES (:kc, :name, :email, :role, 1, NOW())
             ON DUPLICATE KEY UPDATE
                  name         = VALUES(name),
                  email        = VALUES(email),
                  role         = VALUES(role),
                  last_seen_at = NOW()'
        );

        try {
            $upsert->execute([
                ':kc'    => $keycloakId,
                ':name'  => mb_substr($name, 0, 255),
                ':email' => mb_substr($email, 0, 320),
                ':role'  => $role,
            ]);
        } catch (\PDOException $e) {
            // 23000 here means the email is already held by a *different*
            // keycloak_id. That is a genuine identity conflict — two realm
            // users claiming one mailbox — and must not be papered over.
            if ($e->getCode() === '23000') {
                $existing = $this->findByEmail($email);
                if ($existing !== null && $existing['keycloak_id'] !== $keycloakId) {
                    throw new HttpException(
                        409,
                        'identity_conflict',
                        'Another account already uses this email address. Please contact support.'
                    );
                }
            }
            throw $e;
        }

        $user = $this->findByKeycloakId($keycloakId);
        if ($user === null) {
            throw new HttpException(500, 'server_error', 'Account could not be provisioned.');
        }

        return $user;
    }

    /** @return array<string, mixed>|null */
    public function findByKeycloakId(string $keycloakId): ?array
    {
        $stmt = Database::connection()->prepare(
            'SELECT id, keycloak_id, name, email, role, is_active, last_seen_at, created_at
               FROM users WHERE keycloak_id = :kc LIMIT 1'
        );
        $stmt->execute([':kc' => $keycloakId]);

        return $stmt->fetch() ?: null;
    }

    /** @return array<string, mixed>|null */
    public function findByEmail(string $email): ?array
    {
        $stmt = Database::connection()->prepare(
            'SELECT id, keycloak_id, name, email, role, is_active FROM users WHERE email = :email LIMIT 1'
        );
        $stmt->execute([':email' => $email]);

        return $stmt->fetch() ?: null;
    }

    /** @return array<string, mixed>|null */
    public function findById(int $id): ?array
    {
        $stmt = Database::connection()->prepare(
            'SELECT id, keycloak_id, name, email, role, is_active, last_seen_at, created_at
               FROM users WHERE id = :id LIMIT 1'
        );
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetch() ?: null;
    }

    /**
     * Paginated directory, optionally filtered by role and free-text search.
     *
     * @param list<string> $roles
     * @return array{items: list<array<string, mixed>>, total: int}
     */
    public function paginate(array $roles, ?string $search, int $limit, int $offset): array
    {
        $pdo = Database::connection();

        $where  = [];
        $params = [];

        if ($roles !== []) {
            $placeholders = [];
            foreach (array_values($roles) as $i => $role) {
                $placeholders[]      = ':role' . $i;
                $params[':role' . $i] = $role;
            }
            $where[] = 'u.role IN (' . implode(', ', $placeholders) . ')';
        }

        if ($search !== null && $search !== '') {
            // One placeholder per comparison: native prepares reject a repeated name.
            $where[] = '(u.name LIKE :search_name OR u.email LIKE :search_email)';
            $needle  = '%' . $this->escapeLike($search) . '%';
            $params[':search_name']  = $needle;
            $params[':search_email'] = $needle;
        }

        $clause = $where === [] ? '' : ' WHERE ' . implode(' AND ', $where);

        $countStmt = $pdo->prepare('SELECT COUNT(*) FROM users u' . $clause);
        $countStmt->execute($params);
        $total = (int) $countStmt->fetchColumn();

        $sql = 'SELECT u.id, u.keycloak_id, u.name, u.email, u.role, u.is_active, u.last_seen_at, u.created_at,
                       (SELECT COUNT(*) FROM enrollments e WHERE e.user_id = u.id)     AS enrollment_count,
                       (SELECT COUNT(*) FROM courses c     WHERE c.instructor_id = u.id) AS course_count
                  FROM users u' . $clause . '
                 ORDER BY u.created_at DESC, u.id DESC
                 LIMIT :limit OFFSET :offset';

        $stmt = $pdo->prepare($sql);
        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return ['items' => $stmt->fetchAll(), 'total' => $total];
    }

    public function setActive(int $id, bool $active): void
    {
        $stmt = Database::connection()->prepare('UPDATE users SET is_active = :active WHERE id = :id');
        $stmt->bindValue(':active', $active ? 1 : 0, PDO::PARAM_INT);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
    }

    public function delete(int $id): void
    {
        $stmt = Database::connection()->prepare('DELETE FROM users WHERE id = :id');
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
    }

    public function countCoursesAuthoredBy(int $id): int
    {
        $stmt = Database::connection()->prepare('SELECT COUNT(*) FROM courses WHERE instructor_id = :id');
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        return (int) $stmt->fetchColumn();
    }

    /**
     * LIKE has its own wildcards; a search for "50%" should not match everything.
     */
    private function escapeLike(string $value): string
    {
        return str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $value);
    }
}
