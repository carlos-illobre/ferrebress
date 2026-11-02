# Diseño técnico · 05 · Quién hizo qué (`audit-log`)

Implementa el [capítulo 05](../../chapters/05-audit-log/rules.md): lo que se guarda de cada acción y
la pestaña Quién hizo qué, con la maqueta aprobada (variante 1, «El libro», con un ícono por tipo de
acción: [screens.md](../../chapters/05-audit-log/screens.md)). Lo que no se cambia acá sigue como
dicen el [ADR-004](../adr/ADR-004-audit-log-in-sqlite.md) y los diseños de [01](sign-in.md),
[02](users.md) y [15](offline.md).

## 1. Qué resuelve

Las reglas R1 a R5 del capítulo 05 y sus escenarios E01 a E39 (con E35b a E35d).

**Lo que ya existe** (01 y 02): la plataforma anota en SQLite, un archivo por año, por tandas, después
de que PostgreSQL confirma (`platform/storage/audit.ts`, `guards.record`). Cada módulo anota con
`type`, `userId` y un `data` libre, con la persona afectada en lugares distintos (`targetUserId`,
`target`). No hay forma de leerlo salvo `read(year)`, que trae todo, ni índices más que por fecha.

**La idea técnica:** una forma común de cada acción (quién, a quién, qué cambió, desde dónde), un
catálogo compartido que dice de cada tipo su grupo, su color, su ícono y su texto, y una consulta con
índices que pagina sobre los archivos de cada año. El servidor no arma textos: devuelve la acción
con su forma común y la aplicación la dice con el catálogo.

## 2. La forma común de una acción

`AuditEvent` (`platform/storage/audit.ts`) pasa a ser:

| Campo | Qué | Regla |
|---|---|---|
| `type` | `cosa.acción` (`user.renamed`) | R2.1 |
| `at` | La hora del servidor (`clock.now()`) | R2.2 |
| `deviceTime` | La hora del dispositivo, solo si el servidor no la pudo confirmar (entrar sin conexión) | R2.2, E09 |
| `actor` | `{ kind: 'person', userId }`, `{ kind: 'system' }` o `{ kind: 'outsider', email? }` | R2.3 |
| `targets` | Lista de `{ kind, id, name? }`: `person`, `role`, `session`, `device`, y los que sumen los demás módulos (`product` con el 07). Los que no son personas llevan su nombre de ese momento | R2.4 |
| `changes` | `{ campo: { before, after } }`, solo lo que cambió | R2.5 |
| `names` | `{ userId: nombre }`: los nombres que valen desde esta acción (§ 3) | R2.3, E07 |
| `data` | Lo demás que el texto necesita (el motivo de un rechazo, el permiso que faltó, el método de entrada) | R2.1 |
| `device` | `{ phone: boolean, label }` («Chrome en Android»), del pedido | R2.6 |
| `ipAddress` | La dirección del pedido, la que ya calcula la plataforma | R2.6 |

- **`guards.record(c, type, fields)`** completa solo `at`, `device`, `ipAddress` y, si hay sesión,
  `actor` como la persona de la sesión; sin sesión, `outsider`. El módulo pone `targets`, `changes`,
  `names` y `data`. Lo que hace el sistema (sumarle permisos nuevos al Administrador, vencer una
  sesión) se anota con `platform.audit.record` y `actor: { kind: 'system' }`.
- **`device`** sale de `deviceLabel` e `isPhone`, que pasan de `sign-in/device.ts` a
  `platform/device.ts`: la plataforma los necesita y no puede importar un módulo. La etiqueta sale de
  una lista cerrada (diseño de 01, § 5), así el navegador no elige el texto que se muestra.
- **Solo después de confirmar** (R1.4): como hoy, se llama a `record` después de que la transacción
  terminó bien. Un intento rechazado se anota en el rechazo.
- **Lo que no entra:** un `email` de `outsider` se corta en 254 caracteres; `data` y `changes`
  pasan por `JSON.stringify` y se rechaza una acción de más de 8 KB (se anota cortada, con
  `data.truncated: true`), así un pedido no infla el archivo.

**Los módulos que ya anotan pasan a la forma común** (`sign-in`, `users`, `users/roles`,
`sign-in/offline`, `platform/http.ts` y `platform/permissions.ts`): `targetUserId` y `target` pasan a
`targets`, `before`/`after` a `changes`. Las acciones ya anotadas en los ambientes (solo el de
pruebas: no hay producción) no se reescriben (la auditoría no se modifica): se leen con su forma
vieja y, si el catálogo no encuentra lo que necesita, se dicen con el texto genérico del tipo («Le
cambió los roles a alguien»).

## 3. Entidades

Todo en SQLite (ADR-004), en la carpeta de `AUDIT_PATH`. Ninguna tabla nueva en PostgreSQL.

### Un archivo por año: `<año>.sqlite`

La tabla `events` que ya existe suma columnas (`alter table … add column` al abrir, con la versión en
`pragma user_version`: 0 es la de hoy, 1 la de este diseño).

| Columna | Tipo | Para qué |
|---|---|---|
| `id` | `integer` PK | El orden de escritura; con `at`, el orden de la lista |
| `at` | `integer` | La hora del servidor, en milisegundos |
| `type` | `text` | El tipo |
| `actor_kind` | `integer` | 0 persona, 1 sistema, 2 alguien sin entrar. En las filas viejas, 0 si tienen `user_id` y 2 si no |
| `user_id` | `text` | Quién, si es una persona (ya existe) |
| `device_id`, `ip_address` | `text` | Ya existen |
| `payload` | `blob` | Lo demás (`targets`, `changes`, `data`, `device`, `deviceTime`, el correo de `outsider`), comprimido, como hoy |

Tabla nueva `targets`, una fila por cada cosa tocada: `event_id`, `kind`, `target_id`. La cosa
también va entera en el `payload`; esta tabla es solo para buscar.

**Índices** (los de ADR-004):

| Índice | Para |
|---|---|
| `events (at, id)` | La lista sin filtros y por fechas (R4.2) |
| `events (user_id, at, id)` | «Hecho por» una persona (R4.5) |
| `events (actor_kind, at, id)` | «Hecho por» el sistema o alguien sin entrar |
| `events (type, at, id)` | El filtro por tipo y por grupo (un grupo es una lista de tipos, § 4) |
| `targets (target_id, event_id)` | «Hecho a» (R4.5) y, con el 07, la historia de un dato (T115) |

`id` va en cada índice porque la lista se ordena por `at desc, id desc`: dos acciones del mismo
milisegundo salen siempre en el mismo orden y una página no repite ni saltea filas.

### `names.sqlite`: los nombres de las personas a lo largo del tiempo

Para «el nombre que tenía en ese momento» y «(hoy: …)» (R2.3, E07) y para listar en los filtros a
las personas dadas de baja y borradas (E30), que ya no están o no van a estar en PostgreSQL.

| Columna | Para qué |
|---|---|
| `user_id`, `since` (PK) | De quién y desde cuándo vale el nombre |
| `name` | El nombre |
| `email` | El correo de ese momento, para distinguir a dos personas con el mismo nombre en el filtro |

- Se escribe en la misma tanda que la acción que trae `names`: autorizar (`user.authorized`),
  cambiar el nombre o el correo, el primer Administrador.
- **Al arrancar**, `users` le da a la auditoría el nombre de hoy de cada persona que no tiene ninguno
  (`audit.knowNames`): así las personas que ya existían antes de este módulo tienen el suyo, con
  `since` = el arranque. Para sus acciones anteriores se usa ese mismo nombre.
- No va en el archivo del año: un nombre de 2026 sigue valiendo en 2028. Es chico (una fila por
  cambio de nombre).

## 4. El catálogo de los tipos

`src/shared/audit-log/` (nuevo; lo comparten el servidor y la aplicación), un archivo por módulo que
anota (`sign-in.ts`, `users.ts`, `roles.ts`, `offline.ts`, `platform.ts`) y un `index.ts` que los junta.
Cada tipo:

```ts
'user.renamed': {
  group: 'users',              // R2.1: el grupo del filtro «Tipo»
  tone: 'plain',               // R4.4: 'red' | 'amber' | 'plain'
  icon: 'pencil',              // R4.10: un ícono de Lucide, que no se repite
  name: 'Cambió el nombre',    // el nombre del tipo en el filtro
  says: (e) => …,              // el texto de la lista, con las piezas de § 7
}
```

- **Los grupos:** Entrar, Usuarios, Roles, Sin conexión y Rechazos; cada módulo que llega suma el
  suyo. Todos los intentos rechazados van al grupo Rechazos y en ámbar.
- **Lo que usa el servidor:** `group` y `tone`, para filtrar y contar (§ 5). Lo que usa la
  aplicación: todo.
- **Un tipo que no está en el catálogo** (de una versión más nueva, o uno viejo que se dejó de usar) se
  muestra con un ícono y un texto genérico, en el grupo «Otros».
- **Una prueba** controla que cada tipo que anota el servidor está en el catálogo, que ningún ícono
  se repite entre tipos y que cada ícono existe en Lucide 0.460 (`docs/design/common/icons/`).

Los tipos de hoy, con su ícono propuesto (se ajusta en el paso 6 si alguno no está en esa versión de
Lucide; Carlos los ve en una captura en el paso 5):

| Grupo | Tipo | Texto (ejemplo) | Color | Ícono |
|---|---|---|---|---|
| Entrar | `sign-in.succeeded` | Entró con Google | | `log-in` |
| Entrar | `sign-out` | Salió | | `log-out` |
| Entrar | `session.ended` | Se le venció la sesión | | `timer-off` |
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
| Usuarios | `session.closed` | Cerró una sesión de Marcos | rojo | `circle-x` |
| Usuarios | `sessions.closed-all` | Cerró todas las sesiones de Marcos | rojo | `circle-slash` |
| Usuarios | `passkey.removed` | Le quitó un celular con huella a Marcos | rojo | `unlink` |
| Usuarios | `phone.cut` | Cortó un celular perdido de Marcos | rojo | `smartphone` |
| Roles | `user.roles-changed` | Le dio el rol Vendedor a Marcos | | `user-cog` |
| Roles | `role.created` | Creó el rol Depósito | | `shield-plus` |
| Roles | `role.changed` | Cambió los permisos de Encargado | | `shield-ellipsis` |
| Roles | `role.deleted` | Borró el rol Solo mirar | rojo | `shield-minus` |
| Roles | `role.permissions-added` | Le sumó un permiso nuevo a Administrador (el sistema) | | `shield-check` |
| Sin conexión | `sign-in.offline-confirmed` | Entró sin conexión | | `wifi-off` |
| Rechazos | `sign-in.offline-rejected` | No se pudo confirmar su entrada sin conexión | ámbar | `cloud-off` |
| Rechazos | `sign-in.offline-repeated` | Se repitió una entrada sin conexión | ámbar | `copy` |
| Rechazos | `sign-in.rejected` | Intentó entrar con un correo no autorizado | ámbar | `door-closed` |
| Rechazos | `sign-in.throttled` | Llegó al límite de intentos para entrar | ámbar | `hourglass` |
| Rechazos | `passkey.rejected` | Usó una huella que no se conoce | ámbar | `scan-face` |
| Rechazos | `code.rejected` | Usó un código vencido o de otra red | ámbar | `scan-line` |
| Rechazos | `session.confirm-rejected` | No pudo confirmar que era él | ámbar | `shield-alert` |
| Rechazos | `permission.denied` | Quiso usar Roles sin permiso | ámbar | `lock` |
| Rechazos | `users.rejected` | No se pudo dar de baja a Marcos: es el último que administra | ámbar | `ban` |
| Rechazos | `users.throttled` | Llegó al límite de cambios en Usuarios | ámbar | `timer` |
| Rechazos | `request.rejected` | Se rechazó un pedido que no venía de la aplicación | ámbar | `shield-x` |

La entrada sin conexión que no se confirmó va con los rechazos: es el ámbar de R4.4.

## 5. API

### `GET /api/audit-log`

Con sesión y el permiso `audit-log.view` (`permissions.require`). Lee; no anota nada (R1.3).

Recibe, en la dirección (todo opcional):

| Parámetro | Qué | Validación |
|---|---|---|
| `page` | La página, desde 1 | Entero de 1 a 100.000 |
| `size` | 10 o 20 (celular o computadora, R4.3) | Solo esos dos |
| `by` | Hecho por: un id de persona, `system` u `outsider` | UUID o una de las dos palabras |
| `to` | Hecho a: un id de persona | UUID |
| `from`, `until` | Días del negocio, `AAAA-MM-DD`, los dos incluidos | Fecha real, `from ≤ until` |
| `group`, `type` | Un grupo o un tipo del catálogo | Que exista en el catálogo |
| `tone` | `red` o `amber`: los números del resumen que filtran (R4.9) | Solo esos dos |
| `around` | Un instante (milisegundos): la página que lo contiene, para tocar una raya de la tira | Entero |

Con un parámetro que no cumple: `400 bad-request` con cuál (E39), sin datos.

Devuelve:

```jsonc
{
  "total": 45, "page": 1, "pages": 3,
  "events": [{
    "id": "2026:4410",                 // año y número: único y opaco
    "at": "2026-11-04T13:26:00Z", "deviceTime": null,
    "type": "user.roles-changed",
    "actor": { "kind": "person", "id": "…", "name": "Graciela", "today": null },
    "targets": [{ "kind": "person", "id": "…", "name": "Martín", "today": "Martín Sosa" }],
    "changes": { "roles": { "before": ["Cajero", "Encargado"], "after": ["Encargado"] } },
    "data": {}, "device": { "phone": true, "label": "Chrome en Android" }, "ipAddress": "…"
  }],
  "summary": { "total": 20, "amber": 4, "red": 4 },   // del período de las fechas (R4.9)
  "strip": [{ "minute": 626, "count": 1, "tone": "red" }],  // solo si el período es un día
  "selected": "2026:4410"               // con `around`
}
```

- **El resumen** cuenta en el período de `from`/`until` (sin fechas: hoy), sin los demás filtros:
  son los números de arriba, que no cambian al filtrar.
- **La tira** va por minuto del día del negocio, con la cantidad y el color más fuerte (rojo sobre
  ámbar). Con 2.000 acciones por día son como mucho 1.440 puntos; hoy, unos 300. Solo la pide la
  computadora (`strip=1`); el celular no la muestra.
- **`today`** es el nombre de hoy de la persona, solo si es distinto del de ese momento (E07).
- **Los días del negocio** se convierten a instantes con la zona horaria del negocio (00 · R8.4). Hasta
  que el módulo 06 la deje elegir, es `America/Argentina/Buenos_Aires`, en un solo lugar
  (`src/shared/contracts/business-time.ts`), que el 06 cambia por su ajuste.
- **Las personas del filtro** vienen en `GET /api/audit-log/people` (una vez, al abrir la pestaña):
  cada id con su nombre de hoy y su correo, de `names.sqlite`, también las dadas de baja y las
  borradas (E30). Unos 5 KB con 100 personas.
- **No hay ruta que cambie o borre** (E37): ni `POST`, ni `PUT`, ni `DELETE` bajo `/api/audit-log`.

### La consulta, sobre los años

1. Los años del período (sin fechas, todos los archivos que hay, del más nuevo al más viejo).
2. En cada año, cuántas coinciden (`count(*)` con los índices de § 3).
3. La página sale de recorrer los años en orden, saltando las que quedan antes: la mayoría de las
   veces toca un solo archivo.
4. Los nombres de quién y a quién de esa página, en una consulta a `names.sqlite`.

**El permiso** va en `src/shared/contracts/permissions.ts`, con la parte «Usuarios»:
`audit-log.view`, «Ver quién hizo qué», «Abrir Quién hizo qué y ver todas las acciones de todos, con
su detalle.». Al arrancar se le suma solo al Administrador (diseño de 02, § 16; E15).

## 6. Eventos, conexiones y sin conexión

- **No publica ni escucha eventos.** Los nombres le llegan con las acciones (`names`) y al arrancar.
- **No usa el canal en vivo.** La lista no se pone al día sola (R4.6).
- **Sin conexión:** nada baja ni se encola. Sin conexión, la pestaña gris de Usuarios (R5.1).
- **Los datos del celular:** ningún pedido automático. `GET /api/audit-log` sale solo al tocar: abrir
  la pestaña, un filtro, una página o «Actualizar». No se suma nada a
  [mobile-data.md](../mobile-data.md).

## 7. La aplicación (`src/app/modules/audit-log/`)

Se baja recién al abrir la pestaña (`import()`), como Usuarios. `users` la muestra en su lugar de la
pestaña (hoy, «Auditoría · Pronto») importando solo la fachada `audit-log/index.ts`, y la pestaña
aparece solo con `audit-log.view` (02 · R7.7).

Las piezas, sobre la maqueta `mockups/users-who-did-what/{desktop,phone}/variant-1-ledger/`:

| Pieza | Qué hace |
|---|---|
| `Summary` | Los tres números (total, rechazos, lo que borró o sacó), que ponen y sacan `tone` (R4.9, E35c); en la computadora, la tira, que pide la página con `around` |
| `Filters` | Hecho por, hecho a, fecha (con Hoy, Ayer, Esta semana, Este mes, y desde/hasta) y tipo; Alt + P, A, F y T en la computadora (como la maqueta) |
| `Ledger` | La lista agrupada por día, con el ícono del tipo a la izquierda (R4.10), la hora, quién, el texto, a quién y el dispositivo; el color de R4.4 |
| `Detail` | En la computadora, fijo a la derecha, con la acción elegida (al abrir, la primera; ↑ ↓ la cambian, E35d). En el celular, una hoja que sube al tocar |
| `Pager` | «página n de m», anterior y siguiente; RePág y AvPág |
| `Empty` | Sin acciones (E20) o sin coincidencias, con «Sacar los filtros» (E29) |

- **El texto** de cada acción lo arma el catálogo (§ 4) con piezas, no con HTML: `says(e)` devuelve
  una lista de trozos (`texto`, `persona`, `cosa`) y la pantalla los pinta como texto (E38). Tocar
  una persona filtra por ella (E33).
- **El tamaño de página:** 20 si el ancho es de computadora y 10 si no, con el mismo corte que usa
  el marco para el menú.
- **Las acciones con nombre** (para el teclado y, con el 03, el espejo): `audit-log.refresh`,
  `audit-log.page`, `audit-log.filter`, `audit-log.select`.
- **Los íconos** del catálogo que no están en la aplicación se copian de Lucide 0.460 a un
  `audit-log-shapes.tsx` que se baja con la pantalla (`addShapes`), como los de Usuarios.
- **Los textos** de la pantalla, en `texts.ts`, largos en la computadora y cortos en el celular
  (00 · R1.5).

## 8. Seguridad

- **Qué datos toca:** quién hizo qué, nombres y correos de las personas, los correos que alguien usó
  para intentar entrar, direcciones de internet y navegadores. Es lo más sensible que guarda el
  sistema sobre las personas: solo lo ve `audit-log.view` (R3.4), que al instalar tiene solo el
  Administrador.
- **Quién puede:** leer, quien tiene el permiso; nadie puede cambiar ni borrar (E37). No hay ruta; la
  tabla se abre solo desde la plataforma, que solo inserta. Quien tiene acceso al servidor sí puede
  tocar el archivo: firmar cada acción o encadenarlas para detectarlo es más de lo que pide hoy el
  negocio, y queda anotado para cuando haya producción (T116).
- **Lo que entra de afuera:**
  - Los parámetros de la consulta, con zod (§ 5); los filtros se pasan a SQLite siempre como
    parámetros, nunca armando el texto de la consulta.
  - Lo que se anota y viene del pedido: el correo de un intento (cortado en 254), el navegador (de
    una lista cerrada, no el texto que manda) y la dirección (la que calcula la plataforma, no una
    cabecera).
  - Al mostrarlo, todo como texto (E38): los trozos del catálogo no admiten HTML.
- **Abuso:** la consulta, como mucho 60 por minuto por sesión (`guards.limit`); pasado, `429` y una
  línea `audit-log.throttled` por ventana. Una página grande no existe: el tamaño es 10 o 20.
- **Sin permiso:** `403` con el permiso que falta, anotado como `permission.denied` una vez por
  minuto (E14), sin dar datos; la aplicación no muestra la pestaña (E12) y por la dirección ve «No
  tenés permiso» (E13).
- **Secretos:** ninguno.
- **Lo que queda en la auditoría de este módulo:** nada al leer (R1.3); el límite pasado, sí.

## 9. Metas de performance

- `GET /api/audit-log` con un año de acciones (730.000, a 2.000 por día): menos de 150 ms en la
  notebook del local, con cualquier combinación de filtros. Consultas: ninguna a PostgreSQL (la sesión
  y los permisos están en memoria); a SQLite, 2 por año que toca, más 1 del resumen, 1 de la tira y 1
  de los nombres. Cada una con su prueba que las cuenta.
- La respuesta: menos de 15 KB con 20 acciones y la tira.
- Escribir no se vuelve más lento: la tanda sigue siendo una transacción por segundo; `targets` y
  `names` van en ella.
- El arranque de la aplicación no crece: la pantalla y sus íconos se bajan al abrir la pestaña.

## 10. Pruebas

| Escenarios | Prueba |
|---|---|
| E01, E02, E06 | Del servidor: una acción de Usuarios deja su línea con la forma común después de confirmar; una que falla, no; un cambio de nombre lleva solo `changes.name` |
| E03, E04 | Del servidor: un correo no autorizado anota `outsider` con el correo; un pedido sin permiso, `permission.denied` |
| E05 | Del servidor: abrir Usuarios, buscar y pedir `/api/audit-log` no agregan líneas |
| E07, E08, E30 | De la consulta: «(hoy: …)» como quién y como a quién; «El sistema»; las personas borradas en `/people` |
| E09, E10 | De la consulta: `deviceTime` en la entrada sin conexión no confirmada; la hora es la del reloj del servidor de prueba |
| E11 a E16 | De las rutas (con y sin permiso, `403` anotado) y de la pantalla (la pestaña, «No tenés permiso»); E15, del arranque |
| E17 a E22, E35b | De la pantalla, con el servidor de mentira: 20 y 10 por página, total y «página n de m», vacío, colores, fecha solo si no es de hoy, un ícono por tipo |
| E23 a E31, E35c | De la consulta (cada filtro y sus combinaciones, contra un archivo con acciones de dos años) y de la pantalla (volver a la página 1, «Sacar los filtros», los números que filtran) |
| E32 a E35, E35d | De la pantalla: el detalle, tocar una persona, «Actualizar» sin pedidos solos, el teclado |
| E36 | De la pantalla: gris sin conexión y vuelve sola |
| E37, E38, E39 | De las rutas: no hay `POST`/`PUT`/`DELETE`; un parámetro mal da `400`. De la pantalla: un nombre con HTML se ve como texto |
| El catálogo | Cada tipo que anota el servidor está; los íconos no se repiten y existen |
| Metas | Las que cuentan las consultas, y una de tiempo con 730.000 acciones (fuera de `pnpm check`, a mano: tarda) |

**De punta a punta:** ninguna nueva. Lo que cruza el navegador y el servidor (la pestaña con permiso)
ya lo prueban las unitarias de las dos puntas; si Carlos quiere una, se justifica antes (CLAUDE.md).

## 11. Tareas

1. **Código común** (se toma como tarea propia, constitución «Trabajo en paralelo»): la forma común
   de `AuditEvent`, las columnas, `targets`, `names.sqlite` y los índices; la versión del archivo;
   `deviceLabel` e `isPhone` a la plataforma; `guards.record` con `actor` y `device`;
   `business-time.ts`; el catálogo `src/shared/audit-log/` con su prueba.
2. **Los módulos que ya anotan, a la forma común** (`sign-in`, `users`, `users/roles`,
   `sign-in/offline`, `http`, `permissions`), con `names` al autorizar, cambiar el nombre y el primer
   Administrador, y `audit.knowNames` al arrancar. Depende de 1.
3. **La consulta** (`platform/storage/audit-query.ts`): paginar sobre los años, filtros, resumen,
   tira y nombres, con sus pruebas contra archivos de prueba. Depende de 1.
4. **El módulo del servidor** `audit-log`: el permiso, las dos rutas, el límite. Depende de 2 y 3.
5. **La aplicación:** la pestaña en Usuarios y sus piezas, los íconos y los textos. Depende de 4.
6. **Las pruebas de § 10 y la documentación al día** (el diseño de 01 y 02 donde nombran la forma
   vieja, `architecture.md` si cambia algo de `platform/`).
