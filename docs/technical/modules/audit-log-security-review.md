# Revisión de seguridad · 05 · Quién hizo qué (`audit-log`)

## Paso 4: el diseño

Revisión independiente del [diseño](audit-log.md) desde el punto de vista de un atacante
(constitución, paso 4). Todavía no hay código del módulo. Leí la constitución, el
[capítulo 05](../../chapters/05-audit-log/rules.md) (R1 a R5, E01 a E39), su resumen y sus
pantallas, la [arquitectura](../architecture.md), el [ADR-004](../adr/ADR-004-audit-log-in-sqlite.md),
las partes de los diseños de [01](sign-in.md), [02](users.md) y [15](offline.md) y de sus revisiones de
seguridad que este diseño toca, y lo que ya existe: `src/server/platform/storage/audit.ts`,
`platform/guards.ts`, `platform/permissions.ts`, `platform/http.ts`, cada lugar donde hoy se llama a
`record` en `sign-in` y `users`, `users/rules.ts` y `users/roles/rules.ts` (cómo se limpian los
nombres), `src/app/sw.ts` y `platform/offline/worker.ts`, `deploy/Caddyfile` y `deploy/compose.yml`.
No hay revisión del diseño (`audit-log-design-review.md`) todavía.

- **Frena:** se puede entrar, ver o cambiar lo ajeno, o filtrar datos personales. Se resuelve antes
  de aprobar el diseño.
- **Mejora:** conviene hacerla; no frena.

## Resumen

El diseño parte bien: una sola ruta de lectura con sesión y permiso, ninguna que cambie o borre,
parámetros con zod y pasados a SQLite como parámetros, tamaño de página cerrado, texto armado con
trozos y no con HTML, la etiqueta del navegador de una lista cerrada, la dirección la que calcula la
plataforma (Caddy solo escucha en `127.0.0.1` y no le cree al navegador), nada guardado en el
dispositivo y nada de terceros. `/api` ya sale con `no-store` y el service worker no lo toca.

**No encontré nada que frene si se escribe lo que el diseño ya insinúa.** Lo que más importa es lo
que el diseño deja abierto y que, hecho de la manera más directa, abre un problema: quién figura como
autor de una acción que no trae sesión (1), qué datos de adentro salen ahora por primera vez del
servidor, contra lo que el diseño de 02 prometió (2), el permiso de la segunda ruta (3) y una
consulta que con fechas o un instante inventados puede crear archivos y dejarlos abiertos (4).

| # | Punto | Gravedad |
|---|---|---|
| 1 | Quién es el autor: «sin sesión, `outsider`» no sirve para las entradas, y si cada módulo lo pisa a mano se puede anotar a nombre de otro | Mejora importante |
| 2 | La lectura muestra por primera vez el identificador del dispositivo (en `targets` y en `data.key` de los límites) y lo que haya en `data`; el diseño de 02 dice que no salen nunca | Mejora importante |
| 3 | `GET /api/audit-log/people` no dice que pide el permiso ni el límite, y sus pruebas no están en § 10 | Mejora importante |
| 4 | Fechas, `around` y `page` sin tope: abrir un año que no existe puede crear el archivo, y el `OFFSET` grande traba el proceso | Mejora importante |
| 5 | «Algo salió mal» con la pantalla abierta se lleva correos y direcciones ajenas: el diseño no marca `data-private` | Mejora importante |
| 6 | Mirar no se anota: una sesión de Administrador robada se baja el registro entero sin dejar rastro | Mejora, lo decide Carlos |
| 7 | Las 8 KB: «se rechaza» o «se anota cortada» no es lo mismo, y lo primero sirve para que una acción no quede | Mejora |
| 8 | `node:sqlite` es sincrónico: cada consulta para todo el servidor | Mejora |
| 9 | La consulta abre los archivos con la misma conexión que escribe | Mejora |
| 10 | Detalles: `audit-log.throttled` falta en el catálogo, `strip` falta en la validación, las filas viejas, el dispositivo es lo que dice el navegador, el espejo, la falla conocida de `node:sqlite` | Mejora |

### 1 · Quién es el autor de una acción sin sesión (§ 2, «`guards.record`») — Mejora importante

**Dónde:** § 2 dice que `guards.record` pone como `actor` la persona de la sesión y, sin sesión,
`outsider`; «el módulo pone `targets`, `changes`, `names` y `data`».

**El problema, en dos partes:**

1. **Las entradas no tienen sesión en el pedido.** `sign-in.succeeded` (`sessions/open.ts:73`),
   `code.approved` (`codes/phone/approve.ts:88`, ruta sin `sessions.require`) y
   `sign-in.offline-confirmed` (`offline/routes.ts:131`) se anotan en pedidos donde la persona
   todavía no tiene sesión: la probó con Google, con la huella o con la firma de la entrada sin
   conexión. Con la regla tal cual, la entrada de Marcos figura como de «Alguien sin entrar», y el
   filtro «Hecho por: Marcos» no la muestra. Quien lo programe va a tener que dejar que el módulo
   diga el `actor`, y el diseño no dice cuándo puede.
2. **Si el módulo lo dice libre, se anota a nombre de otro.** Hoy los módulos pasan `userId` como
   quieren, y hay casos donde ese `userId` no está probado: `passkeys/webauthn.ts:155` a `:159` anota
   `sign-in.rejected` con `userId: passkey.userId` cuando **la firma no verificó**, es decir, cuando
   alguien que no es Marcos usó la credencial de Marcos. Pasado a la forma común como `actor`, la
   lista dice «Marcos usó una huella que no se conoce» y aparece en «Hecho por: Marcos». El ataque
   necesita el identificador de la credencial de Marcos, que hoy no sale del servidor (revisión de
   02, punto 6): **no pude armar uno completo hoy**, pero alcanza con que el punto 2 lo deje salir o
   con un módulo futuro que copie el patrón. Es el mismo error que la revisión de 15 encontró en
   `sign-in.offline-repeated` (punto 11), ya corregido.

**Qué propongo:** que § 2 diga la regla: el `actor` es una persona solo si es la de la sesión del
pedido **o** la que el pedido acaba de probar (pase de Google verificado, firma de huella
verificada, firma de la entrada sin conexión verificada); si no, `outsider`, y la cuenta que se
intentó usar va en `targets`. Que `guards.record` reciba ese caso como un campo aparte
(`provenUserId`, o un `actor` que solo acepta el tipo que devuelve la verificación) y no como un
`userId` cualquiera. Una prueba por cada rechazo de entrada: una firma que no verifica no deja a la
víctima como autora. Cuesta: un párrafo, un tipo y unas pruebas en la tarea 2.

### 2 · Lo que sale por primera vez del servidor (§ 2 `targets` y `data`, § 5 la respuesta) — Mejora importante

**Dónde:** § 2 suma `device` como tipo de `targets`; § 5 devuelve `targets`, `changes` y `data` tal
cual se anotaron. El diseño de 02 (§ 9) dice: «Los identificadores de los dispositivos y de las
huellas no salen nunca: la aplicación ve otros, opacos», y la API de 02 los esconde a propósito
(`access/lost.ts:56` saca `deviceId` de la respuesta).

**Qué sale:**

- **El `device_id` crudo**, si `targets` de `phone.cut` o `passkey.removed` lleva el del celular.
- **`data.key` de cada límite pasado** (`guards.ts:41`): la clave es `passkey:device:<X-Device-Id>`,
  `failed:google:<correo>`, `users:session:<id de sesión>` o `session:unknown:<dirección>`. O sea: el
  identificador del dispositivo de quien llegó al límite, y el correo de un intento.
- **Lo que cada módulo meta en `data`**, que es libre. Hoy no encontré secretos (ni el hash del
  pase, ni la llave de prueba, ni la credencial), pero nada lo controla.

**El ataque, con el `device_id`:** quien tiene «Ver quién hizo qué» (o una sesión robada de quien lo
tiene) abre los `sign-in.throttled` o los celulares cortados, copia el `X-Device-Id` del celular de
Lucía y, desde cualquier lado, sin sesión, manda 20 pedidos por minuto a la entrada con huella con
esa cabecera: el límite por dispositivo (01 · R2.9) la frena minuto a minuto. Es el mismo bloqueo
que la revisión de 02 (punto 6) cerró; hace falta el permiso, por eso no frena.

**Qué propongo:** que § 2 y § 5 digan qué no sale nunca en la respuesta: `device_id`, el
identificador de la credencial, el hash del pase, la llave de prueba y el texto de las claves del
límite. En `targets`, el celular va con el `public_id` de su huella o de su sesión (como en 02), y
en `data` de un límite, el tema y el tipo de clave («por dispositivo», «por cuenta»), no la clave.
Una lista cerrada de campos de `data` por tipo en el catálogo (lo que el texto usa, R2.1), y una
prueba que anota cada tipo de hoy y mira que la respuesta no trae ningún UUID de dispositivo ni de
credencial. Cuesta: unas líneas en § 2 y § 5, el mapeo en la tarea 2 y una prueba.

### 3 · `GET /api/audit-log/people` (§ 5, «Las personas del filtro») — Mejora importante

**Dónde:** § 5 dice que la primera ruta pide sesión y `audit-log.view`; la segunda, que devuelve
**el nombre y el correo de todas las personas, también las dadas de baja y las borradas**, aparece
en un punto aparte sin decir qué pide. § 10 prueba «las rutas (con y sin permiso)» sin nombrarla, y
§ 8 dice «la consulta, como mucho 60 por minuto», en singular.

**El ataque, si se programa leyendo solo eso:** un Vendedor con sesión pide
`/api/audit-log/people` y se lleva el correo de cada persona que pasó por el sistema, incluso de las
borradas, que en Usuarios ya no ve. Sería frena; queda en mejora porque el resto del diseño lo
insinúa.

**Qué propongo:** que § 5 diga que `/people` pide sesión, `audit-log.view` y el mismo límite que la
consulta, y que § 10 tenga para ella la prueba sin permiso (`403`, sin datos, `permission.denied`
anotado). Aparte, para Carlos: el correo de una persona **borrada** (02 · R3.7, «desaparece del
todo») queda para siempre en `names.sqlite` y se sigue mostrando; E30 pide el nombre, no el correo.
Se puede mostrar el correo solo de las que siguen en PostgreSQL y, para las borradas, el nombre con
«(borrada)». Cuesta: dos líneas y una prueba.

### 4 · Fechas, `around` y `page` sin tope (§ 5, la tabla de parámetros y «La consulta, sobre los años») — Mejora importante

**Dónde:** `from`/`until` piden «fecha real, `from ≤ until`», sin tope; `around` es «entero», sin
tope; `page` llega a 100.000. El paso 1 de la consulta toma «los años del período». Hoy
`yearFiles.open(year)` (`storage/audit.ts:67` a `:75`) **crea el archivo** si no existe y lo deja
abierto en un `Map` sin tope.

**El ataque:** quien tiene el permiso (o su sesión robada) pide `from=0001-01-01&until=9999-12-31`,
o `around` con instantes de años distintos (`around=-62135596800000`, `around=8639999999999999`…).
Si la consulta abre cada año con `open`, crea miles de `<año>.sqlite` vacíos en el volumen de la
auditoría (`-271821.sqlite` incluido) y deja un descriptor abierto por cada uno, hasta que el
proceso se queda sin descriptores y **deja de poder escribir la auditoría** (y de abrir conexiones).
Además corre `alter table` sobre cada uno. Con `page=100000` y `size=20`, cada año que toca hace un
`OFFSET` de hasta 2 millones de filas, que en un proceso sincrónico (punto 8) traba todo.

**Qué propongo:** que la consulta mire solo los archivos que ya existen (listar la carpeta una vez,
o `exists` antes de abrir) y los abra sin crearlos; `from` y `until` entre el año del archivo más
viejo y mañana, `around` dentro de eso, y una `page` mayor que `pages` responde vacío sin consultar.
Mejor que el `OFFSET`, paginar por `(at, id)` del último que se vio, o al menos limitar `page` a
`pages`. Una prueba con un período de 9.000 años que mira que la carpeta no cambió. Cuesta: unas
líneas en la tarea 3.

Aparte, no de seguridad, para la revisión del diseño: los archivos se eligen por el año **UTC** de
`at` (`audit.ts:38`); un día del negocio del 31 de diciembre después de las 21 está en el archivo del
año siguiente, y la consulta tiene que convertir el período a años UTC, no a años del negocio.

### 5 · «Algo salió mal» con la pantalla abierta (§ 7, § 8) — Mejora importante

**Dónde:** el diseño de 01 (§ 10) y el de 02 (§ 8) marcan con `data-private` lo que muestra datos
personales, para que la captura de «Algo salió mal» (00 · R9.4) lo tape y los últimos pasos no lo
lleven. Este diseño no lo dice, y es la pantalla que más datos ajenos muestra: nombres, correos de
intentos, direcciones de internet y navegadores de todos.

**El ataque, sin mala intención de nadie:** un Administrador tiene Quién hizo qué abierto y algo
falla. Toca «Avisar y seguir»: la captura y los últimos pasos guardan en el dispositivo, y con el
módulo 12 mandan a quien lea los avisos, los correos y las direcciones de quienes aparecen en la
página. Quien lee los avisos no necesita tener «Ver quién hizo qué».

**Qué propongo:** que § 7 diga que `Ledger`, `Detail`, `Filters` (las listas de personas) y los
trozos `persona` del catálogo llevan `data-private`, y que la pantalla entera no entra en los
últimos pasos más que por el nombre de la acción (`audit-log.filter`, sin el valor). Una prueba de
pantalla como la de E65 de 02. Cuesta: unas marcas y una prueba.

### 6 · Mirar no se anota (R1.3, § 8 «Lo que queda en la auditoría») — Mejora, lo decide Carlos

**Dónde:** R1.3 dice que abrir Quién hizo qué no deja nada; el diseño lo cumple.

**El riesgo:** alguien se lleva la sesión de un Administrador (una computadora del mostrador que
quedó abierta, la cookie de una sesión de 8 horas). Con 60 consultas por minuto de a 20, se baja
1.200 acciones por minuto, o va directo a las que le interesan con «Hecho a». Se lleva correos,
direcciones de internet y quién tiene qué celular, y **no queda nada**: la auditoría, que es la que
tendría que decir qué pasó, no sabe que alguien la leyó. El límite pasado sí se anota, pero quien no
lo pasa no deja rastro.

**Alternativas, para Carlos:** (a) dejarlo como está, que es lo que eligió y no multiplica el
registro; (b) una sola línea por sesión y por día al abrir la pestaña («Abrió Quién hizo qué»), que
son unas pocas por día y dicen quién miró y desde dónde; (c) además de (b), una línea cuando una
sesión pasa de cierta cantidad de páginas en una hora. Cuesta: (b) unas líneas y un tipo en el
catálogo; cambia R1.3, así que la decide él.

### 7 · Las 8 KB (§ 2, «Lo que no entra») — Mejora

**Dónde:** «se rechaza una acción de más de 8 KB (se anota cortada, con `data.truncated: true`)».

**El problema:** «se rechaza» se puede leer como «no se anota». Si alguien logra que su acción pese
más de 8 KB (un rol con muchos permisos y una descripción larga, cuando el catálogo sume campos más
largos), su cambio queda hecho y sin línea: justo lo que la auditoría no puede permitir (R1.1).
Tampoco dice qué se corta: si se corta `targets`, la acción queda sin a quién.

**Qué propongo:** «nunca se deja de anotar»: se conservan siempre `type`, `actor`, `targets` (con
los nombres cortados) y las claves de `changes`; se cortan primero los valores de `data` y después
los de `changes`, y se marca `truncated`. Una prueba con una acción de 20 KB que mira que la línea
está y dice a quién. Cuesta: unas líneas.

### 8 · `node:sqlite` es sincrónico (§ 9) — Mejora

`DatabaseSync` bloquea el proceso mientras consulta. La meta es menos de 150 ms por pedido; con 60
por minuto por sesión, una sola sesión puede tener ocupado el servidor un 15 % del tiempo, y dos
pestañas o dos sesiones del mismo Administrador lo doblan, mientras el mostrador espera para cobrar.
El ADR-004 prevé hasta 30 veces más acciones con 100 personas: ahí la meta deja de valer. No es un
ataque de alguien sin permiso; es un techo que conviene escribir.

**Qué propongo:** que § 9 diga el peor caso que se prueba (todos los filtros, el período más largo,
la última página) y que el límite sea por persona y no por sesión. Si la meta no se cumple con
30 veces más, mover la consulta a un `Worker` con su propia conexión de solo lectura (punto 9).
Cuesta: una línea ahora; el `Worker`, si hace falta, cuando haga falta.

### 9 · La consulta usa la conexión que escribe (§ 3, § 5) — Mejora

§ 8 dice que «la tabla se abre solo desde la plataforma, que solo inserta», pero la consulta nueva
va a usar las mismas conexiones de `yearFiles`, que pueden escribir. No hay inyección (todo va como
parámetro), así que no encontré cómo aprovecharlo; es defensa en profundidad: que `audit-query.ts`
abra sus propias conexiones con `new DatabaseSync(file, { readOnly: true })`, así un error en un
filtro nunca puede cambiar una fila. Cuesta: unas líneas; WAL deja leer mientras se escribe.

### 10 · Detalles — Mejora

- **`audit-log.throttled`** (§ 8) no está en la tabla de tipos de § 4: la prueba del catálogo
  fallaría, o se mostraría como «Otros». Sumarlo a Rechazos, ámbar, con su ícono.
- **`strip=1`** (§ 5) no está en la tabla de parámetros. Sumarlo («`1` o nada») y que la validación
  rechace parámetros que no conoce, para que E39 valga para todos.
- **Las filas viejas** (§ 3, `actor_kind`): «0 si tienen `user_id`» deja como autores a las
  víctimas de los rechazos viejos (`sign-in.rejected` con la huella, punto 1). Solo hay datos en el
  ambiente de pruebas; basta con que los tipos de rechazo de entrada viejos se lean como `outsider`
  con la persona en `targets`.
- **El dispositivo es lo que dice el navegador** (R2.6, § 2 `device`): la etiqueta sale de una
  lista cerrada, pero «celular» o «computadora» y el navegador salen de `User-Agent` y
  `Sec-CH-UA-Mobile`, que cualquiera cambia. El detalle no debería presentarlos como prueba; la
  dirección, sí, la calcula la plataforma. Una línea en § 8.
- **El espejo** (§ 7, «con el 03»): las acciones con nombre que viajen al otro dispositivo llevan
  solo el filtro o la página, nunca el contenido de una acción; el otro lado pide con su propia
  sesión y su permiso. Una línea, para que el 03 no lo tenga que adivinar.
- **`node:sqlite`:** no trae dependencias nuevas, pero tiene una falla conocida,
  [CVE-2026-58041](https://stack.watch/vuln/CVE-2026-58041/) (un iterador viejo de
  `DatabaseSync#createTagStore()` puede correr una sentencia con parámetros nuevos), arreglada en las
  versiones de seguridad de julio de 2026 de Node 22, 24 y 26. El diseño no usa `createTagStore`; no
  pude comprobar qué versión de Node trae la imagen fijada por huella en `deploy/server.Dockerfile`.
  Proponer: no usar `createTagStore` y confirmar la versión al construir la imagen (`node --version`
  en el armado).

## Por tema, en una línea

1. **Entrar sin permiso:** el módulo no abre sesiones ni maneja pases; lo único es quién figura como
   autor de una entrada (punto 1).
2. **Permisos:** la consulta, bien; `/people` no lo dice (punto 3). El permiso se lo puede dar quien
   tiene «Administrar roles» (02 · R7.3, decidido por Carlos) y queda anotado como `role.changed`.
   No hay ruta que cambie ni borre. `by` y `to` validan solo la forma, así no sirven para saber si
   una persona existe.
3. **Lo que entra de afuera:** parámetros con zod y como parámetros de SQLite; falta el tope de las
   fechas, de `around` y de `page` (punto 4) y el de lo que se anota (punto 7).
4. **La aplicación en el navegador:** texto por trozos, sin HTML; Biome prohíbe
   `dangerouslySetInnerHTML`; los nombres y los roles ya se limpian de caracteres de control y de
   formato (`\p{Cc}`, `\p{Cf}`), así que un nombre no puede dar vuelta el texto de la línea; nada se
   guarda en el dispositivo; `/api` no pasa por el service worker; CSP y `frame-ancestors 'none'` ya
   están. Falta `data-private` (punto 5). Un pedido desde otro sitio no puede leer la respuesta: es
   un `GET` con cabeceras propias, sin CORS.
5. **Datos personales y secretos:** sin secretos; lo que sale de más, punto 2; el correo de las
   borradas, punto 3; nada va a terceros.
6. **Abuso y disponibilidad:** el límite por sesión está; faltan los topes del punto 4 y el techo
   del punto 8. Sin sesión no se llega a nada del módulo.
7. **Sin conexión:** no hace nada sin conexión; la hora del celular solo se muestra marcada (E09) y
   la lista se ordena por la del servidor.
8. **Auditoría:** se anotan el límite pasado y el pedido sin permiso; mirar no (punto 6). Quien entra
   a la máquina puede cambiar los archivos: el diseño lo deja para T116, y está bien escrito así.
9. **El despliegue:** no cambia nada: el volumen `audit-data` ya existe, el servidor corre sin
   privilegios y Caddy solo escucha en `127.0.0.1`.
10. **Dependencias:** ninguna nueva; los íconos se copian de Lucide como dibujos, sin código; la falla
    de `node:sqlite`, en el punto 10.

## Paso 7: el código

Revisión del código contra el [diseño](audit-log.md) corregido, desde el punto de vista de un
atacante. Leí `src/server/modules/audit-log/` (rutas, reglas, registro), `platform/storage/audit/`
(forma común, escritura, codificación, archivos, consulta, hilo de lectura), `platform/guards.ts`,
`platform/device.ts`, `platform/http.ts` y `platform/permissions.ts`, el catálogo
(`src/shared/audit-log/`), el contrato (`src/shared/contracts/audit-log.ts`), `src/shared/time/business.ts`,
la pantalla (`src/app/modules/audit-log/`, con `frame/notices/crash/crash.ts`, que es quien usa
`data-private`), cada lugar que anota en `sign-in` y `users` (commits desde `ba71e9d`), sus pruebas y
`deploy/server.Dockerfile`. Corrí las pruebas del módulo (74, todas pasan), `pnpm audit --prod` («No
known vulnerabilities found») y una prueba de ataque propia, temporal y ya borrada, contra las tres
rutas con el kit de roles. No hay dependencias nuevas (`package.json` y el lockfile no cambiaron).

### Resumen

**No encontré nada que frene.** Las tres rutas piden sesión, `audit-log.view` y el límite por
persona, en ese orden; ninguna cambia ni borra; los parámetros pasan por un `strictObject` de zod con
topes y llegan a SQLite siempre como parámetros; la lectura abre los archivos de solo lectura y solo
si existen; el autor sale de la sesión o de una verificación, y una firma que no verifica queda como
«alguien sin entrar»; la hora la pone siempre la plataforma; `data` sale filtrado por el catálogo y
las claves de los límites no se anotan; la pantalla pinta todo como texto, no guarda nada en el
dispositivo y marca con `data-private` lo que muestra personas.

Lo que más importa: el rastro de «Abrió Quién hizo qué», que el diseño puso como defensa contra una
sesión robada, se saltea usando `/day` o `/people` (11), y el hilo de lectura, si se cae, tira el
servidor entero (12).

| # | Punto | Gravedad |
|---|---|---|
| 11 | `/api/audit-log/day` y `/people` no anotan `audit-log.opened`: se baja el registro entero sin dejar rastro | Mejora importante |
| 12 | El hilo de lectura no tiene quién atienda su caída: si se muere, se cae el servidor (comprobado) o los pedidos quedan colgados; la memoria de los totales no tiene tope | Mejora importante |
| 13 | `provenPerson` lo puede llamar cualquier módulo, y no hay prueba de que una firma de huella que no verifica deje `outsider` | Mejora |
| 14 | La prueba de «no salen identificadores» mira un solo tipo y la palabra `deviceId`; `targets` sale sin filtrar | Mejora |
| 15 | `request.rejected` muestra `path` (lo elige alguien sin entrar, hasta 8 KB), y con IPv6 se escriben filas sin tope | Mejora |
| 16 | Detalles: `type=constructor` da 200, `/day` acepta el año 0, la imagen no dice su versión de Node | Mejora |

### 11 · Mirar por `/day` o `/people` no deja rastro (`modules/audit-log/routes.ts:94` a `:122`) — Mejora importante

**Dónde:** `opened(c, day)` se llama solo en `GET /api/audit-log` (línea 98). `GET /api/audit-log/day`
y `GET /api/audit-log/people` no lo llaman. El diseño (§ 9 y § 12.3) justifica el registro así: «si
alguien usa una sesión robada para bajar el registro, queda el rastro de quién y desde dónde».

**El ataque:** alguien queda frente a la computadora del mostrador con la sesión abierta de un
Administrador (o se lleva esa sesión). Abre la consola del navegador y, sin tocar la pestaña Quién hizo
qué, pide `fetch('/api/audit-log/day?date=2026-10-01', { headers })` con las mismas cabeceras que manda
la aplicación, una vez por día, y una vez `/api/audit-log/people`. Cada pedido de `/day` devuelve
**todas** las acciones del día (hasta 2.000), con correos de intentos, direcciones de internet y quién
tiene qué celular; `/people`, el nombre y el correo de cada persona. Con el límite de 60 por minuto se
lleva dos meses por minuto, y en la auditoría no queda nada: ni `audit-log.opened` ni, si no pasa de
60 por minuto, `request.throttled`. Lo comprobé con el kit de roles: una persona con el permiso pide
`/day` (5 acciones) y `/people` (2 personas, con sus correos) y `audit-log.opened` queda en 0.

No frena porque quien pide tiene el permiso (o su sesión); pero la única defensa que el diseño puso
para ese caso no la cubre, y es la ruta que más datos da por pedido.

**Qué propongo:** llamar a `opened(c, today())` también en `/day` y en `/people` (es el mismo
conjunto en memoria, así sigue siendo una vez por sesión y por día), y que la prueba de E05b pida solo
`/day` con una sesión nueva y mire que quedó una línea. Cuesta: dos líneas y una prueba; hay que
ajustar la prueba actual de E05b, que hoy espera que `/people` no sume (sigue siendo una sola en el día).

### 12 · El hilo de lectura sin red (`platform/storage/audit/reader.ts:406` a `:433`, `query.ts:220` a `:231`) — Mejora importante

**Dónde:** `threadReader` crea el `Worker` y escucha solo `message`. No escucha `error` ni `exit`, no le
pone `resourceLimits` y los pedidos esperando no tienen tiempo máximo.

**Qué pasa si el hilo se muere:**

- Si muere por un error que no se atrapa adentro (se queda sin memoria, una falla de SQLite), Node
  emite `error` en el `Worker` del hilo principal y, sin nadie que lo escuche, **termina el proceso
  entero**: se cae el servidor, el mostrador y la entrada, no solo Quién hizo qué. Lo comprobé en Node
  22.22 con un hilo que se queda sin memoria: `Error [ERR_WORKER_OUT_OF_MEMORY] … Unhandled 'error'
  event` y el proceso sale con 1. `main.ts` no tiene `uncaughtException`.
- Si muere de otra forma (`exit` sin `error`), cada `ask` posterior manda un mensaje que nadie lee y
  su promesa no termina nunca: los pedidos quedan colgados con la conexión abierta.

**Cómo se lo hace crecer:** `closedTotals` (`query.ts:221`) guarda un total por año cerrado y por
`JSON.stringify(filter)`, sin tope. El filtro lleva las fechas en milisegundos y el `by`/`to`, que
solo se validan por la forma (cualquier UUID sirve). Quien tiene el permiso varía `from`, `until`, `by`
y `to` en cada pedido; desde que exista el archivo de un año cerrado (enero de 2027 en adelante), cada
pedido suma al menos una clave por año cerrado, y `daysWith` una más por cada día de la página que caiga
en un año cerrado. Con 60 por minuto el crecimiento es lento (no lo medí; del orden de cientos de
claves por minuto por persona), así que **no pude armar una caída en un tiempo corto**; queda como
camino, junto con cualquier otra causa de muerte del hilo.

**Qué propongo:** (a) escuchar `error` y `exit` del `Worker`: rechazar los pedidos que esperan, anotar
el error en el registro y volver a crear el hilo (con una espera, para no girar si falla al arrancar);
(b) `resourceLimits: { maxOldGenerationSizeMb: … }` para que el hilo no se lleve la memoria del
proceso; (c) un tiempo máximo por pedido (por ejemplo, 10 s) que contesta `503`; (d) tope a
`closedTotals` (un `Map` que borra la clave más vieja al pasar de, por ejemplo, 1.000), o guardar solo
los totales sin `by`/`to`/fechas a medida. Una prueba que mata el hilo (`worker.terminate()` desde
afuera, o un pedido que lo hace salir) y mira que el siguiente pedido contesta y el proceso sigue.
Cuesta: unas 30 líneas en `reader.ts`, una en `query.ts` y una prueba.

### 13 · Quién arma un `Proven` (`platform/guards.ts:22` a `:32`) — Mejora

**Dónde:** el tipo `Proven` tiene una marca, pero `provenPerson(userId)` es una función exportada que
cualquiera puede llamar con cualquier `userId`: la marca la pone esa misma función con un `as`. El
diseño (§ 2.1) dice «un tipo que solo arman esas verificaciones». Hoy la usan solo lugares donde la
persona está probada (lo revisé uno por uno: `sessions/open.ts:77`, `sessions/routes.ts:33` y `:51`,
`passkeys/webauthn.ts:137` y `:142`, `codes/phone/approve.ts:93`, `codes/phone/phone-routes.ts:68`,
`offline/routes.ts:133`), y `checkAssertion` (`webauthn.ts:158` a `:166`) anota la firma que no verifica
como `outsider` con la cuenta en `targets`. Está bien hoy.

**El riesgo:** un módulo que venga (el 07, el 03) copia `provenPerson(body.userId)` en un rechazo y
vuelve el error que cerró el punto 1 del paso 4: una acción a nombre de la víctima. Nada lo frena: ni
el tipo ni `pnpm imports`. Además, **no hay prueba** de que una firma de huella que no verifica deja
`outsider` y a la cuenta en `targets` (§ 11 del diseño, E03 y E04, lo promete): las pruebas de
`sign-in` miran `outsider` solo con Google.

**Qué propongo:** una regla de `dependency-cruiser` que deje importar `provenPerson` solo desde
`modules/sign-in/` (o mover la función a `sign-in` y que la plataforma solo exporte el tipo), y una
prueba en `passkeys` que manda una firma que no verifica con la credencial de otra persona y mira la
línea: `actor.kind === 'outsider'`, `targets[0].id` la víctima, y que «Hecho por» la víctima no la
muestra. Cuesta: una regla y una prueba.

### 14 · Lo que no sale, probado a medias (`routes.test.ts:230` a `:235`, `rules.ts:332` a `:366`) — Mejora

**Dónde:** la prueba «no sale lo que el tipo no muestra, ni identificadores de dispositivos» pide solo
`type=sign-in.succeeded` y mira que el texto no tenga la palabra `deviceId`. El diseño (§ 2.2) pide que
«una prueba anota cada tipo de hoy y mira que la respuesta no trae ningún identificador de dispositivo
ni de huella». `viewOf` filtra `data` con `shownData`, pero `targets` y `changes` salen como se
anotaron.

**El riesgo:** hoy no sale nada de eso (revisé cada `record`: `targets` lleva solo personas y roles;
`phone.cut` y `passkey.removed` llevan en `data` `{ sessions, passkey: boolean }`). Pero si un módulo
anota un `target` `{ kind: 'phone', id: deviceId }`, el `X-Device-Id` de un celular sale por la API y
vuelve el bloqueo del punto 2 del paso 4, y ninguna prueba lo ve: la palabra `deviceId` no aparece en
el valor.

**Qué propongo:** que la prueba haga, con un mismo dispositivo de prueba de `X-Device-Id` conocido,
cada acción que anota algo (las de `audit-catalog.test.ts`), y busque **el valor** de ese UUID y el id
de la credencial en todo el JSON de `/api/audit-log`, `/day` y `/people`. Si se quiere un cerrojo en el
código, que `viewOf` deje salir solo los `kind` de `targets` que el catálogo conoce. Cuesta: una prueba
algo más larga; el cerrojo, unas líneas.

### 15 · `request.rejected` con `path` (`shared/audit-log/platform.ts:142` a `:149`, `platform/http.ts:307` a `:326`) — Mejora

**Dónde:** el catálogo deja salir `path` de `request.rejected`, y ese camino lo elige cualquiera sin
sesión. La pantalla no lo dibuja (el texto no lo usa), pero la API lo devuelve. El rechazo se anota
una vez por ventana **por motivo y por dirección**.

**El ataque (de 01, que este módulo hace visible):** alguien sin entrar, desde una conexión con un
`/64` de IPv6, manda `GET /api/<8.000 caracteres al azar>` sin `X-Device-Id`, cada vez desde otra
dirección del `/64`. Cada una deja una fila nueva de `request.rejected` de hasta 8 KB (el azar no se
comprime), sin tope: llena el volumen de la auditoría, infla «Rechazos» en el resumen y entierra entre
miles de líneas ámbar lo que sí importa. No pude comprobar si la máquina de producción recibe IPv6; la
revisión de 01 ya propuso contar IPv6 por `/64`.

**Qué propongo:** cortar `path` a unos 200 caracteres al anotarlo (en `http.ts` y en
`permissions.ts`), y retomar lo de 01: la clave de `rejected:` por `/64` en IPv6 y un tope global de
`request.rejected` por minuto (pasado, una sola línea «y N más»). Cuesta: una línea para el corte; el
`/64` y el tope global, unas líneas en `http.ts` y una prueba.

### 16 · Detalles — Mejora

- **`type` con nombres de `Object.prototype`** (`shared/audit-log/index.ts:34`): `entryOf` hace
  `catalog[type] ?? unknown`, así que `?type=constructor`, `toString` o `__proto__` no dan `400` (E39)
  sino `200` y una lista vacía (comprobado). No lleva a nada; si un tipo así llegara a la base,
  `shownData` fallaría con `shows` indefinido. Usar `Object.hasOwn(catalog, type)`. Una línea.
- **`/day` sin fecha mínima** (`routes.ts:116` a `:122`): el diseño dice «Como `from`» (desde el
  2020-01-01), pero solo se mira que no sea después de hoy. `?date=0000-01-01` contesta `200` con una
  semana de días `"-000001-12"` (comprobado: `addDays` no sabe de años antes del 0). No abre ni crea
  archivos; rechazar antes de `firstDate`. Una línea, y sumarla a la prueba de E39.
- **`by` y `to`** se validan solo por la forma, no contra `people.v1.sqlite` como dice § 5. Está bien
  así (no sirven para saber si alguien existe); que el diseño diga eso.
- **La versión de Node de la imagen:** § 9 dice que el armado la dice, y `server.Dockerfile` no tiene
  `node --version`. La comprobé a mano: la imagen fijada trae Node 24.22.1, posterior a 24.18.1, la
  primera de la línea 24 sin [CVE-2026-58041](https://nvd.nist.gov/vuln/detail/cve-2026-58041) según
  [BellSoft](https://docs.bell-sw.com/security/cves/CVE-2026-58041) (no encontré el aviso de Node con
  la versión exacta). El código no usa `createTagStore`. Sumar `RUN node --version` al armado. Una
  línea.
- **El conjunto de `openedOnce`** (`routes.ts:127`): en memoria crece una clave por sesión y
  día, sin borrar las viejas; son pocas, no hace falta más que limpiar las de días anteriores al
  cambiar de día.

### Lo del paso 4, en el código

| # | Punto | En el código | Prueba que intenta el ataque |
|---|---|---|---|
| 1 | Autor de una acción sin sesión | Hecho: `actorOf` toma la sesión, si no `proven`, si no `outsider`; la huella que no verifica anota `outsider` con la cuenta en `targets` | Falta la de la huella (13); la de Google sí está |
| 2 | Lo que sale por primera vez | Hecho: las claves de los límites no se anotan (`by: 'person'`, `'ip'`…); `data` sale por `shows`; ningún `target` lleva dispositivos | A medias (14) |
| 3 | `/people` | Hecho: sesión, permiso y límite; la persona borrada queda sin correo | Sí: `routes.test.ts` (E12, E30) y `routes-permissions.test.ts` |
| 4 | Fechas, `around` y `page` | Hecho: `from` desde 2020, `until` hasta hoy, `page` más que `pages` da `400`, nunca se crea un archivo al leer; `around` no existe | Sí: `query.test.ts` (período de miles de años, la carpeta no cambia) y E39; falta `/day` (16) |
| 5 | `data-private` | Hecho: personas, correos de afuera, el detalle, las listas de los filtros y la cinta; los pasos no guardan lo que tiene algo marcado | Sí: `audit-log.test.tsx` |
| 6 | Mirar no se anota | Carlos eligió (b): una vez por sesión y por día; solo en una de las tres rutas (11) | A medias (11) |
| 7 | Las 8 KB | Hecho: nunca deja de anotar; corta `data`, después `changes`; conserva `targets` | Sí: `write.test.ts` |
| 8 | Sincrónico | Hecho: la consulta en un `Worker`, de a una | Sí; falta la caída del hilo (12) |
| 9 | Conexión de solo lectura | Hecho: `readOnly: true`, solo si el archivo existe | Sí: `query.test.ts` |
| 10 | Detalles | `request.throttled` y `strip` están; las filas viejas se borran; el detalle dice «Es lo que dice el navegador»; el espejo todavía no existe; Node 24.22.1 (16) | El catálogo, sí (`audit-catalog.test.ts`) |

### Por tema, en una línea

1. **Entrar sin permiso:** el módulo no abre sesiones; el autor sale de la sesión o de una
   verificación (13, para que siga así).
2. **Permisos:** las tres rutas piden sesión, permiso y límite (probado ruta por ruta); no hay `POST`,
   `PUT` ni `DELETE` (E37, probado); quitar el permiso vale desde el pedido siguiente, porque los
   permisos se resuelven en cada pedido.
3. **Lo que entra de afuera:** `strictObject` con topes, SQL con parámetros, nombres cortados en 80 y
   correos en 254 al anotar; 16 para dos bordes sin consecuencia.
4. **La aplicación en el navegador:** texto, nunca HTML (E38, probado); nada en el dispositivo; el
   estado vive en el componente; `/api` sale con `no-store` y CSP `default-src 'none'`; un pedido de
   otro sitio no puede poner `X-Device-Id` sin una consulta previa que no se contesta.
5. **Datos personales y secretos:** sin secretos; no salen identificadores de dispositivos ni de
   huellas (14, para que siga así); nada va a terceros.
6. **Abuso y disponibilidad:** 60 por minuto por persona; el permiso negado, una línea por minuto; el
   hilo, punto 12; las filas de afuera, punto 15.
7. **Sin conexión:** `at` lo pone siempre la plataforma; la hora del celular va aparte, como
   `deviceTime`, y el detalle la marca.
8. **Auditoría:** se anotan el permiso negado, el límite y la apertura (11). Quien entra a la máquina
   puede cambiar los archivos: sigue para T116.
9. **El despliegue:** sin cambios; el servidor corre como `node` y escribe solo en `/data/audit`.
10. **Dependencias:** ninguna nueva; `pnpm audit --prod` limpio; `node:sqlite` en Node 24.22.1, sin
    `createTagStore`.

## Actualizar solo (T118)

Revisión del diseño de «Actualizar solo» antes de programarlo (paso 4): [audit-log.md](audit-log.md)
§ 1, § 5 (`latest` y `GET /api/audit-log/new`), § 7, § 8.1, § 9, § 10 y § 11, y la fila del tema en
[device-link.md](device-link.md) § 3.1. Fuentes: 05 · R4.6, R4.12, E34, E49 a E56; 03 · R4.5, E45 y
E46; el canal tal como está programado (`src/server/platform/realtime/`, `src/app/platform/realtime/`),
la escritura de la auditoría (`platform/storage/audit/write.ts`), los permisos
(`platform/permissions.ts`, `modules/users/roles/access.ts`), las sesiones (`platform/session.ts`,
`modules/sign-in/index.ts` y `context.ts`) y las rutas de 05 (`modules/audit-log/routes.ts`). Lo demás
de 05 ya revisado no se repite.

### Resumen

El diseño parte bien: el aviso no lleva nada (`{}`), la clave es una sola (`all`) y el tema no es
`anonymous`, así que el hub ya rechaza a quien no tiene sesión (`hub.ts:89`); lo que se ve sale de la
lista, con su sesión, su permiso, su límite y su `audit-log.opened`; `/new` entra en la tabla de
«cerrado por defecto» (`routes-permissions.test.ts`), que obliga a declarar su permiso; el fin de
cualquier sesión cierra sus canales (`realtime.ts:319`); el medidor vive en memoria del dispositivo.
**No encontré nada que frene.** Lo que importa es cómo sabe el tema los permisos, que el diseño no
dice y el canal hoy no da (17), y un ejemplo en el diseño de 03 que, copiado, abre lo que este diseño
cierra (18).

| # | Punto | Gravedad |
|---|---|---|
| 17 | El tema no tiene de dónde sacar los permisos: el canal no los resuelve, el recheck no tiene pedido, y la memoria de permisos se borra en el mismo evento que dispara el recheck | Mejora importante |
| 18 | El ejemplo de T118 en device-link.md § 14.1 contradice al diseño: manda una cuenta, consulta en cada suscripción sin límite ni rastro, y nombra mal el permiso | Mejora importante |
| 19 | `onWritten` dentro de `flush`: un error del aviso corta la escritura de la auditoría o tira el servidor | Mejora |
| 20 | El límite de 60 por persona con varias pestañas prendidas: alguien de afuera que genera filas le hace llegar al `429` a quien mira | Mejora |
| 21 | Pedir el tema sin permiso no se anota | Mejora |
| 22 | `since`: años viejos, el borde de 2⁵³ y el año sin archivo | Mejora |
| 23 | Detalles: la sesión vencida, el `403` al abrir, prender y apagar rápido, una prueba cerrada por defecto para los temas | Mejora |

### 17 · De dónde saca el tema los permisos (§ 7.1, «Quién» y «Permisos»; device-link.md § 3.1) — Mejora importante

**Dónde:** § 7.1 dice «Con sesión y `audit-log.view`; si no, `refused: 'forbidden'`» y
`recheckOn: ['users.permissions-changed']`. No dice con qué se mira el permiso.

**Lo que hay hoy en el código:**

1. Los permisos de un pedido los deja el paso `sessions.require` con sus `onSession`
   (`permissions.ts:30` a `:34`). El canal no pasa por ahí: `whoAsks` usa `sessions.identify`
   (`realtime/routes.ts:212`), que resuelve la sesión **sin** correr esos pasos (`session.ts:55` a
   `:58`). En `authorize`, `permissionsOf(listener.request)` da siempre `[]`.
2. En el recheck no hay pedido: `recheckChannel` pasa solo `{ session }`, la que quedó guardada al
   abrir el canal (`hub.ts:136`). `RequestSession` no lleva permisos (`session.ts:11` a `:18`).
3. La puerta de permisos no le da a nadie cómo saber los de una persona fuera de un pedido: solo
   tiene `provide` y `require` (`permissions.ts:47` a `:55`). Ningún tema de hoy mira permisos: este
   es el primero.
4. Los permisos están en una memoria (`users/roles/access.ts:20` a `:30`) que se borra con el mismo
   `users.permissions-changed` que dispara el recheck. Los dos corren después de confirmar, en el
   orden en que se registraron (`events.ts:58`); hoy `users` se registra antes que `audit-log`
   (`modules.ts:25`), así que el borrado va primero. Si el orden cambia, el recheck lee lo viejo.

**El ataque, si se programa de la forma más directa:** quien lo escribe ve que en `authorize` los
permisos dan vacío al abrir y, para que el recheck «no rompa», hace que sin pedido deje pasar, o
guarda los permisos que leyó al abrir en el parámetro o en la clave. Entonces: Graciela tiene
«Ver quién hizo qué» y deja Quién hizo qué prendido en la computadora del mostrador; el Administrador
le saca el rol; el recheck la deja pasar y esa pestaña sigue recibiendo los avisos hasta que se
cierre el canal. El aviso no lleva datos y las rutas ya le dan `403`, así que lo que consigue es saber
**cuándo** se anota algo (cuándo entra o sale gente, cuándo hay rechazos) sin permiso. Es poco, pero
es justo lo que R4.6 y § 9 dicen que no pasa. Con el orden de los módulos cambiado pasa lo mismo sin
que nadie programe mal.

**Qué propongo:** que § 7.1 diga cómo: la puerta de permisos suma `permissions.of(userId)` (la misma
`resolve` que ya usa `onSession`, con su memoria), y `authorize` la llama con
`listener.session.userId`, igual al abrir que en el recheck, sin mirar `listener.request`. Que el
recheck mire **después** de que la memoria se borró: o la memoria de permisos se borra antes que
cualquier otro oyente (un `on` de la plataforma que corre primero), o el recheck espera una vuelta
(`queueMicrotask`) y la memoria lo garantiza. Y una prueba de `live.test.ts` con el módulo `users` de
verdad (no uno de mentira): con el canal abierto, sacarle el rol, y que llegue `refused` y ningún
aviso más; otra con los módulos registrados en el otro orden. Cuesta: una función en la puerta, un
párrafo y dos pruebas.

### 18 · El ejemplo de device-link.md § 14.1 contradice al diseño — Mejora importante

**Dónde:** device-link.md, § 14.1, «Ejemplo, T118 entero del lado del canal». La fila de § 3.1 está
al día; el ejemplo no.

**Qué dice el ejemplo:** el parámetro es el último id que vio la pantalla (`maxLength(40)`, sin forma);
el evento es `{ count }`; `onSubscribe` corre `countSince(lastId)` en cada suscripción; publica
`{ count: n }` a todos; y pide `'audit.view'`, un permiso que no existe.

**El ataque, si se programa copiando el ejemplo:** Graciela, con el permiso, abre la consola y manda
`POST /api/realtime/subscriptions` sacando y sumando `audit-log.new:<id>`: el canal deja 60 cambios
por minuto por canal y 4 canales por sesión, y cada suma es una consulta de conteo en el hilo de la
auditoría que **no pasa** por el límite de 60 por minuto de las rutas ni anota `audit-log.opened`.
Con un `lastId` viejo (o inventado: solo se mide el largo) cada conteo recorre años. Unas 240
consultas pesadas por minuto, de a una en el mismo hilo que usan todos, sin rastro. Además el `count`
publicado es sin filtros, así que la pantalla muestra «n nuevas» que no cumplen el filtro, y el aviso
deja de ser «sin datos» (R4.6). Con `'audit.view'` el tema rechaza a todos (eso no abre nada, pero
empuja a «arreglarlo» a mano).

**Qué propongo:** reemplazar el ejemplo por el de § 7.1 (parámetro vacío, evento `{}`, clave `all`,
`onSubscribe` que solo manda `{}`, `audit-log.view`), y decir en § 14.1 que un `onSubscribe` no
consulta la base, o si consulta, que pase por el mismo límite que la ruta. Cuesta: diez líneas de
documentación.

### 19 · `onWritten` dentro de `flush` (§ 7.1, «Cuándo avisa») — Mejora

**Dónde:** § 7.1: «la auditoría suma `onWritten(listener)`, que se llama después de confirmar cada
tanda (`write.ts`, una vez por segundo como mucho)».

**Lo que pasa en el código:** `flush` no corre solo en el temporizador de cada segundo: también desde
`record` cuando la tanda llega a su tamaño (`write.ts:103`, dentro del pedido de cualquier módulo que
anota) y desde la lectura, que baja la tanda antes de cada consulta (§ 5, «La consulta»). Además
`flush` saca todo lo pendiente antes de escribir (`pending.splice(0)`, `write.ts:95`) y escribe año por
año. Si `onWritten` se llama ahí y algo de la cadena tira un error (por ejemplo `deliver` del hub, que
tira si el evento no cumple su forma, `hub.ts:75`), según dónde: el pedido de otro módulo contesta
`500` aunque su transacción ya se confirmó; las acciones del año siguiente de esa tanda, ya sacadas
de `pending`, no se escriben (R1.1: «nunca se deja de anotar»); o, dentro del `setInterval`, un error
sin atrapar tira el proceso. **No pude armar un ataque desde afuera:** el evento es un `{}` fijo y
`channel.send` no tira. Es robustez, pero el costo de que falle es la auditoría.

**Qué propongo:** que § 7.1 diga que `onWritten` se llama una sola vez por `flush`, después de escribir
todos los años, fuera de la escritura (`queueMicrotask`) y con cada oyente en su `try/catch`; un error
se registra en el registro del servidor y no toca la tanda. Y corregir «una vez por segundo como
mucho»: el tope de los avisos lo da el de 5 s del módulo, no el de la tanda. Una prueba: un oyente que
tira y la tanda igual queda escrita. Cuesta: unas líneas y una prueba.

### 20 · El límite de 60 por persona con varias pestañas prendidas (§ 7.1, «Sin consultas»; § 5) — Mejora

**Dónde:** § 7.1 dice que el límite de 60 por minuto por persona «alcanza: como mucho 12 puestas al
día por minuto por pestaña». El límite es por persona (`routes.ts`, `audit-log:person:<id>`), la
cuenta es por pestaña.

**El ataque:** alguien de internet, sin cuenta, intenta entrar con correos inventados cada 4 s,
cambiando de dirección para no llegar a los límites de entrar (o usando los límites mismos: cada
`request.throttled` nuevo, por clave nueva, también es una fila). Cada fila es un aviso a los 5 s. El
Administrador tiene Quién hizo qué abierto en tres pestañas de la computadora (las deja el canal: 4
por sesión) y en la de otra computadora: cuatro pestañas arriba de todo hacen 48 pedidos por minuto
solos, más los `/new` de las que están abajo, más lo que toca él. Llega a 60 y todo Quién hizo qué le
contesta `429`, también lo que pide al tocar, justo mientras lo están atacando y quiere mirar. El
`request.throttled` que eso anota es una vez por ventana (`guards.ts:82` a `:84`), así que no se
realimenta, pero el atacante sostiene el efecto con poco. No lee ni cambia nada: es disponibilidad.

**Qué propongo:** (a) que § 7.2 diga qué hace la pantalla prendida con un `429`: no reintenta antes de
`retryAfterSeconds`, no muestra error por un pedido solo, y lo que pide la persona al tocar tiene
prioridad; (b) que los pedidos solos (`meter: 'audit-log'`) cuenten contra un límite propio por
**sesión** (por ejemplo 15 por minuto) y no contra el de 60 de lo que toca la persona; o (c) subir el
de 60 sabiendo que el tope real lo pone el aviso de 5 s. Recomiendo (a) y (b). Y que § 7.1 corrija la
cuenta: «por pestaña» no alcanza cuando el límite es por persona. Cuesta: un párrafo, una clave de
límite y una prueba de pantalla con un `429`.

### 21 · Pedir el tema sin permiso no se anota (§ 7.1, § 9 «Lo que queda en la auditoría») — Mejora

**Dónde:** las rutas sin permiso anotan `permission.denied` (E14, `permissions.ts:35` a `:46`). El
tema contesta `refused: 'forbidden'` y no anota nada (el hub no anota rechazos: `routes.ts:233`).

**El ataque:** Marcos, Cajero, sin el permiso, prueba desde la consola `GET /api/realtime?s=audit-log.new`
para ver si recibe algo. No recibe nada (bien), pero tampoco queda rastro, y la pantalla nunca pide el
tema sin el permiso: un pedido así siempre es alguien probando a mano.

**Qué propongo:** que `authorize`, cuando rechaza **al abrir o al sumar** (no en el recheck, que es
el caso normal de perder el permiso), anote `permission.denied` con `data.topic` en lugar de
`data.path`, una vez por minuto por persona y permiso, con el mismo límite que la puerta. Para eso el
hub tiene que pasarle si es un recheck (hoy se nota porque no hay `listener.request`). Cuesta: unas
líneas y una prueba.

### 22 · `since` (§ 5, `GET /api/audit-log/new`) — Mejora

- **Años viejos.** `since` vale con cualquier año que tenga archivo, y cuenta «todas las de los
  archivos de años posteriores». La pantalla solo manda el `latest` que recibió, del año en curso (o
  del anterior, cruzando el 1 de enero). Con `since=2020:0` y un filtro que casi no coincide (`by` de
  alguien que hizo dos cosas), `limit 100` no corta y cada pedido recorre el índice de esa persona en
  cada año. Con el límite de 60 y el hilo de a una no tira nada, pero la meta de 20 ms es para el caso
  de la pantalla. Propongo aceptar solo el año en curso y el anterior (`400` con `since` si no); una
  línea y un caso en la prueba de E39.
- **2⁵³.** «`n` entero entre 0 y 2⁵³»: 2⁵³ ya no es un entero seguro en JavaScript (`2**53 + 1`
  se lee igual). Que diga «hasta `Number.MAX_SAFE_INTEGER`», con una expresión regular de dígitos
  antes de convertir (sin `1e3`, `0x10` ni espacios). Una línea.
- **El año sin archivo.** `latest` es «`max(id)` del archivo del año en curso». El 1 de enero, antes de
  la primera acción del año, ese archivo no existe; si `latest` dice `2027:0`, el `/new` siguiente da
  `400` («un año con archivo») y la pantalla queda sin «n nuevas» hasta la primera fila. Que `latest`
  salga del archivo más nuevo que existe, y que `/new` acepte el año en curso aunque no tenga archivo
  (cuenta 0, sin crearlo). No es un ataque; lo dejo porque toca la validación.

Lo demás de `/new` está bien: los filtros se validan como en la lista, la cuenta tope de 100 no deja
contar más que la lista misma, y quien la pide ya puede ver todas las acciones, así que contar con
filtros (`to=<persona>`) no le dice nada que no vea.

### 23 · Detalles — Mejora

- **La sesión que vence sin que nadie lo diga** (por no usarla, por edad) se descubre en el latido,
  cada 40 s (`realtime.ts:323` a `:330`): hasta 40 s más de avisos `{}`. Sin datos y a quien tenía
  el permiso: aceptable; que § 9 lo diga en lugar de «una sesión que termina cierra su canal».
- **El `403` al abrir.** Si el canal se abre solo con `audit-log.new` y el tema lo rechaza, el
  servidor contesta `403` y la aplicación llama a `onRefused('403')`, no `'forbidden'`
  (`app/platform/realtime/channel.ts:71` a `:73`). § 7.2 dice que la pantalla cierra con
  `forbidden`: que diga los dos, o el canal de la aplicación que traduzca. Sin esto, quien perdió el
  permiso con la pestaña oculta vuelve y la pantalla no se cierra (el servidor igual le niega todo).
- **Prender y apagar rápido.** Con el selector como único tema, cada vez se cierra y se abre el canal,
  y las aperturas son 10 por minuto **por sesión** (`admission.ts:408`): quien prende y apaga diez
  veces deja a sus otras pestañas de esa sesión (también la del vínculo) sin poder abrir canal hasta un
  minuto. Es contra uno mismo; se evita con que el canal de la aplicación espere unos segundos antes de
  cerrarse cuando queda sin temas. No se anota y está bien que no.
- **Cerrado por defecto para los temas.** Las rutas tienen una prueba que obliga a declarar lo que
  pide cada una; los temas no. Una tabla igual en `realtime.test.ts` («cada tema dice si es anónimo y
  qué pide; sin sesión, sin permiso, `refused`») hace que el próximo tema no se olvide. Media hora.
- **Fuera de seguridad:** una entrada sin conexión de diciembre que llega en enero se escribe en el
  archivo del año anterior (el año es el de `at`, § 3); `/new` con `since` del año en curso no la
  cuenta y la marca no la pinta. Lo dejo anotado para la revisión del diseño.

### Por tema, en una línea

1. **Entrar sin permiso:** nada nuevo; el canal se abre con la sesión de siempre y el tema no es
   anónimo.
2. **Permisos:** el tema pide `audit-log.view` y lo vuelve a mirar al cambiar; falta decir con qué (17);
   `/new` va a la tabla de cerrado por defecto; la baja y cerrar sesiones cierran el canal.
3. **Lo que entra de afuera:** el parámetro del tema es vacío; `since` con forma y topes (22); los
   filtros de `/new`, como los de la lista.
4. **La aplicación en el navegador:** el aviso no trae datos; lo que se muestra sale de la lista como
   texto; el estado del selector no se guarda ni se espeja (E56).
5. **Datos personales y secretos:** el aviso dice solo que hubo algo, y solo a quien ve todo; el
   medidor no sale del dispositivo, no se guarda y muestra solo KB.
6. **Abuso y disponibilidad:** el aviso cada 5 s para todos y sin consultas; el límite por persona
   contra varias pestañas (20); el ejemplo de 03 que consultaría sin límite (18); `onWritten` (19).
7. **Sin conexión:** no aplica: sin conexión no hay canal, y al volver se pide la lista con la sesión.
8. **Auditoría:** ponerse al día no anota (salvo `audit-log.opened`, una vez por sesión y día), así no
   se realimenta; el tema rechazado no se anota (21).
9. **El despliegue:** sin cambios; el canal ya pasa por Caddy (diseño de 03).
10. **Dependencias:** ninguna nueva; el medidor usa `PerformanceResourceTiming` del navegador.

## Actualizar solo (T118): el código

Revisión del código de «Actualizar solo» y los medidores (paso 7), contra [audit-log.md](audit-log.md)
§§ 5, 7, 8.1 y 9 y contra los puntos 17 a 23 de arriba. Lo leído: los commits de T118 desde «El medidor
de lo que manda el servidor por los canales» hasta «El manual y la documentación de «Actualizar solo»»
en `src/`, `tests/` y `deploy/`. Corrí las pruebas del servidor y de la aplicación que tocan esto
(`audit-log/live.test.ts`, `new-ones.test.ts`, `storage/audit/newer.test.ts`, `written.test.ts`,
`routes-permissions.test.ts`, `sessions.test.ts`, `realtime.test.ts`, `meter.test.tsx` y
`app/platform/realtime/`): 77 pasan. `pnpm audit --prod`: «No known vulnerabilities found»; T118 no
suma dependencias.

### Resumen

Lo que el diseño prometió está: el tema pregunta con `permissions.of(userId)` al abrir y al volver a
mirar, el recheck corre después de la memoria de permisos (`queueMicrotask`, con prueba en el otro
orden), pedir el tema sin permiso se anota, `since` acepta solo los dos años vivos y enteros seguros,
`onWritten` corre fuera de la escritura y aislado, los temas tienen su tabla de cerrado por defecto, el
`403` llega con `forbidden`, y la compresión no toca el canal. **No encontré nada que frene.** Lo que
importa es que `X-Auto` hace más de lo que § 9 dice: con una sesión robada, borra el rastro que R1.3
quería dejar (24) y el «usada hace» de la sesión (25), y vale en rutas que la pantalla nunca pide solas
(26). Además, la foto `upTo` anula la memoria de los totales de los años cerrados (27), y perder el
permiso con la pantalla prendida anota un rechazo que la persona no hizo (28).

| # | Punto | Gravedad |
|---|---|---|
| 24 | `X-Auto` evita «Abrió Quién hizo qué» también a quien usa una sesión robada que no abrió la pantalla ese día | Mejora importante |
| 25 | `X-Auto` vale en cualquier ruta y método: el uso de una sesión robada no aparece en «usada hace» | Mejora |
| 26 | `X-Auto` también en `/people` y `/day`: 30 pedidos más por minuto de lo más pesado, sin rastro | Mejora |
| 27 | La foto `upTo` entra en la clave de los totales guardados: cada puesta al día vuelve a contar los años cerrados | Mejora |
| 28 | Al perder el permiso con la pantalla prendida, la auditoría anota un `permission.denied` que la persona no pidió | Mejora |
| 29 | Pruebas que faltan para riesgos que el diseño dice cubrir | Mejora |

### Lo de arriba (17 a 23), en el código

- **17:** cubierto. `permissions.ts:52` (`of`), `audit-log/live.ts:62` a `:66`; `realtime.ts:43` a
  `:49` (`queueMicrotask` después del ciclo síncrono de `events.ts:58`). Pruebas: `live.test.ts`
  («si le sacan el permiso…», con `users` de verdad) y `realtime.test.ts` («vuelve a preguntar
  después…», con quien borra registrado después).
- **18:** cubierto en la documentación: device-link.md § 3.1 y su diagrama ya dicen `{}`, `all` y
  `audit-log.view`; no quedó `countSince`.
- **19:** cubierto. `write.ts:97` a `:111`: una vez por `flush` con algo, en `queueMicrotask`, cada oyente
  con `try/catch`. Prueba: `written.test.ts` («un error de quien escucha no corta…»).
- **20:** cubierto con un límite propio de 30 por minuto por sesión (`routes.ts:46` a `:51`) y la pausa con
  `429` en la aplicación (`live.ts`, `outcomeOf`). Pruebas: `new-ones.test.ts` (el toque sigue con el
  límite automático pasado) y `live-edges.test.tsx` (con `429` no pide). Ver 24 a 26.
- **21:** cubierto. `audit-log/live.ts:41` a `:54`: anota con `data.topic` solo si hay pedido (abrir o
  sumar), con la misma clave de límite que la puerta (`audit:permission.denied:<persona>:<permiso>`),
  así rutas y tema juntos dejan uno por minuto. Prueba: al abrir. Ver 29 y 28.
- **22:** cubierto. Regex de 16 dígitos más `Number.isSafeInteger` y solo el año en curso y el anterior
  (`rules.ts`, `sinceOf`); un año sin archivo se saltea sin crearlo (`query.ts`, `newer`). Pruebas:
  `new-ones.test.ts` (`2024`, `2027`, `2⁵³`, basura) y `newer.test.ts` (1 de enero sin archivo). Un
  `since` con el mismo año dos veces (`2026:1.2026:5`) pasa y cuenta dos veces ese archivo; el tope de
  100 lo acota, así que no lo cuento como punto.
- **23:** cubierto: el `403` con `forbidden` (`sse.ts`, `refusalCode`; `channel.ts`), el tema que se
  suelta a los 10 s (`live.ts`, `useHeld`), la tabla de temas (`routes-permissions.test.ts`) y la
  sesión vencida que recibe avisos hasta el latido (§ 7.1 lo dice).

### 24 · `X-Auto` borra el rastro de «Abrió» con una sesión robada (`routes.ts:130`, `openedOnce`) — Mejora importante

**Dónde:** `openedOnce` sale antes de anotar si el pedido trae `X-Auto: 1`, en las cuatro rutas. § 9
lo justifica así: «quien tiene el permiso ya quedó anotado la primera vez del día que la abrió a mano,
y si nunca lo hizo, ese pedido igual pasa por el permiso y el límite». Pasar el permiso no deja rastro,
y el rastro es justo lo que § 9 promete: «si alguien usa una sesión robada para bajar el registro, queda
el rastro de quién y desde dónde».

**El ataque:** alguien se lleva la cookie de una sesión del Administrador que hoy no abrió Quién hizo qué
(la de su celular, o la de la computadora del mostrador que quedó abierta de noche y en la que copia la
cookie, el `X-Device` y la versión del contrato desde las herramientas del navegador). Desde su casa
pide `GET /api/audit-log/day?date=…` con `X-Auto: 1`, día por día, y `/people`: hasta 30 pedidos por
minuto de la cinta (2.000 acciones cada uno), con correos, direcciones y navegadores de todos. No queda
`audit-log.opened` desde su dirección; si lo pasa, solo un `request.throttled`. El Administrador que
mira Quién hizo qué al otro día no ve nada. Sin `X-Auto` habría quedado «Abrió Quién hizo qué» con la
dirección de afuera. (Si la sesión ya había abierto la pantalla ese día, el rastro tampoco aparece, con
o sin `X-Auto`: así está diseñado R1.3, una vez por sesión y día; lo que suma `X-Auto` es el caso de la
sesión que no la abrió.)

**Qué propongo:** que `X-Auto` evite anotar solo si **esa sesión** ya abrió Quién hizo qué a mano alguna
vez (un `Set` de ids de sesión en memoria, aparte del del día; se olvida al cerrarse la sesión). Así la
pantalla que queda prendida de un día para el otro no anota, y una sesión que nunca la abrió anota la
primera vez aunque mande la cabecera (con `data.auto: true` si sirve para leerlo). Que § 9 corrija la
frase. Cuesta: unas cinco líneas y una prueba en `new-ones.test.ts` («una sesión que nunca abrió la
pantalla, con `X-Auto`, igual queda anotada»). Con 26, se achica más.

### 25 · `X-Auto` en cualquier ruta y método (`sign-in/sessions/require.ts:46`) — Mejora

**Dónde:** `requestSession` deja de tocar `lastUsed` con `X-Auto: 1` en **todas** las rutas con sesión,
también las que escriben. § 7.1 lo pensó para lo que la pantalla pide sola.

**El ataque:** con la misma cookie robada de 24, mientras la persona no usa su sesión, quien la robó usa
cualquier ruta con `X-Auto: 1`. La sesión no se alarga (vence a los 60 minutos del último uso de la
dueña), pero en la tarjeta de Acceso de Usuarios esa sesión sigue diciendo «usada hace 40 minutos»
(`access/routes.ts:109`, `Access.tsx:26`): el Administrador que revisa las sesiones abiertas buscando
algo raro no ve que se está usando, ni desde dónde. No le da más tiempo ni más permisos; le da no verse.

**Qué propongo:** que `X-Auto` cuente solo en `GET` (una escritura siempre es uso), y mejor todavía que
lo declare cada ruta que lo acepta (un paso `automatic` que ponen la lista y `/new`, y que el paso de
sesión lee), así una ruta nueva no lo hereda. Cuesta: una condición o un paso, y una prueba con un
`POST` con `X-Auto` que sí alarga.

### 26 · `X-Auto` también en `/people` y `/day` (`routes.ts:36` a `:51`) — Mejora

**Dónde:** el límite propio y el «no anota» se aplican por cabecera en las cuatro rutas (`path` les pone
`limited` a todas). La aplicación manda `X-Auto` solo en la lista y en `/new` (`app/.../api.ts`).

**El ataque:** quien tiene el permiso (o una sesión robada) suma a sus 60 pedidos por minuto otros 30
por sesión de `/day`, la consulta más pesada (la semana, el conteo y hasta 2.000 acciones, unos 150 KB),
en el hilo de lectura que es de a una para todos; y, con 24, sin «Abrió». Con dos sesiones de la misma
persona, 60 más. No tira nada (el hilo tiene tope de tiempo y memoria), pero es el doble del presupuesto
pensado para lo que no hace falta.

**Qué propongo:** que `isAuto` valga solo en `/api/audit-log` y `/api/audit-log/new`; en `/people` y
`/day` la cabecera se ignora (cuenta contra el límite de la persona y anota). Cuesta: un parámetro en
`path` y una prueba.

### 27 · La foto `upTo` en la clave de los totales guardados (`query.ts:60`, `countIn`) — Mejora

**Dónde:** `pageOf` cuenta con `{ ...filtros, upTo: latest }` (`answers.ts:63`) y `countIn` guarda los
totales de los años cerrados con la clave `año|JSON.stringify(filtro)`, que ahora incluye `upTo`. Para
un año anterior a los dos vivos, `upTo` no cambia nada de la consulta (`where.ts`, `upToOf`), pero sí la
clave, y `latest` cambia con cada fila nueva.

**El ataque (disponibilidad):** con «Actualizar solo» prendido y sin fechas (lo que abre la pantalla),
cada puesta al día, cada 5 s por pestaña, vuelve a contar entero cada año cerrado con los filtros (con
«hecho a», la subconsulta de `targets`), y suma una entrada nueva a la memoria hasta las 1.000, que se
vacía y se pierde también lo útil. Alguien de afuera que genera filas (como en 20) hace que eso pase
cada 5 s. Hoy hay un solo año y no se nota; con varios años, cada pedido recorre todos en el hilo de a
una, y la meta de § 10 deja de cumplirse para todos. No es entrar ni ver: es lo que § 5 dice que no pasa
(«Los totales de los años cerrados se guardan en memoria»).

**Qué propongo:** armar la clave con lo que de verdad consulta ese año (el `sql` y los `params` de
`where(filter, year)`), o sacar `upTo` del filtro para los años que no están en él. Y una prueba: dos
cuentas con `upTo` distintos sobre un año cerrado preguntan a ese archivo una vez. Cuesta: una línea y
una prueba.

### 28 · Perder el permiso anota un rechazo que la persona no pidió (`app/modules/audit-log/state.ts`, `lost`; `audit-log/live.ts:45`) — Mejora

**Dónde:** al llegar `refused: forbidden`, la pantalla llama a `lost`, que es `refresh()`: pide
`GET /api/audit-log` para que la aplicación se entere por la huella de permisos. Esa ruta ya no la deja
y la puerta anota `permission.denied` con `path: '/api/audit-log'` (`permissions.ts:35` a `:46`). Lo
mismo pasa si a la persona le sacan el permiso con la pestaña oculta: al volver, el canal se abre de
nuevo con el tema, el hub contesta `403` con pedido y `refuse` lo anota con `topic`.

**Qué pasa (no es un ataque, es la veracidad del rastro):** el Administrador le saca «Ver quién hizo qué»
a Graciela mientras ella tiene la pantalla prendida. En Quién hizo qué aparece, en rojo, «Graciela
intentó ver Quién hizo qué sin permiso», que es lo que § 7.1 y el punto 21 querían reservar para quien
prueba a mano. Quien lea la auditoría puede tomarlo por un intento.

**Qué propongo:** que `lost` pida una ruta que solo pide sesión y trae la huella (la que ya use la
aplicación para enterarse de los permisos; no la busqué), no una de Quién hizo qué; y que la pantalla
no pida el tema cuando la huella que tiene ya no incluye `audit-log.view`. No pude comprobar si al volver
a la vista la aplicación pide algo que actualice la huella antes de reabrir el canal: si lo hace, el
segundo caso no pasa. Cuesta: unas líneas y ajustar la prueba «si le sacan el permiso, pide la lista…»
de `live-edges.test.tsx`.

### 29 · Pruebas que faltan (paso 7: cada riesgo con una prueba que lo intenta) — Mejora

- **El tema sin permiso al sumarlo** (`POST /api/realtime/subscriptions`), no solo al abrir: que se
  anota y que uno por minuto (la segunda vez no). Y que el registro lleve la dirección (`ipAddress`), que
  hoy ninguna prueba mira.
- **`X-Auto` no salta el permiso:** una persona sin `audit-log.view` con `X-Auto: 1` recibe `403`. Hoy
  pasa porque el permiso va antes del límite, pero nada lo fija.
- **Lo que vuelve a mirar no anota:** al sacarle el permiso con el canal abierto, `refused` llega y **no**
  queda `permission.denied` con `topic` (§ 7.1, «no al volver a mirarlo»).
- **`/new` nunca crea archivos:** con el reloj en un año sin archivo y `since` de ese año, la carpeta no
  cambia (la prueba de `newer.test.ts` usa la memoria, no la carpeta).

Cuesta: media hora.

### La compresión de `/api` (§ 7.4) y BREACH

Sin hallazgos. `deploy/Caddyfile` comprime solo lo que el servidor manda como `application/json*`,
desde 256 bytes; el canal (`text/event-stream`) queda afuera, y la prueba de Usuarios mira que la lista
llegue con `zstd` o `gzip`. BREACH necesita que el atacante haga que el navegador de la víctima mande
muchos pedidos con algo que él elige y que vuelve en una respuesta que también trae un secreto. Acá no
puede: todo `/api`, también `GET`, exige el dispositivo y la versión del contrato en cabeceras propias
(`http.ts`, `rejectionReason`), que otro sitio no puede poner sin una consulta previa de CORS que el
servidor no contesta; y la cookie de sesión es `SameSite=Strict` (`sessions/cookie.ts:16`). Lo que queda
es el largo de las respuestas para quien mira la red, que ya variaba sin comprimir. No recorrí todas las
respuestas buscando secretos reflejados: no hizo falta, porque falta la otra mitad del ataque.

### Por tema, en una línea

1. **Entrar sin permiso:** nada nuevo; el tema exige sesión y el hub rechaza sin ella (con prueba).
2. **Permisos:** el tema pide `audit-log.view` con `permissions.of` al abrir, al sumar y al volver a
   mirar, sin depender del orden de los módulos; `/new` en la tabla de cerrado por defecto.
3. **Lo que entra de afuera:** el parámetro del tema es vacío; `since` con forma, años y enteros seguros;
   los filtros de `/new`, los de la lista; todo a SQLite como parámetro (`where.ts`).
4. **La aplicación en el navegador:** el aviso no trae datos; el selector y el medidor no se guardan ni
   se espejan; las cabeceras extra de `api()` las pone solo el código de la aplicación.
5. **Datos personales y secretos:** el aviso y `latest` solo dicen cuántas y cuándo, a quien ve todo; el
   medidor no sale del dispositivo.
6. **Abuso y disponibilidad:** el aviso cada 5 s y sin consultas; el límite propio de lo automático;
   `X-Auto` en rutas que no lo necesitan (26) y la memoria de totales que se pierde (27).
7. **Sin conexión:** no aplica; sin conexión no hay canal.
8. **Auditoría:** `X-Auto` borra el rastro de una sesión robada (24) y el «usada hace» (25); un rechazo
   anotado que nadie hizo (28); pedir el tema sin permiso se anota.
9. **El despliegue:** la compresión, bien acotada; sin BREACH posible por las cabeceras y la cookie.
10. **Dependencias:** ninguna nueva; `pnpm audit --prod` sin fallas conocidas.
