# Revisión del código · 06 · Administración (`administration`), etapa a: ajustes para todos

Paso 7. Revisa los commits `5bf6e26` a `c8a6627` contra las reglas aprobadas
([rules.md](../../chapters/06-administration/rules.md): R1 a R7, E01 a E41), la maqueta aprobada
([`administration-settings/final/`](../../design/mockups/administration-settings/final/)), el diseño
([administration.md](administration.md)) y sus dos revisiones, la constitución y el glosario. También lo
que el módulo tocó en `sign-in`, `device-link`, `users`, `src/shared/` (contrato, permisos, auditoría,
redondeo, zona horaria) y la plataforma (`config.ts`, `Toast.tsx`, `App.tsx`).

Corrí las unitarias de lo tocado (servidor `administration`, `device-link`, `sign-in/sessions`;
aplicación `administration`; `shared` de contrato, redondeo, zona y auditoría): 25 archivos, 141 pruebas,
todas pasan. No corrí `pnpm check` completo, ni las capturas (`pnpm screens`), ni las de punta a punta, ni
abrí la pantalla en un navegador: lo de las pantallas sale de comparar las capturas de referencia
(`tests/screens/references/administration-*.png`) con las de la maqueta, y de leer el código.

**Gravedad:** **Frena** (frena el cierre) o **Mejora**.

**Resumen:** ocho puntos frenan:

- escribir una letra o un número enorme en los días del vínculo rompe el panel;
- el margen repetido no dice «ya hay un margen rápido de 200 %»;
- con el teclado no se llega a las opciones de un ajuste desde su atajo (R1.8);
- falta la prueba de punta a punta que decidió Carlos (E33);
- E08 no tiene prueba;
- la prueba de E31 no mira a. m./p. m.;
- la de E36 no prueba una sesión que ya estaba abierta;
- falta la prueba de la zona guardada sin conexión que pide el diseño.

Lo demás son mejoras. Las más visibles: la pantalla se aparta de la maqueta en varios lugares (sin «Más ›»
ni «‹ Más», sin «Vende a» en los márgenes, la confirmación sin los ejemplos, el aviso sin el «antes →
después» y sin la tecla D). También el diseño quedó atrás en los nombres de los errores y en la lista de
archivos.

---

## 1. Escenarios sin cumplir

1. **Escribir una letra o un número enorme en los días del vínculo rompe el panel.** **Frena.**
   - Dónde: `src/app/modules/administration/screens/Administration/Pairing.tsx:12`
     (`typedIn = Number(value)`), `:26` (`onInput` guarda lo escrito mientras se escribe) y `:102`
     (`expiresOn(days, …)`); `logic.ts:55-58`.
   - Qué dicen los documentos: E38 dice que con 0, 366, un decimal o vacío «no se guarda y se dice
     "Entre 1 y 365 días"». R2.2 dice que el ajuste sigue con el valor que tenía.
   - Qué hace el código: cada tecla pasa por `Number(...)`, y el valor pasa enseguida a `expiresOn`, que
     arma una fecha con `now + days * día` y la formatea con `Intl.DateTimeFormat`. Con una letra,
     `days` es `NaN`, y con un número muy grande (por ejemplo, 99999999999) la fecha queda fuera de rango.
     En los dos casos `format` lanza `RangeError: Invalid time value` (lo comprobé en Node) durante el
     dibujo, antes de llegar a validar. En la computadora la caja no impide letras: `inputMode` solo
     cambia el teclado del celular. Además, borrar la caja la deja en «0» (`Number('') === 0`), así que
     no se puede vaciar para escribir otro número.
   - Ninguna prueba lo ve: la de E38 (`administration.test.tsx:167`) solo escribe 20 y 400.
   - No lo corrí en un navegador: no sé si lo ataja «Algo salió mal» o si la pantalla queda en blanco.
   - Arreglo sugerido: guardar lo escrito como texto y calcular el vencimiento solo si es un entero del
     rango; si no, mostrar el valor guardado. Sumar a la prueba de E38 una letra, el 0, el vacío y un
     decimal.

2. **El margen repetido no dice cuál está repetido.** **Frena.**
   - Dónde: `src/app/modules/administration/texts.ts:75-78`, `saving.ts:35-36`.
   - Qué dicen los documentos: E27 dice «se dice que ya hay un margen rápido de 200 %». La maqueta
     (`screenshot-margins-error.png`, `settings.js:240`) muestra «Ya hay un margen rápido de 200 %» y
     marca en rojo la tecla repetida.
   - Qué hace el código: cualquier valor que no pasa el contrato da el mismo texto, «Va un entero entre 1
     y 10.000, sin repetir.». No dice cuál está repetido ni marca la tecla. La prueba
     (`administration.test.tsx:108`) comprueba ese texto genérico.
   - Arreglo sugerido: separar en `saving.ts` el caso del repetido, que es lo único que el contrato no
     dice con un rango, y usar el texto de la regla con el número.

3. **Con el teclado no se llega a las opciones de un ajuste desde su atajo.** **Frena** (por lectura del
   código; no lo pude probar en un navegador).
   - Dónde: `List.tsx:84` (`onClick={() => view.setPanel(item.panel)}`), `Options.tsx:20-29` y
     `platform/keyboard.ts` (`shortcut`, `arrow`).
   - Qué dicen los documentos: R1.8 dice «con el teclado se llega al ajuste con su atajo y se recorren
     sus opciones con ← y →».
   - Qué hace el código:
     - Alt R (o M, Z, S, T, V) hace `click()` en el renglón de la lista: cambia el panel, pero el foco
       queda donde estaba.
     - Las opciones no tienen `data-mark`. Las flechas del motor del teclado recorren lo marcable de la
       capa, que son los renglones de la lista, no las opciones.
     - ← y → entre opciones (`Options.tsx:move`) andan solo si el foco ya está en una opción, y a eso se
       llega con Tab.
     - Además, el motor escucha en `window` y no mira `defaultPrevented`. Con el foco en una opción, cada
       ← o → también mueve la marca en la lista (no lo comprobé).
   - La prueba «R1.8» (`administration.test.tsx:153`) pone el foco a mano en la opción y manda las teclas
     al botón: no pasa por el atajo ni por el motor del teclado.
   - Arreglo sugerido: que el atajo del ajuste lleve el foco a la opción elegida de su panel, y una
     prueba que arranque con `startKeyboard()` y Alt R.

4. **Falta la prueba de punta a punta que decidió Carlos.** **Frena.**
   - Dónde: `tests/e2e/` no tiene nada de Administración.
   - Qué dicen los documentos: diseño § 12, 3: «Una prueba de punta a punta: un Administrador baja el
     tiempo sin uso y la sesión de otro dispositivo, ya pasada, termina en su próximo pedido, con la
     entrada encima (E33). La unitaria no alcanza». § 11, tarea 6, la pone en la última tarea.
   - Qué hace el código: E33 se prueba solo en el servidor (`sessions.test.ts:27`). Lo de «la entrada
     encima de lo que tenía», en un navegador de verdad, no lo prueba nada. El commit `c8a6627` no la
     nombra.

5. **E08 no tiene prueba, y no anda como dice el diseño.** **Frena** (por la prueba que falta).
   - Dónde: `useAdministration.ts:1-4`, `:70-71` (`put` con `query.update`); `saving.ts:44-57`.
   - Qué dicen los documentos:
     - E08: el cambio hecho en la computadora se ve en el celular.
     - Diseño § 7: «el aviso de lo guardado es un valor con nombre espejado que lleva el ajuste, el valor y
       la versión nuevos: el otro lo aplica».
     - Diseño § 10: «Dos dispositivos vinculados, por el directo y por el servidor».
   - Qué hace el código:
     - El aviso es una tostada local (`showToast`) y no viaja.
     - Lo que viaja es la respuesta entera de `/api/administration`: `query.update` cambia el valor con
       nombre `q:administration`, que el espejo manda «como cualquier cambio» (`platform/mirror/query.ts`).
       Por lectura del código, eso alcanza para E08 por los dos caminos. Pero manda la respuesta entera
       (unos 300 bytes), no el ajuste solo, y en el otro dispositivo no aparece ningún aviso.
     - El comentario de cabecera de `useAdministration.ts` dice lo del diseño, y no es lo que hace el
       código.
   - Ninguna prueba nombra E08 ni prueba dos dispositivos.
   - Arreglo sugerido: una prueba con dos dispositivos y el espejo por el servidor. Después, corregir el
     diseño o el código para que digan lo mismo.

6. **La prueba de E31 no mira a. m./p. m.** **Frena.**
   - Dónde: `administration.test.tsx:115-121`.
   - Qué dicen los documentos: E31: con a. m./p. m. elegido, la hora del negocio se ve así. Diseño § 10:
     «La zona en la pantalla, con 24 horas y a. m./p. m.».
   - Qué hace el código: usa `formatTime`, que respeta el formato elegido, así que es probable que ande.
     Pero la prueba que nombra E31 solo comprueba «14:30» con 24 horas.

7. **La prueba de E36 no prueba una sesión que ya estaba abierta.** **Frena.**
   - Dónde: `src/server/modules/administration/sessions.test.ts:116-127`.
   - Qué dicen los documentos: E36: «una sesión abierta hace 5 horas, cuando se lo pasa a 12, sigue hasta
     las 12 horas».
   - Qué hace el código: los límites se leen en cada pedido, así que es probable que ande. Pero la prueba
     sube el tope a 12 **antes** de abrir la sesión: prueba una sesión nueva con tope de 12 horas, no que
     subir el tope alargue una abierta. Tampoco mira el `Max-Age` de la cookie, que es lo que hacía
     fallar E36 antes (eso lo mira `google.test.ts:42`).
   - Arreglo sugerido: abrir la sesión, adelantar 5 horas con uso, subir a 12 y comprobar que a las 10
     horas sigue y a las 12 no.

8. **Falta la prueba de la zona guardada sin conexión.** **Frena.**
   - Dónde: `src/app/App.tsx:59-81` (`applyZone`, `zoneKey`).
   - Qué dicen los documentos: diseño § 10, fila E30 y E31: «la zona guardada se usa sin conexión». Es lo
     que pidió la revisión del diseño (7.1, que frenaba).
   - Qué hace el código: guarda la zona en `localStorage` y, si `/api/start` falla, aplica la guardada.
     Ninguna prueba de la aplicación lo comprueba: no hay ninguna que use `businessTimeZone` fuera de los
     kits.

9. **E05: la prueba no comprueba que la pantalla quede sin poder tocarse.** **Mejora.**
   - Dónde: `administration.test.tsx:196-208`.
   - Qué dicen los documentos: E05 tiene tres partes: no se guarda, se dice que ya no tiene el permiso, y
     la pantalla queda sin poder tocarse.
   - Qué hace el código: la tercera parte depende de que la huella de permisos de la cabecera ponga al día
     a la persona (02 · R7.8). La prueba solo mira el texto. No lo pude comprobar.

10. **E14 y E29 no tienen prueba.** **Mejora.**
    - Por construcción se cumplen: no hay canal ni pedido automático (E14), y `quickMargins` no llama a
      nadie (E29).
    - La revisión del diseño (1.4) proponía para E29 probar que cambiar los márgenes no llama al
      recalculador. El diseño § 10 pide para E14 «otra pantalla no pide nada».

11. **Un margen escrito con punto decimal se guarda como otro número.** **Mejora.**
    - Dónde: `Margins.tsx:11` (`Number(text.replace(/\./g, ''))`).
    - Qué dicen los documentos: E28: «un número con decimales… no se guarda».
    - Qué hace el código: «12,5» se rechaza, pero «12.5» pasa a 125 y se guarda. Sacar los puntos sirve
      para «10.000», que es como lo muestra la caja, pero también se come el punto decimal.
    - En castellano de Argentina el punto es de los miles, así que es defendible. Conviene decidirlo y
      anotarlo, o rechazar un punto que no separe grupos de tres.

12. **E41 en la pantalla y E33 «sin perder nada».** **Mejora.**
    - E41: el servidor lo prueba (`rounding.test.ts:52`), y la pantalla vuelve a preguntar porque
      reemplaza `asked` con el número nuevo (`saving.ts:63-64`). Ninguna prueba de la aplicación lo
      comprueba.

Lo demás está y tiene una prueba que lo comprueba:

- E01 a E04, E06, E07, E09 a E13: servidor y pantalla.
- E15 a E17: `pricing`.
- E18 a E24: servidor con el recalculador de mentira, y pantalla.
- E25 a E28: contrato, servidor y pantalla.
- E30 y E32 a E35, E37 a E40: servidor y contrato.

## 2. Comentarios de cabecera y carpetas

1. **`useAdministration.ts:1-4`.** **Mejora.** Dice que el aviso de lo guardado viaja y lleva el valor
   nuevo (E08). No es así: viaja la respuesta de la consulta (ver 1.5).
2. **`src/shared/time/business.ts:1-4`.** **Mejora.** Dice «el servidor la lee del .env al arrancar».
   Ahora sale de `deploy/compose.yml` (variable del entorno del contenedor), no del `.env`.
3. **`data.ts:1-2`.** **Mejora.** Dice «guardar uno con la versión que se vio, en una sola sentencia». Es
   cierto por pedido, pero son dos sentencias distintas según la versión (`insert … do nothing` con 0,
   `update … where version` con otra), no la única `insert … on conflict do update … where` del diseño
   (§ 2). El comentario de adentro (`:18-20`) sí lo explica bien. Ver 4.4.
4. **`Toast.tsx:1-5`.** Al día. **`sign-in/settings.ts`, `cookie.ts`, `device-link/expiry.ts`:** al día.
5. **La carpeta `screens/Administration/` tiene 15 archivos** (10 de código y 4 de estilos). **Mejora.**
   - Los cinco paneles (`Rounding`, `Margins`, `Zone`, `Session`, `Pairing`) y lo que solo usan ellos
     (`Options`, `Heading`, `look.ts`) comparten un concepto: irían en `panels/`.
   - La constitución pide agrupar por concepto «aunque la carpeta no esté cerca del tope».
   - La del servidor (10 archivos de código) está bien.

## 3. Pruebas que miran por dentro

1. **`memory.test.ts`.** **Mejora.** Prueba `createMemory()` directamente. Lo que importa (un cambio viejo
   no pisa uno nuevo) se puede probar por la fachada. Si `memory.ts` cambia de forma, la prueba se rompe
   aunque la regla siga.
2. **`settings.test.ts:172-198`.** **Mejora.**
   - Llama a `module.register({ ...first.platform } as never)` a mano, con una plataforma armada con un
     `as never`.
   - Sirve para probar que no arranca, pero depende de cómo está hecho `register`. Mejor:
     `createSignInServer()` contra una base ya sembrada, si el kit lo permite.
3. **`pairing-days.test.ts:25-27`.** **Mejora.**
   - Inserta en `device_link.pairings` con los valores por posición, sin nombres de columna. Una
     migración de 03 que sume una columna la rompe sin que cambie nada de 06.
   - `:49` además actualiza la tabla de otro módulo a mano.
4. **Pruebas de la pantalla que buscan por clase CSS.** **Mejora.** Por ejemplo, `.admin-big b`,
   `.admin-clock-time`, `.admin-weeks i` y `classList.contains('admin-option')` (en el kit, `option`). Un
   cambio de estilos las rompe; se pueden buscar por rol y nombre (`role="radio"`, `aria-label`).
5. **«La hora del negocio se mueve sola, sin pedidos»** (`administration-edges.test.tsx:28`). **Mejora.**
   Comprueba que no hay pedidos, pero no que la hora cambie.

## 4. El diseño

1. **Los códigos de error tienen otro nombre.** **Mejora** (documentación).
   - El diseño § 3 dice `400 invalid`, `409 changed` y `409 confirm`. El código usa `invalid-setting`,
     `setting-changed` y `confirm-prices` (`errors.ts`).
   - El `400` no lleva «el rango o las opciones», como dice § 3: solo `{ key }` (`routes.ts:68`). La
     aplicación no lo necesita, porque tiene el contrato, pero el diseño dice otra cosa.
2. **Las tablas de archivos de § 5 no son las de hoy.** **Mejora** (documentación).
   - Servidor: faltan `context.ts`, `recalculator.ts` y `settings.ts`.
   - Aplicación: `preview.ts` no existe (es `logic.ts`). Faltan `saving.ts`, `schemas.ts`, `settings.ts` y
     `AdministrationSlot.tsx`.
   - `api.ts` dice «las tres llamadas» y tiene cuatro (la de quién tiene el permiso).
3. **El aviso de lo guardado no es un valor con nombre espejado** (§ 7). **Mejora.** Ver 1.5.
4. **Guardar no es la sentencia del diseño.** **Mejora** (una línea).
   - § 2 describe una sola `insert … on conflict (key) do update … where settings.version = …`.
   - El código (`data.ts:21-41`) elige entre `insert … do nothing` y `update … where version` según la
     versión.
   - Hace lo mismo, y cubre los dos primeros cambios a la vez (`settings.test.ts:113`). Conviene que el
     diseño diga lo que hay.
5. **La prueba que cuenta las consultas existe y pasa, pero es floja.** **Mejora.**
   - Dónde: `settings.test.ts:161-169`.
   - Qué dice el diseño (§ 9): ver, 0 consultas; guardar, una sentencia más abrir y confirmar (3); en un
     `409 changed`, una más; al arrancar, 1. «Las pruebas cuentan las consultas de cada ruta».
   - Qué hace la prueba:
     - Mira `toBe(0)` en el `GET`, bien.
     - Para guardar, `toBeLessThanOrEqual(6)`: pasaría con el doble de lo previsto.
     - No cuenta el `409 changed`, que hace **dos** consultas (`data.changedBy` y `users.nameOf`), no
       una.
     - Tampoco cuenta el `GET /rounding` ni el arranque.
6. **Las teclas que faltan.** **Mejora.**
   - El diseño § 7 y la maqueta ponen D para «Deshacer» (y Ctrl Z fuera de una caja de texto, en la
     maqueta). La tostada (`Toast.tsx`) no tiene `data-key`, así que no hay atajo para deshacer.
7. **La confirmación no se traba mientras guarda.** **Mejora.**
   - Dónde: `Confirm.tsx:42`.
   - Qué dicen los documentos: la maqueta (`changes.md`, «La espera del recálculo») y 00 · R7: al
     confirmar, los botones se traban, y a los 300 ms aparece la marca de espera. La barra con el avance
     queda para 07 (§ 12, 2).
   - Qué hace el código: «Cambiar N precios» se puede tocar dos veces. El segundo `POST` lleva la versión
     vieja y vuelve con «Lo cambió <usted mismo> recién».
8. **Lo de las revisiones que sí se hizo**:
   - la clave buscada en un `Map`;
   - el cuerpo estricto;
   - lo guardado se valida al arrancar y, si no vale, no arranca;
   - la memoria se pone al día en el mismo pedido y solo con una versión mayor;
   - la cookie dura la opción más larga, calculada del contrato;
   - `BUSINESS_TIME_ZONE` se valida armando un formato;
   - `device-link` termina el vínculo vencido en cada contacto y escribe lo espejado antes de limpiar;
   - `sign-in` lee los dos tiempos en todos los lugares que listó la revisión (`store.ts`, `listing.ts`,
     `lost.ts`, `counts.ts`, `cookie.ts`).

   Todo está y tiene su prueba.

## 5. Seguridad (§ 8 del diseño)

Cada punto está hecho como dice:

- `403` en cada `POST`, también en el que deshace, con `permission.denied` (`settings.test.ts:45`).
- La clave en un `Map` (`settings.test.ts:99-104`, con `__proto__` y `constructor`).
- El cuerpo estricto, sin campos de más.
- El valor validado con el contrato antes de la base.
- Lo guardado validado al arrancar.
- El límite de 30 por minuto por sesión (`settings.test.ts:154`).
- El nombre de quien cambió, solo en el `409` y después del permiso.
- `recalc-failed` queda en el registro (`console.error`).
- `BUSINESS_TIME_ZONE` sin valor por omisión.

Dos mejoras:

1. **Cualquier error al guardar se dice como «el recálculo falló».** **Mejora.**
   - Dónde: `routes.ts:73-77`.
   - El `catch` convierte todo error de la transacción en `503 recalc-failed`, también en los ajustes que
     no recalculan nada (una caída de la base al guardar los días del vínculo).
   - La pantalla, sin la confirmación abierta, dice «No se pudo guardar», así que no se ve mal. Pero el
     registro y el código de error mienten. Conviene atajarlo solo alrededor de `recalculator.apply`.
2. **El recalculador se consulta con el valor antes de validarlo.** **Mejora** (pesa con 07).
   - Dónde: `routes.ts:66`.
   - `changesWith(Number(raw))` corre antes de `checkChange`, así que un `300`, un texto (`NaN`) o un
     arreglo llegan al recalculador.
   - Hoy no hace nada. Con el catálogo, es una consulta pesada sobre todos los precios por un valor que se
     va a rechazar.
   - Además, el número que queda en Quién hizo qué es el contado antes (`prices`), no el que devuelve
     `apply` (`:104`, que se descarta). Con 07 pueden ser distintos si algo cambió en el medio. E19 dice
     «cuántos precios cambiaron».

## 6. Reglas inventadas

1. **Guardar el mismo valor que ya tiene devuelve 200, sin mirar la versión y sin anotar nada.** **Mejora**
   (informativa).
   - Dónde: `rules.ts:27`, probado en `settings.test.ts:106`.
   - Ninguna regla lo pide. Es razonable: la pantalla tampoco lo manda, y no ensucia Quién hizo qué. Pero
     no está en el diseño: anotarlo en § 3.
2. **«Lo cambió otra persona recién» cuando no se sabe el nombre.** **Mejora** (informativa).
   - Dónde: `texts.ts:73-74`, `routes.ts:114`.
   - R2.3 dice «Lo cambió <persona> recién». Se usa cuando quien cambió ya no está o cuando la versión no
     es la de arranque y no hay fila. Bien resuelto, pero no está en el diseño.
3. **Las cinco fichas de días (7, 15, 30, 90, 365) y «Más corto / Más largo».** Salen de la maqueta
   (`preview.js:85`, `:107`): no son inventadas.

## 7. Simpleza y repetición

1. **Los valores de arranque, escritos de nuevo en la pantalla.** **Mejora.**
   - Dónde: `Rounding.tsx:73` (`initial={1000}`) y `Session.tsx:53` (`initial={idle ? 60 : 8}`).
   - Ya están en `settingList.*.initial` del contrato: si cambian, la marca «de arranque» queda en otro
     lado.
2. **Textos fuera de `texts.ts`.** **Mejora.**
   - `Options.tsx:49` escribe «de arranque», que ya está en `texts.rounding.initial` y nadie lo usa.
   - `Rounding.tsx:75` escribe «Sin».
   - `texts.back` («Más») está y no se usa (ver 9.1).
3. **Cómo se escribe cada valor, dos veces.** **Mejora.**
   - `src/shared/audit-log/administration.ts:4-17` (`shown`, `pesos`, `thousands`) y
     `src/app/modules/administration/logic.ts:8-18` (`shown`, `pesos`, `thousands`) escriben los mismos
     cinco ajustes con unidades parecidas («30 min», «8 h», «30 días», «$ 1.000»), cada uno a su manera
     (con «Sin redondeo» o «sin redondeo», y los márgenes con coma o con «·»).
   - Es la misma razón (escribir el valor de un ajuste para quien lo lee): podría estar una vez en
     `src/shared/`.
4. **`texts.invalid[key as 'pairingDays']`** (`saving.ts:36`). **Mejora.** El `as` esconde que para tres de
   las cinco claves el texto es `undefined`. Hoy no se llega, porque esas son opciones cerradas, pero el
   tipo no lo cuida.
5. **`lastSeen` como `WeakMap` con la persona de clave** (`useAdministration.ts:28`, `:82`, `:86`).
   **Mejora.**
   - La persona se reemplaza cada vez que `/api/start` la trae de nuevo (por ejemplo, al cambiar sus
     permisos). Con eso, lo último visto se pierde aunque sea la misma persona.
   - Con `who` sin definir, `WeakMap.set(undefined)` lanza.
   - Una variable con el `userId` sería más simple.
6. **El aviso «Sin conexión» cuando el servidor contestó un error.** **Mejora.** `Administration.tsx:103`
   lo muestra con `!view.fresh`, y eso también pasa con conexión y un `500` después de haberlos visto.

## 8. Documentación que quedó atrás

1. Lo de 4.1, 4.2, 4.4 y 6.1: los códigos de error, los archivos, la sentencia de guardar y «el mismo
   valor no cambia nada». **Mejora.**
2. **Diseño § 12, 5** sigue diciendo «quien puede editar el `.env` ya puede todo», y la zona ya no está en
   el `.env`. **Mejora.**
3. **Que la marca «Sin conexión» se muestre también con un error del servidor** (7.6) y que lo último visto
   sea por persona y por sesión de la aplicación: § 7 dice lo segundo, no lo primero. **Mejora.**
4. **El roadmap** dice «a: En curso: paso 7». Es correcto.

## 9. Pantallas

Comparé las capturas de referencia con las de la maqueta (`screenshot.png`, `screenshot-phone.png`,
`screenshot-confirm.png`, `screenshot-margins-error.png`). Los demás paneles, solo leyendo el código.

1. **Falta volver a Más.** **Mejora.**
   - En la computadora, la maqueta tiene «Más › Administración» arriba del título.
   - En el celular, tiene «‹ Más».
   - El código no tiene ninguno de los dos (`Administration.tsx:125-133`; `texts.back` sin usar).
2. **En el celular, el título queda debajo del cartel «Ambiente de prueba».** **Mejora.**
   `administration-phone.png`: «Administración» arranca más arriba que en Configuración
   (`settings-phone.png`) y el cartel lo tapa.
3. **La lista de la computadora.** **Mejora.**
   - La maqueta agrupa los ajustes en tarjetas blancas, con el ícono en un cuadrito. El código los pone
     sueltos sobre el fondo, con el ícono sin cuadrito.
   - Los márgenes dicen «300 a 25 %» y en la maqueta, «5 teclas».
4. **Las tiras del celular.** **Mejora.**
   - La maqueta usa nombres cortos: «Márgenes», «Hora», «Sesión 60 min». El código usa los largos
     («Márgenes rápidos», «Zona horaria») y separa «Sin uso» y «Tope de la sesión».
   - La regla de textos cortos en el celular (00 · R1.5) pide la versión corta.
5. **El panel de los márgenes no muestra «Vende a $ X»** ni «Con qué se calcula». **Mejora.**
   - Es lo que la maqueta muestra debajo de cada tecla y abajo del panel.
   - La revisión del diseño (4.2) proponía armarlo con `src/shared/pricing/`. Sin catálogo puede ir con el
     ejemplo de la maqueta, como hace el redondeo.
6. **La confirmación del redondeo.** **Mejora.**
   - La maqueta muestra el número grande en naranja y tres ejemplos con el precio de antes tachado y el
     nuevo. El código muestra solo «1.650 de 3.486 precios cambian», sin ejemplos.
   - No tiene la espera de 300 ms (ver 4.7).
7. **El aviso de abajo.** **Mejora.**
   - La maqueta dice lo que cambió con el antes y el después («Márgenes rápidos: 25 → 400 % · tecla 1»),
     tiene la barra que se vacía en 5 s y la tecla D.
   - El código dice solo el valor nuevo («Márgenes rápidos: 400 · 300 · 200 · 100 · 50 %»), sin barra y
     sin tecla.
8. **«Sin conexión» sin la hora de lo último visto.** **Mejora.** La maqueta dice «es lo último que se vio,
   hoy 10:41» (en el celular, «Sin conexión · 10:41»); el código no dice cuándo.
9. **El signo $ y la vidriera.** **Mejora** (menor).
   - La maqueta pone el «$» chico y arriba (`$500`), y en el celular la vidriera en renglones con la foto.
   - El código pone «$ 500» entero, y en el celular la vidriera en dos columnas. Las fotos esperan al
     catálogo.
10. **Faltan capturas.** **Mejora.** El diseño § 10 pide capturas «con el panel de cada ajuste, la
    confirmación y sin permiso». Hay tres: la pantalla en la computadora, en el celular y la
    confirmación. Faltan los paneles de márgenes, sesión, vínculo y zona, y la pantalla sin permiso.

## 10. Lo que se podría extraer a una librería

El módulo agregó y cambió cosas no funcionales.

1. **Los ajustes con versión en memoria.**
   - Dónde: `src/server/modules/administration/memory.ts`, `data.ts` y `routes.ts`, y la parte genérica
     de `src/shared/contracts/administration.ts` (`settingKeyOf`, `settingValue`, `saveSettingBody`,
     `SettingState`).
   - Otro proyecto con «valores para todos que fija un administrador, sin pisarse, que se leen sin
     consultar» lo usaría tal cual. Lo resuelve todo:
     - la carga validada al arrancar;
     - la memoria que solo acepta una versión mayor;
     - el `409` con el valor de ahora;
     - el `Map` contra `__proto__`.
   - Qué lo ata a Ferrebress:
     - la lista de ajustes (`settingList`, con redondeo y márgenes) está en el mismo archivo que las
       funciones genéricas;
     - el redondeo y el recalculador están cableados en `routes.ts` (`key === 'roundingStep'`);
     - el permiso `settings.change` está escrito en la ruta.
   - Grupo: base del servidor (o uno nuevo, «ajustes compartidos»).
   - Cambio chico: separar en el contrato un `defineSettings(list)` genérico de la lista de Ferrebress, y
     que la confirmación de «cambia muchas cosas» sea un gancho por clave en lugar de un `if` sobre
     `roundingStep`.

2. **La zona horaria fija como función.**
   - Dónde: `src/shared/time/business.ts` (`setBusinessTimeZone` con `final`, `businessFormat` con caché
     por forma); la validación con `Intl.DateTimeFormat` en `src/server/platform/config.ts:13-20`; la zona
     guardada en `localStorage` en `src/app/App.tsx:59-81`.
   - Le serviría a cualquier sistema de un negocio con un solo huso horario.
   - Qué lo ata: casi nada. «Negocio» está en el nombre, y la validación vive en el esquema de
     configuración de Ferrebress (Google, primer Administrador). La parte de la aplicación está mezclada
     con el arranque de `App.tsx`.
   - Grupo: base del servidor y base de la aplicación (la parte compartida, en las dos).
   - Cambio chico: sacar `isTimeZone` a `platform/` como validador suelto, y mover `applyZone` a
     `platform/time.ts`.

3. **Los tiempos de la sesión que se leen en cada pedido, y la cookie con el tope más largo.**
   - Dónde: `src/server/modules/sign-in/sessions/store.ts` (`Limits` como función), `sign-in/index.ts`
     (`sessionTimes`) y `sign-in/settings.ts` (`cookieMaxMs` de `longestSessionHours`).
   - Le sirve a quien tenga sesiones con cookie y tiempos configurables.
   - Qué lo ata: `longestSessionHours` sale del contrato de Administración.
   - Grupo: identidad.
   - Cambio chico: que `sign-in` reciba el tope de la cookie como dato, igual que recibe `sessionTimes`, y
     no lo importe del contrato de 06.

4. **El vencimiento del vínculo en cada contacto.**
   - Dónde: `src/server/modules/device-link/expiry.ts`.
   - Sirve a la conexión entre dispositivos de cualquier proyecto que use la de 03.
   - Qué lo ata: nada nuevo; los días llegan inyectados.
   - Grupo: el de la conexión (base del servidor).
   - Cambio chico: ninguno.

5. **La tostada con un tiempo propio.**
   - Dónde: `src/app/ui/toast/Toast.tsx` (`action.ms`).
   - Es genérico.
   - Qué lo ata: el comentario nombra Administración.
   - Grupo: piezas visuales.
   - Cambio chico: sumarle `data-key` a la acción (ver 4.6), que también serviría a otro proyecto.

6. **Las opciones con ← y → y «mirar antes de elegir».**
   - Dónde: `src/app/modules/administration/screens/Administration/Options.tsx`.
   - Un grupo de botones de una sola elección, con el efecto de cada opción al pasar el mouse, le sirve a
     cualquier pantalla de ajustes.
   - Qué lo ata:
     - las clases `admin-*`;
     - el texto «de arranque» escrito adentro;
     - vive dentro del módulo.
   - Grupo: piezas visuales.
   - Cambio chico: pasar el texto por propiedad, usar clases propias y moverlo a `ui/` cuando lo pida una
     segunda pantalla (el diseño dijo «no se suma una pieza nueva a `ui/`», con razón, hasta entonces).

7. **Los íconos nuevos.**
   - Dónde: `src/app/ui/icon/administration-shapes.tsx`.
   - Son genéricos (Lucide), ya en `ui/`.
   - Qué los ata: el nombre del archivo.
   - Grupo: piezas visuales.
   - Cambio chico: ninguno.

**Hoy no conviene extraer nada:** cada pieza tiene un solo usuario, y la más reutilizable (los ajustes con
versión) todavía tiene la lista del negocio en el mismo archivo. Separar `defineSettings` de la lista es
el único cambio que vale la pena dejar hecho antes de pensarlo.
