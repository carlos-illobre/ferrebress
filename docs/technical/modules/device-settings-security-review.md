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
