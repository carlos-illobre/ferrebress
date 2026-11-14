# Catálogo → Listas · proveedores y subir lista: tres ideas para Carlos

Las seis maquetas (tres en la computadora y tres en el celular, emparejadas por número) funcionan:
se sube, se busca, se elige. Cada una se abre sola desde su `index.html`; las capturas lado a lado
están en `desktop-comparison.png` y `phone-comparison.png` (arriba la pantalla en reposo, abajo en
plena subida). El botón «Casos», arriba a la derecha, no es parte de la pantalla: elige qué archivo
se sube (formato conocido, formato nuevo que pregunta de quién es, uno que no se puede leer, un
PDF) y prueba sin conexión y sin permisos.

Todas muestran lo mismo: 12 proveedores, 29.683 productos, Ferretera del Sur con una lista en
espera, Tornillería Belgrano con una que no se pudo leer y Maderas Pampa sin lista. La lista que se
sube es `bulonera-centro-noviembre.xlsx`: 7.096 filas = 4 nuevos + 876 que cambian de costo
(+8,4 %) + 6.210 iguales + 6 salteadas; además 12 productos ya no vienen.

## Las tres variantes

| | La idea en una frase | Ideas del catálogo |
|---|---|---|
| **1 · La mesa de entrada** (evolución) | Lo que piden las reglas: los proveedores en renglones con su última lista y un solo botón naranja, «Subir lista»; la subida es una tarjeta con sus tres pasos (subir, reconocer, leer) que termina en «Ver qué cambia». En el celular la tarjeta vive en la barra de abajo, bajo el pulgar. | 1, 2, 3, 4, 5, 6, 7 |
| **2 · La bandeja se sirve sola** (reinvención) | Nadie busca el archivo: el sistema encuentra las planillas que llegaron al dispositivo (WhatsApp, correo, Descargas) y las ofrece; un toque, «Subir las 3», y cada una avanza en su renglón mientras se sigue trabajando. Los proveedores no van por abecedario sino por lo que hay que hacer: para revisar, no se pudo leer, hace rato que no mandan, al día. | 2, 4, 5, 8, 9, 10, 11, 12, 13 |
| **3 · El estante** (la que nadie se animaría) | Sin menú ni pestañas: cada proveedor es un bibliorato. El ancho es cuántos productos trae y el papel amarillea con los días de su última lista; la lista en espera es una hoja naranja que asoma. Subir oscurece todo: la planilla entra a la pantalla a medida que sube, recibe el sello del proveedor y un láser la lee fila por fila mientras cuentan los nuevos, los que cambian y los iguales. | 2, 4, 14, 15, 16, 17, 18, 19, 20 |

## La que prefiero

**La 2, con la escena de lectura de la 3.** Carlos pidió que subir sea «lo menos manual posible»:
la 2 es la única que saca el paso más manual de todos, que es ir a buscar el archivo, y la única
que sube varias listas de una vez (el día que llegan tres, es un toque en vez de nueve). Ordenar los
proveedores por lo que hay que hacer convierte la pantalla en una lista de pendientes. De la 3 me
llevaría la escena: ver la planilla leerse fila por fila es el avance más claro de los tres y da
confianza en que el sistema entendió el archivo. La 1 es la más segura y la más fácil de construir;
la 3 completa es hermosa pero con 40 proveedores el estante necesita desplazarse.

## Qué rompe cada una

- **1 · La mesa de entrada:** nada. Suma dos cosas que las reglas no piden: la cantidad de
  productos en las listas y el filtro por «en espera» y «no se pudo leer».
- **2 · La bandeja se sirve sola:**
  - Encontrar sola las planillas del dispositivo no está en las reglas (R4.1 dice que se sube un
    archivo; «Afuera» deja fuera las listas que llegan solas). Un navegador no puede leer las
    carpetas del celular ni el correo: hace falta una aplicación instalada o compartir desde
    WhatsApp hacia Ferrebress.
  - Subir varias a la vez no está escrito (tampoco prohibido).
  - No se elige «Lista completa» o «Solo cambios» al subir (R4.7): todas entran como completas y
    habría que poder cambiarlo al revisar.
  - «Hace más de 30 días que no mandan» inventa un umbral que no existe en las reglas.
  - No hay orden alfabético y no hay botón «Subir» en cada proveedor: se sube desde su pantalla.
  - En el celular no queda una acción fija abajo cuando no hay planillas por subir.
- **3 · El estante:**
  - El marco: no hay lateral, pestañas ni menú de abajo; se vuelve a Catálogo con la F.
  - El lenguaje visual: el papel amarillo es un color nuevo y fuera de la paleta, y la escena de
    subida es una pantalla entera en pino (el lenguaje permite lo oscuro «cuando la tarea lo
    pide», pero no un color propio de fondo).
  - El orden de pantalla «resumen → filtros → lista»: no hay tarjetas de resumen ni filtros.
  - Los datos de contacto no están a la vista de todos a la vez (R1.3): se ven al elegir uno.
  - Muestra nuevos, cambian e iguales mientras lee; las reglas solo piden filas leídas (R4.9).
  - La escena tapa la pantalla: mientras se lee una lista no se puede hacer otra cosa acá.

## Cómo se mueve cada interacción

- **Subir (1):** la tarjeta entra desde abajo con un rebote corto; cada paso es una barra que se
  llena; al reconocer, la segunda barra tiene un brillo que la recorre; el número de filas corre.
  Al terminar, las barras pasan a verde, el borde late una vez y el celular vibra 10-40-10.
- **Subir (2):** el ícono del archivo se llena de abajo hacia arriba como un vaso; al terminar se
  vuelve un tilde verde. El proveedor reconocido salta al grupo «Leyendo ahora» con una barra fina
  en su borde, y después a «Para revisar» con un destello verde.
- **Subir (3):** la pantalla se funde a pino; la hoja sube desde abajo exactamente al ritmo de la
  subida; el sello del proveedor cae con rebote; el láser naranja baja por la hoja y cada fila
  enciende su punto (verde nuevo, ámbar cambia, gris igual); el número grande corre. Al volver, la
  hoja naranja asoma del bibliorato.
- **Elegir un bibliorato (3):** sale 18 px del estante y queda con el borde pino; en el celular se
  corre a la derecha. ← → lo recorren; escribir en cualquier lado busca y apaga los que no
  coinciden.
- **Soltar un archivo (las tres, computadora):** toda la pantalla se vuelve la zona para soltar,
  con un recuadro naranja que crece.
- **Preguntar de quién es:** aparece en el mismo lugar donde estaba el avance, con los tres
  proveedores más parecidos primero (teclas 1, 2, 3 en la 2 y la 3).

## Teclado (computadora)

`Alt S` subir · `/` buscar (en la 3, escribir directamente) · `↑ ↓` o `← →` recorrer los
proveedores · `1 2 3` contestar de quién es · `Esc` limpiar la búsqueda o cancelar · mantener `Alt`
muestra las teclas que no están siempre a la vista.

## Autocrítica

Primera pasada, lo más flojo y lo que se corrigió:

- **1:** los renglones medían 84 px y entraban cuatro proveedores; ahora miden 62 y entran seis, con
  un encabezado de columnas. La frase y el número grande decían lo mismo; ahora la frase dice de
  quién es. En el celular la tarjeta ocupaba media pantalla; se sacaron el peso y el número
  duplicado.
- **2:** los grupos de un solo proveedor dejaban media pantalla vacía; ahora lo que pide atención va
  en una columna y «Al día» en la otra, y entra todo sin desplazar. El porcentaje del renglón y el
  del proveedor no coincidían; ahora uno dice el avance total y el otro las filas.
- **3:** en el celular los nombres se cortaban; los lomos acostados son más anchos y el rótulo no
  lleva caja. Las filas leídas se veían vacías por un choque de nombres con los íconos.

Lo que sigue flojo: en la 1, mientras hay una tarjeta de subida entran menos proveedores; en la 2,
la pregunta «¿de quién es?» ocupa mucho alto con cinco opciones; en la 3 no hay fotos ni
ilustración propia y el estante no resuelve más de unos 16 proveedores sin desplazarse. Ninguna
variante lleva fotos de producto: esta pantalla no muestra productos.

## Catálogo de ideas

| # | Idea | Qué resuelve | Variantes | De dónde viene | Toques que ahorra | Fuera de las reglas |
|---|---|---|---|---|---|---|
| 1 | Las tarjetas de resumen son los filtros (en espera, no se pudo leer) | Ver lo pendiente sin leer la lista entera | 1 | Stripe Dashboard | 1 | Sí: el filtro no está pedido |
| 2 | Soltar el archivo en cualquier lugar de la pantalla | No hay que apuntar a una zona | 1, 2, 3 | Linear, Google Drive | 1 | No |
| 3 | La subida como tarjeta de tres pasos que termina en «Ver qué cambia» | Se ve en qué etapa está y qué falta | 1 | Stripe, pagos por pasos | 0 | No |
| 4 | «Lista completa / Solo cambios» se elige mientras sube, con «completa» ya marcada | No frena la subida con una pregunta | 1, 3 | Subida de fotos de Apple | 1 | No (R4.7 dice «al subirla») |
| 5 | La pregunta «¿de quién es?» con los tres proveedores más parecidos primero | Contestar con un toque en vez de buscar en doce | 1, 2, 3 | Sugerencias de contacto de iOS | 2 | No |
| 6 | En el celular, el avance vive en la barra de abajo | Se ve siempre, aunque se desplace la lista | 1 | Reproductor de Spotify | 0 | No |
| 7 | «Subir» en cada renglón: ya se sabe de quién es | Saltea el reconocimiento con un formato nuevo | 1, 3 | — | 1 | No (R4.1) |
| 8 | El sistema encuentra las planillas que llegaron al dispositivo | Saca el paso más manual: buscar el archivo | 2 | Fotos de Google, «Compartir con» de Android | 3 por lista | Sí |
| 9 | Subir todas juntas con un botón | El día que llegan tres listas, un toque | 2 | AirDrop, cola de descargas | 2 por lista de más | Sí (no está escrito) |
| 10 | Proveedores agrupados por lo que hay que hacer | La pantalla es la lista de pendientes | 2 | Bandeja de Linear | 1 | Sí: no es el orden pedido |
| 11 | Las cinco rayitas de frescura de cada lista | Ver de un vistazo quién no manda hace rato | 2 | Señal del celular | 0 | Sí: el umbral de 30 días |
| 12 | El archivo que se llena como un vaso | El avance sin una barra más | 2 | Descargas de iOS | 0 | No |
| 13 | El proveedor muestra en su ficha que se está leyendo su lista | El avance se ve también donde se va a mirar después | 2 | Linear | 0 | No |
| 14 | Biblioratos: el ancho es la cantidad de productos | Se ve el peso de cada proveedor sin leer números | 3 | Estantería de Apple Books | 0 | Sí |
| 15 | El papel amarillea con los días | La antigüedad se ve sin leer fechas | 3 | El papel de verdad | 0 | Sí: color fuera de la paleta |
| 16 | La hoja naranja que asoma: lista en espera | Lo pendiente sobresale, literalmente | 3 | Señaladores | 0 | Sí |
| 17 | La planilla entra a la pantalla al ritmo de la subida | El avance es el archivo mismo | 3 | Wallet al agregar una tarjeta | 0 | Sí: pantalla entera |
| 18 | El láser lee fila por fila y cuenta nuevos, cambian e iguales | Confianza: se ve que entendió el archivo | 3 | Escáner de documentos de iOS | 0 | Sí: adelanta el resumen |
| 19 | El sello con el nombre del proveedor | El momento «la reconoció sola» se festeja | 3 | Sellos de mesa de entrada | 0 | No |
| 20 | Escribir en cualquier lado busca | No hay que ir al campo | 3 | Spotlight, Linear | 1 | No |
