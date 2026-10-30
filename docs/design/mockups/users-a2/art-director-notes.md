# Usuarios (segunda ronda): tres ideas para Carlos

Las capturas lado a lado están en `desktop-comparison.png` y `phone-comparison.png`. Cada variante
se abre sola desde su `index.html` y usa `../../../../common/` y `../../extra/`, donde están los
íconos que se suman (Lucide), los datos de mentira, las piezas comunes (`shared.*`) y el tablero
de la variante 3 (`keyrack.*`).

Las seis maquetas muestran a las mismas nueve personas, así se comparan igual con igual. Vos sos
Roberto Gaitán. Además están Graciela, Martín «del depósito», Lucía (con un correo de Google
Workspace) y Nahuel, que tiene dos celulares que se llaman igual, «Chrome en Android», y una
notebook que no usa hace 41 días. Jorge y una persona sin nombre (sofia.quiroga@…) todavía no
entraron, y Diego y Ramiro están dados de baja. En total hay 8 sesiones, 5 celulares con huella y
9 aparatos.

Para ver cómo queda sin conexión: en la 1 y la 2 de la computadora, tocá la pastilla verde «En
línea» del lateral; en los celulares, la línea de conexión; en la 3 de la computadora, Alt C.

## Las tres ideas

| | La idea en una frase | Ideas del catálogo |
|---|---|---|
| **1 · La ficha** (evolución) | La lista de personas a la izquierda y la ficha de la elegida fija a la derecha, como Contactos o la bandeja de Linear. Arriba, cuatro números, entre ellos la sesión olvidada. Autorizar es una sola línea con Enter arriba de la lista, y «Se perdió un celular» resuelve el caso en dos toques. | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 |
| **2 · Las puertas abiertas** (reinvención) | La pantalla no arranca por las personas sino por los aparatos donde hay alguien adentro, ordenados en una línea de tiempo, desde «Ahora» hasta «Hace más de un mes». Cada aparato junta su sesión y su huella, y con «Cortar» las saca a las dos. Las personas viven en un cajón (o en un segmento, en el celular), y autorizar muestra el pase de la persona mientras lo escribís. | 4, 11, 12, 13, 14, 15, 16, 17 |
| **3 · El tablero de llaves** (la que nadie se animaría) | No hay marco: la pantalla entera es el tablero perforado de la ferretería. Cada persona es un llavero colgado y cada aparato, una llave. Para cortar, se descuelga la llave y se tira al cajón. Para dar de baja, se tira el llavero entero (con confirmación). También se le puede hablar: «se perdió el celular de Nahuel». | 4, 12, 18, 19, 20, 21, 22, 23, 24 |

**Las tres son ideas distintas, no tres versiones de la misma.** La 1 es una lista con su detalle.
La 2 cambia de qué se trata la pantalla: de quién puede entrar pasa a dónde hay alguien adentro. La
3 cambia la forma de tocarla: se arrastra, se habla, y no hay marco.

### Qué rompe cada una

- **1 · La ficha:** casi nada. Suma tres cosas que las reglas no piden: el contador «olvidada hace
  41 días» (las sesiones sin usar hace más de un mes), la semana de uso de cada persona («5 de 7
  días») y el botón «Copiar aviso» al autorizar.
- **2 · Las puertas abiertas:**
  - La vista principal muestra aparatos, no personas. La lista de R3.1 pasa a un cajón en la
    computadora y a un segmento en el celular.
  - «Cortar» junta «Cerrar» y «Quitar» (R5.3 y R5.6) en cada aparato, no solo en el caso del
    celular perdido.
  - Ya no hay un botón «Se perdió un celular» (R5.7): ese caso es cortar el aparato desde la pared.
    Hay que saber qué sesión y qué huella son del mismo aparato.
  - Las sesiones de una persona se cierran todas juntas desde la persona elegida en los filtros, no
    desde su tarjeta.
- **3 · El tablero de llaves:**
  - Saca el marco entero: no hay lateral, menú de abajo ni pestañas. Auditoría queda como un
    enlace, y se vuelve a Más con la ×.
  - Arrastrar es el gesto principal, pero sigue habiendo un menú al tocar y teclas.
  - Las bajas no están en la lista: aparecen abajo como «dados vuelta».
  - Suma la voz.
  - **Rompe la paleta:** el latón de las llaves (`--laton`, #D6B25E) no está en «Mostrador». Es
    una propuesta, y está marcada así en `extra/keyrack.css`.
  - La baja sigue pidiendo confirmación y borrar sigue siendo solo para quien nunca entró, como
    piden las reglas.

## Cuál me gusta más

**La 2, con la ficha de la 1 para las personas.** El trabajo real de esta pantalla casi nunca es
«administrar personas». Son dos sustos y un trámite: «se perdió un celular», «alguien se fue» y
«entró uno nuevo». Las tres preguntas que importan son dónde está abierta la puerta, desde cuándo y
de quién es. La 2 las contesta de un vistazo. La notebook de Nahuel, que nadie abrió en 41 días, se
ve sola en ámbar sin que nadie la busque. Y cortar un celular perdido pasa de cuatro toques a uno.

Para la persona en sí (cambiarle el nombre, darla de baja), la ficha fija de la 1 es más clara que
el cajón de la 2. Yo armaría la 2 con la ficha de la 1 a la derecha cuando se elige a alguien.

**De la 3 rescataría la voz.** Decirle «se perdió el celular de Nahuel» al celular, con el cliente
esperando, es más rápido que cualquier pantalla.

## Cómo se mueve cada interacción

- **Elegir a alguien (1, computadora):** la ficha cambia con un fundido de 200 ms que sube 4 px.
  Se siente como pasar una hoja, no como una pantalla nueva.
- **Abrir la ficha (1, celular):** entra desde la derecha en 320 ms y la lista queda detrás, como
  en el iPhone. El menú de abajo no se mueve.
- **Cerrar una sesión o quitar una huella (1):** el renglón se va 24 px a la derecha y se
  desvanece. En el celular, además, se desliza a la izquierda con el dedo: el rojo aparece debajo
  y, pasados 90 px, la sesión se cierra sola y vibra.
- **Autorizar (todas):** la persona nueva entra 8 px desde abajo con un rebote corto y su borde se
  pinta de verde durante un segundo. Vibra 10 ms.
- **El pase (2):** se escribe solo mientras tipeás. Al autorizar, se achica y vuela hacia
  «Personas» en 480 ms, y el botón «Personas» se ilumina: la persona se guardó ahí.
- **Dar vuelta un aparato (2):** la pieza gira 180° en 3D (320 ms) y muestra al dorso la sesión y
  la huella por separado.
- **Cortar (2):** la pieza se achica al 85 % y se desvanece en 280 ms. La pared se reacomoda y el
  número de arriba baja. Vibra doble.
- **La línea de tiempo (2):** al pasar sobre una cara, la cara sube 3 px y su aparato se marca en
  la pared. El punto verde de «Ahora» late despacio.
- **Colgar un llavero (3):** el llavero se balancea en su gancho (14°, −8°, 4°, −1,5° y 0, en
  1,1 s) hasta quedar quieto. Se siente que pesa.
- **Descolgar una llave (3):** la llave se levanta inclinada −4° y con sombra, el cajón rojo sube
  desde abajo y se pone rojo lleno al pasar por encima. Al soltarla, la llave cae girando 35° y se
  desvanece. Si se suelta afuera, vuelve a su lugar en 260 ms.
- **La voz (3):** una franja pino sube desde abajo con la onda que se mueve (solo con `scaleY`),
  y la frase se escribe letra por letra. Las llaves de las que habla tiemblan en su argolla.
- **Dar de alta (3):** el llavero «dado vuelta» gira sobre su eje y vuelve a colgarse arriba,
  balanceándose.

Todo se mueve solo con `transform` y `opacity`. Con «reducir movimiento», nada se mueve y todo
cambia de golpe.

## Autocrítica (lo que corregí antes de mostrar)

- **1:** los números de arriba ocupaban 100 px y la ficha no entraba. Pasaron a una sola línea por
  número. Los datos de cada sesión ocupaban tres líneas y ahora son dos, con íconos: «entró» y
  «último uso».
- **2:** los nueve botones «Cortar» en rojo gritaban, así que ahora son neutros y se ponen rojos
  al pasar por encima o con el foco. Saqué las iniciales chicas (11 px) del renglón del dueño. El
  dorso de la pieza se salía de la tarjeta. En el pase, la cara tapaba el logotipo. Y en el
  celular, abrir la hoja corría la pantalla de fondo (ahora el foco espera a que termine de subir).
- **3:** en el celular, los llaveros eran demasiado altos y el cajón se veía sin estar arrastrando.
  La franja de la voz asomaba abajo, y el correo sin nombre se salía del llavero.
- **Lo más flojo que queda:**
  - En la 2 de la computadora, la segunda fila de aparatos queda cortada y hay que bajar.
  - En la 3 de la computadora, la mitad de abajo del tablero queda vacía con estas nueve personas;
    con más personas, se llena hacia el costado.
  - La voz es de mentira, con dos frases fijas que se alternan.
  - La 1 es la más segura y la menos nueva.

## Catálogo de ideas

Cada idea va suelta, para tomarla o dejarla sin rearmar nada. «Toques» compara contra lo que piden
las reglas tal cual.

1. **Ficha fija al costado.** La persona elegida se ve a la derecha sin abrir nada; ↑ ↓ cambian de
   persona. *Resuelve:* revisar a varias personas seguidas sin abrir y cerrar. *Variantes:* 1
   (computadora). *Patrón:* Contactos de macOS, la bandeja de Linear. *Ahorra:* 2 toques por
   persona. *Fuera de las reglas:* no.
2. **Autorizar en una línea.** Correo, nombre opcional y Enter, sin diálogo; el error queda junto
   al correo con lo escrito. *Resuelve:* sumar a alguien con el cliente esperando. *Variantes:* 1.
   *Patrón:* agregar una tarea en Linear. *Ahorra:* 2 toques. *Fuera:* no.
3. **Contador de sesiones olvidadas.** «1 olvidada hace 41 días» en ámbar, arriba de todo; al
   tocarlo, lleva a esa sesión. *Resuelve:* puertas que quedaron abiertas en una notebook vieja.
   *Variantes:* 1, 2 (zona ámbar). *Patrón:* revisión de seguridad de Google. *Ahorra:* buscarla a
   mano. *Fuera:* sí, las reglas no lo piden.
4. **Se perdió un celular, en dos toques.** De quién y, si tiene uno solo, ya está elegido; dice qué
   cortó con un tilde que se dibuja. *Resuelve:* el susto. *Variantes:* 1 (diálogo), 2 (directo en
   la pared), 3 (con la voz). *Patrón:* «Borrar este dispositivo» de Buscar de Apple. *Ahorra:* lo
   que piden las reglas. *Fuera:* no.
5. **La semana de cada persona.** Siete cuadritos, L a D, con los días que usó Ferrebress.
   *Resuelve:* saber si alguien dejó de venir sin leer fechas. *Variantes:* 1. *Patrón:* el anillo
   de actividad de Apple. *Ahorra:* nada; informa. *Fuera:* sí, es un dato nuevo.
6. **Copiar el aviso.** Al autorizar, la tostada ofrece «Copiar aviso»: un texto listo para
   WhatsApp con su cuenta. *Resuelve:* no se manda correo y hay que avisar por fuera. *Variantes:*
   1 (en el celular, «Compartir»). *Patrón:* compartir una invitación en Slack. *Ahorra:* tipear el
   mensaje. *Fuera:* sí, suma un botón.
7. **El correo con candado.** Quien ya entró muestra el correo con un candado; quien no entró, con
   «Cambiar». *Resuelve:* entender R3.6 sin leerla. *Variantes:* 1, 2. *Patrón:* campos bloqueados
   de Stripe. *Ahorra:* un intento fallido. *Fuera:* no.
8. **Deslizar para cerrar.** En el celular, una sesión o una huella se cierra deslizándola a la
   izquierda; el botón sigue, para quien usa guantes. *Resuelve:* una mano. *Variantes:* 1, 2
   (celular). *Patrón:* Mail de iOS. *Ahorra:* 1 toque. *Fuera:* no.
9. **Baja con lo que va a pasar.** La confirmación dice cuántas sesiones se cierran y cuántas
   huellas se quitan, con sus números. *Resuelve:* que la baja no sorprenda. *Variantes:* 1, 2, 3.
   *Patrón:* borrar un repositorio en GitHub. *Ahorra:* nada; da seguridad. *Fuera:* no.
10. **«Dar de alta» desde la tostada.** Después de una baja, la tostada ofrece volver atrás.
    *Resuelve:* la baja equivocada. *Variantes:* 1. *Patrón:* «Deshacer» de Gmail. *Ahorra:* buscar
    a la persona. *Fuera:* no, porque es un alta normal (las huellas no vuelven).
11. **Los aparatos primero.** La pantalla muestra dónde hay alguien adentro, no quién puede entrar.
    *Resuelve:* la pregunta de seguridad de verdad. *Variantes:* 2, 3. *Patrón:* «Tus dispositivos»
    de una cuenta de Google. *Ahorra:* 2 toques por aparato. *Fuera:* sí, cambia el orden de R3.1.
12. **Un aparato, una pieza.** La sesión y la huella del mismo celular van juntas, con dos insignias
    (llave y huella). *Resuelve:* que Nahuel tenga «Chrome en Android» repetido tres veces sin saber
    cuál es cuál. *Variantes:* 2, 3. *Patrón:* AirTag en Buscar. *Ahorra:* entender. *Fuera:* sí,
    hay que saber qué sesión es de qué huella.
13. **Cortar de un toque, en cualquier aparato.** Cierra la sesión y quita la huella; al dorso se
    pueden hacer por separado. *Resuelve:* el celular perdido, el robado y el que se fue.
    *Variantes:* 2, 3. *Patrón:* «Cerrar sesión» de Netflix por dispositivo. *Ahorra:* 3 toques.
    *Fuera:* sí, generaliza R5.7.
14. **La línea de tiempo del último uso.** Cinco cajas (Ahora, Hoy, Semana, Mes, Más de un mes) con
    las caras de quien está adentro; la última, en ámbar. *Resuelve:* ver lo olvidado sin leer.
    *Variantes:* 2. *Patrón:* el «Tiempo de uso» de iOS. *Ahorra:* revisar todo. *Fuera:* sí.
15. **Filtrar por persona con su cara.** Chips con la cara y la cantidad de aparatos; al elegir a
    alguien, aparecen «Cerrar todas» y «Dar de baja». *Resuelve:* ir a una persona sin buscarla.
    *Variantes:* 2. *Patrón:* filtros de Airbnb. *Ahorra:* 1 toque. *Fuera:* no.
16. **El pase.** Al autorizar, se ve en vivo cómo va a quedar la persona (nombre, o el correo si no
    tiene, y «Todavía no entró»), y al guardar vuela a Personas. *Resuelve:* entender R3.4 sin
    leerla. *Variantes:* 2. *Patrón:* agregar una tarjeta a Wallet. *Ahorra:* nada; se entiende.
    *Fuera:* no.
17. **Personas en un cajón.** La lista completa, con las acciones al pasar por encima (cambiar el
    nombre, Baja, Borrar, Dar de alta). *Resuelve:* que la persona no tape los aparatos.
    *Variantes:* 2. *Patrón:* el panel de miembros de Slack. *Ahorra:* nada. *Fuera:* sí, saca la
    lista del centro.
18. **Pantalla sin marco.** El tablero ocupa todo; se vuelve con la × o Alt X. *Resuelve:* una
    tarea de seguridad sin distracciones. *Variantes:* 3. *Patrón:* modo de una sola tarea del
    iPhone. *Ahorra:* nada. *Fuera:* sí, rompe el marco de la aplicación.
19. **Cada persona es un llavero y cada aparato una llave.** El tablero perforado de la ferretería
    como metáfora. *Resuelve:* que quien nunca usó «sesiones» lo entienda igual. *Variantes:* 3.
    *Patrón:* el tablero de llaves de cualquier comercio. *Ahorra:* explicar. *Fuera:* sí.
20. **Tirar al cajón.** Se arrastra una llave (cortar) o un llavero (baja, con confirmación; o
    borrar, si nunca entró) al cajón que aparece abajo. *Resuelve:* un gesto que se recuerda.
    *Variantes:* 3. *Patrón:* tirar a la papelera en el Finder. *Ahorra:* 1 toque. *Fuera:* sí,
    arrastrar es el gesto principal (el menú y las teclas siguen).
21. **La llave oxidada.** La llave sin usar hace más de un mes se ve gris. *Resuelve:* lo olvidado.
    *Variantes:* 3 (en la 2 es ámbar). *Patrón:* los íconos apagados de iOS. *Ahorra:* buscar.
    *Fuera:* sí.
22. **Decí qué pasó.** Con la voz: «se perdió el celular de Nahuel» marca sus celulares, pregunta
    cuál y corta; «autorizá a walter punto ibarra arroba example punto com» cuelga su llavero.
    Espacio en la computadora y el botón grande en el celular. *Resuelve:* las manos ocupadas y el
    apuro. *Variantes:* 3. *Patrón:* Siri en atajos. *Ahorra:* casi todo. *Fuera:* sí.
23. **Colgar un llavero.** Autorizar es escribir en un llavero en blanco que se cuelga y se
    balancea. *Resuelve:* que autorizar se sienta como entregar una llave. *Variantes:* 3.
    *Patrón:* crear una tarjeta en Trello. *Ahorra:* igual que la idea 2. *Fuera:* no.
24. **Los dados vuelta.** Las bajas quedan abajo como llaveros dados vuelta; al tocarlos, giran y
    vuelven a colgarse (alta). *Resuelve:* ver las bajas sin mezclarlas. *Variantes:* 3. *Patrón:*
    el archivo de Gmail. *Ahorra:* 1 toque. *Fuera:* sí, saca las bajas de la lista.
