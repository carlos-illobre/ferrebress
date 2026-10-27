# ADR-009: PostgreSQL para el estado actual

**Estado:** aceptado

## Contexto

La base guarda el estado actual: productos, precios, ventas, stock, personas. Hoy son tres
personas; a futuro, hasta 100 en una instalación. La búsqueda de productos tiene que
responder en menos de 100 ms con más de 100.000 artículos, tolerando errores de tipeo. La historia
va aparte, en la auditoría (ADR-004).

## Opciones

| Opción | A favor | En contra |
|---|---|---|
| **PostgreSQL** | Muchas escrituras a la vez sin bloquearse; búsqueda por parecido (`pg_trgm`) y de texto completo; permite varias copias del servidor contra la misma base; `LISTEN/NOTIFY` para avisos entre copias; copias con `pg_dump`; las pruebas corren con el mismo motor en PGlite (ADR-005) | Un contenedor más, unos 100 MB de memoria; las copias necesitan un volcado |
| SQLite también para el estado actual | Sin servidor: un archivo; copias triviales; muy rápido para una sola copia del servidor | Un solo escritor a la vez; no admite varias copias del servidor, que la escala de 100 personas podría pedir; búsqueda por parecido más limitada |
| MySQL o MariaDB | Conocidos y rápidos | Sin una versión dentro del proceso para las pruebas; búsqueda por parecido más pobre |
| MongoDB u otra base de documentos | Esquema flexible | Los datos son relaciones (venta, renglón, producto, proveedor) y las transacciones entre documentos son más torpes |

## Decisión

PostgreSQL, una base con un esquema por módulo (ADR-001), la misma versión mayor en producción y
en PGlite. Solo el estado actual: lo que deja de valer se borra, y las tablas se diseñan chicas
(tipos justos, sin columnas de historia).

## Consecuencias

- SQLite para todo era una opción seria para tres personas: se descartó por la escala futura y
  por la búsqueda. Si la escala nunca llega, la decisión igual no cuesta más que un contenedor.
- Cada módulo declara sus índices en su diseño técnico, con la consulta que los justifica.
