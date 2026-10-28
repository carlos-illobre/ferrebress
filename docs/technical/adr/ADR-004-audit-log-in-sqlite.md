# ADR-004: La auditoría en SQLite, aparte de PostgreSQL

**Estado:** aceptado

## Contexto

PostgreSQL guarda solo el estado actual, lo más chico posible, para que sea rápido y sus copias
livianas. La historia de todo (quién hizo qué, cómo era una venta antes de corregirla, de dónde
sale un stock, el historial de precios) va a la auditoría. La auditoría solo recibe filas, nunca
se modifica, va a crecer mucho y no necesita garantías de transacción.

Se consulta de cuatro formas: lo último, de a 10; por fecha; por persona y tipo; y por un dato (un
producto, una venta) a lo largo de los años. Volumen esperado: unos 2.000 eventos por día hoy;
hasta 30 veces más con 100 personas.

## Opciones comparadas

| Opción | Escribir | Consultar por un dato | Disco por año (hoy) | En contra |
|---|---|---|---|---|
| Archivos de texto (JSONL), comprimidos por día | El más rápido | Recorre todos los archivos: segundos | ~30 MB | Sin índices; habría que inventarlos |
| **SQLite** (viene con Node) | Rápido, por tandas | Milisegundos, con índice | ~100 MB, con el contenido comprimido | Un solo proceso escribe |
| DuckDB o Parquet (por columnas) | Malo de a una fila; necesita tandas grandes | Rápido | ~20 MB | Dependencia de unos 40 MB; pensado para análisis, no para un registro |
| Clave-valor (LMDB, RocksDB) | Muy rápido | Rápido si se arman los índices a mano | ~150 MB | Índices a mano y dependencia nativa |
| Una tabla en PostgreSQL | Rápido | Rápido | Grande | Agranda la base y sus copias, justo lo que se quiere evitar |

## Decisión

SQLite, con el módulo `node:sqlite` que trae Node (sin dependencias), detrás de una interfaz en
`platform/storage/audit`:

- **Un archivo por año**, que se archiva o se borra entero.
- **Columnas compactas:** la fecha como número, el tipo y la persona como enteros, el dato
  afectado como columna con índice, y el contenido (antes y después) comprimido con la compresión
  que trae Node.
- **Índices** por fecha, por persona y fecha, por tipo y fecha, y por dato afectado y fecha.
- **Escrito por tandas:** los eventos se juntan en memoria y se escriben juntos una vez por
  segundo (o cada 100), en una sola transacción, con el modo WAL.
- **Después de confirmar:** el evento se escribe cuando PostgreSQL confirmó el cambio. Si el
  servidor se cae justo entre las dos cosas, se puede perder hasta un segundo de auditoría.
- **En las pruebas,** el mismo código con un archivo en memoria (`AUDIT_PATH=:memory:` en el
  `.env`).

Entre las opciones, es la que mejor equilibra velocidad, espacio y simpleza. Los archivos de texto
ganan en espacio, pero vuelven lenta la consulta por un dato, que es la que más usa la aplicación.

## Consecuencias

- La copia de la auditoría es aparte de la de la base: archivos que no cambian, salvo el del año
  en curso.
- Un solo proceso escribe. Con varias copias del servidor, una sola escribe la auditoría y las
  demás le mandan sus eventos.
- Para analizar los datos en el futuro (rotación, combos), DuckDB es la mejor herramienta: lee la
  auditoría, no la reemplaza.
