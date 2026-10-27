# Constitución de Ferrebress

Lo que no se negocia. Todo capítulo, diseño, tarea y línea de código se revisa contra este
documento; si algo lo contradice, se cambia ese algo o se cambia la constitución con la
aprobación de Carlos.

## Principios

### I. La documentación manda y no depende del código

Lo fijo son las reglas de negocio; el código puede rehacerse en cualquier momento. La
documentación tiene que alcanzar para que alguien que nunca vio el código construya de nuevo
un sistema que cumpla todas las reglas, funcionales y no funcionales.

- **El orden de autoridad.** Ante una diferencia, manda lo de más arriba y se corrige lo de abajo:
  1. Las reglas (`docs/chapters/`).
  2. Las maquetas aprobadas, en cómo se ve y cómo se usa.
  3. El diseño técnico (`docs/technical/`).
  4. Las pruebas, que se escriben desde los escenarios y antes que el código.
  5. El código, que se escribe para pasar las pruebas ya armadas.

  Una prueba nunca se cambia para que pase el código; si una prueba está mal, se corrige contra
  la regla.
- **La documentación principal está en `docs/`, fuera de `src/`.** Si se borra `src/`, no se
  pierde nada del negocio ni del diseño técnico. Dentro de `src/` puede haber documentación que
  ayude a entender el código, nunca una regla que no esté también en `docs/`.
- **Los capítulos (`docs/chapters/`) dicen qué tiene que pasar y nunca cómo está hecho:** no
  nombran archivos, tablas, rutas ni componentes, y no dicen si algo está construido. El diseño
  técnico de cada módulo vive en `docs/technical/modules/`.
- **No se escribe código de un módulo sin sus reglas, sus pantallas y su diseño técnico
  aprobados por Carlos.**
- **Ningún cambio queda solo en el código.** Si otro agente reconstruyera el sistema leyendo solo
  `docs/`, le tiene que salir igual.
- **El estado no se escribe a mano:** sale de las pruebas, que nombran el escenario que cubren.

### II. La vara es el cuaderno y la calculadora

Una pantalla más lenta que anotar en el cuaderno está mal, aunque sea más completa.

- El orden de la pantalla es el orden del mostrador: buscar, precio, cantidad, cobro.
- Nada obligatorio que el cuaderno no tenga: producto, cantidad, precio.
- Se aprende sin manual: cada pantalla se explica sola y su estado vacío dice qué hacer.
- En la computadora todo se opera con teclado; el mouse nunca es la única forma.
- Sin ventanas de confirmación, salvo para lo que no se puede recuperar.
- Los errores van en el lugar, en castellano, y dicen qué hacer.
- Buscar y cambiar un margen responden en menos de 100 ms; lo que tarda muestra su avance.

### III. Una sola aplicación para el celular y la computadora

La funcionalidad es exactamente la misma en los dos; cambia solo la disposición. Hay una sola
versión de cada pantalla, en HTML semántico, y el CSS la acomoda a cada ancho. La estética es lo
que más va a cambiar: se cambia tocando CSS, sin tocar la lógica (ADR-002). En el celular se usa
con una mano y sin desplazarse al costado; en la computadora, con el teclado y aprovechando todo
el ancho.

### IV. El mostrador no para

Atender clientes y proveedores (vender, buscar precios, cobrar, corregir y anular ventas,
recibir mercadería) sigue andando sin internet en el dispositivo que lo tenga habilitado. Lo
hecho sin conexión vive en el dispositivo hasta que el servidor lo confirma, y repetirlo no lo
duplica. La administración y los procesos necesitan conexión. Un dispositivo que no habilitó el
trabajo sin conexión no guarda nada (ADR-007).

### V. La base guarda el presente; la auditoría, la historia

- **PostgreSQL tiene solo el estado actual**, lo más chico posible, para que sea rápido y sus
  copias sean livianas. Lo que deja de valer se borra.
- **Toda acción queda en la auditoría** con quién la hizo, cuándo y qué cambió. La auditoría
  solo recibe filas y no se modifica (ADR-004).
- **Todo número calculado dice de dónde sale**, con los números de origen; la historia de un
  número (precio, stock) se lee de la auditoría.

### VI. La hora es la del servidor

Las fechas y horas las pone siempre el servidor. El reloj de un dispositivo puede estar atrasado
o sin pila: solo se usa como cronómetro. Lo hecho sin conexión toma la hora del servidor más lo
que midió el cronómetro; si eso no se puede saber, lleva la hora del dispositivo con una marca de
«hora no confirmada» (ADR-007).

### VII. Primero la prueba, y «hecho» solo con evidencia

- Cada escenario de un capítulo tiene una prueba que lo nombra (`sales-E05`), escrita antes que
  el código.
- **Las pruebas usan el módulo como lo usa el resto del sistema:** el servidor por su API y su
  fachada, la aplicación por lo que ve y toca la persona. No prueban cómo está hecho por dentro,
  así un refactor no rompe ninguna prueba.
- **Pruebas unitarias rápidas:** todas juntas en menos de 30 segundos, sin Docker.
- **Cobertura del 100 % de líneas y ramas.** Una línea que ninguna prueba necesita, sobra. La
  única excepción es lo que solo habla con el hardware del navegador, en una lista corta que se
  prueba de punta a punta (ADR-005).
- **El código de las pruebas y el de producción es el mismo.** Lo que cambia entre ambientes sale
  del `.env`.
- Las pruebas de punta a punta cubren los caminos principales, en el ancho del celular y en el
  de la computadora.

### VIII. Seguro por defecto

Ni datos de proveedores ni secretos entran en el repositorio. El `.env` lleva solo lo que cambia
entre ambientes, sin valores por omisión. Sin contraseñas: Google en la computadora y la huella
en el celular (ADR-006). Las sesiones se cierran a distancia. Siempre HTTPS. En el servidor la
aplicación corre sin privilegios y no publica más puertos que el de la web. El diseño técnico de
cada módulo tiene su sección «Seguridad».

### IX. Disponibilidad antes que escala, sin cerrarle la puerta a la escala

Hoy son tres personas y unas 200 ventas por día: importa que esté disponible. A futuro puede
ser una ferretería de hasta 100 personas, con su propia instalación. La arquitectura atiende eso
sin cambios de fondo, y lo que no escalaría a varias copias del servidor (sesiones en memoria,
avisos en tiempo real, el archivo de auditoría) queda detrás de una interfaz que se puede cambiar
sin tocar el negocio. La infraestructura no cuesta nada hasta que el sistema esté en producción.

### X. Cada idioma en su lugar, con las palabras del mostrador

- **Código en inglés:** nombres de variables, funciones, tipos, archivos, carpetas, tablas,
  columnas, rutas de la API y sus parámetros. También los nombres de archivos y carpetas de la
  documentación.
- **Castellano en todo lo demás:** el contenido de la documentación, los comentarios, los
  commits, los mensajes de error y los textos de la aplicación.
- **Las palabras del mostrador:** se dice «cuenta corriente» y no «fiado», «lista» y no
  «importación», «costo» y no «precio de compra neto». Cada palabra del negocio tiene una sola
  traducción, la del [glosario](glossary.md); una palabra nueva se agrega ahí antes de usarla.
- En pantallas e historias se nombra el rol, no la persona.

### XI. La documentación describe el presente

- **Lo que decide Carlos se escribe donde corresponde,** como estado actual: una regla, en el
  capítulo que toca; cómo se trabaja, en esta constitución; una decisión técnica, en su ADR. Si
  cambia, se reescribe el texto: no se agregan enmiendas ni se guardan versiones viejas.
- **Sin fechas ni historia.** Cuándo y por qué cambió algo está en los commits, y cada commit
  explica el porqué.
- **El porqué que sigue valiendo sí se escribe:** un ADR dice las opciones descartadas y por qué;
  un capítulo puede decir qué no se hace y por qué, para que nadie lo vuelva a proponer.

### XII. Cómo se escribe el código

En este orden, y ante un empate se mira la siguiente:

1. **Simple:** los nombres de carpetas, archivos, tipos, funciones y variables funcionan como el
   índice de un libro: leyéndolos se sabe dónde está cada cosa. Baja complejidad, funciones
   cortas, un archivo por responsabilidad. Los comentarios dicen el porqué, no el qué.
2. **Rápido, sobre todo en disco y red:** nada de consultas dentro de un bucle (todo en lote),
   una cantidad fija de consultas por pedido, índices para cada búsqueda frecuente, nada que
   consulte la red con un temporizador, y cada módulo de la aplicación se baja recién cuando se
   abre.
3. **Sin repetir:** lo mismo dos veces por la misma razón se junta; solo se repite si eso hace
   más simple o más rápido el código. Lo que usan el servidor y la aplicación (el cálculo de
   precios, la forma de la API) está una sola vez en `src/shared/`.
4. **Menos líneas y declarativo:** entre dos soluciones iguales en lo anterior, la de menos
   líneas. Nunca a costa de que se entienda.

Además:

- **Organizado por funcionalidad, no por capa técnica.** Un módulo tiene el mismo nombre en el
  capítulo, en el servidor y en la aplicación.
- **La regla de negocio nunca está en el mismo archivo que la tecnología.** El archivo de reglas
  no importa el framework web, la base ni el navegador.
- **Patrones solo donde sacan acoplamiento real**, de esta lista: fachada por módulo, estrategia
  donde hay variantes, comando para lo que se manda y se puede repetir, máquina de estados para
  cada proceso con pasos, y eventos dentro del proceso para que un módulo reaccione a otro sin
  conocerlo. Un patrón fuera de la lista necesita un ADR.
- **Los límites se controlan con herramientas** en `pnpm check`, no con la buena voluntad.

## Restricciones técnicas

- **Cada tecnología elegida tiene su ADR**, con las opciones, sus pros y contras, y el porqué.
  Sumar una tecnología nueva (lenguaje, base, biblioteca de peso, servicio) necesita su ADR antes
  de usarla.
- **Un solo servidor y una sola aplicación, todo en TypeScript**, partidos en los mismos módulos
  (ADR-001, ADR-002). Otro lenguaje solo con un ADR que muestre una ventaja que TypeScript no
  da.
- **Una sola base PostgreSQL** con un esquema por módulo; **la auditoría en SQLite**, aparte
  (ADR-004). El esquema cambia con una migración nueva; nunca se edita una aplicada.
- **Equipo del local:** una notebook vieja con internet intermitente, con o sin Bluetooth, y un
  celular Android. El único lector de códigos es la cámara del celular.

## Cómo se trabaja

**Todo se sube directo a `main`**, sin ramas ni pull requests.

### Los capítulos

Cada módulo del negocio es un capítulo en `docs/chapters/`, con un número fijo:

| Archivo | Qué tiene |
|---|---|
| `summary.md` | Una página para entrar rápido: cada regla en una línea, lo que más pesa y lo que falta decidir. Es lo primero que se lee |
| `rules.md` | Las reglas vigentes, con sus escenarios numerados (`E01`, `E02`…) en forma *dado / cuando / entonces*, incluidos los de error, de borde y de seguridad |
| `screens.md` | Qué tiene que poder hacer cada rol en cada pantalla y qué maqueta de `docs/design/mockups/` vale |

`rules.md` tiene siempre lo vigente: cada cambio lo actualiza en el mismo commit. No hay otro
documento de requerimientos (ni `spec.md` ni plantillas de Spec Kit): una regla está en un solo
lugar.

### Los nueve pasos de un módulo

Las pantallas, una por vez: el director de arte crea tres versiones; Carlos las ve y da sus
comentarios; el maquetador construye la maqueta final con lo del director y esos comentarios;
Carlos la evalúa, y si pide cambios vuelve el maquetador, hasta que la aprueba.

**Antes del paso 1, el alcance.** Antes de empezar un módulo, el agente le lista a Carlos todo lo
que abarca, para que evalúe si se puede dividir en módulos más chicos. Se empieza
recién con su respuesta.

Los hace el mismo agente en la misma sesión, en este orden; el código se escribe recién en el
sexto. Solo las revisiones las hace un subagente con el contexto limpio, porque quien diseñó o
programó no puede revisarse.

| Paso | Rol | Qué hace | Deja | Aprueba Carlos |
|---|---|---|---|---|
| 1 | Analista de negocio | Parte de lo que había en el proyecto anterior (la [guía de migración](migration-from-ferre.md)), mientras exista, y le pregunta a Carlos **todo** lo que haga falta para cubrir la funcionalidad completa: cada caso, cada borde, cada error, cada permiso. Dice qué se tomó, qué se descarta por desactualizado y qué propone mejorar. Toda regla o decisión que define Carlos la cuestiona: le ofrece las alternativas mejores que encuentre y las desventajas de aplicarla tal cual. Las preguntas van todas juntas, en tandas, hasta que no quede nada sin respuesta: lo que Carlos no contestó o no quedó claro se vuelve a preguntar | `rules.md` y `summary.md`, con los escenarios | Sí |
| 2 | Director de arte (skill `art-director`), un perfil artístico e innovador | Tres versiones muy distintas de cada pantalla, una pantalla por vez y en el orden en que se usan, funcionando y con sus animaciones, en el visor de maquetas. Carlos elige una antes de pasar a la siguiente. Solo pantallas de este módulo. La interfaz es lo más importante: va antes que todo lo técnico | `docs/design/mockups/<pantalla>/` y `screens.md` | Sí: las ve y da sus comentarios, con los que trabaja el maquetador |
| 2b | Maquetador (agente `mockup-builder`), un desarrollador frontend | Lleva las ideas del director, por exóticas que sean, a la tecnología disponible, y construye la maqueta final: toma como base lo que hizo el director de arte (la variante elegida y lo que Carlos quiera de las otras), le suma las directivas de Carlos y la ajusta a las reglas aprobadas. El director diseña sin límites; el maquetador pone los límites. Nunca modifica lo del director | `docs/design/mockups/<pantalla>/final/` | Sí: la evalúa; si pide cambios, vuelve el maquetador |
| 3 | Arquitecto | Entidades, API, eventos, permisos, conexiones, la sección «Seguridad», las **metas de performance** (consultas por pedido, milisegundos, bytes) y las tareas con sus dependencias; un ADR si hay una decisión técnica | `docs/technical/modules/<module>.md` | — |
| 4 | Revisor del diseño (agente `design-reviewer`) y revisor de seguridad (agente `security-reviewer`), por separado | El primero busca puntos débiles y mejoras al diseño técnico, contra la constitución y las restricciones de Carlos. El segundo lo mira como un atacante: entrar sin permiso, ver o cambiar lo ajeno, lo que entra de afuera, datos personales, abuso, despliegue y dependencias | `docs/technical/modules/<module>-design-review.md` y `<module>-security-review.md` | — |
| 5 | Arquitecto | Corrige el diseño con lo que encontraron los dos revisores y se lo presenta a Carlos | El diseño final | Sí |
| 6 | Desarrollador | Primero las pruebas: una por escenario y las que cuentan las consultas de cada pedido, todas fallando. Después el código que las hace pasar, con cobertura total; `pnpm check` en verde | Pruebas y código | — |
| 7 | Revisor del código (agente `code-reviewer`) y revisor de seguridad (agente `security-reviewer`), por separado | El primero compara el código con las reglas, las pantallas y el diseño. El segundo busca cómo atacarlo y que cada riesgo cubierto tenga una prueba que lo intente. Lo que encuentran se arregla | `docs/technical/modules/<module>-code-review.md` y la sección del código de `<module>-security-review.md` | — |
| 8 | Carlos | Lo prueba en el ambiente de pruebas; los ajustes vuelven al paso que corresponda | — | Sí: cierra el módulo |
| 9 | Redactor | El manual del módulo (la pantalla del manual se diseña en el paso 9 del primer módulo, no antes): capturas, texto para quien atiende la ferretería sin saber de informática y un clip solo si la funcionalidad es lo bastante grande para verla en video | `docs/manual/` y la pantalla del manual | — |

La sección «Seguridad» del diseño contesta siempre: qué datos toca, quién puede hacer cada cosa,
qué entra de afuera y cómo se valida, qué secretos usa y qué queda en la auditoría.

### Qué tamaño tiene un pedido

Los cambios a un módulo ya cerrado no pasan por los nueve pasos. Antes de tocar nada se decide el
tamaño y se le dice a Carlos en una línea:

| Tamaño | Cuándo | Qué hace falta antes del código |
|---|---|---|
| Arreglo | El código no cumple lo que la documentación ya dice | Nada más que anotar la tarea |
| Ajuste | Un color, un texto, el orden de un menú | El documento actualizado; el pedido vale como aprobación |
| Cambio de regla | Una regla nueva o distinta en un capítulo que existe | Pasos 1 y 3 a 5, solo en lo que cambia |
| Cambio de interfaz | Una pantalla que cambia de un modo que Carlos tiene que ver | Paso 2 |
| Funcionalidad nueva | Algo que no existe, que toca más de un capítulo o lleva más de un día | Los nueve pasos |

Ante la duda, vale el más grande.

### Trabajo en paralelo

Varias sesiones pueden trabajar a la vez en módulos distintos. Para que no hagan lo
mismo ni se pisen:

- **Se toma la tarea antes de empezar.** La sesión cambia el estado del módulo en el
  [plan](roadmap.md) a «En curso: paso N», hace commit y sube, **antes de tocar nada
  más**. Si al subir otra sesión ya lo había tomado, el push falla: se trae `main` y se elige otro.
  Al cerrar el módulo, el estado pasa a «Cerrado».
- **Solo se toma un módulo libre cuyos módulos previos estén cerrados** (columna «Depende de» del
  plan). Dos módulos donde uno depende del otro no van a la vez.
- **El código común tiene un dueño por vez.** Cambiar `src/shared/`, `src/server/platform/`,
  `src/app/platform/`, `src/app/ui/` o `src/app/styles/` es una tarea propia del plan, que se toma
  igual que un módulo. Quien lo necesita y no lo tiene, lo anota y espera, o trabaja en otra parte.
- **Los documentos del proyecto** (esta constitución, la arquitectura, los ADR, el plan salvo la
  columna de estado) se tocan como el código común: con la tarea «Documentos del proyecto»
  tomada.
- **En los archivos compartidos cada módulo toca solo lo suyo:** en el
  [glosario](glossary.md), su sección; en [qué necesita internet](../chapters/what-needs-internet.md),
  sus filas. No se editan las líneas de otro módulo.
- **Antes de subir,** siempre: traer `main` (`git pull --rebase`), volver a correr `pnpm check` y
  recién entonces subir.
- **Carlos atiende una cosa por vez:** cada sesión le dice en qué módulo y en qué paso está, al
  principio de cada mensaje.

### Antes de subir

`pnpm check` corre los tipos, los límites de tamaño y complejidad, qué puede importar a qué,
las pruebas unitarias con su cobertura, las dependencias con fallas conocidas y que los enlaces de
la documentación funcionen (ADR-016). No se
sube nada que no lo pase. Las pruebas de punta a punta corren antes de cerrar un módulo.

## Cómo se cambia

Se cambia con la aprobación de Carlos, en el mismo commit que explica por qué.
