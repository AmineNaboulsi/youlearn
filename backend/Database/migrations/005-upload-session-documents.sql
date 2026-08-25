-- =============================================================================
-- 005 — Document uploads (the half 004 missed)
--
-- 004 taught `assets` and `lessons` about 'document', and the PHP was complete:
-- FileStore::KIND_DOCUMENT, a 100 MiB ceiling, an application/pdf allowlist.
-- What nobody widened was the table the upload writes FIRST.
--
-- A chunked upload opens a row in `upload_sessions` before a byte is stored, so
-- POST /uploads with kind='document' hit an ENUM('image','video') and MySQL
-- truncated it to '' — SQLSTATE 01000, 1265 Data truncated for column 'kind'.
-- Every PDF upload failed on its opening statement, on a fresh database as
-- surely as on an upgraded one, because schema.sql carried the same narrow
-- enum. That is fixed there too; this migration is for databases already built.
--
-- One change:
--
--   upload_sessions.kind   gains 'document'
--
-- Guarded on information_schema, like 004: a no-op where the value is already
-- present, so this is safe to run once, twice, or after a partial attempt.
--
-- Apply:
--   cd /opt/youlearn && set -a; . ./.env; set +a
--   docker compose -f docker-compose.prod.yml exec -T mysql \
--     mysql -uroot -p"$MYSQL_ROOT_PASSWORD" youlearn \
--     < backend/Database/migrations/005-upload-session-documents.sql
-- =============================================================================

SET NAMES utf8mb4;
USE youlearn;

-- Sessions that failed on the old enum left a row with kind = '' (the enum
-- error value), an empty part file, and no asset. They can never be finalised
-- — finalise() switches on the kind — so expire them and let the sweeper on
-- the next POST /uploads discard the temp file and delete the row.
--
-- Before the ALTER, not after: MODIFY rebuilds the table, and under
-- STRICT_TRANS_TABLES that rebuild can refuse a row whose stored value is not
-- in the new enum. Clearing them first means there is nothing to trip over.
UPDATE upload_sessions SET expires_at = NOW() WHERE kind = '';

DROP PROCEDURE IF EXISTS yl_migrate_005;

DELIMITER //

CREATE PROCEDURE yl_migrate_005()
BEGIN
  -- MODIFY rewrites the whole enum, so it is only safe to run when 'document'
  -- is genuinely absent; the guard is what makes re-running harmless.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'upload_sessions'
       AND column_name = 'kind' AND column_type LIKE '%document%'
  ) THEN
    ALTER TABLE upload_sessions
      MODIFY COLUMN kind ENUM('image', 'video', 'document') NOT NULL;
  END IF;
END //

DELIMITER ;

CALL yl_migrate_005();
DROP PROCEDURE yl_migrate_005;

-- Report what is actually present rather than trusting the exit code, which
-- only says every statement ran — not that the schema now matches the code.
SELECT
  (SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'upload_sessions'
      AND column_name = 'kind' AND column_type LIKE '%document%')   AS sessions_kind_of_1,
  (SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'assets'
      AND column_name = 'kind' AND column_type LIKE '%document%')   AS assets_kind_of_1,
  (SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'lessons'
      AND column_name = 'document_asset_id')                        AS document_column_of_1;
