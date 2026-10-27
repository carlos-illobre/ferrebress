# Diseño técnico · 01 · Entrar (`sign-in`)

Cómo se construye el capítulo [01 · Entrar](../../chapters/01-sign-in/rules.md) y, con él, la base
de todo el sistema. Lo aprueba Carlos antes de programar (constitución, pasos 3 a 5).

**Estado:** esperando la revisión independiente.

## 1. Qué resuelve

- **El capítulo 01 entero:** entrar con Google, con la huella del celular y a la computadora con el
  celular (QR o la entrada del navegador por Bluetooth); la sesión con sus dos límites; salir; el
  marco al que se llega.
- **La base del sistema**, porque es el primer módulo que se programa: el repositorio, el servidor,
  la aplicación, la base de datos, la auditoría, las pruebas, `pnpm check` y el despliegue.
- **Las reglas del capítulo 00 que hacen falta desde el primer día:** el marco y el menú (R1), el
  teclado (R2), los textos largos y cortos (R3), la luz de conexión y «Sin conexión» (R4), la
  versión nueva (R5), las esperas (R7), «Algo salió mal» (R9) y el marco del ambiente de pruebas
  (R10). Los formatos (R8) y el manual (R6) llegan cuando haya algo que mostrar: el manual, en el
  paso 9 de este módulo.

**Lo que no resuelve todavía:** lo que se hace sin conexión y queda pendiente (R4 del 01, escenarios
E29 a E33). Hoy no hay nada que se pueda hacer sin conexión: la única cosa que puede quedar sin
enviar es «Salir», y se resuelve aparte (§ 6). El mecanismo general de lo pendiente, con la
prueba del pase de quien lo hizo, se construye con el módulo 15 (Sin conexión); sus escenarios
pasan a ese módulo. **A confirmar por Carlos.**

## 2. El repositorio

```
ferrebress/
├── docs/                          la documentación (no cambia)
├── src/
│   ├── shared/                    TypeScript puro: contracts/ (la forma de la API, con zod/mini)
│   ├── server/
│   │   ├── main.ts                arma el servidor y registra los módulos
│   │   ├── platform/              db, audit, http, session, realtime, config, clock, rate-limit
│   │   └── modules/
│   │       ├── users/             la tabla de personas (lo mínimo que necesita entrar)
│   │       └── sign-in/           entrar, salir, sesiones, huellas, códigos QR
│   └── app/
│       ├── main.tsx               arma la aplicación y registra los módulos
│       ├── platform/              api, realtime, keyboard, router, actions, device, clock
│       ├── ui/                    piezas del lenguaje visual
│       ├── styles/                tokens de «Mostrador», el marco y el marco de pruebas
│       └── modules/
│           ├── frame/             el marco: menú, luz, tarjeta de la persona, área de trabajo
│           └── sign-in/           la entrada, las hojas del celular, salir
├── tests/e2e/                     Playwright: los caminos principales, en los dos anchos
├── deploy/                        compose.yml, Caddyfile, deploy.sh, listen.sh, el servicio de systemd
├── .github/workflows/             check.yml (cada subida), deploy.yml (main), mockups.yml (ya está)
├── package.json · pnpm-workspace.yaml · tsconfig.base.json · .env.example
```

- **Un workspace de pnpm** con tres paquetes: `src/shared`, `src/server` y `src/app`.
- **`users` arranca acá con lo mínimo:** la tabla y su fachada (buscar por correo, crear el primer
  Administrador). Las pantallas y las reglas de personas, roles y permisos llegan con el módulo 02,
  en la misma carpeta.
- **`frame` es un módulo de la aplicación sin servidor:** el marco es de todos y no tiene datos
  propios.

## 3. Entidades

Dos esquemas de PostgreSQL. Los identificadores son UUID v7, generados por quien crea el dato.

### `users.users`

| Columna | Tipo | Para qué |
|---|---|---|
| `id` | `uuid` PK | |
| `email` | `text` | El correo de Google, en minúsculas |
| `name` | `text` | El nombre que da Google, para la tarjeta |
| `active` | `boolean` | Dada de baja = `false` (las pantallas llegan en el 02) |
| `created_at` | `timestamptz` | |

Índice único sobre `email`: la búsqueda al entrar. En este módulo todos son Administrador (el rol
llega en el 02); el primero se crea al arrancar el servidor con el correo de la configuración, si
no existe.

### `sign_in.sessions`

| Columna | Tipo | Para qué |
|---|---|---|
| `id` | `uuid` PK | |
| `token_hash` | `bytea` | SHA-256 del pase; nunca el pase |
| `user_id` | `uuid` | Quién |
| `device_id` | `uuid` | El dispositivo (un identificador al azar que guarda el navegador) |
| `device_label` | `text` | «Chrome en Windows» |
| `created_at` | `timestamptz` | Para el tope de 8 horas |
| `last_used_at` | `timestamptz` | Para los 60 minutos sin uso; se escribe por tandas |
| `closed_at` | `timestamptz` | Salir, cerrada a distancia o vencida |
| `closed_reason` | `text` | `sign-out`, `remote`, `deactivated`, `idle`, `max-age` |

Índice único sobre `token_hash` (buscar el pase la primera vez) e índice sobre `user_id` (cerrar
todas las de una persona).

### `sign_in.passkeys`

| Columna | Tipo | Para qué |
|---|---|---|
| `id` | `text` PK | El identificador de la credencial |
| `user_id` | `uuid` | De quién |
| `device_id` | `uuid` | En qué celular |
| `public_key` | `bytea` | La llave pública |
| `counter` | `bigint` | Detecta un autenticador clonado |
| `created_at`, `last_used_at`, `revoked_at` | `timestamptz` | |

Índice único parcial sobre `device_id` donde `revoked_at` es nulo: **un celular, una cuenta**
(R2.3).

No hay tabla de códigos QR, de desafíos ni de intentos: viven en la memoria del servidor (§ 7) y
duran segundos o minutos.

## 4. API

Todo bajo `/api`. Entra y sale JSON validado con los contratos de `src/shared/contracts/`. La
sesión viaja en la cookie `session` (`HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/api`).

| Ruta | Qué hace | Sesión |
|---|---|---|
| `POST /api/sign-in/google` | Recibe el pase de Google (ID token), lo verifica, busca la cuenta, crea la sesión y pone la cookie. Devuelve la persona y si se le ofrece la huella | No |
| `POST /api/sign-in/passkey/options` | Devuelve un desafío para entrar con la huella (5 minutos, un uso) | No |
| `POST /api/sign-in/passkey` | Verifica la huella, crea la sesión y pone la cookie | No |
| `POST /api/passkeys/options` | Desafío para vincular la huella de este celular | Sí |
| `POST /api/passkeys` | Guarda la llave pública: el celular queda vinculado | Sí |
| `POST /api/sign-in/codes` | La computadora pide la semilla de sus códigos QR (§ 5) | No |
| `GET /api/sign-in/codes/:code` | El celular pregunta qué computadora es y desde qué ciudad | Sí |
| `POST /api/sign-in/codes/:code/approve` | El celular aprueba con su huella | Sí |
| `POST /api/sign-in/codes/claim` | La computadora cambia el permiso de un uso por su sesión y su cookie | No (trae el permiso) |
| `POST /api/sign-out` | Cierra la sesión y borra la cookie | Sí |
| `GET /api/me` | Quién soy: lo que pide la aplicación al abrir | Sí |
| `GET /api/realtime/:topic` | Canal SSE temporal (§ 5) | Según el tema |
| `GET /api/health` | Para el despliegue: la base y la auditoría responden | No |

**Errores**, siempre con un código y el texto en castellano que muestra la pantalla:
`not-authorized` (R1.3), `too-many-attempts` (con los segundos que faltan; R2.9, R2.10),
`code-expired`, `code-used`, `session-closed` (con el motivo; R3.5), `update-required` (R5.5 del 00).

**Lo que viaja en cada respuesta** (la forma `piggyback` del ADR-003): la cabecera
`X-Ferrebress` lleva la versión del servidor, la hora del servidor y, si cambió, el estado de la
sesión. Con eso la aplicación se entera de la versión nueva, de la sesión cerrada y de la hora,
sin consultas propias.

## 5. Los flujos

### Google

1. La entrada muestra el botón de Google Identity Services (lo dibuja Google, en el idioma del
   navegador). Después de «Salir», la aplicación llama a `disableAutoSelect()`: Google pide elegir
   la cuenta (R2.1).
2. Google le da a la aplicación un ID token (un JWT de Google; ADR-015).
3. El servidor lo verifica con las llaves públicas de Google (con `jose`, guardadas en memoria según
   lo que diga Google), comprueba el público (nuestro identificador de cliente) y que el correo
   esté verificado.
4. Busca la cuenta por correo en minúsculas. Si no está o está dada de baja: `not-authorized`, el
   mismo mensaje (R1.3).
5. Crea la sesión y pone la cookie. Si el dispositivo es un celular, no tiene huella vinculada y
   nunca se le ofreció, responde `offerPasskey: true` (R2.2).

### La huella en el celular

- **Vincular:** después de aceptar la oferta, la aplicación pide `POST /api/passkeys/options`,
  llama a `navigator.credentials.create()` con el autenticador del celular y manda el resultado.
  El servidor lo verifica con `@simplewebauthn/server` y guarda la llave pública. Si el celular ya
  tiene otra cuenta vinculada: error (R2.3).
- **Entrar:** `options` → `navigator.credentials.get()` → el servidor verifica la firma, el
  desafío, el origen y que el contador suba.
- **«Se ofreció una vez»** se guarda en el dispositivo (no es secreto y no se necesita en otro
  lado).
- **Es un celular** si `navigator.userAgentData.mobile` lo dice o, donde no existe, si el
  navegador es de Android. La computadora nunca registra huella (R2.4).

### Entrar a la computadora con el celular (QR)

```
computadora                         servidor                          celular
   │ POST /sign-in/codes ─────────────▶ semilla + id (para esta pantalla)
   │ abre SSE temporal «sign-in:<id>» ─▶
   │ cada 60 s calcula el código nuevo
   │ con la semilla (sin red) y lo dibuja
   │                                                      lee el QR (cámara)
   │                                    ◀── GET /sign-in/codes/:code ─ │
   │                                    ── «Chrome en Windows · BA» ──▶ │
   │                                    ◀── approve + huella ─────────  │
   │ ◀── por el SSE: permiso de un uso ──
   │ POST /sign-in/codes/claim ───────▶ sesión + cookie
   │ cierra el SSE
```

- **El código cambia cada 60 segundos sin ir a la red:** la computadora recibe una sola vez una
  semilla al azar y calcula cada código como un HMAC de la semilla con el minuto (como los códigos
  de las aplicaciones de doble factor). El servidor hace la misma cuenta para validar. Un código
  sirve una sola vez y solo en su minuto (R2.5).
- **El canal temporal** (SSE) está abierto solo mientras la entrada está a la vista; se cierra al
  entrar, al ocultar la pestaña o a los 10 minutos (con un botón «Mostrar el código de nuevo»).
- **La ciudad aproximada** sale de la dirección de internet de la computadora, consultada una vez
  cuando pide la semilla (§ 7, decisión pendiente).
- **El permiso de un uso** que viaja por el SSE no es la sesión: dura 30 segundos y solo sirve para
  que la propia computadora pida su cookie. Así la cookie la pone una respuesta a la computadora,
  que es la única forma de que quede protegida.
- **Celular sin sesión** (R2.7): la dirección del QR abre la aplicación en el celular, que muestra
  la entrada; al entrar, sigue con el mismo código.

### Con Bluetooth (R2.6)

Si `PublicKeyCredential.getClientCapabilities()` dice `hybridTransport`, la entrada muestra
«Entrar con el celular», que llama a `navigator.credentials.get()` sin credenciales indicadas: el
navegador muestra su propio QR y el celular cercano pone la huella. El servidor verifica igual que
la huella del celular. Si el navegador no lo dice (Firefox, hoy), se usa el QR propio.

### La sesión (ADR-015)

- **Cada pedido con cookie:** el servidor busca el hash del pase en su memoria; si no está, una
  consulta a la base y lo guarda. Comprueba los dos límites (dos restas) y actualiza el último uso
  en memoria. Una vez por minuto escribe juntos en la base los últimos usos que cambiaron.
- **Vencida o cerrada:** responde `session-closed` con el motivo; la aplicación muestra la entrada
  encima de lo que había (R3.4).
- **Al volver a entrar:** si es la misma persona, se saca la entrada y todo sigue; si es otra, se
  vacía lo que estaba a medio hacer.
- **Sin conexión** (R3.6): el dispositivo no muestra la entrada por vencimiento mientras no hay
  conexión; el servidor aplica los límites en el próximo pedido.

## 6. Salir

- **Con conexión:** `POST /api/sign-out` cierra la sesión y borra la cookie; la aplicación vuelve a
  la entrada.
- **Sin conexión** (R5.2): la aplicación vuelve a la entrada al instante y anota en el dispositivo
  «salir de la sesión X» (un valor en `localStorage`, sin IndexedDB). Con el primer pedido que
  vuelva a llegar al servidor, se manda y la sesión se cierra. Si nunca llega, la sesión vence sola
  a los 60 minutos.

## 7. Lo que vive en memoria del servidor

| Qué | Dura | Si se reinicia el servidor |
|---|---|---|
| Sesiones ya vistas | Mientras vivan | Se vuelven a leer de la base |
| Desafíos de la huella | 5 minutos, un uso | Se pierden: se vuelve a tocar el botón |
| Semillas y códigos usados | 10 minutos | Se pierden: la entrada pide una semilla nueva |
| Intentos por dispositivo y por cuenta | 1 minuto y 1 hora | Se pierden: se vuelve a contar |
| Las llaves públicas de Google | Lo que diga Google | Se vuelven a pedir |

Con varias copias del servidor, estas piezas pasan a PostgreSQL (`LISTEN/NOTIFY` y una tabla
chica), sin tocar las reglas (ADR-015).

**La ciudad aproximada — decisión pendiente de Carlos:**

| Opción | A favor | En contra |
|---|---|---|
| **A. Un servicio gratuito por internet** (por ejemplo, ipwho.is), una consulta por semilla | Cero mantenimiento, casi nada de peso | Manda la dirección de internet de la computadora a un tercero; si no responde, el celular dice «ubicación desconocida» |
| B. Una base de ciudades dentro del servidor (DB-IP Lite) | No sale nada del servidor; responde al instante | Unos 130 MB más en la imagen y actualizarla cada mes |

Recomiendo la **A**: con una consulta por cada vez que se abre la entrada, el costo es nulo.

## 8. Eventos y auditoría

La auditoría se construye en `platform/audit` desde este módulo (SQLite, ADR-004); su pantalla
llega con el módulo 05. Cada evento lleva quién, cuándo (hora del servidor), desde qué dispositivo
y su dirección de internet.

| Evento | Cuándo |
|---|---|
| `sign-in.succeeded` | Entró, con cómo (Google, huella, QR, Bluetooth) |
| `sign-in.rejected` | Cuenta no autorizada o huella inválida |
| `sign-in.throttled` | Llegó a un límite de intentos (R2.10) |
| `sign-out` | Salió |
| `session.ended` | Venció o se cerró, con el motivo |
| `passkey.linked` | Vinculó la huella de un celular |
| `code.approved` | Un celular aprobó la entrada de una computadora |

## 9. La aplicación

- **Preact, Vite y CSS común** (ADR-013), una sola aplicación para los dos anchos (ADR-002).
- **`platform/actions`:** el único punto por donde pasan las acciones con nombre. Hoy lo usan el
  teclado y los botones; mañana el espejo del celular y lo pendiente.
- **`platform/keyboard`:** las reglas del teclado del capítulo 00 (R2): los dos focos, las flechas,
  Enter, Esc y Alt. Cada pantalla declara sus acciones con su tecla; el motor muestra las teclas
  con Alt, dentro del botón, a la derecha, y las ejecuta. Las pantallas no escuchan teclas.
- **`platform/api`:** un `fetch` que pone la cookie, lee la cabecera `X-Ferrebress` (versión, hora,
  sesión), traduce los errores y maneja las esperas (300 ms y 2 s).
- **`platform/realtime`:** las formas `request`, `piggyback` y `temporary` del ADR-003. La forma
  `peer` llega con el módulo 03.
- **`platform/clock`:** la hora del servidor más el cronómetro (`performance.now()`; ADR-007).
- **`platform/device`:** el identificador del dispositivo, si es celular, si tiene cámara, si puede
  usar la entrada con Bluetooth.
- **La versión nueva** (00 · R5): el service worker de la PWA baja la versión nueva cuando la
  cabecera dice otra; recién abierta se aplica sola; en uso, el aviso; en segundo plano y sin nada a
  medio hacer, se aplica sola.
- **La entrada:** se construye desde la maqueta aprobada (`docs/design/mockups/sign-in/adapted/`),
  con sus estados. **El marco**, desde `docs/design/mockups/app-frame/final/`.
- **Lo que no se descarga hasta usarlo:** el lector de QR (ZXing, solo donde el navegador no trae
  `BarcodeDetector`) y la biblioteca de la huella.

## 10. Configuración

En el `.env` (cambia entre ambientes, sin valores por omisión): `ENVIRONMENT` (`testing` o
`production`), `PUBLIC_ORIGIN`, `DATABASE_URL`, `AUDIT_PATH`, `GOOGLE_CLIENT_ID`,
`INITIAL_ADMIN_EMAIL`, `SESSION_SECRET` (firma de las semillas QR), `GEO_LOOKUP_URL`.

En un archivo de configuración del repositorio (igual en todos los ambientes): los 60 minutos y las
8 horas de la sesión (hasta que exista Administración), los límites de intentos, los 60 segundos
del código, los 5 minutos de los desafíos.

En las pruebas, lo mismo con otros valores: `DATABASE_URL=memory://`, `AUDIT_PATH=:memory:` y un
emisor de pases de Google de prueba, con su dirección de llaves en el `.env` de las pruebas.

## 11. Pruebas

- **Unitarias (Vitest):** cada escenario E01 a E44 del 01 y los del 00 que se construyen acá, con
  su nombre (`sign-in-E13`). Servidor por su API, con PGlite y la auditoría en memoria; aplicación
  por lo que ve la persona, con Testing Library. Google, con un emisor de prueba; la huella, con
  respuestas de autenticador de prueba de `@simplewebauthn`.
- **Cuántas consultas:** `GET /api/me` con la sesión en memoria, ninguna consulta a la base;
  entrar con Google, como mucho 3 (buscar la cuenta, crear la sesión y, la primera vez, crear el
  Administrador); entrar con la huella, como mucho 4.
- **Cobertura del 100 %.** Fuera de la cuenta, solo lo que habla con el hardware del navegador
  (`navigator.credentials`, la cámara), que se prueba de punta a punta.
- **De punta a punta (Playwright, en los dos anchos):** entrar con Google (con el emisor de
  prueba), vincular la huella y entrar con ella (con el autenticador virtual de Chromium), entrar a
  la computadora leyendo el QR con un segundo navegador, salir, sesión vencida, sin conexión.

## 12. Seguridad

- **Datos que toca:** correo y nombre de cada persona; la llave pública de cada celular; la
  dirección de internet en la auditoría. Nada de contraseñas.
- **Quién puede hacer cada cosa:** entrar, cualquier cuenta autorizada; vincular una huella, solo
  con la sesión abierta y desde un celular; aprobar un código, solo con la sesión abierta y la
  huella.
- **Qué entra de afuera y cómo se valida:**
  - El pase de Google: firma, emisor, público, vencimiento y correo verificado.
  - Las respuestas de la huella: desafío, origen, identificador de la parte (`rpId`) y contador.
  - El código QR: que sea de su minuto, que no se haya usado y que su semilla exista.
  - Todo cuerpo de pedido, con su contrato; un pedido que no lo cumple no llega a la regla.
  - La cookie `SameSite=Strict` y la comprobación del origen en cada pedido que cambia algo, contra
    pedidos desde otros sitios.
- **Secretos:** `GOOGLE_CLIENT_ID` (no es secreto, pero cambia por ambiente) y `SESSION_SECRET`,
  solo en el `.env` de la máquina. Los pases de sesión, solo como hash.
- **Límites de intentos:** por dispositivo y por cuenta (R2.9, R2.10).
- **Cabeceras de Caddy:** HTTPS siempre, `Strict-Transport-Security`, una política de contenido que
  solo permite el propio origen y Google.
- **Auditoría:** § 8.

## 13. Metas de performance

| Qué | Meta |
|---|---|
| Consultas a la base por pedido con sesión | 0 (la sesión está en memoria) |
| Entrar con Google, de punta a punta | menos de 1 segundo después de elegir la cuenta |
| Lo que baja la entrada la primera vez | menos de 120 KB comprimidos, sin contar el botón de Google |
| Lo que baja el marco | menos de 60 KB comprimidos más |
| Pedidos a ritmo fijo | ninguno; el canal SSE, solo con el QR a la vista |
| Escrituras de «último uso» | una tanda por minuto, no una por pedido |

## 14. El despliegue (ADR-014)

- **Imágenes:** dos, para ARM: el servidor (Node) y Caddy con la aplicación ya construida
  adentro. Se construyen en un runner ARM de GitHub (gratis en repositorios públicos), sin
  emulación.
- **`check.yml`:** en cada subida, `pnpm check`.
- **`deploy.yml`:** en `main`, construye y publica las imágenes en GHCR y manda el aviso vacío a
  ntfy.
- **En la máquina:** `listen.sh` (el servicio de systemd que escucha el aviso) y `deploy.sh`
  (pregunta a GitHub, despliega, revisa `/api/health` y vuelve atrás si falla).
- **Las pruebas de punta a punta** corren antes de cerrar el módulo, en la CI, con el compose.

## 15. Tareas

En orden; las que llevan `[P]` se pueden hacer en paralelo con la anterior.

1. El workspace, la configuración de TypeScript, Vitest, la cobertura y los controles de
   `pnpm check` (tipos, qué importa a qué, tamaños como aviso, enlaces de `docs/`).
2. `platform` del servidor: la configuración desde el `.env`, la base con Kysely y PGlite en las
   pruebas, las migraciones, la auditoría en SQLite, HTTP con Hono, la cabecera `X-Ferrebress`,
   `/api/health`.
3. `users`: la tabla, la fachada y el primer Administrador.
4. `sign-in` del servidor: sesiones y sus límites, Google, la huella, los códigos QR con su canal
   temporal, salir, los límites de intentos, los eventos.
5. `platform` de la aplicación `[P]` (con la 4): api, clock, device, actions, keyboard, realtime,
   router; `ui` y `styles` con los tokens de «Mostrador» y el marco de pruebas.
6. `frame`: el marco desde su maqueta, con el menú que se minimiza, la luz de conexión, la tarjeta
   de la persona, «Algo salió mal» y el aviso de versión nueva.
7. `sign-in` de la aplicación: la entrada desde su maqueta, las hojas del celular, el lector de
   QR, Bluetooth, salir.
8. El despliegue: las imágenes, el compose, Caddy, los workflows, `deploy.sh` y `listen.sh`.
9. Las pruebas de punta a punta.
10. La revisión independiente del código (paso 7).

## 16. Lo que tiene que hacer Carlos antes de programar

- Crear en Google Cloud un identificador de cliente OAuth («Aplicación web») con el origen
  `https://ferrebress-pruebas.duckdns.org`, y pasar el identificador (no es secreto).
- Confirmar en qué máquina va: la misma VM de Oracle del proyecto anterior (un proyecto de compose
  aparte, sin tocar el otro) o una nueva.
- Crear el canal de ntfy (o dejar que lo cree el agente con un nombre al azar).
- Decidir la ciudad aproximada (§ 7) y que lo pendiente sin conexión pase al módulo 15 (§ 1).
