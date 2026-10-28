# Revisión de seguridad · 01 · Entrar (`sign-in`)

Tiene dos partes: la revisión del diseño (paso 4), que sigue abajo tal como se escribió, y la
[revisión del código](#paso-7-el-código) (paso 7), al final, con el estado de cada punto del paso 4.

## Paso 4: el diseño

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

---

## Paso 7: el código

Revisión del código programado en el paso 6 (hasta el commit `c1d3ed3`), contra el
[diseño](sign-in.md) ya corregido. Leí todo `src/server/` (plataforma, `users` y `sign-in`),
`src/shared/contracts/`, la plataforma de la aplicación (con `platform/offline/` y `sw.ts`),
`modules/sign-in/` (con `google/` y `google-button.html`), `modules/frame/` en lo que guarda o
captura, `deploy/` entero, los workflows y `tests/e2e/`. Corrí `pnpm test` (281 pruebas en verde, 100 %
de cobertura) y `pnpm audit --prod` (sin fallas conocidas). Lo que digo que comprobé lo probé con
pruebas propias, fuera del repositorio, contra el código tal cual; no corrí las de punta a punta ni
tuve la máquina de Oracle a mano.

### Resumen

El código cumple casi todo lo que el diseño promete y casi cada ataque tiene una prueba que lo
intenta: el correo reasignado, el emisor de prueba fuera de `e2e`, el origen y el tipo en todo
`POST` (con y sin cuerpo), los 64 KB, el `nonce` de un uso, el desafío de otra reserva, «No soy
yo» sin el secreto, el permiso de otra pantalla, la huella sin verificación, el contador que
retrocede, el límite por cuenta que frena solo la huella, la baja que cierra las sesiones en su
transacción, el hash del pase. La llave de prueba no se puede exportar, el script de Google vive
solo en su marco y cada lado del marco escucha solo al otro y solo de este origen.

Frena una cosa, y es la misma que en el paso 4 con otra cara: **la dirección de internet real no
está comprobada en el despliegue, y hay una razón concreta para pensar que el servidor ve la misma
para todos.** De eso depende la regla de la misma red (R2.5), que es la única defensa contra un QR
copiado en una página falsa.

Además hay cuatro formas baratas de tirar partes del sistema sin entrar, dos de ellas comprobadas:
las pantallas con QR que nunca se liberan y el limitador de intentos que se vuelve lento con
claves inventadas.

| # | Punto | Gravedad |
|---|---|---|
| 24 | La dirección real: `::ffff:` y la cadena de `X-Forwarded-For`, sin probar en la máquina | **Frena** (hasta comprobarlo) |
| 25 | Una pantalla con QR sin canal no se libera nunca | Mejora importante (comprobado) |
| 26 | Canales sin límite para una misma pantalla | Mejora importante |
| 27 | El limitador de intentos: claves inventadas y un barrido que recorre todo en cada pedido | Mejora importante (comprobado) |
| 28 | Los topes totales en memoria se llenan con pocas direcciones | Mejora importante |
| 29 | Aprobar un código no tiene límite de intentos | Mejora (comprobado) |
| 30 | Un JSON roto es un error 500 con su traza en el registro, sin límite | Mejora (comprobado) |
| 31 | Lo que no se anota en la auditoría | Mejora |
| 32 | Lo que el diseño dice que está en `deploy/oracle/` y no está | Mejora |
| 33 | La política de contenido de la aplicación todavía nombra a Google | Mejora |
| 34 | El service worker guarda como página cualquier navegación del sitio | Mejora |
| 35 | Detalles: `ENVIRONMENT=e2e`, la dirección sin validar, `data-private`, la salida pendiente, `pnpm audit`, el compose | Mejora |

### 24 · La dirección real (`src/server/platform/http.ts:69`, `src/server/main.ts:14`, `deploy/Caddyfile:8`) — Frena hasta comprobarlo

**Dónde:** `identify` cree en `X-Forwarded-For` solo si `remoteAddress` es exactamente
`TRUSTED_PROXY` (`172.30.0.10`, fijado en `deploy/compose.yml`). `main.ts` abre el puerto con
`serve({ port })`, sin `hostname`.

**El problema, en dos partes:**

1. **El formato `::ffff:`.** Sin `hostname`, Node escucha en `::` si el sistema tiene IPv6 (en un
   contenedor de Docker lo tiene, aunque la red sea solo IPv4: Docker apaga IPv6 en las interfaces,
   no en el núcleo). En una conexión IPv4 que entra por un socket `::`, `remoteAddress` llega como
   `::ffff:172.30.0.10`, no como `172.30.0.10`. Es el comportamiento conocido de Node en Docker
   (por ejemplo, el `::ffff:172.17.0.1` que reportan otras aplicaciones). Con eso,
   `remote === trustedProxy` nunca se cumple y el servidor anota **la dirección de Caddy para todos
   los pedidos**. Lo reproduje con el servidor de pruebas pasándole `::ffff:<TRUSTED_PROXY>` como
   dirección de la conexión: los pedidos con dos `X-Forwarded-For` distintos quedan con la misma
   dirección. No lo pude comprobar dentro del contenedor (en esta máquina el núcleo no tiene IPv6 y
   Docker no estaba prendido), y la prueba de `http.test.ts` («en un servidor de verdad…») escucha
   en `127.0.0.1`, justo el caso que no tiene el problema. Las e2e tampoco lo ven: todos sus
   navegadores salen de la misma dirección, así que la regla de la misma red pasa igual.
2. **Quién pone la primera dirección de la lista.** El servidor toma la primera de
   `X-Forwarded-For`. El Caddy de Ferrebress confía en cualquier dirección privada
   (`trusted_proxies static private_ranges`) y agrega la suya al final; la primera la pone el proxy
   de la máquina. Eso es seguro solo si el proxy de la máquina **pisa** la cabecera que manda el
   navegador. Caddy lo hace por omisión, salvo que su configuración global confíe en quien se le
   conecta (`trusted_proxies`). Esa configuración no está en el repositorio (el proxy es compartido)
   y no la pude ver. Además, cualquier proceso de la VM que se conecte a `127.0.0.1:8090` llega como
   dirección privada y elige la que quiera.

**El ataque, con la parte 1 (la más probable):**

1. Alguien abre la entrada de Ferrebress en su computadora, en su casa, y arma una página falsa
   («Escaneá para ver la lista de precios») que muestra en vivo el QR de su propia pantalla.
2. Una persona del local la lee con el celular de la ferretería, en cualquier red. El servidor
   compara «la dirección de la computadora» con «la del celular»: las dos son `::ffff:172.30.0.10`.
   Misma red.
3. El celular muestra «¿Entrar en Chrome en Windows?», que es lo que dice cualquier computadora. La
   persona pone la huella y el atacante entra con su cuenta, hoy de Administrador.

Con la parte 2, si el proxy de la máquina confía en lo que le llega, el atacante no necesita la
parte 1: manda `X-Forwarded-For: <la dirección del local>` al abrir su pantalla y al leer, y el
servidor le cree.

Además, con todas las direcciones iguales: los límites por dirección son uno solo para todo el
mundo (30 `/api/start` por minuto en total: cualquiera que los gaste deja a todos sin el botón de
Google; 3 pantallas con QR abiertas en total: ver el punto 25), y la auditoría y las sesiones
guardan la dirección de Caddy en lugar de «desde dónde».

**Qué propongo:**

- Que el servidor normalice la dirección de la conexión antes de compararla (sacar `::ffff:` de una
  IPv4 escrita como IPv6) **y** que escuche en `0.0.0.0` (`hostname: '0.0.0.0'` en `serve`). Una
  prueba con `remoteAddress: '::ffff:172.20.0.2'` que espera la dirección de `X-Forwarded-For`.
  Cuesta: dos líneas y una prueba.
- Que el Caddy de Ferrebress no confíe en todo lo privado sino solo en la dirección por la que le
  llega el proxy de la máquina, con `trusted_proxies_strict` (toma la primera dirección no confiable
  desde la derecha), y que le pase al servidor una sola dirección ya resuelta
  (`header_up X-Real-IP {client_ip}`) en lugar de la lista. Cuesta: tres líneas del `Caddyfile`.
- La prueba que pide el diseño (§ 14, «La dirección real») y que no existe: que `install.sh`, después
  de levantar, entre desde afuera con una dirección conocida (o mande un `X-Forwarded-For` inventado)
  y compruebe en la auditoría o en una respuesta de prueba que se anotó la real. Cuesta: unas líneas;
  hay que correrlo en la máquina.

Hasta que esto esté comprobado en la máquina, R2.5 no defiende nada y el QR no debería usarse fuera
del ambiente de pruebas.

### 25 · Una pantalla con QR sin canal no se libera nunca (`codes/screens.ts:34`, `codes/computer-routes.ts:30` y `:98`) — Mejora importante, comprobado

**Dónde:** `POST /api/sign-in/codes` guarda la pantalla en memoria. Solo se borra cuando se corta su
canal (`onAbort`) o cuando la computadora entra (`claim`). No tiene vencimiento.

**El ataque:**

1. Desde una dirección, tres `POST /api/sign-in/codes` sin abrir nunca el canal. Esa dirección ya no
   puede abrir otra pantalla, para siempre (hasta reiniciar el servidor): lo probé con el reloj
   adelantado un día y sigue en `too-many-attempts`.
2. Desde 34 direcciones (unas 100 pantallas), el tope total queda lleno: **ninguna computadora puede
   mostrar el QR**, hasta reiniciar. Cuesta 102 pedidos, una vez.
3. No hace falta un atacante para perder lugares: la aplicación abre una pantalla nueva en cada
   reconexión (`useComputerCode.ts:15`, `open` hace el `POST` y después el `fetch` del canal); si el
   `POST` llega y el canal no (la red del local que se corta en ese instante), esa pantalla queda
   ocupada. Con tres así, la computadora del local deja de tener QR sin que nadie entienda por qué.
   Con el punto 24, el tope por dirección es uno solo para todo el mundo y tres pérdidas apagan el
   QR de todos.

No entra a nada: se sigue entrando con Google.

**Qué propongo:** que una pantalla sin canal abierto venza sola (por ejemplo, a los 30 segundos de
abierta sin canal, o en cada barrido de códigos), y que abrir una pantalla nueva con la cookie de una
vieja la reemplace. Una prueba que abre tres pantallas sin canal, adelanta el reloj y abre otra.
Cuesta: un campo y unas líneas en `screens.ts`.

### 26 · Canales sin límite para una misma pantalla (`codes/computer-routes.ts:40`) — Mejora importante

**Dónde:** `GET /api/realtime/sign-in-codes` no tiene límite y no mira si esa pantalla ya tiene un
canal. Cada pedido arranca su propio bucle `serveScreen`, que pisa `screen.notify` y genera un
código por minuto. Lo leí; no lo hice correr.

**El ataque:** con una sola cookie de pantalla (un `POST`), un programa abre miles de canales desde
una dirección. Cada uno es una conexión que Caddy y Node mantienen abiertas sin tiempo máximo (el
diseño no les pone tope, a propósito), con su bucle y sus temporizadores, hasta agotar las
conexiones o la memoria de la VM, que comparte con PostgreSQL y con otras aplicaciones. Además, el
primero que se corte cierra la pantalla y los demás bucles siguen generando códigos de una pantalla
que ya no existe.

**Qué propongo:** un canal por pantalla (si ya tiene uno, se cierra el anterior o se rechaza el
nuevo), y el canal cuenta para el tope de pantallas por dirección. Una prueba que abre dos canales
con la misma cookie. Cuesta: unas líneas.

### 27 · El limitador de intentos (`platform/rate-limit.ts:39`, `sign-in/context.ts:40`) — Mejora importante, comprobado

**Dónde:** cada clave nueva se agrega al mapa; cuando hay más de 10.000, **cada clave nueva recorre
el mapa entero** para barrer las vencidas, aunque no haya ninguna vencida. Y `throttle` cuenta todas
las claves del pedido (`.map`, no se corta en la primera que frena), entre ellas
`google:device:<X-Device-Id>` y `passkey:device:<X-Device-Id>`, que elige quien manda el pedido.

**El ataque:**

1. Desde una sola dirección, un programa manda `POST /api/sign-in/passkey/options` (no pide cuerpo
   con forma: basta `{}`, el origen y el tipo, que no son secretos) con un `X-Device-Id` al azar en
   cada uno. El límite por dirección lo frena a los 20, pero la clave del dispositivo nuevo **igual se
   agrega** al mapa.
2. Pasadas las 10.000 claves vivas, cada pedido de cualquiera (también los del local) que trae una
   clave nueva recorre todo el mapa. Medí el limitador solo: con 112.000 claves vivas, 1.000 claves
   nuevas tardan un segundo de procesador (un milisegundo por pedido, con el único hilo de Node
   frenado), y llegar a esas 112.000 tardó casi un minuto de procesador. El costo crece con cada
   pedido del atacante: un solo programa deja al servidor sin responder mientras insiste.

**Qué propongo:** barrer por tiempo (una vez por ventana, o con el trabajo periódico que ya existe)
en lugar de en cada clave nueva; contar primero la dirección y no agregar la clave del dispositivo si
la dirección ya está frenada; y un tope de claves por dirección. Una prueba que mete 20.000 claves y
mide que la siguiente no recorra el mapa (o que cuente cuántas veces barre). Cuesta: unas líneas.

### 28 · Los topes totales se llenan con pocas direcciones (`sign-in/settings.ts:15` y `:16`, `:41`) — Mejora importante

**Dónde:** `nonce` de Google: 1.000 en total y 100 por dirección; desafíos de la huella: 1.000 y 10;
pantallas: 100 y 3. Al llegar al total se rechaza lo nuevo, como dice el diseño. La prueba «con la
memoria llena de nonces, /api/start frena hasta que vencen» muestra justamente el ataque.

**El ataque:** con **10 direcciones** (salidas de Tor, una VPN, unas máquinas baratas) que piden
`/api/start` cada dos segundos, los 1.000 `nonce` quedan siempre llenos: nadie que abra la entrada
después recibe un `nonce` y **nadie puede entrar con Google**, tampoco el local, mientras el ataque
dure. Con 100 direcciones pasa lo mismo con la huella; con 34, con el QR (punto 25). En el local, por
el punto 24, puede bastar con una.

**Qué propongo:** que el tope total sea mucho más alto que la suma que puede juntar un atacante con
pocas direcciones. Cada `nonce` ocupa unos 100 bytes: 100.000 son 10 MB. Por ejemplo `nonce` y
desafíos con 100.000 en total, y las pantallas con 1.000. Llenarlos exige miles de direcciones. Es un
número en `settings.ts` y la prueba que ya existe con el número nuevo.

### 29 · Aprobar un código no tiene límite (`codes/approve.ts:50`) — Mejora, comprobado

**Dónde:** `POST /api/sign-in/codes/approve` no llama a `throttle`. Mandé 40 seguidos desde un
dispositivo y ninguno fue `too-many-attempts`. R2.9 dice 20 intentos por minuto con la huella por
dispositivo, y aprobar es un intento con la huella.

**El ataque:** quien leyó un código (en la misma red) tiene el secreto de la reserva por 2 o 5
minutos y puede mandar firmas sin parar. No las puede falsificar, pero cada una consulta la base
(la credencial) y, con el identificador de una huella de otro, gasta en segundos el límite por cuenta
de esa persona (lo que el diseño acepta, pero con el ritmo de R2.9, no sin tope).

**Qué propongo:** el mismo `throttle` de la huella (`passkey:device` y `passkey:ip`) al empezar
`approve`. Una prueba. Cuesta: una línea.

### 30 · Un JSON roto es un 500 con su traza en el registro (`platform/http.ts:54`, cada `c.req.json()`) — Mejora, comprobado

**Dónde:** las rutas hacen `safeParse(await c.req.json())`; si el cuerpo no es JSON, `c.req.json()`
tira un error que va a `onError`, que responde 500 y escribe la traza con `console.error`. Lo probé:
`{` como cuerpo de `/api/sign-in/google` da 500 y una traza de 10 líneas.

**El ataque:** sin sesión y sin límite (el origen y el tipo se pueden poner a mano), un programa manda
miles de cuerpos rotos por minuto. Cada uno escribe una traza en el registro del contenedor; el
`compose.yml` no limita el tamaño de los registros (Docker guarda todo por omisión) y la VM es
compartida: se llena el disco. Además los 500 no quedan en la auditoría como pedido rechazado.

**Qué propongo:** leer el cuerpo en un solo lugar de `platform/http` (o atrapar el error de
`c.req.json()`) y responder `bad-request` con `request.rejected` por ventana, como los demás
rechazos; y en `compose.yml`, `logging: { options: { max-size: 10m, max-file: "3" } }` en los tres
servicios. Una prueba con un cuerpo roto. Cuesta: unas líneas.

### 31 · Lo que no se anota en la auditoría (E44) — Mejora

Lo que sí se anota: entradas, rechazos de Google y de la huella, el permiso rechazado, los límites (una
vez por ventana), los rechazos de origen, tipo, tamaño y versión, salir y las sesiones que terminan.
Lo que falta, aunque E44 dice «cualquier intento rechazado»:

- `approve` rechazado por reserva vencida, otra red o firma de otro desafío (`approve.ts`,
  `reservedScreen`), y `cancel` con un secreto que no existe.
- `read` de un código vencido o usado (sí se anota el de otra red).
- La salida pendiente con una firma que no verifica (`sessions/routes.ts:39`): es justo un intento de
  cerrar la sesión de otro.
- Vincular la huella rechazado por no ser celular o por haber pasado los 5 minutos
  (`cannotLink`).
- El diseño (§ 9) dice que la salida sin conexión guarda «la hora en que tocó y la hora en que
  llegó»; la aplicación no manda la hora en que se tocó y el servidor anota solo la de llegada.

Todo con la misma regla de una fila por ventana y por clave, para que insistir no llene la auditoría.
Cuesta: una llamada a `record` en cada rama.

### 32 · Lo que el diseño dice que está en `deploy/oracle/` y no está — Mejora

- **Si se pierde un celular:** el diseño (§ 6 y § 14) dice que `deploy/oracle/README.md` tiene las dos
  sentencias para cerrar sus sesiones y quitar su huella. No están. Hasta el módulo 02 es la única
  forma de cerrar a distancia (principio VIII): con un celular robado y la huella vinculada, quien lo
  tenga entra durante 8 horas por sesión, y vuelve a entrar con la huella mientras nadie la quite.
  Cuesta: un párrafo, con el reinicio del servidor (las sesiones en memoria siguen valiendo hasta que
  se reinicia).
- **La prueba de la dirección real** (punto 24).

### 33 · La política de contenido de la aplicación todavía nombra a Google (`deploy/Caddyfile:30`) — Mejora

Desde que el botón vive en su propia página, la aplicación no carga nada de Google: su política podría
ser solo `'self'` en `script-src`, `style-src`, `frame-src` y `connect-src`. Hoy deja cargar el script
de Google en la página que tiene la sesión. No encuentro cómo aprovecharlo sin un XSS previo, pero con
uno le da al atacante un script de un tercero que ya está permitido. La política del marco del botón
está bien. Cuesta: una línea y la e2e de cabeceras, que ya existe, mirando que la de la aplicación no
nombre a `accounts.google.com`.

### 34 · El service worker guarda como página cualquier navegación (`platform/offline/worker.ts:19`) — Mejora

Toda navegación del propio sitio que responde bien se guarda como la página de la aplicación (`/`),
también la de un archivo: alguien manda un enlace a `https://<sitio>/sw.js` o a un `/assets/…js`; la
persona lo abre; el service worker lo guarda como si fuera la página y borra lo guardado que esa
«página» no carga. La próxima vez que se abra **sin conexión**, sale el texto de un archivo en lugar de
la aplicación. No ejecuta nada ajeno (todo es del propio origen), pero rompe justo el caso en que no
hay cómo arreglarlo (00 · R3.6). Propongo guardar solo respuestas `text/html`. Cuesta: una condición y
una prueba.

### 35 · Detalles — Mejora

- **`ENVIRONMENT=e2e` apaga la comprobación de Google** (`platform/config.ts:44`). Si un `.env` de la
  máquina lo tuviera por error, el servidor aceptaría cualquier `GOOGLE_SCRIPT_URL` y cualquier emisor.
  Hoy no alcanza para entrar (las llaves siguen saliendo de `GOOGLE_JWKS_URL`), pero cuesta una línea
  que `e2e` exija `DATABASE_URL=memory://`.
- **La dirección no se valida.** Lo que viene en `X-Forwarded-For` se guarda tal cual en la
  auditoría y en la columna `inet` de la sesión; un valor que no es una dirección hace fallar la
  sesión con un 500. Con el punto 24 resuelto llega solo lo que pone Caddy, pero conviene validarla
  (`net.isIP`) y anotar «desconocida» si no lo es. Cuesta: una línea.
- **`data-private` no se usa en ninguna pieza.** La captura de «Algo salió mal» tapa lo marcado, pero
  hoy no hay nada marcado: lleva el nombre de la persona en la tarjeta, y el correo de una cuenta no
  autorizada si el error pasa en la entrada. Los últimos pasos guardan el `aria-label` de lo tocado,
  que en la tarjeta es el nombre de la persona. Son datos de quien usa el dispositivo y quedan en él;
  conviene marcar la tarjeta y el aviso de la entrada antes de que haya pantallas con datos de
  clientes. Cuesta: dos atributos.
- **La salida pendiente sin límite** (`/api/sign-out` con `pending`): sin sesión, cada pedido con un
  identificador inventado es una consulta a la base. Conviene el límite de los pedidos sin sesión por
  dirección.
- **`pnpm audit --prod --audit-level high`** en `pnpm check`: una falla «moderada» (como varias de Hono
  de este año) no frena la subida. Propongo `moderate`. Cuesta: una palabra.
- **El compose:** las imágenes base (`node:24-alpine`, `caddy:2.11-alpine`, `postgres:17-alpine`) van
  por etiqueta, no por su huella, y los servicios no tienen `cap_drop: [ALL]`,
  `security_opt: [no-new-privileges:true]` ni `read_only`. Con Docker sin privilegios el daño de un
  contenedor tomado ya es chico; son unas líneas.
- **Leer un código sin sesión lo reserva por 5 minutos.** Alguien en la misma red (un cliente en el
  Wi-Fi del local) que lee el QR de la pantalla deja la computadora en «Esperando la huella» 5 minutos,
  y lo puede repetir. Se sale ocultando y volviendo a mostrar la pestaña (abre otra pantalla). Lo dejo
  anotado; acortar ese plazo es una decisión de la regla.

### Lo que está bien y no repito

- **Entrar sin permiso:** el pase de 32 bytes en una cookie `__Host-` con `HttpOnly`, `Secure`,
  `SameSite=Strict` y `Max-Age`; solo su hash en la base (E40, con prueba). El pase de Google verificado
  con `RS256` fijo, emisor, público, vencimiento, correo verificado y `nonce` de un uso. La huella con
  `userVerification` obligatorio, ES256, origen y `rpId`. La llave de prueba P-256 no exportable, y el
  servidor que rechaza otra curva.
- **Permisos:** el canal y el permiso atados a la cookie de la pantalla; el permiso de un uso por 30
  segundos y de esa pantalla; una persona dada de baja no entra por ninguno de los tres caminos ni
  usa un permiso ya dado (`claim` mira `active`).
- **Lo que entra de afuera:** contratos con largos máximos, 64 KB en Caddy y en Hono (también en
  cuerpos sin `Content-Length`), `X-Device-Id` como UUID; consultas con parámetros de Kysely, sin SQL
  armado con texto (la sentencia de `writeLastUsed` usa `sql` con parámetros).
- **El navegador:** sin `dangerouslySetInnerHTML` (regla de Biome), el código del QR que se borra de la
  dirección, el lector que solo acepta direcciones de este origen, `frame-ancestors 'none'` en la
  aplicación y `'self'` solo en el marco del botón, el service worker que no toca `/api` ni el marco.
- **Secretos:** nada en el repositorio ni en su historia (lo busqué); el `.env` y `deploy.env` con
  permisos 600; la contraseña de la base generada en la máquina sin mostrarse; el canal de ntfy como
  secreto de GitHub; el emisor de prueba con llaves que nacen y mueren en cada corrida.
- **El despliegue:** solo `127.0.0.1:8090` publicado; PostgreSQL en la red interna; el servidor con
  el usuario `node`; los workflows con permisos mínimos, acciones fijadas por su commit, sin
  `pull_request_target`, y el despliegue solo después de un `push` a `main` con el control en verde;
  `deploy.sh` una vez por minuto y las imágenes por su huella.

### Cada riesgo y su prueba

| Riesgo | Prueba que lo intenta |
|---|---|
| Correo reasignado a otra persona | `users.test.ts`, «un correo reasignado…» |
| Pedido desde otro sitio, sin origen, sin cuerpo, con otro tipo, más de 64 KB | `http.test.ts`, «rechaza %s y lo anota» |
| Emisor de prueba fuera de `e2e` | `config.test.ts` |
| `nonce` usado o inventado | `google.test.ts` |
| Cancelar sin el secreto, firma de otro desafío, permiso de otra pantalla, otra red al aprobar | `codes.test.ts`, `edges.test.ts` |
| Huella sin verificación, contador que retrocede, desafío de vincular para entrar | `passkeys.test.ts` |
| Límite por cuenta que no frena Google | `passkeys/limits.test.ts` (E20c) |
| Topes por dirección | `limits.test.ts`, `edges.test.ts` |
| Una cookie inventada no queda en memoria | Parcial: la prueba mira que no sea nadie, no que no se guarde |
| La dirección real en la máquina | **Falta** (punto 24) |
| `::ffff:` en la dirección de Caddy | **Falta** (punto 24) |
| Pantalla sin canal, varios canales por pantalla | **Falta** (puntos 25 y 26) |
| Claves inventadas en el limitador | **Falta** (punto 27) |
| Límite en `approve` | **Falta** (punto 29) |
| Cuerpo que no es JSON | **Falta** (punto 30) |

### El estado de los puntos del paso 4

| # | Punto del paso 4 | Estado en el código |
|---|---|---|
| 1 | La dirección real con Docker sin privilegios | El diseño pasó al proxy de la máquina; **sigue abierto** con otra forma (punto 24) |
| 2 | La ciudad desconocida | Ya no aplica: la regla pasó a «la misma red», sin ciudades |
| 3 | Correo reasignado | Cerrado, con prueba |
| 4 | El nombre de la computadora | Cerrado: lo arma el servidor de una lista cerrada |
| 5 | La llave de prueba | Cerrado: ECDSA P-256 no exportable en IndexedDB |
| 6 | Topes de memoria y `/api/start` | En parte: hay límites, pero los totales se llenan con pocas direcciones y las pantallas no vencen (puntos 25, 27, 28) |
| 7 | Tamaño máximo | Cerrado |
| 8 | Pedidos desde otros sitios | Cerrado, con prueba |
| 9 | El emisor de prueba | Cerrado; un detalle en el punto 35 |
| 10 | La reserva y «No soy yo» | Cerrado |
| 11 | El desafío de `approve` | Cerrado |
| 12 | El límite por cuenta | Cerrado: Google y la huella aparte |
| 13 | Dar de baja | Cerrado: en la misma transacción y fuera de la memoria |
| 14 | Cerrar a distancia antes del módulo 02 | **Abierto:** las instrucciones no están (punto 32) |
| 15 | Lo que queda al salir | Cerrado: se borran el nombre, el rol, la llave y el aviso; `data-private` sin usar (punto 35) |
| 16 | El service worker y `/api` | Cerrado; un detalle nuevo en el punto 34 |
| 17 | Cabeceras | Cerrado; la política de la aplicación se puede ajustar (punto 33) |
| 18 | XSS | Cerrado |
| 19 | Auditoría | En parte (punto 31) |
| 20 | El canal de ntfy | Cerrado: es un secreto |
| 21 | Los workflows | Cerrado |
| 22 | `DATABASE_URL` | Cerrado |
| 23 | Dependencias | Cerrado: versiones exactas, Hono 4.13.14, `pnpm audit --prod` sin fallas; el nivel, en el punto 35 |

### Dependencias

`pnpm audit --prod` no encuentra fallas conocidas. Las versiones están fijadas: Hono 4.13.14,
`@hono/node-server` 2.1.5, jose 6.2.13, `@simplewebauthn/server` 14.0.3, Kysely 0.29.7, pg 8.23.1,
zod 4.6.7, Preact 11.0.2, `qrcode-generator` 2.0.4, `@zxing/library` 0.23.0 y `html-to-image` 1.11.13.

- **Hono** tuvo muchas fallas publicadas este año, varias en piezas que este código no usa (CORS,
  `basicAuth`, JWT, `serveStatic`, JSX en el servidor, `ipRestriction`). Las que tocan lo que sí usa
  son la de `bodyLimit` con cuerpos partidos (CVE-2026-44456) y la de nombres de cookie en
  `setCookie` (CVE-2026-56762); leí el `bodyLimit` instalado y cuenta también los cuerpos partidos, y
  los nombres de cookie acá son fijos. No pude comprobar en una fuente oficial la versión exacta que
  corrige cada una; `pnpm audit` no marca ninguna para 4.13.14.
- **Kysely:** las fallas de inyección de este año (CVE-2026-32763 y las de MySQL) son de rutas JSON en
  MySQL y SQLite y de `sql.lit`; este código usa PostgreSQL y no usa ninguna de las dos.
- **ZXing y `html-to-image`:** no encontré fallas publicadas ni pude confirmar cuán mantenidos están.
  Se bajan recién cuando se usan, desde el propio origen; el riesgo es chico.

### Lo que no pude comprobar

- Si Node, dentro del contenedor, ve `::ffff:172.30.0.10` (punto 24): Docker no estaba prendido en esta
  máquina. Se comprueba en la máquina con `docker compose logs server` después de un pedido, o con la
  prueba que propongo.
- Si el proxy de la máquina pisa el `X-Forwarded-For` que manda el navegador (punto 24): su
  configuración global no está en el repositorio.
- Cuántas conexiones abiertas aguanta la VM antes de caerse (punto 26).
- Las pruebas de punta a punta: no las corrí, como se pidió.

Fuentes: [Nextcloud, «Requesting address is denied: ::ffff:172.17.0.1»](https://help.nextcloud.com/t/requesting-address-is-denied-172-17-0-1-wsd-loolwsd-cpp-1971/44179/18),
[Apify, IPv4 escrita como IPv6 en Node](https://blog.apify.com/ipv4-mapped-ipv6-in-nodejs/),
[CVE-2026-39409 en Docker Scout](https://scout.docker.com/vulnerabilities/id/CVE-2026-39409/my-images),
[fallas de Hono en cve-dev.imfht.com](https://cve-dev.imfht.com/product/hono?lang=en),
[CVE-2026-47674 de Hono en GitLab](https://advisories.gitlab.com/npm/hono/CVE-2026-47674/),
[CVE-2026-32763 de Kysely en NCSC](https://vulnerabilities.ncsc.nl/csaf/v2/2026/cve-2026-32763.json),
[fallas de kysely-org en cve.imfht.com](https://cve.imfht.com/vendor/kysely-org).
