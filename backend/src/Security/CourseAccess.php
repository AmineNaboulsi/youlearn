<?php

declare(strict_types=1);

namespace App\Security;

use App\Http\HttpException;
use App\Repository\CourseRepository;
use App\Repository\EnrollmentRepository;

/**
 * The two questions every course-scoped endpoint has to answer:
 * may this caller *edit* this course, and may they *watch* it.
 *
 * Both live here rather than in each controller, because the answers are
 * subtle enough that three slightly different copies would eventually
 * disagree — and the one that disagreed would be the security hole.
 */
final class CourseAccess
{
    private CourseRepository $courses;
    private EnrollmentRepository $enrollments;

    public function __construct()
    {
        $this->courses     = new CourseRepository();
        $this->enrollments = new EnrollmentRepository();
    }

    /**
     * Can this caller change the course?
     *
     * Role alone is not enough: `course.manage` means "may manage courses", not
     * "may manage *this* course". An instructor gets through only for their own.
     */
    public function canManage(?Principal $principal, int $courseId): bool
    {
        if ($principal === null || !$principal->can(Permission::COURSE_MANAGE)) {
            return false;
        }

        if ($principal->can(Permission::COURSE_MANAGE_ANY)) {
            return true;
        }

        return $this->courses->instructorIdOf($courseId) === $principal->userId;
    }

    /**
     * As canManage(), but throws.
     *
     * A course that does not exist and a course belonging to someone else give
     * the same 404, so probing ids reveals nothing.
     */
    public function requireManage(?Principal $principal, int $courseId): Principal
    {
        if ($principal === null) {
            throw HttpException::unauthorized();
        }

        if ($this->canManage($principal, $courseId)) {
            return $principal;
        }

        if ($this->courses->instructorIdOf($courseId) === null) {
            throw HttpException::notFound('That course does not exist.');
        }

        throw HttpException::forbidden('This course belongs to another instructor.');
    }

    /**
     * Can this caller watch every lesson — as opposed to only the previews?
     *
     * Instructors and admins can, because they need to check their own material
     * without enrolling in it.
     */
    public function hasFullAccess(?Principal $principal, int $courseId): bool
    {
        if ($principal === null) {
            return false;
        }

        if ($this->canManage($principal, $courseId)) {
            return true;
        }

        return $this->enrollments->isEnrolled($principal->userId, $courseId);
    }
}
