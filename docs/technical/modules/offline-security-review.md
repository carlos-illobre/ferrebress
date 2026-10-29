# Revisión de seguridad · 15 · Sin conexión (`offline`), etapa a

## Paso 4: el diseño

Revisión independiente del [diseño](offline.md) desde el punto de vista de un atacante
(constitución, paso 4). Todavía no hay código: la carpeta `src/server/modules/sign-in/offline/` no
existe aún. Leí la constitución, el capítulo [15](../../chapters/15-offline/rules.md), la
[arquitectura](../architecture.md), el [ADR-007](../adr/ADR-007-offline-and-server-time.md), el
diseño del que depende [01 · Entrar](sign-in.md) (§ 4, § 5, § 6, § 8, § 13) y su
[revisión de seguridad](sign-in-security-review.md). Revisé también el código ya programado de 01
(`src/server/modules/sign-in/`, `src/app/modules/sign-in/`) porque el flujo sin conexión se apoya
en él.

El negocio decidido por Carlos no se discute, solo se señalan los riesgos que trae y no están
cubiertos: «el sistema no frena, revisa»; sin conexión se puede entrar y el control es reactivo;
se acepta que la verificación del celular se pueda saltar tocando su código; se acepta el riesgo
del **celular robado dentro de las 24 horas** desde su último contacto. Esta revisión no propone
prohibir nada: busca que lo que el servidor confirma al volver la conexión sea de verdad confiable.

- **Frena:** se puede entrar, ver o cambiar lo ajeno, filtrar datos personales, o se rompe un
  límite que Carlos puso como condición (las 24 horas). Se resuelve antes de aprobar el diseño.
- **Mejora:** conviene hacerla; no frena.

## Resumen

La parte fuerte del diseño está bien atada: la firma de la huella queda ligada a su `id` (UUID v7,
clave de la tabla) que se usa una sola vez, así que **no se puede fabricar ni robar la identidad de
otro** (el servidor busca la credencial por su `credential_id` y comprueba que sea de ese `userId`
y de ese `device_id`: una firma de la huella del atacante no pasa por víctima, E19/E20); el desafío
armado por el cliente queda cubierto por ese mismo `id`; las horas que manda el celular se
contrastan contra lo que sabe el servidor; la sesión se crea con la hora del servidor; `Origin` se
valida como en todo `POST`.

El problema serio es **otro**: la única garantía que Carlos pidió conservar —las 24 horas— se la
puede estirar un atacante **sin la huella y sin autenticarse**, porque el «último contacto» que el
servidor usa como ancla del plazo lo adelanta cualquier `GET /api/start` que lleve el
`X-Device-Id` del celular. Con eso, un celular robado deja de tener un plazo de 24 horas y pasa a
tener un plazo indefinido.

| # | Punto | Gravedad |
|---|---|---|
| 1 | El «último contacto» lo refresca cualquier `/api/start` con el `X-Device-Id`: el plazo de 24 horas del celular robado se vuelve indefinido | **Frena** |
| 2 | `/api/start` filtra `userId`, `credentialId` y el estado de la cuenta a quien mande un `X-Device-Id` ajeno; la afirmación del diseño sobre esto es falsa | Mejora importante |
| 3 | `POST /api/sign-in/offline` es un camino de entrar sin desafío del servidor y sin el límite por cuenta de la huella | Mejora importante |
| 4 | Filas persistentes en `offline_sign_ins` escritas por pedidos sin sesión: inflar la tabla | Mejora |
| 5 | La prueba de la huella queda en `localStorage` hasta confirmarse | Mejora |
| 6 | El refresco del «último contacto» y la consulta de `/api/start` no quedan en la auditoría | Mejora |
| 7 | Cuál credencial manda (`response.id` vs. `credentialId` del cuerpo) y el contador fuera de orden | Mejora |

---

## 1. Entrar sin permiso

### 1 · El «último contacto» se refresca sin autenticarse y estira las 24 horas (§ 4, `POST /api/sign-in/offline` paso 8, y «El último contacto de cada celular») — Frena

**Dónde.** § 4, paso 8: «`signedAt` tiene que caer dentro de las 24 horas siguientes al último
contacto real de ese celular, que el servidor sabe: el último uso de sus sesiones **o la última
vez que pidió `/api/start` con esa huella**, lo que sea más nuevo». Y «El último contacto de cada
celular»: «`/api/start` con una huella vinculada anota en memoria "este celular habló ahora"».
En el código de 01, `GET /api/start` (`google/routes.ts:22`) no exige sesión y se resuelve a
partir del `X-Device-Id`, que `platform/http` solo valida como UUID (`http.ts`), no como secreto.

**Por qué importa.** Las 24 horas son la única cota que Carlos conservó: aceptó el celular robado
«dentro de las 24 horas», no más. El servidor la hace valer en el paso 8 comparando `signedAt`
contra el último contacto que él mismo conoce (bien: no confía en el `lastContactAt` del cuerpo).
Pero ese ancla se puede mover: cualquiera que conozca el `device_id` del celular puede adelantarlo
a «ahora» con un simple `GET /api/start`, sin sesión, sin huella y sin tocar el celular.

**El ataque, paso a paso:**

1. Un atacante roba el celular (o lo toma prestado un rato) y aprende su `device_id`. No hace falta
   robarlo: el `device_id` viaja en claro en la cabecera `X-Device-Id` de **todos** los pedidos, y
   además queda en `localStorage`; basta verlo una vez (una computadora compartida, una extensión
   del navegador, un `curl` del propio dueño mirado por encima del hombro, un registro intermedio).
   El atacante puede además unlockear el celular con el PIN o patrón, que Android acepta en lugar
   de la huella (riesgo ya aceptado).
2. Pasan más de 24 horas desde el último uso legítimo (el dueño denunció el robo pero la cuenta
   todavía no se dio de baja, o es fin de semana). El celular, offline, ya **no** debería dejar
   entrar: la pantalla se apaga a las 24 horas (R2.2), y si el atacante saltea esa verificación del
   cliente (riesgo aceptado), el servidor debería frenarlo en el paso 8 con `too-late`.
3. El atacante, desde cualquier conexión a internet, manda `GET /api/start` con
   `X-Device-Id: <device_id del celular>`. El servidor anota «este celular habló ahora»: el último
   contacto salta a este instante.
4. El atacante arma una entrada sin conexión con `signedAt = ahora` (con el celular, saltando la
   verificación del cliente, o reproduciendo una firma que el celular haga con el PIN), y manda
   `POST /api/sign-in/offline`.
5. El paso 8 compara `signedAt` (ahora) contra el último contacto (ahora, recién refrescado): cae
   dentro de las 24 horas. Con la cuenta todavía activa, el servidor **confirma** y abre la sesión.

El atacante repite el paso 3 cada tanto y mantiene vivo el acceso **de forma indefinida**, mucho
más allá de las 24 horas que Carlos aceptó. La cota desaparece.

**Por qué es frena.** Rompe la condición explícita que Carlos puso para aceptar la funcionalidad.
Lo que el servidor confirma deja de ser confiable justo en el caso que la regla quería acotar (el
celular robado). No es un ataque hipotético: el único insumo que necesita, el `device_id`, no está
protegido como secreto en ningún lado del diseño.

**Qué propongo.** Que el «último contacto» que ancla el plazo de 24 horas (paso 8) sea solo el
**contacto autenticado**: el último uso de una sesión válida de ese celular, o la última
confirmación sin conexión. Un `GET /api/start` sin sesión —que cualquiera puede emitir con solo el
`device_id`— **no** debe adelantar ese ancla. Si se quiere seguir refrescando con `/api/start`,
que solo cuente cuando trae una cookie de sesión válida de ese mismo dispositivo. Cuesta: separar
en el diseño «último contacto para el plazo» (solo autenticado) de «este celular existe» (sirve
para otras cosas); una línea en el paso 8 y en «El último contacto». Hay que avisarle a Carlos,
porque cambia cuándo un celular que estuvo mucho sin conexión todavía puede entrar.

## 2. Permisos y lo que se filtra

### 2 · `/api/start` filtra `userId`, `credentialId` y el estado de la cuenta por `X-Device-Id` (§ 4, `GET /api/start`) — Mejora importante

**Dónde.** § 4: la respuesta suma
`"offline": { "allowed": true, "userId": "…", "credentialId": "…", "publicKey": {…} }` cuando el
`X-Device-Id` tiene una huella vinculada. Y la afirmación: «Quien mande el identificador de otro
celular solo sabe si su huella sigue sirviendo; el identificador es un UUID al azar que no sale del
celular».

**El problema.** Las dos frases de esa afirmación son falsas:

1. No se entera «solo de si su huella sigue sirviendo»: recibe el `userId`, el `credentialId`, la
   llave pública de la huella y, en `allowed`, si la cuenta está **activa y con el permiso** y si
   su última sesión no la cerró otro dispositivo. Es un oráculo de estado de la cuenta de ese
   celular, consultable por cualquiera que mande su `device_id`.
2. El `device_id` sí «sale del celular»: viaja en la cabecera `X-Device-Id` en claro en cada
   pedido (lo exige `platform/http`), y queda en `localStorage`. No es un secreto. No es
   *adivinable* (es un UUID al azar), pero sí *observable*.

**El ataque.** Quien haya visto un `device_id` (en una computadora compartida, una extensión, un
proxy, el historial) puede, desde cualquier lado, sondear `/api/start` y saber en qué momento esa
cuenta se dio de baja o perdió el permiso, correlacionar «este aparato ↔ este `userId`», y llevarse
la llave pública y el `credentialId` para montar la verificación local en una página o un celular
modificado. No filtra nombre ni correo (bien: el bloque no los trae), por eso es mejora importante
y no frena; pero sí es más de lo que el diseño dice, y alimenta el punto 1.

**Qué propongo.** Que el bloque `offline` no incluya `userId`: la aplicación conoce su propia
identidad por la sesión o por la respuesta de entrada; para la pantalla sin conexión le alcanza con
`allowed`, `credentialId` y `publicKey`. Y corregir la afirmación del diseño para que diga lo que
de verdad se expone y que el `device_id` es observable, no secreto. Cuesta: quitar un campo de la
respuesta y reescribir dos frases.

### 3 · `POST /api/sign-in/offline`: entrar sin desafío del servidor y sin el límite por cuenta (§ 4, pasos 2 y 5) — Mejora importante

**Dónde.** § 4: la ruta abre sesión «como `POST /api/sign-in/passkey`», pero el desafío lo arma el
cliente (paso 4) en vez de salir de `/api/sign-in/passkey/options` como en la entrada con conexión.
El único límite que nombra es el paso 2: «la huella: 20 por minuto, por dirección y por
dispositivo».

**El problema.** Es un segundo camino de entrada, siempre disponible (también con conexión: el
servidor no puede saber que el cliente está offline), cuya frescura **no** la garantiza un `nonce`
de un uso emitido por el servidor, como sí ocurre en la entrada con huella con conexión
(`passkeys/sign-in-routes.ts`, `ctx.challenges.take(challenge)`). Acá la frescura la dan el `id`
único (contra la repetición exacta) y las horas del paso 8 (contra lo viejo). El punto 1 muestra
que la parte de las horas es manipulable; con el punto 1 arreglado queda razonable, pero conviene
dejar constancia de que este endpoint es equivalente en fuerza a la entrada con huella **salvo** el
nonce del servidor.

Además, la entrada con huella con conexión cuenta los fallos de firma por cuenta
(`failed:passkey:<userId>`, `webauthn.ts` `checkAssertion`) para frenar la fuerza bruta de esa
huella (R2.10). El paso 2 de este diseño **no** lo replica: solo limita por dirección y
dispositivo. No es grave (sin la llave privada no se puede forjar una firma válida, así que no hay
fuerza bruta real), pero es una asimetría con 01 que conviene cerrar para que el límite por cuenta
valga por los dos caminos.

**Qué propongo.** (a) Que el diseño diga explícitamente que este endpoint acepta firmas que el
servidor nunca desafió, y que la defensa contra la repetición es el `id` único más las horas (con
el ancla del punto 1 corregida). (b) Sumar al paso 2 el límite por cuenta de la huella, igual que
en `checkAssertion`, para que un identificador de huella conocido no permita insistir sin tope por
este lado. Cuesta: una clave de límite más y una frase.

## 3. Lo que entra de afuera

### 4 · Inflar `offline_sign_ins` con filas rechazadas (§ 3, § 4 pasos 2–8) — Mejora

**Dónde.** § 3: la tabla `sign_in.offline_sign_ins`, una fila por entrada que llega, confirmada o
no, borrada a los 30 días. § 4: «Si algo falla en 4 a 8, guarda la fila como `rejected`».

**El problema.** A diferencia de los desafíos y los `nonce` de 01, que viven en memoria con topes,
esta tabla es persistente en PostgreSQL y la escriben pedidos **sin sesión**. Un atacante que
conozca un `userId` + `credentialId` + `device_id` válidos (los filtra el punto 2) puede mandar
hasta 20 confirmaciones por minuto por dirección y por dispositivo, cada una con un `id` nuevo, que
fallan en el paso 5 (firma inválida) y dejan una fila `rejected`. Son unas 28.800 filas por día por
dirección; con varias direcciones, más. No tira la base, pero es crecimiento persistente provocado
por pedidos anónimos, contra el principio V (la base guarda lo más chico posible).

**Qué propongo.** Guardar la fila solo cuando el rechazo demuestra algo de la cuenta (como el
límite por cuenta de 01: una firma que no verifica para una credencial que existe), y no por
fallos tempranos (contrato, desafío, credencial inexistente), que pueden quedar solo en la
auditoría agregada (una fila por ventana, como `sign-in.throttled`). Cuesta: decidir en el diseño
qué rechazos escriben fila y cuáles solo cuentan para el límite y la auditoría.

## 4. La aplicación en el navegador

### 5 · La prueba de la huella queda en `localStorage` (§ 5 «Entrar sin conexión» paso 4, § 7) — Mejora

**Dónde.** § 7: la entrada pendiente de confirmar se guarda en `platform/device/storage`, que es
`localStorage` (01, § 2 y `app/platform/device/storage.ts`). Incluye `response` (la respuesta de
`navigator.credentials.get()`: `authenticatorData`, `clientDataJSON`, `signature`).

**El problema.** La firma de la huella queda en `localStorage`, legible por cualquier XSS o
extensión, hasta que se confirma o rechaza (puede ser horas, si no vuelve la conexión). Está atada
a su `id` de un uso, así que no sirve para entrar como otro ni se puede reproducir una vez
confirmada; el riesgo real es bajo (quien tiene XSS en la página ya está dentro de la sesión). Lo
señalo porque conviene dejarlo escrito en § 7 como dato personal/credencial que vive en el aparato,
y porque la llave de prueba sí va a IndexedDB no exportable mientras que la prueba de la huella
queda en claro. No es necesario que la prueba sobreviva a un cierre de pestaña más de lo justo.

**Qué propongo.** Dejar constancia en § 7 de que el `response` es lo más sensible de lo guardado y
que se borra apenas se confirma o rechaza (ya lo dice el flujo); evaluar guardarlo en IndexedDB en
vez de `localStorage` para que no lo lea un `localStorage.getItem` trivial. Cuesta: una nota y, si
se quiere, cambiar de almacén.

## 5. Sin conexión

Es lo que resuelve el módulo. Lo central ya está tratado en el punto 1 (las horas y el plazo) y en
el punto 3 (la frescura). El resto del modelo sin conexión es sólido: la hora del servidor manda
(se crea la sesión con ella), el reloj atrasado no da más tiempo (R2.3), y la identidad no se puede
falsear porque la credencial se resuelve server-side contra `(userId, device_id)`.

## 6. Abuso y disponibilidad

Tratado en el punto 4 (la tabla persistente). El resto de los topes se hereda de 01 (§ 8) y es
razonable; el `POST /api/sign-in/offline` se manda una sola vez por entrada (meta de performance,
§ 11), así que no genera tráfico automático nuevo salvo la confirmación.

## 7. Auditoría

### 6 · El refresco del «último contacto» y el sondeo de `/api/start` no dejan traza (§ 4, § 10) — Mejora

**Dónde.** § 10: solo se auditan `sign-in.offline-confirmed` y `sign-in.offline-rejected`.
`GET /api/start` no se audita (no es un intento de entrada).

**El problema.** El ataque del punto 1 (refrescar el «último contacto» con `/api/start` para
estirar el plazo) y el del punto 2 (sondear el estado de una cuenta por su `device_id`) son
**invisibles** en la auditoría: no hay evento, y la confirmación que sale de ahí se ve como una
entrada sin conexión normal. Si el punto 1 se arregla quitando `/api/start` del ancla del plazo,
este punto pierde casi toda su importancia; mientras tanto conviene que, al menos, la confirmación
anote el último contacto que usó para decidir el plazo, para poder reconstruir después si fue
legítimo.

**Qué propongo.** Que `sign-in.offline-confirmed` / `-rejected` guarden también el «último
contacto» con el que el servidor evaluó el paso 8 (y su origen: sesión o `/api/start`). Cuesta: un
campo más en el `payload` del evento.

### 7 · Cuál credencial manda y el contador fuera de orden (§ 4, pasos 5 y 7) — Mejora

**Dónde.** § 4, paso 5: «La huella: existe, no está quitada, es de `userId` y de ese `device_id`…
Verifica con `@simplewebauthn/server` la firma… con el contador como al entrar con conexión».

**El problema.** Dos detalles para que el código (paso 6) no se equivoque:

1. El cuerpo trae `credentialId` **y** `response` (que incluye su propio `response.id`). La
   verdad es `response.id`: la credencial que se busca y cuya llave verifica la firma tiene que ser
   la de `response.id`, no la del campo `credentialId` del cuerpo (como hace 01 en
   `findActive(response.id)`). Si se buscara por el campo del cuerpo y se verificara contra otra
   llave, habría una inconsistencia. Conviene que el diseño lo diga.
2. El contador: las entradas sin conexión pueden llegar **fuera de orden** respecto de usos
   posteriores con conexión. Con un autenticador que usa contador (>0), una entrada sin conexión
   legítima con contador 5 que llega después de un uso con conexión que dejó el contador en 6 se
   rechazaría como clon. Con las huellas de Google el contador es 0 y no se mira, así que en la
   práctica no pasa; conviene dejarlo anotado para que, si algún día se usan autenticadores con
   contador, no se rechacen entradas sin conexión buenas.

**Qué propongo.** Que el diseño fije que la credencial autoritativa es `response.id` y describa el
comportamiento del contador para entradas sin conexión que llegan tarde. Cuesta: dos frases.

## 8. Dependencias

No hay dependencias nuevas: el módulo reusa `@simplewebauthn/server` (14.0.3) de 01 y usa WebCrypto
del navegador. Corrí `pnpm audit --prod`: «No known vulnerabilities found». La única advertencia
reciente de `@simplewebauthn/server`, **GHSA-6hxq-p678-4hr2** (que la verificación de registro no
exige que el certificado de atestación encadene a un ancla de confianza), se corrigió en la
versión 13.3.2; la 14.0.3 ya la incluye, y además el diseño usa `attestationType: 'none'`, así que
no aplica. Las otras coincidencias de la búsqueda son de otros paquetes (CVE-2026-28787 es de
OneUptime; CVE-2026-46419 es del `webauthn-server-core` de Yubico en Java), no de este. Nada que
frene.

Vale rescatar la lección de CVE-2026-28787 para el paso 7: era una app que pasaba un desafío
elegido por el cliente a `verifyAuthenticationResponse()` y así se saltaba el segundo factor. Este
diseño pasa un desafío armado por el cliente (paso 4), pero lo recalcula y lo compara, y la
protección contra la repetición es el `id` único: hay que comprobar en el código que esa
comparación y la unicidad del `id` estén de verdad antes de verificar la firma.

## Lo que no pude comprobar

- Que las filas de `offline_sign_ins` se borren por una columna consistente con el rechazo
  `too-old` de 30 días (§ 3), de modo que nunca quede una ventana en que la fila ya se borró pero
  `signedAt` todavía parezca de menos de 30 días. El diseño dice que así es; no hay código para
  verificarlo.
- El comportamiento exacto de `@simplewebauthn/server` con el contador para entradas que llegan
  fuera de orden: lo razoné sobre el diseño, no lo probé.

## Una prueba por riesgo (para el paso 6)

Cada punto de arriba debería tener una prueba que intente el ataque y falle, en línea con la
constitución (VII) y con cómo lo hizo 01:

- Punto 1: un `/api/start` sin sesión con el `device_id` **no** adelanta el ancla del plazo; una
  confirmación con `signedAt` posterior a las 24 horas del último contacto autenticado se rechaza
  con `too-late` aunque justo antes se haya pedido `/api/start`.
- Punto 2 (si se aplica): `/api/start` con un `device_id` ajeno no devuelve `userId`.
- Punto 3: una confirmación con un desafío que no corresponde a sus campos se rechaza; los fallos
  de firma por cuenta cuentan para el límite.
- Punto 4: un fallo temprano (credencial inexistente) no escribe fila persistente.
- Punto 7: la credencial que verifica es la de `response.id`.

## Paso 7: el código

Revisión del código de la etapa a (commits `ec22ccc`, `fc74178` y `5fde526`) contra el
[diseño](offline.md) ya corregido y las [reglas](../../chapters/15-offline/rules.md). Leí
`src/server/modules/sign-in/offline/` entero, los cambios en `google/routes.ts`,
`passkeys/sign-in-routes.ts`, `passkeys/link-routes.ts`, `passkeys/webauthn.ts`, `context.ts`,
`index.ts` y `migrations/002-offline.ts`, el contrato `src/shared/contracts/offline-sign-in.ts`,
`src/app/modules/sign-in/offline/`, `session.ts`, `App.tsx`, `platform/server/api.ts`,
`platform/device/proof-key.ts` y `tests/e2e/offline.spec.ts`. Corrí `pnpm test` (380 pruebas en verde) y
`pnpm audit --prod` (sin fallas conocidas). Lo que digo que comprobé lo probé con pruebas propias
contra el servidor de pruebas (`createOfflineKit`), en un archivo temporal que borré: el repositorio
quedó como estaba. No corrí las de punta a punta.

El contexto que no se discute: «el sistema no frena, revisa»; Carlos acepta el celular robado dentro
de las 24 horas y que la pantalla del celular se fíe del lector. Por eso nada de lo que sigue pide
verificar más en el celular: todo es sobre lo que **el servidor** confirma.

### Resumen

Los siete puntos del paso 4 quedaron resueltos en el código, casi todos con su prueba: el plazo ya no
lo mueve un `/api/start` sin sesión, sin sesión el servidor no dice nada de la huella de un celular,
el límite por cuenta vale también por acá, la firma que no verifica no deja fila, la credencial es la
de `response.id` y la auditoría guarda el último contacto con que se midió. El desafío se recalcula
siempre en el servidor (`routes.ts:62`) y nunca se usa el que viene en `clientDataJSON`; la biblioteca
compara los dos. La lección de CVE-2026-28787 está aprendida.

Frenan dos cosas, las dos comprobadas, y las dos rompen lo que el diseño promete de la firma:

- **La firma no cubre ni la llave de prueba ni `openSession`.** Quien copie una entrada pendiente
  del celular (está en `localStorage`) la manda desde su máquina con su propia llave y se queda con
  la sesión de la víctima; el celular recibe «ya confirmada». También convierte en sesión una entrada
  que la persona ya había cerrado con «Salir».
- **Pasados 30 días, la misma entrada se vuelve a confirmar.** La fila se borra a los 30 días y el
  rechazo `too-old` no mide la edad de la firma: compara dos horas que vienen dentro de la misma
  entrada. Con el celular en uso, una copia vieja vuelve a abrir sesión. E18 deja de valer.

| # | Punto | Gravedad |
|---|---|---|
| 8 | La firma no ata la llave de prueba ni `openSession`: una entrada copiada abre la sesión en otra máquina | **Frena** (comprobado) |
| 9 | A los 30 días la misma entrada se confirma otra vez: `too-old` no mide la edad | **Frena** (comprobado) |
| 10 | El plazo y la sesión cerrada desde otro dispositivo se miden con la sesión de **cualquier** cuenta que diga ser ese celular | Mejora importante (comprobado) |
| 11 | `sign-in.offline-repeated` se anota a nombre de cualquiera y sin tope | Mejora importante (comprobado) |
| 12 | Dos confirmaciones a la vez: dos `sign-in.succeeded` y la cookie de una sesión cerrada; la aplicación puede mandar dos | Mejora (comprobado en el servidor) |
| 13 | `phoneOwners` crece con identificadores inventados y puede quedar vieja | Mejora (comprobado el crecimiento) |
| 14 | El celular toma como contacto el `/api/start` que dice que ya no hay sesión | Mejora (leído) |
| 15 | Lo guardado en `localStorage`: lo que el diseño dice y no es, y una sola llave de prueba para todas las entradas | Mejora |
| 16 | Detalles: el límite por dispositivo, la prueba de la auditoría, el dispositivo de la sesión | Mejora |

### 8 · La firma no ata la llave de prueba ni `openSession` (`src/shared/contracts/offline-sign-in.ts:42`, `src/app/modules/sign-in/offline/enter.ts:45` a `:48`, `offline/routes.ts:115`) — Frena, comprobado

**Dónde:** el desafío que firma la huella es el SHA-256 de `{ id, userId, deviceId, signedAt,
lastContactAt }`. El cuerpo lleva además `proofPublicKey` y `openSession`, que **no** están en el
desafío. En el celular, la llave de prueba se crea **después** de la huella (`enter.ts:48`), así que
hoy ni siquiera se podría incluir. El servidor abre la sesión con la llave que venga en el cuerpo
(`routes.ts:117`) y le pone la cookie a quien mandó el pedido.

**El ataque, paso a paso (lo corrí así):**

1. La víctima entra sin conexión con su huella. La entrada queda en `localStorage`
   (`offline-pending`): `id`, `userId`, las horas y la respuesta de la huella con su firma. Queda ahí
   hasta que vuelva la red, que pueden ser horas. El `device_id` del celular está en el mismo
   `localStorage` y viaja en cada pedido.
2. El atacante lee esas dos cosas. Alcanza con un código malicioso en la página (un XSS), un
   programa en el celular que lea los datos del navegador, o el celular en la mano un minuto con la
   depuración USB prendida. No necesita la huella ni el celular después.
3. Desde su computadora, en su casa, manda `POST /api/sign-in/offline` con la entrada tal cual,
   `X-Device-Id` del celular, **su propia** `proofPublicKey` y `openSession: true`.
4. La firma verifica (lo firmado no cambió), la huella es de esa persona y de ese celular, está
   dentro del plazo: el servidor responde 200, con la persona y la cookie `__Host-session` para el
   atacante. Su `/api/start` siguiente devuelve a la víctima. Cuando el celular de la víctima vuelve
   a tener red y manda la misma entrada, recibe `offline-already-confirmed` y le aparece «Entrá de
   nuevo para seguir donde estabas.»: no hay nada que le haga sospechar.

La misma falla, con otra cara: una entrada que la persona cerró con «Salir» sin conexión queda
guardada para mandarse con `openSession: false` (E21). Quien la copie la manda con `true` y abre una
sesión que la persona ya había terminado.

**Por qué frena:** se entra como otra persona desde otro dispositivo. Es justo lo que la llave de
prueba no exportable (ADR-015) debía impedir: «un código malicioso en la página podría usarla
mientras está abierta, pero no copiarla». Acá no hace falta la llave: la entrada copiada vale más que
la cookie, que es `HttpOnly`. Y el diseño dice dos cosas que no son ciertas: «ningún dato se puede
cambiar después de firmar» (§ 4, paso 4) y «la firma guardada no sirve para otra cosa» (§ 5).
Además, en la etapa b, lo que se hizo en una entrada se va a verificar con su `proof_public_key`;
si esa llave la elige quien manda primero, cualquiera que copie la entrada le atribuye a la persona
lo que quiera.

**Qué propongo:**

- Crear la llave de prueba **antes** de pedir la huella y meter su parte pública (o su SHA-256) en el
  desafío (`OfflineChallengeFields`). Así la firma solo verifica con esa llave, cuya privada no sale
  de IndexedDB.
- Para abrir sesión, que el cuerpo traiga además una firma con esa llave sobre `id` y `openSession`
  (como la salida pendiente, `verifyProof`). Quien copió la entrada no tiene la privada y no puede
  pedir `openSession: true`; tampoco puede cambiar un `false` por un `true`.
- Pruebas: la entrada con otra `proofPublicKey`, y una con `openSession` cambiado o sin la firma de la
  llave, no se confirman y no ponen cookie.

Cuesta: cambiar el orden en `enter.ts`, un campo más en el desafío y uno en el contrato, una
verificación en la ruta y tres pruebas; medio día. Hay que corregir las dos frases del diseño.

### 9 · A los 30 días la misma entrada se confirma otra vez (`offline/rules.ts:50`, `offline/data.ts:73`, `index.ts`) — Frena, comprobado

**Dónde:** las filas se borran por `received_at` a los 30 días (`removeOlderThan`). El diseño dice
que por eso se rechaza una firma de más de 30 días (`too-old`), «así nunca se acepta una firma cuya
fila ya se borró». Pero `too-old` compara `signedAt` con `lastContactAt`, **las dos de la misma
entrada**: no dice nada de cuánto tiempo pasó desde que se firmó. Y el plazo de 24 horas se mide
contra la última sesión del celular, que es reciente si el celular se sigue usando.

**El ataque (lo corrí así):** el atacante guarda una copia de una entrada de la víctima (punto 8,
paso 2), aunque ya se haya confirmado. Espera 31 días: la limpieza diaria borra la fila. La víctima
sigue usando su celular todos los días. El atacante manda la copia con el `X-Device-Id` del celular:
no hay fila con ese `id`, la firma verifica, la última sesión del celular es de hoy (dentro del
plazo) y `signedAt − lastContactAt` es una hora. El servidor responde 200 con la persona y la cookie.
Con el punto 8, además con la llave del atacante. La protección de un solo uso (E18) dura 30 días.

**Qué propongo:** que el servidor rechace una entrada cuyo `signedAt` no esté entre «ahora menos 29
días» y «ahora más 1 día», **con su propio reloj**. No es fiarse del reloj del celular: solo se usa
para descartar, y una entrada legítima de hace más de 29 días no podría estar dentro de las 24 horas
de todos modos. Con la fila que se borra a los 30 días de llegar, ninguna firma aceptable queda sin
su fila. Una prueba: confirmar, adelantar 31 días, correr la limpieza, entrar con Google en ese
celular y mandar la misma entrada (es la que corrí). Cuesta: dos comparaciones en `rejectionOf`, una
prueba y corregir § 3 y el paso 8 del diseño.

### 10 · El plazo y la sesión cerrada se miden con la sesión de cualquier cuenta (`offline/data.ts:82` a `:91`, `offline/routes.ts:79`) — Mejora importante, comprobado

**Dónde:** `lastSessionOf(deviceId)` toma la sesión más usada de ese `device_id`, de **cualquier**
persona. El `device_id` de una sesión es el `X-Device-Id` que mandó quien entró: lo elige el cliente.

**El ataque (lo corrí así):** Bruno, empleado con cuenta, quiere usar el celular de Ana más allá de
lo que el servidor debería confirmar. La sesión del celular de Ana la cerró un Administrador desde
otro dispositivo (porque lo perdió), y ya pasaron 30 horas desde su último contacto. Bruno entra con
Google **desde su computadora**, mandando `X-Device-Id` igual al del celular de Ana. Ahora la última
sesión «de ese celular» es la de Bruno: de hace un segundo y no cerrada. La entrada sin conexión de
Ana que Bruno hace con el celular se confirma (`confirmed`), cuando tenía que ser `revoked-session`
o `too-late`. Mientras Bruno use esa sesión, el plazo no vence nunca.

No es frena porque hace falta una cuenta propia y el celular de la víctima (riesgo aceptado), y
porque con red ese celular entra con la huella igual (01). Pero borra las dos señales que Carlos
puso para el celular perdido (R2.2), y en la etapa b lo que se haga ahí no iría a anomalías.

**Qué propongo:** que `lastSessionOf` busque por `device_id` **y** `user_id` de la huella. El índice
`(device_id, last_used_at)` sigue sirviendo. Una prueba con la sesión de otra cuenta con el mismo
`device_id`. Cuesta: una línea, una prueba y una frase en el paso 8 del diseño.

### 11 · `sign-in.offline-repeated` a nombre de cualquiera y sin tope (`offline/routes.ts:49`, `:50` y `:135` a `:138`) — Mejora importante, comprobado

**Dónde:** si el `id` ya existe, la ruta anota `sign-in.offline-repeated` con el `userId` **del
cuerpo**, antes de mirar la huella o la firma, y sin la regla de una fila por ventana.

**El ataque (lo corrí así):** cualquiera que tenga el `id` de una entrada que ya llegó (la suya
propia, si tiene huella y opción; o una vista) manda ese `id` con el `userId` de otra persona. Cada
pedido deja un evento `sign-in.offline-repeated` **a nombre de la víctima**: 15 pedidos, 15 eventos.
Con el límite de 20 por minuto por dirección y por dispositivo (y el dispositivo lo elige él), son
miles por día por dirección. Llena la auditoría y le fabrica a otra persona un historial de «mandó
otra vez una entrada sin conexión». Los `unknown-passkey` también llevan el `userId` del cuerpo,
pero esos sí se anotan una vez por minuto.

**Qué propongo:** que `resultOf` devuelva también el `user_id` guardado y que el evento use ese, no
el del cuerpo (si no coinciden, es una entrada inventada: va como `unknown-passkey`); y que se anote
una vez por ventana, como los otros rechazos. Una prueba con otro `userId` y varios repetidos.
Cuesta: unas líneas.

### 12 · Dos confirmaciones a la vez (`offline/routes.ts:113` a `:124`, `sessions/open.ts:36` y `:37`, `App.tsx:55`, `:69`, `:113` y `:152`) — Mejora, comprobado en el servidor

**Dónde:** la ruta abre la sesión (cookie y `sign-in.succeeded`) **antes** de guardar la fila; si la
fila ya estaba, cierra esa sesión con motivo `sign-out` y responde 409.

**Lo que pasa (lo corrí):** con dos envíos a la vez de la misma entrada, uno responde 200 y el otro
409, pero **los dos traen `Set-Cookie`** y quedan **dos** `sign-in.succeeded` en la auditoría, más un
`sign-out` que nadie hizo. En un navegador, si la respuesta 409 llega última, su cookie (la de la
sesión ya cerrada) pisa la buena: la persona confirmada ve la entrada en el próximo pedido. La
prueba que existe mira solo los códigos. En la aplicación, `sendPending` no se protege de correr dos
veces: la llaman `boot`, el evento `online` y `useReconnect`, que pueden coincidir al volver la red.
Esto último lo leí, no lo probé en un navegador.

No entra nadie; es auditoría falsa y una sesión que se pierde.

**Qué propongo:** guardar la fila primero (con el `id` de la sesión generado antes, o en una
transacción con la sesión) y abrir la sesión solo si la fila se guardó; así el perdedor no escribe
cookie ni auditoría. Y que `sendPending` no corra dos a la vez (una promesa en curso compartida).
Cuesta: reordenar `finish`, unas líneas en `send.ts` y ampliar la prueba con la cookie y la
auditoría.

### 13 · `phoneOwners` crece y puede quedar vieja (`sign-in/context.ts:119`, `offline/flag.ts:11` a `:22`, `passkeys/webauthn.ts:129`) — Mejora, comprobado el crecimiento

**Dónde:** el mapa guarda, por cada `X-Device-Id` que pregunta con sesión y desde un celular, de
quién es su huella, incluso «de nadie». No tiene tope ni vencimiento. Solo lo actualiza vincular.

**El problema, en dos partes:**

1. **Crece.** La sesión no está atada a su dispositivo: con una cookie válida, `/api/start` acepta
   cualquier `X-Device-Id`. Una persona con sesión que manda `/api/start` con un identificador
   inventado en cada pedido hace **una consulta a la base y suma una entrada al mapa** cada vez (lo
   medí: 10 identificadores, 11 consultas). Con el límite de 30 por minuto por dirección son unas
   43.000 entradas por día y por dirección, que no se van hasta reiniciar. Hace falta una cuenta;
   no tira el servidor en un día, pero no tiene techo.
2. **Puede quedar vieja.** Si una huella se quita por otro camino que no sea volver a vincular (hoy
   no hay, pero sí está en R1.5 y en el módulo 02, y las instrucciones para cerrar a distancia antes
   de 02 pueden ser a mano en la base), el mapa sigue diciendo que el celular es de esa persona y
   `/api/start` sigue mandando `offline: true`: la opción no se apaga (R1.5, E05). El servidor no
   confirma nada igual, porque la confirmación busca la huella en la base (E17), así que no se entra:
   es la pantalla la que miente.

**Filtrar algo:** no encontré cómo. El mapa solo se consulta para comparar con la persona de la
sesión, y la respuesta es `offline: true` o nada.

**Qué propongo:** que `withOffline` use el `deviceId` de la sesión, no la cabecera (así un
identificador inventado no consulta ni guarda nada); un tope al mapa (por ejemplo 10.000, sacando el
más viejo) o que no guarde «de nadie»; y una función `forgetPhone(deviceId)` que tenga que llamar
cualquier camino que quite una huella, anotado en el diseño. Cuesta: unas líneas y una prueba.

### 14 · El celular toma como contacto el `/api/start` que dice que no hay sesión (`platform/server/api.ts:72`, `offline/watch.ts:32`) — Mejora, leído

**Dónde:** cualquier respuesta 2xx publica `lastReply`, y `watchOffline` la toma como contacto si
hay una persona guardada. Al abrir la aplicación, `/api/start` responde 200 **sin persona** cuando la
sesión venció en el servidor; `lastReply` se publica dentro de `api()`, antes de que `boot` llame a
`confirmed(undefined)`, así que en ese instante la persona guardada todavía está.

**Lo que pasa:** el celular corre el plazo a «ahora» aunque el servidor no haya aceptado ningún pedido
con sesión. El servidor mide bien (con la sesión), así que no se confirma nada de más; pero el
celular deja entrar sin conexión pasadas las 24 horas reales y después aparece «No se pudo confirmar
tu entrada sin conexión». No es de seguridad; es la pantalla diciendo otra cosa que el servidor.

**Qué propongo:** que `lastReply` diga si la respuesta traía la persona con sesión (o que el contacto
lo publique `confirmed` con persona, no `api()`); una prueba con `/api/start` sin persona. No lo
corrí. Cuesta: unas líneas.

### 15 · Lo guardado en `localStorage` (`offline/pending.ts`, `offline/permit.ts`, `platform/device/proof-key.ts`; diseño § 5) — Mejora

- El diseño dice que son «tres valores chicos, sin datos del negocio ni secretos». Lo pendiente lleva
  la firma de la huella, que con el punto 8 sin arreglar es una credencial; arreglado, deja de serlo.
  Que el diseño lo diga después de arreglarlo.
- El permiso guarda la persona entera (con el correo) y **no se borra al salir**: queda mientras la
  opción esté prendida. El diseño (§ 8) dice «el nombre y el rol». Es lo que hace falta para entrar
  sin conexión, así que está bien guardarlo; que el diseño lo diga, con el correo.
- La llave de prueba es una sola (`createProofKey` pisa la anterior): una entrada cerrada con «Salir»
  sin conexión, seguida de otra entrada, o de una entrada con Google, se queda sin la privada de su
  llave. Hoy no importa; en la etapa b, que verifica lo hecho con la llave de cada entrada, sí. El
  diseño ya lo anuncia («en la etapa b, cada entrada tendrá la suya»); lo dejo anotado para que no
  se olvide.

### 16 · Detalles — Mejora

- **El límite por dispositivo se comparte con la huella con conexión** (`routes.ts:37`,
  `passkey:device:<X-Device-Id>`). Quien conozca el `device_id` de un celular gasta sus 20 por minuto
  desde cualquier lado y la confirmación de la víctima queda en «probá después», igual que su entrada
  con la huella. Es el punto 27 de la revisión de 01 con otro camino; no lo repito.
- **El límite por cuenta se puede gastar** igual que en 01 (punto 12 de esa revisión): con `userId`,
  `credentialId` y `device_id`, una respuesta sin firma cuenta como fallo de esa cuenta. El servidor
  ya no reparte el `credentialId`; está en lo pendiente del celular.
- **La prueba de la auditoría** de E15 mira `signedAt`, no `lastContactAt`, que es lo que pidió el
  punto 6 del paso 4.
- **`openSession` sin abrir nada** (`ended`) igual llama a `markUsed` y anota: está bien, es la
  auditoría de E21.

### Lo que está bien y no repito

- **El desafío:** se recalcula en el servidor con `offlineChallenge`, con `deviceId` de la cabecera y
  los campos del cuerpo ya validados; a `verifyAuthenticationResponse` le llega ese, nunca el del
  pedido. Cambiar `signedAt`, `userId` o el celular da otro desafío (E19, con prueba).
- **La huella:** se busca por `response.id`, tiene que ser de ese `userId` y de ese `device_id`, con
  verificación del usuario, origen y `rpId` (E19, E20, con prueba). Una huella ajena no pasa por la
  de otro.
- **Lo que entra de afuera:** contrato con largos y formas; la respuesta de la huella hasta 8 KB; la
  llave de prueba que tiene que ser una P-256; los identificadores raros en `response.id` (número,
  objeto, lista, nulo, texto largo) dan 401, no 500 (lo probé). El JSON roto ya da 400 (`http.ts:58`).
- **El plazo:** se mide solo con la última sesión del celular en la base, después de escribir los
  últimos usos pendientes (`store.flush()`); ninguna hora del celular decide, salvo la de los 30
  días (punto 9).
- **Sin sesión no sale nada** de la huella de un celular: ni `userId`, ni `credentialId`, ni llave
  pública (con prueba). Con sesión, solo `offline: true` si la huella es de esa misma persona.
- **La baja:** la cuenta dada de baja no se confirma (E16, con prueba) y la opción se apaga.
- **Las filas:** solo con una firma válida; lo que no prueba nada va a la auditoría una vez por
  minuto por dirección.
- **Uno a la vez por `id`:** la clave primaria y `on conflict do nothing` hacen que dos
  confirmaciones a la vez dejen una sola fila y una sola sesión abierta (con los detalles del
  punto 12).

### Cada riesgo y su prueba

| Riesgo | Prueba que lo intenta |
|---|---|
| `/api/start` sin sesión mueve el plazo (paso 4, punto 1) | `offline-security.test.ts`, «un /api/start sin sesión no mueve el último contacto» |
| Sin sesión se filtra la huella del celular (paso 4, punto 2) | `offline.test.ts`, «offline-E01 a E04…» (la última línea) |
| Fuerza bruta por cuenta (paso 4, punto 3) | `offline-security.test.ts`, «las firmas que no verifican frenan la huella…» |
| La firma mala deja fila (paso 4, punto 4) | `offline.test.ts`, E19 (`rowOf` vacío) |
| Repetir la entrada (E18) | `offline.test.ts`, E18; dos a la vez en `offline-security.test.ts` |
| Dato cambiado, otra huella, sin verificación (E19) | `offline.test.ts`, E19 |
| Otra cuenta u otro celular (E20) | `offline.test.ts`, E20 |
| Sesión cerrada desde otro dispositivo (E10) | `offline-security.test.ts`, E10 |
| Más de 24 horas (R3.1) | `offline.test.ts`, R3.1 |
| Firma de más de 30 días según el celular | `offline-security.test.ts` (no prueba la repetición del punto 9) |
| Otra llave de prueba u `openSession` cambiado | **Falta** (punto 8) |
| Repetir pasados 30 días | **Falta** (punto 9) |
| La sesión de otra cuenta con el `device_id` del celular | **Falta** (punto 10) |
| Repetido a nombre de otro | **Falta** (punto 11) |
| Dos a la vez: la cookie y la auditoría del perdedor | **Falta** (punto 12; la que hay mira solo los códigos) |
| `X-Device-Id` inventado con sesión | **Falta** (punto 13) |
| El último contacto en la auditoría (paso 4, punto 6) | Parcial: la prueba mira `signedAt` |

### El estado de los puntos del paso 4

| # | Punto del paso 4 | Estado en el código |
|---|---|---|
| 1 | `/api/start` sin sesión estira las 24 horas | Cerrado, con prueba. Sigue abierto con otra cara: la sesión de otra cuenta con el mismo `device_id` (punto 10) |
| 2 | `/api/start` filtra la huella por `X-Device-Id` | Cerrado, con prueba: sin sesión no va nada, y con sesión solo `offline: true` |
| 3 | Sin desafío del servidor y sin límite por cuenta | Cerrado: el límite por cuenta, con prueba, y el diseño dice por qué no es una puerta de atrás. Pero la frescura que daba el `id` de un uso dura 30 días (punto 9) |
| 4 | Filas de pedidos sin sesión | Cerrado, con prueba |
| 5 | La prueba de la huella en `localStorage` | **Abierto, y más grave de lo que dije:** es una credencial que se puede usar en otra máquina (punto 8) |
| 6 | La auditoría del último contacto | Cerrado; la prueba lo mira a medias (punto 16) |
| 7 | La credencial de `response.id` y el contador | Cerrado: el cuerpo ya no trae `credentialId`; el contador se trata como con conexión, como dice el diseño |

### Dependencias

No hay dependencias nuevas: los tres commits no tocan `package.json` ni `pnpm-lock.yaml`. Se usan
`@simplewebauthn/server` 14.0.3 (ya revisada en el paso 4) y WebCrypto. `pnpm audit --prod`: «No known
vulnerabilities found».

### Lo que no pude comprobar

- Que `sendPending` corra dos veces a la vez en un navegador de verdad y que la cookie del 409 pise
  la buena (punto 12): lo comprobé en el servidor, no en Chrome.
- El punto 14 lo razoné leyendo `api.ts`, `watch.ts` y `boot`; no lo hice correr.
- Cuánto tarda en notarse el crecimiento de `phoneOwners` en la máquina (punto 13): medí las
  consultas, no la memoria.
- Las pruebas de punta a punta: no las corrí.
