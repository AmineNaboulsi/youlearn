<?php

declare(strict_types=1);

namespace App\Export;

use App\Http\HttpException;
use App\Security\Permission;
use App\Security\Principal;

/**
 * What may be exported, by whom, how much, and how often.
 *
 * Bulk export is the highest-risk capability on the platform: it converts a
 * read permission into a portable, offline copy of other people's data that no
 * later access-control change can claw back. So it is governed by an explicit
 * catalogue rather than by whatever a controller happens to SELECT.
 *
 * Four independent limits apply to every export:
 *
 *   1. Permission  — the dataset names the permission it requires.
 *   2. Scope       — a non-admin is silently narrowed to their own rows. This
 *                    is applied in SQL, not by filtering afterwards.
 *   3. Volume      — a hard row ceiling per request. Hitting it truncates and
 *                    is recorded as such, so a partial file is never mistaken
 *                    for a complete one.
 *   4. Frequency   — a per-dataset and a global hourly quota, so the row
 *                    ceiling cannot be defeated by paging through it.
 *
 * Personal data is masked by default even for callers allowed to export it.
 * Unmasked output requires an explicit opt-in, which is recorded separately in
 * the audit trail — so "I exported the roster" and "I exported the roster with
 * everyone's email address" are distinguishable after the fact.
 */
final class ExportPolicy
{
    public const DATASET_ENROLLMENTS = 'enrollments';
    public const DATASET_COURSES     = 'courses';
    public const DATASET_LEARNERS    = 'learners';
    public const DATASET_AUDIT       = 'export_audit';

    /** Nothing may exceed this, whatever a dataset says. */
    public const ABSOLUTE_MAX_ROWS = 10_000;

    /** Global quota across every dataset, per user. */
    public const GLOBAL_BUCKET = 'export:any';
    public const GLOBAL_MAX_PER_WINDOW = 12;
    public const GLOBAL_WINDOW_SECONDS = 3600;

    /**
     * @var array<string, array{
     *   permission: string,
     *   max_rows: int,
     *   per_window: int,
     *   window: int,
     *   admin_only: bool,
     *   has_pii: bool,
     *   label: string,
     *   description: string
     * }>
     */
    private const CATALOGUE = [
        self::DATASET_ENROLLMENTS => [
            'permission'  => Permission::EXPORT_OWN,
            'max_rows'    => 5_000,
            'per_window'  => 5,
            'window'      => 3600,
            'admin_only'  => false,
            'has_pii'     => true,
            'label'       => 'Enrolments',
            'description' => 'One row per learner per course, with the date they joined.',
        ],
        self::DATASET_COURSES => [
            'permission'  => Permission::EXPORT_OWN,
            'max_rows'    => 5_000,
            'per_window'  => 8,
            'window'      => 3600,
            'admin_only'  => false,
            'has_pii'     => false,
            'label'       => 'Courses',
            'description' => 'Course catalogue with category, tags and enrolment totals.',
        ],
        self::DATASET_LEARNERS => [
            'permission'  => Permission::EXPORT_ANY,
            'max_rows'    => 5_000,
            'per_window'  => 3,
            'window'      => 3600,
            'admin_only'  => true,
            'has_pii'     => true,
            'label'       => 'People',
            'description' => 'Every account on the platform with its role and status.',
        ],
        self::DATASET_AUDIT => [
            'permission'  => Permission::EXPORT_AUDIT_READ,
            'max_rows'    => 5_000,
            'per_window'  => 3,
            'window'      => 3600,
            'admin_only'  => true,
            'has_pii'     => true,
            'label'       => 'Export audit trail',
            'description' => 'Every export attempt: who, what, when, how many rows, and whether it was allowed.',
        ],
    ];

    /**
     * Resolve a dataset name into the rules that govern it.
     *
     * @throws HttpException 404 for an unknown dataset, 403 when not permitted.
     */
    public static function resolve(string $dataset, Principal $principal): ExportRules
    {
        $entry = self::CATALOGUE[$dataset] ?? null;

        if ($entry === null) {
            throw HttpException::notFound('No such export.');
        }

        if (!$principal->can($entry['permission'])) {
            throw HttpException::forbidden('You are not allowed to export this data.');
        }

        if ($entry['admin_only'] && !$principal->isAdmin()) {
            throw HttpException::forbidden('You are not allowed to export this data.');
        }

        return new ExportRules(
            dataset:    $dataset,
            label:      $entry['label'],
            maxRows:    min($entry['max_rows'], self::ABSOLUTE_MAX_ROWS),
            perWindow:  $entry['per_window'],
            window:     $entry['window'],
            hasPii:     $entry['has_pii'],
            // Only a platform administrator sees the whole platform. Everyone
            // else is scoped to what they own, no matter which dataset.
            scopedToInstructorId: $principal->isAdmin() ? null : $principal->userId,
            mayUnmaskPii: $principal->can(Permission::EXPORT_ANY),
        );
    }

    /**
     * The catalogue as this caller sees it — used to render the export screen
     * without the front end having to know the rules.
     *
     * @return list<array<string, mixed>>
     */
    public static function availableTo(Principal $principal): array
    {
        $available = [];

        foreach (self::CATALOGUE as $dataset => $entry) {
            if (!$principal->can($entry['permission'])) {
                continue;
            }
            if ($entry['admin_only'] && !$principal->isAdmin()) {
                continue;
            }

            $available[] = [
                'dataset'      => $dataset,
                'label'        => $entry['label'],
                'description'  => $entry['description'],
                'max_rows'     => min($entry['max_rows'], self::ABSOLUTE_MAX_ROWS),
                'per_window'   => $entry['per_window'],
                'window_hours' => (int) round($entry['window'] / 3600),
                'has_pii'      => $entry['has_pii'],
                'may_unmask'   => $entry['has_pii'] && $principal->can(Permission::EXPORT_ANY),
                'scope'        => $principal->isAdmin() ? 'platform' : 'own',
            ];
        }

        return $available;
    }
}
