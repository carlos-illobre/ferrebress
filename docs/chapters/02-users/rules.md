# 02 · Personas: reglas

Quién puede entrar, cómo se autoriza y se da de baja a alguien, y sus sesiones y celulares con
huella vistos por otro. Entrar, salir y la sesión propia están en el
[capítulo 01](../01-sign-in/rules.md); las reglas generales, en el [capítulo 00](../00-app/rules.md).

El capítulo va en dos etapas. **Etapa a:** personas y sesiones. **Etapa b:** roles y permisos
(sección 7), que también cambia quién puede hacer cada cosa de las secciones 1 a 6.

**Estado:** etapa a, aprobada; etapa b, aprobada.

## 1. Quién administra

- **R1.1** Cada cosa de este capítulo la hace quien tiene el permiso que le corresponde (R7.1):
  ver a las personas, administrarlas, cortar sus sesiones y huellas, y armar y asignar roles.
- **R1.2** El primer Administrador de cada ambiente se carga una sola vez, al instalar, con un
  comando en el servidor que recibe su correo y su nombre. El comando se niega si ya hay alguna
  persona cargada: después de instalar no crea a nadie. No usa la configuración del ambiente. Ese
  primer Administrador tiene el rol Administrador (R7.4) y es una persona más: se la puede dar de
  baja como a cualquiera (R4).
- **R1.3** Nunca queda nadie que administre: siempre hay al menos una persona activa con
  «Administrar personas» y al menos una con «Administrar roles» (pueden ser la misma o no). Nadie se
  da de baja a sí mismo ni se quita a sí mismo ninguno de esos dos permisos, por ningún camino:
  sacándose un rol, cambiando los permisos de un rol que tiene o borrándolo. El servidor lo controla
  siempre, también si dos personas hacen esos cambios al mismo tiempo.

## 2. Dónde está

- **R2.1** En Más → Usuarios (00 · R1.2): administrar personas no es parte del negocio. Tiene tres
  pestañas: Usuarios, Roles (R7) y Auditoría, que es del capítulo 05. Cada una aparece solo para
  quien tiene su permiso (R7.7). En la computadora y en el celular, con las mismas reglas
  (00 · R1.5).
- **R2.2** Todo lo de este capítulo necesita conexión: sin conexión, Usuarios se ve gris con «Sin
  conexión» y vuelve sola al volver la conexión (00 · R4.4).

## 3. Las personas

- **R3.1** La lista muestra a todas las personas, activas y dadas de baja: su nombre, su correo, una
  pastilla por cada uno de sus roles y la última vez que entró. Primero va la propia, marcada «Vos»;
  después las activas y al final las dadas de baja, cada grupo por nombre. Una dada de baja se
  distingue sin leer la letra chica. Además de buscar y de los filtros que ya tiene, se puede
  filtrar por rol.
- **R3.2** **La última vez que entró** es la última vez que entró con Google, con la huella, con el
  código QR o sin conexión (cuando el servidor la confirmó), aunque después haya seguido usándolo:
  «Entró hace 3 días». Quien nunca entró dice «Todavía no entró».
- **R3.3** **Autorizar a alguien:** su nombre (puede quedar vacío), su correo de Google, de
  cualquier dominio (también uno de Google Workspace), y uno o más roles, sin ninguno marcado de
  antemano: así nadie entra con más de lo que necesita por descuido. No se le manda ningún correo:
  se le avisa por fuera. Como da permisos, autorizar pide «Administrar personas» y «Administrar
  roles».
  - Un correo que no tiene forma de correo, o uno que ya está cargado (sin distinguir
    mayúsculas, 01 · R1.4), se avisa junto al campo del correo, sin perder lo escrito.
- **R3.4** **El nombre que se muestra** es el que escribió quien la autorizó. Si quedó vacío, el que
  trae Google la primera vez que entra; hasta entonces, su correo. Google nunca pisa un nombre
  escrito.
- **R3.5** **Cambiar el nombre** se puede siempre. Borrarlo vuelve al de Google (o al correo, si
  nunca entró).
- **R3.6** **Cambiar el correo** se puede solo mientras la persona nunca entró. Después, su cuenta de
  Google queda atada a ella: para que entre con otra cuenta, se autoriza el correo nuevo y se da de
  baja el viejo. Así ninguna cuenta puede quedar entrando con un correo que ya no figura.
- **R3.7** **Borrar** se puede solo a quien nunca entró (un alta equivocada): desaparece del todo,
  sin confirmación, porque no hay nada que perder. A quien entró alguna vez solo se lo da de baja.
- **R3.8** **Lo que da acceso** pide haber entrado con Google o con la huella hace menos de 5
  minutos en ese dispositivo: autorizar a alguien, cambiar el correo, dar de alta, darle un rol a
  una persona, y crear, duplicar o agregarle permisos a un rol (R7). Quitar no lo pide. Si no, la
  aplicación pide tocar «Continuar con Google» o poner la huella, y sigue sola con lo que se estaba
  haciendo. Así una sesión que quedó abierta en la
  computadora del mostrador no le sirve a cualquiera para darse acceso (cambiar el correo de alguien
  que nunca entró es, en la práctica, autorizar a otra cuenta).

## 4. Dar de baja y de alta

- **R4.1** **Dar de baja** pide confirmación, porque saca a la persona de todo. Al darla de baja:
  - se le cierran todas sus sesiones; cada dispositivo suyo vuelve a la entrada con su próximo
    pedido, con «Tu sesión se cerró desde otro dispositivo» (01 · R3.5);
  - se le quitan todos sus celulares con huella, y con eso se le apaga «Trabajar sin conexión»
    en ellos (15 · R1.5);
  - ya no entra: ve el mismo mensaje que una cuenta no autorizada (01 · R1.3);
  - sigue en la lista, como dada de baja.
- **R4.2** **Dar de alta de nuevo** a alguien dado de baja lo deja entrar otra vez, con la misma
  cuenta de Google. Sus celulares con huella no vuelven: los vincula de nuevo.

## 5. Sesiones y celulares con huella de cada persona

- **R5.1** En la tarjeta de cada persona están sus sesiones abiertas y sus celulares con huella. La
  tarjeta cerrada dice cuántas tiene de cada cosa; sin ninguna, no lo dice. Verlas pide «Ver las
  personas»; cerrarlas, quitar un celular y «Se perdió un celular» piden «Cortar sesiones y
  huellas». Las propias, sin ningún permiso, van en Configuración (capítulo 04, R7.2).
- **R5.2** **Cada sesión** muestra el dispositivo («Chrome en Android»), cómo entró (Google, huella,
  código QR o sin conexión), cuándo entró y su último uso, de la usada más recientemente a la más
  vieja. Las vencidas y las cerradas no figuran. La del dispositivo que se está usando no figura
  en la tarjeta propia: se cierra con «Salir». Una entrada sin conexión que el servidor todavía no
  confirmó no figura, porque el servidor todavía no la conoce.
- **R5.3** **«Cerrar»** una sesión, sin confirmación: deja de servir en el momento, y ese dispositivo
  vuelve a la entrada con su próximo pedido, con «Tu sesión se cerró desde otro dispositivo». Se
  pueden cerrar las de cualquiera, también las propias de otros dispositivos.
- **R5.4** **«Cerrar todas»**, con confirmación, cierra de una vez todas las sesiones de esa persona
  (salvo la del dispositivo que se está usando, si es la propia). Es para un celular robado del que
  no se sabe cuál es la sesión.
- **R5.5** **Cada celular con huella** muestra su nombre («Chrome en Android»), cuándo se vinculó y su
  último uso. Los propios no figuran: van en Configuración (capítulo 04), y hasta que exista no se
  ven.
- **R5.6** **«Quitar»** un celular con huella, sin confirmación (se arregla vinculándolo de nuevo):
  - ese celular deja de entrar con la huella y de aprobar la entrada de una computadora;
  - se cierra la sesión abierta en ese celular, si hay: es el caso del celular perdido;
  - se cierran también las computadoras que ese celular hizo entrar con el código QR, porque quien
    lo tiene pudo hacer entrar a la suya;
  - se le apaga «Trabajar sin conexión» (15 · R1.5), y una entrada sin conexión hecha después no
    se confirma (15 · R3.2).
- **R5.7** **«Se perdió un celular»**, a mano arriba de la lista, junta R5.3 y R5.6 para el caso
  urgente: se elige de quién es y cuál de sus celulares (si tiene uno solo, ya está elegido), y
  «Cortar» cierra las sesiones de ese celular y las de las computadoras que él hizo entrar con el
  código QR, y le quita la huella, de un toque y sin confirmación,
  como «Cerrar» y «Quitar». Muestra qué cortó. Solo aparecen las personas que tienen algún celular
  para cortar, y de cada una, los celulares con una sesión abierta o con su huella; también los
  propios, salvo el que se está usando.
- **R5.8** En la computadora, «Cerrar» y «Quitar» de la tarjeta no llevan atajo con Alt (son uno por
  sesión o celular): se recorren con las flechas y se tocan con Enter, como cualquier lista
  (00 · R2.4, R2.6).

## 6. Lo que queda anotado

- **R6.1** Cada cambio queda en la auditoría, con quién lo hizo y a quién: autorizar, cambiar el
  nombre o el correo, borrar, dar de baja, dar de alta, cerrar una sesión, cerrar todas, quitar un
  celular con huella, cortar un celular perdido, darle o quitarle un rol a una persona, y crear,
  duplicar, renombrar, cambiar los permisos o borrar un rol (con lo que había antes y lo que quedó).

## 7. Roles y permisos

- **R7.1** **Los permisos** son fijos: los define cada capítulo para lo suyo, con un nombre y una
  explicación de qué deja hacer, agrupados por parte de la aplicación. Los de este capítulo:

  | Permiso | Qué deja hacer |
  |---|---|
  | Ver las personas | Abrir Usuarios: la lista y la tarjeta de cada persona, con sus sesiones y sus celulares con huella |
  | Administrar personas | Cambiar el nombre y el correo, borrar, dar de baja y de alta; autorizar, junto con «Administrar roles» (R3.3) |
  | Cortar sesiones y huellas | Cerrar una sesión o todas, quitar un celular con huella y «Se perdió un celular» de cualquier persona |
  | Administrar roles | Abrir la pestaña Roles, armar los roles y darles o quitarles roles a las personas |

  «Administrar personas» y «Cortar sesiones y huellas» incluyen «Ver las personas»: al tildar
  cualquiera de los dos en un rol, se tilda solo y no se puede destildar mientras estén.
- **R7.2** **Lo que no pide ningún permiso:** entrar, salir y el manual; la configuración del propio
  dispositivo, y ver y cerrar las sesiones propias y cortar el propio celular perdido, en
  Configuración (capítulo 04; hasta que exista, solo lo hace quien tiene los permisos de R7.1);
  avisar un error o pedir una mejora (capítulo 12).
- **R7.3** **Un rol** es un grupo de permisos con un nombre. Se crea con un nombre y sus permisos, se
  renombra, se le cambian los permisos y se duplica (uno nuevo a partir de otro, para cambiarle lo
  que haga falta). Tiene un nombre que no se repite (sin distinguir mayúsculas) y al menos un
  permiso: si no, no se guarda y se dice por qué. Se borra solo si nadie lo tiene: primero hay que
  sacárselo a las personas. Un cambio de permisos vale enseguida para todos los que lo tienen.
- **R7.4** **Al instalar** el sistema hay un solo rol, Administrador, con todos los permisos que
  existen. Cada permiso nuevo que trae un capítulo se le suma solo al rol Administrador, así siempre
  hay alguien que lo puede usar y repartir; a los demás roles, recién cuando alguien se lo agrega.
  Los roles que propone cada capítulo (Vendedor, Comprador…) se escriben en ese capítulo. El rol
  Administrador se puede renombrar y cambiar, pero no borrar.
- **R7.5** **Cada persona activa tiene al menos un rol**, y puede todo lo que permite cualquiera de
  ellos. Darle o quitarle un rol pide «Administrar roles». Para que alguien no pueda hacer nada se lo
  da de baja (R4).
- **R7.6** **El servidor controla cada pedido:** sin el permiso, lo rechaza sin cambiar nada,
  diciendo qué permiso hace falta, y no cierra la sesión. Un cambio de roles o de permisos vale desde
  el próximo pedido de esa persona, sin volver a entrar.
- **R7.7** **Lo que no se puede usar no aparece:** ni en el menú, ni en Más, ni como pestaña, ni como
  botón. Si se abre por la dirección algo que no se puede usar, se ve «No tenés permiso para
  <pantalla>: hace falta «<permiso>». Lo tienen: <roles>.» y un botón para ir a la primera opción que
  sí se puede usar.
- **R7.8** **Si le cambian los permisos mientras usa la aplicación,** con su próximo pedido el menú y
  la pantalla se actualizan. Si está en una pantalla que ya no puede usar, ve «Ya no tenés permiso
  para <pantalla>» y va a su primera opción; lo que estaba escribiendo en otra parte no se pierde.
- **R7.9** **Sin conexión** se usan los permisos que la persona tenía la última vez que habló con el
  servidor; al volver la conexión se actualizan, y lo hecho sin permiso el servidor lo rechaza
  (15 · etapa b).
- **R7.10** **Las personas que ya estaban** cuando llega esta etapa quedan con el rol Administrador,
  que es lo que podían hacer hasta ahora.

## Escenarios

### Quién administra

- **E01** **Dado** un ambiente recién instalado, sin personas, **cuando** se corre el comando del
  primer Administrador con un correo y un nombre, **entonces** esa persona queda cargada con el rol
  Administrador y entra con Google.
- **E02** **Dado** un ambiente con alguna persona cargada, **cuando** se corre el comando del primer
  Administrador, **entonces** se niega y no carga a nadie.
- **E03** **Dado** dos personas activas, **cuando** una se quiere dar de baja a sí misma, **entonces**
  no puede, y la aplicación le dice que lo tiene que hacer otra persona.
- **E04** **Dado** una sola persona activa con «Administrar personas», **cuando** alguien la quiere
  dar de baja, sacarle el rol que se lo da, quitarle ese permiso al rol o borrar el rol, **entonces**
  no se guarda. Lo mismo con «Administrar roles».
- **E05** **Dado** dos personas activas con «Administrar personas», **cuando** cada una da de baja a
  la otra al mismo tiempo, **entonces** solo una de las dos bajas se guarda.

### Las personas

- **E06** **Dado** Usuarios abierto, **cuando** se mira la lista, **entonces** va primero la propia
  con «Vos», después las activas y al final las dadas de baja, cada una con su nombre, su correo, una
  pastilla por cada rol y la última vez que entró.
- **E07** **Dado** una persona que entró con Google hace tres días y siguió usando Ferrebress hasta
  hoy, **cuando** se mira la lista, **entonces** dice «Entró hace 3 días».
- **E08** **Dado** un nombre y un correo de Google nuevos, **cuando** se autoriza, **entonces** la
  persona aparece en la lista con «Todavía no entró» y puede entrar con esa cuenta.
- **E09** **Dado** el correo «Juan.Perez@gmail.com» ya cargado, **cuando** se autoriza
  «juan.perez@gmail.com», **entonces** no se guarda y el aviso está junto al correo, con lo escrito.
- **E10** **Dado** un correo sin forma de correo, **cuando** se autoriza, **entonces** no se guarda y el
  aviso está junto al correo.
- **E11** **Dado** una persona autorizada con el nombre «Juan del mostrador», **cuando** entra con una
  cuenta de Google que se llama «Juan Pérez», **entonces** sigue mostrándose «Juan del mostrador».
- **E12** **Dado** una persona autorizada sin nombre, **cuando** todavía no entró, **entonces** se
  muestra su correo; **cuando** entra con Google, se muestra el nombre que trae Google.
- **E13** **Dado** una persona que nunca entró, **cuando** se le cambia el correo, **entonces** entra
  con la cuenta nueva y no con la vieja.
- **E14** **Dado** una persona que ya entró, **cuando** se mira su tarjeta, **entonces** el correo no se
  puede cambiar.
- **E15** **Dado** una persona que nunca entró, **cuando** se la borra, **entonces** desaparece de la
  lista sin confirmación y su correo ya no entra.
- **E16** **Dado** una persona que ya entró, **cuando** se mira su tarjeta, **entonces** no se la puede
  borrar, solo dar de baja.

### Dar de baja y de alta

- **E17** **Dado** una persona con sesiones abiertas en un celular y una computadora, y un celular con
  huella, **cuando** se la da de baja y se confirma, **entonces** sus dos dispositivos vuelven a la
  entrada con su próximo pedido, con «Tu sesión se cerró desde otro dispositivo», su celular deja de
  entrar con la huella y sin conexión, y queda en la lista como dada de baja.
- **E18** **Dado** una persona dada de baja, **cuando** entra con Google, **entonces** ve el mensaje de
  una cuenta no autorizada.
- **E19** **Dado** una persona dada de baja, **cuando** se la da de alta de nuevo, **entonces** entra
  con Google, y para entrar con la huella vincula de nuevo su celular.
- **E20** **Dado** «Dar de baja», **cuando** no se confirma, **entonces** no cambia nada.

### Sesiones y celulares con huella

- **E21** **Dado** una persona con dos sesiones abiertas y un celular con huella, **cuando** se mira su
  tarjeta cerrada, **entonces** dice cuántas tiene de cada cosa; **cuando** se la abre, cada sesión
  muestra el dispositivo, cómo entró, cuándo entró y su último uso, la usada más recientemente
  primero.
- **E22** **Dado** la tarjeta propia, **cuando** se la abre, **entonces** no figuran la sesión del
  dispositivo que se está usando ni los celulares con huella propios; sí, las sesiones propias de
  otros dispositivos.
- **E23** **Dado** una sesión de otro dispositivo, **cuando** se la cierra, **entonces** desaparece de
  la lista sin confirmación, quien la cerró sigue donde estaba, y ese dispositivo vuelve a la entrada
  con su próximo pedido, con «Tu sesión se cerró desde otro dispositivo».
- **E24** **Dado** un dispositivo sin conexión cuya sesión se cerró a distancia, **cuando** vuelve la
  conexión, **entonces** vuelve a la entrada con su primer pedido, y lo pendiente se manda con la
  prueba de quien lo hizo (01 · R4).
- **E25** **Dado** una persona con tres sesiones, **cuando** se toca «Cerrar todas» y se confirma,
  **entonces** se cierran las tres; si es la propia, todas menos la del dispositivo que se está usando.
- **E26** **Dado** el celular con huella de otra persona, con su sesión abierta, **cuando** se lo
  quita, **entonces** ese celular vuelve a la entrada con su próximo pedido, ya no entra con la
  huella, no aprueba la entrada de una computadora y no entra sin conexión.
- **E27** **Dado** un celular con huella quitado, **cuando** manda una entrada sin conexión hecha
  después de quitarlo, **entonces** el servidor no la confirma (15 · R3.2).

- **E31** **Dado** una persona con un celular con huella y su sesión abierta en él, **cuando** se toca
  «Se perdió un celular», se la elige y se toca «Cortar», **entonces** ese celular vuelve a la
  entrada con su próximo pedido, ya no entra con la huella ni sin conexión, y se ve qué se cortó.
- **E32** **Dado** una persona con dos celulares, **cuando** se la elige en «Se perdió un celular»,
  **entonces** hay que elegir cuál antes de cortar; el otro sigue como estaba.

- **E33** **Dado** una sesión abierta hace más de 5 minutos, **cuando** se autoriza a alguien o se da de
  alta a una persona, **entonces** la aplicación pide Google o la huella; al pasar, se guarda sin volver
  a escribir nada.

### Lo que queda anotado y la conexión

- **E28** **Dado** cualquiera de los cambios de R6.1, **cuando** se guarda, **entonces** queda en la
  auditoría con quién lo hizo y a quién.
- **E29** **Dado** un dispositivo sin conexión, **cuando** se mira Más → Usuarios, **entonces** se
  ve gris con «Sin conexión», y vuelve sola al volver la conexión.
- **E30** **Dado** dos personas con Usuarios abierto, **cuando** una da de baja a alguien, **entonces**
  la otra, al hacer un cambio sobre esa persona, ve que ya no está activa y el cambio no se guarda
  sobre un dato viejo.

### Roles y permisos

- **E34** **Dado** el sistema recién instalado, **cuando** se mira la pestaña Roles, **entonces** hay
  un solo rol, Administrador, con todos los permisos, y lo tiene el primer Administrador.
- **E35** **Dado** alguien con «Administrar roles», **cuando** crea el rol «Encargado» con «Cortar
  sesiones y huellas» y confirma que es él (R3.8), **entonces** el rol queda para asignar, con «Ver
  las personas» tildado solo.
- **E36** **Dado** el rol «Encargado» con «Cortar sesiones y huellas», **cuando** se quiere destildar
  «Ver las personas», **entonces** no se puede mientras siga el otro, y se explica al lado.
- **E37** **Dado** un rol que se llama «Encargado», **cuando** se guarda otro como «encargado», o un
  rol sin nombre o sin ningún permiso, **entonces** no se guarda y se dice por qué.
- **E38** **Dado** el rol «Encargado», **cuando** se lo duplica, **entonces** aparece un rol nuevo con
  sus mismos permisos y un nombre para cambiar, sin guardarse hasta que se acepta.
- **E39** **Dado** un rol que alguien tiene, **cuando** se lo quiere borrar, **entonces** no se borra
  y se dice que primero hay que sacárselo a esas personas; **dado** uno que nadie tiene, se borra.
- **E40** **Dado** el rol Administrador, **cuando** se lo quiere borrar, **entonces** no se puede;
  renombrarlo y cambiarle los permisos sí, mientras no deje sin quien administre (R1.3).
- **E41** **Dado** alguien con «Administrar personas» pero sin «Administrar roles», **cuando** mira
  Usuarios, **entonces** no ve «Autorizar a alguien» ni la pestaña Roles, y puede cambiar nombres y
  correos y dar de baja y de alta.
- **E42** **Dado** alguien con los dos permisos, **cuando** autoriza a una persona, **entonces** el
  diálogo no trae ningún rol marcado y no se guarda hasta elegir al menos uno.
- **E43** **Dado** una persona con un solo rol, **cuando** se le quiere quitar, **entonces** no se
  guarda: tiene que quedar con uno; para que no pueda nada se la da de baja.
- **E44** **Dado** una persona con los roles «Encargado» y «Cajero», **cuando** usa la aplicación,
  **entonces** puede todo lo que permite uno u otro.
- **E45** **Dado** alguien sin «Ver las personas», **cuando** mira Más, **entonces** no ve Usuarios;
  **cuando** abre /users por la dirección, ve «No tenés permiso para Usuarios: hace falta «Ver las
  personas». Lo tienen: Administrador.» y el botón para ir a su primera opción.
- **E46** **Dado** alguien sin «Cortar sesiones y huellas», **cuando** abre una tarjeta, **entonces**
  ve las sesiones y los celulares, sin «Cerrar», «Cerrar todas», «Quitar» ni «Se perdió un celular».
- **E47** **Dado** alguien sin un permiso, **cuando** le pide esa operación directo al servidor,
  **entonces** el servidor la rechaza diciendo qué permiso falta, no cambia nada y la sesión sigue.
- **E48** **Dado** una persona con Usuarios abierto, **cuando** otra le saca el rol que le daba «Ver
  las personas», **entonces** con su próximo pedido ve «Ya no tenés permiso para Usuarios», va a su
  primera opción y Usuarios desaparece de Más, sin volver a entrar.
- **E49** **Dado** un rol que tienen tres personas, **cuando** se le agrega un permiso, **entonces**
  las tres lo pueden usar desde su próximo pedido.
- **E50** **Dado** una sesión abierta hace más de 5 minutos, **cuando** se le da un rol a alguien o se
  le agrega un permiso a un rol, **entonces** la aplicación pide Google o la huella; **cuando** se
  quita un rol o un permiso, no lo pide.
- **E51** **Dado** un capítulo nuevo que trae el permiso «Vender», **cuando** se instala, **entonces**
  el rol Administrador lo tiene y los demás roles no, hasta que alguien se lo agregue.
- **E52** **Dado** un celular que entró sin conexión, **cuando** trabaja sin conexión, **entonces** usa
  los permisos que tenía la última vez que habló con el servidor, y se actualizan al volver la
  conexión.
- **E53** **Dado** las personas que ya existían antes de esta etapa, **cuando** se instala, **entonces**
  quedan con el rol Administrador y pueden lo mismo que antes.
- **E54** **Dado** la lista de Usuarios, **cuando** se filtra por el rol «Encargado», **entonces** se
  ven solo las personas que lo tienen.
- **E55** **Dado** cualquier cambio de roles o de su asignación, **cuando** se guarda, **entonces**
  queda en la auditoría con quién lo hizo, a quién o a qué rol, y lo que había antes y lo que quedó.
- **E56** **Dado** alguien con «Administrar roles», **cuando** se saca a sí mismo el rol que se lo da
  o le quita ese permiso a un rol que tiene, **entonces** no se guarda y se le dice que lo tiene que
  hacer otra persona.
