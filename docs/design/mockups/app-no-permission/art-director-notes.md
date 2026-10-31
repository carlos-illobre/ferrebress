# Sin permiso: tres maquetas para Carlos

Lo que ve quien abre algo que sus roles no le dejan usar (02 · R7.7) o quien pierde el permiso
mientras lo usa (02 · R7.8). Capturas: `desktop-comparison.png` y `phone-comparison.png` (columnas:
las tres variantes; arriba, «Por la dirección»; abajo, «Lo perdió usándola»). Cada variante tiene
`screenshot.png` (por la dirección) y `screenshot-lost.png` (lo perdió usándola).

**El caso de la maqueta** se elige con la lengüeta oscura de arriba a la derecha (en el celular,
arriba de todo), que no es parte del diseño: «Por la dirección», «Lo perdió usándola» y «Repetir».
También se abre directo con `#direccion` o `#perdido` al final de la dirección.

**Los datos:** Matías Quiroga es vendedor (rol Vendedor). Abre `ferrebress.com.ar/users` con un
enlace que tenía guardado; le falta «Ver las personas», que tienen Administrador, Encargado de turno
y Oficina y personal (7 personas). En el otro caso estaba en Usuarios cuando Graciela Benítez le
sacó «Encargado de turno»; tenía una venta a medias en Vender (3 renglones, $ 48.000), que no se
pierde. Su primera opción es Vender. Lo que hay detrás (Usuarios, Vender) es neutro: renglones
grises, para no diseñar otras pantallas.

## Las variantes

| | Idea en una frase | Ideas del catálogo |
|---|---|---|
| **1 · La puerta que explica** | La regla llevada al nivel de las referencias: una sola tarjeta, en el lugar de la pantalla, que dice qué falta, para qué sirve, quién lo tiene (los roles y sus caras), quién te lo puede dar y un botón naranja a Vender (Enter). Si lo pierde usándola, un diálogo (en el celular, una hoja) dice quién se lo sacó, qué tenía y qué le queda, que su venta sigue, y lo lleva solo a Vender en 5 segundos. | 1, 2, 3, 4, 6, 7, 8, 18, 20 |
| **2 · Te dejo en lo tuyo** | No hay pantalla de «sin permiso»: la aplicación abre directo lo primero que puede usar y explica en un pase que baja arriba de la pantalla (en el celular, una isla como una notificación). El pase se abre para ver quién lo tiene, quién te lo da y un mapa chico de lo tuyo. Si lo pierde usándola, Usuarios se va hacia la derecha, la opción se pliega en el menú y Vender llega con el pase. | 1, 2, 3, 4, 7, 8, 9, 10, 11, 12, 13, 19 |
| **3 · El llavero** | La pantalla entera es una pieza, oscura y sin menú: tus permisos son llaves en un llavero y la que falta es un hueco naranja punteado. Debajo, quién la tiene y «Mantené para pedirla», que le avisa a quien te la puede dar; a la derecha (abajo en el celular), las puertas de lo que sí podés abrir, con un número cada una. Si lo pierde, lo que usaba se hunde, la llave se suelta del aro y se cae, y la puerta de Vender cuenta 6 segundos y entra sola. | 1, 2, 3, 5, 6, 7, 8, 14, 15, 16, 17, 19, 20 |

**Mi preferida: la 2, Te dejo en lo tuyo.** El que llega acá casi nunca quiere Usuarios: tocó un
enlace viejo o lo sacaron de un rol, y tiene un cliente adelante. La 2 es la única que no lo frena
nunca: cero toques, ya está donde puede trabajar, con su venta intacta, y la explicación queda
arriba para quien la quiera leer (y se va sola a los 8 segundos si es una pérdida). Le sumaría de
la 1 «Copiar el pedido» con quién te lo puede dar (ya está en el pase abierto), y de la 3 la idea
de pedirlo desde la aplicación si Carlos quiere que exista un pedido de acceso. La 1 es la apuesta
segura: cumple la regla al pie de la letra y es la más clara para quien llega por primera vez.

## Movimiento, por interacción

- **1 · Llegar a «No tenés permiso»:** la tarjeta entra con un fundido de 8 px y el arco del
  candado cae y se sacude dos veces (1,6 s, con rebote). Se siente como tocar una puerta cerrada,
  sin alarma.
- **1 · «Ya no tenés permiso»:** a los 1,4 s («el próximo pedido») el fondo se oscurece al 30 % y el
  diálogo sube 12 px con fundido; el anillo pino se vacía en 5 s (en el celular, el botón naranja se
  llena de izquierda a derecha). Se siente que hay tiempo para leer pero que nadie tiene que hacer nada.
- **1 · Ir a Vender:** la venta entra desde 8 px abajo y su borde se pinta de verde 1 s; aparece la
  tostada «Usuarios ya no está en Más». Confirma que lo escrito sigue ahí.
- **2 · Abrir por la dirección:** Vender llega desde la izquierda (320 ms) y el pase baja 16 px desde
  las pestañas con rebote. En el celular, la isla cae desde la barra de estado como una notificación
  y vibra 10 ms.
- **2 · «Ver quién»:** el pase crece hacia abajo y su contenido aparece con un fundido de 6 px; la
  flecha gira 180°. Alt Q lo abre y Esc lo cierra.
- **2 · Perderlo usándola:** Usuarios se corre 48 px a la derecha y se apaga (como volver atrás en
  el iPhone), la opción «Usuarios» bajo Más se pliega hacia arriba, Vender entra desde la izquierda.
  El pase trae una línea pino que se acorta en 8 s (se detiene con el mouse encima o abierto).
- **2 · Isla del celular:** se arrastra hacia arriba con el dedo, se va apagando, y pasados 40 px se
  cierra; si no, vuelve con rebote. Tocarla la abre.
- **3 · Llegar:** las llaves cuelgan una por una (70 ms entre una y otra, con rebote), el llavero se
  balancea apenas (±1,5°, 6 s) y el hueco late suave. Se siente vivo, como algo que se tiene en la mano.
- **3 · Perderlo:** lo claro de Usuarios se hunde al 94 % y se apaga; la llave «Ver las personas» se
  sacude, se suelta y cae girando 70° fuera de la pantalla (1,1 s); el hueco punteado aparece en su
  lugar. En el celular, vibración 10-40-10.
- **3 · Mantené para pedirla:** el botón se llena de blanco en 900 ms mientras se mantiene (P en el
  teclado); si se suelta antes, se vacía. Al completarse, vibra y aparece «Se la pediste a Rubén y a
  Graciela». Un toque sin querer no manda nada.
- **3 · Entrar por una puerta:** la puerta crece al 104 % y todo lo demás se achica y se apaga (320 ms)
  antes de ir a la pantalla; las teclas 1 a 4 eligen la puerta, Enter o Esc la primera.

Con «reducir movimiento», nada se mueve.

## Autocrítica

Lo que estaba flojo en la primera vuelta y corregí antes de entregar:

- **1, computadora:** la tarjeta se salía por abajo y sus renglones se pasaban del borde (la dirección
  abierta, al lado de los botones, empujaba la columna). La dirección pasó debajo del título y la
  tarjeta quedó entera en 768 px.
- **3:** las llaves colgaban de un solo punto, se tapaban entre sí y el hueco quedaba detrás. Ahora
  cada una cuelga de su lugar en el aro y sale hacia afuera; el hueco va adelante, con un trazo más
  claro y una etiqueta «Falta: Ver las personas».
- **3, celular:** las puertas (lo que la persona quiere hacer) quedaban debajo del pliegue. Subieron
  arriba de «La tienen»; pedir la llave queda al bajar.
- Los textos del celular se resumieron («Falta «Ver las personas»», «Te lo dan Rubén o Graciela»).

Lo que sigue flojo: en la 2, el mapa chico cuenta opciones por parte («1 de 3») que dependen de
permisos de capítulos que todavía no existen; en la 3, las llaves propias («Vender», «Ver
productos», «Ver el stock») son permisos de ejemplo de otros capítulos. En la 3 de la computadora,
la lengüeta de la maqueta tapa la ayuda de teclas de arriba a la derecha.

## Qué contradice una regla o queda fuera del capítulo

- **1 · La puerta que explica:** nada contradice. Suma, fuera de la regla: las caras de quienes
  tienen cada rol (R7.7 pide los roles), «Te lo puede dar» (quienes tienen «Administrar roles»),
  «Copiar el pedido», la dirección que abrió, y en «Ya no tenés permiso» quién se lo sacó y qué roles
  tenía y tiene (sale de la auditoría), y la cuenta regresiva de 5 s antes de ir a la primera opción.
- **2 · Te dejo en lo tuyo:** **contradice R7.7**: no hay pantalla con el mensaje y el botón; abre
  directo la primera opción y el mensaje va en un pase encima (el texto de R7.7 está, entero). La
  dirección cambia sola a la de Vender. Suma, fuera: el mapa de lo tuyo, la opción que se pliega en
  el menú, la isla que se cierra con el dedo, quién se lo sacó.
- **3 · El llavero:** **rompe el lenguaje visual y el marco**: fondo pino lleno en toda la pantalla
  (el lenguaje deja lo oscuro solo para la cámara, la tostada y escanear), sin menú ni pestañas, el
  naranja en un dibujo grande, un título de 40 px. **Contradice R7.7** en que ofrece varias opciones
  (las puertas) y no un solo botón a la primera (la primera sigue destacada, con Enter). **Suma una
  funcionalidad que no existe**: pedir un permiso desde la aplicación, que avisa a quien tiene
  «Administrar roles» y queda esperando (alcance nuevo: avisos, pedidos pendientes, auditoría). Muestra
  los permisos propios como llaves, con permisos de otros capítulos de ejemplo.

## Catálogo de ideas

Toques de la tarea más frecuente (entender por qué no entra y seguir trabajando): con la regla,
leer y un toque («Ir a…»); al perderlo usándola, la regla ya lo lleva solo.

| # | Idea | Qué resuelve | Variantes | Patrón de | Toques | ¿Fuera de las reglas? |
|---|---|---|---|---|---|---|
| 1 | El permiso que falta, con su explicación de R7.1 («Deja abrir Usuarios: la lista…») | Entender qué es eso que falta, no solo su nombre | 1, 2, 3 | Google Drive, «Necesitás acceso» | — | No (suma la explicación) |
| 2 | «Lo tienen»: los roles con las caras de sus personas | Saber a quién preguntarle sin ir a buscar | 1, 2, 3 | Notion y Figma, quién tiene acceso | Ahorra ir a preguntar | Sí: la regla pide los roles, no las personas |
| 3 | «Te lo puede dar»: quienes tienen «Administrar roles» | Quien lo tiene no siempre lo puede dar | 1, 2, 3 | Google Drive, «Pedile al propietario» | Ahorra una consulta | Sí |
| 4 | «Copiar el pedido» (en el celular, compartir): un texto listo para WhatsApp | Pedirlo sin escribir nada | 1, 2 | Google Docs, «Solicitar acceso» | De escribir un mensaje a 1 toque | Sí |
| 5 | «Mantené para pedirla»: el pedido sale desde la aplicación y avisa a quien lo puede dar | Pedirlo sin salir de Ferrebress y sin pedirlo por error | 3 | Figma y Drive (pedir acceso); mantener para confirmar de Apple | 1 gesto | Sí: funcionalidad nueva |
| 6 | Cuenta regresiva hacia la primera opción, con «Ir ahora» | Tiempo para leer sin tener que tocar nada | 1, 3 | Apple Pay, cuenta antes de cancelar; Android, «Deshacer» | 0 (o 1 para ir ya) | No: R7.8 dice que va solo |
| 7 | Quién cambió qué: «Graciela te sacó «Encargado de turno»», tenías y tenés | Que no parezca un error de la aplicación | 1, 2, 3 | Slack, «X te sacó de #canal» | — | Sí (sale de la auditoría) |
| 8 | «Tu venta sigue como la dejaste», con renglones y total, y el borde verde al llegar | La tranquilidad de que no se perdió nada | 1, 2, 3 | Apple Notas, borrador guardado | — | No: R7.8 lo garantiza; mostrarlo es extra |
| 9 | Sin pantalla de «sin permiso»: abre lo primero que puede usar y el mensaje va encima | No frenar nunca a quien tiene un cliente adelante | 2 | Linear, un enlace a un equipo ajeno te deja en tu bandeja | 1 → 0 | Sí: contradice R7.7 |
| 10 | El pase plegable: una línea, y «Ver quién» (Alt Q) para lo demás | Lo justo a la vista, el detalle a un toque | 2 | Linear y Stripe, avisos en línea | — | No |
| 11 | Mapa chico de lo tuyo: las cinco partes prendidas o con candado, y lo que pediste punteado | Ver de un vistazo qué podés usar | 2 | Apple, Tiempo de uso; permisos de iOS | — | Sí |
| 12 | La opción perdida se pliega en el menú a la vista | Entender que desapareció, no que se escondió | 2 (computadora) | macOS, el ícono que se va del Dock | — | No: R7.8 actualiza el menú; verlo es extra |
| 13 | La isla del celular: baja como notificación, se tira hacia arriba para cerrarla, se toca para abrirla | El aviso no tapa el trabajo y se va con el pulgar | 2 (celular) | Notificaciones de iOS | — | No |
| 14 | El llavero: los permisos son llaves; la que falta, un hueco punteado | Una metáfora que cualquiera entiende sin leer | 3 | — | — | Sí: rompe el lenguaje |
| 15 | La llave que se suelta y cae al perder el permiso | Ver lo que pasó, no leerlo | 3 | — | — | Sí: rompe el lenguaje |
| 16 | Las puertas: varias opciones que sí puede usar, con las teclas 1 a 4 | Ir directo a donde iba a ir después | 3 | Spotlight y Raycast, resultados numerados | 1 a la que quiera | Sí: R7.7 pide un botón a la primera |
| 17 | «Tus llaves»: la lista de tus permisos | Saber qué podés, no solo qué no | 3 | Apple Wallet, las tarjetas que tenés | — | Sí |
| 18 | El candado que se sacude al llegar | Que se note que es una puerta cerrada, sin alarma roja | 1 | Contraseña equivocada en macOS | — | No |
| 19 | Lo que estabas usando se va (a la derecha o hundiéndose) antes de llegar a lo nuevo | Entender que salió de esa pantalla | 2, 3 | Volver atrás en iOS | — | No |
| 20 | La dirección que abriste a la vista («Abriste ferrebress.com.ar/users») | Entender cómo llegó ahí | 1, 3 | Google Drive | — | Sí |
