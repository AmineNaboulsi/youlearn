<?php

declare(strict_types=1);

namespace App\Http;

/**
 * A response the router knows how to emit.
 *
 * Controllers return one of these rather than echoing, so cross-cutting
 * concerns (CORS, security headers, no-store) are applied in exactly one place.
 */
final class Response
{
    /**
     * @param array<string, string> $headers
     * @param (callable(): void)|null $stream Emits the body itself, for
     *        responses too large to hold in a string.
     */
    private function __construct(
        public readonly int $status,
        public readonly string $body,
        public readonly array $headers,
        private readonly mixed $stream = null,
    ) {
    }

    /** @param array<string, string> $headers */
    public static function json(mixed $payload, int $status = 200, array $headers = []): self
    {
        $encoded = json_encode(
            $payload,
            JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE
        );

        if ($encoded === false) {
            $encoded = '{"error":"encoding_failed","message":"Response could not be encoded."}';
            $status  = 500;
        }

        return new self($status, $encoded, ['Content-Type' => 'application/json; charset=utf-8'] + $headers);
    }

    public static function noContent(): self
    {
        return new self(204, '', []);
    }

    /**
     * A bodyless response with a bespoke header set — used for CORS preflight,
     * where the headers *are* the answer.
     *
     * @param array<string, string> $headers
     */
    public static function raw(int $status, array $headers): self
    {
        return new self($status, '', $headers);
    }

    /** @param array<string, string> $headers */
    public static function csv(string $csv, string $filename, array $headers = []): self
    {
        // A UTF-8 BOM makes Excel open accented course titles correctly instead
        // of mojibake; every other consumer ignores it.
        return new self(200, "\xEF\xBB\xBF" . $csv, [
            'Content-Type'        => 'text/csv; charset=utf-8',
            'Content-Disposition' => sprintf('attachment; filename="%s"', self::sanitizeFilename($filename)),
            // Belt and braces against a CSV ever being sniffed as HTML.
            'X-Content-Type-Options' => 'nosniff',
        ] + $headers);
    }

    private static function sanitizeFilename(string $name): string
    {
        $clean = preg_replace('/[^A-Za-z0-9._-]/', '-', $name) ?? 'export.csv';

        return substr($clean, 0, 120);
    }

    /**
     * A response whose body is written by a callback rather than returned as a
     * string.
     *
     * Video files are tens or hundreds of megabytes; reading one into memory to
     * return it would let a handful of concurrent viewers exhaust the server.
     *
     * @param callable(): void $writer
     * @param array<string, string> $headers
     */
    public static function stream(callable $writer, int $status = 200, array $headers = []): self
    {
        return new self($status, '', $headers, $writer);
    }

    public function send(): void
    {
        http_response_code($this->status);

        foreach ($this->headers as $name => $value) {
            header($name . ': ' . $value, true);
        }

        if ($this->status === 204) {
            return;
        }

        if ($this->stream !== null) {
            // Any output buffering has to go, or the whole file is accumulated
            // in memory anyway and the point of streaming is lost.
            while (ob_get_level() > 0) {
                ob_end_flush();
            }
            ($this->stream)();

            return;
        }

        echo $this->body;
    }
}
