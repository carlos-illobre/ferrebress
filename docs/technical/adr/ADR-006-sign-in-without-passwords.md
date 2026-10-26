# ADR-006: Entrar sin contraseñas

**Estado:** aceptado (2026-10-26, decisión 11)

## Decisión

- **La computadora entra con Google**, con una cuenta autorizada.
- **El celular entra con la huella** (passkey). Se habilita desde una computadora con la sesión
  abierta: la computadora muestra un QR, el celular lo lee, la persona pone la huella y queda
  registrada la passkey. El celular no entra con Google.
- **La computadora puede entrar con el celular:**
  - Si el navegador puede usar la entrada con un celular cercano (passkeys entre dispositivos, por
    Bluetooth), se usa esa: la computadora muestra el QR del navegador y el celular pone la
    huella. Es el estándar, no se puede usar desde una página falsa y no hay que programarlo. Se
    detecta con `PublicKeyCredential.getClientCapabilities()`.
  - Si no, un QR propio que vence a los 60 segundos y sirve una sola vez. El celular muestra qué
    computadora pide la entrada y pide la huella.
- **Sesiones opacas** guardadas en la base y en la memoria del servidor: comprobar una no consulta
  la base, y cerrarla a distancia se nota al instante (decisión 28).

## Riesgos considerados

- **QR copiado en una página falsa:** el QR propio se mitiga con los 60 segundos, el uso único,
  el nombre de la computadora en el celular y la huella. La entrada del navegador no tiene este
  riesgo.
- **Celular perdido:** la sesión y la passkey se cierran a distancia.

## Opciones descartadas

- **Contraseñas:** Carlos no las quiere.
- **Google en el celular:** más pasos; la huella alcanza.
