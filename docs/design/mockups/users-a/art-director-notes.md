# Negocio → Usuarios (etapa a): tres maquetas para Carlos

Las capturas están lado a lado en `desktop-comparison.png` y `phone-comparison.png`. Cada variante
se abre sola desde su `index.html`. Usa `../../../../common/` y `../../shared/`: los datos inventados,
los íconos que se suman (Lucide), el marco y el movimiento que comparten. Las tres muestran a las
mismas nueve personas, así se compara igual con igual:

- Rubén (vos) y Graciela, Lucía, Martín y Nahuel, activos.
- Pedro y un alta sin nombre (`sofia.acosta@example.com`), que todavía no entraron.
- Carla y Diego, dados de baja.

Todos los correos son `@example.com`. **Etapa a:** cada persona lleva solo la pastilla
«Administrador». No hay roles, columnas de roles ni filtros de roles.

**Sin conexión (R2.2):** en las tres, la luz de conexión (en el lateral, arriba en el celular)
simula que se corta la conexión al tocarla. La pantalla se pone gris y aparece «Sin conexión». Se
lee, pero no se toca. Al tocarla de nuevo, vuelve sola con la tostada «Volvió la conexión».

## Las tres ideas

| | La idea en una frase | Ideas del catálogo |
|---|---|---|
| **1 · La lista y la tarjeta** (evolución) | En la computadora, arriba van cuatro números y a la izquierda la lista con buscador y filtros (Todas, Activas, Sin entrar, De baja). A la derecha, la tarjeta de la persona elegida, con sus sesiones y celulares con huella para cerrar y quitar. En el celular, la tarjeta entra desde la derecha. | 1, 2, 3, 4, 5, 6, 7, 8, 9 |
| **2 · Personas y aparatos** (reinvención) | Dos miradas sobre lo mismo. **Personas** son pases con sus aparatos a la vista: cada aparato es una ficha que se toca para cerrarlo. **Aparatos abiertos** muestra los de todos juntos, del más reciente al más viejo, y tiene el atajo «Se perdió un celular»: elegís de quién era y cortás todo de un toque. Para autorizar se escribe el correo en una línea y se aprieta Enter, sin diálogo. En el celular, los pases se apilan como en Wallet y la línea para autorizar va abajo, como para escribir un mensaje. | 1, 3, 5, 10, 11, 12, 13, 14, 15 |
| **3 · El tablero** (audaz) | La pantalla entera es el tablero eléctrico del local. Cada persona es un circuito: su placa con el nombre, una llave y un riel de térmicas. Cada sesión es una térmica que se baja de un toque. La «General» baja todas y la llave da de baja o de alta; las dos hay que mantenerlas apretadas un segundo. A quien está dado de baja le cuelga una tarjeta roja «DE BAJA», y un alta que nunca entró aparece «Sin estrenar». | 3, 5, 16, 17, 18, 19, 20 |

## Cuál me gusta más

**La 1, con dos ideas de la 2: la línea para autorizar (12) y «Se perdió un celular» (14).** La 1 se
lee de un vistazo y cumple todas las reglas tal cual. Para quien administra es la misma pantalla en
el celular y en la computadora. La línea de la 2 baja de cuatro pasos a dos lo que más se hace:
autorizar a alguien es escribir el correo y apretar Enter. «Se perdió un celular» responde al caso
urgente de verdad (R5.4 lo nombra: el celular robado) sin buscar a la persona y abrir su tarjeta. La
3 es la que más se disfruta y la que mejor transmite «bajar la térmica», pero su metáfora le pide a
la persona que aprenda algo nuevo para una pantalla que se usa poco.

## Qué contradice una regla o queda fuera del capítulo

- **1:** nada. La única decisión propia es que una dada de baja muestra la pastilla «Dada de baja»
  en lugar de «Administrador», con el renglón punteado y el avatar tachado. Así se distingue sin
  leer (R3.1), pero la pastilla «Administrador» no figura en esos renglones.
- **2:**
  - Las tarjetas de la computadora muestran siempre los aparatos, porque no hay tarjeta «cerrada».
    R5.1 dice que la cerrada dice cuántos tiene. En el celular sí se cumple: el pase apilado dice
    «2 sesiones · 1 huella».
  - En el celular, el pase cerrado no muestra la pastilla «Administrador» hasta abrirlo (R3.1).
  - **«Aparatos abiertos» y «Se perdió un celular» están fuera del capítulo.** Son una vista de
    todas las sesiones de todos y una acción que cierra las sesiones de celular y quita las huellas
    de una persona de una vez. El capítulo las pone dentro de la tarjeta de cada persona.
  - Las dadas de baja van en un estante aparte al pie, no al final de la misma lista.
- **3 (lo que rompe):**
  - **El marco:** no tiene menú lateral, ni pestañas de Negocio, ni menú de abajo en el celular.
    Solo una × para volver.
  - **Las confirmaciones (R4.1 y R5.4):** «Dar de baja» y «Cerrar todas» no abren un diálogo. Se
    confirman manteniendo apretada la llave o la General un segundo.
  - **Dar de alta (R4.2):** también se mantiene apretado, aunque la regla no pide confirmación.
  - **Las palabras:** «circuito», «desarmar» y «conectar» reemplazan «autorizar» y «borrar».
  - **El riel:** el detalle de cada sesión (cuándo entró, cómo) queda resumido en la etiqueta de la
    térmica y en el globo del mouse.
  - **En el celular** no se ve la nota de que la sesión propia se cierra con «Salir».

## Cómo se mueve (una línea por interacción)

- **Elegir a alguien (1, computadora):** el borde del renglón pasa a pino y la tarjeta cambia con
  un fundido de 200 ms, subiendo 4 px. Se siente como hojear.
- **Abrir la tarjeta (1, celular):** entra desde la derecha en 320 ms, como en el iPhone, y la ‹
  vuelve.
- **Cerrar una sesión o quitar un celular (1 y 2):** el renglón se corre 24 px a la derecha y se
  desvanece. Los números de arriba ruedan, aparece la tostada y el celular vibra 10-40-10.
- **Autorizar (todas):** la persona nueva entra desde 8 px abajo con rebote, y su borde se pinta de
  verde un segundo.
- **Error en el correo (todas):** el campo se pone rojo y el aviso aparece debajo, sin perder lo
  escrito.
- **Diálogos y hojas:** en la computadora suben 12 px con fundido; en el celular la hoja sube desde
  abajo y el fondo se oscurece al 30 %.
- **Pase apilado (2, celular):** al tocarlo se abre y los de abajo se corren. Su contenido aparece
  con un fundido y el celular vibra 10 ms.
- **Ficha de aparato (2):** un globo cae 4 px bajo la ficha en la computadora; en el celular sube
  una hoja.
- **Cambiar de mirada (2):** Personas ⇄ Aparatos con un fundido corto (Alt 1 / Alt 2).
- **Bajar una térmica (3):** la palanca cae 14 px con rebote y la ventanita pasa de verde a gris.
  Después, la térmica se va hacia arriba.
- **Mantener la General (3):** la palanca baja despacio mientras se llena una barra pino. Al
  completarse, las térmicas caen en cascada, una cada 80 ms.
- **Mantener la llave (3):** la ranura gira mientras se llena una barra roja. Al completarse, gira
  90° y se pone roja, las térmicas caen y la tarjeta «DE BAJA» se cuelga con un balanceo.
- **Reducir movimiento:** con «reducir movimiento» no se mueve nada, y mantener apretado pasa a
  durar 0,6 s.

## Teclado (computadora)

- **1:** Alt N autoriza, `/` busca, ↑ ↓ recorren la lista, Alt B da de baja o borra, Alt T cierra
  todas, Alt A da de alta y Esc cierra.
- **2:** Alt N va a la línea para autorizar, Alt 1 y Alt 2 cambian de mirada, Alt C abre «Cortar
  un celular» y Esc cierra el globo o el menú.
- **3:**
  - ↑ ↓ cambian de circuito y ← → recorren la placa, la llave y las térmicas.
  - Espacio baja la térmica; en la llave o la General, se mantiene apretado.
  - Alt N va al circuito nuevo y Esc vuelve a Negocio.

## Autocrítica (lo que corregí antes de mostrar)

- **1, computadora:**
  - Los números de arriba se partían en dos renglones: achiqué el ícono y acorté «Sesiones
    abiertas» a «Sesiones».
  - Los filtros se partían: ahora no se cortan y el buscador cede ancho.
  - La tarjeta se salía por la derecha con un nombre largo (un alta sin nombre muestra el correo):
    ahora corta con «…».
  - Los textos decían «1 sesiones» y «1 celulares»: ahora van en singular.
- **1, celular:** el renglón tenía los contadores apilados a la derecha y la pastilla partida. Ahora
  van en cuatro líneas fijas: nombre, correo, cuándo entró, y la pastilla con los contadores.
- **Hojas del celular:** al abrir una hoja, el foco corría el marco hacia arriba y asomaba la hoja
  de autorizar. Lo arreglé: el marco ya no se mueve.
- **3:**
  - Los circuitos medían 150 px y entraban cuatro: bajé la altura de las térmicas y ahora entran
    cinco.
  - «Entró hace 3 días» se cortaba: agrandé la placa.
  - Había dos botones naranjas: «Conectar» pasó a pino.
- **Lo más flojo que queda:**
  - En la 3, en el celular, el riel se corre de costado cuando hay más de tres térmicas.
  - En la 2, en la computadora, las tarjetas tienen alturas distintas y la grilla queda
    escalonada.

## Catálogo de ideas

Cada idea está suelta: se puede tomar o descartar sin rearmar nada.

1. **Pastilla «Vos» naranja suave junto al nombre propio.**
   - Qué resuelve: encontrarse en la lista.
   - Variantes: 1, 2, 3.
   - Viene de: Slack, «(vos)».
   - Toques que ahorra: ninguno. Está en las reglas.
2. **Cuatro números arriba: pueden entrar, sesiones, con huella y sin entrar aún (ámbar).**
   - Qué resuelve: ver de un vistazo si hay altas que nunca entraron, para avisarles.
   - Variantes: 1.
   - Viene de: Stripe.
   - Está dentro de las reglas.
3. **Las dadas de baja se distinguen sin leer:** renglón punteado, avatar gris con ⊘ y pastilla
   «Dada de baja».
   - Variantes: 1, 2 (estante) y 3 (tarjeta roja).
   - Viene de: Linear, con lo archivado.
   - Está dentro de las reglas (R3.1).
4. **Filtros Todas, Activas, Sin entrar y De baja, con su número, y buscador con «/».**
   - Variantes: 1.
   - Viene de: Linear.
   - Está dentro de las reglas: el diseño los decide.
5. **«Sin estrenar»: el alta que nunca entró va en ámbar, con «Avisale que entre con Google» y su
   correo, y con «Borrar» o «Corregir» a mano.**
   - Qué resuelve: que nadie olvide avisarle.
   - Variantes: 1, 2, 3.
   - Viene de: Shopify, con la invitación pendiente.
6. **El candado junto al correo de quien ya entró, con la explicación al pasar:** «para otra cuenta,
   autorizá el nuevo y dale de baja a este».
   - Variantes: 1, 2.
   - Está dentro de las reglas (R3.6).
7. **Una confirmación que lista lo que va a pasar** (N sesiones, N huellas, ya no entra), con los
   números de esa persona.
   - Variantes: 1, 2.
   - Viene de: GitHub, al borrar un repositorio.
   - Está dentro de las reglas.
8. **La tarjeta de la computadora fija a la derecha, recorrida con ↑ ↓.**
   - Variantes: 1.
   - Viene de: Mail y Linear.
   - Ahorra el toque de «abrir»: está siempre abierta.
9. **Un punto verde en la sesión usada en la última media hora.**
   - Qué resuelve: saber cuál es «la de ahora».
   - Variantes: 1, 2, 3.
   - Viene de: Google, «Tus dispositivos».
10. **Pases con sus aparatos a la vista:** cerrar una sesión pasa de 3 toques (abrir, buscar,
    cerrar) a 2 (ficha y cerrar).
    - Variantes: 2.
    - Viene de: Apple, «Buscar».
    - Va contra R5.1 en la computadora.
11. **Mirada «Aparatos abiertos»:** todas las sesiones de todos, de la más reciente a la más vieja,
    agrupadas en «En la última hora», «Hoy» y «Antes».
    - Variantes: 2.
    - Viene de: Google, la página de seguridad de la cuenta.
    - **Está fuera del capítulo.**
12. **Autorizar en una línea:** correo, nombre opcional y Enter, sin diálogo. En el celular, como
    escribir un mensaje.
    - Variantes: 2 y 3 («Circuito nuevo»).
    - Viene de: Linear, al agregar una tarea, y de iMessage.
    - Toques: de 4 a 2.
13. **Pases apilados como en Wallet:** se abre uno por vez y los cerrados dicen «2 sesiones ·
    1 huella».
    - Variantes: 2, en el celular.
    - Viene de: Apple Wallet.
14. **«Se perdió un celular»:** elegís de quién era y lo cortás de un toque (cierra sus sesiones de
    celular y quita sus huellas).
    - Toques: de 5 a 3.
    - Variantes: 2.
    - Viene de: Apple, «Buscar», con «Marcar como perdido».
    - **Está fuera del capítulo:** junta R5.3 y R5.6 en una sola acción.
15. **Estante de dadas de baja al pie, con «Dar de alta» en cada una.**
    - Variantes: 2.
    - Viene de: Gmail, con lo archivado.
16. **El tablero eléctrico:** persona = circuito, sesión = térmica y huella = térmica pino.
    - Qué resuelve: entender sin palabras qué está «encendido».
    - Variantes: 3.
    - **Está fuera del lenguaje visual y del marco.**
17. **Bajar una térmica de un toque**, sin confirmar, con la palanca que cae.
    - Variantes: 3.
    - Está dentro de las reglas (R5.3 y R5.6).
18. **Mantener apretado para confirmar** «Cerrar todas» (la General) y «Dar de baja» (la llave).
    - Variantes: 3.
    - Viene de: el iPhone, al mantener apretado para apagar.
    - **Va contra R4.1 y R5.4**, que piden un diálogo de confirmación.
19. **Tarjeta de bloqueo roja «DE BAJA»** colgada en el circuito, como en un tablero en reparación.
    - Variantes: 3.
20. **Pantalla completa sin menú**, con × y Esc para volver a Negocio, y una barra de teclas al pie.
    - Variantes: 3.
    - **Rompe el marco** (00 · R1).
