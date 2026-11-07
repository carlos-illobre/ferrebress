# 06 · Administración: reglas

Lo que un Administrador fija para todos y cumplen todos los dispositivos. Lo que cada persona elige
para sí misma está en Configuración (capítulo 04). Se construye en dos etapas (roadmap): **a. Ajustes
para todos** (R1 a R7) y **b. Anomalías**, que se escribe con el stock, el primer capítulo que suma
anomalías.

**Estado:** etapa a, para aprobar; etapa b, por escribir.

**Lo que no está acá, y por qué:**

- **La zona horaria del negocio no se cambia desde la aplicación:** se fija una sola vez, al instalar
  el sistema, porque cambiarla corre el día de las ventas y el cierre de caja. Acá solo se ve (R5).
- **Cuánto tiene que subir un costo para obligar a remarcar y el IVA cuando la lista no lo dice**
  son ajustes de las listas de precios (capítulo 08): se suman a esta pantalla con ese capítulo
  (R1.3).
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
  rápidos), el negocio (la zona horaria) y el acceso (los tiempos de la sesión y los días del
  vínculo). Cada capítulo que trae un ajuste para todos lo suma acá, en su grupo, con las mismas
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
- **R3.2** **Se elige solo el paso,** de esta lista: sin redondeo, $ 10, $ 50, $ 100, $ 500,
  $ 1.000 o $ 5.000. De arranque, $ 1.000. La dirección no se elige: siempre para arriba.
- **R3.3** **Dónde se aplica lo dice cada capítulo que calcula un precio** (el catálogo, la venta).
  El precio que alguien escribe a mano no se redondea.
- **R3.4** **Cambiar el paso recalcula en ese momento todos los precios de venta guardados.** Antes
  de guardar, se ve cuántos precios cambian («Cambian 3.412 precios») y se confirma o se cancela: es
  la única confirmación de la pantalla, porque cambia de golpe todos los precios del negocio. Si no
  cambia ningún precio, se guarda sin preguntar. Este ajuste no lleva «Deshacer»: para volver se
  elige el paso anterior, que muestra de nuevo cuántos cambian.
- **R3.5** **Todos los precios quedan con el mismo redondeo:** no hay precios con el paso viejo y
  otros con el nuevo. Si recalcular falla, no cambia nada: ni el paso ni ningún precio.

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
- **E17** **Dado** «sin redondeo», **cuando** el sistema calcula un precio de $ 1.201, **entonces**
  queda en $ 1.201.
- **E18** **Dado** precios guardados, **cuando** se elige otro paso, **entonces** antes de guardar se
  ve cuántos precios cambian, con «Confirmar» y «Cancelar».
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
