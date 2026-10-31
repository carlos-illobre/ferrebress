# Usuarios · Roles: notas del director de arte

Quien administra ve los roles del negocio y arma cada uno: su nombre, los permisos que da y a
quién se lo da. Tres ideas, cada una en la computadora y en el celular, con el mismo número.
Los datos son ficticios: cuatro roles (Administrador, Encargado de turno, Oficina y personal,
Solo mirar), siete personas, y quien mira es Rubén Paredes, que tiene Administrador.

## Las tres variantes

**1 · El rol y su tarjeta** (`variant-1-card`): la evolución. Es la misma forma que la pantalla
Usuarios aprobada: la lista de roles a la izquierda y la tarjeta del rol elegido a la derecha. En el
celular, la tarjeta entra como página nueva. Cada permiso es un interruptor con su explicación, y
cada cambio se guarda al momento con «Deshacer». Arriba, «Quién puede qué» suma los roles y cuenta
cuántas personas pueden cada cosa. Ideas: 1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 13.

**2 · La grilla** (`variant-2-grid`): la reinvención. Todos los roles a la vez: los permisos son
renglones, los roles son columnas y cada casilla se tilda (en la computadora, con flechas y
Espacio). Los cambios no se guardan uno por uno: se juntan en un borrador, cada casilla tocada queda
marcada en ámbar, y una barra cuenta los cambios y a cuántas personas les llegan. «Ver qué cambia»
muestra lo que había y lo que queda, como lo anota la auditoría, y se guarda todo de una vez.
«Nuevo rol» es una columna vacía al final. Ideas: 1, 3, 4, 5, 10, 11, 14, 15, 16, 17.

**3 · Decilo** (`variant-3-say`): la que nadie se animaría. Cada rol es una frase («Encargado de
turno puede *ver a las personas* y *cortar sesiones y huellas*. Lo tienen *Graciela*, *Lucía*…»), y
cada palabra marcada es una ficha que se saca con un toque o se suma con «+ algo más» o
«+ alguien». Arriba, un campo para escribir o decir el cambio en voz alta («que Pedro también pueda
cortar sesiones»). La pantalla lo convierte en una propuesta y, si hay más de un camino, los muestra
con lo que provoca cada uno («Darle Encargado de turno: solo cambia Pedro» o «Sumarle el permiso a
Oficina y personal: también lo va a poder Nahuel»). También contesta preguntas («¿Quién puede
administrar roles?»). Al costado, «Así lo ve» muestra qué le aparece y qué no a quien tiene ese
rol. Ideas: 3, 4, 5, 7, 13, 18, 19, 20, 21, 22, 23.

## La que prefiero: la 2, La grilla

Los permisos y los roles son pocos y fijos, y lo que la persona necesita es **compararlos**: «¿en
qué se diferencia Encargado de Oficina?». La grilla lo responde de un vistazo, cosa que la lista y la
frase no hacen: hay que abrir los roles de a uno. Además, el borrador con «Ver qué cambia» resuelve
el riesgo real de esta pantalla. Un permiso destildado le llega a varias personas, y antes de
guardar se ve a quiénes y qué queda en la auditoría. Pide la confirmación con Google o la huella una
sola vez para todos los cambios, no una por casilla. En el celular, la grilla tiene que deslizarse
de costado con cinco roles o más, y es lo más flojo que tiene. Si hace falta algo más sencillo para
el celular, la 1 del celular se combina bien con la 2 de la computadora. De la 3 me llevaría a
cualquiera de las otras dos **«Así lo ve»** (idea 21) y **los dos caminos con su efecto**
(idea 20).

## Qué rompe cada una

- **1 · El rol y su tarjeta:** nada de las reglas ni del marco. Guarda cada interruptor al momento
  (con «Deshacer»), como Usuarios.
- **2 · La grilla:** no rompe reglas. Cambia la forma de guardar: los cambios esperan en un
  borrador hasta «Guardar» (en Usuarios todo se guarda al momento). Pide la confirmación de R3.8
  al guardar, si alguno de los cambios da acceso, y no en cada casilla. En el celular la grilla se
  desliza de costado, y «Nuevo rol» es un botón blanco: el naranja queda para «Guardar».
- **3 · Decilo:** rompe el marco. En la computadora no hay menú lateral (una barra arriba con
  «‹ Más», Usuarios · Roles, la conexión y la persona) y en el celular no hay menú de abajo (una ×
  para volver, como los modos de una sola tarea). Suma voz y lenguaje natural, que no están en
  ninguna regla. No usa interruptores ni casillas. Auditoría queda como una pastilla «Pronto» en
  la miga, no como pestaña. Lo oscuro aparece solo mientras escucha.

## Cómo se mueve cada interacción

- **Elegir un rol (1, computadora):** la tarjeta se funde y sube 4 px (200 ms). Se siente que
  cambia el contenido, no la pantalla.
- **Entrar a un rol (1, celular):** la página entra desde la derecha (320 ms), como en el iPhone.
  Se vuelve con «‹ Roles» o deslizando desde el borde.
- **Interruptor:** la bolita cruza con un rebote corto y el renglón se tiñe de pino suave. Es
  firme, como una tecla de luz.
- **Permiso incluido (Ver las personas):** el interruptor queda a media tinta con candado, y debajo
  se lee por qué. Al tocarlo no se mueve.
- **No se puede (sacarse a uno mismo, dejar a alguien sin rol, rol sin permisos):** el elemento se
  sacude 4 px dos veces (240 ms) y el porqué aparece al lado, en rojo. En el celular vibra
  20-30-20 ms. Dice que no sin asustar.
- **Lo que da acceso:** sube «Confirmá que sos vos». El sello late mientras «entra», se vuelve
  tilde verde con vibración doble y la acción sigue sola.
- **Algo nuevo (rol, persona, ficha):** entra desde 8 px abajo con rebote y el borde se pinta de
  verde 1 s.
- **Algo que se va (rol borrado, persona sacada):** se corre 24 px y se desvanece (200 ms), y la
  tostada ofrece «Deshacer».
- **Grilla (2):** la casilla tocada se encoge al 92 % y el tilde aparece con rebote. Lo cambiado
  sin guardar queda con un anillo ámbar y lo guardado se enciende en verde 1 s. La barra de cambios
  sube 16 px con fundido cuando hay algo para guardar.
- **Barras de «Quién puede qué» (1):** se estiran desde la izquierda (320 ms) cuando un cambio
  suma o resta personas.
- **Escuchar (3):** la pantalla se oscurece en pino, las ondas laten, la frase se escribe sola y la
  propuesta entra desde abajo. Es el único momento dramático, porque la tarea lo pide.
- **Ficha (3):** al sacarla se achica y desaparece. Al sumarla brota del 60 % al 108 % y se asienta,
  con el borde verde.
- **Así lo ve (3):** las pestañas que no le aparecen a ese rol se tachan y se achican al 94 %.

Con «reducir movimiento», nada se mueve: los cambios aparecen directo.

## Autocrítica (primera captura contra la segunda)

- **1:** en la primera, el detalle de los permisos se encimaba con las caras y el «Lo tienen
  2 personas» ocupaba media fila. Ahora el detalle se corta con puntos suspensivos, el número va
  solo y más grande, y las barras son de pino en lugar de verde, que es para «salió bien».
- **2:** en la primera, la cabecera de los roles no quedaba fija al bajar (se veían casillas sin
  saber de qué rol) y la fila «Lo tienen» de abajo no entraba en 768 px. Ahora la cabecera queda
  fija, las caras están en la cabecera (tocándolas se ve y se cambia quién lo tiene) y la
  explicación de cada permiso va en un renglón. En el celular, el aviso de «no se puede» quedaba
  tapado por la barra de abajo: ahora flota encima.
- **3:** una coma quedaba sola al principio de un renglón. Ahora cada ficha va pegada a su
  puntuación. Lo que sigue flojo: en el celular la frase de un rol con cuatro personas ocupa media
  pantalla, y el entendimiento de la maqueta solo reconoce las sugerencias y frases parecidas.
- **Las tres:** sin fotos de producto, porque la pantalla no tiene productos. Las personas van con
  sus iniciales, como en Usuarios.

## Catálogo de ideas

| # | Idea | Qué problema resuelve | Variantes | De dónde viene el patrón | Toques que ahorra | ¿Fuera de las reglas? |
|---|---|---|---|---|---|---|
| 1 | **Roles como pestaña de Usuarios**, con «Nuevo rol» como acción principal | Se llega donde ya se administra a las personas | 1, 2 | Configuración de equipos de Linear | 0 | No (R2.1) |
| 2 | **«Quién puede qué»**: por cada permiso, cuántas personas lo pueden, sumando sus roles | Ver de un vistazo si quedó demasiada gente con un permiso fuerte | 1 | Panel de accesos de Google Workspace | Abrir cada rol | Sí, es información nueva |
| 3 | **Permiso incluido atado**: «Ver las personas» se tilda solo y queda con candado y el porqué | Que no se pregunte por qué no se destilda | 1, 2, 3 | Dependencias de permisos de GitHub | — | No (R7.1) |
| 4 | **El porqué al lado**, con sacudón, cuando algo no se puede (sacarse a uno mismo, dejar a alguien sin rol, rol sin permiso, Administrador no se borra) | Entender el límite sin un cartel que tape | 1, 2, 3 | Validaciones en línea de Stripe | 1 (cerrar un cartel) | No (R1.3, R7.3, R7.5) |
| 5 | **Confirmar que sos vos** solo en lo que da acceso, y después sigue sola | Que no se corte la tarea | 1, 2, 3 | Reautenticación de Apple y GitHub | — | No (R3.8) |
| 6 | **Interruptor por permiso con su explicación**, guardado al momento y con «Deshacer» | Cambiar un permiso en un toque, sin «Guardar» | 1 | Ajustes de iOS | 1 (Guardar) | No |
| 7 | **Quiénes lo tienen dentro del rol**: dar y sacar el rol desde ahí | Asignar sin ir persona por persona | 1, 2, 3 | Miembros de un grupo en Slack | 2 o 3 por persona | No (R7.5) |
| 8 | **Puntos de permisos**: cuatro rayitas por rol, llenas las que tiene | Comparar roles en la lista sin abrirlos | 1 | Indicadores de fuerza de una contraseña | — | No |
| 9 | **Lo último que cambió el rol**, al pie («Graciela le sumó… · 12/10») | Saber por qué está como está sin ir a la auditoría | 1, 3 | Historial de Notion | Ir a la auditoría | Sí, adelanta algo de la auditoría |
| 10 | **Grilla de permisos por roles**, con flechas y Espacio | Comparar y cambiar todos los roles a la vez | 2 | Matriz de permisos de Shopify y Linear | La mitad para cambiar varios roles | No |
| 11 | **Borrador con «Ver qué cambia»**: los cambios se juntan, se ven como en la auditoría y se guardan juntos | Ver a quiénes les llega antes de que les llegue | 2 | Revisión de cambios de Figma y Git | Una confirmación por cambio | Sí, cambia cuándo se guarda |
| 12 | **El efecto en personas**: «Vale para Graciela, Lucía, Martín y Sofía desde su próximo pedido» | Darse cuenta de a quién toca un cambio | 1, 2 | Vista previa de Stripe | — | No (R7.6) |
| 13 | **Duplicar abre el rol nuevo con su nombre listo para cambiar** y no guarda hasta aceptar | Armar un rol parecido sin empezar de cero | 1, 2, 3 | «Duplicar» de Notion y Linear | 3 o 4 tildes | No (R7.3, E38) |
| 14 | **Columna «Nuevo rol»** al final de la grilla, con el nombre listo para escribir | Crear sin salir de donde se compara | 2 | Agregar columna en Airtable | 1 (el diálogo) | No |
| 15 | **Casilla tocada con anillo ámbar y rol con «N cambios»** | Saber qué falta guardar | 2 | Archivos modificados de VS Code | — | No |
| 16 | **Borrar como «Se borra al guardar»**, rayado, con «No borrarlo» | Arrepentirse sin perder nada | 2 | Papelera de Gmail | — | No |
| 17 | **Caras en la cabecera de cada rol**: tocarlas abre quiénes lo tienen | Ver y asignar desde la grilla | 2 | Avatares de Google Docs | 1 | No |
| 18 | **Cada rol escrito como frase** con fichas que se tocan | Que alguien poco técnico lo lea como lo diría | 3 | Atajos de Apple, IFTTT | — | Sí, otra forma de la pantalla |
| 19 | **Decirlo o escribirlo**: el cambio en palabras, con mic al pulgar y sugerencias | No buscar dónde se hace: pedirlo | 3 | Siri, búsqueda de Linear | De 4 o 5 a 2 | Sí, voz y lenguaje natural |
| 20 | **Dos caminos con su efecto**: darle otro rol o sumarle el permiso a su rol, con quiénes cambian | Elegir sin dar de más por descuido | 3 | Sugerencias de Google Workspace | — | Sí, es consejo nuevo |
| 21 | **«Así lo ve»**: qué le aparece y qué no a quien tiene ese rol | Entender un permiso por lo que se ve, no por su nombre | 3 | «Ver como» de Facebook y Salesforce | Pedirle a alguien que pruebe | Sí, es información nueva |
| 22 | **Preguntas con respuesta**: «¿Quién puede administrar roles?» | Responder una duda sin recorrer la lista | 3 | Búsqueda de Spotlight | Recorrer todos los roles | Sí |
| 23 | **Sin menú**: pantalla de una sola tarea, con volver arriba | Toda la pantalla para la tarea | 3 | Modos de foco de iOS | — | Sí, rompe el marco |
