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
