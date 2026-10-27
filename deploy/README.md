# Instalar Ferrebress en la máquina

Ferrebress corre en la VM de Oracle junto a otras aplicaciones (ADR-014): con su propio usuario,
sin privilegios y con su propio Docker; su Caddy escucha solo en `127.0.0.1:8090` y el proxy de
la máquina le pasa sus dominios (ADR-011). Estos pasos se hacen una sola vez; los puede hacer el
agente de la máquina.

## 1. Con un usuario administrador

```bash
sudo useradd --create-home --shell /bin/bash ferrebress
sudo loginctl enable-linger ferrebress          # sus servicios corren sin sesión abierta
grep ferrebress /etc/subuid /etc/subgid         # tiene que tener un rango en los dos
```

## 2. Con el usuario `ferrebress` (`sudo -iu ferrebress`)

```bash
dockerd-rootless-setuptool.sh install && docker context use rootless
docker buildx version                           # deploy.sh lo usa para leer las huellas
git clone https://github.com/carlos-illobre/ferrebress.git ~/ferrebress-repo
mkdir -p ~/ferrebress ~/.config/systemd/user
cp ~/ferrebress-repo/deploy/{deploy.sh,listen.sh,compose.yml} ~/ferrebress/
cp ~/ferrebress-repo/deploy/ferrebress-deploy.service ~/.config/systemd/user/
cp ~/ferrebress-repo/.env.example ~/ferrebress/.env && chmod 600 ~/ferrebress/.env
```

- **`~/ferrebress/.env`:** completar lo que está entre `<…>`. `WEB_IMAGE` y `SERVER_IMAGE` quedan
  vacías: las completa `deploy.sh`.
- **`~/ferrebress/deploy.env`:** una línea `NTFY_TOPIC=<el canal>`, el mismo nombre que el secreto
  `NTFY_TOPIC` de GitHub. Permisos `600`.

```bash
systemctl --user daemon-reload
systemctl --user enable --now ferrebress-deploy
journalctl --user -u ferrebress-deploy -f       # tiene que decir «corre <sha>»
```

## 3. El proxy de la máquina, con un usuario administrador

```bash
sudo cp ~ferrebress/ferrebress-repo/deploy/machine-proxy/ferrebress.caddy /etc/caddy/sitios/
sudo caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile && sudo systemctl reload caddy
curl -s https://ferrebress-pruebas.duckdns.org/api/health   # {"ok":true,"version":"<sha>"}
```

Y anotar la fila de Ferrebress en `/etc/caddy/sitios/README.md`.

## Fuera de la máquina

- **DuckDNS:** `ferrebress-pruebas` apuntando a la IP pública de la VM.
- **GitHub:** el secreto `NTFY_TOPIC` (Settings → Secrets and variables → Actions) con un nombre
  al azar, y después del primer despliegue, los paquetes `ferrebress-server` y `ferrebress-web`
  públicos (Packages → cada uno → Package settings → Change visibility), para que la máquina
  los baje sin credenciales.

## Todos los días

```bash
~/ferrebress/deploy.sh                # verificar ya, sin esperar un aviso
~/ferrebress/deploy.sh <sha>          # volver a un commit anterior
cd ~/ferrebress && docker compose ps && docker compose logs -f --tail 100 server
```

Cuando cambian `deploy.sh`, `listen.sh` o el servicio en el repositorio, se vuelven a copiar
(`git -C ~/ferrebress-repo pull` y los `cp` del paso 2) y se reinicia el servicio.
