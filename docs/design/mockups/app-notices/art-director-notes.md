# Los avisos del marco: tres maquetas para Carlos

Los cuatro avisos que se dibujan encima del marco aprobado (00 · R5.3 a R5.5, R7.2 y R7.3, R9):
la espera de más de 2 segundos, «Hay una versión nueva», «Hay que actualizar para seguir» y «Algo
salió mal». Capturas: `desktop-comparison.png` (filas: los cuatro avisos; columnas: las tres
variantes) y `phone-comparison.png` (filas: las variantes; columnas: los avisos). Cada carpeta tiene
`screenshot.png` (la computadora, los cuatro avisos en una grilla) y `screenshot-phone.png`.

**Una sola página que se adapta** (desde 900 px, la computadora; debajo, el celular), como el marco.

**El marco de fondo es el aprobado, sin tocar:** cada variante carga `../../app-frame/final/` en un
marco a pantalla completa y dibuja los avisos encima. Lo que hay en el área de trabajo es neutro
(«Lo que estabas haciendo», tres renglones vacíos y un botón «Guardar» que tarda), para ver que el
aviso no lo tapa y que no se pierde (R9.3). Lo común está en `shared.css` y `shared.js`.

**El selector de la maqueta** es la lengüeta oscura con la campana, arriba a la derecha, fuera del
diseño: Nada · Espera (se sabe cuánto falta) · Espera (no se sabe) · Versión nueva · Hay que
actualizar · Algo salió mal. También se abre directo con `#espera`, `#espera-sin`, `#version`,
`#bloqueo` o `#error` al final de la dirección. La lengüeta de más abajo es la del marco
(conexión), que sigue andando.

**La espera, igual en las tres:** a los 300 ms el botón tocado muestra su marca y no se puede volver
a tocar (ya existe, R7.2); a los 2 s aparece el aviso con qué se hace y cuánto falta (R7.3); al
terminar dice «Listo»/«Guardado» un instante y se va. Para verla de nuevo, tocá «Guardar» (Alt G).

## Las variantes

| | Idea en una frase | Ideas del catálogo |
|---|---|---|
| **1 · Evolución** | Cada aviso es una pieza conocida de «Mostrador» en su lugar de siempre: la espera es una línea arriba del área más una tarjeta chica abajo; la versión nueva, una tarjeta en la esquina con «Ahora no»; el bloqueo, un diálogo sin cruz; «Algo salió mal», un diálogo que muestra qué va en el aviso y un solo botón «Avisar y seguir». En el celular, todo abajo, bajo el pulgar, y los diálogos son hojas. | 1, 2, 3, 4, 5, 6, 7 |
| **2 · La isla** | Una sola pieza para los cuatro avisos: una cápsula oscura que vive siempre en el mismo lugar (abajo del área de trabajo) y crece desde donde estaba según lo que tiene que decir: chica para la espera, más larga para la versión nueva, una tarjeta para el error y todo el centro para el bloqueo. La persona aprende un solo lugar donde la aplicación le habla. | 1, 3, 5, 6, 8, 9, 10 |
| **3 · La persiana** | No flota nada sobre el trabajo: avisa el propio marco, como avisa un local. La espera corre por el borde del menú y la luz de conexión dice qué se hace; la versión nueva es una etiqueta de precio que cuelga del logotipo y se tira para cerrarla; el bloqueo es la persiana del negocio que baja sobre todo y se sube (con el botón o con el dedo) para actualizar; «Algo salió mal» corre tu pantalla a un costado, tal cual estaba, y esa pantalla en chico es la captura que va en el aviso. | 3, 4, 5, 11, 12, 13, 14, 15, 16 |

**Mi preferida: la 2, La isla.** Es la que mejor cumple «sin tapar el trabajo más de lo necesario»:
el tamaño del aviso es literalmente el tamaño del problema, y como siempre está en el mismo lugar y
se transforma en vez de aparecer, la persona con el cliente adelante no tiene que buscar nada ni
aprender cuatro formas. Abajo y bajo el pulgar en el celular, abajo del área en la computadora, sin
pisar el título ni las acciones de ninguna pantalla. La 1 es la apuesta segura y la más fácil de
leer; de la 3 me llevaría la pantalla que se corre a un costado en «Algo salió mal» (idea 13), que
prueba con los ojos que nada se perdió.

## Qué contradice una regla o queda fuera del capítulo

- **1 · Evolución:** nada. Suma (fuera del capítulo, sin contradecirlo): «Avisar y seguir» en un
  solo botón, el código del error y las versiones en el bloqueo («Tenés la 1.14 · el servidor está
  en la 1.16»).
- **2 · La isla:** usa pino lleno (oscuro) para todos los avisos, también el error y el bloqueo; el
  lenguaje deja lo oscuro solo para la cámara, la tostada y escanear, así que lo extiende: la isla es
  una tostada que crece. Cerrar la versión nueva es una × sin texto (R5.3 pide «una forma de
  cerrarlo»: se cumple). Los pasos del aviso se ven como una tira sin hora.
- **3 · La persiana:** **rompe la calma del lenguaje visual**: la persiana es un fondo metálico gris
  a pantalla completa, la etiqueta es ámbar (lo usa en grande, no en una pieza chica) y la espera
  pinta el borde del menú. La espera no aparece en el área de trabajo sino en el marco (R7.3 dice
  «una barra»: la barra es el borde del menú en la computadora y el borde de arriba del menú en el
  celular; el texto lo dice la luz, que por un rato deja de decir el estado de la conexión, que R4.1
  quiere siempre a la vista). Fuera del capítulo: **la nota de voz** en «Algo salió mal» (opcional,
  pero puede llevar datos de clientes que R9.4 y E54 no permiten mandar), **sacudir el celular para
  avisar** desde cualquier pantalla, y los gestos de tirar la etiqueta y subir la persiana con el
  dedo (se suman a los botones y al teclado, no los reemplazan). Depende de que la luz y el
  logotipo estén donde están en el marco agrandado: con el menú minimizado habría que moverlos.

## Movimiento por interacción

Solo `transform` y `opacity` (la barra avanza con `scaleX`/`scaleY`); con «reducir movimiento», nada
se mueve y todo aparece o se va en el lugar.

- **La espera (las tres):** el botón gira su marca a los 300 ms; a los 2 s el aviso sube 8 px con
  fundido (1), nace desde un punto con rebote (2) o la luz se da vuelta y el borde del menú se llena
  de arriba abajo (3). Si no se sabe cuánto falta, un trozo de barra va y viene. Se siente que la
  aplicación está trabajando, no colgada.
- **Versión nueva:** la tarjeta entra deslizando desde la derecha (1); la cápsula se estira desde la
  espera o desde un punto (2); la etiqueta cae y se hamaca en su hilo hasta quedarse quieta (3),
  y arrastrada se inclina siguiendo el dedo y sale volando si se la tira lejos. Llama la atención una
  vez y después se queda tranquila.
- **Actualizar (las tres):** el botón gira, la pantalla se funde al papel y vuelve en la misma parte
  con la tostada «Versión nueva. Seguís en Vender, como estabas.» En la 3, la persiana sube antes.
- **El bloqueo:** el velo se oscurece y el diálogo aparece desde 96 % (1); la isla se agranda hasta
  el centro (2); la persiana baja con su peso y rebota apenas al tocar el piso (3). Tocar afuera o
  Esc no lo cierran: el ícono se sacude (1 y 3) o la isla «respira» (2). Se siente firme, no roto.
- **Algo salió mal:** el diálogo o la hoja sube (1); la isla se abre en tarjeta (2); la pantalla se
  achica y se corre a un costado mientras el panel entra desde la derecha o desde abajo (3), y al
  volver la pantalla crece a su lugar. Al avisar, el tilde se dibuja (1), la isla vuelve a ser
  cápsula «Aviso guardado» (2) o sale la tostada (3), y lo de atrás hace un pulso corto: «sigue acá».

## Teclado (computadora)

Las teclas se ven solo con Alt apretado (R2.9) y valen solo las de lo que está encima (R2.10).
Versión nueva: Alt A actualiza, Esc o Alt C la cierran. Bloqueo: Enter o Alt A; Esc no cierra.
Algo salió mal: Enter o Alt V avisan y vuelven, Esc o Alt S vuelven sin avisar; en la 3, Alt Z graba
la voz. Guardar (lo de atrás): Alt G.

## Autocrítica

- Primera vuelta: en la 2 la isla arriba del área pisaba el cartel de pruebas y el título de
  cualquier pantalla; la bajé al pie del área en la computadora, igual que en el celular (mismo
  lugar en los dos).
- En la 3, el rótulo de la captura quedaba encima de la pantalla achicada; lo subí.
- En la 1, la tarjeta de espera partía «Guardando los cambios» en dos renglones; la ensanché.
- Lo más flojo que queda: en la 3 la etiqueta tapa un poco «Lo que estabas haciendo» en el celular;
  y en la 1, el error en el celular es una hoja alta (muestra dos pasos para no crecer más).

## Catálogo de ideas

1. **Línea o riel de avance en el borde del aviso.** La barra de R7.3 como una línea fina, no un
   bloque. Resuelve: saber que avanza sin leer. Variantes 1 y 2. Patrón: Safari, Linear. Ahorra
   0 toques. Dentro de las reglas.
2. **Tarjeta de espera abajo, centrada en el área.** Qué se hace + «Faltan 4 s» + barra. Resuelve:
   saber qué pasa sin que tape lo de arriba, donde se trabaja. Variante 1. Patrón: Google Drive al
   subir. Dentro.
3. **«Listo» al terminar.** El aviso de espera dice «Listo»/«Guardado» con tilde 1 s antes de irse.
   Resuelve: la duda de si terminó bien. Las tres. Patrón: Apple Pay. Fuera del capítulo (suma).
4. **«Ahora no» + tostada que explica.** Al cerrar la versión nueva, una tostada dice que no vuelve
   hasta abrir de nuevo (R5.4). Resuelve: el miedo a haber perdido la actualización. Variantes 1, 2
   y 3. Patrón: Chrome. Dentro.
5. **Volver a la misma parte, dicho.** Al actualizar, la tostada «Seguís en Vender, como estabas»
   (E30). Resuelve: la desconfianza a actualizar. Las tres. Patrón: Slack. Dentro.
6. **«Avisar y seguir» en un solo botón.** El botón principal avisa y vuelve; «Seguir sin avisar»
   es secundario. Resuelve: avisar sin pensar, con el cliente adelante. Ahorra 1 toque. Las tres.
   Patrón: Google (enviar comentarios). Fuera del capítulo (lo junta).
7. **Lo que va en el aviso, a la vista.** La captura en chico y los pasos con hora, y «sin datos de
   clientes ni tu sesión» (R9.4). Resuelve: confianza; la persona ve que no se manda nada suyo.
   Variantes 1 y 2 (y 3 con la pantalla real). Patrón: Android (informe de errores). Dentro.
8. **Un solo lugar para todos los avisos (la isla).** Una pieza que cambia de forma según la
   importancia, siempre en el mismo lugar. Resuelve: aprender cuatro avisos distintos. Variante 2.
   Patrón: Dynamic Island de iPhone. Fuera del capítulo (forma nueva).
9. **El aviso crece desde donde estaba.** Nunca aparece de la nada: se transforma (versión → espera
   de actualizar, error → «Aviso guardado»). Resuelve: no perder de vista qué pasó. Variante 2.
   Patrón: Dynamic Island, Apple Music. Dentro.
10. **Tocar la espera para saber más.** La cápsula se abre y explica qué se manda y qué queda quieto.
    Resuelve: la ansiedad cuando tarda. Variante 2. Patrón: Dynamic Island. Fuera (suma).
11. **La espera vive en el marco, no en el área.** El borde del menú es la barra y la luz dice qué se
    hace. Resuelve: no tapar nunca nada. Variante 3. Patrón: la barra de carga de las pestañas del
    navegador. Contradice R4.1 por un rato (la luz deja de decir la conexión).
12. **La etiqueta colgante de versión nueva.** Una etiqueta de precio que cuelga del logotipo, se
    hamaca al llegar y se tira afuera para cerrarla. Resuelve: avisar sin tapar el trabajo, con un
    objeto de la ferretería. Variante 3. Patrón: etiquetas de góndola; arrastrar para descartar de
    Tinder/Mail. Fuera (gesto nuevo, ámbar en grande).
13. **La pantalla da un paso al costado.** En «Algo salió mal», tu pantalla se achica a un costado,
    tal cual, y esa es la captura que va en el aviso; tocarla vuelve. Resuelve: ver con los ojos que
    nada se perdió (R9.3) y qué se manda (R9.4). Variante 3. Patrón: el selector de apps de iPhone.
    Fuera del capítulo (forma nueva).
14. **La persiana.** El bloqueo de R5.5 es la persiana del local que baja; se sube con el botón o
    con el dedo para actualizar. Resuelve: que se entienda sin leer que no se puede seguir y que es
    pasajero. Variante 3. Patrón: el cierre de un local. Rompe la calma (fondo metálico).
15. **Contarlo con la voz.** Una nota de voz opcional en el aviso de error. Resuelve: quien no sabe
    explicar por escrito qué pasó. Variante 3. Patrón: WhatsApp. Fuera del capítulo y choca con
    R9.4 (puede llevar datos de clientes).
16. **Sacudir el celular para avisar.** Desde cualquier pantalla, sin esperar un error. Resuelve:
    avisar algo raro que la aplicación no detectó. Variante 3. Patrón: Google Maps («sacudí para
    enviar comentarios»). Fuera del capítulo.
