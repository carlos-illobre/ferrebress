# Catálogo → Listas · proveedores y subir lista · maqueta final: en qué se diferencia de lo del director

Base: ninguna de las tres variantes del director. Carlos eligió la imagen que le generó otra
herramienta (`../carlos-reference.webp`) y pidió «arma algo de ese estilo»: es la referencia de
disposición de la computadora y del celular. De la imagen se toma **solo lo que no choca** con las
reglas aprobadas ni con el lenguaje visual (`docs/design/visual-language.md`); lo que choca se deja
como dicen las reglas o el lenguaje visual (Carlos: «si algo choca ignoralo, solo aplica las cosas
que no chocan»). Cada caso está anotado abajo.

De las variantes del director se toma el código de partida, no la estética: la subida simulada, soltar
un archivo en cualquier lado, las tostadas y el panel «Casos» (de `../shared/base.js` y
`../shared/v1.js`). Esta carpeta no depende de `../shared/`. Tiene:

- `index.html`: el marco y la cabecera, un solo HTML para la computadora y el celular (debajo de
  900 px).
- `lists.css`: el marco, la tabla, la subida, la hoja del celular y el panel «Casos».
- `lists.js`: los proveedores de ejemplo, la subida, los permisos, sin conexión, el teclado y los
  casos. Nada consulta la red.
- `icons-extra.js`: los íconos de Lucide que usa y `common/icons.js` no tiene.

El botón «Casos», arriba a la derecha, no es parte de la pantalla: elige qué archivo sube «Subir
lista» (formato conocido, formato nuevo con el nombre en el archivo, uno del que no se sabe de quién
es, uno que reemplaza la lista en espera, uno con fecha anterior, uno dañado, un PDF, uno de 31 MB),
los permisos de quien mira, sin conexión, sin proveedores y las animaciones. Con `#captura` en la
dirección no aparece y nada se mueve; `#captura&<estado>` deja la pantalla quieta en un estado.

Capturas:

- Computadora: `screenshot.png` (al abrir), `screenshot-reading.png` (leyendo, ya contestado «Sí»),
  `screenshot-question.png` (leyendo, con «¿Es de Bulonera Centro?»), `screenshot-choose.png`
  (elegir el proveedor, sin ninguno deducido), `screenshot-waiting-list.png` (terminada, en espera),
  `screenshot-replaces.png` (reemplaza la lista en espera), `screenshot-older-date.png` (fecha
  anterior a la última aplicada), `screenshot-unreadable.png` (archivo dañado),
  `screenshot-rejected.png` (un PDF), `screenshot-no-permission.png` (sin permisos),
  `screenshot-view-costs.png` (solo «Ver costos»), `screenshot-offline.png` (sin conexión),
  `screenshot-empty.png` (sin proveedores) y `screenshot-alt.png` (con Alt apretado).
- Celular: `screenshot-phone.png`, `-phone-reading`, `-phone-question`, `-phone-choose`,
  `-phone-waiting-list`, `-phone-no-permission` y `-phone-offline`.

## Lo que se toma de la imagen de Carlos

- **La pantalla como tabla** en la computadora: proveedor y vendedor (con la nota en cursiva),
  contacto (WhatsApp y correo), última lista aplicada con fecha y «hace N días», estado con su
  pastilla y su acción («Revisar →», «Ver motivo»), «Subir» en cada renglón y la flecha. Abajo,
  «Mostrando 1–7 de 12» y las páginas.
- **La barra de arriba de la tabla:** el buscador, los filtros con su número (Todos, En espera, No
  se pudo leer) y la zona para soltar «Arrastrá un Excel o CSV · .xlsx, .xls, .csv · Hasta 30 MB».
- **«Nuevo proveedor» y «Subir lista»** arriba a la derecha, y debajo del título «12 proveedores ·
  Precios actualizados desde sus planillas.».
- **La subida dentro de la tabla, abajo:** el ícono de la planilla, «Bulonera Centro · Leyendo
  lista», el archivo y su peso, «Lista completa / Solo cambios» con «Solo cambios nunca da de baja
  productos.», los pasos «Archivo subido 100 % → Lectura → Revisión», la barra con el porcentaje
  adentro, «4.120 de 7.096 filas», «Sincronizado con tu celular» y «Cancelar». El renglón del
  proveedor que se está leyendo dice «Leyendo lista…» y queda resaltado.
- **El pie con las teclas** de la computadora (recorrer, abrir, buscar, Esc).
- **El celular:** «Listas» con «Nuevo», el buscador, los filtros, una tarjeta por proveedor (nombre,
  vendedor, «Subir», flecha, teléfono, correo, nota, «Última: 29 oct · hace 14 días» y el estado), la
  subida abajo, arriba de «Subir lista», con el mismo contenido resumido.
- **Los estados de los recuadros de abajo de la imagen**, que no son parte de la pantalla sino
  casos, se muestran en la tarjeta de la subida o arriba de la tabla, desde el panel «Casos»: elegir
  el proveedor con «Proveedor nuevo», formato no admitido, más de 30 MB, archivo dañado, «esta carga
  reemplaza la lista en espera», sin conexión con «Reintentar», sin proveedores y fecha anterior a
  la última aplicada.

## Lo que se corrige por las reglas aprobadas

- **El menú** es el de 00 · R1.1, Vender · Catálogo · Depósito · Negocio · Más (a la izquierda en
  la computadora, abajo en el celular), no el de la imagen (Inicio, Ventas, Catálogo, Compras,
  Proveedores, Configuración; Inicio, Ventas, Catálogo, Más). El lateral suma el botón para
  minimizarlo (00 · R1.6) y al pie, como en las otras finales, la tarjeta del vínculo y la persona.
- **De quién es la lista (R4.3, E29 a E32):** la imagen dice «Proveedor reconocido automáticamente»
  sin preguntar. Ahora, cuando la lista no se sube desde un proveedor, al terminar de subir el
  sistema pregunta «¿Es de Bulonera Centro?» con «Sí» y «No, es de otro», y dice cómo lo dedujo («Lo
  reconoció por el formato de su planilla» o «Lo dedujo por el nombre del archivo»). **La lectura
  sigue mientras tanto**, y se dice. Con «No, es de otro», o si no pudo deducir ninguno, pide elegirlo
  de la lista de proveedores con un buscador y «Proveedor nuevo» (en la computadora, un panel
  sobre la tabla; en el celular, una hoja que sube). Si se elige uno distinto del deducido, la
  planilla se vuelve a leer como suya y se dice. Si la lectura termina antes de contestar, la
  tarjeta dice «Leída. Falta que digas de quién es para ver qué cambia.». Subida desde el renglón
  de un proveedor, no se pregunta nada: dice «Subida desde Bulonera Centro».
- **El elegir proveedor de la imagen** era una lista desplegable sin buscador; ahora es una lista
  con buscador (R4.3). «Proveedor nuevo» pide el nombre y «Continuar»; un nombre que ya existe, sin
  distinguir acentos ni mayúsculas, no se guarda y se dice «Ya existe «Ferretera del Sur».» (E10).
- **Los permisos (R1.2, R1.3, E01, E02):**
  - Sin ningún permiso se ven solo los proveedores con su nombre, vendedor, teléfono, correo y nota,
    con un aviso que lo explica. No se ven la última lista, el estado, los filtros, la zona para
    soltar, «Subir lista», «Subir» en cada renglón ni «Nuevo proveedor».
  - Con solo «Ver costos» se ve todo, sin «Subir lista», sin «Subir» en los renglones, sin la zona
    para soltar y sin «Nuevo proveedor».
  - «Subir lista» y «Subir» en cada renglón, solo con «Cargar listas». «Nuevo proveedor», solo con
    «Administrar proveedores»; por eso «Proveedor nuevo» al elegir de quién es la lista tampoco
    aparece sin ese permiso (ver la pregunta para Carlos, abajo).
- **Las esperas (00 · R7.3, R4.9):** al subir se ve cuánto del archivo («Archivo subido 45 %»); al
  leer, cuántas filas de cuántas; al terminar dice «Listo» un instante y después queda la lista en
  espera con su resumen (nuevos, cambian de costo con la variación, igual, ya no vienen, filas
  salteadas, «Lector nuevo: revisala» si corresponde) y «Revisar». La imagen decía «Se abrirá la
  revisión al terminar»; como hay que contestar antes de quién es, dice «Al terminar, vas a ver qué
  cambia.» y la revisión se abre con «Revisar» (la revisión es otra pantalla, R6).
- **Los nombres de los estados** son los de las reglas: «En espera» (R6.1), no «Pendiente de
  revisión» ni «Para revisar»; el filtro «Con errores» es «No se pudo leer» (R4.6; «No leídas» en el
  celular).
- **Las teclas de los atajos solo se ven con Alt apretado** (00 · R2.9): la imagen mostraba siempre
  «Alt + U» y «Alt + B». **Cada botón tiene su atajo** (00 · R2.8): Subir lista U, Nuevo proveedor N,
  Buscar B, los filtros 1, 2 y 3, «Subir» del renglón marcado P, Sí S, No, es de otro O, Proveedor
  nuevo E, Continuar I, Lista completa L, Solo cambios M, Cancelar o Cerrar C, Revisar V, Bajar el
  archivo J, Reintentar R, página anterior A y siguiente G, minimizar el menú E (en el lateral; el
  de «Proveedor nuevo» vale solo con el panel abierto, 00 · R2.10).
- **Esc no cancela la subida,** como decía la imagen («Cancelar · Esc»): Esc cierra lo que está
  encima (el panel de elegir proveedor) o saca la marca (00 · R2.7). El pie de las teclas lo dice
  así. Cancelar es Alt C.
- **El teclado de la computadora:** al abrir, el cursor está en el buscador (00 · R2.2); ↑ ↓ mueven
  la marca por los renglones y Enter abre el proveedor (R2.4, R2.6); con el cursor en el buscador y
  nada marcado, Enter sube una lista (la acción principal, R2.6). En el celular el cursor nunca
  arranca en el buscador (R2.12).
- **La búsqueda** espera 150 ms sin tipear y no distingue acentos ni mayúsculas (00 · R7.4, R1.1).
- **El vínculo con el celular** va al pie del lateral, en la tarjeta con la luz de conexión debajo
  y lo que gasta la aplicación (00 · R4.1; 03 · R4.1, R4.5), con el texto de 03 («Directo · Chrome en
  Android»), no arriba a la derecha como «Celular vinculado». En el celular, debajo del título, con
  la luz a su lado solo sin conexión.
- **El celular no tiene cabecera con el logotipo ni el menú hamburguesa** (00 · R4.1): el título
  «Listas» empieza arriba de todo.
- **El logotipo** es el de `common/brand/`, el único de la aplicación, no la casita con «Ferrebress»
  de la imagen.
- **Sin conexión (R1.5, E07):** la tabla se ve gris con lo último que se vio, con «Reintentar», y no
  se puede subir ni cambiar nada; la luz dice «Sin conexión · 0 por enviar».
- **Rechazos (R4.2, E33, E34):** un PDF o un archivo de 31 MB se rechazan antes de subir, diciendo
  por qué y «No se guardó.».
- **Archivo dañado (R4.6, E37):** dice por qué, «Quedó como «No se pudo leer», con su archivo
  guardado, y anotada en Anomalías», con «Bajar el archivo» (R4.4). La imagen decía «Guardado para
  su revisión».
- **Reemplazo (R4.8, E38):** al confirmar el proveedor, si tenía una lista en espera, dice «Tenía
  una lista en espera, del 11/11/2026: esta la reemplaza.», y al terminar «Reemplazó a la lista que
  estaba en espera, que quedó descartada.».
- **Fecha anterior (R6.10):** la lista no se puede aplicar, se dice por qué con las dos fechas, y
  el botón es «Descartar».
- **Solo cambios (R4.7):** con «Solo cambios», el resumen no muestra «ya no vienen».
- **El ambiente de pruebas** lleva el marco magenta y el cartel (00 · R10.1), como las otras
  finales.
- **Las fechas** van en el orden día, mes y año (00 · R8.5) y en 2026: «06 nov 2026 · hace 8 días»;
  en el celular, «Última: 6 nov · hace 8 días».
- **Los datos** son inventados: nombres, teléfonos 555 y correos de empresas ficticias.

## Lo que se deja como dice el lenguaje visual (choca con la imagen)

- **«Subir lista» es naranja** (`.btn-accion`), la única acción principal de la pantalla; en la
  imagen era verde. «Revisar» es un botón común, para que no haya dos principales.
- **Las pestañas de la computadora van subrayadas en pino** debajo de la cabecera (Productos ·
  Listas · Duplicados, con la insignia naranja en Duplicados); en la imagen eran pastillas con la
  elegida en verde lleno y estaban arriba del título.
- **Las pestañas del celular son segmentos con la elegida en blanco** (`.celu-pestanas`); en la
  imagen, la elegida era verde llena. El título va arriba de las pestañas, como en el marco del
  celular.
- **Ningún texto mide menos de 14 px:** la imagen tenía textos de 11 y 12 px en la tabla, los
  filtros y la subida. Por eso los renglones son algo más altos y, con la subida abierta, entran
  menos proveedores sin desplazarse (la lista se desplaza dentro de la tabla).
- **Los colores son los de la paleta:** pino para lo elegido y los nombres, ámbar para «En espera»
  y la pregunta, rojo para «No se pudo leer», verde para «Al día» y lo que salió bien; la barra de
  avance va en pino y en verde al terminar.
- **Los íconos son los de Lucide** del lenguaje visual (`store` para el proveedor,
  `message-circle` en el verde de efectivo para WhatsApp, `mail`, `calendar`).
- **«Sí» va en pino lleno** (el botón oscuro), no en naranja, porque la acción principal es «Subir
  lista».

## Lo que se ajusta por la tecnología

- **Elegir el archivo:** la maqueta no abre el diálogo del sistema; «Subir lista», la zona para
  soltar y soltar un archivo en cualquier lado de la pantalla (computadora) simulan el archivo que
  elige «Casos».
- **Las animaciones son solo de `transform` y `opacity`:** la barra crece con `scaleX`, el renglón
  que recibe la lista se ilumina con un borde que se apaga por opacidad, el círculo de «Lectura» y
  el de «Leyendo lista…» giran, la tarjeta entra subiendo 8 px y la hoja del celular sube. Con
  «reducir movimiento» o «Animaciones» apagado, nada se mueve.
- **«Sincronizado con tu celular»** es un rótulo: en la maqueta no hay otro dispositivo.

## Lo que se interpretó sin estar escrito

- **Mientras una lista se sube o se lee, «Subir lista» queda apagado** (como en el celular de la
  imagen): se sube una por vez.
- **Si no se pudo deducir el proveedor y se elige uno,** la lectura sigue sin volver a empezar: no
  había otro deducido del que cambiar.
- **«Al día»** (de la imagen) quiere decir que no tiene nada pendiente: ni lista en espera ni una
  que no se pudo leer. No mira cuántos días pasaron.
- **Las páginas** (de la imagen) son de 7 proveedores en la computadora; el celular los muestra todos
  y se desplaza. Los números de página solo indican dónde se está; se pasa con ‹ y › (Alt A y Alt G),
  para que cada botón tenga su atajo.
