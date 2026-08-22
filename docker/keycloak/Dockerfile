# =============================================================================
# YouLearn Keycloak — deployable image
#
# Differs from the compose setup in three ways that matter for a registry push:
#
#   1. The theme is COPIED IN, not bind-mounted. A pulled image has no host
#      directory behind it, so a mounted theme would simply be absent and every
#      login page would fall back to stock Keycloak.
#   2. It runs `kc.sh build`, which bakes the database provider and feature set
#      into the image. Startup then skips the build step entirely — the
#      difference between a container that is serving in seconds and one that
#      re-augments itself on every boot.
#   3. It runs in production mode, not start-dev: HTTPS required, hostname
#      checked, theme caching on.
#
# Build from the repository root:
#   docker build -f docker/keycloak/Dockerfile -t youlearn-keycloak .
# =============================================================================

ARG KEYCLOAK_VERSION=26.4

# --- build stage -------------------------------------------------------------
FROM quay.io/keycloak/keycloak:${KEYCLOAK_VERSION} AS builder

# Build-time options. These are frozen into the image, which is what lets the
# runtime stage use --optimized.
ENV KC_DB=postgres
ENV KC_HEALTH_ENABLED=true
ENV KC_METRICS_ENABLED=true

# The theme has to be present before `kc.sh build` so it is indexed.
COPY keycloak/themes/youlearn /opt/keycloak/themes/youlearn

RUN /opt/keycloak/bin/kc.sh build

# --- runtime stage -----------------------------------------------------------
FROM quay.io/keycloak/keycloak:${KEYCLOAK_VERSION}

COPY --from=builder /opt/keycloak/ /opt/keycloak/

# The realm imported here must be the *sanitised* one produced by
# scripts/make-prod-realm.mjs — no seeded passwords, no client secrets. The
# build fails below if that file is missing, rather than silently shipping the
# development realm.
ARG REALM_DIR=keycloak/realm-prod
COPY ${REALM_DIR}/ /opt/keycloak/data/import/

# A last guard against pushing credentials to a registry. `docker history` would
# expose them even if a later layer deleted the file, so the check happens here.
RUN set -eu; \
    if ! ls /opt/keycloak/data/import/*.json >/dev/null 2>&1; then \
        echo "ERROR: no realm file found in ${REALM_DIR}."; \
        echo "Run: node scripts/make-prod-realm.mjs --web-origin https://your.domain"; \
        exit 1; \
    fi; \
    if grep -qE '"secret"|Admin#2026pass|Teacher#2026pass|Student#2026pass' /opt/keycloak/data/import/*.json; then \
        echo "ERROR: the realm file still contains client secrets or seeded passwords."; \
        echo "Regenerate it with scripts/make-prod-realm.mjs before building."; \
        exit 1; \
    fi

# Everything below is supplied at run time, never baked in:
#   KC_DB_URL, KC_DB_USERNAME, KC_DB_PASSWORD
#   KC_HOSTNAME               https://auth.your-domain
#   KC_BOOTSTRAP_ADMIN_USERNAME / _PASSWORD   (first boot only — then delete)
#   KC_PROXY_HEADERS=xforwarded               (when behind a load balancer)
ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]

# --import-realm is a no-op once the realm exists, so this is safe on restart.
CMD ["start", "--optimized", "--import-realm"]
