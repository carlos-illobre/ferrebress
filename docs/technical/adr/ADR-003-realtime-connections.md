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
| `piggyback` | Avisos continuos donde importa el consumo: versión nueva, luz de conexión, sesión cerrada, permisos, y lo de cada módulo que puede esperar | En la cabecera `X-Ferrebress` de la próxima respuesta. Cada módulo suma su **campo**, calculado de lo que el servidor ya tiene en memoria (el del vínculo, una huella de 8 caracteres que cambia cuando cambia el vínculo); la aplicación lo lee antes de devolver la respuesta. Sin conexión abierta y sin temporizadores |
| `temporary` | Esperar algo donde importa el tiempo real: el QR de entrada, el código de vincular, presentar al celular y la computadora, la auditoría que se actualiza sola | Un solo canal SSE por pestaña, abierto solo mientras alguna pantalla a la vista espera un **tema**, que comparten todos los temas de esa pestaña |
| `peer` | Celular y computadora vinculados | Un transporte con dos variantes: directo (WebRTC por el Wi-Fi del local, sin servidores externos), presentado por el canal, que se cierra apenas se encuentran; y por el servidor, de respaldo |

- **Del lado del servidor**, un hub en memoria con los canales abiertos y quién escucha cada tema.
  Cada módulo declara sus temas: quién puede escucharlos y qué mandar al empezar a escuchar, así
  reconectarse nunca pierde nada. Lo que puede esperar va como un campo de la cabecera.
- **Sumar un caso** es declarar su tema (o su campo) y pedirlo desde la pantalla. **Sumar una forma de
  conectar los dos** es un transporte más que cumple la misma interfaz (estrategia). Cómo se construye
  cada pieza está en el [ADR-017](ADR-017-realtime-channel-and-mirror.md).
- **El espejo replica el estado a la vista, no acciones.** Lo que se ve (la pantalla, lo abierto encima,
  lo escrito, lo elegido y lo que trajo el servidor) vive en valores con nombre; cada cambio viaja como
  un parche de pocos bytes, y al conectarse la computadora manda una foto. Como la aplicación es una
  sola (ADR-002), los dos muestran la misma pantalla, cada uno con su disposición. Lo que trae el
  servidor lo pide uno solo por la conexión directa, y el otro recibe la respuesta. Las fotos del
  celular suben directo al servidor y viaja solo el aviso. Meta: menos de 50 ms entre tocar en uno y
  verlo en el otro.
- **Si la conexión directa no se logra** (un Wi-Fi que aísla los dispositivos), los mismos mensajes van
  por el servidor, con POST de ida y el canal de vuelta, solo mientras los dos tienen la aplicación a la
  vista.
- **`device-link` no se enchufa en ninguna pantalla:** las pantallas usan valores con nombre, que sin
  vínculo son valores comunes. Ningún otro módulo sabe que existe; quitarlo es quitar su registro.

## Opciones descartadas

- **WebSocket:** un canal que va y vuelve, pero que queda abierto contra el servidor. SSE es HTTP
  común, pasa por Caddy sin configurar nada, se vuelve a abrir con un pedido común, y para mandar
  alcanza un POST.
- **Consultas periódicas al servidor:** gastan datos aunque no pase nada.
- **Bluetooth entre los dispositivos:** un navegador no puede ofrecer un servicio Bluetooth a
  otro, así que no sirve para el espejo. Bluetooth se usa solo para entrar (ADR-006).
- **Mandar la pantalla en vez del estado:** mucho más pesado, y no aprovecha que la aplicación es
  una sola.
- **Replicar acciones con nombre:** una acción que pide al servidor no da lo mismo en los dos, y lo
  escrito letra por letra no es una acción (ADR-017).

## Consecuencias

- Para vincularse hace falta el servidor una vez. Ya vinculados, si se corta internet, el espejo
  sigue por el Wi-Fi; si se corta la conexión directa sin internet, no se pueden volver a
  encontrar hasta que vuelva.
- El hub y la memoria de los vínculos sirven para un proceso. Con varias copias del servidor se
  cambian por `LISTEN/NOTIFY` de PostgreSQL, sin tocar a quien los usa (ADR-017 dice el borde del
  reenvío).
