# 06 · Administración: reglas

Lo que un Administrador fija para todos y cumplen todos los dispositivos. Lo que cada persona elige
para sí misma está en Configuración (capítulo 04). Se construye en dos etapas (roadmap): **a. Ajustes
para todos** (R1 a R7) y **b. Anomalías** (R9), que se construye con las listas de precios
(capítulo 08), el primer capítulo que suma anomalías. Los ajustes de las listas (R8) también llegan
con ese capítulo.

**Estado:** etapa a, aprobada y programada; R8 y la etapa b, aprobadas y programadas con el capítulo
08; R11 (la entrada), aprobada, por programar (T132).

**Lo que no está acá, y por qué:**

- **La zona horaria del negocio no se cambia desde la aplicación:** se fija una sola vez, al instalar
  el sistema, porque cambiarla corre el día de las ventas y el cierre de caja. Acá solo se ve (R5).
- **No hay un tiempo de sesión por rol:** con tres personas no hace falta; vale el mismo para todos
  (R6.4).
- **No hay «Volver a los valores de arranque»:** cada valor anterior queda en Quién hizo qué (R2.5).

## 1. La pantalla

- **R1.1** **Más → Administración**, en el celular y en la computadora, con las mismas reglas.
- **R1.2** **La ve cualquiera con sesión**, sin permiso: a quien vende le sirve saber cómo se
  redondea. Solo quien tiene «Cambiar los ajustes» (R1.4) puede cambiar algo; sin ese permiso cada
  ajuste se ve con su valor, sin poder tocarlo, y la pantalla dice arriba qué permiso hace falta
  para cambiarlo y quién lo tiene.
- **R1.3** **Cada ajuste dice en una línea qué cambia**, y la pantalla dice arriba que lo que se fija
  acá vale para todos. Los ajustes se agrupan por tema: los precios (el redondeo y los márgenes
  rápidos), las listas de precios (R8), el negocio (la zona horaria) y el acceso (los tiempos de la
  sesión, los días del vínculo y la entrada, R11). Cada capítulo que trae un ajuste para todos lo suma acá, en su grupo, con las mismas
  reglas.
- **R1.4** **Un solo permiso:** «Cambiar los ajustes», en el grupo «Administración», que deja
  cambiar cualquier ajuste de esta pantalla. Como todo permiso nuevo, se le suma solo al rol
  Administrador (02 · R7.4).
- **R1.5** **El servidor controla cada cambio:** sin el permiso, lo rechaza sin cambiar nada,
  diciendo qué permiso hace falta (02 · R7.6), y queda como intento rechazado en Quién hizo qué
  (05 · R1.2).
- **R1.6** **Necesita conexión:** los ajustes están en el servidor. Sin conexión, la pantalla se ve
  gris con lo último que se vio, con «Reintentar», y no deja cambiar nada.
- **R1.7** **Con el celular y la computadora vinculados,** ir a Administración se espeja como
  cualquier pantalla (03 · R6). Un cambio hecho en uno se ve en los dos, porque es el mismo valor
  para todos.
- **R1.8** **Las opciones de un ajuste no llevan atajo propio:** con el teclado se llega al ajuste
  con su atajo (00 · R2.8) y se recorren sus opciones con ← y →. Una tecla por opción llenaría la
  pantalla de letras sin ahorrar nada.

## 2. Cómo se guarda un ajuste

- **R2.1** **Se guarda al cambiarlo,** sin botón «Guardar». Abajo aparece un aviso con lo que cambió
  y «Deshacer» durante 5 segundos; deshacer vuelve al valor anterior y queda como otro cambio. No
  hay ventana de confirmación, salvo para el redondeo (R3.4).
- **R2.2** **Un valor que no vale no se guarda:** se dice en el lugar por qué y cuál es el rango
  (por ejemplo, «Entre 1 y 365 días»), y el ajuste sigue con el valor que tenía.
- **R2.3** **Si dos personas cambian el mismo ajuste a la vez,** la segunda no pisa a la primera: el
  cambio no se guarda y se ve «Lo cambió <persona> recién: ahora vale <valor>», con el valor nuevo
  ya en la pantalla, para que decida de nuevo. Si cambian ajustes distintos, se guardan los dos.
- **R2.4** **Los dispositivos abiertos reciben el ajuste nuevo con su próximo pedido al servidor:**
  no hay aviso en vivo, para no gastar datos (constitución, III). Mientras tanto, lo que decide el
  servidor (el precio que se cobra, cuándo vence una sesión) ya usa el valor nuevo.
- **R2.5** **Cada cambio va a Quién hizo qué,** con quién lo hizo, el ajuste, el valor anterior y el
  nuevo (05 · R1.1).

## 3. El redondeo

- **R3.1** **El precio de venta que calcula el sistema se redondea siempre para arriba**, al
  múltiplo siguiente del paso elegido. Un precio que ya es múltiplo queda igual. Con el paso de
  $ 1.000: $ 15.001 pasa a $ 16.000, y $ 15.000 queda en $ 15.000.
- **R3.2** **Se elige solo el paso,** de esta lista: sin redondeo, $ 0,05, $ 0,10, $ 0,50, $ 1,
  $ 5, $ 10, $ 50, $ 100, $ 500, $ 1.000, $ 5.000 o $ 10.000 (un 1 o un 5 seguido de ceros, entre
  un centavo y diez mil pesos). «Sin redondeo» es el paso de un centavo: el peso no tiene fracciones
  de centavo. De arranque, $ 1.000. La dirección no se elige: siempre para arriba.
- **R3.3** **Dónde se aplica lo dice cada capítulo que calcula un precio** (el catálogo, la venta).
  El precio que alguien escribe a mano no se redondea.
- **R3.4** **Cambiar el paso recalcula en ese momento todos los precios de venta guardados.** Antes
  de guardar, se ve cuántos precios cambian y se confirma con «Cambiar 3.412 precios» o se cancela: es
  la única confirmación de la pantalla, porque cambia de golpe todos los precios del negocio. Si no
  cambia ningún precio, se guarda sin preguntar. Este ajuste no lleva «Deshacer»: para volver se
  elige el paso anterior, que muestra de nuevo cuántos cambian. Si entre que se vio el número y se
  confirmó cambió cuántos precios cambian, no se aplica: se vuelve a preguntar con el número nuevo.
- **R3.5** **Todos los precios quedan con el mismo redondeo:** no hay precios con el paso viejo y
  otros con el nuevo. Si recalcular falla, no cambia nada: ni el paso ni ningún precio.
- **R3.6** **Los precios se muestran con los decimales del paso:** con pasos de $ 1 o más, sin
  decimales («$ 16.000»); con $ 0,10 o $ 0,50, con un decimal; con $ 0,05 o sin redondeo, con dos
  («$ 1.201,37»). Los costos y la cuenta de un precio («Así se calcula») muestran siempre sus
  centavos, para que la cuenta cierre. No hay otro ajuste para ver los importes con decimales.

## 4. Los márgenes rápidos

- **R4.1** **Son los cinco atajos para elegir el margen de un producto** (capítulo 07), con las
  teclas 1 a 5. De arranque: 300, 200, 100, 50 y 25 %.
- **R4.2** **Siempre son cinco,** enteros de 1 a 10.000 %, sin repetirse. Se ordenan solos de mayor
  a menor: la tecla 1 es siempre el más alto.
- **R4.3** **Cambiar un margen rápido no cambia ningún producto:** el margen de cada producto queda
  guardado en el producto, y los atajos solo sirven para elegirlo. Cambiar el margen de muchos
  productos a la vez no se hace desde acá.

## 5. La zona horaria del negocio

- **R5.1** **Se ve, no se cambia:** se fija al instalar el sistema y es la misma para todos (00 ·
  R8.4). La pantalla la muestra con su nombre y la hora actual del negocio («Buenos Aires ·
  14:32»), en el formato de la hora de cada persona (04 · R3).

## 6. Los tiempos de la sesión

- **R6.1** **Son los dos que terminan una sesión** (01 · R3.1): sin uso y desde que se entró.
- **R6.2** **Se eligen de una lista:** sin uso, 15, 30, 60 o 120 minutos; desde que se entró, 4, 8,
  12 o 24 horas. De arranque, 60 minutos y 8 horas.
- **R6.3** **Un cambio vale desde ese momento para todas las sesiones, también las abiertas.** Si se
  acorta y una sesión ya pasó el tiempo nuevo, se termina en su próximo pedido al servidor, y la
  persona ve la entrada encima de lo que tenía, sin perder nada (01 · R3.4). Quien hizo el cambio
  también, si su sesión ya pasó el tiempo nuevo.
- **R6.4** **Valen igual para todas las personas,** cualquiera sea su rol.

## 7. Los días del vínculo

- **R7.1** **Son los días que dura un vínculo entre celular y computadora** desde la última vez que
  los dos estuvieron en espejo (03 · R2.2).
- **R7.2** **De 1 a 365 días;** de arranque, 30.
- **R7.3** **Un cambio vale desde ese momento para todos los vínculos, también los que ya existen.**
  Si se acorta y un vínculo ya pasó el plazo nuevo, se termina en su próximo contacto con el
  servidor, como si hubiera vencido (03 · R2.3).

## 8. Las listas de precios

- **R8.1** **Cuánto tiene que cambiar un costo para marcarlo «para revisar»** al ver qué cambia una
  lista (08 · R6.4): un porcentaje entero de 1 a 1.000; de arranque, 50 %.
- **R8.2** **Cuántos productos de un proveedor tiene que dar de baja una lista para avisarlo antes
  de aplicar** (08 · R6.5): un porcentaje entero de 1 a 100; de arranque, 20 %.
- **R8.3** **El tamaño máximo del archivo de una lista** (08 · R4.2): de 1 a 100 MB; de arranque,
  30 MB.
- **R8.5** **Desde cuántas filas se avisa antes de leer una planilla** (08 · R4.12): un entero de
  1.000 a 10.000.000; de arranque, 200.000. No es un tope: es cuándo se pregunta.
- **R8.6** **Cuánto pueden ocupar entre todos los archivos de las listas** (08 · R4.4): de 10 MB a
  100.000 MB; de arranque, 100 MB. Al pasarlo, se borran los más viejos; el más nuevo queda siempre.
- **R8.7** **A los cuántos días se borra el archivo de una lista que nunca se aplicó** (08 · R4.4): de
  1 a 3.650; de arranque, 30.
- **R8.4** **Valen desde la lista siguiente que se sube;** una lista que ya está en espera se vuelve
  a mirar con los valores nuevos.

## 9. Las anomalías

- **R9.1** **Una anomalía es algo que el sistema encontró y alguien tiene que mirar:** una
  diferencia entre el sistema y la realidad, o algo que no pudo hacer solo. Cada capítulo suma las
  suyas; las primeras son las de las listas de precios (08 · R9.2).
- **R9.2** **Más → Administración → Anomalías**, en el celular y en la computadora. Muestra las
  abiertas, de la más nueva a la más vieja, cada una con su tipo, cuándo pasó, de qué se trata y un
  enlace a lo que la causó (la lista, el proveedor). Se filtra por tipo y por estado.
- **R9.3** **Un solo permiso:** «Revisar las anomalías», en el grupo «Administración», que deja
  verlas y marcarlas. Se le suma solo al rol Administrador (02 · R7.4). Sin él, la opción no está en
  el menú (02 · R7.7).
- **R9.4** **Los estados:** abierta; **revisada**, cuando alguien la marca «Revisada», con una nota
  si quiere; y **cerrada**, cuando deja de valer sola, según lo que diga su capítulo. Una revisada
  se puede volver a abrir. Las revisadas y las cerradas se ven con el filtro.
- **R9.5** **Cuántas hay abiertas se ve en el menú,** en Más y en Administración, para quien tiene
  el permiso; sin abiertas, no hay número. El número llega con los pedidos que ya hace la
  aplicación, sin aviso en vivo (constitución, III).
- **R9.6** **Necesita conexión,** como toda la pantalla (R1.6), y se espeja como cualquiera (R1.7).
- **R9.7** **Marcar una anomalía como revisada o volver a abrirla va a Quién hizo qué,** con la nota
  (05 · R1.1).

## 10. Los archivos de las listas

- **R10.1** **Más → Administración → Archivos de listas** muestra los archivos que se guardan (08 ·
  R4.4), del más viejo al más nuevo: de qué proveedor, de qué lista y su estado, cuándo se subió y
  cuánto ocupa; y arriba, cuánto ocupan entre todos contra el tamaño de R8.6.
- **R10.2** **Quien tiene «Cambiar los ajustes» puede borrar uno a mano,** con «Deshacer» durante 5
  segundos (R2.1). El de una lista que se está leyendo o aplicando no se puede borrar. Borrar uno va a
  Quién hizo qué.
- **R10.3** **La ve quien tiene «Ver costos»** (08 · R1.2): muestra de qué proveedores son las listas.

## 11. La entrada

- **R11.1** **Las horas para entrar sin conexión** (15 · R2.2): cuánto tiempo después del último
  contacto con el servidor se puede entrar con la huella sin internet. Se eligen de una lista: 4, 8,
  12, 24, 48 o 72 horas; de arranque, 24. Más horas es más tiempo en que un celular perdido se abre
  sin que el servidor se entere.
- **R11.2** **Los intentos de entrar por minuto, por dispositivo** (01 · R2.9): uno para Google y otro
  para la huella, enteros de 3 a 60; de arranque, 10 y 20.
- **R11.3** **Los intentos fallidos por hora, por cuenta** (01 · R2.10): un entero de 5 a 100; de
  arranque, 20.
- **R11.4** **Valen desde el próximo intento,** sin cortar ninguna sesión abierta. Las horas sin
  conexión las recibe cada celular con su próximo pedido al servidor (R2.4): uno sin conexión sigue
  con las que tenía.

## Escenarios

### La pantalla y el permiso

- **E01** **Dado** cualquier persona con sesión, sin importar sus permisos, **cuando** abre Más,
  **entonces** ve Administración, y al abrirla ve todos los ajustes con su valor.
- **E02** **Dado** una persona sin «Cambiar los ajustes», **cuando** abre Administración, **entonces**
  ningún ajuste se puede tocar y arriba dice que hace falta «Cambiar los ajustes» y qué roles lo
  tienen.
- **E03** **Dado** una persona sin «Cambiar los ajustes», **cuando** le manda al servidor un cambio de
  un ajuste por fuera de la pantalla, **entonces** el servidor lo rechaza diciendo qué permiso falta,
  el ajuste no cambia y queda el intento rechazado en Quién hizo qué.
- **E04** **Dado** un rol nuevo armado sin «Cambiar los ajustes», **cuando** se mira el rol
  Administrador, **entonces** tiene «Cambiar los ajustes» en el grupo «Administración».
- **E05** **Dado** una persona a la que le quitan «Cambiar los ajustes» mientras tiene la pantalla
  abierta, **cuando** intenta cambiar un ajuste, **entonces** no se guarda, se le dice que ya no tiene
  el permiso y la pantalla queda sin poder tocarse (02 · R7.8).
- **E06** **Dado** un dispositivo sin conexión, **cuando** se abre Administración, **entonces** se ve
  gris lo último que se vio, con «Reintentar», y no se puede cambiar nada.
- **E07** **Dado** un dispositivo sin conexión que nunca abrió Administración, **cuando** se abre,
  **entonces** dice que hace falta conexión, con «Reintentar».
- **E08** **Dado** el celular y la computadora vinculados, **cuando** en la computadora se cambia un
  ajuste, **entonces** el celular muestra el valor nuevo.

### Guardar

- **E09** **Dado** quien tiene el permiso, **cuando** cambia un margen rápido, **entonces** se guarda
  sin tocar ningún botón, aparece el aviso con «Deshacer» y en Quién hizo qué queda quién, el ajuste,
  el valor anterior y el nuevo.
- **E10** **Dado** E09, **cuando** toca «Deshacer» antes de los 5 segundos, **entonces** el margen
  vuelve al valor anterior y en Quién hizo qué queda otro cambio, del nuevo al anterior.
- **E11** **Dado** E09, **cuando** pasan los 5 segundos, **entonces** el aviso se va y ya no se puede
  deshacer desde ahí.
- **E12** **Dado** dos personas con la pantalla abierta, **cuando** la primera cambia los días del
  vínculo a 15 y después la segunda los cambia a 60 sin haber visto el 15, **entonces** el cambio de
  la segunda no se guarda, ve «Lo cambió <la primera> recién: ahora vale 15 días» y el valor en
  pantalla pasa a 15.
- **E13** **Dado** dos personas con la pantalla abierta, **cuando** una cambia el redondeo y la otra
  los días del vínculo, **entonces** se guardan los dos.
- **E14** **Dado** un dispositivo abierto en otra pantalla, **cuando** alguien cambia un ajuste,
  **entonces** el dispositivo no le pide nada al servidor por eso, y recibe el valor nuevo con su
  próximo pedido.

### El redondeo

- **E15** **Dado** el paso de $ 1.000, **cuando** el sistema calcula un precio de $ 15.001,
  **entonces** queda en $ 16.000; y uno de $ 15.000 queda en $ 15.000.
- **E16** **Dado** el paso de $ 50, **cuando** el sistema calcula un precio de $ 1.201, **entonces**
  queda en $ 1.250.
- **E17** **Dado** «sin redondeo», **cuando** el sistema calcula un precio de $ 1.201,003,
  **entonces** queda en $ 1.201,01 y se muestra «$ 1.201,01».
- **E17b** **Dado** el paso de $ 0,50, **cuando** el sistema calcula un precio de $ 1.201,20,
  **entonces** queda en $ 1.201,50 y se muestra «$ 1.201,5».
- **E17c** **Dado** el paso de $ 10.000, **cuando** el sistema calcula un precio de $ 3.630,
  **entonces** queda en $ 10.000.
- **E17d** **Dado** el paso de $ 1.000, **cuando** se mira la cuenta de un precio de costo
  $ 1.649,14, **entonces** el costo se muestra «$ 1.649,14» y el precio que se cobra, «$ 4.000».
- **E18** **Dado** precios guardados, **cuando** se elige otro paso, **entonces** antes de guardar se
  ve cuántos precios cambian, con «Cambiar <cuántos> precios» y «Cancelar».
- **E19** **Dado** E18, **cuando** se confirma, **entonces** todos los precios de venta guardados
  quedan redondeados con el paso nuevo, y en Quién hizo qué queda el cambio con cuántos precios
  cambiaron.
- **E20** **Dado** E18, **cuando** se cancela, **entonces** no cambia ni el paso ni ningún precio.
- **E21** **Dado** que con el paso nuevo no cambia ningún precio (o no hay precios guardados),
  **cuando** se elige, **entonces** se guarda sin preguntar.
- **E22** **Dado** que recalcular los precios falla a mitad, **cuando** se confirma, **entonces** no
  cambia ni el paso ni ningún precio, y se dice que no se pudo guardar, con «Reintentar».
- **E23** **Dado** un cambio de redondeo, **cuando** se mira el aviso de abajo, **entonces** no tiene
  «Deshacer».
- **E24** **Dado** un pedido al servidor con un paso que no está en la lista (por ejemplo, $ 300),
  **cuando** llega, **entonces** se rechaza sin cambiar nada.
- **E41** **Dado** E18, **cuando** antes de confirmar cambian los costos y con el paso nuevo pasan a
  cambiar otros precios, **entonces** no se aplica y se vuelve a ver cuántos cambian ahora, para
  confirmar de nuevo.

### Los márgenes rápidos

- **E25** **Dado** los márgenes de arranque, **cuando** se cambia el 100 por 150, **entonces** quedan
  300, 200, 150, 50 y 25, y la tecla 3 elige 150.
- **E26** **Dado** los márgenes de arranque, **cuando** se cambia el 25 por 400, **entonces** se
  ordenan solos: 400, 300, 200, 100 y 50, y la tecla 1 elige 400.
- **E27** **Dado** los márgenes de arranque, **cuando** se cambia el 50 por 200, **entonces** no se
  guarda y se dice que ya hay un margen rápido de 200 %.
- **E28** **Dado** un margen rápido, **cuando** se escribe 0, 10.001, un número con decimales o se
  deja vacío, **entonces** no se guarda y se dice que va un entero entre 1 y 10.000.
- **E29** **Dado** productos con margen de 100 %, **cuando** se cambia el margen rápido de 100 por
  120, **entonces** esos productos siguen con 100 % y su precio no cambia.

### La zona horaria

- **E30** **Dado** quien tiene «Cambiar los ajustes», **cuando** abre Administración, **entonces** ve
  la zona horaria del negocio y la hora actual, sin poder cambiarla.
- **E31** **Dado** una persona que eligió a. m./p. m. en su Configuración, **cuando** mira la zona
  horaria, **entonces** la hora del negocio se ve con a. m./p. m.

### Los tiempos de la sesión

- **E32** **Dado** quien tiene el permiso, **cuando** abre el tiempo sin uso, **entonces** solo puede
  elegir 15, 30, 60 o 120 minutos; y el tope, 4, 8, 12 o 24 horas.
- **E33** **Dado** el tiempo sin uso en 60 minutos y una sesión con 40 minutos sin pedidos, **cuando**
  se lo pasa a 30, **entonces** esa sesión termina en su próximo pedido y la persona ve la entrada
  encima de lo que tenía, sin perder nada.
- **E34** **Dado** el tope en 8 horas y una sesión abierta hace 5 horas, **cuando** se lo pasa a 4,
  **entonces** esa sesión termina en su próximo pedido.
- **E35** **Dado** E34 y que la sesión es la de quien hizo el cambio, **cuando** el cambio se guarda,
  **entonces** el cambio queda guardado y su sesión termina en su próximo pedido.
- **E36** **Dado** el tope en 8 horas y una sesión abierta hace 5 horas, **cuando** se lo pasa a 12,
  **entonces** esa sesión sigue hasta las 12 horas desde que se entró.
- **E37** **Dado** un pedido al servidor con un tiempo que no está en la lista (por ejemplo, 45
  minutos), **cuando** llega, **entonces** se rechaza sin cambiar nada.

### Los días del vínculo

- **E38** **Dado** quien tiene el permiso, **cuando** escribe 0, 366, un número con decimales o deja
  vacío, **entonces** no se guarda y se dice «Entre 1 y 365 días».
- **E39** **Dado** los días en 30 y un vínculo que estuvo en espejo por última vez hace 20 días,
  **cuando** se los pasa a 15, **entonces** ese vínculo se termina en su próximo contacto con el
  servidor, como si hubiera vencido.
- **E40** **Dado** los días en 30 y un vínculo que estuvo en espejo por última vez hace 20 días,
  **cuando** se los pasa a 60, **entonces** ese vínculo sigue hasta los 60 días desde ese último
  espejo.

### Las listas de precios

- **E42** **Dado** quien tiene «Cambiar los ajustes», **cuando** escribe 0, 1.001 o un número con
  decimales en el porcentaje para revisar, **entonces** no se guarda y se dice «Entre 1 y 1.000 %».
- **E43** **Dado** el porcentaje para revisar en 50 % y una lista en espera con un costo que sube 40
  %, **cuando** se cambia el ajuste a 30 % y se vuelve a mirar la lista, **entonces** ese costo
  aparece «para revisar».
- **E44** **Dado** el tamaño máximo, **cuando** se escribe 0 o 101, **entonces** no se guarda y se
  dice «Entre 1 y 100 MB».

### Las anomalías

- **E45** **Dado** una persona sin «Revisar las anomalías», **cuando** abre Más → Administración,
  **entonces** no ve Anomalías; si la abre por su dirección, ve que no tiene permiso y cuál hace
  falta.
- **E46** **Dado** una persona sin «Revisar las anomalías», **cuando** pide las anomalías o marca una
  por fuera de la pantalla, **entonces** el servidor lo rechaza diciendo qué permiso falta y queda
  el intento en Quién hizo qué.
- **E47** **Dado** dos anomalías abiertas, **cuando** quien tiene el permiso mira el menú,
  **entonces** Más y Administración muestran un 2.
- **E48** **Dado** una anomalía abierta, **cuando** se la marca «Revisada» con una nota,
  **entonces** deja de verse entre las abiertas, el número del menú baja y en Quién hizo qué queda
  quién la revisó y la nota.
- **E49** **Dado** una anomalía revisada, **cuando** se la busca con el filtro y se la vuelve a
  abrir, **entonces** vuelve a las abiertas.
- **E50** **Dado** una anomalía que su capítulo cierra sola, **cuando** eso pasa, **entonces** deja
  de verse entre las abiertas sin que nadie la toque, y se ve con el filtro como cerrada.
- **E51** **Dado** ninguna anomalía abierta, **cuando** se abre Anomalías, **entonces** dice que no
  hay nada para revisar.
- **E52** **Dado** un dispositivo sin conexión, **cuando** se abre Anomalías, **entonces** se ve gris
  lo último que se vio, con «Reintentar», y no se puede marcar nada.
- **E53** **Dado** quien tiene «Cambiar los ajustes», **cuando** borra un archivo en Archivos de
  listas, **entonces** se borra, aparece «Deshacer» y queda en Quién hizo qué; la lista se sigue
  viendo con «Ya no se guarda el archivo».
- **E54** **Dado** una lista leyéndose, **cuando** se quiere borrar su archivo, **entonces** no se
  puede, y se dice por qué.
- **E55** **Dado** 80 MB de archivos y el tamaño en 100 MB, **cuando** se abre Archivos de listas,
  **entonces** arriba dice «80 MB de 100 MB».

### La entrada

- **E56** **Dado** las horas sin conexión en 8 y un celular que habló con el servidor hace 10 horas,
  **cuando** se abre la entrada sin conexión, **entonces** todo está apagado y dice «Para entrar
  hace falta internet».
- **E57** **Dado** las horas sin conexión en 24 y un celular sin conexión desde hace 2 horas,
  **cuando** alguien con conexión las pasa a 4, **entonces** ese celular sigue con 24 hasta su
  próximo pedido al servidor.
- **E58** **Dado** los intentos con Google en 3 por minuto, **cuando** alguien prueba entrar 4 veces en
  un minuto desde el mismo dispositivo, **entonces** el cuarto no se intenta y la entrada dice cuánto
  falta.
- **E59** **Dado** quien tiene el permiso, **cuando** escribe 2 o 61 en los intentos por minuto, o 4 o
  101 en los fallidos por hora, **entonces** no se guarda y se dice el rango.
