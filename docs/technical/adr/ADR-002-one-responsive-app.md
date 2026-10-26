# ADR-002: Una sola aplicación, una pantalla para el celular y la computadora

**Estado:** aceptado (2026-10-26, decisión 173)

## Contexto

En `ferre` el celular y la computadora terminaron siendo dos aplicaciones paralelas: 68 archivos
con el mismo nombre en las dos carpetas, cada una con su lógica, sus llamadas y sus estilos. Un
arreglo en una no llegaba a la otra, y «Vender» quedó repartido en unos 190 archivos. Además, los
límites de 150 líneas por archivo y 40 por función partieron todo en 839 archivos chicos.

La funcionalidad es la misma en los dos; cambia la disposición. Las maquetas v2 lo muestran: la
barra lateral pasa a barra inferior, la columna de cobro pasa a quedar fija abajo, las tarjetas
de los renglones son las mismas.

## Decisión

- **Una sola pantalla por funcionalidad**, en HTML semántico (`nav`, `main`, `section`, `ol`,
  `form`, `output`), con un CSS al lado que la acomoda con media queries. Un solo corte de ancho
  para todo el sistema.
- **La lógica no sabe de dispositivos.** Lo que cambia por capacidad (cámara, huella, Bluetooth)
  sale de detectar esa capacidad, no del ancho.
- **La estética vive en CSS.** Las pantallas no llevan estilos en línea ni nombres de clase de
  apariencia; usan los tokens del lenguaje visual (`styles/`) y las piezas de `ui/`. Cambiar el
  aspecto es tocar CSS.
- **Organizada por módulo**, con React y Vite como PWA. Cada módulo se baja recién cuando se abre.
- **Las acciones con nombre pasan por un solo punto** (ver [arquitectura](../architecture.md)), que
  usan el espejo, el teclado y la cola sin conexión.
- **La entrada** es una sola pantalla con piezas; las opciones que muestra dependen de las
  capacidades del dispositivo y los adornos de cada ancho los elige el CSS. Se ve como la de
  `ferre`.

## Opciones descartadas

- **Dos juegos de pantallas (ADR-014 de `ferre`):** la duplicación de arriba.
- **Lógica compartida y dibujo separado por dispositivo:** mejor que lo anterior, pero sigue
  duplicando el HTML y la lista de componentes, y las maquetas muestran que no hace falta.
- **CSS Modules o CSS en JavaScript:** atan el estilo al componente. Un CSS por pantalla, con
  `@layer` y nombres de clase por pieza, deja cambiar la estética sin abrir el TSX.
- **Límites duros de tamaño:** los límites quedan como aviso; ninguna pieza se parte solo para
  cumplir un número.

## Consecuencias

- Un arreglo vale para los dos dispositivos.
- Si alguna pantalla necesitara un contenido distinto en el celular, se resuelve en esa pantalla
  con dos piezas y CSS; si eso se repite, se revisa este ADR.
- Las pruebas de punta a punta corren cada camino en los dos anchos.
