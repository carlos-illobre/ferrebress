# ADR-005: Pruebas rápidas, sin Docker y con cobertura total

**Estado:** aceptado (2026-10-26, decisión 175)

## Contexto

Las pruebas sirven para refactorizar sin riesgo y para que no sobren líneas: una línea que no
necesita ninguna prueba, no hace falta. Tienen que correr rápido y probar toda la funcionalidad.
El código de las pruebas y el de producción tiene que ser el mismo.

En `ferre` las pruebas de la capa de datos necesitaban Docker con PostgreSQL, que tarda en
arrancar, y las de punta a punta levantaban dos stacks completos.

## Decisión

- **PGlite para la base de las pruebas:** PostgreSQL de verdad, compilado para correr dentro del
  mismo proceso. No necesita Docker, arranca en menos de un segundo y cada archivo de pruebas
  parte de una base limpia, copiada de una ya migrada. Las consultas son las mismas que en
  producción; lo único que cambia es la cadena de conexión del `.env`
  (`DATABASE_URL=memory://`), que `platform/db` resuelve en un solo lugar.
- **La auditoría en memoria** de la misma forma (ADR-004).
- **Vitest**, con `happy-dom` y Testing Library para las pantallas.
- **Cobertura del 100 % de líneas y ramas**, en `pnpm check`. La única excepción es una lista
  corta de archivos de `platform/` que solo hablan con el hardware del navegador (cámara, huella,
  WebRTC); se prueban de punta a punta.
- **Pruebas que cuentan las consultas:** cada pedido importante tiene una prueba que comprueba
  cuántas consultas hace, para que no aparezcan consultas dentro de un bucle.
- **Meta:** todas las unitarias en menos de 30 segundos.
- **De punta a punta, con Playwright,** pocas: los caminos principales, en los dos anchos. Corren
  antes de cerrar un módulo, no en cada subida.

## Opciones descartadas

- **PostgreSQL en Docker:** el mismo motor, pero más lento de arrancar y obliga a tener Docker
  para correr las unitarias.
- **Datos falsos en lugar de la base:** rápidas, pero no prueban las consultas.
- **Cobertura del 90 o 95 %:** nadie sabe cuál es la parte aceptable sin cubrir; con 100 % la
  regla es binaria.

## Consecuencias

- PGlite corre la misma versión mayor de PostgreSQL que producción; si alguna extensión de
  producción no existe en PGlite, se revisa este ADR antes de usarla.
