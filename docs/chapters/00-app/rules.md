# 00 · La aplicación: reglas

Lo que vale para toda la aplicación, sea cual sea el módulo: el marco y el menú, el teclado, los
textos, la conexión, la versión nueva, el manual, las esperas, los formatos, los errores y el
ambiente de pruebas.

**Estado:** aprobado.

## 1. El marco y el menú

- **R1.1** El menú tiene cinco partes, en este orden: Vender · Catálogo · Depósito · Negocio · Más.
  En la computadora va a la izquierda; en el celular, abajo. Dónde va el menú no es una regla que
  limite al director de arte: es la elección de hoy.
- **R1.2** Cada parte tiene sus pestañas (el submenú):
  - Vender: Vender · Ventas de hoy.
  - Catálogo: Productos · Listas · Duplicados.
  - Depósito: Stock · Compras · Contar.
  - Negocio: Resumen · Usuarios · Quién hizo qué.
  - Más: Anomalías · Procesos · Mejoras y errores · Configuración · Administración · Manual.
- **R1.3** En el ambiente de pruebas, lo que todavía no existe aparece en el menú con la marca
  «Pronto» y no se puede abrir. En producción no aparece hasta que existe.
- **R1.4** Al abrir la aplicación se abre siempre la primera opción del menú que exista. No se
  recuerda la última parte usada ni cómo quedó el menú.
- **R1.6** En la computadora, un botón minimiza el menú a solo sus íconos y lo vuelve a agrandar.
  Minimizado, cada ícono dice su nombre al pasar el mouse o al llegar con la marca del teclado.
  Cada vez que se abre la aplicación, el menú arranca agrandado (R1.4).
- **R1.5** La aplicación es una sola para la computadora y el celular: la misma funcionalidad, con
  otra disposición. Se adapta a cualquier tamaño de pantalla, o al menos a los más
  comunes.

## 2. El teclado

Vale solo en la computadora: en el celular no hay atajos ni marca.

- **R2.1** Hay dos focos: el **cursor**, que se mueve con Tab o con el mouse, y la **marca**, que se
  mueve con las flechas. Las flechas nunca mueven el cursor a otro lugar.
- **R2.2** Al abrir una pantalla, el cursor está en su caja de texto principal, si tiene una.
- **R2.3** ← y → recorren las pestañas de la parte y, desde la primera, llegan al menú. Con el cursor
  en una caja con texto, ← sale hacia las pestañas solo si el cursor está al principio del texto, y
  → solo si está al final; si no, mueven el cursor dentro del texto. Con la caja vacía, salen
  siempre.
- **R2.4** ↑ y ↓ recorren el menú, y los renglones de las listas y las grillas de la pantalla.
- **R2.5** La marca se ve igual en todas las pantallas. Aparece al tocar una flecha y se esconde al
  usar el mouse.
- **R2.6** Enter abre o activa lo marcado. Con el cursor en la caja principal y nada marcado, hace
  la acción principal de la pantalla.
- **R2.7** Esc cierra lo que está encima (una hoja, un menú, un aviso). Si no hay nada encima, saca
  la marca.
- **R2.8** Todo botón tiene un atajo: Alt más una tecla. La tecla es, de preferencia, una letra de
  su nombre; si no hay una libre, un número. Sin teclas de función. La única excepción es el botón
  de Google de la entrada, que dibuja Google en su propio marco (01 · R2.1).
- **R2.9** Las teclas de los atajos se ven sobre los botones solo mientras Alt está apretado; al
  soltarlo, desaparecen.
- **R2.10** Un atajo vale solo en la pantalla que se ve (y en lo que está encima, si hay algo
  abierto). Dos pantallas pueden usar la misma tecla para cosas distintas.
- **R2.11** Los atajos no pisan los del navegador que una página no puede cambiar, ni los de
  editar texto.
- **R2.12** En el celular el cursor nunca arranca en una caja de texto, para que no se abra el
  teclado solo.

## 3. Los textos

- **R3.1** Cada texto de una pantalla tiene dos formas: la **larga**, que explica cómo funciona, y la
  **corta**, que solo identifica, para quien ya sabe usarla.
- **R3.2** La computadora usa la larga. El celular, y cualquier pantalla angosta (por debajo del
  ancho en que cambia la disposición), usa la corta.
- **R3.3** Todo en castellano, con las palabras del mostrador y el rol, no la persona.

## 4. La conexión

- **R4.1** Una luz de conexión, siempre a la vista, dice uno de tres estados: «En línea · todo
  enviado», «Sin conexión · N por enviar» o «Enviando…».
- **R4.2** Al tocarla, muestra el detalle de lo que está por enviar: qué es, de cuándo y quién lo
  hizo.
- **R4.3** La luz no consulta nada por su cuenta: dice lo que muestran las respuestas del servidor y
  los avisos del navegador. Ningún temporizador consulta la red.
- **R4.4** Sin conexión, lo que no puede andar se pone gris y dice «Sin conexión»: se puede leer lo
  que ya estaba en pantalla, pero no tocar nada. Solo queda disponible salir de la aplicación
 .
- **R4.5** Si el dispositivo tiene habilitado trabajar sin conexión, lo de atender clientes y
  proveedores sigue andando; lo demás se pone gris. Qué anda sin conexión está en
  [qué necesita internet](../what-needs-internet.md).
- **R4.6** Cuando vuelve la conexión, lo gris vuelve a andar solo, sin recargar.

## 5. La versión nueva

- **R5.1** La aplicación se entera de una versión nueva por las respuestas del servidor, sin
  consultas propias.
- **R5.2** Si se acaba de abrir, se actualiza sola, antes de que se use. Lo mismo si se acaba de
  entrar y no hay nada a medio hacer (después de una sesión vencida, la misma persona puede volver
  a lo que tenía, y entonces avisa como en R5.3).
- **R5.3** Si se está usando, no se recarga sola: muestra «Hay una versión nueva» con «Actualizar» y
  una forma de cerrarlo sin actualizar.
- **R5.4** Cerrado el aviso, no vuelve a aparecer hasta la próxima vez que se abra la aplicación, que
  se actualiza sola.
- **R5.6** Si la aplicación pasa a segundo plano (otra pestaña, otra aplicación, la pantalla
  apagada) con una versión nueva esperando y nada a medio hacer, se actualiza sola, sin gastar
  datos de más y sin interrumpir a nadie.
- **R5.5** Si el servidor ya no entiende la versión que tiene el dispositivo, la aplicación se
  bloquea con «Hay que actualizar para seguir» y un solo botón: «Actualizar».

## 6. El manual

- **R6.1** En la computadora se abre desde la entrada («Ver el manual») y desde Más → Manual. En el
  celular, solo desde Más → Manual.
- **R6.2** Se abre sin haber entrado: no muestra datos del negocio.
- **R6.3** Arriba se elige el dispositivo: Computadora o Celular. Arranca en el que se está usando.
  Todo el manual (índice, capítulos, capturas) muestra solo lo del dispositivo elegido.
- **R6.4** Tiene un capítulo por módulo, en el orden del menú. En el ambiente de pruebas, los que
  todavía no están escritos dicen «pronto» y no se abren; en producción no aparecen.
- **R6.5** Cada capítulo tiene texto simple, para quien atiende una ferretería sin saber de
  informática, pasos y capturas de la aplicación de verdad. Un clip solo donde la funcionalidad es
  lo bastante grande para verla en video; arranca cuando se lo pide, sin sonido.
- **R6.6** Tiene un buscador: muestra lo encontrado del dispositivo elegido, con su capítulo, y lleva
  a esa parte.
- **R6.7** «Volver» lleva a donde se estaba (la entrada o la aplicación).
- **R6.8** Necesita internet y no se guarda en el dispositivo.

## 7. Las esperas y las búsquedas

- **R7.1** Lo que responde en menos de 300 ms no muestra ninguna espera.
- **R7.2** Pasados 300 ms, lo que se tocó muestra una marca de espera y no se puede volver a tocar.
- **R7.3** Pasados 2 segundos, una barra dice qué está haciendo y cuánto falta, si se sabe. Al
  terminar dice «Listo» un instante, salvo la espera de entrar: al llegar al marco no aparece nada.
- **R7.4** Toda búsqueda espera 150 ms sin que se tipee antes de buscar, y deja sin efecto la
  búsqueda anterior si todavía no había terminado.

## 8. Los números y los formatos

- **R8.1** Todo número calculado deja ver cómo se calculó, con los números de origen, desde la misma
  pantalla donde se muestra. La forma la decide el director de arte.
- **R8.2** Los importes van con «$» y punto de miles: «$ 45.500». Por omisión, sin decimales; cada
  persona puede elegir verlos en Configuración.
- **R8.3** Las cantidades van siempre con su unidad, abreviada igual en todas partes: «3 un.»,
  «1,5 kg», «2 m», «0,5 L».
- **R8.4** Las fechas y horas las pone el servidor y se muestran en la zona horaria
  del negocio, que fija un Administrador y es la misma para todos. El día del negocio («hoy» para
  las ventas, el cierre de caja) sale de esa zona.
- **R8.5** Cada persona elige en Configuración solo el formato de la hora (24 horas o a. m./p. m.)
  y de la fecha; por omisión, los del sistema del dispositivo.

## 9. Si algo falla

- **R9.1** Si algo de la aplicación falla sin que la persona pueda hacer nada, se muestra «Algo
  salió mal», con qué hacer para seguir y un botón para avisarlo.
- **R9.5** «Algo salió mal» tiene dos botones: «Avisar y seguir», que guarda el aviso y vuelve a lo
  que se estaba haciendo, y «Seguir sin avisar». Muestra un código del error y la hora, para
  nombrarlo si alguien pregunta.
- **R9.4** El aviso lleva una captura de la pantalla y los últimos pasos que se hicieron (qué se
  tocó y en qué pantalla), sin datos de clientes ni la sesión de la persona.
- **R9.2** Mientras no exista el módulo de mejoras y errores, el aviso guarda qué pasó para mandarlo
  cuando exista.
- **R9.3** Lo que se estaba haciendo no se pierde por el error: la venta en curso, por ejemplo,
  sigue ahí al volver.

## 10. El ambiente de pruebas

- **R10.1** En el ambiente de pruebas, toda pantalla tiene un marco magenta fijo y el cartel
  «Ambiente de prueba · nada de esto es real». Producción no tiene nada de eso.
- **R10.2** El marco y el cartel no siguen el lenguaje visual: son iguales sea cual sea el diseño de
  las pantallas.

## Escenarios

### El marco y el menú

- **E01** **Dado** que la aplicación se abre, **cuando** carga, **entonces** muestra el menú con
  Vender · Catálogo · Depósito · Negocio · Más, a la izquierda en la computadora y abajo en el
  celular, y abre la primera opción que exista.
- **E02** **Dado** el menú en el ambiente de pruebas, **cuando** se mira una opción que todavía no
  existe, **entonces** dice «Pronto» y al tocarla no pasa nada.
- **E02b** **Dado** el menú en producción, **cuando** se lo mira, **entonces** solo están las opciones
  que existen.
- **E03** **Dado** que se usó la aplicación en otra parte y se la cerró, **cuando** se la vuelve a
  abrir, **entonces** abre la primera opción del menú, no la última usada.
- **E03b** **Dado** el menú agrandado en la computadora, **cuando** se toca el botón de minimizar,
  **entonces** el menú queda con solo sus íconos, cada uno dice su nombre al pasar el mouse, y al
  tocar el botón otra vez vuelve a agrandarse; al volver a abrir la aplicación, arranca agrandado.
- **E04** **Dado** una pantalla de 1366 px, una de 1920 px, una de 390 px y una de 768 px de ancho,
  **cuando** se abre la aplicación en cada una, **entonces** todo se ve entero, sin desplazarse hacia
  el costado.

### El teclado

- **E05** **Dado** una pantalla con una caja principal en la computadora, **cuando** se abre,
  **entonces** el cursor está en esa caja.
- **E06** **Dado** el cursor en la caja principal, **cuando** se tocan ↑ o ↓, **entonces** la marca
  recorre los renglones de la lista y el cursor sigue en la caja.
- **E07** **Dado** el cursor en la caja principal con «mecha» escrito y el cursor al final, **cuando**
  se toca ←, **entonces** el cursor se mueve dentro del texto y la marca no se mueve.
- **E08** **Dado** el cursor al principio del texto o la caja vacía, **cuando** se toca ←, **entonces**
  la marca pasa a las pestañas; tocando ← otra vez desde la primera pestaña, pasa al menú.
- **E09** **Dado** la marca en el menú, **cuando** se tocan ↑ o ↓, **entonces** recorre las partes;
  Enter abre la marcada.
- **E10** **Dado** un renglón marcado, **cuando** se toca Enter, **entonces** se abre o se activa ese
  renglón. Sin nada marcado, Enter en la caja principal hace la acción principal de la pantalla.
- **E11** **Dado** cualquier pantalla, **cuando** se mantiene apretado Alt, **entonces** cada botón
  muestra su tecla; al soltar Alt, desaparecen.
- **E12** **Dado** Alt apretado, **cuando** se toca la tecla de un botón, **entonces** se hace lo mismo
  que al tocar el botón.
- **E13** **Dado** dos pantallas que usan la misma tecla, **cuando** se la usa en una, **entonces**
  hace solo lo de esa pantalla.
- **E14** **Dado** una hoja abierta encima de la pantalla, **cuando** se toca Esc, **entonces** se
  cierra y la pantalla queda como estaba.
- **E15** **Dado** la marca visible, **cuando** se mueve el mouse, **entonces** la marca se esconde;
  al tocar una flecha, vuelve.
- **E16** **Dado** el cursor en una caja con texto, **cuando** se usan Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
  o Ctrl+A, **entonces** hacen lo de siempre: ningún atajo los pisa.
- **E17** **Dado** el celular, **cuando** se abre cualquier pantalla, **entonces** ninguna caja tiene
  el cursor y el teclado del celular no se abre solo.

### Los textos

- **E18** **Dado** un mismo botón, **cuando** se lo ve en la computadora y en el celular, **entonces**
  en la computadora tiene el texto largo y en el celular el corto, y los dos dicen lo mismo.
- **E19** **Dado** la computadora con la ventana angosta, **cuando** el ancho baja del corte de la
  disposición, **entonces** se usan los textos cortos.

### La conexión

- **E20** **Dado** que el servidor contesta, **cuando** no hay nada por enviar, **entonces** la luz
  dice «En línea · todo enviado».
- **E21** **Dado** que el navegador avisa que se cortó la red, **cuando** se mira la luz, **entonces**
  dice «Sin conexión» y cuántas cosas hay por enviar.
- **E22** **Dado** cosas por enviar, **cuando** se toca la luz, **entonces** muestra cada una: qué es,
  de cuándo y quién la hizo.
- **E23** **Dado** la aplicación abierta sin usarse, **cuando** pasa cualquier tiempo, **entonces** no
  hace ningún pedido al servidor. Las excepciones, con lo que gasta cada una de los datos del
  celular, están anotadas aparte (las mantiene el diseño técnico); hoy, la entrada a la vista, que
  renueva lo que necesita para entrar con Google (01 · R2.1), y la computadora, que espera su
  código.
- **E24** **Dado** un dispositivo sin trabajo sin conexión, **cuando** se corta la conexión,
  **entonces** la pantalla se pone gris, dice «Sin conexión», lo que ya estaba se sigue leyendo y
  solo deja salir.
- **E25** **Dado** un dispositivo con trabajo sin conexión, **cuando** se corta la conexión,
  **entonces** lo de atender clientes y proveedores sigue andando y lo demás se pone gris.
- **E26** **Dado** la pantalla gris por falta de conexión, **cuando** vuelve la conexión, **entonces**
  vuelve a andar sola, sin recargar y sin perder lo que había.

### La versión nueva

- **E27** **Dado** una versión nueva publicada, **cuando** la aplicación se abre y el servidor lo dice,
  **entonces** se actualiza sola antes de que se use.
- **E28** **Dado** la aplicación en uso, **cuando** el servidor dice que hay una versión nueva,
  **entonces** aparece «Hay una versión nueva» con «Actualizar» y una forma de cerrarlo, y la
  aplicación no se recarga sola.
- **E29** **Dado** el aviso de versión nueva, **cuando** se lo cierra, **entonces** desaparece y no
  vuelve hasta la próxima vez que se abra la aplicación.
- **E30** **Dado** el aviso, **cuando** se toca «Actualizar», **entonces** la aplicación se actualiza y
  vuelve a la misma parte.
- **E30b** **Dado** una versión nueva esperando y nada a medio hacer, **cuando** la aplicación pasa a
  segundo plano, **entonces** se actualiza sola y, al volver, ya está en la versión nueva, en la
  misma parte.
- **E30c** **Dado** una versión nueva esperando y una venta a medio armar, **cuando** la aplicación
  pasa a segundo plano, **entonces** no se actualiza.
- **E31** **Dado** una versión que el servidor ya no entiende, **cuando** la aplicación le hace un
  pedido, **entonces** se bloquea con «Hay que actualizar para seguir» y solo deja tocar
  «Actualizar».

### El manual

- **E32** **Dado** la entrada de la computadora, **cuando** se toca «Ver el manual», **entonces** se
  abre el manual sin haber entrado.
- **E33** **Dado** la aplicación, **cuando** se elige Más → Manual, **entonces** se abre el manual; en
  el celular es la única forma de abrirlo.
- **E34** **Dado** el manual abierto en el celular, **cuando** se mira el selector, **entonces** está
  elegido Celular, y todo lo que se ve es del celular; al elegir Computadora, todo cambia a lo de la
  computadora.
- **E35** **Dado** el índice en el ambiente de pruebas, **cuando** se lo mira, **entonces** están
  todos los capítulos en el orden del menú; los que no están escritos dicen «pronto» y no se abren.
  En producción solo están los escritos.
- **E36** **Dado** el buscador, **cuando** se escribe «huella», **entonces** muestra lo encontrado del
  dispositivo elegido, con su capítulo, y al elegir un resultado lleva a esa parte.
- **E37** **Dado** el manual abierto desde la aplicación, **cuando** se toca «Volver», **entonces**
  vuelve a la aplicación, donde estaba; abierto desde la entrada, vuelve a la entrada.
- **E38** **Dado** un clip en un capítulo, **cuando** se abre el capítulo, **entonces** el clip está
  quieto y sin sonido hasta que se lo pide.
- **E39** **Dado** un dispositivo con trabajo sin conexión, **cuando** se mira qué guardó, **entonces**
  nada del manual ocupa lugar.

### Las esperas y las búsquedas

- **E40** **Dado** algo que responde en 100 ms, **cuando** se lo toca, **entonces** no aparece ninguna
  espera.
- **E41** **Dado** algo que tarda 1 segundo, **cuando** se lo toca, **entonces** pasados 300 ms aparece
  la marca de espera y no se lo puede tocar de nuevo hasta que termina.
- **E42** **Dado** algo que tarda 5 segundos, **cuando** se lo toca, **entonces** pasados 2 segundos
  aparece la barra que dice qué está haciendo.
- **E56** **Dado** una entrada con la huella que tardó más de 2 segundos, **cuando** se llega al
  marco, **entonces** no aparece la barra ni «Listo».
- **E43** **Dado** una búsqueda, **cuando** se tipea «mecha» de corrido, **entonces** se busca una sola
  vez, 150 ms después de la última letra.
- **E44** **Dado** una búsqueda en curso, **cuando** se sigue tipeando, **entonces** la búsqueda
  anterior se deja sin efecto y se muestra solo el resultado de la última.

### Los formatos

- **E45** **Dado** un importe de 45500, **cuando** se lo muestra, **entonces** dice «$ 45.500»; con
  los decimales elegidos en Configuración, «$ 45.500,00».
- **E46** **Dado** una cantidad de 1,5 kg, **cuando** se la muestra, **entonces** dice «1,5 kg», y 3
  unidades dicen «3 un.».
- **E47** **Dado** dos personas, una con formato de 24 horas y otra con a. m./p. m., **cuando** miran
  la misma venta, **entonces** las dos ven la misma hora del negocio, cada una en su formato, y
  «hoy» es el mismo día para las dos.
- **E48** **Dado** un número calculado, **cuando** se lo mira, **entonces** se puede ver cómo se
  calculó desde la misma pantalla.

### Si algo falla

- **E49** **Dado** un error que la persona no puede resolver, **cuando** pasa, **entonces** se muestra
  «Algo salió mal», con qué hacer para seguir y un botón para avisarlo.
- **E50** **Dado** que se tocó avisar antes de que exista Mejoras y errores, **cuando** ese módulo
  exista, **entonces** el aviso guardado llega ahí.

### El ambiente de pruebas

- **E51** **Dado** el ambiente de pruebas, **cuando** se abre cualquier pantalla, **entonces** se ven
  el marco magenta fijo y el cartel «Ambiente de prueba · nada de esto es real».
- **E52** **Dado** producción, **cuando** se abre cualquier pantalla, **entonces** no hay marco ni
  cartel.

### Seguridad

- **E53** **Dado** el manual abierto sin haber entrado, **cuando** se lo recorre entero, **entonces**
  no muestra ningún dato del negocio.
- **E54** **Dado** el aviso de «Algo salió mal», **cuando** se lo manda, **entonces** lleva la captura
  y los últimos pasos, y no lleva datos de clientes ni la sesión de la persona.
- **E55** **Dado** cualquier pantalla, **cuando** la aplicación pide algo al servidor, **entonces** lo
  hace por HTTPS, a la misma dirección de la que se bajó la aplicación.
