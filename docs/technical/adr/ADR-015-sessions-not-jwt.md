# ADR-015: Sesiones propias guardadas en el servidor, no JWT

**Estado:** aceptado. Precisa la parte de sesiones del ADR-006.

## Contexto

Después de entrar (con Google, con la huella o con el celular), cada pedido al servidor tiene que
decir quién lo hace. Para eso el dispositivo recibe un pase al entrar y lo manda con cada pedido:
eso es la sesión. Hace falta poder cerrar una sesión al instante (al salir, a distancia o al dar
de baja a una persona), que la sesión venza sola después de un tiempo configurable, y que el
sistema pueda crecer a varias copias del servidor.

## Opciones

| | **Sesión propia** (pase opaco, guardado en el servidor) | JWT (pase firmado que lleva los datos adentro) |
|---|---|---|
| Qué lleva el pase | Nada: 32 bytes al azar | Quién es, sus permisos y cuándo vence, firmados |
| Quién guarda la sesión | El servidor, en una tabla de PostgreSQL y en su memoria | Nadie: el servidor solo verifica la firma |
| Cerrar una sesión al instante | Se borra de la lista y deja de valer en el próximo pedido | No se puede: vale hasta que vence, salvo que se arme aparte una lista de anulados |
| Vencimiento | Lo decide el servidor y se puede cambiar en cualquier momento, también para las sesiones ya abiertas | Va escrito dentro del pase: para cambiarlo hay que esperar a que vuelvan a entrar. En la práctica, vencimiento corto y un segundo pase para renovarlo |
| Cambiar los permisos de alguien | Vale en el próximo pedido | Vale cuando el pase se renueva |
| Consultas por pedido | Ninguna a la base: la sesión está en la memoria del servidor | Ninguna: se verifica la firma |
| Dónde queda en el navegador | En una cookie que el código de la página no puede leer | Suele quedar donde el código de la página lo puede leer; en una cookie, pierde su ventaja de servir entre dominios |
| Si se filtra la base | La tabla guarda solo la huella (hash) del pase: no sirve para entrar | No aplica; si se filtra la clave de firma, se pueden fabricar pases de cualquiera |
| Piezas | Una tabla y un pase | Dos pases (acceso y renovación), la renovación, la clave de firma y su rotación, y la lista de anulados si se quiere cerrar al instante |

## Cuándo convendría JWT

Cuando quien verifica el pase no es quien lo emitió, o no puede consultar una lista central:

1. Muchos servicios distintos, de equipos distintos, que verifican cada uno por su cuenta.
2. Inicio de sesión único entre organizaciones (OpenID Connect): un proveedor de identidad emite el
   pase y lo aceptan aplicaciones que no comparten base con él. Ferrebress lo usa así una sola vez:
   el pase de Google al entrar se verifica y se cambia por una sesión propia.
3. APIs públicas para terceros, con permisos acotados (OAuth).
4. Escala enorme o repartida en regiones, donde una lista central sería un cuello de botella.
5. Pases de un solo uso y vida corta entre sistemas (un enlace firmado para bajar un archivo).

Ferrebress no cumple ninguna: un servidor (o pocas copias del mismo), una base, un solo tipo de
cliente, y necesita cerrar sesiones al instante. Si llegan la venta online o integraciones de
terceros (tareas T101 y T102), sus APIs externas pueden usar JWT u OAuth sin cambiar las sesiones
de la aplicación.

## Decisión

- **Pase opaco** de 32 bytes al azar, creado al entrar.
- **En el navegador,** en una cookie `HttpOnly`, `Secure`, `SameSite=Strict`. Funciona porque la
  aplicación y el servidor están en la misma dirección. Lo que la pantalla necesita
  mostrar sin conexión (nombre y rol) se guarda aparte en el dispositivo, porque no es secreto.
- **En el servidor,** la tabla de sesiones de PostgreSQL es la fuente de verdad y guarda la huella
  del pase (SHA-256), la persona, el dispositivo, cuándo se entró y cuándo se usó por última vez.
  La memoria del servidor tiene una copia de las sesiones ya vistas: comprobar un pase no consulta
  la base. El último uso se escribe en la base por tandas.
- **Vencimiento por falta de uso:** la sesión vence después de 60 minutos sin pedidos al servidor;
  cada pedido vuelve a contar desde cero. Un Administrador cambia ese tiempo
  desde Administración; hasta que exista ese módulo, sale de la configuración. Lo cuenta el reloj
  del servidor. Solo cuentan los pedidos al servidor: no se mira si la persona toca la pantalla.
- **Tope:** la sesión vence a las 8 horas de haber entrado, aunque se esté usando; ningún pedido lo
  extiende. Así, una sesión robada o mantenida viva con pedidos automáticos dura
  como mucho 8 horas. También se cambia desde Administración.
- **Lo hecho sin conexión** se guarda junto con la huella del pase de quien lo hizo. El servidor lo
  acepta a nombre de esa persona solo si el pase es suyo y su sesión no fue cerrada a mano ni la
  persona dada de baja; que el pase haya vencido no importa, porque solo prueba quién lo hizo. El
  cronómetro del dispositivo solo decide cuándo mostrar la entrada; nunca qué acepta el servidor.
- **Sin conexión, la sesión no vence en el dispositivo**: sin internet no se puede volver a
  entrar. Al volver la conexión, el servidor aplica los dos límites.
- **Se termina** al salir, al vencer, cuando alguien la cierra a distancia o cuando la persona es
  dada de baja.
- **Con varias copias del servidor:** cada una busca en la base el pase que no tiene en memoria,
  una sola vez. Al cerrar una sesión, la copia que la cierra la borra de la base y avisa a las
  demás con `LISTEN/NOTIFY` de PostgreSQL, que la sacan de su memoria al instante. No hace falta que
  una persona caiga siempre en la misma copia, ni sumar Redis.

## Por qué los dos tiempos no van en un JWT

El tope cabría en el vencimiento de un JWT, pero los 60 minutos sin uso no: el pase no sabe cuándo
se usó por última vez. Habría que guardarlo en el servidor (y ya sería una lista de sesiones) o
emitir pases de minutos con un segundo pase de renovación que también hay que guardar y poder
anular. Con sesiones, los dos tiempos son dos restas sobre una fila (`created_at`,
`last_used_at`, `closed_at`), en el archivo de reglas, y se prueban con fechas fijas.

## Consecuencias

- Un pedido no consulta la base para saber quién es: con 100 personas, el costo es despreciable.
- Cambiar el vencimiento vale también para las sesiones ya abiertas.
- Pasar a varias copias del servidor es prender el aviso entre ellas, sin tocar el resto.
