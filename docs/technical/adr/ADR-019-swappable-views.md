# ADR-019: La vista, aparte e intercambiable

**Estado:** aceptado

## Contexto

La interfaz gráfica se hace al final (constitución, «Cómo se trabaja»): la de hoy es provisoria, y
Carlos quiere poder tirarla y hacer otra, o tener varias vistas a la vez, **sin tocar nada más**: ni
las reglas de cada proceso, ni los pedidos al servidor, ni la sesión, ni lo que se hace sin
conexión, ni el espejo, ni el teclado, ni los textos.

Hasta ahora la regla era «cambiar la estética es tocar CSS» (ADR-002): alcanzaba para cambiar
colores y disposición, no para cambiar el HTML. La revisión del código
([ui-separation-review.md](../ui-separation-review.md)) encontró procesos enteros dentro de los
componentes (guardar un rol, la regla de permisos del marco, la cinta de Quién hizo qué), lógica
que depende de cómo está armado el HTML (el teclado, «Algo salió mal», el espejo de algunos
campos) y piezas visuales que llama la lógica (los avisos al pie). Con eso, rehacer la vista es
reescribir también parte del comportamiento, y cualquier diferencia pasa sin que nadie la note.

## Decisión

**La aplicación tiene dos partes, y solo una dibuja.**

```
src/app/
├── main.ts              arranca la plataforma, elige la vista y la monta
├── platform/            tecnología sin negocio y sin dibujo (servidor, tiempo real, espejo,
│   │                    lo guardado, sin conexión, teclado, cámara, dirección…)
│   └── view/            lo poco que una vista usa de la plataforma (el contrato, abajo)
├── modules/<module>/    la lógica de cada módulo: sin JSX, sin CSS, sin HTML
│   ├── index.ts         la fachada para los demás módulos y el arranque (liviana)
│   ├── model.ts         la fachada para las vistas: los modelos, los textos, las cuentas que muestran
│   ├── api.ts, state.ts, rules.ts, settings.ts, texts.ts
│   ├── use<Screen>.ts   el modelo de cada pantalla
│   └── shortcuts/       los atajos de cada pantalla (abajo)
├── keyboard/            el teclado, en dos capas independientes (abajo)
│   ├── shortcuts/       el motor de los atajos y su mapa de teclas (keymap.ts)
│   └── navigation/      las reglas de navegación, iguales para toda la aplicación, y su mapa
├── shell/               la lógica de la aplicación entera (arrancar, la sesión, qué pantalla va),
│                        también sin dibujo
└── views/<view>/        una vista: todo lo que se dibuja
    ├── index.tsx        la monta: la composición de la aplicación
    ├── ui/              sus piezas visuales
    ├── styles/          sus tokens y su CSS común
    └── <module>/<Screen>.tsx y .css
```

- **El modelo de cada pantalla es un hook** (`use<Screen>()`, en el módulo) que devuelve un objeto
  con **los datos ya listos para mostrar y las acciones con nombre** (`save()`, `retry()`,
  `choose(id)`). No devuelve JSX, no recibe elementos del HTML ni eventos, no sabe de clases, de
  medidas ni de animaciones. Todo el estado y los efectos de la pantalla (pedir, esperar, el espejo,
  los temporizadores, la navegación, los permisos, lo que se guarda sin conexión) están ahí.
- **La vista solo dibuja el modelo y le avisa lo que toca la persona.** Un componente de una vista
  llama al hook de su pantalla, muestra lo que recibe y llama a sus acciones. Puede tener estado
  solo para lo que es puramente de cómo se ve (una animación, un panel abierto que no se espeja),
  marcado con `// vista:` y el motivo.
- **Varias vistas, la misma lógica.** Cada vista es una carpeta de `views/` que se registra en
  `views/index.ts`; `main.ts` monta la elegida. Borrar una vista es borrar su carpeta. Dos vistas
  pueden convivir (por ejemplo, la provisoria y la nueva mientras se termina), y las dos usan los
  mismos modelos. La de hoy es `views/basic/`.
- **Cada vista carga cada módulo cuando se abre**, como hoy (`platform/lazy.ts`): la vista registra
  por módulo una carga diferida de sus pantallas.

**El teclado son dos capas independientes, que se ponen o se sacan por separado:** los atajos y la
navegación. Las dos trabajan sobre los modelos, no sobre el HTML, y ninguna sabe de la otra.

- **Qué pantalla está arriba lo sabe la plataforma, no el teclado** (`platform/screens.ts`): cada
  modelo se anuncia al abrirse con un nombre (`users.list`) y se retira al cerrarse; lo que se abre
  encima (una hoja, una confirmación) es otra pantalla con su nombre. Las dos capas leen de ahí, y
  solo vale la pantalla de más arriba (00 · R2.10). Sin ninguna capa, ese registro igual existe y no
  molesta.

**La capa de los atajos** (`src/app/keyboard/shortcuts/`):

- **Cada pantalla declara sus comandos** en su archivo (`modules/<module>/shortcuts/<screen>.ts`),
  cada uno con un nombre y lo que hace sobre el modelo: `users.list.authorize` llama a
  `authorize()`, `users.list.search` lleva al buscador. No dice ninguna tecla.
- **Qué tecla o combinación ejecuta cada comando está en un solo archivo de configuración**
  (`src/app/keyboard/shortcuts/keymap.ts`), para toda la aplicación: `'users.list.authorize':
  'Alt+A'`, `'users.list.search': '/'`. Cambiar una tecla es cambiar una línea de ese archivo, sin
  tocar la pantalla ni su lógica. Un comando sin tecla en el mapa no se puede usar con el teclado;
  una tecla del mapa cuyo comando no existe es un error.
- **Una tecla vale en el contexto de su pantalla:** la misma combinación puede hacer cosas
  distintas en pantallas distintas. Lo que valga en toda la aplicación lleva el contexto `app`.
  `pnpm check` controla que dentro de un contexto, y entre un contexto y `app`, ninguna combinación
  se repita, y que no se use una que reserva el navegador (Ctrl+T, Ctrl+W, F5…).
- **El menú no usa el mapa:** sus teclas son de la navegación (00 · R2.13). Alt 0 lleva la marca al
  menú y ahí cada opción se elige con su letra sola. Así las pantallas tienen todas las letras con
  Alt para sus botones, sin que el menú les quite ninguna. La letra de cada opción es un dato del
  menú; la vista la pone con `data-key` en una región con `data-letters`.
- **Lo que se ve:** qué atajo tiene cada acción, para mostrarlo con Alt (00 · R2.9), lo da
  `useShortcutHints(<pantalla>)`; sin la capa, devuelve nada.

**La capa de la navegación** (`src/app/keyboard/navigation/`):

- **Las reglas de navegación son las mismas para toda la aplicación,** no cambian de una pantalla a
  otra (00 · R2): por ejemplo, en una grilla o una tabla ↑ y ↓ recorren las filas, y ← y → salen de
  la grilla al menú del costado. Por eso no hay archivos de navegación por pantalla.
- **Cada regla, en su archivo** (`keyboard/navigation/rules/<rule>.ts`), para sumarlas, cambiarlas o
  sacarlas de a una a medida que Carlos las va ajustando usando la aplicación.
- **Trabaja sobre la estructura que la vista declara con los roles de accesibilidad,** no sobre
  marcas propias ni sobre clases: una grilla o una tabla es un `grid` o un `table` con sus filas, el
  menú es la `navigation` principal, las pestañas son un `tablist`, lo que se abre encima es un
  `dialog`. Cualquier vista que use bien esos roles (lo pide igual la accesibilidad, punto 5 del
  contrato) se navega sola, sin escribir nada para el teclado. Qué hace Enter con una fila es lo
  que hace la fila al tocarla.
- **Sus teclas tienen su propio mapa, chico** (`keyboard/navigation/keymap.ts`): siguiente, anterior,
  salir al menú, entrar, cerrar, página siguiente y anterior, con las flechas, Enter, Esc, RePág y
  AvPág de arranque. Sirve para cambiar las teclas de moverse sin tocar ninguna regla.
- **Lo marcado vive en la capa:** la vista lo ve porque la capa le pone a lo marcado el atributo
  estándar que corresponde (`aria-selected` o `aria-current`) y lleva el desplazamiento ahí; la
  vista solo le da forma con su CSS.

**Poner y sacar:**

- **Sacar los atajos** es borrar `src/app/keyboard/shortcuts/` y las carpetas `shortcuts/` de los
  módulos; **sacar la navegación**, borrar `src/app/keyboard/navigation/`. Se puede sacar una sola
  capa, las dos, los atajos de una sola pantalla (su archivo y sus líneas del mapa) o una sola regla
  de navegación (su archivo). Nada más cambia: los modelos y las vistas
  no saben de ninguna de las dos.
- **Las capas se encuentran solas** (`import.meta.glob`): nadie las registra ni las importa a mano,
  así que borrar sus archivos no deja ninguna línea rota. Sin capas, la aplicación se sigue usando
  con el mouse, el dedo y el Tab del navegador.
- **Las reglas del teclado de la aplicación (00 · R2)** siguen igual con las dos capas puestas: los
  mapas de arranque son los de hoy.
- **El teclado ya no depende de marcas propias en el HTML:** hoy el motor busca `data-key`,
  `data-mark` y `data-layer` escritos en cada pantalla; con las capas, los atajos trabajan sobre los
  modelos y la navegación sobre los roles de accesibilidad que cualquier vista ya tiene que tener.

**El contrato de la vista** (`platform/view/`): lo que cualquier vista tiene que cumplir, porque de
eso dependen reglas que no son gráficas.

1. **El teclado:** la vista no decide ninguna tecla. Si quiere mostrar los atajos, los lee de
   `useShortcutHints`; para que la navegación ande, usa bien los roles (`grid`, `table`, `row`,
   `navigation`, `tablist`, `dialog`) y le da forma a lo marcado (`aria-selected`).
2. **Lo privado:** todo lo que muestra un nombre, un correo o un dato personal lleva
   `privateProps()`, para que la captura de «Algo salió mal» lo tape.
3. **Los avisos:** la lógica los pide con `notify(…)`; la vista los dibuja con lo que lee de
   `useNotices()`.
4. **Los textos** salen de los `texts.ts` de los módulos (con su forma larga y corta); la vista no
   escribe textos propios, salvo los que son solo de su aspecto.
5. **Accesibilidad:** cada control tiene su rol y su nombre accesible, que son los textos. Es lo que
   usan las pruebas de la vista.

**Las pruebas siguen la misma línea:**

- **Los escenarios de los capítulos se prueban como los usa la persona,** pero a través de un
  **conductor de cada pantalla** (el «kit» de la pantalla, un objeto de página): `kit.save()`,
  `kit.shownSettings()`, `kit.choose('Redondeo')`. Las pruebas de los escenarios no tocan el HTML;
  solo el conductor sabe cómo está armada la vista. Cada vista tiene sus conductores, en su
  carpeta: cambiar de vista es escribir los conductores nuevos, y las pruebas de los escenarios
  siguen iguales y dicen si la vista nueva cumple todo.
- **Lo que no tiene que ver con la vista se prueba sobre los modelos**, sin dibujar nada
  (`renderHook`): las reglas, los temporizadores, los choques, lo que se manda al servidor.
- **Los conductores buscan por rol, nombre y texto,** nunca por clase ni por estructura, así la
  mayoría sirve también para una vista nueva que use los mismos textos y roles.
- **Las de punta a punta y las de captura** también buscan por rol y texto. Las imágenes de
  referencia de las de captura son de la vista de hoy: se rehacen con la nueva.

**Los límites se controlan en `pnpm check`** (constitución, XII):

- `modules/`, `shell/` y `platform/` no importan `views/` ni archivos `.tsx` ni `.css`, y no usan
  JSX; de `preact` solo `preact/hooks`, `createContext` y tipos.
- `views/` importa de los módulos solo su `model.ts`, y de la plataforma solo `platform/view/`.
  `model.ts` va aparte de `index.ts` para que lo que usan las vistas se baje con la pantalla y no
  pese en el arranque.
- Una vista no importa otra.
- Nadie importa una capa del teclado (`keyboard/`, `shortcuts/`) salvo su propio motor, y una capa
  no importa la otra. Ningún modelo ni vista escucha teclas (`keydown`).
- En `views/`, sin `fetch`, temporizadores, `localStorage`, `history` ni `document` (salvo en
  `platform/view/`), y cada `useState` o `useRef` con su `// vista:`.
- En las pruebas, sin buscar por clase ni por selectores de CSS, salvo las de las piezas de `ui/`.

## Opciones descartadas

- **Seguir con `screens/` dentro de cada módulo:** la pantalla queda al lado de su lógica, pero una
  vista nueva tiene que tocar todas las carpetas de módulos, y dos vistas a la vez quedan mezcladas
  en cada una. Con `views/<view>/`, una vista se agrega o se borra entera.
- **Componentes «contenedor» y «presentación»** (un componente con la lógica que envuelve a otro que
  dibuja): el contenedor sigue siendo un componente, atado a Preact y al árbol; probarlo pide
  dibujar. Un hook se prueba solo y lo puede usar cualquier vista.
- **Un estado global con señales o un almacén (Preact Signals, Zustand, Redux):** suma una
  dependencia y una forma nueva de escribir cada módulo, y no resuelve lo que importa (que la vista
  no tenga lógica): eso lo da la frontera entre carpetas, controlada con herramientas. Lo global que
  ya existe (`platform/store.ts`, el espejo) sigue igual.
- **Clases de modelo (MVVM con objetos):** más código para lo mismo que hace un hook en Preact, y
  pelea con cómo Preact sabe cuándo volver a dibujar.
- **El teclado marcado en el HTML** (como estaba): cada vista tenía que poner las marcas a mano, y
  sacar el teclado era tocar todas las pantallas.
- **Web Components o una biblioteca de componentes «sin cabeza»:** resuelven piezas sueltas
  (un menú, un diálogo), no la separación de los procesos de cada módulo.

## Consecuencias

- Una vista nueva se escribe leyendo los modelos, el contrato y los `screens.md` de los capítulos;
  no hace falta abrir ningún módulo.
- La lógica que hoy está en componentes pasa a los modelos, con sus pruebas escritas antes, sin
  cambiar lo que hace la aplicación (T134). Mientras dure, las reglas de `pnpm check` avisan en lo
  que falta y fallan en lo que ya está separado.
- Las pruebas que hoy buscan por clase se pasan a rol y texto; las imágenes de las pruebas de
  captura y las del manual son de la vista de hoy y se rehacen con la nueva.
- ADR-002 sigue: una sola pantalla para el celular y la computadora, acomodada con CSS, dentro de
  cada vista.
