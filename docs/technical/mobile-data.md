# Los datos del celular

El celular de la ferretería usa datos móviles: cada byte que la aplicación baja o sube sin que
la persona toque nada se paga. Esta página lleva la cuenta de **todo pedido que la aplicación
hace sola**: por un temporizador, al abrir, al volver la conexión o al volver a la vista. Lo que
pasa porque la persona tocó algo (entrar, salir, leer un código) no está acá.

**La regla:** la aplicación abierta y sin usarse no le pide nada al servidor (00 · E23). Lo que
hoy es excepción está en esta página, con su porqué y lo que cuesta. Un pedido automático nuevo
no se agrega sin anotarlo acá antes, con lo que pesa, y sin que Carlos lo apruebe.

## Lo que se hace para gastar poco

- **Nada en segundo plano.** Con la aplicación oculta (otra aplicación adelante, el celular
  bloqueado) no sale ningún pedido automático: lo que tenga que ponerse al día, se hace una vez
  al volver a la vista.
- **Pedidos chicos.** Un pedido automático pide solo lo que necesita: no reutiliza uno más grande
  porque ya existe.
- **Respuestas de la API sin lo de una página.** Las respuestas de `/api` llevan solo las cabeceras
  de seguridad que sirven para un JSON (diseño de 01, «Cabeceras de Caddy»): unos 600 bytes menos
  en cada una.
- **Lo que no cambia se guarda.** La aplicación queda guardada en el dispositivo (el service
  worker): al abrir solo se pide la página (unos 500 bytes con gzip) y lo demás sale de lo guardado,
  salvo que haya una versión nueva.

## Los pedidos que la aplicación hace sola

Los tamaños son de lo que viaja dentro de la conexión; la conexión segura (HTTPS) suma unos pocos
KB cuando hay que abrirla de nuevo, que es lo normal después de unos minutos sin pedidos.

| Cuándo | Qué pide | Cuánto pesa | Dónde | Por qué |
|---|---|---|---|---|
| Al abrir la aplicación | La página, y `GET /api/start` | La página: unos 500 bytes; `/api/start`: unos 600 bytes de respuesta, con los roles y los permisos de la persona | Celular y computadora | Saber el ambiente, la versión y si hay sesión (diseño de 01, «Al abrir la aplicación») |
| Con sesión, cuando la cabecera de una respuesta trae otra huella de los permisos | `GET /api/start` | Unos 600 bytes, una vez por cambio | Celular y computadora | Que el menú y la pantalla abierta se pongan al día cuando le cambian los roles o los permisos de un rol que tiene (02 · R7.8). Solo cuando cambian: la huella va en la cabecera de cada respuesta, sin pedidos de más |
| Al abrir o al volver la conexión, si quedó una salida sin mandar | `POST /api/sign-out` con la salida pendiente | Unos 200 bytes | Celular y computadora | Que la sesión que se dejó se cierre de verdad (01 · R5) |
| Al volver la conexión, con sesión | `GET /api/start` | Unos 600 bytes, con los roles y los permisos de la persona | Celular y computadora | Ver si la sesión venció durante el corte (01 · R3.6) |
| Con la entrada a la vista y «Sin conexión», si el navegador dice que hay red pero el último pedido falló | `GET /api/sign-in/google/nonce`, a los 2, 4, 8, 16 y 32 s y después cada minuto, hasta que uno llega | Mientras no hay red, nada (el pedido no sale). El que llega: menos de 50 bytes, y Google vuelve a dibujar su botón (unos 60 KB) | Celular y computadora | Que la entrada no quede apagada al salir del modo avión: Android avisa que hay red un instante antes de que ande (01 · R2.8). Lo aprobó Carlos |
| Con la entrada a la vista, un minuto antes de que venza el pedido de Google (hoy, cada 9 minutos); y al volver a la vista, si ya venció | `GET /api/sign-in/google/nonce` | Menos de 50 bytes de respuesta. **Pero Google vuelve a dibujar su botón con el pedido nuevo y baja unos 60 KB** (medido) | Celular y computadora | Que la entrada abierta mucho tiempo siga entrando con Google sin el aviso de «Pasó mucho tiempo» (01 · R2.1). Con la entrada a la vista una hora entera en el celular, unos 400 KB |
| Al volver la conexión (o al abrir), después de entrar sin conexión con la huella | `POST /api/sign-in/offline`, una vez por entrada sin conexión; si la red todavía no anda, a los 2, 4, 8, 16 y 32 s y después cada minuto, hasta que llega; si el servidor pide esperar, a los segundos que dice o al minuto | Unos 1,5 KB de ida y 300 bytes de vuelta, una vez. Mientras no hay red, nada | Solo el celular | Que el servidor confirme la entrada sin conexión y la sesión siga sin volver a entrar (15 · R3) |
| Al mostrar la entrada en el celular, la primera vez | La foto del fondo (19 KB) y la letra Google Sans (36 KB) | Unos 55 KB; después salen de lo guardado (el service worker guarda lo de `/assets`) | Solo el celular | La entrada oscura del celular (01 · R7.1) |
| Al mostrar la entrada | El botón de Google, que lo baja Google | Unos 170 KB la primera vez (medido); después, parte sale de lo guardado del navegador | Celular y computadora | Entrar con Google (01 · R2.1) |
| Al volver la conexión, con la entrada a la vista y el botón de Google sin dibujar | El botón de Google de nuevo, que lo baja Google | Hasta unos 170 KB (lo que el navegador no tenga guardado) | Celular y computadora | Que la entrada no quede sin Google después de un corte (01 · R2.1) |
| Con la entrada de la computadora a la vista | Un canal abierto que recibe un código nuevo por minuto | Unos 60 bytes por código | Solo la computadora | Entrar con el celular leyendo el QR (01 · R2.5) |
| Al volver la conexión, con el manual abierto, si un capítulo o una captura de la tarea abierta no llegó | Solo lo que no llegó: el capítulo (unos pocos KB) y las capturas de la tarea, hasta dos (de 6 a 75 KB cada una, medido) | Lo que pesaba lo que faltó; con todo bajado, nada | Celular y computadora | Que el manual no quede con «Sin conexión» después de un corte (00 · R4.6) |
| Celular y computadora vinculados, al encontrarse (al vincular, cuando el otro vuelve a la vista, al volver internet) | La presentación: el canal del vínculo, la oferta y la respuesta de la conexión directa | Unos 4 KB entre los dos; en el celular que vuelve después de unos minutos, unos 7 KB con la conexión segura nueva. Si el celular vuelve antes de 5 minutos con la conexión directa viva, nada | Celular y computadora | Encontrarse solos (03 · R3.5). Lo aprobó Carlos |
| Con la computadora a la vista esperando al celular, con «Por el servidor» o con el código de vincular a la vista | Un canal abierto, con un latido cada 40 s | Unos 8 KB por hora de bajada y 5 KB de subida; el código, 60 bytes por minuto más | La computadora; «Por el servidor», los dos | Enterarse en el momento de que el otro volvió o de lo que mandó (03 · R3.2, R3.5, R7.2). Lo aprobó Carlos |
| «Por el servidor», cada cambio de lo que se ve | El cambio de ida y su llegada al otro | Unos 750 bytes entre los dos por cambio; lo escrito se junta cada 150 ms. Con un toque cada 5 s, unos 540 KB por hora entre los dos | Celular y computadora | El espejo cuando el Wi-Fi no deja la conexión directa (03 · R3.2, R6.2). Lo aprobó Carlos |
| En espejo directo y en uso, si la última comprobación tiene más de 4 minutos | `GET /api/device-link/check` | Unos 700 bytes; 4 a 5 KB más si la conexión segura se había cerrado. Con uso continuo, unos 10 KB por hora en cada uno. Sin uso, nada | Celular y computadora | Que un vínculo terminado o una sesión cerrada dejen de espejar (03 · R2.6); cuenta como uso de la sesión (R2.5). Lo aprobó Carlos |
| Cuando una respuesta trae una huella del vínculo distinta | `GET /api/device-link/check` | Unos 700 bytes, una vez por cambio | Celular y computadora | Enterarse sin canal de que el vínculo terminó, se pausó o el otro volvió (03 · R2.3, R3.5). La huella viaja en la cabecera: unos 12 bytes por respuesta, solo con vínculo |
| Con «Sin internet» en el vínculo y la pantalla a la vista | `GET /api/device-link/check`, a los 2, 4, 8, 16 y 32 s y después cada minuto, hasta que uno llega | Mientras no hay internet sale al Wi-Fi y no gasta datos móviles; el que llega, unos 700 bytes | Celular y computadora | Volver a encontrarse solos cuando vuelve internet (03 · R3.4, E21). Lo aprobó Carlos |
| El celular que se fija si está la computadora y no la encuentra | El canal del vínculo abierto 30 s más, por si la computadora llega en ese momento | Menos de 1 KB, una vez por vez que se fija (al abrir, al reconectar, cuando cambia la huella del vínculo) | El celular | Que se encuentren solos cuando los dos se enteran casi a la vez, al vincular o reconectar (03 · R3.5). Sin esto quedaban esperando hasta el próximo pedido de alguno. Lo aprobó Carlos |
| Con Quién hizo qué a la vista, con hoy en las fechas y «Actualizar solo» prendido (prendido al abrir en la computadora; apagado en el celular, se prende a mano) | Un canal abierto con un latido cada 40 s (si no lo tiene abierto otra cosa); como mucho cada 5 s, un aviso de unos 100 bytes y la lista otra vez, comprimida (o «3 nuevas»: cuántas, sin la lista, unos 300 bytes); al volver a la vista, abrir el canal y una puesta al día | Unos 8 KB por hora de bajada y 5 KB de subida, más unos 1,5 KB por cada vez que se pone al día en el celular (4 KB en la computadora, con la tira). El peor caso, con acciones todo el tiempo, unos 1,1 MB por hora. Debajo del selector se ven los KB por minuto que manda el servidor por el canal para esa pantalla | La computadora; el celular solo si lo prenden | Ver lo nuevo sin tocar nada (05 · R4.6, R4.12) |
| Al abrir, con vínculo | Lo mismo de siempre: `/api/start` trae el vínculo | 180 bytes más | Celular y computadora | Que el indicador sepa su estado sin otro pedido (03 · R4.1) |
| Cuando no se logra la conexión directa | `POST /api/device-link/report` | Unos 400 bytes, una vez por falla | La computadora | Saber por qué falla el directo en el local (diseño de 03, § 15) |
| En segundo plano, con una versión nueva y nada a medio hacer | La página y los archivos de la versión nueva | Lo que pese la versión nueva | Celular y computadora | Actualizarse sola (00 · R5.6) |

## Un día típico con el celular vinculado

Supuestos: 8 horas abiertos, 6 de uso en espejo; el celular apaga la pantalla 40 veces, 30 de ellas por
menos de 5 minutos (diseño de 03, § 18).

| Qué | «Directo» | «Por el servidor» |
|---|---|---|
| Encontrarse: 10 veces × 7 KB (las 30 cortas no gastan) | 70 KB | 70 KB |
| Comprobaciones: 6 horas × 10 KB | 60 KB | — |
| Los cambios: 6 horas × 270 KB (la mitad del celular) | — | 1,6 MB |
| El latido: 6 horas × 13 KB | — | 78 KB |
| `/api/start`, la huella en la cabecera, avisos | menos de 5 KB | menos de 5 KB |
| **Total en el celular** | **unos 135 KB** | **unos 1,75 MB** |

La computadora suma unos 13 KB por hora mientras espera al celular, por el Wi-Fi.

## Lo que se mira antes de agregar uno

- Si se puede evitar: que lo haga la persona al tocar, o que se haga al volver a la vista.
- Si tiene que ser periódico, cada cuánto y por qué ese plazo.
- Que pida solo lo necesario, y cuánto baja también de afuera (como Google con su botón).
- Que se frene con la aplicación oculta.
