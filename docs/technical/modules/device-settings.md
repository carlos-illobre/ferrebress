# Diseño técnico · 04 · Configuración del dispositivo (`device-settings`), etapa a: preferencias del dispositivo

Implementa la etapa a del [capítulo 04](../../chapters/04-device-settings/rules.md): Más →
Configuración con las animaciones, el formato de la hora, instalar y «Trabajar sin conexión», y el
aviso para instalar del celular. La etapa b (lo mío) tiene su propio diseño cuando le toque.
Corregido con sus dos revisiones ([diseño](device-settings-design-review.md),
[seguridad](device-settings-security-review.md)).

## 1. Qué resuelve

Las reglas R1 a R5 del capítulo 04 y sus escenarios E01 a E36, los cambios que trajo en 00 · R8.5,
03 · R6.2 y 15 · R1, y las dos pantallas aprobadas:
[`mockups/device-settings-a/final/`](../../design/mockups/device-settings-a/final/) y
[`mockups/device-settings-install/final/`](../../design/mockups/device-settings-install/final/).

**La idea técnica:** todo es de la aplicación. **El servidor no cambia:** no hay tablas, rutas,
eventos ni auditoría nuevos (R1.7). Lo que no es del negocio y puede servir a cualquier
aplicación (apagar el movimiento, escribir la hora, instalar) va a `platform/`; el módulo
`device-settings` solo guarda lo elegido por persona, lo aplica y dibuja la pantalla.

## 2. Entidades

Ninguna en PostgreSQL. En el dispositivo, en `localStorage` con `platform/device/storage.ts` (que
ya sigue sin guardar si el navegador no deja, R1.5):

| Clave | Qué guarda | De quién |
|---|---|---|
| `preferences` | `{ order: userId[], of: { [userId]: { animations: boolean, timeFormat: 'h24' \| 'h12' } } }`: lo que eligió cada persona en este dispositivo. `order` va de la última que cambió algo a la más vieja; no se guarda ninguna hora. Una persona sin fila tiene lo de arranque | De cada persona (R1.3) |
| `install` | `{ offered: boolean, installed: boolean }`: si ya se ofreció el aviso para instalar y si el navegador avisó que se instaló | Del dispositivo (R4.5) |

- **Tope:** como mucho `maxPeople` (20) personas; al pasarse, sale la última de `order`. El tope se
  aplica también al leer.
- **Lo de arranque** no se guarda: «Volver a como viene» borra la fila de la persona.
- **Se valida al leer,** con `platform/schema.ts`: solo claves con forma de UUID, leídas con
  `Object.hasOwn`; cada valor, uno de los esperados. Lo que no pasa se toma como lo de arranque; un
  JSON roto, como si no hubiera nada.
- **Nada es secreto ni del negocio:** el identificador de la persona ya está guardado con la
  sesión (diseño de 01, § 2).

## 3. API, eventos, conexiones y sin conexión

- **API:** ninguna ruta nueva. «Trabajar sin conexión» sigue con lo que ya existe (diseño de 15).
- **Eventos y auditoría:** ninguno (R1.7, E09).
- **Conexiones:** nada de `realtime`. **Ningún pedido automático nuevo:** nada que anotar en
  [mobile-data.md](../mobile-data.md).
- **Sin conexión, Configuración abre igual** (`what-needs-internet.md`), también para apagar
  «Trabajar sin conexión» sin red, como hoy desde Más. Por eso **la pantalla va en el arranque**, no
  se baja aparte: el service worker borra lo que no es del arranque con cada versión nueva, y una
  pantalla bajada aparte no abriría sin red hasta volver a pedirse. El aviso para instalar sí se baja
  aparte: sin red no se puede instalar.

## 4. La plataforma: lo que sirve a cualquier aplicación

Tres archivos nuevos en `src/app/platform/` y un cambio en `ui/sheet`, sin nada de Ferrebress ni del
negocio. Es código común: una tarea propia que se toma antes (constitución, «Trabajo en paralelo»).

### `platform/motion.ts`: apagar el movimiento (R2)

- Un `Store<boolean>` `motionOff` que pone el módulo (§ 5). Al cambiar, pone o saca
  `data-motion="off"` en `<html>`, en el momento (R1.4).
- **Un solo mecanismo para los dos casos.** `motion.ts` escucha también al sistema (`matchMedia`,
  también si cambia con la pantalla abierta) y pone el mismo atributo si cualquiera de los dos pide
  no animar. `still()` dice lo mismo para el código. La regla de `base.css` que hoy mira al sistema
  sale: dentro de la capa `base` y sin `!important`, no le gana a las capas siguientes.
- **El CSS**, en `styles/base.css`, capa `base`, con `!important`, que en las capas de CSS gana desde
  la primera capa a todas las siguientes:

  ```css
  :root[data-motion="off"] *:not(.keeps-moving),
  :root[data-motion="off"] *:not(.keeps-moving)::before,
  :root[data-motion="off"] *:not(.keeps-moving)::after {
    animation: none !important;
    transition: none !important;
    scroll-behavior: auto !important;
  }
  ```

  Sin `:where()`, que no alcanza a los pseudoelementos. Las que siguen (R2.2) llevan
  `keeps-moving` **en el elemento que se mueve**, y la regla lo excluye con sus `::before` y
  `::after`: el botón mientras espera (su marca es un `::after`), y las dos barras de
  `frame/notices/`.
- **Lo hecho en código** pregunta a `still()`: `frame/behavior/useCollapse.ts`, el desplazamiento suave
  de `users/screens/Card/Phone.tsx` (`behavior: 'auto'` si `still()`) y `manual/screens/Stage/Clip.tsx`.
  El clip del manual es contenido (muestra cómo se hace algo), no adorno: con las animaciones
  apagadas se reproduce igual, y queda quieto solo si el sistema pide no animar, como hoy.
- **Ningún paso del código espera el fin de una animación** (hoy no hay `animationend` ni
  `transitionend`): apagarlas no deja nada a medio hacer.
- **Se aplica antes del primer dibujo.** `main.tsx` lee la preferencia de la última persona guardada
  en la sesión y pone el atributo antes de dibujar, para que las animaciones de entrada no arranquen y
  se corten.

### `platform/time.ts`: escribir la hora (R3)

- Un `Store` `timeFormat` (como el glosario) que pone el módulo.
- `formatTime(instant)`: la hora en **la zona del negocio** (`shared/time/business.ts`), en `es-AR`,
  con `hourCycle: 'h23'` para «24 horas» y `'h12'` para «a. m./p. m.».
- **Las horas sueltas** (las marcas de las tiras de Quién hizo qué y del vínculo, «8», «12») salen de
  `formatHour(instant)`: «14» con 24 horas, «2 p. m.» con a. m./p. m.
- **Todos los lugares que escriben horas pasan a `formatTime`:** Quién hizo qué
  (`audit-log/logic.ts`), la tarjeta de Usuarios (`users/logic.ts`, «hoy 7:58»), el detalle del vínculo
  (`device-link/screens/Detail/texts.ts`), «Algo salió mal» (`frame/notices/crash/CrashDialog.tsx`) y
  hasta cuándo se puede entrar sin conexión (`sign-in/offline/when.ts`, solo el texto: el plazo se
  calcula igual). Tres de ellos hoy usan `getHours()`, con la zona del dispositivo y no la del negocio:
  pasar a `formatTime` además los ajusta a 00 · R8.4.
- **Un control en `pnpm lint`** impide escribir horas fuera de `platform/time.ts`: `hour:`,
  `hourCycle`, `toLocaleTimeString`, `getHours` y `getUTCHours`.
- **La hora de ahora** de las fichas de Configuración sale del reloj del servidor
  (`platform/server/clock.ts`), y de la del dispositivo solo si el servidor todavía no dijo la suya.
- Las pantallas leen el formato al dibujarse. Al cambiarlo, la única a la vista es Configuración,
  que lo muestra en el momento; las demás lo toman al abrirse (E18). Ninguna guarda horas ya escritas:
  guardan instantes.

**No hay «Como el sistema» (04 · R3.4).** Los navegadores no dejan leer la llave de 24 horas del
celular ni de Windows: dan el formato del idioma, con los datos de Unicode (CLDR). Comprobado en
Chromium: en castellano de Argentina, el del idioma es «2:30 p. m.». Por eso hay dos opciones y arranca
en 24 horas.

### `platform/install.ts`: instalar (R4)

- **Escucha `beforeinstallprompt` desde el arranque** (`main.tsx`, antes de dibujar), porque el
  navegador lo manda una sola vez y temprano. Lo guarda y llama a `preventDefault()`, para que el
  navegador no muestre su propio cartel encima del aviso de la aplicación.
- Un `Store` `installState`: `'can'` (llegó el evento), `'installed-here'` (abierta desde el ícono:
  `display-mode: standalone`, o `navigator.standalone` en el iPhone), `'installed'` (instalada y
  abierta en el navegador), `'ios'` (iPhone o iPad en Safari, sin el ícono) o `'cannot'`.
- **Saber que está instalada y se abrió en el navegador (R4.2)** tiene dos fuentes:
  - `navigator.getInstalledRelatedApps()`, con el manifiesto que se nombra a sí mismo en
    `related_applications` (`platform: "webapp"`, su dirección completa y su `id`). El manifiesto
    suma `"id": "/"`. En Chrome en Android anda; en la computadora, desde Chrome y Edge 140.
  - el evento `appinstalled`, que deja `installed: true` en lo guardado. Si después vuelve a llegar
    `beforeinstallprompt`, es que la desinstalaron desde el sistema: vuelve a `false`.

  Si ninguna de las dos lo sabe, el renglón no aparece (como E24): nunca dice «Instalar» si no se
  puede.
- `install()`: llama a `prompt()` del evento guardado y devuelve `'accepted'` o `'dismissed'`. El
  evento sirve una sola vez.
- Nada pide a la red.

### `ui/sheet`: trabarla

La hoja suma la propiedad `locked`: mientras está, no se cierra al bajarla, al tocar afuera ni con
«atrás». La usa el aviso mientras contesta el navegador.

## 5. El módulo de la aplicación: `src/app/modules/device-settings/`

| Archivo | Qué hace |
|---|---|
| `index.ts` | La fachada: la pantalla, `applyPreferences(person)` para `App.tsx` y el aviso para instalar (lazy) |
| `preferences.ts` | Lo guardado por persona (§ 2): leer y validar, cambiar, volver a como viene, el tope. Al cambiar la persona de la sesión (o no haber nadie, en la entrada) pone `motionOff` y `timeFormat` con lo suyo o lo de arranque (R1.3, E05) |
| `rules.ts` | La regla pura: lo de arranque, si algo cambió de lo de arranque (R1.11), el resumen de «Así la tenés» (R1.10, que con el sistema pidiendo no animar dice «En el acto»), qué renglón de instalar toca (R4) y qué estado tiene «Trabajar sin conexión» (R5) |
| `install-offer.ts` | Si toca mostrar el aviso: celular, con sesión, en producción, `installState` en `'can'`, nunca ofrecido y sin otra hoja abierta. Cerrado de cualquier forma, `offered: true` (R4.5, E36) |
| `texts.ts` | Los textos, largos en la computadora y cortos en el celular |
| `settings.ts` | `maxPeople`, lo que tarda el aviso en aparecer después de llegar al marco y lo que dura «Listo» |
| `screens/Settings/` | La pantalla de Configuración |
| `screens/InstallSheet/` | El aviso para instalar |

**«Trabajar sin conexión» se muda (R5).** Hoy `sign-in/offline/setting.ts` arma el renglón y el
marco lo dibuja en Más. Pasa a dibujarse en Configuración, y el renglón tiene tres estados que salen
solo de la persona:

| La persona | El renglón |
|---|---|
| Sin el permiso `offline.work` | No aparece (R5.2) |
| Con el permiso y con `offline` del servidor (su huella en este celular) | La llave, como hoy |
| Con el permiso y sin `offline` | Apagado, sin poder prenderlo, con su texto (R5.3) |

**La llave se prende solo con `offline` del servidor,** que es quien sabe de quién es la huella del
celular. La marca de huella guardada en el celular no decide nada: es del celular, no de la persona,
y con ella alguien con el permiso podría reemplazar la opción de la dueña de la huella sin que se
entere. El tercer estado cubre también el celular con la huella de otra persona; su texto lo decide
Carlos (§ 9).

**Dónde vive cada cosa:** el tipo `SettingRow` pasa a `device-settings` y `sign-in` exporta por su
fachada `useOfflineSetting`, que lo cumple; `App.tsx` le pasa el renglón a la pantalla, como hoy se lo
pasa al marco. Así ni `sign-in` importa a `device-settings` ni al revés, y no hay ciclo. El marco deja
de dibujarlo: salen `setting` de `FrameState` y el renglón de `PhoneMore`. La sacudida de lo que falta
(`notYet`, `shake`) sale por la fachada del marco.

**El menú:** la opción `deviceSettings` de `frame/menu.ts` pasa a tener su dirección,
`/device-settings`, y deja de decir «Pronto». Su detalle dice «Lo tuyo, en este dispositivo».

## 6. Pantallas

### Configuración (`screens/Settings/`)

Desde la final aprobada, una sola pantalla para los dos anchos (ADR-002):

- **Arriba:** el título, «Solo para vos, en este…» y «Así la tenés» con una pastilla por
  preferencia. Tocar una pastilla lleva a su renglón: es local, no se espeja. «Volver a como viene»,
  a la derecha del título, solo si algo cambió; al tocarlo, la tostada «Volvió a como viene».
- **«En este dispositivo»:** «Animaciones» (llave, con su muestra y el aviso del sistema), «Formato
  de la hora» (fichas, con la hora de ahora en cada una y «Se ve así en Quién hizo qué»),
  «Instalar» (botón, texto o nada, § 4) y, en el celular, «Trabajar sin conexión». Al instalar desde
  acá, el botón dice «Listo» un instante, con una vibración corta en el celular, y la tostada lo
  confirma, como en la maqueta.
- **«Lo tuyo»:** los cuatro renglones de la etapa b con «Pronto»; tocarlos los sacude, como el resto
  de lo que falta.
- **Teclado (R1.9):** Alt M para «Animaciones», Alt H para el formato (pasa al siguiente), Alt I para
  instalar y Alt O para «Volver a como viene». **La maqueta usa Alt A, que ya es una opción de Más:**
  se propone M (de «movimiento») y Carlos lo aprobó (§ 9). Las pastillas de «Así la tenés» y los
  renglones de «Pronto» se alcanzan con Tab y las flechas, sin tecla propia. En las fichas, las
  flechas; Espacio cambia la llave.

**El espejo (R1.6).** Ir a `/device-settings` se espeja como cualquier dirección. Los valores no van
en `useMirrored`: se leen y se cambian con los `Store` del módulo, que son de ese dispositivo. Así el
otro dispositivo abre la pantalla con lo suyo, y lo que se toca no viaja. Un comentario en la
pantalla dice por qué (architecture.md, «Lo que se ve vive en valores con nombre»).

### El aviso para instalar (`screens/InstallSheet/`)

- La hoja de `ui/sheet`, sobre el marco, con el inicio en chico, el título, las dos pastillas,
  «Instalar» y «Ahora no». Se cierra al bajarla, al tocar afuera y, con `useBackStep`, con «atrás».
- **Es del dispositivo, no se espeja:** su estado es local, como la cámara. Si los dos están
  vinculados, solo la ve el celular.
- Aparece una vez llegado al marco, si `install-offer.ts` dice que toca (E25). **Al abrirse ya queda
  `offered: true`:** si la persona cierra la aplicación con la hoja abierta, tampoco vuelve.
- **Con otra hoja abierta, espera.** En la primera entrada del celular, el ofrecimiento de la huella
  va primero (§ 9); el aviso aparece al cerrarse esa hoja, o en la próxima llegada al marco.
- «Instalar» pide al navegador y, mientras contesta, la hoja queda trabada (`locked`). Si acepta, el
  botón dice «Listo» y la hoja se cierra (E26). Si cancela o se cierra de cualquier otra forma, se
  cierra con la tostada «Si cambiás de idea, está en Más → Configuración» (R4.5, E36).
- En la computadora nunca aparece (E27).

## 7. Seguridad

- **Datos que toca:** en el dispositivo, las preferencias de cada persona que entró en él, por su
  identificador y en el orden en que las cambiaron (sin horas), y dos marcas del dispositivo. Nada del
  negocio, nada secreto, nada nuevo en el servidor.
- **Quién puede:** cualquiera con sesión, sin permiso (02 · R7.2). «Trabajar sin conexión» se prende
  solo con `offline` del servidor (§ 5): mudarlo de lugar no cambia quién puede, y nadie puede
  reemplazar la opción de la dueña de la huella del celular.
- **Qué entra de afuera:** lo guardado en `localStorage`, que cualquiera con el dispositivo puede
  cambiar. Se valida al leerlo (§ 2). Lo peor que logra quien lo toque es cambiar cómo se ve la
  aplicación en ese dispositivo.
- **Lo que se ve de otros:** en una computadora compartida, quien abra la depuración del navegador ve
  qué identificadores entraron ahí y en qué orden cambiaron algo, nada más: ni horas, ni nombres, ni
  correos. El tope de 20 lo acota.
- **Instalar:** la aplicación instalada es la misma, con el mismo dominio, las mismas cabeceras y el
  mismo service worker. `related_applications` nombra solo su propio manifiesto.
- **El ambiente de pruebas:** el manifiesto es el mismo en los dos ambientes, con el mismo nombre e
  ícono. Un vendedor podría tener dos íconos iguales y cargar ventas en el de pruebas: en pruebas el
  aviso no aparece y la instalada se llama «Ferrebress pruebas» (§ 9).
- **Secretos:** ninguno.
- **Auditoría:** nada (R1.7). «Trabajar sin conexión» anota lo que ya anotaba.

## 8. Metas de performance

- **Cero pedidos** al servidor por esta etapa, también al abrir Configuración.
- Cambiar una preferencia se ve en menos de 16 ms (un cuadro): es poner un atributo en `<html>` o
  volver a dibujar una pantalla.
- Lo guardado: menos de 1 KB con 20 personas.
- **El arranque** suma `motion.ts`, `time.ts`, `install.ts`, las preferencias y la pantalla de
  Configuración: unos 8 KB, sobre los 44 de hoy, dentro del tope de 64 KB que controla `pnpm boot`. El
  aviso para instalar se baja aparte.

## 9. Lo que decidió Carlos

1. **Sin «Como el sistema»:** dos opciones y arranca en 24 horas (04 · R3.1, R3.4).
2. **El celular con la huella de otra persona** dice «Este celular tiene la huella de otra persona:
   solo ella puede trabajar sin conexión acá.» (R5.3); el texto lo elige la marca de huella del
   celular, que no decide nada más.
3. **Dos hojas a la vez:** primero la huella, después el aviso para instalar (R4.6).
4. **El ambiente de pruebas:** sin el aviso, y la instalada se llama «Ferrebress pruebas» (R4.7). El
   armado lleva dos manifiestos, `manifest-production.webmanifest` y `manifest-testing.webmanifest`
   (que dice «Ferrebress pruebas»), y Caddy sirve `/manifest.webmanifest` desde el del ambiente
   (`rewrite` con `{$ENVIRONMENT}`, que el compose le pasa al contenedor web desde el mismo `.env`).
   La aplicación ya sabe su ambiente por `/api/start` para no mostrar el aviso.
5. **Alt M** para «Animaciones».

## 10. Pruebas

Las unitarias nombran el escenario (`device-settings-E01`). No hace falta ninguna de punta a punta
nueva: nada pasa por el servidor, y lo que solo el navegador de verdad puede mostrar (el movimiento
apagado, la hoja sobre el marco) lo cubren las capturas. Instalar de verdad no se puede probar en un
navegador sin pantalla: el evento del navegador se simula.

| Escenarios | Prueba |
|---|---|
| E01, E10, E11 | Unitarias de la pantalla: está para cualquiera; «Pronto» se sacude; las teclas con Alt |
| E02 a E06, E09 | Unitarias de `preferences.ts`: por persona, la entrada con lo de arranque, el tope, sin poder guardar |
| E07, E08 | Unitarias con dos dispositivos falsos, como las del espejo de 03: la dirección viaja; ninguna clave del módulo ni el aviso pasan por el canal |
| E12 a E15, E35 | Unitarias de `motion.ts` y de la pantalla; capturas de Configuración con el movimiento apagado (con la marca de espera y la barra moviéndose) y con el sistema pidiendo no animar |
| E16 a E19 | Unitarias de `time.ts` con cada formato, en la zona del negocio, y de los cinco lugares que escriben horas |
| E20 a E24 | Unitarias de `install.ts` con `beforeinstallprompt`, `display-mode` y `getInstalledRelatedApps` simulados |
| E25 a E27, E36 | Unitarias de `install-offer.ts` y de la hoja (trabada mientras contesta; con otra hoja abierta, espera); captura del aviso sobre Vender en el celular |
| E28 a E31 | Unitarias del renglón en sus tres estados y de que Más ya no lo muestra; capturas |
| E32 a E34 | Unitarias de `rules.ts` y de la pantalla |
| Sin conexión | Configuración abre sin red después de una versión nueva, y «Trabajar sin conexión» se apaga |
| Seguridad | Con el permiso, la huella de otra persona en el celular y la llave tocada, la opción guardada no cambia; lo guardado roto, con `__proto__`, con claves que no son UUID o con más de 20 filas se toma bien |

## 11. Tareas

1. **El código común** (tomar «Código común» en el plan antes): `platform/motion.ts` con la regla de
   `base.css`, `keeps-moving` y lo hecho en código con `still()`; `platform/time.ts` y su control en
   `pnpm lint`; `platform/install.ts` con `id` y `related_applications` en el manifiesto; `locked` en
   `ui/sheet`.
2. `[P]` Los cinco lugares que escriben horas pasan a `formatTime` y `formatHour`. Depende de 1.
3. `[P]` El módulo sin pantallas: `preferences.ts`, `rules.ts`, `install-offer.ts`, `settings.ts`,
   `texts.ts`, `applyPreferences` en `App.tsx` y la preferencia antes del primer dibujo en `main.tsx`.
   Depende de 1.
4. `sign-in` y el marco: el renglón con sus tres estados por la fachada; sale de Más; `notYet` por la
   fachada del marco; el menú con su dirección. Depende de 3.
5. Las pantallas: Configuración (en el arranque) y el aviso para instalar, con sus capturas. Depende de
   3 y 4.
6. Las revisiones del código y de seguridad (paso 7), y el manual (paso 9).
