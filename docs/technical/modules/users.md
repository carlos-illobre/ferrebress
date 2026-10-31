# Diseño técnico · 02 · Personas (`users`)

Cómo se construye el capítulo [02 · Personas](../../chapters/02-users/rules.md). Las secciones 1 a 13
son la etapa a (personas y sesiones), **aprobada por Carlos**; las 14 a 24, la etapa b (roles y
permisos), **por revisar**. Las
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

- **El capítulo 02, etapa b:** R7 completa y los cambios a R1.1, R1.3, R2.1, R3.1, R3.3, R3.8, R5.1 y
  R6.1, con E34 a E57 y los escenarios de la etapa a que cambian (E01, E03 a E06).
- **Lo que cambia en otros capítulos:** el menú esconde lo que no se puede usar y abre la primera
  opción permitida (00 · R1.4, R1.8); «Trabajar sin conexión» pasa a pedir su permiso (15 · R1.2).
- **No resuelve:** el modo llavero (T114), la pantalla de la auditoría (05), las sesiones propias en
  Configuración (04) ni pedir un permiso desde la aplicación (Carlos lo descartó).

## 15. Entidades

Migración `003-roles` del esquema `users`:

| Tabla | Columnas | Para qué |
|---|---|---|
| `users.roles` | `id` uuid, `name` (hasta 40 letras), `description` (hasta 200, nula), `system` boolean, `version` integer, `created_at` | Los roles (R7.3). `system` marca al Administrador: no se borra y recibe los permisos nuevos (R7.4). Índice único sobre `lower(name)` |
| `users.role_permissions` | `role_id`, `permission` (texto, el id del permiso); clave de los dos | Qué permisos da cada rol |
| `users.user_roles` | `user_id`, `role_id`; clave de los dos; índice por `role_id` | Qué roles tiene cada persona (R7.5) |
| `users.known_permissions` | `permission`, clave | Los permisos que el sistema ya conoce, para saber cuáles son nuevos (§ 16) |
| `users.users` | `last_roles_change` jsonb, nula: `{ by, at, before, after }` (ids de roles) | Lo que muestra «Ya no tenés permiso» (R7.8): quién y qué cambió la última vez |

- **El traspaso** (R7.10): crea el rol Administrador (`system = true`) con todos los permisos de hoy,
  los anota en `known_permissions` y se lo da a todas las personas que ya existen.
- **El primer Administrador** (R1.2): el comando y la carga de las pruebas de punta a punta le dan el
  rol `system`.

## 16. Los permisos

- **Una lista fija en el código,** compartida por el servidor y la aplicación:
  `src/shared/contracts/permissions.ts`. Cada permiso tiene su id en inglés, la parte a la que
  pertenece, su nombre y su explicación en castellano (los de R7.1 y 15 · R1.2) y los que incluye:

  | Id | Nombre | Parte | Incluye |
  |---|---|---|---|
  | `users.view` | Ver las personas | Usuarios | |
  | `users.manage` | Administrar personas | Usuarios | `users.view` |
  | `users.cut` | Cortar sesiones y huellas | Usuarios | `users.view` |
  | `roles.manage` | Administrar roles | Usuarios | |
  | `offline.work` | Trabajar sin conexión | Sin conexión | |

  Cada capítulo que llega suma sus filas ahí, con la parte nueva.
- **Un permiso nuevo** (R7.4): al arrancar, el servidor compara la lista con `known_permissions`; los
  que faltan se anotan y se le suman al rol `system`, en una transacción. Así un permiso que alguien
  le sacó al Administrador no vuelve solo: solo se suman los nuevos de verdad.
- **«Incluye»** se guarda tildado (R7.1): al guardar un rol, el servidor agrega lo incluido; la
  pantalla lo muestra con candado. Un permiso que ya no está en la lista se ignora al leer y lo borra
  el arranque.
- **Lo que no pide permiso** (R7.2) no tiene id: esas rutas solo piden sesión.

## 17. Dónde vive cada cosa

- **`users`** tiene los roles, sus permisos, quién los tiene y las reglas (`roles.ts`: el nombre único,
  al menos un permiso, lo incluido, quedar sin quien administre). Su fachada suma
  `permissionsOf(userId)`, que devuelve los permisos de la persona activa (unión de sus roles).
- **La plataforma** suma el paso `permissions.require(id)` (`platform/permissions.ts`), como la sesión
  del pedido: `users` le da cómo saber los permisos de alguien y cualquier módulo lo pide en sus
  rutas sin importar a `users`. Va después de `sessions.require`.
- **La memoria de permisos:** `users` guarda los permisos de cada persona en memoria; se borran al
  confirmar cualquier cambio de roles, de sus permisos, de quién los tiene o una baja. Un servidor
  solo (constitución, IX): vale desde el próximo pedido (R7.6) sin consultas extra.
- **`sign-in`** deja de inventar `role: 'Administrador'`: la persona de `/api/start` y de entrar
  lleva sus roles (id y nombre), sus permisos y su último cambio de roles, de la fachada de `users`.
  «Trabajar sin conexión» (`offline: true`) pide `offline.work` en vez de «ser Administrador».

## 18. API

Todo con sesión, `GET` o `POST`, con `version` en los cambios, como la etapa a. Las formas, en
`src/shared/contracts/users.ts` y `roles.ts`.

| Ruta | Permiso | Qué hace | Consultas |
|---|---|---|---|
| `GET /api/roles` | `roles.manage` | Los roles con descripción, permisos, versión, quiénes los tienen (ids) y su último cambio | 3 |
| `POST /api/roles` | `roles.manage` | Crear (también duplicar, que arma el cuerpo en la aplicación): `{ name, description?, permissions }`. `409 role-name-taken`, `400` sin permisos | 3, en una transacción |
| `POST /api/roles/:id` | `roles.manage` | Cambiar `{ version, name?, description?, permissions? }` | 4 a 6, en una transacción con el control de § 19 |
| `POST /api/roles/:id/delete` | `roles.manage` | `{ version }`. `409 role-in-use` si alguien lo tiene, `409 system-role` si es el Administrador | 2 |
| `POST /api/users/:id/roles` | `roles.manage` | Los roles de una persona: `{ version, roles }`, al menos uno (`400 no-roles`) | 4 a 6, con § 19 |
| `GET /api/permissions/:id/holders` | sesión | Para «Sin permiso» (R7.7): los roles que tienen ese permiso, los nombres de quienes los tienen y quiénes tienen `roles.manage` | 2 |

- **Cambian las de la etapa a:** `GET /api/users` pide `users.view` y suma los ids de los roles de cada
  persona (una consulta más); `POST /api/users` (autorizar) pide `users.manage` y `roles.manage` y
  suma `roles` (al menos uno); cambiar, borrar, dar de baja y de alta piden `users.manage`; ver las
  sesiones y los celulares, `users.view`; cerrar, cerrar todas, cortar y «Se perdió un celular»,
  `users.cut`.
- **Sin el permiso:** `403 { error: 'forbidden', permission }`, sin cerrar la sesión (R7.6). Se anota
  como `users.rejected`, con el mismo tope por minuto.
- **Lo que da acceso pide confirmar** (R3.8, § 13): crear un rol, agregarle permisos y darle un rol a
  alguien (también al autorizar) dan `403 confirm-first` si Google o la huella son de hace más de 5
  minutos. Quitar no lo pide.
- **Los errores nuevos,** con su texto en la aplicación: `role-name-taken`, `role-in-use`,
  `system-role`, `no-roles`, `forbidden` y los que ya estaban (`self`, `last-administrator`,
  `changed`).

## 19. Lo que pasa a la vez

- **Nunca sin quien administre** (R1.3, E04, E05, E56): todo cambio que puede sacar
  `users.manage` o `roles.manage` (cambiar los permisos de un rol, borrarlo, cambiar los roles de
  alguien, dar de baja) corre en una transacción que primero bloquea la fila del rol `system`
  (`select … for update`): todos esos cambios pasan de a uno. Dentro, aplica el cambio y cuenta, con
  una consulta, cuántas personas activas tienen cada uno de los dos permisos y si quien lo hace los
  sigue teniendo. Si alguno queda en cero, `last-administrator`; si quien lo hace perdió alguno,
  `self`; en los dos casos, la transacción se deshace.
- **Por qué un bloqueo y no el de la etapa a:** la baja bloqueaba las personas activas; ahora también
  cuentan los roles y sus permisos, que la persona no bloquea. Un solo bloqueo, siempre el mismo,
  evita que dos cambios se traben. Son cambios raros: la espera no se nota. La baja pasa a usar este.
- **Dos cambian lo mismo:** `version` en `roles` y en `users` (la etapa a); cambiar los roles de
  alguien sube la `version` de esa persona.
- **La prueba:** como en § 5, PGlite atiende una conexión a la vez; la unitaria prueba la regla y el
  bloqueo se comprueba a mano contra PostgreSQL.

## 20. La aplicación

- **La persona** de `/api/start` trae `roles` (`{ id, name }[]`), `permissions` (ids) y
  `lastRolesChange`. `can(permission)` (de `sign-in`) la usan el marco y las pantallas.
- **El menú** (00 · R1.8): cada opción y pestaña puede decir el permiso que pide (`permission` en
  `menu.ts`); sin él, no aparece. Al abrir se elige la primera permitida (00 · R1.4).
- **Saber que cambió** (R7.8) sin pedidos extra: la cabecera `X-Ferrebress` de cada respuesta suma
  `p=<huella de los permisos de la sesión>` (8 caracteres). Si cambia, la aplicación vuelve a pedir
  `/api/start`; con la persona nueva, el menú se arma de nuevo y, si la pantalla abierta ya no está
  permitida, se ve «Ya no tenés permiso» (R7.8) y a los 5 segundos va a su primera opción. Lo que se
  estaba escribiendo en otra pantalla vive en su estado y no se toca.
- **«Sin permiso»** (R7.7, maqueta aprobada `app-no-permission/variant-1-door`): es del marco
  (`modules/frame/screens/NoPermission`), porque vale para cualquier opción. Pide
  `/api/permissions/:id/holders` y arma «Copiar el pedido» en el portapapeles.
- **La pestaña Roles** (maqueta `users-roles/variant-1-card`): `modules/users/screens/Roles/`, que se
  baja recién al abrirla, con lo que la maqueta no muestra y piden las reglas: la descripción y los
  permisos agrupados por parte también al crear (§ 16, screens.md).
- **Los roles de una persona** (maquetas `users-person-roles`: la 1 en la computadora y la 2 en el
  celular, con interruptores de roles): en la tarjeta y en el diálogo de autorizar.
- **Sin conexión** (R7.9): la persona guardada en el dispositivo ya trae sus permisos; se actualizan
  con el primer `/api/start` al volver.
- **Lo que se esconde** (R7.7): los botones de Usuarios se arman según `can()`; el servidor igual
  rechaza.

## 21. Seguridad

- **Quién puede:** el servidor decide cada pedido (R7.6) con el paso de la plataforma; la aplicación
  solo esconde. Una ruta nueva sin su paso es el riesgo: cada ruta de `users`, `roles` y las de
  Usuarios en `sign-in` tiene una prueba que la pide sin el permiso y espera `403`.
- **Darse acceso:** solo `roles.manage` da roles o permisos, siempre con Google o la huella reciente
  (§ 18). Quien lo tiene puede darse todo: es lo esperado, y Carlos lo sabe (paso 1).
- **Nunca sin quien administre:** § 19, en el servidor.
- **Lo que ve cualquiera con sesión:** `GET /api/permissions/:id/holders` da nombres (no correos) de
  quienes tienen un permiso. Es lo que pide R7.7; el id del permiso se valida contra la lista, así no
  sirve para recorrer otra cosa.
- **Lo que entra de afuera:** nombres de rol (40) y descripciones (200) con las reglas de texto de la
  etapa a; listas de permisos y de roles acotadas (los ids se validan contra la lista y contra la
  base); ids UUID.
- **La auditoría** (R6.1): `role.created`, `role.changed` (con lo que había y lo que quedó),
  `role.deleted` y `user.roles-changed` (con antes y después), y `user.authorized` suma sus roles.
  `users.rejected` suma `forbidden`.

## 22. Metas de performance

- El paso de permisos: cero consultas con la persona en memoria; una (roles y permisos juntos) si no.
- `GET /api/roles` con 20 roles y 100 personas: menos de 30 ms y 10 KB.
- La pestaña Roles y «Sin permiso» se bajan recién al abrirse: el arranque no crece.

## 23. Pruebas

| Escenarios | Prueba |
|---|---|
| E34, E53 | Del traspaso y del comando: el rol Administrador con todo, para todos los que ya estaban y para el primero |
| E35 a E40, E57 | De las rutas de roles: crear, lo incluido, nombre repetido sin mayúsculas, sin permisos, duplicar, borrar con y sin personas, el Administrador; y de la pantalla |
| E41 a E44 | De las rutas: autorizar pide los dos permisos y al menos un rol; quitar el último rol; la unión de dos roles |
| E45, E46 | De la pantalla y del marco: lo que no se puede no aparece; por la dirección, «Sin permiso» con quiénes lo tienen |
| E47 | Una prueba por ruta: sin el permiso, `403 forbidden` y la sesión sigue |
| E48, E49 | Del servidor (la memoria se borra al cambiar) y de la aplicación (la cabecera cambia, se vuelve a pedir la persona, «Ya no tenés permiso») |
| E50 | De las rutas: dar acceso con una sesión vieja da `confirm-first`; quitar, no |
| E51 | Del arranque: un permiso nuevo se le suma solo al rol `system`, una vez |
| E52 | De la aplicación: sin conexión usa los permisos guardados |
| E54 | De la pantalla: el filtro por rol |
| E55 | Cada cambio de roles deja su línea con antes y después |
| E56, E04, E05 | De la regla: sacarse a sí mismo y dejar sin quien administre, por cada camino; el bloqueo, a mano |

**De punta a punta:** se propone una sola, a aprobar por Carlos antes de escribirla: a una persona con
Usuarios abierto otra le saca el rol en otro navegador, y la primera ve «Ya no tenés permiso» con su
próximo pedido y Usuarios desaparece. Cruza dos navegadores, la memoria de permisos del servidor y la
cabecera; una unitaria no lo cubre entero.

## 24. Tareas

1. **Código común:** la lista de permisos (`shared/contracts/permissions.ts`), el paso
   `permissions.require` y la cabecera `p=` (plataforma del servidor y de la aplicación). Tarea propia.
2. **Migración `003-roles`** con el traspaso, y el comando del primer Administrador. Depende de 1.
3. **Roles en `users`:** reglas, datos, memoria de permisos, el arranque que suma los nuevos y las
   rutas de § 18, con el control de § 19 (la baja pasa a usarlo). Depende de 2.
4. **`sign-in`:** la persona con roles y permisos, `offline.work` y los permisos en las rutas de
   sesiones y celulares. Depende de 3.
5. **La aplicación:** `can()`, el menú, «Sin permiso», la pestaña Roles, los roles en la tarjeta y al
   autorizar, y el cambio en uso. Depende de 3 y 4.
6. **Las pruebas de § 23, la documentación al día** (manual: tareas de roles) **y la de punta a punta,**
   si Carlos la aprueba.

