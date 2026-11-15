# Revisión: ¿se puede rehacer la interfaz sin tocar nada más?

Revisión de `src/app/` y de lo que usa de `src/shared/`, hecha el 2026-11-15 sobre el código de
hoy. No se cambió ningún archivo.

## 1. Resumen

**Hoy no se puede.** Si mañana se borran todas las pantallas (`screens/`) y las piezas visuales
(`ui/`) y se dibujan otras, la aplicación pierde partes que no son dibujo: en varias pantallas está
metido cómo se guarda un rol, cómo se valida un correo, cada cuánto se renueva un código QR, qué se
le pide al servidor y cuándo, qué pasa si alguien pierde un permiso o qué tecla abre qué. Habría que
leer cada pantalla vieja y rescatar esa lógica antes de tirarla. Si se olvida una parte, la
aplicación nueva se porta distinto, aunque se vea bien.

La base es buena: el servidor, `src/shared/`, la conexión, el espejo, el trabajo sin conexión, la
sesión, el manual y la mayoría de las reglas ya están fuera de las pantallas, y los textos están
casi todos en archivos aparte. Lo que falta es sacar de las pantallas los «procesos» que quedaron
adentro y hacer explícito lo que toda interfaz nueva tiene que cumplir (el teclado, lo privado).

**Cuánto trabajo es el arreglo, por módulo** (chico: menos de un día; mediano: uno a tres días;
grande: más de tres):

| Módulo | Qué tan lejos está | Arreglo |
|---|---|---|
| Usuarios y Roles (`users`) | Guardar un rol, el borrador, salir sin guardar, autorizar, «se perdió un celular» y la navegación de Roles viven en pantallas | **Grande** |
| El marco (`frame`) | Los permisos («sin permiso», «ya no tenés permiso»), un pedido al servidor, «Algo salió mal» que lee el HTML, los globos y paneles que miden el HTML | **Grande** |
| Quién hizo qué (`audit-log`) | La cinta entera (pedir el día, reproducir, aislar) vive en la pantalla; «estar arriba de todo» se averigua buscando una clase CSS; el tamaño de página depende del ancho | **Mediano** |
| El vínculo (`device-link`) | El núcleo está muy bien separado; pero el código para vincular, el flujo de vincular y medir la latencia viven en pantallas | **Mediano** |
| La entrada (`sign-in`) | El botón de Google (conectarlo y entrar), la confirmación con huella y el QR con su cuenta regresiva viven en pantallas | **Mediano** |
| Piezas comunes (`ui/`) y teclado | Las tostadas, la espera de los botones, la cámara y el bloqueo de los diálogos son comportamiento dentro de piezas visuales; el teclado funciona por marcas en el HTML | **Mediano** |
| La aplicación (`App.tsx`) | El arranque, revisar la sesión al volver la conexión y leer el código del QR están en el mismo archivo que el dibujo | **Mediano** |
| Administración (`administration`) | Un pedido al servidor, el reloj, validar y guardar dos campos y las teclas de cada ajuste en pantallas | **Chico a mediano** |
| Configuración (`device-settings`) | Cambiar el nombre y la huella con algo de lógica en pantalla | **Chico** |
| El manual (`manual`) | Bien separado; quedan detalles de foco y de qué está desplegado | **Chico** |

En total, la aplicación queda lista para rehacer la interfaz con unas **dos a tres semanas** de
trabajo, sin cambiar lo que hace: la mayor parte es mover código de lugar y sumarle pruebas a la
lógica que hoy solo se prueba a través de la pantalla.

## 2. La propuesta: dónde va el límite

### Qué es «la interfaz» (lo que se puede tirar y rehacer)

- `src/app/ui/**`: las piezas visuales (botón, hoja, diálogo, ícono, buscador…).
- `src/app/styles/**`: los tokens, las fuentes, el marco visual.
- `src/app/modules/*/screens/**` y `src/app/modules/users/roles/screens/**`: el `.tsx` de cada
  pantalla, su `.css` y sus imágenes.
- Los «lugares» que solo eligen qué pantalla dibujar (`AdministrationSlot.tsx`, `UsersSlot.tsx`,
  `ManualSlot.tsx`, `InstallOffer.tsx`, `frame-link.tsx`, `frame/notices/*.tsx`), que hay que
  pasar a `screens/`.
- La composición de `App.tsx` (qué se dibuja encima de qué) y el `render` de `main.tsx`.

### Qué no es la interfaz (lo que la interfaz nueva usa tal cual)

- `src/shared/**`.
- `src/app/platform/**`: el servidor, la conexión en tiempo real, el espejo, lo guardado, la cola
  sin conexión, la cámara, la dirección, el reloj, las esperas, el teclado.
- En cada módulo, todo lo que no está en `screens/`: `index.ts` (la fachada), `api.ts`, `state.ts`,
  `use<Algo>.ts`, `rules.ts`/`logic.ts`, `settings.ts`, `texts.ts`, y una carpeta nueva por módulo
  para lo que el teclado necesita saber (`keys.ts`).
- `sw.ts` y `platform/offline/`.

### El contrato entre las dos partes

1. **Cada pantalla tiene su hook** (`use<Pantalla>.ts`) que devuelve datos ya listos para mostrar
   y acciones con nombre (`save()`, `retry()`, `openTape(day)`), sin JSX, sin clases, sin elementos
   del HTML como parámetro. La pantalla solo dibuja lo que recibe y llama a esas acciones.
2. **Las teclas se declaran en la lógica**, no en el HTML: qué letra hace qué vive en `keys.ts`
   (o en `menu.ts`, como hoy el menú). La interfaz las aplica con una función de la plataforma que
   devuelve las marcas que el motor de teclado necesita (`keyProps(...)`). Así ninguna interfaz
   nueva puede cambiar «Alt S abre Usuarios» sin querer (y el manual dice «Alt S»).
3. **Lo privado** (nombres, correos) se marca con una sola función de la plataforma
   (`privateProps`), para que la captura de «Algo salió mal» siga tapándolo. Hoy son 40 marcas
   `data-private` escritas a mano: una interfaz nueva que olvide una manda datos personales en la
   captura.
4. **Los textos** están todos en `texts.ts` fuera de `screens/`; el tipo de los textos con forma
   larga y corta (`Words`) sale de `ui/` y pasa a la plataforma.
5. **Los avisos al pie** (tostadas) los pide la lógica a la plataforma (`notify(...)`); `ui/` solo
   los dibuja.

### Cómo se controla con herramientas (en `pnpm check`)

Hoy `pnpm imports` (dependency-cruiser) controla los límites entre servidor, aplicación, `shared`,
`platform` y módulos, pero **no hay ninguna regla entre la interfaz y la lógica**: una pantalla
puede pedir al servidor, y un hook puede importar una pieza visual. Las reglas a sumar están en la
sección 4.6.

## 3. Hallazgos, por módulo

Ordenados dentro de cada módulo de lo que más impide rehacer la interfaz a lo que menos. Las rutas
son relativas a `src/app/`.

### 3.1 Usuarios y Roles (`modules/users`) — grande

`state.ts` (`useUsers`) está bien: carga, permisos (`may`), filtros, lo abierto y el espejo. El
problema son los procesos que quedaron en pantallas.

1. **Guardar un rol vive en la pantalla.** `users/roles/screens/role/RoleScreen.tsx`:
   - líneas 46–55 `useLeaveGuard`: preguntar antes de salir con cambios (`guardNavigation`, E64);
   - líneas 59–103 `useSave`: valida el borrador, guarda, interpreta cada respuesta del servidor
     (confirmar quién es y repetir, «otro lo cambió» que vuelve a pedir roles y personas con
     `usersApi` y reaplica el borrador, rechazos), muestra tostadas y navega;
   - líneas 108–122 `useHalfDone`: registra el trabajo a medio hacer (01 · E25, 00 · R5.6);
   - líneas 127–139 `useDraft`: el borrador espejado (`useMirrored`, clave
     `users.role.draft:<id>`, validación con zod, `JSON.parse`).

   Es el proceso completo de Roles. **Separar:** `roles/useRole.ts` con
   `useRole(start) → { draft, change, dirty, errors, notice, save, asking, stay, go }`;
   `RoleScreen.tsx` queda con el HTML.
2. **Autorizar a alguien.** `screens/Overlays/Authorize.tsx`: líneas 18 (`looksLikeEmail`, una
   regla de validación), 84–86 (`maxLength` 320/64/60 de lo espejado), 89–98 (tres valores
   espejados con sus claves, el envío, la validación y la traducción del rechazo). Además
   `maxLength={254}` y `maxLength={80}` (líneas 66 y 126) son topes del negocio escritos en el
   HTML. **Separar:** `useAuthorize.ts` con `{ name, email, roles, error, noRoles, setX, send }`;
   la regla del correo y los topes a `logic.ts` o a `shared/contracts/users.ts`.
3. **«Se perdió un celular».** `screens/Overlays/Lost.tsx`: líneas 18–37 (`cut`: corta sesiones
   y huella, actualiza la cuenta y vuelve a pedir el acceso), 109–124 (pide `usersApi.lostPhones()`
   en un efecto, elige solo si tiene un celular) y la línea 81 arma un texto fuera de `texts.ts`
   (`usado ${…}`). **Separar:** `useLost.ts`.
4. **La navegación de Roles se decide en pantallas.** `roles/screens/Roles.tsx`: líneas 56–58
   leen el id de la dirección (`decodeURIComponent(path.slice(...))`), 36–39 vuelven a la lista si
   el rol no existe, 24–29 la copia al duplicar con su tostada. `roles/screens/list/RoleList.tsx`
   línea 22 (`navigate(newPath)`) y `RoleRow.tsx` línea 47. **Separar:** `roles/paths.ts` ya tiene
   las direcciones: sumar `openedAt(path)` y un `useRoles()` que devuelva `{ view: 'list' | 'new' |
   'role', start }`.
5. **El buscador de roles está espejado desde la pantalla** (`RoleList.tsx` líneas 55–59,
   `useMirrored('users.roles.search', …)`), y lo mismo `RoleHolders.tsx`. Las claves del espejo son
   parte del contrato con el otro dispositivo: si una interfaz nueva las escribe distinto, el
   celular y la computadora dejan de entenderse. **Separar:** todas las claves en el hook del
   módulo.
6. **El teclado y el foco dependen del HTML.**
   - `RoleInfo.tsx` línea 41: Enter en el nombre busca `document.querySelector('[data-key="g"]')`
     y le hace clic. Si la interfaz nueva no tiene un botón con esa marca, Enter deja de guardar.
     Tiene que llamar a `save()`.
   - `RoleList.tsx` líneas 25–33: el foco inicial (`!isPhone()` y `document.activeElement`) y
     «Enter abre el primero» buscando `.roles-rows [data-mark], .roles-nothing [data-mark]`.
     Tiene que ser una acción `openFirst()` del hook.
   - `RoleInfo.tsx` líneas 18–21 y `RoleScreen.tsx` línea 180 (`focus={!isPhone()}`): la regla
     «en la computadora el cursor arranca en…» (00 · R2.12) está repetida en cada pantalla.
7. **Reglas de habilitado en pantallas.** `screens/Card/Phone.tsx` líneas 57 y 65
   (`off: sessions.length === 0 || !users.online`), `screens/PersonRoles/PersonRoles.tsx` líneas
   27–31, 107 y 182–183 (qué permisos da cada rol, a quién más, qué gana y qué pierde: «Eso es»).
   Son cálculos que la pantalla nueva tendría que repetir. **Separar:** a `person-roles.ts` (que
   ya existe) y a `may`.
8. **Desplazarse a una sección por id** (`screens/Card/Phone.tsx` línea 15,
   `roles/screens/role/RoleSummary.tsx` línea 10): está bien que sea de la pantalla; es solo dibujo.
9. **Lo que sí tiene que quedar en la lógica y ya está:** `users/state.ts:215` elige solo a la
   primera persona «en la computadora» con `isWide()`: es una decisión de disposición dentro del
   hook. Si la interfaz nueva muestra la tarjeta distinto, hay que tocar la lógica. **Separar:** que
   el hook reciba `autoSelect: boolean` desde la pantalla.

### 3.2 El marco (`modules/frame`) — grande

`menu.ts` y `work.ts` están bien: las opciones, los permisos de cada una, la primera que se puede
usar y el trabajo a medio hacer son puros.

1. **Los permisos se deciden en el `.tsx` del marco.** `screens/Frame/Frame.tsx`:
   - líneas 141–148 `useGuarded`: qué se mira cuando lo de adentro pide su propio permiso
     (05 · E13, 02 · R7.8);
   - líneas 151–168 `useLostPermission`: detectar que se perdió el permiso de la pantalla abierta
     y adónde ir (R7.8);
   - líneas 119–120: decidir si se muestra «Sin permiso».

   Es la regla de permisos de toda la aplicación. **Separar:** `frame/useFrameState.ts` (o
   `useWork.ts`) con `{ current, Screen, blocked, lost, goFirst }`.
2. **«Sin permiso» le pide al servidor desde la pantalla.**
   `screens/NoPermission/NoPermission.tsx` líneas 32–37:
   `api<HoldersResponse>(`/api/permissions/${option.permission}/holders`)`. Es el único lugar de la
   aplicación con una dirección de la API escrita en una pantalla. **Separar:** `frame/api.ts` con
   `holders(permission)` y un `useHolders(permission)`. Línea 39: copia al portapapeles el pedido
   (también al hook).
3. **«Ya no tenés permiso» decide solo.** `screens/NoPermission/PermissionLost.tsx` líneas 27–34:
   la cuenta regresiva y el «a los 5 segundos va solo» (R7.8) con `setInterval(..., 1000)`; líneas
   36–37: qué roles se perdieron. **Separar:** `usePermissionLost(lost, onGo) → { left, removed }`.
4. **«Algo salió mal» lee el HTML.** `notices/crash/crash.ts`:
   - líneas 18–20: «dónde está la persona» sale de buscar `[aria-current="page"] .part-name` y
     `.sign-in`. Con otro HTML dice siempre «La aplicación». **Separar:** sacarlo de la dirección
     (`optionAt(route.get().path)?.name`) y de si hay sesión.
   - líneas 23–28: el nombre de lo tocado sale del texto del botón sin el `<kbd>`;
   - líneas 38–39 y 65–69: lo privado se reconoce por `data-private` (ver 4.3).
   - Los textos «La entrada», «La aplicación», «Tocó «…»» y «Escribió en «…»» están acá y no en
     `texts.ts`.
5. **Los globos y los paneles miden el HTML.** `behavior/usePanels.ts` líneas 59–63 (`beside`:
   `closest('nav')`, `getBoundingClientRect`, 8 px) y 74 (`[data-panel], [aria-haspopup]`);
   `behavior/useTip.ts` líneas 17–19 (lee `element.dataset.name/detail` y mide el elemento);
   `screens/Frame/Frame.tsx` líneas 175–178 (`labelled`: clases `collapse`, `.side`,
   `.side-panel`); `context.ts` líneas 238–242 (`shake` con la clase `not-here`) y la firma
   `notYet(element: HTMLElement, name)` (línea 211) que obliga a la lógica a recibir un elemento;
   `screens/Crumbs/MoreCrumb.tsx` línea 14 (`document.querySelector('.part.more')`). Todo esto es
   dibujo y está bien que se rehaga, **pero hoy está mezclado con el estado del marco**
   (`FrameState` lo lleva). **Separar:** `behavior/` pasa a `screens/Frame/behavior/` (es de la
   interfaz); `FrameState` expone solo `notYet(optionId)`, `panel`, `openPanel(panel)`.
6. **`useCollapse`** (`behavior/useCollapse.ts`): la animación de minimizar con sus fases
   `closing`/`opening` que el CSS espera: es de la interfaz; va a `screens/`.
7. **Abrir una opción del menú está repetido en tres pantallas.** `screens/Side/MenuItem.tsx`
   líneas 22–25, `screens/Phone/Phone.tsx` líneas 70–76, `screens/Phone/PhoneMore.tsx` línea 66:
   «si existe ábrela; si no, avisá que todavía no está; si es el manual, encima». **Separar:**
   `menu.ts` → `choose(option, from)` que devuelve `'opened' | 'not-yet' | 'offline'`.
8. **`usePhoneMore`** (`behavior/usePhoneMore.ts`) mezcla historial (navegación, lógica) con «Más es
   una pantalla entera en el celular» (disposición). Queda en la lógica la parte de historial.
9. **`menu.ts` y `permission-icons.ts` importan `IconName` de `ui/icon/Icon.tsx`.** Una interfaz
   nueva con otros íconos tiene que aceptar los mismos nombres. Es un contrato chico y aceptable si
   se documenta; mejor: el tipo `IconName` pasa a `platform/` como lista de nombres de concepto.

### 3.3 Quién hizo qué (`modules/audit-log`) — mediano

`state.ts`, `logic.ts`, `live.ts`, `tape.ts` (las reglas de la cinta) y `filter-options.ts` están
bien. El problema principal es la cinta.

1. **La cinta entera vive en la pantalla.** `screens/Tape.tsx` líneas 20–37 (`useDay`: pide
   `auditApi.day(date)` y se queda con el último con `useLatest`), 67–96 (`usePlay`: el
   temporizador de «Reproducir», pararlo al ocultar la pestaña), 99–130 (`useTape`: el cabezal,
   aislar a una persona y llevar el cabezal a su primera acción), 199–212 (`useSwipe`: deslizar) y
   227–229 (parar al tocar algo que no sea «Reproducir», buscando `[data-play]`). **Separar:**
   `audit-log/useTape.ts` con todo eso; deslizar puede quedar en la pantalla porque es un gesto,
   pero llamando a `tape.go(step)`.
2. **«Estar arriba de todo» se averigua por una clase CSS.** `loading.ts` líneas 30–39:
   `document.querySelector('.audit-ledger')` y todos sus contenedores, para la regla de R4.6 («se
   actualiza solo si está arriba»). Sin esa clase, la actualización sola no anda. **Separar:** la
   pantalla avisa con `log.setAtTop(boolean)` desde su propio desplazamiento, o pasa un `ref` a un
   hook `useAtTop(ref)` de la plataforma.
3. **La lógica depende del ancho.** `state.ts` líneas 78 (`size = wide ? 20 : 10`), 62 (pide la
   tira solo en la computadora), 69 (elige sola la primera acción en la computadora) y 123
   (`!isNarrow()`); `live.ts` línea 109 («Actualizar solo» prendido de arranque en la computadora);
   `tape.ts` línea 68 (`stepMs` según el ancho). Una interfaz nueva con otra disposición obliga a
   cambiar la lógica. **Separar:** que la pantalla le pase al hook su forma (`{ pageSize,
   withStrip, autoSelect, liveOnStart }`), con los valores de hoy como «disposición de la
   computadora» y «del celular» en `settings.ts`.
4. **El teclado elige por el HTML.** `screens/Ledger.tsx` líneas 47–56 (`useMarkSelects`): al
   moverse con las flechas, elige la acción leyendo `dataset.id` del elemento marcado. Contrato:
   cada fila tiene que tener `data-id`. **Separar:** que el motor de teclado avise con un id
   declarado (`keyProps({ mark: id })`) y la lógica escuche ese id.
5. **Abrir la cinta desde la tira mide el HTML.** `screens/Summary.tsx` líneas 67–75: busca
   `.audit-rail` y calcula la posición tocada. Es dibujo (está bien en la pantalla), pero la
   decisión «la acción más cercana» (`nearestMark`) ya está en la lógica: correcto.
6. **La acción elegida que «se queda»** (`screens/AuditLog.tsx` líneas 48–53, `useChosen`, R4.6 y
   R4.7) es una regla: al hook.
7. **Los filtros por fecha** (`screens/Filters.tsx` líneas 15–22): el borrador de las fechas es
   local de la pantalla; aceptable, pero si debería viajar al otro dispositivo, al hook.

### 3.4 El vínculo (`modules/device-link`) — mediano

`machine/`, `runtime/`, `runtime.ts`, `view.ts`, `use-link.ts`, `strip.ts`, `pair.ts`, `wire.ts`,
`journal.ts` están muy bien: es el mejor ejemplo del repositorio. Lo que queda en pantallas:

1. **El código para vincular es lógica en la pantalla.** `screens/Code/Code.tsx` líneas 52–64:
   escucha el tema de tiempo real `device-link.code` con `useTopic`, **valida lo que llega del
   servidor** (largo del código, `pairingShape.safeParse`) y avisa el vínculo nuevo; 33–40:
   la cuenta de 60 segundos con `setInterval(..., 1000)` y el `60` escrito a mano (la regla XII
   pide los tiempos en `settings.ts`); 19–28: baja el dibujante del QR. **Separar:**
   `usePairCode() → { qr, left, read, other }`.
2. **El flujo de vincular y desvincular se arma en la pantalla.** `screens/Detail/Over.tsx`
   líneas 26–44 (`useCode`: al vincular, despacha `serverSaid` a la máquina y cierra el detalle a
   los `doneMs`), 63–66 y 68–83 (`onAct`: qué hace cada botón según el lado), 94–100
   (desvincular), 109–115 (`useDirectNotice`, E19). **Separar:** `useLinkDetail.ts`. Y
   `start.ts` línea 31 importa `Layer` desde `screens/Detail/Over.tsx`: la lógica del arranque
   depende de una pantalla. Con el hook separado, `start.ts` solo publica el runtime y la interfaz
   decide qué dibujar.
3. **Medir la latencia cada 2 segundos** (`screens/Detail/Route.tsx` líneas 20–31,
   `setInterval(read, 2000)`, número suelto) y **la tira del día cada minuto**
   (`screens/Detail/Today.tsx` líneas 14–31, `useStrip`, y 35–44 `hours`, un cálculo): al hook y
   a `strip.ts`.
4. **Leer el código en el celular** (`screens/Read/Read.tsx` líneas 89–112): los pasos (cámara,
   preguntando, reemplazar, aviso) son una pequeña máquina de estados dentro de la pantalla.
   **Separar:** `useReadCode(code)`.
5. **`frame-link.tsx`** (fuera de `screens/`) devuelve componentes al marco
   (`FrameLink = { Side, Phone, Over }`, en `frame/context.ts` líneas 220–225). El contrato entre
   el marco y el vínculo son componentes visuales: la interfaz nueva del marco tiene que aceptar
   los del vínculo tal cual. **Separar:** el vínculo exporta datos (`useLinkView`, `detailOpen`) y
   el marco nuevo dibuja su propio indicador; o `frame-link.tsx` pasa a `screens/` y se reconoce
   como parte de la interfaz.
6. Textos: `screens/Detail/texts.ts` está **dentro de `screens/`** e importa `formatTime` y
   cálculos de fechas: si se borra la carpeta de pantallas, se pierden. Va a
   `device-link/detail-texts.ts`.

### 3.5 La entrada (`modules/sign-in`) — mediano

`useSignIn.ts`, `session.ts`, `offline/`, `google/` (la conexión con el marco de Google), `codes/`,
`passkeys/`, `access/` están bien separados.

1. **El botón de Google conecta y hace entrar desde la pantalla.**
   `screens/Entrance/google/GoogleButton.tsx` líneas 19–48 (`useGoogleFrame`): conecta el marco,
   y con la credencial llama a `attempt(withGoogle(...))`; decide el tema por `isPhone()` y el
   ancho tope 400. **Separar:** `google/useGoogleButton.ts` que reciba el elemento `iframe` (un
   `ref` es inevitable acá: el botón lo dibuja Google) y devuelva `{ phase, arrived, again }`.
2. **`screens/Entrance/google/useGooglePhase.ts`** es lógica (las esperas 300 ms, 2 s y 8 s, volver
   a pedir al volver la conexión) pero vive **dentro de `screens/`**: al rehacer la interfaz se
   borra. Va a `sign-in/google/`.
3. **El estado de la entrada se arma en el `.tsx`.** `screens/Entrance/Entrance.tsx` líneas
   35–55: el intento con su espera, el aviso, pedir otro nonce si venció. Y
   `screens/Entrance/context.ts` (reglas: qué se apaga sin conexión o con muchos intentos, R2.8 y
   R2.9) también está en `screens/`. **Separar:** `useEntrance.ts` y `entrance.ts` fuera de
   `screens/`.
4. **Confirmar quién es pide al servidor desde la hoja.** `screens/Sheets/ConfirmSheet.tsx`
   líneas 25–42 (pide `signInApi.start()` para un nonce y conecta Google) y 45–49 (`withPasskey`:
   `confirmPasskeyOptions`, WebAuthn, `confirmPasskey`). **Separar:** `useConfirm.ts`.
5. **El QR de la computadora** (`screens/Entrance/qr/QrBlock.tsx` líneas 14–37): la cuenta
   regresiva y bajar el dibujante. **Es el mismo código que `device-link/screens/Code/Code.tsx`**
   (dos copias de `useQr` y del reloj). **Separar:** `platform/camera/useQrDrawing.ts` y
   `useCountdown(since, seconds)` en la plataforma.
6. `screens/Sheets/confirm-texts.ts` está dentro de `screens/`: va junto a `texts.ts`.
7. La entrada está excluida del control de `useState` sin `// local:` (`tools/checks/local-state.ts`,
   línea 12): correcto (todo es del dispositivo).

### 3.6 Piezas comunes (`ui/`) y teclado (`platform/keyboard.ts`) — mediano

1. **El teclado funciona leyendo marcas del HTML.** `platform/keyboard.ts` líneas 1–14 lo
   documentan: `data-layer`, `data-key`, `data-mark`, `data-close`, `data-arrows`/`data-arrow`,
   `data-slash`, `data-clear`, `data-page`; busca con `querySelectorAll` (líneas 21–27, 61, 98, 104,
   130, 153) y pone las clases `marked` y `show-keys` (líneas 17–18, 33–34, 143). Es un buen
   diseño (las pantallas no escuchan teclas), **pero hoy «qué tecla hace qué» está repartido en 32
   `data-key` escritos en 22 archivos** (por ejemplo `administration/.../List.tsx:97`,
   `Confirm.tsx:46` y `:57`, `frame/screens/Side/Side.tsx:48`, `SideFooter.tsx:40` y `:61`,
   `device-settings/.../Rows.tsx:24` y `:90`, `manual/screens/Guide/Guide.tsx:29, 41, 85, 96`,
   `audit-log/screens/Live.tsx:25` y `:50`). Una interfaz nueva tiene que volver a escribirlos
   todos, igual, y el manual dice qué tecla es cada cosa. **Separar:** cada módulo declara sus
   teclas en `keys.ts` (el menú ya lo hace en `menu.ts` con `shortcut`) y la plataforma ofrece
   `keyProps({ key, mark, closes, primary })` que devuelve las marcas. El motor no cambia; lo que
   cambia es que nadie escribe la letra en el HTML. Las clases `marked` y `show-keys` son un
   contrato con el CSS: se documentan en `docs/` como parte del contrato de la interfaz.
2. **Las tostadas son una pieza visual que la lógica llama.** `ui/toast/Toast.tsx` líneas 15–25
   (`showToast`, el estado y el temporizador) lo importan 12 archivos de lógica:
   `administration/saving.ts`, `users/actions.ts`, `users/refusals.ts`, `users/person-roles.ts`,
   `frame/notices/update/update.ts`, `device-settings/useSettings.ts`, `device-settings/mine/useMine.ts`,
   `sign-in/access/actions.ts`, `sign-in/offline/setting.ts`, `device-link/replaced.ts`, más las
   pantallas. Si `ui/` se rehace, la lógica se rompe. **Separar:** `platform/notify.ts` con el
   estado y `notify(words, icon, action)`; `ui/toast/Toast.tsx` solo dibuja `useStore(notice)`.
3. **El tipo `Words`** (texto largo y corto) está en `ui/say/Say.tsx` línea 4 y lo importan
   `users/texts.ts`, `frame/texts.ts`, `device-link/texts.ts` y dos `texts.ts` dentro de
   `screens/`. **Separar:** a `platform/text.ts`.
4. **El botón maneja la espera y el teclado.** `ui/button/Button.tsx` líneas 26–52: usa
   `useWaiting` (que no se toque dos veces, 00 · R7) y escribe las marcas del teclado. La espera ya
   está en `platform/waiting.ts`: bien; las marcas del teclado deberían salir de `keyProps` (punto
   1). Así un botón nuevo cumple el contrato sin copiar el viejo.
5. **El diálogo bloquea la aplicación por id y elige el foco por marcas.** `ui/dialog/Dialog.tsx`
   líneas 30–38: `document.getElementById('app').inert = true` (00 · R5.5) y el foco en
   `[data-autofocus]` o `[data-primary]` solo en la computadora (00 · R2.12). Son reglas.
   **Separar:** `platform/modal.ts` con `useModal(boxRef)`; la pieza nueva lo usa.
6. **La cámara** (`ui/camera/Camera.tsx` líneas 25–36): prende y apaga el lector
   (`platform/camera/scanner.ts`) y cierra al primer código que sirve. **Separar:**
   `platform/camera/useScanner(videoRef, read, onCode)`.
7. **El foco «solo en la computadora»** (00 · R2.12) se repite a mano en
   `users/roles/screens/list/RoleList.tsx:26`, `users/roles/screens/role/RoleInfo.tsx:20`,
   `manual/screens/Tasks/Tasks.tsx:146`, `device-settings/.../Name.tsx:38`, `ui/dialog/Dialog.tsx:35`.
   **Separar:** una sola marca (`data-autofocus`, que ya existe) que el motor de teclado respete al
   abrir una capa, o `useAutofocus(ref)` en la plataforma.
8. Correcto: `ui/` no importa ningún módulo; `ui/settings.ts` tiene sus tiempos con nombre.

### 3.7 La aplicación (`App.tsx`, `main.tsx`) — mediano

1. **El arranque está en el mismo archivo que el dibujo.** `App.tsx` líneas 61–96 (`unknown`,
   `boot`: manda la salida pendiente, pide `/api/start`, guarda ambiente y zona, actualiza si hay
   versión nueva, confirma o cierra la sesión), 100–107 (`recheck` al volver la conexión), 116–122
   (`takeCode`: el código del QR en la dirección), 142–185 (`useStart`: nonce de Google,
   escuchas mientras está abierta). **Separar:** `app/start.ts` y `useApp.ts` que devuelvan
   `{ start, who, closed, entrance, manual, camera, testing, code }`; `App.tsx` queda con las
   líneas 209–241.
2. `App.tsx` línea 59 (`screens = { users: UsersSlot, ... }`): qué pantalla va en cada opción. Es
   composición de la interfaz: está bien que quede en la parte gráfica.
3. `main.tsx`: correcto. `watchMotion`, `watchPreferences`, `watchInstall`, `startKeyboard` son
   de la plataforma; solo `render` y los `import` de CSS son de la interfaz.
4. `sw.ts`: correcto, no sabe nada de la interfaz.

### 3.8 Administración (`modules/administration`) — chico a mediano

`useAdministration.ts`, `saving.ts` y `logic.ts` están bien.

1. **Un pedido al servidor en la pantalla.** `screens/Administration/Administration.tsx` líneas
   60–73 (`Permission`: `administrationApi.holders()` en un efecto) y 88–96 (`useClock`: el reloj
   del negocio con `setInterval`). **Separar:** al hook: `view.holders`, `view.clock`.
2. **Validar y guardar en el panel.** `screens/Administration/Margins.tsx` líneas 14–18 (lee el
   número sacando puntos y decide si guardar) y 46 (calcula a cuánto vende con `roundUp`: es la
   misma cuenta de `shared/pricing`, bien usada, pero el ejemplo de 4000 está en la pantalla, línea
   9). `screens/Administration/Pairing.tsx` líneas 89–104 (lo escrito, el rango 1 a 365, guardar
   al soltar). **Separar:** `useMargins`, `usePairingDays` en `useAdministration.ts`; el rango 1–365
   a `shared/contracts/administration.ts`.
3. **Las teclas de cada ajuste y su grupo están en la pantalla.** `screens/Administration/List.tsx`
   líneas 17–58 (`r`, `m`, `z`, `s`, `t`, `v`) y 59 (`'Precios', 'Negocio', 'Acceso'` escritos ahí,
   no en `texts.ts`). Líneas 62–73 (`focusChosen`): busca
   `[data-panel="…"] [aria-pressed="true"], … input` y reintenta 10 veces cada 16 ms. **Separar:**
   la lista de ajustes y sus teclas a `keys.ts`/`logic.ts`; los textos a `texts.ts`; el foco, una
   acción del motor de teclado («al elegir, ir a lo elegido de la capa nueva»).
4. **Las flechas entre opciones** (`screens/Administration/Options.tsx` líneas 20–29): recorren
   los hermanos del HTML (`parentElement.children`). Es una regla del teclado (R1.8) escrita como
   dibujo. **Separar:** la marca `data-arrows` del motor, o un `useRoving()` de la plataforma.
   Línea 49: «de arranque» escrito en la pantalla.
5. `AdministrationSlot.tsx` línea 6 y `users/UsersSlot.tsx` línea 8: el texto está ahí a propósito
   (no cargar `texts.ts` en el arranque). Aceptable; mejor un `slot-texts.ts` chico.

### 3.9 Configuración (`modules/device-settings`) — chico

`useSettings.ts`, `mine/useMine.ts`, `mine/rules.ts`, `preferences.ts`, `rules.ts` e
`install-offer.ts` están bien.

1. `screens/Settings/Devices/Here.tsx` líneas 95–110: el borrador del nombre, guardar y «el
   brillo» por `shineMs`; líneas 48–50: el paso de confirmar quién es antes de vincular la huella.
   **Separar:** a `mine/useMine.ts`.
2. `screens/Settings/Devices/Name.tsx` líneas 38–46: la limpieza y la cuenta de letras usan
   `shared` (bien), pero la decisión de guardar está en el `submit` de la pantalla.
3. `screens/Settings/Summary.tsx` líneas 19–20: desplazarse por id. Es dibujo: correcto.
4. `screens/InstallSheet/InstallSheet.tsx` línea 45: «Ferrebress» escrito en la pantalla.

### 3.10 El manual (`modules/manual`) — chico

`useManual.ts`, `state.ts`, `search.ts`, `view.ts`, `place/`, `files/` están bien: `view.ts` es
exactamente el contrato que se propone para todas las pantallas.

1. `screens/Tasks/Tasks.tsx` líneas 90–112 (`useFolds`: qué capítulos están desplegados y cuándo
   se abre uno solo) es una regla (R6.8). Al hook.
2. `screens/AllSteps/AllSteps.tsx` líneas 64–67: desplazarse a `[data-task="…"]`. Dibujo: correcto.
3. `screens/Stage/Shot.tsx`: posiciona los rótulos midiendo el HTML. Es dibujo: correcto.
4. `screens/AllSteps/AllSteps.tsx` líneas 70–80 usa las clases de `ui/button/button.css`
   (`button button-small`) sin la pieza `Button`: depende del CSS de otra pieza.
5. `tools/checks/manual-code.ts` línea 11: el control de que el manual va aparte busca la clase
   `manual-page`. Si la pantalla nueva no la tiene, el control falla aunque todo esté bien.
   **Separar:** buscar un nombre de archivo o un comentario marcador, no una clase.

### 3.11 `src/shared/`

No tiene nada de interfaz. `shared/pricing/rounding.ts`, `shared/text/clean.ts`,
`shared/time/business.ts` y los contratos se usan desde la lógica y, en algunos casos, desde
pantallas (`Margins.tsx`, `Name.tsx`): eso está bien si la pantalla solo muestra el resultado.

### 3.12 Textos

Están casi todos separados en `texts.ts` (once archivos). Lo que falta:

- **Escritos en el `.tsx`:** `administration/screens/Administration/List.tsx:59` («Precios»,
  «Negocio», «Acceso»), `Options.tsx:49` («de arranque»), `users/screens/Overlays/Lost.tsx:81`
  («usado …»), `device-settings/screens/InstallSheet/InstallSheet.tsx:45` («Ferrebress»),
  `frame/notices/crash/crash.ts:19–20, 43, 49`.
- **Archivos de textos dentro de `screens/`** (se borrarían con la interfaz):
  `device-link/screens/Detail/texts.ts`, `frame/screens/NoPermission/texts.ts`,
  `sign-in/screens/Sheets/confirm-texts.ts`.
- **Topes escritos en el HTML** (`maxLength`): `users/screens/Overlays/Authorize.tsx:66, 126`,
  `device-settings/.../Name.tsx` (`deviceNameMax * 2`).

### 3.13 Lo que ya cumple

- `platform/` no importa ningún módulo (lo controla `platform-sin-negocio`), y salvo
  `keyboard.ts` y `motion.ts` (que pone `data-motion` en `<html>`, un contrato con
  `styles/base.css`) no toca el HTML.
- El espejo (`platform/mirror/`) no lee ni escribe el HTML: trabaja con valores con nombre.
- El tiempo real, los transportes, la cola sin conexión, la sesión y su vencimiento, el reloj del
  servidor, la versión nueva (`frame/notices/update/update.ts`) y el service worker no saben nada
  de la interfaz.
- Hooks bien hechos que se pueden usar tal cual: `useAdministration`, `useUsers` (`state.ts`),
  `useAuditLog` (`state.ts`), `useLinkView`, `useManual`, `useSettings`, `useMine`, `useSignIn`,
  `useOfflineEntry`, `useComputerCode`, `usePhoneCode`.
- Las reglas puras con pruebas propias: `menu.ts`, `audit-log/logic.ts`, `tape.ts`,
  `device-link/machine/`, `roles/draft.ts`, `roles/search.ts`, `mine/rules.ts`.
- Las horas solo se escriben en `platform/time.ts` (control `loose-times`) y nadie arma HTML con
  texto (`raw-html`).
- Los colores de las pantallas están en CSS; las excepciones son el dibujo del QR
  (`QrBlock.tsx:54`, `Code.tsx:91`), la ola de la entrada (`Scene.tsx:146–147`) y la «G» de
  Google (`GoogleG.tsx`), que son dibujos y está bien que vivan en la interfaz.

## 4. Para un programador: cómo hacerlo

### 4.1 La regla, en una línea por carpeta

| Carpeta | Puede importar | No puede importar |
|---|---|---|
| `ui/**`, `styles/**` | `preact`, `preact/hooks`, otras piezas de `ui/`, `platform/ui-contract/*` (ver abajo) | `modules/**`, el resto de `platform/` |
| `modules/*/screens/**` | `ui/`, `styles/`, el hook de su módulo (`use*.ts`), `texts.ts`, `keys.ts`, `view.ts` y tipos, la parte de interfaz de la fachada de otro módulo | `api.ts`, `actions.ts`, `saving.ts`, `state.ts` salvo su contexto, `platform/server`, `platform/realtime`, `platform/peer`, `platform/mirror`, `platform/device/storage`, `platform/router` (salvo leer la dirección), `document`, temporizadores |
| `modules/*/*.ts` fuera de `screens/` | `platform/`, `shared/`, la fachada de otros módulos, `preact/hooks`, `createContext` y tipos de `preact` | `ui/`, `screens/`, `.css`, JSX |
| `platform/**` | `shared/`, `preact/hooks` | `modules/`, `ui/`, `screens/`, `.css` |

`platform/ui-contract/` (nuevo, chico): lo único que la interfaz necesita de la plataforma para
cumplir el contrato: `keyProps`, `privateProps`, `useModal`, `useAutofocus`, `useWaiting`,
`useBackStep`, `useScanner`, `useQrDrawing`, `useCountdown`, `useNarrow`, `useStore` y el tipo
`Words`.

### 4.2 La forma de un hook de pantalla

Igual que `manual/view.ts`: un tipo con datos ya calculados y acciones con nombre. Ninguna acción
recibe un `HTMLElement` ni un evento; ninguna devuelve JSX. Ejemplo para la cinta:

```ts
type TapeView = {
  day: AuditDay | undefined; steps: AuditView[]; current: AuditView | undefined;
  index: number; isolated: string | undefined; playing: boolean;
  load(date: string): void; go(step: 1 | -1): void; move(id: string): void;
  isolate(id: string): void; togglePlay(): void; stopPlay(): void; close(): void;
};
```

### 4.3 Los contratos que la interfaz nueva sí tiene que cumplir

Son pocos y hay que escribirlos en `docs/technical/architecture.md` («Contrato de la interfaz»):

1. **Teclado:** cada capa lleva `data-layer`; cada cosa que se recorre, `data-mark`; lo que cierra,
   `data-close`; y así con las ocho marcas de `platform/keyboard.ts`. Todas se ponen con
   `keyProps(...)`, nunca a mano. El CSS da forma a `.marked` y `.show-keys`.
2. **Lo privado:** todo lo que muestra un nombre o un correo lleva `privateProps`; si no, la
   captura de «Algo salió mal» lo incluye (`frame/notices/crash/crash.ts:38–39, 65–69`).
3. **La raíz:** `#app` es lo que el diálogo vuelve inerte (`ui/dialog/Dialog.tsx:31`); con
   `useModal` deja de depender del id.
4. **Movimiento:** `html[data-motion="off"]` apaga las animaciones; `.keeps-moving` las deja.
5. **Accesibilidad:** cada botón y campo con su nombre accesible y su rol (es lo que usan las
   pruebas, ver 5).

### 4.4 Orden sugerido

1. Sacar de `ui/` lo que llama la lógica: `notify`, `Words`, `IconName` (medio día; destraba que
   `ui/` sea reemplazable).
2. `keys.ts` por módulo y `keyProps` (un día; afecta 32 lugares).
3. `crash.ts` sin leer el HTML (medio día).
4. Por módulo, de lo grande a lo chico: Usuarios y Roles, marco, Quién hizo qué, vínculo, entrada,
   `App.tsx`, Administración, Configuración, manual. En cada uno: crear el hook, mover el código,
   sumar las pruebas del hook (`renderHook` de `@testing-library/preact`), dejar la pantalla solo con
   HTML.
5. Sumar las reglas de 4.6 al final de cada módulo, como aviso primero y como error cuando el módulo
   quede limpio.

### 4.5 Riesgos al separar

- **Las claves del espejo** (`useMirrored('users.authorize.email', …)`) se registran mientras el
  componente está montado (`platform/mirror/use-mirrored.ts`). Al pasar al hook hay que mantener el
  mismo nombre y que el hook se llame una sola vez por pantalla, o dos dispositivos con versiones
  distintas no se entienden.
- **El control de `// local:`** (`tools/checks/local-state.ts`) mira todo `modules/`: al mover un
  `useState` a un hook, se mueve con su comentario.
- **La cobertura del 100 %**: lo que hoy se cubre renderizando la pantalla pasa a cubrirse con
  pruebas del hook; hay que escribirlas antes de mover (las pruebas no se cambian para que el
  código pase).

### 4.6 Reglas para que nadie vuelva a mezclar

**En `.dependency-cruiser.cjs`** (`pnpm imports`):

```js
{ name: 'logica-sin-interfaz', severity: 'error',
  from: { path: '^src/app/(platform|modules/[^/]+)/', pathNot: ['/screens/', '\\.tsx$'] },
  to:   { path: ['^src/app/ui/', '/screens/', '\\.css$'] } },
{ name: 'ui-solo-su-contrato', severity: 'error',
  from: { path: '^src/app/ui/' },
  to:   { path: '^src/app/(modules|platform)/', pathNot: '^src/app/platform/ui-contract/' } },
{ name: 'pantallas-sin-servidor', severity: 'error',
  from: { path: '/screens/' },
  to:   { path: ['^src/app/platform/(server|realtime|peer|mirror|offline|device/storage)',
                 '^src/app/modules/[^/]+/(api|actions|saving)\\.ts$'] } },
{ name: 'pantallas-solo-por-su-hook', severity: 'error',
  from: { path: '^src/app/modules/([^/]+)/.*screens/' },
  to:   { path: '^src/app/platform/', pathNot: '^src/app/platform/ui-contract/' } },
```

(La de `logica-sin-interfaz` con `dependencyTypesNot: ['type-only']` si se quiere permitir un
`import type` de un componente en una fachada.)

**En `biome.json`** (`pnpm lint`), un `override` para `src/app/**/screens/**` y `src/app/ui/**`:

- `style/noRestrictedImports` con `preact/hooks` → prohibidos `useEffect`, `useLayoutEffect`,
  `useReducer` (las pantallas no tienen efectos; los efectos van en el hook). `useRef` y `useState`
  quedan permitidos para lo puramente visual, marcado con `// vista:` (ver abajo).
- `style/noRestrictedGlobals` con `document`, `setTimeout`, `setInterval`, `fetch`, `history`,
  `navigator`, `localStorage`.

Y para los `.ts` fuera de `screens/`: `noRestrictedImports` de `preact` salvo `createContext` y
tipos.

**Controles nuevos en `tools/checks/`** (como `local-state.ts`, en `pnpm lint`):

1. `screen-state.ts`: cada `useState`/`useRef` en `screens/` y `ui/` lleva `// vista:` con el
   motivo (abierto o cerrado, la animación, el foco), igual que hoy `// local:`.
2. `screen-keys.ts`: ningún `data-key=`, `data-mark=`, `data-close=`, `data-private=` escrito a
   mano en `screens/` o `ui/`: se usan `keyProps` y `privateProps`. Y ningún `querySelector`,
   `closest(`, `getElementById`, `classList` fuera de `platform/ui-contract/`, `platform/keyboard.ts`
   y la interfaz.
3. `texts-home.ts`: ningún `*texts*.ts` dentro de `screens/`, y ningún literal con letras en el
   JSX de `screens/` (la regla de `raw-html.ts` muestra cómo recorrer las líneas).
4. `tsx-home.ts`: ningún `.tsx` fuera de `screens/`, `ui/`, `App.tsx`, `main.tsx` y las pruebas.
5. Cambiar `tools/checks/manual-code.ts` para que no dependa de la clase `manual-page`.

## 5. Las pruebas que se romperían al cambiar la interfaz

### Qué hay hoy

- **70 pruebas `.test.tsx`** dibujan pantallas con Testing Library. La mayoría busca como la
  persona (`getByRole`, `getByText`, `getByLabelText`): esas siguen valiendo con otra interfaz si
  la nueva usa los mismos textos y nombres accesibles.
- **42 archivos de prueba usan selectores de CSS o clases** (`querySelector('.algo')`,
  `classList.contains`, `toHaveClass`). Los que más: `frame/frame.test.tsx` (24 usos),
  `audit-log/tape.test.tsx` (17), `audit-log/audit-log.test.tsx` (16),
  `sign-in/entrance.test.tsx` (10), `manual/manual-screen.test.tsx` (10),
  `audit-log/live.test.tsx` (10), `manual/manual-phone.test.tsx` (8), `frame/phone.test.tsx` (8),
  `users/users-list.test.tsx` (7), `ui/ui.test.tsx` (6), `users/users-permissions.test.tsx` (6),
  `device-settings/mine-here.test.tsx` (6). Y los «kits» que comparten varias pruebas:
  `users/users-test-kit.tsx:141–146` (`.users-row`, `.users-card`, `.toast`),
  `audit-log/audit-test-kit.tsx:155–156` (`.audit-row`, `.audit-detail-body`),
  `administration/administration-test-kit.tsx:72–77` (`.toast`, `.admin-option`),
  `users/users-roles-kit.tsx:32` (`.role-screen`). **Todas estas se rompen**, aunque la lógica no
  cambie.
- **Las pruebas del teclado** (`administration-keys`, `users-keys`, `users-roles-keys`,
  `manual-keyboard`, `platform/keyboard.test.ts`, `keyboard-layers.test.ts`) dependen de las marcas
  `data-*`. Siguen valiendo si la interfaz nueva cumple el contrato de 4.3.
- **De punta a punta** (`tests/e2e/`): 19 selectores de clase (`roles.spec.ts` y `users.spec.ts`
  con `.users-row`, `.users-tab`, `.toast`, `#more-options`, `.part.more`; `google.spec.ts`,
  `support/google.ts` y `offline.spec.ts` con `.google[data-drawn]` y `.frame[data-net=]`;
  `headers.spec.ts` con `.manual-ring-label`) frente a 62 búsquedas por rol o texto.
- **De captura** (`tests/screens/`): 16 selectores de clase y **22 imágenes de referencia**
  (`tests/screens/references/*.png`). Las imágenes se rompen todas, por definición: son la
  interfaz de hoy.
- **El manual** (`tests/manual/*-scenes.ts`): 84 selectores de clase (por ejemplo
  `roles-scenes.ts:53` `.roles-row`, `users-scenes.ts:98–175` `.users-row`, `.users-card`,
  `.users-chip`, `#users-sessions h3`) que eligen dónde va cada punto de las capturas. Con otra
  interfaz hay que volver a sacar todas las capturas y los clips (`docs/manual/media/`) y releer el
  texto de cada capítulo de `docs/manual/` (nombra botones y teclas, por ejemplo
  `docs/manual/users.md:13` «Alt S»). `tests/manual/capture.ts:36–52` además busca la clase
  `notice` para ubicar el ícono.

### Qué hacer

1. **Las pruebas de la lógica, sin pantalla.** Cada hook nuevo (4.2) se prueba con `renderHook`,
   sin HTML: esas pruebas no se rompen nunca al cambiar la interfaz y llevan la mayor parte de la
   cobertura. Es lo que hoy ya hacen `logic.test.ts`, `tape-rules.test.ts`, `draft.test.ts`,
   `machine/*.test.ts`.
2. **Las pruebas de pantalla, solo por lo que ve y toca la persona.** Cambiar los selectores de
   clase por `getByRole(..., { name })`, `getByLabelText` y `getByText` con los textos de
   `texts.ts` (no copiados). Empezar por los cuatro kits: arreglando un kit se arreglan decenas de
   pruebas. Así «probar por lo que ve y toca la persona» sigue valiendo con cualquier HTML, siempre
   que la interfaz nueva use los mismos textos y roles accesibles (que es, además, el contrato de
   accesibilidad).
3. **Una regla para que no vuelva:** en `tools/checks/`, prohibir `querySelector('.`,
   `classList` y `toHaveClass` en `*.test.tsx` y `tests/**`, salvo en las pruebas de `ui/` (que
   prueban la pieza misma) y con un comentario que diga por qué.
4. **Las de captura y el manual se rehacen con la interfaz**: es esperado. Pero conviene que
   `tests/manual/*-scenes.ts` también busque por rol y texto, para que rehacer la interfaz sea
   volver a correr `pnpm manual:media`, no reescribir las escenas.
5. **Las de punta a punta**: cambiar los 19 selectores de clase por roles; quedan válidas sin
   tocarlas después.
