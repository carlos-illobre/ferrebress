# Revisión del diseño · 04 · Configuración del dispositivo (`device-settings`), etapa a

Revisión del paso 4 sobre [device-settings.md](device-settings.md), contra la constitución, el
[capítulo 04](../../chapters/04-device-settings/rules.md) (y 00 · R8.5, 03 · R6.2, 15 · R1), las dos
maquetas finales aprobadas, la arquitectura y el código actual de `src/app` que el diseño dice
reutilizar o cambiar. No cambia el diseño: lo corrige el arquitecto en el paso 5.

**Gravedad:** «Frena» quiere decir que hay que corregirlo antes de presentarle el diseño a Carlos.
«Mejora» quiere decir que conviene hacerlo, pero no impide aprobarlo.

## Resumen

| # | Punto | Gravedad |
|---|---|---|
| 1.1 | Configuración no abre sin conexión después de cada versión nueva (pantalla diferida que no se guarda), y con ella tampoco se puede apagar «Trabajar sin conexión» | Frena |
| 1.2 | «Como el sistema» no hace lo que dice el diseño: con `es-AR` fijo no se lee el formato del navegador, y `es-AR` da a. m./p. m. | Frena |
| 1.3 | La regla de CSS no apaga lo que se mueve en `::before` y `::after`, y `keeps-moving` no alcanza a la marca de espera | Frena |
| 1.4 | Faltan lugares que escriben horas (`users/logic.ts`, las horas de las tiras) y el control de `pnpm lint` no ve `getHours()` | Frena |
| 1.5 | `'needs-passkey'` deja un hueco: con el permiso y la huella de otra persona en ese celular, el renglón desaparece | Frena |
| 1.6 | El aviso para instalar y el ofrecimiento de la huella salen juntos en la primera entrada del celular | Frena (decide Carlos) |
| 1.7 | Lo que muestra la maqueta del aviso al aceptar («Listo», vibración, tostada) y la tostada de «Volver a como viene» no figuran en el diseño | Mejora |
| 1.8 | La hoja no se puede trabar mientras contesta el navegador: hace falta un cambio en `ui/sheet` | Mejora (código común) |
| 1.9 | Alt A → Alt M se aparta de la maqueta aprobada | Mejora (avisarle a Carlos) |
| 1.10 | E18 «sin recargar» depende de que ninguna pantalla montada guarde horas ya escritas | Mejora |
| 1.11 | El clip del manual se apaga con la preferencia; no está claro que sea «adorno» | Mejora (decide Carlos) |
| 2.x | Performance: la meta de «cero pedidos» no cuenta la pantalla diferida; la hora de ahora, sin decir de qué reloj ni cada cuánto | Mejora |
| 3.x | Simpleza: dos mecanismos para no animar, nombres que no siguen el glosario | Mejora |
| 4.x | Repetición: validar con `platform/schema.ts`; la hora de ahora ya existe en `users` | Mejora |
| 5.x | Seguridad: sin fallas graves; `related_applications` necesita `id` en la computadora | Mejora |
| 6.x | Fronteras: dónde vive el tipo `SettingRow`, `notYet` por la fachada del marco | Mejora |
| 7.x | Sin conexión, hora y escala: ver 1.1; lo demás bien | — |

---

## 1. Escenarios sin cubrir

### 1.1 Configuración sin conexión · **Frena**

- **Dónde:** § 5 («La fachada: la pantalla (lazy)»), § 8 («la pantalla y el aviso se bajan recién
  cuando se abren»), § 3. Falta la sección «Sin conexión» que pide
  [modules/README.md](README.md) (punto 6).
- **Qué propone el diseño:** que la pantalla de Configuración se baje recién al abrirla, con
  `platform/lazy.ts`.
- **Qué veo:**
  - El service worker guarda solo el esqueleto (`platform/offline/worker.ts`, `keep`). Cuando llega
    una versión nueva, **borra todo lo que no es del esqueleto**, también las pantallas que se
    bajaron antes. Así, después de cada despliegue y hasta que se la abra con conexión,
    Configuración sin conexión muestra «sin conexión» (`useLazy` da `'offline'`).
  - Eso choca con [what-needs-internet.md](../../chapters/what-needs-internet.md), donde la fila
    «04 · Configuración · Ver y cambiar las preferencias del dispositivo» dice **Sí**.
  - Hoy «Trabajar sin conexión» está en Más, que es parte del esqueleto, y se puede **apagar sin
    conexión** (`sign-in/offline/setting.ts`: «apagarla, no» necesita conexión; 15 · R1.5). Si se la
    muda a una pantalla diferida, en el celular que más la usa (el que trabaja sin conexión)
    pasaría a no poder apagarse sin conexión. Eso empeora lo que ya funciona.
- **Opciones:**
  1. Configuración va en el esqueleto. El arranque pesa hoy unos 44 KB con gzip, sobre un máximo
     de 64 KB (medido sobre el `dist` que hay en el repositorio, que puede no estar al día). La
     pantalla debería sumar pocos KB. Es la más simple.
  2. Que el service worker guarde también una lista corta de pantallas «de sin conexión». Es más
     código común, y es algo que la etapa b de 15 va a necesitar igual.
  3. Bajarla sola después del arranque. Sería un pedido automático que habría que anotar en
     `mobile-data.md` y que aprobaría Carlos.

  Sea cual sea, el diseño tiene que tener su sección «Sin conexión» con lo que pasa al abrir
  Configuración sin red, y con la prueba que lo cubra. El aviso para instalar diferido no es
  problema: sin red no se puede instalar igual. Sí conviene decir que, si no llega, no se marca
  `offered`.

### 1.2 «Como el sistema» no lee el sistema · **Frena**

- **Dónde:** § 4, `platform/time.ts`.
- **Qué propone el diseño:** `formatTime` con `es-AR` siempre y, para «Como el sistema», «sin
  `hourCycle`». Dice que «en un celular en castellano de Argentina da 24 horas».
- **Qué veo:**
  - **Las dos cosas se contradicen.** Si el idioma es siempre `es-AR` y no se pone `hourCycle`, se
    obtiene el formato de `es-AR`, no el del navegador. Para tomar el del navegador hay que leerlo
    aparte: `new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions().hourCycle`.
    Después se aplica ese ciclo a `es-AR`.
  - **`es-AR` da a. m./p. m., no 24 horas.** Lo comprobé en Node (ICU 77, CLDR 47):
    `es-AR`, `es-419`, `es-CL` y `es-UY` resuelven `h12` («2:30 p. m.»); `es` y `es-ES`, `h23`.
    Si Chrome en Android trae los mismos datos (no lo pude comprobar en un celular), la opción de
    arranque haría que toda la aplicación pase a mostrar «2:30 p. m.» en Argentina. Hoy muestra
    «14:30» en todos lados (`hourCycle: 'h23'` fijo en Quién hizo qué y en el vínculo), y la maqueta
    aprobada dice «14:30 · Como el sistema».
  - Hay que comprobarlo en el celular y en la computadora del local antes de presentárselo a
    Carlos. Si es así, Carlos tiene que saber que «Como el sistema» va a ser «a. m./p. m.» para
    casi todos, y decidir si la opción de arranque sigue siendo esa o si pasa a ser «24 horas»
    (sería un cambio de R3.1).
  - **Detalles para `formatTime`:**
    - Con `hourCycle: 'h12'` y `hour: '2-digit'` sale «02:30 p. m.» (Quién hizo qué usa `2-digit`).
      Hay que decir si la hora va con `numeric` o con `2-digit` en cada caso: hoy Quién hizo qué
      escribe «08:05», y el vínculo y Usuarios, «8:05». La firma `{ seconds? }` no lo cubre.
    - El texto trae un espacio duro: «p. m.». Las pruebas y los textos fijos de la pantalla
      (los ejemplos de las fichas, «Así la tenés») tienen que compararlo así.

### 1.3 La regla de CSS no apaga todo lo que se mueve · **Frena**

- **Dónde:** § 4, `platform/motion.ts`, el bloque de CSS.
- **Qué propone el diseño:**
  `:root[data-motion="off"] :where(*, *::before, *::after):not(.keeps-moving)`, con `!important`
  en la capa `base`. Las excepciones llevan la clase `keeps-moving`.
- **Qué veo:**
  - **Los pseudoelementos no valen dentro de `:where()`** (Selectors 4: ni `:is()` ni `:where()`
    pueden representar pseudoelementos). Como la lista es tolerante, `*::before` y `*::after` se
    descartan y la regla queda en `:where(*)`. Eso no lo probé en un navegador; lo digo por la
    especificación.
  - Hay muchas animaciones en pseudoelementos que entonces **siguen moviéndose** con la preferencia
    apagada:
    - el latido de la luz (`Pending.css`, `.light-dot::after`);
    - el punto del vínculo (`Indicator.css`, `.link-dot::after`);
    - la fila nueva de Quién hizo qué (`Live.css`, `.audit-row[data-new]::after`);
    - la llave (`switch.css`, `::before` y `::after`);
    - la marca de la parte al plegar el menú (`collapse.css`);
    - el anillo y los pasos del manual.

    Así no se cumplen R2.2 y E13.
  - **La marca de espera es un `::after`** (`button.css`, `.button[data-wait]::after`). Hoy sigue
    girando solo porque la regla no alcanza a los pseudoelementos. Si se corrige el selector para
    que los alcance, `.keeps-moving` en el botón no la exime, porque `:not(.keeps-moving)` mira el
    elemento y no su `::after`. La barra que se mueve es `.wait-line-progress` /
    `.wait-bar-progress`, no `frame/notices/` en general: la clase va en ese elemento.
  - **Propuesta:** tres selectores explícitos, sin `:where`:

    ```css
    :root[data-motion="off"] :not(.keeps-moving),
    :root[data-motion="off"] :not(.keeps-moving)::before,
    :root[data-motion="off"] :not(.keeps-moving)::after
    ```

    `keeps-moving` va en el botón que espera y en el elemento de la barra. Además, una prueba en
    el navegador de verdad: con `data-motion="off"`, `document.getAnimations()` solo devuelve las
    de `keeps-moving`. Una captura quieta no lo prueba.
  - **Movimiento hecho en código que falta en la lista:** `users/screens/Card/Phone.tsx` usa
    `scrollIntoView({ behavior: 'smooth' })`, y el CSS no lo apaga. Lo mismo vale para el
    desplazamiento de las pastillas de «Así la tenés» a su renglón, si se hace suave. Tienen que
    pasar por `still()`.
  - Las demoras hechas con `setTimeout` que acompañan una animación (`useCollapse`, ya
    contemplado) están bien. No encontré `animationend` ni `transitionend`, como dice el diseño.

### 1.4 Horas que se escapan del formato · **Frena**

- **Dónde:** § 4, `platform/time.ts`, la lista de lugares y el control de `pnpm lint`.
- **Qué veo:**
  - **`users/logic.ts`** escribe horas con `getHours()` («hoy 7:58», «ayer 8:02») en el último
    ingreso y en las sesiones. Eso es lo que E18 nombra («sus sesiones»), y no está en la lista.
    Además usa la zona del dispositivo y no la del negocio.
  - `device-link/screens/Detail/texts.ts` (`clock`) y `sign-in/offline/when.ts` también usan
    `getHours()`. Están en la lista, pero el control propuesto («`hour:` o `toLocaleTimeString`»)
    no los habría encontrado. **El control tiene que mirar también `getHours`, `getMinutes`,
    `hourCycle`, `hour12` y `timeStyle`.**
  - **Las horas sueltas de las tiras** (`audit-log/screens/Summary.tsx`, «8 9 10…» de
    `stripScale`; las marcas de `device-link/screens/Detail/Today.tsx`) no dicen qué hacen con
    «a. m./p. m.». Hay que decidirlo y anotarlo: o siguen como números de reloj (y se dice por qué),
    o pasan por `formatTime`.
  - `when.ts` hoy dice «en la hora del celular» (15 · R2.3). Al pasar a `formatTime` cambia a la
    zona del negocio. Casi siempre da igual, pero el diseño tiene que decirlo.
  - El control vive en `tools/checks/` (como `raw-html.ts`), no en Biome. Conviene decirlo para
    saber dónde va.

### 1.5 `'needs-passkey'` con la huella de otra persona en ese celular · **Frena**

- **Dónde:** § 5, «"Trabajar sin conexión" se muda».
- **Qué propone el diseño:** `'needs-passkey'` cuando hay permiso `offline.work`, «sin `offline`
  en la persona **y sin la marca de huella guardada**».
- **Qué veo:**
  - La marca `passkey` (`sign-in/session.ts`, `hasPasskey`) es **del dispositivo**, no de la
    persona. Además, nunca se borra cuando se quita la huella.
  - Si la persona tiene el permiso y el celular tiene la huella de otra persona (01 · R2.3: una
    cuenta por celular), `hasPasskey()` da verdadero y `offline` no está. Entonces no corresponde
    ningún estado y `useOfflineSetting` devuelve `undefined`: **el renglón desaparece**. Eso va
    contra R5.2, que dice que solo sin el permiso no aparece, y contra E30.
  - **Propuesta:** `'needs-passkey'` = el permiso está en `person.permissions` y `person.offline`
    no está. Una sola fuente, la del servidor. Además hay que preguntarle a Carlos qué texto
    corresponde cuando el celular ya tiene la huella de otra persona: «primero vinculá tu huella
    en este celular» no se puede cumplir ahí. Es un borde que el capítulo no tiene.

### 1.6 Dos hojas en la primera entrada del celular · **Frena (decide Carlos)**

- **Dónde:** § 6, «El aviso para instalar».
- **Qué veo:**
  - La primera vez que alguien entra con Google en un celular, `OfferSheet` (01 · R2.2) ya ofrece
    la huella «al llegar al marco». El aviso para instalar aparece en el mismo momento (R4.5, E25).
    El diseño no dice cuál va primero ni si una espera a la otra, y las dos se montan en `App.tsx`.
  - **Opciones:**
    - El aviso para instalar espera a que se cierre el de la huella (en la misma entrada o en la
      siguiente).
    - El de instalar se salta esa entrada.

    Es una regla nueva y la decide Carlos. Tampoco hay número para «lo que tarda el aviso en
    aparecer» (`settings.ts`).
  - Si `beforeinstallprompt` llega después de llegar al marco (Chrome lo manda cuando quiere), el
    diseño no dice si el aviso espera el evento o se pierde para esa entrada.
  - El iPhone nunca recibe el aviso, porque `install-offer` pide `'can'`. R4.5 dice «si se puede
    instalar», y en el iPhone se puede, a mano. Que no aparezca parece razonable, pero conviene que
    el capítulo lo diga para que no quede supuesto.

### 1.7 Lo que la maqueta muestra y el diseño no nombra · **Mejora**

- La maqueta del aviso, al aceptar el navegador, muestra:
  - «Listo: ya está en tu pantalla de inicio» dentro de la hoja, con el tilde y una vibración
    10-40-10;
  - después, la tostada «Ferrebress quedó con su ícono».

  El § 6 dice solo «si acepta, se cierra». La vibración es hardware: va en la lista corta de
  ADR-005 o se descarta con Carlos.
- La maqueta de Configuración tiene la tostada «Volvió a como viene», la nota de lo guardado, «Se
  ve así en Quién hizo qué» y «La espera gira siempre» (solo en la computadora). Además, en el
  celular, «Así la tenés» suma la pastilla de «Trabajar sin conexión» («Solo con internet» /
  «También sin conexión»). El diseño no lo nombra. La maqueta manda, pero quien reconstruya desde
  `docs/` lo agradece.
- R2.8 (todo botón tiene su atajo): las pastillas de «Así la tenés» y los cuatro renglones de
  «Pronto» son botones y no tienen tecla en el diseño.
- La hoja de `ui/sheet` se cierra al bajarla 60 px; la maqueta dice «más de 90 px». Que gane la
  pieza común está bien, pero hay que decirlo.

### 1.8 La hoja no se puede trabar · **Mejora (código común)**

- **Dónde:** § 6, «"Instalar" pide al navegador y, mientras contesta, la hoja no se cierra».
- **Qué veo:** `ui/sheet/Sheet.tsx` no tiene cómo impedir que se cierre al tocar afuera o al
  bajarla. Hace falta una propiedad nueva (por ejemplo `locked`), que es código común, y el § 10
  no la incluye en la tarea 1.

### 1.9 Alt A → Alt M · **Mejora (avisarle a Carlos)**

- **Dónde:** § 6, «Teclado».
- **Qué veo:** el cambio está bien razonado: A es Anomalías en Más, y la maqueta ya cambió V por O
  por lo mismo. Pero se aparta de una maqueta aprobada, que tiene más autoridad que el diseño
  (constitución, I). Hay que mostrárselo a Carlos en la presentación, no solo anotarlo.

### 1.10 E18 «sin recargar» · **Mejora**

- **Dónde:** § 4, «Las pantallas leen el formato al dibujarse».
- **Qué veo:**
  - El diseño se apoya en que, al cambiar el formato, la única pantalla a la vista es Configuración.
    Pero hay cosas montadas que no se vuelven a dibujar solas:
    - el marco, que queda debajo del manual;
    - el pie del lateral;
    - los datos ya convertidos en texto dentro de un estado (las listas de Quién hizo qué arman
      sus filas en `logic.ts`).
  - No pude comprobar si alguna guarda horas ya escritas. Es más seguro que `formatTime` dependa
    de `timeFormat` con `useStore` (un `useTimeFormat()` en las pantallas que escriben horas), o
    que el cambio de formato vuelva a dibujar desde la raíz.
- Con varias pestañas de la aplicación en el mismo dispositivo, un cambio en una no llega a las
  otras hasta recargar. Si eso importa, se escucha el evento `storage`. Es una línea.

### 1.11 El clip del manual · **Mejora (decide Carlos)**

- **Dónde:** § 4, «Lo usan… `manual/screens/Stage/Clip.tsx`».
- **Qué veo:** el clip lo pide la persona con «Ver el clip»: es contenido, no adorno (R2.2 habla
  de «nada se mueve por adorno»). Con el sistema pidiendo no animar ya muestra solo el último
  cuadro (00 · R6.5), pero sumarle la preferencia de la aplicación es ampliar una regla del manual.
  Hay que preguntárselo a Carlos o dejar el clip fuera de `still()`.

### Lo demás, cubierto

- E01 a E12, E14 a E17, E19 a E24, E26 a E29 y E31 a E36 tienen dónde y cómo en el diseño.
- E09 (no va a la auditoría) se cumple porque no hay nada en el servidor.

---

## 2. Performance

- **Consultas por pedido:** ninguna. No hay rutas ni tablas nuevas. Lo comprobé en el diseño;
  como no hay código, no hay nada más que contar.
- **«Cero pedidos al servidor, también al abrir Configuración» (§ 8) · Mejora:** la primera vez
  de cada versión, abrir Configuración baja su archivo diferido. No es `/api`, pero es un pedido y
  datos del celular. La meta tiene que decirlo, con cuánto pesa (o desaparece, con la opción 1 de
  1.1).
- **La hora de ahora en las fichas y en «Así la tenés» · Mejora:**
  - **Qué reloj:** según VI tiene que ser `serverNow()` (`platform/server/clock.ts`), con la del
    dispositivo solo antes de la primera respuesta, como hace `users/logic.ts` (`nowMs`). El
    diseño no lo dice.
  - **Cada cuánto:** la maqueta usa un temporizador local de 5 s. Basta con uno que salte al
    próximo cambio de minuto, que se pare con la aplicación oculta, y que tenga su número en
    `settings.ts`. No consulta la red, así que no va en `mobile-data.md`.
- **El arranque:** «unos 2 KB» suena razonable, pero no lo pude medir. `pnpm boot` lo controla.
- **Aplicar la preferencia antes del primer dibujo · Mejora:**
  - **Qué propone el diseño:** `applyPreferences(person)` desde `App.tsx`.
  - **Qué veo:** si se aplica en un efecto, las animaciones de entrada del marco (`menu-in`,
    320 ms) arrancan y se cortan a la mitad, y se nota un salto.
  - **Propuesta:** leer la persona guardada y poner `data-motion` sincrónicamente en `main.tsx`,
    antes de `render`, como ya propone el diseño para `beforeinstallprompt`.
- Índices, consultas en bucles y lo que crece con la historia: no aplica. Lo guardado tiene un
  tope (20 personas, menos de 1 KB).

## 3. Simpleza

- **Dos mecanismos para no animar · Mejora:**
  - **Qué propone el diseño:** `data-motion="off"` para la preferencia y, para el sistema, «la regla
    que ya está en `base.css`».
  - **Qué veo:**
    - Esa regla está en la capa `base` y sin `!important`, así que pierde contra `pieces` y
      `screens`: no apaga nada. Lo que hoy funciona es que cada archivo envuelve sus animaciones
      en `@media (prefers-reduced-motion: no-preference)` (unos 25 lugares).
    - El resultado es incoherente. Con el sistema pidiendo no animar, la marca de espera del botón
      **gira** (está en `pieces`, sin la condición) y la barra **no avanza** (está dentro de
      `no-preference`).
  - **Propuesta:** un solo mecanismo. `motion.ts` pone `data-motion="off"` cuando `still()` es
    verdadero (sistema o persona), y una sola regla con `keeps-moving` lo apaga todo. Las
    condiciones `no-preference` de cada archivo pueden quedar o irse en otra tarea.
  - Hay que preguntarle a Carlos si con el sistema pidiendo no animar la marca de espera y la barra
    siguen moviéndose. R2.3 dice «no hay animaciones», pero el porqué de R2.2 («dicen que algo está
    pasando») vale igual, y WCAG permite el movimiento esencial.
- **Nombres · Mejora:**
  - El glosario dice `timeFormat` (`system`, `h24`, `h12`). El diseño usa `timeFormat` en lo
    guardado y `hourFormat` en el `Store`: tiene que ser uno solo, el del glosario.
  - `platform/time.ts` queda al lado de `platform/server/clock.ts` y de `shared/time/`. Un nombre
    como `platform/time-format.ts` dice mejor qué tiene.
  - En `installState`, `'installed'` y `'installed-here'` no se distinguen por el nombre. Por
    ejemplo: `'opened-from-icon'` y `'installed-in-browser'`.
  - Las claves `preferences` e `install` siguen el estilo de las demás (`session`, `passkey`).
    `install` puede confundirse; `install-offer` dice qué es.
- **`install-offer.ts` aparte de `rules.ts` · Mejora chica:** decidir si toca el aviso es una regla
  pura, de pocas líneas. Puede ir en `rules.ts`, y lo que queda en `install-offer.ts` es solo
  marcar `offered`.
- **Una sola forma de aplicar · Mejora chica:**
  - **Qué propone el diseño:** `applyPreferences(person)` «para `App.tsx`» y, a la vez, que
    `preferences.ts`, «al cambiar la persona de la sesión», pone los `Store`.
  - **Qué veo:** son dos caminos para lo mismo. Conviene uno: el módulo escucha `person` por la
    fachada de `sign-in`, o `App.tsx` le pasa la persona. No los dos.
- Los tres archivos de plataforma se justifican: son tecnología sin negocio y sirven a cualquier
  aplicación. `platform/` queda en 16 archivos sin contar pruebas, dentro del tope de 20.

## 4. Repetición

- **Validar lo guardado · Mejora:** el § 7 dice «un valor que no es uno de los esperados se toma
  como lo de arranque». Ya existe `platform/schema.ts` (`oneOf`, `flag`), que usan `users` y
  `device-link`. Conviene usarlo en vez de escribir la validación a mano.
- **La hora de ahora · Mejora:** `users/logic.ts` ya tiene `nowMs` (la del servidor, o la del
  dispositivo antes de la primera respuesta). Configuración necesita lo mismo. Si lo usan dos
  módulos, va a `platform/server/clock.ts`.
- **Escuchar un `matchMedia`:** `platform/narrow.ts` ya tiene el patrón (`useNarrow`).
  `systemStill()` puede seguirlo.
- **Escribir horas:** el diseño las junta en `formatTime`, que es justo sacar repetición. Bien.
  Falta sumar la de `users/logic.ts` (1.4).

## 5. Seguridad

- **Datos que toca:** están bien descritos. No hay nada del negocio ni nada secreto, y sobre los
  identificadores de personas en una computadora compartida el diseño dice lo que se ve y lo acota.
  Sin observaciones.
- **Quién puede:** sin permiso, salvo «Trabajar sin conexión», que verifica el servidor (15).
  Mudarla de lugar no cambia quién la puede prender, siempre que el estado se calcule con lo que
  trae el servidor (`person.offline`, `person.permissions`) y no con la marca del dispositivo
  (1.5).
- **Lo que entra de afuera:** `localStorage`. Se valida al leer y está bien. Dos detalles:
  - Las preferencias se buscan por `userId` dentro de un objeto que sale de `JSON.parse`. Hay que
    leerlas con `Object.hasOwn`, o validar que la clave tenga forma de identificador, así una clave
    como `__proto__` no confunde la lectura. Es menor: lo peor es una preferencia rara en ese
    dispositivo.
  - El tope de 20 corre también sobre lo guardado ya roto: si alguien guarda mil filas, la primera
    lectura las recorta.
- **Instalar · Mejora:**
  - En la computadora, `getInstalledRelatedApps()` para una aplicación web dentro de su ámbito
    pide **Chrome o Edge 140 o más nuevo** y que la entrada de `related_applications` lleve el
    `id` del manifiesto. El manifiesto de hoy no tiene `id`, y el diseño pone solo `platform` y
    `url`. En Android alcanza con Chrome 84 y no hace falta `id`.
  - Si se agrega `id` al manifiesto, tiene que ser el mismo que el navegador calcula hoy
    (`start_url`, `/`). Si no, las instalaciones que ya existen pasan a ser de otra aplicación.
  - No pude comprobar que una `url` relativa sirva: los ejemplos de la documentación de Chrome
    usan direcciones completas. Como el dominio cambia entre pruebas y producción, conviene
    comprobarlo.
  - Lo demás (mismo dominio, cabeceras y service worker) está bien.
- **Secretos:** ninguno. Bien.
- **Auditoría:** nada nuevo, por R1.7. «Trabajar sin conexión» anota lo que ya anotaba. Bien.
- **Espejo:** la hoja del aviso para instalar es «lo abierto encima», y R6.2 dice que eso se
  espeja. El diseño tiene que decir que es local (como `OfferSheet`) y por qué: en la computadora
  no se puede instalar con ese aviso (E27), así que no debe aparecer en ella.

## 6. Fronteras

- **El tipo `SettingRow` · Mejora:**
  - **Qué veo:** hoy está en `frame/context.ts` y lo importa `sign-in/offline/setting.ts`. Si el
    marco deja de dibujar el renglón, el tipo no tiene por qué seguir ahí. Si se lo muda a
    `device-settings` y `sign-in` lo importa, mientras `device-settings` importa el renglón de
    `sign-in`, hay un ciclo. Dependency-cruiser cuenta los `import type`
    (`tsPreCompilationDeps: true`) y `pnpm imports` falla.
  - **Propuesta:** el tipo vive en `sign-in` (es suyo), y `device-settings` lo toma por la
    fachada. Va en un solo sentido.
- **`notYet` del marco · Mejora:** Configuración sacude los renglones de «Pronto» con `notYet`,
  que hoy está en el contexto interno del marco (`useFrame`) y no sale por `frame/index.ts`. Hay
  que exportarlo por la fachada (o un `NotYet` como pieza) y decirlo en la tarea 4.
- **La pantalla en el marco:** `App.tsx` registra las pantallas en `screens` (hoy
  `{ users: UsersSlot }`). Falta decir que entra `deviceSettings` ahí, con un `DeviceSettingsSlot`
  como el de Usuarios, y qué muestra si no llega (1.1).
- **`platform/time.ts` importa `shared/time/business.ts` · Mejora chica:** dependency-cruiser lo
  permite, pero la zona del negocio es un dato del negocio (06 la va a dejar elegir), y el diseño
  dice que la plataforma no tiene «nada del negocio». Si `formatTime` recibe la zona, o la toma
  de un valor que pone el módulo (como el formato), la plataforma queda limpia.
- Las reglas de `rules.ts` no dependen de tecnología. Bien.

## 7. Sin conexión, hora y escala

- **Sin conexión:** ver 1.1. Todo lo demás vive en el dispositivo y anda sin red.
- **La hora:** no se guarda ninguna hora del negocio. La hora de ahora en las fichas tiene que ser
  la del servidor (ver 2). `usedAt` toma la del dispositivo, pero solo sirve para ordenar a quién
  borrar primero: un reloj corrido solo cambia a quién se olvida. Se puede dejar así.
- **Escala a 100 personas:** no toca el servidor. En una computadora que comparten más de 20
  personas, la número 21 borra a la que menos entra, que vuelve a lo de arranque: es aceptable y
  está dicho.

## 8. Mejoras

- Resolver 1.1 con la opción 1: Configuración en el esqueleto. Es lo más simple, deja el apagado
  de «Trabajar sin conexión» como está hoy y cumple la tabla de qué necesita internet.
- Un solo mecanismo de movimiento, con la regla corregida (1.3 y 3), probado con
  `document.getAnimations()` en el navegador de verdad.
- Antes de programar, comprobar en el celular y en la computadora del local qué da «Como el
  sistema» (1.2) y llevarle el resultado a Carlos junto con Alt M (1.9), el orden de las dos hojas
  (1.6), el clip (1.11) y la marca de espera con el sistema pidiendo no animar (3).
- Fuera de este diseño: el [roadmap](../../project/roadmap.md) todavía dice que la etapa a tiene
  «formato de la hora y de la fecha», y el capítulo dice que la fecha no se elige. Hay que
  corregirlo en el roadmap.

## Lo que no pude comprobar

- El comportamiento de las capas de CSS con `!important` y de `:where()` con pseudoelementos en un
  navegador de verdad. Lo digo por la especificación, no lo probé.
- Qué formato de hora da Chrome en Android y en Windows con `es-AR` / `es-419`. Lo comprobé solo en
  Node (ICU 77, CLDR 47).
- Cuándo manda Chrome `beforeinstallprompt` en el celular del local, y si una `url` relativa en
  `related_applications` sirve.
- Si alguna pantalla montada guarda horas ya escritas (1.10).
- El peso real que suma al arranque (el `dist` del repositorio puede no estar al día).

Fuente de lo de `getInstalledRelatedApps`:
[Chrome for Developers · Get installed related apps](https://developer.chrome.com/docs/capabilities/get-installed-related-apps).
