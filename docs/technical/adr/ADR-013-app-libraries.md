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
| Códigos de barras | **`BarcodeDetector` del navegador**, con ZXing de respaldo | En Chrome de Android viene incluido: rápido y sin peso; ZXing solo se baja donde falta | Dos caminos que probar |
| Guardado local | **IndexedDB con `idb`** (1 KB) | Promesas en lugar de eventos; casi sin peso | — |

## Decisión

Preact con hooks, Vite, PWA con Workbox, CSS común, `BarcodeDetector` con ZXing de respaldo e
IndexedDB con `idb` (solo si el dispositivo trabaja sin conexión, ADR-007). Las pruebas de las
pantallas usan Testing Library en su versión para Preact (ADR-005).

## Consecuencias

- Pasar a React, si alguna vez hiciera falta, es cambiar las importaciones: la forma de escribir
  es la misma.
