# Diseño técnico · 15 · Sin conexión (`offline`), etapa a: entrar sin conexión

Implementa la etapa a del [capítulo 15](../../chapters/15-offline/rules.md): entrar con la huella
del celular sin conexión, y que el servidor lo confirme al volver la conexión. La etapa b
(trabajar sin conexión) tiene su propio diseño cuando le toque. Todo lo que no se cambia acá sigue
como dice el [diseño de 01](sign-in.md). Corregido con sus dos revisiones
([diseño](offline-design-review.md), [seguridad](offline-security-review.md)).

**Dónde vive el código (excepción a la constitución XII, aprobada por Carlos).** Entrar sin
conexión es una forma más de entrar: crea sesiones, usa las huellas y cambia la entrada, todo de
`sign-in`. Vive en `src/server/modules/sign-in/offline/` y `src/app/modules/sign-in/offline/`. El
módulo `offline` propio, con ese nombre en las dos partes, nace con la etapa b (la cola de lo hecho
sin conexión). Ponerlo ahora en `modules/offline/` obligaría a `sign-in` a abrir registros para
que `offline` le cambie la entrada, la respuesta de `/api/start` y la sesión: más piezas para el
mismo resultado.

## 1. Qué resuelve

Las reglas R1 a R3 del capítulo 15 y sus escenarios E01 a E21, y la excepción de 01 · R2.8.

**La idea técnica:** sin conexión, el celular hace con la huella lo mismo que con conexión
(`navigator.credentials.get()`), pero con un desafío que arma él y que ata la firma a esa entrada.
La pantalla se fía del lector del celular: la verificación que vale es **la del servidor**, al
volver la conexión, con esa misma firma. Para el plazo, el servidor no se fía de ninguna hora del
celular: usa solo lo que sabe él.

## 2. La huella anda sin internet

Las huellas de Android viven en el Administrador de contraseñas de Google, que las sincroniza entre
dispositivos, pero la firma la hace el celular. No está documentado que ande sin internet: Carlos lo
probó en su celular, en modo avión, con una página de prueba que pedía la huella con un desafío
armado en el celular, como lo hace la aplicación. Firmó, con la huella.

## 3. Entidades

### `sign_in.offline_sign_ins` (nueva)

Cada entrada sin conexión **con una firma válida** que llegó al servidor, confirmada o no. Lo que
no demuestra nada (una firma que no verifica, una huella que no existe) no ocupa fila: deja una
línea en la auditoría con la regla de una fila por ventana (diseño de 01, § 9).

| Columna | Tipo | Para qué |
|---|---|---|
| `id` | `uuid` PK | El identificador que creó el celular al entrar, al azar. Que sea la clave impide usar la misma firma dos veces (E18) |
| `user_id`, `device_id`, `credential_id` | | Quién, desde qué celular y con qué huella |
| `signed_at` | `timestamptz` | La hora del celular cuando puso la huella (no confirmada, solo para mirar) |
| `received_at` | `timestamptz` | La hora del servidor cuando llegó |
| `last_contact_at` | `timestamptz` | El último contacto con sesión de ese celular que usó el servidor para el plazo (§ 4, paso 8) |
| `proof_public_key` | `bytea` | La llave de prueba de esa entrada, también si se rechaza: en la etapa b, lo hecho en una entrada rechazada va a anomalías y hay que poder verificar que lo firmó ella |
| `result` | enum | `confirmed`, `ended` (se confirmó la huella, pero la persona ya había salido o entró otra) o `rejected` |
| `reason` | enum | Si se rechazó: `deactivated`, `not-allowed`, `revoked-session`, `too-late`, `too-old` |
| `session_id` | `uuid` | La sesión que se abrió, si se abrió |

Las filas se borran a los 30 días; por eso el servidor rechaza una firma de más de 29 días, o de más
de un día en el futuro, medida con su reloj (`too-old`): así nunca se acepta otra vez una firma cuya
fila ya se borró (revisión de seguridad, 9).

**Índice nuevo** en `sign_in.sessions` sobre `(device_id, last_used_at)`: para el último contacto
de un celular y su última sesión, sin recorrer la tabla.

**El permiso** «Trabajar sin conexión» no tiene columna: hasta el módulo 02 lo tienen todos los
Administradores, que son todos. La regla está una sola vez, en `canWorkOffline(person)` de
`sign-in/offline/rules.ts`; el módulo 02 la cambia por el permiso del rol, que viaja con la
persona.

## 4. API

### `GET /api/start` y las respuestas de entrar: un dato más de la persona

Con sesión, la persona que ya devuelven `/api/start` y las rutas de entrar suma
`"offline": true` si: `canWorkOffline`, el pedido viene de un celular (`X-Device-Id`) y ese celular
tiene una huella vinculada sin quitar **de esa misma persona**. Si no, el campo no va.

- Sin sesión no va nada: nadie puede preguntar por la huella de un celular ajeno mandando su
  identificador (revisión de seguridad, 2). Después de «Salir», el celular sigue con lo que supo en
  el último contacto con sesión, que es lo que dice la regla.
- La persona con sesión ya está en memoria (diseño de 01, § 6). De quién es la huella de cada
  celular es una consulta por índice (`sign_in.passkeys` por `device_id`), solo con sesión, desde un
  celular y con el celular **de la sesión**, no el que diga el pedido; queda en memoria
  (`phoneOwners`, con un tope de 10.000 celulares: pasado, empieza de cero) y vincular una huella la
  actualiza. Así
  `/api/start` con la sesión en memoria sigue sin consultar la base. Son unos 15 bytes. También lo
  dicen la respuesta de entrar con la huella (sin consulta: es la huella que firmó) y la de
  vincularla (`{ ok, offline }`), para que la opción aparezca sin volver a abrir.
- La llave pública no viaja: el celular no verifica la firma (§ 5).

### `POST /api/sign-in/offline` (nueva)

Confirma una entrada sin conexión. Sin sesión; lleva la huella. La manda la aplicación sola con lo
pendiente (§ 5).

Recibe (contrato `OfflineSignIn` en `src/shared/contracts/`, como mucho 8 KB):

| Campo | Qué |
|---|---|
| `id` | El de la entrada, al azar |
| `userId` | Quién dice ser |
| `signedAt`, `lastContactAt` | Las horas del celular (ISO 8601), firmadas: solo se guardan |
| `openSession` | Si esta entrada es la sesión que la persona tiene ahora en el celular. Es `false` si ya salió o si entró otra persona (§ 5) |
| `openSignature` | Con `openSession`, la firma de la llave de prueba sobre `offlineOpenMessage(id)`: la privada no se puede copiar del celular, así que quien copie la entrada guardada no puede abrir la sesión (revisión de seguridad, 8) |
| `response` | La respuesta de `navigator.credentials.get()`. La huella es la de `response.id`, no otro campo |
| `proofPublicKey` | La pública de la llave de prueba de esa entrada, que va en el desafío |

El servidor, en orden, y se queda en el primero que falla:

1. El contrato y `Origin` (como todo `POST`, diseño de 01, § 4).
2. Los límites de la huella: 20 por minuto por dirección y por dispositivo, y el de intentos
   fallidos por cuenta (01 · R2.10), igual que entrar con la huella con conexión.
3. Si `id` ya existe: `confirmed` o `ended` responde `offline-already-confirmed`, sin cookie (§ 5
   dice qué hace la aplicación); `rejected`, `offline-not-confirmed`. Se anota
   `sign-in.offline-repeated` a nombre de quien la mandó la primera vez (no del que dice el pedido)
   y una vez por ventana (revisión de seguridad, 11).
4. La huella existe, no está quitada y es de `userId` y de ese `device_id` (E20), y, con
   `openSession`, `openSignature` verifica con `proofPublicKey`. Si no, `offline-not-confirmed` sin
   fila (`unknown-passkey`, `open-signature`).
5. **El desafío:** el servidor lo recalcula con `offlineChallenge()`, la única función que lo arma,
   en `src/shared/` (la usan los dos lados): `base64url(SHA-256(JSON con las claves en orden de
   { id, userId, deviceId, signedAt, lastContactAt, proofPublicKey }))`, con `deviceId` de
   `X-Device-Id`. La llave de prueba sí va: la firma de la huella queda atada a ella. La huella no va:
   la firma solo verifica con la llave de la huella que la hizo. A
   `@simplewebauthn/server` le pasa ese desafío recalculado, nunca el que viene en el pedido. Así
   ningún dato se puede cambiar después de firmar (E19).
6. Verifica la firma de la huella: el origen, el `rpId`, el tipo `webauthn.get` y la marca de
   verificación (UV). El contador, como con conexión (las huellas de Google mandan siempre 0, y las
   entradas salen en orden). Una firma que no verifica cuenta como intento fallido de la cuenta
   (`invalid-signature`) y no deja fila (§ 3).
7. La cuenta, por la fachada de `users`: activa (si no, `not-authorized`, E16) y `canWorkOffline`
   (si no, `not-allowed`).
8. **El plazo, solo con lo que sabe el servidor.** El último contacto es el último uso de una sesión
   **de esa persona** en ese celular (por el índice nuevo; incluye la sesión que abrió una
   confirmación anterior): ni un pedido sin sesión ni la sesión de otra cuenta con el mismo
   identificador de celular lo mueven (revisión de seguridad, 1 y 10). Si esa sesión la cerró otro
   dispositivo, `revoked-session`. Si la confirmación **llega** más de 24 horas después de ese
   contacto (con 5 minutos de margen por la escritura por tandas del último uso), `too-late`: para
   una entrada hecha dentro del plazo es lo mismo, su sesión ya se cortó en el celular a las 24
   horas (R2.7). Si `signedAt` tiene más de 29 días o está más de un día en el futuro según el reloj
   del servidor, `too-old`.
9. **Guarda la fila antes de abrir nada:** si otra confirmación de la misma entrada llegó a la vez y
   ganó, esta responde `offline-already-confirmed` sin abrir ninguna sesión (revisión de seguridad,
   12). Si todo pasó y `openSession`: la fila queda `confirmed`, crea la sesión (diseño de 01, § 6)
   con la hora del servidor, anota su id en la fila, pone la cookie y devuelve la persona, como
   `POST /api/sign-in/passkey`. Sin `openSession`: la fila queda `ended`, responde `{ "ended": true }`
   y no abre nada. No es una transacción: si el servidor se cae entre la fila y la sesión, la entrada
   queda confirmada sin sesión, y la persona vuelve a entrar.

Si algo falla en 7 u 8, la fila queda `rejected` con su motivo y se responde
`offline-not-confirmed` (o `not-authorized` si la cuenta está dada de baja), sin decir cuál fue.

**Por qué esto no es una puerta de atrás:** es entrar con la huella con un desafío que no dio el
servidor. Lo que el desafío del servidor impide (repetir una firma) lo impide acá el `id` de un uso
y la clave de la tabla; lo que la firma prueba (que la persona puso la huella en ese celular) es lo
mismo, y la llave de prueba en el desafío ata la entrada al celular. Lo que no se puede probar es
cuándo firmó: por eso el plazo se mide con la llegada.

## 5. Los flujos

### Lo guardado en el celular

En `localStorage` (`platform/device/storage`): son tres valores chicos, sin datos del negocio ni
secretos, como el resto de lo que guarda la aplicación sin trabajar sin conexión (arquitectura,
«Los datos»). La cola de la etapa b, con lo hecho sin conexión, va en IndexedDB (ADR-007); si una
versión nueva cambia la forma de estos valores, lee la anterior.

| Qué | Para qué | Se borra |
|---|---|---|
| **La opción** (`offline-option`): `{ person: { userId, name, role }, revoked }`, sin el correo | Entrar sin conexión | Al apagar la opción, o cuando el servidor dice que ya no (abajo). No al salir: es para entrar después de salir |
| **El contacto** (`offline-contact`): `{ at, maxSeenAt }`, horas del celular | El plazo y el reloj | No se borra |
| **Lo pendiente** (`offline-pending`): la lista de entradas sin conexión `{ id, userId, signedAt, lastContactAt, response, proofPublicKey, ended }`, en orden | Confirmarlas | Cada una, cuando el servidor contesta algo que no sea «probá después» |

La llave de prueba de cada entrada es la de la sesión (IndexedDB, diseño de 01, § 6), que no se
puede exportar: la entrada guarda su parte pública. Sin la privada, quien copie lo pendiente no
puede abrir la sesión con él (§ 4). En la etapa b, cada entrada tendrá la suya. La sesión guardada
(`session`) suma `offlineId` mientras el servidor no la confirma y `closedReason` si no la confirmó.

### Prender la opción (R1)

- El renglón de Más aparece solo en el celular, con sesión, si la persona trae `offline: true`
  (E02, E03, E04): eso ya dice que tiene el permiso y su propia huella en este celular, aunque
  otra persona haya vinculado la suya antes (revisión de diseño, 1.5).
- Prenderla exige conexión: sin conexión, «Para prenderla hace falta internet.», como la maqueta
  (R1.3). Guarda la opción, con el contacto del último pedido con sesión que el servidor aceptó.
- Apagarla la borra. Lo pendiente no se toca.

### Cada contacto con sesión

- La plataforma publica «el servidor contestó bien» (`lastReply`, un valor como `online`, con la
  hora del celular), sin saber del negocio. `sign-in/offline` lo escucha y lo mira **después** de
  que la respuesta se procesó (un `/api/start` sin persona ya la sacó; la respuesta de entrar ya la
  puso): si hay una persona con sesión (no una sin confirmar), la sesión no se cerró y es la persona
  de la opción (o no hay opción todavía), pasa esa hora al contacto y pone `revoked: false`. Así el
  contacto del celular es el mismo que mide el servidor.
- Si la persona de la opción ya no trae `offline: true` (perdió el permiso, se quitó su huella, la
  dio de baja), la opción se borra (R1.5, E05); si lo trae, guarda su nombre y su rol de ahora. Con
  `not-authorized`, también se borra.
- `session-closed` con motivo `revoked` (cerrada desde otro dispositivo) **no** borra el permiso:
  pone `revoked: true`, que no deja entrar sin conexión hasta el próximo contacto con sesión
  (R2.2). Con motivo `deactivated`, lo borra.
- `maxSeenAt` es la hora más alta del celular que vio la aplicación: en cada contacto y cada vez
  que se mira el permiso.

### Entrar sin conexión (R2)

- `useOfflineEntry` dice si se puede y hasta cuándo: hay permiso, no `revoked`, `Date.now()` no es
  menor que `maxSeenAt` menos 5 minutos (R2.3, E09) y no se cumplió `lastContactAt + 24 h` (R2.2,
  E08). Se vuelve a calcular cada minuto, al volver a la vista y al volver la red, así el aviso se
  apaga solo a la hora (E08 sin recargar). Si se puede, la huella queda prendida y el aviso dice
  hasta cuándo (R2.1, E06): «hoy 21:40», «mañana 9:40» o «el martes 9:40», en la hora del celular.
- Al tocar la huella:
  1. Crea `id` (al azar), toma `signedAt` y `lastContactAt`, y crea la llave de prueba **antes** de
     pedir la huella: su parte pública va en el desafío.
  2. Arma el desafío con `offlineChallenge()` y llama a `navigator.credentials.get()` con
     `userVerification: "required"`, sin decir qué huella: la del celular.
  3. **Verifica lo que la pantalla necesita, sin la firma:** que la huella que contestó sea de la
     persona del permiso (`userHandle`, el identificador de la persona que se guardó al
     vincularla) y que traiga la marca UV. Verificar la firma en el celular no agrega nada (quien
     pueda tocar el código del celular se la saltea), así que no se hace y no hace falta la llave
     pública en el celular (revisión de diseño, 3.1). Si falla o se cancela, no entra (E13).
  4. Suma la entrada a lo pendiente y entra con la persona guardada
     (`signedInOffline()`, con el `id` de la entrada): directo al marco, sin «Entrando» (R2.6, E07).
     Una versión nueva no se aplica sin conexión: espera a que vuelva.
- **El corte de las 24 horas** (R2.7, E14) se mira al arrancar la aplicación, cada minuto, y al
  volver a la vista (un temporizador largo se atrasa con el celular dormido). Cuenta desde el
  último contacto, aunque se haya apagado la opción, y también corta si el reloj se atrasó (R2.3).
  Cumplido, aparece la entrada encima, sin borrar nada, con todo apagado y el aviso de sin conexión
  (sin el de sesión vencida). Lo pendiente sigue pendiente.
- La aplicación abre sin red porque el service worker guarda el esqueleto al instalarse, y lo de
  entrar (con esta parte) está en el esqueleto: suma unos 3 KB al tope de 60 KB.

### Lo pendiente sale primero, en orden

Una sola función, `sendPending()`, que llaman `boot` (al abrir, antes de `/api/start`) y `recheck`
(al volver la red), manda lo pendiente en orden; nunca corren dos a la vez: la salida pendiente (diseño de 01, § 7) y después
cada entrada sin conexión. Es la base de la cola de la etapa b. Mientras la sesión abierta sin
conexión no se confirma, `/api/start` sin persona no la cierra: sigue hasta confirmarse o hasta las
24 horas. Para cada entrada:

- `openSession` es `true` solo para la última, si es la sesión que el celular tiene ahora (no salió
  ni entró otra persona), y va con la firma de la llave de prueba (`openSignature`); si la llave ya
  no está, va sin abrir. Así una confirmación de A nunca pisa la cookie de B (revisión de diseño,
  1.5).
- **Qué la borra:** cualquier respuesta del servidor salvo «probá después». «Probá después» es: sin
  red o sin JSON, `too-many-attempts`, `update-required` (se actualiza la aplicación y se manda
  con la versión nueva) y `unexpected`.
  - Confirmada (E15): la cookie quedó puesta y todo sigue.
  - `offline-not-confirmed` o `not-authorized` (E16, E17) con `openSession`: aparece la entrada
    encima, sin borrar nada, con «No se pudo confirmar tu entrada sin conexión» o el de no
    autorizada. El celular no tiene el correo, así que dice «Esta cuenta no está autorizada…» sin
    él (el texto ya lo admite). `not-authorized` también borra la opción. La sesión guardada anota
    el motivo (`closedReason`): al recargar, la entrada sigue encima (R3.2).
  - `offline-already-confirmed`: la respuesta anterior se perdió en el camino. La aplicación pide
    `/api/start`: si la cookie había llegado, sigue; si no, aparece la entrada con «Entrá de nuevo
    para seguir donde estabas.», sin perder nada. Es raro y no vale una llave más para evitarlo.
- **El reintento:** si quedó algo pendiente sin red, `useReconnect` (que hoy corre con la entrada a
  la vista) corre también con el marco, probando con `recheck`: a los 2, 4, 8, 16 y 32 s y después
  cada minuto, solo mientras el navegador diga que hay red y el último pedido haya fallado. Si el
  servidor contestó «probá después» (`too-many-attempts` o `unexpected`), vuelve a probar a los
  segundos que dijo o al minuto. Va en [mobile-data.md](../mobile-data.md).

### Salir de una sesión sin conexión

Sin conexión, «Salir» marca la entrada como terminada (`ended: true`) y no la borra: se manda igual
al volver la red, para la auditoría (E21), con `openSession: false`, que no necesita la llave de
prueba: se borra al salir, como siempre.

## 6. Conexiones

Nada nuevo de `realtime`.

## 7. Pantallas

- **La entrada** (`screens/Entrance/`): con `useOfflineEntry`, `FingerButton` se prende sin conexión
  si se puede; el aviso nuevo (`OfflineFingerNotice`, en verde, desde la maqueta) reemplaza a
  «Para entrar hace falta internet». Sin conexión, el logo baja para que la pastilla no lo tape (ya
  está así). Al volver sin confirmar, el aviso de arriba `not-confirmed`, como el de sesión vencida.
- **Más** (`frame/screens/Phone/`): el renglón «Trabajar sin conexión» con su interruptor, en
  «Ajustes», desde `mockups/app-frame/final/`. El marco no conoce las reglas: `App.tsx` le pasa el
  renglón (qué dice, si está prendido y qué hace al tocarlo), como le pasa hoy `onSignOut`.
- Los textos, en `sign-in/texts.ts`.

## 8. Seguridad

- **Datos que toca:** las horas del celular de cada entrada sin conexión, la llave de prueba de cada
  una y la auditoría. En el celular, el nombre y el rol de la persona, que ya se guardaban.
- **Quién puede:** entrar sin conexión, solo la cuenta de la huella de ese celular, activa y con
  el permiso en el último contacto con sesión; confirmarlo, el servidor, con la misma huella.
- **Qué entra de afuera:** la confirmación, validada como dice § 4. Las horas del celular solo se
  guardan; el servidor solo mira que la firma no tenga más de 29 días ni esté más de un día en el
  futuro según su reloj.
- **Lo guardado en el celular:** lo pendiente tiene la firma de la huella, pero sin la llave de
  prueba (que no se puede copiar) no abre ninguna sesión: quien lo copie solo puede hacer que se
  anote como terminado.
- **Lo que no filtra:** sin sesión, el servidor no dice nada de la huella de un celular.
- **Lo que se acepta, por la regla de Carlos («el sistema no frena, revisa»):**
  - Sin conexión, la pantalla se fía del lector del celular. Quien toque el código del celular (con
    la depuración del navegador o un celular modificado) entra al marco sin conexión, pero sin una
    firma válida de la huella el servidor no confirma nada: la sesión no se abre y, desde la etapa
    b, lo que haya hecho va a anomalías.
  - Android acepta el PIN o el patrón del celular en lugar de la huella. Es así también con
    conexión (diseño de 01, § 13).
  - Un celular robado entra sin conexión hasta 24 horas desde su último contacto con sesión, y lo
    que mande después no se confirma. Si se da de baja la cuenta o se quita la huella, tampoco.
  - El reloj: atrasarlo más de 5 minutos por debajo de la hora más alta que vio la aplicación no deja
    entrar y corta la sesión sin conexión; dentro de ese margen sí, pero el servidor mide el plazo
    con la llegada, no con el reloj.
- **Secretos:** ninguno nuevo.
- **Auditoría:** § 9.

## 9. Eventos y auditoría

| Evento | Cuándo |
|---|---|
| `sign-in.offline-confirmed` | Se confirmó una entrada sin conexión: con la hora del celular, la de llegada y el último contacto que usó el servidor; si abrió sesión o ya había terminado |
| `sign-in.offline-rejected` | No se confirmó: con el motivo. Las que no prueban nada (firma mala, huella que no existe), con la regla de una fila por ventana |
| `sign-in.offline-repeated` | Llegó otra vez una entrada ya confirmada |

## 10. Metas de performance

- `/api/start` y las respuestas de entrar: sin sesión, nada nuevo; con sesión y desde un celular,
  una consulta por índice la primera vez (después, de la memoria) y unos 15 bytes.
- `POST /api/sign-in/offline`: como mucho 9 consultas, todas por índice (la fila, la huella, su
  último uso, la persona por la fachada, los últimos usos por tandas, la última sesión, la fila
  nueva, la sesión y su id en la fila); la prueba las cuenta. Menos de 20 ms sin contar la firma. Unos 1,5 KB de ida y 300 bytes de vuelta, **una vez** por entrada sin conexión.
- Entrar sin conexión: lo que tarde el lector de la huella.
- El esqueleto de la aplicación, unos 3 KB más, dentro del tope de 60 KB.

## 11. Pruebas

| Escenarios | Prueba |
|---|---|
| E01 a E05 | Unitarias del renglón de Más y de lo guardado; el servidor con `offline` en la persona |
| E06, E08, E09, E12, E14 | Unitarias de `useOfflineEntry` con el reloj falso; captura de la entrada sin conexión (`tests/screens/`) |
| E07, E11, E15 | De punta a punta (`tests/e2e/offline.spec.ts`), con el autenticador virtual de Chrome y la red cortada: vincular, prender la opción, salir, entrar con la huella y confirmarse al volver la red |
| E13, E21 | Unitarias de la entrada sin conexión y de salir de ella |
| E10, E16, E17 | Unitarias de `sendPending` y de la ruta |
| E18 a E20 | La ruta del servidor, con firmas de verdad hechas en la prueba: repetida, de otra huella, con un dato cambiado, de otra cuenta |
| Seguridad | El plazo no se mueve con `/api/start` sin sesión ni con la sesión de otra cuenta (revisión de seguridad, 1 y 10); sin sesión no sale nada de la huella (2); el límite por cuenta (3); la firma mala no deja fila (4); copiar la entrada no abre la sesión (8); a los 31 días no se repite (9); repetir no llena ni falsea la auditoría (11); dos confirmaciones a la vez abren una sola (12) |
| Pantallas | Capturas de la entrada sin conexión con la huella, de «No se pudo confirmar» encima del marco (también al recargar) y del renglón de Más (`tests/screens/`) |

## 12. Tareas

1. La página de prueba de la huella sin internet (§ 2), y que Carlos la pruebe en su celular.
2. El servidor: la tabla y el índice, `canWorkOffline`, `offline` en la persona, la ruta de
   confirmación con sus límites y rechazos, y la auditoría.
3. `[P]` La aplicación, sin pantallas: lo guardado, el desafío compartido, `useOfflineEntry`,
   `sendPending` con su reintento, salir de una sesión sin conexión.
4. Las pantallas: la entrada sin conexión y el renglón de Más.
5. Las pruebas de punta a punta y `what-needs-internet.md`.
6. Las revisiones del código y de seguridad (paso 7).
