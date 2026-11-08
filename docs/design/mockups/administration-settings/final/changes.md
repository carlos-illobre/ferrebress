# Administración · Ajustes para todos · maqueta final: en qué se diferencia de lo del director

Base: la variante 2, «Probar antes de elegir» (`../desktop/variant-2-preview/` y
`../phone/variant-2-preview/`), en la computadora y en el celular, como eligió Carlos. No toma nada
de las otras variantes. Esta carpeta no depende de `../shared/`. Tiene su copia de:

- `settings.css` y `settings.js`: el marco y lo común (de `base.css` y `base.js`, sin lo de las
  variantes 1 y 3);
- `preview.css` y `preview.js`: la pantalla (de `v2.css` y `v2.js`);
- `icons-extra.js`: solo los íconos de Lucide que usa y `common/icons.js` no tiene.

Capturas:

- Computadora:
  - `screenshot.png`: al abrir.
  - `screenshot-preview.png`: con el mouse sobre $ 500.
  - `screenshot-confirm.png`: la confirmación del redondeo.
  - `screenshot-waiting.png`: la barra del recálculo.
  - `screenshot-confirmed.png`: ya guardado.
  - `screenshot-margins.png`: el 25 pasado a 400, ya ordenado.
  - `screenshot-margins-error.png`: «Ya hay un margen rápido de 200 %».
  - `screenshot-session.png`: mirando 30 minutos.
  - `screenshot-link.png`: los días del vínculo.
  - `screenshot-time-zone.png`: la zona horaria.
  - `screenshot-alt.png`: con Alt apretado.
  - `screenshot-no-permission.png`: Marta, sin el permiso.
  - `screenshot-offline.png`: sin conexión.
  - `screenshot-recalc-failed.png`: el recálculo falló.
  - `screenshot-changed-by-other.png`: «Lo cambió Hugo Ferreyra recién».
- Celular: `screenshot-phone.png` y, con el mismo nombre que en la computadora y `phone-` delante,
  `-confirm`, `-margins`, `-session`, `-link`, `-no-permission` y `-offline`.

El botón «Casos», abajo a la derecha, no es parte de la pantalla: es el del director. Con `#captura`
en la dirección no aparece.

## Por lo que pidió Carlos

- **La variante 2 en los dos dispositivos**, sin nada de las otras. Lo del director queda como
  estaba: la lista corta y el escenario, cada opción con su efecto antes de tocarla, mirar sin
  guardar, la vidriera de cinco productos, la jornada en el mostrador, el calendario del vínculo y,
  en el celular, las tiras y el gesto de deslizar.

## Por las reglas aprobadas

- **El marco con el vínculo** (00 · R4.1; 03 · R4.1, R4.5):
  - En la computadora, al pie del lateral va la tarjeta del vínculo de las otras finales: el
    indicador («Directo · Chrome en Android»), la luz debajo y «Aplicación: 0 KB/min». La
    variante tenía la luz sola. La pantalla no abre ningún canal, por eso marca 0.
  - En el celular, la pastilla del vínculo («Directo», «0 KB/min») va debajo del título, con «Vale
    para todos» a su lado. La luz aparece al lado de la pastilla solo sin conexión. La variante no
    tenía el indicador.
  - Tocar el indicador muestra una tostada: su detalle está en la maqueta del vínculo.
- **Las teclas, solo con Alt apretado** (00 · R2.9): la variante mostraba siempre «Ctrl Z» en
  «Deshacer».
- **Un atajo con Alt para cada botón** (00 · R2.8, R2.10). Las teclas de los ajustes ya estaban
  (R, M, Z, S, T, V). Se suman:
  - «Deshacer»: D. Ctrl Z sigue deshaciendo fuera de una caja de texto; adentro, es el de editar
    texto (R2.11).
  - En la confirmación del redondeo, «Cancelar» C y «Confirmar» O (en lugar de las teclas «Esc» y
    «Enter» que mostraba). Esc y Enter siguen andando.
  - Cuando el recálculo falla, «Ahora no» A y «Reintentar» R.
  - Sin conexión, «Reintentar» R.
  - El indicador del vínculo, L, como en las otras finales.
- **«Confirmar» en la confirmación del redondeo** (E18): el botón decía «Cambiar 1.650 precios».
  El número sigue en grande arriba de los ejemplos.
- **La espera del recálculo** (00 · R7.1 a R7.3). En la variante, la barra aparecía al confirmar y
  terminaba en 1,25 s. Ahora:
  - al confirmar, «Confirmar» y «Cancelar» se traban, y Esc y tocar afuera no cierran;
  - a los 300 ms, «Confirmar» muestra la marca de espera (el círculo que gira);
  - a los 2 s aparece la barra, que dice qué hace y cuánto lleva: «Recalculando 1.650 precios…
    1.263 de 1.650»;
  - al terminar dice «Listo» un instante, en verde, y recién ahí se cierra con la tostada.

  En la maqueta, el recálculo tarda 3,4 s para que se vea. Si falla, la barra se frena a 62 % y
  aparece «No se pudo cambiar el redondeo» con «Reintentar», como en la variante. «Reintentar» sin
  conexión también muestra la marca de espera a los 300 ms, no al tocarlo.
- **Los grupos también en el celular** (R1.3): sin la lista, el grupo del ajuste («Precios»,
  «Negocio», «Acceso») va arriba del título del escenario.
- **Cada ajuste dice en una línea qué cambia** (R1.3): en el escenario de la sesión, los dos ajustes
  tienen su línea debajo del nombre:
  - «Sin usarla, la sesión se cierra pasado esto»;
  - «Lo más que dura una sesión desde que se entró».

  La variante tenía una sola línea para los dos.
- **El precio calculado, también en el celular** (00 · R8.1): en la vidriera, cada producto dice
  «Calculado $ 15.001» debajo del nombre, como en la computadora. La variante lo escondía en el
  celular y el precio redondeado quedaba sin su origen.
- **Sin el permiso, sin la pista de mirar** (R1.2): «Pasá por una opción para ver su efecto» no
  aparece, porque sin el permiso las opciones no se tocan ni se miran.
- **El brillo de lo que cambió también en el celular:** en la variante, el verde de 1 s solo se veía
  en la lista de la computadora. Ahora también en la tira, y la de «Sesión» brilla con cualquiera
  de sus dos tiempos.
- **Los radios y los colores del lenguaje visual.** La variante usaba radios sueltos:
  - 20 px en el escenario y la hora;
  - 14 px en las opciones, las tiras, la jornada y el costo;
  - 10 px en los íconos y las notas.

  Ahora son 16 (tarjeta), 12 (botón y campo) y 8 (lo chico). Los blancos y los anillos escritos
  a mano pasaron a `var(--superficie)`, `--pino-suave`, `--error-suave` y `--logro-suave`. El marco
  y el cartel del ambiente de pruebas siguen con su magenta, porque no siguen el lenguaje
  (00 · R10.2).

## Por la tecnología

- **Una sola página para los dos** (ADR-002): un `index.html` que cambia a celular debajo de 900
  px, como la variante.
- **Solo `transform` y `opacity`.** El verde de lo que cambió animaba la sombra; ahora es un anillo
  en una capa aparte (`.recien::after`) que solo se enciende y se apaga. Lo demás ya cumplía:
  - el fundido del escenario y el empuje de 40 px al deslizar;
  - los números que ruedan;
  - las cajas de los márgenes que vuelan a su lugar;
  - el temblor del error;
  - la hoja que sube;
  - el reloj de 5 s de «Deshacer».

  Con «reducir movimiento» o «Animaciones» apagadas en «Casos», nada se mueve.
- **Las cajas de los márgenes sin `field-sizing`**, que Firefox no tiene: el ancho sale de cuántos
  caracteres tiene el número (`--largo`), y se pone al día mientras se escribe.
- **Sin enlaces a otras maquetas:** se sacó `navigate.js`. Llevaba a carpetas `v2/` que no existen.
  El menú, «Más» y «Salir» son botones sin destino, como en las otras finales.
- **Sin estilos en línea fijos:**
  - el aviso sin conexión, la pantalla «Hace falta conexión» y las marcas de la jornada pasaron a
    la hoja;
  - en línea queda solo lo que sale de los datos: dónde cae cada marca y cada tramo de la jornada,
    y el ancho de cada margen.
- **Nada consulta la red.** La hora del negocio avanza con un reloj local cada 15 s, como en la
  variante. Las cantidades de precios que cambian son inventadas: las daría el servidor.
- **Se probó en Chromium** (1366 × 768 y 390 × 844, sola y dentro del visor), sin errores en la
  consola: los atajos, el recálculo, Deshacer y «reducir movimiento». No hubo Firefox para
  probarla.

## Para llevarla al código

- Una clase por pieza:
  - `.v2-lista` e `.it`: la lista; `.v2-tiras` y `.tira`: las tiras del celular;
  - `.escenario`, `.esc-grupo` y `.esc-cab`: el escenario;
  - `.op`: una opción con su efecto;
  - `.vidriera` y `.prod`: los productos;
  - `.tecla-m`: un margen;
  - `.jornada`, `.j-eje`, `.j-tramo`, `.j-ocio` y `.j-marca`: la jornada;
  - `.cal`, `.campo-dias` y `.deslizador`: el vínculo;
  - `.reloj-negocio`: la zona horaria;
  - `.barra-espera` y `.espera-ico`: la espera;
  - `.vinculo-tarjeta` e `.indicador-pastilla`: el marco.

  Usan los tokens de `common.css`.
- La lista y las tiras son `tablist` y el escenario es su `tabpanel`. Las opciones son
  `radiogroup` con `radio` y `aria-checked`, y se recorren con ← y →. El diálogo es `dialog`
  `aria-modal`, y la barra de la espera, `status`.
- Los atajos se marcan con `data-tecla` en el botón. Gana el que está a la vista en lo que está
  encima, y si no hay ninguno, el de la pantalla.
- Las reglas están en `settings.js`, una vez para los dos dispositivos:
  - guardar con «Deshacer» 5 s (R2.1);
  - el rango en el lugar (R2.2);
  - «lo cambió otro» (R2.3);
  - el redondeo para arriba, con su confirmación, todo o nada (R3);
  - los márgenes ordenados y sin repetir (R4);
  - los días de 1 a 365 (R7).
