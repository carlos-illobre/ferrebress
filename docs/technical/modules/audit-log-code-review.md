# Revisión del código · 05 · Quién hizo qué (`audit-log`)

Revisión del paso 7 (constitución), hecha solo con los documentos y el código: el
[capítulo 05](../../chapters/05-audit-log/rules.md) (R1 a R5, E01 a E48), su
[screens.md](../../chapters/05-audit-log/screens.md) y las maquetas aprobadas
(`mockups/users-who-did-what/{desktop,phone}/variant-1-ledger/` y `variant-3-tape/`), el
[diseño](audit-log.md) con sus dos revisiones, y el código de los commits `2804f9b` a `aca87c7`:
`src/server/modules/audit-log/`, `src/server/platform/storage/audit/`, `platform/device.ts`,
`platform/guards.ts`, `src/shared/audit-log/`, `src/shared/contracts/audit-log.ts`,
`src/shared/time/business.ts`, `src/app/modules/audit-log/` y lo que cambió en `users`, `sign-in` y
`frame`.

Corrí las pruebas del módulo (`vitest run` sobre las carpetas del módulo, `audit-catalog.test.ts` y
`users-list.test.tsx`): 82 pasan. No corrí `pnpm check` entero ni las capturas, y no miré las
pantallas funcionando: lo de las pantallas sale de leer el código contra las capturas de las
maquetas.

Gravedad:

- **Frena:** hay que resolverlo antes de cerrar el módulo.
- **Mejora:** conviene hacerlo; no frena.

## Resumen

La base está bien hecha: la forma común de la acción, el autor que el módulo no puede poner libre,
el catálogo compartido que el servidor usa solo para colores, grupos y qué datos salen, la consulta
de solo lectura en un hilo aparte que no crea archivos, los textos en trozos (nada de HTML) y la
lista que no pide nada sola. Las pruebas de la lista, los filtros y la cinta usan la pantalla como
la usa la persona.

Lo que frena: **cuatro escenarios sin cumplir** (E09 en la lista, E13, E41, y partes de R4.11: el
cabezal no se arrastra, el celular no se desliza y Escape no suelta a la persona aislada); **un texto
que dice algo falso** («Cerró la sesión vencida» cuando la cerró un Administrador); **el rol sin
nombre** en `user.roles-changed`; **consultas dentro de un bucle** sin la prueba que las cuenta ni la
de tiempo con 730.000 acciones; y **una regla nueva escrita en `rules.md` sin rastro de que Carlos
la aprobó** («Ver quién hizo qué» incluye «Ver las personas»).

## Lo que ya se arregló

Todo lo que frenaba:

- **E09:** la fila lleva la marca «hora del celular, sin confirmar» al final del texto, en ámbar.
- **E13:** el marco conoce Quién hizo qué como algo de adentro de Usuarios con su propio permiso:
  abierta por la dirección sin él, muestra «No tenés permiso para Quién hizo qué» y no pide nada; si
  se lo sacan con la pestaña abierta, Usuarios la cierra como antes (02 · R7.8).
- **E41:** «Ver el día» abre el día del resumen; con un período de varios días, hoy.
- **R4.11:** el cabezal se arrastra sobre la pista y se pega a la más cercana de las que se ven; en
  el celular, deslizar de lado pasa de a una; con alguien aislado, Escape primero lo suelta.
- **`session.ended`** dice por qué terminó la sesión (venció, llegó a su tope, la cerraron desde
  Usuarios, la dieron de baja, salió).
- **`user.roles-changed`** lleva el rol con su nombre en `targets`.
- **Consultas en un bucle:** los días de la página y la semana de la cinta son tramos de una sola
  consulta por archivo; una prueba cuenta las consultas de cada pedido y otra, con 730.000 acciones,
  mide el tiempo (solo con `AUDIT_PERF=1`).
- **«Ver quién hizo qué» incluye «Ver las personas»:** Carlos la aprobó (§ 6).
- **Escenarios sin prueba:** E02, E03, E04, E10, E13, E16, E35 (los filtros), E41 y E42 (la misma
  página y la misma acción elegida) tienen la suya.

Lo marcado **Mejora** sigue como está y queda para después.

## 1. Escenarios sin cumplir

- **E09, en la lista** (`app/modules/audit-log/screens/Ledger.tsx:28` a `:31`). La regla pide que la
  entrada no confirmada vaya «en ámbar con la hora del celular y la marca «hora del celular, sin
  confirmar»» en la **lista**. La fila muestra la hora del celular (`deviceTime ?? at`) y el ámbar,
  pero no la marca: solo la tiene el detalle (`Detail.tsx:133` a `:139`). La prueba
  `audit-log-E21` mira solo «08:55». **Frena.**
- **E13** (`app/modules/users/state.ts:154` a `:173`, `users/screens/Users/Users.tsx:83`). Quien no
  tiene el permiso y abre `/users/audit-log` por la dirección debería ver «No tenés permiso para
  Quién hizo qué: hace falta «Ver quién hizo qué»» (02 · R7.7). El código lo devuelve a `/users`
  sin decir nada. Además `Body` monta `AuditLogTab` antes de que el efecto lo saque, así que sale un
  `GET /api/audit-log` que el servidor rechaza y anota como `permission.denied`: el registro dice que
  quiso usarlo cuando solo abrió una dirección. No hay prueba que nombre E13. **Frena.**
- **E41** (`screens/AuditLog.tsx:108`). «Ver el día» abre siempre `page.today`. La regla dice el día
  del resumen: con «Ayer» o con un día elegido a mano, ese día; solo con un período de varios días,
  hoy. La prueba («en el celular, «Ver el día» abre la cinta vertical de hoy») prueba solo sin
  filtros y no nombra E41. **Frena.**
- **R4.11, el cabezal** (`screens/TapeBoard.tsx:299` a `:313`, `screens/Tape.tsx`). «Se arrastra (y
  se pega a la más cercana)» y, en el celular, «con los botones o deslizando»: no hay ningún manejo
  de arrastre ni de deslizar; el cabezal se mueve tocando un punto, con los botones o con ← →. El
  diseño (§ 8, `Playhead`) también lo pide. **Frena.**
- **R4.11 y E46, Escape suelta a la persona aislada** (`Tape.tsx:191` a `:200`,
  `app/platform/keyboard.ts:119` a `:123`). Con alguien aislado, Escape cierra la cinta entera (la
  capa de arriba), no suelta a la persona. La prueba `audit-log-E46` solo prueba tocar la fila.
  **Frena.**
- **E48, «no se abre»** (`Tape.tsx:162`). Con más de 2.000 acciones la cinta **se abre** a pantalla
  completa y adentro dice que son demasiadas; la regla dice que no se abre y lo dice. Es una lectura
  posible, pero conviene confirmarla con Carlos o escribirla así. **Mejora.**
- **R4.6 y E34, «al tocar la pestaña»** (`users/state.ts`, `navigate` en `platform/router.ts:68`).
  Tocar «Quién hizo qué» estando en ella hace `pushState` a la misma dirección y la pestaña sigue
  montada: no pide nada. Desde otra pestaña sí, porque se monta de nuevo. La prueba de E34 solo
  prueba «Actualizar». **Mejora** (si la regla quiere decir también volver a tocarla, frena).
- **E05b, «al día siguiente»** (`server/modules/audit-log/routes.test.ts:43` a `:59`). La prueba
  pasa un día **y entra de nuevo**, así que la segunda línea puede salir por la sesión nueva y no por
  el día. Una sesión que cruza la medianoche no está probada. El código (`routes.ts:102`, clave
  `sesión|día`) parece correcto. **Mejora.**
- **Escenarios sin una prueba que los nombre** (constitución, VII): E02 (una acción que no se guardó
  no figura), E03 (lo cubre `sign-in-E02` sin nombrarlo), E04 (lo cubre `audit-log-E14` sin mirar el
  ámbar), E10 (la hora del servidor con el reloj del dispositivo atrasado), E13, E16, E35 en los
  filtros (Alt + P, A, F, T; solo está la de RePág y AvPág), E41 y E42 con «la misma página y la
  misma acción elegida» (`tape.test.tsx:63` a `:65` mira solo «25 acciones»). **Frena** (el estado
  sale de las pruebas que nombran el escenario).
- **E01 del diseño** (§ 11: «una acción de Usuarios deja su línea con la forma común después de
  confirmar; una que falla, no»): la prueba `audit-log-E01` (`write.test.ts:19`) prueba el
  almacenamiento, no una acción de Usuarios por la API. **Mejora.**

## 2. Comentarios de cabecera y carpetas

- Todos los archivos de código tienen su comentario y, salvo lo que sigue, dice lo que hace hoy.
- `app/modules/audit-log/index.ts:1` a `:3` explica bien por qué viaja con Usuarios, pero el diseño
  § 10 sigue diciendo «la pantalla, la cinta y sus íconos se bajan al abrir la pestaña» (ver § 8).
- `screens/Pieces.tsx`: el nombre no dice qué hay (el ícono, el nombre de la persona que filtra,
  quién y el texto de una acción). Algo como `ActionParts.tsx`. **Mejora.**
- `texts.ts:41` (`pickDates`) y `:50` (`who`) no se usan. **Mejora.**
- **Carpeta** `app/modules/audit-log/screens/` (14 archivos): `Tape.tsx`, `TapeBoard.tsx`, `Tape.css`
  y, desde la raíz, `tape.ts` comparten el concepto «la cinta» y podrían ir en `tape/`. La
  constitución pide agruparlos aunque no se llegue al tope. **Mejora.**

## 3. Pruebas que miran por dentro

- `src/server/audit-catalog.test.ts:20` a `:32`: busca los tipos anotados con una expresión regular
  sobre el **texto** del código (`record(c, '…'`, `type: '…'`, `answer(…'…'`). Un tipo armado de otra
  forma (una variable, una plantilla) se escapa, y un cambio de estilo rompe la prueba. Mejor: que
  cada módulo exporte la lista de tipos que anota y la prueba la compare con el catálogo. **Mejora.**
- `platform/storage/audit/query.test.ts:113` a `:138`: el plan de consultas se mira con SQL **escrito
  en la prueba**, no con el que arma `query.ts`. Si `where()` cambia, la prueba sigue pasando. Además
  no mira las combinaciones que de verdad salen (fecha más persona, fecha más tipo). **Mejora.**
- `write.test.ts:11` a `:14`, `:112` a `:118`: leen la tabla `people` con SQL y cuentan
  `openFiles().years`: dependen de las columnas y de los archivos abiertos. **Mejora.**
- `server/modules/users/audit.test.ts`: `audit-log-E06` y `audit-log-E30` prueban `personChanges` y
  `peopleNow`, ayudantes internos de Usuarios, en vez de la API (`routes.test.ts:130` a `:134` ya
  prueba E06 por la API). **Mejora.**
- `audit-log.test.tsx:73` a `:83`: E35d dispara a mano el evento `mark` del teclado de la plataforma
  en vez de pulsar ↓; depende de cómo se comunica el teclado. **Mejora.**
- `tape.test.tsx:40`, `:113`, `:115` miran las clases `.tape-line.on` y `.tape-dot.off`. Es lo que se
  ve, pero atado a nombres de CSS. **Mejora, menor.**

## 4. El código contra el diseño

- **Consultas dentro de un bucle** (`server/modules/audit-log/routes.ts:145` a `:156` y `:170` a
  `:174`). `daysWith` hace un `count` por cada día de la página (hasta 20, y cada uno por cada año
  del período), y `/day` hace 7 `group by tone`, uno por día. La constitución (XII, 2) dice «nada de
  consultas dentro de un bucle, una cantidad fija por pedido». El diseño decía «1 de `days`» y «1 de
  la semana (`group by` día)»; el último commit (`aca87c7`) cambió el diseño para que coincida con el
  código en vez de lo contrario. Las dos salen con una consulta `group by` día (con la hora del
  negocio como corrimiento fijo por año o con los cortes de día como parámetros). **Frena.**
- **La prueba que cuenta las consultas de cada pedido no existe** (diseño § 10, «cada forma con su
  prueba que las cuenta»; constitución, paso 6). Solo están las de `explain query plan`. **Frena.**
- **La prueba de tiempo con 730.000 acciones** (diseño § 10 y § 11: «fuera de `pnpm check`, que se
  corre antes de cerrar el módulo») no está en el repositorio. No se puede saber si se cumplen los
  150 ms ni que «una ruta cualquiera contesta igual» mientras corre. **Frena.**
- **`session.ended` con un texto falso** (`shared/audit-log/sign-in.ts:41` a `:48`,
  `sign-in/context.ts:66` a `:73`, `sign-in/access/routes.ts:145` y `:162`). Cerrar sesiones de
  otro, dar de baja o cortar un celular llaman a `store.ended(…, 'revoked')`, que anota
  `session.ended` a nombre de «El sistema», y el catálogo dice siempre «Cerró la sesión vencida de
  …», sin mirar `data.reason`. Así, cada vez que un Administrador cierra una sesión, el registro
  agrega «El sistema cerró la sesión vencida de Marcos», que no es cierto (R2.1: un texto que se
  entiende y dice qué pasó). El texto tiene que salir del motivo, o `revoked` y `deactivated` no
  anotarse como `session.ended` (ya los dice `session.closed`, `user.deactivated`, `phone.cut`). El
  diseño (§ 4) copió el texto del código. **Frena.**
- **El rol sin nombre en `user.roles-changed`** (`users/roles/routes.ts:72` a `:75`). El target
  `{ kind: 'role', id }` va sin `name`, y `withNames` (`write.ts:151`) completa solo personas. R2.4
  pide «la persona, el rol o la cosa … con el nombre que tenía en ese momento»; el detalle
  (`Detail.tsx:170`) pinta un renglón vacío en «A quién o a qué». **Frena.**
- **Lo que no tiene «desde dónde»** (`platform/permissions.ts:38` a `:45`, `platform/http.ts:161` a
  `:167`). `permission.denied` y `request.rejected` se anotan sin `device` (R2.6, E01: «desde
  dónde»); `permission.denied` es justo E04 y E14. Pasar por el `recorder` de `guards.ts`, o sumarle
  `deviceCodes`, lo resuelve. **Mejora** (frena si se lee E01 como «toda acción»).
- **La cuenta que se intentó usar no va en `targets`** con Google (`sign-in/google/routes.ts:90`).
  El diseño (§ 2.1) dice que en un intento de `outsider` «la cuenta que se intentó usar va en
  `targets`»; con la huella se hace (`webauthn.ts:161`), con Google no, aunque `match.user` existe
  (cuenta dada de baja, otra cuenta de Google con el mismo correo). «Hecho a: Marcos» no muestra los
  intentos de entrar con su cuenta dada de baja. **Mejora.**
- **Celulares y sesiones no van en `targets`** (`access/routes.ts:145` a `:150` y `:166` a `:167`).
  El diseño (§ 2.2) dice que van con su `public_id`; hoy solo va la persona. **Mejora.**
- **Validaciones de § 5 que no se hacen** (`rules.ts:60`, `:77`, `:82`; `routes.ts` en `/day`):
  `from` tiene como mínimo un `2020-01-01` fijo, no «el 1 de enero del año del archivo más viejo»;
  `/day?date=` no tiene mínimo («Como `from`»); `by` y `to` se validan solo por la forma, no contra
  `people.v1.sqlite`. Ninguna da datos de más, pero son distintas del diseño. **Mejora.**
- **`audit-log.opened` antes de validar** (`routes.ts:73`). Se anota en cuanto pasa zod, antes de
  ver si el período o el tipo sirven: un pedido que termina en `400` deja «Abrió Quién hizo qué».
  **Mejora.**
- **Los años se listan en cada consulta** (`source.ts:20`, `query.ts:44` a `:51`). El diseño (§ 5)
  dice «listados al arrancar y al crear uno nuevo»; el código lee la carpeta en cada `count`, `rows`
  y `tones` (varias veces por pedido). **Mejora.**
- **La tira con más de 2.000** (`routes.ts:165`). Pide hasta 100.000 rayas (`dayLimit * 50`) para
  quedarse con una por minuto; un día con más de eso pierde los últimos minutos. Un `group by`
  minuto con `max(id)` da 1.440 filas como mucho. **Mejora.**
- **Las acciones con nombre** (§ 8: `audit-log.refresh`, `audit-log.page`, `audit-log.filter`,
  `audit-log.select`, `audit-log.tape-*`) no existen en el código. Los últimos pasos de «Algo salió
  mal» guardan el rótulo del botón tocado (`frame/notices/crash/crash.ts`), salvo lo marcado
  `data-private`. O se programan o se sacan del diseño. **Mejora.**
- **El texto de `sign-in.rejected`** (`shared/audit-log/sign-in.ts:11` a `:22`): el diseño (§ 4)
  nombra `not-authorized` y `deactivated`; el código usa `unknown` e `inactive` (los motivos que de
  verdad anota `users/rules.ts:47`) y suma `other-subject`, `invalid-signature`, `code-expired` y
  `other-challenge`. `code.rejected` dice solo «desde otra red», no «vencido». `user.roles-changed`
  muestra `save`, el diseño dice `reason`. El código parece lo correcto; el diseño quedó atrás. **Mejora.**

## 5. Seguridad (§ 9 del diseño)

- **Qué datos toca / quién puede:** las tres rutas piden sesión y `audit-log.view`, con el `403`
  anotado y probado (`routes.test.ts:29`). Bien.
- **Nadie cambia ni borra:** no hay rutas que escriban; el hilo abre los archivos con `readOnly`
  (`source.ts:14`) y la escritura solo inserta. La prueba de E37 (`routes.test.ts:105`) prueba `POST`
  a dos direcciones; `PUT` y `DELETE` no. **Mejora.**
- **Autor:** `guards.ts:44` a `:50` pone la sesión, después `proven`, después `outsider`. `Proven`
  es un tipo marcado, pero `provenPerson` se exporta y cualquier módulo lo puede armar con cualquier
  `userId`: el freno es la convención, no el tipo. Lo dice también la revisión de seguridad. **Mejora.**
- **Lo que no sale:** `shownData` filtra `data` por tipo. La prueba que pide el diseño («anota cada
  tipo de hoy y mira que la respuesta no trae ningún identificador de dispositivo ni de huella», § 2.2
  y § 11) prueba un solo tipo (`routes.test.ts:230` a `:235`). **Mejora.** Google anota `subject` y
  `storedSubject` en `data` (`google/routes.ts:84` a `:89`); no salen (no están en `shows`), pero
  quedan guardados.
- **Lo que entra de afuera:** zod estricto (`contracts/audit-log.ts:74` a `:90`) y SQL siempre con
  parámetros (`query.ts:157` a `:173`). Bien. `entryOf` con un `type` como `constructor` o
  `toString` devuelve la propiedad de `Object.prototype` (`shared/audit-log/index.ts:101`): hoy
  termina en una lista vacía, pero `Object.hasOwn` lo cierra. **Mejora.**
- **Abuso:** 60 por minuto por persona, probado; páginas fijas; la consulta de a una en su hilo; el
  período de miles de años sin crear archivos, probado en la consulta (`query.test.ts:142`), no por
  la ruta. Dos cosas crecen sin tope en memoria: `closedTotals` (`query.ts:40` y `:62`, una clave por
  combinación de filtros y fechas) y el conjunto de `openedOnce` (`routes.ts:102`, una por sesión y
  día). **Mejora.**
- **Secretos:** ninguno. No se usa `createTagStore`. No pude comprobar que el armado de la imagen
  diga la versión de Node.
- **Lo que queda en la auditoría:** el límite pasado (probado), el permiso negado (probado) y
  `audit-log.opened` (probado, con la salvedad de E05b). `/people` y `/day` no anotan nada (así lo
  dice R1.3 hoy).
- **«Algo salió mal»:** el detalle, los nombres, el correo de afuera, la lista de filtros y las filas
  de la cinta llevan `data-private` (probado en parte, `audit-log.test.tsx:148`). El diseño dice que
  `Ledger` y `Filters` lo llevan enteros; el código lo pone en las partes con personas, que alcanza
  para lo que pide 00 · R9.4.

## 6. Reglas inventadas

- **«Ver quién hizo qué» incluye «Ver las personas»** (`shared/contracts/permissions.ts:50`). Se
  agregó en el código (`6c15e03`) y después se escribió en las reglas aprobadas (05 · R3.1, línea 60,
  y 02 · R7.1) en el commit de documentación (`aca87c7`), que no dice que Carlos lo haya decidido. El
  diseño aprobado lo tenía en `includes: []`. Puede ser lo correcto (la pestaña está dentro de
  Usuarios), pero es una regla de permisos nueva: se le pregunta a Carlos y se anota que la aprobó.
  **Frena.** Carlos la aprobó tal cual: quien ve Quién hizo qué ve también las personas.
- **Los colores como opciones del filtro «Tipo»** (`filter-options.ts:454` a `:457`: «Rechazos y sin
  confirmar», «Lo que borra o saca»). R4.5 dice que «Tipo» filtra por grupo y por tipo; el filtro
  por color lo pone el resumen (R4.9). Sirve para que la pastilla diga qué filtro está puesto, pero
  ofrecerlo en la lista es una opción nueva. **Mejora** (escribirlo en las reglas o sacarlo).
- **Tocar el total saca también el grupo o el tipo** (`state.ts:93` a `:97`): R4.9 dice que tocar el
  total saca los dos filtros de color; `byTone(undefined)` borra todo `kind`, también un grupo
  elegido a mano. **Mejora.**
- **El número de rechazos cuenta todo lo ámbar**, también la entrada sin conexión no confirmada,
  que no es un intento rechazado (R4.9 dice «cuántos intentos rechazados»). El diseño lo eligió así;
  conviene que la regla lo diga. **Mejora.**

## 7. Simpleza y repetición

- Tipos repetidos a propósito para no importar la plataforma desde las reglas: `Filter` y `Mark` en
  `modules/audit-log/rules.ts:31` a `:57` y `:163` y en `query.ts:17` a `:33`; `Stored` copia
  `StoredEvent`. Si uno cambia, el otro no se entera. Un tipo de la consulta en
  `src/shared/contracts/` (sin tecnología) lo evita. **Mejora.**
- `toneNames` está en `codec.ts:70` y `query.ts:36`; pasar una fila de `people` a `PersonUpdate`,
  en `write.ts:129` a `:147` y `query.ts:120` a `:133`. **Mejora.**
- `knowPeople` guarda en memoria el nombre sin cortar (`write.ts:86`) aunque al disco va cortado.
  **Mejora, menor.**
- `useLoading` (`state.ts:50` a `:60`) no descarta respuestas viejas: dos filtros seguidos pueden
  terminar mostrando el primero. Un `400` con una página ya cargada no muestra nada (`failed` solo se
  ve sin página). **Mejora.**
- `Tape.tsx:45` escribe `'Hoy'` en el código, fuera de `texts.ts`. **Mejora.**

## 8. Documentación que quedó atrás

- Diseño § 10: «la pantalla, la cinta y sus íconos se bajan al abrir la pestaña» contradice § 8
  («viaja con la pantalla de Usuarios»). Constitución XII, 2 dice que cada módulo se baja recién al
  abrirlo: si se acepta la excepción, que lo diga el ADR o la arquitectura.
- Diseño § 4: los motivos de `sign-in.rejected`, `code.rejected`, `shows` de `user.roles-changed` y
  el texto de `session.ended` (ver § 4 de esta revisión).
- Diseño § 8: las acciones con nombre, la pieza `Playhead` con arrastre, Espacio/Alt+R (el código
  usa Alt+R en `Tape.tsx:139`; la maqueta, Espacio).
- Diseño § 5: el mínimo de fechas `2020-01-01` (`rules.ts:60`) no está escrito en ningún documento.
- Las opciones de color en el filtro «Tipo» y sus textos no están en el capítulo ni en el diseño.
- Diseño § 5 `/day`: «sus nombres de hoy, de `/people`, que la pantalla ya tiene»; la cinta usa el
  nombre de cada acción (`tape.ts:111` a `:119`), no `/people`.

## 9. Pantallas

No las vi funcionando: lo que sigue sale de comparar el código con las capturas de las maquetas.

- **La lista** (variante 1, computadora y celular): la maqueta lleva el círculo con las iniciales de
  quién lo hizo en cada fila; el código pone el ícono del tipo (lo que agregó Carlos) pero no el
  círculo (`Ledger.tsx:27` a `:34`, `Pieces.tsx:264`). Falta la ayuda del pie «↑ ↓ recorrer · RePág
  AvPág página». **Mejora** (es la maqueta «tal cual»).
- **El detalle**: la maqueta tiene la pastilla «grupo · tipo» (p. ej. «Roles · Sacó un rol»), los
  bloques «Quién» y «A quién o a qué» con la persona en tarjeta («Ver todo lo que hizo», «Ver lo que
  le hicieron») y «Roles de Martín Sosa» como título del cambio. El código muestra solo la pastilla
  del color, la oración con quién, una lista simple en «A quién o a qué» y el nombre del campo.
  **Mejora.**
- **La tira**: la maqueta dice «El día, de 7 a 11»; el código, «El día, acción por acción» con
  «Tocá una raya para verla». **Mejora.**
- **La cinta** (variante 3): faltan la leyenda (hizo algo, se lo hicieron, borra o saca, rechazo),
  la ayuda de teclas, el eje de horas abajo con la hora del cabezal, el punto hueco en la fila de
  quien lo recibió y «hizo 8 · recibió 3» (el código pone «8 · 3»). Los días de arriba dicen
  «28/10» y no «mié 28». El subtítulo es el detalle entero, no la franja de la maqueta (hora grande
  a la izquierda, oración, pastillas y el dispositivo a la derecha). **Mejora.**
- No pude comprobar el celular de la cinta (vertical) ni los colores y separaciones.

## 10. Lo que se podría extraer a una librería

El módulo agregó y cambió bastante de lo no funcional:

- **La auditoría en SQLite** (`src/server/platform/storage/audit/`: archivos por año, tanda por
  segundo, columnas con índice más `payload` comprimido, corte a 8 KB, lectura de solo lectura en un
  hilo, totales de años cerrados). Serviría a cualquier proyecto que tenga que guardar «quién hizo
  qué» sin cargar la base principal. Lo atan: la tabla `people` con sus estados y el borrado del
  correo (02 · R3.7, `write.ts:182` a `:186`), y los colores `plain/amber/red` como columna. Grupo:
  base del servidor (o uno nuevo, «auditoría»). Cambio chico: que `people` y el cálculo del nombre
  sean un complemento que se registra, y que el color sea una «marca» numérica genérica.
- **El autor de cada acción** (`platform/guards.ts`: `recorder`, `Proven`, `request.throttled` una
  vez por ventana). Sirve igual en otro negocio. Lo atan los comentarios que citan capítulos y el
  `topic` libre. Grupo: base del servidor. Cambio chico: sacar `recorder` a su propio archivo.
- **El dispositivo en códigos** (`platform/device.ts`). Genérico; lo ata `deviceLabel`, con texto en
  castellano («Chrome en Android», «Otro navegador»). Grupo: base del servidor. Cambio chico: llevar
  `deviceLabel` a `sign-in`, que es quien arma ese texto.
- **Los días del negocio** (`src/shared/time/business.ts`). Genérico; lo ata la zona de Buenos Aires
  escrita adentro. Grupo: base del servidor y de la aplicación (código compartido). Cambio chico:
  recibir la zona como parámetro, que el 06 igual va a necesitar.
- **El motor del catálogo** (`src/shared/audit-log/kinds.ts`: `Entry`, `Piece`, `says` en trozos,
  `shownData`). La idea sirve a cualquier registro que se muestre sin HTML; lo atan los grupos con
  nombres de Ferrebress en el mismo archivo. Grupo: uno nuevo, «auditoría» (servidor y aplicación).
  Cambio chico: los grupos a `index.ts` y `kinds.ts` solo con los tipos.
- **RePág y AvPág** (`app/platform/keyboard.ts`, `data-page`). Genérico. Grupo: base de la aplicación
  (teclado). Nada lo ata.
- **La cinta** (`screens/Tape.tsx`, `TapeBoard.tsx`, `tape.ts`, `Tape.css`): una línea de tiempo con
  filas, puntos, líneas y reproducción. Podría ser una pieza visual, pero está escrita sobre
  `AuditView` y los textos del módulo. Grupo: piezas visuales. Cambio chico: que `TapeBoard` reciba
  filas y puntos genéricos (`id`, instante, fila de origen, filas de destino, color).
- **Los íconos** (`app/ui/icon/audit-log-shapes.tsx`, copiados de Lucide). Genéricos. Grupo: piezas
  visuales. Nada los ata salvo el nombre del archivo.
- **El control del catálogo** (`src/server/audit-catalog.test.ts`). Es calidad, pero lee el código
  con una expresión regular atada a cómo se escribe hoy. Grupo: calidad. Cambio chico: que cada
  módulo declare sus tipos (ver § 3).

**Hoy no conviene extraer nada:** la auditoría es lo más valioso, pero se acaba de rehacer, todavía
tiene a `people` y los colores del negocio adentro, y no hay un segundo proyecto que la use; conviene
primero el cambio chico de separar `people` y esperar a un segundo consumidor.

## Actualizar solo (T118)

Revisión del código de T118, commits `fbf8b11` a `65e37f3` (`git diff 4dc85b0~1..HEAD -- src tests
deploy`), contra 05 · R4.6, R4.12, E34, E49 a E56; 03 · R4.5, E45, E46; 01 · R3.3; la maqueta
`mockups/users-who-did-what/final/` con su `changes.md`; y [audit-log.md](audit-log.md) §§ 5, 7, 8,
8.1 y 9 a 13 con las secciones «Actualizar solo (T118)» de sus dos revisiones. Lo demás del módulo,
ya revisado arriba, no se repite.

Corrí las pruebas que tocan T118 (`vitest run` sobre `app/modules/audit-log`, `app/platform/meter`,
`app/platform/realtime`, `server/modules/audit-log`, `server/platform/storage/audit`,
`server/platform/realtime`, `permissions`, `sign-in/sessions`, `routes-permissions` y las pantallas
del vínculo): 236 pasan, 1 saltada (la de tiempo, `AUDIT_PERF`). No corrí `pnpm check`, ni las
capturas, ni la de punta a punta de Usuarios (necesitan Docker), y no vi las pantallas funcionando:
lo visual sale de comparar las capturas del manual con las de la maqueta.

### Resumen

La forma es la del diseño y está bien armada: el aviso `{}` con clave `all` y como mucho cada 5 s,
`onWritten` fuera de la pila y aislado, `permissions.of` con la nueva mirada después de la microtarea,
`permission.denied` al abrir o sumar el tema, `since` acotado a los dos años vivos, `X-Auto` con su
límite por sesión y sin tocar `lastUsed`, el medidor en bytes por tema, el código del rechazo en el
canal y `/api` comprimido sin el SSE. En lugar de una transacción de lectura, la foto del pedido es
`latest` leído primero y un `id <= n` por archivo (`where.ts`), que da lo mismo.

Lo que frena: **una puesta al día sola puede sacar de la página la acción elegida**, y el detalle de
la computadora queda vacío o la hoja del celular se cierra sola. Y queda **sin comprobar en un
navegador** que «arriba de todo» mire el contenedor que de verdad se desplaza.

### 1. Escenarios sin cumplir

- **La acción elegida se pierde con una puesta al día — Frena.** `state.ts` y `loading.ts:75-80`:
  `refresh` reemplaza la página y no toca `selected`; el detalle busca la elegida en la página nueva
  (`screens/AuditLog.tsx:47`). Si entran acciones nuevas y la elegida pasa a la página 2 (en la
  computadora, una de las últimas de 20 con 3 nuevas; en el celular, con 10 por página), la
  computadora muestra «Elegí una acción de la lista…» y en el celular la hoja abierta desaparece sola, con el
  foco en una fila que ya no está. R4.7 («muestra la acción elegida») y la maqueta («la acción
  elegida en el detalle no cambia», E50) dicen lo contrario. La prueba de E50 elige la primera fila,
  que nunca sale. Alcanza con guardar la acción elegida que mostraba la página anterior mientras siga
  elegida.
- **«Arriba de todo» en el navegador de verdad — no pude comprobarlo; frena si falla.**
  `loading.ts:28-29` mide `scrollTop` de `.audit-ledger`. Las pruebas ponen `ledger.scrollTop = 200` a
  mano en happy-dom (`live-edges.test.tsx:56-57`), que no dibuja: pasan sea cual sea el contenedor
  que se desplaza. En las capturas del manual (`desktop-audit-log.webp`, `phone-audit-log.webp`) la
  lista sigue por debajo del borde y no se ve el paginador, a diferencia de la maqueta, donde la
  lista se desplaza adentro. Si quien se desplaza es la página o el marco, `scrollTop` de la lista
  vale siempre 0: en la página 1 la lista se mueve aunque la persona haya bajado (R4.6, E51), y
  «3 nuevas» no la sube (`ledger()?.scrollTo`). La constitución (VII) pide probarlo en el navegador
  de verdad: una captura que baje la lista, mande un aviso y mire que no se mueva.
- **E50, el resumen y la tira — Mejora.** `live.test.tsx:50-64` mira el total y la marca, no que el
  resumen y la tira se pongan al día (lo que E50 nombra).
- **E54, «al volver a la vista, una puesta al día» — Mejora.** Del lado de la pantalla solo se
  prueba que oculta no pide (`live.test.tsx:106-120`). El canal de mentira (`audit-test-kit.tsx`,
  `fakeChannel`) no manda el `{}` del alta, así que nada prueba la vuelta ni lo del punto 4 de abajo
  (la carga de más al abrir). El servidor sí prueba que el alta manda `{}` (`live.test.ts:93`).
- **E34** está cubierto en parte: la prueba de E34 (`live.test.tsx:39-48`) manda el aviso cuando no
  hay nadie escuchando, así que comprueba que apagado no se suscribe, no que se ignore un aviso. Lo
  segundo sí lo prueba `live-edges.test.tsx:154-170` (apagado con el tema todavía pedido). Está bien
  así; conviene nombrar E34 en esa prueba.
- E49, E51, E52, E53, E55, E56 y 03 · E45, E46 tienen su prueba y comprueban lo que dicen.

### 2. Comentarios de cabecera y carpetas

- `app/platform/realtime/sse.ts:1-7`: la cabecera no dice que cada bloque se mide para el medidor
  ni que el rechazo trae el código del servidor. `channel.ts:1-5` tampoco nombra el medidor. **Mejora.**
- `server/modules/audit-log/settings.ts:6`: «Las consultas por sesión», pero `reads` es por persona
  (`routes.ts:42-45`, y la cabecera de `routes.ts` lo dice bien). Venía de antes; T118 tocó el
  archivo y sumó `autoReads`, que sí es por sesión: hoy los dos comentarios se contradicen. **Mejora.**
- `app/ui/switch/` tiene solo `switch.css`: la «pieza» es una clase, y el marcado
  (`<span class="switch" aria-hidden>` dentro de un botón con `role="switch"`) se repite en
  `PhoneMore.tsx:103-120` y `Live.tsx:16-32`. Un `Switch.tsx` haría de la carpeta una pieza. **Mejora.**
- Las demás cabeceras nuevas (`live.ts` de los dos lados, `loading.ts`, `answers.ts`, `where.ts`,
  `meter.ts`, `Live.tsx`, `Live.css`) dicen lo que hace el archivo hoy.

### 3. Pruebas que miran por dentro

- `live-edges.test.tsx:172-185` («Alt + N y Alt + R»): mira `dataset.key`, no aprieta las teclas.
  Un cambio en cómo el teclado de la plataforma lee las teclas no la rompe. **Mejora.**
- `server/modules/audit-log/live.test.ts:131-165`: E52 del servidor prueba `createNotifier`, que se
  exporta solo para eso, no la fachada (escribir diez tandas y contar avisos en el canal). **Mejora.**
- `newer.test.ts:80-87` arma la consulta con `where` en lugar de pedir `newer`; es la forma de mirar
  el plan y se acepta, como las de arriba.

### 4. El código contra el diseño

- **Los totales de los años cerrados ya no se guardan — Mejora importante.** `query.ts:60`: la clave
  es `JSON.stringify(filter)`, y el filtro ahora lleva `upTo`, que cambia con cada tanda escrita. Para
  los años anteriores a los dos vivos `upTo` no agrega condición, pero la clave cambia igual: cada
  pedido con un período de varios años vuelve a contar todos los años viejos, y cada puesta al día sola
  suma entradas nuevas a la memoria hasta el tope de 1.000, que la vacía. Contradice § 5 («los totales
  de los años cerrados se guardan en memoria») y la meta de tiempo con el período más largo. La prueba
  «los totales de los años cerrados se guardan» (`query.test.ts:134`) usa un filtro sin `upTo`, por
  eso pasa. Sacar `upTo` de la clave cuando el año no está en él.
- **Una carga de más al abrir — Mejora.** El tema se pide recién con la primera lista (`withToday`),
  el alta manda `{}` y `notice` pide la lista entera otra vez, con el resumen y la tira (unos 4 KB en
  la computadora). Lo mismo cada vez que una fecha vuelve a incluir hoy. § 7.2 pone al día con el
  primer aviso «al prenderlo, volver a la vista o volver la conexión», no al abrir. Ignorar el
  primer `{}` si la lista llegó hace menos de `everyMs`, o no pedir si la última lista es posterior al
  alta.
- **«n nuevas» viejo después de un pedido de la persona — Mejora.** `loading.ts:83-98`: `count` no
  mira `loading`. Si la persona pasó de página (cambia `text`) y llega un aviso antes de la respuesta,
  `count` usa el `latest` de la página anterior; la página nueva llega y borra el aviso
  (`setNewOnes(0)`), y después llega la cuenta y lo vuelve a poner con acciones que ya estaban antes
  de esa página. Al tocarlo no se marca nada. Es el caso T.4.2 de la revisión de diseño con la misma
  vista.
- **Con `429` y la persona ya más abajo, pide igual — Mejora.** `loading.ts:76-77`: `moved` se mira
  antes de `result.ok`; un `429` de la lista con la persona más abajo devuelve `moved` y `run` pide
  `/new` en el momento, sin esperar lo que dijo el servidor.
- **Un aviso con un pedido de la persona en vuelo se descarta — Mejora menor.** `loading.ts:72`: el
  diseño lo acepta («trae lo nuevo igual»), pero si el pedido leyó antes de que se escribiera la tanda,
  lo nuevo espera al próximo aviso. La prueba `live-edges.test.tsx:187` fija ese comportamiento.
- **Prenderlo sale como pedido solo — Mejora.** `live.ts:128` → `refresh` → `auditApi.page(…, true)`:
  prender el selector va con `X-Auto`, aunque § 7.2 dice que «prenderlo es un toque». Así no cuenta
  como uso de la sesión (01 · R3.3 solo excluye lo que se pide «sin que nadie la toque») y queda frenado
  por la pausa de un `429` anterior. Además, si la persona está en la página 2, prender pide «n
  nuevas» y no la lista; R4.6 dice «prenderlo pone la lista al día en el momento». Hay que decidir cuál
  vale y escribirlo.
- **`since` repetido — Mejora menor.** `rules.ts:196-202` acepta `2026:5.2026:5` y `newer` cuenta ese
  archivo dos veces; y acepta un solo par, cuando § 5 dice «dos `AAAA:n`». Solo afecta a quien lo
  arma a mano.
- **El medidor suma la conexión por bloque, no por trozo** (`sse.ts:166`, `channel.ts` `measure`):
  § 8.1 dice «por cada trozo que lee, con su largo antes de decodificarlo, más unos 80 bytes por
  trozo». El código vuelve a codificar cada bloque SSE (da los mismos bytes) y suma los 80 a cada
  bloque. Varios eventos en un trozo cuentan la conexión de más. Es un número aproximado (03 · R4.5);
  alcanza con que el diseño diga lo que se hace. **Mejora.**
- **Metas sin su prueba — Mejora.** § 10: `/new` en «como mucho 2 consultas» y «menos de 20 ms con
  un año», y `latest` «suma 2 consultas a la lista». `recorded.test.ts` no cambió: no cuenta las de
  `/new` y su comparación entre día y semana no ve las 2 de `latest` (suman igual en las dos). La de
  tiempo (`query-perf.test.ts`) tampoco pide `/new`.
- Lo demás coincide: rutas, tema, clave, `recheckOn`, `permissions.of`, la microtarea del recheck,
  `onWritten`, `X-Auto` (límite de 30 por sesión, sin «Abrió», sin `lastUsed`), `withToday`,
  `latest` de los dos archivos vivos, el tope de 100, `releaseMs`, `markMs`, `topPx`, el `0` al
  apagar y el `encode` del Caddyfile.

### 5. Seguridad (§ 9, «Actualizar solo» y «El medidor»)

- **Hecho como dice:** el aviso es `{}` (`event: z.strictObject({})`); el tema pide `audit-log.view`
  con `permissions.of(userId)` al abrir y al volver a mirar; sin él se anota `permission.denied` con
  el tema, una vez por minuto, solo cuando hay pedido (abrir o sumar); el recheck corre después de lo
  que borra la memoria, con su prueba registrada después del tema (`realtime.test.ts:212`); `since`
  solo con los dos años vivos y enteros seguros, sin crear archivos; `X-Auto` con su límite por
  sesión; el medidor no sale del dispositivo; temas cerrados por defecto con su tabla
  (`routes-permissions.test.ts`).
- **Sin prueba:** que el recheck sin permiso **no** anote `permission.denied` (`live.ts:45`, la rama
  `request` vacía). La de «si le sacan el permiso» no lo mira. **Mejora.**
- **La compresión de `/api` y BREACH — Mejora, no comprobado.** `deploy/Caddyfile:56-63` comprime toda
  respuesta JSON de `/api`. Una respuesta que mezcla un secreto con texto que elige otro, comprimida,
  puede filtrar el secreto por el tamaño. La revisión de seguridad no lo trató y no revisé qué
  respuestas JSON llevan un secreto (códigos de un solo uso, retos de la huella). Que § 9 diga cuáles
  no se comprimen o por qué no hace falta.

### 6. Reglas inventadas

- Ninguna nueva. El selector deshabilitado sin conexión (`Live.tsx:26`) sigue lo que hacía
  «Actualizar» y R5.1 (gris), y «Más de 99 nuevas» está en § 5.

### 7. Simpleza y repetición

- `server/modules/audit-log/live.ts:41-54` (`refuse`) repite `denied` de `platform/permissions.ts:35-46`:
  la misma clave de límite, la misma forma de la acción; cambia `path` por `topic`. Y
  `deniedAudit` está dos veces (`platform` y `audit-log/settings.ts:95`). La puerta podría dar
  `denied(request, permiso, datos)`. **Mejora.**
- La cabecera `X-Auto` se interpreta en dos lugares (`routes.ts:119` `isAuto` y
  `sign-in/sessions/require.ts:46`). Un `isAutomatic(c)` en la plataforma. **Mejora.**
- `app/modules/audit-log/live.ts:32-35` (`outcomeOf`) repite `retryAfterMs` de
  `platform/realtime/sse.ts:115-118`, con el `60` segundos escrito fuera de un `settings.ts`
  (constitución XII, «los tiempos y los topes, con nombre»). **Mejora.**
- `isNewer` (`logic.ts`) vuelve a leer el texto de `latest`, que el servidor ya sabe leer
  (`sinceOf`); está bien que no se comparta (uno valida, el otro compara), lo dejo anotado.

### 8. Documentación que quedó atrás

- § 5 «Todo un pedido lee una misma foto» describe `begin … commit` por archivo; el código lee
  `latest` primero y filtra `id <= n` (`answers.ts:203-204`, `where.ts:24-29`), con un año posterior a
  la foto excluido. Otro agente programaría la transacción. **Mejora.**
- § 7.2 «Si le sacan el permiso, Usuarios cierra la pestaña»: el código pide la lista
  (`state.ts:133`, `lost: () => void refresh()`) para que el `403` llegue a la aplicación y Usuarios
  la cierre. El diseño no lo dice. **Mejora.**
- § 7.1 «el hub contesta `403` con `{ code: 'forbidden' }`»: contesta `{ error: 'forbidden' }` (lo
  que da `fail`), y `sse.ts` lee `error`. **Mejora.**
- § 8 (`Live`) dice «la etiqueta `audit-log` del medidor»; § 8.1 y el código usan `audit-log.new`.
  **Mejora.**
- § 8.1, la suma de la conexión por trozo (punto 4).

### 9. Pantallas

No las vi funcionando; comparo `docs/manual/media/desktop-audit-log.webp` y `phone-audit-log.webp`
con `screenshot.png` y `screenshot-phone.png` de la maqueta final.

- **El lugar del selector — Mejora.** La maqueta lo pone arriba a la derecha, en el renglón del
  título «Usuarios»; el código, en `audit-tools` debajo de las pestañas (`AuditLog.tsx:97`), en un
  renglón propio que en la computadora no tiene nada más y empuja todo hacia abajo. En el celular
  queda al lado de «Ver el día», que en la maqueta va junto a «46 acciones».
- **La raya nueva de la tira «crece desde abajo»** (maqueta, E50): no está; `Summary` no cambió.
  **Mejora.**
- **«0,0 KB/min»** donde la maqueta dice «0 KB/min»: el código sigue a § 8.1 («una decimal»); la
  maqueta y el diseño no coinciden. **Mejora** (decidir uno).
- «3 nuevas» va con `position: absolute` sobre la lista y la maqueta con `sticky` de alto 0: se ven
  igual mientras la lista se desplace adentro (ver el punto 1, sin comprobar).
- La marca (borde verde 1,2 s después de 0,2 s, entrada desde 8 px, nada con «reducir movimiento»),
  la tarjeta «Aplicación: … KB/min» y el renglón de la pastilla coinciden con la maqueta.

### 10. Lo que se podría extraer a una librería

T118 sumó o cambió varias piezas no funcionales:

- **El medidor** (`app/platform/meter.ts`): 60 casillas de un segundo por etiqueta, sin temporizador
  propio, leído cada 5 s solo a la vista. Serviría a cualquier aplicación que quiera mostrar lo que
  gasta en datos. Lo ata: `kbPerMinute` con `es-AR` y el texto «KB/min» en la plataforma. Grupo: base
  de la aplicación (tiempo real). Cambio chico: el formato a `ui/` o a los textos, y el medidor junto
  al canal en `platform/realtime/`.
- **La cuenta en el canal** (`realtime/sse.ts` `onBytes` y el código del rechazo; `channel.ts`
  `measure`, con el latido para el único tema). Genérico, nada del negocio. Grupo: base de la
  aplicación (tiempo real).
- **`X-Auto`** (`shared/contracts/server-header.ts`, `sign-in/sessions/store.ts` y `require.ts`, el
  límite aparte en `routes.ts`): «lo que una pantalla pide sola no alarga la sesión ni cuenta como
  toque». Sirve a cualquier proyecto con sesiones por inactividad. Lo ata que la lectura de la cabecera
  esté repartida entre `sign-in` y un módulo de negocio. Grupo: identidad (sesión) y base del
  servidor. Cambio chico: `isAutomatic(c)` en la plataforma y un `guards.limit` que elija la clave por
  esa marca.
- **El aviso por el canal** (`server/modules/audit-log/live.ts` `createNotifier`; `onWritten` en
  `storage/audit/write.ts`; `permissions.of`; la nueva mirada después de la microtarea en
  `realtime.ts`; `realtime.topics()` y la tabla de temas cerrados por defecto). `createNotifier` es
  un «publicar como mucho cada n ms, juntando» que no sabe de auditoría; el resto ya está en la
  plataforma. Lo ata: `createNotifier` vive en el archivo del tema de negocio. Grupo: base del
  servidor (tiempo real); la tabla de temas, calidad. Cambio chico: llevar `createNotifier` a
  `platform/realtime/` como opción del tema (`throttleMs`).
- **La llave** (`app/ui/switch/switch.css`). Pieza visual de «Mostrador», atada a sus colores
  (`--pine`) y solo CSS. Grupo: piezas visuales. Cambio chico: un `Switch.tsx` con `role="switch"`,
  `aria-checked` y la llave, que usen Más y «Actualizar solo».
- **Comprimir `/api`** (`deploy/Caddyfile`, `encode` solo JSON). Genérico. Grupo: despliegue.
- **La foto del pedido** (`storage/audit/where.ts`, `upTo`). Es parte de la auditoría en SQLite que
  ya se analizó arriba; no cambia la conclusión.

**Hoy no conviene extraer nada:** son piezas chicas, recién hechas y con un solo consumidor cada una;
lo que más rinde es el cambio chico de `X-Auto` y de `createNotifier`, que las deja en la plataforma
sin nombres del negocio, para cuando aparezca un segundo uso.
