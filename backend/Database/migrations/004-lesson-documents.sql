-- =============================================================================
-- 004 — Document lessons (PDF)
--
-- A lesson could be a video or written text. It can now also be a file the
-- instructor uploads — a PDF worksheet, a past paper, a set of notes — served
-- through the same authorised, range-capable route the videos already use.
--
-- Three changes, all additive:
--
--   assets.kind          gains 'document'
--   lessons.kind         gains 'document'
--   lessons.document_asset_id   new nullable FK into assets
--
-- A separate column rather than reusing `video_asset_id`: a lesson only ever
-- has one asset, so one column would have worked, but then a column called
-- `video_asset_id` would sometimes hold a PDF. The next person to read that
-- query would have to know better. Two honest columns cost a few bytes per row
-- and nothing else.
--
-- ON DELETE SET NULL matches the video: deleting a file should leave a lesson
-- that visibly needs a new one, not delete the lesson and everyone's progress.
--
-- Guarded on information_schema throughout, so this is a no-op where its object
-- already exists — run it once, twice, or after an attempt that died partway.
-- The lesson of 003, which was not guarded and cost an outage to repair.
--
-- Apply:
--   docker compose -f docker-compose.prod.yml exec -T mysql \
--     mysql -uroot -p"$MYSQL_ROOT_PASSWORD" youlearn < 004-lesson-documents.sql
-- =============================================================================

SET NAMES utf8mb4;
USE youlearn;

DROP PROCEDURE IF EXISTS yl_migrate_004;

DELIMITER //

CREATE PROCEDURE yl_migrate_004()
BEGIN
  -- ---------------------------------------------------------------- assets --
  -- MODIFY rewrites the whole enum, so it is only safe to run when 'document'
  -- is genuinely absent; the guard is what makes re-running harmless.
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'assets'
       AND column_name = 'kind' AND column_type LIKE '%document%'
  ) THEN
    ALTER TABLE assets
      MODIFY COLUMN kind ENUM('image', 'video', 'document') NOT NULL;
  END IF;

  -- --------------------------------------------------------------- lessons --
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'lessons'
       AND column_name = 'kind' AND column_type LIKE '%document%'
  ) THEN
    ALTER TABLE lessons
      MODIFY COLUMN kind ENUM('video', 'text', 'document') NOT NULL DEFAULT 'video';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
     WHERE table_schema = DATABASE() AND table_name = 'lessons'
       AND column_name = 'document_asset_id'
  ) THEN
    ALTER TABLE lessons
      ADD COLUMN document_asset_id BIGINT UNSIGNED NULL AFTER video_asset_id;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
     WHERE table_schema = DATABASE() AND table_name = 'lessons'
       AND constraint_name = 'fk_lessons_document'
  ) THEN
    ALTER TABLE lessons
      ADD CONSTRAINT fk_lessons_document FOREIGN KEY (document_asset_id)
        REFERENCES assets (id) ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END //

DELIMITER ;

CALL yl_migrate_004();
DROP PROCEDURE yl_migrate_004;

-- Report what is actually present rather than trusting the exit code, which
-- only says every statement ran — not that the schema now matches the code.
SELECT
  (SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'assets'
      AND column_name = 'kind' AND column_type LIKE '%document%')    AS assets_kind_of_1,
  (SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'lessons'
      AND column_name = 'kind' AND column_type LIKE '%document%')    AS lessons_kind_of_1,
  (SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'lessons'
      AND column_name = 'document_asset_id')                          AS document_column_of_1,
  (SELECT COUNT(*) FROM information_schema.table_constraints
    WHERE table_schema = DATABASE() AND table_name = 'lessons'
      AND constraint_name = 'fk_lessons_document')                    AS foreign_key_of_1;
