# Usuarios · Roles (02 · etapa b) · maqueta final: en qué se diferencia de su base

**La base no es una variante del director:** es la imagen que eligió Carlos,
`../reference/copilot-role.webp` («Crear nuevo rol», computadora y celular), llevada al marco de
la aplicación y al lenguaje visual «Mostrador». Las variantes del director (`../desktop/`,
`../phone/`) quedan como referencia y no se tocaron.

- **Computadora:** `desktop/index.html`. **Celular:** `phone/index.html`.
- `shared/`: el marco de Usuarios copiado de la final aprobada (`frame.css` y `ui.js` de
  `users-a/final/shared/`; el celular usa `phone/base.css` y `phone/ui.js`, copiados de
  `users-a/final/phone/`), los íconos que suman Usuarios y Roles (`icons-extra.js`), las piezas de
  la pestaña (`roles.css`), los datos y las reglas (`roles-model.js`, lo que en la aplicación va en
  `negocio/`) y la pantalla (`roles-screen.js`, la misma lógica para los dos, cada uno con su HTML).
- Para abrir un estado directo: `#nuevo` o `#rol=<id>` (`admin`, `cashier`, `shift`, `office`,
  `viewer`).

Capturas:
- `screenshot.png` (igual a `desktop/screenshot.png`): la lista de roles.
- `screenshot-search.png`: la lista filtrada por una persona («graciela»).
- `screenshot-search-empty.png`: la búsqueda sin resultados, con «Crear el rol «…»».
- `screenshot-new.png`: un rol nuevo, vacío.
- `screenshot-changes.png` y `screenshot-changes-people.png`: «Encargado de turno» con cambios sin
  guardar (otra descripción, «Administrar personas» sumado, Pedro Giménez con el rol).
- `screenshot-save-error.png` y `screenshot-save-error-people.png`: el error al guardar (nombre
  repetido y una persona que quedaría sin rol).
- `screenshot-discard.png`: «¿Descartar los cambios del rol?».
- `screenshot-identity.png`: la confirmación con Google antes de guardar algo que da acceso.
- `screenshot-keyboard.png`: la marca del teclado en un permiso, con Alt apretado.
- Celular: `phone/screenshot.png` (la lista), `screenshot-phone-role.png` (el rol, en los
  permisos), `screenshot-phone-new.png`, `screenshot-phone-search-empty.png`,
  `screenshot-phone-error.png` y `screenshot-phone-discard.png`.

**Datos de ejemplo.** Los grupos **Vender, Catálogo y Depósito son de ejemplo**, para ver cómo crece
la lista cuando otros capítulos sumen sus permisos: sus permisos y sus textos no son reglas
aprobadas. Hoy existen solo Usuarios (los cuatro de R7.1) y Sin conexión («Trabajar sin conexión»).
Las personas y los roles son inventados; quien mira es Rubén Paredes, con Administrador.

## Por directivas de Carlos

- **Va en Más → Usuarios, pestaña Roles,** con el marco de la final aprobada de Usuarios: el lateral
  con Más elegido en la computadora y la barra de abajo en el celular. De la imagen se sacaron el
  logo, el buscador general, la campana, «Carlos Méndez» y el menú lateral con Roles adentro.
  Las pestañas son Usuarios (lleva a la maqueta final de Usuarios) · Roles · Auditoría «Pronto».
- **La lista de roles** (lo que abre la pestaña; la imagen no la tiene): el buscador, que filtra
  mientras se escribe por nombre o descripción del rol, nombre de un permiso, o nombre o correo de
  alguien activo que lo tiene; «Nuevo rol» al lado. De cada rol: ícono, nombre, descripción (si
  tiene), «N permisos», «Lo tienen N personas» y las iniciales. Sin coincidencias: «Ningún rol
  coincide con «…»» y «Crear el rol «…»», que abre un rol nuevo con eso de nombre. Sin los recuadros
  de cuentas ni «Quién puede qué». Tocar un rol abre su pantalla.
- **La pantalla del rol ocupa la pestaña,** con el camino «Roles › <nombre>» (o «Crear rol») y el
  título («Crear nuevo rol» o el nombre). Arriba a la derecha, «Cancelar» y «Guardar rol» (en uno
  nuevo, «Crear el rol»); en uno que existe, además «Duplicar» y «Borrar el rol».
- **«1 Información del rol»** con «n/200»; **«2 Asignar permisos»**, un grupo plegable por parte de la
  aplicación con ícono, detalle y «n de m», y adentro una casilla por permiso con su explicación, en
  dos columnas en la computadora; arrancan desplegados los grupos que tienen algo tildado.
- **«3 Quiénes lo tienen»** (la imagen no lo tiene): cada persona con «Sacárselo», y «Darle este rol
  a…», que abre un buscador de personas activas. También en el rol nuevo.
- **Nada se guarda hasta «Guardar rol» / «Crear el rol»;** «Cancelar» deshace todo. Salir con
  cambios (el camino «Roles», la pestaña, otra opción del menú o atrás del navegador) pregunta
  «¿Descartar los cambios del rol?» con «Seguir editando» y «Descartar».
- **Vista previa a la derecha, solo en la computadora:** ícono, nombre, descripción y por grupo
  cuántos permisos da, con marca verde (da alguno) o gris (ninguno), y al pie «Podés cambiar este
  rol cuando quieras desde la lista de roles.». Se actualiza mientras se escribe y se tilda.
- **Celular:** una columna, sin vista previa, «‹ Roles» para volver, cada permiso con su nombre
  solo, y «Guardar rol» / «Crear el rol» y «Cancelar» fijos abajo, como en la imagen. «Duplicar» y
  «Borrar el rol» van al final del rol, porque arriba no entran.

## Por las reglas aprobadas (`docs/chapters/02-users/rules.md` y `00-app/rules.md`)

- **«Ver las personas» (R7.1, E36):** se tilda solo al tildar cualquiera de los otros tres de
  Usuarios y queda gris, sin poder destildarse, con la explicación al lado («Va incluido en
  «…»: se destilda solo si sacás ese»). En el celular también, resumida («Lo incluye «…»»),
  aunque ahí cada permiso va con su nombre solo: la regla pide explicarlo al lado.
- **Lo que no deja guardar (R7.3, R7.5, R1.3, E37, E56, E65)** se dice en su lugar, en rojo: el nombre
  vacío o repetido (sin distinguir mayúsculas) junto al nombre; un rol sin permisos arriba de los
  permisos; quitarse a uno mismo «Administrar personas» o «Administrar roles» junto a ese permiso;
  sacarse a uno mismo el rol que los da, o sacárselo a alguien que se quedaría sin ningún rol, junto
  a esa persona. Arriba, un aviso «No se guardó nada. Corregí lo que está marcado en rojo: …» que dice
  cuáles, porque lo marcado puede quedar fuera de la vista. Los errores aparecen al tocar «Guardar
  rol» y se apagan solos al corregirlos.
- **Lo que cambia y todavía no se guardó se ve:** quien recibe el rol dice «Se lo das al guardar», y
  a quien se le saca queda en la lista, punteado, con «Se lo sacás al guardar» y «Deshacer». Hace
  falta para decir en el lugar por qué no se le puede sacar (E65).
- **Confirmar que es uno (R3.8, R7.13, E50, E62):** si lo que se guarda da acceso y la sesión tiene
  más de 5 minutos, «Confirmá que sos vos» lista lo que da acceso y pide «Continuar con Google» (en
  el celular, «Poner la huella») una sola vez; al pasar, guarda todo. La maqueta supone siempre una
  sesión de más de 5 minutos y simula la espera. **Crear un rol también lo pide**, porque R3.8 lo
  incluye (crear, duplicar o agregar permisos), aunque el pedido nombraba solo dar el rol y sumar
  un permiso. Sacar un rol o un permiso no lo pide.
- **Borrar (R7.3, R7.4, R4.3, E39, E40, E60):** Administrador no tiene «Borrar el rol». Un rol que alguien
  tiene no se borra y se dice quiénes («No se puede borrar: lo tienen Graciela, Lucía, Martín y
  Carla Domínguez (dada de baja). Primero hay que sacárselo.»). Uno que nadie tiene se borra.
- **Las personas dadas de baja (R4.3, E60)** no figuran en «Lo tienen» ni en la lista, pero el rol
  dice debajo que también lo tienen y que vuelven con él al darlas de alta.
- **Duplicar (E38):** abre un rol nuevo, sin guardar, con los mismos permisos y la descripción,
  «Copia de <nombre>» como nombre y sin personas. Si había cambios sin guardar, pregunta antes si
  descartarlos.
- **«Darle este rol a…» (R7.5, R7.13):** solo personas activas que todavía no lo tienen.
- **Sin conexión (R2.2):** la pestaña se ve gris con «Sin conexión» y no se toca; en la maqueta, se
  simula tocando la luz de conexión, como en Usuarios.
- **Auditoría (00 · R1.3):** con «Pronto»; al tocarla, una tostada lo dice.
- **El teclado, en la computadora (00 · R2):**
  - Al abrir la pestaña, el cursor está en el buscador; al abrir un rol, en el nombre (R2.2). «/»
    lleva al buscador.
  - ↑ ↓ mueven la marca (el contorno naranja de Usuarios) por los roles, los grupos, los permisos,
    «Sacárselo» y «Darle este rol a…», y por las personas del buscador; Enter toca lo marcado (un
    permiso se tilda), Esc saca la marca o cierra el diálogo (R2.4 a R2.7).
  - Enter sin marca: en el buscador, «Nuevo rol» (o «Crear el rol «…»» si nada coincide); en el
    nombre, «Guardar rol» (R2.6).
  - Las teclas se ven solo con Alt apretado (R2.9) y no chocan con las del menú (V, C, P, N, M, E,
    Z, S) ni con las del navegador: Alt O Nuevo rol; Alt G Guardar rol o Crear el rol; Alt A
    Cancelar; Alt U Duplicar; Alt B Borrar el rol; Alt R Darle este rol a…; Alt L el camino
    «Roles»; en los diálogos, Alt T Descartar y Alt O Continuar con Google.
- **En el celular (00 · R2.12)** el cursor nunca arranca en una caja de texto, tampoco en el buscador
  de personas.

## Por el lenguaje visual y la tecnología

- **Colores de la imagen llevados a «Mostrador»:** las casillas tildadas, los números de sección y el
  ícono del rol van en pino (lo elegido), no en verde; el verde queda para la marca de la vista
  previa que pidió Carlos (logro: «da algo»). «Guardar rol» es la única acción naranja de la
  pantalla del rol, y «Nuevo rol» la de la lista. El gris de adentro de cada grupo de permisos es
  más suave que el fondo de la aplicación (mitad fondo, mitad blanco), como en la referencia, para
  que no parezca un hueco hasta el fondo (pedido de Carlos). «Cancelar» va como botón de solo texto
  (`.btn-fantasma`), no blanco con borde. Los avatares toman los tonos suaves del lenguaje, con
  variables y sin colores sueltos.
- **Lo de arriba del rol (el camino, el título y los botones) queda fijo al bajar,** y la vista
  previa también, con su propio desplazamiento: en 1366 × 768 la pantalla del rol no entra entera,
  y así «Guardar rol» y la vista previa no se pierden.
- **El texto de la imagen se ajustó a lo que pidió Carlos y al lenguaje:** «Definí el nombre, la
  descripción y los permisos de este rol.» (en el celular, resumido); «Así se verá este rol una vez
  creado.» en uno nuevo y «Así va a quedar cuando lo guardes.» en uno que existe.
- **Las casillas** son las del navegador, sin su aspecto, con el tilde dibujado como fondo: Firefox no
  dibuja `::after` en las casillas.
- **Atrás** del navegador o del celular se maneja con el historial (`pushState`): abrir un rol suma
  un paso, y volver con cambios pregunta antes.
- **Movimiento:** la pantalla del rol entra desde la derecha en el celular (como Usuarios) y con un
  fundido corto en la computadora; los grupos se despliegan con un fundido; lo recién guardado entra
  desde 8 px abajo con el borde verde 1 s; la persona sumada, igual. Solo `transform` y `opacity`; con
  «reducir movimiento», nada se mueve. El celular vibra solo después de que se tocó algo (Chrome
  bloquea la vibración antes).
- Sin red ni nada pesado: los íconos Lucide van en `icons-extra.js` (suma `user-minus` y `save`).

Todo lo que no figura acá sigue la imagen de Carlos.
