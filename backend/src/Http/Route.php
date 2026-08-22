<?php

declare(strict_types=1);

namespace App\Http;

/**
 * One route: a method, a pattern, a handler and the permission it demands.
 *
 * Authorisation is declared here rather than checked inside the controller, so
 * an endpoint cannot be added without a reviewer seeing what it is protected
 * by — and so an unguarded endpoint is visible as a missing `requires()` in the
 * route table instead of an easily-missed absent `if` in a method body.
 */
final class Route
{
    private ?string $permission = null;
    private bool $needsAuth = false;
    private ?string $rateLimitBucket = null;
    private int $rateLimitMax = 0;
    private int $rateLimitWindow = 0;

    /** @var list<string> */
    private array $paramNames = [];

    private string $regex;

    /** @param callable|array{class-string, string} $handler */
    public function __construct(
        public readonly string $method,
        public readonly string $pattern,
        public readonly mixed $handler,
    ) {
        $this->regex = $this->compile($pattern);
    }

    private function compile(string $pattern): string
    {
        $regex = preg_replace_callback(
            '/\{([a-zA-Z_][a-zA-Z0-9_]*)\}/',
            function (array $m): string {
                $this->paramNames[] = $m[1];

                // Path parameters are ids and slugs only. Keeping the character
                // class tight means a traversal or encoded separator never
                // reaches a controller in the first place.
                return '([A-Za-z0-9_-]+)';
            },
            $pattern
        );

        return '#^' . $regex . '$#';
    }

    /**
     * @return array<string, string>|null Captured parameters, or null when the path does not match.
     */
    public function match(string $path): ?array
    {
        if (preg_match($this->regex, $path, $matches) !== 1) {
            return null;
        }

        $params = [];
        foreach ($this->paramNames as $index => $name) {
            $params[$name] = $matches[$index + 1];
        }

        return $params;
    }

    /** Require a valid token and a specific permission. */
    public function requires(string $permission): self
    {
        $this->permission = $permission;
        $this->needsAuth  = true;

        return $this;
    }

    /** Require a valid token but no particular permission (e.g. "my profile"). */
    public function authenticated(): self
    {
        $this->needsAuth = true;

        return $this;
    }

    /** Cap how often one caller may hit this route. */
    public function throttle(string $bucket, int $max, int $windowSeconds): self
    {
        $this->rateLimitBucket = $bucket;
        $this->rateLimitMax    = $max;
        $this->rateLimitWindow = $windowSeconds;

        return $this;
    }

    public function permission(): ?string
    {
        return $this->permission;
    }

    public function needsAuth(): bool
    {
        return $this->needsAuth;
    }

    /** @return array{bucket: string, max: int, window: int}|null */
    public function rateLimit(): ?array
    {
        if ($this->rateLimitBucket === null) {
            return null;
        }

        return [
            'bucket' => $this->rateLimitBucket,
            'max'    => $this->rateLimitMax,
            'window' => $this->rateLimitWindow,
        ];
    }
}
