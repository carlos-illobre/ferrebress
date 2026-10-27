# Revisión de seguridad · 01 · Entrar (`sign-in`)

Revisión independiente del [diseño](sign-in.md) desde el punto de vista de un atacante
(constitución, paso 4). Todavía no hay código. Leí la constitución, el capítulo
[01](../../chapters/01-sign-in/rules.md) y las partes del [00](../../chapters/00-app/rules.md) que el
diseño construye, la [arquitectura](../architecture.md), los ADR 003, 004, 006, 007, 011 a 016 y la
[revisión del diseño](sign-in-design-review.md). Las correcciones de esa revisión ya están en el
diseño; acá van solo lo que sigue abierto y lo nuevo. Lo que decidió Carlos (§ 15) no se discute:
solo se señala un riesgo que traiga y no esté cubierto.

- **Frena:** se puede entrar, ver o cambiar lo ajeno, o filtrar datos personales. Se resuelve antes
  de que Carlos apruebe el diseño.
- **Mejora:** conviene hacerla; no frena.

## Resumen

El diseño cierra bien lo que la revisión anterior abrió: el canal y el permiso del QR atados a la
computadora por una cookie, el código de 128 bits que genera el servidor, la reserva al leerlo, la
huella con verificación obligatoria, el `nonce` de Google de un uso, la cuenta atada al
identificador de Google, la cookie `__Host-` con duración, `frame-ancestors` y los límites contados
por lo que demuestra algo de la cuenta.

Frenan tres cosas, y las tres son baratas de arreglar en el documento:

1. Con Docker sin privilegios (§ 14), el servidor **no ve la dirección real** de nadie: todos los
   pedidos parecen venir de la misma. Eso apaga el aviso de ciudad de R2.5, junta los límites de
   todos en uno y deja la auditoría sin «desde dónde».
2. **La ciudad desconocida** no tiene regla: quien arma una página falsa puede elegir una dirección
   sin ciudad y el celular no avisa nada.
3. La búsqueda **por correo cuando no coincide el identificador de Google** está escrita de una
   forma que, programada al pie de la letra, deja entrar a otra persona con un correo reasignado.

| # | Punto | Gravedad |
|---|---|---|
| 1 | Docker sin privilegios pierde la dirección de internet real | **Frena** |
| 2 | La ciudad desconocida apaga el aviso de R2.5 | **Frena** |
| 3 | Buscar por correo una cuenta que ya tiene otro identificador de Google | **Frena** |
| 4 | El nombre de la computadora («Chrome en Windows») lo escribe la computadora | Mejora importante |
| 5 | La llave de prueba: dónde vive y que hoy es un secreto que se puede copiar | Mejora importante |
| 6 | Topes de lo que vive en memoria: qué pasa al llegar, y `/api/start` sin límite | Mejora importante |
| 7 | Sin tamaño máximo de los cuerpos ni de las cabeceras | Mejora importante |
| 8 | Pedidos desde otros sitios: la comprobación del origen, también sin sesión y sin cuerpo | Mejora importante |
| 9 | El emisor de prueba de Google y el script de prueba en un ambiente desplegado | Mejora importante |
| 10 | La reserva del código no está atada a quien lo leyó; «No soy yo» lo puede tocar cualquiera | Mejora |
| 11 | El desafío de `approve` no está atado al código | Mejora |
| 12 | El límite por cuenta todavía se puede gastar con el identificador de una credencial | Mejora |
| 13 | Dar de baja: la sesión en memoria y el evento | Mejora |
| 14 | Hasta el módulo 02 no hay cómo cerrar una sesión ni quitar una huella | Mejora |
| 15 | Lo que queda en el dispositivo al salir, y el aviso de «Algo salió mal» | Mejora |
| 16 | El service worker y `/api` | Mejora |
| 17 | Cabeceras que faltan en la lista de Caddy | Mejora |
| 18 | XSS: un control en `pnpm check` y el script de Google solo en la entrada | Mejora |
| 19 | Auditoría: lo que falta, lo que se puede inflar y el correo de quien no está autorizado | Mejora |
| 20 | El canal de ntfy queda a la vista en los registros públicos de GitHub | Mejora |
| 21 | Los workflows en un repositorio público | Mejora |
| 22 | `DATABASE_URL` es un secreto | Mejora |
| 23 | Dependencias: sin versiones no se pueden buscar fallas; las que ya se conocen | Mejora |

---

## 1. Entrar sin permiso

### 1 · Docker sin privilegios pierde la dirección real (§ 14, § 8, § 9) — Frena

**Dónde:** § 14 («Docker sin privilegios necesita permitir los puertos 80 y 443») junto con § 8
(«La dirección de internet sale de la cabecera que pone Caddy») y § 11 (`TRUSTED_PROXY`).

**El problema.** Con Docker sin privilegios (rootless), el puerto publicado lo atiende RootlessKit.
Su manejador por omisión (`builtin`) no conserva la dirección de origen: Caddy ve todas las
conexiones como si vinieran de la misma dirección interna (127.0.0.1 o la puerta de la red de
RootlessKit), y pone esa en la cabecera que lee el servidor. La propia documentación de RootlessKit
y el script `dockerd-rootless.sh` lo marcan así; la salida que conserva la dirección es el manejador
`slirp4netns` (más lento) o `pasta`. Hay un reporte de que en Docker 29 el cambio a `slirp4netns`
dejó de funcionar; no lo pude comprobar.

**El ataque, paso a paso:**

1. Alguien arma una página falsa que muestra el QR de una entrada de Ferrebress abierta en su
   propia computadora, en otra ciudad (el riesgo que R2.5 quiere notar).
2. La persona del local lee ese QR con el celular. El servidor busca la ciudad de la computadora y
   la del celular… pero las dos direcciones son la misma dirección interna: «ubicación desconocida»
   en los dos lados, o la misma ciudad. No hay aviso.
3. La persona ve «Chrome en Windows», no ve nada raro, pone la huella y el atacante entra con su
   cuenta (hoy, de Administrador).

Además, con todas las direcciones iguales:

- **Los límites por dirección (§ 8) son uno solo para todo el mundo.** Cualquiera que haga 10
  intentos con Google en un minuto deja a todos, también al local, sin poder entrar con Google ese
  minuto, y lo puede repetir sin fin. Lo mismo con los pedidos sin sesión (pantallas de QR,
  lecturas, desafíos).
- **La auditoría no dice desde dónde** (E44, § 9): todas las filas tienen la misma dirección.

**Qué propongo:** que el diseño diga cómo se conserva la dirección real y que se pruebe:
`DOCKERD_ROOTLESS_ROOTLESSKIT_PORT_DRIVER=slirp4netns` (o `pasta`) en el servicio de usuario, escrito
en `deploy/README.md`, y una prueba de punta a punta en la máquina que entra desde una dirección
conocida y mira la que anota la auditoría. Si no se consigue, la alternativa es que Caddy corra con
la red del anfitrión (`network_mode: host`) o con privilegios solo para él, que es una decisión de
ADR-010. Cuesta: una variable y una prueba; probarlo en la máquina el primer día (tarea 3).

### 2 · La ciudad desconocida apaga el aviso (§ 8, «Si falla o tarda más de 200 ms»; R2.5) — Frena

**Dónde:** § 5 («si no coinciden, el celular muestra el aviso») y § 8 («la ciudad es "ubicación
desconocida" y la entrada sigue»).

**El problema.** El diseño no dice qué pasa si una de las dos ciudades es desconocida. Programado
como «si las dos son distintas, aviso», la desconocida contra una conocida es un caso que nadie
decidió, y desconocida contra desconocida «coincide».

**El ataque:** el mismo de arriba, sin necesidad del punto 1. El atacante abre la entrada desde una
dirección que la base local no ubica (hay rangos de servidores y salidas de VPN o Tor sin ciudad en
las bases gratuitas), o una que tarda; el celular muestra «Chrome en Windows · ubicación
desconocida», sin el aviso grande, y la persona pone la huella. El aviso de R2.5 es la única defensa
que la regla pone contra el código copiado; si el atacante lo puede apagar eligiendo su dirección,
no defiende.

**Qué propongo:** que la ciudad desconocida de cualquiera de los dos lados cuente como «no
coinciden», con un texto propio («No se pudo saber desde dónde pide entrar esta computadora. Si no
la tenés adelante, no pongas la huella»). Es un texto nuevo en una hoja aprobada: Carlos tiene que
verlo (ajuste del paso 2). Cuesta: una rama en la regla y un texto.

**Una mejora aparte, para Carlos:** en el local, el celular por Wi-Fi y la notebook salen por la
misma dirección pública. «Misma red que este celular» es una señal mucho más fuerte que la ciudad
(una ciudad grande no distingue al atacante de la ferretería) y no le cuesta nada al servidor. Es un
cambio de regla; lo dejo como pregunta.

### 3 · Buscar por correo una cuenta que ya tiene otro identificador (§ 5, Google, paso 3) — Frena

**Dónde:** «Busca la cuenta por `google_subject`; si no lo tiene todavía, por correo en minúsculas,
y guarda el `google_subject`».

**El problema.** La frase se puede leer como «si no la encuentra por identificador, la busca por
correo y le guarda el identificador», sin mirar si esa fila ya tenía otro. Programado así, se pierde
justo lo que el identificador de Google debía cerrar (revisión del diseño, 5.15).

**El ataque:**

1. El Administrador autoriza `juan@ferreteria.com.ar` (un dominio propio en Google Workspace, o un
   correo de otro proveedor asociado a una cuenta de Google). Juan entra; la fila guarda su
   identificador S1.
2. Juan se va. El dominio le da el mismo correo a otra persona, o el proveedor recicla la dirección y
   alguien crea una cuenta de Google con ella: identificador S2, correo verificado.
3. Esa persona entra con Google: no hay fila con S2; la busca por correo, encuentra la de Juan, le
   pisa el identificador con S2 y entra como Juan, con su rol.

**Qué propongo:** escribirlo sin ambigüedad: por correo solo se buscan filas **sin**
`google_subject`; si la fila del correo tiene otro identificador, es `not-authorized` y queda en la
auditoría como rechazo con los dos identificadores. Una prueba que intenta el paso 3. Cuesta: una
condición en la consulta y una prueba.

### 4 · El nombre de la computadora lo escribe la computadora (§ 3 `device_label`, § 10 `platform/device`) — Mejora importante

**Dónde:** «el nombre "Chrome en Windows" (de `navigator.userAgentData`, sin bibliotecas)», que
arma la aplicación y se manda al servidor.

**El ataque:** la computadora del atacante no es un navegador obligado: manda lo que quiere al abrir
su pantalla de QR. Como nombre pone «Notebook del mostrador» o «Chrome en Windows · la del local,
podés poner la huella». El celular lo muestra donde R2.5 dice que la persona tiene que mirar para
notar el código copiado. No es XSS (Preact escapa el texto), pero es la herramienta que pide un
engaño.

**Qué propongo:** que el servidor arme el nombre, de una lista cerrada de navegadores y sistemas
(«Chrome», «Edge», «Firefox», «Safari» × «Windows», «macOS», «Linux», «Android», «iPhone») a partir de
`User-Agent` o de lo que mande la aplicación, y que lo que no esté en la lista sea «Otro navegador».
Cuesta: una tabla chica en `rules.ts`.

### 5 · La llave de prueba (§ 6, § 7; ADR-015) — Mejora importante

**Dónde:** «se crea una llave de prueba, también al azar, que la aplicación sí puede leer… Hoy solo
se guarda su hash».

**Lo que falta.** § 2 lista lo que se guarda en el dispositivo y la llave no está; IndexedDB queda
prohibido hasta el módulo 15, así que va a terminar en `localStorage`. El diseño no lo dice.

**Por qué importa ahora, aunque hoy solo sirva para salir:** por R4.3, en el módulo 15 esa llave
alcanza para que el servidor acepte cosas a nombre de la persona **aunque la sesión haya vencido**.
Es un secreto que vale más que el pase y que vive donde cualquier código de la página lo lee:

1. Cualquier XSS, una extensión del navegador o el propio script de Google (que corre en el mismo
   origen) leen `localStorage` y copian la llave.
2. En el módulo 15, quien la tenga manda comandos «hechos sin conexión» a nombre de esa persona,
   desde cualquier lado, mientras la sesión no se haya cerrado a mano (30 días de fila guardada).

**Qué propongo:** cambiar ahora la forma, que después cuesta una migración y tocar la sesión: que la
aplicación genere un par de llaves con WebCrypto **no exportable** (ECDSA P-256), mande la pública al
entrar y el servidor guarde la pública (`proof_public_key`) en lugar del hash. Hoy la salida
pendiente firma «salir de la sesión X» con la hora del servidor conocida; el módulo 15 firma cada
comando. Un XSS puede usar la llave mientras está en la página, pero no llevársela. Hay un detalle:
una llave no exportable se guarda en IndexedDB (no entra en `localStorage`), así que la excepción de
§ 2 tendría que nombrarla. Si se prefiere no tocarlo: decir que la llave va en `localStorage`, que se
borra al salir con conexión y que el módulo 15 revisa esta decisión. Cuesta: unas 30 líneas y una
columna distinta.

## 2. Permisos

### 10 · La reserva del código y «No soy yo» (§ 4 `codes/read` y `codes/cancel`) — Mejora

**Dónde:** `read` y `cancel` van sin sesión y «llevan el código».

**El ataque (disponibilidad):** alguien que ve la pantalla de la computadora (un cliente en el
mostrador, una cámara) lee el código con su celular sin sesión: lo reserva por 5 minutos, y el celular
del dueño ya no lo puede leer. Lo repite con cada código nuevo. O, cuando el dueño ya lo leyó, manda
`cancel` con el mismo código y le corta la entrada. No entra a nada, pero la entrada por QR deja de
servir mientras esté ahí. Y quien lee recibe el nombre y la ciudad de la computadora sin probar nada.

**Qué propongo:** que `read` devuelva un secreto de la reserva (al azar, solo a quien leyó) y que
`approve` y `cancel` lo exijan; que leer sin sesión cuente para el límite por dirección más bajo;
y que la aplicación borre el `#código` de la dirección con `history.replaceState` apenas lo lee, para
que no quede en el historial ni se comparta. Cuesta: un campo más en la reserva.

### 11 · El desafío de `approve` (§ 4 y § 5) — Mejora

El diseño no dice de dónde sale el desafío de la huella con la que se aprueba un código. Si es el
mismo de `/api/sign-in/passkey/options`, la firma no dice qué computadora se aprobó: una firma
pedida para entrar en el celular serviría para aprobar un código. Hoy no encuentro cómo conseguir
esa firma sin un XSS, pero atarla cuesta poco: que `read` devuelva el desafío de esa reserva y que
`approve` solo acepte una firma de ese desafío. Así «la huella que puso es para esta computadora»
queda en la firma.

### 12 · El límite por cuenta todavía se puede gastar (§ 8; R2.10) — Mejora

«Una firma que no verifica para una credencial que existe» cuenta para la cuenta dueña. El
identificador de una credencial no es secreto para WebAuthn: lo manda el celular en cada entrada, y
queda en cualquier registro o captura de tráfico. Quien lo tenga manda 20 firmas basura en una hora
(desde direcciones distintas, para esquivar el límite por dirección) y deja a esa persona una hora sin
entrar por ningún camino, también con Google. R2.10 está aprobada; lo que propongo es solo cómo se
cuenta: que el bloqueo de la cuenta por fallos de huella frene **la huella** de esa cuenta y no
Google (o que cuente por cuenta y dispositivo). Es una pregunta para Carlos, porque cambia qué
significa «esa cuenta espera».

### 13 · Dar de baja (§ 6, «Dar de baja») — Mejora

`sign-in` cierra las sesiones al escuchar `user.deactivated`. Si el evento se publica después de
confirmar la baja y el servidor se reinicia entre las dos cosas, las sesiones abiertas siguen valiendo
hasta su tope (8 horas). Propongo: que `sign-in` cierre las sesiones dentro de la misma transacción
de la baja (la arquitectura deja pasar la transacción a la fachada del otro módulo), que las saque
de la memoria en el mismo paso, y que la lectura en frío de una sesión (después de reiniciar) traiga
también si la persona está activa. Es del módulo 02, pero la sesión se arma acá.

### 14 · Hasta el módulo 02 no hay cómo cerrar a distancia (§ 1, § 3) — Mejora

En este módulo todos son Administrador y no existen las pantallas para dar de baja, cerrar una
sesión o quitar una huella (principio VIII: «las sesiones se cierran a distancia»). Si se pierde el
celular vinculado en el ambiente de pruebas, la única salida es tocar la base a mano. Propongo una
línea en `deploy/README.md` con las dos sentencias (cerrar las sesiones de una persona, marcar
`revoked_at` en sus huellas) y que el servidor saque de su memoria lo cerrado (o reiniciarlo).
Cuesta: un párrafo.

## 3. Lo que entra de afuera

### 6 · Los topes de memoria y `/api/start` sin límite (§ 8) — Mejora importante

**Dónde:** la tabla de § 8: `nonce` de Google, tope 1.000 en 10 minutos; desafíos, 1.000 en
5 minutos; pantallas con QR, 100. El párrafo de límites lista «abrir una pantalla con QR, leer un
código, pedir desafíos», pero no `GET /api/start`, que da un `nonce` en cada llamada.

**El ataque:**

1. Un programa llama a `GET /api/start` dos veces por segundo, sin cookie. En 10 minutos llena los
   1.000 `nonce`.
2. Si al llegar al tope el servidor no da más: nadie puede entrar con Google. Si saca los más viejos:
   el `nonce` de quien está por tocar el botón ya no existe y su entrada falla.
3. Con 100 canales abiertos desde varias direcciones, la notebook del local no puede mostrar el QR.

Los límites por dirección no alcanzan solos: con IPv6, una sola conexión tiene millones de
direcciones (un `/64` entero), y en celulares con CGNAT miles de personas comparten una dirección.

**Qué propongo:** (a) `/api/start` también con límite por dirección, o que dé el `nonce` recién cuando
la entrada va a mostrar el botón; (b) decir qué pasa en el tope: se rechaza al nuevo con
`too-many-attempts`, y cada dirección tiene su propio tope chico (por ejemplo 10 `nonce`, 10 desafíos,
3 pantallas), así llenar el total exige muchas direcciones; (c) contar IPv6 por `/64`; (d) los números
de los límites por dirección en el archivo de configuración y en el diseño, que hoy no están; (e) que
las sesiones en memoria guarden solo las válidas (una cookie inventada consulta la base y no se
guarda). Cuesta: unas líneas en `platform/rate-limit`.

### 7 · Sin tamaño máximo (§ 4, § 13 «Todo cuerpo de pedido, con su contrato») — Mejora importante

Los contratos validan la forma después de leer el cuerpo entero en memoria. `POST
/api/sign-in/google` es sin sesión: mandarle cuerpos de cientos de megas desde varias direcciones
llena la memoria del servidor, que en la VM gratuita comparte con PostgreSQL. Propongo
`request_body { max_size 64KB }` en Caddy para `/api/*`, el mismo tope en Hono (`bodyLimit`), largos
máximos en los contratos (el pase de Google, unos 2 KB; una respuesta de WebAuthn, unos 4 KB; el
código, 32 caracteres), y `X-Device-Id` y `X-App-Version` validados como UUID y versión, también para
lo que se escribe en la auditoría. Cuesta: tres líneas y los `max` de zod.

### 9 · El emisor de prueba en un ambiente desplegado (§ 11, `GOOGLE_ISSUER`, `GOOGLE_SCRIPT_URL`) — Mejora importante

Para que el código sea el mismo en las pruebas, el emisor de Google sale del `.env`. Las pruebas de
punta a punta necesitan un emisor de prueba con su llave privada; en un repositorio público, esa
llave suele terminar en el repositorio. Si un `.env` desplegado (pruebas o producción) apunta por
error al emisor de prueba, cualquiera que lea el repositorio fabrica un pase de Google con el correo
del Administrador y entra. Lo mismo con `GOOGLE_SCRIPT_URL`: un valor equivocado es correr código
ajeno en la página.

Propongo: (a) la llave del emisor de prueba se genera al arrancar cada corrida de pruebas y nunca se
guarda; (b) el servidor no arranca si `ENVIRONMENT` es `testing` o `production` y el emisor no es
`https://accounts.google.com` (o las llaves no son las de Google); hay que separar la marca de «pruebas
de punta a punta» del ambiente de pruebas desplegado, que usa Google de verdad (§ 17). Cuesta: una
comprobación al arrancar.

## 4. La aplicación en el navegador

### 8 · Pedidos desde otros sitios (§ 13, «la comprobación del origen en todo pedido que cambia algo») — Mejora importante

Está bien planteado; falta precisarlo para que no se programe a medias:

- **También sin sesión.** `SameSite=Strict` no sirve donde no hay cookie: `sign-in/google`,
  `passkey`, `codes/read`, `approve`, `cancel` y `sign-out` con llave. Hay que decir que la
  comprobación del origen corre en todos los `POST`, con o sin sesión (si no, una página ajena puede
  hacer entrar al navegador con la cuenta del atacante o cortarle la reserva a otro).
- **Sin cuerpo también.** La falla CVE-2024-48913 de Hono (antes de 4.6.5) dejaba pasar por su
  middleware `csrf` un `POST` sin `Content-Type`, que es como sale un `fetch` sin cuerpo: justo como
  serían `sign-out` o `claim`. Propongo una comprobación propia en `platform/http`: todo pedido que no
  es `GET` exige `Origin` igual a `PUBLIC_ORIGIN` (sin `Origin`, se rechaza) y `Content-Type:
  application/json`, y ninguna respuesta lleva cabeceras CORS. Una prueba por cada caso (E42).

### 15 · Lo que queda en el dispositivo al salir, y el aviso de «Algo salió mal» (§ 2, § 10) — Mejora

- El nombre y el rol de quien entró quedan en `localStorage`. En la notebook compartida, después de
  «Salir» siguen ahí para quien abra la consola. Propongo borrarlos al salir (salvo la salida
  pendiente) y decirlo en § 7.
- El aviso de «Algo salió mal» guarda una captura de la pantalla y los últimos pasos «para mandarlo
  cuando exista el módulo 12», pero no está en la lista de § 2 de lo que se guarda en el dispositivo,
  ni dice dónde ni cuánto. Una captura de la pantalla lleva lo que haya en ella: R9.4 pide «sin datos
  de clientes ni la sesión», y en los módulos que vienen la pantalla los tiene. Propongo: decir dónde
  se guarda y con qué tope (uno, el último), que las piezas con datos personales llevan una marca
  (`data-private`) que la captura tapa, y que el aviso se borra al salir. Cuesta: una regla de la
  plataforma, antes de que haya pantallas con datos.

### 16 · El service worker y `/api` (§ 10, «La versión nueva») — Mejora

Decir que el service worker nunca guarda ni contesta nada de `/api/*` (las respuestas traen la
persona y el `nonce`), y que solo se registra desde el propio origen con `worker-src 'self'`. Cuesta:
una línea en la configuración de Workbox.

### 17 · Cabeceras que faltan (§ 13, «Cabeceras de Caddy») — Mejora

La lista no tiene: `X-Content-Type-Options: nosniff`; `Referrer-Policy: same-origin`;
`Cross-Origin-Opener-Policy: same-origin-allow-popups` (el botón de Google abre una ventana);
`img-src 'self' data: blob:` si `html-to-image` lo necesita; `worker-src 'self'`; `object-src 'none'`
y `base-uri 'none'`; y que ZXing, `qrcode-generator` y `html-to-image` se sirven desde el propio
origen (empaquetados), nunca desde un CDN. Y `Cache-Control: no-store` en `/api/*`. Cuesta: líneas
del `Caddyfile` que la prueba de punta a punta de cabeceras ya mira.

### 18 · XSS (§ 10, § 12) — Mejora

Preact escapa el texto; lo que entra de afuera y se muestra (nombre de Google, correo, ciudad, nombre
de la computadora) es seguro mientras nadie use `dangerouslySetInnerHTML`. Propongo prohibirlo con la
regla de Biome `noDangerouslySetInnerHtml` en `pnpm check`. Y que el script de Google se cargue solo en
la entrada: hoy, en una aplicación de una sola página, queda cargado después de entrar, con acceso a
todo lo del origen (la llave de prueba, el punto 5). Al llegar al marco no se puede descargar, pero sí
evitar cargarlo si se abre la aplicación con sesión. Cuesta: una regla y una condición.

## 5. Datos personales y secretos

### 22 · `DATABASE_URL` es un secreto (§ 13, «Secretos: ninguno nuevo») — Mejora

`DATABASE_URL` lleva la contraseña de PostgreSQL. Propongo decirlo en § 13, que el `.env` de la
máquina tenga permisos `600`, y que «el servidor no arranca si falta una» muestre el nombre de la
variable, nunca los valores (ni en los registros ni en «Algo salió mal»). Nada de datos personales
sale de la máquina: la ciudad es local (bien) y el botón de Google lo carga el navegador de la
persona, que es quien entra con Google.

## 6. Abuso y disponibilidad

Cubierto en los puntos 1, 6, 7, 10 y 12. El canal SSE ya no se reconecta solo (§ 5): bien.

## 7. Sin conexión

Hoy solo «Salir». La hora en que se tocó viene del reloj del dispositivo: en la auditoría tiene que
quedar como hora no confirmada (principio VI), no como la hora del hecho. El resto, en el punto 5.

## 8. Auditoría

### 19 · Lo que falta y lo que se puede inflar (§ 9) — Mejora

- **Falta:** el rechazo por origen (E42) y por versión, y el rechazo de un `claim` con permiso vencido
  o de otra pantalla, si no entra en «permiso rechazado». E44 pide «cualquier intento rechazado».
- **Se puede inflar:** si `sign-in.throttled` se anota en cada pedido pasado el límite, un programa
  que insiste escribe una fila por pedido para siempre (la auditoría no se borra). Propongo una fila
  por ventana de límite y por clave (dispositivo, dirección o cuenta), con la cuenta de pedidos.
- **Datos de terceros:** el correo de quien no está autorizado queda en la auditoría para siempre.
  Es útil (R2.10, E20b); conviene decirlo en § 13 como dato personal que se guarda, con el tiempo del
  archivo anual.
- No se puede borrar ni falsear desde la aplicación: solo recibe filas (ADR-004). Bien.

## 9. El despliegue

### 20 · El canal de ntfy en los registros públicos (§ 17, ADR-014) — Mejora

El nombre al azar del canal va «como variable de GitHub». Las variables no se ocultan en los
registros, y en un repositorio público los registros de Actions son públicos: el paso que hace
`curl … ntfy.sh/<canal>` muestra el nombre. Con eso, cualquiera (a) manda avisos falsos sin fin: cada
uno corre `deploy.sh`, que consulta a GitHub; sin token, la API de GitHub corta en 60 consultas por
hora y el despliegue real falla hasta que se libere; y (b) lee el canal de resultados. No despliega
nada ajeno (ADR-014 ya lo cubre). Propongo guardarlo como **secreto** de GitHub (se oculta en los
registros), que `deploy.sh` no corra más de una vez por minuto y que use el token de solo lectura si
hace falta. Cuesta: cambiar `vars` por `secrets`.

### 21 · Los workflows en un repositorio público (§ 14) — Mejora

Propongo escribir en el diseño: ningún workflow con `pull_request_target`; `deploy.yml` solo en
`push` a `main`; `permissions:` mínimos por workflow (`contents: read`; `packages: write` solo en el
que publica); las acciones de terceros fijadas por su commit; y que la máquina baje las imágenes por
su huella (`@sha256:`) además de la etiqueta. Cuesta: unas líneas en los YAML.

**Lo demás del despliegue:** solo 80 y 443 publicados, servidor y PostgreSQL en la red interna,
volúmenes para certificados, base, auditoría y ciudades: bien. `ip_unprivileged_port_start=80`
deja que cualquier usuario de la máquina tome puertos bajos: aceptable en una máquina de un solo uso,
conviene decirlo. `TRUSTED_PROXY` como dirección fija de Caddy necesita que el compose le fije esa
dirección en la red interna; si no, cambia en cada despliegue.

## 10. Dependencias

### 23 · Versiones y fallas conocidas (§ 5, § 10, ADR-012, ADR-013) — Mejora

El diseño no nombra versiones, así que no pude buscar las fallas de cada una. Lo que sí encontré o
sé, para que el paso 6 las tome:

- **Hono:** CVE-2024-48913 (middleware `csrf` salteado sin `Content-Type`, arreglado en 4.6.5) y
  CVE-2024-43787 (salteado con el tipo en mayúsculas, arreglado en 4.5.8). Ver el punto 8.
- **jose:** CVE-2024-28176, descompresión de JWE sin tope (arreglado en 4.15.5). No afecta la
  verificación de un JWS como el pase de Google, pero conviene una versión reciente.
- **ZXing y `html-to-image`:** no pude comprobar cuán mantenidos están hoy; `@zxing/library` estuvo
  en modo solo mantenimiento. Como se bajan recién al usarse y desde el propio origen (punto 17), el
  riesgo es chico.
- `pnpm audit --prod` ya está en `pnpm check` (ADR-016). Propongo fijar las versiones exactas en
  `package.json` y anotar en el diseño la mínima de Hono.
- La base de ciudades se baja una vez por mes: que `deploy.sh` la baje por HTTPS y verifique su
  tamaño o su suma antes de reemplazar la anterior.

## Lo que no pude comprobar

- Si el Docker de la VM conserva la dirección de origen con el manejador elegido (punto 1), y si en
  Docker 29 funciona `slirp4netns`. Hay que probarlo en la máquina.
- Qué parte de las direcciones de los atacantes probables no tiene ciudad en DB-IP Lite (punto 2).
- Si el botón de Google con FedCM pide algo más en `Permissions-Policy` o en la política de
  contenido.
- Cuán mantenidos están ZXing y `html-to-image` (punto 23).

Fuentes de la búsqueda: [RootlessKit, conexiones entrantes](https://rootlesscontaine.rs/how-it-works/netns/incoming),
[moby, discusión 45337](https://github.com/moby/moby/discussions/45337),
[CVE-2024-48913 en NVD](https://nvd.nist.gov/vuln/detail/CVE-2024-48913),
[CVE-2024-48913 en OSV](https://osv.dev/vulnerability/CVE-2024-48913).
