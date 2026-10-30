# Usuarios (02 · etapa a) · maqueta final: en qué se diferencia de lo del director

Dos páginas, una por dispositivo, cada una copia fiel de la variante del director que eligió
Carlos:

- **Computadora (`desktop/`, aprobada):** la variante 1 de la primera ronda, «La lista y la
  tarjeta» (`../desktop/variant-1-list/`). Usa los archivos de la variante copiados en `shared/`.
  `data.js` y `v1.js` llevan los cambios de abajo, y la página suma las teclas con Alt y las
  pestañas.
- **Celular (`phone/`, aprobado):** la variante 1 de la tercera ronda, «Entrar a la tarjeta»
  (`../../users-a3/phone/variant-1-push/`). Sus archivos compartidos (`base.css`, `data.js`,
  `ui.js`, `icons-extra.js`) están copiados en la misma carpeta.

Todo lo que no figura acá es igual a lo del director.

Capturas:
- `desktop/screenshot.png` y `phone/screenshot.png`: la pantalla al abrir.
- Computadora:
  - `screenshot-alt.png`: con Alt apretado.
  - `screenshot-unsubscribed.png`: una persona dada de baja.
  - `screenshot-keyboard-card.png`: la marca del teclado en «Cerrar» de la tarjeta.
  - `screenshot-lost-which.png`: «Se perdió un celular», con dos celulares para elegir.
  - `screenshot-lost-cut.png`: la tostada con lo que se cortó.
- Celular:
  - `screenshot-phone-card.png`: la tarjeta de una persona.
  - `screenshot-phone-own-card.png`: la tarjeta propia.
  - `screenshot-phone-lost-who.png`: «¿De quién es el celular?».
  - `screenshot-phone-lost-which.png`: «¿Cuál celular de …?», con dos.
  - `screenshot-phone-lost-cut.png`: la tostada con lo que se cortó.
  - `screenshot-phone-authorize-error.png`: autorizar un correo que ya está cargado.

## Computadora

### Por directivas de Carlos

- **Va en Más → Usuarios, no en Negocio:** en el menú la parte elegida es Más y el título es
  «Usuarios». Las pestañas son Usuarios · Auditoría, sin Resumen ni Quién hizo qué. Auditoría es
  del módulo 05: lleva «Pronto» y no se abre (al tocarla, la tostada lo dice), como lo que todavía
  no existe en el ambiente de pruebas (00 · R1.3).
- **Las teclas se ven solo mientras Alt está apretado (00 · R2.9),** y ninguna choca con las del
  menú (00 · R2.10). «Autorizar a alguien» pasó de Alt N (Negocio) a Alt U, y «Se perdió un
  celular», de Alt P (Depósito) a Alt I. Las demás quedan como en la variante: Alt T Cerrar todas,
  Alt B Dar de baja o Borrar el alta, Alt A Dar de alta, «/» busca y Esc cierra.
- **«Cerrar» y «Quitar» de la tarjeta se recorren con las flechas:**
  - → pasa de la lista a la tarjeta.
  - ↑ ↓ recorren el «Cerrar» de cada sesión y el «Quitar» de cada celular, con la marca del
    teclado (el contorno naranja).
  - Enter toca el marcado, y la marca pasa al botón que queda en su lugar.
  - ← o Esc vuelven a la lista. No tienen tecla Alt propia.
- **«Se perdió un celular» es un botón secundario blanco,** a la izquierda de «Autorizar a
  alguien». Abre un diálogo con el mismo estilo que los de la variante.

### Por las reglas aprobadas (`docs/chapters/02-users/rules.md`)

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
- **El candado del correo también aparece en las dadas de baja (R3.6):** ya entraron, así que el
  correo no cambia.
- **Quitar un celular con huella cierra también la sesión abierta en ese celular (R5.6):** la
  variante solo quitaba la huella. La tostada lo dice. Para eso, cada sesión de celular y cada
  huella saben de qué celular son (`shared/data.js`).
- **La sesión de la computadora que se está usando no figura en la tarjeta propia (R5.2, E22).**
  Los números, los contadores del renglón y «Cerrar todas» cuentan solo lo que se ve, y «Cerrar
  todas» no la cierra (R5.4).
- **Los celulares con huella propios no se cuentan en el renglón propio (R5.5):** la tarjeta ya no
  los mostraba («Los tuyos van en Configuración»).

## Celular

### Por directivas de Carlos

- **El renglón «Se perdió un celular» resalta para distinguirse de los renglones de las
  personas:** en la variante era blanco, con borde gris y sombra, como ellos. Ahora va con el fondo
  rojo suave (`--error-suave`), el borde de 1 px en rojo (`--error`) para que se vea como algo que
  se toca, sin sombra, el título, la línea y la flecha en su rojo (`--error-texto`) y el ícono sobre
  un círculo blanco. Lugar, tamaño y texto, como en la variante.
- **Sin el botón «En espejo» en la cabecera:** queda solo el título «Usuarios».
- **La barra de arriba de la tarjeta (‹ Usuarios) es de color liso** (`--fondo`), sin el
  desenfoque de la variante.
- **Auditoría lleva «Pronto» y no se abre,** igual que en la computadora aprobada (00 · R1.3): en
  la variante llevaba a otra maqueta. Al tocarla, la tostada lo dice.

### Por las reglas aprobadas

- **La tarjeta propia dice que la baja la hace otro Administrador (R1.3, E03):** en la variante,
  la tarjeta propia no tenía «Dar de baja» ni lo explicaba. Ahora tiene una nota más, igual a la
  de la computadora.
- **Borrar el nombre de quien nunca entró vuelve al correo, no al de Google (R3.4, R3.5):** la
  ayuda de «Cambiar el nombre» decía siempre «Vacío, vuelve al de Google». Para quien no entró
  dice «Vacío, se ve su correo hasta que entre».
- **Corregir el correo a uno que ya está cargado se avisa junto al campo (R3.3, R3.6):** la
  variante solo controlaba que tuviera forma de correo. Dice «Ese correo ya está cargado», sin
  distinguir mayúsculas.

El resto de la variante ya cumplía las reglas:
- la sesión de este celular y los celulares con huella propios no figuran (R5.2, R5.5);
- «Quitar» también cierra la sesión de ese celular (R5.6);
- «Se perdió un celular» muestra solo a quien tiene un celular para cortar, elige uno (ya elegido
  si es uno solo) y corta sin confirmación (R5.7);
- «Cerrar todas» y «Dar de baja» piden confirmación (R4.1, R5.4);
- sin conexión, todo se pone gris (R2.2).
