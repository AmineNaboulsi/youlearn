<?php

declare(strict_types=1);

namespace App\Controller;

use App\Http\HttpException;
use App\Http\Request;
use App\Http\Response;
use App\Repository\AssetRepository;
use App\Repository\CourseRepository;
use App\Repository\CurriculumRepository;
use App\Repository\ProgressRepository;
use App\Security\CourseAccess;
use App\Security\Principal;
use App\Storage\FileStore;
use App\Support\Validator;

/**
 * The curriculum: named sections holding ordered lessons.
 *
 * Reads are viewer-aware — a locked lesson comes back with its title and
 * duration but without its video URL — so the catalogue can show what a course
 * contains without giving it away.
 */
final class CurriculumController
{
    private CurriculumRepository $curriculum;
    private CourseRepository $courses;
    private ProgressRepository $progress;
    private AssetRepository $assets;
    private CourseAccess $access;

    public function __construct()
    {
        $this->curriculum = new CurriculumRepository();
        $this->courses    = new CourseRepository();
        $this->progress   = new ProgressRepository();
        $this->assets     = new AssetRepository();
        $this->access     = new CourseAccess();
    }

    // ---------------------------------------------------------------- read --

    /** @param array<string, string> $params */
    public function show(Request $request, ?Principal $principal, array $params): Response
    {
        $courseId = (int) $params['id'];

        $canManage = $this->access->canManage($principal, $courseId);
        $course = $this->courses->find($courseId, includeUnpublished: $canManage);

        if ($course === null) {
            throw HttpException::notFound('That course does not exist.');
        }

        $unlocked = $canManage || $this->access->hasFullAccess($principal, $courseId);

        $sections = $this->curriculum->forCourse($courseId, $principal?->userId, $unlocked);

        $payload = [
            'sections'         => $sections,
            'lesson_count'     => array_sum(array_column($sections, 'lesson_count')),
            'duration_seconds' => array_sum(array_column($sections, 'duration_seconds')),
            'unlocked'         => $unlocked,
            'can_manage'       => $canManage,
        ];

        if ($principal !== null && $unlocked) {
            $payload['progress'] = $this->progress->forCourse($principal->userId, $courseId);
        }

        return Response::json(['status' => true, 'data' => $payload]);
    }

    /**
     * One lesson, with everything the player needs to render it.
     *
     * @param array<string, string> $params
     */
    public function lesson(Request $request, ?Principal $principal, array $params): Response
    {
        $lessonId = (int) $params['id'];
        $lesson = $this->curriculum->findLesson($lessonId);

        if ($lesson === null) {
            throw HttpException::notFound('That lesson does not exist.');
        }

        $courseId  = (int) $lesson['course_id'];
        $canManage = $this->access->canManage($principal, $courseId);
        $unlocked  = $canManage || $this->access->hasFullAccess($principal, $courseId);
        $isPreview = (int) $lesson['is_preview'] === 1;

        // An unpublished course is invisible to anyone who cannot manage it,
        // regardless of enrolment.
        if ((int) $lesson['is_published'] !== 1 && !$canManage) {
            throw HttpException::notFound('That lesson does not exist.');
        }

        if (!$unlocked && !$isPreview) {
            if ($principal === null) {
                throw HttpException::unauthorized('Sign in to watch this lesson.');
            }
            throw HttpException::forbidden('Enrol in this course to watch this lesson.');
        }

        $neighbours = $this->curriculum->neighbours($courseId, $lessonId);

        $data = [
            'id'               => $lessonId,
            'course_id'        => $courseId,
            'course_title'     => $lesson['course_title'],
            'section_id'       => (int) $lesson['section_id'],
            'title'            => $lesson['title'],
            'summary'          => $lesson['summary'],
            'kind'             => $lesson['kind'],
            'duration_seconds' => (int) $lesson['duration_seconds'],
            'is_preview'       => $isPreview,
            'text_content'     => $lesson['text_content'],
            'video_url'        => $lesson['video_public_id'] === null ? null : '/assets/' . $lesson['video_public_id'],
            'video_mime'       => $lesson['video_mime'],
            'previous_lesson_id' => $neighbours['previous'],
            'next_lesson_id'     => $neighbours['next'],
            'can_manage'       => $canManage,
        ];

        if ($principal !== null) {
            $data['progress'] = $this->progress->forLesson($principal->userId, $lessonId);
        }

        return Response::json(['status' => true, 'data' => $data]);
    }

    // ------------------------------------------------------------ sections --

    /** @param array<string, string> $params */
    public function createSection(Request $request, ?Principal $principal, array $params): Response
    {
        $courseId = (int) $params['id'];
        $this->access->requireManage($principal, $courseId);

        $validator = Validator::for($request->json());
        $title     = $validator->requiredString('title', 2, 255);
        $summary   = $validator->optionalString('summary', 500);
        $validator->validate();

        $id = $this->curriculum->createSection($courseId, $title, $summary);

        return Response::json([
            'status'  => true,
            'message' => 'Section added.',
            'data'    => ['id' => $id],
        ], 201);
    }

    /** @param array<string, string> $params */
    public function updateSection(Request $request, ?Principal $principal, array $params): Response
    {
        $courseId = (int) $params['id'];
        $this->access->requireManage($principal, $courseId);

        $validator = Validator::for($request->json());
        $title     = $validator->requiredString('title', 2, 255);
        $summary   = $validator->optionalString('summary', 500);
        $validator->validate();

        $this->curriculum->updateSection((int) $params['sectionId'], $courseId, $title, $summary);

        return Response::json(['status' => true, 'message' => 'Section updated.']);
    }

    /** @param array<string, string> $params */
    public function deleteSection(Request $request, ?Principal $principal, array $params): Response
    {
        $courseId = (int) $params['id'];
        $this->access->requireManage($principal, $courseId);

        // Deleting a section cascades to its lessons, and lesson_progress
        // cascades from there. Say so, rather than letting an instructor
        // discover it from a support ticket.
        $this->curriculum->deleteSection((int) $params['sectionId'], $courseId);

        return Response::json([
            'status'  => true,
            'message' => 'Section deleted, along with its lessons and their watch history.',
        ]);
    }

    /** @param array<string, string> $params */
    public function moveSection(Request $request, ?Principal $principal, array $params): Response
    {
        $courseId = (int) $params['id'];
        $this->access->requireManage($principal, $courseId);

        $validator = Validator::for($request->json());
        $direction = $validator->enum('direction', ['up', 'down']);
        $validator->validate();

        $this->curriculum->moveSection((int) $params['sectionId'], $courseId, $direction);

        return Response::json(['status' => true, 'message' => 'Section moved.']);
    }

    // ------------------------------------------------------------- lessons --

    /** @param array<string, string> $params */
    public function createLesson(Request $request, ?Principal $principal, array $params): Response
    {
        $courseId  = (int) $params['id'];
        $sectionId = (int) $params['sectionId'];
        $principal = $this->access->requireManage($principal, $courseId);

        if (!$this->curriculum->sectionBelongsTo($sectionId, $courseId)) {
            throw HttpException::notFound('That section does not exist.');
        }

        $data = $this->validatedLesson($request, $principal);
        $id = $this->curriculum->createLesson($courseId, $sectionId, $data);

        return Response::json([
            'status'  => true,
            'message' => 'Lesson added.',
            'data'    => ['id' => $id],
        ], 201);
    }

    /** @param array<string, string> $params */
    public function updateLesson(Request $request, ?Principal $principal, array $params): Response
    {
        $courseId  = (int) $params['id'];
        $principal = $this->access->requireManage($principal, $courseId);

        $lesson = $this->curriculum->findLesson((int) $params['lessonId']);
        if ($lesson === null || (int) $lesson['course_id'] !== $courseId) {
            throw HttpException::notFound('That lesson does not exist.');
        }

        $data = $this->validatedLesson($request, $principal);
        $this->curriculum->updateLesson((int) $params['lessonId'], $courseId, $data);

        return Response::json(['status' => true, 'message' => 'Lesson saved.']);
    }

    /** @param array<string, string> $params */
    public function deleteLesson(Request $request, ?Principal $principal, array $params): Response
    {
        $courseId = (int) $params['id'];
        $this->access->requireManage($principal, $courseId);

        $this->curriculum->deleteLesson((int) $params['lessonId'], $courseId);

        return Response::json([
            'status'  => true,
            'message' => 'Lesson deleted, along with its watch history.',
        ]);
    }

    /** @param array<string, string> $params */
    public function moveLesson(Request $request, ?Principal $principal, array $params): Response
    {
        $courseId = (int) $params['id'];
        $this->access->requireManage($principal, $courseId);

        $lesson = $this->curriculum->findLesson((int) $params['lessonId']);
        if ($lesson === null || (int) $lesson['course_id'] !== $courseId) {
            throw HttpException::notFound('That lesson does not exist.');
        }

        $validator = Validator::for($request->json());
        $direction = $validator->enum('direction', ['up', 'down']);
        $validator->validate();

        $this->curriculum->moveLesson((int) $params['lessonId'], (int) $lesson['section_id'], $direction);

        return Response::json(['status' => true, 'message' => 'Lesson moved.']);
    }

    // -------------------------------------------------------------- private --

    /** @return array<string, mixed> */
    private function validatedLesson(Request $request, Principal $principal): array
    {
        $body      = $request->json();
        $validator = Validator::for($body);

        $kind = $validator->enum('kind', ['video', 'text'], 'video');

        $data = [
            'title'            => $validator->requiredString('title', 2, 255),
            'summary'          => $validator->optionalString('summary', 1000),
            'kind'             => $kind,
            'text_content'     => $validator->optionalString('text_content', 200_000),
            'duration_seconds' => $validator->optionalInt('duration_seconds', 0, 0, 86_400) ?? 0,
            'is_preview'       => $validator->bool('is_preview'),
            'video_asset_id'   => null,
        ];

        $assetPublicId = $validator->optionalString('video_public_id', 32);

        if ($assetPublicId !== '') {
            $asset = $this->assets->findByPublicId($assetPublicId);

            if ($asset === null || $asset['kind'] !== FileStore::KIND_VIDEO) {
                $validator->addError('video_public_id', 'That video could not be found.');
            } elseif ((int) $asset['owner_id'] !== $principal->userId
                && !$principal->can(\App\Security\Permission::COURSE_MANAGE_ANY)) {
                // Attaching someone else's upload would let an instructor
                // reference a file they were never allowed to see.
                $validator->addError('video_public_id', 'That video belongs to another account.');
            } else {
                $data['video_asset_id'] = (int) $asset['id'];

                // Prefer the duration measured from the file over anything the
                // form supplied, but keep a form value if the upload had none.
                if ($asset['duration_seconds'] !== null) {
                    $data['duration_seconds'] = (int) $asset['duration_seconds'];
                }
            }
        }

        if ($kind === 'video' && $data['video_asset_id'] === null && $assetPublicId === '') {
            $validator->addError('video_public_id', 'A video lesson needs a video. Upload one first.');
        }

        $validator->validate();

        return $data;
    }
}
