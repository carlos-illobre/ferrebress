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
| Al abrir la aplicación | La página, y `GET /api/start` | La página: unos 500 bytes; `/api/start`: unos 300 bytes de respuesta | Celular y computadora | Saber el ambiente, la versión y si hay sesión (diseño de 01, «Al abrir la aplicación») |
| Al abrir o al volver la conexión, si quedó una salida sin mandar | `POST /api/sign-out` con la salida pendiente | Unos 200 bytes | Celular y computadora | Que la sesión que se dejó se cierre de verdad (01 · R5) |
| Al volver la conexión, con sesión | `GET /api/start` | Unos 400 bytes | Celular y computadora | Ver si la sesión venció durante el corte (01 · R3.6) |
| Con la entrada a la vista y «Sin conexión», si el navegador dice que hay red pero el último pedido falló | `GET /api/sign-in/google/nonce`, a los 2, 4, 8, 16 y 32 s y después cada minuto, hasta que uno llega | Mientras no hay red, nada (el pedido no sale). El que llega: menos de 50 bytes, y Google vuelve a dibujar su botón (unos 60 KB) | Celular y computadora | Que la entrada no quede apagada al salir del modo avión: Android avisa que hay red un instante antes de que ande (01 · R2.8). Lo aprobó Carlos |
| Con la entrada a la vista, un minuto antes de que venza el pedido de Google (hoy, cada 9 minutos); y al volver a la vista, si ya venció | `GET /api/sign-in/google/nonce` | Menos de 50 bytes de respuesta. **Pero Google vuelve a dibujar su botón con el pedido nuevo y baja unos 60 KB** (medido) | Celular y computadora | Que la entrada abierta mucho tiempo siga entrando con Google sin el aviso de «Pasó mucho tiempo» (01 · R2.1). Con la entrada a la vista una hora entera en el celular, unos 400 KB |
| Al volver la conexión (o al abrir), después de entrar sin conexión con la huella | `POST /api/sign-in/offline`, una vez por entrada sin conexión; si la red todavía no anda, a los 2, 4, 8, 16 y 32 s y después cada minuto, hasta que llega | Unos 1,5 KB de ida y 300 bytes de vuelta, una vez. Mientras no hay red, nada | Solo el celular | Que el servidor confirme la entrada sin conexión y la sesión siga sin volver a entrar (15 · R3) |
| Al mostrar la entrada en el celular, la primera vez | La foto del fondo (33 KB) y la letra Google Sans (36 KB) | Unos 70 KB; después salen de lo guardado (el service worker guarda lo de `/assets`) | Solo el celular | La entrada oscura del celular (01 · R7.1) |
| Al mostrar la entrada | El botón de Google, que lo baja Google | Unos 170 KB la primera vez (medido); después, parte sale de lo guardado del navegador | Celular y computadora | Entrar con Google (01 · R2.1) |
| Al volver la conexión, con la entrada a la vista y el botón de Google sin dibujar | El botón de Google de nuevo, que lo baja Google | Hasta unos 170 KB (lo que el navegador no tenga guardado) | Celular y computadora | Que la entrada no quede sin Google después de un corte (01 · R2.1) |
| Con la entrada de la computadora a la vista | Un canal abierto que recibe un código nuevo por minuto | Unos 60 bytes por código | Solo la computadora | Entrar con el celular leyendo el QR (01 · R2.5) |
| En segundo plano, con una versión nueva y nada a medio hacer | La página y los archivos de la versión nueva | Lo que pese la versión nueva | Celular y computadora | Actualizarse sola (00 · R5.6) |

## Lo que se mira antes de agregar uno

- Si se puede evitar: que lo haga la persona al tocar, o que se haga al volver a la vista.
- Si tiene que ser periódico, cada cuánto y por qué ese plazo.
- Que pida solo lo necesario, y cuánto baja también de afuera (como Google con su botón).
- Que se frene con la aplicación oculta.
