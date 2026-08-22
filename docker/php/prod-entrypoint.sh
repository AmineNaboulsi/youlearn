#!/bin/sh
#
# Production entrypoint.
#
# Exists for one reason: /var/www/storage is a named volume, and Docker seeds
# permissions from the image only when that volume is EMPTY. Every mode set in
# the Dockerfile is therefore ignored on any host that has already taken an
# upload — which is every host that matters.
#
# The dev image had an entrypoint doing this; the prod image had none, so the
# fix landed only where it was not needed. That gap cost a production outage
# where every upload failed with "The file could not be scanned".

set -e

STORAGE="${STORAGE_ROOT:-/var/www/storage}"

mkdir -p "$STORAGE/tmp"

# Not recursive, deliberately. A platform's whole video library lives under
# here, and walking it on every container start would add minutes to a deploy
# to re-set modes that are already correct. Only the two directories that must
# be traversable are touched.
chown www-data:www-data "$STORAGE" "$STORAGE/tmp"

# 0755, not 0750: clamd scans by path from its own container as the clamav
# user. Without the execute bit it cannot traverse in, replies "Access denied",
# and the API refuses the upload rather than storing it unscanned. Files keep
# their own modes — 0640 stored, 0644 in flight — so only traversal is opened.
chmod 755 "$STORAGE" "$STORAGE/tmp"

exec "$@"
