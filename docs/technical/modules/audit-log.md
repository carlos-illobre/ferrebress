# Diseño técnico · 05 · Quién hizo qué (`audit-log`)

Implementa el [capítulo 05](../../chapters/05-audit-log/rules.md): lo que se guarda de cada acción y
la pestaña Quién hizo qué, con la maqueta aprobada (variante 1, «El libro», con un ícono por tipo de
acción: [screens.md](../../chapters/05-audit-log/screens.md)). Lo que no se cambia acá sigue como
dicen el [ADR-004](../adr/ADR-004-audit-log-in-sqlite.md) y los diseños de [01](sign-in.md),
[02](users.md) y [15](offline.md). Corregido con sus dos revisiones
([diseño](audit-log-design-review.md), [seguridad](audit-log-security-review.md)).

## 1. Qué resuelve

Las reglas R1 a R5 del capítulo 05 y sus escenarios E01 a E48 (con E05b y E35b a E35d).

**La idea técnica:** una forma común de cada acción (quién, a quién, qué cambió, desde dónde, de qué
color), un catálogo que dice de cada tipo su grupo, su ícono, su texto y qué datos se pueden mostrar,
y una consulta con índices que corre en un hilo aparte y pagina sobre los archivos de cada año. El
servidor no arma textos: devuelve la acción en su forma común y la aplicación la dice con el
catálogo.

## 2. La forma común de una acción

`AuditEvent` (`platform/storage/audit/`) pasa a ser:

| Campo | Qué | Regla |
|---|---|---|
| `type` | `cosa.acción` (`user.renamed`) | R2.1 |
| `at` | La hora de la acción, del servidor. La pone la plataforma (`clock.now()`); un módulo la puede pasar cuando reconstruye la de algo hecho sin conexión (ADR-007), nunca posterior a la llegada | R2.2 |
| `arrivedAt` | La hora en que llegó al servidor; siempre la pone la plataforma | R2.2 |
| `deviceTime` | La hora del dispositivo, solo si el servidor no la pudo confirmar (una entrada sin conexión) | R2.2, E09 |
| `actor` | `{ kind: 'person', userId, name }`, `{ kind: 'system' }` o `{ kind: 'outsider', email? }` (§ 2.1) | R2.3 |
| `targets` | `{ kind, id, name }`: `person`, `role`, `session`, `phone`, y los que sumen los demás módulos (`product` con el 07), cada uno con el nombre de ese momento | R2.4 |
| `changes` | `{ campo: { before, after } }`, solo lo que cambió | R2.5 |
| `data` | Lo demás que el texto necesita (el motivo de un rechazo, el permiso que faltó, cómo entró) | R2.1 |
| `tone` | `red`, `amber` o `plain`, calculado al anotar (§ 4) | R4.4 |
| `device` | Códigos, no texto: `{ phone, browser, os }` (`chrome`, `android`) | R2.6 |
| `ipAddress` | La dirección del pedido, la que ya calcula la plataforma | R2.6 |

### 2.1 Quién es el autor

`guards.record(c, type, fields)` pone el autor así, y el módulo no lo puede poner libre:

- **La persona de la sesión del pedido.** Su nombre de ese momento lo pone la auditoría al escribir:
  el de hoy en el archivo de las personas (§ 3), que en ese punto de la tanda es el de ese momento,
  porque cambiar un nombre se anota en la misma tanda, en orden.
- **La persona que el pedido acaba de probar**, cuando todavía no hay sesión: un pase de Google
  verificado, una firma de huella verificada, la firma de una entrada sin conexión verificada. El
  módulo la pasa como `proven` (`{ userId, name?, email? }`, con el nombre y el correo que devuelve
  anotar la entrada), un tipo que solo arman esas verificaciones.
  Así `sign-in.succeeded`, `code.approved` y `sign-in.offline-confirmed` quedan a nombre de quien
  entró.
- **Si no, `outsider`**, con el correo que se usó si lo hay; la cuenta que se intentó usar va en
  `targets`. Una firma que no verifica nunca deja a la víctima como autora.
- **`system`**: lo que el sistema hace solo (sumarle permisos nuevos al Administrador, vencer una
  sesión), con `platform.audit.record({ actor: { kind: 'system' }, … })`.

### 2.2 Lo que no sale nunca y lo que no entra

- **No se anota ni se devuelve** el identificador de un dispositivo, el de una huella, un pase, una
  llave ni la clave de un límite (que lleva correos y dispositivos). En `targets`, un celular o una
  sesión van con su `public_id`, el mismo que ya ve Usuarios (diseño de 02, § 9). Un límite pasado
  anota el tema y el tipo de clave («por dispositivo», «por cuenta»), no la clave.
- **El catálogo dice qué campos de `data` muestra cada tipo** (§ 4); la ruta devuelve solo esos. Una
  prueba anota cada tipo de hoy y mira que la respuesta no trae ningún identificador de dispositivo ni
  de huella.
- **Nunca se deja de anotar** (R1.1): una acción de más de 8 KB se anota igual, conservando `type`,
  `actor`, `targets` (con los nombres cortados en 80) y las claves de `changes`; se cortan primero los
  valores de `data` y después los de `changes`, y se marca `truncated`. El correo de `outsider` se
  corta en 254.
- **El dispositivo** sale del navegador (`User-Agent`, `Sec-CH-UA-Mobile`) y cualquiera lo puede
  cambiar: el detalle lo muestra como lo que dice el navegador, no como prueba. La lista cerrada que
  ya usa 01 pasa de `sign-in/device.ts` a `platform/device.ts`, devolviendo códigos; `sign-in` arma
  con ellos su texto («Chrome en Android»), y la aplicación, el suyo.
- **Solo después de confirmar** (R1.4): como hoy, se llama a `record` después de que la transacción
  terminó bien; un intento rechazado se anota en el rechazo.

**Los módulos que ya anotan pasan a la forma común** (`sign-in`, `users`, `users/roles`,
`sign-in/offline`, `platform/http.ts` y `platform/permissions.ts`). Los límites pasados de todos los
módulos pasan a un solo tipo de la plataforma, `request.throttled`, con el tema en `data`
(reemplaza `sign-in.throttled` y `users.throttled`).

## 3. Entidades

Todo en SQLite (ADR-004), en la carpeta de `AUDIT_PATH`. Ninguna tabla nueva en PostgreSQL.

**Archivos nuevos con la forma nueva** (§ 12): `<año>.v1.sqlite`. Los archivos de la forma vieja
(`<año>.sqlite`, que solo existen en el ambiente de pruebas y nadie usa) se borran al arrancar la
primera vez con esta versión: la plataforma borra los `<año>.sqlite` de la carpeta, solo esos. Así
no hay dos formas de lectura. El año es el UTC de `at`.

### Cada año: `<año>.v1.sqlite`

`events`:

| Columna | Tipo | Para qué |
|---|---|---|
| `id` | `integer` PK | El orden de escritura; con `at`, el orden de la lista |
| `at` | `integer` | La hora de la acción, en milisegundos |
| `type` | `text` | El tipo |
| `tone` | `integer` | 0 sin color, 1 ámbar, 2 rojo (R4.4) |
| `actor_kind` | `integer` | 0 persona, 1 sistema, 2 alguien sin entrar |
| `user_id` | `text` | Quién, si es una persona |
| `payload` | `blob` | Lo demás (`actor.name`, `targets`, `changes`, `data`, `device`, `arrivedAt`, `deviceTime`, el correo de `outsider`, la dirección), comprimido, como hoy |

`targets`, una fila por cada cosa tocada: `event_id`, `kind`, `target_id`. La cosa también va
entera en el `payload`; esta tabla es solo para buscar.

**Índices** (los de ADR-004):

| Índice | Para |
|---|---|
| `events (at, id)` | La lista sin filtros y por fechas (R4.2) |
| `events (user_id, at, id)` | «Hecho por» una persona (R4.5) |
| `events (actor_kind, at, id)` | «Hecho por» el sistema o alguien sin entrar |
| `events (type, at, id)` | El filtro por tipo y por grupo (un grupo es una lista de tipos) |
| `events (tone, at, id)` | Los números del resumen y su filtro (R4.9) |
| `targets (target_id, event_id)` | «Hecho a» (R4.5) y, con el 07, la historia de un dato (T115). `event_id` sigue el orden de escritura, que es el de `at` dentro de la tanda |

`id` va en cada índice porque la lista se ordena por `at desc, id desc`: dos acciones del mismo
milisegundo salen siempre en el mismo orden. Al abrir cada archivo, `pragma optimize`.

**Tipo y persona como texto**, no como enteros como sugiere el ADR-004: a 730.000 filas por año la
diferencia es de unos MB, y los enteros piden una tabla de equivalencias por archivo. Si con 100
personas pesa, se cambia detrás de la misma interfaz; queda anotado en el ADR-004.

### `people.v1.sqlite`: las personas de hoy

El nombre y el correo **de hoy** de cada persona que pasó por el sistema, también las dadas de baja y
las borradas: para «(hoy: …)» (E07) y para las listas de los filtros (E30). El nombre de **ese
momento** va en cada acción (§ 2), no se busca acá.

| Columna | Para qué |
|---|---|
| `user_id` PK | De quién |
| `name`, `email` | Los de hoy |
| `state` | `active`, `deactivated` o `deleted`, para marcarlas en el filtro |

- Se pone al día en la misma tanda que la acción que lo cambia: autorizar, cambiar el nombre o el
  correo, dar de baja o de alta, borrar. Cada acción de una persona que todavía no tiene fila la
  agrega con el nombre que trae (así el primer Administrador, cargado por un comando aparte, aparece
  con su primera acción).
- **Al arrancar**, `users` le da a la auditoría las personas que no tiene (`audit.knowPeople`), para
  las que ya existían antes de este módulo.
- **Al borrar a alguien** (02 · R3.7), su fila queda con el nombre y `state = deleted`, y se le borra
  el correo: el filtro la muestra con «(borrada)» y sin correo. Las acciones de antes (autorizarla)
  conservan lo que pasó.

## 4. El catálogo de los tipos

`src/shared/audit-log/`: un archivo por módulo que anota (`sign-in.ts`, `users.ts`, `roles.ts`,
`offline.ts`, `platform.ts`, `audit-log.ts`) y un `index.ts` que los junta. **Cada archivo es del
módulo que nombra** y lo cambia con su trabajo; solo `index.ts` y los tipos comunes son código común
(constitución, «Trabajo en paralelo»). Cada tipo:

```ts
'user.roles-changed': {
  group: 'roles',                         // R2.1: el grupo del filtro «Tipo»
  tone: (e) => (e.changes.roles.removed.length ? 'red' : 'plain'),  // R4.4, o un valor fijo
  icon: 'user-cog',                       // R4.10: un ícono de Lucide, que no se repite
  name: 'Cambió los roles de alguien',    // el nombre del tipo en el filtro y el texto genérico
  shows: ['reason'],                      // los campos de `data` que salen del servidor (§ 2.2)
  says: (e) => […],                       // el texto, en trozos (§ 7)
}
```

- **El color se calcula al anotar** y se guarda (`tone`): un mismo tipo puede ser rojo o no según lo
  que hizo (sacar un rol es rojo, darlo no: E21). Para eso la plataforma no importa el catálogo: el
  módulo `audit-log` le da al arrancar cómo se calcula (`audit.provideTone`), como `users` le da los
  permisos. Un color que cambie después en el catálogo no cambia lo ya anotado.
- **El grupo** lo traduce `modules/audit-log/rules.ts` a la lista de sus tipos; la consulta de la
  plataforma recibe tipos y colores, nunca el catálogo (`platform/` sin negocio).
- **Los grupos:** Entrar, Usuarios, Roles, Sin conexión y Rechazos; cada módulo que llega suma el
  suyo. Un tipo que no está en el catálogo (de una versión más nueva) se muestra con un ícono y un
  texto genéricos, en «Otros».
- **Las pruebas del catálogo:** cada tipo que anota el servidor está; ningún ícono se repite entre
  tipos; cada ícono está dibujado en la aplicación (§ 7).

Los tipos de hoy (los 34 íconos están en Lucide 0.460; Carlos los ve en `mockups/users-who-did-what/action-icons.png`):

| Grupo | Tipo | Texto (ejemplo) | Color | Ícono |
|---|---|---|---|---|
| Entrar | `sign-in.succeeded` | Entró con Google | | `log-in` |
| Entrar | `sign-out` | Salió | | `log-out` |
| Entrar | `session.ended` | Terminó la sesión de Marcos: venció por no usarla (el sistema; dice el motivo) | | `timer-off` |
| Entrar | `passkey.linked` | Vinculó la huella de su celular | | `fingerprint` |
| Entrar | `code.read` | Leyó el código de una computadora | | `qr-code` |
| Entrar | `code.approved` | Dejó entrar a una computadora con su celular | | `monitor-check` |
| Entrar | `code.cancelled` | Canceló la entrada de una computadora | | `monitor-x` |
| Usuarios | `user.authorized` | Autorizó a Marcos | | `user-plus` |
| Usuarios | `user.renamed` | Le cambió el nombre a Marcos | | `pencil` |
| Usuarios | `user.email-changed` | Le cambió el correo a Marcos | | `at-sign` |
| Usuarios | `user.activated` | Dio de alta a Marcos | | `user-check` |
| Usuarios | `user.deactivated` | Dio de baja a Marcos | rojo | `user-minus` |
| Usuarios | `user.deleted` | Borró a Marcos | rojo | `user-x` |
| Usuarios | `session.closed` | Cerró una sesión de Marcos | rojo si es de otro | `circle-x` |
| Usuarios | `sessions.closed-all` | Cerró todas las sesiones de Marcos | rojo si es de otro | `circle-slash` |
| Usuarios | `passkey.removed` | Le quitó un celular con huella a Marcos | rojo | `unlink` |
| Usuarios | `phone.cut` | Cortó un celular perdido de Marcos | rojo | `smartphone` |
| Roles | `user.roles-changed` | Le sacó el rol Cajero a Martín | rojo si saca | `user-cog` |
| Roles | `role.created` | Creó el rol Depósito | | `shield-plus` |
| Roles | `role.changed` | Cambió los permisos de Encargado | rojo si saca permisos | `shield-ellipsis` |
| Roles | `role.deleted` | Borró el rol Solo mirar | rojo | `shield-minus` |
| Roles | `role.permissions-added` | Le sumó un permiso nuevo a Administrador (el sistema) | | `shield-check` |
| Sin conexión | `sign-in.offline-confirmed` | Entró sin conexión | | `wifi-off` |
| Sin conexión | `sign-in.offline-rejected` | No se pudo confirmar su entrada sin conexión | ámbar | `cloud-off` |
| Rechazos | `sign-in.offline-repeated` | Se repitió una entrada sin conexión | ámbar | `copy` |
| Rechazos | `sign-in.rejected` | Según el motivo (abajo) | ámbar | `door-closed` |
| Rechazos | `passkey.rejected` | No pudo vincular la huella | ámbar | `scan-face` |
| Rechazos | `code.rejected` | Usó un código vencido o desde otra red | ámbar | `scan-line` |
| Rechazos | `session.confirm-rejected` | No pudo confirmar que era él | ámbar | `shield-alert` |
| Rechazos | `permission.denied` | Quiso usar Roles sin permiso | ámbar | `lock` |
| Rechazos | `users.rejected` | No se pudo dar de baja a Marcos: es el último que administra | ámbar | `ban` |
| Rechazos | `request.throttled` | Llegó al límite de intentos para entrar | ámbar | `hourglass` |
| Usuarios | `audit-log.opened` | Abrió Quién hizo qué | | `eye` |
| Rechazos | `request.rejected` | Se rechazó un pedido que no venía de la aplicación | ámbar | `shield-x` |

`sign-in.rejected` dice el motivo, que es lo que más interesa leer (R1.2): «Intentó entrar con un
correo no autorizado» (`not-authorized`), «… con una cuenta dada de baja» (`deactivated`), «… con un
pase de Google que no sirve» (`invalid-credential`, `nonce`), «… con una huella que no se conoce»
(`unknown-passkey`), «… con un código que no sirve» (`invalid-permit` y los del código), «… y llegó
al límite de intentos de su cuenta» (01 · R2.10).

## 5. API

Las tres rutas piden sesión y `audit-log.view` (`permissions.require`), con el mismo `403` anotado
como `permission.denied` (E14), y comparten un límite de 60 pedidos por minuto **por persona**
(`guards.limit`); pasado, `429` y `request.throttled`. Leen; no anotan nada, salvo `audit-log.opened` (abajo).
Cualquier parámetro que no conocen o no cumple da `400 bad-request` con cuál (E39), sin datos.

### `GET /api/audit-log`

| Parámetro | Qué | Validación |
|---|---|---|
| `page` | La página, desde 1 | Entero ≥ 1; mayor que `pages` (con al menos una acción) da `400` con `page` |
| `size` | 10 o 20 (celular o computadora, R4.3) | Solo esos dos |
| `by` | Hecho por: un id de persona, `system` u `outsider` | UUID de una persona de `people.v1.sqlite`, o una de las dos palabras |
| `to` | Hecho a: un id de persona | UUID de una persona de `people.v1.sqlite` |
| `range` | `today`, `yesterday`, `week` (de lunes a hoy) o `month`: los atajos, que resuelve el servidor con su reloj (constitución, VI) | Una de las cuatro |
| `from`, `until` | Días del negocio, `AAAA-MM-DD`, los dos incluidos | Fecha real, `from ≤ until`, entre el 1 de enero del año del archivo más viejo y hoy; no va con `range` |
| `group` o `type` | Un grupo o un tipo del catálogo | Que exista; `type` dentro de `group` si van los dos |
| `tone` | `red` o `amber`: los números del resumen (R4.9) | No va con `group` ni `type` |
| `summary` | `1`: sumar el resumen (al abrir, al cambiar la fecha y con «Actualizar») | `1` o nada |
| `strip` | `1`: sumar la tira (solo la computadora, solo con un período de un día) | `1` o nada |

Devuelve:

```jsonc
{
  "today": "2026-11-04",              // el día del negocio, para «de hoy» y la cabecera (E22)
  "total": 45, "page": 1, "pages": 3,
  "days": { "2026-11-04": 20, "2026-11-03": 25 },   // cuántas de cada día de la página, con los filtros
  "events": [{
    "id": "2026:4410",                // año y número: único y opaco
    "at": "2026-11-04T13:26:00Z", "arrivedAt": null, "deviceTime": null,
    "type": "user.roles-changed", "tone": "red",
    "actor": { "kind": "person", "id": "…", "name": "Graciela", "today": null },
    "targets": [{ "kind": "person", "id": "…", "name": "Martín", "today": "Martín Sosa" }],
    "changes": { "roles": { "before": ["Cajero", "Encargado"], "after": ["Encargado"] } },
    "data": {}, "device": { "phone": true, "browser": "chrome", "os": "android" }, "ipAddress": "…"
  }],
  "summary": { "total": 20, "amber": 4, "red": 4 },  // con `summary=1`
  "strip": [{ "id": "2026:4410", "at": 48360, "tone": "red" }]   // con `strip=1`; `at` en segundos del día
}
```

- **El resumen** cuenta en el período de las fechas (sin fechas, hoy), sin los demás filtros: son los
  números de arriba (R4.9).
- **La tira** lleva una raya por acción (R4.9): unos 35 bytes cada una, 300 por día hoy (unos 10 KB,
  2 KB comprimidos). Con más de 2.000 acciones en el día, va de a una raya por minuto con la más nueva
  de ese minuto, que es lo que se puede tocar en ese ancho (§ 12).
- **`today`** de una persona es su nombre de hoy, solo si es distinto del de ese momento (E07).
- **`deviceTime`** (E09): la lista muestra esa hora con la marca; ordena, filtra por fecha y pinta la
  tira por `at`, que en una entrada no confirmada es la de llegada. El detalle muestra las dos.
- **No hay ruta que cambie o borre** (E37): ni `POST`, ni `PUT`, ni `DELETE` bajo `/api/audit-log`.

### `GET /api/audit-log/people`

Las personas de los filtros (E30), una vez al abrir la pestaña: id, nombre de hoy, correo y estado,
de `people.v1.sqlite`. Unos 5 KB con 100 personas.

### `GET /api/audit-log/day`

La cinta (R4.11): un día entero, sin los filtros de la lista.

| Parámetro | Qué | Validación |
|---|---|---|
| `date` | El día del negocio, `AAAA-MM-DD`; sin él, hoy | Como `from` |

Devuelve `{ date, today, week, events }`: `week` son los siete días que terminan en `date`, cada uno
con su cantidad y cuántas ámbar y rojas (los días de arriba); `events`, todas las acciones del día en
orden, con la misma forma que la lista. Con más de 2.000 acciones en el día devuelve
`{ date, today, week, tooMany: count }` y ninguna acción (E48).

- Las personas de las filas salen de `actor` y de los `targets` de tipo persona de las acciones; sus
  nombres de hoy, de `/people`, que la pantalla ya tiene.
- Peso: con las 300 acciones de un día de hoy, unos 150 KB sin comprimir y unos 20 KB comprimida
  (Caddy comprime las respuestas de `/api`). Se pide solo al abrir la cinta o al cambiar de día.
- Consultas: 1 de la semana (los siete días como tramos de la misma consulta, `group by tone`, por el
  índice de la fecha), 1 que cuenta el día, 1 de sus acciones y 1 de las personas.

### La consulta

- **En un hilo aparte** (`worker_threads`), con sus propias conexiones de **solo lectura** a cada
  archivo (`readOnly: true`; WAL deja leer mientras se escribe) y una consulta por vez: el hilo
  principal no se frena mientras cuenta (revisión del diseño, 2.1). Antes de pasarle una consulta, el
  hilo principal baja la tanda pendiente, así quien acaba de hacer algo lo ve.
- **Solo los archivos que existen,** listados al arrancar y al crear uno nuevo; nunca se crea uno al
  leer. Los años se eligen por el año UTC de los instantes del período (el 31 de diciembre después de
  las 21, hora del negocio, ya está en el archivo del año siguiente).
- **Los totales de los años cerrados** se guardan en memoria por combinación de filtros: no cambian
  nunca. Así se cuenta solo el año en curso.
- **La página** sale de recorrer los años del más nuevo al más viejo, saltando las que quedan antes;
  la mayoría de las veces toca un solo archivo.
- **Las consultas, con un pedido de una página:** `count(*)` del año en curso (los cerrados, de la
  memoria) + 1 de la página + 1 de `days` (todos los días de la página como tramos de una misma
  consulta: `sum(at >= ? and at < ?)` por tramo, `group by tone`) + 1 de las personas, y con
  `summary` 1 (`group by tone`) y con `strip` 1. Por archivo: un período que cruza de año toca dos.
  Ninguna crece con los días que se muestran. Ninguna a PostgreSQL. Pruebas que miran `explain query plan` de cada forma de consulta
  controlan que usa el índice que corresponde.

**Los días del negocio** se convierten a instantes con la zona horaria del negocio (00 · R8.4). Hasta
que el módulo 06 la deje elegir, es `America/Argentina/Buenos_Aires`, en un solo lugar
(`src/shared/time/business.ts`), que el 06 cambia por su ajuste.

**El permiso** va en `src/shared/contracts/permissions.ts`, con la parte «Usuarios»:
`audit-log.view`, «Ver quién hizo qué», «Abrir Quién hizo qué y ver todas las acciones de todos, con
su detalle.». Al arrancar se le suma solo al Administrador (diseño de 02, § 16; E15).

## 6. Dónde vive cada cosa

| Lugar | Qué |
|---|---|
| `platform/storage/audit/` | `event.ts` (la forma común), `write.ts` (la tanda, `targets`, `people`), `codec.ts` (de la acción a su fila y de vuelta), `schema.ts` (las tablas, los índices y los archivos), `query.ts` (la consulta, que recibe tipos y colores), `source.ts` (de dónde lee: el disco de solo lectura o la memoria), `reader.ts` y `thread.ts` (el hilo de lectura) |
| `platform/device.ts` | El navegador y el sistema, en códigos, de la lista cerrada |
| `src/shared/audit-log/` | El catálogo (§ 4) |
| `src/shared/time/business.ts` | La zona horaria del negocio y los días en instantes |
| `modules/audit-log/` (servidor) | `index.ts` (el registro: el permiso, las rutas, `provideTone`), `routes.ts` (las tres rutas y sus parámetros), `rules.ts` (grupo a tipos, atajos a días, qué campos salen) |
| `modules/audit-log/` (aplicación) | La pantalla (§ 8) |

## 7. Eventos, conexiones y sin conexión

- **No publica ni escucha eventos.** Las personas le llegan con las acciones y al arrancar.
- **No usa el canal en vivo.** La lista no se pone al día sola (R4.6).
- **Sin conexión:** nada baja ni se encola. La pestaña se pone gris (R5.1); al volver la conexión
  solo sale del gris, sin pedir nada: la lista queda como estaba hasta que alguien toque algo.
- **Los datos del celular:** ningún pedido automático. `GET /api/audit-log` sale solo al tocar: abrir
  la pestaña (tocarla, R4.6), un filtro, una página, un número del resumen o «Actualizar». No se suma
  nada a [mobile-data.md](../mobile-data.md).

## 8. La aplicación (`src/app/modules/audit-log/`)

Viaja con la pantalla de Usuarios, que ya se baja aparte del arranque: `users` la muestra en el lugar
de la pestaña importando solo la fachada `audit-log/index.ts`, y la pestaña aparece solo con
`audit-log.view` (02 · R7.7). Bajarla en una parte propia hacía que Vite separara del arranque las
piezas que comparten (botones, íconos, la hoja) y el arranque pasaba su tope.

**Sin el permiso, por la dirección** (E13): el menú del marco conoce `/users/audit-log` como algo de
adentro de Usuarios con su propio permiso (`inside` de la opción). Abierta así sin
«Ver quién hizo qué», el marco muestra su «Sin permiso» en lugar de Usuarios y no se pide nada al
servidor. Si se lo sacan con la pestaña abierta, en cambio, no: Usuarios la cierra y vuelve a la
lista de personas (02 · R7.8).

Las piezas, sobre la maqueta `mockups/users-who-did-what/{desktop,phone}/variant-1-ledger/`:

| Pieza | Qué hace |
|---|---|
| `Summary` | Los tres números (total, rechazos, lo que borró o sacó). Tocar rechazos o lo rojo pone la fecha en el período del resumen, saca el grupo y el tipo y pone `tone`; tocarlo de nuevo o tocar el total saca `tone` (R4.9, E35c). En la computadora, la tira, en el tramo de horas que tiene acciones: toda la tira es un botón: tocarla abre la cinta en la acción más cercana a donde se tocó, y con el teclado en la más nueva (R4.11) |
| `Filters` | Hecho por, hecho a (con las personas de `/people`, las dadas de baja y borradas marcadas), fecha (Hoy, Ayer, Esta semana, Este mes, y desde/hasta) y tipo; Alt + P, A, F y T en la computadora |
| `Ledger` | La lista agrupada por día, con la cantidad del día en la cabecera (`days`); cada acción con el ícono del tipo a la izquierda (R4.10), la hora (y la fecha si no es de `today`), quién, el texto, a quién y el dispositivo, con su color (R4.4) |
| `Detail` | En la computadora, fijo a la derecha, con la acción elegida (al abrir, la primera; ↑ ↓ la cambian, E35d). En el celular, una hoja que sube al tocar. Muestra todo, con las dos horas de una entrada no confirmada |
| `Pager` | «página n de m», anterior y siguiente; RePág y AvPág, que el teclado de la plataforma (`data-page`) da a cualquier lista por páginas |
| `Empty` | Sin acciones (E20) o sin coincidencias, con «Sacar los filtros» (E29) |
| `Tape` | La cinta a pantalla completa, sobre la maqueta `variant-3-tape/` (R4.11). En la computadora, horizontal; en el celular, vertical. Las filas, los puntos y las líneas de quién a quién en un SVG; los días de arriba; el subtítulo con los mismos trozos que `Detail`; la × |
| `Playhead` | El cabezal: arrastrar sobre la pista (se pega a la más cercana de las que se ven), ← → y los botones; en el celular, también deslizar de lado (más largo que alto, 48 px o más); ↑ ↓ eligen la fila y Enter la aísla; con alguien aislado, Escape primero lo suelta (su fila es lo que cierra la capa) y después cierra; Alt+R reproduce (en su capa, con su tecla, como todo botón). «Reproducir» es un paso por acción con un temporizador de la pantalla (14 s el día entero en la computadora, 1 s por acción en el celular), que se corta con cualquier toque, al ocultarse la aplicación o al llegar a la última. Se mueve con `transform` y `opacity`; con «reducir movimiento», salta |

- **El texto** de cada acción lo arma el catálogo con trozos, no con HTML: `says(e)` devuelve
  `texto`, `persona` y `cosa`, y la pantalla los pinta como texto (E38). Los nombres son solo texto:
  tocarlos es tocar la acción, no filtran (E33). El navegador y el sistema se dicen con la lista de la aplicación.
- **El tamaño de página:** 20 con el ancho de computadora y 10 si no, con el mismo corte que usa el
  marco para el menú.
- **La cinta** se abre encima de la lista sin desarmarla: al cerrarla se vuelve con los mismos
  filtros, página y acción elegida (E42). Su estado (día, cabezal, persona aislada) no se guarda.
- **«Algo salió mal»:** `Ledger`, `Detail`, `Filters`, `Tape` y los trozos `persona` llevan `data-private`, así
  la captura los tapa (00 · R9.4), y los últimos pasos guardan solo el nombre de la acción
  (`audit-log.filter`), sin el valor.
- **Lo que se espeja** (03, diseño de `device-link`, § 5.1): lo que se ve vive en valores con nombre
  (`useMirrored`): el filtro, la acción elegida y la cinta abierta con su día y su cabezal. La página
  viaja en modo `refetch`: el otro dispositivo pide con su sesión y su permiso, nunca recibe el contenido.
  El tamaño de página (20 en la computadora, 10 en el celular) lo elige cada pantalla por su forma y no
  se espeja (03 · R6.2).
- **Las teclas** son las del capítulo 00 (R2), declaradas por la pantalla: `refresh`, `page`, `filter`,
  `select` y las de la cinta.
- **Los íconos** del catálogo se copian de Lucide 0.460 a `audit-log-shapes.tsx`, que se baja con la
  pantalla (`addShapes`). La prueba del catálogo mira que cada ícono esté ahí.
- **Los textos** de la pantalla, en `texts.ts`, largos en la computadora y cortos en el celular
  (00 · R1.5).

## 9. Seguridad

- **Qué datos toca:** quién hizo qué, nombres y correos de las personas, los correos que alguien usó
  para intentar entrar, direcciones de internet y lo que dice el navegador. Es lo más sensible que
  guarda el sistema sobre las personas: solo lo ve `audit-log.view` (R3.4), que al instalar tiene solo
  el Administrador.
- **Quién puede:** leer, quien tiene el permiso, en las tres rutas; nadie puede cambiar ni borrar
  (E37): no hay ruta, la lectura abre los archivos de solo lectura y la escritura solo inserta. Quien
  tiene acceso al servidor sí puede tocar el archivo: firmar cada acción o encadenarlas para detectarlo
  queda para cuando haya producción (T116).
- **Autor:** solo la persona de la sesión o la recién probada (§ 2.1).
- **Lo que no sale:** § 2.2.
- **Lo que entra de afuera:** los parámetros, con zod y topes (§ 5), pasados a SQLite siempre como
  parámetros; lo anotado que viene del pedido (el correo cortado, el navegador de una lista cerrada,
  la dirección de la plataforma); al mostrarlo, todo como texto (E38).
- **Abuso:** 60 pedidos por minuto por persona en las tres rutas; tamaños de página fijos; páginas,
  fechas acotadas (desde 2020); la consulta en su hilo, de a una. Un período de 9.000 años no crea ni
  abre archivos (prueba que mira que la carpeta no cambió).
- **Secretos:** ninguno. `node:sqlite` sin `createTagStore` (CVE-2026-58041); el armado de la imagen
  dice la versión de Node.
- **El hilo de lectura** tiene un tope de memoria (256 MB) y cada respuesta, un tiempo máximo (10 s):
  si se pasa, el pedido falla y el resto del servidor sigue. Si el hilo se cae, lo que esperaba falla
  y se vuelve a crear. Los totales guardados de los años cerrados tienen un tope (1.000
  combinaciones); pasado, se empieza de cero.
- **Un tipo que no está en el catálogo** se busca con `Object.hasOwn`: `constructor` o `__proto__` no
  son tipos.
- **Lo que queda en la auditoría de este módulo:** el límite pasado, el permiso negado y, una vez por
  sesión y por día, que se abrió Quién hizo qué (R1.3): si alguien usa una sesión robada para bajar el
  registro, queda el rastro de quién y desde dónde.
- **Cuánto se guardan los correos de afuera y las direcciones:** hasta que se decida T116, que lo
  suma como requisito.

## 10. Metas de performance

- `GET /api/audit-log` con un año de acciones (730.000, a 2.000 por día): menos de 150 ms en la
  notebook del local, en el peor caso que se prueba (todos los filtros, el período más largo, la
  última página), sin frenar el hilo principal: mientras corre, una ruta cualquiera contesta igual.
- Consultas por pedido: las de § 5, con la prueba que las cuenta (`recorded.test.ts`: una página de
  un día y una de la semana hacen las mismas; la cinta, 4).
- La de tiempo con 730.000 acciones (`query-perf.test.ts`) corre solo con `AUDIT_PERF=1`: arma dos
  años en memoria (unos 20 s) y pide la primera página, sus días y el resumen en menos de 1 s.
- La respuesta: menos de 8 KB sin comprimir con 20 acciones; con la tira de un día de hoy, menos de
  20 KB sin comprimir y 4 KB comprimida.
- Escribir no se vuelve más lento: la tanda sigue siendo una transacción por segundo, con `targets` y
  `people` adentro.
- La cinta: `GET /api/audit-log/day` en menos de 150 ms y unos 20 KB comprimida con un día de hoy; la
  cinta se dibuja en menos de 100 ms y el cabezal se mueve sin cortes (sin recalcular la página en
  cada paso).
- El arranque de la aplicación no crece: la pantalla, la cinta y sus íconos se bajan al abrir la
  pestaña.

## 11. Pruebas

| Escenarios | Prueba |
|---|---|
| E01, E02, E06 | Del servidor: una acción de Usuarios deja su línea con la forma común después de confirmar; una que falla, no; un cambio de nombre lleva solo `changes.name` |
| E03, E04 | Del servidor: un correo no autorizado anota `outsider` con el correo; un pedido sin permiso, `permission.denied`; una firma de huella que no verifica deja `outsider` y a la cuenta en `targets` |
| E05, E05b | Del servidor: abrir Usuarios y buscar no agregan líneas; pedir `/api/audit-log` agrega `audit-log.opened` una vez por sesión y por día |
| E07, E08, E30 | De la consulta: «(hoy: …)» como quién y como a quién; «El sistema»; las personas dadas de baja y borradas en `/people` |
| E09, E10 | De la consulta: `deviceTime` en la entrada sin conexión no confirmada; la hora es la del reloj del servidor de prueba |
| E11 a E16 | De las tres rutas (con y sin permiso, `403` anotado) y de la pantalla (la pestaña, «No tenés permiso»); E15, del arranque |
| E17 a E22, E35b | De la pantalla, con el servidor de mentira: 20 y 10 por página, total y «página n de m», vacío, colores (sacar un rol en rojo, darlo sin color), fecha solo si no es de `today`, un ícono por tipo |
| E23 a E31, E35c | De la consulta (cada filtro y sus combinaciones, los atajos con el reloj del servidor, contra archivos de dos años con una acción el 31 de diciembre a las 22) y de la pantalla (volver a la página 1, «Sacar los filtros», los números que filtran) |
| E32 a E35, E35d | De la pantalla: el detalle, tocar una persona, «Actualizar» sin pedidos solos, el teclado |
| E40 a E48 | De la pantalla, con el servidor de mentira y un reloj de prueba: abrir desde la tira y desde «Ver el día», cerrar y volver igual, la línea de quién a quién, ← →, reproducir y detenerse, aislar, cambiar de día, más de 2.000. De la ruta `/day`: el día entero sin filtros, la semana y `tooMany` |
| E36 | De la pantalla: gris sin conexión; al volver sale del gris sin pedir nada |
| E37, E38, E39 | De las rutas: no hay `POST`/`PUT`/`DELETE`; un parámetro mal, uno desconocido o una página de más dan `400`. De la pantalla: un nombre con HTML se ve como texto |
| Seguridad | La respuesta no trae identificadores de dispositivo ni de huella; una acción de 20 KB se anota y dice a quién; un período enorme no crea archivos; la captura de «Algo salió mal» tapa la lista |
| El catálogo | Cada tipo que anota el servidor está; los íconos no se repiten y están dibujados |
| Metas | Las que cuentan las consultas y miran el plan; una de tiempo con 730.000 acciones, fuera de `pnpm check` (tarda), que se corre antes de cerrar el módulo |

**De punta a punta:** ninguna nueva. Lo que cruza el navegador y el servidor (la pestaña con permiso)
ya lo prueban las unitarias de las dos puntas.

## 12. Lo que decidió Carlos

1. **Las acciones de la forma vieja se borran** (§ 3): solo existen en el ambiente de pruebas y nadie
   las usa.
2. **Una persona borrada** figura en los filtros con «(borrada)» y sin correo (§ 3).
3. **Abrir Quién hizo qué se anota una vez por sesión y por día** (R1.3): `GET /api/audit-log`
   anota `audit-log.opened` la primera vez que esa sesión pide cualquiera de las tres rutas en el día del negocio. Lo recuerda
   en memoria (sesión y día); si el servidor se reinicia, puede anotarse una vez más ese día.
4. **La tira, con más de 2.000 acciones en el día,** va de a una raya por minuto (R4.9).

## 13. Tareas

1. **Código común** (se toma como tarea propia, constitución «Trabajo en paralelo»): la forma común
   de `AuditEvent` y el autor (§ 2), `platform/storage/audit/` con archivos `v1`, `targets`,
   `people.v1.sqlite`, los índices, `provideTone` y el corte de 8 KB; `platform/device.ts`;
   `request.throttled`; `src/shared/time/business.ts`; el `index.ts` del catálogo y sus pruebas.
2. **Los módulos que ya anotan, a la forma común** (`sign-in`, `users`, `users/roles`,
   `sign-in/offline`, `http`, `permissions`), cada uno con su archivo del catálogo, `proven` en las
   entradas, `public_id` en `targets` y `audit.knowPeople` al arrancar. Depende de 1.
3. **La consulta** (`query.ts`, `source.ts`, `reader.ts` y `thread.ts`): paginar sobre los años,
   filtros, resumen, tira, `days`, los totales de los años cerrados y los topes, con sus pruebas contra archivos de prueba y
   las que miran el plan. Depende de 1.
4. **El módulo del servidor** `audit-log`: el permiso, las rutas, el límite, `provideTone` y su
   archivo del catálogo. Depende de 2 y 3.
5. **La aplicación:** la pestaña en Usuarios y sus piezas, los íconos, los textos y `data-private`.
   Depende de 4.
6. **La cinta:** `GET /api/audit-log/day` y las piezas `Tape` y `Playhead`, en la computadora y en el
   celular. Depende de 5.
7. **Las pruebas de § 11 y la documentación al día:** los diseños de 01 y 02 donde nombran la forma
   vieja, `architecture.md` (`platform/storage/audit/`, `platform/device.ts`) y la línea del ADR-004
   sobre tipo y persona como texto.
