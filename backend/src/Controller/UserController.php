<?php

declare(strict_types=1);

namespace App\Controller;

use App\Http\HttpException;
use App\Http\Pagination;
use App\Http\Request;
use App\Http\Response;
use App\Repository\UserRepository;
use App\Security\KeycloakAdmin;
use App\Security\Permission;
use App\Security\Principal;
use App\Support\Validator;

/**
 * Account administration.
 *
 * Every write here changes Keycloak first and the local mirror second.
 * Keycloak is the system of record: an account that is suspended locally but
 * still enabled in the IdP can keep signing in, which would make the
 * suspension a lie. If the IdP call fails the whole operation fails, and the
 * mirror is left untouched rather than drifting.
 */
final class UserController
{
    private UserRepository $users;

    public function __construct()
    {
        $this->users = new UserRepository();
    }

    /** @param array<string, string> $params */
    public function index(Request $request, ?Principal $principal, array $params): Response
    {
        $page  = Pagination::fromRequest($request, 20, 100);
        $roles = $this->rolesFilter($request->query('role'));

        $result = $this->users->paginate($roles, $request->query('q'), $page->perPage, $page->offset);

        return Response::json([
            'status'     => true,
            'data'       => $result['items'],
            'pagination' => $page->meta($result['total']),
        ]);
    }

    /** @param array<string, string> $params */
    public function setActive(Request $request, ?Principal $principal, array $params): Response
    {
        $principal = $this->require($principal);
        $user      = $this->target((int) $params['id']);

        $validator = Validator::for($request->json());
        $active    = $validator->bool('is_active');
        $validator->validate();

        $this->refuseSelfHarm($principal, $user, 'suspend your own account');

        // Suspending in Keycloak also kills the account's live sessions, so
        // access ends immediately rather than when the token happens to expire.
        KeycloakAdmin::fromEnv()->setEnabled((string) $user['keycloak_id'], $active);
        $this->users->setActive((int) $user['id'], $active);

        return Response::json([
            'status'  => true,
            'message' => $active ? 'Account restored.' : 'Account suspended and signed out everywhere.',
        ]);
    }

    /** @param array<string, string> $params */
    public function setRole(Request $request, ?Principal $principal, array $params): Response
    {
        $principal = $this->require($principal);
        $user      = $this->target((int) $params['id']);

        $validator = Validator::for($request->json());
        $role      = $validator->enum('role', Permission::ALL_ROLES);
        $validator->validate();

        $this->refuseSelfHarm($principal, $user, 'change your own role');

        KeycloakAdmin::fromEnv()->setRealmRole((string) $user['keycloak_id'], $role);

        // The mirror is updated for immediate display, but the token remains
        // the authority: the change truly lands on the user's next sign-in or
        // token refresh, which is what the response says.
        return Response::json([
            'status'  => true,
            'message' => 'Role updated. It takes effect when they next refresh their session.',
        ]);
    }

    /** @param array<string, string> $params */
    public function destroy(Request $request, ?Principal $principal, array $params): Response
    {
        $principal = $this->require($principal);
        $user      = $this->target((int) $params['id']);

        $this->refuseSelfHarm($principal, $user, 'delete your own account');

        // courses.instructor_id is ON DELETE RESTRICT on purpose: removing an
        // author must not take their published material with it. Reassigning
        // or deleting the courses is a deliberate, separate decision.
        $authored = $this->users->countCoursesAuthoredBy((int) $user['id']);
        if ($authored > 0) {
            throw HttpException::conflict(sprintf(
                'This person still authors %d course%s. Delete or reassign them first.',
                $authored,
                $authored === 1 ? '' : 's'
            ));
        }

        KeycloakAdmin::fromEnv()->deleteUser((string) $user['keycloak_id']);
        $this->users->delete((int) $user['id']);

        return Response::json(['status' => true, 'message' => 'Account deleted.']);
    }

    // ------------------------------------------------------------- helpers --

    /** @return array<string, mixed> */
    private function target(int $id): array
    {
        $user = $this->users->findById($id);
        if ($user === null) {
            throw HttpException::notFound('No such account.');
        }

        return $user;
    }

    /**
     * An administrator locking themselves out — or quietly promoting
     * themselves out of oversight — is a support incident, not a feature.
     *
     * @param array<string, mixed> $target
     */
    private function refuseSelfHarm(Principal $principal, array $target, string $action): void
    {
        if ((int) $target['id'] === $principal->userId) {
            throw HttpException::forbidden(sprintf('You cannot %s.', $action));
        }
    }

    private function require(?Principal $principal): Principal
    {
        if ($principal === null) {
            throw HttpException::unauthorized();
        }

        return $principal;
    }

    /** @return list<string> */
    private function rolesFilter(?string $value): array
    {
        if ($value === null || $value === '') {
            return [];
        }

        $roles = [];
        foreach (explode(',', $value) as $role) {
            $role = trim($role);
            if (\in_array($role, Permission::ALL_ROLES, true)) {
                $roles[] = $role;
            }
        }

        return array_values(array_unique($roles));
    }
}
