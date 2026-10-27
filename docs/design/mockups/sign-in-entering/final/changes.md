# Entrando, computadora · maqueta final

Capturas: `screenshot.png` (con Google, `?estado=entrando-google`) y `screenshot-qr.png` (con el
celular, leyendo el QR, `?estado=entrando-celular`), en 1366 × 768.

Parte de la variante 1 del director (`../desktop/variant-1-scene/`), **solo su panel de la derecha**.
Lo demás es la entrada aprobada (`../../sign-in/adapted/`, versión de computadora).

## Por directivas de Carlos

- **Alrededor, la entrada de siempre, sin cambios:** la escena verde con el logotipo, el lema («El
  sistema del mostrador», «Precios al día, ventas y stock de la ferretería.», la bajada y los tres
  puntos), la foto del celular y los tres sellos debajo de la tarjeta, en el mismo lugar y del mismo
  tamaño que en la entrada. Se van el título grande sobre el verde («Conectando tu cuenta de Google»)
  y «Un momento», que la variante ponía en lugar del lema.
- **El panel ocupa el lugar de la tarjeta blanca, con su mismo tamaño:** mismo ancho, misma posición
  y mismo alto que la tarjeta de la entrada en cualquier pantalla. Para eso el contenido de la
  entrada queda invisible debajo del panel (`.card-sizer`, fuera del árbol de accesibilidad) y la
  tarjeta toma su alto; en la aplicación, la tarjeta conserva el alto que tenía al cambiar el
  contenido. La variante tenía su tarjeta propia, con otro alto y otra escala.
- **Arriba del panel, el título según cómo entra y la bajada, como en el celular:** «Conectando tu
  cuenta de Google» o «Entrando con tu celular», en el lugar y con la letra del título de la tarjeta
  de la entrada («Entrá con tu celular»). Reemplaza el «Abriendo tu sesión» de la variante, que
  repetía el segundo paso.
- **Los textos dicen lo mismo que el celular** (la capa «Entrando» de la entrada): el título, la
  bajada, los dos pasos y sus explicaciones son los mismos, palabra por palabra. Lo que la variante
  agregaba:
  - «Conexión segura» (la pastilla del título): **se sacó**.
  - «No hace falta tocar nada: cuando la sesión esté abierta, aparece el menú de Ferrebress.»:
    **se sacó**.
  - «Computadora del mostrador» y «En línea», arriba a la derecha: **se sacaron**. Ojo: la entrada
    aprobada sí los muestra en ese lugar, así que al pasar de la entrada a la espera esas dos
    pastillas desaparecen (ver «Para confirmar con Carlos»).
  - El pie de la tarjeta («Tus datos están protegidos» y el logotipo): **se sacó**; el celular no lo
    tiene en la espera.
  - Los rótulos debajo de cada círculo del camino («Google · Confirmó tu cuenta» o «Tu celular ·
    Confirmó tu huella», «Ferrebress · Abre tu sesión», «Tu local · Adonde llegás»): **quedan**,
    porque entran bien en una línea cada uno y dicen lo mismo que la bajada y los pasos.
- **Sin aviso de «Entraste»:** al abrirse la sesión, la entrada se funde y aparece el marco (acá,
  neutro; su maqueta es otra).
- **Se mira quieta:** la sesión no se abre sola. El selector de la maqueta (abajo a la izquierda,
  fuera del diseño) elige cómo entra (o `?estado=entrando-google` / `entrando-celular`; teclas 1 y 2),
  «Abrir la sesión» (Enter) muestra el marco y «Repetir» (R) vuelve a empezar.

## Por las reglas

- **La entrada tiene su paleta propia y su naranja (#D83F0E)** (pantallas del capítulo, fila 1): la
  final usa la hoja de la entrada aprobada, no `common/common.css` como la variante, para que la
  escena se vea idéntica. El panel toma de ahí sus colores.
- **El movimiento no toca la escena:** lo que la persona venía mirando no se mueve. En la variante,
  todo (el logotipo, el título, la tarjeta) entraba subiendo 12 px y la tarjeta crecía desde 98,5 %;
  en la final solo entra lo de adentro del panel (el título, el camino y los pasos, escalonados), y
  la tarjeta queda quieta.

## Por la tecnología

- Las medidas del panel siguen el alto de la pantalla (`--u`), como el resto de la entrada, para que
  entre en la tarjeta desde 1280 × 720 hasta 1920 × 1080; la variante usaba píxeles fijos para el
  camino y los pasos.
- El movimiento es el de la variante, solo con `transform` y `opacity`: el tramo hecho se estira y el
  tilde se dibuja al llegar; mientras se abre la sesión giran el anillo de la F y la marca del paso
  en curso, y un punto naranja viaja de la F al local; al terminar, la tarjeta baja a 98 % y la
  entrada se funde (320 ms). Con «reducir movimiento», nada se mueve ni gira.
- La foto del celular y el fondo son copias de los de la entrada, para que la carpeta se abra sola.

## Para confirmar con Carlos

- **«Computadora del mostrador» y «En línea»:** el encargo pedía sacarlos, pero son parte de la
  entrada de siempre. Si se quiere que nada de la escena cambie, vuelven sin tocar el panel.
