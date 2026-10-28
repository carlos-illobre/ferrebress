# Revisión del código · 01 · Entrar (`sign-in`)

Revisión independiente del código (constitución, paso 7), hecha solo con los documentos y el código:
el capítulo [01](../../chapters/01-sign-in/rules.md) y lo del [00](../../chapters/00-app/rules.md) que
se programó con él, las maquetas que nombran sus `screens.md` (`sign-in/adapted/`,
`sign-in-entering/final/`, `app-frame/final/`, `app-notices/final/`), el [diseño](sign-in.md) y su
[revisión](sign-in-design-review.md). Código: `src/server/` (módulos `users` y `sign-in`, la
plataforma), `src/shared/contracts/`, `src/app/` (módulos `frame` y `sign-in`, la plataforma, `sw.ts`),
`tests/e2e/` y `deploy/`.

Cómo lo comprobé: leí todo el código y las pruebas; corrí `pnpm check` (pasa: 47 archivos, 281
pruebas, cobertura 100 %) y `pnpm test` aparte; probé por la API, con pruebas temporales que después
borré, lo que dudaba (cuerpos mal formados, la hoja doble de E16b); armé la aplicación en una carpeta
aparte y le saqué capturas con Chromium, con la API simulada, en 1920, 1536, 1366, 800, 768 y 390 px.
No corrí las de punta a punta.

Gravedad:

- **Frena:** hay que arreglarlo antes de cerrar el módulo.
- **Mejora:** conviene hacerlo; no frena.

## Resumen

| # | Punto | Gravedad |
|---|---|---|
| 1.1 | Un celular con sesión y sin huella no puede aprobar una computadora (R2.7) | Frena |
| 1.2 | En E16b aparecen dos hojas a la vez | Frena |
| 1.3 | Una computadora con la ventana angosta muestra «Entrar con la huella» y llama a `navigator.credentials.get()` (R2.4, R2.6, E10, E17) | Frena |
| 1.4 | Si el servidor no contesta JSON (un 502 durante el despliegue), la aplicación queda en blanco | Frena |
| 1.5 | E25, E26, E28 y E28b no tienen prueba; lo de R3.6 al volver la conexión no está hecho | Frena |
| 1.6 | Escenarios del 00 sin una prueba que los nombre | Frena |
| 1.7 | Una prueba afirma lo contrario de R10.1/E51: sin conexión al abrir, sin marco de pruebas (y el menú queda vacío) | Frena |
| 1.8 | «Algo salió mal» lleva el nombre de la persona y nada usa `data-private` (00 · R9.4, E54) | Frena |
| 1.9 | La sesión vencida por la cookie dice «Tu sesión se cerró desde otro dispositivo» (R3.5) | Mejora importante |
| 1.10 | La cámara deja de leer después de un QR que no es de Ferrebress | Mejora importante |
| 1.11 | E39 cambió y el código no lo tiene | Pendiente de la maqueta |
| 1.12 | Pruebas cuyo nombre promete más de lo que comprueban | Mejora |
| 2.x | Comentarios de cabecera y carpetas | Mejora |
| 3.x | Pruebas que miran por dentro | Mejora |
| 4.1 | No existe ninguna prueba que cuente las consultas, y dos pedidos superan lo previsto | Frena |
| 4.2 | No hay control del peso del arranque en `pnpm check` | Mejora importante |
| 4.3 | Las pruebas unitarias tardan 31,9 s (la constitución pide menos de 30) | Mejora importante |
| 4.4 | Otras diferencias con el diseño | Mejora |
| 5.x | Seguridad: JSON mal formado, versión, auditoría, la página sin `no-cache`, las sentencias si se pierde un celular | Mejora importante / Mejora |
| 6.x | Textos y comportamientos que ningún documento pide | Mejora |
| 7.x | Repetición y código que sobra | Mejora |
| 8.x | Documentación que quedó atrás | Mejora |
| 9.x | Pantallas: la cuenta regresiva arranca en 1:01, «Esta computadora», Google sin teclado | Mejora |

---

## 1. Escenarios sin cumplir

### 1.1 Un celular con la sesión abierta y sin huella no puede aprobar una computadora — Frena

- **Dónde:** `src/server/modules/sign-in/passkeys/webauthn.ts:38-43` (`cannotLink`),
  `src/server/modules/sign-in/codes/phone-routes.ts:58-67`, `src/app/modules/sign-in/usePhoneCode.ts:34-49`
  y `:80-83`.
- **Qué dicen los documentos:** R2.7, tercer punto: «Lo mismo si el celular ya tenía la sesión abierta
  pero no tiene huella vinculada»: entra con Google y se le pide vincular la huella. El diseño (§ 5):
  «Sin huella vinculada (con o sin sesión), entra con Google si hace falta».
- **Qué hace el código:** al leer el código, el servidor manda cómo crear la huella solo si la sesión
  pasó por Google hace menos de 5 minutos (`googleAt`). Si la sesión es más vieja, o se abrió con la
  huella o con el QR, `read` no manda `registration`; la aplicación llama entonces a
  `signWithPasskey` sin huella vinculada, eso falla o se cancela, y el celular dice «Sin la huella no
  entra la computadora». `scanned()` solo manda a «Entrá en este celular» si **no** hay sesión
  (`!who && !hasPasskey()`). Un celular que entró con Google hace una hora y dijo «Ahora no» a la
  huella no puede hacer entrar a ninguna computadora sin salir antes.
- **Prueba:** ninguna cubre este caso (E16b se prueba solo «sin sesión ni huella»).

### 1.2 En E16b aparecen dos hojas a la vez — Frena

- **Dónde:** `src/app/App.tsx:132-133`, `src/app/modules/sign-in/useSignIn.ts:45`,
  `src/app/modules/sign-in/screens/Sheets/OfferSheet.tsx:31`.
- **Qué dicen los documentos:** R2.7: sin huella, entra con Google «y en ese momento se le pide
  vincular la huella (**la misma hoja de R2.2**, que dice que es para entrar a la computadora)»;
  `screens.md`: no hay más hojas que esas dos.
- **Qué hace el código:** el celular sin sesión lee el código, entra con Google, y `withGoogle`
  prende `offerPasskey` (el servidor dice `offerPasskey: true` porque no tiene huella) mientras
  `usePhoneCode` lee el código y abre la hoja «Vinculá tu huella para entrar a la computadora». Lo
  comprobé con una prueba temporal sobre `App`: quedan abiertos dos diálogos, «Entrar» y «¿Entrar con
  la huella la próxima vez?». Si vincula en la del código, la otra sigue ofreciendo vincular.

### 1.3 La computadora con la ventana angosta muestra la huella y «Escanear» — Frena

- **Dónde:** `src/app/modules/sign-in/screens/Entrance/Card.tsx:30` (el QR depende de `isPhone()`) y
  `Buttons.tsx:45-81` (la huella y «Escanear» dependen del ancho, por las clases `phone-only`).
- **Qué dicen los documentos:** R2.4 (la computadora no tiene huella propia), R2.6 y E17 (la
  computadora nunca ofrece la entrada del navegador), el diseño § 5 «Sin la entrada del navegador»:
  «La computadora nunca llama a `navigator.credentials.get()`». R2.5: el canal está abierto «solo
  mientras el código está en pantalla».
- **Qué hace el código:** debajo de 900 px de ancho la entrada toma la disposición del celular, pero
  qué se muestra depende de dos cosas distintas: el QR, del tipo de dispositivo; los botones, del ancho.
  En una computadora con la ventana a 800 px (la notebook de 1366 px con zoom de 175 %, o media
  pantalla) se ve «Entrar con la huella» y «Escanear el código de la computadora», y no se ve el QR,
  aunque el canal sigue abierto pidiendo códigos (lo vi en la captura y en los pedidos:
  `/api/sign-in/codes` y `/api/realtime/sign-in-codes`). Tocar «Entrar con la huella» llama a
  `navigator.credentials.get()` en la computadora, que es justo lo que R2.6 prohíbe (el navegador
  ofrece el celular cercano por Bluetooth).

### 1.4 Si el servidor no contesta JSON, la aplicación queda en blanco — Frena

- **Dónde:** `src/app/platform/api.ts:63` (`await response.json()` sin atrapar),
  `src/app/App.tsx:42-50` y `:76`.
- **Qué dicen los documentos:** constitución IV («El mostrador no para»), R3.6 (sin servidor se sigue
  con lo que había), 00 · R9.1 («Algo salió mal» con qué hacer **para seguir**).
- **Qué hace el código:** cualquier respuesta que no es JSON (el 502 de Caddy mientras el servidor
  se reinicia en cada despliegue, una página de error del proxy de la máquina) tira una excepción.
  Si pasa en `/api/start`, `boot()` se rechaza, `start` nunca se carga y `App` muestra solo los
  diálogos: lo comprobé con la aplicación armada y un 502 en `/api/start`: pantalla vacía con «Algo
  salió mal», y «Seguir sin avisar» deja la pantalla vacía. Con una sesión guardada debería seguir
  como sin conexión (R3.6).

### 1.5 E25, E26, E28 y E28b sin prueba; R3.6 al volver la conexión, sin hacer — Frena

- **Dónde:** no hay prueba con esos nombres. `src/app/App.tsx:82-83`.
- **Qué dicen los documentos:** el diseño (§ 6) deja fuera solo E29 a E33; dice que E25 y E26 se
  prueban «con un módulo de prueba con algo a medio hacer» y que la aplicación publica
  `session.person-changed`. R3.6: «Cuando vuelve la conexión, el servidor la revisa: si venció,
  aparece la entrada encima».
- **Qué hace el código:** `session.person-changed` no existe en ningún lado; E25 y E26 no tienen
  prueba. Al volver la red (`online`), la aplicación solo manda la salida pendiente si la hay; si no,
  no hace ningún pedido, así que el servidor no revisa nada hasta el próximo pedido. La prueba «R3.6:
  sin conexión al abrir…» de `App.test.tsx` no nombra E28 y no prueba que la sesión no venza.

### 1.6 Escenarios del 00 sin una prueba que los nombre — Frena

- **Qué dicen los documentos:** el diseño § 1 dice que este módulo construye R1, R2, R3, R4, R5, R7, R9
  y R10 del 00; constitución VII: cada escenario tiene una prueba que lo nombra.
- **Sin prueba:** E03, E04, E16, E19, E22, E23, E30c, E54 y E55. Algunos hoy son ciertos sin más
  (E03: no se guarda nada; E55: todas las rutas son relativas). E04 lo comprobé a mano: en 1920, 1366,
  768 y 390 px ni la entrada ni el marco se desplazan al costado. E30c no se puede probar sin algo a
  medio hacer, y `watchBackground` (`src/app/modules/frame/notices/update.ts:51-56`) no tiene forma de
  preguntar si hay algo a medio hacer (R5.6). E54 no se cumple (punto 1.8).
- **Nombres:** los del 01 se escriben de dos formas (`sign-in-E13` en el servidor, `01-E38` en la
  aplicación); la constitución pide `<módulo>-E05`.

### 1.7 Sin conexión al abrir, en el ambiente de pruebas: sin marco magenta y con el menú vacío — Frena

- **Dónde:** `src/app/App.tsx:35-40` (`unknown` con `environment: 'production'`),
  `src/app/App.test.tsx:63-69`.
- **Qué dicen los documentos:** 00 · R10.1 y E51: en el ambiente de pruebas, **toda** pantalla tiene el
  marco magenta. R1.3: en pruebas se ve lo que todavía no existe, con «Pronto».
- **Qué hace el código:** si `/api/start` no contesta, la aplicación supone producción: no hay marco
  magenta y, como en producción solo se ve lo que existe, el menú queda sin ninguna parte. La prueba
  «R3.6: sin conexión al abrir sigue con quién estaba guardado, **sin el marco de pruebas**» afirma ese
  comportamiento, contrario a la regla (constitución I: una prueba no puede contradecir una regla).
  Se resuelve guardando en el dispositivo el último ambiente que dijo el servidor.

### 1.8 «Algo salió mal» lleva el nombre de la persona — Frena

- **Dónde:** `src/app/modules/frame/notices/crash.ts:23-38` (los pasos usan el `aria-label`),
  `src/app/modules/frame/screens/Phone/Phone.tsx:22`, `Side/SideFooter.tsx:66`; ningún componente
  usa `data-private`.
- **Qué dicen los documentos:** 00 · R9.4 y E54: sin datos de clientes ni la sesión de la persona.
  Diseño § 10: «las piezas que muestran datos personales llevan la marca `data-private`, y la captura
  las tapa».
- **Qué hace el código:** la captura filtra `data-private`, pero ninguna pieza la lleva: el nombre, el
  rol y las iniciales (marco), y el correo (hoja de la huella, aviso de no autorizada) salen en la
  captura. Los pasos guardan «Tocó «Ana Gómez · Más»» o «Tocó «Ana Gómez, Administrador»», porque
  toman el `aria-label`. Todo eso queda guardado en `localStorage`.

### 1.9 Vencida por la cookie, la entrada dice «se cerró desde otro dispositivo» — Mejora importante

- **Dónde:** `src/server/modules/sign-in/sessions/cookie.ts:17` (`Max-Age` = 8 horas),
  `sessions/require.ts:11-16` (sin cookie: `reason: 'unknown'`),
  `src/app/modules/sign-in/screens/Entrance/Notices.tsx:9` y `:27`.
- **Qué dicen los documentos:** R3.5: ese texto, **solo** si la sesión la cerró otro dispositivo.
- **Qué hace el código:** a las 8 horas el navegador borra la cookie y el servidor contesta
  `session-closed` con `unknown`; la entrada muestra «Tu sesión se cerró desde otro dispositivo»,
  porque solo `idle` y `max-age` cuentan como vencida. Pasa lo mismo con `deactivated`.

### 1.10 La cámara deja de leer después de un QR ajeno — Mejora importante

- **Dónde:** `src/app/modules/sign-in/scanner.ts:44-49` y `screens/Sheets/Camera.tsx:23-27`.
- **Qué hace el código:** cuando lee cualquier texto, el lector avisa y no vuelve a programar la
  lectura siguiente; `Camera` descarta lo que no es de Ferrebress. Después de apuntar a otro QR (el de
  un producto, uno de Mercado Pago), la cámara sigue prendida pero no lee nada más: hay que cerrarla y
  abrirla de nuevo. La prueba de `browser.test.ts` no cubre este caso.

### 1.11 E39 cambió y el código no lo tiene — Pendiente

El commit `cc42f85`, posterior al código, cambió R7.2 y E39: «Ver el manual» con «Pronto» en la
entrada de la computadora. La maqueta dice «para aprobar». Cuando Carlos la apruebe, el código y su
prueba quedan atrás; hoy tampoco hay ninguna prueba que nombre la versión anterior de E39.

### 1.12 Pruebas cuyo nombre promete más de lo que comprueban — Mejora

- `src/app/modules/sign-in/entrance.test.tsx:113` «01-E02: … **y la nota se va**»: no comprueba la
  nota (la esconde el CSS con `:has`, que happy-dom no evalúa).
- `src/app/platform/api.test.ts:51` «app-E24 y E26»: solo mira el valor `online`; E24 pide la
  pantalla gris, que se pueda leer y que solo deje salir.
- `src/app/ui/ui.test.tsx` «app-E18» prueba la pieza `Say`, no un botón en los dos anchos.
- `src/server/modules/sign-in/codes/codes.test.ts` «sign-in-E16c» prueba «No soy yo», no que el
  celular que no vincula la huella diga que se puede entrar con Google.
- E41 y E42 están probados (`google.test.ts`, la cookie `HttpOnly`; `http.test.ts`, otro origen) pero
  sin su nombre. E44 no tiene prueba con su nombre y la auditoría tiene huecos (punto 5.3).
- `tests/e2e/qr.spec.ts:1` dice cubrir E16, pero el celular ya tiene sesión: prueba E13. El diseño
  (§ 12, 3) pide que esa prueba compruebe también la misma red y la reserva; no lo hace.

## 2. Comentarios de cabecera y carpetas

- **`src/app/platform/device.ts:1-2`, comentario roto:** «su identificador, que se guarda la primera
  vez; si es un / y si es un celular.» — Mejora.
- **Referencias equivocadas:** `src/app/modules/sign-in/useSignIn.ts:1` y
  `screens/Entrance/Buttons.tsx:1` citan R2.3 para la huella (es R2.2; R2.3 es «un celular, una
  cuenta»). `notice.ts:1` cita R3.4, que se resuelve en `Notices.tsx`, no ahí. — Mejora.
- **`src/server/pg-probe.mjs`:** una medición de PGlite que quedó en el código, sin comentario y que
  nadie usa. — Mejora (se borra).
- **Carpetas:**
  - `src/app/modules/sign-in/` tiene 11 archivos de código sueltos. Lo del código QR (`qr.ts`,
    `scanner.ts`, `useComputerCode.ts`, `usePhoneCode.ts`) es un concepto, `codes/`, como en el
    servidor; la huella (`webauthn.ts`) y la sesión (`session.ts`), otros dos. — Mejora.
  - `screens/Entrance/` tiene 18 archivos, cerca del tope de 20: «Entrando» (`Entering.tsx`,
    `entering.css`, `entering-card.css`) puede ir en su propia carpeta. — Mejora.
  - `src/app/modules/frame/`: los cuatro `use*.ts` son del comportamiento del marco y pueden ir juntos.
    — Mejora.
- El resto de las cabeceras que leí dice de qué se encarga cada archivo y sigue siendo cierto.

## 3. Pruebas que miran por dentro

Rompen con un refactor sin que cambie nada de lo que ve la persona (constitución VII). Todas son Mejora.

- `src/app/modules/sign-in/session.test.ts`: comprueba las claves internas de `localStorage`
  (`'session'`, `'pending-sign-out'`) en lugar de lo que pasa al abrir de nuevo la aplicación.
- `src/app/App.test.tsx:42`: siembra `store('pending-sign-out', …)`, la clave interna.
- `src/app/modules/sign-in/logic.test.ts` y `codes.test.ts`: prueban `noticeOf`, `useNotice`,
  `minutes`, `enteringWith`, `withGoogle`, `usePhoneCode` y `useComputerCode` por dentro, y leen los
  valores internos `hasPasskey`, `offerPasskey` y `person`. Lo mismo `sheets.test.tsx` con
  `offerPasskey` y `wasOffered`.
- `src/app/modules/frame/notices/notices.test.tsx`: `crash`, `reportCrash`, `updateOnOpen` y la clave
  `'crash-report'`.
- `src/server/modules/sign-in/codes/screens.test.ts` (`createScreens`) y `device.test.ts`
  (`deviceLabel`, `isPhone`) prueban piezas internas que se pueden probar por la API.
- `src/server/modules/sign-in/codes/edges.test.ts:88` da de baja con SQL en lugar de
  `users.deactivate`, la fachada que existe y publica el evento.
- Bien: `rules.test.ts` (la regla sin tecnología, con fechas fijas) y el SQL de `sessions.test.ts` para
  E40, que pide justamente mirar la base.

## 4. El diseño

### 4.1 No hay ninguna prueba que cuente las consultas — Frena

- **Qué dicen los documentos:** diseño § 12, «Cuántas consultas, con una prueba por pedido»;
  constitución, paso 6.
- **Qué hace el código:** no hay ninguna (busqué contadores y registros de consultas en todo
  `src/server`). Leyendo el código, dos pedidos no cumplen la tabla:
  - `GET /api/start` con la sesión en memoria hace **1** consulta (`ctx.users.findById`,
    `google/routes.ts:34`); la tabla dice 0. Es el pedido que se hace cada vez que se abre la
    aplicación.
  - Entrar con Google en un celular hace **hasta 4** (`findGoogleCandidates`, `linkGoogle`, crear la
    sesión y `findActiveByDevice`, `google/routes.ts:79-102`); la tabla dice hasta 3.
  - Leer un código hace hasta 3 (`optionalSession`, `findActiveByDevice`, `findById` en
    `registrationOptions`) y la tabla no lo nombra.

### 4.2 El peso del arranque no se controla — Mejora importante

Diseño § 10: «por debajo de 60 KB comprimido; lo controla `pnpm check`». Ningún control de `tools/`
ni de `pnpm check` mide el paquete. Medido a mano: `main.js` 36,6 KB y `main.css` 10,0 KB con gzip,
dentro de la meta.

### 4.3 Las pruebas unitarias tardan más de 30 segundos — Mejora importante

Constitución VII: «todas juntas en menos de 30 segundos». `pnpm test` tardó 31,9 s y 33,9 s dentro de
`pnpm check`, en una máquina de 4 núcleos. Vitest sugiere crear happy-dom una vez por proceso (23
veces, 9,4 s).

### 4.4 Otras diferencias con el diseño — Mejora

- **«Quién es» en la plataforma:** el diseño (§ 6) dice que `sign-in` registra en `platform/http` la
  función que responde quién es, y que la consulta trae también si la persona sigue activa. El código
  llama a `requireSession` y `optionalSession` en cada ruta (`sessions/require.ts`), y
  `findByTokenHash` (`sessions/data.ts:71-72`) no mira `users.active`; `/api/start` devuelve la persona
  sin mirar si está activa (`google/routes.ts:33-35`). Hoy la baja cierra las sesiones por el evento,
  pero una baja hecha en la base (el camino de hasta el módulo 02) deja las sesiones abiertas.
- **`platform/realtime` del servidor:** el diseño (§ 2) lo nombra; no existe (el canal está en
  `codes/computer-routes.ts`). Existen `one-use`, `events`, `ids` y `settings`, que el diseño no nombra.
- **`platform/device` de la aplicación:** el diseño (§ 10) dice que da también «si tiene cámara y el
  nombre «Chrome en Windows»»; el nombre lo arma el servidor (como dice § 5) y lo de la cámara no está.
- **`platform/router`:** «cada módulo registra sus direcciones y el marco muestra la que coincide»
  (§ 10). `match` y `Route` existen, pero nadie los usa: el marco no mira la dirección.
- **Es un celular:** el diseño (§ 5) dice «si el navegador es de Android»; el código acepta también
  iPhone (`src/server/modules/sign-in/device.ts:28-29`, `src/app/platform/device.ts:19-21`).
- **`X-App-Version`:** el diseño (§ 4) dice que es la versión de la aplicación; el código manda la
  versión del contrato (`contractVersion = 1`). Tiene sentido, pero el diseño no lo dice.
- **Tamaños de los campos:** el diseño (§ 4) pide 8 KB como máximo para una respuesta de la huella;
  `webAuthnResponse` (`src/shared/contracts/sign-in.ts:34`) no tiene tope propio (queda el de 64 KB).
- **El límite de la huella por dispositivo (R2.9)** no se aplica en `codes/approve`, que también
  verifica una huella; el límite por cuenta sí.

## 5. Seguridad (la sección «Seguridad» del diseño)

Hecho como dice el diseño: la cookie `__Host-session` (`HttpOnly`, `Secure`, `SameSite=Strict`,
`Max-Age`); el origen exigido en todo lo que no es `GET`, `Content-Type`, sin CORS y `no-store`; el pase
de Google (firma, emisor, público, correo verificado, `nonce` de un uso); la huella con verificación,
`rpId`, origen y contador; el código de 128 bits después del `#`, la reserva con secreto y desafío
propio, el permiso de 30 s atado a la cookie de la pantalla, la misma red al leer y al aprobar; los
topes por dirección; la dirección real solo desde Caddy; los pases solo como hash; el emisor de prueba
solo con `e2e`; las cabeceras y la política de contenido de Caddy, con la excepción solo en
`/google-button.html`; `noDangerouslySetInnerHtml` en Biome; el service worker sin tocar `/api` ni el
marco de Google.

### 5.1 Un cuerpo vacío o con JSON roto da 500 — Mejora importante

- **Dónde:** todas las rutas con cuerpo hacen `await c.req.json()` sin atrapar (por ejemplo
  `sessions/routes.ts:12`, `google/routes.ts:43`, `codes/phone-routes.ts:25`).
- **Diseño:** § 4, `bad-request` para forma, tamaño u origen; § 12, una prueba para «un pedido sin
  cuerpo».
- **Comprobado:** `POST /api/sign-out` con cuerpo `""` o `"{"` y las cabeceras correctas devuelve
  `500 {"error":"unexpected"}`, escribe el error completo en la consola y no queda en la auditoría como
  `request.rejected`.

### 5.2 `X-App-Version` y `X-Device-Id` se pueden omitir — Mejora

`src/server/platform/http.ts:99-101`: sin `X-App-Version`, o con un valor que no es un número, el
pedido pasa (`Number(undefined) < 1` es falso); lo comprobé con `abc` y sin cabecera. Sin
`X-Device-Id` también pasa. El diseño (§ 4): «tiene que ser un UUID y una versión; si no, se rechaza».

### 5.3 La auditoría tiene huecos (E44) — Mejora importante

- **Diseño § 9:** `sign-in.rejected` también para «código vencido, usado o de otra pantalla»;
  `sign-out` sin conexión «con la hora en que tocó y la hora en que llegó»; `session.ended` cuando
  vence.
- **Código:**
  - `codes/phone-routes.ts:29-30`: leer un código vencido o usado no se anota.
  - `codes/approve.ts:41-46`: aprobar con la reserva vencida, desde otra red o con la firma de otro
    desafío no se anota.
  - `signOutBody` (`src/shared/contracts/sign-in.ts:15-17`) no lleva la hora del dispositivo y
    `sessions/routes.ts:41` anota solo `{ pending: true }`.
  - La limpieza diaria (`sessions/data.ts:114-126`, `store.ts:123-126`) cierra las sesiones vencidas
    sin anotar `session.ended`, y no las saca de la memoria.

### 5.4 La página se puede guardar en el navegador — Mejora importante (no comprobado en Caddy)

`deploy/Caddyfile`: `@fresh path /index.html …` pone `Cache-Control: no-cache`, pero la página se pide
como `/` o `/link`, y `header` corre antes que `try_files` (orden de directivas de Caddy), así que esas
direcciones no lo llevan. Sin esa cabecera, el navegador puede guardar la página por su cuenta y
recargar trae la vieja, en contra de 00 · R5.2 y del diseño (§ 10: «Caddy sirve la página … sin que el
navegador los guarde»). `tests/e2e/headers.spec.ts` no mira `Cache-Control`. No lo pude comprobar
corriendo Caddy.

### 5.5 Las sentencias para un celular perdido no están — Mejora importante

El diseño (§ 6 y § 14) dice que `deploy/oracle/README.md` tiene las dos sentencias para cerrar las
sesiones y quitar la huella si se pierde un celular, hasta el módulo 02. El README no las tiene. Hoy es
la única forma de cerrar a distancia (R3.1).

### 5.6 Menores — Mejora

- Con demasiados intentos, el botón de Google queda apagado solo con `pointer-events: none`
  (`Entrance.css:90-94`): se llega a él con Tab y Enter. El servidor igual frena.
- `codes/approve.ts:73`: si ya hay un permiso sin usar para esa pantalla (`maxPerOwner: 1`), `issue`
  devuelve `undefined`, y se manda `{ type: 'approved', permit: undefined }` como si fuera un permiso.
- Si falla `navigator.serviceWorker.register` (`src/app/main.tsx:11-12`), el rechazo sin atrapar abre
  «Algo salió mal» (me pasó al capturar). Es un fallo que a la persona no le importa.

## 6. Reglas inventadas

Textos y comportamientos que no están en las reglas, en `screens.md` ni en las maquetas. Todas son
Mejora: o se escriben donde corresponde, o se sacan.

- «Tu sesión venció» y «Entrá de nuevo para seguir donde estabas»: la maqueta tiene el segundo; la
  diferencia entre vencida y cerrada desde otro lado (`Notices.tsx:9`) no está en ninguna regla.
- «Pasó mucho tiempo desde que se abrió la entrada: tocá «Continuar con Google» otra vez.»
  (`texts.ts:57`): el diseño dice qué pasa, pero no el texto.
- «Ese código ya no sirve: leé el que muestra la computadora ahora.»: es también lo que ve un celular
  frenado por intentos o una cuenta dada de baja al aprobar (`usePhoneCode.ts:30` y `:59-60`); E03
  pide el mismo mensaje que una no autorizada.
- «No se pudo abrir la cámara. Podés leer el código con la cámara del celular.»
- «Esta computadora» en la entrada; la maqueta dice «Computadora del mostrador».
- La oferta de la huella se recuerda por dispositivo (`passkey-offered`), no por persona: si una
  persona dijo «Ahora no», a otra que entra después en ese celular nunca se le ofrece. R2.2 dice «la
  primera vez que alguien entra».

## 7. Simpleza y repetición

Todas son Mejora.

- **Abrir una sesión, cuatro veces:** `store.create` + `writeSessionCookie` + `sign-in.succeeded` con
  la dirección y el nombre del dispositivo, repetido en `google/routes.ts:91-99`,
  `passkeys/sign-in-routes.ts:70-79`, `codes/approve.ts:121-130` y `codes/computer-routes.ts:69-80`.
  Lo mismo `isProofKey(Buffer.from(x, 'base64url'))`, cuatro veces.
- **La forma de la API, repetida:** `ApproveBody` está en `codes/approve.ts:27-32` y en
  `src/app/modules/sign-in/api.ts:13-18`, aparte del contrato `approveCodeBody`; el mensaje que firma la
  salida pendiente (`sign-out:<id>`) está en `sessions/proof.ts:25` y escrito a mano en
  `src/app/modules/sign-in/session.ts:39`; los 60 s del código, en `settings.ts` y en
  `QrBlock.tsx:12`. La constitución (XII.3) pide la forma de la API una sola vez en `src/shared/`.
- **Código que nadie usa:** `serverNow` (`src/app/platform/clock.ts`), `match`/`Route`
  (`platform/router.ts`), el valor `environment` de `platform/api.ts:24` (se escribe y nunca se lee),
  `ScreenEventName` (`contracts/sign-in.ts:69`), `holdSeconds` en la respuesta de leer un código y
  `pg-probe.mjs`.
- **Números sueltos:** `ctx.tooMany(c, 60_000)` en `passkeys/link-routes.ts:29`, donde las demás rutas
  usan los plazos de `settings.ts`.
- **El glosario:** dice «Código de entrada» `signInCode` y «Entrar con el celular» `phoneSignIn`, que
  el código no usa; el código usa `screen`, `reservation` y `permit`, que el glosario no tiene.
- **`as never`** en `context.ts:31` para pasar un evento a la auditoría esconde el tipo que la
  auditoría espera.

## 8. Documentación que quedó atrás

Cosas que hace el código y que otro agente no reconstruiría leyendo solo `docs/`. Todas son Mejora.

- Los textos del punto 6 y la elección de «Esta computadora».
- Que el botón de Google no tiene tecla ni marca (punto 9.3).
- `X-App-Version` es la versión del contrato, un número, y cuándo sube (punto 4.4).
- Que «Entrando» se ve pasados 300 ms y que la entrada tapa con él la tarjeta en la computadora y la
  pantalla entera en el celular: está en `screens.md`, pero no que el `Entering` del celular se dibuja
  aparte (`Entrance.tsx:67`).
- Que el lector del QR lee un cuadro cada 250 ms y el botón de Google se da por dibujado a los 3 s.
- La retención de «Algo salió mal» (un solo aviso, con la captura en `localStorage`).
- El diseño § 2 (lo que hay en cada plataforma) y § 10 (`platform/device`, `platform/router`), punto
  4.4.

## 9. Pantallas

Comparé con capturas propias la entrada (computadora a 1536 y 1366 px, celular a 390 px) y el marco
(computadora y celular). El marco se ve igual que `app-frame/final/` en los dos anchos; la entrada del
celular, igual que `sign-in/adapted/` salvo Google, que no pude dibujar (punto «Lo que no pude
comprobar»).

### 9.1 La cuenta regresiva arranca en 1:01 — Mejora

`src/app/modules/sign-in/screens/Entrance/QrBlock.tsx:14-21`: `now` se toma al montar y `since` al
llegar el código, después; la resta da negativa y `floor` la lleva a −1. Durante hasta un segundo,
cada vez que llega un código, dice «Cambia en 1:01» (se ve en la captura). La maqueta dice 1:00.

### 9.2 «Esta computadora» — Mejora

La entrada de la computadora dice «Esta computadora» arriba a la derecha; la maqueta,
`sign-in/adapted/index.html:51`, «Computadora del mostrador». Si es a propósito (todavía no hay nombres
de dispositivo), falta escribirlo.

### 9.3 Google sin tecla ni marca — Mejora

La maqueta tiene «Continuar con Google» con `data-mark` y Alt G (`sign-in/adapted/index.html:86-88`) y
00 · R2.8 pide una tecla para todo botón. En el código, el botón vive en un marco de otra página (la
excepción de la política de contenido) y no tiene tecla ni lo recorren las flechas. Puede ser una
excepción razonable, pero no está escrita en ningún documento.

### 9.4 Lo de la ventana angosta — ver 1.3

## Lo que no pude comprobar

- Las pruebas de punta a punta: no las corrí (así me lo pidieron). No sé si las cuatro pasan ni cuánto
  tardan.
- El botón de Google real dibujado en la entrada: en mis capturas el script de Google estaba bloqueado.
- Las cabeceras reales de Caddy (punto 5.4): lo deduje del orden de directivas, sin levantar Caddy.
- La entrada en el celular de verdad (la huella, la cámara, la dirección del QR abierta desde la cámara
  del sistema).
- No comparé con capturas «Entrando», las hojas del celular, Más en el celular, el menú minimizado, las
  teclas con Alt ni los avisos de `app-notices/final/` (la versión nueva, el bloqueo, la espera y «Algo
  salió mal», que vi solo como efecto de los errores de arriba).
- Que la dirección real llegue a la auditoría en la máquina (diseño § 14).
