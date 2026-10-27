# 01 · Entrar: reglas

Entrar y salir de la aplicación, y el marco vacío al que se llega. Las personas, los roles y las
sesiones de otros dispositivos están en el capítulo 02. Las reglas generales (el marco, el teclado,
la conexión, los formatos) están en el [capítulo 00](../00-app/rules.md).

**Estado:** esperando la aprobación de Carlos.

## 1. Quién puede entrar

- **R1.1** Solo entran cuentas de Google autorizadas por un Administrador. Sin contraseñas.
- **R1.2** El correo del primer Administrador de cada ambiente sale de la configuración del
  ambiente. Esa cuenta entra como Administrador la primera vez, sin que nadie la autorice.
- **R1.3** Una cuenta que no está autorizada, o que fue dada de baja, ve: «Esta cuenta
  (nombre@gmail.com) no está autorizada. Pedile a un Administrador que agregue tu correo.» El
  mismo mensaje en los dos casos.
- **R1.4** Los correos se comparan sin distinguir mayúsculas.

## 2. Cómo se entra

| Dónde | Con Google | Con la huella |
|---|---|---|
| Celular | Sí | Sí, si el celular está vinculado a la cuenta |
| Computadora | Sí | Sí, con la del celular |

- **R2.1 Google** en la computadora y en el celular. Después de salir, Google pide elegir la
  cuenta: no entra solo con la última.
- **R2.2 La huella en el celular.** La primera vez que alguien entra con Google en un celular, la
  aplicación le ofrece, una sola vez, «¿Entrar con la huella la próxima vez?». Si dice que sí, el
  celular queda vinculado a esa cuenta. Si dice que no, puede vincularlo después desde
  Configuración (capítulo 04).
- **R2.3** Un celular se vincula a una sola cuenta. Para vincularlo a otra, primero se quita el
  vínculo anterior.
- **R2.4** La computadora no tiene huella propia: su huella es siempre la del celular.
- **R2.5 Entrar a la computadora con el celular.** La entrada de la computadora muestra siempre un
  código QR. Con el celular se lo lee y se pone la huella en el celular, sin tocar nada más en la
  computadora y sin paso de confirmar:
  - El código se renueva cada 60 segundos y sirve una sola vez.
  - Antes de pedir la huella, el celular muestra qué computadora pide entrar (por ejemplo, «Chrome
    en Windows»).
  - La computadora se entera en el momento, sin preguntar a ritmo fijo: espera por un canal
    abierto solo mientras el código está en pantalla (capítulo 00, R4.3).
- **R2.6** Si el navegador de la computadora puede usar un celular cercano para entrar (passkeys
  entre dispositivos, por Bluetooth), esa forma reemplaza al código QR propio: la computadora
  muestra la del navegador. Se detecta solo.
- **R2.7** Si el celular no tiene la sesión abierta y lee el código de la computadora, primero
  entra el celular (con Google o con la huella) y con eso entran los dos.
- **R2.8** Sin conexión no se puede entrar. Los botones se apagan y la entrada dice «Para entrar
  hace falta internet».
- **R2.9** Como mucho 10 intentos por minuto con Google y 20 con la huella, por dispositivo. Pasado
  eso, la entrada dice cuánto falta para volver a intentar.

## 3. La sesión (ADR-015)

- **R3.1** Al entrar empieza una sesión, que termina cuando:
  - se toca «Salir»;
  - pasan **60 minutos sin pedidos al servidor**; cada pedido vuelve a contar desde cero;
  - pasan **8 horas desde que se entró**, aunque se esté usando;
  - alguien la cierra a distancia o la persona es dada de baja (capítulo 02).
- **R3.2** Los dos tiempos los fija un Administrador desde Administración (capítulo 06); hasta que
  exista, valen 60 minutos y 8 horas. Los cuenta el reloj del servidor.
- **R3.3** Solo cuentan como uso los pedidos al servidor. Mirar una pantalla sin pedir nada no
  cuenta.
- **R3.4** Cuando la sesión termina, la aplicación muestra la entrada encima de lo que había, sin
  borrarlo. Si vuelve a entrar la misma persona, sigue donde estaba. Si entra otra, lo que la
  anterior tenía a medio hacer y sin cobrar se descarta, y lo que tenía sin enviar se manda igual
  (R4).
- **R3.5** Si la sesión la cerró otro dispositivo, la entrada dice «Tu sesión se cerró desde otro
  dispositivo».
- **R3.6** Sin conexión, la sesión no vence en el dispositivo mientras se lo use: la inactividad la
  mide el cronómetro del dispositivo, que solo decide cuándo mostrar la entrada.

## 4. Lo que quedó sin enviar

- **R4.1** Lo que se hizo sin conexión y no se envió queda guardado en el dispositivo, también al
  salir y al vencer la sesión.
- **R4.2** Se manda apenas entra cualquier persona en ese dispositivo, siempre a nombre de quien lo
  hizo.
- **R4.3** El servidor lo acepta a nombre de esa persona solo si viene con la prueba de su pase y
  su sesión no fue cerrada a mano. Que el pase haya vencido no importa. Si la persona fue dada de
  baja, va a la revisión de un Administrador (decisión 23).

## 5. Salir

- **R5.1** En la computadora, «Salir» está en la tarjeta de la persona, al pie del menú; en el
  celular, en Más.
- **R5.2** Se puede salir con o sin conexión. Sin conexión, el dispositivo deja la sesión al
  instante y el servidor la cierra cuando vuelve la conexión.
- **R5.3** Salir lleva a la entrada.

## 6. A dónde se llega

- **R6.1** Al entrar se llega al marco (capítulo 00): el menú, la luz de conexión y la tarjeta de
  la persona con su nombre, su rol y «Salir».
- **R6.2** Mientras no exista ningún otro módulo, el marco está vacío: en el ambiente de pruebas
  todas las opciones del menú dicen «Pronto».

## 7. La entrada

- **R7.1** Se ve como la de la primera versión (decisión 6), en una sola pantalla que se adapta al
  ancho. En el celular también está «Entrar con Google».
- **R7.2** «Ver el manual» aparece recién cuando exista el manual.

## Escenarios

### Quién puede entrar

- **E01** **Dado** el correo del primer Administrador en la configuración del ambiente, **cuando** esa
  cuenta entra con Google por primera vez, **entonces** entra como Administrador.
- **E02** **Dado** una cuenta no autorizada, **cuando** entra con Google, **entonces** ve «Esta cuenta
  (su correo) no está autorizada. Pedile a un Administrador que agregue tu correo.» y no entra.
- **E03** **Dado** una cuenta dada de baja, **cuando** entra con Google o con la huella, **entonces** ve
  el mismo mensaje que una no autorizada.
- **E04** **Dado** el correo autorizado «Juan.Perez@gmail.com», **cuando** entra
  «juan.perez@gmail.com», **entonces** entra.

### Google y la huella

- **E05** **Dado** una cuenta autorizada, **cuando** entra con Google en la computadora, **entonces**
  llega al marco.
- **E06** **Dado** una cuenta autorizada en un celular sin huella vinculada, **cuando** entra con Google
  por primera vez, **entonces** llega al marco y se le ofrece una sola vez entrar con la huella la
  próxima vez.
- **E07** **Dado** que aceptó, **cuando** pone la huella, **entonces** el celular queda vinculado a esa
  cuenta, y la próxima vez entra con la huella sin pasar por Google.
- **E08** **Dado** que no aceptó, **cuando** vuelve a entrar con Google en ese celular, **entonces** no
  se le vuelve a ofrecer.
- **E09** **Dado** un celular vinculado a una cuenta, **cuando** otra cuenta entra con Google y quiere
  vincularlo, **entonces** no puede hasta que se quite el vínculo anterior.
- **E10** **Dado** la computadora, **cuando** se entra, **entonces** nunca se ofrece registrar una
  huella en ella.
- **E11** **Dado** que se tocó «Salir», **cuando** se vuelve a entrar con Google, **entonces** Google
  pide elegir la cuenta.

### Entrar a la computadora con el celular

- **E12** **Dado** la entrada de la computadora, **cuando** se la mira, **entonces** muestra un código
  QR que cambia cada 60 segundos.
- **E13** **Dado** un celular con sesión, **cuando** lee el código, **entonces** muestra qué computadora
  pide entrar y pide la huella; puesta la huella, la computadora entra sola, sin tocar nada en ella.
- **E14** **Dado** un código ya usado, **cuando** otro celular lo lee, **entonces** no sirve.
- **E15** **Dado** un código de hace más de 60 segundos, **cuando** se lo lee, **entonces** no sirve.
- **E16** **Dado** un celular sin sesión, **cuando** lee el código, **entonces** primero entra el celular
  con Google o con la huella, y con eso entran los dos.
- **E17** **Dado** una computadora cuyo navegador puede usar un celular cercano por Bluetooth,
  **cuando** se abre la entrada, **entonces** muestra esa forma en lugar del código QR propio.
- **E18** **Dado** el código QR en pantalla, **cuando** no pasa nada, **entonces** la computadora no
  hace pedidos al servidor a ritmo fijo.

### Sin conexión e intentos

- **E19** **Dado** que no hay conexión, **cuando** se abre la entrada, **entonces** los botones están
  apagados y dice «Para entrar hace falta internet».
- **E20** **Dado** 10 intentos con Google en un minuto desde un dispositivo, **cuando** se intenta otra
  vez, **entonces** no se intenta y la entrada dice cuánto falta para volver a probar.

### La sesión

- **E21** **Dado** una sesión, **cuando** pasan 59 minutos sin pedidos y se hace uno, **entonces** sigue
  abierta y vuelve a contar desde cero.
- **E22** **Dado** una sesión, **cuando** pasan 60 minutos sin pedidos, **entonces** el próximo pedido
  muestra la entrada encima de lo que había.
- **E23** **Dado** una sesión que se usa sin parar, **cuando** pasan 8 horas desde que se entró,
  **entonces** el próximo pedido muestra la entrada, aunque haya habido pedidos hace un minuto.
- **E24** **Dado** pedidos automáticos cada pocos minutos, **cuando** pasan 8 horas desde que se entró,
  **entonces** la sesión vence igual.
- **E25** **Dado** la sesión vencida con una venta a medio armar, **cuando** vuelve a entrar la misma
  persona, **entonces** sigue donde estaba, con la venta.
- **E26** **Dado** la sesión vencida con una venta a medio armar, **cuando** entra otra persona,
  **entonces** la venta a medio armar se descarta.
- **E27** **Dado** una sesión cerrada desde otro dispositivo, **cuando** el dispositivo hace su próximo
  pedido, **entonces** muestra la entrada con «Tu sesión se cerró desde otro dispositivo».
- **E28** **Dado** un dispositivo sin conexión que se sigue usando, **cuando** pasan más de 60 minutos
  desde el último pedido al servidor, **entonces** no se muestra la entrada mientras se lo use.

### Lo que quedó sin enviar

- **E29** **Dado** cosas sin enviar de una persona, **cuando** sale, **entonces** quedan guardadas en el
  dispositivo.
- **E30** **Dado** cosas sin enviar de una persona, **cuando** entra otra persona en ese dispositivo con
  conexión, **entonces** se mandan, a nombre de quien las hizo.
- **E31** **Dado** cosas sin enviar cuyo pase ya venció, **cuando** se mandan, **entonces** el servidor
  las acepta a nombre de quien las hizo.
- **E32** **Dado** cosas sin enviar que dicen ser de una persona pero no traen la prueba de su pase,
  **cuando** se mandan, **entonces** el servidor no las acepta.
- **E33** **Dado** cosas sin enviar de una persona dada de baja, **cuando** se mandan, **entonces** van
  a la revisión de un Administrador.

### Salir y a dónde se llega

- **E34** **Dado** la computadora, **cuando** se toca la tarjeta de la persona, **entonces** está
  «Salir»; en el celular, está en Más.
- **E35** **Dado** una sesión, **cuando** se toca «Salir», **entonces** se vuelve a la entrada y la
  sesión deja de valer en el servidor.
- **E36** **Dado** que no hay conexión, **cuando** se toca «Salir», **entonces** se vuelve a la entrada
  al instante, y el servidor cierra la sesión cuando vuelve la conexión.
- **E37** **Dado** que se entró en el ambiente de pruebas, **cuando** se llega al marco, **entonces**
  se ven el menú con todo en «Pronto», la luz de conexión y la tarjeta con el nombre, el rol y
  «Salir».

### La entrada

- **E38** **Dado** la entrada, **cuando** se abre en la computadora y en el celular, **entonces** se ve
  como la de la primera versión, con «Entrar con Google» en los dos.
- **E39** **Dado** que todavía no existe el manual, **cuando** se mira la entrada, **entonces** no hay
  «Ver el manual».

### Seguridad

- **E40** **Dado** el pase de una sesión, **cuando** se lo busca en la base, **entonces** solo está su
  huella (hash), nunca el pase.
- **E41** **Dado** la página de la aplicación, **cuando** su código intenta leer el pase, **entonces**
  no puede: está en una cookie protegida.
- **E42** **Dado** un pedido que llega desde otro sitio con la cookie, **cuando** el servidor lo
  recibe, **entonces** lo rechaza.
- **E43** **Dado** un pedido de huella, **cuando** pasan 5 minutos sin usarlo o se usó una vez,
  **entonces** ya no sirve.
- **E44** **Dado** cualquier entrada, salida o intento rechazado, **cuando** pasa, **entonces** queda
  anotado con quién, cuándo y desde qué dispositivo, para la auditoría (capítulo 05).
