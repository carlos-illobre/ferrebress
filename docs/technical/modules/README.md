# Diseño técnico de cada módulo

Un archivo por módulo, `<module>.md`, que escribe el arquitecto en el paso 3 y aprueba Carlos en
el paso 5 (constitución, «Los nueve pasos»). Junto a él quedan las dos revisiones independientes:
`<module>-design-review.md` y `<module>-code-review.md`.

Si se borra `src/`, con este diseño y el capítulo se reconstruye el módulo igual.

## Qué tiene cada diseño

1. **Qué resuelve:** el capítulo que implementa y sus escenarios.
2. **Entidades:** tablas de su esquema, con sus columnas y sus índices, y por qué cada índice.
3. **API:** cada ruta, qué recibe, qué devuelve, qué permiso pide y qué errores da.
4. **Eventos:** qué publica (y su texto para la auditoría) y qué escucha.
5. **Conexiones:** qué usa de `realtime` y en qué forma.
6. **Sin conexión:** qué baja y qué acciones puede encolar, si aplica.
7. **Pantallas:** las piezas de cada pantalla y las acciones con nombre.
8. **Seguridad:** qué datos toca, quién puede hacer cada cosa, qué entra de afuera y cómo se
   valida, qué secretos usa y qué queda en la auditoría.
9. **Metas de performance:** consultas por pedido, milisegundos, bytes que baja.
10. **Tareas:** en orden, con sus dependencias.
