# ADR-020: Lo transversal, en capas enchufables

**Estado:** aceptado

## Contexto

Hay funcionalidades que no son el negocio de ningún módulo pero atraviesan a todos: el teclado
(los atajos y la navegación), trabajar sin conexión, el vínculo entre el celular y la computadora
con su espejo. En la programación orientada a aspectos se llaman preocupaciones transversales.

Repartidas dentro de los módulos y de la plataforma, se mezclan con el negocio: para entender cómo
se guarda una persona hay que leer también cómo se encola sin conexión, y para cambiar cómo se
trabaja sin conexión hay que tocar módulos que no tienen nada que ver. Carlos quiere cada una en
sus propios archivos, para entender mejor la aplicación y bajar el acoplamiento, y, si se puede,
que sirvan para otro proyecto con otras reglas de negocio.

## Decisión

**Cada funcionalidad transversal es una capa enchufable, en su propia carpeta.**

- **Obligatorio: sus archivos aparte y el acoplamiento bajo.** Todo lo de una capa vive en su
  carpeta (`src/app/<layer>/` y, si tiene parte en el servidor, `src/server/<layer>/`). Lo que la
  capa necesita saber de un módulo (qué comandos se pueden hacer sin conexión, qué atajos tiene una
  pantalla) también es parte de la capa: va en una carpeta con el nombre de la capa dentro del
  módulo (`modules/<module>/<layer>/`), no mezclado con su lógica.
- **El núcleo ofrece puntos de enganche con nombre** y no conoce las capas: «cómo se manda un
  comando al servidor», «qué pantalla está arriba», «las opciones de Configuración», «las formas de
  entrar», «el estado de la conexión». Sin ninguna capa enganchada, cada punto hace lo de siempre.
  Los puntos de enganche viven en la plataforma (`platform/`) y se documentan en la arquitectura.
- **Cada capa se engancha sola:** el sistema la encuentra por su carpeta (`import.meta.glob` en la
  aplicación, el registro de módulos en el servidor). Nadie la importa a mano.
- **Una capa no importa otra,** ni importa la lógica de un módulo por dentro: si necesita algo de
  un módulo, lo pide por su fachada o por un punto de enganche.
- **Deseable: independiente del negocio.** La parte general de una capa (el motor del teclado, la
  cola sin conexión, el vínculo) no nombra nada de la ferretería: ni productos ni ventas ni
  personas. Lo que es de Ferrebress queda en las carpetas de la capa dentro de cada módulo. Así la
  parte general se puede llevar a otro proyecto. El análisis de librería del paso 7 (constitución)
  dice, para cada capa, qué la ata todavía a Ferrebress.

**Las capas de hoy:**

| Capa | Carpeta | Qué hace | Se engancha en |
|---|---|---|---|
| Los atajos | `src/app/keyboard/shortcuts/` | Las teclas de cada pantalla (ADR-019) | Qué pantalla está arriba, los modelos |
| La navegación | `src/app/keyboard/navigation/` | Las flechas, Enter y Esc, iguales en toda la aplicación (ADR-019) | Los roles de accesibilidad de la vista |
| Sin conexión | `src/app/offline/`, `src/server/offline/` | Guardar en el dispositivo, la cola de lo pendiente, el service worker, entrar con la huella sin conexión, lo apartado de quien se dio de baja (ADR-007, capítulo 15) | Cómo se manda un comando, el estado de la conexión, las opciones de Configuración, las formas de entrar |
| El vínculo y el espejo | `src/app/device-link/`, `src/server/device-link/` | Vincular el celular y la computadora, la conexión directa, el espejo de lo que se ve (ADR-003, ADR-017, capítulo 03) | Los valores con nombre de la pantalla, el canal en tiempo real |

**Los servicios de plataforma no son capas.** Un aspecto se engancha en el núcleo y el núcleo no
sabe de él. Un servicio de plataforma es al revés: los módulos dependen de él, como de hablar con el
servidor. El tiempo real es un servicio de plataforma (la entrada lo usa para el QR, la auditoría
para actualizarse sola), y sigue la misma idea de separación:

- **Tres partes, sin nada de la ferretería:** el protocolo, una sola vez, en `src/shared/realtime/`
  (la forma de los mensajes y de los temas); el hub en `src/server/platform/realtime/`; el canal, los
  transportes y el espejo en `src/app/platform/` (`realtime/`, `peer/`, `mirror/`). Otro proyecto se
  puede llevar las tres enteras.
- **Lo de cada módulo, en su archivo:** cada módulo declara sus temas y sus campos de la cabecera en
  su propio `realtime.ts` (quién puede escucharlos, qué se manda al empezar), en el servidor y en la
  aplicación, no mezclado con su lógica.
- **Sus formas son un juego de herramientas** (ADR-003): el pedido común, la cabecera de las
  respuestas, el canal abierto mientras se espera y el directo entre el celular y la computadora.
  **Cada vez que algo necesita recibir datos del servidor sin pedirlos** (un aviso, un flujo, una
  métrica en tiempo real), el arquitecto elige en el diseño técnico la forma más conveniente de las
  que ya existen y dice por qué. **Si ninguna es óptima** (por ejemplo, avisar con la aplicación
  cerrada, T119, que necesita notificaciones push), se lo dice a Carlos antes de diseñar nada, para
  sumar la forma nueva al juego como un transporte más, sin rediseñar lo demás.

**Los límites se controlan en `pnpm check`:** el núcleo (`platform/`, `shell/`, `modules/` salvo
sus carpetas de capa, `views/`) no importa ninguna capa; una capa no importa otra; y la parte
general de una capa no importa ningún módulo.

**Sacar una capa no es el objetivo, pero es la prueba de que está bien separada:** si borrar su
carpeta y las carpetas con su nombre dentro de los módulos deja la aplicación compilando, la capa
está desacoplada. No se mantiene una prueba automática de eso; se mira en la revisión del código
(paso 7) cuando la capa cambia.

## Opciones descartadas

- **Programación orientada a aspectos de verdad** (decoradores o proxies que interceptan las
  llamadas sin que el código lo sepa): separa igual, pero esconde qué se ejecuta y cuándo. Leyendo
  un módulo no se ve que algo le encola los pedidos por debajo. Los puntos de enganche con nombre
  dicen dónde se engancha cada capa.
- **Dejarlas dentro de la plataforma y de los módulos, ordenadas en subcarpetas:** es lo de hoy; el
  acoplamiento queda escondido en importaciones cruzadas que nadie controla.
- **Una biblioteca de complementos genérica** (un sistema de plugins con ciclo de vida, órdenes y
  dependencias): más de lo que hace falta para cuatro capas conocidas.

## Consecuencias

- Leer un módulo es leer su negocio; lo transversal se lee en su capa.
- Sacar las capas de donde están hoy es trabajo de T134 (el teclado, con ADR-019) y de T138 (sin
  conexión, el vínculo y el orden del tiempo real en sus tres partes), sin cambiar lo que hace la
  aplicación.
- Una capa nueva (por ejemplo, avisar con la aplicación cerrada, T119) nace como capa.
