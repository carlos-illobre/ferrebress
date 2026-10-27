# ADR-008: TypeScript sobre Node, con pnpm

**Estado:** aceptado

## Contexto

El sistema tiene un servidor y una aplicación de navegador que comparten reglas (el cálculo del
precio, la forma de la API). La prioridad es la simpleza, después la performance, después no
repetir código.

## Opciones

| Opción | A favor | En contra |
|---|---|---|
| **TypeScript en el servidor y en el navegador** | Un solo lenguaje; el cálculo de precios y los contratos se escriben una vez y los usan los dos; tipos que atrapan errores antes de correr | Más lento que Go o Rust en cálculo puro (acá no pesa: el trabajo es esperar la base y la red) |
| Go o Rust en el servidor + TypeScript en el navegador | Más rápidos y con menos memoria | Dos lenguajes: el precio y los contratos se escriben dos veces, justo lo que se quiere evitar |
| Python en el servidor | Buenas bibliotecas de planillas | Dos lenguajes; las planillas también se leen bien en TypeScript |

| Motor | A favor | En contra |
|---|---|---|
| **Node, versión LTS** | El más maduro; trae SQLite (`node:sqlite`), `fetch`, pruebas y compresión sin dependencias | Arranca algo más lento que Bun |
| Bun | Más rápido; trae SQLite estable | Menos maduro; algunas diferencias con Node que aparecen en producción |
| Deno | Seguro por defecto; trae TypeScript | Menos bibliotecas compatibles sin ajustes |

| Gestor de paquetes | A favor | En contra |
|---|---|---|
| **pnpm** | Rápido, ocupa poco disco, workspaces para `shared/`, `server/` y `app/` con un solo lockfile | Una herramienta más que instalar |
| npm | Viene con Node | Más lento y más pesado en disco |

## Decisión

TypeScript estricto en todo el código, Node en su versión LTS (hoy la 24; se pasa a la 26 cuando
sea LTS) y pnpm con un workspace.

## Consecuencias

- `node:sqlite` todavía está como «release candidate» en Node. Queda detrás de `platform/audit`
  (ADR-004); si cambiara, se reemplaza por `better-sqlite3` sin tocar a quien lo usa.
