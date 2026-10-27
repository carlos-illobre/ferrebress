# Qué necesita internet

Qué funciona sin conexión y qué no, en toda la aplicación. **Cada módulo actualiza esta tabla en
su paso 1** (decisión 42).

«Sin conexión» vale solo en un dispositivo que tiene habilitado trabajar sin conexión en su
Configuración (decisión 14). Un dispositivo que no lo habilitó necesita internet para todo: sin
conexión, la pantalla se pone gris y solo deja salir.

| Módulo | Qué | Sin conexión | Por qué |
|---|---|---|---|
| 00 · La aplicación | El marco, el menú y la luz de conexión | Sí | Hacen falta para lo que sí anda sin conexión |
| 00 · La aplicación | Ver lo pendiente por enviar | Sí | Es lo que está en el dispositivo |
| 00 · La aplicación | Buscar y aplicar una versión nueva | No | La versión nueva está en el servidor |
| 00 · La aplicación | El manual | No | No ocupa lugar en el dispositivo |
| 00 · La aplicación | Avisar que algo salió mal | Se guarda y sale al volver la conexión | No se pierde el aviso |
| 01 · Entrar | Entrar (Google, huella, con el celular) | No | Lo verifica el servidor |
| 01 · Entrar | Seguir trabajando con la sesión abierta | Sí | La sesión no vence en el dispositivo mientras se lo use |
| 01 · Entrar | Salir | Sí | El servidor cierra la sesión al volver la conexión |
