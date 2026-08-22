<?php

declare(strict_types=1);

namespace App\Repository;

use App\Config\Database;
use PDO;

/**
 * Dashboard figures.
 *
 * Every method takes a nullable instructor id: null means platform-wide (admin)
 * and an id means "scoped to the courses this person owns". Scoping is applied
 * in the WHERE clause rather than by filtering results afterwards, so an
 * instructor's totals can never be computed from rows they may not read.
 */
final class StatsRepository
{
    /**
     * Headline counters.
     *
     * @return array{
     *   courses: int, published_courses: int, enrollments: int,
     *   learners: int, enrollments_last_30_days: int
     * }
     */
    public function summary(?int $instructorId): array
    {
        $pdo = Database::connection();

        $scope       = $instructorId === null ? '' : ' WHERE c.instructor_id = :instructor';
        $joinedScope = $instructorId === null ? '' : ' WHERE c.instructor_id = :instructor';

        $courses = $pdo->prepare(
            'SELECT COUNT(*) AS total, COALESCE(SUM(c.is_published), 0) AS published FROM courses c' . $scope
        );
        $this->bindInstructor($courses, $instructorId);
        $courses->execute();
        /** @var array{total: int, published: int} $courseRow */
        $courseRow = $courses->fetch() ?: ['total' => 0, 'published' => 0];

        $enrollments = $pdo->prepare(
            'SELECT COUNT(*) AS total,
                    COUNT(DISTINCT e.user_id) AS learners,
                    COALESCE(SUM(e.enrolled_at >= (NOW() - INTERVAL 30 DAY)), 0) AS recent
               FROM enrollments e
               JOIN courses c ON c.id = e.course_id' . $joinedScope
        );
        $this->bindInstructor($enrollments, $instructorId);
        $enrollments->execute();
        /** @var array{total: int, learners: int, recent: int} $enrollRow */
        $enrollRow = $enrollments->fetch() ?: ['total' => 0, 'learners' => 0, 'recent' => 0];

        return [
            'courses'                  => (int) $courseRow['total'],
            'published_courses'        => (int) $courseRow['published'],
            'enrollments'              => (int) $enrollRow['total'],
            'learners'                 => (int) $enrollRow['learners'],
            'enrollments_last_30_days' => (int) $enrollRow['recent'],
        ];
    }

    /**
     * Enrolments per day for the last N days, zero-filled.
     *
     * Gaps are filled in PHP rather than with a SQL calendar table: days with
     * no enrolments must still appear, or the chart silently compresses time
     * and every quiet week looks like a busy one.
     *
     * @return list<array{date: string, count: int}>
     */
    public function enrollmentsByDay(?int $instructorId, int $days = 30): array
    {
        $days = max(1, min($days, 365));

        $sql = 'SELECT DATE(e.enrolled_at) AS day, COUNT(*) AS total
                  FROM enrollments e
                  JOIN courses c ON c.id = e.course_id
                 WHERE e.enrolled_at >= (CURDATE() - INTERVAL :days DAY)'
             . ($instructorId === null ? '' : ' AND c.instructor_id = :instructor')
             . ' GROUP BY day';

        $stmt = Database::connection()->prepare($sql);
        $stmt->bindValue(':days', $days - 1, PDO::PARAM_INT);
        $this->bindInstructor($stmt, $instructorId);
        $stmt->execute();

        $counts = [];
        foreach ($stmt->fetchAll() as $row) {
            $counts[(string) $row['day']] = (int) $row['total'];
        }

        $series = [];
        $cursor = new \DateTimeImmutable('today');
        for ($i = $days - 1; $i >= 0; $i--) {
            $date = $cursor->sub(new \DateInterval('P' . $i . 'D'))->format('Y-m-d');
            $series[] = ['date' => $date, 'count' => $counts[$date] ?? 0];
        }

        return $series;
    }

    /**
     * Best-performing courses.
     *
     * @return list<array<string, mixed>>
     */
    public function topCourses(?int $instructorId, int $limit = 5): array
    {
        $sql = 'SELECT c.id, c.title, c.slug, c.is_published,
                       COUNT(e.user_id) AS enrollment_count
                  FROM courses c
             LEFT JOIN enrollments e ON e.course_id = c.id'
             . ($instructorId === null ? '' : ' WHERE c.instructor_id = :instructor')
             . ' GROUP BY c.id, c.title, c.slug, c.is_published
                 ORDER BY enrollment_count DESC, c.created_at DESC
                 LIMIT :limit';

        $stmt = Database::connection()->prepare($sql);
        $stmt->bindValue(':limit', max(1, min($limit, 20)), PDO::PARAM_INT);
        $this->bindInstructor($stmt, $instructorId);
        $stmt->execute();

        return $stmt->fetchAll();
    }

    /**
     * Platform-wide people counts. Admin only — the caller is checked before
     * this is reached, which is why it takes no scope argument.
     *
     * @return array{admin: int, enseignant: int, etudiant: int, suspended: int}
     */
    public function userCounts(): array
    {
        $stmt = Database::connection()->query(
            'SELECT role, COUNT(*) AS total, COALESCE(SUM(is_active = 0), 0) AS suspended
               FROM users GROUP BY role'
        );

        $counts = ['admin' => 0, 'enseignant' => 0, 'etudiant' => 0, 'suspended' => 0];

        foreach ($stmt === false ? [] : $stmt->fetchAll() as $row) {
            $role = (string) $row['role'];
            if (\array_key_exists($role, $counts)) {
                $counts[$role] = (int) $row['total'];
            }
            $counts['suspended'] += (int) $row['suspended'];
        }

        return $counts;
    }

    private function bindInstructor(\PDOStatement $stmt, ?int $instructorId): void
    {
        if ($instructorId !== null) {
            $stmt->bindValue(':instructor', $instructorId, PDO::PARAM_INT);
        }
    }
}
