# syntax=docker/dockerfile:1.7
# =============================================================================
# ClamAV, built for arm64.
#
# The official clamav/clamav image publishes linux/amd64 only — every tag,
# including latest and 1.5. This platform runs on Ampere A1, so that image can
# never start here, and mirroring it would fail the same way. Debian ships
# clamav-daemon for arm64, so building against it is both simpler and less
# supply chain than adopting a third-party rebuild.
#
#   docker build -f docker/clamav/Dockerfile --platform linux/arm64 .
#
# The signature database is NOT baked in. It is roughly 250 MB, it changes
# several times a day, and an image carrying a stale copy would be worse than
# useless — it would look like protection. It lives on a volume instead, and
# freshclam keeps it current.
# =============================================================================

FROM debian:bookworm-slim

# clamav-daemon pulls clamav-base, which creates the clamav user and group.
# --no-install-recommends keeps out the milter and the documentation, which are
# most of the size and none of the use.
RUN apt-get update \
 && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
      clamav-daemon \
      clamav-freshclam \
      ca-certificates \
 && rm -rf /var/lib/apt/lists/* \
 # Debian ships its own configuration and a systemd-managed database directory;
 # both are replaced below. Removing the packaged conf files makes it obvious
 # which one is in effect.
 && rm -f /etc/clamav/clamd.conf /etc/clamav/freshclam.conf

COPY docker/clamav/clamd.conf     /etc/clamav/clamd.conf
COPY docker/clamav/freshclam.conf /etc/clamav/freshclam.conf
COPY docker/clamav/entrypoint.sh  /usr/local/bin/entrypoint.sh

# Our own test signature. The entrypoint installs it into the database
# directory, so a self-test works on a fresh volume too.
COPY docker/clamav/youlearn-selftest.ndb /usr/local/share/youlearn/youlearn-selftest.ndb

RUN chmod 0755 /usr/local/bin/entrypoint.sh \
 && mkdir -p /var/lib/clamav /run/clamav \
 && chown -R clamav:clamav /var/lib/clamav /run/clamav

# Signature database. Losing this volume costs a 250 MB re-download, not data.
VOLUME ["/var/lib/clamav"]

# Never published. The API reaches this over the compose network only.
EXPOSE 3310

# clamd's own PING/PONG, over the socket the API will use — so a pass here
# means the thing the API depends on is actually answering, not merely that a
# process exists. Long start period: the first run downloads the database
# before clamd binds at all.
HEALTHCHECK --interval=30s --timeout=10s --start-period=300s --retries=10 \
  CMD bash -c 'exec 3<>/dev/tcp/127.0.0.1/3310 && printf "zPING\0" >&3 && head -c 4 <&3 | grep -q PONG'

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
