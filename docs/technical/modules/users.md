# Diseño técnico · 02 · Personas (`users`), etapa a

Cómo se construye la etapa a del capítulo [02 · Personas](../../chapters/02-users/rules.md):
personas y sesiones, con el único rol Administrador. La etapa b (roles y permisos) tendrá su propia
parte de este diseño. **Aprobado por Carlos.** Las
revisiones independientes están en [users-design-review.md](users-design-review.md) y
[users-security-review.md](users-security-review.md); este diseño ya las incorpora.

## 1. Qué resuelve

- **El capítulo 02, etapa a:** R1 a R6 y E01 a E32.
- **Lo que cambia en el 01:**
  - el primer Administrador deja de salir de la configuración (01 · R1.2);
  - el nombre que da Google deja de pisar el escrito (02 · R3.4);
  - entrar anota cómo se entró, si es un celular y la última vez que la persona entró (R3.2, R5.2);
  - tres arreglos del 01 que esta etapa destapa (§ 6): la memoria de sesiones que puede volver a
    guardar una sesión ya cerrada, la memoria de «de quién es la huella de cada celular» que nadie
    actualiza al quitarla, y el nombre de la persona que «Algo salió mal» guarda sin taparlo.
- **No resuelve:** roles ni permisos (etapa b), la auditoría para leer (05), los celulares con huella
  propios (04) ni el espejo (03).
- **E18 y E24** ya los cumple el 01 (una cuenta dada de baja no entra; un dispositivo cortado vuelve a
  la entrada con su primer pedido y manda lo pendiente con su prueba). Se prueban por ese camino, con
  pruebas que los nombran (`users-E18`, `users-E24`).

## 2. Entidades

No hay tablas ni esquemas nuevos: cambian tablas que ya existen, con migraciones nuevas.

### `users.users` (migración `002-people`)

| Columna | Cambio | Para qué |
|---|---|---|
| `name` | Pasa a ser el nombre que escribió quien la autorizó; nulo si no escribió | R3.4 |
| `google_name` | Nueva | El nombre que trae Google, guardado al entrar (hasta 80 letras) |
| `last_sign_in_at` | Nueva, `timestamptz` nulo | La última vez que entró (R3.2), con la hora del servidor |
| `authorized_by` | Nueva, `uuid` nulo | Quién la autorizó; nulo = la cargó la instalación («Desde la instalación») |
| `deactivated_at` | Nueva, `timestamptz` nulo | Desde cuándo está dada de baja («Dada de baja el …»); dar de alta lo vuelve nulo |
| `version` | Nueva, `integer` desde 1 | Sube con cada cambio hecho desde Usuarios (§ 5). Entrar no la sube |
| `created_at` | Ya estaba | «Autorizada el …» |

- **El traspaso:** lo que hay hoy en `name` (lo que trajo Google) pasa a `google_name`, y `name`
  queda nulo: hasta hoy nadie escribió un nombre. `last_sign_in_at` toma la sesión más reciente de
  cada persona; quien entró alguna vez y ya no tiene sesiones guardadas (se borran a los 30 días)
  toma su `created_at`, que es una cota. Solo pasa en el ambiente de pruebas.
- **Nunca entró** quiere decir `google_subject` y `last_sign_in_at` nulos. Decide si se puede cambiar
  el correo (R3.6) o borrar (R3.7).
- **El nombre que se muestra** (R3.4): el escrito; si no, el de Google; si no, el correo. Es una regla
  de `users/rules.ts`, una sola vez: la fachada da la persona con su `displayName` ya calculado, y
  `sign-in` lo toma de ahí (hoy lo repite en `context.ts`).

### `sign_in.sessions` (migración `003-access`)

| Columna | Cambio | Para qué |
|---|---|---|
| `way` | Nueva, `not null`: `google`, `passkey`, `qr` u `offline` | Cómo entró (R5.2). Sale de lo que `openSession` ya recibe para la auditoría (`data.method`). El celular que se abre al aprobar una computadora entró con la huella: `passkey` |
| `is_phone` | Nueva, `not null` | Si es un celular, con el criterio que ya decide ofrecer la huella. «Se perdió un celular» lista solo celulares (R5.7) |
| `passkey_id` | Nueva, nula | La huella con la que se entró, si se entró con una. Quitar la huella cierra también las sesiones abiertas con ella desde otro identificador de dispositivo |

La migración completa `way` con `google` e `is_phone` desde `device_label` («… en Android» o «… en
iPhone»): son sesiones de pocas horas. No se agregan índices: las sesiones son pocas (las cerradas se
borran a los 30 días) y ya hay uno por persona.

### `sign_in.passkeys` (la misma migración)

| Columna | Cambio | Para qué |
|---|---|---|
| `public_id` | Nueva, `uuid` | El identificador que ve la aplicación. El de WebAuthn y el `device_id` nunca salen del servidor (§ 9) |
| `device_label` | Nueva | «Chrome en Android», el nombre de la sesión que la vinculó (R5.5); las de antes, el de la sesión más reciente de su celular o «Celular» |

- **Quitar una huella la borra** (antes se marcaba `revoked_at`): lo que deja de valer se borra
  (constitución, V). La confirmación sin conexión ya busca solo las que existen.

## 3. Dónde vive cada cosa

- **`users`** tiene las personas: la lista, autorizar, cambiar, borrar, dar de baja y de alta, y el
  comando del primer Administrador. Sus reglas (el nombre que se muestra, nunca entró, el último
  Administrador) están en `rules.ts`; los bloqueos, en `data.ts`.
- **`sign-in`** tiene las sesiones y las huellas, así que también sus rutas para verlas y cortarlas
  desde Usuarios.
- **Sin ciclos:** `sign-in` ya recibe la fachada de `users` al crearse. `users` recibe de `sign-in`,
  al crearse, una función: `accessCounts(userIds, asking)`, cuántas sesiones abiertas y celulares con
  huella tiene cada persona, sin lo de quien pregunta que no se muestra (R5.2, R5.5). El armado del
  servidor (`app.ts`, que se prueba) las conecta, no `main.ts`.
- **La sesión del pedido, para cualquier módulo** (código común, tarea propia): `sign-in` registra un
  paso que lee la cookie y deja la sesión en el pedido (`c.get('session')`), y la plataforma da un
  `requireSession` genérico que solo la lee. Así `users` sabe quién pregunta sin importar `sign-in`, y
  sirve a todos los módulos que vienen.
- **Los eventos del proceso**, para que `sign-in` reaccione sin que `users` lo conozca:
  `user.deactivated` (ya está) y `user.renamed` (nuevo).

## 4. API

Todo con sesión y todo `GET` o `POST`, como ya habla la aplicación con el servidor; los cambios
llevan la `version` en el cuerpo. Las formas y los errores están en `src/shared/contracts/users.ts`,
una sola vez para el servidor y la aplicación.

| Ruta | Qué hace | Consultas | Módulo |
|---|---|---|---|
| `GET /api/users` | Todas las personas: id, nombre escrito, nombre que se muestra, correo, activa, autorizada el y por quién (o «la instalación»), dada de baja el, última entrada, nunca entró, versión y sus cantidades | 3 | users |
| `POST /api/users` | Autorizar: `{ email, name? }`. `409 email-taken` | 1 | users |
| `POST /api/users/:id` | Cambiar: `{ version, name?, email? }`. Sin `name`, no cambia; `name` vacío, vuelve al de Google. El correo, solo si nunca entró (`409 already-entered`) | 1 el correo; 3 el nombre, que se avisa en una transacción; una más si se rechaza | users |
| `POST /api/users/:id/delete` | `{ version }`. Borrar, solo si nunca entró | 1 a 2 | users |
| `POST /api/users/:id/deactivate` | `{ version }`. `409 self` si es la propia | 6, con el comienzo y la confirmación de la transacción | users |
| `POST /api/users/:id/activate` | `{ version }`. `409 self` si es la propia | 1 a 2 | users |
| `GET /api/users/:id/access` | Sus sesiones abiertas y sus celulares con huella, sin la sesión del pedido ni, en la propia, sus celulares | 2 | sign-in |
| `POST /api/users/:id/sessions/:sessionId/close` | «Cerrar» (R5.3). La sesión del pedido no se puede (se sale con «Salir») | 1 | sign-in |
| `POST /api/users/:id/sessions/close` | «Cerrar todas» (R5.4), salvo la del pedido | 1 | sign-in |
| `POST /api/users/:id/phones/:phoneId/cut` | `{ from: 'card' \| 'lost' }`. «Quitar» (R5.6) y «Cortar» (R5.7) son la misma operación: cierra las sesiones de esa persona en ese celular (y las abiertas con su huella) y borra la huella. El celular del pedido no se puede | 3 a 4 | sign-in |
| `GET /api/lost-phones` | Las personas con algún celular para cortar y sus celulares (con sesión abierta o con huella), sin el celular del pedido | 3; 2 si los nombres ya están en memoria | sign-in |

- **`phoneId`:** el `public_id` de la huella o, si el celular solo tiene una sesión, el `id` de la
  sesión. Lo resuelve el servidor; la aplicación nunca ve el `device_id` ni el identificador de
  WebAuthn.
- **Cortar algo que ya no está** (cerrar una sesión cerrada, quitar una huella quitada) no es un
  error: devuelve `200` con lo que cortó, en cero, y la pantalla dice «No había nada que cortar».
  Una persona o una sesión que no es de esa persona da `404`, igual que una que no existe.
- **Los errores nuevos**, con su texto en la aplicación junto al campo o al botón: `email-taken`,
  `already-entered`, `self`, `last-administrator` y `changed` (§ 5). Un correo sin forma de correo es
  `400 bad-request` del contrato; la aplicación lo comprueba antes de mandar.
- **Sesión abierta:** sin cerrar y sin vencer (60 minutos y 8 horas, mirando `created_at` y
  `last_used_at`, no solo `closed_at`: la limpieza que marca las vencidas corre una vez por día). Para
  contar alcanza el último uso de la base, con hasta un minuto de atraso; la tarjeta usa el de la
  memoria, que se muestra («Usada ahora»).
- **Después de un cambio,** la respuesta trae la persona como quedó, sin volver a contar sus
  sesiones: la aplicación conserva las cantidades que tenía (o las pone en cero después de una baja).

## 5. Lo que pasa a la vez

- **Dos cambian a la misma** (E30): cada cambio escribe con `where version = ?` y la sube. Si no tocó
  nada, lee la fila para saber por qué (`changed`, `already-entered` o `404`) y la devuelve; la
  pantalla la muestra y avisa «Cambió mientras la mirabas».
- **Nunca entró, en la misma consulta** (R3.6, R3.7): cambiar el correo y borrar escriben con
  `where google_subject is null and last_sign_in_at is null`. Entrar con Google ata la cuenta con
  `where id = ? and email = ? and google_subject is null`; si no tocó nada (lo borraron o le cambiaron
  el correo mientras entraba), la entrada se rechaza como no autorizada.
- **Activa, al abrir la sesión:** abrir una sesión, por cualquier camino, lee a la persona con
  `for share` dentro de su transacción, y dar de baja la bloquea con `for update`: una entrada y una
  baja no se cruzan. Si se cruzaran, la sesión nueva sería de alguien dado de baja.
- **Nunca sin Administrador activo** (R1.3, E05): dar de baja bloquea las filas de las personas
  activas (`select … where active order by id for update`; el orden evita que dos bajas se traben),
  cuenta y recién entonces cambia. Como nadie se da de baja a sí mismo y quien da de baja está activo,
  `last-administrator` solo sale en esa carrera. Borrar no necesita el bloqueo: quien borra está activo
  y la persona borrada nunca entró.
- **La prueba de E05:** las unitarias usan PGlite, que atiende una conexión a la vez: dos bajas «a la
  vez» corren una detrás de la otra y la prueba pasaría aun sin el bloqueo. La unitaria prueba la regla
  (la segunda baja ve que quedaría sin nadie). El bloqueo no tiene prueba automática: hoy no hay
  pruebas contra PostgreSQL de verdad, y armar una solo para esto no lo justifica. Se comprueba a mano
  contra la base del compose, con dos conexiones, al cerrar la etapa, y lo mira la revisión del código.

## 6. Los recorridos

- **Autorizar:** valida, normaliza el correo (minúsculas, sin espacios), guarda `authorized_by` e
  inserta. El índice único de `email` es la última palabra si dos autorizan el mismo a la vez.
- **Entrar** (cambia en `sign-in`): al abrir una sesión se anotan `way`, `is_phone` y `passkey_id`, y
  `users.recordSignIn(userId, at)` anota la última entrada con la hora del servidor, solo si sigue
  activa: si la dieron de baja mientras entraba, la sesión recién creada se cierra y no entra. La
  primera vez con Google, atar la cuenta y guardar `google_name` es una escritura aparte, antes. Una
  entrada sin conexión cuenta cuando el servidor la confirma, abra sesión o no (`ended`), con la hora
  de la confirmación.
- **Dar de baja:** la transacción de § 5 pone `active = false` y `deactivated_at`, y publica
  `user.deactivated`; en `sign-in`, en la misma transacción, se cierran sus sesiones (`deactivated`)
  y se borran sus huellas.
- **Dar de alta:** `active = true`, `deactivated_at` nulo. Las huellas no vuelven (R4.2).
- **Renombrar:** cambia el nombre y publica `user.renamed` en la misma transacción; al confirmarla,
  `sign-in` olvida a esa persona de su memoria, así `/api/start` devuelve el nombre nuevo.
- **Cerrar, Cerrar todas y Cortar** cierran con el motivo `revoked`, el que ya hace que el
  dispositivo vuelva a la entrada con «Tu sesión se cerró desde otro dispositivo» en su próximo
  pedido (01 · R3.5). Nada en tiempo real: se entera con su próximo pedido, sin consultas propias.
- **La memoria de `sign-in` se pone al día en un solo lugar.** Cada camino que cierra sesiones o borra
  huellas (cerrar, cerrar todas, cortar, la baja) pasa por una función que, después de confirmar la
  transacción, saca las sesiones de la memoria, olvida a la persona y borra la entrada de su celular en
  `phoneOwners`. Así un celular cortado no vuelve a recibir `offline: true` y se le vuelve a ofrecer
  vincular la huella (E19, E26, E31).
- **Arreglo del 01: la memoria de sesiones.** Hoy la sesión sale de la memoria dentro de la
  transacción, antes de confirmarla: un pedido que llega en ese momento la lee abierta de la base y la
  vuelve a guardar, y queda valiendo hasta 8 horas. Pasa a ser así: la memoria lleva un contador de
  cierres; cada cierre lo sube antes y después de confirmar, y lo leído de la base se guarda en memoria
  solo si el contador no cambió mientras se leía. Lo mismo para la baja. Con una prueba que mete un
  pedido justo en ese momento.

## 7. El primer Administrador (R1.2)

- **El comando:** `node src/server/first-administrator.ts <correo> [nombre]`; en el contenedor,
  `docker compose exec server node src/server/first-administrator.ts …`. Toma solo `DATABASE_URL` del
  ambiente (el correo nunca sale de la configuración, que es lo que pide la regla), corre las
  migraciones y, con un bloqueo de la tabla, inserta a la persona solo si no hay ninguna; si hay, sale
  con un error que lo dice y no cambia nada. No anota en la auditoría (es otro proceso, y la auditoría
  tiene un solo escritor): la persona queda con `authorized_by` nulo, «Desde la instalación».
- **Se va la variable:** `INITIAL_ADMIN_EMAIL` deja de existir en `platform/config.ts`, el `.env` de
  ejemplo, `deploy/oracle/install.sh` (que pasa a correr el comando después de comprobar que el
  servidor responde, con el correo entre comillas) y `docs/technical/modules/sign-in.md` (§ 11). El
  arranque ya no crea a nadie. El ambiente de pruebas ya tiene personas: sacar la variable de su
  `.env` va con el despliegue de esta etapa.
- **Las pruebas de punta a punta** levantan el servidor con la base en memoria, que un comando aparte
  no ve. Con `ENVIRONMENT=e2e` (que ya exige la base en memoria), el arranque carga a la persona de
  prueba de una variable propia, `E2E_FIRST_ADMIN_EMAIL`, que la configuración rechaza en cualquier
  otro ambiente; usa la misma función que el comando. Nunca es una ruta de la API.

## 8. La aplicación (`src/app/modules/users/`)

- **Dónde:** Más → Usuarios, con las pestañas Usuarios · Auditoría (Auditoría con «Pronto» hasta el
  05), como dicen 00 · R1.2 y 02 · R2.1. Como pidió Carlos, en el paso 6 se le muestra el menú antes de
  tocarlo, y él decide el final. La opción lleva `needsInternet` (R2.2), como el manual.
- **Una sola pantalla para los dos tamaños** (ADR-002), con piezas: lista, tarjeta, autorizar, «Se
  perdió un celular» y las confirmaciones (dar de baja y Cerrar todas). En la computadora la lista y la
  tarjeta van lado a lado; en lo angosto, elegir a alguien muestra solo su tarjeta, que entra desde la
  derecha, y es un paso de la historia: el botón atrás vuelve a la lista (`back-step`).
- **El estado:** la lista entera se pide al abrir la opción; el buscador, los filtros (Todas, Activas,
  Sin entrar, De baja) y el orden de R3.1 los hace la aplicación sobre esa lista. La tarjeta se pide al
  elegir a alguien. No se guarda nada en el dispositivo.
- **Sin conexión:** gris. Al volver la conexión se prende sola, con la lista que tenía, sin pedirla de
  nuevo: no es un pedido automático (`mobile-data.md` no cambia). Un cambio sobre un dato viejo lo
  frena la `version` (§ 5). Con una entrada sin conexión que el servidor todavía no confirmó (15 · R3),
  la lista espera a esa confirmación: antes, su sesión no existe en el servidor y el pedido la daría
  por cerrada.
- **«Entró hace 3 días»** se calcula con la hora del servidor que la aplicación ya tiene
  (`platform/server/clock`), no con la del dispositivo.
- **La propia:** la tarjeta no ofrece dar de baja y dice «No te podés dar de baja vos: lo tiene que
  hacer otro Administrador» (E03).
- **El menú:** Usuarios es una opción de Más, entre «Mejoras y errores» y «Configuración», con Alt S
  y sus pestañas Usuarios · Auditoría (Auditoría, «Pronto» hasta la etapa b). En el celular, Más es
  una sola lista, sin grupos, en el mismo orden que la computadora.
- **El teclado** (00 · R2): el menú está siempre a la vista, así que las teclas de la pantalla no
  usan las suyas: Alt Z autorizar, Alt I «Se perdió un celular», Alt D cerrar todas, Alt B dar de
  baja o borrar, Alt L dar de alta, `/` buscar; en la tarjeta, «Cerrar» y «Quitar» con las flechas y
  Enter (R5.8).
- **`data-private`:** nombres y correos. En «Algo salió mal», ni lo que está dentro de algo marcado
  ni un botón que lleva algo marcado adentro (el renglón de una persona) entra en los últimos pasos.

## 9. Seguridad

- **Qué datos toca:** nombres y correos de las personas, y desde qué dispositivos entran. Nada sale
  del servidor sin sesión. Los identificadores de los dispositivos y de las huellas no salen nunca: la
  aplicación ve otros, opacos (§ 4), porque con el de una huella cualquiera podría bloquearla mandando
  firmas falsas.
- **Quién puede:** en la etapa a, cualquier persona activa con sesión (R1.1), como decidió Carlos; la
  etapa b le pone el permiso. Nadie se da de baja ni de alta a sí mismo, y nunca queda nadie activo
  (§ 5), en el servidor.
- **Lo que entra de afuera:** los cuerpos, con zod y largos máximos (correo 254, nombre 80, el de
  Google se corta en 80); los nombres sin caracteres de control ni de dirección del texto; los
  identificadores de la dirección, UUID; la `version`, un entero entre 1 y 2³¹ − 1.
- **Ver o cambiar lo ajeno:** las rutas de sesiones y celulares nombran a la persona y comprueban que
  la sesión o el celular sean suyos antes de cortar; si no, `404`.
- **Abuso:** hoy ninguna ruta con sesión tiene límite. Se agregan dos, en la plataforma: los cambios de
  Usuarios, 60 por minuto por sesión; y las cookies que no corresponden a ninguna sesión, 30 por minuto
  por dirección (cada una cuesta una consulta).
- **Secretos:** ninguno nuevo.
- **El comando del primer Administrador** solo corre dentro del servidor: no hay ruta que cree a
  alguien sin sesión.
- **La auditoría** (R6.1), escrita después de confirmar la transacción (ADR-004): `userId` es quien lo
  hizo y la persona afectada va en `data.targetUserId` (el 05 la va a buscar ahí). Las líneas:
  `user.authorized`, `user.renamed`, `user.email-changed`, `user.deleted`, `user.deactivated`,
  `user.activated`, `session.closed`, `sessions.closed-all`, `passkey.removed` y `phone.cut`. Cerrar
  sesiones deja además una `session.ended` por sesión, como ya hace hoy. Los rechazos (`self`,
  `last-administrator`, `changed`, `404`) se anotan una vez por minuto por motivo y persona, como los
  de la plataforma. Arreglo del 01: `session.ended` se anota hoy antes de confirmar; pasa a después.

## 10. Metas de performance

- Las consultas de cada ruta, en la tabla de § 4, cada una con su prueba que las cuenta.
- `GET /api/users` con 100 personas (constitución, IX): menos de 50 ms y menos de 20 KB.
- El arranque de la aplicación no crece: la pantalla se baja recién al abrir la opción, con `import()`,
  como el manual.

## 11. Pruebas

| Escenarios | Prueba |
|---|---|
| E01, E02 | Del comando contra la base de prueba: con la tabla vacía carga; con alguien, se niega |
| E03, E04 | De las rutas: la propia da `self` (también al dar de alta); la última activa da `last-administrator`. E03, también de la pantalla (el aviso) |
| E05 | La regla, en las unitarias; el bloqueo, a mano contra PostgreSQL (§ 5) |
| E06, E07 | De la pantalla, con el servidor de mentira: el orden, «Vos», la pastilla, «Entró hace 3 días» con la hora del servidor |
| E08 a E16 | De las rutas y de la pantalla: autorizar, correo repetido o mal escrito, el nombre escrito contra el de Google, cambiar el correo y borrar solo si nunca entró, también si la persona entra a la vez |
| E17, E19, E20 | De las rutas: la baja cierra sesiones y borra huellas; el alta no las devuelve y vuelve a ofrecer vincular; sin confirmar no cambia nada (pantalla) |
| E18, E24 | Por el camino del 01, con su nombre (§ 1) |
| E21 a E23, E25 a E27, E31, E32 | De las rutas: cada sesión con cómo entró; la propia no figura; cerrar, cerrar todas y cortar; el celular cortado recibe `session-closed` en su próximo pedido y ya no `offline` |
| E28 | Cada cambio deja su línea, con quién y a quién, después de confirmar |
| E29 | De la pantalla: sin conexión, gris; al volver, se prende sin pedir nada |
| E30 | De las rutas: un cambio con una versión vieja da `changed` |
| E33 | De las rutas: autorizar y dar de alta con una sesión vieja dan `confirm-first`; después de confirmar con Google o la huella (de la misma persona), pasan. De la pantalla: la hoja pide confirmar y repite el pedido sola |
| Seguridad | Un pedido que llega mientras se cierra su sesión no la vuelve a guardar; las rutas no dan el `device_id` ni el identificador de la huella; un celular de otra persona da `404`; los dos límites nuevos |
| Metas | Las que cuentan las consultas de cada ruta |

**De punta a punta** (`tests/e2e/users.spec.ts`, aprobada por Carlos): una sola, cerrar la sesión de
una computadora desde otra y ver que la primera vuelve a la entrada con «Tu sesión se cerró desde otro
dispositivo» con su próximo pedido. Cruza dos navegadores, la cookie y la memoria del servidor.

## 12. Tareas

1. **Código común:** la sesión del pedido para cualquier módulo y los dos límites nuevos (§ 3, § 9).
   Se toma como tarea propia.
2. **Migraciones y datos** (`users` y `sign-in`), con el traspaso.
3. **El comando del primer Administrador,** la variable de las pruebas de punta a punta y sacar
   `INITIAL_ADMIN_EMAIL` (servidor, instalación, documentación de operación y diseño del 01).
   Depende de 2.
4. **Los arreglos del 01:** la memoria de sesiones (§ 6), la auditoría después de confirmar y la marca
   de «Algo salió mal». Depende de 2.
5. **Entrar anota** cómo y cuándo, sin pisar el nombre, con los controles de § 5. Depende de 2 y 4.
6. **Las rutas de `users`** (§ 4, § 5). Depende de 1 y 2.
7. **Las rutas de `sign-in`,** con la función que pone al día la memoria, la baja que borra huellas y
   volver a confirmar con Google o la huella (§ 13). Depende de 1, 4 y 5.
8. **Las cantidades** conectadas en `app.ts`. Depende de 6 y 7.
9. **La aplicación:** el menú (con Carlos), la pantalla y sus piezas. Depende de 6 y 7.
10. **Las pruebas de § 11, la documentación al día y la de punta a punta,** si Carlos la aprueba.

## 13. Pasar por Google o la huella antes de autorizar o de dar de alta (R3.8)

- **En la sesión** se guarda también cuándo se puso la huella por última vez (`passkey_at`), además
  de `google_at`, que ya está. Autorizar y dar de alta comprueban en el servidor que alguna de las dos
  sea de hace menos de 5 minutos (la misma regla que vincular la huella, `linkPasskeyWithinMs`); si no,
  `403 confirm-first`.
- **Volver a confirmar sin salir:** `POST /api/session/confirm/google` (el pase de Google, con su
  `nonce`) y `POST /api/session/confirm/passkey` (una firma de la huella de esa persona en ese
  celular) actualizan `google_at` o `passkey_at` de la sesión del pedido, sin abrir otra. La huella y
  Google tienen que ser de la misma persona de la sesión; si no, `403` y se anota.
- **La aplicación:** con `confirm-first`, una hoja pide «Continuar con Google» (el botón de su marco,
  como en la entrada) o, en un celular con huella, la huella; al pasar, repite el pedido sola.
- **La computadora que entró con el celular** no tiene Google reciente: lo pasa en esa hoja.
- **«Dada de alta de nuevo hoy»,** que mostraba la maqueta, es historia: va en la auditoría. La tarjeta
  muestra «Dada de baja el …» mientras lo está; al darla de alta, nada (lo decidió Carlos).
- **La prueba de punta a punta** propuesta en § 11 está aprobada.
