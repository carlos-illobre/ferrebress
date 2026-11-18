# Revisión de seguridad del código · 08 · Listas de precios (`price-lists`), etapa a

## Paso 7: el código

Revisión independiente del código de la etapa a desde el punto de vista de un atacante (constitución,
paso 7), contra el [diseño](price-lists.md) (sobre todo § 3, § 8 y § 10), el
[ADR-021](../adr/ADR-021-reading-price-lists.md), las [reglas](../../chapters/08-price-lists/rules.md) y
la [revisión de seguridad del diseño](price-lists-security-review.md). Miré todo lo que cambió en `src/`
desde `cb1178e^`, más `deploy/` (Caddyfile, compose y Dockerfile).

Lo que comprobé corriendo cosas, con pruebas descartables fuera del repositorio:

- **El índice del ZIP:** armé con Python un `.xlsx` de 1,5 MB con una parte que dice «sin tamaño»
  (bit 3) y se infla a 1,5 GB. `zipFits` lo deja pasar, y `openWorkbook` llevó el proceso a 2,6 GB
  (punto 2). En la misma corrida, el `setInterval` del tope de memoria no corrió ni una vez.
- **Un `.xlsx` que miente el tamaño sin el bit 3:** SheetJS no pasa de lo declarado. El proceso
  quedó en 83 MB, así que esa parte del diseño se cumple.
- **Una celda con `&#xD800;`:** con el kit de las pruebas (PGlite) y una planilla de 6.000 filas
  con esa celda en la fila 5.501, la lista quedó «en espera» con 4.999 filas guardadas. El segundo
  bloque se perdió sin ningún aviso (punto 3).
- **Dos `HEAD` a `/lists/:id/file`:** dejan a la persona sin poder bajar archivos. El `GET` que
  sigue da `429 too-many-downloads` (punto 5).
- **La sandbox:** una recursión sin fin en un lector hace que QuickJS aborte (`Assertion failed:
  list_empty(&rt->gc_obj_list)`), y `runReader` lanza en lugar de devolver un error (punto 6). Lo
  que sí se cumple:
  - una expresión regular catastrófica y un `sort` con un comparador sin fin se cortan por tiempo;
  - `process`, `require`, `std`, `os`, `fetch` y `WebAssembly` no existen adentro;
  - cambiar `Object.prototype` no pasa a la corrida siguiente.
- **El orden de Caddy:** `caddy adapt` con la imagen fijada en `web.Dockerfile`. La ruta `@upload`
  queda antes que `/api/*`, así que los 100 MB valen solo para `POST /api/price-lists/lists`.
- **SheetJS:** el `src/server/vendor/xlsx-0.20.3.tgz` del repositorio tiene el mismo SHA-256 que el
  de `cdn.sheetjs.com` (`8dc73fc3…99fe8`).
- **`pnpm audit --prod`:** «No known vulnerabilities found».

**No lo pude comprobar:**

- quién mata el OOM killer dentro del contenedor de 1 GB: no había Docker en esta sesión (punto 2);
- si `@hono/node-server` cancela la respuesta cuando el cliente corta a mitad de una descarga
  (punto 5).

Gravedad:

- **Frena:** se puede entrar, ver o cambiar lo ajeno, o filtrar datos.
- **Mejora:** conviene hacerla; no frena.

## Resumen

**Un punto frena, y es barato:** `GET /api/price-lists/readers` lo puede pedir cualquiera con sesión.
Trae, por proveedor, el nombre del archivo y la fecha de la última lista que leyó cada lector. Es lo
que R1.3 le niega a quien no tiene «Ver costos», y lo que `GET /suppliers` le oculta (punto 1).

**Lo más grave no frena por definición, pero va primero:**

- **La defensa contra las bombas ZIP tiene un agujero y un control que no corre** (punto 2). Una
  parte con el bit 3 y tamaños en cero pasa el índice, y SheetJS la infla sin tope. El control de la
  memoria del proceso (RSS) es un `setInterval`, que no corre mientras SheetJS trabaja. Lo único que
  queda es el tope de 1 GB del contenedor, que comparten los procesos lectores y el servidor.
- **Una sola celda armada se lleva 5.000 filas en silencio** (punto 3). La lista igual queda «en
  espera», lista para aplicar. Si es «completa», aplicarla da de baja los productos de ese bloque
  como «ya no vienen».

Los demás son de disponibilidad o de pruebas que faltan.

| # | Punto | Gravedad |
|---|---|---|
| 1 | Lectores muestra a cualquiera con sesión el archivo y la fecha de la última lista de cada proveedor | **Frena** |
| 2 | Bomba ZIP: el bit 3 pasa el índice, y el tope de memoria del proceso lector no corre durante SheetJS | Mejora (disponibilidad, grave) |
| 3 | Un bloque que no se puede guardar se pierde en silencio, y la lista queda para aplicar | Mejora (integridad, grave) |
| 4 | Volver a leer las que no se pudieron reabre también las que tumbaron el proceso | Mejora (disponibilidad) |
| 5 | Bajar archivos: un `HEAD` deja el contador tomado para siempre | Mejora (disponibilidad) |
| 6 | Un lector que desborda la pila tumba la lectura entera, y el módulo de QuickJS no se renueva | Mejora |
| 7 | Las filas salteadas viajan enteras al proceso del servidor, sin tope de celdas | Mejora (disponibilidad) |
| 8 | Archivos: el `tmp/` que nadie limpia y dos carreras que borran el archivo de otra lista | Mejora |
| 9 | Asignar un proveedor acepta también lectores automáticos | Mejora |
| 10 | SheetJS: no se mira qué formato abrió | Mejora |
| 11 | El proceso lector corre con el mismo usuario que el servidor | Mejora (defensa en profundidad) |
| 12 | Buscar con `like` sin escapar `%` y `_` | Mejora |
| 13 | Pruebas que faltan para riesgos que el diseño dice cubrir | Mejora |

## Los puntos

### 1. Lectores muestra a cualquiera con sesión el archivo y la fecha de la última lista de cada proveedor — **Frena**

- **Dónde:** `src/server/modules/price-lists/routes/readers.ts:52`, con `viewOf` (líneas 23 a 36);
  `data/reader-admin.ts`, `columns`. La regla es 08 · R1.3: «No se ven costos, descuentos, listas ni
  productos».
- **El ataque:**
  1. Un vendedor sin «Ver costos», o una sesión suya robada, pide `GET /api/price-lists/readers`. No
     hace falta ningún permiso, solo la sesión.
  2. Por cada lector recibe:
     - el proveedor (`supplier.name`);
     - `lastList.fileName`, el nombre del archivo, que pone el proveedor. Por ejemplo,
       «Bulonera_aumento_12%_noviembre.xlsx»;
     - `lastList.listDate` y `lastList.id`.
  3. Así ve qué listas llegaron, de quién y de qué fecha. Es justo lo que `GET /suppliers` le oculta
     sin «Ver costos» (`rowOf` solo pone `lastListDate` con `costs`), y R1.3 le niega.
- **Propuesta:** `lastList` solo con «Ver costos», igual que `rowOf` en `rules/suppliers.ts`. Otra
  opción: pedir «Ver costos» para toda la ruta, si Carlos prefiere que Lectores sea solo de quien
  ve listas. El diseño (§ 3, «Ninguno») tiene que decir cuál. Cuesta unas líneas. **La prueba:** con
  el vendedor, la respuesta no trae `lastList`.

### 2. Bomba ZIP: el bit 3 pasa el índice, y el tope de memoria del proceso lector no corre durante SheetJS — Mejora (disponibilidad, grave)

- **Dónde:**
  - `reading/zip.ts:47`: `if (part.flags & 0x08) return part.compressed === 0 && part.size === 0;`
  - `reading/process.ts:10-11`, el `setInterval` que mira el RSS cada 100 ms;
  - `reading/workbook.ts`, `XLSX.read`, que es sincrónico;
  - `deploy/compose.yml`: `mem_limit: 1g`;
  - diseño § 10 y ADR-021: «Con el tamaño declarado, SheetJS descomprime dentro de ese espacio y no
    crece».
- **Cómo se pasa el índice:**
  - Con el bit 3 (los tamaños van después de los datos), `agrees` acepta la parte si el índice dice
    0 y 0. No mira la cabecera local, que es la que usa SheetJS.
  - SheetJS (`parse_local_file`) descomprime con el tamaño de la cabecera local. Si dice 0, el búfer
    crece duplicándose mientras haya datos. Si dice 4 GB, pide 4 GB.
  - La suma del índice da 0, así que también pasan los topes de 300 MB y de 100 veces el archivo.
  - Lo que el diseño quería decir con «ninguna sin tamaño declarado que traiga datos» no se mira: el
    tamaño comprimido también lo escribe el atacante.
  - La prueba `zip.test.ts:59-62` arma justamente esa parte con `data` vacío y la da por buena.
- **Por qué el tope del proceso no frena:** `XLSX.read` es una sola llamada sincrónica de varios
  segundos, y un `setInterval` no corre mientras el proceso está ocupado. En la prueba corrió 0 veces
  durante 5,4 s, con el proceso en 2,6 GB. `--max-old-space-size` no cuenta los `Buffer` (ADR-021).
- **El ataque:**
  1. Un proveedor, o alguien que se hace pasar por él por correo, manda un `.xlsx` de 1,5 MB, armado
     con 15 líneas de Python: una parte con el bit 3, ceros comprimidos a 1:1000 y tamaños en cero.
  2. Quien tiene «Cargar listas» lo sube, como cualquier lista.
  3. El proceso lector pasa de 1 GB en unos segundos. El contenedor tiene 1 GB entre el servidor, los
     dos procesos lectores y lo que estén leyendo.
  4. El OOM killer del cgroup mata el proceso más grande. Casi seguro es el lector, pero no lo pude
     comprobar sin Docker.
  5. Mientras tanto, la memoria del contenedor está al tope y el mostrador se frena.
  6. La lista se reintenta una vez (`crashed` con un intento, `steps.ts`), así que pasa dos veces.
  7. Con dos de esos archivos a la vez, los dos procesos lectores crecen juntos. Ahí el servidor
     puede quedar también entre los candidatos.
- **Propuesta:**
  1. **En `zip.ts`, mirar la cabecera local también con el bit 3**, y no aceptar una parte
     comprimida (método 8) con tamaño 0. Lo más simple es rechazar el bit 3: Excel no lo usa, y hoy
     solo se acepta si los tamaños son 0, que es justo el ataque. Si se quiere aceptar, la cabecera
     local tiene que decir lo mismo que el índice, y los dos distintos de 0. Cuesta unas líneas.
  2. **Que el proceso lector sea el que muera:** al arrancar, que escriba `1000` en
     `/proc/self/oom_score_adj`. Subirlo no pide privilegios. Así el OOM killer lo elige siempre
     antes que al servidor. Cuesta una línea.
  3. **Corregir el comentario de `process.ts` y el ADR:** el control del RSS solo vale entre bloques,
     no mientras se abre un Excel. El tope real del Excel es el índice del ZIP más el heap.
  4. **La prueba que pide el diseño (§ 12):** subir el `.xlsx` de arriba y el de 4 GB declarados en la
     cabecera local. La lista queda «No se pudo leer» con `too-big` y la memoria del proceso no sube.

### 3. Un bloque que no se puede guardar se pierde en silencio, y la lista queda para aplicar — Mejora (integridad, grave)

- **Dónde:**
  - `reading/service.ts:88`: `.catch(console.error)` en la cadena de mensajes;
  - `rules/cells.ts:7`: `textOf` no saca los sustitutos sueltos (`\p{Cs}`);
  - `data/rows.ts`: `jsonOf(rows)::jsonb`;
  - `reading/steps.ts:66`: `done` no mira cuántas filas se guardaron.
- **El ataque:**
  1. Un proveedor manda un `.xlsx` con una celda de descripción que dice `Tornillo &#xD800;` en el
     XML. Excel no lo genera, pero cualquiera lo escribe a mano en el ZIP.
  2. SheetJS lo convierte en un sustituto suelto (U+D800), y `textOf` lo deja pasar.
  3. `JSON.stringify` lo escribe como `\ud800`, y PostgreSQL rechaza ese JSON («invalid input syntax
     for type json»).
  4. Falla el `insert` del bloque de 5.000 filas donde está la celda. El error va a `console.error`
     y la cadena sigue con el bloque siguiente.
  5. Llega `done`, y la lista pasa a «en espera» con un bloque menos. En la prueba quedaron 4.999
     filas de 6.000, con `rowsRead` en 5.000 contra 6.001.
  6. Si la lista es «completa», el resumen cuenta esos productos como «ya no vienen», y «Aplicar» los
     da de baja (R7.4) y no les cambia el costo. R6.5 avisa recién pasado el 20 %. Con una lista de
     30.000 filas, un bloque es el 17 %.
  7. El proveedor puede elegir qué bloque desaparece, poniendo la celda en esa fila.
- **Lo mismo pasa con cualquier otro error al guardar un bloque**, no solo con esta celda: uno de la
  base, un choque o una conexión cortada. Ningún error de un paso marca la lista.
- **Propuesta:**
  - `textOf` saca también `\p{Cs}`, o usa `String.prototype.toWellFormed()`. `src/shared/text/clean.ts`
    ya lo hace con los datos de los proveedores. Cuesta una línea.
  - Un paso que falla corta la lectura (`stop`) y deja la lista «No se pudo leer» con `damaged`, en
    lugar de seguir con el siguiente mensaje.
  - `done` pasa a «en espera» solo si `rows_read` es igual a `rows_total`.
  - Cuesta unas líneas. **La prueba:** la planilla de arriba queda «No se pudo leer» o se lee entera,
    nunca «en espera» con filas de menos.

### 4. Volver a leer las que no se pudieron reabre también las que tumbaron el proceso — Mejora (disponibilidad)

- **Dónde:** `data/reading.ts:138` (`rereadable`): pasa a «leyendo», con `attempts = 0`, toda
  «No se pudo leer» que sea la última de su proveedor, sin mirar el motivo. La llaman:
  - `routes/readers.ts`, en cada activación o asignación de un lector;
  - `reading/resume.ts`, en cada arranque en que cambió un lector de un programador.
- **El ataque:** sigue al punto 2. El archivo que dejó la lista `crashed` vuelve a abrirse dos veces:
  - cada vez que alguien con «Cambiar los ajustes» activa o asigna un lector, que puede ser hasta 60
    veces por minuto por sesión;
  - y en cada despliegue que trae un lector nuevo.

  Es lo que el punto 2 de la revisión del diseño quería evitar. Las de `too-big`, `damaged` y `empty`
  también se releen, y no dependen de los lectores: no hay forma de que salgan distinto.
- **Propuesta:** `rereadable` solo con `reason in ('no-reader', 'auto-unsure', 'reader-failed')`.
  Cuesta una línea. **La prueba:** una lista `crashed` no se relee al activar un lector.

### 5. Bajar archivos: un `HEAD` deja el contador tomado para siempre — Mejora (disponibilidad)

- **Dónde:** `routes/files.ts:100-109` (`downloading` y `counted`); `platform/download.ts` (el
  `ReadableStream` con `pull`); Hono contesta un `HEAD` con la respuesta del `GET` sin leerla ni
  cancelarla (`hono-base.js`, `if (method === "HEAD")`).
- **El ataque:**
  1. Alguien con «Ver costos», un programa con su cookie, o un navegador que hace un `HEAD` a un
     enlace, pide `HEAD /api/price-lists/lists/<id>/file` dos veces.
  2. Cada vez, el `ReadableStream` llama una vez a `pull`. Eso abre el archivo, lee 1 MB y deja el
     generador detenido dentro del `try`.
  3. El cuerpo nunca se lee ni se cancela, así que el `finally` que resta nunca corre.
  4. La persona queda en 2 descargas «en curso» hasta que se reinicie el servidor: todo `GET` le da
     `429`. Comprobado.
  5. Además quedan abiertos un descriptor de archivo y 1 MB de memoria por cada uno. El tope de 2 por
     persona limita cuánto, así que el daño a otros es poco.
- **Lo mismo puede pasar con una descarga que el cliente corta a mitad**, si `@hono/node-server` no
  cancela el flujo. No lo pude comprobar.
- **Propuesta:**
  - contestar `HEAD` aparte, sin cuerpo, o rechazarlo con `405`;
  - en `download`, no abrir nada hasta el primer `pull` real: `highWaterMark: 0` en la estrategia del
    `ReadableStream`;
  - que el contador tenga vencimiento (por ejemplo, cada descarga cuenta como mucho 10 minutos).

  Unas líneas. **La prueba:** dos `HEAD` y un `GET`; el `GET` da `200`.

### 6. Un lector que desborda la pila tumba la lectura entera, y el módulo de QuickJS no se renueva — Mejora

- **Dónde:** `reading/sandbox.ts:56-58` (`finally` con `vm.dispose()` y `runtime.dispose()`); la
  variable `engine`, que comparten todas las corridas; `reading/process.ts:22`.
- **Qué pasa:**
  1. Con `setMaxStackSize`, una recursión sin fin da un error de QuickJS.
  2. Al liberar el runtime, quedan objetos vivos y la variante de producción aborta: `Aborted(Assertion
     failed: list_empty(&rt->gc_obj_list))`.
  3. `runReader` no devuelve `{ failed: 'error' }`: lanza.
  4. `runJob` no lo atrapa por lector, así que toda la lectura termina en `damaged`. No prueba el
     lector siguiente ni el automático.
  5. Un lector así de cualquier proveedor se prueba con todas las planillas de proveedor desconocido
     (R5.2). Hasta que alguien lo desactive, ninguna de esas se lee.
  6. Después del aborto, el módulo de WebAssembly sigue en uso, en un estado que Emscripten no
     garantiza. En la prueba, las corridas siguientes anduvieron.
- **Quién lo hace:** hoy, solo un lector de un programador con un error, porque el automático es
  código fijo. En la etapa b, uno escrito por una IA a partir de una planilla armada.
- **Propuesta:**
  - `runReader` atrapa cualquier error de liberar y devuelve `{ failed: 'error' }`;
  - tras un error que no sea del lector, se descarta `engine` (`engine = undefined`), como dice el
    punto 12 de la revisión del diseño;
  - `choose` y `readBlock` tratan ese error como «este lector no sirve» y siguen con el siguiente.

  Unas líneas. **La prueba de E53** suma una recursión sin fin, después de la cual otro lector lee
  bien la misma planilla.

### 7. Las filas salteadas viajan enteras al proceso del servidor, sin tope de celdas — Mejora (disponibilidad)

- **Dónde:** `rules/check.ts:126` (`cells: cellsOf(block, one.row)`): todas las celdas de la fila como
  texto, sin tope de cantidad ni de largo. También el mensaje `block` en `messages.ts` y `jsonOf(rows)`
  en `data/rows.ts`.
- **El abuso:**
  - En un CSV cada campo llega a 64 KB, pero una fila puede tener miles de campos. En un `.xlsx`, una
    celda puede ser tan larga como permita el heap del proceso lector.
  - Si el lector marca esas filas como salteadas (el automático saltea lo que no tiene precio), cada
    bloque de 5.000 filas manda todo su texto al proceso del servidor. El servidor lo convierte en un
    solo JSON para un `insert`.
  - Con un archivo de 100 MB armado así, son cientos de MB en el proceso que atiende el mostrador, que
    es justo el que el diseño quería dejar afuera.
  - No lo medí.
- **Propuesta:** en `cellsOf`, como mucho 50 celdas y 200 letras por celda. Es lo que alcanza para
  mostrar una fila salteada (R9.2). Cuesta una línea. **La prueba:** una fila salteada con 10.000
  celdas de 60 KB se guarda con 50 de 200.

### 8. Archivos: el `tmp/` que nadie limpia y dos carreras que borran el archivo de otra lista — Mejora

- **Dónde:** `platform/storage/files.ts:50-51`; `routes/upload.ts:50`; `files/cleanup.ts:34-36`.
- **Lo que pasa:**
  - **`tmp/`:** si el servidor se cae o lo reinician a mitad de una subida, el archivo a medias queda
    en `tmp/` para siempre. `cleanUp` solo mira los nombres SHA-256 de la carpeta de arriba, y el
    ajuste de 06 · R8.6 no lo cuenta. Es poco, pero cada uno llega a 100 MB.
  - **Formato equivocado:** A sube una lista. B sube **el mismo contenido** con otra extensión, por
    ejemplo el `.xlsx` como `.csv`. `receive` lo guarda, ve que el formato no sirve y lo borra si
    `used` no encuentra ninguna lista con ese contenido. Si eso pasa entre el `rename` de A y el
    `insert` de su lista, borra el archivo de A. La lista de A queda sin archivo y no se puede leer.
    Hace falta tener el mismo archivo, así que es casi siempre casual.
  - **La limpieza de cada hora:** `cleanUp` toma `known()` y después lista la carpeta. Un archivo
    recién guardado, cuya lista todavía no existe, se borra.
- **Propuesta:**
  - limpiar `tmp/` al arrancar;
  - borrar por formato o por la limpieza solo los archivos con más de una hora (`mtime`).

  Unas líneas.

### 9. Asignar un proveedor acepta también lectores automáticos — Mejora

- **Dónde:** `routes/readers.ts:90`; R5.1 («Uno escrito por un programador […] o al que le elija en
  Lectores quien tiene “Cambiar los ajustes”»).
- **El abuso:**
  1. Quien tiene «Cambiar los ajustes» y no «Cargar listas» le asigna a Aceros Litoral el automático
     de Bulonera Centro.
  2. Desde la planilla siguiente, una lista de Bulonera que se sube sin decir el proveedor la
     reconoce ese lector. Queda de Aceros, confirmada por el lector y sin preguntar (`steps.ts`,
     `chosen`).
  3. Si es «completa» y alguien aplica sin mirar, se dan de baja los artículos de Aceros. R6.5 avisa
     pasado el 20 %.

  Pide un permiso de Administración. No es entrar sin permiso, pero es una puerta que la regla no
  abre.
- **Propuesta:** solo `origin === 'programmer'`; si no, `404`. Una línea, más una prueba.

### 10. SheetJS: no se mira qué formato abrió — Mejora

- **Dónde:** `reading/workbook.ts`; punto 16 de la revisión del diseño.
- **Lo que quedó:** las opciones están cerradas (sin fórmulas ni HTML, `bookFiles` y `bookVBA` en
  `false`), pero no se mira `book.bookType`. Lo que entra, cada uno con su lector de SheetJS:
  - un ZIP con nombre `.xlsx` puede abrirse como `.ods`, `.xlsb` o `.numbers`;
  - un texto con nombre `.xls` puede abrirse como HTML (a propósito, hay prueba), SYLK, DIF, PRN o XML
    de 2003.

  Es superficie para la próxima falla de SheetJS, no un ataque que hoy funcione.
- **Propuesta:** después de abrir, `bookType` tiene que ser `xlsx`, `biff2` a `biff8`, `xlml`, `html`
  o `csv`; si no, `damaged`. Una línea y una prueba con un SYLK y un `.ods`.

### 11. El proceso lector corre con el mismo usuario que el servidor — Mejora (defensa en profundidad)

- **Dónde:** `reading/pool.ts` (`fork` con `env: {}`); ADR-021: «no recibe ninguna variable de
  entorno (la clave de la base no llega)».
- **Lo que pasa:** el entorno vacío cuida de un error que muestre el entorno, no de que alguien corra
  código ahí:
  - el proceso lector es el usuario `node`, igual que el servidor;
  - si una falla de SheetJS permitiera correr código, leería `/proc/<pid del servidor>/environ`, con
    `DATABASE_URL`;
  - también puede escribir en `/data/files` y `/data/audit`.

  No conozco una falla de SheetJS 0.20.3 que lo permita (punto de dependencias), así que no hay un
  ataque concreto hoy.
- **Propuesta:** decirlo en el ADR como riesgo aceptado. Si se quiere cerrar: un contenedor aparte
  para leer, sin red, con el volumen de archivos solo para leer. Ese es más trabajo (un día) y suma
  una pieza al despliegue.

### 12. Buscar con `like` sin escapar `%` y `_` — Mejora

- **Dónde:** `data/review.ts:116`, `:144`; `data/history.ts:70`.
- **Lo que pasa:** no hay inyección, porque va como parámetro. Pero `q=%` o `q=_` encuentra todo, y
  el punto 19 de la revisión del diseño pedía escaparlos. `q` tiene un tope de 80 letras, así que el
  costo es el de una página.
- **Propuesta:** escapar `\`, `%` y `_` y usar `like … escape '\'`. Una línea.

### 13. Pruebas que faltan para riesgos que el diseño dice cubrir — Mejora

- **Bomba ZIP de punta a punta** (diseño § 12): solo está la unitaria de `zip.ts`, que acepta la parte
  del punto 2. Falta subir el archivo y mirar que quede «No se pudo leer» sin que suba la memoria.
- **El tope de memoria del proceso lector:** no hay prueba de que un proceso que pasa `memoryMb` muera
  y la lista quede `crashed`.
- **10 subidas por minuto por persona** (diseño § 10): no hay prueba de que la subida 11 dé `429`,
  ni de que cambiar de dispositivo no lo saltee.
- **Sin sesión ni permiso no se lee el cuerpo** (E04): la prueba mira el `403`, no que el cuerpo no se
  leyó ni se guardó en `tmp/`.
- **Un `POST` JSON de más de 64 KB a otra ruta de `price-lists`** sigue en `400 size`: está en
  `http.test.ts` para la plataforma, no para este módulo.
- **Las de los puntos 1, 3, 4, 5 y 6.**

## Lo que pedía la revisión del diseño

| Punto del diseño | En el código |
|---|---|
| 1. Bomba ZIP | Índice del ZIP, proceso aparte y `mem_limit`: hecho, con el agujero del punto 2 |
| 2. Retomar en cada arranque | `attempts` y `crashed` al segundo: hecho; lo de releer, en el punto 4 |
| 3. La excepción para subir | `http.upload`, `octet-stream`, el orden en la ruta, el tope mientras llega y 30 s sin datos; Caddy, 100 MB solo en ese camino (comprobado con `caddy adapt`): cumplido |
| 4. Límite por persona | Por `userId` (`routes/lists.ts`): cumplido; falta su prueba |
| 5. Disco | El ajuste de 06 · R8.6 borra los más viejos y R8.7 los nunca aplicados: cumplido, salvo `tmp/` (punto 8) |
| 6. Fecha futura | No se toma (E84, con prueba): cumplido |
| 7. Auditoría al confirmar | `apply/service.ts` anota al terminar: lo leí, no lo probé con una falla a mitad |
| 8. Cola y descarga | La cola guarda identificadores; descarga de a partes, 2 por persona: cumplido, con el punto 5 |
| 9. Anomalías sin precios | El resumen trae solo cuántas y por qué; las filas, con «Ver costos»: cumplido |
| 10. Lectura vieja | Cada paso mira la lista «leyendo» en ese intento, con `for update`: cumplido |
| 11. Concurrencia | Aplicar traba el proveedor y compara `expected` adentro; no revisé cada carrera |
| 12. QuickJS | Runtime y contexto nuevos, sin funciones del servidor, memoria, pila y tiempo: cumplido; el módulo nuevo tras un error, no (punto 6) |
| 13. El automático como datos | Plantilla fija y `params` aparte: cumplido |
| 14. Lo que vuelve del lector | Esquema estricto, filas del bloque, celdas que existen, el servidor lee los valores: cumplido. Que el precio esté en la fila del código no se pide (el diseño lo dejó así, § 4) |
| 15. Activar uno pendiente | `409 reader-pending`, con prueba: cumplido |
| 16. SheetJS | Opciones cerradas: cumplido; el formato, punto 10 |
| 17. El nombre y la descarga | Limpio, RFC 6266, `nosniff`, `<a download>` con `Blob`, con prueba: cumplido |
| 18. Los campos del proveedor | `z.enum` y `columnOf`: cumplido |
| 19. Mirar una lista grande | `q` de 80, `after` con su forma, `uuidParams`: cumplido; `like`, punto 12 |
| 20. Lo que queda en el dispositivo | Solo en memoria (`last-seen.ts`, `WeakMap`); del vendedor, en la auditoría solo qué cambió: cumplido |
| 21. Precios enormes | Tope de $ 1 billón y la cuenta en `BigInt`: cumplido |
| 22. Dependencias | `quickjs-emscripten-core` con una variante; SheetJS en el repositorio, igual al de su sitio: cumplido |

## Lo que miré y no encontré nada

1. **Entrar sin permiso:** todas las rutas nuevas piden sesión (`routes-permissions.test.ts`). El tema
   `price-lists.list` pide «Ver costos» y se vuelve a mirar con `users.permissions-changed`. Subir pide
   `Content-Type: application/octet-stream`, el `Origin` propio y las cabeceras del dispositivo: un
   formulario de otro sitio no puede mandarlo.
2. **Permisos:** fuera del punto 1 y del 9, cada ruta pide lo que dice el diseño. Cambiar un
   identificador da `404` o lo que el permiso ya deja ver: las listas son del negocio, no de una
   persona. El campo de anomalías en la cabecera va solo con «Revisar las anomalías».
3. **Lo que entra de afuera:**
   - todas las consultas van con parámetros;
   - el nombre del archivo se limpia antes de guardarlo y antes de la cabecera;
   - el CSV corta en 64 KB por campo, también entre comillas (con prueba);
   - lo que devuelve un lector pasa por un esquema y por la comprobación;
   - los textos se guardan sin caracteres de control ni los que dan vuelta el texto;
   - los sustitutos sueltos, en el punto 3.
4. **La aplicación en el navegador:** nada de HTML armado con texto. Los enlaces del teléfono y del
   correo van con esquema fijo y el valor limpio o codificado. El archivo se baja como `Blob` con
   `<a download>`, nunca se abre. No se guarda nada en el dispositivo. Las cabeceras de Caddy (CSP,
   `frame-ancestors`) no cambiaron.
5. **Datos personales y secretos:**
   - del vendedor, Quién hizo qué guarda solo qué campos cambiaron;
   - no hay planillas ni nombres de proveedores reales en el repositorio, solo `auto-1.js` y planillas
     armadas por las pruebas (constitución, VIII);
   - nada sale de la máquina;
   - ningún secreto nuevo.
6. **Abuso:** en los puntos 2, 4, 5, 7 y 8.
7. **Sin conexión:** no se hace nada sin conexión en este capítulo.
8. **Auditoría:** subir, descartar, aplicar, los costos, los archivos y los lectores se anotan con
   quién, cuándo y desde dónde. Los rechazos sin permiso, con `permission.denied`. No se anota quién
   baja un archivo de costos: el diseño no lo pidió, y lo dejo anotado por si Carlos lo quiere.
9. **El despliegue:**
   - el volumen `list-files` es del usuario `node`;
   - `cap_drop: ALL` y `no-new-privileges` siguen;
   - no se publica ningún puerto nuevo;
   - Caddy deja 100 MB solo en `POST /api/price-lists/lists`, y el servidor corta antes con el ajuste;
   - el tope de 1 GB, en el punto 2.
10. **Dependencias:**
    - `pnpm audit --prod` está limpio, pero no mira SheetJS porque no viene del registro (lo dice el
      ADR);
    - SheetJS 0.20.3 no tiene advertencias en su sitio, que lista CVE-2023-30533 (arreglada en
      0.19.3) y CVE-2024-22363 (arreglada en 0.20.2);
    - un documento de un espejo no oficial habla de fallas de la 0.20.3 sin advertencia oficial, y no
      lo pude confirmar;
    - no encontré fallas publicadas contra `quickjs-emscripten-core` 0.32.0.

Fuentes:

- [Advertencias de SheetJS](https://cdn.sheetjs.com/advisories/);
  [OSV, GHSA-4r6h-8v6p-xvw6 (CVE-2023-30533)](https://osv.dev/vulnerability/GHSA-4r6h-8v6p-xvw6);
  [OSV, GHSA-5pgg-2g8v-p4x9 (CVE-2024-22363)](https://osv.dev/vulnerability/GHSA-5pgg-2g8v-p4x9);
  [Snyk, SNYK-JS-XLSX-6252523](https://security.snyk.io/vuln/SNYK-JS-XLSX-6252523).
- [El documento no oficial sobre la 0.20.3](https://git.sheetjs.com/fmoralesaliaga/sheetjs/src/branch/master/SECURITY_FIXES_0.20.4.md),
  que pide iniciar sesión y no pude leer.
- `cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz`, comparado por SHA-256 con el del repositorio.
