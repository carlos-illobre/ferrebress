# Diseño técnico · 07 · Catálogo (`catalog`), parte a1

El servidor del catálogo y buscar: lo que piden las [reglas](../../chapters/07-catalog/rules.md) (R1 a
R6) y el redondeo nuevo (T136, 06 · R3.2 y R3.6). Las pantallas son de a2. Parte de lo que dejó 08a:
`catalog.products` con el costo de su artículo y la fachada que usan las listas para crear, poner al
día, poner el costo, dar de baja y traer de vuelta productos ([diseño de 08](price-lists.md), § 1).

## 1. La idea técnica

- **El precio se guarda,** no se calcula al leer: buscar y ordenar 100.000 productos por precio, el
  número de «Sin precio» y el recálculo del redondeo con su confirmación (06 · R3.4, R3.5) necesitan el
  precio en la tabla. Se calcula en un solo lugar, `src/shared/pricing/sale.ts`, en `BigInt`, igual en
  el servidor y en la aplicación, y se vuelve a calcular en la misma transacción que cambia lo que lo
  forma: el costo (la fachada que usan las listas), el margen, el IVA y el paso del redondeo (R2.5).
- **El margen es un número del producto,** no una referencia a un margen rápido: cambiar los márgenes
  rápidos de Administración no cambia precios (06 · R4.3).
- **Buscar es un índice en la memoria del servidor** ([ADR-022](../adr/ADR-022-catalog-search.md)): de
  cada producto, sus palabras sin acentos ni mayúsculas y sus códigos sin signos. Contesta con los
  identificadores en orden y la página sale de la base con una consulta por clave. Se arma al arrancar
  y se pone al día al confirmar cada transacción que cambia productos (la de una lista o la de un
  cambio de margen, unidad o IVA), con lo que devuelven las funciones de la fachada (`AfterCommit`).
- **El redondeo nuevo cuenta en centavos** (T136): el paso pasa a guardarse en centavos (5 a 1.000.000;
  1 es «sin redondeo», un centavo). El precio se guarda en millonésimos, como el costo, y se redondea
  al múltiplo del paso.
- **Cambiar un dato choca solo con quien cambió el mismo** (R1.5): el pedido manda el valor que vio
  (`before`) y el nuevo; si en la base hay otro, `409` con el de ahora, como los datos de un proveedor.

## 2. Entidades

### `catalog.products` (migración `002-margins`)

| Columna | Tipo | Para qué |
|---|---|---|
| `margin` | `integer`, `null` | Porcentaje entero de 1 a 10.000 (R2.1); `null`, sin margen |
| `price` | `bigint`, `null` | El precio de venta redondeado, en millonésimos; `null` sin margen o sin costo (R2.4) |
| `search_key` | `text`, `not null` | El código, la descripción y la marca como `searchKey`, para armar el índice al arrancar |

- **Índices:** `(lower(description))` para el orden alfabético de la lista (R3.4); `(brand)` para el
  filtro y la lista de marcas; `(price) where price is null` para contar «Sin precio».
- **La unidad y el IVA** ya están, con `unit_manual` y `vat_manual` (08a): cambiarlos a mano pone
  `true` y ninguna lista los vuelve a tocar (R1.3).
- **El código de barras** ya está; el código del proveedor vive en `price_lists.items` y el índice lo
  toma de ahí al armarse (la fachada de 08 lo da, una lectura por arranque).

### El paso del redondeo (T136, migración de `administration`)

`administration.settings` pasa `roundingStep` a centavos: la migración multiplica por 100 el valor
guardado, y 0 («sin redondeo») pasa a 1. Las opciones del contrato pasan a ser los 1 o 5 seguidos de
ceros de 5 a 1.000.000, y 1 (06 · R3.2).

## 3. API

| Ruta | Qué | Permiso | Consultas |
|---|---|---|---|
| `GET /api/catalog/products` | `?q=&brand=&show=noPrice|discontinued&after=`: de a 50, en el orden de buscar o el alfabético, con el total y cuántos sin precio (R3) | Ninguno | 2: la página y los números |
| `GET /api/catalog/products/:id` | El producto; con «Ver costos», su proveedor, su costo con la cuenta y «Así se calcula» (R2.6, R4.1) | Ninguno | 1, o 2 con «Ver costos» |
| `GET /api/catalog/brands` | Las marcas, para el filtro (R3.4) | Ninguno | 1 |
| `POST /api/catalog/products/:id/margin` | `{ before, value }` (R2.7) | «Cambiar márgenes» | 2 |
| `POST /api/catalog/products/:id/unit` | `{ before, value }` (R1.4) | «Cambiar los datos de un producto» | 2 |
| `POST /api/catalog/products/:id/vat` | `{ before, value }` (R1.4) | «Cambiar los datos de un producto» | 2 |

- **Sin «Ver costos»** las respuestas no traen el costo, el proveedor ni la cuenta: se arman sin
  esos campos, no se ocultan en la pantalla (R4.1).
- **Un cambio** se guarda en una transacción: lee el producto con `for update`, compara `before`,
  guarda, recalcula el precio y anota en Quién hizo qué al confirmar. Contesta el producto nuevo;
  `409 changed` con el valor de ahora (R1.5, E04); `400` con el rango si no vale (E09); `404` si no
  existe.
- **«Deshacer»** es otro cambio con `before` igual al valor nuevo (R1.4).
- **El margen** acepta `null` (sacarlo): el producto vuelve a «sin precio».
- **`after`** es la posición en la lista del índice (buscar) o la descripción con el identificador (la
  lista alfabética), con su forma validada.
- **Lo que cambia en `price-lists`:** la fachada `create` y `setCosts` ya reciben el costo; ahora el
  catálogo calcula el precio con el margen y el paso de ese momento en la misma transacción (R2.5,
  E10). La pantalla de un proveedor (08 · R8) no cambia hasta a2.

## 4. El precio y el redondeo

- **`src/shared/pricing/sale.ts`:** `saleOf(cost, margin, vat, step)` da el precio sin redondear, el
  redondeado y sus pasos («Así se calcula»), en `BigInt` y millonésimos: costo × (1 + margen/100) ×
  (1 + IVA/1000), y para arriba al múltiplo de `step` centavos (R2.2). Lo usan el servidor (guardar) y
  la aplicación («Así se calcula» en a2).
- **`rounding.ts`** pasa a contar en centavos enteros; el panel de Administración muestra el paso con
  `formatPesos` y sus decimales (T136).
- **El recálculo del redondeo** (06 · R3.4, R3.5): el catálogo le da a Administración su
  `PriceRecalculator`. `changesWith(step)` cuenta en SQL los productos cuyo precio cambia; `apply`
  recalcula todos los que tienen margen y costo, de a 1.000, en la transacción de Administración.
  `preview` da el total, cuántos cambian con cada paso de la lista y cinco ejemplos.
- **Mostrar** (R2.3): `formatPesos` con los decimales del paso, una función de `src/shared/money/`
  (`priceText(micro, step)`); el costo, siempre con centavos.

## 5. Buscar

- **El índice** (`search/index.ts`, ADR-022): por producto, las palabras de la descripción y la marca
  y los códigos (del proveedor y de barras) sin signos. Una palabra empezada encuentra las que empiezan
  así (un arreglo ordenado de palabras, con búsqueda binaria); una con un error de tipeo, las que
  quedan a una letra de distancia, entre las del mismo largo ±1 (R3.1, E12). Varias palabras: los que
  tienen todas, en cualquier orden.
- **El orden:** primero el código escrito entero, del proveedor o de barras (R3.2, E13, E14); después
  los que tienen todas las palabras sin error, y al final los que tienen alguna con error; dentro de
  cada grupo, por descripción. Un dado de baja no aparece, salvo con el filtro «Dados de baja» (R1.6).
- **Los filtros** (marca, «Sin precio», «Dados de baja») se aplican sobre el índice, que guarda de cada
  producto su marca, si tiene precio y si está dado de baja.
- **Sin nada escrito,** la lista sale de la base por orden alfabético, con el índice de la descripción.

## 6. Eventos y auditoría

**A Quién hizo qué** (R5.1), grupo «Catálogo»:

| Evento | Texto | Con |
|---|---|---|
| `products.margin-changed` | «Cambió el margen de <producto>: 50 % → 80 %» | El producto y los dos valores |
| `products.unit-changed` | «Cambió la unidad de <producto>: un. → kg» | Igual |
| `products.vat-changed` | «Cambió el IVA de <producto>: 21 % → 27 %» | Igual |

- **Rechazos:** sin permiso, el `permission.denied` de la plataforma (E19). Los `409` no se anotan.
- **Los permisos nuevos** (R4.3): `catalog.margins` (incluye `price-lists.costs`) y
  `catalog.products`, en el grupo «Catálogo» del contrato de permisos.

## 7. Dónde vive cada cosa

### El servidor, `src/server/modules/catalog/`

| Archivo | Qué hace |
|---|---|
| `index.ts` | La fachada (la de 08a y el `PriceRecalculator`), el registro de las rutas y armar el índice al arrancar |
| `settings.ts` | Páginas de 50, el tope de lo buscado (80 letras), los cambios por minuto, las tandas del recálculo |
| `routes/products.ts`, `routes/changes.ts` | La lista, el producto, las marcas y los tres cambios |
| `rules/changes.ts`, `rules/views.ts` | Qué vale de cada cambio y qué ve cada uno (R4.1), sin tecnología |
| `search/index.ts`, `search/words.ts` | El índice y cómo se parte un texto en palabras y códigos |
| `data.ts`, `data-pages.ts` | Las consultas |
| `recalculator.ts` | El recálculo del redondeo para Administración |
| `migrations/002-margins.ts` | Las columnas nuevas |

### Código común

- `src/shared/pricing/sale.ts`: el precio de venta y sus pasos.
- `src/shared/money/`: `priceText(micro, step)`, con los decimales del paso.
- `src/shared/contracts/catalog.ts`: las rutas, los cuerpos y sus rangos (el margen de 1 a 10.000, las
  unidades, los IVA).
- `src/shared/contracts/administration.ts`: el paso en centavos (T136).

### Lo que cambia en otros módulos

- **`administration`:** el paso en centavos (la migración y las opciones), el `PriceRecalculator` del
  catálogo, y el panel del redondeo con los pasos nuevos (T136).
- **`price-lists`:** nada en su código: la fachada del catálogo calcula el precio sola.
- **`users`:** los dos permisos nuevos con su inclusión.
- **`audit-log`:** el grupo «Catálogo» y los textos de § 6.

## 8. Conexiones

- **Solo `request`.** El catálogo se pide al buscar y al abrir un producto; nada llega sin pedirlo y no
  hay pedidos automáticos nuevos (constitución, III). Un precio que cambió por una lista se ve al
  volver a pedir.

## 9. Seguridad

- **Quién puede cada cosa:** § 3; el servidor mira el permiso en cada ruta (R4.2). Sin «Ver costos», la
  respuesta no trae el costo ni el proveedor (R4.1).
- **Lo que entra:** el margen, entero de 1 a 10.000 o `null`; la unidad y el IVA, de su lista; `q` de
  hasta 80 letras; `after` con su forma; el identificador, un UUID (`uuidParams`).
- **Abuso:** 60 cambios por minuto por sesión; buscar, sin consulta por cada letra (el índice en
  memoria) y con la página de a 50.
- **Precios enormes:** el costo ya tiene tope de $ 1 billón (08) y el margen de 10.000 %: el precio
  entra en un `bigint`.
- **Sin datos personales nuevos.**

## 10. Metas de performance

| Qué | Meta |
|---|---|
| Buscar en 100.000 productos | Menos de 100 ms (R3.3, E15): el índice en memoria, y una consulta por clave para la página |
| La lista sin nada escrito | 2 consultas, con índice |
| Un cambio de margen | 2 consultas y el precio nuevo en la respuesta; menos de 100 ms (R2.7) |
| Armar el índice al arrancar | 100.000 productos en menos de 2 s, una consulta |
| El recálculo del redondeo | 100.000 precios en menos de 30 s, de a 1.000 |
| Memoria del índice | Unos 30 MB con 100.000 productos |

## 11. Pruebas y tareas

- **Primero las pruebas,** una por escenario y las que cuentan las consultas de cada pedido, contra la
  base de pruebas.
- **Buscar** se prueba con productos inventados (E12 a E14) y su tiempo con 100.000 (E15), aparte de
  las rápidas (`pnpm perf`).
- **Sin pruebas de punta a punta:** no hay pantallas en a1.

Las tareas, en orden:

1. El precio de venta en `src/shared/pricing/sale.ts` y `priceText`, con sus pruebas (E06 a E08).
2. El paso en centavos (T136): la migración de `administration`, el contrato y `rounding.ts`.
3. La migración `002-margins`, los permisos y el contrato `catalog.ts`.
4. El precio en la fachada (crear y poner el costo) y el `PriceRecalculator`. Depende de 1 a 3.
5. Los tres cambios con su auditoría (R1.4, R1.5, R2.7, R5). Depende de 3 y 4.
6. El índice de buscar y la lista (R3, ADR-022). Depende de 3.
7. El producto y las marcas (R4.1). Depende de 4.
8. La prueba de performance.
9. Los documentos: la arquitectura («Escala»: el índice en memoria) y el resumen de 07.
