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
