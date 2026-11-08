# Revisión de seguridad · 06 · Administración (`administration`), etapa a: ajustes para todos

## Paso 4: el diseño

Revisión independiente del [diseño de la etapa a](administration.md) desde el punto de vista de un
atacante (constitución, paso 4). Todavía no hay código del módulo. Leí la constitución, el
[capítulo 06](../../chapters/06-administration/rules.md) (R1 a R7, E01 a E40), la
[arquitectura](../architecture.md) y, del código que el diseño cambia o reutiliza:
`sign-in/settings.ts`, `sign-in/sessions/` (`rules.ts`, `store.ts`, `cookie.ts`),
`sign-in/offline/rules.ts`, `device-link/` (`settings.ts`, `rules.ts`, `index.ts`),
`platform/` (`events.ts`, `header-fields.ts`, `request-checks.ts`, `permissions.ts`, `http.ts`,
`config.ts`, `settings.ts`), `users/roles/routes.ts` (la ruta de quién tiene un permiso),
`shared/time/business.ts`, en la aplicación `platform/time.ts` y `sign-in/offline/when.ts`, y
`deploy/compose.yml`, `deploy/server.Dockerfile` y `.env.example`. La revisión del diseño
(`administration-design-review.md`) todavía no estaba escrita cuando hice esta.

- **Frena:** se puede entrar, ver o cambiar lo ajeno, o filtrar datos personales. Se resuelve antes
  de aprobar el diseño.
- **Mejora:** conviene hacerla; no frena.

## Resumen

**No encontré nada que frene.** La superficie es chica y está bien cerrada en lo principal: una sola
ruta que cambia, con el permiso mirado por el servidor en cada pedido (también en el que deshace),
valores de listas cerradas (no se puede poner una sesión de 0 minutos ni un vínculo de 0 días, así
que ni un Administrador malintencionado ni una sesión robada de Administrador pueden dejar a todos
afuera), el origen y la cookie `SameSite=Strict` de la plataforma contra pedidos desde otros sitios,
y nada que se guarde en el dispositivo. Lo que se ve sin permiso (los valores y quién cambió cada uno)
es lo que R1.2 decidió mostrar.

Lo que más conviene cambiar está en cómo se **leen** los ajustes, no en cómo se cambian: hoy los tiempos
de la sesión y del vínculo son constantes del código y no pueden fallar; con el diseño pasan a ser
datos de la base y de la memoria, y el diseño no dice qué pasa si esos datos faltan o están mal. Los
puntos 1 a 3 piden que ese camino falle cerrado (que no arranque, o que corte de más) en lugar de
abierto (sesiones que no vencen). El punto 4 es un error que impide arrancar: la validación de
`BUSINESS_TIME_ZONE` que propone el diseño rechaza el valor que el mismo diseño pone en el `.env`.

| # | Punto | Gravedad |
|---|---|---|
| 1 | Un valor guardado que no cumple el contrato puede dejar las sesiones sin vencer | Mejora |
| 2 | Si no se pueden leer los ajustes al arrancar, no tiene que arrancar con los de arranque | Mejora |
| 3 | La memoria de los ajustes puede quedar atrasada respecto de la base | Mejora |
| 4 | `Intl.supportedValuesOf` rechaza `America/Argentina/Buenos_Aires` | Mejora (disponibilidad) |
| 5 | La clave de la dirección contra las propiedades heredadas | Mejora |
| 6 | El primer cambio de un ajuste: no hay fila que trabar | Mejora |
| 7 | El vínculo vencido solo se corta en la limpieza | Mejora |
| 8 | La zona horaria en la aplicación sin conexión, y fijada «una vez» | Mejora |
| 9 | Subir los tiempos alarga también las sesiones robadas | Mejora (riesgo aceptado, se documenta) |
| 10 | El recálculo del redondeo y el panel del redondeo, con el catálogo | Mejora (para 07) |
| 11 | La cookie de 24 horas | Sin cambio |
| 12 | La cabecera `a` en respuestas sin sesión | Mejora menor |

## Los puntos

### 1. Un valor guardado que no cumple el contrato puede dejar las sesiones sin vencer

- **Dónde:** § 2, «Los valores de arranque no están en la tabla» y la columna `value jsonb`; § 5,
  `memory.ts` («cargados al arrancar»); `sign-in/sessions/rules.ts`, `closedReasonOf`.
- **El ataque o la falla:** `closedReasonOf` compara `now - createdAt >= limits.maxMs` y
  `now - lastUsedAt >= limits.idleMs`. Si `sessionIdle` o `sessionMax` llegan a la memoria como algo que
  no es un número (un `jsonb` con `"60"`, `null` multiplicado da 0, pero un texto, un objeto o
  `undefined` multiplicados dan `NaN`), las dos comparaciones dan `false` siempre: **ninguna sesión
  vence nunca, ni por tiempo sin uso ni por el tope**. Cómo llega ahí: una edición a mano de la base al
  arreglar algo, una migración futura que cambia la forma de un valor, o un cambio del contrato que
  saca una opción (por ejemplo, si se dejara de ofrecer 120 minutos, la fila con 120 sigue en la base y
  ningún código la vuelve a mirar). No es un ataque desde la aplicación (la ruta valida, § 8), pero el
  diseño valida solo en la entrada y confía en lo leído de la base, y el resultado de la falla es la
  peor posible para la seguridad: falla abierta y en silencio.
- **Propuesta:** `memory.ts` valida cada fila con el mismo esquema del contrato al cargarla. Una fila
  que no cumple: el servidor no arranca, diciendo qué clave está mal (como `config.ts` con el `.env`),
  o, si se prefiere no frenar el mostrador, usa el valor de arranque y lo anota en la auditoría y en
  el registro. Además, `closedReasonOf` puede tratar un límite que no es un número finito y positivo
  como 0 (cerrada): falla cerrada en el único lugar que decide. Cuesta unas 15 líneas y dos pruebas
  (una fila con un valor fuera del contrato; un límite `NaN` en `closedReasonOf`).

### 2. Si no se pueden leer los ajustes al arrancar, no tiene que arrancar con los de arranque

- **Dónde:** § 1, «Se cargan al arrancar»; § 2, «Una clave sin fila vale lo de arranque».
- **La falla:** el diseño no dice qué hace el arranque si la lectura de `administration.settings`
  falla (la base tarda, la migración no corrió). Si la implementación toma «sin filas» por «nunca
  cambiaron», un Administrador que bajó los tiempos a 15 minutos y 4 horas los ve volver a 60 minutos y
  8 horas después de un reinicio, sin que nadie lo note, y la pantalla muestra los de arranque como si
  fueran los elegidos.
- **Propuesta:** decir en § 5 que la carga es parte del arranque y que si falla, el servidor no
  arranca (el mismo criterio de «sin valores por omisión» de la constitución, VIII). Que una tabla
  vacía valga lo de arranque está bien; un error de lectura, no. Cuesta una línea del diseño y una
  prueba.

### 3. La memoria de los ajustes puede quedar atrasada respecto de la base

- **Dónde:** § 1 y § 4: `settings.changed` lo escucha `device-link` y «la memoria de `administration`,
  que se actualiza al confirmar»; `platform/events.ts`.
- **La falla:** en la plataforma, los que reaccionan corren dentro de la transacción y devuelven lo
  que va después de confirmarla; esas funciones corren en orden, en un `for` sin `try`
  (`events.ts`, `transaction`). Si la de `device-link` (soltar los vínculos que terminan y anotarlos)
  corre antes que la de la memoria y tira un error, **el cambio queda en la base y la memoria sigue
  con el valor viejo** hasta el próximo reinicio. Si el cambio era bajar los tiempos de la sesión
  porque se perdió un celular, las sesiones siguen valiendo con el tiempo largo, la pantalla (que lee
  de la memoria) vuelve a mostrar el valor viejo como si no se hubiera guardado, y la auditoría dice
  que se cambió. Un segundo intento da `409 changed`, porque la versión de la base ya subió.
  Lo mismo con varias copias del servidor (constitución, IX): cada copia tiene su memoria y solo la
  que atendió el `PUT` se entera; las otras siguen con el tiempo viejo. La sección «Escala» de la
  arquitectura no nombra esta memoria.
- **Propuesta:** que la memoria de `administration` se actualice en el mismo `PUT`, con el valor y la
  versión que se acaban de escribir, apenas confirma la transacción y antes de correr lo de los otros
  módulos (no como un oyente más del evento), y que solo acepte una versión mayor a la que tiene. Sumar
  «los ajustes de 06» a la lista de lo que vive en memoria en «Escala» de la arquitectura. Cuesta unas
  líneas y una prueba (un oyente que falla después de confirmar no deja la memoria atrasada).

### 4. `Intl.supportedValuesOf` rechaza `America/Argentina/Buenos_Aires`

- **Dónde:** § 5, «Código común», `src/server/platform/config.ts`: «validada con
  `Intl.supportedValuesOf('timeZone')`; en `.env.example` y en el `.env` de pruebas,
  `America/Argentina/Buenos_Aires`».
- **La falla:** lo comprobé en Node 22.22 (ICU 77.1):
  `Intl.supportedValuesOf('timeZone').includes('America/Argentina/Buenos_Aires')` da `false` (la lista
  trae el nombre canónico de CLDR, `America/Buenos_Aires`), y tampoco trae `UTC`. Con la validación
  del diseño, **el servidor no arranca con el valor que el mismo diseño pone en el `.env`**. No pude
  comprobarlo en Node 24 (la imagen del servidor, `deploy/server.Dockerfile`): Docker no estaba
  disponible en esta sesión; es un comportamiento conocido de ICU, así que lo más probable es que
  pase igual.
- **Propuesta:** validar armando el formato: `new Intl.DateTimeFormat('en', { timeZone })` dentro de un
  `try` (tira `RangeError` con una zona que no existe), y guardar el nombre tal como vino en el `.env`
  para mostrarlo. Que la zona no tome valores de la aplicación ni de la base, como dice el diseño, está
  bien. Cuesta lo mismo que lo propuesto; la prueba de E31 con el valor real lo detecta.

### 5. La clave de la dirección contra las propiedades heredadas

- **Dónde:** § 3, `PUT /api/administration/settings/:key`, «`404`: una clave que no está en la
  lista»; § 8, «la clave de la dirección se busca en la lista fija».
- **El ataque:** cualquiera con sesión manda `PUT /api/administration/settings/constructor` (o
  `__proto__`, `toString`, `hasOwnProperty`). Si la lista del contrato es un objeto y la ruta hace
  `catalog[key]` o `key in catalog`, la clave «existe»: el esquema sale `undefined` y el pedido termina
  en un `500` (que se anota como error del servidor cada vez que alguien quiere), o, según cómo se
  escriba, pasa sin validar y se inserta una fila `constructor` en la tabla que al arrancar se carga
  en la memoria con `memory[key] = value`. Con `__proto__`, eso cambia el prototipo del objeto de la
  memoria. No encontré cómo convertirlo en un cambio de un ajuste real (los cinco son propiedades
  propias), así que no frena, pero es fácil de evitar.
- **Propuesta:** buscar la clave con `Object.hasOwn` o tener la lista en un `Map`, y la memoria también
  en un `Map`. Mirar el permiso **antes** que la clave y el cuerpo, así sin permiso todo da `403` y se
  anota (E03), y una clave rara de quien no tiene el permiso no llega a nada. El esquema del cuerpo,
  estricto: sin propiedades de más, `version` entero entre 0 y 2³¹ − 1 (la columna es `integer`; un
  número más grande hace fallar la consulta con un `500`), `confirmed` booleano. Cuesta unas líneas y
  una prueba con `__proto__` y `constructor`.

### 6. El primer cambio de un ajuste: no hay fila que trabar

- **Dónde:** § 2, «Una clave sin fila vale lo de arranque, con versión 0; el primer cambio inserta la
  fila»; § 3, «3 consultas: trabar la fila, escribirla y la auditoría».
- **La falla:** con la versión 0 no hay fila, y `SELECT … FOR UPDATE` sobre una fila que no existe no
  traba nada. Dos Administradores que cambian el mismo ajuste por primera vez a la vez (E12 con un
  ajuste nunca tocado) pasan los dos la comprobación de versión. Si la escritura es un `INSERT`, el
  segundo choca con la clave y da `500`; si es un `INSERT … ON CONFLICT DO UPDATE`, el segundo **pisa
  al primero**, que es justo lo que R2.3 prohíbe. No da acceso a nada (los dos tienen el permiso), pero
  la auditoría queda con dos cambios «de 1.000 a X» y «de 1.000 a Y», y el valor que vale no es el que
  vio el segundo.
- **Propuesta:** con versión 0, `INSERT … ON CONFLICT (key) DO NOTHING` y, si no insertó, `409 changed`
  con la fila de ahora; con versión mayor, `UPDATE … WHERE key = $1 AND version = $2` y, si no tocó
  ninguna, `409`. Así ni hace falta trabar. Cuesta lo mismo que lo previsto y la prueba de E12 con un
  ajuste nunca cambiado.

### 7. El vínculo vencido solo se corta en la limpieza

- **Dónde:** § 5, «`device-link`: `viewOf` y la limpieza diaria leen `pairingDays`, y la limpieza corre
  también al recibir `settings.changed`»; `device-link/rules.ts` (`viewOf`) e `index.ts` (la limpieza
  diaria).
- **La falla:** en el código de hoy, `pairingDays` solo se usa en `viewOf` (para mostrar cuándo vence) y
  en la limpieza de una vez por día; ninguna ruta del vínculo mira si el vínculo ya pasó su plazo. R7.3
  dice que un vínculo vencido «se termina en su próximo contacto con el servidor». El diseño lo cumple
  al bajar los días porque corre la limpieza en el momento, pero:
  - si esa limpieza falla (la base, o el punto 3), el vínculo sigue andando hasta la próxima limpieza,
    hasta 24 horas, y la pantalla del vínculo ya dice que venció;
  - fuera de un cambio, un vínculo que vence entre dos limpiezas sigue andando hasta 24 horas más (eso
    ya pasa hoy, no lo trae este diseño).
  El vínculo solo no da acceso: cada lado necesita su sesión abierta. Por eso no frena.
- **Propuesta:** que `device-link` mire el plazo con `pairingDays` de la fachada en cada contacto que ya
  lee el vínculo (el estado, presentarse, el respaldo) y lo trate como vencido; la limpieza queda para
  borrar. Si se prefiere no tocarlo ahora, al menos que la limpieza del cambio corra dentro de la
  transacción del `PUT` (si falla, no cambia el ajuste: todo o nada, como el redondeo) y no después.
  Cuesta unas líneas en `device-link` y una prueba de E39 donde la limpieza falla.

### 8. La zona horaria en la aplicación sin conexión, y fijada «una vez»

- **Dónde:** § 1 y § 5, `src/shared/time/business.ts`: «`setBusinessTimeZone(zone)` la fija una vez
  (el servidor al arrancar, la aplicación al recibir `/api/start`)».
- **La falla:** la aplicación usa la zona sin conexión: `sign-in/offline/when.ts` escribe hasta cuándo
  se puede entrar sin conexión, y la tira del día del vínculo y la auditoría arman días con ella. Una
  aplicación que arranca sin internet no recibe `/api/start`, y el diseño no dice qué zona usa entonces
  ni dice que se guarde (§ 7: «No se guarda nada en el dispositivo»). Si toma un valor por omisión (la
  del navegador, o UTC), las horas y los días que ve la persona sin conexión quedan corridos sin aviso;
  si no toma ninguno, esas pantallas fallan. Además, hoy varios archivos la copian al cargarse
  (`audit-log/logic.ts`: `const zone = { timeZone: businessTimeZone }`; `when.ts`, `time.ts` como valor
  por omisión): si `setBusinessTimeZone` llega después, esos se quedan con la vieja.
  En el servidor, que se pueda llamar dos veces deja abierta la puerta a que algo la cambie mientras
  corre, lo que corre el día de las ventas y el cierre (R5, «se fija una sola vez»).
- **Propuesta:** en el servidor, `setBusinessTimeZone` tira un error si se llama dos veces y cualquier
  función del día tira un error si se usa antes (sin valor por omisión). En la aplicación, guardar la
  zona junto con lo que ya se guarda en el dispositivo para trabajar sin conexión (no es secreta ni
  personal; la arquitectura lo tiene que sumar a su lista de «Los datos»), validarla con
  `Intl.DateTimeFormat` antes de fijarla y leerla siempre por una función, nunca copiada al cargar.
  No pude comprobar qué hace hoy la aplicación sin conexión al arrancar en frío; lo dejo para el
  revisor del diseño. Cuesta unas líneas y una prueba.

### 9. Subir los tiempos alarga también las sesiones robadas

- **Dónde:** § 8, «El abuso que se cuida»; R6.3 y E36.
- **El ataque:** alguien con una sesión de Administrador ajena (una computadora del local que quedó
  abierta) sube el tiempo sin uso a 120 minutos y el tope a 24 horas. Desde ese momento **todas** las
  sesiones abiertas, la suya incluida, duran hasta 24 horas desde que se entró, también las robadas que
  tenga en otros dispositivos. Queda en Quién hizo qué y se revierte, como dice el diseño, y es lo que
  R6.3 pide.
- **Propuesta:** ningún cambio en el diseño; que § 8 lo nombre como riesgo aceptado junto a los otros
  dos, con la defensa que ya existe (cerrar sesiones a distancia desde Usuarios) y que la auditoría
  muestre el cambio de los tiempos de la sesión como un cambio de acceso, no solo como un número.

### 10. El recálculo del redondeo y el panel del redondeo, con el catálogo

- **Dónde:** § 3 (`GET /api/administration/rounding`, sin permiso y sin límite), § 8 (el `PUT`, 30 por
  minuto por sesión) y § 9 (una consulta que cuenta por paso sobre 10.000 precios).
- **El abuso:** hoy no hay precios y las dos rutas no consultan nada. Con el catálogo, cualquiera con
  sesión puede repetir el `GET` del redondeo sin tope (cada uno, dos consultas sobre todos los precios),
  y una sesión de Administrador (o una robada) puede mandar 30 `PUT` por minuto con `confirmed: true`
  alternando dos pasos: cada uno recalcula y traba todos los precios dentro de una transacción mientras
  se vende.
- **Propuesta:** anotar en el diseño, para cuando llegue 07: un límite por sesión en el `GET` del
  redondeo (el mismo de 30 por minuto) o guardar el conteo por versión del catálogo, y un límite propio
  más bajo para el `PUT` de `roundingStep` (por ejemplo, 3 por minuto). Hoy no cuesta nada.

### 11. La cookie de 24 horas

- **Dónde:** § 5, «La cookie de la sesión dura lo que la opción más larga (24 horas)».
- **Lo que miré:** hoy la cookie vence con el tope (8 horas), así que una cookie quedaba inútil en el
  navegador aunque el servidor fallara. Con el diseño, la cookie de una sesión cerrada queda hasta 24
  horas en el navegador. No da nada: el servidor busca el pase en la memoria o en la base y la sesión
  cerrada sigue cerrada (queda con su motivo en la base y no se reabre al subir el tope), y la cookie es
  `__Host-`, `HttpOnly`, `Secure` y `SameSite=Strict`. Lo único que pierde es la defensa de más ante el
  punto 1, que el punto 1 resuelve. Sin cambio.

### 12. La cabecera `a` en respuestas sin sesión

- **Dónde:** § 6, el campo `a` de `X-Ferrebress` con la suma de las versiones.
- **Lo que se filtra:** si el campo va en todas las respuestas, también en las de `/api/start` sin
  sesión, alguien de afuera sabe cuántas veces se cambiaron los ajustes y cuándo cambia uno. No es dato
  personal ni sirve para entrar; es información del negocio que no hace falta dar.
- **Propuesta:** que el campo devuelva `undefined` sin sesión (la plataforma ya lo permite,
  `header-fields.ts`). Una línea.

## Lo que miré y no encontré nada

1. **Entrar sin permiso:** no hay forma nueva de entrar; las tres rutas piden sesión y la toman de la
   cookie de 01. Entrar sin conexión (15) no depende de los tiempos de la sesión (`offline/rules.ts` usa
   su propio plazo) y no cambia.
2. **Permisos:** el `PUT` mira «Cambiar los ajustes» en el servidor en cada pedido, también el de
   deshacer, y quien lo pierde con la pantalla abierta no guarda (E05). No hay identificadores de otras
   personas en las rutas. Una cuenta dada de baja pierde sus sesiones (01), así que no puede nada. La
   ruta de quién tiene un permiso que usa la pantalla ya existe y pide solo sesión, como pide R1.2.
3. **Lo que entra de afuera:** fuera del punto 5, el cuerpo tiene el tope de 64 KB de la plataforma y
   cada valor sale de una lista cerrada o de un rango entero. No hay archivos ni datos de terceros.
   `BUSINESS_TIME_ZONE` sale del `.env`, no de la aplicación.
4. **La aplicación en el navegador:** no guarda nada nuevo en el dispositivo (salvo lo que propone el
   punto 8). El nombre de quien cambió un ajuste es el texto de una persona: que se muestre como texto
   (la aplicación no usa HTML armado a mano), nunca con `innerHTML`. El espejo es entre los dos
   dispositivos de la misma persona (diseño de 03), así que lo espejado no le muestra nada a otra.
   `PUT` desde otro sitio: lo frena el control de `Origin` de `platform/http.ts` y la cookie
   `SameSite=Strict`.
5. **Datos personales y secretos:** solo el nombre de quien cambió cada ajuste, visible para cualquiera
   con sesión, que es lo que decidió R1.2. Nada sale de la máquina. Ningún secreto nuevo.
6. **Abuso:** los valores mínimos (15 minutos, 4 horas, 1 día) no dejan a nadie afuera; el resto, en
   los puntos 9 y 10. El `GET /api/administration` hace una consulta (los nombres) por pedido y no
   tiene límite: con sesión y con 700 bytes no es un costo que preocupe, pero los nombres podrían salir
   de la memoria de Usuarios si ya los tiene.
7. **Sin conexión:** la pantalla no deja cambiar nada sin conexión y no hay cola: nada que falsear ni
   repetir. Lo de la zona, en el punto 8.
8. **Auditoría:** cada cambio con quién, el antes y el después; los rechazos sin permiso, una vez por
   minuto por persona y permiso (`platform/permissions.ts`); dónde, con la dirección y el dispositivo
   del pedido, como el resto. No anotar los `400` está bien: la pantalla no puede mandarlos con las
   opciones fijas, y un `400` de los márgenes o los días es un error de tipeo de quien tiene el permiso.
   La auditoría solo recibe filas (ADR-004).
9. **El despliegue:** no cambian Caddy, los puertos ni los contenedores. `BUSINESS_TIME_ZONE` llega
   al servidor por el `env_file` de `deploy/compose.yml`; hace falta sumarla también al `.env` de las
   pruebas de punta a punta (`tests/e2e/stack/start.ts`) y a la configuración de las pruebas
   (`src/server/testing/config.ts`), o no arrancan. No es secreta.
10. **Dependencias:** ninguna nueva; `zod` ya está y `Intl` es de Node.

Fuentes del punto 4: lo comprobé en Node 22.22 con ICU 77.1; el comportamiento de ICU está descrito en
[WebKit, bug 218542](https://bugs.webkit.org/show_bug.cgi?id=218542) y en
[Node, issue 43678](https://github.com/nodejs/node/issues/43678).
