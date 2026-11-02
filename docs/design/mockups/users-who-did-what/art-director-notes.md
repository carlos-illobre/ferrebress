# Usuarios · Quién hizo qué: tres ideas para Carlos

Las seis maquetas muestran el mismo miércoles 4 de noviembre a las 10:42, con 45 acciones de una
semana: 20 son de hoy, con 4 rechazos y 4 que borran o sacan. Lucía Fernández está dada de baja,
Camila Ruiz está borrada (la autorizaron y la borraron sin que entrara nunca) y a Martín le
cambiaron el nombre a la mañana, así que sus acciones de antes dicen «Martín (hoy: Martín Sosa)».
Martín también entró sin conexión, con la hora sin confirmar, y alguien probó un correo de
afuera de noche. Uno de esos correos trae código de página (`<b>jefe</b>@ejemplo.com`) y se ve
como texto (E38).

Cada variante se abre sola desde su `index.html`. Usa `../../../../common/` y `../../shared/`,
donde están los datos, las piezas comunes y 17 íconos Lucide que faltaban. Todas se tocan: los
filtros, la página, el detalle, «Actualizar» (trae una acción nueva) y la luz de la conexión
(simula que se corta). Las capturas lado a lado están en `desktop-comparison.png` y
`phone-comparison.png`.

## Las tres variantes

| | La idea en una frase | Ideas del catálogo |
|---|---|---|
| **1 · El libro** (evolución) | Lo que piden las reglas, bien hecho. Arriba, tres números que también filtran y el día en una tira. Abajo, los cuatro filtros como pastillas y la lista agrupada por día. En la computadora, el detalle está siempre a la derecha y cambia mientras se recorre con ↑ ↓. En el celular, el detalle es una hoja. | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12 |
| **2 · Cara a cara** (reinvención) | No hay una lista: está la gente. Cada persona es una tarjeta con lo que hizo en el período, en puntos de color. Al tocarla se ve en dos columnas lo que hizo y lo que le hicieron. «Alguien sin entrar» es una persona más, arriba y en ámbar. Tocar un nombre lleva a esa persona. | 3, 6, 7, 8, 13, 14, 15, 16, 17, 18 |
| **3 · La cinta** (la que nadie se animaría) | El día como la grabación de una cámara de seguridad: una fila por persona, el tiempo de izquierda a derecha, un punto por acción y una curva que une a quien la hizo con quien la recibió. Se arrastra el cabezal, se pasa de a una con ← →, y «Reproducir» (Espacio) pasa el día entero. Lo que está bajo el cabezal se lee abajo, como un subtítulo. En el celular, la cinta es vertical y se pasa con el pulgar. | 6, 7, 8, 19, 20, 21, 22, 23, 24, 25 |

## La que más me gusta

**La 2, Cara a cara, con el detalle de la 1.** La pregunta que trae al dueño casi nunca es «qué
pasó en la acción 37». Es «qué hizo Nahuel» o «qué le hicieron a Lucía». La 2 la contesta en un
toque, sin abrir un filtro, y pone los intentos de afuera arriba, a la vista, sin buscarlos. Los
puntos de color de cada tarjeta dicen quién tuvo un día raro antes de leer nada. Le sumaría de la
1 el panel de detalle fijo en la computadora y, para revisar todo junto, la lista de la 1 como un
«Todos» arriba del plantel.

**La 3 es la que más me emociona.** Las curvas de quién a quién y el día que se reproduce son
lo más cercano a ver lo que pasó, y en la computadora la pantalla entera es una sola pieza.
La dejaría como un modo «Ver el día» desde la 1 o la 2, no como la pantalla de entrada.

**La 1 es la segura.** Cumple todo el capítulo al pie de la letra y es la que menos sorprende.

## Qué rompe cada una

- **1 · El libro:** nada de las reglas. Suma tres cosas que no están: los números de arriba
  (hoy, rechazos, sacó o borró), que filtran de un toque; la tira del día, cuyas rayas llevan a
  cada acción; y el detalle siempre abierto en la computadora (R4.7 dice «al tocar»; acá se ve con
  solo pasar).
- **2 · Cara a cara:** R4.2 y R4.3. Abre en «Hoy» y persona por persona, no en todas las acciones
  sin filtros. Cada columna muestra de a 10 con «Ver 10 más», no páginas de a 20 con «página 1 de
  3». El filtro por tipo desaparece: lo reemplazan los puntos de color y el orden de la gente. Los
  filtros «Hecho por» y «Hecho a» son la propia pantalla.
- **3 · La cinta:** rompe el marco y casi toda la sección 4. No tiene lateral ni pestañas en la
  computadora, ni menú de abajo en el celular, donde es un modo de una sola tarea con la × para
  volver. Muestra un día por vez, en lugar de todo de lo más nuevo a lo más viejo (R4.2). No tiene
  páginas (R4.3) ni lista (R4.4). Los filtros se reemplazan por aislar una persona y elegir el
  día; no hay «desde y hasta» ni filtro por tipo (R4.5). «Reproducir» es una forma nueva de mirar
  que nadie pidió. En el celular, lo que está en la franja se muestra entero sin tocarlo.

## Cómo se mueve (una línea por interacción)

- **Cambiar un filtro (1):** la pastilla se llena de pino. Las filas nuevas entran desde 4 px
  abajo, escalonadas 16 ms, y el total rueda hacia arriba (200 ms). Da la sensación de que la
  lista «se acomoda», no de que se recarga.
- **Recorrer con ↑ ↓ (1, computadora):** la fila elegida se tiñe de pino y el detalle de la
  derecha cambia con un fundido corto sin moverse de lugar, como la bandeja de Linear.
- **Tocar un número de arriba (1):** se aprieta al 97 % y queda con un anillo pino. La lista se
  filtra con el mismo fundido.
- **Tocar una raya de la tira (1):** la raya crece hacia arriba y la lista salta a esa acción.
- **Abrir el detalle (1 y 2, celular):** la hoja sube en 320 ms y el fondo se oscurece. Se cierra
  bajándola con el dedo, tocando afuera o con Escape. El celular vibra 10 ms.
- **«Actualizar»:** el ícono da una vuelta. Lo nuevo entra desde 8 px abajo con rebote y su borde
  se pinta de verde 1 s. En la 2, se ilumina la tarjeta de quien lo hizo.
- **Elegir una persona (2, computadora):** la cabecera y las dos columnas entran con un fundido de
  4 px, la de lo que le hicieron 40 ms después.
- **Tocar un nombre dentro de una acción (2):** en la computadora salta a esa persona. En el
  celular, la persona nueva entra desde la derecha como en iPhone, el botón de volver dice el
  nombre de la anterior y se vuelve deslizando desde el borde.
- **Abrir una acción (2, computadora):** se despliega en su lugar, con el antes → después y desde
  dónde.
- **Arrastrar el cabezal (3):** se pega a la acción más cercana. El punto late (crece a 2,1 y vuelve
  a 1,6), la curva de quién a quién se dibuja llena y el subtítulo cambia con un fundido. Se siente
  como pasar una cinta cuadro por cuadro.
- **Reproducir (3):** el cabezal avanza solo (14 s por día en la computadora, una acción por
  segundo en el celular) y cada acción se enciende al pasar, con una vibración corta en el
  celular. Con «reducir movimiento», salta de una a otra sin deslizarse.
- **Aislar una persona (3):** las otras filas bajan al 35 %. ← → solo recorre lo de esa persona.
- **Cambiar de día (3):** la cinta entra desde 6 px abajo con fundido. En el celular también se
  cambia deslizando el subtítulo a los costados.
- **Sin conexión (las tres):** la pantalla pasa a gris, no se toca y aparece «Sin conexión ·
  vuelve sola». Al volver, una tostada.

## Autocrítica (lo que corregí después de la primera captura)

- **1, computadora:** los filtros se salían de la columna y tapaban el detalle. Les saqué la
  flecha, angosté el detalle a 360 px y llevé las teclas de página al pie. Los rótulos de los
  números se cortaban en dos líneas.
- **1:** con el texto entero en rojo o ámbar, la lista se veía nerviosa. Ahora el color va solo
  en la raya y en la hora, como pide el lenguaje: color en piezas chicas.
- **1:** abría con «Salió» elegido, que no muestra nada. Ahora abre en una acción con un antes →
  después, para que se vea el detalle.
- **2:** en lo que le hicieron, el nombre de quien lo hizo aparecía dos veces. Quedó una sola vez,
  tocable, y el «(hoy: …)» aparece también ahí.
- **2:** el ícono de «Alguien sin entrar» desaparecía sobre el ámbar. Ahora va sobre blanco.
- **3, celular:** la franja de lectura no coincidía con el punto donde se frena la cinta. La llevé
  al centro.
- **Lo más flojo que queda:**
  - En la 3, dos acciones a un minuto (9:40 y 9:41 de Sofía) se pisan en la cinta.
  - En la 2 del celular, una persona con una sola acción deja mucho vacío.
  - En la 1 del celular, los tres números ocupan alto que la lista necesitaría.

## Catálogo de ideas

Cada una se puede tomar o descartar sola. «Toques» compara con abrir el filtro, elegir y volver.

1. **Números que filtran.** Hoy, rechazos y lo que borró o sacó, arriba, como tarjetas que se
   tocan. Resuelve «¿pasó algo raro hoy?» de un vistazo. En la 1. Patrón de Stripe (los totales
   del tablero que filtran la lista). Ahorra 3 toques. Fuera de las reglas: sí, suma un resumen.
2. **El día en una tira.** Una raya por acción en la hora en que pasó, roja o ámbar si importa.
   Muestra los huecos y los picos del día, y cada raya lleva a su acción. En la 1. Patrón de
   Apple Salud (la tira del día). Ahorra el desplazamiento hasta esa hora. Fuera de las reglas:
   sí.
3. **Filtros como pastillas con su valor.** «Hecho por Graciela» con su tecla; puesta, va en pino.
   Se ve qué está filtrado sin abrir nada. En la 1, y como período en la 2. Patrón de Linear.
   Igual de toques, más claro. Dentro de las reglas.
4. **Lista agrupada por día con encabezado fijo.** «Hoy, miércoles 4 de noviembre · 20 acciones».
   Ordena el tiempo sin repetir la fecha en cada renglón (E22). En la 1. Patrón de Apple Wallet.
   Dentro de las reglas.
5. **El detalle siempre abierto (computadora).** El detalle cambia mientras se recorre con ↑ ↓.
   Se lee una acción tras otra sin abrir ni cerrar nada. En la 1. Patrón de Linear y Mail.
   Ahorra 2 toques por acción. Fuera de las reglas: R4.7 dice «al tocar».
6. **Antes → después tachado.** Lo que había, tachado en gris; lo que quedó, en negrita; «ya no
   está» en rojo. Dice qué cambió sin leer una frase. En las tres. Patrón de GitHub (diff), en
   palabras. Dentro de las reglas (R2.5).
7. **Desde dónde en tres renglones.** Dispositivo, navegador y dirección, cada uno con su ícono.
   En las tres. Patrón de la seguridad de la cuenta de Google. Dentro de las reglas (R2.6).
8. **Personas tocables en el texto.** El nombre subrayado en el texto de la acción filtra o lleva
   a esa persona (E33), y lleva el «(hoy: …)». En las tres. Patrón de Slack (las menciones).
   Ahorra 3 toques. Dentro de las reglas.
9. **El color en la raya y en la hora, no en el texto.** Rojo y ámbar en la raya y en la hora;
   el texto queda en negro. Calma con significado. En la 1. Patrón de Linear (prioridad). Dentro
   de las reglas.
10. **«Actualizar» que muestra qué llegó.** Lo nuevo entra con el borde verde y una tostada «1
    acción nueva». Se ve qué cambió desde que se miró. En las tres. Patrón de Twitter («ver 1 post
    nuevo»). Dentro de las reglas (R4.6).
11. **Vacío que ofrece la salida.** «No hay acciones con esos filtros» con «Sacar filtros» en el
    mismo lugar. En la 1. Dentro de las reglas (E29).
12. **Rango de días en dos toques.** «Desde y hasta» como atajos ya armados dentro del menú de
    fecha. En la 1. Patrón de Google Analytics. Dentro de las reglas.
13. **La gente como pantalla de entrada.** Una tarjeta por persona con lo que hizo en el
    período. Responde «qué hizo tal» sin filtrar. En la 2. Patrón de Contactos y Tiempo de uso de
    iPhone. Ahorra 3 toques. Fuera de las reglas: R4.2.
14. **Puntos de color por persona.** Un punto por acción (relleno, lo que hizo; hueco, lo que le
    hicieron), rojo o ámbar si importa. Quién tuvo un día raro se ve sin leer. En la 2. Patrón de
    GitHub (la grilla de aportes). Fuera de las reglas: sí, suma.
15. **Lo que hizo y lo que le hicieron, en dos columnas.** «Hecho por» y «Hecho a» a la vez, de la
    misma persona. En la 2. Patrón de los movimientos de una cuenta bancaria (débitos y créditos).
    Ahorra 4 toques. Fuera de las reglas: es una vista que no está.
16. **«Alguien sin entrar» como una persona más.** Los intentos de afuera tienen su tarjeta, arriba
    y en ámbar, en vez de ser un tipo dentro de un filtro. En la 2 (y como fila en la 3). Patrón
    de la bandeja de spam como carpeta propia. Ahorra 3 toques. Fuera de las reglas: sí.
17. **Saltar de persona en persona.** Tocar un nombre lleva a esa persona y «volver» dice a quién;
    en el celular se apilan como en iPhone. Se sigue un hilo («Graciela le sacó el rol a Martín…
    ¿y qué más le hicieron a Martín?»). En la 2. Patrón de Ajustes de iPhone y Wikipedia. Fuera
    de las reglas: es otra navegación.
18. **Período en segmentos.** Hoy, Ayer, Semana y Mes como cuatro segmentos, sin menú; en la
    computadora, con las teclas 1 a 4. En la 2. Patrón de Tiempo de uso de iPhone. Ahorra 2
    toques. Dentro de las reglas, sin «desde y hasta».
19. **La cinta del día.** Una fila por persona, el tiempo en horizontal, un punto por acción. Se ve
    el día entero y quién estuvo activo cuándo. En la 3. Patrón de los grabadores de cámaras de
    seguridad y de los editores de video. Fuera de las reglas: R4.2 a R4.4.
20. **Curvas de quién a quién.** Una curva une a quien hizo la acción con quien la recibió, llena
    la elegida. Se ve al instante a quién tocó cada uno. En la 3. Patrón de los diagramas de
    relaciones de Figma y FigJam. Fuera de las reglas: sí.
21. **Reproducir el día.** El cabezal pasa solo y cada acción se enciende al pasar, con su frase
    abajo. Sirve para contarle a alguien qué pasó, o para entenderlo uno. En la 3. Patrón de las
    repeticiones de Strava y de las cámaras de seguridad. Fuera de las reglas: sí.
22. **El subtítulo.** La acción bajo el cabezal o en la franja se lee entera abajo, grande, sin
    abrir nada. En la 3. Patrón de los subtítulos de video y de Apple Fotos (los recuerdos).
    Ahorra 1 toque por acción. Fuera de las reglas: R4.7 «al tocar».
23. **Aislar una persona.** Tocar su fila deja su vida en primer plano y el resto en 35 %; ← → solo
    recorre lo suyo. Junta «Hecho por» y «Hecho a» en un toque. En la 3. Patrón de los solos de
    pista de GarageBand. Ahorra 3 toques. Fuera de las reglas: sí.
24. **Días con su forma.** Cada día en la tira de días lleva sus barras de color. Se sabe qué día
    tuvo problemas antes de abrirlo. En la 3. Patrón de los selectores de Apple Salud y Tiempo de
    uso. Fuera de las reglas: sí.
25. **La cinta vertical con franja de lectura (celular).** Se pasa con el pulgar y la acción que
    queda en la franja se muestra entera abajo, con una vibración corta en cada una. Los huecos
    largos dicen «2 h sin nada». Toques: cero, se pasa con el dedo. En la 3. Patrón de la rueda
    de selección de iPhone y del desplazamiento de Fotos. Fuera de las reglas: sí, y tapa el marco.
