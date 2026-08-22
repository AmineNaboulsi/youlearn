<?php

declare(strict_types=1);

namespace App\Security;

use App\Http\HttpException;
use App\Http\Request;
use App\Repository\UserRepository;

/**
 * Turns a bearer token into a Principal.
 *
 * Also the point where a Keycloak user is mirrored into the local database.
 * Provisioning on first authenticated request (rather than at registration
 * time) means a user created directly in Keycloak — by an admin, or by an
 * identity provider federation added later — works immediately, with no
 * separate sync job to fall behind.
 */
final class Authenticator
{
    public function __construct(
        private readonly TokenVerifier $verifier,
        private readonly UserRepository $users,
    ) {
    }

    public function authenticate(Request $request): Principal
    {
        $token = $request->bearerToken();
        if ($token === null) {
            throw HttpException::unauthorized();
        }

        $claims = $this->verifier->verify($token);

        $roles = $this->realmRoles($claims);
        $role  = Permission::primaryRole($roles);

        if ($role === null) {
            // Authenticated against the realm, but holds none of this
            // application's roles — a valid identity with no standing here.
            throw HttpException::forbidden('Your account has no role on this platform.');
        }

        $subject = (string) $claims['sub'];
        $email   = $this->claimString($claims, 'email') ?? $this->claimString($claims, 'preferred_username') ?? '';
        $name    = $this->displayName($claims, $email);

        if ($email === '') {
            throw HttpException::forbidden('Your account has no email address.');
        }

        $user = $this->users->syncFromToken($subject, $email, $name, $role);

        if ((int) $user['is_active'] !== 1) {
            throw HttpException::forbidden('This account is closed. Please contact support.');
        }

        return new Principal(
            subject:         $subject,
            email:           $email,
            name:            $name,
            roles:           $roles,
            permissions:     Permission::forRoles($roles),
            role:            $role,
            userId:          (int) $user['id'],
            sessionState:    $this->claimString($claims, 'sid') ?? $this->claimString($claims, 'session_state'),
            tokenExpiresAt:  (int) ($claims['exp'] ?? 0),
        );
    }

    /**
     * Optional authentication: returns null instead of throwing when no token
     * is present, so a public endpoint can still personalise its response for a
     * signed-in caller. A token that *is* present but invalid still fails —
     * silently ignoring a bad token would hide real problems from the client.
     */
    public function authenticateOptional(Request $request): ?Principal
    {
        if ($request->bearerToken() === null) {
            return null;
        }

        return $this->authenticate($request);
    }

    /**
     * @param array<string, mixed> $claims
     * @return list<string>
     */
    private function realmRoles(array $claims): array
    {
        $realmAccess = $claims['realm_access'] ?? null;
        $roles = (\is_array($realmAccess) && \is_array($realmAccess['roles'] ?? null))
            ? $realmAccess['roles']
            : [];

        $known = [];
        foreach ($roles as $role) {
            if (\is_string($role) && \in_array($role, Permission::ALL_ROLES, true)) {
                $known[] = $role;
            }
        }

        return array_values(array_unique($known));
    }

    /** @param array<string, mixed> $claims */
    private function claimString(array $claims, string $key): ?string
    {
        $value = $claims[$key] ?? null;

        return (\is_string($value) && $value !== '') ? $value : null;
    }

    /** @param array<string, mixed> $claims */
    private function displayName(array $claims, string $fallbackEmail): string
    {
        $name = $this->claimString($claims, 'name');
        if ($name !== null) {
            return $name;
        }

        $given  = $this->claimString($claims, 'given_name');
        $family = $this->claimString($claims, 'family_name');
        if ($given !== null || $family !== null) {
            return trim(($given ?? '') . ' ' . ($family ?? ''));
        }

        $local = strstr($fallbackEmail, '@', true);

        return $local === false ? $fallbackEmail : $local;
    }
}
