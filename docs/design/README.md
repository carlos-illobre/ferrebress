# Diseño

Cómo se ve Ferrebress. La interfaz es lo que más va a cambiar: todo lo de acá se puede rehacer sin
tocar las reglas.

| Dónde | Qué tiene |
|---|---|
| [visual-language.md](visual-language.md) | El lenguaje visual «Mostrador»: paleta, letra, íconos, piezas, movimiento y marco |
| [common/](common/) | Lo que usan todas las maquetas: `common.css`, los íconos, las fuentes, las fotos de producto, el marco de la computadora y del celular, y la navegación entre maquetas |
| [mockups/](mockups/) | Las maquetas, una carpeta por pantalla |
| [index.html](index.html) | El visor: muestra cada pantalla funcionando, con sus variantes, en la computadora y en el celular. Se publica en https://carlos-illobre.github.io/ferrebress/ con cada subida a `main` |

## Las maquetas

Cada pantalla tiene su carpeta en `mockups/<pantalla>/`, con `desktop/` y `phone/`:

- **`v2/`** es la referencia de partida: la versión que Carlos eligió para cada pantalla
  (decisión 6). Se abre sola, desde su `index.html`, y navega a las demás pantallas.
- **`variant-1-<idea>/`, `variant-2-<idea>/`, `variant-3-<idea>/`** son las tres versiones que hace
  el director de arte en el paso 2 de cada módulo (constitución, «Los nueve pasos»).
- **`art-director-notes.md`** es lo que el director de arte le dijo a Carlos de esa pantalla, con
  el catálogo de ideas.
- **`chosen/`** es la elegida, adaptada por el maquetador a lo que pidió Carlos y a las reglas, con
  `changes.md`. Es la que vale para programar. Las variantes del director no se modifican.
- **La versión elegida** queda escrita en el `screens.md` del capítulo, con su carpeta.
- **`mockups/index.json`** es el índice del visor: solo las pantallas del módulo en curso, con sus
  variantes. Las v2 no figuran en el visor: son material de consulta para el director de arte.

La pantalla de entrada (`mockups/sign-in/`) no tiene v2: se ve como la de la primera versión, que
está en sus capturas `current-desktop.png` y `current-phone.png`; la adaptada a las reglas del
capítulo 01 está en `adapted/`.

Las maquetas no llevan pruebas: se abre cada una y se mira que la consola no tenga errores.

Algunas maquetas v2 muestran reglas que ya cambiaron (por ejemplo, el ítem libre o el aviso de «no
es múltiplo de $1.000»). Mandan las reglas del capítulo (constitución, principio I).
