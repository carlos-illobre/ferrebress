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
│   ├── index.ts         la fachada: el registro y lo que usan las vistas y los demás módulos
│   ├── api.ts, state.ts, rules.ts, settings.ts, texts.ts, keys.ts
│   └── use<Screen>.ts   el modelo de cada pantalla
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

**El contrato de la vista** (`platform/view/`): lo que cualquier vista tiene que cumplir, porque de
eso dependen reglas que no son gráficas.

1. **El teclado:** qué tecla hace qué se declara en la lógica (`keys.ts` de cada módulo). La vista
   lo aplica con `keyProps(…)`, que devuelve las marcas que necesita el motor del teclado; nunca las
   escribe a mano.
2. **Lo privado:** todo lo que muestra un nombre, un correo o un dato personal lleva
   `privateProps()`, para que la captura de «Algo salió mal» lo tape.
3. **Los avisos:** la lógica los pide con `notify(…)`; la vista los dibuja con lo que lee de
   `useNotices()`.
4. **Los textos** salen de los `texts.ts` de los módulos (con su forma larga y corta); la vista no
   escribe textos propios, salvo los que son solo de su aspecto.
5. **Accesibilidad:** cada control tiene su rol y su nombre accesible, que son los textos. Es lo que
   usan las pruebas de la vista.

**Las pruebas siguen la misma línea:**

- **Los escenarios de los capítulos se prueban sobre los modelos**, sin dibujar nada
  (`renderHook`): no se rompen al cambiar la vista y llevan la cobertura.
- **Las pruebas de una vista** son pocas: que cada pantalla muestre su modelo y llame a sus
  acciones, buscando solo por rol, nombre y texto, nunca por clase ni por estructura. Viven con la
  vista y se van con ella.
- **Las de punta a punta y las de captura** buscan por rol y texto, para que sigan valiendo con otra
  vista que use los mismos textos.

**Los límites se controlan en `pnpm check`** (constitución, XII):

- `modules/`, `shell/` y `platform/` no importan `views/` ni archivos `.tsx` ni `.css`, y no usan
  JSX; de `preact` solo `preact/hooks`, `createContext` y tipos.
- `views/` importa de los módulos solo su fachada, y de la plataforma solo `platform/view/`.
- Una vista no importa otra.
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
