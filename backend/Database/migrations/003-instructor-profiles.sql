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
-- =============================================================================

SET NAMES utf8mb4;
USE youlearn;

ALTER TABLE users
  -- The public URL segment: /teachers/<profile_slug>. Chosen by the instructor
  -- rather than derived from their name, because a name changes and a shared
  -- link should not rot when it does. NULL means "never set one up", and NULL
  -- repeats freely under a UNIQUE key — which is exactly the behaviour wanted
  -- here, since most accounts will never have a slug at all.
  ADD COLUMN profile_slug VARCHAR(80) NULL AFTER role,

  -- Opt-in. A profile with this at 0 is reachable only by its owner, previewing.
  ADD COLUMN profile_is_public TINYINT(1) NOT NULL DEFAULT 0 AFTER profile_slug,

  -- Uploaded portrait. Mirrors courses.cover_asset_id: the FK is added at the
  -- bottom of this file because it points at `assets`.
  ADD COLUMN avatar_asset_id BIGINT UNSIGNED NULL AFTER profile_is_public,

  ADD COLUMN headline VARCHAR(140) NULL AFTER avatar_asset_id,
  ADD COLUMN bio TEXT NULL AFTER headline,
  ADD COLUMN profile_location VARCHAR(120) NULL AFTER bio,

  -- A short list of {label, url} objects. JSON rather than a `profile_links`
  -- table: nothing ever queries across links, they are only ever read as a
  -- whole alongside the profile, and the API caps and validates the shape on
  -- write. A table would add a migration, a repository and two joins to store
  -- at most six rows that are always fetched together.
  ADD COLUMN profile_links JSON NULL AFTER profile_location,

  -- The palette the instructor picked for their own page. Scoped to the public
  -- profile deliberately: the rest of the platform is light-only by design, and
  -- this column is the boundary of that exception.
  ADD COLUMN profile_theme ENUM('light', 'dark') NOT NULL DEFAULT 'light' AFTER profile_links,

  -- Which blocks the page renders. Separate flags rather than a JSON blob,
  -- because these are booleans the API reads on every public render and a
  -- column is cheaper to read and impossible to malform.
  ADD COLUMN profile_show_about TINYINT(1) NOT NULL DEFAULT 1 AFTER profile_theme,
  ADD COLUMN profile_show_courses TINYINT(1) NOT NULL DEFAULT 1 AFTER profile_show_about,
  ADD COLUMN profile_show_stats TINYINT(1) NOT NULL DEFAULT 1 AFTER profile_show_courses,
  ADD COLUMN profile_show_links TINYINT(1) NOT NULL DEFAULT 1 AFTER profile_show_stats,

  ADD UNIQUE KEY uq_users_profile_slug (profile_slug),

  -- The public lookup is "this slug, if it is published". Both columns in one
  -- index means the common case never touches a row it then has to discard.
  ADD KEY idx_users_public_profile (profile_is_public, profile_slug);

ALTER TABLE users
  ADD CONSTRAINT fk_users_avatar FOREIGN KEY (avatar_asset_id)
    REFERENCES assets (id) ON UPDATE CASCADE ON DELETE SET NULL;
