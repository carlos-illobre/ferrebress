# Decisiones de Carlos

Lo que Carlos decidió sobre qué tiene que hacer el sistema y cómo se trabaja, por fecha. Una
decisión no se reescribe: si cambia, se agrega una nueva que dice a cuál reemplaza.

Cada decisión se entiende sola. Cuando cambia algo de la primera versión del sistema, dice qué
cambia, sin depender de documentos que no están en este repositorio.

1. **Ferrebress se rehace desde cero, con la documentación primero** (2026-10-26).
   - La documentación es más importante que el código y vive fuera de la carpeta del código: si
     se borra el código, no se pierde nada del negocio.
   - Las reglas se reescriben por capítulo, juntando lo vigente de la primera versión, y Carlos
     aprueba cada capítulo antes de programarlo.
   - Por ahora solo el backend (reemplazada por la 5).
   - Todo se sube directo a `main`.

2. **Un solo servidor partido en módulos, todo en TypeScript** (2026-10-26). La primera versión
   terminó en seis servicios separados y una base por servicio; se reemplaza por un servidor con
   un módulo por capítulo y una sola base, con un esquema por módulo. Todo es un módulo, también
   procesos, quién hizo qué, mejoras y errores y la lectura de listas de proveedores. La API y la
   base, con nombres en inglés (ADR-001).

3. **Cómo se escribe el código** (2026-10-26). Primero la simplicidad, después la performance
   (sobre todo en disco y red), después no repetir código, salvo que repetirlo ayude a lo
   anterior. Entre dos soluciones, la de menos líneas, y lo declarativo antes que lo imperativo.
   Los nombres funcionan como el índice de un libro. Patrones donde bajen el acoplamiento y
   favorezcan la reutilización. La regla de negocio siempre en archivos distintos de la
   tecnología. El código en inglés; la documentación y los comentarios, en castellano. Está en la
   constitución, principios X y XII.

4. **Los sitios de internet se consultan sin pedir permiso** (2026-10-26). El agente consulta lo
   que necesite directamente.

5. **Toda la aplicación, por módulos que se completan de a uno** (2026-10-26). Reemplaza el «por
   ahora solo el backend» de la 1. Cada módulo se construye entero (base, API y pantallas), Carlos
   lo prueba y recién entonces empieza el siguiente. Todo lo de la primera versión, también las
   decisiones técnicas y las reglas, se puede cuestionar para proponer mejoras.

6. **Una sola versión de cada pantalla para el celular y la computadora** (2026-10-26). La
   funcionalidad es la misma; cambia la disposición. HTML semántico, fácil de estilar, y CSS con
   media queries. La estética es lo que más va a cambiar, así que tiene que cambiarse tocando
   solo CSS (ADR-002).
   - Las maquetas salen siempre del director de arte, que hace tres versiones para que Carlos
     elija. Esta vez elige la v2, pero puede cambiar.
   - Excepción: la pantalla de entrada se ve como la de la primera versión, en el celular y en la
     computadora, en una sola pantalla con piezas.

7. **La lectura de listas, en TypeScript** (2026-10-26). Otro lenguaje solo se justifica si da
   algo que TypeScript no da, y acá no es el caso.

8. **Pruebas unitarias rápidas, sin Docker y con cobertura total** (2026-10-26). Lo importante es
   que corran rápido y prueben toda la funcionalidad, para refactorizar sin riesgo. Cobertura del
   100 % de líneas y ramas: una línea que no necesita ninguna prueba, sobra. El código de las
   pruebas y el de producción es idéntico; lo que cambia sale del `.env` (ADR-005).

9. **Nueve pasos por módulo** (2026-10-26): reglas (un analista de negocio que pregunta todo lo
   necesario), pantallas (tres versiones del director de arte, antes que lo técnico), diseño
   técnico, revisión independiente del diseño, diseño final aprobado por Carlos, código, revisión
   independiente del código, prueba de Carlos y manual. Sin controles que frenen cada edición ni
   un estado escrito a mano: un solo `pnpm check` antes de subir, y el estado sale de las pruebas.

10. **Un solo rol para empezar, y cada módulo agrega sus permisos** (2026-10-26). Se arranca con el
    Administrador. La pantalla para crear roles, darles permisos y asignarlos a las personas
    existe desde el principio. Cada módulo define solo los permisos que justifica.

11. **Cómo se entra** (2026-10-26). Sin contraseñas:
    - La computadora entra con una cuenta de Google autorizada.
    - Ya adentro, la computadora puede habilitar un celular de la misma persona para entrar con la
      huella, sin volver a pasar por Google. El celular no entra con Google.
    - Una computadora puede entrar con el celular habilitado y su huella. Si tiene Bluetooth, se
      usa la entrada con el celular que trae el navegador; si no, un QR propio que vence a los 60
      segundos, sirve una vez, muestra en el celular qué computadora lo pide y pide la huella. El
      sistema detecta solo cuál usar (ADR-006).

12. **El celular como periférico de la computadora** (2026-10-26).
    - Se vinculan con un botón en la computadora, y solo dos dispositivos con la misma persona
      adentro.
    - Vinculados, muestran exactamente la misma pantalla, como un control remoto. Al tocar
      «Desvincular», cada uno sigue por su lado.
    - La cámara del celular lee códigos de barras para la computadora y saca fotos.
    - El tiempo real importa: lo que se toca en uno se ve en el otro en menos de 50 ms.
    - Se agrega o se quita como un módulo enchufable: ningún otro módulo depende de él. Se
      replican acciones, no pantallas (ADR-003).

13. **Cuatro formas de conectarse, en un solo módulo genérico** (2026-10-26). Pedidos HTTP
    comunes; avisos continuos (versión nueva, la luz de conexión) que viajan en las respuestas de
    la API sin conexión abierta, priorizando el bajo consumo; canales temporales en tiempo real
    (el QR de entrada, esperar una foto, el avance de una lista) que se abren solo mientras se
    espera; y la conexión directa entre dispositivos, que no pasa por el servidor. Sin WebSocket.
    Tiene que ser fácil sumar formas y casos nuevos sin rediseñar (ADR-003).

14. **Trabajar sin conexión, solo para atender** (2026-10-26). Cada dispositivo tiene un ajuste
    para trabajar sin conexión, y vale solo para atender clientes y proveedores (vender, buscar
    precios, cobrar, corregir y anular ventas, recibir mercadería), para que el negocio no pare en
    una emergencia. Habilitado, baja lo justo para eso. Deshabilitado, no baja nada ni usa
    IndexedDB. Administración y procesos necesitan conexión (ADR-007).

15. **No hay ítem libre** (2026-10-26). Todo producto viene de la lista de precios de un
    proveedor; no se dan de alta productos a mano. Lo que un cliente pide y no está en ninguna
    lista no se vende: queda anotado como consulta no satisfecha. Los productos propios (combos
    armados por la ferretería, con su código y su precio) son una funcionalidad futura, cuando
    haya datos de producción.

16. **El precio puesto a mano no se redondea ni avisa** (2026-10-26). Si se pone a mano, la
    decisión ya está tomada.

17. **Corregir y anular cualquier venta, siempre** (2026-10-26). Cualquier venta, en cualquier
    momento, sin plazo y sin restricciones, también sin conexión, porque es parte de vender. Cada
    cambio queda en la auditoría. Si dos dispositivos corrigen la misma venta sin conexión, queda
    como anomalía para que un Administrador elija la válida, y las dos versiones quedan en la
    auditoría.

18. **El proveedor en uso, sin límite de días** (2026-10-26). Es el más barato según la última
    lista de cada proveedor, y se puede cambiar a mano. No hay un plazo después del cual una lista
    deje de contar.

19. **Un cliente nuevo no tiene cuenta corriente** (2026-10-26). Se le habilita a mano.

20. **La venta nunca se bloquea** (2026-10-26). Al principio el stock real y el registrado no
    coinciden. Si se vende más de lo que hay, el stock queda en cero y la anomalía dice que se
    vendió algo no inventariado.

21. **PostgreSQL guarda el presente; la auditoría, la historia** (2026-10-26). No hace falta que
    «nada se borre»: la base relacional refleja el estado actual, con foco primero en la
    performance y después en el tamaño, para que las copias sean chicas. Toda acción queda en la
    auditoría, que no se modifica ni se borra y no necesita garantías de transacción: va en
    SQLite, aparte (ADR-004). Unir duplicados es una funcionalidad experimental y chica: una sola
    tabla de equivalencias, que no toca otras tablas, por si se termina quitando.

22. **La hora es siempre la del servidor** (2026-10-26). El reloj del celular o de la computadora
    puede estar atrasado o sin pila: solo sirve de cronómetro. Lo hecho sin conexión toma la hora
    del servidor más lo medido por el cronómetro. Si no se puede saber, usa la hora del
    dispositivo con una marca de que puede no ser cierta (ADR-007).

23. **Lo que hace sin conexión alguien dado de baja, lo revisa un Administrador** (2026-10-26).
    Todo lo que llega de una persona dada de baja pasa a una pantalla donde un Administrador lo
    aprueba o lo rechaza. Es muy excepcional y tiene prioridad baja, pero el diseño lo contempla
    desde el principio.

24. **Pensado para crecer hasta 100 personas** (2026-10-26). Hoy son tres, pero a futuro puede
    usarlo una ferretería de hasta 100 personas. Las decisiones de arquitectura tienen que
    contemplar esa escala, aunque no se construya nada para ella todavía.

25. **Las etapas y el orden de los módulos** (2026-10-26). Tres etapas: desarrollo (hasta que estén
    los módulos principales), pruebas reales (el empleado de la ferretería lo usa y se corrige lo
    que reporta; ahí se diseña el plan de copias) y producción (desde ahí, copias de la base). La
    prioridad es acceso, el celular como periférico (para entrar con él y leer códigos), la
    configuración del dispositivo, las listas de precios, las ventas y los proveedores; después el
    resto. Auditoría y administración pueden ir antes si simplifican los módulos siguientes. El
    orden queda en [roadmap.md](roadmap.md).

26. **El manual se escribe módulo a módulo** (2026-10-26). Se abre desde la entrada. Al cerrar cada
    módulo, el último paso es su parte del manual: capturas y texto simple para quien atiende una
    ferretería sin saber de informática. Un clip solo para funcionalidades lo bastante grandes como
    para verlas en video.

27. **Administración y configuración** (2026-10-26). La administración la decide un Administrador y
    la cumplen todos los dispositivos; la configuración la decide cada persona para su
    dispositivo. El redondeo del precio (hoy $1.000) y los márgenes rápidos (hoy 300, 200, 100, 50
    y 25 %) son ajustes de administración. El precio de venta se guarda junto al producto y se
    recalcula cuando cambia su costo o su margen.

28. **Sin ajuste de caché de sesión** (2026-10-26). Con un solo servidor, las sesiones viven en su
    memoria: comprobar una no consulta la base y cerrarla a distancia se nota al instante. No hace
    falta que un Administrador elija cuánto se recuerda una sesión.

29. **Lo de la segunda versión queda para después** (2026-10-26). Factura electrónica de ARCA,
    venta online, licencias para otras ferreterías, buscar un producto por foto, devoluciones con
    saldo a favor y productos propios se anotan como tareas futuras. El diseño no les cierra la
    puerta, pero no se construye nada para ellas.

30. **Las preguntas sin respuesta se vuelven a hacer** (2026-10-26). Si Carlos se olvida de
    contestar algo, o la respuesta no queda clara, el agente vuelve a preguntar. Nada queda
    supuesto.

31. **La primera versión no se nombra en la documentación** (2026-10-26). Se va a borrar cuando
    Ferrebress esté terminado, así que la documentación tiene que entenderse sin ella. Lo único que
    la nombra es la guía de migración, que se borra junto con ella, y el `CLAUDE.md`, que la enlaza.

32. **Toda tecnología elegida tiene su ADR** (2026-10-26), con las opciones, los pros, los contras y
    el porqué: el lenguaje, la base, los contenedores, la puerta de entrada, las bibliotecas y
    dónde corre.

33. **El orden de autoridad** (2026-10-26). Primero mandan las reglas, después las maquetas,
    después el diseño técnico, después las pruebas y por último el código, que se escribe para
    pasar las pruebas ya armadas (constitución, principio I).

34. **Sin `spec.md`** (2026-10-26). Cada módulo tiene un solo documento vivo de reglas
    (`rules.md`), sus pantallas (`screens.md`) y su diseño técnico; la historia de cada cambio va
    en `changes/`. No se usan las plantillas de Spec Kit.
