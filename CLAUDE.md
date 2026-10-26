# Ferrebress

Sistema de gestión de una ferretería de barrio. **La documentación manda; el código es
secundario.**

## Por dónde empezar

1. [docs/project/constitution.md](docs/project/constitution.md): lo que no se negocia, cómo se
   escribe el código y los nueve pasos de un módulo. **Leela antes de tocar nada.**
2. [docs/project/roadmap.md](docs/project/roadmap.md): en qué etapa está el proyecto, qué módulo
   sigue y las tareas.
3. [docs/project/glossary.md](docs/project/glossary.md): cómo se dice cada palabra del negocio en
   el código. Una palabra que no está, se agrega antes de usarla.
4. [docs/chapters/](docs/chapters/README.md): el `summary.md` del capítulo que vas a tocar; el
   `rules.md`, solo en la parte que vas a cambiar.
5. [docs/technical/architecture.md](docs/technical/architecture.md), los ADR y el diseño del
   módulo en `docs/technical/modules/`.

## Reglas que no se olvidan

- **Idiomas:** el código en inglés (variables, funciones, tipos, archivos, carpetas, tablas,
  columnas, rutas y parámetros de la API), también los nombres de archivos y carpetas de la
  documentación. El contenido de la documentación, los comentarios, los commits y los textos que
  ve la persona, en castellano.
- **La documentación vive en `docs/`, fuera de `src/`.** En `src/` solo documentación que ayude a
  entender el código.
- **Un módulo a la vez, entero:** reglas, pantallas, diseño técnico, código, pruebas y manual, en
  los nueve pasos de la constitución. No se programa sin las reglas, las pantallas y el diseño
  técnico aprobados por Carlos.
- **El analista de negocio pregunta todo.** Sin las preguntas, Carlos no puede describir bien el
  requerimiento: casos, bordes, errores y permisos, todas juntas y en tandas hasta que no quede
  nada sin respuesta.
- **Las pantallas salen del director de arte**, siempre tres versiones para que Carlos elija. La
  referencia actual es la v2, salvo la entrada, que se ve como la de la primera versión.
- **La primera versión (`ferre`) se usa solo para leer** y se va a borrar: la documentación no la
  nombra, salvo la [guía de migración](docs/project/migration-from-ferre.md), que dice cómo
  usarla. Todo lo de ahí se puede cuestionar y mejorar, y lo que se toma se confirma con Carlos.
- **El orden de autoridad:** reglas, maquetas, diseño técnico, pruebas y código. Las pruebas se
  escriben antes que el código y no se cambian para que el código pase.
- **Antes de subir, `pnpm check`.** Todo directo a `main`, sin ramas ni pull requests. En una
  sesión en la nube que arranca en una rama `claude/…`, se sube igual a `main`
  (`git push origin HEAD:main`).
- **Internet:** los sitios externos se consultan directamente, sin pedir permiso (decisión 4).

## Qué no decide el agente

El alcance, las fechas y las prioridades. Un requerimiento nuevo, o uno que cambia, se le
pregunta a Carlos. Si Carlos no contestó una pregunta, o la respuesta no quedó clara, se le
vuelve a preguntar: nada queda supuesto (decisión 30).
