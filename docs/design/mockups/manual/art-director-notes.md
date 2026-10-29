# El manual: tres maquetas para Carlos

Capturas lado a lado: `desktop-comparison.png` y `phone-comparison.png`. Cada maqueta se abre
sola desde `<dispositivo>/variant-N-<idea>/index.html` y usa `../../../../common/` (el lenguaje
«Mostrador»), `../../shared.css`, `../../shared.js` (el contenido del capítulo «Entrar», el mismo
en las tres) y las capturas de `captures/`.

**Qué muestran las tres.** El manual abierto sin haber entrado (no hay datos del negocio), con el
dispositivo elegido arriba y arrancando en el que se usa (R6.3), el índice con un capítulo por
módulo en el orden del menú (R6.4: «Entrar» primero, los demás «Pronto» y sin abrirse), texto
simple con pasos y capturas de la aplicación de verdad (R6.5), un clip mudo que arranca solo cuando
se lo pide, solo en «Entrar a la computadora con el celular» (la única parte que vale verla en
movimiento), un buscador que encuentra solo lo del dispositivo elegido, con su capítulo, y lleva a
esa parte (R6.6), y «Volver» (R6.7: en la computadora vuelve a la entrada; en el celular, a Más).

**El capítulo «Entrar».** En la computadora: entrar con el celular (la forma más rápida), con
Google, si no hay internet, si pasa mucho tiempo (la sesión vence y se sigue donde se estaba) y
salir. En el celular: con Google (y la huella ofrecida una vez), con la huella, hacer entrar a la
computadora, entrar sin internet (capítulo 15: prender «Trabajar sin conexión» en Más, entrar con
la huella hasta 24 horas, qué pasa al volver la conexión), si no hay internet y salir.

**Las capturas.** Salen de `tests/screens/references/`, recortadas del marco magenta y pasadas a
WebP (menos de 70 KB cada una). Faltan tres, que se muestran como «Captura de la aplicación por
sacar» y no se rellenan con nada: la entrada de la computadora sin internet, el marco de la
computadora con la tarjeta de la persona (Salir) y Más del celular con «Salir» al final. Tampoco hay
captura de la hoja «¿Entrar en Chrome en Windows?» del celular.

## Las variantes

| | Idea en una frase | Ideas del catálogo |
|---|---|---|
| **1 · El libro** (evolución) | El manual como un buen centro de ayuda: índice de capítulos a la izquierda con las partes del capítulo abierto, el capítulo en el centro con una tarjeta por parte (pasos numerados a un lado, la captura que corresponde al otro) y «En este capítulo» a la derecha; en el celular, el índice y el capítulo como dos pantallas, con saltos por parte arriba. | 1, 2, 3, 4, 5, 6, 7, 8, 14 |
| **2 · Paso a paso** (reinvención) | El manual no se lee, se sigue: la pantalla pregunta «¿Qué querés hacer?», lista tareas («Entrar sin internet · 3 pasos») y cada una se recorre de a un paso, con la captura grande, el punto que dice dónde tocar con su rótulo y «Siguiente» (→). En el celular, la tarea se abre como una hoja y se pasa de paso deslizando. | 1, 2, 3, 4, 5, 9, 10, 11, 14 |
| **3 · Mostrame** (audaz) | El manual es la pantalla misma: la captura de la entrada ocupa todo, con puntos numerados que laten sobre lo que se toca; tocar uno oscurece el resto y abre la explicación al lado (o en una hoja). Se pasa de pantalla deslizando (la entrada, sin internet, Más, salir) y se le pregunta escribiendo o hablando («Preguntale al manual»); cada respuesta tiene «Mostrame», que lleva a la pantalla y enciende el punto. | 1, 2, 3, 4, 12, 13, 14, 15, 16, 17 |

**Qué rompe la 3.** El capítulo deja de ser un texto que se lee de arriba abajo: los pasos viven en
el globo de cada punto, y lo que no tiene lugar en una pantalla (si pasa mucho tiempo) cuelga de una
pantalla «Ya adentro». El índice queda reducido a una tira (Entrar y puntos «pronto»). Pide una
captura limpia por pantalla y por dispositivo, con los puntos ubicados a mano. La voz necesita el
micrófono del celular y su permiso. Si se llevara más lejos (el manual encima de la aplicación de
verdad, no de una captura), chocaría con R6.2: mostraría datos del negocio.

## Cuál prefiero

**La 2, Paso a paso.** Quien atiende una ferretería no viene al manual a leer: viene con un
problema concreto («no me deja entrar», «¿cómo entro sin internet?»), y la 2 empieza por esa
pregunta, con la caja de búsqueda como lo principal (el cursor ya está ahí en la computadora). Cada
paso tiene una sola frase, en letra grande, y la captura con el lugar donde tocar señalado y
nombrado: es lo más parecido a que alguien se lo muestre con el dedo. Se puede seguir con el
cliente esperando y sin perder el hilo, y el formato sirve igual para cualquier capítulo que venga
(Vender, Compras). De la 1 tomaría el «En este capítulo» y la lupa en las capturas; de la 3, los
puntos que laten sobre la captura y el «Mostrame» en el resultado de una búsqueda.

## Movimiento, por interacción

- **Cambiar Computadora / Celular:** el capítulo baja 8 px y se funde (160 ms) y vuelve con el
  contenido del otro dispositivo; se siente como dar vuelta la página, no como recargar.
- **Ir a una parte (índice, buscador, «Mostrame»):** desplazamiento suave y la tarjeta destella con
  un borde naranja que se apaga en 1,2 s: el ojo cae justo donde está la respuesta.
- **Tocar un paso (1):** la captura se funde (120 ms) por la del paso y su punto empieza a latir.
- **Pasar de paso (2):** la captura sale 24 px hacia la izquierda y la nueva entra desde la derecha
  (320 ms); las barras de avance se llenan; los pasos sin captura muestran un ícono grande que
  entra con rebote sobre la captura anterior velada.
- **El punto que señala:** un anillo naranja que crece y se desvanece cada 1,6 s, como el
  indicador de «tocá acá» de un tutorial de iPhone.
- **El clip:** al tocar «Ver cómo se hace», la computadora se aclara, el celular sube, se acerca al
  código, una línea naranja lo recorre y la computadora muestra «La computadora entró»; la barra de
  abajo avanza 8 s. Mudo, y no arranca solo.
- **El foco (3):** todo se oscurece al 60 % menos un círculo, que viaja de un punto al otro (420
  ms); en el celular, la captura sube para que lo señalado quede arriba de la hoja.
- **Hojas (celular):** suben desde abajo (320 ms); se cierran deslizando hacia abajo. El capítulo
  (1) entra desde la derecha y se vuelve deslizando desde el borde izquierdo, como en iPhone.
- **Hablar (3):** cinco barras naranjas suben y bajan mientras escucha.
- Con «reducir movimiento», nada se mueve: los cambios son directos.

## Teclado (computadora)

`/` busca (en la 2 el cursor ya está en la caja), ↑ ↓ recorren los resultados y Enter abre; Esc
vuelve (o cierra lo que esté abierto); Alt muestra las teclas, Alt C y Alt L eligen el dispositivo.
En la 1, ↑ ↓ pasan de parte; en la 2, ← → pasan de paso (también con la caja vacía), V el clip y T
todos los pasos; en la 3, Tab recorre los puntos, 1–9 abre uno, ← → cambian de pantalla y Ctrl K
pregunta.

## Autocrítica

- **Primera pasada, corregida:** en la 1 la captura de la computadora quedaba en 300 px y no se
  leía; ahora tiene 400 px y se agranda al tocarla. En la 2 y la 3 el rótulo del punto se cortaba
  contra el borde cuando lo señalado estaba a la derecha; ahora se abre hacia adentro. En la 3 el
  botón «Volver» tapaba el punto de «En línea»: pasó al chip de la izquierda. En el celular, la 3
  tapaba con la hoja lo que explicaba: ahora la captura sube. Los resultados repetían el título
  como texto: ahora muestran la frase donde aparece lo buscado.
- **Lo más flojo que queda:** las capturas tienen el cartel «Ambiente de prueba» y en Más se ve una
  persona de prueba (Ana Gómez, Administrador): en el manual de verdad las capturas tienen que
  salir de una cuenta de demostración y sin el marco de pruebas. El clip está armado con dos
  capturas, no es un video de la aplicación. La 3 en la computadora, con el globo grande, tapa la
  mitad de la entrada.
- **Lo que agregué sin que lo pidan las reglas** está marcado en el catálogo.

## Catálogo de ideas

1. **El dispositivo arriba, como dos segmentos con su ícono, y una pastilla que dice por qué
   arrancó en ese.** Que no se lea un manual equivocado. Variantes 1, 2, 3. Patrón: Apple Support
   («iPhone / Mac»). Ahorra el ir y venir de quien lee lo del otro. Dentro de la regla (R6.3).
2. **Los capítulos que faltan, en el índice con «Pronto» y apagados.** Saber qué va a haber.
   1, 2, 3. Patrón: el menú de la aplicación. Dentro de la regla (R6.4).
3. **El punto que late sobre la captura, con el nombre de lo que se toca.** Ver dónde tocar sin
   buscar. 1, 2, 3. Patrón: los tutoriales de iOS y los recorridos de Intercom. Ahorra leer la
   frase entera para ubicar el botón.
4. **Un buscador que muestra el capítulo y la parte, con lo buscado resaltado, y lleva y hace
   destellar esa parte.** 1, 2, 3. Patrón: Stripe Docs, Linear. Ahorra recorrer el índice (de 3–4
   toques a 1).
5. **«N más en el manual del celular · Ver».** Si lo buscado está en el otro dispositivo, lo dice y
   cambia con un toque. 1, 2. Patrón: los filtros de Google («también en…»). **Fuera de la regla:**
   R6.6 dice que muestra solo lo del dispositivo elegido; esto no lo muestra, solo lo cuenta.
6. **Tocar un paso cambia la captura por la de ese paso.** Leer y ver juntos sin desplazarse. 1.
   Patrón: los pasos de la documentación de Shopify.
7. **«En este capítulo», que marca la parte que se está leyendo.** 1. Patrón: Stripe Docs.
8. **La lupa: tocar la captura la agranda.** Leer los textos chicos de la captura de la
   computadora. 1. Patrón: Fotos de Apple.
9. **Empezar por «¿Qué querés hacer?» con tareas en lugar de capítulos para leer.** La gente
   viene con un problema, no a estudiar. 2. Patrón: Square Support, el «Cómo hago…» de Apple.
   Dentro de la regla (los capítulos siguen, agrupan las tareas).
10. **Un paso por pantalla, en letra grande, con «Siguiente» (→) y barras de avance.** Seguirlo
    con el cliente esperando sin perder el hilo. 2. Patrón: las historias de Instagram, la
    configuración de un iPhone. **Cambia R6.5 en la forma:** el texto existe, pero se lee de a un
    paso («Todos los pasos» lo muestra entero).
11. **Para los pasos que no tienen captura, un ícono grande sobre la captura anterior velada.** Que
    cada paso tenga algo que mirar. 2.
12. **La captura a pantalla completa con puntos numerados, como si fuera la aplicación.** 3.
    Patrón: los recorridos guiados de Figma y Notion. **Fuera de la regla:** reemplaza el capítulo
    escrito por explicaciones sobre la pantalla.
13. **El foco: todo oscuro menos lo que se explica, y el foco viaja de un punto al otro con Tab.**
    3. Patrón: los coach marks de Android.
14. **El clip, dentro de su parte, con «Ver cómo se hace · 8 s · sin sonido».** 1, 2 («Ver el
    clip», V), 3 (en el globo). Patrón: Apple Support. Dentro de la regla (R6.5).
15. **«Preguntale al manual», con Ctrl K, y «Mostrame» en cada respuesta.** De la pregunta a ver el
    botón señalado en un toque. 3. Patrón: la paleta de Linear y Raycast.
16. **Preguntar hablando.** Con las manos ocupadas o con guantes. 3 (celular). Patrón: Siri,
    Google. **Fuera de la regla:** pide el micrófono y entender lo que se dice.
17. **Deslizar entre las pantallas del capítulo (la entrada, sin internet, Más, salir).** 3. Patrón:
    Fotos de Apple.
