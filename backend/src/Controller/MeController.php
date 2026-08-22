<?php

declare(strict_types=1);

namespace App\Controller;

use App\Http\HttpException;
use App\Http\Request;
use App\Http\Response;
use App\Repository\StatsRepository;
use App\Repository\UserRepository;
use App\Security\Principal;

/**
 * The signed-in caller's own view of themselves.
 *
 * Returns the permission list alongside the profile so the front end can hide
 * actions the caller cannot perform — as a courtesy, not as a control. Every
 * one of those actions is independently checked server-side.
 */
final class MeController
{
    /** @param array<string, string> $params */
    public function show(Request $request, ?Principal $principal, array $params): Response
    {
        if ($principal === null) {
            throw HttpException::unauthorized();
        }

        $user = (new UserRepository())->findById($principal->userId);

        $payload = $principal->toArray() + [
            'member_since' => $user['created_at'] ?? null,
            'last_seen_at' => $user['last_seen_at'] ?? null,
            'is_active'    => $user === null ? true : ((int) $user['is_active']) === 1,
            // The UI shows a countdown so an expiring session is visible before
            // it becomes a failed action.
            'token_expires_at' => gmdate('c', $principal->tokenExpiresAt),
        ];

        if ($principal->isTeacher() || $principal->isAdmin()) {
            $stats = new StatsRepository();
            $payload['teaching'] = $stats->summary($principal->isAdmin() ? null : $principal->userId);
        }

        return Response::json(['status' => true, 'data' => $payload]);
    }
}
