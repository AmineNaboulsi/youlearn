<?php

declare(strict_types=1);

namespace App\Storage;

use App\Http\HttpException;
use App\Security\VirusScanner;
use App\Support\Env;

/**
 * Where uploaded files live, and what is allowed to be one.
 *
 * The storage root is deliberately **outside the web root**. Apache serves
 * /var/www/html; files land in /var/www/storage. Nothing here is reachable by
 * guessing a URL, and — more importantly — a file that somehow ends up named
 * `.php` cannot be executed by requesting it, because there is no URL that maps
 * to it at all. Every byte is handed out by a controller that checks permission
 * first.
 *
 * Type is decided by *content*, not by the filename. An attacker controls the
 * extension and the Content-Type header; they do not control what the first
 * bytes of the file actually are.
 */
final class FileStore
{
    public const KIND_IMAGE = 'image';
    public const KIND_VIDEO = 'video';

    /** One chunk of a resumable upload. Small enough to sit under any PHP limit. */
    public const CHUNK_SIZE = 5_242_880; // 5 MiB

    /** Hard ceilings per kind. */
    private const MAX_BYTES = [
        self::KIND_IMAGE => 8_388_608,      // 8 MiB
        self::KIND_VIDEO => 4_294_967_296,  // 4 GiB
    ];

    /**
     * Formats a browser can actually play or render, mapped to their extension.
     *
     * Deliberately short. Accepting a format no browser supports means an
     * instructor uploads half a gigabyte and only discovers it is unplayable
     * when a learner complains.
     *
     * @var array<string, array<string, string>>
     */
    private const ALLOWED = [
        self::KIND_IMAGE => [
            'image/jpeg' => 'jpg',
            'image/png'  => 'png',
            'image/webp' => 'webp',
            'image/avif' => 'avif',
            'image/gif'  => 'gif',
        ],
        self::KIND_VIDEO => [
            'video/mp4'       => 'mp4',
            'video/webm'      => 'webm',
            'video/quicktime' => 'mov',
        ],
    ];

    public function __construct(
        private readonly string $root,
        private readonly ?VirusScanner $scanner = null,
    ) {
    }

    public static function fromEnv(): self
    {
        return new self(
            rtrim(Env::get('STORAGE_ROOT', '/var/www/storage') ?? '', '/'),
            VirusScanner::fromEnv(),
        );
    }

    public function root(): string
    {
        return $this->root;
    }

    public static function chunkSize(): int
    {
        return self::CHUNK_SIZE;
    }

    public static function maxBytes(string $kind): int
    {
        return self::MAX_BYTES[$kind] ?? 0;
    }

    /** @return list<string> Human-readable list of accepted types, for error messages. */
    public static function acceptedTypes(string $kind): array
    {
        return array_keys(self::ALLOWED[$kind] ?? []);
    }

    public static function isKind(string $kind): bool
    {
        return isset(self::ALLOWED[$kind]);
    }

    // ------------------------------------------------------------- temp files --

    /** Path for an in-progress upload. Never served, never linked. */
    public function tempPath(string $uploadId): string
    {
        $dir = $this->root . '/tmp';
        $this->ensureDirectory($dir);

        return $dir . '/' . $this->safeId($uploadId) . '.part';
    }

    public function openTemp(string $uploadId, bool $append): mixed
    {
        $path = $this->tempPath($uploadId);
        $handle = fopen($path, $append ? 'ab' : 'wb');

        if ($handle === false) {
            throw new HttpException(500, 'storage_unavailable', 'Upload storage is not writable.');
        }

        if (!$append) {
            // World-readable, unlike the 0640 a finished asset gets.
            //
            // clamd scans this file by path from its own container, running as
            // the clamav user, while this process writes it as www-data. Whether
            // it can read it would otherwise depend on the umask the API happens
            // to have — and the failure is a refused upload with "could not be
            // scanned", which points nowhere near a permission bit.
            //
            // The exposure is a partial upload inside a volume that only these
            // two containers mount, for as long as the upload is in flight.
            @chmod($path, 0o644);
        }

        return $handle;
    }

    public function discardTemp(string $uploadId): void
    {
        $path = $this->tempPath($uploadId);
        if (is_file($path)) {
            @unlink($path);
        }
    }

    // ------------------------------------------------------------- finalising --

    /**
     * Inspect a completed upload and move it into permanent storage.
     *
     * @return array{public_id: string, path: string, mime: string, size: int, checksum: string}
     * @throws HttpException 422 when the content is not an accepted type.
     */
    public function finalise(string $uploadId, string $kind): array
    {
        $temp = $this->tempPath($uploadId);

        if (!is_file($temp)) {
            throw new HttpException(409, 'upload_incomplete', 'No uploaded data was found for this upload.');
        }

        $size = filesize($temp);
        if ($size === false || $size === 0) {
            $this->discardTemp($uploadId);
            throw new HttpException(422, 'empty_upload', 'The uploaded file is empty.');
        }

        $mime = $this->detectMime($temp);
        $extension = self::ALLOWED[$kind][$mime] ?? null;

        if ($extension === null) {
            // Refused on content, after the bytes arrived — the only point at
            // which the real type is knowable.
            $this->discardTemp($uploadId);

            throw new HttpException(
                422,
                'unsupported_type',
                sprintf(
                    'That file is %s, which is not an accepted %s format. Accepted: %s.',
                    $mime,
                    $kind,
                    implode(', ', self::acceptedTypes($kind))
                )
            );
        }

        // Malware scan, after the type is known and before the file is moved
        // anywhere it could be served from. A refusal here discards the upload
        // exactly like an unsupported type does — there is never a window in
        // which an infected file exists under a servable path.
        if ($this->scanner !== null) {
            try {
                $this->scanner->assertClean($temp);
            } catch (HttpException $exception) {
                $this->discardTemp($uploadId);
                throw $exception;
            }
        }

        $publicId = bin2hex(random_bytes(16));

        // Sharded by month so no single directory accumulates hundreds of
        // thousands of entries, which makes every filesystem operation slow.
        $relativeDir = sprintf('assets/%s/%s', $kind, gmdate('Y/m'));
        $this->ensureDirectory($this->root . '/' . $relativeDir);

        $relativePath = sprintf('%s/%s.%s', $relativeDir, $publicId, $extension);
        $absolute = $this->root . '/' . $relativePath;

        if (!@rename($temp, $absolute)) {
            $this->discardTemp($uploadId);
            throw new HttpException(500, 'storage_failed', 'The upload could not be stored.');
        }

        // Never executable, never group- or world-writable.
        @chmod($absolute, 0o640);

        return [
            'public_id' => $publicId,
            'path'      => $relativePath,
            'mime'      => $mime,
            'size'      => (int) $size,
            'checksum'  => hash_file('sha256', $absolute) ?: '',
        ];
    }

    // --------------------------------------------------------------- reading --

    /**
     * Absolute path of a stored asset.
     *
     * The realpath check is the guard that matters: a `stored_path` of
     * `../../etc/passwd` resolves outside the root and is refused, so even a
     * corrupted database row cannot turn this into arbitrary file disclosure.
     */
    public function absolutePath(string $relativePath): string
    {
        $candidate = $this->root . '/' . ltrim($relativePath, '/');
        $resolved = realpath($candidate);

        if ($resolved === false) {
            throw new HttpException(404, 'file_missing', 'That file is no longer available.');
        }

        $rootReal = realpath($this->root);
        if ($rootReal === false || !str_starts_with($resolved, $rootReal . \DIRECTORY_SEPARATOR)) {
            throw new HttpException(404, 'file_missing', 'That file is no longer available.');
        }

        return $resolved;
    }

    public function delete(string $relativePath): void
    {
        try {
            $path = $this->absolutePath($relativePath);
        } catch (HttpException) {
            return; // Already gone; deleting it again is not an error.
        }

        @unlink($path);
    }

    /** Reclaim disk from uploads that were started and never finished. */
    public function sweepAbandoned(int $olderThanSeconds = 86_400): int
    {
        $dir = $this->root . '/tmp';
        if (!is_dir($dir)) {
            return 0;
        }

        $removed = 0;
        $cutoff = time() - $olderThanSeconds;

        foreach (glob($dir . '/*.part') ?: [] as $file) {
            if (filemtime($file) < $cutoff && @unlink($file)) {
                $removed++;
            }
        }

        return $removed;
    }

    // --------------------------------------------------------------- private --

    private function detectMime(string $path): string
    {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        if ($finfo === false) {
            throw new HttpException(500, 'storage_failed', 'The upload could not be inspected.');
        }

        $mime = finfo_file($finfo, $path);
        finfo_close($finfo);

        return \is_string($mime) ? $mime : 'application/octet-stream';
    }

    private function ensureDirectory(string $dir): void
    {
        if (is_dir($dir)) {
            return;
        }

        if (!@mkdir($dir, 0o750, true) && !is_dir($dir)) {
            throw new HttpException(500, 'storage_unavailable', 'Upload storage could not be created.');
        }
    }

    /** Upload ids are generated here, but never trust one that came back from a client. */
    private function safeId(string $uploadId): string
    {
        if (preg_match('/^[a-f0-9]{32}$/', $uploadId) !== 1) {
            throw new HttpException(400, 'invalid_upload_id', 'That upload id is not valid.');
        }

        return $uploadId;
    }
}
