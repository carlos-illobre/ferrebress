# Diseño técnico · 04 · Configuración del dispositivo (`device-settings`), etapa b: lo mío

Implementa la etapa b del [capítulo 04](../../chapters/04-device-settings/rules.md): R1.8 y R6 a R10,
con sus escenarios E10 y E40 a E57, y los cambios que trajo en 01 · R2.5, 02 · R5, 03 · R4.2 y 05 ·
R2.6. La pantalla aprobada es
[`mockups/device-settings-b/final/`](../../design/mockups/device-settings-b/final/). La etapa a está
en [device-settings.md](device-settings.md). Corregido con sus dos revisiones
([diseño](device-settings-b-design-review.md), [seguridad](device-settings-b-security-review.md)); lo
que decide Carlos está en § 12.

## 1. La idea técnica

- **Lo mío ya existe en el servidor:** las sesiones y las huellas son de `sign-in`, que ya sabe
  listarlas por persona, cerrarlas y cortar un celular para Usuarios (diseño de 02, § 4). La etapa b no
  arma otra cosa: **la misma lógica**, que recibe de quién por parámetro, usada con la persona de la
  sesión y sin permiso (constitución, XII: lo que no se repite es la lógica; cada pantalla la muestra
  a su manera).
- **Lo nuevo es el nombre del dispositivo,** que también es de `sign-in`, porque es dueño del
  dispositivo de cada sesión y de cada huella.
- **Agrupar por dispositivo** (R1.8) lo hace el servidor: ya sabe qué sesión y qué huella son del mismo
  dispositivo y qué computadoras aprobó cada celular con su código.
- **El identificador del dispositivo tiene que ser secreto, y hoy no lo es** (revisión de seguridad, 1):
  `device-link` lo anota en Quién hizo qué, que lo devuelve. Es un número al azar que solo conoce ese
  navegador; si no sale de ahí, nadie puede hacerse pasar por ese dispositivo. Esta etapa lo cierra
  (§ 8) antes de colgar el nombre de él.

## 2. Entidades

### `sign_in.devices` (nueva, migración `006-devices`)

| Columna | Tipo | Para qué |
|---|---|---|
| `device_id` | `uuid`, clave | El dispositivo, el mismo identificador de las sesiones y las huellas |
| `name` | `text`, nulo, hasta 30 letras | Su nombre (R9.1). Sin nombre, nulo |
| `last_seen_at` | `timestamptz`, `not null` | El último día que se usó, para borrar lo que nadie usa (§ 12, 3) |

- **La fila se crea con la primera sesión** del dispositivo y `last_seen_at` se actualiza una vez por día
  como mucho, junto con el último uso de la sesión que ya se escribe (ninguna escritura más).
- **Quién puso el nombre** queda en la auditoría, no acá.
- **Sin índice más que la clave:** son unas decenas de filas.
- **La limpieza diaria** que ya corre en `sign-in` borra la fila de un dispositivo sin sesión ni huella y
  con `last_seen_at` de hace más de `devices.forgetAfterDays` (365, en el `settings.ts` de `sign-in`).
- **En la memoria:** `sign-in` tiene los nombres en un `Map` (tope `devices.maxInMemory`, 1000: una
  ferretería tiene decenas), cargado al arrancar y al día con cada cambio. Lo leen la auditoría, la
  entrada, el vínculo y las listas.

## 3. API

Todas con sesión, **sin ningún permiso**, y siempre de la persona de la sesión: no reciben de quién.
Los identificadores de la dirección se validan con `uuidParams`; un rechazo `404` queda en la auditoría
una vez por ventana, como en Usuarios. Las formas y los errores, en
`src/shared/contracts/device-settings.ts`.

| Ruta | Qué hace | Consultas |
|---|---|---|
| `GET /api/me/devices` | Este dispositivo (su nombre, su etiqueta, si es celular y qué huella tiene: `mine`, `other` o `none`), los otros dispositivos propios (cada uno con su sesión abierta, su huella y las computadoras que hizo entrar con su código) y los nombres de los otros dispositivos de la ferretería, para avisar mientras se escribe si se repite (E54) | 2: sesiones y huellas; los nombres salen de la memoria |
| `POST /api/me/sessions/:sessionId/close` | «Cerrar» (R7.2). La del pedido no | 2 |
| `POST /api/me/sessions/close` | «Cerrar todas» (R7.2), salvo la del pedido | 1 |
| `POST /api/me/devices/:deviceKey/cut` | `{ how: 'remove' \| 'lost' }`: «Quitar» la huella de otro celular o «Se me perdió» (R6.2, R8.1). La misma operación que Usuarios (02 · R5.6, R5.7), y en la auditoría `passkey.removed` o `phone.cut`, como allá. El dispositivo del pedido no | 3 a 4 |
| `POST /api/me/passkey/remove` | Quitar la huella del celular del pedido (R6.2, E42): borra la huella y lo que el servidor recuerda de ella (`phoneOwners`, que apaga `offline` en `/api/start`) y no cierra ninguna sesión. El vínculo: § 12, 5 | 2 |
| `POST /api/me/device-name` | `{ name }`: poner, cambiar o borrar (vacío) el nombre del dispositivo **de la sesión** (R9.2, R9.3). Devuelve `{ name, repeated }` | 1 |

- **`deviceKey`:** opaco, como el `phoneId` de Usuarios: el `public_id` de la huella o, si el
  dispositivo solo tiene una sesión, el `id` de esa sesión. Uno de otra persona da `404`, igual que uno
  que no existe.
- **La lógica de `sign-in/access/` recibe la persona por parámetro** (hoy lee `c.req.param('id')`): las
  rutas de Usuarios le pasan la elegida, con su permiso, y las de `/api/me`, la de la sesión.
  `from: 'settings'` lo pone la ruta, no viene del cuerpo.
- **En la tarjeta propia de Usuarios** ya no se sacan los celulares propios (02 · R5.5, E22). El celular
  en la mano: § 12, 6.
- **«Vincular este celular con mi huella»** (R6.3) usa las rutas de vincular que ya existen, que piden
  haber pasado por Google hace menos de 5 minutos: § 12, 1. Una prueba comprueba que con una sesión
  vieja da `403`.
- **El nombre que entra:** se normaliza (NFC) y se le sacan los espacios de los costados; tiene que tener
  de 1 a 30 letras (contadas igual en la aplicación, el servidor y la base); no puede tener caracteres
  de control, invisibles ni de dirección del texto (`\p{Cc}`, `\p{Cf}`). Es la misma limpieza que el
  nombre de una persona y el de un rol: se junta una sola vez en `src/shared/text/clean.ts` y las tres
  la usan. «Se repite» compara después de limpiar, sin distinguir mayúsculas.
- **Límite:** cambiar el nombre, como mucho 10 veces por hora por sesión (`devices.renamesPerHour`).

### `/api/start` y la entrada

`/api/start` suma `deviceName` si el dispositivo del pedido tiene nombre, también sin sesión, para que
la entrada de la computadora lo muestre (01 · R2.5). Sale de la memoria: ninguna consulta más.

## 4. Eventos y auditoría

| Evento | Cuándo | Texto |
|---|---|---|
| `device.renamed` | Se puso, cambió o borró el nombre | «Le puso nombre a este dispositivo: Compu del mostrador», «Le cambió el nombre: Chrome en Windows → Compu del mostrador» o «Le sacó el nombre» |
| `passkey.removed`, `phone.cut`, `session.closed` | Los mismos que desde Usuarios (02 · R6) | Los mismos textos |

- **`device.renamed` no lleva el identificador del dispositivo:** su objetivo es el dispositivo por su
  etiqueta y su nombre, nunca por su `device_id` (§ 8).
- **El nombre en desde dónde** (05 · R2.6): `guards.ts` anota hoy `device: deviceCodes(…)`; suma `name`,
  el de ese momento, que la plataforma le pide a `sign-in` (`devices.provide`, como `sessions.provide`)
  con **el dispositivo de la sesión**, no el de la cabecera. Sin sesión (entrar, un rechazo), no se anota
  nombre.
- **La auditoría es aparte** (SQLite, ADR-004): no va en la transacción de PostgreSQL; se anota al
  confirmar, como el resto.

## 5. Dónde vive cada cosa

- **Código común (una tarea propia, que se toma antes):** `devices.provide` y el `name` en
  `src/server/platform/guards.ts`; la limpieza de textos en `src/shared/text/clean.ts`.
- **Servidor, `sign-in`:**
  - `access/` se parte en la lógica (`listing.ts`, `cutting.ts`, con la persona por parámetro) y dos
    juegos de rutas: `users-routes.ts` (las de hoy, con permisos) y `me-routes.ts` (las nuevas).
  - `devices/` (nueva): `data.ts` (la tabla), `names.ts` (la memoria y `devices.provide`), `rules.ts` y
    `routes.ts` (`/api/me/device-name`).
- **Servidor, `device-link`:** deja de anotar el `device_id` en la auditoría (§ 8) y **lee el nombre de la
  memoria al mostrar** cada lado del vínculo, con la etiqueta guardada de respaldo: no pisa nada y al
  borrar el nombre vuelve sola la etiqueta. Cuando cambia un nombre, avisa por el canal que ya tiene
  abierto con el otro (escucha `device.renamed`).
- **Servidor, `audit-log`:** la vista no devuelve el identificador de un objetivo que es un dispositivo,
  tampoco en las filas viejas.
- **Aplicación:**
  - **La lógica de acceso, una sola vez:** las llamadas al servidor y lo que se hace con cada respuesta
    (cerrar, cerrar todas, cortar, armar el recibo) en `src/app/modules/sign-in/access/` (por la
    fachada), con a quién por parámetro. La usan la tarjeta de Usuarios (que deja de tener la suya en
    `users/actions.ts` y `users/api.ts`) y Configuración; el estado de cada pantalla sigue siendo suyo,
    porque cada una muestra distinto.
  - **Configuración** suma `screens/Settings/Devices/`: la tarjeta de este dispositivo (el dibujo con su
    nombre, la huella, las computadoras que hizo entrar y las preferencias de la etapa a, que se mudan
    adentro sin cambiar) y los otros dispositivos, con el recibo.
  - **El nombre en todos lados** (R9.4): en la entrada de la computadora (de `/api/start`); en Quién hizo
    qué (de la acción); en la tarjeta de Usuarios, «Se perdió un celular» y sus tostadas, y en el
    vínculo, porque el servidor ya manda el nombre en lugar de la etiqueta cuando hay.
- **Documentos que cambian:** los diseños de 01, 02, 03 y 05 (el nombre en sus respuestas),
  `what-needs-internet.md` (lo mío necesita internet) y la arquitectura, «Escala» (los nombres en
  memoria).

## 6. Conexiones

- **Configuración pide `/api/me/devices` al abrirse y después de cada cambio**, y no vuelve a pedir sola
  (§ 12, 2).
- **Abierta en espejo,** cada dispositivo pide lo suyo: lo mío es de cada dispositivo.
- **El vínculo:** § 5, `device-link`.

## 7. Pantallas

Desde la final aprobada. **Lo de la etapa a se muda adentro de la tarjeta de este dispositivo,** sin
cambiar su lógica ni sus piezas (`AnimationsRow`, `TimeRow`, `InstallRow`, `OfflineRow`).

- **Este dispositivo:** el dibujo del aparato con su nombre o su etiqueta; «Ponele nombre» o «Cambiar el
  nombre» abre el campo, con el contador de 30 y el aviso si otro se llama igual, mientras se escribe;
  «Borrar». En el celular, su huella con «Quitar», o «Vincular este celular con mi huella», o el aviso
  de que tiene la de otra persona; debajo, las computadoras que hizo entrar con su código, con su ×.
- **Tus otros dispositivos:** las cuentas y «Cerrar todas» (con confirmación). Una tarjeta por
  dispositivo con su sesión y su huella, cada una con su ×, y colgadas las computadoras que hizo
  entrar. **«Se me perdió»:** con el mouse encima o la marca del teclado en él, lo que se va a cortar se
  pone rojo; en el celular, mientras el dedo está apoyado, y se corta al soltarlo **si no se movió**
  (un desplazamiento no corta nada).
- **Desde la computadora, «Se me perdió» del celular que la hizo entrar con su código** cierra también la
  sesión de esta computadora (02 · R5.6): el aviso rojo la incluye, y después aparece la entrada.
- **El recibo:** después de cortar, en el lugar de la tarjeta, «Cortaste …», un tilde por cosa y «Listo».
- **Sin conexión** (R10): lo mío gris con «Sin conexión», con `ui/offline`; las preferencias andan.
- **Teclado:** el nombre con Alt K (la maqueta usaba D, que es «Animaciones»; la E es minimizar el
  menú) y «Cerrar todas» con Alt X (la maqueta usaba T, que es «Administración»); el resto, como la
  maqueta. «Se me perdió», las × y
  «Listo» se recorren con ↑ ↓ y Enter, como en Usuarios (02 · R5.8).
- **El espejo:** lo mío no se espeja: es de la persona en ese dispositivo (04 · R1.6). Ir a
  Configuración sí.

## 8. Seguridad

- **Datos que toca:** las sesiones y las huellas propias, y el nombre de los dispositivos, que puede ser
  un dato personal («Celu de Juan»): se borra con el dispositivo (§ 2).
- **Quién puede:** cualquiera con sesión, solo lo suyo: las rutas toman la persona de la sesión y nunca
  la reciben. Un `deviceKey` o una sesión de otra persona da `404`. El nombre, solo el del dispositivo de
  la sesión.
- **El identificador del dispositivo, secreto** (revisión de seguridad, 1): es lo único que ata una sesión
  a un dispositivo, y lo manda el navegador al entrar. Para que nadie se haga pasar por otro:
  - `device-link` deja de anotar `device_id` en la auditoría;
  - la vista de la auditoría no devuelve el identificador de un objetivo dispositivo, tampoco en las
    filas viejas;
  - ninguna respuesta lo lleva: una prueba busca el identificador de una sesión en todas las respuestas
    de las rutas que tocan dispositivos, y falla si aparece.
- **Lo que entra de afuera:** el nombre (§ 3) y las claves opacas. El nombre es texto libre que ven otras
  personas y otros dispositivos: limpio, siempre como texto, y en la auditoría queda quién lo puso.
- **El nombre en la aprobación del celular** («¿Entrar en …?»): § 12, 4.
- **La entrada muestra el nombre sin sesión:** solo a quien manda el identificador del dispositivo, que
  está solo en él.
- **Límites:** cambiar el nombre (§ 3); cortar, los mismos que desde Usuarios.
- **Secretos:** ninguno nuevo.

## 9. Metas de performance

- `GET /api/me/devices`: 2 consultas por índice de la persona; menos de 15 ms; unos 2 KB.
- Cambiar el nombre: 1 consulta; la memoria se actualiza al confirmar.
- La auditoría, la entrada, el vínculo y las listas leen el nombre de la memoria.
- Las pruebas cuentan las consultas de cada ruta nueva.
- La aplicación: lo mío es parte de Configuración, que está en el arranque; suma unos 6 KB, dentro del
  tope de 256 KB.

## 10. Pruebas

| Escenarios | Prueba |
|---|---|
| E10, E40, E45, E47, E50 | Unitarias de la pantalla con el servidor de mentira; la ruta, con dos personas y varios dispositivos |
| E41, E48, E49, E51 | La ruta: corta lo mismo que desde Usuarios y lo anota igual; la pantalla, con el recibo |
| E42 | La ruta de quitar la huella propia: no cierra sesiones ni computadoras; `/api/start` ya no dice `offline` |
| E43, E44 | La pantalla en sus tres estados de huella; vincular con una sesión vieja da `403` |
| E46 | La tarjeta de Usuarios con la lógica común: la propia muestra los celulares propios |
| E52 a E56 | La ruta del nombre (largo, caracteres, repetido, borrar, auditoría); el nombre en `/api/start`, en las listas, en el vínculo y en la auditoría |
| E57 | La pantalla sin conexión |
| Seguridad | Una sesión o una clave de otra persona da `404`; el nombre va al dispositivo de la sesión aunque la cabecera diga otro; ninguna respuesta lleva un `device_id`; el límite del nombre |
| Capturas | Configuración en la computadora y en el celular, con lo mío; el recibo; la entrada con el nombre |

## 11. Tareas

1. **Código común** (tomarlo antes): la limpieza de textos en `src/shared/` (y que la usen personas y
   roles), `devices.provide` y el nombre en `guards.ts`.
2. **El identificador secreto:** `device-link` y la vista de la auditoría dejan de dar `device_id`, con su
   prueba.
3. **El servidor:** la migración, `devices/`, el nombre en `/api/start`, `access/` con la persona por
   parámetro, las rutas de `/api/me`, `device.renamed` y `device-link` leyendo el nombre. Depende de 1 y 2.
4. `[P]` **La aplicación:** la lógica de acceso en `sign-in/access/` y Usuarios usándola (sin cambiar cómo
   se ve). Depende de 3.
5. **Configuración:** este dispositivo con las preferencias adentro, los otros, el recibo, sin conexión;
   el nombre en la entrada y en Quién hizo qué. Depende de 4.
6. Las capturas, las de punta a punta, los documentos de § 5, las revisiones (paso 7) y el manual (paso 9).

## 12. Lo que decide Carlos

1. **Vincular la huella desde Configuración (E43).** Vincular pide haber pasado por Google hace menos de 5
   minutos (es lo que protege que alguien con el celular de otro no le vincule su huella). Se propone que
   «Vincular este celular con mi huella» abra primero «volver a confirmar quién es» (02 · R3.8), que ya
   existe, y al volver de Google siga solo.
2. **«Vuelve solo al volver la conexión» (R10.1).** Es un pedido automático (unos 2 KB, solo con
   Configuración a la vista), y la constitución pide anotarlo y que lo apruebes. Se propone **no hacerlo:**
   lo mío queda gris con «Sin conexión» y un «Reintentar», como cuando falla una carga. Cambia R10.1 y E57.
3. **Borrar solos los nombres de los dispositivos que nadie usa** en un año. No está en R9. Se propone que
   sí, porque el nombre puede ser un dato personal y la base guarda solo el presente.
4. **«¿Entrar en …?» del celular** (01 · R2.5). Hoy dice el navegador de la computadora («Chrome en
   Windows»), de una lista cerrada, para que una computadora no pueda hacerse pasar por otra con un
   texto que elige. Con nombres, se propone mostrar los dos: «Compu del mostrador (Chrome en Windows)».
5. **Quitar la huella del celular en la mano, ¿termina el vínculo con la computadora?** 03 · R2.3 dice que
   quitar la huella termina el vínculo; 04 · R6.2 dice que quitar la propia «no cierra nada más». Se
   propone que **no** lo termine: es el celular en uso, no uno perdido.
6. **El celular en la mano, en la tarjeta propia de Usuarios.** Hoy no se puede cortar. Se propone que haga
   lo mismo que en Configuración: quitarle la huella sin cerrar nada (la misma lógica).
