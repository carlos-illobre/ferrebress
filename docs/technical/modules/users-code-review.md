# Revisión del código · 02 · Personas (`users`), etapa a

Revisión del paso 7: el código de los commits `7460c43` (servidor), `3aeeb98` (menú y teclas),
`49c367c` (marco) y `a58221a` (pantalla) contra el [capítulo](../../chapters/02-users/rules.md)
(R1 a R6, E01 a E33), las [pantallas](../../chapters/02-users/screens.md) con la maqueta aprobada
(`docs/design/mockups/users-a/final/`), el [diseño](users.md) y sus revisiones
([diseño](users-design-review.md), [seguridad](users-security-review.md)).

Lo que decidió Carlos no se discute acá: Usuarios en Más con Alt S, Más sin grupos en el celular, las
teclas Alt Z, I, D, B, L y `/`, y la única e2e `tests/e2e/users.spec.ts`.

**Qué corrí y qué no.**

- Las unitarias del módulo y de lo que tocó (`src/server/modules/users`, `sign-in`, `platform`,
  `src/app/modules/users`, `frame`, la hoja de confirmar): 47 archivos, 280 pruebas, todas pasan.
  `depcruise`, `headers` y `jscpd` pasan.
- Tres comprobaciones a mano contra el servidor de prueba (PGlite), con un programa aparte, sin tocar
  el código: cambiar el correo borra el nombre escrito (punto 1.1), un identificador que no es UUID da
  `500` (5.1), y el resto que se cita en cada punto.
- **E05 contra PostgreSQL de verdad** (`postgres:17-alpine`, el del compose, en un contenedor
  descartable): 40 rondas de dos bajas cruzadas a la vez por la fachada; en las 40 se guardó una sola
  y quedó una persona activa. El bloqueo hace lo que dice el diseño (§ 5).
- Capturas de la pantalla armada (computadora 1366 × 768 y celular 390 × 844) con una API de mentira,
  para el punto 9.
- **No corrí** la e2e (`tests/e2e/users.spec.ts`), ni `pnpm check` completo, ni el comando del primer
  Administrador dentro del contenedor (`docker compose exec server node src/server/first-administrator.ts`):
  no sé si la imagen del servidor trae `src/server/` para correrlo así.

Gravedad: **Frena** (se arregla antes de cerrar), **Conviene** (conviene arreglarlo ahora; no frena
solo) o **Menor**.

## Resumen

| # | Punto | Gravedad |
|---|---|---|
| 1.1 | Cambiar el correo borra el nombre escrito | **Frena** |
| 1.2 | Autorizar un correo repetido con la sesión de hace más de 5 minutos: el aviso se pierde | **Frena** |
| 1.3 | E20 y E24 no tienen prueba | **Frena** |
| 1.4 | E17, E19 y E28: la prueba que los nombra no comprueba todo lo que dicen | Conviene |
| 1.5 | E13: no se prueba que la cuenta vieja deje de entrar | Menor |
| 5.1 | Los identificadores de la dirección no se validan como UUID: `500` | **Frena** |
| 5.2 | Los rechazos de «Quitar» y «Cortar» no quedan en la auditoría | Conviene |
| 5.3 | Dar de alta o de baja sin cambio deja una línea de auditoría falsa | Conviene |
| 5.4 | Una entrada sin conexión confirmada cuenta como huella reciente (R3.8) | Conviene |
| 5.5 | Confirmar con la huella no mira que sea la de ese celular | Menor |
| 5.6 | El tope de cookies desconocidas frena también las sesiones válidas de esa dirección | Menor |
| 5.7 | Las tostadas con nombres no están marcadas `data-private` | Conviene |
| 5.8 | El límite de 60 cambios por sesión no tiene prueba | Conviene |
| 4.x | Diferencias con el diseño técnico | Conviene / Menor |
| 9.x | Diferencias con la maqueta | Conviene / Menor |

---

## 1. Escenarios sin cumplir

### 1.1 Cambiar el correo borra el nombre escrito — **Frena**

- **Dónde:** `src/server/modules/users/people.ts:52` (`const name = cleanName(change.name)`) y
  `data.ts:145-154` (`changeEmail` escribe `name`); la aplicación manda solo el correo,
  `src/app/modules/users/actions.ts:44`.
- **Qué dicen los documentos:** R3.4 («Google nunca pisa un nombre escrito»; el nombre es el que
  escribió quien autorizó); el contrato, `src/shared/contracts/users.ts:13`: «Sin `name`, no cambia»;
  el diseño § 4: «Sin `name`, no cambia».
- **Qué hace el código:** sin `name` en el cuerpo, `cleanName(undefined)` da `null` y `changeEmail` lo
  guarda: se borra el nombre escrito. Comprobado: autorizar «Ana del mostrador» y cambiarle el correo
  deja `name: null` y se muestra el correo. Con un cuerpo solo `{ version }` pasa lo mismo por
  `rename`. Ninguna prueba lo ve: `queries.test.ts:150` cambia el correo justo después de poner un
  nombre y no lo mira, y el servidor de mentira de `users-card.test.tsx:139-147` devuelve
  `displayName` igual al correo, que es lo que hace el error.

### 1.2 Un correo repetido después de confirmar quién es: el aviso se pierde — **Frena**

- **Dónde:** `src/app/modules/users/actions.ts:21` (repite `authorize` desde la hoja) y
  `src/app/modules/sign-in/screens/Sheets/ConfirmSheet.tsx:55-56` (descarta lo que devuelve).
- **Qué dicen los documentos:** R3.3 (un correo ya cargado «se avisa junto al campo del correo, sin
  perder lo escrito»); R3.8 («sigue sola con lo que se estaba haciendo»).
- **Qué hace el código:** el servidor mira R3.8 antes que el correo (`users/routes.ts:130`), así que
  con una sesión de más de 5 minutos (lo normal) un correo repetido primero abre la hoja, que
  reemplaza al diálogo de autorizar. Al confirmar, el pedido se repite, el servidor dice
  `email-taken`, `authorize` devuelve el código para el campo… y no hay campo: la hoja lo descarta.
  No aparece ningún aviso y lo escrito se perdió. Lo mismo si se toca «Cancelar» en la hoja: se pierde
  lo escrito. La prueba `users-overlays.test.tsx:64` solo prueba el camino feliz.

### 1.3 E20 y E24 no tienen prueba — **Frena**

- **E20** («Dar de baja», sin confirmar, no cambia nada): ninguna prueba toca «Cancelar» en la
  confirmación de la baja ni en «Cerrar todas». El diseño § 11 la pone «(pantalla)».
- **E24:** el diseño § 1 dice que se prueba por el camino del 01 «con pruebas que los nombran
  (`users-E18`, `users-E24`)». No hay ninguna `users-E24`. `users-E18` solo aparece dentro de
  `people.test.ts:134` («E03, E17 a E19»), que mira el `403` de Google: alcanza para E18.

### 1.4 E17, E19 y E28: la prueba que los nombra no comprueba todo — Conviene

- **E17** (`people.test.ts:134`): mira `active: false`, `deactivatedAt` y que Google da `403`. No mira
  que sus sesiones vuelvan con «se cerró desde otro dispositivo» ni que el celular deje de entrar con
  la huella y sin conexión. Eso se prueba en `sessions.test.ts:121-134` y `offline.test.ts:83-107`,
  con otro nombre.
- **E19:** «para entrar con la huella vincula de nuevo» se prueba después de «Quitar»
  (`access.test.ts:86-89`), no después de una baja y un alta (la baja borra `phoneOwners` en otro
  camino, `sign-in/index.ts:84`).
- **E28** (`users-R6.1`, `people.test.ts:198`): mira las líneas de las personas; de las de sesiones,
  solo `phone.cut` (`access.test.ts:109`). `session.closed`, `sessions.closed-all` y
  `passkey.removed` no tienen prueba que las mire.

### 1.5 E13: no se prueba que la cuenta vieja deje de entrar — Menor

`people.test.ts:79` cambia el correo y después borra a la persona; prueba que el correo nuevo no
entra **después de borrarla** (E15), no que entre con el nuevo y no con el viejo (E13).

### Lo demás

E01 a E12, E14 a E16, E18, E21 a E23, E25 a E27, E29 a E33 tienen prueba que los nombra y los
comprueba. E05: la regla, en `users.test.ts:75`; el bloqueo lo comprobé contra PostgreSQL (arriba).

## 2. Comentarios de cabecera y carpetas

- `src/app/modules/frame/screens/Frame/Frame.tsx:2`: «mientras no exista ningún módulo, el área está
  en blanco»; ya existe Usuarios y el marco abre la pantalla de la dirección. Menor.
- `src/server/modules/sign-in/access/data.ts:1-3`: «cada una, una sola consulta»; `phoneOf` y
  `cutPhone` hacen dos cada una. Lo mismo `users/data.ts:1-2` con `addFirst` (bloqueo e inserción en
  una transacción). Menor.
- `src/server/first-administrator.ts:3-4`: «lo que hace se prueba en modules/users/first.ts»; la
  prueba está en `users.test.ts:35`. Menor.
- `src/server/modules/sign-in/sessions/open.ts:44-46` explica bien lo que hace, pero cita «02, § 5»,
  que dice otra cosa (punto 4.1).
- `src/app/modules/users/screens/Users/Summary.tsx:1-3` dice que los filtros bajan de renglón en el
  celular «(pedido de Carlos)»: no está en ningún documento (punto 8).
- Las carpetas están bien agrupadas: `sign-in/access/` junta lo de Usuarios en `sign-in`;
  `users/screens/` tiene `Users`, `Card` y `Overlays`. Nada que mover.

## 3. Pruebas que miran por dentro

- `src/server/modules/sign-in/sessions/memory.test.ts:36-53`: reemplaza las consultas por funciones
  de mentira y cuenta cuántas veces se llamó `findByTokenHash`. Se justifica (con PGlite no se puede
  meter un pedido a mitad de un cierre), pero se rompe si cambia la forma de `sessionsData`. Además
  cubre solo el cierre de la baja (`closeForUser`), no el de «Cerrar»/«Cortar»
  (`beginClose` + `ended`). Menor.
- `src/server/modules/sign-in/sessions/sessions.test.ts:183-195`: pisa `server.users.recordSignIn`
  para simular la baja a mitad de la entrada. Mira por dentro; además se llama `users-R1`, que es
  «Quién administra», no el cruce de § 5. Menor.
- La pantalla: `users-card.test.tsx` y `users-refusals.test.tsx` miran `classList.contains('off')`;
  `users-list.test.tsx:76-82` mira el atributo `data-off` de `.users`; la e2e
  (`tests/e2e/users.spec.ts:24-31`) busca `.users-row`, `.users-card .users-item` y `.toast`. Se
  rompen si cambia una clase. Conviene usar lo que ve la persona (el texto «Dada de baja», el rol
  `status`). Menor.
- `users-card.test.tsx:167`: queda un comentario sin código («Borrar el nombre de quien nunca entró
  vuelve a su correo»). Menor.
- `users-keys.test.tsx:12` se llama «Alt Z autoriza, Alt I … y / busca», pero no prueba `/`; Alt D,
  Alt B y Alt L no tienen prueba. Menor.

## 4. El diseño

### 4.1 Activa al abrir la sesión: otro mecanismo que el del diseño — Conviene (documentación)

- **Diseño § 5:** abrir una sesión lee a la persona con `for share` en su transacción y la baja la
  bloquea con `for update`.
- **Código** (`sign-in/sessions/open.ts:47-66`): crea la sesión y después `recordSignIn` actualiza
  `where active = true`; si no toca nada, cierra la sesión recién creada. Leyéndolo, el cruce queda
  cubierto (el `update` espera el bloqueo de la baja y después ve `active = false`), y tiene prueba
  (`sessions.test.ts:183`). Pero no es lo que dice el diseño: hay que corregir § 5.

### 4.2 Cerrar una sesión que no es de esa persona da `200`, no `404` — Menor

- **Diseño § 4:** «Una persona o una sesión que no es de esa persona da `404`».
- **Código** (`access/routes.ts:73-86`, `access/data.ts:159-170`): el `update` filtra por persona y
  devuelve `{ closed: 0 }` con `200`. Comprobado. No cierra nada ajeno, pero no es lo que dice.

### 4.3 La memoria de `sign-in` no se pone al día «en un solo lugar» — Menor

- **Diseño § 6:** cada camino que cierra sesiones o borra huellas pasa por una función que saca las
  sesiones de la memoria, olvida a la persona y borra su celular de `phoneOwners`.
- **Código:** son tres lugares que hacen partes distintas: `closeSessions`
  (`access/routes.ts:76-78`, solo `ended`), `cut` (`:96-100`, las tres cosas a mano) y la baja
  (`sign-in/index.ts:81-85`). Funciona, pero un camino nuevo puede olvidarse de una.

### 4.4 Lo demás que se aparta — Menor

- **§ 3:** dice que las cantidades las conecta `app.ts`; las conecta `src/server/modules.ts`, que sí
  se prueba. Corregir el diseño.
- **§ 2, el traspaso:** `last_sign_in_at` toma «la sesión más reciente de cada persona» y, si no hay,
  `created_at`; la migración (`users/migrations/002-people.ts:20-21`) pone `created_at` a todas las
  que tienen cuenta de Google. Solo afecta al ambiente de pruebas.
- **§ 13:** nombra `confirm/google` y `confirm/passkey`; falta `POST /api/session/confirm/passkey/options`
  (`access/confirm.ts:61`).
- **§ 4, el orden de las sesiones:** se ordenan por el último uso de la base
  (`access/data.ts:58`) y se muestra el de la memoria (`access/routes.ts:56-57`), así una sesión
  «usada recién» puede quedar debajo de una «usada hace 5 min».

### Metas de performance

- La prueba que cuenta las consultas existe y pasa (`users/queries.test.ts`): `list 3`,
  `authorize 1`, `rename 3`, `email 1`, `deactivate 6`, `activate 1`, `remove 1`, `access 2`,
  `lost 3` / `2`, `cut 3`, `close 1`, `closeAll 1`, todas dentro de § 4.
- **`GET /api/users` con 100 personas, menos de 50 ms y 20 KB** (§ 10): no hay prueba. Conviene.
- La pantalla se baja con `import()` (`UsersSlot.tsx:20`); no lo medí contra el tope del arranque.

## 5. Seguridad

### 5.1 Los identificadores de la dirección no se validan — **Frena**

- **Diseño § 9:** «los identificadores de la dirección, UUID».
- **Código:** `c.req.param('id')`, `sessionId` y `phoneId` van directo a la consulta
  (`users/routes.ts:138, 146`; `access/routes.ts:52, 75, 92-93`). Contra columnas `uuid`, un valor
  como `no-es-uuid` hace fallar a PostgreSQL y la respuesta es `500 unexpected` con la traza en el
  registro. Comprobado en `POST /api/users/no-es-uuid/delete` y en `…/phones/xyz/cut`. No filtra datos,
  pero es un punto de la sección «Seguridad» que no está hecho, y llena el registro de fallas que
  son pedidos mal hechos.

### 5.2 Los rechazos de «Quitar» y «Cortar» no quedan en la auditoría — Conviene

- **Diseño § 9:** los rechazos (`self`, `last-administrator`, `changed`, `404`) se anotan una vez por
  minuto por motivo y persona.
- **Código:** las rutas de personas lo hacen (`users/routes.ts:105-111`); las de `sign-in`
  (`access/routes.ts:94-95`) contestan `404` y `409 self` sin anotar nada.

### 5.3 Dar de alta o de baja sin cambio deja una línea falsa — Conviene

- `people.ts:69` y `:100`: con la versión al día y la persona ya activa (o ya dada de baja),
  `whyNot(…, 'as-is')` lo da como hecho, y `answer` (`users/routes.ts:99-103`) anota
  `user.activated` / `user.deactivated`. Comprobado: dar de alta a alguien activo devuelve `200` y deja
  `user.activated`. Ninguna regla pide contestar `200` en ese caso (punto 6), y R6.1 quiere los
  **cambios**: la auditoría dice algo que no pasó.

### 5.4 Una entrada sin conexión confirmada cuenta como huella reciente — Conviene

- **R3.8:** haber entrado con Google o con la huella hace menos de 5 minutos en ese dispositivo.
- **Código:** `open.ts:60` pone `passkeyAt = now` a toda sesión abierta con una huella, y la
  confirmación sin conexión la abre con `passkeyId` (`offline/routes.ts:142`). Una entrada hecha sin
  conexión hace horas, confirmada al volver la conexión, deja 5 minutos para autorizar o dar de alta
  sin poner la huella. Debería tomar la hora de la entrada sin conexión, o ninguna.

### 5.5 Confirmar con la huella no mira el celular — Menor

- **Diseño § 13:** «una firma de la huella de esa persona en ese celular».
- **Código** (`access/confirm.ts:69-76`): mira que el desafío sea de la sesión y la huella de la misma
  persona, no que `found.deviceId` sea el de la sesión. Una huella copiada a otro aparato de la misma
  cuenta (riesgo aceptado en 01, § 13) confirma en cualquier dispositivo.

### 5.6 El tope de cookies desconocidas frena también las válidas — Menor

- **Diseño § 9:** 30 por minuto por dirección para las cookies que no corresponden a ninguna sesión.
- **Código** (`sign-in/sessions/require.ts:40`): pasado el tope, contesta `429` antes de mirar la
  cookie, también a una sesión válida que está en memoria (y no cuesta consulta). En la ferretería
  todos salen por la misma dirección: un dispositivo con una cookie vieja puede frenar al resto por
  un minuto. Mirar la memoria antes del tope lo evita.

### 5.7 Las tostadas con nombres no están marcadas — Conviene

- **Diseño § 8:** `data-private` en nombres y correos.
- **Código:** las tostadas dicen «Graciela Benítez quedó dada de baja», «Se borró el alta de
  juan@…», «Cortado: … de Graciela» (`users/texts.ts:90-111`), y la tostada (`ui/toast/Toast.tsx:25`)
  no lleva `data-private`: la captura de «Algo salió mal» las muestra. Los pasos sí están cubiertos
  (`crash.ts`, `isPrivate`).

### 5.8 Lo que el diseño pide probar y no tiene prueba — Conviene

- El límite de 60 cambios por sesión (§ 9 y § 11 «los dos límites nuevos»): funciona (comprobé el
  `429` en el pedido 61), pero no tiene prueba. El de las cookies sí (`access.test.ts:194`).
- Un nombre de Google de 4 KB se guarda recortado; uno con caracteres de dirección, limpio
  (revisión de seguridad, «Qué tiene que tener una prueba», 10): no hay prueba.
- Que `GET /api/lost-phones` no devuelva el `device_id` (ídem, 7): solo se prueba para la tarjeta
  (`access.test.ts:40`).

### Lo que está como dice

Todo con sesión; nadie se da de baja ni de alta a sí mismo (`people.ts:67, 86`); nunca sin nadie
activo, con el bloqueo (comprobado contra PostgreSQL); el correo y el borrado con «nunca entró» en el
mismo `where` (`users/data.ts:118-154`); atar la cuenta con `google_subject is null` y el correo
(`:63-72`); cuerpos con zod y largos (correo 254, nombre 80, versión de 1 a 2³¹ − 1); nombres sin
`\p{Cc}` ni `\p{Cf}` (`rules.ts:24`); las rutas de sesiones y celulares nombran a la persona y no
cortan lo ajeno (`404`, probado en `access.test.ts:141`); el identificador opaco de la huella
(`public_id`); la memoria de sesiones con el contador de cierres (`store.ts:84-90`); la auditoría
después de confirmar; el comando del primer Administrador sin ruta, con bloqueo de la tabla y
`E2E_FIRST_ADMIN_EMAIL` rechazada fuera de `e2e` (`platform/config.ts`).

## 6. Reglas inventadas

- **Dar de alta o de baja sin cambio contesta `200`** (`people.ts:69, 100`; probado como regla en
  `people.test.ts:152` «ya activa, queda igual»). Ninguna regla ni el diseño lo piden. Ver 5.3.
- **Buscador y filtros en el celular** (`Summary.tsx`): la maqueta del celular no los tiene; el
  comentario dice que lo pidió Carlos, pero no está escrito (punto 8).
- **«Se perdió un celular» sin red o con error dice «Nadie tiene un celular…»**
  (`Lost.tsx:103`): un error se muestra como si no hubiera nada que cortar. Conviene decir que no se
  pudo traer.
- **`409 self` al cortar el celular desde el que se pide** (`access/routes.ts:95`) se muestra con el
  texto de la baja, «No te podés dar de baja vos» (`texts.ts:120`). Solo se llega a mano (la lista no
  muestra ese celular). Menor.

## 7. Simpleza y repetición

- El límite de cambios está dos veces: `usersSettings.changes` (`users/routes.ts:24`) y `changes`
  (`access/routes.ts:22`), con la misma clave `users:session:<id>` escrita en los dos
  (`users/routes.ts:80`, `access/routes.ts:30`). Si uno cambia, se separan. Menor.
- `time` repetida en `users/routes.ts:37` y `access/routes.ts:23`; `bump` dos veces en
  `users/data.ts:133` y `:160`. Menor.
- `matchMedia('(max-width: 899px)')` en `Users.tsx:84` y `Summary.tsx:50`, leída al dibujar: si se
  cambia el ancho de la ventana no se entera. Menor.
- `whyNot(…, same: 'already-entered' | 'as-is')` (`people.ts:25-35`): el nombre del parámetro no dice
  qué decide. Menor.

## 8. Documentación que quedó atrás

- **El buscador y los filtros en el celular** no figuran en `screens.md`, en `changes.md` de la
  maqueta ni en el diseño, y la maqueta del celular no los tiene.
- **§ 5 del diseño** describe `for share`; el código hace otra cosa (4.1).
- **§ 3** nombra `app.ts` en vez de `modules.ts` (4.4); **§ 13** no tiene la ruta de las opciones de
  la huella (4.4).
- **Las líneas de auditoría** que agrega el código y § 9 no nombra: `users.rejected`,
  `users.throttled` y `session.confirm-rejected`.
- **El manual:** `docs/manual/media/phone-to-computer.end.webp` (el final del clip, actualizado en
  `a58221a`) muestra la computadora con «No se pudo traer la lista.» en Usuarios: la escena de ese
  clip no contesta `/api/users`. Conviene.

## 9. Pantallas

Comparé las capturas propias (computadora y celular, la lista y la tarjeta de Graciela) con
`desktop/screenshot.png`, `phone/screenshot.png` y `screenshot-phone-card.png`.

- **«Desde la instalación»** (Conviene): la maqueta muestra «Desde la instalación» en la tarjeta del
  primer Administrador (`shared/data.js:8`), y el diseño § 2 lo nombra (`authorized_by` nulo). La
  tarjeta siempre dice «Autorizada el …» (`Card.tsx:54`); `authorizedBy` llega y no se usa.
- **«Sin conexión»** (Conviene): R2.2 y E29 dicen que Usuarios se ve gris «con “Sin conexión”»; la
  maqueta dice «Sin conexión · se ve lo último, vuelve sola» (computadora) y «Sin conexión: Usuarios
  vuelve sola…» (celular). La aplicación dice «Usuarios necesita conexión. Vuelve sola cuando haya.»
  (`texts.ts:43`), igual en los dos tamaños.
- **Celular, la lista** (Conviene): suma el buscador y cuatro filtros que bajan a dos renglones entre
  «Se perdió un celular» y la lista (ver 6 y 8); en el renglón de una persona, «Entró hace 2 horas» se
  corta («Entró hace 2 ho») a 390 px.
- **Celular, la tarjeta** (Menor): la maqueta junta las sesiones en una sola tarjeta con separadores y
  la aplicación pone una tarjeta por sesión; el botón de volver dice «‹ Usuarios» en la maqueta y
  «‹ Volver a la lista» en la aplicación; la maqueta, al entrar a la tarjeta, no muestra el logo ni la
  luz de arriba.
- **Las fechas** (Menor): la maqueta dice «Autorizada el 03/08/2026», «Vinculado el 14/08/2026» y,
  para lo reciente, «Autorizada hoy 9:10»; la aplicación dice «21/09» sin año si es del año en curso
  y nunca la forma relativa (`logic.ts:332-336`).
- **La sesión en uso** (Menor): la maqueta marca con un punto verde la sesión usada ahora; la
  aplicación no.
- **La pestaña Auditoría en el celular** (Menor): «Pronto» se ve como texto suelto, sin la pastilla
  de la maqueta.
- **Al abrir en la computadora** la maqueta trae a alguien elegido; la aplicación muestra «Elegí a
  alguien». La maqueta tiene ese estado vacío, así que lo tomo como una elección de la maqueta para
  mostrar la tarjeta, no como regla. Menor.
- Lo demás coincide: cabecera con los dos botones, pestañas, las cuatro cuentas, filtros con su
  número, grupos «Pueden entrar» y «Dadas de baja», la dada de baja punteada y gris, la tarjeta con
  lápiz, candado, pastillas, sesiones y celulares, y «Se perdió un celular» rojo con borde en el
  celular. No miré con Alt apretado ni los diálogos en captura (los cubren las pruebas de pantalla).

## 10. Lo que se podría extraer a una librería

El módulo agregó y cambió bastante de lo no funcional. Parte por parte:

- **La sesión del pedido para cualquier módulo** (`src/server/platform/session.ts`).
  - Serviría tal cual a otro proyecto: un paso que deja la sesión en el pedido y otro que la lee, sin
    que el módulo conozca quién la resuelve.
  - Lo ata a Ferrebress: nada, salvo el comentario que cita «02, § 3» y el campo `confirmedAt`, que es
    de R3.8.
  - Iría a la base del servidor.
  - Para extraerlo fácil: que `confirmedAt` sea un campo genérico de la sesión (por ejemplo
    `extra`), o que lo agregue `sign-in`.
- **El rechazo que se lanza** (`Refused`, `platform/http.ts:48-59`) **y los eventos con «después de
  confirmar»** (`AfterCommit`, `platform/events.ts`).
  - Sirven a cualquier servidor con transacciones y efectos en memoria.
  - Lo ata a Ferrebress: `ErrorCode` viene del contrato compartido.
  - Iría a la base del servidor.
  - Para extraerlo fácil: que `Refused` sea genérico en el código.
- **La memoria de sesiones con el contador de cierres** (`sign-in/sessions/store.ts`) **y el tope de
  cookies desconocidas** (`sessions/require.ts:34-51`).
  - Sirven a cualquier proyecto con sesiones en memoria sobre una base.
  - Lo ata a Ferrebress: `signInSettings`, los nombres de las razones y los campos de la sesión
    (`way`, `isPhone`, `passkeyId`).
  - Irían a identidad.
  - Para extraerlo fácil: separar la memoria (`createMemory`, `resolveSession`, `closing`) de los
    campos de la fila.
- **Volver a confirmar quién es** (servidor `sign-in/access/confirm.ts`, aplicación
  `sign-in/screens/Sheets/ConfirmSheet.tsx`).
  - Es una «confirmación reciente» (step-up) con Google o la huella, útil para cualquier proyecto con
    la misma entrada.
  - Lo ata a Ferrebress: el texto de la hoja nombra «autorizar a alguien o dar de alta», y los 5
    minutos viven en `usersSettings.confirmWithinMs` (`users/routes.ts:27`), no en `sign-in`.
  - Iría a identidad.
  - Para extraerlo fácil: pasar los 5 minutos y la comprobación (`confirmed`, `users/routes.ts:119-122`)
    a `sign-in` o a la plataforma, como un paso `requireRecent(ms)`, y que la hoja reciba el motivo por
    parámetro.
- **Ver y cortar sesiones y huellas de otro** (`sign-in/access/`: rutas, datos, `lost.ts`, `counts.ts`).
  - Le sirve a cualquier proyecto con la misma identidad (sesiones, huellas por celular).
  - Lo ata a Ferrebress: las rutas cuelgan de `/api/users/:id/…`, la clave del límite se llama
    `users:session:` y la persona sale de la fachada de `users`.
  - Iría a identidad.
  - Para extraerlo fácil: juntar el límite en un solo lugar (punto 7) y nombrar la clave por lo que
    limita, no por el módulo.
- **El primer Administrador por comando** (`first-administrator.ts`, `users/first.ts`, el paso de
  `deploy/oracle/install.sh`) **y `E2E_FIRST_ADMIN_EMAIL`**.
  - El patrón («la primera persona sale de un comando que se niega si ya hay alguien») sirve a otros
    proyectos.
  - Lo ata a Ferrebress: la tabla `users.users` y el rol «Administrador».
  - Iría a identidad y despliegue.
  - Para extraerlo fácil: que el comando reciba la función que inserta.
- **El cambio con versión** (`version` y `whyNot`, `users/people.ts`, `users/data.ts`).
  - Es control de concurrencia optimista: útil en cualquier proyecto.
  - Lo ata a Ferrebress: está escrito para `users.users`.
  - Iría a la base del servidor.
  - Para extraerlo fácil: un ayudante `updateWithVersion(table, id, version, set)` que devuelva la
    fila o el motivo.
- **El marco: la pantalla por dirección** (`frame/menu.ts`, `optionAt`; `Frame.tsx` con `screens`;
  `usePhoneMore.leave`), **el lugar que se baja al abrir** (`users/UsersSlot.tsx`, que repite el
  patrón del manual) **y la captura sin lo privado** (`frame/notices/crash/crash.ts`, `isPrivate`).
  - Sirven a cualquier aplicación con este marco.
  - Lo atan a Ferrebress: el menú con sus opciones y textos vive en el mismo archivo que la lógica de
    navegación (`menu.ts`), y `UsersSlot` tiene su texto adentro.
  - Irían al marco y a la base de la aplicación.
  - Para extraerlo fácil: un `lazySlot(import, textoSinRed)` genérico que usen el manual y Usuarios.
- **Las piezas visuales:** `Button` con `soft` y `red`, los íconos de `people-shapes.tsx` y
  `menu-shapes.tsx`, y `sinceOf`/`dateOf` (`users/logic.ts:332-351`).
  - Sirven a otro proyecto en castellano.
  - Lo ata a Ferrebress: `sinceOf` vive en la lógica del módulo, con textos en castellano.
  - Iría a piezas visuales (los botones y los íconos) y a la base de la aplicación (cómo se dice
    cuándo pasó).
  - Para extraerlo fácil: mover `sinceOf` y `dateOf` a `platform/` o a `ui/`, separados de `wayNames`.
- **Calidad:** las pruebas que cuentan consultas ya existían. Este módulo no agregó una herramienta
  nueva.

**Hoy no conviene extraer nada:** hay un solo proyecto que lo usa. Varias piezas todavía tienen algo
del negocio adentro (la confirmación con los 5 minutos en `users`, el límite con nombre de módulo, el
menú junto a la navegación), y conviene esperar a que el segundo módulo con pantalla use el lugar que
se baja al abrir y la pantalla por dirección antes de fijar su forma.
