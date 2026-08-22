#!/bin/bash
#
# Start freshclam and clamd together.
#
# Debian runs these as two services; a container wants one process tree. clamd
# refuses to start without a signature database, so the first run downloads it
# synchronously — roughly 250 MB, several minutes — and only then does clamd
# come up and the healthcheck begin to pass. The database lives on a volume, so
# this happens once rather than on every restart.

set -euo pipefail

DB=/var/lib/clamav

# The volume starts empty and root-owned; both daemons drop to the clamav user.
mkdir -p "$DB"
chown -R clamav:clamav "$DB"

if ! compgen -G "$DB/*.c[vl]d" > /dev/null; then
  echo "clamav: no signature database yet — downloading (this takes a few minutes)"
  # Not fatal on failure: clamd's own startup check below is what decides
  # whether this container can serve, and a partial mirror failure may still
  # have left a usable database from a previous run.
  freshclam --config-file=/etc/clamav/freshclam.conf --stdout || true
fi

if ! compgen -G "$DB/*.c[vl]d" > /dev/null; then
  echo "clamav: signature download failed and no database is present — refusing to start" >&2
  echo "clamav: uploads will be refused until this container is healthy, which is the intended behaviour" >&2
  exit 1
fi

# Keep definitions current in the background. Killed with the container.
freshclam --config-file=/etc/clamav/freshclam.conf --daemon --stdout &

# PID 1, so signals and exit status belong to clamd.
exec clamd --config-file=/etc/clamav/clamd.conf
