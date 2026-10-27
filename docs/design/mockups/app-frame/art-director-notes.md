# El marco vacío: tres maquetas para Carlos

El marco al que se llega después de entrar, sin ningún módulo todavía (01 · R6; 00 · R1 a R4 y
R10). Capturas lado a lado: `desktop-comparison.png` y `phone-comparison.png`. Cada variante es
**una sola página que se adapta** (desde 900 px, la computadora; debajo, el celular), así que en el
visor las dos entradas de cada número apuntan a la misma página. Cada carpeta tiene
`screenshot.png` (computadora) y `screenshot-phone.png` (celular).

Las tres comparten `shared.css` y `shared.js`: el marco magenta y el cartel, la luz y lo pendiente,
Alt (las teclas aparecen solo mientras se mantiene apretado), la marca de las flechas (naranja,
distinta del cursor), la tostada y Salir (vuelve a `../../sign-in/adapted/index.html`). Las tres
usan el isotipo de la entrada aprobada (`assets/isotype.svg`).

**El selector de la maqueta** es la lengüeta oscura del borde derecho, fuera del diseño:
En línea / Sin conexión con 3 por enviar / Enviando…. Cambia la luz, lo pendiente y el aviso de
«Sin conexión» del área vacía (R4.4).

**Lo pendiente sin módulos.** Como no hay ventas ni nada del negocio, lo que queda por enviar es lo
que guarda el propio marco: dos avisos de «Algo salió mal» (R9.2) y una salida hecha sin conexión
(01 · R5.2), cada uno con qué es, de cuándo y quién (R4.2). Personas ficticias: Rubén Paredes
(Administrador) y Marta Quiroga.

## Las variantes

| | Idea en una frase | Ideas del catálogo |
|---|---|---|
| **1 · Evolución** | El marco «Mostrador» terminado: lateral blanco con las cinco partes y «Pronto», Más que se despliega ahí mismo con sus seis opciones, la luz y la tarjeta de la persona con Salir al pie; en el centro, un mostrador vacío dibujado que dice qué es este lugar. En el celular, el menú abajo con «Pronto» bajo cada parte y Más como hoja con la persona, las opciones y Salir. | 1, 2, 3, 4, 5, 6 |
| **2 · El tablero** | No hay menú que se abre y se cierra: la aplicación es un tablero perforado, como el de la pared de la ferretería, con los 17 lugares de la aplicación a la vista, cada uno con su hueco punteado y su gancho. Lo que se suma «se cuelga» en su hueco. Tocar uno vacío lo hamaca en su gancho. Las flechas se mueven por el tablero como se ve. En el celular, el tablero es una columna con un índice de las cinco partes arriba. | 2, 3, 7, 8, 9, 10 |
| **3 · Una sola puerta** | No hay menú: hay una sola puerta en el centro. Se escribe, se dice o se escanea lo que se quiere hacer, y se llega directo. Lo que no existe se encuentra igual y dice «Pronto» en el renglón. En el celular, la puerta está bajo el pulgar: hablar (mantener apretado), la cámara y escribir; deslizar hacia arriba muestra todo y hacia abajo, la persona y Salir. | 2, 3, 11, 12, 13, 14, 15 |

**Mi preferida: la 2, El tablero.** Para un marco que hoy está vacío es la única que hace del vacío
algo útil: se ve de un vistazo todo lo que va a tener la aplicación y cómo se va completando
(«0 de 17»), y cuando haya módulos no hace falta aprender dónde está nada, porque todo está a un
toque y siempre en el mismo lugar. El molde es uno solo, y la metáfora es de la ferretería, no de
la informática. La 1 es la apuesta segura; la 3 es la más rápida para quien ya sabe qué quiere, pero
no deja ver qué hay.

## Qué rompe cada una

- **1 · Evolución:** nada. Agrega Salir dentro de la hoja de Más en el celular (01 · R5.1 lo pide así)
  y también al tocar el avatar de arriba.
- **2 · El tablero:** **R1.1 y R1.2.** No hay un menú permanente a la izquierda ni abajo, ni
  pestañas: las cinco partes y sus pestañas son 17 lugares en un solo nivel. Al abrir un lugar, el
  tablero se reemplaza y se vuelve a él con Esc o Alt 0 (en la maqueta, «Tablero» arriba). En el
  celular, Salir está al tocar el avatar, no en Más (01 · R5.1). Usa Alt 1 y Alt 2 para Procesos y el
  manual porque no quedan letras libres (R2.8 lo permite).
- **3 · Una sola puerta:** **R1.1, R1.2 y R1.3.** No hay menú ni partes a la vista; «Pronto» se ve
  solo en lo que se encuentra. Más deja de existir como lugar. **R2.3 y R2.4:** las flechas solo
  recorren lo encontrado (el cursor nunca sale de la puerta: R2.1 se cumple de sobra). **01 · R5.1:**
  Salir está en la tarjeta de la persona (computadora) y deslizando hacia abajo o tocando el
  avatar (celular), y también se puede escribir «salir». Suma voz y cámara, que no están en las
  reglas.

## Movimiento por interacción

Solo `transform` y `opacity`; con «reducir movimiento», nada se mueve.

- **Al llegar** (las tres): lo de la pantalla entra 8 a 14 px desde abajo, escalonado (320 a 520 ms).
  Se siente que el lugar se arma para vos.
- **Tocar algo «Pronto»:** se sacude a los costados (360 ms) y lo dice. En la 1, un globo pino al lado
  del lateral (computadora) o una tostada sobre el menú (celular); en la 2, el hueco **se hamaca en
  su gancho** (700 ms, como una herramienta colgada) y sale una tostada; en la 3, el renglón dice
  «Todavía no está» en naranja durante 2 s. En el celular, además, vibra 10 ms. Se siente que no se
  rompió nada: todavía no llegó.
- **Más (1):** la flecha gira 180° y las seis opciones caen escalonadas (240 ms, 25 ms entre una y
  otra). En el celular, la hoja sube (320 ms) y Más queda en naranja.
- **La luz:** verde quieta; ámbar con un latido que se expande y se apaga (1,8 s), y se siente que
  hay algo esperando; enviando, el punto se vuelve un aro que gira. Al tocarla, el panel crece desde
  la luz (220 ms) y cada renglón entra con 40 ms de diferencia; enviando, cada pastilla gira.
- **Alt:** las teclas aparecen con un pequeño zoom (120 ms) **en el lugar del ícono**, así que nada se
  corre.
- **La marca de las flechas:** contorno naranja; desaparece al mover el mouse (R2.5).
- **Salir:** la pantalla se achica al 98 % y se funde (260 ms) antes de volver a la entrada.
- **3 · Buscar:** al escribir, la puerta sube 150 px y el saludo se funde, y lo encontrado cae
  debajo (200 ms). **Hablar:** la puerta se vuelve una onda de cinco barras naranjas; lo escuchado
  se escribe letra por letra. En el celular, el botón se pone naranja, crece al 106 % y lo rodean dos
  anillos que se expanden. **Escanear:** en la computadora, una línea barre la puerta («Pasá el
  código por el lector»); en el celular, la cámara negra con el visor y la línea, que al leer vibra
  10-40-10 ms.
- **2 · Índice del celular:** desliza el tablero hasta el grupo; el chip del grupo que se ve se
  pinta solo mientras se baja.

## Autocrítica (lo que corregí después de la primera captura)

- 1: con Alt, las teclas empujaban el lateral más allá de su ancho; ahora aparecen sobre el ícono.
  «Administración» y «Sin conexión · 3 por enviar» no entraban: el lateral pasó a 280 px.
  En el celular, «Pronto» como insignia tapaba los íconos; ahora es una segunda línea gris.
  La hoja de Más tapaba el menú de abajo; ahora queda encima de él.
- 2: el índice del celular no llegaba a «Más» (calculaba mal la altura); arreglado.
- 3: lo encontrado quedaba debajo de las sugerencias y se salía de la pantalla; ahora la puerta
  sube y el saludo se aparta. «st» encontraba «Vender» por «mostrador»; ahora se busca por el
  comienzo de las palabras.
- Lo más flojo que queda: en la 1, el área central sigue siendo grande y quieta (es lo que pide un
  marco vacío); en la 3, la cámara del celular es un fondo negro sin imagen.

## Catálogo de ideas

1. **«Pronto» al lado de cada opción** con su pastilla gris, y en el celular como segunda línea bajo
   el nombre. Resuelve saber qué falta sin tocar. Variante 1. Patrón: insignias «Beta» de Linear.
   Dentro de las reglas (R1.3).
2. **Lo que no está explica que no está**, en el lugar donde se tocó (globo, hamaca o renglón), no en
   un cartel genérico. Variantes 1, 2 y 3. Patrón: estados de Apple. Ahorra la duda de «¿se rompió?».
   Dentro de las reglas.
3. **Lo pendiente con qué, cuándo y quién**, y su estado (por enviar / enviando) en cada renglón; si
   todo está enviado, cuándo fue el último envío. Variantes 1, 2 y 3. Patrón: la bandeja de salida
   de Mail. Dentro de las reglas (R4.2).
4. **Más que se despliega en el lateral** sin cambiar de pantalla. Variante 1. Patrón: barra lateral
   de Finder. Ahorra un cambio de pantalla. Dentro de las reglas.
5. **La tecla en el lugar del ícono** mientras se mantiene Alt, sin correr nada. Variantes 1 y 2.
   Patrón: las letras de las cintas de Office. Dentro de las reglas (R2.9).
6. **La persona y Salir en la hoja de Más, también desde el avatar** en el celular. Variante 1.
   Patrón: Ajustes de iPhone. Ahorra un toque a quien busca salir arriba. Dentro de las reglas.
7. **El tablero: todos los lugares a la vista y en un solo nivel** (17 huecos). Variante 2. Patrón:
   la pantalla de inicio de Shopify POS y la pared de herramientas de la ferretería. Ahorra un toque
   por pedido (parte + pestaña se vuelven un solo toque). **Fuera de las reglas** (R1.1, R1.2).
8. **El hueco punteado con su gancho** como estado vacío que muestra lo que viene. Variante 2.
   Patrón propio. Dentro de las reglas.
9. **«Listos para usar: 0 de 17»**, el avance de la aplicación a la vista. Variante 2. Patrón:
   la lista de configuración de Stripe. Fuera de las reglas (no lo piden).
10. **Las flechas se mueven en dos dimensiones**, como se ve el tablero. Variante 2. Patrón: Apple TV.
    Cambia R2.3 y R2.4 (← → entre columnas).
11. **Una sola puerta**: escribir lo que se quiere y llegar, con sinónimos (cobrar → Vender,
    inventario → Stock). Variante 3. Patrón: Spotlight y la paleta de Linear. Ahorra recorrer el menú.
    **Fuera de las reglas** (R1.1).
12. **El cursor nunca sale de la puerta**: ↑ ↓ mueven la marca por lo encontrado y Enter abre.
    Variante 3. Patrón: Raycast. Cumple R2.1 y R2.6 por diseño.
13. **Hablar**: decir «vender» y que se abra. En el celular, mantener apretado el botón grande bajo
    el pulgar. Variante 3. Patrón: dictado de Google y los mensajes de voz de WhatsApp. Ahorra
    tipear con guantes. Fuera de las reglas.
14. **Escanear cualquier código como puerta**: el lector en la computadora, la cámara en el celular;
    el código lleva a lo suyo. Variante 3. Patrón: Square y Shopify POS. Fuera de las reglas.
15. **Gestos**: deslizar hacia arriba muestra todo, hacia abajo la persona y Salir. Variante 3.
    Patrón: el centro de control de iPhone. Fuera de las reglas.
