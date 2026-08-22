<?php

declare(strict_types=1);

namespace App\Http;

use App\Security\Authenticator;
use App\Security\Principal;
use App\Security\RateLimiter;
use App\Support\Env;

/**
 * Matches a request to a route, enforces the route's declared protection, and
 * emits exactly one response.
 *
 * Every cross-cutting concern lives here — CORS, security headers, no-store,
 * authentication, authorisation, throttling, error shaping — so a controller
 * can be read as pure application logic and nothing can be forgotten by
 * accident on a new endpoint.
 */
final class Router
{
    /** @var list<Route> */
    private array $routes = [];

    public function __construct(
        private readonly Authenticator $authenticator,
        private readonly RateLimiter $rateLimiter,
    ) {
    }

    /** @param callable|array{class-string, string} $handler */
    public function get(string $pattern, mixed $handler): Route
    {
        return $this->add('GET', $pattern, $handler);
    }

    /** @param callable|array{class-string, string} $handler */
    public function post(string $pattern, mixed $handler): Route
    {
        return $this->add('POST', $pattern, $handler);
    }

    /** @param callable|array{class-string, string} $handler */
    public function put(string $pattern, mixed $handler): Route
    {
        return $this->add('PUT', $pattern, $handler);
    }

    /** @param callable|array{class-string, string} $handler */
    public function patch(string $pattern, mixed $handler): Route
    {
        return $this->add('PATCH', $pattern, $handler);
    }

    /** @param callable|array{class-string, string} $handler */
    public function delete(string $pattern, mixed $handler): Route
    {
        return $this->add('DELETE', $pattern, $handler);
    }

    /** @param callable|array{class-string, string} $handler */
    private function add(string $method, string $pattern, mixed $handler): Route
    {
        $route = new Route($method, $pattern, $handler);
        $this->routes[] = $route;

        return $route;
    }

    public function dispatch(Request $request): void
    {
        $response = $this->resolve($request);

        foreach ($this->baseHeaders($request) as $name => $value) {
            header($name . ': ' . $value, true);
        }

        $response->send();
    }

    private function resolve(Request $request): Response
    {
        try {
            if ($request->method === 'OPTIONS') {
                return $this->preflight($request);
            }

            $allowedMethods = [];

            foreach ($this->routes as $route) {
                $params = $route->match($request->path);
                if ($params === null) {
                    continue;
                }

                if ($route->method !== $request->method) {
                    $allowedMethods[] = $route->method;
                    continue;
                }

                return $this->run($route, $request, $params);
            }

            if ($allowedMethods !== []) {
                // The path exists but not with this verb. 405 with Allow is
                // more useful to a client than a misleading 404.
                return Response::json(
                    $this->error('method_not_allowed', 'This endpoint does not accept ' . $request->method . '.'),
                    405,
                    ['Allow' => implode(', ', array_unique([...$allowedMethods, 'OPTIONS']))]
                );
            }

            return Response::json($this->error('not_found', 'No such endpoint.'), 404);
        } catch (HttpException $e) {
            return Response::json(
                $this->error($e->errorCode, $e->getMessage(), $e->details),
                $e->status,
                $e->headers
            );
        } catch (\Throwable $e) {
            $this->logUnexpected($e);

            $payload = $this->error('server_error', 'Something went wrong on our side.');

            // Outside production the message and origin are echoed back,
            // because chasing a 500 through container logs is miserable.
            if (!Env::isProduction()) {
                $payload['debug'] = [
                    'exception' => $e::class,
                    'message'   => $e->getMessage(),
                    'at'        => $e->getFile() . ':' . $e->getLine(),
                ];
            }

            return Response::json($payload, 500);
        }
    }

    /** @param array<string, string> $params */
    private function run(Route $route, Request $request, array $params): Response
    {
        $principal = null;

        if ($route->needsAuth()) {
            $principal = $this->authenticator->authenticate($request);

            $permission = $route->permission();
            if ($permission !== null && !$principal->can($permission)) {
                throw HttpException::forbidden();
            }
        } else {
            $principal = $this->authenticator->authenticateOptional($request);
        }

        $limit = $route->rateLimit();
        if ($limit !== null) {
            // Signed-in callers are limited per identity so one user cannot
            // spend another's quota from behind a shared NAT; anonymous callers
            // fall back to the client address.
            $actor = $principal !== null ? 'user:' . $principal->subject : 'ip:' . $request->clientIp();
            $this->rateLimiter->hit($limit['bucket'], $actor, $limit['max'], $limit['window']);
        }

        $handler = $route->handler;

        if (\is_array($handler)) {
            [$class, $method] = $handler;
            $controller = new $class();
            $result = $controller->{$method}($request, $principal, $params);
        } else {
            $result = $handler($request, $principal, $params);
        }

        if ($result instanceof Response) {
            return $result;
        }

        return Response::json($result);
    }

    private function preflight(Request $request): Response
    {
        $allowed = [];
        foreach ($this->routes as $route) {
            if ($route->match($request->path) !== null) {
                $allowed[] = $route->method;
            }
        }

        if ($allowed === []) {
            return Response::json($this->error('not_found', 'No such endpoint.'), 404);
        }

        $verbs = implode(', ', array_unique([...$allowed, 'OPTIONS']));

        return Response::raw(204, [
            'Allow'                        => $verbs,
            'Access-Control-Allow-Methods' => $verbs,
            'Access-Control-Allow-Headers' => 'Authorization, Content-Type, Accept',
            'Access-Control-Max-Age'       => '600',
        ]);
    }

    /**
     * Headers applied to every response.
     *
     * @return array<string, string>
     */
    private function baseHeaders(Request $request): array
    {
        $headers = [
            'X-Content-Type-Options' => 'nosniff',
            'X-Frame-Options'        => 'DENY',
            'Referrer-Policy'        => 'no-referrer',
            'Cross-Origin-Resource-Policy' => 'same-site',
            // This API only ever returns per-user data over a bearer token.
            // Nothing it says should be stored by a proxy or a browser.
            'Cache-Control'          => 'no-store, no-cache, must-revalidate, private',
            'Pragma'                 => 'no-cache',
            // The API serves JSON and CSV only; a strict CSP means a response
            // that somehow renders as HTML still cannot execute anything.
            'Content-Security-Policy' => "default-src 'none'; frame-ancestors 'none'; sandbox",
            'Permissions-Policy'     => 'geolocation=(), camera=(), microphone=(), payment=()',
        ];

        $origin = $request->origin();
        $allowedOrigins = Env::list('ALLOWED_ORIGINS', ['http://localhost:3000']);

        if ($origin !== null && \in_array($origin, $allowedOrigins, true)) {
            $headers['Access-Control-Allow-Origin'] = $origin;
            // Credentials are never used — auth is a bearer token — so the
            // cookie-bearing CORS mode stays off deliberately.
            $headers['Vary'] = 'Origin';
        }

        return $headers;
    }

    /**
     * @param array<string, mixed> $details
     * @return array<string, mixed>
     */
    private function error(string $code, string $message, array $details = []): array
    {
        $payload = [
            'status'  => false,
            'error'   => $code,
            'message' => $message,
        ];

        if ($details !== []) {
            $payload += $details;
        }

        return $payload;
    }

    private function logUnexpected(\Throwable $e): void
    {
        error_log(sprintf(
            '[youlearn] %s: %s at %s:%d',
            $e::class,
            $e->getMessage(),
            $e->getFile(),
            $e->getLine()
        ));
    }
}
