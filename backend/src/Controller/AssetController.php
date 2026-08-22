<?php

declare(strict_types=1);

namespace App\Controller;

use App\Http\HttpException;
use App\Http\Request;
use App\Http\Response;
use App\Repository\AssetRepository;
use App\Repository\CourseRepository;
use App\Repository\EnrollmentRepository;
use App\Security\Permission;
use App\Security\Principal;
use App\Storage\FileStore;

/**
 * Serves uploaded files.
 *
 * Files live outside the web root, so this is the only way to read one — which
 * means access control happens on every byte rather than being a URL nobody is
 * supposed to guess.
 *
 * The rules:
 *   - a course cover is public (it appears in the catalogue)
 *   - a lesson video needs enrolment, unless the lesson is marked preview
 *   - the course's instructor and any admin can always read it
 *   - an asset attached to nothing is readable only by whoever uploaded it
 *
 * Range requests are implemented properly. Without them a browser cannot seek:
 * `<video>` issues `Range: bytes=...` to scrub, and a server that ignores it
 * either restarts the download or refuses to seek at all.
 */
final class AssetController
{
    /** Copied to the client in blocks this size. */
    private const BUFFER = 262_144; // 256 KiB

    private AssetRepository $assets;
    private EnrollmentRepository $enrollments;
    private CourseRepository $courses;
    private FileStore $store;

    public function __construct()
    {
        $this->assets      = new AssetRepository();
        $this->enrollments = new EnrollmentRepository();
        $this->courses     = new CourseRepository();
        $this->store       = FileStore::fromEnv();
    }

    /** @param array<string, string> $params */
    public function show(Request $request, ?Principal $principal, array $params): Response
    {
        $asset = $this->assets->findByPublicId($params['publicId']);

        if ($asset === null) {
            throw HttpException::notFound('That file does not exist.');
        }

        $this->assertMayRead($asset, $principal);

        $path = $this->store->absolutePath((string) $asset['stored_path']);
        $size = filesize($path);

        if ($size === false) {
            throw HttpException::notFound('That file is no longer available.');
        }

        [$start, $end, $isPartial] = $this->resolveRange($request->header('range'), $size);

        $length = $end - $start + 1;

        $headers = [
            'Content-Type'          => (string) $asset['mime_type'],
            'Content-Length'        => (string) $length,
            // Advertised so the browser knows seeking is available at all.
            'Accept-Ranges'         => 'bytes',
            'Content-Disposition'   => sprintf('inline; filename="%s"', $this->safeName((string) $asset['original_name'])),
            'X-Content-Type-Options' => 'nosniff',
            // Per-user authorisation decided this response; a shared cache must
            // not hand it to the next person who asks for the same URL.
            'Cache-Control'         => 'private, no-store',
        ];

        if ($isPartial) {
            $headers['Content-Range'] = sprintf('bytes %d-%d/%d', $start, $end, $size);
        }

        return Response::stream(
            fn () => $this->copyRange($path, $start, $length),
            $isPartial ? 206 : 200,
            $headers,
        );
    }

    // -------------------------------------------------------------- private --

    /** @param array<string, mixed> $asset */
    private function assertMayRead(array $asset, ?Principal $principal): void
    {
        // Images are catalogue artwork; they are public by nature and gating
        // them would only break the course cards for signed-out visitors.
        if ($asset['kind'] === FileStore::KIND_IMAGE) {
            return;
        }

        $usage = $this->assets->usageOf((int) $asset['id']);

        if ($usage === null) {
            // Not attached to a course yet — visible only to its uploader,
            // which is what makes the editor's preview work before saving.
            if ($principal !== null && (int) $asset['owner_id'] === $principal->userId) {
                return;
            }

            throw HttpException::notFound('That file does not exist.');
        }

        if ($usage['is_preview'] === 1) {
            return;
        }

        if ($principal === null) {
            throw HttpException::unauthorized('Sign in to watch this lesson.');
        }

        if ($principal->can(Permission::COURSE_MANAGE_ANY)) {
            return;
        }

        if ($this->courses->instructorIdOf($usage['course_id']) === $principal->userId) {
            return;
        }

        if ($this->enrollments->isEnrolled($principal->userId, $usage['course_id'])) {
            return;
        }

        throw HttpException::forbidden('Enrol in this course to watch the lesson.');
    }

    /**
     * Parse a Range header into concrete byte offsets.
     *
     * Only a single range is honoured. Multipart ranges are legal but no video
     * element asks for them, and implementing them would add a multipart
     * encoder for no practical gain.
     *
     * @return array{0: int, 1: int, 2: bool} start, end (inclusive), isPartial
     */
    private function resolveRange(?string $header, int $size): array
    {
        if ($header === null || $size === 0) {
            return [0, max(0, $size - 1), false];
        }

        if (preg_match('/^bytes=(\d*)-(\d*)$/', trim($header), $m) !== 1) {
            return [0, $size - 1, false];
        }

        [$rawStart, $rawEnd] = [$m[1], $m[2]];

        if ($rawStart === '' && $rawEnd === '') {
            return [0, $size - 1, false];
        }

        if ($rawStart === '') {
            // "bytes=-500" means the *last* 500 bytes. Players use this to read
            // the moov atom at the end of an MP4 before playing anything.
            $length = (int) $rawEnd;
            $start  = max(0, $size - $length);
            $end    = $size - 1;
        } else {
            $start = (int) $rawStart;
            $end   = $rawEnd === '' ? $size - 1 : min((int) $rawEnd, $size - 1);
        }

        if ($start > $end || $start >= $size) {
            throw new HttpException(
                416,
                'range_not_satisfiable',
                'That byte range is outside the file.',
                [],
                ['Content-Range' => sprintf('bytes */%d', $size)]
            );
        }

        return [$start, $end, true];
    }

    private function copyRange(string $path, int $start, int $length): void
    {
        $handle = fopen($path, 'rb');
        if ($handle === false) {
            return;
        }

        try {
            fseek($handle, $start);
            $remaining = $length;

            while ($remaining > 0 && !feof($handle)) {
                $chunk = fread($handle, (int) min(self::BUFFER, $remaining));
                if ($chunk === false || $chunk === '') {
                    break;
                }

                echo $chunk;
                $remaining -= \strlen($chunk);

                // Stop reading the moment the client goes away — otherwise a
                // cancelled seek keeps a worker busy pushing bytes at nobody.
                if (connection_aborted() !== 0) {
                    break;
                }

                flush();
            }
        } finally {
            fclose($handle);
        }
    }

    private function safeName(string $name): string
    {
        $clean = preg_replace('/[^A-Za-z0-9._ -]/', '_', $name) ?? 'file';

        return substr($clean, 0, 120);
    }
}
