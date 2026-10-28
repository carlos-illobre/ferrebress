# Revisión del diseño técnico · 15 · Sin conexión (`offline`), etapa a

Revisión independiente del [diseño](offline.md) (constitución, paso 4), hecha con los documentos:
la constitución, el [capítulo 15](../../chapters/15-offline/rules.md) (R1 a R3, E01 a E21), el
[capítulo 01](../../chapters/01-sign-in/rules.md) en lo que toca (R2.8, R3.4 a R3.6, R4, R5.2), el
[diseño de 01](sign-in.md) (§ 4 a § 8 y § 12), la [arquitectura](../architecture.md), el ADR-007,
[mobile-data.md](../mobile-data.md) y las maquetas aprobadas (`sign-in-phone-dark/final/`, estados
«Sin conexión, con la huella» y «No se pudo confirmar»; `app-frame/final/`, Más del celular). Miré
además el código de hoy en lo que el diseño dice reusar: `src/app/App.tsx` (`boot`, `recheck`),
`src/app/platform/server/reconnect.ts`, `src/app/modules/sign-in/session.ts`,
`src/app/platform/server/api.ts` y `clock.ts`, y en el servidor `/api/start`, la salida pendiente,
la migración y las consultas de las huellas.

Cada punto dice dónde está, qué propone el diseño, qué veo y qué tan grave es:

- **Frena:** hay que resolverlo antes de que Carlos lo apruebe.
- **Mejora:** conviene hacerlo, pero no frena.

## Resumen

La idea de fondo es buena y está bien explicada: la firma de la huella atada a un desafío que arma
el celular con los datos de la entrada, verificada de verdad recién en el servidor, con el `id` como
clave contra la repetición y las horas del celular tomadas como no confirmadas. Lo que frena está
casi todo en **la entrada pendiente de confirmar y su vida en el celular**: se manda solo con el
evento `online` (no al abrir la aplicación, y sin reintento con el marco a la vista); hay una sola,
que se pisa si se entra dos veces; «Salir» la borra aunque el propio diseño dice que queda en la
auditoría; una confirmación cuya respuesta se pierde se rechaza después como repetida; y la de una
persona puede pisar la cookie de otra que entró después. También frenan: la opción de Más se le
muestra a otra persona en ese celular; `offline.allowed: false` apaga la opción por una sesión
cerrada a distancia (contra R1.5) y quitar la huella no la apaga; prender la opción no exige
conexión ni guarda el último contacto real; reabrir la aplicación pasadas las 24 horas muestra el
marco; el código de la etapa vive en `sign-in/` contra la regla del nombre único de la
constitución; y los pedidos nuevos no están en `mobile-data.md`. Lo de `/api/start` funciona, pero
cuesta más de lo que dice (una consulta en cada apertura de cualquier dispositivo) y se puede
achicar mucho; y la verificación local con WebCrypto es la pieza más cara del diseño y no agrega
seguridad.

| # | Punto | Gravedad |
|---|---|---|
| 1.1 | La confirmación se manda solo con el evento `online`: ni al abrir ni con reintento en el marco | Frena |
| 1.2 | Salir sin conexión de una sesión sin conexión: el diseño se contradice y la entrada se pierde (E21) | Frena |
| 1.3 | Varias entradas sin conexión seguidas: una sola pendiente, y el paso 8 rechaza la anterior | Frena |
| 1.4 | La confirmación que falla por red o cuya respuesta no llega | Frena |
| 1.5 | Otra persona en ese celular: ve la opción ajena, y la confirmación ajena le pisa la cookie | Frena |
| 1.6 | Cuándo se apaga la opción: de más con la sesión cerrada a distancia, de menos al quitar la huella | Frena |
| 1.7 | Prender la opción: sin exigir conexión y con un último contacto que no es el real (R1.3) | Frena |
| 1.8 | El corte de las 24 horas: al reabrir la aplicación, con el celular dormido, y lo pendiente después del corte | Frena |
| 1.9 | La versión nueva: 426, lo guardado entre versiones y el código que tiene que estar sin red | Mejora importante |
| 1.10 | E16: el mensaje de no autorizada lleva el correo, que el celular no tiene | Mejora |
| 1.11 | Pasar al marco tiene que ser el mismo «entró» de siempre (R3.4) | Mejora |
| 1.12 | «Hasta el martes 9:40»: zona horaria y formato (00 · R8.4) | Mejora |
| 1.13 | Falta el mapa de escenario a prueba | Mejora |
| 2.1 | `/api/start`: una consulta más en cada apertura de cualquier dispositivo, y la llave en cada respuesta | Mejora importante |
| 2.2 | Falta el índice de las sesiones por celular | Mejora importante |
| 2.3 | Las consultas de la confirmación no cierran | Mejora |
| 2.4 | `mobile-data.md` se anota antes, no en la tarea 5 | Frena (es solo documento) |
| 3.1 | La verificación local con WebCrypto no agrega seguridad y es lo más caro del diseño | Mejora importante |
| 3.2 | La tabla repite la auditoría; el índice por persona sobra | Mejora |
| 3.3 | `passkeys.last_used_at` con dos significados | Mejora |
| 3.4 | `registerSetting`: un registro para un renglón | Mejora |
| 4.1 | El desafío se calcula en los dos lados: una vez en `src/shared/` | Mejora |
| 5.1 | Atrasar el reloj sin pasar el último contacto sí da más tiempo (R2.3) | Mejora importante |
| 5.2 | Una prueba firmada sirve hasta 24 horas para abrir una sesión desde otro aparato | Mejora (para el revisor de seguridad) |
| 5.3 | La auditoría: la repetición no deja traza; el rechazo anota a quien «dice ser» | Mejora |
| 5.4 | El último contacto se alarga con pedidos que no prueban nada de esa cuenta | Mejora |
| 6.1 | Dónde vive el código: el nombre del módulo y la constitución | Frena (es solo documento) |
| 6.2 | «La huella con su persona» en una consulta cruza al esquema de `users` | Mejora importante |
| 6.3 | Quién anota el último contacto en cada respuesta | Mejora |
| 6.4 | La arquitectura y el ADR-007 dicen IndexedDB; el diseño, `localStorage` | Mejora |
| 7.1 | Las horas del celular en el servidor: falsos rechazos con el reloj adelantado | Mejora importante |
| 7.2 | La etapa b sin rehacer: lo que hay que dejar previsto | Mejora importante |
| 7.3 | El último contacto en memoria y las varias copias del servidor | Mejora |
| 8.1 | `/api/start`: tres formas, de más a menos costo | Mejora |
| 8.2 | Una sola salida de lo pendiente, en orden, en `boot` y en `recheck` | Mejora |
| 8.3 | La página de prueba de la huella sin internet (§ 2) | Mejora |

---

## 1. Escenarios sin cubrir

Recorrí R1 a R3 y E01 a E21. Están cubiertos, con ruta, dato o pantalla: E02 y E04 (salvo 1.5),
E06 y E07 (salvo 1.11 y 1.12), E09 (con el límite de 5.1), E10 en la entrada (salvo 1.6), E12,
E13, E15 a E17 en el servidor (salvo 1.4 y 1.10), E18, E19 y E20. Los que no, o a medias:

**1.1 · La confirmación se manda solo con el evento `online` (§ 5, «Al volver la conexión»; R3.1,
E15 a E17, E21) — Frena.**
El diseño la pone en `recheck`, «el que ya corre al volver la red», y dice que si la red todavía no
anda «queda para el próximo intento (`useReconnect`, que ya existe)». En el código de hoy:

- `recheck` corre solo con el evento `online` del navegador (`App.tsx`). El propio
  `reconnect.ts` explica que en Android ese evento llega un instante antes de que la red ande, el
  primer pedido falla y el navegador no vuelve a avisar. Justo ese caso deja la entrada sin
  mandar.
- `useReconnect` corre solo con la entrada a la vista (`useReconnect(entrance, renew)`) y lo que
  prueba es `renew`, el `nonce` de Google, no `recheck`. Con una sesión sin conexión la entrada no
  está a la vista, así que no hay ningún reintento: la persona queda en una sesión sin confirmar
  hasta otro evento `online` o hasta las 24 horas (y, como el pedido falló, la luz dice «Sin
  conexión» aunque haya red).
- **Al abrir la aplicación** con red y una entrada pendiente, `boot` manda la salida pendiente y
  pide `/api/start`, que no tiene sesión: `confirmed(undefined)` borra a la persona guardada y se ve
  la entrada. El diseño no dice que `boot` mande la confirmación antes de `/api/start`, así que la
  sesión sin conexión se pierde y la persona tiene que volver a entrar (contra R3.1 y E15).

Hace falta decir: (a) que la confirmación sale **en `boot` y en `recheck`**, después de la salida
pendiente y antes de `/api/start`; (b) cómo se reintenta con el marco a la vista y una entrada
pendiente (lo natural: `useReconnect` activo también mientras haya algo pendiente, probando con el
mismo envío, que es un pedido automático nuevo y va a `mobile-data.md`, ver 2.4). Ver 8.2.

**1.2 · Salir sin conexión de una sesión sin conexión (§ 5, último punto, y § 10; E21, R3.3) — Frena.**
El § 5 dice que al salir «solo se borra la entrada pendiente; queda en la auditoría como una
entrada sin conexión que nunca se confirmó». El § 10 dice que una entrada que nunca llega al
servidor no deja nada. Las dos cosas no pueden ser: si se borra, nunca llega, y E21 («cualquier
entrada sin conexión, confirmada o no, queda en la auditoría») no se cumple. Además, con el
`signOut()` de hoy, una sesión sin conexión no tiene `sessionId`, así que no queda salida
pendiente, y `forgetProofKey()` borra la llave de prueba de esa entrada.

La entrada pendiente no necesita la llave de prueba para confirmarse (alcanza con la firma de la
huella, que está guardada). Propuesta: «Salir» de una sesión sin conexión **no borra la entrada**:
la marca como terminada, con la hora del celular en que se tocó. Al volver la red se manda igual; el
servidor la revisa, la anota en la auditoría y, si pasa, la anota como entrada y salida sin abrir
sesión (o abre y cierra en la misma transacción). Así queda la traza, y en la etapa b lo hecho en
esa sesión tiene a quién atarse (7.2).

**1.3 · Varias entradas sin conexión seguidas (§ 5 y § 7; E11, E21; § 4, paso 8) — Frena.**
E11 permite entrar, salir y volver a entrar sin conexión antes de las 24 horas. El diseño guarda
«la entrada pendiente de confirmar», una sola: la segunda pisa a la primera, que no llega nunca a la
auditoría (E21). Si se guarda una lista, aparecen dos problemas más del paso 8:

- Confirmada la segunda, su sesión nueva pasa a ser «el último uso de las sesiones» de ese
  celular. La primera tiene `signedAt` **anterior** a ese último contacto, y la regla del paso 8
  («`signedAt` tiene que caer dentro de las 24 horas siguientes al último contacto real») la
  rechaza como `too-late`. Lo mismo si cualquier pedido del celular (un `/api/start` que salió
  primero en otra pestaña, o en `boot` si 1.1 queda mal) llega antes que la confirmación.
- Con una huella que use el contador (no las de Google, que mandan 0), confirmarlas fuera de orden
  las rechaza como clonadas.

Propuesta: guardar una lista y mandarla en orden de `id` (UUID v7 ordena por tiempo); en el paso 8,
**solo la cota de arriba**: `signedAt` ≤ último contacto conocido + 24 h + margen. Una entrada
anterior a un contacto real no da tiempo de más, así que no hace falta la cota de abajo. Y decir qué
pasa con las que no son la última: se confirman para la auditoría pero no dejan sesión abierta
(solo la última la abre, y solo si no terminó con «Salir», 1.2).

**1.4 · La confirmación que falla por red o cuya respuesta no llega (§ 4, paso 3; § 5) — Frena.**
El diseño dice «Confirmada: se borra lo pendiente» y «No confirmada: se borra lo pendiente», pero no
qué respuestas son una cosa u otra. Hay que decirlo: solo se borra con una respuesta del servidor
que confirma o rechaza (`offline-not-confirmed`, `not-authorized`); con `offline` (sin red o el 502
de un despliegue), `too-many-attempts`, un error 5xx o `update-required` queda para el próximo
intento.

El caso que falta: **el servidor confirmó, pero la respuesta no llegó** (la red se cortó después
del `commit`). El celular la vuelve a mandar con el mismo `id`, el paso 3 la rechaza «sin escribir
nada», y la persona ve «No se pudo confirmar tu entrada sin conexión» por una entrada que sí se
confirmó, con una sesión abierta en el servidor que nadie va a usar. La constitución (IV) pide que
repetir no duplique, no que falle. Propuesta: si el `id` ya existe como `confirmed`, del mismo
celular, y el pedido viene firmado con la llave de prueba cuya pública llegó la primera vez (la
privada no sale del celular, así que una copia del pedido no alcanza), el servidor responde
confirmado otra vez y pone una cookie nueva para esa sesión (rotando el pase). Si existe como
`rejected`, responde el mismo rechazo. Si no viene firmado, rechaza como hoy.

**1.5 · Otra persona en ese celular (§ 4, `/api/start`; § 5, «Prender la opción»; R1.2, R1.3,
R3.4) — Frena.**
Dos huecos:

- **La opción de Más.** Aparece «si `start.offline.allowed` y `hasPasskey()`». Pero `offline` en
  `/api/start` habla de **la huella vinculada a ese celular**, no de la persona de la sesión, y
  `hasPasskey()` también es del celular. Si en el celular de A entra B con Google, B ve el renglón
  y, al prenderlo, guarda el permiso de A (con el nombre y el rol de B, que son los de la sesión).
  R1.2 y R1.3 piden el permiso y la huella **de esa persona**. Falta comparar `offline.userId` con
  la persona de la sesión.
- **La cookie.** Si la confirmación de A queda pendiente (1.1, 1.4) y mientras tanto B entra con
  Google, el próximo envío de la de A pone la cookie de A en ese navegador: el marco muestra a B y
  el servidor atiende a A. Propuesta: cuando entra otra persona, lo pendiente de A se manda igual
  (R3.4, R4.2) pero marcado para no abrir sesión, como en 1.2.

**1.6 · Cuándo se apaga la opción (§ 4, `allowed`; § 5, «Cada contacto»; R1.5, R2.2, E05, E10,
E17) — Frena.**
- **De más.** `allowed` es `false` también cuando «la última sesión de ese celular la cerró otro
  dispositivo», y `offline.allowed: false` o `session-closed` con `revoked` **borran** el permiso.
  R1.5 dice que la opción se apaga sola solo si la cuenta fue dada de baja o perdió el permiso; la
  sesión cerrada a distancia (R2.2) solo impide entrar sin conexión hasta el próximo contacto. Con
  el diseño, después de que un Administrador cierra una sesión, la persona vuelve a entrar con
  conexión y encuentra la opción apagada. Hacen falta dos datos distintos: «se puede entrar sin
  conexión ahora» (con la sesión cerrada a distancia, no) y «la opción sigue valiendo» (con la baja,
  sin el permiso o sin la huella, no). Solo el segundo borra el permiso guardado.
- **De menos.** El campo `offline` va solo «si `X-Device-Id` tiene una huella vinculada sin
  quitar». Si se quita la huella, `/api/start` no lo manda y nada borra el permiso: el celular sigue
  dejando entrar sin conexión con una huella que el servidor ya no acepta, y E17 se repite cada vez.
  R1.5 dice que quitar el vínculo apaga la opción. Propuesta: sin huella, `offline: { allowed: false,
  ... }` igual (o que la falta del campo borre el permiso), y que un rechazo por `unknown-credential`
  también lo borre. (Aparte, y viene del 01: `hasPasskey()` no se entera de que la huella se quitó.)

**1.7 · Prender la opción (§ 5, «Prender la opción»; R1.3; maqueta de Más) — Frena.**
- R1.3 dice que para prenderla hace falta conexión, y la maqueta aprobada lo muestra: tocarla
  apagada sin conexión no la prende y la tostada dice «Para prenderla hace falta internet.»;
  apagarla se puede siempre. El diseño no lo dice, ni el texto está en § 8.
- `lastContactAt` se guarda con «la hora del celular en ese momento», la de tocar el interruptor.
  Pero `allowed` viene del último `/api/start`, que puede ser de horas antes: si la aplicación se
  abrió a las 6 y la opción se prende a las 10, el celular deja entrar hasta las 10 del día
  siguiente y el servidor rechaza todo lo de después de las 6 (`too-late`), porque su último contacto
  es de las 6. Tiene que ser la hora de la última respuesta del servidor, la misma que guarda «Cada
  contacto».

**1.8 · El corte de las 24 horas (§ 5, «Entrar sin conexión», último punto; R2.7, E08, E14) —
Frena.**
- **Al reabrir la aplicación.** Con una sesión sin conexión guardada, `boot` sin red no llama a
  `confirmed` y el marco aparece con la persona guardada (R3.6, que vale para las sesiones
  normales). Si pasaron las 24 horas mientras estaba cerrada, se ve el marco en lugar de la entrada:
  E14 no se cumple. El corte tiene que mirarse también al arrancar.
- **El celular dormido.** Un `setTimeout` de horas se frena o se atrasa con la pantalla apagada y la
  pestaña oculta. Además del temporizador, mirar el corte al volver a la vista.
- **La entrada a la vista.** El aviso «podés entrar con la huella hasta…» tiene que apagarse solo a
  esa hora (E08 sin recargar). `useOfflineEntry` no dice que se vuelva a calcular.
- **Lo pendiente después del corte.** Si vuelve la red después de las 24 horas, la entrada pendiente
  se manda igual (para la auditoría), pero ¿la sesión se abre y la entrada de encima se va? R2.7
  dice que la sesión sin conexión dura hasta que vuelve la red o se cumplen las 24 horas; con el
  paso 8, una entrada firmada dentro del plazo se confirma aunque llegue tarde. Hay que decir qué ve
  la persona.

**1.9 · La versión nueva (§ 5, § 7; 00 · R5; R2.6) — Mejora importante.**
- Si la confirmación recibe `update-required` (426), no es un rechazo: lo pendiente se guarda, se
  actualiza la aplicación y se manda con la versión nueva (1.4).
- Lo guardado (el permiso y la entrada pendiente) tiene que poder leerlo la versión siguiente: decir
  que su forma está en un contrato de `src/shared/` con versión, y que una versión que cambia la
  forma lee la anterior.
- R2.6: «la aplicación abre aunque no haya internet desde que se prendió el celular». Eso depende
  del service worker, que según el 01 guarda el esqueleto al instalarse y «el resto, la primera vez
  que se usa». El diseño no dice si lo de la entrada sin conexión (`offline/`, la verificación, los
  textos) va en el arranque o se guarda al prender la opción. Si va aparte y no se guardó, sin red
  no está. Si va en el arranque, suma al tope de 60 KB.

**1.10 · El mensaje de no autorizada (§ 4, «Si algo falla»; R3.2, E16) — Mejora.**
R3.2 dice que, dada de baja, «dice lo mismo que una no autorizada (01 · R1.3)», que lleva el correo
(«Esta cuenta (nombre@gmail.com)…»). El celular guarda nombre y rol, no el correo. La respuesta
`not-authorized` de la confirmación tiene que traerlo, como dice el § 4 del 01; como va después de
verificar la firma (paso 5), solo lo recibe quien tiene la huella.

**1.11 · Pasar al marco (§ 5, paso 5; R3.4) — Mejora.**
«Pasa directo al marco… con la persona guardada.» Si la entrada estaba encima de lo que había dejado
otra persona (una sesión vencida), R3.4 pide descartar lo de la otra. Eso lo hace hoy `signedIn()`.
Decir que la entrada sin conexión pasa por el mismo camino (sin la parte de la versión nueva, que
sin red no aplica), así no se escribe dos veces.

**1.12 · «Hasta el martes 9:40» (R2.1; 00 · R8.4 y R8.5) — Mejora.**
R8.4 dice que las horas se muestran en la zona del negocio, que fija un Administrador; R8.5, que la
persona elige el formato. El diseño no dice en qué zona ni con qué formato se arma el aviso, ni qué
dice si el plazo vence hoy («hoy 9:40» o «el martes 9:40»). Como mucho son 24 horas, vale decidirlo.

**1.13 · El mapa de escenario a prueba (§ 12) — Mejora.**
La constitución (VII) pide una prueba que nombre cada escenario. El § 12 nombra E05, E08, E09, E14 y
E16 a E20; faltan E01 a E04, E06, E07, E10 a E13, E15 y E21. Una tabla «escenario → dónde se
prueba» (unitaria del servidor, de la aplicación, captura o punta a punta) lo deja a la vista.

## 2. Performance

**2.1 · `/api/start` (§ 4 y § 11) — Mejora importante.**
El diseño dice «una consulta más, por índice» y «unos 250 bytes más». Lo que veo:

- **Es para todo dispositivo, no solo los que tienen huella.** Para saber si `X-Device-Id` tiene una
  huella vinculada hay que consultar: también las computadoras y los celulares sin huella pagan esa
  consulta en cada `/api/start`. Hoy `/api/start` con la sesión en memoria hace **0** consultas, y
  el § 12 del 01 lo tiene como meta con su prueba; con esto pasa a 1 en cada apertura y en cada
  vuelta de la red.
- **Los 250 bytes van a todo celular con huella**, aunque nunca prenda la opción: el servidor no sabe
  si está prendida. Y `publicKey`, que no cambia nunca para una credencial, viaja en cada apertura.
- Las opciones están en 8.1. Lo mínimo: que la aplicación pida el campo solo cuando lo necesita
  (con la opción prendida, o con Más del celular abierto para mostrar el renglón) y que la llave
  pública viaje una vez, al prender. Y tener en memoria «la huella de cada celular», como las
  sesiones, para volver a 0 consultas.

**2.2 · El índice de las sesiones por celular (§ 4, `allowed` y paso 7 y 8) — Mejora importante.**
«La última sesión de ese celular» y «el último uso de sus sesiones» buscan `sign_in.sessions` por
`device_id`. La tabla tiene índices sobre `token_hash`, `user_id` y `closed_at`, no sobre
`device_id` (lo confirma la migración). Si eso va en cada `/api/start`, es una búsqueda frecuente y
pide su índice (constitución XII.2): `(device_id, created_at desc)`. Hoy la tabla es chica, pero se
guardan 30 días de sesiones cerradas.

**2.3 · Las consultas de la confirmación (§ 11) — Mejora.**
«Tres consultas y dos escrituras.» Me salen más: la fila del `id`; la huella; la persona (por la
fachada de `users`, 6.2); la última sesión del celular y su último uso, que además hay que juntar
con el que está en memoria sin escribir; y de escrituras, la fila, la sesión y el contador con su
último uso, como al entrar con la huella (el 01 cuenta 4 consultas para eso). No cambia la meta de
tiempo, pero la prueba que cuenta las consultas tiene que tener el número bueno.

**2.4 · `mobile-data.md` (§ 11, último punto; § 13, tarea 5) — Frena (es solo documento).**
La constitución (III) dice que todo pedido que la aplicación haga sola «se anota antes» en
`mobile-data.md` y lo aprueba Carlos. El diseño lo deja para la tarea 5, después del código. Van
antes de que Carlos apruebe el diseño: la confirmación al volver la red, su reintento (1.1) y los
bytes de más de `/api/start` al abrir y al volver la red, que ya están en esa tabla con otros
números.

Temporizadores que consultan la red: el corte de las 24 horas no consulta nada; está bien. El
reintento de 1.1 sí, y por eso va a `mobile-data.md`.

## 3. Simpleza

**3.1 · La verificación local con WebCrypto (§ 1, § 5 paso 3, § 12) — Mejora importante.**
El diseño mismo dice que esa verificación «es solo para la pantalla: cualquiera que toque el código
del celular la puede saltar». Con `allowCredentials: [credentialId]` y `userVerification:
"required"`, que `navigator.credentials.get()` devuelva una firma ya quiere decir que el lector del
celular verificó a la persona con esa credencial. Revisar además la firma con la llave pública no
frena a nadie que no esté ya frenado, y es lo más caro del diseño: la llave en JWK en cada
`/api/start` (con su conversión desde COSE), ES256 y RS256, la firma de DER a `r‖s`, `rpIdHash`,
la marca UV, y sus pruebas con firmas reales para llegar al 100 %.

Lo que alcanza para la pantalla: que la respuesta sea de `credentialId` y, si se quiere, mirar el bit
UV de `authenticatorData` (un byte). Sin la llave, el campo de `/api/start` queda en un booleano y
el `credentialId`.

Hay que mirarlo contra R2.5: «El celular verifica la huella él solo, con lo que guardó al
vincularla». Se puede leer como lo que hace el lector (la huella la verifica el celular con lo que
guardó al vincularla) o como que la aplicación verifica la firma. Si es lo segundo, igual conviene:
(a) que la llave se guarde en el celular al vincular (la devuelve `navigator.credentials.create()`,
con `getPublicKey()`), que es lo que dice la regla, en lugar de bajarla en cada apertura, y para las
huellas ya vinculadas, una vez al prender la opción; y (b) solo ES256, que es lo que usan las
huellas de Android: una huella RS256 no ofrece la opción. Lo decide el arquitecto con Carlos.

**3.2 · La tabla `offline_sign_ins` (§ 3) — Mejora.**
Para impedir la repetición (E18) alcanza con `id` y `received_at` (para borrarla a los 30 días), más
lo que necesite 1.4 (el resultado, la sesión y la llave de prueba). `signed_at`, `last_contact_at`
y `reason` son historia, y la historia va a la auditoría (principio V), que ya los recibe en el
§ 10. El índice sobre `user_id` «para la auditoría» sobra: la auditoría está en SQLite y no lee esta
tabla. Falta decir quién borra las filas de más de 30 días (el trabajo diario que ya borra las
sesiones viejas, supongo).

**3.3 · `passkeys.last_used_at` con dos significados (§ 4, «El último contacto») — Mejora.**
Hoy es «la última vez que se entró con esa huella» (`markUsed`). El diseño le suma «la última vez que
ese celular pidió `/api/start`». Un nombre que dice una cosa y guarda otra deja de servir de índice
(XII.1), y un módulo que más adelante muestre «última vez que usó la huella» va a mostrar otra
cosa. Una columna `last_contact_at` es una migración de una línea.

**3.4 · `registerSetting` (§ 8, Más) — Mejora.**
Para un solo renglón se arma un registro global en el marco. `App.tsx` ya conoce a los dos módulos y
le pasa al marco `onSignOut`: le puede pasar el renglón (o la lista de renglones de «Ajustes») como
propiedad, sin registro. El registro tiene sentido cuando haya varios módulos que sumen ajustes sin
que `App.tsx` los conozca; no hoy.

## 4. Repetición

**4.1 · El desafío (§ 4 paso 4 y § 5 paso 2) — Mejora.**
El celular y el servidor calculan el mismo `base64url(SHA-256(JSON canónico de …))`. Es justo lo que
la constitución pone «una sola vez en `src/shared/`». Además hay que definir «canónico» (el orden de
las claves y el formato de las horas): si cada lado lo arma a su modo, una diferencia de una coma
rechaza todas las entradas. Con una sola función compartida y una prueba con un valor fijo, no pasa.

Lo demás reusa lo que ya existe (el límite de la huella, `Origin`, la sesión del 01, `useReconnect`,
la entrada encima de lo que había); solo falta reusar `signedIn()` (1.11).

## 5. Seguridad

Recorrí el § 9: datos que toca, quién puede, qué entra de afuera, secretos y auditoría. Está
contestado todo, y lo aceptado está dicho con su porqué. Lo que agrego:

**5.1 · El reloj atrasado (§ 5, «Entrar sin conexión»; § 9; R2.3, E09) — Mejora importante.**
El celular compara la hora de ahora solo con `lastContactAt`. Atrasar el reloj sin pasar el último
contacto sí da más tiempo: contacto el lunes a las 10, el martes a las 9 se atrasa el reloj a las
4 del martes y el celular cree que quedan 6 horas en lugar de 1. El servidor tampoco lo nota:
`signedAt` dice 4 del martes, dentro de las 24 horas. R2.3 dice «atrasar el reloj no da más tiempo».
Con poco se cubre casi todo: guardar en el celular **la hora más alta que vio** (al abrir, al
volver a la vista, en cada contacto) y tomar como vencido todo lo que marque menos. Es más estricto
que la letra de R2.3 y más cerca de su intención: confirmarlo con Carlos.

**5.2 · Una prueba firmada sirve hasta 24 horas (§ 4, § 9) — Mejora (para el revisor de
seguridad).**
Al entrar con conexión, el desafío lo da el servidor y vale 5 minutos. Acá lo arma el celular y la
firma sirve hasta 24 horas después del último contacto, y la entrada pendiente está en
`localStorage`, al alcance de un código malicioso en la página. Quien la copie, junto con
`X-Device-Id`, puede confirmarla desde otro aparato antes que el celular y llevarse la sesión
(trayendo su propia llave de prueba). Hace falta la huella de la persona para firmarla, así que no
es una entrada sin la huella; pero conviene que el revisor de seguridad lo mire y que el § 9 lo
diga como aceptado o lo cierre (por ejemplo, que la confirmación solo se acepte del mismo `/64` o
de la misma dirección que el último contacto, o con un plazo más corto entre `signedAt` y la
llegada cuando el celular ya tuvo contacto después).

**5.3 · La auditoría (§ 4 paso 3, § 10; R3.3, E44 del 01) — Mejora.**
- La repetición (paso 3) «rechaza sin escribir nada»: un intento de usar dos veces la misma firma
  es justo lo que la auditoría tiene que ver. Un evento `sign-in.offline-rejected` con motivo
  `reused` (y el motivo en la lista).
- Con `bad-signature` o `unknown-credential`, el `user_id` de la fila y del evento es el que dice
  el pedido, sin probar. Que el evento lo diga («dice ser»), como el 01 hace con el correo de una
  cuenta no autorizada.
- Los rechazos por el límite ya los cubre `sign-in.throttled`.

**5.4 · El último contacto se alarga con pedidos que no prueban nada (§ 5, «Cada contacto»; R2.2)
— Mejora.**
«Cada pedido con sesión que el servidor acepta también actualiza `lastContactAt`.» R2.2 pide que en
ese contacto la cuenta estuviera activa y con el permiso. Con la sesión de **otra persona** en ese
celular (1.5), el pedido no dice nada de la cuenta de la huella y, sin embargo, alarga su plazo. Y
desde el módulo 02, quitar el permiso no cierra la sesión: una sesión aceptada no prueba el permiso.
Propuesta: que solo cuente el pedido con la sesión de esa misma persona (y, desde el 02, que la
cabecera `X-Ferrebress` diga si sigue con el permiso). El servidor ya lo controla en el paso 8, así
que el riesgo es solo una pantalla que promete un plazo que después no se confirma.

Secretos: ninguno nuevo, de acuerdo.

## 6. Fronteras

**6.1 · Dónde vive el código («Dónde vive el código»; constitución XII) — Frena (es solo
documento).**
La constitución dice: «Un módulo tiene el mismo nombre en el capítulo, en el servidor y en la
aplicación». El capítulo es `15-offline` y el código queda en `sign-in/offline/`. El porqué del
diseño es razonable (crea sesiones y usa las huellas de `sign-in`), pero contradice una regla
escrita. Las opciones:

- **(a) `modules/offline/` desde ahora**, con lo que es del capítulo 15 (la opción y su permiso
  guardado, `canWorkOffline`, el plazo de las 24 horas, el renglón de Más, la entrada pendiente), y
  la fachada de `sign-in` ofreciendo lo suyo: «abrir una sesión con una firma de huella ya
  verificada» y «la huella de este celular». Es la que deja más fácil la etapa b, que va a necesitar
  justo esas piezas, y el nombre funciona como índice. El campo de `/api/start` necesita que
  `offline` le aporte algo a `sign-in` sin ciclo (un registro como `registerWork`, o 8.1 c).
- **(b) Quedarse en `sign-in/offline/`** y escribir la excepción (en la constitución o en la
  arquitectura) con la aprobación de Carlos: «la etapa a del 15 vive en `sign-in`».

Cualquiera vale; lo que no vale es que la regla diga una cosa y el código otra.

**6.2 · «La huella con su persona y su última sesión» en una consulta (§ 4 y § 11) — Mejora
importante.**
La persona está en el esquema `users`. Una consulta de `sign-in` que la junta con `sign_in.passkeys`
salta la fachada de `users` (la arquitectura: cada módulo es dueño de su esquema; entre módulos,
solo por `index.ts`). Hoy `/api/start` la pide por la fachada (`ctx.people.of`). Que siga así: son
dos consultas en lugar de una (o ninguna, si la persona está en memoria como la de las sesiones).

**6.3 · Quién anota el último contacto en cada respuesta (§ 5, «Cada contacto») — Mejora.**
`platform/server/api` es el único que ve todas las respuestas, pero no puede saber del negocio.
Decir que la plataforma publica «el servidor contestó a tal hora» (un valor compartido, como
`online`) y que la parte de sin conexión lo escucha y actualiza lo guardado. Si no, se termina
escribiendo en la plataforma o en cada llamada.

**6.4 · Dónde se guarda (§ 7; arquitectura, «Los datos»; ADR-007) — Mejora.**
La arquitectura y el ADR-007 dicen que lo de trabajar sin conexión va en IndexedDB; el diseño lo pone
en `localStorage` (`platform/device/storage`). Para dos objetos chicos `localStorage` es más simple y
está bien, pero hay que actualizar la arquitectura para que no se contradigan (con la tarea
«Documentos del proyecto»).

## 7. Sin conexión, hora y escala

**7.1 · Las horas del celular en el servidor (§ 4, paso 8) — Mejora importante.**
El paso 8 compara `signedAt`, que es la hora del celular, con el reloj del servidor: «no puede estar
más de 5 minutos en el futuro». Un celular con el reloj 10 minutos adelantado que confirma enseguida
llega con `signedAt` en el futuro y se rechaza **siempre**. Lo mismo cerca del borde de las 24
horas. La constitución (VI) cuenta con relojes mal puestos. Propuesta, sin cambiar R2.3 (el celular
sigue decidiendo con su reloj): en cada contacto guardar también la hora del servidor (ya llega en
`X-Ferrebress` y la toma `syncServerTime`), mandarla firmada en el desafío y que el servidor trabaje
con **diferencias del mismo reloj**: lo que pasó según el celular entre el contacto y la firma
(`signedAt − lastContactAt`) sumado a la hora del servidor de ese contacto. La diferencia del reloj
se cancela.

Que el celular no use «la hora del servidor más el cronómetro» para el plazo está bien: no sé si en
Android `performance.now()` sigue contando con el celular dormido (no lo pude comprobar), y además
se pierde al cerrar la aplicación.

**7.2 · La etapa b sin rehacer (§ 3, § 5, § 7) — Mejora importante.**
La etapa b va a atar lo hecho sin conexión a una entrada sin conexión. Para no rehacer, conviene
dejarlo previsto ahora:

- Lo pendiente como **lista ordenada** que sobrevive a «Salir» (1.2, 1.3): R4.1 del 01 dice que lo no
  enviado queda guardado también al salir.
- La pública de la llave de prueba guardada **también en las rechazadas**: lo hecho en una entrada
  rechazada va a anomalías (la idea del capítulo) y hay que poder verificar que lo firmó esa llave.
  Con la tabla de § 3, al rechazar se pierde.
- Que la entrada sin conexión tenga desde ya la forma de un comando repetible (ADR-007): `id` del
  dispositivo, mandarlo dos veces no duplica (1.4).

**7.3 · El último contacto en memoria (§ 4, «El último contacto») — Mejora.**
Es una pieza más en memoria por tandas, como el último uso de las sesiones. Con varias copias del
servidor tiene que pasar a la base junto con esas; decir que queda detrás de la misma interfaz
(ADR-015, principio IX). A 100 personas no cambia nada más: una fila por entrada sin conexión.

## 8. Mejoras

**8.1 · `/api/start`: tres formas (§ 4) — Mejora.**
Lo bueno de `/api/start` es que ya se pide al abrir y después de salir, así que confirma la cuenta
también sin sesión, sin un pedido nuevo. Las opciones, de más a menos costo:

- **(a) Como está:** una consulta y 250 bytes en cada apertura de cualquier dispositivo (2.1), con
  el problema de 1.5.
- **(b) El campo solo cuando la aplicación lo pide** (un parámetro, por ejemplo `?offline=1`, con la
  opción prendida o para mostrar el renglón de Más), **sin la llave** (que se guarda una vez, 3.1) y
  con la persona del campo comparada con la de la sesión. Paga solo el celular que lo usa, unos 60
  bytes.
- **(c) Sin campo con sesión:** con sesión abierta, la sesión ya prueba que la cuenta está activa
  (la baja la cierra) y el permiso es el de su rol, que viaja con la persona; el campo va solo sin
  sesión (después de «Salir»), que es cuando no hay otra forma de saberlo. Prender la opción toma la
  llave en ese momento (es con conexión, R1.3).

Recomiendo (b): es el cambio más chico y saca casi todo el costo.

**8.2 · Una sola salida de lo pendiente (§ 5) — Mejora.**
Hoy hay una salida pendiente; con este diseño, también entradas pendientes; en la etapa b, la cola.
Una sola función «mandar lo pendiente, en orden» que llaman `boot` y `recheck` antes que cualquier
otro pedido, con una sola regla de qué respuesta lo borra (1.4) y el reintento de 1.1, arregla 1.1 a
1.5 en un solo lugar y es la base de la cola de la etapa b.

**8.3 · La página de prueba de la huella sin internet (§ 2) — Mejora.**
Bien que vaya primero. Conviene decir: dónde vive (tiene que servirse desde el origen del ambiente
de pruebas, porque la huella está atada a su `rpId`) y que no es parte de `src/` ni lleva pruebas, y
se borra después; y que pruebe también los casos que pide R2.6: la aplicación instalada, abierta en
modo avión y con el celular recién prendido sin red, no solo una página abierta antes de cortar.
Si en el local hay más de un celular con Android distinto, probar en cada uno.

---

## Lo que no pude comprobar

- Que las huellas del Administrador de contraseñas de Google firmen sin internet: el diseño tampoco
  lo sabe y por eso pone la página de prueba primero (§ 2, 8.3).
- Si `performance.now()` sigue contando en Android con el celular dormido (7.1).
- Que `@simplewebauthn/server` verifique una respuesta con un desafío armado por el cliente: su
  `expectedChallenge` acepta un texto o una función, según lo que recuerdo de su documentación; no lo
  probé.
- Si lo de la entrada del celular queda en el arranque o en lo que el service worker guarda al
  instalarse (1.9): no medí el paquete armado.
- Que el autenticador virtual de Chrome firme con el contexto de Playwright cortado de la red
  (§ 12, punta a punta); es lo esperable, pero no lo probé.
