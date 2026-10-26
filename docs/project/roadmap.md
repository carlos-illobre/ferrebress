# Plan del proyecto

Lo previsto, por etapa y por módulo. Cada módulo se construye entero (reglas, pantallas, diseño,
código, pruebas y manual) y se cierra cuando Carlos lo prueba; recién entonces empieza el
siguiente (decisiones 5 y 25). Este archivo es la fuente de verdad de las tareas: los issues de
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
| 00 | `app` | El servidor, la aplicación vacía con su marco y su menú, las piezas del lenguaje visual, las cuatro formas de conectarse (`realtime`), la luz de conexión, la versión nueva y la pantalla del manual | Todo lo demás se apoya en esto | — | En curso: paso 2 (2026-10-26) |
| 01 | `access` | Entrar con Google y con la huella, la entrada a la computadora con el celular, sesiones, personas, roles y permisos | Sin entrar no hay nada | 00 | Libre |
| 02 | `device-link` | Vincular el celular y la computadora, el espejo, el lector de códigos y las fotos | Hace falta para entrar con el celular y para leer los códigos del catálogo | 01 | Libre |
| 03 | `device-settings` | La configuración de cada dispositivo (animaciones, trabajar sin conexión, mis celulares con huella, mi vínculo) | Prioridad de Carlos; la usan los módulos siguientes | 01 | Libre |
| 04 | `audit-log` | Quién hizo qué: guardarlo y consultarlo | Va antes del catálogo porque lo usan los que siguen: la historia de precios y de stock se lee de acá, y Carlos ve en la auditoría lo que hace cada módulo mientras lo prueba | 01 | Libre |
| 05 | `administration` | Los ajustes que fija un Administrador para todos (redondeo, márgenes rápidos, días del vínculo) y la pantalla de anomalías, a la que cada módulo le suma las suyas | El catálogo necesita el redondeo y los márgenes; mejor editarlos de entrada que dejar valores fijos | 01, 04 | Libre |
| 06 | `catalog` | Productos, proveedores, costo, margen, precio, búsqueda, código de barras, foto y duplicados | La base de vender | 05 | Libre |
| 07 | `price-lists` | Subir la lista de un proveedor, ver qué cambia y aplicarla; un lector por proveedor | Todo producto sale de una lista (decisión 15) | 06 | Libre |
| 08 | `stock` | Cuánto hay de cada producto, correcciones a mano y las anomalías de stock | Vender lo descuenta | 06 | Libre |
| 09 | `sales` | Vender, cobrar, ventas del día, corregir, anular, cambio de producto, consultas no satisfechas | El corazón del mostrador | 06, 08 | Libre |
| 10 | `purchases` | Ingreso de mercadería y pedidos a proveedores | Atender proveedores | 06, 08 | Libre |
| 11 | `tickets` | Avisar de un error o pedir una mejora | Listo para la etapa de pruebas reales | 01 | Libre |
| 12 | `customers` | Clientes importantes y su cuenta corriente | | 09 | Libre |
| 13 | `business-overview` | Los números del negocio y el cierre de caja | | 09, 10 | Libre |
| 14 | `offline` | Trabajar sin conexión al atender clientes y proveedores; lo que hace alguien dado de baja pasa a revisión | Desde el módulo 09 todo se programa para poder sumarlo sin rehacer nada | 09, 10 | Libre |
| 15 | `stock-counts` | Contar por sector | | 08 | Libre |
| 16 | `processes` | Los procesos del negocio, dibujados | Muy importante, pero puede ir al final | 01 | Libre |

Se pueden hacer a la vez dos módulos cuando ninguno depende del otro, ni directa ni
indirectamente, y los dos tienen terminados los módulos de los que dependen. Por ejemplo, con 01 y
04 cerrados, pueden ir a la vez 02, 03, 05, 11 y 16. Cómo se trabaja en paralelo está en la
constitución, «Trabajo en paralelo».

## Partes compartidas

Se toman igual que un módulo, cambiando su estado, antes de tocarlas (constitución, «Trabajo en
paralelo»).

| Parte | Qué incluye | Estado |
|---|---|---|
| Código común | `src/shared/`, `src/server/platform/`, `src/app/platform/`, `src/app/ui/`, `src/app/styles/` | Libre |
| Documentos del proyecto | La constitución, las decisiones generales, la arquitectura y los ADR, este plan (salvo la columna de estado) | Libre |

## Tareas pendientes de la base

- [x] T001 [agente] Traer de la primera versión el director de arte (`.claude/skills/art-director/`)
  y el revisor, dividido en dos: `design-reviewer` y `code-reviewer` (`.claude/agents/`).
- [x] T002 [agente] Pasar a `docs/design/` el lenguaje visual «Mostrador», las capturas de la
  pantalla de entrada y las maquetas v2 de cada pantalla.
- [ ] T003 [agente] Armar el esqueleto: workspace de pnpm, `pnpm check`, el `.env` de ejemplo, el
  compose (Caddy, servidor, PostgreSQL) y la CI que despliega `main` en el ambiente de pruebas. Va
  en el paso 6 del módulo 00: sus límites y su configuración son parte del diseño técnico de ese
  módulo, que Carlos aprueba antes. Hasta entonces no hay `pnpm check`.

## Tareas futuras

No se construyen ahora; el diseño no les cierra la puerta (decisión 29).

- [ ] T100 [carlos] Factura electrónica de ARCA.
- [ ] T101 [carlos] Venta online, con devoluciones.
- [ ] T102 [carlos] Licencias para otras ferreterías, cada una con su instalación.
- [ ] T103 [carlos] Buscar un producto sacándole una foto.
- [ ] T104 [carlos] Devoluciones con reintegro o saldo a favor.
- [ ] T105 [carlos] Productos propios y combos armados por la ferretería, con su código y su
  precio, cuando haya datos de producción (decisión 15).
- [ ] T106 [carlos] Análisis de los datos guardados (rotación, combos), con una herramienta de
  análisis que lea la auditoría (ADR-004).
- [ ] T108 [carlos] Productos que se venden en dólares: cómo se muestran y se cobran los importes
  en otra moneda (decisión 54).
- [ ] T107 [carlos] Plan de copias de la base, en la etapa de pruebas reales (decisión 25).
