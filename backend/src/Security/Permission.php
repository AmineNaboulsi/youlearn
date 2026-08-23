<?php

declare(strict_types=1);

namespace App\Security;

/**
 * The permission catalogue and the role → permission map.
 *
 * Roles arrive from Keycloak (`realm_access.roles`); what a role may *do* is
 * decided here, in the resource server, so a change to the authorisation model
 * is a code review in this repository rather than a click in an admin console.
 *
 * Permissions listed here answer "may this kind of user call this endpoint at
 * all". They deliberately do not answer "may this user touch *this row*" —
 * that is ownership, enforced separately in the repositories, because a
 * role-based check can never express "their own course".
 */
final class Permission
{
    public const ROLE_ADMIN      = 'admin';
    public const ROLE_TEACHER    = 'enseignant';
    public const ROLE_STUDENT    = 'etudiant';

    /** @var list<string> */
    public const ALL_ROLES = [self::ROLE_ADMIN, self::ROLE_TEACHER, self::ROLE_STUDENT];

    // Courses
    public const COURSE_READ_PUBLISHED = 'course.read.published';
    public const COURSE_MANAGE         = 'course.manage';        // create / update / delete own
    public const COURSE_MANAGE_ANY     = 'course.manage.any';    // act on someone else's course
    public const COURSE_PUBLISH        = 'course.publish';

    // Enrolment
    public const ENROLLMENT_CREATE   = 'enrollment.create';
    public const ENROLLMENT_READ_OWN = 'enrollment.read.own';

    // Course material
    public const ASSET_UPLOAD    = 'asset.upload';      // upload covers and lesson videos
    public const PROGRESS_WRITE  = 'progress.write';    // record how far through a lesson you are

    // Public instructor profile
    //
    // Separate from COURSE_MANAGE even though the same two roles hold both. The
    // profile is a *published, world-readable* page under this platform's
    // domain; that is a different kind of privilege from editing a course, and
    // a future decision to withhold it from one role should be one line here
    // rather than a hunt for every route that happened to reuse course.manage.
    public const PROFILE_MANAGE  = 'profile.manage';

    // Taxonomy
    public const TAXONOMY_READ   = 'taxonomy.read';
    public const TAXONOMY_MANAGE = 'taxonomy.manage';

    // People
    public const USER_READ_ANY = 'user.read.any';
    public const USER_MANAGE   = 'user.manage';

    // Sessions
    public const SESSION_READ_OWN    = 'session.read.own';
    public const SESSION_REVOKE_OWN  = 'session.revoke.own';
    public const SESSION_READ_ANY    = 'session.read.any';
    public const SESSION_REVOKE_ANY  = 'session.revoke.any';

    // Reporting and export
    public const STATS_READ           = 'stats.read';
    public const EXPORT_OWN           = 'export.own';
    public const EXPORT_ANY           = 'export.any';
    public const EXPORT_AUDIT_READ    = 'export.audit.read';

    /**
     * @var array<string, list<string>>
     */
    private const ROLE_PERMISSIONS = [
        self::ROLE_STUDENT => [
            self::COURSE_READ_PUBLISHED,
            self::ENROLLMENT_CREATE,
            self::ENROLLMENT_READ_OWN,
            self::PROGRESS_WRITE,
            self::TAXONOMY_READ,
            self::SESSION_READ_OWN,
            self::SESSION_REVOKE_OWN,
        ],
        self::ROLE_TEACHER => [
            self::COURSE_READ_PUBLISHED,
            self::COURSE_MANAGE,
            self::COURSE_PUBLISH,
            self::ASSET_UPLOAD,
            self::PROFILE_MANAGE,
            // Instructors watch their own material to check it, which records
            // progress exactly as a learner's would.
            self::PROGRESS_WRITE,
            self::ENROLLMENT_READ_OWN,
            self::TAXONOMY_READ,
            self::SESSION_READ_OWN,
            self::SESSION_REVOKE_OWN,
            self::STATS_READ,
            self::EXPORT_OWN,
        ],
        self::ROLE_ADMIN => [
            self::COURSE_READ_PUBLISHED,
            self::COURSE_MANAGE,
            self::COURSE_MANAGE_ANY,
            self::COURSE_PUBLISH,
            self::ASSET_UPLOAD,
            self::PROFILE_MANAGE,
            self::PROGRESS_WRITE,
            self::ENROLLMENT_READ_OWN,
            self::TAXONOMY_READ,
            self::TAXONOMY_MANAGE,
            self::USER_READ_ANY,
            self::USER_MANAGE,
            self::SESSION_READ_OWN,
            self::SESSION_REVOKE_OWN,
            self::SESSION_READ_ANY,
            self::SESSION_REVOKE_ANY,
            self::STATS_READ,
            self::EXPORT_OWN,
            self::EXPORT_ANY,
            self::EXPORT_AUDIT_READ,
        ],
    ];

    /**
     * @param list<string> $roles
     * @return list<string>
     */
    public static function forRoles(array $roles): array
    {
        $granted = [];
        foreach ($roles as $role) {
            foreach (self::ROLE_PERMISSIONS[$role] ?? [] as $permission) {
                $granted[$permission] = true;
            }
        }

        return array_keys($granted);
    }

    /**
     * The single role the application treats as the user's own.
     *
     * A Keycloak user can hold several realm roles at once, so pick the most
     * privileged rather than whichever the token happened to list first —
     * otherwise an admin who is also an instructor could land in the
     * instructor-scoped view depending on claim ordering.
     *
     * @param list<string> $roles
     */
    public static function primaryRole(array $roles): ?string
    {
        foreach ([self::ROLE_ADMIN, self::ROLE_TEACHER, self::ROLE_STUDENT] as $candidate) {
            if (\in_array($candidate, $roles, true)) {
                return $candidate;
            }
        }

        return null;
    }
}
