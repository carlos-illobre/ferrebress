# El aviso para instalar: tres maquetas para Carlos

Celular, la primera vez que se entra (04 · R4.5, E25 a E27): ofrecer instalar Ferrebress con su
ícono, o dejarlo para otro momento. Cerrado de cualquier forma, no vuelve en ese celular.
Captura de las tres: `phone-comparison.png`; cada carpeta tiene su `screenshot.png` y las de los
otros estados (`-browser`, `-done`, `-after`, `-installed-preview`, `-arrives`, `-open`).

**Lo que hay detrás es neutro:** Vender recién entrado, con renglones vacíos (no se diseña acá). El
pedido de confirmación es el del navegador (otra letra, otro azul: lo dibuja Chrome, no
Ferrebress), simulado. Lo común está en `shared.css`, `shared.js` e `icons-extra.js`.

**La lengüeta oscura de la derecha** es de la maqueta, no del diseño: «Entrar de nuevo» vuelve a
mostrar el aviso, y «El navegador cancela» deja ver qué pasa si la persona cancela en el
navegador.

## Las variantes

| | Idea en una frase | Ideas del catálogo |
|---|---|---|
| **1 · La hoja** | Una hoja que sube sobre Vender, bajo el pulgar, con el inicio del celular en chico y el ícono de Ferrebress ya puesto ahí: se ve cómo va a quedar antes de decidir. «Instalar» naranja grande, «Ahora no» abajo; bajar la hoja o tocar afuera también es «Ahora no». | 1, 2, 3, 4, 5, 6, 7 |
| **2 · La puerta** | No tapa el trabajo: es el último paso de entrar, a pantalla completa, antes de Vender. Un celular en chico muestra, solo, la diferencia: con la barra del navegador y sin ella. Los dos botones también entran: «Instalar y entrar» o «Ahora no, entrar a vender». | 2, 4, 6, 8, 9, 10, 11 |
| **3 · La calcomanía** | No hay ventana: el ícono cae arriba como un objeto, sobre Vender, que se sigue pudiendo usar. Se arrastra hacia abajo hasta el lugar del inicio para instalar, se tira hacia arriba o a un costado para no; tocarlo lo abre con los dos botones. Ignorado, se guarda contra el borde. | 2, 4, 6, 12, 13, 14, 15, 16 |

**Mi preferida: la 2, La puerta.** El aviso llega en el único momento en que nadie está atendiendo:
cuando la persona termina de entrar y todavía no empezó. No tapa una venta ni hay que cerrar nada
para empezar a trabajar: cualquiera de los dos botones la deja en Vender, así que decidir no cuesta
un toque de más. Y es la única que explica sin palabras para qué sirve: la barra del navegador que
desaparece es la ventaja, vista. De la 1 me llevaría el inicio en chico con el ícono ya puesto
(idea 2) para el estado de «listo»; de la 3, guardarse contra el borde si se la ignora (idea 15).

## Qué rompe cada una

- **1 · La hoja:** nada de las reglas. Suma: las dos pastillas de ventaja («Abre al toque»,
  «Pantalla completa») y la tostada que dice dónde está después («Si cambiás de idea, está en Más →
  Configuración»).
- **2 · La puerta:** R4.5 dice «después de entrar» y un aviso; acá es un paso más de entrar, a
  pantalla completa, fuera del marco (como Entrar). Cambia los textos: título «Ferrebress, a un
  toque», detalle con la frase de la regla, y los botones dicen «Instalar y entrar» y «Ahora no,
  entrar a vender». Agrega un paso que la persona tiene que pasar la primera vez (aunque sea un
  toque, el mismo que cerrar el aviso).
- **3 · La calcomanía:** el gesto es la forma principal y no se descubre solo: «Instalar» y «Ahora
  no» solo aparecen al tocar el ícono. La pieza tapa parte del título de Vender mientras está. Si la
  persona la ignora y sigue trabajando, queda guardada contra el borde hasta que salga de Vender:
  hay que decidir si eso cuenta como «cerrado de cualquier forma». El lugar del inicio que aparece
  abajo tapa la barra de acción mientras se arrastra.

**Pregunta para las tres (no está en la regla):** si la persona toca «Instalar» y después cancela en
el pedido del navegador, ¿el aviso cuenta como cerrado? En las maquetas sigue abierto, porque la
persona no lo cerró: lo canceló el navegador.

## Movimiento por interacción

- **Aparece (1):** un instante después de entrar, el fondo se oscurece a 30 % y la hoja sube desde
  abajo (320 ms, `--curva`); el ícono del inicio en chico se asoma cada tanto, 6 px. Se siente como
  una oferta, no una alarma.
- **Bajar la hoja (1):** sigue al dedo y el fondo se aclara con ella; pasados 90 px se va. Como
  cerrar una hoja de iPhone.
- **Instalado (1, 2, 3):** el tilde verde aparece con rebote sobre el ícono y se dibuja (300 ms),
  vibración doble 10-40-10, y la pieza se va sola; la tostada confirma. Sensación de «quedó puesto».
- **La demostración (2):** cada 2,2 s la barra del navegador del celular en chico sube y se va, y la
  aplicación ocupa su lugar; tocar los segmentos la deja quieta en uno. Se entiende sin leer.
- **Entrar (2):** la puerta se va hacia la izquierda con fundido y Vender entra desde la derecha
  (320 ms), como navegar en el iPhone.
- **Cae (3):** la pieza cae desde arriba con un rebote corto y una vibración de 10 ms (si ya se tocó
  la pantalla); la flecha de «Bajala» late hacia abajo.
- **Arrastrar (3):** la pieza sigue al dedo y se inclina según el lado; abajo aparece el lugar del
  inicio, que se pinta de pino y crece 3 % cuando la pieza llega. Al soltarla, el ícono se acomoda en
  el hueco.
- **Tirar (3):** se va volando en la dirección del gesto, girando 18°, y sale con `--curva-salida`.
  Como descartar una tarjeta.
- **Ignorada (3):** a los 10 s se desliza contra el borde derecho y deja ver solo el ícono.
- Con «reducir movimiento», todo aparece y desaparece en el acto y la demostración de la 2 queda
  quieta.

## Autocrítica

- Primera captura de la 2: la barra de estado quedaba tapada por la puerta y el título se partía
  junto al ícono. Ahora la barra de estado se ve, el ícono va arriba del título y el celular en chico
  es más grande.
- Primera captura de la 3: el marco de fondo se desarmaba (el menú de abajo quedaba en el medio), el
  texto de la pieza ocupaba tres líneas y, abierta, «Ahora no» quedaba apretado. Arreglado: el marco
  ocupa todo el alto, el texto es «Bajala para instalar» y los botones van en una fila debajo.
- La tostada larga ocupaba todo el ancho pegada a los bordes; ahora respeta el margen de 16 px.
- Lo más flojo que queda: en la 1, la hoja es correcta pero previsible; en la 3, la pieza sobre el
  título de Vender se ve como algo encima de otra cosa, que es justamente la idea, pero no es calma.

## Catálogo de ideas

1. **Hoja abajo, bajo el pulgar.** Qué es: el aviso es una hoja que sube desde abajo, con «Instalar»
   naranja grande y «Ahora no». Resuelve: se alcanza con una mano, con guantes. Variantes: 1. Patrón:
   hojas de iOS (Apple Pay, compartir). Toques: igual que la regla. Dentro de las reglas.
2. **El inicio en chico con el ícono ya puesto.** Qué es: una ilustración del inicio del celular con
   el ícono de Ferrebress entre otros neutros, con su nombre abajo; al instalar, lleva el tilde.
   Resuelve: entender qué es «instalar» sin leer. Variantes: 1, 2 (el ícono grande), 3 (el hueco del
   inicio). Patrón: la vista previa de «Agregar a inicio» de Safari y Wallet. Toques: ninguno.
   Dentro de las reglas.
3. **Pastillas de ventaja.** Qué es: dos pastillas, «Abre al toque» y «Pantalla completa». Resuelve:
   el porqué en cinco palabras. Variantes: 1. Patrón: App Store. Toques: ninguno. Suma texto que la
   regla no pide.
4. **El pedido del navegador, distinto a Ferrebress.** Qué es: la confirmación de Chrome se ve como
   de Chrome (otra letra, otro azul). Resuelve: que la persona no crea que la aplicación le pregunta
   dos veces. Variantes: 1, 2, 3. Patrón: el propio Android. Toques: ninguno. Dentro de las reglas.
5. **Cerrar arrastrando o tocando afuera es «Ahora no».** Qué es: cualquier forma de cerrar cuenta.
   Resuelve: no hay que buscar el botón. Variantes: 1, 3 (tirar). Patrón: hojas de iOS. Toques: 0
   (un gesto). Dentro de las reglas (R4.5: «de cualquier forma»).
6. **La tostada que dice dónde quedó.** Qué es: al decir «Ahora no», una tostada: «Si cambiás de
   idea, está en Más → Configuración»; al instalar, «Ferrebress quedó con su ícono». Resuelve: el
   miedo a perder la oportunidad, ya que no vuelve. Variantes: 1, 2, 3. Patrón: Gmail («Deshacer»,
   «Movido a…»). Toques: ninguno. Suma texto que la regla no pide.
7. **Listo dentro de la misma hoja.** Qué es: al confirmar, los botones se cambian por «Listo: ya
   está en tu pantalla de inicio» en verde un segundo y la hoja se va sola. Resuelve: confirmación
   sin un toque más. Variantes: 1. Patrón: Apple Pay al pagar. Toques: ahorra el cierre. Dentro de
   las reglas (E26: el aviso se cierra).
8. **El aviso como último paso de entrar.** Qué es: a pantalla completa, antes de Vender, con una
   marca de pasos «Último paso para entrar». Resuelve: no tapa una venta ni el trabajo; llega cuando
   nadie está atendiendo. Variantes: 2. Patrón: la bienvenida de iOS al configurar el iPhone.
   Toques: igual. Fuera de la regla (es un paso, no un aviso sobre la pantalla).
9. **Los dos botones también entran.** Qué es: «Instalar y entrar» y «Ahora no, entrar a vender».
   Resuelve: decidir no cuesta un toque extra; cualquiera lleva al trabajo. Variantes: 2. Patrón:
   Duolingo y Spotify al terminar de registrarse. Toques: ahorra el de cerrar. Cambia los textos de
   la regla.
10. **Antes y después, en vivo.** Qué es: un celular en chico que alterna solo entre «En el
    navegador» (con la barra de dirección) y «Con su ícono» (sin ella); los segmentos lo dejan quieto.
    Resuelve: la ventaja vista, no explicada. Variantes: 2. Patrón: los comparadores de cámara de
    Apple, las vistas previas de Shopify. Toques: ninguno. Fuera de las reglas (suma).
11. **Título propio.** Qué es: «Ferrebress, a un toque» como título, y la frase de la regla como
    detalle. Resuelve: un título que se lee de un vistazo. Variantes: 2. Toques: ninguno. Cambia el
    texto de la regla.
12. **El ícono como objeto.** Qué es: el aviso es el ícono de la aplicación, en una pieza que cae
    desde arriba sin oscurecer nada. Resuelve: no interrumpe; Vender se sigue usando. Variantes: 3.
    Patrón: la isla dinámica del iPhone, las notificaciones de Android. Toques: 0 para seguir
    trabajando. Fuera de la regla (no es un aviso con dos botones).
13. **Arrastrar al inicio para instalar.** Qué es: bajar la pieza hasta un hueco con la casita, que
    aparece abajo bajo el pulgar. Resuelve: el gesto es lo que pasa (ponerla en el inicio). Variantes:
    3. Patrón: arrastrar una app al dock en iPadOS. Toques: 1 gesto en lugar de 1 toque. Fuera de la
    regla.
14. **Tirar para decir que no.** Qué es: lanzar la pieza hacia arriba o a un costado. Resuelve:
    descartar sin buscar un botón. Variantes: 3. Patrón: Tinder, las notificaciones de iOS. Toques: 1
    gesto. Fuera de la regla (no hay «Ahora no» a la vista).
15. **Ignorada, se guarda contra el borde.** Qué es: a los 10 s sin tocarla, se corre a la derecha y
    deja ver solo el ícono; tocarla la trae. Resuelve: no estorba a quien está atendiendo. Variantes:
    3. Patrón: el video flotante de Android e iOS. Toques: ninguno. Fuera de la regla (hay que decidir
    si cuenta como cerrado).
16. **Tocar el ícono abre los botones.** Qué es: el respaldo del gesto: un toque y aparecen
    «Instalar» y «Ahora no». Resuelve: guantes, poca destreza, quien no entiende el gesto. Variantes:
    3. Patrón: las notificaciones de iOS que se expanden. Toques: uno más que la regla. Dentro de las
    reglas.
