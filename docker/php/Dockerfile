# =============================================================================
# YouLearn API — PHP 8.3 on Apache
#
# Two targets from one file, so the image you push and the image you develop
# against cannot drift apart:
#
#   --target dev   source is bind-mounted from the host (docker compose)
#   --target prod  source is COPIED IN, so a pulled image actually runs
#
# The prod target is the one to push to a registry. A registry image built from
# the dev target would contain no application code at all — the bind mount that
# supplies it does not exist on the far side of a `docker pull`.
#
# Build from the repository root:
#   docker build -f docker/php/Dockerfile --target prod -t youlearn-api .
# =============================================================================

# --- shared base -------------------------------------------------------------
FROM php:8.3-apache AS base

# `unzip` is the binary Composer shells out to for --prefer-dist. The PHP `zip`
# extension is deliberately absent: building it needs libzip-dev, and purging
# that afterwards takes the runtime library with it — leaving an extension that
# fails to load on every single request.
RUN apt-get update \
    && apt-get install -y --no-install-recommends unzip git \
    && docker-php-ext-install pdo pdo_mysql \
    && docker-php-ext-enable opcache \
    && rm -rf /var/lib/apt/lists/* \
    # zzz- so it sorts AFTER Debian's own security.conf in conf-enabled, which
    # sets `ServerTokens OS` and would otherwise win and re-advertise the version.
    && a2enmod rewrite headers \
    && printf 'ServerTokens Prod\nServerSignature Off\nTraceEnable Off\n' > /etc/apache2/conf-available/zzz-hardening.conf \
    && a2enconf zzz-hardening

# Every request is routed through index.php; no directory listings, no dotfiles.
RUN printf '%s\n' \
  '<Directory /var/www/html>' \
  '    Options -Indexes -MultiViews +FollowSymLinks' \
  '    AllowOverride All' \
  '    Require all granted' \
  '    RewriteEngine On' \
  '    RewriteCond %{REQUEST_FILENAME} !-f' \
  '    RewriteRule ^ index.php [QSA,L]' \
  '    # mod_php does not expose Authorization by default; the API needs it.' \
  '    RewriteCond %{HTTP:Authorization} ^(.+)$' \
  '    RewriteRule ^ - [E=HTTP_AUTHORIZATION:%1]' \
  '</Directory>' \
  '<FilesMatch "^\.|composer\.(json|lock)$|\.sql$|\.md$">' \
  '    Require all denied' \
  '</FilesMatch>' \
  > /etc/apache2/conf-available/youlearn.conf \
  && a2enconf youlearn

WORKDIR /var/www/html

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# --- dependency stage --------------------------------------------------------
# Split from the source copy so a code change does not re-resolve every package.
FROM base AS vendor

COPY backend/composer.json backend/composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction

# --- development target ------------------------------------------------------
# The compose file mounts ./backend over /var/www/html, which hides the image's
# vendor/. A pristine copy is kept outside the mount point and restored on boot.
FROM vendor AS dev

RUN mkdir -p /opt/vendor && cp -R vendor /opt/vendor/vendor

COPY docker/php/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
CMD ["apache2-foreground"]

# --- production target -------------------------------------------------------
FROM vendor AS prod

# .dockerignore keeps .env, var/, Diagrames/ and the SQL seeds out of this copy.
COPY backend/ ./

# Classmap-authoritative: no filesystem probing for a class that does not exist.
RUN composer dump-autoload --no-dev --optimize --classmap-authoritative --no-interaction

# opcache settings appropriate for an image whose code never changes at runtime.
RUN { \
      echo 'opcache.enable=1'; \
      echo 'opcache.memory_consumption=128'; \
      echo 'opcache.max_accelerated_files=10000'; \
      echo 'opcache.validate_timestamps=0'; \
      echo 'opcache.enable_cli=0'; \
    } > /usr/local/etc/php/conf.d/opcache.ini \
 && { \
      echo 'expose_php=Off'; \
      echo 'display_errors=Off'; \
      echo 'log_errors=On'; \
      echo 'error_log=/dev/stderr'; \
      # Must exceed FileStore::CHUNK_SIZE (5 MiB). An upload chunk arrives as a
      # raw PATCH body, and a ceiling below the chunk size makes every video
      # upload fail at the first piece.
      echo 'post_max_size=8M'; \
      # No endpoint reads $_FILES — uploads are streamed from php://input — so
      # this stays small deliberately.
      echo 'upload_max_filesize=2M'; \
      # Streaming a chunk in or a large video out can legitimately outlast the
      # default; Apache still caps the connection.
      echo 'max_execution_time=120'; \
      echo 'memory_limit=192M'; \
    } > /usr/local/etc/php/conf.d/youlearn.ini

# Two writable locations, and only two:
#   var/cache          the realm's JWKS, refreshed on a TTL
#   /var/www/storage   uploaded covers and lesson videos
#
# The storage root is created here so the first upload does not have to mkdir
# inside a root-owned /var/www. It sits OUTSIDE the web root on purpose —
# Apache serves /var/www/html, so nothing under it has a URL of its own.
RUN mkdir -p /var/www/html/var/cache /var/www/storage/tmp \
 && chown -R www-data:www-data /var/www/html/var /var/www/storage \
 && chmod 755 /var/www/storage /var/www/storage/tmp \
 && chmod -R 555 /var/www/html/src /var/www/html/index.php

# Mount a volume here, or uploaded videos vanish on the next deploy.
VOLUME ["/var/www/storage"]

# Configuration is supplied as environment variables at run time; the image
# contains no .env file and no credential of any kind.
ENV APP_ENV=production
ENV STORAGE_ROOT=/var/www/storage

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD php -r 'exit(@file_get_contents("http://127.0.0.1/health") ? 0 : 1);'

COPY docker/php/prod-entrypoint.sh /usr/local/bin/prod-entrypoint.sh
RUN chmod 0755 /usr/local/bin/prod-entrypoint.sh

# Fixes the storage volume's modes on every boot. The Dockerfile's own chmod
# above only applies when the volume is empty, so on any host that has already
# accepted an upload it is the entrypoint or nothing.
ENTRYPOINT ["/usr/local/bin/prod-entrypoint.sh"]
CMD ["apache2-foreground"]
