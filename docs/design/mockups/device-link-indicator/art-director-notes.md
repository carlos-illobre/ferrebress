# El indicador del vínculo: tres ideas para Carlos

Capturas lado a lado: `desktop-comparison.png` y `phone-comparison.png`. Cada variante se abre sola
desde su `index.html`. Usan `../../../../common/` (lenguaje «Mostrador», logotipo, isotipo, íconos) y
`../../shared/`, la carpeta de esta pantalla: `link.js` (los seis estados, sus textos, los botones de
cada estado, un código QR de mentira que se renueva, la tostada), `route.js`/`route.css` (la ruta
dibujada), `island.js`/`island.css` (la variante 2), `frame.css` (el marco de hoy), `icons-extra.js`
(22 íconos de Lucide 0.460 que `common/` no tiene) y `shop.webp` (la foto del local para la cámara,
copiada de la maqueta vieja de vincular).

**Para recorrer los estados:** cada maqueta tiene a la derecha una manija gris («Maqueta · estado»,
fuera del diseño) que pasa entre Sin vincular, Directo, Por el servidor, Desconectado, Esperando y Sin
internet. También se puede abrir con `?estado=servidor` (o `sin`, `desconectado`, `esperando`,
`sininternet`). «Probar conexión directa» falla la primera vez y anda la segunda (E19). El área de
trabajo queda vacía a propósito: esta maqueta es solo del indicador.

El caso: Rubén Paredes, Administrador; la computadora es «Chrome en Windows» y el celular «Chrome en
Android»; vinculados desde ayer, lunes 2 de noviembre, a las 8:14; si no se usan juntos, el vínculo
dura hasta el jueves 3 de diciembre. Al reemplazar desde el celular aparece «Edge en Windows».

## Las tres variantes

| | La idea en una frase | Ideas del catálogo |
|---|---|---|
| **1 · La ficha** (evolución) | El indicador queda donde lo pone el marco (el pie del lateral en la computadora, una pastilla en la cabecera del celular) y al tocarlo se abre una ficha: la ruta dibujada, el estado en una frase, con qué, desde cuándo y hasta cuándo, y los botones de ese estado, con la acción principal en naranja. «Vincular el celular» muestra el código en la misma ficha. | 1, 2, 3, 4, 5, 6, 7, 8 |
| **2 · La isla** (reinvención) | El indicador es una isla oscura arriba al centro, igual en los dos dispositivos. Cuando el estado cambia, se agranda sola y lo cuenta («Por el servidor · Probar»), y se vuelve a achicar. Abierta es un centro de control: el espejo es un interruptor, «Probar» es un botón redondo, desvincular se mantiene apretado y el día se ve en una tira. El código y la cámara aparecen dentro de la isla. | 1, 9, 10, 11, 12, 13, 14, 15 |
| **3 · El cable** (la que nadie se animaría) | El vínculo es un cable de verdad. En la computadora corre por el pie del área de trabajo hasta un celular que asoma por el borde. En el celular cuelga de arriba con una etiqueta. Su forma es el estado: verde lleno, ámbar con un desvío por la nube, a rayas, cortado o suelto, con los toques viajando a su velocidad real. Se desenchufa arrastrando el enchufe, la conexión directa se prueba tocando la nube y se desvincula cruzando el cable con el dedo (con «Deshacer»). El detalle es una escena oscura con los números: cuánto tarda un toque, cuántos MB de internet usó hoy y cuántos días le quedan. | 1, 16, 17, 18, 19, 20, 21, 22 |

### Qué rompe cada una

- **1 · La ficha:** casi nada. En la computadora suma un bloque nuevo al pie del lateral, encima de la
  luz de conexión. En el celular, la pastilla del indicador ocupa la cabecera entre el logotipo y la
  persona. La ruta dibujada y la barra de 30 días no están en las reglas.
- **2 · La isla:**
  - **El lugar del indicador:** lo saca del lateral y de la cabecera (marco) y lo pone flotando
    arriba al centro.
  - **Lo oscuro:** usa un elemento oscuro siempre a la vista, y el lenguaje reserva lo oscuro para la
    cámara y las tostadas.
  - **Desvincular:** se confirma manteniendo apretado 1,2 s, en lugar de una pregunta. R5.3 pide
    confirmación y esta es otra forma de pedirla.
  - **El aviso vivo:** la isla se agranda sola cuando el estado cambia, y eso no está en las reglas.
  - **La tira del día** («2 h 17 min juntos, 92 % directo»): guarda en el dispositivo los cambios
    entre directo y servidor. No es la auditoría (R8.2 no se toca), pero es un dato que hoy no existe.
- **3 · El cable:**
  - **El indicador:** R4.1 pide un punto y un texto, y acá el indicador es un dibujo. El texto queda
    chico, al lado del cable.
  - **El área de trabajo:** el cable le quita 80 px abajo en la computadora.
  - **La escena:** es oscura, de pantalla entera, y en el celular tapa el menú de abajo.
  - **Los gestos:** son la forma principal de usarlo. En la computadora están los botones y las teclas.
  - **Desvincular:** no pregunta. Se corta y queda «Deshacer» 5 segundos, y R5.3 pide confirmación.
  - **Los números:** los MB de internet usados y los toques que viajan son datos que hoy no se miden.
  - **El celular que asoma:** en la computadora hay un teléfono dibujado que no es parte del marco.

## La que más me gusta

**La 1 en la computadora, con el aviso vivo de la 2 (idea 9).** La ficha resuelve todo lo que piden
las reglas en un solo lugar y con un toque. La ruta dibujada explica en un vistazo la diferencia
entre «Directo» y «Por el servidor», que en texto es abstracta para alguien del mostrador: una línea
verde corta contra un desvío ámbar por la nube. Lo que le falta a la 1 es que la persona se entere
cuando algo cambia sin tener que mirar el pie del lateral, y eso lo resuelve la idea 9: el indicador
se agranda dos segundos y lo cuenta.

En el celular, la isla (2) es la mejor: queda bajo el pulgar al bajar la vista, es la misma pieza en
todas las pantallas y la cámara dentro de la isla evita una pantalla entera para leer un código.

## Movimiento, por interacción

- **Abrir la ficha (1, computadora):** se corre 12 px desde el lateral y aparece (320 ms, `--curva`).
  Se siente pegada al indicador, como un globo de diálogo.
- **Abrir la hoja (1, celular):** sube desde abajo (320 ms) y el fondo se oscurece al 30 %. Se cierra
  deslizándola hacia abajo.
- **Cambia el estado:** el texto del indicador entra desde 4 px abajo, con fundido. Con «Directo» el
  punto late cada 2,4 s; con «Esperando» es un aro que late cada 1,6 s.
- **La ruta:** los toques son puntos que viajan por el cable, rápido en directo (1,1 s) y lento con
  desvío por la nube en el servidor (3,4 s). El dispositivo dormido se apaga y se prende.
- **Pasar al código:** la ficha se desliza a la izquierda (320 ms). La barra de 60 s se vacía de a
  segundo; al renovarse, el código se achica, desaparece y entra el nuevo (200 ms).
- **El celular lee el código:** las cuatro esquinas del visor se cierran sobre el código, se pintan
  de verde con rebote (200 ms) y vibra 10-40-10. En la computadora, el código se vuelve un tilde que
  se dibuja (300 ms).
- **Probar conexión directa:** el ícono gira mientras prueba. Si no se pudo, el aviso tiembla
  (360 ms); si se pudo, la ruta pasa a verde y se acorta.
- **La isla (2):** abierta, crece desde la píldora hacia abajo (de escala 0,4 × 0,12 a 1, 320 ms). El
  aviso vivo crece con rebote, dura 3,2 s y se achica. Al mantener «Desvincular», la tecla se llena
  de rojo desde abajo en 1,2 s y el círculo se hunde a 90 %.
- **El cable (3):** la etiqueta del celular se balancea al cambiar de estado (900 ms, rebote). La
  escena sube desde el pie en la computadora y baja como una cortina en el celular (320 ms). El
  enchufe sigue al dedo y vuelve con rebote.

## Autocrítica (corregido antes de mostrar)

- **1, computadora:**
  - Los nombres de los dispositivos se partían en tres renglones; las columnas de la ruta pasaron
    de 72 a 96 px.
  - Los botones se partían en dos filas desparejas; ahora la acción principal va en naranja, ancha,
    y las demás son renglones de menú con su tecla a la derecha.
  - Se repetía «Desde» en la etiqueta y en el valor.
  - La tecla Alt L le quitaba lugar al texto del indicador; pasó a una esquina.
- **1, celular:** la manija de la maqueta tapaba la hoja; se movió.
- **2:**
  - En el celular, «Desvincular» no entraba en cuatro columnas; las teclas pasaron a 2 × 2, con el
    ícono a la izquierda.
  - Sin vínculo, la frase se repetía dos veces.
  - El título de la isla seguía diciendo el estado mientras mostraba el código.
- **3:**
  - En el celular, la pista se montaba sobre los números; se subió el dibujo.
  - El encabezado no se podía tocar porque el dibujo estaba encima.
  - Con «Desconectado» el título se partía.
- **Las tres:**
  - La tostada tapaba los botones de la hoja en el celular; ahora no recibe toques, salvo
    «Deshacer».
  - La vibración daba un error en la consola si todavía no se había tocado la pantalla.
- **Lo más flojo que queda:**
  - En la computadora, el cable de la 3 compite con el contenido por el pie de la pantalla.
  - Con «Sin vincular», el enchufe suelto queda medio cortado por el borde.
  - Los dibujos de la computadora y el celular son planos: una foto recortada de un monitor y de un
    teléfono lo harían más rico.

## Catálogo de ideas

Cada idea se puede tomar sola. «Toques» cuenta lo que ahorra contra abrir el detalle y tocar el botón
(dos toques).

1. **La ruta dibujada.**
   - **Qué es:** los dos dispositivos con una línea que es el estado: verde llena, ámbar con desvío
     por la nube, cortada, punteada con el otro apagado o roja a rayas; con los milisegundos encima.
   - **Qué resuelve:** que «Directo» o «Por el servidor» se entienda sin saber de redes.
   - **Dónde:** 1, 2 y 3.
   - **Patrón de:** el mapa de red de los routers Eero o Google Wifi.
   - **Toques:** no ahorra.
   - **Reglas:** dentro (amplía R4.2).
2. **El indicador como renglón** del pie del lateral.
   - **Qué es:** ícono del celular con el punto de color, el estado en negrita y el nombre del
     dispositivo debajo.
   - **Qué resuelve:** se lee qué celular es sin abrir nada.
   - **Dónde:** 1.
   - **Patrón de:** la barra «Conectado a…» de Spotify.
   - **Toques:** no ahorra.
   - **Reglas:** dentro.
3. **Una sola acción principal por estado,** en naranja.
   - **Qué es:** Sin vincular → Vincular o Leer el código; Por el servidor → Probar conexión directa;
     Desconectado → Reconectar. Las demás, como renglones de menú.
   - **Qué resuelve:** se sabe qué hacer sin leer.
   - **Dónde:** 1 y 3.
   - **Patrón de:** Shopify POS.
   - **Toques:** no ahorra.
   - **Reglas:** dentro.
4. **La barra de los 30 días.**
   - **Qué es:** «30 de 30 días», que vuelve a llenarse cada vez que se usan juntos.
   - **Qué resuelve:** que se entienda que el vínculo no vence si se usa (R2.2).
   - **Dónde:** 1 y 3.
   - **Patrón de:** el vencimiento de las tarjetas de Wallet.
   - **Toques:** no ahorra.
   - **Reglas:** dentro.
5. **El código en la misma ficha,** con una barra de 60 s, «Sirve una vez» y tres pasos.
   - **Qué resuelve:** no se pierde el lugar, y se ve cuándo cambia el código.
   - **Dónde:** 1.
   - **Patrón de:** el emparejamiento de WhatsApp Web.
   - **Toques:** no ahorra.
   - **Reglas:** dentro.
6. **El aviso de reemplazo dentro del código,** en la computadora: «Si lo lee otro celular, lo
   reemplaza».
   - **Qué resuelve:** que nadie se sorprenda.
   - **Dónde:** 1 y 2.
   - **Patrón de:** iOS, al emparejar un reloj.
   - **Toques:** no ahorra.
   - **Reglas:** dentro (R1.4 lo pregunta el celular; esto avisa antes).
7. **Las teclas dentro de la ficha:** Alt L abre; una letra por botón (D, R, P, V, X); Esc vuelve.
   - **Qué resuelve:** el mostrador sin mouse.
   - **Dónde:** 1, 2 y 3.
   - **Patrón de:** Linear.
   - **Toques:** 1 tecla en vez de 2 clics.
   - **Reglas:** dentro.
8. **Cerrar la hoja deslizándola hacia abajo.**
   - **Qué resuelve:** se usa con una mano.
   - **Dónde:** 1, celular.
   - **Patrón de:** las hojas de iOS.
   - **Toques:** no ahorra.
   - **Reglas:** dentro.
9. **El aviso vivo.**
   - **Qué es:** cuando el estado cambia solo, el indicador se agranda unos 3 s con el estado, una
     frase y la acción que corresponde («Desconectado · Reconectar»).
   - **Qué resuelve:** enterarse en el momento sin mirar el indicador.
   - **Dónde:** 2.
   - **Patrón de:** las actividades en vivo de la Dynamic Island.
   - **Toques:** 1, porque la acción está en el aviso.
   - **Reglas:** fuera.
10. **El indicador arriba al centro, el mismo en los dos dispositivos.**
    - **Qué resuelve:** se busca en un solo lugar.
    - **Dónde:** 2.
    - **Patrón de:** la Dynamic Island.
    - **Toques:** no ahorra.
    - **Reglas:** fuera del marco.
11. **El espejo como interruptor.**
    - **Qué es:** «Desconectar» y «Reconectar» son un solo control prendido o apagado.
    - **Qué resuelve:** se ve el estado y se cambia en el mismo lugar.
    - **Dónde:** 2.
    - **Patrón de:** el centro de control de iOS.
    - **Toques:** no ahorra.
    - **Reglas:** dentro.
12. **Mantener apretado para desvincular** (1,2 s, la tecla se llena de rojo), en vez de una pregunta.
    - **Qué resuelve:** confirma con un solo gesto y no se dispara sin querer.
    - **Dónde:** 2.
    - **Patrón de:** el «Mantené para apagar» de Apple Watch.
    - **Toques:** 1.
    - **Reglas:** fuera (R5.3 pide confirmación).
13. **La tira del día:** de 8 a ahora, los tramos verdes, ámbar y grises, con «2 h 17 min juntos ·
    92 % directo».
    - **Qué resuelve:** se ve si la red falla seguido y vale la pena revisar el Wi-Fi.
    - **Dónde:** 2.
    - **Patrón de:** el tiempo en pantalla de iOS.
    - **Toques:** no ahorra.
    - **Reglas:** fuera (es un dato nuevo, guardado en el dispositivo).
14. **La cámara dentro del indicador:** «Leer» abre el visor dentro de la isla, sin pantalla completa.
    - **Qué resuelve:** no se pierde de vista dónde se estaba.
    - **Dónde:** 2, celular.
    - **Patrón de:** la Dynamic Island.
    - **Toques:** no ahorra.
    - **Reglas:** dentro.
15. **El reemplazo dentro de la isla:** la pregunta de R1.4 aparece en la misma pieza.
    - **Qué resuelve:** continuidad.
    - **Dónde:** 2.
    - **Patrón de:** iOS.
    - **Toques:** no ahorra.
    - **Reglas:** dentro.
16. **El cable como indicador:** su forma y su color son el estado, siempre a la vista.
    - **Qué resuelve:** que se entienda sin leer.
    - **Dónde:** 3.
    - **Patrón de:** los juguetes físicos, como Teenage Engineering.
    - **Toques:** no ahorra.
    - **Reglas:** fuera (R4.1).
17. **Los toques que viajan** por el cable a su velocidad real (12 ms o 180 ms).
    - **Qué resuelve:** que se sienta que el servidor tarda más.
    - **Dónde:** 2 y 3.
    - **Patrón de:** los mapas de red animados.
    - **Toques:** no ahorra.
    - **Reglas:** dentro.
18. **Desenchufar y enchufar arrastrando:** el enchufe hacia afuera desconecta y hacia adentro
    reconecta; también se toca.
    - **Qué resuelve:** el gesto dice lo que hace.
    - **Dónde:** 3.
    - **Patrón de:** los cables de Origami o de Max/MSP.
    - **Toques:** 1, sin abrir el detalle.
    - **Reglas:** dentro.
19. **Tocar la nube para probar la conexión directa:** si anda, el cable se acorta.
    - **Qué resuelve:** que se entienda qué se prueba.
    - **Dónde:** 3.
    - **Patrón de:** manipular directamente lo que se ve.
    - **Toques:** 1.
    - **Reglas:** dentro.
20. **Cortar el cable para desvincular:** un trazo que lo cruza, con «Deshacer» 5 s.
    - **Qué resuelve:** es rápido y se puede arrepentir.
    - **Dónde:** 3.
    - **Patrón de:** el «Deshacer envío» de Gmail.
    - **Toques:** 2.
    - **Reglas:** fuera (R5.3 pide confirmación).
21. **Los números del vínculo:** cuánto tarda un toque, cuántos MB de internet usó hoy el espejo,
    cuánto tiempo estuvieron juntos y cuántos días quedan.
    - **Qué resuelve:** muestra el ahorro de datos, que es lo que más pesa en el capítulo.
    - **Dónde:** 3.
    - **Patrón de:** el uso de datos de Android.
    - **Toques:** no ahorra.
    - **Reglas:** fuera (los MB no se miden hoy).
22. **El código en el lugar del celular:** en la escena, «Vincular» pone el QR donde va el teléfono.
    En el celular, la cámara aparece donde está la compu.
    - **Qué resuelve:** que se entienda qué se está juntando con qué.
    - **Dónde:** 3.
    - **Patrón de:** propio.
    - **Toques:** no ahorra.
    - **Reglas:** dentro.
