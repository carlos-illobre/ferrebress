# Usuarios (02 · etapa a) · maqueta final: en qué se diferencia de lo del director

Base: la variante 1, «La lista y la tarjeta» (`../desktop/variant-1-list/` y
`../phone/variant-1-list/`), con dos ideas de la variante 2, «Personas y aparatos»
(`../*/variant-2-devices/`): autorizar en una línea y «Se perdió un celular». Es una sola página
para la computadora y el celular (desde 900 px, la computadora; debajo, el celular), como el marco.
La carpeta no depende de las variantes: tiene su copia del marco aprobado (`shared.css`,
`shared.js`, `frame.css`, `frame.js`), los íconos que `common/icons.js` no tiene
(`extra-icons.js`), los datos (`data.js`) y la pantalla (`users.css`, `users.js`).

Capturas: `screenshot.png` (computadora), `screenshot-keyboard-card.png` (la marca del teclado
en «Cerrar» de la tarjeta), `screenshot-lost.png` («Se perdió un celular»: elegir cuál),
`screenshot-lost-cut.png` (la tostada con lo que se cortó), `screenshot-offline.png` (sin
conexión), `screenshot-phone.png` (celular), `screenshot-phone-card.png` (la tarjeta),
`screenshot-phone-authorize.png` (la barra de autorizar abierta, con un error),
`screenshot-phone-lost-who.png` («¿De quién era el celular?») y `screenshot-phone-lost.png` (con un
solo celular, ya elegido).

## Lo que se tomó de cada variante

- **De la 1, todo lo demás:** los cuatro números de arriba (en la computadora), el buscador y los
  filtros Todas, Activas, Sin entrar y De baja con su número; la lista con «Pueden entrar» y «Dadas
  de baja»; la tarjeta fija a la derecha en la computadora, recorrida con ↑ ↓, y que entra desde la
  derecha en el celular; cambiar el nombre y el correo en el lugar; el candado del correo; la
  confirmación que lista lo que va a pasar; el punto verde de la sesión usada en la última media
  hora; los movimientos (fundido de la tarjeta, el renglón que se corre al cerrar, los números que
  ruedan, lo nuevo que entra con rebote y borde verde, la vibración 10-40-10).
- **De la 2, autorizar en una línea, tal como la hizo el director** (aspecto, disposición y
  comportamiento): en la computadora, la tarjeta a todo lo ancho arriba de la lista y la tarjeta de
  la persona, con el círculo naranja suave, el correo, el nombre apagado hasta que se empieza a
  escribir el correo, «Autorizar» en naranja y la ayuda debajo; Enter autoriza. En el celular, la
  barra de abajo, como escribir un mensaje: el correo en una píldora y el botón redondo; al tocarla
  se abre con «Autorizar a alguien · no le llega nada», «Cancelar», el aviso de error y el nombre, y
  se cierra con «Cancelar» o al autorizar.
- **De la 2, «Se perdió un celular», tal como lo hizo el director:** la tarjeta «¿Se perdió o le
  robaron un celular?» con «Cortar un celular» en pino lleno, y el diálogo (en el celular, hoja)
  con «¿De quién era el celular?», los pases de cada persona con «N sesiones · N huellas» y
  después «Los celulares de …»; al cortar se cierra y la tostada dice lo que se cortó. Los ajustes
  que pide la regla, abajo.
- **De la 2 no se tomó** la mirada «Aparatos abiertos», los pases con los aparatos a la vista, el
  menú «⋯» de la persona ni el estante de dadas de baja.

## Por directivas de Carlos

- **Usuarios va en Más, no en Negocio** (00 · R1.2 y 02 · R2.1). El título de la pantalla es
  «Usuarios» y no hay pestañas Resumen · Usuarios · Quién hizo qué.
- **El menú es el del marco aprobado** (`app-frame/final/`), con la parte abierta en Más (verde
  claro en la computadora, naranja en el celular). En la computadora, el panel de Más suma
  «Usuarios» (entre «Mejoras y errores» y «Configuración», el orden de 00 · R1.2), marcada como la
  opción abierta y sin «Pronto»; tocarla cierra el panel. No lleva la pestaña «Auditoría». En el
  celular no se incluye la pantalla Más. **El menú final lo decide Carlos al programarlo**: esta
  maqueta no lo fija.

- **Mientras se autoriza en el celular, el menú de abajo no se ve:** la barra queda sola abajo,
  como al escribir un mensaje encima del teclado, y el menú vuelve al cancelar o al autorizar. En la
  variante quedaba visible debajo.
- **Los cuatro filtros se ven de una vez en el celular, sin deslizar:** cuatro partes iguales con
  el nombre y el número debajo. En la computadora entran en una fila (con Alt apretado, el
  buscador se achica para dejarles lugar).
- **«Cerrar» y «Quitar» de la tarjeta se recorren con las flechas, sin tecla Alt propia:** con la
  marca en un renglón de la lista, → entra a la tarjeta; ↑ ↓ pasan por el «Cerrar» de cada sesión
  y el «Quitar» de cada celular; Enter toca el marcado (la marca pasa al que queda en su lugar) y
  ← vuelve a la lista.
- **«Se perdió un celular» lista solo a quien tiene algún celular para cortar** (una sesión
  abierta en un celular o una huella), como en la variante. Si nadie tiene, lo dice.

## Por las reglas aprobadas

- **Las dadas de baja muestran la pastilla «Administrador» (R3.1, E06):** la variante la
  reemplazaba por «Dada de baja». Ahora llevan las dos: «Dada de baja» junto al nombre y
  «Administrador» en gris. Se siguen distinguiendo sin leer: renglón punteado y avatar con ⊘.
- **Cambiar el nombre se puede siempre (R3.5):** la variante sacaba el lápiz a las dadas de baja.
- **El candado del correo también en las dadas de baja (R3.6):** ya entraron, el correo no cambia.
- **Quitar un celular con huella cierra la sesión abierta en ese celular (R5.6):** la variante solo
  quitaba la huella. Cada sesión de celular y cada huella saben de qué celular son.
- **La sesión del dispositivo que se está usando no figura en la tarjeta propia (R5.2):** en la
  variante del celular aparecía la sesión de ese mismo celular. Ahora la computadora no muestra la
  suya (Chrome en Windows) y el celular tampoco (Chrome en Android).
- **«Se perdió un celular» corta un celular, no todos los de la persona (R5.7, E31, E32):** en la
  variante 2, el segundo paso listaba todo lo de la persona y «Cortar sus celulares» cortaba todas
  sus sesiones de celular y todas sus huellas. Ahora sus celulares se muestran con la misma pieza
  de los pases, cada uno con «sesión abierta», «con huella» y su último uso; si tiene uno solo ya
  está elegido (con el borde en pino); si tiene más, «Cortar este celular» no anda hasta elegir uno
  y los otros quedan como estaban (Martín tiene dos para mostrarlo). «Cortar» va sin confirmación,
  cierra las sesiones de ese celular y le quita la huella; la tostada dice qué cortó («se cerró su
  sesión y se le quitó la huella»), o que no había nada que cortar si alguien lo cortó mientras
  tanto. Cuentan los celulares propios, salvo el que se está usando.
- **La tarjeta «¿Se perdió…?» va arriba de la lista (R5.7):** en la variante estaba en la mirada
  «Aparatos abiertos», que no se tomó. En la computadora, el botón va a la derecha del texto para
  que entre en una fila; su texto dice que se elige de quién y cuál.
- **Las teclas se ven solo con Alt (00 · R2.9):** la variante las mostraba siempre («Alt N», «/»).
  Ahora usan la pieza del marco y dicen solo la letra.
- **Las teclas no chocan con las del menú (00 · R2.10):** el menú usa V, C, P, N, M, Z, S y E; la
  variante usaba Alt N (Negocio) para ir a la línea de autorizar y Alt C (Catálogo) para «Cortar un
  celular», y la ayuda decía «Alt N desde cualquier lado». Quedaron: A Autorizar, U buscar, I Cortar
  un celular, 1 a 4 los filtros, O cambiar el nombre, R cambiar el correo, T Cerrar todas, B Dar de
  baja o Borrar el alta, L Dar de alta. En los diálogos valen solo sus teclas: el número de cada
  persona o celular, C Cortar, B o T para confirmar y Esc para cerrar.
- **Al abrir, el cursor está en el correo para autorizar (00 · R2.2 y R2.6):** es la caja principal
  y Enter autoriza. En el celular no arranca en ninguna caja (R2.12).
- **Flechas (00 · R2.3 y R2.4):** ↑ ↓ recorren la lista con la marca del teclado y la tarjeta la
  sigue; → entra a la tarjeta y ← vuelve; desde la lista, ← sale al menú (con texto en una caja,
  solo desde el principio del texto); en el menú, ↑ ↓ lo recorren como en el marco y → vuelve a la
  lista.
- **Sin conexión (R2.2, 00 · R4.4 y R4.6):** se simula con el selector de la maqueta del marco
  (a la derecha), no tocando la luz, que abre lo pendiente como en el marco. Lo que necesita
  conexión se pone gris con «Sin conexión»; al volver, anda solo y avisa «Volvió la conexión».
- **Textos largos en la computadora y cortos en el celular (00 · R3.2)**, en las ayudas y avisos.
- **Un correo vacío también se avisa junto al campo** («Escribí su correo de Google»), sin perder
  el nombre escrito (R3.3).
- **El texto del campo del correo es largo en la computadora y corto en el celular (00 · R3.2)**,
  los mismos dos que usó el director en cada variante.

## Por la tecnología

- **Sin `backdrop-filter`:** la barra de autorizar del celular de la variante 2 desenfocaba lo de
  atrás, que pesa en un Android modesto. Va blanca y lisa.
- **Solo `transform` y `opacity` en lo que se mueve,** respetando «reducir movimiento». El gris de
  sin conexión usa `filter`, pero no se anima.
- **Los tonos de los avatares** son clases con los colores de la paleta, no estilos en línea.
- **En el celular, cambiar el nombre o el correo guarda al salir del campo** (no hay Enter a la
  vista); en la computadora, Enter guarda y Esc deja como estaba, como en la variante.
