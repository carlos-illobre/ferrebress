# ADR-013: Preact, Vite y CSS sin herramientas en la aplicación

**Estado:** aceptado

## Contexto

La aplicación corre en una notebook vieja y en un celular Android. Tiene que abrir rápido, andar
como una aplicación instalada, leer códigos de barras con la cámara y dejar cambiar la estética
tocando solo CSS (ADR-002).

## Opciones

| Para | Opción | A favor | En contra |
|---|---|---|---|
| Pantallas | **Preact** | La misma forma de trabajar que React (componentes y hooks) en unos 4 KB en lugar de unos 60 KB: menos para bajar y procesar en la notebook vieja | Menos bibliotecas propias; las de React andan con `preact/compat` |
| | React | El más usado; más bibliotecas | Unos 60 KB más que procesar en cada arranque |
| | Svelte o Solid | Muy rápidos y chicos | Otra forma de escribir; cambia más que Preact si algún día se quiere volver a React |
| | Sin biblioteca | Lo más liviano | Hay que inventar cómo actualizar la pantalla: más código propio |
| Armado | **Vite** | Rápido, divide el código por módulo para bajarlo recién al abrirlo, soporte de PWA | — |
| Instalable | **PWA con Workbox** (vía `vite-plugin-pwa`) | Se instala desde el navegador, sin tienda; la aplicación queda guardada y abre sin red | El aviso de versión nueva hay que manejarlo (ADR-003) |
| Estilos | **CSS común**, con `@layer` y variables | Cambiar la estética es tocar CSS; nada que aprender ni compilar | Hay que cuidar los nombres de clase (una regla: el nombre de la pieza) |
| | CSS Modules, Tailwind, CSS en JS | Aíslan estilos | Atan el estilo al componente o al HTML; cambiar la estética obliga a tocar el TSX |
| Piezas | **Propias**, en `src/app/ui/`, con el lenguaje «Mostrador» | Tienen el aspecto que eligió Carlos y la misma forma en el celular y en la computadora; usan el teclado y los diálogos de la aplicación | Las difíciles (autocompletar, menús, tablas largas) hay que hacerlas, siguiendo las guías de accesibilidad del W3C (WAI-ARIA Authoring Practices) |
| | shadcn/ui | Piezas difíciles ya resueltas en foco, teclado y lectores de pantalla (con Radix), y el código queda en el repositorio | Su aspecto son clases de Tailwind en cada TSX, descartadas arriba; es para React y con Preact necesita `preact/compat`, más peso en el arranque; su estilo no es «Mostrador» y habría que rehacerlo pieza por pieza; su manejo del foco y de Escape pelea con las capas de teclado y los diálogos propios; dos juegos de piezas a la vez |
| Códigos de barras | **`BarcodeDetector` del navegador**, con ZXing de respaldo | En Chrome de Android viene incluido: rápido y sin peso; ZXing solo se baja donde falta | Dos caminos que probar |
| Guardado local | **IndexedDB con `idb`** (1 KB) | Promesas en lugar de eventos; casi sin peso | — |

## Decisión

Preact con hooks, Vite, PWA con Workbox, CSS común, piezas propias, `BarcodeDetector` con ZXing de respaldo e
IndexedDB con `idb` (solo si el dispositivo trabaja sin conexión, ADR-007). Las pruebas de las
pantallas usan Testing Library en su versión para Preact (ADR-005).

## Consecuencias

- Pasar a React, si alguna vez hiciera falta, es cambiar las importaciones: la forma de escribir
  es la misma.
- Una pieza difícil que no existe se hace propia; el comportamiento de Radix o de shadcn/ui sirve
  de referencia de qué teclas, qué foco y qué anuncia, sin instalarlos.
