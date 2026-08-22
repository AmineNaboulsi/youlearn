<?php

declare(strict_types=1);

namespace App\Controller;

use App\Http\HttpException;
use App\Http\Pagination;
use App\Http\Request;
use App\Http\Response;
use App\Repository\CurriculumRepository;
use App\Repository\ProgressRepository;
use App\Security\CourseAccess;
use App\Security\Principal;
use App\Support\Validator;

/**
 * Watch progress, and the analytics built from it.
 *
 * Progress is reported by the player on a timer. The endpoint is deliberately
 * cheap and idempotent-ish: it takes a position and a small elapsed-time delta,
 * clamps both, and folds them into one row. A dropped report costs at most ten
 * seconds of recorded watch time, so the client never needs to retry.
 */
final class ProgressController
{
    private ProgressRepository $progress;
    private CurriculumRepository $curriculum;
    private CourseAccess $access;

    public function __construct()
    {
        $this->progress   = new ProgressRepository();
        $this->curriculum = new CurriculumRepository();
        $this->access     = new CourseAccess();
    }

    /**
     * Report playback position.
     *
     * @param array<string, string> $params
     */
    public function record(Request $request, ?Principal $principal, array $params): Response
    {
        $principal = $this->require($principal);
        $lessonId  = (int) $params['id'];

        $lesson = $this->curriculum->findLesson($lessonId);
        if ($lesson === null) {
            throw HttpException::notFound('That lesson does not exist.');
        }

        $courseId = (int) $lesson['course_id'];

        // Progress is only recorded for people who may actually watch. Without
        // this check anyone could inflate a course's engagement figures by
        // POSTing at a lesson they have never seen.
        if (!$this->access->hasFullAccess($principal, $courseId) && (int) $lesson['is_preview'] !== 1) {
            throw HttpException::forbidden('Enrol in this course to track your progress.');
        }

        $validator = Validator::for($request->json());
        $position  = $validator->requiredInt('position_seconds', 0, 86_400);
        // Accepted generously and clamped by the repository rather than
        // rejected. A tab that was backgrounded for twenty minutes reports a
        // large delta through no fault of its own; refusing it would throw away
        // the position update too, which is the part that actually matters.
        $delta     = $validator->optionalInt('watched_delta_seconds', 0, 0, 86_400) ?? 0;
        $validator->validate();

        $result = $this->progress->record(
            $principal->userId,
            $lessonId,
            $courseId,
            $position,
            $delta,
            (int) $lesson['duration_seconds'],
        );

        return Response::json(['status' => true, 'data' => $result]);
    }

    /**
     * The signed-in learner's progress on one course.
     *
     * @param array<string, string> $params
     */
    public function forCourse(Request $request, ?Principal $principal, array $params): Response
    {
        $principal = $this->require($principal);
        $courseId  = (int) $params['id'];

        return Response::json([
            'status' => true,
            'data'   => $this->progress->forCourse($principal->userId, $courseId),
        ]);
    }

    /**
     * Engagement analytics for a course the caller owns.
     *
     * Every figure is computed from the database on each request — there is no
     * cached counter to drift — so a dashboard that re-fetches shows the real
     * number, including how many people are watching in the last five minutes.
     *
     * @param array<string, string> $params
     */
    public function analytics(Request $request, ?Principal $principal, array $params): Response
    {
        $courseId = (int) $params['id'];
        $this->access->requireManage($principal, $courseId);

        return Response::json([
            'status' => true,
            'data'   => [
                'summary'  => $this->progress->courseAnalytics($courseId),
                'lessons'  => $this->progress->lessonAnalytics($courseId),
                'totals'   => [
                    'lessons'          => $this->curriculum->lessonCount($courseId),
                    'duration_seconds' => $this->curriculum->courseDuration($courseId),
                ],
                // Stamped so the auto-refreshing dashboard can show when the
                // numbers were last read, rather than implying they are live
                // when the tab has been asleep.
                'generated_at' => gmdate('c'),
            ],
        ]);
    }

    /**
     * Per-learner progress for a course the caller owns.
     *
     * @param array<string, string> $params
     */
    public function learners(Request $request, ?Principal $principal, array $params): Response
    {
        $courseId = (int) $params['id'];
        $this->access->requireManage($principal, $courseId);

        $page = Pagination::fromRequest($request, 25, 100);
        $result = $this->progress->learnerProgress($courseId, $page->perPage, $page->offset);

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
}
