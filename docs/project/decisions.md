# Decisiones de Carlos

Lo que Carlos decidió sobre qué tiene que hacer el sistema y cómo se trabaja, por fecha. Una
decisión no se reescribe: si cambia, se agrega una nueva que dice a cuál reemplaza.

Esta lista es para lo que vale para todo el proyecto. Las decisiones de un solo módulo, desde la
57, van en su capítulo (`docs/chapters/NN-<module>/decisions.md`), con el prefijo del módulo
(`09-D03`).

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

11. **Cómo se entra** (2026-10-26; precisada por la 35). Sin contraseñas:
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

34. **Sin `spec.md` ni lista aparte de preguntas abiertas** (2026-10-26). Cada módulo tiene un solo documento vivo de reglas
    (`rules.md`), sus pantallas (`screens.md`) y su diseño técnico; la historia de cada cambio va
    en `changes/`. No se usan las plantillas de Spec Kit. Lo que falta decidir de un módulo está en
    su `summary.md`, no en una lista general: las preguntas se hacen hasta que se contestan
    (decisión 30).

35. **Google también en el celular** (2026-10-26). Precisa la 11, que lo había sacado por un
    malentendido. Solo entran cuentas de Google autorizadas por un Administrador, y cada una puede
    entrar así:
    - **En el celular:** con Google, o con la huella si el celular está vinculado a esa cuenta.
    - **En la computadora:** con Google, o con la huella del celular: se lee con el celular el QR
      de la computadora y se pone la huella en el celular.

36. **El teclado, rehecho** (2026-10-26). El teclado de la primera versión estaba mal elegido; se
    diseña de nuevo y se agrega a las pantallas sin invadirlas. Vale solo en la computadora:
    - **Dos focos.** El cursor, que se mueve solo con Tab o con el mouse y arranca siempre en la caja
      de texto principal de la pantalla; y la marca, que se mueve con las flechas y nunca mueve el
      cursor.
    - **Las flechas.** ← → recorren las pestañas de la parte (el submenú) y llegan al menú; ↑ ↓
      recorren el menú y los renglones de listas y grillas. Con el cursor en una caja con texto, ←
      sale hacia el submenú solo si el cursor está al principio del texto (o la caja está vacía), y →
      solo si está al final; si no, mueven el cursor dentro del texto.
    - **La marca** se ve igual en todas las pantallas; aparece al usar una flecha y se esconde al
      usar el mouse.
    - **Enter** abre o activa lo marcado; en la caja principal, hace la acción principal de la
      pantalla. **Esc** cierra lo que está encima.
    - **Atajos:** todo botón tiene una tecla, de preferencia una letra de su nombre; si no está
      libre, un número. Se usan manteniendo apretado Alt; las teclas se ven sobre los botones solo
      mientras Alt está apretado. Valen solo en la pantalla que se ve: dos pantallas pueden usar la
      misma tecla. Sin teclas de función.
    - **En el celular** el cursor nunca arranca en una caja de texto, para que no se abra el
      teclado.

37. **Dos formas de cada texto** (2026-10-26). Cada texto de la pantalla tiene una forma larga, que
    explica cómo funciona, y una corta, para quien ya sabe usarla. La computadora usa la larga; el
    celular y los anchos chicos, la corta.

38. **El marco y el menú** (2026-10-26). El menú es Vender · Catálogo · Depósito · Negocio · Más.
    Depósito tiene Stock · Compras · Contar; Negocio, Resumen · Usuarios · Quién hizo qué; Más,
    Anomalías, Procesos, Mejoras y errores, Configuración, Administración y Manual. Lo que todavía
    no existe se muestra con «Pronto». Al entrar se abre siempre la primera opción del menú. Nada se
    recuerda de una vez a la otra: ni la última parte usada ni cómo quedó el menú.

39. **Sin conexión, la pantalla lo dice** (2026-10-26). La luz de conexión dice si está en línea,
    sin conexión o enviando, y cuánto hay por enviar; al tocarla muestra el detalle de lo pendiente.
    Sin conexión, lo que no puede andar se pone gris, dice «Sin conexión» y solo deja salir. Si el
    dispositivo trabaja sin conexión, atender clientes y proveedores sigue andando.

40. **La versión nueva** (2026-10-26). Recién abierta, la aplicación se actualiza sola. Si se está
    usando, avisa y no se recarga sola; el aviso tiene «Actualizar» y se puede cerrar sin
    actualizar, y no vuelve a aparecer hasta la próxima vez que se abra, que se actualiza sola. Si
    el servidor ya no entiende la versión vieja, la aplicación se bloquea con un solo botón:
    «Actualizar».

41. **El manual, también adentro** (2026-10-26). Se abre desde la entrada de la computadora y desde
    Más → Manual; en el celular, solo desde Más → Manual. Arriba se elige el dispositivo
    (Computadora o Celular) y tiene buscador. Los capítulos que faltan dicen «pronto».

42. **Un documento dice qué necesita internet** (2026-10-26). Un solo lugar dice qué funciona sin
    conexión y qué no, y se mantiene al día con cada módulo.

43. **Lo que decide el director de arte** (2026-10-26). El tamaño de la letra, cuándo se confirma
    algo y cómo se muestra de dónde sale un número. Lo obligatorio es que todo número calculado deje
    ver su cálculo fácilmente desde la misma pantalla.

44. **Pantallas y navegadores** (2026-10-26). La aplicación se adapta a cualquier tamaño de pantalla
    o, al menos, a los más comunes. Chrome y Firefox en la computadora, Chrome en Android. iPhone y
    modo oscuro, mucho más adelante.

45. **El ambiente de pruebas** (2026-10-26). Se distingue con un marco magenta fijo y el cartel
    «Ambiente de prueba · nada de esto es real». La aplicación y el servidor se sirven desde la
    misma dirección: `ferrebress-pruebas.duckdns.org` para pruebas y `ferrebress.duckdns.org` para
    producción.

46. **Las esperas y las búsquedas** (2026-10-26). Lo que responde en menos de 300 ms no muestra
    nada; pasado ese tiempo, una marca de espera en lo que se tocó; pasados 2 segundos, una barra
    que dice qué está haciendo. Toda búsqueda espera 150 ms sin tipear antes de buscar y cancela la
    búsqueda anterior.

47. **Instalar la aplicación** (2026-10-26). Configuración tiene «Instalar en este dispositivo»,
    solo donde el navegador lo permite. Se desinstala desde el sistema.

48. **Cómo se ven la hora y los importes** (2026-10-26). Cada persona elige en Configuración su zona
    horaria y su formato; por omisión, los del sistema. El día del negocio («las ventas de hoy», el
    cierre de caja) es uno solo para todos y lo fija un Administrador. Los importes van con «AR$» y,
    por omisión, sin decimales; cada persona puede elegir verlos. Las cantidades, siempre con su
    unidad.

49. **Si algo falla** (2026-10-26). La aplicación muestra «Algo salió mal» con un botón para
    avisarlo, que se conecta con Mejoras y errores cuando exista ese módulo. Más adelante se van a
    sumar ideas de las versiones v3 y v4 de las maquetas.

50. **Cada regla de Carlos se analiza en busca de mejoras** (2026-10-26). Toda decisión o regla
    que Carlos formula, el agente la analiza y, si encuentra una opción superadora, se la ofrece
    con sus pros y contras. Carlos decide.

51. **«Pronto» solo en pruebas** (2026-10-26). En el ambiente de pruebas, lo que todavía no existe
    aparece en el menú y en el manual con «Pronto»; en producción no aparece hasta que existe.
    Precisa la 38 y la 41.

52. **Sin conexión, se lee pero no se toca** (2026-10-26). Lo gris sigue legible: se puede mirar lo
    que ya estaba en pantalla, pero no cambiar nada. Precisa la 39.

53. **La versión nueva se aplica en segundo plano** (2026-10-26). Si la aplicación pasa a segundo
    plano con una versión nueva esperando y nada a medio hacer, se actualiza sola. Precisa la 40.

54. **Los importes con «$»** (2026-10-26). Reemplaza el «AR$» de la 48. Más adelante habrá
    productos en dólares; cómo se muestran se resuelve entonces (tarea T108).

55. **La zona horaria la fija un Administrador** (2026-10-26). Reemplaza la zona horaria por
    persona de la 48: la hora se muestra en la zona del negocio, igual para todos. Cada persona
    elige solo el formato de la hora y de la fecha.

56. **El aviso de «Algo salió mal» lleva captura y últimos pasos** (2026-10-26), sin datos de
    clientes ni la sesión de la persona. Precisa la 49.

57. **Varias sesiones a la vez, sin pisarse** (2026-10-26). Varias sesiones pueden trabajar en
    módulos distintos al mismo tiempo, con las reglas de la constitución («Trabajo en paralelo»):
    cada módulo se toma en el plan antes de empezar, solo se toman módulos cuyos previos están
    cerrados, el código común tiene un dueño por vez, las decisiones de cada módulo van en su
    capítulo con el prefijo del módulo, y en los archivos compartidos cada módulo toca solo lo suyo.
    Desde acá, esta lista es solo para lo que vale para todo el proyecto.

58. **Acceso se parte en dos módulos** (2026-10-26). Para ver algo funcionando cuanto antes, el
    primer módulo es solo entrar y salir (01 · `sign-in`), con la base y el marco vacío; el primer
    Administrador sale del `.env`. Personas, roles, permisos y sesiones van en el 02 (`users`).
    Los demás módulos se corren un lugar.

59. **Antes de cada módulo, su alcance** (2026-10-26). Antes de empezar a trabajar en un módulo,
    el agente le lista a Carlos todo lo que abarca, para que evalúe si se puede dividir.

60. **Sesiones propias que vencen a las 8 horas** (2026-10-27). La sesión es un pase propio sin
    datos, guardado en el servidor y en una cookie protegida; no JWT (ADR-015). Vence a las 8 horas
    por omisión, y un Administrador puede cambiar ese tiempo desde Administración.

61. **La sesión vence a los 60 minutos sin uso** (2026-10-27). Precisa la 60: el tiempo se cuenta
    desde el último uso, no desde que se entró, y por omisión es de 60 minutos. Un Administrador
    lo cambia desde Administración.

62. **La sesión tiene un tope de 8 horas** (2026-10-27). Además de vencer a los 60 minutos sin
    uso, vence a las 8 horas de haber entrado, aunque se esté usando. Un Administrador lo cambia
    desde Administración. Solo cuentan como uso los pedidos al servidor, y lo hecho sin conexión
    se prueba con el pase de quien lo hizo (ADR-015).

63. **El menú a la izquierda, por ahora** (2026-10-27). En la computadora el menú va a la izquierda,
    con un botón para minimizarlo a solo íconos. No es una regla que limite al director de arte:
    es la elección de hoy, y puede cambiar si propone algo mejor.

64. **El director de arte diseña sin límites; el maquetador los pone** (2026-10-27). El director de
    arte va más allá de las reglas y no ajusta sus maquetas. El maquetador (agente
    `mockup-builder`) construye la maqueta final: toma como base lo que hizo el director, le suma
    las directivas de Carlos y la ajusta a las reglas aprobadas. Carlos aprueba la final.
