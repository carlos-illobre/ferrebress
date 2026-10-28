# Entrar · Google cargando: notas del director de arte

Un estado de la entrada aprobada (`sign-in/adapted/`): el lugar del botón «Continuar con Google»
mientras Google lo dibuja. Lo demás de la entrada es la aprobada, copiada en `assets/`. Una sola
página por variante para los dos anchos, como la entrada: desde 900 px, la computadora; debajo, el
celular.

Comparaciones: `desktop-comparison.png` y `phone-comparison.png` (arriba la pantalla pasados 2 s,
debajo el lugar del botón en sus seis momentos). Capturas de cada variante: `screenshot.png`
(computadora) y `screenshot-phone.png` (celular).

## Cómo mirarlas

Abajo a la izquierda, en las herramientas de la maqueta:

- **Google**: «En vivo» con Google que tarda 3 s (la que abre por omisión), 1,2 s, 0,2 s o que no
  carga; o «Fijo» en cada momento: vacío, cargando, pasados 2 s, el botón y no cargó.
- **Repetir**: vuelve a correr el momento en vivo desde cero. Al lado, el reloj dice cuánto pasó.
- **Estado**: los de la entrada; «Sin conexión» muestra qué pasa con el lugar sin internet.
- En la 3, **Cuál es cuál** marca si se ve el botón propio o el de Google.

## Lo que vale para las tres

- **El lugar lo mide el botón de Google, no la espera:** 44 px de alto en la computadora, 40 px en
  el celular, el ancho de la columna hasta 400 px, centrado. Lo que se muestra mientras tanto ocupa
  exactamente ese lugar: cuando Google llega, nada de la entrada se mueve.
- **El botón de Google** está dibujado como lo dibuja Google en su tema blanco: fondo blanco, borde
  gris, la G de colores y «Continuar con Google», redondeado.
- **Los tiempos (00 · R7):** antes de 300 ms no se ve nada (casi siempre Google llega antes); pasados
  300 ms, la marca de espera; pasados 2 s, una frase que dice qué hace. No se sabe cuánto falta, así
  que no se dice.
- **Si Google no carga:** a los 8 s se da por no cargado y la espera se apaga: el lugar pasa a decir
  que Google no respondió y se vuelve un botón «Reintentar», que lo pide de nuevo (en la maqueta,
  esta vez llega a 1,2 s). Las otras formas de entrar (el QR, la huella) siguen andando, por eso es
  un aviso tranquilo y no un error.
- **Sin conexión:** Google no puede cargar; el lugar dice que necesita internet (junto al aviso de
  la entrada, «Para entrar hace falta internet»). Al volver la conexión, se pide de nuevo solo.
- **La transición la hace el contenedor:** el botón de Google vive en su propio marco, que no se
  puede animar por dentro; la maqueta anima el contenedor (opacidad y escala), que es lo único que
  se podrá animar en la aplicación.

## Las variantes

### 1 · El molde (la evolución)

**La idea:** el lugar muestra el esqueleto del botón (el círculo de la G y la raya del texto) con un
brillo que lo cruza; pasados 2 s, la raya se vuelve «Cargando Google…»; cuando llega Google, el
botón se revela en el mismo molde. Ideas: 1, 2, 5, 6, 8.

- Aparece (300 ms): el molde, con un fundido de 200 ms. Se siente como «acá va algo».
- Brillo: una franja blanca cruza el molde cada 1,4 s, solo sobre lo gris. Calma, no ansiedad.
- Pasados 2 s: la raya se funde en la frase, en el lugar exacto donde va a estar el texto de Google.
- Llega Google: el molde se apaga en 160 ms y el botón pasa de 98 % a 100 % con un fundido; la G
  llega con un rebote corto. Se siente como una foto que se termina de revelar.
- No cargó: el brillo se detiene y el molde se vuelve un botón propio: «Google no cargó ·
  Reintentar», con el ícono de volver a intentar en pino.

### 2 · El hilo (la reinvención: lo mínimo)

**La idea:** el lugar casi vacío: solo una línea fina donde va a estar el botón, con un tramo pino
que la recorre; pasados 2 s, la línea baja y arriba aparece «Conectando con Google…» con la G; cuando
llega Google, la línea se completa de punta a punta y el botón se infla desde ella. Ideas: 1, 3, 4,
5, 6, 8.

- Aparece (300 ms): la línea se estira desde el centro hacia los lados (escala horizontal, 360 ms).
- Mientras: un tramo pino corre de izquierda a derecha cada 1,2 s.
- Pasados 2 s: la línea baja 12 px y la frase sube con un fundido; se siente que la espera «habla».
- Llega Google: el tramo se completa (200 ms), la línea vuelve al centro y el botón se infla desde
  ella (escala vertical de 8 % a 100 %, 300 ms). Se siente que la línea era el botón dormido.
- No cargó: la línea queda quieta en ámbar y la frase es el botón: «Google no responde ·
  Reintentar».

### 3 · El suplente (la que nadie se animaría)

**La idea:** no hay espera a la vista: desde el primer instante Ferrebress dibuja su propio botón,
idéntico al de Google, y cuando el de Google llega lo reemplaza por debajo sin que se note. La espera
existe solo si la persona toca antes de que Google llegue: la G se rodea de un anillo de cuatro
colores que gira, «Abriendo Google…», y en cuanto Google llega se abre la ventana de Google sola.
Ideas: 7, 9, 10, 11.

- Quieto: el botón está; nada se mueve. Si Google llega sin que se toque, el cambio dura 120 ms y es
  invisible (con «Cuál es cuál» se ve).
- Tocar antes de que llegue: el botón baja a 98,5 % (120 ms); pasados 300 ms, el anillo de colores
  rodea la G y gira (900 ms por vuelta) y el texto pasa a «Abriendo Google…»; pasados 2 s, «Google
  tarda un poco más…». Se siente que el toque se registró y que no hay que volver a tocar.
- Llega Google con el toque pendiente: se abre la ventana de Google sola.
- No cargó: el fallo se muestra recién al tocar: un sacudón corto (360 ms), fondo ámbar suave y
  «Google no responde · Reintentar». Si nadie toca, nadie se entera.

**Qué rompe:** R2.1 de 01 dice que el botón es el de Google, dibujado en su propio marco; acá, hasta
que Google llega, el que se ve y se toca es uno propio que lo imita. Además, para que el botón propio
pueda abrir Google, la aplicación tendría que pedir la cuenta de otra forma que con el botón de
Google (no es tema del arte, pero lo cambia). Y los tiempos de 00 · R7 se cumplen, pero cuentan desde
el toque y no desde que se abre la entrada. Las reglas de marca de Google piden que un botón propio
siga su guía al pie de la letra.

## La que prefiero

**La 1, El molde.** Es la única que, en los 300 ms a 3 s en que se ve, ya dice qué va ahí: el
molde tiene la forma, el lugar de la G y del texto del botón que viene, así que cuando Google llega
no hay sorpresa y nada parece cambiar de lugar. Es la más calma y la que mejor se lleva con el resto
de la entrada; el fallo se vuelve un botón propio en el mismo molde. La 2 es más liviana pero, antes
de los 2 s, una línea sola puede leerse como un separador más (sobre todo en el celular, donde queda
cerca de la «o»). La 3 es la mejor experiencia (cero espera) pero rompe R2.1 y cambia cómo se entra
con Google: la dejo para que Carlos la mire.

## Autocrítica

- Primera captura: el molde de la 1 casi no se veía sobre el blanco (gris `--relleno`); lo pasé al
  gris un punto más fuerte (`#E3DFD5`, el `--hundido-2` de «Mostrador»). Corregido.
- Primera comparación: los recortes de cada momento tomaban el lugar de la captura sin conexión,
  que está más abajo por el aviso; ahora cada recorte usa su propio lugar. Corregido.
- Queda flojo: en la 2, en el celular, la línea queda a 24 px de la línea de la «o»: dos rayas
  parecidas, una arriba de la otra. Si se elige la 2, el tramo pino tendría que ser más grueso o la
  «o» más separada.
- Queda flojo: el «Google no cargó» de la 1 y la 2 no dice qué hacer mientras tanto (entrar con el QR
  o la huella); no entra en 44 px sin achicar la letra.

## Catálogo de ideas

1. **El lugar medido por el botón final.** Qué: el contenedor tiene el alto y ancho del botón de
   Google desde el principio. Resuelve: que la entrada salte cuando Google llega. Variantes: 1, 2, 3.
   Patrón: los esqueletos de LinkedIn y YouTube. Toques: 0, evita tocar algo que se movió. Dentro de
   las reglas.
2. **Esqueleto del botón con brillo.** Qué: círculo de la G y raya del texto en gris, con una franja
   que los cruza. Resuelve: que el lugar vacío parezca roto. Variantes: 1. Patrón: Facebook, Linear.
   Toques: 0. Dentro de las reglas.
3. **Hilo de progreso en el lugar.** Qué: una línea fina con un tramo que corre, donde va a estar el
   botón. Resuelve: mostrar la espera con lo mínimo. Variantes: 2. Patrón: la barra fina de Material,
   de YouTube y de GitHub. Toques: 0. Dentro de las reglas.
4. **El botón se infla desde el hilo.** Qué: al llegar, el botón crece en vertical desde la línea.
   Resuelve: que se entienda que la espera era el botón. Variantes: 2. Patrón: los menús de Material
   que se despliegan desde su origen. Toques: 0. Dentro de las reglas.
5. **La frase de los 2 s en el lugar del texto.** Qué: pasados 2 s, «Cargando Google…» o «Conectando
   con Google…» donde va a estar «Continuar con Google». Resuelve: 00 · R7.3 sin agregar una barra
   que mueva la pantalla. Variantes: 1, 2. Patrón: los botones de Stripe Checkout que dicen qué hacen.
   Toques: 0. Dentro de las reglas (la barra de R7.3 queda dentro del lugar del botón).
6. **Reintentar en el mismo lugar.** Qué: si Google no llega a los 8 s, el lugar se vuelve un botón
   «Reintentar». Resuelve: que la espera no quede para siempre y que haya algo que hacer. Variantes:
   1, 2 (en la 3, al tocar). Patrón: las imágenes que no cargan en Slack y WhatsApp. Toques: ahorra
   recargar la página entera (1 toque en lugar de recargar y esperar todo de nuevo). Dentro de las
   reglas; el tiempo de 8 s lo decide Carlos.
7. **Sin conexión, el lugar lo dice.** Qué: sin internet, el lugar dice que Google la necesita y se
   pide solo al volver. Resuelve: un hueco sin explicación en el peor momento. Variantes: 1, 2 (en la
   3, el botón apagado como los demás). Patrón: Google Docs sin conexión. Toques: 0. Dentro de las
   reglas (E19).
8. **La G llega con un rebote corto.** Qué: al aparecer el botón, la G crece de 60 % a 100 % con
   rebote. Resuelve: que el cambio se note sin mover nada. Variantes: 1. Patrón: los íconos de
   Apple Wallet al agregar una tarjeta. Toques: 0. Dentro de las reglas.
9. **El botón suplente.** Qué: un botón propio idéntico al de Google desde el primer instante, que se
   cambia por el de Google sin que se note. Resuelve: la espera deja de existir para casi todos.
   Variantes: 3. Patrón: las fachadas de los videos de YouTube incrustados (se ve una imagen hasta que
   se toca) y el «lite-youtube». Toques: 0, y ahorra esperar para tocar. **Fuera de las reglas**
   (R2.1).
10. **El toque se guarda.** Qué: si se toca antes de que Google llegue, el pedido queda pendiente y
    se abre Google solo al llegar. Resuelve: tocar dos veces o tocar y que no pase nada. Variantes: 3.
    Patrón: los botones de pago de Shopify que toman el toque mientras cargan. Toques: ahorra 1 (el
    segundo toque). **Fuera de las reglas** (R2.1).
11. **El anillo de colores de Google como espera.** Qué: después del toque, un anillo de los cuatro
    colores de Google gira alrededor de la G. Resuelve: que la espera se lea como «Google está
    trabajando», no Ferrebress. Variantes: 3. Patrón: el indicador de carga de las apps de Google.
    Toques: 0. Dentro de las reglas, pero depende de la idea 9.
