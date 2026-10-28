# Entrar · Google cargando: maqueta final

Base: la variante 2 del director de arte, «El hilo» (`../variant-2-thread/`), sobre la entrada
aprobada (`../../sign-in/adapted/`). Los archivos compartidos de la variante (`../assets/`) están
copiados acá, así que la final no depende de ellos.

Capturas: `screenshot.png` (computadora) y `screenshot-phone.png` (celular), las dos pasados 2 s;
`screenshot-phone-failed.png` (Google no cargó) y `screenshot-phone-offline.png` (sin conexión).

Abajo a la izquierda (en el celular, abajo a la derecha), las herramientas de la maqueta: **Google**
elige el momento, en vivo (Google tarda 3 s, 1,2 s, 0,2 s o no carga) o fijo (vacío, cargando,
pasados 2 s, el botón y no cargó); **Repetir** vuelve a correr el momento en vivo; **Estado**, los de
la entrada («Sin conexión» muestra el lugar sin internet).

## Por directivas de Carlos

- **El botón de Google es el de verdad: azul relleno y redondeado** (`theme: 'filled_blue'`,
  `shape: 'pill'`, `size: 'large'`, «Continuar con Google»), como en la entrada aprobada, en lugar del
  blanco con borde gris de la variante: fondo azul de Google, la G en un círculo blanco a la
  izquierda y el texto blanco.
- **El lugar mide lo mismo que ese botón:** 40 px de alto en los dos anchos (el tamaño `large` de
  Google) y el ancho de la columna hasta 400 px (lo más ancho que Google lo dibuja), centrado. La
  variante medía 44 px en la computadora, y la entrada aprobada lo dibuja más alto en la
  computadora (60 px en una pantalla de 1024 px de alto), un tamaño que el botón de Google no tiene. Cuando aparece el botón, nada de la entrada se mueve.
- **La transición va con el botón azul:** al llegar Google, el hilo se completa en el azul de Google
  (en la variante, en pino) y de ahí se infla el botón azul. Así la línea se lee como el botón
  dormido, que es la idea del director.
- **En el celular, el hilo ya no se confunde con la línea de la «o»:** elegí que **el tramo pino esté
  siempre a la vista**. En la variante el tramo salía por la derecha y volvía a entrar por la
  izquierda, y entre una pasada y otra quedaba solo la línea gris, igual a la de la «o». Ahora es una
  tira con dos tramos, uno detrás del otro: cuando uno sale por la derecha, el otro ya está entrando
  por la izquierda. Va lento en el medio y rápido al pasar por las puntas (en la variante, al revés),
  para que el tramo se vea casi siempre entero. Gris y verde a la vez, la línea se lee como una espera
  y no como un separador. Vale para los dos anchos, para que se vean igual. No cambié la separación
  ni el largo: la «o» y el lugar son los de la entrada aprobada.
- **Sin conexión, sin hilo:** el lugar dice solo «Sin internet, Google no carga», en su centro. En la
  variante iba sobre una línea gris quieta, que en el celular era justo otro separador encima del de
  la «o». Al volver la conexión, Google se pide de nuevo solo.
- **Si Google no carga, a los 8 s** el hilo queda quieto en ámbar y el lugar dice «Google no
  responde · Reintentar» (confirmado por Carlos). «Reintentar» lo pide de nuevo; en la maqueta, esta
  vez llega a 1,2 s.
- Los textos, con el castellano de la entrada: «Conectando con Google…», «Google no responde ·
  Reintentar», «Sin internet, Google no carga».

## Por las reglas

- **00 · R2.8 (todo botón tiene atajo):** «Reintentar» es un botón de Ferrebress, no el de Google,
  así que lleva Alt R; la tecla se ve solo con Alt apretado (R2.9). En el celular no hay atajos. La
  variante no le ponía atajo.
- **Con Tab se llega solo a lo que se ve:** al botón de Google cuando está (01 · R2.1, sin atajo), y a
  «Reintentar» solo cuando Google no cargó. En la variante «Reintentar» no se alcanzaba con Tab.
- **00 · R7:** sin cambios respecto de la variante: antes de 300 ms no se ve nada; pasados 300 ms, el
  hilo; pasados 2 s, «Conectando con Google…». No se sabe cuánto falta, así que no se dice.

## Por la tecnología

- El botón de Google vive en el marco que dibuja Google y no se puede animar por dentro: lo que se
  infla es el lugar que lo contiene (escala vertical y opacidad). Todo se anima solo con `transform` y
  `opacity`; con «reducir movimiento», no hay transiciones y el tramo pino queda quieto en el centro
  del hilo.
- La letra del botón es la de Google (Google Sans o Roboto); en la maqueta, si la computadora no la
  tiene, Arial. No se baja de internet.
- El CSS del hilo, que en la variante estaba dentro del `index.html`, está en `loading.css`, con una
  clase por pieza (`g-slot`, `g-thread`, `g-fail`, `g-off`). Se quitó de `loading.js` lo que era solo
  de la variante 3.
