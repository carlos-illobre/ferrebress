# Revisión del código · 04 · Configuración del dispositivo (`device-settings`), etapa b: lo mío

Paso 7. Revisa los commits `da1c361` a `43ebd73` contra las reglas aprobadas
([rules.md](../../chapters/04-device-settings/rules.md): R1.8, R6 a R10, E40 a E60), la maqueta aprobada
([`device-settings-b/final/`](../../design/mockups/device-settings-b/final/)), el diseño
([device-settings-b.md](device-settings-b.md), § 12) y sus dos revisiones, la constitución y el glosario.
También las reglas tocadas de otros capítulos: 01 · R2.5, 02 · R5.1/R5.5/R5.6, 03 · R2.3 y 05 · R2.6.

Las unitarias de lo tocado (servidor `sign-in/access`, `sign-in/devices`, `device-link/names`,
`platform/guards`; aplicación `device-settings`, `sign-in/access`, `users-own`; `shared`) pasan: 25
archivos, 119 pruebas. No corrí `pnpm check` completo, ni las capturas, ni las de punta a punta.

**Gravedad:** **bloqueante** (frena el cierre), **importante** (hay que arreglarlo, pero no rompe una
regla de forma visible para Carlos o tiene un rodeo) y **menor** (mejora).

**Resumen:** ningún bloqueante. Ocho importantes: el orden de «Tus otros dispositivos» sale al revés;
desde la computadora, «Se me perdió» no marca ni anota en el recibo la sesión de la computadora que se
va a cortar; la tarjeta propia de Usuarios no apaga «Trabajar sin conexión» al quitar la huella del
celular en la mano; lo mío no se pone gris si se corta la conexión con la pantalla abierta; «Se me
perdió» es rojo lleno y la maqueta lo tiene rojo suave; R9.6 no borra el nombre de un celular con
huella que nadie usa en un año; la prueba de que ninguna respuesta lleva el identificador del
dispositivo tiene una parte que pasa siempre y no mira las otras rutas; y la regla de R9.1 (nombre o
etiqueta) está escrita dos veces en la aplicación con dos formas de contrato distintas.

---

## 1. Escenarios sin cumplir

1. **El orden de los otros dispositivos sale de la usada hace más a la más reciente.** **Importante.**
   - Dónde: `src/server/modules/sign-in/access/listing.ts:135` (`for (const s of loose.toReversed())`).
   - Qué dicen los documentos: R7.1 dice «como en Usuarios (02 · R5.2)», que ordena «de la usada más
     recientemente a la más vieja». La maqueta muestra primero «Celu de Rubén» (hace 3 min) y después
     «Motorola viejo» (4 nov.).
   - Qué hace el código: `openSessionsOf` las trae ordenadas de la más reciente a la más vieja.
     `toReversed()` las da vuelta para que, si un dispositivo tiene dos sesiones, la última que se
     escribe sea la más reciente. Pero un `Map` mantiene el lugar de la primera vez que se puso la
     clave, así que la lista queda de la más vieja a la más nueva. Los celulares que solo tienen huella
     van al final, sin importar su último uso.
   - Ninguna prueba lo ve: la del servidor (`me.test.ts:48`) tiene un solo dispositivo en `others`, y
     la de la pantalla (`mine.test.tsx:76`) usa una respuesta armada a mano.
   - Arreglo sugerido: recorrer `loose` en su orden y saltear las claves que ya están (`if
     (!devices.has(id))`), y decir en el diseño cómo se ordenan los que tienen solo huella.

2. **Desde la computadora, «Se me perdió» del celular que la hizo entrar no marca ni dice que corta
   esta computadora.** **Importante.**
   - Dónde: `listing.ts:85` (`if (s.deviceId === asking.deviceId) continue;`) y la consulta, que deja
     afuera la sesión del pedido.
   - Qué dicen los documentos: R1.8 dice «Al apuntar a "Se me perdió", se marca lo que se va a cortar
     antes de tocar; después queda un recibo con lo cortado». El diseño, § 7, dice: «"Se me perdió"
     del celular que la hizo entrar con su código cierra también la sesión de esta computadora (02 ·
     R5.6): el aviso rojo la incluye, y después aparece la entrada».
   - Qué hace el código: la sesión de esta computadora nunca aparece debajo del celular que la aprobó,
     así que el rojo no la incluye. El servidor la corta igual (`data.ts:116-123`, `approved_by`), y la
     persona se encuentra con la entrada sin aviso. No hay ninguna prueba de ese caso.
   - Arreglo sugerido: que `MyDevice` diga, en el celular que aprobó esta computadora, que también la
     corta (por ejemplo, `cutsHere: true`), y que `cutsOf` sume «Esta computadora».

3. **La tarjeta propia de Usuarios no apaga «Trabajar sin conexión» al quitar la huella del celular en
   la mano.** **Importante.**
   - Dónde: `src/app/modules/users/actions.ts:128-133` (`removePhone`) y
     `src/app/modules/sign-in/access/actions.ts:47-57`.
   - Qué dicen los documentos: R6.2 dice que al celular en la mano «se le apaga "Trabajar sin conexión"
     (15 · R1.5). En la tarjeta propia de Usuarios pasa lo mismo»; § 12, 6 pide «la misma lógica».
   - Qué hace el código: el servidor deriva bien a `removeHere` (`cutting.ts:74`). La aplicación, en
     cambio, solo llama `passkeyRemovedHere()` y `disableOffline()` en `removeHere` de lo mío. Desde
     Usuarios va por `cutPhone`, que no hace ninguna de las dos. El celular sigue creyendo que tiene
     huella (`hasPasskey()`, que la hoja de confirmar usa para ofrecer la huella) y deja la opción sin
     conexión prendida hasta que una respuesta de `/api/start` la apague. No pude comprobar cuándo llega
     esa respuesta. La prueba `users-own.test.tsx` solo mira que el celular desaparezca de la lista.
   - Arreglo sugerido: que `cutPhone` de la lógica común, cuando la respuesta dice que fue el celular
     en la mano (o cuando la clave es la de este celular), haga lo mismo que `removeHere`. También
     sirve que el servidor lo diga en la respuesta.

4. **Si se corta la conexión con la pantalla abierta, lo mío no se pone gris.** **Importante.**
   - Dónde: `src/app/modules/device-settings/mine/useMine.ts:30-38`.
   - Qué dicen los documentos: R10.1: «Sin conexión, lo mío se ve gris, con "Sin conexión" … y con
     "Reintentar"». La maqueta pone gris todo lo del servidor con `body.offline`.
   - Qué hace el código: solo pasa a `offline` cuando falla un pedido, sea al abrir o al tocar algo.
     Si la conexión se cae después de cargar, todo sigue activo hasta que la persona toca un botón y
     falla. La aplicación ya tiene el estado de la conexión (`online`, en
     `src/app/platform/server/api.ts:20`). E57 solo prueba el caso de abrir la pantalla sin conexión.
   - Arreglo sugerido: escuchar `online` para ponerla gris, sin volver a pedir nada solo (R10.1).

5. **«Se me perdió» desde Configuración acepta cortar un dispositivo que no es un celular.** **Menor.**
   - Dónde: `src/server/modules/sign-in/access/data.ts:129-143` (`phoneOf`) y `me-routes.ts:297-309`.
   - Qué dicen los documentos: R8.1 dice «Cada celular propio».
   - Qué hace el código: `deviceKey` puede ser el `id` de cualquier sesión de la persona, también de
     una computadora y también de una sesión cerrada o vencida. Con `how: 'lost'` corta ese dispositivo
     y anota `phone.cut`. Con `how: 'remove'` anota `passkey.removed` con `passkey: false`, aunque no
     había huella. La pantalla solo muestra el botón en celulares, así que no se ve. Ya lo había
     señalado la revisión del diseño (mejora 2).

6. **«Cerrar todas» cierra más sesiones que las que cuenta.** **Menor.**
   - Dónde: `data.ts:181-192` y `listing.ts:85` y `135-140`.
   - Qué dicen los documentos: R7.2 dice «nunca la del dispositivo que se está usando». La
     confirmación dice «¿Cerrar tus N sesiones en otros dispositivos?».
   - Qué hace el código: la pantalla esconde dos casos, que la prueba de `me.test.ts:51` crea a
     propósito:
     - una segunda sesión abierta en este mismo dispositivo (se entró dos veces);
     - una segunda sesión en otro dispositivo, porque se guarda una sola por dispositivo.

     «Cerrar todas» excluye solo la sesión del pedido, así que cierra también esas, que no se cuentan.
     Además, una sesión escondida en otro dispositivo no se puede cerrar con su ×. La revisión del
     diseño lo había pedido decidir (mejora 3), y el diseño no lo dice.

7. **Las pruebas de E41 y E48 no comprueban todo lo que dice el escenario.** **Menor.**
   - E41 (`me.test.ts:142`) dice que se cierran «las de las computadoras que hizo entrar», pero la
     prueba no tiene ninguna computadora que haya entrado con el código. Lo cubre E49 con la misma
     función.
   - E48 (`me.test.ts:108`) dice que «ese dispositivo vuelve a la entrada con su próximo pedido», y la
     prueba no le hace ningún pedido al dispositivo cerrado.

8. **La prueba de la pantalla que dice E50 prueba otra cosa.** **Menor.**
   - Dónde: `mine.test.tsx:139`.
   - Se llama «E50, R8.1» y prueba el toque en el celular (soltar sin mover). E50 dice que el celular
     en la mano no tiene «Se me perdió», y ninguna prueba de la pantalla mira que la tarjeta de este
     dispositivo no lo tenga. El servidor sí lo prueba (`me.test.ts:152`, el `409 self`).

Los demás escenarios (E40, E42 a E47, E49, E51 a E60) tienen una prueba que los nombra y que mira lo
que dicen, en el servidor, en la pantalla o en los dos.

## 2. Comentarios de cabecera y carpetas

1. **Cabeceras que quedaron atrás.** **Menor.**
   - `src/server/modules/sign-in/index.ts:1-2`: no dice que carga los nombres de los dispositivos, que
     se los da a la plataforma ni que los limpia una vez por día.
   - `src/server/modules/sign-in/access/data.ts:1`: dice «lo que Usuarios muestra y corta», y ahora
     también lo usa lo mío (`removePasskey` es solo de lo mío).
   - `src/app/modules/sign-in/access/actions.ts:45-46`: dice que sin `said` «no hay tostada», pero con
     «Quitar» sí la hay (`:54`). En Configuración, «Quitar» en otro celular muestra la tostada y además
     el recibo.
   - `src/shared/text/clean.ts:16`: dice «sin distinguir … tildes de más». `sensitivity: 'accent'` sí
     distingue «Depósito» de «Deposito». Lo que no distingue son las mayúsculas, como dice el contrato
     (`device-settings.ts:21`).
   - `src/shared/audit-log/device-settings.ts:1`: repite el nombre del archivo.
2. **Un comentario fuera de lugar.** **Menor.** En `src/server/routes-permissions.test.ts:25-31`, las
   seis rutas de `/api/me` quedaron debajo del comentario «El vínculo (capítulo 03)».
3. **Carpetas.** **Menor.**
   - `screens/Settings/Devices/` (8 archivos) está bien agrupada. Pero sus CSS los importa
     `Settings.tsx` y no el componente que los usa (`Others.tsx` no importa `Others.css`, ni
     `Family.tsx` importa `Family.css`).
   - En la raíz de `src/app/modules/device-settings/` conviven lo de la etapa a (`preferences.ts`,
     `rules.ts`, `texts.ts`, `useSettings.ts`, `settings.ts`, la instalación) con `mine/`. Juntar las
     preferencias en `preferences/` y la instalación en `install/` dejaría la raíz como índice.

## 3. Pruebas que miran por dentro

**Menor**, todas:

- `src/server/modules/sign-in/devices/names.test.ts`: crea `createDeviceNames` a mano, escribe en
  `sign_in.devices` directo y cambia `signInSettings.devices.maxInMemory`. Prueba el tope de la memoria,
  que no se ve desde la API. La constitución deja cambiar los topes en `settings.ts`, pero la prueba
  depende de cómo se desaloja.
- `src/server/platform/guards.test.ts`: arma una `Platform` de mentira con `as unknown as Platform`. Es
  plataforma y se acepta, pero se rompe si `recorder` pide otra cosa de la plataforma.
- `src/server/modules/audit-log/rules.test.ts:35`: llama `viewOf` directo. Sigue lo que ya hacía ese
  archivo. Una prueba por la ruta de la auditoría lo haría desde afuera.
- `src/app/modules/sign-in/session.test.ts:135`: llama `passkeyRemovedHere` directo. Ya lo cubre
  `mine-here.test.tsx:103` desde la pantalla.

## 4. El diseño

1. **No se cuentan las consultas de cada ruta nueva.** **Importante.**
   - Qué dice el diseño: § 9 dice «Las pruebas cuentan las consultas de cada ruta nueva»; la tabla de §
     3 da 2 para cerrar una, 1 para cerrar todas, 3 a 4 para cortar, 2 para quitar la huella propia y
     1 para el nombre.
   - Qué hace el código: solo cuenta `GET /api/me/devices` (`me.test.ts:228`, 2: cumple) y el nombre
     (`devices.test.ts:47`), y en el nombre acepta hasta 5. Ninguna prueba cuenta las de cerrar, cortar
     ni quitar la huella.
   - Además, la del nombre ya no es 1: el aviso abre una transacción y `device-link` busca sus vínculos
     adentro (`listeners.ts`, `withDevice`). Hay que corregir el número del diseño o la ruta, y ajustar
     el tope de la prueba al número exacto.
2. **El diseño nombra cosas que no existen o se llaman distinto.** **Menor.**
   - No hay `devices/rules.ts` (diseño § 5): la limpieza y «se repite» están en
     `src/shared/contracts/device-settings.ts`.
   - El límite se llama `devices.renames`, no `devices.renamesPerHour` (§ 3).
   - El texto de borrar el nombre es «Le sacó el nombre a este dispositivo: Caja»
     (`shared/audit-log/device-settings.ts:19`), no «Le sacó el nombre» (§ 4). Además, «este
     dispositivo» en Quién hizo qué se lee como si fuera el que está mirando.
3. **La fila de `sign_in.devices` no se crea con la primera sesión.** **Menor.**
   - Qué dice el diseño: § 2 dice que se crea con la primera sesión.
   - Qué hace el código: se crea con el primer uso que anota `store.touch`
     (`sessions/store.ts`, `onUsed`) o al ponerle nombre.

## 5. Seguridad

Contra la sección 8 del diseño:

- **Solo lo propio y 404 para lo ajeno:** cumple. Las rutas toman la persona de la sesión
  (`me-routes.ts:282`). Una sesión o una clave de otra persona da 404 y se anota una vez
  (`me.test.ts:174`). El nombre va al dispositivo de la sesión aunque la cabecera diga otro
  (`devices.test.ts:101`).
- **El identificador del dispositivo, secreto:** `device-link` ya no lo anota (`context.ts`,
  `targetsOf`), y la vista de la auditoría lo borra también en las filas viejas (`audit-log/rules.ts`).
  Pero **la prueba que lo comprueba en las respuestas está incompleta.** **Importante.**
  - Dónde: `me.test.ts:227-241`.
  - Qué dice el diseño: «una prueba busca el identificador de una sesión en todas las respuestas de las
    rutas que tocan dispositivos».
  - Qué hace la prueba: mira solo `GET /api/me/devices`. La segunda parte pide `/api/users/:id/access`
    con una persona sin ningún permiso (`person()` llama `onlyWith(…, [])`), así que la respuesta es un
    403 y la comprobación pasa siempre.
  - Faltan `/api/lost-phones`, `/api/start`, `/api/sign-in/codes/read`, `/api/device-link/check` y la
    vista de Quién hizo qué.
- **Lo que entra de afuera:** el nombre se limpia con `cleanText` (NFC, sin `\p{Cc}`/`\p{Cf}`, 30
  letras). La base lo vuelve a controlar con `char_length` (`006-devices.ts:192`), y las pruebas cubren
  31 letras, tildes, invisibles y dirección del texto. Cumple.
- **Límites:** 10 cambios de nombre por hora y por sesión, probado. Cortar usa el mismo límite que
  Usuarios. Cumple.
- **La entrada muestra el nombre sin sesión** solo a quien manda el identificador (`google/routes.ts`).
  Cumple. La pantalla del código guarda el identificador que dijo la computadora (`screens.ts`) y no
  lo devuelve. Cumple.
- **No lo pude comprobar:** que `deviceId` de la cabecera se valide como UUID antes de llegar a
  `devices.nameOf` y a `screens.open`. Lo da la plataforma y no lo cambió esta etapa.

## 6. Reglas inventadas

1. **«Usada ahora» si se usó hace menos de 5 minutos.** **Menor.**
   - Dónde: `Family.tsx:16` y `:82`.
   - La maqueta muestra «Usada ahora» y «usada ahora», pero ningún documento dice desde cuándo algo
     cuenta como «ahora». El número está escrito dos veces en la pantalla (ver § 7).
2. **«Cerrar todas» solo con más de una sesión.** **Menor.**
   - Dónde: `Others.tsx:59`.
   - Sale de la maqueta (`ses > 1`), pero la tarjeta de Usuarios lo muestra desde una
     (`Access.tsx:87`). Si es a propósito, conviene decirlo en `ux` o en el diseño, porque Carlos pide
     que las dos pantallas hagan lo mismo.
3. **Las ideas de nombre** («Celu de <nombre>», «Celu del depósito», «Compu de la oficina», «Caja 2»,
   en `mine/texts.ts:330-333`) vienen de la maqueta. Si la persona no tiene nombre, la primera idea
   queda «Celu de ». **Menor.**
4. **«Desde dónde» de Quién hizo qué pasó a ser privado entero.** **Menor.**
   - Dónde: `audit-log/screens/Detail.tsx`.
   - Se le agregó `data-private`, así que la captura de «Avisar y seguir» lo tapa. Es razonable, porque
     el nombre puede ser un dato personal, pero no está en el diseño de 05.

## 7. Simpleza y repetición

1. **La regla de R9.1 (el nombre o, sin nombre, la etiqueta) está dos veces en la aplicación, con dos
   formas de contrato.** **Importante.**
   - En la aplicación: `src/app/modules/users/logic.ts:88` (`deviceOf`, lee `deviceName`) y
     `src/app/modules/device-settings/mine/rules.ts:13` (`nameOf`, lee `name`).
   - En el servidor, para «el nombre si tiene», hay cuatro formas de escribir lo mismo: `listing.ts`
     (`nameOf` y `deviceNameOf`), `phone-routes.ts` (`nameOf`), `google/routes.ts` y `lost.ts`, en
     línea.
   - El origen es que `contracts/users.ts` dice `deviceName` y `contracts/device-settings.ts` dice
     `name`. El glosario dice `deviceName`.
   - Arreglo sugerido: una sola forma en el contrato y una sola función compartida (en
     `src/shared/`), que usen las dos pantallas y el servidor.
2. **Números de tiempo fuera de `settings.ts`.** **Menor.**
   - `Family.tsx:16` y `:82` (`5 * 60_000`, dos veces, con la misma lógica escrita dos veces: `usedLine`
     y el `Chips` en línea).
   - `Here.tsx:107` (`900` ms del brillo).
   - `Family.tsx:122` (10 px del dedo que se movió).
   - La constitución (XII) pide los tiempos y los topes con nombre, en el `settings.ts` del módulo.
3. **Botones armados a mano con las clases de `ui/button`.** **Menor.**
   - Dónde: `Family.tsx:126` («Se me perdió»), `Others.tsx:80` («Listo» del recibo) y `Name.tsx:284`
     («Listo» del nombre).
   - Repiten `button button-… button-small` en vez de usar `Button`. Pasa porque `Button` no deja pasar
     `type="submit"` ni los eventos del puntero. Conviene que los deje pasar antes de copiar las
     clases.
4. **La cuenta de letras del campo** (`Name.tsx:39`, `lettersIn(draft.text.trim())`) no cuenta igual
   que la limpieza: no junta los espacios dobles ni saca lo invisible. Puede decir «31/30» y apagar
   «Listo» con un nombre que limpio tiene 30. **Menor.** Lo correcto es contar `cleanDeviceName`.
5. **El campo del nombre no se apaga sin conexión.** **Menor.**
   - Dónde: `Name.tsx`, `Field`.
   - Recibe `disabled` y no lo usa: si la conexión se corta mientras se escribe, «Listo» sigue activo
     (después falla y la pantalla queda gris).
6. **La memoria de nombres con el tope lleno.** **Menor.**
   - Dónde: `devices/names.ts:105-111`.
   - Cuando un nombre se olvida de la memoria, sigue en la base: la entrada, las listas y la auditoría
     dejan de mostrarlo. Si después se cambia, `device.renamed` anota «Le puso nombre» en vez de «Le
     cambió el nombre», porque el nombre anterior sale de la memoria (`devices/routes.ts:170`). Con
     1000 de tope no debería pasar en una ferretería; basta con decirlo en el diseño.

## 8. Documentación que quedó atrás

1. **R9.6 y el diseño no dicen lo mismo, y el código sigue al diseño.** **Importante.**
   - Dónde: `devices/data.ts:56-64` (`forgetUnused`).
   - Qué dicen los documentos: R9.6 dice que el nombre de un dispositivo «que nadie usa desde hace un
     año se borra solo», porque puede ser un dato personal. El diseño, § 2, agrega «sin sesión ni
     huella».
   - Qué hace el código: un celular con huella que nadie usa en un año (perdido, dado de baja de hecho)
     conserva su nombre para siempre. Manda la regla. O el código mira también el último uso de la
     huella, o Carlos acepta la excepción y se escribe en la regla.
2. **El glosario no tiene las palabras nuevas.** **Importante.**
   - Qué dice el glosario: «Se me perdió» es `lostPhone`, y no está en ningún lado: el código dice
     `how: 'lost'` y `cut`.
   - Qué falta: «Lo mío / lo tuyo» (`mine`, `/api/me`), «recibo» (`receipt`), `deviceKey`, «Quitar»
     (`remove`) y «Este dispositivo» (`here`).
   - La constitución (X) pide agregarlas antes de usarlas. La revisión del diseño ya lo había pedido
     (mejora 4).
3. **El diseño de `sign-in` no tiene la tabla ni las rutas nuevas.** **Menor.**
   - `docs/technical/modules/sign-in.md` suma `deviceName` en `/api/start`, pero no `sign_in.devices`,
     la limpieza de los nombres, las rutas `/api/me/*` (que son de `sign-in`) ni el reparto de
     `access/` en `listing`, `cutting`, `users-routes` y `me-routes`.
   - Todo eso está en `device-settings-b.md`, así que se puede reconstruir, pero quien lea solo el
     diseño del módulo dueño no lo encuentra.
4. **Lo que el código decidió sin que esté escrito.** **Menor.**
   - Que «ahora» es menos de 5 minutos (§ 6.1).
   - El orden de los otros dispositivos (§ 1.1).
   - Que un dispositivo con dos sesiones muestra solo la más reciente (§ 1.6).
   - Que las computadoras que hizo entrar un celular cuelgan de él solo mientras tenga huella. La
     maqueta (`raices()`) dice «mientras ese celular tenga sesión o huella». Después de quitar la
     huella del celular en la mano, sus computadoras pasan a verse sueltas (`listing.ts`, `phoneOf`
     sale de las huellas).
5. **Faltan capturas del diseño.** **Menor.**
   - Qué dice el diseño: § 10 pide capturas de «el recibo» y de «la entrada con el nombre».
   - Qué hay: `tests/screens/references/` solo tiene Configuración al abrir, en la computadora y el
     celular, y la entrada sin nombre.

## 9. Pantallas

Comparé `tests/screens/references/settings-desktop.png` y `settings-phone.png` con `screenshot.png` y
`screenshot-phone.png` de la maqueta final. No miré el recibo, el teclado, «Cerrar todas» ni la vista
sin conexión en un navegador: no hay captura de esas pantallas y no las levanté.

1. **«Se me perdió» es rojo lleno; en la maqueta es rojo suave.** **Importante.**
   - Dónde: `Family.tsx:126` usa `button-red`.
   - La maqueta usa `btn-peligro` (`common.css:170`: fondo `--error-suave` y texto `--error-texto`), que
     en la aplicación es `button-danger` (`ui/button`). Lleno, el botón compite con todo lo demás, y es
     justo lo que el lenguaje visual reserva para lo que la tarea pide.
2. **«Tus otros dispositivos» es un rótulo chico y gris; en la maqueta es un título.** **Menor.**
   - Dónde: `Others.tsx:120`, `settings-group`.
   - En la maqueta tiene el tamaño de un `h2`, a la par de «Esta computadora».
3. **Las fechas de la huella dicen «12/09»; la maqueta dice «12 sep.».** **Menor.**
   - Dónde: `Here.tsx` y `Family.tsx`, con `dateOf`.
   - Ejemplos: «Huella desde 12/09», «Tu huella está acá desde 12/09». El capítulo deja la forma
     larga o corta «según el lugar», y `changes.md` dice «Huella desde 3 mar.».
4. **«usada ahora» de las computadoras que hizo entrar no va en verde.** **Menor.** La maqueta lo
   resalta (`em.vivo`).
5. **En el celular:** **Menor.**
   - El dibujo del celular no tiene la muesca de arriba que tiene la maqueta.
   - «Cambiar el nombre» llega al borde derecho de la tarjeta, a 390 px.
   - La maqueta del celular dice «Cómo lo usás vos acá» y la aplicación «Cómo la usás vos acá». En la
     computadora la maqueta dice «la».
6. **El resto coincide:**
   - el dibujo con «Sin nombre» y la etiqueta;
   - «Ponele nombre» naranja y la nota larga y corta;
   - las cuentas y «Cerrar todas»;
   - una tarjeta por dispositivo con sus fichas y su ×;
   - las computadoras colgadas con la línea punteada;
   - el rojo de lo que se corta con el mouse, la marca del teclado (`.marked`) o el dedo apoyado
     (`Family.css:131-140`);
   - las preferencias adentro de la tarjeta de este dispositivo.

---

## Lo que se podría extraer a una librería

La etapa agregó y cambió cosas no funcionales (seguridad, auditoría, rendimiento en memoria, piezas
visuales y un gesto táctil). Para cada una:

- **La limpieza de textos** (`src/shared/text/clean.ts`: `cleanText`, `lettersIn`, `sameText`).
  - Serviría a cualquier proyecto que muestra a otros lo que escribe una persona: NFC, sin
    caracteres de control ni de dirección, largo en letras.
  - Qué la ata a Ferrebress: nada del negocio, salvo los ejemplos del comentario y el `'es'` fijo de
    `sameText`.
  - Grupo: base del servidor y de la aplicación (lo compartido).
  - Cambio chico: recibir el idioma por parámetro (con `'es'` por defecto).
- **El nombre del dispositivo como servicio de la plataforma** (`src/server/platform/device-names.ts`,
  el `name` en `guards.ts` y `DeviceCodes.name` en la auditoría).
  - Serviría a otro proyecto con sesiones atadas a un dispositivo y una auditoría de «desde dónde».
  - Qué lo ata: solo los comentarios (04 · R9).
  - Grupo: identidad (con la auditoría de la base del servidor).
  - Cambio chico: ninguno; ya sigue el mismo patrón que `sessions.provide`.
- **La memoria de nombres con último uso por tandas y limpieza por antigüedad**
  (`src/server/modules/sign-in/devices/names.ts` y `data.ts`).
  - Es un patrón general: un `Map` con tope, cargado al arrancar y al día después de confirmar; una
    marca «usado hoy» que se escribe por tandas, una vez por día; y el borrado de lo que nadie usa.
  - Qué la ata: importa `signInSettings` y las tablas de `sign_in`, y la consulta de «en uso» conoce
    `sessions` y `passkeys`.
  - Grupo: identidad.
  - Cambio chico: recibir los topes y la consulta de «en uso» por parámetro, y separar `createSeen`
    (que no sabe nada de dispositivos) en `platform/`.
- **Esconder identificadores en la vista de la auditoría** (`audit-log/rules.ts`, `deviceKinds`).
  - Serviría a cualquier auditoría con objetivos que no se deben mostrar.
  - Qué la ata: la lista de clases (`phone`, `computer`, `device`) está escrita en la regla.
  - Grupo: base del servidor (auditoría).
  - Cambio chico: que cada módulo declare qué clases de objetivo son secretas, como ya declara sus
    tipos de acción.
- **El gesto «se corta al soltar el dedo si no se movió»** (`Family.tsx`, `Lost`, líneas 115-145).
  - Serviría a cualquier acción destructiva de un toque en una lista que se desplaza.
  - Qué la ata: está en el mismo componente que el texto «Se me perdió», el ícono de tijeras y las
    clases `mine-*`; el umbral de 10 px está escrito ahí.
  - Grupo: piezas visuales (o teclado y accesibilidad).
  - Cambio chico: sacarlo a un `usePressWithoutMove(onPress)` en `ui/`, con el umbral en su
    `settings`.
- **Cuándo pasó algo, como lo dice la gente** (`sinceOf` y `dateOf`, que se mudaron de `users/logic.ts`
  a `src/app/platform/time.ts`).
  - Serviría a cualquier aplicación en castellano con la hora del servidor.
  - Qué la ata: los textos en castellano («recién», «hace 5 min», «ayer») están en el código de la
    plataforma.
  - Grupo: base de la aplicación.
  - Cambio chico: llevar los textos a un archivo de textos de la plataforma.
- **La lógica común de cortar acceso en la aplicación** (`src/app/modules/sign-in/access/`).
  - Es de identidad, pero con textos y reglas de Ferrebress (las tostadas, `Whom`, las rutas): no es
    para otro proyecto tal como está.
  - Grupo: identidad.
  - Cambio chico: separar los textos (ya están en `texts.ts`) de las llamadas, que ya están separadas.

**Hoy no conviene extraer nada.** Las piezas son chicas y dos de ellas todavía tienen arreglos
pendientes en esta misma revisión (la memoria de nombres con R9.6 y el gesto del dedo con los números
fuera de `settings.ts`). Además, no hay un segundo proyecto que las pida. Los cambios chicos de arriba,
en cambio, son baratos y dejan cada parte lista para el día que Carlos lo decida.
