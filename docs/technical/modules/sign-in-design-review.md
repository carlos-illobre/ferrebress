# Revisión del diseño técnico · 01 · Entrar (`sign-in`)

Revisión independiente del [diseño](sign-in.md) (constitución, paso 4), hecha solo con los
documentos: la constitución, los capítulos [00](../../chapters/00-app/rules.md) y
[01](../../chapters/01-sign-in/rules.md), la [arquitectura](../architecture.md), los ADR 001 a 015,
el [plan](../../project/roadmap.md), el [glosario](../../project/glossary.md) y las maquetas aprobadas
(`docs/design/mockups/sign-in/adapted/` y `docs/design/mockups/app-frame/final/`). Como es el primer
módulo, también reviso la base: el repositorio, las plataformas, las pruebas, `pnpm check` y el
despliegue.

Cada punto dice dónde está, qué propone el diseño, qué veo y qué tan grave es:

- **Frena:** hay que resolverlo antes de que Carlos lo apruebe.
- **Mejora:** conviene hacerlo, pero no frena.

## Resumen

El diseño está bien armado: cubre casi todo el capítulo 01, cuenta las consultas, deja en memoria
lo que dura poco y nombra lo que no escalaría. Lo que frena está casi todo en **la entrada a la
computadora con el celular**: el código se ata al minuto del reloj (en el borde de cada minuto no
alcanza el tiempo), lo calcula el reloj de la computadora (en contra del principio VI) y el permiso
de un uso viaja por un canal al que se puede suscribir cualquiera que vea el QR. Además frenan:
la huella no revisa si la persona está dada de baja (E03) ni exige la verificación del usuario;
faltan los límites y las herramientas de `pnpm check`, que el plan (T003) pone en este diseño; la
aplicación no tiene cómo saber el ambiente (R10, E37) ni cómo decirle al servidor su versión
(R5.5); hay un ciclo entre `users` y `sign-in`; y el despliegue en la VM del proyecto anterior
choca por el puerto 443. Hay también dos ADR que contradicen las reglas (ADR-006 y la prueba de lo
hecho sin conexión del ADR-015).

| # | Punto | Gravedad |
|---|---|---|
| 1.1 | El código QR vale «solo en su minuto»: en el borde, o con el celular sin sesión (E15, E16), no alcanza | Frena |
| 1.2 | El celular sin sesión: una huella en la maqueta, dos en el diseño (E16, R2.7) | Frena |
| 1.3 | La huella no revisa si la persona está dada de baja (E03) | Frena |
| 1.4 | La computadora no muestra «Leído · Esperando la huella», que está en la maqueta | Frena |
| 1.5 | «Mostrar el código de nuevo» a los 10 minutos: pantalla y regla nuevas | Frena |
| 1.6 | La aplicación no sabe en qué ambiente está antes de entrar (R10, E37, E02b) | Frena |
| 1.7 | `update-required` sin saber la versión de la aplicación (00 · R5.5, E31) | Frena |
| 1.8 | E25 y E26 no se pueden probar sin un módulo con algo a medio hacer | Mejora |
| 1.9 | El servidor decide «nunca se le ofreció», pero el dato está en el dispositivo (E08) | Mejora |
| 1.10 | E09 sin código de error; E02 sin decir que el error lleva el correo | Mejora |
| 1.11 | Salir sin conexión: la cookie vieja sigue en el navegador | Mejora importante |
| 1.12 | Reglas del 00 que el diseño dice cubrir sin decir cómo (R3, R4.4, R9) | Mejora |
| 1.13 | Cómo se prueban E11, E13, E17 y E38 | Mejora |
| 1.14 | E29 a E33 pasan al módulo 15: bien señalado, pero las pruebas los siguen nombrando | Mejora |
| 2.1 | Las consultas de cada pedido no cierran con el resto del diseño | Mejora |
| 2.2 | La meta de 120 KB no alcanza con las imágenes de la maqueta | Mejora importante |
| 2.3 | El service worker puede bajar toda la aplicación en la primera visita | Mejora importante |
| 2.4 | `EventSource` se reconecta solo: pedidos a ritmo fijo (E18) | Mejora importante |
| 2.5 | Faltan metas: entrar con la huella, con el QR, la comprobación de la sesión | Mejora |
| 2.6 | La consulta de la ciudad, en cada semilla | Mejora |
| 3.1 | El código que se calcula en la computadora con HMAC: se resuelve con menos | Mejora (arregla 1.1 y 5.3) |
| 3.2 | `SESSION_SECRET` no firma nada que haga falta firmar | Mejora |
| 3.3 | El estado de la sesión en la cabecera, además del error | Mejora |
| 3.4 | `frame` no tiene capítulo con ese nombre | Mejora |
| 4.1 | El cálculo del código, en los dos lados | Mejora |
| 5.1 | El permiso de un uso lo puede tomar quien vea el QR | Frena |
| 5.2 | La huella sin `userVerification: required` ni credencial descubrible | Frena |
| 5.3 | El código depende del reloj de la computadora | Frena |
| 5.4 | «Que el contador suba» deja afuera las huellas de Google | Frena |
| 5.5 | Cómo se encuentra la semilla de un código y cuánto mide | Mejora importante |
| 5.6 | La dirección de internet y el dispositivo: de dónde salen | Mejora importante |
| 5.7 | Pedidos sin sesión sin límite: semillas, canales y la consulta de la ciudad | Mejora importante |
| 5.8 | Falta `frame-ancestors`: la entrada se puede meter en una página falsa | Mejora importante |
| 5.9 | La cookie sin duración: el celular vuelve a pedir la huella cada vez que se cierra | Mejora importante |
| 5.10 | El pase de Google se puede repetir dentro de su hora | Mejora |
| 5.11 | Vincular una huella con una sesión robada da acceso que no vence | Mejora |
| 5.12 | Las huellas de Google se sincronizan a otros dispositivos | Mejora (avisar a Carlos) |
| 5.13 | Bloquear una cuenta ajena con 20 intentos de huella falsos | Mejora |
| 5.14 | La auditoría: rechazos que faltan y quién es una cuenta no autorizada | Mejora |
| 5.15 | La cuenta se ata al correo y no al identificador de Google | Mejora |
| 6.1 | Ciclo entre `users` y `sign-in` al dar de baja | Frena |
| 6.2 | `platform/session` y la regla de los dos tiempos | Frena |
| 6.3 | `GET /api/realtime/:topic` genérico: quién autoriza cada tema | Mejora importante |
| 7.1 | ADR-015: lo hecho sin conexión se prueba con el hash de un pase que JavaScript no puede leer | Mejora importante (cierra la puerta al módulo 15) |
| 7.2 | Sesiones cerradas: se guardan, pero el ADR-015 y el principio V dicen que se borran | Mejora |
| 7.3 | Lo que se guarda en el dispositivo sin trabajo sin conexión | Mejora |
| 8.x | Mejoras de fondo (código por el canal, ventana del código atada a la lectura, despliegue antes) | Mejora |
| 9.1 | Los límites y las herramientas de `pnpm check` no están | Frena |
| 9.2 | El `.env` está incompleto para que el código de pruebas y producción sea el mismo | Frena |
| 9.3 | La misma VM que el proyecto anterior: dos Caddy en el 443 | Frena |
| 9.4 | Los certificados de Caddy y la auditoría, sin volumen | Mejora importante |
| 9.5 | Las migraciones y la vuelta atrás del despliegue | Mejora importante |
| 9.6 | Docker sin privilegios y el puerto 443 | Mejora |
| 9.7 | Bibliotecas que el diseño no nombra | Mejora |
| 9.8 | ADR-006 contradice las reglas aprobadas | Frena (es solo documento) |
| 9.9 | La arquitectura y el glosario quedan desactualizados | Mejora |
| 9.10 | Las tareas: pruebas primero y el despliegue antes | Mejora |

---

## 1. Escenarios sin cubrir

Recorrí E01 a E44 del 01 y los escenarios del 00 de las reglas que el diseño dice construir (R1,
R2, R3, R4, R5, R7, R9, R10). Están cubiertos, con ruta, tabla o pieza: E01, E02, E04 a E07, E10,
E12, E14, E17, E19 a E24, E27, E28, E28b, E34, E35, E37 (salvo 1.6), E39 a E44 (salvo los puntos de
seguridad). Los que no, o a medias:

**1.1 · El código vale «solo en su minuto» (§ 5, QR; E13, E15, E16) — Frena.**
El diseño calcula el código como HMAC de la semilla con el minuto y lo acepta «solo en su minuto».
Un celular que lee el código en el segundo 58 tiene 2 segundos para el `GET`, mostrar la
computadora y la ciudad, que la persona lea y ponga la huella, y el `approve`: no llega. Con el
celular sin sesión (E16) es peor: primero entra con Google o con la huella, y recién después
aprueba; eso tarda más de un minuto con facilidad. La regla dice «se renueva cada 60 segundos»,
no «vale hasta el fin del minuto del reloj». Hace falta decir qué pasa entre leer y aprobar: lo
natural es que **leerlo lo reserve** (el `GET` lo marca como leído, ya nadie más lo puede leer, y
la aprobación tiene su propio plazo, por ejemplo 2 minutos, o 5 si el celular tiene que entrar
antes). Ver también 3.1 y 8.1.

**1.2 · El celular sin sesión: una huella o dos (§ 5, «Celular sin sesión»; R2.7, E16) — Frena.**
La maqueta aprobada muestra, en el celular sin sesión, «Escanear el código de la computadora ·
Para entrar en los dos de una vez», y una sola hoja con una sola huella que termina en «La
computadora entró… Este celular también». El diseño dice que el celular entra y «sigue con el
mismo código», y `approve` pide sesión y huella: son dos huellas (o Google más una huella). Además,
el diseño no nombra el botón «Escanear» de la entrada del celular ni el lector de la cámara en la
entrada (solo dice que la dirección del QR abre la aplicación). Hay que decir: (a) las dos formas
de llegar al código (la cámara del sistema, que abre la dirección, y «Escanear» en la entrada);
(b) si con la huella alcanza una sola firma para entrar el celular y aprobar la computadora (se
puede: el `approve` sin sesión que verifica la huella y crea las dos sesiones); (c) qué pasa si el
celular entra con Google, que no es una huella: ¿pide la huella después para aprobar, o el ingreso
con Google aprueba solo? La regla R2.5 dice que la confirmación es la huella; si se entra con
Google, hace falta decidir con Carlos si alcanza.

**1.3 · La huella no revisa si la persona está activa (§ 5, «Entrar» con la huella; E03) — Frena.**
El flujo de la huella verifica firma, desafío, origen y contador, pero no dice que busque a la
persona y rechace con `not-authorized` si fue dada de baja. E03 pide justo eso, «con Google o con
la huella». Lo mismo vale para `approve` y para la entrada con Bluetooth.

**1.4 · «Leído · Esperando la huella» en la computadora (§ 5, diagrama; maqueta de la entrada) — Frena.**
La maqueta aprobada tiene un estado del QR en la computadora: «Leído · Esperando la huella»,
cuando el celular leyó el código y todavía no puso la huella. El diagrama solo manda por el canal
el permiso final. Falta el aviso `read` por el SSE cuando llega el `GET /api/sign-in/codes/:code`
(y la vuelta al QR si el celular cancela con «No soy yo, cancelar», que tampoco tiene ruta).

**1.5 · El canal se cierra a los 10 minutos, «con un botón Mostrar el código de nuevo» (§ 5) — Frena.**
Ni la regla ni la maqueta tienen ese botón ni ese estado. Es un cambio de interfaz: o se lo
muestra a Carlos (paso 2), o se lo saca. Una opción sin pantalla nueva: al vencer el tiempo
máximo, la entrada sigue igual y pide una semilla nueva recién cuando la pestaña vuelve a estar
a la vista o la persona toca algo.

**1.6 · El ambiente, antes de entrar (§ 9 y § 10; 00 · R1.3, R10.1; E37, E02b, E51, E52) — Frena.**
`ENVIRONMENT` está en el `.env` del servidor, y la aplicación es una sola imagen para los dos
ambientes. El marco magenta tiene que estar en «toda pantalla», también en la entrada, antes de
tener sesión, y el menú tiene que saber si muestra «Pronto». El diseño no dice cómo se entera la
aplicación: hace falta que viaje en la cabecera de toda respuesta (también las sin sesión) o en
una ruta sin sesión que la entrada pide al abrir. Si es la cabecera, la entrada necesita al menos
un pedido al abrir: decir cuál (hoy, `GET /api/me` sin sesión, que contesta `401` con la
cabecera).

**1.7 · `update-required` (§ 4, errores; 00 · R5.5, E31) — Frena.**
El servidor manda su versión en `X-Ferrebress`, pero ningún pedido le dice al servidor qué versión
tiene la aplicación. Sin eso, el servidor no puede contestar «ya no te entiendo». Falta: la
cabecera de la versión de la aplicación en cada pedido y la regla de cuándo es incompatible (por
ejemplo, una versión mínima de contrato que sube cuando cambia un contrato de forma incompatible).

**1.8 · E25 y E26 (§ 5, «Al volver a entrar») — Mejora.**
«Si es otra, se vacía lo que estaba a medio hacer»: hoy no hay nada a medio hacer y no hay una
pieza que lo haga. Hace falta decir el mecanismo (por ejemplo, la acción `session.userChanged` en
`platform/actions`, que cada módulo escucha para vaciar su estado) y cómo se prueba ahora (con un
módulo de prueba que tiene un estado) o que esas pruebas llegan con Ventas. Sin eso, la prueba
`sign-in-E25` no tiene qué mirar.

**1.9 · «Nunca se le ofreció» (§ 5, Google, paso 5, y «La huella en el celular»; E08) — Mejora.**
El paso 5 dice que el servidor responde `offerPasskey: true` si el dispositivo «nunca se le
ofreció», pero el dato se guarda en el dispositivo. O la aplicación manda ese dato al entrar, o
el servidor solo dice «es un celular sin huella vinculada» y la aplicación decide si ofrece. Lo
segundo es más simple.

**1.10 · Errores que faltan (§ 4) — Mejora.**
E09 («no puede hasta que se quite el vínculo anterior») no tiene código de error
(`device-already-linked`) ni texto. `not-authorized` tiene que llevar el correo para el mensaje de
R1.3. También faltan los errores de la huella inválida y del desafío vencido (E43).

**1.11 · Salir sin conexión (§ 6; R5.2, E36) — Mejora importante.**
La cookie queda en el navegador hasta que el servidor la borra. Si alguien recarga la página con
conexión antes de que se mande «salir de la sesión X», `GET /api/me` con la cookie vieja vuelve a
entrar. Hay que decir: (a) que la aplicación, al arrancar y antes de cualquier otro pedido, manda
primero el `sign-out` pendiente; (b) cómo viaja (`POST /api/sign-out` con el identificador de la
sesión, que sirve aunque la cookie ya sea de otra persona); (c) que entrar con otra cuenta en ese
dispositivo también cierra la sesión anotada.

**1.12 · Reglas del 00 sin el cómo (§ 1, § 9) — Mejora.**
El diseño dice que construye R3, R4 y R9, pero no dice: cómo se elige el texto largo o corto
(¿los dos en el HTML y el CSS muestra uno, o la lógica mira el ancho?; ADR-002 pide que no se mire
el ancho en la lógica); cómo se pone gris «lo que no puede andar» (R4.4, E24, E26); cómo se saca la
captura de «Algo salió mal» (R9.4: ¿una biblioteca?, eso pide ADR si pesa) y dónde se guarda el
aviso mientras no existe el módulo 12 (R9.2: ¿en el dispositivo?, ¿en el servidor?).

**1.13 · Cómo se prueban los que dependen de terceros (§ 11) — Mejora.**
E11 (Google pide elegir la cuenta) no se puede probar con el emisor de prueba: lo hace Google.
Además, no pude comprobar que `disableAutoSelect()` alcance con el botón personalizado de Google
(«Continuar como…»), que podría entrar con la cuenta mostrada sin abrir el selector; conviene
probarlo a mano en el ambiente de pruebas y, si no alcanza, decidir otra forma. E13 y E17 dependen
del autenticador y de Bluetooth, y E38 («se ve como su maqueta») no dice cómo se compara
(¿capturas contra las de la maqueta?, ¿a ojo de Carlos en el paso 8?). Conviene una tabla: cada
escenario, en qué nivel se prueba (unitaria, punta a punta o a mano) y con qué.

**1.14 · E29 a E33 (§ 1 y § 11) — Mejora.**
Bien que el diseño lo marque «a confirmar por Carlos»: mover escenarios de capítulo es un cambio
de regla. Pero § 11 dice «cada escenario E01 a E44», que incluye esos cinco. Ver también 7.1: lo
que se decida tiene que dejar la sesión lista para la prueba del pase.

## 2. Performance

Cuento las consultas de cada pedido importante con lo que dice el diseño:

| Pedido | Consultas según el diseño | Lo que cuento |
|---|---|---|
| Cualquiera con sesión en memoria | 0 | 0, si la persona (nombre y rol) también está en memoria; si no, 1 |
| El primero después de reiniciar | — | 1 (sesión con su persona, en una sola consulta) |
| Entrar con Google | hasta 3 | buscar la cuenta, crear la sesión, y en el celular ver si tiene huella vinculada; si el nombre cambió, actualizarlo: hasta 4 |
| Entrar con la huella | hasta 4 | la huella con su persona (una consulta), el contador y último uso, crear la sesión: 3 |
| Vincular la huella | — | 1 (insertar; el índice único resuelve E09) |
| Aprobar un código | — | 2 (la huella con su persona, el contador) |
| Cambiar el permiso por la sesión | — | 1 |
| Salir | — | 1 |
| La tanda del último uso | 1 por minuto | 1, si se escribe en una sola sentencia (`UPDATE … FROM (VALUES …)`) |

**2.1 · Las cuentas no cierran (§ 3 y § 11) — Mejora.**
§ 3 dice que el primer Administrador se crea al arrancar; § 11 cuenta «la primera vez, crear el
Administrador» dentro de entrar con Google. Además, al arrancar no se sabe el nombre (lo da Google
al entrar), así que la primera entrada actualiza el nombre: otra consulta. Y falta la consulta de
la huella vinculada para `offerPasskey`. Conviene fijar las metas con la tabla de arriba y una
prueba de cuántas consultas por cada fila.

**2.2 · 120 KB para la entrada (§ 13) — Mejora importante.**
Solo las imágenes y la letra de la maqueta aprobada suman unos 220 KB en la computadora: el fondo
(55 KB), el logotipo sobre oscuro (37 KB), la foto del celular (43 KB), el logotipo sobre claro
(46 KB) y las dos letras Manrope (40 KB). Tal cual, la meta no se cumple. Hay que decir si las
imágenes cuentan y cómo se achican (el logotipo en SVG, que ya está el isotipo; el fondo y la foto
en AVIF o WebP más chicos; la foto del celular, solo en la computadora). La meta tiene que medirse
en la prueba, separando código e imágenes.

**2.3 · El service worker (§ 9, «La versión nueva») — Mejora importante.**
`vite-plugin-pwa` con Workbox, por omisión, guarda de entrada todos los archivos de la aplicación
en la primera visita. Eso contradice «cada módulo se baja recién cuando se abre» (constitución
XII.2) y la meta de lo que baja la entrada. Hay que decir qué guarda el service worker al instalar
(la cáscara y la entrada) y qué guarda recién cuando se usa.

**2.4 · `EventSource` se reconecta solo (§ 5, «El canal temporal»; E18) — Mejora importante.**
Si el servidor cierra el canal (por el tiempo máximo o un reinicio), `EventSource` vuelve a
conectarse solo cada pocos segundos, sin fin: son pedidos a ritmo fijo. Hay que decir que el
servidor manda un aviso de fin y la aplicación cierra el canal, y que los reintentos ante un corte
tienen un tope y una espera que crece.

**2.5 · Metas que faltan (§ 13) — Mejora.**
Hay meta para entrar con Google, pero no para: entrar con la huella; entrar a la computadora desde
que se pone la huella hasta que la computadora entra (la maqueta muestra menos de 2 s; propondría
menos de 1 s); el tiempo que agrega la comprobación de la sesión a cada pedido; la memoria de las
sesiones, semillas y desafíos guardados.

**2.6 · La ciudad en cada semilla (§ 5 y § 7) — Mejora.**
Se consulta un servicio externo cada vez que se abre la entrada de la computadora, aunque nadie
lea el código. Alcanza con consultarla cuando un celular lee el código (`GET …/codes/:code`), y
guardarla en memoria por dirección. Son muchas menos consultas, y la entrada no espera a un
tercero. Ver 5.7.

## 3. Simpleza

**3.1 · El código calculado en la computadora (§ 5, «El código cambia cada 60 segundos sin ir a la red») — Mejora.**
El diseño evita pedidos a ritmo fijo calculando el código con HMAC en la computadora. Pero la
computadora ya tiene un canal SSE abierto mientras el QR está a la vista, y un aviso del servidor
por ese canal no es un pedido de la computadora: el servidor puede **mandar el código nuevo por el
canal cada 60 segundos**. Así se van la semilla, el HMAC en los dos lados, la dependencia del
reloj de la computadora (5.3), el problema de buscar la semilla de un código (5.5) y la pregunta
de qué es «su minuto» (1.1): el servidor guarda un solo código vigente por pantalla y lo
reemplaza. Lo que cuesta: unos bytes por minuto por el canal abierto, que ya está abierto. Lo
que gana: menos piezas y cero criptografía en el navegador.

**3.2 · `SESSION_SECRET` (§ 10 y § 12) — Mejora.**
«Firma de las semillas QR»: las semillas viven en la memoria del servidor y no salen firmadas a
ningún lado que vuelva sin pasar por la memoria. Si no hay nada que firmar, es un secreto que
sobra. Si es para el HMAC, entonces no es una firma de las semillas: decirlo bien. Con 3.1, no
hace falta.

**3.3 · El estado de la sesión, en la cabecera y en el error (§ 4) — Mejora.**
La sesión vencida o cerrada ya responde `session-closed` con su motivo. Que además viaje «si
cambió» en `X-Ferrebress` son dos caminos para lo mismo. Alcanza con el error. Lo que sí tiene que
decir el diseño es la forma de la cabecera (¿JSON?, ¿varias cabeceras?) y en qué respuestas va
(¿también en `401` y en los archivos de Caddy?).

**3.4 · `frame` (§ 2) — Mejora.**
La constitución pide que un módulo tenga el mismo nombre en el capítulo, el servidor y la
aplicación. El marco es del capítulo 00, cuyo módulo se llama `app` en el plan. O se llama
`app/modules/app/` (feo), o el marco va en `app/ui/` o `app/platform/` y se dice por qué es una
excepción. Lo importante es que el nombre sirva de índice: quien busca el capítulo 00 en el código
tiene que encontrarlo.

**Lo demás:** las tres formas de `platform/realtime` están justificadas por el ADR-003, pero hoy se
usa una (`temporary`) y una cabecera; conviene no construir la interfaz de estrategia hasta que
haya una segunda forma con código. No encontré capas ni archivos de más en el resto.

## 4. Repetición

**4.1 · El cálculo del código en los dos lados (§ 5) — Mejora.**
Si se mantiene el HMAC, la computadora y el servidor hacen la misma cuenta: tiene que estar una
sola vez en `src/shared/` (constitución XII.3), y el diseño no lo dice. Con 3.1, desaparece.

No hay otros módulos todavía, así que no hay lógica de otro módulo que se repita.

## 5. Seguridad

Recorrí cada punto de § 12. Datos que toca, quién puede cada cosa y secretos están contestados;
lo que entra de afuera y la auditoría, a medias.

**5.1 · El permiso de un uso (§ 5, QR, y § 4, `GET /api/realtime/:topic` «según el tema») — Frena.**
El permiso viaja por el canal `sign-in:<id>` y se cambia por la sesión con `claim`, sin sesión. El
diseño dice que «solo sirve para que la propia computadora pida su cookie», pero no dice cómo se
asegura. Si el `id` está en el QR (hace falta para encontrar la semilla, ver 5.5), cualquiera que
vea el QR (alguien en el local, una cámara, quien lo fotografía) puede suscribirse al canal,
recibir el permiso y cambiarlo por la sesión antes que la computadora. Hace falta atar el canal y
el `claim` a la computadora que pidió el código: por ejemplo, la respuesta de `POST
/api/sign-in/codes` pone una cookie `HttpOnly` de un solo uso (o devuelve un secreto que nunca va en
el QR), y tanto el canal como el `claim` la exigen.

**5.2 · Cómo se pide la huella (§ 5, «La huella en el celular»; R2.2, E07, E13) — Frena.**
El diseño no dice `userVerification: "required"` al crear ni al usar la huella. Con el valor por
omisión («preferred»), un autenticador puede firmar con solo la presencia, sin huella. Para entrar
sin nombre de usuario y para la entrada por Bluetooth (R2.6) también hace falta
`residentKey: "required"` (credencial descubrible). Y el servidor tiene que rechazar una respuesta
sin la marca de verificación (UV). Va en el diseño porque es la regla «se pone la huella».

**5.3 · El reloj de la computadora (§ 5, QR) — Frena.**
«Calcula cada código como un HMAC de la semilla con el minuto»: si es el minuto del reloj de la
computadora, una notebook vieja con la hora corrida muestra códigos que el servidor rechaza. El
principio VI dice que el reloj del dispositivo solo se usa como cronómetro. Si se mantiene el
HMAC, la cuenta tiene que salir de `platform/clock` (hora del servidor más cronómetro) y el servidor
tiene que aceptar el minuto anterior. Con 3.1 no hace falta.

**5.4 · «Que el contador suba» (§ 5 y § 12) — Frena.**
Las huellas de Google Password Manager (lo que usa el celular Android del local) devuelven siempre
el contador en 0. Aplicado al pie de la letra, nadie entra con la huella. La regla es: si el
guardado y el recibido son 0, no se mira; solo es señal de clonado si los dos son distintos de
cero y el nuevo no es mayor. `@simplewebauthn/server` ya lo hace así; el diseño tiene que decirlo
igual.

**5.5 · El formato del código (§ 5) — Mejora importante.**
El diseño no dice qué lleva el QR ni cuánto mide el código. Si el código es solo
`HMAC(semilla, minuto)`, el servidor tiene que probar todas las semillas vivas para saber de cuál
es: un bucle por cada lectura. El QR tiene que llevar la dirección completa con el identificador
de la pantalla y un código largo (128 bits o más, no 6 cifras). Y el código va en la ruta
(`/codes/:code`), que queda en los registros de Caddy: mejor en el cuerpo.

**5.6 · De dónde salen la dirección de internet y el dispositivo (§ 3, § 7 y § 8) — Mejora importante.**
Los límites de intentos, la ciudad y la auditoría usan la dirección de internet, pero detrás de
Caddy el servidor ve la de Caddy. Hay que decir que se toma la cabecera que pone Caddy, que Caddy
pisa la que mande el navegador, y que el servidor solo la acepta de Caddy. Y el límite «por
dispositivo» (R2.9) se apoya en un identificador que guarda el navegador: quien quiera, lo cambia
en cada intento. Conviene contar por dispositivo **y** por dirección de internet. Falta también
decir cómo viaja el identificador del dispositivo antes de entrar (¿cabecera?, ¿cuerpo?) y que al
vincular la huella se toma el de la sesión, no el del cuerpo.

**5.7 · Pedidos sin sesión sin límite (§ 4) — Mejora importante.**
`POST /api/sign-in/codes` y `GET /api/realtime/:topic` no tienen sesión ni límite. Cualquiera puede
pedir semillas sin fin (memoria del servidor por 10 minutos cada una), abrir canales sin fin, y,
con la opción A de la ciudad, hacer que el servidor consulte a un tercero en cada pedido y gaste
su cupo. Hace falta un límite por dirección y un tope de semillas y canales vivos.

**5.8 · Meter la entrada en una página falsa (§ 12, cabeceras de Caddy) — Mejora importante.**
El riesgo que la regla quiere notar (R2.5: «un código copiado desde una página falsa») es más fácil
si la página falsa puede mostrar la entrada verdadera dentro de un marco. Falta
`Content-Security-Policy: frame-ancestors 'none'` (y, por si acaso, `X-Frame-Options: DENY`).
También conviene listar la política entera, porque Google pide varios orígenes
(`accounts.google.com` en `script-src`, `frame-src`, `connect-src` y `style-src`), y una
`Permissions-Policy` que permita la cámara y la huella solo al propio origen.

**5.9 · La cookie sin duración (§ 4) — Mejora importante.**
No dice `Max-Age`. Sin él, es una cookie de sesión del navegador: en el celular, al cerrar la
aplicación o al reiniciarlo, se pierde y hay que volver a poner la huella aunque no hayan pasado
los 60 minutos. Propongo `Max-Age` igual al tope de 8 horas. Mejora menor: el prefijo `__Host-`
(pide `Path=/`), que evita que otro subdominio la pise.

**5.10 · Repetir el pase de Google (§ 5, Google) — Mejora.**
Un pase de Google vale una hora. Quien lo copie (de un registro, de una extensión) lo puede mandar
a `POST /api/sign-in/google` y crear una sesión. El botón de Google acepta un `nonce`: que el
servidor lo dé al abrir la entrada y lo compruebe en el pase, y que cada `nonce` sirva una vez.

**5.11 · Vincular una huella (§ 4, `POST /api/passkeys`; § 12) — Mejora.**
Con solo una sesión abierta se puede vincular una huella. Una sesión robada dura como mucho 8
horas, pero una huella vinculada por el ladrón dura hasta que alguien la quite. Propongo que
vincular pida haber entrado con Google hace pocos minutos en esa misma sesión (el momento de la
oferta) y, desde Configuración (módulo 04), volver a pasar por Google.

**5.12 · Las huellas se sincronizan (§ 3, `passkeys.device_id`; R2.3, R2.4) — Mejora, avisar a Carlos.**
Las huellas de Google Password Manager se copian a los otros dispositivos de la misma cuenta de
Google, también a Chrome en la computadora. El servidor no ve en qué aparato se usó: el
`device_id` de la tabla dice dónde se creó, no dónde se usa. En la práctica, una computadora con
Chrome conectado a esa cuenta de Google puede entrar con «su» huella, y «un celular, una cuenta»
se cumple solo mientras el navegador guarde su identificador. No pude comprobar cómo se ve en el
equipo del local. Conviene decírselo a Carlos y anotar qué garantiza y qué no.

**5.13 · Bloquear una cuenta ajena (§ 7; R2.10) — Mejora.**
Si un intento fallido de huella cuenta para la cuenta dueña de la credencial, alguien con el
identificador de la credencial puede mandar 20 firmas falsas y dejar a esa persona una hora
afuera. Conviene que el límite por cuenta cuente lo que demuestra algo de esa cuenta (un pase de
Google válido de una cuenta no autorizada, una firma que no verifica para una credencial que existe)
y decir qué cuenta como «fallido».

**5.14 · La auditoría (§ 8; E44) — Mejora.**
E44 pide «cualquier intento rechazado»: faltan los códigos vencidos, usados o de otra pantalla
(`code.rejected`), el `claim` rechazado, la vinculación rechazada (E09) y salir sin conexión que
llega tarde (con la hora en que se tocó y la hora en que llegó). Y una cuenta no autorizada no
tiene persona: el ADR-004 guarda la persona como entero; hace falta decir dónde va el correo.

**5.15 · Atar la cuenta al correo (§ 3, `users.users`) — Mejora.**
El correo de una cuenta de Google puede cambiar o, en dominios propios, pasar a otra persona.
Guardar el identificador de Google (`sub`) en la primera entrada y comparar por él después cierra
esa puerta. El correo sigue siendo lo que autoriza el Administrador.

## 6. Fronteras

**6.1 · `users` y `sign-in` (§ 2) — Frena.**
`sign-in` usa la fachada de `users` (buscar por correo). Cuando el módulo 02 dé de baja a alguien,
sus sesiones se cierran (R3.1, `closed_reason = deactivated`): si `users` llama a la fachada de
`sign-in`, es un ciclo. Hay que fijarlo ahora: `users` publica `user.deactivated` y `sign-in` lo
escucha (constitución XII, eventos dentro del proceso), o `users` depende de `sign-in` y no al
revés. Lo mismo para «cerrar a distancia» del 02.

**6.2 · Dónde vive la comprobación de la sesión (§ 2 y § 5, «La sesión») — Frena.**
La lista de `platform/` del servidor tiene `session`, pero la tabla está en el esquema de
`sign-in`, y los dos tiempos (60 minutos y 8 horas) son una regla del negocio (ADR-015: «en el
archivo de reglas»). `platform/` no puede importar negocio. Hay que decir qué hace cada parte: por
ejemplo, `platform/http` tiene un punto para enchufar «quién es», `sign-in` lo registra con su
regla y su memoria, y los demás módulos leen la persona del contexto del pedido sin importar
`sign-in`.

**6.3 · El canal genérico (§ 4) — Mejora importante.**
`GET /api/realtime/:topic` con «según el tema»: el diseño no dice quién decide si se puede
escuchar un tema. Cada módulo que declara un tema tiene que declarar también su permiso, y la
plataforma rechaza un tema sin dueño. Ver 5.1.

**Lo demás:** las direcciones `routes → rules → data` y la fachada están bien planteadas.

## 7. Sin conexión, hora y escala

Este módulo no atiende clientes ni proveedores, pero define la sesión de la que depende el trabajo
sin conexión.

**7.1 · La prueba de lo hecho sin conexión (ADR-015, «Lo hecho sin conexión»; R4.3, E31, E32) — Mejora importante.**
El ADR-015 dice que lo hecho sin conexión se guarda «junto con la huella del pase de quien lo
hizo». Pero el pase está en una cookie `HttpOnly` (E41): la aplicación no lo puede leer, así que no
puede calcular su huella. Y la huella del pase es lo que está en la base: tenerla no prueba nada.
Si esto no se decide ahora, el módulo 15 va a tener que cambiar la sesión. Opciones: (a) al entrar,
el servidor da además una llave de la sesión que la aplicación sí puede leer y con la que firma lo
pendiente, y guarda su huella en `sessions`; (b) lo de la tarea T109, la firma de la huella del
celular, que solo sirve en el celular; (c) los dos. El diseño tiene que dejar la columna o decir
que la agrega el 15 con una migración, y el ADR-015 tiene que corregirse.

**7.2 · Las sesiones cerradas (§ 3, `closed_at` y `closed_reason`) — Mejora.**
El ADR-015 dice que al cerrar una sesión «la borra de la base», y el principio V dice que lo que
deja de valer se borra. El diseño la guarda con su motivo, lo que sirve para E27 («Tu sesión se
cerró desde otro dispositivo») y para R4.3 («su sesión no fue cerrada a mano»). Las dos cosas
están bien, pero hay que decir cuánto se guarda una cerrada y quién la borra; y quién escribe
`closed_at` de las vencidas (si nadie vuelve, nunca se escribe). Y corregir el ADR-015 o el
diseño para que digan lo mismo.

**7.3 · Lo que se guarda en el dispositivo (§ 3 y § 5) — Mejora.**
La arquitectura dice que sin trabajo sin conexión, en el dispositivo «nada», y el principio IV,
que «no guarda nada». El diseño guarda el identificador del dispositivo, «se ofreció una vez» y
«salir pendiente», y el ADR-015, el nombre y el rol. Es razonable, pero hay que escribirlo como
excepción en la arquitectura (lo que no es del negocio y no es secreto) para que nadie lo lea
como una violación.

**La hora:** los límites de la sesión usan el reloj del servidor y la cabecera lleva la hora del
servidor: bien. La única hora del dispositivo es la del código (5.3).

**Escala a 100 personas:** está nombrado lo que no escala (sesiones, desafíos, semillas, intentos
y la central de avisos en memoria; la auditoría con un solo escritor). Agregaría: la memoria de las
sesiones no tiene tope ni limpieza de las vencidas; y los límites de intentos en memoria, con
varias copias, se cuentan por copia.

## 8. Mejoras

**8.1 · El código por el canal (opción para 1.1, 3.1, 4.1, 5.3 y 5.5).**

| Opción | A favor | En contra |
|---|---|---|
| A. HMAC en la computadora (el diseño) | Sin tráfico por el canal | Reloj de la computadora, búsqueda de la semilla, la cuenta en dos lados, el borde del minuto |
| **B. El servidor manda el código por el canal abierto** | Un código vigente por pantalla, cero criptografía en el navegador, la hora es la del servidor | Unos bytes por minuto mientras el QR está a la vista |

Recomiendo la B. En las dos, leer el código lo reserva con su propio plazo (1.1).

**8.2 · El celular que no le llega la confirmación.**
Si la computadora ocultó la pestaña (el canal se cierra) o perdió el canal justo al aprobar, el
celular dice «La computadora entró» y no entró. Propongo que el servidor guarde el permiso en el
tema hasta 30 s para quien se reconecte, y que el celular diga «La computadora entró» recién
cuando la computadora hizo el `claim` (el `approve` puede esperar esa respuesta unos segundos).

**8.3 · La ciudad.** Entre A y B (§ 7), la A con la consulta recién al leer el código (2.6). No pude
comprobar las condiciones de uso de ipwho.is; varios servicios gratuitos de este tipo prohíben el uso
comercial en su capa gratuita, y una ferretería es un comercio. Conviene leerlas antes de
recomendarlo, o considerar uno que lo permita.

**8.4 · El dominio de producción.** Las huellas quedan atadas al dominio (`rpId`). Si producción
usa otro dominio que el de pruebas, es otra base y otras huellas: bien. Pero si después producción
cambia de dominio, todas las huellas dejan de servir. Conviene decidir el dominio de producción
antes de la etapa c.

## 9. La base del sistema

**9.1 · `pnpm check` (§ 15, tarea 1; plan, T003) — Frena.**
El plan dice que los límites y la configuración de `pnpm check` «son parte de su diseño técnico,
que Carlos aprueba antes». El diseño no los tiene: falta el tamaño máximo de archivo y de función,
la complejidad, el umbral de código repetido, y las herramientas que controlan qué importa a qué,
el código repetido, los enlaces de `docs/` y el formato (¿ESLint?, ¿Biome?, ¿Prettier?,
¿dependency-cruiser?). Cada una es una tecnología y, si pesa, necesita ADR.

**9.2 · El `.env` (§ 10) — Frena.**
«El código de las pruebas y el de producción es el mismo; lo que cambia sale del `.env`» (principio
VII). Para que el emisor de prueba de Google funcione con el mismo código, el emisor y la dirección
de las llaves de Google tienen que ser variables del `.env` también en producción; y para las
pruebas de punta a punta, también la dirección del script del botón de Google (que en esas pruebas
no puede ser el de Google). § 10 no las lista. También falta decir que el servidor no arranca si
falta una.

**9.3 · La máquina (§ 16) — Frena.**
«La misma VM del proyecto anterior, un proyecto de compose aparte»: los dos Caddy quieren el puerto
443, y solo uno puede tenerlo. Si se usa la misma máquina, hace falta un solo Caddy para los dos
dominios (y eso toca el otro proyecto) o una máquina nueva. Es una pregunta para Carlos, pero el
diseño tiene que decir la consecuencia.

**9.4 · Los volúmenes (§ 14) — Mejora importante.**
Caddy guarda sus certificados en su carpeta de datos. Si la imagen de Caddy (que lleva la
aplicación adentro) se reemplaza en cada despliegue sin un volumen para esa carpeta, pide un
certificado nuevo cada vez, y Let's Encrypt limita los certificados repetidos por semana. Lo mismo
para la auditoría: el archivo SQLite tiene que estar en un volumen, o se pierde en cada despliegue.

**9.5 · Las migraciones y la vuelta atrás (§ 14) — Mejora importante.**
El diseño no dice cuándo corren las migraciones (¿al arrancar el servidor?). `deploy.sh` vuelve a
la imagen anterior si la nueva no está sana, pero si la nueva ya migró la base, la anterior queda
contra un esquema que no conoce. Hace falta la regla: cada migración es compatible con la versión
anterior del código (primero se agrega, en otra versión se quita).

**9.6 · Docker sin privilegios (ADR-010, § 14) — Mejora.**
Con Docker sin privilegios, un contenedor no puede abrir el 443 sin ajustar la máquina
(`net.ipv4.ip_unprivileged_port_start`); y el servicio de usuario de systemd necesita
`loginctl enable-linger` para arrancar sin que nadie entre. Conviene anotarlo en `deploy/`.

**9.7 · Bibliotecas (§ 5, § 9) — Mejora.**
El diseño usa `jose`, `@simplewebauthn/server` y `@simplewebauthn/browser`, PGlite, Playwright y
ZXing, que están en ADR o son chicas, pero no nombra con qué se dibuja el QR en la computadora, ni
con qué se lee el navegador y el sistema para «Chrome en Windows», ni con qué se saca la captura de
«Algo salió mal». Cada una, con su peso y, si pesa, su ADR.

**9.8 · ADR-006 (decisión, primer y segundo punto) — Frena (es solo documento).**
Dice «el celular entra con la huella… Se habilita desde una computadora… El celular no entra con
Google». Las reglas aprobadas dicen lo contrario: Google también en el celular y la huella ofrecida
después del primer Google (R2.1, R2.2). Las reglas mandan, pero un ADR que las contradice confunde
al que programa. Hay que reescribirlo con la tarea «Documentos del proyecto».

**9.9 · La arquitectura y el glosario — Mejora.**
La lista de `app/platform/` del diseño (con `actions` y `device`, sin `storage`, `offline` ni
`camera`) no coincide con la de la arquitectura; `closed_reason = remote` no usa la palabra del
glosario (`revoke`: sería `revoked`); «dispositivo» (`device`), «marco» y «ambiente» no están en
el glosario y el código los va a usar.

**9.10 · Las tareas (§ 15) — Mejora.**
La constitución pide las pruebas primero, todas fallando; las tareas no lo dicen (solo las de
punta a punta, al final). Propongo que cada tarea empiece por sus pruebas. Y que el despliegue
(tarea 8) vaya justo después de la 2, con `/api/health` y una página vacía: así cada tarea siguiente
se ve en el ambiente de pruebas y los problemas de la máquina (9.3, 9.4, 9.6) aparecen el primer
día y no al final. El reparto en paralelo de la 5 con la 4 está bien.

## Lo que no pude comprobar

- Que `disableAutoSelect()` haga que el botón de Google pida elegir la cuenta (1.13).
- Cómo se comporta en el celular del local abrir la dirección del QR desde la cámara del sistema:
  si abre la aplicación instalada o Chrome, y si los dos comparten la cookie (en Android, en
  general, sí).
- Las condiciones de uso de ipwho.is (8.3).
- Qué devuelve `getClientCapabilities()` en la notebook del local sin Bluetooth: según la
  documentación de Chrome (versión 133 en adelante), `hybridTransport` dice si el dispositivo puede
  usar Bluetooth para la entrada entre dispositivos, pero no si hay un celular cerca.
- El peso real de lo que baja la entrada: lo estimé con los archivos de la maqueta.
