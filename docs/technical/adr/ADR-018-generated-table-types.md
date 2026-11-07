# ADR-018: Los tipos de las tablas, generados desde las migraciones

**Estado:** aceptado

## Contexto

Kysely (ADR-012) necesita saber cómo es cada tabla para controlar las consultas. Escrita a mano en
el `data.ts` de cada módulo, la forma de una tabla queda dos veces: en la migración, que la crea,
y en el tipo, que la describe para TypeScript. Nada controla que las dos digan lo mismo: si una
migración cambia una columna y el tipo no, el control de tipos sigue pasando y el error aparece
recién al correr. Con cada módulo nuevo hay más tablas, y esa diferencia se vuelve más probable.

## Opciones

| Opción | A favor | En contra |
|---|---|---|
| Seguir escribiendo los tipos a mano | Nada nuevo; el tipo puede ser más preciso que la base | La forma de cada tabla se escribe dos veces y nada controla que coincidan |
| **`kysely-codegen` sobre PGlite** | Una sola fuente: las migraciones. Corre en memoria, sin Docker (ADR-005), con el mismo PGlite de las pruebas; genera un archivo por esquema; `pnpm check` controla que esté al día | Una dependencia de desarrollo más; unos segundos más en `pnpm check`; lo que la base no sabe (una lista de valores en una columna `text`) se declara aparte |
| `kysely-codegen` sobre el PostgreSQL del compose | Lee la base real | Necesita Docker levantado para generar y para controlar, en contra de ADR-005 |
| Pasar a Drizzle | El esquema en TypeScript da los tipos y las migraciones | Reescribir todas las migraciones y consultas; las migraciones generadas hay que revisarlas una por una; ya descartado en ADR-012 |

## Decisión

Los tipos de las tablas de PostgreSQL se generan con `kysely-codegen` (dependencia de desarrollo
del servidor), usando su API sobre un PGlite en memoria:

1. **`pnpm db:types`** abre un PGlite, corre las migraciones de todos los módulos con el mismo
   `migrate` del servidor y escribe, por cada esquema, `src/server/modules/<module>/tables.generated.ts`,
   solo con las tablas de ese esquema y sin las de migraciones. Lo hacen
   `src/server/table-types.ts` y su entrada, `src/server/db-types.ts`.
2. **El `data.ts` de cada módulo** toma sus tipos de ahí y elige con `Pick` las tablas que usa.
3. **Lo que la base no sabe** (como los valores de `device_link.pairings.paired_by`) se declara en
   `table-types.ts`, no en el archivo generado, que nunca se edita a mano. `bytea` se lee como
   `Uint8Array`, que es lo que da PGlite (`pg` da `Buffer`, que lo extiende).
4. **`pnpm check` controla que estén al día** (`pnpm db:types:check`, el primero de todos): vuelve
   a generar en memoria y falla si el resultado no coincide con lo que está en el repositorio. Una
   migración nueva sin `pnpm db:types` no pasa.
5. **Biome y jscpd no miran los archivos generados:** el formato es el de `kysely-codegen`, y las
   definiciones comunes (`Generated`, `Timestamp`) se repiten en cada uno.

## Consecuencias

- La forma de una tabla se escribe una sola vez, en su migración.
- Los tipos generados aceptan texto además de `Date` al guardar una fecha, muestran el `bigint`
  como texto (`counter` de las llaves, que ya se convierte con `Number`) y marcan como opcionales
  al insertar las columnas que tienen valor por defecto en la base.
- Generar y controlar suma unos 3 s a `pnpm check`.
- La auditoría queda afuera: está en SQLite (ADR-004) y no usa Kysely.
- Los límites entre módulos no cambian: cada módulo solo tiene el archivo de su esquema.
