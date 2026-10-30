# Revisión de seguridad · 02 · Personas (`users`), etapa a

## Paso 4: el diseño

Revisión independiente del [diseño](users.md) desde el punto de vista de un atacante (constitución,
paso 4). Todavía no hay código del módulo 02, pero el diseño cambia tablas y rutas de 01 y se apoya
en lo que ya está programado. Leí la constitución, el capítulo
[02 · Personas](../../chapters/02-users/rules.md) (etapa a), la [arquitectura](../architecture.md),
el [ADR-004](../adr/ADR-004-audit-log-in-sqlite.md), el [diseño de 01](sign-in.md) (§ 3, § 4, § 6,
§ 8, § 13 y § 14), el [diseño de 15](offline.md) (cómo se apaga «Trabajar sin conexión») y la
[revisión de seguridad de 01](sign-in-security-review.md). Revisé el código ya programado del que
depende el diseño: `src/server/modules/users/`, `src/server/modules/sign-in/` (sesiones, huellas,
Google y sin conexión), `src/server/platform/` (`http.ts`, `guards.ts`, `events.ts`, `config.ts`,
`storage/audit.ts`), `src/app/modules/frame/notices/crash/crash.ts`, `deploy/oracle/install.sh` y
`tests/e2e/stack/start.ts`. Todavía no hay revisión del diseño (`users-design-review.md`).

Lo que decidió Carlos no se discute: en la etapa a cualquiera con sesión puede hacer todo (R1.1);
autorizar es solo nombre y correo, de cualquier dominio (R3.3); «Cerrar», «Quitar» y «Cortar» van
sin confirmación. Solo se señalan los riesgos que eso trae y que el diseño no cubre.

- **Frena:** se puede entrar, ver o cambiar lo ajeno, o filtrar datos personales. Se resuelve antes
  de aprobar el diseño.
- **Mejora:** conviene hacerla; no frena.

Todo lo de esta revisión sale de leer el diseño y el código: no corrí ningún ataque (no hay código
del módulo para correrlo). Donde cito el código de 01 es porque el diseño dice que «ya está» y lo
usa tal cual.

## Resumen

El diseño está bien orientado en lo que más importa: no hay ninguna ruta que cree a alguien sin
sesión (el primer Administrador sale de un comando dentro del servidor), el correo de quien ya entró
no se puede cambiar (así nadie queda entrando con un correo que ya no figura), la baja cierra
sesiones y quita huellas en la misma transacción, «nunca sin Administrador» se cuenta con las filas
bloqueadas, y cada cambio lleva la versión que vio.

El problema serio está en una pieza de 01 que el diseño da por buena: **la caché de sesiones se
vacía antes de que la base confirme el cierre**. Quien sabe que lo van a dar de baja puede, con un
programa que repite pedidos, volver a meter su sesión en la memoria del servidor en ese instante y
quedarse con una sesión que vale hasta 8 horas; con ella se da de alta a sí mismo, porque «Dar de
alta» no mira si es la propia. Le suma que no existe el límite de pedidos con sesión que § 10 dice
que existe.

| # | Punto | Gravedad |
|---|---|---|
| 1 | La caché de sesiones se vacía antes de confirmar: una sesión cerrada o de una persona dada de baja sigue valiendo | **Frena** |
| 2 | No hay límite para los pedidos con sesión, y una cookie inventada cuesta una consulta | Mejora |
| 3 | «Activa» y «nunca entró» se miran antes de escribir, no al escribir | Mejora |
| 4 | «Quitar», «Cortar» y la baja no avisan a la memoria de quién es la huella de cada celular | Mejora |
| 5 | Cerrar por `device_id` no alcanza a las sesiones abiertas con esa huella desde otro identificador | Mejora |
| 6 | La API muestra el identificador de cada huella y de cada celular, que sirven para bloquear a otro | Mejora |
| 7 | Una sesión ajena (desatendida o robada) se vuelve acceso para siempre | Mejora (decide Carlos) |
| 8 | La auditoría: los rechazos no quedan, lo de la transacción se anota antes de confirmar y el comando no deja traza | Mejora |
| 9 | El primer Administrador: las pruebas de punta a punta, dos comandos a la vez y lo que lee | Mejora |
| 10 | Lo que entra: nombres, el identificador de la huella y la versión | Mejora |
| 11 | «Algo salió mal» guarda el nombre de la persona en los pasos | Mejora |
| 12 | Dos bajas a la vez pueden trabarse entre sí | Mejora |

---

### 1 · La caché de sesiones se vacía antes de confirmar (§ 6 «Dar de baja» y «Cerrar, Cerrar todas, Quitar y Cortar»; `sign-in/sessions/store.ts:105-118`, `sign-in/index.ts:49-52`) — **Frena**

**Qué pasa en el código que el diseño usa.** La baja publica `user.deactivated` dentro de su
transacción; `sign-in` la escucha y llama a `closeForUser`, que hace el `update` de las sesiones
**dentro de la transacción todavía sin confirmar** y enseguida las saca de la memoria
(`memory.forget(ids)`, línea 117). La transacción sigue (el diseño le suma quitar las huellas) y
recién después confirma. Mientras tanto, un pedido de esa sesión no la encuentra en memoria, la busca
en la base (`resolveSession`, líneas 66-76) fuera de la transacción, ve la fila **todavía abierta**
(lo no confirmado no se ve) y la vuelve a guardar en memoria (línea 75). Cuando la baja confirma,
nadie la vuelve a sacar: la sesión en memoria tiene `closedReason: null` y la caché nunca mira si la
persona sigue activa (`findByTokenHash` no trae `active`, aunque el diseño de 01, § 6, dice que sí).
Vale hasta las 8 horas, si se usa al menos cada 60 minutos. La limpieza diaria no la saca, porque en
la base ya figura cerrada. `close()` (líneas 105-108), que el diseño usa para «Cerrar», tiene la misma
ventana: saca de la memoria y después escribe.

**El ataque, paso a paso.**

1. Un empleado sabe que lo van a dar de baja (o lo sospecha). En su computadora abre las
   herramientas del navegador y copia su cookie `__Host-session` (es `HttpOnly`, pero las
   herramientas la muestran), su `X-Device-Id` y la versión.
2. Corre un programa que manda, sin parar, `GET /api/users` con esa cookie (cientos por segundo: no
   hay ningún límite para los pedidos con sesión, punto 2). Mientras la sesión está en memoria, cada
   pedido no toca la base.
3. Otro Administrador toca «Dar de baja» y confirma. En los milisegundos entre `memory.forget` y la
   confirmación, uno de sus pedidos cae en la ventana, lee la fila abierta y la vuelve a guardar.
4. El programa ve que sus pedidos siguen contestando `200`. Con esa sesión llama
   `POST /api/users/<su id>/activate` con la versión que trae la lista: el diseño solo frena «la
   propia» al dar de baja, no al dar de alta. Queda activo otra vez, y como R4.2 lo deja entrar con
   la misma cuenta de Google, vuelve a entrar normalmente. También puede autorizar otro correo suyo.

Lo mismo con «Cerrar», «Cerrar todas», «Quitar» y «Cortar» (todas cierran con `close` o con un
`update` antes de confirmar): quien tenga la cookie de la sesión que le cierran la conserva.

**Qué propongo.**

- Sacar de la memoria **después** de confirmar y que la lectura de la base no pueda volver a meter una
  sesión que se está cerrando. Lo más simple: una lista en memoria de sesiones cerradas (sus
  identificadores, lo que dura el tope de 8 horas, con tope de tamaño) que se llena **antes** del
  `update` y que `resolveSession` mira antes de guardar lo que leyó; y una de personas dadas de baja,
  que mira también la sesión ya en memoria. Va en `sessions/store.ts`. Unas 2 horas con la prueba.
- `409 self` también en `activate` (y en cualquier cambio sobre la propia persona que el negocio no
  necesite): nadie con sesión necesita darse de alta a sí mismo. Una línea.
- Que el diseño diga, en § 5 o § 6, que el evento y la memoria se tocan después de confirmar (lo
  mismo para la auditoría, punto 8), y que las pruebas lo intenten: un pedido de la sesión que se
  cierra metido entre el `update` y la confirmación (con la base de prueba y la transacción frenada a
  mano), que tiene que recibir `session-closed` después.

### 2 · No hay límite para los pedidos con sesión (§ 10 «Abuso»; `platform/http.ts`, `platform/guards.ts`) — Mejora

§ 10 dice que las rutas usan «el límite por dirección de los pedidos con sesión que ya existe». No
existe: los únicos límites son los de entrar (`/api/start`, Google, la huella, los códigos y la salida
pendiente). Las doce rutas nuevas no tienen ninguno.

- **Con sesión:** es lo que hace práctico el punto 1 (repetir pedidos sin freno) y deja que una sesión
  robada autorice miles de personas (cada `POST /api/users` es una fila y agranda `GET /api/users`,
  que pasa de sus 10 KB).
- **Sin sesión:** cualquiera, sin cuenta, manda pedidos a esas rutas con una cookie
  `__Host-session` inventada. Cada una cuesta una consulta a la base (`findByTokenHash`) antes del
  `401`, sin límite. No guarda nada en memoria (eso está bien), pero es carga de base gratis para
  cualquiera en internet.

**Qué propongo:** en `requireSession`, contar por dirección **solo las cookies que no se encontraron**
(las inventadas o vencidas) antes de ir a la base, por ejemplo 30 por minuto como `/api/start`; y un
límite por sesión para los cambios (por ejemplo 60 por minuto), que a tres personas no les molesta.
Corregir § 10 para que diga lo que hay. Una hora, con la prueba de cada tope.

### 3 · «Activa» y «nunca entró» se miran antes de escribir (§ 5, § 6 «Entrar» y «Autorizar»; `users/data.ts:30-36`, `sign-in/sessions/open.ts`) — Mejora

El diseño protege bien dos bajas a la vez, pero no la baja (o el borrado, o el cambio de correo)
contra una entrada que pasa en el mismo momento:

- **Baja contra entrada.** Entrar mira si la persona está activa (`matchGoogle` o `checkAssertion`) y,
  en un pedido aparte, crea la sesión. Si la baja confirma en el medio, cierra las sesiones que había,
  y después se crea una nueva para una persona dada de baja, que nadie cierra (y, por el punto 1, la
  caché no lo vuelve a mirar). Lo mismo «Quitar» contra una entrada con esa huella. La ventana es de
  milisegundos y cada intento necesita un pase de Google o una huella nuevos, así que es difícil de
  provocar a propósito; queda como mejora.
- **«Nunca entró» contra la primera entrada.** `PATCH` del correo y `DELETE` comprueban «nunca
  entró» con lo que leyeron y escriben con `where version = ?`. Pero entrar con Google guarda
  `google_subject` con `where id = ?` (`linkGoogle`) y, según § 6, no sube la versión. Si se cruzan:
  - Cambio de correo: la cuenta queda con el correo nuevo y atada al Google del viejo. Quien
    controla el correo viejo sigue entrando; el dueño del nuevo recibe `not-authorized`. Es justo lo
    que R3.6 quiere impedir.
  - Borrado: se borra a la persona y queda una sesión abierta de alguien que no existe; `people.of`
    falla al buscarla (`as User` sobre `undefined`) y esa sesión sigue valiendo para todo lo demás.

**Qué propongo:**

- Las condiciones, en el mismo `update`/`delete`: `where version = ? and google_subject is null and
  last_sign_in_at is null` para el correo y el borrado, y `where id = ? and google_subject is null`
  (más el correo que se comparó) para `linkGoogle`; si no toca ninguna fila, `409` con la persona
  como está. Que guardar `google_subject` y `last_sign_in_at` también suba la versión.
- Al abrir una sesión, volver a mirar en la misma consulta que la persona sigue activa (y, con la
  huella, que la huella sigue sin quitar), o abrirla en una transacción que tome la fila de la
  persona con `for share`, que la baja (`for update`) espera. Una consulta más por entrada; entra
  en las metas de 01 si se junta con la que ya busca a la persona.
- Unas 2 horas, con las pruebas de los dos cruces.

### 4 · La memoria de quién es la huella de cada celular no se entera (§ 6 «Dar de baja», «Quitar» y «Cortar»; `sign-in/context.ts:75`, `offline/phone-owner.ts:18-22`, `google/routes.ts:113-116`) — Mejora

`ctx.phoneOwners` guarda en memoria de quién es la huella de cada celular, para no consultar la base
en `/api/start`. Solo la actualiza vincular una huella (`webauthn.ts:130-131`). El diseño agrega tres
formas de quitar huellas (la baja, «Quitar» y «Cortar») y no dice que la limpien.

**Qué pasa:** se quita la huella del celular P de una persona (o se la da de baja y después de alta,
R4.2). Esa persona vuelve a entrar con Google en P. El servidor mira `phoneOwners`, sigue viendo que
P es suyo y responde `offline: true` y `offerPasskey: false`. En el celular, la opción «Trabajar sin
conexión» se mantiene (diseño de 15, «Cada contacto con sesión») y no se le ofrece vincular la
huella de nuevo. Así no se cumple R5.6 («se le apaga Trabajar sin conexión») ni R4.1, hasta que se
reinicie el servidor: el celular sigue guardando datos para trabajar sin conexión y dejando entrar
sin conexión con la huella vieja (que sigue en el celular). El servidor no confirma lo que mande
(la huella está quitada en la base), así que no se entra a lo ajeno; por eso es mejora, pero
contradice una regla aprobada.

**Qué propongo:** que cada camino que quita huellas borre esos celulares de `phoneOwners` después de
confirmar (o que la memoria se reemplace por la consulta dentro del límite de 01). Que el diseño lo
diga en § 6 y que E19, E26 y E31 lo prueben: después de quitar, entrar con Google en ese celular no
trae `offline` y ofrece la huella. Media hora.

### 5 · Cerrar por `device_id` no alcanza a todas las sesiones de esa huella (§ 2 índice `(user_id, device_id)`, § 4 «Quitar» y «Cortar»; `sign-in/sessions/open.ts:42`) — Mejora

La sesión guarda el `device_id` que mandó el pedido (`X-Device-Id`), no el de la huella con que se
entró. Entrar con la huella desde un identificador distinto del que la vinculó es posible: el
celular borró los datos del sitio (otro identificador), o la huella de Google se copió a otro aparato
de la misma cuenta (riesgo aceptado en 01, § 13).

**El ataque:** alguien se queda con el celular de un empleado y sabe su PIN (un compañero, un
familiar). Borra los datos del sitio en el navegador (nuevo `X-Device-Id`) y entra con la huella
(Android acepta el PIN). El Administrador abre «Se perdió un celular»: ve dos «Chrome en Android» (el
de la huella, con el identificador viejo, y la sesión, con el nuevo). Si corta el de la huella, la
huella se quita pero la sesión del ladrón sigue hasta 8 horas. Además, `is_phone` sale de lo que
declara el navegador: una sesión con agente de computadora no figura en «Se perdió un celular», solo
en la tarjeta. Lo mismo para la computadora que el celular robado aprobó por QR: «Cortar» no la toca.

**Qué propongo:** guardar en la sesión la huella con que se abrió (`passkey_id`, también en las que
abre el QR y la entrada sin conexión) y que «Quitar», «Cortar» y la baja cierren por
`device_id` **o** `passkey_id`; «Se perdió un celular» agrupa por huella cuando hay. Que § 10 diga que
«Cerrar todas» es el respaldo para lo que no se pueda atar. Una columna y un índice en `003-access`;
unas 2 horas.

### 6 · La API muestra el identificador de cada huella y de cada celular (§ 4 `POST /api/passkeys/:id/remove`, `POST /api/lost-phones/cut`) — Mejora

Para «Quitar», la aplicación necesita el identificador de la huella, que hoy es el identificador de
la credencial (`passkeys.id`). Para «Cortar», el `deviceId`. Hasta ahora ninguno de los dos salía del
servidor. Los dos sirven para bloquear a otro sin entrar:

- **La credencial:** el límite por cuenta de la huella (01 · R2.10, 20 fallos por hora) cuenta las
  firmas que no verifican **para una credencial que existe**. Quien conozca la credencial de otro
  pide un desafío y manda 20 firmas falsas con ese `id`, sin sesión, desde cualquier lado: la persona
  no entra con la huella por una hora, y tampoco se le confirma lo hecho sin conexión
  (`offline/routes.ts:68` usa la misma cuenta). Lo repite cada hora. Hoy la credencial solo la conoce
  el celular; con el diseño, cualquiera con sesión (o con una sesión robada, punto 7) la lee en
  `GET /api/users/:id/access` y se la puede llevar.
- **El celular:** el límite por dispositivo de la huella (20 por minuto) se cuenta con el
  `X-Device-Id` que manda el pedido. Con el identificador de un celular ajeno, se lo frena minuto a
  minuto.

**Qué propongo:** que la API no muestre ni la credencial ni el `device_id`. Una columna `public_id`
(UUID v7) en `sign_in.passkeys` para «Quitar», y para «Cortar» el `public_id` de la huella o el de
la sesión más nueva de ese celular, que el servidor traduce. Que § 4 diga qué campos devuelve cada
ruta y que nunca van `ip_address`, `device_id`, el identificador de la credencial, el hash del pase
ni la llave de prueba. Una hora.

### 7 · Una sesión ajena se vuelve acceso para siempre (§ 4 `POST /api/users` y `activate`, § 10 «Quién puede») — Mejora, lo decide Carlos

En la etapa a, quien tenga una sesión puede todo (R1.1). Eso incluye **autorizar su propio correo**:

1. La computadora del mostrador queda con la sesión abierta (60 minutos sin uso, 8 horas en total).
2. Alguien que no trabaja ahí (un cliente, un proveedor, un ex empleado de visita) toca Más →
   Usuarios → «Autorizar a alguien», pone su Gmail y se va. Son diez segundos.
3. Desde su casa entra con Google. Ya no depende de esa sesión: cerrarla no lo saca.

Hasta que alguien mire la lista no hay aviso, y la auditoría no tiene pantalla hasta el 05. Con una
sesión robada por otro camino, lo mismo. «Dar de alta» a alguien dado de baja es la misma puerta.

**Qué propondría a Carlos** (cambia una regla; él decide):

- Pedir haber pasado por Google (o por la huella en el celular) en los últimos 5 minutos para
  **autorizar** y **dar de alta**, como ya pide vincular una huella (01, § 5). El servidor ya guarda
  `google_at` en la sesión; habría que guardar también la última huella. Si no pasó, la pantalla
  pide tocar Google o la huella. Costo: medio día, y un paso más para la persona solo en esas dos
  acciones, que son raras.
- Lo mínimo, sin cambiar la regla: la tarjeta dice «Autorizada el … por …» (la fecha ya está en
  `created_at`; falta quién, que está en la auditoría o en una columna `authorized_by`), y la
  persona recién autorizada se ve resaltada en la lista hasta que entre. Una hora.

### 8 · La auditoría (§ 9, § 7; ADR-004) — Mejora

- **Los rechazos no quedan.** § 9 lista solo los cambios hechos. Un `409 self`, `last-administrator`,
  `already-entered`, `changed` o un `404` por un identificador que no es de esa persona no se anotan.
  Son pocos y dicen algo (alguien probó darse de baja a sí mismo, o cortar con identificadores
  inventados). Propongo `users.rejected` y `access.rejected` con quién, a quién, el motivo y el
  identificador pedido, una vez por ventana como `request.rejected`. Media hora.
- **Lo de la transacción se anota antes de confirmar.** ADR-004 dice que el evento se escribe cuando
  PostgreSQL confirmó. Hoy `closeForUser` llama a `onEnded` (que anota `session.ended`) dentro de la
  transacción; si la transacción falla después (punto 12, o cualquier error al quitar las huellas), la
  auditoría dice que se cerraron sesiones que siguen abiertas. Con `user.deactivated` y
  `passkey.removed` adentro, lo mismo. Propongo juntar lo que se anota y lo que se saca de la memoria
  (punto 1) en un «después de confirmar» de la transacción, en `platform/events` o en
  `platform/storage/db`. Va junto con el punto 1.
- **El comando del primer Administrador no deja traza.** R6.1 pide anotar «autorizar» con quién lo
  hizo; el comando corre fuera del servidor, sin sesión, y la auditoría la escribe un solo proceso
  (ADR-004). Propongo que el comando anote `user.authorized` con `by: "instalación"` (abrir el
  archivo del año con SQLite en modo WAL y escribir una fila es seguro con el servidor andando) o,
  si no, que el servidor lo anote al arrancar la primera vez que ve a esa persona sin evento. Media
  hora.
- **Que nadie pueda borrar ni cambiar la auditoría:** sin cambios respecto de 01; nada nuevo.

### 9 · El primer Administrador (§ 7) — Mejora

- **Las pruebas de punta a punta no lo pueden usar.** Hoy cargan a su persona con
  `INITIAL_ADMIN_EMAIL` (`tests/e2e/stack/start.ts:88`) y la base es `memory://`, que vive dentro del
  proceso del servidor: un comando aparte no la ve. § 7 dice «las pruebas cargan a sus personas como
  hoy», y hoy es justo lo que se va. El riesgo es que, al programar, se resuelva con una ruta «solo
  para pruebas» o con otra variable que llegue a producción. Propongo que el diseño lo diga: con
  `ENVIRONMENT=e2e` (que ya exige `memory://`, `config.ts`), `main.ts` llama a la misma función del
  comando antes de atender, con una variable que solo se lee en ese ambiente; **nunca una ruta**. Y
  una prueba que compruebe que con `testing` o `production` esa variable no crea a nadie.
- **Dos comandos a la vez.** «Inserta solo si la tabla está vacía, en una transacción» no alcanza con
  el aislamiento por omisión de PostgreSQL: dos corridas a la vez ven la tabla vacía y las dos
  insertan. Lo corre una persona en la máquina, así que no es un ataque; pero se arregla con
  `lock table users.users in exclusive mode` al empezar (o un bloqueo consultivo). Una línea.
- **Lo que lee y lo que escribe.** R1.2 dice que el comando no usa la configuración del ambiente: que
  lea solo `DATABASE_URL` (y no todo `readConfig`), que valide correo y nombre con el mismo contrato
  que `POST /api/users` (largos máximos incluidos), y que sus errores no muestren `DATABASE_URL`. En
  `install.sh`, pasarle el correo y el nombre entre comillas (`"$ADMIN_EMAIL" "$ADMIN_NAME"`), y que
  volver a correr la instalación con personas ya cargadas no falle (el comando se niega, y eso es lo
  esperado).
- **Sin ninguna ruta que cree a alguien sin sesión:** está bien así y § 10 lo dice; que lo pruebe una
  prueba (con la tabla vacía, ningún pedido sin sesión crea a nadie).

### 10 · Lo que entra de afuera (§ 4, § 10 «Lo que entra de afuera») — Mejora

- **Los nombres.** El nombre escrito tiene tope (80), pero `google_name` viene del pase de Google
  (hasta 4 KB) y se guarda sin tope: que se recorte a 80 al guardarlo. A los dos, sacarles los
  caracteres de control y los de dirección del texto (U+202A a U+202E, U+2066 a U+2069) y
  normalizarlos (NFC): con ellos, un nombre se puede dibujar como otro en la lista. Preact escapa todo,
  así que no hay HTML inyectado (comprobado: la aplicación prohíbe `dangerouslySetInnerHTML`).
- **El identificador de la huella no es un UUID.** § 10 dice que los identificadores de la dirección
  son UUID, pero `passkeys.id` es el de la credencial (base64url, hasta unos 1.400 caracteres). Con el
  punto 6 se resuelve (pasa a ser `public_id`, un UUID); si no, que el contrato lo valide como
  base64url con largo máximo.
- **La versión.** «Un entero»: que sea positivo y hasta 2³¹−1, porque la columna es `integer` y un
  número más grande da un error de la base (500) en lugar de `400`. En `DELETE` va en la dirección
  (`?version=`): que se valide igual que en el cuerpo.
- **El correo.** zod `email` con 254 caracteres y la normalización (minúsculas, sin espacios) en un
  solo lugar, `src/shared/`, que usan la ruta, el comando y la comparación con Google
  (`normalizeEmail`, que hoy está en `users/rules.ts`).
- **Los pedidos desde otros sitios:** nada nuevo. `platform/http.ts` exige `Origin` y
  `Content-Type: application/json` en todo lo que no es `GET`, también en `DELETE` y en los `POST`
  sin cuerpo (comprobado en el código).

### 11 · «Algo salió mal» guarda el nombre de la persona en los pasos (§ 8 «`data-private`»; `frame/notices/crash/crash.ts:36-39`) — Mejora

Los últimos pasos guardan el texto de cada botón tocado (`Tocó «…»`), salvo que el botón **esté
dentro** de algo marcado `data-private`. Si la marca va en el nombre y el correo (como dice § 8) y
el botón es la fila o la tarjeta de la persona, el botón no está dentro de la marca: lo contiene. El
paso queda como «Tocó «Juan Pérez juan@gmail.com Entró hace 3 días»» y se guarda en el
dispositivo, para mandarse con el módulo 12. Lo mismo un `aria-label` como «Cerrar la sesión de
Juan». Va contra 00 · R9.4.

**Qué propongo:** que § 8 diga que la marca va en el elemento que se toca (la fila, la tarjeta, los
botones con nombre en su etiqueta), o que `labelOf` saque del texto lo marcado `data-private`
también cuando está adentro (es de `frame`, código común: tarea aparte). Una prueba de la pantalla
que toque una persona y mire que el paso no tiene su nombre. Media hora.

### 12 · Dos bajas a la vez pueden trabarse (§ 5 «Nunca sin Administrador activo») — Mejora

`select … where active for update` sin orden bloquea las filas en el orden en que las lee cada
consulta. Dos bajas cruzadas (E05) pueden bloquear en distinto orden y PostgreSQL corta una con un
error de bloqueo mutuo: la persona ve «Algo salió mal» en lugar de `last-administrator`. No se
pierde nada, pero es justo el caso que el diseño quiere probar. Propongo `order by id` en esa
consulta y que el error de bloqueo mutuo (o de serialización) se reintente una vez. Diez minutos.

---

## Lo demás, punto por punto

- **Entrar sin permiso:** fuera del punto 1, nada nuevo. Las rutas nuevas son todas con sesión, no hay
  ninguna que cree a alguien sin sesión, y la cuenta de Google queda atada a la persona desde la
  primera entrada (el correo no se puede cambiar después).
- **Permisos y lo ajeno:** en la etapa a todos pueden todo (R1.1), así que cambiar un identificador
  no da nada que no se tenga ya. Ojo con lo que dice § 10: «las rutas de sesiones y huellas
  comprueban que sea de la persona nombrada», pero `POST /api/sessions/:id/close` y
  `POST /api/passkeys/:id/remove` no nombran a nadie. Para la etapa b conviene que las dos lleven a
  la persona en la dirección (`/api/users/:userId/sessions/:id/close`), así el permiso se mira sobre
  ella y un identificador de otra da `404`. No frena hoy.
- **La aplicación en el navegador:** nada. No guarda nada en el dispositivo (§ 8), el service worker
  no guarda `/api` y todas sus respuestas llevan `Cache-Control: no-store` (comprobado en
  `platform/http.ts`); la política de contenido y `frame-ancestors 'none'` no cambian. Solo el
  punto 11.
- **Datos personales:** no sale nada a terceros: la lista, las sesiones y los celulares se quedan
  entre el servidor y la aplicación. El correo es lo que se guarda como nombre de la huella en el
  celular (`webauthn.ts`, `userName: user.email`); eso ya era así en 01 y queda en el teléfono y en la
  cuenta de Google de la propia persona. Puntos 6 y 11.
- **Sin conexión:** lo de 15 no cambia y está bien atado: una huella quitada no confirma nada
  (`findActive` solo trae huellas sin quitar) y una sesión cerrada con `revoked` rechaza lo que llegue
  después. Puntos 4 y 5.
- **El despliegue:** solo cambia `install.sh` (punto 9) y sale una variable del `.env`. La variable
  vieja que quede en un `.env` no rompe nada: `config.ts` ignora lo que no conoce. Caddy, puertos,
  volúmenes y contenedores, sin cambios.
- **Dependencias:** el diseño no agrega ninguna. `pnpm audit --prod` hoy: sin fallas conocidas. La
  validación del correo es de zod 4.6.7; la falla de 2026 que encontré en zod (CVE-2026-6991, en las
  expresiones de `regexes.ts`) llega hasta la 4.3.6, y la conocida del correo (CVE-2023-4316) es de
  la 3.x: ninguna alcanza a la versión que se usa.

## Qué tiene que tener una prueba (para el paso 7)

Además de las de § 12, cada riesgo con una prueba que lo intenta y falla:

1. Un pedido de la sesión que se está cerrando, metido entre el cierre y la confirmación, recibe
   `session-closed` después (punto 1); lo mismo para «Cerrar».
2. Dar de alta la propia persona da `409 self` (punto 1).
3. Cookies inventadas por encima del tope dan `too-many-attempts` sin consultar la base (punto 2).
4. Cambiar el correo o borrar mientras la persona entra por primera vez: no queda un correo atado a
   otra cuenta ni una sesión de alguien borrado (punto 3).
5. Después de «Quitar», de «Cortar» y de la baja, entrar con Google en ese celular no trae `offline`
   y ofrece la huella (punto 4).
6. Una sesión abierta con la huella desde otro identificador se cierra al quitar esa huella
   (punto 5).
7. Ninguna respuesta de las rutas nuevas trae el identificador de la credencial, el `device_id` ni
   la dirección de internet (punto 6).
8. Cada rechazo de § 4 deja su fila, una vez por ventana; una baja que falla no deja `session.ended`
   (punto 8).
9. Con `testing` o `production`, ni una variable ni una ruta crean a la primera persona (punto 9).
10. Un nombre de Google de 4 KB se guarda recortado; uno con caracteres de dirección, limpio
    (punto 10).
11. Tocar una persona no deja su nombre en los pasos de «Algo salió mal» (punto 11).

## Fuentes

- [CVE-2026-6991 (INCIBE)](https://www.incibe.es/incibe-cert/alerta-temprana/vulnerabilidades/cve-2026-6991)
- [CVE-2026-6991 (secualive)](https://secualive.jp/en/feed/nvd/vulnerability/detailinfo/CVE-2026-6991/)
- [Fallas conocidas de zod (OpenCVE)](https://opencve.alliance.unm.edu/cve/?vendor=zod)
