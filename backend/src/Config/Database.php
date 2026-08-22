<?php

declare(strict_types=1);

namespace App\Config;

use App\Support\Env;
use PDO;

/**
 * Single PDO connection per request.
 *
 * ATTR_EMULATE_PREPARES is off so placeholders are sent to MySQL as real
 * parameters. That matters for more than tidiness: with emulation on, an
 * integer bound with PARAM_INT is still interpolated as a string, which is
 * exactly the hole the old LIMIT/OFFSET code fell through.
 */
final class Database
{
    private static ?PDO $connection = null;

    public static function connection(): PDO
    {
        if (self::$connection instanceof PDO) {
            return self::$connection;
        }

        $host = Env::get('DB_HOST', '127.0.0.1');
        $port = Env::int('DB_PORT', 3306);
        $name = Env::get('DB_NAME', 'youlearn');

        $dsn = sprintf('mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4', $host, $port, $name);

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::ATTR_STRINGIFY_FETCHES  => false,
        ];

        /*
         * TLS.
         *
         * A managed MySQL (Azure Database for MySQL, RDS, Cloud SQL) refuses
         * plaintext connections — `require_secure_transport` is ON by default —
         * and, more to the point, this connection crosses the public internet
         * when the database is not a container on the same host. Every query,
         * every credential and every row of personal data would otherwise be
         * readable in transit.
         *
         * DB_SSL_CA points at the provider's CA bundle. With it, the server
         * certificate is verified; without it the connection is refused rather
         * than silently downgraded, unless DB_SSL_VERIFY is explicitly turned
         * off — which exists for a first-boot smoke test and nothing else.
         */
        $caPath = Env::get('DB_SSL_CA');

        if ($caPath !== null && $caPath !== '') {
            if (!is_readable($caPath)) {
                throw new \RuntimeException(sprintf('DB_SSL_CA is set to "%s", which cannot be read.', $caPath));
            }

            $options[PDO::MYSQL_ATTR_SSL_CA] = $caPath;
            $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = Env::bool('DB_SSL_VERIFY', true);
        } elseif (Env::bool('DB_SSL', false)) {
            // TLS demanded without a CA bundle: encrypted, but the server's
            // identity is unverified. Usable in a pinch, never a default.
            $options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
        }

        self::$connection = new PDO(
            $dsn,
            Env::get('DB_USER', 'youlearn'),
            Env::get('DB_PASS', ''),
            $options
        );

        return self::$connection;
    }

    /**
     * Run a closure inside a transaction, rolling back on any throwable.
     *
     * @template T
     * @param callable(PDO): T $work
     * @return T
     */
    public static function transaction(callable $work): mixed
    {
        $pdo = self::connection();
        $pdo->beginTransaction();

        try {
            $result = $work($pdo);
            $pdo->commit();

            return $result;
        } catch (\Throwable $e) {
            if ($pdo->inTransaction()) {
                $pdo->rollBack();
            }
            throw $e;
        }
    }
}
