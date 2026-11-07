# Más → Administración · Ajustes para todos: tres ideas para Carlos

Capturas lado a lado: `desktop-comparison.png` y `phone-comparison.png`. Cada variante se abre sola
desde su `index.html`. La de la computadora y la del celular son el mismo archivo (debajo de 900 px
se arma el celular). Usan `../../../../common/` y `../../shared/` (lo común, más una hoja y un
programa por variante).

Todas muestran el mismo caso: los valores de arranque (redondeo $ 1.000; márgenes 300, 200, 100, 50
y 25 %; 60 minutos sin uso; tope de 8 horas; 30 días de vínculo), 3.486 precios guardados y Rubén
Paredes, Administrador, mirando. El botón **Casos**, abajo a la derecha, no es parte de la pantalla:
cambia quién mira (Marta, Vendedora, sin el permiso; Rubén, y le quitan el permiso a mitad), la
conexión (sin conexión con lo último que se vio, o sin haberla abierto nunca), que Hugo cambie lo
mismo antes (R2.3), que el recálculo del redondeo falle (R3.5), el formato de la hora y las
animaciones.

**Lo que no cambia en ninguna:** se guarda al tocar, sin «Guardar»; abajo, lo que cambió con
«Deshacer» 5 segundos (y Ctrl Z); el redondeo, en cambio, muestra cuántos precios cambian, con tres
productos de ejemplo, se confirma y no tiene «Deshacer»; si el recálculo falla, no cambia nada y
ofrece «Reintentar». Un valor que no vale se dice en el lugar («Entre 1 y 365 días», «Ya hay un
margen rápido de 200 %») y la caja tiembla. Los márgenes se ordenan solos y se ve a cada uno volar a
su lugar. La zona horaria se ve con la hora del negocio, sin poder tocarla. Sin el permiso, todo se
ve y nada se toca, con el aviso arriba de qué permiso falta y quién lo tiene. Sin conexión, gris con
«Reintentar». Los cuántos precios cambian por paso son inventados: los daría el servidor.

## Las variantes

| | Idea en una frase | Ideas del catálogo |
|---|---|---|
| **1 · Los renglones** (evolución) | Las reglas tal cual, al nivel de Ajustes de un iPhone: tres grupos de renglones con su control a la vista (pasos, teclas, − n +), el ejemplo del redondeo en vivo y, al lado, los últimos cambios de Quién hizo qué. | 1, 2, 3, 4, 5, 6, 7, 8, 9 |
| **2 · Probar antes de elegir** (reinvención) | Una lista corta a la izquierda y un escenario a la derecha: cada opción dice su efecto antes de tocarla (cuántos precios cambian, cinco productos con su precio nuevo, un día de mostrador con la sesión, el calendario del vínculo). En el celular, un ajuste por pantalla y se pasa deslizando. | 2, 3, 6, 10, 11, 12, 13, 14, 15, 16 |
| **3 · El ticket de la casa** (la que nadie se animaría) | Las reglas del negocio impresas en un solo ticket largo: se cambian tocando el valor subrayado o diciéndolo («vínculo 15 días», «margen 100 por 150»), y cada cambio se imprime al pie con su «Deshacer». | 3, 6, 17, 18, 19, 20, 21, 22 |

**Qué rompe cada una**

- **1:** nada de las reglas. Suma a la pantalla los últimos cambios, que viven en Quién hizo qué.
- **2:** la sesión se muestra como un solo escenario con sus dos tiempos (son dos ajustes); el
  escenario es un panel más alto que una tarjeta (sombra 2). En el celular no hay lista: hay tiras
  arriba y gesto de deslizar.
- **3:** el marco: el lateral minimizado, sin cabecera ni título de 28 px, sin tarjetas; el título
  es de 40 px. En la computadora «Deshacer» no está en el aviso de abajo (R2.1) sino impreso en la
  línea del cambio. Suma la voz y órdenes escritas, que las reglas no piden. La historia de cambios
  va dentro de la pantalla.

## Cuál me gusta más

**La 2, Probar antes de elegir.** Esta pantalla se toca pocas veces y casi siempre con miedo: «si
paso el redondeo a $ 500, ¿qué le pasa al martillo?». La 2 contesta eso antes de tocar: pasar el
mouse por un paso muestra el precio nuevo de cinco productos reales y cuántos cambian, y la jornada
de mostrador explica en una frase qué hace «30 minutos sin uso» con el almuerzo. Es la única en la
que Marta, que no puede cambiar nada, también entiende algo útil. Si Carlos la quiere más quieta,
la 1 es la base segura; de la 3 rescataría la línea de los cambios impresa al pie (idea 19).

## Cómo se mueve (una línea por interacción)

- **Elegir un paso o un tiempo (1):** la ficha blanca se desliza al elegido (200 ms, `--curva`);
  el renglón brilla verde 1 s; el aviso sube de abajo; en el celular vibra 10 ms. Se siente firme.
- **Confirmar el redondeo:** la hoja sube (320 ms); al confirmar, una barra pino se llena mientras
  «Recalculando 1.650 precios…»; si falla, se queda a 62 % y aparece «No se pudo». Se siente serio.
- **Deshacer:** una línea fina se vacía en 5 s debajo del aviso; tocarlo lo cierra y el valor
  vuelve. Se siente que hay red debajo.
- **Cambiar un margen:** al soltar, las cajas vuelan a su lugar nuevo con un rebote corto (320 ms).
  Se ve que «se ordenan solos».
- **Un valor que no vale:** la caja se pone roja y tiembla 3 px; el motivo entra debajo.
- **− y + del vínculo (1):** el número rueda arriba o abajo; a los 700 ms del último toque, se guarda.
- **Mirar una opción (2):** los precios que cambian se tiñen de naranja y sus números ruedan; los
  marcadores de la jornada se deslizan a su hora nueva (320 ms). Nada se guarda hasta el clic.
- **Pasar de ajuste (2):** en la computadora, el escenario entra con un fundido de 8 px; en el
  celular, deslizar lo empuja 40 px hacia el lado del gesto.
- **Arrastrar los días (2):** el calendario de semanas se pinta en vivo y la fecha de vencimiento
  cambia; se guarda al soltar.
- **Imprimir un cambio (3):** la línea nueva baja al pie del ticket a saltos (420 ms, `steps(6)`),
  como una impresora térmica; el rollo se corre solo hasta ella.
- **Hablar (3):** el botón del micrófono late y aparecen seis barras que suben y bajan; a los 1,6 s
  se escribe la frase entendida y se aplica.
- Con «reducir movimiento» o las animaciones apagadas, nada se mueve.

## Autocrítica (lo que corregí después de la primera captura)

- 1: las dos columnas quedaban desparejas (los cambios colgaban a la derecha); los pasé abajo de
  Precios. Las cajas de los márgenes cortaban el «%»: la tecla pasó a una insignia arriba.
- 2: el número grande y las pastillas «de arranque» se partían en dos líneas; las opciones del
  redondeo decían «3.412 cambian» en dos renglones: quedó solo el número, con el título que explica.
  Las líneas de la jornada atravesaban las frases de abajo; los rótulos «Se cierra» y «Tope» se
  pisaban en el celular.
- 3: las fechas de la cinta salían como «28» y «2»; ahora «28/10», «2/11». Los dos sellos (sin
  permiso y sin conexión) se apilaban.
- Queda flojo: en la 1 del celular los siete pasos del redondeo van en dos filas (4 + 3); en la 3
  la voz es simulada (tres frases que se turnan).

## Catálogo de ideas

1. **Renglón con su control a la vista.** Ícono, nombre, una línea de qué cambia y el control
   (pasos, − n +) en el mismo renglón: un toque para cambiar. Resuelve tener que abrir cada ajuste.
   Variantes 1. Patrón: Ajustes de iOS. Ahorra 1 toque por ajuste. Dentro de las reglas.
2. **El ejemplo del redondeo en vivo.** «$ 15.001 → $ 16.000» con la foto del producto, al lado del
   paso; al pasar el mouse por otro paso, cambia y dice cuántos cambiarían. Resuelve no saber qué
   hace un paso. Variantes 1 y 2. Patrón: Stripe (vista previa del recibo). Dentro de las reglas.
3. **La confirmación del redondeo con tres productos de ejemplo.** «1.650 de 3.486 precios
   cambian» y tres productos con el precio de antes tachado. Resuelve confirmar a ciegas. Variantes
   1, 2 y 3. Patrón: Shopify (edición masiva con vista previa). Dentro de las reglas (R3.4 pide el
   número; los ejemplos se suman).
4. **Márgenes como cinco teclas numeradas.** Cada caja con su tecla 1 a 5 arriba; se escribe
   encima y al soltar se ordenan solas, volando a su lugar. Resuelve entender por qué el 400 pasó a
   la tecla 1. Variantes 1 y 2 (en la 3, como teclas del ticket). Patrón: Square (atajos de monto).
5. **Días con − n + que guarda solo.** Rueda el número; a los 700 ms del último toque se guarda.
   Resuelve tipear en el celular. Variante 1. Patrón: Cantidad del carrito en Shopify POS.
6. **Últimos cambios en la pantalla.** Los tres últimos de Quién hizo qué, con quién, antes y
   después, y «Ver todos». Resuelve «¿quién tocó el redondeo?». Variantes 1 y 3 (como cinta).
   Patrón: historial de Linear. Fuera de las reglas (es de 05, solo se muestra).
7. **El aviso del permiso que nombra a las personas.** «Lo tiene el rol Administrador (Rubén
   Paredes y Hugo Ferreyra)»: a quién pedírselo. Variantes 1, 2 y 3. Patrón: Google Drive («pedí
   acceso»). Dentro de las reglas (R1.2 dice «quién lo tiene»).
8. **Teclas Alt de cada ajuste.** R, M, S, T, V llevan al control; flechas recorren; Ctrl Z
   deshace. Variantes 1, 2 y 3. Patrón: Linear.
9. **«Vale para todos» como pastilla fija en la cabecera.** Variantes 1 y 2.
10. **Lista corta y escenario.** A la izquierda solo nombre y valor; a la derecha, lo elegido en
    grande. Resuelve ver todo de un vistazo y decidir con calma. Variante 2. Patrón: Ajustes de
    macOS, bandeja de Linear.
11. **Cada opción dice su efecto.** Debajo de cada paso, cuántos precios cambian; de cada tope, a
    qué hora se termina. Resuelve comparar sin probar. Variante 2 (y en la 3, el número naranja).
    Patrón: planes de Stripe. Dentro de las reglas.
12. **Mirar sin guardar.** Pasar el mouse o las flechas por una opción muestra su efecto; recién el
    clic o Enter la elige. Variante 2. Patrón: vista previa de temas de macOS.
13. **La vidriera de cinco productos.** Foto, precio calculado y precio redondeado; los que cambian
    se tiñen y sus números ruedan. Variante 2. Patrón: Shopify. Fuera de las reglas (se suma).
14. **Un día en el mostrador.** La jornada de 8:00 a 8:00 con dos tramos de uso, el almuerzo y dos
    marcas: dónde se cierra por sin uso y dónde llega el tope, más una frase («a las 13:30 entra de
    nuevo»). Resuelve que «30 minutos» no dice nada. Variante 2. Patrón: Tiempo de uso de iOS.
    Junta los dos tiempos en un escenario (son dos ajustes).
15. **El calendario del vínculo.** 54 semanas en cuadritos, la fecha en que vence si hoy se espejan
    por última vez, un deslizador, y qué le pasa a un vínculo de hace 20 días. Resuelve que «30
    días» sea abstracto y muestra E39/E40. Variante 2. Patrón: contribuciones de GitHub.
16. **Un ajuste por pantalla en el celular, deslizando.** Tiras arriba con el valor de cada uno;
    deslizar el escenario pasa al de al lado. Ahorra volver atrás. Variante 2. Patrón: Wallet.
17. **El ticket de las reglas.** Toda la pantalla es un ticket con borde troquelado, líneas con
    puntos y el valor al final. Resuelve que se lea como «las reglas del local», no como un panel.
    Variante 3. Fuera del lenguaje (sin tarjetas, título de 40 px).
18. **El valor subrayado que se abre ahí mismo.** Tocar «60 minutos» despliega las opciones debajo,
    sin hoja ni pantalla nueva. Variante 3. Patrón: Notion (propiedades en línea).
19. **El cambio impreso al pie, con su «Deshacer».** Cada cambio baja como una línea de impresora,
    con la hora, quién y antes → después; «Deshacer» vive en esa línea 5 s. Variante 3. Fuera de
    R2.1 en la computadora (el aviso no va abajo).
20. **Órdenes escritas.** «vínculo 15 días», «margen 100 por 150», «redondeo 500», «deshacer»; dice
    qué hizo o por qué no. Con «/» se escribe desde cualquier lado. Ahorra buscar el ajuste.
    Variante 3. Patrón: barra de comandos de Linear y Raycast. Fuera de las reglas.
21. **La voz.** El micrófono, bajo el pulgar en el celular, entiende lo mismo que las órdenes
    escritas. Variante 3. Patrón: Siri / Asistente. Fuera de las reglas.
22. **El sello de solo lectura.** Sin el permiso, un sello cruzado sobre el ticket («Solo para ver.
    Falta “Cambiar los ajustes”»); sin conexión, otro sello con la hora de lo último visto.
    Variante 3. Fuera del lenguaje (un elemento girado).
