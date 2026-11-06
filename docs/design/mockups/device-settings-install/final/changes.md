# El aviso para instalar (04 · R4.5) · maqueta final: en qué se diferencia de lo del director

Base: la variante 1 «La hoja» (`../phone/variant-1-sheet/`, con `../shared.css`, `../shared.js` e
`../icons-extra.js`). Esta carpeta no depende de las variantes: `install.css`, `install.js` e
`icons-extra.js` (solo los tres íconos que `common/icons.js` no tiene) son copias con los cambios de
abajo. El marco de atrás es el de las otras finales (`../../device-settings-a/final/`,
`../../app-frame/final/`).

Todo lo que no figura acá es igual a lo del director: la hoja que sube sobre Vender con el fondo al
30 %, el inicio del celular en chico con el ícono de Ferrebress ya puesto (se asoma 6 px cada
tanto), el título con la frase de la regla, las pastillas «Abre al toque» y «Pantalla completa»,
«Instalar» naranja grande y «Ahora no» debajo, bajar la hoja (más de 90 px) o tocar afuera como
«Ahora no», el pedido del navegador dibujado como Chrome, «Listo: ya está en tu pantalla de inicio»
dentro de la hoja con el tilde verde y la vibración 10-40-10, las dos tostadas y la lengüeta de la
maqueta (no es parte del diseño).

Capturas:
- `screenshot.png`: el aviso, un instante después de entrar.
- `screenshot-browser.png`: el pedido del navegador, después de tocar «Instalar».
- `screenshot-done.png`: el navegador confirmó; «Listo» en la hoja, antes de irse sola.
- `screenshot-installed-toast.png`: la hoja se fue y la tostada «Ferrebress quedó con su ícono».
- `screenshot-after.png`: cerrado (con «Ahora no», bajándolo, tocando afuera o cancelando en el
  navegador), con la tostada «Si cambiás de idea, está en Más → Configuración».

## Por directivas de Carlos

- **Si se toca «Instalar» y se cancela en el navegador, el aviso cuenta como cerrado** (R4.5, E36):
  la hoja se va, igual que con «Ahora no», con la misma tostada, y no vuelve en ese celular. En la
  variante la hoja quedaba abierta. La lengüeta tiene «El navegador cancela» para verlo.

## Por las reglas aprobadas

- **El marco de atrás, como en las otras finales:**
  - sin barra de estado dibujada ni la raya de abajo del iPhone: el título empieza arriba (00 · R4.1);
  - debajo del título, la pastilla del vínculo con su estado y lo que gasta la aplicación («Directo»,
    «0 KB/min»; 03 · R4.1, R4.5). La variante tenía «Desconectado» a la derecha del título;
  - sin la luz «En línea · todo enviado»: con todo enviado no se muestra (00 · R4.1);
  - el área de trabajo vacía, sin las pestañas ni los renglones de ejemplo: Vender todavía no
    existe, como en el marco final;
  - en el menú de abajo, Vender en naranja sin la raya de arriba, y «Pronto» debajo de lo que todavía
    no existe (00 · R1.3), como en el marco final;
  - el marco magenta y el cartel del ambiente de pruebas (00 · R10).
- **Cerrado de cualquier forma, no vuelve** (R4.5, E25): «Ahora no», bajar la hoja, tocar afuera y
  cancelar en el navegador hacen lo mismo. En la maqueta, «Ver el aviso de nuevo» de la lengüeta lo
  vuelve a mostrar solo para mirarlo; en la aplicación no vuelve en ese celular.
- **Mientras se espera al navegador, la hoja no se cierra ni se arrastra** y «Instalar» no se puede
  tocar dos veces: es un solo pedido.

## Por la tecnología

- **Solo `transform` y `opacity`:** el tilde verde se dibujaba con `stroke-dashoffset`. Ahora entra
  con el rebote (escala) y un fundido, en 200 ms.
- **Ocupa la pantalla del celular** (100 % del ancho y `100dvh`), con el margen de abajo del
  sistema (`env(safe-area-inset-bottom)`) en la hoja y el menú. La variante era una caja fija de
  390 × 844. Abierta en una pantalla de 900 px o más (fuera del visor), se ve con el tamaño de un
  celular; en el código el aviso no existe en la computadora (E27), y lo decide el tipo de
  dispositivo, no el ancho.
- **Mientras está abierta, lo de atrás no se puede tocar** (`inert`), y al cerrarse la hoja se
  esconde (`hidden`) para que no quede en el orden del lector de pantalla.
- **El pedido del navegador es simulado:** en el código es el `beforeinstallprompt` de Chrome
  (`prompt()` y su respuesta: aceptado, o cancelado, que cuenta como cerrado).
- **Con «reducir movimiento»**, todo aparece y se va en el acto: la hoja, el fondo, el tilde, el
  pedido, la tostada, el ícono que se asoma y el latido del punto del vínculo.
- **Nada consulta la red.**
- **Se probó en Chromium** a 390 × 844 y 360 × 740, sola y dentro del visor, sin errores en la
  consola. No hubo Firefox ni Chrome en Android para probarla.

## Para llevarla al código

- Una clase por pieza, con los tokens de `common.css`:
  - `.velo`, el fondo que se oscurece;
  - `.aviso-hoja` (`role="dialog"`, `aria-modal`), con `.aviso-agarre`, `.aviso-inicio`
    (`.aviso-otra`, `.aviso-nombre`), `.app-icono` y `.app-tilde`, `.aviso-titulo`,
    `.aviso-ventajas` (una lista), `.aviso-botones` y `.aviso-hecho` (`role="status"`);
  - `.tostada`, en un lugar con `aria-live`.
- La regla está en `install.js`: `cerrar()` es el único camino para irse y es el que anota, en ese
  celular, que el aviso ya se mostró; `instalar()` confirma (E26) o, si el navegador cancela, hace
  lo mismo que `ahoraNo()` (E36).
- En el código, el botón atrás de Android también es «Ahora no».
