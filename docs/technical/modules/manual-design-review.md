# Revisión del diseño · 00 · El manual (`manual`)

Revisión del paso 4 sobre [manual.md](manual.md), contra la constitución, el capítulo 00 (R6, R2,
R4, R7.4, R10), 01 · R7.2 y E39, la arquitectura, los ADR, la maqueta final aprobada
(`docs/design/mockups/manual/final/`) y el código que existe hoy. Cada punto dice dónde está, qué
propone el diseño, qué veo y qué tan grave es.

**Resumen:** el diseño acierta en lo grueso. El contenido va en Markdown fuera del código, el
servidor no participa, las capturas se sacan de la aplicación y nada del manual entra en el
service worker. Pero hay doce puntos que frenan la aprobación: cosas que el diseño da por
resueltas y el código de hoy no resuelve (el teclado, la historia, el servidor de mentira, los
íconos), un ciclo entre el armado y las capturas, la versión vieja después de cada despliegue, y
diferencias con la maqueta y con R4.4 y R6.4. Sobre el pedido de Carlos (cambiar fácil el orden de
los capítulos): el formato lo cumple, pero las capturas de referencia lo rompen (punto 13).

---

## Lo que frena la aprobación

### 1. El motor del teclado no hace lo que el diseño le pide (§ 5, «El teclado»)

- **Qué propone:** ← → pasan de paso con el buscador vacío, `/` lleva al buscador, Esc cierra
  «Todos los pasos» o borra lo buscado, «todo con las marcas `data-layer`, `data-key` y `data-mark`
  del motor del teclado».
- **Qué veo:** `src/app/platform/keyboard.ts` no tiene nada de eso. Con el manual encima del marco
  o de la entrada (que también son `data-layer`), `somethingOnTop()` da verdadero. Entonces **←
  llama a `closeTop()`**, que toca el `data-close` de la capa del manual, y → mueve la marca. No hay
  forma de que ← → pasen de paso, `/` no existe en el motor y Esc solo cierra la capa o saca la
  marca, no borra una caja. La regla del archivo es que «las pantallas no escuchan teclas», así que
  el manual tampoco puede resolverlo por su cuenta.
- **Qué falta:** decir qué se agrega al motor y cómo, por ejemplo una marca `data-arrows` para que
  una capa reciba ← → como acciones propias, `data-key="/"` sin Alt para ir a la caja y un
  `data-clear` en la caja para Esc. Ese cambio es de `src/app/platform/`, código común con dueño
  (constitución, «Trabajo en paralelo»), y tiene que ser una tarea propia en § 11. También hay que
  decir que la capa del manual **no** lleva `data-close` en la raíz, porque si no Esc y ← sacan del
  manual, lo contrario de lo que dice la maqueta (`changes.md`, «Esc»).
- **Gravedad:** frena.

### 2. La historia: el router no guarda estado y lo borra al reemplazar (§ 5, «Cómo se abre y cómo se vuelve»)

- **Qué propone:** `navigate('/manual')` guarda en el estado de la historia desde dónde se abrió y
  su nombre. La dirección lleva `?d=…&t=…&p=…`, «Volver» hace `history.back()` y las hojas usan
  `useBackStep`.
- **Qué veo, en `src/app/platform/router.ts`:**
  - `navigate` no acepta estado: llama a `pushState(null, …)` y a `replaceState(null, …)`.
  - `route` lee solo `pathname` y `hash`, no `search`.
  - Si cada cambio de paso sube a la dirección con `pushState`, el botón atrás recorre los pasos y
    no cierra la hoja (contradice el mismo § 5).
  - Si lo hace con `navigate(…, { replace: true })`, pone el estado en `null`. Así se pierde el
    «desde dónde» (y «Volver» pasa a decir «Ir a Ferrebress») y también la marca `step` de
    `useBackStep`. Sin esa marca, la limpieza de `useBackStep` no hace `history.back()`, queda una
    entrada de más, y el `history.back()` de «Volver» cae en otra entrada del manual en vez de
    salir.
  - El diseño tampoco dice qué hace «Volver» con una hoja abierta. Alt O con «Todos los pasos»
    abierto en la computadora, por ejemplo, haría `back()` sobre la entrada de la hoja.
- **Qué falta:**
  - `navigate(path, { state, replace })` en el router, y que el reemplazo conserve el estado.
  - Que cada paso se escriba siempre reemplazando.
  - Que «Volver» primero cierre lo abierto (o retroceda tantas entradas como hojas haya) y después
    salga.
  - El cambio al router es código común y va como tarea propia.
- **Gravedad:** frena. Tal como está, E37 falla.

### 3. Un ciclo entre el armado y las capturas (§ 2, «Cómo se arma», y § 3)

- **Qué propone:** el complemento frena el armado si una captura o un punto no existen. Las
  capturas las saca `tests/manual/capture.ts` con `tests/screens/serve.ts`, que **arma la
  aplicación con Vite** antes de servirla (y `pnpm boot` también la arma).
- **Qué veo:** al escribir un capítulo nuevo que nombra capturas que todavía no se sacaron, el
  armado falla. Sin armado no hay aplicación para sacarlas. El redactor del paso 9 de cada módulo
  se traba siempre.
- **Qué falta:** un modo del complemento para las capturas, por ejemplo `MANUAL_MEDIA=pending`:
  arma sin validar los medios, o directamente sin el manual, porque las capturas no lo muestran. Ese
  modo nunca se usa en `pnpm check` ni en el Dockerfile.
- **Gravedad:** frena.

### 4. La versión vieja después de cada despliegue (§ 4 y § 5)

- **Qué propone:** el código de la pantalla se arma como `assets/manual-[hash].js`, el service
  worker no lo guarda, y los JSON se piden siempre a la red.
- **Qué veo:** cada push despliega el ambiente de pruebas. Un dispositivo que sigue con la versión
  anterior (R5.3: la persona cerró el aviso y sigue usando) tiene una página que nombra el
  `manual-<hash viejo>.js`. Ese archivo ya no está en la imagen nueva y, como nunca se guardó, el
  `import()` falla. Encima, Caddy contesta con `index.html` y estado 200 cualquier archivo que no
  existe (`try_files {path} /index.html`), así que el navegador recibe HTML donde esperaba un
  módulo (y lo mismo con un JSON del manual que falta). Además, aunque el código cargue, el código
  viejo lee el JSON nuevo sin ninguna marca de versión.
- **Qué falta:**
  - Qué ve la persona cuando el código del manual no se puede bajar con red: lo razonable es el
    bloqueo o el aviso de R5 («Actualizar»).
  - Que `/manual/*` y `/assets/*` contesten 404 si el archivo no está, en vez de `index.html`.
  - Una versión en los JSON comparada con `VITE_APP_VERSION`, o nombres con hash que el código
    conoce (un `index-<hash>.json` que el complemento le inyecta al código).
- **Gravedad:** frena.

### 5. El buscador no busca lo que busca la maqueta (§ 2, `search.json`, y § 5, «El buscador»)

- **Qué propone:** `search.json` tiene, por dispositivo, «cada paso y consejo en minúsculas y sin
  tildes, con su capítulo, tarea y número». Elegir un resultado abre esa tarea en ese paso.
- **Qué veo, contra la maqueta aprobada (`content.js`, `search()` y `mark()`), que manda sobre el
  diseño:**
  - **También busca en el título y en la aclaración de cada tarea.** Con el diseño, «mucho tiempo»
    no encuentra «Si pasa mucho tiempo», porque ningún paso ni consejo de esa tarea dice «tiempo».
  - **En pruebas, muestra los capítulos que faltan** cuyo nombre coincide, con «Pronto»
    (`changes.md`, R6.6). `search.json` no los tiene, aunque `index.json` sí.
  - **Muestra una fila por tarea con el fragmento que coincidió y lo buscado resaltado.** Con solo
    el texto en minúsculas y sin tildes no se puede mostrar el fragmento original ni resaltarlo sin
    bajar todos los capítulos.
  - **Busca desde las dos letras**, y si no encuentra dice «No encontré «…»».
  - El diseño cambia a una fila por paso. Puede ser mejor, pero contradice la maqueta: si se quiere,
    se le propone a Carlos. Si no, se hace como la maqueta. Tampoco dice a qué paso lleva un
    consejo: en la maqueta el consejo *i* sale en el paso *i*, y el último se repite en los pasos
    que siguen.
- **Qué falta:** que `search.json` lleve el texto original junto al normalizado, los títulos y las
  aclaraciones, y los nombres de los capítulos que faltan. Y que el diseño diga la forma del
  resultado y el orden de los grupos, que tiene que ser el de `README.md` (pedido de Carlos).
- **Gravedad:** frena.

### 6. «Trabajar sin conexión lleva ahí» (R6.4) no tiene cómo escribirse (§ 2)

- **Qué propone:** cada renglón de la lista es un nombre, un ícono y, si está escrito, su archivo.
  Además, «el texto es solo texto: no hay enlaces».
- **Qué veo:** R6.4 dice que entrar sin conexión se explica en «Entrar» y que «Trabajar sin
  conexión» lleva ahí. El paso 9 del módulo 15 se da por cumplido con «Entrar» (§ 1 del diseño), así
  que «Trabajar sin conexión» no queda en «Pronto»: tiene que llevar a «Entrar · Entrar sin
  internet». Con el formato del diseño no hay forma de escribir un capítulo que lleva a otro.
- **Qué falta:**
  - Una forma de renglón que lleve a otro capítulo, por ejemplo
    `- Trabajar sin conexión · wifi-off · → sign-in.md#<tarea>`.
  - Qué pasa con el dispositivo: «Entrar sin internet» existe solo en el celular, así que hay que
    decir qué muestra con Computadora elegida.
  - Que el complemento valide el destino.
- **Gravedad:** frena (una regla sin cubrir).

### 7. Las tareas no tienen identificador (§ 2 y § 5)

- **Qué propone:** la dirección es `/manual?d=celular&t=p-offline&p=2`.
- **Qué veo:** el formato de Markdown no le da identificador a una tarea (`## Entrar con el
  celular`), así que no se sabe de dónde sale `p-offline`. Si sale del título, cambiar un título
  rompe las direcciones guardadas y los destinos del punto 6. La dirección **tampoco nombra el
  capítulo**, así que con dos capítulos escritos un `t` tiene que ser único en todo el manual, y eso
  no está dicho ni validado. Los capítulos sin archivo tampoco tienen el `id` que pide `index.json`.
- **Qué falta:** decir de dónde sale el identificador de una tarea (por ejemplo, una clave
  `- Id: offline` o la regla para formarlo del título), si la dirección lleva `c=<capítulo>`, y el
  `id` de un capítulo sin archivo. Y que el complemento rechace los repetidos.
- **Gravedad:** frena (no se puede reconstruir solo con el diseño).

### 8. El servidor de mentira no arma los estados de las escenas (§ 3)

- **Qué propone:** las escenas se arman «con respuestas de mentira (sin conexión, con sesión, Más
  abierto)» en `tests/screens/serve.ts`, que contesta `environment: 'production'`.
- **Qué veo:** `serve.ts` contesta siempre lo mismo: `environment: 'testing'`, sin persona y con el
  mismo QR. Si se cambia a `production`, cambian todas las capturas de referencia de hoy, que
  muestran el marco del ambiente de pruebas. Las escenas del capítulo «Entrar» piden estados que
  no son una respuesta, como `phone-offline-finger` y `phone-not-confirmed`: la huella guardada, el
  trabajo sin conexión prendido, la ventana de 24 h y una entrada sin confirmar. Necesitan
  `localStorage`, IndexedDB, una llave de prueba y el reloj. El diseño no dice cómo se arma ninguno.
  Cuando lleguen los módulos que siguen, cada uno necesita respuestas de mentira de toda su API
  (ventas, productos…). Esas respuestas se apartan de la API de verdad sin que nada avise.
- **Qué falta:**
  - Que el ambiente y las respuestas se elijan **por escena** (por ejemplo, con `page.route` de
    Playwright en `capture.ts`, sin tocar `serve.ts`), y cómo se arma cada estado guardado.
  - Que las respuestas de mentira se validen contra los contratos de `src/shared/contracts/`.
  - La alternativa que nombra R6.5 («datos de una cuenta de demostración»): sacarlas del stack de
    Docker de las pruebas de punta a punta, con una base sembrada. Es más real y más lenta. Que el
    arquitecto elija y diga por qué.
- **Gravedad:** frena (sin esto no se puede hacer la tarea 3).

### 9. La entrada sigue andando debajo del manual (§ 5, «Cómo se abre»)

- **Qué propone:** `App` muestra el manual «encima de todo». Debajo queda montado lo que había, la
  entrada o el marco, para volver «donde estaba».
- **Qué veo:** en la computadora sin sesión, la entrada queda montada pero tapada. Su canal del QR
  (`temporary`, un código por minuto) sigue abierto, y la renovación del nonce de Google sigue
  (cada 9 minutos, con unos 60 KB de Google en cada una). ADR-003 dice que el canal se abre «solo
  mientras se espera y la pantalla está a la vista», y `mobile-data.md` no anota este caso.
- **Qué falta:** que, con el manual abierto, la entrada no se muestre (se desmonta y al volver se
  vuelve a pedir lo que necesita) o que se pause. Hay que comparar lo que se pierde: la entrada no
  tiene nada a medio hacer, y volver a montarla cuesta el botón de Google otra vez. El marco sí
  tiene que quedar montado, porque guarda lo que se estaba haciendo (E37, R9.3). El módulo 03, que
  va a mapear direcciones a pantallas, no puede desmontar la pantalla de trabajo cuando la dirección
  es `/manual`. Eso conviene dejarlo escrito como condición.
- **Gravedad:** frena (contradice ADR-003).

### 10. Sin conexión: el diseño abre una página, R4.4 dice gris (§ 4, último punto)

- **Qué propone:** sin conexión, «Ver el manual» y Más → Manual abren igual una pantalla con «El
  manual necesita internet» y «Volver».
- **Qué veo:** R4.4 dice que lo que no puede andar sin conexión «se pone gris y dice «Sin
  conexión»» y no se toca, y R4.6 que vuelve solo. La entrada de la maqueta apaga sus botones sin
  conexión. Abrir una pantalla vacía es otra conducta, y la regla manda. El diseño tampoco dice cómo
  se sabe que no hay conexión (el estado de la luz o el `import()` que falla) ni qué pasa si la
  conexión se corta con el manual abierto: lo cargado se tiene que poder seguir leyendo (R4.4), y
  hay que decir qué ve la persona en una captura que no llegó a bajar.
- **Qué falta:** o Más → Manual y «Ver el manual» en gris con «Sin conexión» (y el texto del
  esqueleto sobra), o preguntarle a Carlos si quiere la excepción. Y la conducta con la conexión
  cortada a mitad de camino.
- **Gravedad:** frena (se contradice con una regla).

### 11. Los íconos del contenido no existen y agregarlos toca código común (§ 2)

- **Qué propone:** cada capítulo y cada tarea nombra un ícono «de los de `ui/icon`», el complemento
  rechaza el que no existe, y «cada módulo agrega su capítulo sin tocar el código».
- **Qué veo:** de los íconos que usa la maqueta, `ui/icon` no tiene `log-in`, `users`, `truck`,
  `list-checks`, `user-round`, `history`, `qr-code`, `cloud-upload`, `circle-check`, `zap`, `info`,
  `search`, `arrow-left` ni `chevron-left`. `Icon.tsx` junta todos los dibujos en un solo objeto, y
  el marco lo importa desde el arranque. Agregar ahí los íconos del manual **engorda el arranque**,
  que tiene un tope de 60 KB (`tools/checks/boot-size.ts`). Además `ui/` es código común con dueño,
  así que cada capítulo con un ícono nuevo **sí** toca el código.
- **Qué falta:** decidir dónde viven los íconos del manual. Hay dos opciones:
  - **a.** Un juego propio en el código del manual, que se baja recién al abrirlo. Cada ícono nuevo
    sigue tocando el código, pero el del manual, no el común.
  - **b.** El complemento pone en el JSON el dibujo de cada ícono, tomado de Lucide, que ya es la
    referencia del lenguaje visual. Así se cumple «sin tocar el código», con una dependencia de
    armado nueva.

  Lo que se elija va en las tareas.
- **Gravedad:** frena.

### 12. Herramientas sin nombrar (§ 2 y § 3)

- **Qué propone:** el complemento «lee Markdown», el programa de capturas guarda WebP y los clips
  son WebM.
- **Qué veo:** Playwright saca capturas en PNG o JPEG, no en WebP. Para convertirlas hace falta algo
  (`sharp`, `cwebp`…), y eso es una dependencia de peso, nativa en el caso de `sharp`. Para el
  Markdown, el diseño no dice si usa una biblioteca (`marked`, `micromark`…) o un lector propio. La
  constitución pide un ADR antes de sumar una biblioteca de peso. Con un formato tan cerrado (claves
  fijas, listas y `>`), alcanza con un lector propio de pocas líneas, sin dependencia, y conviene
  decirlo.
- **Qué falta:** nombrar cada herramienta y, si es de peso, su ADR (o una fila en ADR-013 o
  ADR-005).
- **Gravedad:** frena (no se puede reconstruir sin saberlo, y la regla del ADR es de la
  constitución).

---

## El pedido de Carlos: el orden de los capítulos

### 13. Mover un renglón no alcanza: las capturas de referencia lo rompen (§ 2 y § 10)

- **Qué propone:** «Cambiar el orden es mover un renglón» de `docs/manual/README.md`, sin números
  ni código.
- **Qué veo:**
  - **Lo bueno:** el formato cumple. La lista es una sola, las pruebas unitarias usan un índice de
    prueba (E35) y no dependen del orden de verdad, y el complemento valida la lista.
  - **Lo que falla:** las capturas de referencia del manual (`tests/screens/manual.spec.ts`) corren
    en el ambiente de pruebas, donde el índice muestra *todos* los capítulos con «Pronto». Si sacan
    el contenido de verdad, cada cambio de orden cambia la captura y `pnpm check` (que corre
    `pnpm screens`) falla hasta regenerarla. Mover el renglón deja de ser lo único que hay que
    hacer.
  - El nombre de un capítulo escrito está dos veces, en la lista y en el `# Título` del archivo.
    Puede quedar distinto: que salga de un solo lugar o que el complemento exija que coincidan.
  - El diseño no dice que el complemento rechace **un capítulo que está en `docs/manual/` pero no en
    la lista**. Lo pide el pedido de Carlos: si se borra el renglón al reordenar, el capítulo no
    puede desaparecer en silencio.
  - El orden de los grupos del buscador no está dicho (punto 5).
- **Qué falta:** que las capturas de referencia del manual usen un `docs/manual/` de prueba fijo (o
  que el índice no salga en ellas), las dos validaciones de arriba y el orden de la lista también en
  el buscador. Con eso, el pedido se cumple de verdad: un renglón, sin tocar nada más.
- **Gravedad:** frena, porque es un pedido explícito.

---

## Mejoras

### 14. Performance: los pedidos al abrir y las metas sin control (§ 9)

- **Los pedidos, contados:**
  - **En la computadora, la primera vez:** el código y el estilo de la pantalla (2), `index.json`,
    `sign-in.json` y la primera captura. Son 5 pedidos en cadena: código → índice → capítulo →
    captura.
  - **En la computadora, las veces siguientes:** 3, porque los JSON y la captura son `no-store`.
  - **En el celular, al abrir:** 3. El capítulo y su captura, recién al tocar una tarea.

  El índice y el capítulo se pueden pedir a la vez si la dirección o la lista dicen cuál es el
  primero. Que el diseño lo diga y lo cuente.
- **Las metas sin control:** «menos de 15 KB», «menos de 80 KB», «menos de 1 MB» y «menos de 3 KB»
  no tienen quién las controle. ADR-016 dice que el peso lo controla «un control propio… lo que diga
  el diseño de cada módulo», y la constitución, que los límites van con herramientas. El
  complemento puede rechazar un medio o un JSON pasado de tamaño, y `tools/checks/` puede medir el
  código del manual.
- **Las capturas, de más:** la maqueta tiene `desktop-entrance.webp` a 1100 × 613 con 71,6 KB. A
  1366 × 768 (un 55 % más de puntos) es probable que pase los 80 KB. El celular, al doble de
  definición (780 × 1688, cuatro veces los puntos de las de 374 × 828 de unos 28 KB), también.
  Además, la captura se muestra achicada en el panel de la derecha. No lo medí: propongo sacar la
  captura al tamaño de la pantalla y guardarla al tamaño en que se muestra (y al doble solo donde
  haga falta), con el tope controlado por el complemento.
- **`search.json`:** unos 4 KB por capítulo, de los dos dispositivos, son unos 70 KB con los
  diecisiete. Uno por dispositivo baja la mitad.
- **Gravedad:** mejora. Las metas sin control, casi frena.

### 15. La captura que se pide antes, con `no-store` (§ 9, «Pasar de paso»)

- **Qué propone:** la captura del paso siguiente se pide un paso antes.
- **Qué veo:** con `Cache-Control: no-store`, no pude comprobar que el navegador use la imagen
  pedida antes cuando después la pone el `<img>`. Puede volver a bajarla, y lo mismo al volver un
  paso atrás.
- **Qué propongo:** bajar las capturas de la tarea con `fetch`, guardarlas como `blob:` en la
  memoria de la pantalla y soltarlas al salir. `img-src` ya permite `blob:`, así que no cambia la
  política. La otra opción es dejar montados los `<img>` de la tarea, ocultos. Que el diseño elija
  una y la pruebe.
- **Gravedad:** mejora.

### 16. Los clips (§ 3 y § 5)

- **«Reducir movimiento muestra el último cuadro»:** con `preload="none"` no hay cuadro que mostrar
  sin bajar el video. Falta una imagen del final (`<clip>.end.webp`) que saque el mismo programa y
  que sirva también de `poster`.
- **Los dos videos juntos:** arrancar «juntos» dos `<video>` de dos grabaciones con distinto
  arranque y distinto ritmo de carga es frágil, porque se desfasan. Hay dos opciones:
  - **a.** Grabar una sola página que muestre las dos pantallas.
  - **b.** Componerlos en uno al guardarlos, con una herramienta más (punto 12).

  Si se quedan dos, hay que decir cómo se sincronizan (esperar `canplay` de los dos y arrancarlos a
  la vez).
- **El guion:** falta el guion de la escena del clip, cómo el servidor de mentira encadena el
  código del QR entre los dos contextos. Hoy contesta un código fijo.
- **Gravedad:** mejora. Lo de «reducir movimiento» se contradice con el mismo diseño y conviene
  corregirlo en el paso 5.

### 17. La parte del service worker que nombra al manual (§ 4)

- **Qué propone:** `kindOf` devuelve `skip` para `/assets/manual-`.
- **Qué veo:**
  - `platform/offline/worker.ts` pasaría a saber el nombre de un módulo, cuando `platform/` no
    tiene negocio.
  - Vite nombra los pedazos por el archivo de entrada: un `import()` de
    `screens/Manual/Manual.tsx` sale `assets/Manual-<hash>.js`, no `manual-`. Hace falta configurar
    `chunkFileNames` o `manualChunks`, y el diseño no lo dice.
  - Lo de `/assets/` tiene `Cache-Control: immutable`, así que el código del manual queda igual en
    la caché del navegador. Para E39 («nada del manual ocupa lugar») eso puede no importar, porque
    E39 mira lo que guardó el dispositivo para trabajar sin conexión. Pero R6.8 dice «no se guarda
    en el dispositivo», sin distinguir.
- **Qué propongo, más simple:** armar el código del manual dentro de `/manual/` (por ejemplo
  `manual/app-[hash].js`). `kindOf` ya ignora todo lo que no es `/assets/`, así que **no cambia
  nada del service worker**. El `no-store` de Caddy lo cubre (cumple R6.8 sin dudas), y cuesta bajar
  unos 15 KB más cada vez que se abre.
- **Gravedad:** mejora.

### 18. Caddy: dos `Cache-Control` para lo mismo (§ 4)

- **Qué veo:** hoy `@fresh` (todo lo que no es `/assets/`) pone `no-cache`. Si se agrega
  `/manual/*` con `no-store` y no se lo saca de `@fresh`, quedan dos `header` que valen para el
  mismo pedido, y no pude comprobar cuál gana. Que el diseño diga que `@fresh` excluye
  `/manual/*`, y que `/manual/*` no cae en `try_files … /index.html` (punto 4).
- **El Dockerfile:** hoy no copia `docs/`. El diseño lo dice («copia `docs/manual/` antes de
  armar»), pero conviene aclarar que también va `docs/manual/media/`. No hay `.dockerignore` que lo
  impida.
- **Gravedad:** mejora.

### 19. Dónde vive el complemento y cómo «corre en `pnpm check`» (§ 2)

- **`src/app/build/`:** no está en la arquitectura (`app/` tiene `platform`, `ui`, `styles` y
  `modules`). Es código de Node que lee archivos, y las pruebas de `src/app` corren en `happy-dom`.
  Encaja mejor en `tools/manual/`, en el proyecto de Node de las pruebas, importado por
  `vite.config.ts`.
- **«Lo mismo corre en `pnpm check`»:** no dice con qué comando. Hoy lo correría solo de rebote,
  porque `pnpm boot` y `pnpm screens` arman la aplicación. Conviene un control con nombre
  (`pnpm manual`) que también chequee los tamaños del punto 14.
- **Gravedad:** mejora.

### 20. Las capturas viejas dependen de la buena voluntad (§ 3, último párrafo)

- **Qué propone:** «el que cambia una pantalla corre también este programa en el mismo commit».
- **Qué veo:** la constitución pide que los límites se controlen con herramientas.
- **Qué propongo:** `capture.ts` puede anotar, junto a cada medio, la huella de la captura de
  referencia de la pantalla de la que sale. Un control compara las huellas y avisa cuál quedó
  vieja. Otra opción: que la escena del manual sea también una prueba de captura, que falla si la
  pantalla cambió.
- **Gravedad:** mejora.

### 21. `points.json` único y `· celular` repetido (§ 2 y § 3)

- **`points.json`:** un solo archivo regenerado entero, con los puntos de todas las escenas, choca
  entre sesiones que escriben el manual de módulos distintos a la vez («Trabajo en paralelo»). Uno
  por escena (`<escena>.points.json`), o los puntos dentro de la salida de cada escena, no choca.
- **El dispositivo de la captura:** ya lo sabe la escena (su tamaño, y el nombre `phone-…`). Pedir
  además `· celular` al final del renglón dice lo mismo dos veces y puede contradecirse. Que lo
  saque el complemento de la escena, o que exija que coincidan.
- **Gravedad:** mejora.

### 22. El formato del capítulo, lo que le falta para reconstruirlo (§ 2)

- **El ícono de un paso sin captura:** se pide `Ícono:` «dentro del paso», pero el ejemplo no lo
  muestra. Tampoco dice si es obligatorio o si se usa el de la tarea, como hace la maqueta.
- **El primer paso sin captura** (toda la tarea «Si pasa mucho tiempo»): la maqueta muestra el
  ícono solo. El diseño dice «sobre la captura anterior», que ahí no existe.
- **Dónde va cada clave:** la «Aclaración» sale en la maqueta en «Paso 1 de N · …» y en «Todos los
  pasos». La «Marca» sale corta en la lista («La más rápida») y entera en «Todos los pasos»; ¿la
  forma corta de dónde sale? (R3.1).
- **Las claves del paso** (`Captura:`) usan `·` como separador, y un rótulo con «·» rompería el
  renglón. Que el complemento lo rechace.
- **Gravedad:** mejora.

### 23. `useManual.ts` hace cuatro cosas (§ 5)

- **Qué veo:** carga, dirección, teclado y «Volver» en un solo archivo, cuando la constitución pide
  un archivo por responsabilidad.
- **Qué propongo:** la dirección (leer `d`, `t`, `p` y validarlos, escribirla al cambiar) es lógica
  pura y probable: va mejor en su propio `address.ts`. El teclado, si se resuelve con el punto 1,
  queda en marcas del HTML y no necesita código en el hook.
- **Gravedad:** mejora.

### 24. Lo que puede aparecer encima del manual (§ 5)

- **Qué veo:** el aviso de versión nueva (`VersionNotice`, un `data-layer`), «Algo salió mal» y la
  entrada que aparece si la sesión se cierra pueden salir con el manual abierto. El diseño no dice
  si van encima o debajo. Si van encima, el motor les da el teclado (es lo esperable). Si la entrada
  queda debajo, hay que pensar qué hace «Volver a Vender» con la sesión cerrada.
- **Gravedad:** mejora.

### 25. 01 · R7.2 y E39, y su prueba (§ 5)

- **Qué propone:** «Ver el manual» deja de llevar «Pronto».
- **Qué veo:** 01 · E39 y su prueba (`src/app/modules/sign-in/entrance.test.tsx`) describen el
  botón con «Pronto». Al existir el manual, el escenario ya no se puede dar. El diseño tiene que
  decir que la prueba de 01 · E39 se retira (o se reescribe contra la regla), no que se cambia para
  que pase. Lo mismo con la opción Manual de Más, que hoy sale con «Pronto» porque no tiene `path`
  (`modules/frame/menu.ts`).
- **El botón en una ventana angosta:** «Ver el manual» va hoy con la clase `desktop-only`, que
  depende del ancho. R6.1 y 01 · R7.1 hablan del dispositivo, así que en una computadora con la
  ventana angosta el botón desaparece. No es de este diseño, pero lo toca: conviene decidirlo acá.
- **Gravedad:** mejora.

### 26. Valores de la dirección en castellano (§ 5)

- **Qué veo:** `d=celular`. La constitución pide en inglés las rutas y sus parámetros, así que
  quedaría `d=phone`. Los valores del Markdown (`Dispositivo: computadora`) son contenido de la
  documentación y pueden quedar en castellano.
- **Gravedad:** mejora menor.

---

## Por tema, lo que no encontré o no pude comprobar

- **Escenarios:** E32 a E39 y E53 tienen ruta y prueba en § 10. Lo que no se cumple tal como está
  son E37 (punto 2), E36 (punto 5) y E35 en lo que pide Carlos (punto 13). Falta una prueba de la
  conducta sin conexión (punto 10). La prueba de E53, «no pide nada a `/api`», tiene que ser del
  manual, no de `App`, que al abrir siempre pide `/api/start`.
- **Repetición:** el diseño reutiliza bien la imagen de Playwright, el servidor de las capturas,
  `useBackStep` e `isPhone`. Lo que se repite está en los puntos 13 y 21. `capture.ts` tiene que
  reutilizar el relanzado en Docker de `tests/screens/run.ts`, no copiarlo.
- **Seguridad:**
  - Las respuestas de mentira y las personas inventadas cumplen la restricción: nada de datos
    personales ni secretos en el repositorio.
  - La política sigue igual para la aplicación, y `'unsafe-inline'` sigue solo en
    `/google-button.html`. La posición del aro por CSSOM no necesita excepción. No pude comprobar en
    un navegador que Preact ponga el `style` del objeto por CSSOM en todos los casos; que lo pruebe
    la captura de referencia con la política puesta.
  - No hay nada del ambiente de pruebas en las capturas (`environment: 'production'`). Falta decir
    que se usa el botón de Google de mentira de `serve.ts`: con el de verdad, una cuenta de Google
    abierta en el navegador puede dibujar su nombre en el botón.
  - El QR de las capturas lleva un código que no vale («captura-fija») y una dirección local.
    Conviene decirlo, para que nadie lo cambie por uno real.
  - Lo que entra de afuera (la dirección y el buscador) está bien validado. Los JSON del mismo
    origen no se validan; con el punto 4, que al menos un JSON roto no rompa la pantalla.
- **Fronteras:** sin ciclos ni imports entre módulos fuera de la fachada. Lo dudoso son el
  service worker que nombra al manual (punto 17), los cambios a `platform/` que el diseño no anota
  como código común (puntos 1 y 2) y que el marco tiene que pasar a `navigate` el nombre de la parte
  abierta: hoy navega a `option.path` sin estado.
- **Sin conexión, hora y escala:** el manual no atiende clientes ni proveedores. La hora fija solo
  vale en las capturas. Son archivos fijos, así que escalar a 100 personas no cambia nada. Lo de sin
  conexión está en el punto 10.
- **Simpleza:** la división en archivos es razonable y la máquina de estados (`state.ts`) va con la
  arquitectura («las acciones con nombre son la columna»). Lo que sobra o se simplifica está en los
  puntos 17, 19 y 23.
