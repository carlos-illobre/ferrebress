# El marco · maqueta final: qué cambió respecto de la variante 1 (Evolución)

Base: `../variant-1-evolution/` (elegida por Carlos, 01-D13). La carpeta no depende de las otras
variantes: tiene su copia de `shared.css`, `shared.js` y del isotipo (`isotype.svg`). Lo del
director quedó sin tocar.

Capturas: `screenshot.png` (computadora, menú agrandado), `screenshot-collapsed.png` (menú
minimizado, con el nombre de Catálogo al pasar el mouse) y `screenshot-phone.png` (celular).

## Por pedido de Carlos

1. **El área de trabajo, en blanco** (01 · R6.1 y R6.2, 00 · R1.4). Se sacaron el dibujo del
   mostrador, «Bienvenido, Rubén.», el texto que explicaba el lugar y la leyenda de las teclas, en
   la computadora y en el celular. El área es la pantalla de la primera opción del menú: mientras
   no exista ningún módulo, queda vacía, con el fondo de la aplicación.
2. **El menú se minimiza a solo íconos** (00 · R1.6, E03b), solo en la computadora:
   - Un botón redondo arriba, montado sobre el borde del lateral a la altura del isotipo, lo
     achica a 72 px y lo vuelve a agrandar. Está en el mismo lugar en los dos estados, así el menú
     no salta; su flecha gira para decir hacia dónde va. Atajo **Alt E** (de «m**e**nú»: la M ya
     es de Más), que se ve solo con Alt apretado, como los demás.
   - Minimizado: el isotipo, los cinco íconos, la luz como un punto de color y la persona como sus
     iniciales.
   - Cada ícono dice su nombre al pasar el mouse o al llegar con la marca del teclado, en un
     rótulo pino al costado (el mismo dibujo que el globo de «todavía no está»). Los que no
     existen dicen «Vender · Pronto»; la luz dice su texto largo («En línea · todo enviado»).
   - «Pronto» es una marca chica con un reloj arriba a la derecha del ícono (el reloj es el del
     globo y la tostada de lo que todavía no está).
   - Las iniciales abren al costado la misma tarjeta de antes: nombre, rol y «Salir».
   - Más se abre como panel al costado, con sus seis opciones y «Pronto»; → lo abre y marca la
     primera, ← y Esc lo cierran.
   - La animación: el fondo del lateral se achica (`scaleX`), el borde y el botón se corren
     (`translateX`), la flecha gira y los nombres, «Pronto» y el pie se apagan (`opacity`), en
     240 ms; al agrandar, al revés. El ancho de la columna cambia de golpe, cuando no se ve
     (detrás está el área vacía), así que no se anima nada del diseño de la página. Con «reducir
     movimiento», cambia sin animación.
   - Cada vez que se abre la aplicación arranca agrandado: el estado no se guarda en ningún lado.

## Por las reglas aprobadas

- **00 · R2.8 (todo botón tiene su atajo):** la × del panel de lo pendiente no tenía. Ahora es
  **Alt C** dentro del panel (vale solo en lo que está encima, R2.10, así que no choca con
  Catálogo).
- **00 · R2.8, minimizado:** las iniciales usan **Alt S**, la misma tecla de «Salir», que con el
  menú minimizado está dentro de su tarjeta: Alt S abre la tarjeta y Alt S otra vez sale.
- **00 · R4.4:** con el área en blanco ya no está el aviso «Sin conexión» del centro (era parte de
  los textos que pidió sacar Carlos). Sin conexión lo dicen la luz y su panel; Salir sigue andando.
  Cuando haya pantallas, cada una pone gris lo que no puede andar.

## Para llevarla al código (perfil de desarrollador frontend)

- **Atajo de Ctrl B descartado:** el lenguaje visual dice «Plegable a 72 px (Ctrl B)», pero
  R2.8 pide Alt más una letra y sin pisar atajos del navegador (R2.11: Ctrl B es el de favoritos
  en Firefox). Se usó Alt E.
- **Solo `transform` y `opacity`:** el lateral se separó en piezas (`.lado-fondo`, `.lado-linea`,
  `.plegar`) para animarlo sin tocar el ancho. Las entradas al cargar usan `backwards` en vez de
  `both`, para que un `transform` que queda puesto no cambie dónde se ubican los paneles fijos que
  se abren dentro del lateral.
- **Una clase por pieza:** `.plegar`, `.pronto-mini`, `.persona-mini`, `.persona-quien`,
  `.panel-costado`, `.rotulo`, `.luz-texto`, `.pop-cerrar`, `.p-nav-parte`, `.grupo-opcion`,
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
