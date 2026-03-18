#!/bin/sh
set -e

echo "[entrypoint] Generating Nginx config from template..."

# Generate nginx site config with env var substitution
envsubst '${CRM_API_URL} ${VITE_API_BASE} ${VITE_INTERNAL_PORT}' \
  < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf

echo "[entrypoint] Generated /etc/nginx/conf.d/default.conf:"
cat /etc/nginx/conf.d/default.conf

echo "[entrypoint] Starting Nginx..."
exec nginx -g 'daemon off;'
