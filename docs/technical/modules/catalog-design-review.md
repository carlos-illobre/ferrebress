# Revisión del diseño · 07 · Catálogo, parte a1 (el servidor y buscar)

Revisa [catalog.md](catalog.md) y el [ADR-022](../adr/ADR-022-catalog-search.md) (propuesto) contra las
[reglas de 07](../../chapters/07-catalog/rules.md) (R1 a R6, E01 a E22) y su
[resumen](../../chapters/07-catalog/summary.md), la [constitución](../../project/constitution.md), la
[arquitectura](../architecture.md), el [glosario](../../project/glossary.md), el diseño de 08
([price-lists.md](price-lists.md)) y el código que ya existe del catálogo y de lo que lo rodea:
`src/server/modules/catalog/` (la fachada, `data.ts` y la migración `001-products`),
`price-lists/apply/apply-in.ts`, `apply/service.ts` y `routes/supplier-state.ts` (quienes llaman a la
fachada), `src/server/platform/events.ts` y `guards.ts`, `administration/routes.ts` y
`recalculator.ts`, `src/shared/pricing/`, `src/shared/text/search-key.ts`,
`src/shared/audit-log/administration.ts` y `src/shared/contracts/administration.ts`. También revisa el
cambio de T132 en [administration.md](administration.md) (los cuatro ajustes de «La entrada», 06 · R11)
contra 06 · R2.4 y R11, el capítulo 15 y el código de `sign-in` que lo toma
(`sign-in/settings.ts`, `offline/rules.ts`) y del celular (`app/modules/sign-in/offline/option.ts`).

Gravedad: **Frena** = hay que resolverlo, o que Carlos lo decida, antes de aprobar el diseño;
**Mejora** = conviene, pero no frena.

**Lo que no pude comprobar:** no hay código de 07 ni medidas. No medí cuánto ocupa el índice (el diseño
dice 30 MB), cuánto tarda en armarse (2 s), cuánto tarda una búsqueda con error de tipeo ni cuánto tarda
PostgreSQL en actualizar 100.000 filas. No miré cuánto espera la aplicación una respuesta antes de darla
por perdida ni si Caddy corta pedidos largos, que importan para el recálculo de 30 s (F8). No sé
qué intercalación (`collation`) tiene la base de producción ni la de PGlite, que importa para el orden
alfabético (F7). Donde hago cuentas de volumen, digo el supuesto.

**Resumen.** Lo de fondo está bien: guardar el precio en vez de calcularlo al leer, el margen como número
del producto y no como referencia al margen rápido, el `before` para no pisar al otro, una sola cuenta en
`src/shared/pricing/`, y un índice propio en la memoria para tener exactamente el orden que piden las
reglas. Frenan, de más grave a menos:

- **Las fronteras con 08:** el diseño hace que `catalog` lea de `price-lists`, que ya escribe en
  `catalog`: un ciclo (F1). Dice que `price-lists` no cambia, pero la fachada tiene que devolver lo que
  pone al día el índice (F2), y el precio no se recalcula en dos caminos que lo cambian (F3).
- **El precio:** tres transacciones escriben precios a la vez (una lista, un cambio de margen y el
  recálculo del redondeo) sin un orden entre ellas, y eso rompe 06 · R3.5, E41 y la meta de 100 ms (F4);
  el precio no entra en un `bigint` con los topes de hoy (F5).
- **Buscar:** el diseño no alcanza para creer ni para reconstruir los 100 ms con un error de tipeo en
  100.000 productos (F6); la lista sin nada escrito sale de la base con otro orden y con índices que no
  sirven para los filtros (F7); y el recálculo del redondeo tarda 30 s dentro de un pedido, sin el avance
  que Carlos dejó para este módulo (F8).
- **Lo que falta para reconstruirlo:** la forma de las respuestas (F9), el paso en centavos que
  `administration.md` todavía no dice y la auditoría vieja del redondeo (F10), qué pasa con «Deshacer»
  del IVA (F11), la tabla de escenarios y pruebas (F12) y, en T132, cómo llegan las horas sin conexión
  al celular (F13).

Las consultas por pedido, contadas desde el diseño:

| Pedido | El diseño | Lo que veo |
|---|---|---|
| Buscar con texto | 2 | 1 (la página por clave); los números salen del índice |
| Lista sin texto | 2 | 2, pero con «Sin precio», «Dados de baja» o una marca chica, ninguno de los índices propuestos evita recorrer la tabla (F7) |
| El producto | 1, o 2 con «Ver costos» | 1, o 2 o 3 con «Ver costos»: el proveedor y la cuenta son de `price-lists` (F1) |
| Las marcas | 1 | 1, pero `select distinct` recorre el índice entero (F7) |
| Un cambio | 2 | 2 más abrir y confirmar; puede esperar hasta 30 s si hay una lista aplicándose (F4) |
| Recalcular el redondeo | Sin número | Unas 200 (100 tandas de leer y escribir), dentro del pedido (F8) |
| Contar para el redondeo | Sin número | 1, con la cuenta del precio escrita otra vez en SQL (F8) |
| Armar el índice | 1 | 2: los productos y los códigos del proveedor, que están en `price_lists.items` (F1) |

## Frena

### F1 · `catalog` lee de `price-lists`, que ya escribe en `catalog`: un ciclo

**Dónde:** § 2 («el código del proveedor vive en `price_lists.items` y el índice lo toma de ahí… la
fachada de 08 lo da»); § 3 (`GET /products/:id`: «su proveedor, su costo con la cuenta»).

**Qué veo:** [price-lists.md](price-lists.md), § 1: «la dependencia va en un solo sentido:
`price-lists` escribe en `catalog` por su fachada, y `catalog` no conoce a `price-lists`». La
arquitectura prohíbe los ciclos. El diseño de 07 necesita tres cosas de `price-lists`: el código del
proveedor (para buscar), el nombre del proveedor y la cuenta del costo (la base `basis`, en
`price_lists.items`).

**Qué propongo**, con las opciones:

- **El código:** que la fachada lo reciba en `create` y `update` (`supplierCode`) y que `catalog` lo
  guarde (`supplier_code`). Es lo que busca, así que es suyo. En 07c, con varios proveedores, pasa a una
  tabla de códigos del producto. Es lo más simple.
- **El proveedor y la cuenta:** (a) los da `price-lists` en su propia ruta
  (`GET /api/price-lists/products/:id/cost`, con «Ver costos», que es su permiso), y la ficha de a2 la
  pide aparte solo si la persona puede verla; o (b) `catalog` define una interfaz (`CostDetails`) que
  `price-lists` cumple y `main.ts` conecta, como el `PriceRecalculator` de Administración. La (a) es
  más simple y deja el permiso donde vive; la (b) da un solo pedido.

### F2 · La fachada no devuelve nada y `price-lists` sí cambia

**Dónde:** § 1 («con lo que devuelven las funciones de la fachada (`AfterCommit`)»); § 7, «`price-lists`:
nada en su código».

**Qué veo:** las siete funciones de hoy devuelven `Promise<void>`. Las llaman dos lugares, cada uno con
su transacción: `apply/apply-in.ts` (aplicar, que junta su `after` y lo corre en `finished`) y
`routes/supplier-state.ts` (cómo cobra con «Recalcular», y dar de baja). Para que el índice se ponga al
día al confirmar, cada llamada tiene que juntar lo que devuelve la fachada y correrlo después: es un
cambio en `price-lists`, en los dos archivos, y en sus pruebas. Además, el índice tiene que enterarse
de la descripción, la marca y el código de barras que trae `update`, y del precio que queda después de
`setCosts` (para «tiene precio»).

**Qué propongo:** decir el cambio de firma (`Promise<AfterCommit>`), los lugares de `price-lists` que
cambian y una tarea para eso, que depende de la 4. La otra opción, que el índice se ponga al día solo
leyendo la base (una columna de versión que se mira en cada búsqueda), no necesita tocar `price-lists`
y serviría con varias copias, pero las versiones de transacciones largas se confirman fuera de orden y
es más difícil hacerla bien: no la recomiendo para hoy.

### F3 · El precio no se recalcula en todos los caminos que lo cambian

**Dónde:** § 3, «Lo que cambia en `price-lists`»; § 1, «El precio se guarda».

**Qué propone:** `create` y `setCosts` calculan el precio con el margen y el paso de ese momento.

**Qué veo:** la fachada de hoy tiene siete funciones y tres de ellas cambian lo que forma el precio o lo
que guarda el índice:

- `create`: un producto nuevo no tiene margen (R2.1), así que su precio es siempre `null`. Acá no hay
  nada que calcular; nombrarlo confunde.
- `update` cambia el IVA cuando no se cambió a mano (`vat = case when p.vat_manual …`). R2.5 dice que el
  precio cambia cuando cambia el IVA, y el diseño no lo recalcula en `update`. Una lista que pasa un
  producto de 21 % a 10,5 % le deja el precio viejo. Además `update` cambia la descripción, la marca y el
  código de barras, que son lo que busca el índice.
- `dropSupplier` (dar de baja un proveedor, 08 · R2.4) pone el costo en `null`: el precio tiene que
  pasar a `null` («sin costo», R2.4) en la misma sentencia.
- `discontinue` y `restore` cambian lo que el índice guarda de cada producto («dado de baja», R1.6, E05).

**Qué propongo:** una tabla en el diseño con cada función de la fachada, qué columnas cambia, si
recalcula el precio y qué le pasa al índice. `update` y `dropSupplier` recalculan; `create` no.

### F4 · Tres transacciones escriben precios sin un orden entre ellas

**Dónde:** § 1, § 3 («lee el producto con `for update`… recalcula el precio») y § 4.

**Qué veo:** el paso del redondeo vive en la memoria de `administration` y se pone al día **después** de
confirmar (código de `administration/routes.ts`). Escriben precios:

- una lista (08), en una transacción de hasta 30 s (meta de 08 con 10.000 filas), de a tandas;
- un cambio de margen, de unidad o de IVA, corto;
- el recálculo del redondeo, que toca todos.

Y pasan estas cosas:

- **Precios con el paso viejo (06 · R3.5).** Un cambio de margen lee el paso de la memoria, el
  recálculo confirma con el paso nuevo, y el cambio de margen guarda su precio con el viejo. Lo mismo
  una tanda de una lista que empezó antes.
- **Un cambio que se pierde.** Si el recálculo lee los productos en TypeScript y después escribe, puede
  pisar el precio de un margen que cambió entre que leyó y escribió.
- **Trabas cruzadas.** La lista traba los productos en el orden de la lista y el recálculo en el de
  `id`: PostgreSQL corta una de las dos por bloqueo mutuo, y falla la lista o falla el redondeo
  (`503 recalc-failed`) sin que nadie entienda por qué.
- **Los 100 ms de R2.7.** Un cambio de margen sobre un producto que una lista ya tocó espera a que la
  lista confirme: hasta 30 s.
- **E41 sin garantía.** Administración cuenta los precios que cambian **antes** de abrir la transacción
  (`changesWith` en `routes.ts`) y después aplica; si en el medio cambian costos, aplica un número que
  nadie confirmó.

**Qué propongo:**

- Que el precio se escriba siempre con una sentencia que lo calcule desde lo que tiene la fila
  (`raw_price` de F8, o la cuenta entera): en PostgreSQL, un `update` que esperó una traba vuelve a leer
  la fila nueva, y no pisa nada.
- Que el catálogo tenga su propia copia del paso en una fila (`catalog.pricing`), que el recálculo
  cambia en la misma transacción. Toda escritura de precios la lee con `for share` al empezar. Así una
  lista o un margen esperan a que termine un recálculo y leen el paso nuevo, y un recálculo espera a que
  terminen las listas abiertas: queda un solo orden, sin trabas cruzadas.
- Que el recálculo y el cambio de margen esperen poco (`lock_timeout`, en `settings.ts`) y, si hay una
  lista aplicándose, contesten `409 list-applying` con «Se está aplicando una lista: probá en un
  momento», en vez de colgarse. Es un texto nuevo para Carlos.
- Que `apply(step, trx, confirmed)` cuente **dentro** de la transacción, ya trabado, y devuelva «volvé a
  preguntar» si el número no es el confirmado (06 · R3.4, E41). Es un cambio chico en la interfaz de
  `PriceRecalculator` y en `administration/routes.ts`.

### F5 · El precio no entra en un `bigint`

**Dónde:** § 9, «Precios enormes: … el precio entra en un `bigint`».

**Qué veo:** el tope de 08 es $ 1 billón por precio de lista, en millonésimos 10^18
(`price-lists/rules/cells.ts`, `maxPrice`). Con margen 10.000 % e IVA 27 %, el precio es 10^18 × 101 ×
1,27 ≈ 1,3 × 10^20 millonésimos, y un `bigint` llega a 9,2 × 10^18. Pasa con un costo de más de unos
$ 72.000 millones con margen 10.000 %: es un número absurdo, pero entra, y una sola fila así hace fallar
la lista entera o el cambio de margen con un error de la base. Además, si la cuenta se hace en SQL, el
producto intermedio (costo × (100 + margen) × (1000 + IVA)) desborda mucho antes.

**Qué propongo:** guardar el precio **en centavos**: siempre es un múltiplo del paso, que es un número
entero de centavos (06 · R3.2). Con centavos, el más grande es 1,3 × 10^16 y entra. En SQL, la cuenta en
`numeric`. Y decir cómo corta cada división: en BigInt, `/` corta para abajo, y el precio tiene que ir
siempre para arriba (E08: $ 10,123 → $ 10,13). Si se corta al millonésimo antes de redondear, un precio
de $ 10,0000004 se cobra $ 10,00 en vez de $ 10,01. La fórmula tiene que estar escrita con su redondeo,
para que quien la reconstruya no elija otro.

### F6 · Buscar con un error de tipeo en 100.000 productos: el diseño no alcanza para creer los 100 ms

**Dónde:** § 5 y ADR-022.

**Qué propone:** un arreglo ordenado de palabras con búsqueda binaria para las empezadas; para el error de
tipeo, «las que quedan a una letra de distancia, entre las del mismo largo ±1»; después ordenar por
descripción.

**Qué veo, con supuestos** (descripciones de unas 6 palabras, un código del proveedor y la mitad con
código de barras):

- **El vocabulario lo llenan los códigos.** Con los códigos como palabras, hay unos 150.000 códigos
  distintos además de unas 20.000 a 50.000 palabras. Comparar una palabra de 8 letras con todas las de 7
  a 9 letras es comparar con buena parte de los códigos: decenas de miles de comparaciones de distancia
  por palabra escrita, y varias palabras por búsqueda. Eso puede pasar los 100 ms solo, y además
  devuelve códigos parecidos a una palabra, que nadie busca así (R3.2 pide el código **entero**).
- **Las palabras cortas.** Con «8 x 1» (E12), «x» y «1» empiezan miles de palabras y de códigos, y con un
  error de tipeo una palabra de una o dos letras está a una letra de casi todas las de su largo. Hace
  falta un largo mínimo para el error de tipeo (por ejemplo, desde 4 letras) y un largo mínimo, o un
  tope, para las empezadas.
- **Ordenar por descripción en cada búsqueda.** Una búsqueda de una palabra común puede encontrar decenas
  de miles de productos. Ordenarlos con `localeCompare` cada vez pasa los 100 ms con facilidad. Hace falta
  el orden alfabético calculado de antemano, como un número por producto, y ordenar por ese número.
- **Las estructuras no están escritas.** Para reconstruirlo hacen falta: un número interno por producto
  (no el UUID), la lista de productos de cada palabra (ordenada, en un `Uint32Array`), cómo se cruzan
  las de varias palabras (empezando por la más corta), cómo se encuentran las palabras a una letra (un
  árbol de letras que se recorre con un error permitido, o el índice de «palabras con una letra
  borrada»), y dónde se cortan los resultados.
- **Una palabra a medio escribir con un error.** Con el diseño, «tormil» no encuentra nada hasta que se
  completa «tormillo»: el error de tipeo vale solo para la palabra entera. En el mostrador se escribe de a
  una letra y se mira la lista; un árbol de letras da sin costo «empezada y con un error». R3.1 no dice
  cuál; se le pregunta a Carlos.
- **Qué es un error de tipeo.** Con la distancia de Levenshtein, dos letras cambiadas de lugar
  («tornilol») son dos errores. Es el error más común al tipear. Conviene contarlo como uno (la
  distancia de Damerau), y decirlo.

**Qué propongo:** escribir las estructuras, sacar los códigos del error de tipeo (los códigos: entero o
empezado, sin error), un largo mínimo para el error y un orden alfabético guardado como número. Y que la
prueba de E15 use un catálogo con la forma de uno de ferretería (descripciones con números y medidas,
códigos alfanuméricos, marcas repetidas), con las búsquedas difíciles: una letra, un número, una
palabra común, tres palabras con un error. Con eso medido, la meta es creíble; sin eso, no.

### F7 · La lista sin nada escrito sale de la base con otro orden y con índices que no sirven para los filtros

**Dónde:** § 2, «Índices»; § 5, «Sin nada escrito».

**Qué propone:** la lista alfabética, con `(lower(description))`; el filtro de marca, con `(brand)`; los
«Sin precio», con `(price) where price is null`.

**Qué veo:**

- **Dos órdenes distintos.** Con texto, el índice ordena «por descripción» en TypeScript; sin texto,
  la base ordena por `lower(description)` con su intercalación. Con una intercalación `C` (no sé cuál
  tienen producción y PGlite), «Ácido» va después de «Zapata». La misma descripción quedaría en otro
  lugar según haya algo escrito o no, y las pruebas en PGlite pueden pasar con un orden que producción
  no tiene.
- **Los filtros recorren la tabla.** Con «Sin precio» y pocos sin precio (E16: 4 de 30; en 100.000
  pueden ser 200), la base recorre el índice alfabético descartando hasta llenar 50: casi toda la tabla.
  Lo mismo con «Dados de baja» y con una marca chica. El índice parcial `(price) where price is null`
  no sirve para ordenar, y contar el total en la misma consulta ya recorre todo. Ninguno excluye a los
  dados de baja, que R1.6 saca de la lista.
- **Las marcas:** `select distinct brand` recorre el índice entero en cada pedido (PostgreSQL no salta
  entre valores de un índice).

**Qué propongo:** que **toda** lista salga del índice en memoria, con o sin texto: el índice ya tiene la
marca, «tiene precio» y «dado de baja» de cada producto (§ 5) y el orden alfabético (F6). La base da
solo las 50 filas por clave. Se van los tres índices, `data-pages.ts` y la segunda consulta; el orden es
uno solo, los números salen del índice y las marcas también (contadas, así la lista de marcas puede
decir cuántos productos tiene cada una). Si se prefiere la base, hacen falta índices compuestos y
parciales (`(sort_key, id) where not discontinued`, `(brand, sort_key, id) where not discontinued`,
`(sort_key, id) where price is null and not discontinued`, `(sort_key, id) where discontinued`), con
`sort_key` = `searchKey(description)` para no depender de la intercalación.

### F8 · El recálculo del redondeo: 30 s dentro del pedido, la cuenta repetida en SQL y sin avance

**Dónde:** § 4, «El recálculo del redondeo»; § 10.

**Qué propone:** `changesWith(step)` cuenta en SQL; `apply` recalcula de a 1.000 en la transacción de
Administración; meta, 100.000 en menos de 30 s.

**Qué veo:**

- **Contar en SQL** los precios que cambian necesita la cuenta entera del precio (costo, margen, IVA,
  redondeo) escrita en SQL, otra vez, al lado de `sale.ts`. Si las dos difieren en un centavo (cómo
  corta cada una), el número que se confirma no es el que se aplica, y 06 · R3.4 vuelve a preguntar
  sin fin.
- **`preview`** cuenta «con cada paso de la lista»: son 13 pasos. El diseño no dice si es una consulta
  con 13 cuentas o 13 consultas, ni su meta con 100.000 (la de 06 es «menos de 100 ms con 10.000»).
- **`apply`** lee y escribe de a 1.000: unas 200 sentencias en una sola transacción, hasta 30 s, dentro
  del `POST` de Administración. Mientras tanto quedan trabados los precios que ya tocó (F4) y la
  aplicación espera la respuesta sin saber cuánto falta. La constitución (II) pide que lo que tarda
  muestre su avance, y [administration.md](administration.md) (§ 6 y § 12.2) dejó escrito que el avance
  del recálculo («1.263 de 1.650») **se programa con el catálogo**. Este diseño no lo nombra.

**Qué propongo:** guardar también el precio **sin redondear**, ya llevado para arriba al centavo
(`raw_price`). Llevar para arriba al centavo y después al paso da lo mismo que llevar directo al paso,
porque el paso es un número entero de centavos. Con eso:

- recalcular es **una sola sentencia**, `update … set sale_price = ceil(raw_price / paso) * paso`, sin
  leer nada a TypeScript (estimo uno o dos segundos con 100.000 filas, sin medirlo);
- contar es una consulta con una cuenta por paso (`count(*) filter (where …)`), con la única cuenta que
  se repite en SQL, la de redondear para arriba, que se prueba contra `src/shared/pricing/rounding.ts`
  con los mismos casos;
- con uno o dos segundos el avance quizá no haga falta. Se le pregunta a Carlos si deja el avance de
  § 12.2 de 06 o lo saca; si lo deja, es un tema `temporary` y va a [mobile-data.md](../mobile-data.md).

Y en todo caso, la meta del conteo con 100.000 y el límite propio de pedidos que 06 (§ 8) pidió para el
recálculo y para el `GET` de sus números, que el diseño no pone.

### F9 · La forma de las respuestas

**Dónde:** § 3.

**Qué veo:** no dice qué trae cada producto de la lista ni de la ficha. Sin eso, a2 no se puede
construir solo con el diseño, y hay reglas que dependen de un campo:

- **«Sin precio» o «sin costo» sin «Ver costos»** (R2.4, E11, E17): los dos tienen el precio en `null`.
  Quien no ve costos tiene que saber cuál de los dos es, sin ver el costo: hace falta un campo de estado
  (`priced`, `noMargin`, `noCost`) que no dependa del permiso.
- **Con cuántos decimales se muestra** (R2.3): la respuesta tiene que traer el paso (o sus decimales),
  así la aplicación no pide Administración para mostrar un precio.
- **La cuenta** («Así se calcula», R2.6): el costo, el margen, el IVA y el paso con que se calculó, para
  que la aplicación la rehaga con `sale.ts` y muestre el precio nuevo en menos de 100 ms (R2.7) antes de
  que conteste el servidor.
- **Los millonésimos y los centavos como texto**, como en 08: PGlite da un `bigint` como número y pierde
  precisión.

**Qué propongo:** los tipos de `src/shared/contracts/catalog.ts` escritos en el diseño: el producto de la
lista, la ficha sin y con «Ver costos», los números y los errores (`409 changed` con el valor de ahora,
`400` con el rango, `403`, `404`).

### F10 · El paso en centavos no está en `administration.md`, y la auditoría vieja se leería mal

**Dónde:** catalog.md, § 2 («El paso del redondeo») y § 7; administration.md, § 2.

**Qué veo:**

- `administration.md`, § 2, sigue diciendo «`roundingStep`: entero en pesos; 0 es "sin redondeo"; uno
  de 0, 10, 50, 100, 500, 1000, 5000», que ya no es 06 · R3.2. Quien reconstruya leyendo los dos diseños
  encuentra dos verdades. El cambio de T136 se escribe en el diseño que es dueño del ajuste.
- **Quién hizo qué guarda los valores tal cual** (`changes.value.before/after`), y la auditoría no se
  modifica. Hoy `src/shared/audit-log/administration.ts` muestra el paso con `pesos(Number(raw))`.
  Después de la migración, un cambio viejo «1000 → 5000» (pesos) se leería «$ 10 → $ 50» si la vista
  pasa a centavos.
- `RoundingExample.calculated` es un `number` en pesos; con 07 tiene que ser texto en centavos, y los
  «cinco ejemplos» no dicen cuáles (¿los que más cambian? ¿cinco al azar?).

**Qué propongo:** pasar T136 a `administration.md`. Para la auditoría: guardar los cambios nuevos del
redondeo con otra clave (`roundingStepCents`) o con la unidad en `data`, y que la vista lea cada uno
según su forma. Y escribir la forma nueva de la respuesta del panel y qué ejemplos da.

### F11 · «Deshacer» el IVA deja el producto como cambiado a mano

**Dónde:** § 3, «"Deshacer" es otro cambio con `before` igual al valor nuevo»; § 2, `vat_manual`.

**Qué veo:** cambiar el IVA pone `vat_manual = true`, y desde ahí ninguna lista lo vuelve a tocar (R1.3,
E03). Si la persona se equivocó y toca «Deshacer», el IVA vuelve al de antes, pero `vat_manual` sigue en
`true`: el producto ya no toma el IVA de su lista aunque nadie lo haya cambiado. Con la unidad pasa lo
mismo con `unit_manual`, que hoy no tiene efecto porque las listas no traen la unidad.

**Qué propongo:** que el cambio diga si es un «Deshacer» (`undo: true`) y en ese caso vuelva también la
marca de cambiado a mano a lo que tenía; o que la marca se guarde como «el IVA de la lista» y
`vat_manual` sea `vat <> list_vat`. La segunda es más simple pero suma una columna. Es una regla (qué
significa «cambiado a mano» después de deshacer): se le pregunta a Carlos.

### F12 · No hay tabla de escenarios y pruebas, y quedan escenarios de 08 sin dueño

**Dónde:** § 11.

**Qué propone:** «una por escenario», sin decir cuál prueba cada una ni dónde.

**Qué veo:**

- Varios escenarios de 07 son de pantalla y corresponden a a2: E02 (aparece «Deshacer»), E09 (el texto
  «Un número entero de 1 a 10.000»), E16 (lo que se lee arriba), E17 («ve»), E21 (el espejo) y E22 (sin
  conexión). El diseño no dice qué parte del servidor prueba a1 de cada uno ni que el resto queda para
  a2. Sin eso, el estado de 07 sale mal de las pruebas (constitución, I: «el estado sale de las
  pruebas»).
- El diseño de 08 dice que **E28, E72, E76 y E95 de 08 se prueban con 07**, y E12, E13 y E74 (un
  producto con dos proveedores) también. En 07a cada producto tiene un solo proveedor (07, «Lo que no
  está acá»), así que E12, E13 y E74 pasan a 07c; E28, E72, E76 y E95 sí se pueden probar ahora. El
  diseño de 07 no los nombra.
- E18 («Ver costos» queda tildado solo): `src/shared/contracts/permissions.ts` ya tiene `includes`, así
  que alcanza con declarar `catalog.margins` con `includes: ['price-lists.costs']`. Está bien; solo falta
  en la tabla.

**Qué propongo:** la tabla de escenarios y pruebas como la de [administration.md](administration.md),
§ 10, con los de 08 que le tocan y cuáles quedan para a2 y para 07c.

### F13 · Las horas sin conexión llegan solo al abrir la aplicación

**Dónde:** administration.md, § 5, «`/api/start` suma `offlineHours`».

**Qué veo:** 06 · R11.4 y R2.4 dicen que cada celular recibe las horas nuevas **con su próximo pedido al
servidor**. `/api/start` se pide al abrir la aplicación (y al volver de una salida), no en cada
pedido. Un celular con la aplicación abierta todo el día sigue pidiendo cosas y nunca recibe las horas
nuevas; si después se queda sin conexión, entra con las viejas. El celular ya hace algo en cada pedido
aceptado: `contacted(at)` en `app/modules/sign-in/offline/option.ts`, que guarda el último contacto.

**Qué propongo:** que las horas viajen en la cabecera `X-Ferrebress` (la forma `piggyback` de la
arquitectura, que existe para esto y sale de la memoria del servidor), solo para los celulares, y que
el celular las guarde en el mismo `offline-contact` en el mismo momento que el contacto. Son unos
pocos bytes por respuesta; va a [mobile-data.md](../mobile-data.md). Si alcanza con `/api/start`, es
cambiar R11.4, y eso lo decide Carlos.

## Mejora

### M1 · Qué cuenta en «N productos · M sin precio»

**Dónde:** § 3, `GET /api/catalog/products`, «con el total y cuántos sin precio».

**Qué veo:** el diseño no dice si los números cuentan los dados de baja, si con texto o con un filtro
cuentan lo encontrado o todo el catálogo, ni si «sin precio» incluye a los que tienen margen pero no
costo (los dos tienen `price` en `null`). E16 habla de «4 sin margen» y dice «4 sin precio». Lo más
probable es «sin precio = sin margen o sin costo, sin contar los dados de baja»; el diseño tiene que
decirlo, y si la regla no alcanza, preguntarlo.

### M2 · Poner al día el índice después de una lista grande

**Dónde:** § 1, «se pone al día al confirmar cada transacción».

**Qué veo:** una lista de 100.000 filas pone al día 100.000 productos en un `AfterCommit`, que corre de
una vez, sin ceder el turno: sacar cada producto de las listas de sus palabras viejas y meterlo en las
nuevas puede trabar el servidor varios segundos, y el mostrador no puede esperar (constitución, IV). El
diseño no dice cómo se saca un producto de una palabra (hace falta guardar las palabras de cada
producto) ni qué pasa si poner al día falla a mitad (el índice queda distinto de la base hasta
reiniciar).

**Qué propongo:** con más de N cambios (en `settings.ts`), armar un índice nuevo aparte, de a tandas
que ceden el turno, y reemplazar el viejo de una vez; con pocos, ponerlo al día en el lugar. Si poner al
día falla, armarlo de nuevo. Y decir qué contesta buscar mientras se arma al arrancar (esperar o `503`).

### M3 · Lo que el diseño no mide

- **Bytes:** la constitución (paso 3) pide metas en bytes. Falta cuánto pesa una página de 50 y un
  producto, con y sin «Ver costos».
- **La memoria y el arranque** (30 MB, 2 s): son supuestos. La prueba de performance tendría que
  medirlos y fallar si se pasan; en una notebook vieja, 30 MB o 80 MB no es lo mismo.

### M4 · Sin conexión, hora y escala

- **La constitución y R3.3 dicen cosas distintas.** La constitución (IV) dice que **buscar
  precios** sigue andando sin internet en el dispositivo habilitado; 07 · R3.3 y R6.2 dicen que buscar
  necesita conexión. La regla la aprobó Carlos, pero se contradicen: hay que cambiar una de las dos, y
  Ventas, que necesita productos sin conexión, va a volver a esto. Para no rehacer buscar entonces, el
  índice puede vivir en `src/shared/search/` (TypeScript sin tecnología), así mañana corre igual en el
  celular con el catálogo bajado. No cuesta nada hoy.
- **La hora:** el catálogo no guarda horas; la auditoría pone la del servidor. Bien.
- **Escala:** el índice en memoria está bien para hoy y el ADR lo suma a «Escala». Con varias copias,
  cada una tendría que enterarse de lo que confirma otra (`LISTEN/NOTIFY` con los identificadores). A
  100 personas no lo veo como problema de memoria ni de CPU, salvo buscar sin límite de pedidos (M6).

### M5 · El ADR-022

- **Una opción que falta.** La tabla descarta la búsqueda de texto de PostgreSQL porque «el
  diccionario en castellano corta las palabras», pero con la configuración `simple` y `unaccent` no
  corta nada, y encuentra palabras empezadas en cualquier orden con índice. El error de tipeo se puede
  sumar con `pg_trgm` sobre una tabla chica de palabras (el vocabulario, unas 50.000), no sobre los
  productos: se buscan las palabras parecidas y con ellas se arma la consulta. Esa opción sirve con
  varias copias del servidor, no ocupa memoria ni tarda en arrancar, pero el orden exacto de R3.2 se
  arma igual en TypeScript y pide extensiones que hay que comprobar en PGlite (ADR-005). Creo que el
  índice en memoria sigue ganando para hoy, pero el ADR tiene que compararlo con esta opción y no con
  la más débil.
- **Las consecuencias sin medir.** «Unos 30 MB» y «unos 2 s» van como metas que mide la prueba
  de performance, no como hechos (M3).
- **Bien:** dejar el índice detrás de una función para poder cambiarlo sin tocar las rutas. Falta
  nombrar esa interfaz (`ProductSearch`: `search`, `page`, `numbers`, `brands`, `apply`) para que
  quede como pieza enchufable.

### M6 · Seguridad

- **«Ninguno» quiere decir «con sesión».** § 3 dice «Permiso: ninguno» para ver; tiene que
  decir que pide sesión, como Administración.
- **Buscar no tiene límite de pedidos.** Cada búsqueda con error de tipeo gasta CPU del único
  proceso. Un límite por sesión (por ejemplo, 10 por segundo, en `settings.ts`) y un tope de palabras
  por búsqueda (además de las 80 letras) evitan que una pestaña rota trabe el mostrador.
- **Con el margen y el precio se sabe el costo.** R4.1 muestra el margen sin «Ver costos», y el
  IVA se ve. Con el paso en «sin redondeo», precio ÷ (1 + margen) ÷ (1 + IVA) da el costo al centavo;
  con $ 1.000, uno aproximado. La regla está aprobada, pero la constitución pide cuestionarla: se le
  dice a Carlos, con la alternativa de mostrar el margen solo con «Ver costos».
- **Lo que entra:** el margen, la unidad y el IVA de su lista, el UUID, `q` y `after`. Falta escribir la
  forma de `after` (con F6, tres números) y el largo máximo de `brand`.
- **Auditoría:** completa (los tres cambios y los rechazos). Los `409` no se anotan, como en 06.
- **Secretos y datos personales:** ninguno nuevo. Bien.

### M7 · Simpleza

- **`search_key` sobra.** § 2 lo guarda «para armar el índice al arrancar», pero el índice
  igual lee la descripción, la marca y el código de barras, y el código del proveedor ni siquiera está
  en `catalog`. Es una columna más que poner al día en cada `update` y que, si cambia cómo se parte un
  texto, pide una migración. Se arma en TypeScript al leer. Si se queda la lista alfabética en la base
  (F7), la columna útil es otra: `sort_key`.
- **Tres rutas casi iguales.** `margin`, `unit` y `vat` hacen lo mismo con otro campo y otro
  permiso. Una ruta `POST /api/catalog/products/:id/:field`, con un mapa de campo a permiso, rango y
  evento, deja una sola función. Las tres rutas también se entienden: es menos código, no más claro.
- **`create` no calcula nada** (F3): sacarlo de «lo que cambia».
- **`after` como posición.** Con texto, `after` es la posición en el resultado; si una lista
  cambia el índice entre la página 1 y la 2, se repiten o se saltean productos. Con el orden alfabético
  guardado como número (F6), el cursor puede ser (grupo, orden, número interno) en los dos casos, con
  la misma forma.
- **Las marcas con mayúsculas distintas.** Las listas traen «STANLEY» y «Stanley»: el filtro y
  la lista de marcas tienen que agruparlas con `searchKey`, como ya hacen los descuentos de 08 (E19 de
  08).

### M8 · Repetición

- **Partir un texto en palabras.** `search/words.ts` tiene que usar
  `src/shared/text/search-key.ts` (sin acentos ni mayúsculas, la que ya usan los buscadores de 08) y
  sumar solo lo nuevo (partir en palabras, sacar signos de los códigos). El diseño no lo dice.
- **Dos redondeos.** `sale.ts` «redondea para arriba al múltiplo del paso» y `rounding.ts`
  «pasa a contar en centavos». Tiene que ser una sola función (`sale.ts` usa la de `rounding.ts`), en
  BigInt, y el panel de Administración también la usa. Hoy `rounding.ts` cuenta en `number` y pesos.
- **Mostrar.** `priceText(micro, step)` va junto a `formatPesos` en `src/shared/money/` y la usa;
  bien. Con el precio en centavos (F5), toma centavos.
- **El nombre `catalog` en la auditoría.** `src/shared/audit-log/index.ts` ya exporta `catalog`
  (el catálogo de tipos de Quién hizo qué), y tiene `catalog.test.ts`. El archivo del grupo «Catálogo»
  no puede llamarse `catalog.ts` sin confundirse; conviene renombrar el de hoy (`entries`, por
  ejemplo).

### M9 · Lo que falta en las tareas

Faltan: el cambio en `price-lists` (F2), el de `administration.md` y la auditoría del redondeo (F10),
el avance del recálculo o la decisión de sacarlo (F8), los textos y el ícono del grupo «Catálogo» en
`src/shared/audit-log/`, y las palabras nuevas del glosario si hacen falta. Además el glosario dice
`salePrice` para «precio de venta», y el diseño usa `price` y `saleOf`: la columna tendría que ser
`sale_price` (constitución, X).

### M10 · El servidor confirma con las horas de ahora: decirlo como regla

**Dónde:** administration.md, § 5, «la confirmación usa la de ahora y una entrada pasada de ese plazo se
cierra».

**Qué veo:** si un Administrador baja las horas de 24 a 4 mientras un celular está sin conexión, el
celular entra a las 10 horas con las 24 que tenía (E57), trabaja, y al volver la conexión el servidor
dice `too-late`: «No se pudo confirmar tu entrada sin conexión». Por seguridad es lo correcto (bajar
las horas suele ser porque se perdió un celular, y el servidor no puede creerle al celular qué horas
tenía), y lo hecho sin conexión no se pierde («Entrá de nuevo para seguir donde estabas», 15 · R3.2).
Pero E57 se puede leer como «sigue con 24», y el capítulo 15 todavía dice «24 horas» en R2.1, R2.7 y
R3.1. Se le dice a Carlos y se escribe en 06 · R11.4 o en 15 · R3.1, para que no lo arregle nadie
«a favor» del celular.

### M11 · Los límites se arman una vez al registrar las rutas

**Dónde:** administration.md, § 5, «los límites… toman su `max` de la fachada en cada intento
(`entryLimits()`)».

**Qué veo:** los límites `google` y `passkey` se ponen hoy como paso de la ruta,
`ctx.limit(byAddressAndDevice('google'), limits.google)`, en cinco lugares (`google/routes.ts`,
`access/confirm.ts` dos veces, `passkeys/sign-in-routes.ts`, `codes/phone/approve.ts`,
`offline/routes.ts`). `limit` en `platform/guards.ts` recibe la ventana como un valor fijo al
registrar, así que leerla «en cada intento» pide cambiar la plataforma (que `limit` acepte una función
que da la ventana) o llamar a `throttle` dentro de cada manejador. Cambiar `platform/` es código común
con dueño (constitución, «Trabajo en paralelo»): tiene que estar en las tareas.

### M12 · Lo que falta del cambio

- La tabla de pruebas (§ 10) no tiene E56 a E59, y las tareas (§ 11) no tienen T132.
- La columna `key` de § 2 sigue nombrando cinco ajustes.
- Quién hizo qué tiene que mostrar los cuatro ajustes nuevos con su nombre y su unidad
  (`src/shared/audit-log/administration.ts`): «las horas sin conexión: 24 h → 4 h».
- `sign-in/settings.ts` y `app/modules/sign-in/settings.ts` dejan de tener `offlineWindowHours` fijo:
  cuál queda (el de arranque del contrato) y quién lo usa.

## Por cada punto de la revisión

1. **Escenarios sin cubrir:** F3, F9, F11, F12 y M1. R6 (el espejo y sin conexión) es todo de a2, sin
   parte en el servidor: bien, pero que la tabla de F12 lo diga.
2. **Performance:** F6, F7, F8, M2 y M3.
3. **Simpleza:** M7.
4. **Repetición:** M8, y la cuenta del precio repetida en SQL de F8.
5. **Seguridad:** M6, y M10 en T132.
6. **Fronteras:** F1 y F2; M11 toca la plataforma.
7. **Sin conexión, hora y escala:** M4 y F13. La hora: nada que objetar.
8. **Mejoras:** abajo.

## Lo que haría distinto, junto

1. **Una sola fuente para toda lista:** el índice en memoria, con o sin texto; la base solo da las 50
   filas por clave (F7). Menos índices, menos consultas, un solo orden.
2. **El precio en centavos, con el precio sin redondear guardado** (`raw_price`, `sale_price`):
   resuelve el desborde (F5), deja el recálculo en una sentencia (F8) y el conteo sin repetir la
   cuenta entera en SQL.
3. **Un solo orden para escribir precios:** la fila del paso en `catalog.pricing`, leída con `for
   share`, y un tope de espera con `409 list-applying` (F4).
4. **El código del proveedor guardado en `catalog`,** y la cuenta del costo pedida a `price-lists`
   (F1).
5. **El índice en `src/shared/search/`,** con su interfaz con nombre, para el día que haya que buscar
   sin conexión (M4, M5).
