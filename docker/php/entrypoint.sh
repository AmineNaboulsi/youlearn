#!/bin/sh
set -e

# The bind mount hides the image's vendor/ dir. Restore it, then regenerate the
# autoloader against the mounted source so new classes are picked up.
if [ ! -d /var/www/html/vendor ]; then
  cp -R /opt/vendor/vendor /var/www/html/vendor
fi
composer dump-autoload --no-dev --optimize --no-interaction 2>/dev/null || true

mkdir -p /var/www/html/var/cache
chown -R www-data:www-data /var/www/html/var

# Upload storage lives outside the web root and is a named volume, so its
# ownership has to be set on every boot rather than baked into the image.
mkdir -p "${STORAGE_ROOT:-/var/www/storage}/tmp"
chown -R www-data:www-data "${STORAGE_ROOT:-/var/www/storage}"
chmod 750 "${STORAGE_ROOT:-/var/www/storage}"

exec "$@"
