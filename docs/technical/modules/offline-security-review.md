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
