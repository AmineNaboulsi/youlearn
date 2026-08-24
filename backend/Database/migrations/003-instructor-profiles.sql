-- =============================================================================
-- 003 — Public instructor profiles
--
-- Gives an instructor a page of their own that they can hand to somebody who
-- has never heard of this platform: an avatar, a headline, a bio, a few links,
-- and their published courses, at a stable URL they choose.
--
-- Everything lives on `users` rather than in a separate profiles table. A
-- profile is one-to-one with an account and is read on the same query that
-- already loads the instructor, so a second table would buy a JOIN and nothing
-- else. The `profile_` prefix keeps it obvious which columns are presentation
-- and which are identity mirrored from Keycloak.
--
-- Nothing here is on by default. `profile_is_public` starts at 0, so running
-- this migration does not publish a page for anybody — the instructor opts in.
--
-- Apply to an existing database:
--   docker compose exec -T mysql mysql -uroot -proot youlearn < \
--     backend/Database/migrations/003-instructor-profiles.sql
--
-- ## Why this is a procedure and not a plain ALTER
--
-- It is safe to run twice. That is not tidiness — it is the difference between
-- a repair and a dead end.
--
-- Images roll out here on a timer and migrations are applied by hand, so an
-- image can reach production ahead of its schema. When it does, every query
-- naming a new column fails and the platform is down until somebody runs this
-- file. A plain `ALTER TABLE ... ADD COLUMN` makes that worse the moment it is
-- half-applied: the second attempt stops at `ERROR 1060 Duplicate column name`
-- having changed nothing, and the operator now has to work out by hand which
-- of eleven columns exist before they can write a statement that runs. Under
-- an outage, with a partially migrated table, that is the wrong puzzle to be
-- handed.
--
-- Guarded on information_schema, each step is a no-op when its object is
-- already there. Run it once, twice, or after an attempt that died partway:
-- the end state is the same and the summary at the bottom says what it is.
--
-- MySQL permits DDL inside a procedure — each ALTER commits implicitly — so
-- this needs no prepared statements, and every statement below reads as the
-- DDL it is.
-- =============================================================================

SET NAMES utf8mb4;
USE youlearn;

DROP PROCEDURE IF EXISTS yl_migrate_003;

DELIMITER //

CREATE PROCEDURE yl_migrate_003()
BEGIN
  DECLARE db VARCHAR(64);
  SET db = DATABASE();

  -- ---------------------------------------------------------------- columns --

  -- The public URL segment: /teachers/<profile_slug>. Chosen by the instructor
  -- rather than derived from their name, because a name changes and a shared
  -- link should not rot when it does. NULL means "never set one up", and NULL
  -- repeats freely under a UNIQUE key — which is exactly the behaviour wanted
  -- here, since most accounts will never have a slug at all.
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema = db AND table_name = 'users'
                    AND column_name = 'profile_slug') THEN
    ALTER TABLE users ADD COLUMN profile_slug VARCHAR(80) NULL AFTER role;
  END IF;

  -- Opt-in. A profile with this at 0 is reachable only by its owner, previewing.
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema = db AND table_name = 'users'
                    AND column_name = 'profile_is_public') THEN
    ALTER TABLE users ADD COLUMN profile_is_public TINYINT(1) NOT NULL DEFAULT 0
      AFTER profile_slug;
  END IF;

  -- Uploaded portrait. The FK is added further down, once the column exists.
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema = db AND table_name = 'users'
                    AND column_name = 'avatar_asset_id') THEN
    ALTER TABLE users ADD COLUMN avatar_asset_id BIGINT UNSIGNED NULL
      AFTER profile_is_public;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema = db AND table_name = 'users'
                    AND column_name = 'headline') THEN
    ALTER TABLE users ADD COLUMN headline VARCHAR(140) NULL AFTER avatar_asset_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema = db AND table_name = 'users'
                    AND column_name = 'bio') THEN
    ALTER TABLE users ADD COLUMN bio TEXT NULL AFTER headline;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema = db AND table_name = 'users'
                    AND column_name = 'profile_location') THEN
    ALTER TABLE users ADD COLUMN profile_location VARCHAR(120) NULL AFTER bio;
  END IF;

  -- A short list of {label, url} objects. JSON rather than a `profile_links`
  -- table: nothing ever queries across links, they are only ever read as a
  -- whole alongside the profile, and the API caps and validates the shape on
  -- write. A table would add a migration, a repository and two joins to store
  -- at most six rows that are always fetched together.
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema = db AND table_name = 'users'
                    AND column_name = 'profile_links') THEN
    ALTER TABLE users ADD COLUMN profile_links JSON NULL AFTER profile_location;
  END IF;

  -- The palette the instructor picked for their own page. Scoped to the public
  -- profile deliberately: the rest of the platform is light-only by design, and
  -- this column is the boundary of that exception.
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema = db AND table_name = 'users'
                    AND column_name = 'profile_theme') THEN
    ALTER TABLE users ADD COLUMN profile_theme ENUM('light', 'dark') NOT NULL
      DEFAULT 'light' AFTER profile_links;
  END IF;

  -- Which blocks the page renders. Separate flags rather than a JSON blob,
  -- because these are booleans the API reads on every public render and a
  -- column is cheaper to read and impossible to malform.
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema = db AND table_name = 'users'
                    AND column_name = 'profile_show_about') THEN
    ALTER TABLE users ADD COLUMN profile_show_about TINYINT(1) NOT NULL DEFAULT 1
      AFTER profile_theme;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema = db AND table_name = 'users'
                    AND column_name = 'profile_show_courses') THEN
    ALTER TABLE users ADD COLUMN profile_show_courses TINYINT(1) NOT NULL DEFAULT 1
      AFTER profile_show_about;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema = db AND table_name = 'users'
                    AND column_name = 'profile_show_stats') THEN
    ALTER TABLE users ADD COLUMN profile_show_stats TINYINT(1) NOT NULL DEFAULT 1
      AFTER profile_show_courses;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                  WHERE table_schema = db AND table_name = 'users'
                    AND column_name = 'profile_show_links') THEN
    ALTER TABLE users ADD COLUMN profile_show_links TINYINT(1) NOT NULL DEFAULT 1
      AFTER profile_show_stats;
  END IF;

  -- ---------------------------------------------------------------- indexes --

  IF NOT EXISTS (SELECT 1 FROM information_schema.statistics
                  WHERE table_schema = db AND table_name = 'users'
                    AND index_name = 'uq_users_profile_slug') THEN
    ALTER TABLE users ADD UNIQUE KEY uq_users_profile_slug (profile_slug);
  END IF;

  -- The public lookup is "this slug, if it is published". Both columns in one
  -- index means the common case never touches a row it then has to discard.
  IF NOT EXISTS (SELECT 1 FROM information_schema.statistics
                  WHERE table_schema = db AND table_name = 'users'
                    AND index_name = 'idx_users_public_profile') THEN
    ALTER TABLE users ADD KEY idx_users_public_profile (profile_is_public, profile_slug);
  END IF;

  -- ------------------------------------------------------------ foreign key --

  -- SET NULL rather than CASCADE: deleting an avatar file must not delete the
  -- account it belonged to.
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                  WHERE table_schema = db AND table_name = 'users'
                    AND constraint_name = 'fk_users_avatar'
                    AND constraint_type = 'FOREIGN KEY') THEN
    ALTER TABLE users
      ADD CONSTRAINT fk_users_avatar FOREIGN KEY (avatar_asset_id)
        REFERENCES assets (id) ON UPDATE CASCADE ON DELETE SET NULL;
  END IF;
END //

DELIMITER ;

CALL yl_migrate_003();
DROP PROCEDURE yl_migrate_003;

-- What the deployed code needs, and whether it is there now. Printed rather
-- than assumed: `mysql` exits 0 for a file whose statements all ran, which is a
-- different question from whether the schema is what the application expects.
SELECT
  (SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'users'
      AND column_name LIKE 'profile%')                          AS profile_columns_of_9,
  (SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'users'
      AND column_name IN ('avatar_asset_id', 'headline', 'bio'))  AS other_columns_of_3,
  (SELECT COUNT(*) FROM information_schema.statistics
    WHERE table_schema = DATABASE() AND table_name = 'users'
      AND index_name IN ('uq_users_profile_slug', 'idx_users_public_profile')) AS index_parts_of_3,
  (SELECT COUNT(*) FROM information_schema.table_constraints
    WHERE table_schema = DATABASE() AND table_name = 'users'
      AND constraint_name = 'fk_users_avatar')                    AS foreign_keys_of_1;
