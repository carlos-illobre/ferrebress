# Capítulos

Un capítulo por módulo del negocio, con el mismo nombre que el módulo en el código. El número es
fijo y sigue el orden en que se construye ([roadmap](../project/roadmap.md)); un capítulo nuevo va
al final.

Cada uno tiene `summary.md` (se lee primero), `rules.md` (las reglas vigentes, con sus
escenarios) y `screens.md` (qué se tiene que poder hacer en cada pantalla y qué maqueta de
[docs/design](../design/README.md) vale). Describen el estado actual; la historia está en los
commits.

Los capítulos se escriben de a uno, cuando le toca a su módulo. El analista de negocio parte de
lo que había en el proyecto anterior (la guía de migración), le pregunta a Carlos todo lo que falte y dice qué se tomó, qué
se dejó y qué propone mejorar (constitución, paso 1).

| Capítulo | Qué cubre | Estado |
|---|---|---|
| 00 · La aplicación ([`00-app`](00-app/summary.md)) | El marco, el menú, el teclado, la luz de conexión, la versión nueva, el manual | Reglas aprobadas; sus pantallas se diseñan con el módulo que las necesita |
| 01 · Entrar ([`01-sign-in`](01-sign-in/summary.md)) | Entrar y salir, y el marco vacío al que se llega | Reglas aprobadas; paso 2: pantallas |
| 02 · Personas (`02-users`) | Personas, roles, permisos y sesiones | Por escribir |
| 03 · Celular y computadora (`03-device-link`) | Vincular, espejo, lector de códigos, fotos | Por escribir |
| 04 · Configuración del dispositivo (`04-device-settings`) | Lo que cada persona elige para su dispositivo | Por escribir |
| 05 · Quién hizo qué (`05-audit-log`) | El registro de cada acción y cómo se consulta | Por escribir |
| 06 · Administración (`06-administration`) | Los ajustes para todos y las anomalías | Por escribir |
| 07 · Catálogo (`07-catalog`) | Productos, proveedores, costo, margen, precio, búsqueda, duplicados | Por escribir |
| 08 · Listas de precios (`08-price-lists`) | Subir, revisar y aplicar la lista de un proveedor | Por escribir |
| 09 · Stock (`09-stock`) | Cuánto hay, correcciones y anomalías de stock | Por escribir |
| 10 · Vender (`10-sales`) | Vender, cobrar, ventas del día, corregir, anular, cambio, consultas no satisfechas | Por escribir |
| 11 · Compras (`11-purchases`) | Ingreso de mercadería y pedidos a proveedores | Por escribir |
| 12 · Mejoras y errores (`12-tickets`) | Avisar de un error o pedir una mejora | Por escribir |
| 13 · Clientes (`13-customers`) | Clientes importantes y cuenta corriente | Por escribir |
| 14 · Números del negocio (`14-business-overview`) | Ventas, compras, inventario y cierre de caja | Por escribir |
| 15 · Sin conexión (`15-offline`) | Atender sin internet y lo que llega de alguien dado de baja | Por escribir |
| 16 · Conteos (`16-stock-counts`) | Contar por sector | Por escribir |
| 17 · Procesos (`17-processes`) | Los procesos del negocio, dibujados | Por escribir |

Qué funciona sin internet y qué no, en toda la aplicación: [what-needs-internet.md](what-needs-internet.md).

Los requerimientos no funcionales generales (disponibilidad, seguridad, ambientes, performance)
están en la [constitución](../project/constitution.md) y en [docs/technical](../technical/architecture.md).

## Reglas ya confirmadas de los capítulos que faltan

Carlos ya las confirmó. El analista de negocio de cada capítulo parte de acá y las pasa a su
`rules.md`.

- **02 · Personas:** se arranca con un solo rol, Administrador. La pantalla para crear roles, darles
  permisos y asignarlos a las personas existe desde el principio; cada módulo define solo los
  permisos que justifica.
- **03 · Celular y computadora:** se vinculan con un botón en la computadora, y solo dos
  dispositivos con la misma persona adentro. Vinculados, muestran exactamente la misma pantalla,
  como un control remoto; al desvincularse, cada uno sigue por su lado. La cámara del celular lee
  códigos de barras para la computadora y saca fotos. Lo que se toca en uno se ve en el otro en
  menos de 50 ms. Es un módulo enchufable: ningún otro depende de él (ADR-003).
- **04 · Configuración del dispositivo:** «Instalar en este dispositivo», solo donde el navegador lo
  permite; se desinstala desde el sistema. Cada persona elige el formato de la hora y de la fecha
  (por omisión, los del sistema) y si ve los importes con decimales (por omisión, no). Trabajar sin
  conexión se habilita acá.
- **06 · Administración:** la decide un Administrador y la cumplen todos los dispositivos (la
  configuración, en cambio, la decide cada persona para su dispositivo). Ajustes: el redondeo del
  precio (hoy $1.000), los márgenes rápidos (hoy 300, 200, 100, 50 y 25 %), la zona horaria del
  negocio, y los dos tiempos de la sesión (60 minutos sin uso y 8 horas de tope). Tiene la pantalla
  de anomalías, a la que cada módulo le suma las suyas.
- **07 · Catálogo:** todo producto viene de la lista de precios de un proveedor; no se dan de alta
  productos a mano. El proveedor en uso es el más barato según la última lista de cada proveedor,
  sin límite de días, y se puede cambiar a mano. El precio de venta se guarda junto al producto y
  se recalcula cuando cambia su costo o su margen. Unir duplicados es experimental y chico: una
  sola tabla de equivalencias, que no toca otras tablas.
- **09 · Stock:** la venta nunca se bloquea. Si se vende más de lo que hay, el stock queda en cero y
  la anomalía dice que se vendió algo no inventariado.
- **10 · Vender:** no hay ítem libre: lo que un cliente pide y no está en ninguna lista no se vende y
  queda como consulta no satisfecha. El precio puesto a mano no se redondea ni avisa. Cualquier
  venta se corrige o se anula en cualquier momento, sin plazo, también sin conexión, y cada cambio
  queda en la auditoría.
- **13 · Clientes:** un cliente nuevo no tiene cuenta corriente; se le habilita a mano.
- **15 · Sin conexión:** vale solo para atender clientes y proveedores (ADR-007). Si dos
  dispositivos corrigen la misma venta sin conexión, queda como anomalía para que un Administrador
  elija la válida, y las dos versiones quedan en la auditoría. Lo que llega de una persona dada de
  baja pasa a una pantalla donde un Administrador lo aprueba o lo rechaza.
