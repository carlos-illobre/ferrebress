# Diseño técnico · 02 · Personas (`users`), etapa a

Cómo se construye la etapa a del capítulo [02 · Personas](../../chapters/02-users/rules.md):
personas y sesiones, con el único rol Administrador. La etapa b (roles y permisos) tendrá su propia
parte de este diseño. Lo aprueba Carlos antes de programar (constitución, pasos 3 a 5).

## 1. Qué resuelve

- **El capítulo 02, etapa a:** R1 a R6 y E01 a E32.
- **Lo que cambia en el 01:** el primer Administrador deja de salir de la configuración (01 ·
  R1.2); el nombre que da Google deja de pisar el escrito (02 · R3.4); y Entrar anota la última vez
  que cada persona entró (02 · R3.2).
- **No resuelve:** roles ni permisos (etapa b), la auditoría para leer (05), los celulares con huella
  propios (04) ni el espejo (03).

## 2. Entidades

Nada nuevo en esquemas: cambian tablas que ya existen. Todo con migraciones nuevas, sin tocar las
viejas.

### `users.users` (migración `002-people`)

| Columna | Cambio | Para qué |
|---|---|---|
| `name` | Pasa a ser el nombre que escribió quien la autorizó; puede ser nulo | R3.4 |
| `google_name` | Nueva | El nombre que trae Google, guardado al entrar; se muestra solo si `name` es nulo |
| `last_sign_in_at` | Nueva, `timestamptz` nulo | La última vez que entró (R3.2); nulo = nunca entró |
| `version` | Nueva, `integer` desde 1 | Sube con cada cambio: el que cambia algo manda la versión que vio (§ 5) |
| `created_at` | Ya estaba | «Autorizada el …» |

**Lo que hay hoy en `name`** (lo que trajo Google) se pasa a `google_name` en la misma migración, y
`name` queda nulo: hasta hoy nadie escribió un nombre. Las personas que ya entraron alguna vez
reciben `last_sign_in_at` de su sesión más reciente; las otras quedan en nulo.

**Nunca entró** quiere decir `google_subject` y `last_sign_in_at` nulos. Es lo que decide si se puede
cambiar el correo (R3.6) o borrar (R3.7).

### `sign_in.sessions` (migración `003-access`)

| Columna | Cambio | Para qué |
|---|---|---|
| `way` | Nueva: `google`, `passkey`, `qr` u `offline` | Cómo entró (R5.2). Las abiertas antes de la migración quedan nulas y se muestran sin «cómo entró» |
| `is_phone` | Nueva, `boolean` | Si es un celular (el mismo criterio que hoy decide ofrecer la huella): «Se perdió un celular» lista solo celulares (R5.7) |

Índice nuevo sobre `(user_id, device_id)` donde `closed_at` es nulo: cerrar las de un celular de
una persona (R5.6, R5.7).

### `sign_in.passkeys` (la misma migración)

| Columna | Cambio | Para qué |
|---|---|---|
| `device_label` | Nueva | «Chrome en Android», el mismo nombre que la sesión que la vinculó (R5.5) |

Las huellas vinculadas antes de la migración toman el nombre de la sesión más reciente de su
celular, o «Celular» si no hay.

## 3. Dónde vive cada cosa

- **`users`** tiene las personas: la lista, autorizar, cambiar, borrar, dar de baja y de alta, y el
  comando del primer Administrador.
- **`sign-in`** tiene las sesiones y las huellas, así que también sus rutas para verlas y cortarlas
  desde Usuarios: «Cerrar», «Cerrar todas», «Quitar» y «Se perdió un celular».
- **Sin ciclos:** `sign-in` ya usa la fachada de `users`; `users` no conoce a `sign-in`. Lo que la
  lista de personas necesita de las sesiones (cuántas tiene cada una) lo recibe como un puerto,
  `accessCounts(userIds)`, que `main.ts` conecta con `sign-in` al registrar los módulos. La baja
  sigue con el evento `user.deactivated`, que `sign-in` escucha.

## 4. API

Todo con sesión (`requireSession`). En la etapa a, cualquiera con sesión puede usarla (R1.1); la
etapa b le pone el permiso. Cada cambio devuelve la persona como quedó, así la pantalla no pide la
lista de nuevo.

| Ruta | Qué hace | Módulo |
|---|---|---|
| `GET /api/users` | Todas las personas: nombre que se muestra, correo, activa, cuándo entró, si nunca entró, versión, y cuántas sesiones abiertas y celulares con huella tiene | users |
| `POST /api/users` | Autorizar: `{ email, name? }`. `409 email-taken` si ya está (sin distinguir mayúsculas) | users |
| `PATCH /api/users/:id` | `{ version, name?, email? }`. El correo, solo si nunca entró (`409 already-entered`) | users |
| `DELETE /api/users/:id?version=` | Borrar, solo si nunca entró (`409 already-entered`) | users |
| `POST /api/users/:id/deactivate` | `{ version }`. `409 self` si es la propia; `409 last-administrator` si quedaría sin Administrador activo | users |
| `POST /api/users/:id/activate` | `{ version }` | users |
| `GET /api/users/:id/access` | Sus sesiones abiertas y sus celulares con huella (R5.1, R5.2, R5.5), sin la sesión de quien pregunta ni, en la propia, sus celulares | sign-in |
| `POST /api/sessions/:id/close` | «Cerrar» (R5.3) | sign-in |
| `POST /api/users/:id/sessions/close` | «Cerrar todas» (R5.4), salvo la de quien pregunta | sign-in |
| `POST /api/passkeys/:id/remove` | «Quitar» (R5.6): quita la huella y cierra las sesiones de esa persona en ese celular | sign-in |
| `GET /api/lost-phones` | Para «Se perdió un celular»: las personas con algún celular para cortar y sus celulares (sesión abierta en un celular o huella), sin el que pregunta | sign-in |
| `POST /api/lost-phones/cut` | `{ userId, deviceId }`: cierra las sesiones de esa persona en ese celular y quita su huella ahí (R5.7). Devuelve qué cortó | sign-in |

- **Los errores nuevos:** `email-taken`, `already-entered`, `self`, `last-administrator` y `changed`
  (la versión no coincide: § 5). Con su texto en la aplicación, junto al campo o al botón.
- **Un correo sin forma de correo** es `400 bad-request` del contrato (zod `email`), con el aviso
  junto al campo en la aplicación, que lo comprueba antes de mandar.
- **Las sesiones «abiertas»** son las sin cerrar y sin vencer (60 minutos y 8 horas, con el último
  uso de la memoria del servidor si está, que es más nuevo que el de la base).

## 5. Lo que pasa a la vez

- **Dos personas cambian a la misma** (E30): cada cambio lleva la `version` que vio. El servidor
  cambia solo si coincide (`where version = ?`) y la sube; si no, `409 changed` con la persona como
  está ahora, y la pantalla la muestra y avisa «Cambió mientras la mirabas».
- **Nunca sin Administrador activo** (R1.3, E04, E05): dar de baja corre en una transacción que
  bloquea las filas de las personas activas (`select … where active for update`), cuenta, y recién
  entonces cambia. Dos bajas a la vez esperan una a la otra: la segunda ve que quedaría sin nadie.
  Lo mismo al borrar (una persona que nunca entró está activa y cuenta).
- **La propia:** el servidor compara con la persona de la sesión; la aplicación ni ofrece el botón.

## 6. Los recorridos

- **Autorizar:** valida, normaliza el correo (minúsculas, sin espacios) e inserta. El índice único
  de `email` es la última palabra si dos autorizan el mismo a la vez.
- **Entrar** (cambia en `sign-in`): al abrir una sesión, por cualquier camino, se anota `way`,
  `is_phone` y, con `users.recordSignIn(userId, at)` (una consulta), `last_sign_in_at`. Una entrada
  sin conexión cuenta cuando el servidor la confirma (R3.2). La primera vez con Google se guarda
  `google_name`; ya no se pisa `name`.
- **Dar de baja:** la transacción de § 5 pone `active = false` y publica `user.deactivated`, que en
  `sign-in` cierra sus sesiones (`deactivated`, ya está) y ahora también quita sus huellas
  (`revoked_at`), en la misma transacción. Con la huella quitada, «Trabajar sin conexión» se apaga
  en sus celulares al próximo contacto y una entrada sin conexión posterior no se confirma (15 · R3.2,
  ya está).
- **Dar de alta:** `active = true`; las huellas no vuelven (R4.2).
- **Cerrar, Cerrar todas, Quitar y Cortar:** cierran con el motivo `revoked`, el que ya hace que el
  dispositivo vuelva a la entrada con «Tu sesión se cerró desde otro dispositivo» en su próximo
  pedido (01 · R3.5). La caché de sesiones del servidor se entera en el momento: el próximo pedido de
  ese dispositivo ya se rechaza.
- **Nada en tiempo real:** el dispositivo cortado se entera con su próximo pedido, sin consultas
  propias, como ya hace la sesión vencida. La pantalla de quien corta se actualiza con la respuesta.

## 7. El primer Administrador (R1.2)

- **Un comando del servidor:** `node src/server/first-administrator.ts <correo> [nombre]` (en el
  contenedor, `docker compose exec server node first-administrator.js …`). Abre la base con la
  configuración del ambiente, corre las migraciones y, en una transacción, inserta a la persona solo
  si la tabla está vacía; si no, sale con un error que lo dice y no cambia nada.
- **Se va de la configuración:** `INITIAL_ADMIN_EMAIL` deja de existir (`platform/config.ts`, el
  `.env` de ejemplo, `deploy/oracle/install.sh`, que pasa a correr el comando al final de la
  instalación, y la documentación de operación). El arranque del servidor ya no crea a nadie.
- **Los ambientes que ya existen** (pruebas) ya tienen personas: no hay que correr nada, y quitar la
  variable de su `.env` es parte del despliegue de esta etapa.
- **Las pruebas** cargan a sus personas como hoy, con la base de prueba.

## 8. La aplicación (`src/app/modules/users/`)

- **Dónde:** Más → Usuarios, con las pestañas Usuarios · Auditoría (Auditoría con «Pronto» hasta el
  05), como dicen 00 · R1.2 y 02 · R2.1. Como dijo Carlos, el menú final lo decide él al programar:
  en el paso 6 se le muestra el menú antes de tocarlo. La opción lleva `needsInternet` (R2.2), como
  el manual: sin conexión, gris.
- **Las pantallas:** las maquetas aprobadas (`mockups/users-a/final/desktop/` y `final/phone/`),
  separadas como la entrada: lista, tarjeta, autorizar, «Se perdió un celular» y las
  confirmaciones (dar de baja y Cerrar todas). Los textos largos y cortos en `texts.ts`.
- **El estado:** la lista se pide al abrir la opción y la tarjeta al elegir a alguien; cada cambio
  reemplaza a esa persona con lo que devuelve el servidor. No se guarda nada en el dispositivo.
- **El teclado** (00 · R2): las teclas de la maqueta (Alt U autorizar, Alt I «Se perdió un celular»,
  Alt T cerrar todas, Alt B dar de baja o borrar, Alt A dar de alta, `/` buscar) solo con Alt; en la
  tarjeta, «Cerrar» y «Quitar» con las flechas y Enter (R5.8).
- **`data-private`:** nombres y correos, para «Algo salió mal» (00 · R9.4).

## 9. Eventos y auditoría (R6)

En `users`: `user.authorized`, `user.renamed`, `user.email-changed`, `user.deleted`,
`user.deactivated` (ya existe como evento; ahora también se anota), `user.activated`. En `sign-in`:
`session.closed` (con quién la cerró y de quién era), `sessions.closed-all`, `passkey.removed` y
`phone.cut`. Cada uno con quién lo hizo (la persona de la sesión) y a quién, como el resto de la
auditoría (01 · E44).

## 10. Seguridad

- **Qué datos toca:** nombres y correos de las personas, y de qué dispositivos entran. Nada de eso
  sale del servidor sin sesión.
- **Quién puede:** en la etapa a, cualquier persona activa con sesión (R1.1), como decidió Carlos;
  la etapa b le pone el permiso. Nadie se da de baja a sí mismo y nunca queda nadie activo (§ 5),
  controlado en el servidor.
- **Lo que entra de afuera:** los cuerpos, con zod y largos máximos (correo 254, nombre 80); los
  identificadores de la dirección, UUID; la `version`, un entero.
- **Ver o cambiar lo ajeno:** las rutas de sesiones y huellas comprueban que la sesión o la huella
  sea de la persona nombrada antes de cortar; un identificador de otro da `404`, igual que uno que
  no existe.
- **El comando del primer Administrador** solo corre dentro del servidor, con su configuración: no
  hay ninguna ruta de la API que cree a alguien sin sesión.
- **Abuso:** las rutas usan el límite por dirección de los pedidos con sesión que ya existe; no
  hace falta uno propio: son pocas personas y todas con sesión.
- **La auditoría** guarda cada cambio con quién y a quién.

## 11. Metas de performance

- `GET /api/users`: 3 consultas (personas, sesiones por persona, huellas por persona), menos de
  50 ms con 50 personas, menos de 10 KB.
- `GET /api/users/:id/access`: 2 consultas. Cada cambio: hasta 3 consultas en una transacción.
- El arranque de la aplicación no crece: la pantalla se baja recién al abrir la opción (como el
  manual, con `import()`).

## 12. Pruebas

| Escenarios | Prueba |
|---|---|
| E01, E02 | Unitarias del comando contra la base de prueba: con la tabla vacía carga; con alguien, se niega |
| E03 a E05 | De las rutas: la propia da `self`; la última activa da `last-administrator`; dos bajas a la vez, con la base de prueba, guardan una sola |
| E06, E07 | De la pantalla, con el servidor de mentira: el orden, «Vos», la pastilla, «Entró hace 3 días» |
| E08 a E16 | De las rutas y de la pantalla: autorizar, correo repetido o mal escrito, el nombre escrito contra el de Google, cambiar el correo y borrar solo si nunca entró |
| E17 a E20 | De las rutas: la baja cierra sesiones y quita huellas; dada de baja no entra; el alta no devuelve las huellas; sin confirmar no cambia nada (pantalla) |
| E21 a E27, E31, E32 | De las rutas: cada sesión con su forma de entrar; la propia no figura; Cerrar, Cerrar todas, Quitar y Cortar; el celular cortado recibe `session-closed` en su próximo pedido |
| E28 | Cada cambio deja su evento, con quién y a quién |
| E29 | De la pantalla: sin conexión, gris |
| E30 | De las rutas: un cambio con una versión vieja da `changed` |
| Metas | Las pruebas que cuentan las consultas de cada ruta |

**De punta a punta:** se proponen a Carlos antes de escribirlas, con qué prueban y por qué no
alcanza una unitaria (CLAUDE.md). La candidata es una sola: cerrar la sesión de un dispositivo desde
otro y ver que ese dispositivo vuelve a la entrada con «Tu sesión se cerró desde otro dispositivo»,
porque cruza dos navegadores, la cookie y la caché del servidor.

## 13. Tareas

1. **Migraciones y datos** (`users` y `sign-in`), con el traspaso de `name` a `google_name`.
2. **El comando del primer Administrador** y quitar `INITIAL_ADMIN_EMAIL` (servidor, instalación y
   documentación de operación). Depende de 1.
3. **Las rutas de `users`** (§ 4), con § 5. Depende de 1.
4. **Entrar anota** `way`, `is_phone` y la última entrada, y deja de pisar el nombre. Depende de 1.
5. **Las rutas de `sign-in`** para sesiones, huellas y celulares perdidos, y la baja que quita
   huellas. Depende de 1 y 4.
6. **El puerto de las cantidades** conectado en `main.ts`. Depende de 3 y 5.
7. **La aplicación:** el menú (con Carlos), la lista, la tarjeta, autorizar, «Se perdió un celular»
   y las confirmaciones, en la computadora y en el celular. Depende de 3 y 5.
8. **Las pruebas de § 12, la documentación al día y la de punta a punta,** si Carlos la aprueba.
