# Revisión de seguridad · 08 · Listas de precios (`price-lists`), etapa a: la lista a mano

## Paso 4: el diseño

Revisión independiente del [diseño de la etapa a](price-lists.md) y del
[ADR-021](../adr/ADR-021-reading-price-lists.md) desde el punto de vista de un atacante (constitución,
paso 4). Todavía no hay código del módulo. Leí la constitución, el
[capítulo 08](../../chapters/08-price-lists/rules.md) (R1 a R9, E01 a E83), las secciones 8 y 9 del
[capítulo 06](../../chapters/06-administration/rules.md), la [arquitectura](../architecture.md) y,
del código que el diseño reutiliza o tiene que cambiar: `platform/` (`http.ts`, `guards.ts`,
`permissions.ts`, `session.ts`, `settings.ts`, `limits/rate-limit.ts`, `realtime/topics.ts`,
`realtime/hub.ts`, `realtime/admission.ts`, `realtime/realtime.ts`, `storage/db.ts`),
`sign-in/sessions/require.ts`, las rutas de `administration` y `audit-log` (cómo arman sus límites),
`deploy/Caddyfile`, `deploy/compose.yml` y `deploy/server.Dockerfile`. La revisión del diseño
(`price-lists-design-review.md`) todavía no estaba escrita cuando hice esta.

Lo que comprobé fuera de leer:

- Bajé SheetJS CE 0.20.3 (la última de `cdn.sheetjs.com`) y leí cómo abre un ZIP (`parse_zip`,
  `parse_local_file`, `inflate`, `new_unsafe_buf`) y cómo trata las entidades XML (`unescapexml`).
  No lo corrí contra un archivo armado: no tuve permiso para correrlo en esta sesión.
- Con Node 22.23, un hilo con `resourceLimits` de 32 MB de memoria pidió 768 MB con
  `Buffer.allocUnsafe` y los llenó sin que lo cortaran (punto 1).
- Las fallas conocidas de `xlsx`, `quickjs-emscripten` y `@jitl/quickjs-wasmfile-release-sync`
  en OSV y en las advertencias de SheetJS (punto 22).

- **Frena:** se puede entrar, ver o cambiar lo ajeno, o filtrar datos personales. Se resuelve antes
  de aprobar el diseño.
- **Mejora:** conviene hacerla; no frena. Las que marco «antes de programar» cambian cómo se escribe
  el código desde el principio y después cuestan mucho más.

## Resumen

**Un punto frena, y se arregla barato:** las anomalías de «Filas salteadas» le muestran a quien tiene
solo «Revisar las anomalías» las filas de una lista con sus precios, que R1.3 reserva para «Ver
costos» (punto 9).

Lo más grave no frena por definición, pero es lo primero a resolver: **un archivo armado puede tirar
el servidor entero, y dejarlo cayéndose en cada arranque.** El ADR-021 dice que el tope de memoria del
hilo corta una bomba ZIP, y no la corta: `resourceLimits` limita solo la memoria de JavaScript del
hilo, y SheetJS descomprime en `Buffer`, que queda afuera de ese tope (punto 1). Como al arrancar se
«retoma lo cortado», el mismo archivo vuelve a leerse y a tirar el servidor (punto 2). Quien lo hace
no necesita entrar: alcanza con que un proveedor (o alguien que se haga pasar por él) mande ese
archivo por correo y que se suba como cualquier lista.

El resto son huecos que el diseño no dice cómo cerrar. Los de seguridad: la plataforma rechaza hoy
cualquier cuerpo de más de 64 KB que no sea JSON y el diseño no dice cómo se abre esa puerta (punto
3). Los límites contra el abuso se pueden saltear o no alcanzan para cuidar el disco (puntos 4 y 5).
Una fecha futura en una planilla bloquea para siempre las listas de un proveedor (punto 6). Y la
auditoría puede anotar costos que nunca se aplicaron (punto 7). También faltan reglas de
concurrencia (puntos 10 y 11) y la parte de los lectores, que conviene escribir así desde el
principio (puntos 12 a 16).

| # | Punto | Gravedad |
|---|---|---|
| 1 | Una bomba ZIP pasa el tope de memoria del hilo y tira el servidor | Mejora (disponibilidad grave), antes de programar |
| 2 | Retomar la lectura al arrancar repite la caída en cada arranque | Mejora (disponibilidad grave), antes de programar |
| 3 | El cuerpo de 64 KB, el `Content-Type` JSON y Caddy: la excepción para subir no está diseñada | Mejora, antes de programar |
| 4 | El límite «por dispositivo» lo elige quien manda el pedido | Mejora |
| 5 | Nada pone tope a lo que se guarda: el disco de la base se llena | Mejora (disponibilidad) |
| 6 | Una fecha futura en la planilla bloquea para siempre las listas de un proveedor | Mejora, antes de programar |
| 7 | La auditoría de cada artículo puede anotar lo que se deshizo | Mejora (auditoría) |
| 8 | La cola de lectura, la memoria del hilo principal y la descarga | Mejora (disponibilidad) |
| 9 | Las anomalías muestran precios de una lista a quien no tiene «Ver costos» | **Frena** |
| 10 | Un resultado de lectura viejo puede pisar el de la lectura nueva | Mejora (integridad) |
| 11 | Subir, cambiar cómo cobra o dar de baja mientras se aplica | Mejora (integridad) |
| 12 | Cada corrida de un lector, en un QuickJS nuevo, sin funciones del servidor y con tope de pila | Mejora, antes de programar |
| 13 | El lector automático: los datos de la planilla nunca como código | Mejora, antes de programar |
| 14 | Lo que vuelve del lector: atado a su fila, con topes, y sin «no hay duda» entre proveedores | Mejora |
| 15 | Activar un lector que todavía no tiene su prueba | Mejora |
| 16 | SheetJS: solo los tres formatos y las opciones cerradas | Mejora |
| 17 | El nombre del archivo y la descarga en la aplicación | Mejora |
| 18 | Cambiar un dato de un proveedor: la lista de campos, cerrada | Mejora |
| 19 | Mirar una lista grande, sin límite | Mejora |
| 20 | Los datos de los vendedores en la auditoría y en el dispositivo | Mejora (decide Carlos) |
| 21 | Los precios enormes y la cuenta del costo | Mejora |
| 22 | Dependencias: SheetJS desde su sitio y `quickjs-emscripten` | Mejora |

## Los puntos

### 1. Una bomba ZIP pasa el tope de memoria del hilo y tira el servidor — Mejora (disponibilidad grave), antes de programar

- **Dónde:** ADR-021, «Decisión»: «El hilo (`worker_threads`) tiene tope de memoria
  (`resourceLimits`) […]: si el archivo pide más (un ZIP que se infla, un XML que se repite), se corta
  el hilo […] y el servidor sigue»; diseño, § 8, «se abre en un hilo con tope de memoria y de
  tiempo».
- **Lo que comprobé:** `resourceLimits` limita solo la memoria de JavaScript del hilo, no los
  `ArrayBuffer` ni los `Buffer`. Lo dice la documentación de Node, y lo probé con Node 22.23: un
  hilo con 32 MB de tope pidió y llenó 768 MB de `Buffer` y terminó bien. SheetJS 0.20.3, en Node,
  descomprime cada parte del `.xlsx` en un `Buffer`:
  - `inflate(data, usz)` arranca con `new_unsafe_buf(usz)`, o sea `Buffer.allocUnsafe(usz)`.
    `usz` es el tamaño sin comprimir que dice el propio archivo: 4 bytes en la cabecera, o
    hasta 2⁵³ con el campo ZIP64.
  - Si el archivo dice `usz = 0`, el búfer crece duplicándose (`realloc`) mientras haya datos.
  - Descomprime todas las partes del ZIP antes de mirar si es una planilla.
- **El ataque:** alguien arma un `.xlsx` de unos 30 MB con una parte de ceros comprimida al máximo.
  Deflate llega a unas 1.000 veces, así que eso son unos 30 GB al descomprimir. Para hacerlo
  alcanza con Python y `zipfile`. Lo manda por correo como lista de un proveedor, o lo sube quien
  tiene «Cargar listas», o una sesión robada de esa persona. El hilo pide memoria fuera del tope.
  El tope de tiempo llega tarde: en 5 segundos se descomprimen varios GB. El proceso de Node
  entero se queda sin memoria. El contenedor del servidor no tiene tope (`deploy/compose.yml`), así
  que el que lo mata es el OOM killer de la VM, y puede elegir también a PostgreSQL o a otra
  aplicación de la máquina. Se cae el mostrador.
- **XML que se repite:** SheetJS no expande entidades definidas en el `DOCTYPE`. `unescapexml` solo
  conoce las cinco de XML y las numéricas, así que no hay ataques de entidades externas ni de mil
  millones de entidades. Lo único grande que puede armar un XML es un texto, y eso sí lo corta el
  tope del hilo.
- **Propuesta:** las dos cosas, porque la segunda sola no alcanza para un archivo que miente:
  1. **Antes de SheetJS, mirar el índice del ZIP** (unas 60 líneas, sin dependencias):
     - como mucho 2.000 partes;
     - ninguna parte con tamaño 0 que traiga datos, y ninguna con descriptor de datos sin tamaño;
     - la suma de lo que dicen las partes, como mucho 300 MB y 100 veces el archivo;
     - los tamaños de la cabecera local, iguales a los del índice.

     Con el tamaño declarado, el `inflate` de SheetJS escribe dentro de ese búfer y no crece:
     mentir el tamaño no le da más memoria. Si algo no cumple, la lista queda «No se pudo leer»
     con `too-big`.
  2. **Leer en un proceso aparte, no en un hilo**, con un tope de memoria del sistema y no solo de
     V8, por ejemplo `ulimit -v` o `prlimit --as` al lanzarlo. Es la opción que el ADR descartó por
     «cientos de milisegundos y decenas de MB». Frente a una lectura que tiene 10 segundos de meta,
     es poco. Lo que se gana:
     - una falla de memoria mata solo ese proceso;
     - `kill` corta aunque esté adentro de código nativo;
     - el entorno se arma vacío, sin la clave de la base (punto 12).

     Se pueden dejar los dos procesos lectores vivos y reusarlos, y cambiarlos tras cada falla.
     Además, ponerle tope de memoria al contenedor del servidor (`mem_limit`), así un error que
     quede no se lleva la VM.

  Cuesta un día. Corregir el ADR. **La prueba:** subir un `.xlsx` que dice 4 GB sin comprimir, otro
  con tamaño 0 que se infla y otro de 30 MB que se infla a 30 GB, y mirar que cada lista quede «No
  se pudo leer», que la memoria del proceso del servidor no suba más de lo que lee un archivo normal
  y que otro pedido sea atendido mientras tanto.

### 2. Retomar la lectura al arrancar repite la caída en cada arranque — Mejora (disponibilidad grave), antes de programar

- **Dónde:** § 5, `index.ts`: «al arrancar […] retoma lo cortado»; § 1, la lista «leyendo»; R5.5 y
  E47, una lista que no se pudo leer se vuelve a leer sola cuando llega un lector.
- **El ataque:** sigue al punto 1, o a cualquier archivo que tumbe el proceso por una falla de
  SheetJS que hoy no se conoce. El servidor se cae con la lista en «leyendo». Docker lo reinicia
  (`restart: unless-stopped`) y, al arrancar, se retoma la lectura de esa lista, que lo vuelve a
  tirar. Queda en un bucle de reinicios hasta que alguien borre o cambie la fila a mano en la base.
  Lo mismo con una lista «No se pudo leer» que se vuelve a leer al llegar una versión nueva con un
  lector (R5.5): cada despliegue la vuelve a abrir.
- **Propuesta:** cada lista lleva cuántas veces se empezó a leer (`attempts`). Se suma **en la base,
  antes de mandar el archivo al lector**. Al arrancar, una lista en «leyendo» con dos intentos no se
  retoma: queda «No se pudo leer», con el motivo `crashed` y su anomalía. Las que se retoman o se
  releen por R5.5 pasan por la misma cola de siempre, de a una por proveedor y sin saltar el límite
  del punto 5. Cuesta una columna y unas líneas. **La prueba:** una lista en «leyendo» con dos
  intentos, al arrancar, queda «No se pudo leer» sin abrir el archivo.

### 3. El cuerpo de 64 KB, el `Content-Type` JSON y Caddy: la excepción para subir no está diseñada — Mejora, antes de programar

- **Dónde:** § 3, «Subir: el cuerpo es `multipart/form-data`. Antes de leer nada se mira
  `Content-Length`…»; § 5, `platform/upload.ts`; `platform/http.ts`; `deploy/Caddyfile`.
- **La falla:** hoy, toda ruta de `/api` tiene tres cosas que la subida choca:
  - el `bodyLimit` de Hono, de 64 KB (`platformSettings.bodyLimitBytes`);
  - el control de `rejectionReason`, que rechaza todo `POST` cuyo `Content-Type` no sea
    `application/json`;
  - en Caddy, `request_body max_size 64KB` para todo `/api/*`.

  El diseño no dice cómo se abre la excepción, y según cómo se abra se rompen defensas que hoy
  existen:
  - **Si la excepción es amplia** (`/api/price-lists/*` en Caddy, o sacar el control de
    `Content-Type` para todo `multipart`), cualquier pedido de esas rutas puede traer 100 MB. Sin
    sesión, un pedido así ocupa memoria y conexión hasta que alguien lo mire, y hoy lo corta Caddy.
  - **Si la ruta lee el cuerpo antes de mirar la sesión y el permiso** (`c.req.parseBody()` o
    `formData()` en el primer paso), quien no tiene «Cargar listas» hace que el servidor reciba,
    y guarde en memoria, hasta 100 MB por pedido antes de contestar `403`. E04 pide que no se
    guarde nada; recibirlo entero ya cuesta lo mismo.
  - **`parseBody` y `formData` de Hono y undici juntan el cuerpo entero en memoria**, sin tope
    mientras llega, si `Content-Length` falta (`Transfer-Encoding: chunked`) o miente.
- **Propuesta:**
  - **El archivo va como cuerpo crudo** (`application/octet-stream`), no como `multipart`. El
    nombre, el proveedor y el tipo de lista van en la dirección (`?name=&supplierId=&kind=`, con
    el nombre en `encodeURIComponent`). Así:
    - no hace falta un lector de `multipart` (menos código y menos fallas posibles);
    - `XMLHttpRequest` muestra el avance igual;
    - el pedido sigue sin ser «simple» para el navegador: `application/octet-stream`, como JSON,
      obliga a otro sitio a preguntar antes (`preflight`), además del control de `Origin` y de la
      cookie `SameSite=Strict`.
  - **La plataforma suma una excepción con nombre**, `http.upload(path, …)`. Vale para un solo
    camino y un solo método, y solo cambia dos cosas: el tamaño, que lo da la ruta, y el
    `Content-Type` aceptado, `application/octet-stream`. El control de `Origin`, del dispositivo y
    de la versión del contrato sigue igual.
  - **El orden en la ruta:** sesión, permiso, límite (punto 4), lugar en la cola (punto 8),
    `Content-Length` contra el ajuste y, recién ahí, leer el cuerpo como flujo. Mientras llega, se
    cuentan los bytes y se calcula el SHA-256. Pasado el tope, se corta la conexión. Los primeros
    bytes se miran apenas llegan.
  - **En Caddy**, un `handle` para `POST /api/price-lists/lists` con `max_size 100MB` (el máximo
    del ajuste, 06 · R8.3) antes del de `/api/*`, que sigue en 64 KB.
  - **El tiempo de un pedido:** el `requestTimeout` de Node es de 300 s por omisión, y 100 MB por
    un celular lento tardan más. No se sube para todo el servidor, porque abre la puerta a
    conexiones lentas a propósito. Se corta la subida si no llega nada en 30 s.

  Cuesta lo mismo que lo previsto si se escribe así desde el principio. **Las pruebas:**
  - sin sesión y sin permiso, un cuerpo de 50 MB se contesta `401` o `403` sin leerlo: lo leído
    es 0;
  - un `chunked` que pasa el tope se corta en el tope;
  - un `POST` JSON de 1 MB a otra ruta de `price-lists` sigue dando `400 size`;
  - un `multipart` a la subida, `400`.

### 4. El límite «por dispositivo» lo elige quien manda el pedido — Mejora

- **Dónde:** § 8, «subir tiene un límite por dispositivo (10 por minuto) y como mucho 4 listas
  leyéndose a la vez por persona»; `platform/guards.ts`, `byAddressAndDevice`.
- **El ataque:** el dispositivo de los límites de la plataforma es la cabecera que manda la
  aplicación, que es cualquier UUID (`http.ts`, `identify`). Alguien con «Cargar listas», o un
  programa con su cookie robada, cambia la cabecera en cada pedido y el límite de 10 por minuto no
  lo frena nunca. Con la clave de la dirección, tampoco frena a quien está detrás de otra red. El
  de 4 a la vez por persona sí vale, pero cuenta lecturas: no cuenta subidas en curso ni archivos
  guardados.
- **Propuesta:** las claves, de la sesión ya resuelta, como hacen `administration` y `audit-log`:
  `price-lists:upload:person:<userId>`, más una global. Contar también lo que se sube en ese momento
  (como mucho 2 por persona, 4 en todo el servidor). Aplicar, cambiar de proveedor (que vuelve a
  leer) y descartar llevan su límite por persona. Bajar el archivo lleva el suyo (punto 8). Cuesta
  unas líneas. **La prueba:** 11 subidas en un minuto con 11 dispositivos distintos y la misma
  sesión: la última da `429`.

### 5. Nada pone tope a lo que se guarda: el disco de la base se llena — Mejora (disponibilidad)

- **Dónde:** § 1, «El archivo original se guarda en la base […] una vez por contenido»; § 2,
  `files`, `list_rows`; R4.4 («se guarda siempre», también lo que no se pudo leer o se descartó).
- **El ataque:** quien tiene «Cargar listas», o una sesión suya robada, o un programa que la usa,
  sube cada vez el mismo archivo de 30 MB cambiado en un byte. Con un byte distinto, el SHA-256 es
  otro y no se deduplica. Cancela apenas sube (R4.11): la lista queda descartada y su archivo,
  guardado para siempre. Con el límite del diseño son 10 por minuto, o sin límite con el punto 4:
  18 GB por hora. Si un Administrador puso el tope en 100 MB, son 60 GB por hora. Cada lectura deja
  además hasta 200.000 filas en `list_rows` hasta el día siguiente. Cuando se llena el disco de
  PostgreSQL, no se puede vender. Borrarlo pide entrar a la base: la aplicación no tiene cómo.
- **Propuesta:**
  - **Una cuota por persona:** 30 listas o 500 MB por día, y otra para todo el servidor, que
    contesten `429`.
  - **Antes de aceptar un archivo, mirar cuánto ocupan los archivos** (`sum(size)` en la memoria,
    que se suma al guardar) contra un tope que va en la configuración. Si se pasa, se rechaza la
    subida y se abre una anomalía, antes de llenar el disco.
  - **Le propondría a Carlos** que el archivo de una lista que nunca se aplicó y se descartó o se
    canceló se borre a los 90 días. Hoy R4.4 dice «siempre»; decide él.

  Cuesta un día. **La prueba:** pasada la cuota, la subida da `429` y no guarda nada.

### 6. Una fecha futura en la planilla bloquea para siempre las listas de un proveedor — Mejora, antes de programar

- **Dónde:** R4.5 (la fecha sale de la planilla o del nombre del archivo), R6.10 (no se aplica una
  lista anterior a la última aplicada); § 2, `list_date` y `last_list_date`.
- **El ataque:**
  1. La planilla de un proveedor trae en el título «LISTA DE PRECIOS — 14/8/2062». Puede ser un
     error de tipeo o hecho a propósito. También puede venir del nombre del archivo, que pone quien
     sube.
  2. Se lee con fecha 2062, alguien la aplica y `last_list_date` queda en 2062.
  3. Desde entonces, toda lista de ese proveedor da `409 list-too-old` (E65). No hay regla ni
     pantalla para corregir la fecha de una lista aplicada. Solo dar de baja al proveedor y darlo
     de alta con otro nombre, que pierde sus productos y su historia.
  4. Lo mismo, al revés, con una lista del año 1900 que se lee como «anterior» y nadie puede
     aplicar.
- **Propuesta:** una fecha deducida que es posterior a la fecha del servidor, o anterior a un año
  atrás, no se toma. La lista usa la del servidor (`date_from = server`), como si no la dijera, y el
  resumen lo dice. Es una regla: se la propongo a Carlos para R4.5. Cuesta unas líneas en
  `rules/deduce.ts`. **La prueba:** una planilla con «14/8/2062» en el título queda con la fecha del
  servidor.

### 7. La auditoría de cada artículo puede anotar lo que se deshizo — Mejora (auditoría)

- **Dónde:** § 4, «Los de cada artículo se anotan en la misma tanda que los aplica»; § 1, «Aplicar es
  una transacción, por tandas de 1.000 filas»; ADR-004 (la auditoría es SQLite, fuera de la
  transacción de PostgreSQL).
- **La falla:** si cada tanda anota sus `items.cost-changed` al terminarla, y en la tanda 7 la
  transacción falla o el servidor se cae (E61), la base vuelve atrás, pero las 6.000 anotaciones de
  costos que nunca se aplicaron quedan en Quién hizo qué. Con la auditoría que no se borra, la
  historia del costo de 6.000 productos (R9.1, «para poder leer después la historia de su costo»)
  queda falsa para siempre. Quien aplica una lista que sabe que va a fallar, por ejemplo una con
  una fila que hace saltar un tope de la base (punto 21), puede llenar la historia de costos que
  nunca existieron.
- **Propuesta:** juntar las anotaciones y escribirlas **recién al confirmar**, con lo que
  `events.transaction` corre después del `commit` (arquitectura, «Una transacción que publica
  eventos»). 200.000 anotaciones chicas en memoria son unos 50 MB como mucho: se puede, o se escriben
  en tandas después de confirmar. Lo mismo con `suppliers.pricing-changed` y su recálculo. Cuesta
  poco si se escribe así desde el principio. **La prueba:** aplicar una lista que falla en la segunda
  tanda no deja ninguna anotación `items.*`.

### 8. La cola de lectura, la memoria del hilo principal y la descarga — Mejora (disponibilidad)

- **Dónde:** § 5, `reading/pool.ts` (2 hilos, la cola); § 3, `GET /lists/:id/file`; `storage/db.ts`
  (`pg` con su conjunto de conexiones de 10 por omisión).
- **Lo que puede pasar:**
  - **La cola, si guarda archivos:** con 4 lecturas por persona y varias personas, la cola tiene
    una docena de archivos de hasta 100 MB. Si guarda el `Buffer` de cada uno, son GB en el hilo
    principal, que no tiene tope.
  - **Una lista que ocupa un hilo mucho tiempo:** cada lector tiene 5 s por planilla (§ 12) y se
    prueban todos, primero los del proveedor y después los de los demás (R5.2). Con 40 lectores en
    la base, una planilla de 200.000 filas que hace llegar a cada lector a su tope ocupa un hilo
    200 s. Dos así frenan todas las lecturas del local durante minutos. El diseño no dice un tope
    para la lectura entera.
  - **Bajar el archivo:** `pg` devuelve un `bytea` como texto hexadecimal y lo convierte. Un archivo
    de 100 MB son unos 300 MB de memoria por descarga. Diez descargas a la vez de quien tiene «Ver
    costos», o de un programa con su cookie, son 3 GB en el proceso que atiende el mostrador. No
    tiene límite.
  - **Las conexiones:** aplicar tiene una conexión hasta 30 s, guardar un archivo grande también
    ocupa una, y las ventas esperan si no queda ninguna (`pg` espera sin tope por omisión).
- **Propuesta:**
  - La cola guarda identificadores: el lector pide el archivo a la base cuando le toca. Como mucho
    50 en espera; pasado eso, la lista queda «leyendo» y espera.
  - **Un tope para la lectura entera** (por ejemplo, 60 s) además del de cada lector. Al pasarlo,
    se termina el proceso o el hilo y la lista queda «No se pudo leer».
  - **Bajar el archivo de a partes** (`substring(bytes from $1 for 1048576)`), escribiendo cada
    parte en la respuesta. Con límite: 2 a la vez y 20 por hora por persona.
  - **Aplicar, de a uno en todo el servidor** (las listas de varios proveedores esperan en fila).
    La subida usa una conexión solo para el `insert`.

  Cuesta un día. **Las pruebas:**
  - con 60 listas en cola, el servidor responde y la memoria no crece con ellas;
  - una lectura que pasa su tope total queda «No se pudo leer»;
  - una tercera descarga a la vez da `429`.

### 9. Las anomalías muestran precios de una lista a quien no tiene «Ver costos» — **Frena**

- **Dónde:** R9.2 («Filas salteadas: […] con cada fila, lo que traía y su motivo»), R1.3 (sin «Ver
  costos» «no se ven costos, descuentos, listas ni productos»), 06 · R9.3 (un solo permiso para las
  anomalías); § 2, `anomalies.summary` («las filas»); § 3, `GET /api/anomalies` con «Revisar las
  anomalías».
- **El ataque:** un rol con «Revisar las anomalías» y sin «Ver costos», por ejemplo uno armado para
  quien atiende y revisa diferencias de caja. Abre Anomalías, o llama a `GET /api/anomalies`, y ve
  filas de las listas con su precio de lista. Las salteadas `no-code`, `repeated-code` y
  `other-currency` traen precio. Con la planilla de cada proveedor es justo lo que R1.3 le niega. Si
  `summary` lleva las filas, el permiso de «Ver costos» no se mira nunca en ese camino. Además el
  resumen de una lista con 50.000 filas salteadas pesa varios MB y va 30 veces por página (punto
  19).
- **Propuesta:** `summary` lleva solo el proveedor, el archivo, el motivo y **cuántas** filas. Las
  filas se piden aparte con `GET /api/price-lists/lists/:id/rows?show=skipped`, que pide «Ver costos»
  y ya está en el diseño (las de una lista aplicada se guardan mientras la anomalía siga abierta,
  § 2). Sin «Ver costos», la anomalía se ve sin las filas y dice qué permiso hace falta para verlas.
  Si Carlos prefiere que «Revisar las anomalías» deje ver las filas, que lo diga 06 · R9.3. Cuesta
  poco. **La prueba:** con «Revisar las anomalías» y sin «Ver costos», ni `GET /api/anomalies` ni el
  detalle traen un precio, y `GET …/rows` da `403`.

### 10. Un resultado de lectura viejo puede pisar el de la lectura nueva — Mejora (integridad)

- **Dónde:** § 3, `POST /lists/:id/supplier` («si cambia, la vuelve a leer»), `POST /lists/:id/cancel`;
  § 1, «guarda las filas en la base de a tandas».
- **La falla:**
  - Una lista se está leyendo como de Bulonera Centro. Se la cambia a Aceros Litoral (E29d) y
    empieza otra lectura. La primera, que ya iba por la mitad, termina después y guarda sus filas,
    su lector (`reader_id`, `new_reader`) y su estado «en espera». Queda una lista de Aceros leída
    con el lector de Bulonera, o con las filas de las dos mezcladas por tandas.
  - Lo mismo con una lista cancelada (E31e) o reemplazada (R4.8): la lectura que termina después
    escribe filas y la pasa a «en espera» si la escritura no mira el estado.
  - Si después alguien la aplica, aplica costos que nadie vio bien.
- **Propuesta:** cada lectura lleva un número (`reading_id`, o el `attempts` del punto 2). Cada
  escritura del resultado, las tandas de filas y el cambio a «en espera» o «No se pudo leer», es
  `… where id = $1 and status = 'reading' and attempts = $2`. Si no toca ninguna fila, se descarta
  el resultado. Cambiar de proveedor o cancelar terminan la lectura en curso. Cuesta unas líneas.
  **La prueba:** con un lector lento de prueba, cambiar el proveedor a mitad deja solo las filas de
  la segunda lectura; cancelar a mitad deja la lista descartada y sin filas.

### 11. Subir, cambiar cómo cobra o dar de baja mientras se aplica — Mejora (integridad)

- **Dónde:** § 1, «cada cambio de estado es una sola sentencia que mira el estado de antes»; § 2, el
  índice único parcial de `lists`; § 3, `deactivate` (`409 list-applying`), `pricing`, `apply`
  (`expected`).
- **La falla:** aplicar dos veces está cubierto (E64): la sentencia que pasa a «aplicándose» solo
  toca una fila «en espera». Lo que no dice el diseño:
  - **Subir otra lista del proveedor mientras se aplica la suya.** El índice único incluye
    `applying`. Si el código «descarta la anterior» sin mirar el estado, pasa a «descartada» una
    lista a mitad de aplicarse, y la transacción de aplicar termina después y la marca «aplicada».
    Si mira el estado, el `insert` choca con el índice y sale un `500`. Lo mismo al cambiar de
    proveedor (`POST /lists/:id/supplier`) a uno que tiene una lista aplicándose, y con dos
    subidas del mismo proveedor a la vez.
  - **Dar de baja y aplicar a la vez:** `deactivate` mira que no haya una lista aplicándose, y
    entre la mirada y su transacción alguien toca aplicar. Queda un proveedor dado de baja con
    productos recién creados y una lista «aplicada». R2.6 lo prohíbe.
  - **Cambiar cómo cobra con «Recalcular» mientras se aplica:** las dos transacciones cambian
    `items` y pueden trabarse entre sí, o recalcular sobre la base vieja.
  - **Los números del botón** (`expected`) se calculan con lo de ahora. Si se comparan antes de
    abrir la transacción de aplicar, un cambio de cómo cobra en el medio aplica otros costos que los
    confirmados. Es lo mismo que el punto 7.1 de la revisión de 06.
- **Propuesta:**
  - Todo lo que cambia una lista o los artículos de un proveedor (subir, cambiar de proveedor,
    aplicar, cambiar cómo cobra, dar de baja, reactivar) traba primero la fila del proveedor
    (`select … for update`) en su transacción.
  - Subir o cambiar de proveedor con una lista aplicándose da `409 list-applying` y no descarta
    nada.
  - Aplicar compara `expected` dentro de su transacción, con el proveedor trabado, y la sentencia
    que pasa a «aplicándose» mira también `suppliers.active`.

  Cuesta unas líneas. **Las pruebas:** dar de baja y aplicar a la vez, subir mientras se aplica y
  dos subidas del mismo proveedor a la vez: ningún `500`, una sola gana y el otro ve su `409`.

### 12. Cada corrida de un lector, en un QuickJS nuevo, sin funciones del servidor y con tope de pila — Mejora, antes de programar

- **Dónde:** ADR-021, «Un lector es código JavaScript que corre en QuickJS…», «Topes»; § 5,
  `reading/worker.ts`; R5.10, E52, E53.
- **Lo que está bien:** QuickJS compilado a WebAssembly solo puede tocar lo que el servidor le pasa
  como función. Una falla de memoria de QuickJS queda adentro de su memoria de WebAssembly y no sale
  al proceso.
- **Lo que falta decir, y cómo se escapa o se molesta si no:**
  - **Reusar el mismo QuickJS entre lectores:** si los lectores de varios proveedores corren en el
    mismo contexto, uno puede cambiar `Array.prototype.map` o dejar algo en `globalThis`, y el
    lector siguiente, de otro proveedor, lee distinto. Uno de la etapa b, escrito por una IA a
    partir de una planilla armada, podría alterar en silencio lo que leen los demás.
  - **Una función del servidor «solo para esto»:** pasarle `console.log`, una función que pide las
    celdas de a poco o una que avisa el avance es una puerta. Por ahí puede inundar el registro,
    pedir otra cosa o devolver un objeto del servidor.
  - **La pila:** sin `setMaxStackSize`, una recursión sin fin desborda la pila de WebAssembly
    (`RuntimeError`) en lugar de un error de JavaScript. El módulo de QuickJS puede quedar en un
    estado roto que la corrida siguiente hereda.
  - **El reloj:** el corte de 5 s mira el reloj en el manejador de interrupciones de QuickJS. Una
    expresión regular de QuickJS sobre una celda armada puede no pasar por ese manejador, según la
    versión. Ahí solo frena el tope del hilo o proceso, que el diseño nombra («si el hilo entero no
    responde, se lo termina») y tiene que existir siempre (punto 8).
  - **El entorno del hilo:** un `Worker` recibe por omisión una copia de `process.env`, que tiene la
    clave de la base. SheetJS corre ahí con todo Node: no está encerrado. Una falla de SheetJS
    alcanzaría la clave.
- **Propuesta, escrita en el ADR:**
  - un runtime y un contexto nuevos de QuickJS por corrida, y un módulo de WebAssembly nuevo tras
    cualquier error que no sea del lector;
  - ninguna función del servidor adentro: las celdas entran como un texto JSON y salen como un
    texto JSON, con tope de tamaño;
  - `setMemoryLimit`, `setMaxStackSize` (por ejemplo, 512 KB) y el corte por reloj;
  - el hilo o proceso lector con el entorno vacío (`env: {}`), sin `workerData` con nada del
    servidor.

  Cuesta lo mismo que lo previsto. **Las pruebas de E52 y E53** suman:
  - un lector que cambia `Array.prototype` y otro que corre después sin enterarse;
  - una recursión sin fin;
  - un lector que busca `process`, `require`, `fetch`, `globalThis.std` y `os`;
  - un lector que devuelve 100 MB de texto.

### 13. El lector automático: los datos de la planilla nunca como código — Mejora, antes de programar

- **Dónde:** § 5, `reading/automatic.ts` («arma un lector de la plantilla»), `reading/template.js`;
  § 2, `readers.code` («el lector, en JavaScript»).
- **El ataque:**
  1. El lector automático se guarda como código.
  2. Si `automatic.ts` lo arma pegando texto en la plantilla, cualquier texto de la planilla que
     llegue ahí queda como código del lector guardado en la base. Por ejemplo, los nombres del
     encabezado que usa para reconocerla, o la marca de un renglón.
  3. Un proveedor manda una planilla con el encabezado `Código"]; …; ["`.
  4. Alguien la aplica sin mirar (R5.7 pide revisarla, pero el botón dice «Aplicar: 4 nuevos…»).
  5. Queda activo un lector cuyo código lo escribió el proveedor.
  6. Ese lector corre después contra las planillas de **todos** los proveedores (R5.2). Puede
     reconocer las de otro y leerlas mal: el punto 14 dice cómo pasa la comprobación.
- **Propuesta:** la plantilla es código fijo, igual para todos los automáticos, y lo que cambia
  (números de columna, el texto del encabezado para reconocerla) va en un JSON aparte, `params`
  (`readers.params jsonb`). El lector lo recibe como dato al correr. Así el código de un automático
  es siempre el de la plantilla: se guarda una vez, o se compara con su SHA-256. Cuesta lo mismo.
  **La prueba:** una planilla con comillas, `]`, `;`, `//` y `${` en el encabezado arma un lector
  cuyo `code` es igual a la plantilla.

### 14. Lo que vuelve del lector: atado a su fila, con topes, y sin «no hay duda» entre proveedores — Mejora

- **Dónde:** R5.4 («todo precio que devuelve está escrito en la planilla»), R5.2, R4.3 («Por su
  lector: […] no hay duda. No se pregunta nada»); § 5, `rules/check.ts`.
- **La falla:**
  - **La comprobación no ata el precio a su fila.** Pide que el precio esté escrito en la planilla,
    no que esté en la fila del código. Un lector equivocado, el de la etapa b escrito a partir de
    una planilla armada o el del punto 13, puede devolver el precio de la fila 40 para el código de
    la fila 41 y pasar. Si toma la columna de un descuento o la de «precio por bulto», pasa
    también.
  - **Un lector de otro proveedor decide de quién es sin preguntar.** Un automático de Bulonera que
    reconoce «una planilla con Código, Descripción y Precio en la fila 1» reconoce también la de
    otro proveedor con el mismo encabezado. La lista queda de Bulonera sin preguntar. Si es
    «completa», el botón da de baja todo lo de Bulonera que no viene. R6.5 avisa si pasa el 20 %,
    pero no si son menos.
  - **Los tamaños:** el contrato del resultado tiene que tener topes:
    - no más productos que filas;
    - códigos, descripciones y marcas con los largos de § 2;
    - precios enteros finitos y positivos (punto 21);
    - sin propiedades de más (`strictObject`, como `__proto__` en la revisión de 06).
- **Propuesta:**
  - **Cada producto devuelve de qué fila salió** (`sheet`, `row`), y la comprobación mira que su
    precio y su código estén **en esa fila**. Es lo que ya hace falta para las salteadas.
  - **Un lector de otro proveedor que la reconoce lleva la pregunta** «¿Es de Bulonera Centro?»,
    como cuando se deduce por el nombre. Solo los del proveedor elegido, o los de un programador,
    deciden sin preguntar. Es un cambio de R4.3: se lo propongo a Carlos.

  Cuesta unas líneas. **La prueba de E48** suma un lector que devuelve el precio de la fila de al
  lado.

### 15. Activar un lector que todavía no tiene su prueba — Mejora

- **Dónde:** § 3, `POST /api/price-lists/readers/:id/active` con «Cambiar los ajustes»; § 2,
  `readers.pending_list_id` («no se usa para otras»).
- **El ataque:**
  1. Alguien con «Cambiar los ajustes» y sin «Cargar listas» manda `{ active: true }` a un lector
     automático que todavía espera su lista (`pending_list_id`), o a uno de una lista descartada si
     el código lo desactiva en lugar de borrarlo (R5.7 dice que se descarta con ella).
  2. Si la ruta solo cambia `active`, el lector queda en uso para todas las planillas.
  3. Nadie revisó esa primera lista, así que nada probó que el lector lea bien. Quien no puede
     cargar listas termina decidiendo cómo se leen.
- **Propuesta:** la ruta solo cambia lectores con `pending_list_id is null` y una prueba
  (`proof_list_id`), o los de un programador. Si no, `404`. Al descartar la lista, el lector se
  borra (R5.7, E45). Unas líneas. **La prueba:** activar un lector pendiente da `404` y no cambia
  nada.

### 16. SheetJS: solo los tres formatos y las opciones cerradas — Mejora

- **Dónde:** ADR-021, «Abrir el archivo con SheetJS»; § 8, «Las fórmulas no se calculan»; E68.
- **La falla:** `XLSX.read` decide el formato por el contenido, no por la extensión. Lo que pasa el
  control de los primeros bytes:
  - **un ZIP** (`PK`) puede abrirse también como `.ods`, `.xlsb` o `.numbers`;
  - **un CFB** (`D0 CF 11 E0`) puede abrirse como un `.xls` de cualquier época o un archivo cifrado;
  - **un «CSV»** (texto) puede abrirse como HTML, SYLK, DIF, PRN o DBF.

  Cada uno es otro lector de SheetJS que se le ofrece a un archivo armado: más superficie para la
  próxima falla, como CVE-2024-22363, la expresión regular lenta que se arregló en 0.20.2. Además,
  por omisión SheetJS:
  - arma un HTML de cada texto con formato (`cellHTML`);
  - guarda los enlaces (`cell.l`);
  - en el CommonJS carga `fs`, y `readFile` lee rutas.
- **Propuesta:**
  - abrir con `XLSX.read(buffer, { type: 'buffer', dense: true, cellFormula: false, cellHTML: false,
    cellStyles: false, bookVBA: false, bookFiles: false, sheetRows: 200001 })`;
  - el CSV, como texto con `type: 'string'` y el separador fijo;
  - después mirar que `workbook.bookType` sea `xlsx`, `xls` o `csv`, y si no, «No se pudo leer» con
    `file-format`;
  - nunca `readFile`, ni nada de `cell.l` ni `cell.h` en lo que se guarda o se muestra;
  - las filas y las hojas se cortan con `sheetRows` al abrir, no después: un `!ref` que dice
    `A1:XFD1048576` no puede hacer armar la tabla entera.

  Cuesta unas líneas. **La prueba de E33** suma un `.ods`, un HTML y un SYLK con extensión `.xlsx`
  o `.csv`. **La de E68** suma una celda con texto con formato que contiene `<img onerror>`.

### 17. El nombre del archivo y la descarga en la aplicación — Mejora

- **Dónde:** § 2, `file_name` (hasta 200 letras); § 3, «El archivo» (`Content-Disposition`,
  `octet-stream`, `nosniff`); § 5, `app/platform/server/upload.ts`.
- **Lo que está bien:** el archivo sale como descarga, con un tipo que el navegador no interpreta,
  `nosniff`, y Caddy ya le pone `Content-Security-Policy: default-src 'none'` a todo `/api`, así que
  ni abriéndolo se ejecutaría. No hay rutas de disco: todo está en la base.
- **Lo que falta decir:**
  - **El nombre lo pone quien sube**, y viene del proveedor. Puede traer:
    - `C:\fakepath\` o `../`;
    - saltos de línea;
    - caracteres de control;
    - caracteres que dan vuelta el texto (U+202E): «lista‮xslx.exe» se lee «listaexe.xlsx» en la
      pantalla y en Quién hizo qué.

    Además, si se escribe en la cabecera sin codificar, un salto de línea hace que Node tire
    `ERR_INVALID_CHAR` y la descarga de esa lista da `500` siempre.
  - **La descarga en la aplicación.** Todo pedido a `/api` lleva las cabeceras del dispositivo y del
    contrato, así que un enlace común no sirve: la aplicación va a pedir el archivo con `fetch`,
    armar un `Blob` y bajarlo. Si en lugar de `<a download>` abre la dirección `blob:` en una
    pestaña, con el tipo que adivina el navegador, un CSV que en realidad es HTML se abre **en el
    origen de la aplicación**. La política de contenido que hereda frena los scripts en línea, pero
    no conviene depender de eso.
- **Propuesta:**
  - el nombre se guarda limpio: el último pedazo después de `/` o `\`, sin caracteres de control ni
    de dirección del texto (U+200E, U+200F, U+202A a U+202E, U+2066 a U+2069), con su extensión
    entre las tres;
  - la cabecera lleva `filename="…"` solo ASCII, con `"` y `\` cambiados, más `filename*=UTF-8''…`;
  - en la aplicación, el `Blob` siempre `application/octet-stream` y bajado con `<a download>`, nunca
    abierto;
  - y, si se quiere ver quién baja las listas de costos, `lists.downloaded` en la auditoría: es la
    información más sensible del negocio que sale entera de un pedido.

  Cuesta unas líneas. **La prueba de E40** suma un nombre con salto de línea, comillas y U+202E.

### 18. Cambiar un dato de un proveedor: la lista de campos, cerrada — Mejora

- **Dónde:** § 3, `POST /api/price-lists/suppliers/:id` con `{ field, value, version }`.
- **El ataque:** quien tiene «Administrar proveedores» manda `field` con un valor que no es de los
  cinco datos:
  - `active`, `discounts`, `name_key`, `version` o `last_list_date` (este último sirve para el
    bloqueo del punto 6 sin subir nada);
  - o `__proto__` o `constructor`, como en el punto 5 de la revisión de 06.

  Si la ruta hace `update … set ${field}` o busca el campo con `field in schemas`, cambia lo que
  no debía o da `500`.
- **Propuesta:**
  - los campos, en un `Map` del contrato con su esquema: `name`, `seller`, `phone`, `email` y
    `note`;
  - el permiso, antes del campo;
  - el cuerpo estricto, con `version` entre 0 y 2³¹ − 1 y `confirmed` entero no negativo;
  - el nombre que cambia recalcula `name_key`, y un choque con el índice único da `409` (E10), no
    `500`;
  - lo mismo al dar de alta dos con el mismo nombre a la vez;
  - `discounts` con como mucho 20 descuentos, nombres de hasta 40 letras e identificadores UUID.

  Unas líneas. **La prueba:** `field: 'active'`, `'__proto__'` y `'last_list_date'` dan `400`, y dos
  altas a la vez con el mismo nombre, un `409`.

### 19. Mirar una lista grande, sin límite — Mejora

- **Dónde:** § 1, «Lo que cambia se calcula al mirarlo […] en cada pedido»; § 3,
  `GET /lists/:id` y `GET /lists/:id/rows`; § 9 (300 ms con 10.000 filas).
- **El abuso:** el tope de filas es 200.000, veinte veces la meta. El resumen cruza todas las filas
  con los artículos en cada pedido: unos 6 s de base por pedido. Lo puede pedir sin límite:
  - quien tiene «Ver costos», o una sesión suya robada;
  - el espejo, que pide el mismo resumen en el otro dispositivo;
  - una pantalla que reintenta.

  Un programa que lo repite ocupa las conexiones de la base (punto 8) y frena las ventas. Lo mismo
  con `?q=` en `/rows` y en `/items`: si se arma con `like` sin escapar `%` y `_`, `q=%` recorre
  todo. Y un `q` de 64 KB llega entero.
- **Propuesta:**
  - un límite por persona en los `GET` de una lista (por ejemplo, 60 por minuto, y aparte los
    automáticos, como `audit-log`);
  - guardar el resumen calculado mientras no cambien la lista, el proveedor ni los ajustes (con
    sus versiones como clave);
  - `q` de hasta 100 letras, buscado con `like` y `%` y `_` escapados, como parámetro;
  - `after`, `show`, `status` y `kind` validados con su forma;
  - y `uuidParams` en cada ruta con `:id`.

  Unas líneas. **La prueba:** el pedido 61 en un minuto da `429`; `q=%` no trae nada que no diga
  `%`.

### 20. Los datos de los vendedores en la auditoría y en el dispositivo — Mejora (decide Carlos)

- **Dónde:** § 4, `suppliers.created` («Sus datos»), `suppliers.changed` (lo anterior y lo nuevo, E11);
  § 6, «Sin conexión, cada pantalla muestra en gris lo último que se vio»; § 8, «Qué datos toca».
- **Lo que pasa:**
  - **La auditoría:** el nombre, el teléfono y el correo de un vendedor son datos personales de
    alguien que no trabaja en la ferretería. Con el diseño quedan en la auditoría, que no se borra
    (05) y no tiene plazo de guarda decidido. Si un vendedor deja la empresa y pide que borren su
    teléfono, la pantalla lo borra pero Quién hizo qué lo sigue mostrando, a quien tiene ese
    permiso, con el anterior y el nuevo. No sale de la máquina y lo pide E11. Lo anoto para que
    Carlos lo decida sabiendo esto.
  - **El dispositivo:** si «lo último que se vio» se guarda en `localStorage` o IndexedDB, quedan en
    el celular de cualquier empleado los datos de los vendedores y, con «Ver costos», los costos de
    todos los proveedores. La arquitectura no los nombra entre lo que se guarda.
- **Propuesta:**
  - **Lo último que se vio, solo en memoria** y por persona, como `administration`, y que § 6 lo
    diga.
  - **Para la auditoría, que Carlos elija** entre:
    - anotar los datos de contacto como «cambió el teléfono», sin los valores;
    - anotarlos y que el plazo de guarda de 05 los cubra;
    - o dejarlo como está (E11).
  - Los datos, con `privateProps()` en la vista, como dice § 8.
  - Si la vista arma un enlace con el teléfono o el correo (`tel:`, `mailto:`, `https://wa.me/`),
    va con el esquema fijo y el valor codificado, nunca el campo como dirección.

### 21. Los precios enormes y la cuenta del costo — Mejora

- **Dónde:** § 1, «El costo se calcula […] con enteros (millonésimos de peso)»; § 2, `list_price
  bigint`, `cost bigint`, `percent` en milésimos.
- **La falla:** un precio de lista de $ 10.000.000 son 10¹³ millonésimos. Multiplicado por un
  descuento en milésimos de porcentaje (hasta 10⁵) da 10¹⁸, que pasa los 2⁵³ en que un `number` de
  JavaScript deja de ser exacto. Una celda con `9e300`, o un precio que el lector devuelve como
  `Infinity` o `NaN`, puede hacer fallar el `insert` en `bigint` a mitad de aplicar. La lista queda
  «en espera» con el motivo (con el punto 7, sin auditoría falsa) y vuelve a fallar en cada intento,
  sin decir qué fila. Hecho a propósito por un proveedor, deja su lista sin aplicar. Con la etapa b
  el que lo devuelve puede ser el lector.
- **Propuesta:**
  - un tope en el contrato del lector y en R5.4: un precio de lista de hasta $ 1.000.000.000; si
    no, la fila se saltea con `not-a-number`;
  - la cuenta de `cost.ts` en `bigint`, o mostrar que con los topes nunca pasa 2⁵³.

  Unas líneas. **La prueba de E49** suma una fila con `9e300` y otra con 10¹².

### 22. Dependencias: SheetJS desde su sitio y `quickjs-emscripten` — Mejora

- **Dónde:** ADR-021, «Se instala desde el sitio de SheetJS»; «Consecuencias».
- **Lo que encontré:**
  - **SheetJS CE:** la última de `cdn.sheetjs.com` es la 0.20.3. Sus advertencias son
    CVE-2023-30533 (contaminar prototipos, arreglada en 0.19.3) y CVE-2024-22363 (expresión regular
    lenta, arreglada en 0.20.2). OSV no tiene nada contra la 0.20.3. Las otras tres de OSV son de
    SheetJS Pro de 2021. Fijar la 0.20.3 con su suma es lo correcto, y en el `pnpm-lock.yaml` queda
    con `integrity`.
  - **Pero `pnpm audit` (en `pnpm check`, `vulnerable`) probablemente no mira un paquete instalado
    desde una dirección propia**: no está en el registro de npm. No lo pude comprobar sin
    instalarlo. Si es así, una falla nueva de SheetJS no frena ningún `pnpm check`.
  - **SheetJS en CommonJS** carga `fs` al importarse. Solo importa si se usa `readFile` (punto 16).
  - **`quickjs-emscripten` 0.32.0** (febrero de 2026): OSV no tiene fallas contra el paquete.
    QuickJS tiene fallas de memoria cada tanto, como CVE-2025-69654, que tira el intérprete al
    quedarse sin memoria. Compilado a WebAssembly, una falla así queda adentro de su memoria: puede
    romper esa corrida, no salir al servidor (punto 12). El paquete trae cuatro variantes de
    WebAssembly (`release` y `debug`, `sync` y `asyncify`), y solo se usa una.
- **Propuesta:**
  - **Instalar `quickjs-emscripten-core` más `@jitl/quickjs-wasmfile-release-sync`**, no el paquete
    que trae todo: una sola variante, menos código.
  - **Un control en `pnpm check`** que compare la versión de SheetJS del `pnpm-lock.yaml` con la
    lista de advertencias de `cdn.sheetjs.com/advisories`, o, si no se quiere depender de la red,
    revisarla a mano en cada revisión de seguridad, escrito en el ADR.
  - **La imagen del servidor se arma bajando de `cdn.sheetjs.com`**: hace falta en los dominios
    permitidos del armado. La suma del `pnpm-lock.yaml` cubre un cambio en el sitio.

## Lo que miré y no encontré nada

1. **Entrar sin permiso:** ninguna forma nueva de entrar. Todas las rutas piden sesión (E06), con la
   cookie `__Host-`, `HttpOnly`, `Secure` y `SameSite=Strict` de 01, y el tema del avance no es
   anónimo (`anonymous` no está, y el canal rechaza sin sesión). Pedidos desde otro sitio: la
   plataforma exige `Origin` y las cabeceras del dispositivo y del contrato, que un formulario de
   otro sitio no puede poner. Se mantiene si la subida se hace como dice el punto 3.
2. **Permisos:** cada ruta dice su permiso y el servidor lo mira (R1.4). No hay datos de una persona
   que otra pueda pedir cambiando un identificador: las listas, los proveedores y los artículos son
   del negocio y los ve todo quien tiene «Ver costos», que es lo que dicen las reglas. Cualquiera con
   «Cargar listas» puede cancelar o descartar la lista que subió otro: es lo que dicen R4.11 y R6.11.
   El tema del avance lo escucha quien tiene «Ver costos», y se vuelve a mirar con el evento de los
   permisos. En el código se llama `users.permissions-changed`, no `permissions.changed`, y el tipo
   de `recheckOn` no deja escribir otro. Una cuenta dada de baja pierde sus sesiones y sus canales
   (01), así que no puede nada. Lo único que se ve de más es lo del punto 9.
3. **Lo que entra de afuera:** los cuerpos JSON tienen el tope de 64 KB de la plataforma. Todo va a
   la base como parámetro con Kysely, sin armar SQL con texto, salvo lo que advierten los puntos 18
   y 19. Ninguna celda se usa como ruta ni como nombre de archivo (§ 8). XML con entidades: no aplica
   (punto 1). Fórmulas: no se calculan y SheetJS no las ejecuta. Una celda `=HYPERLINK(…)` es texto.
   El CSV con fórmulas solo importaría si la aplicación exportara un CSV armado por ella, y en esta
   etapa no lo hace: el original se baja tal como llegó, y ya estaba en el correo de quien lo subió.
4. **La aplicación en el navegador:** las celdas, el nombre del archivo, los datos del proveedor y
   las notas se muestran como texto. `pnpm lint` ya prohíbe armar HTML con texto. La página no se
   puede meter en otra (`frame-ancestors 'none'` y `X-Frame-Options DENY` en Caddy). No se baja nada
   de terceros en el navegador: SheetJS corre solo en el servidor. Lo del `Blob`, en el punto 17. Lo
   guardado en el dispositivo, en el punto 20.
5. **Datos personales y secretos:** los únicos datos personales nuevos son los de los vendedores, que
   R1.3 decidió mostrar a todos (punto 20). Nada sale de la máquina en esta etapa: no hay servicios
   de afuera (la IA es de la etapa b, y ahí sí hay que revisar qué le llega). Ningún secreto nuevo.
   Las planillas de prueba son inventadas (§ 10).
6. **Abuso:** en los puntos 1, 2, 4, 5, 8 y 19. El tema del avance, a lo sumo 4 mensajes por segundo
   y con los topes del canal de la plataforma (16 temas por canal, 60 cambios por minuto). Suscribirse
   hace una consulta para el estado de ahora: con esos topes, no preocupa.
7. **Sin conexión:** no se hace nada sin conexión y no hay cola (§ 6, E07): nada que falsear ni
   repetir. La fecha de la lista que no se dedujo la pone el servidor (R4.5). La que sí se dedujo, en
   el punto 6.
8. **Auditoría:** cada cambio sensible tiene su anotación, con quién, cuándo, el dispositivo y la
   dirección (`createGuards.record`). Los rechazos sin permiso se anotan una vez por minuto por
   persona y permiso. Los frenados, una vez por ventana. Los `413`, `415` y `409` no se anotan, y está
   bien: los primeros son de quien tiene el permiso o ya los anota la plataforma (`request.rejected`
   con `size`). La auditoría solo recibe filas (ADR-004). Lo que falta, en los puntos 7 y 17.
9. **El despliegue:** no cambian los puertos, el usuario del contenedor ni los volúmenes: los archivos
   van a la base, no a un volumen nuevo. Lo que cambia y el diseño no dice está en el punto 3 (Caddy y
   el tiempo de los pedidos) y en el 1 (el tope de memoria del contenedor).
10. **Dependencias:** en el punto 22.

Fuentes:

- [Advertencias de SheetJS](https://cdn.sheetjs.com/advisories/), entre ellas
  [CVE-2024-22363](https://cdn.sheetjs.com/advisories/CVE-2024-22363.html);
  [GitLab Advisory Database, CVE-2024-22363](https://advisories.gitlab.com/pkg/npm/xlsx/CVE-2024-22363/);
  [Snyk, SNYK-JS-XLSX-6252523](https://security.snyk.io/vuln/SNYK-JS-XLSX-6252523).
- La consulta a [OSV](https://osv.dev) de `xlsx`, `quickjs-emscripten` y
  `@jitl/quickjs-wasmfile-release-sync`.
- `resourceLimits` no limita los `ArrayBuffer`:
  [documentación de `worker_threads`](https://nodejs.org/download/docs/v12.22.5/api/worker_threads.md)
  y [el cambio que lo agregó](https://github.com/nodejs/node/commit/89c837a48d). Lo probé con Node
  22.23.
- [quickjs-emscripten](https://github.com/justjake/quickjs-emscripten) y su
  [README de la 0.32.0](https://cdn.jsdelivr.net/npm/quickjs-emscripten@0.32.0/README.md);
  [CVE-2025-69654](https://www.wiz.io/vulnerability-database/cve/cve-2025-69654).
- El código de SheetJS 0.20.3, bajado de `cdn.sheetjs.com/xlsx-latest/xlsx-latest.tgz`:
  `xlsx.js`, `new_unsafe_buf` (línea 210), `inflate` (2629), `parse_local_file` (2773) y
  `unescapexml` (3846).
