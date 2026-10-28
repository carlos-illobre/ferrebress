# 15 · Sin conexión: reglas

Atender sin internet. Se construye en dos etapas (roadmap, T109 y T110): **a. Entrar sin
conexión**, con la huella del celular, que es lo que está escrito acá, y **b. Trabajar sin
conexión** (guardar lo que se hace, mandarlo al volver la conexión y las anomalías), que se escribe
después de Vender y Compras. Entrar con conexión está en el [capítulo 01](../01-sign-in/rules.md).

**Estado:** etapa a, aprobada.

**La idea:** el sistema no frena, revisa. Sin conexión, el celular deja entrar a quien ya conoce;
cuando vuelve la conexión, el servidor confirma la entrada, y si no la puede confirmar, la sesión
se cierra (y, desde la etapa b, lo hecho va a la revisión de un Administrador).

## 1. La opción «Trabajar sin conexión»

- **R1.1** Cada persona la prende o la apaga en su celular, en Más. Cuando exista Configuración
  (capítulo 04), va ahí. Solo está en el celular: la computadora no tiene huella propia (01 · R2.4)
  y sin conexión no se entra.
- **R1.2** Solo la ve quien tiene el permiso «Trabajar sin conexión», que da y quita un
  Administrador (capítulo 02). Mientras no exista Personas, lo tienen los Administradores.
- **R1.3** Para prenderla hace falta conexión y la huella de esa persona vinculada en ese celular
  (01 · R2.2). Sin la huella vinculada, la opción no aparece, y sin conexión la huella de la entrada
  sigue apagada.
- **R1.4** Por ahora, prenderla solo deja entrar con la huella sin conexión (R2). Guardar lo que se
  hace sin conexión llega con la etapa b.
- **R1.5** El celular deja de poder entrar sin conexión cuando:
  - la persona apaga la opción;
  - se quita el vínculo de su huella;
  - en un contacto con el servidor, este dice que la cuenta fue dada de baja o que ya no tiene el
    permiso. Ahí la opción se apaga sola.

## 2. Entrar sin conexión

- **R2.1** Sin conexión, en un celular con la opción prendida y que cumple R2.2, la entrada deja
  prendida la huella; Google y «Escanear código QR» siguen apagados. Dice «Sin conexión: podés
  entrar con la huella hasta el martes 9:40» (el día y la hora en que se cumplen las 24 horas de
  R2.2).
- **R2.2** Entra solo la cuenta vinculada a ese celular (01 · R2.3), y solo si:
  - en el último contacto con el servidor, la cuenta estaba activa y con el permiso;
  - pasaron menos de **24 horas** desde ese contacto. Cuenta como contacto cualquier pedido con la
    sesión abierta que el servidor aceptó: después de «Salir», cuenta desde el último uso de la
    sesión;
  - la última sesión de ese celular no la cerró otro dispositivo (01 · R3.5): alguien la cerró a
    propósito, así que pide conexión. Después de «Salir» o de una sesión vencida, sí entra.
- **R2.3** La hora la pone el reloj del celular. Si marca una hora anterior a la más alta que vio
  la aplicación, se toma como vencido: atrasar el reloj no da más tiempo.
- **R2.4** Si no cumple R2.2 o R2.3, la entrada queda como sin la opción: todo apagado y «Para
  entrar hace falta internet» (01 · R2.8).
- **R2.5** Sin conexión, la huella la verifica el lector del celular, y la aplicación comprueba que
  sea la vinculada a esa persona. La firma queda guardada como prueba de que fue esa persona: la
  que vale es la verificación del servidor, al volver la conexión (R3). Los intentos fallidos los
  cuenta el lector del celular.
- **R2.6** Al entrar se llega directo al marco, sin la espera «Entrando» (la huella se verifica en
  el celular, al instante), igual que con conexión (01 · R6), con la luz en «Sin conexión». La aplicación abre aunque no haya internet desde que se prendió el celular.
- **R2.7** La sesión que se abrió sin conexión dura hasta que vuelve la conexión (R3) o hasta que se
  cumplen las 24 horas de R2.2. Ahí aparece la entrada encima de lo que había, sin borrarlo
  (01 · R3.4), con «Para entrar hace falta internet».

## 3. Al volver la conexión

- **R3.1** Con el primer pedido que llega, el celular manda la prueba de la huella. El servidor
  revisa que la firma sea de la huella vinculada a esa persona en ese celular, que la cuenta siga
  activa y con el permiso, que la prueba no se haya usado antes y que llegue antes de que se
  cumplan 24 horas desde el último contacto con sesión de ese celular, que el servidor sabe. Si todo pasa, abre la sesión y
  la persona sigue sin volver a entrar. Los tiempos de la sesión (01 · R3.1) cuentan desde ahí.
- **R3.2** Si algo no pasa, aparece la entrada encima de lo que había, sin borrarlo, con «No se
  pudo confirmar tu entrada sin conexión» y debajo «Entrá de nuevo para seguir donde estabas.».
  Si la cuenta fue dada de baja, dice lo mismo que una no autorizada (01 · R1.3).
- **R3.3** Queda en la auditoría (capítulo 05) que la persona entró sin conexión, a qué hora según
  el celular, cuándo se confirmó según el servidor, o por qué no se confirmó.

## Escenarios

### La opción

- **E01** **Dado** un Administrador con la huella vinculada en su celular y con conexión, **cuando**
  prende «Trabajar sin conexión» en Más, **entonces** queda prendida.
- **E02** **Dado** una persona sin el permiso, **cuando** abre Más en el celular, **entonces** no ve la
  opción.
- **E03** **Dado** un celular sin la huella de la persona vinculada, **cuando** abre Más, **entonces**
  no ve la opción; sin conexión, la huella de la entrada está apagada.
- **E04** **Dado** la computadora, **cuando** se abre Más, **entonces** no está la opción.
- **E05** **Dado** la opción prendida, **cuando** el servidor dice que la persona ya no tiene el
  permiso, **entonces** la opción se apaga y el celular ya no entra sin conexión.

### Entrar sin conexión

- **E06** **Dado** la opción prendida y el último contacto hace 3 horas, **cuando** se abre la
  aplicación sin conexión, **entonces** la huella está prendida, Google y escanear apagados, y dice
  hasta cuándo se puede entrar.
- **E07** **Dado** E06, **cuando** pone la huella, **entonces** entra al marco con la luz en «Sin
  conexión».
- **E08** **Dado** la opción prendida y el último contacto hace 25 horas, **cuando** se abre la
  entrada sin conexión, **entonces** todo está apagado y dice «Para entrar hace falta internet».
- **E09** **Dado** la opción prendida y el reloj del celular atrasado a antes del último contacto,
  **cuando** se abre la entrada sin conexión, **entonces** todo está apagado.
- **E10** **Dado** la última sesión cerrada desde otro dispositivo, **cuando** se abre la entrada sin
  conexión, **entonces** todo está apagado.
- **E11** **Dado** la persona salió con «Salir», **cuando** vuelve a entrar sin conexión antes de las
  24 horas, **entonces** entra.
- **E12** **Dado** la opción apagada, **cuando** se abre la entrada sin conexión, **entonces** todo está
  apagado, como hoy.
- **E13** **Dado** la huella cancelada o rechazada por el lector, **cuando** se intenta entrar,
  **entonces** no entra y la entrada sigue igual.
- **E14** **Dado** una sesión abierta sin conexión, **cuando** se cumplen las 24 horas sin conexión,
  **entonces** aparece la entrada encima, sin borrar nada, con todo apagado.

### Al volver la conexión

- **E15** **Dado** una sesión abierta sin conexión, **cuando** vuelve la conexión y la cuenta sigue
  activa y con el permiso, **entonces** la persona sigue donde estaba sin volver a entrar.
- **E16** **Dado** una sesión abierta sin conexión de una cuenta dada de baja mientras tanto, **cuando**
  vuelve la conexión, **entonces** aparece la entrada encima con el mensaje de no autorizada y la
  opción se apaga.
- **E17** **Dado** una sesión abierta sin conexión, **cuando** vuelve la conexión y la huella ya no está
  vinculada en el servidor, **entonces** aparece «No se pudo confirmar tu entrada sin conexión».

### Seguridad

- **E18** **Dado** una prueba de huella ya usada, **cuando** se manda otra vez, **entonces** el servidor
  la rechaza.
- **E19** **Dado** una prueba firmada por otra huella, o con lo firmado cambiado, **cuando** llega al
  servidor, **entonces** la rechaza y la sesión no se abre.
- **E20** **Dado** que lo guardado en el celular dice que la cuenta es otra, **cuando** se entra sin
  conexión, **entonces** al volver la conexión el servidor rechaza la prueba, porque la huella no es
  de esa cuenta.
- **E21** **Dado** cualquier entrada sin conexión, confirmada o no, **cuando** vuelve la conexión,
  **entonces** queda en la auditoría.
