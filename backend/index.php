<?php

declare(strict_types=1);

/**
 * YouLearn API — front controller.
 *
 * This is an OAuth2 resource server. It issues no credentials and stores no
 * passwords; it validates access tokens minted by Keycloak and decides what
 * the bearer is allowed to do. The route table below is the authorisation
 * model: every endpoint states the permission it demands, so an unprotected
 * route is visible as a missing `->requires(...)` rather than hidden inside a
 * controller method.
 */

require_once __DIR__ . '/vendor/autoload.php';

use App\Controller\AssetController;
use App\Controller\CourseController;
use App\Controller\CurriculumController;
use App\Controller\EnrollmentController;
use App\Controller\ExportController;
use App\Controller\MeController;
use App\Controller\ProfileController;
use App\Controller\ProgressController;
use App\Controller\SessionController;
use App\Controller\StatsController;
use App\Controller\TaxonomyController;
use App\Controller\UploadController;
use App\Controller\UserController;
use App\Http\Request;
use App\Http\Response;
use App\Http\Router;
use App\Repository\UserRepository;
use App\Security\Authenticator;
use App\Security\Permission;
use App\Security\RateLimiter;
use App\Security\TokenVerifier;
use App\Support\Env;

// Errors are logged, never rendered: a PHP notice printed before the JSON body
// would both corrupt the response and disclose paths.
ini_set('display_errors', '0');
ini_set('log_errors', '1');
error_reporting(E_ALL);

// Sessions are Keycloak's job. PHP never sets a cookie of its own, so there is
// no session fixation surface and nothing for CSRF to ride on.
ini_set('session.use_cookies', '0');

$router = new Router(
    new Authenticator(TokenVerifier::fromEnv(), new UserRepository()),
    new RateLimiter()
);

// -----------------------------------------------------------------------------
// Health
// -----------------------------------------------------------------------------
$router->get('/health', static fn (): Response => Response::json([
    'status'  => true,
    'service' => 'youlearn-api',
    'time'    => gmdate('c'),
]));

// -----------------------------------------------------------------------------
// Public catalogue
//
// Open by design, and throttled per IP because it is the only surface an
// unauthenticated client can reach.
// -----------------------------------------------------------------------------
$router->get('/courses', [CourseController::class, 'index'])
    ->throttle('catalogue', 120, 60);

$router->get('/courses/{id}', [CourseController::class, 'show'])
    ->throttle('catalogue', 120, 60);

$router->get('/categories', [TaxonomyController::class, 'categories'])
    ->throttle('catalogue', 120, 60);

$router->get('/tags', [TaxonomyController::class, 'tags'])
    ->throttle('catalogue', 120, 60);

// The curriculum is public: a visitor sees what a course contains, with locked
// lessons showing their title and length but no video URL. That is what makes a
// course worth enrolling in.
$router->get('/courses/{id}/curriculum', [CurriculumController::class, 'show'])
    ->throttle('catalogue', 120, 60);

// An instructor's public page. Unauthenticated by design — the whole point is a
// URL that can be handed to somebody who has no account here. The controller,
// not this line, is what keeps an unpublished profile invisible.
$router->get('/instructors/{slug}', [ProfileController::class, 'showPublic'])
    ->throttle('catalogue', 120, 60);

// -----------------------------------------------------------------------------
// Files
//
// Served by a controller rather than by Apache, because storage lives outside
// the web root and every read is permission-checked. Covers are public; lesson
// videos need enrolment unless the lesson is marked as a preview.
// -----------------------------------------------------------------------------
$router->get('/assets/{publicId}', [AssetController::class, 'show']);

// -----------------------------------------------------------------------------
// Lessons and watch progress
// -----------------------------------------------------------------------------
$router->get('/lessons/{id}', [CurriculumController::class, 'lesson']);

$router->post('/lessons/{id}/progress', [ProgressController::class, 'record'])
    ->requires(Permission::PROGRESS_WRITE)
    // The player reports every ten seconds; this ceiling sits far above that
    // and still stops a script inflating watch time by hammering the endpoint.
    ->throttle('progress', 480, 3600);

$router->get('/courses/{id}/progress', [ProgressController::class, 'forCourse'])
    ->requires(Permission::PROGRESS_WRITE);

// -----------------------------------------------------------------------------
// The signed-in caller
// -----------------------------------------------------------------------------
$router->get('/me', [MeController::class, 'show'])->authenticated();

// The caller's own instructor profile. PROFILE_MANAGE rather than
// COURSE_MANAGE: publishing a page under this domain is its own privilege.
$router->get('/me/profile', [ProfileController::class, 'showMine'])
    ->requires(Permission::PROFILE_MANAGE);

$router->put('/me/profile', [ProfileController::class, 'saveMine'])
    ->requires(Permission::PROFILE_MANAGE)
    ->throttle('profile-write', 60, 3600);

// -----------------------------------------------------------------------------
// Sessions
//
// Reading your own sessions is a right; revoking someone else's is a privilege.
// -----------------------------------------------------------------------------
$router->get('/me/sessions', [SessionController::class, 'mine'])
    ->requires(Permission::SESSION_READ_OWN);

$router->delete('/me/sessions', [SessionController::class, 'revokeAllMine'])
    ->requires(Permission::SESSION_REVOKE_OWN)
    ->throttle('session-revoke', 20, 3600);

$router->delete('/sessions/{sessionId}', [SessionController::class, 'revoke'])
    ->requires(Permission::SESSION_REVOKE_OWN)
    ->throttle('session-revoke', 40, 3600);

$router->get('/users/{id}/sessions', [SessionController::class, 'forUser'])
    ->requires(Permission::SESSION_READ_ANY);

$router->delete('/users/{id}/sessions', [SessionController::class, 'revokeAllForUser'])
    ->requires(Permission::SESSION_REVOKE_ANY);

// -----------------------------------------------------------------------------
// Enrolment
// -----------------------------------------------------------------------------
$router->get('/me/enrollments', [EnrollmentController::class, 'mine'])
    ->requires(Permission::ENROLLMENT_READ_OWN);

$router->post('/courses/{id}/enroll', [EnrollmentController::class, 'store'])
    ->requires(Permission::ENROLLMENT_CREATE)
    ->throttle('enroll', 30, 3600);

$router->delete('/courses/{id}/enroll', [EnrollmentController::class, 'destroy'])
    ->requires(Permission::ENROLLMENT_CREATE);

$router->get('/enrollments', [EnrollmentController::class, 'roster'])
    ->requires(Permission::STATS_READ);

// -----------------------------------------------------------------------------
// Authoring
//
// `course.manage` gets you through the door; the controller then checks that
// the course is yours. Role alone never grants access to another author's work.
// -----------------------------------------------------------------------------
$router->get('/me/courses', [CourseController::class, 'mine'])
    ->requires(Permission::COURSE_MANAGE);

$router->post('/courses', [CourseController::class, 'store'])
    ->requires(Permission::COURSE_MANAGE)
    ->throttle('course-write', 60, 3600);

$router->put('/courses/{id}', [CourseController::class, 'update'])
    ->requires(Permission::COURSE_MANAGE)
    ->throttle('course-write', 120, 3600);

$router->patch('/courses/{id}/publication', [CourseController::class, 'setPublished'])
    ->requires(Permission::COURSE_PUBLISH);

$router->delete('/courses/{id}', [CourseController::class, 'destroy'])
    ->requires(Permission::COURSE_MANAGE);

// -----------------------------------------------------------------------------
// Uploads — resumable, chunked, content-sniffed on completion
// -----------------------------------------------------------------------------
$router->post('/uploads', [UploadController::class, 'begin'])
    ->requires(Permission::ASSET_UPLOAD)
    ->throttle('upload-begin', 120, 3600);

// No throttle on the chunk endpoint: one large video is legitimately hundreds
// of sequential requests. The real limits are the declared size and the
// per-chunk ceiling, both enforced in the controller.
$router->patch('/uploads/{id}', [UploadController::class, 'append'])
    ->requires(Permission::ASSET_UPLOAD);

$router->post('/uploads/{id}/complete', [UploadController::class, 'complete'])
    ->requires(Permission::ASSET_UPLOAD);

$router->delete('/uploads/{id}', [UploadController::class, 'abort'])
    ->requires(Permission::ASSET_UPLOAD);

// -----------------------------------------------------------------------------
// Curriculum authoring
//
// Every one of these is additionally ownership-checked against the course by
// CourseAccess — `course.manage` gets you through the door, not into somebody
// else's course.
// -----------------------------------------------------------------------------
$router->post('/courses/{id}/sections', [CurriculumController::class, 'createSection'])
    ->requires(Permission::COURSE_MANAGE);

$router->put('/courses/{id}/sections/{sectionId}', [CurriculumController::class, 'updateSection'])
    ->requires(Permission::COURSE_MANAGE);

$router->delete('/courses/{id}/sections/{sectionId}', [CurriculumController::class, 'deleteSection'])
    ->requires(Permission::COURSE_MANAGE);

$router->patch('/courses/{id}/sections/{sectionId}/position', [CurriculumController::class, 'moveSection'])
    ->requires(Permission::COURSE_MANAGE);

$router->post('/courses/{id}/sections/{sectionId}/lessons', [CurriculumController::class, 'createLesson'])
    ->requires(Permission::COURSE_MANAGE);

$router->put('/courses/{id}/lessons/{lessonId}', [CurriculumController::class, 'updateLesson'])
    ->requires(Permission::COURSE_MANAGE);

$router->delete('/courses/{id}/lessons/{lessonId}', [CurriculumController::class, 'deleteLesson'])
    ->requires(Permission::COURSE_MANAGE);

$router->patch('/courses/{id}/lessons/{lessonId}/position', [CurriculumController::class, 'moveLesson'])
    ->requires(Permission::COURSE_MANAGE);

// -----------------------------------------------------------------------------
// Engagement analytics — how many people watched, and how far they got
// -----------------------------------------------------------------------------
$router->get('/courses/{id}/analytics', [ProgressController::class, 'analytics'])
    ->requires(Permission::STATS_READ);

$router->get('/courses/{id}/analytics/learners', [ProgressController::class, 'learners'])
    ->requires(Permission::STATS_READ);

// -----------------------------------------------------------------------------
// Taxonomy administration
// -----------------------------------------------------------------------------
$router->post('/categories', [TaxonomyController::class, 'createCategory'])
    ->requires(Permission::TAXONOMY_MANAGE);

$router->put('/categories/{id}', [TaxonomyController::class, 'updateCategory'])
    ->requires(Permission::TAXONOMY_MANAGE);

$router->delete('/categories/{id}', [TaxonomyController::class, 'deleteCategory'])
    ->requires(Permission::TAXONOMY_MANAGE);

$router->post('/tags', [TaxonomyController::class, 'createTag'])
    ->requires(Permission::TAXONOMY_MANAGE);

$router->put('/tags/{id}', [TaxonomyController::class, 'updateTag'])
    ->requires(Permission::TAXONOMY_MANAGE);

$router->delete('/tags/{id}', [TaxonomyController::class, 'deleteTag'])
    ->requires(Permission::TAXONOMY_MANAGE);

// -----------------------------------------------------------------------------
// People administration
//
// Each of these mirrors a change into Keycloak, so they are throttled: a
// runaway admin script must not be able to hammer the IdP.
// -----------------------------------------------------------------------------
$router->get('/users', [UserController::class, 'index'])
    ->requires(Permission::USER_READ_ANY);

$router->patch('/users/{id}/status', [UserController::class, 'setActive'])
    ->requires(Permission::USER_MANAGE)
    ->throttle('user-admin', 60, 3600);

$router->patch('/users/{id}/role', [UserController::class, 'setRole'])
    ->requires(Permission::USER_MANAGE)
    ->throttle('user-admin', 60, 3600);

$router->delete('/users/{id}', [UserController::class, 'destroy'])
    ->requires(Permission::USER_MANAGE)
    ->throttle('user-admin', 30, 3600);

// -----------------------------------------------------------------------------
// Reporting
// -----------------------------------------------------------------------------
$router->get('/stats/dashboard', [StatsController::class, 'dashboard'])
    ->requires(Permission::STATS_READ);

// -----------------------------------------------------------------------------
// Export
//
// The route-level throttle is a coarse backstop. The real limits — per dataset,
// per hour, row ceilings, masking and the audit trail — live in ExportPolicy,
// because they need to be visible in one place to be reviewable.
// -----------------------------------------------------------------------------
$router->get('/exports', [ExportController::class, 'index'])
    ->requires(Permission::EXPORT_OWN);

$router->get('/exports/{dataset}', [ExportController::class, 'download'])
    ->requires(Permission::EXPORT_OWN)
    ->throttle('export-route', 20, 3600);

$router->get('/exports-audit', [ExportController::class, 'auditLog'])
    ->requires(Permission::EXPORT_AUDIT_READ);

// -----------------------------------------------------------------------------

try {
    $router->dispatch(Request::capture());
} catch (\App\Http\HttpException $e) {
    // Request::capture() runs before the router's own handler, so a request
    // rejected at parse time — an oversized body, malformed input — lands here.
    // It still deserves its real status code rather than a generic 500.
    http_response_code($e->status);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    foreach ($e->headers as $name => $value) {
        header($name . ': ' . $value, true);
    }
    echo json_encode([
        'status'  => false,
        'error'   => $e->errorCode,
        'message' => $e->getMessage(),
    ] + $e->details);
} catch (\Throwable $e) {
    // Last line of defence for anything genuinely unexpected.
    error_log('[youlearn] fatal: ' . $e->getMessage());
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    echo json_encode([
        'status'  => false,
        'error'   => 'server_error',
        'message' => Env::isProduction() ? 'Something went wrong on our side.' : $e->getMessage(),
    ]);
}
