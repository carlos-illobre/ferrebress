# Usuarios · Quién hizo qué · maqueta final: en qué se diferencia de lo del director

Base: la variante 1, «El libro» (`../desktop/variant-1-ledger/` y `../phone/variant-1-ledger/`).
Esta carpeta no depende de `../shared/`: tiene su copia de los datos (`data.js`, de `audit.js`), de
las piezas (`audit.css`) y de los íconos que `common/icons.js` no tiene (`icons-extra.js`). La
cinta es la maqueta aprobada de la variante 3 (`../desktop/variant-3-tape/` y
`../phone/variant-3-tape/`), que se abre encima.

Capturas:

- Computadora: `screenshot.png` (al abrir, con «Actualizar solo» prendido), `screenshot-new.png`
  (llegó una acción estando arriba de todo: entra marcada), `screenshot-three-new.png` (en la página
  2 llegaron tres: «3 nuevas»), `screenshot-off.png` (apagado: la pantalla dice 0, la aplicación
  todavía no), `screenshot-other-day.png` (fecha «Ayer»: no hay selector) y `screenshot-tape.png`
  (la cinta, abierta desde la tira).
- Celular: `screenshot-phone.png` (al abrir, apagado), `screenshot-phone-on.png` (prendido, llegó una
  acción), `screenshot-phone-three-new.png` (con la lista bajada llegaron tres) y
  `screenshot-phone-other-day.png` (fecha «Ayer»).

El panel gris de la derecha («Maqueta · llega algo» y «Maqueta · dónde está») está fuera del diseño:
hace llegar una acción, tres o diez seguidas, lleva a la página 2, baja la lista, pone la fecha en
«Ayer», oculta la pestaña 6 segundos y corta la conexión. `?demo=` con esos nombres, separados por
coma, deja la maqueta en un estado (por ejemplo `?demo=pagina2,tres`).

## Por lo que pidió Carlos

- **«Actualizar solo» en lugar de «Actualizar»** (R4.6, E49). Es una llave, la de Más del celular
  de la final del marco (`../../app-frame/final/`), en el mismo lugar que el botón que había: arriba
  a la derecha, al lado del título. Para que sea más compacta, no lleva texto a la vista: solo el
  ícono de actualizar (las dos flechas en círculo, `refresh-cw`, quieto) y la llave, dentro de una
  caja de 44 px de alto. Su nombre, «Actualizar solo», va en `aria-label` y en la ayuda al pasar el
  mouse (`title`). El botón «Actualizar» ya no está en ninguna parte.
  - Al abrir está prendida en la computadora y apagada en el celular.
  - Solo se ve si las fechas incluyen hoy: con «Ayer» o un rango de días pasados desaparece y el
    canal se cierra (E53). Al volver a una fecha con hoy, vuelve como estaba.
  - Alt R la prende y la apaga.
- **Prendido y arriba de todo** (página 1, sin bajar): lo que llega entra arriba desde 8 px con
  fundido y su borde se pinta de verde 1,4 s (E50). El total, los tres números y la tira se ponen
  al día; la raya nueva de la tira crece desde abajo. La acción elegida en el detalle no cambia.
- **Con la lista bajada, en otra página o con la cinta abierta:** no se mueve nada; arriba de la
  lista aparece «3 nuevas» (pino, con una flecha), con las que cumplen los filtros (E51). Al
  tocarlo (o Alt N) va a la página 1, arriba, y las muestra marcadas.
- **Como mucho una vez cada 5 segundos** (E52): «Autorizan a diez seguidas» hace llegar diez en 6
  segundos y la lista se pone al día tres veces: con la primera, a los 5 segundos y a los 10.
- **Apagado:** no llega nada ni se pide nada (E34). Lo nuevo aparece al cambiar un filtro o de
  página, al tocar un número del resumen o al prender la llave, que pone la lista al día en el
  momento.
- **Oculta o sin conexión, sin canal:** al volver, si está prendido, se pone al día una vez (E54).
- **Lo que gasta esta pantalla, debajo de la llave** (R4.12, E55), en letra chica y centrado bajo
  la caja: «0,2 KB/min», igual en la computadora y en el celular. Su ayuda al pasar el mouse dice
  qué mide. Es lo del último minuto, no un
  acumulado. Apagado dice 0 enseguida.
- **Lo que gasta la aplicación entera, en el vínculo** (03 · R4.5, E45, E46). No depende de la
  llave: al apagarla baja sola a 0 a medida que pasa el minuto.
  - En la computadora, en la tarjeta del vínculo, debajo de la luz: «Aplicación: 0,2 KB/min».
  - En el celular, en la pastilla del vínculo, en un renglón debajo del estado: «Directo» y abajo
    «0,2 KB/min».
- **Los números son los de `docs/technical/mobile-data.md`:**
  - el canal abierto, 13 KB por hora (8 de bajada y 5 de subida), unos 0,2 KB/min parejos;
  - abrirlo, 0,6 KB;
  - cada aviso, 0,1 KB por acción;
  - cada puesta al día sola, 2 KB;
  - «3 nuevas» pide solo cuántas, 0,3 KB.

  Lo que se pide al tocar algo no cuenta. En la computadora arranca como si el canal llevara un
  minuto abierto (0,2 KB/min). Una acción que llega arriba de todo lo lleva a unos 2,3.

## Por las reglas aprobadas

- **El ícono del tipo de cada acción, a la izquierda** (R4.4, R4.10, E35b): un cuadrado de 32 px
  (36 en el celular) teñido con el color de la acción. Reemplaza la raya de color de la variante,
  que decía lo mismo. En el celular reemplaza al avatar; en la computadora el avatar sigue al lado
  del nombre.
  - El mismo ícono va en el detalle y en el filtro «Tipo».
  - Los íconos son los del catálogo del diseño técnico. Para que ninguno se repita, los tipos son
    los del catálogo:
    - «Entró con Google» y «Entró con la huella» son un tipo, «Entró»;
    - «Le dio el rol» y «Le sacó el rol» son «Cambió los roles de alguien», rojo solo si saca;
    - «Correo no autorizado» y «Huella que no se conoce» son «Entrada rechazada», que dice el
      motivo.
- **Los nombres son solo texto** (R4.7, E33). En la variante, tocar un nombre filtraba por esa
  persona y el detalle decía «Ver todo lo que hizo». Ahora un nombre es parte de la acción:
  tocarlo la elige. En el detalle, debajo del nombre va el rol o «hoy: …».
- **Al abrir, el detalle muestra la primera acción** (R4.7). La variante abría en la cuarta, para
  que se viera un antes → después.
- **«Abrió Quién hizo qué»** (R1.3): la primera vez del día que la sesión abre la pantalla queda
  anotado; es la primera acción de la lista, 10:42, de Rubén. Hoy son 21 acciones.
- **El resumen es del período de las fechas** (R4.9): sin fecha, de hoy; con «Ayer», de ayer; el
  rótulo del total dice el período. Tocar los rechazos o lo que borró filtra en ese período. La
  tira muestra el día del período (si son varios días, hoy) en el tramo de horas que tiene
  acciones.
- **La tira abre la cinta** (R4.11, E40) y en el celular la abre «Ver el día». Antes, cada raya
  llevaba a su acción en la lista.
  - La cinta es la maqueta aprobada de la variante 3, encima, a pantalla completa.
  - Su «Usuarios» (computadora) o su × (celular) vuelve a la lista como estaba (E42).
  - No se posa en la acción tocada: la maqueta de la cinta arranca en la suya.
- **La pastilla del vínculo del celular va debajo del título** (03 · R4.1, E46). En la final del
  vínculo estaba a la derecha del título, donde ahora va «Actualizar solo». La pastilla tiene la
  forma de esa final, con el renglón de lo que gasta.
- **La luz, en la misma tarjeta que el indicador del vínculo** (00 · R4.1, 03 · R4.1).
  - En la computadora: indicador, luz y lo que gasta, en una tarjeta. En la final del vínculo, el
    indicador y la luz eran dos piezas sueltas.
  - En el celular, la luz aparece al lado de la pastilla solo sin conexión. La variante la mostraba
    siempre, con «En línea · todo enviado».
- **El celular no tiene barra de estado dibujada** (00 · R4.1, como la final del vínculo): el título
  empieza arriba.
- **Las teclas de los atajos se ven solo con Alt apretado** (00 · R2.9). La variante las mostraba
  siempre. Las que la variante no tenía (00 · R2.8):
  - H, C y B, los tres números;
  - D, la tira;
  - N, «3 nuevas»;
  - L, el indicador del vínculo.

  La leyenda del pie («↑ ↓ recorrer · RePág AvPág página») queda como estaba.
- **El ambiente de pruebas** (00 · R10): el marco magenta y el cartel, como en las otras finales.
- **El menú y las pestañas no llevan a otras maquetas:** son botones sin destino, como en la final
  del vínculo. El indicador del vínculo muestra una tostada; su detalle es el de su maqueta.

## Por la tecnología

- **Una sola página para los dos** (ADR-002). Las variantes eran dos archivos; ahora es un
  `index.html` que cambia a celular debajo de 900 px, el corte del marco.
  - El detalle es el mismo `aside`: fijo a la derecha en la computadora; una hoja que sube en el
    celular.
  - Los filtros son el mismo menú: se despliega en la computadora; es una hoja en el celular.
  - Las páginas, abajo de la lista en la computadora; fijas sobre el menú en el celular
    (`position: sticky`).
  - Los textos largos o cortos («Hecho por» / «Por») cambian al cruzar el corte.
- **«3 nuevas» queda arriba** con `position: sticky` y alto 0: no empuja la lista.
- **Solo `transform` y `opacity`:**
  - la llave corre la perilla y funde su color;
  - lo nuevo entra desde 8 px y el borde verde se apaga con opacidad;
  - «3 nuevas» baja 8 px con fundido;
  - la raya nueva de la tira crece en alto con `scaleY`;
  - la cinta sube 12 px con fundido.

  Con «reducir movimiento», nada se anima (`common.css`); la marca verde se ve y se saca a los 1,6
  s igual.
- **La cinta va en un `iframe`** de la misma carpeta: es la única forma de abrir la maqueta
  aprobada sin copiarla. En el código es una capa de la misma pantalla (diseño técnico, `Tape`).
- **El canal, los avisos y los KB son simulados.** Los medidores se calculan cada segundo, sobre lo
  anotado en el último minuto. La pestaña oculta de verdad (`visibilitychange`) también cierra el
  canal.
- **Se probó en Chromium** (computadora a 1366 × 768, celular a 390 × 844, y dentro del visor) sin
  errores en la consola. No hubo Firefox para probarla.

## Para llevarla al código

- Una clase por pieza:
  - `.vivo` y `.vivo-llave`, la llave; `.llave`, el interruptor; `.vivo-gasto`, lo que gasta;
  - `.vinculo-tarjeta` y `.gasto-app`, la tarjeta del vínculo; `.indicador-pastilla` y
    `.pastilla-gasto`, la pastilla;
  - `.nuevas`, «3 nuevas»; `.tipo-ico`, el ícono del tipo;
  - `.fila`, `.tira`, `.resumen`, `.filtro`, `.paginador`.

  Usan los tokens de `common.css`.
- Lo único en línea es lo que sale de los datos: dónde va cada raya de la tira (`left`) y el
  escalonado de las filas al filtrar.
- La llave es un `button` con `role="switch"` y `aria-checked`. Lo que gasta está unido a ella con
  `aria-describedby`. La lista es un `listbox`, y cada día, un `h2`.
- La lógica de `screen.js`, «Actualizar solo», es la regla: el canal abierto solo si
  - la llave está prendida,
  - las fechas tienen hoy,
  - la pestaña está a la vista,
  - y hay conexión.

  Con un aviso, se pone al día si está arriba de todo; si no, cuenta las nuevas. Pasan 5 segundos
  entre una vez y la otra.
