# Revisión del código · 07 · Catálogo (`catalog`), parte a1, con T132 y T136

Paso 7 de la constitución. Revisé los commits `ed766db` (T132), `a705c04` (T136), `1be9476` y
`2b044bc` (07a1) contra, en orden de autoridad, [07 · reglas](../../chapters/07-catalog/rules.md),
[06 · R3 y R11](../../chapters/06-administration/rules.md), [08 · R7.7, E28, E72, E76, E95](../../chapters/08-price-lists/rules.md),
[01 · R2.9 y R2.10](../../chapters/01-sign-in/rules.md), [15 · R2.2 y R3.1](../../chapters/15-offline/rules.md),
el diseño [catalog.md](catalog.md) (en la versión anterior a `2b044bc`, ver el punto 1), el de
[administration.md](administration.md), sus revisiones y [ADR-022](../adr/ADR-022-catalog-search.md). Las
pantallas de 07 son de a2: no las busqué.

**Lo que corrí:**

- Las pruebas del módulo y lo que tocó (`src/server/modules/catalog`, `src/shared/search`,
  `src/shared/pricing`, `src/shared/money`, `src/server/modules/administration`,
  `src/shared/audit-log/products.test.ts`, `src/server/routes-permissions.test.ts`): 22 archivos, 121
  pruebas, todas pasan.
- `pnpm perf` de `catalog.perf.ts`: las 3 pasan.
- Una medida aparte del índice (`src/shared/search/index.ts`) con descripciones inventadas como las de la
  prueba de rendimiento: **poner al día un solo producto** (`replace`) tarda **0,7 s con 100.000
  productos y 1,5 s con 200.000**; `brands()`, 15 y 26 ms; la peor búsqueda permitida (8 palabras de una
  letra, u 8 con error), menos de 6 ms.
- `pnpm check` entero: el resultado está al final de este documento.

**Lo que no pude comprobar:** las esperas y los choques entre transacciones (la base de pruebas es
PGlite, con una sola conexión: dos transacciones no se pisan nunca). Lo que digo de la concurrencia
(puntos 4 y 5) sale de leer el orden de los bloqueos, no de verlo pasar.

**Gravedad:** **Frena** el cierre del módulo, o es una **Mejora**.

---

## Frena

### 1. El diseño técnico del catálogo quedó vacío — Frena

- **Dónde:** `docs/technical/modules/catalog.md` (0 líneas). Lo vació `2b044bc`: el diff borra las 303
  líneas y no agrega ninguna.
- **Qué dicen los documentos:** la constitución pide que otro agente pueda reconstruir el módulo leyendo
  solo `docs/`; el mensaje de `2b044bc` dice que el diseño «ahora dice lo medido» (42 MB y no 30 MB).
- **Qué hay:** nada. Lo enlazan `catalog-design-review.md`, `catalog-security-review.md`,
  `administration.md`, ADR-022 y `price-lists.md`, y todos llevan a un archivo vacío. `pnpm links` no lo ve
  porque el archivo existe.
- **Qué propongo:** volver a poner la versión de `2b044bc^` con lo que cambió al programar: la memoria
  medida (42 MB con 100.000), los campos de verdad de `Product` y `ProductRow` (punto 13), las consultas de
  verdad de cada pedido (punto 13), cómo se pone al día el índice (punto 2) y lo que se decida de los
  puntos 3 y 6.

### 2. Poner al día el índice frena el servidor entero cada vez que se aplica una lista — Frena

- **Dónde:** `src/shared/search/index.ts:201-205` (`replace` arma todo de nuevo, `build([...docs.values()])`);
  lo llaman `src/server/modules/catalog/indexing.ts:15` y `writes.ts:124-129` al confirmar cada lista,
  cada cambio de cómo cobra un proveedor y cada baja de proveedor.
- **Qué dicen los documentos:** el diseño (§ 5): «el índice se vuelve a ordenar de una vez, **sin frenar
  los pedidos**»; la revisión de seguridad (§ 14): rearmar «una sola vez […], cediendo el turno como hace
  08 al aplicar»; R3.3 y E15: buscar en menos de 100 ms.
- **Qué hace el código:** cualquier transacción que toca aunque sea un producto rearma el índice entero
  en el hilo de Node: ordena todos los productos con `Intl.Collator`, parte todas las descripciones y arma
  los vocabularios. Medido: 0,7 s con 100.000 productos y 1,5 s con 200.000 (con descripciones cortas; las
  de verdad tardan más). Durante ese tiempo el servidor no contesta nada: ni buscar, ni entrar, ni el
  espejo. Con el tope de 200.000, una lista de un solo artículo deja todo parado un segundo y medio.
  `catalog.perf.ts` mide armar el índice desde cero, no ponerlo al día, así que no lo ve.
- **Qué propongo:** que poner al día no rearme lo que no cambió: cambiar los documentos tocados en su
  lugar cuando no cambian ni la descripción ni la marca ni los códigos (el caso más común de una lista:
  solo el costo, que solo toca `priced`), y rearmar solo si cambian palabras, en tandas que cedan el turno
  (o en un `Worker`). Y una prueba de rendimiento que mida poner al día un producto con 200.000, con la
  misma meta de 100 ms.

### 3. «Dados de baja» no busca ni filtra por marca — Frena (o se escribe en las reglas)

- **Dónde:** `src/server/modules/catalog/routes/products.ts:57-71` y `data-pages.ts:76-84`.
- **Qué dicen las reglas:** R3.4 «Se filtra por marca, por "Sin precio" y por "Dados de baja"»; E05
  «**cuando se busca su descripción**, entonces no aparece; con el filtro "Dados de baja", sí». R1.6: el
  dado de baja «se ve con el filtro "Dados de baja"».
- **Qué hace el código:** con `show=discontinued` ignora `q` y `brand`: devuelve todos los dados de baja
  en orden, de a 50. La marca solo cambia los números de arriba, que además son los de los activos. Con
  muchos dados de baja (crecen con los años, como dice el diseño), encontrar uno por su descripción
  obliga a pasar páginas. La prueba de E05 (`search.test.ts:105-126`) no escribe nada, por eso pasa.
- **Qué propongo:** buscar también en los dados de baja, en la base (con `search_key like` sobre las
  palabras, que para un filtro que se usa poco alcanza) y con la marca; o, si Carlos decide que el filtro
  no busca, decirlo en R1.6 y E05. Y que los números de arriba con ese filtro digan qué cuentan.

### 4. Una lista que se aplica y el recálculo del redondeo pueden trabarse entre ellos — Frena

- **Dónde:** `src/server/modules/catalog/writes.ts:62-71` (el paso se lee con `for share` recién en el
  primer `reprice`) y `data.ts:69-81`, `86-93` (`update` y `setCosts` traban las filas antes);
  `data-pricing.ts:57-66` (`applyStep`: `for update` del paso y después todas las filas).
- **Qué dice el diseño:** § 1, «todo lo que escribe precios se ordena por una sola fila»: quien escribe
  precios lee `catalog.pricing` con `for share` y el recálculo la toma con `for update`, para que nunca
  convivan dos pasos.
- **Qué hace el código:** el orden de los bloqueos no es el mismo en los dos lados. La lista primero traba
  productos (`update … returning`) y después pide el paso compartido; el recálculo primero toma el paso y
  después quiere todos los productos. Si el recálculo toma el paso entre esos dos momentos, cada uno espera
  al otro: PostgreSQL corta uno a los 1 s (`deadlock detected`). Si corta el recálculo, Administración dice
  `503 recalc-failed`; si corta la lista, vuelve a esperar con «falló». No se mezclan los pasos (eso está
  bien), pero falla algo que no tenía por qué. Un cambio de margen no tiene el problema: toma el paso
  antes que el producto (`routes/changes.ts:39-41`). No lo pude ver pasar (PGlite tiene una sola
  conexión).
- **Qué propongo:** leer el paso con `for share` al empezar la primera escritura de la transacción (en
  `create`, `update`, `setCosts`, `dropSupplier`, `discontinue` y `restore`, lo que llegue primero), antes de
  trabar ninguna fila. Es un cambio de una línea en `listWrites`.

### 5. Si el índice no se puede rearmar, deja de ponerse al día para siempre o tira el servidor — Frena

- **Dónde:** `src/server/modules/catalog/writes.ts:126-129` y `indexing.ts:13-19`.
- **Qué dice el diseño:** § 5, «si poner al día falla, el índice se vuelve a armar desde la base»; la
  revisión de seguridad (§ 14) pide lo mismo.
- **Qué hace el código:** `refresher` atrapa la falla de `docsOf`, pero no la de `docs()`, que es la misma
  base: si la base no contesta un momento justo al confirmar una lista, fallan las dos y la promesa
  `refreshing` queda rechazada. Desde ahí, cada `refreshing.then(…)` se saltea: el índice no se pone al
  día nunca más hasta reiniciar (productos nuevos que no aparecen, dados de baja que siguen apareciendo).
  Y como nadie espera esa promesa, Node la toma como rechazo sin atender y, con su configuración de
  siempre, termina el proceso. No hay `unhandledRejection` en `src/server`. `indexing.test.ts` prueba solo
  que falle la primera lectura.
- **Qué propongo:** que la cadena no se rompa (`refreshing = refreshing.then(…).catch(log)`), y que un
  rearmado que falla quede marcado para reintentarse con la próxima transacción o a los pocos segundos.
  Una prueba con las dos lecturas fallando.

---

## Mejoras

### 6. El tope de 200.000 no mira los que vuelven ni las listas seguidas — Mejora

- **Dónde:** `src/server/modules/catalog/writes.ts:73-83` y `index.ts:59` (`active: index.size`).
- **Qué dicen las reglas:** R3.5 y 08 · R7.7: una lista que haría pasar el número no se aplica.
- **Qué hace el código:** el tope se mira solo en `create`. Una lista que solo trae de vuelta productos
  dados de baja (`restore`) suma activos sin mirarlo, y una que crea y trae de vuelta en la misma tanda
  cuenta los que vuelven recién en la tanda siguiente. Además `index.size()` cuenta lo que tiene el
  índice, que se pone al día después de confirmar (y tarda, punto 2): una lista que arranca justo después
  de otra mira un número viejo. La prueba de E25 cubre solo el caso de crear.
- **Qué propongo:** mirar el tope también en `restore`, y contar desde la base dentro de la transacción
  (`count(*) where not discontinued`, una consulta por lista) o desde un contador que se actualiza al
  confirmar, no desde el índice.

### 7. Un cambio de margen pone `priced` en el índice por fuera de la cola — Mejora

- **Dónde:** `src/server/modules/catalog/routes/changes.ts:102` (`ctx.index.setPriced`).
- **Qué dice el diseño:** § 5: «al confirmar cada transacción que cambia productos (una lista o un
  cambio), la fachada devuelve lo que cambió (`AfterCommit`) y el índice lo pone al día».
- **Qué hace el código:** el cambio escribe directo en el índice, sin pasar por `committed` ni por la cola
  `refreshing`. Si una puesta al día de una lista leyó la base antes de que se confirmara el margen y
  reemplaza después, el producto vuelve a «Sin precio» en el índice hasta el próximo cambio. Es una
  ventana corta, pero el número «sin precio» de arriba queda mal.
- **Qué propongo:** encolarlo como las demás (`refreshing.then(() => setPriced(…))`), o que `replace`
  respete un `priced` más nuevo. Si se deja así, decirlo en el diseño.

### 8. «Deshacer» un IVA puede dejar como de la lista uno que estaba a mano — Mejora

- **Dónde:** `src/server/modules/catalog/rules/changes.ts:34-35`.
- **Qué dicen las reglas:** R1.4, «"Deshacer" lo deja como estaba».
- **Qué hace el código:** con `undo: true`, si el valor nuevo es el de la lista, queda `vat_manual =
  false`. Pero si estaba a mano en el mismo valor que dice la lista (alguien lo puso en 21 % a mano y la
  lista dice 21 %), cambiarlo y deshacer lo devuelve a la lista: la próxima lista que diga otro lo cambia,
  y antes no lo hacía. Al revés: si en esos 5 s una lista cambió `vat_from_list`, «Deshacer» deja el valor
  de antes **a mano**. Además el servidor no sabe si es un «Deshacer» de verdad: cualquier pedido con
  `undo: true` saca el IVA de la mano (con el mismo permiso, así que no es un problema de seguridad).
- **Qué propongo:** que el pedido de «Deshacer» mande también el `manual` de antes (lo tiene la
  aplicación: viene en `vatManual`) y que el servidor lo vuelva a poner tal cual, sin deducirlo.

### 9. La migración pone como IVA de la lista el que estaba a mano — Mejora

- **Dónde:** `src/server/modules/catalog/migrations/002-prices.ts:43`.
- **Qué dice el diseño:** `vat_from_list`, «el IVA que puso la última lista» (§ 2).
- **Qué hace el código:** copia `vat` en `vat_from_list` para todos, también para los que tienen
  `vat_manual = true`: en esos queda el valor a mano y E23 («Deshacer» vuelve al de la lista) los deja
  en el valor a mano. Se arregla solo con la próxima lista de su proveedor (`update` guarda siempre
  `vat_from_list`). Si producción no tiene productos con IVA a mano, no pasa nada; no lo pude comprobar.
- **Qué propongo:** tomar el IVA del artículo de la lista (`price_lists.items`) para los que están a mano,
  como ya hace con `supplier_code`, o dejarlo dicho en el diseño.

### 10. Las horas sin conexión se guardan con el contacto siguiente, no con el mismo — Mejora (T132)

- **Dónde:** `src/app/platform/server/api.ts:111` y `:125` (`lastReply.set` antes de `readFields`);
  `src/app/modules/sign-in/offline/option.ts:66-76` (`contacted` usa lo último que oyó).
- **Qué dice el diseño:** administration.md § 2: «El celular las guarda junto a su último contacto, **en
  el mismo momento**».
- **Qué hace el código:** cada respuesta primero cuenta como contacto (con las horas que se oyeron en la
  respuesta anterior) y después lee el campo `h`. Si Administración baja de 24 a 4 y el celular se queda
  sin conexión justo después de la primera respuesta que dice `h=4`, guarda 24 y deja entrar sin conexión
  hasta 24 horas; el servidor después no lo confirma (15 · R3.1), así que no abre nada en el servidor, pero
  la persona trabaja y después pierde la entrada. La prueba (`option.test.ts`) llama a las dos funciones a
  mano en el orden que le conviene, así que no lo ve.
- **Qué propongo:** leer los campos antes de avisar el contacto, o que `heardOfflineHours` también
  actualice las horas del contacto guardado. Una prueba que pase por `api()` con una respuesta de verdad.

### 11. La espera de 5 s por una lista: una prueba que no prueba — Mejora

- **Dónde:** `src/server/modules/catalog/changes.test.ts:111-119`.
- **Qué hace:** la prueba «si una lista de su proveedor tiene trabado el producto más de 5 s, 409»
  importa `orListApplying` y le pasa un error inventado con código `55P03`. No hay una lista ni un bloqueo:
  pasa aunque `lock_timeout` no se ponga nunca o el código del error sea otro. Es la única prueba de esa
  regla del diseño.
- **Qué propongo:** como PGlite no tiene dos conexiones, decirlo en la prueba y en el diseño, y sumarla
  a lo que se mira contra PostgreSQL (`tests/` del compose) o en una e2e, si Carlos la aprueba.

### 12. Pruebas que cambian la configuración del módulo por dentro — Mejora

- **Dónde:** `search.test.ts:84-102` y `:112-125` (`catalogSettings.page = 2`); `limits.test.ts:30-51`
  (`catalogSettings.maxActive = 3`).
- **Qué hace:** escriben en el objeto de configuración del módulo, que es el mismo para todo el proceso.
  Dependen de que el código lea `catalogSettings` en cada pedido y no al arrancar (un refactor que lo lea
  una vez las rompe) y, si una falla antes del `finally`, contaminan el resto del archivo.
- **Qué propongo:** que `createCatalogModule` reciba la página y el tope como opciones (como recibe
  `roundingStep`) y el kit los pase.

### 13. El código se aparta del diseño en las respuestas y las consultas — Mejora

- **Dónde:** `src/shared/contracts/catalog.ts:47-82`, `queries.test.ts:38-42`, `routes/changes.ts:63-79`.
- **Qué dice el diseño (§ 3, § 6, § 10):** `ProductRow` con `supplier`; `Product` con `steps` (la cuenta
  de `salePrice`); un cambio de margen en 3 consultas y uno de unidad en 2; el `409` como `changed`; el
  evento de la auditoría «con el precio de antes y el de después»; `400` «con el rango».
- **Qué hace el código:** `ProductRow` no lleva `supplier` y suma `vatManual` y `discontinued`; `Product`
  lleva `raw` y `basis` en vez de `steps`, así que `salePrice` (`src/shared/pricing/sale.ts:30`) no lo
  usa nadie fuera de su prueba, y el comentario de cabecera de `sale.ts` y el de `data-pricing.ts:4` dicen
  que lo usa el servidor; un cambio hace 4 consultas dentro de la transacción (suma `set_config` del
  `lock_timeout`), también el de unidad, que no necesita leer el paso; el error es `product-changed`; el
  precio va al evento solo si cambió (y la prueba de E20 exige que no esté); el `400` es el genérico
  `bad-request`, sin rango.
- **Qué propongo:** cuando se vuelva a escribir el diseño (punto 1), que diga lo que hace el código, o
  ajustar el código donde el diseño tenía razón: el cambio de unidad no necesita el paso compartido (una
  consulta menos), y si `salePrice` no lo usa el servidor, que lo diga su comentario (lo usará a2).

### 14. Las marcas y un producto, sin límite de pedidos — Mejora (seguridad)

- **Dónde:** `src/server/modules/catalog/routes/products.ts:103-115`.
- **Qué dice el diseño (§ 9):** buscar, 120 por minuto por sesión; no dice nada de las otras dos.
- **Qué hace el código:** `GET /api/catalog/brands` recorre todos los productos y arma `searchKey` dos
  veces por producto en cada pedido (26 ms con 200.000, medido), y `GET /api/catalog/products/:id` hace 1
  o 2 consultas; ninguno tiene límite. Una sesión en bucle tiene el hilo ocupado o la base trabajando.
- **Qué propongo:** las marcas, armadas una vez en `build` (ya recorre todo); y las dos rutas con el
  mismo límite de buscar.

### 15. Cada sesión guarda su última búsqueda entera, aunque no tenga más páginas — Mejora

- **Dónde:** `src/server/modules/catalog/routes/products.ts:22-40`.
- **Qué hace:** guarda el resultado de cada búsqueda por un minuto, también la búsqueda sin nada escrito
  (200.000 identificadores, unos 1,6 MB por sesión) y las que entran en una página. Con decenas de sesiones
  buscando, son decenas de MB que el diseño no cuenta en «Memoria» (§ 9).
- **Qué propongo:** guardarla solo si tiene `next`; y sumar la cuenta al diseño.

### 16. El orden alfabético no es el mismo en los activos y en los dados de baja — Mejora

- **Dónde:** `src/shared/search/index.ts:33` (`Intl.Collator('es', { numeric: true })`) y
  `data-pages.ts:82` (`search_key collate "C"`); `recalculator.ts:39` también ordena por `"C"`.
- **Qué dicen las reglas:** R3.4, «en orden alfabético».
- **Qué hace el código:** los activos ordenan los números como números («Tornillo 8» antes que «Tornillo
  10») y los dados de baja, letra por letra («10» antes que «8»). Ninguna regla pide el orden numérico.
- **Qué propongo:** el mismo orden en los dos lados (o decir en el diseño que los números van como
  números y hacer lo mismo en la base con una clave que los rellene con ceros).

### 17. Lo que el código hace y ninguna regla pide — Mejora

Para que Carlos lo confirme o se escriba donde corresponde:

- **Un producto dado de baja se puede cambiar** (margen, unidad, IVA): `changes.test.ts:98-108` lo
  prueba con el nombre de «R1.6», que no lo dice.
- **Lo buscado sin letras ni números** («-», «¿?») devuelve todo el catálogo, como sin nada escrito
  (`src/shared/search/index.ts:144-161`).
- **Una palabra de 4 letras** («torn») busca también las de una letra de distancia («toro», «turn»): el
  código no puede saber si está «escrita entera» (R3.1) y la toma como entera siempre que tenga 4.
  Coincide con E24, pero conviene que el diseño lo diga.
- **Un contacto guardado sin horas usa 4** (`src/shared/contracts/offline-sign-in.ts:65`): está en el
  diseño de 06 y en el de 15, no en las reglas; después de actualizar, un celular que tenía 24 pasa a 4
  hasta su segundo pedido.
- **El precio va a Quién hizo qué solo si cambió** (punto 13).

### 18. Comentarios de cabecera que no dicen lo que hay — Mejora

- `src/server/modules/catalog/catalog.perf.ts:1-4`: dice que mide «buscar por la ruta»; no hay ninguna
  prueba que pase por la ruta.
- `src/shared/pricing/sale.ts:1-4` y `src/server/modules/catalog/data-pricing.ts:1-4`: el servidor no usa
  `salePrice` (punto 13).
- `src/server/modules/catalog/data.ts:1-4`: «las consultas que escriben productos», pero también lee
  (`read`).
- `src/server/modules/catalog/catalog.test.ts:1-2`: habla solo de la fachada de 08a; está bien, pero el
  archivo no prueba nada del precio, que ahora también escribe la fachada.

**Carpetas:** `src/server/modules/catalog/` tiene 22 archivos sueltos; los cinco `data*.ts` (`data.ts`,
`data-pages.ts`, `data-pricing.ts`, `data-rows.ts`, `data-changes.ts`) comparten concepto y irían en
`data/`, como en `price-lists`; `writes.ts`, `indexing.ts` y `recalculator.ts` (lo que la fachada le da a
los otros módulos) podrían ir en `facade/`.

### 19. Nombres que confunden y lógica repetida — Mejora

- **Dos `centsOf` distintos:** `src/shared/money/money.ts:9` (millonésimos a centavos, redondeando la
  mitad) y `src/server/modules/catalog/data-pricing.ts:16` (el precio sin redondear y el redondeado de un
  producto). El segundo podría ser `pricesOf`.
- **Dos `ProductRow` distintos:** el de `data.ts:39` (lo que lee la fachada) y el del contrato
  (`src/shared/contracts/catalog.ts:47`, lo que ve la aplicación), y además `StoredProduct`.
- **El redondeo al paso en SQL** está escrito cuatro veces (`data-pricing.ts:51`, `:61`, `:62` y
  `recalculator.ts:24`) y una más en TypeScript (`roundUp`): un `sql` con nombre (`roundedTo(step)`) lo
  deja en un lugar.
- `routes/changes.ts:110-133`: el arreglo `fields` se tipa como `marginBody` y `MarginBody` para los tres
  campos (`as typeof marginBody`, `as MarginBody`): el tipo dice algo que no es.

### 20. Documentación que quedó atrás — Mejora

Además del diseño vacío (punto 1):

- `docs/chapters/07-catalog/summary.md`, «Permisos»: «sin él, el precio de venta **y el margen**».
  R4.1 y el código esconden el margen sin «Ver costos».
- `docs/technical/modules/administration.md` § 6: «Sin campos nuevos en la cabecera»; § 2 y el código
  suman el campo `h`. Y «El avance del recálculo […] usa el canal `temporary`»: el catálogo recalcula en
  una sentencia y no hay avance.
- `docs/technical/architecture.md`, «Escala»: «base o se avisarían entre ellas) la auditoría (un solo
  escritor) y el índice…»: le falta la «y» antes de «la auditoría».
- ADR-022 dice que el índice «se pone al día al confirmar cada transacción»; no dice que eso es rearmarlo
  entero ni cuánto tarda (punto 2).
- Nada en `docs/` dice que las pruebas de concurrencia no se pueden hacer con PGlite (punto 11).

---

## Lo que miré y está bien

- **Escenarios:** E01 a E20 y E23 a E26 tienen una prueba que los nombra y los comprueba desde la API
  o desde la función compartida (E10 y E11 van en el mismo `it` que E06 y E05). E15 corre en `pnpm perf`
  (de 1 a 8 ms). E21 y E22 son de a2. 08 · E28, E72, E76 y E95, y 06 · E41, E56 a E59 y 01 · R2.9 (60
  por dirección), también. Salvo lo dicho en los puntos 3, 6 y 11.
- **Seguridad (§ 9 del diseño):** sesión en todas las rutas (E26 y `routes-permissions.test.ts`); sin
  «Ver costos», ni margen, ni costo, ni proveedor, ni cuenta, en toda respuesta (`views.ts`, también el
  `409`); el panel del redondeo con ejemplos inventados sin «Ver costos»; lo que entra validado con el
  contrato (`q` y `brand` hasta 80, `after` con sus dos formas, `show` de su lista, un parámetro de más da
  `400`); buscar, 120 por minuto por sesión; los cambios, 60 por minuto por persona; el panel del
  redondeo, 10 por minuto; los precios en `bigint` y como texto; los rechazos sin permiso, como
  `permission.denied`. Salvo el punto 14.
- **El precio en centavos (T136):** la cuenta en una sola división llevada para arriba (E06 a E08), los
  trece pasos de 06 · R3.2, la migración de pesos a centavos (0 pasa a 1), los decimales del paso en
  `priceText` y los eventos viejos leídos en pesos.
- **El recálculo del redondeo:** cuenta en una consulta, recalcula en una sentencia dentro de la
  transacción de Administración, vuelve a contar ahí y, si el número cambió, se deshace y vuelve a
  preguntar (06 · R3.4, E41). Con 100.000 productos, alrededor de 1 s.
- **T132:** los intentos se leen de Administración en cada intento (06 · R11.4), primero por dirección
  con su tope fijo y después por dispositivo; los fallidos por cuenta con el número de ahora; la
  confirmación sin conexión con las horas de ahora (15 · R3.1); el campo `h` solo a celulares con sesión.
- **Paginación con `after`:** la siguiente página sale de la búsqueda guardada sin volver a buscar; otra
  búsqueda con un `after` viejo busca de nuevo y no mezcla resultados; un `after` más allá del final
  devuelve una página vacía sin `next`.

## La vista sin lógica

Lo que el módulo agregó o cambió en `src/app/views/`:

- `src/app/views/basic/administration/Entry.tsx:38`: `effect={(v) => (v === now ? texts.rounding.current
  : '')}` compara el valor de cada opción con el de ahora para decidir qué texto va al lado. Lo debería
  dar el modelo resuelto, como en el redondeo (`lines.optionEffect`): por ejemplo
  `entryLines.optionEffect`. De paso, usa el texto del redondeo (`texts.rounding.current`) para otro panel.
- `src/app/views/basic/device-settings/Settings/Install.tsx:81`: `row.blocked ?? (row.on ? row.onDetail :
  row.detail)` elige entre tres textos según el estado. El modelo (`useOfflineSetting`) podría dar uno
  solo ya elegido (`row.says`).
- `Rounding.tsx`, `Lists.tsx`, `List.tsx`, `Administration.tsx`, `kit.tsx`, `AuditLog.tsx` y los íconos:
  solo dibujo y lo que ya decidió el modelo.

## El resultado de `pnpm check`

Pasa entero (sale con 0): 333 archivos de prueba, 1.915 pruebas que pasan y 1 que se saltea, con la
cobertura al 100 %, los tipos, el lint, los enlaces y las capturas. Que pase no dice nada de los puntos 1
a 5: el diseño vacío es un archivo que existe, y ninguna prueba mide poner al día el índice, busca en los
dados de baja, traba dos transacciones ni hace fallar dos veces la lectura del índice.

## Lo que se podría extraer a una librería

- **El índice de búsqueda** (`src/shared/search/index.ts`, `words.ts`): palabras empezadas, un error de
  tipeo, códigos sin signos, orden por grupos, sin nada del servidor. Serviría a cualquier proyecto que
  busque unos cientos de miles de cosas en memoria, en el servidor o en el celular. Lo atan a Ferrebress
  los campos fijos `brand`, `priced` y `codes`, el `Intl.Collator('es')` escrito adentro y `searchKey` de
  `src/shared/text/`. Iría a **piezas de la aplicación** o a un grupo nuevo, **búsqueda**. Cambio chico:
  que los filtros sean genéricos (`facets: Record<string, string>` y `flags: Record<string, boolean>`) y
  el idioma, una opción de `createSearchIndex`.
- **Lo que una transacción tocó y corre al confirmar, en una cola** (`createTracker` y `committed` en
  `src/server/modules/catalog/writes.ts`, y `refresher` en `indexing.ts`): sirve a cualquier caché en
  memoria que se pone al día con lo confirmado. Lo ata el tope del catálogo en el mismo archivo. Iría a
  la **base del servidor**, junto a `AfterCommit`. Cambio chico: separar el rastreador de `listWrites`
  en su propio archivo.
- **Esperar una fila trabada un tiempo y rechazar con un motivo** (`set_config('lock_timeout')` y
  `orListApplying` en `routes/changes.ts`): sirve a cualquier módulo que choca con un proceso largo. Lo
  ata el nombre `list-applying`. **Base del servidor**. Cambio chico: una función
  `withLockTimeout(trx, ms)` y el código `55P03` con nombre en la plataforma.
- **La última búsqueda de cada sesión para las páginas siguientes** (`createSearches` en
  `routes/products.ts`): un cursor en memoria por sesión, con vencimiento. Lo ata `ProductsQuery`. **Base
  del servidor**. Cambio chico: que reciba la clave y la función que busca.
- **Las filas en lote como un JSON** (`rowsOf` en `data-rows.ts`, con los `bigint` como texto): sirve a
  cualquier escritura en tandas con `jsonb_to_recordset`. Nada de Ferrebress. **Base del servidor**.
- **La plata y el redondeo** (`src/shared/money/money.ts`, `src/shared/pricing/rounding.ts`): millonésimos,
  centavos, decimales según el paso, redondeo para arriba en enteros. Sirve a otro negocio en pesos. Lo
  atan el formato argentino escrito a mano (punto de miles, coma) y el signo `$`. Grupo nuevo, **plata**,
  o **base de la aplicación**. Cambio chico: el separador y el símbolo como opciones.
- **Los límites de entrar que lee de los ajustes en cada intento** (`createEntry` en
  `src/server/modules/sign-in/context.ts`): por dirección con tope fijo y por dispositivo con un número
  que cambia. Lo atan los nombres de los ajustes de Administración. **Identidad**. Cambio chico: recibir
  `{ perIp, perDevice: () => number }` en vez de `SignInNow`.
- **Medir en las pruebas de rendimiento** (`src/server/testing/perf.ts` y la memoria retenida con `gc` en
  `catalog.perf.ts`): **calidad**. Cambio chico: llevar `retained()` a `perf.ts`.

Hoy no conviene extraer nada: cada pieza tiene un solo usuario y la que más promete, el índice, va a
cambiar con los puntos 2 y 14 y con 15b, cuando lo use el celular; conviene esperar a que tenga su forma.
