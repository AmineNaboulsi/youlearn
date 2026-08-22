<?php

declare(strict_types=1);

namespace App\Controller;

use App\Http\HttpException;
use App\Http\Request;
use App\Http\Response;
use App\Repository\UserRepository;
use App\Security\KeycloakAdmin;
use App\Security\Permission;
use App\Security\Principal;

/**
 * Session visibility and revocation.
 *
 * Sessions live in Keycloak, so this controller is a permission-checked
 * gateway to the Admin API rather than a store of its own. Two things it
 * deliberately does:
 *
 *   - Marks the caller's *current* session, so "sign out everywhere else" can
 *     be offered as a distinct, safe action from "sign out everywhere".
 *   - Refuses to let a user revoke a session belonging to someone else unless
 *     they hold session.revoke.any. Session ids are opaque, but an
 *     authorisation model that relies on ids being unguessable is not one.
 */
final class SessionController
{
    private UserRepository $users;

    public function __construct()
    {
        $this->users = new UserRepository();
    }

    /**
     * The caller's own sessions.
     *
     * @param array<string, string> $params
     */
    public function mine(Request $request, ?Principal $principal, array $params): Response
    {
        $principal = $this->require($principal);

        return Response::json([
            'status' => true,
            'data'   => $this->present(
                KeycloakAdmin::fromEnv()->userSessions($principal->subject),
                $principal->sessionState
            ),
        ]);
    }

    /**
     * Any user's sessions. Admin only.
     *
     * @param array<string, string> $params
     */
    public function forUser(Request $request, ?Principal $principal, array $params): Response
    {
        $principal = $this->require($principal);

        $user = $this->users->findById((int) $params['id']);
        if ($user === null) {
            throw HttpException::notFound('No such account.');
        }

        return Response::json([
            'status' => true,
            'data'   => $this->present(
                KeycloakAdmin::fromEnv()->userSessions((string) $user['keycloak_id']),
                // Never mark another person's session as "this device".
                $user['keycloak_id'] === $principal->subject ? $principal->sessionState : null
            ),
        ]);
    }

    /**
     * Revoke a single session.
     *
     * @param array<string, string> $params
     */
    public function revoke(Request $request, ?Principal $principal, array $params): Response
    {
        $principal = $this->require($principal);
        $sessionId = $params['sessionId'];

        $keycloak = KeycloakAdmin::fromEnv();

        $isOwn = $this->ownsSession($keycloak, $principal->subject, $sessionId);

        if (!$isOwn && !$principal->can(Permission::SESSION_REVOKE_ANY)) {
            // Same answer whether the session belongs to someone else or does
            // not exist — probing must not distinguish the two.
            throw HttpException::notFound('No such session.');
        }

        if (!$keycloak->revokeSession($sessionId)) {
            // The identity provider has no such session. Same answer as an
            // unauthorised one, so probing cannot tell the two apart.
            throw HttpException::notFound('No such session.');
        }

        return Response::json([
            'status'  => true,
            'message' => 'Session signed out.',
            'was_current_session' => $isOwn && $sessionId === $principal->sessionState,
        ]);
    }

    /**
     * Revoke every session the caller has, optionally sparing the current one.
     *
     * @param array<string, string> $params
     */
    public function revokeAllMine(Request $request, ?Principal $principal, array $params): Response
    {
        $principal = $this->require($principal);
        $keycloak  = KeycloakAdmin::fromEnv();

        $keepCurrent = $request->query('keep_current') === '1';

        if (!$keepCurrent || $principal->sessionState === null) {
            $keycloak->logoutUser($principal->subject);

            return Response::json([
                'status'      => true,
                'message'     => 'Signed out of every device.',
                'signed_out_current' => true,
            ]);
        }

        $revoked = 0;
        foreach ($keycloak->userSessions($principal->subject) as $session) {
            $id = $session['id'] ?? null;
            if (\is_string($id) && $id !== $principal->sessionState) {
                $keycloak->revokeSession($id);
                $revoked++;
            }
        }

        return Response::json([
            'status'  => true,
            'message' => $revoked === 0
                ? 'No other sessions were open.'
                : sprintf('Signed out of %d other device%s.', $revoked, $revoked === 1 ? '' : 's'),
            'signed_out_current' => false,
            'revoked' => $revoked,
        ]);
    }

    /**
     * Revoke every session for another account. Admin only.
     *
     * @param array<string, string> $params
     */
    public function revokeAllForUser(Request $request, ?Principal $principal, array $params): Response
    {
        $this->require($principal);

        $user = $this->users->findById((int) $params['id']);
        if ($user === null) {
            throw HttpException::notFound('No such account.');
        }

        KeycloakAdmin::fromEnv()->logoutUser((string) $user['keycloak_id']);

        return Response::json(['status' => true, 'message' => 'That account has been signed out everywhere.']);
    }

    // ------------------------------------------------------------- helpers --

    private function ownsSession(KeycloakAdmin $keycloak, string $subject, string $sessionId): bool
    {
        foreach ($keycloak->userSessions($subject) as $session) {
            if (($session['id'] ?? null) === $sessionId) {
                return true;
            }
        }

        return false;
    }

    /**
     * Reshape Keycloak's session representation into something the UI can show
     * directly, and drop the fields it has no business rendering.
     *
     * @param list<array<string, mixed>> $sessions
     * @return list<array<string, mixed>>
     */
    private function present(array $sessions, ?string $currentSessionId): array
    {
        $presented = [];

        foreach ($sessions as $session) {
            $id = $session['id'] ?? null;
            if (!\is_string($id)) {
                continue;
            }

            $start    = isset($session['start']) ? (int) $session['start'] : 0;
            $lastSeen = isset($session['lastAccess']) ? (int) $session['lastAccess'] : 0;

            $presented[] = [
                'id'          => $id,
                'ip_address'  => \is_string($session['ipAddress'] ?? null) ? $session['ipAddress'] : null,
                // Keycloak reports epoch milliseconds; ISO-8601 keeps the UI
                // free of unit guesswork.
                'started_at'  => $start > 0 ? gmdate('c', intdiv($start, 1000)) : null,
                'last_seen_at' => $lastSeen > 0 ? gmdate('c', intdiv($lastSeen, 1000)) : null,
                'clients'     => array_values(array_filter(
                    array_values((array) ($session['clients'] ?? [])),
                    static fn (mixed $c): bool => \is_string($c)
                )),
                'is_current'  => $currentSessionId !== null && $id === $currentSessionId,
                'remember_me' => (bool) ($session['rememberMe'] ?? false),
            ];
        }

        // Current session first, then most recently active.
        usort($presented, static function (array $a, array $b): int {
            if ($a['is_current'] !== $b['is_current']) {
                return $a['is_current'] ? -1 : 1;
            }

            return strcmp((string) $b['last_seen_at'], (string) $a['last_seen_at']);
        });

        return $presented;
    }

    private function require(?Principal $principal): Principal
    {
        if ($principal === null) {
            throw HttpException::unauthorized();
        }

        return $principal;
    }
}
