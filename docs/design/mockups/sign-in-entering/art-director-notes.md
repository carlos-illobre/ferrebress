# Entrando, en la computadora: tres maquetas para Carlos

La espera mientras se abre la sesión al entrar (01 · Entrar, R2.11), solo en la computadora: la del
celular ya está aprobada (`../sign-in/adapted/`, capa «Entrando») y no se toca. La versión de hoy era
la del celular centrada en la pantalla grande, con mucho espacio vacío.

Comparación: `desktop-comparison.png`. Cada variante tiene `screenshot.png` (con Google) y
`screenshot-qr.png` (con el celular, leyendo el QR).

Las tres tienen el mismo contenido que el celular: el logotipo; el título según cómo entra
(«Conectando tu cuenta de Google» o «Entrando con tu celular»); la bajada; el camino (la G de Google o
el celular → la F de Ferrebress girando → el local) y los dos pasos (el hecho y «Abriendo tu sesión»).
Usan el naranja propio de la entrada (#D83F0E). No hay aviso de «Entraste»: al abrirse la sesión
aparece el marco, que acá se muestra neutro (su maqueta es otra).

**El selector de la maqueta** (abajo a la izquierda, fuera del diseño): cómo entra (Google o el
celular; también `?estado=entrando-google` o `?estado=entrando-celular`, como en la entrada), «Abrir
la sesión» (Enter) y «Repetir» (R); 1 y 2 cambian cómo entra. En la maqueta la sesión no se abre
sola, para poder mirar la espera. Lo común está en `shared.css` y `shared.js`.

## Las variantes

| | Idea en una frase | Ideas del catálogo |
|---|---|---|
| **1 · La escena** | La espera se queda en la escena de la entrada: el título grande sobre el verde, debajo del logotipo, y en la tarjeta blanca, en el mismo lugar donde la persona estaba mirando, el camino grande con sus rótulos y los dos pasos. | 1, 2, 3, 4, 5 |
| **2 · El marco que se arma** | La espera ya es el lugar adonde se llega: el lateral del marco está, vacío y con un brillo que lo recorre, con el logotipo donde va a quedar; en el área de trabajo, el camino de punta a punta y los dos pasos como dos tarjetas. Al abrirse la sesión, lo de la espera se va y queda el marco, sin salto. | 2, 3, 5, 6, 7, 8 |
| **3 · La persiana** | Toda la pantalla es la persiana del local, con la marca pintada, el camino de lado a lado y un cartel colgado con los dos pasos. Cuando Google o el celular confirman, la persiana se destraba y sube un poco (se ve la luz del local abajo); al abrirse la sesión sube entera y detrás está el marco. | 2, 3, 9, 10, 11 |

**Mi preferida: la 2, El marco que se arma.** Es la única en la que la espera y la llegada son la
misma pantalla: el ojo ya está donde va a trabajar, el logotipo no se mueve y, cuando la sesión se
abre, no hay un cambio de escena, solo se completa lo que faltaba. Usa el ancho de la computadora
para el camino entero y deja los pasos legibles a distancia. La 1 es la apuesta segura (continuidad
con la entrada); la 3 es la más memorable, pero agrega casi un segundo de animación a cada entrada.

## Qué contradice una regla o queda fuera del capítulo

- **1 · La escena:** nada de las reglas. Suma textos que el celular no tiene: «Un momento»,
  «Conexión segura», los rótulos del camino («Confirmó tu cuenta», «Abre tu sesión», «Adonde
  llegás»), «No hace falta tocar nada…» y la computadora y la conexión arriba, como en la entrada.
  En la computadora se aceptan textos más largos que expliquen, pero los textos tienen que decir lo
  mismo en los dos.
- **2 · El marco que se arma:** muestra el lateral del marco (02 del capítulo, ya aprobado) antes de
  que la sesión exista, como esqueleto sin nada; no lo cambia. Fuera del lenguaje «Mostrador» en un
  detalle: el brillo que recorre el lateral. Suma los rótulos del camino, «1 de 2» / «2 de 2» y la
  línea «No hace falta tocar nada…».
- **3 · La persiana:** rompe **«calma por defecto»** del lenguaje visual (fondo oscuro a pantalla
  completa; una pantalla no lleva color propio) y la regla de movimiento corto: subir la persiana
  dura 900 ms y demora la llegada del marco. El cartel que se hamaca es un movimiento continuo que
  el lenguaje no prevé. Mismos textos de más que la 1.

## Movimiento por interacción

Solo `transform` y `opacity`; con «reducir movimiento», nada se mueve ni gira.

- **Al llegar** (las tres): todo entra 12 px desde abajo, escalonado (520 ms); la línea de lo hecho se
  estira de la G (o del celular) hasta la F y el tilde del primer paso se dibuja (300 ms). Se siente
  que lo hecho queda atrás.
- **Mientras abre la sesión:** el anillo naranja gira alrededor de la F (1,1 s por vuelta) y la marca
  del paso en curso gira. En la 1 y la 3 un punto naranja viaja de la F al local; en la 2 una barra
  naranja corre por el riel y un brillo recorre el lateral vacío. Se siente que algo trabaja, sin
  apuro.
- **Al abrirse la sesión:** en la 1, la tarjeta se achica a 98 % y la escena se funde (320 ms); en la
  2, lo de la espera baja 8 px y se va, y queda el marco (320 ms); en la 3, la persiana sube entera
  (900 ms) y se ve el local. Se siente que se llegó, sin un aviso.
- **3 · La persiana, aparte:** al confirmar quién es, la persiana sube 28 px con un rebote corto y abajo
  aparece la luz del local; el cartel se hamaca apenas (±1,2°).

## Autocrítica

- **1:** primero el título «Conectando tu cuenta de Google» partía en tres renglones y los rótulos
  del camino no cabían en la tarjeta; se ajustaron el tamaño del título y el ancho de los rótulos.
  Lo flojo que queda: la mitad de abajo del verde está vacía.
- **2:** los rieles no tocaban las bolas y «2 de 2» partía en dos renglones; corregido. Lo flojo: el
  área de trabajo tiene mucho blanco a la derecha del título.
- **3:** el contenido no entraba en el alto y el logotipo quedaba cortado al subir la persiana; las
  cuerdas del cartel no llegaban a los agujeros. Corregido. Lo flojo: el texto chico sobre los
  listones se lee peor que sobre blanco.

## Catálogo de ideas

1. **La tarjeta no se mueve.** La espera aparece en la misma tarjeta donde se entró, en el mismo
   lugar. Resuelve: la vista no salta. Variante 1. Patrón: Stripe Checkout (el botón se vuelve la
   espera). Ahorra: 0 toques. Dentro de las reglas.
2. **El camino a lo ancho, con rótulos.** Cada bola dice quién es y qué hizo («Google · Confirmó tu
   cuenta», «Ferrebress · Abre tu sesión», «Tu local · Adonde llegás»). Resuelve: se entiende sin
   leer la bajada. Variantes 1, 2 y 3. Patrón: Apple Pay / transferencias de Wallet. 0 toques. Suma
   textos que el celular no tiene.
3. **Algo viaja de la F al local.** Un punto o una barra naranja recorre el tramo que falta. Resuelve:
   se ve que avanza, no que está trabado. Variantes 1, 2 y 3. Patrón: el envío de Shopify. 0 toques.
4. **El título grande sobre el verde.** Se lee desde lejos del mostrador. Variante 1. Patrón: las
   pantallas de bienvenida de Apple. 0 toques.
5. **«No hace falta tocar nada».** Una línea que dice que la pantalla cambia sola. Resuelve: la
   persona no aprieta nada «por las dudas». Variantes 1 y 2. Patrón: Microsoft («No apagues el
   equipo»). 0 toques. Texto que no está en las reglas.
6. **La espera dentro del marco.** El lateral vacío ya está; el logotipo, donde va a quedar. Resuelve:
   no hay cambio de escena al terminar. Variante 2. Patrón: Linear y Slack al abrir. 0 toques. Muestra
   el marco antes de la sesión.
7. **Los pasos como tarjetas con «1 de 2».** Resuelve: se ve cuánto falta. Variante 2. Patrón: Stripe
   Onboarding. 0 toques.
8. **El brillo del lateral.** El esqueleto del menú brilla mientras se arma. Variante 2. Patrón:
   esqueletos de carga de Facebook y LinkedIn. 0 toques. Fuera del lenguaje.
9. **La persiana del local.** La pantalla entera es la persiana; al abrirse la sesión, sube. Resuelve:
   que entrar sea «abrir el local», con el oficio de la ferretería. Variante 3. Patrón: ninguno de
   app; la persiana de cualquier negocio. 0 toques. Rompe «calma por defecto».
10. **Se destraba al confirmar.** La persiana sube un poco cuando Google o el celular confirman y deja
    ver la luz. Resuelve: el primer paso se siente. Variante 3. 0 toques.
11. **El cartel colgado.** Los dos pasos en un cartel que se hamaca, como el de «Abierto». Variante 3.
    0 toques. Movimiento continuo que el lenguaje no prevé.
