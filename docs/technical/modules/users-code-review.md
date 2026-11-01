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

---

# Revisión del código · 02 · Personas (`users`), etapa b: roles y permisos

Revisión del paso 7 de la etapa b: los commits desde `304b123` («Roles y permisos en el servidor de
Usuarios») hasta `a9d5a8f`, contra el [capítulo](../../chapters/02-users/rules.md) (R7, los cambios a
R1 a R6, E34 a E60 y los de la etapa a que cambian), 00 · R1.4 y R1.8, 15 · R1.2, las
[pantallas](../../chapters/02-users/screens.md) (filas 2 a 4), el [diseño](users.md) (§§ 14 a 24) y sus
revisiones.

**Qué corrí y qué no.**

- Las unitarias de lo que tocó la etapa: del servidor (`modules/users`, `routes-permissions`,
  `platform`, `sign-in/access`, `sign-in/offline/permission`, `shared`), 24 archivos y 122 pruebas; de
  la aplicación (`modules/users`, `frame`, `sign-in/permissions-watch`, `sign-in/offline`), 25 archivos
  y 146 pruebas. Todas pasan.
- Pruebas aparte, en el scratchpad, sin tocar el código: contra el servidor de prueba (PGlite) para los
  puntos 1.1, 1.4, 4.1, 5.2 y 5.4; y **contra PostgreSQL de verdad** (`postgres:17-alpine`, un
  contenedor descartable) para § 19: 40 rondas de cada par a la vez entre dos personas que administran
  (baja contra baja, sacarse los roles uno al otro, baja contra sacar roles). En las 120 se guardó uno
  solo y nunca quedó nadie con «Administrar personas» (ver 4.5 por el motivo que devuelve).
- Capturas de la aplicación armada (computadora 1366 × 768 y celular 390 × 844) con una API de
  mentira, en la imagen de Playwright, para el punto 9.
- **No corrí** `pnpm check` completo, ni las e2e (`tests/e2e/roles.spec.ts` y las demás), ni el
  comando del primer Administrador, ni «Copiar el pedido» en un navegador de verdad (el portapapeles).
  No miré con Alt apretado.

Gravedad: **Frena** (se arregla antes de cerrar), **Conviene** o **Menor**.

## Resumen

| # | Punto | Gravedad |
|---|---|---|
| 1.1 | Renombrar un rol con un nombre que ya está da `500` | **Frena** |
| 1.2 | E57: la descripción no se ve en la lista de roles; la prueba mira la tarjeta | **Frena** |
| 1.3 | E53 / R7.10: el traspaso de la migración no tiene prueba | **Frena** |
| 1.4 | E55 / R6.1: renombrar y cambiar la descripción no dejan antes y después; borrar no deja lo que tenía | **Frena** |
| 1.5 | E46 / R7.7 en el celular: «Cortar sesiones», «Quitar huella» y «Cambiar sus roles» aparecen apagados | **Frena** |
| 1.6 | R7.8: «Ya no tenés permiso» culpa a quien le cambió los roles la última vez | **Frena** |
| 4.1 | § 22: las rutas de roles no tienen la prueba que cuenta sus consultas, y hacen más que las de § 18 | **Frena** |
| 9.1 | Los roles de una persona en el celular no siguen la variante 2 aprobada | **Frena** |
| 4.2 | El arranque suma los permisos nuevos sin transacción | Conviene |
| 5.1 | `confirm-first` y `outranked` de las rutas de personas no quedan en la auditoría | Conviene |
| 5.2 | Nombres de personas sin `data-private` en «Sin permiso», «Ya no tenés permiso» y Roles | Conviene |
| 2.x | Comentarios de cabecera que quedaron atrás; `users/` sin subcarpeta de roles | Conviene / Menor |
| 4.3 a 4.6 | Otras diferencias con el diseño | Conviene / Menor |
| 9.2 a 9.4 | Otras diferencias con las maquetas | Conviene / Menor |

## 1. Escenarios sin cumplir

### 1.1 Renombrar un rol con un nombre que ya está da `500` — **Frena**

- **Dónde:** `src/server/modules/users/roles-writing.ts:20-31` (`updateRole`, sin manejar el índice
  único) y `role-changes.ts:115-124`.
- **Qué dicen:** R7.3 y E37 («cuando se guarda otro como «encargado»… no se guarda y se dice por
  qué»); § 18, `409 role-name-taken`.
- **Qué hace:** crear lo controla con `on conflict do nothing`, pero cambiar el nombre choca con el
  índice `roles_name` y sale como error de la base. Comprobado: `POST /api/roles/:id { name:
  'encargado' }` con «Encargado» existente devuelve `500 { error: 'unexpected' }`. La aplicación dice
  «No se pudo» en vez de «Ya hay un rol con ese nombre». La prueba de E37
  (`roles-routes.test.ts:55-69`) solo prueba crear.

### 1.2 E57: la descripción no se ve en la lista de roles — **Frena**

- **Dónde:** `src/app/modules/users/screens/Roles/Roles.tsx:84`; prueba
  `users-roles.test.tsx:11-21`.
- **Qué dicen:** E57, «cuando se elige el rol de una persona **o se mira la lista de roles**, la
  descripción se ve debajo del nombre»; R7.3.
- **Qué hace:** cada renglón de la lista muestra debajo del nombre sus permisos, no la descripción; la
  descripción solo está en la tarjeta del rol elegido (y en el selector de roles, que sí cumple). La
  prueba que nombra E57 busca «Puede todo.» en la tarjeta, así que pasa igual.

### 1.3 E53 / R7.10: el traspaso no tiene prueba — **Frena**

- **Dónde:** `migrations/003-roles.ts:34-35` (el `insert … select` que le da el Administrador a todas
  las personas que ya estaban); prueba `roles-routes.test.ts:14-28`.
- **Qué hace:** la prueba «users-E34, E53» arranca una instalación nueva cuyo primer Administrador
  recibe el rol por `addFirst` (`data.ts`), no por la migración. Ninguna prueba migra una base con
  personas cargadas con `002-people` y mira que queden con el rol Administrador y, después del
  arranque, con todos los permisos. Si ese `insert` fallara, nada lo diría.

### 1.4 E55 / R6.1: la auditoría de los roles no dice lo de antes en todos los cambios — **Frena**

- **Dónde:** `role-changes.ts:123` (`changeRole` devuelve solo los permisos de antes y después),
  `role-changes.ts:136` (`removeRole` devuelve `before: []`), `roles-routes.ts:70-73`.
- **Qué dicen:** R6.1, «crear, duplicar, renombrar, cambiar la descripción o los permisos, o borrar un
  rol (con lo que había antes y lo que quedó)»; E55; § 21.
- **Qué hace (comprobado):** renombrar «Encargado» a «Jefe» deja `{ target: 'Jefe', before: [permisos],
  after: [los mismos] }`: el nombre viejo no queda en ningún lado. Cambiar la descripción deja la misma
  línea, sin la descripción. Borrar deja `{ target, before: [], after: [] }`, sin los permisos que tenía.

### 1.5 E46 / R7.7 en el celular: botones apagados en vez de no estar — **Frena**

- **Dónde:** `src/app/modules/users/screens/Card/Phone.tsx:43-65` (`Tiles`).
- **Qué dicen:** R7.7, «lo que no se puede usar no aparece… ni como botón»; E46, sin «Cerrar todas» ni
  «Quitar»; 00 · R1.5, las mismas reglas en los dos.
- **Qué hace:** en el celular, «Cortar sesiones» y «Quitar huella» se ven **apagados** para quien no
  tiene «Cortar sesiones y huellas» o mira a alguien con más permisos, y «Cambiar sus roles» se ve
  apagado sin «Administrar roles». En la computadora no aparecen. La prueba de E46
  (`users-permissions.test.tsx:94-106`) busca los nombres de la computadora y no los de estos botones.

### 1.6 R7.8: «Ya no tenés permiso» nombra a la persona equivocada — **Frena**

- **Dónde:** `frame/screens/NoPermission/texts.ts:25-26` y `Lost.tsx:45`; `roles_changed_by` solo lo
  escribe `setUserRoles` (`roles-writing.ts:53-64`); prueba `frame/permissions.test.tsx:113-128`.
- **Qué hace:** si lo que cambió fueron los permisos de un rol (no sus roles), el texto dice «<quien
  le cambió los roles la última vez> te cambió los permisos de un rol recién». Esa persona puede no
  tener nada que ver y haberlo hecho hace semanas. La prueba se llama «lo dice sin nombrar quién ni qué
  rol», pero arma la persona con `rolesChangedBy: null`; con cualquier persona que alguna vez tuvo un
  cambio de roles, el texto nombra a alguien. Comprobado en el servidor: después de que Beto le saca un
  permiso al rol de Juan, `/api/start` de Juan trae `rolesChangedBy` sin cambiar.

### Lo demás

E34 a E45, E47 a E52, E54, E56, E58 a E60 tienen su prueba y la prueba comprueba lo que dice, con dos
salvedades menores: E47 no comprueba que «no cambia nada» (pide con un id que no existe), y E04 por el
camino «quitarle el permiso al rol» desde otra persona no tiene prueba (lo comprobé aparte: da
`409 last-administrator`). E05 se comprueba a mano (§ 19); lo hice contra PostgreSQL y se cumple.

## 2. Comentarios de cabecera y carpetas

- `src/server/modules/users/people.ts:1-3`: dice que «los bloqueos» están en `data.ts`; el de la baja
  ahora es `lockAndCount` de `roles-data.ts`. — Conviene.
- `src/server/modules/users/index.ts:1-4`: dice que publica `user.deactivated` y `user.renamed`; ahora
  también `users.permissions-changed`, da los permisos a la plataforma y suma al Administrador los
  permisos nuevos al arrancar. — Menor.
- `src/server/modules/users/routes.ts:1-4`: dice que cada rechazo queda anotado; `confirm-first` y
  `outranked` no (5.1). No nombra los permisos de cada ruta. — Menor.
- `src/app/modules/users/screens/Roles/RolePicker.tsx:1-3`: dice que el número de cada rol «lo tilda con
  el teclado»; no hay nada que lo haga (el `<kbd>` de la línea 38 no tiene `data-key` ni manejador). —
  Conviene (la pantalla promete algo que no hace).
- `src/app/modules/users/screens/Roles/RoleCard.tsx:1-4`: «borrarlo si nadie lo tiene»; el botón
  aparece siempre, salvo en el Administrador, y el servidor dice que no. `roleTexts.removeHint`
  (`role-texts.ts:32`) quedó sin usar. — Menor.
- `src/app/modules/users/state.ts:1-3` y `screens/Users/Users.tsx:1-4`: no nombran la pestaña Roles, el
  rol abierto, el borrador ni lo que puede quien mira. — Menor.
- **Carpeta** `src/server/modules/users/`: 21 archivos sueltos, y siete son de los roles (`roles.ts`,
  `roles-data.ts`, `roles-writing.ts`, `roles-tables.ts`, `roles-routes.ts`, `role-changes.ts`,
  `access.ts`, más sus pruebas). Irían juntos en `users/roles/`, como `sign-in/` agrupa `access/` u
  `offline/`. — Conviene.
- En la aplicación, `modules/users/` suma `role-actions.ts` y `role-texts.ts` a la raíz, con diez
  archivos de prueba `users-*.test.tsx`; se lee bien, pero las pruebas podrían ir en una subcarpeta. —
  Menor.

## 3. Pruebas que miran por dentro

- `roles-changes.test.ts:121-138` (E51): borra filas de `users.known_permissions` y
  `users.role_permissions` con SQL y llama `createAccess` directo. Simular «un capítulo trae un permiso
  nuevo» sin tocar las tablas pediría poder pasarle la lista al arranque. — Menor.
- `roles-changes.test.ts:164-183`: arma una plataforma con una base `Proxy` que falla y llama
  `createPeople` y `createRoleChanges` directo, para cubrir las ramas del `catch`. — Menor.
- `src/server/testing/sign-in/offline-kit.ts:65-79` (`onlyWith`): las pruebas de `sign-in` escriben en
  las tablas de `users` y publican su evento a mano; un cambio del esquema de roles las rompe. Podría
  usar las rutas de roles, como `roles-kit.ts`. — Conviene.
- `users-roles.test.tsx:13-20` y `frame/permissions.test.tsx:126`: buscan por clases de CSS
  (`.roles-body`, `.roles-row .users-pill`, `.role-note`, `.pill-gone`) y por `textContent` pegado
  («2Roles»). Rompen al cambiar el marcado sin cambiar lo que se ve. — Menor.
- `routes-permissions.test.ts:64-67` lee `http.routes` de Hono: es lo que pide § 21, está bien.

## 4. El diseño

### 4.1 § 22: sin prueba que cuente las consultas de las rutas de roles — **Frena**

- **Qué dice:** § 22, «las de cada ruta, en la tabla de § 18, cada una con su prueba que las cuenta»;
  también el paso de permisos (0 o 1), `/api/start` (0 o 2) y `GET /api/roles` con 20 roles y 100
  personas (30 ms, 10 KB).
- **Qué hace:** `queries.test.ts` cuenta solo las rutas de personas y de sesiones (esas coinciden con
  § 18). Ninguna prueba cuenta `GET/POST /api/roles`, `POST /api/roles/:id`, borrar, `POST
  /api/users/:id/roles` ni `holders`, ni mide `GET /api/roles`. Medido con `countQueries`, contando el
  comienzo y la confirmación de la transacción como hace la etapa a:

  | Ruta | § 18 | Medido |
  |---|---|---|
  | `GET /api/roles` | 3 | 3 |
  | `POST /api/roles` | 4 | 8 (la transacción, el rol, borrar e insertar permisos, y `rowOf` vuelve a leer las tres tablas) |
  | `POST /api/roles/:id` | 8 | 11 (`rowOf` otra vez) |
  | `POST /api/roles/:id/delete` | 3 | 4 |
  | `POST /api/users/:id/roles` | 7 | 11 |
  | `GET /api/permissions/:id/holders` | 2 | 4 (`findAll` y las tres tablas) |
  | `/api/start` sin la persona en memoria / con ella | 2 / 0 | 2 / 0 |

  `GET /api/roles` con 20 roles y 96 personas: 7,2 KB y 3,7 ms en PGlite. Hay que bajar las
  consultas o corregir § 18, y en los dos casos sumar la prueba.

### 4.2 El arranque suma los permisos nuevos sin transacción — Conviene

- **Dónde:** `access.ts:52-61` y `roles-writing.ts:88-102`.
- **Qué dice:** § 16, «en una transacción, con su línea en la auditoría».
- **Qué hace:** anota el permiso en `known_permissions` y, en otra sentencia sobre `platform.db`, se lo
  suma al rol del sistema. Si el proceso se corta entre las dos, el permiso queda «conocido» y el
  Administrador no lo recibe nunca (R7.4).

### 4.3 La memoria con contador: un solo aumento, no «antes y después» — Menor (documentación)

- `platform/memory.ts:1-25` sube el contador solo al olvidar, después de confirmar; § 17 dice «antes y
  después de confirmar». Lo que hace el código alcanza (una lectura que termina antes del olvido la
  borra el olvido; una que lo cruza no se guarda) y su cabecera lo explica; § 17 quedó atrás.

### 4.4 La cabecera `p=` no va en todas las respuestas — Menor (documentación)

- `platform/permissions.ts:26-30`: la huella la deja el paso de la sesión, así que va solo en las rutas
  con `sessions.require`. `/api/start` no la lleva (no hace falta: trae la persona). § 20 dice «cada
  respuesta».

### 4.5 Bajo el bloqueo, el segundo cambio puede contestar `self` en vez de `last-administrator` — Menor

- **Dónde:** `roles-data.ts:127-155`: el bloqueo y el primer conteo van en la misma sentencia, así que
  el conteo «de antes» sale de la foto tomada antes de esperar el bloqueo.
- **Qué pasó contra PostgreSQL:** de las 120 rondas, en 119 el segundo recibió `self` («Eso te lo tiene
  que hacer otra persona…») aunque lo que lo frenó es que el primero ya le había sacado el permiso o
  dado de baja. La regla se cumple siempre (nunca quedó nadie sin administrar); el motivo que ve la
  persona no es el cierto. Separar el bloqueo en su propia sentencia antes de contar lo arregla.

### 4.6 Dar de alta no avisa que cambiaron los permisos — Menor

- `people.ts:68-72`: la baja publica `users.permissions-changed`; el alta no. Si algo leyó los permisos
  de la persona mientras estaba de baja (un pedido en vuelo justo al darla de baja, que lee `[]` después
  del olvido), al darla de alta queda sin permisos en la memoria hasta el próximo cambio de roles o un
  reinicio. No lo reproduje; es una carrera chica, y publicar también en el alta la cierra.

### Lo que está como dice

Las tablas, índices y claves de § 15; la lista de § 16 con lo incluido; `permissions.require` después
de la sesión y el `403 forbidden` con el permiso; la prueba que recorre las rutas; la fachada de § 17;
R7.11 en el correo, la baja, el alta, los cortes y «Se perdió un celular»; el bloqueo único de § 19; la
persona de `/api/start` con roles, permisos y quién se los cambió; la persona guardada sin conexión con
sus permisos; `offline.work` en los cinco lugares; la pestaña Roles que se baja al abrirla; la e2e
aprobada.

## 5. Seguridad

### 5.1 `confirm-first` y `outranked` de las rutas de personas no quedan en la auditoría — Conviene

- **Dónde:** `users/routes.ts:166`, `178` y `220` (`fail(c, 403, 'confirm-first')` y el `outranked` del
  correo) y `76-81` (`notOutranked` de la baja y el alta).
- **Qué dice:** § 21, «`confirm-first` también se anota»; la cabecera del archivo, «cada rechazo».
- **Qué hace (comprobado):** autorizar con la confirmación vieja y dar de baja a quien tiene más dan
  `403` sin ninguna línea. Las rutas de roles y las de `sign-in/access` sí los anotan. Justo esos dos
  son los intentos de darse acceso o sacar a quien tiene más que la auditoría tendría que mostrar.

### 5.2 Nombres de personas sin `data-private` — Conviene

- **Dónde:** `NoPermission.tsx:82-124` (las iniciales y los nombres de «Te lo puede dar»), `Lost.tsx:45`
  («Graciela te sacó…»), `PersonRoles.tsx:48-50` («Roles de Luis»), `RoleCard.tsx:85-103` (el
  selector «Darle este rol a…» con nombres) y la tostada `role-texts.ts:43`.
- **Qué dice:** 00 · R9.4 y el diseño de 01: lo que muestra datos personales lleva `data-private`, así
  la captura de «Algo salió mal» lo tapa. Es lo mismo que la etapa a dejó en 5.7.

### 5.3 Lo demás de § 21

Cerrado por defecto (la prueba recorre las rutas), darse acceso solo con `roles.manage` y Google o la
huella recientes, R7.11, nunca sin quien administre (comprobado contra PostgreSQL), `holders` sin
correos y con el id validado, y `permission.denied` con tope: están como dice. Con una salvedad
menor: `holders` junta las personas **por nombre** (`access.ts:87-89`), así que dos personas con el
mismo nombre, o dos «Sin nombre», cuentan como una, y «Sin permiso» dice menos personas de las que hay
(`NoPermission.tsx:83`).

## 6. Reglas inventadas

- **Autorizar con un rol que ya no existe** (lo borraron mientras el diálogo estaba abierto) devuelve
  `bad-request` (`people.ts`, el `catch` de `23503`), y la aplicación lo muestra junto al correo como
  «Eso no tiene forma de correo» (`actions.ts:11`). — Menor.
- **«Darle este rol a…»** de la pestaña Roles ofrece solo personas activas (`RoleCard.tsx:64`); en la
  tarjeta, a una dada de baja se le pueden cambiar los roles. Ninguna regla dice ni lo uno ni lo otro. —
  Menor.
- Los textos dan por hecho que hay un solo rol: «lo tiene que hacer otro Administrador»
  (`texts.ts:95`, E03 dice «otra persona») y «El Administrador no se borra» (`texts.ts:146`), aunque el
  rol se puede renombrar (R7.4, E40). — Menor.

## 7. Simpleza y repetición

- `roleRows` (`roles-routes.ts:34-48`) y `holdersOf` (`access.ts:79-104`) leen las mismas tres tablas
  y agrupan igual; y `rowOf` (`roles-routes.ts:114-115`) relee todos los roles para devolver uno, que es
  lo que suma consultas en 4.1. — Conviene.
- `people.ts` importa `Rollback` de `role-changes.ts` y repite a mano el `inTransaction` (bloqueo,
  conteo, rechazo, eventos) para la baja. — Conviene.
- `notOutranked` está dos veces: `users/routes.ts:76-81` y `sign-in/access/routes.ts:35-38` (uno anota
  y el otro no, ver 5.1). — Conviene.
- El esquema `version` está copiado en `shared/contracts/users.ts:6` y `roles.ts:6`; el límite
  `{ max: 60, windowMs: 60_000 }` sigue repetido en `sign-in/access/routes.ts:24` (etapa a, punto 7). —
  Menor.
- Dos cosas se llaman `permissionsHash`: la función de `shared/contracts/can.ts` y la memoria de
  `platform/server/api.ts:28`; `permissions-watch.ts:5` tiene que renombrar una al importarla. — Menor.
- Las listas de permisos de cada rol se ordenan por id (`roles-routes.ts:41-45`), así el renglón del
  Administrador dice «Trabajar sin conexión · Administrar roles · Cortar…» en vez del orden de R7.1. —
  Menor.

## 8. Documentación que quedó atrás

- § 18: los números de consultas de las rutas de roles (4.1).
- § 16: «en una transacción» (4.2); § 17: el contador «antes y después» (4.3); § 20: la huella «en cada
  respuesta» (4.4).
- `POST /api/users/:id/roles` contesta `{ roles }`, sin la versión nueva de la persona; la aplicación
  vuelve a pedir la lista. Funciona, pero § 18 no dice qué devuelve. — Menor.
- El manual (`docs/manual/users.md`) no tiene las tareas de roles y «Autorizar a alguien» no nombra los
  roles. Es del paso 9, pero § 24.6 lo puso en la tarea 6; lo dejo anotado.

## 9. Pantallas

Comparé capturas propias con las maquetas aprobadas.

### 9.1 Los roles de una persona en el celular — **Frena**

- **Maqueta aprobada** (screens.md, fila 3): la variante 2 del celular, «¿Qué puede hacer Martín?»,
  «Igual que alguien», interruptores (de roles, no de permisos), lo que puede abajo y el pie fijo con
  «Darle un rol pide confirmar que sos vos» y «Guardar».
- **La aplicación** (`PersonRoles.tsx`): muestra en el celular lo mismo que en la computadora: «Roles de
  Luis · tildá los que tiene», casillas, «Va a poder» y «Guardar los roles» en el medio de la tarjeta.
  No tiene la pregunta, ni «Igual que alguien», ni los interruptores, ni el pie fijo.

### 9.2 «Sin permiso» y «Ya no tenés permiso» — Conviene

Aprobadas «tal cual».

- **Computadora:** falta el título «Usuarios» de la página y el renglón «Abriste
  ferrebress.com.ar/users»; el candado es de trazo fino y chico, no el lleno de la maqueta.
- **Celular:** falta la cabecera «Usuarios · En línea»; «Ir a…» y «Copiar el pedido» no quedan fijos
  abajo (la maqueta tiene «Ir a Vender» ancho y un botón de compartir al lado); los renglones de «Lo
  tienen» van sueltos, no en una sola caja con «2 personas» debajo del nombre.
- **«Ya no tenés permiso»** (por el código, sin captura): el ícono es un candado en vez del de la
  persona tachada sobre amarillo; el nombre de quien lo hizo no va en negrita; la cuenta regresiva es un
  número sin el aro.

### 9.3 La pestaña Roles — Conviene

- **Computadora:** los renglones no tienen la barra de segmentos de los permisos ni el aviso «↑ ↓ para
  recorrer · Enter para abrir»; el ícono de «Cortar sesiones y huellas» es «prohibido» y no la tijera, y
  el de «Administrar personas» es el de personas y no el de la persona con engranaje.
- **Celular:** la maqueta no tiene las dos cuentas (roles y personas) arriba; «Quién puede qué, sumando
  sus roles» se pega con «de 4 personas» («sus rolesde 4 personas»); cada renglón muestra los permisos
  cortados y «2 personas», no la barra, «N permisos» y las caras; la pestaña elegida es verde oscura y
  la maqueta, blanca; arriba sigue «Buscar usuario», que en Roles no busca nada.

### 9.4 Usuarios con roles — Menor

- Con dos pastillas, el nombre se corta («Graciela …»): la maqueta pone las pastillas una debajo de la
  otra.
- En la tarjeta de la computadora los roles van debajo de las sesiones y la maqueta los pone arriba:
  § 20 lo dice así, lo tomo como decidido.

## 10. Lo que se podría extraer a una librería

La etapa b agregó bastante de lo no funcional. Parte por parte:

- **El paso de permisos** (`src/server/platform/permissions.ts`) **y el gancho de la sesión**
  (`platform/session.ts`, `onSession`).
  - Serviría a cualquier servidor Hono con permisos fijos por ruta: exigir uno, `403` con el que falta,
    anotar el rechazo con tope y dejar la huella en el pedido.
  - Lo ata a Ferrebress: el tipo `PermissionId` de la lista del negocio y el nombre del evento
    `permission.denied`.
  - Iría a la base del servidor (o a identidad).
  - Para extraerlo fácil: que `createPermissionGate` sea genérico en el tipo del id.
- **La memoria con contador** (`platform/memory.ts`).
  - No tiene nada del negocio: está lista.
  - Iría a la base del servidor.
- **Cerrado por defecto** (`src/server/routes-permissions.test.ts`).
  - El patrón «cada ruta registrada declara qué pide; sin sesión 401, sin permiso 403» sirve a
    cualquier proyecto.
  - Lo ata a Ferrebress: la tabla de rutas vive en la prueba, junto con `roles-kit`.
  - Iría a calidad.
  - Para extraerlo fácil: un ayudante `everyRouteDeclares(http, tabla, pedirSin)` y que la tabla quede
    en cada proyecto.
- **La huella de los permisos en la cabecera y quien la mira** (`shared/contracts/server-header.ts`,
  `can.ts`, `app/platform/server/api.ts`, `app/modules/sign-in/permissions-watch.ts`).
  - Sirve a cualquier aplicación que quiera enterarse de un cambio de permisos sin pedidos extra.
  - Lo ata a Ferrebress: el nombre de la cabecera sale del producto, y quien mira llama a
    `signInApi.start` y a la sesión de `sign-in`.
  - Iría a la base de la aplicación y a la del servidor.
  - Para extraerlo fácil: que el que mira reciba por parámetro cómo volver a pedir la persona.
- **El catálogo de permisos** (`shared/contracts/permissions.ts`: grupos, lo que incluye, `withIncluded`)
  **y `can()`**.
  - La forma sirve a cualquier proyecto; la lista es del negocio.
  - Lo ata a Ferrebress: la forma y la lista están en el mismo archivo.
  - Iría a identidad.
  - Para extraerlo fácil: un `definePermissions(grupos, lista)` aparte de la lista.
- **Roles con «nunca sin quien administre» y «nadie sobre quien tiene más»** (`users/roles.ts`,
  `roles-data.ts`, `role-changes.ts`, `access.ts`, la migración `003-roles` con `known_permissions` y
  el rol del sistema).
  - Es un motor de roles que le sirve a otro proyecto con la misma identidad.
  - Lo ata a Ferrebress: `'users.manage'` y `'roles.manage'` escritos en el SQL
    (`roles-data.ts:137-146`), el esquema `users` y los textos de la auditoría.
  - Iría a identidad.
  - Para extraerlo fácil: que los permisos que «administran» lleguen como parámetro, y que lo
    genérico quede en la subcarpeta `roles/` del punto 2.
- **El marco con permisos** (`frame/menu.ts`: `allowed`, `firstOption`, `goToFirst`; `Frame.tsx`:
  `Work`, `useLostPermission`; `screens/NoPermission/`).
  - Sirve a cualquier aplicación con este marco.
  - Lo ata a Ferrebress: las opciones del menú en el mismo archivo que la lógica, «en Ferrebress» en
    el texto del pedido (`NoPermission/texts.ts:23`) y los íconos de cada permiso en
    `frame/permission-icons.ts`.
  - Iría al marco.
  - Para extraerlo fácil: separar la lista de opciones de `menu.ts` y recibir los íconos y el nombre
    del producto por parámetro.
- **Piezas visuales:** los interruptores agrupados con candado (`Roles/Permissions.tsx`) y el selector
  con casillas y descripción (`Roles/RolePicker.tsx`).
  - Sirven a otro proyecto en castellano.
  - Lo ata a Ferrebress: leen `roleTexts` y la lista de permisos directamente.
  - Irían a piezas visuales.
  - Para extraerlo fácil: recibir los textos y la lista por parámetro.

**Hoy no conviene extraer nada:** hay un solo proyecto. La memoria con contador y el paso de permisos
ya casi no tienen negocio adentro, pero el motor de roles tiene los dos permisos que «administran»
escritos en el SQL y el marco tiene el menú mezclado con la navegación; conviene esperar a que un
segundo módulo pida sus permisos para fijar la forma.
