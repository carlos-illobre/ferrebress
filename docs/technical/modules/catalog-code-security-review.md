# Revisión de seguridad del código · 07 · Catálogo (`catalog`), parte a1, con T132 y T136

## Paso 7: el código

Revisión independiente, como atacante, del código de los commits `ed766db` (T132), `a705c04` (T136),
`1be9476` y `2b044bc` (07a1), contra las [reglas de 07](../../chapters/07-catalog/rules.md) (sobre todo
R4), 06 · R3.7 y R11, 01 · R2.9 y R2.10, 15 · R2.2 y R3.1, el diseño de 07 (§ 9) y la
[revisión de seguridad del diseño](catalog-security-review.md). Leí `src/server/modules/catalog/`
entero, `src/shared/search/`, `src/shared/contracts/catalog.ts`, `src/shared/pricing/sale.ts` y
`rounding.ts`, `src/shared/audit-log/products.ts`, los permisos nuevos, `administration/routes.ts`,
`settings.ts` y la migración `002-step-cents`, lo que cambió en `price-lists` (aplicar, el estado del
proveedor, `costSourceOf`), `sign-in/context.ts` (`createEntry`), `sign-in/index.ts` (la cabecera),
`offline/rules.ts` y `routes.ts`, `app/modules/sign-in/offline/option.ts`, `watch.ts` y `send.ts`, y
de la plataforma `http.ts` (de dónde salen la dirección y el dispositivo) y las rutas de
`audit-log`.

Corrí:

- las pruebas del catálogo, del índice, de la entrada en Administración, del redondeo y de sin
  conexión (17 archivos, 107 pruebas): **pasan todas**;
- `pnpm audit --prod`: **sin fallas conocidas**; los commits no suman ni cambian dependencias
  (`package.json` y `pnpm-lock.yaml` no cambian);
- una medida propia del índice (`src/shared/search/index.ts`, fuera del repositorio) con 100.000,
  200.000 y 400.000 productos de descripciones de 8 a 12 palabras (las de la prueba de rendimiento
  tienen 4 palabras de un vocabulario de 15). Los números de los puntos 3, 4, 6 y 7 salen de ahí;
  son de esta máquina y de datos inventados, así que sirven como orden de magnitud.

- **Frena:** se puede ver o cambiar lo ajeno, o filtrar lo que una regla reserva.
- **Mejora:** conviene hacerla; no frena.

## Resumen

**Lo que pedía la revisión del diseño quedó casi todo hecho** (tabla al final): el panel del redondeo
da ejemplos inventados sin «Ver costos», el margen ya no sale sin ese permiso, todas las rutas piden
sesión, toda respuesta con un producto (también la de un cambio y la del `409`) sale de `views.ts`, el
precio en centavos entra en un `bigint`, los dados de baja no están en el índice, las páginas
siguientes no vuelven a buscar, y las horas sin conexión viajan en la cabecera y se guardan con el
contacto. No encontré inyección SQL, rutas sin permiso ni datos personales nuevos.

**Un punto frena, y lo tiene que decidir Carlos:** Quién hizo qué le muestra a quien tiene «Ver quién
hizo qué», aunque no tenga «Ver costos», el margen y el precio de cada cambio de margen (y, desde 08,
el costo de cada producto de cada lista aplicada). Con el margen y el precio sale el costo, que es lo
que 07 · R4.1 reserva. 05 · R3.2 dice que ese permiso lo ve todo: las dos reglas chocan (punto 1).

**Antes de esto hay un aviso que no es de seguridad:** el commit `2b044bc` dejó vacío el diseño del
módulo (`docs/technical/modules/catalog.md`, 0 líneas): la § 9 contra la que se revisa ya no está en
el repositorio (punto 0).

Lo más serio de lo que no frena es de disponibilidad: **el tope de 200.000 productos se esquiva** con
productos que vuelven (punto 2), **las búsquedas guardadas no tienen tope entre sesiones** (punto 3),
**cada lista aplicada rearma el índice entero en el hilo del servidor**, unos 2,4 s con 200.000
(punto 4), y **una falla al poner al día el índice puede tirar el proceso** (punto 5).

| # | Punto | Gravedad |
|---|---|---|
| 0 | El diseño del módulo quedó vacío | Aviso (documentación) |
| 1 | Quién hizo qué muestra el margen, el precio y el costo sin «Ver costos» | **Frena (decide Carlos)** |
| 2 | El tope de 200.000 se esquiva con los que vuelven y con el número viejo del índice | Mejora (disponibilidad grave) |
| 3 | Las búsquedas guardadas no tienen tope entre sesiones | Mejora (disponibilidad) |
| 4 | Cada transacción con productos rearma el índice entero en el hilo del servidor | Mejora (disponibilidad) |
| 5 | Si falla la puesta al día y su respaldo, el rechazo queda sin atender y tira el proceso | Mejora (disponibilidad) |
| 6 | Buscar cuenta por sesión, no por persona; las marcas y el producto, sin límite | Mejora (disponibilidad) |
| 7 | La memoria del índice se midió con descripciones irreales | Mejora |
| 8 | Faltan las pruebas de ataque que pedía la revisión del diseño | Mejora |
| 9 | El recálculo del redondeo: el límite, el mensaje y la precisión de los ejemplos | Mejora |
| 10 | T132: el límite por dispositivo lo elige quien pide; queda solo el de la dirección | Mejora |
| 11 | T132: el celular acepta cualquier número de horas en `h` | Mejora (menor) |
| 12 | Un cambio de margen durante la puesta al día deja mal «Sin precio» | Mejora (integridad) |

## Los puntos

### 0. El diseño del módulo quedó vacío — Aviso (documentación)

**Dónde:** `docs/technical/modules/catalog.md`, que el commit `2b044bc` («documentos al día») dejó en
0 líneas (borró las 303). La versión anterior está en `1be9476`.

No es un ataque, pero la constitución pone el diseño técnico por encima de las pruebas y el código, y
esta revisión (y la próxima) lo usa para saber qué riesgos dice cubrir el módulo: las metas de
memoria, los límites de § 9, la respuesta de cada ruta. Revisé contra la versión de `1be9476`.

**Qué propongo:** volver a poner el documento, con lo medido que el commit quería sumar (los 42 MB y
los tiempos). Costo: recuperar el archivo y corregir dos números.

### 1. Quién hizo qué muestra el margen, el precio y el costo sin «Ver costos» — **Frena (decide Carlos)**

**Dónde:** `server/modules/catalog/routes/changes.ts`, `record()` (el evento `products.margin-changed`
lleva `changes.margin` y `changes.price`, antes y después); `shared/audit-log/products.ts` (lo dice en
el texto: «Cambió el margen de X: 50 % → 80 % (precio $ 3.630 → $ 4.360)»);
`server/modules/audit-log/rules.ts:158` (`viewOf` manda `changes` entero) y `routes.ts` (las rutas
piden solo `audit-log.view`); el permiso `audit-log.view` en `shared/contracts/permissions.ts:51`
no incluye `price-lists.costs`. Ya desde 08: `price-lists/apply/service.ts:98` anota `lists.costs` con
el costo de antes y el de después de cada producto, y `shows: ['costs']` lo muestra.

**El ataque:**

1. Un rol pensado para supervisar (por ejemplo, «Encargado»: «Ver quién hizo qué» para controlar a
   los cajeros, y sin «Ver costos» porque no tiene que ver lo que se paga a los proveedores).
2. Abre Quién hizo qué, filtra por el grupo «Catálogo» y lee cada cambio de margen: el margen y el
   precio, de antes y de después. Con el paso del redondeo en centavos o en $ 1, costo ≈ precio /
   ((1 + margen) × (1 + IVA)), con menos de un peso de error; con $ 1.000, un rango que el segundo
   cambio achica.
3. Más directo: cada lista aplicada deja `lists.costs` con el costo de cada producto, de a tandas.
   Pidiendo `GET /api/audit-log` con el grupo de las listas tiene la tabla de costos de todo el
   catálogo, actualizada con cada lista.

**Qué consigue:** el costo y el margen que 07 · R4.1 reserva a «Ver costos», sin tenerlo. La tarea
pide que no salgan «en ninguna respuesta»; esta es una respuesta del servidor.

**Por qué decide Carlos:** 05 · R3.2 dice, aprobado, que quien tiene «Ver quién hizo qué» ve todo,
«también los datos de capítulos que no puede usar (un costo, cuando exista el catálogo)», y que no se
esconde parte de una acción. Las dos reglas no pueden cumplirse a la vez. Opciones:

- **A. «Ver quién hizo qué» incluye «Ver costos»** (como «Cambiar márgenes»): lo que ya dice R3.2 queda
  explícito en el editor de roles, que muestra el tilde puesto y fijo, y nadie arma un rol que ve
  costos sin saberlo. Costo: una línea en `permissions.ts`, la explicación del permiso y una prueba como
  E18. Desventaja: no se puede dar Quién hizo qué sin dar costos.
- **B. Se esconde el margen, el precio y el costo** de esas acciones a quien no tiene «Ver costos»
  (`viewOf` con los permisos de quien pide). Cambia R3.2 («no se esconde parte de una acción»).
  Costo: un filtro por tipo de acción y sus pruebas.
- **C. Se acepta** y R4.1 dice que Quién hizo qué es la excepción. Sin costo de programar; el texto
  del permiso tiene que decir que deja ver los costos.

Recomiendo A: es la más barata y no deja huecos en el registro.

### 2. El tope de 200.000 se esquiva — Mejora (disponibilidad grave)

**Dónde:** `server/modules/catalog/writes.ts:72` a `:76` (`create` mira el tope) y `:105` (`restore` no
lo mira); `index.ts:62` (`active: index.size`, el número del índice en memoria);
`price-lists/apply/apply-in.ts:84` a `:94`; `writes.ts:128` (el índice se pone al día después de
confirmar, sin esperar).

**El ataque** (alguien con «Cargar listas», o un proveedor que manda archivos armados para esto y
alguien que los aplica):

1. Aplica una lista completa del proveedor A con 200.000 códigos: 200.000 activos.
2. Aplica una lista completa de A con una sola fila: los otros 199.999 quedan dados de baja (los dados
   de baja no cuentan, R3.5).
3. Aplica una lista de B con 199.999 códigos nuevos: pasa el tope justo.
4. Vuelve a aplicar la lista del paso 1 de A: los 199.999 son productos conocidos dados de baja, así
   que van por `restore`, que suma a `added` pero nunca compara con el tope. **Quedan 400.000
   activos.** Repitiendo con C, D…, crece sin fin.

También sin `restore`: el número que se compara es `index.size()`, que se pone al día recién cuando
termina la puesta al día del índice, después de confirmar y sin que nadie la espere. La lista que
sigue en la cola empieza enseguida (`service.ts`, `nextInQueue`): si la anterior creó 150.000, la
siguiente ve el número viejo y puede crear otros tantos.

**Qué consigue:** lo que el tope tenía que evitar (revisión del diseño, punto 6). Medido con
descripciones de 8 palabras: 400.000 productos son unos 350 MB de índice retenido y 700 MB del proceso
mientras se arma, con el límite del contenedor en 1 GB. Un poco más y el proceso se cae, y al arrancar
vuelve a armar el índice con todos: se cae en cada arranque.

**Qué propongo:** contar los activos en la base, dentro de la transacción de la lista (que ya es de a
una en todo el servidor): `select count(*) from catalog.products where not discontinued` una vez al
empezar, y mirar el tope en `create` **y** en `restore`. Costo: una consulta por lista (unos ms con
200.000, por el índice `(discontinued, …)`) y una prueba con el recorrido de arriba.

### 3. Las búsquedas guardadas no tienen tope entre sesiones — Mejora (disponibilidad)

**Dónde:** `server/modules/catalog/routes/products.ts:24` a `:38`: cada búsqueda guarda su resultado
(`found.ids`, un arreglo nuevo de identificadores) por sesión durante un minuto, también la primera
página, sin tope de cuántas sesiones.

**El ataque:** un empleado con su propia cuenta y una huella de software (el autenticador virtual del
navegador) abre sesiones en un bucle: 60 por minuto por dirección (o más, con varias direcciones).
En diez minutos tiene 600 sesiones, que no vencen enseguida. Después, en menos de un minuto, cada
sesión pide `GET /api/catalog/products` sin nada escrito. Cada resultado guardado es todo el catálogo:
medido, **unos 2 MB con 200.000 productos**. 600 sesiones son 1,2 GB y el contenedor mata al proceso.
Se repite cuando vuelve.

**Qué propongo:** un tope total de lo guardado (por ejemplo, 50 resultados o 2 millones de
identificadores entre todos; pasado, se descarta el más viejo) y guardar las posiciones en un
`Uint32Array` (4 bytes en lugar de 8). O no guardar la búsqueda sin texto, que es la más grande y no
cuesta volver a calcular (30 ms). Costo: unas líneas y una prueba con el tope.

### 4. Cada transacción con productos rearma el índice entero en el hilo del servidor — Mejora (disponibilidad)

**Dónde:** `shared/search/index.ts:201` (`replace` arma todo con `build`, que ordena con
`Intl.Collator`); `server/modules/catalog/indexing.ts`. Lo llama cada lista aplicada, cada cambio de
cómo cobra un proveedor y cada baja de proveedor, aunque toque un solo producto.

**Lo que pasa:** medido, rearmar cuesta **unos 1,1 s con 100.000 productos y 2,4 s con 200.000**, de
una vez y sin ceder el turno. Mientras tanto el servidor no contesta nada: ni entrar, ni el espejo, ni
buscar. El diseño decía «sin frenar los pedidos». Alguien con «Cargar listas» o «Administrar
proveedores» que aplica listas de una fila o cambia un dato del proveedor una y otra vez deja al
servidor parado a ratos de 2 s; sin atacante, pasa con cada lista.

**Qué propongo:** para pocos cambios (menos de unos miles), poner al día lo que cambió sin rearmar
(insertar en el vocabulario y en las listas); para muchos, rearmar por partes cediendo el turno
(`setImmediate`, como hace 08 al aplicar) y cambiar el índice de una vez al terminar. Y una prueba de
rendimiento que mida el rearmado con el tope. Costo: medio día.

### 5. Si falla la puesta al día y su respaldo, el proceso se cae — Mejora (disponibilidad)

**Dónde:** `server/modules/catalog/writes.ts:128` (`refreshing = refreshing.then(() =>
deps.refresh(ids))`) e `indexing.ts` (si falla, rearma todo desde la base, sin `catch` del respaldo).
No hay `process.on('unhandledRejection')` en el servidor ni `--unhandled-rejections` en la imagen.

**Lo que pasa:** si la base no contesta justo después de confirmar una lista (un reinicio de
PostgreSQL, el pool sin conexiones), fallan `docsOf` y también `docs`. La promesa de `refreshing`
queda rechazada y nadie la atiende: Node 22, por defecto, termina el proceso. Si no lo terminara, la
cadena quedaría rechazada para siempre y el índice no se pondría al día nunca más hasta reiniciar.
No pude provocarlo en una prueba; sale de leer el código y de cómo trata Node una promesa rechazada
sin atender.

**Qué propongo:** `refreshing.then(...).catch(...)` que anote el error y deje una marca para rearmar
en el próximo pedido (o reintentar en unos segundos). Costo: tres líneas y una prueba con la base
fallando.

### 6. Buscar cuenta por sesión, no por persona; las marcas y el producto, sin límite — Mejora (disponibilidad)

**Dónde:** `routes/products.ts` (el límite de buscar es `catalog-search:session:<id>`, 120 por minuto;
`GET /api/catalog/brands` y `GET /api/catalog/products/:id` no tienen límite); `shared/search/index.ts:192`
(`brands()` recorre todos los productos y ordena en cada pedido).

**Lo medido con 200.000 productos:** la peor búsqueda que encontré (8 palabras de 5 letras, que buscan
también con un error) tarda unos 100 ms; 8 códigos empezados, 90 ms; `brands()`, 40 ms. Todo en el
hilo del servidor.

**El ataque:** con una sesión, 120 búsquedas por minuto de 100 ms son el 20 % del hilo; con cinco
sesiones de la misma persona (o una pestaña por sesión), el servidor no hace otra cosa. Las marcas,
sin límite: 25 pedidos por segundo a `/api/catalog/brands` lo dejan parado con una sola sesión.

**Qué propongo:** el límite de buscar por persona (como los cambios), las marcas guardadas en el
índice al armarlo (cambian solo cuando se rearma: 0 ms por pedido), y el producto con el mismo límite
que buscar. Costo: unas líneas.

### 7. La memoria del índice se midió con descripciones irreales — Mejora

**Dónde:** `catalog.perf.ts` (descripciones de 4 palabras, de un vocabulario de 15, más dos números);
el diseño decía «unos 60 MB» con el tope y el commit, 42 MB con 100.000.

**Lo medido:** con descripciones de 8 palabras más dos números, el índice retiene **unos 88 MB con
100.000 y 176 MB con 200.000** (el proceso, 400 MB mientras lo arma, porque conviven el índice viejo
y el nuevo). Con el tope entra en 1 GB, pero con menos margen del que dice la documentación, y el
punto 2 lo achica.

**Qué propongo:** que la prueba de rendimiento arme el tope (200.000) con descripciones parecidas a las
de una ferretería (6 a 10 palabras, códigos de verdad) y mire la memoria del proceso al rearmar, no
solo la retenida. Costo: la prueba.

### 8. Faltan las pruebas de ataque que pedía la revisión del diseño — Mejora

El código hace lo correcto en todos estos casos (lo leí); lo que falta es la prueba que intenta el
ataque y falla:

- **Los cambios sin «Ver costos»** (punto 4 de la revisión del diseño): con «Cambiar los datos de un
  producto» y sin «Ver costos», la respuesta de la unidad, del IVA y del `409 product-changed` no tiene
  `margin` ni `cost`. Hoy E17 lo prueba solo en la lista y en el producto.
- **Lo que entra** (punto 12): `'`, `%`, `\` y `;` en `q`, `brand` y `after` con «Dados de baja».
- **El tope con `restore`** (punto 2 de esta revisión).

Costo: unas pruebas en `changes.test.ts` y `search.test.ts`.

### 9. El recálculo del redondeo: el límite, el mensaje y los ejemplos — Mejora

**Dónde:** `administration/routes.ts` y `settings.ts`; `catalog/routes/changes.ts` (`lock_timeout`);
`catalog/recalculator.ts` (`realExamples`).

- **El límite:** el diseño (§ 9) decía 10 por minuto para el recálculo; el `POST` del redondeo tiene el
  de todos los ajustes, 30 por minuto por sesión. Alguien con «Cambiar los ajustes» puede recalcular
  todo el catálogo 30 veces por minuto, y cada vez traba todos los productos con precio. Queda cada
  cambio en Quién hizo qué. Propongo el límite propio del diseño, por persona.
- **El mensaje:** mientras recalcula, un cambio de margen espera 5 s y contesta `409 list-applying`
  («se está aplicando una lista»), que no es lo que pasa. Propongo un código propio o un texto que
  sirva para los dos casos.
- **La precisión:** `RoundingExample.calculated` sigue siendo `number` (`Number(row.raw)`): desde unos
  $ 90 billones en centavos pierde los últimos dígitos. Lo ve solo quien tiene «Ver costos», así que no
  filtra nada; es lo que pedía la revisión del diseño (punto 5) y quedó a medias. Propongo texto, como
  el resto de los precios.

Costo: chico en los tres.

### 10. T132: el límite por dispositivo lo elige quien pide — Mejora

**Dónde:** `sign-in/context.ts:74` y `:75`; `platform/http.ts:131` (el dispositivo es la cabecera
`X-Device-Id`, cualquier UUID que mande el pedido).

**Lo que pasa:** el límite que elige Administración cuenta por un identificador que inventa quien pide.
Quien prueba desde afuera manda un UUID nuevo en cada pedido y solo lo frena el tope fijo por dirección
(60 por minuto por forma de entrar). Es lo que decidió 01 · R2.9 y no abre nada: con Google no hay nada
que adivinar y con la huella, una firma. Dos cosas que quedan:

- **IPv6:** la clave es la dirección entera. Si el servidor se publica también por IPv6, quien tiene un
  bloque `/64` tiene millones de direcciones y el tope por dirección no lo frena. No pude comprobar si
  Caddy escucha en IPv6 en el servidor. Propongo contar las IPv6 por su `/64`. Costo: una función.
- **La dirección compartida** (lo que dijo la revisión del diseño, punto 11): cualquiera en la misma
  dirección pública que el local (el Wi-Fi de clientes, si sale por el mismo router) manda 60 pedidos
  basura por minuto a `/api/sign-in/passkey/options` y nadie del local entra con la huella ni confirma
  entradas sin conexión ese minuto. Es el riesgo que se aceptó al elegir el tope fijo. Lo bueno: una
  confirmación sin conexión frenada vuelve a intentarse sola y no se pierde
  (`app/modules/sign-in/offline/send.ts`, `too-many-attempts` en `later`), que era la duda que dejó la
  revisión del diseño.

### 11. T132: el celular acepta cualquier número de horas en `h` — Mejora (menor)

**Dónde:** `app/modules/sign-in/offline/option.ts:53`.

El celular toma cualquier entero positivo de la cabecera y lo guarda con su contacto. Quien puede
cambiar la cabecera de las respuestas (un proxy con un certificado instalado en el celular, una
extensión) le hace creer al celular que puede abrirse sin conexión, por ejemplo, 10.000 horas. El
servidor no confirma nada fuera de las horas de ahora (`offline/rules.ts`, con la prueba 15-R3.1), así
que no se abre ninguna sesión; lo que se alarga es lo que se ve en ese celular. Y quien controla las
respuestas ya controla la aplicación. Por defensa en profundidad, propongo aceptar solo los valores de
`offlineHoursOptions` (4 a 72) y si no, ignorarlo. Costo: una línea y una prueba.

El celular no manda `h` al servidor y el servidor no lee esa cabecera de ningún pedido: un celular no
puede cambiar con ella nada del servidor.

### 12. Un cambio de margen durante la puesta al día deja mal «Sin precio» — Mejora (integridad)

**Dónde:** `routes/changes.ts` (`ctx.index.setPriced` al confirmar) y `indexing.ts` (la puesta al día
lee la base y después rearma).

Si la puesta al día de una lista leyó el producto antes de que se confirmara un cambio de margen y
rearma después, el índice vuelve a tener el «tiene precio» viejo, hasta que otra lista toque ese
producto. «Sin precio» y su número quedan mal. No da acceso a nada. Propongo que `setPriced` también
se encole en `refreshing` (o que se relea ese producto al terminar). Costo: una línea.

## Lo que pedía la revisión del diseño

| Punto del paso 4 | Estado |
|---|---|
| 1. Panel del redondeo sin precios reales | Hecho: `preview(seesCosts)` con ejemplos inventados, y su prueba (06-R3.7) |
| 2. El margen y el precio dan el costo | Hecho: R4.1 reserva el margen a «Ver costos»; prueba E17. Queda el camino de Quién hizo qué (punto 1) |
| 3. Sesión en las lecturas | Hecho: `sessions.require` en las tres; prueba E26 y la de todas las rutas |
| 4. R4.1 en toda respuesta | Hecho en el código (`rowOf` con los permisos, también el `409`); falta la prueba (punto 8) |
| 5. El precio en un `bigint` | Hecho: centavos (1,3 × 10¹⁶ como mucho) y como texto; los ejemplos, todavía `number` (punto 9) |
| 6. Tope del índice; dados de baja fuera | Hecho a medias: el tope se esquiva (punto 2) y se midió con 100.000 (punto 7); los dados de baja, fuera |
| 7. Buscar: límite, 8 palabras, error desde 4 letras, páginas sin recalcular | Hecho; el límite es por sesión y lo guardado no tiene tope (puntos 3 y 6) |
| 8. Límite del panel y del recálculo; `lock_timeout` | El panel, 10 por minuto; el recálculo, 30 (punto 9); `lock_timeout` de 5 s en los cambios |
| 9. Las horas en la cabecera | Hecho: `h` a los celulares con sesión, en cada respuesta; prueba E57 |
| 10. Las horas con el contacto; sin ellas, 4; el corte con el mismo valor | Hecho: `offline-contact` con `hours`, `fallbackOfflineHours = 4`, `offlineSessionOver` con las mismas |
| 11. Límite por dirección fijo y más alto | Hecho: 60 por minuto fijo, por forma de entrar; `too-many-attempts` en la confirmación se reintenta |
| 12. Lo que entra | Hecho: `q` y `brand` hasta 80, `after` hasta 200 y con su forma, `show` de su lista, parámetro desconocido `400`; faltan las pruebas con caracteres raros (punto 8) |
| 13. Auditoría | Hecho: el precio de antes y de después, el identificador del producto y el límite por persona |
| 14. El índice distinto de la base | Hecho: si falla, se rearma; pero el respaldo puede tirar el proceso (punto 5) y rearma todo siempre (punto 4) |
| 15. Lo que queda en el dispositivo | Es de a2 |
| 16. El paso en centavos en todos los documentos | Hecho: migración (0 → 1, × 100) con su prueba |

## Lo que miré y no encontré nada

- **Inyección SQL:** todas las consultas del catálogo van con parámetros de `sql\`\``; los lotes viajan
  como un JSON en un solo parámetro; `after` de «Dados de baja» se valida (texto y UUID) y va como
  parámetro en la comparación; `lock_timeout` también. Nada se arma como texto.
- **Permisos:** las tres lecturas piden sesión; los tres cambios, sesión, el permiso (antes de leer el
  cuerpo o la base) y el límite por persona. «Cambiar márgenes» incluye «Ver costos» en el servidor
  (prueba E18). El rechazo queda en Quién hizo qué (E19).
- **Lo ajeno por un identificador:** el catálogo es uno para todo el local; el identificador se valida
  como UUID. Lo guardado de una búsqueda es por sesión: otra sesión no lo puede leer.
- **Fugas en los errores:** `404`, `409 list-applying` y `400` no traen datos del producto; el `409
  product-changed` sale de `rowOf` con los permisos de quien pide.
- **El panel del redondeo:** sin «Ver costos», nombres y números inventados; los números de cuántos
  cambian con cada paso son de todo el catálogo y no dejan sacar el precio de un producto.
- **Pedidos desde otros sitios:** los cambios son `POST` con el control de `Origin`, `Content-Type`
  JSON y el dispositivo de la plataforma.
- **Sin conexión (T132):** el servidor confirma con las horas de ahora, no con las del celular (prueba
  15-R3.1); la hora del celular sigue acotada (29 días atrás, uno adelante).
- **Datos personales:** ninguno nuevo; nada sale a terceros. Los nombres de los productos van a la
  auditoría como objetivo, no como HTML.
- **Secretos, despliegue y dependencias:** nada nuevo en el `.env`, Caddy ni el compose; ninguna
  biblioteca nueva; `pnpm audit --prod`, sin fallas.
