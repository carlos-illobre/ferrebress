# El indicador del vínculo · maqueta final: en qué se diferencia de lo del director

Base: la variante 1, «La ficha» (`../desktop/variant-1-card/` y `../phone/variant-1-card/`), con la
tira del día de la variante 2, «La isla» (`../shared/island.js`, `island.css`). Esta carpeta no
depende de `../shared/`: tiene su copia de `icons-extra.js` (los íconos de Lucide que
`common/icons.js` no tiene) y de `shop.webp` (la foto del local para la cámara). El logotipo y el
isotipo son los de `common/brand/`.

Capturas: `screenshot.png` (computadora, «Directo», la ficha abierta), `screenshot-server.png`
(«Por el servidor»), `screenshot-alt.png` (con Alt apretado), `screenshot-code.png` (el código para
vincular), `screenshot-phone.png` (celular, la hoja abierta), `screenshot-phone-closed.png` (celular,
con la hoja cerrada) y `screenshot-phone-camera.png` (la cámara que lee el código).

El selector gris de la derecha («Maqueta · estado») y `?estado=` siguen como en las variantes, fuera
del diseño. Con `?abierto=no` arranca con el detalle cerrado.

## Por lo que pidió Carlos

- **La tira del día de la isla, con los colores de la ficha** (R4.4). Va en el detalle, debajo de la
  frase del estado y antes de los datos del vínculo, en la computadora y en el celular. Solo con
  vínculo; con «Sin vincular» no aparece.
  - Arriba, igual que en la isla: «Hoy juntos **2 h 17 min**» a la izquierda y «92 % directo» a la
    derecha, en `--texto-2` con el número en `--tinta` (en la isla eran blancos sobre negro).
  - La tira: 12 px de alto, el riel en `--hundido` (era blanco al 8 %), cada tramo redondeado y
    separado del siguiente por 2 px. Directo en `--logro`, por el servidor en `--urgente` y el resto
    en `--texto-3`, el gris del punto de «Desconectado» (era blanco al 30 %).
  - Debajo, las horas: 8:00, 9:00, 10:00 y «Ahora», en `--texto-3`.
  - El último tramo es el estado de ahora. Los totales salen de los tramos, así que cambian con el
    estado: «Directo» da 2 h 17 min y 92 %; «Por el servidor», 2 h 17 min y 83 %; los demás,
    2 h 5 min y 91 %.

## Por las reglas aprobadas

- **La tira empieza en la primera conexión del día** (R4.4). Es a las 8:00, así que se ve de 8:00
  a «Ahora» (10:42), como pidió Carlos. Las horas están donde caen de verdad (9:00 al 37 % y 10:00
  al 74 %); en la isla estaban repartidas a la misma distancia y los tramos arrancaban en el 8 %.
- **El resto, en un solo color** (R4.4 nombra tres grupos: «Directo», «Por el servidor» y el resto).
  En la isla, «Sin internet» tenía rojo propio.
- **Se ve de dónde salen el total y el porcentaje** (00 · R8.1). Debajo de la tira hay una leyenda
  con un punto de cada color: «Directo 2 h 6 min · Por el servidor 11 min · Separados 25 min».
  Juntos es directo más servidor, y el porcentaje es directo sobre juntos. La isla no la tenía. Para
  el lector de pantalla, la tira lleva el mismo resumen como texto.
- **Las teclas, con Alt y solo mientras se aprieta Alt** (00 · R2.8, R2.9). En la variante se veían
  siempre y adentro de la ficha andaban con la letra sola. Ahora:
  - Alt L abre y cierra el detalle.
  - Adentro: Alt D Desconectar, Alt R Reconectar, Alt P Probar, Alt V Vincular, Alt X Desvincular
    y Alt C cerrar. Antes la × decía «Esc» y no tenía letra.
  - En el código: Alt O Volver, como en el manual. Antes decía «Esc».
  - En la confirmación: Alt C Cancelar y Alt X Desvincular. Antes decían «Esc» y «Enter».
  - Con el detalle abierto, Alt muestra solo sus teclas (R2.10).
  - Esc sigue cerrando lo de encima y vuelve del código (R2.7). Enter activa el botón con el
    cursor, que en la confirmación arranca en «Desvincular».
- **El celular no tiene cabecera con el logotipo ni la persona** (00 · R4.1). La variante ponía la
  pastilla entre el logotipo y las iniciales. Ahora arriba va el título de la pantalla («Vender»,
  28 px) con la pastilla a la derecha, que es el lugar del vínculo en el lenguaje visual. La luz va
  debajo y no cambia. Sin la barra de estado dibujada (10:42, batería): la pone el teléfono.
- **La pastilla del celular dice el estado** (R4.1): sin vínculo dice «Sin vincular»; antes decía
  «Vincular», que es un botón y no un estado. Los otros estados siguen con su forma corta
  («Esperando», «Por el servidor»).
- **La espera de «Probar conexión directa» aparece a los 300 ms** (00 · R7.1, R7.2). Antes giraba
  al instante.
- **El ambiente de pruebas** (00 · R10): el marco magenta y el cartel, como en las otras finales.

## Por la tecnología

- **Una sola página para los dos** (ADR-002). Las dos variantes eran dos archivos; ahora es un
  `index.html` que cambia a celular debajo de 900 px, el corte del marco.
  - El detalle es la misma `section`: en la computadora flota al lado del lateral y en el celular es
    una hoja que sube.
  - La confirmación es un diálogo al centro en la computadora y una hoja en el celular.
  - El código QR es solo de la computadora; la cámara y la pregunta de reemplazar, solo del celular.
  - Los textos largos o cortos (00 · R3.2) y la forma del detalle cambian al cruzar el corte.
  - Las piezas del celular ya no van adentro de un marco `.celu` dibujado: son las de la página.
- **La ficha no entra en una notebook de 768 px con la tira.** «Por el servidor» ya medía 746 px
  sin la tira; con ella llega a 880. Además, la barra del navegador deja menos lugar.
  - Ahora la ficha mide como mucho el alto de la pantalla menos 24 px, y lo de arriba se desplaza
    adentro.
  - Los botones quedan siempre a la vista al pie de la ficha, sobre una raya fina. Lo que se
    desplaza es la ruta, la tira y los datos.
  - En el celular la hoja entra entera en 844 px; si no entrara, se desplaza adentro.
- **Solo `transform` y `opacity`:**
  - El tilde del código leído se dibujaba animando el trazo (`stroke-dashoffset`). Ahora aparece
    agrandándose con un fundido (300 ms, `--rebote`). Además, con «reducir movimiento» el trazo
    quedaba sin dibujar; ahora se ve.
  - El visor de la cámara animaba el color de las esquinas. Ahora el verde cambia de golpe y solo se
    anima que se cierren.
  - Los renglones de los botones animaban el fondo al pasar el mouse. Ahora cambia sin animar.
  - Con «reducir movimiento», todo cambia sin animar (`common.css`).
- **El marco sin alto mínimo:** `common.css` le pone 768 px al marco de la computadora. En una
  ventana más baja se cortaban la luz y la persona del pie del lateral. Se sacó.
- **El menú no lleva a otras maquetas:** las partes son botones sin destino. Antes llevaban a
  carpetas `v2/` que ya no existen.
- **Se probó en Chromium** (computadora a 1366 × 768 y celular a 390 × 844) sin errores en la
  consola. No hubo Firefox para probarla.

## Para llevarla al código

- `link.css` y `link.js` usan una clase por pieza: `.indicador`, `.indicador-pastilla`, `.ficha`,
  `.ficha-pag`, `.ruta`, `.hoy`, `.tira`, `.tira-tramo`, `.hoy-leyenda`, `.datos-fila`,
  `.accion-fila`, `.confirmar`, `.camara`. Usan los tokens de `common.css`.
- Lo único en línea es lo que sale de los datos: dónde empieza y cuánto mide cada tramo
  (`--de`, `--largo`) y dónde va cada hora (`--en`).
- HTML semántico:
  - Los datos del vínculo son una `dl`; en el celular, sus etiquetas quedan para el lector de
    pantalla.
  - La tira es una `section` con nombre, y la leyenda es una lista.
  - El detalle es un `role="dialog"` que nombra su título, y la confirmación, un `alertdialog`.
  - Los dos indicadores usan `aria-expanded` y `aria-controls`.
- La tira se guarda solo en el dispositivo: tramos con su comienzo, fin y estado, desde la primera
  conexión del día. Los totales se calculan de los tramos (`tira()` en `link.js`).
