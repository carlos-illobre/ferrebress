# 07 · Catálogo: resumen

Productos, proveedores, costo, margen, precio, búsqueda y la ficha del producto, en tres etapas:
**a. catálogo base**, **b. código y foto** (con 03b) y **c. duplicados e historia** (después de 08a).

**Estado:** etapa a, en pausa en el paso 1. Espera a las listas de precios (capítulo 08, etapa a), porque
los productos salen solo de las listas: sin ellas no hay nada que probar. Las reglas todavía no
están escritas; abajo, lo que Carlos ya confirmó y lo que falta preguntarle al retomarla.

## Lo confirmado

- **Los productos salen solo de las listas de precios:** nunca se dan de alta a mano. Lo que se da
  de alta a mano es el proveedor y su lista.
- **La baja la hace la lista:** si una lista nueva deja de traer un producto, ese producto pierde
  el costo de ese proveedor; si ya no lo trae ningún proveedor, queda dado de baja. No hay baja a
  mano.
- **Unidades:** un., kg, m y L. Lo que va por unidad, en cantidades enteras; lo fraccionado, hasta
  un decimal.
- **IVA del producto:** 21 % (de arranque), 10,5 % o 27 %. No hay productos exentos.
- **Cambiar un dato** del producto o del proveedor se guarda al cambiarlo, con «Deshacer» 5
  segundos y sin botón «Guardar».
- **Proveedores** (pasan al capítulo 08, que los necesita para sus listas): tienen su pantalla dentro de Catálogo, para darlos de alta, cambiarlos, darlos
  de baja y buscarlos. Se guarda el nombre (único y obligatorio), el vendedor, el teléfono o
  WhatsApp, el correo y una nota; los ve cualquiera con sesión. Dar de baja un proveedor que es el
  único de algunos productos los deja sin costo: antes se ve cuántos y se confirma con «Dar de baja
  y dejar 12 sin precio».
- **El código del proveedor** es único dentro de cada proveedor; dos proveedores pueden usar el
  mismo.
- **El proveedor en uso:** el costo sale del más barato, salvo que alguien haya elegido otro a
  mano; entonces se respeta y la ficha avisa que hay uno más barato, con un toque para pasarse.
  Cuántos días tiene que tener un costo para dejar de contar como el más barato se decide con 08.
- **El precio de venta:** costo × (1 + margen) × (1 + IVA), con el margen sobre el costo sin IVA,
  redondeado para arriba al múltiplo del paso de Administración. Con costo $ 1.500, margen 100 % e
  IVA 21 %: $ 3.630, que con el paso de $ 1.000 se cobra $ 4.000.
- **El margen:** uno de los cinco márgenes rápidos de Administración, o un porcentaje entero de 1 a
  10.000 escrito a mano; sin margen, el producto dice «sin precio», y sin costo, «sin costo». El
  precio nuevo se ve en menos de 100 ms. No hay cambio de margen de varios productos a la vez.
- **El redondeo, libre:** el paso es cualquier número mayor que cero. Con 100.000, todo precio
  calculado es múltiplo de 100.000 y ninguno es menor; con 0,01, sale con centavos. El precio final
  se muestra con los decimales del paso; los costos y «Así se calcula» muestran siempre los suyos.
  No hay un ajuste aparte para ver los importes con decimales. Cambia lo que dicen hoy 06 · R3.2,
  00 · R8.2 y el capítulo 04, que se corrigen al escribir las reglas de esta etapa.
- **Buscar:** las palabras en cualquier orden, sin acentos ni mayúsculas, palabras empezadas, con
  un error de tipeo; la coincidencia exacta de código va primera, y un código escrito entero se
  encuentra aunque tenga signos. Necesita conexión: el catálogo vive en el servidor y se baja de a
  partes. Hasta 100.000 productos, en menos de 100 ms.
- **La lista:** sin nada escrito, en orden alfabético hasta que exista Vender. Filtros por marca y
  «Sin precio»; arriba, el total y cuántos están sin precio.
- **La ficha:** en la computadora, al lado de la lista; en el celular, ocupa la pantalla. «Así se
  calcula» muestra la cuenta.
- **Permisos:** «Ver costos» (proveedores, costos y «Así se calcula»; sin él se ven el precio de
  venta y el margen), «Cambiar márgenes» y «Administrar productos y proveedores». Ver el catálogo y
  los precios de venta no pide permiso.
- **Teclado en la computadora:** ↑ ↓ cambian de producto, Mayús + 1 a 5 eligen el margen y F1
  pliega «Así se calcula».

## Lo que falta preguntar al retomarla

Las tres primeras se preguntan también con 08, que es donde se aplican.

1. **Lo que no viene en ninguna lista** (un proveedor que solo manda la factura): ¿una «lista a
   mano», escrita en la aplicación y aplicada como un Excel, o solo el ítem libre de Vender?
2. **Un producto dado de baja:** ¿deja de aparecer en la búsqueda, salvo que tenga stock (entonces
   sigue, con «Ya no lo trae ningún proveedor»)? ¿Vuelve solo, con su margen de antes, si una lista
   posterior lo trae otra vez?
3. **Los datos que la lista no trae** (la unidad, a veces el IVA o la marca): ¿se cambian a mano
   en la ficha, sin que la próxima lista los pise? La descripción, ¿siempre la pone la lista?
4. **El paso de redondeo más chico:** ¿0,01, porque el peso no tiene fracciones de centavo, o
   libre (hasta 0,0000001)?
5. **Pasos que no son 1, 10, 100…** (como $ 250 o $ 300): ¿valen?
6. **«Sin redondeo»:** ¿se saca, si equivale al paso de 0,01?
