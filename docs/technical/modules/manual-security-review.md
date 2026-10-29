# Revisión de seguridad · 00 · El manual (`manual`)

## Paso 4: el diseño

Revisión independiente del [diseño](manual.md) desde el punto de vista de un atacante
(constitución, paso 4). Todavía no hay código del módulo. Leí la constitución, la parte 6 del
[capítulo 00](../../chapters/00-app/rules.md) (R6.1 a R6.8, E32 a E39, E53) y su parte 10 (R10.1,
E51), la [arquitectura](../architecture.md), la [maqueta aprobada](../../design/mockups/manual/final/)
y lo que ya existe y el diseño toca: `deploy/Caddyfile`, `deploy/web.Dockerfile`, `src/app/sw.ts`,
`src/app/platform/offline/worker.ts`, `src/app/App.tsx`, `src/app/platform/router.ts`,
`src/app/vite.config.ts`, `tests/screens/serve.ts`, `tests/screens/run.ts`,
`tests/screens/google-button.js`, `tests/e2e/headers.spec.ts`, `biome.json` y
`.github/workflows/deploy.yml`.

- **Frena:** se puede entrar, ver o cambiar lo ajeno, o filtrar datos personales. Se resuelve antes
  de aprobar el diseño.
- **Mejora:** conviene hacerla; no frena.

## Resumen

El diseño parte bien: el manual son archivos fijos del mismo origen, sin `/api`, sin sesión, sin
terceros y sin nada guardado en el dispositivo; el texto se muestra como texto, el complemento
rechaza `<` y «Volver» solo usa la historia o `/`. **No encontré nada que frene.** Los riesgos que
quedan están en los bordes: lo que la maqueta hace con `innerHTML` y que el diseño no dice cómo se
reemplaza (el resaltado del buscador), el orden entre la dirección y el índice al pedir un
capítulo, lo que el complemento acepta leer de disco, el aislamiento del programa de capturas y una
cabecera de Caddy que hoy pisaría la del manual.

| # | Punto | Gravedad |
|---|---|---|
| 1 | El resaltado del buscador y el resto de la maqueta están hechos con `innerHTML` y `style="…"`; el diseño no dice cómo se hace sin eso, y nada lo controla | Mejora importante |
| 2 | El capítulo que se pide puede salir de la dirección antes de validarla contra el índice | Mejora importante |
| 3 | El complemento de Vite: nombres de archivo, enlaces simbólicos, tipos y tamaños de `media/` | Mejora importante |
| 4 | El programa de capturas corre con la red de la máquina y el repositorio montado: nada impide que salga del servidor de mentira | Mejora importante |
| 5 | Datos de personas y del ambiente en las capturas: el correo de la persona inventada, el cartel de pruebas, el QR, los metadatos | Mejora |
| 6 | La conversión a WebP no está definida y puede traer una dependencia nativa sin ADR | Mejora |
| 7 | Caddy: `@fresh` también toca `/manual/*` y pisaría el `no-store`; un archivo que falta devuelve la página con 200 | Mejora |
| 8 | El service worker: que el código del manual quede fuera de la caja depende del nombre que Vite le ponga | Mejora |
| 9 | «Volver»: el nombre que se muestra sale del estado de la historia como texto libre | Mejora |
| 10 | Con sesión, el marco y la persona siguen dibujados debajo del manual; sin sesión, la entrada sigue viva debajo | Mejora |
| 11 | El cartel del ambiente de pruebas queda tapado por el manual (R10.1, E51) | Mejora |
| 12 | El buscador: largo de lo escrito y nada de expresiones regulares armadas con eso | Mejora |
| 13 | El servidor de desarrollo de Vite y `docs/manual/` | Mejora |

---

## Los puntos

### 1 · El resaltado del buscador y lo que la maqueta arma con `innerHTML` (§ 5 «El buscador», § 8 «El texto se muestra como texto») — Mejora importante

**Dónde.** La maqueta aprobada, que es la referencia de cómo se ve, arma casi todo con cadenas de
HTML: `docs/design/mockups/manual/final/manual.js` líneas 43, 121, 133 a 142, 176 y 199
(`innerHTML` con `sec.title`, `ch.lead`, `x.t`, los consejos), y línea 74 con
`style="left:…%;top:…%"` para el aro. El buscador resalta lo encontrado con
`content.js:157-168` (`mark`), que escapa el texto y le inserta `<mark>` como cadena. El diseño
dice «la pantalla nunca arma HTML con el contenido», pero no dice cómo se hace el resaltado (que
la maqueta tiene y la pantalla va a copiar), y `biome.json` solo prohíbe
`dangerouslySetInnerHTML` en JSX: `element.innerHTML = …` sobre una referencia, o
`insertAdjacentHTML`, pasan el control.

**El ataque.** Quien escribe un capítulo (un redactor, o un agente con instrucciones metidas en
un texto que leyó) deja un paso con `&lt;img src=x onerror=…&gt;` o con un `&` en un lugar
donde el resaltado lo parte. El complemento rechaza `<`, pero no `&`. Si el desarrollador copia
el `mark` de la maqueta y lo pinta con `innerHTML` sobre una referencia de Preact: con el escape
bien hecho, la entidad partida solo rompe el texto; con un escape olvidado en un solo campo (el
título de la tarea en la línea 30 de `manual.js` pasa por `taskHTML`), el `&lt;` del Markdown
llega como `&lt;` al JSON, y si en algún paso se decodifica, se ejecuta. Lo frena la política de
contenido (`script-src 'self'` sin `'unsafe-inline'` bloquea `onerror`), así que hoy el impacto
es bajo; pero la política es la segunda barrera, no la única.

Del lado del aro, copiar `style="left:…"` de la maqueta como atributo (o con
`setAttribute('style', …)`) lo bloquea `style-src 'self'`: el aro sale en la esquina y el manual
se ve roto solo en Caddy, porque `tests/screens/serve.ts` no manda ninguna política de contenido
y las capturas de referencia no lo detectarían.

**Qué propongo.**
- Escribir en § 5 que el resaltado parte el texto en trozos y arma `<mark>` como elementos de
  Preact (`[texto, <mark>palabra</mark>, texto]`), nunca como cadena. Costo: ninguno, es una línea
  del diseño.
- Un control en `pnpm check` (Biome con una regla propia, o un `grep` en `tools/`) que rechace
  `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write` y `setAttribute('style'` en
  `src/app/` fuera de las pruebas. Costo: media hora.
- Que el complemento rechace también `&` seguido de letras y `;` (entidades), para que el texto
  sea texto de punta a punta. Costo: una línea y su prueba.

**Pruebas.** Unitaria de `search.ts` y de la pantalla: un capítulo de prueba con «Tornillos &
tuercas» y la búsqueda «amp» muestra el texto intacto y ningún `<mark>` partiendo la entidad;
unitaria del complemento: un paso con `&lt;img&gt;` frena el armado. De punta a punta, en
`tests/e2e/manual.spec.ts`: escuchar `securitypolicyviolation` en la página y la consola durante
todo el recorrido, y exigir cero violaciones (es la única prueba que corre con la política de
Caddy).

### 2 · El capítulo que se pide sale de la dirección (§ 5 «Cómo se abre», § 8 «Qué entra de afuera») — Mejora importante

**Dónde.** La dirección lleva `d`, `t` y `p`, y `api.ts` pide «el capítulo». El diseño dice que
la dirección «solo se acepta si es un dispositivo, una tarea y un paso que existen», pero no dice
**en qué orden**: para saber si la tarea existe hay que tener el índice o el capítulo, y la forma
más directa de programarlo es `fetch(`/manual/${capítulo}.json`)` con lo que vino en la
dirección, y validar después.

**El ataque.** Alguien manda por WhatsApp a quien atiende el enlace
`https://<ferrebress>/manual?t=../api/start%3F&d=celular`. Si el capítulo se arma con el texto de
la dirección, el navegador normaliza `/manual/../api/start?.json` a `/api/start?.json`: un `GET` del
mismo origen, con la cookie de la sesión de la víctima, a una ruta que el atacante elige. Hoy no
encontré un `GET` de `/api` que cambie algo, y lo que responde lo ve solo la víctima en su
pantalla (la política `connect-src 'self'` impide mandarlo afuera), así que no pude armar un daño
concreto; pero rompe la promesa de E53 («no pide nada a `/api`») y queda abierto para cualquier
`GET` que se agregue después.

**Qué propongo.** Escribir en § 5 que primero se baja `index.json`, y que el archivo del capítulo
se toma **del índice** (el `id` del renglón cuya tarea coincide), nunca del texto de la dirección;
`p` se acepta solo como entero entre 1 y la cantidad de pasos. Costo: ninguno en código, es el
orden de dos pedidos que ya están.

**Prueba.** Unitaria de `useManual` con `fetch` espiado: con
`/manual?t=../api/start&d=tablet&p=-1` y con `?t=%2e%2e%2fapi`, el manual abre en el principio,
del dispositivo que se usa, y **ningún** pedido sale de `/manual/` (ni a `/api`). Es la misma
prueba de E53, extendida.

### 3 · Lo que el complemento acepta leer y copiar (§ 2 «Cómo se arma») — Mejora importante

**Dónde.** El complemento lee `docs/manual/README.md`, sigue los enlaces de cada renglón
(`[sign-in.md](sign-in.md)`) y copia `docs/manual/media/*` a `dist/manual/media/`. El diseño
valida la forma del contenido, pero no qué archivos se pueden abrir ni qué se copia.

**El ataque.**
- Un renglón cuyo enlace apunta a `../../.env` o a una ruta absoluta: el complemento abre un
  archivo fuera de `docs/manual/`. En la imagen de GitHub (`deploy.yml`) no hay `.env`, pero
  `pnpm check` y `pnpm boot` arman la aplicación en la máquina de quien programa, donde sí puede
  haber un `.env` con secretos; el armado frena porque no tiene la forma de un capítulo, y el
  mensaje de error «con el archivo y el renglón» puede imprimir ese renglón en la consola o en un
  registro de CI.
- Un enlace simbólico en `media/` (git los guarda) a un archivo de la máquina: si el complemento lo
  sigue y la captura se usa, el contenido de ese archivo termina en `dist/manual/media/` y lo
  sirve Caddy a cualquiera, sin sesión.
- Un archivo de `media/` que no es lo que dice: un HTML llamado `.webp`. Caddy lo sirve como
  `image/webp` con `nosniff`, así que no se dibuja como página (lo comprobé en el `Caddyfile`:
  `X-Content-Type-Options nosniff` va en todas las respuestas). Lo que sí pasa es un archivo de
  varios MB que cada celular baja con datos.
- `points.json` con un valor que no es número (`"50%; background:url(//otro)"`): por CSSOM no se
  aplica un valor inválido, así que no pude armar un daño; pero no hay motivo para aceptarlo.

**Qué propongo.** En el complemento: nombres de capítulo con `^[a-z0-9-]+\.md$` y de medios con
`^[a-z0-9.-]+\.(webp|webm)$`, resueltos y comprobados **dentro** de `docs/manual/`; `lstat` y
rechazo de enlaces simbólicos; tope de tamaño por archivo (80 KB las capturas, 1 MB los clips,
los del § 3) y comprobación de la firma del archivo (`RIFF…WEBP`, la cabecera EBML de WebM);
puntos como números entre 0 y 100. Los errores dicen archivo y número de renglón, no el contenido
del renglón. Costo: una tarde con sus pruebas.

**Pruebas.** Unitarias del complemento, una por caso, con un `docs/manual/` de prueba: enlace
`../../.env` y ruta absoluta, enlace simbólico en `media/`, un `.html` renombrado a `.webp`, una
captura de 200 KB, un punto `"50%"` o `120`: cada uno frena el armado y el mensaje no contiene el
texto del archivo ajeno.

### 4 · El programa de capturas sale de su caja (§ 3) — Mejora importante

**Dónde.** `tests/manual/capture.ts` corre como las capturas de referencia: `tests/screens/run.ts`
lanza la imagen de Playwright con `--network host` y el repositorio entero montado con escritura
(`-v ${root}:/repo`), como `root` dentro del contenedor. El diseño dice que las capturas salen del
servidor de mentira, «nunca del de pruebas ni del de producción», pero nada lo hace cumplir.

**El ataque (por error, que es el caso real).** Una escena nueva navega a una dirección absoluta,
o un cambio de la aplicación hace que pida algo a otro sitio (el script de Google de verdad, si
`googleScriptUrl` cambia), o quien programa corre el programa con `SCREENS_PORT` apuntando a un
servidor levantado a mano contra la base de pruebas. Con la red de la máquina, el navegador llega
a la red local y a Tailscale: la captura sale con datos del ambiente de pruebas o con el botón de
Google de verdad, y se publica en un repositorio público. Además, el contenedor ve el `.env` de
quien lo corre, si existe.

**Qué propongo.** En `capture.ts`: un origen fijo (`http://127.0.0.1:<puerto>`) y
`context.route('**', …)` que **aborte todo pedido que no sea de ese origen** y falle la corrida
nombrando la dirección; no leer del entorno más que el puerto. Si se puede, correrlo sin
`--network host` (una red de Docker propia con el servidor de mentira adentro). Costo: una hora.

**Prueba.** Que el programa registre cada pedido y termine con error si alguno salió del origen
fijo; una escena de prueba que pide `https://example.com/x.png` hace fallar la corrida.

### 5 · Personas, ambiente y metadatos en las capturas (§ 3, R6.5, E53) — Mejora

**Dónde.** § 3 dice que la persona es inventada («Ana Gómez, Administrador»), pero la persona del
contrato tiene también `email` (`src/shared/contracts/sign-in.ts:29-36`), que el diseño no fija.
`tests/screens/serve.ts` contesta hoy `environment: 'testing'`, y el diseño dice que para el
manual contesta `production` sin decir cómo se elige.

**El riesgo.**
- Un correo inventado en un dominio que existe (`ana@gmail.com`, o el del dueño) termina en una
  captura pública: es el correo de alguien real.
- Si el cambio a `production` se olvida en una escena, la captura sale con el marco magenta y el
  cartel, y con «Pronto» en el menú (contra R6.5).
- El QR de la entrada sale en la captura y se puede escanear desde la pantalla del manual. Lo
  revisé: lleva `http://<origen del servidor de mentira>/link#captura-fija`, y el escáner del
  celular rechaza otro origen (`src/app/modules/sign-in/codes/qr.ts:26`), así que no sirve para
  entrar. Solo hay que cuidar que el origen sea siempre el fijo del punto 4 y no un nombre de la
  red de Tailscale.
- Un archivo de `media/` sacado a mano con un celular (en vez del programa) lleva EXIF: modelo,
  fecha y, a veces, ubicación de la ferretería.

**Qué propongo.** Fijar en § 3 el correo `ana.gomez@example.com` (dominio reservado) y cualquier
otro dato inventado en `example.com`; que `serve.ts` tome el ambiente de un parámetro del programa;
que `capture.ts`, antes de guardar cada escena, compruebe que no está el cartel «Ambiente de
prueba · nada de esto es real» ni «Pronto», y que no aparece en la página ningún `@` fuera de
`example.com`; que el programa escriba en `points.json` la huella (SHA-256) de cada archivo que
saca, y que el complemento rechace un archivo de `media/` cuya huella no esté (así no entra una
foto hecha a mano). Costo: dos horas.

**Prueba.** La comprobación de antes de guardar es la prueba (falla la corrida); y una unitaria
del complemento: un `.webp` con una huella que no está en `points.json` frena el armado.

### 6 · De dónde sale el WebP (§ 3) — Mejora

**Dónde.** § 3: «Guarda `docs/manual/media/<escena>.webp`». Las capturas de Playwright solo salen en
PNG o JPEG; el diseño no dice qué convierte a WebP.

**El riesgo.** La salida obvia es sumar `sharp` (libvips, código nativo, con fallas conocidas en
el pasado al leer imágenes) o un `cwebp` bajado aparte, sin ADR (la constitución lo pide para una
biblioteca de peso) y sin pasar por `pnpm audit`.

**Qué propongo.** Codificar en el mismo Chromium de la imagen de Playwright: la captura en PNG se
dibuja en un `canvas` de la página y se saca con `canvas.toBlob(…, 'image/webp', calidad)`. No
suma dependencias y, de paso, no deja metadatos. Escribirlo en § 3. Costo: ninguno extra.

**Prueba.** La del complemento del punto 3 (firma y tamaño) cubre lo que sale.

### 7 · Caddy: `@fresh` pisa el `no-store` y el archivo que falta devuelve la página (§ 4, R6.8) — Mejora

**Dónde.** `deploy/Caddyfile`: `@fresh not path /assets/*` pone `Cache-Control "no-cache"` a todo lo
que no es `/assets/`, **también a `/manual/*`**. Si se agrega `header @manual Cache-Control
no-store` sin sacar `/manual/*` de `@fresh`, las dos cabeceras compiten y gana la que Caddy aplique
última según su orden; no lo pude comprobar sin correr Caddy. Con `no-cache` el navegador sí lo
guarda en su caché (solo lo revalida), contra R6.8. Además, `try_files {path} /index.html` hace
que `/manual/no-existe.json` responda la página de la aplicación con 200 y `text/html`.

**El riesgo.** No es un ataque (el contenido es público): es que la regla «no se guarda en el
dispositivo» falle sin que nadie lo note, y que un capítulo que falta se vea como un error de
JSON en vez de un 404.

**Qué propongo.** `@fresh not path /assets/* /manual/*` y un bloque `handle /manual/*` con
`Cache-Control no-store` y `file_server` sin `try_files` (404 de verdad). Costo: cinco renglones.

**Prueba.** Extender `tests/e2e/headers.spec.ts`: `/manual/index.json` lleva `cache-control:
no-store`, `content-type: application/json`, `nosniff` y la política estricta; una captura de
`media/` también `no-store`; `/manual/no-existe.json` da 404; y la página `/manual` sigue con
`no-cache`, la política estricta y `X-Frame-Options: DENY`.

### 8 · El service worker depende del nombre del archivo (§ 4, E39) — Mejora

**Dónde.** `kindOf` (`src/app/platform/offline/worker.ts:15-22`) devolvería `skip` para
`/assets/manual-`. Pero `vite.config.ts` nombra los trozos `assets/[name]-[hash].js`, y el nombre de
un trozo cargado con `import()` es el del archivo importado (`index-…`, `Manual-…`), no el del
módulo; lo mismo los íconos o letras que importe solo el manual.

**El riesgo.** Si el nombre no empieza con `manual-`, el código del manual entra a la caja del
celular con trabajo sin conexión (E39 falla). No es una filtración; lo anoto porque el diseño lo
presenta como garantía.

**Qué propongo.** Fijar el nombre en `vite.config.ts` (`chunkFileNames` o `manualChunks` para
`modules/manual/`) y escribirlo en § 4. Costo: unos renglones.

**Prueba.** La de punta a punta que ya propone el diseño (la caja sin nada del manual), corrida
sobre la imagen armada, no sobre una unitaria de `kindOf` con un nombre inventado.

### 9 · El nombre de «Volver» viene del estado de la historia (§ 5 «Cómo se abre», R6.7) — Mejora

**Dónde.** «guardan en el estado de la historia desde dónde se abrió y su nombre».

**El riesgo.** Solo una página del mismo origen escribe `history.state`, así que no pude armar un
ataque desde afuera; y «Volver» usa `history.back()` o `/`, nunca una dirección, así que no hay
redirección abierta. Pero guardar el **texto** del nombre hace que «Volver a …» muestre lo que haya
en el estado, también uno viejo de otra versión.

**Qué propongo.** Guardar solo una clave de una lista cerrada (`entrance` o el `id` de la parte del
menú) y sacar el texto de `texts.ts`; una clave desconocida es «Ir a Ferrebress». Que los cambios
de paso usen `replaceState` conservando ese estado. Costo: ninguno.

**Prueba.** Unitaria de `useManual`: con `history.state = { from: 'https://otro.example', name:
'<b>x</b>' }`, y con `/manual?back=https://otro.example`, dice «Ir a Ferrebress» y lleva a `/`;
ningún camino asigna `location.href`.

### 10 · Lo que queda dibujado debajo del manual (§ 5, E53) — Mejora

**Dónde.** `App` muestra el manual «encima de todo». En `App.tsx:160-175`, el `Frame` (con la
persona) o la `Entrance` (con el QR vivo y su canal en tiempo real) siguen montados.

**El riesgo.** Con sesión, el nombre y el correo de la persona siguen en la página, debajo; con
Tab o con un lector de pantalla se puede llegar a ellos, y la prueba de E53 que propone el diseño
(«no muestra el nombre») **pasaría o fallaría según cómo se busque**: `getByText('Ana Gómez')`
lo encuentra en el marco de abajo. Sin sesión, la entrada sigue rotando el QR y con su canal
abierto mientras se lee el manual. No es una filtración a otro (es la propia persona), pero la
regla dice que el manual no muestra datos.

**Qué propongo.** Mientras el manual está abierto, lo de abajo va con `inert` y `aria-hidden`, y la
entrada no pide códigos (o no se monta). Costo: poco.

**Prueba.** Unitaria de E53 con sesión: dentro de la región del manual no está el nombre ni el
correo, y lo de afuera tiene `inert`; sin sesión, con el manual abierto, no se abre el canal de
códigos de la entrada.

### 11 · El cartel del ambiente de pruebas queda tapado (R10.1, E51) — Mejora

**Dónde.** `TestEnvironment` se dibuja dentro del `Frame` y de la `Entrance`
(`Frame.tsx:81`, `Entrance.tsx:60`); el manual va encima de los dos.

**El riesgo.** En el ambiente de pruebas el manual se ve igual que en producción: quien lo mira o
le saca una captura no sabe en cuál está. R10.1 pide el marco en toda pantalla.

**Qué propongo.** Que el manual, que ya recibe si es el ambiente de pruebas, dibuje
`TestEnvironment`, o que el cartel quede por encima de todo. Costo: un renglón.

**Prueba.** Unitaria: el manual en pruebas muestra «Ambiente de prueba · nada de esto es real»; en
producción, no.

### 12 · Lo que se escribe en el buscador (§ 5 «El buscador», R6.6) — Mejora

**Dónde.** `search.ts`: «minúsculas, sin tildes, todas las palabras».

**El riesgo.** Lo escrito solo se compara en el dispositivo, así que no pude armar un ataque a
otro. Si alguien arma la búsqueda con `new RegExp(lo escrito)`, un texto como `(a+)+$` cuelga la
pestaña; un texto pegado de miles de caracteres multiplica el trabajo.

**Qué propongo.** Comparar con `includes` sobre el texto normalizado (nunca `RegExp` con lo
escrito) y cortar lo escrito en 80 caracteres. Escribirlo en § 5. Costo: ninguno.

**Prueba.** Unitaria de `search.ts`: con `(a+)+$`, `[` y un texto de 10 000 caracteres, no tira error
y responde en menos de 5 ms (la meta del § 9).

### 13 · El servidor de desarrollo y `docs/manual/` (§ 2) — Mejora

**Dónde.** `docs/manual/` queda fuera de `src/app/`, la raíz de Vite. Para verlo en `pnpm dev`, lo
fácil es ampliar `server.fs.allow` a la raíz del repositorio.

**El riesgo.** Vite tuvo este año varias fallas que saltean `server.fs.deny` en el servidor de
desarrollo (CVE-2026-39364, explotada; CVE-2026-53571, en Windows). La versión del repositorio
(8.3.5) es posterior a las correcciones (8.0.5 y 8.0.16), pero ampliar `fs.allow` a todo el
repositorio deja el `.env` y el resto a un paso de la próxima.

**Qué propongo.** Que en desarrollo el complemento sirva `/manual/*` desde lo que ya armó en memoria
(un `configureServer` con su propio manejador), sin tocar `server.fs.allow`. Costo: unos renglones.

**Prueba.** Unitaria del complemento: su manejador de desarrollo contesta `/manual/index.json` y
da 404 a `/manual/../.env` y a `/manual/%2e%2e/package.json`.

---

## Lo que revisé y está bien

- **Entrar sin permiso y sesiones:** el manual no lee la sesión ni la usa; no hay nada que robar ni
  fijar.
- **Permisos:** no hay rutas, eventos ni canales nuevos. Que se abra sin entrar está bien porque
  todo lo que muestra es público (sale de un repositorio público).
- **Lo que el índice deja ver en producción:** `index.json` lleva también los capítulos que faltan,
  aunque la pantalla no los muestre; son nombres de módulos que ya están en el repositorio. Nada
  que proponer.
- **Política de contenido:** todo del mismo origen; `default-src 'self'` cubre los videos e
  `img-src 'self'` las capturas; la página `/manual` es la de la aplicación y lleva
  `frame-ancestors 'none'` y `X-Frame-Options: DENY`. La excepción de `'unsafe-inline'` sigue
  solo en `/google-button.html`. Si los dos clips se sincronizan, que sea con `src` del mismo
  origen y no con `MediaSource` y `blob:` (pediría abrir `media-src`).
- **Redirección abierta:** «Volver» solo usa la historia o `/` (con lo del punto 9).
- **Datos que salen de la máquina:** ninguno; no hay terceros ni cabeceras nuevas.
- **Abuso y disponibilidad:** archivos fijos que sirve Caddy, sin base ni memoria del servidor; el
  mismo riesgo que cualquier otro archivo público, acotado por los topes de tamaño del punto 3.
- **Sin conexión:** no se hace nada sin conexión; nada que falsear.
- **Auditoría:** no hay acciones ni datos del negocio; está bien que no registre nada.
- **Despliegue:** la imagen se arma en GitHub desde el repositorio (`deploy.yml`), sin `.env`; el
  Dockerfile copiaría solo `docs/manual/`. Hoy no hay `.dockerignore`: no hace falta para esto,
  porque el Dockerfile copia carpetas puntuales.
- **Dependencias:** el diseño no suma ninguna (salvo el riesgo del punto 6). `pnpm audit --prod`:
  sin fallas conocidas. Playwright 1.56.1 ya tiene la corrección de CVE-2025-59288 (descarga de
  navegadores sin verificar el certificado, corregida en 1.55.1), y su imagen va fijada por huella
  en `tests/screens/run.ts`. Vite 8.3.5: ver el punto 13.

---

## Paso 7: el código

Revisión del código del manual (commits `8a348e3`, `442792b`, `7f54aad`, `97322e1` y `f0be623`)
contra el [diseño](manual.md) y contra los puntos del paso 4. Leí `tools/manual/`,
`tools/checks/raw-html.ts`, `src/app/modules/manual/`, `src/app/App.tsx`,
`src/app/platform/router.ts` y `keyboard.ts`, `src/app/modules/frame/menu.ts`,
`src/app/vite.config.ts`, `tests/manual/`, `tests/screens/run.ts` y `serve.ts`, `deploy/Caddyfile`,
`deploy/web.Dockerfile`, `tests/e2e/headers.spec.ts` y `docs/manual/` con `media/`.

Lo que corrí:

- Las unitarias del manual, de `tools/` y de `platform/` (22 archivos, 123 pruebas): pasan.
  `pnpm manual`, el control de HTML armado (`tools/cli.ts html`) y `pnpm audit --prod` («No known
  vulnerabilities found»): sin problemas.
- El armado con Vite en una carpeta aparte: el código del manual sale solo en
  `manual/app-*.js` (8,7 KB comprimido) y `manual/app-*.css`; nada del manual cae en `/assets/`, así
  que el service worker no lo guarda (paso 4, punto 8).
- **Caddy de verdad** (la imagen fijada del Dockerfile, con el `Caddyfile` del repositorio cambiado
  solo de puerto, sobre ese armado): `/manual/index.json`, una captura, el clip y el código salen con
  `Cache-Control: no-store`, la política estricta, `X-Frame-Options: DENY` y `nosniff`;
  `/manual/nada.json`, `/manual/` y `/manual/media/` dan 404 (sin listado); `/manual` y
  `/manual?c=x` dan la página con `no-cache`; `/manual/../manual/index.json` y
  `/manual/%2e%2e/index.html` se normalizan dentro de `/srv`.
- El servidor de desarrollo de Vite: `/manual/index.json` sale de la memoria; `/manual/../.env`,
  `/manual/%2e%2e/package.json` y `/manual/..%2f..%2fpackage.json` dan 404.
- Las capturas y el clip: miré las diez imágenes y una grilla de cuadros del video; decodifiqué el
  QR de `desktop-entrance.webp` (lleva `http://localhost:4189/link#captura-fija`); miré los trozos
  de cada WebP (solo `VP8X`, `ICCP` y `VP8`: sin EXIF ni XMP) y los metadatos del WebM (solo el
  codificador y la duración).
- **No corrí** `tests/e2e.sh` (el stack entero) ni `pnpm manual:media` / `pnpm manual:check` (la
  imagen de Playwright): lo que dicen de la política en el navegador y del encierro del programa de
  capturas lo leí en el código, no lo vi correr.

### Resumen

**No encontré nada que frene.** El manual no guarda nada en el dispositivo (ni `localStorage`, ni
caché, ni el service worker; las capturas viven como `blob:` y se sueltan al cambiar de tarea), no
arma HTML ni pone estilos en el HTML, no pide nada fuera de `/manual/`, «Volver» solo usa la
historia o `/`, y Caddy pone lo que el diseño pide. Las capturas y el clip no tienen datos de nadie
real ni nada del ambiente de pruebas. Los trece puntos del paso 4 están en el código, con huecos
chicos en las pruebas. Lo que queda son mejoras: lo que el lector todavía deja pasar (nombres con
HTML, metadatos en las imágenes, una carpeta `media/` que sea un enlace), lo que el control de HTML
no ve y pruebas que faltan.

| # | Punto | Gravedad |
|---|---|---|
| 14 | El lector no comprueba que la imagen sea la que sacó el programa ni que venga sin metadatos | Mejora importante |
| 15 | El nombre del capítulo (en la lista y en su `# título`) no pasa por la regla de «solo texto» | Mejora |
| 16 | El control de HTML armado no ve `document.writeln` y otras formas; la prueba lo da por bueno | Mejora |
| 17 | El encierro del programa de capturas no tiene una prueba que lo intente, no bloquea el service worker y el servidor de mentira escucha en toda la red | Mejora |
| 18 | `media/` (la carpeta) puede ser un enlace simbólico; el diseño dice que se rechazan | Mejora |
| 19 | El capítulo de la dirección se pide antes del índice (con forma de nombre): el diseño dice dos cosas | Mejora |
| 20 | «Volver» busca en un objeto común: `from: 'constructor'` muestra el texto de una función | Mejora |
| 21 | Los 404 de Caddy salen sin `nosniff` ni HSTS | Mejora |
| 22 | Pruebas que faltan para riesgos que el diseño dice cubrir | Mejora |

### Lo del paso 4, en el código

| Punto del paso 4 | En el código | Prueba que lo intenta |
|---|---|---|
| 1 · HTML armado y estilos | El resaltado son pedazos que dibuja Preact (`search.ts:75-92`, `Rows.tsx:70-73`); el aro y el rótulo van por CSSOM (`Shot.tsx:23-54`); `pnpm lint` corre `tools/checks/raw-html.ts`; el lector rechaza `<`, `>` y entidades (`text.ts:12-17`). Busqué en el armado: ni `innerHTML` ni `style=` en el código del manual | `tools/tools.test.ts:99` (el control), `manual-errors.test.ts:36` (un `&amp;` frena), `headers.spec.ts:41-63` (una tarea abierta sin violaciones de la política). Huecos: puntos 15 y 16 |
| 2 · El capítulo de la dirección | `address.ts` acepta solo lo que existe en el índice; el pedido adelantado acepta solo `^[a-z0-9-]+$` (`useManual.ts:28-45`) | `logic.test.ts:42-55` y `manual-screen.test.tsx:184-197`: con `c=../api/start` abre el principio y todo lo pedido empieza con `/manual/`. Ver punto 19 |
| 3 · Lo que el lector lee | Nombres comprobados, `lstat` en cada archivo, topes, firma de cada tipo y puntos de 0 a 100 (`media.ts`, `build.ts:28-34`); el archivo del capítulo es siempre `<id>.md` (`list.ts:49`), así un enlace a `../../.env` no tiene forma de entrar | `manual-errors.test.ts:145-178` (enlace simbólico, carpeta, HTML disfrazado, pasado de tope, punto fuera de rango) y `:180` (`README.md` enlace). Falta la de un renglón con `../` o una ruta absoluta y la de la carpeta `media/` enlace (punto 18) |
| 4 · El programa de capturas encerrado | `closedContext` (`tests/manual/media.ts:41-56`) corta todo pedido de otro origen y la escena falla (`capture.ts:46`, `clip.ts:88`); el origen es fijo (`playwright.config.ts:16`) y a Docker solo pasa `MANUAL_CHECK` (`run.ts:20-22`) | Ninguna prueba intenta escaparse. Ver punto 17 |
| 5 · Personas, ambiente y metadatos | `ana@example.com` (`scenes.ts:18-23`); `/api/start` contesta `production` en cada escena; antes de guardar se comprueba que no estén el marco ni «Pronto» (`capture.ts:30-33`) | La comprobación de antes de guardar. No hay ninguna para «un `@` fuera de `example.com`» ni para una imagen hecha a mano (punto 14) |
| 6 · WebP sin dependencias | `canvas.toBlob` en el mismo Chromium (`tests/manual/media.ts:60-87`); ninguna dependencia nueva | La firma y el tope del lector |
| 7 · Caddy | `handle /manual/*` con `no-store` y `file_server` sin `try_files` (`Caddyfile:63-68`); `@fresh` ya no lo toca | `headers.spec.ts:41-63`: `no-store` en `index.json`, la política sin `unsafe-inline`, 404. No mira una captura ni que `/manual` siga con `no-cache` y `DENY`; lo comprobé a mano con Caddy (arriba) |
| 8 · El service worker | `chunkFileNames` y `assetFileNames` mandan el manual a `manual/` (`vite.config.ts:54-61`) | `worker.test.ts` (`kindOf` con `/manual/…`); lo comprobé en el armado. No hay una que mire el armado de verdad |
| 9 · «Volver» | Una lista cerrada (`back.ts:11-31`), sin texto de la historia; sin `from`, `/` | `manual-slot.test.tsx:49-58` (`https://otro.sitio`, un número, nada). Ver punto 20 |
| 10 · Lo de abajo | Sin sesión la entrada se desmonta; con sesión el marco va `hidden` e `inert` (`App.tsx`) | `manual-app.test.tsx:31-64` |
| 11 · El cartel del ambiente | `Manual.tsx:127` dibuja `TestEnvironment` | Ninguna del manual (punto 22) |
| 12 · El buscador | `includes` sobre el texto normalizado, hasta 60 letras (`search.ts:9-26`), nunca `RegExp` con lo escrito | Ninguna con `(a+)+$`, `[` o un texto largo (punto 22) |
| 13 · El servidor de desarrollo | Sirve `/manual/` desde la memoria (`vite.config.ts:28-34`), sin tocar `server.fs.allow` | Ninguna; lo comprobé a mano (arriba) |

### 14 · La imagen que se publica no está atada a la que sacó el programa (`tools/manual/media.ts:20-33`, `tests/manual/capture.ts:47-60`) — Mejora importante

**Dónde.** El lector acepta cualquier `.webp` que empiece con `RIFF…WEBP` y pese menos de 90 KB, sin
mirar sus trozos. La huella del JSON de cada escena es la de la captura PNG **sin comprimir**, y
`pnpm manual:check` vuelve a sacar la escena y compara esa huella: nunca mira el `.webp` que se
publica.

**El ataque (por error, que es el caso real).** Quien escribe un capítulo, o un agente, reemplaza
`docs/manual/media/phone-entrance.webp` por una captura hecha con su celular (la pantalla de verdad,
con su cuenta de Google arriba, o una foto del mostrador) y deja el JSON como estaba. Lo probé: le
agregué a esa captura un trozo `EXIF` con «GPS -34.6037,-58.3816 Pixel 8 Juan Perez», armé el manual
con el lector y salió sin ningún problema. `pnpm check` pasa (la huella del PNG no cambió), la imagen
se copia a `dist/manual/media/` y Caddy la sirve a cualquiera, sin sesión, y queda en un repositorio
público. Hoy las diez imágenes están limpias (lo miré); el riesgo es la próxima.

**Qué propongo.** Dos renglones en el lector y uno en el programa:
- Que el lector recorra los trozos del WebP y rechace `EXIF` y `XMP ` (y, en el WebM, cualquier
  etiqueta que no sea `ENCODER` o `DURATION`).
- Que el programa guarde en el JSON también la huella del `.webp` que escribe, y que el lector
  rechace un `.webp` cuya huella no coincida («sacala con `pnpm manual:media`»).

Costo: una hora con sus pruebas.

**Prueba.** Unitarias del lector: un WebP con un trozo `EXIF` frena; un WebP válido con otra huella
frena.

### 15 · El nombre del capítulo no pasa por «solo texto» (`tools/manual/list.ts:43`, `tools/manual/chapter.ts:127`) — Mejora

**Dónde.** El diseño (§ 2) dice que el texto del manual rechaza `<`, `>` y entidades. El lector lo
hace con la introducción, los títulos de las tareas, los pasos, los consejos, las claves y los
rótulos, pero no con el nombre del renglón de `README.md` ni con el `# título` del capítulo (que solo
tiene que ser igual al nombre).

**El riesgo.** Lo probé: con `- sign-in · Entrar <img src=x> &amp; · log-in · sign-in.md` y el mismo
título, el lector no da ningún problema y `index.json` lleva `"Entrar <img src=x> &amp;"`. Preact
lo dibuja como texto, así que **no se ejecuta nada**: no pude armar un ataque. Pero es la única
puerta por la que el contenido con HTML llega a la pantalla, y si mañana algo lo pinta como HTML
(un título de pestaña, una notificación), ya no hay barrera en el lector.

**Qué propongo.** Pasar `name` por `textProblem` en `entryOf` (y rechazar «·» ahí, como en los
rótulos). Costo: un renglón.

**Prueba.** Unitaria del lector: un renglón con `<b>` en el nombre y otro con `&amp;` frenan.

### 16 · Lo que el control de HTML armado no ve (`tools/checks/raw-html.ts:7-8`, `tools/tools.test.ts:105`) — Mejora

**Dónde.** La expresión busca `\bdocument\.write\b`, que no encuentra `document.writeln` (la `l` sigue
la palabra). La prueba del control lo deja escrito como correcto: `src/app/d.ts` tiene
`document.writeln` y la prueba espera que **no** se avise. Tampoco ve `srcdoc`,
`createContextualFragment`, `setHTMLUnsafe`, `DOMParser` ni `outerHTML` partido en dos renglones.

**El riesgo.** Es la primera barrera contra HTML armado con texto (la segunda es la política de
contenido, que bloquearía los `onerror`). Un `document.writeln(texto)` o un `iframe.srcdoc = …`
pasan `pnpm lint`. No es un ataque de afuera: es un error que el control promete atajar y no ataja.

**Qué propongo.** Ampliar la expresión a `document\.write(ln)?`, `srcdoc`, `createContextualFragment`,
`setHTMLUnsafe` y `parseFromString`, y corregir la prueba: `document.writeln` tiene que avisar.
Costo: diez minutos.

### 17 · El encierro del programa de capturas (`tests/manual/media.ts:41-56`, `tests/screens/serve.ts:63`, `tests/screens/run.ts:29-46`) — Mejora

**Dónde y qué pasa.**
- El corte de `context.route('**/*', …)` es lo que pidió el paso 4 y está bien hecho (compara el
  origen, no el texto). Pero **ninguna prueba lo intenta**: si mañana alguien cambia `'**/*'` por un
  patrón más angosto, o el `route.fallback()` de lugar, las capturas siguen saliendo.
- `context.route` de Playwright no ve lo que pide un service worker que contesta él mismo, y el armado
  del servidor de mentira es de producción, así que `/sw.js` se registra. Hoy el service worker solo
  pide al mismo origen, así que no pude armar una salida; no lo pude comprobar corriendo la imagen.
- `run.ts` sigue lanzando Docker con `--network host` y `serve.ts` escucha en todas las interfaces
  (`listen(port)`), así que mientras corre, la aplicación y la API de mentira están en el puerto 4189
  para la red local y Tailscale. Solo sirven el armado y respuestas fijas: no hay datos que ver.

**Qué propongo.** `serviceWorkers: 'block'` en `closedContext`; `listen(port, '127.0.0.1')` en
`serve.ts`; y una prueba del encierro: una unitaria de `closedContext` con un navegador que pide
`https://example.com/x.png` y comprueba que queda en `escaped` (o una escena de prueba que la corrida
tiene que hacer fallar). Costo: una hora.

### 18 · La carpeta `media/` como enlace simbólico (`tools/manual/media.ts:88-97`) — Mejora

**Dónde.** El lector hace `lstat` de cada archivo, pero no de la carpeta `media/` ni de
`docs/manual/`. El diseño (§ 2) dice que «la ruta resuelta tiene que quedar dentro de
`docs/manual/`, y se rechazan los enlaces simbólicos».

**El ataque.** Quien puede subir al repositorio cambia `docs/manual/media` por un enlace a una
carpeta absoluta (git guarda enlaces). Al armar en GitHub o en la máquina de quien programa, el
lector lee esa carpeta. Para que algo se publique, ahí tiene que haber un `<x>.json` con la forma de
una escena y un `<x>.webp` o `.webm` válidos y que un capítulo nombre: no pude armar un caso real en
que salga algo ajeno. Lo anoto porque el diseño lo da por cubierto.

**Qué propongo.** `lstat` de `media/` (y de la raíz del manual) y rechazo si es un enlace; o
`realpathSync` y comprobar que empieza con el `realpath` de `docs/manual/`. Costo: unos renglones.

**Prueba.** Unitaria del lector: `media` como enlace a otra carpeta con una escena válida frena.

### 19 · El capítulo de la dirección se pide antes del índice (`src/app/modules/manual/useManual.ts:28-45`) — Mejora

**Dónde.** Con `/manual?c=<nombre>` el capítulo se pide a la vez que el índice, con el texto de la
dirección si tiene forma de nombre (`^[a-z0-9-]+$`), y recién después se usa solo si el índice lo
tiene. El diseño (§ 5) dice las dos cosas: «el archivo que se pide siempre es el del índice, nunca un
texto armado con la dirección» y «si la dirección nombra un capítulo, el índice y el capítulo se piden
a la vez».

**El riesgo.** Con la forma de nombre no hay `/`, `.` ni `%`, así que el pedido queda dentro de
`/manual/` y termina en `.json`: con `?c=index` o `?c=search-phone` se baja un archivo público más,
que no se usa; un nombre que no existe da 404 y se descarta sin pedir actualizar. No pude armar nada
más. Es el cierre del punto 2 del paso 4, bien hecho, pero el diseño no lo dice así.

**Qué propongo.** Corregir la frase del diseño: «el capítulo de la dirección se pide a la vez que el
índice solo si tiene forma de nombre, y se usa solo si el índice lo tiene». Costo: ninguno.

**Prueba.** La de `manual-screen.test.tsx:184-197` ya lo cubre.

### 20 · «Volver» busca en un objeto común (`src/app/modules/manual/back.ts:11-22`) — Mejora

**Dónde.** `places[from]` es un objeto literal: `from: 'constructor'`, `'toString'` o `'__proto__'`
devuelven algo de `Object.prototype`, que pasa el `if (!place)`, y el botón dice «Volver a function
Object() { [native code] }».

**El riesgo.** `history.state` solo lo escribe una página del mismo origen, así que no pude armar un
ataque desde afuera, y `go` sigue siendo `history.go`: no hay redirección. Es la lista cerrada que
pidió el paso 4 con una puerta por el prototipo.

**Qué propongo.** `Object.hasOwn(places, from)` (o un `Map`). Costo: un renglón.

**Prueba.** Sumar `{ from: 'constructor' }` y `{ from: '__proto__' }` a `manual-slot.test.tsx:49`.

### 21 · Los 404 de Caddy salen sin `nosniff` ni HSTS (`deploy/Caddyfile:17-21`) — Mejora

**Dónde.** El bloque de arriba (`Strict-Transport-Security`, `X-Content-Type-Options` y `-Server`)
tiene un borrado, y Caddy lo aplica al escribir la respuesta; los 404 de `file_server` salen por el
camino de errores y no lo llevan. Lo vi corriendo Caddy: `/manual/nada.json`, `/manual/` y
`/manual/media/` dan 404 con la política y `DENY`, pero sin `nosniff` ni HSTS. Pasa también con
`/assets/` (no es nuevo del manual).

**El riesgo.** El 404 no tiene cuerpo ni tipo, así que `nosniff` no cambia nada, y HSTS ya lo dan
todas las demás respuestas y el proxy de TLS. No pude armar un ataque.

**Qué propongo.** Agregar las dos cabeceras sin `defer` (por ejemplo, un bloque `header` aparte para
el borrado de `Server`), y en `headers.spec.ts` comprobar `nosniff` también en el 404. Costo: cinco
minutos.

### 22 · Pruebas que faltan (§ 10 del diseño) — Mejora

Riesgos que el diseño dice cubrir y que ninguna prueba intenta:

- **El encierro de las capturas** (paso 4, punto 4): ver el punto 17.
- **El buscador con lo que escribe un atacante** (punto 12): unitaria de `searchManual` y `marks` con
  `(a+)+$`, `[`, `\` y 10 000 letras: no tira error, corta en 60 y responde en menos de 5 ms.
- **El servidor de desarrollo** (punto 13): unitaria del manejador de `configureServer` con
  `/manual/../.env` y `/manual/%2e%2e/package.json` (hoy dan 404; lo comprobé a mano).
- **El cartel del ambiente de pruebas en el manual** (punto 11, R10.1): unitaria de la pantalla en
  pruebas con «Ambiente de prueba · nada de esto es real» y en producción sin él.
- **E53 con sesión, espiando `fetch`:** `manual-app.test.tsx:31` comprueba que la persona no se ve,
  pero no que con sesión ningún pedido del manual salga de `/manual/` (eso lo prueba
  `manual-screen.test.tsx:184` sin sesión).
- **Un renglón con `../` o una ruta absoluta** en `README.md` (punto 3, y § 10 «un enlace fuera de
  `docs/manual/`»): hoy no tiene cómo pasar, porque el archivo tiene que ser `<id>.md`; una prueba
  lo deja atado.
- **Las cabeceras:** `headers.spec.ts` mira `index.json` y un 404; conviene sumar una captura de
  `media/` con `no-store` e `image/webp`, `/manual` con `no-cache` y `X-Frame-Options: DENY`, y
  comparar la política con la de la aplicación entera, no solo que no tenga `unsafe-inline`.

Costo de todo: medio día.

### Fuera de seguridad, visto de paso

En `pnpm dev`, `server.middlewares.use('/manual/', …)` también atrapa `/manual` y `/manual?d=…`
(connect quita la barra del final y compara por prefijo): abrir o recargar el manual por su dirección
en desarrollo da 404 vacío. Lo comprobé con el servidor de desarrollo. No afecta a Caddy ni al
armado.

### Lo que revisé y está bien

- **Entrar sin permiso y sesiones:** el manual no lee la sesión ni la persona, y no hay rutas,
  eventos ni canales nuevos. Sin sesión, la entrada se desmonta (se cierran su canal del QR y la
  renovación de Google).
- **Permisos y lo ajeno:** todo lo que muestra sale del repositorio público; cambiar `d`, `c`, `t` o
  `p` solo elige entre lo que hay en el índice (`p` se limita a la cantidad de pasos).
- **Lo que entra de afuera:** la dirección (puntos 19 y 2 del paso 4), el buscador (60 letras,
  `includes`), el `history.state` (punto 20). Nada se manda a ningún lado.
- **El navegador:** sin `localStorage`, `sessionStorage`, IndexedDB ni caché; `fetch` con
  `no-store`; las capturas como `blob:` (que `img-src` ya admite) se sueltan al cambiar de tarea y al
  cerrar; el clip con `preload="none"`. La página no se puede enmarcar (`DENY` y
  `frame-ancestors 'none'`, comprobado). La excepción de `'unsafe-inline'` en estilos sigue solo en
  `/google-button.html` (`Caddyfile:39-48`); el HTML con estilos en línea de `tests/manual/clip.ts`
  solo existe dentro del programa de capturas, nunca en Caddy.
- **Redirecciones:** «Volver» usa `history.go` o `navigate('/')`; ningún camino asigna
  `location`.
- **Datos personales en el repositorio:** las diez imágenes y el video muestran solo a «Ana Gómez,
  Administrador» con `ana@example.com` (que no aparece en ninguna imagen), el botón de Google de
  mentira, el QR con `localhost` y «captura-fija», la computadora «Chrome en Windows»; ni el marco ni
  el cartel del ambiente de pruebas, ni «Pronto». Sin EXIF ni XMP; el WebM solo dice el codificador.
  El manual de prueba de `tests/manual/fixture/` reúsa dos de esas capturas.
- **Secretos:** ninguno en el código, las imágenes ni el Dockerfile; el Dockerfile copia solo
  `tools/manual` y `docs/manual`, y `MANUAL_DIR` y `MANUAL_MEDIA` no llegan al armado de la imagen
  (no son `ARG`).
- **Abuso y disponibilidad:** archivos fijos con topes; sin base ni memoria del servidor.
- **Sin conexión y auditoría:** no hace nada sin conexión ni tiene acciones que registrar.
- **Dependencias:** ninguna nueva en estos commits (`package.json` solo suma comandos);
  `pnpm audit --prod` sin fallas. Los íconos se copiaron de Lucide como datos, sin la biblioteca.

### Lo que se hizo con el paso 7

- **14:** cada escena guarda la huella del `.webp` que se publica y el lector rechaza otra, y también
  un WebP con trozos `EXIF` o `XMP`. Las etiquetas del WebM no se miran todavía.
- **15:** el nombre de la lista pasa por «solo texto» y no puede tener «·»; el `# título` tiene que
  ser igual. Los mensajes del lector ya no repiten el contenido del renglón.
- **16:** el control de HTML ve `document.writeln`, `srcdoc`, `createContextualFragment`,
  `setHTMLUnsafe`, `parseFromString`, `cssText` y `setAttribute` con comillas invertidas; la prueba
  lo exige.
- **17:** `serviceWorkers: 'block'`, el convertidor del clip en un contexto encerrado, el servidor de
  mentira solo en `127.0.0.1`, y una prueba del encierro en `pnpm manual:check`.
- **18:** el lector rechaza la carpeta del manual o `media/` como enlace.
- **19:** el diseño dice lo que hace el código.
- **20:** «Volver» usa `Object.hasOwn`; `constructor` y `__proto__` llevan a «Ir a Ferrebress».
- **21:** el borrado de `Server` va en su propio bloque, y los 404 llevan `nosniff` y HSTS (la e2e lo
  comprueba).
- **22:** pruebas del buscador con texto hostil, del servidor de desarrollo, del cartel en pruebas,
  de E53 con sesión, de un renglón con `../` o una ruta absoluta, y más cabeceras en la e2e (una
  captura, `/manual` y la política igual a la de la aplicación).
