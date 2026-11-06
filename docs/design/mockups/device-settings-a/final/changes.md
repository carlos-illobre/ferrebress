# Más → Configuración (04 · etapa a) · maqueta final: en qué se diferencia de lo del director

Base: la variante 1 «La lista que se prueba» (`../desktop/variant-1-list/`,
`../phone/variant-1-list/` y lo compartido de `../extra/`), con el resumen «Así la tenés» y
«Volver a como viene» de la variante 2 (`../extra/v2.js`, `../extra/v2.css`). Esta carpeta no
depende de las variantes: `settings.css`, `settings.js` e `icons-extra.js` son copias con los
cambios de abajo. El marco es el de las otras finales (`../../users-who-did-what/final/`).

Todo lo que no figura acá es igual a lo del director: la lista con un renglón por preferencia, la
muestra viva de las animaciones, las tres horas escritas con la hora de ahora, «Se ve así en», el
renglón de instalar que cambia según el navegador, «Lo tuyo» con «Pronto», la nota de lo guardado y
el botón «Casos» (no es parte del diseño).

Capturas:
- `screenshot.png` y `screenshot-phone.png`: la pantalla al abrir, todo como viene.
- `screenshot-changed.png` y `screenshot-phone-changed.png`: animaciones apagadas y «a. m./p. m.»
  (en el celular, también «Trabajar sin conexión» prendida), con «Volver a como viene».
- `screenshot-alt.png`: con Alt apretado.
- `screenshot-system-quiet.png`: el sistema pide no animar.
- `screenshot-installed.png`: ya instalada, abierta en el navegador.
- `screenshot-install-ask.png` y `screenshot-phone-install-ask.png`: el pedido del navegador.
- `screenshot-phone-no-fingerprint.png`: iPhone y «Trabajar sin conexión» sin la huella.

## Por directivas de Carlos

- **«Así la tenés»** (de la variante 2; R1.10, E32): en la computadora, en la línea de «Solo para
  vos», como en la 2: «Así la tenés:» y una pastilla por preferencia, «Con movimiento» o «En el
  acto», la hora con su formato («14:30 · Como el sistema») y «En el navegador» o «Instalada».
  Cambia en el acto. En el celular, debajo de «Solo para vos», en una línea que se desplaza de
  costado; cada pastilla lleva a su renglón, como en la 2 llevaba a su pregunta.
- **«Volver a como viene»** (de la variante 2; R1.11, E33, E34): deja las animaciones prendidas y la
  hora en «Como el sistema», sin confirmación, con la tostada «Volvió a como viene»; no toca
  «Trabajar sin conexión» ni instalar. Solo está si algo cambió.
  - En la computadora va a la derecha del título, donde van las acciones de una pantalla: en la 2
    iba al final de las pastillas, y con la línea de «Solo para vos» no entraba.
  - En el celular, a la derecha del título, con el texto corto «Como viene» (00 · R3.2). En la 2 iba
    al final de las pastillas, en una línea que no se desplaza: con tres pastillas no entraba.
  - Su tecla es Alt O, no Alt V como en la 2: V es Vender en el menú (00 · R2.10).
- **La frase de la cabecera pasó a la nota de lo guardado:** «Lo que elijas acá no cambia nada de
  otras personas ni de otros dispositivos» estaba al lado de «Solo para vos», donde ahora va el
  resumen. La nota del costado dice ahora «Queda guardado en esta computadora, para vos: no cambia
  nada de otras personas ni de otros dispositivos, y vuelve cuando entres de nuevo. Con el celular
  en espejo, cada uno tiene lo suyo.».

## Por las reglas aprobadas

- **En «Así la tenés», el celular suma «Trabajar sin conexión»** (R1.10: «cada preferencia de este
  dispositivo»): «Solo con internet» o «También sin conexión», si el renglón está. La variante 2 no
  lo tenía.
- **Con «reducir movimiento» del sistema, la llave dice lo elegido** (R2.3: «no hay animaciones
  aunque la opción esté prendida»). En la variante quedaba apagada; ahora queda como la dejó la
  persona, sin poder tocarla, con el aviso debajo. La muestra se queda quieta, con todo a la vista
  (en la variante parpadeaba por pasos). El resumen dice lo elegido.
- **Las teclas se ven solo mientras Alt está apretado** (00 · R2.9): la variante las mostraba
  siempre. Son las de la variante (Alt A, Alt H, Alt I), más Alt O («Volver a como viene») y Alt L
  (el indicador del vínculo, como en las otras finales).
- **El marco, como en las otras finales** (00 · R1.6, R4.1, R10; 03 · R4.1, R4.5):
  - el botón para minimizar el menú, a la derecha del logotipo;
  - al pie del lateral, la tarjeta del vínculo con la luz y lo que gasta la aplicación (la variante
    tenía solo la luz);
  - la persona con «Salir»;
  - en el celular, la pastilla del vínculo debajo del título;
  - el marco magenta y el cartel del ambiente de pruebas.

  El menú no lleva a otras maquetas: son botones sin destino, como en las otras finales. El
  indicador del vínculo muestra una tostada.
- **El celular no tiene barra de estado dibujada ni la raya de abajo del iPhone:** el título empieza
  arriba, como en las otras finales.

## Por la tecnología

- **Una sola página para los dos** (ADR-002): las variantes eran dos archivos. Ahora es un
  `index.html` que cambia a celular debajo de 900 px, el corte del marco.
  - Los textos largos o cortos cambian al cruzar el corte («Instalar en este dispositivo» /
    «Instalar en este celular»).
  - En la computadora, las tres preferencias van en una tarjeta. En el celular, una tarjeta por
    preferencia, con instalar y trabajar sin conexión juntas, como en la variante.
  - «Trabajar sin conexión», «‹ Más» y el menú de abajo están solo debajo del corte; la nota de lo
    guardado, «Se ve así en» y «La espera gira siempre», solo arriba. En el código lo decide el tipo
    de dispositivo, no el ancho (R5.4).
  - En el celular se desplaza toda la pantalla, con el título; el menú de abajo queda fijo.
- **Solo `transform` y `opacity`:** la llave cambiaba su color de fondo con una transición. Ahora el
  verde es una capa que entra con un fundido, y la perilla se corre.
- **El tilde del formato elegido, en el celular, va sobre la esquina de la ficha:** adentro tapaba
  «2:30 p. m.».
- **Si el sistema cambia «reducir movimiento» con la pantalla abierta, se nota al momento**
  (`matchMedia`). En la variante se leía solo al abrir.
- **El pedido del navegador es simulado:** en el código es el `beforeinstallprompt` de Chrome. En el
  celular sube como hoja y en la computadora es un diálogo, como en la variante.
- **Nada consulta la red:** la hora corre con un temporizador local cada 5 segundos.
- **Se probó en Chromium**: computadora a 1366 × 768, celular a 390 × 844 y dentro del visor, sin
  errores en la consola. No hubo Firefox para probarla.

## Para llevarla al código

- Una clase por pieza, con los tokens de `common.css`:
  - `.ajuste`, el renglón (`.ajuste-ico`, `.ajuste-nombre`, `.ajuste-que`, `.ajuste-cuerpo`);
  - `.llave`, el interruptor;
  - `.muestra`, la muestra de la animación;
  - `.formato`, la ficha de la hora;
  - `.asi` y `.asi-pastilla`, el resumen;
  - `.como-viene`, «Volver a como viene»;
  - `.pronto-lista`, «Lo tuyo»;
  - `.guardado`, la nota.
- La llave es un `button` con `role="switch"`. Los formatos son un `radiogroup` de `button` con
  `role="radio"`. Los dos se cambian con Espacio (R1.9).
- La regla está en `settings.js`:
  - `comoViene()`: «Volver a como viene» aparece si las animaciones están apagadas o la hora no está
    en «Como el sistema».
  - `animando()`: hay animaciones si están prendidas y el sistema no pide no animar.
