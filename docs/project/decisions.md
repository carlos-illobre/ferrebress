# Decisiones de Carlos

Lo que Carlos decidió sobre qué tiene que hacer el sistema y cómo se trabaja, por fecha. Una
decisión no se reescribe: si cambia, se agrega una nueva que dice a cuál reemplaza.

**Las decisiones 1 a 167 están en `ferre`**
([docs/decisiones-de-negocio.md](https://github.com/carlos-illobre/ferre/blob/master/docs/decisiones-de-negocio.md)).
Los capítulos de este repositorio citan las que siguen valiendo por su número, y dicen cuáles
quedaron reemplazadas. La numeración sigue acá desde la 168.

168. **Ferrebress se rehace en un repositorio nuevo, con la documentación primero** (2026-10-26).
     Carlos pidió empezar limpio en `ferrebress` y usar `ferre` solo para leerlo:
     - La documentación es más importante que el código y vive fuera de la carpeta del código:
       si se borra el código, no se pierde nada del negocio. El código está separado en
       backend y frontend.
     - Las reglas se reescriben por capítulo, juntando lo vigente, y Carlos aprueba cada
       capítulo antes de programarlo.
     - Por ahora solo el backend, de la base de datos a la API REST. El frontend se analiza
       aparte; mientras tanto se corren solo las pruebas unitarias.
     - Todo se sube directo a `main`.

169. **Un solo servidor partido en módulos, todo en TypeScript** (2026-10-26). Reemplaza las
     decisiones 164 y 165 de `ferre` (microservicios por funcionalidad y Auditoría aparte):
     - Un servidor con un módulo por capítulo y una sola base, con un esquema por módulo.
     - Todo es un módulo, también Procesos, Quién hizo qué, Tickets y la lectura de listas de
       proveedores, que pasa de Python a TypeScript.
     - La API REST conserva los conceptos de hoy, traducidos al inglés: rutas y parámetros. La
       base, con tablas y columnas en inglés.

170. **Cómo se escribe el código** (2026-10-26). Carlos fijó las prioridades: primero la
     simplicidad (baja complejidad ciclomática), después la performance (sobre todo en disco y
     red), después no repetir código, salvo que repetirlo ayude a lo anterior. Entre dos
     soluciones, la de menos líneas, y lo declarativo antes que lo imperativo. Cada archivo con
     una sola responsabilidad, código que se explica solo, patrones para bajar el acoplamiento,
     y la regla de negocio siempre en archivos distintos de la tecnología, para poder cambiar
     de framework sin tocarla. El código en inglés; la documentación y los comentarios, en
     castellano. Todos los nombres de archivos y carpetas en inglés, también los de la
     documentación. Está en la constitución, principios IX y XI.

171. **Los sitios de internet se consultan sin pedir permiso** (2026-10-26). Carlos: la regla de
     `ferre` de pedirle permiso antes de abrir un sitio externo quedó desactualizada. El agente
     consulta lo que necesite directamente.

172. **Toda la aplicación, por módulos que se completan de a uno** (2026-10-26). Reemplaza el
     «por ahora solo el backend» de la decisión 168. Cada módulo se construye entero (base, API y
     pantallas), Carlos lo prueba y recién entonces empieza el siguiente. Toda la documentación de
     `ferre`, también los ADR y las reglas, se puede cuestionar para proponer mejoras.

173. **Una sola versión de cada pantalla para el celular y la computadora** (2026-10-26). La
     funcionalidad es la misma; cambia la disposición. HTML semántico, fácil de estilar, y CSS con
     media queries. La estética es lo que más va a cambiar, así que tiene que cambiarse tocando
     solo CSS (ADR-002).
     - Las maquetas salen siempre del director de arte, que hace tres versiones para que Carlos
       elija. Esta vez elige la v2 (https://carlos-illobre.github.io/ferre/pruebas/v2/), pero puede
       cambiar.
     - Excepción: la pantalla de entrada se ve como la actual de `ferre`, en el celular y en la
       computadora, en una sola pantalla con piezas.

174. **La lectura de listas, en TypeScript** (2026-10-26). Confirma la decisión 169: Python solo se
     justifica si da algo que TypeScript no da, y acá no es el caso.

175. **Pruebas unitarias rápidas, sin Docker y con cobertura total** (2026-10-26). Reemplaza la
     parte de la decisión 168 que pedía la capa de datos contra PostgreSQL. Lo importante es que
     corran rápido y prueben toda la funcionalidad, para refactorizar sin riesgo. La base de las
     pruebas es PGlite (PostgreSQL dentro del mismo proceso). Cobertura del 100 % de líneas y
     ramas: una línea que no necesita ninguna prueba, sobra. El código de las pruebas y el de
     producción es idéntico; lo que cambia sale del `.env` (ADR-005).

176. **Nueve pasos por módulo** (2026-10-26). Reemplaza los siete pasos de `ferre`: reglas
     (analista de negocio que pregunta todo lo necesario), pantallas (tres versiones del director
     de arte, antes que lo técnico), diseño técnico, revisión independiente del diseño, diseño
     final aprobado por Carlos, código, revisión independiente del código, prueba de Carlos y
     manual. Sin la compuerta que frena cada edición ni el estado escrito a mano: un solo
     `pnpm check` antes de subir, y el estado sale de las pruebas (constitución, «Cómo se
     trabaja»).

177. **Un solo rol para empezar, y cada módulo agrega sus permisos** (2026-10-26). Reemplaza los
     cinco roles y las 21 claves de la decisión 50 de `ferre`. Se arranca con el Administrador;
     la pantalla para crear roles, darles permisos y asignarlos a las personas existe desde el
     principio. Cada módulo define solo los permisos que justifica.

178. **Cómo se entra** (2026-10-26). Sin contraseñas:
     - La computadora entra con una cuenta de Google autorizada.
     - Ya adentro, la computadora puede habilitar un celular de la misma persona para entrar con
       la huella, sin volver a pasar por Google. El celular no entra con Google.
     - Una computadora puede entrar con el celular habilitado y su huella. Si la computadora tiene
       Bluetooth, se usa la entrada con el celular que trae el navegador (passkeys entre
       dispositivos); si no, un QR propio que vence a los 60 segundos, sirve una vez, muestra en el
       celular qué computadora lo pide y pide la huella. El sistema detecta solo cuál usar
       (ADR-006).

179. **El celular como periférico de la computadora** (2026-10-26).
     - Se vinculan con un botón en la computadora, y solo dos dispositivos con la misma persona
       adentro.
     - Vinculados, muestran exactamente la misma pantalla, como un control remoto. Al tocar
       «Desvincular», cada uno sigue por su lado.
     - La cámara del celular lee códigos de barras para la computadora y saca fotos.
     - El tiempo real importa: lo que se toca en uno se ve en el otro en menos de 50 ms.
     - Se agrega o se quita como un módulo enchufable: ningún otro módulo depende de él. Se
       replican acciones, no pantallas (ADR-003).

180. **Cuatro formas de conectarse, en un solo módulo genérico** (2026-10-26). Pedidos HTTP
     comunes; avisos continuos (versión nueva, la luz de conexión) que viajan en las respuestas de
     la API sin conexión abierta, priorizando el bajo consumo; canales temporales en tiempo real
     (el QR de entrada, esperar una foto, el avance de una lista) que se abren solo mientras se
     espera; y la conexión directa entre dispositivos, que no pasa por el servidor. Sin WebSocket.
     Tiene que ser fácil sumar formas y casos nuevos sin rediseñar (ADR-003).

181. **Trabajar sin conexión, solo para atender** (2026-10-26). Cada dispositivo tiene un ajuste
     para trabajar sin conexión, y vale solo para atender clientes y proveedores (vender, buscar
     precios, cobrar, corregir y anular ventas, recibir mercadería), para que el negocio no pare
     en una emergencia. Habilitado, baja lo justo para eso. Deshabilitado, no baja nada ni usa
     IndexedDB. Administración y procesos necesitan conexión (ADR-007).

182. **No hay ítem libre** (2026-10-26). Reemplaza RF-22 de `ferre`. Todo producto viene de la
     lista de precios de un proveedor; no se dan de alta productos a mano. Lo que un cliente pide
     y no está en ninguna lista no se vende: queda anotado como consulta no satisfecha. Los
     productos propios (combos armados por la ferretería, con su código y su precio) son una
     funcionalidad futura, cuando haya datos de producción.

183. **El precio puesto a mano no se redondea ni avisa** (2026-10-26). Confirma la decisión 132:
     si se pone a mano, la decisión ya está tomada.

184. **Corregir y anular cualquier venta, siempre** (2026-10-26). Reemplaza el plazo de 15 días
     de la decisión 135 y que hiciera falta conexión. Cualquier venta, en cualquier momento, sin
     restricciones, también sin conexión, porque es parte de vender. Cada cambio queda en la
     auditoría. Si dos dispositivos corrigen la misma venta sin conexión, queda como anomalía para
     que un Administrador elija la válida, y las dos versiones quedan en la auditoría.

185. **El proveedor en uso, sin límite de días** (2026-10-26). Es el más barato según la última
     lista de cada proveedor, y se puede cambiar a mano. Se sacan los 120 y 45 días de `ferre`,
     que nadie había decidido.

186. **Un cliente nuevo no tiene cuenta corriente** (2026-10-26). Se le habilita a mano.

187. **La venta nunca se bloquea** (2026-10-26). Confirma RF-59: al principio el stock real y el
     registrado no coinciden. Si se vende más de lo que hay, el stock queda en cero y la anomalía
     dice que se vendió algo no inventariado.

188. **PostgreSQL guarda el presente; la auditoría, la historia** (2026-10-26). Reemplaza «nada se
     borra» (principio V y RNF-30 de `ferre`). La base relacional refleja el estado actual, con
     foco primero en la performance y después en el tamaño, para que las copias sean chicas. Toda
     acción queda en la auditoría, que no se modifica ni se borra y no necesita garantías de
     transacción: va en SQLite, aparte (ADR-004). Unir duplicados es una funcionalidad
     experimental y chica: una sola tabla de equivalencias, que no toca otras tablas, por si se
     termina quitando.

189. **La hora es siempre la del servidor** (2026-10-26). El reloj del celular o de la computadora
     puede estar atrasado o sin pila: solo sirve de cronómetro. Lo hecho sin conexión toma la hora
     del servidor más lo medido por el cronómetro. Si no se puede saber, usa la hora del
     dispositivo con una marca de que puede no ser cierta (ADR-007).

190. **Lo que hace sin conexión alguien dado de baja, lo revisa un Administrador** (2026-10-26).
     Todo lo que llega de una persona dada de baja pasa a una pantalla donde un Administrador lo
     aprueba o lo rechaza. Es muy excepcional y tiene prioridad baja, pero el diseño lo contempla
     desde el principio.

191. **Pensado para crecer hasta 100 personas** (2026-10-26). Hoy son tres, pero a futuro puede
     usarlo una ferretería de hasta 100 personas. Las decisiones de arquitectura tienen que
     contemplar esa escala, aunque no se construya nada para ella todavía.

192. **Las etapas y el orden de los módulos** (2026-10-26). Tres etapas: desarrollo (hasta que
     estén los módulos principales), pruebas reales (el empleado de la ferretería lo usa y se
     corrige lo que reporta; ahí se diseña el plan de copias) y producción (desde ahí, copias de
     la base). La prioridad es acceso, el celular como periférico (para entrar con él y leer
     códigos), la configuración del dispositivo, las listas de precios, las ventas y los
     proveedores; después el resto. El orden queda en [roadmap.md](roadmap.md).

193. **El manual se escribe módulo a módulo** (2026-10-26). Se abre desde la entrada. Al cerrar
     cada módulo, el último paso es su parte del manual: capturas y texto simple para quien
     atiende una ferretería sin saber de informática. Un clip solo para funcionalidades lo bastante
     grandes como para verlas en video.

194. **Administración y configuración** (2026-10-26). La administración la decide un
     Administrador y la cumplen todos los dispositivos; la configuración la decide cada persona
     para su dispositivo. El redondeo del precio (hoy $1.000) y los márgenes rápidos (hoy 300, 200,
     100, 50 y 25 %) pasan a ser ajustes de administración. El precio de venta se guarda junto al
     producto y se recalcula cuando cambia su costo o su margen.

195. **Sin ajuste de caché de sesión** (2026-10-26). Reemplaza las decisiones 146 y 147 de `ferre`
     en lo que toca a la sesión. Con un solo servidor, las sesiones viven en su memoria: comprobar
     una no consulta la base y cerrarla a distancia se nota al instante.

196. **Lo de la segunda versión queda para después** (2026-10-26). Factura electrónica de ARCA,
     venta online, licencias para otras ferreterías, buscar un producto por foto, devoluciones
     con saldo a favor y productos propios se anotan como tareas futuras. El diseño no les cierra
     la puerta, pero no se construye nada para ellas.
