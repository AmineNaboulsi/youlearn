<?php

declare(strict_types=1);

namespace App\Controller;

use App\Http\HttpException;
use App\Http\Pagination;
use App\Http\Request;
use App\Http\Response;
use App\Repository\AssetRepository;
use App\Repository\CourseRepository;
use App\Repository\EnrollmentRepository;
use App\Security\Permission;
use App\Storage\FileStore;
use App\Security\Principal;
use App\Support\Validator;

final class CourseController
{
    private CourseRepository $courses;
    private EnrollmentRepository $enrollments;
    private AssetRepository $assets;

    public function __construct()
    {
        $this->courses     = new CourseRepository();
        $this->enrollments = new EnrollmentRepository();
        $this->assets      = new AssetRepository();
    }

    /**
     * Public catalogue. Published courses only, whoever is asking.
     *
     * @param array<string, string> $params
     */
    public function index(Request $request, ?Principal $principal, array $params): Response
    {
        $page = Pagination::fromRequest($request, 12, CourseRepository::MAX_PAGE_SIZE);

        $result = $this->courses->paginate([
            'search'         => $request->query('q'),
            'category_id'    => $this->optionalId($request->query('category')),
            'tag_ids'        => $this->idList($request->query('tags')),
            'published_only' => true,
        ], $page->perPage, $page->offset);

        return Response::json([
            'status'     => true,
            'data'       => $result['items'],
            'pagination' => $page->meta($result['total']),
        ]);
    }

    /**
     * The authoring list: courses the caller may edit.
     *
     * @param array<string, string> $params
     */
    public function mine(Request $request, ?Principal $principal, array $params): Response
    {
        $principal = $this->require($principal);
        $page      = Pagination::fromRequest($request, 12, CourseRepository::MAX_PAGE_SIZE);

        $result = $this->courses->paginate([
            'search'         => $request->query('q'),
            'category_id'    => $this->optionalId($request->query('category')),
            // An admin manages the whole catalogue; an instructor manages theirs.
            'instructor_id'  => $principal->can(Permission::COURSE_MANAGE_ANY) ? null : $principal->userId,
            'published_only' => false,
        ], $page->perPage, $page->offset);

        return Response::json([
            'status'     => true,
            'data'       => $result['items'],
            'pagination' => $page->meta($result['total']),
        ]);
    }

    /** @param array<string, string> $params */
    public function show(Request $request, ?Principal $principal, array $params): Response
    {
        $id = (int) $params['id'];

        // An unpublished course is visible to whoever may manage it, and to
        // nobody else — including anonymous callers, who get a plain 404 rather
        // than a 403 that would confirm the course exists.
        $maySeeDrafts = $principal !== null && $this->mayManage($principal, $id, throwOnDenied: false);

        $course = $this->courses->find($id, includeUnpublished: $maySeeDrafts);
        if ($course === null) {
            throw HttpException::notFound('That course does not exist.');
        }

        $payload = ['status' => true, 'data' => $course];

        if ($principal !== null) {
            $payload['viewer'] = [
                'is_enrolled' => $this->enrollments->isEnrolled($principal->userId, $id),
                'can_manage'  => $maySeeDrafts,
                'can_enroll'  => $principal->can(Permission::ENROLLMENT_CREATE),
            ];
        }

        return Response::json($payload);
    }

    /** @param array<string, string> $params */
    public function store(Request $request, ?Principal $principal, array $params): Response
    {
        $principal = $this->require($principal);

        [$data, $tagIds] = $this->validated($request, $principal);

        $id = $this->courses->create($data, $tagIds, $principal->userId);

        return Response::json([
            'status'  => true,
            'message' => 'Course created.',
            'data'    => $this->courses->find($id, includeUnpublished: true),
        ], 201);
    }

    /** @param array<string, string> $params */
    public function update(Request $request, ?Principal $principal, array $params): Response
    {
        $principal = $this->require($principal);
        $id        = (int) $params['id'];

        $this->mayManage($principal, $id);

        [$data, $tagIds] = $this->validated($request, $principal);

        $this->courses->update($id, $data, $tagIds);

        return Response::json([
            'status'  => true,
            'message' => 'Course updated.',
            'data'    => $this->courses->find($id, includeUnpublished: true),
        ]);
    }

    /** @param array<string, string> $params */
    public function setPublished(Request $request, ?Principal $principal, array $params): Response
    {
        $principal = $this->require($principal);
        $id        = (int) $params['id'];

        $this->mayManage($principal, $id);

        $validator = Validator::for($request->json());
        $published = $validator->bool('is_published');
        $validator->validate();

        $this->courses->setPublished($id, $published);

        return Response::json([
            'status'  => true,
            'message' => $published ? 'Course published.' : 'Course unpublished.',
            'data'    => $this->courses->find($id, includeUnpublished: true),
        ]);
    }

    /** @param array<string, string> $params */
    public function destroy(Request $request, ?Principal $principal, array $params): Response
    {
        $principal = $this->require($principal);
        $id        = (int) $params['id'];

        $this->mayManage($principal, $id);

        $this->courses->delete($id);

        return Response::json(['status' => true, 'message' => 'Course deleted.']);
    }

    // ------------------------------------------------------------- helpers --

    /**
     * @return array{0: array<string, mixed>, 1: list<int>}
     */
    private function validated(Request $request, Principal $principal): array
    {
        $body      = $request->json();
        $validator = Validator::for($body);

        $data = [
            'title'        => $validator->requiredString('title', 3, 255),
            'subtitle'     => $validator->optionalString('subtitle', 500),
            'description'  => $validator->optionalString('description', 5_000),
            'content'      => $validator->optionalString('content', 200_000),
            'content_type' => $validator->enum('content_type', ['text', 'video', 'document'], 'text'),
            'img'          => $validator->optionalUrl('img'),
            'cover_asset_id' => null,
            'category_id'  => $validator->optionalInt('category_id', null),
            'is_published' => $validator->bool('is_published') ? 1 : 0,
        ];

        // A cover can arrive two ways: a remote https:// URL, or the public id
        // of a file uploaded through /uploads. The upload is preferred when both
        // are present — it is the more deliberate act, and it is the one this
        // platform can guarantee stays reachable.
        $coverPublicId = $validator->optionalString('cover_public_id', 32);

        if ($coverPublicId !== '') {
            $asset = $this->assets->findByPublicId($coverPublicId);

            if ($asset === null || $asset['kind'] !== FileStore::KIND_IMAGE) {
                $validator->addError('cover_public_id', 'That image could not be found.');
            } elseif ((int) $asset['owner_id'] !== $principal->userId
                && !$principal->can(Permission::COURSE_MANAGE_ANY)) {
                // Attaching someone else's upload would let an instructor
                // reference a file they were never allowed to see.
                $validator->addError('cover_public_id', 'That image belongs to another account.');
            } else {
                $data['cover_asset_id'] = (int) $asset['id'];
                // Two covers would be ambiguous on read. The uploaded one wins.
                $data['img'] = '';
            }
        }

        // Three tags was the rule in the original app and it is a good one —
        // it is what makes tag filtering worth having at all.
        $tagIds = $validator->intList('tags', 3, 12);

        $validator->validate();

        return [$data, $tagIds];
    }

    private function require(?Principal $principal): Principal
    {
        if ($principal === null) {
            throw HttpException::unauthorized();
        }

        return $principal;
    }

    /**
     * Ownership check.
     *
     * Role alone is not enough here: `course.manage` says "may manage courses",
     * not "may manage *this* course". Without this an instructor could edit or
     * delete a colleague's material, which is exactly what the previous
     * implementation allowed.
     */
    private function mayManage(Principal $principal, int $courseId, bool $throwOnDenied = true): bool
    {
        if (!$principal->can(Permission::COURSE_MANAGE)) {
            if ($throwOnDenied) {
                throw HttpException::forbidden();
            }

            return false;
        }

        if ($principal->can(Permission::COURSE_MANAGE_ANY)) {
            return true;
        }

        $ownerId = $this->courses->instructorIdOf($courseId);

        if ($ownerId === null) {
            if ($throwOnDenied) {
                throw HttpException::notFound('That course does not exist.');
            }

            return false;
        }

        if ($ownerId !== $principal->userId) {
            if ($throwOnDenied) {
                throw HttpException::forbidden('This course belongs to another instructor.');
            }

            return false;
        }

        return true;
    }

    private function optionalId(?string $value): ?int
    {
        return ($value !== null && preg_match('/^\d{1,10}$/', $value) === 1 && (int) $value > 0)
            ? (int) $value
            : null;
    }

    /** @return list<int> */
    private function idList(?string $value): array
    {
        if ($value === null || $value === '') {
            return [];
        }

        $ids = [];
        foreach (explode(',', $value) as $part) {
            $part = trim($part);
            if (preg_match('/^\d{1,10}$/', $part) === 1 && (int) $part > 0) {
                $ids[(int) $part] = true;
            }
        }

        // Bounded so a crafted query string cannot build an arbitrarily large
        // IN (...) list and a matching subquery.
        return \array_slice(array_keys($ids), 0, 12);
    }
}
