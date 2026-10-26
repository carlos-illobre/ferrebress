# ADR-012: Hono, Kysely y Zod en el servidor

**Estado:** aceptado (2026-10-26, decisión 32)

## Contexto

El servidor necesita: atender HTTP (incluido SSE), hablar con PostgreSQL con tipos y sin
consultas escondidas, y validar lo que entra con la misma forma que usa la aplicación.

## Opciones

| Para | Opción | A favor | En contra |
|---|---|---|---|
| HTTP | **Hono** | Chico, rápido, usa `Request` y `Response` estándar, SSE incluido, sin magia | Menos complementos que Fastify |
| | Fastify | El más rápido de los grandes en Node, muy maduro | Más grande; su sistema de complementos agrega conceptos |
| | Express | El más conocido | Lento, sin tipos ni promesas de fábrica |
| Base | **Kysely** | Arma SQL con tipos, sin ORM: cada consulta se ve tal cual se ejecuta; funciona con PostgreSQL y con PGlite; migraciones simples | Las consultas complejas se escriben más largas que en SQL a mano |
| | SQL a mano con `pg` | Lo más directo | Sin tipos: un error en una columna aparece recién al correr |
| | Drizzle | Tipos y migraciones generadas | Mezcla esquema y consultas en su propio lenguaje |
| | Prisma | Muy cómodo para lo simple | ORM: esconde las consultas, genera N+1 sin avisar, motor pesado |
| Validar | **Zod 4 (`zod/mini`)** | El estándar; la forma mini se recorta y pesa poco en el navegador | Algo más grande que Valibot |
| | Valibot | El más chico | Menos conocido |

## Decisión

Hono para HTTP, Kysely con el controlador `pg` para PostgreSQL (y su dialecto de PGlite en las
pruebas), y Zod 4 en su forma `zod/mini` para los contratos de `src/shared/contracts`, que valida
el servidor y usa la aplicación.

## Consecuencias

- Hono y Kysely quedan solo en `routes.ts`, `data.ts` y `platform/`; `rules.ts` no los importa.
