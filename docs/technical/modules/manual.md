# Diseño técnico · 00 · El manual (`manual`)

Implementa la parte 6 del [capítulo 00](../../chapters/00-app/rules.md) (R6.1 a R6.8, E32 a E39 y
E53) con la [maqueta final aprobada](../../design/mockups/manual/final/), y deja escrito el
capítulo «Entrar» del manual (paso 9 de los módulos 01 y 15). Cada módulo que se cierre después
agrega su capítulo en su paso 9. Corregido con sus dos revisiones
([diseño](manual-design-review.md), [seguridad](manual-security-review.md)).

## 1. Qué resuelve

Tres piezas, cada una en su lugar:

| Pieza | Dónde | Quién la cambia |
|---|---|---|
| El texto del manual y **el orden de los capítulos** | `docs/manual/`, en Markdown y en castellano | El redactor, en el paso 9 de cada módulo, o cuando Carlos pide otro orden |
| Las capturas y los clips | `docs/manual/media/`, sacados de la aplicación por un programa | Se vuelven a sacar cuando cambia una pantalla; `pnpm check` avisa |
| La pantalla | `src/app/modules/manual/` | Solo si cambia la pantalla |

El servidor no participa: no hay tablas, ni rutas de `/api`, ni eventos. El manual son archivos
fijos que sirve Caddy en `/manual/`, armados con la aplicación.

## 2. El contenido: `docs/manual/`

### El orden de los capítulos, en una lista

`docs/manual/README.md` tiene **una sola lista** con todos los capítulos, uno por renglón, en el
orden en que salen en el manual y en el buscador. **Cambiar el orden es mover un renglón y nada
más**: no hay números que correr, ni código que tocar, ni capturas que regenerar (las capturas de
referencia del manual usan un manual de prueba propio, § 10). Las tareas de cada capítulo salen en
el orden en que están escritas en su archivo: reordenarlas es mover su sección.

```markdown
## Los capítulos, en orden

- sign-in · Entrar · log-in · sign-in.md
- sales · Vender · shopping-cart
- catalog · Productos · tags
…
- offline · Trabajar sin conexión · wifi-off · → sign-in: no-internet (computadora), offline (celular)
…
```

Cada renglón, separado por «·»: el identificador (el nombre del módulo, en inglés), el nombre, el
ícono y, al final, una de tres cosas:

- **un archivo:** el capítulo está escrito;
- **nada:** el capítulo falta; dice «Pronto» y no se abre, también en producción (R6.4);
- **`→ <capítulo>: <tarea> (<dispositivo>), …`:** el capítulo lleva a tareas de otro, una por
  dispositivo (R6.4: «Trabajar sin conexión» lleva a «Entrar»). Abre la del dispositivo elegido;
  si no hay, el renglón no sale con ese dispositivo.

El orden de hoy es el de R6.4.

### Un capítulo

Un archivo por capítulo, con el nombre del identificador (`sign-in.md`). Se lee como un documento
común y tiene una forma fija:

```markdown
# Entrar

- Computadora: Para usar Ferrebress en la computadora primero hay que entrar. …
- Celular: En el celular entrás con Google la primera vez y después con la huella. …

## Entrar con el celular

- Id: phone-to-computer
- Dispositivo: computadora
- Ícono: qr-code
- Marca: La forma más rápida / La más rápida
- Clip: phone-to-computer
- Aclaración: No escribís nada en la computadora: el celular hace todo.

1. Abrí Ferrebress en la computadora. A la derecha aparece un código cuadrado.
   Captura: desktop-entrance · qr · El código
2. En el celular, abrí Ferrebress, tocá «Escanear código QR» y apuntá al código.
   Captura: phone-entrance · scan · Escanear código QR

> El código cambia cada minuto y sirve una sola vez.
```

- **`# Título`** tiene que ser igual al nombre del renglón de la lista. Debajo, la introducción
  de cada dispositivo.
- **Id:** obligatorio, en inglés, único en el capítulo para cada dispositivo (las dos «Salir» son
  `sign-out`). Con él la dirección nombra la tarea; cambiar el título no rompe nada.
- **Dispositivo:** `computadora` o `celular` (R6.3).
- **Marca:** la forma entera (en «Todos los pasos») y, después de «/», la corta (en la lista).
- **Aclaración:** sale en «Paso 1 de N · …» y en «Todos los pasos».
- **Captura:** la escena (§ 3), el punto que se señala y su rótulo. Si la escena es del otro
  dispositivo (lo dice la escena, no el renglón), el paso se muestra igual, con «En el celular» o
  «En la computadora» (R6.3).
- **Cada paso tiene su captura** (R6.5): la pantalla de la aplicación es lo que le da contexto a
  quien lee; un ícono solo no le dice nada. Lo que pasa fuera de Ferrebress (elegir la cuenta de
  Google, apuntar la cámara, poner el dedo) se dice en el paso que tiene la pantalla. La pantalla
  todavía sabe mostrar un paso sin captura (el ícono de la tarea, grande), pero el lector no lo deja
  pasar.
- **Los consejos** (`>`): en la computadora, el consejo *i* sale en el paso *i*, y el último se
  repite en los que siguen, como la maqueta; en el celular, por el lugar, solo en el último paso de
  la tarea, el último consejo. Todos juntos en «Todos los pasos».
- **Solo texto:** ni enlaces, ni negritas, ni HTML. Las comillas «» se escriben tal cual. Se
  rechazan `<`, `>` dentro del texto, `&` seguido de letras y `;` (entidades), y «·» en los
  rótulos.

### Cómo se arma

Un lector propio, `tools/manual/`, sin bibliotecas: la forma es tan cerrada (claves fijas, una lista
numerada, `>`) que unas decenas de líneas alcanzan. Lo usa un complemento en `vite.config.ts` al
armar la aplicación, y deja en `dist/manual/`:

| Archivo | Qué tiene | Tope |
|---|---|---|
| `index.json` | La versión de la aplicación y la lista en orden: id, nombre, ícono, si está escrito o a qué lleva; y, de los escritos, por tarea: id, título, dispositivo, ícono, marca y cantidad de pasos | 4 KB |
| `<capítulo>.json` | El capítulo entero, con cada captura con sus puntos ya ubicados | 16 KB |
| `search-computer.json` y `search-phone.json` | Por tarea: capítulo, id, título, aclaración y cada paso y consejo, con el texto original | 40 KB |
| `media/*` | Las capturas (WebP) y los clips (WebM, con su cuadro final en WebP) | 90 KB cada captura, 1,5 MB cada clip |
| `app-<hash>.js` y `.css` | El código de la pantalla (§ 4) | 20 KB comprimido |

**Frena el armado**, con el archivo y el renglón, si algo no cierra: un renglón con otra forma, un
id o un archivo repetido, un archivo de `docs/manual/` que no está en la lista (así no desaparece
en silencio al reordenar), un título distinto del nombre, un ícono que no está en el juego del
manual (§ 5), una clave desconocida o que falta, un dispositivo que no es `computadora` ni
`celular`, un destino de `→` que no existe, un paso sin captura o con `Ícono:`, una escena o un punto que no existen, un punto fuera de
0 a 100, un archivo de `media/` que nadie usa, uno pasado de tope o cuyo contenido no es lo que dice
su nombre (se miran los primeros bytes).

**Qué lee:** solo `docs/manual/README.md`, los archivos que nombra y `docs/manual/media/`. Los
nombres tienen que tener la forma `isName` del contrato (minúsculas, números y guiones, más su
extensión), el archivo de un capítulo es siempre `<id>.md`, y se rechazan los enlaces simbólicos
(también si lo es la carpeta `media/` o la del manual). Una captura tiene que ser la que sacó el
programa (la huella del `.webp` está en su escena) y no puede llevar metadatos (trozos `EXIF` o
`XMP`). Los nombres de la lista también son «solo texto».

**Cuándo corre:** al armar (`pnpm boot`, `pnpm screens`, el Dockerfile) y como control propio,
`pnpm manual`, en `pnpm check`, que además mide los topes. Con `MANUAL_DIR=<carpeta>` se arma otro
manual: las capturas de referencia usan el de prueba, `tests/manual/fixture/`, que no cambia cuando
cambia el de verdad. El programa de capturas arma la aplicación con `MANUAL_MEDIA=pending`, que no
arma el manual (las capturas no lo muestran, y así sale aunque falte una captura nueva); corre así
también dentro de `pnpm check` (`pnpm manual:check`), después de que `pnpm manual` lo validó. El
Dockerfile nunca lo usa. En desarrollo, el complemento sirve `/manual/…` desde la memoria, armado
una vez y de nuevo cuando cambia algo de la carpeta del manual (la página `/manual` sigue siendo la
aplicación); no se amplía `server.fs.allow` de Vite.

El Dockerfile de la aplicación copia `docs/manual/`, con `media/`, antes de armar.

## 3. Las capturas y los clips

**Se sacan de la aplicación, no se dibujan.** El programa `tests/manual/capture.ts` corre con el
mismo relanzado en la imagen de Docker de Playwright que `tests/screens/run.ts` (lo reutiliza, no lo
copia), para que las letras salgan iguales.

- **Cada escena tiene nombre** en `tests/manual/scenes.ts`: el dispositivo (computadora 1366 × 768;
  celular 390 × 844), cómo se arma y sus puntos, cada uno con un nombre y lo que señala por su rol
  y su texto (`qr: la imagen del código`, `scan: el botón «Escanear código QR»`).
- **Cómo se arma cada estado:** con `page.route` de Playwright en cada escena, sin tocar
  `tests/screens/serve.ts`: `/api/start` contesta **`environment: 'production'`**, y con sesión o
  sin ella; lo guardado en el dispositivo (la opción sin conexión, el último contacto, una entrada
  sin confirmar) se pone con `addInitScript`, como ya hacen las pruebas de captura; el reloj es fijo
  y la red se corta con `context.setOffline`. Cada respuesta se valida contra su contrato de
  `src/shared/contracts/`, así una respuesta de mentira no se aparta de la API sin que falle.
  Se eligió esto y no el stack de Docker con una base sembrada: es más rápido, siempre igual y no
  necesita datos de nadie.
- **Sin nada del ambiente de pruebas** (R6.5): con `production` no salen el marco, el cartel ni
  «Pronto»; antes de guardar, el programa comprueba que no estén y falla si los encuentra.
- **Sin datos de nadie** (R6.2, E53): la persona es siempre Ana Gómez, Administrador,
  `ana@example.com`; el botón de Google es el de mentira de `serve.ts` (el de verdad podría dibujar
  una cuenta abierta en el navegador); el QR lleva un código que no vale («captura-fija») y el
  escáner rechaza otro origen.
- **Encerrado:** el navegador solo puede pedir a la dirección del servidor de mentira; cualquier
  otro pedido se corta y la corrida falla.
- **Los puntos se ubican solos:** el programa mide dónde quedó cada elemento y guarda su centro, en
  porcentaje de la captura, en `docs/manual/media/<escena>.json`, uno por escena (así dos sesiones
  que escriben capítulos distintos no se pisan). Ahí van también el dispositivo, la huella de la
  captura sin comprimir y la del `.webp` que se publica.
- **Sin el ambiente de pruebas:** antes de guardar, cada escena (y cada marco del clip) se comprueba
  sin el marco de pruebas ni «Pronto». El encierro tiene su propia prueba: un pedido a otro sitio
  tiene que quedar cortado y anotado. Sin service worker, que pediría por su cuenta.
- **WebP sin dependencias:** la captura PNG se pasa a WebP con `canvas.toBlob` en el mismo Chromium.
  Se guarda al tamaño en que se muestra: la computadora a 1100 px de ancho; el celular a 585 × 1266
  (una vez y media), dentro del tope de 90 KB.

**Los clips** son escenas grabadas con el video de Playwright, mudas (R6.5), de unos 8 segundos. El
de «Entrar con el celular» se graba en **una sola página**, que arma `tests/manual/clip.ts` y sirve
el servidor de mentira (los marcos necesitan una página segura alrededor), y que muestra
la computadora y el celular uno al lado del otro, cada uno en un marco con la aplicación; el guion de
la escena encadena el código del QR entre los dos con respuestas de mentira. Así sale un solo video,
sin dos que se desfasen. El programa guarda también el último cuadro como WebP, que la pantalla usa
de imagen de espera y con «reducir movimiento».

**`pnpm check` avisa si una captura quedó vieja:** `pnpm manual:check` (con Docker, en la imagen de
Playwright) vuelve a sacar cada escena sin comprimir y compara su huella con la guardada; si una
pantalla cambió, nombra la escena y pide correr `pnpm manual:media`. Las capturas se sacan siempre
igual (las pruebas de captura ya lo dependen), así que la huella no cambia sola. **El clip no se
compara** (un video no sale igual dos veces): se vuelve a grabar con `pnpm manual:media` cuando
cambia una de sus pantallas.

## 4. Dónde se sirve y qué no se guarda

- **Todo el manual vive en `/manual/`**, también su código: Vite arma la pantalla como
  `manual/app-[hash].js` y `.css` (`chunkFileNames` para ese pedazo). El service worker solo guarda
  `/assets/`, así que **no cambia nada en él** y no aprende el nombre de ningún módulo (E39).
- **Caddy** sirve `/manual/*` con `Cache-Control: no-store` (R6.8), lo saca de la regla `@fresh`
  (que pone `no-cache`) y contesta **404** si el archivo no existe, igual que `/assets/*`; el resto
  sigue cayendo en `index.html`.
- **Una versión vieja:** `index.json` lleva la versión de la aplicación. Si no coincide con la del
  código que la pide, o si el código del manual no se puede bajar habiendo red (404 después de un
  despliegue), se muestra el bloqueo de R5: «Hay que actualizar para seguir».
- **Sin conexión** (R4.4, R4.6): «Ver el manual» y Más → Manual se ponen grises con «Sin conexión»,
  y vuelven solos. Si la conexión se corta con el manual abierto, lo bajado se sigue leyendo; una
  captura o un capítulo que no llegó muestra su lugar gris con «Sin conexión», y se pide de nuevo
  al volver.

## 5. La pantalla: `src/app/modules/manual/`

En el arranque van solo `index.ts`, `ManualSlot.tsx` y `place/`; lo demás se baja al abrirlo.

| Archivo | Qué hace |
|---|---|
| `index.ts` | La fachada: `ManualSlot` y la dirección `/manual` |
| `ManualSlot.tsx` | El lugar del manual en `App`: el `import()` del código, que se baja recién al abrirlo; si no llega, pide actualizar o dice que necesita internet |
| `place/address.ts` | Lee y escribe la dirección (`/manual?d=phone&c=sign-in&t=offline&p=2`), y la valida contra el índice |
| `place/back.ts` | A dónde vuelve «Volver», de la lista cerrada, con sus propios textos (así `texts.ts` no va en el arranque) |
| `place/NeedsInternet.tsx` | La única pantalla de «El manual necesita internet» |
| `files/api.ts` | Pide `index.json` y el capítulo, y el buscador del dispositivo recién al escribir, con `cache: 'no-store'` |
| `files/media.ts` | Baja las capturas de la tarea con `fetch` y las guarda como `blob:` mientras la tarea está abierta (la siguiente, un paso antes); las suelta al cerrarla |
| `files/online.ts` | Avisa cuando vuelve la conexión, para pedir lo que no llegó |
| `state.ts` | Las acciones con nombre y su reductor: `chooseDevice`, `openTask`, `goToStep`, `next`, `previous`, `openAllSteps`, `closeAllSteps`, `closeSheet`, `playClip` |
| `search.ts` | El buscador, con sus topes |
| `icons.ts` | El juego de íconos del manual, copiados de Lucide como los de `ui/icon`; se baja con la pantalla, así el arranque no crece |
| `useManual.ts` | Une todo para la pantalla: carga, estado, capítulo y buscador |
| `view.ts` | Lo que reciben las pantallas (`View`) y si la ventana es angosta |
| `texts.ts` | Los textos de la pantalla (no los del manual) |
| `screens/Manual/` | La página: cabecera, tareas y paso a paso |
| `screens/Tasks/` | La lista de tareas (`Rows`) y lo encontrado (`Results`) |
| `screens/Guide/` | El paso a paso, con su avance; en el celular, una hoja |
| `screens/Stage/` | La captura con su aro y su rótulo (`Shot`), el clip (`Clip`) y el ícono de un paso sin captura |
| `screens/AllSteps/` | El capítulo entero, para leerlo de corrido; en el celular, otra hoja |
| `screens/SheetStep/` | Una hoja abierta es un paso de la historia: atrás la cierra |
| `screens/Glyph/` | Un ícono del juego del manual |

Es una sola pantalla para los dos tamaños, con el corte en 900 px, como la maqueta. Un ícono nuevo
de un capítulo es un renglón en `icons.ts`.

### Cómo se abre (R6.1, E32, E33)

- `App` muestra el manual cuando la dirección empieza con `/manual`, **haya o no sesión**. El
  manual no lee la sesión ni la persona, ni pide nada a `/api` (R6.2, E53).
- **Lo de abajo:** sin sesión, la entrada **se desmonta** mientras el manual está abierto (no tiene
  nada a medio hacer, y así se cierran su canal del QR y la renovación de Google, ADR-003); al volver
  se monta de nuevo. Con sesión, el marco queda montado (guarda lo que se estaba haciendo, E37) pero
  con `inert` y oculto: no se lee ni se toca. La pantalla de trabajo tampoco se desmonta con
  `/manual`: el manual no es una opción de trabajo, así que debajo sigue la que estaba.
- **Lo de arriba:** el aviso de versión nueva, «Hay que actualizar» y «Algo salió mal» van encima
  del manual. Si la sesión se cierra con el manual abierto, la entrada aparece recién al volver.
- **En el ambiente de pruebas** el manual lleva el marco y el cartel, como toda pantalla (R10.1).
- «Ver el manual» de la entrada deja de llevar «Pronto», y Más → Manual tiene su dirección.
  «Ver el manual» se muestra según el dispositivo (`isPhone()`), no según el ancho de la ventana
  (R6.1).

### Cómo se vuelve (R6.7, E37)

- Quien abre el manual hace `navigate('/manual', { state: { from } })`, con `from` de una lista
  cerrada: `entrance`, el id de la parte o la opción abierta (`sell`, `more`) o `app`, si no había
  ninguna parte abierta («Volver a Ferrebress»). El nombre que se muestra sale de esa lista
  («Volver a la entrada», «Volver a Vender»; en el celular, «‹ Más»), nunca de un texto guardado en
  la historia; solo cuentan las claves propias de la lista (`constructor` no es un lugar).
- Cada cambio de tarea o de paso **reemplaza** la dirección, conservando el estado: el botón atrás
  no recorre los pasos.
- Las hojas del celular («el paso a paso», «Todos los pasos») usan `useBackStep`: atrás cierra la de
  arriba.
- **«Volver»** primero cierra lo abierto y después hace `history.back()`. Si el manual se abrió
  escribiendo la dirección (sin `from`), dice «Ir a Ferrebress» y lleva a `/`. Nunca lleva a una
  dirección que venga en la dirección.

**Lo que cambia en `platform/router.ts`** (código común, tarea propia): `navigate(path, { state,
replace })`, el reemplazo conserva el estado, y `route` lee también `search`.

### La dirección y lo que entra de afuera

`d` (`computer` o `phone`), `c` (capítulo), `t` (tarea) y `p` (paso) se aceptan solo si existen en
el índice y en el capítulo; si no, se ignoran y se abre el principio. Si la dirección nombra un
capítulo con la forma de un nombre (`isName`: sin `/`, `.` ni `%`), el índice y el capítulo se piden
a la vez, y el capítulo se usa solo si el índice lo tiene; uno que no existe da 404 y se descarta.
Con otra forma, no se pide nada armado con la dirección.

### El dispositivo (R6.3, E34)

Arranca en el que se usa (`isPhone()`); el selector de arriba cambia todo: la lista de tareas, el
buscador y las capturas. Cambiarlo cierra «Todos los pasos» y vuelve al principio.

### Los capítulos que faltan (R6.4, E35)

`App` le pasa al manual si es el ambiente de pruebas, para su cartel. Debajo de los escritos va
«Próximos capítulos» con los que faltan y «Pronto», también en producción. El orden es siempre el de
`README.md`.

### El buscador (R6.6, R7.4, E36), como la maqueta

- Busca desde dos letras, espera 150 ms sin que se tipee (R7.4) y toma hasta 60 letras.
- Busca en el título, la aclaración, los pasos y los consejos de cada tarea del dispositivo elegido,
  en minúsculas y sin tildes, con todas las palabras; nunca arma una expresión regular con lo que se
  escribe. En pruebas, también en el nombre de los capítulos que faltan, que salen con «Pronto».
- Muestra **una fila por tarea**, agrupadas bajo su capítulo en el orden de `README.md`, con el
  fragmento que coincidió y lo buscado resaltado. El resaltado son elementos `<mark>` que arma
  Preact con los pedazos del texto, no HTML. Sin resultados dice «No encontré «…»».
- Elegir una fila abre esa tarea en el paso donde coincidió.

### El paso a paso

- **La captura:** se achica entera si es más alta que el lugar (no se recorta: el punto quedaría
  corrido).
- **El aro y su rótulo:** el aro va sobre la captura, en el porcentaje de la escena; el rótulo, al
  costado y en diagonal, con una flecha hacia el aro (R6.5). Cambia de lado cerca de un borde y
  puede salir de la captura para leerse entero: va en la capa del paso, no dentro de la captura, y
  se ubica midiendo dónde quedó el aro.
- **Las posiciones se ponen por CSSOM** (`element.style.setProperty` en un efecto), nunca con
  `style="…"` en el HTML: la política `style-src 'self'` no cambia.
- **El clip** (R6.5, E38): un `<video>` con `preload="none"`, `muted`, sin `autoplay` y con el cuadro
  final de imagen de espera: no baja nada hasta que se toca «Ver el clip». Al terminar, «Ver cómo se
  hace» lo vuelve a pasar; «Ver el clip» otra vez lo vuelve a empezar. Con «reducir movimiento»,
  solo el cuadro final.
- **Sin el capítulo** (se cortó la red): el lugar del paso a paso dice «Sin conexión», y en el
  celular es una hoja que se cierra como las otras.
- Las animaciones son las de la maqueta (`../design/mockups/manual/final/changes.md`).

### El teclado (00 · R2)

Como la maqueta: Alt C Computadora, Alt L Celular, Alt O Volver, Alt V Ver el clip (y «Ver cómo se
hace», que vuelve a pasarlo), Alt T Todos los pasos, Alt A anterior, Alt S siguiente, Alt 1 a Alt 9
cada segmento del avance; ← → pasan de paso con el buscador vacío; ↑ ↓ y Enter recorren
los resultados; `/` lleva al buscador; Esc cierra «Todos los pasos» o borra lo buscado. En la
computadora el cursor arranca en el buscador (R2.2); en el celular, en ningún lado (R2.12).

**Lo que se agrega a `platform/keyboard.ts`** (código común, tarea propia), sin que las pantallas
escuchen teclas:

- `data-arrows` en una capa: ← y → tocan sus botones `data-arrow="previous"` y `"next"` en vez de
  cerrar la capa o mover la marca, salvo con el cursor en una caja con texto.
- `data-slash` en una caja: `/` lleva el cursor ahí.
- `data-clear` en una caja: Esc la vacía si tiene texto, antes de cerrar nada.
- La capa del manual no lleva `data-close` en su raíz: Esc nunca saca del manual; se sale con Alt O.

## 6. Conexiones

Ninguna de `realtime`. Solo pedidos de archivos fijos, al abrirlo.

## 7. Sin conexión

No baja nada ni encola nada (R6.8, E39). Su conducta sin conexión está en § 4.

## 8. Seguridad

- **Datos que toca:** ninguno del negocio ni de la persona. El manual no lee la sesión, y lo que
  muestra sale del repositorio. Lo de abajo queda desmontado o `inert` (§ 5).
- **Quién puede:** cualquiera, sin haber entrado (R6.2): por eso no puede tener nada que no sea
  público. Las capturas salen de respuestas de mentira con una persona inventada, nunca del servidor
  de pruebas ni del de producción (§ 3).
- **Qué entra de afuera:** lo que se escribe en el buscador, que solo se compara con texto, con
  tope de largo y sin expresiones regulares, y no se manda a ningún lado; y la dirección, que solo
  elige entre lo que existe en el índice (§ 5).
- **El texto se muestra como texto:** la pantalla nunca arma HTML. Un control en `pnpm lint`
  rechaza `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write` y
  `setAttribute('style', …)` en `src/app`. El lector rechaza `<`, `>` y entidades en el Markdown.
- **La política de contenido no cambia:** todo sale del mismo origen (`default-src 'self'` cubre los
  videos; `img-src` ya admite `blob:`). La prueba de punta a punta recorre el manual y falla con
  cualquier `securitypolicyviolation`.
- **«Volver»** solo usa la historia o `/`, con un nombre de una lista cerrada.
- **La cadena de armado:** el lector solo abre archivos de `docs/manual/` con nombres comprobados,
  sin enlaces simbólicos y con topes (§ 2). El programa de capturas no puede pedir nada fuera del
  servidor de mentira (§ 3).
- **Secretos:** ninguno. **Auditoría:** nada; no hay datos ni acciones del negocio.

## 9. Metas de performance

Las controla `pnpm manual` (los topes de § 2) y, para el arranque, `pnpm boot`.

- **Antes de abrirlo:** cero bytes. El arranque de la aplicación crece lo de `ManualSlot` y `place/`
  (la dirección, «Volver», la pantalla sin internet y el `import()`), con lo que se sumó al marco
  (Más → Manual): unos 1,2 KB comprimidos, medido con `pnpm boot`.
- **Al abrirlo en la computadora:** el código (menos de 20 KB comprimido, lo controla `pnpm boot`)
  y, a la vez, el índice; con el capítulo en la dirección, también el capítulo. Sin él (abierto desde
  Más o desde la entrada), el capítulo se pide al llegar el índice, porque recién ahí se sabe cuál
  es el primero: código → índice → capítulo → captura, 4 pedidos en cadena (el índice y el capítulo,
  menos de 10 KB juntos; la captura, menos de 90 KB), visible en menos de 1 segundo con 4G. En el
  celular, nada más que el código y el índice hasta tocar una tarea.
- **Buscar:** el archivo del dispositivo se baja una vez al escribir; buscar tarda menos de 5 ms con
  todos los capítulos escritos.
- **Pasar de paso:** nada, salvo la captura siguiente, que se bajó un paso antes. Volver atrás no
  pide nada.

## 10. Pruebas

| Escenarios | Prueba |
|---|---|
| E32, E33 | Unitarias de `App`: se abre desde la entrada y desde Más, sin sesión y con sesión; la entrada se desmonta y el marco queda `inert` |
| E37 | Unitarias de `useManual` y del router: «Volver» cierra lo abierto y vuelve; la dirección se reemplaza sin perder el estado; sin `from`, «Ir a Ferrebress» |
| E34, E36 | Unitarias del reductor y de `search.ts`: el selector cambia todo; el buscador solo trae lo del dispositivo, una fila por tarea en el orden de la lista, con `<mark>`, y lleva al paso |
| E35 | Unitaria de la pantalla con un índice de prueba, en pruebas y en producción |
| E38 | Unitaria del clip: quieto, mudo, sin bajar nada hasta que se lo pide; con «reducir movimiento», el cuadro final |
| E39 | Unitaria de `kindOf`: nada de `/manual/` entra en la caja. `pnpm boot`, sobre la aplicación armada: el código del manual está en `manual/app-*.js` y `manual/app-*.css`, nada de él queda en `assets/` y no pasa de 20 KB con gzip |
| E53 | Unitaria del manual: con una sesión abierta, no muestra nada de la persona y no hace ningún pedido fuera de `/manual/` (se espía `fetch`) |
| R4.4 | Unitarias: sin conexión, «Ver el manual» y Más → Manual grises; con el manual abierto, lo que no llegó dice «Sin conexión» |
| La dirección | Unitarias de `address.ts`: valores que no existen, `c=../api/start` y parecidos se ignoran |
| El teclado | Unitarias de `data-arrows`, `data-slash` y `data-clear` en `platform/keyboard.ts` |
| El lector | Unitarias de cada error de § 2 (también un enlace fuera de `docs/manual/`, un enlace simbólico, un archivo disfrazado y uno pasado de tope) y de lo que arma con un manual de prueba |
| Pantallas | Capturas de referencia (`tests/screens/manual.spec.ts`) con el manual de prueba de `tests/manual/fixture/`, que no cambia cuando cambia el de verdad |
| De punta a punta | Una sola, aprobada por Carlos, en `tests/e2e/headers.spec.ts`: lo de `/manual/` sale con `no-store` y la política de la aplicación, lo que falta da 404, y abrir una tarea no viola la política de estilos (lo pone Caddy, que solo corre en el stack de Docker) |

**01 · E39** («Ver el manual» con «Pronto») deja de poder darse: se retira el escenario de 01 junto
con su prueba, y R7.2 de 01 pierde la frase de «mientras el manual no exista».

## 11. Tareas

1. `docs/manual/README.md` con la lista y `sign-in.md` con el capítulo «Entrar», de la maqueta
   aprobada.
2. `[P]` El lector de `tools/manual/`, el complemento y `pnpm manual`, con sus pruebas.
3. `[P]` Código común: `navigate` con estado y `search` en el router; `data-arrows`, `data-slash` y
   `data-clear` en el teclado; el control contra HTML armado como texto. Cada uno se toma como
   tarea de código común.
4. `tests/manual/` y `pnpm manual:media`: las escenas, la página del clip y la comprobación de
   huellas. Sacar todo (depende de 2).
5. La pantalla, con sus pruebas (depende de 2 y 3).
6. Abrirla desde la entrada y desde Más, sin conexión en gris, lo de abajo; Caddy, Vite y el
   Dockerfile; retirar 01 · E39 (depende de 5).
7. Las capturas de referencia con el manual de prueba y la prueba de las cabeceras del manual.
8. Las revisiones del código y de seguridad (paso 7).
