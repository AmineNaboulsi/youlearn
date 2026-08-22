-- =============================================================================
-- 002 — Curriculum, uploaded files, and watch tracking
--
-- Turns a course from a title and a block of text into something a learner can
-- actually work through:
--
--   assets            every uploaded file (cover images, lesson videos)
--   upload_sessions   in-flight chunked uploads
--   course_sections   the named groups an instructor organises lessons into
--   lessons           an individual video or text lesson inside a section
--   lesson_progress   one row per learner per lesson: position, watch time
--
-- Apply to an existing database:
--   docker compose exec -T mysql mysql -uroot -proot youlearn < \
--     backend/Database/migrations/002-curriculum-and-assets.sql
-- =============================================================================

SET NAMES utf8mb4;
USE youlearn;

-- -----------------------------------------------------------------------------
-- assets
--
-- `public_id` is what appears in URLs. Sequential integers would let anyone
-- enumerate every file on the platform, so the id the world sees is random and
-- the id the database joins on is not.
--
-- `stored_path` is relative to the storage root, which lives OUTSIDE the web
-- root. Nothing under it is reachable by URL; every byte is served by a
-- controller that checks permission first.
-- -----------------------------------------------------------------------------
CREATE TABLE assets (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  public_id        CHAR(32)        NOT NULL,
  owner_id         INT UNSIGNED    NOT NULL,
  kind             ENUM('image', 'video') NOT NULL,
  original_name    VARCHAR(255)    NOT NULL,
  stored_path      VARCHAR(255)    NOT NULL,
  mime_type        VARCHAR(120)    NOT NULL,
  size_bytes       BIGINT UNSIGNED NOT NULL DEFAULT 0,
  checksum_sha256  CHAR(64)        NULL,
  duration_seconds INT UNSIGNED    NULL,
  created_at       DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_assets_public_id (public_id),
  KEY idx_assets_owner (owner_id, created_at),
  KEY idx_assets_kind (kind),
  CONSTRAINT fk_assets_owner FOREIGN KEY (owner_id)
    REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- upload_sessions
--
-- A chunked upload in progress. Rows are short-lived: `expires_at` lets a
-- sweeper reclaim the disk from uploads that were abandoned halfway, which
-- otherwise accumulate silently until a volume fills up at 3am.
-- -----------------------------------------------------------------------------
CREATE TABLE upload_sessions (
  id             CHAR(32)        NOT NULL,
  owner_id       INT UNSIGNED    NOT NULL,
  kind           ENUM('image', 'video') NOT NULL,
  original_name  VARCHAR(255)    NOT NULL,
  declared_size  BIGINT UNSIGNED NOT NULL,
  received_bytes BIGINT UNSIGNED NOT NULL DEFAULT 0,
  temp_path      VARCHAR(255)    NOT NULL,
  expires_at     DATETIME        NOT NULL,
  created_at     DATETIME        NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_upload_sessions_owner (owner_id),
  KEY idx_upload_sessions_expiry (expires_at),
  CONSTRAINT fk_upload_sessions_owner FOREIGN KEY (owner_id)
    REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- course_sections — the "groups of videos", each with its own name
-- -----------------------------------------------------------------------------
CREATE TABLE course_sections (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  course_id  INT UNSIGNED NOT NULL,
  title      VARCHAR(255) NOT NULL,
  summary    VARCHAR(500) NULL,
  position   INT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_sections_course_position (course_id, position),
  CONSTRAINT fk_sections_course FOREIGN KEY (course_id)
    REFERENCES courses (id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- lessons
--
-- `course_id` is denormalised from the section on purpose: almost every read
-- and every permission check is course-scoped, and carrying it here avoids a
-- join on the hottest path in the application.
--
-- The video asset is ON DELETE SET NULL rather than CASCADE — deleting a file
-- should leave a lesson that visibly needs a new video, not silently delete the
-- lesson and everyone's progress along with it.
-- -----------------------------------------------------------------------------
CREATE TABLE lessons (
  id               INT UNSIGNED NOT NULL AUTO_INCREMENT,
  course_id        INT UNSIGNED NOT NULL,
  section_id       INT UNSIGNED NOT NULL,
  title            VARCHAR(255) NOT NULL,
  summary          VARCHAR(1000) NULL,
  kind             ENUM('video', 'text') NOT NULL DEFAULT 'video',
  video_asset_id   BIGINT UNSIGNED NULL,
  text_content     MEDIUMTEXT   NULL,
  duration_seconds INT UNSIGNED NOT NULL DEFAULT 0,
  is_preview       TINYINT(1)   NOT NULL DEFAULT 0,
  position         INT UNSIGNED NOT NULL DEFAULT 0,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_lessons_course_position (course_id, position),
  KEY idx_lessons_section_position (section_id, position),
  KEY idx_lessons_preview (course_id, is_preview),
  CONSTRAINT fk_lessons_course FOREIGN KEY (course_id)
    REFERENCES courses (id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_lessons_section FOREIGN KEY (section_id)
    REFERENCES course_sections (id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_lessons_video FOREIGN KEY (video_asset_id)
    REFERENCES assets (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- lesson_progress
--
-- Three different numbers, because they answer three different questions:
--
--   last_position_seconds  where to resume playback
--   furthest_seconds       how far through they have actually got
--   watched_seconds        how much time they really spent watching
--
-- The last one only ever increases by the time genuinely elapsed during
-- playback, so scrubbing to the end does not register as having watched the
-- lesson. That distinction is the whole point of tracking watch time rather
-- than just position.
-- -----------------------------------------------------------------------------
CREATE TABLE lesson_progress (
  user_id               INT UNSIGNED NOT NULL,
  lesson_id             INT UNSIGNED NOT NULL,
  course_id             INT UNSIGNED NOT NULL,
  last_position_seconds INT UNSIGNED NOT NULL DEFAULT 0,
  furthest_seconds      INT UNSIGNED NOT NULL DEFAULT 0,
  watched_seconds       INT UNSIGNED NOT NULL DEFAULT 0,
  completed_at          DATETIME     NULL,
  first_viewed_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, lesson_id),
  KEY idx_progress_lesson (lesson_id),
  KEY idx_progress_course_user (course_id, user_id),
  KEY idx_progress_updated (updated_at),
  CONSTRAINT fk_progress_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_progress_lesson FOREIGN KEY (lesson_id)
    REFERENCES lessons (id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_progress_course FOREIGN KEY (course_id)
    REFERENCES courses (id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- courses.cover_asset_id
--
-- The old `img` column held an arbitrary remote URL. Uploaded covers are files
-- now. `img` stays for the seeded demo courses that point at Unsplash; a course
-- with a cover_asset_id uses that in preference.
-- -----------------------------------------------------------------------------
ALTER TABLE courses
  ADD COLUMN cover_asset_id BIGINT UNSIGNED NULL AFTER img,
  ADD CONSTRAINT fk_courses_cover FOREIGN KEY (cover_asset_id)
    REFERENCES assets (id) ON UPDATE CASCADE ON DELETE SET NULL;
