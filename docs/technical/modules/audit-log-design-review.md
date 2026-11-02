# Revisión del diseño técnico · 05 · Quién hizo qué (`audit-log`)

Revisión independiente del [diseño](audit-log.md) (constitución, paso 4), hecha con los documentos:
la constitución, el [capítulo 05](../../chapters/05-audit-log/rules.md) (R1 a R5, E01 a E39 con E35b a
E35d), el [capítulo 15](../../chapters/15-offline/rules.md) en lo que toca (R3.2, R3.3), el capítulo 00
en R8.4, la [arquitectura](../architecture.md), el ADR-004, el ADR-007,
[mobile-data.md](../mobile-data.md), los diseños de [01](sign-in.md) (§ 9), [02](users.md) (§ 9 y la
auditoría de roles) y [15](offline.md) (§ 9), y la maqueta aprobada
`mockups/users-who-did-what/desktop/variant-1-ledger/` (su captura y su código: la tira, el resumen y
tocar una raya). Miré además el código de hoy en lo que el diseño dice cambiar:
`src/server/platform/storage/audit.ts`, `platform/guards.ts`, `platform/permissions.ts`,
`src/server/first-administrator.ts` y los tipos que anota cada módulo.

Cada punto dice dónde está, qué propone el diseño, qué veo y qué tan grave es:

- **Frena:** hay que resolverlo antes de que Carlos lo apruebe.
- **Mejora:** conviene hacerlo, pero no frena.

## Resumen

La base es buena: una forma común de la acción, el catálogo compartido que el servidor usa solo para
filtrar y contar, los textos armados con trozos y no con HTML, ninguna ruta que escriba, nada en
PostgreSQL y la lista sin pedidos solos. El catálogo de § 4 cubre todos los tipos que el código anota
hoy (los comparé uno por uno), salvo el que el propio diseño agrega.

Lo que frena: **el color por tipo no alcanza** (la maqueta aprobada pinta de rojo «Le sacó el rol
Cajero», que es `user.roles-changed`, y el diseño lo deja sin color); **la tira por minuto** contradice
R4.9 («una raya por acción») y la maqueta (tocar una raya elige esa acción); qué hace tocar un número
del resumen con la fecha y el tipo no está dicho; **«Hoy», «Ayer» y «de hoy» con qué reloj** (si es el
del dispositivo, contra el principio VI); los pedidos al volver la conexión o a la pestaña no están en
`mobile-data.md`; E39 «una página que no existe» no se rechaza; `GET /api/audit-log/people` no dice qué
permiso pide; **la consulta síncrona de `node:sqlite` congela el único proceso** hasta 150 ms por
pedido; la consulta en `platform/` necesitaría el catálogo, que es del negocio; y el relleno de
`actor_kind` en las filas viejas modifica la auditoría y clasifica mal lo del sistema. Casi todo se
resuelve con dos decisiones: **guardar el color de cada acción como columna al escribirla** y
**empezar los archivos con la forma nueva**, sin compatibilidad con la vieja (solo hay datos del
ambiente de pruebas).

| # | Punto | Gravedad |
|---|---|---|
| 1.1 | Sacar un rol va en rojo en la maqueta; el diseño da un color fijo por tipo | Frena |
| 1.2 | La tira por minuto, contra «una raya por acción» (R4.9) y la maqueta | Frena |
| 1.3 | Tocar un número del resumen: qué pasa con la fecha y con el tipo | Frena |
| 1.4 | «Hoy», «Ayer», «Esta semana», «Este mes» y «de hoy»: con qué reloj | Frena |
| 1.5 | Recargar al volver la conexión o a la pestaña, sin anotar en `mobile-data.md` | Frena |
| 1.6 | E39: una página más allá de la última no se rechaza | Frena |
| 1.7 | Las filas viejas: `actor_kind` relleno a mano y «Hecho a» que no las encuentra | Frena |
| 1.8 | E09: qué hora se muestra, por cuál se ordena y por cuál se filtra | Mejora |
| 1.9 | El catálogo: falta `audit-log.throttled`; `sign-in.rejected` tiene muchos motivos | Mejora |
| 1.10 | El nombre del primer Administrador hasta el próximo arranque | Mejora |
| 1.11 | La cabecera del día con su cantidad (maqueta) | Mejora |
| 2.1 | `node:sqlite` es síncrono: una consulta de 150 ms frena todo el servidor | Frena |
| 2.2 | Las consultas crecen con los años de historia | Mejora |
| 2.3 | Resumen y tira en cada página: consultas y bytes de más | Mejora |
| 2.4 | `around` agrega una consulta que no está en la cuenta | Mejora |
| 2.5 | El plan de las consultas con `in (…)` y la meta probada solo a mano | Mejora |
| 2.6 | Índices: tipo y persona como texto, contra el ADR-004 | Mejora |
| 2.7 | Leer sin bajar la tanda pendiente | Mejora |
| 2.8 | Páginas profundas con `offset` | Mejora |
| 3.1 | La compatibilidad con la forma vieja, solo por datos de prueba | Mejora |
| 3.2 | `names.sqlite` buscado por fecha, en vez de guardar el nombre en la acción | Mejora |
| 3.3 | El color como columna, escrita al anotar | Mejora |
| 3.4 | `device.label` en castellano desde el servidor | Mejora |
| 3.5 | `platform/storage/audit*` en una carpeta | Mejora |
| 3.6 | `business-time.ts` en `contracts/` | Mejora |
| 4.1 | Un tipo «llegó al límite» por módulo | Mejora |
| 5.1 | `GET /api/audit-log/people` sin permiso declarado | Frena |
| 5.2 | Los 8 KB: «se rechaza» o «se anota cortada» | Mejora |
| 5.3 | Personas, grupos y tipos que no existen; combinaciones | Mejora |
| 5.4 | Cuánto se guardan los correos y las direcciones | Mejora |
| 6.1 | La consulta en `platform/` necesita el catálogo del negocio | Frena |
| 6.2 | Cada módulo nuevo toca `src/shared/audit-log/` | Mejora |
| 7.1 | `at` siempre es la hora de llegada: lo hecho sin conexión necesita otra | Mejora |
| 7.2 | El año del archivo: UTC o el del negocio | Mejora |
| 7.3 | A 100 personas | Mejora |

## 1. Escenarios sin cubrir

Cubiertos y sin observaciones: E01, E02, E03, E04, E05, E06, E07, E08, E10, E11, E12, E13, E14, E15,
E16, E17, E18, E19, E20, E21 (salvo 1.1), E23, E24, E26, E27, E28, E29, E30, E31, E32, E33, E34 (salvo
1.5), E35, E35b, E35d, E36 (salvo 1.5), E37 y E38.

### 1.1 Sacar un rol va en rojo en la maqueta; el diseño da un color fijo por tipo — Frena

- **Dónde:** § 4, `tone` por tipo; la tabla pone `user.roles-changed` sin color.
- **Qué propone:** cada tipo tiene un color fijo; el servidor filtra y cuenta rojo y ámbar por la
  lista de tipos de ese color.
- **Qué veo:** la maqueta aprobada («tal cual», `screens.md`) muestra «Le sacó el rol Cajero a Martín
  Sosa» en rojo, con la pastilla «Borra o saca»; R4.4 dice «Rojo: lo que borra o saca». E21 dice que
  un rol **dado** va sin color. Un mismo tipo (`user.roles-changed`) es rojo o no según `changes`, y el
  diseño no lo puede expresar ni filtrar: el número «Sacó o borró» del resumen y `tone=red` dejarían
  afuera las acciones que sacan un rol. Pasa algo parecido con `session.closed`: R4.4 pone en rojo
  «cerrar las sesiones **de otro**»; si alguien cierra una sesión propia desde Usuarios, con el color
  fijo sale en rojo.
- **Opciones:** (a) el color lo calcula el catálogo con la acción (`tone: (e) => …`) **al anotar** y se
  guarda como columna (3.3): el servidor filtra por esa columna y no necesita el catálogo para leer;
  (b) partir el tipo (`user.role-given`, `user.role-taken`), que no sirve cuando un guardado da y saca
  a la vez. Recomiendo (a).

### 1.2 La tira por minuto, contra «una raya por acción» — Frena

- **Dónde:** § 5, `strip: [{ minute, count, tone }]`; § 7, `Summary` pide la página con `around`.
- **Qué propone:** un punto por minuto con la cantidad y el color más fuerte; tocar la raya pide la
  página que contiene ese instante.
- **Qué veo:** R4.9 dice «una raya por acción, en su hora y con su color; tocar una raya elige **esa
  acción**». La maqueta pinta una raya por acción y su título dice la hora y el tipo. Con varias
  acciones en el mismo minuto, el diseño no sabe cuál elegir (`selected` sale de un instante, no de
  una acción), y el título no puede decir el tipo. Además, la maqueta, si la acción de la raya no está
  en la lista filtrada, saca los filtros y va a su página; el diseño no dice qué pasa (¿`selected`
  vacío?).
- **Opciones:** (a) una raya por acción con `{ id, at, tone }` (unos 35 bytes cada una; con las 300
  de hoy, unos 10 KB sin comprimir y menos de 2 KB con gzip) y `around=<id>` en vez de un instante;
  (b) por minuto solo pasado un tope (por ejemplo, más de 600 en el día), diciendo que ahí la raya
  elige la más nueva de ese minuto: es un cambio de regla y lo decide Carlos. Y en los dos casos,
  escribir qué pasa cuando la acción no coincide con los filtros (la maqueta: los saca).

### 1.3 Tocar un número del resumen: qué pasa con la fecha y con el tipo — Frena

- **Dónde:** § 5, `tone` y «el resumen cuenta en el período de `from`/`until` (sin fechas: hoy)»;
  § 7, `Summary` «pone y saca `tone`».
- **Qué veo:** al abrir no hay filtro de fecha (R4.2: todo) pero el resumen es de hoy (R4.9). Si al
  tocar «4 Rechazos» solo se agrega `tone=amber`, la lista muestra los rechazos de toda la historia
  bajo un número que dice 4: E35c queda ambiguo. La maqueta resuelve las dos cosas: tocar un número
  pone la fecha en «Hoy» (el período del resumen) y saca tipo y grupo; `tone` es un valor más del
  filtro «Tipo» («Rechazos y sin confirmar», «Lo que borra o saca»), excluyente con grupo y tipo.
- **Propuesta:** escribirlo así: el número pone la fecha del período del resumen y deja `tone` como
  tercera forma del filtro Tipo, que no se combina con `group` ni `type` (el servidor rechaza la
  combinación con `400`; ver 5.3).

### 1.4 «Hoy», «Ayer», «Esta semana», «Este mes» y «de hoy»: con qué reloj — Frena

- **Dónde:** § 5, `from`/`until` como días del negocio; § 7, `Filters` y `Ledger`.
- **Qué veo:** el diseño dice cómo el servidor convierte días en instantes, pero no quién calcula qué
  día es «hoy». Si la aplicación arma `from=until=<hoy>` con `new Date()`, usa el reloj del
  dispositivo, que el principio VI prohíbe usar como hora (puede estar atrasado o sin pila). Lo mismo
  para E22 («la fecha, si no es de hoy») y para la cabecera «Hoy, miércoles 4 de noviembre».
- **Opciones:** (a) los atajos viajan como palabras (`range=today|yesterday|week|month`) y el servidor
  los resuelve con su reloj; la respuesta trae el día del negocio de hoy (`today: "2026-11-04"`) para
  que la lista decida «de hoy»; (b) la aplicación usa la hora del servidor más el cronómetro, que ya
  guarda la plataforma (ADR-007). (a) es más simple y no depende de nada más.

### 1.5 Recargar al volver la conexión o a la pestaña, sin anotar en `mobile-data.md` — Frena

- **Dónde:** § 6, «No se suma nada a mobile-data.md»; R4.6 «al volver a la pestaña»; R5.1 y E36
  «vuelve sola al volver la conexión».
- **Qué veo:** el principio III y `mobile-data.md` cuentan como automático todo pedido «al abrir, al
  volver la conexión o al volver a la vista». El diseño no dice si «volver a la pestaña» es tocar la
  pestaña (un toque: no se anota) o volver a la vista de la aplicación (automático), ni si «vuelve
  sola» vuelve a pedir la lista (automático) o solo saca el gris. Si cualquiera de las dos pide algo,
  falta la fila en `mobile-data.md` con lo que pesa (la lista de 10 en el celular, sin la tira: unos
  4 KB) y la aprobación de Carlos.
- **Propuesta:** escribir cuál es cada una. Si «vuelve sola» recarga, anotarlo; si solo saca el gris
  y la lista queda como estaba hasta que se toque, decirlo.

### 1.6 E39: una página más allá de la última no se rechaza — Frena

- **Dónde:** § 5, `page` «entero de 1 a 100.000».
- **Qué veo:** E39 pide rechazar «una página que no existe». Con 45 acciones, `page=7` pasa la
  validación y devuelve una lista vacía con `page: 7, pages: 3`. Falta decir que, contados los
  totales, una página mayor que `pages` (con al menos una acción) da `400` con `page`. Con cero
  acciones, la página 1 es válida (E20).

### 1.7 Las filas viejas: `actor_kind` relleno y «Hecho a» que no las encuentra — Frena

- **Dónde:** § 3, `actor_kind` «en las filas viejas, 0 si tienen `user_id` y 2 si no»; § 2, «se leen
  con su forma vieja».
- **Qué veo:**
  - Ponerle `actor_kind` a las filas viejas es un `update`, y la auditoría «solo recibe filas y no se
    modifica» (principio V, ADR-004). `alter table … add column … default` no puede mirar `user_id`;
    calcularlo al leer (`coalesce(actor_kind, case …)`) deja sin uso el índice.
  - La regla clasifica mal: `role.permissions-added` (el arranque, `access.ts`) y `session.ended` por
    vencimiento no tienen `user_id` y son del sistema, no de «Alguien sin entrar».
  - Las filas viejas no tienen fila en `targets`: «Hecho a: Marcos» no encuentra lo que le hicieron
    antes del cambio (E24), aunque el `data.targetUserId` esté en el `payload`.
  - Leer las dos formas es código que tiene que tener cobertura total y que se queda para siempre,
    para datos que solo existen en el ambiente de pruebas.
- **Propuesta:** ver 3.1 (archivos nuevos con la forma nueva). Si Carlos prefiere conservar los de
  prueba, que sea con un `update` declarado como excepción y con `system` para los tipos del sistema.

### 1.8 E09: qué hora se muestra, por cuál se ordena y por cuál se filtra — Mejora

- **Dónde:** § 2, `at` y `deviceTime`.
- **Qué veo:** E09 dice que la entrada no confirmada «va con la hora del celular». El diseño guarda
  las dos, pero no dice que la lista muestra `deviceTime` con la marca, mientras ordena, filtra por
  fecha y pinta la tira por `at` (la llegada). Una entrada de las 9:40 que llega a las 15:00 aparece
  entre las de las 15:00, y con «Ayer» puede no salir si llegó hoy. Es razonable, pero tiene que estar
  escrito, y el detalle debería mostrar las dos («hora del celular, sin confirmar: 9:40 · llegó
  15:00»), como pide 15 · R3.3.

### 1.9 El catálogo: falta `audit-log.throttled`; `sign-in.rejected` tiene muchos motivos — Mejora

- **Dónde:** § 4 (tabla) y § 8 («una línea `audit-log.throttled` por ventana»).
- **Qué veo:**
  - `audit-log.throttled` es un tipo nuevo de este módulo y no está en la tabla (grupo, ícono, texto).
    La prueba del catálogo lo atraparía, pero el diseño tiene que decirlo (y ver 4.1).
  - `sign-in.rejected` se anota en ocho lugares del código con motivos distintos (`method` y `reason`:
    cuenta no autorizada, dada de baja, `invalid-credential`, `nonce`, `unknown-passkey`,
    `invalid-permit`, código vencido…). La tabla le da un solo texto, «Intentó entrar con un correo no
    autorizado». `says` tiene que elegir el texto por `data.reason`; conviene listar los motivos y su
    texto, porque es justo lo que más interesa leer (R1.2).
  - La maqueta pone las entradas no confirmadas en un grupo «Sin conexión» con la pastilla «Sin
    confirmar»; el diseño las pone en «Rechazos». Las dos cumplen R4.4 (ámbar), pero el filtro por
    grupo cambia: que Carlos lo vea en la captura del paso 5.

### 1.10 El nombre del primer Administrador hasta el próximo arranque — Mejora

- **Dónde:** § 3, «Se escribe en la misma tanda que la acción que trae `names`: … el primer
  Administrador» y `audit.knowNames` al arrancar.
- **Qué veo:** el primer Administrador lo carga un comando aparte
  (`docker compose exec server node src/server/first-administrator.ts`), otro proceso que hoy no abre
  la auditoría. Si escribiera en ella, serían dos procesos escribiendo el mismo SQLite (el ADR-004
  dice uno). Si no, su nombre llega recién con el próximo arranque, y hasta entonces sus acciones
  salen sin nombre.
- **Propuesta:** que la consulta, ante una persona sin nombre en `names.sqlite`, lo pida a la fachada
  de `users` (una consulta en lote), o que `knowNames` corra también al abrir la primera sesión de una
  persona desconocida. O, con 3.2, que el nombre viaje en la acción y el problema no exista.

### 1.11 La cabecera del día con su cantidad — Mejora

- **Dónde:** § 7, `Ledger` «agrupada por día».
- **Qué veo:** la maqueta pone en la cabecera de cada día «20 acciones». Para hoy sale del resumen;
  para otro día, ni la respuesta ni el diseño lo traen. Decir si se muestra y de dónde sale, o que no
  se muestra.

## 2. Performance

**Las consultas de `GET /api/audit-log`, contadas con el diseño:** ninguna a PostgreSQL. A SQLite,
sin fechas y con tres años de archivos: 3 `count(*)` + 1 o 2 de la página + 1 del resumen + 1 de la
tira + 1 de los nombres, y 1 más con `around`: de 7 a 9, y una más por cada año que se suma.
`GET /api/audit-log/people`: 1.

### 2.1 `node:sqlite` es síncrono: una consulta de 150 ms frena todo el servidor — Frena

- **Dónde:** § 9, «menos de 150 ms … con cualquier combinación de filtros»; § 8, 60 por minuto.
- **Qué veo:** `DatabaseSync` corre en el hilo principal del único proceso (ADR-001). Mientras cuenta
  730.000 filas, ninguna otra ruta contesta: una búsqueda de precios (meta de 100 ms, principio II)
  que llega en ese momento espera. El límite de 60 pedidos por minuto deja que una sola sesión ocupe
  el servidor hasta 9 segundos por minuto. La meta no dice nada de esto.
- **Opciones:** (a) las lecturas de la auditoría en un `worker_thread` con su propia conexión de solo
  lectura (WAL lo permite) y una cola de una consulta a la vez: el hilo principal no se frena;
  (b) una meta mucho más baja para el caso común (sin filtros, hoy) y una cota dura con
  `progress`/interrupción; (c) bajar el límite a algo cercano al uso humano (por ejemplo, 20 por
  minuto). (a) es la que no cierra la puerta a la escala (principio IX) y cabe detrás de la interfaz
  de `platform/storage/audit`.

### 2.2 Las consultas crecen con los años de historia — Mejora

- **Dónde:** § 5, «La consulta, sobre los años», paso 1 y 2.
- **Qué veo:** sin fechas (lo que se ve al abrir) se hace un `count(*)` por cada archivo que existe.
  La constitución pide «una cantidad fija de consultas por pedido»; esto crece uno por año. Los
  archivos de los años cerrados no cambian nunca.
- **Opciones:** guardar en memoria el total de cada año cerrado por combinación de filtros (o, al
  menos, el total sin filtros, que es el de la apertura); o abrir los años con `attach` y hacer una
  sola consulta con `union all`. La primera es más simple.

### 2.3 Resumen y tira en cada página: consultas y bytes de más — Mejora

- **Dónde:** § 5, la respuesta lleva siempre `summary` y, en la computadora, `strip`.
- **Qué veo:** el resumen y la tira dependen solo de las fechas, pero se calculan y se mandan en cada
  cambio de página, de persona o de tipo: dos consultas y hasta 1.440 puntos de más por pedido.
  Además la meta de «menos de 15 KB» no dice si es comprimido: 1.440 puntos de unos 40 bytes son unos
  58 KB sin comprimir.
- **Propuesta:** pedirlos solo al abrir, al cambiar la fecha y con «Actualizar» (`summary=1`), y
  escribir la meta comprimida y sin comprimir.

### 2.4 `around` agrega una consulta que no está en la cuenta — Mejora

- **Dónde:** § 5 y § 9.
- **Qué veo:** saber en qué página cae un instante es contar las filas más nuevas con los mismos
  filtros: una consulta más (o una por año), que § 9 no cuenta. Sumarla a la meta y a la prueba que
  cuenta.

### 2.5 El plan de las consultas con `in (…)` y la meta probada solo a mano — Mejora

- **Dónde:** § 3, índices; § 10, «una de tiempo con 730.000 acciones (fuera de `pnpm check`, a
  mano)».
- **Qué veo:** un grupo o un color son `type in (…)`. Con `order by at desc, id desc`, SQLite puede
  elegir `events (at, id)` y filtrar fila por fila: para un tipo raro recorre el año entero. Qué índice
  elige depende de las estadísticas, y nada en el diseño las arma (`analyze` / `pragma optimize`). La
  única prueba que lo notaría corre a mano, así que un cambio que rompe el plan pasa `pnpm check`.
- **Propuesta:** pruebas unitarias que miren `explain query plan` de cada forma de consulta (rápidas,
  sin datos grandes) y `pragma optimize` al abrir cada archivo. Con 3.3, el color pasa a ser una
  columna con índice y se evita el `in` para rojo y ámbar.

### 2.6 Índices: tipo y persona como texto, contra el ADR-004 — Mejora

- **Dónde:** § 3, columnas `type text` y `user_id text` en tres índices.
- **Qué veo:** el ADR-004 decide «el tipo y la persona como enteros» para que el archivo y sus índices
  sean compactos. El diseño los deja como texto (un UUID son 36 bytes, repetidos en cada índice). A
  730.000 filas no importa; a la escala de 100 personas (7.1), sí. Hay que alinear: o enteros con una
  tabla de tipos y otra de personas por archivo, o cambiar el ADR diciendo por qué no hace falta.
  También `targets (target_id, event_id)` no tiene `at` ni `kind`, que el ADR pide («por dato afectado
  y fecha»): como `id` sigue el orden de escritura, sirve, pero conviene decirlo.

### 2.7 Leer sin bajar la tanda pendiente — Mejora

- **Dónde:** § 5, la consulta.
- **Qué veo:** la tanda junta hasta un segundo en memoria. Quien hace un cambio y abre Quién hizo qué
  enseguida puede no verlo. El `read` de hoy baja la tanda antes de leer; el diseño no lo dice de la
  consulta nueva. Escribirlo.

### 2.8 Páginas profundas con `offset` — Mejora

- **Dónde:** § 5, `page` hasta 100.000.
- **Qué veo:** la página 30.000 obliga a recorrer 600.000 filas del índice. Es raro que alguien llegue,
  pero entra en la meta de «cualquier combinación». Alcanza con decirlo en la meta o acotar `page` a
  `pages`, que ya resuelve 1.6.

## 3. Simpleza

### 3.1 La compatibilidad con la forma vieja, solo por datos de prueba — Mejora

- **Dónde:** § 2 y § 3: `pragma user_version`, `alter table … add column`, leer las dos formas, «Otros»
  y el texto genérico para lo viejo.
- **Qué veo:** el diseño dice que solo hay acciones viejas en el ambiente de pruebas. Mantener dos
  formas de lectura, una migración de columnas y el relleno de 1.7 cuesta código con cobertura total
  para siempre. Lo simple: la forma nueva en archivos nuevos (por ejemplo, el nombre del archivo con
  la versión, `2026.v1.sqlite`, o mover los viejos del ambiente de pruebas a otra carpeta), sin tocar
  ninguna fila. Lo decide Carlos, porque mover los archivos de prueba es tocar la auditoría de ese
  ambiente. El grupo «Otros» para tipos que no están en el catálogo sí conviene mantenerlo.

### 3.2 `names.sqlite` buscado por fecha, en vez de guardar el nombre en la acción — Mejora

- **Dónde:** § 3, `names.sqlite` con `(user_id, since)`; § 5, paso 4.
- **Qué propone:** el nombre «de ese momento» se busca por fecha en una tabla aparte, con un relleno
  al arrancar y la regla de que las acciones anteriores al primer `since` usan el primero.
- **Qué veo:** a las cosas que no son personas el diseño ya les guarda el nombre en la acción. Hacer
  lo mismo con las personas (quién y a quién, en el `payload`) quita la búsqueda por fecha, la regla
  del «antes del primero», el caso de 1.10 y los empates de milisegundo entre `since` y `at`. La tabla
  de nombres sigue haciendo falta, pero más simple: el nombre y el correo **de hoy** de cada persona,
  también las borradas (E30 y «(hoy: …)»), con el último por persona. Cuesta unos bytes comprimidos
  por acción.

### 3.3 El color como columna, escrita al anotar — Mejora

- **Dónde:** § 4, «Lo que usa el servidor: `group` y `tone`».
- **Qué veo:** si el color se calcula una vez al anotar y se guarda (una columna chica con índice
  `(tone, at, id)`), se resuelve 1.1, el servidor no necesita el catálogo para filtrar ni contar
  colores (6.1) y el resumen es un `group by tone`. Un color que cambie después en el catálogo no
  cambia el de las acciones ya anotadas, que es lo correcto para un registro.

### 3.4 `device.label` en castellano desde el servidor — Mejora

- **Dónde:** § 2, `device: { phone, label }` («Chrome en Android»).
- **Qué veo:** § 1 dice «el servidor no arma textos», pero guarda una etiqueta en castellano. Guardar
  códigos (`{ phone, browser: 'chrome', os: 'android' }`) y que la aplicación los diga deja la
  plataforma sin textos y permite cambiar cómo se dice sin tocar lo anotado. Si se sigue con la
  etiqueta porque la lista cerrada de 01 ya existe, vale, pero decir por qué.

### 3.5 `platform/storage/audit*` en una carpeta — Mejora

- **Dónde:** § 11, `audit.ts` crece (forma, columnas, `targets`, nombres, versión) y se suma
  `audit-query.ts`.
- **Qué veo:** la constitución pide agrupar por concepto. `platform/storage/audit/` con `write.ts`,
  `query.ts`, `names.ts` y `schema.ts` se lee como índice.

### 3.6 `business-time.ts` en `contracts/` — Mejora

- **Dónde:** § 5, `src/shared/contracts/business-time.ts`.
- **Qué veo:** `contracts/` es la forma de lo que entra y sale por la API. La zona horaria del negocio
  y la conversión de días en instantes no son eso: `src/shared/time/` (o `business-time/`) se
  encuentra mejor, y el 06 sabe dónde cambiarla.

## 4. Repetición

### 4.1 Un tipo «llegó al límite» por módulo — Mejora

- **Dónde:** § 4 (`sign-in.throttled`, `users.throttled`) y § 8 (`audit-log.throttled`).
- **Qué veo:** los tres los anota el mismo paso, `guards.limit`/`throttle`, con `data.key`. Cada
  módulo nuevo suma otro tipo con su ícono distinto (R4.10), otro renglón del catálogo y otro texto.
  Un solo tipo de la plataforma, `request.throttled`, con el tema en `data` y el texto armado con él,
  alcanza. Si Carlos quiere filtrarlos por módulo, el filtro por grupo ya lo hace.

Fuera de eso no veo lógica repetida: `deviceLabel` e `isPhone` pasan a la plataforma en vez de
copiarse, y el corte de computadora y celular es el del marco.

## 5. Seguridad

Cubiertos: el permiso de la ruta principal, ninguna ruta que escriba, los parámetros con zod y como
parámetros de SQLite, el correo cortado, el navegador de una lista cerrada, la dirección de la
plataforma, el texto sin HTML, el `403` anotado una vez por minuto (lo hace hoy
`platform/permissions.ts`) y el límite de pedidos. Revisé lo que el código anota hoy en `data` y no
hay secretos (motivos, métodos y claves del límite, que llevan la dirección y el id del dispositivo).

### 5.1 `GET /api/audit-log/people` sin permiso declarado — Frena

- **Dónde:** § 5, «Las personas del filtro vienen en `GET /api/audit-log/people`».
- **Qué veo:** el permiso `audit-log.view` se dice solo de `GET /api/audit-log`. La lista de personas
  trae el correo de cada una, también de las dadas de baja y las borradas: es dato personal que solo
  debe ver quien tiene el permiso (R3.4). Escribir que pide sesión y `audit-log.view`, con el mismo
  `403` anotado, y sumarlo a la prueba de E14.

### 5.2 Los 8 KB: «se rechaza» o «se anota cortada» — Mejora

- **Dónde:** § 2, «se rechaza una acción de más de 8 KB (se anota cortada, con `data.truncated:
  true`)».
- **Qué veo:** las dos cosas a la vez no pueden ser. Si se corta, hay que decir qué se corta (¿`data`?
  ¿`changes`, que es lo que pide R2.5?) y que la acción original igual se hizo: anotarla cortada es
  mejor que perderla (R1.1). Decir también qué textos de afuera entran en `changes` (nombres de
  personas y de roles), con su largo máximo ya validado por 02, para que el tope no se alcance en un
  uso normal.

### 5.3 Personas, grupos y tipos que no existen; combinaciones — Mejora

- **Dónde:** § 5, validación.
- **Qué veo:** E39 habla de «un filtro que no existe». Para `group` y `type` el diseño lo cubre; para
  `by` y `to`, un UUID que nunca existió da una lista vacía sin error. Decir cuál de las dos es (los
  ids están en `names.sqlite`, así que validarlo cuesta una consulta). Tampoco dice qué pasa con
  `type` de otro grupo que `group`, ni con `tone` junto con `group` o `type` (ver 1.3), ni con `around`
  sin `strip` o fuera del período.

### 5.4 Cuánto se guardan los correos y las direcciones — Mejora

- **Dónde:** § 8, «Qué datos toca».
- **Qué veo:** los correos de quien intentó entrar y las direcciones de internet quedan para siempre
  hasta que T116 decida. Es dato personal de gente ajena al negocio. No frena, porque el capítulo lo
  deja para el plan de copias, pero conviene anotarlo en T116 como requisito (cuánto tiempo y cómo
  se borra un año entero, que el archivo por año ya permite).

La integridad del archivo frente a quien tiene acceso al servidor está dicha y anotada (T116): bien.

## 6. Fronteras

### 6.1 La consulta en `platform/` necesita el catálogo del negocio — Frena

- **Dónde:** § 11, tarea 3, «La consulta (`platform/storage/audit-query.ts`): … filtros, resumen,
  tira»; § 4, el servidor usa `group` y `tone` del catálogo.
- **Qué veo:** para filtrar por grupo o color y contar rechazos y lo rojo hay que saber qué tipos son
  de cada uno: eso está en `src/shared/audit-log/`, con los tipos y textos de cada módulo. Si
  `platform/` lo importa, rompe «`platform/` sin negocio», que controla `pnpm check`. El diseño no dice
  quién traduce.
- **Propuesta:** la consulta de la plataforma recibe listas de tipos (y, con 3.3, colores) y devuelve
  cuentas por tipo o por color; `modules/audit-log/rules.ts` traduce grupo y color con el catálogo.
  Escribir también qué tiene el módulo del servidor (`index.ts`, `routes.ts`, `rules.ts`), que § 11
  solo nombra.

### 6.2 Cada módulo nuevo toca `src/shared/audit-log/` — Mejora

- **Dónde:** § 4, un archivo por módulo en `src/shared/audit-log/` y un `index.ts` que los junta.
- **Qué veo:** R1.1 pide que un capítulo nuevo sume sus acciones «sin cambiar este». Con el catálogo
  en `shared/`, cada módulo nuevo toca código común, que la constitución pide tomar como tarea propia
  («Trabajo en paralelo»). Hay que escribirlo en el diseño (y en la guía de un módulo nuevo), o
  declarar `src/shared/audit-log/<module>.ts` como del módulo y solo el `index.ts` como común. No veo
  ciclos: `users` (aplicación) importa solo la fachada de `audit-log`, y `audit-log` no importa
  `users`.

## 7. Sin conexión, hora y escala

El módulo no atiende clientes ni proveedores y necesita conexión (R5.1); no baja ni encola nada.
Pero guarda la hora de todo lo que sí se hace sin conexión.

### 7.1 `at` siempre es la hora de llegada — Mejora

- **Dónde:** § 2, «`guards.record` completa … `at`» con `clock.now()`.
- **Qué veo:** el ADR-007 dice que lo hecho sin conexión «toma la hora del servidor más lo medido», y
  solo si eso se perdió usa la del dispositivo con la marca. Cuando lleguen las ventas sin conexión,
  la acción va a tener tres horas: la reconstruida (la que vale), la de llegada y, a veces, la del
  dispositivo. Con `at` fijado por la plataforma habría que rehacer la forma.
- **Propuesta:** que el módulo pueda pasar `at` (la reconstruida, nunca posterior a la llegada) y que
  la plataforma guarde siempre `arrivedAt`; `deviceTime` queda para la hora no confirmada. Hoy
  no cambia nada: `at` es la llegada salvo que se diga otra cosa.

### 7.2 El año del archivo: UTC o el del negocio — Mejora

- **Dónde:** § 3, un archivo por año; § 5, «los años del período».
- **Qué veo:** el código de hoy elige el archivo por `getUTCFullYear()`. Lo hecho el 31 de diciembre
  después de las 21 (hora de Buenos Aires) cae en el archivo del año siguiente. La consulta tiene que
  elegir los archivos por el año UTC de los instantes de `from`/`until`, no por el año del negocio.
  Escribirlo, y que la prueba de dos años tenga una acción en ese borde.

### 7.3 A 100 personas — Mejora

- **Qué veo:** el ADR-004 espera hasta 30 veces más: unas 60.000 acciones por día y 22 millones por
  año. Ahí la apertura sin filtros cuenta 22 millones de entradas de índice por año en cada pedido
  (segundos, con 2.1 frenando el proceso), la tira por minuto se llena y los índices con texto
  (2.6) pesan. Lo que no escalaría: el `count(*)` sin caché (2.2), la lectura en el hilo principal
  (2.1) y un solo escritor en el mismo proceso (ya dicho en ADR-004). Con 2.1 (a), 2.2 y 2.6 queda
  detrás de la interfaz y sin tocar el negocio, como pide el principio IX.

## 8. Mejoras

Lo que haría distinto, en orden de lo que más simplifica:

1. **El color como columna al anotar** (3.3): resuelve 1.1, 6.1 y parte de 2.5. Alternativa: tipos
   partidos, que no cubre un guardado que da y saca.
2. **Archivos nuevos con la forma nueva** (3.1): quita la migración, el relleno de 1.7 y la lectura
   doble. Alternativa: mantener la compatibilidad, con el costo de cobertura y el `update`.
3. **Las lecturas en un hilo aparte** (2.1): el servidor no se frena; es la misma interfaz.
   Alternativa: metas y límites más bajos, que no resuelven la escala.
4. **Los atajos de fecha resueltos en el servidor** (1.4): cumple el principio VI sin tocar el
   cronómetro.
5. **El nombre de ese momento guardado en la acción** (3.2): saca la búsqueda por fecha y 1.10.
6. **Resumen y tira solo cuando cambian las fechas** (2.3) y **la tira por acción** (1.2).
7. **Un solo tipo `request.throttled`** (4.1).

## Lo que no pude comprobar

- **Que los íconos propuestos existan en Lucide 0.460.** `docs/design/common/icons/` tiene 96 íconos
  copiados y no están 26 de los 34 de la tabla (entre otros `timer-off`, `monitor-check`,
  `user-plus`, `user-x`, `shield-ellipsis`, `scan-face`, `door-closed`, `cloud-off`, `shield-x`). Por
  lo que sé existen en Lucide, pero no lo pude comprobar contra esa versión. Además, la prueba que
  propone § 4 («cada ícono existe en Lucide 0.460 (`docs/design/common/icons/`)») fallaría contra esa
  carpeta tal como está: tiene que decir contra qué lista compara (el paquete de Lucide de esa versión
  o una copia completa de sus nombres).
- **Los tiempos de § 9** (150 ms con 730.000 filas): no medí; dependen del plan que elija SQLite (2.5).
- **El peso real de la respuesta** con la tira: lo estimé a mano (2.3), sin medir.
- **Qué quiso decir la maqueta con «20 acciones» en la cabecera del día** (1.11): si es el total del
  día o lo que se ve.
- **Si R4.6 «al volver a la pestaña» es tocar la pestaña o volver a la vista** (1.5): el capítulo no lo
  aclara; lo tiene que decir el diseño o preguntarlo.
