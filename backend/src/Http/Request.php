<?php

declare(strict_types=1);

namespace App\Http;

/**
 * Immutable view of the incoming request.
 *
 * The body is read lazily and capped. An unbounded json_decode on php://input
 * is a cheap way to make a PHP process allocate hundreds of megabytes, so the
 * length check happens before the decode, not after. Upload chunks bypass the
 * cap entirely via streamBodyTo(), which never holds more than a buffer.
 */
final class Request
{
    private const MAX_BODY_BYTES = 1_048_576; // 1 MiB
    private const MAX_JSON_DEPTH = 32;

    /** @var array<string, string> */
    private array $query;

    /** @var array<string, mixed>|null */
    private ?array $json = null;

    private bool $jsonParsed = false;

    private function __construct(
        public readonly string $method,
        public readonly string $path,
        array $query,
        /** @var array<string, string> */
        private readonly array $headers,
    ) {
        $this->query = $query;
    }

    public static function capture(): self
    {
        $method = strtoupper((string) ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
        $path   = (string) parse_url((string) ($_SERVER['REQUEST_URI'] ?? '/'), PHP_URL_PATH);

        // Normalise: strip a trailing slash so /courses and /courses/ are one route.
        $path = rtrim($path, '/');
        if ($path === '') {
            $path = '/';
        }

        $query = [];
        foreach ($_GET as $key => $value) {
            if (\is_string($key) && \is_scalar($value)) {
                $query[$key] = (string) $value;
            }
        }

        return new self($method, $path, $query, self::readHeaders());
    }

    /**
     * Read and cap the JSON request body.
     *
     * Read lazily rather than at capture time. An upload chunk is several
     * megabytes of binary that must be streamed straight to disk, and buffering
     * every request body up front would both waste memory on the common case
     * and make the streaming case impossible.
     */
    private function readBody(): string
    {
        if (\in_array($this->method, ['GET', 'HEAD', 'OPTIONS'], true)) {
            return '';
        }

        $declared = (int) ($_SERVER['CONTENT_LENGTH'] ?? 0);
        if ($declared > self::MAX_BODY_BYTES) {
            throw new HttpException(413, 'payload_too_large', 'Request body exceeds the 1 MiB limit.');
        }

        $body = file_get_contents('php://input', false, null, 0, self::MAX_BODY_BYTES + 1);
        if ($body === false) {
            return '';
        }

        if (\strlen($body) > self::MAX_BODY_BYTES) {
            throw new HttpException(413, 'payload_too_large', 'Request body exceeds the 1 MiB limit.');
        }

        return $body;
    }

    /**
     * Copy the raw request body into an open stream, up to $maxBytes.
     *
     * Used by the chunked upload endpoint. Nothing is held in memory beyond one
     * 64 KiB buffer, so the size of an upload chunk is bounded by policy rather
     * than by how much RAM the PHP worker happens to have.
     *
     * @return int Bytes written.
     * @throws HttpException 413 if the body exceeds $maxBytes.
     */
    public function streamBodyTo($destination, int $maxBytes): int
    {
        $input = fopen('php://input', 'rb');
        if ($input === false) {
            throw new HttpException(400, 'unreadable_body', 'Request body could not be read.');
        }

        $written = 0;

        try {
            while (!feof($input)) {
                $buffer = fread($input, 65536);
                if ($buffer === false || $buffer === '') {
                    break;
                }

                $written += \strlen($buffer);

                // Checked as it arrives, not from Content-Length, which a
                // client is free to lie about.
                if ($written > $maxBytes) {
                    throw new HttpException(
                        413,
                        'chunk_too_large',
                        sprintf('Upload chunk exceeds the %d byte limit.', $maxBytes)
                    );
                }

                if (fwrite($destination, $buffer) === false) {
                    throw new HttpException(500, 'write_failed', 'Upload could not be written to storage.');
                }
            }
        } finally {
            fclose($input);
        }

        return $written;
    }

    /** @return array<string, string> */
    private static function readHeaders(): array
    {
        $headers = [];
        foreach ($_SERVER as $key => $value) {
            if (\is_string($key) && str_starts_with($key, 'HTTP_') && \is_scalar($value)) {
                $name = strtolower(str_replace('_', '-', substr($key, 5)));
                $headers[$name] = (string) $value;
            }
        }
        if (isset($_SERVER['CONTENT_TYPE'])) {
            $headers['content-type'] = (string) $_SERVER['CONTENT_TYPE'];
        }

        return $headers;
    }

    public function header(string $name): ?string
    {
        return $this->headers[strtolower($name)] ?? null;
    }

    public function query(string $key, ?string $default = null): ?string
    {
        $value = $this->query[$key] ?? null;

        return ($value === null || $value === '') ? $default : $value;
    }

    /** @return array<string, string> */
    public function queryAll(): array
    {
        return $this->query;
    }

    /**
     * Decoded JSON body. Returns an empty array for an absent body so callers
     * can validate uniformly instead of null-checking first.
     *
     * @return array<string, mixed>
     */
    public function json(): array
    {
        if ($this->jsonParsed) {
            return $this->json ?? [];
        }
        $this->jsonParsed = true;

        $raw = $this->readBody();

        if (trim($raw) === '') {
            $this->json = [];

            return [];
        }

        try {
            $decoded = json_decode($raw, true, self::MAX_JSON_DEPTH, JSON_THROW_ON_ERROR);
        } catch (\JsonException) {
            throw new HttpException(400, 'invalid_json', 'Request body is not valid JSON.');
        }

        if (!\is_array($decoded)) {
            throw new HttpException(400, 'invalid_json', 'Request body must be a JSON object.');
        }

        $this->json = $decoded;

        return $decoded;
    }

    public function bearerToken(): ?string
    {
        // Apache with mod_php does not always expose Authorization in $_SERVER;
        // the .htaccess/apache conf forwards it, and getallheaders is the fallback.
        $header = $this->header('authorization');

        if ($header === null && \function_exists('getallheaders')) {
            foreach (getallheaders() as $name => $value) {
                if (strcasecmp((string) $name, 'Authorization') === 0) {
                    $header = (string) $value;
                    break;
                }
            }
        }

        if ($header === null) {
            return null;
        }

        if (!preg_match('/^Bearer\s+(\S+)$/i', trim($header), $m)) {
            return null;
        }

        return $m[1];
    }

    public function origin(): ?string
    {
        return $this->header('origin');
    }

    public function userAgent(): string
    {
        return substr($this->header('user-agent') ?? '', 0, 512);
    }

    /**
     * Client address.
     *
     * X-Forwarded-For is only trusted when TRUSTED_PROXIES names the peer,
     * because otherwise any client could forge the value the rate limiter and
     * the audit log key on.
     */
    public function clientIp(): string
    {
        $remote = (string) ($_SERVER['REMOTE_ADDR'] ?? '0.0.0.0');

        $trusted = \App\Support\Env::list('TRUSTED_PROXIES');
        if ($trusted === [] || !\in_array($remote, $trusted, true)) {
            return $remote;
        }

        $forwarded = $this->header('x-forwarded-for');
        if ($forwarded === null) {
            return $remote;
        }

        $first = trim(explode(',', $forwarded)[0]);

        return filter_var($first, FILTER_VALIDATE_IP) === false ? $remote : $first;
    }
}
