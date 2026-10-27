# ADR-006: Entrar sin contraseñas

**Estado:** aceptado

## Decisión

- **Se entra con Google**, en la computadora y en el celular, con una cuenta autorizada y activa.
- **El celular también entra con la huella** (passkey), si está vinculado a la cuenta. Se vincula
  después de entrar con Google en él; un celular, una cuenta. La computadora no registra huella
  propia.
- **La computadora puede entrar con el celular:**
  - Si el navegador puede usar la entrada con un celular cercano (passkeys entre dispositivos, por
    Bluetooth), se usa esa: la computadora muestra el QR del navegador y el celular pone la
    huella. Es el estándar, no se puede usar desde una página falsa y no hay que programarlo. Se
    detecta con `PublicKeyCredential.getClientCapabilities()`.
  - Si no, un QR propio: el servidor genera el código y se lo manda a la computadora por un canal
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

## Dónde se entra con qué

Siempre con una cuenta autorizada:

| Dónde | Con Google | Con la huella |
|---|---|---|
| Celular | Sí | Sí, si el celular está vinculado a la cuenta |
| Computadora | Sí | Sí, con la del celular: lee el QR y pone la huella en el celular (o la entrada con un celular cercano del navegador, si hay Bluetooth) |

El celular se vincula a la cuenta para entrar con la huella en los minutos siguientes a entrar con
Google en él.
