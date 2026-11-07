# Revisión de seguridad · 04 · Configuración del dispositivo (`device-settings`), etapa a

## Paso 4: el diseño

Revisión independiente del [diseño](device-settings.md) desde el punto de vista de un atacante
(constitución, paso 4). Todavía no hay código del módulo. Leí la constitución, el
[capítulo 04](../../chapters/04-device-settings/rules.md) (R1 a R5, E01 a E36), 15 · R1 y 03 · R6.2,
la [arquitectura](../architecture.md) y lo que ya existe y el diseño reutiliza o cambia:
`src/app/platform/device/storage.ts`, `src/app/platform/schema.ts`, `src/app/platform/back-step.ts`,
`src/app/ui/sheet/Sheet.tsx`, `src/app/modules/sign-in/offline/setting.ts`, `option.ts` y
`enter.ts`, `src/app/modules/sign-in/session.ts` (la marca `passkey`),
`src/app/modules/frame/context.ts`, `src/app/public/manifest.webmanifest`, `deploy/Caddyfile` y, del
servidor, `sign-in/offline/phone-owner.ts`, `sign-in/offline/rules.ts` y
`sign-in/passkeys/link-routes.ts`.

- **Frena:** se puede entrar, ver o cambiar lo ajeno, o filtrar datos personales. Se resuelve antes
  de aprobar el diseño.
- **Mejora:** conviene hacerla; no frena.

## Resumen

El diseño es chico en superficie: nada nuevo en el servidor, ninguna ruta, ningún evento, ningún
pedido, ninguna dependencia, ningún texto que venga de afuera y se dibuje. Lo que entra de afuera es
solo `localStorage`, que cambia quien ya tiene el dispositivo en la mano. **No encontré nada que
frene.** El punto que más importa es el renglón de «Trabajar sin conexión» al mudarse: el diseño lo
arma ahora también con datos del dispositivo (el permiso guardado y la marca `passkey`, que es de
todo el celular y no de la persona), y deja sin definir un caso en el que, si se programa al pie de la
letra, una persona con sesión le apaga a otra la entrada sin conexión en un celular compartido.

| # | Punto | Gravedad |
|---|---|---|
| 1 | «Trabajar sin conexión»: el caso «tengo el permiso, el celular tiene la huella de otro» no está definido, y la marca `passkey` es del celular, no de la persona | Mejora importante |
| 2 | Lo guardado: la validación al leer no dice cómo se hace ni valida el identificador ni `usedAt` | Mejora |
| 3 | `usedAt` deja en la computadora compartida cuándo usó cada persona ese dispositivo | Mejora |
| 4 | El aviso para instalar se ofrece igual en el ambiente de pruebas, con el mismo nombre e ícono | Mejora |
| 5 | El aviso y los valores de Configuración deben quedar fuera del espejo, y el diseño no lo dice del aviso | Mejora |
| 6 | `formatTime` en `sign-in/offline/when.ts`: que mudar la hora de lugar no toque el cálculo del plazo | Mejora |

### 1. «Trabajar sin conexión»: el estado `'needs-passkey'` y la marca del celular

**Dónde:** diseño § 5, «"Trabajar sin conexión" se muda (R5)»; § 7, «Quién puede».

Hoy `useOfflineSetting` muestra el renglón solo si el servidor mandó `offline: true` en la persona
(`withOffline`: la sesión es de un celular, la huella activa de ese celular es de esa persona y tiene
el permiso). Prender la opción es solo del dispositivo: `enableOffline(who)` guarda en
`offline-option` **una sola persona** por celular, sin pedir nada al servidor. Lo único que impide que
cualquiera la prenda es que el renglón no aparece sin ese `offline` del servidor.

El diseño suma `'needs-passkey'` «cuando la persona tiene el permiso `offline.work` pero no su huella
en ese celular (sin `offline` en la persona **y** sin la marca de huella guardada)». La marca es
`passkey` de `session.ts`: un `true` del celular entero, que queda puesto cuando **cualquiera** vinculó
su huella ahí. Queda un tercer caso sin estado: permiso, sin `offline` del servidor y con la marca
puesta. Es justo el celular compartido donde la huella es de otra persona. (Se entiende por qué está la
marca: en una sesión abierta sin conexión la persona viene de `offline-option`, que no guarda
`offline`, y sin la marca el renglón diría «vinculá tu huella» a quien acaba de entrar con ella.)

**El ataque, si se programa «permiso y no `needs-passkey`, entonces la llave»:**

1. El depósito tiene un celular compartido. Ana vinculó su huella en él y prendió «Trabajar sin
   conexión»: `offline-option` es Ana.
2. Beto, que también tiene el permiso `offline.work`, entra con Google en ese celular. El servidor no
   le manda `offline` (la huella es de Ana), pero la marca `passkey` está, así que no cae en
   `'needs-passkey'`: ve la llave, apagada, porque `offline-option` no es él.
3. Beto la toca. Hay conexión, así que corre `enableOffline(Beto)`: `offline-option` pasa a ser Beto.
4. Se corta internet. Ana, en la entrada, ya no tiene «Entrar con huella»: la opción es de Beto. Beto
   tampoco puede entrar (la huella del celular es de Ana y `isOwn` lo rechaza), así que nadie entra.

No da acceso a nadie (la firma y el servidor siguen protegiendo), pero una persona con sesión le apaga
a otra, sin que se entere, la única forma de atender sin internet en ese celular. Basta con que Beto
toque la llave por curiosidad.

**Qué propongo:** que el diseño diga, en § 5, los cuatro estados con su condición exacta y que **la
llave solo se puede prender con `offline: true` del servidor** (como hoy); la marca y el permiso
guardado sirven solo para elegir qué texto se muestra, nunca para habilitar `enableOffline`. Para el
caso del celular con la huella de otro: o `'needs-passkey'` (lo que dice R5.3 tal cual, «sin la huella
vinculada en ese celular»), o que en una sesión sin conexión se use la persona de `offline-option`
para saber que la huella es suya, en lugar de la marca del celular. Y una unitaria que lo intenta:
permiso, marca `passkey` puesta, sin `offline`, con conexión, se toca el renglón y `offline-option`
no cambia. Cuesta un párrafo en el diseño y una prueba.

### 2. Lo guardado: cómo se valida al leerlo

**Dónde:** diseño § 2 y § 7, «Qué entra de afuera».

`readStored<T>` hace `JSON.parse` y un `as T`: no valida nada. El diseño dice que «un valor que no es
uno de los esperados se toma como lo de arranque», pero no dice con qué ni qué campos. Quien tiene el
dispositivo puede escribir en `preferences` cualquier cosa: claves que no son identificadores
(`__proto__`, `constructor`, miles de claves), `usedAt` como texto o `NaN`, `timeFormat` con otro
valor. Lo peor que logra es romper su propia pantalla (un orden con `NaN` que nunca poda el tope, una
excepción en el arranque si alguien lee `prefs[userId].animations` sin mirar), en su dispositivo. No
es un ataque contra otro, por eso es mejora, pero una excepción en el arranque deja la aplicación en
blanco y el arreglo es barato.

**Qué propongo:** validar con las piezas que ya están en el arranque (`platform/schema.ts`: `oneOf`,
`flag`, y un número finito para `usedAt`), fila por fila, descartando la que no cierra; tomar solo
claves con forma de UUID y leer con `Object.hasOwn` (o pasar a un `Map`); y si después de validar hay
más de `maxPeople`, podar al leer. Lo mismo para `install`. La fila de pruebas de § 9 («Seguridad»)
debería nombrar esos casos: JSON roto, `__proto__` como clave, `usedAt` no numérico, más de 20 filas.
Cuesta media hora.

### 3. `usedAt`: cuándo usó cada persona la computadora compartida

**Dónde:** diseño § 2 (`usedAt: number`) y § 7, «Lo que se ve de otros».

La sección dice que lo que se ve de otros es solo qué identificadores entraron ahí. Con `usedAt` se ve
también **cuándo** fue la última vez de cada una, con hora exacta, para hasta 20 personas. Quien se
sienta en la computadora del mostrador y abre la depuración lee la lista; el identificador se cruza con
el nombre en Usuarios o en Quién hizo qué, y sabe, por ejemplo, que Juan entró a esa computadora a las
22:40 de ayer. Es poco y quien tiene permiso de auditoría ya lo ve, pero es un dato de actividad
de una persona que hoy un vendedor sin permisos no tiene, y para podar el tope no hace falta la hora.

**Qué propongo:** guardar el orden en lugar de la hora (las filas en un arreglo, la más reciente al
final, o un contador que sube), y actualizarlo solo al cambiar una preferencia, no en cada entrada, así
la lista no registra quién entró cuándo. Corregir § 7 para que diga lo que queda. Cuesta lo mismo que
programarlo con la hora.

### 4. El aviso para instalar también en el ambiente de pruebas

**Dónde:** diseño § 4, `platform/install.ts`, y § 6, el aviso; `src/app/public/manifest.webmanifest`.

El armado es uno solo para los dos ambientes y el manifiesto dice «Ferrebress» con el mismo ícono. Hasta
ahora instalar dependía de que alguien lo buscara en el menú del navegador; con este diseño, **todo
celular que entra al ambiente de pruebas** recibe el aviso «Instalá Ferrebress para abrirla desde un
ícono». Un vendedor al que Carlos le hizo probar algo en el ambiente de pruebas termina con dos íconos
iguales y, el día que toca el equivocado, vende o cobra en la base de pruebas creyendo que es la de
verdad. No es un atacante, pero son datos del negocio que se cargan donde no van. No pude comprobar
qué se ve hoy en la aplicación para distinguir el ambiente (el arranque trae `environment`).

**Qué propongo:** que Caddy (o el armado) sirva en el ambiente de pruebas un manifiesto con otro
`name`/`short_name` («Ferrebress pruebas») y otro ícono, o que el aviso no se ofrezca fuera de
producción. Lo primero es un archivo y una línea de Caddy; lo segundo, una condición en
`install-offer.ts`. Decide Carlos si lo quiere.

### 5. El espejo: el aviso y los valores, fuera de `useMirrored`

**Dónde:** diseño § 6, «El espejo (R1.6)» y «El aviso para instalar».

Para los valores de Configuración el diseño ya dice lo correcto: van en los `Store` del dispositivo, no
en valores con nombre, y sumarlos al espejo dejaría que quien está en la computadora vinculada cambie
las preferencias del celular de otro (E08). Para el aviso para instalar no dice nada, y la arquitectura
pide que «lo abierto encima (una hoja…)» vaya en valores con nombre: quien lo programe siguiendo la
regla general lo espejaría. No da para atacar (el aviso no aparece en la computadora y `prompt()` pide
un toque de verdad), pero mezclaría el estado `offered` de dos dispositivos.

**Qué propongo:** una línea en § 6: el aviso es del dispositivo, se abre con `install-offer.ts` y no va
en `useMirrored`, con su comentario en el código. Y que la unitaria de E07/E08 compruebe también que
por el canal no viaja ninguna clave de `device-settings` (ni la llave de «Trabajar sin conexión», que
en el celular espejado queda a la vista). Cuesta una línea y un `expect`.

### 6. `when.ts` pasa a `formatTime`

**Dónde:** diseño § 4, `platform/time.ts`, «Las horas que hoy se escriben por su lado pasan a
`formatTime`».

`sign-in/offline/when.ts` dice hasta cuándo se puede entrar sin conexión. Cambiar cómo se escribe esa
hora no debe tocar cómo se calcula (`offlineUntil`, el margen del reloj); si al mudarlo alguien
recalcula el plazo con la hora del celular o con la zona del negocio, la persona vería un plazo que no
es el que aplica el celular. El servidor igual decide al volver la conexión (15, diseño § 4), así que
no abre la puerta a nadie.

**Qué propongo:** que la tarea 2 diga que solo cambia el texto, y que la unitaria de `when.ts` siga
pasando sin tocarla. Sin costo.

### El resto, punto por punto

- **Entrar sin permiso:** nada nuevo. No hay sesión, código ni ruta nueva; la entrada aplica lo de
  arranque sin leer las preferencias de nadie, así no deja ver quién entró último (E05).
- **Permisos:** Configuración no pide permiso y no trae nada del servidor. «Trabajar sin conexión»
  sigue con su permiso y su huella; ver el punto 1.
- **Lo que entra de afuera:** solo `localStorage` (punto 2). Ningún texto de afuera se dibuja: las
  horas de muestra salen de `Intl` y el atributo `data-motion` tiene un valor fijo.
- **El navegador:** la política de contenido de Caddy ya tiene `manifest-src 'self'`, `style-src 'self'`
  y `frame-ancestors 'none'`; poner un atributo en `<html>` y leer `matchMedia` no necesitan nada más.
  `beforeinstallprompt` con `preventDefault()` solo cambia quién muestra el aviso; `prompt()` lo
  dibuja el navegador y pide un toque de verdad, así que ni el espejo ni una página falsa lo
  disparan. `related_applications` con `platform: "webapp"` nombra solo el propio manifiesto; según la
  documentación de Chrome, una aplicación instalada se ve solo desde su mismo alcance, así que otro
  sitio no puede usarla para saber si Ferrebress está instalada. No lo pude comprobar en un navegador.
  Funcional, no de seguridad: la misma documentación dice que en la computadora el renglón de
  `related_applications` necesita también el `id` de la aplicación, que el manifiesto hoy no tiene; se lo
  dejo a la revisión del diseño.
- **Datos personales y secretos:** ninguno nuevo salvo lo del punto 3; nada sale de la máquina.
- **Abuso y disponibilidad:** sin pedidos, sin canales, sin memoria del servidor. El tope de 20 acota
  lo guardado (ver el punto 2 para cuando lo guardado viene ya pasado del tope).
- **Sin conexión:** la etapa no guarda nada sin conexión; lo de entrar con la huella no cambia, salvo
  el punto 1.
- **Auditoría:** nada que anotar (R1.7). Prender o apagar «Trabajar sin conexión» sigue sin pasar por
  el servidor, como ya era (diseño de 15): no es nuevo.
- **El despliegue:** no cambia, salvo la línea del manifiesto (y el punto 4, si Carlos lo quiere).
- **Dependencias:** ninguna nueva. `pnpm audit --prod` queda para el paso 7.

Fuentes consultadas: [Chrome, «Get installed related apps»](https://developer.chrome.com/docs/capabilities/get-installed-related-apps)
y [web.dev, «get installed related apps»](https://web.dev/articles/get-installed-related-apps).

## Paso 7: el código

Revisión del código de la etapa a contra el [diseño](device-settings.md) corregido: los commits
`3a847c5`, `b4b453a` y `c88c60e`. Leí `src/app/modules/device-settings/` entero,
`src/app/platform/{install,motion,time}.ts`, `src/app/modules/sign-in/offline/setting.ts` (y, para
entenderlo, `option.ts`, `enter.ts` y `session.ts`), los cambios en `ui/sheet`, en el marco, en
`App.tsx` y `main.tsx`, `src/app/vite.config.ts`, `src/app/public/manifest.webmanifest`,
`deploy/Caddyfile`, `deploy/compose.yml` y las pruebas. Corrí las unitarias del módulo, de las tres
piezas de `platform/` y de `sign-in/offline` (12 archivos, 67 pruebas, todas pasan), levanté el
`Caddyfile` del repositorio en `caddy:2.11-alpine` con `ENVIRONMENT=testing` y `production`, y corrí
`pnpm audit --prod`.

### Resumen

**No encontré nada que frene.** El código no suma rutas, pedidos, eventos, canales ni dependencias; no
dibuja texto que venga de afuera (ningún `innerHTML` ni `dangerouslySetInnerHTML`) y no pasa nada por
el espejo (ningún `useMirrored` en el módulo). La llave de «Trabajar sin conexión» se prende solo con
`offline` del servidor, y hay una prueba que intenta el ataque del punto 1 del paso 4 y falla. Lo que
queda son mejoras: la más importante es que, en una sesión abierta sin conexión, la dueña de la huella
no puede apagar la opción y el renglón le dice que la huella es de otra persona.

| # | Punto | Gravedad |
|---|---|---|
| 7.1 | En una sesión abierta sin conexión, la dueña de la huella no puede apagar «Trabajar sin conexión» y lee que la huella es de otra | Mejora importante |
| 7.2 | E07/E08 (el espejo) no tienen prueba: nada comprueba que los valores no viajan | Mejora |
| 7.3 | La prueba de `__proto__` no prueba lo que dice | Mejora |
| 7.4 | El manifiesto de pruebas no tiene prueba que lo compruebe | Mejora |

### Cómo quedó lo del paso 4

1. **La llave y la marca del celular: resuelto.** `setting.ts:30-37`: sin `offline` del servidor, el
   renglón vuelve con `toggle: () => undefined` y la marca `passkey` solo elige el texto.
   `offline-screens.test.tsx`, «device-settings-E30, E37»: Ana prende la suya, Beto con el permiso y
   la marca puesta toca la llave y `offline-option` sigue siendo Ana. Es la prueba que intenta el
   ataque. Queda un caso cercano, el 7.1.
2. **La validación al leer: resuelto.** `preferences.ts`: `JSON.parse` dentro de `readStored` con
   `try`, `order` y `of` comprobados como arreglo y objeto, clave con forma de UUID antes de
   `Object.hasOwn`, cada valor con `flag` y `oneOf`, repetidas descartadas y el tope aplicado al leer.
   La prueba de seguridad cubre JSON roto, tipos cambiados, valores fuera de lo esperado, más de 20 y
   repetidas; la de `__proto__`, ver 7.3. Una clave rara en la sesión (`person.userId`) no llega a
   leer del prototipo: `read()` arma `of` solo con claves validadas.
3. **`usedAt`: resuelto.** No se guarda ninguna hora: solo `order`, y cambia solo al cambiar una
   preferencia (`choose`), no al entrar.
4. **El aviso en pruebas: resuelto.** `shouldOffer` exige `!testing`, y `App.tsx` pasa
   `start.environment !== 'production'` (también lo apaga en `e2e`). El armado emite
   `manifest-testing.webmanifest` y Caddy lo sirve en `/manifest.webmanifest` cuando `ENVIRONMENT` es
   `testing`. Lo comprobé con el `Caddyfile` del repositorio: con `testing` sale «Ferrebress pruebas»,
   con `production` sale «Ferrebress», y las dos con `application/manifest+json`, `no-cache`, la
   política de contenido de la aplicación y `nosniff`. El service worker no guarda el manifiesto
   (`kindOf` solo guarda `/assets/` y la página), así que un manifiesto viejo no queda pegado. Ver 7.4.
5. **El espejo: resuelto en el código, sin prueba.** El aviso tiene estado local (`useState` en
   `install-offer.ts` y en `InstallSheet.tsx`, con su comentario) y los valores se leen de los
   `Store` del dispositivo. Ver 7.2.
6. **`when.ts`: resuelto.** Cambió solo el texto (`formatTime`, el día del negocio para «hoy» y
   «mañana»); `offlineUntil`, el margen del reloj y la hora más alta vista siguen en `option.ts` sin
   cambios.

### 7.1. Sin conexión, la dueña de la huella no puede apagar la opción

**Dónde:** `src/app/modules/sign-in/offline/setting.ts:30-37`, con `option.ts:19` (la opción guarda la
persona sin `offline`) y `enter.ts:53` (`signedInOffline({ ...current.person, email: '' }, …)`).
Diseño § 3: «Sin conexión, Configuración abre igual, también para apagar "Trabajar sin conexión" sin
red»; 15 · R1.5, «el celular deja de poder entrar sin conexión cuando la persona apaga la opción».

**Lo que pasa, paso a paso** (comprobado leyendo el código, no con una prueba):

1. Ana vinculó su huella en el celular (la marca `passkey` queda puesta) y prendió la opción.
2. Se corta internet. Ana entra con la huella: la persona de la sesión es la de `offline-option`, que
   no tiene `offline`.
3. Abre Más → Configuración. `useOfflineSetting` cae en `!who.offline`: la llave aparece apagada, sin
   poder tocarse, y como la marca está puesta dice «Este celular tiene la huella de otra persona: solo
   ella puede trabajar sin conexión acá.». Le dice a la dueña que la huella es de otra, y le muestra
   apagada una opción que está prendida.
4. Ana quiere dejar de poder entrar sin conexión en ese celular (por ejemplo, porque lo deja en el
   depósito para el turno de otro). No puede hasta que vuelva la red.

No da entrada a nadie: para entrar sin conexión hace falta la huella de Ana, y el servidor decide al
volver la conexión. Pero el único control que la persona tiene sobre su propia entrada sin conexión
(R1.5) no está cuando más sentido tiene, y el texto la confunde sobre de quién es la huella. Antes del
módulo, en Más, el renglón directamente no aparecía en esa sesión: lo nuevo es el texto equivocado y
que el diseño prometía poder apagarla.

**Qué propongo:** en `useOfflineSetting`, si la sesión se abrió sin conexión (`offlineSession()`) y
`offlineOption.get()?.person.userId === who.userId`, devolver el renglón prendido con un `toggle` que
solo apaga (`disableOffline`); prenderla sigue pidiendo `offline` del servidor. Así la marca sigue sin
habilitar nada y la persona de `offline-option` (que entró con su firma) es la que se usa para saber
que la huella es suya, como proponía el punto 1 del paso 4. Una unitaria: sesión sin conexión de Ana,
marca puesta, la llave prendida, se toca, `offline-option` queda vacía; y la misma sesión con otra
persona en la opción no puede ni apagarla ni prenderla. Cuesta unas diez líneas y una prueba.

### 7.2. El espejo no tiene su prueba

**Dónde:** diseño § 10, fila «E07, E08: unitarias con dos dispositivos falsos… ninguna clave del módulo
ni el aviso pasan por el canal»; no hay ninguna prueba que nombre `device-settings-E07` ni `E08`.

Hoy no hay ataque: comprobé que el módulo no usa `useMirrored` y que el aviso y los valores son
locales. El riesgo es el de una regresión: la regla general de la arquitectura es llevar «lo abierto
encima» a valores con nombre, y si alguien la aplica a esta pantalla, quien está en la computadora
vinculada le cambia las preferencias al celular de otro (E08) y ve el estado de su llave de «Trabajar
sin conexión», sin que ninguna prueba falle.

**Qué propongo:** la unitaria que dice el diseño, con los dos dispositivos falsos del espejo de 03: ir
a `/device-settings` viaja; apagar las animaciones en uno no cambia `motionOff` ni `preferences` en el
otro; ningún mensaje del canal lleva `animations`, `timeFormat`, `install` ni la opción sin conexión.
Cuesta una prueba, con lo que ya existe en 03.

### 7.3. La prueba de `__proto__` no prueba lo que dice

**Dónde:** `src/app/modules/device-settings/preferences.test.ts:89-90`.

`{ __proto__: { animations: false } }` en un literal de JavaScript no crea una clave `__proto__`: cambia
el prototipo del objeto, y `JSON.stringify` lo deja afuera. Lo comprobé: sale `"of":{}`. Lo guardado
que prueba no tiene la clave peligrosa en `of`; solo en `order`, donde la frena el control de UUID. El
código está bien (el UUID se mira antes que `Object.hasOwn` y `of` se arma solo con claves validadas),
pero si mañana alguien afloja el control de UUID, esta prueba sigue pasando.

**Qué propongo:** escribir ese caso como texto JSON, que sí crea la clave:
`'{"order":["__proto__"],"of":{"__proto__":{"animations":false,"timeFormat":"h12"}}}'`, y otro con un
UUID en `order` y `of` heredando del prototipo. Cuesta dos líneas.

### 7.4. El manifiesto de pruebas no tiene prueba

**Dónde:** `deploy/Caddyfile:80-86` (`expression "{$ENVIRONMENT}" == "testing"`), `deploy/compose.yml:13-15`.

Funciona (lo comprobé, punto 4 de arriba), y pasarle al contenedor web solo `ENVIRONMENT`, en lugar
del `.env` entero, está bien: Caddy no ve ningún secreto. Dos cosas:

- Ninguna prueba lo comprueba: si alguien mueve el `rewrite` debajo del `handle` o cambia el nombre del
  archivo que emite `vite.config.ts`, el ambiente de pruebas vuelve a servir «Ferrebress» y lo que pide
  R4.7 (que nadie cargue ventas de verdad en pruebas) se pierde en silencio.
- La comparación es contra el texto exacto `testing`, y Caddy no valida el valor. Hoy eso está
  cubierto por otro lado: el servidor lee el mismo `.env` y lo valida contra `testing`, `production`
  y `e2e` (`src/server/platform/config.ts:12`), así que con un valor mal escrito no arranca, y el
  contenedor web espera a que el servidor esté sano. Si algún día el web arranca sin el servidor, esa
  defensa se pierde.

No es un ataque (cambiar `ENVIRONMENT` exige la máquina), por eso es mejora.

**Qué propongo:** una comprobación en las de punta a punta de cabeceras (`tests/e2e/headers.spec.ts`)
o en la paridad de configuración: con `ENVIRONMENT=testing`, `/manifest.webmanifest` dice «Ferrebress
pruebas»; con `production`, «Ferrebress». Si se quiere no depender del servidor, la condición al revés:
producción solo con `"{$ENVIRONMENT}" == "production"` y el de pruebas para todo lo demás, así un valor
mal escrito cae del lado que no confunde. Cuesta una prueba y, lo segundo, una línea.

### El resto, punto por punto

- **Entrar sin permiso:** nada nuevo; no hay sesión, código ni ruta nueva. La entrada sin conexión no
  cambió (solo el texto de `when.ts`).
- **Permisos:** Configuración no pide permiso ni trae nada del servidor. «Trabajar sin conexión»:
  `can(who, 'offline.work')` para mostrarla y `who.offline` del servidor para prenderla, en el celular
  (`isPhone()`); falsear que es un celular no sirve, porque prender sigue pidiendo `offline`. Lo del
  apagado sin red, en 7.1.
- **Lo que entra de afuera:** solo `localStorage`, validado (punto 2 del paso 4). `installed` e
  `install-offered` se comparan con `=== true`. `beforeinstallprompt` y `appinstalled` los manda solo
  el navegador; `getInstalledRelatedApps()` se lee como un largo, sin dibujar nada.
- **El navegador:** sin cambios en la política de contenido; el ícono del aviso es `/icons/icon-192.png`,
  del mismo origen. `prompt()` lo dibuja el navegador y pide un toque. El `rewrite` del manifiesto
  conserva todas las cabeceras de la aplicación (comprobado).
- **Datos personales y secretos:** en el dispositivo, identificadores y su orden, sin horas. Nada sale
  de la máquina. El contenedor web recibe solo `ENVIRONMENT`.
- **Abuso y disponibilidad:** sin pedidos ni canales. Lo guardado está acotado a 20 filas al leer y al
  escribir; un `preferences` enorme puesto a mano se recorre solo hasta juntar 20 válidas (o hasta el
  final del arreglo, que lo pone quien ya tiene el dispositivo).
- **Sin conexión:** nada nuevo que se haga sin conexión; ver 7.1.
- **Auditoría:** nada que anotar (R1.7), como dice el diseño.
- **El despliegue:** el `rewrite` y la variable, ver 7.4. Sin puertos, volúmenes ni privilegios nuevos.
- **Dependencias:** ninguna nueva (ni `package.json` ni `pnpm-lock.yaml` cambiaron). `pnpm audit --prod`:
  «No known vulnerabilities found».

Dos cosas que no son de seguridad y dejo a la revisión del código: con la hoja de instalar trabada,
«atrás» del celular la cierra igual (`InstallSheet.tsx:24` llama a `dismiss` desde `useBackStep`, que
no mira `locked`), contra lo que dice el diseño en § 4; y `related_applications` usa
`/manifest.webmanifest` relativo, cuando el diseño pide la dirección completa y su `id` para que lo
reconozca Chrome en la computadora. No pude comprobar en un navegador si la dirección relativa alcanza.
