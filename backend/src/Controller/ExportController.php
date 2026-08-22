<?php

declare(strict_types=1);

namespace App\Controller;

use App\Export\ExportPolicy;
use App\Export\ExportRules;
use App\Export\Pii;
use App\Http\HttpException;
use App\Http\Pagination;
use App\Http\Request;
use App\Http\Response;
use App\Repository\CourseRepository;
use App\Repository\EnrollmentRepository;
use App\Repository\ExportAuditRepository;
use App\Repository\UserRepository;
use App\Security\Principal;
use App\Security\RateLimiter;
use App\Support\Csv;

/**
 * Bulk export.
 *
 * The order of operations matters and is deliberate:
 *
 *   resolve rules → charge quota → query (capped) → mask → audit → respond
 *
 * Quota is charged *before* the query so an expensive request that is over
 * limit costs the database nothing. Auditing happens on every path, including
 * the ones that end in a 403 or a 429, so the log answers "who tried" and not
 * merely "who succeeded".
 */
final class ExportController
{
    private RateLimiter $limiter;
    private ExportAuditRepository $audit;

    public function __construct()
    {
        $this->limiter = new RateLimiter();
        $this->audit   = new ExportAuditRepository();
    }

    /**
     * What this caller may export, and how much quota they have left.
     *
     * @param array<string, string> $params
     */
    public function index(Request $request, ?Principal $principal, array $params): Response
    {
        $principal = $this->require($principal);

        $datasets = [];
        foreach (ExportPolicy::availableTo($principal) as $entry) {
            $entry['quota'] = $this->limiter->status(
                'export:' . $entry['dataset'],
                'user:' . $principal->subject,
                $entry['per_window'],
                $entry['window_hours'] * 3600
            );
            $datasets[] = $entry;
        }

        return Response::json([
            'status' => true,
            'data'   => [
                'datasets' => $datasets,
                'global_quota' => $this->limiter->status(
                    ExportPolicy::GLOBAL_BUCKET,
                    'user:' . $principal->subject,
                    ExportPolicy::GLOBAL_MAX_PER_WINDOW,
                    ExportPolicy::GLOBAL_WINDOW_SECONDS
                ),
                'absolute_max_rows' => ExportPolicy::ABSOLUTE_MAX_ROWS,
            ],
        ]);
    }

    /** @param array<string, string> $params */
    public function download(Request $request, ?Principal $principal, array $params): Response
    {
        $principal = $this->require($principal);
        $dataset   = $params['dataset'];

        $unmaskRequested = $request->query('include_personal_data') === '1';
        $courseFilter    = $this->optionalId($request->query('course'));

        $filters = [
            'course'                => $courseFilter,
            'include_personal_data' => $unmaskRequested,
        ];

        try {
            $rules = ExportPolicy::resolve($dataset, $principal);
        } catch (HttpException $e) {
            // A refused export is the most interesting kind to record.
            $this->recordQuietly($principal, $dataset, ExportAuditRepository::OUTCOME_DENIED, $filters, $e->getMessage(), $request);
            throw $e;
        }

        try {
            $this->limiter->hit(
                ExportPolicy::GLOBAL_BUCKET,
                'user:' . $principal->subject,
                ExportPolicy::GLOBAL_MAX_PER_WINDOW,
                ExportPolicy::GLOBAL_WINDOW_SECONDS
            );
            $this->limiter->hit($rules->bucket(), 'user:' . $principal->subject, $rules->perWindow, $rules->window);
        } catch (HttpException $e) {
            $this->recordQuietly($principal, $dataset, ExportAuditRepository::OUTCOME_RATE_LIMITED, $filters, $e->getMessage(), $request);
            throw $e;
        }

        $unmask = $rules->shouldUnmask($unmaskRequested);

        // One row over the ceiling is fetched purely to detect truncation, then
        // discarded — so a capped file can say honestly that it is incomplete.
        [$headers, $rows, $fetched] = $this->build($rules, $courseFilter, $unmask, $principal);

        $truncated = $fetched > $rules->maxRows;
        $rows      = \array_slice($rows, 0, $rules->maxRows);

        $this->record(
            $principal,
            $dataset,
            $truncated ? ExportAuditRepository::OUTCOME_TRUNCATED : ExportAuditRepository::OUTCOME_ALLOWED,
            \count($rows),
            $filters + ['masked' => !$unmask],
            $truncated ? sprintf('Capped at %d rows.', $rules->maxRows) : null,
            $request
        );

        return Response::csv(Csv::build($headers, $rows), $rules->filename(), [
            'X-Export-Rows'      => (string) \count($rows),
            'X-Export-Truncated' => $truncated ? 'true' : 'false',
            'X-Export-Masked'    => $unmask ? 'false' : 'true',
        ]);
    }

    /**
     * The audit trail itself, as JSON, for the admin screen.
     *
     * @param array<string, string> $params
     */
    public function auditLog(Request $request, ?Principal $principal, array $params): Response
    {
        $this->require($principal);

        $page    = Pagination::fromRequest($request, 25, 100);
        $outcome = $request->query('outcome');

        $valid = [
            ExportAuditRepository::OUTCOME_ALLOWED,
            ExportAuditRepository::OUTCOME_DENIED,
            ExportAuditRepository::OUTCOME_RATE_LIMITED,
            ExportAuditRepository::OUTCOME_TRUNCATED,
        ];

        $result = $this->audit->paginate(
            $page->perPage,
            $page->offset,
            \in_array($outcome, $valid, true) ? $outcome : null
        );

        return Response::json([
            'status'     => true,
            'data'       => $result['items'],
            'pagination' => $page->meta($result['total']),
        ]);
    }

    // ------------------------------------------------------------- builders --

    /**
     * @return array{0: list<string>, 1: list<array<int, mixed>>, 2: int}
     */
    private function build(ExportRules $rules, ?int $courseFilter, bool $unmask, Principal $principal): array
    {
        $fetchLimit = $rules->maxRows + 1;

        return match ($rules->dataset) {
            ExportPolicy::DATASET_ENROLLMENTS => $this->enrollments($rules, $courseFilter, $unmask, $fetchLimit),
            ExportPolicy::DATASET_COURSES     => $this->courses($rules, $fetchLimit),
            ExportPolicy::DATASET_LEARNERS    => $this->learners($unmask, $fetchLimit),
            ExportPolicy::DATASET_AUDIT       => $this->auditRows($unmask, $fetchLimit),
            default                           => throw HttpException::notFound('No such export.'),
        };
    }

    /** @return array{0: list<string>, 1: list<array<int, mixed>>, 2: int} */
    private function enrollments(ExportRules $rules, ?int $courseFilter, bool $unmask, int $limit): array
    {
        $result = (new EnrollmentRepository())->roster(
            $rules->scopedToInstructorId,
            $courseFilter,
            $limit,
            0
        );

        $rows = [];
        foreach ($result['items'] as $row) {
            $rows[] = [
                $row['course_id'],
                $row['course_title'],
                $unmask ? $row['learner_name']  : Pii::maskName((string) $row['learner_name']),
                $unmask ? $row['learner_email'] : Pii::maskEmail((string) $row['learner_email']),
                ((int) $row['learner_active']) === 1 ? 'active' : 'suspended',
                $row['enrolled_at'],
            ];
        }

        return [
            ['course_id', 'course_title', 'learner_name', 'learner_email', 'learner_status', 'enrolled_at'],
            $rows,
            \count($result['items']),
        ];
    }

    /** @return array{0: list<string>, 1: list<array<int, mixed>>, 2: int} */
    private function courses(ExportRules $rules, int $limit): array
    {
        $result = (new CourseRepository())->paginate([
            'instructor_id'  => $rules->scopedToInstructorId,
            'published_only' => false,
        ], $limit, 0, ExportPolicy::ABSOLUTE_MAX_ROWS);

        $rows = [];
        foreach ($result['items'] as $course) {
            $rows[] = [
                $course['id'],
                $course['title'],
                $course['category_name'] ?? '',
                $course['instructor_name'],
                implode(' | ', array_map(static fn (array $t): string => (string) $t['title'], $course['tags'])),
                ((int) $course['is_published']) === 1 ? 'published' : 'draft',
                $course['enrollment_count'],
                $course['created_at'],
            ];
        }

        return [
            ['course_id', 'title', 'category', 'instructor', 'tags', 'state', 'enrollments', 'created_at'],
            $rows,
            \count($result['items']),
        ];
    }

    /** @return array{0: list<string>, 1: list<array<int, mixed>>, 2: int} */
    private function learners(bool $unmask, int $limit): array
    {
        $result = (new UserRepository())->paginate([], null, $limit, 0);

        $rows = [];
        foreach ($result['items'] as $user) {
            $rows[] = [
                $user['id'],
                $unmask ? $user['name']  : Pii::maskName((string) $user['name']),
                $unmask ? $user['email'] : Pii::maskEmail((string) $user['email']),
                $user['role'],
                ((int) $user['is_active']) === 1 ? 'active' : 'suspended',
                $user['course_count'],
                $user['enrollment_count'],
                $user['created_at'],
                $user['last_seen_at'],
            ];
        }

        return [
            ['user_id', 'name', 'email', 'role', 'status', 'courses_authored', 'enrollments', 'created_at', 'last_seen_at'],
            $rows,
            \count($result['items']),
        ];
    }

    /** @return array{0: list<string>, 1: list<array<int, mixed>>, 2: int} */
    private function auditRows(bool $unmask, int $limit): array
    {
        $result = $this->audit->paginate($limit, 0);

        $rows = [];
        foreach ($result['items'] as $entry) {
            $rows[] = [
                $entry['id'],
                $unmask ? $entry['actor_email'] : Pii::maskEmail((string) $entry['actor_email']),
                $entry['actor_role'],
                $entry['dataset'],
                $entry['outcome'],
                $entry['row_count'],
                $unmask ? ($entry['ip_address'] ?? '') : '',
                $entry['reason'] ?? '',
                $entry['requested_at'],
            ];
        }

        return [
            ['id', 'actor', 'role', 'dataset', 'outcome', 'rows', 'ip_address', 'reason', 'requested_at'],
            $rows,
            \count($result['items']),
        ];
    }

    // ------------------------------------------------------------- helpers --

    /**
     * Write the audit row for a *successful* export.
     *
     * If the log cannot be written the export does not happen. Handing over a
     * file with no record of who took it is the one failure mode this feature
     * exists to prevent.
     *
     * @param array<string, mixed> $filters
     */
    private function record(
        Principal $principal,
        string $dataset,
        string $outcome,
        int $rows,
        array $filters,
        ?string $reason,
        Request $request,
    ): void {
        try {
            $this->write($principal, $dataset, $outcome, $rows, $filters, $reason, $request);
        } catch (\Throwable $e) {
            error_log('[youlearn] export audit write failed: ' . $e->getMessage());
            throw new HttpException(503, 'audit_unavailable', 'Exports are unavailable right now. Please try again shortly.');
        }
    }

    /**
     * Write the audit row for an export that was already going to fail.
     *
     * Here the audit is best-effort: the caller is getting a 403 or a 429
     * either way, and replacing that with a 503 would tell them less about
     * what happened, not more.
     *
     * @param array<string, mixed> $filters
     */
    private function recordQuietly(
        Principal $principal,
        string $dataset,
        string $outcome,
        array $filters,
        ?string $reason,
        Request $request,
    ): void {
        try {
            $this->write($principal, $dataset, $outcome, 0, $filters, $reason, $request);
        } catch (\Throwable $e) {
            error_log('[youlearn] export audit write failed: ' . $e->getMessage());
        }
    }

    /** @param array<string, mixed> $filters */
    private function write(
        Principal $principal,
        string $dataset,
        string $outcome,
        int $rows,
        array $filters,
        ?string $reason,
        Request $request,
    ): void {
        $this->audit->record(
            $principal,
            $dataset,
            $outcome,
            $rows,
            $filters,
            $reason,
            $request->clientIp(),
            $request->userAgent()
        );
    }

    private function require(?Principal $principal): Principal
    {
        if ($principal === null) {
            throw HttpException::unauthorized();
        }

        return $principal;
    }

    private function optionalId(?string $value): ?int
    {
        return ($value !== null && preg_match('/^\d{1,10}$/', $value) === 1 && (int) $value > 0)
            ? (int) $value
            : null;
    }
}
