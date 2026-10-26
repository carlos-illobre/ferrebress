# ADR-001: Un solo servidor partido en módulos

**Estado:** aceptado (2026-10-26, decisión 2)

## Contexto

La primera versión terminó con el backend partido en seis servicios: Comercial, Acceso, Tickets, Auditoría, Procesos y
la lectura de listas (en Python), con una puerta que reparte por ruta y una base por servicio.
Para una ferretería con tres personas, una sola máquina y una persona que decide, eso trajo
costos sin beneficio visible en el mostrador:

- Un despliegue con una clave de base por servicio y un orden de subida que coordinar.
- La identidad viajando en cabeceras con un token compartido, y si Acceso se cae, se cae todo.
- Problemas que solo existen por la red: datos que hay que pedirle a otro servicio, pedidos
  repetidos que vencen aunque ya se aplicaron, eventos que hay que entregar con reintentos,
  permisos repetidos en dos servicios.

Los motivos para separar servicios (equipos distintos, escalar una parte, aislar fallas, otro
lenguaje) no aplican, o aplican a una sola pieza.

## Decisión

Un solo servidor en TypeScript, con un **módulo por capítulo** del negocio y una sola base
PostgreSQL con un **esquema por módulo**.

- **Cada módulo es dueño de su esquema.** Ningún otro lee ni escribe sus tablas.
- **Un módulo usa a otro solo por su fachada** (lo que exporta su `index.ts`), con llamadas
  dentro del proceso. Un control en cada subida frena cualquier otro import.
- **Las dependencias entre módulos van en una sola dirección,** sin ciclos.
- **Una transacción puede abarcar varios módulos:** quien la abre se la pasa a la fachada del
  otro, que escribe solo sus tablas. Así una venta descuenta el stock y anota quién la hizo, todo
  junto o nada.
- **Para reaccionar sin conocerse, eventos dentro del proceso:** un módulo publica lo que pasó
  («venta registrada») y los que se suscriben actúan en la misma transacción. Sin broker.
- **Dentro de cada módulo, tres capas en archivos separados:** la entrada HTTP, la regla y los
  datos. La regla no importa tecnología: ni el framework web ni la biblioteca de la base.

## Opciones descartadas

- **Seguir con servicios separados:** los costos de arriba, para un local de tres personas.
- **Un servidor sin fronteras:** rápido al principio, pero todo termina acoplado con todo. Las
  fronteras por módulo, controladas por herramienta, son tan firmes como las de la red, sin su
  costo.
- **Capas hexagonales, repositorios con interfaces:** sirven cuando la regla tiene que andar con
  bases o servicios intercambiables. Acá hay un solo PostgreSQL, y las pruebas de la regla con
  datos falsos y de los datos contra PostgreSQL real ya dan lo que ese patrón promete.

## Consecuencias

- Un despliegue, una imagen, una clave de base.
- La sesión la lee el mismo servidor: no hay identidad en cabeceras ni token entre servicios.
- Si un módulo algún día tiene que irse a otro proyecto, sus fronteras ya están: su esquema, su
  fachada y sus eventos. Sacarlo es cambiar esas llamadas por HTTP.
- Se pierde desplegar un módulo sin los demás y el aislamiento por proceso: un error que tumba el
  servidor tumba todos los módulos. Lo que puede colgarse (leer una planilla rara) corre con un
  tiempo límite.

## Enmienda (2026-10-26, decisiones 5 y 21)

- La aplicación sigue la misma partición: un módulo de la aplicación por cada módulo del servidor,
  con el mismo nombre (ADR-002).
- La auditoría no va en PostgreSQL sino en SQLite, aparte (ADR-004). «Todo junto o nada» vale para
  el estado actual; el evento de auditoría se escribe después de confirmar.
