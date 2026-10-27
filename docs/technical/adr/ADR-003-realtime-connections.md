# ADR-003: Las conexiones en un solo módulo, con cuatro formas

**Estado:** aceptado

## Contexto

Hay cosas que tienen que llegar sin que la persona pida nada: que hay una versión nueva, que la
sesión se cerró, que el celular leyó un código, que la otra pantalla cambió. Cada una tiene un
equilibrio distinto entre tiempo real y consumo. Resolverlas una por una lleva a
mecanismos distintos para lo mismo y a consultas que gastan datos sin necesidad.

Carlos quiere minimizar el consumo de datos y la carga del servidor, y poder sumar más casos en
el futuro sin rediseñar.

## Decisión

Un módulo de plataforma, `realtime`, en el servidor y en la aplicación. Cada funcionalidad
declara **qué necesita** (un tema, cuánto importa el tiempo real, cuánto dura) y el módulo elige
**cómo**:

| Forma | Para qué | Cómo |
|---|---|---|
| `request` | Todo lo normal | HTTP |
| `piggyback` | Avisos continuos donde importa el consumo: versión nueva, luz de conexión, sesión cerrada, avisos pendientes | El servidor guarda el aviso en un buzón chico por sesión y lo manda en una cabecera de la próxima respuesta. Sin conexión abierta y sin temporizadores |
| `temporary` | Esperar algo puntual donde importa el tiempo real: el QR de entrada, la foto del celular, el avance de una lista | Un canal SSE que se abre solo mientras se espera y la pantalla está a la vista, y se cierra solo |
| `peer` | Celular y computadora vinculados | WebRTC por el Wi-Fi del local. El servidor solo los presenta, con un canal `temporary`; después no pasa nada por él |

- **Del lado del servidor**, una central de avisos por tema, en memoria. Si el dispositivo tiene
  un canal abierto, el aviso va por ahí; si no, queda en su buzón y viaja en la próxima respuesta.
- **Sumar un caso** es declarar su tema y su forma. **Sumar una forma** es una pieza más que
  cumple la misma interfaz (estrategia).
- **El espejo replica acciones, no pantallas.** Mientras están vinculados, cada acción con nombre
  se aplica en los dos dispositivos. Como la aplicación es una sola (ADR-002), los dos llegan a la
  misma pantalla, cada uno con su disposición. Lo que viaja son unos pocos bytes. Las fotos suben
  directo al servidor y viaja solo el aviso. Meta: menos de 50 ms entre tocar en uno y verlo en el
  otro.
- **Si la conexión directa no se logra** (un Wi-Fi que aísla los dispositivos), el mismo canal
  pasa por el servidor con SSE y POST, solo mientras estén vinculados.
- **`device-link` se enchufa en un solo lugar:** el punto por donde pasan las acciones. Ningún
  otro módulo sabe que existe; quitarlo es quitar su registro.

## Opciones descartadas

- **WebSocket:** un canal que va y vuelve, pero que queda abierto contra el servidor. SSE es HTTP
  común, pasa por Caddy sin configurar nada, se reconecta solo, y para mandar alcanza un POST.
- **Consultas periódicas al servidor:** gastan datos aunque no pase nada.
- **Bluetooth entre los dispositivos:** un navegador no puede ofrecer un servicio Bluetooth a
  otro, así que no sirve para el espejo. Bluetooth se usa solo para entrar (ADR-006).
- **Mandar la pantalla en vez de las acciones:** mucho más pesado, y no aprovecha que la
  aplicación es una sola.

## Consecuencias

- Para vincularse hace falta el servidor una vez. Ya vinculados, si se corta internet, el espejo
  sigue por el Wi-Fi; si se corta la conexión directa sin internet, no se pueden volver a
  encontrar hasta que vuelva.
- La central de avisos en memoria sirve para un proceso. Con varias copias del servidor se cambia
  por `LISTEN/NOTIFY` de PostgreSQL, sin tocar a quien la usa.
