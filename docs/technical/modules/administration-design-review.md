# Revisión del diseño · 06 · Administración, etapa a (ajustes para todos)

Revisa [administration.md](administration.md) contra la constitución, el
[capítulo 06](../../chapters/06-administration/rules.md) (R1 a R7, E01 a E40), la maqueta aprobada
[`administration-settings/final/`](../../design/mockups/administration-settings/final/), la
[arquitectura](../architecture.md), [mobile-data.md](../mobile-data.md), los diseños de 01
([sign-in.md](sign-in.md)), 02 ([users.md](users.md)) y 03 ([device-link.md](device-link.md)), y el
código de hoy que el diseño toca: `src/server/modules/sign-in/` (`settings.ts`, `sessions/`, `access/`),
`src/server/modules/device-link/` (`index.ts`, `rules.ts`, `guard.ts`, `members.ts`, `listeners.ts`),
`src/server/platform/` (`config.ts`, `events.ts`, `guards.ts`, `permissions.ts`, `start-parts.ts`,
`header-fields.ts`), `src/server/modules.ts`, `src/shared/time/business.ts` y quienes lo usan, y en la
aplicación `platform/server/api.ts`, `platform/mirror/query.ts` y `platform/time.ts`.

Gravedad: **Frena** = hay que resolverlo (o que Carlos lo decida) antes de aprobar el diseño;
**Mejora** = conviene, pero no frena.

Resumen: la idea de fondo está bien (una fila con versión por ajuste, los valores en memoria que leen
`sign-in` y `device-link` sin consultar, la cookie con el tope más largo para que E36 ande, la limpieza
de vínculos al bajar los días). Frenan seis puntos: la validación de `BUSINESS_TIME_ZONE` rechaza el valor
que el mismo diseño pone en el `.env`; la zona que llega solo por `/api/start` deja sin zona a la
aplicación abierta sin conexión (y hoy cuatro archivos la copian al cargarse); el `PUT` no lo sabe mandar
la aplicación; E12 desde los valores de arranque termina en un error 500; E08 no se cumple con el espejo
«por el servidor»; y aplicar el redondeo con un número de precios distinto del confirmado es una
interpretación de R3.4 que tiene que decidir Carlos.

---

## 1. Escenarios sin cubrir

### 1.1 E12 desde los valores de arranque: dos primeros cambios chocan en la base — **Frena**

- **Dónde:** § 2, «Una clave sin fila vale lo de arranque, con versión 0; el primer cambio inserta la
  fila»; § 3, `PUT`, «3: trabar la fila, escribirla y la auditoría».
- **Qué propone:** trabar la fila (`select … for update`), comparar la versión y escribir.
- **Qué veo:** E12 arranca justo en ese caso: los días del vínculo en 30, el valor de arranque, sin fila.
  Trabar una fila que no existe no traba nada: los dos `PUT` leen versión 0, los dos intentan insertar, y
  el segundo falla por la clave repetida. Sin un manejo explícito, eso es un `500`, no el `409 changed`
  con «Lo cambió <la primera> recién». Además, § 1 dice que es «el mismo mecanismo que los roles», y en
  02 el mecanismo no es trabar: es escribir con `where version = ?` ([users.md](users.md), «Dos cambian a
  la misma»).
- **Qué hace falta:** decir cómo se resuelve el primer cambio. Opciones:
  1. Una sola sentencia: `insert … on conflict (key) do update set … where settings.version = $vista
     returning version`. Sin fila vuelta, `409 changed`. El caso «versión vista mayor que 0 y sin fila»
     no existe, porque la versión solo sube. Es una consulta en lugar de dos, y no hace falta trabar.
  2. Insertar al arrancar, con `on conflict do nothing`, una fila por clave del contrato con su valor de
     arranque. Desde ahí, siempre `update … where version = ?`, como 02. Cambia una cosa que hay que
     decidir: hoy, cambiar un valor de arranque en el código cambia el negocio que nunca lo tocó; así,
     no lo cambia.
  Las dos necesitan una prueba con los dos `PUT` a la vez sobre una clave sin fila.

### 1.2 E08 con el espejo «por el servidor» — **Frena**

- **Dónde:** § 6, el campo `a`; § 7, «`useMirroredQuery` en modo `forward`».
- **Qué propone:** con el vínculo, el otro dispositivo recibe los ajustes por el espejo; y la cabecera `a`
  hace que la pantalla vuelva a pedir si cambió algo.
- **Qué veo:** en `platform/mirror/query.ts`, «Por el servidor, todo es `refetch`… Lo que el que sigue
  pide él no viaja». Con el respaldo por el servidor, lo que trae la computadora después de guardar no
  viaja al celular. El celular, con Administración a la vista y sin que nadie lo toque, no hace pedidos,
  así que tampoco ve cambiar `a`. Entonces el celular sigue mostrando el valor viejo, y E08 no se
  cumple. Con el directo sí anda.
- **Qué hace falta:** que algo espejado le avise al otro que tiene que volver a pedir. Opciones:
  1. Un valor con nombre espejado con la suma de versiones que vio el que manda, y que el que sigue
     vuelva a pedir cuando cambia (unos bytes por cambio).
  2. Espejar el aviso de abajo (el «Deshacer»), que ya existe en cada cambio.
  En los dos casos, una prueba de E08 con el transporte «por el servidor».

### 1.3 E05: la pantalla tiene que quedar sin poder tocarse — **Mejora**

- **Dónde:** § 3, `GET /api/administration` devuelve «si quien pide puede cambiarlos»; § 10, E05 se
  prueba solo en la ruta.
- **Qué veo:** si la pantalla decide con ese campo, después de un `403` sigue mostrando que se puede,
  hasta volver a pedir. Lo que ya existe se pone al día solo: la huella `p` de la cabecera cambia, la
  aplicación vuelve a pedir `/api/start` y `can.ts` sabe los permisos de ahora (02 · R7.8). El diseño no
  dice qué hace la pantalla al recibir el `403`, ni lo prueba.
- **Propuesta:** sacar el campo del `GET` y decidir con los permisos de la sesión (`can`). Sumar a § 10 la
  prueba de la pantalla: `403`, el aviso «ya no tenés el permiso» y todo sin poder tocarse.

### 1.4 E18 a E22 y E29 no se pueden probar de verdad sin el catálogo — **Mejora**

- **Dónde:** § 10, «E18 a E24 con un recalculador de mentira»; «E25 a E29: orden, repetidos, rangos».
- **Qué veo:** E29 («esos productos siguen con 100 %») no tiene productos con qué probarse: la fila
  de § 10 no lo prueba. E18 a E22 se prueban contra una interfaz que todavía no implementa nadie, y que
  puede cambiar cuando exista 07 (ver 3.2).
- **Propuesta:** decir en § 10 que E29 y la parte real de E18 a E22 se cierran con 07. Para E29 hoy
  alcanza con probar que cambiar `quickMargins` no llama al recalculador ni publica nada que lo use.

### 1.5 El momento en que se guarda lo escrito y el deslizador — **Mejora**

- **Dónde:** § 7.
- **Qué veo:** R2.1 dice «se guarda al cambiarlo». El diseño no dice cuándo es «cambiarlo» para los
  márgenes y los días, que se escriben, ni para el deslizador de los días. La maqueta guarda al salir de
  la caja o con Enter, y el deslizador al soltarlo (`change`, no `input`). Si se manda en cada tecla o en
  cada paso del deslizador, se llega al límite de 30 por minuto y se llena Quién hizo qué.
- **Propuesta:** escribirlo en § 7: al salir o con Enter, el deslizador al soltar, y validar con el
  contrato antes de mandar (E28, E38).

### 1.6 Dos cambios seguidos del mismo ajuste dentro de los 5 segundos — **Mejora**

- **Dónde:** § 3, «Deshacer… es otro `PUT` con el valor anterior y la versión nueva».
- **Qué veo:** si la misma persona cambia dos veces el mismo ajuste antes de que se vaya el primer aviso,
  deshacer el primero lleva una versión vieja y da `409 changed` contra sí misma: «Lo cambió <usted>
  recién».
- **Propuesta:** que un cambio nuevo reemplace el aviso anterior, y que «Deshacer» sea siempre el del
  último cambio.

### 1.7 Errores del `PUT` que faltan — **Mejora**

- **Dónde:** § 3, errores.
- **Qué veo:**
  - E27 («ya hay un margen rápido de 200 %») no es un error de rango, y `400 invalid` «con el rango» no
    lo distingue. Hace falta un código propio (`duplicate`, con el valor).
  - El paso `readBody` de la plataforma contesta `400 bad-request` sin el rango (`guards.ts`). Si el
    esquema del contrato se valida ahí (§ 8), el `400 invalid` con el rango nunca sale.
  - El esquema depende de `:key`, y `readBody` corre antes de saber la clave.
- **Propuesta:** el paso valida solo la forma (`{ value, version, confirmed? }`). El valor se valida
  contra la clave en `rules.ts`, con `invalid` (rango) y `duplicate`.

### 1.8 Lo demás de la maqueta que el diseño no nombra — **Mejora**

- **Dónde:** § 7.
- **Qué veo:**
  - La maqueta tiene más atajos: «Deshacer» D, y Ctrl Z fuera de una caja de texto; «Cancelar» C y
    «Cambiar N precios» P; «Ahora no» A y «Reintentar» R cuando falla el recálculo; «Reintentar» R sin
    conexión; el indicador L. La R choca con la del redondeo y gana la de lo que está encima.
  - Durante el recálculo, los botones se traban, a los 300 ms se ve la marca de espera y a los 2 s la
    barra (00 · R7).
  - La hora del negocio avanza sola en la pantalla.
- **Propuesta:** nombrarlos en § 7. En la hora: que salga de `nowMs()` (la hora del servidor más el
  cronómetro, constitución VI), con un temporizador local que no pide nada y se frena con la aplicación
  oculta.

Lo demás (E01 a E04, E06, E07, E09 a E11, E13 a E17, E23 a E28, E30 a E40) tiene ruta, tabla, evento o
pantalla en el diseño.

## 2. Performance

### 2.1 Las consultas del `PUT` están mal contadas — **Mejora**

- **Dónde:** § 3 y § 9, «3: trabar la fila, escribirla y la auditoría».
- **Qué veo:**
  - La auditoría no es una consulta de PostgreSQL: es SQLite, escrita por tandas (ADR-004).
  - Faltan el comienzo y la confirmación de la transacción, que 02 sí cuenta.
  - Con `pairingDays` en baja, el `DELETE … RETURNING` de `device-link` corre dentro de la misma
    transacción (`events.ts`: los que reaccionan escriben en la transacción de quien publica).
  - El `409 changed` necesita el nombre de quien lo cambió: una consulta más.
  - Con la opción 1 de 1.1, sin trabar la fila: comienzo, una sentencia, confirmación; más una con
    `pairingDays` en baja y una con el `409`.
- **Propuesta:** contar así en § 9, y que las pruebas cuenten cada caso.

### 2.2 El `PUT` del redondeo y el `GET` de sus números, sin meta — **Mejora** (se cierra con 07)

- **Dónde:** § 9.
- **Qué veo:**
  - El `PUT` del redondeo dice «más lo de quien recalcula», sin milisegundos. Con 10.000 precios es el
    pedido más pesado del módulo, y la maqueta lo muestra con una barra que aparece a los 2 s.
  - «Una consulta que cuenta por paso en la base» repite la regla del redondeo en SQL: la misma cuenta
    estaría en `src/shared/` (E15 a E17) y en una consulta. Ver 4.2.
  - Recalcular todos los precios en una transacción traba las filas del catálogo mientras dura. Con
    ventas que escriben stock al mismo tiempo, esperan.
- **Propuesta:** anotar en § 12, como pendiente de 07, la meta del recálculo (por ejemplo, menos de 1 s
  con 10.000 precios), si se cuenta en SQL o en TypeScript, y qué pasa con las ventas mientras tanto.

### 2.3 `GET /api/administration/rounding` para quien no puede elegir — **Mejora**

- **Dónde:** § 3, permiso «Ninguno».
- **Qué veo:**
  - Con el catálogo son dos consultas sobre todos los precios, de hasta 100 ms. Las puede pedir sin
    límite cualquiera con sesión, y la pantalla las pediría cada vez que la abre quien vende.
  - En la maqueta, sin el permiso, «las opciones no se tocan ni se miran»: los números por paso no le
    sirven a quien no tiene el permiso.
- **Propuesta:**
  - Pedirla solo con el permiso, o solo los ejemplos sin él.
  - Ponerle un límite por sesión.
  - Con el catálogo, evaluar guardar los números en memoria y recalcularlos cuando cambia un precio.

### 2.4 Lo que no está contado — **Mejora**

- Al abrir la pantalla sin el permiso, la aplicación también pide
  `GET /api/permissions/:permission/holders`. Son tres consultas en paralelo en 02. No están en § 9.
- La carga de los ajustes al arrancar (una consulta) no está en § 9.
- La cabecera: § 6 dice «unos 4 bytes» y § 9 «unos 6 bytes por respuesta». Con `; a=` son unos 8. El
  campo solo hace falta con sesión, y hoy se sumaría también sin sesión.
- `/api/start` suma `businessTimeZone` (unos 45 bytes) en cada apertura: actualizar los 600 bytes de
  [mobile-data.md](../mobile-data.md).

### 2.5 El campo `a` casi no sirve, y suma un pedido automático — **Mejora**

- **Dónde:** § 6; § 12, 4.
- **Qué veo:**
  - La pantalla abierta y sin tocar no hace pedidos (constitución III), así que casi nunca recibe un
    `a` distinto. Lo que lo recibe es el `PUT`, y el `PUT` ya contesta `409 changed` con el valor nuevo
    (R2.3).
  - El `PUT` propio también cambia `a`: sin cuidado, la pantalla vuelve a pedir lo que acaba de guardar.
  - Ese pedido es automático: tiene que ir con `X-Auto` para no contar como uso de la sesión
    (01 · R3.3), y el diseño no lo dice.
- **Propuesta:**
  - Opción A: sacar `a` y el pedido automático, y que Carlos no tenga que aprobar otra fila en
    mobile-data.md. El choque lo resuelve el `409`, y el otro dispositivo, el espejo (1.2).
  - Opción B: si se deja, que la respuesta del `PUT` traiga la suma nueva, para no volver a pedir, y que
    el pedido vaya con `X-Auto`.

### 2.6 Espejar la opción sobre la que se pasa — **Mejora**

- **Dónde:** § 7, «la opción sobre la que se pasa (lo que muestra el panel)», espejada.
- **Qué veo:** por el servidor, cada cambio cuesta unos 750 bytes entre los dos (mobile-data.md). Pasar
  el mouse por las siete opciones del redondeo son unos 5 KB de datos móviles del celular, sin que nadie
  decida nada. La arquitectura espeja «lo elegido», no por dónde pasa el puntero.
- **Propuesta:** dejar la opción que se mira como valor local, con su comentario, o espejarla solo con
  el directo.

## 3. Simpleza

### 3.1 `administration` escucha su propio evento — **Mejora**

- **Dónde:** § 4, «lo escuchan `device-link`… y la memoria de `administration`, que se actualiza al
  confirmar».
- **Qué veo:** el patrón de eventos es para que un módulo reaccione a otro sin conocerlo. La memoria es
  del mismo módulo: alcanza con que el `PUT` la ponga al día después de confirmar (el `after` de
  `events.transaction`).

### 3.2 `onRounding(recalculator)`, una interfaz para un módulo que no existe — **Mejora**

- **Dónde:** § 1 y § 5, `onRounding(recalculator)` en la fachada; `PriceRecalculator` con contar,
  ejemplos y aplicar.
- **Qué veo:**
  - Es un registro nuevo, fuera de la lista de patrones de la constitución, salvo que se lo lea como
    estrategia.
  - Se diseña hoy contra un catálogo que no está escrito.
  - La forma que ya usa el proyecto para que dos módulos se usen sin ciclo es la inyección en
    `src/server/modules.ts`, con una función que se resuelve tarde
    (`accessCounts: (…) => signIn.accessCounts(…)`).
- **Propuesta:**
  - Opción A: recibir `prices` como dependencia en `createAdministrationModule`, de arranque «sin
    precios», como `users` recibe `accessCounts`.
  - Opción B: dejar en la etapa a solo «sin precios: se guarda sin preguntar» (E21) y escribir la
    confirmación y el recálculo con 07, cuando haya qué contar. Lo que no se usa hoy se escribe y se cubre
    al 100 % contra una prueba de mentira.

### 3.3 El `GET` devuelve quién y cuándo cambió cada ajuste — **Mejora** (también de seguridad)

- **Dónde:** § 3, `GET /api/administration`; § 8, «Qué datos toca».
- **Qué veo:** ninguna parte de la maqueta aprobada muestra, fuera del choque, quién cambió un ajuste
  ni cuándo. «Lo cambió <persona> recién» viene en el `409`. Devolverlo en el `GET` cuesta la única
  consulta de la ruta y le muestra a cualquiera con sesión algo que en Quién hizo qué pide
  «Ver quién hizo qué».
- **Propuesta:** el `GET` sin `changed_by` ni `changed_at`. Así no hace ninguna consulta y sale todo de
  la memoria. El nombre, solo en el `409`. Con eso, `changed_by` y `changed_at` pueden ser `not null`:
  una fila existe solo después de un cambio.

### 3.4 «Si quien pide puede cambiarlos» en el `GET` — **Mejora**

Lo repite de `can.ts` y de `/api/start`, que ya se ponen al día solos (ver 1.3).

## 4. Repetición

### 4.1 Las 24 horas de la cookie, escritas dos veces — **Mejora**

- **Dónde:** § 5, «La cookie de la sesión dura lo que la opción más larga (24 horas, en el
  `settings.ts` de `sign-in`)».
- **Qué veo:** la opción más larga ya está en el contrato (4, 8, 12, 24). Si alguien suma 48 al
  contrato y no toca `sign-in`, la cookie corta las sesiones a las 24 horas: E36 deja de andar sin que
  falle nada.
- **Propuesta:** `Max-Age` igual al máximo de las opciones de `sessionMax` del contrato, calculado, no
  escrito.

### 4.2 La cuenta del precio en la pantalla y en SQL — **Mejora**

- **Dónde:** § 5, `preview.ts`, «cuentas puras»; § 9, «una consulta que cuenta por paso en la base».
- **Qué veo:**
  - En la maqueta, el panel de los márgenes muestra «Vende a $ X» para un costo de ejemplo, y el del
    redondeo el ejemplo de $ 15.001 sin precios. Las dos cosas son costo × margen + redondeo: la regla del
    precio de 07.
  - La arquitectura la pone en `src/shared/pricing/`. El diseño dice solo «la regla del redondeo, en
    `src/shared/`» (§ 10), sin archivo, y `preview.ts` no nombra estos dos ejemplos.
  - Contar en SQL repetiría la misma regla otra vez.
- **Propuesta:**
  - Nombrar `src/shared/pricing/rounding.ts`, y que `preview.ts` lo use para los dos ejemplos. Si hace
    falta costo × margen, también en `pricing/`, no en la pantalla.
  - Para 07: decidir si contar en SQL justifica repetir la regla.

### 4.3 Llamadas y límites que ya existen — **Mejora**

- **Quién lo tiene:** `api.ts` dice «las tres llamadas», pero la pantalla usa una cuarta, la de quién lo
  tiene. Que use la llamada que ya tenga la aplicación de 02, no una copia.
- **El límite por sesión:** se arma con la clave `…:session:${id}`, como `users/guards.ts`. Dejarlo
  escrito, porque `limit` usa de arranque la dirección y el dispositivo (§ 8 dice «por sesión»).

## 5. Seguridad

### 5.1 `BUSINESS_TIME_ZONE` con el valor del propio diseño no arranca — **Frena**

- **Dónde:** § 5, «validada con `Intl.supportedValuesOf('timeZone')`; en `.env.example` y en el `.env`
  de pruebas, `America/Argentina/Buenos_Aires`».
- **Qué veo:** lo probé en este entorno (Node 22.22, que cumple `engines: >=22.13`):

  ```
  Intl.supportedValuesOf('timeZone').includes('America/Argentina/Buenos_Aires')  // false
  Intl.supportedValuesOf('timeZone').includes('America/Buenos_Aires')            // true
  Intl.supportedValuesOf('timeZone').includes('UTC')                             // false
  ```

  La lista trae los nombres canónicos de CLDR, no todos los de IANA. Con esa validación, el servidor no
  arranca con el valor que el diseño pone en el `.env`, y las pruebas tampoco. Además,
  `resolvedOptions().timeZone` devuelve `America/Buenos_Aires`: si algo compara nombres, no coinciden. No
  pude comprobarlo en Node 24, el de los Dockerfile.
- **Qué hace falta:** validar construyendo un formateador (`new Intl.DateTimeFormat('en', { timeZone })`
  dentro de un `try`), que acepta los alias, y una prueba con `America/Argentina/Buenos_Aires`. Decir
  también de dónde sale «Buenos Aires · UTC −3», que la maqueta muestra y el diseño llama «su nombre».

### 5.2 La clave de la dirección — **Mejora**

- **Dónde:** § 8, «la clave de la dirección se busca en la lista fija».
- **Qué veo:** si la lista es un objeto, `constructor`, `toString` o `__proto__` la encuentran.
- **Propuesta:** buscar en un `Map` o con `Object.hasOwn`, con su prueba. El cuerpo, con un esquema
  estricto que rechace campos de más.

### 5.3 Un valor guardado que el contrato ya no acepta — **Mejora**

- **Dónde:** § 2.
- **Qué veo:** si un capítulo futuro saca una opción (por ejemplo, $ 5.000), la fila guardada queda
  fuera de la lista. Al cargar la memoria, el diseño no dice qué pasa.
- **Propuesta:** validar al cargar. Opciones: no arrancar, con el motivo, o volver al valor de arranque
  y anotarlo en Quién hizo qué.

### 5.4 El recálculo como abuso — **Mejora** (con 07)

- **Dónde:** § 8, «30 por minuto por sesión».
- **Qué veo:** 30 recálculos completos por minuto son 30 transacciones sobre todos los precios.
- **Propuesta:** un límite más bajo para `roundingStep`, y anotar en el registro del servidor el
  `503 recalc-failed` con el motivo. Hoy no queda en ningún lado.

### 5.5 La zona en el `.env` se puede cambiar sin que quede nada — **Mejora** (para Carlos)

- **Dónde:** § 1, «La zona horaria sale del `.env`».
- **Qué veo:**
  - R5 no deja cambiar la zona «porque corre el día de las ventas y el cierre de caja». Con el `.env`,
    cambiarla es editar un archivo y reiniciar, sin aviso ni auditoría.
  - La constitución VIII dice que el `.env` lleva «lo que cambia entre ambientes». La zona no cambia
    entre pruebas y producción, sino entre instalaciones.
- **Propuesta:**
  - Opción A: el `.env` fija la zona la primera vez, el servidor la guarda en la base, y si después no
    coincide, no arranca y dice por qué.
  - Opción B: dejarla como está y que Carlos lo acepte en § 12.

Lo demás de § 8 está:

- Quién puede hacer cada cosa: el `403` en cada `PUT`, también en el que deshace.
- Los rechazos sin permiso, con el `permission.denied` que ya anota la plataforma.
- Secretos: ninguno nuevo.
- El permiso nuevo en el rol Administrador: comprobado en el código, `users/roles/access.ts` suma
  `permissionIds` al arrancar.

## 6. Fronteras

### 6.1 Cómo reciben `sign-in` y `device-link` la fachada — **Mejora**

- **Dónde:** § 1, «`sign-in` y `device-link` importan su fachada».
- **Qué veo:**
  - El proyecto conecta los módulos en `src/server/modules.ts`, pasando dependencias. `sign-in` importa
    de `users` solo los tipos y recibe la fachada al crearse.
  - `device-link` hoy no depende de ningún módulo.
  - El diseño no dice si `settings()` llega por esa vía ni el orden en que se crean. Hasta que cargó, no
    tiene que devolver los valores de arranque como si fueran los de la base.
- **Propuesta:**
  - `createSignInModule({ users, settings })` y `createDeviceLinkModule({ wait, settings })`, con
    `administration` creado antes.
  - `register` de `administration` espera la carga (puede ser asíncrono, `modules.ts`).
  - No pude encontrar un ciclo: `administration` necesita nombres de `users`, y `users` no importa a
    `sign-in` (recibe `accessCounts` por inyección).

### 6.2 `src/shared/time/business.ts` con estado que se fija — **Frena** (junto con 7.1)

- **Dónde:** § 5, «`setBusinessTimeZone(zone)` la fija una vez… y los formatos se arman con ella».
- **Qué veo:**
  - Hoy la zona es una constante, y `business.ts` arma sus dos `Intl.DateTimeFormat` al cargarse.
  - Cuatro archivos más la copian al cargarse: `app/modules/audit-log/logic.ts`
    (`const zone = { timeZone: businessTimeZone }`), `app/platform/time.ts` (parámetro por omisión),
    `app/modules/device-link/screens/Detail/texts.ts` y `app/modules/sign-in/offline/when.ts`.
  - Con un `let` que se fija después, todos quedan con la zona vieja o sin zona, según cuándo se cargan.
  - El diseño no los lista ni dice qué pasa si se formatea antes de fijarla.
- **Qué hace falta:**
  - Que `business.ts` exporte una función que lea la zona (`businessTimeZone()`) y arme sus
    formateadores la primera vez que se usan.
  - Que el diseño nombre los cuatro archivos que cambian.
  - Que se diga qué pasa antes de fijarla: un error o un valor de arranque, ver 7.1.

### 6.3 `/api/start` en `sign-in` — **Mejora**

- La zona es configuración de la plataforma (`config.ts`). `start-parts` solo manda partes con sesión, y
  la zona hace falta sin sesión. Por eso tiene sentido que la sume `sign-in` (dueño de `/api/start`):
  conviene decirlo, para que nadie lo mueva a una parte.
- Del lado de la aplicación, quien la fija al recibir `/api/start` tiene que estar en `platform/` o en
  `sign-in`, no en `administration`. El diseño no dice dónde.

## 7. Sin conexión, hora y escala

### 7.1 La aplicación abierta sin conexión no sabe la zona — **Frena**

- **Dónde:** § 1 y § 5, «la aplicación la recibe en `/api/start`»; § 7, «No se guarda nada en el
  dispositivo».
- **Qué veo:**
  - El celular con la entrada sin conexión (15) abre la aplicación sin `/api/start`. Sin la zona,
    `whenText` (`sign-in/offline/when.ts`, «hasta cuándo se puede entrar sin conexión», 15 · R2.1) y
    cualquier hora del marco no tienen con qué escribirse.
  - Con la venta sin conexión, el día de una venta también sale de ahí.
  - Hoy anda porque la zona está en el código.
- **Qué hace falta:**
  - Guardar la zona en el dispositivo al recibirla. No es del negocio ni secreta, así que cabe en
    `localStorage`, y hay que sumarla a la lista de la arquitectura («Los datos»).
  - Decir qué se usa la primera vez, antes de la primera respuesta.
  - Una prueba que abra sin conexión con la zona guardada.

### 7.2 Los días del vínculo, con precisión de un día — **Mejora**

- **Dónde:** § 5, «`viewOf` y la limpieza diaria leen `pairingDays`».
- **Qué veo:**
  - Fuera del momento del cambio, un vínculo vencido se termina recién con la limpieza diaria
    (`platform.every(day, …)`): puede vivir hasta un día más.
  - Con 30 días era un 3 % de más. Con el mínimo nuevo de 1 día, es hasta el doble.
  - R7.3 dice «se termina en su próximo contacto».
- **Propuesta:** que `pairingOf` (o `stillPaired`) mire también si `mirroredAt + días` ya pasó, y lo
  termine como vencido. Si no, la limpieza cada hora.

### 7.3 Limpiar sin escribir antes lo espejado — **Mejora**

- **Dónde:** § 4, la limpieza al recibir `settings.changed`.
- **Qué veo:** la última vez que espejaron se escribe por tandas cada minuto (`members.drainMirrored`).
  `sign-in` escribe antes de limpiar (`cleanUp` llama a `flush`). `device-link` no lo hace, ni en la
  diaria ni en la nueva. Un vínculo presentado hace 30 segundos, después de 20 días quieto, se borra al
  bajar a 15.
- **Propuesta:** escribir lo pendiente antes de limpiar, en las dos.

### 7.4 Las «8 horas como mucho» de otros diseños — **Mejora**

- **Dónde:** § 11, tarea 6, «los documentos».
- **Qué veo:** con el tope de 24 horas dejan de ser ciertas tres frases:
  - [sign-in.md](sign-in.md): «`Max-Age` igual al tope de la sesión», y «Las sesiones duran 8 horas
    como mucho: al día siguiente del despliegue…».
  - [device-link.md](device-link.md), `mirrored_at`: «Una sesión dura como mucho 8 horas, así que un
    espejo continuo se vuelve a presentar al menos una vez por sesión».
- **Propuesta:** sumar a la tarea 6 los diseños de 01 y 03, y la frase de `deviceLinkSettings` y de
  `signInSettings` («hasta que existan en Administración»). Hay que revisar si el argumento de 03 sigue
  valiendo con 24 horas y 1 día.

### 7.5 Escala — **Mejora**

- Los ajustes en memoria no se ponen al día en otra copia del servidor. Por la constitución IX, va en la
  lista de «Escala» de la arquitectura, con su salida (`LISTEN/NOTIFY`, como los vínculos).
- La fachada `settings()` ya sirve de interfaz.
- Con 100 personas, lo único que pesa es el recálculo (2.2). Los ajustes son cinco filas.

Hora: lo que guarda el servidor lleva su reloj (`changed_at`). Falta decir de dónde sale la hora del
negocio en la pantalla (1.8).

Sin conexión: Administración necesita conexión (constitución IV) y el diseño no guarda nada en el
dispositivo, como manda R1.6. Lo único que hay que sumar es la zona (7.1).

## 8. Mejoras y decisiones

### 8.1 Confirmar un número y aplicar otro — **Frena** (para que decida Carlos)

- **Dónde:** § 3, `409 confirm`: «si el número de ahora ya no es el que se vio, igual se aplica».
- **Qué veo:** R3.4 hace confirmar con «Cambiar 3.412 precios» porque cambia todos los precios del
  negocio. Aplicar otro número es una interpretación de la regla, y no está en § 12 («nada queda
  supuesto»).
- **Opciones:**
  1. Como propone el diseño. La diferencia es de un momento.
  2. La aplicación manda `confirmed: 3412`. Si ahora cambian otros, `409 confirm` con el número nuevo y
     se vuelve a preguntar. Cuesta una consulta, solo cuando cambió algo en el medio.

### 8.2 La historia de cada precio después de un redondeo — **Mejora** (para 07)

- **Dónde:** § 4, «en el redondeo, cuántos precios cambiaron».
- **Qué veo:** la constitución V dice que «la historia de un número (precio…) se lee de la auditoría».
  Con una sola acción que dice «cambiaron 3.412 precios», la historia de cada precio tiene que poder
  armarse sabiendo el paso de cada momento. Si no, hace falta una fila por precio.
- **Propuesta:** dejarlo anotado en § 12 como algo que decide 07.

### 8.3 `quickMargins` es un solo ajuste — **Mejora** (en una línea)

Dos personas que cambian márgenes distintos chocan (`409`). R2.3 lo acepta si los cinco son un ajuste,
y la maqueta los muestra como uno. Conviene decirlo en § 2, para que nadie los parta.

### 8.4 Lo que el diseño acierta y conviene no perder

- La cookie con el tope más largo, para que subir el tope alargue las sesiones abiertas (E36). El código
  de hoy (`cookie.ts`, `Max-Age` = 8 horas) lo rompería.
- Que `sign-in` lea los dos tiempos en todos los lugares. En el código son `sessions/store.ts` (al
  resolver, en `isOpen` y en `cleanUp`), `sessions/cookie.ts`, `access/listing.ts`, `access/lost.ts` y
  `access/counts.ts`. Conviene listarlos para que no quede ninguno con `signInSettings.session`.
