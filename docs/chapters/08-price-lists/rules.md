# 08 · Listas de precios: reglas

Los proveedores y sus listas de precios. **Es de donde salen los productos:** nadie da de alta un
producto a mano; se sube la lista de un proveedor y el sistema crea sus productos, les pone o les
cambia el costo y da de baja los que ya no vienen. Subir una lista tiene que ser lo más fácil y lo
menos manual posible: es lo central de la aplicación.

Se construye en tres etapas (roadmap): **a. La lista a mano** (R1 a R9, este documento), **b. Los
lectores generados por IA** y **c. Otros formatos y ofertas**, que se escriben cuando les toque. Lo
que Carlos ya confirmó de la etapa b está en el [resumen](summary.md).

**Estado:** etapa a, reglas a aprobar por Carlos.

**Lo que no está acá, y por qué:**

- **No se da de alta ni de baja un producto a mano:** todo producto sale de una lista, y lo que una
  lista deja de traer se da de baja solo (R7). Todo proveedor manda su lista: sin ella no se sabe
  qué se va a facturar, así que tampoco hay una lista escrita a mano dentro de la aplicación.
- **Las listas no se reciben solas** (ni por correo ni desde el portal del proveedor): se suben a
  mano.
- **No hay aviso de qué remarcar:** si cambian los precios, se sube la lista nueva y los precios
  cambian.
- **No se venden bultos:** el costo de un producto es el de una unidad. El precio por bulto y el
  precio sugerido por el proveedor no se guardan.
- **Nadie marca a mano qué columna es qué:** una planilla que el sistema no sabe leer no se lee
  (R4.6). Si para leerla hiciera falta que una persona decida, subir una lista dejaría de ser
  automático.
- **El margen, el precio de venta, la búsqueda y la ficha del producto** son del catálogo (capítulo
  07), que sigue a esta etapa.
- **Los productos en otra moneda** esperan a que se decida cómo se cobran (roadmap, T108): sus
  filas se saltean (R5.4).

## 1. La pantalla y los permisos

- **R1.1** **Catálogo → Listas**, en el celular y en la computadora, con las mismas reglas. Muestra
  los proveedores, cada uno con la fecha de su última lista aplicada y si tiene una lista esperando,
  y «Subir lista». Se busca un proveedor mientras se escribe, sin distinguir acentos ni mayúsculas.
- **R1.2** **Los permisos de este capítulo,** en el grupo «Catálogo»:

  | Permiso | Qué deja hacer |
  |---|---|
  | Ver costos | Ver cómo cobra cada proveedor, sus listas, los costos con su explicación y los productos de cada proveedor, y bajar el archivo original de una lista |
  | Administrar proveedores | Dar de alta, cambiar, dar de baja y reactivar un proveedor, y cambiar cómo cobra |
  | Cargar listas | Subir una lista, aplicarla y descartarla |

  «Administrar proveedores» y «Cargar listas» incluyen «Ver costos»: al tildar cualquiera de los dos
  en un rol, se tilda solo (02 · R7.1). Como todo permiso nuevo, se le suman solos al rol
  Administrador (02 · R7.4).
- **R1.3** **Sin ningún permiso se ven** los proveedores con sus datos de contacto (R2.1): a quien
  atiende le sirve el teléfono del proveedor. No se ven costos, descuentos, listas ni productos.
- **R1.4** **El servidor controla cada pedido:** sin el permiso lo rechaza sin cambiar nada, diciendo
  qué permiso hace falta (02 · R7.6), y queda como intento rechazado en Quién hizo qué (05 · R1.2).
- **R1.5** **Todo necesita conexión:** los proveedores, las listas y los productos están en el
  servidor. Sin conexión, la pantalla se ve gris con lo último que se vio, con «Reintentar», y no
  deja subir ni cambiar nada.
- **R1.6** **Con el celular y la computadora vinculados,** la pantalla se espeja como cualquiera (03
  · R6). El archivo de una lista se elige en el dispositivo que lo tiene; el otro ve el avance y el
  resultado.
- **R1.7** **Cada dato se guarda al cambiarlo,** sin botón «Guardar», con «Deshacer» durante 5
  segundos, como los ajustes de Administración (06 · R2.1). Un valor que no vale no se guarda y se
  dice en el lugar por qué. Lo que cambia costos no lleva «Deshacer»: se confirma antes (R2.6, R3.5,
  R6.5).

## 2. Los proveedores

- **R2.1** **De un proveedor se guarda:** el nombre (obligatorio y único, sin distinguir acentos ni
  mayúsculas), el vendedor, el teléfono o WhatsApp, el correo y una nota. Los ve cualquiera con
  sesión (R1.3).
- **R2.2** **Se da de alta** con solo el nombre, desde la pantalla o al subir una lista que no es de
  ningún proveedor conocido (R4.3). Lo demás se completa cuando se quiera.
- **R2.3** **La pantalla de un proveedor** muestra sus datos, cómo cobra (R3), sus listas (R6.7) y
  sus productos (R8).
- **R2.4** **Dar de baja un proveedor** lo saca de la lista de proveedores, descarta su lista en
  espera y quita su costo de todos sus productos: los que solo traía él quedan dados de baja (R7.4).
  Antes se ve cuántos productos pierden su costo y cuántos quedan dados de baja, y se confirma con
  «Dar de baja con sus 12 productos»; es de lo poco que pide confirmación, porque no se recupera con
  «Deshacer».
- **R2.5** **Un proveedor dado de baja se puede reactivar:** vuelve con sus datos, cómo cobra y sus
  lectores. Sus productos vuelven al aplicar su próxima lista (R7.5). Los dados de baja se ven
  aparte, con «Reactivar».
- **R2.6** **No se puede dar de baja un proveedor mientras una lista suya se está aplicando:** se
  dice por qué y se espera a que termine.

## 3. Cómo cobra cada proveedor

- **R3.1** **El costo de un producto es lo que realmente se paga por una unidad, sin IVA,**
  calculado igual para todos los proveedores, para poder compararlos.
- **R3.2** **De cada proveedor se configura:**
  - si los precios de su lista **incluyen IVA** o no (de arranque, no);
  - sus **descuentos**, en orden: cada uno con un nombre («General», «Contado»), un porcentaje mayor
    que 0 y menor que 100, y si vale para todas las marcas o para una sola;
  - su **IVA de arranque**: 21 % (de arranque), 10,5 % o 27 %, para los productos cuya lista no dice
    el IVA;
  - **qué pasa con los costos al cambiar cómo cobra** (R3.5): «Recalcular con la última lista» (de
    arranque) o «Desde la próxima lista».
- **R3.3** **La cuenta del costo:** el precio de lista de una unidad; si incluía IVA, se le quita; y
  después cada descuento que le toca al producto, uno sobre el resultado del anterior, en el orden
  en que están. Con precio de lista $ 2.314, general 25 % y contado 5 %: $ 2.314 − 25 % = $ 1.735,50;
  − 5 % = $ 1.648,73.
- **R3.4** **El costo no se redondea** y se muestra siempre con sus centavos. Cada costo deja ver su
  cuenta paso a paso, con los números de origen y la fecha de la lista (00 · R8.1).
- **R3.5** **Cambiar cómo cobra un proveedor** (el IVA incluido o los descuentos), según lo elegido en
  ese proveedor:
  - «Recalcular con la última lista»: se vuelven a calcular los costos de sus productos con su
    última lista aplicada. Antes se ve cuántos costos cambian y se confirma con «Cambiar 2.167
    costos» o se cancela; si no cambia ninguno, se guarda sin preguntar. Todo o nada: si falla, no
    cambia ni la configuración ni ningún costo.
  - «Desde la próxima lista»: se guarda y los costos quedan como están hasta la próxima lista.

  Cambiar el IVA de arranque no cambia el IVA de ningún producto que ya existe.
- **R3.6** **El IVA de un producto** es el que dice la lista, si lo dice; si no, el IVA de arranque
  del proveedor. Un IVA cambiado a mano en el producto (capítulo 07) manda: ninguna lista lo pisa.

## 4. Subir una lista

- **R4.1** **Se sube un archivo** desde «Subir lista» o desde la pantalla de un proveedor, en el
  celular o en la computadora, sin decir nada más: el sistema reconoce de quién es, la lee y muestra
  qué cambia (R6). Con una lista de un formato conocido, subirla, revisarla y aplicarla lleva menos
  de un minuto.
- **R4.2** **Formatos:** Excel (`.xlsx` y `.xls`) y CSV. El tamaño máximo lo fija un Administrador
  (06 · R8); de arranque, 30 MB. Un archivo de otro formato o más grande se rechaza diciendo por qué,
  sin guardarlo.
- **R4.3** **De quién es:** si se subió desde la pantalla de un proveedor, es de ese proveedor. Si
  no, el sistema la reconoce con los lectores que ya existen (R5.2). Si ningún lector la reconoce,
  pregunta «¿De qué proveedor es?», con la lista de proveedores y «Proveedor nuevo»; es la única
  pregunta, y solo la primera vez de cada formato.
- **R4.4** **El archivo original se guarda siempre,** tal como se subió y con su nombre, también el
  de una lista que no se pudo leer o que se descartó. Lo baja quien tiene «Ver costos».
- **R4.5** **La fecha de la lista** es la que dice la planilla o el nombre del archivo. Si no la
  dice, es la fecha del servidor en el momento de subirla.
- **R4.6** **Si no se puede leer** (ningún lector la entiende, R5.5; o el archivo está dañado), se
  dice por qué, la lista queda como «No se pudo leer» con su archivo guardado y se suma una anomalía
  (R9.2). No se pregunta qué columna es qué.
- **R4.7** **Lista completa o solo cambios:** al subirla se dice si trae todo lo que vende el
  proveedor («Lista completa», de arranque) o solo una parte («Solo cambios»). Una lista de solo
  cambios nunca da de baja nada (R7.3).
- **R4.8** **Una lista en espera por proveedor:** subir otra lista del mismo proveedor descarta la
  que estaba esperando, y se dice.
- **R4.9** **El avance se ve siempre** (00 · R7.3): al subir, cuánto del archivo; al leer, cuántas
  filas de cuántas. Una lista de 10.000 filas muestra qué cambia en menos de 10 segundos.

## 5. Los lectores

- **R5.1** **Un lector** es lo que entiende un formato de planilla de un proveedor: recibe las
  hojas, las filas y las celdas, y devuelve cada producto con su código, su descripción, su marca, su
  precio de lista por unidad, su IVA y su código de barras, los que la planilla traiga. Cada
  proveedor tiene varios: uno por cada formato que tuvo su planilla. Los formatos cambian sin aviso,
  así que sumar un lector tiene que ser fácil y no puede frenar al resto.
- **R5.2** **Cada lector sabe decir si una planilla es suya.** Al subir un archivo se prueban primero
  los lectores del proveedor, si se sabe cuál es, y después los de los demás. Se usa el primero que
  la reconoce y cuyo resultado pasa la comprobación (R5.4).
- **R5.3** **El lector automático:** si ningún lector la reconoce, el sistema intenta leerla solo.
  Busca la fila del encabezado por los nombres de siempre (código, artículo, descripción, detalle,
  precio, lista, marca, IVA) y por lo que hay en cada columna, y toma como marca o grupo los
  renglones sueltos que hay entre los productos. Si lo logra sin dudas y pasa la comprobación,
  queda guardado como un lector nuevo de ese proveedor, y la próxima planilla con ese formato entra
  directo.
- **R5.4** **La comprobación:** lo que devuelve un lector no se da por bueno sin revisarlo. Cada
  producto tiene código, descripción y un precio mayor que cero; todo precio que devuelve está
  escrito en la planilla; y cada fila de la planilla termina como producto o como fila salteada con
  su motivo: sin código, sin precio, precio cero o negativo, precio que no es un número, código
  repetido en la misma lista, o en otra moneda. Los títulos, los renglones de marca y las filas
  vacías no son filas salteadas.
- **R5.5** **Si el lector automático duda o no pasa la comprobación** (por ejemplo, hay dos columnas
  de precio y no se sabe cuál es la de lista), la lista no se lee (R4.6). Queda guardada, y se lee
  sola cuando exista un lector que la entienda: uno escrito por un programador, que llega con una
  versión nueva de la aplicación, o uno generado por IA (etapa b).
- **R5.6** **Un lector no se edita:** un formato nuevo es un lector nuevo, y los anteriores quedan,
  por si el proveedor vuelve a un formato viejo.
- **R5.7** **La primera lista que lee un lector nuevo** (automático o generado) se marca «Lector
  nuevo: revisala» en lo que cambia (R6). Si la lista se aplica, el lector queda activo y esa
  planilla con su resultado queda guardada como su prueba; si se descarta, el lector se descarta con
  ella.
- **R5.8** **Más → Administración → Lectores** muestra los lectores de cada proveedor: de dónde salió
  cada uno (escrito por un programador, automático o generado por IA), desde cuándo existe y qué
  lista leyó por última vez. Quien tiene «Cambiar los ajustes» (06 · R1.4) puede desactivar uno que
  lee mal, y volver a activarlo; uno desactivado no se usa desde la planilla siguiente.
- **R5.9** **Un lector nuevo o desactivado vale desde la planilla siguiente,** sin reiniciar nada ni
  esperar una versión nueva de la aplicación.
- **R5.10** **Un lector no puede hacer otra cosa que leer:** corre encerrado, sin acceso a la base, a
  la red, a los archivos ni a las claves, y con un tope de tiempo y de memoria. Vale para todos,
  también para los que escribe un programador.

## 6. Ver qué cambia y aplicar

- **R6.1** **Nada se guarda hasta aplicar:** una lista leída queda «En espera», y mientras tanto los
  productos y los costos son los de antes.
- **R6.2** **El resumen** dice de quién es la lista, su fecha, si es completa o de solo cambios, y
  cuántos productos son nuevos, cuántos cambian de costo (con la variación promedio), cuántos quedan
  igual, cuántos ya no vienen y cuántas filas se saltearon, con su motivo.
- **R6.3** **El detalle** muestra cada producto con el costo que tenía y el nuevo, los que cambian
  primero, y cada costo deja ver su cuenta (R3.4). Se baja de a partes y se puede buscar en él.
- **R6.4** **Para revisar:** los costos que cambian más que un porcentaje se muestran aparte, arriba
  de todo: una columna mal leída puede cambiar mil costos de golpe. El porcentaje lo fija un
  Administrador (06 · R8); de arranque, 50 %.
- **R6.5** **Aplicar** se confirma con un botón que dice lo que va a pasar («Aplicar: 4 nuevos, 31
  costos, 2 bajas»). Si la lista da de baja más que un porcentaje de los productos del proveedor, el
  aviso lo dice antes y el botón también («Aplicar y dar de baja 812 productos»). Ese porcentaje lo
  fija un Administrador (06 · R8); de arranque, 20 %.
- **R6.6** **Todo o nada:** si aplicar falla o se corta, no queda nada aplicado a medias y la lista
  sigue en espera, con el motivo. Una lista de 10.000 filas se aplica en menos de 30 segundos, con
  el avance a la vista.
- **R6.7** **Los estados de una lista:** en espera, aplicándose, aplicada, descartada y «no se pudo
  leer». La pantalla del proveedor las muestra todas, de la más nueva a la más vieja, con su fecha,
  quién la subió y quién la aplicó o la descartó, y su archivo para bajar.
- **R6.8** **Una lista aplicada no se vuelve a aplicar,** y no se deshace: para volver atrás se sube
  la lista anterior. Subir de nuevo el mismo archivo ya aplicado no cambia nada: dice que todos los
  productos quedan igual.
- **R6.9** **Si dos personas aplican la misma lista a la vez,** se aplica una sola vez; la segunda ve
  que ya se está aplicando o que ya se aplicó.
- **R6.10** **Una lista con fecha anterior a la última aplicada de ese proveedor no se aplica:** se
  dice por qué y se puede descartar.
- **R6.11** **Descartar** una lista en espera la deja como descartada, sin cambiar nada, y no se
  vuelve a ofrecer para aplicar.

## 7. Lo que hace una lista al aplicarse

- **R7.1** **Un producto se reconoce por su código dentro de su proveedor.** Dos proveedores pueden
  usar el mismo código: son productos distintos (unirlos es del capítulo 07).
- **R7.2** **Producto nuevo:** un código que ese proveedor no tenía crea un producto, con su
  descripción, su marca, su código de barras si viene, su IVA (R3.6), su costo y la unidad «un.». No
  tiene margen: queda sin precio hasta que se le elija uno (capítulo 07).
- **R7.3** **Producto que ya existía:** se actualizan su descripción, su marca y su código de barras
  con lo que dice la lista, y su costo si cambió. La unidad y el IVA cambiados a mano no se tocan.
  Si el costo es el mismo, no cambia nada.
- **R7.4** **Producto que ya no viene** en una lista completa: pierde el costo de ese proveedor. Si
  ningún otro proveedor lo trae, queda **dado de baja**: conserva todo lo suyo y deja de aparecer en
  la búsqueda. Una lista de solo cambios no da de baja nada.
- **R7.5** **Producto que vuelve:** si una lista posterior trae de nuevo un producto dado de baja,
  vuelve solo, con el margen que tenía.
- **R7.6** **Al cambiar el costo cambia el precio de venta,** con el margen guardado del producto
  (capítulo 07), sin que nadie haga nada.

## 8. Los productos de un proveedor

- **R8.1** **La pantalla de un proveedor muestra sus productos,** para quien tiene «Ver costos»: el
  código, la descripción, la marca y el costo con su cuenta, en orden alfabético. Se baja de a
  partes y se busca mientras se escribe, por código o por palabras de la descripción o la marca.
- **R8.2** **Los dados de baja se ven aparte,** con desde qué lista dejaron de venir.
- **R8.3** **Es la forma de ver los productos hasta que exista el catálogo** (capítulo 07), que la
  reemplaza por la búsqueda y la ficha.

## 9. Quién hizo qué y las anomalías

- **R9.1** **A Quién hizo qué** (05 · R1.1) va, con quién y cuándo: dar de alta, cambiar, dar de baja
  o reactivar un proveedor, con lo anterior y lo nuevo; cambiar cómo cobra, con cuántos costos
  cambiaron; subir, aplicar o descartar una lista, con sus números; y de cada producto que una lista
  crea, cambia o da de baja, su costo anterior y el nuevo, para poder leer después la historia de su
  costo. También activar o desactivar un lector.
- **R9.2** **Las anomalías de este capítulo** (06 · R9):
  - **«No se pudo leer la lista»:** con el proveedor si se sabe, el archivo y el motivo. Se cierra
    sola cuando esa lista se lee o cuando el proveedor sube otra que sí se lee.
  - **«Filas salteadas»:** una por cada lista aplicada que salteó filas, con cada fila, lo que traía
    y su motivo. Se cierra sola al aplicar la lista siguiente de ese proveedor: lo que siga mal
    vuelve a aparecer con la lista nueva.

## Escenarios

### La pantalla y los permisos

- **E01** **Dado** una persona con sesión y sin ningún permiso de este capítulo, **cuando** abre
  Catálogo → Listas, **entonces** ve los proveedores con su nombre, vendedor, teléfono, correo y
  nota, y no ve costos, descuentos, listas, productos ni «Subir lista».
- **E02** **Dado** una persona con «Ver costos» y sin los otros dos, **cuando** abre un proveedor,
  **entonces** ve cómo cobra, sus listas y sus productos con su costo, y no puede cambiar nada ni
  subir una lista.
- **E03** **Dado** un rol al que se le tilda «Cargar listas», **cuando** se lo mira, **entonces**
  «Ver costos» quedó tildado solo y no se puede destildar.
- **E04** **Dado** una persona sin «Cargar listas», **cuando** le manda al servidor una lista por
  fuera de la pantalla, **entonces** el servidor la rechaza diciendo qué permiso falta, no guarda el
  archivo y queda el intento rechazado en Quién hizo qué.
- **E05** **Dado** una persona sin «Ver costos», **cuando** pide por fuera de la pantalla el archivo
  de una lista o los productos de un proveedor, **entonces** el servidor no se los da.
- **E06** **Dado** alguien sin sesión, **cuando** pide cualquier cosa de este capítulo, **entonces**
  no recibe nada.
- **E07** **Dado** un dispositivo sin conexión, **cuando** se abre Catálogo → Listas, **entonces** se
  ve gris lo último que se vio, con «Reintentar», y no se puede subir ni cambiar nada.
- **E08** **Dado** el celular y la computadora vinculados, **cuando** en la computadora se sube una
  lista, **entonces** el celular ve el avance y lo que cambia.

### Los proveedores

- **E09** **Dado** quien tiene «Administrar proveedores», **cuando** da de alta un proveedor con solo
  su nombre, **entonces** queda creado, sin precios con IVA incluido, sin descuentos, con IVA de
  arranque 21 % y «Recalcular con la última lista».
- **E10** **Dado** un proveedor «Ferretera del Sur», **cuando** se da de alta «ferretera del sur» o
  se le cambia el nombre a otro por ese, **entonces** no se guarda y se dice que ya existe.
- **E11** **Dado** un proveedor, **cuando** se le cambia el teléfono, **entonces** se guarda sin tocar
  ningún botón, aparece el aviso con «Deshacer» y queda en Quién hizo qué con el teléfono anterior y
  el nuevo.
- **E12** **Dado** un proveedor con 30 productos, 12 de los cuales solo trae él, **cuando** se lo
  quiere dar de baja, **entonces** se ve que 30 pierden su costo y 12 quedan dados de baja, con «Dar
  de baja con sus 12 productos» y «Cancelar».
- **E13** **Dado** E12, **cuando** se confirma, **entonces** el proveedor deja de verse entre los
  proveedores, su lista en espera queda descartada, los 12 quedan dados de baja y los otros 18
  siguen con el costo de su otro proveedor.
- **E14** **Dado** un proveedor dado de baja, **cuando** se lo reactiva, **entonces** vuelve con sus
  datos, cómo cobra y sus lectores, y sin productos hasta que se aplique su próxima lista.
- **E15** **Dado** un proveedor con una lista aplicándose, **cuando** se lo quiere dar de baja,
  **entonces** no se puede y se dice que hay que esperar a que termine.
- **E16** **Dado** varios proveedores, **cuando** se escribe «sur» en el buscador, **entonces** queda
  «Ferretera del Sur», sin distinguir acentos ni mayúsculas.

### Cómo cobra

- **E17** **Dado** un proveedor con descuento general de 25 % y contado de 5 %, **cuando** su lista
  trae un producto a $ 2.314, **entonces** su costo es $ 1.648,73, y su cuenta muestra «Precio de
  lista $ 2.314,00», «− 25 % General = $ 1.735,50» y «− 5 % Contado = $ 1.648,73».
- **E18** **Dado** un proveedor cuyos precios incluyen IVA y un producto con IVA 21 % a $ 1.000,
  **cuando** se lee su lista, **entonces** el costo es $ 826,45 y la cuenta muestra el IVA quitado.
- **E19** **Dado** un proveedor con un descuento de 10 % solo para la marca «Bremen», **cuando** se
  lee su lista, **entonces** los productos «Bremen» y «BREMEN» llevan el descuento y los demás no.
- **E20** **Dado** un descuento, **cuando** se escribe 0, 100, un negativo o un texto, **entonces**
  no se guarda y se dice que va un porcentaje mayor que 0 y menor que 100.
- **E21** **Dado** un proveedor con «Recalcular con la última lista» y una lista aplicada,
  **cuando** se le cambia un descuento, **entonces** antes de guardar se ve cuántos costos cambian,
  con «Cambiar 2.167 costos» y «Cancelar».
- **E22** **Dado** E21, **cuando** se confirma, **entonces** los costos de sus productos quedan
  calculados con el descuento nuevo sobre su última lista aplicada, y en Quién hizo qué queda el
  cambio con cuántos costos cambiaron.
- **E23** **Dado** E21, **cuando** se cancela, **entonces** no cambia ni el descuento ni ningún
  costo.
- **E24** **Dado** un proveedor con «Desde la próxima lista», **cuando** se le cambia un descuento,
  **entonces** se guarda sin preguntar, los costos quedan como estaban y la próxima lista se calcula
  con el descuento nuevo.
- **E25** **Dado** E21 y que recalcular falla a mitad, **cuando** se confirma, **entonces** no
  cambia ni el descuento ni ningún costo, y se dice que no se pudo guardar, con «Reintentar».
- **E26** **Dado** una lista que dice el IVA de cada producto (21 % en unos y 10,5 % en otros),
  **cuando** se aplica, **entonces** cada producto queda con el IVA que dice la lista.
- **E27** **Dado** una lista que no dice el IVA y un proveedor con IVA de arranque 10,5 %,
  **cuando** se aplica, **entonces** sus productos nuevos quedan con 10,5 %.
- **E28** **Dado** un producto al que se le cambió el IVA a mano a 27 %, **cuando** se aplica una
  lista que dice 21 %, **entonces** el producto sigue con 27 %.

### Subir una lista

- **E29** **Dado** una planilla de un formato que ya tiene lector, **cuando** se la sube desde «Subir
  lista» sin decir de quién es, **entonces** el sistema dice de qué proveedor es, su fecha y qué
  cambia, sin preguntar nada.
- **E30** **Dado** una planilla que ningún lector reconoce, subida desde «Subir lista», **cuando**
  termina de subir, **entonces** pregunta «¿De qué proveedor es?», con los proveedores y «Proveedor
  nuevo».
- **E31** **Dado** E30, **cuando** se elige «Proveedor nuevo» y se escribe su nombre, **entonces**
  el proveedor queda dado de alta y la planilla se lee como suya.
- **E32** **Dado** una planilla subida desde la pantalla de un proveedor, **cuando** termina de
  subir, **entonces** no se pregunta de quién es.
- **E33** **Dado** un archivo `.pdf` o `.docx`, **cuando** se lo sube, **entonces** se rechaza
  diciendo qué formatos se aceptan, y no se guarda.
- **E34** **Dado** el tamaño máximo en 30 MB, **cuando** se sube un archivo de 31 MB, **entonces** se
  rechaza diciendo el máximo, y no se guarda.
- **E35** **Dado** una planilla cuyo título dice «LISTA DE PRECIOS — 14/8/2026», **cuando** se la
  sube, **entonces** la fecha de la lista es el 14/8/2026.
- **E36** **Dado** una planilla que no dice su fecha en ningún lado, **cuando** se la sube,
  **entonces** la fecha de la lista es la del servidor en ese momento, sin preguntar.
- **E37** **Dado** un archivo `.xlsx` dañado, **cuando** se lo sube, **entonces** dice que no se pudo
  leer y por qué, la lista queda como «No se pudo leer» con su archivo, y hay una anomalía «No se
  pudo leer la lista».
- **E38** **Dado** un proveedor con una lista en espera, **cuando** se sube otra lista suya,
  **entonces** la anterior queda descartada, se dice, y la nueva queda en espera.
- **E39** **Dado** una lista de 10.000 filas, **cuando** se la sube, **entonces** el avance se ve
  desde el primer segundo y lo que cambia está en menos de 10 segundos.
- **E40** **Dado** cualquier lista subida, leída o no, **cuando** quien tiene «Ver costos» baja su
  archivo, **entonces** recibe el archivo original, sin cambios y con el nombre con que se subió.

### Los lectores

- **E41** **Dado** un proveedor con dos lectores, uno de un formato viejo y otro del nuevo,
  **cuando** se sube una planilla del formato viejo, **entonces** la lee el lector viejo.
- **E42** **Dado** una planilla con el encabezado en la primera fila («Código», «Descripción»,
  «Precio Unitario») y renglones sueltos con la marca entre los productos, que ningún lector
  reconoce, **cuando** se la sube y se dice de qué proveedor es, **entonces** el lector automático
  la lee, cada producto queda con la marca del renglón de arriba, y lo que cambia dice «Lector
  nuevo: revisala».
- **E43** **Dado** una planilla con siete filas de título antes del encabezado, **cuando** la lee el
  lector automático, **entonces** encuentra el encabezado y ninguna fila de título cuenta como fila
  salteada.
- **E44** **Dado** E42, **cuando** la lista se aplica, **entonces** el lector queda activo en
  Lectores como «automático», y la próxima planilla con ese formato se lee sin pasar por el lector
  automático.
- **E45** **Dado** E42, **cuando** la lista se descarta, **entonces** el lector no queda guardado.
- **E46** **Dado** una planilla con dos columnas de precio que el lector automático no sabe
  distinguir, **cuando** se la sube, **entonces** no se lee, no se pregunta qué columna es qué, la
  lista queda como «No se pudo leer» y hay una anomalía con el motivo.
- **E47** **Dado** E46, **cuando** llega un lector que entiende esa planilla, **entonces** la lista
  se lee sola, queda en espera y la anomalía se cierra.
- **E48** **Dado** un lector que devuelve un precio que no está escrito en la planilla, **cuando**
  se comprueba su resultado, **entonces** no pasa la comprobación y la lista no se lee con ese
  lector.
- **E49** **Dado** una planilla con una fila sin precio, otra con precio 0, otra con el precio «a
  consultar», otra con un código que ya salió más arriba y otra en dólares, **cuando** se la lee,
  **entonces** las cinco figuran como filas salteadas, cada una con su motivo, y las demás se leen.
- **E50** **Dado** quien tiene «Cambiar los ajustes», **cuando** desactiva un lector en
  Administración → Lectores, **entonces** la planilla siguiente de ese formato no lo usa, sin
  reiniciar nada, y queda en Quién hizo qué.
- **E51** **Dado** una persona sin «Cambiar los ajustes», **cuando** abre Lectores, **entonces** los
  ve y no puede desactivar ninguno; si lo intenta por fuera de la pantalla, el servidor lo rechaza.
- **E52** **Dado** un lector que intenta leer algo que no sean las celdas que recibió (la base, la
  red, un archivo), **cuando** corre, **entonces** no puede, y la lista no se lee con ese lector.
- **E53** **Dado** un lector que no termina (un bucle sin fin) o que pide demasiada memoria,
  **cuando** corre, **entonces** se corta al llegar al tope, la lista no se lee con ese lector y el
  servidor sigue atendiendo.

### Ver qué cambia y aplicar

- **E54** **Dado** una lista con cuatro productos válidos y una fila sin precio, de un proveedor sin
  productos, **cuando** se la sube, **entonces** el resumen dice 4 nuevos, 0 cambian, 0 igual, 0 ya
  no vienen y 1 fila salteada con su motivo.
- **E55** **Dado** una lista en espera, **cuando** se miran los productos del proveedor,
  **entonces** son los de antes, con sus costos de antes.
- **E56** **Dado** una lista que cambia costos, **cuando** se mira el detalle, **entonces** cada
  producto muestra el costo que tenía y el nuevo, los que cambian van primero y cada costo deja ver
  su cuenta.
- **E57** **Dado** el porcentaje para revisar en 50 %, **cuando** una lista sube un costo 80 % y
  baja otro 60 %, **entonces** los dos aparecen aparte, arriba, como «para revisar»; uno que sube 30
  % no.
- **E58** **Dado** una lista en espera, **cuando** se mira el botón de aplicar, **entonces** dice
  cuántos productos son nuevos, cuántos costos cambian y cuántos se dan de baja.
- **E59** **Dado** el porcentaje de bajas en 20 % y un proveedor con 1.000 productos, **cuando** una
  lista completa deja de traer 300, **entonces** antes de aplicar se avisa que da de baja el 30 % y
  el botón dice «Aplicar y dar de baja 300 productos».
- **E60** **Dado** una lista en espera, **cuando** se la aplica, **entonces** se ve el avance, al
  terminar se ve cuántos productos se crearon, cuántos costos cambiaron y cuántos se dieron de baja,
  y el proveedor muestra la fecha de esa lista como la última aplicada.
- **E61** **Dado** que aplicar se corta a mitad, **cuando** se vuelve a mirar, **entonces** no hay
  ningún producto ni costo de esa lista, la lista sigue en espera con el motivo y se puede aplicar
  de nuevo.
- **E62** **Dado** una lista aplicada, **cuando** se la quiere aplicar otra vez, **entonces** no se
  puede y se dice que ya se aplicó.
- **E63** **Dado** una lista aplicada, **cuando** se sube y se aplica el mismo archivo otra vez,
  **entonces** el resumen dice 0 nuevos y todos igual, y no se duplica ningún producto ni ningún
  costo.
- **E64** **Dado** dos personas con la misma lista en espera, **cuando** las dos tocan aplicar a la
  vez, **entonces** se aplica una sola vez y la segunda ve que ya se está aplicando.
- **E65** **Dado** un proveedor cuya última lista aplicada es del 14/8, **cuando** se sube una del
  1/8, **entonces** se dice que es anterior a la última aplicada y no se puede aplicar, solo
  descartar.
- **E66** **Dado** una lista en espera, **cuando** se la descarta, **entonces** queda como
  descartada, no cambia ningún producto ni costo y no se ofrece más para aplicar.
- **E67** **Dado** una lista de 10.000 filas, **cuando** se la aplica, **entonces** termina en menos
  de 30 segundos.
- **E68** **Dado** una lista con una celda que parece una fórmula o código (`=HYPERLINK(...)`,
  `<script>`), **cuando** se la lee y se muestra, **entonces** se ve como texto y no se ejecuta
  nada.

### Lo que hace una lista

- **E69** **Dado** un proveedor sin el código «ME6», **cuando** se aplica una lista que lo trae,
  **entonces** se crea un producto con su descripción, su marca, su costo, la unidad «un.» y sin
  margen.
- **E70** **Dado** dos proveedores cuyas listas traen el código «100» para artículos distintos,
  **cuando** se aplican las dos, **entonces** hay dos productos.
- **E71** **Dado** un producto que ya existía, **cuando** una lista trae su código con otra
  descripción y otro costo, **entonces** el producto queda con la descripción y el costo nuevos, y
  en Quién hizo qué quedan el costo anterior y el nuevo.
- **E72** **Dado** un producto al que se le cambió la unidad a «kg» a mano, **cuando** se aplica una
  lista que lo trae, **entonces** sigue en «kg».
- **E73** **Dado** un producto que solo trae un proveedor, **cuando** se aplica una lista completa
  suya que ya no lo trae, **entonces** el producto queda dado de baja y figura aparte en los
  productos del proveedor, con desde qué lista dejó de venir.
- **E74** **Dado** un producto que traen dos proveedores, **cuando** la lista completa de uno deja
  de traerlo, **entonces** pierde el costo de ese proveedor y sigue con el del otro.
- **E75** **Dado** una lista marcada «Solo cambios» que trae 40 de los 1.000 productos del
  proveedor, **cuando** se aplica, **entonces** cambian esos 40 y ninguno queda dado de baja.
- **E76** **Dado** un producto dado de baja que tenía margen 100 %, **cuando** una lista posterior lo
  trae de nuevo, **entonces** vuelve solo, con margen 100 %.
- **E77** **Dado** una lista que trae el mismo costo que el vigente para un producto, **cuando** se
  aplica, **entonces** ese producto no cambia y no suma nada a Quién hizo qué.

### Los productos de un proveedor

- **E78** **Dado** un proveedor con 5.000 productos, **cuando** se abre su pantalla, **entonces** se
  ven los primeros, en orden alfabético, y los demás se bajan al avanzar.
- **E79** **Dado** los productos de un proveedor, **cuando** se escribe un código o palabras de la
  descripción, **entonces** quedan los que coinciden, mientras se escribe.

### Quién hizo qué y las anomalías

- **E80** **Dado** una lista subida por una persona y aplicada por otra, **cuando** se mira Quién
  hizo qué, **entonces** figuran las dos, cada una con lo que hizo y los números de la lista.
- **E81** **Dado** una lista aplicada que salteó 3 filas, **cuando** se abren las anomalías,
  **entonces** hay una «Filas salteadas» de esa lista, con las 3 filas, lo que traían y su motivo.
- **E82** **Dado** E81, **cuando** se aplica la lista siguiente de ese proveedor sin filas
  salteadas, **entonces** la anomalía anterior se cierra sola.
- **E83** **Dado** una lista que salteó filas y se descartó sin aplicar, **cuando** se abren las
  anomalías, **entonces** no hay ninguna de esa lista.
