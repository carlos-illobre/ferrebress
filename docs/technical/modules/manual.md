# Diseño técnico · 00 · El manual (`manual`)

Implementa la parte 6 del [capítulo 00](../../chapters/00-app/rules.md) (R6.1 a R6.8, E32 a E39 y
E53) con la [maqueta final aprobada](../../design/mockups/manual/final/), y deja escrito el
capítulo «Entrar» del manual (paso 9 de los módulos 01 y 15). Cada módulo que se cierre después
agrega su capítulo en su paso 9, sin tocar el código.

## 1. Qué resuelve

Tres piezas, cada una en su lugar:

| Pieza | Dónde | Quién la cambia |
|---|---|---|
| El texto del manual y **el orden de los capítulos** | `docs/manual/`, en Markdown y en castellano | El redactor, en el paso 9 de cada módulo, o cuando Carlos pide otro orden |
| Las capturas y los clips | `docs/manual/media/`, sacados de la aplicación por un programa | Se vuelven a sacar cuando cambia una pantalla |
| La pantalla | `src/app/modules/manual/` | Solo si cambia la pantalla |

El servidor no participa: no hay tablas, ni rutas de `/api`, ni eventos. El manual son archivos
fijos que sirve Caddy en `/manual/`, armados con la aplicación.

## 2. El contenido: `docs/manual/`

### El orden de los capítulos, en una lista

`docs/manual/README.md` tiene **una sola lista** con todos los capítulos, uno por renglón, en el
orden en que salen en el manual. **Cambiar el orden es mover un renglón**; no hay números que
correr ni código que tocar. Las tareas de cada capítulo salen en el orden en que están escritas en
su archivo, así que reordenarlas es mover su sección.

```markdown
## Los capítulos, en orden

- Entrar · log-in · [sign-in.md](sign-in.md)
- Vender · shopping-cart
- Clientes · users
…
```

Cada renglón: el nombre, el ícono (de los de `ui/icon`) y, si ya está escrito, su archivo. El que
no tiene archivo es un capítulo que falta: en el ambiente de pruebas dice «Pronto» y no se abre; en
producción no aparece (R6.4). El orden de hoy es el de R6.4.

### Un capítulo

Un archivo por capítulo, con el nombre en inglés del módulo (`sign-in.md`). Se lee como un documento
común y tiene una forma fija, para que la aplicación lo pueda armar:

```markdown
# Entrar

Para usar Ferrebress primero entrás con tu cuenta. …            ← la introducción

## Entrar con el celular

- Dispositivo: computadora
- Ícono: qr-code
- Marca: La forma más rápida
- Clip: phone-to-computer
- Aclaración: No escribís nada en la computadora: el celular hace todo.

1. Abrí Ferrebress en la computadora. A la derecha aparece un código cuadrado.
   Captura: desktop-entrance · qr · El código
2. En el celular, abrí Ferrebress y tocá «Escanear código QR».
   Captura: phone-entrance · scan · Escanear código QR · celular
3. …

> El código cambia cada minuto y sirve una sola vez.
```

- **Dispositivo:** `computadora` o `celular` (R6.3). Una tarea es de un solo dispositivo.
- **Captura:** el nombre de la captura, el punto que se señala y su rótulo. Un paso que se hace en
  el otro dispositivo termina en `· celular` o `· computadora`: se muestra igual, con la aclaración
  «En el celular» o «En la computadora» (R6.3).
- **Un paso sin captura** muestra el ícono grande sobre la captura anterior, como en la maqueta; su
  ícono va en `Ícono:` dentro del paso.
- **Los consejos** (`>`) salen debajo del paso a paso, de a uno por paso, y todos en «Todos los
  pasos».
- El texto es solo texto: no hay enlaces, ni negritas, ni HTML. Las comillas «» se escriben tal cual.

### Cómo se arma

Un complemento de Vite, `src/app/build/manual.ts`, lee `docs/manual/` al armar la aplicación y deja
en `dist/manual/`:

| Archivo | Qué tiene | Tamaño |
|---|---|---|
| `index.json` | La lista en orden: id, nombre, ícono y si está escrito; y, de los escritos, el título, el dispositivo, el ícono, la marca y la cantidad de pasos de cada tarea | Menos de 3 KB |
| `<capítulo>.json` | El capítulo entero: introducción, tareas, pasos, capturas con sus puntos ya ubicados, consejos | Unos 6 KB cada uno |
| `search.json` | Por dispositivo, cada paso y consejo en minúsculas y sin tildes, con su capítulo, tarea y número | Unos 4 KB por capítulo |
| `media/*` | Las capturas (WebP) y los clips (WebM) | § 3 |

El complemento **frena el armado** si algo no cierra, con el archivo y el renglón: un renglón de la
lista con otra forma, un capítulo repetido, un ícono que no existe, una clave desconocida, un
dispositivo que no es `computadora` ni `celular`, una captura o un punto que no existen, o un
archivo de `media/` que nadie usa. Así un error de redacción no llega a la pantalla. Lo mismo corre
en `pnpm check`.

El Dockerfile de la aplicación copia `docs/manual/` antes de armar.

## 3. Las capturas y los clips

**Se sacan de la aplicación, no se dibujan.** Un programa, `tests/manual/capture.ts`, corre en la
misma imagen de Docker de Playwright que las capturas de referencia (para que las letras salgan
iguales), con el servidor de mentira de `tests/screens/serve.ts`:

- **Cada captura es una escena con nombre** en `tests/manual/scenes.ts`: el tamaño (computadora
  1366 × 768; celular 390 × 844, al doble de definición), el estado que se arma con respuestas de
  mentira (sin conexión, con sesión, Más abierto) y **los puntos**, cada uno con un nombre y lo que
  señala por su rol y su texto (`qr: la imagen del código`, `scan: el botón «Escanear código QR»`).
- El servidor de mentira contesta **`environment: 'production'`**: la captura sale como la ve quien
  usa Ferrebress, **sin el marco ni el cartel del ambiente de pruebas y sin «Pronto»** (R6.5).
- Las personas son inventadas y siempre las mismas (Ana Gómez, Administrador), con el reloj fijo:
  ningún dato del negocio (R6.2, E53).
- **Los puntos se ubican solos:** el programa mide dónde quedó cada elemento y guarda su centro, en
  porcentaje de la captura, en `docs/manual/media/points.json`. Si una pantalla cambia, se vuelve a
  correr y los puntos siguen sobre lo que señalan, sin ubicarlos a mano.
- Guarda `docs/manual/media/<escena>.webp`, de menos de 80 KB cada una.

**Los clips** son escenas grabadas con el video de Playwright, mudas (R6.5), de unos 8 segundos y
menos de 1 MB. El de «Entrar con el celular» graba a la vez la computadora y el celular, cada uno en
su video (`phone-to-computer.desktop.webm` y `.phone.webm`); la pantalla los muestra uno al lado del
otro y los arranca juntos, como la escena de la maqueta.

Se corre con `pnpm manual:media` cuando cambia una pantalla que sale en el manual. Las capturas de
referencia de `tests/screens/` avisan cuándo cambió una pantalla aprobada: el que la cambia corre
también este programa en el mismo commit.

## 4. Dónde se sirve y qué no se guarda

- **Caddy** sirve `/manual/*` con `Cache-Control: no-store`: el navegador no lo guarda (R6.8).
- **El service worker** no toca `/manual/` (no es `/assets/`) ni el código de la pantalla: se arma
  aparte como `assets/manual-[hash].js` y `.css`, y `kindOf` devuelve `skip` para lo que empieza con
  `/assets/manual-`. Así, con trabajo sin conexión, nada del manual ocupa lugar (E39).
- **Sin conexión,** «Ver el manual» y Más → Manual abren igual la pantalla vacía con «El manual
  necesita internet» y «Volver»; ese texto está en el código principal.

## 5. La pantalla: `src/app/modules/manual/`

| Archivo | Qué hace |
|---|---|
| `index.ts` | El registro: la dirección `/manual` y el código que se baja recién al abrirlo |
| `api.ts` | Pide `index.json`, el capítulo y `search.json` (este, recién al escribir en el buscador), con `cache: 'no-store'` |
| `state.ts` | Las acciones con nombre y su reductor: `chooseDevice`, `openTask`, `goToStep`, `next`, `previous`, `openAllSteps`, `closeAllSteps`, `search`, `playClip` |
| `search.ts` | Busca en `search.json`: minúsculas, sin tildes, todas las palabras; agrupa por capítulo |
| `useManual.ts` | La lógica de la pantalla: carga, dirección, teclado, «Volver» |
| `texts.ts` | Los textos de la pantalla (no los del manual) |
| `screens/Manual/` | La página: cabecera, tareas y paso a paso; en el celular, el paso a paso y «Todos los pasos» como hojas |
| `screens/Step/` | La captura con su aro y su rótulo, el clip y el ícono de un paso sin captura |
| `screens/AllSteps/` | El capítulo entero, para leerlo de corrido |

Es una sola pantalla para los dos tamaños, con el corte en 900 px, como la maqueta.

### Cómo se abre y cómo se vuelve (R6.1, R6.7, E32, E33, E37)

- `App` muestra el manual encima de todo cuando la dirección empieza con `/manual`, **haya o no
  sesión**. El manual no lee la sesión ni la persona, ni pide nada a `/api` (R6.2, E53).
- «Ver el manual» de la entrada (deja de llevar «Pronto», 01 · R7.2) y Más → Manual hacen
  `navigate('/manual')` y guardan en el estado de la historia desde dónde se abrió y su nombre:
  «la entrada» o la parte abierta («Vender»). En el celular, siempre «Más».
- **«Volver»** dice «Volver a la entrada» o «Volver a Vender» (en el celular, «‹ Más») y hace
  `history.back()`. Si se abrió escribiendo la dirección, no hay de dónde volver: dice «Ir a
  Ferrebress» y lleva a `/`. Nunca lleva a una dirección que venga escrita en la dirección.
- La dirección guarda dónde se está (`/manual?d=celular&t=p-offline&p=2`): recargar deja en el mismo
  paso, y el botón atrás de Android cierra la hoja de arriba (`useBackStep`) antes de salir.

### El dispositivo (R6.3, E34)

Arranca en el que se usa (`isPhone()`); el selector de arriba cambia todo: la lista de tareas, el
buscador y las capturas. Cambiarlo cierra «Todos los pasos» y vuelve al principio.

### Los capítulos que faltan (R6.4, E35)

`App` le pasa al manual si es el ambiente de pruebas (de `/api/start`, o el último guardado). En
pruebas, debajo de los escritos va «Próximos capítulos» con los que faltan y «Pronto»; en
producción no van. El orden es siempre el de `README.md`.

### El buscador (R6.6, R7.4, E36)

Espera 150 ms sin que se tipee (R7.4), busca solo en el dispositivo elegido y muestra lo encontrado
agrupado bajo su capítulo; elegir un resultado abre esa tarea en ese paso. ↑ ↓ y Enter recorren los
resultados; `/` lleva al buscador.

### El paso a paso

- **La captura:** se achica entera si es más alta que el lugar (no se recorta: el punto quedaría
  corrido).
- **El aro y su rótulo:** el aro va sobre la captura, en el porcentaje de `points.json`; el rótulo, al
  costado y en diagonal, con una flecha hacia el aro (R6.5). Cambia de lado cerca de un borde y
  puede salir de la captura para leerse entero: va en la capa del paso, no dentro de la captura, y
  se ubica midiendo dónde quedó el aro.
- **El clip** (R6.5, E38): con `preload="none"`, `muted` y sin `autoplay`: no baja nada hasta que se
  toca «Ver el clip». Con «reducir movimiento», muestra el último cuadro.
- Las animaciones son las de la maqueta (`../design/mockups/manual/final/changes.md`).

### El teclado (00 · R2)

Como la maqueta: Alt C Computadora, Alt L Celular, Alt O Volver, Alt V Ver el clip, Alt T Todos los
pasos, Alt A anterior, Alt S siguiente; ← → pasan de paso con el buscador vacío; Esc cierra «Todos
los pasos» o borra lo buscado. En la computadora el cursor arranca en el buscador (R2.2); en el
celular, en ningún lado (R2.12). Todo con las marcas `data-layer`, `data-key` y `data-mark` del motor
del teclado.

## 6. Conexiones

Ninguna de `realtime`. Solo pedidos comunes de archivos fijos, al abrirlo.

## 7. Sin conexión

No baja nada ni encola nada (R6.8, E39).

## 8. Seguridad

- **Datos que toca:** ninguno del negocio ni de la persona. El manual no lee la sesión, y lo que
  muestra sale del repositorio.
- **Quién puede:** cualquiera, sin haber entrado (R6.2): por eso no puede tener nada que no sea
  público. Las capturas salen de un servidor de mentira con personas inventadas, nunca del de
  pruebas ni del de producción.
- **Qué entra de afuera:** nada de la persona salvo lo que escribe en el buscador, que solo se
  compara con texto y no se manda a ningún lado; y la dirección (`d`, `t`, `p`), que solo se acepta
  si es un dispositivo, una tarea y un paso que existen: si no, se ignora.
- **El texto se muestra como texto:** la pantalla nunca arma HTML con el contenido. El complemento
  rechaza `<` en el Markdown.
- **La política de contenido no cambia:** todo sale del mismo origen (`default-src 'self'` cubre los
  videos), y la posición del aro y del rótulo se pone por CSSOM (`element.style`), que la política
  `style-src 'self'` permite; nada de `style="…"` en el HTML ni `'unsafe-inline'`.
- **«Volver»** solo usa la historia o `/` (§ 5): no se lo puede usar para mandar a otro sitio.
- **Secretos:** ninguno. **Auditoría:** nada; no hay datos ni acciones del negocio.

## 9. Metas de performance

- **Antes de abrirlo:** cero bytes. El esqueleto de la aplicación no crece (solo la dirección y el
  texto de «necesita internet»).
- **Al abrirlo:** el código de la pantalla (menos de 15 KB comprimido), `index.json` y el capítulo
  (menos de 10 KB juntos) y la primera captura (menos de 80 KB): visible en menos de 1 segundo con
  4G. `search.json`, recién al escribir.
- **Buscar:** menos de 5 ms con todos los capítulos escritos.
- **Pasar de paso:** sin pedidos más que la captura que falta, que se pide un paso antes.

## 10. Pruebas

| Escenarios | Prueba |
|---|---|
| E32, E33, E37 | Unitarias de `App` y de `useManual`: se abre desde la entrada y desde Más, sin sesión y con sesión, y «Volver» vuelve a donde estaba |
| E34, E36 | Unitarias del reductor y de `search.ts`: el selector cambia todo; el buscador solo trae lo del dispositivo, agrupado, y lleva al paso |
| E35 | Unitaria de la pantalla con un índice de prueba, en pruebas y en producción; y que el orden es el de la lista |
| E38 | Unitaria del clip: quieto, mudo y sin bajar nada hasta que se lo pide |
| E39 | Unitarias de `kindOf`: `/manual/` y `/assets/manual-` no se guardan; de punta a punta, con trabajo sin conexión prendido, la caja del service worker no tiene nada del manual |
| E53 | Unitaria: con una sesión abierta, el manual no muestra el nombre ni nada de la persona, y no pide nada a `/api` |
| El complemento | Unitarias de cada error de § 2 y de lo que arma con un `docs/manual/` de prueba |
| Pantallas | Capturas de referencia del manual en la computadora y en el celular (`tests/screens/manual.spec.ts`) |
| De punta a punta | Abrir el manual desde la entrada, seguir «Entrar con Google» y volver (`tests/e2e/manual.spec.ts`) |

## 11. Tareas

1. `docs/manual/README.md` con la lista y `sign-in.md` con el capítulo «Entrar», de la maqueta
   aprobada.
2. `[P]` El complemento de Vite con sus pruebas, en `pnpm check`.
3. `[P]` `tests/manual/` y `pnpm manual:media`: las escenas, los puntos y los clips. Sacar todo.
4. La pantalla, con sus pruebas (depende de 2).
5. Abrirla desde la entrada y desde Más; Caddy, el service worker y el Dockerfile (depende de 4).
6. Las capturas de referencia y la prueba de punta a punta.
7. Las revisiones del código y de seguridad (paso 7).
