# Revisión del diseño · 08 · Listas de precios, etapa a (la lista a mano)

Revisa [price-lists.md](price-lists.md) y el
[ADR-021](../adr/ADR-021-reading-price-lists.md) (propuesto) contra la constitución, el
[capítulo 08](../../chapters/08-price-lists/rules.md) (R1 a R9, E01 a E83 y E29b a E31e), sus
[pantallas](../../chapters/08-price-lists/screens.md), las secciones 8 y 9 del
[capítulo 06](../../chapters/06-administration/rules.md), el resumen del
[capítulo 07](../../chapters/07-catalog/summary.md), el [glosario](../../project/glossary.md), el
[plan](../../project/roadmap.md), la [arquitectura](../architecture.md),
[mobile-data.md](../mobile-data.md), los ADR 001, 003, 004, 005, 007, 009, 012, 014, 017, 019 y 020, el
diseño aprobado de [administration.md](administration.md) y el código de hoy que el diseño usa:
`src/shared/text/clean.ts`, `src/shared/contracts/permissions.ts`, `src/server/platform/events.ts`,
`permissions.ts`, `header-fields.ts`, `realtime/topics.ts`, `storage/audit/write.ts` y `event.ts`,
`src/server/modules.ts` y `src/app/platform/server/api.ts`.

Gravedad: **Frena** = hay que resolverlo (o que Carlos lo decida) antes de aprobar el diseño;
**Mejora** = conviene, pero no frena.

**Lo que no pude comprobar:** no hay código del módulo ni medidas. Las metas de tiempo (abrir 10.000
filas en menos de 4 s, los lectores en menos de 3 s, el resumen en menos de 300 ms) las doy por
razonables o no según el diseño, sin haberlas medido. Tampoco sé cuántos proveedores tiene la
ferretería ni cuántas filas trae cada lista: los cálculos de volumen de abajo usan supuestos que digo
en cada caso.

Resumen: la idea de fondo está bien. Separar lo que trae cada proveedor (`items`) del producto que se
vende, cambiar el estado de una lista con una sola sentencia que mira el de antes, el índice único
parcial de «una lista viva por proveedor», la cuenta del costo una sola vez en `src/shared/pricing/`,
los lectores encerrados en QuickJS dentro de un hilo con topes, y el avance por un tema `temporary`.
Frenan estos puntos, en grupos:

- **Escenarios sin camino:** E12, E13, E74, E28, E72 y E76 dependen de cosas del capítulo 07 que en esta
  etapa nadie puede producir (1.1); fijar el proveedor de una lista después de subirla choca con el
  índice único (1.2); volver a leer una lista vieja «no se pudo leer» puede tapar una más nueva (1.3);
  qué pasa con una lectura cortada por un reinicio (1.4); R5.7 pide guardar el resultado de la lista de
  prueba y el diseño lo borra (1.5); y E17 y E18 dependen de cómo se muestran los centavos (1.6).
- **El contrato del lector no está escrito** (1.7), y cómo llega a la base el lector de un programador
  no está resuelto, que además choca con la constitución, VIII (1.8).
- **Performance:** calcular lo que cambia cada vez que se mira obliga a cargar las 10.000 filas en cada
  página del detalle o a escribir la cuenta del costo otra vez en SQL (2.1). Los archivos en PostgreSQL
  van contra la constitución, V, y cargan cada archivo entero en la memoria del proceso (2.2).
- **Concurrencia:** aplicar y cambiar cómo cobra el mismo proveedor a la vez deja costos calculados
  con descuentos que ya no valen (5.1).
- **Auditoría:** las 10.000 anotaciones de una lista tienen que escribirse después de confirmar y
  llevar el producto como «dato afectado» (5.2).
- **Fronteras:** con 07 aparece un ciclo entre `catalog` y `price-lists` si el costo se queda solo en
  `price_lists.items` (6.1); y dos módulos nuevos, `catalog` y `anomalies`, que el plan y la
  constitución no prevén así (6.2).
- **Documentos:** el canal del avance no está en [mobile-data.md](../mobile-data.md) (7.1), y varios
  nombres no son los del glosario (3.1).

---

## 1. Escenarios sin cubrir

### 1.1 E12, E13, E74, E28, E72 y E76 dependen del capítulo 07 — **Frena**

- **Dónde:** § 1, «Hoy cada artículo crea su producto»; § 2, `catalog.products` (`unit_manual`,
  `vat_manual`, `margin`); § 10, «Una por escenario».
- **Qué propone:** cada artículo crea su producto; un producto está activo mientras algún artículo
  activo lo traiga; `catalog` no tiene pantallas ni rutas.
- **Qué veo:** en esta etapa ningún producto puede tener dos proveedores (unirlos es 07c, R7.1), nadie
  puede cambiar a mano la unidad ni el IVA (07a) ni poner un margen (07a). Por eso:
  - **E12 y E13** («12 de los cuales solo trae él», «los otros 18 siguen con el costo de su otro
    proveedor») y **E74** no tienen cómo darse. Además, `catalog.products` no tiene costo: «sigue con el
    costo del otro» no tiene dónde verse, y cuál de los dos costos es «el del producto» es una regla de
    07 («el proveedor en uso», resumen de 07).
  - **E28, E72 y E76** necesitan un producto con `vat_manual`, `unit_manual` o `margin` puestos, que
    solo puede armar una prueba escribiendo la tabla de otro módulo. La constitución, VII, pide que las
    pruebas usen el módulo como lo usa el resto del sistema.
  - El § 10 no dice cómo se prueba ninguno de los seis.
- **Qué hace falta:** decidirlo con Carlos y escribirlo en § 10. Opciones:
  1. Que esos seis escenarios se prueben recién con 07a (E28, E72, E76) y con 07c (E12, E13, E74), y
     que en 08a se pruebe solo la regla del artículo (pierde el costo, el producto se da de baja si no
     queda otro artículo activo) con productos de un solo proveedor. Hay que anotarlo en el plan para no
     perderlos.
  2. Sumar a la fachada de `catalog` lo mínimo que 07 va a necesitar igual (`setUnit`, `setVat`,
     `setMargin`, `link`) sin rutas, y que las pruebas lo usen por la fachada. Es adelantar parte del
     diseño de 07, que no tiene reglas aprobadas (ver 6.2).

### 1.2 Fijar el proveedor después de subir choca con «una lista viva por proveedor» — **Frena**

- **Dónde:** § 2, `lists`, el índice único parcial `(supplier_id) where status in ('reading',
  'pending', 'applying')`, y «Subir otra del mismo proveedor descarta la anterior en la misma
  transacción que crea la nueva»; § 3, `POST /lists/:id/supplier`.
- **Qué propone:** descartar la anterior al crear la nueva.
- **Qué veo:** eso cubre solo la lista subida desde la pantalla de un proveedor. Desde «Subir lista» la
  lista nace con `supplier_id` en `null` y el proveedor se fija después: lo deduce el hilo (por el
  lector) o lo elige la persona (`POST …/supplier`). En ese momento:
  - si el proveedor ya tiene otra lista viva, el `update` choca con el índice y, sin un manejo
    explícito, es un error 500 o una lectura que muere sin decir por qué (E31d, E38);
  - si las dos se subieron sin decir de quién eran, gana la que termina de deducirse primero, no la
    última que se subió, que es la que pide R4.8 («subir otra… descarta la que estaba esperando»);
  - si la otra está «aplicándose», R4.8 no dice qué pasa, y descartarla en medio de la transacción de
    aplicar no se puede.
- **Qué hace falta:** una sola regla, en `rules/`, para «fijar el proveedor de una lista» (al subir, al
  deducirlo y al elegirlo), en una transacción: si hay otra viva de ese proveedor y es más vieja
  (`uploaded_at`), se descarta con el motivo «reemplazada» y se cancela su lectura; si es más nueva, se
  descarta esta; si se está aplicando, la nueva espera o se rechaza (esto último, que lo decida Carlos).
  Con una prueba de las dos subidas sin proveedor y que termine primero la más nueva.

### 1.3 Volver a leer una lista vieja puede tapar una más nueva — **Frena**

- **Dónde:** § 1, el diagrama («no se pudo leer ──▶ leyendo (llegó un lector que la entiende, R5.5)»);
  § 5, `index.ts` «al arrancar copia los lectores del repositorio y retoma lo cortado».
- **Qué veo:** E47 pide que la lista «no se pudo leer» se lea sola cuando llega su lector. Pero entre
  que no se pudo leer y que llega el lector (una versión nueva, días después) el proveedor pudo subir y
  aplicar otras listas. Si la vieja vuelve a «leyendo», entra al índice de las vivas y, con lo de 1.2,
  descarta la lista en espera que alguien estaba revisando, para quedar como una lista que R6.10 no deja
  aplicar. Tampoco dice el diseño cómo se sabe que «llegó un lector»: si al arrancar se vuelven a leer
  todas las «no se pudo leer» en cada despliegue, el costo crece con la historia.
- **Qué hace falta:**
  - Volver a leer solo la última lista del proveedor, y solo si no tiene después una lista leída: las
    anteriores quedan como están (R9.2 ya cierra su anomalía cuando «el proveedor sube otra que sí se
    lee»).
  - Volver a leer solo cuando cambió el conjunto de lectores (los `file_key` que se copiaron, o un
    lector nuevo que quedó activo), no en cada arranque.

### 1.4 Qué pasa con una lectura cortada por un reinicio — **Frena**

- **Dónde:** § 1, «si el servidor se reinicia en el medio [de aplicar], al arrancar la lista vuelve a
  "en espera"»; § 5, `index.ts` «retoma lo cortado».
- **Qué veo:** para aplicar está dicho; para leer, no. Una lista en «leyendo» cuando se corta el servidor
  tiene filas guardadas a medias (§ 1, «guarda las filas en la base de a tandas»), una pregunta de
  proveedor quizás sin contestar y ningún hilo que la siga. El diseño no dice si se borra lo guardado y
  se vuelve a leer, si pasa a «no se pudo leer» o si queda así. Si queda así, el proveedor muestra una
  lista «leyendo» para siempre hasta que alguien suba otra.
- **Qué hace falta:** decirlo. Lo más simple: al arrancar, cada lista en «leyendo» borra sus filas y
  vuelve a la cola (el archivo está guardado); el lector y el proveedor ya fijados se conservan. Con una
  prueba.

### 1.5 R5.7 pide guardar la planilla y su resultado como prueba del lector — **Frena**

- **Dónde:** § 2, `readers.proof_list_id`; § 2, `list_rows`, «Una lista descartada o aplicada borra sus
  filas al día siguiente»; § 12, tercer punto.
- **Qué veo:** R5.7: «si la lista se aplica, el lector queda activo y esa planilla con su resultado queda
  guardada como su prueba». El archivo queda (`files`), pero el resultado son las filas de la lista, y
  se borran al día siguiente.
- **Qué hace falta:** una de dos, dicha en el diseño:
  1. Las filas de la lista que es prueba de un lector no se borran.
  2. La prueba es el archivo y el lector: el resultado se vuelve a sacar corriendo el lector sobre el
     archivo, que da siempre lo mismo. Es menos espacio, y es lo que haría falta para comprobar que un
     lector sigue leyendo bien su planilla después de actualizar QuickJS o SheetJS.

### 1.6 Cómo se muestran los centavos: E17 y E18 — **Frena**

- **Dónde:** § 1, «no se redondea (R3.4) y la pantalla lo muestra con dos decimales».
- **Qué veo:** en E17 el costo es $ 1.648,725 y el escenario espera «$ 1.648,73»; en E18, $ 826,446… y
  espera «$ 826,45». Las dos piden redondear al centavo, la mitad para arriba, **al mostrar**. Si la
  pantalla corta los decimales (lo que hace un entero en millonésimos dividido por 10.000), muestra
  $ 1.648,72 y $ 826,44, y los dos escenarios fallan. Además, guardar en millonésimos con divisiones
  enteras sí redondea (corta al millonésimo): conviene decirlo para que nadie lo tome como una
  contradicción con R3.4.
- **Qué hace falta:** escribir en § 1 que el costo se guarda cortado al millonésimo (sin redondeo que
  se vea) y se muestra redondeado al centavo, la mitad para arriba, con la función de
  `src/shared/money/`. Ver también 8.3 sobre los números grandes.

### 1.7 R4.11: cancelar mientras sube — **Mejora** (para Carlos)

- **Dónde:** § 1, «Subir es de la aplicación: la lista existe en el servidor recién cuando su archivo
  llegó entero».
- **Qué veo:** R4.11 dice «mientras sube o lee, se puede cancelar: la lista queda descartada y su
  archivo, guardado». Cancelada a mitad de la subida, no hay archivo entero que guardar ni lista. El
  diseño hace lo razonable (no queda nada), pero no es lo que dice la regla.
- **Propuesta:** que Carlos confirme que «cancelar mientras sube» no deja nada, y ajustar R4.11.

### 1.8 Aplicar una lista cuyo proveedor se dedujo por el nombre y nadie confirmó — **Mejora**

- **Dónde:** § 2, `lists.supplier_guess`; § 3, `POST …/apply`.
- **Qué veo:** con `supplier_guess = 'name'` la pantalla pregunta «¿Es de Ixnova?». Nada impide aplicar
  sin contestar, ni por la pantalla ni por fuera de ella. Aplicar la lista de un proveedor en otro
  puede dar de baja cientos de productos.
- **Propuesta:** una columna `supplier_confirmed` (o un estado de `supplier_guess`), y que aplicar sin
  confirmar dé `409 supplier-unconfirmed`. Con una prueba.

### 1.9 Escenarios con huecos menores — **Mejora**

- **R8.1 y E79:** se busca «por código o por palabras de la descripción o la marca». § 2 busca en `code`
  y `description_key`; falta la marca. Y `description_key` aparece en el índice de `items` pero no en sus
  columnas (§ 2): falta la columna.
- **R6.3, buscar en el detalle:** `list_rows` tampoco tiene la descripción sin acentos para buscar.
- **R2.4 y E14:** no dice qué pasa con los artículos del proveedor dado de baja (¿`active = false` con
  `gone_list_id` en `null`?), ni qué muestra R8.2 («desde qué lista dejaron de venir») para esos.
- **R2.4:** dar de baja también tiene que cancelar una lista suya que se esté leyendo, no solo descartar
  la que está en espera.
- **R5.2:** el orden entre los lectores de un mismo proveedor (E41: el viejo y el nuevo). Lo natural es
  del más nuevo al más viejo; conviene escribirlo.
- **R5.2:** qué pasa si reconoce la planilla un lector de un proveedor dado de baja.
- **R4.5 y E36:** la fecha del servidor tiene que ser la del día **en la zona del negocio**
  (`src/shared/time/business.ts`): una lista subida a las 22 en Argentina es del día siguiente en UTC.
  Y si la planilla y el nombre del archivo dicen fechas distintas, cuál manda.
- **R6.10 con una fecha futura:** una planilla con un año mal escrito (2062) deja al proveedor sin poder
  aplicar ninguna lista posterior. Proponerle a Carlos rechazar una fecha posterior a la del servidor, o
  usar la del servidor en ese caso.
- **E25:** no dice qué error contesta el recálculo que falla (en 06 es `503 recalc-failed`).
- **`lists.uploaded`:** el texto «Subió una lista de <proveedor>» no sirve cuando todavía no se sabe de
  quién es.

---

## 2. Performance

### 2.1 Calcular lo que cambia cada vez que se mira — **Frena**

- **Dónde:** § 1, «Lo que cambia se calcula al mirarlo, no al leer»; § 3, `GET /lists/:id` (3
  consultas) y `GET /lists/:id/rows` (2 consultas, de a 50, «los que cambian primero», `show` con «para
  revisar»); § 9.
- **Qué propone:** guardar lo que trajo cada fila y calcular en cada pedido el costo nuevo, si es nuevo,
  si cambia y cuánto, contra cómo cobra hoy el proveedor y sus artículos de hoy.
- **Qué veo:** la cuenta del costo está en TypeScript (`src/shared/pricing/cost.ts`). Para ordenar «los
  que cambian primero», filtrar «para revisar» o «nuevos», y paginar de a 50 con `after`, hay que
  conocer el costo nuevo de **todas** las filas. Quedan dos caminos, y el diseño no dice cuál:
  1. Cargar las 10.000 filas y los 10.000 artículos en cada pedido (el resumen y **cada página**),
     calcular en Node, ordenar y cortar 50. Son dos consultas, pero de unos MB cada una, en cada página
     y en cada dispositivo vinculado que pida lo suyo. Las metas de § 9 («50 filas, menos de 20 KB»)
     miden lo que sale, no lo que se lee.
  2. Escribir la cuenta del costo otra vez en SQL. Es la cuenta repetida que la constitución, XII, punto
     3, no deja, y que la revisión de 06 ya marcó (4.2 de
     [administration-design-review.md](administration-design-review.md)).
- **Por qué no hace falta:** lo que puede cambiar entre leer y mirar es muy poco. Hay **una sola lista
  viva por proveedor** (el índice único), así que los artículos del proveedor no cambian mientras ella
  espera, salvo por: cambiar cómo cobra (R3.5), dar de baja el proveedor (que la descarta) y, con 07,
  cambiar a mano el IVA de un producto con precios con IVA incluido (ver 8.4). Los porcentajes de 06 (R8.1
  y R8.2) no cambian ningún costo: son umbrales.
- **Propuesta:** al terminar de leer, guardar en cada fila el costo anterior, el nuevo, su base y qué le
  pasa (`new`, `changed`, `same`, `gone`); una sentencia por tanda, que ya está en la meta de lectura.
  Al cambiar cómo cobra un proveedor, recalcular las filas de su lista viva en la misma transacción.
  Después, el resumen es un `count(*) … group by` y cada página, una consulta con índice; «para revisar»
  compara en SQL los dos costos guardados con el porcentaje de hoy, así E43 sigue andando. Aplicar
  compara igual con `expected`, que ya está. Si se mantiene la idea del diseño, que § 9 diga cuántas
  filas lee cada pedido y cuánto tarda con 10.000, y que la prueba de performance lo mida.

### 2.2 Los archivos en PostgreSQL — **Frena** (va contra la constitución, V)

- **Dónde:** § 1, «El archivo original se guarda en la base»; § 2, `price_lists.files`; § 3, `GET
  …/file`.
- **Qué propone:** una tabla con el archivo en `bytea`, una vez por contenido, por tener un solo lugar
  para la copia y la misma transacción que la lista.
- **Qué veo:**
  - **La constitución, V:** «PostgreSQL tiene solo el estado actual, lo más chico posible, para que sea
    rápido y sus copias sean livianas». Los archivos de listas viejas son historia que R4.4 pide guardar
    para siempre, y van a ser casi todo el peso de cada copia de la base.
  - **El número:** «unos cientos de MB por año» no cierra con «1 a 5 MB por semana y por proveedor».
    Con 10 proveedores y 3 MB por semana son unos 1,5 GB por año; con 30, unos 4,5 GB. No sé cuántos
    proveedores hay: hace falta el número.
  - **La memoria:** con `pg` un `bytea` entra y sale entero, y en texto viaja en hexadecimal (el doble).
    Subir un archivo de 100 MB (el tope de 06 · R8.3) es tenerlo entero en la memoria del proceso
    principal al guardarlo, otra vez al pasárselo al hilo y otra al bajarlo (E40). Con 4 subidas por
    persona a la vez, son cientos de MB en el proceso que atiende a todos.
- **Opciones:**
  1. **Archivos en un volumen**, con el nombre de su SHA-256, junto a los de la auditoría (que ya son
     archivos del servidor con su propia copia, ADR-004). Se escriben antes que la fila de la lista; si
     la transacción falla queda un archivo huérfano que una limpieza diaria borra. Subir y bajar van por
     partes, sin tener el archivo entero en memoria; la copia es incremental porque los archivos no
     cambian. Lo que se pierde es la misma transacción, que con «archivo primero, fila después» no hace
     falta.
  2. **Seguir en PostgreSQL** pero en una base o un esquema que no entre en la copia diaria, con su propia
     copia. Mantiene la transacción; sigue el problema de la memoria.
  3. **Seguir así**, con la aprobación de Carlos y el número de GB por año escrito.
  Recomiendo la 1. Necesita una línea en la arquitectura («Los datos») y en el compose.

### 2.3 Lo que no tiene número o no se va a medir — **Mejora**

- **El hilo de lectura no tiene tope de memoria con número.** El ADR-021 dice `resourceLimits`, pero no
  cuánto. SheetJS lee el archivo entero: un `.xlsx` de 30 MB comprimido puede ser cientos de MB de XML y
  varias veces eso en objetos. Con 2 hilos y PostgreSQL en la misma máquina (ADR-014, capa gratuita),
  hace falta el número y qué pasa al llegar (`too-big`, no «dañado»).
- **«Más de 200.000 filas o 50 hojas no se lee»** se sabe recién después de abrir el archivo, cuando ya
  se gastó la memoria. SheetJS tiene `sheetRows` para cortar mientras lee; conviene usarlo y decirlo.
- **El tope de QuickJS (64 MB) choca con el de filas:** 200.000 filas de 10 celdas como textos dentro de
  QuickJS pasan los 64 MB; una lista grande y legítima no se podría leer. O se le pasan las filas por
  partes, o el tope crece con el tamaño de la planilla.
- **Probar todos los lectores:** R5.2 prueba primero los del proveedor y después los de todos. Con 50
  proveedores y 2 o 3 lectores cada uno, son 150 lectores, cada uno con hasta 200 KB de código que se
  carga y se evalúa en cada lectura, y con 5 s de tope cada uno: el peor caso no tiene techo. Proponer:
  que «¿es tuya?» reciba solo las primeras filas (barato) y el lector completo corra solo en los que
  dicen que sí; un tope total por planilla además del de cada lector; y que § 9 tenga una meta con N
  lectores.
- **El avance «desde el primer segundo» (E39):** SheetJS abre el archivo de una vez, sin avance, y recién
  ahí se sabe cuántas filas hay. Los primeros segundos de la lectura no tienen «filas de cuántas». El
  diseño tiene que decir qué se ve en ese tramo («Abriendo la planilla»).
- **QuickJS más lento que V8** (ADR-021, «Consecuencias») está dicho sin medir. Conviene que la tarea 6
  arranque con una medida de abrir y leer 10.000 filas en la máquina del ADR-014, antes de construir lo
  demás encima.
- **Las listas de un proveedor** (`GET /suppliers/:id`): todas, sin paginar. Crecen con la historia (una
  por semana son 520 en diez años) y cada una pide el nombre de quien la subió y la aplicó: falta contar
  esa consulta a `users` (la fachada `nameOf`).

### 2.4 Lo que está bien medido — en una línea

Aplicar en tandas de 1.000 con `unnest` y 4 sentencias por tanda, los artículos de a 50 con un índice, y
el campo de la cabecera sin consultas: no veo nada que agregar. La meta de 30 s para aplicar 10.000 filas
es holgada; con lo de 2.1, debería andar muy por debajo.

---

## 3. Simpleza

### 3.1 Nombres que no son los del glosario — **Frena** (se arregla rápido)

- **Dónde:** § 2 y § 3.
- **Qué veo:** la constitución, X, dice que cada palabra del negocio tiene una sola traducción, la del
  glosario. El diseño usa otras:

  | Glosario | Diseño |
  |---|---|
  | Lista completa / solo cambios: `scope` (`full`, `partial`) | `kind` (`full`, `changes`) |
  | Cómo cobra: `terms` | `pricing` |
  | Dado de baja: `discontinued` (producto), `inactive` (proveedor) | `active`, `gone`, `deactivate` |
  | Lector automático: `autoReader` | `automatic` |
  | Fila salteada: `skippedRow` | `skipped` |
  | Código del proveedor: `supplierCode` | `code` |
  | Los estados de una lista: sin «leyendo» | `reading` |
  | — (no existe) | «artículo» (`items`) |

  Además, el glosario dice que el costo es «con descuentos e IVA», y R3.1 dice «sin IVA».
- **Qué hace falta:** o el diseño usa las palabras del glosario, o el glosario cambia (su sección del
  08) antes del código. «Artículo» es una palabra nueva del diseño, y hay que sumarla con su definición
  («lo que trae un proveedor con su código»).

### 3.2 Subir con `multipart/form-data` — **Mejora**

- **Dónde:** § 3, «Subir: el cuerpo es `multipart/form-data`»; § 5, `src/server/platform/upload.ts`.
- **Qué veo:** Hono lee un `multipart` con `formData()`, que junta todo el cuerpo en memoria antes de
  devolver nada: «se corta al pasarlo mientras llega» necesita un lector de `multipart` por partes, que
  es una dependencia más (y su ADR) o código propio delicado.
- **Propuesta:** mandar el archivo como cuerpo crudo (`application/octet-stream`), con el nombre, el
  proveedor y el tipo en la dirección (`?name=&supplierId=&scope=`). Leer el cuerpo por partes con su
  tope es leer `Request.body`, sin dependencias, y con 2.2 opción 1 cada parte va directo al archivo.

### 3.3 El lector automático guarda su código entero — **Mejora**

- **Dónde:** § 2, `readers.code`; § 5, `reading/template.js`.
- **Qué veo:** cada lector automático guarda una copia de la plantilla con sus números de columna. Si
  la plantilla tiene un error, los lectores viejos lo conservan para siempre (R5.6: un lector no se
  edita), y la base guarda la misma plantilla una vez por lector.
- **Propuesta:** guardar `{ template: 'automatic-1', columns: … }` y armar el código al cargarlo. Una
  plantilla nueva es `automatic-2`; las viejas siguen leyendo igual.

### 3.4 La versión del proveedor para cada dato — **Mejora**

- **Dónde:** § 2, `suppliers.version`; § 3, `POST /suppliers/:id` `{ field, value, version }`.
- **Qué veo:** una sola versión para todo el proveedor: si una persona cambia el teléfono y otra la nota
  al mismo tiempo, la segunda da `409` aunque no se pisen. En 06 cada ajuste tiene la suya (E13 de 06).
- **Propuesta:** mandar el valor que se vio (`before`) y escribir `where <dato> = before`: choca solo
  quien cambió lo mismo. «Cómo cobra», que va entero, sigue con su versión.

### 3.5 Las filas salteadas en dos lugares — **Mejora**

- **Dónde:** § 2, `anomalies.summary` («las filas») y `list_rows`, que «se guarda mientras haya una
  anomalía de filas salteadas abierta de esa lista».
- **Qué veo:** las filas salteadas quedan en el resumen de la anomalía y también en `list_rows`. Para
  borrar las filas, `price-lists` tiene que preguntarle a `anomalies` si la suya sigue abierta.
- **Propuesta:** que la anomalía guarde las filas (con un tope, por ejemplo 500, y cuántas eran) y que
  `list_rows` se borre siempre al día siguiente, sin preguntar.

### 3.6 `settings.ts` y `realtime.ts` — **Mejora**

- **Dónde:** § 5.
- **Qué veo:** los topes y tiempos (2 hilos, 5 s y 64 MB por lector, 200.000 filas, 50 hojas, 4 por
  persona, 10 por minuto, tandas de 1.000, páginas de 50, el día de espera para borrar filas, cuatro
  avisos por segundo) no tienen lugar dicho. La constitución, XII, los pide en el `settings.ts` del
  módulo. Y el tema del avance va en `index.ts`, cuando el ADR-020 pide un `realtime.ts` por módulo.
- **Propuesta:** sumar los dos archivos a la tabla de § 5.

---

## 4. Repetición

### 4.1 `plain` no existe — **Mejora**

- **Dónde:** § 2, `name_key` («`plain`, `src/shared/text`»); § 5, «`plain` ya existe».
- **Qué veo:** en `src/shared/text/` hay `cleanText`, `lettersIn` y `sameText` (que compara con
  `localeCompare`, sin dar una clave). No hay una función que devuelva el texto sin acentos ni
  mayúsculas para guardarlo y ponerle un índice. Y `users` ordena y hace único el nombre de los roles
  con `lower(name)`, que distingue acentos.
- **Propuesta:** sumar `searchKey(text)` a `src/shared/text/` (es código común: va en la tarea que lo
  toma, ver 8.1), usarla para `name_key`, `description_key`, las marcas de los descuentos y los
  buscadores de la aplicación, y anotar que con eso `roles` podría dejar `lower(name)`.

### 4.2 Subir con su avance fuera del único punto que habla con el servidor — **Mejora**

- **Dónde:** § 5, `src/app/platform/server/upload.ts` con `XMLHttpRequest`.
- **Qué veo:** `src/app/platform/server/api.ts` dice ser «el único punto por donde la aplicación habla con
  el servidor»: pone las cabeceras de la versión y el dispositivo, lee la cabecera `X-Ferrebress` (la
  huella de los permisos, la sesión cerrada, la hora del servidor) y traduce los errores. Una subida por
  otro lado se saltea todo eso, y el medidor de datos (ADR-020) no la ve.
- **Propuesta:** que `upload.ts` use las funciones de `api.ts` para las cabeceras, la respuesta y los
  errores, y pase por el punto de enganche del medidor; decirlo en § 5.

### 4.3 Lo demás — en una línea

La cuenta del costo, los permisos con sus inclusiones, el `limit` de las rutas, los temas del canal y los
campos de la cabecera reutilizan lo que ya existe: no veo otra repetición.

---

## 5. Seguridad y consistencia

### 5.1 Aplicar y cambiar cómo cobra a la vez — **Frena**

- **Dónde:** § 1, «Aplicar es una transacción»; § 3, `POST /suppliers/:id/pricing` y `POST
  /lists/:id/apply`.
- **Qué veo:** aplicar lee cómo cobra el proveedor al empezar y escribe durante segundos. Si en el medio
  alguien cambia un descuento:
  - con «Recalcular», el recálculo se traba en las filas que aplicar ya escribió, espera, y recalcula
    desde la base; puede andar, pero el número que confirmó (`confirmed`) ya no es el de ahora;
  - con «Desde la próxima lista», se guarda enseguida y aplicar termina con costos calculados con el
    descuento viejo, aunque la lista se aplicó después del cambio.
  La protección de `expected` no alcanza: pasar un descuento de 25 % a 26 % cambia todos los costos sin
  cambiar cuántos son nuevos, cuántos cambian ni cuántos se dan de baja. R2.6 ya pide lo mismo para dar
  de baja; acá no hay regla, pero sí un resultado inconsistente.
- **Qué hace falta:** que aplicar trabe la fila del proveedor al empezar (`select … for update`) y que
  cambiar cómo cobra la trabe igual: el segundo espera o contesta `409 list-applying`, como dar de baja.
  Con una prueba de los dos a la vez.

### 5.2 La auditoría de cada artículo: después de confirmar, y con su producto — **Frena**

- **Dónde:** § 4, «Los de cada artículo se anotan en la misma tanda que los aplica… 10.000 filas son
  10.000 anotaciones».
- **Qué veo:**
  - **Cuándo:** `AuditLog.record` (`storage/audit/write.ts`) escribe en SQLite apenas junta 100. Si se
    anota «en la misma tanda que los aplica» y la tanda 7 falla, la transacción de PostgreSQL se deshace
    pero las anotaciones de las tandas 1 a 6 ya están en la auditoría, que no se puede corregir. Quién
    hizo qué mostraría costos que nunca se aplicaron (lo contrario de E61). El ADR-001 y el ADR-004
    dicen que la auditoría se escribe después de confirmar, con `events.transaction` y lo que corre al
    final.
  - **Con qué:** R9.1 pide «para poder leer después la historia de su costo» (y la constitución, V). La
    auditoría busca rápido solo por el dato afectado (`targets`). El diseño dice «con el identificador de
    la lista», no del producto. Si se escriben sin el producto como dato afectado, la historia del costo
    (T115) va a tener que recorrer todo, y lo ya escrito no se puede arreglar.
- **Qué hace falta:** juntar las anotaciones en memoria y mandarlas a la auditoría al confirmar; cada una
  con `targets: [{ kind: 'product', id }]` (y el artículo: proveedor y código). Ver 7.3 sobre el volumen.

### 5.3 Crear un proveedor con «Cargar listas» fuera de una subida — **Mejora**

- **Dónde:** § 3, `POST /api/price-lists/suppliers` con «Administrar proveedores» o «Cargar listas».
- **Qué veo:** R2.2 deja dar de alta con «Cargar listas» solo **al subir una lista**. La ruta lo deja
  siempre, también por fuera de la pantalla.
- **Propuesta:** `POST /suppliers` solo con «Administrar proveedores»; con «Cargar listas», solo por `POST
  /lists/:id/supplier` con `newSupplier`, que ya existe. Así el servidor controla la regla tal cual.

### 5.4 Lo que entra de afuera, con huecos — **Mejora**

- **`field`** en `POST /suppliers/:id` es el nombre de una columna que manda el cliente: tiene que salir
  de un `Map` fijo (como la clave de 06), nunca armarse en la consulta. Decirlo.
- **El orden de la subida:** sesión y permiso **antes** de leer el cuerpo (E04: «no guarda el archivo»).
  El diseño dice que mira `Content-Length` «antes de leer nada», pero no dónde queda el permiso.
- **Los primeros bytes:** un CSV no tiene firma, y muchos sistemas de facturación mandan como `.xls` una
  tabla HTML o un XML de Excel 2003, que SheetJS abre. Si se exigen los bytes del formato binario, esas
  listas se rechazan al subir. Proponer: por la extensión y que no sea un ejecutable ni un ZIP de otra
  cosa; lo demás lo decide el hilo, como «no se pudo leer».
- **El hilo hereda el entorno:** un `Worker` de Node recibe una copia de `process.env` (con
  `DATABASE_URL` y lo que venga en la etapa b) salvo que se le pase `env: {}`. SheetJS no es código
  hostil, pero R5.10 habla de «las claves»: pasarle un entorno vacío cuesta una línea.
- **Las anomalías muestran precios:** las filas salteadas por «otra moneda» o «código repetido» traen
  su precio, y las ve quien tiene «Revisar las anomalías» aunque no tenga «Ver costos» (R1.3). Que lo
  decida Carlos: tapar el precio sin «Ver costos», o aceptarlo.

### 5.5 Lo demás de seguridad — en una línea

Los datos personales con `privateProps()`, las celdas como texto (E68), el archivo con
`Content-Disposition: attachment` y `nosniff`, los lectores en QuickJS sin nada del servidor, los límites
de subida y los `404` por identificador están bien. La revisión de seguridad va aparte.

---

## 6. Fronteras

### 6.1 Dónde vive el costo de un producto: el ciclo que aparece con 07 — **Frena**

- **Dónde:** § 1, «`catalog`… el capítulo 07 le suma el margen, el precio, la búsqueda y la ficha»; § 2,
  `catalog.products` sin costo; `price_lists.items.cost`.
- **Qué veo:** hoy `price-lists` usa la fachada de `catalog` (crear, actualizar, dar de baja). Con 07,
  el catálogo necesita el costo para el precio de venta (R7.6), la búsqueda y la ficha, y el costo está
  en `price_lists.items`. Si `catalog` se lo pide a la fachada de `price-lists`, hay un ciclo, que el
  ADR-001 no deja. Las tablas se definen ahora: conviene que no haya que rehacerlas en 07.
- **Opciones:**
  1. El costo con el que se vende (y de qué proveedor sale) va en `catalog.products`, y `price-lists` lo
     escribe por la fachada al aplicar, al recalcular y al dar de baja. Una sola dirección:
     `price-lists → catalog`. `items.cost` queda como el costo de cada proveedor.
  2. Al revés: `price-lists` publica eventos («artículo creado», «costo cambiado») y `catalog` los
     escucha en la misma transacción; `price-lists` no conoce a `catalog`. Más desacoplado, pero R7.4
     («si ningún otro proveedor lo trae») pasa a ser de `catalog`.
  Recomiendo la 1 por simple. Sea cuál sea, hay que escribirla ahora.

### 6.2 Dos módulos nuevos que el plan y la constitución no prevén así — **Frena** (para Carlos)

- **Dónde:** § 1, «Tres módulos del servidor».
- **Qué veo:**
  - **`anomalies`:** la constitución, XII, dice que un módulo tiene el mismo nombre en el capítulo, en el
    servidor y en la aplicación. Las anomalías son 06 · R9, y el plan las pone como la etapa b de
    `administration`. Un módulo `anomalies` sin capítulo rompe esa regla.
  - **`catalog`:** el capítulo 07 está «en pausa en el paso 1», sin reglas aprobadas. La constitución, I,
    dice que no se escribe código de un módulo sin sus reglas, pantallas y diseño aprobados, y el plan
    dice que 07a depende de 08a, no al revés. La tabla `catalog.products` ya decide cosas de 07 (cómo se
    guarda el margen y en qué unidad, que la unidad es un texto libre con `'un.'` cuando 07 confirmó un
    conjunto cerrado: un., kg, m, L).
- **Opciones:**
  1. Separar el producto en `catalog` como propone el diseño (es lo correcto técnicamente), con la
     aprobación explícita de Carlos y una línea en el plan: «08a crea `catalog` con lo mínimo; 07a lo
     completa». `catalog.products` con solo lo que 08a usa (sin `margin`, ver 1.1), y la unidad como uno de
     los cuatro valores confirmados.
  2. Las anomalías como parte de `administration` (`administration/anomalies/`, tabla
     `administration.anomalies`), que es lo que dice el plan; o un módulo `anomalies` con su línea en el
     plan y en el índice de capítulos, decidido por Carlos.
  3. Los productos dentro de `price_lists` hasta 07, y una migración de datos al crear `catalog`. Es lo
     que más cuesta después; no lo recomiendo.

### 6.3 `useUploads` en el shell — **Mejora**

- **Dónde:** § 5, `useUploads.ts`, «vive en el shell, así sigue mientras se trabaja en otra cosa».
- **Qué veo:** si el shell importa el modelo de `price-lists`, la lógica de la aplicación entera conoce a
  un módulo. El ADR-020 pide que el núcleo ofrezca puntos de enganche con nombre y no conozca a quien
  se engancha.
- **Propuesta:** un punto de enganche de la plataforma («paneles que siguen abiertos entre pantallas»)
  donde `price-lists` registra el suyo desde su `index.ts`. El shell no sabe de listas.

### 6.4 Detalles de nombres del código de hoy — **Mejora**

- El evento es `users.permissions-changed`, no `permissions.changed`, y un tema no lo «escucha»: lo
  declara en `recheckOn` (`realtime/topics.ts`).
- El ADR-021 dice que el lector «se guarda como texto en la base, con su versión», y `readers` no tiene
  versión.
- `rules/check.ts` y `rules/deduce.ts` sin tecnología está bien; `reading/automatic.ts` es regla de
  negocio (R5.3) y conviene que tampoco importe SheetJS ni QuickJS, para probarla sin el hilo.

---

## 7. Sin conexión, hora y escala

### 7.1 El canal del avance no está en mobile-data.md — **Frena** (se arregla rápido)

- **Dónde:** § 6, el tema `price-lists.list` en la forma `temporary`.
- **Qué veo:** la constitución, III, pide anotar antes en [mobile-data.md](../mobile-data.md) todo pedido
  que la aplicación haga sola, con lo que pesa, y que lo apruebe Carlos. El canal se abre solo mientras
  hay una lista leyéndose o aplicándose, con su latido de 40 s, y con el vínculo también en el celular
  (E08). Los otros canales `temporary` (el QR, Quién hizo qué) están en esa tabla.
- **Qué hace falta:** su fila: cuándo se abre, cuánto pesa cada aviso (unos 80 bytes, a lo sumo 4 por
  segundo: hasta 1 KB por segundo de lectura) y cuánto dura (una lectura de 10 s, una aplicación de
  30 s).

### 7.2 Sin conexión y la hora — en una línea

El capítulo no trabaja sin conexión (R1.5) y no lo necesita: la constitución, IV, no nombra las listas.
Las horas las pone el servidor; solo falta la fecha del día en la zona del negocio (1.9).

### 7.3 Escala — **Mejora**

- **El volumen de la auditoría:** el ADR-004 cuenta unos 2.000 eventos por día. Con la inflación casi
  todos los costos cambian en cada lista: con 20 proveedores de 5.000 artículos y una lista por semana,
  son unos 100.000 eventos por semana (unos 14.000 por día), siete veces lo previsto. Opción: un evento
  por lista con los cambios de todos los artículos comprimidos juntos, y un dato afectado por producto
  (la tabla `targets` es chica por fila). Así la historia del costo se sigue leyendo por producto. Sea
  cual sea, conviene corregir el número del ADR-004.
- **«Aplicándose» al arrancar** vuelve a «en espera»: con dos copias del servidor, una copia que arranca
  devolvería a «en espera» una lista que la otra está aplicando. Alternativa sin ese problema: que la
  transacción de aplicar trabe la fila de la lista (`for update`), y que quien llega segundo pruebe con
  `for update nowait` y conteste `409 list-applying` si está trabada. El estado vuelve solo si la
  transacción se corta, sin arreglo al arrancar. El avance a los demás sigue saliendo de la memoria.
- **Las anomalías abiertas en memoria** (el número de la cabecera) se suman y se restan al abrir y
  cerrar: tiene que ser después de confirmar, y es una cosa más en memoria que hay que sumar a «Escala»
  en la arquitectura.
- **Los 2 hilos** son por proceso; con varias copias, cada una tiene los suyos. No es un problema; vale
  una línea en la arquitectura.
- **Hasta 100 personas:** las 4 lecturas por persona y los 10 por minuto alcanzan. Con 2.2 resuelto, no
  veo nada más que no escale.

---

## 8. Mejoras y decisiones

### 8.1 Las tareas — **Mejora**

- **Falta el código común como tarea propia**, que se toma antes (constitución, «Trabajo en paralelo»):
  `src/shared/pricing/cost.ts`, la clave de búsqueda de `src/shared/text/` (4.1),
  `src/server/platform/upload.ts` y `download.ts`, `src/app/platform/server/upload.ts` y el punto de
  enganche de 6.3. Hoy están repartidos entre la 2 y la 7. El diseño de 06 lo puso como su tarea 1.
- **La medida de lectura va primero**, no última: la 11 (performance con 10.000 filas) decide entre las
  opciones de 2.1 y confirma los números del ADR-021. Una medida mínima al empezar la 6, y la prueba
  completa con la 8.
- **Faltan los documentos:** el glosario (3.1), [mobile-data.md](../mobile-data.md) (7.1), la arquitectura
  («Escala», «Los datos» si los archivos van a un volumen), el plan (6.2), el diseño de 06 en lo que
  suma de anomalías, y [qué necesita internet](../../chapters/what-needs-internet.md) si cambia algo.
- **Las pruebas antes que el código:** cada tarea arranca con las pruebas de sus escenarios fallando
  (constitución, VII); conviene decirlo, como en 06.
- **Las pruebas de punta a punta** se justifican ante Carlos antes de escribirlas (CLAUDE.md): el § 10 no
  nombra ninguna. Si E08 (el avance en el otro dispositivo) o E39 necesitan una, decirlo.
- **Los tiempos en las pruebas:** E53 con 5 s de tope haría lentas las unitarias (meta de 30 s); los topes
  bajan en las pruebas desde `settings.ts`.
- **El código que corre en QuickJS** (los lectores de un programador, la plantilla automática): si se
  prueba en V8 para la cobertura y corre en QuickJS en producción, son dos motores. Conviene que sus
  pruebas corran también en QuickJS, y decir cómo cuenta la cobertura de lo que corre en el hilo.

### 8.2 El contrato del lector — **Frena**

- **Dónde:** § 5, `reading/worker.ts` y `readers/*.js`; ADR-021, «Un lector es código JavaScript».
- **Qué veo:** el lector es la pieza que se va a sumar más veces (un programador, el lector automático
  y, en la etapa b, una IA), y no está escrito qué es: qué funciones exporta, qué recibe (¿el valor de
  la celda, el texto que se ve, los dos?, ¿las celdas combinadas?), qué devuelve, cómo dice «esta fila es
  un título o un renglón de marca» (R5.4: no son filas salteadas), cómo dice «dudo» el automático (E46),
  ni quién detecta el código repetido y la otra moneda. Sin eso, la comprobación de R5.4 («cada fila
  termina como producto o como fila salteada») no se puede programar, y otro agente no reconstruye el
  módulo leyendo `docs/` (constitución, I).
- **Qué hace falta:** una sección «El lector», con su tipo en `src/shared/contracts/price-lists.ts`.
  Una propuesta que además simplifica la comprobación: que el lector no devuelva números sino **dónde
  están** (la hoja, la fila y la columna del código, la descripción, la marca, el precio, el IVA y el
  código de barras de cada producto, y el motivo de cada fila salteada), y que el servidor lea y
  convierta esas celdas. Así «todo precio que devuelve está escrito en la planilla» (E48) se cumple por
  construcción, el lector no puede inventar un número, y cómo se lee un precio escrito como texto
  («$ 2.314,00», «1.234» con punto de miles) está una sola vez en el servidor, no en cada lector. Hoy el
  diseño no dice quién lee un precio con formato argentino ni qué hace con «1.234».

### 8.3 Números grandes en la cuenta del costo — **Mejora**

- **Dónde:** § 1, «Con enteros (millonésimos de peso)»; § 2, `percent` en milésimos.
- **Qué veo:** un costo de $ 10.000.000 en millonésimos es 10¹³, que entra en un `number`. Pero
  multiplicarlo por un descuento en milésimos de por ciento (hasta 100.000) da 10¹⁸, más que lo que un
  `number` guarda sin perder (unos 9·10¹⁵). Además, `pg` devuelve los `bigint` como texto.
- **Propuesta:** decir que `cost.ts` hace la cuenta en `BigInt` (o divide antes de multiplicar, con el
  orden escrito), y cómo viajan los millonésimos en el contrato (texto o número con su tope). Y
  preguntarle a Carlos si los descuentos llevan decimales (2,5 %): el diseño los deja con tres, la
  regla no lo dice.

### 8.4 Qué IVA se quita con «precios con IVA incluido» — **Mejora** (para Carlos)

- **Dónde:** § 1, la cuenta del costo; R3.3 y R3.6.
- **Qué veo:** con IVA incluido, el costo depende del IVA del producto. Si el IVA se cambió a mano
  (E28: 27 %, la lista dice 21 %), ¿se quita el 27 % o el 21 %? Con el 27 %, cambiar el IVA a mano en 07
  cambia el costo; con el 21 %, el costo no coincide con el IVA con que se vende. Ninguna regla lo dice,
  y el diseño tampoco.
- **Propuesta:** preguntárselo a Carlos y escribir la respuesta en R3.3. Lo más simple: se quita el IVA
  que dice la lista (o el de arranque), que es con el que el proveedor armó su precio.

### 8.5 Lo que el diseño acierta y conviene no perder

- La separación entre el artículo de un proveedor y el producto.
- Cada cambio de estado de una lista en una sola sentencia que mira el estado de antes (R6.9, E64).
- El índice único parcial para «una lista viva por proveedor».
- `confirmed` y `expected` como el número que se vio, igual que en 06.
- El archivo una vez por contenido (E63), sea donde sea que se guarde.
- QuickJS dentro del hilo, con topes de memoria y tiempo, y `vm` descartado por la razón correcta.
- El avance por un tema `temporary` con el estado al suscribirse, y las anomalías abiertas por la
  cabecera, sin pedidos nuevos.
