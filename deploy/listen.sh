#!/usr/bin/env bash
#
# Escucha el canal de avisos de ntfy con una sola conexión saliente y, por cada aviso, corre
# deploy.sh (ADR-014). El aviso no trae nada: la máquina siempre le pregunta a GitHub. Al
# arrancar hace una verificación, por si se perdió un aviso. Lo corre systemd como servicio
# de usuario (ferrebress-deploy.service).
set -uo pipefail

DIR="${FERREBRESS_DIR:-$HOME/ferrebress}"
NTFY_TOPIC=$(sed -n 's/^NTFY_TOPIC=//p' "$DIR/deploy.env")
[ -n "$NTFY_TOPIC" ] || { echo "falta NTFY_TOPIC en $DIR/deploy.env"; exit 1; }

"$DIR/deploy.sh" || true
while true; do
    # /raw entrega una línea por aviso; la conexión queda abierta sin gastar CPU.
    curl -sN "https://ntfy.sh/$NTFY_TOPIC/raw" | while IFS= read -r line; do
        [ -n "$line" ] && { "$DIR/deploy.sh" || true; }
    done
    sleep 10
done
