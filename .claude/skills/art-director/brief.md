# El entorno del director de arte (no es parte de su rol)

- **Dónde trabajás:** solo en la carpeta de la pantalla que te pasaron,
  `docs/design/mockups/<screen>/`. Cada variante va en
  `<screen>/<device>/variant-N-<idea>/index.html` (`device` es `desktop` o `phone`; `idea`, una o
  dos palabras en inglés). No escribas en ningún otro lugar del repositorio, no anotes tareas y no
  uses git: de eso se encarga quien te llamó. No publiques páginas.
- **Nombres de archivos y carpetas en inglés;** los textos de la maqueta, en castellano.
- **Lenguaje común, obligatorio:** `docs/design/visual-language.md`. Mirá
  `docs/design/common/sample.png`, `desktop-frame.html`, `phone-frame.html` y la versión `v2` de
  alguna pantalla ya hecha. Usá `common/common.css`, `common/icons.js`, las fuentes y las fotos con
  rutas relativas (desde `<screen>/<device>/variant-N-<idea>/index.html` es `../../../../common/`).
  Las variantes se diferencian en la idea, no en el estilo; la audaz puede romperlo diciendo qué
  rompe. Lo que falte (íconos, fotos) va en tu carpeta; `common/` no se modifica. Una paleta o un
  estilo distinto va aparte, como propuesta para Carlos.
- **Qué podés leer:** `docs/`. El código no (`src/`), ni la aplicación funcionando.
- **Internet:** podés bajar fotos, fuentes e íconos de bancos libres y mirar referencias.
  **Nunca pongas datos personales (correos, nombres de personas reales) en pedidos a internet ni en
  las maquetas.**
- **Dispositivos:** computadora 1366×768; celular 390 px de ancho. Tres variantes por dispositivo
  pedido, como mínimo.
- **Una sola aplicación** (ADR-002): la computadora y el celular son la misma pantalla con otra
  disposición. Las tres variantes de la computadora y las del celular se emparejan por número
  (la variante 1 del celular es la misma idea que la 1 de la computadora) y muestran lo mismo.
- **Capturas:** Playwright, con el Chromium que haya (en la nube,
  `executable_path="/opt/pw-browsers/chromium"`), abriendo con `file://`; celular con
  `device_scale_factor` 2. Cada variante con su `screenshot.png`; además `desktop-comparison.png`
  y `phone-comparison.png` con las variantes lado a lado. Los scripts, fuera del repositorio (en tu
  carpeta temporal).
- **Enlaces entre pantallas, desde el principio:** cada variante carga
  `<script src="../../../../common/navigate.js" defer></script>` y marca con `data-ir="<screen>"`
  el menú, la barra de abajo y las pestañas que llevan a otra pantalla (leé `navigate.js`). Los
  demás botones quedan quietos: se hacen andar después, solo en la variante que Carlos elija.
- **Sin pruebas:** no escribas pruebas ni compares capturas píxel a píxel.
- **Teclado:** en la computadora, todo con el teclado y las teclas a la vista. Un gesto nuevo se
  suma, no lo reemplaza.
- **Peso:** fotos recortadas y comprimidas (menos de 150 KB cada una), sin videos.
- **`<screen>/art-director-notes.md`:** lo que le dirías a Carlos (idea de cada variante, preferida
  y por qué, movimiento por interacción, autocrítica) y el catálogo de ideas numerado.
- **Respuesta final, corta y en castellano:** las rutas de las comparaciones y de las notas, y en
  pocas líneas las variantes, tu preferida y lo que contradice una regla.
