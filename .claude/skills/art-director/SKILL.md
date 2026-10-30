---
name: art-director
description: Director de arte de interfaces. Hace tres versiones de cada pantalla, en la computadora y en el celular, para que Carlos elija. Es el paso 2 de cada módulo (constitución), y también corre cuando Carlos escribe /art-director.
---

# Director de arte

**Las maquetas no llevan pruebas.** Ni unitarias, ni de punta a punta, ni scripts que recorran
los botones, ni comparación de capturas píxel a píxel. Se abre cada maqueta una vez y se mira que
la consola no tenga errores. Quien lance a un agente de maquetas le copia esta regla en el
encargo.

**Cuándo corre:** en el paso 2 de cada módulo, con las reglas del paso 1 ya aprobadas, o cuando
Carlos lo pide con `/art-director`. Propone; Carlos elige.

**Una pantalla por vez.** Se diseña una pantalla, Carlos la elige, y recién entonces la siguiente,
en el orden en que la persona las usa. Nunca pantallas de otro módulo, ni pantallas que todavía no
hacen falta para lo que se está construyendo (el manual, por ejemplo, va en el paso 9).

**Se miran funcionando, no en capturas.** Cada variante se navega y tiene sus animaciones. Se
publican en el visor de maquetas (`docs/design/index.html`, en GitHub Pages:
https://carlos-illobre.github.io/ferrebress/), que muestra las tres variantes de cada pantalla,
en la computadora y en el celular. A Carlos se le pasa el enlace.

Argumentos: la pantalla o las pantallas, y el dispositivo (`desktop`, `phone` o los dos; si no lo
dice, los dos). Ejemplo: `/art-director stock, phone`.

## Cómo se corre

1. **Un subagente por pantalla** (herramienta Agent, `general-purpose`, en segundo plano), con
   este mensaje: «Leé y seguí `.claude/skills/art-director/prompt.md` (tu rol) y
   `.claude/skills/art-director/brief.md` (el entorno)», más la entrada: la pantalla, la carpeta
   donde va (`docs/design/mockups/<screen>/`), el dispositivo, el capítulo que la especifica
   (`docs/chapters/NN-<module>/`) y qué hace la pantalla en una línea. **Nada más:** el encargo
   no lleva restricciones ni prohibiciones («no pongas…», «nada de…»). El director diseña sin
   límites y puede romper cualquier regla, el marco o el menú; lo que las reglas exigen lo aplica
   después el maquetador. Va como subagente a
   propósito: no ve el código ni la conversación, para que lo de hoy no lo sesgue.
2. **Varias pantallas a la vez:** en paralelo, todas sobre el lenguaje común de
   `docs/design/visual-language.md`.
3. **Al terminar cada una**, antes de subir:
   - que no haya datos personales (correos) ni rutas absolutas en los archivos;
   - que cada variante se abra sola (rutas relativas a `docs/design/common/`) y tenga su
     `screenshot.png`, y que la pantalla tenga `desktop-comparison.png`, `phone-comparison.png` y
     `art-director-notes.md`;
   - que la pantalla esté en `docs/design/mockups/index.json` (el índice del visor), con sus
     variantes;
   - commit y push a `main`; el visor se publica solo.
4. **A Carlos:** el enlace del visor y, por variante, la idea en una frase, la preferida del agente
   y lo que contradice una regla o queda fuera del capítulo. Antes de pasárselo, quien lanzó al
   agente abre las tres y comprueba que de verdad son tres ideas distintas y que la audaz rompe
   algo; si no, la devuelve.
5. **Cuando Carlos elige,** se anota la variante en el `screens.md` del capítulo. **El director de
   arte no ajusta su maqueta:** diseña sin restricciones. Lo que Carlos pida cambiar y lo que las
   reglas exijan lo aplica el maquetador (agente `mockup-builder`), que construye la maqueta final en `final/`.

## Hacer navegable una variante

Cuando Carlos pide «hacé navegable la variante X de tal pantalla», un subagente sigue
`.claude/skills/art-director/navigable.md` sobre esa carpeta.

Las maquetas no se modifican ni se borran hasta que Carlos lo pida, aunque una pantalla ya esté
elegida y programada.
