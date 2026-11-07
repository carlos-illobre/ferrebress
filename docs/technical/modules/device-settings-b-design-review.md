# Revisión del diseño · 04 · Configuración del dispositivo, etapa b (lo mío)

Revisa [device-settings-b.md](device-settings-b.md) contra la constitución, el
[capítulo 04](../../chapters/04-device-settings/rules.md) (R1.8, R6 a R10, E10, E40 a E57), lo que
tocó en 01 · R2.5 y R7.1, 02 · R5 y E22, 03 · R4.2 y 05 · R2.6, la maqueta aprobada
[`device-settings-b/final/`](../../design/mockups/device-settings-b/final/), la
[arquitectura](../architecture.md), el diseño de 02 ([users.md](users.md), § 4 y § 9), el de 01
([sign-in.md](sign-in.md)) y el código de hoy de `src/server/modules/sign-in`,
`src/server/modules/device-link`, `src/server/platform` y `src/app/modules/{users,device-settings,sign-in}`.

Gravedad: **Frena** = hay que resolverlo (o que Carlos lo decida) antes de aprobar el diseño;
**Mejora** = conviene, pero no frena.

Resumen: la idea de fondo está bien (lo mío ya existe en `sign-in`, se reusa la lógica de Usuarios
cambiando de quién y sin permiso, y el nombre vive en `sign-in`). Frenan nueve puntos: vincular la huella
desde Configuración no anda con las rutas de hoy (E43), el aviso de nombre repetido no es el de la
maqueta, hay un pedido automático sin anotar, la limpieza de nombres no se puede calcular, R9.4 queda
cubierto a medias, quitar la huella del celular propio está subespecificado, el cuerpo de cortar
(y con él la auditoría) es ambiguo, la tarjeta propia de Usuarios no dice qué hace con el celular en la
mano, y dos teclas chocan.

---

## 1. Escenarios sin cubrir

### 1.1 E43 · «Vincular este celular con mi huella» no anda con las rutas que hay — **Frena**

- **Dónde:** § 3, «Vincular este celular con mi huella (R6.3) usa las rutas de vincular que ya
  existen: no hay ruta nueva»; § 10, E43.
- **Qué propone:** llamar a `POST /api/passkeys/options` y `POST /api/passkeys` tal como están.
- **Qué veo:** `cannotLink` (`sign-in/passkeys/webauthn.ts`) rechaza con `403 not-authorized` si la
  sesión no pasó por Google en los últimos 5 minutos (`linkPasskeyWithinMs`). El diseño de 01 ya lo
  había previsto: «desde Configuración, en el módulo 04, se vuelve a pasar por Google»
  ([sign-in.md](sign-in.md), «Vincular»). En la práctica, quien abre Configuración un rato después de
  entrar recibe un 403 y E43 no se cumple. Lo que existe para resolverlo es la confirmación de 02 · R3.8
  (`POST /api/session/confirm/google`, que actualiza `google_at`, y `loadConfirmSheet` en la
  aplicación), pero el diseño no lo nombra. Además, la maqueta aprobada no tiene ese paso: tocar
  «Vincular» pide la huella directamente (`pedirHuella()`).
- **Qué hace falta:** que el diseño diga cómo se cumple E43. Una opción es pasar por la hoja de
  confirmar con Google (si pasaron más de 5 minutos) y después vincular. La otra es aceptar como prueba
  la sesión abierta en ese celular, sin Google, lo que cambia una regla de seguridad de 01. Cualquiera de
  las dos cambia lo que ve la persona y lo tiene que ver Carlos, porque la maqueta no tiene ese paso.

### 1.2 E54 · El aviso de nombre repetido es otro que el de la maqueta — **Frena**

- **Dónde:** § 3, `POST /api/me/device-name` «Devuelve `{ name, repeated }`»; § 7, «si se repite, el
  aviso».
- **Qué propone:** que el servidor diga si se repite después de guardar.
- **Qué veo:** en la maqueta aprobada el aviso ámbar sale **mientras se escribe**: `contar()` llama a
  `repetido(v)` en cada letra, con la lista de nombres de los otros dispositivos (`DE_OTROS`). Como manda
  la maqueta (constitución, I), el diseño tiene que darle a la aplicación esa lista: por ejemplo,
  `otherNames: string[]` en `GET /api/me/devices` (unas decenas de nombres sacados del `Map`, sin
  consultas) y la comparación como regla compartida (punto 4.2). Devolver `repeated` al guardar puede
  quedar como respaldo, pero no alcanza.

### 1.3 R9.4 · «En todos lados donde se nombra un dispositivo» queda cubierto a medias — **Frena**

- **Dónde:** § 3 (Usuarios), § 4, § 5, § 6.
- **Qué propone:** el nombre en `/api/start`, en la auditoría, en lo mío y, en el vínculo, actualizando la
  etiqueta guardada cuando llega `device.renamed`. Para Usuarios, solo «el nombre en el acceso» en las
  pruebas (§ 10).
- **Qué veo:**
  - **Usuarios:** el diseño no dice que `GET /api/users/:id/access` y **`GET /api/lost-phones`**
    (`access/lost.ts`, que hoy devuelve `deviceLabel`) sumen el nombre. Tampoco dice que la tarjeta y la
    hoja «Se perdió un celular» lo muestren (hoy `Access.tsx` y `Lost.tsx` usan `deviceLabel`, y también
    las tostadas `doneTexts.sessionClosed(session.deviceLabel)`). § 5 incluso dice que «la tarjeta de
    Usuarios no cambia cómo se ve». E52 pide el nombre «en las sesiones».
  - **El vínculo, al vincular:** la etiqueta se guarda al crear el vínculo con `session.deviceLabel`
    (`device-link/routes/codes.ts`, `topics.ts` en `ctx.computers`, y `phoneLabel` y `computerLabel` de
    `sign-in.phone-approved`). Un dispositivo que ya tenía nombre y se vincula después queda con
    «Chrome en Windows». El diseño solo cubre el cambio de nombre posterior.
  - **El vínculo, al borrar el nombre:** si `device.renamed` pisa `phone_label` o `computer_label` con el
    nombre, al borrarlo ya no se sabe a qué etiqueta volver (E55), salvo que el evento lleve la etiqueta
    del navegador. El diseño no lo dice. Ver la alternativa del punto 3.2.
  - **La pregunta del celular «¿Entrar en Chrome en Windows?»** (01 · R2.5) nombra un dispositivo. El
    diseño no dice si muestra el nombre. Si lo muestra, sale del identificador que manda la computadora
    sin sesión (ver 5.7). Hay que decidirlo y escribirlo.

### 1.4 E42 · Quitar la huella del celular en la mano: «borra la huella y nada más» no alcanza — **Frena**

- **Dónde:** § 3, `POST /api/me/passkey/remove`, «borra la huella y nada más», 2 consultas.
- **Qué veo:**
  - **La memoria del servidor:** sin `ctx.phoneOwners.delete(deviceId)` y `ctx.people.forget([userId])`
    (lo que hace `cut` hoy), `/api/start` sigue devolviendo `offline: true` con la sesión en memoria, y
    E42 («se le apaga Trabajar sin conexión») no se cumple. Además, una entrada sin conexión hecha
    después no se tiene que confirmar (15 · R3.2).
  - **El vínculo:** 03 · R2.3 dice que el vínculo termina cuando «se le quita la huella al celular»
    (02 · R5.6), y 04 · R6.2 dice que quitar la del celular en la mano «no cierra la sesión ni nada más».
    Las reglas no dicen si este caso termina el vínculo. Según se publique `passkey.removed` o no,
    `device-link` lo termina o no. Hay que preguntárselo a Carlos y escribirlo.
  - **La aplicación:** después de quitarla tiene que apagar la opción guardada (`disableOffline()`) y
    olvidar la marca local de huella (`hasPasskey()`). Si no, la entrada sigue ofreciendo «Ingresar con
    huella» y Configuración muestra «tiene la huella de otra persona» en lugar de «Vincular» (E43). El
    diseño no lo dice.
  - **Las computadoras que ese celular hizo entrar** siguen abiertas (está bien, por R6.2), pero su
    `approved_by` queda apuntando a una huella borrada: si después se vincula de nuevo y se pierde,
    «Se me perdió» ya no las corta. Conviene decirlo, aunque sea como límite aceptado.
  - El conteo de consultas tiene que sumar las del oyente del vínculo, si se publica el evento.

### 1.5 E41, E49, E51 · El cuerpo de cortar y el tipo en la auditoría — **Frena** (es chico)

- **Dónde:** § 3, `POST /api/me/devices/:deviceKey/cut` (sin cuerpo); § 4, «con `from: 'settings'`».
- **Qué veo:** la ruta de Usuarios usa `{ from: 'card' | 'lost' }` para elegir entre `passkey.removed` y
  `phone.cut`, y la causa del evento (`removed` o `cut`, que el vínculo anota como `passkey-removed` o
  `phone-cut`). En Configuración también hay dos gestos: la × de la huella de otro celular («Quitaste la
  huella de…») y «Se me perdió» («Cortaste…»). El diseño no dice cómo los distingue la ruta, y
  `from: 'settings'` parece usar el mismo nombre de campo para otra cosa. Hay que definir el cuerpo (por
  ejemplo `{ from: 'card' | 'lost' }`, como en Usuarios) y, aparte, en qué campo de la auditoría va que
  se hizo desde Configuración, y si Quién hizo qué lo muestra.

### 1.6 E46 · La tarjeta propia de Usuarios y el celular en la mano — **Frena** (es una decisión)

- **Dónde:** § 3, «En la tarjeta propia ya no se sacan los celulares propios (02 · R5.5, E22): un
  parámetro menos».
- **Qué veo:** al mostrar los celulares propios en la tarjeta de Usuarios, aparece también el que se
  tiene en la mano. Hoy `cut` lo rechaza con `409 self`. En Configuración, en cambio, quitarle la huella
  se puede (R6.2). La regla dice «hace lo mismo en los dos lugares» (04 · R6). El diseño no dice si en la
  tarjeta propia ese celular figura, si lleva «Quitar» y qué hace. Tampoco dice si ahí lleva «Este».

### 1.7 Las teclas que faltan y las que chocan — **Frena** (es chico)

- **Dónde:** § 7, «Teclado: las teclas de la final (Alt O, L, B y 1 a 3)».
- **Qué veo:** la final usa **Alt D** para «Ponele nombre» y «Cambiar el nombre», y **Alt T** para
  «Cerrar todas». El diseño no las nombra, y las dos chocan: en la etapa a, Alt D ya es «Animaciones»
  (`Rows.tsx`, `data-key="d"`, que se eligió porque Alt A era «Anomalías»), y Alt T es «Administración»
  en el menú (`frame/menu.ts`). Hay que elegir dos letras libres y decirlo, como hizo la etapa a (§ 9.5).
  Las ideas de nombre de Alt 1 a 3 tampoco dicen de dónde salen (en la maqueta son tres textos fijos por
  tipo de dispositivo; irían en `texts.ts`).

### 1.8 R1.8 · Cómo se agrupa por dispositivo no está escrito — **Mejora** (importante)

- **Dónde:** § 1, «ya sabe qué sesión y qué huella son del mismo dispositivo»; § 3, `GET /api/me/devices`.
- **Qué veo:** la regla de agrupar es lo más delicado de la etapa y el diseño no la escribe. Lo que
  muestra el código es esto:
  1. una sesión va con la huella que tiene su mismo `device_id`, o con la huella de su `passkey_id`,
     aunque el `device_id` sea otro (un celular que borró sus datos);
  2. una sesión con `approved_by` cuelga del celular de esa huella;
  3. si esa huella ya no existe, la sesión va suelta (como `raices()` de la maqueta);
  4. qué pasa con dos sesiones abiertas en el mismo dispositivo;
  5. que la sesión del pedido no figura, pero sí las computadoras que ese celular hizo entrar.

  Conviene escribirlo como regla pura, en un archivo de reglas con sus casos (ver 3.4), y darle una
  prueba a cada caso. Lo mismo para lo que corta cada gesto (`loQueCorta` de la maqueta), que pinta el rojo
  antes de cortar y arma el recibo después.

### 1.9 E57 y R10 · Ver 2.4 (el pedido al volver la conexión).

### Los demás escenarios

- **E10, E40, E45, E47, E50:** cubiertos por `GET /api/me/devices` y la pantalla.
- **E48:** cubierto (`/api/me/sessions/...`).
- **E44:** cubierto, con la huella `other`.
- **E52, E53, E55, E56:** cubiertos en lo que toca al servidor, salvo lo de 1.3 y 5.1.

---

## 2. Performance

### 2.1 Los números de `GET /api/me/devices` no coinciden con el propio diseño — **Mejora**

- **Dónde:** § 3 («3: sesiones, huellas y nombres») y § 9 («3 consultas, todas por índice de la
  persona»).
- **Qué veo:** § 2 dice que los nombres están todos en un `Map` en memoria, así que «nombres» no es una
  consulta. Son 2: las sesiones abiertas (índice `sessions_user_id`) y las huellas (`passkeys_user_id`,
  migración 005). En cambio falta una que el diseño no cuenta: saber si la huella de **este** celular es
  `mine`, `other` o `none` busca por `device_id`, no por la persona. Sale de `ownerOf`, en memoria
  (`phoneOwners`), o es una consulta por el índice único `passkeys_one_account_per_phone` la primera vez.
  Queda en 2, y 3 sin memoria. Hay que corregir la tabla y la meta, y que la prueba cuente las dos cosas.

### 2.2 Cambiar el nombre: «3 consultas, en una transacción con la auditoría» — **Mejora**

- **Dónde:** § 3 y § 9.
- **Qué veo:**
  - Con el `Map`, el nombre anterior y si se repite salen de memoria: queda **una** escritura (el
    `insert … on conflict do update`, o el `delete` al borrar), más la del oyente de `device-link` en la
    misma transacción, si se queda con la etiqueta guardada (3.2).
  - La auditoría no entra en ninguna transacción: es SQLite, aparte, y se escribe después de confirmar
    (ADR-004, `events.transaction`).
  - Leer el anterior y el repetido de la base dentro de una transacción tampoco evitaría la carrera de dos
    cambios a la vez sin un bloqueo. Con un solo proceso y el `Map` al día después de confirmar, la
    carrera no cambia nada importante (gana el último). Conviene decirlo.

### 2.3 Faltan las pruebas que cuentan consultas — **Mejora**

- **Dónde:** § 10.
- **Qué veo:** la constitución (paso 6) pide pruebas «que cuentan las consultas de cada pedido», y el
  diseño de 02 las tiene (§ 10). La tabla de pruebas no las nombra. Cortar también tiene que contar las
  del oyente del vínculo (`forDevices` y `remove`), que hoy no están en el «3 a 4».

### 2.4 Un pedido automático sin anotar — **Frena**

- **Dónde:** § 6, «pide `/api/me/devices` al abrirse, al cambiar algo y **al volver la conexión**, como
  Usuarios», y en el mismo párrafo, «Ningún pedido automático nuevo: nada que anotar en mobile-data.md».
- **Qué veo:**
  - Las dos frases se contradicen. Pedirlo al volver la conexión es un pedido que la aplicación hace
    sola, y la constitución (III) pide anotarlo antes en [mobile-data.md](../mobile-data.md), con lo que
    pesa (unos 2 KB, según § 9), y que Carlos lo apruebe.
  - Además, «como Usuarios» no es cierto: el diseño de 02 (§ 8) dice que Usuarios, al volver la conexión,
    «se prende sola, con la lista que tenía, sin pedirla de nuevo».
  - Igual hace falta algo así: E57 abre Configuración **sin** conexión, así que no hay lista guardada, y
    «Lo tuyo» tiene que volver solo. Las dos salidas son anotar el pedido (y que Carlos lo apruebe) o
    pedirlo al volver la conexión solo si nunca llegó a cargarse.
  - **Con el espejo:** ir a Configuración se espeja (R1.6), así que el otro dispositivo abre la pantalla
    sin que nadie lo toque y, según el diseño, pide `/api/me/devices`. En el celular es otro pedido
    automático. Hay que anotarlo, o no pedirlo hasta que la persona toque algo en ese dispositivo.

### 2.5 Lo mío en el arranque — **Mejora**

- **Dónde:** § 9, «lo mío es parte de la pantalla de Configuración, que está en el arranque; suma unos
  6 KB».
- **Qué veo:** la etapa a puso Configuración en el arranque para que abra sin red. Lo mío, en cambio,
  **necesita** red (R10.1), así que puede bajarse con `import()` cuando hay conexión (constitución, XII.2:
  «cada módulo de la aplicación se baja recién cuando se abre»). En el arranque queda solo lo gris de
  «Sin conexión». Lo mismo vale para la lógica de acceso que se muda a `sign-in`, que hoy va entera en
  el arranque (ver 3.3). Los 6 KB no los pude comprobar.

### 2.6 Lo demás de performance

- **Temporizadores:** ninguno nuevo. Bien.
- **`/api/start`:** el nombre sale de memoria. Bien.
- **Índices:** alcanzan los que hay. La tabla nueva no necesita otro.
- **Metas sin número:** el «menos de 15 ms» y los 2 KB no tienen con qué medirse en las pruebas. Bastaría
  con que la prueba fije los 2 KB con unos 5 dispositivos y 100 personas en la base.

---

## 3. Simpleza

### 3.1 `sign_in.devices`: sobra `named_by` y `named_at` no sirve para lo que dice — **Frena** (por la limpieza)

- **Dónde:** § 2.
- **Qué propone:** `named_at` «para borrar los que nadie usa», `named_by` «para la auditoría», y una
  limpieza diaria que borra el nombre de un dispositivo «sin ninguna sesión ni huella desde hace
  `devices.forgetAfterDays` (365)».
- **Qué veo:**
  - **La limpieza no se puede calcular.** Las sesiones cerradas se borran a los 30 días
    (`closedRetentionMs`). Después de eso no queda ninguna fila que diga cuándo se usó el dispositivo por
    última vez. «Sin sesión ni huella» se vuelve, en los hechos, «sin uso en 30 días», o hace falta una
    columna `last_seen_at`. Esa columna se puede poner al día en la limpieza diaria, con una sola
    consulta en lote: `update … where device_id in (sesiones abiertas ∪ huellas)`. `named_at` (cuándo se
    puso el nombre) no sirve para eso.
  - **Es una regla nueva.** Que un nombre se borre solo a los 365 días, o a los 30, es algo que la
    persona ve y no está en R9. Se le pregunta a Carlos y se escribe en el capítulo, o se saca. Con unas
    decenas de filas, no borrar nunca también es una opción válida.
  - **`named_by` repite la auditoría** (constitución, V: la base guarda el presente; quién lo puso ya
    queda en `device.renamed`).

### 3.2 El vínculo: guardar la etiqueta con el nombre o leerlo al mostrar — **Mejora** (importante)

- **Dónde:** § 4 y § 6, «`device-link` (por `device.renamed`) actualiza la etiqueta guardada del vínculo».
- **Qué veo:** pisar `phone_label` o `computer_label` trae tres problemas: el vínculo creado después de
  ponerle nombre queda con la etiqueta del navegador (1.3), al borrar el nombre se pierde la etiqueta a
  la que volver, y suma una escritura por cambio.
- **Opciones:**
  - **(a)** `device-link` deja guardada la etiqueta del navegador y, al armar el estado (`rules.ts`,
    `other.label`), pide el nombre a la plataforma (`devices.nameOf(deviceId)`, el mismo proveedor que
    propone § 4 para la auditoría, en memoria, sin consultas). `device.renamed` queda solo para mandarle
    el nombre nuevo al otro dispositivo por su canal.
  - **(b)** Seguir con la etiqueta guardada, pero el evento lleva `{ deviceId, name | null, label }`, y
    vincular también toma el nombre.

  La (a) es más simple y cubre los tres casos. Además, el diseño no dice qué mensaje nuevo viaja por el
  canal del vínculo ni en qué contrato queda (`shared/contracts/device-link.ts` o `pairing.ts`).

### 3.3 La lógica de acceso de la aplicación en `sign-in/access/` — **Mejora**

- **Dónde:** § 5, «La lógica de acceso, una sola vez, en `src/app/modules/sign-in/access/` […] con un
  parámetro de a quién (`me` o una persona)».
- **Qué veo:**
  - Las dos respuestas tienen formas distintas: Usuarios recibe dos listas (`AccessResponse`: sesiones y
    celulares), y `/api/me/devices`, un árbol por dispositivo, con este dispositivo aparte.
  - Lo que hace hoy `users/actions.ts` está atado al estado de Usuarios: `users.recount`,
    `users.loadAccess`, `refused` y las tostadas de `doneTexts`. Configuración muestra un recibo, no una
    tostada.
  - Lo que de verdad se repite son las llamadas a la API y la forma de la respuesta, y eso ya está una
    sola vez en el contrato y en el servidor.
  - Mudarlo a `sign-in`, que va en el arranque, suma al arranque código que hoy se baja solo con Usuarios.
  - Si se comparte algo en la aplicación, que sea lo puro (lo que corta cada gesto, el texto del
    recibo), en un archivo sin estado. Las llamadas, en el `api.ts` de cada módulo (`device-settings/api.ts`
    para `/api/me`). Constitución, XII.3: se junta lo que se repite por la misma razón. Dos pantallas que
    llaman a rutas distintas no lo son.

### 3.4 Los nombres de `access/` y dónde queda la regla — **Mejora**

- **Dónde:** § 5, `access/` se parte en `listing.ts`, `cutting.ts`, `users-routes.ts` y `me-routes.ts`.
- **Qué veo:**
  - La arquitectura fija `routes.ts`, `rules.ts` y `data.ts`, y en plural, una carpeta (`routes/users.ts`,
    `routes/me.ts`). `listing` y `cutting` no dicen si son regla o tecnología.
  - Lo que se va a compartir (cerrar y cortar) mezcla transacción, memoria y auditoría, así que no es
    regla pura.
  - El agrupar por dispositivo (1.8) y lo que corta cada gesto sí lo son, y deberían ir en
    `access/rules.ts` (o `rules/devices.ts`), sin Kysely ni Hono, con sus pruebas.
  - Lo de orquestar puede quedar en `access/cut.ts` y `access/close.ts`, que llaman las dos rutas.

### 3.5 Bien resuelto

Reusar las mismas funciones de cortar y cerrar para Usuarios y para `/api/me`, y el `Map` de nombres
(unas decenas) en lugar de consultar en cada auditoría y en `/api/start`.

---

## 4. Repetición

### 4.1 Limpiar el nombre ya existe dos veces — **Mejora** (importante)

- **Dónde:** § 3, «`name` se recorta, no puede quedar con más de 30 letras (`400`), y no puede tener
  caracteres de control ni saltos de línea (`400`)»; § 5, `devices/rules.ts`.
- **Qué veo:**
  - `users/rules.ts` (`cleanName`) y `users/roles/rules.ts` (`cleanRoleText`) ya limpian un nombre con
    la misma idea: quitan `\p{Cc}` y `\p{Cf}`, juntan los espacios y cortan al largo. La de los roles
    además normaliza en NFC. El nombre del dispositivo sería la tercera versión, y con otra política:
    rechaza en lugar de limpiar, no dice nada de `\p{Cf}` (ver 5.1) ni de NFC.
  - Una sola función en `src/shared/` (por ejemplo `cleanText(text, max)`) la usarían las tres. La
    aplicación la usaría también para el contador «13/30».
  - **«Letras»** tiene que contarse igual en la aplicación y en el servidor: con `string.length`, un
    emoji cuenta 2, y el contador de la maqueta usa `v.length`. Conviene definirlo una vez (por puntos de
    código, `[...text].length`) en el mismo lugar.

### 4.2 «Se llama igual» — **Mejora**

- **Qué veo:** el diseño no dice cómo se compara. La maqueta compara sin distinguir mayúsculas y sin
  espacios a los costados, y los roles ya comparan sin distinguir mayúsculas (02 · R7.3). Una regla
  compartida (`sameName(a, b)`, en NFC y sin distinguir mayúsculas) en `src/shared/`, que use la
  aplicación mientras se escribe (1.2) y el servidor para `repeated`.

### 4.3 Lo demás de repetición

Cortar, cerrar y cerrar todas se reusan, bien. La lista de «Sin conexión» usa `ui/offline`, que
existe. Nada más.

---

## 5. Seguridad

### 5.1 El nombre puede traer caracteres que cambian la dirección del texto — **Frena**

- **Dónde:** § 3 y § 8, «sin caracteres de control».
- **Qué veo:**
  - «De control» suele leerse como `\p{Cc}`. Los que invierten la dirección del texto (U+202E y los
    aislantes U+2066 a U+2069) son `\p{Cf}`, y el diseño de 02 (§ 9) ya los excluye en los nombres de las
    personas.
  - El nombre del dispositivo lo ven otras personas, otros dispositivos, Quién hizo qué y la entrada sin
    sesión: con un U+202E, «Compu del mostrador» puede mostrarse como otra cosa.
  - Hay que excluir `\p{Cc}` y `\p{Cf}`, como en Usuarios, y normalizar en NFC (4.1).

### 5.2 La auditoría: de dónde sale el dispositivo para el nombre — **Mejora** (importante)

- **Dónde:** § 4, «`guards.ts` anota hoy `device: deviceCodes(…)`; suma `name`».
- **Qué veo:**
  - `recorder` arma `device` con las cabeceras del pedido, también sin sesión (los intentos de entrar,
    los rechazos).
  - Si el nombre sale del identificador de la cabecera (`X-Device-Id`), quien lo mande puede anotar sus
    rechazos «desde» el dispositivo que elija, si conoce su identificador. Es difícil, pero no hay por
    qué permitirlo.
  - Lo coherente con § 8 («para el nombre se usa el de la sesión») es tomar el nombre solo del
    `deviceId` de la sesión del pedido, y sin sesión no anotar ninguno.

### 5.3 `device.renamed`: a qué apunta en la auditoría — **Mejora** (importante)

- **Dónde:** § 4.
- **Qué veo:**
  - El diseño no dice `targets`, `changes`, grupo, color ni ícono, ni en qué archivo de
    `src/shared/audit-log/` queda.
  - Si el destino fuera `{ kind: 'device', id: device_id }`, el identificador del dispositivo saldría del
    servidor por Quién hizo qué, y el diseño de 02 (§ 9) dice que nunca sale.
  - Hay que definir el destino sin el `device_id` (o con uno opaco) y `changes: { name: { before, after } }`
    (R9.5, E56).
  - El texto «Le puso nombre a **este** dispositivo» se lee mal desde otro dispositivo: conviene «Le puso
    nombre a una computadora: Compu del mostrador».

### 5.4 Lo que entra por la dirección y los rechazos — **Mejora**

- **Dónde:** § 3 y § 8.
- **Qué veo:**
  - El diseño no dice que `:sessionId` y `:deviceKey` pasen por `uuidParams` (con otra forma, `404` sin
    llegar a la base), como las rutas de Usuarios.
  - Tampoco dice si los rechazos (`404`, `409 self`) se anotan una vez por minuto, como `users.rejected`
    en `refuse()`, ni con qué tipo, ahora que ya no son «de Usuarios».
  - Sin eso, `/api/me/...` sería la única entrada de cortes sin rastro de los intentos.

### 5.5 Límite de cambiar el nombre — **Mejora** (importante)

- **Dónde:** § 8, «con el límite de pedidos de siempre por dispositivo».
- **Qué veo:**
  - No hay un límite «de siempre» por dispositivo para cambios con sesión. Lo que hay es
    `accessChanges` (60 por minuto por sesión) y los de entrar.
  - Cada cambio de nombre escribe en la auditoría, se lo manda al otro dispositivo del vínculo y lo ven
    todos. 60 por minuto llenan Quién hizo qué.
  - Conviene un tope propio y chico, en el `settings.ts` de `sign-in` (por ejemplo 10 por minuto por
    sesión), con su comentario de por qué.

### 5.6 `POST /api/me/passkey/remove`: de quién es la huella — **Mejora** (importante)

- **Qué veo:**
  - El diseño no dice que se borre solo la huella con `device_id` = el de la sesión **y**
    `user_id` = el de la sesión.
  - Si el celular tiene la huella de otra persona (E44), quitarla desde la sesión de Beto no tiene que
    borrar la de Ana. La pantalla no ofrece el botón en ese caso, pero la ruta tiene que negarse igual
    (`404` o `409`).
  - Hace falta la prueba que lo intente.

### 5.7 El nombre en la pregunta del celular (01 · R2.5) — **Mejora**

- **Qué veo:** si se decide mostrar el nombre en «¿Entrar en …?» (1.3), sale del identificador que manda
  la computadora **sin sesión**. Una computadora ajena que conozca el identificador de «Compu del
  mostrador» podría hacerse pasar por ella ante el celular. La etiqueta de hoy sale de una lista cerrada
  justamente para que la computadora no elija el texto (revisión de seguridad de 01, punto 4). Si se usa
  el nombre, que el diseño lo diga y lo pese. Si no se usa, que lo diga también.

### 5.8 El código común — **Mejora** (de proceso)

- **Qué veo:** `devices.provide` en la plataforma y el cambio de `platform/guards.ts` tocan
  `src/server/platform/`, que es código común con dueño (constitución, «Trabajo en paralelo»). La etapa a
  lo dijo («Es código común: una tarea propia que se toma antes»); esta no. § 11 tiene que tener esa
  tarea aparte.

### 5.9 Lo que está bien, y una observación para el revisor de seguridad

- **Bien:** las rutas toman la persona de la sesión y nunca la reciben; el nombre se pone en el
  `deviceId` de la sesión y no en el de la cabecera; no hay secretos nuevos; mostrar el nombre en la
  entrada sin sesión no es un dato sensible.
- **Observación:** como la regla no pide permiso ni confirmación, quien tenga en la mano un celular
  perdido con la sesión abierta puede, desde Configuración, cerrar las otras sesiones de la dueña y
  cortar sus otros celulares antes que ella. Es la regla, no un error del diseño, pero que lo mire el
  revisor de seguridad.

---

## 6. Fronteras

- **El nombre del módulo:** las rutas de `/api/me` viven en `sign-in` y el contrato se llama
  `shared/contracts/device-settings.ts`. Choca con «un módulo tiene el mismo nombre en el capítulo, en el
  servidor y en la aplicación». Ya pasa lo mismo con las rutas de Usuarios en `sign-in`, que usan
  `contracts/users.ts`, y se justifica porque `sign-in` es dueño de los datos. Conviene decirlo en una
  línea. **Mejora.**
- **Ciclos:** no veo ninguno. `device-link` reacciona a `device.renamed` por evento. En la aplicación,
  `users` → `sign-in` y `device-settings` → `sign-in` van por la fachada, como ya pasa hoy. Con la
  opción (a) de 3.2, `device-link` lee el nombre de la plataforma y no conoce a `sign-in`.
- **Los documentos de los módulos cerrados:** la etapa cambia 01, 02, 03 y 05, pero no dice qué
  documentos actualizar: [users.md](users.md) § 4 («sin, en la propia, sus celulares») y § 9;
  [sign-in.md](sign-in.md) (la tabla nueva, `/api/start`, la limpieza, vincular desde Configuración); el
  diseño de 03 (de dónde sale la etiqueta); el de 05 (el nombre en desde dónde); la fila de 04 en
  [qué necesita internet](../../chapters/what-needs-internet.md), que hoy dice solo lo de las
  preferencias; y la sección «Escala» de la arquitectura (3 más abajo). Ningún cambio queda solo en el
  código (constitución, I). **Mejora** (importante).
- **Las reglas sin tecnología:** `devices/rules.ts` está bien separado. Ver 3.4 para `access/`.

---

## 7. Sin conexión, hora y escala

- **Sin conexión:** el módulo no atiende clientes ni proveedores. Lo mío necesita conexión por regla
  (R10.1), y las preferencias siguen sin red. Lo único es el pedido al volver la conexión (2.4).
- **Hora:** `named_at` y los últimos usos los pone el servidor, y la aplicación ya calcula «hace…» con el
  reloj del servidor (`platform/server/clock`). Bien.
- **Escala (100 personas, varias copias):** el `Map` de nombres vive en la memoria de cada proceso. Con
  dos copias, una no se entera del cambio de la otra (la entrada y la auditoría mostrarían el nombre
  viejo). Queda detrás de `devices.provide`, que es lo que pide la constitución (IX), pero hay que
  sumarlo a la lista de «Escala» de la arquitectura, junto a las sesiones y `phoneOwners`. Con 100
  personas, `GET /api/me/devices` sigue leyendo solo lo de una persona, y buscar el repetido recorre unas
  decenas de nombres en memoria: escala bien. **Mejora.**

---

## 8. Mejoras

1. **El recibo con lo que cortó de verdad.** Hoy `cut` devuelve
   `{ sessions: número, passkey: boolean }`, y la aplicación tendría que armar el recibo («Su sesión»,
   «La sesión de Chrome en macOS, que entró con su código», «Su huella») con lo que creía antes de
   tocar. Si entre medio cambió algo, el recibo dice otra cosa que lo cortado. Que la respuesta de
   `/api/me/.../cut` traiga qué cortó (las sesiones con su dispositivo, sin el `device_id`).
2. **Cortar una computadora con «Se me perdió».** R8.1 lo pone solo en celulares, pero el diseño no dice
   qué hace la ruta si el `deviceKey` es una sesión de una computadora (hoy cortaría el dispositivo, igual
   que «Cerrar»). Que se niegue o que lo diga.
3. **Varias sesiones en un mismo dispositivo:** § 3 dice «cada uno con su sesión abierta», en singular.
   Que diga qué se muestra si hay dos (pasa si se borró la cookie y se entró de nuevo).
4. **El glosario:** `deviceKey`, «Lo tuyo» y «Lo mío» (`me`), «recibo» y «Quitar» (frente a
   `lostPhone` y `cut`). Se agregan antes de usarlos (constitución, X). El glosario ya tiene `deviceName`,
   y el diseño usa `name`.
5. **Las de punta a punta** (§ 11, tarea 5): CLAUDE.md pide justificarle a Carlos cada una antes de
   escribirla. El diseño no dice cuáles ni por qué no alcanza una unitaria.
6. **§ 9:** que la meta de bytes diga con cuántos dispositivos se mide, y que el «menos de 15 ms» se mida
   con la base del compose, no con PGlite.

## Lo que no pude comprobar

- El peso que suma al arranque (unos 6 KB) y los 2 KB de la respuesta: no armé la aplicación ni medí.
- Que la maqueta en el celular («mientras el dedo está apoyado, y se corta al soltarlo») funcione con
  `ui/` tal como está: no corrí la maqueta en un navegador.
- Si `whom(e)` en Quién hizo qué se lee bien cuando la persona se corta a sí misma («Le quitó un celular
  con huella a Juan», hecho por Juan): lo vi en `src/shared/audit-log/kinds.ts`, pero no lo probé con
  datos.
