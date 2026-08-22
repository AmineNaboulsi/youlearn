<?php

declare(strict_types=1);

namespace App\Controller;

use App\Http\HttpException;
use App\Http\Request;
use App\Http\Response;
use App\Repository\StatsRepository;
use App\Security\Permission;
use App\Security\Principal;

final class StatsController
{
    private StatsRepository $stats;

    public function __construct()
    {
        $this->stats = new StatsRepository();
    }

    /** @param array<string, string> $params */
    public function dashboard(Request $request, ?Principal $principal, array $params): Response
    {
        $principal = $this->require($principal);

        // One scope decision, applied to every figure below, so an
        // instructor's dashboard cannot mix their own counts with platform ones.
        // Null means "the whole platform"; anything else scopes to that author.
        $scope = $principal->can(Permission::COURSE_MANAGE_ANY) ? null : $principal->userId;

        $payload = [
            'scope'        => $scope === null ? 'platform' : 'own',
            'summary'      => $this->stats->summary($scope),
            'daily'        => $this->stats->enrollmentsByDay($scope, 30),
            'top_courses'  => $this->stats->topCourses($scope, 5),
        ];

        if ($principal->can(Permission::USER_READ_ANY)) {
            $payload['people'] = $this->stats->userCounts();
        }

        return Response::json(['status' => true, 'data' => $payload]);
    }

    private function require(?Principal $principal): Principal
    {
        if ($principal === null) {
            throw HttpException::unauthorized();
        }

        return $principal;
    }
}
