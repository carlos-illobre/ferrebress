# Revisión de seguridad del código · 03 · Celular y computadora (`device-link`), etapa a

## Paso 7: el código

Revisión independiente del código ya programado del vínculo y el espejo, contra las
[reglas](../../chapters/03-device-link/rules.md), el [diseño](device-link.md) (en especial § 3.5, § 4.2,
§ 5, § 7, § 10 y § 16), el [ADR-017](../adr/ADR-017-realtime-channel-and-mirror.md) y lo acordado en la
[revisión de seguridad del diseño](device-link-security-review.md) (paso 4). Mirada como la haría
alguien que quiere entrar sin permiso, ver lo ajeno, cambiar datos o tirar el sistema.

Leí el servidor (`src/server/modules/device-link/`: `guard.ts`, `members.ts`, `topics.ts`, `sdp.ts`,
`lifecycle.ts`, `listeners.ts`, `context.ts`, `settings.ts`, `routes/codes.ts`, `routes/meet.ts`,
`routes/state.ts`), el canal común (`src/server/platform/realtime/`), `platform/session.ts`,
`platform/start-parts.ts`, `platform/request-checks.ts`, `platform/header-fields.ts`,
`platform/http.ts`, `src/shared/peer/candidates.ts`, `src/shared/contracts/device-link.ts` y
`pairing.ts`; y en la aplicación `src/app/modules/device-link/` (`confirm.ts`, `wire.ts`, `pair.ts`,
`journal.ts`, `strip.ts`, `watch.ts`, `start.ts`, `runtime.ts`, `runtime/*`, `machine/*`),
`src/app/platform/mirror/` (`registry.ts`, `query.ts`, `use-mirrored.ts`, `route.ts`),
`src/app/platform/peer/`, `src/app/platform/realtime/channel.ts`, `src/app/platform/server/api.ts` y
`fields.ts`, `src/app/platform/schema.ts`, `src/app/modules/sign-in/session.ts` y `src/app/App.tsx`.
Las pruebas del módulo, por su nombre y en parte por su contenido.

Gravedad: **crítica** (cualquiera entra o ve lo ajeno sin condiciones), **alta** (se puede quedar con
la sesión o los datos de otra persona en una situación que pasa en el uso normal), **media** (un
control que el diseño da por puesto falta y deja pasar algo, dentro de lo que la regla ya acepta, o un
riesgo con condiciones difíciles), **baja** (endurecimiento, diagnóstico o una diferencia con el
diseño sin daño concreto).

## Resumen

Lo que decide el servidor está bien atado y coincide con lo acordado en el paso 4: **nadie de otra
cuenta se vincula** (el código se mira contra la persona antes de gastarse), **nadie actúa sobre un
vínculo ajeno** cambiando un identificador (todo sale de la sesión: persona, dispositivo y lado, nunca
de `X-Device-Id` ni del cuerpo), el tema `device-link.pairing:<id>` compara el `<id>` con el vínculo de
la sesión, el boleto está atado a la sesión del celular y a los vínculos que reemplaza, el respaldo
mira en cada lote que el otro lado tenga la sesión abierta, el `report` tiene contrato cerrado y la
línea del registro no lleva direcciones ni la descripción, el SSE no se puede inyectar, y el filtro de
candidatos corre en los dos lados con la misma regla. La confirmación del directo (§ 7) está bien
hecha: cada conexión empieza sin confirmar, la huella vacía falla cerrada, `resume` o `hello` por un
directo conservado vuelven a preguntar antes de la foto, y los `q:` solo van de la computadora al
celular. `pnpm audit --prod`: «No known vulnerabilities found»; el módulo no suma bibliotecas.

Lo que encontré está en los bordes: una pieza de seguridad que rompe otra (salir con `X-Pairing`),
dos controles que el diseño da por puestos y no están (retener el espejo cuando cambia `l=`, y cortar
al cerrarse la sesión propia), y varios endurecimientos.

| # | Hallazgo | Gravedad |
|---|---|---|
| 1 | «Salir» mientras se espeja lleva `X-Pairing`; si el vínculo terminó o el otro lado ya no tiene sesión, el servidor contesta 409, **la sesión queda abierta** y la aplicación muestra la entrada como si hubiera salido | **Alta** |
| 2 | La huella `l=` no retiene el espejo: la respuesta que trae el aviso de que el vínculo terminó se reenvía igual al otro | Media |
| 3 | La sesión propia cerrada o vencida no dispara `sessionLost`: el espejo sigue debajo de la entrada | Media |
| 4 | El respaldo no tiene el tope de 1 MB por minuto: 600 mensajes de hasta 64 KB | Baja |
| 5 | La dirección espejada se valida con una expresión, no contra las direcciones del menú | Baja |
| 6 | El reloj (`c`) y la marca de «el que manda» (`l`) de un parche los elige quien lo manda | Baja |
| 7 | «Sin internet» es cualquier respuesta que no es JSON, y deja seguir con la última confirmación sin tope | Baja |
| 8 | La tira guarda el `userId` en el dispositivo; los descartes del espejo no llegan al diario | Baja |
| 9 | Auditoría: `not-paired` no se anota nunca; el reemplazo al entrar no lleva las direcciones | Baja |
| 10 | Leer el código no vuelve a mirar que la sesión de la computadora siga abierta | Baja |
| 11 | El filtro de direcciones no mira las líneas `c=` ni el puerto de `m=` | Baja |
| 12 | «Celular» o «computadora» sale del `User-Agent` que manda el navegador | Baja |
| 13 | Después de un reinicio del servidor, `X-Pairing` deja pasar sin saber la sesión del otro | Baja |
| 14 | No hay nada en `api.ts` que impida que un cambio llegado del otro dispare un POST | Baja |
| 15 | Al cambiar de persona, los `q:` recibidos del otro no vuelven a su valor inicial | Baja |
| 16 | Los temas hacen efectos al autorizar, antes de saber si el canal se abre | Baja |

---

## 1 · Salir con `X-Pairing` no cierra la sesión — Alta

**Dónde.**

- `src/app/modules/device-link/watch.ts:77` a `:80`: el decorador suma `X-Pairing` a **toda**
  escritura mientras el estado es `direct` o `relayed`, sin mirar la ruta.
- `src/app/modules/sign-in/session.ts:93` a `:105`: `signOut()` olvida la sesión en el dispositivo y
  pone `person` en `undefined` **antes** del POST; ese cambio solo encola `sessionLost`
  (`watch.ts:68`, `runtime.ts:42`), así que cuando `api()` arma las cabeceras (`api.ts:59`,
  sincrónico) la máquina sigue en `direct`. Si la respuesta no es `ok` y el error no es `offline`, no
  hace nada (`:102`).
- `src/server/modules/device-link/guard.ts:48` a `:57` y `:27` a `:32`: el paso corre antes de
  **todas** las rutas de `/api/*` (`platform/http.ts:85`), también `/api/sign-out`, y contesta `409
  pairing-ended` si el vínculo ya no es el de la sesión **o si la sesión del otro lado está cerrada**.
  La ruta no corre: la sesión no se cierra.

**El ataque, paso a paso.**

1. Ana trabaja con el celular y la computadora del mostrador en «Directo», los dos a la vista.
2. La sesión del celular se cierra sin que la computadora lo sepa todavía. Pasa en el uso normal: el
   tope de 8 horas (01 · R3.1) llega antes en el celular porque Ana entró antes ahí; o un
   Administrador corta el celular (E15, E39b) o cierra su sesión desde Usuarios (E14). La computadora
   solo confirma cuando tiene algo que mandar y la confirmación tiene más de 4 minutos (§ 7.1): si
   nadie toca nada, sigue en `direct` todo lo que dure. Y el celular tampoco suelta el directo al
   perder su sesión (punto 3).
3. Ana toca «Salir» en la computadora y se va. La pantalla muestra la entrada.
4. El `POST /api/sign-out` llevó `X-Pairing`. `stillPaired` da falso (el otro lado ya no tiene
   sesión, o el vínculo terminó) y el servidor contesta `409 pairing-ended`. La sesión de Ana sigue
   abierta en el servidor, y su cookie sigue en el navegador. La auditoría no anota la salida: anota
   un `device-link.rejected`.
5. Beto, o un cliente, recarga la página de esa computadora. `/api/start` contesta con la persona de
   la cookie, `boot()` la confirma (`App.tsx`, `confirmed(start.data.person)`) y queda adentro como
   Ana, con sus permisos, hasta que la sesión venza por falta de uso o llegue a las 8 horas.

Lo mismo al revés: salir en el celular cuando la computadora perdió la sesión deja abierta la del
celular, que es la que más se pierde. Y del mismo modo, mientras dura esa ventana, «Desvincular» y
«Desconectar» desde este lado (`/api/device-link/unpair`, `/pause`) dan 409 y no hacen nada, y el
cambio de temas del canal (`/api/realtime/subscriptions`) también.

**Qué consigue.** Una persona se queda con la sesión de otra en la computadora compartida, que es lo
que «Salir» tiene que impedir (01 · R3). Lo pude seguir en el código pero no lo corrí: no hay una
prueba de salir con `X-Pairing` (la de `meet.test.ts:143` sale sin la cabecera).

**Qué propongo.**

- En el servidor, que el paso de `X-Pairing` no mire las rutas que no son del negocio: `/api/sign-out`,
  las de `sign-in`, `/api/realtime/*` y las del propio vínculo (que ya miran el vínculo de la sesión
  por su cuenta). Una lista en `guard.ts`. Unas 5 líneas.
- En la aplicación, que el decorador tampoco la sume a esas rutas (ya recibe `path`).
- En `signOut()`, si la salida falla por algo que no es `offline`, que no dé por cerrada la sesión
  en silencio: reintentar sin decoradores o avisar «No se pudo salir».
- Que la aplicación atienda `409 pairing-ended` como dice § 7.2: pasar a «Sin vincular» (un `check`).
- Pruebas: salir con `X-Pairing` de un vínculo terminado, y con el otro lado sin sesión, cierra la
  sesión; desvincular en esa misma situación funciona.

Cuesta una hora con las pruebas.

## 2 · `l=` no retiene el espejo — Media

**Dónde.** `src/app/modules/device-link/watch.ts:76`: `onField('l', () => runtime.pairingChanged())`.
`pairingChanged` (`runtime.ts:64` a `:71`) solo encola un `check` y devuelve `undefined`, así que
`readFields` (`platform/server/fields.ts:25` y `:27`) no espera nada y `api()` devuelve la respuesta
enseguida. No existe `mirror.hold` (lo busqué en `platform/mirror/` y en el módulo). El diseño (§ 3.5)
dice: «la respuesta que trajo el cambio no se reenvía hasta saber cómo está el vínculo», y la revisión
del paso 4 lo dio por resuelto (punto 1, ataque B).

**El ataque.**

1. E39b: un cliente se lleva el celular de Ana, abierto y en «Directo». Un Administrador lo corta como
   perdido: el vínculo termina en el servidor.
2. Ana, en la computadora, abre la lista de personas o la tarjeta de alguien. La respuesta trae la
   cabecera sin `l=` (el vínculo se olvidó en `members`), que es un cambio.
3. `useMirroredQuery` (`query.ts:42`) guarda la respuesta; el valor viaja por el puerto
   (`registry.ts:109`), la confirmación está fresca (menos de 4 minutos) y `gate` lo manda en el acto
   (`confirm.ts:99`). El `check` encolado sale después.
4. El celular robado recibe esa respuesta entera y todo lo que la computadora mande hasta que vuelva
   el `check` (un viaje de ida y vuelta).

**Qué consigue.** Exactamente lo que § 3.5 dice cerrar: la respuesta que trae el aviso llega al
dispositivo cortado. Queda dentro de los 4 minutos que acepta R2.6, por eso no es más grave; pero es
un control escrito que no está y no tiene prueba.

**Qué propongo.** Que el oyente de `l=` devuelva una promesa: en `direct`, forzar una confirmación
nueva (`confirm.ensure(0)`, que ya retiene lo que sale y lo que entra) y esperar su resultado; `api()`
ya espera a los oyentes. Si dice `none` o `gone`, la máquina corta antes de que la pantalla reciba la
respuesta. Unas 15 líneas y la prueba del paso 4: «una respuesta con `l=` cambiada no sale por el
espejo».

## 3 · La sesión propia cerrada o vencida no corta el espejo — Media

**Dónde.** `src/app/modules/device-link/watch.ts:66` a `:71`: `sessionLost` sale solo cuando cambia
`person`. Cuando el servidor dice que la sesión se cerró (`api.ts:84`, `sessionClosed`), `person`
queda igual y la entrada aparece encima del marco (`App.tsx`, `entrance = … || !!closed`), con el marco
montado debajo. Nadie del vínculo escucha `sessionClosed`. El diseño (§ 8.3, el evento en § 8.1) dice
que `sessionLost` es «salir, sesión cerrada o vencida, otra persona», y corre «antes que todo».

**El ataque.**

- La sesión de la computadora vence por falta de uso, la cierra un Administrador o llega a las 8
  horas. La computadora sigue en `direct`: sigue aplicando lo que manda el celular y mandándole lo que
  tiene, debajo de la entrada, hasta que necesite confirmar (hasta 4 minutos de uso) o entre otra
  persona.
- Si entra Beto en esa pestaña, `person` cambia y recién ahí se encola `sessionLost`. Lo que Beto haga
  en ese instante sale por el espejo si la fila está ocupada (por ejemplo, la foto espera el saludo
  hasta 5 s, `mirror-port.ts:52` a `:69`, dentro de la fila). Es una carrera estrecha; no la pude
  reproducir.
- Del lado del celular: si su sesión se cierra (8 horas), el celular sigue en «Directo» y recibiendo.
  Con el punto 1, esto mantiene abierta la ventana en que salir falla.

**Qué propongo.** Escuchar `sessionClosed` en `watch.ts`: con un motivo, `sessionLost` con
`samePerson: true` (y la entrada de otra persona después hace el reinicio de los valores, como hoy).
Y que el cambio de persona suelte el espejo en el acto (`mirror.detach()` sincrónico) antes de encolar
el resto. Unas 10 líneas y la prueba del paso 4 «la sesión vence, el par de mentira no recibe nada».

## 4 · El respaldo sin tope de bytes — Baja

**Dónde.** `src/server/modules/device-link/routes/meet.ts:55` a `:57` y `settings.ts:16`: cuenta
mensajes (600 por minuto por sesión), no bytes. El diseño (§ 10.2) dice «600 mensajes y 1 MB por
minuto».

**El ataque.** Una aplicación modificada, con la sesión de la misma persona, manda 600 pedidos por
minuto con un mensaje de casi 64 KB cada uno (el cuerpo tiene ese tope, y el límite cuenta mensajes):
unos 38 MB por minuto que el servidor reenvía al celular por su SSE. El
tope del oyente lento (256 KB) protege la memoria del servidor, pero el celular paga esos datos. Es la
misma persona, así que el daño es gasto y carga.

**Qué propongo.** Contar los bytes del cuerpo en otra clave del limitador (`device-link:relay-bytes`),
1 MB por minuto. Tres líneas y una prueba.

## 5 · La dirección espejada no se compara con el menú — Baja

**Dónde.** `src/app/platform/mirror/route.ts:9` a `:11` y `:27`. § 5.4 dice «validado contra las
direcciones del menú»; el código acepta cualquier camino que cumpla `/^\/[A-Za-z0-9/_-]{0,200}$/` y
cualquier `search` sin `#`, y navega con `force: true` (sin la guarda de lo sin guardar).

**El ataque.** Un dispositivo cortado, dentro de los 4 minutos, lleva al otro a cualquier camino de la
aplicación, también los que no están en el menú, con parámetros a su gusto. Hoy no encontré un camino
que haga algo al abrirse (`/pair` y `/link` solo leen el `#` al arrancar, y el `#` no viaja), así que
no hay daño concreto; queda en manos de que ninguna pantalla futura actúe al abrirse.

**Qué propongo.** Validar `path` contra la tabla del router o del menú, como dice el diseño. Unas 5
líneas y una prueba con un camino fuera de la tabla.

## 6 · El reloj y «el que manda» los elige el que manda el parche — Baja

**Dónde.** `src/app/modules/device-link/wire.ts:21` y `:22`: `c` es cualquier entero desde 0 (zod lo
limita a enteros seguros) y `l` cualquier booleano. `registry.ts:32` y `:91` a `:100`: `wins` usa los
dos tal como llegan, sin comparar `l` con el papel de quien manda.

**El ataque.** Un par modificado manda `c: 9007199254740991`. El reloj de la otra pestaña sube a ese
valor (`registry.ts:85`) y su próximo cambio sale con `2^53`, que ya no es un entero seguro: el otro lo
descarta por el esquema. Desde ahí el espejo de esa pestaña queda roto hasta recargar. Con `l: true`,
el celular gana los empates como si fuera la computadora. Es un corte de servicio entre dispositivos
de la misma persona, no una lectura ni una escritura ajena.

**Qué propongo.** Que `receiveOne` ignore el `l` que llega y use el papel del otro (lo sabe el puerto:
`!port.leader`), y un tope al salto del reloj (por ejemplo, no más de `clock + 10.000` de una vez).
Unas 5 líneas y una prueba.

## 7 · «Sin internet» deja seguir sin tope — Baja

**Dónde.** `src/app/platform/server/api.ts:74` a `:77`: sin respuesta o con una que no es JSON se da
por «sin conexión». `src/app/modules/device-link/confirm.ts:45`: con «sin conexión», vale la última
confirmación buena de esta conexión, sin importar su edad. Es lo que dice R3.4 y lo aceptó Carlos.

**El ataque.** § 7.1 dice que «el otro no puede hacer que le falte internet». En un Wi-Fi compartido
no es del todo así: quien tiene el celular cortado y una notebook en el mismo Wi-Fi puede, con un
envenenamiento de ARP o un punto de acceso con el mismo nombre, cortarle a la computadora el camino al
servidor sin cortar el Wi-Fi local. La computadora queda «Sin internet» y sigue espejando con la
confirmación de antes todo lo que dure. Lo que ve es lo que hay en pantalla y lo que se escribe ahí
(sin internet, la computadora no trae datos nuevos). Pide conocimiento y equipo; no lo probé.

**Qué propongo.** Corregir la frase de § 7.1 y, si Carlos quiere, un tope a esa gracia (por ejemplo,
30 minutos sin poder confirmar, y deja de espejar). Es un cambio de regla (R3.4): lo decide él. Cuesta
una línea en `confirm.ts`.

## 8 · La tira guarda el `userId`; los descartes no llegan al diario — Baja

**Dónde.**

- `src/app/modules/device-link/strip.ts:18` y `:27`: la tira se guarda en `localStorage`
  (`device-link.strip`) con `owner`, el `userId` tal cual. § 16 dice «el diario y la tira no guardan
  identificadores de personas»; el paso 4 propuso un hash corto.
- `src/app/platform/mirror/registry.ts:197`: el espejo de la aplicación se crea sin `onDiscard`, así
  que lo que se descarta por esquema, por tamaño, por clave desconocida o por ser un `q:` del celular
  no queda en el diario (§ 5.1 y § 15.1 dicen que sí). El diario en sí está bien: no guarda el vínculo,
  ni nombres, ni valores (`journal.ts:21` a `:39`).

**El ataque.** En la computadora compartida, quien entra después abre las herramientas del navegador
y ve el identificador de la persona anterior y a qué horas espejó ese día. Del otro lado, un ataque al
espejo (puntos 5 y 6) no deja rastro para diagnosticarlo.

**Qué propongo.** Guardar en `owner` un hash corto del `userId` (o borrar la tira al cambiar de
persona) y conectar `onDiscard` al diario con `keyName`. Unas 6 líneas y dos pruebas.

## 9 · Huecos de la auditoría — Baja

**Dónde.**

- `device-link.rejected` con `not-paired` está en `src/shared/audit-log/device-link.ts:16` pero no se
  anota en ningún lado: `topics.ts:64`, `routes/meet.ts:22` y `:66`, `routes/state.ts:21` y `:36`
  contestan sin anotar. § 11.2 dice que se anota «un pedido de quien no es del vínculo», una vez por
  ventana y por sesión.
- `device-link.replaced` con `how: 'sign-in'` (`lifecycle.ts:83`) lleva solo `how`. § 11.2, por el
  punto 13 del paso 4, dice que lleva la dirección de las dos computadoras: es lo que permite ver
  después un engaño en la entrada con el celular.

**El ataque.** No hay uno nuevo: falta el rastro de alguien que prueba temas o rutas de un vínculo que
no es suyo, y el de un reemplazo sospechoso.

**Qué propongo.** `ctx.recordOnce(c, 'not-paired:<sesión>', 'device-link.rejected', …)` en esos cinco
lugares, y las direcciones en el reemplazo al entrar (las tiene el aviso de `sign-in`). Unas 10
líneas y dos pruebas.

## 10 · Leer el código no vuelve a mirar la sesión de la computadora — Baja

**Dónde.** `src/server/modules/device-link/routes/codes.ts:44` a `:59`: `read` toma la computadora de
`ctx.computers` sin `computerOf` (que sí usa `accept`, `:80`). § 10.3: «Se vuelve a mirar que la sesión
dueña del código siga abierta».

**El ataque.** Si la sesión de la computadora vence por falta de uso, su canal se cierra recién en el
próximo latido (hasta 40 s, `realtime.ts:30` a `:37`); en ese rato el código sigue sirviendo y el
celular de la misma persona vincula esa computadora. Como tiene que ser la misma persona, no hay un
daño concreto.

**Qué propongo.** Llamar a `computerOf(ctx, outcome.owner)` antes de mirar la persona. Una línea; la
prueba «un código de una computadora que ya no tiene sesión vence» (`pairing.test.ts:177`) se puede
extender al vencimiento por falta de uso sin latido.

## 11 · El filtro de direcciones no mira `c=` ni `m=` — Baja

**Dónde.** `src/server/modules/device-link/sdp.ts:19` y `src/shared/peer/candidates.ts:14` a `:24`:
solo se filtran las líneas `a=candidate:`.

**El riesgo.** Por JSEP, la descripción local ya juntada lleva en `c=IN IP4 …` (o `IP6`) y en el puerto
de `m=` la dirección del candidato por omisión. Si Chrome elige ahí una dirección real (la IPv6 global
de los datos móviles, con el permiso de cámara), esa dirección pasa igual al otro dispositivo. Además
`fe80::/10` se deja pasar, y en algunos sistemas la dirección de enlace local lleva la MAC. Lo que se
filtra va al otro dispositivo de la misma persona, por HTTPS y sin registrarse, así que el daño es
chico. **No lo pude comprobar:** no tengo un celular para ver qué pone Chrome en `c=` con candidatos
locales y con el permiso de la cámara. La prueba de campo lo puede mirar.

**Qué propongo.** Reescribir `c=` a `IN IP4 0.0.0.0` y el puerto de `m=` a `9` en `filterCandidates` y
en `checkSdp`, como hacen las descripciones sin candidatos. Unas 4 líneas y un caso más en
`meet.test.ts:44`.

## 12 · «Celular» sale del `User-Agent` — Baja

**Dónde.** `src/server/platform/device.ts:38`: `isPhone(User-Agent, Sec-CH-UA-Mobile)`, que manda el
navegador; la sesión lo guarda y de ahí salen `not-a-phone` (`codes.ts:46`), el lado del vínculo y el
tema del código.

**El ataque.** Una computadora que dice ser un celular (cambiando el agente en las herramientas del
navegador al entrar) lee el código de otra computadora de la misma persona y las vincula. Solo entre
dispositivos de la misma persona: no hay acceso ajeno. Lo anoto porque `not-a-phone` parece un
control y no lo es.

**Qué propongo.** Dejarlo escrito en § 16 como lo que es (una ayuda, no un control). No cuesta nada.

## 13 · Después de un reinicio, `X-Pairing` no sabe de la sesión del otro — Baja

**Dónde.** `src/server/modules/device-link/guard.ts:31`: `other === undefined` pasa. `members` vive en
memoria, y después de un reinicio (cada subida a `main` despliega) no sabe qué sesión usa cada lado
hasta que escuchen el tema o confirmen.

**El riesgo.** En ese rato una escritura con `X-Pairing` pasa aunque la sesión del otro lado ya se haya
cerrado. Es poco, porque la confirmación del otro lado sí falla (abajo). Además, no es de seguridad pero
conviene saberlo: después de un reinicio, la primera confirmación de cualquiera de los dos da `gone`
(`routes/state.ts:49` a `:66`: no hay sesión ni huella del otro en memoria) y los corta; cada
despliegue rompe los espejos que había y los hace presentarse de nuevo.

**Qué propongo.** Que `check` con `fp` diga «no sé» cuando falta el dato (que la aplicación trate como
«sin conexión», o que presente de nuevo sin cortar), y que `stillPaired` con el otro desconocido mire
`sessions` por persona y dispositivo. Unas 10 líneas.

## 14 · Nada impide que un cambio del otro dispare un POST — Baja

**Dónde.** § 5.3: «Mientras el espejo aplica algo del otro, `api.ts` no deja salir un POST (falla en
desarrollo)». No está: `registry.ts:81` a `:87` avisa a los oyentes sin marcar nada, y `api.ts` no lo
mira.

**El riesgo.** Hoy no encontré ningún efecto de pantalla que escriba al cambiar un valor espejado. Si
mañana una pantalla (ventas, precios) lo hace, un dispositivo cortado, dentro de los 4 minutos, haría
escribir a la computadora con su sesión; `X-Pairing` lo frena solo si el vínculo ya terminó.

**Qué propongo.** Lo que dice el diseño: una marca `applying` en `receiveOne` y `adopt`, y que `api()`
con cuerpo tire en desarrollo si está puesta. Unas 8 líneas y una prueba.

## 15 · Los `q:` recibidos no vuelven a su valor inicial al cambiar de persona — Baja

**Dónde.** `src/app/platform/mirror/registry.ts:154` a `:162`: `adopt([])`, que usa el reinicio por otra
persona (`mirror-port.ts`, `detachMirror(reset)`), saltea las claves `q:`.

**El riesgo.** En el celular, lo que trajo la computadora de Ana (una tarjeta de persona, una lista) se
queda en las pantallas montadas si entra otra persona en ese celular, hasta que la pantalla vuelva a
pedir. En la computadora los `q:` son suyos, pedidos con la sesión de Ana, y lo que pasa con ellos al
entrar Beto es de 01 (`discardWork`). Es raro que otra persona entre en el celular de alguien; no lo
probé.

**Qué propongo.** Que el reinicio por otra persona vuelva también los `q:` a `null` (la pantalla pide
de nuevo). Una línea y una prueba.

## 16 · Efectos al autorizar un tema — Baja

**Dónde.** `src/server/modules/device-link/topics.ts:39` y `:65`: `authorize` guarda la computadora del
código y la sesión de cada lado. `src/server/platform/realtime/routes.ts:77` y `:82`: se autoriza antes
de admitir el canal, así que un canal que después da 429 deja esos datos puestos (y el de la
computadora no se borra nunca, porque nunca hubo `onUnsubscribe`).

**El riesgo.** Una entrada por sesión en `computers` que no se libera: un desgaste de memoria acotado
por las sesiones, sin acceso a nada. No encontré cómo aprovecharlo.

**Qué propongo.** Admitir antes de autorizar, o mover esos efectos a `onSubscribe`. Unas 5 líneas.

---

## Lo del paso 4, punto por punto

| Paso 4 | Cómo quedó |
|---|---|
| 1 · El directo cortado | En parte. La confirmación de 4 minutos atada a la huella y la de 30 s antes de la foto están (`confirm.ts`, `machine/types.ts:84` a `:101`, `mirror-port.ts:36`). Los `q:` solo de la computadora y lo pedido por el celular que no viaja, también (`registry.ts:93`, `query.ts:19` a `:21`). `X-Pairing` está pero rompe «Salir» (punto 1). Falta retener con `l=` (punto 2) y la guarda de `api.ts` (punto 14) |
| 2 · La sesión del celular que no pide | Cumplido: la confirmación es un pedido con sesión (`routes/state.ts`, `sessions.require`) y el otro recibe `gone` con la sesión vencida (`isOpen` calcula con la hora de ahora) |
| 3 · `sessionLost` y `onEnded` | En parte. `onEnded` avisa también al salir (`sessions/store.ts:114`) y el latido cierra los canales vencidos. `sessionLost` solo con el cambio de persona (punto 3) |
| 4 · Persona y dispositivo de la sesión | Cumplido en todas las rutas, temas, límites y `recordOnce`. No hay una prueba con `X-Device-Id` de otro dispositivo |
| 5 · Código y boleto | Cumplido, salvo volver a mirar la sesión de la computadora al leer (punto 10) |
| 6 · Topes del canal | Cumplido (`admission.ts`): por sesión, anónimos con su tope, por red |
| 7 · El hub | Cumplido: claves por lado, `drop`, dueño fijo, oyente lento a los 256 KB, nombres del registro y `JSON.stringify` |
| 8 · Esquema por valor | Cumplido el esquema y la bandeja con tope; la dirección no va contra el menú (punto 5); el reloj y `l` (punto 6) |
| 9 · Diario y tira | El diario, cumplido; la tira guarda el `userId` (punto 8) |
| 10 · `report` | Cumplido: contrato cerrado, el navegador y el sistema de una lista cerrada, sin SDP, solo con vínculo. El navegador sale del pedido y no de las dos sesiones; no cambia nada |
| 11 · Direcciones de WebRTC | Cumplido para `a=candidate:` en los dos lados; `c=` y `m=` (punto 11) |
| 12 · Varias copias | Escrito en § 16 |
| 13 · Reemplazo al entrar | El aviso está (`replaced.ts`); la auditoría no lleva las direcciones (punto 9) |
| 14 · El espejo mantiene la sesión | Escrito en § 16 y R2.5 como aceptado |

## Pruebas: cada riesgo con su ataque

Las que intentan el ataque y fallan, y están: otra cuenta no vincula ni gasta el código; el boleto desde
otra sesión o con otros vínculos; un tema de otro vínculo; el respaldo con la sesión del otro cerrada o
vencida; escrituras con un vínculo terminado o sin sesión; la descripción con direcciones públicas,
TCP o `srflx`; el oyente lento; los saltos de línea en el SSE; el canal de otro dueño; sin huella del
otro no sale nada; lo que manda un celular cortado no entra pasados los 4 minutos; un `q:` del celular,
un valor sin su esquema o de más de 64 KB no entran; lo pedido por el celular no viaja.

Las que faltan (del paso 4 y de esta revisión):

- Salir con `X-Pairing` de un vínculo terminado cierra la sesión (punto 1).
- Una respuesta con `l=` cambiada no sale por el espejo (punto 2).
- La sesión propia vence o se cierra y el par de mentira no recibe nada (punto 3).
- `resume` o `hello` por un directo conservado, con el vínculo terminado: la computadora no manda la
  foto. El mecanismo está, pero la prueba de `runtime.test.ts` es con el vínculo vigente.
- Cada ruta con `X-Device-Id` de otro dispositivo de la misma persona contesta por el de la sesión.
- Una dirección fuera del menú no navega (punto 5).
- El respaldo con más de 1 MB por minuto se frena (punto 4).

## Dependencias

El módulo no suma bibliotecas (WebRTC, Web Locks y `BroadcastChannel` son del navegador; el SSE es
`hono/streaming`). `pnpm audit --prod`, corrido en esta revisión: «No known vulnerabilities found».

## Lo que no pude comprobar

- Qué pone Chrome en Android en `c=` y en `m=` con el permiso de la cámara (punto 11).
- La carrera del punto 3 al entrar otra persona: la seguí en el código, no la reproduje.
- El punto 1 lo seguí en el código (`signOut`, el decorador, el paso del servidor y la falta de manejo
  del 409), pero no lo corrí de punta a punta.
- El ataque de red del punto 7 no lo probé.
