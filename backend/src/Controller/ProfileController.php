<?php

declare(strict_types=1);

namespace App\Controller;

use App\Http\HttpException;
use App\Http\Request;
use App\Http\Response;
use App\Repository\AssetRepository;
use App\Repository\CourseRepository;
use App\Repository\ProfileRepository;
use App\Security\Principal;
use App\Storage\FileStore;
use App\Support\Validator;

/**
 * The public instructor profile.
 *
 * One page an instructor can hand to somebody who has never used this platform:
 * who they are, what they teach, and where else to find them. It is the only
 * surface in the application that is *designed* to be read by an anonymous
 * stranger and shared off-platform, which drives two rules that hold throughout
 * this controller:
 *
 *   - Publication is opt-in and revocable. `profile_is_public` starts at 0, and
 *     the public read re-checks it, the account's active flag and the account's
 *     role on every request — so suspending or demoting an instructor takes
 *     their page down without anybody remembering to.
 *
 *   - The public payload is assembled field by field. It is never a database row
 *     handed to json_encode: this table also holds the email address and the
 *     Keycloak subject, and the difference between a profile page and a data
 *     leak is exactly which columns get named.
 */
final class ProfileController
{
    /** Courses listed on a profile. Enough to show range, short enough to read. */
    private const COURSE_LIMIT = 12;

    /** Reserved so a profile can never shadow a real route or impersonate the platform. */
    private const RESERVED_SLUGS = [
        'account', 'admin', 'api', 'assets', 'courses', 'dashboard', 'health',
        'instructors', 'learn', 'learning', 'login', 'logout', 'me', 'media',
        'new', 'profile', 'settings', 'sign-in', 'sign-out', 'signin', 'signup',
        'static', 'support', 'teacher', 'teachers', 'uploads', 'youlearn',
    ];

    private ProfileRepository $profiles;
    private CourseRepository $courses;
    private AssetRepository $assets;

    public function __construct()
    {
        $this->profiles = new ProfileRepository();
        $this->courses  = new CourseRepository();
        $this->assets   = new AssetRepository();
    }

    /**
     * GET /instructors/{slug} — the public page. No authentication.
     *
     * @param array<string, string> $params
     */
    public function showPublic(Request $request, ?Principal $principal, array $params): Response
    {
        $profile = $this->profiles->findPublicBySlug($params['slug']);

        if ($profile === null) {
            // Deliberately indistinguishable from "no such instructor". An
            // unpublished profile that answered 403 would confirm the account
            // exists, which is the one thing not publishing it was meant to avoid.
            throw HttpException::notFound('No such profile.');
        }

        return Response::json([
            'status' => true,
            'data'   => $this->publicPayload($profile),
        ]);
    }

    /**
     * GET /me/profile — the profile as its owner edits it.
     *
     * @param array<string, string> $params
     */
    public function showMine(Request $request, ?Principal $principal, array $params): Response
    {
        $principal = $this->require($principal);

        $profile = $this->profiles->findByUserId($principal->userId);

        if ($profile === null) {
            throw HttpException::notFound('Your account could not be loaded.');
        }

        return Response::json([
            'status' => true,
            // `includeHidden` here and nowhere else. The editor previews what a
            // section would look like switched back on, which it cannot do if
            // the content of a disabled section never leaves the database. This
            // is the owner reading their own row, so there is nothing withheld
            // from them anyway — the gating exists for visitors.
            'data'   => $this->publicPayload($profile, includeHidden: true) + [
                'is_public' => $profile['is_public'],
                // A first-time editor gets a slug proposed from their name
                // rather than an empty box; nothing is reserved until they save.
                'suggested_slug' => $profile['slug'] ?? $this->suggestSlug($profile['name'], $principal->userId),
            ],
        ]);
    }

    /**
     * PUT /me/profile — save it.
     *
     * @param array<string, string> $params
     */
    public function saveMine(Request $request, ?Principal $principal, array $params): Response
    {
        $principal = $this->require($principal);

        $body      = $request->json();
        $validator = Validator::for($body);

        $isPublic = $validator->bool('is_public');
        $slug     = $this->validatedSlug($validator, $principal, $isPublic);

        $data = [
            'profile_slug'         => $slug,
            'profile_is_public'    => $isPublic ? 1 : 0,
            'headline'             => $validator->optionalString('headline', 140),
            'bio'                  => $validator->optionalString('bio', 2_000),
            'profile_location'     => $validator->optionalString('location', 120),
            'profile_links'        => $this->validatedLinks($validator, $body),
            'profile_theme'        => $validator->enum('theme', ['light', 'dark'], 'light'),
            'profile_show_about'   => $this->sectionFlag($body, 'about'),
            'profile_show_courses' => $this->sectionFlag($body, 'courses'),
            'profile_show_stats'   => $this->sectionFlag($body, 'stats'),
            'profile_show_links'   => $this->sectionFlag($body, 'links'),
        ];

        // Absent means "leave it alone"; an explicit null means "remove it".
        // Without that distinction a save from a form that does not render the
        // avatar field would quietly delete the portrait.
        if (\array_key_exists('avatar_public_id', $body)) {
            $data['avatar_asset_id'] = $this->resolveAvatar($validator, $body, $principal);
        }

        $validator->validate();

        $this->profiles->save($principal->userId, $data);

        $saved = $this->profiles->findByUserId($principal->userId);

        return Response::json([
            'status'  => true,
            'message' => $isPublic ? 'Profile saved and published.' : 'Profile saved as a draft.',
            'data'    => $saved === null
                ? null
                : $this->publicPayload($saved, includeHidden: true) + ['is_public' => $saved['is_public']],
        ]);
    }

    // -------------------------------------------------------------- private --

    /**
     * Assemble what a visitor is allowed to see.
     *
     * Sections the instructor switched off are omitted from the payload
     * entirely rather than sent with a flag for the front end to respect. A
     * hidden bio that still ships in the JSON is not hidden.
     *
     * `$includeHidden` lifts that for exactly one caller — the owner reading
     * their own profile in the editor, who needs the content of a disabled
     * section in order to preview turning it back on. It must never be set on
     * a response to anybody else.
     *
     * @param array<string, mixed> $profile
     * @return array<string, mixed>
     */
    private function publicPayload(array $profile, bool $includeHidden = false): array
    {
        /** @var array{about: bool, courses: bool, stats: bool, links: bool} $sections */
        $sections = $profile['sections'];

        $show = static fn (string $name): bool => $includeHidden || $sections[$name];

        $payload = [
            'slug'             => $profile['slug'],
            'name'             => $profile['name'],
            'role'             => $profile['role'],
            'headline'         => $profile['headline'],
            'avatar_public_id' => $profile['avatar_public_id'],
            'member_since'     => $profile['member_since'],
            'theme'            => $profile['theme'],
            'sections'         => $sections,
            'bio'              => $show('about') ? $profile['bio'] : null,
            'location'         => $show('about') ? $profile['location'] : null,
            'links'            => $show('links') ? $profile['links'] : [],
            'stats'            => $show('stats') ? $this->profiles->publicStats((int) $profile['id']) : null,
            'courses'          => [],
        ];

        if ($show('courses')) {
            $page = $this->courses->paginate(
                ['instructor_id' => (int) $profile['id'], 'published_only' => true],
                self::COURSE_LIMIT,
                0
            );

            $payload['courses'] = array_map($this->courseCard(...), $page['items']);
            $payload['course_total'] = $page['total'];
        }

        return $payload;
    }

    /**
     * A course as it appears on a profile.
     *
     * Trimmed to what the card renders. The catalogue payload carries the
     * description and the full tag list, and neither is worth sending twelve
     * times over for a grid of titles.
     *
     * @param array<string, mixed> $course
     * @return array<string, mixed>
     */
    private function courseCard(array $course): array
    {
        return [
            'id'               => (int) $course['id'],
            'title'            => (string) $course['title'],
            'slug'             => (string) $course['slug'],
            'subtitle'         => $course['subtitle'],
            'img'              => $course['img'],
            'cover_public_id'  => $course['cover_public_id'],
            'content_type'     => (string) $course['content_type'],
            'category_name'    => $course['category_name'],
            'enrollment_count' => (int) $course['enrollment_count'],
        ];
    }

    /**
     * The web address, checked against every rule that can reject one.
     *
     * Shape, reserved words and availability are all resolved here so the
     * person gets one message they can act on. The UNIQUE key in save() is
     * still what holds if two people claim the same slug in the same instant.
     */
    private function validatedSlug(
        Validator $validator,
        Principal $principal,
        bool $isPublic,
    ): string {
        $raw = $validator->optionalString('slug', 80);

        if ($raw === '') {
            // A draft may have no address yet. A published page may not: the
            // whole point of publishing is that there is a URL to hand out.
            if ($isPublic) {
                $validator->addError('slug', 'Choose a web address before publishing.');
            }

            return '';
        }

        $slug = strtolower($raw);

        if (preg_match('/^[a-z0-9](?:[a-z0-9-]{1,78}[a-z0-9])$/', $slug) !== 1) {
            $validator->addError(
                'slug',
                'Use 3–80 characters: lowercase letters, numbers and hyphens, not starting or ending with a hyphen.'
            );

            return $slug;
        }

        if (str_contains($slug, '--')) {
            // Reserved by convention for internationalised domain encoding, and
            // a double hyphen reads as a typo in a URL somebody is handed.
            $validator->addError('slug', 'Use single hyphens between words.');

            return $slug;
        }

        if (\in_array($slug, self::RESERVED_SLUGS, true)) {
            $validator->addError('slug', 'That address is reserved. Please choose another.');

            return $slug;
        }

        if (!$this->profiles->slugAvailable($slug, $principal->userId)) {
            $validator->addError('slug', 'That address is already taken.');
        }

        return $slug;
    }

    /**
     * The links block.
     *
     * Each entry is `{label, url}`, the URL is forced through the same absolute
     * http(s) check the course cover uses, and the list is capped. A label is
     * optional; an entry without one falls back to its host when rendered.
     *
     * @param array<string, mixed> $body
     * @return list<array{label: string, url: string}>
     */
    private function validatedLinks(Validator $validator, array $body): array
    {
        $raw = $body['links'] ?? [];

        if (!\is_array($raw)) {
            $validator->addError('links', 'Links must be a list.');

            return [];
        }

        if (\count($raw) > ProfileRepository::MAX_LINKS) {
            $validator->addError(
                'links',
                sprintf('At most %d links.', ProfileRepository::MAX_LINKS)
            );

            return [];
        }

        $links = [];

        foreach (array_values($raw) as $index => $entry) {
            if (!\is_array($entry)) {
                continue;
            }

            $url = \is_string($entry['url'] ?? null) ? trim($entry['url']) : '';
            if ($url === '') {
                // An empty row is the editor's blank line, not an error.
                continue;
            }

            $scheme = strtolower((string) parse_url($url, PHP_URL_SCHEME));

            if (!\in_array($scheme, ['http', 'https'], true)
                || filter_var($url, FILTER_VALIDATE_URL) === false
                || mb_strlen($url) > 2048
            ) {
                $validator->addError(
                    'links.' . $index,
                    'Must be an absolute http(s) URL.'
                );
                continue;
            }

            $label = \is_string($entry['label'] ?? null) ? trim($entry['label']) : '';

            $links[] = [
                'label' => mb_substr($label, 0, 60),
                'url'   => $url,
            ];
        }

        return $links;
    }

    /**
     * Turn an uploaded image's public id into an asset id.
     *
     * @param array<string, mixed> $body
     */
    private function resolveAvatar(Validator $validator, array $body, Principal $principal): ?int
    {
        $publicId = $body['avatar_public_id'];

        if ($publicId === null || $publicId === '') {
            return null;
        }

        if (!\is_string($publicId)) {
            $validator->addError('avatar_public_id', 'That image could not be found.');

            return null;
        }

        $asset = $this->assets->findByPublicId($publicId);

        if ($asset === null || $asset['kind'] !== FileStore::KIND_IMAGE) {
            $validator->addError('avatar_public_id', 'That image could not be found.');

            return null;
        }

        // No admin override here, unlike a course cover. There is no legitimate
        // reason to put someone else's upload on your own face.
        if ((int) $asset['owner_id'] !== $principal->userId) {
            $validator->addError('avatar_public_id', 'That image belongs to another account.');

            return null;
        }

        return (int) $asset['id'];
    }

    /**
     * Section toggles default to on.
     *
     * A body that omits the key keeps the section. That is the safe direction:
     * a save from a form that does not render every toggle should not silently
     * blank someone's page. Only an explicit falsey value switches one off,
     * which is why this coerces rather than validating — there is no input here
     * a person could get wrong, only a checkbox that is present or is not.
     *
     * @param array<string, mixed> $body
     */
    private function sectionFlag(array $body, string $name): int
    {
        $sections = $body['sections'] ?? [];

        if (!\is_array($sections) || !\array_key_exists($name, $sections)) {
            return 1;
        }

        $value = $sections[$name];

        if (\is_string($value)) {
            return \in_array(strtolower($value), ['1', 'true', 'yes', 'on'], true) ? 1 : 0;
        }

        return $value ? 1 : 0;
    }

    /**
     * A first suggestion for the web address, derived from the display name.
     *
     * Only a suggestion: it is not reserved, and the person can type over it.
     * If the obvious form is taken the account id is appended rather than a
     * random suffix, so the result is still readable.
     */
    private function suggestSlug(string $name, int $userId): string
    {
        $ascii = @iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $name);
        $ascii = $ascii === false ? $name : $ascii;
        $slug  = trim((string) preg_replace('/[^a-z0-9]+/', '-', strtolower($ascii)), '-');
        $slug  = substr($slug, 0, 60);

        if (mb_strlen($slug) < 3 || \in_array($slug, self::RESERVED_SLUGS, true)) {
            return 'instructor-' . $userId;
        }

        return $this->profiles->slugAvailable($slug, $userId) ? $slug : $slug . '-' . $userId;
    }

    private function require(?Principal $principal): Principal
    {
        if ($principal === null) {
            throw HttpException::unauthorized();
        }

        return $principal;
    }
}
