# Revisión del código · 08 · Listas de precios (`price-lists`), etapa a

Compara el código que cambió desde `cb1178e^` con las reglas
([rules.md](../../chapters/08-price-lists/rules.md), [screens.md](../../chapters/08-price-lists/screens.md)),
el [diseño técnico](price-lists.md), el [ADR-021](../adr/ADR-021-reading-price-lists.md) y la
[constitución](../../project/constitution.md). Se tienen en cuenta las decisiones de Carlos que no se
marcan: el manual suspendido, el lector SAX para `.xlsx` en T140, la auditoría de costos de a 80 y
las dos entradas a Anomalías. La lógica que ya estaba en las vistas de módulos cerrados es de T139;
acá solo cuenta lo que agregó o cambió este módulo.

**Qué se corrió:** las pruebas del módulo (`vitest run` sobre `price-lists`, `anomalies`, `catalog` y
los modelos de la aplicación: 48 archivos y 287 pruebas, todas en verde) y `pnpm perf` del módulo
(8 de 8 en verde). No se corrieron las e2e ni `pnpm check` entero, ni se miraron las pantallas en un
navegador: lo que dice este informe de las pantallas sale de leer el código.

Cada punto dice dónde está, qué piden los documentos, qué hace el código y qué tan grave es.
**Frena:** hay que corregirlo antes de cerrar el módulo. **Mejora:** opcional.

---

## Lo que frena el cierre

### F1. La aplicación no espeja lo que se sube (R1.6, E08)

- **Dónde:** `src/app/modules/price-lists/uploads/store.ts:16-20` (el almacén `uploads` es local) y
  `src/app/modules/price-lists/uploads/use-uploads.ts`.
- **Documentos:** R1.6 y E08 («cuando en la computadora se sube una lista, el celular ve el avance y lo
  que cambia»); diseño § 6 «El espejo»: las listas que se suben son valores con nombre, el otro
  dispositivo escucha el mismo tema y ve «Subiendo en la computadora» hasta que la lista existe. El
  diseño § 12 da por cubierto E08 con la prueba del espejo de cualquier valor con nombre.
- **Código:** las listas que se suben viven en un `createStore` del dispositivo, sin `useMirrored`. No
  hay ningún texto «Subiendo en…». La única prueba que nombra E08
  (`src/server/modules/price-lists/lists-reading.test.ts:27`) comprueba que el tema del servidor llega a
  quien tiene «Ver costos». No comprueba que el otro dispositivo lo vea, y no puede verlo porque
  nadie le dice qué listas mirar.
- **Gravedad:** frena. Un escenario sin cumplir.

### F2. «Proveedor nuevo» al subir solo deja escribir el nombre (R2.2, E31b; pantalla 2, paso 3)

- **Dónde:** `src/app/modules/price-lists/uploads/use-uploads.ts:37` (`newSupplier: { name }`) y
  `src/app/views/basic/price-lists/uploads/Question.tsx:130-147`.
- **Documentos:** pantalla 2, paso 3: «Proveedor nuevo», que deja escribir el nombre «y, si se
  quiere, los demás datos (R2.2)». E31b: quien tiene «Cargar listas» lo da de alta «con su nombre y su
  teléfono».
- **Código:** el servidor acepta los datos (`POST …/lists/:id/supplier` con `newSupplier`, probado en
  `lists-supplier.test.ts:71`), pero la aplicación no tiene dónde escribirlos. Quien tiene «Cargar
  listas» y no «Administrar proveedores» nunca puede cargar el teléfono.
- **Gravedad:** frena.

### F3. Las listas de un proveedor no se pueden bajar desde su pantalla (R6.7; pantalla 4, «Listas»)

- **Dónde:** `src/app/views/basic/price-lists/supplier/Lists.tsx:237-257`;
  `src/app/modules/price-lists/supplier/texts.ts:70` (`download: 'Bajar el archivo'`, un texto que
  nadie usa).
- **Documentos:** R6.7 y pantalla 4: cada lista «con … su archivo para bajar».
- **Código:** cada renglón muestra el título, el estado, quién la subió y decidió y el nombre del
  archivo, pero no ofrece bajarlo ni dice «Ya no se guarda el archivo» (R4.4). Solo se baja desde ver qué cambia
  (que existe para la lista en espera) y desde Archivos de listas.
- **Gravedad:** frena.

### F4. La cuenta del costo no muestra la fecha de la lista ni el formato de E17 (R3.4, E17)

- **Dónde:** `src/app/modules/price-lists/review/rules.ts:69-75` (`stepsLines`) y
  `src/app/modules/price-lists/review/texts.ts:72-77`. Lo usan ver qué cambia y los productos del
  proveedor (`supplier/rules.ts:93`).
- **Documentos:** R3.4: la cuenta, paso a paso, «con los números de origen y la fecha de la lista». E17:
  «Precio de lista $ 2.314,00», «− 25 % General = $ 1.735,50» y «− 5 % Contado = $ 1.648,73».
- **Código:** `basis.listDate` llega en el contrato pero ninguna línea lo muestra. Los pasos dicen
  «Precio de lista: $ 2.314,00» y «General (25 %): $ 1.735,50», sin el signo de resta: no es el texto
  del escenario. La prueba de E17 del servidor (`terms.test.ts:56`) mira los números, no lo que se lee.
- **Gravedad:** frena. Falta la fecha y el texto no es el que pide el escenario.

### F5. «Para revisar» no se muestra aparte arriba de todo (R6.4, E57)

- **Dónde:** `src/app/modules/price-lists/review/rules.ts:40-62` (`chipsOf`) y
  `src/app/views/basic/price-lists/review/Review.tsx:113-130`.
- **Documentos:** R6.4: los costos que pasan el porcentaje «se muestran aparte, arriba de todo». E57:
  «los dos aparecen aparte, arriba, como "para revisar"». Pantalla 3: «"Para revisar", arriba de
  todo».
- **Código:** «para revisar» es un filtro más del resumen, marcado como urgente. Sin tocarlo, el
  detalle sale ordenado por cuánto cambia, así que los más grandes quedan arriba, pero mezclados con
  los demás y sin ningún título. La prueba de E57 (`lists-review.test.ts:57`) comprueba el filtro
  `show=review` del servidor; ninguna comprueba que la pantalla los muestre aparte.
- **Gravedad:** frena. El escenario pide un bloque aparte y la pantalla no lo tiene.

### F6. Ninguna prueba falla si un pedido hace más consultas (constitución, paso 6; diseño § 11)

- **Dónde:** `src/server/modules/price-lists/price-lists.perf.ts:57-81, 115-125`.
- **Documentos:** la constitución pide, en el paso 6, «las que cuentan las consultas de cada pedido».
  El diseño § 11 fija las metas: el resumen en 2 consultas, una página del detalle en 1, los artículos
  en 1, subir en 3. La columna «Consultas» de § 3 da el número de cada ruta.
- **Código:** solo la prueba de rendimiento llama a `countQueries`, y ahí solo **anota** el número en
  `measured`: no hay ningún `expect`. Esa prueba tampoco corre en `pnpm check`. Las rutas de
  proveedores, listas, lectores, archivos y anomalías no tienen una prueba que cuente consultas
  (el catálogo sí: `catalog.test.ts:115`). Leyendo el código, `GET /lists/:id` hace al menos 6
  consultas (`listState`: la lista, el proveedor y el nombre, más `summaryFor`, que hace 3: dos en
  `counts` y una en `gone`, `data/review.ts:66-108`). El diseño pide 2 más 1 a `users`.
- **Gravedad:** frena. Falta la prueba que pide la constitución, y el resumen ya se pasa de lo que
  dice el diseño.

### F7. Escenarios sin una prueba que los nombre, o con una que no los comprueba de verdad

- **E64** (dos personas aplican a la vez): `lists-apply-edges.test.ts:73` no manda dos pedidos a la
  vez. Pone `status = 'applying'` con SQL y mira el `409`. El código traba la fila
  (`routes/apply.ts:72`, `one(listId, true)`), pero ninguna prueba manda los dos pedidos juntos.
- **E27** (sin IVA en la lista, los productos nuevos quedan con el IVA de arranque de 10,5 %): el
  código lo hace (`rules/apply.ts:56`, `row.vat ?? defaultVat`), pero ninguna prueba mira el IVA del
  producto creado. `terms.test.ts:120` mira solo el costo de la lista en espera.
- **E70** (el mismo código en dos proveedores son dos productos): no tiene prueba. La clave
  `(supplier_id, supplier_code)` de `items` lo permite.
- **E31c** (dos listas de proveedores distintos avanzan a la vez): no tiene prueba.
- **E83** (una lista con filas salteadas que se descarta no deja anomalía): no tiene prueba. Pasa por
  cómo está hecho: la anomalía se abre recién al aplicar (`apply/anomalies.ts:29`).
- **E87** (cancelar la subida no deja ni la lista ni el archivo): del lado del servidor no hay prueba
  de un cuerpo que se corta. La de `lists-flows.test.ts:34` corta por falta de datos, no porque el
  cliente se fue.
- **E58, E59, E61, E66:** se prueban con otro nombre (`R6.5`, el arranque con una que se aplicaba,
  `lists-apply-edges.test.ts:53`), pero ninguna prueba lleva su número. La trazabilidad por número se
  pierde.
- **Gravedad:** frena para E64, E27 y E70, que necesitan su prueba. Para E31c, E83 y E87, una prueba
  corta. Para los demás, poner el número en el nombre de la prueba.

### F8. Lógica en las vistas de este módulo («La vista es intercambiable»)

Son decisiones que, con otra vista, habría que repetir. Para cada una se dice qué tendría que
exponer el modelo en su lugar.

| Archivo y línea | Qué decide la vista | Qué tendría que exponer el modelo |
|---|---|---|
| `views/basic/price-lists/Suppliers.tsx:92-96` | Si se puede soltar un archivo (`view.canUpload`) antes de llamar a `view.upload`; el modelo (`suppliers/suppliers.ts:113`) sube sin mirar el permiso | Que `upload` / `drop` del modelo no hagan nada sin permiso, y `view.acceptsDrop` |
| `views/basic/price-lists/Suppliers.tsx:50` | `view.canAdd && !view.adding` | `view.showAdd` |
| `views/basic/price-lists/Supplier.tsx:167` | `view.canUpload && !view.reactivable`: con el filtro de dados de baja no se sube | `supplier.canUpload` (por renglón) |
| `views/basic/price-lists/AddSupplier.tsx:21` y `uploads/Question.tsx:140` | El largo máximo del nombre (80), una regla del contrato (diseño § 2) escrita en la vista | `texts`/modelo con `nameMax`, sacado del contrato |
| `views/basic/price-lists/uploads/UploadButton.tsx:224` | `accept=".xlsx,.xls,.csv"`: la lista de formatos de R4.2, repetida (el contrato tiene `listExtensions`) | `view.accept`, armado con `listExtensions` |
| `views/basic/price-lists/review/Review.tsx:87` | `view.canApply && seen.applyLabel` | `seen.applyLabel` solo cuando se puede aplicar |
| `views/basic/price-lists/supplier/SupplierScreen.tsx:63` | `view.editable && !view.dropping` | `view.canDeactivate` |
| `views/basic/price-lists/supplier/SupplierScreen.tsx:112` | Lee `view.supplier.inactive`, un dato crudo del contrato | `view.inactiveText` o `view.isInactive` del modelo |
| `views/basic/price-lists/supplier/Terms.tsx:31` | La unidad «%» del descuento | El texto o la unidad, del modelo |
| `views/basic/price-lists/supplier/Items.tsx:190` y `supplier/Lists.tsx:233` | Si está vacío (`length === 0`) | `items.emptyText`, `view.listsEmptyText` |
| `views/basic/price-lists/Files.tsx:33` | Bajar solo con conexión (`view.live`) | `view.canDownload` |
| `views/basic/price-lists/Files.tsx:62` | Calcula las líneas de cada archivo (`fileLines(file)`) mientras dibuja | `view.files` con sus líneas ya resueltas |
| `views/basic/price-lists/Files.tsx:97` | Vacía si `view.files.length === 0` | `view.emptyText` |
| `views/basic/price-lists/Files.tsx:106` | `view.data.next && view.live`, que lee la respuesta cruda del servidor | `view.hasMore` |
| `views/basic/price-lists/Readers.tsx:164` | Calcula `readerLines(reader)` mientras dibuja | `group.readers` con sus líneas ya resueltas |
| `views/basic/price-lists/Readers.tsx:200-205` | Elige entre «no hay lectores» y «ninguno con eso» comparando `view.data.readers.length` y `view.groups.length` | `view.emptyText` |
| `views/basic/anomalies/Anomalies.tsx:31` | Calcula `linesOf(anomaly)` mientras dibuja | `view.anomalies` con sus líneas |
| `views/basic/anomalies/Anomalies.tsx:44, 52` | Arma el nombre accesible y une proveedor y archivo con « · » | `lines.label`, `lines.subject` |
| `views/basic/anomalies/Anomalies.tsx:81` | `view.data.next && view.live` | `view.hasMore` |
| `views/basic/anomalies/Detail.tsx:133` | Calcula `cellsOf(row)` | `rows.lines` resueltas |
| `views/basic/anomalies/Detail.tsx:139` | `rows.next && !rows.failed` | `rows.hasMore` |
| `views/basic/anomalies/Detail.tsx:161` | El largo máximo de la nota (500), regla del contrato | `texts`/modelo con `noteMax` |
| `views/basic/administration/List.tsx:52-70, 96-102` | Los tres renglones de las listas (cuál ajuste, qué ícono, cómo se muestra el valor) y el grupo «Listas de precios» escrito en la vista | Los grupos y sus renglones, del modelo de Administración (el patrón ya estaba; este módulo le sumó un grupo) |
| `views/basic/administration/List.tsx` (`page === 'anomalies' && <Count …>`) | Compara qué página es para decidir si lleva el número | `links` con su número ya resuelto |
| `views/basic/anomalies/Anomalies.tsx:12` | La vista de Anomalías importa `Stale` de la vista de las listas de precios | `Stale` y `ScreenSearch` en `views/basic/ui/` |

- **Gravedad:** frena en conjunto. Los que más pesan son los que deciden un permiso (`Suppliers.tsx:92`,
  `Supplier.tsx:167`, `Files.tsx:33`), las reglas del contrato copiadas en la vista (80, 500 y los
  formatos) y los que leen `view.data` crudo. Lo demás, sobre todo los «vacío» y los `xxxLines(...)`,
  se arregla de una vez, exponiendo en el modelo las listas ya resueltas.

Lo de `Rounding.tsx:32-33` y `Confirm.tsx:35-40` (`roundedTo` comparado en la vista) y
`Margins.tsx:41` (`sellsAt`) es de Administración: este módulo solo cambió `roundUp` por la función del
modelo. Queda en T139.

---

## Mejoras

### M1. Con el proveedor sabido, no se prueban los lectores de los demás (R5.2; diseño § 4)

- **Dónde:** `src/server/modules/price-lists/reading/job.ts:29-44` (`candidatesOf`).
- **Documentos:** R5.2: «se prueban primero los lectores del proveedor, si se sabe cuál es, y después
  los de los demás». Diseño § 4: un lector de otro proveedor que la reconoce no decide y deja la
  pregunta.
- **Código:** si se sabe de quién es, se sacan los lectores de otros proveedores. Solo quedan los
  suyos y los de un programador sin proveedor. Si la planilla tiene el formato de otro proveedor, la
  lee el lector automático o queda «No se pudo leer».
- **Gravedad:** mejora. O el código hace lo que dicen la regla y el diseño, o Carlos aprueba este
  comportamiento y se escribe en R5.2 y en el diseño.

### M2. El lector automático no mira lo que hay en cada columna, y tiene una regla que nadie escribió (R5.3, R5.5)

- **Dónde:** `src/server/modules/price-lists/rules/auto.ts:45-64`.
- **Documentos:** R5.3: busca el encabezado «por los nombres de siempre … y por lo que hay en cada
  columna».
- **Código:** solo busca por los nombres del encabezado. Además, `autoDoubts` (línea 63) da la lista
  por ilegible si hay más filas salteadas que productos. Ninguna regla ni el diseño lo dicen.
- **Gravedad:** mejora. Se escribe la regla de `autoDoubts` en R5.5 y en el diseño, y se dice si mirar
  el contenido de las columnas queda para más adelante.

### M3. El avance no se limita a cuatro avisos por segundo (diseño § 6)

- **Dónde:** `src/server/modules/price-lists/reading/service.ts:75` (`deps.publish` en cada mensaje,
  con una consulta) y `apply/service.ts:31-33`.
- **Documentos:** diseño § 6: el tema manda «a lo sumo cuatro veces por segundo».
- **Código:** avisa en cada bloque y en cada tanda, sin límite. Con bloques de 5.000 filas hoy son
  pocos avisos, pero la regla del diseño no está en el código.
- **Gravedad:** mejora.

### M4. Quién hizo qué se anota después de confirmar y no en la misma transacción (diseño § 5)

- **Dónde:** `src/server/modules/price-lists/apply/service.ts:46, 75-90`.
- **Documentos:** diseño § 5: «Se escriben al confirmar, con `events.transaction`».
- **Código:** `lists.applied` y `lists.costs` se anotan después del `commit`, con el `Context` de un
  pedido que ya contestó. No queda anotado nada que se deshizo, pero si el servidor se cae entre el
  `commit` y la anotación, la lista queda aplicada sin su historia de costos (T115).
- **Gravedad:** mejora. Se usa `events.transaction`, o se corrige el diseño.

### M5. Las filas de una lista descartada se borran en el momento (diseño § 2)

- **Dónde:** `src/server/modules/price-lists/reading/assign.ts:16-31` y `data/files.ts:133-143`.
- **Documentos:** diseño § 2, `list_rows`: «Se borran al día siguiente de aplicar o descartar».
- **Código:** al descartar se borran enseguida (`rowsData.clear`), y `dropOldRows` solo mira las
  aplicadas. Cumple R9.2 igual: una descartada no tiene anomalía.
- **Gravedad:** mejora. Que el diseño diga lo que hace el código.

### M6. El buscador no escapa `%` y `_` en `like`

- **Dónde:** `src/server/modules/price-lists/data/review.ts:123, 152`; la búsqueda de los artículos
  probablemente sea igual (`data/items.ts`, no se revisó línea por línea).
- **Código:** si se busca «50%» o «A_1», `%` y `_` funcionan como comodines. No es un riesgo de
  seguridad, porque el valor va como parámetro, pero el resultado no es el que se buscó.
- **Gravedad:** mejora.

### M7. La cantidad de anomalías abiertas se calcula dentro de cada transacción

- **Dónde:** `src/server/modules/anomalies/index.ts:33-37`.
- **Documentos:** diseño § 6: se cuentan al arrancar y «se suman o restan al confirmar».
- **Código:** cada `open` o `close` vuelve a contar dentro de su transacción y, al confirmar, pone ese
  número. Con dos transacciones a la vez, la que confirma última puede dejar un número viejo, que dura
  hasta la siguiente.
- **Gravedad:** mejora.

### M8. Topes y plazos fuera de `settings.ts` (constitución XII)

- **Dónde:** `rules/apply.ts:79` (`auditChunk = 80`), `reading/zip.ts:7` (`zipLimits`),
  `files/cleanup.ts:9-11` (`undoMs = 5000`, el día de las filas) e `index.ts:57`
  (`60 * 60_000`, la limpieza de cada hora).
- **Documentos:** XII: «Los tiempos y los topes, con nombre y en un solo lugar: cada módulo tiene los
  suyos en su `settings.ts`»; diseño § 7 (`settings.ts`: «el día de espera para borrar filas»).
- **Gravedad:** mejora.

### M9. Pruebas que dependen de cómo está hecho el código por dentro

- Muchas pruebas del servidor arman el estado escribiendo la base con SQL en vez de llegar a él por la
  API: `lists-apply-edges.test.ts:73, 79, 124, 127`, `lists-flows.test.ts:62, 72`,
  `lists-history.test.ts:57, 68, 88, 142`, `lists-reading.test.ts:103-109`,
  `lists-admin.test.ts:106-110, 208, 222` y `kit.setListStatus` (`deactivate.test.ts:105`). Para
  simular un arranque o el paso del tiempo puede hacer falta. Pero E15, E64 y E85 podrían dejar una
  lista «aplicándose» de verdad, con `stallMs` o un `idle` que espera, en vez de cambiar el estado a
  mano. Si cambian los nombres de las columnas o de los estados, se rompen.
- `reading/steps.test.ts` llama a `runStep` con `{} as never`. Prueba la función por dentro, no lo que
  se ve.
- `uploads/store.test.ts:24-33` prueba `forget` y `cutUpload` del almacén interno.
- `anomalies/anomalies.test.tsx:69`: el texto esperado se arma dando vuelta otro texto
  (`'120 · Tornillo'.split(' · ').reverse().join(' · ')`). Es más claro escribir
  `'Tornillo · 120'`.
- **Gravedad:** mejora.

### M10. Simpleza y repetición

- **La fecha `aaaa-mm-dd` a `dd/mm/aaaa` está escrita cuatro veces:** `review/rules.ts:26`,
  `supplier/rules.ts:18`, `suppliers/suppliers-rules.ts:39` y `admin/readers.ts:44`. Va una sola
  función en `platform/time.ts`.
- **Partir una lista en tandas, dos veces:** `chunksOf` en `rules/apply.ts:80` y `chunks` en
  `routes/supplier-state.ts:31`.
- **`subjectOf` de la anomalía, dos veces:** `reading/steps.ts:27` y `apply/anomalies.ts:11`.
- **El comentario de `shortcuts/suppliers.ts:1-4`** tiene un salto de renglón en el medio de la frase.
- **No hay atajo para «Cancelar» mientras se aplica** (`shortcuts/review.ts`), y el diseño § 9 lo nombra
  («aplicar, descartar y cancelar»).
- **`files.deleted` anota solo el SHA-256** (`routes/files.ts:81`), y el diseño § 5 dice «Su lista».
- **Hay un límite de 60 cambios por minuto por sesión** (`settings.ts:6`, `changes`) que el diseño no
  nombra. Se anota en el § 10.
- **Gravedad:** mejora.

### M11. Lo que se borra solo puede borrar una subida que todavía no terminó

- **Dónde:** `files/cleanup.ts:33-35` y `routes/upload-list.ts:79-91`.
- **Código:** el archivo queda con su nombre definitivo en el almacén antes de que exista su fila. Si la
  limpieza de cada hora corre justo entre una cosa y la otra, lo borra por «sin fila». Además, los
  temporales de `tmp/` que deja un servidor que se cae en medio de una subida no se borran nunca
  (`list()` solo mira nombres hexadecimales).
- **Gravedad:** mejora. Que lo mire también el revisor de seguridad.

---

## Los once puntos, uno por uno

1. **Escenarios sin cumplir:** F1 (E08), F2 (E31b), F3 (R6.7), F4 (E17, R3.4), F5 (E57) y las pruebas
   que faltan de F7. Los demás escenarios de la etapa a tienen código y prueba. E12, E13, E28, E72,
   E74, E76 y E95 quedan para 07, como dicen la regla y el diseño. E12 a E14 ya tienen una prueba
   parcial.
2. **Comentarios de cabecera:** todos los archivos que cambiaron empiezan con su comentario y los
   revisados dicen la verdad. Salvo el renglón partido de `shortcuts/suppliers.ts` (M10), no se
   encontró ninguno desactualizado. Ninguna carpeta pasa de 20 archivos (`data/` tiene 15 y `routes/`,
   13) y los archivos están agrupados por concepto.
3. **Pruebas que miran por dentro:** M9.
4. **El diseño:** F6 (las consultas), M1, M3, M4, M5, M7. Además, el § 7 quedó atrás (ver el punto 8).
   Las tablas, las rutas, los permisos y los eventos coinciden con el diseño. La comprobación del ZIP,
   SheetJS con las opciones cerradas, QuickJS con sus topes y el proceso sin entorno están como dice el
   ADR-021.
5. **Seguridad del diseño (§ 10):** se comprobó leyendo el código. Cada ruta mira el permiso de la
   tabla del § 3 (`routes-permissions.test.ts` lo cubre). Subir sigue el orden sesión, permiso,
   límite, `Content-Length` y flujo con tope y sin datos. Bajar usa `attachment`, `nosniff`, el nombre
   según RFC 6266 y dos a la vez. El proceso lector recibe el entorno vacío y tiene tope de RSS y de
   heap. QuickJS usa un contexto por corrida, con memoria, pila y tiempo. Los datos del vendedor se
   marcan con `privateProps()` y en la auditoría queda solo qué dato cambió. Solo con leer no se pudo
   comprobar: `mem_limit` del contenedor y el camino de 100 MB en Caddy (`deploy/` no está en el diff
   de `src/`), y que SheetJS no crezca con un ZIP que miente. Para eso está el revisor de seguridad.
6. **Reglas inventadas:** `autoDoubts` (M2), no probar los lectores de otros proveedores (M1) y el
   límite de 60 cambios por minuto (M10).
7. **Simpleza y repetición:** M10.
8. **Documentación que quedó atrás:** el § 7 del diseño nombra archivos que no existen o están en otro
   lugar. `rules/assign.ts` está en `reading/assign.ts`; `rules/files.ts`, en `files/cleanup.ts`;
   `events.ts` no existe; `reading/process.ts` no abre la planilla (lo hace `job.ts`); y la tabla de la
   aplicación nombra `useSuppliers.ts`, `uploads.ts`, `useListReview.ts`, `useSupplier.ts`,
   `useReaders.ts` y `useFiles.ts`, que hoy son `suppliers/suppliers.ts`, `uploads/*`,
   `review/use-review.ts`, `supplier/supplier.ts` y `admin/*.ts`. Tampoco están escritos: el límite de
   cambios por minuto, `autoDoubts`, que las filas de una descartada se borran en el momento (M5),
   que solo con el proveedor sabido se dejan afuera los lectores de otros (M1) y que el resumen hace
   más consultas (F6).
9. **Pantallas:** no hay maqueta aprobada. `screens.md` nombra como referencia «La mesa de entrada» y
   la escena de lectura de «El estante», y la vista es provisoria. No se miraron en un navegador. Leyendo el
   código: F2, F3 y F5. El avance de la lectura es un texto, no «la planilla que se lee fila por fila»
   de la referencia. Como la interfaz gráfica va al final, es una mejora. ↑ ↓ y Enter son de la
   navegación común: no se comprobó que recorran los proveedores sin sacar el cursor del buscador.
10. **La vista sin lógica:** F8.
11. **Lo que se podría extraer:** en la sección siguiente.

---

## Lo que se podría extraer a una librería

Este módulo sumó bastante que no es del negocio. Cada parte, con dónde está, para qué otro proyecto
serviría, qué la ata a Ferrebress, a qué grupo iría y qué cambio chico la dejaría lista.

| Parte | Dónde | ¿Sirve en otro proyecto? | Qué la ata a Ferrebress | Grupo | Cambio chico |
|---|---|---|---|---|---|
| Almacén de archivos por contenido (SHA-256, flujo con tope, disco o memoria) | `src/server/platform/storage/files.ts` | Sí: cualquier sistema que guarde adjuntos | Solo los comentarios citan 08 · E63 | Base del servidor | Sumar la limpieza de `tmp/` (M11) y una interfaz para un bucket |
| Bajar un archivo seguro (RFC 6266, `nosniff`, de a partes) | `src/server/platform/download.ts` | Sí | El nombre de reserva `'lista'` | Base del servidor | Recibir el nombre de reserva como parámetro |
| `http.upload`: un camino con nombre que acepta un cuerpo crudo | `src/server/platform/http.ts` | Sí | Nada | Base del servidor | Ninguno |
| Recibir una subida como flujo, con tope y corte por inactividad | `src/server/modules/price-lists/routes/upload.ts` (`body`, `receive`) | Sí | Está en el módulo y usa `formatFits` de las listas | Base del servidor | Sacar `body` y `receive` a `platform/`, con el control del formato como parámetro |
| Subir con avance desde el navegador (XHR) | `src/app/platform/server/upload.ts` | Sí | Los comentarios citan 08 | Base de la aplicación | Ninguno |
| Guardar un archivo bajado | `src/app/platform/view/save-file.ts` | Sí | Nada | Base de la aplicación | Ninguno |
| Correr código ajeno encerrado en QuickJS, con topes | `src/server/modules/price-lists/reading/sandbox.ts` | Sí: plugins, reglas escritas por usuarios o por IA | Nada del negocio, pero vive en el módulo | Nuevo: «código encerrado» | Moverlo a `platform/` y que reciba el nombre de la función global (hoy dice `reader`) |
| Procesos de trabajo reusados, con cola, tope de RSS, plazo de silencio y reemplazo | `reading/pool.ts` y `reading/process.ts` | Sí | Los tipos `Job` y `JobMessage` de las listas y el motivo `crashed` | Nuevo: «trabajos aparte» | Hacer el pool genérico en el tipo del trabajo y del mensaje, y que `process.ts` reciba el archivo de entrada |
| Revisar el índice de un ZIP antes de abrirlo (bombas ZIP) | `reading/zip.ts` | Sí: cualquier sistema que abra `.xlsx`, `.docx` o `.zip` | Nada | Base del servidor (seguridad) | Pasar `zipLimits` como parámetro |
| Leer un CSV como flujo (codificación, separador, comillas) | `reading/csv.ts` | Sí: importar cualquier CSV | El tipo `Cell` del contrato de las listas | Base del servidor | Devolver `string[]` y que la lista lo convierta a `Cell` |
| Lo último que se vio, sin conexión | `src/app/platform/last-seen.ts` | Sí | Nada | Base de la aplicación (sin conexión) | Ninguno |
| El número en una opción del menú | `src/app/modules/frame/counts.ts` y `views/basic/frame/Side/Count.tsx` | Sí | Los nombres de las opciones de Más | Marco | Ninguno |
| Un número en la cabecera, por permiso (`header.contribute`) | `src/server/modules/anomalies/index.ts:44-48` | Ya usa una pieza de la plataforma | El permiso `anomalies.review` | Base del servidor (ya está) | Ninguno |
| `Stale` y `ScreenSearch` | `src/app/views/basic/price-lists/Stale.tsx`, `ScreenSearch.tsx` | Sí, dentro de esta misma vista | Están en la carpeta de las listas y Anomalías las importa de ahí | Piezas visuales | Moverlas a `views/basic/ui/` |
| La prueba de rendimiento que mide y anota | `price-lists.perf.ts` | El patrón sí | Todo es de las listas | Calidad | Una ayuda `measure`/`countQueries` con `expect` en la plataforma de pruebas |

**¿Conviene extraer algo hoy?** No. Todavía hay un solo proyecto que lo usaría. Lo que sí conviene,
porque es chico y ordena el código de este mismo proyecto, es pasar `sandbox.ts`, `zip.ts` y la parte
genérica de `pool.ts` y `upload.ts` a `src/server/platform/`, y `Stale` y `ScreenSearch` a
`views/basic/ui/`. Así una extracción futura sería copiar carpetas.
