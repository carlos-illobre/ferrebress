# Manual: tres maquetas para Carlos

Capturas lado a lado: `desktop-comparison.png` y `phone-comparison.png`. Arriba está cada variante
abierta en el capítulo de ejemplo; abajo, la misma variante buscando («fiado» o «cobrar con
tarjeta»). Cada maqueta se abre sola desde su `index.html`. Con `#buscar` al final de la dirección
se ve la búsqueda, y en el celular 1, con `#indice`, el índice. Lo propio del manual (marcas,
pines, clip) está en `assets/manual.css`. Las capturas del capítulo son recortes de
`sales/*/v2/screenshot.png`, y las marcas de qué tocar van en una capa encima, no pintadas en la
imagen.

Lo que muestran las tres: el capítulo «Vender: cobrar una venta» en 4 pasos (buscá lo que lleva,
revisá cantidades y precios, elegí cómo paga, cobrá). En el índice, en el orden del menú: Entrar y
Celular y computadora (escritos), Vender (escrito, en 3 partes), y Clientes, Catálogo, Listas de
precios, Stock, Compras, Conteos, Números del negocio, Quién hizo qué, Procesos, Mejoras y errores,
Configuración y Administración con «pronto». No hay datos del negocio: solo las capturas (R6.2).

Las tres salen del marco de la aplicación, como Entrar: no tienen lateral ni menú de abajo, porque
el manual se abre también sin haber entrado. Arriba de todo está siempre lo mismo: elegir
Computadora o Celular, buscar y Volver.

## Computadora y celular (la variante N del celular es la misma idea que la N de la computadora)

| | Idea en una frase | Ideas |
|---|---|---|
| **1 · El libro** (evolución) | Un centro de ayuda como el de Apple o Stripe. En la computadora: índice a la izquierda, con las partes del capítulo abierto debajo, el capítulo en el medio con pasos numerados (cada uno con su recorte de la pantalla y lo que hay que tocar marcado en naranja, con un número) y a la derecha «En este capítulo», el clip y las teclas de esa pantalla. En el celular: el capítulo a lo largo, con una barra flotante («Capítulos · 1 de 4 · Siguiente») y el índice en una hoja que sube. La búsqueda se despliega debajo de la caja y muestra el capítulo y el paso de cada resultado. | 1, 2, 3, 4, 5, 6, 7, 8, 9 |
| **2 · Paso a paso** (reinvención) | El manual no se lee: se sigue. Se ve un paso a la vez: a la izquierda (o abajo, en el celular) qué hacer en letra grande, y al lado la pantalla entera con todo oscurecido menos lo que hay que tocar, que late. Se avanza con «Siguiente» (Enter) y arriba se ve el avance, como en las historias de Instagram. Buscar es «¿Qué querés hacer?»: cada resultado lleva al paso justo, con una miniatura. Sin búsqueda, el índice son los temas en fichas. | 2, 3, 6, 10, 11, 12, 13 |
| **3 · El mapa** (audaz) | El manual es la pantalla misma: se ve Vender entero con pines numerados encima. Los pines del recorrido elegido («Cobrar una venta», «Cuando falta el precio», «A pedido») van unidos por una línea de puntos, y las letras son lo demás de la pantalla. Al lado (o en una hoja, en el celular) está la explicación del pin elegido. Buscar marca en la pantalla dónde está lo buscado («fiado» → Cta. cte.). Los capítulos son una tira abajo. | 2, 3, 6, 14, 15, 16, 17 |

**Qué rompe la audaz:** cambia «capítulo con texto, pasos y capturas» (R6.5) por «captura con
pines y una explicación por pin». Los pasos siguen estando (son el recorrido), pero el texto
corrido desaparece. En el celular, la captura ocupa toda la pantalla y el manual flota encima.
Además, cada capítulo pide guardar dónde está cada pin en cada captura, una por dispositivo.

## Cuál me gusta más

**La 1, en los dos dispositivos, con dos ideas de las otras.** Es la que más se parece a un libro
que se puede hojear: se ven todos los pasos juntos, el índice siempre a mano y las teclas de la
pantalla. Es la más barata de escribir al cerrar cada módulo (texto, recortes y marcas), y quien no
sabe de informática la entiende sin explicación. De la 2 tomaría que el resultado de la búsqueda
lleve al paso justo (idea 10) y el foco que oscurece lo demás cuando se abre un paso desde la
búsqueda (idea 11). De la 3, la búsqueda que marca dónde está en la pantalla (idea 16).

En el celular, la 2 me tienta: un paso por pantalla y «Siguiente» bajo el pulgar es lo más cómodo
para leer con una mano. La 1 ya trae algo de eso con su barra flotante. Si Carlos la prefiere, la 2
se puede tomar solo en el celular sin cambiar las reglas, porque el contenido es el mismo.

## Cómo se mueve (una línea por interacción)

- **Cambiar Computadora ↔ Celular:** el segmento blanco se desliza (200 ms) y el capítulo hace un
  fundido cruzado. Las capturas cambian de forma y el texto queda en su lugar: se siente que es lo
  mismo, en otro aparato.
- **Abrir un capítulo:** en la computadora, fundido corto. En el celular, entra desde la derecha
  (320 ms), como en el iPhone.
- **La marca de qué tocar:** al entrar el paso en pantalla, el anillo naranja se dibuja (200 ms) y
  da un latido que se repite despacio mientras el paso está a la vista. Con «reducir movimiento»
  queda quieto.
- **Siguiente (2 y 3):** la pantalla oscurecida no se mueve. El foco viaja del objetivo anterior al
  nuevo (320 ms, `--curva`), la barra de avance se llena y el texto entra 8 px desde abajo. En el
  celular vibra 10 ms.
- **Buscar:** los resultados caen 4 px con fundido (120 ms) mientras se escribe, después de 150 ms
  sin tipear (R7.4). Al elegir uno, el capítulo se desplaza hasta el paso y el paso parpadea en
  pino-suave 1 s.
- **Mapa (3):** al tocar un pin, crece a 40 px con rebote y la hoja cambia de texto con fundido.
  Al elegir otro recorrido, la línea de puntos se dibuja de 1 a 4 (400 ms). Al buscar, la pantalla
  se desplaza sola hasta el lugar encontrado.
- **El clip:** está quieto en su primer cuadro con ▶. Al tocarlo se agranda sobre el capítulo
  (hoja, 320 ms) y arranca sin sonido, sin ícono de volumen que invite a subirlo.
- **Volver:** deshace el último movimiento (sale hacia la derecha en el celular) y deja la pantalla
  de antes como estaba.

## Autocrítica (lo que corregí antes de mostrar)

- **1 computadora:** los recortes estaban al costado del texto y quedaban de 360 px, ilegibles.
  Ahora van debajo del texto, a todo el ancho del paso. Los números del texto eran teclas y se
  confundían con atajos: ahora son el mismo círculo naranja que la marca. Algunos nombres del
  índice se partían en dos renglones.
- **1 celular:** «Paso 1 de 4» se partía en la barra flotante. «Siguiente» iba en pino y ahora va
  en naranja, porque es la acción de la pantalla.
- **2 computadora:** el globo «Tocá cómo paga» tapaba el número de la marca y «Siguiente» se salía
  de la columna.
- **2 celular:** «Tarjeta», como medio de pago, se pintaba como una tarjeta (choque de clases con
  `common.css`).
- **3 computadora:** la línea del recorrido no pasaba por los pines.
- **3 celular:** arriba se veía el buscador de Vender cortado debajo de la píldora. Ahora un
  fundido lo esconde, y la lista de recorridos pasó a un botón de la hoja.
- **Sigue flojo:** en la 2, la pantalla de la computadora reducida deja chicos los textos de la
  captura; el foco ayuda, pero un zoom suave al objetivo sería mejor. En la 3, si la captura es
  densa, los pines con letra se amontonan. En las tres, las teclas se ven siempre: en la aplicación
  solo se verían con Alt apretado (R2.9).

## Qué contradice o agrega a las reglas

- **Fuera del marco (las tres):** el manual no muestra el lateral ni el menú de abajo, tampoco
  cuando se abre desde Más. Las reglas no lo dicen; lo propongo porque se abre sin haber entrado.
- **«1 resultado más en Celular» (1 y 3):** R6.6 pide mostrar solo lo del dispositivo elegido. No
  muestro el resultado del otro dispositivo, solo cuántos hay, con el atajo para cambiar.
- **«Clientes habla de esto: pronto» (las tres):** un capítulo que todavía no está escrito no
  debería encontrarse. Haría falta anotar de antemano de qué va a hablar cada capítulo.
- **Partes dentro de un capítulo (1):** Vender tiene «Cobrar una venta», «Cuando falta el precio» y
  «A pedido y presupuesto». R6.4 habla de un capítulo por módulo, no de sus partes.
- **El mapa (3):** ver «Qué rompe la audaz».
- **Teclas que propongo:** Alt B buscar, Alt V volver, Alt C y Alt L para Computadora y Celular,
  Alt T todos los temas (2), Enter siguiente (2 y 3). Las flechas mantienen su papel (R2.3 y
  R2.4).

## Catálogo de ideas

1. **Índice con las partes del capítulo abierto.** Qué es: debajo del capítulo elegido aparecen
   sus partes («Cobrar una venta», «Cuando falta el precio»…). Problema que resuelve: quien busca
   una tarea puntual no lee el capítulo entero. Variantes: 1. Patrón: Apple Support, Stripe Docs.
   Ahorra 1 toque. Fuera de las reglas: sí (R6.4 habla de capítulos, no de partes).
2. **La marca de qué tocar, en una capa sobre la captura.** Qué es: un anillo naranja numerado
   sobre el recorte de la pantalla real, dibujado por el manual y no pintado en la imagen.
   Problema: «¿dónde está eso?». Además, al cambiar la pantalla se reemplaza la captura y las
   marcas se acomodan. Variantes: 1, 2 y 3. Patrón: las capturas anotadas de Apple Support y las
   flechas de IKEA. Fuera de las reglas: no.
3. **El número en el texto es el mismo círculo que en la captura.** Qué es: «la caja de arriba ①».
   Problema: unir lo que se lee con lo que se ve. Variantes: 1, 2 y 3. Patrón: manuales de
   electrodomésticos. Fuera de las reglas: no.
4. **«En este capítulo», con los pasos y cuál se está leyendo.** Qué es: una lista corta a la
   derecha que se marca al bajar. Problema: saber cuánto falta. Variantes: 1. Patrón: Stripe Docs y
   la columna «On this page» de Notion. Fuera de las reglas: no.
5. **Las teclas de esa pantalla, en el capítulo.** Qué es: F2 Cobrar, F5–F8 Cómo paga, F9 Cliente,
   Esc No llevó. Problema: que la gente de mostrador deje el mouse. Variantes: 1 (y en el paso de
   la 2 y la 3). Patrón: la ayuda de atajos de Linear. Fuera de las reglas: no.
6. **El clip quieto, con su duración y «sin sonido» a la vista.** Qué es: el primer cuadro con ▶,
   «0:24» y el ícono de silencio. Problema: que no arranque solo ni haga ruido delante del cliente
   (R6.5). Variantes: 1, 2 y 3. Patrón: el autoplay apagado de YouTube. Fuera de las reglas: no.
7. **El resultado dice capítulo, parte y paso.** Qué es: «Vender › Cobrar una venta · paso 3» y la
   frase con la palabra resaltada. Problema: saber adónde lleva antes de ir. Variantes: 1, 2 y 3.
   Patrón: Spotlight, Algolia DocSearch. Fuera de las reglas: no.
8. **«1 resultado más en Celular».** Qué es: el total del otro dispositivo, con Alt L para
   cambiar. Problema: alguien busca con el dispositivo equivocado elegido y cree que no hay nada.
   Variantes: 1 y 3. Patrón: los filtros con conteo de Shopify. Fuera de las reglas: sí (R6.6).
9. **Barra flotante en el celular: Capítulos · 1 de 4 · Siguiente.** Qué es: una píldora abajo, a
   mano del pulgar, que abre el índice o pasa al siguiente paso. Problema: en el celular el índice
   no entra al costado. Variantes: 1. Patrón: Apple Books, Medium. Ahorra 2 toques por cambio de
   capítulo. Fuera de las reglas: no.
10. **El resultado de la búsqueda lleva al paso justo.** Qué es: Enter abre el capítulo ya en el
    paso 3, con los anteriores a mano. Problema: no releer lo que ya se sabe. Variantes: 2 (y la 1
    y la 3 lo pueden tomar). Patrón: Apple «Consejos», Google «Ir al momento». Ahorra 1 a 3 toques.
    Fuera de las reglas: no (R6.6 dice «lleva a esa parte»).
11. **El foco: todo oscuro menos lo que hay que tocar.** Qué es: la captura entera oscurecida y un
    agujero claro, con latido, sobre el objetivo. Problema: en una pantalla llena de cosas, ver
    solo una. Variantes: 2 (y la búsqueda de la 3). Patrón: los recorridos guiados de Shopify y
    Stripe. Fuera de las reglas: no.
12. **Un paso por pantalla, con avance arriba.** Qué es: los segmentos tipo «historias» y
    Siguiente / Anterior. Problema: no perderse leyendo con el cliente esperando. Variantes: 2.
    Patrón: Instagram Stories, Apple «Consejos». Fuera de las reglas: no.
13. **Buscar como «¿Qué querés hacer?» y resultados con miniatura.** Qué es: la caja pregunta por
    la tarea, no por la palabra, y cada resultado muestra el recorte del paso. Problema: quien no
    sabe cómo se llama algo sabe lo que quiere hacer. Variantes: 2. Patrón: el «¿Qué querés
    hacer?» de Square. Fuera de las reglas: no.
14. **La pantalla como mapa, con pines.** Qué es: la captura entera, con números para el recorrido
    y letras para lo demás. Problema: aprender la pantalla mirándola, sin texto largo. Variantes:
    3. Patrón: los planos de IKEA y el «Tour» de Figma. Fuera de las reglas: sí (R6.5, el texto
    pasa a ser por pin).
15. **Recorridos dibujados con una línea de puntos.** Qué es: 1 → 2 → 3 → 4 unidos sobre la
    captura. Problema: ver el orden de un vistazo. Variantes: 3. Patrón: los mapas de rutas de
    Apple Maps. Fuera de las reglas: no.
16. **Buscar marca el lugar en la pantalla.** Qué es: «fiado» enciende Cta. cte. con un globo que
    dice «“Fiado” es Cta. cte.». Problema: la gente usa sus palabras, no las de la aplicación.
    Variantes: 3. Patrón: el «¿Dónde está…?» de Ayuda de macOS, que señala el menú. Ahorra entrar
    al capítulo. Fuera de las reglas: no.
17. **Los capítulos en una tira de fichas, con «pronto» en línea punteada.** Qué es: el índice como
    fichas con ícono, horizontal (3) o en chips (2). Problema: ver todo el manual de un vistazo y
    distinguir lo que falta sin leerlo. Variantes: 2 y 3. Patrón: las estanterías de Apple Books.
    Fuera de las reglas: no.
