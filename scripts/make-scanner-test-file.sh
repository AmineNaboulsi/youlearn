#!/usr/bin/env bash
#
# Build a file the malware scanner must reject, to prove uploads are scanned.
#
# ## Why this exists rather than "just use EICAR"
#
# EICAR is the only universally recognised test signature, and ClamAV detects
# it only when the file IS the EICAR file — the 68-byte string, optionally
# followed by whitespace. Embedding it inside a JPEG does not trigger anything;
# that is the standard's design, not a ClamAV limitation.
#
# And a bare EICAR file is text/plain, which this platform's content sniffer
# refuses as an unsupported type *before* the scanner is consulted. So it can
# never reach clamd through an upload, and a rejection would prove only that
# type checking works.
#
# The clamav image therefore ships a signature for a marker of our own
# (docker/clamav/youlearn-selftest.ndb). This writes a real JPEG containing
# that marker: it sniffs as image/jpeg, passes the type check, reaches clamd,
# and is refused as YouLearn.SelfTest.Marker.
#
# ## Using it
#
#   ./scripts/make-scanner-test-file.sh
#   # then upload scanner-test.jpg as a course cover
#
# Expected: the upload is refused with "Malware scan failed." and the API
# returns {"error":"infected_file"}.
#
# If it uploads successfully, uploads are NOT being scanned. Do not treat a
# successful upload of an ordinary file as evidence either way — a scanner that
# is switched off looks exactly like one that finds nothing.

set -euo pipefail

OUT="${1:-scanner-test.jpg}"
MARKER='YOULEARN-SCANNER-SELFTEST-DO-NOT-REMOVE'

# A minimal but genuinely valid JPEG: SOI, a JFIF APP0 segment, then EOI.
# finfo identifies it from these bytes, which is the whole point — the file has
# to survive content sniffing to reach the scanner at all.
printf '\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00' > "$OUT"
printf '%s' "$MARKER" >> "$OUT"
printf '\xff\xd9' >> "$OUT"

if ! grep -qF -- "$MARKER" "$OUT"; then
  echo "error: the marker did not survive into $OUT" >&2
  echo "       run this with bash, not sh — dash's printf does not do \\xNN escapes" >&2
  exit 1
fi

echo "wrote $OUT ($(wc -c < "$OUT") bytes)"
echo
echo "Upload it as a course cover. Expected result:"
echo "  refused, with \"Malware scan failed.\" and error \"infected_file\""
echo
echo "If it uploads cleanly, uploads are not being scanned."
