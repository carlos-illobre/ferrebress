# Capítulos

Un capítulo por módulo del negocio, con el mismo nombre que el módulo en el código. El número es
fijo y sigue el orden en que se construye ([roadmap](../project/roadmap.md)); un capítulo nuevo va
al final.

Cada uno tiene `summary.md` (se lee primero), `rules.md` (las reglas vigentes, con sus
escenarios), `screens.md` (qué se tiene que poder hacer en cada pantalla y qué maqueta de
[docs/design](../design/README.md) se eligió) y `changes/` (la historia de sus cambios).

Los capítulos se escriben de a uno, cuando le toca a su módulo. El analista de negocio parte de
lo que había en la primera versión, le pregunta a Carlos todo lo que falte y dice qué se tomó, qué
se dejó y qué propone mejorar (constitución, paso 1).

| Capítulo | Qué cubre | Estado |
|---|---|---|
| 00 · La aplicación (`00-app`) | El marco, el menú, la luz de conexión, la versión nueva, la pantalla del manual | Por escribir |
| 01 · Acceso (`01-access`) | Entrar, sesiones, personas, roles y permisos | Por escribir |
| 02 · Celular y computadora (`02-device-link`) | Vincular, espejo, lector de códigos, fotos | Por escribir |
| 03 · Configuración del dispositivo (`03-device-settings`) | Lo que cada persona elige para su dispositivo | Por escribir |
| 04 · Quién hizo qué (`04-audit-log`) | El registro de cada acción y cómo se consulta | Por escribir |
| 05 · Administración (`05-administration`) | Los ajustes para todos y las anomalías | Por escribir |
| 06 · Catálogo (`06-catalog`) | Productos, proveedores, costo, margen, precio, búsqueda, duplicados | Por escribir |
| 07 · Listas de precios (`07-price-lists`) | Subir, revisar y aplicar la lista de un proveedor | Por escribir |
| 08 · Stock (`08-stock`) | Cuánto hay, correcciones y anomalías de stock | Por escribir |
| 09 · Vender (`09-sales`) | Vender, cobrar, ventas del día, corregir, anular, cambio, consultas no satisfechas | Por escribir |
| 10 · Compras (`10-purchases`) | Ingreso de mercadería y pedidos a proveedores | Por escribir |
| 11 · Mejoras y errores (`11-tickets`) | Avisar de un error o pedir una mejora | Por escribir |
| 12 · Clientes (`12-customers`) | Clientes importantes y cuenta corriente | Por escribir |
| 13 · Números del negocio (`13-business-overview`) | Ventas, compras, inventario y cierre de caja | Por escribir |
| 14 · Sin conexión (`14-offline`) | Atender sin internet y lo que llega de alguien dado de baja | Por escribir |
| 15 · Conteos (`15-stock-counts`) | Contar por sector | Por escribir |
| 16 · Procesos (`16-processes`) | Los procesos del negocio, dibujados | Por escribir |

Los requerimientos no funcionales generales (disponibilidad, seguridad, ambientes, performance)
están en la [constitución](../project/constitution.md) y en [docs/technical](../technical/architecture.md).
