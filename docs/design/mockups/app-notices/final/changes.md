# Los avisos del marco · maqueta final: en qué se diferencia de la variante 1 del director

Base: `../variant-1-evolution/`. Esta carpeta no depende de las variantes: tiene su copia de
`shared.css` y `shared.js`. Se dibuja encima del marco aprobado (`../../app-frame/final/`, en un
marco a pantalla completa), sin tocarlo.

Capturas: `screenshot.png` (computadora: la espera, la versión nueva, el bloqueo y «Algo salió
mal»), `screenshot-phone.png` (los mismos cuatro en el celular) y `screenshot-alt.png` («Algo salió
mal» con Alt apretado). El selector de la maqueta (la lengüeta con la campana) y `#espera`,
`#espera-sin`, `#version`, `#bloqueo` o `#error` al final de la dirección eligen el aviso.

## Por directivas de Carlos

- Ninguna: Carlos eligió la variante 1 tal cual («me gusta más 1. Evolución»). La idea, los
  lugares, los colores y el movimiento son los del director.

## Fuera del capítulo, se dejan y los decide Carlos

- **«Avisar y seguir» en un solo botón:** avisa y vuelve a lo que se estaba haciendo; «Seguir sin
  avisar» es el secundario. R9.1 pide «un botón para avisarlo»; juntarlo con volver es del director.
- **El código del error** («Código F-4821 · 10:41»): no está en R9. La hora va en el formato de cada
  persona (R8.5).
- **Las versiones en el bloqueo:** R5.5 pide solo «Hay que actualizar para seguir» y «Actualizar».
  Como la versión de la aplicación es el commit y no un número como «1.14», la propuesta es mostrar
  el comienzo del commit (siete letras) y la fecha en que se publicó, que es lo que una persona
  puede leer y comparar: en la computadora «Tenés la versión 3f9c2a1, del 12/10 · la del servidor
  es la 8b04e7d, del 27/10»; en el celular «Tenés la 3f9c2a1 · el servidor, la 8b04e7d». La fecha
  va en el formato de cada persona (R8.5). Si Carlos no quiere versiones en el bloqueo, se saca el
  renglón entero.

## Por las reglas aprobadas

- **Las teclas de los botones son Alt + letra (00 · R2.8 y R2.9).** La variante mostraba «Esc» y
  «Enter» sobre algunos botones. Ahora cada uno muestra su letra con Alt apretado: «Ahora no» N
  (antes Alt C, que no está en su nombre), «Actualizar» A, «Seguir sin avisar» S, «Avisar y seguir»
  V, y el «Actualizar» del bloqueo A. Esc sigue cerrando lo de encima (R2.7: la versión nueva y «Algo
  salió mal» sin avisar; el bloqueo no se cierra y se sacude, R5.5) y Enter sigue tocando el botón
  principal (R2.6).
- **En el celular no hay teclado (00 · R2):** ni teclas a la vista ni atajos, aunque haya un teclado
  conectado; tampoco se pone el cursor en el botón al abrir un diálogo.
- **Textos largos y cortos (00 · R3.2):** las tres tostadas tenían un solo texto. Ahora en el
  celular dicen «Se actualiza sola la próxima vez.», «Aviso guardado. Se manda más adelante.» y
  «Versión nueva. Seguís en Vender.»; en la computadora siguen las largas del director.
- **El marco de pruebas sigue arriba de todo (00 · R10.1):** el cartel ya no queda debajo de la línea
  de la espera, y con «Algo salió mal» el borde magenta ya no se oscurece bajo el velo (antes pasaba
  solo con el bloqueo).
- **Con el bloqueo o «Algo salió mal», solo se puede tocar el diálogo (R5.5, E31):** lo de atrás
  queda inerte, así que ni el mouse ni Tab llegan al marco ni a lo que se estaba haciendo. En la
  computadora, el cursor arranca en el botón principal.
- **Botones de 44 px en el celular** (lenguaje visual, «mínimo táctil»): «Ahora no» y «Actualizar»
  de la tarjeta de versión nueva eran chicos (36 px).
- **La barra de la espera va en pino mientras espera y en verde al terminar,** como en la variante
  (la pieza `.barra` del lenguaje la pintaba verde de entrada).

## Por la tecnología

- **Solo `transform` y `opacity`:** el tilde de «Aviso guardado» se dibujaba con
  `stroke-dashoffset`. Ahora se descubre de izquierda a derecha con dos traslados opuestos (la
  ventana entra, el trazo se queda quieto): se ve igual, sin repintar.
- **«Reducir movimiento»:** el avance de la barra y la línea, y el fundido de la recarga, animaban
  siempre. Ahora, con «reducir movimiento», todo cambia en el lugar.
- **Diálogos altos en pantallas bajas:** en el celular, la hoja no pasa del alto de la pantalla y se
  desplaza por dentro si no entra.

## Para llevarla al código

- Una clase por pieza, sin el prefijo de la variante ni selectores por etiqueta: `.espera-linea`,
  `.espera-aviso`, `.version-aviso`, `.velo`, `.bloqueo-dialogo`, `.error-dialogo` y sus partes
  (`.espera-barra-avance`, `.version-acciones`, `.error-pasos`, `.error-tilde`…). Las clases de
  estado: `.sin-medida` (no se sabe cuánto falta), `.hecho`, `.actualizando`, `.avisado`, `.entra` y
  `.sale`.
- El avance de la espera es una variable (`--avance`, de 0 a 1) que pinta `scaleX`, sin estilos de
  ancho en línea.
- HTML semántico: los dos diálogos son `alertdialog` con `aria-modal`, título y descripción; la
  espera y la versión nueva, `status`; los pasos del aviso, una lista con `time`; las versiones del
  bloqueo, `data`. Lo de atrás se vuelve `inert` mientras hay un diálogo.
- Sin red ni librerías: los íconos son los de `common/icons.js`.
