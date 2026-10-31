# Diseño técnico · 01 · Entrar (`sign-in`)

Cómo se construye el capítulo [01 · Entrar](../../chapters/01-sign-in/rules.md) y, con él, la base
de todo el sistema. Lo aprueba Carlos antes de programar (constitución, pasos 3 a 5). La revisión
independiente está en [sign-in-design-review.md](sign-in-design-review.md); este diseño ya la
incorpora.

## 1. Qué resuelve

- **El capítulo 01**, salvo lo que quedó sin enviar (R4, E29 a E33), que se construye y se prueba
  con el módulo 15: hoy no hay nada que se pueda hacer sin conexión. Lo único que puede quedar sin
  enviar es «Salir» (§ 7).
- **La base del sistema**, porque es el primer módulo que se programa: el repositorio, el servidor,
  la aplicación, la base de datos, la auditoría, las pruebas, `pnpm check` (ADR-016) y el
  despliegue.
- **Las reglas del capítulo 00 que hacen falta desde el primer día:** el marco y el menú (R1), el
  teclado (R2), los textos largos y cortos (R3), la luz de conexión y «Sin conexión» (R4), la
  versión nueva (R5), las esperas (R7), «Algo salió mal» (R9) y el marco del ambiente de pruebas
  (R10). Los formatos (R8) llegan cuando haya algo que mostrar; el manual (R6), en el paso 9 de
  este módulo.

## 2. El repositorio

```
ferrebress/
├── docs/                            la documentación
├── src/
│   ├── shared/contracts/            la forma de la API, con zod/mini
│   ├── server/
│   │   ├── main.ts                  arma el servidor y registra los módulos
│   │   ├── platform/                config, http, clock, events, ids, settings; storage/ (db y
│   │   │                            audit: lo que se guarda) y limits/ (rate-limit y one-use: lo
│   │   │                            de un solo uso en memoria)
│   │   └── modules/
│   │       ├── users/               personas: lo mínimo que necesita entrar
│   │       └── sign-in/             entrar, salir, sesiones, huellas, códigos QR (codes/, con
│   │                                computer/: la pantalla y su canal, y phone/: leer y aprobar)
│   ├── server/testing/              lo que comparten las pruebas; sign-in/ (el Google y la huella
│   │                                de prueba, el canal, el servidor armado)
│   └── app/
│       ├── main.tsx                 arma la aplicación y registra los módulos
│       ├── platform/                server/ (api, realtime, clock: hablar con el servidor),
│       │                            device/ (device, proof-key, storage: lo del dispositivo),
│       │                            keyboard, router, store, waiting, offline (el service worker)
│       ├── sw.ts                    los eventos del service worker; se arma como /sw.js
│       ├── google-button.*          la página del marco del botón de Google
│       ├── public/                  el manifiesto y los íconos para instalarla
│       ├── ui/                      piezas del lenguaje visual
│       ├── styles/                  tokens de «Mostrador», el marco de pruebas
│       └── modules/
│           ├── frame/               el marco (capítulo 00): menú, luz, tarjeta de la persona;
│           │                        behavior/ (cómo se minimiza, los paneles, Más, las ayudas) y
│           │                        notices/ con update/ (la versión nueva) y crash/ («Algo salió
│           │                        mal»)
│           └── sign-in/             la entrada, las hojas del celular, salir; codes/ (el QR, el
│                                    lector y los dos lados del código), passkeys/, google/ (con
│                                    page/: lo que corre adentro del marco de Google) y
│                                    screens/Entrance/ con qr/, scene/, entering/ y styles/
├── tests/e2e/                       Playwright: lo que una unitaria no puede probar (§ 12)
├── tools/                           los controles propios de pnpm check, en checks/ (enlaces de
│                                    docs/, tamaños, cabeceras, el peso del arranque)
├── deploy/                          las imágenes, el Caddyfile y el compose: sirven en cualquier lado
│   └── oracle/                      solo de la VM de Oracle: install.sh, deploy.sh, listen.sh, el
│                                    servicio y el archivo para el proxy de la máquina
├── .github/workflows/               check.yml, deploy.yml, mockups.yml
└── package.json · pnpm-workspace.yaml · tsconfig.base.json · biome.json · .env.example
```

- **Un workspace de pnpm** con tres paquetes: `src/shared`, `src/server` y `src/app`.
- **`adapters/`** tiene lo que habla con un proveedor que se puede cambiar, cuando haga falta. Cada
  uno cumple una interfaz que define quien lo usa, y solo `main.ts` sabe cuál se usa.
- **`users` arranca acá con lo mínimo:** la tabla y su fachada. Las pantallas y las reglas de
  personas, roles y permisos llegan con el módulo 02, en la misma carpeta.
- **`frame` es, en la aplicación, el módulo del capítulo 00 (`00-app`):** el marco y el menú. Las
  reglas del capítulo que no son una pantalla (teclado, conexión, versión nueva) viven en
  `app/platform/`, porque las usan todos los módulos.
- **Qué se guarda en el dispositivo aunque no trabaje sin conexión** (la arquitectura lo dice como
  excepción):
  - En `localStorage`, lo que no es del negocio ni secreto: el identificador del dispositivo, a qué
    personas ya se les ofreció la huella en él (su identificador, no su nombre: R2.2 la ofrece una
    vez por persona), «salir pendiente», el nombre y rol de quien entró (para mostrarlos sin
    conexión; se borran al salir) y el último aviso de «Algo salió mal» (uno solo; se borra al
    salir y al mandarlo).
  - En IndexedDB, solo la llave de prueba de la sesión (§ 6): una llave de WebCrypto que no se
    puede exportar, y que el navegador solo guarda ahí.

## 3. Entidades

Dos esquemas de PostgreSQL. Los identificadores son UUID v7, generados por quien crea el dato.

### `users.users`

| Columna | Tipo | Para qué |
|---|---|---|
| `id` | `uuid` PK | |
| `email` | `text` | El correo que autoriza el Administrador, en minúsculas |
| `google_subject` | `text` | El identificador de Google, guardado en la primera entrada; desde ahí se compara por él, porque el correo de una cuenta puede cambiar |
| `name` | `text` | El nombre que da Google, para la tarjeta |
| `active` | `boolean` | Dada de baja = `false` (las pantallas llegan en el 02) |
| `created_at` | `timestamptz` | |

Índices únicos sobre `email` y `google_subject`. En este módulo todos son Administrador (el rol
llega en el 02). El primero se carga al instalar, con el comando del diseño de 02 (§ 7). Las
columnas que suma Usuarios están en ese diseño (§ 2).

### `sign_in.sessions`

| Columna | Tipo | Para qué |
|---|---|---|
| `id` | `uuid` PK | |
| `token_hash` | `bytea` | SHA-256 del pase; nunca el pase |
| `proof_public_key` | `bytea` | La parte pública de la llave de prueba (§ 6) |
| `user_id` | `uuid` | Quién |
| `device_id` | `uuid` | El dispositivo |
| `device_label` | `text` | «Chrome en Windows», armado por el servidor (§ 5) |
| `ip_address` | `inet` | Desde dónde se entró |
| `created_at` | `timestamptz` | Para el tope de 8 horas |
| `last_used_at` | `timestamptz` | Para los 60 minutos sin uso; se escribe por tandas |
| `google_at` | `timestamptz` | Cuándo pasó por Google en esta sesión (para vincular la huella) |
| `closed_at` | `timestamptz` | |
| `closed_reason` | enum | `sign-out`, `revoked`, `deactivated`, `idle`, `max-age` |

Índices: único sobre `token_hash`, sobre `user_id` y sobre `closed_at`. Las sesiones cerradas o
vencidas se guardan 30 días (para decir «Tu sesión se cerró desde otro dispositivo» y para que el
módulo 15 sepa si una sesión se cerró a mano) y después se borran. Un trabajo del servidor, una vez
por día, marca las vencidas que nadie volvió a usar y borra las de más de 30 días.

### `sign_in.passkeys`

| Columna | Tipo | Para qué |
|---|---|---|
| `id` | `text` PK | El identificador de la credencial |
| `user_id` | `uuid` | De quién |
| `device_id` | `uuid` | En qué celular se creó |
| `public_key` | `bytea` | La llave pública |
| `counter` | `bigint` | Detecta un autenticador clonado, si el autenticador lo usa |
| `created_at`, `last_used_at`, `revoked_at` | `timestamptz` | |

Índice único parcial sobre `device_id` donde `revoked_at` es nulo: un celular, una cuenta (R2.3).

No hay tablas de códigos QR, desafíos, `nonce` de Google ni intentos: viven en la memoria del
servidor (§ 8) y duran segundos o minutos.

## 4. API

Todo bajo `/api`, con JSON validado con los contratos de `src/shared/contracts/`.

- **Tamaño máximo:** 64 KB por cuerpo, en Caddy y en Hono (`bodyLimit`), y un largo máximo para cada
  campo en su contrato (el pase de Google, 4 KB; una respuesta de la huella, 8 KB; el código, 32
  caracteres). `X-Device-Id` tiene que ser un UUID y `X-App-Version` un número entero; si falta
  alguna o no lo es, el pedido se rechaza (400), y una versión menor que la mínima pide actualizar
  (426). También el canal en tiempo real, que se lee con `fetch`, las lleva. Solo `/api/health`,
  que miran Docker y el despliegue, no las pide.
- **Pedidos desde otros sitios:** todo pedido que no es `GET`, con o sin sesión, exige `Origin`
  igual a `PUBLIC_ORIGIN` (sin `Origin`, se rechaza) y `Content-Type: application/json`, también
  los que no llevan cuerpo. Es una comprobación propia de `platform/http`. Ninguna respuesta lleva
  cabeceras CORS, y todas las de `/api` llevan `Cache-Control: no-store`.

- **La cookie de sesión:** `__Host-session`, `HttpOnly`, `Secure`, `SameSite=Strict`, `Path=/`,
  `Max-Age` igual al tope de la sesión. Así sobrevive a que se cierre la aplicación, pero no al
  tope.
- **Cada pedido de la aplicación lleva** `X-App-Version` y `X-Device-Id` (el identificador del
  dispositivo). `X-App-Version` es la versión del contrato de la API (`src/shared/`), un número que
  sube solo cuando un cambio deja de ser compatible con la aplicación anterior; la versión del
  código, la del commit, va aparte en la respuesta (`X-Ferrebress`).
- **Cada respuesta lleva** `X-Ferrebress`: la versión del servidor, la hora del servidor y el
  ambiente. Es la forma `piggyback` del ADR-003.

| Ruta | Qué hace | Sesión |
|---|---|---|
| `GET /api/sign-in/google/nonce` | Solo un `nonce` nuevo (`{"nonce":"…"}`, menos de 50 bytes), para la entrada que quedó abierta: lo pide un minuto antes de que venza el anterior, mientras se ve (01 · R2.1). Ninguna consulta a la base, el mismo límite que `/api/start` | No |
| `GET /api/start` | El primer pedido al abrir: ambiente, versión, identificador de cliente de Google, la dirección del script de Google (en las pruebas de punta a punta, uno de prueba), un `nonce` de Google y, si hay cookie válida, quién es | Opcional |
| `POST /api/sign-in/google` | Recibe el pase de Google, lo verifica, crea la sesión. Devuelve la persona y si es un celular sin huella vinculada | No |
| `POST /api/sign-in/passkey/options` | Un desafío para entrar con la huella | No |
| `POST /api/sign-in/passkey` | Verifica la huella y crea la sesión | No |
| `POST /api/passkeys/options` | Un desafío para vincular la huella de este celular | Sí, y haber pasado por Google hace menos de 5 minutos |
| `POST /api/passkeys` | Guarda la llave pública | Igual |
| `POST /api/sign-in/codes` | La computadora abre su canal de códigos; pone la cookie `__Host-sign-in-screen` | No |
| `GET /api/realtime/sign-in-codes` | El canal SSE de la computadora: le llegan los códigos, «leído», «cancelado» y el permiso | La cookie de la pantalla |
| `POST /api/sign-in/codes/read` | El celular manda el código leído (en el cuerpo); lo reserva | No |
| `POST /api/sign-in/codes/approve` | El celular aprueba con la huella; si no tenía sesión, entra también | No (lleva la huella) |
| `POST /api/sign-in/codes/cancel` | El celular toca «No soy yo» | No (lleva el código) |
| `POST /api/sign-in/codes/claim` | La computadora cambia el permiso por su sesión | La cookie de la pantalla |
| `POST /api/sign-out` | Cierra la sesión (la de la cookie, o la que diga el cuerpo si es una salida pendiente) | Opcional |
| `GET /api/health` | Para el despliegue | No |

**Errores**, con un código y el texto que muestra la pantalla: `not-authorized` (con el correo;
R1.3), `too-many-attempts` (con los segundos que faltan; R2.9, R2.10), `code-expired`,
`code-used`, `phone-has-other-account` (R2.3, E09), `session-closed` (con el motivo; R3.5),
`update-required` (00 · R5.5), `sign-in-expired` (un pase de Google bueno con un `nonce` vencido o
ya usado: la aplicación pide otro a `/api/start` y la persona vuelve a tocar Google) y
`bad-request` (forma, tamaño, origen o un cuerpo que no es JSON, que no deja traza en el
registro). La aplicación pide un `nonce` nuevo también al salir y
al cerrarse la sesión, porque el anterior ya se usó, y mientras se ve la entrada, antes de que
venza (§ 8): así la entrada puede quedar abierta horas y Google sigue andando.

**Versión incompatible:** el servidor tiene en su configuración la versión mínima de la aplicación
que entiende; sube cuando un contrato cambia de forma incompatible. Un pedido con una versión menor
recibe `update-required` (código 426) y la aplicación muestra el bloqueo.

## 5. Los flujos

### Al abrir la aplicación

1. Si hay una salida pendiente (§ 7), la manda primero.
2. `GET /api/start`: con eso sabe el ambiente (el marco magenta y «Pronto» desde la entrada), la
   versión, el identificador de Google y si ya tiene sesión.
3. Con sesión, abre el marco en la primera opción del menú; sin sesión, la entrada.

Si el dispositivo no tiene a nadie guardado ni una salida pendiente, lo más probable es la entrada:
se dibuja enseguida, con el último ambiente guardado, sin esperar `/api/start`. Así el marco de
Google y el QR de la computadora cargan mientras tanto; el botón de Google se dibuja recién con el
`nonce`. Si `/api/start` dice que sí hay sesión (la cookie sigue y el dispositivo borró lo
guardado), la entrada se va y aparece el marco.

### Google

1. La entrada carga el botón de Google Identity Services (lo dibuja Google en el idioma del
   navegador) con el `nonce` que dio `/api/start`. Después de «Salir», la aplicación llama a
   `google.accounts.id.disableAutoSelect()` para que Google pida elegir la cuenta (R2.1).
2. El servidor verifica el pase de Google con `jose`: firma con las llaves de Google, emisor,
   público (nuestro identificador de cliente), vencimiento, correo verificado y que el `nonce` sea
   uno que dio y no se haya usado.
3. Busca la cuenta por `google_subject`. Si no hay ninguna con ese identificador, busca por correo
   en minúsculas **solo entre las cuentas que todavía no tienen `google_subject`**, y le guarda el
   identificador. Si la cuenta de ese correo ya tiene otro identificador (un correo que Google le
   dio a otra persona), es `not-authorized` y la auditoría guarda los dos identificadores. Si no
   está o está dada de baja: `not-authorized`, el mismo mensaje (R1.3).
4. Crea la sesión (§ 6) y pone la cookie. Responde si el dispositivo es un celular sin huella
   vinculada; la aplicación decide si ofrece la huella según lo que tiene guardado (R2.2).

### La huella en el celular

- **El nombre de cada dispositivo** («Chrome en Windows») lo arma el servidor con una lista cerrada
  de navegadores (Chrome, Edge, Firefox, Safari) y sistemas (Windows, macOS, Linux, Android, iPhone),
  a partir de lo que dice el navegador. Lo que no está en la lista es «Otro navegador». Así una
  computadora no puede mostrar en el celular un texto que elija ella.
- **Es un celular** si `navigator.userAgentData.mobile` lo dice o, donde no existe, si el navegador
  es de Android. La computadora nunca registra huella (R2.4).
- **Vincular:** solo en los 5 minutos siguientes a haber entrado con Google en esa sesión (la
  oferta, R2.2; desde Configuración, en el módulo 04, se vuelve a pasar por Google). La aplicación
  pide el desafío y llama a `navigator.credentials.create()` con `residentKey: "required"` y
  `userVerification: "required"`. El servidor lo verifica con `@simplewebauthn/server`, exige la
  marca de verificación (la huella, no solo tocar) y guarda la llave pública. Si el celular ya
  tiene otra cuenta: `phone-has-other-account`.
- **Entrar:** desafío → `navigator.credentials.get()` con `userVerification: "required"` → el
  servidor verifica firma, desafío, origen y la marca de verificación, y **busca a la persona: si
  está dada de baja, `not-authorized`** (E03). El contador: si el guardado y el recibido son 0 (las
  huellas de Google siempre mandan 0), no se mira; si no, el nuevo tiene que ser mayor.

### Entrar a la computadora con el celular (QR)

```
computadora                         servidor                          celular
   │ POST /sign-in/codes ─────────────▶ pone la cookie de la pantalla
   │ abre el canal SSE ───────────────▶
   │ ◀──── código (cada 60 s, por el canal)
   │ dibuja el QR                                       lee el QR (cámara o «Escanear»)
   │                                   ◀── POST /codes/read {código} ─ │  (lo reserva)
   │ ◀──── «leído» ────────            ── «¿Entrar en Chrome en Windows?» ─▶ │  (solo en la misma red)
   │                                   ◀── POST /codes/approve + huella ─ │
   │ ◀──── permiso de un uso ──
   │ POST /codes/claim + la cookie ───▶ sesión + cookie
```

- **El código lo genera el servidor** (128 bits al azar) y se lo manda a la computadora por el
  canal cada 60 segundos. La computadora no calcula nada ni usa su reloj.
- **El QR lleva** `https://<origen>/link#<código>`: después del `#`, para que el código no quede en
  los registros de Caddy. La aplicación del celular lo lee de ahí y lo manda en el cuerpo.
- **Leer el código lo reserva:** desde ese momento nadie más lo puede leer y el celular tiene 2
  minutos para aprobar, con o sin sesión: si tiene que entrar con Google, entra antes de leerlo
  (R2.7). Un plazo corto hace que nadie en la misma red pueda dejar la computadora esperando. `read` le devuelve al celular, y solo a él, un
  secreto de la reserva y el desafío de la huella para esa computadora; `approve` y `cancel` exigen
  el secreto, y `approve` solo acepta una firma de ese desafío. Así nadie más puede cancelar la
  reserva, y la huella queda firmada para esa computadora y no para otra. Apenas lee el código, la
  aplicación lo borra de la dirección (`history.replaceState`). La computadora recibe «leído» y muestra
  «Leído · Esperando la huella»; si el celular toca «No soy yo» o vence el plazo, vuelve al QR.
- **El canal y el permiso están atados a la computadora** por la cookie `__Host-sign-in-screen`
  (`HttpOnly`, al azar, nunca va en el QR). Quien vea el QR no puede escuchar el canal ni usar el
  permiso. El permiso dura 30 segundos y sirve una vez.
- **La misma red (R2.5):** al leer el código, el servidor compara la dirección de internet de la
  computadora (la del canal) con la del celular. Si no es la misma, responde `other-network`, no
  reserva el código y la computadora sigue con él. Al aprobar lo vuelve a comparar. En IPv6 se
  compara el `/64`; hoy Ferrebress solo atiende por IPv4 (el dominio no tiene dirección IPv6), y
  así tiene que seguir mientras valga esta regla: con IPv6, un celular y una computadora del mismo
  Wi-Fi podrían salir por direcciones de distinto tipo.
- **Celular sin sesión (R2.7):** se llega al código por la cámara del sistema (abre la dirección
  del QR) o por «Escanear el código de la computadora» en la entrada. Con la huella vinculada,
  **una sola huella** hace entrar a los dos: `approve` sin sesión verifica la huella, crea la
  sesión del celular y aprueba la computadora. Sin huella vinculada (con o sin sesión), entra con
  Google si hace falta y la aplicación le pide vincular la huella en ese momento; la huella recién
  creada aprueba el código en el mismo paso (`approve` recibe la credencial nueva). Entrar con
  Google no alcanza para aprobar. Si no puede vincularla, el celular dice que la computadora puede
  entrar con Google y suelta el código (`cancel`).
- **El canal está abierto mientras la entrada está a la vista.** Se cierra al entrar o al ocultar
  la pestaña, y se vuelve a abrir al volver a la vista. No hay tiempo máximo ni botón para pedir
  otro código.
- **El canal no usa `EventSource`**, que se reconecta solo cada pocos segundos (un pedido a ritmo
  fijo). Se lee con `fetch`: si se corta, se reconecta solo si la pestaña está a la vista y el
  navegador dice que hay red, como mucho tres veces con espera creciente; después espera a que
  vuelva la red o la pestaña. Si el servidor lo frena por abrirse demasiadas veces (las recargas
  seguidas, 429), espera los segundos que dice el servidor y vuelve a abrir: si no, el QR quedaba en
  blanco hasta salir de la pestaña.

### Sin la entrada del navegador (R2.6)

La computadora nunca llama a `navigator.credentials.get()`: así el navegador no ofrece su propia
entrada con un celular cercano (passkeys por Bluetooth), que vincularía el celular con el sistema de
la computadora. Solo el celular usa la huella.

## 6. La sesión (ADR-015)

- **Al crearla:** el pase (32 bytes al azar) va en la cookie y su hash a la base.
- **La llave de prueba:** al entrar, la aplicación crea con WebCrypto un par de llaves ECDSA P-256
  **que no se pueden exportar**, guarda la privada en IndexedDB y manda la pública, que el servidor
  guarda con la sesión. Con ella la aplicación firma lo que manda cuando la cookie no sirve: hoy, la
  salida pendiente (§ 7); en el módulo 15, lo hecho sin conexión. Un código malicioso en la página
  podría usarla mientras está abierta, pero no llevársela. Se borra al salir.
- **Cada pedido con cookie:** `sign-in` registra en `platform/http` la función que responde «quién
  es»: busca el hash en memoria (si no está, una consulta que trae también si la persona sigue
  activa, y lo guarda solo si la sesión es válida: una cookie inventada no ocupa memoria), aplica los dos límites
  (`rules.ts` del módulo: dos restas, ADR-015) y anota el último uso en memoria. Una vez por minuto
  escribe juntos en la base los últimos usos que cambiaron. La plataforma no conoce la regla.
- **Vencida o cerrada:** `session-closed` con el motivo; la aplicación muestra la entrada encima de
  lo que había (R3.4).
- **Al volver a entrar:** si es la misma persona, se saca la entrada y todo sigue. Si es otra, se
  descarta lo que había a medio hacer: cada módulo anota lo suyo en el marco (`registerWork`, con
  si tiene algo pendiente y cómo descartarlo), y la sesión, al entrar otra persona, le pide al marco
  que lo descarte. El mismo registro le dice al marco si puede aplicar sola una versión nueva en
  segundo plano (00 · R5.6). Hoy ningún módulo anota nada: las pruebas de E25, E26 y E30c usan algo
  a medio hacer de prueba.
- **Sin conexión (R3.6):** la aplicación no muestra la entrada por vencimiento mientras no hay
  conexión, y sigue con lo último que dijo el servidor, también el ambiente. Si el servidor no
  contesta JSON (el 502 de un despliegue), es lo mismo que sin conexión. Cuando vuelve la conexión,
  la aplicación le pregunta a `/api/start` por la sesión; si venció, aparece la entrada encima.
- **Dar de baja** (módulo 02): `users` publica `user.deactivated` **dentro de la misma transacción**
  de la baja, y `sign-in`, que lo escucha, cierra sus sesiones en esa transacción y las saca de la
  memoria. Si el servidor se cae en el medio, no queda una baja con sesiones abiertas. Una sesión
  ya en memoria no vuelve a mirar si la persona sigue activa: por eso la baja pasa siempre por
  `users`. Hasta el módulo 02, `deploy/oracle/README.md` dice cómo hacerla en la base, cerrando
  también sus sesiones. `users` no
  conoce a `sign-in`.
- **Hasta el módulo 02** no hay pantallas para cerrar una sesión ni quitar una huella:
  `deploy/oracle/README.md` tiene las dos sentencias para hacerlo en la base si se pierde un celular, y
  después se reinicia el servidor.

## 7. Salir

- **Con conexión:** `POST /api/sign-out` cierra la sesión y borra la cookie. La aplicación borra la
  llave de prueba, el nombre y el rol, y el aviso de «Algo salió mal» si había.
- **Sin conexión (R5.2):** la aplicación vuelve a la entrada al instante y anota en el dispositivo
  «salir de la sesión X». Al abrir la aplicación o al volver la red, **antes de cualquier otro
  pedido**, manda `POST /api/sign-out` con el identificador de esa sesión, firmado con su llave de
  prueba, que vale aunque la cookie ya sea de otra persona. La hora en que se tocó «Salir» sale del
  dispositivo: la auditoría la guarda como hora no confirmada. Entrar con otra cuenta en ese dispositivo también
  la cierra. Si nunca llega, vence sola.

## 8. Lo que vive en memoria del servidor y los límites

| Qué | Dura | Tope | Si se reinicia el servidor |
|---|---|---|---|
| Sesiones ya vistas | Mientras vivan | — | Se vuelven a leer de la base |
| Desafíos de la huella | 5 minutos, un uso | 100.000 | Se vuelve a tocar el botón |
| `nonce` de Google | 10 minutos, un uso | 100.000 | La entrada pide otro (solo el `nonce`) un minuto antes de que venza, mientras se ve, y al volver a la vista si ya pasó ese tiempo (el reloj se frena con el dispositivo dormido). El plazo está una sola vez, en `src/shared/`, y la renovación se calcula de él |
| Pantallas con QR y sus códigos | Mientras su canal esté abierto (uno solo: uno nuevo corta el anterior); si no lo abre en 30 s, se libera | 1.000 | La entrada abre otro canal |
| Intentos | 1 minuto y 1 hora | — | Se vuelve a contar |
| Llaves públicas de Google | Lo que diga Google | — | Se vuelven a pedir |

Con varias copias del servidor, estas piezas pasan a PostgreSQL (`LISTEN/NOTIFY` y una tabla
chica), sin tocar las reglas (ADR-015).

**Los límites de intentos** se cuentan por dispositivo **y** por dirección de internet (el
identificador del dispositivo lo puede cambiar cualquiera). Una dirección IPv6 se cuenta por su
`/64`, porque una sola conexión tiene millones de direcciones. El límite por cuenta (R2.10) cuenta
solo lo que demuestra algo de esa cuenta: un pase de Google válido de una cuenta no autorizada, o
una firma que no verifica para una credencial que existe; así nadie puede bloquear a otro con solo
saber su correo. Google y la huella se cuentan aparte, y cada límite frena solo su forma de entrar:
quien conozca el identificador de una huella puede gastar el de la huella, pero la persona sigue
entrando con Google. Los pedidos sin sesión (abrir una pantalla con QR, leer un código, pedir desafíos)
también tienen límite por dirección:

| Qué | Por dirección |
|---|---|
| `GET /api/start` (da un `nonce`) | 30 por minuto, y como mucho 100 `nonce` vivos: al llegar, se descarta el más viejo de esa dirección en lugar de negarse, porque se pide uno con cada carga de la entrada, no es un intento, y en el local todos los dispositivos salen por la misma dirección |
| Desafíos de la huella | 20 por minuto, y como mucho 10 vivos |
| Abrir una pantalla con QR | 10 por minuto, y como mucho 3 abiertas |
| Volver a abrir la pantalla de la misma pestaña (recargar la entrada, o volver a su pestaña) | 60 por minuto, aparte: reemplaza la pantalla anterior de esa pestaña, que se cierra en el acto, así que no cuenta para las 3 abiertas ni para las 10 por minuto. La pestaña la identifica un número al azar guardado en la pestaña (`sessionStorage`), que se conserva solo al recargar: una pestaña duplicada lleva otro |
| Leer un código | 10 por minuto |
| Aprobar un código | el de la huella: 20 por minuto, por dirección y por dispositivo |
| Una salida pendiente (`POST /api/sign-out` con `pending`) | 30 por minuto, como `/api/start`: se busca en la base aunque no haya sesión |

Al llegar a un tope, se rechaza lo nuevo con `too-many-attempts`; nunca se saca lo que ya estaba,
salvo los `nonce`. Los topes totales de la tabla de arriba son mucho más altos que lo que puede
juntar alguien con pocas direcciones: cada lugar ocupa unos cien bytes. Cada pedido se cuenta
primero por su dirección y después por su dispositivo, y se deja de contar en el primero que
frena: una dirección frenada no agrega dispositivos inventados. Las ventanas vencidas se barren
como mucho una vez por minuto. Los números están en el archivo de configuración.

**La dirección de internet** la resuelve Caddy y se la pasa al servidor, una sola, en `X-Real-IP`.
Caddy la toma de `X-Forwarded-For` solo si el pedido le llega de la red local, y de esa lista se
queda con la primera que no es de confianza empezando por la derecha (`trusted_proxies_strict`):
la que agregó el proxy de la máquina, no la que mande el navegador. El servidor la acepta solo si
el pedido viene de Caddy (`TRUSTED_PROXY`) y si es una dirección; escucha en IPv4 y lee la
dirección de la conexión sin el `::ffff:` con que Node escribe una IPv4 que llega por un socket
IPv6, que si no nunca coincidiría con la de Caddy. Para que Caddy vea la dirección real hace falta
que nada en el medio la pierda (§ 14).

## 9. Eventos y auditoría

La auditoría se construye en `platform/storage/audit` desde este módulo (SQLite, ADR-004); su pantalla
llega con el módulo 05. Cada evento lleva quién (o el correo, si la cuenta no está autorizada),
cuándo (hora del servidor), el dispositivo y la dirección de internet.

| Evento | Cuándo |
|---|---|
| `sign-in.succeeded` | Entró, con cómo (Google, huella, QR) |
| `sign-in.rejected` | Cuenta no autorizada o dada de baja, correo de otro identificador de Google, huella inválida, código vencido, usado o de otra pantalla, permiso vencido o de otra pantalla |
| `sign-in.throttled` | Llegó a un límite de intentos: una fila por ventana y por clave (dispositivo, dirección o cuenta), con cuántos pedidos rechazó, para que insistir no llene la auditoría |
| `request.rejected` | Origen, forma, tamaño o versión rechazados, con la misma regla de una fila por ventana |
| `sign-out` | Salió (si fue sin conexión, con la hora en que tocó y la hora en que llegó) |
| `session.ended` | Venció o se cerró, con el motivo |
| `passkey.linked`, `passkey.rejected` | Vinculó la huella de un celular, o no pudo (otra cuenta) |
| `code.read`, `code.rejected`, `code.approved`, `code.cancelled` | Lo que hizo un celular con un código (rechazado: desde otra red) |

## 10. La aplicación

- **Preact, Vite y CSS común** (ADR-013), una sola aplicación para los dos anchos (ADR-002).
- **Las acciones con nombre llegan con el módulo 03:** recién ahí hay una segunda forma de
  dispararlas (el espejo del celular y la cola sin conexión). Hasta entonces el teclado aprieta el
  botón mismo, y la entrada no necesita más.
- **`platform/keyboard`:** las reglas del capítulo 00 (R2). Cada pantalla declara sus acciones con
  su tecla; el motor muestra las teclas con Alt, dentro del botón a la derecha, y las ejecuta. Las
  pantallas no escuchan teclas.
- **`platform/server/api`:** un `fetch` que pone las cabeceras, lee `X-Ferrebress` y traduce los errores.
- **`platform/waiting`:** las esperas (00 · R7) de lo que se toca: nada antes de 300 ms, la marca
  después y la barra a los 2 s, que muestra el marco. El botón de `ui/` la usa sola; mientras
  espera, volver a tocarlo no hace nada. Las búsquedas (R7.4) llegan con la primera que haya.
- **`platform/router`:** la dirección es un valor compartido, que el menú cambia. Atrás y adelante
  del navegador funcionan. Hoy el área de trabajo está en blanco (00), así que nada elige pantalla
  por la dirección; eso llega con la primera pantalla de trabajo.
- **`platform/server/realtime`:** el canal temporal (SSE con `fetch`, § 5) y la lectura de la cabecera.
  Cada tema declara qué permiso hace falta para escucharlo. La conexión directa entre dispositivos
  llega con el módulo 03; no se arma una interfaz de estrategias hasta que haya una segunda forma.
- **`platform/server/clock`:** la hora del servidor más el cronómetro (ADR-007).
- **`platform/device/device`:** el identificador y si es celular (Android o iPhone, por
  `navigator.userAgentData` o, si no está, por el agente; sin bibliotecas). El nombre «Chrome en
  Windows» lo arma el servidor (§ 5); si hay cámara se sabe recién al tocar «Escanear».
- **La versión nueva (00 · R5) y la instalación:** un service worker escrito a mano, sin
  bibliotecas (`platform/offline`), que Vite arma aparte como `/sw.js`, con una dirección que no
  cambia. Con él y el manifiesto (`public/manifest.webmanifest`, con los íconos de la F), el
  celular puede instalar la aplicación (04 · «Instalar en este dispositivo»).
  - Al instalarse guarda solo el esqueleto: la página y los archivos que ella carga de entrada. El
    resto (las pantallas, las imágenes, las letras) lo guarda la primera vez que se usa.
  - La página se pide siempre primero a la red, así que recargar trae la versión nueva, como dice
    R5. Sin conexión, abre la guardada (R3.6).
  - Si la página que llega es de otra versión, borra lo guardado de la anterior.
  - Nunca guarda ni contesta nada de `/api`, ni de otros sitios, ni el marco del botón de Google.
  - Caddy sirve la página, `/sw.js` y el manifiesto sin que el navegador los guarde.
  - Al entrar, si la respuesta trajo una versión nueva y no hay nada a medio hacer, recarga antes
    de mostrar el marco, con la sesión ya guardada (00 · R5.2). Si está por ofrecerse la huella,
    que se perdería al recargar, avisa como en uso (R5.3).
- **«Algo salió mal» (00 · R9):** muestra qué hacer y guarda el aviso, con la captura y los últimos
  pasos, para mandarlo cuando exista el módulo 12. La captura se saca con `html-to-image` (unos
  10 KB), que se baja recién cuando hace falta.
- **El script de Google** se carga solo cuando se muestra la entrada, y solo dentro del marco del
  botón (`google/`). Si la aplicación abre con sesión, no se carga.
- **Nada de HTML armado a mano:** Preact escapa todo texto, y `pnpm check` prohíbe
  `dangerouslySetInnerHTML` (regla de Biome).
- **«Algo salió mal»:** las piezas que muestran datos personales llevan la marca `data-private`, y
  la captura las tapa (00 · R9.4).
- **Todas las bibliotecas se sirven desde el propio origen**, empaquetadas; ninguna desde un CDN.
- **El QR:** se dibuja con `qrcode-generator` (unos 20 KB); se lee con `BarcodeDetector` y, donde
  no existe, con ZXing, que se baja recién al tocar «Escanear». Lee un cuadro cada 250 ms hasta que
  se cierra la cámara; lo que no es una dirección de este origen se descarta y sigue leyendo.
- **Las pantallas:** la entrada, desde `docs/design/mockups/sign-in/adapted/`, y en el celular la
  oscura, desde `docs/design/mockups/sign-in-phone-dark/final/` (la elige el dispositivo, no el
  ancho: `data-device` en la entrada; la computadora con la ventana angosta sigue con la clara; la
  foto, la letra Google Sans y el botón blanco de Google, con `theme: 'outline'`, son solo de ella).
  En la oscura, el botón de Google se pide más angosto y se agranda un 20 % con `transform`
  (Google no lo dibuja de más de 40 px de alto), y los espacios grandes se achican con la altura
  de la pantalla (`--short`), así se ve todo hasta el pie sin correrla. Como el marco, ocupa la
  ventana con su propio borde (`position: fixed`) y mide su alto como contenedor (`cqh`), no con
  `100dvh`: instalada, Android calcula esa altura al abrir con la de la pantalla de bienvenida. «Entrando» en la
  computadora, desde `docs/design/mockups/sign-in-entering/final/` (en el celular, la capa
  «Entrando» de la entrada); el marco, desde `docs/design/mockups/app-frame/final/`.
- **«Entrando» (R2.11):** un valor compartido dice cómo se está entrando. Lo prende el pedido que
  abre la sesión (el pase de Google, la huella ya puesta o el permiso que trae el celular), pasados
  300 ms, y lo apaga su respuesta. Así no se ve mientras el lector del celular está abierto. En la
  computadora reemplaza el cuerpo de la tarjeta, que queda inerte; en el celular se dibuja aparte,
  encima de toda la entrada.
- **Peso:** el arranque (esqueleto, marco y entrada, sin Google) por debajo de 60 KB comprimido; lo
  controla `pnpm check`.

## 11. Configuración

**En el `.env`** (cambia entre ambientes; el servidor no arranca si falta una):

| Variable | Para qué |
|---|---|
| `ENVIRONMENT` | `testing` o `production` en la máquina; `e2e` en las pruebas de punta a punta |
| `PUBLIC_ORIGIN` | La dirección pública; el origen que valida la huella |
| `DATABASE_URL` | PostgreSQL; en las pruebas, `memory://` (PGlite) |
| `AUDIT_PATH` | El archivo de la auditoría; en las pruebas, `:memory:` |
| `GOOGLE_CLIENT_ID` | El cliente OAuth |
| `GOOGLE_ISSUER`, `GOOGLE_JWKS_URL` | Quién emite el pase de Google y dónde están sus llaves; en las pruebas, un emisor de prueba |
| `GOOGLE_SCRIPT_URL` | El script del botón de Google; en las pruebas de punta a punta, uno de prueba |
| `TRUSTED_PROXY` | La dirección de Caddy, la única de la que se acepta la dirección de internet |

- **Si falta una variable,** el servidor no arranca y dice su nombre, nunca un valor.
- **Con `testing` o `production`,** el servidor no arranca si `GOOGLE_ISSUER` no es
  `https://accounts.google.com` o si `GOOGLE_SCRIPT_URL` no es el de Google. El emisor de prueba
  solo existe con `e2e`, y su llave se genera al arrancar cada corrida y no se guarda en ningún
  lado.
- **`DATABASE_URL` es un secreto** (lleva la contraseña): el `.env` de la máquina tiene permisos
  `600`.

**En un archivo de configuración del repositorio** (igual en todos los ambientes): los 60 minutos y
las 8 horas (hasta que exista Administración), los límites de intentos, los plazos de los códigos,
los desafíos y el `nonce`, y la versión mínima de la aplicación.

## 12. Pruebas

- **Primero las pruebas:** cada tarea empieza por las suyas, que fallan; después el código.
- **Unitarias (Vitest):** cada escenario del 01 (salvo E29 a E33) y los del 00 que se construyen
  (salvo E22, que necesita algo que se mande después: llega con el módulo 15). Los que solo se ven
  en un navegador de verdad (E04, E19) van con las pruebas de captura
  acá, con su nombre (`sign-in-E13`). El servidor por su API, con PGlite y la auditoría en memoria;
  la aplicación por lo que ve la persona, con Testing Library. Google, con un emisor de prueba; la
  huella, con respuestas de autenticador de prueba.
- **Cuántas consultas**, con una prueba por pedido:

  | Pedido | Consultas a la base |
  |---|---|
  | `/api/start` con la sesión ya en memoria | 0 (quién es la persona también queda en memoria) |
  | `/api/sign-in/google/nonce` | 0 |
  | El primero de una sesión después de reiniciar | 2 (la sesión y la persona); sin prueba, porque la prueba no reinicia el servidor |
  | Entrar con Google | hasta 3 (buscar la cuenta, guardar `google_subject` la primera vez, crear la sesión); en el celular, hasta 4, porque mira si ya tiene huella para no ofrecerla |
  | Entrar con la huella | 4 (la credencial, su contador, la persona, crear la sesión) |
  | Leer un código | hasta 3 (la sesión, si el celular tiene huella, la persona para vincularla) |
  | Aprobar un código | hasta 5 (las de la huella y la sesión de la computadora) |

- **Cobertura del 100 %.** Fuera de la cuenta, solo lo que habla con el hardware del navegador
  (`navigator.credentials`, la cámara), que se prueba de punta a punta.
- **De punta a punta (Playwright):** solo lo que una unitaria no puede probar, cada camino en el
  ancho donde pasa. Lo demás (sesión vencida, sin conexión, «Entrando», los avisos, Más en el
  celular, el service worker) ya lo cubren las unitarias.
  1. **Entrar con Google y salir, en la computadora:** con el emisor de prueba, el botón en su
     marco con su política de contenido y los mensajes entre las dos páginas, la cookie y la llave
     de la sesión contra el servidor, y «Salir», que la cierra y pide un `nonce` nuevo.
  2. **Vincular la huella y entrar con ella, en el celular:** con el autenticador virtual de
     Chromium; Google, «¿Entrar con la huella la próxima vez?», vincular, salir y entrar solo con
     la huella.
  3. **Entrar a la computadora con el QR, con dos navegadores:** la computadora muestra el código,
     el celular con la huella lo lee y la computadora entra sola; prueba el canal en tiempo real,
     la misma red y la reserva del código.
  4. **Las cabeceras de Caddy, sin navegador:** un pedido a la aplicación y otro al marco de
     Google; la política estricta en la aplicación, la excepción de estilos solo en el marco y las
     demás cabeceras de seguridad.

  **Cómo corren:** `pnpm e2e` (`tests/e2e/`) arma la aplicación, levanta el servidor con la base en
  memoria (`DATABASE_URL=memory://`, `ENVIRONMENT=e2e`; con otra base, `e2e` no arranca) y un
  emisor de Google de prueba, y pone
  delante Caddy en Docker, con la imagen y el `Caddyfile` de producción. El script de Google es
  uno de prueba servido por la propia aplicación: dibuja el botón como Google y la prueba le pasa
  un pase firmado por el emisor de prueba, con el `nonce` que le dio la entrada. Hace falta Docker
  prendido.

  **Para que tarden lo mínimo** (todas juntas, unos 10 s):
  - Todo se levanta una sola vez para todas, y el servidor arranca mientras se arma la aplicación.
    Cada prueba abre sus propios contextos del navegador, que tardan milisegundos.
  - Las cuatro corren en paralelo. Usan la misma cuenta, cada una desde sus propios dispositivos,
    sin depender de lo que dejó otra.
  - Nada de esperas fijas: se espera lo que tiene que aparecer, con un tope corto.
  - El QR no se fotografía: la prueba lee el código del canal en tiempo real de la computadora, que
    es lo mismo que dibuja el QR, y el celular abre la dirección que el QR lleva.
  - Sin animaciones (`reducedMotion`), sin reintentos y sin capturas, salvo cuando una falla.
  - La 4 es un pedido común, sin abrir el navegador.
- **Pruebas de captura de la entrada:** la de la computadora y la del celular, tal como quedaron
  aprobadas, se comparan punto por punto con una captura de referencia (`tests/screens/`), así
  ningún cambio las modifica sin que se vea. Corren en `pnpm check`, en cada subida, en unos
  6 s: la aplicación armada contra una API de mentira que siempre contesta lo mismo (sin sesión,
  el mismo QR y un botón de Google con su forma), con el reloj fijo. Se sacan y se comparan
  siempre en la imagen de Playwright de Docker, porque fuera de ella las letras se dibujan apenas
  distinto; en GitHub el control corre dentro de esa imagen y en una sesión `pnpm screens` se
  relanza en Docker. Cuando Carlos aprueba un cambio de la entrada, las referencias se vuelven a
  sacar con `pnpm screens --update-snapshots` y se suben con el cambio.
  - También los momentos del botón de Google mientras carga («El hilo»: cargando, no respondió y
    sin conexión), con Google frenado y el reloj de la página avanzado hasta cada uno.
  - **Los toques** (`taps.spec.ts`, constitución VII): cada pieza que se muestra encima de otra o
    en su lugar se toca de verdad, y el navegador comprueba que el toque le llegue. Son el botón
    de Google y la hoja de la huella, la hoja del código leído, la cámara, Más y su hoja, «Hay una
    versión nueva», «Algo salió mal», «Reintentar», y que mientras se abre la sesión «Entrando»
    no deje tocar Google. Cada prueba arma las respuestas del servidor que necesita.
- **Una prueba por ataque:** cada riesgo de § 13 y de la revisión de seguridad tiene una prueba que
  lo intenta y falla: un correo reasignado, un código cancelado sin el secreto de la reserva, una
  firma de otro desafío, un pedido sin `Origin` o sin cuerpo, un cuerpo de más de 64 KB, un emisor
  de prueba con `ENVIRONMENT=testing`, una cookie inventada que no queda en memoria, los topes por
  dirección.
  Que Google pida elegir la cuenta después de salir (E11) se prueba comprobando que se llamó a
  `disableAutoSelect()`; que el botón se vea como el real, a mano.

## 13. Seguridad

- **Datos que toca:** correo, nombre e identificador de Google de cada persona; la llave pública de
  cada celular; la dirección de internet en las sesiones y la auditoría; el correo de quien intentó
  entrar sin estar autorizado, que queda en la auditoría lo que dura su archivo. Nada de
  contraseñas.
- **Quién puede hacer cada cosa:** entrar, cualquier cuenta autorizada y activa (también con la
  huella y con el QR); vincular una huella, solo con la sesión abierta, desde un celular y habiendo
  pasado por Google en los últimos 5 minutos; aprobar un código, solo con la huella.
- **Qué entra de afuera y cómo se valida:**
  - El pase de Google: firma, emisor, público, vencimiento, correo verificado y `nonce` de un uso.
  - La huella: desafío, origen, `rpId`, la marca de verificación y el contador como dice § 5.
  - El código QR: que exista, que no se haya reservado ni usado, y su plazo. El canal y el permiso,
    con la cookie de la pantalla.
  - Todo cuerpo de pedido, con su contrato y su tamaño máximo (§ 4).
  - Pedidos desde otros sitios: la cookie `SameSite=Strict` y la comprobación del origen en todo
    pedido que no es `GET` (§ 4).
- **Cabeceras de Caddy:**
  - HTTPS siempre (lo atiende el proxy de la máquina) y `Strict-Transport-Security`.
  - Una política de contenido que en la aplicación solo permite el propio origen, sin nada de
    Google, con `object-src 'none'`, `base-uri 'none'`, `worker-src 'self'`,
    `img-src 'self' data: blob:` y `frame-ancestors 'none'`. Lo de Google
    (`accounts.google.com` en scripts, marcos, conexiones y estilos) se permite solo en la página
    del botón.
  - **La única excepción, aprobada por Carlos, es el botón de Google**, que Google mide y dibuja
    con estilos en línea (sin ellos se ve un instante como una G enorme con el texto repetido).
    Como la política vale para una página entera, el botón vive en su propia página,
    `/google-button.html`, dentro de un marco de la entrada: solo esa página admite estilos en
    línea, solo puede cargar el script de Google y solo la aplicación puede enmarcarla
    (`frame-ancestors 'self'`). La aplicación le pide por mensaje qué dibujar (el identificador,
    el `nonce` y el ancho) y recibe el pase de Google; cada lado escucha solo al otro y solo de
    este origen. Apenas abre, la página del marco ya abre la conexión con Google y empieza a bajar
    su script (`preconnect` y `preload`), en paralelo con lo que tarda la aplicación en pedirle el
    botón: medido, el botón queda listo unos 300 ms antes. El marco aparece recién cuando el
    botón quedó dibujado: cuando cargaron los estilos de Google y el marco del botón
    personalizado, o a los 3 segundos si alguno no llega. Mientras tanto, su lugar muestra «El
    hilo» (01 · R2.1): los momentos están en `useGooglePhase`, con las esperas de
    `platform/waiting` y 8 s para decir que no respondió; «Reintentar» y la vuelta de la conexión
    cargan un marco nuevo. «Salir» deja anotado en
    el dispositivo que, la próxima vez, Google vuelva a pedir la cuenta (R2.1).
  - `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
    `Referrer-Policy: strict-origin-when-cross-origin` (Google comprueba el origen del botón por esa
    cabecera; a otros sitios va solo el origen, nunca la ruta) y
    `Cross-Origin-Opener-Policy: same-origin-allow-popups` (el botón de Google abre una ventana).
  - `Permissions-Policy` con la cámara y la huella solo para el propio origen.
  - Lo que solo sirve en una página (la política de contenido de la aplicación, `X-Frame-Options`,
    `Referrer-Policy`, `Cross-Origin-Opener-Policy` y `Permissions-Policy`) no va en las respuestas
    de `/api`, que son JSON: ahí van solo `Strict-Transport-Security`, `nosniff` y una política de
    contenido mínima (`default-src 'none'; frame-ancestors 'none'`). Cada respuesta pesa así unos
    600 bytes menos, que en el celular se pagan con datos.
  - `Cache-Control`: lo de `/assets/`, que lleva el hash en el nombre, se guarda un año; todo lo
    demás (las páginas, `/link`, el service worker, el manifiesto) lleva `no-cache` y se revisa
    siempre.
- **Secretos:** la contraseña de la base (`DATABASE_URL`) y el canal de ntfy, que se guarda como
  secreto de GitHub para que no aparezca en los registros públicos de Actions. El identificador de
  Google no es secreto. Los pases, solo como hash.
- **Límites:** § 8.
- **Lo que no se puede garantizar (aceptado):** las huellas de Google se copian a los
  otros dispositivos de la misma cuenta de Google, también a Chrome en una computadora. El servidor
  no puede saber en qué aparato se usó. Por eso «un celular, una cuenta» y «la computadora no tiene
  huella propia» se cumplen en la aplicación, no como garantía.
- **Auditoría:** § 9.

## 14. El despliegue (ADR-014)

- **Imágenes:** el servidor (Node) y Caddy con la aplicación adentro, para ARM, construidas en un
  runner ARM de GitHub (gratis en repositorios públicos).
- **Volúmenes:** la base y la auditoría. Los certificados los guarda el proxy
  de la máquina.
- **Las migraciones** corren al arrancar el servidor, antes de atender. Cada una es compatible con
  la versión anterior del código (primero se agrega; lo que se quita, en una versión posterior),
  porque el despliegue puede volver atrás.
- **Workflows:** `check.yml` en cada subida (`pnpm check`); `deploy.yml` solo en `push` a `main`
  (imágenes, GHCR, aviso a ntfy). Como el repositorio es público: ningún `pull_request_target`,
  `permissions:` mínimos en cada workflow (`contents: read`; `packages: write` solo en el que publica)
  y las acciones de terceros fijadas por su commit.
- **En la máquina, `deploy.sh`** corre como mucho una vez por minuto (un aviso falso solo provoca una
  consulta a GitHub), baja las imágenes por su huella (`@sha256:`) y no solo por la etiqueta. Las
  imágenes base de los Dockerfile y la de PostgreSQL del compose también van por su huella.
- **Los contenedores:** ninguno puede ganar privilegios adentro (`no-new-privileges`), y el servidor,
  que corre como el usuario `node`, no tiene ningún permiso del sistema (`cap_drop: [ALL]`).
- **Dependencias:** `pnpm audit --prod` en `pnpm check` frena desde las fallas moderadas.
- **Las pruebas de punta a punta**, con el compose, antes de cerrar el módulo.
- **La máquina:** una VM de Oracle que comparte con otras aplicaciones. Ferrebress corre con su
  propio usuario y Docker sin privilegios, y `loginctl enable-linger` para que el servicio arranque
  solo; lo dice `deploy/oracle/README.md`.
- **Los puertos 80 y 443** los tiene el proxy de la máquina (ADR-011), que comparten las
  aplicaciones de la VM. Ferrebress corre con el usuario `ferrebress`, sin privilegios y con su
  Docker; su Caddy escucha solo en `127.0.0.1:8090` (pruebas; producción, `8091`). El archivo que
  va en el proxy está en el repositorio (`deploy/oracle/machine-proxy/ferrebress.caddy`) y lo instala una
  vez un administrador:

  ```
  ferrebress-pruebas.duckdns.org {
      reverse_proxy 127.0.0.1:8090
  }
  ```

  El proxy pone la dirección de quien se conecta en `X-Forwarded-For`. El Caddy de Ferrebress solo
  la toma si el pedido viene de la red local, se queda con la que agregó el proxy
  (`trusted_proxies_strict`) y se la pasa al servidor en `X-Real-IP`; el servidor solo la toma
  del Caddy de Ferrebress (`TRUSTED_PROXY`, una dirección fija en la red interna del compose).
- **Los registros:** cada servicio del compose guarda como mucho tres archivos de 10 MB, así un
  pedido repetido no llena el disco de la VM.
- **La dirección real:** una prueba en la máquina entra desde una
  dirección conocida y comprueba que la auditoría anota esa. Docker sin privilegios, con su forma
  de abrir puertos por omisión, la pierde y anota la misma para todos: eso dejaría sin efecto la
  regla de la misma red y juntaría los límites de todo el mundo en uno; pasando por el proxy de la máquina no
  hace falta tocar la red de Docker.
- **Las versiones:** exactas en `package.json`. Hono 4.6.5 o más nueva (las anteriores tienen
  fallas conocidas en su control de origen) y `jose` reciente.
- **Si se pierde un celular** antes del módulo 02: `deploy/oracle/README.md` dice cómo cerrar sus sesiones
  y quitar su huella en la base, y que después hay que reiniciar el servidor, que tiene las sesiones
  en memoria.

## 15. Decisiones

Lo que decidió Carlos:

- **Celular sin huella ante el QR:** se le pide vincularla en ese momento (R2.7, § 5).
- **Las huellas que se copian:** se acepta (§ 13, ADR-006).
- **La misma red:** el celular solo aprueba la entrada de una computadora que sale a internet por
  su misma dirección (R2.5). No se usa ninguna base de ciudades.
- **El límite por cuenta:** Google y la huella se cuentan aparte (R2.10).

- **Los puertos:** el proxy de la máquina atiende HTTPS y le pasa los dominios de Ferrebress a su
  Caddy, que sigue siendo propio (§ 14, ADR-011).

## 16. Tareas

En orden; cada una empieza por sus pruebas. `[P]` se puede hacer en paralelo con la anterior.

1. El workspace y `pnpm check` (ADR-016).
2. `platform` del servidor: configuración, base con Kysely y PGlite, migraciones, auditoría en
   SQLite, HTTP con Hono, cabeceras, `/api/health`, `/api/start`.
3. **El despliegue, temprano:** las imágenes, el compose, Caddy con sus cabeceras, los workflows,
   `deploy.sh` y `listen.sh`, con una aplicación vacía. Desde acá, cada tarea se ve en el ambiente
   de pruebas.
4. `users`: la tabla, la fachada, el primer Administrador y el evento de baja.
5. `sign-in` del servidor: sesiones y sus límites, Google, la huella, los códigos QR con su canal,
   salir, los límites de intentos, los eventos.
6. `platform` de la aplicación `[P]`: server (api, clock, realtime), device (device, proof-key,
   storage), keyboard, router,
   waiting; `ui` y `styles`.
7. `frame`: el marco desde su maqueta, con la luz, la tarjeta de la persona, «Algo salió mal» y la
   versión nueva.
8. `sign-in` de la aplicación: la entrada desde su maqueta, las hojas del celular, el lector, el QR,
   salir.
9. Las pruebas de punta a punta.
10. La revisión independiente del código (paso 7).

## 17. Lo que tiene que hacer Carlos antes de programar

- **Google:** se usa el cliente OAuth web que ya existe en Google Cloud. En Credenciales → ese
  cliente, agregar a «Orígenes de JavaScript autorizados»
  `https://ferrebress-pruebas.duckdns.org`. Mientras la pantalla de consentimiento siga en
  «Prueba», cada cuenta que entre tiene que estar en su lista de usuarios de prueba.
- **El usuario y el proxy:** crear el usuario `ferrebress` con Docker sin privilegios y `linger`, y
  copiar `deploy/oracle/machine-proxy/ferrebress.caddy` a `/etc/caddy/sitios/`; los pasos los tiene
  `deploy/oracle/README.md`, y los puede hacer el agente de la VM.
- **DuckDNS:** crear `ferrebress-pruebas` apuntando a la IP pública de la VM.
- **ntfy:** nada; el agente crea el canal con un nombre al azar y lo guarda como secreto de GitHub
  y en la máquina.
