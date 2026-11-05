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

## Actualizar solo (T118)

Revisión de lo que T118 sumó al diseño: §§ 1, 5 (`latest` y `GET /api/audit-log/new`), 7, 8, 8.1 y
9 a 14 de [audit-log.md](audit-log.md), y en [device-link.md](device-link.md) § 3.1 (la fila de
`audit-log.new`) y § 13. Fuentes: 05 · R4.6, R4.12, E34, E49 a E56; 03 · R4.5, R7, E45, E46; 01 · R3.1
y R3.3; la maqueta final `mockups/users-who-did-what/final/` con su `changes.md`;
[mobile-data.md](../mobile-data.md); y el código de hoy: `src/server/platform/realtime/` (`hub.ts`,
`routes.ts`, `realtime.ts`, `topics.ts`), `src/server/platform/permissions.ts`,
`src/server/platform/storage/audit/write.ts`, `src/server/modules.ts`,
`src/server/modules/users/roles/access.ts`, `src/app/platform/realtime/` (`channel.ts`, `sse.ts`,
`use-topic.ts`), `src/app/platform/settings.ts`, `src/app/modules/audit-log/state.ts` y
`deploy/Caddyfile`. Mismas marcas: **Frena** o **Mejora**.

### Resumen

La idea es buena y simple: un tema sin datos con clave `all`, el aviso como mucho cada 5 s en el
servidor, la lista de siempre con sus filtros y el «n nuevas» con una ruta que solo cuenta. No arma otro
mecanismo (03 · R7.1), no saca datos por el canal y reusa el alta del tema para «ponerse al día una
vez» al volver. Lo que frena: **`latest` no es una foto de la misma lista** y **se rompe en el cambio de
año**; **el permiso del tema no se puede mirar** con lo que la plataforma da hoy; **el temporizador de la
pantalla puede pedir con la pestaña oculta o apagado**; **el medidor no dice 0 al apagar** (R4.12); **las
respuestas de `/api` no salen comprimidas** según el Caddyfile, así que los números aprobados en
`mobile-data.md` pueden ser varias veces menores que lo real; **el ejemplo de T118 en device-link § 14.1
contradice el diseño**; y **pedir la lista sola mantiene viva la sesión**, que nadie le preguntó a
Carlos.

### T.1 `latest` y la página no salen de la misma lectura — Frena

- **Dónde:** § 5 (`latest`, `select max(id)`), § 7.2 paso 1, § 5 «La consulta».
- **Qué propone:** la lista suma una consulta `max(id)` del año en curso; las filas con `id` mayor al
  `latest` anterior se marcan, y `/new` cuenta `id > n`.
- **Qué veo:** la página, el conteo y el `max(id)` son consultas separadas en el hilo de lectura, y la
  tanda se escribe en el hilo principal cada segundo (`write.ts`, `setInterval`), así que puede caer
  entre medio. Si cae después de la página y antes del `max(id)`, esas filas no están en la página pero
  quedan por debajo del `latest`: **nunca se cuentan en «n nuevas» ni se marcan** (E50, E51). Al revés,
  se cuentan dos veces.
- **Propuesta:** las consultas de un pedido dentro de una transacción de lectura en la conexión del hilo
  (con WAL, una sola foto), o leer `latest` primero y limitar la página, los días y el resumen a
  `id <= latest`. Sumar la prueba (una tanda escrita entre las dos consultas).

### T.2 `latest` entre años — Frena

- **Dónde:** § 5 (`latest` «del archivo del año en curso»; validación de `since`: «un año con archivo,
  no posterior al de hoy»).
- **Qué veo:**
  1. Los archivos van por **año UTC** de `at` (`write.ts`: `getUTCFullYear()`; § 5 «La consulta»). Entre
     las 21 y las 24 del 31 de diciembre (hora del negocio) ya se escribe en el archivo del año
     siguiente. Si «de hoy» en la validación es el día del negocio, `since=2027:3` es «posterior al de
     hoy» y `/new` da **400** justo en esas tres horas. Tiene que decir año UTC.
  2. Recién empezado el año UTC, todavía sin acciones, **no hay archivo del año en curso** (no se crea
     al leer). Si `latest` es `2027:0`, el `/new` siguiente da 400 («un año con archivo»). Tiene que ser
     el `max(id)` del archivo más nuevo que existe.
  3. Una entrada sin conexión que se confirma con un `at` del año anterior va al archivo viejo: `/new`
     cuenta solo `id > n` en el archivo de `since` y los posteriores, así que no la cuenta ni la marca.
     Es raro; alcanza con decirlo, o con que `latest` lleve el último de cada archivo que toca el período.
- Las pruebas de § 11 dicen «desde un año anterior», pero no el 31 de diciembre a las 22 ni el año sin
  archivo.

### T.3 El permiso del tema no se puede mirar con lo que hay — Frena

- **Dónde:** § 7.1 («Quién: con sesión y `audit-log.view`»; `recheckOn`), § 13 tarea 9.
- **Qué veo:** el canal identifica la sesión con `sessions.identify` (`realtime/routes.ts`), que no corre
  los ganchos de la sesión, así que `permissionsOf(c)` da `[]`. Al volver a mirar (`recheckChannel`) no
  hay pedido: solo `{ session }`. `PermissionGate` da solo `require` (middleware) y `provide`; no hay
  forma de preguntar los permisos de un `userId`. Hecho como dice el diseño, el tema rechazaría a todos
  (no hay fuga, pero no anda) o el módulo terminaría importando `users`.
- Además, es el **primer tema con `recheckOn`**. Anda porque `users` borra su memoria de permisos
  (`access.ts`) después de confirmar y **antes** que el `recheck`, ya que se registra antes en
  `modules.ts`. Depende del orden de los módulos y no está escrito en ninguna parte.
- Y la pantalla espera `onRefused` con `forbidden`, pero si el canal se abre solo con este tema y el
  servidor lo rechaza entero, `sse.ts` avisa con el estado HTTP (`'403'`), no con el código.
- **Propuesta:** sumar a la plataforma `permissions.has(userId, permiso)` (o `of(userId)`), usarla en
  `authorize`, decir que el `recheck` corre después de que `users` olvida (o que lee sin memoria), y que
  la pantalla trata `forbidden` y `403` igual. Una prueba: sacarle el permiso a un rol con el tema
  escuchando.

### T.4 Carreras en la pantalla y el temporizador de 5 s — Frena

- **Dónde:** § 7.2 («si llega antes, espera al final de los 5 s; el temporizador es de la pantalla y se
  suelta al desmontarla»), pasos 1 a 3.
- **Qué veo:**
  1. **El temporizador pendiente se suelta solo al desmontar.** Si llegó un aviso a los 2 s y la pestaña
     se oculta a los 3, a los 5 sale un pedido **con la pestaña oculta** (mobile-data: «nada en segundo
     plano»; E54). Lo mismo al apagar el selector (E34: apagado no pide nada), sin conexión (falla y
     ¿qué muestra?), con la cinta abierta (R4.6: no cambia) o al pasar a una fecha sin hoy (E53). Tiene
     que soltarse en cuanto `useTopic` deja de pedir el tema; volver lo pone al día el alta.
  2. **Un «n nuevas» en vuelo al cambiar de filtro:** la respuesta de `/new` con los filtros viejos llega
     después y vuelve a mostrar un número que ya no vale. Hace falta cortarla o descartarla (como
     `useLatest` en la lista).
  3. **Un aviso con un pedido de la persona en vuelo** (cambió de filtro o de página): no dice qué gana.
     Hoy `load` usa `useLatest` (gana el último), así que alcanza con que la puesta al día pase por el
     mismo; o no pedir si ya hay uno en vuelo, que trae lo nuevo igual.
  4. **«Arriba de todo» se decide al llegar el aviso**, pero la lista cambia al llegar la respuesta. Si
     en el medio bajó, se le mueve la lista (R4.6: «no se mueve nada»). Mirarlo de nuevo al llegar.
  5. **Lo que hoy hace `load`:** en la computadora elige la primera acción en cada carga
     (`choose(events[0])`), y «Actualizar» sumaba `round` al valor espejado `audit-log.list.asked`, que
     hace pedir al otro dispositivo. La puesta al día sola no puede hacer ninguna de las dos cosas
     (maqueta: «la acción elegida no cambia»; E56). El diseño dice el resultado, pero la tarea 10 no
     dice que hay que separarla de `ask`.
- **Propuesta:** decirlo en § 7.2 y sumar las pruebas de cada una a § 11.

### T.5 «Apagado, dice 0» y la etiqueta del medidor — Frena

- **Dónde:** § 8.1 («`rate(etiqueta)` suma las 60 casillas»), § 7.2 («el medidor baja a 0 en un minuto»),
  § 8 `Live`.
- **Qué propone:** debajo del selector, la etiqueta `audit-log` del último minuto.
- **Qué veo:**
  1. R4.12 dice «Apagado, dice 0», y la maqueta, «Apagado dice 0 enseguida» (`screenshot-off.png`: «la
     pantalla dice 0, la aplicación todavía no»). Con el diseño, el de la pantalla también tarda un
     minuto en llegar a 0. `Live` tiene que mostrar 0 con `live` apagado, sin mirar el medidor.
  2. El canal etiqueta cada cuenta «con el nombre de cada tema» (`audit-log.new`), y `Live` y `api()`
     usan `audit-log`. Falta decir cómo se pasa de uno al otro (el módulo del tema, o la etiqueta al
     declarar el tema).
  3. El latido va a todas las etiquetas que tienen el canal abierto, pero § 8.1 dice que la etiqueta
     `audit-log` es «lo que se pagaría menos con el selector apagado». Con el vínculo por el servidor, el
     canal sigue abierto igual: apagar no ahorra el latido. Hay que elegir qué dice (lo que pasa por esta
     pantalla, o lo que se ahorra) y escribirlo igual en los dos lugares.

### T.6 Las respuestas de `/api` no salen comprimidas — Frena

- **Dónde:** § 5 («Caddy comprime las respuestas de `/api`»), § 7.3 («cada puesta al día, unos 2 KB
  comprimida»), § 10 («4 KB comprimida»), y `mobile-data.md`, aprobado con esos números.
- **Qué veo:** en `deploy/Caddyfile` el `encode zstd gzip` está solo en `/manual/*` y en los estáticos;
  `handle /api/*` no comprime, y el servidor no usa compresión (busqué `compress` en `src/server`). No pude
  ver si el proxy de la máquina comprime. Si no lo hace, cada puesta al día sola pesa lo de sin
  comprimir: menos de 8 KB con 20 acciones y hasta 20 KB con la tira (las metas de § 10). Es de 4 a 5
  veces lo aprobado. Y en el celular, prendido en un día con movimiento, como mucho 720 puestas al día
  por hora (una cada 5 s): de 1,4 a casi 6 MB por hora, una cifra que no está en ningún lado.
- **Propuesta:** medirlo en el ambiente de pruebas (la cabecera `content-encoding` de un
  `GET /api/audit-log`). Si no comprime, dos caminos:
  - **Comprimir `/api` en Caddy,** sacando `text/event-stream`: comprimido, el canal puede quedar
    retenido, y hay que medir que el latido siga llegando a los 40 s.
  - **Corregir los números** de § 7.3, § 10 y `mobile-data.md`, y pedirle a Carlos que los vuelva a
    aprobar.

  En los dos casos, `mobile-data.md` tiene que decir el peor caso por hora.

### T.7 El ejemplo de T118 en device-link § 14.1 contradice el diseño — Frena (corrección de texto)

- **Dónde:** `device-link.md` § 14.1, «Ejemplo, T118 entero del lado del canal».
- **Qué veo:** quedó el ejemplo viejo. Dice `event: { count }` (R4.6: el aviso no lleva ningún dato), un
  parámetro de 40 caracteres con `lastId` y `countSince` al suscribirse, el permiso `audit.view` (es
  `audit-log.view`), `modules/audit-log/realtime.ts` y `state.ts` (el diseño dice `live.ts`) y
  `publish('audit-log.new:all', …)` (la firma es `publish(tema, clave, datos)`). § 3.1 y § 13 sí se
  pusieron al día. Quien programe tiene dos contratos distintos para el mismo tema.
- **Propuesta:** reemplazarlo por el de § 7.1 de 05 o sacarlo y enlazar.

### T.8 La sesión no vence mientras «Actualizar solo» pide la lista — Frena (lo decide Carlos)

- **Dónde:** § 9, § 14. No está.
- **Qué veo:** 01 · R3.1 cuenta como uso «cada pedido al servidor», y R3.3 dice que mirar sin pedir no
  cuenta. El canal no alarga la sesión (diseño de 03, § 3.3), pero la lista que se pide sola sí. Una
  computadora que queda con Quién hizo qué abierto y prendido (está prendido al abrir) no vence por
  los 60 minutos sin uso mientras alguien haga algo en el negocio, hasta las 8 horas. Es la pantalla más
  sensible del sistema (§ 9).
- **Opciones:** (a) dejarlo así y escribirlo en § 9 y en el manual; (b) que lo que se pide solo no cuente
  como uso: una cabecera que lo marca. Mentir con ella solo acorta la sesión propia, así que no hay
  abuso; (c) apagar el selector después de un rato sin tocar nada. Hay que preguntárselo a Carlos en § 14.

### T.9 Que el medidor se pueda medir de verdad en el navegador — Mejora

- **Dónde:** § 8.1 («Cuántos bytes»).
- **Qué veo:**
  1. `transferSize` existe en Chrome, Firefox y Safari desde la 16.4 (de 2023), y para lo del mismo
     origen no hace falta `Timing-Allow-Origin`. Según la especificación actual, es el cuerpo comprimido
     más **300 bytes fijos** de cabeceras: no mide las cabeceras de HTTP/2. Da igual para un número
     aproximado, pero los «150 bytes» de la subida y los 300 de la bajada vienen de dos lados distintos.
     Conviene decir que es así.
  2. **El búfer de Resource Timing guarda 250 entradas.** Una pestaña abierta todo el día lo llena, y
     `getEntriesByName` deja de encontrar los pedidos nuevos. Hay que usar `PerformanceObserver`
     (`type: 'resource'`) con una tabla de dirección a etiqueta que arme `api()`, o vaciar el búfer.
  3. **El SSE también deja su entrada al cerrarse,** con todo lo que bajó. Si el observador la cuenta, se
     cuenta dos veces lo del canal. Hay que excluirla.
  4. **Los trozos del canal se miden después de `TextDecoderStream`** (`sse.ts`): es el largo en
     caracteres, no en bytes. Hay que medir el `Uint8Array` antes de decodificar.
  5. Las 60 casillas de 1 s no tienen nombre en `platformSettings.meter`.
- No pude comprobar en un navegador real cuánto se aleja el número de lo que cuenta el sistema del
  celular.

### T.10 03 · R4.5 «sin ningún canal abierto, dice 0» — Mejora

- **Dónde:** § 8.1 y § 14.1.
- **Qué veo:** el total también cuenta los pedidos solos del vínculo (`check` cada 4 minutos con uso,
  `report`). Así, sin ningún canal abierto, puede no decir 0, contra la letra de R4.5 y de E45 («al
  minuto dice 0»). § 14.1 se lo pregunta a Carlos, pero el diseño ya eligió. O se cuentan solo los
  canales, o se cambia el texto de R4.5 con la respuesta.

### T.11 La cinta, los cambios de fecha y las aperturas del canal — Mejora

- **Dónde:** § 7.2 paso 3, `withToday`.
- **Qué veo:**
  - Abrir y cerrar la cinta, o pasar de «Hoy» a «Ayer», suelta y vuelve a pedir el tema. Si es el único,
    cierra y vuelve a abrir el canal. El tope es de 10 aperturas por minuto por sesión, que comparten
    las pestañas y los dos dispositivos. Pasado, `sse.ts` espera lo que diga el servidor (hasta un
    minuto) y «Actualizar solo» no anda, sin que se note.
  - La maqueta muestra «3 nuevas» con la cinta abierta. El diseño, en cambio, pone la lista al día al
    cerrarla, y E42 pide volver «a la lista como estaba».
- **Opciones:**
  - **Seguir escuchando con la cinta abierta,** guardar que hubo aviso y, al cerrarla, hacer lo del paso
    2: «n nuevas», sin mover nada. Cumple E42 y la maqueta, y no rehace el canal.
  - **Dejarlo como está** y aclarar E42 con Carlos.

### T.12 `GET /api/audit-log/new`: lo que puede recorrer — Mejora

- **Dónde:** § 5 (`since`) y § 9.
- **Qué veo:**
  - `since` acepta cualquier año con archivo. Con `since=2020:0`, «todas las de los archivos de años
    posteriores» puede ser recorrer cada archivo entero buscando filtros que no coinciden. Lo hace en el
    único hilo de lectura, de a una consulta, y eso frena la lista de todos, hasta 60 veces por minuto.
  - § 5 dice «dentro del período», y los archivos de años fuera del período no pueden tener nada
    (van por año de `at`). Conviene escribir que solo se abren los años del período, y probar con
    `explain query plan` la forma de `/new`: hoy está la prueba que cuenta las consultas, no la del plan.
  - El tope de 100 no tiene nombre en `auditLogSettings`.
  - `/new` devuelve `latest` y nadie lo usa: `since` tiene que quedar el de la lista, o el número se
    reinicia. Sacarlo, o decir que no reemplaza al de la lista.

### T.13 Tiempos y topes sin nombre — Mejora

- **Dónde:** § 7.2, § 8.
- **Qué veo:**
  - **Sin nombre en un `settings.ts`:**
    - los 5 s de la aplicación (el `everyMs` es del servidor);
    - los 8 px de «arriba de todo»;
    - el tope de `/new` y su «Más de 99»;
    - las 60 casillas del medidor.
  - Con nombre: `live.everyMs` (servidor), `markMs`, `meter.redrawMs` y los bytes del medidor.
  - **La marca:** dura 2 s y la maqueta dice 1,4 s de borde verde y que se saca a los 1,6 s. Una de las
    dos cosas tiene que cambiar.

### T.14 El doble límite de 5 s y «en el momento» — Mejora

- **Dónde:** § 7.1 y § 7.2.
- **Qué veo:**
  - El servidor ya avisa a lo sumo cada 5 s. El límite de la aplicación solo frena el aviso del alta, y
    ese es justo el que tiene que ser inmediato: prender (E55: «en el momento»), volver a la vista o
    cerrar la cinta. Prender a los 3 s de una puesta al día tarda 2 s más.
  - Con un vínculo por el servidor, el alta y el primer aviso de una tanda pueden llegar casi juntos.
- **Opciones:**
  - **Que el alta no espere,** y el resto sí.
  - **Sacar el límite de la aplicación** y confiar en el del servidor. Es una pieza menos.

### T.15 Lo que pasa si la puesta al día sola falla — Mejora

- **Dónde:** § 7.2. No está.
- **Qué veo:** el límite de 60 por minuto es **por persona** y lo comparten todas las pestañas y los dos
  dispositivos. Con 5 pestañas prendidas en un rato de mucho movimiento (12 por minuto cada una) se
  llega, y además se anota `request.throttled`. Tampoco dice qué muestra un `5xx` o un corte en un pedido
  que nadie tocó. Hoy `load` pone `failed`, que muestra el error en la lista.
- **Propuesta:** que la puesta al día sola que falla no cambie lo que se ve y espere el próximo aviso.
  Decir cuántas pestañas alcanza el límite.

### T.16 Alt N para «3 nuevas» — Mejora

- **Dónde:** § 8 (`NewOnes`, «Las teclas»).
- **Qué veo:** la maqueta da Alt N y 00 · R2.8 pide un atajo por botón; el diseño no lo nombra.

### T.17 `mobile-data.md` y § 7.3 — Mejora

- **Qué veo:**
  - **El aviso:** la fila dice «un aviso de unos 100 bytes por acción nueva», y el diseño manda uno cada
    5 s como mucho.
  - **Volver a la vista:** no cuenta lo que cuesta. El celular apaga la pantalla unas 40 veces por día
    (§ 18 de 03), y cada vez que vuelve abre de nuevo el canal y pone la lista al día. Si pasaron más de
    5 minutos, suma la conexión segura nueva: unos 4 a 5 KB.
  - **La tira:** en la computadora se vuelve a bajar entera con cada puesta al día. Podría ir solo
    cuando cambia el día, o solo lo nuevo.
  - **El peor caso por hora:** falta, con la conclusión de T.6.

### T.18 Repetición: «incluye hoy» en la aplicación — Mejora

- **Dónde:** § 7.2 (`withToday`).
- **Qué veo:**
  - La aplicación vuelve a resolver qué días cubre cada atajo, y eso ya lo hace el servidor con su reloj
    (`rules.ts`). Sería más simple que la respuesta traiga `includesToday`: una regla en un solo lugar,
    con el reloj del servidor.
  - E53 dice «ningún canal abierto», y con el vínculo por el servidor hay uno igual: el de 03. Aclarar
    que se refiere al tema.

### T.19 «Abrió Quién hizo qué» a la medianoche — Mejora

- **Dónde:** § 7.1 («Pedir la lista no anota nada más, solo la primera vez del día»).
- **Qué veo:** con la pestaña abierta y prendida después de las 00, la primera puesta al día sola anota
  `audit-log.opened` de cada sesión que mira, sin que nadie la haya abierto ese día. Cada anotación
  avisa a los demás. No crece sin fin (una por sesión y por día), pero el rastro dice algo que la persona
  no hizo. Preguntar si lo que se pide solo cuenta como «abrir».

### Simpleza, fronteras, sin conexión y escala

- **Simpleza:** lo que sobra es el doble límite de 5 s (T.14) y el `latest` de `/new` (T.12).
- **Fronteras:**
  - `platform/meter.ts` no sabe de pantallas, y `device-link` lo usa por la plataforma: bien.
  - Lo que falta es la consulta de permisos de la plataforma (T.3).
- **Sin conexión y hora:**
  - Sin conexión no hay canal, y al volver se pone al día por el alta. Los atajos los resuelve el
    servidor con su reloj. Bien.
  - La excepción es el año de `latest` (T.2).
- **Escala:**
  - Cada aviso hace que todos los que miran pidan a la vez, cerca de 7 consultas cada uno, en un hilo
    que lee de a una. Con los pocos que tienen el permiso alcanza.
  - Si crece, guardar 5 s la respuesta por filtros y `latest`.
  - La paginación con `offset` mueve las páginas cuando entran acciones: pasar de la 2 a la 3 puede
    repetir filas. Ya estaba (2.8), pero ahora se nota más.

### Lo que no pude comprobar

- **Si el proxy de la máquina comprime `/api` y habla HTTP/2** con el navegador: no está en el
  repositorio (T.6).
- **Si comprimir el SSE en Caddy retiene el latido.**
- **El número del medidor contra lo que cuenta el sistema del celular,** y que `transferSize` dé algo
  distinto de 0 en el Safari de los celulares del local (T.9).
- **Los tiempos de § 10** («`/new` en menos de 20 ms», «menos de 6 s»): no los medí.

Fuentes de T.9: [Resource size, web-features](https://web-platform-dx.github.io/web-features-explorer/features/resource-size)
y [WebKit 218996](https://bugs.webkit.org/show_bug.cgi?id=218996).
