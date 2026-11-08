# Diseño técnico · 06 · Administración (`administration`), etapa a: ajustes para todos

Implementa la etapa a del [capítulo 06](../../chapters/06-administration/rules.md): R1 a R7, con sus
escenarios E01 a E40, y lo que trae en 00 · R8.4, 01 · R3.2 y 03 · R2.2. La pantalla aprobada es
[`mockups/administration-settings/final/`](../../design/mockups/administration-settings/final/).
Corregido con sus dos revisiones ([diseño](administration-design-review.md),
[seguridad](administration-security-review.md)); lo que decidió Carlos está en § 12.

## 1. La idea técnica

- **Un ajuste es una fila con su versión.** Los ajustes viven en una tabla de clave y valor, cada uno con
  su número de versión. Cambiar uno manda la versión que se vio, y la base lo escribe solo si sigue
  siendo esa, en una sola sentencia: si otro lo cambió antes, no se pisa (R2.3), y dos ajustes distintos
  se guardan sin chocar (E13).
- **La lista de ajustes es fija y la comparten el servidor y la aplicación,** como los permisos:
  `src/shared/contracts/administration.ts` dice de cada ajuste su clave, su grupo, su valor de arranque y
  sus opciones o su rango. Un capítulo nuevo suma sus filas (R1.3).
- **Los ajustes están en la memoria del servidor.** Se cargan y se validan al arrancar, y se actualizan
  en el mismo pedido que los cambia, apenas confirma. Quien los usa los lee de la fachada sin consultar la
  base: `sign-in` en cada pedido y en cada latido, y `device-link` en cada contacto. Así un cambio vale en
  el próximo pedido de cualquier dispositivo (R2.4, R6.3, R7.3).
- **`administration` no conoce a quien lo usa.** `sign-in` y `device-link` reciben su fachada al
  registrarse, en `server/modules.ts`, como reciben hoy la de otros módulos. `administration` no importa
  a ninguno de los dos.
- **El redondeo recalcula precios que son del catálogo**, que todavía no existe. `administration` define
  la forma de quien recalcula (`PriceRecalculator`: contar cuántos precios cambian, dar ejemplos y aplicar
  dentro de una transacción) y el catálogo se la pasa al crearse. Hasta 07 no hay nadie: no hay precios,
  no cambia ninguno y se guarda sin preguntar (E21). Las pruebas de E18 a E22 usan uno de mentira.
- **La zona horaria sale de la configuración del servidor** (`BUSINESS_TIME_ZONE`, R5), fijada en el
  compose junto a `TRUSTED_PROXY`: es la misma en pruebas y en producción, así que no va en el `.env`
  (constitución, VIII). La aplicación la recibe en `/api/start` y la guarda en el dispositivo para
  usarla sin conexión.

## 2. Entidades

### `administration.settings` (nueva, migración `001-settings`)

| Columna | Tipo | Para qué |
|---|---|---|
| `key` | `text`, clave | El ajuste: `roundingStep`, `quickMargins`, `sessionIdle`, `sessionMax`, `pairingDays` |
| `value` | `jsonb`, `not null` | Su valor, con la forma que dice el contrato |
| `version` | `integer`, `not null` | Sube en 1 con cada cambio (R2.3) |
| `changed_by` | `uuid`, `not null` | Quién lo cambió por última vez, para «Lo cambió <persona> recién» |

- **Los valores de arranque no están en la tabla:** están en el contrato. Una clave sin fila vale lo de
  arranque, con versión 0; el primer cambio inserta la fila. Así un ajuste nuevo de otro capítulo no
  necesita migración.
- **Guardar es una sola sentencia:** `insert … on conflict (key) do update … where settings.version =
  <la que se vio> returning version`. Sin fila y con versión 0, inserta; con la fila y la versión que se
  vio, actualiza; si no devuelve nada, otro cambió antes y da `409 setting-changed`. Dos primeros cambios a la
  vez no chocan al insertar: el segundo no devuelve nada.
- **Sin índices más que la clave:** son cinco filas.
- **Cuándo cambió y la historia** están en la auditoría, no acá (constitución, V).

### Los ajustes

| Clave | Valor | Arranque | Valida |
|---|---|---|---|
| `roundingStep` | Entero en pesos; 0 es «sin redondeo» | 1000 | Uno de 0, 10, 50, 100, 500, 1000, 5000 (R3.2) |
| `quickMargins` | Cinco enteros | [300, 200, 100, 50, 25] | Cinco, de 1 a 10.000, sin repetirse; el servidor los guarda ordenados de mayor a menor (R4.2) |
| `sessionIdle` | Minutos | 60 | Uno de 15, 30, 60, 120 (R6.2) |
| `sessionMax` | Horas | 8 | Uno de 4, 8, 12, 24 (R6.2) |
| `pairingDays` | Días | 30 | Entero de 1 a 365 (R7.2) |

**Al arrancar** se leen todas las filas y cada valor se valida con el contrato. Si la lectura falla o un
valor no es válido (una opción que se sacó del contrato, una fila tocada a mano), **el servidor no
arranca** y dice cuál: arrancar con lo de arranque alargaría en silencio lo que bajó un Administrador.

## 3. API

Formas y errores en `src/shared/contracts/administration.ts`. Todas piden sesión y van por `POST` o
`GET`, como el resto de la API.

| Ruta | Qué hace | Permiso | Consultas |
|---|---|---|---|
| `GET /api/administration` | Los ajustes con su valor y su versión, y la zona horaria del negocio | Ninguno (R1.2) | 0: salen de la memoria |
| `GET /api/administration/rounding` | Para el panel del redondeo: cuántos precios hay, cuántos cambian con cada paso y hasta cinco ejemplos | Ninguno | Las de quien recalcula; hoy, 0 |
| `POST /api/administration/settings/:key` | `{ value, version, confirmed? }`. Cambia un ajuste | «Cambiar los ajustes» | Ver § 9 |

- **El orden del `POST`:** sesión, permiso, clave, cuerpo. La clave se busca en un `Map` de la lista del
  contrato (`constructor` o `__proto__` no son claves). El cuerpo se valida estricto: sin campos de más,
  `version` entera de 0 a 2.147.483.647 y `value` con la forma de esa clave.
- **Si puede cambiarlos** la pantalla lo sabe por los permisos de la sesión (`can`), que ya tiene y que se
  ponen al día solos cuando cambian (02 · R7.8). El `GET` no lo dice.
- **Quién lo tiene** (R1.2, E02): la pantalla usa la ruta que ya existe, `GET
  /api/permissions/:permission/holders` (diseño de 02).
- **Errores del `POST`:**
  - `403 forbidden`, con el permiso, como cualquier ruta (R1.5, E03, E05).
  - `404`: una clave que no está en la lista.
  - `400 invalid-setting`, con el rango o las opciones: un valor que no cumple § 2 (R2.2, E24, E27, E28, E37,
    E38).
  - `409 setting-changed`, con el valor y la versión de ahora y el nombre de quien lo cambió (R2.3, E12): una
    consulta, solo en este caso.
  - `409 confirm-prices`, con cuántos precios cambian: un `roundingStep` que cambia precios, sin
    `confirmed` o con un número distinto del de ahora (R3.4, E18, E41). `confirmed` es **el número que se
    vio**: si ya no es el de ahora (alguien cambió costos en el medio), se vuelve a preguntar con el
    número nuevo.
  - `503 recalc-failed`: falló el recálculo; no cambió nada (R3.5, E22). Queda en el registro del
    servidor con su error.
- **Deshacer** (R2.1) no es una ruta: es otro `POST` con el valor anterior y la versión que devolvió el
  cambio. Un cambio nuevo del mismo ajuste reemplaza el aviso, y «Deshacer» es siempre el del último:
  así nunca lleva una versión vieja propia.
- **`/api/start`** suma `businessTimeZone`, con o sin sesión (la entrada también muestra horas).

## 4. Eventos y auditoría

- **En Quién hizo qué,** grupo nuevo «Administración»: `settings.changed`, «Cambió <ajuste>», con el
  valor anterior y el nuevo (R2.5, E09), y en el redondeo, cuántos precios cambiaron (E19). Deshacer
  queda como otro cambio (E10).
- **Rechazos:** sin permiso, el `permission.denied` que ya anota la plataforma una vez por minuto (E03).
  Los `400` y `409` no se anotan: son errores de quien tiene el permiso, que la pantalla ya muestra.
- **Sin eventos entre módulos.** La memoria se actualiza en el mismo pedido. Los vínculos vencidos se
  terminan en su próximo contacto (§ 5), así que `device-link` no necesita enterarse del cambio.

## 5. Dónde vive cada cosa

### El servidor, `src/server/modules/administration/`

| Archivo | Qué hace |
|---|---|
| `index.ts` | La fachada: `settings()` (los valores de ahora, sin esperar), el registro de las rutas y el `PriceRecalculator` que recibe al crearse |
| `routes.ts` | Las tres rutas |
| `rules.ts` | Validar un valor contra el contrato, ordenar los márgenes, decidir si hace falta confirmar |
| `data.ts` | Leer todas las filas y guardar una con su versión |
| `memory.ts` | Los valores en memoria: se cargan al arrancar y se reemplazan solo con una versión mayor |
| `migrations/001-settings.ts` | La tabla |

### Lo que cambia en otros módulos

- **`sign-in`:**
  - `closedReasonOf`, `isOpen`, la limpieza diaria y las listas de sesiones abiertas leen los dos tiempos
    de la fachada de `administration` en lugar de su `settings.ts` (01 · R3.2).
  - La cookie de la sesión dura lo que la opción más larga de `sessionMax` en el contrato (hoy, 24 horas):
    el servidor es quien cierra la sesión. Si la cookie durara el tope de ese momento, subir el tope no
    alargaría las sesiones abiertas (E36).
  - `/api/start` suma `businessTimeZone`.
- **`device-link`:**
  - `viewOf`, la limpieza diaria y la comprobación de cada contacto (`pairingOf`, `stillPaired`) leen
    `pairingDays` de la fachada.
  - **En cada contacto,** si `mirroredAt + días` ya pasó, el vínculo se termina como vencido, por el mismo
    camino que la limpieza (03 · R2.3, R7.3, E39). Así un vínculo no vive más que su plazo, también con
    1 día.
  - Antes de limpiar, la limpieza escribe lo espejado que quedó en memoria, como hace `sign-in`.
- **`users`:** nada; el permiso nuevo se le suma solo al rol Administrador al arrancar (02 · R7.4).

### Código común

- `src/shared/contracts/administration.ts`: la lista de ajustes, sus formas y sus errores.
- `src/shared/contracts/permissions.ts`: el grupo `administration` y el permiso `settings.change`,
  «Cambiar los ajustes».
- `src/shared/audit-log/administration.ts`: cómo se ve `settings.changed` en Quién hizo qué.
- `src/shared/pricing/rounding.ts`: el redondeo para arriba al paso (E15 a E17). Lo usan el panel (los
  ejemplos) y, con 07, el catálogo.
- `src/shared/time/business.ts`: la zona deja de estar escrita. `businessTimeZone()` es una función, y los
  formatos se arman la primera vez que se usan con la zona de ese momento. Los archivos que hoy copian la
  zona al cargarse (`app/platform/time.ts`, `sign-in/offline/when.ts`, `audit-log/logic.ts`, el detalle
  del vínculo) la piden a la función. `setBusinessTimeZone(zone)` la fija: en el servidor, una sola vez al
  arrancar (una segunda vez es un error).
- `src/server/platform/config.ts`: `BUSINESS_TIME_ZONE`, obligatoria y sin valor por omisión
  (constitución, VIII), validada armando un `Intl.DateTimeFormat` con ella (la lista de
  `Intl.supportedValuesOf` no trae `America/Argentina/Buenos_Aires`). Va en `deploy/compose.yml`, en
  `src/server/testing/config.ts` y en `tests/e2e/stack/start.ts`.

### La aplicación

- **La zona:** al recibir `/api/start`, `setBusinessTimeZone` y se guarda en `localStorage` (no es del
  negocio ni secreta; se suma a la lista de la arquitectura). Al arrancar, sin conexión, se usa la
  guardada. Sin ninguna (la primera vez, sin conexión), la del navegador, que en el local es la misma.
- **`src/app/modules/administration/`:**

| Archivo | Qué hace |
|---|---|
| `index.ts` | La opción de Más (ya está en el menú, sin dirección: se le suma) |
| `api.ts` | Las tres llamadas |
| `texts.ts` | Los textos, largos en la computadora y cortos en el celular |
| `useAdministration.ts` | Los ajustes, el ajuste elegido, guardar, deshacer, el choque con otro, la confirmación |
| `preview.ts` | Lo que muestra cada opción antes de tocarla (el día de mostrador, el calendario del vínculo): cuentas puras, sin pedidos |
| `screens/Administration/` | La lista, el panel del ajuste elegido y la confirmación, con su CSS |

## 6. Conexiones

- **Solo `request`.** Sin campos nuevos en la cabecera ni canales: la pantalla pide los ajustes al abrirse
  y al guardar recibe el valor nuevo; si otro cambió algo mientras tanto, lo dice el `409` (R2.3). Ningún
  pedido automático nuevo.
- **El avance del recálculo** («1.263 de 1.650») usa el canal `temporary` y se programa con el catálogo,
  que es cuando hay precios para recalcular (§ 12, 2).

## 7. Pantallas

- **Lo que viene del servidor** se pide con `useMirroredQuery`. Lo guardado entra en lo que trajo el
  servidor (`update`), que viaja como cualquier valor con nombre, también por el servidor: así el otro
  dispositivo vinculado ve el cambio (E08).
- **Valores con nombre,** espejados: el ajuste elegido, la confirmación del redondeo abierta y lo que se
  dice en el lugar de un ajuste (un valor que no vale, «Lo cambió <persona> recién»).
- **Local:** la opción sobre la que se pasa con el mouse (es del dispositivo que tiene el mouse) y el
  cursor.
- **Cuándo se guarda:** una opción, al tocarla; lo escrito (los márgenes, los días), al salir de la caja
  o con Enter; el deslizador de los días, al soltarlo. Antes de mandar, la pantalla valida con el
  contrato y dice en el lugar lo que no vale (E28, E38).
- **Teclas:** Alt más la del ajuste en la lista (R, M, Z, S, T, V) y ← → para sus opciones (R1.8); D
  deshacer; en la confirmación, P «Cambiar N precios» y C «Cancelar»; cuando falla el recálculo, A «Ahora
  no» y R «Reintentar». Se declaran con los atributos de `platform/keyboard`.
- **La hora del negocio** (R5.1) sale del reloj del servidor que ya tiene la aplicación
  (`platform/server/clock.ts`) en la zona del negocio y se mueve sola cada minuto, sin pedidos.
- **Piezas:** las de `ui/` (Toast con su acción, Dialog, LoadState, Offline). Los botones de opciones
  usan el estilo de los de Configuración; no se suma una pieza nueva a `ui/`.
- **Sin el permiso** (E02, E05): todo se ve y nada se toca. Si lo pierde con la pantalla abierta, la
  pantalla se pone así con los permisos nuevos.
- **Sin conexión** (R1.6): gris con lo último que se vio en esta sesión de la aplicación, con
  «Reintentar»; sin nada visto, «Hace falta conexión» (E06, E07). No se guarda nada en el dispositivo.
- **Sin precios** (hasta el catálogo): el panel del redondeo muestra el ejemplo de la regla
  ($ 15.001 con el paso elegido) y «Todavía no hay precios» (§ 12, 1).

## 8. Seguridad

- **Qué datos toca:** cinco números del negocio y la zona horaria. El nombre de quien cambió un ajuste
  sale solo en el `409`, a quien tiene el permiso y acaba de chocar con él.
- **Quién puede hacer cada cosa:** verlos, cualquiera con sesión; cambiarlos, «Cambiar los ajustes»,
  controlado por el servidor en cada `POST`, también en el que deshace.
- **Lo que entra de afuera:** la clave, buscada en un `Map` de la lista fija; el cuerpo, validado
  estricto con el esquema del contrato antes de la regla. Un valor fuera de la lista o del rango no llega
  a la base (E24, E37). Contra pedidos desde otros sitios, el control de `Origin` y la cookie
  `SameSite=Strict` que ya tiene la plataforma.
- **Lo guardado también se valida,** al arrancar (§ 2): un valor que no es un número no puede dejar
  sesiones que nunca vencen.
- **El abuso que se cuida:**
  - Acortar los tiempos o los días al mínimo deja sesiones cortas y corta vínculos, pero no deja a nadie
    afuera: las opciones son cerradas, queda en Quién hizo qué y se revierte.
  - **Riesgo aceptado:** subir los tiempos alarga también una sesión robada que siga abierta. Es lo que
    pide R6.3 (vale para las abiertas) y queda en Quién hizo qué.
  - Cambiar el redondeo recalcula todos los precios: pide confirmar el número y es todo o nada (R3.5). Con
    07 se le pone un límite propio más bajo al recálculo y al `GET` de sus números.
  - Quien pierde el permiso con la pantalla abierta no puede guardar (E05): el permiso se mira en cada
    pedido.
- **Límite de pedidos:** el `POST`, con el `limit` por sesión que ya existe, 30 por minuto (en el
  `settings.ts` del módulo); es una pantalla que se toca poco.
- **Secretos:** ninguno nuevo. `BUSINESS_TIME_ZONE` no es secreto.
- **Auditoría:** cada cambio con el valor anterior y el nuevo; los intentos sin permiso. Cambiar la zona en
  la configuración no queda en la auditoría: lo aceptó Carlos (§ 12, 5).

## 9. Metas de performance

- `GET /api/administration`: 0 consultas; menos de 5 ms; unos 500 bytes comprimido.
- `GET /api/administration/rounding`: hoy 0 consultas. Con el catálogo, una consulta que cuenta por paso
  en la base y otra con los ejemplos: menos de 100 ms con 10.000 precios.
- `POST` de un ajuste que no es el redondeo: una sentencia en PostgreSQL (abrir y confirmar aparte), la
  auditoría en SQLite y, solo en un `409 setting-changed`, el nombre (1 más). Menos de 20 ms.
- `POST` del redondeo: lo anterior, en la transacción, más lo de quien recalcula. La meta del recálculo
  se fija con 07.
- Al arrancar: 1 consulta para cargar los ajustes.
- Leer un ajuste desde otro módulo: de la memoria, sin consultas ni esperas.
- La aplicación: el módulo se baja al abrirlo; unos 12 KB comprimido. `/api/start` suma unos 40 bytes.
- Las pruebas cuentan las consultas de cada ruta.

## 10. Pruebas

| Escenarios | Prueba |
|---|---|
| E01, E02, E04, E06, E07 | La pantalla con el servidor de mentira: con y sin permiso, sin conexión; el permiso nuevo en el rol Administrador al arrancar |
| E03, E05 | La ruta sin el permiso: `403`, nada cambia, queda el intento; la pantalla pierde el permiso y queda sin poder tocarse |
| E08 | Dos dispositivos vinculados, por el directo y por el servidor: el cambio en uno se ve en el otro |
| E09 a E11, E14 | Guardar, la auditoría con el antes y el después, deshacer como otro cambio, dos cambios seguidos; otra pantalla no pide nada |
| E12, E13 | Dos `POST` con la misma versión, también desde los valores de arranque: el segundo da `409 setting-changed` con el valor de ahora; con claves distintas, los dos pasan |
| E15 a E17 | La regla del redondeo, en `src/shared/pricing/` |
| E18 a E24, E41 | El `POST` del redondeo con un recalculador de mentira: pide confirmar el número, vuelve a pedir si cambió, aplica, cancela, sin cambios guarda solo, falla y no cambia nada, paso inválido |
| E25 a E29 | El `POST` de los márgenes: orden, repetidos, rangos |
| E30, E31 | La zona en la pantalla, con 24 horas y a. m./p. m.; `BUSINESS_TIME_ZONE` inválida no arranca; la zona guardada se usa sin conexión |
| E32 a E37 | Los tiempos: opciones; una sesión vieja se cierra en su próximo pedido; subir el tope alarga la abierta (con el reloj de mentira) |
| E38 a E40 | Los días: rango; al bajarlos, el vínculo vencido se termina en su próximo contacto; al subirlos, sigue |
| Seguridad | Claves como `__proto__`; campos de más; un valor inválido guardado no deja arrancar |
| Capturas | La pantalla en la computadora y en el celular, con el panel de cada ajuste, la confirmación y sin permiso |

## 11. Tareas

1. **Código común** (tomarlo antes): el contrato de los ajustes, el permiso, la auditoría, el redondeo, la
   zona como función que se fija y `BUSINESS_TIME_ZONE`.
2. **El servidor de `administration`:** la migración, la carga y la validación al arrancar, la memoria y
   las rutas. Depende de 1.
3. `[P]` **`sign-in`** lee los tiempos de la fachada; la cookie con el tope más largo; la zona en
   `/api/start`. Depende de 2.
4. `[P]` **`device-link`** lee los días de la fachada, termina el vencido en cada contacto y escribe lo
   espejado antes de limpiar. Depende de 2.
5. **La aplicación:** la zona desde `/api/start` y guardada, el módulo y la pantalla. Depende de 3.
6. Las capturas, los documentos (la arquitectura:
   los ajustes en memoria en «Escala» y la zona en lo que se guarda en el dispositivo; `sign-in.md` y
   `device-link.md`, donde dicen «8 horas como mucho»; el `.env.example`), las revisiones (paso 7) y el
   manual (paso 9).

## 12. Lo que decidió Carlos

1. **El redondeo sin precios:** hasta que exista el catálogo, el panel muestra el ejemplo de la regla con
   el paso elegido y dice «Todavía no hay precios».
2. **El avance del recálculo** («1.263 de 1.650») se programa con el catálogo.
3. **Sin prueba de punta a punta de E33:** necesita que pasen al menos 15 minutos de verdad sin usar una
   sesión, y el servidor de las pruebas no deja adelantar su reloj. El corte lo prueban las unitarias
   contra el servidor de verdad, con el reloj de mentira (E33 a E36), sin navegador.
4. **Si cambió el número de precios** entre que se vio y se confirmó, se vuelve a preguntar con el número
   nuevo (R3.4, E41).
5. **La zona en la configuración queda así:** se fija al instalar y nadie la toca; cambiarla editando la
   configuración no queda en Quién hizo qué. Hoy es una sola ferretería, y quien puede editar el `.env` ya puede todo
   en el servidor.
