# Revisión de seguridad · 03 · Celular y computadora (`device-link`), etapa a

## Paso 4: el diseño

Revisión independiente del [diseño](device-link.md) y del
[ADR-017](../adr/ADR-017-realtime-channel-and-mirror.md), mirada como la haría alguien que quiere
entrar sin permiso, ver lo ajeno, cambiar datos o tirar el sistema (constitución, paso 4). Todavía no
hay código del módulo. Leí la constitución, el capítulo [03](../../chapters/03-device-link/rules.md)
(en especial E37 a E40), la [arquitectura](../architecture.md), el ADR-003 y el ADR-015, y el código
que el diseño toca o migra: las sesiones (`src/server/modules/sign-in/sessions/`,
`src/server/platform/session.ts`), el canal del QR de entrada (`sign-in/codes/computer/`), la cabecera
`X-Ferrebress` (`src/shared/contracts/server-header.ts`, `src/server/platform/http.ts`), el lector de
SSE y `api.ts` de la aplicación, `deploy/Caddyfile` y `deploy/compose.yml`.

Las reglas que decidió Carlos no se discuten: vincular no pide permiso (R1.2), al entrar con el
celular se reemplaza sin preguntar (R1.5), el directo sigue sin internet (R3.4). Se señalan los riesgos
que traen y que el diseño no cubre.

- **Frena:** se puede entrar, ver o cambiar lo ajeno, o filtrar datos personales. Se resuelve antes
  de aprobar el diseño.
- **Mejora:** conviene hacerla; no frena.

## Resumen

Lo que el servidor decide está bien atado. **Nadie de otra cuenta puede vincularse:** el código de
vincular es de la sesión de la computadora y solo lo puede leer un celular con sesión de la misma
persona (E37). Presentar, reenviar, pausar y desvincular toman el vínculo de la sesión y no de un
identificador del cuerpo, así que no se puede actuar sobre el vínculo de otro cambiando un id (E38).
La oferta y la respuesta de WebRTC viajan por HTTPS con sesión y llevan la huella DTLS, así que otro
equipo del Wi-Fi no se puede meter en el medio. Sin STUN ni TURN no se abre ningún puerto nuevo en el
servidor ni sale nada a terceros. Y la política de contenido de Caddy (`script-src 'self'`, sin
`'unsafe-inline'`) frena un `javascript:` aunque llegue un valor envenenado por el espejo.

El hueco está en lo que **el servidor no ve: la conexión directa**. El diseño dice que, cuando un
vínculo termina, «el directo se corta del lado honesto» (§ 15). Pero el lado honesto se entera tarde o
nunca, y mientras tanto sigue mandando datos. Hay tres caminos concretos:

1. **El celular cortado sigue recibiendo.** Un celular que se cortó como perdido, o al que le
   cerraron la sesión, sigue recibiendo la pantalla de la computadora y la sigue manejando. Si
   estaban en pausa, el celular puede pedir «Reconectar» por el canal de datos y la computadora le
   manda la foto sin preguntarle al servidor.
2. **La sesión del celular vence sin que nadie se entere.** El celular en espejo directo no le hace
   ningún pedido al servidor, así que su sesión vence a los 60 minutos y nadie lo nota: sigue viendo
   y manejando todo.
3. **El celular de Ana puede ver lo de Beto.** Al vencer la sesión de la computadora, la entrada
   aparece encima de lo que había, y la máquina de estados no tiene ningún evento para «este
   dispositivo se quedó sin sesión». Si después entra Beto en esa misma pestaña, el celular de Ana
   puede espejar lo de Beto (E11).

| # | Punto | Gravedad |
|---|---|---|
| 1 | Cortar el celular o cerrarle la sesión no corta el directo: sigue recibiendo la pantalla, la maneja y puede reconectarse sin el servidor | **Frena** |
| 2 | La sesión del dispositivo que no hace pedidos (el celular en directo) vence y el espejo sigue | **Frena** |
| 3 | Sin evento de «esta sesión se cerró» en la máquina de estados: el espejo sigue debajo de la entrada y puede pasar a otra persona (E11); en el servidor, salir no avisa a `onEnded` | **Frena** |
| 4 | La persona y el dispositivo tienen que salir siempre de la sesión, nunca de `X-Device-Id` | Mejora importante |
| 5 | Un código leído por otra cuenta no tiene que gastarse; el boleto de reemplazar tiene que estar atado a quien lo pidió | Mejora importante |
| 6 | Los topes por dirección y el tope total del canal: alguien del mismo Wi-Fi o de la misma red del celular bloquea a los demás | Mejora importante |
| 7 | El hub: publicar «solo al otro», soltar las suscripciones del vínculo que terminó, el canal anónimo que suma temas con sesión, el oyente lento | Mejora |
| 8 | Los valores espejados no tienen esquema por clave: un par modificado cuelga la pantalla del otro, le muestra «datos del servidor» falsos o le llena la memoria | Mejora |
| 9 | El diario y la tira guardan identificadores de personas y quedan para la próxima persona de la computadora compartida | Mejora |
| 10 | `POST /api/device-link/report` escribe en el registro lo que manda el dispositivo | Mejora |
| 11 | WebRTC sí muestra direcciones de la red cuando el celular tiene permiso de cámara; el servidor no valida los candidatos | Mejora |
| 12 | `members.ts` en memoria: no está en la lista de lo que cambia con varias copias del servidor | Mejora |
| 13 | El reemplazo sin preguntar (R1.5) agranda el daño de un engaño en la entrada con el celular | Mejora |
| 14 | El espejo mantiene viva la sesión de la computadora desatendida | Mejora |

---

## 1. Entrar sin permiso

### 1 · Cortar el celular o cerrarle la sesión no corta el directo (§ 7.1, § 7.2, § 5.3, § 15) — Frena

**Dónde.** § 15: «Cuando termina un vínculo, el directo se corta del lado honesto […] la computadora
se entera por su canal o por la señal del buzón en su próximo pedido, y corta. […] lo más que se lleva
es lo que ya estaba en pantalla». § 7.2: en pausa «el canal de datos se conserva sin espejar […]
"Reconectar" llega al otro en el acto y sin servidor»; § 7.1, `resume` del otro → «computadora:
`sendSnapshot`». § 5.3: «Si a los 3 s no llegó la respuesta de la computadora, el celular la pide él».

En «Directo» ninguno de los dos tiene un canal con el servidor (E24, lo pide la regla), así que el
servidor no tiene cómo avisarle a nadie en el momento. La afirmación de § 15 («lo más que se lleva es
lo que ya estaba en pantalla») no es cierta por tres caminos.

**Ataque A: la pausa con el canal de datos conservado.**

1. Ana tiene el celular vinculado y en pausa («Desconectado»). Venían en «Directo», así que el canal
   de datos sigue abierto.
2. Un cliente le saca el celular del mostrador con la aplicación abierta y se queda en el local, en el
   Wi-Fi. Ana avisa y un Administrador lo corta como perdido (E15). El servidor termina el vínculo y
   deja la señal en el buzón de la computadora.
3. La computadora está en pausa y nadie la toca, así que no hace ningún pedido y no ve la señal.
4. El ladrón toca «Reconectar» en el celular. Según § 7.1, el celular manda `POST /resume`, que el
   servidor rechaza (`not-paired`), y además `send(resume)` por el canal de datos, que no pasa por el
   servidor.
5. La computadora recibe `resume` del otro y manda la foto (`sendSnapshot`): la dirección y todos los
   valores vivos, también las respuestas del servidor (`q:…`). El ladrón ve lo que la computadora
   tiene abierto, sin que ningún pedido toque el servidor. Puede repetirlo con
   «Desconectar» y «Reconectar».

**Ataque B: el directo activo.** El celular cortado manda parches de la dirección y de los
buscadores. La computadora, que «pide siempre» (§ 5.3), pide al servidor y reenvía la respuesta. La
señal del buzón llega en la cabecera de esa misma respuesta, pero `piggyback.ts` la procesa aparte (un
`GET /api/device-link` después), y `query.ts` ya puso el valor y lo mandó por el canal. Al menos una
respuesta entera (la lista de personas, una tarjeta) se va al celular cortado.

**Ataque C: al revés, la computadora robada.** Se llevan la notebook del local, todavía en el Wi-Fi,
y un Administrador cierra su sesión desde Usuarios (E14). El ladrón tiene las herramientas del
navegador y la pestaña sigue en «Directo» con el celular de Ana. Manda parches de dirección. La
computadora ya no puede pedir (401), así que a los 3 s el celular de Ana pide él (`query-timeout`), con
su sesión viva. Ese resultado es un valor con nombre y viaja de vuelta a la computadora robada. Ana usa
el celular sin enterarse y le va mostrando al ladrón lo que pide, hasta que una respuesta del celular
traiga la señal.

**Además, escribir.** Todo lo escrito y lo abierto encima se espeja (R6.2), también una confirmación.
Un par que ya no es del vínculo puede llenar un campo o abrir un diálogo en la computadora justo antes
de que la persona apriete Entrar. Esa escritura sale con la sesión viva de la computadora. En los
módulos de hoy hay poco para escribir, pero el mecanismo es común y lo van a usar ventas y precios.

**Qué consigue.** Alguien a quien un Administrador ya le sacó el acceso (cortar el celular, cerrar la
sesión) sigue viendo datos del negocio y de personas, y puede preparar escrituras. Es justo lo que
R2.3 y E39 dicen que no pasa.

**Qué propongo.**

1. **Nada sale por el espejo sin un vínculo confirmado hace poco.** Antes de mandar una foto (`snap`)
   o una respuesta del servidor (`q:…`), el que manda mira que el servidor le haya confirmado el
   vínculo después del último evento que lo pone en duda:
   - el `resume` del otro;
   - el `hello` del otro;
   - una señal del buzón todavía sin leer.

   En la práctica: el `resume` y el `hello` que llegan por el canal de datos pasan la máquina a un
   estado «por confirmar». Ahí se pide `GET /api/device-link` (unos 300 bytes) y recién con el vínculo
   vigente se manda la foto. Sin internet (R3.4) no hay cómo confirmar. Propongo que se acepte si la
   última confirmación tiene menos de unos minutos, y si no, que espere a que vuelva. Es una
   transición más y una prueba; cambia «Reconectar llega en el acto y sin servidor» por «con un pedido
   chico».
2. **La señal se procesa antes de reenviar.** En `api.ts`, si la cabecera trae `s=device-link` con una
   versión nueva, el espejo queda en suspenso (no sale nada) hasta que `GET /api/device-link` conteste.
   Así la respuesta que trae la señal nunca se reenvía. Son unas 10 líneas en `piggyback.ts` y
   `runtime.ts`.
3. **Lo que pidió el celular no viaja a la computadora.** Los valores `q:` van solo de la computadora
   al celular (§ 5.3 ya dice que pide la computadora). Si el celular pidió por `query-timeout`, el
   resultado queda local y no se manda. Cierra el ataque C y no cuesta nada.
4. **Las escrituras dicen con qué vínculo se hicieron.** Mientras espeja, la aplicación manda en cada
   `POST` una cabecera con el vínculo (`X-Ferrebress-Pairing: <id>`). Un paso común del servidor la
   compara con `members.ts` (en memoria, 0 consultas) y contesta `409 pairing-ended` si ese vínculo ya
   no existe; la aplicación pasa a «Sin vincular» sin escribir. Además, como regla de las pantallas, un
   cambio que llega del otro nunca dispara una escritura: solo un toque o una tecla en este
   dispositivo (§ 5.3 ya lo dice para los toques; falta para los efectos que miran un valor). Cuesta un
   paso en `platform/http.ts` y un control en `pnpm check` o en la revisión.
5. **Escribir el riesgo que queda**, para que Carlos lo acepte o no. Con todo lo anterior, un
   dispositivo cortado todavía ve lo que ya estaba en pantalla y lo que el otro escribe localmente hasta
   el próximo pedido. Es poco, pero hoy § 15 lo da por cerrado.

### 2 · La sesión del dispositivo que no pide nada vence y el espejo sigue (§ 5.3, § 7, § 3.3) — Frena

**Dónde.** § 5.3: en directo, «pide siempre la computadora […] el celular […] nunca pide lo que se
muestra en el espejo». ADR-015 y `sessions/rules.ts:13` a `:18`: la sesión cierra a los 60 minutos sin
pedidos (`idle`) y a las 8 horas de abierta (`max-age`). R2.1 y E17: si la sesión vence, el vínculo
queda dormido. El diseño solo resuelve el caso en que vence la de la computadora (E17), que se entera en
su próximo pedido.

**Ataque.**

1. Ana usa el celular en espejo directo toda la mañana, mirando pantallas: no escribe nada, así que el
   celular no le hace ningún pedido al servidor.
2. A los 60 minutos, el servidor da por vencida la sesión del celular. No se lo puede decir a nadie:
   el vencimiento por falta de uso se descubre recién al resolver ese pase (`store.ts:79` a `:100`) o
   en la limpieza diaria. Igual pasa a las 8 horas, con el tope.
3. El celular sigue en «Directo», recibiendo cada respuesta de la computadora y manejándola. La sesión
   de la computadora, en cambio, sigue viva gracias a esos mismos pedidos (punto 14).
4. Ana deja el celular desbloqueado en el mostrador y otro lo levanta. El vencimiento por falta de uso
   existe justamente para eso, pero no protege: el celular sin sesión ve y maneja todo.

**Qué consigue.** Un dispositivo sin sesión sigue viendo y manejando datos. Contradice R2.1 y E17
(el vínculo debía quedar dormido) y anula el cierre por falta de uso del celular. También es un error
de funcionamiento: el primer toque que escribe en el celular da 401 de golpe, en medio del espejo.

**Qué propongo.** Que el servidor mire la sesión del otro en los pedidos que la computadora hace por
el espejo:

- `query.ts` marca esos pedidos con la misma cabecera del punto 1.4.
- En memoria (0 consultas), el servidor resuelve la sesión del otro lado del vínculo: la última sesión
  abierta de esa persona en `phone_device_id`.
- Si está cerrada o vencida, le deja la señal `device-link` a la computadora, en esa misma respuesta, y
  la computadora pasa a «Esperando al celular» antes de reenviar (punto 1.2).
- Si está abierta, Carlos decide si el espejo cuenta como uso del celular. Si cuenta, el celular no
  vence mientras se usa en espejo, que es lo que espera quien lo tiene en la mano. Si no cuenta, el
  celular vence a la hora aunque lo estén usando.

Cuesta una búsqueda en memoria por pedido y una prueba por cada caso: vencido por falta de uso, por el
tope de 8 horas y cerrado desde Usuarios. Del lado del celular, la aplicación sabe cuándo fue su último
pedido (`lastReply`) y puede dejar de espejar sola al pasar los 60 minutos, como red de seguridad sin
gastar nada.

### 3 · Sin evento de «esta sesión se cerró» y `onEnded` no avisa al salir (§ 7.1, § 3.3; `sessions/store.ts:107`, `src/app/modules/sign-in/session.ts:44`) — Frena

**Dónde.** § 7: «Sin sesión, el módulo no corre: el vínculo está dormido». Pero en la tabla de
transiciones (§ 7.1) no hay ningún evento para «la sesión de este dispositivo se cerró»: `peerGone`
habla del otro y `ended` del vínculo. La aplicación muestra la entrada **encima de lo que había**
cuando la sesión vence (01 · R3.4; `sign-in/session.ts:42` a `:44`: si entra otra persona se descarta
lo que había a medio hacer, pero sin recargar la página).

**Ataque, sobre la computadora compartida (E11).**

1. Ana tiene la computadora del mostrador vinculada con su celular, en «Directo».
2. Se va sin salir y la sesión de la computadora vence a la hora. El próximo pedido da 401 y la entrada
   aparece encima de la pantalla. Como no hay evento para eso, el transporte sigue abierto y los
   valores con nombre siguen ahí, espejándose.
3. Beto entra en esa misma pestaña. Para el servidor, la computadora no está vinculada para Beto, pero
   la aplicación nunca cerró el transporte de Ana. Si el espejo no se reinicia con el cambio de
   persona, lo que Beto abre (la dirección, lo que trae el servidor con su sesión) viaja al celular de
   Ana.

**En el servidor**, el diseño hace que el hub cierre los canales de una sesión con `sessions.onEnded`
(§ 3.3). Pero hoy `onEnded` no avisa cuando la persona sale: `store.close` (`store.ts:107` a `:111`,
lo usa salir en `sessions/routes.ts:32` y `:47`) cierra la sesión sin llamarlo. `OnEnded` está escrito
para la auditoría («cuando una sesión venció o la cerraron sin que la persona saliera»,
`store.ts:147`). Un canal de una sesión que salió queda abierto del lado del servidor hasta que lo
corte la aplicación. Y el vencimiento por falta de uso tampoco avisa hasta que alguien resuelva ese
pase.

**Qué consigue.** Lo que ve una persona termina en el celular de otra (E11, al revés de lo que dice el
escenario).

**Qué propongo.**

1. Un evento `signedOut` o `sessionLost` en la máquina, que corre antes que todo lo demás. Se dispara
   con `sessionClosed`, al salir o cuando cambia `person`. Desde cualquier estado: `send(bye)`,
   `closeTransport`, `unsubscribe`, y vuelve al valor inicial **todo** lo recibido del otro. El
   espejo no se vuelve a armar hasta que `/api/start` traiga el vínculo de la persona que entró. Es una
   fila en la tabla y una prueba: «sesión vencida, entra otra persona, el par de mentira no recibe
   nada».
2. Que `sessions.onEnded` de `platform/session.ts` cubra todos los motivos, también salir, y que el
   hub y `members.ts` lo escuchen. La auditoría ya filtra lo suyo.
3. Que el chequeo de cada latido (§ 3.3) calcule `closedReasonOf` con la hora de ahora, en vez de mirar
   solo si la sesión sigue en memoria, para cerrar los canales de sesiones vencidas.

Cuesta unas 20 líneas y tres pruebas.

### 4 · La persona y el dispositivo, siempre de la sesión (§ 3.5, § 9.1, § 9.2) — Mejora importante

**Dónde.** El diseño dice «(persona, dispositivo)» para `members.ts`, el buzón y los límites, pero no
de dónde sale el dispositivo. En el código, `X-Device-Id` lo elige el navegador
(`platform/http.ts:105` y `:106`) y nadie lo compara con el de la sesión. `openSession` lo copia al
abrirla (`open.ts:56`). La revisión de seguridad de 15, punto 2, ya encontró que `/api/start` sin
sesión contestaba por un `X-Device-Id` ajeno.

**Ataque, si el módulo usa la cabecera.** No puede tomar el vínculo de otra cuenta, porque la persona
sale de la sesión. Pero:

- una computadora con la sesión de Ana manda el `X-Device-Id` del celular de Ana y pasa por el celular
  frente a `members.ts`;
- cada pedido con un dispositivo inventado abre una clave nueva en los límites («por dispositivo»,
  § 9.2) y en el buzón (10.000 dispositivos);
- si la contribución de `device-link` a `/api/start` se arma con el dispositivo de la cabecera, quien
  mande el id de la computadora de Ana, aun sin sesión, puede ver si hay vínculo y con qué.

**Qué propongo.** Escribirlo en § 9 y en § 15:

- el vínculo, el buzón, `members.ts` y las claves de los límites usan `session.userId` y
  `session.deviceId`;
- `celular` y `computadora` salen de `isPhone` de la sesión;
- `start.contribute` solo se llama con una sesión abierta, nunca con la cabecera.

Una prueba por cada ruta, con `X-Device-Id` de otro dispositivo. No cuesta nada más.

### 5 · El código leído por otra cuenta y el boleto de reemplazar (§ 9.2, § 9.3) — Mejora importante

**Dónde.** § 9.3: «Leer el código lo usa (E04): un código leído no vuelve a servir». No dice si lo
gasta también una lectura que se rechaza por `other-account`. El boleto «dura 2 minutos y sirve una
vez», sin decir a quién pertenece.

**Ataque A: bloquear a otro.** Beto, empleado con su propia cuenta, apunta su celular a la pantalla de
Ana cada vez que ella muestra el código, o le saca una foto y la lee. Si la lectura rechazada gasta el
código, Ana no puede vincular mientras Beto esté mirando. Y el límite es «10 por minuto», más que la
renovación de uno por minuto.

**Ataque B: el boleto.** El boleto vuelve en el cuerpo de `codes/read`, pero si `accept` no comprueba
lo siguiente, un boleto de la cuenta de Ana termina un vínculo de Ana desde otro dispositivo de ella (o
después de que la computadora cerró la sesión):

- que lo usa la misma sesión que lo pidió;
- que la sesión de la computadora sigue abierta;
- que los vínculos a reemplazar siguen siendo los mismos.

**Qué propongo.**

- Mirar persona y tipo de dispositivo **antes** de gastar el código: `other-account`, `not-a-phone` y
  `not-a-computer` no lo gastan.
- `codes/read` vuelve a comprobar que la sesión dueña del código sigue abierta y la persona activa.
- El boleto guarda la sesión del celular, la de la computadora y los vínculos que iba a reemplazar.
  `accept` lo cambia solo con esa sesión del celular y con las dos todavía abiertas.
- `device-link.rejected` con `other-account` lleva también a la persona dueña del código, para que el
  Administrador vea «Beto leyó el código de la computadora de Ana».

Son tres líneas por comprobación y una prueba por caso.

---

## 2. Permisos

- E38 y E39 en el servidor están bien resueltos: el vínculo sale de la sesión, sin ids en el cuerpo,
  mirado en cada `signal`, `relay`, `pause`, `resume` y `unpair`. Falta que el tema
  `device-link.pairing:<id>` compare el `<id>` del parámetro con el de `members.ts` y no solo que la
  persona tenga *algún* vínculo. Lo doy por entendido en «de ese vínculo (E38)» (§ 3.1), pero conviene
  escribirlo y probarlo con el id de otro vínculo.
- Lo que no cubre el servidor es lo directo: puntos 1 a 3.
- Una cuenta dada de baja: `user.deactivated` termina sus vínculos y la baja cierra sus sesiones en la
  misma transacción, así que el servidor lo resuelve bien. Del directo valen los puntos 1 y 2.

---

## 3. Lo que entra de afuera

### 8 · Los valores espejados no tienen esquema por clave (§ 5.1, § 5.2, § 13.2, § 15) — Mejora

**Dónde.** `mirroredStore<T extends Json>` y `useMirrored<T extends Json>`: `wire.ts` valida el sobre
del mensaje (`{t, k, v, c}`), pero `v` puede ser cualquier JSON de hasta 256 KB. § 15: «Un dispositivo
vinculado y modificado podría mandar cualquier valor válido: es la misma persona». La bandeja guarda
claves desconocidas 10 s, sin tope de cantidad (§ 5.2).

**Ataque.** No hace falta otra persona: alcanza con el dispositivo cortado de los puntos 1 a 3, o con
la notebook robada del ataque C, que tiene las herramientas del navegador.

- Manda `set users.selected = {"x":[…]}` donde la pantalla espera un texto: la pantalla del otro se
  cae con «Algo salió mal».
- Manda `set q:users.list = […]` con personas o, mañana, precios y stock inventados. El celular lo
  muestra como si viniera del servidor, porque ese es el trato (§ 5.3).
- Manda miles de claves inventadas de 256 KB a la bandeja en menos de 10 s: la pestaña del otro se
  queda sin memoria.
- La dirección (`route`) es un valor espejado. Si alguna pantalla la usa en un `href`, un
  `javascript:…` no corre, porque la política de `Caddyfile:44` (`script-src 'self'`) lo bloquea
  (comprobado en el archivo), pero queda en manos de esa línea.

**Qué propongo.**

- `useMirrored(key, initial, schema)`: cada valor declara su esquema de `zod/mini` y lo que no valida
  se descarta y va al diario.
- La dirección se valida contra la tabla del router.
- La bandeja con tope: 64 claves y 1 MB.
- Los valores `q:` aceptados solo de la computadora (punto 1.3).

Cuesta un argumento más en cada uso y un control en `pnpm check` que exija el esquema.

### 10 · `POST /api/device-link/report` escribe en el registro lo que manda el dispositivo (§ 14.2) — Mejora

**Dónde.** `{ attempt, outcome, ice }` (≤ 1 KB) termina en una línea del registro del contenedor. La
forma de `ice:{…}` no está fijada, y `ua` aparece en la línea de ejemplo sin decir de dónde sale.

**Ataque.** Una aplicación modificada, con sesión, manda en `ice` un texto con saltos de línea (para
inventar líneas de registro), un correo o una dirección IP. El diseño promete que no hay datos
personales en esa línea, y eso queda en manos del cliente. Con el límite «por dispositivo» y un
`X-Device-Id` nuevo en cada pedido, solo frena el de la dirección.

**Qué propongo.**

- Un esquema cerrado: `attempt` de 8 hexadecimales, `outcome` de una lista, y `ice` con
  `{host, mdns, pairs}` enteros de 0 a 50 y `state` de la lista de estados de ICE.
- `ua` lo arma el servidor con `deviceCodes` de las dos sesiones, no el cuerpo.
- Que solo lo pueda mandar quien es de un vínculo, con los límites del punto 4.
- Nunca se anota el SDP, ni entero ni en parte.

No cuesta casi nada.

---

## 4. La aplicación en el navegador

### 9 · El diario y la tira, en la computadora compartida (§ 14.1, § 12 `strip.ts`) — Mejora

**Dónde.** § 14.1: «de un parche, solo la clave (`users.selected`), que es código». Pero las claves de
lo que trae el servidor llevan su parámetro: § 5.4 usa `q:users.card:id`, y `useMirrored` arma la clave
«con la pantalla abierta». El diario (`device-link.journal`, 300 entradas) y la tira
(`device-link.strip`) están en `localStorage`, que es del navegador y no de la persona.

**Ataque.** Beto entra en la computadora del mostrador después de Ana y abre las herramientas del
navegador. En `device-link.journal` ve las claves `q:users.card:<id>` con su tiempo: qué fichas de
personas abrió Ana y en qué orden. El diario también viaja con «Algo salió mal» (§ 14.2), así que esos
identificadores salen del dispositivo. Si Beto vincula su celular ese mismo día, la tira que no está
separada por persona le suma los tramos de Ana.

**Qué propongo.**

- El diario guarda la clave hasta el primer `:` del parámetro (`q:users.card`), nunca el parámetro.
- La tira, separada por persona (la clave lleva un hash corto del `userId`) o borrada al cambiar de
  persona, como ya se descarta lo que había a medio hacer.

Es una función de recorte y una prueba.

- Cookies, CSRF y marcos: nada nuevo. Los `POST` llevan `Origin` y JSON (`http.ts:145` a `:148`); el
  canal es un `GET` con `X-Device-Id`, que un sitio ajeno no puede mandar sin la verificación previa
  de CORS, y las cookies son `SameSite=Strict`. `frame-ancestors 'none'` sigue en la aplicación.
- `BroadcastChannel` y el candado de pestañas son del mismo origen: nada.

---

## 5. Datos personales y secretos

- Por el servidor pasan los parches en memoria, sin guardarse (§ 15): está bien. Que tampoco vayan a
  `console.error` si algo falla al reenviar (el `onError` de `http.ts:79` vuelca el error entero): un
  error que lleve el cuerpo filtraría lo espejado al registro. Hay que probarlo con un reenvío que
  falla.
- El diario y la línea del registro: puntos 9 y 10.
- Ningún dato personal a terceros: sin STUN ni TURN, no sale nada. Si Carlos elige el STUN de Google
  (§ 19, punto 5), sí salen a Google las direcciones de cada dispositivo en cada presentación. Esa
  alternativa choca con «ningún dato personal a terceros» y lo dejaría escrito así en § 19.
- Secretos: ninguno nuevo; nada.

---

## 6. Abuso y disponibilidad

### 6 · Los topes por dirección y el tope total del canal (§ 3.3, § 9.2) — Mejora importante

**Dónde.** § 3.3: «3 sin sesión por dirección, 2.000 en total, […] 10 aperturas por minuto por
dirección». § 9.2: los límites «por dispositivo y por dirección».

**Ataque A: bloquear a los de la misma dirección.** Los teléfonos con datos móviles salen a internet
detrás de un NAT del operador y comparten la dirección con muchos desconocidos. En el local, todos los
equipos del Wi-Fi comparten una. Un cliente en el Wi-Fi del local, sin sesión, abre 10 canales anónimos
por minuto (`sign-in.codes`) y agota «10 aperturas por minuto por dirección». Las computadoras del
local no pueden abrir el canal del código de entrada ni del vínculo, y la presentación cae al reintento
con espera. Con datos móviles, alguien desconocido del mismo NAT puede hacer lo mismo sin querer.

**Ataque B: llenar el total.** Los canales anónimos cuentan contra «2.000 en total». Con IPv6, una sola
casa tiene un /64 entero y cada dirección es «otra dirección»: 3 canales por dirección no frenan a
nadie. Llenar 2.000 canales deja a toda la ferretería sin entrada con el celular ni vínculo.

**Qué propongo.**

- Como ya hace `requestSession` con las sesiones conocidas: con sesión, el tope de aperturas va por
  sesión, y el de la dirección solo cuenta a los anónimos.
- Un tope total aparte para los anónimos (por ejemplo, 200) dentro de los 2.000, así nunca le sacan
  lugar a quien tiene sesión.
- Las direcciones IPv6 se cuentan por su /64 (`networkOf` ya existe en `sign-in/codes/network.ts`).

Son unas 10 líneas y tres pruebas.

### 7 · El hub (§ 3.3, § 4.3, § 6) — Mejora

- **«Solo para el otro».** Los dos lados se suscriben a la misma clave `device-link.pairing:<id>`, y
  `publish(clave, evento)` le escribe a todos los oyentes de esa clave. Para que el reenvío vaya solo al
  otro lado (y no vuelva a quien lo mandó ni a la pestaña reemplazada), propongo claves por lado:
  `…:<id>:phone` y `…:<id>:computer`. Así el filtro no depende de que cada lado ignore lo propio.
- **Al terminar un vínculo,** el hub suelta todas las suscripciones de su clave y les manda `closed`.
  Hoy solo cierra por sesión. Si a un celular le desvinculan con su sesión abierta y su aplicación no
  se da de baja (modificada), sigue suscripto a una clave muerta. Hoy no recibe nada porque nadie
  publica, pero no conviene que dependa de eso.
- **El canal anónimo que suma temas con sesión.** Un canal abierto sin sesión, la pantalla de entrada,
  no tiene que poder sumar temas con sesión por `POST /subscriptions` después de entrar. Si pudiera,
  quedaría atado a la cookie de pantalla y no a la sesión, y cerrar la sesión no lo cerraría. El dueño
  del canal (la sesión o la pantalla) se fija al abrirlo. Al cerrar la pantalla (`claim`), se cierra
  el canal, como hace hoy `screens.close`.
- **El oyente lento.** Un celular con mala señal no lee su canal y Node acumula lo escrito en memoria.
  Si lo que espera escribirse en un canal pasa de un tope (por ejemplo, 256 KB), el hub lo cierra con
  `closed {reason:'slow'}`. Con el reenvío de 1 MB por minuto, sin ese tope, unos pocos celulares
  lentos llenan la memoria del servidor.
- **La tabla de topes** sigue sin cubrir por cuántos canales escucha un mismo vínculo. Con «4 por
  sesión» alcanza.

Cada cosa son pocas líneas y una prueba.

---

## 7. Sin conexión

- El espejo directo sin internet (R3.4) no tiene cómo comprobar con el servidor quién está del otro
  lado. Con el punto 1.1, lo que se reconecta sin internet vale solo si la última confirmación del
  vínculo es reciente. Si no, se espera a que vuelva.
- E36 (el celular que entró sin conexión) está bien resuelto: sin sesión confirmada no hay
  `codes/read` (§ 9.3).
- La hora: la tira usa la hora del servidor y el diario un cronómetro, así que no hay nada que
  falsear.

---

## 8. Auditoría

- Lo que pide R8 está. Falta, del punto 5, la persona dueña del código en `device-link.rejected` con
  `other-account`.
- Con los puntos 1 y 2, propongo sumar `device-link.rejected` con `reason:'pairing-ended'` cuando el
  servidor rechaza una escritura de un vínculo que ya terminó (punto 1.4), una vez por ventana. Es el
  único rastro de que un dispositivo cortado intentó algo.
- `recordOnce` por clave: que la clave sea la sesión, no algo que elija el dispositivo (punto 4).
- No se puede borrar ni falsear: va al SQLite que solo recibe filas (ADR-004). Nada más.

---

## 9. El despliegue

- No se abre ningún puerto: WebRTC va de navegador a navegador, sin STUN ni TURN, y el servidor no
  escucha UDP. Caddy no cambia. Nada.
- `Caddyfile:54`: `request_body max_size 64KB`, igual que `bodyLimitBytes`. El reenvío de un valor de
  hasta 256 KB (§ 5.2) no entra por el servidor y da 413 de Caddy. No es de seguridad, pero el
  tope de lo que se espeja por el servidor tiene que ser menor que 64 KB, o el reenvío se parte.
- Cómo se entera la máquina de una versión nueva: este módulo no lo toca. Nada.

### 11 · Lo que se ve de la red local (§ 4.2, § 15) — Mejora

**Dónde.** § 4.2 y § 15: «WebRTC no expone direcciones: sin STUN, no hay dirección pública; la local
va escondida con mDNS».

**No es así en todos los casos.** Chrome esconde las direcciones con nombres `.local` solo mientras la
página **no** tiene permiso de cámara o micrófono. El celular de Ferrebress tiene permiso de cámara
para leer códigos (`Permissions-Policy camera=(self)`, y la etapa b la usa todo el tiempo). Con ese
permiso, Chrome pone en la oferta las direcciones reales de cada interfaz: la privada del Wi-Fi y,
con datos móviles prendidos, la IPv6 global del operador, que es pública. Esas direcciones pasan por
el servidor (en memoria) y llegan a la computadora. No lo pude comprobar en un celular: es el
comportamiento conocido de Chrome, y conviene que la prueba de campo (tarea 1) lo mire.

**Ataque.** Del lado del servidor no hay un ataque nuevo: ya ve la dirección pública. El riesgo es otro:

- que esas direcciones terminen en el registro (punto 10);
- que una aplicación modificada ponga en su oferta candidatos que apuntan a otros equipos de la red
  (`192.168.0.1 9 typ host`), para que el navegador honesto les mande paquetes de comprobación de ICE.
  Es poco: solo paquetes UDP de STUN, desde el mismo Wi-Fi.

**Qué propongo.**

- Corregir § 15 para que diga lo que pasa con permiso de cámara.
- En `signal`, además de «un solo `m=application`», aceptar solo candidatos `typ host` con nombre
  `.local` o dirección privada (10/8, 172.16/12, 192.168/16, fc00::/7, fe80::/10). Se descarta el
  resto, también las IPv6 globales.
- Escribir que el SDP no se anota nunca.

Es una función de validación y una prueba.

---

## 10. Dependencias

- No se suma ninguna biblioteca: WebRTC, `BroadcastChannel` y Web Locks son del navegador; el QR usa
  la pieza de `sign-in`; el SSE es `hono/streaming`. `pnpm audit --prod` (lo corrí): «No known
  vulnerabilities found».
- Hono 4.13.14 ya tiene el arreglo de CVE-2026-29085 (inyección de campos de SSE con saltos de línea
  en `event`, `id` y `retry`, corregida en 4.12.4). Igual, el hub tiene que usar como `event` solo
  nombres de temas del registro y mandar los datos siempre con `JSON.stringify`, nunca un texto que
  venga del dispositivo.
- La aplicación lee el SSE con `JSON.parse` sin `try` (`platform/server/realtime.ts:118`). Un evento
  mal formado corta la lectura y cae al reintento. Al pasar a `sse.ts`, cada evento se valida con su
  contrato (§ 13.2 ya lo dice).

---

## Los demás puntos

### 12 · `members.ts` con varias copias del servidor (§ 9.2, arquitectura «Escala») — Mejora

La arquitectura nombra tres piezas que cambian con varias copias: sesiones, hub y buzón, y auditoría.
`members.ts` es otro mapa en memoria que decide E38 y E39. Con dos copias, un vínculo terminado en una
sigue valiendo en la otra hasta que se reinicie, y cualquiera de los dos dispositivos sigue
presentándose y reenviando por esa copia. Propongo sumarlo a la lista y a «Con varias copias» de § 3.3:
se invalida con el mismo `LISTEN/NOTIFY`. Hoy, con un proceso, solo queda el instante entre confirmar
la transacción y poner al día la memoria, que es aceptable. Cuesta una línea de documentación hoy.

### 13 · El reemplazo sin preguntar agranda un engaño en la entrada (R1.5, § 9.4) — Mejora

**Ataque.** Un atacante en una computadora del mismo Wi-Fi le muestra a Ana su QR de entrada y la
convence de leerlo y poner la huella. Las defensas de 01 son la misma red y «No soy yo». Si el engaño
sale bien, el atacante ya tiene la sesión de Ana, que es el daño grande. Pero R1.5 suma que el celular
de Ana queda vinculado a la computadora del atacante **sin preguntar**, y su vínculo con la computadora
de verdad termina:

- el celular pasa a espejar la computadora del atacante (manda la computadora, R6.3);
- el atacante ve lo que Ana escribe y abre en su celular, también lo que no se guarda;
- el atacante decide qué pantalla le muestra.

**Qué propongo** (lo decide Carlos, porque es su regla): que tras un reemplazo al entrar, el celular
muestre una vez «Ahora este celular está vinculado a Chrome en Windows», con «Desvincular» a mano. No
pregunta, así que la regla se cumple, y Ana nota algo raro. También sirve que `device-link.replaced`
con `how:'sign-in'` lleve la dirección de las dos computadoras. Es un aviso más del celular.

### 14 · El espejo mantiene viva la sesión de la computadora desatendida (§ 5.3) — Mejora

Los pedidos que la computadora hace por el espejo cuentan como uso de su sesión. Si Ana se va y deja
la computadora con su sesión abierta, mientras use el celular en espejo la computadora no vence por
falta de uso (solo a las 8 horas). Quien se siente ahí ve lo que Ana ve en el celular. Es coherente con
«son una sola aplicación en dos pantallas», pero conviene escribirlo en § 15 como riesgo aceptado, o
que Carlos elija que el espejo no cuente como uso de la computadora (la cabecera del punto 1.4 permite
distinguirlo). No cuesta nada escribirlo.

---

## Lo que no pude comprobar

- Que Chrome en Android ponga direcciones reales en la oferta con el permiso de cámara dado (punto 11):
  es el comportamiento documentado de Chrome, pero no lo probé en un celular. Tampoco qué hace Safari
  en iPhone sin permiso: puede no dar ningún candidato y nunca lograr el directo.
- Si el proxy de la máquina (fuera de Ferrebress) corta conexiones quietas antes de los 40 s del
  latido, o si habla IPv6 hacia afuera (punto 6, ataque B).
- Si el NAT del operador del celular del local comparte la dirección con otros (punto 6, ataque A).
  Lo doy como probable en Argentina, no comprobado.
- Todo lo de los puntos 1 a 3 sale de leer el diseño: no hay código del módulo.

## Una prueba por riesgo (para el paso 6)

Cada una intenta el ataque y tiene que fallar:

| Punto | Prueba |
|---|---|
| 1 | Vínculo terminado con el canal de datos conservado (transporte de mentira): llega `resume` del otro y la computadora no manda `snap` hasta que `GET /api/device-link` confirme; con el vínculo terminado, no manda nada |
| 1 | Una respuesta con `s=device-link` nueva no se reenvía por el espejo |
| 1 | El celular con `query-timeout` pide él y el resultado no viaja a la computadora |
| 1 | Un `POST` con `X-Ferrebress-Pairing` de un vínculo terminado da `409 pairing-ended` y no escribe |
| 2 | Reloj falso: el celular en directo sin pedidos 61 minutos; el próximo pedido de la computadora por el espejo trae la señal y la computadora no reenvía; ídem con 8 horas y con la sesión cerrada desde Usuarios |
| 3 | La sesión de la computadora vence, entra otra persona en la misma pestaña: el par de mentira no recibe ningún parche ni foto, y los valores recibidos del otro vuelven al inicial |
| 3 | Salir cierra en el servidor los canales de esa sesión (`onEnded` con `sign-out`) |
| 4 | Cada ruta con `X-Device-Id` de otro dispositivo de la misma persona responde por el de la sesión; `/api/start` sin sesión con el dispositivo de la computadora no trae `pairing` |
| 4 | El tema `device-link.pairing:<id de otro vínculo>` se rechaza aunque quien pide tenga su propio vínculo |
| 5 | Leer con otra cuenta no gasta el código: después lo lee la persona dueña y vincula |
| 5 | Un boleto usado por otra sesión de la misma persona, o con la sesión de la computadora cerrada, se rechaza |
| 6 | 10 aperturas anónimas desde una dirección no frenan la apertura de una sesión conocida desde esa dirección; los anónimos no pasan su tope total |
| 7 | El reenvío no le llega a quien lo mandó; al terminar un vínculo, el canal suscripto a su clave recibe `closed`; un canal anónimo no puede sumar `device-link.pairing` |
| 7 | Un oyente que no lee se cierra al pasar el tope de lo pendiente |
| 8 | Un valor que no cumple el esquema de su clave, una dirección fuera de la tabla, 65 claves desconocidas o un `q:` que manda el celular se descartan y quedan en el diario |
| 9 | El diario no guarda nada después del primer `:` de una clave; otra persona en la misma computadora no ve la tira de la anterior |
| 10 | `report` con un texto en `ice`, un salto de línea o un campo de más da 400 y no escribe en el registro |
| 11 | `signal` con un candidato con dirección pública o `typ srflx` se rechaza o se limpia |

---

## Cómo se resolvió

Punto por punto, en el [diseño](device-link.md) corregido (paso 5).

- **1 · frena.** La confirmación del vínculo (§ 7): nada se manda ni se aplica por el directo sin una
  confirmación del servidor de menos de 4 minutos, atada a la huella DTLS que registró la sesión del otro
  al presentarse; antes de una foto (también después de `resume` o `hello` por un canal conservado), de
  menos de 30 s. Cierra los ataques A y B. `l=` se lee antes de devolver la respuesta y el espejo se
  retiene (`hold`). Los `q:` solo viajan de la computadora al celular, y lo que pidió el celular no viaja
  (ataque C). Las escrituras llevan `X-Pairing` y el servidor contesta `409 pairing-ended`; un cambio
  que llega del otro nunca dispara un POST. Lo que queda está escrito en § 7.3 y § 16, y a Carlos en § 22,
  puntos 1 y 2. No se tomó el estado «por confirmar»: `hold` hace lo mismo (§ 17).
- **2 · frena.** Las confirmaciones son pedidos de la sesión del celular, con uso: vence a los 60 minutos
  solo si nadie usa el espejo, y entonces el otro recibe `peer: 'gone'` y no manda nada más.
- **3 · frena.** `sessionLost` corre antes que todo desde cualquier estado: `bye`, cierra, deja el tema y
  suelta el espejo; con otra persona, vuelve al valor inicial lo recibido (§ 8.3). `sessions.onEnded`
  avisa todos los motivos, también salir, y el hub calcula `closedReasonOf` en cada latido (§ 3.3).
- **4.** Persona, dispositivo y celular o computadora, siempre de la sesión, en rutas, temas, `members`,
  límites y `recordOnce` (§ 10); `/api/start` solo con sesión.
- **5.** `other-account` y `not-a-phone` no gastan el código, y la auditoría lleva a la dueña; el boleto
  atado a las dos sesiones y a los vínculos a reemplazar (§ 10.3).
- **6.** Topes por sesión para lo que tiene sesión, 200 anónimos dentro de los 2.000, IPv6 por `/64`
  (§ 3.3).
- **7.** Claves por lado; `drop` al terminar un vínculo; el dueño del canal se fija al abrirlo; oyente
  lento cerrado a los 256 KB; nombres de evento del registro y `JSON.stringify` (§ 3.1, § 3.3).
- **8.** Esquema por clave, la dirección contra la tabla del router, la bandeja con 64 claves y 1 MB, `q:`
  solo de la computadora (§ 5.1, § 5.2, § 5.4).
- **9.** El diario guarda la clave hasta el primer `:` y ningún identificador; la tira es de cada persona
  (§ 13, § 15.1).
- **10.** `report` con contrato cerrado, `ua` del servidor, solo desde un vínculo, nunca el SDP (§ 10.2,
  § 15.2); un reenvío que falla no vuelca el cuerpo.
- **11.** § 4.2 y § 16 dicen lo que pasa con permiso de cámara; candidatos filtrados en la aplicación y en
  `signal` (solo `host` con `.local` o dirección privada). La prueba de campo lo mira.
- **12.** `members.ts`, códigos y boletos están en la lista de lo que cambia con varias copias (§ 16,
  arquitectura, ADR-017).
- **13.** El aviso tras un reemplazo al entrar, a Carlos (§ 22, punto 5); `device-link.replaced` con
  `how:'sign-in'` lleva la dirección de las dos computadoras.
- **14.** Escrito como riesgo aceptado y a Carlos (§ 16, § 22 punto 1).
- **El STUN de Google:** Carlos eligió no usarlo.
