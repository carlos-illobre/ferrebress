# ADR-006: Entrar sin contraseñas

**Estado:** aceptado

## Decisión

- **Se entra con Google**, en la computadora y en el celular, con una cuenta autorizada y activa.
- **El celular también entra con la huella** (passkey), si está vinculado a la cuenta. Se vincula
  después de entrar con Google en él; un celular, una cuenta. La computadora no registra huella
  propia.
- **La computadora puede entrar con el celular, solo con el QR de Ferrebress:**
  - No se usa la entrada entre dispositivos del navegador (passkeys por Bluetooth), aunque es el
    estándar y no se puede usar desde una página falsa: obliga a vincular el celular con el
    navegador o el sistema de la computadora, que queda sabiendo de él. Con el QR propio el celular
    habla solo con Ferrebress, y la computadora no guarda nada del celular.
  - El QR propio: el servidor genera el código y se lo manda a la computadora por un canal
    abierto mientras la entrada está a la vista; cambia cada 60 segundos y sirve una sola vez.
    Leerlo lo reserva; el celular solo aprueba si está en la misma red que la computadora, muestra qué computadora pide la entrada y
    pide la huella. El permiso solo lo puede usar la computadora que abrió el canal.
- **Sesiones opacas** guardadas en la base y en la memoria del servidor: comprobar una no consulta
  la base, y cerrarla a distancia se nota al instante. El detalle, y por qué no JWT,
  está en el ADR-015.

## Riesgos considerados

- **QR copiado en una página falsa:** el QR propio se mitiga con los 60 segundos, el uso único,
  la reserva al leerlo, que el celular y la computadora tengan que estar en la misma red, el nombre de la computadora en el celular y la huella. La entrada del navegador no tiene este
  riesgo.
- **Celular perdido:** la sesión y la passkey se cierran a distancia.
- **Passkeys que se copian:** las de Google se sincronizan con los otros dispositivos de la misma
  cuenta de Google, también con Chrome en una computadora. El servidor no puede saber en qué
  aparato se usó: «un celular, una cuenta» y «la computadora no tiene huella propia» se cumplen en
  la aplicación, no como garantía.

## Opciones descartadas

- **Contraseñas:** Carlos no las quiere.
- **Un framework de autenticación (better-auth):** la entrada se arma con piezas chicas, `jose`
  para el pase de Google y `@simplewebauthn/server` para la huella, en lugar de un framework.
  better-auth resolvería lo genérico (Google, la huella, la tabla y la cookie de la sesión, los
  límites de pedidos), pero:
  - Lo propio de Ferrebress no viene en él y se escribiría igual, como plugins suyos: el QR
    propio, entrar sin conexión, la llave de prueba de cada sesión, «un celular, una cuenta» y
    cortar un celular perdido.
  - Sus sesiones no cumplen el ADR-015: guarda el pase tal cual en la base, no su huella; para no
    consultar la base en cada pedido guarda la sesión en la cookie, y entonces cerrarla ya no es
    instantáneo, o necesita un almacenamiento aparte; y no trae el tope desde que se entró junto
    con el vencimiento por falta de uso.
  - Trae sus propias tablas de personas, sesiones y cuentas, y sus propias migraciones, que chocan
    con las de `users` y `sign-in`.
  - Es una dependencia grande en producción, con más superficie de ataque.
  - Sus rutas y sus respuestas reemplazan a los contratos de `src/shared/contracts` y a la
    auditoría de cada ruta.

  Convendría para cuentas de clientes, si la venta online (T101) las necesita: registrarse,
  recuperar el acceso, entrar con otros proveedores. Esa entrada iría aparte de la del personal.

## Dónde se entra con qué

Siempre con una cuenta autorizada:

| Dónde | Con Google | Con la huella |
|---|---|---|
| Celular | Sí | Sí, si el celular está vinculado a la cuenta |
| Computadora | Sí | Sí, con la del celular: lee el QR de Ferrebress y pone la huella en el celular |

El celular se vincula a la cuenta para entrar con la huella en los minutos siguientes a entrar con
Google en él.
