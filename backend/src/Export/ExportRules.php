<?php

declare(strict_types=1);

namespace App\Export;

/**
 * The resolved rules for one caller exporting one dataset.
 *
 * Produced by ExportPolicy::resolve() and then read-only, so the limits a
 * request is judged against cannot be recomputed — or quietly relaxed —
 * partway through building the file.
 */
final class ExportRules
{
    public function __construct(
        public readonly string $dataset,
        public readonly string $label,
        public readonly int $maxRows,
        public readonly int $perWindow,
        public readonly int $window,
        public readonly bool $hasPii,
        public readonly ?int $scopedToInstructorId,
        public readonly bool $mayUnmaskPii,
    ) {
    }

    public function bucket(): string
    {
        return 'export:' . $this->dataset;
    }

    /**
     * Whether this request should receive personal data in the clear.
     *
     * Two conditions, both required: the caller must hold the unmask
     * permission, and must have asked for it explicitly on this request.
     * Holding the permission is not, on its own, a reason to hand it over.
     */
    public function shouldUnmask(bool $requested): bool
    {
        return $this->hasPii && $this->mayUnmaskPii && $requested;
    }

    public function filename(): string
    {
        return sprintf('youlearn-%s-%s.csv', $this->dataset, gmdate('Y-m-d'));
    }
}
