# Diseño técnico · 04 · Configuración del dispositivo (`device-settings`), etapa b: lo mío

Implementa la etapa b del [capítulo 04](../../chapters/04-device-settings/rules.md): R1.8 y R6 a R10,
con sus escenarios E10 y E40 a E57, y los cambios que trajo en 01 · R2.5, 02 · R5, 03 · R4.2 y 05 ·
R2.6. La pantalla aprobada es
[`mockups/device-settings-b/final/`](../../design/mockups/device-settings-b/final/). La etapa a está
en [device-settings.md](device-settings.md).

## 1. La idea técnica

- **Lo mío ya existe en el servidor:** las sesiones y las huellas son de `sign-in`, que ya sabe
  listarlas por persona, cerrarlas y cortar un celular para Usuarios (diseño de 02, § 4). La etapa b no
  arma otra cosa: **la misma lógica**, con la persona de la sesión en lugar de la que se elige, y sin
  permiso (constitución, XII: lo que no se repite es la lógica; cada pantalla la muestra a su manera).
- **Lo nuevo es el nombre del dispositivo,** que también es de `sign-in`, porque es dueño del
  dispositivo de cada sesión y de cada huella.
- **Agrupar por dispositivo** (R1.8) lo hace el servidor: ya sabe qué sesión y qué huella son del mismo
  dispositivo, y qué computadoras aprobó cada celular con su código, y nada de eso sale de él (el
  `device_id` nunca sale del servidor, diseño de 02, § 9).

## 2. Entidades

### `sign_in.devices` (nueva, migración `006-devices`)

| Columna | Tipo | Para qué |
|---|---|---|
| `device_id` | `uuid`, clave | El dispositivo, el mismo identificador de las sesiones y las huellas |
| `name` | `text`, `not null`, de 1 a 30 letras | Su nombre (R9.1). Sin nombre, no hay fila |
| `named_at` | `timestamptz`, `not null` | Cuándo se puso, para borrar los que nadie usa |
| `named_by` | `uuid`, `not null` | Quién lo puso, para la auditoría |

- **Sin índice más que la clave:** son unas decenas de filas. Buscar si otro se llama igual (R9.3)
  recorre la tabla entera, y es barato.
- **Borrar el nombre borra la fila** (constitución, V). **La limpieza diaria** que ya corre en `sign-in`
  borra el nombre de un dispositivo sin ninguna sesión ni huella desde hace `devices.forgetAfterDays`
  (365, en el `settings.ts` de `sign-in`): un dispositivo que nadie usa en un año ya no es de la
  ferretería.
- **En la memoria:** `sign-in` tiene todos los nombres en un `Map` (unas decenas), cargado al arrancar y
  al día con cada cambio. Lo usan la auditoría y el vínculo, que no pueden esperar una consulta (§ 6).

## 3. API

Todas con sesión, **sin ningún permiso**, y siempre de la persona de la sesión: no reciben de quién.
Las formas y los errores, en `src/shared/contracts/device-settings.ts`.

| Ruta | Qué hace | Consultas |
|---|---|---|
| `GET /api/me/devices` | Este dispositivo (su nombre, su etiqueta, si es celular y qué huella tiene: `mine`, `other` o `none`) y los otros dispositivos propios, cada uno con su sesión abierta, su huella y las computadoras que hizo entrar con su código | 3: sesiones, huellas y nombres; las computadoras aprobadas salen de las mismas sesiones |
| `POST /api/me/sessions/:sessionId/close` | «Cerrar» (R7.2). La del pedido no | 2 |
| `POST /api/me/sessions/close` | «Cerrar todas» (R7.2), salvo la del pedido | 1 |
| `POST /api/me/devices/:deviceKey/cut` | «Quitar» la huella de otro celular y «Se me perdió» (R6.2, R8.1): la misma operación que Usuarios (02 · R5.6, R5.7). El dispositivo del pedido no | 3 a 4 |
| `POST /api/me/passkey/remove` | Quitar la huella del celular del pedido (R6.2): borra la huella y nada más | 2 |
| `POST /api/me/device-name` | `{ name }`: poner, cambiar o borrar (vacío) el nombre del dispositivo del pedido (R9.2, R9.3). Devuelve `{ name, repeated }` | 3: el anterior, si se repite y guardar, en una transacción con la auditoría |

- **`deviceKey`:** opaco, como el `phoneId` de Usuarios: el `public_id` de la huella o, si el
  dispositivo solo tiene una sesión, el `id` de esa sesión. Uno de otra persona da `404`, igual que uno
  que no existe.
- **«Vincular este celular con mi huella»** (R6.3) usa las rutas de vincular que ya existen (diseño de
  01): no hay ruta nueva.
- **Las de Usuarios se reusan por dentro:** `GET /api/users/:id/access` y sus cortes llaman a las
  mismas funciones de `sign-in/access/` que las de `/api/me`; cambia solo de quién y qué permiso pide la
  ruta. En la tarjeta propia ya no se sacan los celulares propios (02 · R5.5, E22): un parámetro menos.
- **Lo de afuera:** `name` se recorta, no puede quedar con más de 30 letras (`400`), y no puede tener
  caracteres de control ni saltos de línea (`400`). Cualquier otro texto vale: se muestra siempre como
  texto (Preact), nunca como HTML.

### `/api/start` y la entrada

`/api/start` suma `deviceName` si el dispositivo del pedido tiene nombre, también sin sesión, para que
la entrada de la computadora lo muestre (01 · R2.5). Sale del `Map` en memoria: ninguna consulta más.

## 4. Eventos y auditoría

| Evento | Cuándo | Texto |
|---|---|---|
| `device.renamed` | Se puso, cambió o borró el nombre | «Le puso nombre a este dispositivo: Compu del mostrador», «Le cambió el nombre: Chrome en Windows → Compu del mostrador» o «Le sacó el nombre» |
| Los de cortar y cerrar | Los mismos que desde Usuarios (02 · R6), con `from: 'settings'` | Los mismos textos |

- **El nombre en desde dónde** (05 · R2.6): `guards.ts` anota hoy `device: deviceCodes(…)`; suma
  `name`, el de ese momento, que la plataforma le pide a quien lo sabe (`devices.provide`, como
  `sessions.provide`). Así la auditoría guarda el de entonces sin que nadie lo vuelva a buscar.
- **`device.renamed` también es un evento del proceso:** `device-link` lo escucha para actualizar las
  etiquetas de los vínculos de ese dispositivo y avisarle al otro por su canal (§ 6).

## 5. Dónde vive cada cosa

- **Servidor, `sign-in`:**
  - `access/` (ya existe) se parte en la lógica (`listing.ts`, `cutting.ts`) y dos juegos de rutas:
    `users-routes.ts` (las de hoy, con permisos) y `me-routes.ts` (las nuevas, sin permiso).
  - `devices/` (nueva): `data.ts` (la tabla), `names.ts` (el `Map` y `devices.provide`), `rules.ts` (el
    largo, los caracteres, si se repite) y `routes.ts` (`/api/me/device-name`).
- **Aplicación:**
  - **La lógica de acceso**, una sola vez, en `src/app/modules/sign-in/access/` (nueva, por la
    fachada): cargar, cerrar, cerrar todas, cortar y el resultado para el recibo, con un parámetro de
    a quién (`me` o una persona). La usan **la tarjeta de Usuarios**, que hoy la tiene en
    `users/actions.ts` y `users/api.ts` y pasa a usarla, y **Configuración**. Cada una la dibuja a su
    manera: la tarjeta de Usuarios no cambia cómo se ve.
  - **Configuración** suma `screens/Settings/Devices/`: la tarjeta de este dispositivo (el dibujo con su
    nombre, la huella, las computadoras que hizo entrar y las preferencias de la etapa a, que se
    mudan adentro) y la lista de los otros, con el recibo.
  - **El nombre en la entrada:** `sign-in` lo lee de `/api/start` y lo pone arriba a la derecha.
  - **El nombre en Quién hizo qué:** la acción ya trae `device`; con `name`, se muestra en desde dónde.

## 6. Conexiones

- **Configuración no escucha nada en vivo:** pide `/api/me/devices` al abrirse, al cambiar algo y al
  volver la conexión, como Usuarios.
- **El vínculo:** cuando cambia el nombre de un dispositivo vinculado, `device-link` (por
  `device.renamed`) actualiza la etiqueta guardada del vínculo y le manda al otro dispositivo el nombre
  nuevo por el canal que ya tiene abierto. Sin canal abierto, lo ve la próxima vez que lo abre.
- **Ningún pedido automático nuevo:** nada que anotar en [mobile-data.md](../mobile-data.md).

## 7. Pantallas

Desde la final aprobada. **Lo de la etapa a se muda adentro de la tarjeta de este dispositivo,** sin
cambiar su lógica ni sus piezas (`AnimationsRow`, `TimeRow`, `InstallRow`, `OfflineRow`).

- **Este dispositivo:** el dibujo del aparato (computadora o celular) con su nombre o su etiqueta;
  «Ponele nombre» o «Cambiar el nombre» abre el campo (con el contador de 30 y, si se repite, el aviso);
  «Borrar». En el celular, su huella con «Quitar», o «Vincular este celular con mi huella», o el aviso
  de que tiene la de otra persona; debajo, las computadoras que hizo entrar con su código, con su ×.
- **Tus otros dispositivos:** las cuentas (sesiones abiertas, con tu huella) y «Cerrar todas» (con
  confirmación). Una tarjeta por dispositivo con su sesión y su huella, cada una con su ×, y colgadas
  las computadoras que hizo entrar. **«Se me perdió»:** con el mouse encima o la marca del teclado en él,
  lo que se va a cortar se pone rojo; en el celular, mientras el dedo está apoyado, y se corta al
  soltarlo (R8.1: de un toque).
- **El recibo:** después de cortar, en el lugar de la tarjeta, «Cortaste …», un tilde por cosa y
  «Listo».
- **Sin conexión** (R10): lo mío gris con «Sin conexión», con `ui/offline`; las preferencias andan.
- **Teclado:** las teclas de la final (Alt O, L, B y 1 a 3); «Se me perdió», las × y «Listo» se recorren
  con ↑ ↓ y Enter, como en Usuarios (02 · R5.8).
- **El espejo:** lo de lo mío no se espeja: es de la persona en ese dispositivo, como las preferencias
  (04 · R1.6). Ir a Configuración sí.

## 8. Seguridad

- **Datos que toca:** las sesiones y las huellas propias, y el nombre de los dispositivos.
- **Quién puede:** cualquiera con sesión, solo lo suyo: las rutas toman la persona de la sesión y nunca
  la reciben. Un `deviceKey` o una sesión de otra persona da `404`. El nombre, solo el del dispositivo
  del pedido.
- **El dispositivo del pedido no es una prueba:** el identificador lo manda el navegador. Para el
  nombre se usa el de la **sesión** (`sessionOf(c).deviceId`), que quedó fijo al entrar, y no la
  cabecera del pedido. Así nadie le cambia el nombre a otro dispositivo sin tener una sesión abierta
  en él.
- **Lo que entra de afuera:** el nombre (§ 3) y las claves opacas. El nombre es texto libre que ven
  otras personas y otros dispositivos: se muestra siempre como texto, sin caracteres de control, y en
  la auditoría queda quién lo puso. A diferencia de la etiqueta del navegador (diseño de 01, punto 4 de
  su revisión de seguridad), lo elige una persona autorizada y queda anotado.
- **La entrada muestra el nombre sin sesión:** quien tenga el identificador del dispositivo lo puede
  leer. Ese identificador está solo en ese dispositivo, y el nombre no es un dato sensible.
- **Límites:** cambiar el nombre, con el límite de pedidos de siempre por dispositivo; cortar, con los
  mismos límites que desde Usuarios.
- **Secretos:** ninguno nuevo.
- **Auditoría:** § 4.

## 9. Metas de performance

- `GET /api/me/devices`: 3 consultas, todas por índice de la persona; menos de 15 ms; unos 2 KB.
- Cambiar el nombre: 3 consultas en una transacción; el `Map` se actualiza al confirmar.
- La auditoría y la entrada leen el nombre de la memoria: ninguna consulta más.
- La aplicación: lo mío es parte de la pantalla de Configuración, que está en el arranque; suma unos
  6 KB, dentro del tope de 256 KB.

## 10. Pruebas

| Escenarios | Prueba |
|---|---|
| E10, E40, E45, E47, E50 | Unitarias de la pantalla con el servidor de mentira; la ruta, con dos personas y varios dispositivos |
| E41, E48, E49, E51 | La ruta: corta lo mismo que desde Usuarios y lo anota igual; unitarias de la pantalla con el recibo |
| E42 | La ruta de quitar la huella propia: no cierra la sesión ni las computadoras; se apaga «Trabajar sin conexión» |
| E43, E44 | Unitarias de la pantalla en sus tres estados de huella, con las rutas de vincular |
| E46 | Unitarias de la tarjeta de Usuarios con la lógica nueva: la propia muestra los celulares propios |
| E52 a E56 | La ruta del nombre (largo, caracteres, repetido, borrar, auditoría con el anterior y el nuevo); el nombre en `/api/start`, en el acceso y en la auditoría; `device-link` actualiza su etiqueta |
| E57 | Unitarias de la pantalla sin conexión |
| Seguridad | Una sesión o una clave de otra persona da `404`; el nombre se pone en el dispositivo de la sesión aunque la cabecera diga otro; sin sesión no se cambia nada |
| Capturas | Configuración en la computadora y en el celular, con lo mío; el recibo; la entrada con el nombre |

## 11. Tareas

1. El servidor: la migración, `devices/` con su `Map` y `devices.provide`, el nombre en `guards.ts` y en
   `/api/start`, `access/` partido en lógica y rutas, las rutas de `/api/me` y `device.renamed`.
2. `[P]` `device-link`: escuchar `device.renamed`. Depende de 1.
3. `[P]` La aplicación: la lógica de acceso en `sign-in/access/`, Usuarios pasa a usarla (sin cambiar
   cómo se ve) y muestra los celulares propios. Depende de 1.
4. Configuración: la tarjeta de este dispositivo con las preferencias adentro, los otros dispositivos, el
   recibo, sin conexión; el nombre en la entrada y en Quién hizo qué. Depende de 3.
5. Las capturas, las de punta a punta y el manual de Configuración al día (paso 9).
6. Las revisiones del código y de seguridad (paso 7).
