<?php

declare(strict_types=1);

namespace App\Repository;

use App\Config\Database;
use PDO;

/**
 * Watch tracking.
 *
 * Three numbers are kept per learner per lesson, because they answer different
 * questions and conflating them gives wrong answers to all three:
 *
 *   last_position_seconds  where playback resumes
 *   furthest_seconds       how far into the lesson they have reached
 *   watched_seconds        how much time they actually spent watching
 *
 * `watched_seconds` only ever grows by time genuinely elapsed during playback —
 * the client reports a small delta on a timer, and the server clamps it. So
 * dragging the scrubber to the end marks the lesson reached but not watched,
 * which is what makes "average watch time" mean anything to an instructor.
 */
final class ProgressRepository
{
    /**
     * The largest watch-time increase a single report may claim.
     *
     * The client reports every 10 seconds. A generous ceiling absorbs a slow
     * network or a backgrounded tab; anything beyond it is a client trying to
     * inflate its own numbers, and is discarded rather than trusted.
     */
    private const MAX_DELTA_SECONDS = 120;

    /** Fraction of a lesson that counts as having completed it. */
    private const COMPLETION_RATIO = 0.9;

    /**
     * Record playback progress.
     *
     * @return array{last_position_seconds: int, furthest_seconds: int, watched_seconds: int, completed: bool}
     */
    public function record(
        int $userId,
        int $lessonId,
        int $courseId,
        int $position,
        int $watchedDelta,
        int $durationSeconds,
    ): array {
        // Everything the client sent is clamped against the lesson's real
        // duration before it reaches the database.
        $ceiling  = $durationSeconds > 0 ? $durationSeconds : null;
        $position = max(0, $ceiling === null ? $position : min($position, $ceiling));
        $delta    = max(0, min($watchedDelta, self::MAX_DELTA_SECONDS));

        $completionThreshold = $ceiling === null
            ? null
            : (int) floor($ceiling * self::COMPLETION_RATIO);

        $pdo = Database::connection();

        $stmt = $pdo->prepare(
            'INSERT INTO lesson_progress
                 (user_id, lesson_id, course_id, last_position_seconds, furthest_seconds, watched_seconds, completed_at)
             VALUES
                 (:user, :lesson, :course, :position, :position_f, :delta, :completed)
             ON DUPLICATE KEY UPDATE
                 last_position_seconds = VALUES(last_position_seconds),
                 furthest_seconds      = GREATEST(furthest_seconds, VALUES(furthest_seconds)),
                 watched_seconds       = watched_seconds + VALUES(watched_seconds),
                 -- Completion is sticky: reaching the end once is enough, and
                 -- re-watching from the start must not un-complete a lesson.
                 completed_at          = COALESCE(completed_at, VALUES(completed_at))'
        );

        $completedNow = ($completionThreshold !== null && $position >= $completionThreshold)
            ? gmdate('Y-m-d H:i:s')
            : null;

        $stmt->bindValue(':user', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':lesson', $lessonId, PDO::PARAM_INT);
        $stmt->bindValue(':course', $courseId, PDO::PARAM_INT);
        $stmt->bindValue(':position', $position, PDO::PARAM_INT);
        $stmt->bindValue(':position_f', $position, PDO::PARAM_INT);
        $stmt->bindValue(':delta', $delta, PDO::PARAM_INT);
        $stmt->bindValue(':completed', $completedNow, $completedNow === null ? PDO::PARAM_NULL : PDO::PARAM_STR);
        $stmt->execute();

        return $this->forLesson($userId, $lessonId);
    }

    /**
     * @return array{last_position_seconds: int, furthest_seconds: int, watched_seconds: int, completed: bool}
     */
    public function forLesson(int $userId, int $lessonId): array
    {
        $stmt = Database::connection()->prepare(
            'SELECT last_position_seconds, furthest_seconds, watched_seconds, completed_at
               FROM lesson_progress WHERE user_id = :user AND lesson_id = :lesson LIMIT 1'
        );
        $stmt->bindValue(':user', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':lesson', $lessonId, PDO::PARAM_INT);
        $stmt->execute();

        $row = $stmt->fetch();

        return [
            'last_position_seconds' => (int) ($row['last_position_seconds'] ?? 0),
            'furthest_seconds'      => (int) ($row['furthest_seconds'] ?? 0),
            'watched_seconds'       => (int) ($row['watched_seconds'] ?? 0),
            'completed'             => ($row['completed_at'] ?? null) !== null,
        ];
    }

    /**
     * A learner's progress across a whole course.
     *
     * @return array{lessons: int, completed: int, watched_seconds: int, percent: int, next_lesson_id: ?int}
     */
    public function forCourse(int $userId, int $courseId): array
    {
        $stmt = Database::connection()->prepare(
            'SELECT
                (SELECT COUNT(*) FROM lessons WHERE course_id = :course_total) AS lessons,
                (SELECT COUNT(*) FROM lesson_progress
                  WHERE user_id = :user_done AND course_id = :course_done AND completed_at IS NOT NULL) AS completed,
                (SELECT COALESCE(SUM(watched_seconds), 0) FROM lesson_progress
                  WHERE user_id = :user_time AND course_id = :course_time) AS watched_seconds'
        );
        $stmt->bindValue(':course_total', $courseId, PDO::PARAM_INT);
        $stmt->bindValue(':user_done', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':course_done', $courseId, PDO::PARAM_INT);
        $stmt->bindValue(':user_time', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':course_time', $courseId, PDO::PARAM_INT);
        $stmt->execute();

        $row = $stmt->fetch() ?: ['lessons' => 0, 'completed' => 0, 'watched_seconds' => 0];

        $lessons   = (int) $row['lessons'];
        $completed = (int) $row['completed'];

        return [
            'lessons'         => $lessons,
            'completed'       => $completed,
            'watched_seconds' => (int) $row['watched_seconds'],
            'percent'         => $lessons > 0 ? (int) round(($completed / $lessons) * 100) : 0,
            'next_lesson_id'  => $this->nextLessonId($userId, $courseId),
        ];
    }

    /**
     * The lesson to resume on: the first one not yet completed, in curriculum
     * order. Falls back to the first lesson when everything is done, so
     * "continue" always leads somewhere.
     */
    public function nextLessonId(int $userId, int $courseId): ?int
    {
        $stmt = Database::connection()->prepare(
            'SELECT l.id
               FROM lessons l
               JOIN course_sections s ON s.id = l.section_id
          LEFT JOIN lesson_progress p ON p.lesson_id = l.id AND p.user_id = :user
              WHERE l.course_id = :course AND p.completed_at IS NULL
              ORDER BY s.position, s.id, l.position, l.id
              LIMIT 1'
        );
        $stmt->bindValue(':user', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':course', $courseId, PDO::PARAM_INT);
        $stmt->execute();

        $id = $stmt->fetchColumn();
        if ($id !== false) {
            return (int) $id;
        }

        $first = Database::connection()->prepare(
            'SELECT l.id FROM lessons l JOIN course_sections s ON s.id = l.section_id
              WHERE l.course_id = :course ORDER BY s.position, s.id, l.position, l.id LIMIT 1'
        );
        $first->bindValue(':course', $courseId, PDO::PARAM_INT);
        $first->execute();

        $id = $first->fetchColumn();

        return $id === false ? null : (int) $id;
    }

    // ------------------------------------------------------------ analytics --

    /**
     * Per-lesson engagement for an instructor.
     *
     * `viewers` counts distinct people who started the lesson — the "how many
     * users have already watched this" figure. It is computed on every call;
     * nothing is cached, so the number on screen is the number in the database.
     *
     * @return list<array<string, mixed>>
     */
    public function lessonAnalytics(int $courseId): array
    {
        $stmt = Database::connection()->prepare(
            'SELECT
                 l.id, l.title, l.position, l.duration_seconds, l.kind, l.is_preview,
                 s.id AS section_id, s.title AS section_title, s.position AS section_position,
                 COUNT(p.user_id)                                  AS viewers,
                 COALESCE(SUM(p.completed_at IS NOT NULL), 0)      AS completions,
                 COALESCE(ROUND(AVG(p.watched_seconds)), 0)        AS avg_watched_seconds,
                 COALESCE(SUM(p.watched_seconds), 0)               AS total_watched_seconds,
                 COALESCE(MAX(p.updated_at), NULL)                 AS last_activity_at
               FROM lessons l
               JOIN course_sections s      ON s.id = l.section_id
          LEFT JOIN lesson_progress p      ON p.lesson_id = l.id
              WHERE l.course_id = :course
              GROUP BY l.id, l.title, l.position, l.duration_seconds, l.kind, l.is_preview,
                       s.id, s.title, s.position
              ORDER BY s.position, s.id, l.position, l.id'
        );
        $stmt->bindValue(':course', $courseId, PDO::PARAM_INT);
        $stmt->execute();

        $rows = [];
        foreach ($stmt->fetchAll() as $row) {
            $duration = (int) $row['duration_seconds'];
            $avg      = (int) $row['avg_watched_seconds'];

            $rows[] = [
                'id'                    => (int) $row['id'],
                'title'                 => $row['title'],
                'kind'                  => $row['kind'],
                'is_preview'            => (int) $row['is_preview'] === 1,
                'section_title'         => $row['section_title'],
                'duration_seconds'      => $duration,
                'viewers'               => (int) $row['viewers'],
                'completions'           => (int) $row['completions'],
                'avg_watched_seconds'   => $avg,
                'total_watched_seconds' => (int) $row['total_watched_seconds'],
                // How much of the lesson the average viewer actually got through.
                // The most useful single number for spotting a lesson people abandon.
                'avg_completion_percent' => $duration > 0 ? min(100, (int) round(($avg / $duration) * 100)) : 0,
                'last_activity_at'      => $row['last_activity_at'],
            ];
        }

        return $rows;
    }

    /**
     * Course-level engagement headline.
     *
     * @return array{active_learners: int, total_watched_seconds: int, completions: int, watching_now: int}
     */
    public function courseAnalytics(int $courseId): array
    {
        $stmt = Database::connection()->prepare(
            'SELECT
                 COUNT(DISTINCT user_id)                      AS active_learners,
                 COALESCE(SUM(watched_seconds), 0)            AS total_watched_seconds,
                 COALESCE(SUM(completed_at IS NOT NULL), 0)   AS completions,
                 -- Anyone whose progress moved in the last five minutes is,
                 -- for practical purposes, watching right now.
                 COUNT(DISTINCT CASE WHEN updated_at > (NOW() - INTERVAL 5 MINUTE) THEN user_id END) AS watching_now
               FROM lesson_progress
              WHERE course_id = :course'
        );
        $stmt->bindValue(':course', $courseId, PDO::PARAM_INT);
        $stmt->execute();

        $row = $stmt->fetch() ?: [];

        return [
            'active_learners'       => (int) ($row['active_learners'] ?? 0),
            'total_watched_seconds' => (int) ($row['total_watched_seconds'] ?? 0),
            'completions'           => (int) ($row['completions'] ?? 0),
            'watching_now'          => (int) ($row['watching_now'] ?? 0),
        ];
    }

    /**
     * Per-learner progress on one course, for the instructor's roster view.
     *
     * @return array{items: list<array<string, mixed>>, total: int}
     */
    public function learnerProgress(int $courseId, int $limit, int $offset): array
    {
        $pdo = Database::connection();

        $count = $pdo->prepare('SELECT COUNT(*) FROM enrollments WHERE course_id = :course');
        $count->bindValue(':course', $courseId, PDO::PARAM_INT);
        $count->execute();
        $total = (int) $count->fetchColumn();

        $stmt = $pdo->prepare(
            'SELECT u.id, u.name, u.email, e.enrolled_at,
                    COALESCE(SUM(p.watched_seconds), 0)               AS watched_seconds,
                    COALESCE(SUM(p.completed_at IS NOT NULL), 0)      AS completed,
                    MAX(p.updated_at)                                 AS last_activity_at,
                    (SELECT COUNT(*) FROM lessons WHERE course_id = :course_total) AS lessons
               FROM enrollments e
               JOIN users u             ON u.id = e.user_id
          LEFT JOIN lesson_progress p   ON p.user_id = u.id AND p.course_id = e.course_id
              WHERE e.course_id = :course
              GROUP BY u.id, u.name, u.email, e.enrolled_at
              ORDER BY last_activity_at IS NULL, last_activity_at DESC
              LIMIT :limit OFFSET :offset'
        );
        $stmt->bindValue(':course', $courseId, PDO::PARAM_INT);
        $stmt->bindValue(':course_total', $courseId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        $items = [];
        foreach ($stmt->fetchAll() as $row) {
            $lessons   = (int) $row['lessons'];
            $completed = (int) $row['completed'];

            $items[] = [
                'user_id'          => (int) $row['id'],
                'name'             => $row['name'],
                'email'            => $row['email'],
                'enrolled_at'      => $row['enrolled_at'],
                'watched_seconds'  => (int) $row['watched_seconds'],
                'completed'        => $completed,
                'lessons'          => $lessons,
                'percent'          => $lessons > 0 ? (int) round(($completed / $lessons) * 100) : 0,
                'last_activity_at' => $row['last_activity_at'],
            ];
        }

        return ['items' => $items, 'total' => $total];
    }
}
