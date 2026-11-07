# Más → Configuración · «Lo tuyo» (04 · etapa b): tres maquetas para Carlos

Las capturas están lado a lado en `desktop-comparison.png` y `phone-comparison.png`. Cada variante
se abre sola desde su `index.html`. Usa `../../../../common/` y `../../shared/`, que tiene lo que
comparten las tres: los datos de ejemplo y lo que haría el servidor (`base.js`), el marco, la llave,
la confirmación de «Cerrar todas», la hoja de la huella y las tostadas (`base.css`), y los íconos de
Lucide que se suman (`icons-extra.js`). Cada variante tiene su `vN.css` y su `vN.js`.

**Funcionan de verdad:** el nombre se escribe, se guarda, avisa si se repite («Compu del mostrador»
ya existe) y no deja pasar de 30 letras; «Cerrar», «Quitar», «Se me perdió» y «Cerrar todas» cortan
lo que dice la regla, y lo que cae se va de la pantalla. Quitar la huella del celular que tenés en la
mano te deja adentro y aparece «Vincular este celular con mi huella», que simula el pedido del
sistema. Apagar las animaciones (en la parte de arriba o en las pastillas) apaga todo el movimiento.

**Botón «Casos»** (abajo a la derecha, punteado; no es parte del diseño): sin conexión (R10), y en el
celular la huella de este celular: la mía, ninguna o la de otra persona (R6.3). «Volver a empezar»
restituye los datos.

**Los datos:** Rubén Paredes tiene «Celu de Rubén» (huella y sesión; con su código entró «Compu del
mostrador»), «Motorola viejo» (huella y sesión; con su código entró una notebook sin nombre, «Chrome
en macOS») y esta computadora sin nombre («Chrome en Windows»). En la computadora se mira desde la
computadora; en el celular, desde «Celu de Rubén».

## Las tres ideas

| | La idea en una frase | Ideas del catálogo |
|---|---|---|
| **1 · La lista** (evolución) | La pantalla aprobada de la etapa a, con las preferencias en chico a la izquierda y «Lo tuyo» a la derecha en tres tarjetas: el nombre (un campo con ideas), mis celulares con huella y mis sesiones, con la misma pieza de renglón que la tarjeta propia de Usuarios. «Se me perdió» va en el renglón de cada celular y deja un recibo rojo con lo que cortó. | 1, 2, 3, 4, 5, 6, 7 |
| **2 · Por dispositivo** (reinvención) | No hay una lista de huellas y otra de sesiones: cada dispositivo es una tarjeta con lo suyo (sesión y huella como fichas con su ×) y, colgadas debajo, las computadoras que hizo entrar con su código. Este dispositivo está dibujado a la izquierda con su nombre en la pantalla y sus preferencias. Al apuntar «Se me perdió», todo lo que se va a cortar se pone rojo antes de tocar. | 2, 3, 6, 8, 9, 10, 11, 12 |
| **3 · El tablero de llaves** (audaz) | Sin marco: un tablero perforado de ferretería con una llave por dispositivo, su rótulo de cinta en relieve y sus sellos de goma («En uso», «Huella»). Se baja tirándola hacia abajo; un celular cae con las computadoras que cuelgan de él. Tocada, se da vuelta y muestra cada acción suelta. La que tenés en la mano es este dispositivo: el nombre se escribe con una rotuladora, letra por letra, y se «corta la cinta». | 3, 9, 13, 14, 15, 16, 17, 18 |

## Cuál me gusta más

**La 2, con el recibo de la 1 (6) y la rotuladora de la 3 como forma de mostrar el nombre (15, solo
la cinta, no el tablero).** El problema real de «Lo tuyo» es que «Se me perdió», «Quitar» y «Cerrar»
cortan cosas distintas y no se ve cuáles: la regla dice que perder un celular cierra además las
computadoras que hizo entrar con su código, y en una lista por tipo eso no se ve en ningún lado. En
la 2 el árbol ya lo dibuja (el celular y, colgadas, sus computadoras), y apuntar el botón lo pinta de
rojo antes de tocar: es la confirmación sin ventana que pide la constitución. Además junta en una
tarjeta lo que la persona piensa como una cosa («mi Motorola»), en vez de partirlo en dos listas.
La 1 es la más segura y la que menos se aprende, pero repite el mismo celular en dos listas. La 3
es la que más se disfruta y la más de ferretería, pero el gesto de tirar hay que descubrirlo y las
acciones sueltas quedan a dos toques.

## Movimiento, por interacción

- **Cerrar una sesión (1, 2):** el renglón o la ficha se desliza 24 px y se funde (200 ms, sale);
  la lista se acomoda. Se siente que se fue, no que se rompió.
- **Se me perdió (1):** los renglones que se cortan salen en cascada (40 ms entre uno y otro) y el
  recibo rojo entra con un rebote corto; vibra 10-40-10 ms.
- **Se me perdió (2):** al apuntar, las fichas y las computadoras colgadas se tiñen de rojo y aparece
  «Se cierra / Se quita» con un rebote; al tocar, caen 18 px girando 4° y se funden, una tras otra.
- **Tirar una llave (3):** sigue al dedo con resistencia pasados 110 px, se inclina hacia donde va la
  mano y, pasada la línea, se marca en rojo con «Soltá para bajarla». Suelta antes, vuelve al gancho
  con rebote; suelta después, cae fuera de la pantalla girando (560 ms) y sale el recibo impreso.
- **Darla vuelta (3):** giro de 180° sobre su eje (520 ms). Al pasar el mouse, la llave se hamaca
  colgada del gancho.
- **El nombre (2):** cada letra que se escribe aparece en la pantalla del dibujo con un latido; al
  guardar, un brillo cruza la pantalla. **(3):** cada letra se estampa en la cinta (crece y se asienta
  en 180 ms); al cortar la cinta, se sacude.
- **Guardar el nombre (1):** el borde de la tarjeta late una vez en verde.
- Con las animaciones apagadas o «reducir movimiento», todo pasa en el acto.

## Autocrítica

- Primera captura: en la 3 las caras de las llaves se veían como círculos de 22 px (chocaban con la
  pieza del avatar) y la llave de la mano se salía por la derecha; en la 2 las preferencias no
  marcaban lo elegido y el dibujo del celular ocupaba media pantalla en el celular; en la 1 la fila
  de la hora se partía en dos líneas y «Borrar» flotaba solo. Corregido: la llave se arma de nuevo,
  la tarjeta de la mano tiene su ancho, el dibujo del celular va al costado de los botones, la columna
  de las preferencias es más ancha y «Borrar» es una × dentro del campo.
- Lo más flojo que queda: en la 3 un nombre largo se corta en la cinta de una llave chica
  («COMPU DEL MOSTRA…»); en la 1, en la computadora, «Mis sesiones» queda abajo y hay que desplazar.
  En la 2 el dibujo del monitor tiene marco oscuro: es una ilustración chica, pero es negro.

## Qué contradice una regla o queda fuera del capítulo

- **1:** nada de fondo.
  - Las preferencias de la etapa a pierden la muestra de la animación y las fichas de la hora, que
    están en la maqueta aprobada: quedan en un renglón cada una para darle lugar a «Lo tuyo».
  - Un celular con huella y sesión aparece en las dos listas: «Se me perdió» va solo en su renglón de
    huellas; en sesiones solo lleva «Cerrar».
  - El recibo rojo después de cortar no está en la regla (R8.1 pide que «diga qué cortó»: lo dice
    también la tostada).
- **2:**
  - **«Lo tuyo» no existe como grupo** (R1.8): el nombre y la huella de este dispositivo van con sus
    preferencias, y lo de los otros en «Tus otros dispositivos». Las huellas y las sesiones no son
    dos listas sino fichas de cada dispositivo (R6, R7 se cumplen, con otra forma).
  - **No es la misma pieza que la tarjeta propia de Usuarios** (R6, «la misma pieza en los dos
    lugares»): si se elige, Usuarios tendría que cambiar igual.
  - Las computadoras que entraron con el código de un celular cuelgan de él; las de este celular,
    del dibujo. Las preferencias se resumen («Hora», «Con su ícono»).
- **3 (lo que rompe):**
  - **El marco:** sin menú lateral, sin menú de abajo, sin la tarjeta del vínculo; solo una × para
    volver a Más. La conexión es una pastilla al pie.
  - **Bajar una llave hace cosas distintas:** un celular, lo de «Se me perdió» (todo); una
    computadora, cierra su sesión. Las acciones sueltas («Cerrar la sesión», «Quitar la huella»)
    están en el dorso: dos toques en vez de uno.
  - **«Se me perdió» es un gesto, no un botón a la vista** (R8.1 pide un toque); el botón está en el
    dorso.
  - Se llama «Tus llaves», no «Lo tuyo»; «Cerrar todas» es «Bajar todas».
  - **El lenguaje visual:** el tablero tiene fondo propio (perforado), las cintas son pino lleno con
    letras en mayúscula, y los sellos van en mayúscula y torcidos.
  - Las preferencias de la etapa a son pastillas al pie que se tocan para cambiar; sin explicación de
    cada una (R1.2).

## Catálogo de ideas

1. **La pieza de renglón de dispositivo**, igual a la de Usuarios: ícono con punto verde si se usa
   ahora, nombre, «Este», cómo entró, cuándo y último uso, y las acciones a la derecha. Resuelve:
   reconocer de un vistazo cada dispositivo. Variantes: 1. Patrón: iOS, «Dispositivos» de la cuenta.
   Toques: igual. Dentro de las reglas.
2. **El nombre como campo siempre a la vista, con ideas** («Compu de la oficina», «Caja 2») y su
   cuenta «13/30». Resuelve: no saber qué poner; tocar una idea la guarda. Variantes: 1, 2. Patrón:
   AirDrop / nombre del iPhone. Ahorra 2 toques (abrir, escribir). Dentro.
3. **Aviso de nombre repetido en el lugar**, en ámbar, que no frena (R9.3). Variantes: 1, 2, 3.
   Patrón: Slack al nombrar un canal. Dentro.
4. **«Hasta 30 letras» al chocar el límite**: el contador se sacude y lo dice. Variantes: 1. Patrón:
   campos de iOS. Dentro.
5. **La × para borrar dentro del campo** (vuelve a «Chrome en Windows»). Variantes: 1. Patrón:
   buscadores. Dentro.
6. **El recibo de lo cortado**: después de «Se me perdió», queda una tarjeta con cada cosa cortada
   y un tilde, hasta que se toca «Listo». Resuelve: la tranquilidad de saber qué se cortó. Variantes:
   1, 2 (como tarjeta fantasma), 3 (impreso). Patrón: Stripe, confirmaciones de reintegro. Fuera de
   la regla (la regla pide decirlo; no dice cómo).
7. **«Cerrar todas» en la cabecera de Mis sesiones**, solo con dos o más, con confirmación que dice
   que esta sigue adentro. Variantes: 1, 2, 3. Patrón: Google, «Cerrar sesión en todos lados».
   Dentro.
8. **Una tarjeta por dispositivo**, con su sesión y su huella como fichas con su ×. Resuelve: la
   persona piensa «mi Motorola», no «mis huellas» y «mis sesiones». Variantes: 2. Patrón: Apple ID,
   lista de dispositivos. Ahorra buscar el mismo celular en dos listas. Fuera de la regla (R6, R7
   como listas separadas).
9. **El árbol del código QR**: las computadoras que entraron con el código de un celular cuelgan de
   él (y las de este celular, de este). Resuelve: ver qué cae junto con un celular. Variantes: 2, 3.
   Patrón: árbol de sesiones de 1Password / Tailscale. Fuera de la regla (no lo pide).
10. **Ver antes de cortar**: al apuntar «Se me perdió» o «Quitar», todo lo que se corta se pone rojo
    con «Se cierra / Se quita». Resuelve: cortar sin confirmación sin miedo. Variantes: 2. Patrón:
    Figma al borrar un componente con instancias. Ahorra la ventana de confirmación. Fuera (suma).
11. **Este dispositivo dibujado, con su nombre en la pantalla**, que se escribe letra por letra.
    Resuelve: entender que el nombre es del aparato, no de la persona. Variantes: 2. Patrón: AirPods
    y Apple Watch en Ajustes. Fuera (suma).
12. **Resumen arriba**: «Sesiones abiertas 4 · Con tu huella 2». Variantes: 2. Patrón: Google,
    «Revisión de seguridad». Fuera (suma).
13. **Sin marco, a pantalla completa**, con una × para volver. Variantes: 3. Patrón: Apple Wallet.
    Fuera (rompe el marco).
14. **Llaves colgadas en un tablero perforado**, con sellos de goma («En uso», «Huella»). Variantes:
    3. Patrón: la pared de llaves de la ferretería. Fuera (lenguaje visual).
15. **La rotuladora**: el nombre en una cinta en relieve, cada letra estampada; «Cortar la cinta»
    lo guarda. Resuelve: que el nombre se sienta un rótulo pegado al aparato. Variantes: 3. Patrón:
    Dymo. Fuera (lenguaje visual).
16. **Tirar hacia abajo para bajar**: un celular corta todo, una computadora cierra su sesión; con
    Supr en el teclado. Variantes: 3. Patrón: tirar para descartar en iOS. Ahorra apuntar al botón.
    Fuera (R8.1 pide un toque).
17. **Dar vuelta la llave** para ver cada acción suelta. Variantes: 3. Patrón: tarjetas de Wallet.
    Cuesta un toque más. Fuera.
18. **Las preferencias como pastillas que se tocan**, al pie: «Con movimiento ↔ En el acto», «14:30
    ↔ 2:30 p. m.». Variantes: 3. Patrón: Centro de control de iOS. Ahorra entrar a cada renglón.
    Fuera (R1.2 pide que cada una diga qué cambia).
