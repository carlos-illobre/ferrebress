# El manual · maqueta final: en qué se diferencia de la variante 2 del director

Base: la variante 2, «Paso a paso», de la computadora (`../desktop/variant-2-guide/`) y del celular
(`../phone/variant-2-guide/`), con lo común de `../shared.js` y `../shared.css` y las capturas de
`../captures/`. Carlos la eligió sin pedir nada de las otras variantes: no se tomó nada de la 1 ni
de la 3.

**Una sola página para los dos anchos**, como las otras finales: desde 900 px se ve como la
computadora (las tareas a la izquierda y el paso a paso a la derecha); debajo, como el celular (las
tareas a pantalla entera y el paso a paso en una hoja que sube). Sin la barra de estado dibujada del
celular. Archivos propios, sin depender de los del director salvo sus capturas:

- `index.html`: el HTML, una pieza por clase.
- `manual.css`: `../shared.css` y los estilos de las dos variantes, en uno.
- `content.js`: el contenido (copia de `../shared.js` ajustada; sin lo que solo usaban la 1 y la 3).
- `manual.js`: el comportamiento de las dos variantes, en uno.
- `captures/`: las tres capturas que faltaban (WebP, 10 a 63 KB).

Para mirar un estado: `?paso=<parte>` abre una parte (por ejemplo `?paso=d-sininternet`),
`?todo=<parte>` abre «Todos los pasos» en esa parte y `?dispositivo=celular` elige el otro manual.

Capturas: `screenshot.png`, `screenshot-step.png` («Si no hay internet», paso 1) y
`screenshot-all-steps.png` en la computadora (1366 × 768); `screenshot-phone.png`,
`screenshot-phone-step.png` («Entrar sin internet», paso 1) y `screenshot-phone-all-steps.png` en
el celular (390 × 844).

## Por las reglas aprobadas

- **R6.6, el buscador muestra solo lo del dispositivo elegido:** se sacó «N más en el celular ·
  Ver» (y «… en el de la computadora · Ver» del celular), con la función que contaba lo del otro
  dispositivo. Lo encontrado va agrupado bajo su capítulo («Entrar · 2 encontradas»), porque la
  regla pide mostrarlo con su capítulo; los capítulos que faltan y coinciden con lo buscado siguen
  apareciendo, con «Pronto».
- **R6.4, un capítulo por módulo en el orden del menú, «Entrar» primero:** «Entrar» va arriba, con
  sus tareas. Debajo, «Próximos capítulos» con los otros dieciséis en el orden del menú (Vender ·
  Catálogo · Depósito · Negocio · Más), y cada uno dice «Pronto» (la pieza `.pronto` del marco).
  No son botones: no se abren. El director los mostraba sin la palabra «Pronto».
- **R6.5, el texto se puede leer entero:** «Todos los pasos» ahora muestra el capítulo entero, no
  solo los pasos de la parte abierta: la introducción y, por cada parte, su título, su
  explicación, los pasos numerados y todos sus consejos (el paso a paso muestra un consejo por
  vez). Llega a la parte que se estaba siguiendo, que destella. Para que se vea cómo llegar:
  - es el último renglón de las tareas de «Entrar» («Todos los pasos · El capítulo entero, para
    leerlo de corrido»), en la computadora y en el celular;
  - sigue el botón de arriba del paso a paso, ahora un botón común (era el suave, que casi no se
    veía) y también en el celular, que no lo tenía;
  - se vuelve con «Volver al paso a paso» (Alt T o Esc) en la computadora, y con la × en el
    celular, a donde se estaba.
  En la computadora cubre solo el paso a paso: las tareas y el buscador siguen a la vista. En el
  celular es otra hoja, encima de la del paso a paso.
- **R6.1 y R6.7, «Volver»:** en la computadora, «Volver a la entrada» arriba a la derecha; en el
  celular, «‹ Más» arriba a la izquierda. En la maqueta los dos lo dicen con una tostada («Vuelve a
  la entrada, donde estabas» / «Vuelve a Más, donde estabas»): la maqueta del marco no se puede
  abrir con Más a la vista, y la tostada no saca a Carlos del manual dentro del visor.
- **R6.3, arranca en el dispositivo que se usa:** en la maqueta lo decide el ancho (desde 900 px,
  Computadora); en la aplicación lo dice el dispositivo. Cambiar de dispositivo cierra «Todos los
  pasos» y vuelve al principio del otro manual.
- **R6.2, sin datos del negocio:** las capturas muestran personas inventadas (Ana Gómez, Rubén
  Paredes) y ningún dato del negocio.
- **El capítulo «Entrar», como dicen 01 y 15:**
  - «Entrar con el celular» (computadora): el consejo del Wi-Fi dice el texto del celular («Para
    entrar a la computadora, conectá este celular al mismo Wi-Fi», 01 · R2.5); el de un celular sin
    sesión suma que, si todavía no entra con la huella, primero entra con Google y le pide ponerla
    (01 · R2.7).
  - «Entrar con Google» (computadora): «si dice que tu cuenta no está autorizada, pedile que agregue
    tu correo» (01 · R1.3).
  - «Si pasa mucho tiempo»: el consejo «Los tiempos los puede cambiar un Administrador» se cambió
    por «Si entra otra persona, lo que quedó a medio hacer se descarta» (01 · R3.4): Administración
    todavía no existe y hoy los tiempos son fijos (01 · R3.2). El segundo paso dice «Entrás de nuevo
    con tu cuenta», porque solo la misma persona sigue donde estaba.
  - «Entrar con Google» (celular): la hoja de la huella se acepta y se pone la huella (01 · R2.2,
    R2.11).
  - «Entrar sin internet» (celular): «Trabajar sin conexión» aparece si ya entra con la huella en
    ese celular (15 · R1.3); las 24 horas cuentan desde la última vez que se usó Ferrebress con
    internet en ese celular (15 · R2.2); se suma que, si la sesión se cerró desde otro dispositivo,
    hace falta internet (15 · R2.2).
  - Los textos de los botones, como los dice la aplicación: «Continuar con Google», «Ingresar con
    huella», «Escanear código QR», «Trabajar sin conexión», «Salir».
- **Las tres capturas que faltaban** se sacaron de las maquetas finales aprobadas, a la medida de
  las del director (1100 × 613 la computadora, 374 × 828 el celular), en `captures/`:
  - `desktop-entrance-offline.webp`: la entrada de la computadora sin conexión
    (`sign-in/adapted/`, estado «Sin conexión»), con el punto en «Para entrar hace falta internet».
  - `desktop-frame-sign-out.webp`: el marco de la computadora con la tarjeta de la persona y
    «Salir» (`app-frame/final/`); un punto en la tarjeta y otro en «Salir».
  - `phone-more-sign-out.webp`: Más del celular, bajado hasta «Salir» (`app-frame/final/`); un punto
    en Más y otro en «Salir».
  Ya no queda ninguna «Captura de la aplicación por sacar». Cuando el punto está cerca del borde de
  abajo, su rótulo va arriba, para no taparse con el borde.
- **El teclado (00 · R2), solo en la computadora:** todo botón tiene Alt y una letra, y las teclas
  se ven solo con Alt apretado (R2.8, R2.9). El director mostraba siempre `Esc`, `→`, `V` y `T`, y
  `V` y `T` sin Alt no andaban con el cursor en el buscador, que es donde arranca (R2.2). Quedan:
  Alt C Computadora, Alt L Celular, Alt O Volver, Alt V Ver el clip, Alt T Todos los pasos (y
  volver de ahí), Alt A paso anterior, Alt S siguiente. Siguen ← → para pasar de paso (con la caja
  vacía), ↑ ↓ y Enter en los resultados y `/` para buscar.
- **Esc (00 · R2.7):** cierra lo que está encima («Todos los pasos») o borra lo buscado; ya no sale
  del manual, porque sin nada encima solo saca la marca. Se vuelve con Alt O.
- **El celular (00 · R2.12):** el cursor no arranca en el buscador.
- **R6.8:** no guarda nada en el dispositivo ni pide nada a la red.

## Por la tecnología

- **Solo se anima `transform` y `opacity`:** la hoja del celular sube con `transform`; el renglón
  de una tarea ya no anima el fondo al pasar el mouse; el destello de la parte en «Todos los pasos»
  es un borde aparte que se funde. Con «reducir movimiento» nada se mueve: el clip muestra su final.
- Las tareas, los capítulos que faltan y los pasos son listas (`ul`, `ol`); las tareas y las barras
  de avance son botones; el dispositivo elegido se marca con `aria-pressed`.

## Lo que decidió Carlos al aprobarla

- **Capítulos que no son una opción del menú** (Clientes, Celular y computadora, Trabajar sin
  conexión, Administración): van después de los del menú, en el orden en que se programan
  (00 · R6.4).
- **Entrar sin conexión** se explica en «Entrar»; «Trabajar sin conexión» lleva ahí (00 · R6.4).
- **El paso que se hace en el otro dispositivo** se muestra igual, con la captura del otro
  dispositivo y una aclaración de dónde se hace (00 · R6.3).
- **«Volver»** nombra la pantalla a la que vuelve: «Volver a la entrada», «Volver a Vender»
  (00 · R6.7).
- **En el celular, un título largo** se corta con «…» en un renglón; el título entero está en el
  paso.
- **El clip** queda en la maqueta como dos capturas; en la aplicación es un video mudo de la
  aplicación programada (00 · R6.5).
- **El rótulo del punto va al costado del aro, en diagonal y con una flecha que lo señala:**
  centrado debajo del aro parecía un botón de la pantalla. Cerca de un borde cambia de lado, y si
  hace falta sale del marco del celular para leerse entero. `screenshot-phone-google.png` lo
  muestra en el celular.
- **Una captura de la computadora más alta que el escenario se achica entera** en vez de
  recortarse abajo: recortada, el aro de «Tu tarjeta» y el de «Salir» caían fuera de lugar.
- **Las capturas y los clips del manual de verdad** se sacan sin el marco ni el cartel del ambiente
  de pruebas, con una cuenta de demostración (00 · R6.5). Las de esta maqueta, las nueve, se
  volvieron a sacar de la aplicación así, a la misma medida, para que los puntos no se muevan.
