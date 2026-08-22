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

# 0755 on the DIRECTORIES, not 0750.
#
# clamd scans by path from its own container, running as the clamav user. With
# 0750 it has no execute bit here, cannot traverse into the directory, and
# replies "Access denied" — which this API correctly treats as a failed scan
# and refuses the upload. The symptom is every upload failing with
# "The file could not be scanned", pointing nowhere near a permission bit.
#
# Only traversal is opened up. Files keep their own modes: 0640 for stored
# assets, 0644 for in-flight temp files, which is what clamd actually reads.
chmod 755 "${STORAGE_ROOT:-/var/www/storage}"
chmod 755 "${STORAGE_ROOT:-/var/www/storage}/tmp"

exec "$@"
