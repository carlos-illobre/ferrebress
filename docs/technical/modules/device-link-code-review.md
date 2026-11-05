# Revisión del código · 03a · Celular y computadora (`device-link`), etapa a: vínculo y espejo

Revisión del paso 7 (constitución), hecha solo con los documentos y el código: el
[capítulo 03](../../chapters/03-device-link/rules.md) (R1 a R8, E01 a E44), su
[screens.md](../../chapters/03-device-link/screens.md) y la maqueta aprobada
(`mockups/device-link-indicator/final/`, su `changes.md`), el [diseño](device-link.md) con sus dos
revisiones y el [ADR-017](../adr/ADR-017-realtime-channel-and-mirror.md), y el código de los commits
`d9c1027` a `14d9f04`: `src/server/modules/device-link/`, `src/server/platform/realtime/`,
`start-parts.ts`, `request-checks.ts`, `header-fields.ts`; `src/app/modules/device-link/`,
`src/app/platform/{realtime,mirror,peer,camera}/`, `schema.ts`, `ui/camera/`, `ui/toast/`; lo que pasó
a espejarse en `users` y `audit-log`; `tools/checks/local-state.ts`; y las pruebas y ayudas de
`src/app/testing/` y `tests/e2e/device-link.spec.ts`.

**Lo que corrí:** las pruebas del módulo con `vitest run`: en la aplicación (`device-link`, `mirror`,
`peer`, `realtime`, `camera`) pasan 200 en 23 archivos; en el servidor (`device-link` y
`platform/realtime`, contra la base del compose) pasan 57 en 8 archivos. **No corrí** `pnpm check`
entero, las de punta a punta ni las capturas, y no miré las pantallas funcionando: lo de las pantallas
sale de leer el código contra la maqueta. Las carreras que se describen abajo salen de leer el código;
ninguna la reproduje en un navegador.

Gravedad:

- **Bloqueante:** un escenario que no se cumple, una regla de la constitución que no se cumple o una
  meta del diseño sin su prueba. Frena el cierre.
- **Importante:** un error posible (una carrera, un dato que se gasta de más, algo del diseño que no
  está) que conviene arreglar antes de cerrar; no siempre frena.
- **Menor:** una mejora.

T122 (espejar el manual) y T123 (`useMirroredQuery` en `forward` para las listas) están pospuestos a
propósito y no se cuentan como hallazgos; se comentan donde tocan.

## Resumen

La base está bien pensada y en general bien hecha: la máquina de estados es pura, con `assertNever`, y
se prueba con tablas; los comandos se corren con un mapa exhaustivo; el canal común del servidor no
sabe de ningún tema y tiene sus topes; el transporte tiene una sola interfaz con dos variantes; el
espejo LWW con reloj de Lamport es chico y claro; la confirmación de 4 minutos está aislada y
probada; el filtro de candidatos es uno solo, compartido entre la aplicación y el servidor. Los
comentarios de cabecera están en casi todos los archivos y casi todos dicen el porqué.

Lo que frena:

1. **E07/E08 en el celular:** después de entrar a una computadora con el celular, el celular sin
   vínculo previo no se entera nunca de que quedó vinculado (hasta recargar).
2. **Una pestaña sin el candado se suscribe al tema del vínculo:** la primera huella `l=` que ve
   cada pestaña (y cada cambio después) termina en `serverSaid` y en `subscribe`, tenga o no el
   candado. Rompe «solo la que tiene el candado se suscribe» (R6.4, E35) y suma un `check` en cada
   apertura de la aplicación.
3. **E29 sin directo conservado:** la computadora desconectada no escucha, así que «Reconectar» en
   el celular no llega hasta que alguien use la computadora.
4. **E33c en la foto:** lo que la pantalla eligió sola (`auto`) viaja en la foto al conectarse, y una
   prueba lo da por bueno.
5. **E36 no está hecho**, y **E13 no tiene ninguna prueba**; faltan además la prueba de una hora que
   cuenta pedidos y canales (E23, E24) y la simulación con semillas del diseño (§ 20).
6. **Consultas dentro de un bucle** (`touch`) y consultas repetidas en `codes/read` y `codes/accept`,
   sin la prueba que las cuenta (§ 18.4).

Lo importante que más pesa en «los errores difíciles de reproducir»: la fila de la máquina espera
pedidos de red adentro (y por eso `sessionLost` no corre «antes que todo»); la foto puede salir sin
confirmación; un error pasajero del servidor corta el espejo; el celular que prueba el directo y no
lo logra queda «Probando» para siempre; el respaldo puede desordenar lotes y entregar lotes viejos
a una conexión nueva; el reintento sin internet no se puede parar y corre con la pestaña oculta; el
trabajo diario de vencimiento solo corre si el servidor pasa 24 horas sin reiniciarse; y el diario
de la conexión no le llega a nadie (no está en «Algo salió mal» ni existe `replay.ts`).

## 1. Escenarios sin cumplir

**1.1 · Bloqueante · E07, E08 (R1.5): el celular no se entera del vínculo que nace al entrar con él.**
`src/server/modules/device-link/listeners.ts:51-73`, `lifecycle.ts:73`, `members.ts:57`,
`guard.ts:43-47`; en la aplicación, `src/app/modules/sign-in/codes/usePhoneCode.ts:67-84`.

- Los documentos: el diseño § 10.4 dice que `approve` contesta `pairs: true` y que el celular
  escucha el tema del vínculo hasta 30 s; «si no llega, `l=` en su próximo pedido hace lo mismo».
- El código: `approve` no devuelve `pairs` y el celular no escucha nada. El vínculo nace en el `claim`
  de la computadora (`computer-routes.ts:77`), y `afterPairing` llama a `members.ended([pairing, …])`,
  que **borra de la memoria** lo que se sabía del celular. La huella `l=` se calcula con
  `knownPairingOf`, que solo mira la memoria (`peek`), así que en las respuestas siguientes del
  celular no va `l=`. Un celular que antes no tenía vínculo tampoco tenía `l=`: el campo no cambia,
  `pairingChanged` no corre y el celular queda «Sin vincular» hasta que algo cargue la memoria (un
  `/api/start`, es decir, recargar). La computadora espera al celular, que nunca la busca.
- En E08 (el celular ya tenía otro vínculo) sí funciona, pero de casualidad: `l=` pasa de un valor a
  «nada», y eso dispara el `check`.
- Ninguna prueba de la aplicación recorre E07: `state.test.ts:135` lo prueba solo en el servidor.
- Propuesta: que `l=` no dependa de que la memoria esté cargada (cargarla en `start.contribute` y al
  terminar `afterPairing`, o que el campo diga «ninguno» de forma explícita), o hacer lo que dice el
  diseño (`pairs: true` y escuchar). Y una prueba con los dos dispositivos que entre con el celular.

**1.2 · Bloqueante · R6.4, E35: una pestaña sin el candado se suscribe al tema del vínculo.**
`src/app/modules/device-link/watch.ts:82`, `runtime.ts:64-71`, `machine/arrive.ts:36-42`.

- Los documentos: «Solo la que tiene el candado se suscribe al tema del vínculo: decide un solo
  lugar» (diseño § 6); y el vínculo toma su estado de `/api/start` «sin un pedido más» (§ 10.1).
- El código: `onField('l', () => runtime.pairingChanged())` corre siempre, sin mirar si la pestaña
  está activa. `readFields` (`platform/server/fields.ts:23`) cuenta como cambio el primer valor que ve
  cada pestaña, así que la primera respuesta con `l=` después de arrancar el vínculo llama a
  `pairingChanged`. En `asleep` (la pestaña que abrió sin el candado), o en cualquier estado que no
  sea `waiting`, eso hace `check`, el `serverSaid` lleva de `asleep` a `waiting` y la computadora
  hace `subscribe`. Dos pestañas quedan escuchando la clave `<id>:computer`: las dos reciben el mismo
  `attempt`, las dos ofrecen, y la respuesta del celular les llega a las dos con el mismo intento
  (`links.ts:86-96`). En la pestaña con el candado, el mismo camino suma un `check` en cada apertura.
- Propuesta: que `pairingChanged` no haga nada si la pestaña no está activa (`active` de `watch.ts`),
  y que el primer valor de `l=` después de tomar el vínculo de `/api/start` no cuente como cambio.

**1.3 · Bloqueante · E29 (R5.2, R6.3): «Reconectar» en el celular no llega a la computadora quieta.**
`src/app/modules/device-link/machine/stay.ts:46`.

- Los documentos: la tabla de § 8.1 (`device-link.md:792`) dice que en `paused` escucha «la
  computadora a la vista, el tema del vínculo, si no conservó el directo»; § 8.3, en `resume` sin
  directo, dice que «la computadora escucha y el otro se entera por el tema o por `l=`». Pero el
  párrafo de § 8.3 (`device-link.md:877`) dice «esperando sin escuchar (… los dos después de una
  pausa)»: **el diseño se contradice**.
- El código: `onPause` sin directo conservado hace `unsubscribe` en los dos lados. Cuando el celular
  toca «Reconectar», el servidor publica `{pairing}` en la clave de la computadora, que nadie
  escucha; el celular se fija 30 s y se va. La computadora se entera recién con su próximo pedido. Pasa
  siempre que no se conservó el directo: una pausa desde «Por el servidor», o después de salir y
  entrar (E28 seguido de E29).
- Propuesta: que la computadora a la vista escuche en `paused` sin `kept`, como dice la tabla, y
  corregir el párrafo de § 8.3. Una prueba de E29 encadenado con E28.

**1.4 · Bloqueante · E33c (R6.2): lo que la computadora elige sola viaja en la foto.**
`src/app/platform/mirror/registry.ts:133-136` y `146-151`; la prueba que lo da por bueno,
`registry.test.ts:117-122`.

- Los documentos: «lo que cada pantalla elige sola por su forma, no» se espeja; E33c: el celular abre
  Usuarios «sin la tarjeta que la computadora abre sola».
- El código: `set(valor, {auto: true})` escribe el valor sin mandarlo, pero no lo marca. `snapshot`
  manda **todo lo registrado** con el valor de ahora. Si el celular se conecta (o vuelve, o se
  reconecta) con la computadora ya en Usuarios, la foto lleva `users.list.selected` con la persona
  que la computadora abrió sola, y el celular abre su tarjeta. Lo mismo con `audit-log.list.selected`.
  La prueba de la foto pone un valor `auto` en la computadora y comprueba que **llega** al celular.
- Propuesta: guardar en cada entrada si el último valor fue `auto` y, en la foto, mandar el último
  valor elegido por la persona (o el inicial). Cambiar la prueba para que diga lo de la regla.

**1.5 · Bloqueante · E36 (R1.7): no está hecho.** `src/app/modules/device-link/pair.ts:175-186`,
`screens/Read/Read.tsx:89-116`.

- Los documentos: con una entrada sin conexión que el servidor todavía no confirmó, el celular «dice
  “Para vincular hace falta internet…” y no lee el código» (diseño § 10.3).
- El código: el texto existe, pero sale solo cuando el pedido falla por red (`offline`). No se mira
  `pendingEntries` (lo que usa `users/state.ts`). Con una entrada sin confirmar, el pedido sale con una
  sesión que el servidor no conoce y termina en `failed` («No se pudo vincular») o en la entrada.
  Ninguna prueba nombra E36.
- Propuesta: antes de abrir la cámara o leer el código de `/pair`, mirar `pendingEntries` y mostrar
  el aviso. Una prueba.

**1.6 · Bloqueante · E13, y escenarios sin una prueba que los nombre.**

- E13 («se usan juntos todos los días… a los 40 días siguen vinculados») no tiene prueba en ningún
  lado. El diseño (§ 20) la pone con `rules/expire`.
- E23 y E24 (una hora sin tocar nada: ningún pedido ni canal) no tienen la prueba de § 20 que
  «cuenta pedidos y canales con el reloj falso durante una hora». Es la meta que más pesa del
  capítulo («ahorrar datos de internet»), y el hallazgo 1.2 muestra que hoy se piden cosas que no
  hacen falta.
- La **simulación de los dos dispositivos** de § 20 («una red de mentira que, según una semilla,
  demora, repite, desordena, corta… 500 semillas») no existe: `testing/two-devices.ts` arma dos
  dispositivos sobre un Wi-Fi de mentira, pero sin semillas ni fallas al azar. Es la herramienta que
  el diseño puso para las carreras de este módulo; varias de las de abajo (2.x de la sección 4) las
  habría encontrado.
- La constitución pide una prueba por escenario que lo nombre. Hoy nombran su escenario solo E01
  (de punta a punta), E03 a E08, E12, E14 a E16, E18, E19, E21, E22, E27, E29, E30, E37 a E39 y E41 a
  E42. Sin nombre (algunos están probados de hecho, otros no): E02, E09, E10, E11, E17, E17b, E20,
  E22b, E23, E23b, E24, E25, E26, E26b (sí está la tira; no está «el servidor no recibió nada»), E28,
  E31 a E35, E36, E39b, E40, E43, E44.
- Propuesta: la prueba de una hora para E23 y E24 en `runtime.test.ts` con el reloj falso, que
  cuente los `api` y los `want`; E13 en `state.test.ts` del servidor; la simulación con semillas; y
  un `describe` o un nombre por escenario en lo que ya existe.

**1.7 · Importante · E19 en el celular: si la prueba del directo falla, el celular queda «Probando».**
`src/app/modules/device-link/runtime/links.ts:78`, `platform/peer/direct.ts:65-68`.

- El celular pasa a `probe: 'trying'` y espera la oferta. Si la conexión no abre, `answer()` no tiene
  plazo y, cuando ICE se rinde, `answerOffer` sale por `if (!ok …) return` sin avisar a la máquina.
  La computadora sí pasa a `failed` y dice «No se pudo», pero no se lo dice al celular. Si la
  computadora no ofrece (se ocultó), el celular queda igual. El botón queda deshabilitado y la frase
  no cambia. La máquina se prueba (`stay.test.ts`), pero la prueba del runtime solo cubre el caso
  que sale bien.
- Propuesta: que la computadora mande el resultado (`probe-result` o un `give-up` del intento de
  prueba) y que el celular también tenga un plazo.

**1.8 · Importante · R2.2, E12: el vencimiento diario solo corre si el servidor pasa 24 horas sin
reiniciarse.** `src/server/modules/device-link/index.ts:37`, `src/server/app.ts:20-23`.

- `platform.every(day, …)` es un `setInterval` de un día: la primera vez corre a las 24 h del
  arranque. Cada subida reinicia el servidor del ambiente de pruebas, y cada promoción el de
  producción; si se reinicia más seguido que una vez por día, los vínculos no vencen nunca. La
  prueba usa `runJobs`, que esconde esto.
- Propuesta: correr el trabajo también al arrancar (o guardar cuándo corrió por última vez).

## 2. Comentarios de cabecera y carpetas

**2.1 · Importante · `runtime.ts:1-5` dice algo que no es cierto.** «Lo que tarda (abrir el directo,
esperar la foto) no frena la fila». `advance` (`runtime.ts:24`) espera cada comando, y `post`,
`report`, `check`, `newVersion`, `confirm` y `snapshot` esperan la red o, en el caso de la foto, el
saludo del otro hasta 5 s (`mirror-port.ts:66-69`). Ver 4.1.

**2.2 · Menor · Cabeceras que quedaron atrás.**

- `screens/Detail/Route.tsx:2`: «la latencia… por el directo… o por el servidor». Por el servidor no
  se muestra: `useRoundTrip(view.status === 'direct')` (`:35`) y `runtime.roundTripMs` solo mira el
  directo.
- `platform/camera/qr-draw.ts:1`: «se baja recién cuando la entrada de la computadora lo muestra»;
  ahora también lo baja el código para vincular.
- `detail.ts:1`: dice solo «si el detalle… está abierto», pero el archivo también tiene `reading` y
  `unpairAsked`.
- `runtime/topic.ts:11`: un comentario suelto («Lo que dice el tema, según qué trae») encima del de
  `pairingShape`, que además no es del tema: lo usa `start.ts` para `/api/start`.
- `confirm.ts`: «sin internet se sigue con la última buena de esta conexión» es cierto, pero no dice
  que una conexión nueva (volver por el directo dormido, reconectar) empieza sin ninguna, y que sin
  internet no deja pasar nada (ver 4.8).

**2.3 · Menor · Carpeta `src/app/modules/device-link/`: 19 archivos sueltos, al borde del tope de 20.**
Comparten conceptos que la constitución pide agrupar aunque no se llegue al tope:

- lo que leen las pantallas: `current.ts`, `detail.ts`, `use-link.ts`, `view.ts`, `frame-link.tsx`,
  `actions.ts`, `texts.ts`;
- vincular con el código: `pair.ts`, `replaced.ts`;
- el protocolo y la confirmación, que son del runtime: `wire.ts`, `confirm.ts`;
- el diagnóstico y la tira: `journal.ts`, `strip.ts`.

`state.ts` solo reexporta `machine/` y agrega `step`: `step` podría ir en `machine/` y `state.ts`
desaparecer.

## 3. Pruebas que miran por dentro

**3.1 · Importante · `runtime/units.test.ts` prueba el `Live` por dentro.** Arma un `Live` de mentira y
mira y cambia sus campos: `live.opening`, `live.offer`, `live.relayInbox`, `live.dormant`,
`live.current`; llama a `onSignal`, `onRelay`, `closeTransport`, `promote`, `attachMirror` y
`sendSnapshot` directamente; y cambia una constante del módulo (`directSettings.openWithinMs = 300`)
con un `try/finally`. Cualquier refactor de `runtime/` (por ejemplo, arreglar 4.4 o 4.5) la rompe
sin que cambie el comportamiento. Lo que cubre (las carreras) es lo que debería cubrir la simulación
de dos dispositivos con fallas (1.6), desde `createRuntime`. Propuesta: pasar esos casos a
`two-devices` con un Wi-Fi y un servidor que se puedan demorar y cortar, y que los plazos lleguen
por `Deps` en vez de cambiar un objeto del módulo.

**3.2 · Menor.** Las tablas de la máquina (`arrive.test.ts`, `stay.test.ts`) comparan la lista exacta
de comandos. Como la máquina es una función pura y sus comandos son su salida, está bien. Pero los
nombres de los casos casi nunca dicen el escenario (1.6).

Las pruebas del servidor usan las rutas y el canal desde afuera: bien.

## 4. El código contra el diseño (carreras, fugas y metas)

**4.1 · Importante · La fila de la máquina espera la red adentro, y `sessionLost` no corre «antes que
todo».** `runtime.ts:20-27`, `runtime/commands.ts:23-33` y `67`, `runtime/mirror-port.ts:66-80`.

- Los documentos: «un evento se procesa entero… Lo que tarda no frena la fila» (§ 2.2, cabecera); al
  salir, «**antes que todo:** `send(bye signout)`, `closeTransport`… `mirror.detach`» (§ 8.3); «otra
  persona en la misma pestaña no recibe nada de la anterior ni le manda nada a su celular» (§ 16).
- El código: `post` (pausa y reconexión), `report`, `check`, `newVersion` y `confirm` esperan su
  pedido, y `snapshot` espera el saludo hasta 5 s, todo adentro de la fila. `api()` no tiene plazo.
  Consecuencias:
  - con mala señal, un `post` o un `check` colgados retienen todo lo que entra por el espejo y los
    eventos de después, incluido `sessionLost`. Si entra otra persona en ese momento, sus pantallas
    se montan con el espejo todavía conectado al celular de la anterior, y lo que toque sale por ese
    puerto (`gate` deja pasar con la confirmación fresca);
  - al no lograr el directo, `report` (`arrive.ts:directFailed`) corre **antes** que `openRelayed`:
    el respaldo espera un pedido que no le importa;
  - durante la espera de la foto, nada más del otro se aplica.
- Propuesta: los comandos que piden a la red se lanzan y avisan con un evento (como ya hace
  `openDirect`); `report` sin esperar y después de `openRelayed`; y `sessionLost` desconecta el espejo
  en el acto, fuera de la fila, antes de encolar el resto.

**4.2 · Importante · La foto puede salir sin confirmación.** `runtime/mirror-port.ts:66-74`,
`confirm.ts:99`, `machine/stay.ts:30-46`.

- Los documentos: «Que nada salga ni entre por el espejo sin una confirmación del servidor» (§ 7).
- El código: `gate` deja pasar todo cuando `fingerprint === undefined`, que significa dos cosas
  distintas: «por el servidor» (bien) y «sin espejo» (después de `detachMirror` → `confirm.end()`).
  `sendSnapshot` espera el saludo y después solo mira que `live.current` sea la misma conexión. Si en
  esos 5 s se tocó «Desconectar» con el directo conservado (`onPause` no cierra `current`), o llegó
  `peerGone`, la foto sale igual, entera y **sin confirmación**.
- Propuesta: que `confirm` distinga «por el servidor» de «sin espejo» (en el segundo, `gate` no corre
  nada) y que `sendSnapshot` mire además que el espejo sigue conectado.

**4.3 · Importante · Un error pasajero del servidor corta el espejo.** `confirm.ts:32-36`; la prueba
que lo da por bueno, `confirm.test.ts:111`.

- `verdictOf` da `gone` para cualquier respuesta que no sea `ok` ni `offline`: un `429` (el tope de
  60 `check` por minuto se comparte con los `check` sin huella), un `500`, un `401` de una sesión que
  el servidor todavía no ve. Con `gone`, la máquina recibe `peerGone('signed-out')`, cierra el
  directo y se vuelven a presentar (unos 7 KB en el celular, § 18.1). El diseño dice `gone` solo
  para «el otro no está en regla».
- Propuesta: `gone` solo cuando el servidor contesta `peer: 'gone'` o sin vínculo; lo demás, como
  `offline` (seguir con la última buena), o reintentar una vez.

**4.4 · Importante · El respaldo puede desordenar lotes y no junta como dice el diseño.**
`platform/peer/relayed.ts:20-34`, `shared/contracts/device-link.ts:37-39`.

- Los documentos (§ 4.3): lo de los mismos 50 ms en un lote; «dos parches de la misma clave se quedan
  con el último»; lo escrito «se junta durante 150 ms… “tornillo” sale en 2 o 3 pedidos, no en 8».
- El código:
  - `flush` no espera al anterior: si un `POST /relay` tarda más de 50 ms (lo normal por internet),
    el siguiente sale en paralelo y puede llegar antes. Los parches lo aguantan (LWW), pero las partes
    de la foto no: `createSnapAssembler` descarta una parte fuera de orden y la foto se pierde
    entera, sin aviso más que en el diario. `hello` y `bye` también pueden llegar cambiados de orden;
  - no junta por clave ni espera 150 ms con lo escrito: cada letra sale en su propio pedido (unos
    750 bytes cada uno entre los dos, § 18.1). Va contra lo que más pidió Carlos;
  - el lote no mira el tope del contrato (100 mensajes) ni el de 64 KB del cuerpo: una foto de varias
    partes de casi 64 KB cada una sale en un solo `POST` que el servidor rechaza, y `!ok` cierra el
    respaldo con `lost`, que lleva a presentarse otra vez y a lo mismo.
- Propuesta: un lote a la vez (el siguiente sale cuando contesta el anterior), juntar por clave, la
  espera de 150 ms para lo escrito y partir el lote por cantidad y por tamaño. Medirlo en la prueba
  de la hora (1.6).

**4.5 · Importante · La bandeja del respaldo entrega lotes viejos a una conexión nueva.**
`runtime/links.ts:100-112` y `136-155`.

- `onRelay` guarda en `relayInbox` todo lo que llega por el tema sin un respaldo abierto, sin mirar
  de qué intento es. `closeTransport(live, true)` (el que corre al pasar del respaldo al directo que se
  probó) sale por `if (keep) return` **antes** de vaciar la bandeja, y el receptor ya se soltó: lo
  que el otro todavía mande por el servidor se acumula. El próximo `openRelayed` (otro intento, quizás
  horas después) lo entrega primero: un `bye` viejo lo cierra en el acto, una foto vieja se aplica.
- Propuesta: guardar en la bandeja solo mientras se espera el respaldo de **ese** intento (`meeting`)
  y vaciarla siempre al cerrar.

**4.6 · Importante · Conexiones directas que quedan abiertas.** `runtime/links.ts:35-49`, `52-65` y
`67-82`.

- `startDirect` hace `shut(live.opening)` y **después** espera `live.deps.rtc()`. Si en ese tiempo
  corre un `closeTransport` (una pausa, salir, el otro se fue), lo cierra todo y recién después se
  guarda el directo nuevo en `live.opening`: queda un `RTCPeerConnection` vivo que nadie va a usar
  hasta el próximo `closeTransport(false)`.
- `openDirect` con `ok` pero el estado ya en otro lado: la máquina ignora `directUp` y el canal de
  datos abierto queda en `opening`, conectado con el otro.
- `answerOffer` sin `ok`: el directo del celular queda en `opening`.
- Propuesta: mirar después de cada `await` que el intento siga siendo el del estado y, si no, cerrar
  lo que se abrió.

**4.7 · Importante · El reintento sin internet no se puede parar y corre con la pestaña oculta.**
`runtime/commands.ts:35-41`, `machine/stay.ts:17-27`, `runtime.ts:90-95`.

- Los documentos: «con la pantalla a la vista, la aplicación vuelve a probar a los 2, 4, 8, 16 y 32
  segundos y después cada minuto» (R3.4); «oculta, nada» (R3.6).
- El código:
  - `retryInternet` encadena `setTimeout` que no se guardan. Pasar de `offline` a `waiting` y otra vez
    a `offline` antes de que venza el anterior deja dos cadenas pidiendo a la vez;
  - `onInternet(false)` lleva a `offline` también desde `away` (la pestaña oculta o sin el candado):
    un evento `offline` del navegador con la pestaña oculta arranca el reintento, que pide `check` cada
    minuto en segundo plano. Al volver la pestaña, `tabBack` no hace nada porque el estado ya no es
    `away`;
  - `runtime.stop()` no lo para.
- Propuesta: el temporizador en `Live`, que lo cierre `closeTransport` o la salida de `offline`;
  `onInternet` que ignore `away`; y que el reintento espere a la vista (`canReach`), como `useReconnect`.

**4.8 · Importante · Volver con la pestaña oculta ignora la pausa.** `machine/stay.ts:90-112`.

- En `paused`, ocultar la pestaña lleva a `away` sin directo (cierra el conservado) y al volver
  `onTabBack` lleva a `waiting` con el vínculo todavía en pausa. Hasta que contesta el `check`, la
  computadora escucha y se puede presentar con el otro (R5.1: «salir y volver a entrar no lo
  reconecta»), y la tira anota «esperando» en vez de «desconectado».
- Propuesta: `onTabBack` va a `paused` si `pairing.paused`.

**4.9 · Importante · La tira del día.** `strip.ts:20`, `23`, `28-31`; `machine/stay.ts:90-105`;
`machine/arrive.ts:45-53`.

- Los documentos: la clave es `device-link.strip.<hash corto de la persona>`, «así otra persona en
  la misma computadora no ve ni suma los tramos de la anterior»; «el diario y la tira no guardan
  identificadores de personas» (§ 13, § 16); el día es «el del negocio según la hora del servidor».
- El código:
  - guarda el `userId` en texto en `localStorage` y usa una sola clave para todas las personas: cuando
    entra otra, la tira de la anterior se pierde (no se ve, pero se borra);
  - `onTabAway` y `onSessionLost` no marcan la tira: con la pantalla del celular apagada, o después de
    salir, el último tramo («Directo») sigue contando hasta el próximo cambio. La tira, que sirve
    para «ver si la red falla seguido», dice que estuvieron juntos cuando no;
  - el día sale de `toLocaleDateString('sv')` con la zona del dispositivo, no del día del negocio
    (`shared/time/business.ts`).
- Propuesta: la clave con el hash, una marca `apart` al ocultarse y al salir, y el día del negocio.

**4.10 · Importante · `l=` aparece y desaparece cada vez que se olvida la memoria.**
`src/server/modules/device-link/guard.ts:43-47`, `members.ts:57`, `routes/state.ts:39`.

- Es la causa de 1.1, y además gasta datos: después de una pausa o una reconexión (`members.forget`),
  de un vínculo nuevo o de un reinicio del servidor, la próxima respuesta de cada dispositivo viene sin
  `l=` (la memoria no está cargada), eso es un cambio y la aplicación hace `check`; el `check` carga la
  memoria, `l=` vuelve y es otro cambio: otro `check`. En el celular que espera, cada cambio además
  abre el canal 30 s para fijarse. «Sin `l=`» quiere decir a la vez «sin vínculo» y «no sé».
- Propuesta: la de 1.1 (que `l=` no dependa de la memoria cargada).

**4.11 · Importante · Volver a leer el código de la misma computadora corta el espejo.**
`src/server/modules/device-link/lifecycle.ts:73`.

- `afterPairing` llama a `afterEnding(ctx, [pairing, …replaced])` también cuando el vínculo es el
  mismo y solo se renovó: `members.ended` borra las sesiones y las huellas DTLS del vínculo vivo, y
  `drop` suelta a quien lo escuchaba. La próxima confirmación del directo da `gone` y se vuelven a
  presentar. Que se renueve sin reemplazar sí lo prueba `pairing.test.ts:136`; que no corte lo que
  está andando, no.
- Propuesta: con `renewed`, solo `members.forget([pairing])`.

**4.12 · Bloqueante · Consultas dentro de un bucle y consultas de más, sin la prueba que las cuenta.**
`src/server/modules/device-link/data.ts:89-97`, `routes/codes.ts:61` y `83`, `lifecycle.ts:47`,
`index.ts:37-44`.

- Los documentos: «nada de consultas dentro de un bucle (todo en lote), una cantidad fija de
  consultas por pedido» (constitución, XII.2); § 18.4: `codes/read` sin nada que reemplazar, 2;
  `codes/accept`, 2; vencidos y `mirrored_at`, 1 cada uno, en lote; «las pruebas cuentan las
  consultas de cada uno».
- El código:
  - `touch` hace un `UPDATE` por vínculo, en un `for … await`;
  - `codes/read` lee los vínculos de los dos dispositivos y, en `link → pair`, los vuelve a leer en la
    transacción: 3 consultas sin reemplazo. `codes/accept` llega a 4;
  - el vencimiento diario lee (`olderThan`) y después borra (`remove`): 2, y fuera de una transacción;
  - ninguna prueba del módulo usa `countQueries`, que `testing/sign-in/sign-in-server.ts:53` ya
    tiene.
- Propuesta: `touch` con un solo `UPDATE … FROM (VALUES …)`; que `pair` reciba lo ya leído o que
  `read` no lea afuera; el vencimiento con `DELETE … WHERE mirrored_at <= $1 RETURNING`; y una prueba
  que cuente las consultas de cada ruta de § 18.4.

**4.13 · Importante · Lo del diseño que falta: el diario no llega a nadie.**

- § 15.2: «Con “Algo salió mal”, el aviso suma el diario de ese dispositivo»; tarea 8: «`frame` suma
  el diario a “Algo salió mal”». Nadie fuera de `device-link` y de las ayudas de prueba lee
  `device-link.journal`.
- § 15.1 y tarea 11: `tools/device-link/replay.ts`, que pasa un diario por `step`. No existe.
- Para un módulo cuyos errores «no se pueden reproducir», el diario es la única pista, y hoy queda en
  el `localStorage` del dispositivo.

**4.14 · Importante · Lo del diseño que falta, de seguridad.**

- § 3.5 y § 7.2: si cambió `l=`, «`device-link` retiene el espejo (`mirror.hold`) y pide `check`: la
  respuesta que trajo el cambio no se reenvía hasta saber cómo está el vínculo». El que escucha `l`
  (`watch.ts:82`) no devuelve ninguna promesa, así que `readFields` no espera nada, y no hay `hold`.
  Hoy no reenvía respuestas del servidor (T123), así que la consecuencia es chica; con T123 pasa a
  ser necesario.
- § 5.3: «Mientras el espejo aplica algo del otro, `api.ts` no deja salir un POST (falla en
  desarrollo)». No está.
- Si se decidió no hacerlos, el diseño tiene que decirlo (sección 8).

**4.15 · Menor · Diferencias chicas con el diseño.**

- `hub.ts:79` manda `dropped`; § 3.3 dice `closed`.
- § 3.2: «uno que no valida se descarta sin cortar la lectura». En `sse.ts:154` un `data` que no es
  JSON tira dentro del bucle y corta el canal, que se vuelve a abrir.
- § 10.2: `relay` tiene tope de 600 mensajes por minuto, pero no el de 1 MB por minuto; y el bucle
  (`meet.ts:55`) gasta parte del tope antes de rechazar el lote.
- § 10.3: «Se vuelve a mirar que la sesión dueña del código siga abierta». `codes/read` no lo mira
  (solo `accept`); un código queda leíble hasta el próximo latido (40 s) después de que vence la
  sesión de la computadora.
- § 10.3: `rotating-codes` no tiene `hold` ni `release`.
- § 11.2: `device-link.replaced` con `how: 'sign-in'` lleva «la dirección de las dos
  computadoras»; el código lleva solo `{how}` (`lifecycle.ts:83`). `device-link.rejected` «para un
  pedido de quien no es del vínculo» no se anota (solo otra cuenta y `pairing-ended`).
- § 15.2: `report` lleva `ua` de las dos sesiones; el código, solo el del que avisa. `ice.pairs` va
  siempre en 0 (`links.ts:iceOf`).
- § 5.4: la dirección se valida con una expresión, no «contra las direcciones del menú»
  (`platform/mirror/route.ts:10`).
- § 4.3: la latencia por el servidor se calcula (`relayed.ts`) pero no se muestra.

**4.16 · Menor · Bordes y fugas chicas.**

- `rotating-codes.ts:17`: al parar, el `wait(ttlMs)` que perdió la carrera sigue vivo hasta que vence.
- `rtc.ts:60-63`: `gathered` deja el plazo de 1 s y los oyentes de `icecandidate` puestos.
- `sse.ts:88`: el perro guardián no se limpia al terminar la lectura.
- `topics.ts:39`: `authorize` del tema del código guarda la computadora en `ctx.computers` aunque
  después no se abra el canal (un `429`), y eso no se borra nunca.
- `routes/state.ts:38`: `as Pairing`: si se desvinculó entre `mine` y `setPaused`, `forget([undefined])`
  tira.
- `routes/codes.ts:59`: se ignora lo que devuelve `take`; anda porque `peek` y `take` corren sin un
  `await` en el medio, pero es frágil.
- `guard.ts:32`: con la memoria de sesiones vacía (después de un reinicio), una escritura con
  `X-Pairing` pasa aunque la sesión del otro se haya cerrado, hasta que el otro se vuelva a registrar.
- Los tamaños se miden en caracteres, no en bytes: `transport.ts:35`, `wire.ts:74`,
  `realtime/channel.ts:37`. Con texto con tildes, una parte de la foto puede pasar los 64 KB del canal
  de datos.
- `runtime/messages.ts:49`: cualquier mensaje por el directo dormido, también un `bye`, dispara
  `peerBack` antes de manejarse.
- `runtime/messages.ts:21`: el saludo del otro se guarda en `live`, no en la conexión: con el respaldo
  y un directo a prueba a la vez, la foto puede tomar el saludo de la otra.
- `platform/realtime/channel.ts:96`: si sumar un tema falla por otra cosa que `not-found`, queda
  contado como escuchado y no se vuelve a pedir.
- `use-mirrored.ts:31`: el efecto se registra con `[]`: si cambia la clave sin desmontar, sigue con la
  vieja. Hoy no pasa (`Roles.tsx` usa `key={opened}`), pero es una trampa para quien sume un valor con
  parámetro.
- `screens/Code/Code.tsx:53`: el evento del tema del código no se valida, y su `paired` entra a la
  máquina como `serverSaid`.

## 5. Seguridad (§ 16 del diseño)

Punto por punto:

- **Quién puede:** vincular solo la misma persona (`codes.ts:52`), sin permiso; presentar, reenviar,
  pausar, reconectar, desvincular y escuchar, solo los dos lados de ese vínculo, con persona y
  dispositivo de la sesión (`toOther`, `mine` y `authorize` del tema): **hecho**. Escuchar el código,
  solo la computadora con sesión: **hecho**.
- **El directo:** la confirmación de menos de 4 minutos atada a la huella DTLS está hecha
  (`confirm.ts`, `routes/state.ts:49-64`), con dos agujeros: la foto sin confirmación (4.2) y
  `sessionLost` que no corre primero (4.1). La de menos de 30 s antes de la foto: hecha. `409
  pairing-ended`: hecho, con el borde de 4.16 después de un reinicio. Lo que pidió el celular no
  viaja (`registry.ts:93-94`): hecho. Otra persona en la misma pestaña: el espejo vuelve al inicial
  (`detachMirror(reset)`); ver 4.1.
- **Lo que entra:** el código (128 bits, un uso, 60 s, después del `#`, otra cuenta no lo gasta):
  hecho, con lo de 4.15 sobre la sesión dueña. El boleto atado a las dos sesiones y a los vínculos:
  hecho. La descripción de WebRTC (8 KB, un `m=application`, candidatos locales, la huella): hecho
  (`sdp.ts`). Cada mensaje con `wire.ts`, cada valor con su esquema, la bandeja con tope: hecho; la
  dirección, con una expresión y no contra el menú (4.15). `report` cerrado: hecho. El dueño del canal
  fijo al abrir: hecho (`routes.ts:38-41`).
- **El diario y la tira sin identificadores:** el diario, hecho; la tira guarda el `userId` (4.9).
- **Abuso:** topes del canal por sesión y por red, anónimos aparte, el oyente lento: hechos
  (`admission.ts`, `channel.ts`). El tope de 1 MB por minuto del respaldo: no (4.15).
- **Secretos y servicios externos:** ninguno; `iceServers: []` (`rtc.ts:42`): hecho.
- **Auditoría:** vincular, reemplazar, desvincular y terminar con su motivo: hechos; lo que falta, en
  4.15. No se anotan pausa, reconexión ni cambios de transporte: hecho (`state.test.ts:72`).
- Lo que se retiene al cambiar `l=` y el bloqueo de POST: no están (4.14).

## 6. Reglas inventadas

- **6.1 · Importante · El aviso de R1.5 sale también cuando no se reemplazó nada.** `replaced.ts:17`:
  `before = now ?? before` recuerda el último vínculo aunque después haya habido «Sin vincular» o haya
  entrado otra persona. Desvincular y después entrar a una computadora con el celular (un vínculo
  nuevo, no un reemplazo) muestra «Ahora este celular está vinculado a…» con «Desvincular». R1.5 lo
  pide solo «si reemplazó uno». Lo sabe el servidor: que lo diga (`replaced` en la vista del
  vínculo, o en el `check`), en vez de adivinarlo en el celular.
- **6.2 · Menor · Volver a vincular los mismos dos «lo renueva».** `rules.ts:30-34`: está en un
  comentario y en una prueba, pero no en el capítulo ni en el diseño. Es razonable (cuenta como uso,
  R2.2), pero tiene que estar escrito; ver además 4.11.
- **6.3 · Menor · «No se pudo vincular. Probá de nuevo en un momento»** (`texts.ts:122-125`) para un
  error que no es otra cuenta, código vencido ni falta de red: ninguna regla ni la maqueta lo tienen.
  Está bien tenerlo; falta en la maqueta o en `changes.md`.
- **6.4 · Menor · La computadora también conserva el directo dormido** al ocultarse (`stay.ts:93`);
  § 8.3 dice «el celular conserva el directo dormido 5 minutos». La prueba lo hace en los dos. Decidir
  cuál vale y escribirlo.

## 7. Simpleza y repetición

- **7.1 · Menor · Código muerto:** el evento `relayUp` (`machine/types.ts:33`, `state.ts:47`) no lo
  manda nadie. `useMirroredQuery` no lo usa ninguna pantalla todavía (T123, a propósito).
- **7.2 · Menor · Lo mismo dos veces:**
  - los motivos del adiós: `byes` en `runtime/commands.ts:14` y `byeReasons` en `wire.ts`;
  - la clave `<vínculo>:<lado>`: `slot` en `members.ts:10`, `keyOf` en `lifecycle.ts:13`, y
    `sideFromKey` e `idFromKey` en `topics.ts`, que la vuelven a partir;
  - armar un `Device` desde una sesión: `deviceOfSession` en `routes/codes.ts`, el `authorize` del tema
    del código y `listeners.ts`;
  - `day` en `index.ts` y `rules.ts` del servidor, y `dayMs` en `Facts.tsx`;
  - leer el vínculo de `/api/start`: `pairingAt` en `start.ts` (valida) y `fromStart` en
    `use-link.ts` (no valida).
- **7.3 · Menor · Nombres que no dicen lo que hacen:**
  - `computerOf` (`routes/codes.ts:27`) devuelve la sesión si está abierta: es un `isOpen`;
  - `samePerson: next === undefined` (`watch.ts:74`) quiere decir «no entró nadie todavía»;
  - `closeTransport(live, keep)` hace dos cosas distintas según qué había: dormir el directo, o
    cerrar el respaldo y conservar el directo que se probó. Dos comandos se leerían mejor;
  - `pairingShape` vive en `runtime/topic.ts` pero es la forma del vínculo para todo el módulo.
- **7.4 · Menor · Sobra:** `as unknown as Live` en `createLive` (`runtime.ts:48`) para completar
  `confirm` después; la computadora contesta cada `probe` con otro `probe` que el celular ignora.

## 8. Documentación que quedó atrás

Lo que otro agente no podría reconstruir leyendo `docs/`:

- **8.1 · Importante · El mapa de piezas (§ 2.1, § 2.2 y § 13) nombra archivos que no existen:**
  `mirrored-store.ts`, `replica.ts` y `piggyback.ts` (son `registry.ts`, `use-mirrored.ts`, `route.ts`
  y `platform/server/fields.ts`); `rules/` con `pair`, `replace`, `ends`, `expire` y `confirm` (son
  `rules.ts`, `lifecycle.ts` y la tabla `endings` de `listeners.ts`; § 11.1 y § 14.1 nombran
  `rules/ends.ts`); `screens/PairingIndicator/`, `Replace/` y `Notices/` (son `Indicator/`, `Read/` y
  `Confirm/`, y los avisos van en `Read.tsx` y tostadas). § 14.1 dice que los manejadores de mensajes
  están en `runtime.ts`; están en `runtime/messages.ts`. La nota de «cómo quedó» de § 2.2 actualiza
  solo `runtime/`.
- **8.2 · Importante · Lo que el diseño pide y no se hizo, sin decirlo:** `approve` con `pairs` y el
  celular que escucha (§ 10.4); `mirror.hold` y el bloqueo de POST (4.14); `{t:'stale'}` (§ 5.3, va
  con T123); la clave de la tira con hash (§ 13); `replay.ts` y el diario en «Algo salió mal» (§ 15);
  `hold`/`release` de los códigos; el tope de 1 MB del respaldo; la simulación con semillas (§ 20).
- **8.3 · Importante · § 8.1 y § 8.3 se contradicen sobre si la computadora escucha en pausa** (1.3).
- **8.4 · Menor · Lo que el código hace y no está escrito:** que volver a vincular los mismos dos
  renueva (6.2); que la computadora también conserva el directo dormido (6.4); que la computadora
  contesta un `probe` con otro; que sin `l=` el celular hace `check` y, si espera, se vuelve a fijar
  30 s; que la bandeja del respaldo junta hasta 20 lotes sin mirar el intento; que `report` anota
  `side` y `device`.

## 9. Pantallas

No las vi funcionando ni con capturas: lo que sigue sale de leer el código contra `changes.md` y las
capturas de la maqueta.

- **9.1 · Importante · Una computadora con la ventana angosta no puede mostrar el código.**
  `screens/Detail/Detail.tsx:86`: debajo de 900 px el detalle es la hoja del celular y no recibe
  `code`; «Vincular el celular» llama a `code.show()` y no aparece nada (R1.3).
- **9.2 · Importante · Los textos de cada lado se eligen por el ancho, no por el lado.**
  `screens/Detail/texts.ts:10`, `18`, `34`, `144`: la versión larga de «Esperando», de «Sin
  vincular», del título y de «Reconectados» habla desde la computadora («El celular no tiene
  Ferrebress abierto», «El vínculo con tu celular», «el celular vino a esta pantalla») y la corta
  desde el celular. `Say` elige por el ancho: un celular acostado de más de 900 px muestra los de la
  computadora, y una computadora angosta, los del celular. La regla de 00 es que largo y corto
  **dicen lo mismo**; acá dicen cosas distintas. Propuesta: elegir el texto por `side` y, dentro de
  cada lado, el largo o el corto.
- **9.3 · Importante · En una segunda pestaña el indicador desaparece.** `view.ts:46`: una pestaña que
  abrió sin el candado queda en `asleep` y `hidden`, así que no muestra el indicador hasta que la
  persona la toca (R4.1, «siempre a la vista»). Mientras el vínculo se baja sí lo muestra (con lo de
  `/api/start`), así que aparece y se va. Una pestaña que perdió el candado, en cambio, dice
  «Esperando al celular». Las dos tendrían que mostrar lo mismo.
- **9.4 · Menor · «Vinculado con»:** la maqueta dice «desde ayer, lunes 2 de noviembre, 8:14»;
  `Facts.tsx` muestra «desde lunes 2 de noviembre», sin «ayer» ni la hora.
- **9.5 · No lo pude comprobar:** que la espera de «Probar conexión directa» aparezca a los 300 ms
  (`Actions.tsx` cambia el texto enseguida; puede que `Button` lo demore), los tamaños de la ficha en
  1366 × 657 y la tostada de 6 s con «Desvincular» en el celular (la prueba `replaced.test.tsx` mira
  el tiempo, no cómo se ve).

## 10. Lo que se podría extraer a una librería

Solo informativo. El módulo agregó mucho de lo no funcional (conexión, sin conexión, rendimiento,
calidad), así que se mira por partes.

| Parte | Dónde | ¿Serviría a otro proyecto? | Qué la ata a Ferrebress | Grupo | Cambio chico que la dejaría lista |
|---|---|---|---|---|---|
| Canal en tiempo real del servidor (temas, central, topes, latido, SSE) | `src/server/platform/realtime/` | Sí: cualquier aplicación con «lo que llega sin pedirlo» y pocos usuarios | `SessionGate` y `Http` de la plataforma, `ErrorCode` de los contratos, el formato `modulo.nombre` de los temas | Base del servidor | Que `routes.ts` reciba cómo identificar al dueño (función) en vez de `SessionGate`, y los códigos de error como parámetro |
| Códigos que rotan para un QR | `src/server/platform/realtime/rotating-codes.ts` | Sí (entrar con el celular, vincular, cualquier QR de un uso) | Nada del negocio | Identidad o base del servidor | Usar el `Clock` común y parar el `wait` que queda vivo (4.16) |
| Campos de la cabecera, partes de `/api/start` y pasos de los pedidos | `header-fields.ts`, `start-parts.ts`, `request-checks.ts` | Sí: registros chicos y genéricos | El nombre `X-Ferrebress` y las letras reservadas, en `shared/contracts/server-header` | Base del servidor (y su par de la aplicación) | El nombre de la cabecera como parámetro |
| Canal de la pestaña, demanda y lector de SSE | `src/app/platform/realtime/`, `server/fields.ts`, `api.decorate` | Sí | Las rutas `/api/realtime…`, `api()` y `appHeaders()` de Ferrebress | Base de la aplicación | Pasarle la ruta base y las cabeceras al crear el canal |
| Espejo LWW con esquema, foto y bandeja | `src/app/platform/mirror/registry.ts`, `use-mirrored.ts` | Sí: dos pantallas que muestran lo mismo | `use-mirrored` está atado a Preact; `route.ts` al `router.ts` propio; `query.ts` a `ApiResult` | Nuevo: «espejo entre dispositivos» | Arreglar `auto` en la foto (1.4) y que `query.ts` reciba el tipo de resultado |
| Transporte directo y por el servidor, y el filtro de candidatos | `src/app/platform/peer/`, `src/shared/peer/candidates.ts` | Sí: WebRTC sin servicios externos en una red local | Comentarios; los plazos son objetos del módulo que las pruebas cambian | Nuevo: «conexión entre dispositivos» (con el espejo) | Pasar los plazos al crear (`createDirect({…, settings})`) y arreglar el orden del respaldo (4.4) |
| La pestaña que manda (Web Locks) | `src/app/modules/device-link/tabs.ts` | Sí: cualquier «solo una pestaña hace X» | Está en el módulo y el candado se llama `ferrebress.mirror` | Base de la aplicación | Moverla a `platform/` con el nombre del candado como parámetro |
| Confirmación con frescura (retener hasta una respuesta reciente) | `src/app/modules/device-link/confirm.ts` | Quizás: el patrón sí, el uso es muy de este módulo | `CheckResponse` y `PairingView` del contrato del vínculo | Nuevo (con el espejo) | Recibir una función `ask(): Promise<'ok'│'gone'│'offline'>` en vez del contrato |
| Diario en el dispositivo (anillo de 300, se escribe al ocultarse) | `src/app/modules/device-link/journal.ts` | Sí: diagnóstico de cualquier proceso | `describe()` conoce los eventos del vínculo; la clave `device-link.journal` | Calidad o base de la aplicación | Separar el anillo genérico (`platform/`) de `describe()` |
| Máquina de estados con comandos y su corredor en una fila | `machine/`, `runtime/commands.ts`, `runtime.ts` | El patrón sí (paso puro, comandos, corredor exhaustivo); el contenido no | Todo el contenido es del vínculo | Marco | Nada por ahora: el patrón entra en una página del manual de código antes que en una librería |
| Cámara que lee QR y dibujo del QR | `src/app/platform/camera/`, `src/app/ui/camera/` | Sí | Los textos llegan de afuera; el estilo es de «Mostrador» | Piezas visuales | Corregir la cabecera de `qr-draw.ts` |
| Tostada con un botón | `src/app/ui/toast/` | Sí, dentro de «Mostrador» | La cabecera nombra el vínculo | Piezas visuales | Sacar el ejemplo del vínculo de la cabecera |
| Esquemas baratos de zod/mini (`oneOf`, `flag`, `tagged`) | `src/app/platform/schema.ts` | Sí, para quien cuide el tamaño del arranque | Nada | Base de la aplicación | Nada |
| Control de `// local:` | `tools/checks/local-state.ts` | Sí, en cualquier proyecto con espejo | La carpeta `src/app/modules` y la excepción de `sign-in`, fijas | Calidad | Pasar carpeta y excepciones por la configuración de `pnpm check` |
| Wi-Fi y servidor de mentira para dos dispositivos | `src/app/testing/wifi.ts`, `device-link-server.ts`, `two-devices.ts` | `wifi.ts` sí (un `RtcConnection` de mentira); el resto es del vínculo | `two-devices.ts` arma el runtime del vínculo | Calidad | Separar `wifi.ts` como ayuda común del transporte |

**Hoy no conviene extraer nada:** hay un solo consumidor de casi todo, y las piezas más candidatas (el
espejo, el respaldo y el canal de la aplicación) tienen hallazgos abiertos en esta revisión. Lo más
maduro es el canal del servidor y el transporte; conviene esperar a que los use un segundo tema (T118)
y a que llegue `forward` (T123), y recién ahí decidir.
