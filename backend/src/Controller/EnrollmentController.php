<?php

declare(strict_types=1);

namespace App\Controller;

use App\Http\HttpException;
use App\Http\Pagination;
use App\Http\Request;
use App\Http\Response;
use App\Repository\CourseRepository;
use App\Repository\EnrollmentRepository;
use App\Security\Permission;
use App\Security\Principal;

final class EnrollmentController
{
    private EnrollmentRepository $enrollments;
    private CourseRepository $courses;

    public function __construct()
    {
        $this->enrollments = new EnrollmentRepository();
        $this->courses     = new CourseRepository();
    }

    /**
     * The signed-in learner's own enrolments.
     *
     * @param array<string, string> $params
     */
    public function mine(Request $request, ?Principal $principal, array $params): Response
    {
        $principal = $this->require($principal);
        $page      = Pagination::fromRequest($request, 12, 48);

        $result = $this->enrollments->forUser($principal->userId, $page->perPage, $page->offset);

        return Response::json([
            'status'     => true,
            'data'       => $result['items'],
            'pagination' => $page->meta($result['total']),
        ]);
    }

    /** @param array<string, string> $params */
    public function store(Request $request, ?Principal $principal, array $params): Response
    {
        $principal = $this->require($principal);
        $courseId  = (int) $params['id'];

        $this->enrollments->enroll($principal->userId, $courseId);

        return Response::json(['status' => true, 'message' => 'You are enrolled.'], 201);
    }

    /** @param array<string, string> $params */
    public function destroy(Request $request, ?Principal $principal, array $params): Response
    {
        $principal = $this->require($principal);
        $courseId  = (int) $params['id'];

        if (!$this->enrollments->withdraw($principal->userId, $courseId)) {
            throw HttpException::notFound('You are not enrolled in that course.');
        }

        return Response::json(['status' => true, 'message' => 'You have left the course.']);
    }

    /**
     * The roster an instructor sees for their courses, or an admin for all.
     *
     * @param array<string, string> $params
     */
    public function roster(Request $request, ?Principal $principal, array $params): Response
    {
        $principal = $this->require($principal);

        if (!$principal->can(Permission::STATS_READ)) {
            throw HttpException::forbidden();
        }

        $page     = Pagination::fromRequest($request, 20, 100);
        $courseId = $this->optionalId($request->query('course'));

        // Null scope means every enrolment on the platform. Keyed off the
        // "manage any course" permission rather than a role name, so the rule
        // stays in one place if the role model ever changes.
        $scope = $principal->can(Permission::COURSE_MANAGE_ANY) ? null : $principal->userId;

        if ($courseId !== null && $scope !== null && $this->courses->instructorIdOf($courseId) !== $scope) {
            throw HttpException::notFound('That course does not exist.');
        }

        $result = $this->enrollments->roster($scope, $courseId, $page->perPage, $page->offset);

        return Response::json([
            'status'     => true,
            'data'       => $result['items'],
            'pagination' => $page->meta($result['total']),
        ]);
    }

    private function require(?Principal $principal): Principal
    {
        if ($principal === null) {
            throw HttpException::unauthorized();
        }

        return $principal;
    }

    private function optionalId(?string $value): ?int
    {
        return ($value !== null && preg_match('/^\d{1,10}$/', $value) === 1 && (int) $value > 0)
            ? (int) $value
            : null;
    }
}
