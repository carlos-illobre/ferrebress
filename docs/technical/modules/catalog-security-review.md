# Revisión de seguridad · 07 · Catálogo (`catalog`), parte a1: el servidor y buscar

## Paso 4: el diseño

Revisión independiente del [diseño de a1](catalog.md), del
[ADR-022](../adr/ADR-022-catalog-search.md) y del cambio de T132 en el
[diseño de 06](administration.md) (06 · R11: las horas sin conexión y los límites de entrar como
ajustes), desde el punto de vista de un atacante. Todavía no hay código del módulo. Leí la
constitución, las [reglas de 07](../../chapters/07-catalog/rules.md), R3, R8 y R11 de
[06](../../chapters/06-administration/rules.md), R2 y R3 de [15](../../chapters/15-offline/rules.md),
R2.9 y R2.10 de 01, la [arquitectura](../architecture.md), el [diseño de 15](offline.md) (§ 4, 5 y 8),
el de 01 (§ 8, los límites) y el de 08 (los topes de las celdas). Del código que el diseño reutiliza o
cambia leí: `platform/limits/rate-limit.ts`, `platform/guards.ts`, `sign-in/settings.ts`,
`app/modules/sign-in/offline/option.ts`, `administration/routes.ts` y `recalculator.ts`,
`shared/contracts/administration.ts` (`RoundingExample`), `shared/pricing/cost.ts`,
`price-lists/rules/cells.ts` (el tope del precio) y `deploy/compose.yml` (`mem_limit`). La revisión
del diseño (`catalog-design-review.md`) todavía no estaba escrita.

- **Frena:** se puede entrar, ver o cambiar lo ajeno, o filtrar datos personales. Se resuelve antes
  de aprobar el diseño.
- **Mejora:** conviene hacerla; no frena. Las que marco «antes de programar» cambian cómo se escribe
  el código desde el principio.

## Resumen

**Dos puntos frenan, y los dos dejan ver el costo sin «Ver costos»** (R4.1):

- El panel del redondeo de Administración (`GET /api/administration/rounding`, sin permiso) devuelve
  de cinco productos de verdad su precio **sin redondear**; con el margen y el IVA, que el catálogo
  muestra a cualquiera, el costo sale exacto (punto 1). Se arregla barato.
- La misma cuenta con el precio de la lista del catálogo: con un paso de $ 1 o menos, el precio, el
  margen y el IVA dan el costo al centavo; con $ 1.000, un rango estrecho. Es consecuencia de R4.1
  tal como está (el margen se ve sin «Ver costos»): **lo decide Carlos** (punto 2).

Un tercero frena por cómo está escrito: la tabla de la API dice «Permiso: Ninguno» y no dice que las
tres lecturas piden sesión (punto 3).

Lo más grave de lo que no frena es de disponibilidad: **el precio no entra en un `bigint`** con el
costo y el margen máximos, y un solo producto así deja sin aplicar la lista de su proveedor y sin
poder cambiar el redondeo nunca más (punto 5); **el índice no tiene tope** y una lista enorme puede
dejar al servidor cayéndose en cada arranque (punto 6); y **buscar corre en el hilo único del
servidor sin límite de pedidos** (punto 7).

De T132: subir los ajustes al máximo no abre un ataque nuevo que pueda describir, más allá del riesgo
que R11.1 ya dice (punto 11); el valor viejo en el celular dura más de lo que dice R11.4, porque solo
llega con `/api/start` (punto 9), y el corte de la sesión sin conexión sigue en 24 horas en el
diseño de 15 (punto 10).

## Los puntos

### 1. El panel del redondeo da el precio sin redondear de productos reales a cualquiera — **Frena**

**Dónde:** catalog.md § 4 («`preview` da el total, cuántos cambian con cada paso y cinco
ejemplos»); administration.md § 3 (`GET /api/administration/rounding`, permiso «Ninguno»); el
contrato `RoundingExample = { name, calculated }` (`shared/contracts/administration.ts:121`); la
maqueta aprobada (`administration-settings/final/preview.js:61`) muestra «Calculado $ X» de cada
ejemplo.

**El ataque:**

1. Un cajero sin «Ver costos» entra con su cuenta y abre Administración (verla no pide permiso,
   06 · R1.2), o pide `GET /api/administration/rounding` desde la consola del navegador.
2. Recibe cinco productos con su nombre y `calculated`, el precio antes de redondear, con centavos
   (06 · R3.6: la cuenta se muestra con centavos).
3. Busca cada uno en el catálogo, que le muestra el margen y el IVA sin permiso (R4.1, E17).
4. Costo = `calculated` / ((1 + margen/100) × (1 + IVA)). Con margen 100 % e IVA 21 % y
   `calculated` $ 3.630,00, el costo es $ 1.500,00, exacto.
5. Si los ejemplos cambian según el catálogo (los primeros, al azar, los que más cambian), recargando
   junta más productos.

**Qué consigue:** el costo de proveedor de productos concretos, que R4.1 reserva para «Ver costos».

**Qué propongo** (barato, una de dos):

- **Ejemplos inventados** cuando quien mira no tiene «Ver costos»: el panel ya muestra el ejemplo de la
  regla ($ 15.001) sin precios (§ 12, 1). Solo los números de cuántos cambian son reales.
- **O `calculated` solo con «Ver costos»**: sin él, los ejemplos traen solo el nombre y el precio
  redondeado con el paso de ahora y con cada paso (que ya ve cualquiera en el catálogo). La respuesta se
  arma sin el campo, como R4.1 pide en el catálogo; la maqueta muestra «Calculado» solo con el permiso.

Cualquiera de las dos, con su prueba: sin «Ver costos», la respuesta no tiene `calculated` (o no tiene
productos reales). Y el panel de los márgenes rápidos («Con qué se calcula: Costo $ X»): que siga
siendo un costo de ejemplo fijo, nunca el de un producto real (el diseño no lo dice).

### 2. El margen público más el precio dan el costo — **Frena (decide Carlos)**

**Dónde:** R4.1 y E17 (sin «Ver costos» se ven el precio de venta y el margen); catalog.md § 3 y § 9.

**El ataque:**

1. Alguien sin «Ver costos» (un cajero, o una sesión robada de uno) busca un producto. La respuesta
   trae el precio, el margen y el IVA, legítimamente.
2. Con el paso del redondeo en «sin redondeo», $ 0,05 o $ 1, el precio guardado es el calculado
   redondeado a menos de un peso: costo ≈ precio / ((1 + m) × (1 + IVA)), con un error menor a un
   peso. Margen 50 %, IVA 21 %, precio $ 1.815,00 → costo entre $ 999,99 y $ 1.000,00.
3. Con el paso de arranque, $ 1.000: precio $ 4.000, margen 100 %, IVA 21 % → el costo está entre
   $ 1.239,67 y $ 1.652,89. Mirando el mismo producto después de un cambio de costo (una lista) o
   de margen, el rango se achica.
4. Con 100.000 productos y la lista de a 50, en una tarde tiene la tabla entera.

**Qué consigue:** lo mismo que «Ver costos», salvo el nombre del proveedor.

**Qué propongo:** no lo puede decidir el diseño; R4.1 está aprobada así. Llevarle a Carlos:

- **A. El margen también se reserva a «Ver costos»** (lo más barato: un campo menos en `views.ts` y E17
  cambia). Quien vende sigue viendo el precio. La desventaja: el cajero no sabe cuánto gana el negocio
  con cada producto, si eso le sirve para algo.
- **B. Se acepta y se escribe en R4.1** que «Ver costos» oculta el proveedor y la cuenta, pero que el
  costo se puede deducir del precio y el margen. Sin costo de programar.

Hasta que lo decida, el diseño no puede decir en § 9 que «sin «Ver costos», la respuesta no trae el
costo» como si eso lo protegiera.

### 3. Las lecturas del catálogo no dicen que piden sesión — **Frena (por cómo está escrito)**

**Dónde:** catalog.md § 3 (las tres `GET`, «Permiso: Ninguno») y § 9.

**El ataque:** si se programa leyendo la tabla al pie de la letra (sin `sessions.require`), cualquiera
desde internet (el servidor está publicado por Caddy, ADR-014) pide
`GET /api/catalog/products?after=…` en bucle y se baja el catálogo entero con precios y márgenes
(con el punto 2, los costos), sin cuenta y sin dejar rastro de quién; y con el punto 7, frena el
servidor sin sesión.

**Qué propongo:** escribir en § 3, como administration.md («Todas piden sesión»), que las seis rutas
piden sesión y que «Ninguno» es «ningún permiso además de la sesión»; y una prueba por ruta: sin
cookie, `401` y nada del catálogo. Costo: una línea y tres pruebas.

### 4. R4.1 en cada respuesta, no solo en las dos de lectura — Mejora, antes de programar

**Dónde:** catalog.md § 3 («Contesta el producto nuevo»; `409 changed` con el valor de ahora).

**El ataque:** alguien con «Cambiar los datos de un producto» y sin «Ver costos» (los dos permisos son
independientes, R4.3) cambia la unidad de un producto a «kg» y otra vez a «un.». Si la respuesta del
cambio es la fila que devolvió la transacción (`returning *`, que trae `cost` y `cost_supplier_id`) y no
pasa por `rules/views.ts`, recibe el costo y el proveedor en cada cambio. Lo mismo con la página de la
búsqueda si se arma desde la fila de la base y no desde la vista.

**Qué propongo:** que § 3 diga que **todas** las respuestas con un producto (la lista, el producto, los
tres cambios, el `409`) salen de la misma función de `views.ts` con los permisos de la sesión, y una
prueba por ruta con una persona que tiene «Cambiar los datos de un producto» y no «Ver costos»: la
respuesta no tiene `cost`, el proveedor ni los pasos de la cuenta. Costo: las pruebas.

### 5. El precio no entra en un `bigint`, y un producto así bloquea su lista y el redondeo — Mejora (disponibilidad grave), antes de programar

**Dónde:** catalog.md § 9 («el precio entra en un `bigint`»), § 2 (`price bigint`), § 4 (`apply`).

**La cuenta:** el tope del precio de lista es $ 1 billón = 10¹⁸ millonésimos
(`price-lists/rules/cells.ts:13`), y el costo no puede pasarlo (`cost.ts` solo resta). El precio es
costo × (1 + margen/100) × (1 + IVA): con margen 10.000 % e IVA 27 %, 1,28 × 10²⁰ millonésimos. El
`bigint` de PostgreSQL llega a 9,22 × 10¹⁸: **desborda con un costo de $ 1 billón desde un margen de
alrededor de 630 %**, o con un margen de 10.000 % desde un costo de unos $ 72.000 millones. En
`BigInt` de JavaScript la cuenta no falla; falla la base al guardar (`bigint out of range`).

**El ataque:**

1. Un producto tiene margen 800 % (legítimo, R2.1). Su proveedor manda una lista con un error de tipeo
   (o alguien con permiso de subir listas la arma) con ese artículo a $ 999.999.999.999.
2. Aplicar la lista recalcula el precio en la misma transacción (R2.5, E10): la base rechaza la fila y
   **la lista entera no se aplica**; ningún costo de ese proveedor se pone al día mientras siga esa
   fila. El error es un `500`, no una fila salteada que se pueda revisar.
3. Peor si el costo enorme entró antes, con un margen bajo, y después alguien con «Cambiar márgenes»
   le pone 10.000 %: el cambio da `500`. Y si el precio llegó a guardarse por otro camino, **el
   recálculo del redondeo falla siempre** (`503 recalc-failed`, todo o nada, R3.5): nadie puede volver
   a cambiar el paso hasta que un técnico toque la base.

**Qué propongo** (barato): un tope del precio en `sale.ts`, por ejemplo el mismo $ 1 billón. Un
precio calculado que lo pasa queda «sin precio» (y, con la etapa b de 06, una anomalía), nunca un
error: ni la lista, ni el margen, ni el recálculo fallan por un producto. Una prueba con costo
$ 999.999.999.999, margen 10.000 % e IVA 27 % en los tres caminos (aplicar, cambiar el margen,
recalcular). Y que el precio viaje como texto, como el costo (`cost::text`): `RoundingExample.
calculated` hoy es `number`, que pierde precisión desde unos $ 9.000 millones.

### 6. El índice no tiene tope: una lista enorme deja al servidor cayéndose en cada arranque — Mejora (disponibilidad grave), antes de programar

**Dónde:** ADR-022, «Consecuencias» («unos 30 MB con 100.000 productos»); catalog.md § 1 y § 10;
`deploy/compose.yml` (`mem_limit: 1g` del servidor).

**El ataque:**

1. Alguien con permiso de subir y aplicar listas (o un proveedor que manda un archivo mal armado) sube
   un CSV de 100 MB (el tope de R8.3) con 2 millones de filas cortas de códigos distintos
   (`X0000001;a;1`). 08 no tiene tope de filas (R8.5 solo avisa) y cada código nuevo es un producto
   (08 · R7.2).
2. La lista se aplica. El índice suma 2 millones de productos: a unos 300 bytes cada uno
   (30 MB / 100.000), unos 600 MB más, además de lo que ya usa el proceso.
3. El proceso pasa el gigabyte y el contenedor lo mata. Al arrancar, el índice se vuelve a armar con
   todos los productos de la base, **también los dados de baja**, que nunca se borran: se vuelve a caer.
   El servidor entero (la entrada, todos los módulos) queda caído hasta borrar productos a mano.

Sin atacante pasa lo mismo, despacio: los dados de baja se acumulan para siempre y el índice los
guarda (para el filtro «Dados de baja»).

**Qué propongo:**

- **Un tope de productos** en el catálogo (por ejemplo, 300.000), que se mira antes de aplicar una
  lista: una lista que lo pasaría no se aplica y lo dice. Costo: una consulta antes de aplicar y un
  texto; el número lo decide Carlos (es una regla).
- **Medir el índice con el tope**, no con 100.000: la prueba de performance arma el tope de productos,
  con descripciones de 300 letras, y mira la memoria del proceso.
- **Los dados de baja fuera del índice de palabras:** el filtro «Dados de baja» puede salir de la base
  (son pocos los que se miran), así el índice no crece con la historia.

### 7. Buscar corre en el hilo del servidor, sin límite de pedidos ni tope de palabras — Mejora (disponibilidad), antes de programar

**Dónde:** catalog.md § 5 y § 9 («buscar, sin consulta por cada letra»); ADR-022.

**El ataque:**

1. Cualquiera con sesión (un cajero, o una sesión robada) manda en bucle
   `GET /api/catalog/products?q=a b c d e f …`: 40 palabras de una letra en 80 letras.
2. Cada palabra de una letra es un prefijo que toca casi todo el arreglo de palabras, y con «un error de
   tipeo» (largo ±1, a una letra de distancia) cada una también compara con todas las palabras de 1 y
   2 letras. Después hay que intersecar 40 conjuntos de hasta 100.000 identificadores y ordenarlos por
   descripción.
3. E15 pide menos de 100 ms para una palabra; una búsqueda así tarda varias veces eso, y Node la corre
   en el hilo único: **mientras busca, el servidor no contesta nada más** (entrar, vender cuando exista,
   el espejo). Diez pedidos por segundo desde una sola pestaña lo dejan parado.
4. `after` empeora: si cada página recalcula la búsqueda entera, pedir `after=50`, `after=100`… cuesta
   lo mismo que la primera.

No pude medir cuánto tarda: no hay código. El orden de magnitud sale de la estructura que describe el
ADR.

**Qué propongo:**

- **Un límite de pedidos por sesión** para la lista (por ejemplo, 300 por minuto: alcanza para buscar
  letra por letra con la espera corta que ponga a2), con `limit` como los cambios.
- **Topes de la búsqueda:** como mucho 8 palabras; el error de tipeo, solo desde 4 letras (en «a» un
  error encuentra cualquier cosa y no ayuda); un tope de candidatos por palabra antes de intersecar,
  empezando por la palabra más rara.
- **Las páginas siguientes sin recalcular:** guardar por sesión los identificadores de la última
  búsqueda (uno por sesión, pocos KB) y que `after` sea la posición en esa lista; con otra búsqueda, se
  reemplaza.
- **Una prueba que mide la peor búsqueda permitida** (8 palabras de una letra) contra el tope de
  productos, con la misma meta de E15.

### 8. El recálculo del redondeo y su panel, sin el límite que 06 dejó para 07 — Mejora (disponibilidad)

**Dónde:** administration.md § 8 («Con 07 se le pone un límite propio más bajo al recálculo y al `GET`
de sus números»); catalog.md § 4 y § 10 («100.000 precios en menos de 30 s, de a 1.000»). catalog.md
no lo pone.

**El ataque:**

1. **El panel:** cualquiera con sesión pide `GET /api/administration/rounding` en bucle. Cada pedido
   cuenta en SQL, sobre todos los productos con precio, cuántos cambian con cada uno de los 13 pasos, y
   arma los ejemplos. Sin límite, unas pocas pestañas tienen a PostgreSQL recorriendo la tabla todo el
   tiempo, y las demás consultas esperan.
2. **El recálculo:** alguien con «Cambiar los ajustes» cambia el paso y lo vuelve atrás, una y otra
   vez (30 por minuto le permite el límite de hoy). Cada recálculo tiene la transacción abierta hasta
   30 s con todos los productos bloqueados (`for update` implícito del `update`): mientras tanto, cada
   cambio de margen (meta de 100 ms) y cada lista que se aplica esperan; con varias esperando se acaban
   las conexiones del pool y se frena todo el servidor.

**Qué propongo:**

- El `GET` del panel con límite por sesión (por ejemplo, 10 por minuto) y su resultado guardado en
  memoria hasta que cambie un precio (un contador que suben las transacciones del catálogo). Costo: un
  número y una caché de un valor.
- El recálculo, de a uno por vez en todo el servidor y con un límite propio (por ejemplo, 5 por hora).
- Los cambios de margen, unidad e IVA con `lock_timeout` corto (por ejemplo, 2 s): si hay un recálculo
  en curso, «Se están recalculando los precios: probá en un momento» en lugar de esperar.

### 9. Las horas sin conexión llegan solo con `/api/start`: el celular las tiene viejas todo el día — Mejora (T132)

**Dónde:** administration.md § 5, `sign-in` («`/api/start` suma `offlineHours` … llega con el próximo
contacto, sin un pedido más»); 06 · R11.4 («las recibe cada celular con su próximo pedido al
servidor»).

**El ataque (más bien, el hueco):**

1. Un Administrador baja las horas de 72 a 4 porque no quiere que un celular perdido se abra tres días.
2. Los celulares del local tienen la aplicación abierta todo el día y hacen pedidos, pero
   `/api/start` se pide solo al abrir la aplicación. Siguen con 72.
3. A la noche, uno se lo llevan sin cerrar la aplicación. Sin conexión, abre con la huella (o con el
   PIN del celular, riesgo aceptado en el diseño de 15, § 8) durante 72 horas, no 4, y muestra lo que
   haya en el dispositivo.

El servidor no confirma nada pasadas las 4 horas (usa el valor de ahora, bien), así que no se abre
ninguna sesión; lo que se pierde es lo que se ve en el celular.

**Qué propongo:** que `offlineHours` viaje en la cabecera `X-Ferrebress` (el canal `piggyback`, que es
para esto: «lo de cada módulo que puede esperar», calculado de la memoria), en cada respuesta, y que el
celular la guarde cada vez que cambia. Así cumple R11.4. Costo: un campo de dos cifras en la cabecera.

### 10. El corte de la sesión sin conexión y el valor que falta — Mejora (T132), antes de programar

**Dónde:** administration.md § 5; offline.md § 4, paso 8, y § 5 («El corte de las 24 horas»);
15 · R2.7 y R3.1 (dicen «24 horas»); `app/modules/sign-in/offline/option.ts:78` y `:86` (la entrada y
el corte usan la misma constante).

**Lo que pasa:**

- **El corte:** el diseño de 06 cambia la ventana para entrar y la del servidor, pero el diseño de 15
  sigue diciendo 24 horas para el corte de la sesión ya abierta (R2.7, E14) y para `too-late`. Si se
  programa solo lo que dice administration.md, con 4 horas un celular que entró a las 3 horas sigue con
  la sesión sin conexión hasta las 24.
- **El valor que falta:** «hasta recibirla, la de arranque» (24). Un celular que tiene su contacto
  guardado pero perdió las horas (otro registro de `localStorage` que se borró, una versión que las
  guarda con otra clave) usa 24 aunque el Administrador haya puesto 4.
- **Valor tocado en el celular:** quien pueda editar `localStorage` del celular desbloqueado también
  puede tocar el código, riesgo que el diseño de 15 ya acepta; el servidor no confirma. Nada nuevo.
- **Si sube mientras el celular está sin conexión** (24 → 72): el celular corta a las 24; el servidor
  hubiera aceptado más. Es lo prudente; no hay nada que corregir.

**Qué propongo:** las horas en el mismo registro que el contacto (`offline-contact`:
`{ at, maxSeenAt, hours }`), para que se guarden y se pierdan juntas; sin `hours`, **la opción más
corta** (4), no la de arranque; la entrada, el texto «podés entrar hasta…» y el corte leen ese mismo
valor; y offline.md y 15 · R2.7 y R3.1 pasan a decir «las horas de R2.2». Una prueba: con 4 horas
guardadas, una sesión abierta sin conexión a las 3 horas se corta a las 4. Costo: chico.

### 11. Qué pasa si alguien con «Cambiar los ajustes» pone los de la entrada al máximo o al mínimo — Mejora (T132)

**Dónde:** administration.md § 2 (los cuatro ajustes) y § 5; diseño de 01, § 8 (los límites cuentan
por dispositivo **y** por dirección); `sign-in/settings.ts` (`google` y `passkey` son la misma ventana
para las dos claves); `platform/limits/rate-limit.ts`.

- **Horas sin conexión al máximo (72):** un celular robado se abre sin conexión tres días en lugar de
  uno. Es el riesgo que R11.1 dice y que Carlos aprobó, queda en Quién hizo qué con el antes y el
  después, y el servidor no confirma nada después del plazo ni de una cuenta dada de baja. Lo que falta
  es decirlo en el panel en el momento de elegir (el texto de R11.1 ya existe: «Más horas es más tiempo
  en que un celular perdido se abre sin que el servidor se entere»). Y que se sepa que **bajarlas no
  alcanza a un celular que ya está perdido** (punto 9): para eso se da de baja la cuenta o se quita la
  huella.
- **Intentos al máximo (60 por minuto, 100 fallidos por hora):** no encontré un ataque que se abra. Con
  Google no hay nada que adivinar (el pase lo firma Google) y con la huella tampoco (una firma). La
  memoria del limitador crece con los pedidos, no con el tope: cada pedido agrega como mucho una clave,
  y las vencidas se barren. Subirlos no cambia eso de manera que pueda medir.
- **Intentos al mínimo, el riesgo de verdad:**
  - **Google o la huella en 3 por minuto:** el límite cuenta también **por dirección**, con el mismo
    número, y en el local todos los dispositivos salen por la misma dirección pública. Con 3, a la
    apertura, cuando entran varios a la vez, el cuarto intento de todo el local espera un minuto. Y
    cualquiera que comparta esa dirección (el Wi-Fi de clientes, si sale por el mismo router) deja sin
    entrar a todo el local con tres pedidos por minuto, sin cuenta.
  - **Fallidos por cuenta en 5 por hora:** quien conozca el identificador de una huella bloquea esa
    forma de entrar de la persona con 5 firmas malas por hora en lugar de 20. La persona sigue entrando
    con Google (01 · R2.10). Las confirmaciones sin conexión también cuentan ese límite (diseño de 15,
    § 4): no pude comprobar si un `too-many-attempts` en una confirmación es «probá después» o un
    rechazo que la saca de lo pendiente; si es un rechazo, el bloqueo hace perder entradas sin conexión.

**Qué propongo:**

- Que el ajuste valga **solo para la clave del dispositivo**, y que el límite por dirección quede fijo
  y más alto (por ejemplo, 5 veces el máximo del ajuste, como hoy el de `/api/start` es más alto que el
  de un dispositivo). Así bajarlo frena a un dispositivo, no al local. Es una regla: R2.9 dice «por
  dispositivo»; el diseño hoy lo aplica también por dirección. Se le pregunta a Carlos. Costo: una
  ventana más en `settings.ts`.
- Una prueba: en la confirmación sin conexión, `too-many-attempts` deja la entrada en lo pendiente.

### 12. Lo que entra: `q`, `brand`, `after` — Mejora

**Dónde:** catalog.md § 3 y § 9.

- **`q` de 80 letras:** decir en qué se cuentan. Normalizar puede agrandar el texto (la descomposición
  compatible de algunos caracteres da más de diez), así que se mira el largo crudo en bytes antes (por
  ejemplo, 320) y en letras después de normalizar; sin caracteres de control.
- **`brand`** no tiene largo en § 9: hasta 80 letras, como la marca en 08, y se compara por su
  `searchKey`.
- **`after`** tiene dos formas: un entero de 0 al total (la búsqueda) o la descripción y el
  identificador (la lista alfabética). Que el contrato diga su forma exacta (por ejemplo, base64url de
  un JSON validado con su esquema, hasta 600 caracteres; la descripción, hasta 300 letras; el
  identificador, UUID), y que la comparación vaya como parámetros (`(lower(description), id) > ($1,
  $2)`), nunca armada como texto.
- **`show`**, de su lista; un parámetro desconocido, `400`.

No encontré inyección posible: buscar no va a la base y la página es por clave; queda escribirlo y
probarlo con `'`, `%`, `\` y `;` en `q`, `brand` y `after`.

### 13. Auditoría — Mejora

**Dónde:** catalog.md § 6.

- **Los rechazos**, «una vez por minuto» (lo de la plataforma): R4.2 y E19 piden que el rechazo quede;
  queda el primero de cada minuto. Es el mismo criterio que el resto de los módulos y lo doy por bueno,
  pero E19 no tiene que esperar ver cada uno.
- **El precio que cambió:** el cambio de margen o de IVA cambia el precio, y el evento guarda solo el
  margen o el IVA. Para reconstruir qué se cobraba, sumar el precio de antes y el de después al dato del
  evento (no al texto). Costo: dos números por evento.
- **El nombre del producto** en el texto sale de la lista del proveedor (hasta 300 letras): que el
  evento guarde también el identificador, y que Quién hizo qué lo muestre como texto, sin armar HTML.
- **El límite por sesión, no por cuenta:** con el celular y la computadora, una persona tiene dos
  sesiones y el doble de cambios. Por cuenta es igual de barato (`products:account:<id>`).

### 14. El índice puede quedar distinto de la base — Mejora (integridad)

**Dónde:** catalog.md § 1 («se pone al día al confirmar … con lo que devuelven las funciones de la
fachada»); ADR-022.

Si lo que corre al confirmar falla (una excepción al partir una descripción rara, un producto con un
campo inesperado), la base ya confirmó y el índice no: un producto dado de baja sigue apareciendo en la
búsqueda, o uno nuevo no aparece, hasta reiniciar. No da acceso a nada, pero lo ve todo el local.
Además, insertar palabra por palabra en un arreglo ordenado cuesta lo que mide el arreglo por cada
una: una lista con 100.000 productos nuevos mueve el arreglo entero 100.000 veces, en el hilo del
servidor.

**Qué propongo:** si poner al día falla, rearmar el índice entero (de la base) y anotarlo en el
registro; y con muchos cambios (más de unos miles), rearmar el arreglo una sola vez en lugar de insertar
de a uno, cediendo el turno como hace 08 al aplicar.

### 15. Lo que queda en el dispositivo — Mejora (para a2)

**Dónde:** R6.2 («se ve en gris lo último que se vio»); catalog.md no dice dónde vive.

Con 72 horas sin conexión (punto 11), un celular robado se abre y muestra lo que el catálogo haya
dejado en el dispositivo. Que el diseño diga, como el de 06 («No se guarda nada en el dispositivo»),
que lo último que se vio vive solo en la memoria de la pestaña, nunca en `localStorage` ni en
IndexedDB; y que, al perder «Ver costos» con la pantalla abierta (los permisos llegan solos, 02 · R7.8),
se descarte lo que trae costos. El espejo (R6.1) es entre dispositivos de la misma persona (03 · R1.1):
no encontré cómo llevaría costos a otra persona.

### 16. Los documentos del paso del redondeo no dicen lo mismo — Mejora

**Dónde:** administration.md § 2 (`roundingStep` «entero en pesos; 0 es sin redondeo», opciones 0 a
5000) contra catalog.md § 2 (T136: en centavos, de 1 a 1.000.000) y 06 · R3.2 (hasta $ 10.000).

Si se programa la migración que multiplica por 100 y el contrato queda con las opciones de
administration.md, el servidor no arranca (valida lo guardado, bien); si se cambia el contrato y no la
migración, tampoco. No es un ataque, pero la documentación manda: administration.md § 2 tiene que decir
los valores en centavos con la lista nueva, y la prueba de la migración, que 0 pasa a 1 y 1000 a
100.000.

## Lo que miré y no encontré nada

- **Cambiar márgenes, unidad e IVA sin permiso:** el permiso se mira en el servidor en cada ruta
  (R4.2), también en «Deshacer», que es otro cambio. Falta solo la prueba de cada uno sin permiso: `403`,
  nada cambia y el rechazo queda.
- **Cambiar lo de otro con un identificador:** el catálogo es uno solo para todo el local; no hay datos
  de una persona. El identificador pasa por `uuidParams`.
- **Pedidos desde otros sitios:** los cambios son `POST` con el control de `Origin` y la cookie
  `SameSite=Strict` de la plataforma.
- **Datos personales:** ninguno nuevo; el producto no tiene datos de personas. Nada sale a terceros.
- **Secretos y despliegue:** nada nuevo en el `.env`, Caddy ni el compose.
- **Dependencias:** el diseño no suma ninguna biblioteca (el índice es propio).
- **Repetir un cambio:** el `before` hace que repetir el mismo pedido dé `409` en lugar de un segundo
  cambio; el límite de 60 por minuto acota los distintos.
- **Precios negativos o cero:** el margen va de 1 a 10.000, el IVA de su lista y el costo no es
  negativo (08): el precio no puede ser negativo.
