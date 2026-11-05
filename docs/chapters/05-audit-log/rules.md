# 05 · Quién hizo qué: reglas

El registro de lo que hace cada persona en el sistema, y cómo se consulta. Lo anotan todos los
capítulos; este dice qué se guarda de cada acción, quién lo ve y cómo.

**Estado:** reglas aprobadas.

**La idea:** la base guarda el presente y este registro, la historia (constitución, principio V).
Solo recibe acciones nuevas: nada de lo anotado se cambia ni se borra desde la aplicación.

**Fuera de este capítulo, por ahora:** la historia de un dato (todo lo que le pasó a un precio o a
un stock) se muestra con el catálogo, cuando hay productos reales que mostrar; este capítulo ya
guarda, de cada acción, la cosa que tocó, para poder leerla después. Cuánto tiempo se guarda el
registro se decide con el plan de copias de la base.

## 1. Qué se anota

- **R1.1** Se anota **cada acción que cambia algo**, en cualquier capítulo: cada uno dice en sus
  reglas qué anota (por ejemplo, 01 · E44, 02 · R6.1, 15 · R3.3). Un capítulo nuevo suma sus
  acciones sin cambiar este.
- **R1.2** Se anotan también **los intentos rechazados**: un correo que no está autorizado, una
  huella que no se conoce, un código vencido, un pedido sin el permiso que hace falta, un límite de
  intentos alcanzado. Es lo que más interesa si alguien quiere entrar o hacer lo que no puede.
- **R1.3** **Mirar no se anota:** abrir una pantalla, buscar o ver un dato no deja nada; anotarlo
  multiplicaría el registro y diría poco. **La excepción es Quién hizo qué:** la primera vez que una
  sesión lo abre en el día queda «Abrió Quién hizo qué», con quién y desde dónde. Así, si alguien
  usa la sesión de otro para mirar el registro, queda el rastro. Las demás veces de ese día, no.
- **R1.4** Las acciones se anotan **cuando el cambio quedó guardado**: una acción que no se guardó
  no figura como hecha (sí, si corresponde, como intento rechazado).

## 2. Qué se guarda de cada acción

- **R2.1** **Qué pasó:** el tipo de acción, con un texto que se entiende sin saber de sistemas
  («Le dio el rol Vendedor a Marcos»), escrito por el capítulo que la conoce, y su grupo (la parte
  de la aplicación: Entrar, Usuarios, Roles, Sin conexión, Rechazos, y las que sumen los demás
  capítulos).
- **R2.2** **Cuándo:** la fecha y la hora del servidor (constitución, principio VI). Lo hecho sin
  conexión cuya hora el servidor no pudo confirmar lleva la hora del celular, con la marca «hora
  del celular, sin confirmar» (15 · R3.3).
- **R2.3** **Quién:** la persona que la hizo, con el nombre que tenía en ese momento. Si después le
  cambiaron el nombre, se muestra el de entonces y, al lado, «(hoy: <nombre de hoy>)».
  - Lo que hace el sistema solo figura como «El sistema».
  - Un intento de alguien que no entró figura con el correo que usó, si lo hay, o como «Alguien sin
    entrar».
- **R2.4** **A quién o a qué:** la persona, el rol o la cosa que la acción tocó, también con el
  nombre que tenía en ese momento. Una acción puede tocar más de una.
- **R2.5** **Qué cambió:** de cada cambio, solo lo que cambió, con lo que había antes y lo que
  quedó («Nombre: Marcos → Marcos Pérez»). No se guarda la cosa entera.
- **R2.6** **Desde dónde:** el tipo de dispositivo (celular o computadora), el navegador y la
  dirección de internet desde la que llegó el pedido.

## 3. Quién lo ve

- **R3.1** Lo ve quien tiene el permiso de este capítulo (02 · R7.1), en su grupo «Usuarios»:

  | Permiso | Qué deja hacer |
  |---|---|
  | Ver quién hizo qué | Abrir Quién hizo qué y ver todas las acciones de todos, con su detalle |

  Incluye «Ver las personas» (02 · R7.1): Quién hizo qué es una pestaña de Usuarios, y quien ve
  todas las acciones ya ve a todas las personas.

  Al instalar lo tiene el rol Administrador, como todo permiso (02 · R7.4).
- **R3.2** Quien tiene el permiso ve **todo**, también los datos de capítulos que no puede usar
  (un costo, cuando exista el catálogo). Por eso se da solo a quien puede verlo todo. No se esconde
  parte de una acción: un registro con huecos no sirve para saber qué pasó.
- **R3.3** Sin el permiso, la pestaña no aparece y el servidor rechaza el pedido (02 · R7.6,
  R7.7). Nadie ve lo suyo sin el permiso: no hay una vista propia.
- **R3.4** Los datos personales que guarda (el correo de un intento, la dirección de internet) los
  ve solo quien tiene el permiso, en el detalle de la acción (R4.7).

## 4. La pestaña

- **R4.1** **Dónde:** Más → Usuarios → Quién hizo qué (00 · R1.2, 02 · R2.1), en la computadora y en
  el celular, con las mismas reglas (00 · R1.5).
- **R4.2** **Al abrir** muestra todas las acciones, de la más nueva a la más vieja, sin filtros.
- **R4.3** **De a cuántas:** de a 20 en la computadora y de a 10 en el celular, siempre con el
  total que coincide con los filtros y la página en la que se está («página 3 de 8»), con
  anterior y siguiente.
- **R4.4** **Cada acción, en la lista:** a la izquierda, el ícono de su tipo (R4.10); la hora (y la
  fecha, si no es de hoy), quién, el texto de qué pasó, a quién o a qué y el tipo de dispositivo. Lleva un color según lo que es:
  - **Rojo:** lo que borra o saca: dar de baja, borrar una persona o un rol, cortar un celular
    perdido, quitar un celular con huella, cerrar las sesiones de otro. Los capítulos que vienen
    suman los suyos (una venta anulada).
  - **Ámbar:** los intentos rechazados (R1.2) y la entrada sin conexión que el servidor no pudo
    confirmar (15 · R3.2).
  - **Sin color:** todo lo demás.
- **R4.5** **Los filtros**, que se combinan entre sí:
  - **Hecho por:** una persona, o «El sistema», o «Alguien sin entrar».
  - **Hecho a:** una persona, para ver todo lo que le hicieron (sus roles, sus sesiones, su baja).
  - **Fecha:** desde y hasta, con los atajos «Hoy», «Ayer», «Esta semana» (de lunes a hoy) y
    «Este mes». Los días son los del negocio, no los del dispositivo.
  - **Tipo:** por grupo (R2.1) y, dentro de cada grupo, por tipo de acción.

  Las listas de personas de los filtros incluyen a las dadas de baja y a las borradas, con el
  nombre que tenían; las borradas, con «(borrada)» y sin su correo, que desaparece con ellas
  (02 · R3.7). Cambiar un filtro vuelve a la página 1. Si nada coincide, lo dice y ofrece
  sacar los filtros.
- **R4.6** **«Actualizar solo»:** un selector, prendido o apagado, en el lugar donde iba «Actualizar».
  Se ve solo cuando lo que muestran las fechas incluye hoy (con otro día, lo nuevo no entraría).
  Al abrir la pestaña está prendido en la computadora y apagado en el celular, por los datos; no se
  recuerda de una vez a la otra y no viaja por el espejo (03 · R6): cada dispositivo paga sus datos.
  - **Prendido**, mientras la pestaña está a la vista, el servidor avisa que hay acciones nuevas, por
    el mecanismo común (03 · R7). El aviso no lleva ningún dato de las acciones: la lista se pide
    con sus filtros, como siempre. Como mucho una vez cada 5 segundos, aunque lleguen muchas juntas.
    - **Arriba de todo**, en la página 1 y sin haber bajado: la lista, el resumen (R4.9) y la tira
      del día se ponen al día; lo que entra se marca un momento, para que se note.
    - **Más abajo, o en otra página:** no se mueve nada. Arriba aparece «3 nuevas» (las que cumplen
      los filtros); al tocarlo, sube a la página 1 y las muestra.
    - **Con la cinta abierta** (R4.11), no cambia: está mostrando el día.
    - Lo que hace uno mismo también aparece (por ejemplo, «Abrió Quién hizo qué», R1).
    - Prenderlo pone la lista al día en el momento.
  - **Apagado**, la aplicación no le pide nada al servidor sin que la toquen (constitución,
    principio III): la lista se pone al día al tocar la pestaña, al cambiar un filtro o de página,
    al tocar un número del resumen o al prender el selector.
  - **Oculta o sin conexión**, no hay canal abierto. Al volver a la vista, o al volver la conexión,
    si está prendido se pone al día una vez sola.
  - Si mientras mira le sacan el permiso, el canal se corta y ve «Ya no tenés permiso» (02 · R6.6).
- **R4.7** **El detalle:** en la computadora está siempre abierto al lado de la lista y muestra la
  acción elegida, que cambia al recorrer la lista con el teclado; al abrir, la primera. En el celular
  se abre al tocar una acción. Se ve todo lo que se guardó de ella (R2): qué pasó,
  cuándo, quién, a quién o a qué, lo que había antes y lo que quedó, el dispositivo, el navegador y
  la dirección de internet. Los nombres de las personas son solo texto: tocarlos, una o dos veces,
  es tocar la acción y no filtra. Para ver lo de una persona están «Hecho por» y «Hecho a».
- **R4.8** En la computadora todo se hace con el teclado: recorrer la lista, abrir el detalle,
  cambiar de página y llegar a los filtros (00 · capítulo 2).

- **R4.9** **Arriba de la lista, un resumen** del período que muestran los filtros de fecha (al
  abrir, de hoy):
  - tres números: cuántas acciones hubo, cuántos intentos rechazados y cuántas acciones borraron o
    sacaron algo (las rojas de R4.4). Tocar los rechazos o lo que borró o sacó filtra la lista por
    eso, en el período del resumen (pone ese período como fecha y saca el filtro por tipo); tocarlo
    de nuevo saca ese filtro; tocar el total saca los dos;
  - en la computadora, el día en una tira: una raya por acción, en su hora y con su color, en el
    tramo de horas que tiene acciones (con más de 2.000 acciones en el día, que no entran en ese
    ancho, una raya por minuto, la más nueva de ese minuto); tocar la tira en cualquier punto abre
    la cinta en la acción más cercana a ese punto, sin tener que acertarle a una raya (R4.11). Con
    el teclado, la abre en la más nueva.
- **R4.10** **Cada tipo de acción tiene su ícono,** que no se repite entre tipos y es el mismo en
  todas partes. Lo elige el capítulo que anota la acción, junto con su texto (R2.1). Un intento
  rechazado tiene su propio tipo y, por lo tanto, su propio ícono.
- **R4.11** **La cinta: el día como una grabación.** Se abre en la computadora tocando la tira,
  posada en la acción más cercana a donde se tocó, y en el celular con «Ver el día», al lado del resumen. Ocupa toda la
  pantalla, sin el menú; la × o Escape (en el celular, también atrás) vuelven a la lista como estaba.
  - Muestra un día entero, sin los filtros de la lista: el de la tira tocada o, con «Ver el día», el
    del resumen (si el período es de varios días, hoy). Arriba, los días de la semana, cada uno con
    su cantidad y sus colores; tocar uno cambia de día.
  - Una fila por persona que hizo o recibió algo ese día, más «Alguien sin entrar» y «El sistema»
    si tuvieron acciones; un punto por acción, en su hora y con su color, y una línea que une a quien
    la hizo con quien la recibió. En el celular, el tiempo va de arriba hacia abajo y la cinta se
    pasa con el pulgar.
  - **El cabezal** está siempre en una acción: se arrastra (y se pega a la más cercana) o se pasa de a
    una con ← → (en el celular, con los botones o deslizando). La acción del cabezal se lee entera
    abajo, como un subtítulo, con lo mismo que el detalle (R4.7).
  - **«Reproducir el día»** pasa el cabezal solo por todas las acciones, en orden (en la computadora,
    el día entero en unos 14 segundos; en el celular, una acción por segundo), y se detiene al tocar
    cualquier cosa o al llegar a la última. Con «reducir movimiento» en el dispositivo, salta de una a
    otra sin deslizarse.
  - **Aislar a alguien:** tocar la fila de una persona deja en primer plano lo que hizo y lo que
    recibió, y el resto se apaga; ← → y «Reproducir» recorren solo eso. Tocarla de nuevo, o Escape, la
    suelta.
  - Si el día tiene más de 2.000 acciones, la cinta no se abre y dice que hay demasiadas para verlas
    así, y que conviene usar la lista con filtros.

- **R4.12** **Lo que gasta esta pantalla**, debajo de «Actualizar solo», en letra chica: los KB por
  minuto que gasta ahora la actualización automática de Quién hizo qué (el canal, sus avisos y los
  pedidos de la lista que hace sola; lo que se pide al tocar algo no cuenta), medidos sobre el último
  minuto, como el medidor de la aplicación (03 · R4.5). No es un acumulado. Apagado, dice 0. Lo que
  gasta la aplicación entera no va acá: está en el vínculo (03 · R4.5).

## 5. La conexión

- **R5.1** Quién hizo qué necesita conexión: sin conexión, se ve gris con «Sin conexión», como el
  resto de Usuarios (02 · R2.2), y vuelve sola al volver la conexión (00 · R4.4): sale del gris sin pedir nada, y la lista queda como
  estaba hasta que se toque algo.

## 6. Lo que no se hace, y por qué

- **Exportar o imprimir** a una planilla o un PDF: nadie lo necesita hoy.
- **Buscar por texto** en las acciones: los filtros alcanzan; se suma si hace falta.
- **Que cada persona vea lo suyo sin permiso:** nadie lo pidió y sería una pantalla más para todos.
- **Esconder parte de una acción** a quien no puede usar ese capítulo: R3.2.

## Escenarios

### Qué se anota

- **E01** **Dado** una persona con permiso, **cuando** hace una acción que cambia algo en cualquier
  capítulo y se guarda, **entonces** queda anotada con quién, cuándo, qué pasó, a quién o a qué, lo
  que cambió y desde dónde.
- **E02** **Dado** una acción que no se pudo guardar, **cuando** se mira Quién hizo qué, **entonces**
  no figura como hecha.
- **E03** **Dado** alguien que intenta entrar con un correo no autorizado, **cuando** se rechaza,
  **entonces** queda anotado en ámbar, con el correo que usó y «Alguien sin entrar» como quién.
- **E04** **Dado** una persona sin un permiso, **cuando** su pedido se rechaza por eso, **entonces**
  queda anotado en ámbar, con quién fue y qué permiso le faltó.
- **E05** **Dado** una persona que abre pantallas y busca, **cuando** se mira el registro,
  **entonces** nada de eso figura.
- **E05b** **Dado** una sesión que abre Quién hizo qué tres veces en el día, **cuando** se mira el
  registro, **entonces** figura una sola vez «Abrió Quién hizo qué», con quién y desde dónde; al día
  siguiente, la primera vez que lo abre, figura de nuevo.
- **E06** **Dado** un cambio de nombre de una persona, **cuando** se mira su detalle, **entonces**
  dice solo lo que cambió, con lo que había antes y lo que quedó.

### Quién y cuándo

- **E07** **Dado** acciones de Marcos, **cuando** después le cambian el nombre a «Marcos Pérez»,
  **entonces** sus acciones anteriores dicen «Marcos (hoy: Marcos Pérez)», como quién y como a quién.
- **E08** **Dado** una acción del sistema, **cuando** se mira la lista, **entonces** dice «El
  sistema» como quién.
- **E09** **Dado** una entrada sin conexión que el servidor no pudo confirmar, **cuando** se mira la
  lista, **entonces** va en ámbar con la hora del celular y la marca «hora del celular, sin
  confirmar».
- **E10** **Dado** cualquier acción con conexión, **cuando** se anota, **entonces** lleva la hora del
  servidor, aunque el reloj del dispositivo esté atrasado.

### Quién lo ve

- **E11** **Dado** una persona con «Ver quién hizo qué», **cuando** abre Más → Usuarios, **entonces**
  ve la pestaña Quién hizo qué y todas las acciones de todos.
- **E12** **Dado** una persona sin el permiso, **cuando** abre Más → Usuarios, **entonces** no ve la
  pestaña.
- **E13** **Dado** una persona sin el permiso, **cuando** abre Quién hizo qué por la dirección,
  **entonces** ve «No tenés permiso para Quién hizo qué: hace falta «Ver quién hizo qué»» (02 · R7.7).
- **E14** **Dado** una persona sin el permiso, **cuando** le pide las acciones al servidor sin pasar
  por la aplicación, **entonces** el servidor lo rechaza sin dar ningún dato, y queda anotado como
  pedido sin permiso.
- **E15** **Dado** un sistema recién instalado, **cuando** se miran los permisos del rol
  Administrador, **entonces** tiene «Ver quién hizo qué».
- **E16** **Dado** alguien con el permiso que no puede usar otro capítulo, **cuando** abre el
  detalle de una acción de ese capítulo, **entonces** la ve entera.

### La lista

- **E17** **Dado** 45 acciones, **cuando** se abre Quién hizo qué en la computadora, **entonces**
  muestra las 20 más nuevas, de la más nueva a la más vieja, con «45 acciones» y «página 1 de 3».
- **E18** **Dado** 45 acciones, **cuando** se abre en el celular, **entonces** muestra las 10 más
  nuevas, con «45 acciones» y «página 1 de 5».
- **E19** **Dado** la página 1, **cuando** se va a la siguiente, **entonces** muestra las 20 que
  siguen; en la primera página «anterior» está apagado, y en la última, «siguiente».
- **E20** **Dado** ninguna acción, **cuando** se abre, **entonces** dice que todavía no hay nada
  anotado.
- **E21** **Dado** una baja, el borrado de un rol y un celular cortado, **cuando** se miran en la
  lista, **entonces** van en rojo; un rol dado, sin color.
- **E22** **Dado** una acción de ayer, **cuando** se mira en la lista, **entonces** muestra la fecha
  además de la hora; una de hoy, solo la hora.

### Los filtros

- **E23** **Dado** acciones de Marcos y de Lucía, **cuando** se filtra «Hecho por: Marcos»,
  **entonces** se ven solo las de Marcos, con su total, desde la página 1.
- **E24** **Dado** que a Marcos le dieron un rol, le cerraron una sesión y él cambió el nombre de
  Lucía, **cuando** se filtra «Hecho a: Marcos», **entonces** se ven el rol y la sesión, y no el
  cambio de Lucía.
- **E25** **Dado** acciones de ayer y de hoy, **cuando** se elige «Hoy», **entonces** se ven solo las
  de hoy según el día del negocio; con «Ayer», solo las de ayer.
- **E26** **Dado** un desde y un hasta, **cuando** se aplican, **entonces** se ven las acciones de
  esos días, los dos incluidos.
- **E27** **Dado** el tipo «Rechazos», **cuando** se elige, **entonces** se ven solo los intentos
  rechazados; con un tipo de acción dentro del grupo, solo esa acción.
- **E28** **Dado** «Hecho por: Marcos», «Esta semana» y el grupo «Roles», **cuando** se combinan,
  **entonces** se ve solo lo que cumple los tres.
- **E29** **Dado** filtros que no coinciden con nada, **cuando** se aplican, **entonces** dice que no
  hay acciones con esos filtros y ofrece sacarlos.
- **E30** **Dado** una persona dada de baja o borrada, **cuando** se abre el filtro de personas,
  **entonces** figura, con el nombre que tenía, y sus acciones se pueden filtrar; la borrada, con
  «(borrada)» y sin su correo.
- **E31** **Dado** la página 3, **cuando** se cambia un filtro, **entonces** vuelve a la página 1.

### El detalle y la actualización

- **E32** **Dado** un cambio de los permisos de un rol, **cuando** se abre su detalle, **entonces**
  muestra qué pasó, cuándo, quién, el rol, los permisos que había y los que quedaron, el
  dispositivo, el navegador y la dirección de internet.
- **E33** **Dado** una acción en la lista, **cuando** se toca, una o dos veces, el nombre de la
  persona que la hizo o la recibió, **entonces** se elige esa acción y la lista no se filtra.
- **E34** **Dado** Quién hizo qué abierto con «Actualizar solo» apagado, **cuando** otra persona hace
  una acción, **entonces** la lista no cambia sola ni le pide nada al servidor; aparece al cambiar un
  filtro o de página, al tocar la pestaña o al prender el selector.
- **E35b** **Dado** dos acciones de tipos distintos, **cuando** se miran en la lista, **entonces**
  cada una tiene a la izquierda el ícono de su tipo, y los dos íconos son distintos; dos acciones del
  mismo tipo tienen el mismo ícono.
- **E35c** **Dado** el resumen con 4 rechazos, **cuando** se toca «Rechazos», **entonces** la lista
  muestra solo los rechazos del período del resumen, sin filtro por tipo; al tocarlo de nuevo, saca
  ese filtro.
- **E35d** **Dado** la computadora, **cuando** se abre Quién hizo qué y se baja por la lista con el
  teclado, **entonces** el detalle muestra la primera acción y después cada acción a la que se llega,
  sin tocar nada más.
- **E35** **Dado** la computadora, **cuando** se usa solo el teclado, **entonces** se recorre la
  lista, se abre el detalle, se cambia de página y se llega a cada filtro.

- **E49** **Dado** Quién hizo qué recién abierto, **cuando** se mira el selector, **entonces** en la
  computadora «Actualizar solo» está prendido y en el celular, apagado; y no está «Actualizar».
- **E50** **Dado** la computadora arriba de todo, con «Actualizar solo» prendido, **cuando** otra
  persona hace una acción que cumple los filtros, **entonces** aparece arriba sola, marcada un
  momento, y el resumen y la tira se ponen al día.
- **E51** **Dado** la computadora con la lista bajada, o en la página 2, **cuando** llegan tres
  acciones nuevas, **entonces** no se mueve nada y arriba aparece «3 nuevas»; **y cuando** se toca,
  va a la página 1 con las tres arriba.
- **E52** **Dado** «Actualizar solo» prendido, **cuando** alguien autoriza a diez personas seguidas,
  **entonces** la lista se pone al día como mucho una vez cada 5 segundos.
- **E53** **Dado** la fecha en otro día que no es hoy, **cuando** se mira, **entonces** no se ve el
  selector y no hay ningún canal abierto.
- **E54** **Dado** «Actualizar solo» prendido, **cuando** se oculta la pestaña, **entonces** se cierra
  el canal; **y cuando** vuelve a la vista, la lista se pone al día una vez.
- **E55** **Dado** el celular en Quién hizo qué, **cuando** se prende «Actualizar solo», **entonces** la
  lista se pone al día en el momento y, debajo, se ven los KB por minuto que gasta esa pantalla.
- **E56** **Dado** «Actualizar solo» prendido en la computadora y el celular vinculados, **cuando** se
  apaga en uno, **entonces** en el otro sigue como estaba.

### La cinta

- **E40** **Dado** la tira de hoy en la computadora, **cuando** se toca la tira a la altura de las 10:26,
  **entonces** se abre la cinta a pantalla completa, sin el menú, con el cabezal en esa acción y su
  texto abajo.
- **E41** **Dado** el celular, **cuando** se toca «Ver el día», **entonces** se abre la cinta vertical
  del día del resumen; con un período de varios días, la de hoy.
- **E42** **Dado** la cinta abierta, **cuando** se toca la ×, Escape o atrás, **entonces** se vuelve a
  la lista con los mismos filtros, la misma página y la misma acción elegida.
- **E43** **Dado** una acción de Graciela a Martín, **cuando** el cabezal está en ella, **entonces** una
  línea une la fila de Graciela con la de Martín y el subtítulo dice la acción entera.
- **E44** **Dado** la cinta en una acción, **cuando** se pulsa →, **entonces** el cabezal pasa a la
  acción siguiente del día; en la última, no se mueve.
- **E45** **Dado** «Reproducir el día», **cuando** se toca, **entonces** el cabezal recorre las
  acciones en orden, cada una con su subtítulo, y se detiene en la última o al tocar cualquier cosa.
- **E46** **Dado** la fila de Martín, **cuando** se toca, **entonces** quedan en primer plano lo que hizo
  y lo que recibió, el resto se apaga, y ← → y «Reproducir» recorren solo eso; tocándola de nuevo se
  suelta.
- **E47** **Dado** los días de la semana arriba, **cuando** se toca «ayer», **entonces** la cinta muestra
  el día de ayer, con el cabezal en su primera acción.
- **E48** **Dado** un día con más de 2.000 acciones, **cuando** se quiere abrir la cinta, **entonces** no
  se abre y dice que conviene usar la lista con filtros.

### La conexión y la seguridad

- **E36** **Dado** Quién hizo qué abierto, **cuando** se corta la conexión, **entonces** se ve gris
  con «Sin conexión», y al volver la conexión sale del gris sin pedirle nada al servidor.
- **E37** **Dado** una persona con el permiso, **cuando** intenta cambiar o borrar una acción
  anotada, **entonces** no hay forma de hacerlo, ni en la aplicación ni en el servidor.
- **E38** **Dado** un texto escrito por alguien (un nombre, un correo intentado) con algo que
  parece código de página, **cuando** se muestra en la lista o en el detalle, **entonces** se ve
  como texto, sin ejecutarse.
- **E39** **Dado** un pedido de acciones con un filtro o una página que no existe, **cuando** llega
  al servidor, **entonces** lo rechaza diciendo qué está mal, sin dar datos.
