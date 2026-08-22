<?php

declare(strict_types=1);

namespace App\Repository;

use App\Config\Database;
use App\Http\HttpException;
use PDO;

/**
 * Categories and tags.
 *
 * They are one repository because they are one concept — a controlled
 * vocabulary attached to courses — and because every operation on them is the
 * same three lines with a different table name.
 */
final class TaxonomyRepository
{
    /** @return list<array<string, mixed>> */
    public function categories(): array
    {
        $stmt = Database::connection()->query(
            'SELECT cat.id, cat.name, cat.slug,
                    (SELECT COUNT(*) FROM courses c WHERE c.category_id = cat.id AND c.is_published = 1) AS course_count
               FROM categories cat
              ORDER BY cat.name'
        );

        return $stmt === false ? [] : $stmt->fetchAll();
    }

    /** @return list<array<string, mixed>> */
    public function tags(): array
    {
        $stmt = Database::connection()->query(
            'SELECT t.id, t.title, t.slug,
                    (SELECT COUNT(*) FROM course_tags ct WHERE ct.tag_id = t.id) AS course_count
               FROM tags t
              ORDER BY t.title'
        );

        return $stmt === false ? [] : $stmt->fetchAll();
    }

    public function createCategory(string $name): int
    {
        return $this->insert('categories', 'name', $name);
    }

    public function updateCategory(int $id, string $name): void
    {
        $this->update('categories', 'name', $id, $name);
    }

    public function deleteCategory(int $id): void
    {
        $this->delete('categories', $id);
    }

    public function createTag(string $title): int
    {
        return $this->insert('tags', 'title', $title);
    }

    public function updateTag(int $id, string $title): void
    {
        $this->update('tags', 'title', $id, $title);
    }

    public function deleteTag(int $id): void
    {
        $this->delete('tags', $id);
    }

    public function tagUsageCount(int $id): int
    {
        $stmt = Database::connection()->prepare('SELECT COUNT(*) FROM course_tags WHERE tag_id = :id');
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        return (int) $stmt->fetchColumn();
    }

    public function categoryUsageCount(int $id): int
    {
        $stmt = Database::connection()->prepare('SELECT COUNT(*) FROM courses WHERE category_id = :id');
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        return (int) $stmt->fetchColumn();
    }

    // ------------------------------------------------------------- private --

    /**
     * The table and column names below are literals from this class only —
     * never request data — so interpolating them is safe. Values always bind.
     */
    private function insert(string $table, string $column, string $value): int
    {
        $pdo  = Database::connection();
        $stmt = $pdo->prepare(sprintf('INSERT INTO %s (%s, slug) VALUES (:value, :slug)', $table, $column));

        try {
            $stmt->execute([':value' => $value, ':slug' => $this->slugify($value)]);
        } catch (\PDOException $e) {
            throw $this->translate($e, $column);
        }

        return (int) $pdo->lastInsertId();
    }

    private function update(string $table, string $column, int $id, string $value): void
    {
        $stmt = Database::connection()->prepare(
            sprintf('UPDATE %s SET %s = :value, slug = :slug WHERE id = :id', $table, $column)
        );
        $stmt->bindValue(':value', $value);
        $stmt->bindValue(':slug', $this->slugify($value));
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);

        try {
            $stmt->execute();
        } catch (\PDOException $e) {
            throw $this->translate($e, $column);
        }

        if ($stmt->rowCount() === 0 && !$this->exists($table, $id)) {
            throw HttpException::notFound('That entry no longer exists.');
        }
    }

    private function delete(string $table, int $id): void
    {
        $stmt = Database::connection()->prepare(sprintf('DELETE FROM %s WHERE id = :id', $table));
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        if ($stmt->rowCount() === 0) {
            throw HttpException::notFound('That entry no longer exists.');
        }
    }

    private function exists(string $table, int $id): bool
    {
        $stmt = Database::connection()->prepare(sprintf('SELECT 1 FROM %s WHERE id = :id', $table));
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchColumn() !== false;
    }

    private function translate(\PDOException $e, string $column): \Throwable
    {
        if ($e->getCode() === '23000') {
            return HttpException::validation([$column === 'name' ? 'name' : 'title' => 'That name is already taken.']);
        }

        return $e;
    }

    private function slugify(string $value): string
    {
        $ascii = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $value);
        $ascii = $ascii === false ? $value : $ascii;
        $ascii = preg_replace('/[^a-z0-9]+/', '-', strtolower($ascii)) ?? '';
        $slug  = trim(substr($ascii, 0, 110), '-');

        // A name made entirely of non-latin characters would otherwise slug to
        // an empty string and collide with the next one that does the same.
        return $slug === '' ? 'item-' . bin2hex(random_bytes(3)) : $slug;
    }
}
