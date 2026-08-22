<?php

declare(strict_types=1);

namespace App\Export;

/**
 * Masking for personal data in exports.
 *
 * The goal is a file that is still *useful* — you can tell two rows apart, spot
 * a duplicate, and recognise a domain — without being a redistributable
 * contact list. That is why the mask keeps the first character and the domain
 * rather than replacing the whole value.
 */
final class Pii
{
    public static function maskEmail(?string $email): string
    {
        if ($email === null || $email === '') {
            return '';
        }

        $at = strrpos($email, '@');
        if ($at === false || $at === 0) {
            return '***';
        }

        $local  = substr($email, 0, $at);
        $domain = substr($email, $at + 1);

        $visible = mb_substr($local, 0, 1);
        $hidden  = str_repeat('*', max(3, mb_strlen($local) - 1));

        return $visible . $hidden . '@' . $domain;
    }

    /**
     * Keep the given name and the initial of the family name: enough to
     * recognise someone you already know, not enough to build a directory.
     */
    public static function maskName(?string $name): string
    {
        if ($name === null || trim($name) === '') {
            return '';
        }

        $parts = preg_split('/\s+/', trim($name)) ?: [];
        if (\count($parts) === 1) {
            return $parts[0];
        }

        $last = array_pop($parts);

        return implode(' ', $parts) . ' ' . mb_substr($last, 0, 1) . '.';
    }
}
