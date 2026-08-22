<?php

declare(strict_types=1);

namespace App\Http;

/**
 * Page window parsed from the query string.
 *
 * The ceiling is enforced here rather than trusted from the client, which is
 * the difference between a paged list endpoint and an accidental bulk export.
 */
final class Pagination
{
    private function __construct(
        public readonly int $page,
        public readonly int $perPage,
        public readonly int $offset,
    ) {
    }

    public static function fromRequest(Request $request, int $defaultPerPage = 12, int $maxPerPage = 48): self
    {
        $page = (int) ($request->query('page') ?? '1');
        if ($page < 1) {
            $page = 1;
        }
        // Cap the page number too: a huge OFFSET is a cheap way to make MySQL
        // scan the whole table for a result set nobody will read.
        $page = min($page, 10_000);

        $perPage = (int) ($request->query('per_page') ?? (string) $defaultPerPage);
        if ($perPage < 1) {
            $perPage = $defaultPerPage;
        }
        $perPage = min($perPage, $maxPerPage);

        return new self($page, $perPage, ($page - 1) * $perPage);
    }

    /** @return array<string, int> */
    public function meta(int $total): array
    {
        return [
            'page'        => $this->page,
            'per_page'    => $this->perPage,
            'total'       => $total,
            'total_pages' => $this->perPage > 0 ? (int) ceil($total / $this->perPage) : 0,
        ];
    }
}
