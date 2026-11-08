# Diseño técnico · 06 · Administración (`administration`), etapa a: ajustes para todos

Implementa la etapa a del [capítulo 06](../../chapters/06-administration/rules.md): R1 a R7, con sus
escenarios E01 a E40, y lo que trae en 00 · R8.4, 01 · R3.2 y 03 · R2.2. La pantalla aprobada es
[`mockups/administration-settings/final/`](../../design/mockups/administration-settings/final/). Lo que
decide Carlos está en § 12.

## 1. La idea técnica

- **Un ajuste es una fila con su versión.** Los ajustes viven en una tabla de clave y valor, cada uno con
  su número de versión. Cambiar uno pide la versión que se vio: si otro lo cambió antes, no se pisa
  (R2.3), y dos ajustes distintos se guardan sin chocar (E13). Es el mismo mecanismo que los roles
  (diseño de 02).
- **La lista de ajustes es fija y la comparte el servidor con la aplicación,** como los permisos:
  `src/shared/contracts/administration.ts` dice de cada ajuste su clave, su grupo, su valor de arranque y
  cómo se valida. Un capítulo nuevo suma sus filas (R1.3).
- **Los ajustes están en la memoria del servidor.** Se cargan al arrancar y se actualizan al confirmar
  cada cambio. Quien los usa los lee de la fachada sin consultar la base: `sign-in` en cada pedido y en
  cada latido (que hoy leen su `settings.ts` sin esperar), y `device-link` al armar su vista. Así un
  cambio vale en el próximo pedido de cualquier dispositivo (R2.4, R6.3, R7.3).
- **`administration` no conoce a quien lo usa:** `sign-in` y `device-link` importan su fachada, nunca al
  revés. Para que un módulo reaccione en el momento a un cambio, `administration` publica el evento
  `settings.changed`.
- **El redondeo recalcula precios que son del catálogo**, que todavía no existe. `administration` define
  la forma de quien recalcula (`PriceRecalculator`: contar cuántos cambian, mostrar ejemplos y aplicar
  dentro de una transacción) y el catálogo se anota al registrarse. Sin nadie anotado (hasta 07), no hay
  precios: no cambia ninguno y se guarda sin preguntar (E21).
- **La zona horaria sale del `.env`** (`BUSINESS_TIME_ZONE`, R5). Deja de estar escrita en
  `src/shared/time/business.ts`: el servidor la fija al arrancar y la aplicación la recibe en
  `/api/start`.

## 2. Entidades

### `administration.settings` (nueva, migración `001-settings`)

| Columna | Tipo | Para qué |
|---|---|---|
| `key` | `text`, clave | El ajuste: `roundingStep`, `quickMargins`, `sessionIdle`, `sessionMax`, `pairingDays` |
| `value` | `jsonb`, `not null` | Su valor, con la forma que dice el contrato |
| `version` | `integer`, `not null` | Sube en 1 con cada cambio (R2.3) |
| `changed_at` | `timestamptz`, nulo | Cuándo cambió por última vez; nulo, si nunca cambió |
| `changed_by` | `uuid`, nulo | Quién lo cambió por última vez, para «Lo cambió <persona> recién» |

- **Los valores de arranque no están en la tabla:** están en el contrato. Una clave sin fila vale lo de
  arranque, con versión 0; el primer cambio inserta la fila. Así un ajuste nuevo de otro capítulo no
  necesita migración.
- **Sin índices más que la clave:** son cinco filas.
- **La historia de cada ajuste está en la auditoría,** no acá (constitución, V).

### Los ajustes

| Clave | Valor | Arranque | Valida |
|---|---|---|---|
| `roundingStep` | Entero en pesos; 0 es «sin redondeo» | 1000 | Uno de 0, 10, 50, 100, 500, 1000, 5000 (R3.2) |
| `quickMargins` | Cinco enteros | [300, 200, 100, 50, 25] | Cinco, de 1 a 10.000, sin repetirse; el servidor los guarda ordenados de mayor a menor (R4.2) |
| `sessionIdle` | Minutos | 60 | Uno de 15, 30, 60, 120 (R6.2) |
| `sessionMax` | Horas | 8 | Uno de 4, 8, 12, 24 (R6.2) |
| `pairingDays` | Días | 30 | Entero de 1 a 365 (R7.2) |

## 3. API

Formas y errores en `src/shared/contracts/administration.ts`. Todas piden sesión.

| Ruta | Qué hace | Permiso | Consultas |
|---|---|---|---|
| `GET /api/administration` | Los ajustes con su valor, su versión y quién y cuándo los cambió por última vez; la zona horaria del negocio con su nombre; si quien pide puede cambiarlos | Ninguno (R1.2) | 1: los nombres de quienes los cambiaron; los ajustes salen de la memoria |
| `GET /api/administration/rounding` | Para el panel del redondeo: cuántos precios hay, cuántos cambian con cada paso y hasta cinco ejemplos | Ninguno | Las de quien recalcula; hoy, 0 |
| `PUT /api/administration/settings/:key` | `{ value, version, confirmed? }`. Cambia un ajuste | «Cambiar los ajustes» | 3: trabar la fila, escribirla y la auditoría |

- **Quién lo tiene** (R1.2, E02): la pantalla usa la ruta que ya existe, `GET
  /api/permissions/:permission/holders` (diseño de 02).
- **Errores del `PUT`:**
  - `400 invalid`, con el rango: valor que no cumple la tabla de § 2 (R2.2, E24, E27, E28, E37, E38).
  - `403 forbidden`, con el permiso, como cualquier ruta (R1.5, E03, E05).
  - `404`: una clave que no está en la lista.
  - `409 changed`, con el valor y la versión de ahora y el nombre de quien lo cambió (R2.3, E12).
  - `409 confirm`, con cuántos precios cambian: un `roundingStep` que cambia precios, sin `confirmed`
    (R3.4, E18). Con `confirmed: true` se recalcula; si el número de ahora ya no es el que se vio, igual
    se aplica: la persona confirmó cambiar el paso, y el número que vio era el de un momento antes.
  - `503 recalc-failed`: falló el recálculo; no cambió nada (R3.5, E22).
- **Deshacer** (R2.1) no es una ruta: es otro `PUT` con el valor anterior y la versión nueva. Si otro lo
  cambió en el medio, da `409 changed`, como cualquier cambio.
- **`/api/start`** suma `businessTimeZone` (con o sin sesión: la entrada también muestra horas).

## 4. Eventos y auditoría

- **`settings.changed`**, en la transacción del cambio: `{ key, before, after, prices? }`. Lo escuchan
  `device-link`, que corre ya su limpieza de vínculos vencidos si bajaron los días (R7.3, E39), y la
  memoria de `administration`, que se actualiza al confirmar.
- **En Quién hizo qué,** grupo nuevo «Administración»: «Cambió <ajuste>», con el valor anterior y el nuevo
  (R2.5, E09), y en el redondeo, cuántos precios cambiaron (E19). Deshacer queda como otro cambio (E10).
- **Rechazos:** sin permiso, el `permission.denied` que ya anota la plataforma una vez por minuto (E03).
  Los `400` y `409` no se anotan: son errores de quien tiene el permiso, que la pantalla ya muestra.

## 5. Dónde vive cada cosa

### El servidor, `src/server/modules/administration/`

| Archivo | Qué hace |
|---|---|
| `index.ts` | La fachada: `settings()` (los valores de ahora, sin esperar), `onRounding(recalculator)` para el catálogo, el registro de las rutas y del permiso |
| `routes.ts` | Las tres rutas |
| `rules.ts` | Validar un valor contra el contrato, ordenar los márgenes, decidir si hace falta confirmar |
| `data.ts` | Leer todas las filas; trabar, insertar o actualizar una |
| `memory.ts` | Los valores en memoria, cargados al arrancar y al día con cada cambio confirmado |
| `events.ts` | `settings.changed` |
| `migrations/001-settings.ts` | La tabla |

### Lo que cambia en otros módulos

- **`sign-in`:**
  - `closedReasonOf`, `isOpen`, la limpieza diaria y las listas de sesiones abiertas leen los dos tiempos
    de `administration.settings()` en lugar de su `settings.ts` (01 · R3.2).
  - La cookie de la sesión dura lo que la opción más larga (24 horas, en el `settings.ts` de `sign-in`):
    el servidor es quien cierra la sesión. Si la cookie durara el tope de ese momento, subir el tope no
    alargaría las sesiones abiertas (E36).
  - `/api/start` suma `businessTimeZone`.
- **`device-link`:** `viewOf` y la limpieza diaria leen `pairingDays` de la fachada, y la limpieza corre
  también al recibir `settings.changed` de `pairingDays` (03 · R2.2).
- **`users`:** nada; el permiso nuevo se le suma solo al rol Administrador al arrancar (02 · R7.4).

### Código común

- `src/shared/contracts/administration.ts`: la lista de ajustes, sus formas y sus errores.
- `src/shared/contracts/permissions.ts`: el grupo `administration` y el permiso `settings.change`,
  «Cambiar los ajustes».
- `src/shared/audit-log/administration.ts`: cómo se ve `settings.changed` en Quién hizo qué.
- `src/shared/time/business.ts`: la zona deja de estar escrita; `setBusinessTimeZone(zone)` la fija una
  vez (el servidor al arrancar, la aplicación al recibir `/api/start`) y los formatos se arman con ella.
- `src/server/platform/config.ts`: `BUSINESS_TIME_ZONE`, obligatoria y sin valor por omisión
  (constitución, VIII), validada con `Intl.supportedValuesOf('timeZone')`; en `.env.example` y en el
  `.env` de pruebas, `America/Argentina/Buenos_Aires`.

### La aplicación, `src/app/modules/administration/`

| Archivo | Qué hace |
|---|---|
| `index.ts` | La opción de Más (ya está en el menú, sin dirección: se le suma) |
| `api.ts` | Las tres llamadas |
| `texts.ts` | Los textos, largos en la computadora y cortos en el celular |
| `useAdministration.ts` | Los ajustes, el ajuste elegido, guardar, deshacer, el choque con otro, la confirmación |
| `preview.ts` | Lo que muestra cada opción antes de tocarla (el día de mostrador, el calendario del vínculo): cuentas puras, sin pedidos |
| `screens/Administration/` | La lista, el panel del ajuste elegido y la confirmación, con su CSS |

## 6. Conexiones

- **`piggyback`:** el campo `a` de la cabecera lleva la suma de las versiones de los ajustes (unos 4
  bytes). La aplicación lo escucha solo con Administración a la vista: si cambia, vuelve a pedir
  `GET /api/administration` (E08, E14). Con la pantalla cerrada no pide nada.
- **Nada de canales.** El avance del recálculo («1.263 de 1.650») usa el canal `temporary` y se programa
  con el catálogo, que es cuando hay precios para recalcular (§ 12, 2).

## 7. Pantallas

- **Lo que viene del servidor** se pide con `useMirroredQuery` en modo `forward`: con el celular y la
  computadora vinculados, el otro lo recibe por el espejo (R1.7).
- **Valores con nombre,** espejados: el ajuste elegido, la opción sobre la que se pasa (lo que muestra el
  panel), la confirmación del redondeo abierta y el aviso de «Lo cambió <persona> recién».
- **Local:** el cursor.
- **Teclas:** la de cada ajuste en la lista (R, M, Z, S, T, V) y ← → para sus opciones (R1.8); en la
  confirmación, «Cambiar N precios» y «Cancelar»; «Deshacer» en el aviso. Se declaran con los atributos
  de `platform/keyboard`.
- **Piezas:** las de `ui/` (Toast con su acción, Dialog, LoadState, Offline). Los botones de opciones
  usan el estilo de los de Configuración; no se suma una pieza nueva a `ui/`.
- **Sin conexión** (R1.6): gris con lo último que se vio en esta sesión de la aplicación, con
  «Reintentar»; sin nada visto, «Hace falta conexión» (E06, E07). No se guarda nada en el dispositivo.
- **Sin precios** (hasta el catálogo): el panel del redondeo muestra el ejemplo de la regla
  ($ 15.001 con el paso elegido) y «Todavía no hay precios» (§ 12, 1).

## 8. Seguridad

- **Qué datos toca:** cinco números del negocio, quién los cambió y la zona horaria. Nada personal más
  que el nombre de quien cambió cada uno, que ve cualquiera con sesión (R1.2: lo mismo que en Quién hizo
  qué ven quienes tienen ese permiso; acá es solo el último).
- **Quién puede hacer cada cosa:** verlos, cualquiera con sesión; cambiarlos, «Cambiar los ajustes»,
  controlado por el servidor en cada `PUT`, también en el que deshace.
- **Lo que entra de afuera:** la clave de la dirección se busca en la lista fija; el cuerpo se valida con
  el esquema del contrato (forma, tipo y valores de § 2) antes de la regla. Un valor fuera de la lista no
  llega a la base (E24, E37).
- **El abuso que se cuida:**
  - Acortar los tiempos de la sesión a lo mínimo deja a todos con sesiones de 15 minutos sin uso, pero no
    los deja afuera: es una decisión del negocio, queda en Quién hizo qué y se revierte.
  - Bajar los días del vínculo a 1 corta los vínculos de todos: lo mismo.
  - Cambiar el redondeo recalcula todos los precios: pide confirmación y es todo o nada (R3.5).
  - Quien pierde el permiso mientras tiene la pantalla abierta no puede guardar (E05): el permiso se mira
    en cada pedido.
- **Límite de pedidos:** el `PUT`, 30 por minuto por sesión (en el `settings.ts` del módulo), con el
  `limit` común; es una pantalla que se toca poco.
- **Secretos:** ninguno nuevo. `BUSINESS_TIME_ZONE` no es secreto.
- **Auditoría:** cada cambio con el valor anterior y el nuevo; los intentos sin permiso.

## 9. Metas de performance

- `GET /api/administration`: 1 consulta (los nombres); menos de 10 ms; unos 700 bytes comprimido.
- `GET /api/administration/rounding`: hoy 0 consultas. Con el catálogo, una consulta que cuenta por paso
  en la base (no en el servidor) y otra con los ejemplos: menos de 100 ms con 10.000 precios.
- `PUT`: 3 consultas en una transacción, más lo de quien recalcula en el redondeo; menos de 20 ms.
- Leer un ajuste desde otro módulo: de la memoria, sin consultas ni esperas.
- La cabecera suma unos 6 bytes por respuesta.
- La aplicación: el módulo se baja al abrirlo; unos 12 KB comprimido.
- Las pruebas cuentan las consultas de cada ruta.

## 10. Pruebas

| Escenarios | Prueba |
|---|---|
| E01, E02, E04, E06, E07 | La pantalla con el servidor de mentira: con y sin permiso, sin conexión; el permiso nuevo en el rol Administrador al arrancar |
| E03, E05 | La ruta sin el permiso: `403`, nada cambia, queda el intento |
| E08, E14 | La cabecera `a` cambia con un ajuste; la pantalla a la vista vuelve a pedir, cerrada no |
| E09 a E11 | Guardar, la auditoría con el antes y el después, deshacer como otro cambio |
| E12, E13 | Dos `PUT` con la misma versión: el segundo da `409 changed` con el valor de ahora; con claves distintas, los dos pasan |
| E15 a E17 | La regla del redondeo, en `src/shared/` (la va a usar el catálogo) |
| E18 a E24 | El `PUT` del redondeo con un recalculador de mentira: pide confirmar, aplica, cancela, sin cambios guarda solo, falla y deshace todo, paso inválido |
| E25 a E29 | El `PUT` de los márgenes: orden, repetidos, rangos |
| E30, E31 | La zona horaria en la pantalla, con 24 horas y a. m./p. m.; `BUSINESS_TIME_ZONE` inválida no arranca |
| E32 a E37 | Los tiempos: opciones; una sesión vieja se cierra en su próximo pedido; subir el tope alarga la abierta (con el reloj de mentira) |
| E38 a E40 | Los días: rango; al bajarlos, la limpieza corre y anota los vínculos vencidos; al subirlos, siguen |
| Capturas | La pantalla en la computadora y en el celular, con el panel de cada ajuste, la confirmación y sin permiso |

## 11. Tareas

1. **Código común** (tomarlo antes): el contrato de los ajustes, el permiso, la auditoría, la zona
   horaria que se fija al arrancar y `BUSINESS_TIME_ZONE`.
2. **El servidor de `administration`:** la migración, la memoria, las rutas, el evento y el
   recalculador vacío. Depende de 1.
3. `[P]` **`sign-in`** lee los tiempos de la fachada; la cookie con el tope más largo; la zona en
   `/api/start`. Depende de 2.
4. `[P]` **`device-link`** lee los días de la fachada y limpia al cambiar. Depende de 2.
5. **La aplicación:** la zona desde `/api/start`, el módulo y la pantalla, la cabecera `a`. Depende de 3.
6. Las capturas, las de punta a punta (§ 12, 3), los documentos (`mobile-data.md`, la arquitectura, el
   `.env.example`, qué necesita internet), las revisiones (paso 7) y el manual (paso 9).

## 12. Para que decida Carlos

1. **El redondeo sin precios:** hasta que exista el catálogo no hay precios para mostrar. Propongo que el
   panel muestre el ejemplo de la regla con el paso elegido y diga «Todavía no hay precios».
2. **El avance del recálculo** («1.263 de 1.650») se programa con el catálogo: antes, sin precios, el
   cambio es instantáneo y no habría con qué probarlo.
3. **Una prueba de punta a punta:** un Administrador baja el tiempo sin uso y la sesión de otro
   dispositivo, ya pasada, termina en su próximo pedido (E33). Una unitaria no alcanza porque el corte lo
   hace el servidor de verdad con la cookie y la entrada que aparece encima en el navegador.
4. **Un pedido automático nuevo** para `mobile-data.md`: con Administración a la vista, si otro cambia un
   ajuste, la pantalla vuelve a pedir los ajustes (unos 700 bytes, una vez por cambio).
