<?php

declare(strict_types=1);

namespace App\Repository;

use App\Config\Database;
use App\Http\HttpException;
use PDO;

/**
 * Enrolments — who is taking what.
 *
 * This is the table the export feature exists to protect: it links a person's
 * name and email to their learning history, so every read path here is scoped
 * by the caller's identity rather than filtered afterwards.
 */
final class EnrollmentRepository
{
    public function isEnrolled(int $userId, int $courseId): bool
    {
        $stmt = Database::connection()->prepare(
            'SELECT 1 FROM enrollments WHERE user_id = :user AND course_id = :course LIMIT 1'
        );
        $stmt->bindValue(':user', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':course', $courseId, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchColumn() !== false;
    }

    /** @throws HttpException 409 when already enrolled, 404 when the course is not open. */
    public function enroll(int $userId, int $courseId): void
    {
        $pdo = Database::connection();

        // Only a published course can be joined. Checking here rather than in
        // the controller closes the window where a course is unpublished
        // between the visibility check and the insert.
        $check = $pdo->prepare('SELECT is_published FROM courses WHERE id = :course LIMIT 1');
        $check->bindValue(':course', $courseId, PDO::PARAM_INT);
        $check->execute();

        $published = $check->fetchColumn();
        if ($published === false) {
            throw HttpException::notFound('That course does not exist.');
        }
        if ((int) $published !== 1) {
            throw HttpException::notFound('That course is not open for enrolment.');
        }

        $stmt = $pdo->prepare('INSERT INTO enrollments (user_id, course_id) VALUES (:user, :course)');
        $stmt->bindValue(':user', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':course', $courseId, PDO::PARAM_INT);

        try {
            $stmt->execute();
        } catch (\PDOException $e) {
            if ($e->getCode() === '23000') {
                throw HttpException::conflict('You are already enrolled in this course.');
            }
            throw $e;
        }
    }

    public function withdraw(int $userId, int $courseId): bool
    {
        $stmt = Database::connection()->prepare(
            'DELETE FROM enrollments WHERE user_id = :user AND course_id = :course'
        );
        $stmt->bindValue(':user', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':course', $courseId, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->rowCount() > 0;
    }

    /**
     * Courses one learner is enrolled in.
     *
     * @return array{items: list<array<string, mixed>>, total: int}
     */
    public function forUser(int $userId, int $limit, int $offset): array
    {
        $pdo = Database::connection();

        $countStmt = $pdo->prepare('SELECT COUNT(*) FROM enrollments WHERE user_id = :user');
        $countStmt->bindValue(':user', $userId, PDO::PARAM_INT);
        $countStmt->execute();
        $total = (int) $countStmt->fetchColumn();

        $stmt = $pdo->prepare(
            'SELECT c.id, c.title, c.slug, c.subtitle, c.img, c.content_type, c.is_published,
                    cat.name AS category_name,
                    u.name    AS instructor_name,
                    e.enrolled_at
               FROM enrollments e
               JOIN courses c        ON c.id = e.course_id
               JOIN users u          ON u.id = c.instructor_id
          LEFT JOIN categories cat   ON cat.id = c.category_id
              WHERE e.user_id = :user
              ORDER BY e.enrolled_at DESC
              LIMIT :limit OFFSET :offset'
        );
        $stmt->bindValue(':user', $userId, PDO::PARAM_INT);
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return ['items' => $stmt->fetchAll(), 'total' => $total];
    }

    /**
     * Learners enrolled on courses owned by $instructorId, or every learner
     * when $instructorId is null (admin scope).
     *
     * Used by both the roster screen and the CSV export, so the scoping rule
     * lives in one place and cannot drift between the two.
     *
     * @return array{items: list<array<string, mixed>>, total: int}
     */
    public function roster(?int $instructorId, ?int $courseId, int $limit, int $offset): array
    {
        $pdo = Database::connection();

        $where  = [];
        $params = [];

        if ($instructorId !== null) {
            $where[] = 'c.instructor_id = :instructor';
            $params[':instructor'] = [$instructorId, PDO::PARAM_INT];
        }
        if ($courseId !== null) {
            $where[] = 'e.course_id = :course';
            $params[':course'] = [$courseId, PDO::PARAM_INT];
        }

        $clause = $where === [] ? '' : ' WHERE ' . implode(' AND ', $where);

        $countSql = 'SELECT COUNT(*) FROM enrollments e JOIN courses c ON c.id = e.course_id' . $clause;
        $countStmt = $pdo->prepare($countSql);
        foreach ($params as $key => [$value, $type]) {
            $countStmt->bindValue($key, $value, $type);
        }
        $countStmt->execute();
        $total = (int) $countStmt->fetchColumn();

        $stmt = $pdo->prepare(
            'SELECT e.enrolled_at,
                    c.id    AS course_id,
                    c.title AS course_title,
                    u.id    AS learner_id,
                    u.name  AS learner_name,
                    u.email AS learner_email,
                    u.is_active AS learner_active
               FROM enrollments e
               JOIN courses c ON c.id = e.course_id
               JOIN users u   ON u.id = e.user_id' . $clause . '
              ORDER BY e.enrolled_at DESC, u.id
              LIMIT :limit OFFSET :offset'
        );
        foreach ($params as $key => [$value, $type]) {
            $stmt->bindValue($key, $value, $type);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
        $stmt->execute();

        return ['items' => $stmt->fetchAll(), 'total' => $total];
    }
}
