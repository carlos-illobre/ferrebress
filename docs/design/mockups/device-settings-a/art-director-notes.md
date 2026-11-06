# Más → Configuración (etapa a): tres maquetas para Carlos

Las capturas están lado a lado en `desktop-comparison.png` y `phone-comparison.png`. Cada variante
se abre sola desde su `index.html`. Usa `../../../../common/` y `../../extra/`, donde están las piezas
que comparten las tres: el marco, la llave, las hojas, las tostadas, el pedido del navegador para
instalar y los íconos de Lucide que se suman.

**Funcionan de verdad:** apagar las animaciones apaga todo el movimiento de la maqueta en el momento.
Solo sigue girando la marca de espera (R2.2). Cambiar el formato cambia todas las horas de la
pantalla. «Instalar» abre el pedido del navegador, que es neutro porque lo muestra el navegador y no
Ferrebress. Al aceptarlo, la pantalla pasa a «Ya está instalada».

**Botón «Casos»** (abajo a la derecha, punteado): no es parte del diseño. Sirve para ver cada caso de
la regla sin cambiar de aparato:
- el sistema pide no animar (R2.3);
- instalar: se puede, ya instalada y abierta en el navegador, abierta desde el ícono, iPhone, o un
  navegador que no sabe instalar (R4);
- en el celular, trabajar sin conexión: con huella, sin huella, ahora sin conexión, o sin el
  permiso (R5).

La persona de ejemplo es Rubén Paredes, Administrador, el mismo del marco.

## Las tres ideas

| | La idea en una frase | Ideas del catálogo |
|---|---|---|
| **1 · La lista que se prueba** (evolución) | Una lista con un renglón por preferencia. Cada renglón trae su muestra viva: una ventanita que se mueve o aparece en el acto, y las tres horas escritas de verdad con la hora de ahora. Lo de la etapa b va al costado como «Lo tuyo», con «Pronto». | 1, 2, 3, 4, 5, 6, 7, 8, 12 |
| **2 · Elegí lo que ves** (reinvención) | No hay llaves: cada preferencia es una pregunta con muestras para tocar («¿Cómo leés la hora?» muestra un pedacito de Quién hizo qué escrito de tres maneras). Se elige lo que se ve, no una palabra. Instalar también es elegir: «En el navegador» o «Con su ícono». En el celular, una pregunta por pantalla, que se pasa de costado. | 1, 2, 3, 9, 10, 11, 12, 13 |
| **3 · Los objetos** (audaz) | Sin marco y sin lista. La hora es un reloj de paletas que se toca o se desliza y da vuelta sus números. Las animaciones son una llave de luz con sus tornillos. Para instalar, se arrastra el ícono de la F al dock. En el celular, trabajar sin conexión se prende dejando el dedo apoyado en la huella. Lo que llega pronto es una cajonera de ferretería con los cajones cerrados. | 1, 3, 14, 15, 16, 17, 18, 19 |

## Cuál me gusta más

**La 1, con dos ideas de la 2: el resumen «Así la tenés» (10) y «Volver a como viene» (11).** Es una
pantalla de uso raro: se entra una vez, se cambia algo y no se vuelve. Por eso conviene que se lea
como cualquier lista de ajustes del teléfono y que no haya nada que aprender. Lo que la sube de nivel
es que no hace falta imaginar nada: la muestra de las animaciones y las tres horas escritas con la
hora de ahora dicen qué cambia antes de tocar. La 2 es la más clara para alguien poco técnico, pero
ocupa tres veces más lugar para tres preferencias. La 3 es la que más se disfruta y la que haría
sonreír a quien la abra, pero arrastrar un ícono para instalar o mantener el dedo es algo nuevo que
hay que descubrir.

## Qué contradice una regla o queda fuera del capítulo

- **1:** nada de fondo.
  - La muestra de la animación se mueve sola en bucle. Es movimiento puesto ahí para mostrar, y con
    las animaciones apagadas, o si el sistema pide no animar, se queda quieta.
  - Con «reducir movimiento» del sistema, la llave queda apagada y no se puede tocar, con el aviso
    debajo. La regla dice que «no hay animaciones aunque la opción esté prendida»: si Carlos prefiere
    que la llave conserve lo que eligió la persona, es cambiar un renglón.
- **2:**
  - **Las preferencias no se ven como llaves, sino como muestras:** «Animaciones» se llama «¿Cómo
    aparecen?», con «Con movimiento» y «En el acto». R1.2 se cumple con la pregunta y la línea de
    cada muestra, pero el nombre «Animaciones» no figura.
  - **Instalar es una de dos opciones.** «En el navegador» no está en la regla. Tocarlo ya instalada
    dice que se desinstala desde el sistema (R4.4).
  - **«Volver a como viene»** y el resumen de arriba no están en el capítulo.
  - **En el celular**, una pregunta por pantalla: lo que no se ve hay que buscarlo de costado (los
    puntos y el resumen de arriba llevan a cada una).
- **3 (lo que rompe):**
  - **El marco:** no tiene menú lateral, ni menú de abajo, ni luz de conexión. Solo una × (y Esc)
    para volver a Más.
  - **La forma de cambiar:** la hora se cambia deslizando o tocando el reloj; los tres formatos
    también están debajo, para tocarlos directo. Instalar se hace arrastrando el ícono al dock
    (también tocándolo, con Enter o con Alt I). Trabajar sin conexión se prende manteniendo el dedo
    un segundo; en el celular no hay llave.
  - **«Trabajar sin conexión»** se muestra como una huella grande aunque no pide la huella al
    prenderla (15 decide eso).
  - **Las palabras:** «LA HORA», «ANIMACIONES» e «INSTALAR» van como rótulos de objeto, en
    mayúsculas, contra la regla de mayúsculas solo al principio.
  - **La etapa b** es una cajonera: los cajones se sacuden al tocarlos y dicen «llega pronto».
  - **El color:** las paletas del reloj son pino lleno. Es lo oscuro como pieza que manda, que el
    lenguaje reserva para la cámara o el botón de escanear.

## Cómo se mueve (una línea por interacción)

- **Llave (1):** la bolita corre 20 px en 200 ms. En el mismo instante, la muestra de abajo pasa
  de deslizarse a aparecer de golpe. Se siente como apagar una luz y ver el efecto.
- **Elegir un formato de hora (1 y 2):** el borde pasa a pino y el tilde aparece con un rebote corto
  (200 ms). Todas las horas de la pantalla cambian en el acto, sin moverse: lo que cambia es la
  palabra, no la posición.
- **Muestras de animación (1 y 2):** la ventanita sube 16 px y el aviso entra desde abajo. Dura
  2,4 o 2,8 s en bucle, con la curva de entrada. «En el acto» hace lo mismo a saltos.
- **Elegir una muestra (2):** la ficha baja al 98 % al apretarla. La pastilla «Elegido» entra con
  rebote. En el celular vibra 10 ms.
- **Carrusel (2, celular):** se pasa de costado y queda centrado en la pregunta. El punto activo
  crece 1,35 veces. Tocar una pastilla del resumen lleva a su pregunta con un deslizamiento.
- **Reloj de paletas (3):** cada número que cambia cae desde 90° en 360 ms, uno detrás de otro, con
  40 ms entre cada uno. Se siente como el cartel de una estación.
- **Llave de luz (3):** la tecla se inclina de +14° a −14° con rebote (200 ms) y la luz verde se
  apaga.
- **Ícono al dock (3):** el ícono sigue al dedo y crece un 6 %. El hueco del dock se agranda al
  pasar por encima. Al soltarlo, el pedido del navegador sube. Ya instalado, el ícono baja al dock
  achicándose (320 ms). La flecha de abajo late suave mientras se puede instalar.
- **Huella (3, celular):** al apoyar el dedo, un anillo pino se cierra en 900 ms. Al completarse,
  la huella se llena de pino, vibra 10-40-10 y aparece la tostada. Si se suelta antes, dice «Mantené
  el dedo apoyado».
- **Cajón (3):** se sacude 3 px hacia abajo y vuelve (300 ms), como un cajón trabado.
- **Instalar, en todas:** en la computadora, el pedido del navegador sube 12 px con fundido; en el
  celular, sube como hoja desde abajo y el fondo se oscurece al 30 %. Al aceptar, el tilde de la
  tostada y la vibración doble.
- **Con «reducir movimiento» o con Animaciones apagadas:** nada de lo anterior se mueve. Solo
  gira la marca de espera.

## Autocrítica (lo que corregí después de la primera captura)

- **1:** el aviso «Este dispositivo ya pide no animar» se veía siempre, aunque el sistema no lo
  pidiera. Lo de la etapa b ocupaba dos renglones por cajón: acorté los textos. «2:30 p. m.» se
  partía en dos renglones en el celular: ahora el espacio no se corta.
- **2:** el resumen «Así la tenés» se apretaba a la derecha del título y partía las pastillas.
  Lo pasé a la línea de «Solo para vos». Las fichas de la hora tenían tres renglones y empujaban
  «Lo tuyo» fuera de la pantalla: quedaron dos. En el celular, las tarjetas del carrusel se
  estiraban hasta abajo.
- **3:** los tres objetos quedaban a distintas alturas. Ahora comparten la línea de base: rótulo,
  objeto y texto. Los «Pronto» de la cajonera estaban en ámbar, que dice «mirá esto»: pasaron a
  neutros.
- **Lo más flojo que queda:**
  - En la 1, «Como el sistema» y «24 horas» se ven iguales en un aparato que ya usa 24 h. Lo
    aclara la línea «Acá se ve en 24 h», pero son dos fichas iguales.
  - En la 3, la placa de la llave con «I» y «O» es linda pero dice poco: el texto de abajo («Con
    movimiento» / «En el acto») es el que explica.

## Catálogo de ideas

1. **«Solo para vos, en este dispositivo» como sello** con las iniciales, arriba de todo. Resuelve
   R1.2 de un vistazo, sin un párrafo. Variantes: 1, 2, 3. Patrón: el selector de cuenta de los
   ajustes de Android y Chrome. No ahorra toques. Dentro de las reglas.
2. **Muestra viva de la animación:** una ventanita que se mueve, o aparece de golpe si está apagada.
   Resuelve que «animaciones» no le dice nada a quien no es técnico. Variantes: 1, 2. Patrón:
   Accesibilidad → Movimiento de iOS, con su vista previa. Ahorra probar y volver. Dentro.
3. **La hora de ahora escrita en cada formato,** y corriendo. Es lo que pide R3.1, en grande.
   Variantes: 1, 2, 3. Patrón: Fecha y hora de macOS. Dentro.
4. **«Se ve así en…»:** dos pastillas con horas reales de la aplicación (Quién hizo qué, Mis
   sesiones) que cambian al elegir. Resuelve «¿dónde se nota esto?». Variante: 1. Patrón: la vista
   previa de los formatos regionales de Windows. Fuera del capítulo (es una ayuda que se suma).
5. **La marca de espera girando al lado de la llave,** con «La espera gira siempre»: deja claro que
   apagar no oculta lo que avisa que algo está pasando. Variantes: 1, 2, 3. Dentro (R2.2).
6. **Atajos Alt + letra a la vista:** Alt A, Alt H, Alt I, y Alt V en la 2. Con Alt apretado, las
   teclas se pintan de pino. Variantes: 1, 2, 3 (computadora). Patrón: Office y Linear. Dentro (R1.9).
7. **El aviso de «reducir movimiento» en la misma tarjeta,** con la llave bloqueada y el ícono de
   accesibilidad. Variantes: 1, 2 (candado en la muestra) y 3 (cartelito colgado de la placa).
   Dentro (R2.3).
8. **Instalar como un renglón que cambia de forma** según el navegador: el botón, «Ya está
   instalada» o los pasos del iPhone. Variante: 1. Dentro (R4).
9. **Elegir por lo que se ve, no por el nombre:** cada preferencia es una pregunta con fichas que
   muestran el efecto. Variante: 2. Patrón: elegir el tema de pantalla en iOS o en Slack. Ahorra
   probar, volver y comparar. Fuera de las reglas en la forma.
10. **«Así la tenés»:** las preferencias de hoy en una línea de pastillas, arriba. En el celular,
    cada pastilla lleva a su pregunta. Variante: 2. Patrón: el resumen de Configuración rápida de
    Android. Fuera del capítulo.
11. **«Volver a como viene»** (Alt V): deshace todo de un toque. Aparece solo si algo cambió.
    Variante: 2. Patrón: «Restablecer» de los ajustes de Chrome. Ahorra de 2 a 4 toques. Fuera del
    capítulo.
12. **Lo de la etapa b agrupado como «Lo tuyo»:** al costado en la 1, en una tira al pie en la 2,
    como la última tarjeta en el celular. Resuelve R1.8 sin mezclarlo con lo que ya anda. Dentro.
13. **Una pregunta por pantalla en el celular,** que se pasa de costado, con puntos. Variante: 2.
    Patrón: la configuración inicial de iOS y Wallet. Fuera de las reglas en la forma.
14. **Pantalla completa sin marco,** con × y Esc para volver. Variante: 3. Patrón: Ajustes en una
    hoja de Apple TV y de Arc. Rompe el marco.
15. **Reloj de paletas que se desliza:** el formato se cambia deslizando el reloj. Variante: 3.
    Patrón: la rueda de horas de iOS y los carteles de estación. Ahorra mirar opciones: se pasa de
    una a otra con el dedo. Fuera de las reglas en la forma.
16. **La llave de luz** con placa y tornillos para las animaciones. Variante: 3. Patrón: el
    skeuomorfismo del primer iOS, y lo que hay en el local. Rompe el lenguaje (la placa no es una
    pieza común).
17. **Arrastrar el ícono al dock para instalar.** Variante: 3. Patrón: instalar arrastrando a
    Aplicaciones en macOS. Fuera de las reglas (agrega un gesto; tocar sigue andando).
18. **Mantener el dedo en la huella para trabajar sin conexión.** Variante: 3 (celular). Patrón:
    Apple Pay y el «mantené para confirmar» de las billeteras. Evita prenderla sin querer. Fuera de
    las reglas en la forma.
19. **La cajonera de ferretería** para lo que llega pronto: los cajones se sacuden al tocarlos.
    Variante: 3. Rompe el molde del renglón.
