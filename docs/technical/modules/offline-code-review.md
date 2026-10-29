# Revisión del código · 15 · Sin conexión (`offline`), etapa a

Revisión independiente del código (constitución, paso 7), hecha solo con los documentos y el código:
el capítulo [15](../../chapters/15-offline/rules.md) y 01 · R2.8, las maquetas aprobadas que nombra su
`screens.md` (`sign-in-phone-dark/final/`, estados «Sin conexión, con la huella» y «No se pudo
confirmar»; `app-frame/final/`, el renglón «Trabajar sin conexión» de Más), el [diseño](offline.md) y
sus revisiones ([diseño](offline-design-review.md), [seguridad](offline-security-review.md)), y la
[constitución](../../project/constitution.md). Código: los commits `ec22ccc`, `fc74178` y `5fde526`
(servidor en `src/server/modules/sign-in/offline/` y lo que tocaron en `google/`, `passkeys/`,
`context.ts`, `index.ts` y `migrations/002-offline.ts`; el contrato
`src/shared/contracts/offline-sign-in.ts`; la aplicación en `src/app/modules/sign-in/offline/`,
`session.ts`, `api.ts`, `screens/`, `App.tsx`, `platform/server/api.ts` y `frame/`), y sus pruebas.

Cómo lo comprobé: leí todo el código y las pruebas de esos commits; corrí `pnpm test` (63 archivos,
380 pruebas, cobertura 100 %, 42,8 s) y `pnpm types`, `lint`, `imports`, `repeated`, `sizes`, `boot`,
`headers` y `links` (todos pasan). Lo que dudaba lo probé con tres pruebas temporales (dos de la
aplicación con `App` y una del servidor con `createOfflineKit`), que borré: el repositorio quedó como
estaba. No corrí las de punta a punta ni las de captura; las capturas las comparé mirando la
referencia guardada contra la de la maqueta.

Los archivos y las líneas son los del commit `5fde526`. Mientras revisaba, alguien empezó a cambiar sin
commit `offline/routes.ts`, `rules.ts`, `data.ts`, el contrato y `offline-kit.ts` (por lo que parece,
los puntos 8 y 9 de la revisión de seguridad): eso no lo revisé, y los números de línea de esos
archivos pueden no coincidir con lo que hay ahora.

La revisión de seguridad del código (sección «Paso 7» de [offline-security-review.md](offline-security-review.md))
se hizo aparte; donde un punto coincide, lo nombro y no lo repito.

Gravedad:

- **Frena:** hay que arreglarlo antes de cerrar el módulo.
- **Mejora:** conviene hacerlo; no frena.

## Resumen

| # | Punto | Gravedad |
|---|---|---|
| 1.1 | Una entrada sin conexión rechazada vuelve a ser una sesión al recargar la aplicación (R3.2) | Frena (comprobado) |
| 1.2 | El último contacto del celular no es el que dice R2.2: suma el `/api/start` sin sesión y no suma la respuesta de entrar | Frena (comprobado lo primero) |
| 1.3 | Atrasar el reloj durante una sesión abierta sin conexión la alarga sin límite (R2.3, R2.7) | Frena |
| 1.4 | Si la confirmación contesta «probá después» con red (429, 500), nadie vuelve a probar | Mejora importante |
| 1.5 | Escenarios sin una prueba que los nombre o que compruebe lo que dicen (E03, E07, E11, E14, E21) | Mejora importante |
| 1.6 | Lo que se muestra encima del marco no se toca en un navegador de verdad | Mejora importante |
| 2.x | Comentarios de cabecera, nombres de archivo y carpetas | Mejora |
| 3.x | Pruebas que miran por dentro | Mejora |
| 4.1 | No hay prueba que cuente las consultas de la confirmación ni de `/api/start` desde un celular | Frena |
| 4.2 | La confirmación no escribe en una transacción y hace más consultas que las del diseño | Mejora importante |
| 4.3 | Dos confirmaciones a la vez: la que pierde deja la cookie de una sesión cerrada | Mejora importante (comprobado) |
| 4.4 | La llave de prueba de una entrada terminada se borra al salir (§ 5) | Mejora |
| 4.5 | Con lo pendiente, el reintento de la entrada deja de pedir el nonce | Mejora (no comprobado al correr) |
| 4.6 | Las unitarias tardan 42,8 s | Mejora importante |
| 5.x | Seguridad: lo que ya encontró la revisión de seguridad, y el desafío en el diseño | Frena (ver la revisión de seguridad, 8 y 9) |
| 6.x | Reglas inventadas: el margen del reloj, «Tu sesión venció», el contacto de otra persona | Mejora |
| 7.x | Repetición y nombres | Mejora |
| 8.x | Documentación que quedó atrás | Mejora |
| 9.x | Pantallas: «hasta» sin negrita, la tostada sin su ícono, el lugar de Google | Mejora |

---

## 1. Escenarios sin cumplir

### 1.1 Una entrada sin conexión rechazada vuelve a ser una sesión al recargar — Frena (comprobado)

- **Dónde:** `src/app/modules/sign-in/offline/send.ts:27-39`, `src/app/App.tsx:62` y `:70`,
  `src/app/modules/sign-in/offline/watch.ts:20-24`.
- **Qué dicen los documentos:** R3.2: si algo no pasa, aparece la entrada encima de lo que había
  «Entrá de nuevo para seguir donde estabas.». El diseño (§ 5): «Mientras la sesión abierta sin
  conexión no se confirma, `/api/start` sin persona no la cierra: sigue hasta confirmarse o hasta
  las 24 horas». Una rechazada ya no está «sin confirmar»: está rechazada.
- **Qué hace el código:** `settle` pone `sessionClosed` (un valor en memoria) y borra la entrada de
  lo pendiente, pero deja en `localStorage` la sesión con su `offlineId` y la persona. Al recargar,
  `boot` no tiene nada que mandar, `/api/start` dice que no hay persona y, como `offlineSession()`
  sigue, no llama a `confirmed(undefined)`; `recheck` también se va por `offlineSession()`, y
  `checkDeadline` solo corta a las 24 horas. Resultado: el marco abierto, sin la entrada encima,
  con una sesión que el servidor rechazó, hasta que se cumplan las 24 horas.
- **Cómo lo comprobé:** una prueba temporal con `App`: sesión guardada con `offlineId`, sin nada
  pendiente, `/api/start` sin persona. Se ve «Tu sesión», no hay región «Entrar», `person` sigue y
  `sessionClosed` queda vacío.
- **Prueba:** ninguna. `offline-E17` y `offline-E16` (`entry.test.ts:97` y `:110`) miran
  `sessionClosed` justo después, sin recargar.

### 1.2 El último contacto del celular no es el de R2.2 — Frena

- **Dónde:** `src/app/platform/server/api.ts:71-73` (`lastReply.set` en cualquier 2xx) y
  `src/app/modules/sign-in/offline/watch.ts:32-34`.
- **Qué dicen los documentos:** R2.2: «Cuenta como contacto cualquier pedido con la sesión abierta
  que el servidor aceptó». El diseño (§ 5, «Cada contacto con sesión»): si hay una persona con
  sesión, pasa esa hora al contacto.
- **Qué hace el código:** `lastReply` se publica dentro de `api()`, **antes** de que quien pidió lea
  la respuesta. El suscriptor mira `person.get()`, que todavía es lo de antes:
  - **Cuenta de más:** el celular guarda a la persona, la sesión venció en el servidor (por no usarla,
    01 · R3.1) y se abre la aplicación con red: `/api/start` contesta 200 **sin** persona, el
    suscriptor ve la persona vieja y mueve el contacto a ahora; recién después `confirmed(undefined)`
    la borra. El celular deja entrar sin conexión 24 horas más, y al volver la red el servidor la
    rechaza (`too-late`) y aparece «No se pudo confirmar». Es el caso de todos los días: el celular
    quedó cerrado de noche. Comprobado con una prueba temporal: el contacto se movió 20 horas. La
    revisión de seguridad lo anotó como Mejora (14); acá frena porque rompe la regla en un recorrido
    común y termina en un rechazo que la persona no entiende.
  - **Cuenta de menos (leído):** la respuesta de entrar (Google, huella, QR) llega con `person`
    vacío, así que no cuenta, aunque abre la sesión y el servidor la toma como último uso. En la
    etapa a el marco no pide nada más; si la persona entra con red a la mañana, trabaja, se corta la
    red y sale, el celular mide las 24 horas desde el contacto del día anterior y no la deja entrar
    sin conexión, aunque el servidor la confirmaría.
- **Prueba:** «cada respuesta con sesión es un contacto; sin sesión o cerrada, no»
  (`entry.test.ts:170`) pone `lastReply` a mano; no prueba ninguno de los dos casos.

### 1.3 Atrasar el reloj durante una sesión sin conexión la alarga — Frena

- **Dónde:** `src/app/modules/sign-in/offline/permit.ts:65-68` (`offlineSessionOver`).
- **Qué dicen los documentos:** R2.3: «Si marca una hora anterior a la más alta que vio la
  aplicación, se toma como vencido: atrasar el reloj no da más tiempo». R2.7: la sesión abierta sin
  conexión dura hasta que se cumplen las 24 horas.
- **Qué hace el código:** `offlineSessionOver` compara solo `now >= at + 24 h`; no mira `maxSeenAt`
  ni lo actualiza (eso lo hace `saw`, que solo llama `offlineUntil`, en la entrada). Con la sesión
  abierta, atrasar el reloj del celular la deja abierta mientras se lo siga atrasando. En la etapa a
  el marco está vacío, pero la etapa b guarda lo hecho en esa sesión.
- **Prueba:** `offline-E09` (`permit.test.ts:32`) prueba el reloj solo en la entrada.

### 1.4 «Probá después» con red: nadie vuelve a probar — Mejora importante

- **Dónde:** `src/app/modules/sign-in/offline/send.ts:13` y `:21`, `src/app/App.tsx:151-152`,
  `src/app/platform/server/reconnect.ts:18`.
- **Qué dice el diseño (§ 5):** «Probá después» incluye `too-many-attempts`, `update-required` y
  `unexpected`; el reintento corre «si quedó algo pendiente».
- **Qué hace el código:** `useReconnect` solo corre con `online` en falso. Un 429 o un 500 llegan con
  JSON, así que `api()` deja `online` en verdadero y no hay reintento: la entrada queda pendiente y la
  sesión sin confirmar, con red, hasta que se reabra la aplicación, vuelva el evento `online` o se
  cumplan las 24 horas. El diseño no dice qué pasa en ese caso; el código lo deja sin salida.
- **Prueba:** `offline-R3` (`entry.test.ts:82`) mira que siga pendiente, no que se vuelva a mandar;
  no incluye `unexpected`.

### 1.5 Escenarios sin una prueba que los nombre o que compruebe lo que dicen — Mejora importante

| Escenario | Qué falta |
|---|---|
| E03 | Ninguna prueba lo nombra solo; «offline-E01 a E04» del servidor prueba otra cuenta en el celular, no un celular sin huella. La segunda mitad (sin conexión, la huella apagada) no se prueba como E03 |
| E06 | `offline-screens.test.tsx:31` no comprueba que Google y «Escanear» estén apagados |
| E07 | Nadie comprueba «la luz en «Sin conexión»», ni la unitaria ni la de punta a punta |
| E11 | Ninguna prueba lo nombra. La de punta a punta sale y entra sin conexión (lo cubre de hecho), pero su cabecera dice E01, E07, E15, y el diseño (§ 11) la pone en esa prueba |
| E14 | `entry.test.ts:200` mira `sessionClosed === 'max-age'`; no que se vea la entrada encima, sin borrar nada, con todo apagado |
| E16 | El nombre de la prueba del servidor (`offline.test.ts:77`) dice «queda anotado», pero mira la fila de la tabla, no la auditoría |
| E17 | No hay prueba del servidor con la huella quitada (hoy no hay ruta para quitarla: se puede marcar `revoked_at` por la fachada o dejarlo dicho) |
| E19 | No comprueba que la sesión no se abra (sin cookie); «la firma de otra huella» se prueba con otra credencial, que cae en «huella que no existe», no con la credencial vinculada firmada por otra llave |
| E21 | Solo `offline-confirmed` se lee de la auditoría (E15). Ni `ended` ni `rejected` ni las que no prueban nada se comprueban en la auditoría |

### 1.6 Lo que se muestra encima del marco no se toca en un navegador de verdad — Mejora importante

- **Qué dice la constitución (VII):** toda pieza que se muestra encima de otra se prueba además
  tocándola en el navegador de verdad.
- **Qué hay:** la entrada encima del marco por «No se pudo confirmar» (R3.2), por la baja (E16) y por
  el corte de las 24 horas (E14) solo se prueban en la unitaria. La de punta a punta recorre solo el
  camino que sale bien, y `tests/screens/` tiene solo el estado «con la huella».

## 2. Comentarios de cabecera y carpetas

Todos los archivos nuevos tienen su cabecera y dicen el porqué. Lo que quedó corto o inexacto:

- **`src/app/modules/sign-in/offline/pending.ts:1-4`:** dice que cada entrada se borra con cualquier
  respuesta «salvo "probá después" (sin red, demasiados intentos o una versión nueva)»; falta
  `unexpected`, y quien decide qué se borra es `send.ts`, no este archivo. Mejora.
- **`src/server/modules/sign-in/offline/flag.ts`:** el nombre no dice qué hay (`ownerOf`,
  `canGoOffline`, `withOffline`: de quién es la huella del celular y si la persona trae `offline`).
  Un nombre como `phone-owner.ts` o `person-offline.ts` funciona como índice. Mejora.
- **`src/app/modules/sign-in/offline/useOfflineEntry.ts`:** además del hook tiene `whenText`, que
  arma el texto «hoy / mañana / el martes» y usa `Notices.tsx`; la cabecera no lo dice y es otra
  responsabilidad (un texto). Iría con los textos o en su propio archivo. Mejora.
- **`src/app/modules/sign-in/session.ts:1-3`:** la cabecera no dice que guarda también la sesión
  abierta sin conexión (`offlineId`) ni que suma `offline` a la persona al vincular. Mejora.
- **`src/app/modules/frame/screens/Phone/switch.css`:** el interruptor es la «llave» de la maqueta de
  Configuración (`changes.md` de `app-frame`); el módulo 04 la va a usar. Es una pieza de `ui/`, no
  de la pantalla de Más. Mejora (cambiar `ui/` es tarea del código común).
- **Carpetas:** `sign-in/offline/` en los dos lados tiene pocos archivos y un solo concepto; está
  bien.

## 3. Pruebas que miran por dentro

La constitución (VII) pide usar el servidor por su API y la aplicación por lo que ve y toca la
persona. Mejora en todos:

- **Servidor:** `rowOf` (`src/server/testing/sign-in/offline-kit.ts:79-87`) lee la tabla
  `sign_in.offline_sign_ins` con SQL; lo que se ve desde afuera es la respuesta y la auditoría.
  `offline-E10` (`offline-security.test.ts:24-32`) cierra la sesión con un `update` en SQL en lugar
  de cerrarla desde otro dispositivo por la API, y no mira la respuesta. «Sin ninguna sesión
  guardada» borra filas con SQL.
- **Aplicación:** `entry.test.ts` y `permit.test.ts` llaman a `withOfflinePasskey`, `sendPending`,
  `offlineUntil`, `contacted`, `revokeOffline` y leen `localStorage` (`offline-contact`), `permit`,
  `entries()` y `sessionClosed`. Un cambio en cómo se guarda (por ejemplo, pasar a IndexedDB en la
  etapa b) rompe todas sin cambiar nada visible. `tests/screens/entrance.spec.ts:46-52` arma el
  estado escribiendo las claves de `localStorage` a mano.
- `offline-E01` (`phone.test.tsx`) comprueba el lugar con `previousElementSibling`; alcanza con
  buscar el renglón en la lista.

## 4. El diseño

### 4.1 No hay prueba que cuente las consultas — Frena

- **Qué dicen los documentos:** el paso 6 de la constitución pide «las que cuentan las consultas de
  cada pedido». El diseño (§ 10): `/api/start` con sesión desde un celular, una consulta por índice
  la primera vez y después ninguna; `POST /api/sign-in/offline`, cuatro consultas por índice y dos
  escrituras.
- **Qué hay:** `src/server/modules/sign-in/queries.test.ts` no suma nada del módulo: su
  `/api/start` con sesión es de una computadora, y la ruta nueva no está.

### 4.2 La confirmación: sin transacción y con más consultas — Mejora importante

- **Dónde:** `src/server/modules/sign-in/offline/routes.ts:47-133`.
- **Qué dice el diseño (§ 10):** «cuatro consultas por índice y dos escrituras en una transacción».
- **Qué hace el código (leído):** `resultOf`, `findActive`, `markUsed` (escritura),
  `users.findById`, `store.flush` (escrituras de los últimos usos pendientes), `lastSessionOf`,
  `openSession` (escritura), `insert` (escritura) y, para la respuesta, `ownerOf` si el celular no
  estaba en memoria. Ninguna transacción: si la fila no se puede guardar después de abrir la sesión,
  se cierra a mano (`:121-123`). El diseño o el código, uno de los dos, tiene que cambiar.

### 4.3 Dos confirmaciones a la vez dejan la cookie de una sesión cerrada — Mejora importante (comprobado)

- **Dónde:** `routes.ts:113-124`; en la aplicación, `send.ts:15-24` no evita mandar dos veces la
  misma entrada (lo llaman `boot`, el evento `online` y el reintento, sin un candado).
- **Qué dice el diseño (§ 4, paso 3):** `offline-already-confirmed`, **sin cookie**.
- **Qué hace el código:** la que pierde abre su sesión (pone la cookie y anota
  `sign-in.succeeded`), no puede guardar la fila, cierra la sesión y responde 409 **con** la cookie
  de esa sesión cerrada. Comprobado con una prueba temporal: cinco de cinco veces, `409` con cookie.
  Si esa respuesta llega después de la buena, el celular queda con la cookie muerta. La prueba
  «dos confirmaciones a la vez» (`offline-security.test.ts:195`) mira solo los códigos. Coincide con
  la revisión de seguridad (12).

### 4.4 La llave de prueba de una entrada terminada se borra al salir — Mejora

- **Dónde:** `src/app/modules/sign-in/session.ts:77` y `:84`, `offline/enter.ts:48`.
- **Qué dice el diseño (§ 5, «Salir de una sesión sin conexión»):** «La llave de prueba de esa
  entrada se guarda con ella hasta que se manda».
- **Qué hace el código:** la entrada guarda solo la parte pública; `signOut` llama a
  `forgetProofKey()`, que borra la privada. Para la etapa a alcanza; para la b no. El diseño o el
  código tiene que decir lo mismo (la revisión de seguridad, 15, lo trata con la llave única).

### 4.5 Con lo pendiente, el reintento de la entrada deja de pedir el nonce — Mejora (no comprobado al correr)

- **Dónde:** `src/app/App.tsx:152`: `useReconnect(entrance || pending, pending ? recheck : renew)`.
- **Qué dice 01 · R2.8:** con la entrada a la vista, vuelve a probar sola hasta que un pedido llegue,
  y los botones se prenden.
- **Qué hace el código (leído):** con la entrada a la vista **y** algo pendiente (salió sin conexión
  de una sesión sin conexión), el reintento llama a `recheck` en lugar de `renew`; `recheck` manda lo
  pendiente y se va porque no hay persona, sin pedir el nonce de Google. No lo corrí: puede que
  otra parte de 01 pida el nonce al volver la red.

### 4.6 Las unitarias tardan 42,8 s — Mejora importante

La constitución (VII) pide menos de 30 s. Ya pasaba antes de este módulo (la revisión de 01 midió
31,9 s); este módulo suma 9 archivos. No lo atribuyo solo a él, pero sigue sin cumplirse.

## 5. Seguridad (la sección «Seguridad» del diseño)

Lo hecho como dice el diseño: el desafío se recalcula siempre en el servidor con `offlineChallenge`
de `src/shared/` (`routes.ts:62`); la huella es la de `response.id`, de esa persona y de ese
celular (`:52-57`); UV obligatorio (`webauthn.ts:71`); el límite por dirección, por dispositivo y
por cuenta; lo que no prueba nada no deja fila y se anota una vez por ventana; sin sesión,
`/api/start` no dice nada de la huella del celular (`flag.ts`, `google/routes.ts:42-45`); el plazo
lo mide solo el último uso de una sesión, y un `/api/start` sin sesión no lo mueve (probado).

Lo que no, ya encontrado y comprobado por la revisión de seguridad; lo nombro porque contradice lo que
el diseño promete (§ 4, paso 4: «ningún dato se puede cambiar después de firmar»):

- **5.1 La firma no ata `proofPublicKey` ni `openSession`** (`src/shared/contracts/offline-sign-in.ts:33-48`,
  `enter.ts:45-48`): la llave de prueba se crea después de la huella. Frena (seguridad, 8).
- **5.2 `too-old` no mide la edad de la firma** (`rules.ts:204-205`): compara dos horas que manda el
  mismo celular, así que a los 30 días, borrada la fila, la misma entrada vuelve a confirmarse. E18
  deja de valer. Frena (seguridad, 9).
- **5.3** `sign-in.offline-repeated` (`routes.ts:135-138`) se anota con el `userId` que dice el
  cuerpo, antes de verificar nada y sin el tope de una vez por ventana. Mejora (seguridad, 11).
- **5.4** `phoneOwners` (`context.ts:119`) es memoria de una sola copia del servidor y no se borra
  nunca; quitar una huella (módulo 04) o una segunda copia (constitución IX) la dejan vieja. Mejora
  (seguridad, 13).

## 6. Reglas inventadas

- **El margen del reloj** (`permit.ts:15`, `:59`): R2.3 dice que cualquier hora anterior a la más
  alta es vencido; el código perdona 5 minutos. Lo dice el diseño, no la regla. Que Carlos lo sepa,
  o que la regla lo diga. Mejora.
- **«Tu sesión venció» al cortar a las 24 horas** (`watch.ts:22`, motivo `max-age`): R2.7 dice que
  aparece la entrada con «Para entrar hace falta internet». El código suma arriba «Tu sesión venció ·
  Entrá de nuevo para seguir donde estabas.». Es razonable (01 · R3.4), pero ninguna regla ni
  maqueta lo pide. Mejora.
- **El contacto de otra persona cuenta para la opción de esta** (`watch.ts:33`, `permit.ts:38-42`):
  si en el celular de Ana entra Beto, cada respuesta con la sesión de Beto mueve el plazo de Ana y le
  saca el `revoked`. El servidor hace lo mismo (`lastSessionOf` no mira la cuenta). R2.2 dice que en
  el último contacto «la cuenta estaba activa y con el permiso»: con la sesión de Beto el servidor no
  dijo nada de Ana. Es una lectura de la regla que nadie decidió; coincide con la revisión de
  seguridad (10). Mejora.
- **La persona del permiso queda fija** (`setting.ts:26`, `enter.ts:50`): se guarda al prender la
  opción y no se actualiza en los contactos; si cambia el nombre o el rol, entra sin conexión con el
  de entonces. Mejora.

## 7. Simpleza y repetición

- **Si la persona trae `offline` se calcula en cuatro lugares y de cuatro formas:** `flag.ts:18-28`
  (`withOffline`), `google/routes.ts:120-123`, `passkeys/sign-in-routes.ts:75-80` y
  `passkeys/link-routes.ts:53-55`. Dos llaman a `canWorkOffline({ active: true })`, que siempre da
  verdadero, y `routes.ts:83` hace `active && canWorkOffline({ active })`. Cuando el módulo 02 cambie
  la regla por el permiso del rol, hay que encontrar las cuatro. Una sola función que reciba la
  persona. Mejora.
- **Las 24 horas están dos veces** (`offline/rules.ts:166` en el servidor y `offline/permit.ts:13`
  en la aplicación). La constitución (XII.3) pide lo que usan los dos lados una sola vez en
  `src/shared/`. Mejora.
- **`const minute = 60_000`** en `permit.ts`, `useOfflineEntry.ts`, `watch.ts` y `rules.ts`. Mejora.
- **base64url, tres veces:** `base64urlOf` en el contrato, `bytes` en `enter.ts:15-18` y el de
  `platform/device/proof-key.ts`. Y cómo se arma el `userHandle` (el identificador sin guiones, en
  hexadecimal) está en el servidor (`webauthn.ts:52`) y en la aplicación (`enter.ts:24-28`) sin una
  sola definición. Mejora.
- **Nombres que chocan:** `canGoOffline` es en el servidor «¿puede?» (`flag.ts`) y en la aplicación
  «marcá que puede» (`session.ts:51`). `permit` es en el glosario el «permiso de entrada» de la
  computadora (`codes`), y acá es lo guardado de la opción (`offline-permit`, `Permit`); «permiso»
  en el glosario es `permission`. «Entrada sin conexión» (`Entry`, `OfflineSignIn`) y «último
  contacto» (`contact`) no están en el glosario. Constitución X. Mejora.
- **`withOfflinePasskey(): Promise<undefined>`** (`enter.ts:34`) devuelve siempre `undefined` solo
  para encajar en `attempt`; `pending.ts:84` exporta `entries` como otro nombre de `read`;
  `Judged.user` (`rules.ts:184`) es un objeto con un solo booleano que repite `allowed`;
  `registerOfflineRoutes` devuelve los datos para que `index.ts` programe la limpieza. Mejora.

## 8. Documentación que quedó atrás

Mejora en todos:

- El orden del servidor (§ 4) no es el del código: el `id` repetido se mira antes que el límite por
  cuenta, y el límite por cuenta después de encontrar la huella.
- La respuesta `{ ended: true }` de una confirmación sin abrir sesión no está en el diseño.
- Los motivos de la auditoría para lo que no prueba nada (`unknown-passkey`, `invalid-signature`)
  no están en § 9.
- El índice `offline_sign_ins_received_at` (para borrar a los 30 días) no está en § 3.
- Que una sesión abierta sin conexión no apaga la opción aunque la persona venga sin `offline`
  (`watch.ts:16`), y que la opción la decide el permiso guardado y no la persona de la sesión, no
  están en § 5.
- El motivo con que se corta a las 24 horas (`max-age`, que muestra «Tu sesión venció») no está en
  ningún documento (ver 6).

## 9. Pantallas

Comparé la captura de referencia `tests/screens/references/entrance-phone-offline-finger.png` con
`screenshot-phone-offline-finger.png` de la maqueta. La de «No se pudo confirmar» y el renglón de
Más no tienen captura en `tests/screens/`: no los pude comparar dibujados.

- **9.1 «hasta» sin negrita** (`Notices.tsx:71-76`, `texts.ts`): la maqueta pone en negrita el día y
  la hora («hasta **el martes 9:40**»); el código, todo igual. Mejora.
- **9.2 La tostada sin su ícono** (`setting.ts:24`): la maqueta muestra «Para prenderla hace falta
  internet.» con `wifi-off`; `showToast` usa el reloj por omisión. Mejora.
- **9.3 El lugar de Google:** en la maqueta dice «Sin internet, Google no carga»; en la captura se ve
  el botón «Continuar con Google» apagado, porque la prueba corta la red después de que Google
  cargó. No es del módulo (es 01 · R2.1), pero la captura de referencia no muestra el estado aprobado.
  Mejora.
- **9.4 El renglón de Más:** el código (`PhoneMore.tsx:86-110`) tiene el mismo molde, ícono, textos e
  interruptor que la maqueta, debajo de Configuración. La maqueta nombra el interruptor con
  `aria-labelledby` (solo el nombre) y `aria-describedby` (el detalle); el código lo nombra con todo
  el texto del botón. Mejora.
- En la computadora no cambia nada (E04): comprobado leyendo (`setting.ts:15`, `useOfflineEntry`
  con `phone`).

## Lo que no pude comprobar

- Las de punta a punta (`tests/e2e/offline.spec.ts`) y las de captura: no las corrí.
- Que la aplicación abra sin red desde que se prende el celular (R2.6): depende del service worker;
  `pnpm boot` pasa, pero no lo probé sin red.
- 4.5 (el nonce con lo pendiente): leído, no corrido.
- Que la huella de Android firme sin internet: lo dice el diseño (§ 2) por la prueba de Carlos.
