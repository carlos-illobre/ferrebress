# ADR-022: Buscar en el catálogo con un índice en la memoria del servidor

**Estado:** aceptado

## Contexto

07 · R3 pide buscar entre hasta 100.000 productos en menos de 100 ms, por palabras en cualquier orden,
empezadas («torn» encuentra «tornillo»), sin acentos ni mayúsculas, con un error de tipeo, y con el
código escrito entero primero, aunque tenga signos. Es lo que más se va a usar en el mostrador.

## Opciones comparadas

| Opción | Palabras empezadas | Un error de tipeo | 100.000 en < 100 ms | En contra |
|---|---|---|---|---|
| `like '%…%'` en PostgreSQL | Sí | No | No: recorre la tabla | No cumple R3.1 ni la meta |
| Búsqueda de texto de PostgreSQL (`tsvector`) | Con `:*` | No | Sí, con índice | Sin errores de tipeo; el diccionario en castellano corta las palabras («tornillos» → «tornill») |
| `tsvector` con el diccionario `simple` y `unaccent`, más `pg_trgm` sobre un vocabulario de palabras | Con `:*` | Sí: se busca la palabra parecida en el vocabulario y se vuelve a buscar | Probable, con dos consultas | Dos extensiones que activar en la base y en las pruebas; el orden de R3.2 se arma con `case` en SQL; cada letra es una consulta; no sirve sin conexión en el celular (R3.3) |
| `pg_trgm` (trigramas) | Regular: las palabras cortas dan poca similitud | Sí, por similitud | Sí, con índice GIN | El orden por similitud no es el que se pide (código primero, sin error antes que con error); hay que activar la extensión en la base y en las pruebas |
| **Un índice en la memoria del servidor** | Sí, con un arreglo ordenado de palabras | Sí: las palabras a una letra de distancia | Sí: unos ms | Ocupa memoria (unos 30 MB) y se arma al arrancar; con varias copias del servidor, cada una el suyo |
| Un motor aparte (Meilisearch, Typesense) | Sí | Sí | Sí | Otra pieza que desplegar, cuidar y respaldar, para una ferretería de barrio |

## Decisión

**Un índice en la memoria del servidor**, en `src/shared/search/` (sin nada del servidor, para que en
15b sirva también en el celular sin conexión): de cada producto que no está dado de baja, las palabras
de su descripción y su marca sin acentos ni mayúsculas, y sus códigos (del proveedor y de barras) sin
signos, en un mapa aparte, con su marca y si tiene precio para los filtros. Las palabras van en un
vocabulario ordenado, cada una con la lista ordenada de sus productos: una palabra empezada es una
búsqueda binaria; un error de tipeo, solo en palabras enteras de 4 letras o más, las del largo ±1 a una
letra de distancia; como mucho 8 palabras. Contesta los identificadores en el orden de 07 · R3.2, el
resultado queda 1 minuto por sesión para las páginas siguientes, y la página de 50 sale de la base por
clave. Los dados de baja se listan desde la base.

Se arma al arrancar con una consulta y se pone al día al confirmar cada transacción que cambia
productos, con lo que devuelve la fachada del catálogo; si eso falla, se vuelve a armar. El tope de
200.000 productos activos (07 · R3.5) acota la memoria.

## Consecuencias

- La búsqueda no consulta la base por cada letra: lo único que va a la base es la página.
- El orden es exactamente el que piden las reglas, sin depender de cómo puntúa una extensión.
- Unos 42 MB de memoria con 100.000 productos (unos 85 MB con el tope), medidos, y menos de 2 s al
  arrancar. Las listas de cada palabra van en un solo arreglo plano: una por palabra pesaba más.
- Con varias copias del servidor, cada una tiene su índice y se pone al día con lo que confirma; la
  arquitectura lo suma a «Escala»: un cambio en una copia tendría que avisar a las demás.
- Si un día la meta no se cumple o la memoria no alcanza, se cambia el índice detrás de la misma
  función sin tocar las rutas.
