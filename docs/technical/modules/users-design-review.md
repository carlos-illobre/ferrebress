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

---

# Etapa b · roles y permisos

Revisión independiente de las secciones 14 a 24 del [diseño](users.md) (constitución, paso 4), hecha
con los documentos: la constitución, el [capítulo 02](../../chapters/02-users/rules.md) (sección 7,
E34 a E57 y los cambios a R1.1, R1.3, R2.1, R3.1, R3.3, R3.8, R5.1 y R6.1), su `summary.md` y
`screens.md` (filas 2 a 4), las capturas de las maquetas aprobadas (`users-roles/desktop/variant-1-card`,
`users-person-roles/desktop/variant-1-card` y `app-no-permission/desktop/variant-1-door`, la de
«Ya no tenés permiso»), 00 · R1.4 y R1.8, 15 · R1.2, R1.5, R2.2 y R3.1, la
[arquitectura](../architecture.md) y [mobile-data.md](../mobile-data.md). Como la etapa b cambia lo
que ya está programado, miré el código de la etapa a en lo que el diseño dice cambiar o reusar:
`src/server/modules/users/` (`index.ts`, `people.ts`, `routes.ts`, `rules.ts`, `data.ts`, `first.ts`),
`src/server/modules/sign-in/` (`index.ts`, `context.ts`, `sessions/store.ts`, `sessions/require.ts`,
`offline/rules.ts`, `offline/phone-owner.ts` y dónde se usa `canWorkOffline`), `src/server/platform/`
(`http.ts`, `session.ts`, `guards.ts`, `modules.ts`, `events.ts`), `src/server/modules.ts`, `app.ts`,
`src/shared/contracts/server-header.ts` y `sign-in.ts`, y en la aplicación `modules/frame/menu.ts`,
`modules/sign-in/offline/option.ts` y `watch.ts`, y quién usa `person.role`.

No miré las maquetas funcionando (solo sus capturas) ni corrí nada: lo que dependa de cómo se
comportan, lo digo como no comprobado. Misma escala que la etapa a: **Frena** o **Mejora**.

## Resumen

La forma general está bien: los permisos fijos en una lista compartida, la tabla de permisos
conocidos para que el Administrador reciba solo los nuevos, el paso `permissions.require` en la
plataforma (igual que la sesión del pedido, sin que otros módulos importen `users`), un solo bloqueo
para todo lo que puede dejar sin quien administre, y la cabecera `p=` para enterarse de un cambio sin
pedidos propios. Lo que frena está, otra vez, **en las memorias y en los bordes**: la memoria de
permisos repite la carrera que la etapa a ya arregló para las sesiones (un permiso quitado puede
seguir valiendo); `sign-in` guarda en memoria la persona que da `/api/start`, y si ahí van los roles
y permisos, la cabecera cambia y `/api/start` sigue dando lo viejo; la confirmación de una entrada sin
conexión no pasa a mirar `offline.work`; la persona guardada en el celular no tiene permisos, aunque
el diseño dice que sí. Del lado de la API, quien tiene solo «Ver las personas» no puede mostrar las
pastillas ni filtrar por rol (llegan ids sin nombres), y la pestaña Roles con solo «Administrar
roles» no tiene los nombres de quienes tienen cada rol ni la versión que pide darles un rol. Falta
decidir cómo se ve Usuarios en Más para quien tiene «Administrar roles» y no «Ver las personas». El
pedido automático de `/api/start` cuando cambia `p=` no está en `mobile-data.md`. Y las tablas no
dicen sus claves foráneas, de las que dependen borrar a una persona y borrar un rol.

| # | Punto | Gravedad |
|---|---|---|
| b1.1 | Las pastillas y el filtro por rol (R3.1, E06, E54) necesitan nombres de roles que `GET /api/users` no da | Frena |
| b1.2 | La pestaña Roles con solo «Administrar roles»: sin nombres de quienes lo tienen ni forma de darles el rol | Frena |
| b1.3 | Usuarios en Más para quien tiene «Administrar roles» sin «Ver las personas» (R2.1 contra E45) | Frena (decisión de Carlos) |
| b1.4 | La confirmación de una entrada sin conexión (15 · R3.1) sigue sin mirar `offline.work` | Frena |
| b1.5 | La persona guardada en el celular no tiene permisos (R7.9, E52) | Frena |
| b1.6 | «Ya no tenés permiso» cuando lo que cambió son los permisos de un rol, no los roles de la persona | Mejora |
| b1.7 | Lo que muestra la tarjeta de quien entró con varios roles (`person.role`) | Mejora |
| b1.8 | ¿Quién «tiene» un rol: también los dados de baja? (R7.3, R7.7, E39) | Mejora (pregunta a Carlos) |
| b1.9 | «Sin permiso» sin conexión | Mejora |
| b1.10 | `GET /api/roles` da «su último cambio», que ninguna tabla guarda | Mejora |
| b2.1 | Las consultas de los cambios no cierran, y faltan las de `/api/start` y de autorizar | Frena |
| b2.2 | El pedido de `/api/start` cuando cambia `p=` no está en `mobile-data.md` | Frena |
| b2.3 | Cómo llega `p=` a la cabecera y qué hace la aplicación sin él | Mejora |
| b3.1 | `last_roles_change`: historia en la base, que la aplicación puede calcular sola | Mejora |
| b3.2 | La migración y el arranque suman permisos por dos caminos | Mejora |
| b3.3 | Darle un rol a varias personas desde el rol, con una ruta que reemplaza todos los roles de una | Mejora |
| b3.4 | `can()` en `sign-in` | Mejora |
| b4.1 | La memoria de permisos repite la carrera que la etapa a arregló para las sesiones | Frena |
| b4.2 | Dos memorias de la misma persona: la de `users` y la de `sign-in` | Frena |
| b4.3 | `confirmed()` y el registro de rechazos, una sola vez | Mejora |
| b5.1 | Una ruta nueva sin su permiso: se confía en acordarse de escribir la prueba | Mejora (fuerte) |
| b5.2 | Las claves foráneas de las tablas nuevas | Frena |
| b5.3 | El rechazo por permiso se anota como `users.rejected` desde la plataforma | Mejora |
| b5.4 | La auditoría de roles con ids: no se lee si el rol se borra | Mejora |
| b5.5 | Límites de pedidos de las rutas de roles y de `holders` | Mejora |
| b5.6 | Solo un rol `system` | Mejora |
| b6 | Fronteras | Sin observaciones que frenen (ver b3.4 y b5.3) |
| b7.1 | La memoria de permisos y la escala | Mejora |
| b8.x | Mejoras | Mejora |

## b1. Escenarios sin cubrir

Recorrí E34 a E57 y los que cambian de la etapa a. Tienen ruta, tabla y prueba: E34 y E53 (migración
y comando), E35 a E40 y E57 (rutas de roles y la pantalla), E41 a E44, E46, E47, E49 a E51, E55 y
E56. Los que no quedan cubiertos del todo:

### b1.1 Las pastillas y el filtro por rol necesitan nombres (Frena)

- **Dónde:** § 18, «Cambian las de la etapa a»: `GET /api/users` «suma los ids de los roles de cada
  persona».
- **Qué propone:** ids de roles por persona.
- **Qué veo:** la lista muestra «una pastilla por cada uno de sus roles» (R3.1, E06) y se filtra por
  rol con su nombre y su cantidad (E54; la maqueta `users-person-roles` muestra «Administrador 2»,
  «Encargado de turno 1»). Los nombres solo los da `GET /api/roles`, que pide «Administrar roles».
  Quien tiene solo «Ver las personas» (o «Administrar personas», E41) recibe ids que no puede
  mostrar.
- **Opciones:** que `GET /api/users` sume una lista `roles: { id, name }[]` (sin permisos ni
  descripción), con la consulta que el diseño ya suma; o que cada persona traiga `{ id, name }`. La
  primera pesa menos con 100 personas.

### b1.2 La pestaña Roles con solo «Administrar roles» (Frena)

- **Dónde:** § 18, `GET /api/roles` («quiénes los tienen (ids)») y `POST /api/users/:id/roles`
  (`{ version, roles }` de la persona); `screens.md`, fila 2 («dar o sacar un rol desde el rol»).
- **Qué veo:** la pestaña Roles muestra quiénes tienen cada rol con sus iniciales (la maqueta) y deja
  darle o sacarle el rol a una persona. Con ids no hay iniciales; y para dar el rol hace falta elegir
  entre las personas y mandar la `version` de cada una y todos sus roles, que salen de
  `GET /api/users`, que pide «Ver las personas». R7.1 no hace que «Administrar roles» incluya «Ver las
  personas», así que alguien puede tener la pestaña y no los datos que necesita.
- **Opciones:** (a) proponerle a Carlos que «Administrar roles» incluya «Ver las personas», como ya
  pasa con los otros dos: resuelve este punto y el b1.3, y es coherente con que quien reparte roles ve
  a quién se los da; (b) que `GET /api/roles` traiga las personas activas con id, nombre que se
  muestra, versión y roles, aunque eso es una segunda lista de personas por otro permiso. Me inclino
  por (a), pero es una regla: la decide Carlos.

### b1.3 Usuarios en Más sin «Ver las personas» (Frena, decisión de Carlos)

- **Dónde:** § 20, «El menú»: cada opción y pestaña dice su permiso.
- **Qué veo:** R2.1 dice que cada pestaña aparece para quien tiene su permiso; E45 dice que sin «Ver
  las personas» no se ve Usuarios en Más. Para quien tiene «Administrar roles» y no «Ver las
  personas», las dos no pueden cumplirse a la vez: o la opción aparece (para llegar a Roles) o no. El
  diseño no dice qué permiso pide la opción ni a qué pestaña lleva `/users` en ese caso.
- **Qué propongo:** si Carlos elige (a) de b1.2, desaparece. Si no, que el diseño diga que la opción
  aparece con cualquiera de sus pestañas, abre la primera permitida, y que E45 se lee «sin ninguno de
  los dos».

### b1.4 La confirmación sin conexión no mira `offline.work` (Frena)

- **Dónde:** § 17, «`offline: true` pide `offline.work` en vez de “ser Administrador”».
- **Qué veo:** `canWorkOffline` se usa en cinco lugares del código: además de dar `offline: true`
  (entrar con Google, con la huella, al vincular y en `/api/start`, `phone-owner.ts`), lo usa la
  confirmación de una entrada sin conexión (`offline/routes.ts`, `allowed`), que es lo que pide 15 ·
  R3.1 («que la cuenta siga activa y con el permiso»). El diseño solo nombra `offline: true`: si la
  confirmación sigue con `active`, a quien le sacaron «Trabajar sin conexión» mientras estaba sin
  conexión se le confirma la entrada. Además `canWorkOffline` está en `rules.ts` de `sign-in` y hoy
  recibe `{ active }`: tiene que pasar a recibir los permisos, que da `users`.
- **Qué propongo:** que § 17 diga que los cinco caminos piden `offline.work` con `permissionsOf`, con
  una prueba de 15 · R3.1 sin el permiso (`offline-E…`).

### b1.5 La persona guardada en el celular no tiene permisos (Frena)

- **Dónde:** § 20, «Sin conexión (R7.9): la persona guardada en el dispositivo ya trae sus permisos».
- **Qué veo:** no es así hoy. Lo que guarda el celular para entrar sin conexión es
  `{ userId, name, role }` (`modules/sign-in/offline/option.ts`), y `updateOffline` solo lo reescribe
  si cambia el nombre o el rol. La arquitectura dice que `localStorage` guarda «el nombre y rol de
  quien entró». Sin permisos guardados, el marco sin conexión no sabe qué menú armar (E52).
- **Qué propongo:** que el diseño diga que lo guardado suma `roles` y `permissions`, que
  `updateOffline` lo reescribe también si cambian, y que se actualiza la línea de la arquitectura.
  Los permisos no son secretos ni del negocio: pueden quedar en `localStorage`.

### b1.6 «Ya no tenés permiso» cuando cambian los permisos de un rol (Mejora)

- **Dónde:** § 15 (`last_roles_change` en `users.users`) y § 20.
- **Qué veo:** R7.8 dice «con quién le sacó qué rol»; `last_roles_change` se escribe al cambiar los
  roles de una persona. Pero también se pierde un permiso cuando le sacan ese permiso a un rol que la
  persona tiene (E49, al revés). Ahí `last_roles_change` no cambia (o queda uno viejo, que se mostraría
  como si fuera lo de ahora). El diseño no dice qué se ve en ese caso. Ver también b3.1.
- **Qué propongo:** que diga qué texto se muestra cuando lo que cambió fue el rol («Graciela le sacó
  “Ver las personas” a “Encargado de turno”») y de dónde sale; o, si se quiere solo el caso de la
  regla, que en el otro se muestre sin «quién».

### b1.7 La tarjeta de quien entró con varios roles (Mejora)

- **Dónde:** § 17 («`sign-in` deja de inventar `role: 'Administrador'`») y § 20.
- **Qué veo:** `person.role` se muestra hoy en la tarjeta de la persona del marco (`SideFooter.tsx`,
  `PhoneMore.tsx`) y lo guarda la opción sin conexión. La maqueta de «Sin permiso» sigue mostrando un
  solo rol debajo del nombre. El diseño no dice qué se muestra con dos roles (los dos, el primero, «2
  roles»).
- **Qué propongo:** decirlo; si es una decisión de cómo se ve, preguntarla.

### b1.8 Quién «tiene» un rol (Mejora, pregunta a Carlos)

- **Dónde:** § 18 (`role-in-use`, `holders`) y § 19.
- **Qué veo:** R7.5 pide al menos un rol a las personas activas. Al dar de baja, el diseño no dice si
  la persona conserva sus roles (para que el alta la deje con los mismos, R4.2) o los pierde (y
  entonces el alta tendría que pedir roles). Si los conserva: ¿un rol que solo tienen personas dadas
  de baja «lo tiene alguien» (no se puede borrar, E39)? ¿«Lo tienen 4 personas» y `holders` (R7.7)
  cuentan a las dadas de baja? Para `holders` me parece claro que no; para borrar, no.
- **Qué propongo:** que el diseño diga que la baja conserva los roles, que `holders`, los contadores y
  `role-in-use` miran solo a las activas (o a todas), y preguntarle a Carlos lo de borrar.

### b1.9 «Sin permiso» sin conexión (Mejora)

- **Dónde:** § 20, «Sin permiso» pide `/api/permissions/:id/holders`.
- **Qué veo:** sin conexión, quien abre por la dirección algo que no puede ve la pantalla del marco,
  que necesita la red para «quién lo tiene». El diseño no dice qué muestra entonces (lo que se puede
  saber sin red: el permiso que falta, para qué sirve, sus roles y el botón; y «Sin conexión» en lugar
  de los nombres).

### b1.10 «Su último cambio» de un rol (Mejora)

- **Dónde:** § 18, `GET /api/roles` «… y su último cambio».
- **Qué veo:** `users.roles` (§ 15) no tiene columnas para eso, y ninguna regla ni la maqueta lo piden
  en la lista de roles. O sobra, o falta la columna y para qué es.

## b2. Performance

Cuento las consultas como lo hizo la etapa a, con el comienzo y la confirmación de la transacción
(«6, con el comienzo y la confirmación»). Lo que no pude comprobar es cuántas se juntan en una sola
sentencia (por ejemplo, borrar e insertar roles con un CTE): si el diseño piensa juntarlas, que lo
diga, porque la prueba las va a contar.

### b2.1 Las consultas de los cambios no cierran (Frena)

- **Dónde:** § 18 y § 22.
- **Qué veo:**
  - `POST /api/users/:id/roles` («4 a 6»): comenzar, bloquear el rol `system`, subir la versión de la
    persona y escribir `last_roles_change`, borrar sus roles, insertar los nuevos, contar quién queda
    con los dos permisos, confirmar: 7, sin validar que los roles existan (o con la clave foránea,
    b5.2). Además, decidir si pide confirmar (R3.8, solo si «da» un rol) necesita los roles de antes,
    antes de cambiar nada: una lectura más, o la de la memoria de permisos, que no alcanza (son
    permisos, no roles).
  - `POST /api/roles/:id` («4 a 6»): comenzar, bloquear, leer el rol (para saber si se agregan
    permisos, R3.8, y para la auditoría con lo que había), cambiarlo, borrar e insertar permisos,
    contar, confirmar: 8.
  - `POST /api/roles` («3»): comenzar, insertar el rol, insertar sus permisos, confirmar: 4.
  - `POST /api/users` (autorizar) suma los roles de la persona y pasa a ser una transacción; el diseño
    no actualiza su «1».
  - Dar de baja pasa al bloqueo nuevo y a contar por permisos; el «6» de la etapa a cambia y no se dice
    a cuánto.
  - **`/api/start`**, que es el pedido de cada apertura y el que se repite al cambiar `p=`, no tiene
    número. Hoy, con la sesión en memoria, no consulta la base. Con roles (nombres), permisos y
    `lastRolesChange` (que muestra el nombre de quien hizo el cambio y los nombres de los roles,
    según la maqueta) puede pasar a 2 o 3 si nada está en memoria.
- **Qué propongo:** que § 18 dé el número de cada una con lo de arriba, y que § 22 diga cuántas hace
  `/api/start` con la persona en memoria (idealmente cero) y sin ella.

### b2.2 `/api/start` al cambiar `p=` no está en `mobile-data.md` (Frena)

- **Dónde:** § 20, «Si cambia, la aplicación vuelve a pedir `/api/start`».
- **Qué veo:** es un pedido que la aplicación hace sola, provocado por una cabecera; la constitución
  (III) pide anotarlo antes en `mobile-data.md`, con lo que pesa, y que lo apruebe Carlos. Es raro
  (solo cuando cambian los permisos) y chico (unos 400 bytes hoy; con roles y permisos, algo más),
  así que debería pasar sin problema, pero tiene que estar.

### b2.3 Cómo llega `p=` a la cabecera (Mejora)

- **Dónde:** § 20 y § 24, tarea 1.
- **Qué veo:** la cabecera la pone `stamp` de `platform/http.ts`, que corre en todos los pedidos de
  `/api`, con o sin sesión. Para poner `p=` necesita los permisos de la sesión del pedido, que solo
  existen si pasó `sessions.require`; `/api/start` usa `optionalSession` de `sign-in`, no el paso de
  la plataforma, y tampoco lo pasan salir, vincular la huella ni la confirmación sin conexión. Así:
  - hay pedidos con sesión que no llevan `p=`, y la aplicación tiene que ignorar la ausencia;
  - la aplicación tiene que saber contra qué comparar el primero: si guarda «la última `p=` vista»,
    un cambio entre `/api/start` y el primer pedido con `p=` no se nota. Conviene que `/api/start`
    traiga la misma huella o que la función que la calcula esté en `src/shared/` y la aplicación la
    calcule sobre los permisos que tiene.
- **Qué propongo:** que el diseño diga dónde se calcula (el paso de sesión de la plataforma la deja
  en el pedido, sumando una lectura de la memoria por pedido), qué pedidos la llevan y contra qué
  compara la aplicación.

Lo demás está bien medido: el paso de permisos sin consultas con la persona en memoria, `GET
/api/roles` con 3 consultas fijas y una meta en ms y KB, y la pestaña y «Sin permiso» bajados recién
al abrirse. El índice por `role_id` de `user_roles` sirve a `role-in-use`, `holders` y `GET
/api/roles`; el único sobre `lower(name)`, al nombre repetido. No veo índices de más.

## b3. Simpleza

### b3.1 `last_roles_change`: historia en la base (Mejora)

- **Dónde:** § 15.
- **Qué veo:** un `jsonb` con `{ by, at, before, after }` en cada persona es historia, que la
  constitución (V) manda a la auditoría. Y la mayor parte la tiene ya la aplicación: cuando detecta el
  cambio (`p=`), tiene en memoria la persona de antes y recibe la de ahora, así que «los roles que
  tenía y los que tiene» salen de comparar las dos, sin guardar nada. Solo «quién» lo hizo necesita al
  servidor.
- **Opciones:** (a) dejarlo como está, pero diciendo que es «el último cambio» (presente) y no
  historia; (b) guardar solo `roles_changed_by` (y en el rol, quién cambió sus permisos, para b1.6) y
  calcular lo demás en la aplicación. La (b) es más chica y cubre los dos casos de b1.6.

### b3.2 Los permisos del Administrador por dos caminos (Mejora)

- **Dónde:** § 15 («El traspaso … con todos los permisos de hoy, los anota en `known_permissions`»)
  y § 16 («al arrancar, el servidor compara la lista con `known_permissions`»).
- **Qué veo:** si la migración lista los permisos «de hoy», o los copia a mano (y queda congelada,
  como debe ser una migración aplicada) o importa la lista viva (y una migración ya escrita cambia de
  efecto con el tiempo). Las dos cosas son evitables: el arranque ya suma al rol `system` todo lo que
  no está en `known_permissions`.
- **Qué propongo:** que la migración cree el rol Administrador sin permisos, con `known_permissions`
  vacía, y se lo dé a todos; el primer arranque le suma todos, por el mismo camino que un permiso
  nuevo de mañana. Un solo camino, y E34, E51 y E53 se prueban igual. El comando del primer
  Administrador corre las migraciones y no el arranque, pero en la instalación corre después de que el
  servidor responde (§ 7), así que el rol ya tiene todo; que el diseño lo diga.

### b3.3 Dar el rol desde el rol (Mejora)

- **Dónde:** § 18, `POST /api/users/:id/roles` con todos los roles de la persona.
- **Qué veo:** desde la tarjeta del rol se da o se saca ese rol a una o varias personas. Con la ruta de
  la persona, la aplicación manda, por cada una, todos sus roles más o menos uno, con la versión de cada
  persona: un pedido por persona, cada uno con su bloqueo y su conteo, y un `changed` si otra pantalla
  tocó a cualquiera.
- **Opciones:** `POST /api/roles/:id/holders { version, add, remove }`, con la versión del rol, en una
  transacción, con el mismo control de § 19; la ruta de la persona queda para la tarjeta. Es una ruta
  más, pero cada pantalla manda lo que cambia y no lo que no.

### b3.4 `can()` en `sign-in` (Mejora)

- **Dónde:** § 20, «`can(permission)` (de `sign-in`) la usan el marco y las pantallas».
- **Qué veo:** hoy el marco recibe la persona (tipo de `shared/contracts/sign-in.ts`) y no importa
  `sign-in`. Hacer que el marco y cada módulo importen `sign-in` para preguntar un permiso los ata a
  él. `can(person, permission)` es una función pura sobre la lista de permisos: cabe en
  `shared/contracts/permissions.ts` (también la puede usar el servidor), o en la plataforma de la
  aplicación.

Lo demás no tiene capas de más: `permissions.require` copia la forma de la sesión del pedido, y
`known_permissions` es la forma más corta que encontré de saber «nuevo de verdad» sin que cada capítulo
escriba en el esquema de `users`.

## b4. Repetición

### b4.1 La memoria de permisos repite la carrera de las sesiones (Frena)

- **Dónde:** § 17, «La memoria de permisos … se borran al confirmar cualquier cambio».
- **Qué veo:** es la misma carrera que la etapa a encontró y arregló en la memoria de sesiones (§ 6,
  contador de cierres en `sessions/store.ts`): un pedido que no tiene a la persona en memoria lee sus
  permisos de la base mientras otra transacción los cambia; la lectura ve los de antes, el cambio se
  confirma y borra la memoria, y después el pedido guarda los viejos. Como la memoria no vence, el
  permiso quitado sigue valiendo hasta el próximo cambio de roles de cualquiera: incumple R7.6 y es un
  agujero de seguridad, no de vista. El diseño no dice nada.
- **Qué propongo:** el mismo contador (subir antes y después de confirmar; guardar lo leído solo si no
  cambió mientras se leía), con su prueba que mete un pedido en ese momento. Y, como ya son dos memorias
  con la misma regla, una sola pieza en la plataforma («memoria que se invalida»), que es código común
  y tarea propia; también la usaría la de b4.2.

### b4.2 Dos memorias de la misma persona (Frena)

- **Dónde:** § 17 («la persona de `/api/start` y de entrar lleva sus roles, sus permisos y su último
  cambio, de la fachada de `users`»).
- **Qué veo:** `sign-in` guarda en memoria la persona que da `/api/start` (`createPeople` en
  `context.ts`) y la olvida solo con `user.deactivated` y `user.renamed`. Si ahí quedan los roles y
  permisos, después de un cambio la cabecera `p=` (que sale de la memoria de `users`, ya al día)
  cambia, la aplicación pide `/api/start`, que devuelve la persona vieja de la memoria de `sign-in`; la
  `p=` del próximo pedido sigue sin coincidir y la aplicación vuelve a pedir `/api/start` en cada
  respuesta. E48 no se cumple y el celular gasta datos sin parar.
- **Opciones:** (a) que `sign-in` guarde solo lo que es suyo y tome roles, permisos y último cambio de
  la fachada de `users` en cada `/api/start` (de su memoria, sin consultas), o directamente que la
  fachada de `users` dé la persona entera (`personOf`) y `sign-in` deje de recordarla; (b) un evento
  nuevo (`user.roles-changed`, y uno para los cambios de un rol, que olvida a todos) que `sign-in`
  escucha. La (a) deja una sola memoria; la (b), dos que hay que mantener iguales.

### b4.3 `confirmed()` y los rechazos (Mejora)

- **Dónde:** § 18 («Lo que da acceso pide confirmar»; «Se anota como `users.rejected`, con el mismo
  tope»).
- **Qué veo:** `confirmed()` y `answer()` (con el tope por motivo y persona) están en
  `users/routes.ts`. Las rutas de roles los necesitan iguales. Que el diseño diga que se reusan (por
  ejemplo, que «confirmó hace menos de 5 minutos» pase al paso de sesión de la plataforma, junto a
  `confirmedAt`), y no que se copian en el archivo de roles.

## b5. Seguridad

La sección «Seguridad» (§ 21) contesta quién puede, darse acceso, quién administra, lo que ve
cualquiera, lo que entra de afuera y la auditoría. No dice qué datos nuevos toca (roles y permisos, sin
datos personales nuevos; `holders` expone nombres) ni secretos (ninguno nuevo): conviene decirlo en
una línea cada uno, como pide la constitución.

### b5.1 Una ruta sin su permiso (Mejora, fuerte)

- **Dónde:** § 21, «Una ruta nueva sin su paso es el riesgo: cada ruta … tiene una prueba que la pide
  sin el permiso».
- **Qué veo:** la defensa es una prueba por ruta, que alguien tiene que acordarse de escribir: una ruta
  nueva sin paso y sin prueba pasa `pnpm check`. Cada capítulo que siga va a sumar rutas.
- **Qué propongo:** que sea cerrado por defecto: una prueba (o un control de `pnpm check`) que recorra
  las rutas registradas en `http` y falle si una de `/api` no tiene permiso declarado ni está en una
  lista corta de las que solo piden sesión o nada (entrar, salir, `/api/start`, `holders`, el manual).
  Así el olvido falla solo.

### b5.2 Las claves foráneas (Frena)

- **Dónde:** § 15.
- **Qué veo:** el diseño da las claves primarias y un índice, no las foráneas. De ellas depende:
  - borrar a quien nunca entró (R3.7, E15): sus filas de `user_roles` tienen que irse con ella
    (`on delete cascade`) o la baja falla o quedan huérfanas;
  - borrar un rol (E39): `user_roles.role_id` sin borrado en cascada (`restrict`) es la última palabra
    si alguien se lo da a la vez (el bloqueo de § 19 ya lo frena, pero la base lo garantiza);
    `role_permissions` sí en cascada;
  - validar «contra la base» los ids de roles que llegan (§ 21): con la clave foránea alcanza, sin
    consulta aparte (b2.1).
- **Qué propongo:** escribirlas en la tabla de § 15.

### b5.3 El rechazo por permiso desde la plataforma (Mejora)

- **Dónde:** § 18, «Sin el permiso: `403` … Se anota como `users.rejected`».
- **Qué veo:** el paso es de la plataforma y lo van a usar todos los módulos. Que un `403` en una ruta
  de ventas quede como `users.rejected` confunde la auditoría, y la plataforma no debería conocer un
  evento de `users`. Además el tope de `users.rejected` es por motivo y persona afectada
  (`target`), que en otras rutas no existe.
- **Qué propongo:** un evento propio de la plataforma (`permission.denied`, con la ruta y el permiso),
  con su tope por sesión y permiso.

### b5.4 La auditoría de roles con ids (Mejora)

- **Dónde:** § 21 (`user.roles-changed` «con antes y después») y § 15 (`before`, `after`: ids).
- **Qué veo:** si se guardan solo ids, un rol borrado después deja la línea sin poder leerse (la
  auditoría no se modifica). R6.1 pide «lo que había antes y lo que quedó».
- **Qué propongo:** guardar id y nombre de cada rol en `user.roles-changed` y `user.authorized`, y en
  `role.changed` los permisos por id (que son fijos) más el nombre y la descripción de antes y después.

### b5.5 Límites de pedidos (Mejora)

- **Dónde:** § 18 y § 21.
- **Qué veo:** la etapa a pone 60 cambios por minuto por sesión en Usuarios; el diseño no dice si las
  rutas de roles entran en ese mismo límite (deberían, con la misma clave). `holders` es un `GET` con
  sesión y dos consultas: no le veo riesgo, pero conviene decir que no lleva límite y por qué.

### b5.6 Solo un rol `system` (Mejora)

- **Dónde:** § 15.
- **Qué veo:** nada impide dos filas con `system = true` (una migración o un arreglo a mano). El
  bloqueo de § 19 toma «la fila del rol `system`»: con dos, el bloqueo deja de ser uno solo.
- **Qué propongo:** un índice único parcial (`where system`), o que el bloqueo sea de otra cosa fija
  (`pg_advisory_xact_lock` con una clave), que no depende de una fila.

El resto está bien: el servidor decide cada pedido; darse acceso pide «Administrar roles» y Google o
la huella reciente; § 19 controla el último administrador y el «sí mismo» en una transacción con un
solo bloqueo; los ids de permisos se validan contra la lista; la entrada se acota. El control de R3.8
en `POST /api/roles/:id` y `POST /api/users/:id/roles` depende de comparar con lo que había
(«agregar» contra «quitar»): que el diseño diga que esa comparación se hace dentro de la transacción,
después del bloqueo, y que el `403 confirm-first` deshace todo.

## b6. Fronteras

No veo imports entre módulos que salteen la fachada: `permissions.require` sigue la forma de la sesión
del pedido (la plataforma recibe de `users` cómo saber los permisos), `sign-in` toma roles y permisos
de la fachada de `users`, y la lista de permisos está en `shared/`. Dos cosas ya dichas: `can()` en
`sign-in` ata el marco y los módulos de la aplicación a `sign-in` (b3.4), y el rechazo por permiso
anota un evento de `users` desde la plataforma (b5.3). Las reglas que propone (`roles.ts`: nombre
único, al menos un permiso, lo incluido, quedar sin quien administre) no dependen de la tecnología,
siempre que el conteo de § 19 decida en `roles.ts` con lo que le da `data.ts`, y no en SQL.

## b7. Sin conexión, hora y escala

### b7.1 La memoria de permisos y la escala (Mejora)

- **Dónde:** § 17, «Un servidor solo (constitución, IX)».
- **Qué veo:** la arquitectura («Escala») lista las tres piezas que cambian con varias copias del
  servidor (sesiones, avisos, auditoría). La memoria de permisos es una cuarta, con la misma forma: una
  copia no se entera de que otra cambió un rol, y el permiso quitado sigue valiendo en ella.
- **Qué propongo:** que quede detrás de la misma pieza de la plataforma que b4.1 propone, y que la
  arquitectura la sume a la lista (que cambie a `LISTEN/NOTIFY` junto con los avisos).

El módulo no atiende clientes ni proveedores. Lo que toca de sin conexión (R7.9, 15 · R3.1) está en
b1.4 y b1.5; con eso, sumar la cola sin conexión del 15 no obliga a rehacer nada, porque el servidor
igual pasa cada pedido por el paso de permisos. La hora de `last_roles_change.at` la pone el servidor.
Con 100 personas y 20 roles, el bloqueo único de § 19 no se nota (son cambios raros) y el conteo es
una consulta sobre tablas chicas.

## b8. Mejoras

- **Un código para «sin permisos» y «sin nombre» en un rol.** § 18 da `400` genérico a un rol sin
  permisos, mientras que a una persona sin roles le da `no-roles`. E37 pide «se dice por qué»: si la
  aplicación lo comprueba antes de mandar, alcanza con el `400`; si no, conviene `no-permissions`,
  simétrico.
- **La baja y la memoria de permisos.** § 17 borra la memoria en una baja; que la borre también en el
  alta, así no queda guardado el «sin permisos» de una persona dada de baja.
- **El arranque que suma permisos y varias copias.** Si dos arranques corren a la vez, la inserción en
  `known_permissions` con `on conflict do nothing` y sumar al rol solo lo que se insertó evita
  duplicados. Hoy hay una sola copia; que quede escrito.
- **La introducción del diseño.** Dice que «ya incorpora» las revisiones; para la etapa b todavía
  no: conviene que lo diga hasta el paso 5.
- **La prueba de punta a punta propuesta** (§ 23) está bien justificada (dos navegadores, la memoria
  del servidor y la cabecera); con b4.2 resuelto, además, es la que atraparía el bucle de `/api/start`.
