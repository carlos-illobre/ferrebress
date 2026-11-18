# 07 · Catálogo: reglas

Los productos con su margen y su precio de venta, y buscarlos. **Los productos salen solo de las
listas de precios** (capítulo 08): el catálogo no da de alta ni de baja nada; pone lo que la lista
no trae (la unidad, el IVA si se cambia a mano y el margen) y calcula el precio.

Se construye en tres etapas (roadmap): **a. Catálogo base**, en dos partes, **a1. el servidor y
buscar** (este documento) y **a2. las pantallas** (la lista, la ficha y el teclado, en
`screens.md`); **b. Código y foto**; y **c. Duplicados e historia**, que se escriben cuando les toque.
Lo que Carlos ya confirmó de la etapa c está en el [resumen](summary.md).

**Estado:** a1, reglas aprobadas y programadas; a2, b y c, por escribir.

**Lo que no está acá, y por qué:**

- **No se da de alta ni de baja un producto a mano:** los crea y los da de baja una lista (08 · R7).
- **No hay cambio de margen de varios productos a la vez:** cada producto tiene el suyo.
- **No hay proveedor en uso:** en esta etapa cada producto tiene un solo proveedor; el mismo código en
  dos proveedores son dos productos (08 · R7.1). Unir productos y elegir el proveedor más barato es de
  la etapa c.
- **No hay preferencia de ver los importes con decimales:** el precio se muestra con los decimales
  del paso del redondeo (R2.3), que ya decide.
- **Vender** un producto sin precio o sin costo es del capítulo de Ventas.

## 1. El producto

- **R1.1** **Un producto tiene:** el código de su proveedor, la descripción, la marca y el código de
  barras que pone su lista (08 · R7.2, R7.3); su costo, de esa lista; y lo que pone el catálogo: la
  unidad, el IVA y el margen.
- **R1.2** **La unidad:** un., kg, m o L; todo producto arranca como «un.». Lo que va por unidad se
  vende en cantidades enteras; lo fraccionado (kg, m, L), hasta con un decimal.
- **R1.3** **El IVA:** 21 %, 10,5 % o 27 %, el que dice la lista o el de arranque del proveedor
  (08 · R3.6). No hay productos exentos. Cambiado a mano, ninguna lista lo vuelve a tocar (08 · R7.3).
- **R1.4** **Cambiar la unidad o el IVA** pide «Cambiar los datos de un producto». Se guarda al
  cambiarlo, sin botón «Guardar», con «Deshacer» durante 5 segundos (como 06 · R2.1). «Deshacer» lo
  deja como estaba: un IVA que ponía la lista vuelve a ser de la lista, que lo sigue poniendo.
- **R1.5** **Si dos personas cambian el mismo dato a la vez,** la segunda no pisa a la primera: su
  cambio no se guarda y se le dice «Lo cambió otra persona recién: ahora dice <valor>», con el valor
  nuevo ya en la pantalla, para que decida de nuevo (como los datos de un proveedor, 08, y los
  ajustes, 06 · R2.3). Si cambian datos distintos, se guardan los dos.
- **R1.6** **Un producto dado de baja** (08 · R7.4) no aparece en la búsqueda; se ve con el filtro
  «Dados de baja», con su margen guardado, que busca por palabras empezadas y por marca, sin el error
  de tipeo de R3.1. Se le pueden cambiar el margen, la unidad y el IVA, para dejarlo listo. Si una
  lista lo vuelve a traer, vuelve solo, con su margen (08 · R7.5).

## 2. El margen y el precio

- **R2.1** **El margen** es uno de los cinco márgenes rápidos de Administración (06 · R4) o un
  porcentaje entero de 1 a 10.000 escrito a mano. Un producto nuevo no tiene margen (08 · R7.2).
- **R2.2** **El precio de venta** es costo × (1 + margen) × (1 + IVA), con el margen sobre el costo
  sin IVA, redondeado para arriba al múltiplo del paso de Administración (06 · R3). Con costo
  $ 1.500, margen 100 % e IVA 21 %, da $ 3.630, que con el paso de $ 1.000 se cobra $ 4.000.
- **R2.3** **El paso del redondeo** es un 1 o un 5 seguido de ceros, de $ 0,05 a $ 10.000, o «sin
  redondeo», que es un centavo (06 · R3.2). El precio de venta se muestra con los decimales del paso
  (con $ 0,05, dos; con $ 1.000, ninguno); el costo y «Así se calcula», siempre con sus centavos
  (06 · R3.6).
- **R2.4** **Sin margen,** el producto dice «sin precio»; **sin costo** (su proveedor dejó de traerlo
  o se dio de baja), «sin costo».
- **R2.5** **El precio cambia solo** cuando cambia el costo (una lista, 08 · R7.6), el margen, el IVA o
  el paso del redondeo (06 · R3), sin que nadie haga nada más.
- **R2.6** **«Así se calcula»** muestra la cuenta del precio, paso a paso: el costo con su propia
  cuenta (08 · R3.4), el margen, el IVA y el redondeo.
- **R2.7** **Cambiar el margen** pide «Cambiar márgenes», que incluye «Ver costos» (08 · R1.2): quien
  elige un margen ve el costo sobre el que lo pone. Se guarda al cambiarlo, con «Deshacer» durante 5
  segundos, y el precio nuevo se ve en menos de 100 ms. Dos personas a la vez: R1.5.

## 3. Buscar

- **R3.1** **Se busca por palabras:** en cualquier orden, sin acentos ni mayúsculas, con palabras
  empezadas («torn» encuentra «tornillo»), en el código, la descripción y la marca; hasta 8 palabras.
  Una palabra de 4 letras o más, escrita entera, puede tener un error de tipeo («tornilo» encuentra
  «tornillo»); una a medio escribir, no («torni» con un error no encuentra nada).
- **R3.2** **Un código escrito entero va primero:** el del proveedor o el de barras, aunque tenga
  signos («A-1.2» encuentra «A12»).
- **R3.3** **Necesita conexión:** el catálogo vive en el servidor y se baja de a partes. Con hasta
  100.000 productos, contesta en menos de 100 ms. Buscar sin conexión llega con la etapa b de Sin
  conexión (capítulo 15), junto con vender sin conexión (constitución, IV).
- **R3.5** **Como mucho 200.000 productos que no están dados de baja,** el doble de los que se
  esperan: una lista que haría pasar ese número no se aplica, y lo dice (08 · R7.7). Los dados de baja
  no cuentan.
- **R3.4** **Sin nada escrito,** en orden alfabético (hasta que exista Vender, que puede ordenar por lo
  más vendido). Se filtra por marca, por «Sin precio» y por «Dados de baja». Arriba se ve cuántos
  productos hay y cuántos están sin precio.

## 4. Quién ve qué

- **R4.1** **Ver el catálogo y los precios de venta pide solo la sesión.** Con «Ver costos» se ven
  además el margen, el proveedor, el costo y «Así se calcula»; sin él, solo el precio de venta: con el
  margen y el precio a la vista se podría sacar el costo. Por lo mismo, «Ver quién hizo qué» incluye
  «Ver costos» (05 · R3.1).
- **R4.2** **El servidor controla cada cambio:** sin el permiso, lo rechaza sin cambiar nada,
  diciendo qué permiso hace falta (02 · R7.6), y queda como intento rechazado en Quién hizo qué
  (05 · R1.2).
- **R4.3** **Dos permisos nuevos,** en el grupo «Catálogo»: «Cambiar márgenes» (incluye «Ver costos»)
  y «Cambiar los datos de un producto». Como todo permiso nuevo, se le suman solos al rol
  Administrador (02 · R7.4).

## 5. Quién hizo qué

- **R5.1** **Cada cambio de margen, de unidad y de IVA de un producto** va a Quién hizo qué, con quién
  lo hizo, el producto y el valor de antes y el de después, en el grupo «Catálogo».

## 6. El espejo y sin conexión

- **R6.1** **Con el celular y la computadora vinculados,** lo buscado, los filtros y el producto
  elegido se espejan como en cualquier pantalla (03 · R6).
- **R6.2** **Sin conexión,** se ve en gris lo último que se vio, con «Reintentar», y no se puede
  cambiar nada (como 06 · R1.6).

## Escenarios

### El producto

- **E01** **Dado** un producto nuevo de una lista, **cuando** se lo mira, **entonces** es «un.», tiene
  el IVA de su lista y dice «sin precio».
- **E02** **Dado** quien tiene «Cambiar los datos de un producto», **cuando** le pasa la unidad a kg,
  **entonces** se guarda sin tocar «Guardar» y aparece «Deshacer», que durante 5 segundos la vuelve a
  «un.».
- **E03** **Dado** un producto con el IVA cambiado a mano a 27 %, **cuando** se aplica una lista que
  dice 21 %, **entonces** el producto sigue con 27 %.
- **E04** **Dado** dos personas que miran un producto con margen 50 %, **cuando** la primera lo pasa a
  80 % y después la segunda a 60 %, **entonces** queda 80 % y a la segunda se le dice «Lo cambió otra
  persona recién: ahora dice 80 %».
- **E05** **Dado** un producto que la última lista dejó de traer, **cuando** se busca su descripción,
  **entonces** no aparece; con el filtro «Dados de baja», sí, con su margen.

### El margen y el precio

- **E06** **Dado** un producto con costo $ 1.500 e IVA 21 % y el paso en $ 1.000, **cuando** se le
  elige margen 100 %, **entonces** su precio es $ 4.000 y «Así se calcula» muestra $ 3.630 antes de
  redondear.
- **E07** **Dado** el paso en $ 0,05 y un precio calculado de $ 10,12, **cuando** se lo mira,
  **entonces** se cobra $ 10,15 y se ve con dos decimales.
- **E08** **Dado** «sin redondeo» y un precio calculado de $ 10,123, **cuando** se lo mira,
  **entonces** se cobra $ 10,13.
- **E09** **Dado** quien tiene «Cambiar márgenes», **cuando** escribe 0, 10.001 o 12,5, **entonces** no
  se guarda y se dice «Un número entero de 1 a 10.000».
- **E10** **Dado** un producto con margen, **cuando** una lista le cambia el costo, **entonces** su
  precio cambia solo, con el mismo margen.
- **E11** **Dado** un producto que su proveedor dejó de traer, **cuando** se lo mira con el filtro
  «Dados de baja», **entonces** dice «sin costo».

### Buscar

- **E12** **Dado** un producto «Tornillo autoperforante 8 x 1», **cuando** se busca «autoperf torn»,
  «tornilo» o «TORNILLO», **entonces** aparece.
- **E13** **Dado** un producto con código «A-1.2» y otro cuya descripción tiene «A12», **cuando** se
  busca «A12», **entonces** el del código va primero.
- **E14** **Dado** un producto con código de barras 7790001000017, **cuando** se lo escribe entero,
  **entonces** aparece primero.
- **E15** **Dado** 100.000 productos, **cuando** se busca una palabra, **entonces** contesta en menos de
  100 ms.
- **E16** **Dado** 30 productos, 4 sin margen, **cuando** se abre el catálogo sin nada escrito,
  **entonces** se ven en orden alfabético y arriba dice «30 productos · 4 sin precio».

### Quién ve qué

- **E17** **Dado** una persona sin ningún permiso del catálogo, **cuando** mira un producto, **entonces**
  ve su precio de venta, y no su margen, su costo, su proveedor ni «Así se calcula».
- **E18** **Dado** un rol al que se le tilda «Cambiar márgenes», **cuando** se lo mira, **entonces**
  «Ver costos» quedó tildado solo y no se puede destildar.
- **E19** **Dado** una persona sin «Cambiar márgenes», **cuando** le manda al servidor un margen,
  **entonces** no cambia nada, se le dice qué permiso falta y queda en Quién hizo qué como rechazado.
- **E20** **Dado** un cambio de margen de 50 % a 80 %, **cuando** se abre Quién hizo qué, **entonces**
  se ve quién lo hizo, el producto, 50 % y 80 %.

### El espejo y sin conexión

- **E21** **Dado** el celular y la computadora vinculados, **cuando** en la computadora se busca y se
  elige un producto, **entonces** el celular muestra lo mismo.
- **E22** **Dado** el catálogo abierto, **cuando** se corta la conexión, **entonces** se ve en gris lo
  último que se vio, con «Reintentar», y no se puede cambiar el margen.

### Lo que se sumó al revisar el diseño

- **E23** **Dado** un producto con el IVA de su lista en 21 %, **cuando** se lo pasa a 27 % y se toca
  «Deshacer», **entonces** vuelve a 21 % y la próxima lista que diga 10,5 % se lo cambia.
- **E24** **Dado** un producto «Tornillo», **cuando** se busca «tornilo», **entonces** aparece; **y
  cuando** se busca «tornu», **entonces** no.
- **E25** **Dado** 199.990 productos activos, **cuando** se aplica una lista que crearía 20 más,
  **entonces** no se aplica y dice que se pasaría de 200.000.
- **E26** **Dado** una persona sin sesión, **cuando** pide el catálogo al servidor, **entonces** no
  recibe nada.
- **E27** **Dado** dos productos dados de baja, «Gancho Bremen» y «Grampa», **cuando** con el filtro
  «Dados de baja» se busca «ganc» o se elige la marca Bremen, **entonces** aparece solo el gancho.
- **E28** **Dado** un rol al que se le tilda «Ver quién hizo qué», **cuando** se lo mira, **entonces**
  «Ver costos» quedó tildado solo y no se puede destildar.
