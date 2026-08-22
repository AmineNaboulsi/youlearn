<?php

declare(strict_types=1);

namespace App\Repository;

use App\Config\Database;
use App\Http\HttpException;
use PDO;

/**
 * Uploaded files, and the chunked upload sessions that produce them.
 */
final class AssetRepository
{
    // ------------------------------------------------------- upload sessions --

    /** @return array{id: string, chunk_size: int} */
    public function createUploadSession(
        int $ownerId,
        string $kind,
        string $originalName,
        int $declaredSize,
        string $tempPath,
        int $chunkSize,
        int $ttlSeconds,
    ): array {
        $id = bin2hex(random_bytes(16));

        $stmt = Database::connection()->prepare(
            'INSERT INTO upload_sessions
                (id, owner_id, kind, original_name, declared_size, temp_path, expires_at)
             VALUES
                (:id, :owner, :kind, :name, :size, :path, (NOW() + INTERVAL :ttl SECOND))'
        );
        $stmt->bindValue(':id', $id);
        $stmt->bindValue(':owner', $ownerId, PDO::PARAM_INT);
        $stmt->bindValue(':kind', $kind);
        $stmt->bindValue(':name', mb_substr($originalName, 0, 255));
        $stmt->bindValue(':size', $declaredSize, PDO::PARAM_INT);
        $stmt->bindValue(':path', $tempPath);
        $stmt->bindValue(':ttl', $ttlSeconds, PDO::PARAM_INT);
        $stmt->execute();

        return ['id' => $id, 'chunk_size' => $chunkSize];
    }

    /**
     * Load an upload session that belongs to this caller and has not expired.
     *
     * Ownership is part of the lookup rather than a check afterwards: there is
     * no code path that can read someone else's session and then forget to
     * compare the owner.
     *
     * @return array<string, mixed>
     */
    public function requireUploadSession(string $id, int $ownerId): array
    {
        $stmt = Database::connection()->prepare(
            'SELECT id, owner_id, kind, original_name, declared_size, received_bytes, temp_path
               FROM upload_sessions
              WHERE id = :id AND owner_id = :owner AND expires_at > NOW()
              LIMIT 1'
        );
        $stmt->bindValue(':id', $id);
        $stmt->bindValue(':owner', $ownerId, PDO::PARAM_INT);
        $stmt->execute();

        $session = $stmt->fetch();
        if ($session === false) {
            throw HttpException::notFound('That upload has expired or does not exist.');
        }

        return $session;
    }

    public function recordChunk(string $id, int $totalReceived): void
    {
        $stmt = Database::connection()->prepare(
            'UPDATE upload_sessions SET received_bytes = :received WHERE id = :id'
        );
        $stmt->bindValue(':received', $totalReceived, PDO::PARAM_INT);
        $stmt->bindValue(':id', $id);
        $stmt->execute();
    }

    public function deleteUploadSession(string $id): void
    {
        $stmt = Database::connection()->prepare('DELETE FROM upload_sessions WHERE id = :id');
        $stmt->bindValue(':id', $id);
        $stmt->execute();
    }

    /** @return list<array<string, mixed>> Expired sessions, for the sweeper. */
    public function expiredUploadSessions(): array
    {
        $stmt = Database::connection()->query(
            'SELECT id, temp_path FROM upload_sessions WHERE expires_at <= NOW() LIMIT 500'
        );

        return $stmt === false ? [] : $stmt->fetchAll();
    }

    // ---------------------------------------------------------------- assets --

    /**
     * @param array{public_id: string, path: string, mime: string, size: int, checksum: string} $stored
     * @return array<string, mixed>
     */
    public function createAsset(
        int $ownerId,
        string $kind,
        string $originalName,
        array $stored,
        ?int $durationSeconds = null,
    ): array {
        $pdo = Database::connection();

        $stmt = $pdo->prepare(
            'INSERT INTO assets
                (public_id, owner_id, kind, original_name, stored_path, mime_type, size_bytes, checksum_sha256, duration_seconds)
             VALUES
                (:public_id, :owner, :kind, :name, :path, :mime, :size, :checksum, :duration)'
        );
        $stmt->bindValue(':public_id', $stored['public_id']);
        $stmt->bindValue(':owner', $ownerId, PDO::PARAM_INT);
        $stmt->bindValue(':kind', $kind);
        $stmt->bindValue(':name', mb_substr($originalName, 0, 255));
        $stmt->bindValue(':path', $stored['path']);
        $stmt->bindValue(':mime', $stored['mime']);
        $stmt->bindValue(':size', $stored['size'], PDO::PARAM_INT);
        $stmt->bindValue(':checksum', $stored['checksum']);
        $stmt->bindValue(':duration', $durationSeconds, $durationSeconds === null ? PDO::PARAM_NULL : PDO::PARAM_INT);
        $stmt->execute();

        $asset = $this->findById((int) $pdo->lastInsertId());
        if ($asset === null) {
            throw new HttpException(500, 'server_error', 'The file could not be recorded.');
        }

        return $asset;
    }

    /** @return array<string, mixed>|null */
    public function findById(int $id): ?array
    {
        $stmt = Database::connection()->prepare(
            'SELECT id, public_id, owner_id, kind, original_name, stored_path, mime_type,
                    size_bytes, duration_seconds, created_at
               FROM assets WHERE id = :id LIMIT 1'
        );
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetch() ?: null;
    }

    /** @return array<string, mixed>|null */
    public function findByPublicId(string $publicId): ?array
    {
        if (preg_match('/^[a-f0-9]{32}$/', $publicId) !== 1) {
            return null;
        }

        $stmt = Database::connection()->prepare(
            'SELECT id, public_id, owner_id, kind, original_name, stored_path, mime_type,
                    size_bytes, duration_seconds, created_at
               FROM assets WHERE public_id = :pid LIMIT 1'
        );
        $stmt->bindValue(':pid', $publicId);
        $stmt->execute();

        return $stmt->fetch() ?: null;
    }

    /**
     * Which course, if any, an asset is used by — as a cover or as a lesson
     * video. This is what the access check for serving the file keys on.
     *
     * MAX(is_preview) is deliberate: if the same file is used by *any* free
     * preview lesson, it is readable. Gating it behind a second, locked lesson
     * would protect nothing, because the identical bytes are already
     * downloadable through the preview. Access is a property of the file, not
     * of the lesson someone happens to reach it through.
     *
     * @return array{course_id: int, is_preview: int}|null
     */
    public function usageOf(int $assetId): ?array
    {
        $stmt = Database::connection()->prepare(
            'SELECT course_id, MAX(is_preview) AS is_preview FROM (
                 SELECT id AS course_id, 1 AS is_preview
                   FROM courses WHERE cover_asset_id = :asset_cover
                 UNION ALL
                 SELECT course_id, is_preview
                   FROM lessons WHERE video_asset_id = :asset_lesson
             ) asset_usage
             GROUP BY course_id
             LIMIT 1'
        );
        $stmt->bindValue(':asset_cover', $assetId, PDO::PARAM_INT);
        $stmt->bindValue(':asset_lesson', $assetId, PDO::PARAM_INT);
        $stmt->execute();

        $row = $stmt->fetch();

        return $row === false ? null : [
            'course_id'  => (int) $row['course_id'],
            'is_preview' => (int) $row['is_preview'],
        ];
    }

    public function delete(int $id): void
    {
        $stmt = Database::connection()->prepare('DELETE FROM assets WHERE id = :id');
        $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        $stmt->execute();
    }

    /**
     * Files owned by nobody's course — uploaded, then abandoned before being
     * attached to anything. Listed so storage can be reclaimed deliberately.
     *
     * @return list<array<string, mixed>>
     */
    public function orphans(int $olderThanHours = 24): array
    {
        $stmt = Database::connection()->prepare(
            'SELECT a.id, a.stored_path, a.size_bytes, a.original_name, a.created_at
               FROM assets a
          LEFT JOIN courses c ON c.cover_asset_id = a.id
          LEFT JOIN lessons l ON l.video_asset_id = a.id
              WHERE c.id IS NULL AND l.id IS NULL
                AND a.created_at < (NOW() - INTERVAL :hours HOUR)
              LIMIT 500'
        );
        $stmt->bindValue(':hours', $olderThanHours, PDO::PARAM_INT);
        $stmt->execute();

        return $stmt->fetchAll();
    }
}
