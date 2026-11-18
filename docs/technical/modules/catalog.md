# Diseño técnico · 07 · Catálogo (`catalog`), parte a1

El servidor del catálogo y buscar: lo que piden las [reglas](../../chapters/07-catalog/rules.md) (R1 a
R6) y el redondeo nuevo (T136, 06 · R3.2, R3.6 y R3.7). Las pantallas son de a2. Parte de lo que dejó
08a: `catalog.products` con el costo de su artículo y la fachada que usan las listas para crear, poner
al día, poner el costo, dar de baja y traer de vuelta productos ([diseño de 08](price-lists.md), § 1).
Corregido con la [revisión del diseño](catalog-design-review.md) y la
[de seguridad](catalog-security-review.md).

## 1. La idea técnica

- **El precio se guarda, en centavos** (`sale_cents`), y también el precio sin redondear, ya llevado
  para arriba al centavo (`raw_cents`). Buscar, ordenar y contar «Sin precio» necesitan el precio en la
  tabla; con `raw_cents`, recalcular el redondeo es una sola sentencia
  (`sale_cents = ceil(raw_cents / paso) × paso`) y contar cuántos cambian, una consulta. En centavos,
  el precio más grande posible (un costo de $ 1 billón, margen de 10.000 % e IVA de 27 %) es unos
  1,3 × 10¹⁶, que entra de sobra en un `bigint` (9,2 × 10¹⁸).
- **La cuenta del precio está en un solo lugar,** `src/shared/pricing/sale.ts` (`salePrice`), en
  `BigInt`, igual en el servidor y en la aplicación. Cada división se lleva para arriba al centavo: así
  «sin redondeo» cobra $ 10,13 y no $ 10,12 (E08). La base no repite la cuenta: el servidor calcula
  `raw_cents` en TypeScript y lo guarda; la base solo redondea al paso.
- **Todo lo que escribe precios se ordena por una sola fila:** `catalog.pricing` guarda el paso del
  redondeo que usan los precios. Lo que escribe precios (una lista, un cambio de margen o de IVA) la lee
  con `for share`; el recálculo del redondeo la toma con `for update`, la cambia y recalcula en la misma
  transacción. Así nunca conviven precios con dos pasos (06 · R3.5) y un precio nunca se calcula con un
  paso viejo de la memoria.
- **El margen es un número del producto,** no una referencia a un margen rápido: cambiar los márgenes
  rápidos no cambia precios (06 · R4.3).
- **El catálogo no lee de las listas** (el diseño de 08 dice que `catalog` no conoce a `price-lists`):
  el código del proveedor se guarda en el producto, que lo recibe al crearse; la cuenta del costo para
  «Así se calcula» la da `price-lists` por una función que conecta `server/modules.ts`
  (`costBasisOf`), como `administration` recibe al que recalcula.
- **Buscar y listar salen de un índice en la memoria del servidor** ([ADR-022](../adr/ADR-022-catalog-search.md)),
  con los productos que no están dados de baja: el orden, los filtros y los números salen de ahí, y la
  página de 50 sale de la base con una consulta por clave. Los dados de baja, que pueden crecer con los
  años, no están en el índice: su filtro sale de la base. El índice vive en `src/shared/search/`, sin
  nada del servidor, para que en 15b sirva también en el celular (R3.3).
- **Cambiar un dato choca solo con quien cambió el mismo** (R1.5): el pedido manda el valor que vio
  (`before`) y el nuevo; si en la base hay otro, `409` con el de ahora.

## 2. Entidades

### `catalog.products` (migración `002-prices`)

| Columna | Tipo | Para qué |
|---|---|---|
| `supplier_code` | `text`, `not null` | El código del proveedor, que lo trae la lista al crear (para buscar, R3.2); la migración lo copia de `price_lists.items` |
| `margin` | `integer`, `null` | Porcentaje entero de 1 a 10.000 (R2.1); `null`, sin margen |
| `raw_cents` | `bigint`, `null` | El precio sin redondear, llevado para arriba al centavo; `null` sin margen o sin costo |
| `sale_cents` | `bigint`, `null` | El precio de venta, redondeado al paso de `catalog.pricing` (R2.2) |
| `vat_from_list` | `smallint`, `not null` | El IVA que puso la última lista: «Deshacer» un IVA a mano vuelve a este y a `vat_manual = false` (R1.4, E23) |
| `search_key` | `text`, `not null` | La descripción como `searchKey`, para el orden de los dados de baja en la base (sin depender de la intercalación) |

- **Índices:** `(discontinued, search_key)` para el filtro «Dados de baja» (R1.6) de a 50, con `collate
  "C"` sobre un texto ya sin acentos ni mayúsculas.
- **La unidad y el IVA** ya están, con `unit_manual` y `vat_manual` (08a) (R1.3).

### `catalog.pricing` (una sola fila)

| Columna | Tipo | Para qué |
|---|---|---|
| `step_cents` | `integer`, `not null` | El paso con que están todos los precios: lo copia el recálculo del redondeo |

### El paso del redondeo en centavos (T136)

`administration.settings` pasa `roundingStep` a centavos: la migración de `administration` multiplica
por 100 el valor guardado, y 0 («sin redondeo») pasa a 1. Las opciones del contrato son 1, 5, 10, 50,
100, 500, 1.000, 5.000, 10.000, 50.000, 100.000, 500.000 y 1.000.000 (06 · R3.2). Los cambios viejos del
redondeo en Quién hizo qué guardaban pesos: el texto de ese evento lee `stepCents` si está y, si no,
`value` en pesos.

## 3. API

Todas las rutas piden sesión (R4.1, E26): sin ella, `401` sin leer nada.

| Ruta | Qué | Permiso | Consultas |
|---|---|---|---|
| `GET /api/catalog/products` | `?q=&brand=&show=noPrice|discontinued&after=`: de a 50, con los números de arriba (R3) | Sesión | 1: la página por clave (con «Dados de baja», 2) |
| `GET /api/catalog/products/:id` | El producto; con «Ver costos», el margen, el proveedor, el costo y «Así se calcula» (R2.6, R4.1) | Sesión | 1, o 2 con «Ver costos» (la cuenta del costo, de `price-lists`) |
| `GET /api/catalog/brands` | Las marcas, para el filtro: salen del índice | Sesión | 0 |
| `POST /api/catalog/products/:id/margin` | `{ before, value }` (R2.7) | «Cambiar márgenes» | 3 |
| `POST /api/catalog/products/:id/unit` | `{ before, value }` (R1.4) | «Cambiar los datos de un producto» | 2 |
| `POST /api/catalog/products/:id/vat` | `{ before, value, undo? }` (R1.4) | «Cambiar los datos de un producto» | 3 |

**Lo que entra** (`src/shared/contracts/catalog.ts`): `q`, hasta 80 letras y 8 palabras (R3.1); `brand`,
hasta 80 letras; `show`, uno de los dos; `after`, la posición en la lista (un entero) o, con «Dados de
baja», la clave y el identificador; `value` del margen, entero de 1 a 10.000 o `null`; la unidad y el
IVA, de su lista; el identificador, un UUID.

**Lo que sale** (`rules/views.ts`, que arma toda respuesta con un producto, también la de un cambio y
la de un `409`):

```ts
type ProductRow = {
  id: string;
  code: string;               // el del proveedor
  barcode: string | null;
  description: string;
  brand: string | null;
  unit: 'un.' | 'kg' | 'm' | 'L';
  vat: 210 | 105 | 270;
  sale?: string;              // en centavos, como texto; sin él, `state` dice por qué
  state: 'priced' | 'no-price' | 'no-cost'; // R2.4, E11: lo ve cualquiera
  // Con «Ver costos» (R4.1):
  margin?: number | null;
  cost?: string;              // en millonésimos, como texto
  supplier?: { id: string; name: string };
};
type ProductsPage = { products: ProductRow[]; next?: string; total: number; noPrice: number; stepCents: number };
type Product = ProductRow & { basis?: CostBasis; steps?: SaleSteps }; // la cuenta, con «Ver costos»
```

- **`total` y `noPrice`** cuentan los que no están dados de baja, con la marca elegida si hay una (E16).
- **`stepCents`** va en cada página, para mostrar los decimales del paso (R2.3).
- **Un cambio** se guarda en una transacción: lee `catalog.pricing` con `for share` y el producto con
  `for update`, compara `before`, guarda, recalcula el precio y anota en Quién hizo qué al confirmar. Si
  una lista del proveedor se está aplicando, espera como mucho 5 s su turno; si no lo tiene, `409
  list-applying`. Contesta el producto nuevo; `409 changed` con el valor de ahora (R1.5, E04); `400` con
  el rango si no vale (E09); `404` si no existe.
- **«Deshacer»** es otro cambio con `before` igual al valor nuevo (R1.4); el del IVA lleva `undo: true`
  y vuelve a `vat_from_list` con `vat_manual = false` si el valor de antes era el de la lista (E23).
- **El margen** acepta `null` (sacarlo): el producto vuelve a «sin precio».

## 4. El precio y el redondeo

- **`salePrice(costMicro, margin, vat, stepCents)`** (`src/shared/pricing/sale.ts`): el precio sin
  redondear en centavos (llevado para arriba), el redondeado al paso y sus pasos para «Así se calcula»
  (el costo, × (1 + margen), × (1 + IVA), el redondeo). Lo usan el servidor (guardar) y la aplicación
  (a2).
- **`roundUp`** (`src/shared/pricing/rounding.ts`) pasa a contar en centavos enteros; el panel de
  Administración y el catálogo usan la misma.
- **Mostrar** (R2.3): `priceText(cents, stepCents)` en `src/shared/money/`, con los decimales del paso;
  el costo, siempre con centavos (`formatPesos`).
- **Lo que escribe precios** recalcula en el mismo `update` que cambia lo que los forma (R2.5):
  - `create`: un producto nuevo no tiene margen, así que no tiene precio (08 · R7.2);
  - `setCosts` y `update` (el IVA de la lista, si no está cambiado a mano): con el margen de cada uno;
  - `dropSupplier`: sin costo, sin precio (R2.4);
  - un cambio de margen o de IVA: el de ese producto.
- **El recálculo del redondeo** (06 · R3.4, R3.5): el catálogo le da a Administración su
  `PriceRecalculator`:
  - `changesWith(step)`: una consulta que cuenta los que cambian (`ceil(raw/step)·step <> sale_cents`);
  - `apply(step)`: en la transacción de Administración, toma `catalog.pricing` con `for update`, vuelve
    a contar (si el número cambió, `409`: 06 · R3.4, E41), cambia el paso y recalcula todos en **una
    sola sentencia**. Con 100.000 precios, menos de 5 s; el avance de 06 § 12.2 no hace falta;
  - `preview()`: el total, cuántos cambian con cada paso y cinco ejemplos. **Sin «Ver costos», los
    ejemplos son inventados** (06 · R3.7): `preview(seesCosts)`.
  - El panel y el recálculo llevan su propio límite: 10 por minuto por sesión.

## 5. Buscar

El índice ([ADR-022](../adr/ADR-022-catalog-search.md)), en `src/shared/search/`:

- **Lo que guarda,** de cada producto que no está dado de baja: un número de orden, su identificador,
  su clave de orden (la descripción como `searchKey`, comparada con `Intl.Collator('es')` una sola vez al
  armar), su marca, si tiene precio, y sus palabras y códigos.
- **Las palabras** de la descripción y la marca, como `searchKey`, partidas por espacios y signos; las de
  menos de 2 letras («8», «x») no cuentan como palabra (sí como parte de un código). Van en un
  vocabulario ordenado (un arreglo de palabras únicas), cada una con la lista de los productos que la
  tienen (un `Uint32Array` ordenado).
- **Los códigos** (del proveedor y de barras) sin signos ni espacios, en un `Map` aparte: un código
  escrito entero se encuentra exacto, sin pasar por el vocabulario (R3.2, E13, E14).
- **Una palabra empezada** («torn»): búsqueda binaria del primer prefijo en el vocabulario y las
  siguientes que empiezan igual.
- **Una palabra con error** (de 4 letras o más, escrita entera, R3.1, E24): las del vocabulario de su
  largo ±1, agrupadas por largo, a una letra de distancia (una que sobra, falta, cambia o se da vuelta
  con la de al lado), con un corte apenas pasan de una diferencia.
- **Varias palabras** (hasta 8): la intersección de sus listas, empezando por la más corta.
- **El orden:** primero el código exacto; después los que tienen todas las palabras sin error; después
  los que tienen alguna con error; dentro de cada grupo, por su número de orden (que ya es el
  alfabético). No se ordena en cada búsqueda: las listas ya están en ese orden.
- **Los filtros** (marca, «Sin precio») se aplican sobre el resultado con lo que guarda cada producto;
  sin nada escrito, el resultado es todos en orden.
- **Las páginas siguientes** no vuelven a buscar: el resultado de la última búsqueda de cada sesión
  queda 1 minuto (por sesión, como mucho uno), y `after` es la posición en él.
- **Al arrancar** se arma con una consulta. **Al confirmar** cada transacción que cambia productos (una
  lista o un cambio), la fachada devuelve lo que cambió (`AfterCommit`) y el índice lo pone al día: un
  producto nuevo se agrega al final del vocabulario de los cambios pendientes, y el índice se vuelve a
  ordenar de una vez, sin frenar los pedidos, cuando termina la transacción grande. Si poner al día
  falla, el índice se vuelve a armar desde la base.
- **El tope** (R3.5): 200.000 productos que no están dados de baja. `create` mira cuántos hay más los
  que crearía y, si se pasa, la lista no se aplica (08 · R7.7, E25).

## 6. Eventos y auditoría

**A Quién hizo qué** (R5.1), grupo «Catálogo»:

| Evento | Texto | Con |
|---|---|---|
| `products.margin-changed` | «Cambió el margen de <producto>: 50 % → 80 %» | El producto, los dos valores y el precio de antes y el de después |
| `products.unit-changed` | «Cambió la unidad de <producto>: un. → kg» | El producto y los dos valores |
| `products.vat-changed` | «Cambió el IVA de <producto>: 21 % → 27 %» | El producto, los dos valores y los dos precios |

- **Rechazos:** sin permiso, el `permission.denied` de la plataforma (E19). Los `409` no se anotan.
- **Los permisos nuevos** (R4.3): `catalog.margins`, con `includes: ['price-lists.costs']` (E18), y
  `catalog.products`, en el grupo «Catálogo» del contrato de permisos. El grupo de los eventos en el
  contrato de la auditoría ya se llama `catalog`: estos se suman ahí.

## 7. Dónde vive cada cosa

### El servidor, `src/server/modules/catalog/`

| Archivo | Qué hace |
|---|---|
| `index.ts` | La fachada (la de 08a, que ahora devuelve lo que cambió, y el `PriceRecalculator`), el registro de las rutas y armar el índice al arrancar |
| `settings.ts` | Páginas de 50, lo buscado (80 letras, 8 palabras), cuánto queda una búsqueda, los límites, la espera de 5 s, el tope de 200.000 |
| `routes/products.ts`, `routes/changes.ts` | La lista, el producto, las marcas y los tres cambios |
| `rules/changes.ts`, `rules/views.ts` | Qué vale de cada cambio y qué ve cada uno (R4.1), sin tecnología |
| `data.ts`, `data-pages.ts`, `data-pricing.ts` | Las consultas |
| `recalculator.ts` | El recálculo del redondeo para Administración |
| `migrations/002-prices.ts` | Las columnas nuevas y `catalog.pricing` |

### Código común

- `src/shared/pricing/sale.ts`: el precio de venta y sus pasos (`salePrice`).
- `src/shared/pricing/rounding.ts`: en centavos.
- `src/shared/money/`: `priceText(cents, stepCents)`.
- `src/shared/search/`: el índice y cómo se parte un texto en palabras y códigos (con `searchKey`, sin
  repetirlo).
- `src/shared/contracts/catalog.ts`: las rutas, los cuerpos y sus rangos.

### Lo que cambia en otros módulos

- **`administration`:** el paso en centavos (la migración, las opciones y el texto del evento viejo), el
  `PriceRecalculator` del catálogo con `preview(seesCosts)` (06 · R3.7) y el panel con los pasos nuevos
  (T136). Su diseño lo dice en § 2.
- **`price-lists`:** la fachada del catálogo ahora devuelve lo que cambió para el índice; `apply/apply-in.ts`
  y `routes/supplier-state.ts` lo corren al confirmar. `create` recibe el código del proveedor. La
  fachada de 08 suma `costBasisOf(productId)` para «Así se calcula», que conecta `server/modules.ts`.
  Una lista que pasaría el tope no se aplica (08 · R7.7).
- **`users`:** los dos permisos nuevos con su inclusión.
- **`audit-log`:** los textos de § 6.

## 8. Conexiones

- **Solo `request`.** El catálogo se pide al buscar y al abrir un producto; nada llega sin pedirlo y no
  hay pedidos automáticos nuevos (constitución, III).

## 9. Seguridad

- **Sesión en todo** (§ 3, E26). Sin «Ver costos», ni el margen, ni el costo, ni el proveedor, ni la
  cuenta: con el margen y el precio se sacaría el costo (R4.1). Lo arma `views.ts` para toda respuesta.
- **El panel del redondeo** no muestra precios calculados reales sin «Ver costos» (06 · R3.7).
- **Lo que entra:** § 3, validado con el contrato.
- **Abuso:**
  - buscar, 120 por minuto por sesión, sin consulta a la base por cada letra, con como mucho 8 palabras
    y el error de tipeo solo desde 4 letras;
  - los cambios, 60 por minuto por persona (no por sesión);
  - el panel y el recálculo del redondeo, 10 por minuto.
- **Memoria:** el tope de 200.000 productos activos (R3.5); unos 60 MB de índice en ese caso; los dados
  de baja, fuera del índice.
- **Precios enormes:** en centavos entran en un `bigint` (§ 1); el contrato los manda como texto.
- **Auditoría:** cada cambio, con quién, los dos valores y los dos precios.
- **Sin datos personales nuevos.**

## 10. Metas de performance

| Qué | Meta |
|---|---|
| Buscar en 100.000 productos | Menos de 100 ms (R3.3, E15), sin consultar la base para buscar; la página, una consulta por clave |
| La lista sin nada escrito | Del índice, y la página por clave |
| Un cambio de margen | 3 consultas, menos de 100 ms (R2.7) |
| Armar el índice al arrancar | 100.000 productos en menos de 2 s, una consulta |
| Contar para el redondeo | Una consulta; recalcular, una sentencia, menos de 5 s con 100.000 |
| Memoria del índice | Unos 30 MB con 100.000 productos |

Estas metas se miden en la tarea 9; si alguna no se cumple, se corrige el ADR-022 antes de seguir.

## 11. Escenarios y pruebas

| Escenario | Dónde se prueba | En a1 |
|---|---|---|
| E01, E03, E10 | La fachada con una lista (servidor) | Sí |
| E02, E09, E23 | El cambio y su «Deshacer» en el servidor; lo que se ve, en a2 | El servidor |
| E04 | Dos cambios con el mismo `before` | Sí |
| E05, E11 | La lista con «Dados de baja» | Sí |
| E06 a E08 | `salePrice` y `priceText` | Sí |
| E12 a E14, E24 | El índice | Sí |
| E15 | `pnpm perf`, con 100.000 | Sí |
| E16 | Los números de la página; lo que se lee arriba, en a2 | El servidor |
| E17, E18, E19, E26 | Las respuestas sin «Ver costos», la inclusión del permiso, el rechazo, sin sesión | Sí |
| E20 | El evento de la auditoría | Sí |
| E21, E22 | El espejo y sin conexión | a2 |
| E25 | Una lista que pasaría el tope | Sí |
| 08 · E28, E72, E76, E95 | Con una lista sobre productos con datos a mano o dados de baja | Sí |
| 08 · E12, E13, E74 | Un producto con dos proveedores | 07c |

- **Primero las pruebas,** una por escenario y las que cuentan las consultas de cada pedido, contra la
  base de pruebas.
- **Sin pruebas de punta a punta:** no hay pantallas en a1.

## 12. Tareas

1. `salePrice`, `roundUp` en centavos y `priceText`, con sus pruebas (E06 a E08).
2. El paso en centavos (T136): la migración de `administration`, el contrato y el texto del evento.
3. La migración `002-prices` (con el código del proveedor copiado de las listas), los permisos y el
   contrato `catalog.ts`.
4. El precio en la fachada, `catalog.pricing` y el `PriceRecalculator`. Depende de 1 a 3.
5. El índice en `src/shared/search/` (ADR-022). Independiente.
6. La lista y las marcas desde el índice, y su puesta al día con la fachada. Depende de 4 y 5.
7. Los tres cambios con su auditoría (R1.4, R1.5, R2.7, R5). Depende de 4.
8. El producto con «Así se calcula» (`costBasisOf` de 08) y `views.ts` (R4.1). Depende de 4.
9. La prueba de performance: buscar, armar el índice, el recálculo y la memoria.
10. Los documentos: la arquitectura («Escala»: el índice en memoria) y el resumen de 07.
