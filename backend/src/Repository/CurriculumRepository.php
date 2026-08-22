<?php

declare(strict_types=1);

namespace App\Repository;

use App\Config\Database;
use App\Http\HttpException;
use PDO;

/**
 * A course's curriculum: named sections, each holding an ordered list of lessons.
 *
 * The read path is viewer-aware. Whether a lesson is playable is decided here,
 * once, and the video URL is simply absent when it is not — rather than being
 * sent to the browser with a `locked: true` flag next to it and a hope that the
 * front end respects it.
 */
final class CurriculumRepository
{
    // ------------------------------------------------------------- reading --

    /**
     * The whole curriculum for one course.
     *
     * @param bool $unlocked True when the viewer may watch every lesson —
     *                       enrolled, the instructor, or an administrator.
     * @return list<array<string, mixed>>
     */
    public function forCourse(int $courseId, ?int $viewerId, bool $unlocked): array
    {
        $pdo = Database::connection();

        $sections = $pdo->prepare(
            'SELECT id, title, summary, position
               FROM course_sections
              WHERE course_id = :course
              ORDER BY position, id'
        );
        $sections->bindValue(':course', $courseId, PDO::PARAM_INT);
        $sections->execute();
        $sectionRows = $sections->fetchAll();

        if ($sectionRows === []) {
            return [];
        }

        // One query for every lesson in the course, joined to this viewer's
        // progress. The alternative — a progress lookup per lesson — is the
        // N+1 that makes a forty-lesson course take a second to render.
        $lessons = $pdo->prepare(
            'SELECT l.id, l.section_id, l.title, l.summary, l.kind, l.duration_seconds,
                    l.is_preview, l.position, l.text_content,
                    a.public_id AS video_public_id, a.mime_type AS video_mime,
                    p.last_position_seconds, p.furthest_seconds, p.watched_seconds, p.completed_at
               FROM lessons l
          LEFT JOIN assets a          ON a.id = l.video_asset_id
          LEFT JOIN lesson_progress p ON p.lesson_id = l.id AND p.user_id = :viewer
              WHERE l.course_id = :course
              ORDER BY l.position, l.id'
        );
        $lessons->bindValue(':course', $courseId, PDO::PARAM_INT);
        $lessons->bindValue(':viewer', $viewerId ?? 0, PDO::PARAM_INT);
        $lessons->execute();

        $bySection = [];
        foreach ($lessons->fetchAll() as $row) {
            $playable = $unlocked || (int) $row['is_preview'] === 1;

            $lesson = [
                'id'               => (int) $row['id'],
                'title'            => $row['title'],
                'summary'          => $row['summary'],
                'kind'             => $row['kind'],
                'duration_seconds' => (int) $row['duration_seconds'],
                'is_preview'       => (int) $row['is_preview'] === 1,
                'position'         => (int) $row['position'],
                'locked'           => !$playable,
                'has_video'        => $row['video_public_id'] !== null,
            ];

            // The URL and the text are only present when the viewer may have
            // them. There is nothing here for a client to reveal by ignoring a flag.
            if ($playable) {
                $lesson['video_url']  = $row['video_public_id'] === null ? null : '/assets/' . $row['video_public_id'];
                $lesson['video_mime'] = $row['video_mime'];
                $lesson['text_content'] = $row['text_content'];
            }

            if ($viewerId !== null && $row['last_position_seconds'] !== null) {
                $lesson['progress'] = [
                    'last_position_seconds' => (int) $row['last_position_seconds'],
                    'furthest_seconds'      => (int) $row['furthest_seconds'],
                    'watched_seconds'       => (int) $row['watched_seconds'],
                    'completed'             => $row['completed_at'] !== null,
                ];
            }

            $bySection[(int) $row['section_id']][] = $lesson;
        }

        $result = [];
        foreach ($sectionRows as $section) {
            $id = (int) $section['id'];
            $sectionLessons = $bySection[$id] ?? [];

            $result[] = [
                'id'       => $id,
                'title'    => $section['title'],
                'summary'  => $section['summary'],
                'position' => (int) $section['position'],
                'lessons'  => $sectionLessons,
                'lesson_count'     => \count($sectionLessons),
                'duration_seconds' => array_sum(array_column($sectionLessons, 'duration_seconds')),
            ];
        }

        return $result;
    }

    /** @return array<string, mixed>|null */
    public function findLesson(int $lessonId): ?array
    {
        $stmt = Database::connection()->prepare(
            'SELECT l.*, a.public_id AS video_public_id, a.mime_type AS video_mime,
                    c.instructor_id, c.title AS course_title, c.is_published
               FROM lessons l
               JOIN courses c ON c.id = l.course_id
          LEFT JOIN assets a  ON a.id = l.video_asset_id
              WHERE l.id = :id LIMIT 1'
        );
        $stmt->bindValue(':id', $lessonId, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetch() ?: null;
    }

    /** The first lesson of a course, used to answer "where do I start?". */
    public function firstLessonId(int $courseId): ?int
    {
        $stmt = Database::connection()->prepare(
            'SELECT l.id FROM lessons l
               JOIN course_sections s ON s.id = l.section_id
              WHERE l.course_id = :course
              ORDER BY s.position, s.id, l.position, l.id
              LIMIT 1'
        );
        $stmt->bindValue(':course', $courseId, PDO::PARAM_INT);
        $stmt->execute();

        $id = $stmt->fetchColumn();

        return $id === false ? null : (int) $id;
    }

    /**
     * The lesson before and after this one, in curriculum order.
     *
     * @return array{previous: ?int, next: ?int}
     */
    public function neighbours(int $courseId, int $lessonId): array
    {
        $stmt = Database::connection()->prepare(
            'SELECT l.id FROM lessons l
               JOIN course_sections s ON s.id = l.section_id
              WHERE l.course_id = :course
              ORDER BY s.position, s.id, l.position, l.id'
        );
        $stmt->bindValue(':course', $courseId, PDO::PARAM_INT);
        $stmt->execute();

        $ids = array_map('intval', array_column($stmt->fetchAll(), 'id'));
        $index = array_search($lessonId, $ids, true);

        if ($index === false) {
            return ['previous' => null, 'next' => null];
        }

        return [
            'previous' => $ids[$index - 1] ?? null,
            'next'     => $ids[$index + 1] ?? null,
        ];
    }

    // ------------------------------------------------------------ sections --

    public function createSection(int $courseId, string $title, ?string $summary): int
    {
        $pdo = Database::connection();

        $stmt = $pdo->prepare(
            'INSERT INTO course_sections (course_id, title, summary, position)
             VALUES (:course, :title, :summary,
                     COALESCE((SELECT MAX(position) + 1 FROM (SELECT * FROM course_sections) s
                                WHERE s.course_id = :course_pos), 0))'
        );
        $stmt->bindValue(':course', $courseId, PDO::PARAM_INT);
        $stmt->bindValue(':course_pos', $courseId, PDO::PARAM_INT);
        $stmt->bindValue(':title', $title);
        $stmt->bindValue(':summary', $summary ?: null);
        $stmt->execute();

        return (int) $pdo->lastInsertId();
    }

    public function updateSection(int $sectionId, int $courseId, string $title, ?string $summary): void
    {
        $stmt = Database::connection()->prepare(
            'UPDATE course_sections SET title = :title, summary = :summary
              WHERE id = :id AND course_id = :course'
        );
        $stmt->bindValue(':title', $title);
        $stmt->bindValue(':summary', $summary ?: null);
        $stmt->bindValue(':id', $sectionId, PDO::PARAM_INT);
        $stmt->bindValue(':course', $courseId, PDO::PARAM_INT);
        $stmt->execute();

        if ($stmt->rowCount() === 0 && !$this->sectionBelongsTo($sectionId, $courseId)) {
            throw HttpException::notFound('That section does not exist.');
        }
    }

    public function deleteSection(int $sectionId, int $courseId): void
    {
        $stmt = Database::connection()->prepare(
            'DELETE FROM course_sections WHERE id = :id AND course_id = :course'
        );
        $stmt->bindValue(':id', $sectionId, PDO::PARAM_INT);
        $stmt->bindValue(':course', $courseId, PDO::PARAM_INT);
        $stmt->execute();

        if ($stmt->rowCount() === 0) {
            throw HttpException::notFound('That section does not exist.');
        }
    }

    public function sectionBelongsTo(int $sectionId, int $courseId): bool
    {
        $stmt = Database::connection()->prepare(
            'SELECT 1 FROM course_sections WHERE id = :id AND course_id = :course LIMIT 1'
        );
        $stmt->bindValue(':id', $sectionId, PDO::PARAM_INT);
        $stmt->bindValue(':course', $courseId, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchColumn() !== false;
    }

    /** Move a section one place up or down among its siblings. */
    public function moveSection(int $sectionId, int $courseId, string $direction): void
    {
        $this->reorder('course_sections', 'course_id', $courseId, $sectionId, $direction);
    }

    // ------------------------------------------------------------- lessons --

    /** @param array<string, mixed> $data */
    public function createLesson(int $courseId, int $sectionId, array $data): int
    {
        $pdo = Database::connection();

        $stmt = $pdo->prepare(
            'INSERT INTO lessons
                (course_id, section_id, title, summary, kind, video_asset_id, text_content,
                 duration_seconds, is_preview, position)
             VALUES
                (:course, :section, :title, :summary, :kind, :asset, :text,
                 :duration, :preview,
                 COALESCE((SELECT MAX(position) + 1 FROM (SELECT * FROM lessons) l
                            WHERE l.section_id = :section_pos), 0))'
        );

        $this->bindLesson($stmt, $data);
        $stmt->bindValue(':course', $courseId, PDO::PARAM_INT);
        $stmt->bindValue(':section', $sectionId, PDO::PARAM_INT);
        $stmt->bindValue(':section_pos', $sectionId, PDO::PARAM_INT);
        $stmt->execute();

        return (int) $pdo->lastInsertId();
    }

    /** @param array<string, mixed> $data */
    public function updateLesson(int $lessonId, int $courseId, array $data): void
    {
        $stmt = Database::connection()->prepare(
            'UPDATE lessons SET
                title = :title, summary = :summary, kind = :kind,
                video_asset_id = :asset, text_content = :text,
                duration_seconds = :duration, is_preview = :preview
              WHERE id = :id AND course_id = :course'
        );

        $this->bindLesson($stmt, $data);
        $stmt->bindValue(':id', $lessonId, PDO::PARAM_INT);
        $stmt->bindValue(':course', $courseId, PDO::PARAM_INT);
        $stmt->execute();
    }

    public function deleteLesson(int $lessonId, int $courseId): void
    {
        $stmt = Database::connection()->prepare(
            'DELETE FROM lessons WHERE id = :id AND course_id = :course'
        );
        $stmt->bindValue(':id', $lessonId, PDO::PARAM_INT);
        $stmt->bindValue(':course', $courseId, PDO::PARAM_INT);
        $stmt->execute();

        if ($stmt->rowCount() === 0) {
            throw HttpException::notFound('That lesson does not exist.');
        }
    }

    public function moveLesson(int $lessonId, int $sectionId, string $direction): void
    {
        $this->reorder('lessons', 'section_id', $sectionId, $lessonId, $direction);
    }

    /** Total runtime of a course, for the catalogue card. */
    public function courseDuration(int $courseId): int
    {
        $stmt = Database::connection()->prepare(
            'SELECT COALESCE(SUM(duration_seconds), 0) FROM lessons WHERE course_id = :course'
        );
        $stmt->bindValue(':course', $courseId, PDO::PARAM_INT);
        $stmt->execute();

        return (int) $stmt->fetchColumn();
    }

    public function lessonCount(int $courseId): int
    {
        $stmt = Database::connection()->prepare(
            'SELECT COUNT(*) FROM lessons WHERE course_id = :course'
        );
        $stmt->bindValue(':course', $courseId, PDO::PARAM_INT);
        $stmt->execute();

        return (int) $stmt->fetchColumn();
    }

    // -------------------------------------------------------------- private --

    /** @param array<string, mixed> $data */
    private function bindLesson(\PDOStatement $stmt, array $data): void
    {
        $assetId = $data['video_asset_id'] ?? null;

        $stmt->bindValue(':title', $data['title']);
        $stmt->bindValue(':summary', ($data['summary'] ?? '') ?: null);
        $stmt->bindValue(':kind', $data['kind']);
        $stmt->bindValue(':asset', $assetId, $assetId === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
        $stmt->bindValue(':text', ($data['text_content'] ?? '') ?: null);
        $stmt->bindValue(':duration', (int) ($data['duration_seconds'] ?? 0), PDO::PARAM_INT);
        $stmt->bindValue(':preview', !empty($data['is_preview']) ? 1 : 0, PDO::PARAM_INT);
    }

    /**
     * Swap a row with its neighbour.
     *
     * Up/down rather than drag-and-drop indexes: it is one atomic swap, works
     * without JavaScript, and cannot leave the list in a half-renumbered state
     * if the request dies partway.
     *
     * Table and column names are literals from this class only — never request
     * data — so interpolating them is safe. Values always bind.
     */
    private function reorder(string $table, string $parentColumn, int $parentId, int $rowId, string $direction): void
    {
        if (!\in_array($direction, ['up', 'down'], true)) {
            throw HttpException::validation(['direction' => 'Must be "up" or "down".']);
        }

        Database::transaction(function (PDO $pdo) use ($table, $parentColumn, $parentId, $rowId, $direction): void {
            $current = $pdo->prepare(
                sprintf('SELECT position FROM %s WHERE id = :id AND %s = :parent', $table, $parentColumn)
            );
            $current->bindValue(':id', $rowId, PDO::PARAM_INT);
            $current->bindValue(':parent', $parentId, PDO::PARAM_INT);
            $current->execute();

            $position = $current->fetchColumn();
            if ($position === false) {
                throw HttpException::notFound('That item does not exist.');
            }
            $position = (int) $position;

            $comparison = $direction === 'up' ? '<' : '>';
            $order      = $direction === 'up' ? 'DESC' : 'ASC';

            $neighbour = $pdo->prepare(sprintf(
                'SELECT id, position FROM %s
                  WHERE %s = :parent AND position %s :position
                  ORDER BY position %s, id %s LIMIT 1',
                $table,
                $parentColumn,
                $comparison,
                $order,
                $order
            ));
            $neighbour->bindValue(':parent', $parentId, PDO::PARAM_INT);
            $neighbour->bindValue(':position', $position, PDO::PARAM_INT);
            $neighbour->execute();

            $swap = $neighbour->fetch();
            if ($swap === false) {
                return; // Already at the end; moving further is a no-op, not an error.
            }

            $update = $pdo->prepare(sprintf('UPDATE %s SET position = :position WHERE id = :id', $table));

            $update->execute([':position' => (int) $swap['position'], ':id' => $rowId]);
            $update->execute([':position' => $position, ':id' => (int) $swap['id']]);
        });
    }
}
