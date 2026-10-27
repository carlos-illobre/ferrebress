# El marco · maqueta final: en qué se diferencia de la variante 1 del director

Base: `../variant-1-evolution/`. Esta carpeta no depende de las otras variantes: tiene su copia de
`shared.css`, `shared.js`, el isotipo (`isotype.svg`), el logotipo de la entrada
(`logo-on-light.png`) y `extra-icons.js` con los dos íconos de Lucide que `common/icons.js` no
tiene.

Capturas: `screenshot.png` (agrandado), `screenshot-collapsed.png` (minimizado),
`screenshot-alt.png` y `screenshot-alt-collapsed.png` (con Alt apretado) y `screenshot-phone.png`.

## Por directivas de Carlos

- **El área de trabajo está vacía:** es la pantalla de la primera opción del menú, que todavía no
  existe. Sin dibujo, sin bienvenida y sin textos, en la computadora y en el celular.
- **El logotipo:** agrandado, el de la entrada, donde la F es la primera letra de «Ferrebress»;
  minimizado, solo la F, en el mismo lugar.
- **El menú, más angosto:** 216 px agrandado (lo justo para «Catálogo» con «Pronto») y 64 px
  minimizado.
- **El botón para minimizar el menú** (solo en la computadora) es un ícono solo, a la derecha del
  logotipo: `panel-left-close` para minimizar y `panel-left-open` para agrandar. Dibujan el propio
  lateral con la flecha hacia donde va. Minimizado, queda debajo de la F. La cabecera tiene el
  mismo alto en los dos estados, para que nada salte; por eso, agrandado, quedan unos 30 px de aire
  entre el logotipo y Vender. Su nombre sale en un rótulo al pasar el mouse o al llegar con la
  marca del teclado. Atajo: Alt E (la M es de Más).
- **Minimizado:** los cinco íconos, la luz como un punto de color y la persona como sus iniciales,
  que abren la misma tarjeta con «Salir». Cada ícono dice su nombre en un rótulo; «Pronto» es un
  reloj chico sobre el ícono.
- **Más se abre como panel al costado,** agrandado y minimizado, porque sus opciones con «Pronto»
  no entran en 216 px. → lo abre, ← y Esc lo cierran.
- **La luz** puede ocupar dos renglones: el texto largo no entra en uno.
- **Con Alt, la tecla va dentro de cada renglón, a la derecha del texto**, con la misma pieza que
  «Salir». Donde está «Pronto», la tecla ocupa su lugar mientras Alt está apretado. Lo que no tiene
  texto (el botón de minimizar y el menú minimizado) lleva la tecla en la esquina de arriba a la
  derecha del ícono.
- **Cada vez que se abre, el menú arranca agrandado:** no se guarda nada.
- **La animación de minimizar** usa solo `transform` y `opacity`, en 240 ms; con «reducir
  movimiento», cambia sin animar.

## Por las reglas aprobadas

- **Todo botón tiene su atajo (00 · R2.8):** la × del panel de lo pendiente es Alt C; minimizado,
  las iniciales son Alt S (Alt S otra vez sale).
- **Solo valen las teclas de lo que está encima (00 · R2.10):** con un panel abierto, Alt muestra
  solo las suyas.
- **Sin conexión (00 · R4.4):** como el área está vacía, lo dicen la luz y su panel; «Salir» sigue
  andando.
- **Sin Ctrl B:** el lenguaje visual decía «Plegable con Ctrl B», pero los atajos son con Alt y no
  pisan los del navegador (00 · R2.11; Ctrl B es el de favoritos en Firefox).

## Para llevarla al código

- El lateral está separado en piezas (`.lado-fondo`, `.lado-linea`) para animarlo sin tocar el
  ancho.
- Una clase por pieza (`.plegar`, `.pronto-mini`, `.persona-mini`, `.panel-costado`, `.rotulo`,
  `.lado-logo`, `.lado-isotipo`…) y los anchos del menú en variables (`--lado-ancho`,
  `--lado-mini`). Sin estilos en línea ni selectores por etiqueta.
- HTML semántico: la tarjeta de la persona es una `section` con nombre, las opciones de Más en el
  celular son una lista, el botón de minimizar usa `aria-expanded`, y minimizado los nombres siguen
  en la página para el lector de pantalla.
- `shared.js` suma `Marco.alMarcar(fn)`, para que el rótulo siga a la marca del teclado.
