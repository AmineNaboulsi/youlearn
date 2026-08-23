<?php

declare(strict_types=1);

namespace App\Repository;

use App\Config\Database;
use App\Http\HttpException;
use PDO;

/**
 * The public instructor profile.
 *
 * Stored on `users` — a profile is one-to-one with an account — but kept in its
 * own repository because the read rules are the opposite of everything in
 * UserRepository. Those queries answer "who is this signed-in person"; these
 * answer "what may an anonymous stranger see", and the two must never be
 * confused. Nothing returned by findPublic() has come from Keycloak: no email,
 * no keycloak_id, no last_seen_at.
 */
final class ProfileRepository
{
    /** Only these roles can hold a public profile. A learner page has no subject. */
    private const PUBLISHABLE_ROLES = ['admin', 'enseignant'];

    /** Links are read whole and rendered as a list; more than this is a link farm. */
    public const MAX_LINKS = 6;

    /**
     * The profile as its owner edits it, public or not.
     *
     * @return array<string, mixed>|null
     */
    public function findByUserId(int $userId): ?array
    {
        $stmt = Database::connection()->prepare(
            'SELECT ' . $this->columns() . '
               FROM users u
          LEFT JOIN assets a ON a.id = u.avatar_asset_id
              WHERE u.id = :id
              LIMIT 1'
        );
        $stmt->bindValue(':id', $userId, PDO::PARAM_INT);
        $stmt->execute();

        $row = $stmt->fetch();

        return $row === false ? null : $this->hydrate($row);
    }

    /**
     * The profile as the world sees it.
     *
     * Four conditions, all of them load-bearing: the slug matches, the owner
     * published it, the account is still active, and the account still holds a
     * teaching role. A suspended or demoted instructor's page stops resolving
     * without anybody having to remember to unpublish it.
     *
     * @return array<string, mixed>|null
     */
    public function findPublicBySlug(string $slug): ?array
    {
        $placeholders = [];
        $params       = [];
        foreach (self::PUBLISHABLE_ROLES as $i => $role) {
            $placeholders[]        = ':role' . $i;
            $params[':role' . $i]  = $role;
        }

        $stmt = Database::connection()->prepare(
            'SELECT ' . $this->columns() . '
               FROM users u
          LEFT JOIN assets a ON a.id = u.avatar_asset_id
              WHERE u.profile_slug      = :slug
                AND u.profile_is_public = 1
                AND u.is_active         = 1
                AND u.role IN (' . implode(', ', $placeholders) . ')
              LIMIT 1'
        );

        foreach ($params as $key => $value) {
            $stmt->bindValue($key, $value);
        }
        $stmt->bindValue(':slug', $slug);
        $stmt->execute();

        $row = $stmt->fetch();

        return $row === false ? null : $this->hydrate($row);
    }

    /**
     * Headline figures for a public profile.
     *
     * Counted over published courses only. The draft count is management
     * information — "this instructor has eleven unfinished courses" is not
     * something a visitor is owed, and it would leak from the same query if the
     * publication filter were left off.
     *
     * @return array{published_courses: int, learners: int, lessons: int, duration_seconds: int}
     */
    public function publicStats(int $userId): array
    {
        $pdo = Database::connection();

        $stmt = $pdo->prepare(
            'SELECT COUNT(*) AS courses,
                    (SELECT COUNT(DISTINCT e.user_id)
                       FROM enrollments e
                       JOIN courses ec ON ec.id = e.course_id
                      WHERE ec.instructor_id = :learner_instructor AND ec.is_published = 1) AS learners,
                    (SELECT COUNT(*)
                       FROM lessons l
                       JOIN courses lc ON lc.id = l.course_id
                      WHERE lc.instructor_id = :lesson_instructor AND lc.is_published = 1) AS lessons,
                    (SELECT COALESCE(SUM(l.duration_seconds), 0)
                       FROM lessons l
                       JOIN courses dc ON dc.id = l.course_id
                      WHERE dc.instructor_id = :duration_instructor AND dc.is_published = 1) AS duration
               FROM courses c
              WHERE c.instructor_id = :instructor AND c.is_published = 1'
        );

        // Native prepared statements will not reuse a named placeholder, so the
        // same id is bound once per subquery that needs it.
        foreach (['instructor', 'learner_instructor', 'lesson_instructor', 'duration_instructor'] as $key) {
            $stmt->bindValue(':' . $key, $userId, PDO::PARAM_INT);
        }
        $stmt->execute();

        $row = $stmt->fetch() ?: [];

        return [
            'published_courses' => (int) ($row['courses'] ?? 0),
            'learners'          => (int) ($row['learners'] ?? 0),
            'lessons'           => (int) ($row['lessons'] ?? 0),
            'duration_seconds'  => (int) ($row['duration'] ?? 0),
        ];
    }

    /**
     * Write the profile.
     *
     * `avatar_asset_id` is only touched when the caller passed the key at all,
     * so a save that does not mention the avatar leaves it alone rather than
     * silently clearing it.
     *
     * @param array<string, mixed> $data
     */
    public function save(int $userId, array $data): void
    {
        $assignments = [
            'profile_slug         = :slug',
            'profile_is_public    = :is_public',
            'headline             = :headline',
            'bio                  = :bio',
            'profile_location     = :location',
            'profile_links        = :links',
            'profile_theme        = :theme',
            'profile_show_about   = :show_about',
            'profile_show_courses = :show_courses',
            'profile_show_stats   = :show_stats',
            'profile_show_links   = :show_links',
        ];

        $touchesAvatar = \array_key_exists('avatar_asset_id', $data);
        if ($touchesAvatar) {
            $assignments[] = 'avatar_asset_id = :avatar';
        }

        $stmt = Database::connection()->prepare(
            'UPDATE users SET ' . implode(', ', $assignments) . ' WHERE id = :id'
        );

        $slug = $data['profile_slug'] ?? '';
        $stmt->bindValue(':slug', $slug === '' ? null : $slug, $slug === '' ? PDO::PARAM_NULL : PDO::PARAM_STR);
        $stmt->bindValue(':is_public', (int) ($data['profile_is_public'] ?? 0), PDO::PARAM_INT);
        $this->bindNullable($stmt, ':headline', $data['headline'] ?? '');
        $this->bindNullable($stmt, ':bio', $data['bio'] ?? '');
        $this->bindNullable($stmt, ':location', $data['profile_location'] ?? '');

        $links = $data['profile_links'] ?? [];
        $stmt->bindValue(
            ':links',
            $links === [] ? null : json_encode($links, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES),
            $links === [] ? PDO::PARAM_NULL : PDO::PARAM_STR
        );

        $stmt->bindValue(':theme', $data['profile_theme'] ?? 'light');

        foreach (['about', 'courses', 'stats', 'links'] as $section) {
            $stmt->bindValue(
                ':show_' . $section,
                (int) ($data['profile_show_' . $section] ?? 1),
                PDO::PARAM_INT
            );
        }

        if ($touchesAvatar) {
            $avatar = $data['avatar_asset_id'];
            $stmt->bindValue(':avatar', $avatar, $avatar === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
        }

        $stmt->bindValue(':id', $userId, PDO::PARAM_INT);

        try {
            $stmt->execute();
        } catch (\PDOException $e) {
            // 23000 on this table means the slug is spoken for. Reported as a
            // field error so it lands on the input the person typed it into.
            if ($e->getCode() === '23000') {
                throw HttpException::validation(['profile_slug' => 'That address is already taken.']);
            }
            throw $e;
        }
    }

    /**
     * Is this slug free for this account to take?
     *
     * Checked before the write as well as caught after it. The check produces
     * the message a person can act on; the catch in save() is what holds when
     * two people claim the same slug in the same instant.
     */
    public function slugAvailable(string $slug, int $forUserId): bool
    {
        $stmt = Database::connection()->prepare(
            'SELECT id FROM users WHERE profile_slug = :slug AND id <> :id LIMIT 1'
        );
        $stmt->bindValue(':slug', $slug);
        $stmt->bindValue(':id', $forUserId, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetch() === false;
    }

    // -------------------------------------------------------------- private --

    /**
     * Columns every profile read returns.
     *
     * Written out rather than `u.*` on purpose: `SELECT *` on this table would
     * put email and keycloak_id one careless `json_encode` away from a public
     * response body.
     */
    private function columns(): string
    {
        return 'u.id, u.name, u.role, u.created_at,
                u.profile_slug, u.profile_is_public, u.headline, u.bio, u.profile_location,
                u.profile_links, u.profile_theme,
                u.profile_show_about, u.profile_show_courses,
                u.profile_show_stats, u.profile_show_links,
                a.public_id AS avatar_public_id';
    }

    /**
     * @param array<string, mixed> $row
     * @return array<string, mixed>
     */
    private function hydrate(array $row): array
    {
        return [
            'id'               => (int) $row['id'],
            'name'             => (string) $row['name'],
            'role'             => (string) $row['role'],
            'member_since'     => $row['created_at'],
            'slug'             => $row['profile_slug'],
            'is_public'        => ((int) $row['profile_is_public']) === 1,
            'avatar_public_id' => $row['avatar_public_id'],
            'headline'         => $row['headline'],
            'bio'              => $row['bio'],
            'location'         => $row['profile_location'],
            'links'            => $this->decodeLinks($row['profile_links']),
            'theme'            => (string) $row['profile_theme'],
            'sections'         => [
                'about'   => ((int) $row['profile_show_about']) === 1,
                'courses' => ((int) $row['profile_show_courses']) === 1,
                'stats'   => ((int) $row['profile_show_stats']) === 1,
                'links'   => ((int) $row['profile_show_links']) === 1,
            ],
        ];
    }

    /**
     * Read the links column back into a list.
     *
     * Re-validated on the way out, not just on the way in. This column is JSON
     * that a future migration, a manual UPDATE or an older build could have put
     * anything into, and its contents end up in an href — so the shape is
     * proven here rather than assumed from the fact that save() is careful.
     *
     * @return list<array{label: string, url: string}>
     */
    private function decodeLinks(mixed $raw): array
    {
        if (!\is_string($raw) || $raw === '') {
            return [];
        }

        try {
            $decoded = json_decode($raw, true, 8, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            return [];
        }

        if (!\is_array($decoded)) {
            return [];
        }

        $links = [];

        foreach ($decoded as $entry) {
            if (!\is_array($entry) || !\is_string($entry['url'] ?? null)) {
                continue;
            }

            $url    = $entry['url'];
            $scheme = strtolower((string) parse_url($url, PHP_URL_SCHEME));

            // The one rule that matters: `javascript:` and `data:` in an href
            // are stored XSS, and a value that predates this check must not
            // become one just because it is already in the database.
            if (!\in_array($scheme, ['http', 'https'], true)) {
                continue;
            }

            $label = \is_string($entry['label'] ?? null) ? $entry['label'] : '';

            $links[] = [
                'label' => mb_substr($label === '' ? (string) parse_url($url, PHP_URL_HOST) : $label, 0, 60),
                'url'   => mb_substr($url, 0, 2048),
            ];

            if (\count($links) >= self::MAX_LINKS) {
                break;
            }
        }

        return $links;
    }

    private function bindNullable(\PDOStatement $stmt, string $key, mixed $value): void
    {
        $string = \is_string($value) ? trim($value) : '';
        $stmt->bindValue($key, $string === '' ? null : $string, $string === '' ? PDO::PARAM_NULL : PDO::PARAM_STR);
    }
}
