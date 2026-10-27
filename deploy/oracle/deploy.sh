#!/usr/bin/env bash
#
# Despliega desde la máquina (ADR-014): le pregunta a GitHub el último commit de main, baja su
# compose, fija las imágenes por su huella, levanta y comprueba la salud; si no queda sano,
# vuelve a lo que corría. Lo dispara listen.sh con cada aviso, o una persona a mano:
#
#   ~/ferrebress/deploy.sh            # lo último de main
#   ~/ferrebress/deploy.sh <sha>      # un commit concreto, o volver atrás
#
# Corre con el usuario ferrebress, sin privilegios. Un aviso falso solo provoca esta consulta.
set -euo pipefail

REPO=carlos-illobre/ferrebress
BRANCH=main
DIR="${FERREBRESS_DIR:-$HOME/ferrebress}"
ENV_FILE="$DIR/.env"
HEALTH_URL="http://127.0.0.1:$(sed -n 's/^WEB_PORT=//p' "$ENV_FILE")/api/health"

say() { printf '%s %s\n' "$(date -u +%FT%TZ)" "$1"; }

# Como mucho una vez por minuto: un aviso repetido no gasta las consultas a GitHub.
exec 9>"$DIR/.deploy.lock"
flock -n 9 || { say "ya hay un despliegue en curso"; exit 0; }
last="$DIR/.deploy.last"
if [ -z "${1:-}" ] && [ -f "$last" ] && [ $(($(date +%s) - $(cat "$last"))) -lt 60 ]; then
    say "hubo uno hace menos de un minuto"; exit 0
fi
date +%s > "$last"

# La base de ciudades (diseño de 01, § 8): una vez por mes, por HTTPS, y solo reemplaza la
# anterior si lo que bajó es una base de verdad (tamaño y marca del formato).
update_cities() {
    local month tmp
    month=$(date -u +%Y-%m)
    [ "$(cat "$DIR/geo/.month" 2>/dev/null)" != "$month" ] || return 1
    mkdir -p "$DIR/geo"
    tmp=$(mktemp -d)
    if curl -sfL "https://download.db-ip.com/free/dbip-city-lite-$month.mmdb.gz" -o "$tmp/city.mmdb.gz" \
        && gunzip "$tmp/city.mmdb.gz" && [ "$(stat -c %s "$tmp/city.mmdb")" -gt 50000000 ] \
        && grep -qa 'MaxMind.com' "$tmp/city.mmdb"; then
        mv "$tmp/city.mmdb" "$DIR/geo/city.mmdb"
        echo "$month" > "$DIR/geo/.month"
        say "base de ciudades de $month"
        rm -rf "$tmp"
        return 0
    fi
    say "no pude bajar la base de ciudades de $month; sigue la anterior"
    rm -rf "$tmp"
    return 1
}
# El servidor lee la base al arrancar: con una nueva, se reinicia aunque no haya versión nueva.
if update_cities && [ -n "$(cd "$DIR" && docker compose ps -q server 2>/dev/null)" ]; then
    (cd "$DIR" && docker compose restart server >/dev/null) || true
fi

sha=${1:-$(git ls-remote "https://github.com/$REPO.git" "refs/heads/$BRANCH" | cut -f1)}
[ -n "$sha" ] || { say "no pude consultar $BRANCH en GitHub"; exit 1; }

set_env() { sed -i "/^$1=/d" "$ENV_FILE" && printf '%s=%s\n' "$1" "$2" >> "$ENV_FILE"; }
digest_of() { docker buildx imagetools inspect "$1" --format '{{json .Manifest.Digest}}' 2>/dev/null | tr -d '"'; }
running_version() { curl -sf "$HEALTH_URL" | sed -n 's/.*"version":"\([^"]*\)".*/\1/p'; }

current=$(running_version || true)
[ "$current" != "$sha" ] || { say "ya corre $sha"; exit 0; }

web=$(digest_of "ghcr.io/$REPO-web:$sha" || true)
server=$(digest_of "ghcr.io/$REPO-server:$sha" || true)
if [ -z "$web" ] || [ -z "$server" ]; then
    # Puede ser que la CI todavía no las publicó; si no, el error dice por qué no se pudo leer.
    say "no pude leer las imágenes de $sha en GHCR: $(docker buildx imagetools inspect "ghcr.io/$REPO-server:$sha" 2>&1 | tail -1)"
    exit 0
fi

cp "$ENV_FILE" "$ENV_FILE.previous"
cp "$DIR/compose.yml" "$DIR/compose.yml.previous" 2>/dev/null || true
curl -sfo "$DIR/compose.yml" "https://raw.githubusercontent.com/$REPO/$sha/deploy/compose.yml"
set_env WEB_IMAGE "ghcr.io/$REPO-web@$web"
set_env SERVER_IMAGE "ghcr.io/$REPO-server@$server"

healthy() {
    for _ in $(seq 1 30); do [ "$(running_version || true)" = "$1" ] && return 0; sleep 4; done
    return 1
}

cd "$DIR"
if docker compose pull --quiet && docker compose up -d --remove-orphans && healthy "$sha"; then
    say "corre $sha (antes: ${current:-nada})"
    docker image prune -af --filter until=24h >/dev/null
    exit 0
fi

say "$sha no quedó sano; vuelvo a ${current:-nada}"
docker compose logs --tail 40 || true
mv "$ENV_FILE.previous" "$ENV_FILE"
[ -f compose.yml.previous ] && mv compose.yml.previous compose.yml
[ -z "$current" ] || { docker compose up -d --remove-orphans && healthy "$current"; } || say "tampoco quedó sano"
exit 1
