# Usuarios (02 · etapa a) · maqueta final: en qué se diferencia de la variante 1 del director

La final es una copia fiel de la variante 1, «La lista y la tarjeta»
(`../desktop/variant-1-list/` y `../phone/variant-1-list/`), con sus mismas dos páginas
(`desktop/` y `phone/`) y sus archivos compartidos copiados en `shared/`. Las páginas y los
archivos compartidos (`frame.css`, `ui.js`, `icons-extra.js`) son los de la variante. `data.js` y
`v1.js` llevan los cambios de abajo. Todo lo que no figura acá es igual a la variante: el marco y
el menú, la cabecera con el título, las pestañas y «Autorizar a alguien» con su diálogo (en el
celular, la hoja), los cuatro números, el buscador y los filtros de la computadora, la lista, la
tarjeta, las confirmaciones, el movimiento y las teclas.

Capturas:
- `desktop/screenshot.png` y `phone/screenshot.png`: la pantalla al abrir.
- `screenshot-unsubscribed.png`: una persona dada de baja.
- `screenshot-keyboard-card.png`: la marca del teclado en «Cerrar» de la tarjeta.
- `screenshot-lost-which.png`: «Se perdió un celular», con dos celulares para elegir.
- `screenshot-lost-cut.png`: la tostada con lo que se cortó.
- `screenshot-phone-own-card.png`: la tarjeta propia en el celular.
- `screenshot-phone-lost-who.png`: «¿De quién es el celular?», en el celular.
- `screenshot-phone-lost-which.png`: con un solo celular, ya elegido.

## Por directivas de Carlos

- **Los cuatro filtros del celular se ven de una vez, sin deslizar hacia el costado:** cuatro partes
  iguales con el nombre y el número debajo. En la computadora quedan como en la variante.
- **«Cerrar» y «Quitar» de la tarjeta se recorren con las flechas (computadora):** → pasa de la
  lista a la tarjeta, ↑ ↓ recorren el «Cerrar» de cada sesión y el «Quitar» de cada celular con la
  marca del teclado (el contorno naranja) y Enter toca el marcado. Después, la marca pasa al botón
  que queda en su lugar. ← o Esc vuelven a la lista. No tienen tecla Alt propia.
- **«Se perdió un celular» es un botón secundario, blanco, al lado de «Autorizar a alguien»:** en la
  computadora va a su izquierda en la cabecera, con Alt P. En el celular comparte la barra de abajo
  con «Autorizar a alguien», a su izquierda y en dos renglones. Abre un diálogo (en el celular, una
  hoja) con el mismo estilo que los de la variante.

## Por las reglas aprobadas (`docs/chapters/02-users/rules.md`)

- **«Se perdió un celular» (R5.7, E31 y E32):**
  1. «¿De quién es el celular?» muestra solo a las personas que tienen algún celular para cortar
     (con una sesión abierta en un celular o con huella), con cuántos tiene cada una. Cuentan los
     celulares propios, salvo el que se está usando.
  2. «¿Cuál celular de …?» muestra sus celulares, cada uno con «sesión abierta», «con huella» y su
     último uso. Si tiene uno solo, ya está elegido. Si tiene más, «Cortar» no anda hasta elegir
     uno, y los otros quedan como estaban (Martín tiene dos para mostrarlo).
  3. «Cortar» va sin confirmación: cierra las sesiones de ese celular y le quita la huella. La
     tostada dice qué cortó («Se cerró su sesión y se le quitó la huella»). Si alguien lo cortó
     mientras tanto, dice que no había nada que cortar.
  4. Las opciones usan el renglón de la tarjeta (ícono de 40 px y dos líneas). Lo elegido lleva el
     borde en pino y un círculo lleno.
- **Las dadas de baja también muestran la pastilla «Administrador» (R3.1, E06):** la variante la
  reemplazaba por «Dada de baja». Ahora «Administrador» queda en gris en su lugar y «Dada de baja»
  va junto al nombre. Se siguen distinguiendo sin leer: renglón punteado y avatar con ⊘.
- **El nombre se puede cambiar siempre (R3.5):** la variante sacaba el lápiz a las dadas de baja.
- **El candado del correo también en las dadas de baja (R3.6):** ya entraron, así que el correo no
  cambia.
- **Quitar un celular con huella cierra también la sesión abierta en ese celular (R5.6):** la
  variante solo quitaba la huella. La tostada lo dice. Para eso, cada sesión de celular y cada
  huella saben de qué celular son (`data.js`).
- **La sesión del dispositivo que se está usando no figura en la tarjeta propia (R5.2, E22):** en la
  variante del celular aparecía la de ese mismo celular. Ahora Rubén tiene dos sesiones, la de la
  computadora y la del celular: cada página muestra solo la del otro dispositivo. Los números, los
  contadores del renglón y «Cerrar todas» cuentan solo lo que se ve. «Cerrar todas» no cierra la
  sesión del dispositivo que se está usando (R5.4).
- **Los celulares con huella propios no se cuentan en el renglón propio (R5.5):** la tarjeta ya no
  los mostraba («Los tuyos van en Configuración»).

## Lo que no se cambió y choca con una regla

- **Usuarios sigue en Negocio, con las pestañas Resumen · Usuarios · Quién hizo qué,** como en la
  variante y como pidió Carlos. La regla R2.1 (y 00 · R1.2) la pone en Más, como opción propia.
  Carlos decide el menú al programarlo.
- **Las teclas, como en la variante:** se ven siempre y no solo con Alt (00 · R2.9), y Alt N
  («Autorizar a alguien») es la misma tecla que Negocio en el marco aprobado (00 · R2.10). Se
  arreglan junto con el menú.
