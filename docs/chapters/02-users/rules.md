# 02 · Personas: reglas

Quién puede entrar, cómo se autoriza y se da de baja a alguien, y sus sesiones y celulares con
huella vistos por otro. Entrar, salir y la sesión propia están en el
[capítulo 01](../01-sign-in/rules.md); las reglas generales, en el [capítulo 00](../00-app/rules.md).

El capítulo va en dos etapas. **Etapa a (esta):** personas y sesiones, con un solo rol,
Administrador. **Etapa b:** roles y permisos; se escribe al llegar a ella.

**Estado:** etapa a, aprobada.

## 1. Quién administra

- **R1.1** Hasta la etapa b todas las personas son Administrador, y todo lo de este capítulo lo
  puede hacer cualquiera de ellas.
- **R1.2** El primer Administrador de cada ambiente se carga una sola vez, al instalar, con un
  comando en el servidor que recibe su correo y su nombre. El comando se niega si ya hay alguna
  persona cargada: después de instalar no crea a nadie. No usa la configuración del ambiente. Ese
  primer Administrador es una persona más: se la puede dar de baja como a cualquiera (R4).
- **R1.3** Nunca puede quedar ningún Administrador activo, y nadie se da de baja a sí mismo. El
  servidor lo controla siempre, también si dos personas se dan de baja una a la otra al mismo
  tiempo.

## 2. Dónde está

- **R2.1** En Más → Usuarios, pestaña Usuarios (00 · R1.2): administrar personas no es parte del
  negocio. La otra pestaña, Auditoría, es del capítulo 05. En la computadora y en el celular, con las mismas reglas (00 · R1.5).
- **R2.2** Todo lo de este capítulo necesita conexión: sin conexión, Usuarios se ve gris con «Sin
  conexión» y vuelve sola al volver la conexión (00 · R4.4).

## 3. Las personas

- **R3.1** La lista muestra a todas las personas, activas y dadas de baja: su nombre, su correo, la
  pastilla «Administrador» (en la etapa b, sus roles) y la última vez que entró. Primero va la
  propia, marcada «Vos»; después las activas y al final las dadas de baja, cada grupo por nombre.
  Una dada de baja se distingue sin leer la letra chica. Si hay buscador, filtros u orden lo decide
  el diseño de la pantalla.
- **R3.2** **La última vez que entró** es la última vez que entró con Google, con la huella, con el
  código QR o sin conexión (cuando el servidor la confirmó), aunque después haya seguido usándolo:
  «Entró hace 3 días». Quien nunca entró dice «Todavía no entró».
- **R3.3** **Autorizar a alguien:** su nombre (puede quedar vacío) y su correo de Google, de
  cualquier dominio (también uno de Google Workspace). Nada más. No se le manda ningún correo: se
  le avisa por fuera.
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
- **R3.8** **Autorizar a alguien y dar de alta** piden haber entrado con Google o con la huella hace
  menos de 5 minutos en ese dispositivo. Si no, la aplicación pide tocar «Continuar con Google» o
  poner la huella, y sigue sola con lo que se estaba haciendo. Así una sesión que quedó abierta en la
  computadora del mostrador no le sirve a cualquiera para darse acceso.

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
  tarjeta cerrada dice cuántas tiene de cada cosa; sin ninguna, no lo dice.
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
  - se le apaga «Trabajar sin conexión» (15 · R1.5), y una entrada sin conexión hecha después no
    se confirma (15 · R3.2).
- **R5.7** **«Se perdió un celular»**, a mano arriba de la lista, junta R5.3 y R5.6 para el caso
  urgente: se elige de quién es y cuál de sus celulares (si tiene uno solo, ya está elegido), y
  «Cortar» cierra las sesiones de ese celular y le quita la huella, de un toque y sin confirmación,
  como «Cerrar» y «Quitar». Muestra qué cortó. Solo aparecen las personas que tienen algún celular
  para cortar, y de cada una, los celulares con una sesión abierta o con su huella; también los
  propios, salvo el que se está usando.
- **R5.8** En la computadora, «Cerrar» y «Quitar» de la tarjeta no llevan atajo con Alt (son uno por
  sesión o celular): se recorren con las flechas y se tocan con Enter, como cualquier lista
  (00 · R2.4, R2.6).

## 6. Lo que queda anotado

- **R6.1** Cada cambio queda en la auditoría, con quién lo hizo y a quién: autorizar, cambiar el
  nombre o el correo, borrar, dar de baja, dar de alta, cerrar una sesión, cerrar todas, quitar un
  celular con huella y cortar un celular perdido.

## Escenarios

### Quién administra

- **E01** **Dado** un ambiente recién instalado, sin personas, **cuando** se corre el comando del
  primer Administrador con un correo y un nombre, **entonces** esa persona queda cargada y entra con
  Google como Administrador.
- **E02** **Dado** un ambiente con alguna persona cargada, **cuando** se corre el comando del primer
  Administrador, **entonces** se niega y no carga a nadie.
- **E03** **Dado** dos personas activas, **cuando** una se quiere dar de baja a sí misma, **entonces**
  no puede, y la aplicación le dice que lo tiene que hacer otro Administrador.
- **E04** **Dado** un solo Administrador activo, **cuando** alguien lo quiere dar de baja por
  cualquier camino, **entonces** no se guarda.
- **E05** **Dado** dos Administradores activos, **cuando** cada uno da de baja al otro al mismo
  tiempo, **entonces** solo una de las dos bajas se guarda.

### Las personas

- **E06** **Dado** Usuarios abierto, **cuando** se mira la lista, **entonces** va primero la propia
  con «Vos», después las activas y al final las dadas de baja, cada una con su nombre, su correo, la
  pastilla «Administrador» y la última vez que entró.
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
