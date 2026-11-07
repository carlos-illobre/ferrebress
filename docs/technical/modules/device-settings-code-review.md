# Revisión del código · 04 · Configuración del dispositivo (`device-settings`), etapa a

Revisión del paso 7 sobre los commits `3a847c5` a `c88c60e`, contra el
[capítulo 04](../../chapters/04-device-settings/rules.md) (y 00 · R8.5, 03 · R6.2, 15 · R1), las
maquetas aprobadas (`device-settings-a/final/` y `device-settings-install/final/`), el
[diseño](device-settings.md) y sus dos revisiones. No cambia el código.

**Gravedad:** «Frena» quiere decir que hay que corregirlo antes de cerrar el módulo. «Mejora» quiere
decir que conviene hacerlo, pero no impide cerrarlo.

**Lo que corrí:** las unitarias del módulo, de `platform/{motion,time,install}`, de `ui/` y de
`sign-in/offline` (13 archivos, 75 pruebas, todas pasan); `node tools/cli.ts html`, `headers`,
`sizes` y `boot` (sin avisos); y un armado de Vite aparte, en una carpeta temporal: el arranque pesa
70,4 KB con gzip (tope 256 KB), con `settings-*.js` y `Sheet-*.js` precargados por la página (los
guarda el service worker como esqueleto), y salen los dos manifiestos, el de pruebas con «Ferrebress
pruebas». **No corrí** las capturas (`pnpm screens`), las de punta a punta ni Caddy: lo que depende
de ellos lo digo como no comprobado.

## Resumen

| # | Punto | Gravedad |
|---|---|---|
| 1.1 | Escenarios sin una prueba que los nombre: E04, E07, E08, E09, E14 | Frena |
| 1.2 | E18 no se cumple en la tira de Quién hizo qué: sus horas se escriben a mano, sin el formato elegido | Frena |
| 1.3 | Pruebas que nombran un escenario y no lo comprueban: E35, E33 (sin conexión), E18, E28/E30 (en la prueba de la computadora), E11 (Alt) | Frena |
| 1.4 | E13 y E14 sin prueba en un navegador: nada comprueba que la regla de `base.css` apague el movimiento y deje la espera | Frena |
| 1.5 | «Atrás» cierra el aviso para instalar aunque esté trabado, y puede cerrarlo dos veces | Mejora |
| 1.6 | Cancelar en el navegador saca el renglón de instalar de Configuración, y la tostada dice que está ahí | Mejora (no comprobado) |
| 1.7 | La hora de ahora de Configuración no avanza mientras la pantalla está abierta | Mejora |
| 2.x | Comentarios de cabecera y carpetas | Mejora |
| 3.x | Pruebas que miran por dentro | Mejora |
| 4.1 | Falta la prueba de que Configuración abre sin red después de una versión nueva | Frena |
| 4.x | Otras diferencias con el diseño | Mejora |
| 5.x | Seguridad: todo como dice el diseño; la regla del manifiesto de pruebas, sin prueba | Mejora |
| 6.x | Reglas inventadas: ninguna de peso | — |
| 7.x | Simpleza y repetición | Mejora |
| 8.x | Documentación que quedó atrás (también una contradicción en `rules.md`) | Mejora |
| 9.x | Pantallas: diferencias con las maquetas | Mejora |

## 1. Escenarios

**1.1 · Escenarios sin una prueba que los nombre (Frena).** La constitución pide una prueba por
escenario, que lo nombre. Ninguna prueba nombra:

- **E04** (cada dispositivo tiene lo suyo). Se cumple por cómo está hecho (`localStorage`), pero
  ninguna prueba lo dice.
- **E07 y E08** (el espejo abre Configuración, cada uno con sus valores, y apagar las animaciones en
  uno no mueve la llave del otro). El diseño (§ 10) pide «unitarias con dos dispositivos falsos, como
  las del espejo de 03: la dirección viaja; ninguna clave del módulo ni el aviso pasan por el canal».
  No están. El código no usa `useMirrored` (`useSettings.ts:1-4` lo explica), así que lo más probable
  es que se cumpla, pero no lo pude comprobar.
- **E09** (no figura en Quién hizo qué). El diseño la asigna a las unitarias de `preferences.ts`; no
  hay ninguna que diga que cambiar una preferencia no hace ningún pedido.
- **E14** (con las animaciones apagadas, la marca de espera se mueve y a los 2 s la barra avanza).
  El diseño pide capturas «con el movimiento apagado (con la marca de espera y la barra
  moviéndose)»: no están (ver 1.4).

**1.2 · E18 en la tira de Quién hizo qué (Frena).** `audit-log/screens/Summary.tsx:89-91` escribe
las horas de debajo de la tira con el número que arma `stripScale` (`audit-log/logic.ts:134-141`):
«14» aunque la persona eligió «a. m./p. m.». El diseño (§ 4) dice que «las marcas de las tiras de
Quién hizo qué y del vínculo» salen de `formatHour`; solo lo hace la del vínculo
(`device-link/screens/Detail/Today.tsx:79`). E18 pide ver en ese formato «cualquier hora de la
aplicación (Quién hizo qué…)». El control de `pnpm lint` (`tools/checks/loose-times.ts`) no lo ve,
porque ahí no hay `getHours` ni `hour:`, solo cuentas.

**1.3 · Pruebas que nombran un escenario y no lo comprueban (Frena).**

- `settings.test.tsx:62`, «E15, E35»: comprueba E15 y que la llave se puede tocar, pero no E35 (apagar
  la llave, que el sistema deje de pedir no animar y que siga sin animaciones). Haría falta cambiar
  lo que pide el sistema después de tocar la llave y mirar `data-motion`.
- `settings.test.tsx:97`, «E33, E34»: E33 pide que «Trabajar sin conexión» siga prendida después de
  «Volver a como viene»; la prueba es en la computadora y sin la opción. El código no la toca
  (`preferences.ts:72`), pero la prueba no lo dice.
- `settings.test.tsx:70`, «E16, E17, E18»: de E18 solo mira que cambie `timeFormat`; ninguna hora de
  otra pantalla. Las de `time.test.ts` cubren `formatTime`, pero no que cada lugar que escribe horas
  lo use (1.2 lo muestra).
- `settings.test.tsx:142`, «E28, E30, E31»: solo comprueba E31 (en la computadora no está). E28 y E30
  se comprueban en las dos que siguen; el nombre de esta sobra.
- `settings.test.tsx:86`, «E11»: no aprieta Alt ni Alt D: busca `[data-key="d"]` y le hace clic. Que
  Alt muestre las teclas y que Alt + letra cambie la preferencia queda sin probar; tampoco Tab y
  Espacio.

**1.4 · E13 y E14 sin prueba en un navegador (Frena).** `motion.test.tsx:15` comprueba que se pone
`data-motion="off"`, y nada más: la regla de `styles/base.css` (la que de verdad apaga hojas,
ventanas y avisos, y deja `.keeps-moving`) no se prueba en ningún lado. Las capturas no sirven para
esto: `tests/screens/playwright.config.ts:24` las saca todas con `reducedMotion: 'reduce'`, y las de
Configuración no apagan la llave. Es justo lo que se rompió en este módulo con el orden de las capas
(`vite.config.ts:58-77`): sin una prueba en el navegador, otro cambio del armado lo puede romper sin
que nadie lo vea.

**1.5 · «Atrás» con el aviso trabado (Mejora).** `InstallSheet.tsx:24` registra
`useBackStep(dismiss)` siempre, y `locked` (`ui/sheet/Sheet.tsx:26-28`) solo frena el toque afuera y
el deslizar. El diseño (§ 4, «`ui/sheet`: trabarla») dice que trabada no se cierra «al bajarla, al
tocar afuera ni con “atrás”». Si llega un `popstate` mientras el navegador pregunta, la hoja se
cierra con la tostada, y al contestar el navegador `installNow` (`InstallSheet.tsx:25-32`) llama
otra vez a `dismiss` o a `onClose`: dos tostadas. No pude comprobar si Chrome en Android manda el
«atrás» a la página con su ventana abierta. Ninguna prueba toca «atrás» en el aviso (R4.5 lo nombra).

**1.6 · Cancelar en el navegador saca el renglón (Mejora, no comprobado).** `platform/install.ts:74`
deja `installState` en `'cannot'` si la persona cancela, y el renglón desaparece de Configuración
hasta que el navegador vuelva a mandar `beforeinstallprompt`. La tostada del aviso dice «Si cambiás
de idea, está en Más → Configuración», y E36, «instalar sigue en Configuración». Chrome suele volver
a mandar el evento después de una cancelación, pero no lo pude comprobar, y ninguna prueba lo cubre.

**1.7 · La hora de ahora no avanza (Mejora).** `Summary.tsx:13-15` escribe la hora al dibujarse; nada
vuelve a dibujar la pantalla si queda abierta. R3.1 pide que cada opción muestre «la hora de ahora»,
y el resumen y «Se ve así en Quién hizo qué» quedan con la hora de cuando se abrió.

El resto de los escenarios tiene una prueba que lo nombra y lo comprueba: E01, E02, E03, E05, E06,
E10, E12, E13 (lo que se hace en código), E15, E16, E17, E19, E20 a E28, E30 a E32, E34, E36 a E39.

## 2. Comentarios de cabecera y carpetas

- **2.1 (Mejora).** `screens/Settings/Summary.tsx:1-2` dice que dibuja «Así la tenés», pero también
  exporta `nowText` y `nowIn` (líneas 13-15), que usa `Rows.tsx:9`. La hora de ahora no es del
  resumen: iría en un archivo propio o en `useSettings.ts`.
- **2.2 (Mejora).** `screens/Settings/Install.tsx` tiene también `OfflineRow` (líneas 48-76). El
  comentario lo dice, pero el nombre del archivo no.
- **2.3 (Mejora).** `settings.ts` son los topes y los tiempos, y `settings.test.tsx` prueba la
  pantalla `Settings`, no `settings.ts`. Con dos «settings» distintos al lado, el nombre engaña.
- **2.4 (Mejora, carpeta).** La raíz del módulo tiene 15 archivos. Lo del aviso para instalar
  (`install-offer.ts`, `InstallOffer.tsx`, `install-offer.test.tsx`) va junto en una subcarpeta,
  como `sign-in/offline/`. Y `useSettings.ts`, que solo usa la pantalla, iría en
  `screens/Settings/`.
- Los demás comentarios de cabecera dicen lo que hace el archivo hoy y por qué existe
  (`node tools/cli.ts headers`, sin avisos).

## 3. Pruebas que miran por dentro

- **3.1 (Mejora).** `settings.test.tsx` busca por clases de CSS (`.settings-chips` en la línea 31,
  `.settings-format` en la 73) y por el atributo del teclado (`[data-key="d"]` en la 91). Las fichas
  tienen `aria-pressed` y nombre: se pueden buscar por rol (`getByRole('button', { pressed })`).
- **3.2 (Mejora).** `install-offer.test.tsx:91` mira la clave `install-offered` de `localStorage`, y
  `preferences.test.ts:19` (`saved()`) mira la forma de lo guardado. Para lo segundo hay un motivo
  (el diseño § 2 fija la forma); lo primero se comprueba desde afuera volviendo a montar el aviso
  (como hace E25).
- **3.3 (Mejora).** `frame/frame-test-kit.tsx:65-71` (`withoutScreens`) le saca el `path` a dos
  opciones del menú real para simular que no existen. Depende de los ids `users` y `deviceSettings`;
  cada módulo nuevo con pantalla obliga a tocarlo.
- **3.4 (Mejora).** `preferences.test.ts:90`: `of: { __proto__: { animations: false } }` escrito como
  literal de JS no crea una clave `__proto__`, sino que cambia el prototipo, y `JSON.stringify` da
  `{}`. El caso de `__proto__` en `of` pasa siempre, sin probar nada: hay que escribirlo como texto
  JSON (`'{"order":["__proto__"],"of":{"__proto__":{…}}}'`).

## 4. El diseño

- **4.1 · Sin conexión (Frena).** El diseño (§ 3 y § 10, «Sin conexión») pone la pantalla en el
  arranque para que abra sin red después de una versión nueva, y pide la prueba: «Configuración abre
  sin red después de una versión nueva, y “Trabajar sin conexión” se apaga». No está:
  `tests/e2e/offline.spec.ts` solo la prende desde Configuración, con red. En el armado que hice,
  `settings-*.js` está precargado por la página y entra en el esqueleto que guarda
  `platform/offline/worker.ts`, así que hoy debería andar. Pero depende de cómo parta Vite los
  pedazos, que ya cambió una vez en este módulo.
- **4.2 (Mejora).** `index.ts:4-6` exporta `watchPreferences`, que llama `main.tsx:15`. El diseño
  (§ 5 y § 11.3) dice `applyPreferences(person)` para `App.tsx`. El código sigue a la persona por
  `person.subscribe`, que es mejor; el que quedó atrás es el diseño (8.1).
- **4.3 (Mejora).** «Lo tuyo» (`Settings.tsx:59`) muestra una tostada y no sacude. El diseño § 6 dice
  «tocarlos los sacude, como el resto de lo que falta», y el § 5, que dice con una tostada. En el
  marco, lo que falta hace las dos cosas (`notYet` en `frame/context.ts`), y el plan (§ 11.4) era usar
  `notYet` por la fachada del marco.
- **4.4 (Mejora).** El diseño § 9.4 habla de `manifest-production.webmanifest` y
  `manifest-testing.webmanifest`. Hoy el de producción es `public/manifest.webmanifest`, el de pruebas
  lo arma un plugin (`vite.config.ts:43-59`) y Caddy lo reescribe solo si
  `ENVIRONMENT == "testing"` (`deploy/Caddyfile:80-86`). Está bien; el que quedó atrás es el diseño.
- **4.5 (Mejora).** `related_applications` lleva una dirección relativa
  (`public/manifest.webmanifest:10`, `"/manifest.webmanifest"`). El diseño (§ 4) dice «su dirección
  completa». No pude comprobar si Chrome y Edge la resuelven contra el manifiesto para
  `getInstalledRelatedApps()`. Si no, E22 no anda en la computadora y el renglón desaparece (cae en
  E24, sin error).
- **4.6 (Mejora).** El diseño (§ 4) dice que la regla de `base.css` es «un solo mecanismo para los dos
  casos». Sale la de `base.css`, pero siguen muchas `@media (prefers-reduced-motion: no-preference)`
  por pantalla (`frame/notices/notices.css:141`, `ui/dialog/dialog.css:22`, `ui/toast/toast.css:37`,
  `ui/switch/switch.css:39` y otras). Cuando lo pide el sistema, la barra de avance
  (`notices.css:142-144`) se queda quieta y la marca del botón gira (`ui/button/button.css:98`, sin
  `@media`). Con la persona apagándolas, las dos se mueven. R2.2 y R2.3 no dicen qué pasa con la
  espera cuando lo pide el sistema: hay que decidirlo y dejarlo igual en las dos.
- **4.7 (Mejora).** Metas de performance: cero pedidos (`askInstalled` no va a la red) y el arranque,
  dentro del tope (70,4 KB con gzip en mi armado). No hay ninguna prueba que cuente los pedidos al
  abrir Configuración. El diseño no la pide en § 10, pero la meta del § 8 dice «cero pedidos».
- Lo demás coincide: ni tablas, ni rutas, ni eventos en el servidor; `/device-settings` en
  `frame/menu.ts:87`; «Trabajar sin conexión» sale del marco y pasa por la fachada de `sign-in`
  (`OfflineRow`), sin ciclo; Alt D, Alt H, Alt I y Alt O como en § 6; la hoja trabada; y las
  capas de CSS fijas en cada hoja armada (comprobado en el armado: `Sheet-*.css` empieza con
  `@layer base, pieces, screens, widths;`).

## 5. Seguridad

Cada punto del § 7 del diseño:

- **Datos:** `preferences` guarda por UUID y sin horas (`preferences.ts:17`), y además
  `installed` e `install-offered`. Como dice el diseño. Salir no borra las preferencias, como pide
  R1.3 (`sign-in/session.ts` solo borra la sesión).
- **Quién puede:** Configuración no tiene `permission` en `menu.ts:82-89`; «Trabajar sin conexión»
  se prende solo con `offline` del servidor (`sign-in/offline/setting.ts:30-37`), y la marca de huella
  del celular solo elige el texto. Lo prueba `offline-screens.test.tsx` (E30, E37): la llave tocada no
  reemplaza la opción de Ana.
- **Lo que entra de afuera:** se valida al leer: UUID, `Object.hasOwn`, `zod/mini` y el tope al leer
  (`preferences.ts:19-45`). Ver 3.4: el caso de `__proto__` dentro de `of` no está probado de verdad,
  aunque el código lo cubre con `Object.hasOwn`.
- **Lo que se ve de otros:** solo identificadores, en orden y sin horas, con un tope de 20. Como dice
  el diseño.
- **Instalar:** el mismo origen y el mismo service worker; `related_applications` nombra solo su
  manifiesto (ver 4.5).
- **El ambiente de pruebas (Mejora):** el aviso no sale fuera de producción (`App.tsx`,
  `testing = environment !== 'production'`; prueba E39). El manifiesto de pruebas sale del armado
  (comprobado). La reescritura de Caddy (`deploy/Caddyfile:80-86`) y la variable del compose
  (`deploy/compose.yml:13-15`) no los pude comprobar: no hay ninguna prueba que pida
  `/manifest.webmanifest` en pruebas y vea «Ferrebress pruebas». `tests/itest`, o una prueba de
  `deploy/`, lo podrían cubrir.
- **Secretos y auditoría:** ninguno, como dice el diseño.

## 6. Reglas inventadas

- El aviso tarda 1 s en aparecer (`settings.ts:9`, `offerAfterMs`). Ninguna regla lo pide; el diseño
  lo nombra (§ 5). Está bien, pero falta escribirlo en el diseño con su valor.
- **Configuración pasó a ser la primera opción** para quien no tiene Usuarios (`permissions.test.tsx`:
  «Te llevo a Configuración»). Es lo que dice 00 · R1.4 (la primera opción que existe), no una regla
  nueva. Pero quien no es Administrador abre ahora la aplicación en Configuración: conviene que
  Carlos lo sepa.
- Ninguna otra.

## 7. Simpleza y repetición

- **7.1 (Mejora).** `platform/time.ts:14-21` crea un `Intl.DateTimeFormat` nuevo en cada llamada.
  Antes, `audit-log/logic.ts` usaba uno solo; ahora la lista de Quién hizo qué crea uno por renglón.
  Alcanza con guardar los cuatro (dos formatos, con y sin minutos).
- **7.2 (Mejora).** `tools/cli.ts:26` corre el control de las horas dentro de `html`. El nombre no
  dice lo que controla: iría en una entrada propia (`times`), o con un nombre que lo diga.
- **7.3 (Mejora).** `texts.ts:48`, `install.done: 'Listo'`, no se usa (salió con el «Listo» del
  diseño).
- **7.4 (Mejora).** El aviso para instalar depende de lo que carga Configuración: usa la clase
  `settings-chip` de `Settings.css` (`InstallSheet.tsx:45,49`) y los íconos `zap` y `download` que
  suma `Settings.tsx:18`. Si Configuración dejara de ir en el arranque, el aviso se vería roto. La
  pastilla iría a `ui/`, y la hoja sumaría sus íconos.
- **7.5 (Mejora).** `useSettings.ts:29`, `who?.userId ?? ''`: sin persona guardaría bajo `''`. Hoy no
  pasa, porque la pantalla solo existe con sesión, pero el `''` lo esconde. Sería más claro no
  devolver `set` ni `reset` sin persona.
- **7.6 (Mejora).** `rules.ts:30-39`, `OfferCase.signedIn`: `App.tsx` monta `InstallOffer` solo con
  `who`, así que siempre es `true`. Una de las dos sobra.
- **7.7 (Mejora).** «Instalar» con «aceptado» hace casi lo mismo en dos lugares:
  `useSettings.ts:16-20` (tostada y vibración) e `InstallSheet.tsx:30-31` (tostada sin vibración).
  Hacen falta un solo camino y la misma respuesta (ver 9.4).

## 8. Documentación que quedó atrás

- **8.1 (Mejora).** El diseño: `applyPreferences` en `App.tsx` (§ 5 y § 11.3; hoy es
  `watchPreferences` en `main.tsx`); «tocarlos los sacude» (§ 6) y la tabla de pruebas, «“Pronto” se
  sacude» (§ 10); los nombres de los manifiestos (§ 9.4); el ejemplo de las horas sueltas, «8»
  (§ 4): `formatHour` da «08» (`device-link/.../screens.test.tsx` espera «09»); y el valor del tiempo
  del aviso (§ 5).
- **8.2 (Mejora, contradicción en las reglas).** `rules.md:50-52` (R1.11) y `rules.md:150-152` (E33)
  dicen que «Volver a como viene» deja el formato en «Como el sistema». R3.4 (línea 71) dice que esa
  opción no existe. El código deja «24 horas». Hay que corregir R1.11 y E33.
- **8.3 (Mejora).** Las horas pasaron de «9:05» a «09:05» en 24 horas (`es-AR` con `h23` escribe dos
  cifras): `sign-in/offline/when.ts`, la tarjeta de Usuarios y el detalle del vínculo. 15 · R2.1
  (`15-offline/rules.md:36`) sigue con el ejemplo «el martes 9:40». O se cambia el ejemplo, o se pide
  la hora con una cifra.
- **8.4 (Mejora).** `tests/screens/playwright.config.ts:24` saca todas las capturas con «reducir
  movimiento». Por eso las de Configuración muestran «Este dispositivo ya pide no animar» y «En el
  acto», que no es como abre la pantalla para casi nadie. Ningún documento lo dice (ver 9.1).

## 9. Pantallas

Comparé las capturas de referencia (`tests/screens/references/settings-desktop.png`,
`settings-phone.png`, `settings-phone-offline-on.png` e `install-sheet-phone.png`) con las finales.
No las volví a sacar.

- **9.1 (Mejora).** No hay ninguna captura de Configuración como abre normalmente (con movimiento y
  sin el aviso del sistema): todas tienen «reducir movimiento» (8.4). Falta la de la maqueta
  `screenshot.png` y `screenshot-phone.png`, y la de `screenshot-changed.png` (apagadas, a. m./p. m.
  y «Volver a como viene»).
- **9.2 (Mejora), en la computadora:** falta «Más › Configuración» arriba del título, y el círculo con
  las iniciales en «Solo para vos». Usuarios tampoco tiene la ruta de arriba, así que puede ser una
  decisión del marco; no lo encontré escrito.
- **9.3 (Mejora), en el celular:** falta «‹ Más» arriba del título; las preferencias van en una sola
  tarjeta (en la maqueta, una por preferencia); «Así se mueve ahora.» no va en negrita; y falta el
  círculo con las iniciales.
- **9.4 (Mejora), el aviso para instalar:** el título va centrado y en verde (en la maqueta, alineado
  a la izquierda y en el color del texto); falta «Ferrebress» debajo del ícono; «Pantalla completa»
  usa `monitor` (en la maqueta, las flechas de agrandar). Al aceptar, la maqueta muestra «Listo: ya
  está en tu pantalla de inicio» en la hoja, con el tilde y la vibración 10-40-10, antes de la
  tostada. El código cierra la hoja y muestra la tostada, sin vibrar. El diseño sacó el «Listo» a
  propósito, pero la vibración sigue en la maqueta y en Configuración: solo falta en el aviso.
- **9.5.** Las horas: tres fichas en la maqueta («Como el sistema») y dos en el código. Es la regla
  R3.4, que vale más que la maqueta. Está bien.

## 10. Lo que se podría extraer a una librería

El módulo agregó y cambió partes no funcionales. Cada una:

- **`src/app/platform/motion.ts` y la regla de `styles/base.css`** (apagar el movimiento por la persona
  o el sistema, con `data-motion` y `.keeps-moving`).
  - **¿Sirve a otro proyecto?** Sí, tal cual.
  - **Qué la ata a Ferrebress:** nada en `motion.ts`. La regla de CSS vive en el `base.css` de
    Ferrebress, mezclada con otras.
  - **Grupo:** base de la aplicación (con la regla de CSS, en piezas visuales).
  - **El cambio chico:** mover la regla a un `motion.css` propio, al lado de `motion.ts`.
- **`src/app/platform/time.ts`** (escribir la hora con el formato elegido, en una zona fija).
  - **¿Sirve a otro proyecto?** Sí, si tiene una zona del negocio.
  - **Qué la ata a Ferrebress:** importa `businessTimeZone` de `@ferrebress/shared` y fija `es-AR`.
  - **Grupo:** base de la aplicación.
  - **El cambio chico:** recibir la zona y el idioma al configurarse, en vez de importarlos.
- **`src/app/platform/install.ts`** (`beforeinstallprompt`, `appinstalled`, `display-mode`,
  `getInstalledRelatedApps`, iPhone).
  - **¿Sirve a otro proyecto?** Sí, a cualquier aplicación instalable.
  - **Qué la ata a Ferrebress:** solo la clave `installed` en `localStorage`.
  - **Grupo:** base de la aplicación (sin conexión e instalación).
  - **El cambio chico:** un prefijo de claves configurable.
- **`ui/sheet/Sheet.tsx` con `locked`.**
  - **¿Sirve a otro proyecto?** Sí.
  - **Qué la ata a Ferrebress:** nada.
  - **Grupo:** piezas visuales.
  - **El cambio chico:** que `locked` también frene «atrás» (hoy lo maneja cada hoja con
    `useBackStep`, ver 1.5). Así la pieza queda completa.
- **`ui/button/Button.tsx` con `keeps-moving` mientras espera.**
  - **¿Sirve a otro proyecto?** Sí, junto con `motion.ts`.
  - **Qué la ata a Ferrebress:** nada.
  - **Grupo:** piezas visuales.
  - **El cambio chico:** ninguno.
- **`vite.config.ts`, `layersFirst()`** (repetir el orden de las capas en cada hoja de CSS armada).
  - **¿Sirve a otro proyecto?** Sí, a cualquier proyecto con `@layer` y CSS partido.
  - **Qué la ata a Ferrebress:** los nombres de las capas, escritos en el plugin.
  - **Grupo:** calidad o despliegue (armado).
  - **El cambio chico:** sacarlo a `tools/` con el orden como parámetro, o leerlo de `base.css`.
- **`vite.config.ts`, `testingManifest()`, `deploy/Caddyfile:80-86` y `deploy/compose.yml:13-15`**
  (un manifiesto por ambiente).
  - **¿Sirve a otro proyecto?** Sí, a cualquiera con ambiente de pruebas.
  - **Qué la ata a Ferrebress:** el nombre «Ferrebress pruebas», escrito en el plugin.
  - **Grupo:** despliegue.
  - **El cambio chico:** armar el nombre como `${name} pruebas` desde el manifiesto.
- **`tools/checks/loose-times.ts`** (las horas se escriben en un solo lugar).
  - **¿Sirve a otro proyecto?** Sí, con el mismo `platform/time.ts`.
  - **Qué la ata a Ferrebress:** la ruta `src/app/platform/time.ts`, fija.
  - **Grupo:** calidad.
  - **El cambio chico:** recibir la ruta, y un nombre de control propio (7.2).

**Hoy no conviene extraer nada:** son piezas chicas y recién hechas. `time.ts` y la hoja todavía
tienen que cambiar (1.2, 1.5 y 7.1), y no hay un segundo proyecto que las pida. Conviene hacer los
cambios chicos de arriba al tocarlas.
