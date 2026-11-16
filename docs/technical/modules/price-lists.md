# Diseño técnico · 08 · Listas de precios (`price-lists`), etapa a: la lista a mano

Implementa la etapa a del [capítulo 08](../../chapters/08-price-lists/rules.md): R1 a R9, con sus
escenarios E01 a E95 (y E29b a E31e), y lo que trae del [capítulo 06](../../chapters/06-administration/rules.md):
los ajustes de las listas (R8), las anomalías (R9) y los archivos de las listas (R10). Las pantallas son
las de [08](../../chapters/08-price-lists/screens.md) y las de Lectores, Anomalías y Archivos de listas de
[06](../../chapters/06-administration/screens.md). Cómo se abre una planilla y cómo corre un lector, en el
[ADR-021](../adr/ADR-021-reading-price-lists.md). Corregido con sus dos revisiones
([diseño](price-lists-design-review.md), [seguridad](price-lists-security-review.md)) y aprobado por
Carlos; lo que decidió está en § 13, más tres cosas que aprobó: el archivo de una lista que nunca se
aplicó se borra a los 30 días de arranque, lo borra a mano quien tiene «Cambiar los ajustes» y
Archivos de listas la ve quien tiene «Ver costos».

**Lo que se prueba con 07:** E12, E13 y E74 (un producto con dos proveedores) y E28, E72, E76 y E95 (lo
cambiado a mano en un producto) piden lo que hace el catálogo. El diseño los deja posibles (un producto
puede tener varios artículos y guarda lo cambiado a mano), y sus pruebas se escriben con 07.

## 1. La idea técnica

- **Tres módulos del servidor, cada uno con su esquema** (decidido por Carlos):
  - `price-lists`: los proveedores, cómo cobra cada uno, las listas, sus archivos, los lectores y los
    artículos de cada proveedor (lo que trae, con su costo).
  - `catalog`: los productos. Nace con lo que una lista crea y cambia (R7), y con el costo con que se
    vende; 07 le suma el margen, el precio, la búsqueda y la ficha. La dependencia va en un solo
    sentido: `price-lists` escribe en `catalog` por su fachada, y `catalog` no conoce a `price-lists`.
  - `anomalies`: las anomalías de cualquier capítulo (06 · R9). Cada capítulo abre y cierra las suyas
    por su fachada. Su pantalla está en Administración, que es el capítulo que la describe.
- **Un producto y el artículo de un proveedor son dos cosas.** El artículo (`supplierItem`, en
  `price_lists.items`) es lo que un proveedor trae con su código (R7.1): su descripción, su precio de
  lista, su costo y de qué lista salió. El producto (`catalog.products`) es lo que se vende, con el costo
  de su artículo. Hoy cada artículo crea su producto (R7.2); un producto queda dado de baja cuando
  ningún artículo lo trae (R7.4).
- **Una lista pasa por estados** (R6.7) y cada cambio es una sola sentencia que mira el estado de
  antes, así dos pedidos a la vez no chocan (R6.9):

  ```
  en cola ──▶ leyendo ──▶ en espera ──▶ aplicándose ──▶ aplicada
                 │            │               │
                 │            └──▶ descartada └──▶ en espera (falló, se cortó o se canceló)
                 ├──▶ no se pudo leer ──▶ leyendo (llegó un lector que la entiende, R5.5)
                 └──▶ descartada (cancelada, o reemplazada por otra del mismo proveedor, R4.8)
  ```

  «En cola» es la que llega mientras otra del mismo proveedor se aplica: sigue sola cuando termina
  (R4.8, E85). Subir es de la aplicación: la lista existe en el servidor recién cuando su archivo llegó
  entero; cancelar antes no deja nada (R4.11, E87).
- **Leer es un trabajo aparte del pedido**, en un proceso lector (ADR-021). El pedido que sube guarda el
  archivo, crea la lista y contesta enseguida. El proceso abre la planilla, deduce de quién es y de qué
  fecha (R4.3, R4.5), prueba los lectores (R5.2), y los corre **de a bloques de 5.000 filas**, con el tope
  de tiempo y de memoria de cada bloque (R5.10, R4.12). El servidor comprueba cada bloque (R5.4) y lo
  guarda. No hay tope de filas ni de hojas; con más filas que las del ajuste de 06 (R8.5), antes de leer
  se pregunta (R4.12, E91).
- **Al leer se calcula lo que cambia**, fila por fila: el costo nuevo con su base, el anterior y qué le
  pasa (nuevo, cambia, igual). Lo que ya no viene son los artículos del proveedor que la lista no trajo.
  Como hay una sola lista viva por proveedor (§ 2), sus artículos no cambian mientras ella espera, salvo
  al cambiar cómo cobra el proveedor, que recalcula en la misma transacción las filas de su lista viva.
  Así el resumen es un `count … group by`, cada página del detalle una consulta con índice, y «para
  revisar» compara en SQL los dos costos con el porcentaje de hoy (06 · R8.4).
- **El costo se calcula en un solo lugar**, `src/shared/pricing/cost.ts`, igual en el servidor y en la
  aplicación: el precio de lista, sin el IVA que dice la lista o el de arranque si lo incluía (R3.3), y
  cada descuento que le toca, uno sobre otro. En `BigInt`, con millonésimos de peso y descuentos en
  centésimos de por ciento (R3.2, hasta dos decimales). Se guarda cortado al millonésimo, que no se ve,
  y se muestra redondeado al centavo, la mitad para arriba ($ 1.648,725 se ve $ 1.648,73, E17), con la
  función de `src/shared/money/`. Devuelve el costo y sus pasos, para mostrar la cuenta (R3.4). En el
  contrato los millonésimos viajan como texto.
- **El artículo guarda la base de su costo** (`basis`): el precio de lista, el IVA quitado, los
  descuentos aplicados y la lista con su fecha. La cuenta (R3.4) sale de ahí, aunque después cambie cómo
  cobra el proveedor con «Desde la próxima lista». Recalcular (R3.5) rehace el costo desde la misma base
  con lo nuevo.
- **Aplicar es una transacción**, de a bloques de 1.000 filas (entre uno y otro cede el turno, así llega
  un «Cancelar» y se atienden otros pedidos), con el avance por el mismo tema. Traba la
  fila del proveedor al empezar: cambiar cómo cobra o darlo de baja mientras tanto contesta `409
  list-applying` (R2.6), y una lista nueva del mismo proveedor queda en cola (R4.8). Entre bloque y bloque
  mira si se canceló: si sí, se deshace todo (R4.11, E86). Lo que va a Quién hizo qué se junta en memoria
  y se escribe al confirmar (ADR-001, ADR-004), así nunca queda anotado algo que se deshizo.
- **Los archivos van a un almacén aparte, no a la base** (constitución, V): un volumen del servidor, con
  cada archivo una vez por contenido (su SHA-256, E63), detrás de `platform/files.ts` para poder pasarlo
  a un bucket sin tocar el módulo (Carlos). La base guarda de cada archivo su tamaño y quién lo usa. Se
  borran solos (R4.4): el de una lista aplicada al aplicarse otra más nueva del proveedor, el de una que
  nunca se aplicó a los días del ajuste (06 · R8.7), y los más viejos cuando todos juntos pasan el tamaño
  del ajuste (06 · R8.6), dejando siempre el más nuevo. También a mano, en Administración (06 · R10).

## 2. Entidades

### `price_lists.suppliers` (migración `001-suppliers`)

| Columna | Tipo | Para qué |
|---|---|---|
| `id` | `uuid`, clave | UUID v7, lo genera quien lo crea |
| `name` | `text`, `not null` | Como se escribió, de 1 a 80 letras |
| `name_key` | `text`, `not null`, único | `searchKey(name)` (`src/shared/text/`): sin acentos, mayúsculas ni espacios de más. Único entre todos, también los dados de baja (R2.1, E10, E94) |
| `seller`, `phone`, `email`, `note` | `text` | Los datos de R2.1, opcionales: hasta 80, 40, 120 y 500 letras; el correo con forma de correo |
| `terms` | `jsonb`, `not null` | Cómo cobra (R3.2): `{ vatIncluded, discounts: [{ id, name, percent, brand }], defaultVat, onChange }`; `percent` en centésimos (1 a 9.999), `brand` como se escribió (se compara con `searchKey`) o `null` para todas; hasta 20 descuentos; `defaultVat` en décimos (210, 105, 270); `onChange`, `recalculate` o `next` |
| `terms_version` | `integer`, `not null` | Cómo cobra va entero: guardar manda la versión que se vio |
| `inactive` | `boolean`, `not null`, `false` | Dado de baja (R2.4, R2.5) |
| `last_list_id`, `last_list_date` | `uuid`, `date` | La última lista aplicada (R1.1, R6.10) |

- **Cambiar un dato** (R1.7) manda el valor que se vio y escribe `where <dato> = <el que se vio>`: choca
  solo quien cambió lo mismo, y dos personas pueden cambiar el teléfono y la nota a la vez. El dato sale
  de una lista fija (`name`, `seller`, `phone`, `email`, `note`), nunca del pedido como nombre de
  columna.

### `price_lists.files` (migración `002-lists`)

| Columna | Tipo | Para qué |
|---|---|---|
| `sha256` | `bytea`, clave | El contenido; el archivo está en el almacén con ese nombre |
| `size` | `bigint`, `not null` | Su tamaño |
| `stored_at` | `timestamptz`, `not null` | Cuándo llegó, para borrar los más viejos (R4.4) |
| `deleting_at` | `timestamptz` | Borrado a mano y esperando el «Deshacer» de 06 · R10.2 |

- **Escribir:** el archivo va primero al almacén (con un nombre de paso y renombrado al terminar) y
  después la fila. Si la transacción falla, queda un archivo sin fila, que una limpieza diaria borra.
- **Cuánto ocupan entre todos** se cuenta con una consulta (una fila por archivo: son pocas), para la
  cabecera de Archivos de listas y para decidir qué borrar; así no puede desfasarse.
- **Borrar uno a mano** lo marca (`deleting_at`): desde ese momento las listas lo muestran como que ya no
  se guarda y no se baja; con «Deshacer» vuelve. Pasado el «Deshacer», la limpieza lo saca del almacén.

### `price_lists.lists` (migración `002-lists`)

| Columna | Tipo | Para qué |
|---|---|---|
| `id` | `uuid`, clave | UUID v7 |
| `supplier_id` | `uuid`, puede ser `null` | De quién es; `null` mientras no se sabe (R4.3) |
| `supplier_from` | `text` | `screen` (se subió desde su pantalla), `reader`, `name` o `chosen`: cómo se supo (R4.3) |
| `supplier_confirmed` | `boolean`, `not null` | Deducido por el nombre y sin confirmar no se aplica (`409 supplier-unconfirmed`) |
| `status` | `text`, `not null` | `queued`, `reading`, `pending`, `applying`, `applied`, `discarded`, `unreadable` |
| `waiting_for` | `text` | Lo que espera una lista leyendo: `supplier` (la pregunta de R4.3) o `size` (la de R4.12) |
| `scope` | `text`, `not null`, `'full'` | `full` o `partial` (R4.7) |
| `file_sha256` | `bytea` | Su archivo; `null` cuando ya no se guarda (R4.4, E88) |
| `file_name` | `text`, `not null` | El nombre con que se subió, hasta 200 letras, sin saltos de línea ni caracteres de control o que dan vuelta el texto |
| `list_date`, `date_from` | `date`, `text` | La fecha (R4.5) y de dónde salió: `sheet`, `file-name`, `server` o `server-ignored` si la de la planilla no se tomó (E84) |
| `reader_id`, `new_reader` | `uuid`, `boolean` | Quién la leyó y si es un lector nuevo (R5.7) |
| `rows_total`, `rows_read` | `integer` | El avance, para quien llega en el medio |
| `attempts` | `smallint`, `not null`, `0` | Cuántas veces se empezó a leer: se suma en la base antes de mandarla al proceso lector |
| `reason` | `text` | Por qué no se pudo leer, por qué falló aplicar o por qué se descartó, como código del contrato |
| `result` | `jsonb` | Al aplicarse: cuántos se crearon, cambiaron de costo, se dieron de baja y volvieron (E60) |
| `uploaded_by`, `uploaded_at` | `uuid`, `timestamptz`, `not null` | Quién y cuándo (R6.7) |
| `decided_by`, `decided_at` | `uuid`, `timestamptz` | Quién la aplicó o la descartó |
| `read_at` | `timestamptz` | Cuándo terminó de leerse: puede seguir esperando de quién es (R4.3) (migración `004-readers`) |
| `size_confirmed` | `boolean`, `not null` | Se confirmó leer una planilla grande (R4.12): si se corta, se retoma sin volver a preguntar (migración `004-readers`) |

- **Índices:** `(supplier_id, uploaded_at desc)`, para las listas de un proveedor, de a 20 (R6.7); y uno
  único parcial, `(supplier_id) where status in ('reading', 'pending', 'applying')`: una sola lista viva
  por proveedor (R4.8). La que está en cola no cuenta.
- **Fijar el proveedor de una lista** es una sola regla, en una transacción, para las cuatro formas
  (desde su pantalla, por su lector, por el nombre y elegido; diseño, revisión 1.2): si el proveedor tiene
  otra lista viva más vieja, se descarta con el motivo `replaced` y se cancela su lectura; si la otra es
  más nueva, se descarta esta; si la otra se está aplicando, esta queda en cola.

### `price_lists.list_rows` (migración `002-lists`)

Lo que trajo cada fila de una lista leída y lo que le pasa, para mostrarla y aplicarla sin volver a leer.

| Columna | Tipo | Para qué |
|---|---|---|
| `list_id`, `sheet`, `row` | `uuid`, `smallint`, `integer`, clave | Dónde estaba, para la fila salteada |
| `supplier_code` | `text` | Hasta 60 letras |
| `description`, `brand`, `barcode` | `text` | Hasta 300, 80 y 40 letras |
| `search_key` | `text` | `searchKey` del código, la descripción y la marca, para buscar en el detalle (R6.3) |
| `list_price` | `bigint` | En millonésimos; `null` en una salteada |
| `vat` | `smallint` | En décimos, si la lista lo dice |
| `cost`, `basis` | `bigint`, `jsonb` | El costo nuevo y su base, calculados al leer y al cambiar cómo cobra |
| `previous_cost` | `bigint` | El costo de su artículo al leer, si existía |
| `change` | `text` | `new`, `changed`, `same`, o `null` en una salteada |
| `skipped` | `text` | El motivo de una fila salteada (R5.4): `no-code`, `no-description`, `no-price`, `zero-price`, `not-a-number`, `repeated-code`, `other-currency` |
| `cells` | `jsonb` | Lo que traía una fila salteada, como texto |

- **Índices:** `(list_id, change, abs_variation desc)` (la variación, calculada), para «los que cambian
  primero» de a 50; `(list_id, supplier_code)`, para cruzar con los artículos.
- **Se borran al día siguiente** de aplicar o descartar la lista, salvo las de la lista que es la prueba
  de un lector (R5.7) y mientras su anomalía de filas salteadas esté abierta (aprobado por Carlos).

### `price_lists.items` (migración `003-items`)

| Columna | Tipo | Para qué |
|---|---|---|
| `supplier_id`, `supplier_code` | `uuid`, `text`, clave | El artículo de un proveedor (R7.1, E70) |
| `product_id` | `uuid`, `not null` | Su producto en `catalog` |
| `description`, `brand`, `barcode`, `search_key` | `text` | Lo último que dijo la lista (R7.3), y su clave para buscar (R8.1: código, descripción y marca) |
| `vat` | `smallint` | Lo que dijo la lista, o el de arranque del proveedor (R3.6) |
| `cost`, `basis` | `bigint`, `jsonb`, `not null` | El costo, sin redondear, y su base (R3.4) |
| `list_id` | `uuid`, `not null` | La última lista que lo trajo |
| `discontinued`, `discontinued_list_id` | `boolean`, `uuid` | Si dejó de venir y desde qué lista (R7.4, R8.2). Al dar de baja el proveedor, quedan todos dados de baja sin lista |

- **El orden de los productos** (R8.1) es el de `search_key`, que en un artículo empieza por la
  descripción (descripción, código y marca, sin acentos): orden alfabético y búsqueda en una sola columna.
- **Los costos se leen como texto** (`cost::text`): PGlite da un `bigint` como número y pierde precisión pasado 2^53.
- **Índices:** `(supplier_id, discontinued, search_key)`, para la lista alfabética de R8.1 de a 50; y
  `(product_id)`, para saber si un producto tiene otro proveedor (R7.4).

### `price_lists.readers` (migración `004-readers`)

| Columna | Tipo | Para qué |
|---|---|---|
| `id` | `uuid`, clave | UUID v7 |
| `supplier_id` | `uuid` | De qué proveedor; `null` en uno de un programador que todavía no se asoció (R5.1, E93) |
| `origin` | `text`, `not null` | `programmer`, `auto` o `ai` (`ai` es de la etapa b) |
| `code` | `text` | El de un programador o una IA, en JavaScript (ADR-021), hasta 200 KB |
| `template`, `params` | `text`, `jsonb` | El del lector automático: el nombre de la plantilla (`auto-1`) y sus datos (las columnas, la fila del encabezado), nunca pegados al código |
| `file_key`, `code_sha` | `text`, único; `bytea` | El de un programador: su archivo en el repositorio y su versión, para copiarlo al arrancar solo si cambió |
| `active` | `boolean`, `not null` | Desactivado en Lectores (R5.8) |
| `pending_list_id` | `uuid` | La lista que lo creó, mientras no se aplica (R5.7): no se usa para otras ni se puede activar |
| `proof_list_id` | `uuid` | La lista que lo dejó activo: su prueba (R5.7) |
| `last_list_id`, `created_at` | `uuid`, `timestamptz` | Lo que muestra Lectores (R5.8) |

- **Los de un programador** viven en el repositorio por formato, sin nombrar a ningún proveedor
  (constitución, VIII). La asociación con un proveedor es un dato de la base: se fija al aplicar la
  primera lista que leyó (E93), o la elige en Lectores quien tiene «Cambiar los ajustes» (R5.8).

### `catalog.products` (migración `001-products` de `catalog`)

| Columna | Tipo | Para qué |
|---|---|---|
| `id` | `uuid`, clave | UUID v7 |
| `description`, `brand`, `barcode` | `text` | Los de su artículo |
| `unit` | `text`, `not null`, `'un.'` | R7.2; uno de un., kg, m, L (lo confirmado para 07) |
| `unit_manual`, `vat_manual` | `boolean`, `not null`, `false` | Cambiados a mano en 07: ninguna lista los toca (R3.6, R7.3) |
| `vat` | `smallint`, `not null` | En décimos |
| `cost`, `cost_supplier_id` | `bigint`, `uuid` | El costo con que se vende y de qué proveedor sale: lo escribe `price-lists` al aplicar, recalcular y dar de baja (con varios proveedores, cuál decide 07) |
| `discontinued` | `boolean`, `not null` | Ningún artículo lo trae (R7.4); conserva todo lo suyo (R7.5) |

El margen lo suma 07 en su migración: hoy ningún producto tiene uno (R7.2). `catalog` no tiene pantallas
ni rutas en esta etapa: solo su fachada, que usa `price-lists` dentro de su transacción (ADR-001).

### `anomalies.anomalies` (migración `001-anomalies` de `anomalies`)

| Columna | Tipo | Para qué |
|---|---|---|
| `id` | `uuid`, clave | UUID v7 |
| `kind` | `text`, `not null` | `price-list-unreadable` o `price-list-skipped-rows` (08 · R9.2) |
| `subject` | `text`, `not null` | A qué se refiere, con el módulo adelante (`price-lists:list:<id>`): para cerrarla sola y para el enlace |
| `status` | `text`, `not null` | `open`, `reviewed` o `closed` (06 · R9.4) |
| `summary` | `jsonb`, `not null` | Lo que se muestra: el proveedor, el archivo, el motivo, cuántas filas y por qué motivos. Nunca precios: las filas se piden a `price-lists`, con «Ver costos» (08 · R9.2) |
| `opened_at`, `reviewed_by`, `reviewed_at`, `note`, `closed_at` | | Cuándo, quién, la nota (hasta 500 letras) |

- **Índices:** `(status, id desc)`, porque el identificador es UUID v7 y su orden es el de cuándo se
  abrió: la página siguiente es `id < after`; y uno único parcial, `(kind, subject) where status <>
  'closed'`: una sola abierta o revisada por cosa. Encontrar otra vez la misma cosa pone al día lo que
  muestra la que había y la vuelve a abrir; una cerrada no se toca y lo nuevo es otra.

### Los ajustes de 06 (sin migración)

Seis filas en la lista de ajustes del contrato de `administration` (06 · R8): `reviewPercent` (1 a 1.000,
50), `goneWarnPercent` (1 a 100, 20), `maxFileMb` (1 a 100, 30), `confirmRows` (1.000 a 10.000.000,
200.000), `filesMb` (10 a 100.000, 100) y `unappliedFileDays` (1 a 3.650, 30).

## 3. API

Formas y errores en `src/shared/contracts/price-lists.ts` y `anomalies.ts`. Todas piden sesión (E06).
Permisos nuevos, en el grupo «Catálogo»: `price-lists.costs` («Ver costos»), `price-lists.suppliers`
(«Administrar proveedores», incluye «Ver costos») y `price-lists.load` («Cargar listas», incluye «Ver
costos») (R1.2, E03); en «Administración», `anomalies.review` (06 · R9.3).

### Los proveedores

| Ruta | Qué hace | Permiso | Consultas |
|---|---|---|---|
| `GET /api/price-lists/suppliers` | Los activos con sus datos (R1.3); con «Ver costos», la fecha de la última lista y si tiene una viva (R1.1) | Ninguno | 1, o 2 con «Ver costos» |
| `GET /api/price-lists/suppliers/inactive` | Los dados de baja (R2.5) | «Administrar proveedores» | 1 |
| `GET /api/price-lists/suppliers/:id` | Sus datos; con «Ver costos», cómo cobra y sus últimas 20 listas, con quién las subió y decidió (R2.3, R6.7) | Ninguno o «Ver costos» | 1, o 3 con «Ver costos» (una a `users` por los nombres) |
| `GET /api/price-lists/suppliers/:id/lists` | `?after=`: las anteriores, de a 20 | «Ver costos» | 2 |
| `POST /api/price-lists/suppliers` | `{ name, seller?, phone?, email?, note? }` (R2.2) | «Administrar proveedores» | 1 |
| `POST /api/price-lists/suppliers/:id` | `{ field, before, value }` (R1.7) | «Administrar proveedores» | 1 |
| `POST /api/price-lists/suppliers/:id/terms` | `{ terms, version, confirmed? }` (R3.5) | «Administrar proveedores» | § 10 |
| `POST /api/price-lists/suppliers/:id/deactivate` | `{ confirmed? }` (R2.4) | «Administrar proveedores» | § 10 |
| `POST /api/price-lists/suppliers/:id/reactivate` | (R2.5) | «Administrar proveedores» | 1 |
| `GET /api/price-lists/suppliers/:id/items` | `?q=&discontinued=&after=`: de a 50 (R8) | «Ver costos» | 1 |

- **Dar de alta** con un nombre que existe contesta `409 supplier-exists`, y si es de uno dado de baja,
  `409 supplier-inactive` con su identificador, para ofrecer «Reactivar» (E94).
- **Cómo cobra:** si cambia costos con «Recalcular», sin `confirmed` o con otro número, `409
  confirm-costs` con cuántos (R3.5, E21); guardar y recalcular, incluidas las filas de su lista viva, son
  una transacción (E25: `503 recalc-failed` si falla). Con una lista aplicándose, `409 list-applying`.
- **Dar de baja:** primero `409 confirm-deactivate` con cuántos artículos pierden su costo y cuántos
  productos quedan dados de baja (R2.4, E12); con `confirmed` igual a esos números, lo hace, cancela la
  lista que se lee y descarta la que espera. Con una aplicándose, `409 list-applying` (R2.6).

### Las listas

| Ruta | Qué hace | Permiso | Consultas |
|---|---|---|---|
| `POST /api/price-lists/lists` | `?name=&supplierId=&scope=`, con el archivo como cuerpo: crea la lista y la pone a leer (R4.1) | «Cargar listas» | 3 |
| `GET /api/price-lists/lists/:id` | El estado, lo que espera, de quién es y cómo se supo, el resumen y los números del botón (R6.2, R6.5) | «Ver costos» | 2 |
| `GET /api/price-lists/lists/:id/rows` | `?show=&q=&after=`: el detalle de a 50, los que cambian primero (R6.3); `show`: lo que se tocó del resumen, `review` (R6.4), `skipped` o `discontinued` | «Ver costos» | 1 |
| `POST /api/price-lists/lists/:id/supplier` | `{ supplierId }` o `{ newSupplier }`: confirma, cambia o da de alta y fija; si cambia, la vuelve a leer (R4.3, E29c, E31, E31b) | «Cargar listas» | 2 o 3 |
| `POST /api/price-lists/lists/:id/size` | Sigue leyendo una planilla grande (R4.12, E91) | «Cargar listas» | 1 |
| `POST /api/price-lists/lists/:id/scope` | `{ scope }` (R4.7) | «Cargar listas» | 1 |
| `POST /api/price-lists/lists/:id/cancel` | Mientras se lee, la descarta; mientras se aplica, la deshace (R4.11) | «Cargar listas» | 1 |
| `POST /api/price-lists/lists/:id/apply` | `{ expected }` (R6.5, R6.6): contesta `202` y sigue por el tema | «Cargar listas» | § 10 |
| `POST /api/price-lists/lists/:id/discard` | (R6.11) | «Cargar listas» | 2 |
| `GET /api/price-lists/lists/:id/file` | El archivo original (R4.4, E40); `410 file-gone` si ya no se guarda | «Ver costos» | 1 |

- **Subir** usa una excepción con nombre de la plataforma, `http.upload(ruta, …)`: el único camino que
  acepta un cuerpo que no es JSON (`application/octet-stream`) y más grande que 64 KB. Lo demás sigue igual
  (el origen, el dispositivo, la versión del contrato). En la ruta, en orden: sesión, permiso, límite (10
  subidas por minuto por persona), `Content-Length` contra el ajuste (06 · R8.3) y recién ahí leer el
  cuerpo como flujo al almacén, contando los bytes y calculando el SHA-256; pasado el tope o sin datos por
  30 segundos, se corta. La extensión tiene que ser `.xlsx`, `.xls` o `.csv` y los primeros bytes no
  pueden ser de un ejecutable ni de un ZIP que no sea una planilla; lo demás (una tabla HTML con nombre
  `.xls`) lo decide el proceso lector. Si no, `413 file-too-large` o `415 file-format`, sin guardar nada
  (R4.2, E04, E33, E34). Caddy deja 100 MB solo en ese camino; `/api/*` sigue en 64 KB.
- **Dar de alta un proveedor al subir** (R2.2, E31b) va por `POST …/supplier` con `newSupplier`, que pide
  «Cargar listas»: es la única forma de crear uno sin «Administrar proveedores».
- **Aplicar** manda los números que vio el botón (`expected`). Dentro de la transacción, con la fila del
  proveedor trabada, se comparan con los de ahora: si no son, `409 numbers-changed`. También `409
  list-applying`, `409 list-applied` (R6.9, E62, E64), `409 list-too-old` (R6.10, E65) y `409
  supplier-unconfirmed`.
- **El archivo** se baja de a partes desde el almacén, con `Content-Disposition: attachment` y el nombre
  según RFC 6266 (`filename*=UTF-8''…`, ya limpio), `Content-Type: application/octet-stream` y
  `X-Content-Type-Options: nosniff`; como mucho 2 a la vez por persona. En la aplicación siempre con un
  enlace `download`, nunca abriéndolo (E68).

### Los lectores (Más → Administración → Lectores)

| Ruta | Qué hace | Permiso | Consultas |
|---|---|---|---|
| `GET /api/price-lists/readers` | Los lectores con su proveedor, sin su código (R5.8) | Ninguno | 1 |
| `POST /api/price-lists/readers/:id/active` | `{ active }` (E50); uno con `pending_list_id` no se puede activar | «Cambiar los ajustes» | 1 |
| `POST /api/price-lists/readers/:id/supplier` | `{ supplierId }`: asocia uno de un programador (R5.1) | «Cambiar los ajustes» | 1 |

### Los archivos (Más → Administración → Archivos de listas)

| Ruta | Qué hace | Permiso | Consultas |
|---|---|---|---|
| `GET /api/price-lists/files` | `?after=`: los archivos guardados, del más viejo al más nuevo, de a 50, y cuánto ocupan contra el ajuste (06 · R10.1) | «Ver costos» | 1 |
| `POST /api/price-lists/files/:sha256/delete` | Lo marca para borrar, con 5 segundos para deshacer (06 · R10.2); no el de una lista leyéndose o aplicándose | «Cambiar los ajustes» | 1 |
| `POST /api/price-lists/files/:sha256/restore` | «Deshacer» | «Cambiar los ajustes» | 1 |

### Las anomalías (Más → Administración → Anomalías)

| Ruta | Qué hace | Permiso | Consultas |
|---|---|---|---|
| `GET /api/anomalies` | `?status=&kind=&after=`: de a 30 (06 · R9.2) | «Revisar las anomalías» | 1 |
| `POST /api/anomalies/:id/review` | `{ note? }` (06 · R9.4) | «Revisar las anomalías» | 1 |
| `POST /api/anomalies/:id/reopen` | (06 · R9.4) | «Revisar las anomalías» | 1 |

Cuántas hay abiertas (06 · R9.5) va en la cabecera (§ 6).

## 4. El lector

El contrato, en `src/shared/contracts/price-lists.ts` (tipo `ReaderModule`), igual para los de un
programador, el automático y los de la etapa b:

- **Recibe** la planilla como datos: cada hoja con su nombre y sus filas; cada celda como `{ v, t }`, el
  valor (número, texto o fecha) y el texto que se ve. Las celdas combinadas llegan en su primera celda.
- **`recognizes(head)`** recibe las primeras 50 filas de cada hoja y contesta `yes`, `no` o `unsure`: es
  barato, así probar todos los lectores no cuesta leer la planilla entera (R5.2). `unsure` es el «dudo»
  del automático (R5.5, E46).
- **`read(block, head)`** recibe un bloque de filas (las de 5.000 en 5.000) y las primeras de cada hoja, y
  devuelve **qué es cada fila y dónde está cada dato, no los datos**:
  `{ sheet, row, kind, at? , reason? }`, con `kind` uno de `product`, `skipped`, `title`, `brand` o `empty`;
  y en un producto, `at` dice en qué celda está el código, la descripción, la marca (puede ser la celda de
  un renglón de marca de arriba), el precio, el IVA y el código de barras.
- **El servidor lee las celdas que el lector señaló** y las convierte, una sola vez para todos: un precio
  escrito como texto («$ 2.314,00», «1.234,5»; el punto como separador de miles), el IVA («21 %»,
  «0,21»). Así «todo precio que devuelve está escrito en la planilla» (R5.4, E48) se cumple porque el
  lector no puede devolver números. El código repetido y la otra moneda (R5.4) los detecta el servidor.
- **La comprobación** (`rules/check.ts`): cada fila del bloque tiene su clase; un producto, código,
  descripción y un precio mayor que cero; lo que no cumple pasa a fila salteada con su motivo. Si un
  lector deja filas sin clase, señala una celda que no existe o no pasa el primer bloque, no se usa.
- **El orden** (R5.2, E41): los del proveedor, del más nuevo al más viejo; después los de los demás y los
  de un programador sin proveedor. Un lector de **otro** proveedor que la reconoce no decide: deja la
  pregunta (R4.3). Los de un proveedor dado de baja no se prueban.

## 5. Eventos y auditoría

**A Quién hizo qué** (R9.1), grupo nuevo «Listas de precios»:

| Evento | Texto | Con |
|---|---|---|
| `suppliers.created` | «Dio de alta al proveedor <nombre>» | El nombre; de los datos del vendedor, solo cuáles se cargaron |
| `suppliers.changed` | «Cambió <dato> de <proveedor>» | Lo anterior y lo nuevo, salvo el vendedor, el teléfono y el correo: de esos solo qué cambió (R9.1, E11) |
| `suppliers.terms-changed` | «Cambió cómo cobra <proveedor>» | Lo anterior, lo nuevo y cuántos costos cambiaron (E22) |
| `suppliers.deactivated`, `suppliers.reactivated` | «Dio de baja a…», «Reactivó a…» | Cuántos perdieron su costo y cuántos quedaron dados de baja |
| `lists.uploaded` | «Subió la lista <archivo>» | El archivo y su alcance; el proveedor, si se sabe |
| `lists.applied` | «Aplicó la lista <archivo> de <proveedor>: 4 nuevos, 31 costos, 2 bajas» | Sus números (E80) y su fecha |
| `lists.costs` | «Cambió el costo de 80 productos con una lista» | De a 80 productos: cada uno como dato afectado y, en el mismo orden, su costo anterior y el nuevo |
| `lists.discarded` | «Descartó la lista…» | Por qué: a mano, cancelada o reemplazada |
| `files.deleted`, `files.restored` | «Borró el archivo…» | Su lista (06 · R10.2) |
| `readers.activated`, `readers.deactivated`, `readers.assigned` | «Desactivó el lector…» | El proveedor y de dónde salió (E50) |

Las de `anomalies` van en el grupo «Administración», que es el capítulo que las describe:
`anomalies.reviewed` («Marcó revisada…», con la nota) y `anomalies.reopened` (06 · R9.7).

- **Los costos de cada artículo** (R9.1, E71) van en eventos `lists.costs` de a 80 productos (una acción
  pesa como mucho 8 KB, diseño de 05, § 2.2; con 5.000 productos en uno solo, se cortarían): con el costo anterior y el nuevo de cada uno, y cada producto como dato afectado
  (`targets: [{ kind: 'product', id }]`), así la historia del costo de un producto se lee por su
  identificador (T115). Un artículo con el mismo costo no suma nada (E77). Con 20 proveedores de 5.000
  artículos por semana son, como mucho, unos 1.300 eventos, no 100.000 (corrige el número del ADR-004).
- **Se escriben al confirmar**, con `events.transaction`: lo que se deshace no queda anotado.
- **Rechazos:** sin permiso, el `permission.denied` de la plataforma (R1.4, E04). Los `409` no se anotan.
- **Entre módulos:** `price-lists` abre y cierra anomalías por la fachada de `anomalies` dentro de su
  transacción (R9.2, E82); el tema del avance vuelve a mirar quién escucha con
  `users.permissions-changed` (`recheckOn`).

## 6. Conexiones

- **El avance de una lista:** tema `price-lists.list`, con el identificador de la lista, en la forma
  `temporary` (ADR-003): llega en el momento sin pedirlo y el canal está abierto solo mientras una
  pantalla espera. `piggyback` llega recién con el próximo pedido y preguntar cada segundo gasta datos del
  celular. Manda `{ status, waitingFor?, rowsRead, rowsTotal, applied?, reason? }`, a lo sumo cuatro veces
  por segundo; al suscribirse, el estado de ahora. Lo escucha quien tiene «Ver costos». Mientras se abre
  la planilla, antes de saber cuántas filas tiene, manda `opening` (E39). Su fila, en
  [mobile-data.md](../mobile-data.md).
- **El espejo** (R1.6, E08): las listas que se están subiendo, la elegida y lo abierto son valores con
  nombre; el otro dispositivo escucha el mismo tema y pide el mismo resumen. El archivo lo elige y lo
  sube solo el dispositivo que lo tiene; el otro ve «Subiendo en la computadora» hasta que la lista existe
  en el servidor.
- **Cuántas anomalías hay abiertas** (06 · R9.5): un campo de la cabecera `X-Ferrebress`, en la forma
  `piggyback`, de la memoria del servidor (se cuentan al arrancar y se suman o restan al confirmar),
  solo para quien tiene el permiso.

### Sin conexión

Nada se baja para trabajar sin conexión ni se encola: el capítulo necesita el servidor (R1.5). Sin
conexión, cada pantalla muestra en gris lo último que se vio, solo en la memoria (nada de costos ni de
datos de vendedores queda en el dispositivo), con «Reintentar» (E07).

## 7. Dónde vive cada cosa

### El servidor, `src/server/modules/price-lists/`

| Archivo | Qué hace |
|---|---|
| `index.ts` | La fachada y el registro: rutas, permisos, el campo de la cabecera de nadie (es de `anomalies`), al arrancar copia los lectores del repositorio que cambiaron y retoma lo cortado (§ 8) |
| `settings.ts` | Lo fijo del módulo: bloques de 5.000 filas, tandas de 1.000, páginas de 50, el tope por bloque de los lectores (5 s, 64 MB), los procesos lectores (2), las subidas por minuto, el día de espera para borrar filas |
| `realtime.ts` | El tema del avance (ADR-020) |
| `routes/suppliers.ts`, `routes/lists.ts`, `routes/readers.ts`, `routes/files.ts` | La entrada HTTP de cada parte |
| `rules/suppliers.ts`, `rules/terms.ts`, `rules/assign.ts`, `rules/review.ts`, `rules/apply.ts`, `rules/files.ts` | Los proveedores, cómo cobra, fijar el proveedor de una lista (§ 2), el resumen, aplicar y qué archivos borrar |
| `rules/check.ts`, `rules/deduce.ts`, `rules/cells.ts`, `rules/auto.ts` | La comprobación, de quién es y de qué fecha, leer un precio o un IVA de una celda y el lector automático (R5.3, sin SheetJS ni QuickJS: se prueba sin el proceso) |
| `data/*.ts` | Las consultas, en lote, por tabla |
| `reading/pool.ts` | Los procesos lectores: la cola (de identificadores), cancelar, los topes y reemplazar el que muere |
| `reading/process.ts` | Lo que corre en el proceso lector: abre la planilla con SheetJS y corre los lectores en QuickJS (ADR-021) |
| `readers/*.js` | Los lectores de un programador, por formato, con sus pruebas y planillas de ejemplo inventadas (constitución, VIII), que corren también en QuickJS |
| `readers/auto-1.js` | La plantilla del lector automático: código fijo que recibe sus datos aparte |
| `events.ts`, `migrations/`, `tables.generated.ts` | Como todo módulo |

### `catalog` y `anomalies`

- **`src/server/modules/catalog/`:** `index.ts` (la fachada: crear, actualizar, poner el costo, quitar el
  costo de un proveedor, dar de baja y traer de vuelta productos en lote, dentro de una transacción ajena), `data.ts` y su migración.
- **`src/server/modules/anomalies/`:** `index.ts` (la fachada `open` y `close`, y el campo de la cabecera),
  `routes.ts`, `rules.ts`, `data.ts`, `events.ts` y su migración.

### Lo que cambia en otros módulos

- **`administration`:** seis ajustes más en su contrato (06 · R8); la pantalla de Archivos de listas es
  de `price-lists` y se llega desde Administración, como Lectores.
- **`users` (02):** los cuatro permisos nuevos con sus inclusiones; el Administrador los suma solo.
- **`audit-log` (05):** el grupo «Listas de precios», los textos de § 5 y mostrar los cambios de cada
  artículo dentro del evento de la lista.

### Código común (una tarea propia, primero)

- `src/shared/pricing/cost.ts`: la cuenta del costo y sus pasos (R3.3, R3.4), en `BigInt`.
- `src/shared/money/`: mostrar millonésimos redondeados al centavo, la mitad para arriba.
- `src/shared/text/searchKey.ts`: el texto sin acentos, sin mayúsculas y sin espacios de más, para
  guardarlo y buscarlo.
- `src/server/platform/files.ts`: el almacén de archivos por contenido (guardar como flujo, leer de a
  partes, borrar), en un volumen; mañana, un bucket.
- `src/server/platform/http.ts`: `http.upload`, la excepción con nombre para subir.
- `src/server/platform/download.ts`: devolver un archivo para bajar con las cabeceras de § 3.
- `src/app/platform/server/upload.ts`: subir con su avance (`XMLHttpRequest`), usando lo de `api.ts` para
  las cabeceras, la respuesta y los errores, y el punto de enganche del medidor de datos.
- `deploy/`: el volumen de los archivos, `mem_limit` del contenedor del servidor y el camino de 100 MB en
  Caddy.

### La aplicación, `src/app/modules/price-lists/` y `anomalies/`

| Archivo | Qué hace |
|---|---|
| `api.ts` | Las llamadas de § 3 |
| `useSuppliers.ts` | Catálogo → Listas (screens.md, 1) |
| `uploads.ts`, `useUploads.ts` | Las listas que se suben y se leen, cada una con su avance y su pregunta (R4.10): viven en un almacén del módulo, fuera de cualquier pantalla, así siguen mientras se trabaja en otra cosa; la vista básica pone su panel en su composición (el shell no sabe de listas) |
| `useListReview.ts` | Ver qué cambia y aplicar (screens.md, 3) |
| `useSupplier.ts` | La pantalla de un proveedor, en partes (screens.md, 4) |
| `useReaders.ts`, `useFiles.ts` | Administración → Lectores y Archivos de listas |
| `anomalies/useAnomalies.ts` | Administración → Anomalías (06 · R9) |
| `texts.ts`, `shortcuts/*.ts` | Los textos y los atajos de cada pantalla |

Las vistas, en `src/app/views/basic/price-lists/` y `anomalies/` (ADR-019).

## 8. Lo cortado, lo que vuelve a leerse y lo que se borra solo

- **Al arrancar,** una lista «leyendo» borra sus filas y vuelve a la cola, conservando su proveedor y su
  lector; si ya tiene dos intentos (`attempts`), queda «No se pudo leer» con el motivo `crashed` y su
  anomalía, sin abrir el archivo (así un archivo que tumba el proceso no lo hace en cada arranque). Una
  «aplicándose» vuelve a «en espera» con el motivo `interrupted` (E61): su transacción ya se deshizo.
- **Volver a leer una que no se pudo** (R5.5, E47) pasa solo cuando cambió el juego de lectores (uno de un
  programador nuevo o cambiado al arrancar, o uno que quedó activo), y solo con la última lista de cada
  proveedor que no tenga después una leída: las anteriores quedan como están (su anomalía se cierra con
  la siguiente que se lee, R9.2). Entra a la cola como cualquiera.
- **Mientras se lee,** las filas se guardan de a bloques; si ya se sabe de quién es la lista, con su
  costo y el que tenía su artículo. Una lista sin proveedor sigue leyéndose y espera la respuesta con
  `waiting_for = 'supplier'`; al elegirlo se les pone el costo a todas, sin volver a leer.
- **Un proceso que se cuelga o muere** deja la lista con un intento más: se reintenta una vez y, al
  segundo, queda «No se pudo leer» con `crashed`.
- **Una lectura vieja no pisa a una nueva:** cada corrida lleva su número de intento, y el resultado de
  un bloque se guarda solo si la lista sigue en ese intento y «leyendo».
- **Los archivos** se borran: al aplicar una lista, el de la aplicada anterior del mismo proveedor (si
  ninguna otra lista usa ese contenido); una vez por hora, los de listas que nunca se aplicaron con más
  días que el ajuste (06 · R8.7), los marcados a mano con el «Deshacer» vencido y los que quedaron sin
  fila; y al guardar uno nuevo, si entre todos pasan el ajuste (06 · R8.6), los más viejos hasta quedar
  debajo, salvo el más nuevo y los de listas leyéndose o aplicándose.

## 9. Pantallas

Los modelos de § 7, con lo que espeja cada uno (ADR-019):

- **Catálogo → Listas** (`useSuppliers`): lo buscado y el filtro de arriba se espejan; los proveedores
  se piden con `useMirroredQuery`. Sin conexión, lo último que se vio, en gris (R1.5, E07).
- **Subir una lista** (`useUploads`): por cada lista, su avance de subida (del dispositivo que sube), el
  de lectura (del tema) y lo que espera (de quién es, R4.3; seguir con una planilla grande, R4.12). Se ve
  en un panel que no tapa la pantalla (R4.10). Soltar un archivo es de la vista, que se lo pasa al modelo.
- **Ver qué cambia** (`useListReview`): el resumen, el filtro y lo buscado se espejan; el detalle se pide
  de a 50 al bajar; mientras se aplica, el avance y «Cancelar».
- **El proveedor** (`useSupplier`): la parte abierta se espeja; cada dato se guarda al cambiarlo, con el
  valor que se vio y «Deshacer» (R1.7). Un teléfono o un correo se abren con un enlace de esquema fijo
  (`tel:`, `mailto:`, `https://wa.me/`) y el valor codificado.
- **Lectores, Archivos de listas y Anomalías:** como Administración.
- **El teclado:** cada pantalla declara sus comandos (`shortcuts/`) y sus teclas van al mapa: subir una
  lista, dar de alta un proveedor, ir al buscador; aplicar, descartar y cancelar; cada parte del
  proveedor; agregar un descuento y moverlo con Alt ↑ ↓; borrar un archivo. ↑ ↓ y Enter son de la
  navegación.

## 10. Seguridad

- **Qué datos toca:** los de contacto de los vendedores (datos personales de alguien de afuera: con
  `privateProps()` en la vista, fuera de la auditoría salvo qué cambió, y solo en la memoria del
  dispositivo), los costos (solo con «Ver costos», también en las anomalías) y los archivos de los
  proveedores, que no entran al repositorio (constitución, VIII).
- **Quién puede cada cosa:** § 3; el servidor mira el permiso en cada ruta (R1.4); lo que un pedido nombra
  por identificador se busca y da `404` si no existe.
- **Lo que entra de afuera:**
  - **El archivo:** § 3, «Subir». Antes de SheetJS, el proceso lector mira el índice del ZIP de un
    `.xlsx`: como mucho 2.000 partes, ninguna sin tamaño declarado que traiga datos, la suma de lo que
    declaran como mucho 300 MB y 100 veces el archivo, y los tamaños de cada cabecera iguales a los del
    índice; si no, «No se pudo leer» con `too-big`. Con el tamaño declarado, SheetJS descomprime dentro de
    ese espacio y no crece (revisión de seguridad, 1). SheetJS, con las opciones cerradas (sin fórmulas,
    sin HTML, sin archivos adjuntos) y solo los tres formatos. Las fórmulas no se calculan.
  - **El proceso lector** (ADR-021) tiene tope de memoria del sistema, no solo de V8, y entorno vacío
    (sin la clave de la base); si muere, se lo reemplaza y la lista sigue lo de § 8. El contenedor del
    servidor tiene `mem_limit`, así un error que quede no se lleva la máquina.
  - **Los lectores:** encerrados en QuickJS, un contexto nuevo por corrida, sin ninguna función del
    servidor, con tope de memoria, de pila y de tiempo por bloque (R5.10, E52, E53). Devuelven
    posiciones, que se validan con el contrato y se comprueban (§ 4, E48). Los datos del lector automático
    van aparte de su código: un encabezado armado no puede volverse código.
  - **Las celdas:** se guardan y se muestran como texto, con su largo máximo (§ 2), sin armar HTML (E68).
    Nada de una celda se usa como nombre de archivo, ruta o consulta. Un precio de más de $ 1 billón es
    una fila salteada (`not-a-number`).
  - **Los datos de los proveedores:** con sus largos; el correo con forma de correo.
- **Secretos:** ninguno en esta etapa (la clave de la IA es de la etapa b).
- **Abuso:** 10 subidas por minuto por persona (la clave sale de la sesión, no de una cabecera que elige
  quien manda); la cola guarda identificadores; 2 procesos lectores para todo el servidor; aplicar, de a
  una lista a la vez en todo el servidor; bajar archivos, 2 a la vez por persona; el disco, con los
  ajustes de 06 · R8.6 y R8.7.
- **Dependencias:** SheetJS 0.20.3 bajado de su sitio y guardado en `src/server/vendor/`, con su suma de comprobación en el `pnpm-lock.yaml`
  (como no viene del registro, `pnpm audit` no lo mira: se revisan sus avisos al actualizarlo), y
  `quickjs-emscripten-core` con una sola variante de WebAssembly.
- **La auditoría:** § 5.

## 11. Metas de performance

| Qué | Meta |
|---|---|
| Subir: el pedido | 3 consultas; contesta apenas guarda el archivo, sin tenerlo entero en memoria |
| Leer 10.000 filas | Lo que cambia, en menos de 10 s (R4.9, E39): abrir la planilla, menos de 4 s; los lectores, menos de 3 s; comprobar y guardar con lo que cambia, en tandas de 1.000, menos de 2 s. La tarea 4 empieza midiéndolo |
| Probar los lectores | `recognizes` con las primeras 50 filas: menos de 50 ms por lector; con 150 lectores, menos de 3 s |
| El resumen | 2 consultas, menos de 100 ms con 10.000 filas; pesa menos de 5 KB |
| Una página del detalle | 1 consulta con índice, 50 filas, menos de 20 KB |
| Aplicar 10.000 filas | Menos de 30 s (R6.6, E67): tandas de 1.000 con `unnest`, 4 sentencias por tanda |
| Cambiar cómo cobra con «Recalcular» | Contar: 1 consulta; recalcular los artículos y las filas de su lista viva, en tandas |
| Los artículos de un proveedor | 1 consulta, 50 filas |
| Lo que agrega a la cabecera | Un número, solo con el permiso |

## 12. Pruebas y tareas

- **Primero las pruebas**, una por escenario, fallando (constitución, VII), contra la base de pruebas.
- **Los lectores:** las pruebas de E52 y E53 corren lectores que intentan salir (leer `process`, un bucle
  sin fin, pedir memoria sin fin) y miran que se corten y que el servidor siga atendiendo; los topes bajan
  en las pruebas desde `settings.ts`. Las bombas ZIP (un `.xlsx` que dice 4 GB, uno sin tamaño que se infla)
  quedan «No se pudo leer» sin que suba la memoria del servidor. Los lectores de `readers/` se prueban
  también corriendo en QuickJS.
- **Las planillas de prueba** son inventadas, armadas por las pruebas.
- **Sin pruebas de punta a punta nuevas:** E08 (el avance en el otro dispositivo) lo cubre la prueba del
  espejo de cualquier valor con nombre; si hiciera falta una, se le justifica a Carlos antes.
- **La performance** (E39, E67) tiene su prueba con 10.000 filas, aparte de las rápidas (ADR-005).

Las tareas, en orden:

1. **Código común** (§ 7), con sus pruebas. Toma el código común.
2. Los permisos y los ajustes en los contratos; el grupo de la auditoría.
3. `anomalies` y `catalog`. Dependen de 2.
4. **Medir primero:** abrir 10.000 filas con SheetJS y leerlas en QuickJS en la máquina del ADR-014. Si
   no entra en la meta, se corrige el ADR-021 antes de seguir.
5. `price-lists`: proveedores y cómo cobra (R2, R3). Depende de 1 a 3.
6. El proceso lector, el contrato del lector, la comprobación, el lector automático, la fecha y el
   proveedor (R4.3, R4.5, R5). Depende de 4 y 5.
7. Subir, leer, la cola y lo cortado (R4, § 8). Depende de 6.
8. Ver qué cambia, aplicar y cancelar (R6, R7, R9). Depende de 3 y 7.
9. Lectores, Archivos de listas y Anomalías en Administración. Depende de 3, 6 y 7.
10. La aplicación: modelos, atajos y vistas básicas. Depende de 5 a 9.
11. La prueba de performance completa.
12. Los documentos: [mobile-data.md](../mobile-data.md) (el canal del avance), la arquitectura («Los
    datos»: el almacén de archivos; «Escala»: los procesos lectores y las anomalías en memoria) y el número
    del ADR-004.

## 13. Lo que decidió Carlos

- **Los escenarios que piden 07** se prueban con 07.
- **`anomalies` y `catalog`** son módulos aparte desde ahora.
- **Una fecha posterior a hoy o de más de un año atrás** no se toma: la lista queda con la del servidor
  (R4.5, E84).
- **Las anomalías no muestran precios:** las filas salteadas se ven con «Ver costos» (R9.2).
- **El IVA que se quita** es el de la lista o el de arranque, no el cambiado a mano (R3.3, E95).
- **Los lectores de un programador** van por formato, sin nombrar al proveedor; la asociación con el
  proveedor se guarda en la base (R5.1, E93).
- **Sin tope de filas, hojas ni listas a la vez:** de a bloques, con un aviso antes de leer una planilla
  muy grande (R4.12, 06 · R8.5); el tope de tiempo y memoria del lector vale por bloque (R5.10).
- **Un nombre de un proveedor dado de baja** ofrece reactivarlo (R2.1, E94).
- **Las filas leídas** se borran al día siguiente, salvo las de la prueba de un lector y con su anomalía
  abierta.
- **De los datos de contacto del vendedor**, Quién hizo qué guarda solo qué cambió (R9.1, E11).
- **Los archivos son un respaldo** y se borran solos: al reemplazarse por una lista aplicada más nueva,
  a los días fijados si nunca se aplicó, y los más viejos al pasar el tamaño fijado; también a mano, en
  Administración (R4.4, 06 · R8.6, R8.7 y R10). Más adelante irán a un bucket.
- **Cancelar se puede en cualquier momento,** también mientras se aplica, sin que quede nada a medias
  (R4.11, E86, E87).
- **Una lista que llega mientras otra del mismo proveedor se aplica** espera su turno (R4.8, E85).
- **Los descuentos** llevan hasta dos decimales; lo único que se redondea es el precio final (R3.2, E92).
