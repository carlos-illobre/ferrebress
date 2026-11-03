# Revisión del diseño técnico · 03 · Celular y computadora (`device-link`), etapa a

Revisa [device-link.md](device-link.md), el [ADR-017](../adr/ADR-017-realtime-channel-and-mirror.md) y lo
que ese diseño cambió en el [ADR-002](../adr/ADR-002-one-responsive-app.md), el
[ADR-003](../adr/ADR-003-realtime-connections.md) y la [arquitectura](../architecture.md), contra las
[reglas aprobadas](../../chapters/03-device-link/rules.md), la maqueta aprobada
(`docs/design/mockups/device-link-indicator/final/`), la constitución, los pedidos de Carlos para este
diseño y el código que hay en `src/`.

Cada punto dice dónde está, qué propone el diseño, qué se ve y qué tan grave es: **frena** (hay que
resolverlo antes de presentárselo a Carlos en el paso 5) o **mejora**.

**Lo que frena, en una lista:** 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 6.1, 9.1 y 10.1.

**Lo que se comprobó y está bien:** los 14 gráficos Mermaid se dibujan sin errores (comprobado con
Mermaid 11 en Chromium); el cálculo del latido (90 por hora, unos 8 KB de bajada y 5 KB de subida, unos
100 KB en 8 horas), el del código a la vista (3,6 KB por hora), el de `/api/start` (179 bytes medidos con
un ejemplo), el de la señal en la cabecera (unos 17 bytes) y el 92 % de E26b. La sección «Seguridad»
contesta las cinco preguntas de la constitución. Los patrones fuera de la lista tienen su ADR.

**Lo que no se pudo comprobar:** que la conexión directa con mDNS ande en el Wi-Fi del local (lo
resuelve la tarea 1); que el proxy de la máquina, delante de Caddy, deje pasar el SSE sin juntarlo ni
cortarlo antes de los 40 s del latido; que el navegador hable HTTP/2 con ese proxy (con HTTP/1.1, cuatro
pestañas con canal ocupan cuatro de las seis conexiones); los 2 KB del arranque y los 12 KB de lo que se
baja después; los 900 bytes de cada oferta y respuesta de WebRTC; que Android mantenga el canal de datos
con la pantalla apagada.

---

## 1. Escenarios sin cubrir

### 1.1. El celular espejado no le hace pedidos al servidor, y eso rompe tres reglas · **frena**

- **Dónde:** § 5.3 («pide siempre la computadora»), § 7 (`direct` sin canal), § 3.5 (el buzón).
- **Qué propone:** por la conexión directa, todo lo que se ve lo pide la computadora y el celular no hace
  ningún pedido.
- **Qué se ve:** según 01 · R3.1 y R3.3, la sesión vence a los 60 minutos sin pedidos y mirar una
  pantalla no cuenta como uso. Un celular que se usa una hora solo como espejo pierde la sesión
  mientras se usa: su próximo toque que cambia algo (un POST) da `session-closed` y aparece la entrada
  encima. Por la misma razón el celular no recibe la huella de los permisos (`p=`), así que R6.6 («los
  dos se actualizan con su próximo pedido») no se cumple en él: su menú queda viejo. Tampoco le llegan
  las señales del buzón, así que, si terminan el vínculo desde Usuarios mientras están en «Directo», el
  celular no se entera por el servidor. El diseño no dice nada de ninguna de las tres.
- **Opciones:** (a) que el servidor cuente como uso de la sesión del celular los pedidos de la
  computadora con la que está en espejo (sin bytes de más, pero cambia la letra de 01 · R3.3 y hay que
  preguntarle a Carlos); (b) que la computadora le reenvíe al celular por el canal de datos lo que
  trae la cabecera de cada respuesta (la huella de permisos, las señales del buzón del celular, que el
  servidor podría poner en la respuesta de la computadora) y que el celular haga un pedido mínimo
  cada tanto para no vencer (gasta datos y es un temporizador: lo aprueba Carlos). Hay que sumarlo a
  § 19.

### 1.2. Lo que cambia según el dispositivo no se puede espejar tal cual · **frena**

- **Dónde:** § 5.1 y § 5.3; tarea 7.
- **Qué propone:** lo elegido y lo que trajo el servidor son valores con nombre iguales en los dos, y lo
  pide siempre la computadora.
- **Qué se ve en el código:** hay pantallas cuyo estado o cuyo pedido dependen del ancho, por regla:
  - Auditoría pide de a 20 en la computadora y de a 10 en lo angosto (`audit-log/state.ts`, 05 · R4.3). Si
    la clave es la misma, el celular muestra 20 renglones; si la clave lleva el tamaño, la del celular nunca
    llega desde la computadora, el celular espera 3 s y la pide él (`query-timeout` en cada página). E31
    (abrir Auditoría en el espejo) cae justo ahí.
  - Usuarios elige sola a la primera persona solo en la computadora (`users/state.ts`, «en lo angosto la
    tarjeta tapa la lista, así que no se abre sola»). Con `users.selected` espejado, el celular abre la
    tarjeta encima de la lista apenas la computadora entra a Usuarios.
  - El manual tiene contenido por dispositivo (`useManual(device, narrow)`).
- **Opciones:** (a) cada valor con nombre declara su forma de espejarse (una estrategia por clave: «se
  reenvía», «cada uno pide lo suyo con los mismos filtros», «no se espeja porque es del ancho»), que es
  lo que ya decía el diseño de la auditoría («en el espejo viajan solo el filtro o la página: el otro
  pide con su sesión»); (b) las pantallas separan lo que depende del ancho y no lo guardan en valores con
  nombre. En los dos casos, la tarea 7 tiene que listar, pantalla por pantalla, qué se espeja y cómo.

### 1.3. E07 y E08: el celular que hace entrar a la computadora no queda escuchando · **frena**

- **Dónde:** § 9.4.
- **Qué propone:** «la próxima respuesta [del celular] trae `s=device-link:1` → `GET /api/device-link`».
- **Qué se ve:** el celular termina su parte con `approve`, antes de que la computadora haga `claim`. La
  señal recién existe después, y le llega al celular en su *próximo* pedido, que puede no llegar nunca
  (en E08 el celular puede estar en «Directo» con la computadora anterior, sin pedir nada). La
  computadora nueva pasa a `meeting`, escucha el tema y queda «Esperando al celular». E07 dice
  «quedan vinculados» y el celular no se entera. Pasa lo mismo, en general, con cualquier presentación
  en la que el otro no escucha: el diseño no dice que el servidor deje una señal en el buzón del otro
  cuando uno empieza a escuchar el tema del vínculo (E10 con la recomendación C de § 19.1).
- **Opciones:** que la respuesta de `approve` diga «vas a quedar vinculado a esta computadora» y el celular
  escuche el tema del vínculo unos segundos; o que el celular, después de aprobar, escuche el tema hasta
  que la computadora entre o pase el plazo del permiso (30 s).

### 1.4. «Sin internet» (R3.4, E21) no se puede detectar como está escrito · **frena**

- **Dónde:** § 7 (eventos `internetLost` e `internetBack`), § 7.1.
- **Qué propone:** pasar a `offline` cuando se pierde la conexión directa sin internet, y a `meeting`
  con `internetBack`.
- **Qué se ve:** el diseño no dice de dónde salen esos eventos. Lo que hay en el código es `canReach()`,
  que mira `navigator.onLine`, y `online` de `api.ts`, que se pone al día solo con pedidos. En el caso de
  E20 y E21 (el Wi-Fi sigue, se corta internet) `navigator.onLine` sigue diciendo que hay red y el
  evento `online` nunca llega: la máquina iría a `waiting` («Esperando…» en vez de «Sin internet»), el
  canal fallaría tres veces y quedaría esperando un aviso del navegador que no viene. «Y cuando vuelve
  internet, se encuentran solos» necesita volver a probar cada tanto, que es un temporizador que toca la
  red (00 · R4.3) y tiene que ir a `mobile-data.md` con la aprobación de Carlos, como `useReconnect`.
- **Opciones:** definir «hay internet» como el resultado del último intento de llegar al servidor (el de
  `api.ts`), probar al perder la directa, y reusar `useReconnect` (2, 4, 8, 16, 32 s y cada minuto, con la
  pantalla a la vista) para volver a encontrarse; o que vuelvan a encontrarse solo con un toque o con el
  próximo pedido (cambia E21). Sumarlo a § 19.

### 1.5. La máquina de estados no cubre estados que las reglas piden · **frena**

- **Dónde:** § 7, § 7.1 y el tipo `LinkState`.
- **Qué se ve:**
  - **Reemplazar estando vinculado (E05, E06, E08).** Solo existe `unpaired → meeting` con `paired`. Un
    celular en `direct` con la computadora A que lee el código de B, o una computadora en `direct` con
    un celular que muestra su código y lo lee otro celular, no tiene transición: hay que cerrar el
    transporte con A (con `bye {why:'replaced'}`, así A pasa a «Sin vincular» al instante, como pide E05) y
    presentarse con B.
  - **Lo que dice el servidor a mitad de camino.** `loaded` (de `/api/start` o de la señal) está solo como
    evento inicial. La señal del buzón, la respuesta de `GET /api/device-link` y el rechazo
    `403 not-paired` al suscribirse (E39) pueden llegar en cualquier estado; falta un evento único, por
    ejemplo `serverSaid(pairing | none)`, con su fila en cada estado.
  - **`hidden` deja «el mismo» estado** después de cerrar el transporte y el canal: un `direct` sin
    transporte, que es justo la combinación que el tipo dice que no se puede escribir. Hace falta un
    estado (o volver a `waiting`).
  - **Probar la conexión directa.** La tabla pasa a `meeting` con `probing`, pero ese tipo no tiene dónde
    guardar el transporte por el servidor que sigue andando, y el indicador diría «Esperando…» mientras
    la maqueta muestra «Por el servidor» con la espera en el botón a los 300 ms. Mejor `relayed` con
    `probe: 'trying'`.
  - **`peerGone('handover')`** (§ 6, la pestaña que deja de espejar) no está entre los motivos
    (`hidden`, `signout`, `lost`).
  - **«Reconectar» desde una pausa que venía de «Por el servidor» (E29).** § 7.2 cierra todo; el otro no
    escucha nada, así que se entera en su próximo pedido. E29 solo anda si se había conservado el canal
    de datos.
  - **El fin de la sesión propia** (salir, vencer, `sessionClosed`): «sin sesión, el módulo no corre», pero
    antes de dejar de correr tiene que mandar `bye {why:'signout'}`; no está en la tabla.
- **Además:** el gráfico de § 7 y la tabla de § 7.1 no dicen lo mismo (punto 9.1).

### 1.6. La foto y los parches pueden dejar a los dos con valores distintos · **frena**

- **Dónde:** § 5.2.
- **Qué propone:** parches LWW con reloj de Lamport; la foto de la computadora reemplaza todo en el celular,
  sin mirar los relojes.
- **Qué se ve:** un parche que el celular mandó antes de recibir la foto llega a la computadora
  después de que ella la mandó. La computadora lo aplica (su reloj es mayor que el de los valores de la
  foto, sobre todo si la computadora se recargó y su reloj volvió a cero) y el celular ya lo pisó con
  la foto: quedan distintos y nadie lo corrige. La simulación de § 17 lo encontraría, pero el diseño
  tiene que decir la regla.
- **Opción:** que el `hello` del celular lleve su reloj más alto y que la computadora, antes de la foto,
  suba el suyo por encima y marque cada valor de la foto con ese reloj. Así la foto es un parche más:
  los parches viejos del celular pierden en los dos lados y la regla queda una sola.

### 1.7. Lo demás de los escenarios · mejora

- **La cámara del celular y las tostadas** de la maqueta («Vinculados: fuiste a la pantalla de la
  compu», «Desconectados…», «Ahora van directo por el Wi-Fi») no están en la tabla de § 12. La cámara ya
  existe en `sign-in` (`scanner.ts`, `Camera`): falta decir que se reusa y qué pasa si «Leer el código»
  lee el QR de la entrada (`/link#`) o si «Escanear» de la entrada lee uno de vincular (`/pair#`). La
  dirección `/pair` tampoco tiene tarea en `App.tsx`, que hoy atiende `/link`.
- **E01 a E09, E12, E13, E15 a E20, E25 a E28, E30 a E42:** cada uno tiene ruta, tabla, evento o pantalla
  que lo cumple, salvo lo dicho arriba.
- **E14:** el evento `sessions.revoked` tiene que llevar los dispositivos de las sesiones cerradas; hoy
  `closeSessions` devuelve solo los identificadores.

---

## 2. Performance

### 2.1. Las metas de bytes están cortas, justo donde Carlos va a decidir · **frena**

- **Dónde:** § 16.1 y § 19 punto 6 (lo que va a `mobile-data.md` con su aprobación).
- **Qué se ve:**
  - **«Por el servidor», cada cambio: 370 bytes.** Cuenta el POST y el evento de vuelta, pero no la
    respuesta del POST (sus cabeceras, con `X-Ferrebress`, que cambia en cada respuesta porque lleva la
    hora) ni los 60 a 90 bytes de TCP y TLS de cada paquete, que sí cuenta para el latido. Son al menos
    tres paquetes más sus avisos: más cerca de 700 a 800 bytes por cambio, y unos 500 KB por hora con un
    toque cada 5 s en vez de 270 KB.
  - **«Escribir "tornillo" no manda ocho pedidos» no se cumple:** se juntan los mensajes de 50 ms y una
    persona teclea una letra cada 150 a 250 ms, así que cada letra sale en su propio POST. Para lo
    escrito, juntar durante los 150 ms que ya espera la búsqueda (00 · R7.4) sí lo junta.
  - **Presentarse: 4 KB entre los dos.** No suma la conexión segura nueva, que el mismo diseño estima en 4 a
    5 KB y que es lo normal cuando el celular vuelve después de unos minutos con la pantalla apagada
    (`mobile-data.md`). En el celular son unos 7 KB por encuentro. Y no hay cuenta por día: con la
    pantalla del celular apagándose decenas de veces por día (E22), es el costo más grande del módulo y
    no aparece. Conviene una fila «un día típico» con los supuestos.
  - **El diario: 300 entradas de 40 bytes, 12 KB.** La entrada de ejemplo de § 14.1 pesa 100 bytes en
    JSON: son unos 30 KB.
  - **«Con el canal abierto, el latido se paga solo»** (§ 3.2) vale solo si de todos modos iba a haber
    pedidos; esperando sin tocar nada, el latido es costo puro.

### 2.2. El reenvío por el servidor no acepta lo que el espejo manda · **frena**

- **Dónde:** § 4.3, § 5.2 y § 9.2.
- **Qué propone:** `relay` acepta hasta 64 KB (es el tope de todo cuerpo, `platformSettings.bodyLimitBytes`),
  un valor espejado puede pesar hasta 256 KB y la foto lleva «todo lo vivo».
- **Qué se ve:** una foto o un valor de más de 64 KB no pasa por el servidor, y el diseño no dice qué
  pasa entonces. Tampoco dice si la foto por el servidor lleva los `q:` (con la recomendación de § 19
  punto 2 no deberían). Por el canal de datos, un mensaje de 256 KB en un canal ordenado frena a los
  parches que vienen detrás, que dejan de cumplir los 50 ms.
- **Opción:** un solo tope para los dos transportes (64 KB), la foto por el servidor sin lo que trajo el
  servidor, y lo más grande que eso partido en páginas, como ya dice el diseño para las listas.

### 2.3. Consultas por pedido · mejora

- `codes/read` sin nada que reemplazar devuelve «el vínculo ya hecho», así que además de leer, crea: no es
  1 consulta, son 2 en una transacción (más la auditoría).
- `codes/accept` dice 3 consultas y nombra 2.
- El resto de la tabla de § 16.3 cierra: el hub, `signal` y `relay` sin consultas, `members.ts` en memoria,
  `mirrored_at` en lote.

### 2.4. Índices · mejora

- El índice sobre `mirrored_at` sobra: lo usa una vez por día un trabajo sobre una tabla de, a lo sumo,
  unos cientos de filas. La constitución pide índices para las búsquedas frecuentes.
- `members.ts` tiene que guardar también el «no tiene vínculo», o cada `/api/start` de un dispositivo sin
  vínculo consulta la base.

### 2.5. El diario y la tira escriben en `localStorage` en cada evento · mejora

- **Dónde:** § 14.1.
- **Qué se ve:** reescribir unos 30 KB de JSON en `localStorage` (síncrono) en cada evento de la máquina,
  en la notebook vieja, compite con los 50 ms de R6.5 si los parches pasan por la máquina. Juntar en
  memoria y escribir al ocultarse la pestaña, o cada pocos segundos, alcanza para «sobrevive a
  recargar».

### 2.6. Otros datos · mejora

- Con `update` por el servidor viaja `{t:'stale'}` y el otro vuelve a pedir *toda* la lista (Usuarios pide
  la lista entera al abrir): cada cambio en una persona le cuesta al celular la lista de nuevo.
- El ejemplo de § 5.3 (`GET /api/users?q=torn`) no existe: Usuarios pide la lista una vez y busca en el
  dispositivo. Los números de ese gráfico no muestran un caso real.
- El `ping` cada 2 s con el detalle abierto es un temporizador que toca la red del local (no internet).
  Se puede medir la latencia con los parches que ya viajan, como hace el reenvío.

---

## 3. Simpleza

### 3.1. La lista de transportes no es un punto de extensión de verdad · mejora

- **Dónde:** § 4.1 y § 13.1 («sumar una forma es una fábrica más en la lista»).
- **Qué se ve:** los estados de la máquina están tipados por `kind` (`direct`, `relayed`), el indicador y
  la tira tienen un estado por transporte y las reglas (R4.1) los nombran. Un tercer transporte toca la
  máquina, el indicador, la tira y las reglas. La interfaz `Transport` sí sirve (deja probar con uno
  de mentira); `TransportFactory`, `available()` y la lista ordenada no sacan acoplamiento: la elección no
  es «el primero que ande» sino «directo, y si falla, por el servidor», que decide la máquina. Se puede
  decirlo así y sacar la lista.

### 3.2. El buzón podría ser una huella, como la de los permisos · mejora

- **Dónde:** § 3.5.
- **Qué propone:** una señal con versión por persona, dispositivo y tema, en memoria, que se borra con
  `?seen=`, con topes de 16 y 10.000, y que se pierde al reiniciar.
- **Qué se ve:** para el vínculo alcanza con una huella corta del vínculo de ese dispositivo (id y pausa)
  en `X-Ferrebress`, calculada de `members.ts`, igual que `p=` para los permisos: no guarda nada,
  sobrevive a un reinicio (con el buzón, un vínculo terminado justo antes de un reinicio no se avisa
  nunca a quien está en «Directo») y no necesita borrarse. Cuesta unos 12 bytes en cada respuesta de un
  dispositivo vinculado. El buzón general queda para los temas que lo necesiten de verdad; hoy no hay
  otro.

### 3.3. El control de `useState` «por nombre» es frágil · mejora

- **Dónde:** § 5.1.
- **Qué se ve:** decidir por el nombre de la variable si un `useState` guarda «algo de lo que va» no es un
  control confiable. Lo simple y comprobable es lo inverso: en las pantallas no hay `useState` sin un
  comentario `// local:` que diga por qué.

### 3.4. La máquina guarda objetos vivos · mejora

- **Dónde:** § 7 (`transport: Transport & {kind:'direct'}` dentro del estado) y § 14.1 («se puede volver a
  correr»).
- **Qué se ve:** un estado con un objeto que tiene métodos no se puede guardar ni volver a correr desde el
  diario. Además, el diario no guarda los datos de los eventos (vínculos, mensajes), así que volver a
  correr da el camino aproximado, no reproduce el error. Si el estado guarda solo el `kind` y el
  `attempt`, y `runtime.ts` guarda el transporte, la máquina queda pura de verdad y el diario alcanza.

### 3.5. Nombres · mejora

- `rules/end` (§ 2.1) y `rules/ends.ts` (§ 10.1) nombran lo mismo dos veces.
- El patrón «`QueryRunner` (pide acá / espera la del otro)» de § 13.3 no aparece en ningún otro lado.
- El glosario dice `pairingIndicator`; el diseño, `screens/Indicator`. «Vínculo» es `pairing` en el
  glosario y `LinkState` en la máquina.
- Las claves de § 5.1 son `<módulo>.<pantalla>.<cosa>`, pero los ejemplos usan `users.selected` y
  `q:users.card:id`.
- `tabs.ts` dice depender de `BroadcastChannel` y de Web Locks; el candado con `steal` ya le avisa a la
  pestaña que lo pierde.

---

## 4. Repetición

- **Mejora: los códigos de 60 s.** `rotating-codes` es «la misma pieza que da los códigos de la
  entrada», pero los de la entrada tienen más: solo vale el último, leerlo lo reserva, la rotación se
  detiene mientras está reservado y vuelve si se cancela (`screens.ts`). La interfaz `start`, `take`,
  `stop` no lo cubre; hay que decir qué queda en `sign-in` y qué pasa a la pieza común, para que la
  entrada no cambie.
- **Mejora: el QR y la cámara.** `screens/Code` usa `qr-draw.ts` de `sign-in` por su fachada. Dibujar y
  leer un QR es tecnología sin negocio: va en `platform/camera` (la arquitectura ya lo nombra) y la
  usan los dos. Hoy `device-link` dependería de `sign-in` solo para eso.
- **Mejora: volver a probar la red.** Lo de 1.4 tiene que reusar `useReconnect`, no armar otro.
- El canal reusa el lector con `fetch` y los pasos comunes de las rutas (`readBody`, `limit`,
  `recordOnce`); `members.ts` reusa `createGuardedMemory`; el trabajo diario puede usar el `Schedule` de
  `app.ts`. Bien.

---

## 5. Seguridad

La sección contesta las cinco preguntas. Falta lo siguiente (el revisor de seguridad lo mira aparte):

- **Mejora alta: qué dispositivo se usa.** `deviceId` llega en una cabecera que elige el dispositivo; la
  sesión tiene el suyo. El diseño no dice cuál usa `members.ts` ni las rutas. Tiene que ser el de la
  sesión.
- **Mejora alta: la respuesta llega al celular cortado antes que la señal.** § 15 dice que el celular
  perdido no recibe nada nuevo porque «ese pedido trae la señal». Pero `useMirroredQuery` reenvía la
  respuesta en cuanto llega y la señal recién dispara un `GET /api/device-link`: la respuesta de ese
  pedido ya viajó. `api.ts` tiene que leer las señales del vínculo antes de devolver la respuesta, y el
  espejo dejar de mandar hasta saber el vínculo.
- **Mejora: el hub autoriza solo al suscribirse.** Si a alguien le sacan `audit.view` o termina un vínculo,
  sus suscripciones siguen. Falta decir que el hub vuelve a autorizar con `users.permissions-changed` y que
  terminar un vínculo cierra las suscripciones de su clave.
- **Mejora: `report`.** Lo que manda el dispositivo va al registro del contenedor: el diseño tiene que
  decir que el contrato de `ice` es cerrado (números y estados de una lista) y que el navegador y el
  sistema los pone el servidor.
- **Mejora: direcciones en la oferta.** «WebRTC no expone direcciones» depende de que el navegador use
  mDNS. El servidor ya valida la oferta: puede rechazar candidatos con una dirección escrita.
- **Mejora: un canal anónimo que pasa a tener sesión.** La computadora que entra con el código tiene un
  canal abierto con la cookie de la pantalla, que `claim` borra. Falta decir que ese canal se cierra y
  se abre otro con la sesión.

---

## 6. Fronteras

### 6.1. El código común depende de `device-link` · **frena**

- **Dónde:** § 2.2 y § 4.
- **Qué se ve:** `platform/peer/wire.ts` valida con «el contrato `device-link`», la interfaz `Transport`
  usa `WireMessage`, que es de ese contrato, y `platform/peer/relayed.ts` manda a
  `/api/device-link/relay` y escucha el tema `device-link.pairing`. Es `platform/` conociendo un módulo,
  que la arquitectura prohíbe y `pnpm capas` controla. Lo mismo, en chico, con `mirror/query.ts`, que
  decide que «pide la computadora» (R6.3, una regla) adentro del código común. Contradice además el
  «las tres capas no saben que existe» de § 1 y el pedido de Carlos de que el mecanismo sea
  reutilizable.
- **Opción:** el transporte lleva mensajes que no conoce (texto o `Json`) y el esquema lo da quien lo usa;
  `relayed` recibe la ruta y el tema al crearse; el espejo recibe «quién manda» de `device-link`.

### 6.2. Otras · mejora

- **Si un tema rechaza, no se abre ningún tema** (§ 3.3): un vínculo terminado deja sin el código de entrada o
  sin la auditoría que se actualiza sola a la misma pestaña. Es acoplamiento entre temas que no se
  conocen; mejor abrir el canal y avisar el rechazo de ese tema solo.
- **`/api/start` tipado:** con `start.contribute(nombre, …)` el tipo de la respuesta de `sign-in` no sabe
  qué trae `pairing`. Se puede completar como `ServerEvents`, con una interfaz que cada módulo amplía.
- **Dos lugares deciden qué pestaña espeja** (§ 6): la aplicación con el candado y el servidor con «la
  última que se suscribió». Si solo se suscribe la que tiene el candado, decide uno solo, como dice
  § 13.2.
- **Dos lugares deciden que la directa falló** (§ 4.4): cada lado mide sus 5 s, y uno puede abrir el canal
  de datos justo cuando el otro se rindió. Que decida la computadora y el celular siga lo que ella mande.
- **Lo compartido de la tarea 9** (`src/shared/contracts/device-link.ts`, `src/shared/audit-log/device-link.ts`)
  no está marcado **[común]**, aunque la constitución dice que cambiar `src/shared/` tiene dueño.

---

## 7. Sin conexión, hora y escala

- **Sin conexión:** el módulo no atiende clientes ni proveedores; no guarda nada para trabajar sin
  conexión y lo dice (§ 11). Bien.
- **Hora:** `created_at`, `mirrored_at`, el vencimiento y el código usan el reloj del servidor; la tira usa la
  hora del servidor; el diario y el reloj de Lamport, cronómetro. Bien.
- **Mejora: escala.**
  - Con varias copias, `publish` pasa por `LISTEN/NOTIFY`, pero un aviso de PostgreSQL lleva como mucho
    8.000 bytes y el reenvío manda hasta 64 KB (y la oferta hasta 8 KB): «el reenvío funciona igual» (ADR-017,
    «Consecuencias») no es cierto. Lo mismo, `members.ts`, los códigos, los boletos de reemplazar y
    `mirrored_at` en memoria tampoco sirven con varias copias, y la arquitectura nombra solo el hub y el
    buzón.
  - Los topes por dirección (10 aperturas del canal por minuto; el reenvío «por dispositivo y por
    dirección») cuentan juntos a todo el local, que sale a internet por una sola dirección. Con 100
    personas y cada celular abriendo el canal al volver a la vista, se llega. Para lo que tiene sesión, el
    tope va por sesión o por dispositivo.

---

## 8. Mejoras y lo que pidió Carlos

- **Reutilizable:** el canal con temas, `useTopic` y el ejemplo de T118 lo cumplen bien. Lo que lo impide
  hoy es 6.1 (el transporte y el reenvío atados a `device-link`) y el rechazo de todos los temas por uno
  (6.2).
- **Ahorro de datos:** las ideas son buenas (nada de fondo, el celular no pide en «Directo», el directo sin
  STUN), pero las cuentas tienen que cerrar (2.1) y falta la cuenta por día.
- **Legible, documentado y con patrones donde corresponde:** el mapa, las tablas por pieza y la máquina con
  estados tipados están muy bien. Sobran la lista de transportes (3.1) y el control por nombre (3.3).
- **Robusto y abierto/cerrado:** los temas, la tabla de fines (`rules/ends.ts`) y el mapa de manejadores de
  mensajes son puntos de extensión de verdad. Lo frágil está en la máquina (1.5), en la foto (1.6) y en
  las decisiones que se toman en dos lugares (6.2).
- **La dirección como valor espejado · mejora alta.** `router.ts` no es un valor común: lleva el historial
  (`pushState`, `popstate`), la guarda de lo que no se guardó (`guardNavigation`), `history.state` y el `#`
  (donde viajan los códigos de entrada). El diseño no dice si la dirección que llega del otro entra al
  historial, qué hace «Atrás» en cada uno, qué pasa si el que recibe tiene algo sin guardar, ni que el
  `#` no se espeja.
- **Lo que sale de la cobertura · mejora.** `peer/direct.ts` tiene lógica (los plazos de 5 s, la regla de
  `disconnected`, el `ping`). Separar lo que habla con `RTCPeerConnection` en un adaptador mínimo deja el
  resto con pruebas unitarias, como pide ADR-005.

---

## 9. Los gráficos

Los 14 se dibujan sin errores. No coinciden con el texto en:

### 9.1. La máquina de estados · **frena** (va con 1.5)

- El gráfico pasa de `relayed` a `direct` con `probeSucceeded`; la tabla, por `meeting` con `probing`.
- El gráfico pausa solo desde `direct`, `relayed` y `waiting`; la tabla, desde «cualquiera con vínculo».
- `paused → meeting` con `resume`, pero § 7.2 dice que, con el canal de datos conservado, la computadora
  manda la foto en el acto, sin presentarse.
- No están `hidden` ni `visible`, que la tabla tiene.

### 9.2. Los demás · mejora

- **§ 2.2:** la flecha `MACH --> RUN` dice que la máquina depende del que ejecuta, y la tabla dice que no
  depende de nada. `TR --> DIR` y `TR --> REL` van al revés (las variantes dependen de la interfaz).
  Faltan `RUN --> DEM` y `RUN --> API` (la tabla los nombra) y `Q --> MS`.
- **§ 2.1:** `sign-in.phone-approved` sale de `codes/` (el `claim`), no de `sessions/`; falta `DLM --> DLD`.
- **§ 4.4:** el celular recibe `{present:true, side:'computer'}` sin `attempt`, y el texto dice que es «el
  mismo en los dos».
- **§ 6:** «CE suscribe… (Esperando)» necesita `peerGone('handover')`, que no existe (1.5).
- **§ 18:** el texto dice que la 8 depende del contrato de la 9, y el gráfico no tiene esa flecha. «Se
  pueden hacer a la vez 7, 8 y 9» contradice esa dependencia.

---

## 10. Las tareas y la reconstrucción

### 10.1. Quedan documentos que dicen lo contrario y no hay tarea que los cambie · **frena**

La constitución pide que, leyendo solo `docs/`, salga lo mismo. Después de este diseño:

- `audit-log.md` dice «las acciones con nombre (teclado y, con el 03, el espejo)… el otro dispositivo pide
  con su sesión y su permiso, nunca recibe el contenido». El diseño nuevo hace lo contrario.
- `sign-in.md` describe `GET /api/realtime/sign-in-codes` y su canal propio, y dice que «las acciones con
  nombre llegan con el módulo 03».
- `modules/README.md`, punto 7, pide «las acciones con nombre» en cada diseño, y `architecture.md` sigue
  diciendo que `state.ts` tiene «acciones con nombre». El glosario tiene «Acción».
- `architecture.md`, «Los datos», lista lo que se guarda en `localStorage`; no están la tira ni el diario.
- ADR-005 tiene la lista corta de lo que queda fuera de la cobertura; no están `direct.ts` ni el candado
  de `tabs.ts`.

Hace falta una tarea (o sumarlo a la 5, la 7 y la 2) que deje esos documentos al día.

### 10.2. Otras tareas que faltan o no cierran · mejora

- **Tarea 1, la prueba de campo** («sin código de la aplicación»): para presentarse por el servidor de pruebas
  necesita un servidor que pase la oferta y la respuesta, que recién existe con la 3 y la 9. Opciones:
  pasarlas a mano entre los dos con un QR, o una ruta de prueba aparte que no queda.
- **Tarea 5:** «las pruebas de 01 siguen pasando sin cambios» no es posible: `channels.test.ts`,
  `edges.test.ts`, `screen-channel.ts`, `codes.test.ts` y `entrance.test.tsx` usan la ruta
  `/api/realtime/sign-in-codes`, que desaparece. Las pruebas cambian porque cambia el diseño, con los
  mismos escenarios; hay que decirlo así, para que no parezca que se cambian para que pase el código.
- **Sin tarea:** el comando de `tools/` que vuelve a correr un diario (§ 14.1); sumar el diario al aviso
  de «Algo salió mal» (`frame`, otro módulo); la dirección `/pair` en `App.tsx`; reusar la cámara de
  `sign-in`.
- **Las de punta a punta:** CLAUDE.md pide justificarle a Carlos cada una antes de escribirla. Además, en
  Docker los nombres `.local` de mDNS pueden no resolverse: E01 «Directo» puede necesitar una opción de
  Chromium que deje ver las direcciones locales, y eso hay que decirlo. E34 (menos de 50 ms) medido en la
  máquina de las pruebas no dice nada de la notebook vieja.

### 10.3. § 19, lo que decide Carlos · mejora

Faltan 1.1 (el celular que no pide nada: la sesión, los permisos y las señales), 1.2 (lo que cambia
según el ancho), 1.4 (cómo se vuelven a encontrar después de un corte de internet) y la cuenta de datos
por día (2.1). Las ocho que están, bien planteadas, con su recomendación y sus números.
