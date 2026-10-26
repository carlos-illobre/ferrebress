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
- **La versión elegida** queda escrita en el `screens.md` del capítulo, con su carpeta.
- **`mockups/index.json`** es el índice del visor: cada pantalla con su módulo y sus variantes.

La pantalla de entrada (`mockups/sign-in/`) no tiene v2: se ve como la de la primera versión, que
está en sus capturas `current-desktop.png` y `current-phone.png`. Ojo: en esa primera versión el
celular entraba con Google, y ahora no (decisión 11).

Las maquetas no llevan pruebas: se abre cada una y se mira que la consola no tenga errores.

Algunas maquetas v2 muestran reglas que ya cambiaron (por ejemplo, el ítem libre o el aviso de «no
es múltiplo de $1.000»). Mandan las reglas del capítulo (constitución, principio I).
