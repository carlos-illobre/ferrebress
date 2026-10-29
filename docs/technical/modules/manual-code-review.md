# Revisión del código · 00 · El manual (`manual`)

Revisión del paso 7 sobre los commits `8a348e3`, `442792b`, `7f54aad`, `97322e1` y `f0be623`. Compara
el código con las reglas (00 · parte 6, E32 a E39 y E53, R1.4, R2, R4.4, R7.4 y R10; 01 · R7.2),
con la [maqueta final aprobada](../../design/mockups/manual/final/) y su `changes.md`, y con el
[diseño](manual.md) y sus dos revisiones ([diseño](manual-design-review.md),
[seguridad](manual-security-review.md)). También con la constitución y la arquitectura.

**Lo que corrí:**

- `pnpm check`: en verde. Pasaron 462 unitarias con cobertura del 100 %, las 28 capturas de
  referencia (5 del manual) y `pnpm manual:check` (9 escenas; el clip se saltea).
- El armado de la aplicación (`vite build`), para ver dónde quedan el código y los archivos del
  manual.
- El servidor de desarrollo, contra `/manual` y `/manual/*`.
- Una copia de `docs/manual/` con la lista reordenada, armada con `tools/manual/`.
- El arranque armado antes del manual (`442792b`) contra el de hoy.

**Lo que no pude comprobar:**

- Las pruebas de punta a punta (`tests/e2e/headers.spec.ts`) no las corrí, porque necesitan la
  aprobación de Carlos. Así que lo que hace Caddy (el `no-store`, el 404 de `/manual/*` y que no haya
  violaciones de la política) lo revisé solo leyendo el `Caddyfile`.
- El manual con el contenido de verdad no tiene capturas de referencia: usan el manual de prueba. Lo
  comparé con la maqueta solo a través de esas capturas.

---

## Lo que frena el cierre

### 1. El celular baja el capítulo y dos capturas al abrir el manual, sin tocar nada

- **Dónde:**
  - `src/app/modules/manual/state.ts:48-58`: `startState` pone la primera tarea también en el
    celular.
  - `src/app/modules/manual/screens/Manual/Manual.tsx:93`: `{view.task && <Guide …/>}` se dibuja
    aunque la hoja esté cerrada.
  - `src/app/modules/manual/screens/Guide/Guide.tsx:130`: `useCaptures`.
  - `src/app/modules/manual/media.ts:37-54`.
- **Qué dicen los documentos:**
  - El diseño, § 9: «En el celular, el capítulo y su captura recién al tocar una tarea».
  - La constitución, III: el celular usa datos que se pagan.
- **Qué hace el código:** en el celular, `state.task` arranca en la primera tarea del celular. Eso
  pasa aunque la hoja esté cerrada (`sheet: false`). Entonces:
  - `useChapter` pide el capítulo.
  - `Guide` se monta oculto (`aria-hidden`).
  - `useCaptures` baja las dos primeras capturas. Con el contenido de hoy son `phone-entrance.webp`
    (55 KB) y la siguiente.

  Son unos 110 KB que nadie pidió, cada vez que se abre el manual. Ninguna prueba del celular mira lo
  que se pide al abrir (`manual-phone.test.tsx`).
- **Gravedad:** frena. No cumple una meta de performance del diseño, y el costo lo pagan los datos
  del celular.

### 2. «Hay una versión nueva» queda oculto debajo del manual

- **Dónde:** `src/app/App.tsx:171-175` (el marco va dentro de `.behind-manual`, con `hidden` e
  `inert`) y `src/app/modules/frame/screens/Frame/Frame.tsx:77` (`<VersionNotice />` está dentro del
  marco).
- **Qué dice el diseño, § 5, «Lo de arriba»:** «el aviso de versión nueva, «Hay que actualizar» y
  «Algo salió mal» van encima del manual».
- **Qué hace el código:**
  - «Hay que actualizar» (`UpdateBlock`) y «Algo salió mal» están en `Dialogs`, en `App`: esos sí van
    encima.
  - El aviso de versión nueva (R5.3) y la espera (`WaitNotice`) quedan dentro del marco oculto. Con
    el manual abierto no se ven.
  - No hay prueba de esto.
- **Gravedad:** frena. Es una diferencia con el diseño aprobado y no tiene prueba. Se arregla
  sacando `VersionNotice` del marco, o mostrándolo también desde el manual.

### 3. Un capítulo que no llegó por falta de red no dice «Sin conexión» y no se pide al volver la red

- **Dónde:**
  - `src/app/modules/manual/screens/Manual/Manual.tsx:93`.
  - `src/app/modules/manual/useManual.ts:58-80`.
  - La prueba `manual-screen.test.tsx:218-227`, que espera que no haya nada
    (`queryByRole('main')` nulo).
- **Qué dicen los documentos:**
  - El diseño, § 4: «una captura o un capítulo que no llegó muestra su lugar gris con «Sin
    conexión», y se pide de nuevo al volver».
  - R4.4 y R4.6.
- **Qué hace el código:**
  - Si el capítulo falla, `view.task` queda indefinido y el lugar del paso a paso queda vacío, sin
    ningún texto.
  - Se vuelve a pedir recién cuando la persona elige otra tarea (`retry = state.task`). El evento
    `online` no lo vuelve a pedir; las capturas, en cambio, sí escuchan ese evento.
  - En el celular es peor. Tocar una tarea aplica `in-guide` (la lista se achica al 94 % y queda
    medio transparente), pero no aparece ninguna hoja ni `SheetStep`. La pantalla queda tapada, y el
    botón atrás del celular saca del manual.
  - La prueba confirma la conducta y no la regla.
- **Gravedad:** frena. Se aparta del diseño y de R4.4, y en el celular deja una pantalla sin salida
  clara.

### 4. Un pedido automático al volver la conexión que no está en `mobile-data.md`

- **Dónde:** `src/app/modules/manual/media.ts:16-24` (`useOnline`) y `:54` (la dependencia
  `online`).
- **Qué dice la constitución, III:** todo pedido que la aplicación haga sola (también «al volver la
  conexión») se anota antes en `docs/technical/mobile-data.md`, con lo que pesa, y lo aprueba
  Carlos.
- **Qué hace el código:** al volver la conexión, vuelve a pedir las capturas de la tarea abierta que
  no habían llegado (hasta 2 × 90 KB). `mobile-data.md` no nombra al manual.
- **Gravedad:** frena, porque es una regla de la constitución. Se arregla anotándolo (el diseño
  aprobado ya lo pide en § 4) o pidiéndolas de nuevo solo cuando la persona toca algo.

### 5. El orden de `docs/manual/README.md` no es el de R6.4

- **Dónde:** `docs/manual/README.md:24` (`- customers · Clientes · users`, tercero, entre Vender y
  Productos).
- **Qué dicen los documentos:**
  - R6.4: «hoy, el del menú, y después los módulos que no están en el menú, en el orden en que se
    programan».
  - `changes.md` de la maqueta, «Lo que decidió Carlos»: Clientes «va después de los del menú».
  - Clientes no es una opción del menú (R1.2).
- **Qué hace el contenido:** copia el orden de `content.js` de la maqueta, que tiene a Clientes en el
  tercer lugar y contradice su propio `changes.md`. Por R6.4 y el plan, el final de la lista tendría
  que ser: Celular y computadora (03), Clientes (13), Trabajar sin conexión (15).
- **Gravedad:** frena, porque la regla manda sobre la maqueta. Se arregla moviendo un renglón, pero
  como la maqueta y la regla no coinciden, conviene que lo confirme Carlos.

### 6. E39 no tiene una prueba que lo nombre ni que lo compruebe sobre lo armado

- **Dónde:** `src/app/platform/offline/worker.test.ts:53`. «app-E39» está en un comentario dentro de
  la prueba «nunca toca /api, otros sitios…», y prueba `kindOf` con nombres inventados
  (`/manual/app-abc.js`).
- **Qué dicen los documentos:**
  - La constitución, I y VII: el estado sale de las pruebas, que nombran el escenario.
  - La revisión de seguridad, 8: que se compruebe «sobre la imagen armada, no sobre una unitaria de
    `kindOf` con un nombre inventado».
  - El diseño, § 10 (fila E39): pide además una de punta a punta, pero la última fila del mismo § 10
    dice que la única de punta a punta es la de las cabeceras. El diseño se contradice.
- **Qué hace el código:** que el código del manual salga en `manual/` depende de `chunkFileNames`,
  que compara `facadeModuleId` con `/modules/manual/screens/Manual/` (`src/app/vite.config.ts`). Lo
  comprobé armando: salen `manual/app-*.js` y `manual/app-*.css`, y nada exclusivo del manual queda
  en `assets/`. Pero ninguna prueba lo comprueba: un cambio de nombre de carpeta lo rompe en
  silencio.
- **Gravedad:** frena, por la regla de que cada escenario tenga su prueba. Alcanza con nombrar la
  prueba `app-E39` y que un control de `pnpm boot` (que ya arma la aplicación) compruebe que el
  código del manual está en `manual/`. De paso, corregir el § 10 del diseño.

---

## Mejoras

### Escenarios y sus pruebas

7. **`router.test.ts:28` se llama «manual-E37»:** el capítulo es `app`, y en las otras pruebas el
   escenario se llama `app-E37`. Con «manual-E37» la cuenta del estado no lo encuentra.
8. **E37 «abierto desde la entrada, vuelve a la entrada» no se prueba tocando «Volver».**
   - `manual-app.test.tsx:54-64` vuelve con `navigate('/')`.
   - `manual-screen.test.tsx:176-182` usa un `back` de mentira del kit.
   - Solo el caso de Más prueba la vuelta entera, y además con `history.go` reemplazado.
9. **E34 («abierto en el celular … está elegido Celular»):**
   - La prueba que lo nombra (`manual-screen.test.tsx:16`) arranca en la computadora.
   - La que arranca en el celular (`manual-app.test.tsx:75`) no nombra el escenario.
10. **R6.1 en el celular:** ninguna prueba dice que «Ver el manual» no está en la entrada del celular.
    Lo hace `Scene.tsx:76` (`if (isPhone()) return null`), y la rama está cubierta, pero nada lo
    afirma.
11. **«Si la sesión se cierra con el manual abierto, la entrada aparece recién al volver»** (diseño,
    § 5): el código lo hace (`App.tsx:155`), pero no tiene prueba.

### Comentarios de cabecera y carpetas

12. **`src/app/modules/manual/api.ts:2-3`:** dice «Solo pide nombres que salen del índice o de las
    constantes de lo compartido». No es cierto: `useManual.ts:41-45` pide `${c}.json` con el `c` de
    la dirección (ver el punto 17).
13. **`src/app/modules/manual/ManualSlot.tsx:4`:** «Este archivo va en el arranque: solo tiene eso».
    Pero importa `back.ts`, y este trae `texts.ts` entero y las partes del marco (ver el punto 18).
14. **`src/app/modules/manual/address.ts:3`:** «Nunca arma el nombre de un archivo». Es cierto de
    `address.ts`, pero el módulo sí lo arma (punto 17). Para quien lee, el comentario da una
    garantía que el módulo no cumple.
15. **La carpeta `src/app/modules/manual/` tiene 12 archivos que no son pruebas, sueltos.** Dos pares
    comparten un concepto y, por la constitución (XII, «Carpetas chicas, agrupadas por concepto»),
    irían en una subcarpeta:
    - `address.ts` y `back.ts`: la dirección y la historia.
    - `api.ts` y `media.ts`: lo que se baja.

    Además, el tipo `Back` vive en `screens/Manual/Manual.tsx`, y lo importan `back.ts` y
    `ManualSlot.tsx`, que van en el arranque. Que lo del arranque dependa de un archivo de la
    pantalla diferida es al revés; el tipo va en `back.ts`.
16. **`src/app/modules/frame/screens/Side/More.tsx:2`:** el comentario quedó en un solo renglón
    largo, con «Siempre tiene algo: el manual existe.» pegado a la frase anterior. Es solo de forma.

### El diseño y la seguridad

17. **El capítulo de la dirección se pide antes de validarlo contra el índice.**
    - Dónde: `src/app/modules/manual/useManual.ts:28-45`. La prueba que lo exige está en
      `manual-screen.test.tsx:192-196`, que espera el pedido de `/manual/nada.json`.
    - El diseño, § 5, dice dos cosas a la vez: «El archivo que se pide siempre es el del índice,
      nunca un texto armado con la dirección» y «si la dirección nombra un capítulo, el índice y el
      capítulo se piden a la vez».
    - El código arma el nombre con lo que trae la dirección, filtrado por `^[a-z0-9-]+$`. No puede
      salir de `/manual/` (bien: cumple lo que buscaba la revisión de seguridad, 2), pero cualquier
      `c=` hace un pedido de más que termina en 404.
    - Hay que corregir el diseño (decir que se acepta un nombre con esa forma) o el código.
18. **El arranque creció más de lo que dice la meta, y nada controla el tope del código del
    manual.**
    - Medido con gzip: el arranque pasó de 59 381 bytes (`442792b`) a 60 926. Son 1,5 KB más, contra
      la meta de «menos de 1 KB» (diseño, § 9), y quedan 514 bytes hasta el tope de 60 KB de
      `pnpm boot`. Una parte es del marco (Más, `openOption`), pero el arranque trae también todo
      `modules/manual/texts.ts` («Todos los pasos», «Próximos capítulos», «Ver cómo se hace»…),
      porque lo importa `back.ts`.
    - El tope de 20 KB comprimidos del código del manual (diseño, § 2) no lo mide ningún control.
      Hoy pesa 8,7 KB el JS y 3,3 KB el CSS. Lo medí a mano.
19. **Al abrirlo en la computadora, son 4 pedidos en cadena y no 3** (diseño, § 9).
    - Dónde: `useManual.ts:39-53`. Sin `c` en la dirección (el caso de Más y de «Ver el manual»), el
      capítulo se pide recién cuando llega el índice. La cadena es código → índice → capítulo →
      captura.
    - Ninguna prueba cuenta los pedidos del arranque del manual.
20. **El servidor de desarrollo contesta 404 a la página `/manual`.**
    - Dónde: `src/app/vite.config.ts:28-35`. `server.middlewares.use('/manual/', …)` atiende también
      `/manual` y `/manual?…`, porque connect corta la barra final.
    - Lo comprobé con `vite` en el puerto 5299: `/manual` da 404, `/manual?d=phone` da 404 y
      `/manual/index.json` da 200.
    - En `pnpm dev`, recargar el manual o abrirlo por su dirección no anda. A producción no le pasa.
    - Además, `files()` vuelve a armar el manual entero, con los medios, en cada pedido.
21. **`MANUAL_MEDIA=pending` sí corre dentro de `pnpm check`.**
    - Dónde: `tests/manual/playwright.config.ts:20`, que corre por `pnpm manual:check`.
    - El diseño, § 2, dice que ese modo «nunca se usa en `pnpm check` ni en el Dockerfile», y que
      «no valida los medios». El código saltea el manual entero (`vite.config.ts:24`).
    - No es un hueco, porque `pnpm manual` valida antes, pero el diseño y el código dicen cosas
      distintas.
22. **«Volver a Ferrebress», con la clave `app`, no está en el diseño.** El valor por omisión
    `from = 'app'` (`frame/menu.ts:97`) y la entrada `app: 'Ferrebress'` (`back.ts:14`) no están en
    la lista cerrada del diseño, § 5 («`entrance` o el id de la parte o la opción abierta»). Sale en
    producción mientras no exista ninguna parte. Es razonable, pero no está escrito.
23. **Las dos pantallas de «El manual necesita internet»:**
    - `ManualSlot.tsx:16, 31-39`: cuando falla el `import()` sin red. Usa la clase `manual-missing`,
      que no tiene estilos.
    - `Manual.tsx:117-125`: cuando el índice no llega.

    La maqueta no tiene esta pantalla, y R4.4 pide gris en lugar de una pantalla (la revisión del
    diseño, 10, decía que «el texto del esqueleto sobra»). Como caso de borde (la red se corta entre
    el toque y la carga) se entiende, pero debería ser una sola pantalla, con estilo y escrita en el
    diseño.
24. **Huecos chicos del lector y del control de HTML:**
    - `tools/manual/list.ts:43`: el nombre de un renglón de la lista no pasa por `textProblem` (puede
      tener `<`). Preact lo muestra como texto, así que no hay riesgo, pero el diseño dice «solo
      texto».
    - `tools/manual/list.ts:52`: el mensaje de error repite el contenido del renglón. La revisión de
      seguridad, 3, pedía que dijera archivo y renglón, no el contenido.
    - `tools/manual/media.ts:91-93`: se rechazan los enlaces simbólicos de cada archivo, pero no el de
      la carpeta `media/`. Si `media` fuera un enlace, `readdirSync` lo sigue.
    - `tools/checks/raw-html.ts`: no detecta `setAttribute(\`style\`…)` con comillas invertidas, ni
      `style.cssText`. Hoy no hace falta.
25. **El programa de capturas:**
    - `tests/manual/clip.ts:92`: la página que convierte el último cuadro se abre con
      `browser.newPage()`, fuera del contexto encerrado. Solo lee un `data:` y no pide nada, pero se
      sale de la regla de la revisión de seguridad, 4.
    - El clip no pasa por `expectClean` (sin el marco de pruebas ni «Pronto»).
    - `pnpm manual:check` no puede decir si el clip quedó viejo.
    - «Cada respuesta se valida contra su contrato» (diseño, § 3): las respuestas de mentira están
      tipadas con `StartResponse` y `ReadCodeResponse` (bien), pero lo que se guarda en el
      dispositivo (`scenes.ts:45, 127-128, 144-146`: `session`, `offline-option`, `offline-contact`)
      no está atado a ningún tipo. Si cambia la forma de lo guardado, la escena no avisa.
26. **El teclado (R2.8):**
    - Los segmentos de avance (`Guide.tsx`, `Progress`) y «Ver cómo se hace», el botón para volver a
      ver el clip (`Stage/Clip.tsx`), son botones sin atajo.
    - Con el clip terminado, Alt V no hace nada: `playClip` ya está en `true` (`state.ts:114`) y el
      `Stage` no se vuelve a montar.

    La maqueta no los nombra, pero la regla dice «todo botón».
27. **`openAllSteps` desde la lista conserva la tarea de otro capítulo.** En `state.ts:105-108` cambia
    `chapter` y deja `task`. Con un solo capítulo escrito no se nota. Con dos, al cerrar «Todos los
    pasos» el paso a paso queda vacío, y la dirección (`c=B&t=<tarea de A>`) no se puede volver a
    abrir.
28. **El código común se cambió sin tomar la tarea.** El plan sigue con «Código común: Libre», pero
    se cambiaron `src/shared/contracts/manual.ts`, `src/app/platform/router.ts` y `keyboard.ts` (la
    constitución, «Trabajo en paralelo»; el diseño, § 11, tarea 3). Es una falta del proceso, no del
    código.

### Pruebas que miran por dentro

29. **`src/app/modules/manual/logic.test.ts`:** prueba `readAddress`, `validAddress`,
    `writeAddress`, `searchManual`, `marks`, `normalize`, `reduce`, `startState`, `tasksOf` y
    `firstTask` sueltas. El diseño, § 10, las pide así, pero la constitución, VII, pide probar lo
    que ve la persona. Un cambio de nombre de una acción del reductor rompe estas pruebas sin
    cambiar nada visible. Casi todo ya está probado por la pantalla en `manual-screen` y
    `manual-phone`.
30. **`manual-slot.test.tsx:10`:** hace `vi.mock('./screens/Manual/Manual.tsx')`, que depende de la
    ruta de un archivo interno, y prueba `backOf` directamente (`:35-57`).
31. **Las que dependen de las clases CSS:**
    - `to-right to-up`, `.manual-veil:not(.alone)`, `.manual-capture` y `margin-left` con
      `getBoundingClientRect` reemplazado (`manual-screen.test.tsx`).
    - `in-guide`, `last` y `open` (`manual-phone.test.tsx`).
    - `.behind-manual` (`manual-app.test.tsx`).

    Un cambio de solo CSS, que la constitución (III) quiere que sea libre, rompe estas pruebas.
32. **Las que dependen de la forma de `history.state`:** las que esperan `{ from: 'sell' }`,
    `{ from: 'more' }` y `{ from: 'app' }` (`frame/manual-option.test.tsx`, `manual-app.test.tsx:39`,
    `sign-in/entrance.test.tsx`). Lo que ve la persona es «Volver a Vender», y eso es lo que tendrían
    que comprobar.

### Simpleza y repetición

33. **El mínimo y el máximo del buscador, en varios lugares:**
    - El mínimo de dos letras está en `search.ts` (`minQuery`), en `useManual.ts:93`
      (`trim().length < 2`) y en `Tasks.tsx:97` (`>= 2`).
    - El máximo de 60 está en `search.ts` (`maxQuery`) y en `Tasks.tsx:114` (`maxLength={60}`).
34. **El mismo texto dos veces:** «El manual necesita internet.» está en `ManualSlot.tsx:16` y en
    `texts.ts` (`needsInternet`).
35. **`SheetStep` está repetido** en `Guide.tsx:123` y en `AllSteps.tsx:14`.
36. **La forma de un nombre, con dos expresiones distintas:** `useManual.ts:28` (`^[a-z0-9-]+$`) y
    `tools/manual/text.ts` (`isName`).
37. **El tope de 90 KB de una captura, en dos lugares:** `tests/manual/media.ts:10` y
    `tools/manual/media.ts:21-22`. Pueden quedar distintos.
38. **`tests/manual/scenes.ts:8` vuelve a declarar `Device`,** que ya está en
    `src/shared/contracts/manual.ts`.
39. **Una entrada que nunca se usa:** en `back.ts:18`, `shortNames` tiene `'la entrada'`, una clave
    que nunca llega (`from` es `entrance`).
40. **Íconos repetidos:** 19 íconos están a la vez en `modules/manual/icons.ts` y en `ui/icon`
    (`bug`, `wifi-off`, `fingerprint`, `scan-barcode`, `workflow`…). El diseño eligió un juego propio
    (opción a de la revisión del diseño, 11), así que se acepta. Lo anoto para cuando se junten.

### Documentación que quedó atrás

41. **El diseño, § 5, tabla de archivos:**
    - No nombra `ManualSlot.tsx`, `back.ts` ni `view.ts`.
    - Dice `screens/Step/`, pero el código tiene `screens/Guide/`, `screens/Stage/` (con `Shot` y
      `Clip`), `screens/Tasks/` (con `Rows` y `Results`) y `screens/Glyph/`.
42. **El diseño, § 3:**
    - Dice que el clip se graba en `tests/manual/stage.html`, pero la página está dentro de
      `tests/manual/clip.ts`.
    - Dice `pnpm manual --check`, pero el comando es `pnpm manual:check`, que necesita Docker.
    - No dice que el clip no se compara.
43. **El diseño, §§ 2 y 10:** no nombra `MANUAL_DIR`, la variable con la que el armado toma el manual
    de prueba.
44. **El diseño, § 5, «El paso a paso»:** no dice que en el celular el consejo sale solo en el último
    paso. Lo hacen la maqueta (`manual.css:243`) y el código (`Guide.css`). Otro agente que lea solo
    el diseño mostraría un consejo en cada paso.
45. **Lo que falta en la arquitectura y en `mobile-data.md`:**
    - `docs/technical/architecture.md` no nombra `docs/manual/`, `tools/manual/` ni `tests/manual/`,
      ni que Caddy sirve `/manual/*` aparte.
    - `mobile-data.md` no anota el pedido del punto 4.

### Pantallas

46. **El cartel de pruebas tapa parte del manual.** En las capturas de referencia del celular
    (`tests/screens/references/manual-phone.png` y `manual-phone-step.png`), el cartel «Ambiente de
    prueba» queda encima de «‹ Ferrebress» y del borde de arriba de la hoja. Solo pasa en pruebas.
47. **Con la maqueta, salvo eso, coincide.** Comparé `screenshot.png`, `screenshot-all-steps.png`,
    `screenshot-phone.png` y `screenshot-phone-step.png` con las referencias. El orden, la cabecera,
    las tareas con su marca, el aro con su rótulo y su flecha, «Todos los pasos» y la hoja del
    celular coinciden. Las diferencias que se ven salen del contenido de prueba y del cartel del
    ambiente.

    No pude comparar el contenido de verdad (cinco tareas, el clip) en una captura propia de la
    aplicación.
48. **La pantalla de `ManualSlot` sin red (`.manual-missing`) no tiene estilos** (ver el punto 23).

---

## Lo que revisé y está bien

- **El pedido de Carlos: cambiar el orden es mover un renglón y nada más.** Se cumple de verdad.
  - En una copia de `docs/manual/` moví «Trabajar sin conexión» (el que lleva a otro capítulo)
    arriba de todo y «Entrar» al final, y el lector armó sin problemas, en el orden nuevo. Los
    destinos `→` se resuelven después de leer todos los capítulos, así que el orden no los afecta.
  - Solo `vite.config.ts` y `tools/cli.ts` leen el `docs/manual/` de verdad.
  - Las capturas de referencia usan `tests/manual/fixture/` con `MANUAL_DIR`
    (`tests/screens/playwright.config.ts`).
  - Las unitarias usan su propio índice.
  - `pnpm manual:check` compara escenas, que no dependen del orden.
  - Un capítulo que se cae de la lista frena el armado (`build.ts`, `strayFiles`).
- **El resto de los escenarios:**
  - E32, E33, E35, E36 y E38 tienen pruebas que los nombran y lo comprueban de verdad.
  - E53 se prueba con sesión (el nombre no está dentro del manual y lo de abajo queda `inert`).
    También se prueba que todo lo que se pide sale de `/manual/`.
  - R1.4: el manual no cuenta como la primera opción del menú (`Frame.tsx`, `firstOption`, con su
    prueba).
  - R4.4: «Ver el manual» y Más → Manual se ponen grises sin conexión, con sus pruebas.
  - R7.4: la espera de 150 ms está.
  - R10.1: el manual dibuja el marco y el cartel en pruebas.
  - 01 · E39 se retiró y 01 · R7.2 se corrigió.
- **La seguridad:**
  - La política de contenido no cambió. `'unsafe-inline'` sigue solo en `/google-button.html`: el
    `Caddyfile` solo agrega `handle /manual/*`, y los estilos en línea de `clip.ts` son de una página
    de prueba que no se despliega.
  - El aro y el rótulo se ubican por CSSOM.
  - El resaltado se arma con `<mark>` de Preact.
  - `pnpm lint` rechaza el HTML armado.
  - El lector:
    - Rechaza `<`, `>` y entidades.
    - Pide nombres `^[a-z0-9-]+$`.
    - Usa `lstat` en cada archivo.
    - Mira la firma y el tope de cada medio.
  - «Volver» solo usa la historia o `/`.
  - El buscador no arma expresiones regulares y corta en 60 letras.
  - El programa de capturas aborta todo pedido fuera del servidor de mentira y comprueba que no
    salgan el marco de pruebas ni «Pronto».
  - Caddy: `/manual/*` queda fuera de `@fresh`, con `no-store` y sin `try_files`, así que lo que
    falta da 404. Lo revisé leyendo; no lo corrí.
- **Secretos y datos personales:** en los cinco commits el único correo es `ana@example.com` (además
  del de los commits). No hay credenciales. Las capturas muestran solo a la persona inventada, y
  `canvas.toBlob` no deja metadatos.
- **Dónde queda lo armado:**
  - Lo del manual sale en `dist/manual/`: `index.json` (2,3 KB), `sign-in.json` (7,9 KB), los dos
    `search-*.json` (unos 2 KB cada uno), los medios (dentro de sus topes) y el código.
  - El service worker no aprende ningún nombre del manual.
  - El Dockerfile copia `tools/manual` y `docs/manual`.
- **El tiempo de las unitarias:** la corrida entera de `pnpm test` tardó 57 s, más que los 30 s de
  la constitución, VII. Las 8 del manual solas tardan 10 s. No pude separar cuánto del total suma el
  manual y cuánto ya estaba.

---

## Lo que se hizo con esta revisión

- **Lo que frenaba (1 a 6), corregido.** El celular no abre ninguna tarea hasta que se toca una; el
  aviso de versión nueva va encima del manual; el capítulo sin red dice «Sin conexión» y se pide de
  nuevo al volver la conexión (anotado en `mobile-data.md`); los capítulos que no son del menú van al
  final de la lista; y `pnpm boot` comprueba sobre lo armado que el código del manual está en
  `manual/`, nada de él en `assets/` y dentro de sus 20 KB (prueba `app-E39`).
- **Corregidas:** 7 a 11 (nombres de escenarios y pruebas que faltaban), 12 a 16 (comentarios,
  carpetas `files/` y `place/`, el tipo `Back` y sus textos en `place/back.ts`, fuera de `texts.ts`),
  17 y 19 (el diseño dice lo que hace el código), 18 (el tope del código lo mide `pnpm boot`), 20 (el
  servidor de desarrollo atiende solo `/manual/…`, arma una vez y tiene prueba), 21 y 22 (diseño), 23,
  34 y 48 (una sola pantalla «El manual necesita internet», con estilo), 24 (lector y control de
  HTML), 25 (el clip pasa por la comprobación del ambiente, el convertidor va encerrado, la escena
  tiene tipo), 26 (Alt 1 a Alt 9 en el avance, Alt V vuelve a empezar el clip), 27, 30 (en parte:
  «Volver» se prueba por lo que se ve), 33, 35 a 39 y 41 a 45.
- **Quedan como están:** 28 (falta del proceso: se anota para la próxima), 29, 31 y 32 (las pruebas
  que miran por dentro se cambian cuando se toquen esas partes), 40 (aceptado en el diseño) y 46 (el
  cartel de pruebas roza «‹ Ferrebress» en el celular; solo en pruebas, igual que en las demás
  pantallas).
