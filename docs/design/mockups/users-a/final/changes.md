# Usuarios (02 · etapa a) · maqueta final: en qué se diferencia de lo del director

Base: la variante 1, «La lista y la tarjeta» (`../desktop/variant-1-list/` y
`../phone/variant-1-list/`), con dos ideas de la variante 2, «Personas y aparatos»
(`../*/variant-2-devices/`): autorizar en una línea y «Se perdió un celular». Es una sola página
para la computadora y el celular (desde 900 px, la computadora; debajo, el celular), como el marco.
La carpeta no depende de las variantes: tiene su copia del marco aprobado (`shared.css`,
`shared.js`, `frame.css`, `frame.js`), los íconos que `common/icons.js` no tiene
(`extra-icons.js`), los datos (`data.js`) y la pantalla (`users.css`, `users.js`).

Capturas: `screenshot.png` (computadora), `screenshot-lost-cut.png` (lo que muestra «Cortar»),
`screenshot-offline.png` (sin conexión), `screenshot-phone.png` (celular),
`screenshot-phone-card.png` (la tarjeta), `screenshot-phone-authorize.png` (la línea para
autorizar abierta) y `screenshot-phone-lost.png` («Se perdió un celular» con un solo celular, ya
elegido).

## Lo que se tomó de cada variante

- **De la 1, todo lo demás:** los cuatro números de arriba (en la computadora), el buscador y los
  filtros Todas, Activas, Sin entrar y De baja con su número; la lista con «Pueden entrar» y «Dadas
  de baja»; la tarjeta fija a la derecha en la computadora, recorrida con ↑ ↓, y que entra desde la
  derecha en el celular; cambiar el nombre y el correo en el lugar; el candado del correo; la
  confirmación que lista lo que va a pasar; el punto verde de la sesión usada en la última media
  hora; los movimientos (fundido de la tarjeta, el renglón que se corre al cerrar, los números que
  ruedan, lo nuevo que entra con rebote y borde verde, la vibración 10-40-10).
- **De la 2, autorizar en una línea:** reemplaza al botón «Autorizar a alguien» y su diálogo. En la
  computadora es una tarjeta arriba de los números: correo, nombre (opcional) y «Autorizar», con
  Enter. En el celular es la barra de abajo, como escribir un mensaje: el correo y el botón redondo;
  al tocarla se abre con «Autorizar a alguien · no le llega nada», «Cancelar» y el nombre.
- **De la 2, «Se perdió un celular»:** un botón en la cabecera, a la derecha de «Usuarios» (arriba
  de la lista, R5.7), que abre un diálogo (en el celular, una hoja). Se adaptó a la regla (ver
  abajo).
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
  variante 2 se cortaban de una vez todas las sesiones de celular y todas las huellas de la
  persona. Ahora:
  1. «¿De quién es el celular?»: las personas activas, cada una con cuántos celulares tiene. Los
     celulares son los que tienen una sesión abierta o una huella suya, también los propios salvo
     el que se está usando.
  2. «¿Cuál celular de …?»: sus celulares, cada uno con «sesión abierta», «con huella» y su último
     uso. Si tiene uno solo, ya está elegido; si tiene más, «Cortar» no anda hasta elegir uno, y
     los otros quedan como estaban (Martín tiene dos para mostrarlo).
  3. «Cortar», de un toque y sin confirmación, cierra las sesiones de ese celular y le quita la
     huella, y muestra qué cortó: la sesión (vuelve a la entrada con su próximo pedido) y la huella
     (ya no entra con ella, no aprueba entradas de una computadora ni trabaja sin conexión), o que
     no tenía una u otra.
  4. Si la persona no tiene ningún celular, o el celular ya no tiene ni sesión ni huella al cortar,
     lo dice: «Nada que cortar».
- **Las teclas se ven solo con Alt (00 · R2.9):** la variante las mostraba siempre («Alt N», «/»).
  Ahora usan la pieza del marco y dicen solo la letra.
- **Las teclas no chocan con las del menú (00 · R2.10):** el menú usa V, C, P, N, M, Z, S y E; la
  variante usaba Alt N (Negocio) para autorizar. Quedaron: A Autorizar, U buscar, I Se perdió un
  celular, 1 a 4 los filtros, O cambiar el nombre, R cambiar el correo, T Cerrar todas, B Dar de
  baja o Borrar el alta, L Dar de alta. En los diálogos valen solo sus teclas: el número de cada
  persona o celular, C Cortar, V Volver, L Listo, B o T para confirmar y Esc para cerrar.
- **Al abrir, el cursor está en el correo para autorizar (00 · R2.2 y R2.6):** es la caja principal
  y Enter autoriza. En el celular no arranca en ninguna caja (R2.12).
- **Flechas (00 · R2.3 y R2.4):** ↑ ↓ recorren la lista con la marca del teclado y la tarjeta la
  sigue; ← sale al menú (con texto en una caja, solo desde el principio del texto); en el menú, ↑ ↓
  lo recorren como en el marco y → vuelve a la lista.
- **Sin conexión (R2.2, 00 · R4.4 y R4.6):** se simula con el selector de la maqueta del marco
  (a la derecha), no tocando la luz, que abre lo pendiente como en el marco. Lo que necesita
  conexión se pone gris con «Sin conexión»; al volver, anda solo y avisa «Volvió la conexión».
- **Textos largos en la computadora y cortos en el celular (00 · R3.2)**, en las ayudas y avisos.
- **Un correo vacío también se avisa junto al campo** («Escribí su correo de Google»), sin perder
  el nombre escrito (R3.3).

## Por la tecnología

- **Sin `backdrop-filter`:** la barra de autorizar del celular de la variante 2 desenfocaba lo de
  atrás, que pesa en un Android modesto. Va blanca y lisa.
- **Solo `transform` y `opacity` en lo que se mueve,** respetando «reducir movimiento». El gris de
  sin conexión usa `filter`, pero no se anima.
- **Los tonos de los avatares** son clases con los colores de la paleta, no estilos en línea.
- **En el celular, cambiar el nombre o el correo guarda al salir del campo** (no hay Enter a la
  vista); en la computadora, Enter guarda y Esc deja como estaba, como en la variante.

## Lo que queda para que decida Carlos

- **Las teclas de «Cerrar» y «Quitar» de cada renglón de la tarjeta:** 00 · R2.8 pide una tecla
  por botón, pero son varios iguales. Hoy se llega con Tab. Se podría numerarlos o recorrerlos con
  la marca.
- **Si «Se perdió un celular» lista también a quien no tiene celulares** (hoy sí, con «Ningún
  celular abierto», y al elegirla dice «Nada que cortar»), o solo a quien tiene alguno.
