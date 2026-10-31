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
`tests/e2e/stack/start.ts`. Cómo quedó cada punto después de programar, en la tabla del [paso 7](#paso-7-el-código).

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

---

## Paso 7: el código

Revisión del código programado (commits `7460c43`, `49c367c` y `a58221a`) contra el [diseño](users.md)
aprobado (§ 5, § 6, § 9 y § 13) y las [reglas](../../chapters/02-users/rules.md). Leí las rutas de
`src/server/modules/users/` y de `src/server/modules/sign-in/access/`, lo que cambió en `sign-in`
(`sessions/store.ts`, `open.ts`, `require.ts`, `offline/routes.ts`, `passkeys/`, `codes/`, `index.ts`),
`platform/session.ts`, `config.ts`, `http.ts`, `guards.ts`, `limits/rate-limit.ts`, el comando
`first-administrator.ts`, `deploy/oracle/install.sh`, la pantalla `src/app/modules/users/`,
`ConfirmSheet.tsx` y `frame/notices/crash/crash.ts`, y sus pruebas.

**Lo que comprobé corriendo:** una prueba de sondeo, fuera del repositorio, contra el servidor de
prueba (`createSignInServer`, PGlite): los puntos 13, 14 y 17 de abajo pasan como se describen.
`pnpm audit --prod`: «No known vulnerabilities found». Lo demás sale de leer el código; donde no lo
pude comprobar, lo digo.

### Resumen

Lo que el diseño prometía, en general está: la memoria de sesiones ya no vuelve a guardar una sesión
que se cierra (contador de cierres, con su prueba), la baja cierra sesiones y borra huellas en la
misma transacción y pone la memoria al día después de confirmar, las bajas bloquean las activas en
orden, «nunca entró» va en el mismo `where`, la apertura de una sesión vuelve a mirar si la persona
sigue activa (también sin conexión y por el código QR), ninguna respuesta da el `device_id` ni el
identificador de WebAuthn, y nadie se da de alta a sí mismo.

Queda **un agujero que frena**: **cambiar el correo** de alguien que nunca entró no pide pasar por
Google ni por la huella, y es lo mismo que autorizar un correo nuevo. Con eso, la sesión abierta en el
mostrador que R3.8 quiere cerrar sigue sirviendo para darse acceso. Y uno de **disponibilidad** que
conviene arreglar antes de que otro módulo use `sessions.require`: 31 cookies inventadas desde la
dirección del local dejan a todos los del local sin poder usar Usuarios por un minuto, aunque tengan
sesión.

| # | Punto | Gravedad |
|---|---|---|
| 13 | Cambiar el correo de quien nunca entró no pide Google ni la huella: es autorizar sin R3.8 | **Frena** |
| 14 | El límite de cookies desconocidas frena también a las sesiones válidas de esa dirección | Mejora (la más urgente) |
| 15 | Una entrada sin conexión confirmada cuenta como huella «de recién», aunque sea de horas antes | Mejora |
| 16 | «Cortar» un celular no cierra las computadoras que ese celular aprobó por QR | Mejora |
| 17 | Un identificador que no es UUID en la dirección da 500 y deja una traza por pedido | Mejora |
| 18 | Los rechazos de las rutas de sesiones y celulares no se anotan | Mejora |
| 19 | «Algo salió mal»: la captura muestra lo escrito al autorizar, el buscador y las tostadas con nombre | Mejora |
| 20 | Cortar contra una entrada con esa misma huella, a la vez | Mejora |
| 21 | R3.8 depende de que la computadora del mostrador no tenga la cuenta de Google abierta | Mejora (decide Carlos) |
| 22 | Pruebas que faltan para riesgos que el diseño dice cubrir | Mejora |

### 13 · Cambiar el correo de quien nunca entró se saltea R3.8 (`users/routes.ts:136-143`, `users/people.ts:51-58`) — **Frena**

`POST /api/users` y `POST /api/users/:id/activate` llaman a `confirmed()` (líneas 130 y 165);
`POST /api/users/:id` no. Para quien nunca entró, cambiar el correo es exactamente autorizar otro
correo: la fila queda activa, sin `google_subject`, y la primera entrada con Google con ese correo la
ata a la cuenta de quien la pidió.

**El ataque, paso a paso** (lo corrí en la prueba de sondeo):

1. La computadora del mostrador queda con la sesión de un empleado abierta, hace más de 5 minutos
   que no pasó por Google. Alguien que no trabaja ahí (un cliente, un ex empleado) va a Más →
   Usuarios. «Autorizar a alguien» le pide Google: no puede.
2. Toca el filtro «Sin entrar». Hay alguien recién autorizado que todavía no entró (lo normal en la
   semana en que entra un empleado nuevo). Toca el lápiz del correo, escribe su Gmail y Enter. El
   servidor contesta `200`: `{"email":"atacante@gmail.com","active":true,"neverSignedIn":true}`.
3. Desde su casa entra con Google con ese Gmail: `200`, `role: "Administrador"`. Ya no depende de la
   sesión del mostrador; desde ahí puede autorizar a quien quiera.

La lista sigue mostrando «Todavía no entró» con el correo nuevo hasta que entra; después, con el
nombre de Google del atacante (el escrito se borró, ver «Fuera de seguridad»). La auditoría tiene
`user.email-changed`, pero no hay pantalla para leerla hasta el 05.

**Qué propongo:** que cambiar el correo pida lo mismo que autorizar (`confirm-first` si `email` viene
en el cuerpo); la aplicación ya sabe repetir el pedido después de la hoja de confirmar. Cambiar solo
el nombre puede seguir sin pedirlo. Que R3.8 lo diga («autorizar, cambiar el correo de quien nunca
entró y dar de alta») y una prueba de la ruta: con la sesión de hace 6 minutos, cambiar el correo da
`403 confirm-first`; después de confirmar, pasa. Media hora.

### 14 · El límite de cookies desconocidas frena a las sesiones válidas (`sign-in/sessions/require.ts:40`) — Mejora, la más urgente

`requestSession` mira `limiter.exceeded("session:unknown:<dirección>")` **antes** de buscar la
cookie, en memoria o en la base. Pasado el tope (30 por minuto), contesta `429` a todo pedido con
sesión desde esa dirección, también a los de sesiones que están en memoria y no costarían nada.

**El ataque** (lo corrí): desde la misma dirección pública que el local (un cliente en el wifi del
local, o cualquiera que comparta la dirección del proveedor de datos móviles, que en Argentina
suelen ser compartidas), 31 pedidos a `/api/users` con `__Host-session=inventada<n>`. La sesión del
Administrador, que un momento antes recibía `200`, recibe `429 too-many-attempts` por 60 segundos.
Repetido cada minuto, nadie del local usa Usuarios (ni la hoja de confirmar, que también va con
`sessions.require`). Hoy alcanza solo a Usuarios; cuando Vender y los demás módulos usen la misma
puerta (para eso está, diseño § 3), deja al local sin trabajar. No hace falta cuenta, ni conocer a
nadie: solo estar detrás de la misma dirección.

**Qué propongo:** buscar primero en la memoria (sin costo) y aplicar el tope solo a lo que iría a la
base: una cookie que está en memoria nunca se frena. Después de reiniciar el servidor, una sesión
válida todavía no está en memoria; para que tampoco se frene, el pase puede llevar una marca que el
servidor reconoce sin la base (por ejemplo, los últimos 8 bytes como HMAC del resto con un secreto del
proceso: una cookie inventada no la tiene y se descarta sin consulta ni cuenta). La primera parte es
media hora; la marca, una hora más, con la prueba: con el tope pasado desde una dirección, una sesión
válida de esa dirección sigue recibiendo `200`.

### 15 · La entrada sin conexión confirmada cuenta como huella reciente (`sign-in/sessions/open.ts:60`, `offline/routes.ts:142`) — Mejora

`openSession` pone `passkeyAt = now` siempre que hay `passkeyId`. La confirmación sin conexión pasa
`passkeyId: row.credentialId`, así que la sesión que abre el servidor cuando vuelve la conexión queda
«confirmada con la huella» en ese momento, aunque la huella se puso horas antes (hasta 24). R3.8
pide haberla puesto hace menos de 5 minutos.

**El ataque:** un empleado entra sin conexión a la mañana en su celular y lo deja desbloqueado sobre
el mostrador. Vuelve internet; el celular manda lo pendiente y el servidor abre la sesión con
`passkeyAt` de ahora. Durante esos 5 minutos, quien agarre el celular autoriza su Gmail desde Más →
Usuarios sin poner ninguna huella. La ventana depende de cuándo vuelve la conexión, así que es difícil
de provocar a propósito; queda como mejora.

**Qué propongo:** que la entrada sin conexión abra la sesión con `passkeyAt` nulo (la firma no es de
ahora); se pasa `passkeyId` para cortar y un `passkeyAt` aparte, solo en los caminos con firma fresca.
Una línea y una prueba.

### 16 · «Cortar» no alcanza a las computadoras que aprobó ese celular (`sign-in/codes/computer/computer-routes.ts:75-80`, `access/data.ts:131-151`) — Mejora

La sesión de la computadora que entra con el código QR se abre sin `passkeyId` (y `is_phone` falso).
`cutPhone` cierra por `device_id` o `passkey_id`, así que no la toca, y «Se perdió un celular» no la
muestra.

**El ataque:** alguien se queda con el celular de un empleado y sabe su PIN. Lee el código QR de su
propia computadora y lo aprueba con la huella: tiene una sesión en la computadora, hasta 8 horas. El
Administrador abre «Se perdió un celular», corta ese celular y ve «se cerró la sesión y se quitó la
huella»: cree que terminó. La computadora sigue adentro. Lo arregla «Cerrar todas» (R5.4 lo prevé),
pero la pantalla de cortar no lo sugiere.

**Qué propongo:** guardar en la sesión de la computadora el `passkey_id` de la huella que la aprobó
(está en el permiso que la computadora canjea) y que cortar cierre también esas. Si no, que el aviso
de «Cortar» diga «Si con ese celular entró a una computadora, usá Cerrar todas». Una hora, con la
prueba.

### 17 · Un identificador que no es UUID da 500 (`users/routes.ts:138-167`, `sign-in/access/routes.ts:34-93`) — Mejora

§ 9 dice que los identificadores de la dirección son UUID; ninguna ruta lo valida. Las columnas son
`uuid`, así que `GET /api/users/no-es-uuid/access` o `POST /api/users/no-es-uuid/sessions/no/close`
dan `500 unexpected` (lo corrí) y cada uno deja un `console.error` con la traza. Con sesión, cualquiera
llena el registro del servidor sin límite en las rutas `GET`. No da acceso a nada.

**Qué propongo:** un paso de la plataforma que valide los parámetros con forma de UUID y conteste
`404 not-found` (lo mismo que para uno que no existe), en las ocho rutas que llevan `:id`, `:sessionId` o `:phoneId`. Media hora, con una prueba
por ruta.

### 18 · Los rechazos de sesiones y celulares no se anotan (`sign-in/access/routes.ts:94-95`, `:80`) — Mejora

§ 9 pide anotar los rechazos (`self`, `404`) una vez por minuto, y `users` lo hace (`users.rejected`).
Las rutas de `sign-in/access` no: «Cortar» con un celular de otra persona o inventado (`404`) o el
propio (`409 self`) no dejan nada, y «Cerrar» con una sesión que no es de esa persona devuelve
`200 { closed: 0 }` (no `404`, como dice § 4) y tampoco deja nada. Quien prueba identificadores de
celulares no queda registrado. Propongo `access.rejected` con quién, a quién, el motivo y el
identificador pedido, con la misma ventana. Media hora.

### 19 · La captura de «Algo salió mal» muestra datos personales (`users/screens/Overlays/Authorize.tsx:37-61`, `Users/Summary.tsx:60`, `ui/toast/Toast.tsx:25`) — Mejora

El arreglo de los pasos está (`crash.ts:38-39`, un botón que contiene algo marcado no entra, con su
prueba). Pero la captura solo tapa lo marcado `data-private`, y quedan sin marcar:

- los campos de «Autorizar a alguien» (nombre y correo que se están escribiendo);
- el buscador de la lista (donde se escribe un nombre);
- las tostadas, que dicen «Se borró el alta de juan@gmail.com», «Juan Pérez quedó dada de baja»,
  «… puede entrar otra vez» durante 2,4 segundos.

Si algo falla con eso a la vista, la captura (que «Avisar y seguir» guarda en el dispositivo y el
módulo 12 va a mandar) lleva el nombre o el correo, contra 00 · R9.4. Que `html-to-image` copia el
valor de los campos lo sé por la biblioteca; no lo corrí. **Qué propongo:** `data-private` en esos
dos campos y en la tostada cuando el texto lleva un nombre o un correo (un parámetro de `showToast`).
Una prueba de la pantalla. Media hora.

### 20 · Cortar a la vez que se entra con esa huella (`sign-in/access/data.ts:131-151`, `sessions/open.ts`) — Mejora

`cutPhone` borra la huella y después cierra sesiones, en dos sentencias sin transacción, y entrar con
la huella no vuelve a mirar si la huella sigue al crear la sesión (sí mira si la persona sigue activa,
`recordSignIn`). Si una entrada con esa huella crea su sesión justo después del `update` de cortar,
queda abierta con una huella ya borrada. Hace falta poner la huella justo en ese milisegundo, así que
no se puede provocar a propósito; queda como mejora. **Qué propongo:** cortar en una transacción, y
que `openSession`, cuando trae `passkeyId`, haga lo mismo que con la persona: después de crear la
sesión, comprobar que la huella sigue y, si no, cerrarla. Una consulta más por entrada con huella;
una hora.

### 21 · R3.8 contra una computadora con la cuenta de Google abierta — Mejora, lo decide Carlos

La hoja de confirmar ofrece «Continuar con Google». Si en la computadora del mostrador el navegador
tiene abierta la cuenta de Google del empleado (lo común si lee su correo ahí), quien está frente a
la sesión abandonada toca el botón, elige la cuenta y queda confirmado sin ninguna contraseña. R3.8
protege solo si Google pide algo. No es un error del código; es un límite de la regla. **Qué
propondría a Carlos:** decir en el manual que en la computadora del mostrador no se deja abierta la
cuenta de Google, o pedir en la confirmación `prompt=login` / `max_age` (Google vuelve a pedir la
contraseña; no lo comprobé con el botón que usa la aplicación). Costo: un texto, o una hora si se
toca el pedido a Google.

### 22 · Pruebas que faltan — Mejora

Comparando con «Qué tiene que tener una prueba» del paso 4 y con § 11:

| Riesgo | Prueba | Estado |
|---|---|---|
| Un pedido de la sesión que se cierra no la vuelve a guardar | `sessions/memory.test.ts` | Está |
| Dar de alta la propia da `self` | `people.test.ts` (E04) | Está |
| Cookies inventadas sobre el tope, sin consultar | `access.test.ts` | Está; falta la contraria: una sesión válida de esa dirección no se frena (punto 14) |
| 60 cambios por minuto por sesión | — | **Falta** |
| Cambiar el correo o borrar mientras entra por primera vez | `users.test.ts` (dos entradas a la vez) | En parte: falta el cruce correo contra entrada |
| Después de quitar, Google en ese celular ofrece la huella y no trae `offline` | `access.test.ts` (E26) | Está para «Quitar»; falta para la baja |
| Una sesión abierta con la huella desde otro identificador se cierra al quitarla | — | **Falta** (el código lo hace: `passkey_id`) |
| Ninguna respuesta trae `device_id` ni el identificador de WebAuthn | `access.test.ts:40` | Solo la tarjeta; falta `/api/lost-phones` |
| Cada rechazo deja su fila | `people.test.ts` (R6.1) | Solo `users`; falta `sign-in/access` (punto 18) |
| Con `testing` o `production`, nada crea a la primera persona | `config.test.ts` | Está |
| Nombre de Google de 4 KB recortado, sin caracteres de dirección | — | **Falta** (el código lo hace: `cleanName`) |
| Tocar una persona no deja su nombre en los pasos | `notices.test.tsx` | Está |
| Cambiar el correo pide confirmar | — | **Falta** (punto 13) |
| Dos bajas a la vez (E05), contra PostgreSQL | A mano, según § 5 | No lo pude comprobar: no corrí PostgreSQL |

### Cómo quedó cada punto del paso 4

| # | Punto | Estado en el código |
|---|---|---|
| 1 | La caché de sesiones | Resuelto: contador de cierres (`store.ts:84-90`), memoria y auditoría después de confirmar; `409 self` al dar de alta |
| 2 | Límites | En parte: están los dos, pero el de cookies frena a las válidas (punto 14) y el de cambios no tiene prueba |
| 3 | Activa y nunca entró, al escribir | Resuelto: `where` en correo, borrar y `linkGoogle`; `recordSignIn` solo si sigue activa, con la sesión cerrada si no |
| 4 | `phoneOwners` | Resuelto en cortar y en la baja |
| 5 | Sesiones con la huella desde otro identificador | Resuelto con `passkey_id`, salvo la computadora del QR (punto 16) |
| 6 | Identificadores a la vista | Resuelto: `public_id` y el `id` de la sesión; nunca `device_id` ni la credencial |
| 7 | Una sesión ajena se vuelve acceso | Carlos eligió R3.8 y está programado, pero se saltea cambiando el correo (punto 13) |
| 8 | Auditoría | En parte: después de confirmar y con los rechazos de `users`; faltan los de `sign-in/access` (punto 18). El comando no anota, como decidió el diseño (`authorized_by` nulo) |
| 9 | Primer Administrador | Resuelto: variable solo en `e2e` (rechazada en otros ambientes, con prueba), tabla bloqueada, solo `DATABASE_URL`, correo entre comillas en `install.sh`. El comando valida el correo con `includes('@')`, no con el contrato (abajo) |
| 10 | Lo que entra | En parte: cuerpos con zod, versión acotada, nombres limpios y cortados; los parámetros de la dirección, no (punto 17); sin NFC |
| 11 | «Algo salió mal» | Resuelto en los pasos; quedan la captura (punto 19) |
| 12 | Dos bajas que se traban | Resuelto con `order by id` |

### Lo demás, punto por punto

- **Entrar sin permiso:** fuera de los puntos 13, 15 y 21, nada. Ninguna ruta crea a alguien sin
  sesión; el primer Administrador solo sale del comando o, en `e2e`, de una variable que la
  configuración rechaza en otro ambiente (`config.ts:48-50`). Confirmar con Google exige un `nonce`
  dado por el servidor y el mismo `google_subject`; con la huella, un desafío atado a esa sesión y una
  huella de la misma persona (probado en `access.test.ts`).
- **Una cuenta dada de baja:** no entra por ningún camino. Google la rechaza en `matchGoogleAccount`;
  la huella, el código QR y sin conexión no tienen huella (se borraron en la transacción), y si la baja
  llega mientras entra, `recordSignIn` falla y la sesión recién creada se cierra (pruebas en
  `sessions.test.ts:183` y `offline.test.ts`, E16 a E16c). Las sesiones que tenía salen de la memoria
  después de confirmar. Leí el orden de las escrituras y no encontré una ventana en la que la sesión
  nueva quede en memoria después de la baja: `remember` corre en la misma vuelta que la respuesta de
  `recordSignIn`, antes de que la baja pueda terminar.
- **Permisos y lo ajeno:** en la etapa a todos pueden todo (R1.1). Las rutas de sesiones y celulares
  nombran a la persona y filtran por ella (`phoneOf` y `closeSessions` con `user_id`): un celular de
  otra da `404` (con prueba). «Cerrar» con una sesión de otra devuelve `200` con cero en vez de
  `404` (punto 18); no da nada.
- **La aplicación en el navegador:** no guarda nada nuevo en el dispositivo; no hay HTML inyectado
  (Preact escapa y la aplicación prohíbe `dangerouslySetInnerHTML`). La política de contenido y
  `frame-ancestors` no cambian. Solo el punto 19.
- **Datos personales:** la lista, las sesiones y los celulares se quedan entre el servidor y la
  aplicación; a terceros no sale nada nuevo. La dirección de internet no sale en ninguna respuesta.
- **Abuso:** puntos 14 y 17. Las rutas `GET` con sesión (`/api/users`, la tarjeta, `/api/lost-phones`)
  no tienen tope; es un riesgo de alguien de adentro y se puede dejar.
- **Sin conexión:** punto 15. Una huella quitada no confirma nada y la baja da `not-authorized` sin
  revelar si la firma servía.
- **El despliegue:** solo cambia `install.sh`, que corre el comando con el correo entre comillas y
  acepta el «ya había personas» (código 2). Caddy, puertos, volúmenes y contenedores, sin cambios. El
  `.env` viejo con `INITIAL_ADMIN_EMAIL` no rompe nada.
- **El comando:** valida el correo con `includes('@')`, sin largo máximo ni la forma de correo del
  contrato: un correo mal escrito deja una instalación sin nadie que entre y el comando ya no deja
  corregirlo. No es un ataque (lo corre quien instala); propongo usar `authorizeBody` del contrato.
  Diez minutos. No comprobé qué muestran sus errores si la base no responde.
- **Dependencias:** ninguna nueva en estos commits. `pnpm audit --prod`: sin fallas conocidas.

### Fuera de seguridad

- **Cambiar solo el correo borra el nombre escrito** (`users/people.ts:52-56`): `cleanName(undefined)`
  da `null` y `changeEmail` lo guarda. El contrato dice «sin `name`, no cambia». Lo vi en la prueba de
  sondeo: una persona autorizada como «Nuevo» quedó con `name: null` al cambiarle el correo.
