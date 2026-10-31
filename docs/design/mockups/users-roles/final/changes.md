# Usuarios · Roles · maqueta final: en qué se diferencia de lo del director

Base: la variante 1 del director, «El rol y su tarjeta» (`../desktop/variant-1-card/` y
`../phone/variant-1-card/`), con lo que Carlos pidió tomar de su referencia de Copilot
(`../reference/copilot-new-role.webp` y, solo como estilo, `../reference/copilot-assign-roles.webp`).
Esta carpeta no depende de `../shared/`: `roles.js`, `roles.css`, `frame.css` e `icons-extra.js`
salen de ahí y llevan los cambios de abajo; `screen.js` junta el guion de las dos páginas del
director.

Todo lo que no figura acá es igual a lo del director.

Capturas:
- Computadora: `screenshot.png` (al abrir), `screenshot-alt.png` (con Alt apretado),
  `screenshot-how-counted.png` («Cómo se cuenta» abierto), `screenshot-edit.png` (cambiando el
  nombre y la descripción), `screenshot-new-role.png` (crear un rol, con la vista previa) y
  `screenshot-new-role-error.png` (un nombre que ya existe).
- Celular: `screenshot-phone.png` (al abrir), `screenshot-phone-role.png` (la página de un rol),
  `screenshot-phone-new-role.png` (crear un rol) y `screenshot-phone-offline.png` (sin conexión).

## Por directivas de Carlos

Carlos pidió juntar lo mejor de su referencia de Copilot con lo mejor de la variante 1, sin lo que
la referencia trae y las reglas no tienen.

- **De la variante 1 queda:** la pestaña Roles dentro de Usuarios, la lista de roles a la izquierda
  y la tarjeta del rol a la derecha (en el celular, una página que entra desde la derecha); «Quién
  puede qué»; los interruptores que se guardan al momento con «Deshacer»; el permiso incluido con
  candado y su porqué; quiénes lo tienen, con «Darle este rol» y «Sacárselo»; Duplicar y Borrar con
  su porqué; «Confirmá que sos vos»; lo último que cambió; y todos sus movimientos.
- **De la referencia se toma:**
  - **Crear y duplicar un rol es una página, no un diálogo.** En la computadora reemplaza la
    pestaña: arriba, la miga (Usuarios › Roles › Nuevo rol), el título grande con su explicación
    debajo y, a la derecha, «Cancelar» y «Crear el rol» (naranja). Debajo, dos pasos numerados en
    tarjetas: «1 · El nombre y para quién es» y «2 · Qué deja hacer». A la derecha, la vista previa
    «Así va a quedar»: el escudo, el nombre y la descripción como se van a ver, cada parte de la
    aplicación con cuántos permisos da (tilde verde o círculo gris) y el aviso «Nadie lo tiene hasta
    que se lo des…». En el celular, la página entra desde la derecha con «‹ Roles», sin vista
    previa, y «Crear el rol» (naranja) y «Cancelar» (blanco) quedan fijos abajo, uno sobre el otro.
  - **Los permisos van agrupados por parte de la aplicación,** en una caja con su ícono, su nombre,
    qué abarca y «N de M». Al crear, la caja se abre y se cierra, y los permisos son casillas en dos
    columnas (una en el celular), cada una con su explicación. En la tarjeta del rol, la misma caja
    con los interruptores de la variante. Hoy hay una sola parte, Usuarios.
  - **La descripción del rol** (Carlos: «la descripcion del rol me gusta que este»; R7.3 y E57):
    opcional, de hasta 200 letras, con el contador «n/200». Se escribe al crear y al duplicar (se
    copia la del original) y se cambia con el lápiz de la tarjeta, que ahora edita el nombre y la
    descripción juntos («Guardar» o Enter; «Cancelar» o Esc; con «Deshacer»). Se ve debajo del
    nombre en la lista de roles (hasta dos renglones, con puntos suspensivos), en la cabecera de la
    tarjeta del rol y en la vista previa. Un rol sin descripción no muestra nada («Solo mirar», en
    los datos). Al elegir los roles de una persona también se ve (E57), pero esa pantalla viene
    después.
  - **El estilo:** el título grande con su explicación, los pasos con el número en un círculo pino,
    las cajas de parte con ícono y la tilde verde de la vista previa. Todo con la paleta, la letra y
    los íconos de «Mostrador».
- **De la referencia no se toma** (no está en las reglas aprobadas): permisos sueltos por persona
  («Permisos específicos», «Restablecer valores»), un solo rol por persona (son uno o más, R7.5),
  el buscador y las notificaciones de arriba, el menú lateral con Inicio, Reportes y Configuración
  (el menú es el de 00 · R1.1), y los permisos de Ventas, Catálogo, Depósito, Negocio y
  Configuración (hoy existen solo los cuatro de Usuarios, R7.1). Tampoco el «Guardar cambios» de
  la pantalla de una persona: en la tarjeta del rol todo se guarda al momento, como en la variante
  y en Usuarios.
- **Al abrir, en la computadora queda elegido el primer rol de la lista** (Administrador), como
  pidió Carlos para Usuarios; la variante abría en «Encargado de turno».

## Por las reglas aprobadas

- **Las teclas se ven solo mientras Alt está apretado (00 · R2.9)** y no chocan con las del marco
  (00 · R2.10): «Nuevo rol» pasó de Alt N (Negocio) a Alt O. Quedan Alt D Duplicar, Alt R Cambiar
  el nombre y la descripción, Alt G Darle este rol; suman tecla Borrar (Alt B) y «Cómo se cuenta»
  (Alt Q), que no tenían (00 · R2.8). En la página de crear: Alt L Crear el rol, Alt A o Esc
  Cancelar, Alt U abre y cierra la caja de Usuarios, y Enter en el nombre crea. El menú lleva las
  letras del marco aprobado (E, V, C, P, N, M, Z, S). En el celular no hay teclas.
- **«Quién puede qué» deja ver cómo se cuenta (00 · R8.1):** la variante mostraba solo el número.
  «Cómo se cuenta», debajo de las barras, abre en cada permiso la suma por rol y a quién no cuenta
  dos veces («Administrador 2 + Encargado de turno 4 + Oficina y personal 2, sin contar dos veces a
  Graciela (tiene más de uno)»).
- **Auditoría lleva «Pronto» y no se abre (00 · R1.3):** en el celular de la variante no tenía la
  marca. Como no entra la palabra en el segmento, va un reloj en su lugar (el mismo recurso del
  menú minimizado). Al tocarla, la tostada lo dice.
- **En el celular, el cursor nunca arranca en una caja de texto (00 · R2.12):** la hoja de «Nuevo
  rol» de la variante ponía el cursor en el nombre. En la computadora sí arranca ahí (00 · R2.2).
- **Textos largos en la computadora y cortos en el celular (00 · R3.2),** en la misma página: la
  explicación de la página de crear, la de la descripción, «Darle este rol» / «Darlo»,
  «Sacárselo» / ×, el aviso de que vale enseguida y el de «Sin conexión».

## Por la tecnología

- **Una sola página para la computadora y el celular (ADR-002):** el director hizo dos. Desde
  900 px es la computadora; debajo, el celular. Lo que cambia es CSS: el menú pasa abajo, «Nuevo
  rol» queda fijo arriba del menú, las pestañas son segmentos, la tarjeta del rol y la página de
  crear entran desde la derecha, los diálogos son hojas que suben y los resúmenes «4 Roles» y
  «7 Personas» no se muestran. Sin la barra de estado falsa (hora y batería) del celular, que no
  es de la aplicación.
- **«Confirmá que sos vos»:** en la maqueta, el celular pide la huella y la computadora, Google. En
  el código sale de lo que tiene vinculado el dispositivo, no del ancho.
- **Las animaciones mueven solo transform y opacity:** el color del interruptor y el fondo y el
  borde del renglón de cada permiso cambian sin transición (la bolita sigue cruzando con su rebote).
  La tarjeta y la página de crear se esconden con `visibility` al terminar de salir. Con «reducir
  movimiento», nada se mueve (`common.css`).
- **HTML semántico:** secciones con su título, `form` para crear y para editar, casillas de verdad
  (`input type="checkbox"`) al crear, `role="switch"` en los interruptores, `role="listbox"` en la
  lista y `role="dialog"` en los diálogos.
- **Sin conexión, en el celular** el aviso va abajo, sobre el botón, para no tapar el título, y
  la barra del botón queda opaca con el botón en gris.
- Solo se probó en Chrome (el de la computadora y un ancho de 390 px); Firefox no estaba en el
  entorno.
