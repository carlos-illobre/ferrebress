# Usuarios · celular (tercera ronda): «La lista y la tarjeta», tres veces

Carlos eligió en la computadora «La lista y la tarjeta» (`../users-a/final/desktop/`), pero la
versión de esa idea en el celular no le gustó. Acá van tres maneras de llevar al celular la misma
idea, la lista y la tarjeta. Las tres se pensaron desde el principio con dos condiciones:

- «Se perdió un celular» tiene su lugar propio en la pantalla. Carlos aclaró después que no tiene
  por qué ir al lado de «Autorizar a alguien», así que cada variante lo ubica donde mejor sirve.
- Nada se desliza hacia el costado: no hay filtros que se corran, ni filas, ni rieles. Todo entra
  en los 358 px útiles.

Las capturas están lado a lado en `phone-comparison.png`, y cada variante tiene la suya en
`phone/variant-N-*/screenshot.png`. Cada una se abre sola desde su `index.html`. Usan
`../../../../common/` y `../../shared/`: los mismos datos inventados de la primera ronda (nueve
personas, correos `@example.com`), los íconos que se suman, la hoja, la tostada y «Sin conexión».
Todo se mira desde el celular de Rubén, así que su sesión en ese celular y sus huellas no figuran
(R5.2, R5.5).

**Sin conexión (R2.2), en las tres:** si se toca la línea «En línea · todo enviado», la pantalla se
pone gris y aparece el cartel «Sin conexión». Si se toca de nuevo, vuelve sola con la tostada
«Volvió la conexión».

## Las tres ideas

| | La idea en una frase | «Se perdió un celular» | Ideas del catálogo |
|---|---|---|---|
| **1 · Entrar a la tarjeta** (evolución) | La lista es corta y se lee de un vistazo. La tarjeta es una pantalla propia que entra desde la derecha, como en Ajustes del iPhone. Las acciones van en hojas que suben. | Un renglón propio arriba de la lista, con el ícono en rojo y una línea que explica. Abre una hoja: de quién, cuál, Cortar. | 1, 2, 3, 4, 5, 6, 7, 8, 13 |
| **2 · Todo en su lugar** (reinvención) | Nada se abre encima de otra cosa. La tarjeta se despliega dentro de la lista, las confirmaciones aparecen en el mismo renglón y autorizar es escribir el correo abajo, como un mensaje. | Es el otro modo de la misma lista, en un selector de dos partes: «Personas» y «Se perdió un celular». En ese modo, cada celular de cada persona tiene su «Cortar» a la vista: dos toques en total. | 1, 3, 5, 6, 9, 10, 11, 12, 13 |
| **3 · Arriba la lista, abajo la tarjeta** (audaz) | Es la computadora, pero de pie: la lista arriba y la tarjeta siempre abierta abajo, con un asa que se arrastra para darle más lugar a una o a la otra. Tocar a alguien cambia la tarjeta al instante, sin ir y volver. | Una pastilla roja en la cabecera, junto al título. Al tocarla, la lista de arriba muestra solo a quienes tienen un celular para cortar y la tarjeta de abajo muestra sus celulares y «Cortar». Al terminar, un tilde que se dibuja. | 1, 3, 5, 6, 13, 14, 15, 16, 17, 18 |

## Cuál me gusta más

**La 2, «Todo en su lugar».** Es la que mejor resuelve el caso urgente. Con el celular robado y
apuro, se toca «Se perdió un celular» y aparecen todos los celulares que se pueden cortar, cada uno
con su botón. Son dos toques, y no hay que elegir a la persona primero ni confirmar nada. Además,
nunca se pierde de vista dónde se está: la tarjeta se abre en el renglón y se cierra en el mismo
lugar. Autorizar, que es lo que más se hace, queda siempre abajo, bajo el pulgar, en una línea.

La 1 es la apuesta segura: cumple todas las reglas tal cual y es la que más se parece a la
computadora. La 3 es la que más se parece a la computadora en la forma (lista y tarjeta a la vez),
pero en 844 px las dos mitades quedan justas.

## Qué rompe cada una

- **1:** nada de las reglas. «Se perdió un celular» va arriba de la lista y no abajo junto a
  «Autorizar a alguien», como permitió Carlos.
- **2:**
  - Las pestañas Usuarios · Auditoría del marco (R2.1) se cambian por un botón «Auditoría» en la
    cabecera. Así, el selector de dos partes de la pantalla es el único que hay y no quedan dos
    filas de segmentos.
  - El botón del espejo queda solo con el ícono, para que entre «Auditoría».
  - En el modo «Se perdió un celular» no se elige primero a la persona y después el celular, como
    dice R5.7. Se ven todos los celulares de todas las personas, cada uno con su «Cortar». El
    resultado es el mismo y E32 se cumple: el otro celular de Martín sigue como estaba.
  - Autorizar no tiene un diálogo. El nombre aparece debajo del correo recién cuando se empieza a
    escribir.
- **3:**
  - **El renglón de la lista** no muestra la pastilla «Administrador» y dice «3 d» en lugar de
    «Entró hace 3 días» (R3.1). Las dos cosas están completas en la tarjeta de abajo, que siempre se
    ve.
  - **Las pestañas:** Auditoría pasa a un enlace en la línea de conexión, y el botón del espejo
    desaparece.
  - **La acción principal no está abajo:** «Autorizar a alguien» es el primer renglón de la lista.
    Al tocarlo, la tarjeta de abajo se vuelve el formulario, y el único botón naranja es su
    «Autorizar».
  - **Se arrastra un asa,** un gesto nuevo, aunque vertical: se puede usar la pantalla sin
    tocarlo.

## Cómo se mueve (una línea por interacción)

- **Apretar un renglón o un botón:** baja a 97 % y vuelve (120 ms). Al elegir, el celular vibra
  10 ms.
- **Abrir la tarjeta (1):** entra desde la derecha en 320 ms y la lista se corre un 30 % hacia
  atrás y se apaga un poco. Con ‹ Usuarios vuelve. Al bajar, el nombre aparece en la barra de
  arriba. Se siente como el iPhone.
- **Desplegar la tarjeta (2):** el contenido baja 6 px con fundido y la flecha gira 90°. Los
  renglones de abajo se corren. Se siente como abrir un cajón.
- **Cambiar de persona (3):** la tarjeta de abajo cambia con un fundido y sube 6 px (200 ms), y el
  borde del renglón elegido pasa a pino. Se siente como hojear.
- **Cambiar de modo (2):** la lista hace un fundido corto (120 ms) y el segmento elegido se pinta.
- **Cerrar una sesión, quitar una huella o cortar un celular:** el renglón se corre 24 px a la
  derecha y se desvanece. Después aparece la tostada y el celular vibra 10-40-10.
- **Cortar (3):** el tilde verde se dibuja en 300 ms y la persona queda «Cortado» en la lista.
- **Autorizar (las tres):** la persona nueva entra desde 8 px abajo con un rebote corto, y su
  borde (o su fondo, en la 2) se pinta de verde un segundo.
- **Error en el correo:** el campo se pone rojo y el aviso aparece al lado, sin perder lo escrito.
- **Hojas (1):** suben desde abajo en 320 ms y el fondo se oscurece al 30 %. Se cierran con
  Cancelar, tocando afuera o con Escape.
- **Confirmar en el lugar (2 y 3):** el recuadro rojo suave aparece en su lugar con un fundido, y la
  lista se corre para que se vea entero.
- **Arrastrar el asa (3):** la línea entre la lista y la tarjeta sigue al dedo, y al soltarla el
  celular vibra 10 ms.
- **Reducir movimiento:** nada se mueve. Los cambios son instantáneos.

## Autocrítica (lo que corregí antes de mostrar)

- **Todas:** una hoja escondida tomaba el foco al cargar y corría la pantalla hacia abajo. Ahora el
  foco va solo cuando la hoja se abre.
- **1:**
  - La tarjeta repetía los números de sesiones y huellas en dos cajas y otra vez en los títulos
    de sección. Saqué las cajas.
  - La línea de «Se perdió un celular» ocupaba dos renglones; la acorté.
- **2:**
  - Con dos partes iguales, «Se perdió un celular» se partía en dos líneas. Ahora la parte de
    «Personas» es más angosta y el texto entra en una.
  - Los contadores se caían a un cuarto renglón; los subí a la línea del nombre.
  - La tarjeta desplegada tenía una sangría de 66 px y partía los nombres de los dispositivos;
    ahora usa todo el ancho.
  - La confirmación quedaba escondida bajo la línea de autorizar; ahora la lista se corre para
    mostrarla.
- **3:** después de cortar, la persona decía «0 celulares»; ahora dice «Cortado» en verde.
- **Lo más flojo que queda:**
  - En la 2, la lista tiene renglones de tres líneas, y con la tarjeta abierta se ve poco más que
    esa persona.
  - En la 3, la tarjeta de abajo tiene unos 360 px: con tres sesiones y una huella hay que bajar
    adentro de ella.

## Catálogo de ideas

Cada idea está suelta: se puede tomar o descartar sin rearmar nada. Los toques se cuentan contra
la final de la primera ronda (`../users-a/final/phone/`).

1. **Ningún filtro que se deslice.** Los grupos «Pueden entrar» y «Dados de baja», con su número,
   reemplazan los cuatro filtros. Con nueve personas, el filtro no ahorra nada.
   - Variantes: 1, 2 y 3.
   - Viene de: Contactos del iPhone.
   - Está dentro de las reglas: R3.1 deja los filtros al diseño.
2. **Tres números en una sola tarjeta partida:** pueden entrar, sesiones y con huella, en una
   franja de 76 px.
   - Variantes: 1. En la 3 van como texto junto al título de la lista.
   - Viene de: Salud del iPhone.
3. **El renglón compacto:**
   - Primera línea: el nombre, «Vos» y, a la derecha, los contadores de sesiones y huellas.
   - Segunda línea: el correo.
   - Tercera línea: Administrador y cuándo entró.
   - Entran cinco personas en lugar de tres.
   - Variantes: 1 y 2. La 3 lo lleva a dos líneas.
   - Está dentro de las reglas.
4. **«Se perdió un celular» como renglón propio arriba de la lista,** con el ícono en un círculo
   rojo suave y una línea que explica.
   - Qué resuelve: se encuentra sin pensar, y no compite con el botón naranja.
   - Variantes: 1.
   - Viene de: Ajustes del iPhone, con «Buscar mi iPhone» como renglón propio.
5. **El alta que nunca entró, con su avatar punteado en ámbar,** «Todavía no entró» y, en la
   tarjeta, «Avisale que entre con Google» y «Borrar, fue un error».
   - Variantes: 1, 2 y 3.
   - Viene de: Shopify, con la invitación pendiente.
6. **La dada de baja se distingue sin leer:** renglón punteado, avatar gris con ⊘ y «De baja» junto
   al nombre. «Administrador» queda en gris.
   - Variantes: 1, 2 y 3.
   - Está dentro de las reglas (R3.1).
7. **La tarjeta como pantalla propia que entra desde la derecha,** con el nombre que pasa a la barra
   de arriba al bajar.
   - Variantes: 1.
   - Viene de: Ajustes del iPhone.
8. **La confirmación en una hoja que lista lo que va a pasar,** con los números de esa persona.
   - Variantes: 1.
   - Viene de: GitHub, al borrar un repositorio.
9. **La tarjeta desplegada en el lugar,** como un acordeón: una abierta por vez, y la flecha gira.
   - Toques: abrir y cerrar cuentan lo mismo, pero no se pierde la lista.
   - Variantes: 2.
   - Viene de: Recordatorios del iPhone.
10. **La confirmación en el mismo renglón:** un recuadro rojo suave con lo que va a pasar y
    «Cancelar · Dar de baja», sin velo ni hoja.
    - Variantes: 2 y 3.
    - Viene de: Linear.
11. **Autorizar en una línea abajo,** como escribir un mensaje. El nombre aparece al empezar a
    escribir el correo, y Enter o la flecha autorizan.
    - Toques: de 4 a 2.
    - Variantes: 2.
    - Viene de: iMessage, y de la idea 12 de la primera ronda.
12. **«Se perdió un celular» como el otro modo de la lista.** Se ven todos los celulares que se
    pueden cortar, agrupados por persona, cada uno con su «Cortar».
    - Toques: de 4 (botón, persona, celular, Cortar) a 2.
    - Variantes: 2.
    - Viene de: Buscar del iPhone, con la pestaña Dispositivos.
    - **Va contra el orden de R5.7** (persona y después celular). El resultado es el mismo.
13. **Lo que se cortó, a la vista:**
    - En la 1, una tostada con el nombre y qué se cortó («se cerró su sesión y se le quitó la
      huella»).
    - En la 2, el celular cortado queda en su lugar con un tilde verde.
    - En la 3, una tarjeta de listo con el tilde que se dibuja.
    - Variantes: 1, 2 y 3.
    - Está dentro de las reglas (R5.7: «Muestra qué cortó»).
14. **La pantalla partida, con la lista arriba y la tarjeta abajo, siempre abierta.**
    - Toques: ver a otra persona pasa de 2 (‹ y renglón) a 1.
    - Variantes: 3.
    - Viene de: Mapas del iPhone, con la hoja a media altura, y de la computadora de Ferrebress.
15. **El asa que reparte la pantalla:** se arrastra para darle más lugar a la lista o a la
    tarjeta.
    - Variantes: 3.
    - Viene de: Mapas del iPhone y del iPad, con Split View.
16. **«Autorizar a alguien» como el primer renglón de la lista,** punteado en naranja. La tarjeta
    de abajo se vuelve el formulario.
    - Qué resuelve: libera la barra de abajo para la pantalla partida.
    - Variantes: 3.
    - Viene de: Contactos de Android, con «Crear contacto» arriba de la lista.
    - Está **fuera del marco:** la acción principal no está abajo.
17. **«Se perdió un celular» como pastilla roja en la cabecera.** Se vuelve roja llena con «Volver
    a la lista» mientras está activa.
    - Variantes: 3.
    - **Está fuera del marco:** reemplaza el botón del espejo.
18. **La lista que se filtra sola para el caso urgente:** arriba quedan solo quienes tienen un
    celular para cortar, cada uno con «1 celular» o «2 celulares». La primera persona ya viene
    elegida.
    - Toques: de 4 a 2 o 3.
    - Variantes: 3.
    - Está dentro de las reglas (R5.7).
