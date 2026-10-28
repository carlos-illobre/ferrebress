# Diseño técnico · 15 · Sin conexión (`offline`), etapa a: entrar sin conexión

Implementa la etapa a del [capítulo 15](../../chapters/15-offline/rules.md): entrar con la huella
del celular sin conexión, y que el servidor lo confirme al volver la conexión. La etapa b
(trabajar sin conexión) tiene su propio diseño cuando le toque.

**Dónde vive el código.** Entrar sin conexión crea sesiones y usa las huellas de `sign-in`, así que
vive dentro de ese módulo, en su carpeta por concepto: `src/server/modules/sign-in/offline/` y
`src/app/modules/sign-in/offline/`. El módulo `offline` propio (la cola de lo hecho sin conexión)
nace con la etapa b. Todo lo que no se cambia acá sigue como dice el
[diseño de 01](sign-in.md).

## 1. Qué resuelve

Las reglas R1 a R3 del capítulo 15 y sus escenarios E01 a E21. Toca además 01 · R2.8 (la excepción
a «sin conexión no se entra»).

**La idea técnica:** sin conexión, el celular hace con la huella lo mismo que hace con conexión
(`navigator.credentials.get()`), pero con un desafío que arma él, que ata la firma a esa entrada.
Él mismo la verifica con la llave pública de la huella, que le dio el servidor en el último
contacto. Esa verificación es solo para la pantalla: cualquiera que toque el código del celular la
puede saltar. **La que vale es la del servidor**, al volver la conexión, con la misma firma.

## 2. Lo primero: probar que la huella anda sin internet

Las huellas de Android viven en el Administrador de contraseñas de Google, que las sincroniza entre
dispositivos. La firma la hace el celular, así que debería andar sin internet, pero no está
documentado. **La tarea 1 es una página de prueba** que Carlos abre en su celular, con la huella
ya vinculada, en modo avión: llama a `navigator.credentials.get()` con un desafío local y muestra
si firmó. Si no anda, se para acá y se vuelve al paso 1 con Carlos.

## 3. Entidades

### `sign_in.offline_sign_ins` (nueva)

Cada entrada sin conexión que llegó al servidor, confirmada o no.

| Columna | Tipo | Para qué |
|---|---|---|
| `id` | `uuid` PK | El identificador que creó el celular al entrar (UUID v7). Que sea la clave impide usar la misma firma dos veces (E18) |
| `user_id` | `uuid` | Quién dice ser |
| `device_id` | `uuid` | El celular |
| `credential_id` | `text` | La huella con que firmó |
| `signed_at` | `timestamptz` | La hora del celular cuando puso la huella (no confirmada) |
| `last_contact_at` | `timestamptz` | El último contacto que dice el celular (no confirmado) |
| `received_at` | `timestamptz` | La hora del servidor cuando llegó |
| `result` | enum | `confirmed` o `rejected` |
| `reason` | enum | Si se rechazó: `bad-signature`, `unknown-credential`, `deactivated`, `not-allowed`, `revoked-session`, `too-late`, `too-old` |
| `session_id` | `uuid` | La sesión que se abrió, si se confirmó |

Índices: el de la clave, y sobre `user_id` para la auditoría. Las filas se borran a los 30 días;
por eso el servidor rechaza una firma de más de 30 días (`too-old`), así nunca se acepta una firma
cuya fila ya se borró.

No cambia ninguna otra tabla. **El permiso** «Trabajar sin conexión» no tiene columna: hasta el
módulo 02 lo tienen todos los Administradores, que son todos (`users.users.active`). La regla está
una sola vez, en `canWorkOffline(user)` de `sign-in/offline/rules.ts`; el módulo 02 la cambia por
el permiso de su rol.

## 4. API

### `GET /api/start`, un campo más

Si `X-Device-Id` tiene una huella vinculada sin quitar, la respuesta suma:

```json
"offline": { "allowed": true, "userId": "…", "credentialId": "…", "publicKey": { "kty": "EC", … } }
```

- `allowed`: la cuenta de esa huella está activa, tiene el permiso, y la última sesión de ese
  celular no la cerró otro dispositivo. Si no, `{ "allowed": false }` y nada más.
- `publicKey`: la llave pública de la huella como JWK (la base la guarda en COSE; se convierte al
  responder). Solo ES256 (`-7`) y RS256 (`-257`), las que acepta la huella al vincularla. Con ella
  el celular verifica sin conexión. No es secreta.
- **Por qué en `/api/start`:** es el pedido que ya se hace al abrir y después de salir, así que
  confirma la cuenta también sin sesión (después de «Salir»), sin un pedido nuevo. Agrega unos
  250 bytes. Una consulta más, por índice (`sign_in.passkeys` por `device_id`, con su persona y su
  última sesión).
- Quien mande el identificador de otro celular solo sabe si su huella sigue sirviendo; el
  identificador es un UUID al azar que no sale del celular.

### `POST /api/sign-in/offline` (nueva)

Confirma una entrada sin conexión. Sin sesión; lleva la huella. La manda la aplicación sola, con
el primer pedido al volver la conexión (después de una salida pendiente, si hay).

Recibe (contrato `OfflineSignIn`, como mucho 8 KB):

| Campo | Qué |
|---|---|
| `id` | El de la entrada (UUID v7) |
| `userId`, `credentialId` | Quién y con qué huella |
| `signedAt`, `lastContactAt` | Las horas del celular (ISO 8601) |
| `response` | La respuesta de `navigator.credentials.get()` (`authenticatorData`, `clientDataJSON`, `signature`) |
| `proofPublicKey` | La pública de la llave de prueba nueva (diseño de 01, § 6) |

El servidor, en orden, y se queda en el primero que falla:

1. El contrato y `Origin` (como todo `POST`, diseño de 01, § 4).
2. El límite de la huella: 20 por minuto, por dirección y por dispositivo.
3. Que `id` no exista en `offline_sign_ins` (E18). Si existe, rechaza sin escribir nada.
4. **El desafío:** lo recalcula como `base64url(SHA-256(JSON canónico de { id, userId, deviceId,
   credentialId, signedAt, lastContactAt }))`, con `deviceId` de `X-Device-Id`, y lo compara con el
   de `clientDataJSON`. Así ningún dato se puede cambiar después de firmar (E19).
5. La huella: existe, no está quitada, es de `userId` y de ese `device_id` (E20). Verifica con
   `@simplewebauthn/server` la firma, el origen, el `rpId`, el tipo `webauthn.get` y la marca de
   verificación (UV), con el contador como al entrar con conexión.
6. La cuenta: activa (si no, `not-authorized`, E16) y `canWorkOffline` (si no, `not-allowed`).
7. Que la última sesión de ese celular no la haya cerrado otro dispositivo (`revoked-session`).
8. Las horas, con el reloj del servidor: `signedAt` no puede estar más de 5 minutos en el futuro,
   ni tener más de 30 días (`too-old`). `signedAt` tiene que caer dentro de las 24 horas siguientes
   al último contacto real de ese celular, que el servidor sabe: el último uso de sus sesiones o la
   última vez que pidió `/api/start` con esa huella, lo que sea más nuevo (`too-late`). Se da 5
   minutos de margen por el reloj del celular.
9. Si todo pasa: crea la sesión (diseño de 01, § 6) **con la hora del servidor**, pone la cookie y
   devuelve la persona, como `POST /api/sign-in/passkey`. Guarda la fila como `confirmed`.

Si algo falla en 4 a 8, guarda la fila como `rejected` con su motivo y responde
`offline-not-confirmed` (o `not-authorized` si la cuenta está dada de baja), sin decir cuál fue.

**El último contacto de cada celular** (paso 8): `/api/start` con una huella vinculada anota en
memoria «este celular habló ahora» y lo escribe por tandas en `sign_in.passkeys.last_used_at`, como
el último uso de las sesiones. No hace falta columna nueva.

## 5. Los flujos

### Prender la opción (R1)

- La opción está en Más, solo en el celular, solo si `start.offline.allowed` y la aplicación tiene
  anotado que este celular tiene la huella vinculada (`hasPasskey()`, el de hoy). Si no, no aparece
  (R1.3, E02, E03, E04).
- Prenderla guarda en el dispositivo el **permiso de entrar sin conexión**: `{ userId, name, role,
  credentialId, publicKey, lastContactAt }`, con `lastContactAt` la hora del celular en ese
  momento. Apagarla lo borra.

### Cada contacto

- Cada respuesta de `/api/start` con `offline.allowed` actualiza en lo guardado `publicKey` y
  `lastContactAt`. Cada pedido con sesión que el servidor acepta también actualiza `lastContactAt`
  (la sesión solo vale si la cuenta sigue activa).
- `offline.allowed: false`, `not-authorized` o `session-closed` con motivo `revoked` o
  `deactivated` **borran** el permiso guardado: la opción se apaga (R1.5, E05).

### Entrar sin conexión (R2)

- La entrada, sin conexión, mira lo guardado: hay permiso, `Date.now()` no es menor que
  `lastContactAt` (R2.3, E09) y faltan menos de 24 horas para cumplir `lastContactAt + 24 h`
  (R2.2, E08). Si se cumple, la huella queda prendida y el aviso dice hasta cuándo (R2.1, E06);
  si no, todo apagado (R2.4).
- Al tocar la huella:
  1. Crea `id` (UUID v7) y toma `signedAt = ahora`.
  2. Arma el desafío como en § 4, paso 4, y llama a `navigator.credentials.get()` con
     `allowCredentials: [credentialId]` y `userVerification: "required"`.
  3. Verifica con WebCrypto, con la llave guardada: el desafío, el origen, el `rpIdHash`, la marca
     UV y la firma (ECDSA P-256 con SHA-256, pasando la firma de DER a `r‖s`, o RSASSA-PKCS1-v1_5).
     Si falla o se cancela, no entra (E13).
  4. Crea la llave de prueba nueva (diseño de 01, § 6) y guarda la **entrada pendiente de
     confirmar**: `{ id, userId, credentialId, signedAt, lastContactAt, response, proofPublicKey }`.
  5. Pasa directo al marco, sin «Entrando» (R2.6, E07), con la persona guardada.
- La sesión sin conexión se corta a `lastContactAt + 24 h` (R2.7, E14): un temporizador en la
  aplicación muestra la entrada encima, sin borrar nada.

### Al volver la conexión (R3)

- En `recheck` (`App.tsx`, el que ya corre al volver la red), después de la salida pendiente y
  antes de cualquier otro pedido, si hay una entrada pendiente de confirmar, manda
  `POST /api/sign-in/offline`. Si la red todavía no anda, queda para el próximo intento
  (`useReconnect`, que ya existe).
- **Confirmada** (E15): se borra lo pendiente, la cookie ya quedó puesta y todo sigue.
- **No confirmada** (E16, E17): se borra lo pendiente y aparece la entrada encima con «No se pudo
  confirmar tu entrada sin conexión» (o el de no autorizada), sin borrar lo que había (R3.2).
- Salir sin conexión de una sesión sin conexión: la salida pendiente no tiene sesión que cerrar, así
  que solo se borra la entrada pendiente; queda en la auditoría como una entrada sin conexión que
  nunca se confirmó.

## 6. Conexiones

Nada nuevo de `realtime`.

## 7. Sin conexión

Es lo que resuelve este diseño. Lo guardado en el dispositivo:

| Qué | Dónde | Se borra |
|---|---|---|
| El permiso de entrar sin conexión (sin secretos: la llave es pública) | `platform/device/storage` | Al apagar la opción, o cuando el servidor dice que ya no (§ 5) |
| La entrada pendiente de confirmar (la firma no sirve para otra cosa: está atada a su `id`) | `platform/device/storage` | Al confirmarse o rechazarse |
| La llave de prueba | IndexedDB, no exportable (diseño de 01, § 6) | Al salir |

## 8. Pantallas

- **La entrada** (`screens/Entrance/`): `offline/useOfflineEntry.ts` dice si se puede entrar sin
  conexión y hasta cuándo. `FingerButton` se prende sin conexión si se puede; el aviso nuevo
  (`OfflineFingerNotice`, en verde) reemplaza a «Para entrar hace falta internet». La pastilla
  «Sin conexión» y el logo, como en la maqueta. Al volver sin confirmar, el aviso de arriba
  `not-confirmed`, como el de sesión vencida.
- **Más** (`frame/screens/Phone/`): el renglón «Trabajar sin conexión» con su interruptor, en
  «Ajustes», desde `mockups/app-frame/final/`. El marco no conoce las reglas: `sign-in` le registra
  el renglón con un registro como `registerWork` (`registerSetting`), así el marco no importa nada
  de `sign-in`.
- Los textos, en `sign-in/texts.ts`.

## 9. Seguridad

- **Datos que toca:** la llave pública de la huella (ya existía), las horas del celular de cada
  entrada sin conexión y la auditoría. En el celular, el nombre y el rol de la persona, que ya se
  guardaban.
- **Quién puede:** entrar sin conexión, solo la cuenta de la huella de ese celular, activa y con
  el permiso en el último contacto; confirmarlo, el servidor, con la misma huella.
- **Qué entra de afuera:** la confirmación, validada como dice § 4. Todo lo que dice el celular
  (las horas, quién es) se toma como no confirmado y se contrasta con lo que sabe el servidor.
- **Lo que se acepta, por la regla de Carlos («el sistema no frena, revisa»):**
  - Sin conexión, la verificación del celular se puede saltar tocando su código (con la
    depuración del navegador o un celular modificado). Quien lo haga entra al marco sin
    conexión, pero sin una firma válida de la huella el servidor no confirma nada: la sesión no
    se abre y, desde la etapa b, lo que haya hecho va a anomalías.
  - Android acepta el PIN o el patrón del celular en lugar de la huella. Es así también con
    conexión (diseño de 01, § 13).
  - Un celular robado entra sin conexión hasta 24 horas desde su último contacto. Al darse de baja
    la cuenta (o quitarse la huella), lo que llegue de él no se confirma.
  - El reloj: atrasarlo no sirve (R2.3); adelantarlo solo acorta el plazo. El servidor revisa las
    horas con las suyas (§ 4, paso 8).
- **Secretos:** ninguno nuevo. La firma de la huella no sirve para otra entrada (está atada a su
  `id`, que se usa una vez).
- **Auditoría:** § 10.

## 10. Eventos y auditoría

| Evento | Cuándo |
|---|---|
| `sign-in.offline-confirmed` | El servidor confirmó una entrada sin conexión: con la hora del celular y la del servidor |
| `sign-in.offline-rejected` | No la confirmó: con el motivo de la tabla |

Una entrada sin conexión que nunca llega al servidor (el celular se rompe) no deja nada: no hay
nada que confirmar.

## 11. Metas de performance

- `/api/start` con huella vinculada: una consulta más, por índice, menos de 2 ms; unos 250 bytes
  más.
- `POST /api/sign-in/offline`: tres consultas (la fila, la huella con su persona y su última sesión)
  y dos escrituras en una transacción (la fila y la sesión); menos de 20 ms sin contar la firma.
  Unos 1,5 KB de ida y 300 bytes de vuelta, **una vez** por entrada sin conexión.
- Entrar sin conexión: lo que tarde el lector de la huella; la verificación local, menos de 10 ms.
- Ningún pedido automático nuevo, salvo la confirmación, que se anota en
  [mobile-data.md](../mobile-data.md).

## 12. Pruebas

- **Unitarias:** el desafío (los mismos datos dan el mismo; cualquier cambio, otro), la
  verificación local (firmas buenas y malas de ES256 y RS256, DER a `r‖s`, origen, `rpIdHash`, UV),
  las horas (E08, E09, el corte de E14), lo guardado y cuándo se borra (E05), y la ruta del servidor
  con cada rechazo de § 4 (E16 a E20), con firmas de verdad hechas en la prueba.
- **De la entrada, en un navegador de verdad** (`tests/screens/`): la huella prendida sin conexión
  y el aviso (captura `entrance-phone-offline-finger.png`); «No se pudo confirmar».
- **De punta a punta** (`tests/e2e/`): con el autenticador virtual de Chrome, vincular, prender la
  opción, cortar la red, entrar con la huella, volver la red y quedar con la sesión confirmada; y
  la cuenta dada de baja mientras tanto (E16).

## 13. Tareas

1. La página de prueba de la huella sin internet (§ 2), y que Carlos la pruebe en su celular.
2. El servidor: la tabla, `canWorkOffline`, el campo de `/api/start` y el último contacto, la
   ruta de confirmación con sus rechazos y la auditoría.
3. `[P]` La aplicación, sin pantallas: lo guardado, el desafío, la verificación local, la entrada
   pendiente y su confirmación en `recheck`.
4. Las pantallas: la entrada sin conexión y el renglón de Más.
5. Las pruebas de punta a punta, `mobile-data.md` y `what-needs-internet.md`.
6. Las revisiones del código y de seguridad (paso 7).
