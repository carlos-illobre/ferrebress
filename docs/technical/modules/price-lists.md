# Diseño técnico · 08 · Listas de precios (`price-lists`), etapa a: la lista a mano

Implementa la etapa a del [capítulo 08](../../chapters/08-price-lists/rules.md): R1 a R9, con sus
escenarios E01 a E83 (y E29b a E31e), y lo que trae del [capítulo 06](../../chapters/06-administration/rules.md):
los tres ajustes de las listas (R8) y las anomalías (R9). Las pantallas son las de
[08](../../chapters/08-price-lists/screens.md) y las de Lectores y Anomalías de
[06](../../chapters/06-administration/screens.md). Cómo se abre una planilla y cómo corre un lector,
en el [ADR-021](../adr/ADR-021-reading-price-lists.md).

## 1. La idea técnica

- **Tres módulos del servidor, cada uno con su esquema:**
  - `price-lists`: los proveedores, cómo cobra cada uno, las listas con su archivo, los lectores y lo
    que cada proveedor trae (sus artículos, con su costo).
  - `catalog`: los productos. Nace chico, con lo que una lista crea y cambia (R7); el capítulo 07 le
    suma el margen, el precio, la búsqueda y la ficha. Es suyo porque el producto es del catálogo: un
    producto puede venir de varios proveedores cuando 07 los una (R7.1).
  - `anomalies`: las anomalías de cualquier capítulo (06 · R9). `price-lists` abre y cierra las suyas
    por su fachada.
- **Un producto y lo que trae cada proveedor son dos cosas.** `price_lists.items` es lo que un
  proveedor trae con un código (R7.1): su descripción, su precio de lista, su costo y de qué lista
  salió. `catalog.products` es el producto que se vende. Hoy cada artículo crea su producto (R7.2); un
  producto está activo mientras algún artículo activo lo traiga (R7.4).
- **Una lista pasa por estados** (R6.7) y cada cambio de estado es una sola sentencia que mira el
  estado de antes, así dos pedidos a la vez no chocan (R6.9):

  ```
  leyendo ──▶ en espera ──▶ aplicándose ──▶ aplicada
     │            │               │
     │            └──▶ descartada └──▶ en espera (falló o se cortó, con el motivo)
     └──▶ no se pudo leer ──▶ leyendo (llegó un lector que la entiende, R5.5)
     └──▶ descartada (se canceló, o llegó otra del mismo proveedor, R4.8, R4.11)
  ```

  Subir es de la aplicación: la lista existe en el servidor recién cuando su archivo llegó entero.
- **Leer es un trabajo aparte del pedido.** El pedido que sube guarda el archivo, crea la lista
  «leyendo» y contesta enseguida. La lectura corre en un hilo aparte (ADR-021): abre la planilla,
  deduce de quién es (R4.3), prueba los lectores (R5.2), comprueba el resultado (R5.4) y guarda las
  filas en la base de a tandas. El avance va por un tema del canal en tiempo real (§ 6).
- **Lo que cambia se calcula al mirarlo, no al leer.** La lista guarda lo que trajo cada fila (código,
  descripción, marca, precio de lista, IVA). Cuántos son nuevos, cuántos cambian, el costo nuevo y lo
  que hay que revisar se calculan en cada pedido contra lo de ahora: cómo cobra el proveedor, sus
  artículos y los ajustes de 06. Así una lista en espera muestra lo de hoy aunque en el medio cambien
  los descuentos (R3.5) o los porcentajes (06 · R8.4).
- **El costo se calcula en un solo lugar**, `src/shared/pricing/cost.ts`, igual en el servidor y en la
  aplicación: precio de lista, sin IVA si lo incluía, y cada descuento que le toca uno sobre otro
  (R3.3). Con enteros (millonésimos de peso), sin errores de coma flotante; no se redondea (R3.4) y la
  pantalla lo muestra con dos decimales. Devuelve el costo y sus pasos, para mostrar la cuenta.
- **El artículo guarda la base de su costo** (`basis`): el precio de lista, si incluía IVA, los
  descuentos que se aplicaron y la lista de la que salió. La cuenta del costo (R3.4) sale de ahí, aunque
  después cambie cómo cobra el proveedor con «Desde la próxima lista». Recalcular (R3.5) rehace el costo
  desde la misma base con la configuración nueva.
- **Aplicar es una transacción**, por tandas de 1.000 filas, con el avance por el mismo tema. Si se corta,
  no queda nada (R6.6); si el servidor se reinicia en el medio, al arrancar la lista vuelve a «en espera»
  con el motivo (E61).
- **El archivo original se guarda en la base,** en una tabla aparte, una vez por contenido (su SHA-256):
  subir el mismo archivo dos veces no lo guarda dos veces (E63). Es un solo lugar para la copia de
  seguridad y queda en la misma transacción que la lista. Con listas de 1 a 5 MB por semana y por
  proveedor, son unos cientos de MB por año.

## 2. Entidades

### `price_lists.suppliers` (migración `001-suppliers`)

| Columna | Tipo | Para qué |
|---|---|---|
| `id` | `uuid`, clave | UUID v7, lo genera quien lo crea |
| `name` | `text`, `not null` | El nombre como se escribió, de 1 a 80 letras |
| `name_key` | `text`, `not null`, único | El nombre sin acentos, sin mayúsculas y sin espacios de más (`plain`, `src/shared/text`): el nombre único de R2.1 y E10 |
| `seller`, `phone`, `email`, `note` | `text` | Los datos de R2.1, opcionales, hasta 80, 40, 120 y 500 letras |
| `vat_included` | `boolean`, `not null`, `false` | Si sus precios incluyen IVA (R3.2) |
| `discounts` | `jsonb`, `not null`, `[]` | En orden: `{ id, name, percent, brand }`; `percent` en milésimos, de 1 a 99.999; `brand` sin acentos ni mayúsculas, o `null` para todas (R3.2, E19) |
| `default_vat` | `smallint`, `not null`, `210` | En décimos: 210, 105 o 270 (R3.2) |
| `on_change` | `text`, `not null`, `'recalculate'` | `recalculate` o `next` (R3.5) |
| `active` | `boolean`, `not null`, `true` | Dado de baja o no (R2.4, R2.5) |
| `last_list_id`, `last_list_date` | `uuid`, `date` | La última lista aplicada, para la pantalla y para R6.10 |
| `version` | `integer`, `not null` | Sube con cada cambio: guardar manda la que vio (R1.7, como los ajustes de 06) |

- **El nombre es único entre todos, también los dados de baja:** dar de alta uno con el nombre de un
  dado de baja dice que existe y ofrece reactivarlo (§ 12).

### `price_lists.files` (migración `002-lists`)

| Columna | Tipo | Para qué |
|---|---|---|
| `sha256` | `bytea`, clave | El contenido, una sola vez |
| `bytes` | `bytea`, `not null` | El archivo tal como llegó |
| `size` | `integer`, `not null` | Su tamaño, para no leerlo al listar |

### `price_lists.lists` (migración `002-lists`)

| Columna | Tipo | Para qué |
|---|---|---|
| `id` | `uuid`, clave | UUID v7 |
| `supplier_id` | `uuid`, referencia, puede ser `null` | De quién es; `null` mientras no se sabe (R4.3) |
| `supplier_guess` | `text` | `reader`, `name` o `null`: cómo se dedujo, para decidir si se pregunta (R4.3) |
| `status` | `text`, `not null` | `reading`, `pending`, `applying`, `applied`, `discarded`, `unreadable` |
| `kind` | `text`, `not null`, `'full'` | `full` o `changes` (R4.7) |
| `file_sha256`, `file_name` | `bytea`, `text`, `not null` | Su archivo y el nombre con que se subió (R4.4, E40), hasta 200 letras |
| `list_date`, `date_from` | `date`, `text` | La fecha (R4.5) y de dónde salió: `sheet`, `file-name` o `server` |
| `reader_id`, `new_reader` | `uuid`, `boolean` | Quién la leyó y si es un lector nuevo (R5.7) |
| `rows_total`, `rows_read` | `integer` | El avance de la lectura, para quien llega en el medio |
| `reason` | `text` | Por qué no se pudo leer, por qué falló aplicar o por qué se descartó, como código del contrato |
| `result` | `jsonb` | Al aplicarse: cuántos se crearon, cambiaron de costo, se dieron de baja y volvieron (E60) |
| `uploaded_by`, `uploaded_at` | `uuid`, `timestamptz`, `not null` | Quién y cuándo (R6.7) |
| `decided_by`, `decided_at` | `uuid`, `timestamptz` | Quién la aplicó o la descartó, y cuándo |

- **Índices:** `(supplier_id, uploaded_at desc)`, para las listas de un proveedor (R6.7); y uno único
  parcial, `(supplier_id) where status in ('reading', 'pending', 'applying')`: la base asegura una sola
  lista viva por proveedor (R4.8). Subir otra del mismo proveedor descarta la anterior en la misma
  transacción que crea la nueva.

### `price_lists.list_rows` (migración `002-lists`)

Lo que trajo cada fila de una lista leída, para mostrarla y aplicarla sin volver a leer el archivo.

| Columna | Tipo | Para qué |
|---|---|---|
| `list_id` | `uuid` | Su lista |
| `sheet`, `row` | `smallint`, `integer` | Dónde estaba, para la fila salteada (R9.2) |
| `code` | `text` | El código, hasta 60 letras |
| `description`, `brand`, `barcode` | `text` | Hasta 300, 80 y 40 letras |
| `list_price` | `bigint` | En millonésimos de peso; `null` en una fila salteada |
| `vat` | `smallint` | En décimos, si la lista lo dice |
| `skipped` | `text` | El motivo, si es una fila salteada (R5.4): `no-code`, `no-price`, `zero-price`, `not-a-number`, `repeated-code`, `other-currency` |
| `cells` | `jsonb` | Lo que traía una fila salteada, como texto, para mostrarla (R6.2, R9.2) |

- **Clave:** `(list_id, sheet, row)`. **Índice:** `(list_id, code)`, para cruzar con los artículos.
- **Una lista descartada o aplicada borra sus filas** al día siguiente (constitución, V): lo que quedó
  está en los artículos y en la auditoría. La de una lista aplicada se guarda mientras haya una anomalía
  de filas salteadas abierta de esa lista (R9.2).

### `price_lists.items` (migración `003-items`)

Lo que trae cada proveedor (R7.1), con su costo.

| Columna | Tipo | Para qué |
|---|---|---|
| `supplier_id`, `code` | `uuid`, `text`, clave | El artículo de un proveedor (R7.1, E70) |
| `product_id` | `uuid`, `not null` | Su producto en `catalog` |
| `description`, `brand`, `barcode` | `text` | Lo último que dijo la lista (R7.3) |
| `vat` | `smallint` | Lo que dijo la lista, o el de arranque del proveedor (R3.6) |
| `cost` | `bigint`, `not null` | En millonésimos, sin redondear (R3.4) |
| `basis` | `jsonb`, `not null` | Precio de lista, IVA incluido o no, descuentos aplicados y la lista con su fecha: la cuenta (R3.4) |
| `list_id` | `uuid`, `not null` | La última lista que lo trajo |
| `active` | `boolean`, `not null` | Si su última lista completa lo trajo (R7.4) |
| `gone_list_id` | `uuid` | Desde qué lista dejó de venir (R8.2) |

- **Índices:** `(supplier_id, active, description_key)`, para la lista alfabética de R8.1 con su paginado
  por posición; y `(product_id)`, para saber si un producto tiene otro proveedor (R7.4).
- **Buscar** (R8.1, E79) mira `code` y `description_key` (sin acentos ni mayúsculas) de un solo
  proveedor: como mucho unos miles de filas, sin índice de texto.

### `price_lists.readers` (migración `004-readers`)

| Columna | Tipo | Para qué |
|---|---|---|
| `id` | `uuid`, clave | UUID v7 |
| `supplier_id` | `uuid` | De qué proveedor (R5.1) |
| `origin` | `text`, `not null` | `programmer`, `automatic` o `ai` (R5.8; `ai` es de la etapa b) |
| `code` | `text`, `not null` | El lector, en JavaScript (ADR-021), hasta 200 KB |
| `file_key` | `text`, único | El de un programador: su archivo en el repositorio, para copiarlo al arrancar |
| `active` | `boolean`, `not null` | Desactivado en Administración → Lectores (R5.8) |
| `pending_list_id` | `uuid` | La lista que lo creó, mientras no se aplica (R5.7): no se usa para otras |
| `proof_list_id` | `uuid` | La lista que lo dejó activo, su prueba (R5.7) |
| `last_list_id`, `created_at` | `uuid`, `timestamptz` | Lo que muestra Lectores (R5.8) |

### `catalog.products` (migración `001-products` de `catalog`)

| Columna | Tipo | Para qué |
|---|---|---|
| `id` | `uuid`, clave | UUID v7 |
| `description`, `brand`, `barcode` | `text` | Los de su artículo (07 decide cuál, cuando un producto tenga varios) |
| `unit` | `text`, `not null`, `'un.'` | R7.2 |
| `unit_manual`, `vat_manual` | `boolean`, `not null`, `false` | Cambiados a mano en 07: ninguna lista los toca (R3.6, R7.3, E28, E72) |
| `vat` | `smallint`, `not null` | En décimos |
| `margin` | `integer` | `null` hasta que 07 le ponga uno (R7.2); se conserva al darse de baja (R7.5, E76) |
| `active` | `boolean`, `not null` | Dado de baja si ningún artículo activo lo trae (R7.4) |

`catalog` no tiene pantallas ni rutas en esta etapa: solo su fachada, que usa `price-lists` dentro de la
transacción de aplicar (ADR-001).

### `anomalies.anomalies` (migración `001-anomalies` de `anomalies`)

| Columna | Tipo | Para qué |
|---|---|---|
| `id` | `uuid`, clave | UUID v7 |
| `kind` | `text`, `not null` | `price-list-unreadable` o `price-list-skipped-rows` (08 · R9.2) |
| `subject` | `text`, `not null` | A qué se refiere, con el módulo adelante (`price-lists:list:<id>`): para cerrarla sola y para el enlace |
| `status` | `text`, `not null` | `open`, `reviewed` o `closed` (06 · R9.4) |
| `summary` | `jsonb`, `not null` | Lo que se muestra: el proveedor, el archivo, el motivo, las filas (06 · R9.2) |
| `opened_at`, `reviewed_by`, `reviewed_at`, `note`, `closed_at` | | Cuándo, quién, la nota (hasta 500 letras) |

- **Índices:** `(status, opened_at desc)`, para la pantalla y la cuenta; y uno único parcial,
  `(kind, subject) where status <> 'closed'`: una sola abierta por cosa.

### Los ajustes de 06 (sin migración)

Tres filas nuevas en la lista de ajustes del contrato de `administration` (06 · R8):
`reviewPercent` (1 a 1.000, 50), `goneWarnPercent` (1 a 100, 20) y `maxFileMb` (1 a 100, 30).

## 3. API

Formas y errores en `src/shared/contracts/price-lists.ts` y `anomalies.ts`. Todas piden sesión (E06).
Los permisos nuevos, en el grupo «Catálogo»: `price-lists.costs` («Ver costos»),
`price-lists.suppliers` («Administrar proveedores», incluye «Ver costos») y `price-lists.load` («Cargar
listas», incluye «Ver costos») (R1.2, E03); en «Administración», `anomalies.review` («Revisar las
anomalías», 06 · R9.3).

### Los proveedores

| Ruta | Qué hace | Permiso | Consultas |
|---|---|---|---|
| `GET /api/price-lists/suppliers` | Los proveedores activos con sus datos (R1.3); con «Ver costos», también la fecha de la última lista y su estado pendiente (R1.1) | Ninguno | 1, o 2 con «Ver costos» |
| `GET /api/price-lists/suppliers/inactive` | Los dados de baja (R2.5) | «Administrar proveedores» | 1 |
| `GET /api/price-lists/suppliers/:id` | Sus datos; con «Ver costos», cómo cobra y sus listas (R2.3, R6.7) | Ninguno o «Ver costos» | 1 o 2 |
| `POST /api/price-lists/suppliers` | `{ name, seller?, phone?, email?, note? }`: da de alta (R2.2) | «Administrar proveedores» o «Cargar listas» | 1 |
| `POST /api/price-lists/suppliers/:id` | `{ field, value, version }`: cambia un dato (R1.7) | «Administrar proveedores» | 1 |
| `POST /api/price-lists/suppliers/:id/pricing` | `{ pricing, version, confirmed? }`: cambia cómo cobra (R3.5) | «Administrar proveedores» | Ver § 9 |
| `POST /api/price-lists/suppliers/:id/deactivate` | `{ confirmed? }`: lo da de baja (R2.4) | «Administrar proveedores» | Ver § 9 |
| `POST /api/price-lists/suppliers/:id/reactivate` | Lo reactiva (R2.5) | «Administrar proveedores» | 1 |
| `GET /api/price-lists/suppliers/:id/items` | `?q=&gone=&after=`: sus artículos, de a 50 (R8) | «Ver costos» | 1 |

- **Cómo cobra** va entero (`pricing`: IVA incluido, descuentos, IVA de arranque, qué pasa al
  cambiar), con la versión que se vio. Si cambia costos con «Recalcular», sin `confirmed` o con un número
  distinto del de ahora, contesta `409 confirm-costs` con cuántos cambian (R3.5, E21); `confirmed` es
  ese número. Guardar y recalcular son una sola transacción (E25).
- **Dar de baja** contesta primero `409 confirm-deactivate` con cuántos artículos pierden su costo y
  cuántos productos quedan dados de baja (R2.4, E12); con `confirmed` igual a esos números, lo hace.
  Con una lista aplicándose, `409 list-applying` (R2.6, E15).
- **Deshacer** (R1.7) es otro cambio con el valor de antes, como en 06.

### Las listas

| Ruta | Qué hace | Permiso | Consultas |
|---|---|---|---|
| `POST /api/price-lists/lists` | El archivo, con `supplierId?` y `kind`: crea la lista y empieza a leerla (R4.1) | «Cargar listas» | 3: el archivo, la lista anterior y la nueva |
| `GET /api/price-lists/lists/:id` | El estado, de quién es y cómo se dedujo, el resumen y los números del botón (R6.2, R6.5) | «Ver costos» | 3 |
| `GET /api/price-lists/lists/:id/rows` | `?show=&q=&after=`: el detalle, de a 50, los que cambian primero (R6.3); `show` filtra por lo que tocó el resumen o «para revisar» (R6.4); también las salteadas | «Ver costos» | 2 |
| `POST /api/price-lists/lists/:id/supplier` | `{ supplierId }` o `{ newSupplier }`: confirma o cambia de quién es; si cambia, la vuelve a leer (R4.3, E29c, E31) | «Cargar listas» | 2 o 3 |
| `POST /api/price-lists/lists/:id/kind` | `{ kind }` (R4.7) | «Cargar listas» | 1 |
| `POST /api/price-lists/lists/:id/cancel` | La cancela mientras se lee (R4.11, E31e) | «Cargar listas» | 1 |
| `POST /api/price-lists/lists/:id/apply` | `{ expected }`: la aplica (R6.5, R6.6) | «Cargar listas» | Ver § 9 |
| `POST /api/price-lists/lists/:id/discard` | La descarta (R6.11) | «Cargar listas» | 2 |
| `GET /api/price-lists/lists/:id/file` | El archivo original (R4.4, E40) | «Ver costos» | 1 |

- **Subir:** el cuerpo es `multipart/form-data`. Antes de leer nada se mira `Content-Length` contra el
  tamaño máximo (06 · R8.3) y se corta al pasarlo mientras llega; la extensión y los primeros bytes
  tienen que ser de `.xlsx`, `.xls` o CSV. Si no, `413 file-too-large` o `415 file-format`, sin guardar
  nada (R4.2, E33, E34, E04).
- **Aplicar** manda los números que vio el botón (`expected`: nuevos, costos, bajas). Si ya no son los
  de ahora, `409 numbers-changed` con los nuevos, para volver a mirar. Si otra persona ya la está
  aplicando o la aplicó, `409 list-applying` o `409 list-applied` (R6.9, E62, E64); si es anterior a la
  última aplicada, `409 list-too-old` (R6.10, E65). Contesta enseguida con `202`: el avance y el
  resultado llegan por el tema (§ 6).
- **El archivo** sale con `Content-Disposition: attachment` y el nombre original escrito según RFC
  6266 (`filename*=UTF-8''…`), `Content-Type: application/octet-stream` y `X-Content-Type-Options:
  nosniff`: el navegador lo baja, nunca lo abre (E68).

### Los lectores (Más → Administración → Lectores)

| Ruta | Qué hace | Permiso | Consultas |
|---|---|---|---|
| `GET /api/price-lists/readers` | Los lectores de cada proveedor, sin su código (R5.8) | Ninguno, como Administración | 1 |
| `POST /api/price-lists/readers/:id/active` | `{ active }` (R5.8, E50) | «Cambiar los ajustes» | 1 |

### Las anomalías (Más → Administración → Anomalías)

| Ruta | Qué hace | Permiso | Consultas |
|---|---|---|---|
| `GET /api/anomalies` | `?status=&kind=&after=`: de a 30, de la más nueva a la más vieja (06 · R9.2) | «Revisar las anomalías» | 1 |
| `POST /api/anomalies/:id/review` | `{ note? }` (06 · R9.4) | «Revisar las anomalías» | 1 |
| `POST /api/anomalies/:id/reopen` | La vuelve a abrir (06 · R9.4) | «Revisar las anomalías» | 1 |

- **Cuántas hay abiertas** (06 · R9.5) va en la cabecera de las respuestas (§ 6), sin ruta.

## 4. Eventos y auditoría

**A Quién hizo qué** (R9.1), grupo nuevo «Listas de precios»:

| Evento | Texto | Con |
|---|---|---|
| `suppliers.created` | «Dio de alta al proveedor <nombre>» | Sus datos |
| `suppliers.changed` | «Cambió <dato> de <proveedor>» | Lo anterior y lo nuevo (E11) |
| `suppliers.pricing-changed` | «Cambió cómo cobra <proveedor>» | Lo anterior, lo nuevo y cuántos costos cambiaron (E22) |
| `suppliers.deactivated`, `suppliers.reactivated` | «Dio de baja a…», «Reactivó a…» | Cuántos perdieron su costo y cuántos quedaron dados de baja |
| `lists.uploaded` | «Subió una lista de <proveedor>» | El archivo y su tipo |
| `lists.applied` | «Aplicó la lista de <proveedor> del <fecha>» | Sus números (E80) |
| `lists.discarded` | «Descartó la lista…» | Por qué: a mano, cancelada o reemplazada |
| `items.created`, `items.cost-changed`, `items.gone`, `items.back` | Uno por artículo | El costo anterior y el nuevo (R9.1, E71); el mismo costo no anota nada (E77) |
| `readers.activated`, `readers.deactivated` | «Desactivó el lector…» | El proveedor y de dónde salió (E50) |
| `anomalies.reviewed`, `anomalies.reopened` | «Marcó revisada…» | La nota (06 · R9.7) |

- **Los de cada artículo** se anotan en la misma tanda que los aplica, con el identificador de la lista:
  10.000 filas son 10.000 anotaciones, que la auditoría escribe por tandas (ADR-004).
- **Rechazos:** sin permiso, el `permission.denied` de la plataforma (R1.4, E04). Los `409` no se
  anotan: son de quien tiene el permiso y la pantalla los muestra.
- **Entre módulos:** `price-lists` abre y cierra anomalías por la fachada de `anomalies` dentro de su
  transacción (R9.2, E82); escucha `permissions.changed` para volver a mirar quién escucha el avance de
  una lista (§ 6).

## 5. Dónde vive cada cosa

### El servidor, `src/server/modules/price-lists/`

| Archivo | Qué hace |
|---|---|
| `index.ts` | La fachada y el registro: rutas, permisos, el tema del avance, al arrancar copia los lectores del repositorio y retoma lo cortado |
| `routes/suppliers.ts`, `routes/lists.ts`, `routes/readers.ts` | La entrada HTTP de cada parte |
| `rules/suppliers.ts` | Alta, cambios, baja y reactivar, con sus confirmaciones (R2) |
| `rules/pricing.ts` | Cambiar cómo cobra y cuántos costos cambia (R3.5) |
| `rules/review.ts` | Lo que cambia una lista, contra lo de ahora: el resumen, el detalle, «para revisar», los números del botón (R6.2 a R6.5) |
| `rules/apply.ts` | Qué crea, cambia, da de baja y trae de vuelta (R7), en tandas |
| `rules/check.ts` | La comprobación del resultado de un lector (R5.4), sin tecnología |
| `rules/deduce.ts` | De quién es y de qué fecha, por el nombre y las primeras filas (R4.3, R4.5) |
| `data/*.ts` | Las consultas, en lote, por tabla |
| `reading/pool.ts` | Los hilos de lectura: cuántos a la vez (2), la cola, cancelar y el tope de tiempo de cada uno |
| `reading/worker.ts` | Lo que corre en el hilo: abre la planilla con SheetJS, prueba los lectores en QuickJS y devuelve las filas (ADR-021) |
| `reading/automatic.ts` | El lector automático (R5.3): busca el encabezado y las columnas y arma un lector de la plantilla |
| `reading/template.js` | La plantilla del lector automático: un lector común, con los números de columna como datos |
| `readers/*.js` | Los lectores que escribe un programador, con sus pruebas y sus planillas de ejemplo (sin datos de proveedores reales: constitución, VIII) |
| `events.ts`, `migrations/`, `tables.generated.ts` | Como todo módulo |

### `catalog` y `anomalies`

- **`src/server/modules/catalog/`:** solo `index.ts` (la fachada: crear, actualizar, dar de baja y
  traer de vuelta productos en lote, dentro de una transacción ajena), `data.ts` y su migración.
- **`src/server/modules/anomalies/`:** `index.ts` (la fachada `open` y `close`, y el campo de la cabecera),
  `routes.ts`, `rules.ts`, `data.ts`, `events.ts` y su migración.

### Lo que cambia en otros módulos

- **`administration`:** tres ajustes más en su contrato (06 · R8). `price-lists` los lee de su
  fachada, de la memoria.
- **`users` (02):** los cuatro permisos nuevos y sus inclusiones (R1.2) en el contrato; el rol
  Administrador los suma solo (02 · R7.4).
- **`audit-log` (05):** el grupo «Listas de precios» y los textos de § 4.

### Código común

- **`src/shared/pricing/cost.ts`:** la cuenta del costo y sus pasos (R3.3, R3.4).
- **`src/shared/text/`:** `plain` ya existe; se usa para los nombres, las marcas y la búsqueda.
- **`src/server/platform/upload.ts`:** leer un archivo de un `multipart` con tope de tamaño mientras
  llega, para cualquier módulo.
- **`src/server/platform/download.ts`:** devolver un archivo para bajar con las cabeceras de § 3.
- **`src/app/platform/server/upload.ts`:** subir un archivo con su avance (`XMLHttpRequest`, porque
  `fetch` no dice cuánto subió).

### La aplicación, `src/app/modules/price-lists/` y `anomalies/`

| Archivo | Qué hace |
|---|---|
| `api.ts` | Las llamadas de § 3 |
| `useSuppliers.ts` | Catálogo → Listas: los proveedores, el buscador, los filtros de arriba (screens.md, 1) |
| `useUploads.ts` | Las listas que se suben y se leen desde este dispositivo, cada una con su avance y su pregunta (R4.10): vive en el shell, así sigue mientras se trabaja en otra cosa |
| `useListReview.ts` | Ver qué cambia y aplicar (screens.md, 3) |
| `useSupplier.ts` | La pantalla de un proveedor, en partes (screens.md, 4) |
| `useReaders.ts` | Administración → Lectores (screens.md, 5) |
| `anomalies/useAnomalies.ts` | Administración → Anomalías (06 · R9) |
| `texts.ts`, `shortcuts/*.ts` | Los textos y los atajos de cada pantalla |

Las vistas, en `src/app/views/basic/price-lists/` y `anomalies/`, como manda ADR-019.

## 6. Conexiones

- **El avance de una lista:** tema `price-lists.list`, con el identificador de la lista, en la forma
  `temporary` (ADR-003). Es la que dice la arquitectura para esto: llega en el momento sin pedirlo y el
  canal está abierto solo mientras una pantalla espera. `piggyback` llega recién con el próximo pedido
  (no se ve el avance) y preguntar cada segundo gasta datos del celular. Manda `{ status, rowsRead,
  rowsTotal, applied?, reason? }`, a lo sumo cuatro veces por segundo; al suscribirse, el estado de ahora
  (así reconectarse no pierde nada). Lo escucha quien tiene «Ver costos»; se vuelve a mirar con
  `permissions.changed`.
- **El espejo** (R1.6, E08): las listas que se están subiendo, la elegida y lo abierto son valores con
  nombre; el otro dispositivo escucha el mismo tema y pide el mismo resumen. El archivo lo elige y lo
  sube solo el dispositivo que lo tiene; el otro ve «Subiendo en la computadora» hasta que la lista
  existe en el servidor.
- **Cuántas anomalías hay abiertas** (06 · R9.5): un campo de la cabecera `X-Ferrebress`, en la forma
  `piggyback`, de la memoria del servidor (se cuenta al arrancar y se suma y se resta al abrir y
  cerrar), solo para quien tiene el permiso. La regla pide justamente que llegue con los pedidos de
  siempre, sin aviso en vivo.

### Sin conexión

Nada se baja para trabajar sin conexión ni se encola: todo el capítulo necesita el servidor (R1.5).
Sin conexión, cada pantalla muestra en gris lo último que se vio, con «Reintentar», y no deja subir ni
cambiar nada (E07).

## 7. Pantallas

Los modelos de § 5, con lo que espeja cada uno (ADR-019):

- **Catálogo → Listas** (`useSuppliers`): lo buscado y el filtro de arriba se espejan; los proveedores
  se piden con `useMirroredQuery`. Sin conexión, lo último que se vio, en gris, con «Reintentar» (R1.5,
  E07).
- **Subir una lista** (`useUploads`): por cada lista, su avance de subida (del dispositivo que sube),
  su avance de lectura (del tema) y su pregunta de proveedor. Se ve como un panel que no tapa la
  pantalla, así se sigue trabajando (R4.10). Soltar un archivo sobre la pantalla (screens.md, 1) es de la
  vista, que le pasa el archivo al modelo.
- **Ver qué cambia** (`useListReview`): el resumen, el filtro y lo buscado del detalle se espejan; el
  detalle se pide de a 50 al bajar.
- **El proveedor** (`useSupplier`): la parte abierta se espeja; cada dato se guarda al cambiarlo, con
  la versión que se vio y «Deshacer» (R1.7), como Administración.
- **Lectores y Anomalías** (`useReaders`, `useAnomalies`): como Administración.
- **El teclado:** cada pantalla declara sus comandos (`shortcuts/`) y sus teclas van al mapa: subir
  una lista, dar de alta un proveedor, ir al buscador; aplicar y descartar; cada parte del proveedor;
  agregar un descuento y moverlo con Alt ↑ ↓ (screens.md). ↑ ↓ por las filas y Enter son de la
  navegación.

## 8. Seguridad

- **Qué datos toca:** los de contacto de los vendedores (nombre, teléfono, correo: datos personales,
  con `privateProps()` en la vista), los costos (información del negocio, solo con «Ver costos») y los
  archivos de los proveedores, que no entran al repositorio (constitución, VIII): las pruebas usan
  planillas inventadas.
- **Quién puede cada cosa:** § 3; el servidor mira el permiso en cada ruta (R1.4) y los datos de contacto
  son lo único sin permiso (R1.3). Lo que un pedido nombra por identificador (un proveedor, una lista,
  un lector) se busca y se rechaza con `404` si no existe; no hay datos de una persona por otra.
- **Lo que entra de afuera:**
  - **El archivo:** tope de tamaño antes y mientras llega; extensión y primeros bytes; se abre en un
    hilo con tope de memoria y de tiempo (un ZIP que se infla, un XML que se repite: ADR-021). Las
    fórmulas no se calculan. Una planilla con más de 200.000 filas o 50 hojas no se lee (`too-big`).
  - **Las celdas:** todo se guarda y se muestra como texto, con su largo máximo (§ 2), sin armar HTML
    (E68). Nada de una celda se usa como nombre de archivo, ruta o consulta.
  - **Los lectores:** encerrados en QuickJS, sin nada del servidor, con topes (R5.10, E52, E53). Lo que
    devuelven se valida con el contrato y se comprueba contra la planilla (R5.4, E48).
  - **Los datos de los proveedores:** con sus largos y el correo con forma de correo; la nota es texto.
- **Secretos:** ninguno en esta etapa (la clave de la IA es de la etapa b).
- **Abuso:** subir tiene un límite por dispositivo (10 por minuto) y como mucho 4 listas leyéndose a la
  vez por persona; los hilos de lectura son 2 para todo el servidor, así una ráfaga espera en la cola y
  no frena al resto.
- **La auditoría:** § 4.

## 9. Metas de performance

| Qué | Meta |
|---|---|
| Subir: el pedido | 3 consultas; contesta apenas guarda el archivo |
| Leer 10.000 filas | Lo que cambia, en menos de 10 s (R4.9, E39): abrir la planilla, menos de 4 s; los lectores, menos de 3 s; guardar las filas en tandas de 1.000, menos de 2 s |
| El resumen de una lista | 3 consultas, menos de 300 ms con 10.000 filas; pesa menos de 5 KB |
| Una página del detalle | 2 consultas, 50 filas, menos de 20 KB |
| Aplicar 10.000 filas | Menos de 30 s (R6.6, E67): tandas de 1.000 con `unnest`, 4 sentencias por tanda |
| Cambiar cómo cobra con «Recalcular» | Contar sin guardar: 2 consultas; recalcular: tandas de 1.000 |
| Los artículos de un proveedor | 1 consulta, 50 filas |
| Lo que agrega a la cabecera | Un número, solo con el permiso |

## 10. Pruebas

- **Una por escenario**, como en todos los capítulos, contra la base de pruebas (PGlite).
- **Los lectores:** las pruebas de E52 y E53 corren lectores que intentan salir (leer `process`, un
  bucle sin fin, pedir memoria sin fin) y miran que se corten y que el servidor siga atendiendo.
- **Las planillas de prueba** son inventadas, armadas por las pruebas con SheetJS: con título,
  encabezado en la fila 8, renglones de marca, dos columnas de precio, filas salteadas, fechas en el
  título y en el nombre del archivo.
- **La performance** (E39, E67) tiene su prueba con una planilla de 10.000 filas, aparte de las rápidas
  (ADR-005), que corre antes de subir.

## 11. Tareas

1. Los permisos y los ajustes nuevos en los contratos; el grupo de la auditoría.
2. `src/shared/pricing/cost.ts`, con sus pruebas (E17, E18, E19).
3. `anomalies`: tabla, fachada, rutas, campo de la cabecera. Depende de 1.
4. `catalog`: tabla y fachada.
5. `price-lists`: proveedores y cómo cobra, con sus rutas (R2, R3). Depende de 1, 2 y 4.
6. Abrir planillas y los lectores en QuickJS: el hilo, la cola, la comprobación, el lector automático,
   la fecha y el proveedor (R4.3, R4.5, R5). Depende de 5.
7. Subir y leer, con el avance por el tema (R4). Depende de 6 y de `platform/upload.ts`.
8. Ver qué cambia y aplicar (R6, R7, R9). Depende de 3, 4 y 7.
9. Lectores y Anomalías en Administración (R5.8, 06 · R9). Depende de 3 y 6.
10. La aplicación: modelos, atajos y vistas básicas de cada pantalla. Depende de 5 a 9.
11. La prueba de performance con 10.000 filas.

## 12. Lo que se le propone a Carlos

- **Dar de alta un proveedor con el nombre de uno dado de baja:** dice que existe, dado de baja, y
  ofrece «Reactivar» en lugar de crear otro (R2.1 dice que el nombre es único; esto aclara qué pasa con
  los dados de baja).
- **Topes de la lectura que no están en las reglas:** una planilla de más de 200.000 filas o 50 hojas
  no se lee; un lector tiene 5 segundos y 64 MB por planilla; como mucho 4 listas leyéndose a la vez
  por persona. Son técnicos y van fijos; si Carlos quiere, pasan a ser ajustes de 06 (constitución,
  XIII).
- **Las filas de una lista se borran al día siguiente de aplicarla o descartarla** (salvo con su
  anomalía abierta): lo que hizo queda en los artículos y en Quién hizo qué, y su archivo queda siempre.
