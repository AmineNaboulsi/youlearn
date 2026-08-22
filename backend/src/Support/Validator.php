<?php

declare(strict_types=1);

namespace App\Support;

use App\Http\HttpException;

/**
 * Small, explicit input validator.
 *
 * Every value that reaches a repository passes through here first, so the
 * repositories can assume well-formed input and concentrate on SQL. Errors
 * accumulate and are reported together — a form that is wrong in three places
 * should say so once, not three times in a row.
 */
final class Validator
{
    /** @var array<string, string> */
    private array $errors = [];

    /** @param array<string, mixed> $data */
    public function __construct(private readonly array $data)
    {
    }

    /** @param array<string, mixed> $data */
    public static function for(array $data): self
    {
        return new self($data);
    }

    public function requiredString(string $field, int $min = 1, int $max = 255): string
    {
        $value = $this->data[$field] ?? null;

        if (!\is_string($value) || trim($value) === '') {
            $this->errors[$field] = 'This field is required.';

            return '';
        }

        $value = trim($value);
        $length = mb_strlen($value);

        if ($length < $min) {
            $this->errors[$field] = sprintf('Must be at least %d characters.', $min);
        } elseif ($length > $max) {
            $this->errors[$field] = sprintf('Must be at most %d characters.', $max);
        }

        return $value;
    }

    public function optionalString(string $field, int $max = 500, string $default = ''): string
    {
        $value = $this->data[$field] ?? null;

        if ($value === null || $value === '') {
            return $default;
        }

        if (!\is_string($value)) {
            $this->errors[$field] = 'Must be text.';

            return $default;
        }

        $value = trim($value);
        if (mb_strlen($value) > $max) {
            $this->errors[$field] = sprintf('Must be at most %d characters.', $max);
        }

        return $value;
    }

    public function requiredInt(string $field, int $min = 1, int $max = PHP_INT_MAX): int
    {
        $value = $this->data[$field] ?? null;

        $looksIntegral = \is_int($value)
            || (\is_string($value) && preg_match('/^-?\d{1,19}$/', trim($value)) === 1);

        if (!$looksIntegral) {
            $this->errors[$field] = 'Must be a whole number.';

            return $min;
        }

        $int = (int) $value;
        if ($int < $min || $int > $max) {
            $this->errors[$field] = sprintf('Must be between %d and %d.', $min, $max);
        }

        return $int;
    }

    public function optionalInt(string $field, ?int $default, int $min = 1, int $max = PHP_INT_MAX): ?int
    {
        $value = $this->data[$field] ?? null;
        if ($value === null || $value === '') {
            return $default;
        }

        return $this->requiredInt($field, $min, $max);
    }

    public function bool(string $field, bool $default = false): bool
    {
        $value = $this->data[$field] ?? null;

        if ($value === null || $value === '') {
            return $default;
        }
        if (\is_bool($value)) {
            return $value;
        }
        if (\is_int($value)) {
            return $value === 1;
        }
        if (\is_string($value)) {
            return \in_array(strtolower($value), ['1', 'true', 'yes', 'on'], true);
        }

        $this->errors[$field] = 'Must be true or false.';

        return $default;
    }

    /** @param list<string> $allowed */
    public function enum(string $field, array $allowed, ?string $default = null): string
    {
        $value = $this->data[$field] ?? null;

        if (($value === null || $value === '') && $default !== null) {
            return $default;
        }

        if (!\is_string($value) || !\in_array($value, $allowed, true)) {
            $this->errors[$field] = 'Must be one of: ' . implode(', ', $allowed) . '.';

            return $default ?? '';
        }

        return $value;
    }

    /**
     * A list of positive integers, deduplicated.
     *
     * @return list<int>
     */
    public function intList(string $field, int $minCount = 0, int $maxCount = 50): array
    {
        $value = $this->data[$field] ?? null;

        if (!\is_array($value)) {
            if ($minCount > 0) {
                $this->errors[$field] = 'Must be a list.';
            }

            return [];
        }

        $ids = [];
        foreach ($value as $item) {
            // Accept both a bare id and an object with an id, since the tag
            // picker sends whole tag objects back.
            if (\is_array($item) && isset($item['id'])) {
                $item = $item['id'];
            }
            if (\is_int($item) || (\is_string($item) && preg_match('/^\d+$/', $item) === 1)) {
                $int = (int) $item;
                if ($int > 0) {
                    $ids[$int] = true;
                }
            }
        }

        $ids = array_keys($ids);

        if (\count($ids) < $minCount) {
            $this->errors[$field] = sprintf('Select at least %d.', $minCount);
        } elseif (\count($ids) > $maxCount) {
            $this->errors[$field] = sprintf('Select at most %d.', $maxCount);
        }

        return $ids;
    }

    /**
     * A URL that is safe to render in an <img src>.
     *
     * Only absolute http(s) URLs are accepted — `javascript:` and `data:` URLs
     * are the two that turn a stored image field into stored XSS.
     */
    public function optionalUrl(string $field, int $max = 2048): string
    {
        $value = $this->optionalString($field, $max);
        if ($value === '') {
            return '';
        }

        $scheme = strtolower((string) parse_url($value, PHP_URL_SCHEME));
        if (!\in_array($scheme, ['http', 'https'], true) || filter_var($value, FILTER_VALIDATE_URL) === false) {
            $this->errors[$field] = 'Must be an absolute http(s) URL.';

            return '';
        }

        return $value;
    }

    public function fails(): bool
    {
        return $this->errors !== [];
    }

    /** @throws HttpException 422 listing every field that failed. */
    public function validate(): void
    {
        if ($this->errors !== []) {
            throw HttpException::validation($this->errors);
        }
    }

    public function addError(string $field, string $message): void
    {
        $this->errors[$field] = $message;
    }
}
