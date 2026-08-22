<?php

declare(strict_types=1);

namespace App\Security;

use App\Http\HttpException;
use App\Support\Env;
use Firebase\JWT\JWK;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

/**
 * Verifies Keycloak access tokens locally.
 *
 * Local verification rather than calling the introspection endpoint: signature
 * checking is cheap, and it keeps a Keycloak hiccup from taking the API down.
 * The cost is that a token stays valid until it expires even if the session was
 * revoked a moment ago — which is why the realm issues 5-minute access tokens
 * and why session revocation is a first-class feature of the UI.
 *
 * What is checked, in order:
 *   1. Structure and algorithm — RSA signatures only, taken from the header's
 *      `kid` against the realm JWKS. `alg: none` and HMAC are impossible here
 *      because the key set only ever yields RSA public keys.
 *   2. Signature, `exp`, `nbf`, `iat` (via firebase/php-jwt, 30s leeway).
 *   3. `iss` — must be this realm.
 *   4. `aud` / `azp` — the token must have been minted *for this API*. Without
 *      this a token issued to any other client in the realm would be accepted,
 *      which is the classic confused-deputy hole in bearer-token APIs.
 *   5. `typ` — must be an access token, never an ID token.
 */
final class TokenVerifier
{
    /** Signature algorithms we are willing to accept. */
    private const ALLOWED_ALGORITHMS = ['RS256', 'RS384', 'RS512', 'PS256', 'PS384', 'PS512'];

    private const JWKS_TTL_SECONDS = 600;

    /** Minimum gap between JWKS refetches, so an unknown `kid` cannot be used to hammer Keycloak. */
    private const JWKS_REFETCH_COOLDOWN = 30;

    private const CLOCK_LEEWAY = 30;

    public function __construct(
        private readonly string $internalBaseUrl,
        private readonly string $publicBaseUrl,
        private readonly string $realm,
        private readonly string $audience,
        private readonly string $cacheDir,
    ) {
    }

    public static function fromEnv(): self
    {
        return new self(
            rtrim(Env::get('KEYCLOAK_INTERNAL_URL', 'http://keycloak:8080') ?? '', '/'),
            rtrim(Env::get('KEYCLOAK_PUBLIC_URL', 'http://localhost:8080') ?? '', '/'),
            Env::get('KEYCLOAK_REALM', 'youlearn') ?? 'youlearn',
            Env::get('KEYCLOAK_AUDIENCE', 'youlearn-api') ?? 'youlearn-api',
            \dirname(__DIR__, 2) . '/var/cache',
        );
    }

    /**
     * @return array<string, mixed> The verified claims.
     * @throws HttpException 401 when the token is missing, malformed, expired or not ours.
     */
    public function verify(string $token): array
    {
        $kid = $this->readKeyId($token);

        $claims = $this->decodeWith($this->keySet(false), $token, $kid);

        if ($claims === null) {
            // Unknown `kid` usually means Keycloak rotated its signing key.
            // One forced refresh, then give up.
            $claims = $this->decodeWith($this->keySet(true), $token, $kid);
        }

        if ($claims === null) {
            throw HttpException::unauthorized('Token signing key is not recognised.', 'invalid_token');
        }

        $this->assertIssuer($claims);
        $this->assertAudience($claims);
        $this->assertTokenType($claims);

        if (!isset($claims['sub']) || !\is_string($claims['sub']) || $claims['sub'] === '') {
            throw HttpException::unauthorized('Token has no subject.', 'invalid_token');
        }

        return $claims;
    }

    private function readKeyId(string $token): ?string
    {
        $parts = explode('.', $token);
        if (\count($parts) !== 3) {
            throw HttpException::unauthorized('Malformed token.', 'invalid_token');
        }

        $header = json_decode((string) JWT::urlsafeB64Decode($parts[0]), true);
        if (!\is_array($header)) {
            throw HttpException::unauthorized('Malformed token header.', 'invalid_token');
        }

        $alg = $header['alg'] ?? null;
        if (!\is_string($alg) || !\in_array($alg, self::ALLOWED_ALGORITHMS, true)) {
            // Rejected before any key lookup: `none`, HMAC downgrade, etc.
            throw HttpException::unauthorized('Unsupported token signature algorithm.', 'invalid_token');
        }

        return \is_string($header['kid'] ?? null) ? $header['kid'] : null;
    }

    /**
     * @param array<string, Key> $keys
     * @return array<string, mixed>|null Null when the key id is absent from this key set.
     */
    private function decodeWith(array $keys, string $token, ?string $kid): ?array
    {
        if ($kid !== null && !isset($keys[$kid])) {
            return null;
        }
        if ($keys === []) {
            return null;
        }

        JWT::$leeway = self::CLOCK_LEEWAY;

        try {
            $decoded = JWT::decode($token, $keys);
        } catch (\Firebase\JWT\ExpiredException) {
            throw HttpException::unauthorized('Access token has expired.', 'token_expired');
        } catch (\Firebase\JWT\BeforeValidException) {
            throw HttpException::unauthorized('Access token is not valid yet.', 'invalid_token');
        } catch (\Firebase\JWT\SignatureInvalidException) {
            throw HttpException::unauthorized('Access token signature is invalid.', 'invalid_token');
        } catch (\UnexpectedValueException | \DomainException) {
            throw HttpException::unauthorized('Access token could not be verified.', 'invalid_token');
        }

        /** @var array<string, mixed> $claims */
        $claims = json_decode((string) json_encode($decoded), true);

        return $claims;
    }

    /** @param array<string, mixed> $claims */
    private function assertIssuer(array $claims): void
    {
        $issuer = $claims['iss'] ?? null;

        // Tokens minted through the browser-facing URL carry the public issuer;
        // anything minted over the container network carries the internal one.
        // Both are this realm, so both are accepted — and nothing else is.
        $accepted = [
            $this->publicBaseUrl . '/realms/' . $this->realm,
            $this->internalBaseUrl . '/realms/' . $this->realm,
        ];

        if (!\is_string($issuer) || !\in_array($issuer, $accepted, true)) {
            throw HttpException::unauthorized('Token was not issued by this realm.', 'invalid_issuer');
        }
    }

    /** @param array<string, mixed> $claims */
    private function assertAudience(array $claims): void
    {
        $aud = $claims['aud'] ?? [];
        $aud = \is_string($aud) ? [$aud] : (\is_array($aud) ? $aud : []);

        if (\in_array($this->audience, $aud, true)) {
            return;
        }

        // Keycloak omits `aud` for a token whose only intended recipient is the
        // client that requested it; in that case `azp` carries the same meaning.
        $azp = $claims['azp'] ?? null;
        if (\is_string($azp) && $azp === $this->audience) {
            return;
        }

        throw HttpException::unauthorized('Token was not issued for this API.', 'invalid_audience');
    }

    /** @param array<string, mixed> $claims */
    private function assertTokenType(array $claims): void
    {
        $typ = $claims['typ'] ?? null;

        // An ID token is not an API credential. Keycloak marks access tokens
        // "Bearer"; anything else (ID, Refresh, Logout) is refused.
        if (\is_string($typ) && strcasecmp($typ, 'Bearer') !== 0) {
            throw HttpException::unauthorized('Only access tokens are accepted.', 'invalid_token');
        }
    }

    // ---------------------------------------------------------------- JWKS --

    /**
     * The realm's public signing keys.
     *
     * These are cached on disk for ten minutes. That is not an application
     * cache — it is how every OIDC resource server works, and re-fetching a
     * public key set on every single request would make Keycloak a hard
     * dependency of every API call.
     *
     * @return array<string, Key>
     */
    private function keySet(bool $forceRefresh): array
    {
        $path = $this->cacheDir . '/jwks-' . preg_replace('/[^a-z0-9_-]/i', '_', $this->realm) . '.json';

        if (!$forceRefresh) {
            $cached = $this->readCache($path);
            if ($cached !== null) {
                return $this->parse($cached);
            }
        } elseif ($this->refetchTooSoon($path)) {
            $cached = $this->readCache($path, ignoreTtl: true);

            return $cached === null ? [] : $this->parse($cached);
        }

        $fresh = $this->fetchJwks();
        if ($fresh === null) {
            // Keycloak unreachable: fall back to the stale copy rather than
            // rejecting every request. Signatures are still verified — a stale
            // public key cannot validate a forged token.
            $stale = $this->readCache($path, ignoreTtl: true);
            if ($stale === null) {
                throw new HttpException(503, 'idp_unreachable', 'The identity provider is unavailable.');
            }

            return $this->parse($stale);
        }

        $this->writeCache($path, $fresh);

        return $this->parse($fresh);
    }

    /** @return array<string, mixed>|null */
    private function readCache(string $path, bool $ignoreTtl = false): ?array
    {
        if (!is_file($path)) {
            return null;
        }
        if (!$ignoreTtl && (time() - (int) filemtime($path)) > self::JWKS_TTL_SECONDS) {
            return null;
        }

        $raw = file_get_contents($path);
        if ($raw === false) {
            return null;
        }

        $decoded = json_decode($raw, true);

        return \is_array($decoded) ? $decoded : null;
    }

    /** @param array<string, mixed> $jwks */
    private function writeCache(string $path, array $jwks): void
    {
        if (!is_dir($this->cacheDir) && !@mkdir($this->cacheDir, 0o770, true) && !is_dir($this->cacheDir)) {
            return;
        }

        // Write-then-rename so a concurrent reader never sees a half-written file.
        $tmp = $path . '.' . bin2hex(random_bytes(6)) . '.tmp';
        if (@file_put_contents($tmp, json_encode($jwks), LOCK_EX) !== false) {
            @rename($tmp, $path);
        } else {
            @unlink($tmp);
        }
    }

    private function refetchTooSoon(string $path): bool
    {
        return is_file($path) && (time() - (int) filemtime($path)) < self::JWKS_REFETCH_COOLDOWN;
    }

    /** @return array<string, mixed>|null */
    private function fetchJwks(): ?array
    {
        $url = sprintf('%s/realms/%s/protocol/openid-connect/certs', $this->internalBaseUrl, $this->realm);

        $ch = curl_init($url);
        if ($ch === false) {
            return null;
        }

        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_CONNECTTIMEOUT => 3,
            CURLOPT_TIMEOUT        => 5,
            CURLOPT_FOLLOWLOCATION => false,
            CURLOPT_SSL_VERIFYPEER => true,
            CURLOPT_SSL_VERIFYHOST => 2,
            CURLOPT_HTTPHEADER     => ['Accept: application/json'],
        ]);

        $body   = curl_exec($ch);
        $status = (int) curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        curl_close($ch);

        if (!\is_string($body) || $status !== 200) {
            return null;
        }

        $decoded = json_decode($body, true);

        return (\is_array($decoded) && isset($decoded['keys']) && \is_array($decoded['keys'])) ? $decoded : null;
    }

    /**
     * @param array<string, mixed> $jwks
     * @return array<string, Key>
     */
    private function parse(array $jwks): array
    {
        $keys = [];

        foreach ($jwks['keys'] as $jwk) {
            if (!\is_array($jwk)) {
                continue;
            }

            // Keycloak publishes its encryption key alongside its signing key.
            // Only signing keys with an algorithm we accept are considered.
            $use = $jwk['use'] ?? 'sig';
            $alg = $jwk['alg'] ?? null;

            if ($use !== 'sig' || !\is_string($alg) || !\in_array($alg, self::ALLOWED_ALGORITHMS, true)) {
                continue;
            }
            if (!\is_string($jwk['kid'] ?? null)) {
                continue;
            }

            try {
                $key = JWK::parseKey($jwk, $alg);
            } catch (\Throwable) {
                continue;
            }

            if ($key instanceof Key) {
                $keys[$jwk['kid']] = $key;
            }
        }

        return $keys;
    }
}
