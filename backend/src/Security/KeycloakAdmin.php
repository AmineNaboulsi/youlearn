<?php

declare(strict_types=1);

namespace App\Security;

use App\Http\HttpException;
use App\Support\Env;

/**
 * Thin client for the Keycloak Admin REST API.
 *
 * This is the only component that holds admin credentials, and it lives in the
 * backend on purpose: the browser never sees the service-account secret, and
 * every call through it has already passed this API's own permission checks.
 * The front end can therefore offer "close this session" or "suspend this
 * account" without ever being trusted with realm-management rights.
 *
 * The service account is scoped to view-users / manage-users — it cannot edit
 * the realm, create clients or read credentials.
 */
final class KeycloakAdmin
{
    private ?string $accessToken = null;

    /** HTTP status of the most recent Admin API call, for callers that care. */
    private int $lastStatus = 0;

    public function __construct(
        private readonly string $baseUrl,
        private readonly string $realm,
        private readonly string $clientId,
        private readonly string $clientSecret,
    ) {
    }

    public static function fromEnv(): self
    {
        return new self(
            rtrim(Env::get('KEYCLOAK_INTERNAL_URL', 'http://keycloak:8080') ?? '', '/'),
            Env::get('KEYCLOAK_REALM', 'youlearn') ?? 'youlearn',
            Env::get('KEYCLOAK_ADMIN_CLIENT_ID', 'youlearn-admin') ?? 'youlearn-admin',
            Env::get('KEYCLOAK_ADMIN_CLIENT_SECRET', '') ?? '',
        );
    }

    // ------------------------------------------------------------ sessions --

    /**
     * Active sessions for one user.
     *
     * @return list<array<string, mixed>>
     */
    public function userSessions(string $userId): array
    {
        /** @var list<array<string, mixed>> $sessions */
        $sessions = $this->request('GET', sprintf('/users/%s/sessions', rawurlencode($userId))) ?? [];

        return $sessions;
    }

    /**
     * Revoke one session across every client it touched.
     *
     * Returns false when the identity provider does not know the session —
     * already expired, or already revoked from another device. That is not an
     * error condition, but it is worth distinguishing from a successful
     * revocation so the caller can answer honestly.
     */
    public function revokeSession(string $sessionId): bool
    {
        $this->request('DELETE', sprintf('/sessions/%s', rawurlencode($sessionId)), allowNotFound: true);

        return $this->lastStatus !== 404;
    }

    /** Revoke every session a user has — the "sign out everywhere" action. */
    public function logoutUser(string $userId): void
    {
        $this->request('POST', sprintf('/users/%s/logout', rawurlencode($userId)));
    }

    // --------------------------------------------------------------- users --

    /** @return array<string, mixed>|null */
    public function user(string $userId): ?array
    {
        /** @var array<string, mixed>|null $user */
        $user = $this->request('GET', sprintf('/users/%s', rawurlencode($userId)), allowNotFound: true);

        return $user;
    }

    public function setEnabled(string $userId, bool $enabled): void
    {
        $this->request('PUT', sprintf('/users/%s', rawurlencode($userId)), ['enabled' => $enabled]);

        // Disabling an account must also end the sessions it already holds,
        // otherwise a suspended user keeps working until their refresh token
        // happens to expire.
        if (!$enabled) {
            $this->logoutUser($userId);
        }
    }

    public function deleteUser(string $userId): void
    {
        $this->request('DELETE', sprintf('/users/%s', rawurlencode($userId)));
    }

    /**
     * Replace a user's platform role.
     *
     * @throws HttpException when the target role is not one of ours.
     */
    public function setRealmRole(string $userId, string $newRole): void
    {
        if (!\in_array($newRole, Permission::ALL_ROLES, true)) {
            throw HttpException::validation(['role' => 'Unknown role.']);
        }

        $assigned = $this->request('GET', sprintf('/users/%s/role-mappings/realm', rawurlencode($userId))) ?? [];

        $toRemove = [];
        foreach ($assigned as $role) {
            if (\is_array($role) && \in_array($role['name'] ?? '', Permission::ALL_ROLES, true) && $role['name'] !== $newRole) {
                $toRemove[] = ['id' => $role['id'], 'name' => $role['name']];
            }
            if (\is_array($role) && ($role['name'] ?? '') === $newRole) {
                return; // Already correct; nothing to do.
            }
        }

        $target = $this->request('GET', sprintf('/roles/%s', rawurlencode($newRole)));
        if (!\is_array($target)) {
            throw new HttpException(502, 'idp_error', 'Role could not be resolved in the identity provider.');
        }

        if ($toRemove !== []) {
            $this->request('DELETE', sprintf('/users/%s/role-mappings/realm', rawurlencode($userId)), $toRemove);
        }

        $this->request('POST', sprintf('/users/%s/role-mappings/realm', rawurlencode($userId)), [
            ['id' => $target['id'], 'name' => $target['name']],
        ]);
    }

    // ------------------------------------------------------------ internals --

    private function token(): string
    {
        if ($this->accessToken !== null) {
            return $this->accessToken;
        }

        if ($this->clientSecret === '') {
            throw new HttpException(500, 'idp_misconfigured', 'Identity provider administration is not configured.');
        }

        $url = sprintf('%s/realms/%s/protocol/openid-connect/token', $this->baseUrl, $this->realm);

        $ch = curl_init($url);
        if ($ch === false) {
            throw new HttpException(502, 'idp_unreachable', 'The identity provider is unavailable.');
        }

        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => http_build_query([
                'grant_type'    => 'client_credentials',
                'client_id'     => $this->clientId,
                'client_secret' => $this->clientSecret,
            ]),
            CURLOPT_CONNECTTIMEOUT => 3,
            CURLOPT_TIMEOUT        => 8,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
        ]);

        $body   = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        curl_close($ch);

        $decoded = \is_string($body) ? json_decode($body, true) : null;

        if ($status !== 200 || !\is_array($decoded) || !\is_string($decoded['access_token'] ?? null)) {
            throw new HttpException(502, 'idp_error', 'Could not authenticate against the identity provider.');
        }

        // Held for this request only. A five-minute service token is not worth
        // persisting, and keeping it in memory means it never touches disk.
        return $this->accessToken = $decoded['access_token'];
    }

    /**
     * @param array<mixed>|null $payload
     * @return array<mixed>|null
     */
    private function request(string $method, string $path, ?array $payload = null, bool $allowNotFound = false): ?array
    {
        $url = sprintf('%s/admin/realms/%s%s', $this->baseUrl, $this->realm, $path);

        $ch = curl_init($url);
        if ($ch === false) {
            throw new HttpException(502, 'idp_unreachable', 'The identity provider is unavailable.');
        }

        $headers = ['Authorization: Bearer ' . $this->token(), 'Accept: application/json'];

        $options = [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CUSTOMREQUEST  => $method,
            CURLOPT_CONNECTTIMEOUT => 3,
            CURLOPT_TIMEOUT        => 10,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
        ];

        if ($payload !== null) {
            $headers[]                    = 'Content-Type: application/json';
            $options[CURLOPT_POSTFIELDS]  = json_encode($payload, JSON_UNESCAPED_UNICODE);
        }

        $options[CURLOPT_HTTPHEADER] = $headers;
        curl_setopt_array($ch, $options);

        $body   = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        curl_close($ch);

        $this->lastStatus = $status;

        if ($status === 404 && $allowNotFound) {
            return null;
        }

        if ($status < 200 || $status >= 300) {
            // The IdP's own error text can leak realm internals, so it is not
            // forwarded — only the fact that the call failed.
            throw new HttpException(502, 'idp_error', 'The identity provider rejected the request.');
        }

        if (!\is_string($body) || trim($body) === '') {
            return null;
        }

        $decoded = json_decode($body, true);

        return \is_array($decoded) ? $decoded : null;
    }
}
