# Diseño técnico · 04 · Configuración del dispositivo (`device-settings`), etapa a: preferencias del dispositivo

Implementa la etapa a del [capítulo 04](../../chapters/04-device-settings/rules.md): Más →
Configuración con las animaciones, el formato de la hora, instalar y «Trabajar sin conexión», y el
aviso para instalar del celular. La etapa b (lo mío) tiene su propio diseño cuando le toque.

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
| `preferences` | `{ [userId]: { animations: boolean, timeFormat: 'system' \| 'h24' \| 'h12', usedAt: number } }`: lo que eligió cada persona en este dispositivo. Una persona sin fila tiene lo de arranque | De cada persona (R1.3) |
| `install` | `{ offered: boolean, installed: boolean }`: si ya se ofreció el aviso para instalar y si el navegador avisó que se instaló | Del dispositivo (R4.5) |

- **Tope:** como mucho `maxPeople` (20) personas en `preferences`; al pasarse, se borra la de
  `usedAt` más viejo. Una computadora compartida no junta filas para siempre. El tope está en el
  `settings.ts` del módulo.
- **Lo de arranque** (animaciones prendidas, «Como el sistema») no se guarda: «Volver a como viene»
  borra la fila de la persona.
- **Nada es secreto ni del negocio:** el identificador de la persona ya está guardado con la
  sesión (diseño de 01, § 2).

## 3. API, eventos y conexiones

- **API:** ninguna ruta nueva. «Trabajar sin conexión» sigue con lo que ya existe (diseño de 15).
- **Eventos y auditoría:** ninguno (R1.7, E09).
- **Conexiones:** nada de `realtime`. **Ningún pedido automático nuevo:** nada que anotar en
  [mobile-data.md](../mobile-data.md).

## 4. La plataforma: lo que sirve a cualquier aplicación

Tres archivos nuevos en `src/app/platform/`, sin nada de Ferrebress ni del negocio. Esto toca el
código común: es una tarea propia que se toma antes, como dice la constitución, «Trabajo en
paralelo».

### `platform/motion.ts`: apagar el movimiento (R2)

- Un `Store<boolean>` `motionOff` que pone quien sabe la preferencia (el módulo, § 5). Al cambiar,
  pone o saca `data-motion="off"` en `<html>`, en el momento (R1.4).
- `systemStill()`: si el sistema pide «reducir movimiento» (`matchMedia`), y lo escucha para
  cambiar con la pantalla abierta.
- `still()`: `systemStill() || motionOff.get()`. Lo usan las dos animaciones hechas en código que hay
  hoy (`frame/behavior/useCollapse.ts` y `manual/screens/Stage/Clip.tsx`), que hoy preguntan solo al
  sistema.
- **El CSS**, en `styles/base.css`, capa `base`, con `!important`. En las capas de CSS una
  declaración `!important` de la primera capa le gana a las de las capas siguientes, así que una sola
  regla apaga el movimiento de todas las pantallas sin tocar sus archivos:

  ```css
  :root[data-motion="off"] :where(*, *::before, *::after):not(.keeps-moving) {
    animation: none !important;
    transition: none !important;
  }
  ```

  Las que siguen (R2.2) llevan la clase `keeps-moving`: la marca de espera de los botones y la
  barra de avance (`frame/notices/`). Con el sistema pidiendo no animar, sigue la regla que ya está
  en `base.css`.
- **Ningún paso del código espera el fin de una animación** (hoy no hay `animationend` ni
  `transitionend`): apagarlas no deja nada a medio hacer. Si alguno aparece, decide también con
  `still()`.

### `platform/time.ts`: escribir la hora (R3)

- Un `Store<'system' | 'h24' | 'h12'>` `hourFormat` que pone el módulo.
- `formatTime(instant, { seconds? })`: la hora en la zona del negocio
  (`shared/time/business.ts`), con `hourCycle: 'h23'` para «24 horas», `'h12'` para
  «a. m./p. m.», y sin `hourCycle` para «Como el sistema». Siempre en castellano (`es-AR`), así los
  textos son los mismos.
- **«Como el sistema» es el del idioma del navegador, no el de la llave de 24 horas del celular.** Los
  navegadores no dejan leer esa llave: dan el formato del idioma configurado. En un celular en
  castellano de Argentina da 24 horas; en uno en inglés de Estados Unidos, a. m./p. m. Es lo más
  cerca de «el del sistema» que se puede llegar; por eso existen las otras dos opciones. Se le dice
  a Carlos en la presentación del diseño.
- Las horas que hoy se escriben por su lado pasan a `formatTime`: Quién hizo qué
  (`audit-log/logic.ts`), el detalle del vínculo (`device-link/screens/Detail/texts.ts`), «Algo
  salió mal» (`frame/notices/crash/CrashDialog.tsx`) y hasta cuándo se puede entrar sin conexión
  (`sign-in/offline/when.ts`). Un control de `pnpm lint` impide usar `hour:` o `toLocaleTimeString`
  fuera de `platform/time.ts`, para que ninguna hora nueva se escape del formato.
- Las pantallas leen el formato al dibujarse. Al cambiarlo, la única a la vista es Configuración,
  que lo muestra en el momento; las demás lo toman al abrirse (E18).

### `platform/install.ts`: instalar (R4)

- **Escucha `beforeinstallprompt` desde el arranque** (`main.tsx`, antes de dibujar), porque el
  navegador lo manda una sola vez y temprano. Lo guarda y llama a `preventDefault()`, para que el
  navegador no muestre su propio cartel encima del aviso de la aplicación.
- Un `Store` `installState`: `'can'` (llegó el evento), `'installed-here'` (abierta desde el ícono:
  `display-mode: standalone`, o `navigator.standalone` en el iPhone), `'installed'` (instalada y
  abierta en el navegador), `'ios'` (iPhone o iPad en Safari, sin el ícono) o `'cannot'`.
- **Saber que está instalada y se abrió en el navegador (R4.2)** tiene dos fuentes:
  - `navigator.getInstalledRelatedApps()`, en Chrome, con el manifiesto que se nombra a sí mismo en
    `related_applications` (`{ "platform": "webapp", "url": "/manifest.webmanifest" }`);
  - el evento `appinstalled`, que deja `installed: true` en lo guardado. Si después vuelve a llegar
    `beforeinstallprompt`, es que la desinstalaron desde el sistema: vuelve a `false`.

  Si ninguna de las dos lo sabe, el renglón no aparece (como E24): nunca dice «Instalar» si no se
  puede.
- `install()`: llama a `prompt()` del evento guardado y devuelve `'accepted'` o `'dismissed'`. El
  evento sirve una sola vez.
- Nada pide a la red.

## 5. El módulo de la aplicación: `src/app/modules/device-settings/`

| Archivo | Qué hace |
|---|---|
| `index.ts` | La fachada: la pantalla (lazy), `applyPreferences(person)` para `App.tsx` y el aviso para instalar |
| `preferences.ts` | Lo guardado por persona (§ 2): leer, cambiar, volver a como viene, el tope. Al cambiar la persona de la sesión (o no haber nadie, en la entrada) pone `motionOff` y `hourFormat` con lo suyo o lo de arranque (R1.3, E05) |
| `rules.ts` | La regla pura: lo de arranque, si algo cambió de lo de arranque (R1.11), el resumen de «Así la tenés» (R1.10, que con el sistema pidiendo no animar dice «En el acto»), qué renglón de instalar toca (R4) y qué estado tiene «Trabajar sin conexión» (R5) |
| `install-offer.ts` | Si toca mostrar el aviso: celular, con sesión, `installState` en `'can'` y nunca ofrecido. Cerrado de cualquier forma, `offered: true` (R4.5, E36) |
| `texts.ts` | Los textos, largos en la computadora y cortos en el celular |
| `settings.ts` | `maxPeople` y lo que tarda el aviso en aparecer después de llegar al marco |
| `screens/Settings/` | La pantalla de Configuración |
| `screens/InstallSheet/` | El aviso para instalar |

**«Trabajar sin conexión» se muda (R5).** Hoy `sign-in/offline/setting.ts` arma el renglón y el
marco lo dibuja en Más (`SettingRow`). Pasa a dibujarse en Configuración: `sign-in` exporta el
mismo renglón por su fachada, con un estado más, `'needs-passkey'`, cuando la persona tiene el
permiso `offline.work` pero no su huella en ese celular (sin `offline` en la persona y sin la
marca de huella guardada). El marco deja de dibujarlo: salen `setting` de `FrameState` y el
renglón de `PhoneMore`.

**El menú:** la opción `deviceSettings` de `frame/menu.ts` pasa a tener su dirección,
`/device-settings`, y deja de decir «Pronto». Su detalle dice «Lo tuyo, en este dispositivo», en
la computadora y en el celular.

## 6. Pantallas

### Configuración (`screens/Settings/`)

Desde la final aprobada, una sola pantalla para los dos anchos (ADR-002):

- **Arriba:** el título, «Solo para vos, en este…» y «Así la tenés» con una pastilla por
  preferencia. Tocar una pastilla lleva a su renglón: es local, no se espeja. «Volver a como viene»,
  a la derecha del título, solo si algo cambió.
- **«En este dispositivo»:** «Animaciones» (llave, con su muestra y el aviso del sistema), «Formato
  de la hora» (tres fichas, con la hora de ahora en cada una y «Se ve así en Quién hizo qué»),
  «Instalar» (botón, texto o nada, § 4) y, en el celular, «Trabajar sin conexión».
- **«Lo tuyo»:** los cuatro renglones de la etapa b con «Pronto»; tocarlos los sacude, como el resto
  de lo que falta (`notYet` del marco).
- **Teclado (R1.9):** Alt M para «Animaciones», Alt H para el formato (pasa al siguiente), Alt I para
  instalar y Alt O para «Volver a como viene». La maqueta usa Alt A, que es una opción de Más: se
  cambia a M (de «movimiento»). Con Tab se llega a cada una y se cambia con Espacio; en las fichas,
  con las flechas.

**El espejo (R1.6).** Ir a `/device-settings` se espeja como cualquier dirección. Los valores no van
en `useMirrored`: se leen y se cambian con los `Store` del módulo, que son de ese dispositivo. Así el
otro dispositivo abre la pantalla con lo suyo, y lo que se toca no viaja. Un comentario en la
pantalla dice por qué estos valores no van en valores con nombre (architecture.md, «Lo que se ve vive
en valores con nombre»).

### El aviso para instalar (`screens/InstallSheet/`)

- La hoja de `ui/sheet` (que ya se cierra al bajarla y al tocar afuera; con `useBackStep`, también
  con «atrás»), sobre el marco,
  con el inicio en chico, el título, las dos pastillas, «Instalar» y «Ahora no».
- Aparece una vez llegado al marco, si `install-offer.ts` dice que toca (E25). **Al abrirse ya queda
  `offered: true`:** si la persona cierra la aplicación con la hoja abierta, tampoco vuelve.
- «Instalar» pide al navegador y, mientras contesta, la hoja no se cierra ni se toca dos veces. Si
  acepta, se cierra (E26). Si cancela o se cierra de cualquier otra forma, se cierra con la tostada «Si
  cambiás de idea, está en Más → Configuración» (R4.5, E36).
- En la computadora nunca aparece (E27).

## 7. Seguridad

- **Datos que toca:** en el dispositivo, las preferencias de cada persona que entró en él, ordenadas
  por su identificador, y dos marcas del dispositivo. Nada del negocio, nada secreto, nada nuevo en el
  servidor.
- **Quién puede:** cualquiera con sesión, sin permiso (02 · R7.2). «Trabajar sin conexión» sigue con
  su permiso y su huella, que verifica el servidor (diseño de 15): mudarlo de lugar no cambia quién
  puede prenderlo.
- **Qué entra de afuera:** lo guardado en `localStorage`, que cualquiera con el dispositivo puede
  cambiar. Se valida al leerlo: un valor que no es uno de los esperados se toma como lo de arranque, y
  un JSON roto se ignora. Lo peor que logra quien lo toque es cambiar cómo se ve la aplicación en ese
  dispositivo.
- **Lo que se ve de otros:** en una computadora compartida, quien abra la depuración del navegador ve
  qué identificadores de personas entraron ahí. Ya estaba a la vista con la sesión; el tope de 20 lo
  acota. No se guardan nombres ni correos.
- **Instalar:** no cambia nada de lo que corre: la aplicación instalada es la misma, con el mismo
  dominio, las mismas cabeceras y el mismo service worker. `related_applications` nombra solo su propio
  manifiesto.
- **Secretos:** ninguno.
- **Auditoría:** nada (R1.7). «Trabajar sin conexión» anota lo que ya anotaba.

## 8. Metas de performance

- **Cero pedidos** al servidor por esta etapa, también al abrir Configuración.
- Cambiar una preferencia se ve en menos de 16 ms (un cuadro): es poner un atributo en `<html>` o
  volver a dibujar una pantalla.
- Lo guardado: menos de 1 KB con 20 personas.
- El esqueleto de la aplicación suma solo `motion.ts`, `time.ts`, `install.ts` y la lectura de las
  preferencias (unos 2 KB): la pantalla y el aviso se bajan recién cuando se abren
  (`platform/lazy.ts`).

## 9. Pruebas

Las unitarias nombran el escenario (`device-settings-E01`). No hace falta ninguna de punta a punta
nueva: nada pasa por el servidor, y lo que solo el navegador de verdad puede mostrar (el movimiento
apagado, la hoja sobre el marco) lo cubren las capturas. Instalar de verdad no se puede probar en un
navegador sin pantalla: el evento del navegador se simula.

| Escenarios | Prueba |
|---|---|
| E01, E10, E11 | Unitarias de la pantalla: está para cualquiera; «Pronto» se sacude; las teclas con Alt |
| E02 a E06, E09 | Unitarias de `preferences.ts`: por persona, la entrada con lo de arranque, el tope, sin poder guardar |
| E07, E08 | Unitarias con dos dispositivos falsos, como las del espejo de 03: la dirección viaja y los valores no |
| E12 a E15, E35 | Unitarias de `motion.ts` y de la pantalla; captura de Configuración con el movimiento apagado y con el sistema pidiendo no animar |
| E16 a E19 | Unitarias de `time.ts` con los tres formatos y de las cuatro pantallas que escriben horas |
| E20 a E24 | Unitarias de `install.ts` con `beforeinstallprompt`, `display-mode` y `getInstalledRelatedApps` simulados |
| E25 a E27, E36 | Unitarias de `install-offer.ts` y de la hoja; captura del aviso sobre Vender en el celular |
| E28 a E31 | Unitarias del renglón de `sign-in` y de que Más ya no lo muestra; capturas del renglón en sus tres estados |
| E32 a E34 | Unitarias de `rules.ts` y de la pantalla |
| Seguridad | Lo guardado roto o con valores raros se toma como lo de arranque |

## 10. Tareas

1. **El código común** (tomar «Código común» en el plan antes): `platform/motion.ts` con la regla de
   `base.css` y `keeps-moving`; `platform/time.ts` y su control en `pnpm lint`; `platform/install.ts`
   y `related_applications` en el manifiesto; `useCollapse` y `Clip` con `still()`.
2. `[P]` Las cuatro pantallas que escriben horas pasan a `formatTime`. Depende de 1.
3. `[P]` El módulo sin pantallas: `preferences.ts`, `rules.ts`, `install-offer.ts`, `settings.ts`,
   `texts.ts` y `applyPreferences` en `App.tsx`. Depende de 1.
4. `sign-in` y el marco: el renglón con `'needs-passkey'` por la fachada; sale de Más; el menú con su
   dirección. Depende de 3.
5. Las pantallas: Configuración y el aviso para instalar, con sus capturas. Depende de 3 y 4.
6. Las revisiones del código y de seguridad (paso 7), y el manual (paso 9).
