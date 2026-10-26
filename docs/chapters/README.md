# Capítulos

Un capítulo por módulo del negocio, con el mismo nombre que el módulo en el código. El número es
fijo y sigue el orden en que se construye ([roadmap](../project/roadmap.md)); un capítulo nuevo va
al final.

Cada uno tiene `summary.md` (se lee primero), `rules.md` (las reglas vigentes, con sus
escenarios), `screens.md` (qué se tiene que poder hacer en cada pantalla y qué maqueta de
[docs/design](../design/README.md) se eligió), `decisions.md` (las decisiones de Carlos que
solo tocan ese módulo, numeradas `NN-D01`, `NN-D02`…) y `changes/` (la historia de sus cambios).

Los capítulos se escriben de a uno, cuando le toca a su módulo. El analista de negocio parte de
lo que había en la primera versión, le pregunta a Carlos todo lo que falte y dice qué se tomó, qué
se dejó y qué propone mejorar (constitución, paso 1).

| Capítulo | Qué cubre | Estado |
|---|---|---|
| 00 · La aplicación ([`00-app`](00-app/summary.md)) | El marco, el menú, el teclado, la luz de conexión, la versión nueva, el manual | Reglas aprobadas; sus pantallas se diseñan con el módulo que las necesita |
| 01 · Entrar (`01-sign-in`) | Entrar y salir, y el marco vacío al que se llega | Paso 1: preguntas a Carlos |
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
