# ADR-005: Pruebas rápidas, sin Docker y con cobertura total

**Estado:** aceptado

## Contexto

Las pruebas sirven para refactorizar sin riesgo y para que no sobren líneas: una línea que no
necesita ninguna prueba, no hace falta. Tienen que correr rápido y probar toda la funcionalidad.
El código de las pruebas y el de producción tiene que ser el mismo.

Probar la capa de datos contra un PostgreSQL en Docker obliga a tener Docker para correr las
unitarias y tarda en arrancar; levantar el sistema completo para cada prueba la vuelve lenta.

## Decisión

- **PGlite para la base de las pruebas:** PostgreSQL de verdad, compilado para correr dentro del
  mismo proceso. No necesita Docker y cada archivo de pruebas parte de una base limpia: crear una
  de cero tarda unos 2 segundos, así que se crea una sola vez antes de las pruebas y cada archivo
  arranca la suya copiándola, en menos de medio segundo; después corre sus migraciones. Las consultas son las mismas que en
  producción; lo único que cambia es la cadena de conexión del `.env`
  (`DATABASE_URL=memory://`), que `platform/storage/db` resuelve en un solo lugar.
- **La auditoría en memoria** de la misma forma (ADR-004).
- **Vitest**, con `happy-dom` y Testing Library para las pantallas.
- **Cobertura del 100 % de líneas y ramas**, en `pnpm check`. La única excepción es una lista
  corta de archivos de `platform/` que solo hablan con el hardware del navegador (cámara, huella,
  WebRTC); se prueban de punta a punta.
- **Pruebas que cuentan las consultas:** cada pedido importante tiene una prueba que comprueba
  cuántas consultas hace, para que no aparezcan consultas dentro de un bucle.
- **Meta:** todas las unitarias en menos de 30 segundos.
- **De punta a punta, con Playwright,** pocas: los caminos principales y lo que una unitaria no
  puede probar, cada uno en el ancho donde pasa, armadas para tardar lo mínimo. Corren antes de
  cerrar un módulo, no en cada subida.
- **Pruebas de captura** de las pantallas que Carlos aprueba como definitivas: cada una se compara
  punto por punto con su captura de referencia, en cada subida. Se sacan y se comparan siempre en
  la imagen de Playwright de Docker, para que el dibujo de las letras no cambie entre máquinas.

## Opciones descartadas

- **PostgreSQL en Docker:** el mismo motor, pero más lento de arrancar y obliga a tener Docker
  para correr las unitarias.
- **Datos falsos en lugar de la base:** rápidas, pero no prueban las consultas.
- **Cobertura del 90 o 95 %:** nadie sabe cuál es la parte aceptable sin cubrir; con 100 % la
  regla es binaria.

## Consecuencias

- PGlite corre la misma versión mayor de PostgreSQL que producción; si alguna extensión de
  producción no existe en PGlite, se revisa este ADR antes de usarla.
