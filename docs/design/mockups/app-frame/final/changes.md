# El marco · maqueta final: qué cambió respecto de la variante 1 (Evolución)

Base: `../variant-1-evolution/` (elegida por Carlos, 01-D13). La carpeta no depende de las otras
variantes: tiene su copia de `shared.css`, `shared.js`, del isotipo (`isotype.svg`) y del
logotipo de la entrada (`logo-on-light.png`, de `../../sign-in/adapted/`), y `extra-icons.js`
con los dos íconos de Lucide que `common/icons.js` no tiene. Lo del director quedó sin tocar.

Capturas: `screenshot.png` (computadora, menú agrandado, con el rótulo del botón de minimizar al
pasar el mouse), `screenshot-collapsed.png` (menú minimizado, con el nombre de Catálogo al pasar
el mouse), `screenshot-alt.png` y `screenshot-alt-collapsed.png` (con Alt apretado, agrandado y
minimizado) y `screenshot-phone.png` (celular).

## Por pedido de Carlos

1. **El área de trabajo, en blanco** (01 · R6.1 y R6.2, 00 · R1.4). Se sacaron el dibujo del
   mostrador, «Bienvenido, Rubén.», el texto que explicaba el lugar y la leyenda de las teclas, en
   la computadora y en el celular. El área es la pantalla de la primera opción del menú: mientras
   no exista ningún módulo, queda vacía, con el fondo de la aplicación.
2. **El menú se minimiza a solo íconos** (00 · R1.6, E03b), solo en la computadora:
   - Un botón lo achica y lo vuelve a agrandar (cómo es y dónde está, en la segunda y la tercera vuelta). Atajo **Alt E**
     (de «m**e**nú»: la M ya es de Más), que se ve solo con Alt apretado, como los demás.
   - Minimizado: la F, los cinco íconos, la luz como un punto de color y la persona como sus
     iniciales.
   - Cada ícono dice su nombre al pasar el mouse o al llegar con la marca del teclado, en un
     rótulo pino al costado (el mismo dibujo que el globo de «todavía no está»). Los que no
     existen dicen «Vender · Pronto»; la luz dice su texto largo («En línea · todo enviado»).
   - «Pronto» es una marca chica con un reloj arriba a la derecha del ícono (el reloj es el del
     globo y la tostada de lo que todavía no está).
   - Las iniciales abren al costado la misma tarjeta de antes: nombre, rol y «Salir».
   - Más se abre como panel al costado, con sus seis opciones y «Pronto»; → lo abre y marca la
     primera, ← y Esc lo cierran.
   - La animación: el fondo del lateral se achica (`scaleX`), el borde se corre (`translateX`) y
     la palabra del logotipo, los nombres, «Pronto» y el pie se apagan (`opacity`), en 240 ms; al
     agrandar, al revés. El ancho de la columna cambia de golpe, cuando no se ve
     (detrás está el área vacía), así que no se anima nada del diseño de la página. Con «reducir
     movimiento», cambia sin animación.
   - Cada vez que se abre la aplicación arranca agrandado: el estado no se guarda en ningún lado.

## Segunda vuelta: lo que pidió Carlos al verla (2026-10-27)

1. **«No me gusta ese ícono, buscá uno mejor.»** El círculo con «›» montado sobre el borde se
   cambió por un renglón más del menú, al pie, arriba de la luz, con el mismo dibujo que las
   opciones: agrandado dice «Minimizar» con el ícono **`panel-left-close`** de Lucide; minimizado
   es solo el ícono **`panel-left-open`** (y su rótulo dice «Agrandar el menú»). Se eligieron
   porque dibujan el propio lateral (el rectángulo con la columna de la izquierda) y la flecha
   hacia donde va: se entiende qué se achica, no solo «hacia la izquierda», y es el mismo signo que
   usan los editores y programas de oficina. Al pie queda en el mismo lugar en los dos estados,
   así no salta nada al minimizar.
2. **«El menú es demasiado ancho.»** Agrandado pasa de 280 a **216 px**: lo justo para
   «Catálogo» con «Pronto» (el lateral deja 8 px a cada lado en vez de 12). Minimizado pasa de 72 a
   **64 px**: el ícono de 48 con 8 px a cada lado. Los íconos quedan en la misma columna en los dos
   estados. Lo que no entraba en 216 px:
   - **Más se abre siempre como panel al costado** (el que ya tenía minimizado), porque sus
     opciones con «Pronto» («Mejoras y errores», «Administración») no entran en el menú angosto.
     Su flecha pasa a «›» (abre al costado) y → lo abre y marca la primera opción, ← y Esc lo
     cierran, igual que minimizado. **A confirmar con Carlos** (ver la respuesta).
   - **La luz puede ir en dos renglones** («En línea · todo / enviado»): el texto largo de la
     computadora (00 · R3.2) no entra en uno.
3. **«Al presionar Alt las teclas tienen que aparecer a la derecha.»** La tecla de cada opción,
   de la luz, del botón de minimizar y de las iniciales aparece a 8 px a la derecha del botón,
   afuera, sin tapar el ícono ni el texto, agrandado y minimizado; también en el panel de Más. En
   «Salir» ya estaba a la derecha del texto. La × del panel de lo pendiente muestra su tecla a su
   derecha y el botón crece hacia la izquierda. El celular no muestra teclas: nada cambia ahí.
4. **«El logo es una letra F.»** Agrandado, el logotipo de la entrada, donde la F es la primera
   letra de «Ferrebress» (`logo-on-light.png`, 36 px de alto); minimizado, solo la F
   (`isotype.svg`). El isotipo va encima de la F del logotipo, del mismo tamaño, así al minimizar
   se apaga la palabra y la F no se mueve. En el celular la cabecera decía también «F Ferrebress»:
   se cambió por el mismo logotipo, para que diga lo mismo en los dos (00 · consistencia).

## Tercera vuelta: lo que pidió Carlos al verla (2026-10-27)

1. **«El ícono me gusta, pero no quiero que esté en un renglón aparte, tiene que estar a la
   derecha del logo.»** El botón de minimizar deja el pie y va a la cabecera del menú, a la
   derecha del logotipo: un ícono solo (`panel-left-close`, 36 px), sin texto; su nombre
   («Minimizar el menú» / «Agrandar el menú») sale en el rótulo pino al pasar el mouse o al llegar
   con la marca del teclado, agrandado y minimizado. **Minimizado** va **debajo de la F**, dentro
   de la misma cabecera, con `panel-left-open` y el ancho de los demás íconos (48 px, en su misma
   columna). Para que el menú no salte, la cabecera tiene el mismo alto en los dos estados (76 px:
   la F y, debajo, el botón); el costo es que agrandado quedan unos 30 px más de aire entre el
   logotipo y Vender. Al minimizar y al agrandar, el botón se apaga junto con los nombres y se
   enciende en su lugar nuevo (solo `opacity`). Sigue siendo el primero del recorrido con ↑ ↓ y su
   atajo sigue siendo Alt E.
2. **«Lo del Alt no me gusta… quiero que ocurra [como en Salir] pero con los ítems del menú.»** Con
   Alt, la tecla ya no flota afuera del menú: aparece **dentro de cada renglón, a la derecha del
   texto**, con la misma pieza `.kbd` que «Salir».
   - En las opciones con «Pronto» no entran las dos: mientras Alt está apretado, la tecla ocupa el
     lugar de «Pronto», y al soltarlo vuelve «Pronto». Igual en el panel de Más.
   - Más: la tecla a la derecha de «Más», antes de la flecha. La luz: a la derecha de su texto,
     antes de la flecha. «Salir» y la × de lo pendiente ya estaban así.
   - **Lo que no tiene texto** (el botón de minimizar, agrandado y minimizado, y todo el menú
     minimizado: los íconos, la luz y las iniciales): la tecla va **dentro del renglón, en la
     esquina de arriba a la derecha del ícono**, con un borde del color del menú para que se
     despegue del dibujo. Minimizado ocupa el lugar de la marca de «Pronto» (el reloj), que se
     apaga mientras Alt está apretado, como «Pronto» agrandado. No entra en un renglón de 48 px al
     lado del ícono sin agrandar el menú; arriba a la derecha es lo más parecido a «a la derecha»
     y tapa solo la punta del ícono. En el botón de minimizar agrandado tampoco entra a su derecha
     sin montarse sobre el logotipo, así que va en la misma esquina que minimizado.
   - Con un panel abierto encima, como antes, solo se ven las teclas del panel (00 · R2.10), y el
     menú de atrás conserva sus «Pronto».
3. Nada más cambió.

## Por las reglas aprobadas

- **00 · R2.8 (todo botón tiene su atajo):** la × del panel de lo pendiente no tenía. Ahora es
  **Alt C** dentro del panel (vale solo en lo que está encima, R2.10, así que no choca con
  Catálogo).
- **00 · R2.8, minimizado:** las iniciales usan **Alt S**, la misma tecla de «Salir», que con el
  menú minimizado está dentro de su tarjeta: Alt S abre la tarjeta y Alt S otra vez sale.
- **00 · R4.4:** con el área en blanco ya no está el aviso «Sin conexión» del centro (era parte de
  los textos que pidió sacar Carlos). Sin conexión lo dicen la luz y su panel; Salir sigue andando.
  Cuando haya pantallas, cada una pone gris lo que no puede andar.

- **00 · R2.10:** con algo abierto encima (el panel de Más, la tarjeta, lo pendiente), Alt
  muestra solo las teclas de eso, que son las únicas que valen; las del menú de atrás quedaban
  asomando debajo del panel. `shared.js` pone `body.con-capa` mientras hay algo encima.

## Para llevarla al código (perfil de desarrollador frontend)

- **Atajo de Ctrl B descartado:** el lenguaje visual dice «Plegable a 72 px (Ctrl B)», pero
  R2.8 pide Alt más una letra y sin pisar atajos del navegador (R2.11: Ctrl B es el de favoritos
  en Firefox). Se usó Alt E.
- **Solo `transform` y `opacity`:** el lateral se separó en piezas (`.lado-fondo`, `.lado-linea`)
  para animarlo sin tocar el ancho. Las entradas al cargar usan `backwards` en vez de
  `both`, para que un `transform` que queda puesto no cambie dónde se ubican los paneles fijos que
  se abren dentro del lateral.
- **Una clase por pieza:** `.plegar` (el botón de ícono de la cabecera), `.pronto-mini`, `.persona-mini`, `.persona-quien`,
  `.panel-costado`, `.rotulo`, `.lado-logo`, `.lado-isotipo`, `.p-logo`, `.luz-texto`, `.pop-cerrar`, `.p-nav-parte`, `.grupo-opcion`,
  `.hoja-asa`; los anchos del menú en variables (`--lado-ancho`, `--lado-mini`). Se sacaron el
  estilo en línea del celular (`.pronto.vacio`) y los selectores por etiqueta.
- **HTML semántico:** la tarjeta de la persona es una `section` con nombre; las opciones de Más en
  el celular son una lista (`ul`); el botón de minimizar dice con `aria-expanded` y su nombre
  («Minimizar el menú» / «Agrandar el menú») qué hace; minimizado, los nombres siguen en la página
  para el lector de pantalla.
- **`shared.js`:** su copia suma `Marco.alMarcar(fn)`, para que el rótulo siga a la marca del
  teclado.
- Los globos, el panel de lo pendiente y los paneles del costado se ubican a 8 px del borde del
  lateral, sea cual sea su ancho.
