# Ferrebress

Sistema de gestión de una ferretería de barrio: catálogo y precios, ventas, clientes, compras y
stock, los números del negocio, personas y permisos, quién hizo qué, mejoras y errores, y los
procesos del local. Se usa en la computadora y en el celular, que puede trabajar como lector y
control remoto de la computadora.

**La documentación manda; el código es secundario.** Todo lo que hace falta para entender el
negocio y reconstruir el sistema está en [`docs/`](docs/). El código está en `src/` y puede
rehacerse desde la documentación: si se borra `src/`, no se pierde ninguna regla ni ningún diseño.

## Índice

| Dónde | Qué tiene |
|---|---|
| [docs/project/constitution.md](docs/project/constitution.md) | Lo que no se negocia y cómo se trabaja. **Se lee antes de tocar nada** |
| [docs/project/glossary.md](docs/project/glossary.md) | Las palabras del negocio y cómo se dicen en el código |
| [docs/project/roadmap.md](docs/project/roadmap.md) | Las etapas, el orden de los módulos y las tareas |
| [docs/chapters/](docs/chapters/README.md) | Un capítulo por módulo: sus reglas, sus pantallas y la historia de sus cambios |
| [docs/design/](docs/design/README.md) | El lenguaje visual y las maquetas de cada pantalla |
| [docs/technical/](docs/technical/architecture.md) | La arquitectura, las decisiones técnicas (ADR) y el diseño de cada módulo |
| `src/shared/` | Lo que usan el servidor y la aplicación: precios, dinero, contratos de la API |
| `src/server/` | El servidor: un proceso, un módulo por capítulo |
| `src/app/` | La aplicación, una sola para el celular y la computadora |

## De dónde viene

Ferrebress se rehace desde cero a partir de una primera versión, con la documentación ordenada
por capítulos, un solo servidor y una sola aplicación partidos en los mismos módulos. Mientras
dure la migración, cómo se usa la primera versión está en la
[guía de migración](docs/project/migration-from-ferre.md).
