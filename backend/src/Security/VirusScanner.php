<?php

declare(strict_types=1);

namespace App\Security;

use App\Http\HttpException;
use App\Support\Env;

/**
 * Malware scanning for uploaded files, via clamd.
 *
 * Every byte that arrives from a browser is scanned before it is moved into
 * permanent storage. Content sniffing already refuses anything that is not a
 * real image or video, but "is a valid MP4" and "is safe to hand to the next
 * person who downloads it" are different questions: a polyglot file can be a
 * structurally valid image *and* a payload, and this platform's whole purpose
 * is redistributing instructor uploads to learners.
 *
 * ## Why the file path and not INSTREAM
 *
 * clamd accepts bytes over the socket (INSTREAM), but that path is capped by
 * clamd's StreamMaxLength — 25 MB by default — and a lecture recording here may
 * be four gigabytes. Raising the cap only moves the cost: every byte would be
 * copied through a socket and written to a second temp file before scanning.
 *
 * Instead clamd shares the storage volume read-only and is handed a path. There
 * is no size ceiling, no copy, and the scan reads the file the uploader already
 * wrote. The requirement this creates is that the path must mean the same thing
 * in both containers — see the clamav service in docker-compose.prod.yml, which
 * mounts storage-data at the identical mount point.
 *
 * ## Failure is refusal
 *
 * If clamd is enabled but unreachable, uploads are refused rather than waved
 * through. An unavailable scanner is exactly when malware gets uploaded, so the
 * safe default is the one that costs an instructor a retry.
 */
final class VirusScanner
{
    /** clamd caps a single command at 4096 bytes; paths are far shorter. */
    private const MAX_PATH = 4000;

    private function __construct(
        private readonly bool $enabled,
        private readonly string $host,
        private readonly int $port,
        private readonly int $timeoutSeconds,
    ) {
    }

    public static function fromEnv(): self
    {
        $enabled = filter_var(
            Env::get('CLAMAV_ENABLED', 'true'),
            FILTER_VALIDATE_BOOL,
            FILTER_NULL_ON_FAILURE,
        ) ?? true;

        return new self(
            $enabled,
            Env::get('CLAMAV_HOST', 'clamav') ?? 'clamav',
            (int) (Env::get('CLAMAV_PORT', '3310') ?? '3310'),
            // Generous: a multi-gigabyte video legitimately takes minutes, and
            // a timeout here is indistinguishable to the user from a refusal.
            max(5, (int) (Env::get('CLAMAV_TIMEOUT', '600') ?? '600')),
        );
    }

    public function isEnabled(): bool
    {
        return $this->enabled;
    }

    /**
     * Scan a file, throwing if it is infected or cannot be scanned.
     *
     * @throws HttpException 422 when clamd reports a signature match.
     * @throws HttpException 503 when scanning is enabled but did not complete.
     */
    public function assertClean(string $absolutePath): void
    {
        if (!$this->enabled) {
            return;
        }

        if (strlen($absolutePath) > self::MAX_PATH) {
            throw new HttpException(500, 'scan_failed', 'The file could not be scanned.');
        }

        $verdict = $this->scan($absolutePath);

        if ($verdict['infected']) {
            throw new HttpException(
                422,
                'infected_file',
                'That file was rejected because it failed a malware scan.',
                // The signature name is deliberately not returned: it tells an
                // attacker which detection they tripped, which is a free
                // oracle for tuning a payload until it passes.
                []
            );
        }
    }

    /**
     * @return array{infected: bool, signature: ?string}
     */
    private function scan(string $absolutePath): array
    {
        $socket = @fsockopen($this->host, $this->port, $errorCode, $errorMessage, 10.0);

        if ($socket === false) {
            throw new HttpException(
                503,
                'scanner_unavailable',
                'Uploads are temporarily unavailable because the malware scanner cannot be reached.',
            );
        }

        try {
            stream_set_timeout($socket, $this->timeoutSeconds);

            // The z-prefixed form is null-terminated, which is the only variant
            // that is unambiguous when a path contains whitespace.
            if (@fwrite($socket, "zSCAN " . $absolutePath . "\0") === false) {
                throw new HttpException(503, 'scanner_unavailable', 'The malware scanner did not accept the request.');
            }

            $response = '';
            while (!feof($socket)) {
                $piece = fread($socket, 4096);
                if ($piece === false || $piece === '') {
                    break;
                }
                $response .= $piece;
            }

            $meta = stream_get_meta_data($socket);
            if (!empty($meta['timed_out'])) {
                throw new HttpException(503, 'scan_timeout', 'The file could not be scanned in time. Try again.');
            }
        } finally {
            @fclose($socket);
        }

        $response = trim(str_replace("\0", '', $response));

        // "<path>: OK" | "<path>: <signature> FOUND" | "<path>: <reason> ERROR"
        if (str_ends_with($response, 'OK')) {
            return ['infected' => false, 'signature' => null];
        }

        if (str_ends_with($response, 'FOUND')) {
            $signature = trim(substr($response, (int) strrpos($response, ':') + 1));
            $signature = trim(preg_replace('/\s+FOUND$/', '', $signature) ?? '');

            return ['infected' => true, 'signature' => $signature !== '' ? $signature : 'unknown'];
        }

        // Anything else — including "Access denied" when the volume is not
        // mounted into the clamav container — is a failure to scan, not a pass.
        throw new HttpException(
            503,
            'scan_failed',
            'The file could not be scanned. Try again in a moment.',
        );
    }
}
