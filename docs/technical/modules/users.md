# Diseño técnico · 02 · Personas (`users`)

Cómo se construye el capítulo [02 · Personas](../../chapters/02-users/rules.md). Las secciones 1 a 13
son la etapa a (personas y sesiones), **aprobada por Carlos**; las 14 a 24, la etapa b (roles y
permisos), corregida con sus dos revisiones y **aprobada por Carlos**, con la prueba de punta a punta. Las
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
  huella tiene cada persona, sin lo de quien pregunta que no se muestra (R5.2, R5.5). Las conecta
  `src/server/modules.ts`, que usan `main.ts` y las pruebas.
- **La sesión del pedido, para cualquier módulo** (`platform/session.ts`): `sign-in` le da a la
  plataforma cómo leerla (`sessions.provide`) y cualquier módulo la pide con `sessions.require` y la
  lee con `sessionOf(c)`: quién es, su sesión, su dispositivo y cuándo confirmó quién es por última
  vez (R3.8). Así `users` sabe quién pregunta sin importar `sign-in`.
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
| `POST /api/users/:id/sessions/:sessionId/close` | «Cerrar» (R5.3). La sesión del pedido no se puede (se sale con «Salir»); una de otra persona da `404` | 2 | sign-in |
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
- **Activa, al abrir la sesión:** abrir una sesión, por cualquier camino, primero la crea y después
  anota la entrada con `where active` (`users.recordSignIn`). Si no tocó ninguna fila, la dieron de
  baja mientras entraba: la sesión recién creada se cierra y la entrada se rechaza. Una baja a la vez,
  o cerró esa sesión con las demás, o la deja para que la cierre la entrada: nunca queda abierta.
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
- **Al abrir, en la computadora,** queda elegida la primera de la lista (la propia), así la tarjeta
  nunca está vacía (pedido de Carlos); en lo angosto no, porque la tarjeta taparía la lista.
- **Las pestañas** Usuarios · Auditoría llevan su ícono; en el celular, la abierta va en pino y la
  otra en blanco, así se ve que se eligen (pedido de Carlos).
- **En el celular** (referencia de Carlos): la cabecera es el título con la luz debajo y el botón
  «Buscar usuario», que abre un diálogo como el de «Autorizar a alguien» con la caja para buscar y los
  filtros: la lista cambia mientras se escribe, «Limpiar» saca todo y el botón principal dice cuántas
  personas se ven (un punto en «Buscar usuario» dice que hay algo puesto); las cuentas, en tres
  tarjetas con su ícono de color; abajo, «Se perdió un celular» como botón secundario neutro (no
  es un aviso: sin rojo) al lado de «Autorizar a alguien». La tarjeta
  tiene arriba «‹ Usuarios», las iniciales a la izquierda del nombre y del correo, y tres botones: «Cortar sesión» (Cerrar todas), «Quitar huella» (con un
  solo celular lo quita; con más, lleva a la lista) y «Cambiar rol» («Pronto» hasta la etapa b); las
  sesiones en una sola tarjeta con «Ver historial» («Pronto»); abajo, tres renglones que llevan a cada
  parte (Huella digital, Dispositivos e Historial de acceso, este con «Pronto» hasta el 05) y «Dar de
  baja» con borde rojo. En la computadora no cambia nada.
- **«Autorizar a alguien», en la computadora,** abre con el cursor en la caja del nombre (00 · R2.2,
  pedido de Carlos); en el celular no, para que no se abra el teclado (R2.12).
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
  identificadores de la dirección, UUID (`uuidParams` de la plataforma: con otra forma, `404` sin
  llegar a la base); la `version`, un entero entre 1 y 2³¹ − 1.
- **Ver o cambiar lo ajeno:** las rutas de sesiones y celulares nombran a la persona y comprueban que
  la sesión o el celular sean suyos antes de cortar; si no, `404`.
- **Abuso:** dos límites, en la plataforma: los cambios de Usuarios, 60 por minuto por sesión; y las
  cookies que no corresponden a ninguna sesión, 30 por minuto por dirección (cada una cuesta una
  consulta). Una sesión que ya está en la memoria del servidor no la frena ese tope: quien comparte la
  dirección del local no deja sin trabajar a los demás.
- **Una computadora que entró con el QR** recuerda con qué huella se aprobó (`approved_by`, migración
  `004-approved`): cortar ese celular la cierra también (R5.6, R5.7).
- **Secretos:** ninguno nuevo.
- **El comando del primer Administrador** solo corre dentro del servidor: no hay ruta que cree a
  alguien sin sesión.
- **La auditoría** (R6.1), escrita después de confirmar la transacción (ADR-004): `userId` es quien lo
  hizo y la persona afectada va en `data.targetUserId` (el 05 la va a buscar ahí). Las líneas:
  `user.authorized`, `user.renamed`, `user.email-changed`, `user.deleted`, `user.deactivated`,
  `user.activated`, `session.closed`, `sessions.closed-all`, `passkey.removed` y `phone.cut`. Cerrar
  sesiones deja además una `session.ended` por sesión. Los rechazos (`self`, `last-administrator`,
  `changed`, `404`, también los de cerrar y cortar) se anotan como `users.rejected` una vez por minuto
  por motivo y persona; pasado el límite de cambios, `users.throttled`; una confirmación de Google o la
  huella que no es de esa persona, `session.confirm-rejected`. Dar de alta o de baja a quien ya estaba
  así contesta cómo está y no anota nada. `session.ended` se anota después de confirmar.

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

## 13. Pasar por Google o la huella antes de autorizar, cambiar el correo o dar de alta (R3.8)

- **En la sesión** se guarda también cuándo se puso la huella por última vez (`passkey_at`), además
  de `google_at`, que ya está; una entrada sin conexión no la pone, porque la huella se puso horas
  antes. Autorizar, cambiar el correo y dar de alta comprueban en el servidor que alguna de las dos
  sea de hace menos de 5 minutos (la misma regla que vincular la huella, `linkPasskeyWithinMs`); si no,
  `403 confirm-first`.
- **Volver a confirmar sin salir:** `POST /api/session/confirm/google` (el pase de Google, con su
  `nonce`) y, con el desafío de `POST /api/session/confirm/passkey/options`, `POST
  /api/session/confirm/passkey` (una firma de la huella de esa persona) actualizan `google_at` o
  `passkey_at` de la sesión del pedido, sin abrir otra. La huella y Google tienen que ser de la misma
  persona de la sesión; si no, `403` y se anota.
- **La aplicación:** con `confirm-first`, una hoja pide «Continuar con Google» (el botón de su marco,
  como en la entrada) o, en un celular con huella, la huella; al pasar, repite el pedido sola. La hoja
  va encima de lo que se estaba haciendo, que sigue abierto: un correo repetido se dice junto al campo
  de «Autorizar a alguien»; al cambiar el correo en la tarjeta, en una tostada. La hoja se baja recién
  cuando hace falta (`loadConfirmSheet` de `sign-in`).
- **La computadora que entró con el celular** no tiene Google reciente: lo pasa en esa hoja.
- **«Dada de alta de nuevo hoy»,** que mostraba la maqueta, es historia: va en la auditoría. La tarjeta
  muestra «Dada de baja el …» mientras lo está; al darla de alta, nada (lo decidió Carlos).
- **La prueba de punta a punta** propuesta en § 11 está aprobada.

---

# Etapa b · roles y permisos

## 14. Qué resuelve

- **El capítulo 02, etapa b:** R7 completa (también R7.11, «nadie sobre quien tiene más», R7.12,
  buscar un rol, y R7.13, armar un rol de una vez, con E61 a E65) y los
  cambios a R1.1, R1.3, R2.1, R3.1, R3.3, R3.8, R4.3, R5.1 y R6.1, con E34 a E60 y los escenarios de
  la etapa a que cambian (E01, E03 a E06).
- **Las dos revisiones del paso 4** ([diseño](users-design-review.md) y
  [seguridad](users-security-review.md), sección «Etapa b»): este diseño ya las incorpora, con las
  decisiones de Carlos sobre los puntos que cambiaban reglas (R1.3, R4.3, R7.1 y R7.11).
- **Lo que cambia en otros capítulos:** el menú esconde lo que no se puede usar y abre la primera
  opción permitida (00 · R1.4, R1.8); «Trabajar sin conexión» pasa a pedir su permiso (15 · R1.2).
- **No resuelve:** el modo llavero (T114), la pantalla de la auditoría (05), las sesiones propias en
  Configuración (04) ni pedir un permiso desde la aplicación (Carlos lo descartó).

## 15. Entidades

Migración `003-roles` del esquema `users`, con claves foráneas:

| Tabla | Columnas | Para qué |
|---|---|---|
| `users.roles` | `id` uuid, `name` (hasta 40 letras, NFC), `description` (hasta 200, nula), `system` boolean, `version` integer, `created_at` | Los roles (R7.3). `system` marca al Administrador: no se borra y recibe los permisos nuevos (R7.4). Índice único sobre `lower(name)` y otro, parcial, que deja un solo `system` |
| `users.role_permissions` | `role_id` → `roles` (`on delete cascade`), `permission`; clave de los dos | Qué permisos da cada rol |
| `users.user_roles` | `user_id` → `users` (`on delete cascade`), `role_id` → `roles` (`on delete restrict`); clave de los dos; índice por `role_id` | Qué roles tiene cada persona (R7.5). Borrar a quien nunca entró se lleva sus roles; un rol que alguien tiene no se puede borrar ni por error (R7.3, R4.3) |
| `users.known_permissions` | `permission`, clave | Los permisos que el sistema ya conoce, para saber cuáles son nuevos (§ 16) |
| `users.users` | `roles_changed_by` uuid nulo, `roles_changed_at` nulo | Quién le cambió los roles por última vez, para «Ya no tenés permiso» (R7.8). Lo que tenía antes lo sabe la aplicación, que compara la persona de antes con la nueva |

- **El traspaso** (R7.10): crea el rol Administrador (`system = true`), sin permisos, y se lo da a
  todas las personas que ya existen. Los permisos se los suma el arranque, como a cualquier permiso
  nuevo (§ 16): un solo camino.
- **El primer Administrador** (R1.2): el comando y la carga de las pruebas de punta a punta le dan el
  rol `system`.
- **La baja conserva los roles** (R4.3): no se tocan; las consultas que cuentan quién tiene un rol o
  un permiso miran solo a las personas activas.

## 16. Los permisos

- **Una lista fija en el código,** compartida por el servidor y la aplicación:
  `src/shared/contracts/permissions.ts`. Cada permiso tiene su id en inglés, la parte a la que
  pertenece, su nombre y su explicación en castellano (los de R7.1 y 15 · R1.2) y los que incluye:

  | Id | Nombre | Parte | Incluye |
  |---|---|---|---|
  | `users.view` | Ver las personas | Usuarios | |
  | `users.manage` | Administrar personas | Usuarios | `users.view` |
  | `users.cut` | Cortar sesiones y huellas | Usuarios | `users.view` |
  | `roles.manage` | Administrar roles | Usuarios | `users.view` |
  | `offline.work` | Trabajar sin conexión | Sin conexión | |

  Cada capítulo que llega suma sus filas ahí, con la parte nueva. `can(person, id)` también vive en
  `shared/`: la usan el marco y los módulos de la aplicación sin depender de `sign-in`.
- **Un permiso nuevo** (R7.4): al arrancar, el servidor compara la lista con `known_permissions`; los
  que faltan se anotan y se le suman al rol `system`, en una transacción, con su línea en la auditoría
  (`role.permissions-added`, hecha por el sistema). Un permiso que alguien le sacó al Administrador
  no vuelve solo: solo se suman los nuevos de verdad.
- **Un permiso que ya no está en la lista** (por ejemplo, al volver a una versión anterior) se ignora
  al leer y no se borra: si la lista vuelve a tenerlo, los roles lo conservan.
- **«Incluye»** se guarda tildado (R7.1): al guardar un rol, el servidor agrega lo incluido; la
  pantalla lo muestra con candado.
- **Lo que no pide permiso** (R7.2) no tiene id: esas rutas declaran que solo piden sesión (§ 21).

## 17. Dónde vive cada cosa

- **`users`** tiene los roles, sus permisos, quién los tiene y las reglas (`roles.ts`: el nombre único,
  al menos un permiso, lo incluido, quedar sin quien administre y «nadie sobre quien tiene más»). Su
  fachada suma `permissionsOf(userId)` (los permisos de la persona activa: la unión de sus roles),
  `outranks(asking, target)` y `outranking(asking, userIds)` (R7.11, de una o de varias en una
  consulta) y `profileOf(user)` (sus roles con nombre, sus permisos y quién le cambió los roles, en
  una consulta, para la persona de `sign-in`). La lista de Usuarios trae, de cada persona, si tiene
  más permisos que quien mira (`outranks`), así la aplicación no muestra sus botones.
- **La plataforma** suma el paso `permissions.require(id)` (`platform/permissions.ts`), como la sesión
  del pedido: `users` le da cómo saber los permisos de alguien y cualquier módulo lo pide en sus
  rutas sin importar a `users`. Va después de `sessions.require`.
- **Una sola pieza de memoria con contador** (`platform/memory.ts`), la que ya arregló la carrera de la
  memoria de sesiones (§ 6), para la de permisos y la de personas de `sign-in`: un cambio sube el
  contador antes y después de confirmar, y lo leído de la base se guarda solo si el contador no cambió
  mientras se leía. Así un permiso quitado no puede quedar guardado.
- **Lo que borra la memoria:** todo cambio de roles, de sus permisos, de quién los tiene o una baja
  publican, al confirmar, `users.permissions-changed` (con las personas afectadas, o todas si cambió
  un rol); `users` borra sus permisos y `sign-in` olvida a esas personas, así `/api/start` devuelve
  lo nuevo.
  Un servidor solo (constitución, IX): vale desde el próximo pedido (R7.6) sin consultas extra. Con
  varias copias del servidor esto no alcanza: queda anotado para cuando haga falta escalar.
- **`sign-in`** deja de inventar `role: 'Administrador'`: la persona de `/api/start` y de entrar
  lleva sus roles (id y nombre), sus permisos y quién le cambió los roles y cuándo, de la fachada de
  `users`. Todo lo de «Trabajar sin conexión» (`canWorkOffline`, los cinco lugares que hoy miran si
  la persona está activa, también confirmar una entrada sin conexión, 15 · R3.1) pide `offline.work`.

## 18. API

Todo con sesión, `GET` o `POST`, con `version` en los cambios, como la etapa a. Las formas, en
`src/shared/contracts/users.ts` y `roles.ts`, estrictas: un campo que no está en el contrato
(`system`, por ejemplo) da `400`.

| Ruta | Permiso | Qué hace | Consultas |
|---|---|---|---|
| `GET /api/roles` | `roles.manage` | Los roles con descripción, permisos y versión. Quiénes los tienen sale de `GET /api/users`, que ya trae los roles de cada persona, activas y dadas de baja (E60) | 2 |
| `POST /api/roles` | `roles.manage` | Crear (también duplicar, que arma el cuerpo en la aplicación): `{ name, description?, permissions, give? }`. `409 role-name-taken`, `400` sin permisos, `409 too-many-roles` con 100 roles | 8 + 4 con personas, con § 19 |
| `POST /api/roles/:id` | `roles.manage` | Guardar todo junto (R7.13): `{ version, name?, description?, permissions?, give?, take? }`; un nombre que ya tiene otro, `409 role-name-taken` | 11 + 4 con personas, con § 19 |
| `POST /api/roles/:id/delete` | `roles.manage` | `{ version }`. `409 role-in-use` si alguien lo tiene (también una persona dada de baja), `409 system-role` si es el Administrador | 7, con § 19 |
| `POST /api/users/:id/roles` | `roles.manage` | Los roles de una persona: `{ version, roles }`, al menos uno (`400 no-roles`). La usan la tarjeta de la persona y el diálogo de autorizar; la pestaña Roles no (sus personas van con el rol) | 12, con § 19 |
| `GET /api/permissions/:id/holders` | sesión | Para «Sin permiso» (R7.7): los roles que tienen ese permiso y, de las personas activas que lo tienen, solo el nombre (nunca el correo: sin nombre, «Sin nombre»); quiénes tienen `roles.manage` | 4 |
| `GET /api/start` | ninguno | Ya estaba; la persona suma roles, permisos y quién le cambió los roles | 0 con la persona en memoria; 2 si no |

- **Cambian las de la etapa a:**
  - `GET /api/users` pide `users.view` y suma, una sola vez, la lista de roles (id, nombre y
    descripción) y los ids de los roles de cada persona: con eso salen las pastillas y el filtro por
    rol (R3.1, E54) sin pedir `roles.manage`; y de cada persona, si tiene algún permiso que quien
    mira no tiene (`outranks`, R7.11), así sus botones no aparecen. Dos consultas más (5).
  - Autorizar pide `users.manage` y `roles.manage` y suma `roles` (al menos uno), en la misma
    sentencia que guarda a la persona: un rol que no existe la frena por la clave foránea (`400`).
    Sigue en 1 consulta.
  - Cambiar el nombre y borrar piden `users.manage`. Borrar no necesita el control de § 19 (E59):
    solo se borra a quien nunca entró, que no cuenta como quien administra, y la condición se
    comprueba en la misma sentencia que borra.
  - Cambiar el correo, dar de baja y de alta piden `users.manage` y que la persona no tenga más
    permisos que quien lo hace (R7.11, `403 outranked`): una consulta más cada una (2, 8 y 2). La
    baja pasa a § 19, con el bloqueo y el primer conteo en una sola consulta.
  - Ver las sesiones y los celulares pide `users.view`; cerrar, cerrar todas, cortar y «Se perdió un
    celular», `users.cut` y R7.11 (un celular de alguien con más permisos no aparece en «Se perdió un
    celular»): una consulta más cada una, los permisos de esas personas en una sola.
  - Entrar con Google o con la huella y `/api/start` sin la persona en memoria suman sus roles, sus
    permisos y quién le cambió los roles, en una consulta.
- **Las personas de un rol, con el rol** (R7.13, E62, E63, E65): `give` y `take` son los ids de las
  personas a las que se les da o se les saca el rol, no el conjunto entero, así no se pisa lo que
  otro cambió en la tarjeta de una persona mientras tanto. Todo va en la transacción de § 19: el rol
  primero (en uno nuevo, se crea y sus personas se le dan con su id) y las personas después, en
  cuatro consultas para cualquier cantidad:
  1. Una que bloquea las filas pedidas (`for update`, ordenadas por id) y trae de cada una si está
     activa y sus roles (`array_agg`). Un id que no trajo (inventado, o el alta que borraron mientras
     se armaba el rol) da `409 person-missing` con su `userId`; una dada de baja, `409
     person-inactive`; quien se quedaría sin roles (contando solo los que de verdad tiene y saca),
     `400 no-roles`; quien pasaría de 50 roles, `409 too-many-roles`. En cualquiera, no se guarda
     nada, ni el rol.
  2. `insert … on conflict do nothing returning` y 3. `delete … returning`: dicen a quiénes se les dio
     y sacó de verdad. Dar a quien ya lo tiene o sacar a quien no lo tiene no cambia nada.
  4. Solo a esas personas: subir su `version` y anotar `roles_changed_by` y `roles_changed_at`. Solo
     ellas van a la memoria (§ 17) y a la auditoría.

  Las 8 o 11 del rol son las de antes (la respuesta del cambio lee el rol en 2): el bloqueo de § 19 con el permiso de quien pide, la versión,
  el nombre, los permisos (borrar y poner), el control de quien administra y, al confirmar, la
  memoria. Como mucho 200 ids en cada lista, sin repetidos y sin el mismo id en las dos (`400`).
- **La `version` del rol** sube solo si cambian su nombre, su descripción o sus permisos, y
  `role.changed` va solo en ese caso; se compara siempre, aunque solo cambien sus personas.
- **Qué se dice y de quién** (E65): cada error del rol lleva `{ error, userId?, permission? }`: la
  persona que lo causó, si es por una, y el permiso, si es por uno (`self`: quien guarda se sacaría
  «Administrar roles» o «Administrar personas»), así la pantalla lo muestra en su renglón. La
  aplicación controla antes lo que ya sabe (sin nombre, sin permisos, un nombre que ya está en la
  lista, alguien que se quedaría sin roles, sacarse a sí mismo un permiso de R1.3) y muestra todos a
  la vez; el servidor tiene la última palabra y devuelve el primero que encuentra.
- **Sin el permiso:** `403 { error: 'forbidden', permission }`, sin cerrar la sesión (R7.6).
- **Lo que da acceso pide confirmar** (R3.8, § 13): crear un rol, agregarle permisos y darle un rol a
  alguien (también al autorizar y con `give`) dan `403 confirm-first` si Google o la huella son de
  hace más de 5 minutos. Si un cambio da algo se decide dentro de la transacción, contra lo que hay en
  la base (sacar un rol y poner otro es dar). Quitar no lo pide. Un guardado de la pestaña Roles es
  un solo pedido: se confirma una sola vez, y después de confirmar la aplicación repite ese mismo
  pedido.
- **Lo que entra:** listas sin repetidos (se rechazan con `400`), como mucho tantos permisos como tiene
  la lista y 50 roles por persona; nombres de rol normalizados a NFC y con las reglas de texto de la
  etapa a; ids UUID.
- **El límite de 60 cambios por minuto por sesión** de la etapa a vale también para las rutas de roles.
- **Los errores nuevos,** con su texto en la aplicación: `role-name-taken`, `role-in-use`,
  `system-role`, `no-roles`, `person-inactive`, `person-missing`, `too-many-roles`, `outranked`, `forbidden` y los que ya estaban
  (`self`, `last-administrator`, `changed`).

## 19. Lo que pasa a la vez

- **Nunca sin quien administre** (R1.3, E04, E05, E56, E59): todo cambio de roles (crear, cambiar,
  borrar, cambiar los roles de alguien) y la baja corren en una transacción que primero bloquea la fila del
  rol `system` (`select … for update`; hay uno solo, § 15): todos esos cambios pasan de a uno. Bajo
  el bloqueo, quien lo pide tiene que seguir activo y con el permiso que hace falta (`roles.manage`, o
  `users.manage` para la baja): un pedido que estaba en camino cuando se lo sacaron da `403
  forbidden` y no guarda nada (revisión de seguridad, 32). Dentro,
  aplica el cambio y cuenta, con una consulta, cuántas personas activas que ya entraron tienen cada uno
  de los dos permisos y si quien lo hace los sigue teniendo. Si alguno queda en cero,
  `last-administrator`; si quien lo hace perdió alguno, `self`; en los dos casos se deshace.
- **Por qué un bloqueo y no el de la etapa a:** la baja bloqueaba las personas activas; ahora también
  cuentan los roles y sus permisos, que la persona no bloquea. Un solo bloqueo, siempre el mismo,
  evita que dos cambios se traben. Son cambios raros: la espera no se nota. La baja pasa a usar este.
- **Dos cambian lo mismo:** `version` en `roles` y en `users` (la etapa a); cambiar los roles de
  alguien sube la `version` de esa persona. Guardar un rol pide la `version` del rol, no la de sus
  personas: `give` y `take` dicen solo qué cambia (§ 18). Si otro cambió el rol mientras se editaba,
  `409 changed`: la aplicación trae el rol de nuevo, vuelve a poner encima lo que cambió el borrador
  (sabe qué es, por `toRequest`) y avisa «Otra persona cambió este rol mientras lo armabas: tus
  cambios quedaron encima de lo nuevo. Revisalos y guardá». No se pierde nada.
- **La prueba:** como en § 5, PGlite atiende una conexión a la vez; la unitaria prueba la regla y el
  bloqueo se comprueba a mano contra PostgreSQL.

## 20. La aplicación

- **La persona** de `/api/start` trae `roles` (`{ id, name }[]`), `permissions` (ids) y
  `rolesChangedBy` / `rolesChangedAt`. `can()` (de `shared/`) la usan el marco y las pantallas. La
  persona guardada en el dispositivo para entrar sin conexión (`offline/option.ts`) guarda también
  roles y permisos (R7.9, E52).
- **El menú** (00 · R1.8): cada opción y pestaña puede decir el permiso que pide (`permission` en
  `menu.ts`); sin él, no aparece. Usuarios aparece con `users.view`, que tienen los cuatro permisos de
  R7.1. Al abrir se elige la primera permitida (00 · R1.4).
- **Saber que cambió** (R7.8) sin pedidos extra: la cabecera `X-Ferrebress` de cada respuesta suma
  `p=<huella de los permisos de la sesión>` (8 caracteres). Si cambia, la aplicación vuelve a pedir
  `/api/start` (anotado en `mobile-data.md`: un pedido chico, solo cuando cambian los permisos de esa
  persona); con la persona nueva compara los permisos de antes y de ahora, arma el menú de nuevo y,
  si la pantalla abierta ya no está permitida, muestra «Ya no tenés permiso», también si lo que
  cambió fueron los permisos de un rol que tiene. A los 5 segundos va a su primera opción. Lo que se
  estaba escribiendo en otra pantalla vive en su estado y no se toca.
- **«Sin permiso»** (R7.7, maqueta aprobada `app-no-permission/variant-1-door`): es del marco
  (`modules/frame/screens/NoPermission`), porque vale para cualquier opción. Pide
  `/api/permissions/:id/holders` y arma «Copiar el pedido» en el portapapeles.
- **La pestaña Roles** (maqueta final `users-roles/final/`, aprobada): `modules/users/roles/`, que se
  baja recién al abrirla, con `screens/` (lo de abajo), `draft.ts`, `search.ts`, `actions.ts`,
  `paths.ts` (las direcciones y quiénes tienen cada rol) y `texts.ts`. Los roles de una persona
  (`PersonRoles`, `RolePicker`, de la tarjeta y de autorizar) van a `screens/PersonRoles/`, con sus
  textos en `role-texts.ts` y su guardado en `role-actions.ts`. Cada vista tiene su dirección: `/users/roles` la lista,
  `/users/roles/new` el rol nuevo y `/users/roles/<id>` uno que existe, así atrás vuelve a la lista y
  se puede recargar. Sin «Administrar roles» la pestaña no está, y si se pierde usándola se cierra
  como cualquier pantalla (R7.8). Dos vistas que ocupan la pestaña, nunca a la vez:
  - **La lista** (`RoleList.tsx` y `RoleRow.tsx`, R7.12; `Roles.tsx` elige la vista por la dirección): el buscador, «Nuevo rol» y una tarjeta por rol (`RoleRow.tsx`)
    con su ícono, nombre, descripción, cuántos permisos, cuántas personas y sus iniciales (en el
    celular, los dos números en recuadros y como mucho dos círculos). Sin coincidencias, «Crear el rol
    «…»» abre uno nuevo con lo escrito como nombre.
  - **El rol** (`RoleScreen.tsx`, R7.13): el camino «Roles › …», el título, los botones y, debajo,
    `RoleInfo.tsx` (paso 1, con «n/200»), `RolePermissions.tsx` (paso 2: un grupo plegable por parte,
    con su ícono y «n de m»; al abrir, solo el primero desplegado; cada permiso con su ícono y, en la
    computadora, su explicación; lo incluido con candado), `RoleHolders.tsx` (paso 3: quienes lo
    tienen, lo dado y lo sacado marcado hasta guardar con «Deshacer», y «Darle este rol a…»,
    `GivePicker.tsx`, que busca entre las personas activas) y, en la computadora, `RolePreview.tsx`.
    Los botones, en `RoleActions.tsx`; lo que no se pudo guardar, en `Problems.tsx`; «¿Descartar…?»,
    en `Discard.tsx`; y lo que da acceso, en palabras, en `gives.ts`. En el celular, una columna
    con «Guardar rol» y «Cancelar» fijos abajo, y «Duplicar» y «Borrar el rol» al final.
  - **Lo que se arma** vive en un borrador, `draft.ts` (reglas, sin Preact), en el estado de la
    pantalla del rol: se pierde al salir de ella o al «Salir», así en la computadora del mostrador
    nadie encuentra un rol a medio armar de otro. Sale de un rol (o vacío, o de duplicar uno: con el
    nombre «Copia de …», la descripción y los permisos, y sin personas), cambia con funciones puras (tildar con lo incluido de § 16, dar, sacar,
    deshacer), dice si hay cambios (`isDirty`), los errores que ya se saben (`validate`) y arma el
    pedido (`toRequest`: solo lo que cambió, con `give` y `take`). «Guardar rol» está apagado, en gris,
    mientras `isDirty` es falso; en un duplicado arranca encendido.
  - **Buscar** (`search.ts`, reglas): sin mayúsculas ni tildes, con `plain`, que hoy está dos veces
    (`users/logic.ts` y `manual/search.ts`) y pasa a `platform/text.ts`, sobre el nombre, la descripción, el nombre de sus
    permisos y el nombre y el correo de quienes lo tienen. Todo en la aplicación, con lo que ya trajeron
    `GET /api/roles` y `GET /api/users`: buscar no pide nada al servidor. El texto de cada rol se arma
    una vez por lista, no en cada tecla.
  - **Salir sin guardar:** «Cancelar» descarta y vuelve a la lista. Cualquier otra salida (el camino,
    la pestaña, otra opción del menú, atrás) cambia la dirección, y el router suma una guarda
    (`platform/router.ts`, `guardNavigation(ask)`) que actúa solo cuando cambia la dirección: las
    hojas que se abren encima del rol (`useBackStep`: «Darle este rol a…», confirmar) suman un paso
    con la misma dirección y su atrás las cierra sin preguntar. Al atrás que cambia la dirección la
    guarda le vuelve a poner el paso y, si se descarta, sale. La pantalla del rol pone la guarda
    mientras hay cambios y la saca al desmontarse o al descartar, así no pregunta dos veces; muestra
    «¿Descartar los cambios del rol?» con «Seguir editando» (el foco arranca ahí) y «Descartar».
    «Duplicar» con cambios pregunta lo mismo antes de copiar el rol guardado. Las salidas que fuerza
    el marco (R7.8 «Ya no tenés permiso», al cerrarse la pestaña Roles por perder «Administrar roles»)
    usan `navigate(…, { force: true })`, que no pregunta: el borrador se pierde. Lo armado es trabajo
    a medio hacer del marco (`registerWork`): si después de una sesión cerrada entra otra persona, se
    descarta con la hoja de confirmar que hubiera abierta, y la versión nueva no se aplica sola
    encima (revisión de seguridad, 46). Cerrar o recargar la
    pestaña del navegador con cambios usa el aviso propio del navegador (`beforeunload`, puesto y
    sacado con la guarda), que no se puede diseñar.
  - **Sin conexión** (R2.2): la pestaña se ve gris como el resto de Usuarios; un borrador abierto se
    conserva y «Guardar rol» espera la conexión, diciéndolo al lado. Si no se pudieron traer los
    roles, lo dice con «Reintentar».
  - **Teclado** (constitución II, maqueta): las teclas de la maqueta, que no chocan con las del menú:
    Alt O nuevo rol, Alt G guardar, Alt A cancelar, Alt U duplicar, Alt B borrar, Alt R «Darle este
    rol a…», Alt L el camino «Roles» y, en «¿Descartar…?», Alt T descartar (Esc es «Seguir
    editando»). En la lista, el cursor arranca en el buscador, / lleva a él, Esc lo vacía y Enter abre
    el primer rol (o crea uno con lo escrito). En el rol, el cursor arranca en el nombre y Enter ahí
    guarda. En el celular, el cursor no arranca en ningún lado.
  - **Confirmar que sos vos** (R3.8): la hoja dice qué da lo que se guarda, según el borrador («Le das
    «Encargado» a Lucía», «Le sumás «Anular una venta»»), para que no pase escondido un cambio que da
    acceso; el servidor sigue decidiendo si hace falta.
  - **Datos personales** (`data-private`, § 8): el buscador de la lista, cada renglón de «Quiénes lo
    tienen» entero (con «Deshacer»), «Darle este rol a…» y su buscador, las iniciales de la lista y
    los avisos de error que nombran a alguien.
  - **Quiénes lo tienen** sale de los roles de cada persona de `GET /api/users`: las activas, con
    «Sacárselo»; las dadas de baja, en una línea aparte («También lo tienen, dadas de baja: …»), que
    no se tocan (E60).
  - **Guardar:** un solo pedido (§ 18). Si da `confirm-first`, pide Google o la huella (§ 13) y lo
    repite; si da otro error, el borrador queda como estaba y el error va en su lugar (el campo, el
    grupo, el renglón de la persona) y en un aviso arriba. Al guardar, vuelve a la lista, con el rol
    resaltado, y pide de nuevo `GET /api/roles` y `GET /api/users`.
  - **Lo que se borra de la pantalla anterior:** la tarjeta al costado, «Quién puede qué», las cuentas
    de arriba, los segmentos y el rol que se despliega debajo de su renglón.
  Los íconos de los permisos y de las partes, en `frame/permission-icons.ts`, como en «Sin permiso»;
  los que solo usa la pestaña, en `ui/icon/roles-shapes.tsx`, que llegan con ella.
  Los nombres y correos de las personas, de la lista de Usuarios, que `roles.manage` incluye (R7.1).
- **Los roles de una persona** (maquetas `users-person-roles`: la 1 en la computadora y la 2 en el
  celular, con interruptores de roles): en la tarjeta y en el diálogo de autorizar. En el celular,
  «¿Qué puede hacer…?», «Igual que alguien» (copia los roles de otra persona activa), un interruptor
  por rol, lo que va a poder y, si algo cambió, el pie fijo con lo que gana y lo que pierde, «Darle un
  rol pide confirmar que sos vos» y «Guardar». En la computadora, los roles para tildar (su número los
  tilda con el cursor en la lista). En la tarjeta van
  debajo de sus sesiones y celulares, y en la computadora el pie (dar de baja, de alta, borrar) queda
  fijo abajo, así sigue a la vista.
- **Lo que se esconde** (R7.7, R7.11): los botones de Usuarios se arman con `can()` y comparando los
  permisos de la persona con los propios; el servidor igual rechaza.

## 21. Seguridad

- **Cerrado por defecto:** cada ruta de `/api` declara su permiso o que solo pide sesión; una prueba
  recorre las rutas registradas en Hono y falla si alguna no lo declaró, así una ruta nueva sin su
  paso no pasa `pnpm check`. Además, cada ruta de `users`, `roles` y las de Usuarios en `sign-in`
  tiene su prueba sin el permiso, que espera `403`.
- **Darse acceso:** solo `roles.manage` da roles o permisos, siempre con Google o la huella reciente
  (§ 18). Quien lo tiene puede darse todo: es lo esperado, y Carlos lo sabe (paso 1).
- **Nadie sobre quien tiene más** (R7.11): cambiar el correo de alguien con más permisos que todavía
  no entró era una forma de darse acceso (revisión de seguridad, 23); se rechaza `outranked`.
- **Nunca sin quien administre:** § 19, en el servidor, y solo cuenta quien ya entró (revisión de
  seguridad, 24). Borrar no puede dejar sin nadie: solo se borra a quien nunca entró (§ 18).
- **Las personas de un rol** (`give`, `take`): solo personas que existen (UUID y clave foránea) y
  activas, bajo el bloqueo de § 19, con los mismos controles que cambiar los roles de una persona
  (quedar sin quien administre, sacarse a sí mismo, confirmar al dar). La búsqueda de personas para
  «Darle este rol a…» usa la lista de Usuarios que ya se ve con `users.view`: no expone nada nuevo.
- **Lo que ve cualquiera con sesión:** `GET /api/permissions/:id/holders` da solo nombres de personas
  activas, nunca correos. El id del permiso se valida contra la lista.
- **La auditoría** (R6.1): `role.created`, `role.changed` y `role.deleted`, con el id del rol y cómo
  era antes y cómo quedó (nombre, descripción y permisos), así se lee aunque se renombre o se borre;
  `user.roles-changed` (antes y después, con nombres), `role.permissions-added` (el arranque) y
  `user.authorized` suma sus roles. Guardar un rol con sus personas deja, después de confirmar
  (ADR-004), la línea del rol si cambió y una `user.roles-changed` por cada persona a la que de
  verdad se le dio o se le sacó, con antes y después y el id del rol, todas con el mismo id del
  guardado. La auditoría escribe cada tanda en una transacción por archivo (revisión de seguridad,
  48). Un rechazo dice también de quién o de qué permiso. Un pedido sin el permiso deja `permission.denied`, un evento de la
  plataforma, con tope por minuto según quién pide y qué permiso; `confirm-first`, `outranked`,
  `no-roles`, `self`, `person-inactive` y `person-missing` quedan como `users.rejected`, una vez por minuto por motivo y por quien lo pide.

## 22. Metas de performance

- El paso de permisos: cero consultas con la persona en memoria; una (roles y permisos juntos) si no.
- `/api/start`: cero con la persona en memoria; dos si no. Es el pedido de cada apertura.
- Las de cada ruta, en la tabla de § 18, cada una con su prueba que las cuenta.
- `GET /api/roles` con 20 roles y 100 personas: menos de 30 ms y 10 KB.
- Buscar un rol (R7.12): filtrar 100 roles con 100 personas, menos de 5 ms por tecla en la notebook;
  cero pedidos.
- Guardar un rol con sus personas: un número fijo de consultas para cualquier cantidad de personas
  (§ 18), con su prueba que las cuenta con 1 y con 50.
- La pestaña Roles se baja recién al abrirse. «Sin permiso» va en el arranque (bajarlo aparte partía
  el código común en otro archivo); el lugar lo deja el dibujo del QR de la entrada, que ahora se
  baja recién cuando se muestra.

## 23. Pruebas

| Escenarios | Prueba |
|---|---|
| E34, E53 | Del traspaso, del arranque y del comando: el rol Administrador con todo, para todos los que ya estaban y para el primero |
| E35 a E40, E57 | De las rutas de roles: crear, lo incluido, nombre repetido sin mayúsculas, sin permisos, repetidos en la lista, duplicar, borrar con y sin personas (también dadas de baja), el Administrador; y de la pantalla |
| E41 a E44 | De las rutas: autorizar pide los dos permisos y al menos un rol; quitar el último rol; la unión de dos roles |
| E45, E46 | De la pantalla y del marco: lo que no se puede no aparece; por la dirección, «Sin permiso» con quiénes lo tienen, sin correos |
| E47 | La prueba que recorre las rutas y una por ruta: sin el permiso, `403 forbidden` y la sesión sigue |
| E48, E49 | Del servidor (las dos memorias se borran al cambiar, también si un pedido lee a la vez) y de la aplicación (la cabecera cambia, se vuelve a pedir la persona, «Ya no tenés permiso», también cuando cambian los permisos de un rol) |
| E50 | De las rutas: dar acceso con una sesión vieja da `confirm-first`, también sacar un rol y poner otro; quitar, no |
| E51 | Del arranque: un permiso nuevo se le suma solo al rol `system`, una vez y con su línea; uno que no está en la lista no se borra |
| E52 | De la aplicación: sin conexión usa los permisos guardados; de las rutas, confirmar una entrada sin conexión pide `offline.work` |
| E54 | De la pantalla: las pastillas y el filtro por rol, con solo `users.view` |
| E55 | Cada cambio de roles deja su línea con antes y después, con los nombres |
| E56, E59, E04, E05 | De la regla: sacarse a sí mismo y dejar sin quien administre, por cada camino (también borrar), contando solo a quien ya entró; el bloqueo, a mano |
| E58 | De las rutas: cambiar el correo, dar de baja o de alta y cortar a alguien con más permisos dan `outranked`; de la pantalla, los botones no aparecen |
| E60 | De las rutas y de la pantalla: la baja conserva los roles y no figura en «Lo tienen» |
| E61 | De `search` (nombre, descripción, permiso, nombre y correo de quien lo tiene; sin tildes ni mayúsculas) y de la pantalla: sin coincidencias, «Crear el rol «…»» abre uno con ese nombre |
| E62 | De la ruta: nombre, permisos, `give` y `take` en un pedido, una sola línea por cambio en la auditoría, `confirm-first` una vez; de la pantalla: nada se pide hasta «Guardar rol», que está apagado sin cambios |
| E63 | De la ruta: crear con `give` deja el rol creado y a la persona con él |
| E64 | De `draft` y de la pantalla: «Cancelar» vuelve a como estaba; el camino, la pestaña, el menú y atrás preguntan; «Seguir editando» no pierde nada. Del router: la guarda frena `navigate` y el atrás que cambian la dirección, no el atrás de una hoja, ni `force`; se saca al desmontar. Duplicar arranca sin personas |
| E65 | De la ruta: un nombre repetido, sacarle el rol a quien se quedaría sin ninguno, una persona dada de baja o que no existe, o sacarse a sí mismo «Administrar roles», no guardan nada (tampoco el rol) y dicen quién o qué permiso; dar a quien ya lo tiene no cambia su versión ni deja línea; de la pantalla: el error en su lugar. `409 changed` vuelve a poner el borrador encima. Lo marcado `data-private` no sale en «Algo salió mal» |

**De punta a punta** (aprobada por Carlos): una sola, y la pantalla de roles rehecha no suma otra: lo
suyo (guardar todo junto, preguntar antes de salir) lo cubren las unitarias de la ruta, del borrador,
del router y de la pantalla, y los toques encima del marco (el diálogo de descartar) las pruebas de
captura; a una persona con
Usuarios abierto otra le saca el rol en otro navegador, y la primera ve «Ya no tenés permiso» con su
próximo pedido y Usuarios desaparece. Cruza dos navegadores, las dos memorias del servidor y la
cabecera; una unitaria no lo cubre entero.

## 24. Tareas

1. **Código común:** la lista de permisos y `can()` (`shared/`), el paso `permissions.require`, la
   memoria con contador, la prueba que recorre las rutas y la cabecera `p=` (plataforma del servidor
   y de la aplicación), y la línea en `mobile-data.md`. Tarea propia.
2. **Migración `003-roles`** con el traspaso, el arranque que suma los permisos nuevos y el comando
   del primer Administrador. Depende de 1.
3. **Roles en `users`:** reglas (con R7.11), datos, memoria de permisos y las rutas de § 18, con el
   control de § 19 (la baja y borrar pasan a usarlo). Depende de 2.
4. **`sign-in`:** la persona con roles y permisos, su memoria, `offline.work` en los cinco lugares y
   los permisos en las rutas de sesiones y celulares. Depende de 3.
5. **La aplicación:** el menú, «Sin permiso», la pestaña Roles, los roles en la tarjeta y al
   autorizar, la persona guardada sin conexión y el cambio en uso. Depende de 3 y 4.
6. **Las pruebas de § 23, la documentación al día** (manual: tareas de roles) **y la de punta a punta,**
   si Carlos la aprueba.

**La pantalla de roles rehecha** (R7.12, R7.13), con las pruebas de E61 a E65 primero:

7. **La guarda del router** (`platform/router.ts`): código común, tarea propia. Sin dependencias.
8. **`give` y `take` en las rutas de roles,** con sus errores, el conteo de consultas y la auditoría;
   `GET /api/roles` sin quiénes los tienen. Sin dependencias.
9. **`draft.ts` y `search.ts`** (y `plain` en `platform/text.ts`, código común). Sin dependencias.
10. **La pestaña Roles:** las direcciones, la lista, la pantalla del rol, el diálogo de descartar, la
    hoja de confirmar con lo que da, mover los roles de una persona a su carpeta y borrar lo anterior.
    Depende de 7, 8 y 9.
11. **Las capturas** (pruebas de captura de la pestaña y del manual) **y el manual** (tareas de roles).
    Depende de 10.
