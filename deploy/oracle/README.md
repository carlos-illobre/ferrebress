# Instalar Ferrebress en la VM de Oracle

Todo lo de esta carpeta es solo de esta VM: el proxy compartido, el servicio de usuario que
escucha los avisos y el despliegue que le pregunta a GitHub. Lo que sirve en cualquier lado (las
imágenes, el Caddy de Ferrebress y el compose) está en `deploy/`. Para llevar Ferrebress a otro
lado, esta carpeta se reemplaza; lo demás no cambia.

Ferrebress corre en la VM de Oracle junto a otras aplicaciones (ADR-014): con su propio usuario,
sin privilegios y con su propio Docker; su Caddy escucha solo en `127.0.0.1:8090` y el proxy de
la máquina le pasa sus dominios (ADR-011). Estos pasos se hacen una sola vez; los puede hacer el
agente de la máquina.

## Instalar o poner al día

Con un usuario administrador, desde una copia del repositorio:

```bash
git clone https://github.com/carlos-illobre/ferrebress.git && cd ferrebress
GOOGLE_CLIENT_ID=<el cliente OAuth web> ADMIN_EMAIL=<el primer Administrador> \
  NTFY_TOPIC=<el mismo valor que el secreto NTFY_TOPIC de GitHub> bash deploy/oracle/install.sh
```

`install.sh` crea el usuario `ferrebress` con su Docker sin privilegios, copia los scripts y el
compose, arma el `.env` (genera la contraseña de la base sin mostrarla), arranca el servicio que
escucha los avisos, instala `machine-proxy/ferrebress.caddy` en el proxy de la máquina y comprueba
que `https://ferrebress-pruebas.duckdns.org/api/health` responda con las cabeceras de seguridad. Se
puede volver a correr: no pisa lo que ya está configurado en el `.env`. Los datos van como
variables al correrlo: el repositorio es público y no los guarda.

Si es la primera vez, al final hay que anotar la fila de Ferrebress en
`/etc/caddy/sitios/README.md`.

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

Cuando cambian `deploy.sh`, `listen.sh`, el compose o el servicio en el repositorio, se hace
`git pull` en la copia y se vuelve a correr `install.sh` con las mismas variables.

## Si se pierde un celular

Hasta que exista Administración (módulo 02), se le cierran las sesiones y se le quita la huella
desde la base. En la máquina, en `~/ferrebress`:

1. Buscar el celular entre los dispositivos de la persona, por su nombre y su último uso:

   ```bash
   docker compose exec db psql -U ferrebress -c "
     select device_id, device_label, max(last_used_at) as ultimo_uso
     from sign_in.sessions
     where user_id = (select id from users.users where email = 'CORREO-DE-LA-PERSONA')
     group by device_id, device_label order by ultimo_uso desc;"
   ```

2. Cerrar sus sesiones y quitarle la huella, con el `device_id` del paso anterior:

   ```bash
   docker compose exec db psql -U ferrebress -c "
     update sign_in.sessions set closed_at = now(), closed_reason = 'revoked'
       where device_id = 'DEVICE-ID' and closed_at is null;
     update sign_in.passkeys set revoked_at = now()
       where device_id = 'DEVICE-ID' and revoked_at is null;"
   ```

3. Reiniciar el servidor, que tiene las sesiones abiertas en memoria: hasta entonces seguirían
   valiendo.

   ```bash
   docker compose restart server
   ```

El celular, si aparece, vuelve a entrar con Google y vincula de nuevo su huella.
