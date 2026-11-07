# ADR-018: Los tipos de las tablas, generados desde las migraciones

**Estado:** propuesto

## Contexto

Kysely (ADR-012) necesita saber cómo es cada tabla para controlar las consultas. Hoy esa forma se
escribe dos veces, a mano: en la migración, que crea la tabla, y en el tipo del `data.ts` del
módulo, que la describe para TypeScript. Nada controla que las dos digan lo mismo. Si una
migración cambia una columna y el tipo no, el control de tipos sigue pasando y el error aparece
recién al correr.

Hoy son diez tablas en tres esquemas (`users`, `sign_in`, `device_link`). Comparadas con lo que
crean las migraciones, ninguna tiene una columna equivocada. Las diferencias son menores:

- cuatro columnas con valor por defecto en la base que el tipo obliga a mandar al insertar
  (`sign_in.sessions.way` e `is_phone`, `sign_in.passkeys.device_label`), y
- `device_link.pairings.paired_by`, que la base guarda como `text` y el tipo limita a
  `'button' | 'sign-in'`: ahí el tipo a mano es más preciso que la base.

Con el catálogo, el stock, las ventas y las compras, las tablas pasan a ser decenas, y la
diferencia entre la migración y el tipo se vuelve más probable.

## Opciones

| Opción | A favor | En contra |
|---|---|---|
| Seguir escribiendo los tipos a mano | Nada nuevo; el tipo puede ser más preciso que la base | La forma de cada tabla se escribe dos veces y nada controla que coincidan |
| **`kysely-codegen` sobre PGlite** | Una sola fuente: las migraciones. Corre en memoria, sin Docker (ADR-005), con el mismo PGlite de las pruebas; genera un archivo por esquema; `pnpm check` controla que esté al día | Una dependencia de desarrollo más; unos segundos más en `pnpm check`; lo que la base no sabe (una lista de valores en una columna `text`) se declara aparte |
| `kysely-codegen` sobre el PostgreSQL del compose | Lee la base real | Necesita Docker levantado para generar y para controlar, en contra de ADR-005 |
| Pasar a Drizzle | El esquema en TypeScript da los tipos y las migraciones | Reescribir todas las migraciones y consultas; las migraciones generadas hay que revisarlas una por una; ya descartado en ADR-012 |

## Decisión propuesta

Los tipos de las tablas de PostgreSQL se generan con `kysely-codegen` (dependencia de desarrollo),
usando su API sobre un PGlite en memoria:

1. **`pnpm db:types`** abre un PGlite, corre las migraciones de todos los módulos con el mismo
   `migrate` del servidor y escribe, por cada esquema, `src/server/modules/<module>/tables.generated.ts`,
   solo con las tablas de ese esquema y sin las de migraciones.
2. **El `data.ts` de cada módulo** toma sus tipos de ahí. Si una parte del módulo ve solo algunas
   tablas, las elige con `Pick`, como hoy elige al declararlas.
3. **Lo que la base no sabe** (como los valores de `paired_by`) se declara en la configuración
   de la generación (`overrides`), no en el archivo generado, que nunca se edita a mano.
4. **`pnpm check` controla que estén al día:** vuelve a generar en memoria y falla si el resultado
   no coincide con lo que está en el repositorio. Una migración nueva sin `pnpm db:types` no pasa.

## Consecuencias

- La forma de una tabla se escribe una sola vez, en su migración.
- Los tipos generados usan `Buffer` donde hoy dice `Uint8Array` (`Buffer` lo extiende, así que lo
  que ya funciona sigue igual), aceptan texto además de `Date` al guardar una fecha, y muestran el
  `bigint` como texto (`counter` de las llaves, que ya se convierte con `Number`).
- La auditoría queda afuera: está en SQLite (ADR-004) y no usa Kysely.
- Los límites entre módulos no cambian: cada módulo solo tiene el archivo de su esquema.
