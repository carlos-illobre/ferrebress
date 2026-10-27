# ADR-002: Una sola aplicación, una pantalla para el celular y la computadora

**Estado:** aceptado

## Contexto

La aplicación se usa en el celular y en la computadora. Hacer una aplicación para cada uno lleva a
dos aplicaciones paralelas, cada una con su lógica, sus llamadas y sus estilos: un arreglo en una
no llega a la otra, y una misma funcionalidad queda repartida en el doble de archivos. Y los
límites estrictos de tamaño por archivo y por función parten el código en cientos de piezas
chicas, difíciles de recorrer.

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
- **Organizada por módulo**, con Preact y Vite como PWA (ADR-013). Cada módulo se baja recién cuando se abre.
- **Las acciones con nombre pasan por un solo punto** (ver [arquitectura](../architecture.md)), que
  usan el espejo, el teclado y la cola sin conexión.
- **La entrada** es una sola pantalla con piezas; las opciones que muestra dependen de las
  capacidades del dispositivo y los adornos de cada ancho los elige el CSS. Se ve como su maqueta
  aprobada (`docs/design/mockups/sign-in/adapted/`).

## Opciones descartadas

- **Dos juegos de pantallas, uno por dispositivo:** la duplicación de arriba.
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
