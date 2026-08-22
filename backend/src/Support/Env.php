<?php

declare(strict_types=1);

namespace App\Support;

use Dotenv\Dotenv;

/**
 * Configuration access.
 *
 * Real environment variables win over the .env file, so a container can be
 * configured without baking secrets into the image. The .env file is loaded
 * once, lazily, and only if it exists — production deployments are expected to
 * pass everything through the environment.
 */
final class Env
{
    private static bool $loaded = false;

    private static function bootstrap(): void
    {
        if (self::$loaded) {
            return;
        }
        self::$loaded = true;

        $root = \dirname(__DIR__, 2);
        if (is_file($root . '/.env')) {
            Dotenv::createImmutable($root)->safeLoad();
        }
    }

    public static function get(string $key, ?string $default = null): ?string
    {
        self::bootstrap();

        $value = $_ENV[$key] ?? $_SERVER[$key] ?? getenv($key);
        if ($value === false || $value === null || $value === '') {
            return $default;
        }

        return (string) $value;
    }

    /**
     * Fetch a value that the application cannot run without. Failing loudly at
     * boot is better than failing obscurely on the first request that needs it.
     */
    public static function require(string $key): string
    {
        $value = self::get($key);
        if ($value === null) {
            throw new \RuntimeException(sprintf('Required configuration "%s" is not set.', $key));
        }

        return $value;
    }

    public static function int(string $key, int $default): int
    {
        $value = self::get($key);

        return $value === null ? $default : (int) $value;
    }

    public static function bool(string $key, bool $default): bool
    {
        $value = self::get($key);
        if ($value === null) {
            return $default;
        }

        return \in_array(strtolower($value), ['1', 'true', 'yes', 'on'], true);
    }

    /** @return list<string> */
    public static function list(string $key, array $default = []): array
    {
        $value = self::get($key);
        if ($value === null) {
            return $default;
        }

        $parts = array_map('trim', explode(',', $value));

        return array_values(array_filter($parts, static fn (string $p): bool => $p !== ''));
    }

    public static function isProduction(): bool
    {
        return self::get('APP_ENV', 'production') === 'production';
    }
}
