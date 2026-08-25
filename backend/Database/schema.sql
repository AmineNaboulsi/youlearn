-- =============================================================================
-- YouLearn — application schema
--
-- Identity note: Keycloak is the system of record for credentials, sessions and
-- role assignment. This database keeps a *mirror* row per user so the existing
-- foreign keys (courses.instructor_id, enrollments.user_id) and the reporting
-- joins keep working, and so a course survives with a readable author name.
-- There is deliberately no password column here — nothing in this database can
-- authenticate anyone.
-- =============================================================================

SET NAMES utf8mb4;
SET time_zone = '+00:00';

CREATE DATABASE IF NOT EXISTS youlearn
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE youlearn;

-- -----------------------------------------------------------------------------
-- users — mirror of the Keycloak user, provisioned just-in-time on first
-- authenticated request. `keycloak_id` is the token `sub` and is the real key;
-- `id` stays an INT only because the rest of the schema references it.
-- -----------------------------------------------------------------------------
CREATE TABLE users (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  keycloak_id   CHAR(36)     NOT NULL,
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(320) NOT NULL,
  role          ENUM('admin', 'enseignant', 'etudiant') NOT NULL DEFAULT 'etudiant',

  -- ---------------------------------------------------------------------------
  -- Public instructor profile (migration 003).
  --
  -- Presentation, not identity: everything above this block is mirrored from
  -- Keycloak on every request, everything in it is authored here. Off by
  -- default — `profile_is_public` starts at 0, so an account gets a public page
  -- only once its owner asks for one.
  -- ---------------------------------------------------------------------------

  -- The public URL segment: /teachers/<profile_slug>. Chosen rather than
  -- derived from the name, so a rename does not break a shared link. NULL
  -- repeats under a UNIQUE key, which is what lets most accounts have none.
  profile_slug      VARCHAR(80)  NULL,
  profile_is_public TINYINT(1)   NOT NULL DEFAULT 0,
  -- Uploaded portrait. FK added at the bottom of this file, after `assets`.
  avatar_asset_id   BIGINT UNSIGNED NULL,
  headline          VARCHAR(140) NULL,
  bio               TEXT         NULL,
  profile_location  VARCHAR(120) NULL,
  -- A capped list of {label, url}. Only ever read whole, alongside the profile.
  profile_links     JSON         NULL,
  -- Scoped exception to the light-only palette: this is the instructor's own
  -- page, and the column is the boundary of that exception.
  profile_theme     ENUM('light', 'dark') NOT NULL DEFAULT 'light',
  profile_show_about   TINYINT(1) NOT NULL DEFAULT 1,
  profile_show_courses TINYINT(1) NOT NULL DEFAULT 1,
  profile_show_stats   TINYINT(1) NOT NULL DEFAULT 1,
  profile_show_links   TINYINT(1) NOT NULL DEFAULT 1,

  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  last_seen_at  DATETIME     NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_keycloak_id (keycloak_id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_profile_slug (profile_slug),
  KEY idx_users_role (role),
  KEY idx_users_active_role (is_active, role),
  -- The public lookup is "this slug, if it is published".
  KEY idx_users_public_profile (profile_is_public, profile_slug)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- categories
-- -----------------------------------------------------------------------------
CREATE TABLE categories (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name       VARCHAR(160) NOT NULL,
  slug       VARCHAR(160) NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_name (name),
  UNIQUE KEY uq_categories_slug (slug)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- tags
-- -----------------------------------------------------------------------------
CREATE TABLE tags (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  title      VARCHAR(120) NOT NULL,
  slug       VARCHAR(120) NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_tags_title (title),
  UNIQUE KEY uq_tags_slug (slug)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- courses
--
-- `instructor_id` is RESTRICT-on-delete: deleting an instructor must not
-- silently orphan or destroy published course material. The admin flow
-- reassigns or explicitly deletes the courses first.
-- -----------------------------------------------------------------------------
CREATE TABLE courses (
  id            INT UNSIGNED NOT NULL AUTO_INCREMENT,
  instructor_id INT UNSIGNED NOT NULL,
  category_id   INT UNSIGNED NULL,
  title         VARCHAR(255) NOT NULL,
  slug          VARCHAR(255) NOT NULL,
  subtitle      VARCHAR(500) NULL,
  img           VARCHAR(2048) NULL,
  -- Set when the cover is an uploaded file rather than a remote URL. The FK is
  -- added at the bottom of this file, after `assets` exists.
  cover_asset_id BIGINT UNSIGNED NULL,
  description   TEXT         NULL,
  content_type  ENUM('text', 'video', 'document') NOT NULL DEFAULT 'text',
  content       MEDIUMTEXT   NULL,
  price         DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  is_published  TINYINT(1)   NOT NULL DEFAULT 0,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_courses_slug (slug),
  KEY idx_courses_instructor (instructor_id),
  KEY idx_courses_category (category_id),
  KEY idx_courses_published (is_published, created_at),
  FULLTEXT KEY ft_courses_search (title, subtitle, description),
  CONSTRAINT fk_courses_instructor FOREIGN KEY (instructor_id)
    REFERENCES users (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT fk_courses_category FOREIGN KEY (category_id)
    REFERENCES categories (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- course_tags — composite PK makes a duplicate tag a database-level impossibility
-- rather than something the application has to remember to check.
-- -----------------------------------------------------------------------------
CREATE TABLE course_tags (
  course_id INT UNSIGNED NOT NULL,
  tag_id    INT UNSIGNED NOT NULL,
  PRIMARY KEY (course_id, tag_id),
  KEY idx_course_tags_tag (tag_id),
  CONSTRAINT fk_course_tags_course FOREIGN KEY (course_id)
    REFERENCES courses (id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_course_tags_tag FOREIGN KEY (tag_id)
    REFERENCES tags (id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- enrollments
-- -----------------------------------------------------------------------------
CREATE TABLE enrollments (
  user_id     INT UNSIGNED NOT NULL,
  course_id   INT UNSIGNED NOT NULL,
  enrolled_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, course_id),
  KEY idx_enrollments_course (course_id),
  KEY idx_enrollments_date (enrolled_at),
  CONSTRAINT fk_enrollments_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_enrollments_course FOREIGN KEY (course_id)
    REFERENCES courses (id) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- export_audit — one row per *attempted* bulk export, including denials.
-- A denied attempt is the interesting one for detecting scraping, so outcome
-- is recorded rather than only logging successes.
-- -----------------------------------------------------------------------------
CREATE TABLE export_audit (
  id            BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id       INT UNSIGNED NULL,
  keycloak_id   CHAR(36)     NOT NULL,
  actor_email   VARCHAR(320) NOT NULL,
  actor_role    VARCHAR(32)  NOT NULL,
  dataset       VARCHAR(64)  NOT NULL,
  outcome       ENUM('allowed', 'denied', 'rate_limited', 'truncated') NOT NULL,
  row_count     INT UNSIGNED NOT NULL DEFAULT 0,
  filters       JSON         NULL,
  reason        VARCHAR(255) NULL,
  ip_address    VARBINARY(16) NULL,
  user_agent    VARCHAR(512) NULL,
  requested_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_export_audit_actor (keycloak_id, requested_at),
  KEY idx_export_audit_dataset (dataset, requested_at),
  KEY idx_export_audit_outcome (outcome, requested_at),
  CONSTRAINT fk_export_audit_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- rate_limit_hits — sliding-window counter.
--
-- Deliberately in the database, not Redis: the brief rules out a caching layer,
-- and a durable counter is the safer choice anyway — restarting the API must not
-- hand an attacker a fresh quota. Rows older than the widest window are pruned
-- opportunistically on write.
-- -----------------------------------------------------------------------------
CREATE TABLE rate_limit_hits (
  id       BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  bucket   VARCHAR(64)  NOT NULL,
  actor    VARCHAR(128) NOT NULL,
  hit_at   DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  KEY idx_rate_limit_window (bucket, actor, hit_at),
  KEY idx_rate_limit_prune (hit_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE = utf8mb4_unicode_ci;

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
  kind             ENUM('image', 'video', 'document') NOT NULL,
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
  kind           ENUM('image', 'video', 'document') NOT NULL,
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
  kind             ENUM('video', 'text', 'document') NOT NULL DEFAULT 'video',
  video_asset_id   BIGINT UNSIGNED NULL,
  -- A lesson only ever has one asset, so one column would have done; two
  -- honest ones mean `video_asset_id` never quietly holds a PDF.
  document_asset_id BIGINT UNSIGNED NULL,
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
    REFERENCES assets (id) ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT fk_lessons_document FOREIGN KEY (document_asset_id)
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
-- Deferred foreign key: courses.cover_asset_id could not be declared inline
-- because `assets` is defined after `courses` (assets.owner_id needs `users`,
-- and keeping the people tables first reads better than ordering by dependency).
-- -----------------------------------------------------------------------------
ALTER TABLE courses
  ADD CONSTRAINT fk_courses_cover FOREIGN KEY (cover_asset_id)
    REFERENCES assets (id) ON UPDATE CASCADE ON DELETE SET NULL;

-- Same reason: users is the first table in the file and assets is near the end.
-- SET NULL rather than CASCADE — deleting an avatar file must not delete the
-- account it belonged to.
ALTER TABLE users
  ADD CONSTRAINT fk_users_avatar FOREIGN KEY (avatar_asset_id)
    REFERENCES assets (id) ON UPDATE CASCADE ON DELETE SET NULL;
