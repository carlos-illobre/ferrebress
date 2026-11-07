# Revisión de seguridad · 04 · Configuración del dispositivo (`device-settings`), etapa b: lo mío

## Paso 4: el diseño

Revisión independiente del [diseño de la etapa b](device-settings-b.md) desde el punto de vista de un
atacante (constitución, paso 4). Todavía no hay código del módulo. Leí la constitución, el
[capítulo 04](../../chapters/04-device-settings/rules.md) (R1.8, R6 a R10, E10 y E40 a E57), lo que
tocó en 01 · R2.5, 02 · R5, 03 · R2.3 y R4.2 y 05 · R2.6, la
[arquitectura](../architecture.md), la revisión de seguridad de 01 (punto 4, la etiqueta de lista
cerrada) y la de 05 (puntos 2 y 14, el identificador del dispositivo en la auditoría), y el código que
el diseño reutiliza o cambia: `sign-in/sessions/` (`require.ts`, `open.ts`, `cookie.ts`),
`sign-in/access/` (`routes.ts`, `data.ts`, `lost.ts`, `confirm.ts`), `sign-in/passkeys/`
(`data.ts`, `webauthn.ts`, `link-routes.ts`), `sign-in/offline/` (`phone-owner.ts`, `routes.ts`),
`sign-in/codes/computer/`, `sign-in/google/routes.ts` (`/api/start`), `platform/` (`http.ts`,
`session.ts`, `guards.ts`, `device.ts`), `device-link/` (`context.ts`, `lifecycle.ts`,
`listeners.ts`, `routes/state.ts`), `audit-log/rules.ts`, y en la aplicación
`platform/device/device.ts`, `sign-in/offline/` (`enter.ts`, `watch.ts`, `setting.ts`) y
`users/api.ts`. También `deploy/Caddyfile`.

- **Frena:** se puede entrar, ver o cambiar lo ajeno, o filtrar datos personales. Se resuelve antes
  de aprobar el diseño.
- **Mejora:** conviene hacerla; no frena.

## Resumen

Las rutas nuevas están bien planteadas en lo principal: toman la persona de la sesión y nunca la
reciben, reusan las consultas de Usuarios que ya filtran por `user_id`, y el origen, el tipo de
contenido y la cookie `SameSite=Strict` de la plataforma cubren los pedidos desde otros sitios. No
encontré cómo ver ni cortar las sesiones o las huellas de otra persona.

**Lo que frena es el nombre del dispositivo.** La seguridad que el diseño le da (§ 8: «nadie le cambia
el nombre a otro dispositivo sin tener una sesión abierta en él»; «ese identificador está solo en ese
dispositivo») descansa en que el `device_id` es secreto, y no lo es: la auditoría ya lo entrega a
quien tiene «Ver quién hizo qué» (lo anota el vínculo en `targets`), y la sesión guarda el que manda
el navegador al entrar, sin prueba. Con ese identificador, una persona del local le cambia el nombre a
un dispositivo que no tiene en la mano, y su notebook se presenta con el nombre de la computadora del
mostrador en la entrada, en la auditoría y, si se usa ahí, en el «¿Entrar en …?» del celular. Lo
segundo en importancia es justamente eso: el diseño no dice qué muestra el celular antes de aprobar
una computadora, y el nombre libre y repetible deshace la lista cerrada que la revisión de 01 pidió
para esa pregunta.

| # | Punto | Gravedad |
|---|---|---|
| 1 | El `device_id` no es secreto: sale por la auditoría y la sesión toma el que dice el navegador; con él se renombra un dispositivo ajeno y se lo suplanta | **Frena** |
| 2 | El nombre en «¿Entrar en …?» del celular (01 · R2.5): el diseño no lo define, y un nombre libre y repetible ayuda a que alguien apruebe la notebook de otro | Mejora importante |
| 3 | «Quitar» la huella del celular en la mano «y nada más»: queda la memoria de la dueña de la huella, y «Trabajar sin conexión» puede seguir prendida | Mejora importante |
| 4 | «Vincular este celular con mi huella» desde Configuración tiene que seguir pidiendo Google de hace menos de 5 minutos | Mejora importante |
| 5 | El nombre: caracteres invisibles y de dirección, cómo se cuentan las 30 letras y cómo se compara «se repite» | Mejora |
| 6 | El nombre en «desde dónde» (05 · R2.6): de qué identificador sale, con sesión y sin ella | Mejora |
| 7 | Las rutas de `/api/me` sobre la lógica de Usuarios: de quién, identificadores con forma, `from` y los rechazos en la auditoría | Mejora |
| 8 | Los límites: «el de siempre por dispositivo» no existe y se esquiva cambiando la cabecera | Mejora |
| 9 | La limpieza de los nombres a los 365 días no se puede calcular con lo que se guarda | Mejora |
| 10 | Detalles: tope del `Map`, cortar al soltar el dedo, la computadora que se corta a sí misma | Mejora |

---

### 1 · El `device_id` no es secreto (§ 1, § 3 «`/api/start`», § 8; `device-link/context.ts:50` a `:53`, `audit-log/rules.ts:132` a `:135` y `:152`, `sign-in/sessions/open.ts:56`) — Frena

**Dónde:** el diseño dice que el `device_id` «nunca sale del servidor» (§ 1), que para el nombre se usa
el de la sesión, «que quedó fijo al entrar», y que el nombre sin sesión lo lee solo «quien tenga el
identificador del dispositivo», que «está solo en ese dispositivo» (§ 8). Dos cosas del código de hoy
lo contradicen:

- **La auditoría lo entrega.** `device-link` anota cada vínculo con
  `targets: [{ kind: 'phone', id: pairing.phoneDeviceId }, { kind: 'computer', id:
  pairing.computerDeviceId }]` (`context.ts:50`, usado en `lifecycle.ts:31`, `:91`, `:98` y
  `routes/state.ts:27`), y `audit-log/rules.ts` (`viewOf`, `target`) devuelve `targets` tal cual por
  `/api/audit-log`. Es lo que la revisión de 05 (punto 14) anticipó que pasaría si un módulo anotaba
  un `target` de dispositivo.
- **La sesión guarda el que dice el navegador.** `openSession` toma `deviceId: c.get('deviceId')`,
  que es la cabecera `X-Device-Id` del pedido de entrar (`open.ts:56`). «Fijo al entrar» quiere decir
  «el que eligió el navegador al entrar», no uno probado.

**El ataque, paso a paso:** Pedro trabaja en el local, con un rol que tiene «Ver quién hizo qué».

1. Lee en Quién hizo qué el identificador del celular o de la computadora de otra persona, que el
   vínculo dejó anotado.
2. Entra desde su navegador mandando ese identificador como si fuera el suyo: la sesión queda atada a
   un dispositivo que no es el suyo.
3. Desde ahí le pone o le cambia el nombre a ese dispositivo, aunque R9.2 dice que desde un
   dispositivo no se le cambia el nombre a otro.

**Lo propuesto:** que la vista de la auditoría no devuelva el identificador de los objetivos que son
dispositivos, tampoco en las filas viejas; que `device-link` deje de anotar el `device_id` crudo; y una
prueba que busque ese valor en todas las respuestas, como pedía la revisión de 05 (punto 14). **Frena**
hasta que el diseño deje de suponer que el identificador es secreto, o lo haga secreto.

> El resto de este archivo se completó desde el resumen que dejó el revisor, porque su escritura se
> cortó a mitad del punto 1. Cada punto dice lo que encontró y lo que propone; el detalle del ataque y
> de lo que cuesta está solo donde lo escribió.

## 2. Qué muestra el celular en «¿Entrar en …?» (mejora importante)

Un nombre libre y repetible deshace la lista cerrada que pidió la revisión de 01 (punto 4): una
computadora podría llamarse como otra para que el celular apruebe la equivocada. Se propone mostrar
también la etiqueta del navegador junto al nombre, y avisar si el nombre se repite. Si cambia la
regla, lo decide Carlos.

## 3. Quitar la huella propia (mejora importante)

`/api/me/passkey/remove` no puede borrar solo la huella: tiene que borrar también lo que
`ctx.phoneOwners` sabe de ese dispositivo. Si no, `/api/start` sigue diciendo `offline: true` y
«Trabajar sin conexión» queda prendida. Además, choca con 03 · R2.3: quitar la huella termina el
vínculo, y el diseño no lo dice.

## 4. Vincular la huella desde Configuración (mejora importante)

Tiene que seguir pidiendo haber entrado con Google hace menos de 5 minutos (`cannotLink`,
`passkeys/webauthn.ts:41-46`). Falta una prueba de que con una sesión vieja da 403.

## 5. Validar el nombre (mejora)

Bloquear también los caracteres invisibles y los que cambian la dirección del texto (`\p{Cf}`),
además de los de control; normalizar (NFC) antes de guardar; contar las 30 letras igual en la
aplicación, el servidor y la base; y comparar si se repite después de normalizar.

## 6. El nombre en «desde dónde» (mejora)

Tiene que salir del dispositivo de la sesión, no de la cabecera del pedido. Falta decir qué se anota en
las acciones sin sesión (entrar, rechazos).

## 7. Las rutas de `/api/me` (mejora)

Que la lógica reciba la persona explícita (hoy lee `c.req.param('id')` en `access/routes.ts`);
`uuidParams` para `deviceKey` y `sessionId`; `from: 'settings'` puesto por el servidor; y los rechazos
404 anotados en la auditoría una vez por ventana.

## 8. Límite de pedidos para el nombre (mejora)

El límite «de siempre por dispositivo» que nombra el diseño no existe, y uno por cabecera se esquiva
cambiándola. Conviene un límite por sesión para cambiar el nombre: cada cambio deja una fila en la
auditoría y un aviso por el canal.

## 9. Borrar los nombres que nadie usa (mejora)

No se puede calcular con lo que se guarda: las sesiones cerradas se borran a los 30 días
(`sessions/data.ts:147-150`). El nombre puede ser un dato personal («Celu de Juan»). Hace falta un
`last_seen_at` en el dispositivo, o redefinir el plazo.

## 10. Detalles (mejora)

- Un tope para el `Map` de nombres en memoria.
- «Se me perdió» al soltar el dedo puede dispararse al desplazar la lista: mejor un toque que se
  cancela si el dedo se mueve.
- Desde la computadora, «Se me perdió» sobre el celular que la hizo entrar cierra también la propia
  sesión (`approved_by`). No es un riesgo, pero hay que decirlo.

## Sin hallazgos

- **Pedidos desde otros sitios y XSS:** el origen y el tipo de contenido se comprueban en
  `platform/http.ts`, la cookie es `SameSite=Strict`, Preact escapa el texto y la CSP con
  `frame-ancestors 'none'` no deja meter la página en otra.
- **Secretos, despliegue y dependencias:** nada nuevo; `pnpm audit` queda para el paso 7.

