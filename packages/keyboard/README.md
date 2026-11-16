# @ferrebress/keyboard

El teclado de una aplicación web, en dos capas independientes (ADR-019 y ADR-020 de Ferrebress):

- **La navegación** (`startNavigation`): las flechas, Enter, Esc, `/` y las páginas, con las mismas
  reglas en toda la aplicación, sobre las capas que la vista marca en su HTML.
- **Los atajos** (`startShortcuts`): cada pantalla declara sus comandos sobre su modelo
  (`defineShortcuts`), y un mapa de teclas les pone la combinación. La aplicación le pasa sus
  comandos, su mapa, qué pantalla está arriba y dónde publicar las teclas para que la vista las
  muestre.

No sabe nada del negocio ni de la aplicación que lo usa: todo lo que necesita se lo pasan al
prenderlo.
