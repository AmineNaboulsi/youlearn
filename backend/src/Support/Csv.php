<?php

declare(strict_types=1);

namespace App\Support;

/**
 * CSV writer that is safe to hand to a spreadsheet.
 *
 * The interesting part is neutralise(): a cell beginning with =, +, -, @ or a
 * control character is interpreted as a *formula* by Excel, LibreOffice and
 * Google Sheets. Since course titles and user-supplied names end up in these
 * exports, an attacker could otherwise enrol with the display name
 * `=cmd|'/c calc'!A1` and have it execute on the machine of whoever opens the
 * export. Prefixing with a single quote makes the cell literal text.
 */
final class Csv
{
    private const FORMULA_TRIGGERS = ['=', '+', '-', '@', "\t", "\r", "\n"];

    /**
     * @param list<string>              $headers
     * @param iterable<array<int, mixed>> $rows
     */
    public static function build(array $headers, iterable $rows): string
    {
        $handle = fopen('php://temp', 'r+');
        if ($handle === false) {
            throw new \RuntimeException('Could not open a temporary stream for the export.');
        }

        fputcsv($handle, array_map([self::class, 'neutralise'], $headers), ',', '"', '');

        foreach ($rows as $row) {
            fputcsv($handle, array_map([self::class, 'neutralise'], $row), ',', '"', '');
        }

        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);

        return $csv === false ? '' : $csv;
    }

    private static function neutralise(mixed $value): string
    {
        if ($value === null) {
            return '';
        }
        if (\is_bool($value)) {
            return $value ? 'yes' : 'no';
        }

        $text = (string) $value;
        if ($text === '') {
            return '';
        }

        if (\in_array($text[0], self::FORMULA_TRIGGERS, true)) {
            return "'" . $text;
        }

        return $text;
    }
}
