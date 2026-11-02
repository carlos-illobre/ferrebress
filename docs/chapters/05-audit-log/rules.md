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
- **R1.3** **Mirar no se anota:** abrir una pantalla, buscar o ver un dato no deja nada, tampoco
  abrir Quién hizo qué. Anotarlo multiplicaría el registro y diría poco.
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
- **R4.4** **Cada acción, en la lista:** la hora (y la fecha, si no es de hoy), quién, el texto de
  qué pasó, a quién o a qué y el tipo de dispositivo. Lleva un color según lo que es:
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
  nombre que tenían. Cambiar un filtro vuelve a la página 1. Si nada coincide, lo dice y ofrece
  sacar los filtros.
- **R4.6** **Las acciones nuevas no aparecen solas:** la aplicación no le pide nada al servidor sin
  que la toquen (constitución, principio III). La lista se pone al día al volver a la pestaña, al
  cambiar un filtro o de página, y con «Actualizar».
- **R4.7** **El detalle:** al tocar una acción se ve todo lo que se guardó de ella (R2): qué pasó,
  cuándo, quién, a quién o a qué, lo que había antes y lo que quedó, el dispositivo, el navegador y
  la dirección de internet. Tocar una persona, en la lista o en el detalle, filtra por ella: como
  «Hecho por» si la hizo, como «Hecho a» si la recibió.
- **R4.8** En la computadora todo se hace con el teclado: recorrer la lista, abrir el detalle,
  cambiar de página y llegar a los filtros (00 · capítulo 2).

## 5. La conexión

- **R5.1** Quién hizo qué necesita conexión: sin conexión, se ve gris con «Sin conexión», como el
  resto de Usuarios (02 · R2.2), y vuelve sola al volver la conexión (00 · R4.4).

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
- **E05** **Dado** una persona que abre pantallas, busca y abre Quién hizo qué, **cuando** se mira
  el registro, **entonces** nada de eso figura.
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
  **entonces** figura, con el nombre que tenía, y sus acciones se pueden filtrar.
- **E31** **Dado** la página 3, **cuando** se cambia un filtro, **entonces** vuelve a la página 1.

### El detalle y la actualización

- **E32** **Dado** un cambio de los permisos de un rol, **cuando** se abre su detalle, **entonces**
  muestra qué pasó, cuándo, quién, el rol, los permisos que había y los que quedaron, el
  dispositivo, el navegador y la dirección de internet.
- **E33** **Dado** una acción en la lista, **cuando** se toca la persona que la hizo, **entonces**
  la lista se filtra con «Hecho por» esa persona; si se toca la persona que la recibió, con «Hecho
  a».
- **E34** **Dado** Quién hizo qué abierto, **cuando** otra persona hace una acción, **entonces** la
  lista no cambia sola ni le pide nada al servidor; aparece con «Actualizar», al cambiar un filtro o
  de página, o al volver a la pestaña.
- **E35** **Dado** la computadora, **cuando** se usa solo el teclado, **entonces** se recorre la
  lista, se abre el detalle, se cambia de página y se llega a cada filtro.

### La conexión y la seguridad

- **E36** **Dado** Quién hizo qué abierto, **cuando** se corta la conexión, **entonces** se ve gris
  con «Sin conexión», y vuelve sola al volver la conexión.
- **E37** **Dado** una persona con el permiso, **cuando** intenta cambiar o borrar una acción
  anotada, **entonces** no hay forma de hacerlo, ni en la aplicación ni en el servidor.
- **E38** **Dado** un texto escrito por alguien (un nombre, un correo intentado) con algo que
  parece código de página, **cuando** se muestra en la lista o en el detalle, **entonces** se ve
  como texto, sin ejecutarse.
- **E39** **Dado** un pedido de acciones con un filtro o una página que no existe, **cuando** llega
  al servidor, **entonces** lo rechaza diciendo qué está mal, sin dar datos.
