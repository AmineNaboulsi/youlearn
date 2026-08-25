<?php

declare(strict_types=1);

namespace App\Controller;

use App\Http\HttpException;
use App\Http\Request;
use App\Http\Response;
use App\Repository\AssetRepository;
use App\Security\Principal;
use App\Storage\FileStore;
use App\Support\Validator;

/**
 * Resumable, chunked file upload.
 *
 *   POST   /uploads                  begin — declares kind, name and size
 *   PATCH  /uploads/{id}             append the next chunk (raw binary body)
 *   POST   /uploads/{id}/complete    validate the content and store it
 *   DELETE /uploads/{id}             abandon and reclaim the disk
 *
 * Chunking is what makes a 700 MB lecture recording possible at all: PHP,
 * Apache and every load balancer in between impose limits on a single request
 * body, and a two-hour upload over hotel wifi will be interrupted at least
 * once. Each chunk is a short, independent request, and `received_bytes` tells
 * a resuming client exactly where to continue from.
 *
 * The declared size is checked against the ceiling *before* a single byte is
 * accepted, so an oversized upload costs the server nothing.
 */
final class UploadController
{
    /** An abandoned upload's disk is reclaimed after this long. */
    private const SESSION_TTL_SECONDS = 86_400;

    private AssetRepository $assets;
    private FileStore $store;

    public function __construct()
    {
        $this->assets = new AssetRepository();
        $this->store  = FileStore::fromEnv();
    }

    /** @param array<string, string> $params */
    public function begin(Request $request, ?Principal $principal, array $params): Response
    {
        $principal = $this->require($principal);

        $validator = Validator::for($request->json());
        $kind      = $validator->enum('kind', [
            FileStore::KIND_IMAGE,
            FileStore::KIND_VIDEO,
            FileStore::KIND_DOCUMENT,
        ]);
        $name      = $validator->requiredString('filename', 1, 255);
        $size      = $validator->requiredInt('size_bytes', 1, PHP_INT_MAX);
        $validator->validate();

        $ceiling = FileStore::maxBytes($kind);
        if ($size > $ceiling) {
            throw HttpException::validation([
                'size_bytes' => sprintf(
                    'That file is %s. The limit for a %s is %s.',
                    $this->humanBytes($size),
                    $kind,
                    $this->humanBytes($ceiling)
                ),
            ]);
        }

        // Opportunistic housekeeping: reclaim disk from uploads nobody finished.
        $this->sweep();

        $session = $this->assets->createUploadSession(
            $principal->userId,
            $kind,
            $name,
            $size,
            'tmp',
            FileStore::chunkSize(),
            self::SESSION_TTL_SECONDS,
        );

        // Create the (empty) part file now so the first chunk has somewhere to go.
        fclose($this->store->openTemp($session['id'], append: false));

        return Response::json([
            'status' => true,
            'data'   => [
                'upload_id'      => $session['id'],
                'chunk_size'     => $session['chunk_size'],
                'received_bytes' => 0,
                'accepted_types' => FileStore::acceptedTypes($kind),
                'max_bytes'      => $ceiling,
            ],
        ], 201);
    }

    /**
     * Append one chunk. The body is raw bytes, streamed straight to disk.
     *
     * @param array<string, string> $params
     */
    public function append(Request $request, ?Principal $principal, array $params): Response
    {
        $principal = $this->require($principal);
        $session   = $this->assets->requireUploadSession($params['id'], $principal->userId);

        $offset = (int) ($request->query('offset') ?? '-1');
        $received = (int) $session['received_bytes'];

        // The client says where it thinks it is. Disagreement means a lost or
        // duplicated chunk, and silently appending anyway would corrupt the
        // file in a way that only shows up as an unplayable video later.
        if ($offset !== $received) {
            throw new HttpException(409, 'offset_mismatch', 'Chunk is out of order.', [
                'expected_offset' => $received,
            ]);
        }

        $remaining = (int) $session['declared_size'] - $received;
        if ($remaining <= 0) {
            throw new HttpException(409, 'upload_complete', 'This upload has already received every byte.');
        }

        $handle = $this->store->openTemp($session['id'], append: true);

        try {
            $written = $request->streamBodyTo($handle, min(FileStore::chunkSize(), $remaining));
        } finally {
            fclose($handle);
        }

        $total = $received + $written;
        $this->assets->recordChunk($session['id'], $total);

        return Response::json([
            'status' => true,
            'data'   => [
                'received_bytes' => $total,
                'declared_size'  => (int) $session['declared_size'],
                'complete'       => $total >= (int) $session['declared_size'],
            ],
        ]);
    }

    /** @param array<string, string> $params */
    public function complete(Request $request, ?Principal $principal, array $params): Response
    {
        $principal = $this->require($principal);
        $session   = $this->assets->requireUploadSession($params['id'], $principal->userId);

        $kind = (string) $session['kind'];

        // finalise() sniffs the real content type and refuses anything that is
        // not a playable video or a renderable image, whatever the filename said.
        $stored = $this->store->finalise($session['id'], $kind);

        // A duration the client reports from the browser's own <video> element.
        // Trusted only as a display hint — it is never used for access control,
        // and the progress endpoint clamps against it rather than believing it.
        $validator = Validator::for($request->json());
        $duration  = $validator->optionalInt('duration_seconds', null, 0, 86_400);
        $validator->validate();

        $asset = $this->assets->createAsset(
            $principal->userId,
            $kind,
            (string) $session['original_name'],
            $stored,
            $duration,
        );

        $this->assets->deleteUploadSession($session['id']);

        return Response::json([
            'status'  => true,
            'message' => 'Upload stored.',
            'data'    => $this->present($asset),
        ], 201);
    }

    /** @param array<string, string> $params */
    public function abort(Request $request, ?Principal $principal, array $params): Response
    {
        $principal = $this->require($principal);
        $session   = $this->assets->requireUploadSession($params['id'], $principal->userId);

        $this->store->discardTemp($session['id']);
        $this->assets->deleteUploadSession($session['id']);

        return Response::json(['status' => true, 'message' => 'Upload cancelled.']);
    }

    // -------------------------------------------------------------- helpers --

    /** @param array<string, mixed> $asset */
    public static function present(array $asset): array
    {
        return [
            'id'               => (int) $asset['id'],
            'public_id'        => $asset['public_id'],
            'kind'             => $asset['kind'],
            'original_name'    => $asset['original_name'],
            'mime_type'        => $asset['mime_type'],
            'size_bytes'       => (int) $asset['size_bytes'],
            'duration_seconds' => $asset['duration_seconds'] === null ? null : (int) $asset['duration_seconds'],
            'url'              => '/assets/' . $asset['public_id'],
        ];
    }

    private function sweep(): void
    {
        // One request in twenty does the tidying, so it costs nothing on the
        // hot path but still happens often enough to matter.
        if (random_int(1, 20) !== 1) {
            return;
        }

        foreach ($this->assets->expiredUploadSessions() as $expired) {
            $this->store->discardTemp((string) $expired['id']);
            $this->assets->deleteUploadSession((string) $expired['id']);
        }

        $this->store->sweepAbandoned();
    }

    private function humanBytes(int $bytes): string
    {
        $units = ['B', 'KB', 'MB', 'GB'];
        $index = 0;
        $value = (float) $bytes;

        while ($value >= 1024 && $index < \count($units) - 1) {
            $value /= 1024;
            $index++;
        }

        return sprintf('%s %s', round($value, $value < 10 ? 1 : 0), $units[$index]);
    }

    private function require(?Principal $principal): Principal
    {
        if ($principal === null) {
            throw HttpException::unauthorized();
        }

        return $principal;
    }
}
