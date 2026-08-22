<?php

declare(strict_types=1);

namespace App\Repository;

use App\Config\Database;
use App\Http\HttpException;
use PDO;

/**
 * Course reads and writes.
 *
 * Two rules hold throughout:
 *   - Every value that reaches SQL is a bound parameter, LIMIT and OFFSET
 *     included. (The previous implementation interpolated them, which made
 *     `?limit=10;DROP` a real question rather than a rhetorical one.)
 *   - Listing methods never return unpublished courses unless the caller
 *     explicitly asks *and* has been checked for the right to see them.
 */
final class CourseRepository
{
    /** Hard ceiling on a single page, whatever the caller asks for. */
    public const MAX_PAGE_SIZE = 48;

    /**
     * @param array{
     *   search?: ?string,
     *   category_id?: ?int,
     *   tag_ids?: list<int>,
     *   instructor_id?: ?int,
     *   published_only?: bool
     * } $filters
     * @param int $ceiling Absolute cap on rows returned. Defaults to a browse
     *                     page; the export path raises it to its own audited
     *                     limit. Making it an argument means no caller can
     *                     accidentally page past the cap, and the one caller
     *                     that legitimately needs more has to say so.
     * @return array{items: list<array<string, mixed>>, total: int}
     */
    public function paginate(array $filters, int $limit, int $offset, int $ceiling = self::MAX_PAGE_SIZE): array
    {
        $pdo = Database::connection();

        $where  = [];
        $params = [];

        if ($filters['published_only'] ?? true) {
            $where[] = 'c.is_published = 1';
        }

        if (!empty($filters['instructor_id'])) {
            $where[] = 'c.instructor_id = :instructor';
            $params[':instructor'] = [(int) $filters['instructor_id'], PDO::PARAM_INT];
        }

        if (!empty($filters['category_id'])) {
            $where[] = 'c.category_id = :category';
            $params[':category'] = [(int) $filters['category_id'], PDO::PARAM_INT];
        }

        $search = $filters['search'] ?? null;
        if (\is_string($search) && trim($search) !== '') {
            // Native prepared statements cannot reuse one named placeholder, so
            // the same needle is bound once per column it is compared against.
            $where[] = '(c.title LIKE :search_title OR c.subtitle LIKE :search_subtitle
                         OR c.description LIKE :search_description
                         OR EXISTS (SELECT 1 FROM course_tags ct
                                      JOIN tags t ON t.id = ct.tag_id
                                     WHERE ct.course_id = c.id AND t.title LIKE :search_tag))';

            $needle = '%' . $this->escapeLike(trim($search)) . '%';
            foreach (['search_title', 'search_subtitle', 'search_description', 'search_tag'] as $key) {
                $params[':' . $key] = [$needle, PDO::PARAM_STR];
            }
        }

        $tagIds = $filters['tag_ids'] ?? [];
        if ($tagIds !== []) {
            // Every selected tag must be present, not just one of them —
            // narrowing filters that widen the result set are a UI lie.
            $placeholders = [];
            foreach (array_values($tagIds) as $i => $tagId) {
                $key = ':tag' . $i;
                $placeholders[] = $key;
                $params[$key]   = [(int) $tagId, PDO::PARAM_INT];
            }
            $where[] = '(SELECT COUNT(DISTINCT ct.tag_id) FROM course_tags ct
                          WHERE ct.course_id = c.id AND ct.tag_id IN (' . implode(', ', $placeholders) . ')) = '
                       . \count($tagIds);
        }

        $clause = $where === [] ? '' : ' WHERE ' . implode(' AND ', $where);

        $countStmt = $pdo->prepare('SELECT COUNT(*) FROM courses c' . $clause);
        $this->bindAll($countStmt, $params);
        $countStmt->execute();
        $total = (int) $countStmt->fetchColumn();

        $sql = 'SELECT ' . $this->columns() . '
                  FROM courses c
                  JOIN users u      ON u.id = c.instructor_id
             LEFT JOIN categories cat ON cat.id = c.category_id
             LEFT JOIN assets cover   ON cover.id = c.cover_asset_id' . $clause . '
                 ORDER BY c.created_at DESC, c.id DESC
                 LIMIT :limit OFFSET :offset';

        $stmt = $pdo->prepare($sql);
        $this->bindAll($stmt, $params);
        $stmt->bindValue(':limit', min($limit, $ceiling), PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $items = $stmt->fetchAll();

        return [
            'items' => $this->withTags($items),
            'total' => $total,
        ];
    }

    /** @return array<string, mixed>|null */
    public function find(int $id, bool $includeUnpublished = false): ?array
    {
        $sql = 'SELECT ' . $this->columns() . ', c.content
                  FROM courses c
                  JOIN users u        ON u.id = c.instructor_id
             LEFT JOIN categories cat ON cat.id = c.category_id
             LEFT JOIN assets cover   ON cover.id = c.cover_asset_id
                 WHERE c.id = :id'
             . ($includeUnpublished ? '' : ' AND c.is_published = 1')
             . ' LIMIT 1';

        $stmt = Database::connection()->prepare($sql);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        $course = $stmt->fetch();
        if ($course === false) {
            return null;
        }

        $withTags = $this->withTags([$course]);

        return $withTags[0];
    }

    /**
     * Who owns this course. Returned separately from find() so an ownership
     * check never depends on having first fetched a row the caller may not be
     * allowed to see.
     */
    public function instructorIdOf(int $courseId): ?int
    {
        $stmt = Database::connection()->prepare('SELECT instructor_id FROM courses WHERE id = :id LIMIT 1');
        $stmt->bindValue(':id', $courseId, PDO::PARAM_INT);
        $stmt->execute();

        $value = $stmt->fetchColumn();

        return $value === false ? null : (int) $value;
    }

    /**
     * @param array<string, mixed> $data
     * @param list<int> $tagIds
     */
    public function create(array $data, array $tagIds, int $instructorId): int
    {
        return Database::transaction(function (PDO $pdo) use ($data, $tagIds, $instructorId): int {
            $stmt = $pdo->prepare(
                'INSERT INTO courses
                    (instructor_id, category_id, title, slug, subtitle, img, cover_asset_id, description, content_type, content, is_published)
                 VALUES
                    (:instructor, :category, :title, :slug, :subtitle, :img, :cover_asset, :description, :content_type, :content, :published)'
            );

            $stmt->bindValue(':instructor', $instructorId, PDO::PARAM_INT);
            $stmt->bindValue(':category', $data['category_id'] ?? null, ($data['category_id'] ?? null) === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
            $stmt->bindValue(':title', $data['title']);
            $stmt->bindValue(':slug', $this->uniqueSlug($pdo, (string) $data['title'], null));
            $stmt->bindValue(':subtitle', $data['subtitle'] ?: null);
            $stmt->bindValue(':img', $data['img'] ?: null);
            $stmt->bindValue(
                ':cover_asset',
                $data['cover_asset_id'] ?? null,
                ($data['cover_asset_id'] ?? null) === null ? PDO::PARAM_NULL : PDO::PARAM_INT
            );
            $stmt->bindValue(':description', $data['description'] ?: null);
            $stmt->bindValue(':content_type', $data['content_type']);
            $stmt->bindValue(':content', $data['content'] ?: null);
            $stmt->bindValue(':published', (int) ($data['is_published'] ?? 0), PDO::PARAM_INT);

            try {
                $stmt->execute();
            } catch (\PDOException $e) {
                throw $this->translateConstraint($e);
            }

            $id = (int) $pdo->lastInsertId();
            $this->replaceTags($pdo, $id, $tagIds);

            return $id;
        });
    }

    /**
     * @param array<string, mixed> $data
     * @param list<int> $tagIds
     */
    public function update(int $id, array $data, array $tagIds): void
    {
        Database::transaction(function (PDO $pdo) use ($id, $data, $tagIds): void {
            $stmt = $pdo->prepare(
                'UPDATE courses SET
                    category_id  = :category,
                    title        = :title,
                    slug         = :slug,
                    subtitle     = :subtitle,
                    img            = :img,
                    cover_asset_id = :cover_asset,
                    description  = :description,
                    content_type = :content_type,
                    content      = :content
                 WHERE id = :id'
            );

            $stmt->bindValue(':id', $id, PDO::PARAM_INT);
            $stmt->bindValue(':category', $data['category_id'] ?? null, ($data['category_id'] ?? null) === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
            $stmt->bindValue(':title', $data['title']);
            $stmt->bindValue(':slug', $this->uniqueSlug($pdo, (string) $data['title'], $id));
            $stmt->bindValue(':subtitle', $data['subtitle'] ?: null);
            $stmt->bindValue(':img', $data['img'] ?: null);
            $stmt->bindValue(
                ':cover_asset',
                $data['cover_asset_id'] ?? null,
                ($data['cover_asset_id'] ?? null) === null ? PDO::PARAM_NULL : PDO::PARAM_INT
            );
            $stmt->bindValue(':description', $data['description'] ?: null);
            $stmt->bindValue(':content_type', $data['content_type']);
            $stmt->bindValue(':content', $data['content'] ?: null);

            try {
                $stmt->execute();
            } catch (\PDOException $e) {
                throw $this->translateConstraint($e);
            }

            $this->replaceTags($pdo, $id, $tagIds);
        });
    }

    public function setPublished(int $id, bool $published): void
    {
        $stmt = Database::connection()->prepare('UPDATE courses SET is_published = :published WHERE id = :id');
        $stmt->bindValue(':published', $published ? 1 : 0, PDO::PARAM_INT);
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
    }

    public function delete(int $id): void
    {
        $stmt = Database::connection()->prepare('DELETE FROM courses WHERE id = :id');
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
    }

    // ------------------------------------------------------------- helpers --

    private function columns(): string
    {
        return 'c.id, c.title, c.slug, c.subtitle, c.img, c.description, c.content_type, c.price,
                c.is_published, c.created_at, c.updated_at, c.category_id, c.instructor_id,
                -- The public id of an uploaded cover, when there is one. Kept
                -- separate from c.img rather than merged into it: one is a path
                -- this API serves and the other is a third-party URL the browser
                -- fetches directly, and the front end treats them differently.
                cover.public_id AS cover_public_id,
                u.name AS instructor_name,
                cat.name AS category_name, cat.slug AS category_slug,
                (SELECT COUNT(*) FROM enrollments e WHERE e.course_id = c.id) AS enrollment_count';
    }

    /**
     * Attach tags to a page of courses with one extra query rather than one per
     * row — the old implementation issued N+1 queries and reused the same
     * statement variable inside the loop it was iterating.
     *
     * @param list<array<string, mixed>> $courses
     * @return list<array<string, mixed>>
     */
    private function withTags(array $courses): array
    {
        if ($courses === []) {
            return [];
        }

        $ids = array_map(static fn (array $c): int => (int) $c['id'], $courses);
        $placeholders = implode(', ', array_fill(0, \count($ids), '?'));

        $stmt = Database::connection()->prepare(
            'SELECT ct.course_id, t.id, t.title, t.slug
               FROM course_tags ct
               JOIN tags t ON t.id = ct.tag_id
              WHERE ct.course_id IN (' . $placeholders . ')
              ORDER BY t.title'
        );
        $stmt->execute($ids);

        $byCourse = [];
        foreach ($stmt->fetchAll() as $row) {
            $byCourse[(int) $row['course_id']][] = [
                'id'    => (int) $row['id'],
                'title' => $row['title'],
                'slug'  => $row['slug'],
            ];
        }

        foreach ($courses as $index => $course) {
            $courses[$index]['tags'] = $byCourse[(int) $course['id']] ?? [];
        }

        return array_values($courses);
    }

    /** @param list<int> $tagIds */
    private function replaceTags(PDO $pdo, int $courseId, array $tagIds): void
    {
        $delete = $pdo->prepare('DELETE FROM course_tags WHERE course_id = :course');
        $delete->bindValue(':course', $courseId, PDO::PARAM_INT);
        $delete->execute();

        if ($tagIds === []) {
            return;
        }

        $insert = $pdo->prepare('INSERT INTO course_tags (course_id, tag_id) VALUES (:course, :tag)');
        foreach ($tagIds as $tagId) {
            $insert->bindValue(':course', $courseId, PDO::PARAM_INT);
            $insert->bindValue(':tag', $tagId, PDO::PARAM_INT);

            try {
                $insert->execute();
            } catch (\PDOException $e) {
                // A tag id that no longer exists is the client's problem, not a 500.
                if ($e->getCode() === '23000') {
                    throw HttpException::validation(['tags' => 'One or more selected tags no longer exist.']);
                }
                throw $e;
            }
        }
    }

    private function uniqueSlug(PDO $pdo, string $title, ?int $excludeId): string
    {
        $base = $this->slugify($title);
        if ($base === '') {
            $base = 'course';
        }

        $candidate = $base;
        $suffix    = 1;

        $stmt = $pdo->prepare('SELECT id FROM courses WHERE slug = :slug LIMIT 1');

        while (true) {
            $stmt->bindValue(':slug', $candidate);
            $stmt->execute();

            $holder = $stmt->fetchColumn();

            // Free, or already held by the very row being updated.
            if ($holder === false || (int) $holder === $excludeId) {
                return $candidate;
            }

            $candidate = $base . '-' . (++$suffix);

            if ($suffix > 200) {
                return $base . '-' . bin2hex(random_bytes(4));
            }
        }
    }

    private function slugify(string $value): string
    {
        $ascii = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);
        $ascii = $ascii === false ? $value : $ascii;
        $ascii = strtolower($ascii);
        $ascii = preg_replace('/[^a-z0-9]+/', '-', $ascii) ?? '';

        return trim(substr($ascii, 0, 200), '-');
    }

    private function translateConstraint(\PDOException $e): \Throwable
    {
        if ($e->getCode() !== '23000') {
            return $e;
        }

        $message = $e->getMessage();

        if (str_contains($message, 'fk_courses_category')) {
            return HttpException::validation(['category' => 'That category does not exist.']);
        }

        return HttpException::conflict('A course with these details already exists.');
    }

    private function escapeLike(string $value): string
    {
        return str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $value);
    }

    /** @param array<string, array{0: mixed, 1: int}> $params */
    private function bindAll(\PDOStatement $stmt, array $params): void
    {
        foreach ($params as $key => [$value, $type]) {
            $stmt->bindValue($key, $value, $type);
        }
    }
}
