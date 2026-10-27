#!/usr/bin/env bash
#
# Instala Ferrebress en la VM de Oracle, o lo pone al día si ya está (ADR-014): el usuario sin
# privilegios con su Docker, los scripts de despliegue, el .env, el servicio que escucha los
# avisos y el sitio en el proxy de la máquina. Se puede volver a correr: no pisa lo que ya está
# configurado (el .env y su contraseña quedan como estaban).
#
# Lo corre un administrador con sudo, desde una copia del repositorio:
#
#   GOOGLE_CLIENT_ID=... ADMIN_EMAIL=... NTFY_TOPIC=... bash deploy/oracle/install.sh
set -euo pipefail

USER_NAME=ferrebress
DOMAIN=ferrebress-pruebas.duckdns.org
HERE=$(cd "$(dirname "$0")" && pwd)

step() { printf '\n\033[1m▶ %s\033[0m\n' "$1"; }
ok() { printf '  \033[0;32m✓\033[0m %s\n' "$1"; }
fail() { printf '  \033[0;31m✗ %s\033[0m\n' "$1" >&2; exit 1; }

[ "$(id -u)" -ne 0 ] || fail "correr con un usuario administrador, no como root (usa sudo adentro)"
: "${GOOGLE_CLIENT_ID:?falta GOOGLE_CLIENT_ID}" "${ADMIN_EMAIL:?falta ADMIN_EMAIL}" "${NTFY_TOPIC:?falta NTFY_TOPIC}"
for tool in dockerd-rootless-setuptool.sh caddy curl openssl; do
    command -v "$tool" >/dev/null || fail "falta $tool en la máquina"
done
sudo -v

# Lo que corre como el usuario de Ferrebress, con su systemd y su Docker. El script va por la
# entrada estándar (bash -s): `sudo -i` rompe los comandos de varias líneas.
as_user() {
    local uid home; uid=$(id -u "$USER_NAME"); home=$(getent passwd "$USER_NAME" | cut -d: -f6)
    sudo -u "$USER_NAME" env HOME="$home" XDG_RUNTIME_DIR="/run/user/$uid" \
        DBUS_SESSION_BUS_ADDRESS="unix:path=/run/user/$uid/bus" \
        DOCKER_HOST="unix:///run/user/$uid/docker.sock" PATH="$home/bin:/usr/local/bin:/usr/bin:/bin" \
        "$@" bash -s
}

step "El usuario $USER_NAME"
id "$USER_NAME" >/dev/null 2>&1 || sudo useradd --create-home --shell /bin/bash "$USER_NAME"
sudo loginctl enable-linger "$USER_NAME"
grep -q "^$USER_NAME:" /etc/subuid && grep -q "^$USER_NAME:" /etc/subgid \
    || fail "$USER_NAME no tiene rango en /etc/subuid o /etc/subgid"
for _ in $(seq 1 10); do [ -S "/run/user/$(id -u "$USER_NAME")/bus" ] && break; sleep 1; done
ok "existe, con linger y sus rangos"

step "Su Docker sin privilegios"
as_user <<'FIN'
set -euo pipefail
cd ~
if ! docker info >/dev/null 2>&1 </dev/null; then
    dockerd-rootless-setuptool.sh install </dev/null >/dev/null
fi
docker info >/dev/null </dev/null
docker buildx version >/dev/null </dev/null
FIN
ok "anda, con buildx"

step "Los scripts, el compose y el servicio"
home=$(getent passwd "$USER_NAME" | cut -d: -f6)
sudo install -d -o "$USER_NAME" -m 700 "$home/ferrebress"
sudo install -d -o "$USER_NAME" "$home/.config" "$home/.config/systemd" "$home/.config/systemd/user"
sudo install -o "$USER_NAME" -m 755 "$HERE/deploy.sh" "$HERE/listen.sh" "$home/ferrebress/"
sudo install -o "$USER_NAME" -m 644 "$HERE/../compose.yml" "$home/ferrebress/"
sudo install -o "$USER_NAME" -m 644 "$HERE/ferrebress-deploy.service" "$home/.config/systemd/user/"
ok "copiados"

step "La configuración"
# Parte del .env que haya (o de .env.example) y completa solo lo que sigue sin valor (<…>): lo
# ya configurado no se pisa. La contraseña de la base se genera acá y no se muestra.
env_file="$home/ferrebress/.env"
current=$(sudo cat "$env_file" 2>/dev/null || cat "$HERE/../../.env.example")
unset_value() { grep -q "^$1=.*<" <<<"$current"; }
fill() { unset_value "$1" && current=$(sed "s|^$1=.*|$1=$2|" <<<"$current") || true; }
if unset_value POSTGRES_PASSWORD; then
    password=$(openssl rand -hex 24)
    fill POSTGRES_PASSWORD "$password"
    # La contraseña es la recién generada, no una escrita acá.
    fill DATABASE_URL "postgres://ferrebress:$password@db/ferrebress" # secretlint-disable-line
fi
fill GOOGLE_CLIENT_ID "$GOOGLE_CLIENT_ID"
fill INITIAL_ADMIN_EMAIL "$ADMIN_EMAIL"
# La base de ciudades ya no se usa: se saca lo que haya dejado una instalación anterior.
current=$(grep -v -e '^GEO_DIR=' -e '^# La base de ciudades' <<<"$current")
sudo rm -rf "$home/ferrebress/geo"
grep -q '<' <<<"$current" && fail "el .env tiene valores sin completar (<…>)"
printf '%s\n' "$current" | sudo install -o "$USER_NAME" -m 600 /dev/stdin "$env_file"
printf 'NTFY_TOPIC=%s\n' "$NTFY_TOPIC" | sudo install -o "$USER_NAME" -m 600 /dev/stdin "$home/ferrebress/deploy.env"
ok ".env y deploy.env al día, con permisos 600"

step "El servicio de despliegue"
as_user <<'FIN'
set -euo pipefail
systemctl --user daemon-reload </dev/null
systemctl --user enable ferrebress-deploy.service </dev/null >/dev/null 2>&1
systemctl --user restart ferrebress-deploy.service </dev/null
systemctl --user is-active --quiet ferrebress-deploy.service </dev/null
FIN
ok "corriendo"

step "El sitio en el proxy de la máquina"
sudo install -m 644 "$HERE/machine-proxy/ferrebress.caddy" /etc/caddy/sitios/ferrebress.caddy
sudo caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null 2>&1 \
    || fail "la configuración de Caddy no valida; no se recargó"
sudo systemctl reload caddy
ok "instalado y Caddy recargado"

step "Comprobación (puede tardar unos minutos: baja las imágenes)"
for _ in $(seq 1 60); do
    health=$(curl -sf "https://$DOMAIN/api/health" || true)
    [ -n "$health" ] && break
    sleep 5
done
[ -n "$health" ] || fail "https://$DOMAIN/api/health no responde; mirá: sudo -u $USER_NAME journalctl --user -u ferrebress-deploy"
ok "https://$DOMAIN/api/health → $health"
headers=$(curl -sI "https://$DOMAIN/")
grep -qi '^content-security-policy:' <<<"$headers" && grep -qi '^strict-transport-security:' <<<"$headers" \
    || fail "faltan las cabeceras de seguridad en https://$DOMAIN/"
ok "cabeceras de seguridad presentes"

cat <<FIN

Listo. Si es la primera vez, anotá la fila de Ferrebress en /etc/caddy/sitios/README.md
($DOMAIN → 127.0.0.1:8090, usuario $USER_NAME).
FIN
