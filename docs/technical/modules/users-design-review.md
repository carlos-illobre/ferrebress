# Revisión del diseño técnico · 02 · Personas (`users`), etapa a

Revisión independiente del [diseño](users.md) (constitución, paso 4), hecha con los documentos: la
constitución, el [capítulo 02](../../chapters/02-users/rules.md) (R1 a R6, E01 a E32), su
`summary.md` y `screens.md`, las maquetas aprobadas (`users-a/final/desktop/`, `final/phone/`,
`final/shared/` y `final/changes.md`), el [capítulo 01](../../chapters/01-sign-in/rules.md) y el
[15](../../chapters/15-offline/rules.md) en lo que toca (01 · R1.2 a R1.4, R3.5; 15 · R1.5), la
[arquitectura](../architecture.md), el ADR-001, el ADR-002, [mobile-data.md](../mobile-data.md) y
el [diseño de 01](sign-in.md). Como el diseño cambia tablas y rutas que ya existen, miré el código
de hoy en lo que dice reusar o cambiar: `src/server/modules/users/` entero; de
`src/server/modules/sign-in/`, `index.ts`, `context.ts`, las dos migraciones, `sessions/`
(`store.ts`, `data.ts`, `open.ts`, `require.ts`), `passkeys/data.ts`, `offline/routes.ts`,
`offline/phone-owner.ts`, `google/routes.ts` y `device.ts`; `platform/http.ts`, `modules.ts`,
`events.ts`, `guards.ts`, `config.ts` y `storage/audit.ts`; `src/server/main.ts`,
`src/server/testing/config.ts`, `tests/e2e/stack/start.ts`, `deploy/server.Dockerfile`,
`deploy/oracle/install.sh` y, en la aplicación, `platform/server/api.ts` y
`modules/sign-in/offline/watch.ts`.

Cada punto dice dónde está, qué propone el diseño, qué veo y qué tan grave es:

- **Frena:** hay que resolverlo antes de que Carlos lo apruebe.
- **Mejora:** conviene hacerlo, pero no frena.

## Resumen

El diseño es corto y la división está bien pensada: las personas en `users`, las sesiones y huellas
en `sign-in`, sin ciclos, la versión por fila para E30 y la transacción con bloqueo para R1.3. Lo que
frena está casi todo **en el borde con `sign-in`**, que el diseño cambia sin mirar lo que ese módulo
guarda en memoria. Mover el nombre de Google a `google_name` hace que `sign-in` muestre el correo
de todos, porque su `person()` arma el nombre con `name ?? email`; renombrar no llega a la persona
que `sign-in` tiene en memoria; y quitar una huella, cortar un celular o dar de baja no actualiza de
quién es la huella de cada celular, que también está en memoria (`phoneOwners`). Con eso, «Trabajar
sin conexión» se vuelve a prender en el celular cortado y quien es dado de alta no puede volver a
vincular la huella (E19, E26, E31). Las rutas de `users` piden `requireSession`, que vive dentro de
`sign-in`: `users` no puede usarlo sin crear el ciclo que el diseño dice evitar. Cambiar el correo
o borrar mientras la persona entra con Google deja entrar con un correo que ya no figura (R3.6). Sin
`INITIAL_ADMIN_EMAIL`, las pruebas de punta a punta se quedan sin persona, porque su base vive en la
memoria del servidor y el comando no la alcanza. Y la prueba de E05 con PGlite no prueba nada.
Frenan también cosas chicas de corregir: `PATCH` y `DELETE` no los manda la aplicación ni los deja
pasar el servidor sin cuerpo; el identificador de una huella no es un UUID; las metas de consultas
no cierran; y faltan datos que muestra la maqueta aprobada.

| # | Punto | Gravedad |
|---|---|---|
| 1.1 | El nombre que muestra `sign-in` sale de `name`: con la migración, todos pasan a verse con su correo | Frena |
| 1.2 | Renombrar no actualiza la persona que `sign-in` tiene en memoria | Frena |
| 1.3 | Quitar, cortar y dar de baja no actualizan `phoneOwners`: vuelve «Trabajar sin conexión» y no se ofrece vincular | Frena |
| 1.4 | Cambiar el correo o borrar a la vez que la persona entra con Google | Frena |
| 1.5 | Sin `INITIAL_ADMIN_EMAIL`, las pruebas de punta a punta no tienen cómo cargar a nadie | Frena |
| 1.6 | La prueba de E05 corre en PGlite, que no tiene dos transacciones a la vez | Frena |
| 1.7 | Lo que la maqueta aprobada muestra y la API no da | Frena |
| 1.8 | «Se perdió un celular»: el diseño saca a quien pregunta; la regla solo saca su celular en uso | Frena |
| 1.9 | Los contadores de la tarjeta cerrada no dicen qué excluyen | Mejora |
| 1.10 | Una entrada sin conexión que se confirma sin abrir sesión no cuenta como «entró», y no dice qué hora vale | Mejora |
| 1.11 | E03: la aplicación «ni ofrece el botón», pero tiene que decir por qué | Mejora |
| 1.12 | «No había nada que cortar»: ¿`404` o respuesta normal? | Mejora |
| 1.13 | La migración deja «Todavía no entró» a quien entró hace más de 30 días | Mejora |
| 1.14 | E24 y E18 se apoyan en lo que ya hace 01, sin decirlo | Mejora |
| 2.1 | Las metas de «cada cambio» y de la baja no cierran con las consultas que hacen | Frena |
| 2.2 | Rutas sin meta: «Se perdió un celular», «Cortar», «Cerrar», «Cerrar todas», «Quitar» | Mejora |
| 2.3 | El último uso «de la memoria del servidor» en un `count`: cuesta una escritura que no está contada | Mejora |
| 2.4 | El índice nuevo de `sessions` no hace falta | Mejora |
| 2.5 | La meta se mide con 50 personas; el techo de la constitución es 100 | Mejora |
| 3.1 | `PATCH` y `DELETE ?version=`: la aplicación solo manda `GET` y `POST`, y el servidor exige cuerpo JSON en `DELETE` | Frena |
| 3.2 | «Quitar» y «Cortar» son la misma operación con dos rutas | Mejora |
| 3.3 | `way` repite `data.method`, que `openSession` ya recibe | Mejora |
| 3.4 | `way` y `is_phone` nulos para siempre por sesiones que duran 8 horas | Mejora |
| 3.5 | «Eventos» y «auditoría» mezclados en § 9 | Mejora |
| 3.6 | «Separadas como la entrada» choca con ADR-002 si quiere decir dos pantallas | Frena |
| 4.1 | El nombre que se muestra se calcula en dos módulos | Frena (va con 1.1) |
| 4.2 | Cerrar las de una persona en un celular y revocar su huella ya existen | Mejora |
| 5.1 | El identificador de una huella no es un UUID | Frena |
| 5.2 | «El límite de los pedidos con sesión que ya existe» no existe | Frena |
| 5.3 | La auditoría: dónde va «a quién», cuándo se anota y las líneas dobles | Mejora |
| 5.4 | El comando del primer Administrador: ruta del archivo, carrera y auditoría | Mejora |
| 5.5 | `POST /api/sessions/:id/close` no nombra a la persona: el control de § 10 no aplica | Mejora |
| 5.6 | La lista de «Se perdió un celular» expone el identificador del dispositivo | Mejora |
| 6.1 | `requireSession` está en `sign-in`: `users` no lo puede usar sin el ciclo | Frena |
| 6.2 | El puerto `accessCounts` se conecta solo en `main.ts`, que no tiene cobertura | Mejora |
| 7.1 | ¿Usuarios pide la lista sola al volver la conexión? Entonces va en `mobile-data.md` | Frena |
| 7.2 | «Entró hace 3 días» con qué reloj | Mejora |
| 7.3 | Escala | Sin observaciones |
| 8.x | Mejoras | Mejora |

## 1. Escenarios sin cubrir

### 1.1 El nombre que muestra `sign-in` sale de `name` (Frena)

- **Dónde:** § 2, `users.users` («lo que hay hoy en `name` se pasa a `google_name` … y `name` queda
  nulo»), y § 1 («Lo que cambia en el 01»).
- **Qué propone:** `name` pasa a ser el nombre escrito; el de Google, a `google_name`.
- **Qué veo:** `sign-in/context.ts` arma la persona que ve la aplicación (cabecera, `/api/start`, la
  opción sin conexión) con `name: user.name ?? user.email`, y el `User` de la fachada no trae
  `google_name`. Con la migración, todas las personas pasan a mostrarse con su correo en todo el
  sistema, contra R3.4 y E12. «Lo que cambia en el 01» no lo nombra.
- **Qué falta:** que el `User` de la fachada traiga el nombre que se muestra ya calculado (o
  `googleName`), y que § 1 diga que `person()` de `sign-in` cambia. Ver 4.1.

### 1.2 Renombrar no llega a la persona que `sign-in` tiene en memoria (Frena)

- **Dónde:** § 6 («Autorizar», «Cambiar»), § 9 (`user.renamed`).
- **Qué propone:** `PATCH /api/users/:id` cambia el nombre en la base.
- **Qué veo:** `sign-in` guarda en memoria quién es cada persona con sesión (`createPeople` en
  `context.ts`); su comentario dice que «el nombre cambia solo al entrar con Google». Después de
  renombrar, `/api/start` sigue devolviendo el nombre viejo a todos sus dispositivos hasta que el
  servidor se reinicie. Lo mismo con el correo (que cambia solo si nunca entró, así que no hay
  sesión: ahí no pasa).
- **Qué propongo:** que `user.renamed` sea un evento de verdad (no solo una línea de auditoría) y que
  `sign-in` lo escuche y llame a `people.forget(userId)`, como ya hace con `user.deactivated`. Es el
  patrón de eventos de la constitución, sin que `users` conozca a `sign-in`.

### 1.3 Quitar, cortar y dar de baja no actualizan `phoneOwners` (Frena)

- **Dónde:** § 6 («Dar de baja», «Cerrar, Cerrar todas, Quitar y Cortar»), que solo dice «la caché
  de sesiones del servidor se entera en el momento».
- **Qué veo:** además de las sesiones, `sign-in` guarda en memoria de quién es la huella de cada
  celular (`ctx.phoneOwners`, que lee `ownerOf` en `offline/phone-owner.ts`). Solo vincular la
  actualiza (`webauthn.ts`). Si se quita la huella y no se toca ese mapa:
  - `withOffline` sigue diciendo `offline: true` a ese celular cuando vuelve a entrar con Google:
    el `revoked` de la sesión cortada (`watch.ts`, `revokeOffline`) frena hasta el próximo contacto,
    y en ese contacto el servidor le vuelve a prender «Trabajar sin conexión». Va contra R5.6, E26,
    E31 y 15 · R1.5. La confirmación posterior sí se rechaza (`findActive` va a la base, E27 se
    cumple), pero la persona ve la huella prendida en la entrada sin conexión y no le anda.
  - Al entrar con Google, `offerPasskey` sale de `ownerOf`: con el dueño viejo en memoria, no se le
    ofrece vincular la huella, y quien fue dado de alta no la puede vincular de nuevo (R4.2, E19).
- **Qué falta:** que cada camino que revoca una huella (Quitar, Cortar y la baja dentro de
  `user.deactivated`) borre la entrada de `phoneOwners` de ese celular, y que § 12 tenga la prueba:
  quitar la huella y después `/api/start` desde ese celular no trae `offline`; entrar con Google
  después de quitarla ofrece vincular.

### 1.4 Cambiar el correo o borrar mientras la persona entra (Frena)

- **Dónde:** § 2 («Nunca entró»), § 4 (`PATCH` y `DELETE`, `409 already-entered`), § 5.
- **Qué propone:** el correo se cambia y la persona se borra solo si nunca entró; la `version`
  protege contra lo que cambió otra persona.
- **Qué veo:** entrar con Google no pasa por la `version`: `linkGoogle` y `recordSignIn` escriben sin
  mirarla, y el diseño no dice si la suben. Si el control de «nunca entró» se hace leyendo la fila y
  después escribiendo, una persona que entra con Google con su correo viejo justo mientras le
  cambian el correo queda con `google_subject` atado y el correo nuevo: entra con una cuenta cuyo
  correo ya no figura, lo que R3.6 quiere evitar. Con borrar es peor: queda una sesión abierta de una
  persona que ya no existe, y `createPeople.of` hace `findById(...) as User` con un `undefined`.
- **Qué propongo:** que el control esté en el `where` de la misma consulta (`where id = ? and
  version = ? and google_subject is null`), y que `linkGoogle` también exija que la fila siga
  existiendo con ese correo (ya lo hace por `id`; con el borrado, la actualización no toca nada y
  `matchGoogle` tiene que devolver «no autorizada»). No conviene que entrar suba la `version`: cada
  entrada haría saltar «Cambió mientras la mirabas» a quien está renombrando a otro.

### 1.5 Sin `INITIAL_ADMIN_EMAIL`, las pruebas de punta a punta no tienen a nadie (Frena)

- **Dónde:** § 7 («Las pruebas cargan a sus personas como hoy, con la base de prueba»).
- **Qué veo:** las unitarias sí insertan directo en PGlite (`users.test.ts`). Pero las de punta a
  punta (`tests/e2e/stack/start.ts`) levantan `node src/server/main.ts` con `DATABASE_URL=memory://`
  e `INITIAL_ADMIN_EMAIL`: la base vive dentro de ese proceso, y el comando nuevo abriría otra base
  en memoria, vacía y aparte. Sin la variable, ninguna prueba de punta a punta puede entrar.
- **Opciones:** (a) que el arranque con `ENVIRONMENT=e2e` (que ya exige `memory://`) cargue a la
  persona de prueba desde una variable propia de ese ambiente, que `readConfig` rechace en los
  demás; (b) una ruta solo de `e2e` para cargarla, con el mismo control; (c) que las de punta a
  punta usen PostgreSQL del compose y corran el comando. La (a) es la más chica y no abre nada en
  producción. Lo que se elija tiene que quedar en § 7.

### 1.6 La prueba de E05 corre en PGlite (Frena)

- **Dónde:** § 5 («Nunca sin Administrador activo»), § 12 (E03 a E05: «dos bajas a la vez, con la
  base de prueba, guardan una sola»).
- **Qué propone:** `select … where active for update`, contar, y recién entonces cambiar.
- **Qué veo:** el bloqueo es correcto en PostgreSQL con `read committed` (la segunda transacción, al
  destrabarse, vuelve a evaluar el `where active` y ya no ve a la persona dada de baja). Pero la base
  de prueba es PGlite (`testing/config.ts`, `memory://`), que atiende una conexión: las dos
  transacciones corren una detrás de la otra y la prueba pasa aunque se borre el `for update`. R1.3 y
  E05 piden explícitamente el caso «al mismo tiempo»; la prueba de § 12 no lo comprueba.
- **Opciones:** (a) probar el bloqueo contra PostgreSQL de verdad, fuera de las unitarias (la
  constitución pide unitarias sin Docker; esta iría en una prueba aparte que corre antes de cerrar
  el módulo, y hay que decir cuál); (b) dejar la unitaria por la regla (sin el bloqueo, con una
  sola baja, el control de «quedaría sin nadie» igual tiene que estar) y decir en § 12 que el «a la
  vez» no se prueba con PGlite y por qué. Lo que no puede quedar es una prueba que dice probar E05 y
  no lo prueba.
- **De paso:** como nadie se da de baja a sí mismo y quien da de baja tiene sesión (y está activo),
  `last-administrator` solo puede salir en la carrera de E05. Conviene que § 5 lo diga, para que no
  se lo busque en otro caso. Y el bloqueo al borrar sobra por lo mismo: quien borra está activo y no
  se borra a sí mismo (no puede: nunca entró), salvo que lo estén dando de baja a la vez, que ya cubre
  el bloqueo de la baja.

### 1.7 Lo que la maqueta aprobada muestra y la API no da (Frena)

- **Dónde:** § 4, `GET /api/users` («nombre que se muestra, correo, activa, cuándo entró, si nunca
  entró, versión, y cuántas…»).
- **Qué veo**, en `final/shared/data.js` y `v1.js`:
  - **«Autorizada el 03/08/2026»** en cada tarjeta: sale de `created_at`, que § 2 nombra pero
    `GET /api/users` no devuelve.
  - **«Desde la instalación»** para el primer Administrador: no hay nada que lo distinga de otra
    persona autorizada.
  - **«Dada de baja hoy» y «Dada de alta de nuevo hoy»:** la fecha de la baja o del alta, que no
    tiene columna. La constitución (V) dice que la historia vive en la auditoría, así que guardar
    `status_changed_at` es una decisión; la alternativa es mostrar solo «Dada de baja» sin fecha.
    Hay que elegir y, si se saca, decírselo a Carlos porque la maqueta está aprobada.
  - **Cambiar el nombre** necesita saber si hay un nombre escrito: el campo arranca vacío si no lo
    hay, y «borrarlo vuelve al de Google» (R3.5). Con solo «el nombre que se muestra», la pantalla
    llenaría el campo con el de Google y, al guardar, lo convertiría en escrito. La API tiene que
    devolver el nombre escrito aparte (o un `nameIsWritten`).
  - **Los filtros** «Todas · Activas · Sin entrar · De baja» con sus números y el buscador: R3.1 lo
    deja al diseño; se pueden hacer en la aplicación con la lista entera, pero § 8 solo nombra `/`.
  - **El orden** de R3.1 (propia, activas, dadas de baja, cada grupo por nombre que se muestra): no
    dice si lo da el servidor o la aplicación.
- **Qué falta:** la forma de la respuesta en `src/shared/contracts/` con esos campos.

### 1.8 «Se perdió un celular» y los celulares propios (Frena)

- **Dónde:** § 4, `GET /api/lost-phones` («… sin el que pregunta»).
- **Qué dice la regla:** R5.7, «también los propios, salvo el que se está usando»; la maqueta lo
  hace así (`celulares(p)` saca solo el celular de la sesión en uso, y lista «(vos)»).
- **Qué veo:** «sin el que pregunta» se lee como «sin la persona que pregunta». Si es así, falta
  justo el caso de R5.4 y R5.7: perdí mi celular y corto desde la computadora. Hay que escribir «sin
  el celular de la sesión que pregunta» y que `POST /api/lost-phones/cut` rechace ese mismo celular
  (si no, cortar el propio en uso cierra la sesión desde la que se corta).

### 1.9 Los contadores de la tarjeta cerrada (Mejora)

- **Dónde:** § 4, `GET /api/users` («cuántas sesiones abiertas y celulares con huella tiene»).
- **Qué veo:** R5.2 y R5.5 sacan de la tarjeta propia la sesión en uso y los celulares propios; la
  maqueta (`changes.md`) dice que «los contadores del renglón y "Cerrar todas" cuentan solo lo que se
  ve». La ruta de la tarjeta (`/access`) lo dice; la de la lista no. Si no se excluyen, el renglón
  propio dice «2 sesiones» y la tarjeta abierta muestra una. Que el puerto `accessCounts` reciba la
  sesión de quien pregunta.

### 1.10 La entrada sin conexión y «la última vez que entró» (Mejora)

- **Dónde:** § 6, «Entrar»: «al abrir una sesión, por cualquier camino, se anota … `last_sign_in_at`.
  Una entrada sin conexión cuenta cuando el servidor la confirma».
- **Qué veo:** dos cosas.
  - Una entrada sin conexión confirmada que **no abre sesión** (`result: 'ended'`, en
    `offline/routes.ts`: la persona ya salió o entró otra) no pasa por `openSession` y no se anota,
    aunque R3.2 dice que cuenta «cuando el servidor la confirmó».
  - **Qué hora:** la de la confirmación (la del servidor) o la de la firma (`signed_at`, hora del
    celular, sin confirmar). La constitución (VI) dice que la del dispositivo va marcada como no
    confirmada; para «Entró hace 3 días» alcanza la del servidor al confirmar. Que el diseño lo diga.

### 1.11 E03: el mensaje de la propia (Mejora)

- **Dónde:** § 5, «La propia»: «la aplicación ni ofrece el botón».
- **Qué veo:** E03 pide que «la aplicación le dice que lo tiene que hacer otro Administrador». La
  maqueta lo resuelve con una nota en la tarjeta propia («No te podés dar de baja vos: lo tiene que
  hacer otro Administrador»). Que § 8 lo nombre, porque la prueba de E03 es de la pantalla, no solo
  de la ruta.

### 1.12 «No había nada que cortar» (Mejora)

- **Dónde:** § 4 (`POST /api/lost-phones/cut`, «Devuelve qué cortó») y § 10 («un identificador de
  otro da `404`»).
- **Qué veo:** la maqueta dice «si alguien lo cortó mientras tanto, dice que no había nada que
  cortar». No queda claro si eso es un `404` o un `200` con `{ sessions: 0, passkey: false }`. Lo
  segundo es más simple para la pantalla y no filtra nada (todo con sesión). Lo mismo para «Cerrar»
  una sesión ya cerrada y «Quitar» una huella ya quitada.

### 1.13 La migración y quien entró hace más de 30 días (Mejora)

- **Dónde:** § 2: «las personas que ya entraron alguna vez reciben `last_sign_in_at` de su sesión más
  reciente».
- **Qué veo:** las sesiones cerradas se borran a los 30 días (`closedRetentionMs`). Quien tiene
  `google_subject` pero ninguna sesión guardada queda con `last_sign_in_at` nulo y la lista dice
  «Todavía no entró» (contra R3.2), aunque la regla de «nunca entró» la sigue tratando bien porque
  mira `google_subject`. Solo afecta a pruebas hoy, pero conviene decir qué se muestra en ese caso
  (por ejemplo, `created_at` como cota, o un «Entró» sin fecha).

### 1.14 E24 y E18 se apoyan en 01 (Mejora)

- **Dónde:** § 12, «E21 a E27» y «E17 a E20».
- **Qué veo:** E24 (el dispositivo sin conexión cuya sesión se cerró vuelve a la entrada con el
  primer pedido y manda lo pendiente con la prueba) y E18 (dada de baja ve «no autorizada») ya los
  cumple el 01 (R3.6, R4; `matchGoogle` con `inactive`). Está bien no rehacerlos, pero que el diseño
  lo diga y que la prueba los nombre (`users-E24`) usando el camino de 01, para que el estado salga
  de las pruebas.

## 2. Performance

Conté las consultas de cada pedido con lo que dice el diseño y lo que hace el código de hoy
(`requireSession` con la sesión en memoria no consulta la base).

| Pedido | Lo que hace | Consultas |
|---|---|---|
| `GET /api/users` | personas; sesiones por persona; huellas por persona; y, si se toma el último uso de memoria, un `flush` | 3, o 4 con el `flush` |
| `GET /api/users/:id/access` | la persona (para el `404`); sus sesiones; sus huellas | 2 si un `id` que no existe da listas vacías; 3 si da `404` |
| `POST /api/users` | insertar; con el `409`, nada más | 1 (+ los contadores si «devuelve la persona como quedó» los trae: 0, es nueva) |
| `PATCH /api/users/:id` | actualizar con `where version`; si no cambió nada, leerla para saber si es `changed`, `already-entered` o `404` y devolverla; los contadores | 1 a 2, más 2 de contadores |
| `POST …/deactivate` | `select … for update`; actualizar; cerrar sus sesiones; revocar sus huellas; los contadores | 4, más 2 de contadores |
| `POST …/activate` | actualizar; contadores (en cero) | 1 a 2 |
| `POST /api/lost-phones/cut` y «Quitar» | cerrar sesiones de esa persona en ese celular; revocar su huella ahí | 2 |
| `GET /api/lost-phones` | sesiones abiertas de celulares; huellas activas; nombres de esas personas | 2 o 3 |

### 2.1 Las metas de los cambios no cierran (Frena)

- **Dónde:** § 11: «Cada cambio: hasta 3 consultas en una transacción».
- **Qué veo:** la baja hace 4 (bloquear, actualizar, cerrar sesiones, revocar huellas) antes de
  devolver la persona con sus contadores. Y si «cada cambio devuelve la persona como quedó» (§ 4)
  incluye los contadores, suman 2 más. El paso 6 escribe pruebas que cuentan consultas contra esta
  meta: con el número mal, o falla o se cambia la meta para que pase. Hay que escribir la meta por
  ruta, como la tabla de arriba. Una salida para no sumar los contadores: después de un cambio, la
  aplicación conserva los que ya tenía (o los pone en cero tras la baja), y el servidor no los vuelve
  a contar.

### 2.2 Rutas sin meta (Mejora)

- **Dónde:** § 11.
- **Qué veo:** `GET /api/lost-phones`, `POST /api/lost-phones/cut`, «Cerrar», «Cerrar todas» y
  «Quitar» no tienen número. Ver la tabla.

### 2.3 El último uso de la memoria en un `count` (Mejora)

- **Dónde:** § 4: «las sesiones "abiertas" son las sin cerrar y sin vencer … con el último uso de la
  memoria del servidor si está».
- **Qué veo:** los contadores de `GET /api/users` se calculan en la base, y la base tiene el último
  uso con hasta un minuto de atraso. Para usar el de la memoria hay dos caminos: traer las filas y
  filtrar en el servidor (más bytes que un `count`) o llamar `store.flush()` antes, que es lo que ya
  hace `offline/routes.ts` (una escritura más, de largo variable). La diferencia es de un minuto
  sobre 60: para contar, alcanza la base. Que el diseño elija; recomiendo la base sola para los
  contadores y la memoria solo en la tarjeta (donde se muestra «Usada ahora»). Ojo con lo otro: la
  limpieza que marca las vencidas corre una vez por día, así que el filtro tiene que mirar
  `created_at` y `last_used_at`, no solo `closed_at is null` (el diseño lo dice; lo remarco porque es
  fácil de olvidar en el `count`).

### 2.4 El índice nuevo de `sessions` (Mejora)

- **Dónde:** § 2: «índice nuevo sobre `(user_id, device_id)` donde `closed_at` es nulo».
- **Qué veo:** ya existe `sessions_user_id`, y las sesiones son pocas (las cerradas se borran a los
  30 días; con 100 personas, unos miles de filas). Buscar por persona y filtrar el celular en esas
  pocas filas es igual de rápido. Si se agrega igual, deja de hacer falta `sessions_user_id` para las
  abiertas. Las huellas no tienen índice por `user_id` y los contadores las agrupan por persona: con
  la tabla de este tamaño tampoco hace falta. Recomiendo no agregar índices en esta etapa y decir por
  qué.

### 2.5 La meta con 50 personas (Mejora)

- **Dónde:** § 11: «menos de 50 ms con 50 personas, menos de 10 KB».
- **Qué veo:** la constitución (IX) habla de hasta 100 personas. Con unos 150 bytes por persona, 100
  personas son unos 15 KB: la meta de bytes no cierra a ese tamaño. Que se mida con 100.

## 3. Simpleza

### 3.1 `PATCH` y `DELETE ?version=` (Frena)

- **Dónde:** § 4.
- **Qué veo:** la aplicación tiene un solo cliente de la API (`app/platform/server/api.ts`) y solo
  manda `GET` (sin cuerpo) o `POST` (con cuerpo JSON). Agregar otros verbos es cambiar código común
  de la plataforma, que según la constitución es una tarea aparte con su dueño. Y el servidor
  (`platform/http.ts`, `rejectionReason`) a todo lo que no es `GET` le exige `Origin` y
  `Content-Type: application/json`: un `DELETE` sin cuerpo se rechaza con `400`.
- **Qué propongo:** todo en `POST`, igual que `deactivate` y `activate`, con la `version` en el
  cuerpo: `POST /api/users/:id` (cambiar) y `POST /api/users/:id/delete` (borrar). Una sola forma,
  sin tocar la plataforma.

### 3.2 «Quitar» y «Cortar» son lo mismo (Mejora)

- **Dónde:** § 4, `POST /api/passkeys/:id/remove` y `POST /api/lost-phones/cut`.
- **Qué veo:** los dos cierran las sesiones de esa persona en ese celular y le quitan la huella ahí
  (R5.6 y R5.7). Cambia solo desde dónde se llama y el nombre en la auditoría. Una sola regla y una
  sola ruta por `(userId, deviceId)` alcanzan, con un campo que diga desde dónde (`passkey.removed`
  o `phone.cut`, como pide R6.1). Así además «Quitar» deja de necesitar el identificador de la
  huella (ver 5.1).

### 3.3 `way` repite `data.method` (Mejora)

- **Dónde:** § 6, «Entrar»: «se anota `way`».
- **Qué veo:** `openSession` ya recibe cómo se entró para la auditoría (`data.method`: `google`,
  `passkey`, `qr`, `offline`; con `via: 'qr'` cuando el celular aprueba a la computadora). La columna
  puede salir de ahí, sin otro parámetro. Conviene que el diseño diga qué `way` lleva la sesión del
  celular que se abre al aprobar una computadora (hoy es `passkey`, con `via: 'qr'`).

### 3.4 Columnas nulas por sesiones que duran 8 horas (Mejora)

- **Dónde:** § 2, `way` («las abiertas antes de la migración quedan nulas») e `is_phone` (no dice).
- **Qué veo:** una sesión vive como mucho 8 horas. Dejar las columnas nulas obliga a la pantalla y a
  los tipos a manejar un caso que desaparece al otro día. Más simple: `not null`, y en la migración
  completar `way` con `google` (o cerrar las abiertas con `revoked` en un ambiente de pruebas) e
  `is_phone` desde `device_label` («… en Android» o «… en iPhone»). Si `is_phone` queda sin decir, «Se
  perdió un celular» no sabe qué hacer con las sesiones de antes.

### 3.5 «Eventos» y «auditoría» mezclados (Mejora)

- **Dónde:** § 9, «Eventos y auditoría».
- **Qué veo:** la lista llama eventos a lo que son líneas de auditoría. En la arquitectura, un evento
  (`platform/events.ts`) es para que otro módulo reaccione dentro de la transacción; publicar
  eventos que nadie escucha agrega código sin sacar acoplamiento. Que § 9 separe: los eventos del
  proceso (`user.deactivated`, y `user.renamed` por 1.2) y las líneas de auditoría (todas las de R6.1),
  con su `type`.

### 3.6 «Separadas como la entrada» (Frena)

- **Dónde:** § 8, «Las pantallas: … separadas como la entrada».
- **Qué veo:** la constitución (III) y el ADR-002 piden una sola pantalla por funcionalidad, con el
  CSS acomodándola, y descartan explícitamente «dos juegos de pantallas, uno por dispositivo». La
  entrada es una sola pantalla con piezas (`screens/Entrance/`). Si «separadas» quiere decir piezas
  separadas (lista, tarjeta, autorizar…), está bien pero hay que escribirlo así. Si quiere decir dos
  pantallas, una por maqueta, choca con el ADR. Las dos maquetas se pueden hacer con una sola
  pantalla: en la computadora lista y tarjeta lado a lado; en el celular, el mismo estado
  «elegida» muestra solo la tarjeta, y «atrás» (`platform/back-step.ts`) vuelve a la lista. Que el
  diseño lo diga, con cómo vuelve el botón atrás del celular desde la tarjeta.

## 4. Repetición

### 4.1 El nombre que se muestra, en dos módulos (Frena, va con 1.1)

- **Dónde:** § 2 y § 6 (R3.4); hoy `person()` en `sign-in/context.ts`.
- **Qué veo:** la regla «el escrito, si no el de Google, si no el correo» va a hacer falta en `users`
  (la lista) y en `sign-in` (la persona de la sesión). Que esté una sola vez en `users/rules.ts` y
  salga por la fachada ya calculada; `sign-in` la toma, no la repite. Si la aplicación también la
  calcula (por ejemplo, al borrar el nombre, para mostrar el de Google sin esperar), va en
  `src/shared/`.

### 4.2 Lo que ya existe en `sign-in` (Mejora)

- **Dónde:** § 6 y § 13, tarea 5.
- **Qué veo:** `passkeysData.revokeOwn(userId, deviceId, at)` ya revoca la huella de una persona en un
  celular, y `store.closeForUser` ya cierra las de una persona y las saca de la memoria. Para «Cerrar
  todas» (salvo la propia en uso) y para cortar por celular hacen falta variantes con un filtro más;
  conviene que el diseño diga que se extienden esas en lugar de escribir otras, para no tener dos
  caminos que olviden la memoria.

## 5. Seguridad

### 5.1 El identificador de una huella no es un UUID (Frena)

- **Dónde:** § 10: «los identificadores de la dirección, UUID»; § 4, `POST /api/passkeys/:id/remove`.
- **Qué veo:** `sign_in.passkeys.id` es `text`: el identificador de la credencial de WebAuthn
  (base64url, de largo variable). Validarlo como UUID rechaza todas las huellas. Con 3.2 se evita
  (la ruta va por `userId` y `deviceId`, los dos UUID); si no, la validación de ese parámetro tiene
  que ser otra (base64url con un largo máximo).

### 5.2 El límite de los pedidos con sesión (Frena)

- **Dónde:** § 10, «Abuso»: «las rutas usan el límite por dirección de los pedidos con sesión que
  ya existe».
- **Qué veo:** no lo encontré. Los límites que hay son los de entrar (`google`, `passkey`), el de los
  pedidos sin sesión (`start`, en `/api/start`, el nonce y la salida pendiente), los de los códigos
  QR y el de anotar rechazos de la plataforma. Ninguna ruta con sesión tiene límite. Puede que no
  haga falta (son pocas personas, todas con sesión), pero el diseño no puede apoyarse en algo que no
  existe: o se dice «sin límite, porque…» o se define uno.

### 5.3 La auditoría (Mejora)

- **Dónde:** § 9 y § 10.
- **Qué veo:**
  - **Dónde va «a quién».** `AuditEvent` tiene un solo `userId` (columna `user_id` en SQLite). Hay
    que decir que `userId` es quien lo hizo y que la persona afectada va en `data` (por ejemplo,
    `targetUserId`), y avisarle al 05 que para buscar «lo que le hicieron a Juan» va a tener que
    leer el `payload`, que está comprimido.
  - **Cuándo se anota.** La auditoría escribe por tandas fuera de la transacción de PostgreSQL. Si la
    línea se anota antes del `commit` y la transacción falla (por ejemplo, la segunda baja de E05),
    queda anotada una baja que no pasó. Que diga: después del `commit`.
  - **Líneas dobles.** `store.closeForUser` ya anota `session.ended` por cada sesión. Dar de baja deja
    `user.deactivated` más una `session.ended` por sesión; «Cerrar todas», si reusa `closeForUser`,
    deja `sessions.closed-all` más una por sesión. Puede estar bien, pero que el diseño lo diga.

### 5.4 El comando del primer Administrador (Mejora)

- **Dónde:** § 7.
- **Qué veo:**
  - El contenedor no compila: corre `node src/server/main.ts` con `WORKDIR /repo`
    (`deploy/server.Dockerfile`). No hay `first-administrator.js`; el comando sería
    `docker compose exec server node src/server/first-administrator.ts …`.
  - «En una transacción, inserta solo si la tabla está vacía»: con `read committed`, dos corridas a la
    vez con correos distintos podrían cargar a los dos. Es improbable (lo corre la instalación), pero
    se arregla en una línea con un `insert … select … where not exists` bajo un `lock table` o un
    bloqueo consultivo.
  - R6.1 no lo pide, pero la carga del primer Administrador es un cambio de quién entra: conviene
    anotarlo. Si se anota, ojo que el comando es otro proceso escribiendo el mismo archivo de SQLite
    que el servidor (ADR-004 habla de un solo escritor). No lo pude comprobar más allá de leer
    `storage/audit.ts`.
  - R1.2 dice «no usa la configuración del ambiente» y § 7 dice «abre la base con la configuración
    del ambiente». Entiendo que la regla quiere decir que el correo no sale del `.env`; que § 7 lo
    aclare para que no parezca una contradicción.
  - `install.sh` corre el comando «al final de la instalación»: el servidor tiene que estar arriba
    (lo comprueba el último paso, `api/health`); el comando va después de esa comprobación.
  - `docs/technical/modules/sign-in.md` (§ 11, la tabla del `.env`) sigue nombrando
    `INITIAL_ADMIN_EMAIL`: va en la lista de lo que cambia en el 01.

### 5.5 `POST /api/sessions/:id/close` no nombra a la persona (Mejora)

- **Dónde:** § 4 y § 10 («comprueban que la sesión o la huella sea de la persona nombrada»).
- **Qué veo:** esa ruta no nombra a nadie, así que el control no aplica. En la etapa a da igual
  (cualquiera cierra cualquiera), pero en la etapa b el permiso va a depender de quién es la persona.
  Con `POST /api/users/:id/sessions/:sessionId/close` las rutas de la tarjeta quedan iguales y el
  control vale. También falta decir qué pasa si el `id` es el de la sesión del pedido (R5.2 no la
  muestra; el servidor debería rechazarla o tratarla como «Salir»).

### 5.6 El identificador del dispositivo en «Se perdió un celular» (Mejora)

- **Dónde:** § 4, `GET /api/lost-phones` y `POST /api/lost-phones/cut` (`{ userId, deviceId }`).
- **Qué veo:** el `device_id` es el identificador que cada dispositivo manda en todos sus pedidos, y
  la confirmación sin conexión lo compara con el de la huella (`offline/routes.ts`). Darlo a otra
  persona con sesión no alcanza para hacerse pasar por ese celular (hace falta la firma de la
  huella y la llave de prueba), pero es un dato que hoy no sale del dispositivo. Lo dejo para el
  revisor de seguridad; una alternativa es identificar el celular por la sesión o la huella que lo
  representa.

Qué datos toca, quién puede, lo que entra (zod, largos, `version` entera) y que no hay ruta para
crear a alguien sin sesión: están y me parecen bien, salvo lo de arriba. Secretos: el módulo no usa
ninguno nuevo, y el diseño no lo dice en una línea; conviene decirlo, porque la constitución pide
contestarlo siempre.

## 6. Fronteras

### 6.1 `requireSession` está en `sign-in` (Frena)

- **Dónde:** § 3 («`users` no conoce a `sign-in`») y § 4 («Todo con sesión (`requireSession`)»).
- **Qué veo:** `requireSession` está en `sign-in/sessions/require.ts` y usa el `ctx` de `sign-in`; la
  plataforma (`platform/modules.ts`, `http.ts`) no da la sesión. Las rutas de `users` necesitan
  saber quién pregunta (para `self`, «Vos» y R1.1) y que tenga sesión, y no pueden importar `sign-in`
  sin el ciclo `users → sign-in → users`. El diseño ya resuelve un caso igual con un puerto
  (`accessCounts`), pero este no lo nombra.
- **Opciones:** (a) un segundo puerto que `main.ts` conecta, `currentSession(c)`; (b) que `sign-in`
  registre un paso común que deja la sesión en el contexto del pedido (`c.get('session')`), y que la
  plataforma dé un `requireSession` genérico que solo lo lee (la arquitectura ya nombra `session` y
  `permissions` en `platform/`); (c) que las rutas de `users` las registre `sign-in` llamando a la
  fachada de `users`, que no hace falta: es el acoplamiento al revés. La (b) sirve a todos los
  módulos que vienen, que van a necesitar lo mismo; es código común con su tarea propia.

### 6.2 El puerto `accessCounts` y `main.ts` (Mejora)

- **Dónde:** § 3 y § 13, tarea 6.
- **Qué veo:** `main.ts` está fuera de la cobertura (su comentario lo dice): si el puerto se conecta
  solo ahí, un error de conexión lo agarra recién una prueba de punta a punta. Conviene que el
  armado del servidor (`app.ts`, que sí se prueba) reciba los módulos ya conectados, o que la prueba
  de `GET /api/users` use el mismo armado que `main.ts`. Además, «puerto» no está en la lista de
  patrones de la constitución; es una función que se pasa al crear el módulo, igual que hoy
  `createSignInModule({ users })`, y conviene describirlo así para que no parezca un patrón nuevo
  que necesita ADR.

No encontré imports entre módulos que salteen la fachada en lo que propone el diseño, fuera de 6.1.
Las reglas que propone (nunca entró, el último Administrador, el nombre que se muestra) no dependen
de la tecnología, siempre que vayan en `rules.ts`; § 5 las pone en SQL (`for update`, `where
version`), que es lo correcto para la carrera, pero la regla (contar y decidir) tiene que estar en
`rules.ts` y el bloqueo en `data.ts`.

## 7. Sin conexión, hora y escala

### 7.1 Volver sola al volver la conexión (Frena)

- **Dónde:** § 8 («La opción lleva `needsInternet` … sin conexión, gris») y R2.2 («vuelve sola al
  volver la conexión»).
- **Qué veo:** si al volver la conexión la pantalla vuelve a pedir la lista, es un pedido automático
  y la constitución (III) pide anotarlo antes en `mobile-data.md`, con lo que pesa, y que lo apruebe
  Carlos; el manual lo hizo así. Si no la vuelve a pedir (solo se prende y la lista vieja queda), que
  el diseño lo diga. Hoy no dice ninguna de las dos.

### 7.2 «Entró hace 3 días» con qué reloj (Mejora)

- **Dónde:** § 4 y § 8 (cuándo entró, último uso, «Vinculado el …»).
- **Qué veo:** el servidor da las horas (bien, VI); «hace 3 días» o «Usada ahora» se calculan contra
  «ahora», y el reloj del dispositivo puede estar mal. La aplicación ya tiene la hora del servidor
  (`app/platform/server/clock.ts`); que el diseño diga que se usa esa.

### 7.3 Escala (sin observaciones)

El módulo no atiende clientes ni proveedores, y necesita conexión (R2.2): no hay nada que sumar sin
conexión. La hora la pone el servidor. Con 100 personas, el bloqueo de todas las activas en la baja
y los contadores en lote siguen siendo baratos. Lo único que no escalaría a varias copias del
servidor son los mapas en memoria de `sign-in` (sesiones, personas, `phoneOwners`), que ya están
anotados en la arquitectura como lo que cambia; 1.2 y 1.3 suman motivos para que esa invalidación
pase por un solo lugar.

## 8. Mejoras

- **Las huellas quitadas se acumulan.** `revoked_at` marca, pero nada las borra. La constitución (V)
  pide que lo que deja de valer se borre; la confirmación sin conexión busca solo las activas
  (`findActive`) y `offline_sign_ins` guarda el `credential_id` como texto, sin clave foránea. Se
  podrían borrar al quitarlas, o en la limpieza diaria. Si hay una razón para guardarlas (yo no la
  encontré), que el diseño la diga.
- **`recordSignIn` aparte de `linkGoogle`.** Al entrar con Google la primera vez son dos escrituras a
  la misma fila; se pueden juntar en una. En las demás entradas es una por entrada, que está bien.
- **Normalizar el nombre.** `PATCH { name? }` no distingue «no lo cambio» de «lo borro». Que el
  contrato diga: ausente, no cambia; `null` o vacío después de `trim`, vuelve al de Google.
- **La tarjeta propia de quien está dado de baja a la vez.** Si A da de baja a B mientras B tiene
  Usuarios abierto, el próximo pedido de B vuelve a la entrada (bien). Nada que agregar; lo anoto
  para que la prueba de E30 cubra también ese orden.
- **El contrato en `src/shared/contracts/users.ts`.** El diseño nombra zod pero no dónde: la forma de
  cada ruta y los códigos de error nuevos (`email-taken`, `already-entered`, `self`,
  `last-administrator`, `changed`) van ahí, una sola vez para el servidor y la aplicación.
