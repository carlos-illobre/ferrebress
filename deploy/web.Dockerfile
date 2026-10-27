# syntax=docker/dockerfile:1
# El Caddy de Ferrebress con la aplicación adentro (ADR-011). Se construye desde la raíz.
FROM caddy:2.11-alpine
COPY deploy/Caddyfile /etc/caddy/Caddyfile
COPY deploy/empty-app /srv
EXPOSE 80
