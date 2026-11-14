# Plan del proyecto

Lo previsto, por etapa y por módulo. Cada módulo se construye entero (reglas, pantallas, diseño,
código, pruebas y manual) y se cierra cuando Carlos lo prueba; recién entonces empieza el
siguiente. Este archivo es la fuente de verdad de las tareas: los issues de
GitHub no se usan.

## Etapas

| Etapa | Qué pasa | Termina cuando |
|---|---|---|
| a. Desarrollo | Se construyen los módulos, en el orden de abajo. Hay un solo ambiente: pruebas | Están los módulos principales (hasta Ventas y Compras) |
| b. Pruebas reales | El empleado de la ferretería usa el sistema y se corrige lo que reporta. Se diseña el plan de copias de la base | No queda nada reportado sin resolver |
| c. Producción | Primera versión en producción. Empiezan las copias de la base | — |

## Módulos, en orden

El mismo nombre se usa en el capítulo (`docs/chapters/NN-<module>/`), en el diseño técnico
(`docs/technical/modules/<module>.md`) y en el código (`src/server/modules/<module>/`,
`src/app/modules/<module>/`).

| # | Módulo | Qué cubre | Por qué en este lugar | Depende de | Estado |
|---|---|---|---|---|---|
| 00 | `app` | Las reglas generales de la aplicación: el marco, el menú, el teclado, la conexión, la versión nueva, el manual, las esperas, los formatos | No se construye solo: cada regla se construye con el primer módulo que la necesita | — | Reglas aprobadas |
| 01 | `sign-in` | Entrar (Google en la computadora y en el celular, huella en el celular, entrar a la computadora con el celular) y salir. Con él nace la base: el servidor, la aplicación, el marco vacío al que se llega al entrar y el despliegue al ambiente de pruebas. El primer Administrador sale del `.env` | Sin entrar no hay nada que probar: es lo primero | 00 | Hecho: Carlos lo probó y lo aprobó, con su manual |
| 02 | `users` | En dos etapas. **a. Personas y sesiones:** autorizar, cambiar y dar de baja personas, y cerrar a distancia sus sesiones y quitar sus celulares con huella, todavía con el único rol Administrador. **b. Roles y permisos:** permisos fijos que define cada módulo, roles armados por el negocio, la aplicación y el servidor que respetan los permisos, y las protecciones para no quedarse sin quien administre | La a, para que entre alguien más que el primer Administrador y para resolver un celular perdido; la b, justo después, porque la usan todos los módulos que siguen | a: 01; b: 02a | a: hecha, con su manual en el capítulo «Usuarios»; b: hecha, con su manual en el capítulo «Roles» |
| 03 | `device-link` | En dos etapas. **a. Vínculo y espejo:** vincular el celular y la computadora, la conexión entre los dos (directa por el Wi-Fi, con el servidor de respaldo), el indicador del vínculo, el espejo, desconectar, reconectar y desvincular, cuánto dura y qué lo termina. El vínculo dura 30 días fijos hasta que exista 06, que lo vuelve un ajuste. El mecanismo de conexión es reutilizable: lo usa cualquier funcionalidad futura que reciba datos del servidor sin pedirlos, con el menor consumo de datos posible. **b. Lector de códigos y fotos:** la cámara del celular lee códigos para la computadora y saca fotos que ella pide; la foto de la factura de compra se suma con 11 | La a, para tener el mecanismo de conexión antes de los módulos que lo usan; la b, con el catálogo, que es donde caen los códigos y las fotos | a: 01, 02b; b: 03a, 07a | a: hecha: Carlos la probó y la aprobó, con su manual en el capítulo «Celular y computadora»; b: libre |
| 04 | `device-settings` | En dos etapas, en la misma pantalla (Más → Configuración). **a. Preferencias del dispositivo:** animaciones, formato de la hora, «Instalar en este dispositivo» y «Trabajar sin conexión», que se muda acá desde Más. **b. Lo mío:** mis celulares con huella (verlos, quitar uno y vincular el que se tiene en la mano), mis sesiones en otros dispositivos, cortar mi propio celular perdido y el nombre del dispositivo. El vínculo entre celular y computadora no está acá: va solo en su indicador (03). Los importes con decimales van con el catálogo (07) | Prioridad de Carlos; la usan los módulos siguientes | a: 01, 15a; b: 04a, 02b | a: hecha: Carlos la probó y anda, con su manual en el capítulo «Configuración»; b: hecha: Carlos la probó y anda, con su manual en el capítulo «Configuración» |
| 05 | `audit-log` | La auditoría (lo que hacen las personas): guardarla, con el dato afectado de cada acción, y consultarla en Más → Usuarios → Auditoría. La historia de un dato se muestra con el catálogo (T115) y cuánto se guarda se decide con las copias (T116) | Va antes del catálogo porque lo usan los que siguen: la historia de precios y de stock se lee de acá, y Carlos ve en la auditoría lo que hace cada módulo mientras lo prueba | 01 | Hecho: Carlos lo probó y lo aprobó, con su manual |
| 06 | `administration` | En dos etapas, en Más → Administración. **a. Ajustes para todos:** lo que fija un Administrador y cumplen todos los dispositivos (redondeo, márgenes rápidos, zona horaria, días del vínculo, los tiempos de la sesión). **b. Anomalías:** la pantalla de anomalías, a la que cada módulo le suma las suyas | La a, antes del catálogo, que necesita el redondeo y los márgenes: mejor editarlos de entrada que dejar valores fijos; la b, con el stock, el primer módulo que suma anomalías | a: 02b, 05; b: 06a | a: hecha: Carlos la probó y la aprobó, con su manual en el capítulo «Administración»; b: libre |
| 07 | `catalog` | En tres etapas. **a. Catálogo base:** productos (enteros o fraccionados), proveedores, costo, margen y precio con su cuenta, búsqueda, la ficha del producto y la preferencia de ver los importes con decimales, en Configuración. **b. Código y foto:** el código de barras y la foto del producto, junto con 03b, que usa la misma cámara del celular. **c. Duplicados e historia:** unir en uno el mismo artículo de varios proveedores (sugeridos o a mano) y volver a separarlos, y la historia del precio de un producto (T115) | La base de vender. La a, después de las listas, porque los productos salen solo de ellas; la c, también después de las listas, porque los duplicados aparecen al comparar listas de varios proveedores | a: 08a; b: 07a, 03a; c: 07a, 08a | a: en pausa en el paso 1, hasta cerrar 08a (lo confirmado y las preguntas, en su resumen); b: libre; c: libre |
| 08 | `price-lists` | En dos etapas. **a. La lista a mano:** los proveedores (datos de contacto y cómo cobran: IVA y descuentos), subir el Excel de un proveedor, reconocer de quién es y qué columna es qué, ver qué cambia, aplicarla o descartarla, y el archivo original; aplicar una lista da de alta los productos, les pone o cambia el costo y da de baja los que ya no trae ningún proveedor, que es la única forma de crear productos; los productos de cada proveedor se ven en una lista simple hasta que exista el catálogo. **b. Otros formatos y ofertas:** listas en PDF y las ofertas de un proveedor, que bajan el costo mientras duran. No se reciben listas solas (por correo o por portal) ni hay aviso de qué remarcar: si cambian los precios, se sube la lista nueva | Sin listas no hay productos: va antes del catálogo | a: 06a; b: 08a | a: En curso: paso 1; b: libre |
| 09 | `stock` | Cuánto hay de cada producto, correcciones a mano y las anomalías de stock | Vender lo descuenta | 07, 06b | Libre |
| 10 | `sales` | Vender, cobrar, ventas del día, corregir, anular, cambio de producto, consultas no satisfechas | El corazón del mostrador | 07, 09 | Libre |
| 11 | `purchases` | Ingreso de mercadería y pedidos a proveedores | Atender proveedores | 07, 09 | Libre |
| 12 | `tickets` | Avisar de un error o pedir una mejora | Listo para la etapa de pruebas reales | 01 | Libre |
| 13 | `customers` | Clientes importantes y su cuenta corriente | | 10 | Libre |
| 14 | `business-overview` | Los números del negocio y el cierre de caja | | 10, 11 | Libre |
| 15 | `offline` | En dos etapas. **a. Entrar sin conexión** con la huella del celular (T109). **b. Trabajar sin conexión** al atender clientes y proveedores: lo hecho se guarda en el dispositivo, cifrado, y al volver la conexión el servidor lo revisa; lo que pasa se aplica y lo que no, va a anomalías (T110) | La etapa a, ahora, por pedido de Carlos; la b, desde el módulo 10 todo se programa para poder sumarla sin rehacer nada | a: 01; b: 10, 11 | a: hecha, con su manual en el capítulo «Entrar»; b: libre |
| 16 | `stock-counts` | Contar por sector | | 09 | Libre |
| 17 | `processes` | Los procesos del negocio, dibujados | Muy importante, pero puede ir al final | 02b | Libre |

Se pueden hacer a la vez dos módulos cuando ninguno depende del otro, ni directa ni
indirectamente, y los dos tienen terminados los módulos de los que dependen. Por ejemplo, con 01 cerrado,
pueden ir a la vez 02, 03, 04, 05 y 12. Cómo se trabaja en paralelo está en la
constitución, «Trabajo en paralelo».

## Partes compartidas

Se toman igual que un módulo, cambiando su estado, antes de tocarlas (constitución, «Trabajo en
paralelo»).

| Parte | Qué incluye | Estado |
|---|---|---|
| Código común | `src/shared/`, `src/server/platform/`, `src/app/platform/`, `src/app/ui/`, `src/app/styles/` | Libre |
| Documentos del proyecto | La constitución, la arquitectura y los ADR, este plan (salvo la columna de estado) | Libre |

## Tareas pendientes de la base

- [x] T001 [agente] Traer del proyecto anterior el director de arte (`.claude/skills/art-director/`)
  y el revisor, dividido en dos: `design-reviewer` y `code-reviewer` (`.claude/agents/`).
- [x] T002 [agente] Pasar a `docs/design/` el lenguaje visual «Mostrador», las capturas de la
  pantalla de entrada y las maquetas v2 de cada pantalla.
- [x] T003 [agente] Armar el esqueleto: workspace de pnpm, `pnpm check`, el `.env` de ejemplo, el
  compose (Caddy, servidor, PostgreSQL) y la CI que despliega `main` en el ambiente de pruebas. Va
  en el paso 6 del módulo 01, el primero que se programa: sus límites y su configuración son parte
  de su diseño técnico, que Carlos aprueba antes.
- [x] T004 [carlos] Habilitar GitHub Pages en el repositorio (Settings → Pages → Source: «GitHub
  Actions»), para que se publique el visor de maquetas.
- [ ] T006 [agente] Cuando el último capítulo tenga sus reglas aprobadas, borrar la guía de
  migración y toda mención del proyecto anterior (`CLAUDE.md`, `README.md`, la constitución, el
  índice de capítulos, el roadmap y `docs/design/README.md`).
- [x] T112 [agente] Limpieza para poder extraer lo no funcional a una librería algún día (sin
  crearla): los nombres propios de `platform/` (la cabecera, lo guardado, la base y la caché, los
  ambientes) pasan a configuración, y el límite de pedidos, el valor de un solo uso y la
  auditoría de cada ruta del servidor pasan a un paso común que la ruta declara. Sin cambiar lo
  que hace la aplicación.
- [x] T005 [agente] El revisor de seguridad (`.claude/agents/security-reviewer.md`), en los pasos 4
  y 7 de cada módulo.
- [x] T117 [agente] Revisión del código entero (arreglo y ajuste, sin cambiar lo que se ve): las
  respuestas viejas que pisan a las nuevas (la tarjeta de Usuarios, la auditoría), el service worker
  (no guarda errores, no frena la página nueva), las funciones que se quedaban con datos viejos, las
  hojas de estilo fuera de las capas; en el servidor, un solo paso para anotar un rechazo una vez por
  ventana, una sola tabla de errores, la transacción con lo de después en un solo lugar y las
  consultas de más; en la aplicación, las piezas repetidas (cargar bajo demanda, cargando y
  reintentar, lo angosto, el buscador, la tarjeta, las pastillas) y los valores fuera de los tokens.

- [ ] T121 [agente] Bajar el tiempo de despliegue de ~5 min a ~2 min (análisis del 2026-11-04, sobre 17
  corridas), sin desplegar nada que no pasó el control: (1) construir las imágenes en paralelo con el
  control, con una etiqueta provisoria que `deploy.sh` no busca, y publicarlas con la etiqueta del
  commit recién cuando pasa, en un solo workflow (sale la espera de `workflow_run`); (2) partir
  `pnpm check` en jobs paralelos que llamen a los mismos scripts: los controles rápidos, las unitarias
  en partes con `vitest --shard` y la cobertura juntada al final, y las capturas en el contenedor de
  Playwright; (3) Vitest más rápido en la aplicación (`pool: 'vmThreads'` o `isolate: false`, con el
  riesgo de pruebas que fallan a veces). Antes, `deploy.sh` reintenta al terminar el minuto en vez de
  descartar el aviso. Cambia lo que dicen ADR-014 y ADR-016. Sin costo: el repositorio es público, y
  las máquinas comunes de GitHub (x86 y ARM) no cobran minutos; las más grandes sí, y quedan afuera. Después del 03a, o en paralelo en otra
  sesión (toca la CI, no el vínculo).

- [ ] T122 [agente] El manual en los dos dispositivos (03 · R6.2): que la tarea y el paso viajen al
  otro, cada uno con el contenido de su forma. Hoy el manual escribe en la dirección también qué forma
  muestra, y solo lee la dirección al abrirse: hay que sacar la forma de lo que viaja y que el manual
  siga los cambios de la dirección. Después del 03a.
- [ ] T123 [agente] Que el celular no pida por internet lo que ya trajo la computadora (diseño de 03,
  § 5.3, `forward`): las listas de Usuarios y de Roles y la tarjeta de la persona pasan a
  `useMirroredQuery`. Hoy cada dispositivo pide lo suyo: anda igual, pero el celular gasta datos que
  por el directo se ahorraría. Después del 03a.
- [ ] T124 [agente] El diario del vínculo en «Algo salió mal» y `tools/device-link/replay.ts`, que pasa
  un diario por la máquina de estados (diseño de 03, § 15; revisión del código, 4.13): hoy el diario
  queda en el dispositivo, y para un error que no se puede reproducir es la única pista.
- [ ] T125 [agente] Que `pnpm check` controle que ningún tiempo ni tope se escriba fuera del
  `settings.ts` de su módulo (constitución, XII): hoy es una regla sin herramienta.
- [ ] T126 [agente] La simulación de los dos dispositivos (diseño de 03, § 20) suma cerrar sesiones y
  mira que nada salga sin una confirmación vigente; y el reemplazo al entrar con el celular anota las
  direcciones de las dos computadoras (§ 11.2), que el aviso de la entrada todavía no trae.
- [x] T127 [agente] Que las capturas salgan siempre iguales: la del código del vínculo esperaba el ícono
  de «Volver» en lugar del QR, y el botón de Google tardaba más de 5 s con todas en paralelo.
- [ ] T128 [carlos] Los detalles gráficos de Quién hizo qué con «Actualizar solo» que quedaron
  desprolijos: Carlos los marca cuando quiera verlos.
- [x] T129 [carlos] Decidir ADR-018: que los tipos de las tablas se generen desde las migraciones
  con `kysely-codegen` sobre PGlite, en lugar de escribirlos a mano en cada `data.ts`.
- [x] T130 [agente] Si se acepta ADR-018: `pnpm db:types`, un `tables.generated.ts` por esquema, los
  `data.ts` de `users`, `sign-in` y `device-link` tomando sus tipos de ahí y el control en
  `pnpm check`. Sin cambiar lo que hace la aplicación. Toca código común y tres módulos cerrados: se
  toma «Código común» antes. Depende de T129.
- [ ] T131 [agente] En el paso 3 del catálogo (07), decidir con un ADR si la aplicación pide sus datos
  con TanStack Query (`@tanstack/preact-query`) en lugar del código propio de `platform/` (pedir al
  abrir, `useLatest`, `useMirroredQuery`). A favor: la caché entre pantallas (los productos se ven en
  ventas, compras, stock y listas), marcar como viejo lo que cambió en lugar de corregir la lista a
  mano, las listas por páginas y las búsquedas, y que es conocida; pesa unos 11 KB con gzip. En contra:
  no sabe del espejo entre el celular y la computadora, sus valores de fábrica (reintentos, volver a
  pedir al volver a la ventana) gastan datos y chocan con los límites de pedidos, su caché guardada
  choca con no guardar nada en el dispositivo, y 15b sigue siendo propio. Antes de decidir, una
  prueba chica: una lista con `useQuery` que ande con el espejo (el que sigue recibe por el Wi-Fi) y
  con los avisos por SSE. Si encaja, se usa desde el catálogo y resuelve T123; si no, el catálogo
  suma la caché entre pantallas al código propio. Las pantallas que ya existen no se pasan por esto.

## Tareas futuras

No se construyen ahora; el diseño no les cierra la puerta.

- [ ] T100 [carlos] Factura electrónica de ARCA.
- [ ] T101 [carlos] Venta online, con devoluciones.
- [ ] T102 [carlos] Licencias para otras ferreterías, cada una con su instalación.
- [ ] T103 [carlos] Buscar un producto sacándole una foto.
- [ ] T104 [carlos] Devoluciones con reintegro o saldo a favor.
- [ ] T105 [carlos] Productos propios y combos armados por la ferretería, con su código y su
  precio, cuando haya datos de producción.
- [ ] T106 [carlos] Análisis de los datos guardados (rotación, combos), con una herramienta de
  análisis que lea la auditoría (ADR-004).
- [ ] T108 [carlos] Productos que se venden en dólares: cómo se muestran y se cobran los importes
  en otra moneda.
- [x] T109 [agente] Módulo 15, etapa a (Entrar sin conexión): entrar sin conexión con la huella del
  celular, verificada en el dispositivo con la llave pública guardada; la firma viaja con lo que se
  manda como prueba y el servidor la verifica al volver la conexión. Solo la cuenta vinculada a ese
  celular, solo si en el último contacto el servidor dijo que estaba activa, y como mucho 24 horas
  desde ese contacto. La opción la prende cada persona en su celular, si un Administrador le dio
  permiso.
- [ ] T110 [agente] Módulo 15, etapa b (Trabajar sin conexión), lo que ya decidió Carlos: el sistema
  no frena, revisa. Al volver la conexión el servidor revisa todo: lo que pasa se aplica tal cual,
  con los precios que puso quien vendió (la última palabra la tiene el vendedor, no la aplicación),
  y lo que no pasa va a anomalías para un Administrador. Rechazar una anomalía ajusta el stock o
  deja la diferencia de caja, según corresponda. Lo de alguien dado de baja (también un celular
  robado y denunciado) va a anomalías, diga la hora que diga el celular. Sin conexión, la factura
  se hace a mano con el talonario. Lo guardado en el celular va cifrado con una clave que solo da
  la huella (PRF de la passkey), si no es costoso. Perder lo no enviado (el celular roto o borrado)
  es un riesgo aceptado.
  Cómo se guarda, para el diseño técnico (paso 3): IndexedDB con `idb`, ya elegido en ADR-013, para
  lo bajado (buscar por código y por texto sin cargarlo todo) y para la cola (que un comando quede
  guardado antes de decir «listo», en orden, mandado una sola vez aunque haya dos pestañas, y
  cifrado). Dexie (índices, consultas y avisos cuando algo cambia) se mira solo si `idb` no alcanza
  para buscar en lo bajado. Zustand queda descartado: es estado en memoria, como
  `platform/store.ts`; su `persist` guarda todo el estado como un solo JSON en cada cambio, sin
  índices ni cifrado, rompe lo que no es JSON (la llave de prueba, los bytes cifrados), no es una
  cola y con Preact necesita la capa de compatibilidad de React.
- [ ] T113 [agente] Quién está en línea, en vivo: un punto de color junto a las iniciales de cada
  persona, en la lista y en la tarjeta de Usuarios, en el celular y en la computadora, que cambia
  solo cuando la persona abre o deja la aplicación (el servidor sabe quién la tiene abierta).

- [x] T118 [agente] La auditoría que se actualiza sola (05 · R4.6, R4.12; 03 · R4.5): «Actualizar
  solo», «3 nuevas», la marca de lo que entra y los medidores de lo que manda el servidor por los
  canales. Carlos la probó y anda; los detalles gráficos de la pantalla quedan para T128.
- [ ] T119 [carlos] Avisarle al celular vinculado con la aplicación cerrada (03).
- [ ] T120 [carlos] Usar la huella del celular vinculado para confirmar algo en la computadora (03).
- [ ] T107 [carlos] Plan de copias de la base, en la etapa de pruebas reales.
- [ ] T115 [agente] La historia de un dato (05, con el módulo 07): todo lo que le pasó a una cosa,
  como el precio o el stock de un producto, leído de la auditoría. La auditoría ya guarda el dato
  afectado con su índice; falta la pantalla y su consulta, que se diseñan con un producto real.
- [ ] T116 [carlos] Cuánto se guarda la auditoría (05, con T107): si los años viejos se archivan o
  se borran, y cuándo.
- [ ] T111 [carlos] Probar en el ambiente de pruebas que la sesión vence (01 · R3.1, R3.5). Ya
  probado: vence a los 60 minutos sin usarla. Falta: que vence a las 8 horas desde que se entró, y
  que al volver a entrar se sigue donde se estaba.
