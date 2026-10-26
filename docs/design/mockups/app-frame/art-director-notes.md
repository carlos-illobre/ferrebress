# El marco de la aplicación: tres variantes para Carlos

Capturas lado a lado: `desktop-comparison.png` y `phone-comparison.png`. Cada variante tiene su
`index.html` (el marco con la pantalla Vender vacía de relleno, `screenshot.png`) y un
`states.html` (los estados del marco en una sola página, `states.png`). Las seis usan
`../../../../common/` y las piezas compartidas de esta carpeta: `app-frame.css` (marco de pruebas,
«Pronto», teclas, luz, lo pendiente) y `app-frame.js` (Alt muestra las teclas y Alt + letra toca el
botón, las flechas mueven la marca, Enter la activa, Esc cierra o la saca, la luz y Más se abren y
se cierran, lo que dice «Pronto» no hace nada).

El caso de todas: Rubén Sosa, Administrador, en Vender con la venta vacía; 3 anomalías; en pruebas
dicen «Pronto» Ventas de hoy, Procesos, Administración y Manual (es un ejemplo: lo que falte de
verdad se decide al programar). Sin conexión hay 3 cosas por enviar: una venta de $45.500 en
efectivo (Lucía, 10:38), un ajuste de stock de la mecha HSS 8 mm, −2 un. (Rubén, 10:31) y un precio
a mano de los tarugos S8 (Lucía, 10:29). Los nombres son inventados.

**Lo que no cambia en ninguna:** el marco magenta de 5 px y el cartel «Ambiente de prueba · nada de
esto es real», colgando arriba al centro como una lengüeta (R10.2: es el mismo en las tres). En el
celular, la aplicación le deja su lugar (32 px) para que el cartel no tape el título.

## Las variantes

| | Idea en una frase | Ideas |
|---|---|---|
| **1 · Riel** (evolución) | El marco de hoy, terminado: lateral blanco con las cinco partes; Más se despliega ahí mismo con sus seis opciones; la luz es una baldosa al pie del lateral que abre una tarjeta con lo pendiente; Alt pone una tecla oscura en la esquina de cada cosa; la marca es un anillo de tinta por fuera, el cursor el brillo pino por dentro. En el celular, el marco de hoy con la línea de conexión tocable y Más como lista agrupada. | 1, 2, 3, 4, 5, 6, 7, 8 |
| **2 · Bandeja** (reinvención) | El marco se achica para dar lugar al trabajo: un riel de 88 px (ícono y nombre), las pestañas como segmentos al lado del título, la luz arriba a la derecha que cuenta lo que falta y abre un cajón de «bandeja de salida» en orden; Más es un panel encima, sin cambiar de pantalla; Alt aclara la pantalla y pone las teclas grandes, al centro de cada cosa, con las teclas de siempre abajo; la marca dice «↵ Enter». En el celular: menú en una isla flotante, la luz es un botón redondo arriba (tilde verde o número ámbar), Más sube en una hoja de baldosas y las pestañas se deslizan como títulos. | 2, 3, 6, 9, 10, 11, 12, 13, 14, 15, 16 |
| **3 · Mostrador** (audaz) | Una sola barra para los dos dispositivos, abajo: en la computadora, las cinco partes como pastillas en una barra al pie (la pantalla gana todo el ancho); en el celular, un solo botón para el pulgar que abre las cinco partes en abanico. La luz es la raya de arriba de esa barra (verde, ámbar cortada, azul) y abre la «cola de envío»; Más sube como un panel ancho con las seis opciones en columnas (en el celular, a pantalla completa). Con Alt, la tecla toma el lugar del ícono de cada parte; la marca es un visor de cuatro esquinas, como el de escanear. | 2, 3, 6, 17, 18, 19, 20, 21, 22 |

**Qué rompe la audaz:** R1.1 (el menú de la computadora va a la izquierda): acá va abajo, igual que
en el celular. Con el menú horizontal, ↑ ↓ del menú pasan a ser ← → dentro de la barra (R2.3 y R2.4
cambian para el menú). En el celular desaparece el menú de abajo fijo: hay que tocar el botón del
pulgar para ver las partes (un toque más para cambiar de parte, a cambio de toda la pantalla).

**La 2 también se aparta un poco:** Más deja de ser una pantalla (panel en la computadora, hoja en el
celular), y la línea de texto de la conexión del celular pasa a ser un botón redondo con ícono:
sigue siempre a la vista (R4.1), pero el texto «En línea · todo enviado» aparece al tocarlo.

## Cuál me gusta más

**La 1 en la estructura, con tres ideas de la 2 y una de la 3.** El marco se ve en todas las
pantallas todo el día: tiene que ser lo más calmo y lo menos sorprendente, y la 1 respeta las reglas
al pie de la letra y es la que menos cuesta aprender. De la 2 tomaría la luz que **cuenta** lo que
falta (el número ámbar, idea 10) y el cajón de lo pendiente con el orden de salida (idea 11), y la
marca que dice «↵ Enter» (idea 13), que enseña sola para qué sirven las flechas. De la 3, la raya de
color como luz (idea 18) sumada a la baldosa, porque se ve de reojo sin leer. La 3 entera es la más
rápida de mirar y la que más pantalla da, pero cambia R1.1 y el teclado del menú.

## Cómo se mueve (una línea por interacción)

- **Alt apretado:** las teclas aparecen en 120 ms subiendo 3 px desde 90 %; al soltar, se van sin
  animación (lo que se suelta tiene que irse ya). En la 2, además, la pantalla se aclara en 120 ms.
- **La marca:** salta de lugar sin animarse (se tiene que ver en el acto); al mover el mouse se
  apaga con un fundido de 120 ms y vuelve con la primera flecha.
- **La luz cambia de estado:** el punto cambia de color con un fundido de 200 ms; «Enviando…» late
  (opacidad) cada 1,2 s; cuando termina, el número baja rodando y la luz vuelve a verde. En la 3, la
  raya se llena de izquierda a derecha a medida que salen las cosas.
- **Lo pendiente:** la tarjeta (1) y la cola (3) suben 6 px y se aclaran (200 ms); el cajón (2)
  entra desde la derecha (320 ms, `--curva`); la hoja del celular sube desde abajo (320 ms) con el
  fondo al 30 %. Al salir cada cosa, su renglón se corre a la derecha y se desvanece (200 ms).
- **Más:** en la 1 el grupo se despliega hacia abajo (200 ms) y los renglones entran escalonados
  20 ms; en la 2 el panel sale del riel 8 px a la derecha y se aclara; en la 3 sube de la barra.
- **El abanico (celu 3):** las cinco partes salen del botón en arco, una tras otra cada 20 ms, con
  rebote corto (`--rebote`); el botón gira a × (200 ms); al deslizar sobre una, crece a 110 % y vibra
  10 ms; al soltar, se elige.
- **Sin conexión:** lo que no anda se apaga a gris en 200 ms; al volver, recupera el color sola.
- **Tocar algo con «Pronto»:** no pasa nada a propósito; la pastilla punteada se sacude 2 px una vez
  (120 ms) para decir «todavía no».

Con «reducir movimiento», nada se mueve.

## Autocrítica

Primera captura → lo que corregí:

- La clase de la marca chocaba con la del logo (`.marca` del lenguaje común) y el anillo salía sobre
  la marca de Ferrebress: la marca del teclado pasó a `.marcado`.
- El cartel de pruebas tapaba el título en el celular: la aplicación le deja 32 px abajo de la barra
  de estado.
- La tecla de la pestaña tapaba «Ventas de hoy»: pasó a la esquina de arriba.
- En la 2 el cajón de lo pendiente se veía siempre (una regla de estilo le ganaba al oculto) y los
  puntos de la línea de tiempo pisaban los íconos.
- En la 3 el abanico tapaba la barra de estado del teléfono y el arco no estaba parejo; el botón del
  pulgar tenía la insignia de anomalías, que se leía como «3 en la venta»: la saqué.

Lo que sigue flojo: en la 2, «Ventas de h…» se corta a propósito (se ve que hay otra pestaña al
deslizar) y puede leerse como un error; en la 2 con Alt, las teclas grandes tapan el nombre de cada
parte del riel. En la 1, la tarjeta de lo pendiente tapa parte de la venta (mientras está abierta).

## Catálogo de ideas

1. **«Pronto» punteado.** Lo que falta va en gris con una pastilla de borde punteado «Pronto», sin
   tecla, y no se abre. Problema: ver qué viene sin confundirlo con algo roto. Variantes 1, 2 y 3.
   Patrón: los «próximamente» de las tiendas de aplicaciones. Ahorra 0 toques. Dentro de las reglas.
2. **Las cinco partes con su ícono fijo y el número que importa** (Más con la pastilla ámbar de las
   anomalías). Problema: saber si hay algo que mirar sin entrar. 1, 2 y 3. Patrón: Linear, la
   bandeja con su cuenta. Ahorra 1 toque (entrar a Más a mirar). Dentro.
3. **Detalle de lo pendiente con qué, quién, a qué hora y «hace cuánto»,** y una línea que dice que
   sale solo. Problema: tranquilidad cuando se corta internet («¿se perdió la venta?»). 1, 2 y 3.
   Patrón: la bandeja de salida de Correo de Apple. Dentro (R4.2).
4. **Más desplegado en el propio lateral,** como un grupo, sin cambiar de pantalla. Problema: llegar
   a una opción de Más con un toque menos. 1. Patrón: la barra lateral de Finder. Ahorra 1 toque.
   Dentro.
5. **Marca = anillo de tinta por fuera; cursor = brillo pino por dentro.** Problema: no confundir
   dónde escribo con dónde actúa Enter. 1. Patrón: el foco del teclado de macOS. Dentro (R2.5).
6. **Lo que no anda sin conexión, gris con el ícono de sin red en el menú,** y lo de atender sigue en
   color. Problema: saber qué se puede usar sin probar. 1, 2 y 3. Patrón: Spotify sin conexión.
   Ahorra los toques de intentar. Dentro (R4.4, R4.5).
7. **Teclas en la esquina de cada botón, en una tecla oscura,** más una tostada «soltá Alt para
   esconderlas». 1. Patrón: las teclas de acceso de Office. Dentro (R2.9).
8. **Celular: la línea de la conexión con una flecha,** para que se note que se toca. 1. Patrón:
   Ajustes de iPhone. Dentro.
9. **Riel de 88 px con ícono y nombre** en lugar del lateral de 232 px. Problema: más ancho para la
   venta (≈ 140 px más). 2. Patrón: Microsoft Teams, Slack. Dentro (es otra forma del plegado).
10. **La luz cuenta lo que falta** («Sin conexión 3» con el número en su color). Problema: ver
    cuánto falta sin tocar. 2 (y el texto en 1 y 3). Patrón: insignias de iOS. Ahorra 1 toque.
    Dentro.
11. **Bandeja de salida en un cajón, en el orden en que va a salir,** con línea de tiempo.
    Problema: entender qué sale primero. 2. Patrón: Linear, la bandeja. Dentro.
12. **Más como panel encima de la pantalla** (computadora) u hoja (celular), con seis baldosas que
    dicen lo que hay adentro. Problema: mirar Más sin perder lo que se estaba haciendo. 2. Patrón:
    el lanzador de Microsoft 365. Ahorra 1 toque (volver). Fuera: Más deja de ser pantalla.
13. **La marca dice «↵ Enter».** Problema: que la persona aprenda sola qué hacen las flechas.
    2. Patrón: la paleta de Raycast. Dentro.
14. **Alt aclara la pantalla y pone las teclas grandes, al centro de cada cosa,** con un mapa de las
    teclas de siempre abajo. Problema: leer las teclas de lejos, de pie en el mostrador. 2. Patrón:
    Vimium. Dentro (R2.9).
15. **Celular: el menú en una isla flotante** con la parte elegida en naranja suave. 2. Patrón:
    Airbnb, las barras flotantes de las apps de Apple. Dentro.
16. **Celular: las pestañas son títulos que se deslizan** (el de al lado asoma en gris, con puntos
    debajo). Problema: cambiar de pestaña con el pulgar, sin estirarse arriba. 2 y 3. Patrón:
    Música de Apple. Ahorra el estirón. Dentro.
17. **Barra abajo también en la computadora:** la pantalla gana todo el ancho (≈ 230 px) y el menú
    es igual en los dos dispositivos. 3. Patrón: el Dock de macOS, Square en la tablet. Fuera
    (R1.1).
18. **La luz es una raya de color** a lo ancho de la barra: verde, ámbar cortada (sin conexión),
    azul que se llena (enviando). Problema: ver el estado de reojo, sin leer. 3. Patrón: la barra
    de progreso de Safari. Dentro (suma a R4.1).
19. **Más como panel ancho con las seis opciones en columnas,** con su explicación larga y lo que
    hay adentro. 3. Patrón: los menús grandes de Stripe. Fuera: Más deja de ser pantalla.
20. **Con Alt, la tecla toma el lugar del ícono** de cada parte del menú. 3. Patrón: el teclado de
    Bloomberg. Dentro.
21. **Marca = visor de cuatro esquinas,** el mismo dibujo que escanear. Problema: que se distinga
    del cursor a primera vista, en cualquier fondo. 3. Patrón: el visor de la cámara. Dentro.
22. **Celular: un solo botón del pulgar que abre las cinco partes en abanico;** se elige deslizando
    y soltando (sirve con guantes). 3. Patrón: el menú radial de Path, el selector de Apple Watch.
    Un toque más para cambiar de parte, toda la pantalla para trabajar. Fuera (menú de abajo fijo).
