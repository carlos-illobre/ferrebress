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

Argumentos: la pantalla o las pantallas, y el dispositivo (`desktop`, `phone` o los dos; si no lo
dice, los dos). Ejemplo: `/art-director stock, phone`.

## Cómo se corre

1. **Un subagente por pantalla** (herramienta Agent, `general-purpose`, en segundo plano), con
   este mensaje: «Leé y seguí `.claude/skills/art-director/prompt.md` (tu rol) y
   `.claude/skills/art-director/brief.md` (el entorno)», más la entrada: la pantalla, la carpeta
   donde va (`docs/design/mockups/<screen>/`), el dispositivo, el capítulo que la especifica
   (`docs/chapters/NN-<module>/`) y qué hace la pantalla en una línea. Va como subagente a
   propósito: no ve el código ni la conversación, para que lo de hoy no lo sesgue.
2. **Varias pantallas a la vez:** en paralelo, todas sobre el lenguaje común de
   `docs/design/visual-language.md`.
3. **Al terminar cada una**, antes de subir:
   - que no haya datos personales (correos) ni rutas absolutas en los archivos;
   - que cada variante se abra sola (rutas relativas a `docs/design/common/`) y tenga su
     `screenshot.png`, y que la pantalla tenga `desktop-comparison.png`, `phone-comparison.png` y
     `art-director-notes.md`;
   - commit y push a `main`.
4. **A Carlos:** las comparaciones con `SendUserFile` y, por pantalla, la idea de cada variante,
   la preferida del agente y lo que contradice una regla o queda fuera del capítulo.
5. **Cuando Carlos elige,** se anota la variante en el `screens.md` del capítulo.

## Hacer navegable una variante

Cuando Carlos pide «hacé navegable la variante X de tal pantalla», un subagente sigue
`.claude/skills/art-director/navigable.md` sobre esa carpeta.

Las maquetas no se modifican ni se borran hasta que Carlos lo pida, aunque una pantalla ya esté
elegida y programada.
