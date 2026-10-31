# Usuarios · Roles (02 · etapa b) · maqueta final: en qué se diferencia de lo del director

Dos páginas, una por dispositivo, copias de la variante 1 del director, «El rol y su tarjeta»:

- **Computadora:** `desktop/`, a partir de `../desktop/variant-1-card/`.
- **Celular:** `phone/`, a partir de `../phone/variant-1-card/`.
- **Archivos compartidos:** `shared/`, copia de los que usa la variante 1 (`frame.css`,
  `roles.css`, `roles.js`, `icons-extra.js`). `roles.css` suma al final las piezas nuevas, bajo
  «Maqueta final».

Todo lo que no figura acá es igual a lo del director.

Capturas:

- Computadora:
  - `screenshot.png`: la pantalla al abrir.
  - `screenshot-alt.png`: con Alt apretado.
  - `screenshot-keyboard-card.png`: la marca del teclado en un interruptor de la tarjeta.
  - `screenshot-edit.png`: cambiando el nombre y la descripción.
  - `screenshot-new-role.png`: «Nuevo rol», en el lugar de la tarjeta.
  - `screenshot-new-role-error.png`: crear sin nombre ni permisos.
  - `screenshot-created.png`: el rol recién creado.
- Celular:
  - `screenshot-phone.png`: la lista de roles.
  - `screenshot-phone-role.png`: la página de un rol.
  - `screenshot-phone-edit.png`: cambiando el nombre y la descripción.
  - `screenshot-phone-new-role.png`: «Nuevo rol», con los permisos agrupados.
  - `screenshot-phone-duplicate.png`: «Duplicar», en su página.

## Por directivas de Carlos

- **«Nuevo rol» y «Duplicar» no son un diálogo:** se despliegan en su lugar, como en Copilot
  (`../reference/copilot-new-role.webp`), donde crear un rol tiene su propio lugar. En la variante
  eran un diálogo encima de la pantalla.
  - En la computadora, el formulario ocupa el lugar de la tarjeta del rol, con la misma forma y el
    mismo fundido. «Cancelar» y «Crear el rol» quedan fijos abajo y el resto se desplaza.
    «Cancelar», Esc o elegir otro rol de la lista vuelven a la tarjeta sin crear nada.
  - En el celular, es una página que entra desde la derecha, como la de cada rol, con «‹ Roles»
    arriba y «Crear el rol» y «Cancelar» fijos abajo. En la variante era una hoja de abajo.
  - Si se cancela «Confirmá que sos vos», el formulario sigue ahí con lo escrito.
- **Dos bordes y un gris que remarca los permisos,** como en Copilot
  (`../reference/copilot-borders.png`), y no tres. El primer borde es el del formulario y el
  segundo, el de cada grupo. Al abrir un grupo, sus permisos van sobre un fondo gris (`--hundido`), como renglones sin borde,
  sin fondo propio al estar prendidos y con el ícono sin su cuadrado.
- **En «Nuevo rol», los permisos van agrupados por parte de la aplicación,** para que sean más
  fáciles de encontrar (`../reference/copilot-grouped-permissions.png`):
  - Cada parte es un renglón que se abre y se cierra. Muestra su ícono, su nombre, qué abarca y
    cuántos permisos tiene tildados («2 de 4»). La flecha gira al abrirlo.
  - Al abrir el formulario, el primer grupo está abierto y los demás, cerrados, como en la referencia.
  - Adentro, cada permiso conserva lo de la variante 1: el interruptor con su explicación, el
    candado de «Va incluido en…» y el sacudón si no se puede. Lo que cambia es la caja (el punto
    anterior).
  - De Copilot no se toman las casillas, las dos columnas, los textos ni los permisos de ejemplo.
  - Lo mismo vale para «Duplicar», que usa el mismo formulario.
  - Arriba de los grupos va el título «Qué deja hacer», el mismo que usa la tarjeta.
- **La tarjeta del rol muestra sus permisos bajo el nombre de su parte** («Usuarios 2 de 4», «Sin
  conexión 1 de 1»). En la variante decía «Parte Usuarios» una sola vez, porque había una sola
  parte. Los grupos de la tarjeta no se abren ni se cierran: el resto queda como en la variante,
  como pidió Carlos.

## Por las reglas aprobadas (`docs/chapters/02-users/rules.md` y `00-app/rules.md`)

- **La descripción del rol (R7.3, E57).** La variante no la tenía:
  - Es optativa, de hasta 200 letras, con un contador («42 / 200») que se pone rojo al llegar.
  - Se ve debajo del nombre en la lista de roles: en la computadora, en una línea cortada con
    «…», con el texto entero al pasar el mouse; en el celular, en hasta dos líneas. También va
    entera en la tarjeta. Un rol sin descripción no muestra nada (Solo mirar).
  - Se escribe al crear y al duplicar (el duplicado copia la del original). Se cambia con el lápiz
    de la tarjeta, que ahora edita el nombre y la descripción juntos (en la computadora, Enter
    guarda y Escape deja como estaba; en el celular, «Listo» o tocar afuera guardan). La tostada
    lo dice y ofrece «Deshacer».
  - Al elegir los roles de una persona no se ve en esta pantalla: eso está en la pantalla Usuarios
    (ver «Lo que queda pendiente»).
- **El permiso «Trabajar sin conexión» (15 · R1.2):** existe, y lo da y lo quita un Administrador.
  La variante mostraba solo los cuatro de Usuarios. Ahora va en su parte, «Sin conexión», y lo
  tiene Administrador, que tiene todos los permisos (R7.4). En los datos de ejemplo también lo
  tiene Encargado de turno. Suma una barra a «Quién puede qué» y un punto a cada rol de la lista.
  No se agregan permisos de otros capítulos: todavía no los definió ninguno (R7.1).
- **Sacarse un rol uno mismo (R1.3, E56):** la variante lo frenaba siempre que el rol tuviera
  «Administrar personas» o «Administrar roles». Ahora lo frena solo si con eso se queda sin alguno
  de los dos, es decir, si ningún otro rol suyo se lo da.
- **Las teclas se ven solo mientras Alt está apretado (00 · R2.9):** en la variante se veían
  siempre.
- **«Nuevo rol» pasó de Alt N a Alt U (00 · R2.10):** Alt N es Negocio en el menú. Es la misma
  tecla que «Autorizar a alguien» en la pestaña Usuarios, que también es su botón principal.
- **Todo botón tiene su atajo (00 · R2.8):** «Borrar» suma Alt B. Si el rol no se puede borrar,
  se sacude y el porqué sigue al lado. El lápiz muestra Alt R, que ya andaba. En «Nuevo rol» y
  en los diálogos, «Cancelar» lleva Esc y «Crear el rol» y «Darle el rol» llevan Enter, como en Usuarios.
- **Mientras el rol nuevo está a la vista,** valen sus teclas y no las de la tarjeta que tapa (00 ·
  R2.10): Alt D, G, R y B no hacen nada, y las flechas de la lista tampoco.
- **Los interruptores y los «Sacárselo» de la tarjeta no llevan tecla Alt:** se repiten por
  renglón y se recorren con las flechas, como «Cerrar» y «Quitar» en Usuarios (02 · R5.8, 00 ·
  R2.4, R2.6):
  - ↑ ↓ recorren los roles de la lista.
  - → pasa a la tarjeta. Ahí ↑ ↓ recorren los interruptores y los «Sacárselo» con la marca del
    teclado (el contorno naranja), Enter toca el marcado, y ← o Esc vuelven a la lista.
  - Mover el mouse esconde la marca (00 · R2.5).
  - En la variante, ↑ ↓ andaban solo con el cursor en la lista y la tarjeta no se podía usar sin
    el mouse. El texto de ayuda de la lista ahora dice «↑ ↓ recorren los roles · → entra a la
    tarjeta», y el de la tarjeta, «→ y ↑ ↓ para recorrer · Enter cambia».
- **En «Nuevo rol» y en «Darle este rol», las flechas marcan y el cursor no se mueve (00 · R2.1, R2.6):**
  - En «Nuevo rol», ↑ ↓ recorren los grupos y los
    permisos a la vista. Enter abre o cierra el grupo marcado o cambia el permiso marcado. Sin nada
    marcado, Enter en el nombre o en la descripción crea el rol. Al abrir, el cursor está en el
    nombre (00 · R2.2).
  - En «Darle este rol», ↑ ↓ recorren las personas y Enter tilda la marcada. Sin nada marcado,
    Enter le da el rol. Al abrir, el cursor queda en el diálogo y no en «Cancelar».
- **En el celular, nada arranca con el cursor en una caja (00 · R2.12):** en la variante, la hoja
  de «Nuevo rol» ponía el cursor en el nombre y se abría el teclado solo. La página nueva no pone
  el cursor en ninguna caja.

## Por la tecnología y el lugar

- **Entre 900 y 1200 px de ancho** (debajo de 900 va la disposición del celular), la variante no
  entraba: la tarjeta medía 420 px fijos y la lista quedaba de menos de 200 px. Ahora, en ese
  rango:
  - la tarjeta mide 340 px;
  - «Roles» y «Personas» van uno al lado del otro, arriba de «Quién puede qué»;
  - los renglones de la lista dejan las caras y el número de personas, que siguen en la tarjeta.

  En 1366 y 1920 px se ve como la variante.
- **Abrir y cerrar un grupo** no anima la altura: solo se puede animar `transform` y `opacity`. El
  contenido aparece con un fundido corto, de 4 px hacia abajo, y la flecha gira. Con «reducir
  movimiento», nada se mueve, como en el resto de la variante.

## Lo que queda pendiente

- **La descripción al elegir los roles de una persona (R7.3, E57)** va en la pantalla Usuarios
  (autorizar y cambiarle los roles a alguien), que no es esta maqueta. La maqueta aprobada de
  Usuarios (`../../users-a/final/`) es de la etapa a y todavía no tiene la elección de roles.
- **Con dos partes, el agrupamiento se luce poco:** hoy solo existen los permisos de Usuarios y de
  Sin conexión. Cada capítulo nuevo suma su grupo.
