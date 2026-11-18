# ADR-022: Buscar en el catálogo con un índice en la memoria del servidor

**Estado:** propuesto

## Contexto

07 · R3 pide buscar entre hasta 100.000 productos en menos de 100 ms, por palabras en cualquier orden,
empezadas («torn» encuentra «tornillo»), sin acentos ni mayúsculas, con un error de tipeo, y con el
código escrito entero primero, aunque tenga signos. Es lo que más se va a usar en el mostrador.

## Opciones comparadas

| Opción | Palabras empezadas | Un error de tipeo | 100.000 en < 100 ms | En contra |
|---|---|---|---|---|
| `like '%…%'` en PostgreSQL | Sí | No | No: recorre la tabla | No cumple R3.1 ni la meta |
| Búsqueda de texto de PostgreSQL (`tsvector`) | Con `:*` | No | Sí, con índice | Sin errores de tipeo; el diccionario en castellano corta las palabras («tornillos» → «tornill») |
| `pg_trgm` (trigramas) | Regular: las palabras cortas dan poca similitud | Sí, por similitud | Sí, con índice GIN | El orden por similitud no es el que se pide (código primero, sin error antes que con error); hay que activar la extensión en la base y en las pruebas |
| **Un índice en la memoria del servidor** | Sí, con un arreglo ordenado de palabras | Sí: las palabras a una letra de distancia | Sí: unos ms | Ocupa memoria (unos 30 MB) y se arma al arrancar; con varias copias del servidor, cada una el suyo |
| Un motor aparte (Meilisearch, Typesense) | Sí | Sí | Sí | Otra pieza que desplegar, cuidar y respaldar, para una ferretería de barrio |

## Decisión

**Un índice en la memoria del servidor**, en `catalog/search/`: de cada producto, las palabras de su
descripción y su marca sin acentos ni mayúsculas, y sus códigos (del proveedor y de barras) sin
signos, con su marca, si tiene precio y si está dado de baja para los filtros. Las palabras van en un
arreglo ordenado: una palabra empezada es una búsqueda binaria; un error de tipeo, las del mismo largo
±1 a una letra de distancia. Contesta los identificadores en el orden de 07 · R3.2, y la página de 50
sale de la base por clave.

Se arma al arrancar con una consulta y se pone al día al confirmar cada transacción que cambia
productos, con lo que devuelve la fachada del catálogo.

## Consecuencias

- La búsqueda no consulta la base por cada letra: lo único que va a la base es la página.
- El orden es exactamente el que piden las reglas, sin depender de cómo puntúa una extensión.
- Unos 30 MB de memoria con 100.000 productos y unos 2 s al arrancar.
- Con varias copias del servidor, cada una tiene su índice y se pone al día con lo que confirma; la
  arquitectura lo suma a «Escala»: un cambio en una copia tendría que avisar a las demás.
- Si un día la meta no se cumple o la memoria no alcanza, se cambia el índice detrás de la misma
  función sin tocar las rutas.
