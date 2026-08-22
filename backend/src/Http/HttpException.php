<?php

declare(strict_types=1);

namespace App\Http;

/**
 * An error that is safe to show the caller.
 *
 * Anything thrown that is *not* an HttpException is treated as a bug and
 * rendered as a generic 500 — internal messages never reach the client.
 */
class HttpException extends \RuntimeException
{
    /**
     * @param array<string, mixed> $details Field-level detail, e.g. validation errors.
     * @param array<string, string> $headers Extra response headers, e.g. Retry-After.
     */
    public function __construct(
        public readonly int $status,
        public readonly string $errorCode,
        string $message,
        public readonly array $details = [],
        public readonly array $headers = [],
    ) {
        parent::__construct($message);
    }

    public static function unauthorized(string $message = 'Authentication is required.', string $code = 'unauthenticated'): self
    {
        return new self(401, $code, $message, [], [
            'WWW-Authenticate' => sprintf('Bearer realm="youlearn", error="%s"', $code),
        ]);
    }

    public static function forbidden(string $message = 'You do not have permission to perform this action.'): self
    {
        return new self(403, 'forbidden', $message);
    }

    public static function notFound(string $message = 'Resource not found.'): self
    {
        return new self(404, 'not_found', $message);
    }

    public static function conflict(string $message): self
    {
        return new self(409, 'conflict', $message);
    }

    /** @param array<string, string> $errors */
    public static function validation(array $errors, string $message = 'The request contains invalid fields.'): self
    {
        return new self(422, 'validation_failed', $message, ['fields' => $errors]);
    }
}
