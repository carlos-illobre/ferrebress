# La aplicación → estados compartidos: seis maquetas para Carlos

Capturas lado a lado: `desktop-comparison.png` y `phone-comparison.png` (filas: variantes;
columnas: los cinco estados). Cada variante tiene su `screenshot.png` con los cinco estados y se
abre sola desde su `index.html`. Abajo hay un selector de estado (Normal, Sin conexión, Versión
nueva, Hay que actualizar, Esperas, Algo salió mal; también con las teclas 1 a 6); no es parte del
diseño. `?estado=<offline|version|block|wait|error>` abre directo en uno.

De fondo, siempre la misma venta de Vender (la de `sales/v2`): mechas, cinta métrica, clavos,
tarugos; total $45.500.

Lo que se puede tocar en todas: Cobrar (F2) muestra la espera completa (nada antes de 300 ms, la
marca de espera, la barra a los 2 s, «Venta registrada»); Actualizar actualiza y vuelve a Vender
con una tostada; cerrar (× o Esc) saca el aviso de versión y el error; Avisar queda en «Avisado»;
Probar de nuevo repite la espera; Salir lleva a la entrada; sin conexión y en el bloqueo, cualquier
otro toque sacude el aviso que explica por qué no anda.

Piezas compartidas de esta pantalla: `background.js` / `background.css` (el relleno de Vender),
`states.js` (el selector y los botones), `icons-extra.js` (cloud-off, loader-circle, download,
circle-alert, shield-check, rotate-ccw, hourglass, etc.), `screen-desktop.webp` y
`screen-phone.webp` (la captura que va en el aviso de error).

## Computadora y celular (emparejadas por número)

| | Idea en una frase | Ideas del catálogo |
|---|---|---|
| **1 · En el marco de siempre** (evolución) | Cada estado aparece donde ya se mira: la luz del lateral (o la línea de conexión del celular) se pone ámbar, una franja bajo las pestañas explica «Sin conexión» con Salir, la versión nueva es una tarjeta abajo que no tapa el cobro, la espera vive en el botón tocado y la barra en el panel de cobro, el bloqueo y el error son un diálogo (hoja en el celular). | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 |
| **2 · La isla** (reinvención) | La luz de conexión sube al centro de la cabecera (en el celular, a la barra de estado, como la isla del iPhone) y es el único lugar donde la aplicación habla de sí misma: crece para decir «Sin conexión» con Salir, «Hay una versión nueva», qué está haciendo una espera larga o «Algo salió mal» con los últimos pasos; en el bloqueo ocupa el centro (o la pantalla entera del celular). | 1, 2, 4, 6, 7, 9, 11, 12, 13, 14 |
| **3 · Papel y sello** (audaz) | Cada estado es un objeto del mostrador: sin conexión, un sello «SIN CONEXIÓN» sobre el cobro y una cinta abajo con Salir; la versión nueva, una nota pegada; el bloqueo, la pantalla entera en pino con la venta «en pausa» al costado; la espera, el propio botón Cobrar que se llena; el error, la pantalla entera con «Tu venta está a salvo» y la foto de lo que se manda. | 1, 2, 4, 6, 7, 8, 9, 15, 16, 17, 18, 19, 20 |

**Qué rompe la audaz.** Sin conexión pliega el lateral a íconos (computadora) y cambia el menú de
abajo por la cinta con Salir (celular); el bloqueo y el error tapan todo el marco; la nota de
versión es amarilla y torcida, fuera del molde de tarjetas. La isla (2) mueve la luz de conexión
del pie del lateral al centro de la cabecera y saca la línea de conexión del celular.

## Cuál me gusta más

**La 2, la isla, con la espera de la 3 (el botón que se llena) y el error de la 1.** La isla
resuelve lo que más cuesta en estos estados: que la persona sepa dónde mirar. Hay un solo lugar,
siempre el mismo, en los dos dispositivos, que además ya es la luz de conexión que la regla pide
siempre a la vista; aprenderlo una vez sirve para los cuatro estados. En la espera, el botón que se
llena es más claro que una barra aparte: la marca y la barra están donde está el dedo. Para el
error prefiero el diálogo claro de la 1 al de fondo oscuro: con el cliente esperando, un error
tiene que tranquilizar, no alarmar.

## Movimiento, por interacción

- **Se corta la conexión:** los controles bajan a gris en 200 ms (fundido); la luz pasa a ámbar y
  su punto late lento. En la 3, el sello cae desde más grande con un rebote corto (360 ms), como un
  sello de goma; en la 2, la isla se estira desde su tamaño de luz (320 ms).
- **Tocar algo gris sin conexión:** el aviso que explica por qué (la franja, la isla, el sello) se
  sacude 6 px (320 ms) y el celular vibra 20 ms. Nada más se mueve.
- **Vuelve la conexión:** el gris se va con un fundido de 200 ms; la luz vuelve a verde; sin recargar.
- **Versión nueva:** la tarjeta sube 16 px con fundido (320 ms); la isla crece; la nota se «pega»
  girando desde 10° (420 ms, rebote). Cerrarla: baja 8 px y se desvanece (160 ms).
- **Actualizar:** el botón muestra el giro de espera y «Actualizando…»; al volver, una tostada
  «Ya tenés la versión nueva · seguís en Vender».
- **Hay que actualizar:** el fondo se desenfoca y el diálogo aparece con escala 98 → 100 % (320 ms);
  en el celular de la 2, la isla se abre hasta llenar la pantalla. Enter actualiza.
- **Espera:** nada antes de 300 ms. A los 300 ms el botón tocado cambia a «Cobrando…» con el giro
  (sin animar la entrada, para no parpadear). A los 2 s aparece la barra (fundido y 6 px), que
  avanza lineal; en la 3 el relleno corre dentro del botón. Al terminar, el botón pasa a verde
  «Venta registrada» y vibra doble 10-40-10 ms en el celular.
- **Algo salió mal:** el diálogo o la hoja sube (320 ms); el ícono no se sacude (no es culpa de la
  persona). Avisar: el botón pasa a verde «Avisado» y una tostada confirma.
- Con «reducir movimiento», nada de esto se mueve: los estados aparecen directamente.

## Autocrítica (y qué corregí)

- La primera captura de las esperas salía corrida: la clase de la espera chocaba con una pieza de
  `common.css` (`.marca`, `.barra`). Renombré los estados de la espera (`e-marca`, `e-barra`).
- En la 1, la tarjeta de versión y el código del error cortaban renglones; ensanché la tarjeta y
  acorté el código.
- En el celular, la isla y la nota de versión rompían el título en dos renglones; saqué el ícono.
- En la 3, el texto blanco sobre el naranja claro de la barra se leía mal; ahora el botón queda en
  su naranja y el avance es el naranja oscuro que lo llena.
- Sigue flojo: en la computadora, la isla ancha tapa la fecha y «Pedidos y presupuestos» mientras
  está abierta; en el celular tapa el título. Es aceptable para un aviso pasajero, pero en
  «Sin conexión», que puede durar, convendría correr la cabecera hacia abajo.
- La captura que va en el aviso es una imagen fija de Vender, no la pantalla de ese momento.

## Lo que contradice o agrega a una regla

- **R4.1 (la luz siempre a la vista):** en la 3, sin conexión, la luz del lateral se pliega con el
  lateral; la cinta de abajo la reemplaza. En la 2, la luz cambia de lugar (centro de la cabecera,
  barra de estado del celular).
- **R4.4 (solo deja salir):** todas lo cumplen; la 3 además saca el menú de abajo del celular.
- **R5.5 (bloqueo con un solo botón):** se cumple; la 1 y la 3 suman una línea con las versiones
  («Tenés la 1.8 · la nueva es la 1.9») y la 3 muestra la venta «en pausa», que es información
  nueva, no otra acción.
- **R9.1 (un botón para avisarlo):** todas suman «Probar de nuevo» como acción principal; avisar
  queda como segunda. «Tu venta sigue acá» sale de R9.3.
- **Fuera de las reglas:** «Sin conexión desde las 10:40» (3), las etapas de la espera
  («Venta · Stock · Caja · Comprobante», 2 y 3), el código del error (E-4127) y mostrar los
  últimos pasos a la persona antes de avisar (2 y 3).

## Catálogo de ideas

1. **Gris que se lee.** Sin conexión se apagan solo los controles (botones, campos, cantidades,
   márgenes, menú); nombres, precios y totales quedan con su contraste. Resuelve: se puede seguir
   leyendo la venta para el cliente. Variantes 1, 2, 3. Patrón: modo sin red de Google Docs. Toques:
   0. Dentro de las reglas (R4.4).
2. **El botón dice por qué.** Cobrar y el buscador cambian su texto por «Sin conexión» con el
   ícono, en vez de solo apagarse. Resuelve: nadie toca tres veces un botón muerto. Variantes 1, 2
   (la 3 lo dice con el sello). Patrón: botones deshabilitados con razón de Stripe. Ahorra 1–2
   toques en vano. Dentro de las reglas.
3. **Franja con Salir.** Una franja bajo las pestañas con la explicación y el único botón vivo,
   Salir (Alt S). Resuelve: dónde está la salida. Variante 1. Patrón: aviso de conexión de Slack.
   Dentro de las reglas.
4. **Tocar lo gris sacude la explicación.** Resuelve: la persona entiende por qué no anda sin un
   mensaje nuevo. Variantes 1, 2, 3. Patrón: el campo que se sacude en el código de iPhone. Fuera
   de las reglas (agrega una respuesta al toque).
5. **Versión nueva que no tapa el cobro.** Tarjeta abajo a la izquierda (computadora) o arriba del
   cobro (celular), con «Actualizar» y «Ahora no». Variante 1. Patrón: aviso de actualización de
   Linear. Dentro de las reglas.
6. **«Volvés a esta venta, como está».** El aviso de versión dice que no se pierde nada. Resuelve el
   miedo a actualizar con el cliente adelante. Variantes 1, 2, 3. Dentro de las reglas (E30).
7. **Bloqueo con un solo botón y Enter.** Variantes 1, 2, 3. Patrón: actualización obligatoria de
   las apps bancarias. Dentro de las reglas.
8. **La marca en lo tocado y la barra al lado.** «Cobrando…» en el botón a los 300 ms; a los 2 s, la
   barra con qué hace y cuánto falta, en el lugar del botón que se tocó (panel de cobro o barra de
   acción). Variantes 1 y 3. Patrón: botones de pago de Shopify. Dentro de las reglas (R7).
9. **Error que tranquiliza.** «Tu venta sigue acá · 5 productos · $45.500» en verde, arriba de qué
   hacer (1. probá de nuevo; 2. si vuelve a pasar, avisalo y seguí). Variantes 1, 2, 3. Patrón:
   errores de Stripe Dashboard. Dentro de las reglas (R9.1, R9.3).
10. **Qué lleva el aviso, a la vista.** Una miniatura de la captura y «tus últimos 8 pasos, sin
    datos de clientes ni tu sesión». Variante 1. Dentro de las reglas (R9.4).
11. **La isla.** La luz de conexión es una píldora pino en el centro (barra de estado en el
    celular) que crece para cada estado y vuelve a ser luz. Variante 2. Patrón: Dynamic Island y
    actividades en vivo de iPhone. Cambia dónde está la luz (R4.1).
12. **Lo pendiente en la isla.** «2 por enviar · salen solas al volver», al lado de «Sin conexión».
    Variante 2. Dentro de las reglas (R4.1, R4.2).
13. **La espera larga en la isla, con sus etapas.** «Registrando la venta · faltan 3 s» y
    «✓ Venta · Stock · Caja». Variantes 2 (y 3 bajo el botón). Patrón: seguimiento de pedido de
    Uber Eats. Las etapas están fuera de las reglas.
14. **Los últimos pasos legibles.** «10:42 Vender · tocó Cobrar (F2)», la lista que va en el aviso,
    mostrada antes de mandarla. Variantes 2 y 3. Patrón: informe de errores de macOS. Fuera de las
    reglas (las reglas piden mandarlos, no mostrarlos).
15. **Sello «SIN CONEXIÓN».** Un sello de goma sobre el cobro: se lee de lejos. Variante 3. Rompe
    el molde.
16. **Cinta con Salir en lugar del menú.** Sin conexión, el lateral se pliega (computadora) y el
    menú de abajo se vuelve una cinta con «Desde las 10:40 · 2 por enviar · Salir» (celular). Variante
    3. Rompe el marco.
17. **La nota pegada.** El aviso de versión como un papel amarillo pegado con cinta: llama la
    atención sin ser un error (ámbar es «mirá esto pronto»). Dice además que se pone sola cuando la
    caja queda sin nada a medio hacer (R5.6). Variante 3. Rompe el molde de tarjetas.
18. **La venta en pausa.** En el bloqueo, al costado, la pantalla de Vender inclinada con «Vender,
    en pausa»: lo que se estaba haciendo no se perdió. Variante 3. Fuera de las reglas.
19. **Cobrar es la barra.** A los 2 s el botón se llena de izquierda a derecha y dice «Registrando
    la venta · faltan 3 s». Resuelve: la vista no tiene que ir a otro lado. Variante 3. Patrón:
    deslizar para pagar de Square. Dentro de las reglas (R7.3, la barra está en el botón).
20. **Error a pantalla entera con foto.** La captura como una foto instantánea con los pasos
    debajo, y «Tu venta está a salvo» como un recibo. Variante 3. Rompe el marco.
