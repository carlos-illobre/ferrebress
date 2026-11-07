# Revisión de seguridad del código · 04 · Configuración del dispositivo (`device-settings`), etapa b: lo mío

## Paso 7: el código

Revisión independiente del código ya programado de la etapa b, contra las
[reglas](../../chapters/04-device-settings/rules.md) (R6 a R10, E40 a E60), el
[diseño](device-settings-b.md) (§ 3, § 4, § 5, § 8 y § 12) y lo que pidió la
[revisión de seguridad del diseño](device-settings-b-security-review.md) (paso 4). Mirada como la haría
alguien del local o de afuera que quiere ver o cortar lo de otra persona, hacerse pasar por otro
dispositivo, engañar con un nombre o llenar la auditoría.

Leí los commits `da1c361` a `43ebd73` (`git diff da1c361^..HEAD`). En el servidor:
`sign-in/access/` (`me-routes.ts`, `users-routes.ts`, `cutting.ts`, `listing.ts`, `data.ts`,
`lost.ts`, `counts.ts`), `sign-in/devices/` (`routes.ts`, `names.ts`, `data.ts`),
`migrations/006-devices.ts`, `sign-in/index.ts`, `context.ts`, `settings.ts`, `sessions/store.ts`,
`sessions/open.ts`, `google/routes.ts` (`/api/start`), `codes/computer/` (`computer-routes.ts`,
`screens.ts`), `codes/phone/phone-routes.ts`, `passkeys/webauthn.ts`, `offline/`
(`phone-owner.ts`, `routes.ts`), `device-link/` (`context.ts`, `rules.ts`, `lifecycle.ts`,
`listeners.ts`, `data.ts`, `guard.ts`, `routes/codes.ts`, `routes/state.ts`),
`audit-log/` (`rules.ts`, `routes.ts`, `answers.ts`), `platform/` (`guards.ts`, `device.ts`,
`device-names.ts`, `http.ts`, `session.ts`, `storage/audit/event.ts`) y `deploy/Caddyfile`. En lo
compartido: `shared/text/clean.ts`, `shared/contracts/device-settings.ts`, `sign-in.ts`, `users.ts`,
`audit-log.ts` y `shared/audit-log/device-settings.ts`. En la aplicación:
`modules/sign-in/access/` (`api.ts`, `actions.ts`), `modules/device-settings/mine/useMine.ts`,
`modules/users/actions.ts`, `modules/sign-in/session.ts`, `sign-in/offline/watch.ts` y
`platform/device/device.ts`. Las pruebas: `access/me.test.ts`, `devices/devices.test.ts`,
`devices/names.test.ts`, `device-link/names.test.ts`, `platform/guards.test.ts`,
`audit-log/rules.test.ts`, `routes-permissions.test.ts` y `users/users-own.test.tsx`, leídas; **no las
corrí** (necesitan la base del compose). Corrí `pnpm audit --prod`: «No known vulnerabilities found».
La etapa no suma dependencias (no cambian `package.json` ni el lock).

Gravedad, como en las otras revisiones de código: **alta** (se puede quedar con la sesión o los datos
de otra persona en el uso normal; frena), **media** (un control que el diseño da por puesto falta o no
alcanza y deja pasar algo concreto, con condiciones), **baja** (endurecimiento o diferencia con el
diseño sin daño concreto). Ninguna de esta revisión frena.

## Resumen

Lo principal está bien hecho. Las seis rutas nuevas toman la persona de la sesión y nunca la reciben
(`me-routes.ts:19`); toda consulta que cierra o corta filtra por `user_id` en el mismo `UPDATE` o
`DELETE` (`access/data.ts:148` a `:192`), así que no hay IDOR ni una carrera entre «es tuya» y
«cortala» que deje tocar lo ajeno; los identificadores de la dirección pasan por `uuidParams`; uno
ajeno da `404` igual que uno que no existe y queda anotado una vez por minuto; `from` lo pone la ruta.
El nombre va siempre al dispositivo de la sesión aunque la cabecera diga otro, con su prueba. El
`device_id` ya no sale por la auditoría (ni en lo nuevo ni en las filas viejas), ni por las listas, el
vínculo, «Se perdió un celular», `/api/start` ni la lectura del QR: lo revisé ruta por ruta y no lo
encontré en ninguna respuesta. El nombre se limpia igual en la aplicación, el servidor y la base, y
Preact lo muestra siempre como texto (no hay `dangerouslySetInnerHTML` ni `innerHTML` en la
aplicación).

Lo que queda: el identificador ahora no sale del servidor, pero **sigue saliendo del navegador**: está
en el `localStorage` de cada dispositivo y la sesión toma el que diga la cabecera al entrar. En una
ferretería, la computadora del mostrador la usan todos; quien la usó una vez se lleva su identificador
y desde su casa se hace pasar por ella (punto 1). El resto son endurecimientos.

| # | Punto | Gravedad |
|---|---|---|
| 1 | El `device_id` sigue siendo el que dice el navegador: copiado de la computadora compartida, se la renombra desde afuera y se firma «desde Compu del mostrador» | Media |
| 2 | La limpieza del nombre deja pasar rellenos invisibles (U+3164, U+2800, U+FFA0, U+115F), marcas combinadas sin tope y caracteres sin asignar o de uso privado | Baja |
| 3 | Un nombre igual al de otra computadora, con el navegador cambiado, deja la pregunta «¿Entrar en …?» idéntica; el aviso de «se repite» se esquiva con una tilde o una letra de otro alfabeto | Baja |
| 4 | El límite del nombre es por sesión: se esquiva entrando de nuevo | Baja |
| 5 | Dos cambios de nombre a la vez dejan la memoria distinta de la base; con más de 1000 nombres, la auditoría anota mal el «antes» | Baja |
| 6 | Quitar la huella del celular en la mano desde la tarjeta propia de Usuarios no apaga «Trabajar sin conexión» en el celular | Baja |
| 7 | La prueba de «ninguna respuesta lleva el identificador» mira dos rutas, no todas las que tocan dispositivos | Baja |
| 8 | `GET /api/me/devices` le da a cualquiera con sesión los nombres de todos los dispositivos de la ferretería | Baja |
| 9 | En la auditoría, «Se me perdió» desde Configuración no se distingue de «Se perdió un celular» de Usuarios | Baja |
| 10 | Después de quitar la huella del celular en la mano, las computadoras que aprobó quedan sueltas y «Se me perdió» ya no las corta | Baja |

---

### 1 · El `device_id` sigue siendo el que dice el navegador (media)

**Dónde:** `src/app/platform/device/device.ts:6` a `:13` (el identificador vive en `localStorage`,
creado una vez con `crypto.randomUUID()`); `src/server/platform/http.ts:118` y `:119` (el servidor
acepta cualquier UUID en `X-Device-Id`); `sign-in/sessions/open.ts:56` (la sesión guarda el de la
cabecera del pedido de entrar); `sign-in/devices/routes.ts:27` (el nombre va a ese);
`platform/guards.ts:66` (el nombre de «desde dónde» sale de ese); `codes/computer/computer-routes.ts:46`
y `codes/phone/phone-routes.ts:81` (la pantalla de entrada toma el de la cabecera, sin sesión, y el
celular ve su nombre).

El diseño (§ 8) cerró la fuga por el servidor, y eso está hecho. Pero el identificador no es un
secreto que el servidor entregó y pueda comprobar: es un texto que el navegador elige y que cualquiera
que tenga el navegador en la mano puede leer.

**El ataque, paso a paso:** Pedro es empleado, sin ningún permiso especial.

1. Un día que atiende en la computadora del mostrador abre las herramientas del navegador (F12 →
   Aplicación → Almacenamiento local) y copia el valor de `ferrebress.device-id` (o lo hace una
   extensión del navegador que tenga instalada esa computadora).
2. En su casa, en su notebook, entra con su Google mandando ese valor en `X-Device-Id` (una extensión
   que reescribe cabeceras, o cambiando el `localStorage` de su propio navegador). El servidor no
   puede distinguirlo: su sesión queda atada al dispositivo «Compu del mostrador».
3. Con eso:
   - le cambia el nombre a la computadora del mostrador desde su casa (por ejemplo, «NO USAR - rota»),
     aunque R9.2 dice que desde un dispositivo no se le cambia el nombre a otro. Todos lo ven en la
     entrada, en el vínculo y en la auditoría;
   - todo lo que hace desde su casa queda en Quién hizo qué «desde Compu del mostrador», y con el
     navegador cambiado a Chrome en Windows, igual al del mostrador. Lo delata solo la dirección;
   - si abre la entrada con el código QR con ese identificador, el celular que la lea pregunta
     «¿Entrar en Compu del mostrador (Chrome en Windows)?». Esto lo limita mucho `sameNetwork`
     (`phone-routes.ts:33`): el celular tiene que estar en la misma red que la pantalla;
   - con el identificador de un celular (más difícil de conseguir: es personal) podría además
     vincularle una huella propia antes que el dueño, que después ve «Este celular tiene la huella de
     otra persona» y no puede vincular la suya (`webauthn.ts:122` a `:140`, la base acepta una cuenta
     por dispositivo). Esto ya pasaba antes de esta etapa.

No deja ver ni cortar lo de otra persona: lo de cada persona sigue atado a su `user_id`. Por eso es
media y no alta. Pero el diseño apoya en este identificador la regla R9.2 y el «desde dónde» de la
auditoría, y la etapa lo dejó como estaba.

**Lo propuesto:** que el servidor emita el identificador del dispositivo y lo pueda comprobar: una
cookie `HttpOnly`, `Secure`, `SameSite=Strict` y de larga duración con un valor al azar, que el
servidor pone la primera vez y de la que deriva el `device_id` (o que firma con HMAC el que ya tiene el
navegador, la primera vez que lo ve, y desde ahí exige la firma). El script de la página no la puede
leer, así que F12 → Almacenamiento local ya no la entrega (las herramientas del navegador sí muestran
las cookies, pero el valor no se puede volver a usar desde otro navegador sin copiar la cookie entera,
que es lo mismo que copiar una sesión). Cuesta alrededor de un día: el paso en `platform/http.ts`, la
migración de los identificadores que ya existen (se aceptan una vez y se atan a la cookie) y las
pruebas. Si Carlos prefiere no hacerlo, anotar en el diseño que el nombre y el «desde dónde» son de
quien dice ser ese dispositivo, no de un dispositivo probado, y que la dirección es lo que vale para
saber desde dónde.

### 2 · Caracteres invisibles que la limpieza deja pasar (baja)

**Dónde:** `src/shared/text/clean.ts:6` (`/[\p{Cc}\p{Cf}]/gu`) y `:9`.

Saca bien los de control, los de formato (entre ellos los de dirección del texto U+202A a U+202E y
U+2066 a U+2069, los de ancho cero y las etiquetas U+E0000), normaliza a NFC y cuenta en letras. Lo
comprobé con la misma función en Node. Lo que pasa igual:

- **Rellenos que se ven en blanco y no son espacios** para `\s`: U+3164 (relleno hangul), U+115F,
  U+1160, U+FFA0 y U+2800 (braille en blanco). Un nombre `"ㅤ"` se guarda: la computadora queda «sin
  nombre visible» en todas las listas, en la auditoría («Le puso nombre a este dispositivo: ») y en la
  pregunta del celular («¿Entrar en  (Chrome en Windows)?»).
- **Marcas combinadas sin tope** (`\p{M}`): `"a" + 29 × U+0489` son 30 letras y se dibujan como una
  mancha que tapa los renglones de arriba y abajo en la tarjeta, en Quién hizo qué y en el vínculo.
- **Sin asignar, de uso privado y sustitutos sueltos** (`\p{Cn}`, `\p{Co}`, `\p{Cs}`): se ven como
  cuadraditos; un sustituto suelto (`"\ud800"` en el JSON) queda así en la memoria y como U+FFFD en la
  base, distintos hasta que se reinicia.

Lo mismo vale para el nombre de una persona y el de un rol, que ahora usan esta función.

**El ataque:** cualquiera con sesión le pone a su dispositivo un nombre en blanco o una mancha, para
que su sesión no se reconozca en la tarjeta de Usuarios de otro o para ensuciar las pantallas de los
demás. Molesta; no da acceso a nada.

**Lo propuesto:** sumar `\p{Cs}\p{Co}\p{Cn}` a lo que se saca, sacar también U+115F, U+1160, U+3164,
U+FFA0 y U+2800, y no dejar más de dos marcas combinadas seguidas (o exigir que el nombre tenga al
menos una letra o un número: `\p{L}|\p{N}`). Con una prueba por caso. Media hora.

### 3 · La pregunta «¿Entrar en …?» con un nombre repetido, y el aviso que se esquiva (baja)

**Dónde:** `codes/phone/phone-routes.ts:81`; `shared/contracts/device-settings.ts:22`;
`shared/text/clean.ts:17` y `:18`.

R9.3 deja repetir nombres y R9.7 muestra el nombre con el navegador. Pero el navegador sale del
`User-Agent`, que cualquiera cambia (`platform/device.ts:4`). Una notebook que se llama «Compu del
mostrador» y dice ser Chrome en Windows hace que el celular pregunte exactamente lo mismo que la
computadora de verdad. No hace falta conocer ningún identificador: basta con tener sesión y ponerle
ese nombre a la notebook propia.

Además, el aviso de «ya hay otro igual» compara con `sensitivity: 'accent'`, que distingue las tildes
(«Mostrador» y «Mostrádor» no se avisan, aunque el comentario de `clean.ts:16` dice «ni tildes de
más»), y no ve letras de otro alfabeto que se ven iguales (una «о» cirílica). Lo comprobé en Node.

**El ataque, paso a paso:** dentro del local (por `sameNetwork`), Pedro le pone a su notebook «Compu
del mostrador», cambia el navegador a Chrome en Windows, cierra su sesión y deja la notebook en la
entrada con el QR, junto al mostrador. Le pide a Ana que «le habilite la compu». Ana lee el QR, ve la
misma pregunta de siempre y aprueba: la notebook de Pedro queda con la sesión de Ana. Es el riesgo de
siempre del QR (revisión de 01, punto 4); el nombre libre lo hace más creíble, y la regla lo acepta.

**Lo propuesto:** decidirlo Carlos. Opciones baratas: que el celular muestre además «Le pusieron este
nombre hace 2 minutos» si el nombre es reciente, o un aviso si otra computadora se llama igual; y que
el aviso compare con `sensitivity: 'base'` y con un esqueleto de letras parecidas (UTS #39), o que
solo acepte letras latinas en el nombre. Una o dos horas cada una.

### 4 · El límite del nombre es por sesión (baja)

**Dónde:** `sign-in/devices/routes.ts:22` a `:25` (`device-name:session:<id>`, 10 por hora).

Cada cambio deja una fila en la auditoría, una escritura en la base y un aviso por el canal a cada
lado vinculado con ese dispositivo (`device-link/listeners.ts:59` a `:71`). Una sesión nueva trae 10
cambios más, y entrar con Google se limita por minuto (10 por dirección y por dispositivo).

**El ataque:** con sesión, un guion que entra, cambia el nombre 10 veces, sale y vuelve a entrar,
cambiando la cabecera del dispositivo para no chocar con el límite por dispositivo de Google. Llena
Quién hizo qué con cientos de cambios por hora a su nombre. Queda todo anotado con quién lo hizo, así
que el daño es ruido.

**Lo propuesto:** sumar la clave del dispositivo de la sesión y la de la persona
(`device-name:device:<deviceId>`, `device-name:user:<userId>`) al mismo límite. Dos líneas y una
prueba.

### 5 · Carreras al renombrar y el «antes» de la auditoría (baja)

**Dónde:** `sign-in/devices/names.ts:58` a `:64` y `:40` a `:46`; `devices/routes.ts:29` a `:36`.

- **Dos cambios a la vez** sobre el mismo dispositivo (dos pestañas, o dos personas en la
  computadora compartida): la base guarda el último que se confirma, pero `remember` corre después de
  cada `await` y puede quedar el otro. La memoria, que es lo que muestran la entrada, el vínculo, las
  listas y la auditoría, queda distinta de la base hasta reiniciar. Los dos registros de la auditoría
  dicen el mismo «antes».
- **Con más de 1000 nombres en memoria** se olvida el más viejo; si a ese dispositivo se le cambia el
  nombre, `before` sale nulo aunque la base tenga uno, y la auditoría dice «Le puso nombre» en vez de
  «Le cambió el nombre». Llegar a 1000 pide 1000 dispositivos con sesión (en una ferretería, solo
  alguien que lo intenta a propósito, como en el punto 4).

**Lo propuesto:** que `rename` devuelva el nombre anterior desde la base (`UPDATE … RETURNING` con un
`SELECT … FOR UPDATE` antes, en la misma transacción) y que la memoria se actualice con un contador de
versión por dispositivo, para que un cambio viejo no pise uno nuevo. Una hora.

### 6 · Desde la tarjeta propia de Usuarios, el celular en la mano sigue con «Trabajar sin conexión» (baja)

**Dónde:** `src/app/modules/users/actions.ts:128` a `:133` (`removePhone`), frente a
`src/app/modules/sign-in/access/actions.ts:61` a `:73` (`removeHere`, que llama a
`passkeyRemovedHere()` y `disableOffline()`).

R6.2 dice que en la tarjeta propia de Usuarios pasa lo mismo que en Configuración. En el servidor es
así: la ruta de Usuarios llega a `removeHere` (`cutting.ts:73` a `:75`) y borra `phoneOwners`. Pero la
aplicación, cuando se quita desde Usuarios, no borra la marca local de la huella ni apaga la opción:
quedan prendidas hasta el próximo `/api/start` con la persona.

**El ataque:** Ana le quita su huella a un celular de la ferretería desde su tarjeta en Usuarios para
dárselo a otra persona, creyendo que ya no se puede entrar con ella sin conexión. Si el celular queda
sin internet antes de recargar, la opción sigue y la pantalla ofrece entrar sin conexión como Ana.
Para entrar hace falta igual la huella o el PIN de Ana en ese celular, y lo hecho así lo rechaza el
servidor al sincronizar (`offline/routes.ts:59` y `:60`: la huella ya no existe). Por eso es baja.

**Lo propuesto:** que `removePhone` de Usuarios, cuando la respuesta corresponde al celular en la mano,
haga lo mismo que `removeHere` (más simple: que el servidor diga en la respuesta `here: true` y la
lógica común lo atienda en los dos lados), con la prueba en `users-own.test.tsx`. Media hora.

### 7 · La prueba del identificador mira dos rutas (baja)

**Dónde:** `sign-in/access/me.test.ts:228` a `:241`.

El diseño (§ 8) pide una prueba que busque el identificador «en todas las respuestas de las rutas que
tocan dispositivos». La prueba mira `GET /api/me/devices` y `GET /api/users/:id/access`. No mira
`/api/lost-phones`, `/api/start` (con y sin sesión), `/api/device-link/check`, la lectura del QR del
vínculo y de la entrada, los avisos del canal (`device-link.pairing`, `device-link.code`) ni
`/api/audit-log`. Las revisé a mano y hoy ninguna lo lleva; la falta es que un cambio futuro lo vuelva
a sacar sin que nada falle (que es lo que pasó con `device-link`).

**Lo propuesto:** una prueba que arme un vínculo, una entrada con QR, un «Se perdió» y un cambio de
nombre, guarde todas las respuestas y los mensajes del canal, y busque los dos `device_id` en todo.
Una hora.

### 8 · Los nombres de todos los dispositivos, para cualquiera con sesión (baja)

**Dónde:** `sign-in/access/listing.ts:119` (`names: ctx.devices.othersThan(asking.deviceId)`).

Es lo que pide el diseño para avisar mientras se escribe (E54). Pero cualquiera con sesión, sin
ningún permiso, recibe hasta 1000 nombres, que pueden ser datos personales («Celu de Juan») y dicen
qué dispositivos hay y de quién, aunque no tenga «Ver usuarios».

**Lo propuesto:** decidirlo Carlos: o aceptarlo (son decenas, y el nombre lo ve cualquiera que use ese
dispositivo), o que el aviso se pida al servidor al dejar de escribir (`GET /api/me/device-name/check?name=…`,
que contesta solo `repeated`), con el límite del punto 4. Una hora.

### 9 · «Se me perdió» desde Configuración, en la auditoría (baja)

**Dónde:** `sign-in/access/me-routes.ts:44` (`from: how === 'lost' ? 'lost' : 'settings'`) y
`cutting.ts:92` (`from` se anota solo si es `settings`).

«Quitar» desde Configuración queda con `from: 'settings'`, pero «Se me perdió» queda igual que «Se
perdió un celular» de Usuarios. E51 lo pide así («como si se hubiera hecho desde Usuarios») y se
distingue porque quien lo hizo es la misma persona dueña del celular; pero desde la pantalla de
Usuarios también se puede cortar un celular propio, así que la auditoría no dice desde dónde se hizo.

**Lo propuesto:** anotar `from: 'settings'` también en `phone.cut` (el texto no cambia). Diez minutos.

### 10 · Las computadoras que aprobó la huella quitada quedan sueltas (baja)

**Dónde:** `cutting.ts:100` a `:112`; `access/data.ts:116` a `:123` (`onThatPhone`).

Quitar la huella del celular en la mano no cierra nada (decisión de Carlos). Pero las sesiones de las
computadoras que esa huella hizo entrar se atan al celular por `approved_by`, que apunta a la huella
borrada. Si después se pierde ese celular, «Se me perdió» sobre él solo cierra lo de su `device_id`:
las computadoras siguen abiertas y ya no aparecen colgadas debajo del celular (`listing.ts:86`), sino
sueltas.

**El ataque:** no hay uno directo; es una sorpresa para la persona, que cree que «Se me perdió» corta
todo lo que el celular hizo entrar. Las sesiones vencen solas (60 minutos sin uso, 8 horas).

**Lo propuesto:** que `onThatPhone` también busque por las huellas ya quitadas de ese dispositivo
(guardar el `device_id` del que aprobó en la sesión, en vez de solo el id de la huella), o decir en
Configuración, al quitar la huella, que las computadoras que hizo entrar siguen abiertas. Una hora.

---

## Lo que pidió la revisión del diseño

| # (paso 4) | Pedido | En el código |
|---|---|---|
| 1 | Que el `device_id` no salga por la auditoría ni por ninguna respuesta | Hecho en el servidor: `device-link/context.ts:54` y `:55` anotan `id: ''`; `audit-log/rules.ts:127` y `:138` lo esconden también en las filas viejas, con prueba (`rules.test.ts:35`); `lost.ts:56` y `:57` lo sacan. La prueba general es parcial (punto 7). Sigue siendo el que dice el navegador (punto 1) |
| 2 | Nombre y navegador en «¿Entrar en …?» | Hecho (`phone-routes.ts:81`), con prueba (`devices.test.ts:120`). Lo que queda, punto 3 |
| 3 | Quitar la huella propia borra `phoneOwners` y apaga `offline` | Hecho en el servidor (`cutting.ts:103`), con prueba (`me.test.ts:152`). En la aplicación, desde Usuarios no (punto 6). El vínculo sigue (E60), con prueba |
| 4 | Vincular desde Configuración pide Google de hace menos de 5 minutos, con prueba de `403` | Hecho: usa la misma ruta (`webauthn.ts:41` a `:46`) y la prueba está (`me.test.ts:91`) |
| 5 | `\p{Cc}\p{Cf}`, NFC, contar igual en los tres lados, comparar después de limpiar | Hecho (`clean.ts`, la restricción `char_length` de `006-devices.ts:12`), con prueba (`devices.test.ts:75`). Lo que falta, punto 2 |
| 6 | El nombre en «desde dónde», del dispositivo de la sesión; sin sesión, ninguno | Hecho (`guards.ts:66` y `:71`), con prueba (`guards.test.ts:39`) |
| 7 | La persona por parámetro, `uuidParams`, `from` de la ruta, los `404` anotados | Hecho (`cutting.ts`, `me-routes.ts`, `users-routes.ts`), con prueba (`me.test.ts:177`) |
| 8 | Un límite por sesión para el nombre | Hecho, 10 por hora, con prueba (`devices.test.ts:112`). Lo que queda, punto 4 |
| 9 | `last_seen_at` para borrar a los 365 días | Hecho (`devices/data.ts:47` a `:65`, `names.ts:69` a `:72`), con prueba (`devices.test.ts:135`) |
| 10 | Tope del `Map`, cortar al soltar el dedo, la computadora que se corta a sí misma | El tope está (`names.ts:44`; ver punto 5). Lo del dedo y la propia sesión son de la pantalla; no lo comprobé en el navegador |

## Por tema

- **Entrar sin permiso:** las rutas nuevas piden sesión (`routes-permissions.test.ts`, 401 sin ella).
  Lo que se puede falsear es el dispositivo, no la persona (punto 1).
- **Permisos e IDOR:** sin hallazgos. Una sesión o una clave de otra persona da `404` y no toca nada:
  el filtro por `user_id` está en la consulta que escribe, no solo en la comprobación previa.
- **Lo que entra de afuera:** el nombre (tope de 200 antes de limpiar y 30 letras después; punto 2), el
  `how` con `z.enum`, y las claves con `uuidParams`. La cabecera del dispositivo se valida como UUID
  (`http.ts:119`), así que no llega a la columna `uuid` nada que la rompa.
- **La aplicación en el navegador:** sin hallazgos nuevos. El nombre se dibuja como texto; lo mío no se
  guarda en el dispositivo (`useMine.ts` lo tiene solo en el estado). El identificador sigue en
  `localStorage` (punto 1). El origen, el tipo de contenido y la cookie `SameSite=Strict` cubren los
  `POST` nuevos, también los de cuerpo vacío (`http.ts:156` a `:160`).
- **Datos personales:** el nombre se borra con el dispositivo a los 365 días sin uso; en la auditoría
  queda el que tenía en cada acción, con el plazo de la auditoría (05), que es lo que dice R9.5. Que lo
  vean todos: punto 8. Nada sale a terceros.
- **Abuso y disponibilidad:** `GET /api/me/devices` no tiene límite propio, pero pide sesión y hace dos
  consultas por índice (tres si tiene que averiguar de quién es la huella del celular, que después
  queda en memoria). El `Map` tiene tope. Lo del nombre: puntos 4 y 5.
- **Sin conexión:** nada nuevo; lo mío necesita conexión (R10). Punto 6.
- **Auditoría:** se anotan el cambio de nombre (con antes y después, sin identificador), cerrar,
  quitar, cortar y quitar la huella propia; los rechazos `404` y `409` una vez por minuto, y lo frenado
  por límite. Un `400` del nombre no se anota (como el resto de los cuerpos inválidos). Puntos 5 y 9.
- **El despliegue:** sin cambios. Caddy no tiene registro de accesos, así que la cabecera del
  dispositivo no queda escrita en ningún archivo de registro.
- **Dependencias:** ninguna nueva; `pnpm audit --prod` sin fallas conocidas.
