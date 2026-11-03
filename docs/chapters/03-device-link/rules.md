# 03 · Celular y computadora: reglas

El celular y la computadora de una misma persona trabajan juntos. Se construye en dos etapas
(roadmap): **a. Vínculo y espejo**, que es lo que está escrito acá, y **b. Lector de códigos y
fotos** (la cámara del celular lee códigos y saca fotos para la computadora), que se escribe con el
catálogo (capítulo 07).

**Estado:** etapa a, aprobada.

**La idea:** vinculados, el celular y la computadora son una sola aplicación en dos pantallas, como
un control remoto: lo que se toca en uno se ve en el otro. Se hablan directo por el Wi-Fi del local,
y el servidor solo los presenta y hace de respaldo. Ningún otro capítulo depende de este: si se
quita, el resto sigue andando igual.

## 1. Vincular

- **R1.1** Se vinculan un celular y una computadora con **la misma persona adentro**. El vínculo es
  uno con uno: un celular está vinculado a una sola computadora y una computadora a un solo
  celular.
- **R1.2** **Vincular no pide ningún permiso** (02 · R7.2): solo junta dos dispositivos de la misma
  persona.
- **R1.3** **Con el botón:** en la computadora, en el detalle del indicador (R4), «Vincular el
  celular» muestra un código QR. El celular lo lee desde el detalle de su indicador («Leer el
  código») o con la cámara del teléfono, que abre Ferrebress.
  - El código se renueva cada 60 segundos y sirve una sola vez.
  - La computadora se entera en el momento, sin preguntar a ritmo fijo: espera por un canal abierto
    solo mientras el código está en pantalla (00 · R4.3).
  - No hace falta que estén en la misma red: si no lo están, quedan vinculados y se hablan por el
    servidor (R3.2).
- **R1.4** **Si alguno de los dos ya está vinculado** a otro dispositivo, el celular lo avisa antes:
  «Este celular está vinculado a Chrome en Windows. ¿Reemplazar?» (o «Esta computadora está
  vinculada a otro celular»). Al aceptar, el vínculo anterior se termina; al cancelar, no cambia
  nada.
- **R1.5** **Al entrar a la computadora con el celular** (01 · R2.5), quedan vinculados. Si alguno
  ya tenía otro vínculo, se reemplaza sin preguntar: leer el código de esa computadora ya dice que
  se la quiere usar.
- **R1.6** **Con otra persona en el celular**, el código no vincula: el celular dice «Este código es
  de otra cuenta. Entrá con la misma cuenta en los dos». No ofrece cambiar de cuenta.
- **R1.7** Vincular necesita internet en los dos: el servidor los presenta. Un celular que entró
  sin conexión con la huella (capítulo 15) no puede vincularse hasta que el servidor confirme su
  entrada.

## 2. Cuánto dura y qué lo termina

- **R2.1** **El vínculo es de ese celular, esa computadora y esa persona**, no de la sesión. Al
  salir de uno o de los dos, o si la sesión vence (01 · R3), queda dormido, y se despierta solo
  cuando la misma persona vuelve a entrar en ese dispositivo. Si entra otra persona, el vínculo no
  se le aplica y para ella ese dispositivo no está vinculado.
- **R2.2** **Dura 30 días desde la última vez que los dos estuvieron conectados en espejo**: un
  vínculo que se usa no vence. Cuando exista Administración (capítulo 06), los días los fija un
  Administrador ahí.
- **R2.3** **Se termina** cuando:
  - se desvincula desde cualquiera de los dos (R5.3);
  - se reemplaza por otro (R1.4, R1.5);
  - vence (R2.2);
  - se cierra desde otro dispositivo la sesión de uno de los dos (02 · R5.3, R5.4);
  - se le quita la huella al celular o se lo corta como perdido (02 · R5.6, R5.7);
  - la persona se da de baja (02 · R4.1).
- **R2.4** Al terminar, cada uno sigue por su lado en la pantalla en la que estaba, y su indicador
  dice «Sin vincular». Para volver a trabajar juntos se vincula de nuevo.

## 3. La conexión entre los dos

- **R3.1** **Directa por el Wi-Fi:** vinculados y con la aplicación abierta en los dos, se hablan
  directo, sin pasar por internet. El servidor solo los presenta: abre un canal para eso y lo
  cierra apenas se encuentran.
- **R3.2** **Por el servidor, de respaldo:** si la red o el navegador no permiten la conexión
  directa (un Wi-Fi que aísla los dispositivos, un navegador viejo, o uno de los dos fuera del
  local), se hablan por el servidor, solo mientras los dos tienen la aplicación abierta.
- **R3.3** **El respaldo no reintenta la conexión directa por su cuenta:** si no se pudo, es la red
  o el navegador, y reintentar gasta datos sin cambiar nada. Se vuelve a probar solo cuando alguien
  toca «Probar conexión directa» en el detalle del indicador, o al volver a encontrarse (R3.5).
- **R3.4** **Sin internet:** si se corta internet y el Wi-Fi del local sigue, la conexión directa
  sigue andando. Si la conexión directa también se corta mientras no hay internet, no se pueden
  volver a encontrar hasta que vuelva.
- **R3.5** **Cuando uno de los dos se cierra** (la pestaña, la pantalla del celular apagada, otra
  aplicación encima), el otro sigue solo y su indicador dice «Esperando al celular» o «Esperando a
  la computadora». Al volver, se encuentran solos.
- **R3.6** **Nada corre de fondo:** sin vínculo, o con el otro cerrado, no hay ningún canal abierto
  ni temporizador que consulte la red por el vínculo (00 · R4.3).

## 4. El indicador del vínculo

- **R4.1** Está **siempre a la vista**, en el celular y en la computadora: un punto de color con un
  texto corto. Dice uno de estos estados:
  - «Sin vincular»;
  - «Directo»: vinculados y hablando por el Wi-Fi;
  - «Por el servidor»: vinculados y hablando por el respaldo (R3.2);
  - «Desconectado»: vinculados, pero cada uno por su lado (R5.1);
  - «Esperando al celular» o «Esperando a la computadora»: el otro no tiene la aplicación abierta;
  - «Sin internet»: vinculados, sin conexión directa y sin internet para encontrarse (R3.4).
- **R4.2** **Al tocarlo, muestra el detalle:** el estado explicado en una frase, con qué dispositivo
  está vinculado («Chrome en Android»), desde cuándo y hasta cuándo dura si no se usa (R2.2), y
  los botones que tocan en ese estado:
  - «Vincular el celular», en la computadora: siempre, también si ya hay vínculo (R1.4);
  - «Leer el código», en el celular: siempre;
  - «Desconectar» o «Reconectar», con vínculo (R5);
  - «Probar conexión directa», solo «Por el servidor» (R3.3);
  - «Desvincular», con vínculo (R5.3).
- **R4.3** Sin vínculo, el detalle del celular explica cómo vincularlo: «En la computadora, tocá el
  indicador y leé el código».
- **R4.4** **La tira del día:** con vínculo, el detalle muestra una tira desde la primera conexión
  del día hasta ahora, con un tramo por estado, cada uno del color de su punto: «Directo», «Por el
  servidor» y el resto (desconectado, esperando al otro, sin internet). Arriba dice cuánto
  estuvieron juntos hoy y qué parte fue directo: «Hoy juntos 2 h 17 min · 92 % directo». Sirve para
  ver si la red falla seguido. Se guarda solo en ese dispositivo, no viaja al servidor ni va a la
  auditoría (R8.2), y al día siguiente empieza de cero. Cada dispositivo anota lo que vio, así que
  el celular y la computadora pueden mostrar números algo distintos.

## 5. Desconectar, reconectar y desvincular

- **R5.1** **«Desconectar»**, desde cualquiera de los dos, sin confirmación: cada uno sigue por su
  lado sin soltar el vínculo. Dura hasta que alguien toca «Reconectar»; salir y volver a entrar no
  lo reconecta.
- **R5.2** **«Reconectar»**, desde cualquiera de los dos: vuelve el espejo, y manda la computadora
  (R6.3).
- **R5.3** **«Desvincular»**, desde cualquiera de los dos, con confirmación: termina el vínculo
  (R2.4).

## 6. El espejo

- **R6.1** **Vinculados y conectados, muestran lo mismo:** la misma pantalla, con lo mismo cargado,
  y lo que se toca en uno pasa en el otro, en las dos direcciones. Cada uno lo muestra con su forma
  (celular o computadora).
- **R6.2** **Se espeja todo lo que se ve:** la pantalla, lo abierto encima (una hoja, un detalle, una
  confirmación) y lo escrito en un buscador o en un campo. El otro no repite lo que se pide al
  servidor: recibe lo que trajo el que lo pidió, así espejar no gasta datos de internet.
- **R6.3** **Al conectarse, manda la computadora:** el celular va a la pantalla de la computadora y
  toma lo que ella tiene abierto. Vale al vincular, al reconectar y cuando el celular vuelve después
  de cerrarse (R3.5).
- **R6.4** **Si la computadora tiene Ferrebress en varias pestañas,** espeja la que se usó último.
- **R6.5** **Lo que tarda:** por la conexión directa, lo que se toca en uno se ve en el otro en menos
  de 50 ms. Por el servidor tarda lo que tarde internet.
- **R6.6** **Los permisos son los mismos en los dos,** porque la persona es la misma (02 · R7). Si le
  cambian los permisos, los dos se actualizan con su próximo pedido (02 · R7.8).

## 7. El mecanismo de conexión

- **R7.1** **Lo que llega del servidor sin pedirlo usa un solo mecanismo**, el de este capítulo, para
  cualquier funcionalidad: el vínculo, la espera del código de entrada (01 · R2.5) y las que
  vengan (como la auditoría que se actualiza sola, roadmap T118). Sumar una es decir qué espera y
  cuánto importa que llegue en el momento; no se arma otro mecanismo.
- **R7.2** **Gasta lo menos posible:** un canal con el servidor está abierto solo mientras una
  pantalla a la vista lo necesita, nunca de fondo; cada dispositivo tiene a lo sumo uno, que
  comparten todas las esperas; y lo que no es urgente viaja en las respuestas que la aplicación ya
  recibe (00 · R4.3). Un corte del canal se nota en menos de un minuto.

## 8. Lo que queda anotado

- **R8.1** Queda en la auditoría (capítulo 05): vincular (con el botón o al entrar con el celular, y
  qué dispositivos), reemplazar un vínculo, desvincular (desde cuál) y cada vínculo que termina
  solo, con el motivo (venció, se cerró la sesión, se quitó la huella o se cortó el celular, se dio
  de baja a la persona).
- **R8.2** No se anotan el espejo, desconectar, reconectar ni los cambios entre directo y por el
  servidor: no dicen nada de lo que hizo la persona en el negocio.

## Escenarios

### Vincular

- **E01** **Dado** una persona con sesión en la computadora y en el celular, sin vínculo, **cuando**
  toca el indicador en la computadora y «Vincular el celular», y lee el código con el celular,
  **entonces** quedan vinculados, el celular va a la pantalla de la computadora y los dos
  indicadores dicen «Directo».
- **E02** **Dado** el código de E01, **cuando** el celular lo lee con la cámara del teléfono en vez de
  con la aplicación, **entonces** se abre Ferrebress y quedan vinculados igual.
- **E03** **Dado** una computadora mostrando el código de vincular, **cuando** pasan 60 segundos,
  **entonces** muestra uno nuevo y el anterior ya no vincula.
- **E04** **Dado** un código de vincular ya usado, **cuando** otro celular de la misma persona lo lee,
  **entonces** no se vincula y el celular dice que el código venció.
- **E05** **Dado** un celular vinculado a otra computadora, **cuando** lee el código de vincular,
  **entonces** pregunta «Este celular está vinculado a Chrome en Windows. ¿Reemplazar?»; al aceptar,
  queda vinculado a la nueva y la otra pasa a «Sin vincular»; al cancelar, no cambia nada.
- **E06** **Dado** una computadora vinculada a otro celular, **cuando** un celular de la misma persona
  lee su código, **entonces** pregunta «Esta computadora está vinculada a otro celular.
  ¿Reemplazar?», y al aceptar el otro celular pasa a «Sin vincular».
- **E07** **Dado** una computadora en la entrada, **cuando** un celular la hace entrar leyendo su
  código (01 · R2.5), **entonces** entran y quedan vinculados, sin otra pregunta.
- **E08** **Dado** un celular vinculado a otra computadora, **cuando** hace entrar a una computadora
  nueva con el código de entrada, **entonces** queda vinculado a la nueva sin preguntar y la otra
  pasa a «Sin vincular».
- **E09** **Dado** el celular en el Wi-Fi del local y la computadora en otra red, **cuando** se
  vinculan, **entonces** quedan vinculados y los indicadores dicen «Por el servidor».

### Cuánto dura y qué lo termina

- **E10** **Dado** dos dispositivos vinculados, **cuando** la persona sale de la computadora,
  **entonces** el celular dice «Esperando a la computadora»; **y cuando** vuelve a entrar en la
  computadora, se conectan solos, sin vincular de nuevo.
- **E11** **Dado** una computadora vinculada al celular de Ana, **cuando** Ana sale y entra Beto en esa
  computadora, **entonces** para Beto la computadora dice «Sin vincular» y el celular de Ana no
  muestra nada de Beto.
- **E12** **Dado** dos dispositivos vinculados, **cuando** pasan 30 días sin que estén conectados en
  espejo, **entonces** el vínculo se termina y los dos dicen «Sin vincular».
- **E13** **Dado** dos dispositivos vinculados que se usan juntos todos los días, **cuando** pasan 40
  días desde que se vincularon, **entonces** siguen vinculados.
- **E14** **Dado** dos dispositivos vinculados, **cuando** un Administrador cierra la sesión de uno de
  los dos desde Usuarios, **entonces** el vínculo se termina y el otro sigue solo, con «Sin
  vincular».
- **E15** **Dado** un celular vinculado, **cuando** un Administrador le quita la huella o lo corta como
  perdido, **entonces** el vínculo se termina.
- **E16** **Dado** una persona con dos dispositivos vinculados, **cuando** se la da de baja, **entonces**
  el vínculo se termina.
- **E17** **Dado** dos dispositivos vinculados, **cuando** la sesión de la computadora vence por no
  usarla, **entonces** el vínculo queda dormido, no terminado, y al volver a entrar se conectan.

### La conexión

- **E18** **Dado** dos dispositivos vinculados en un Wi-Fi que aísla los equipos, **cuando** se
  conectan, **entonces** hablan por el servidor, los indicadores dicen «Por el servidor» y no se
  reintenta la conexión directa sola.
- **E19** **Dado** dos dispositivos «Por el servidor», **cuando** se toca «Probar conexión directa» y
  la red ya lo permite, **entonces** pasan a «Directo»; si no lo permite, siguen «Por el servidor» y el
  detalle dice que no se pudo.
- **E20** **Dado** dos dispositivos «Directo», **cuando** se corta internet y el Wi-Fi sigue, **entonces**
  el espejo sigue andando y el indicador sigue diciendo «Directo».
- **E21** **Dado** dos dispositivos vinculados sin internet, **cuando** se corta la conexión directa,
  **entonces** los indicadores dicen «Sin internet»; **y cuando** vuelve internet, se encuentran solos.
- **E22** **Dado** dos dispositivos vinculados, **cuando** el celular apaga la pantalla, **entonces** la
  computadora dice «Esperando al celular»; **y cuando** el celular vuelve, va a la pantalla de la
  computadora y los dos dicen «Directo».
- **E23** **Dado** una computadora sin vínculo, o con el celular cerrado, **cuando** pasa una hora sin
  que nadie toque nada, **entonces** la aplicación no hizo ningún pedido por el vínculo.
- **E24** **Dado** dos dispositivos «Directo», **cuando** pasa una hora sin tocar nada, **entonces**
  ninguno tiene un canal abierto con el servidor por el vínculo.

### El indicador

- **E25** **Dado** una persona sin vínculo, **cuando** toca el indicador en el celular, **entonces** ve
  «En la computadora, tocá el indicador y leé el código» y «Leer el código».
- **E26** **Dado** dos dispositivos vinculados, **cuando** se toca el indicador, **entonces** el detalle
  dice con qué dispositivo está vinculado, desde cuándo y hasta cuándo dura si no se usa.
- **E26b** **Dado** dos dispositivos que hoy estuvieron 2 horas directo y 10 minutos por el servidor,
  **cuando** se toca el indicador, **entonces** la tira muestra esos tramos con sus colores y dice «Hoy
  juntos 2 h 10 min · 92 % directo»; **y** el servidor no recibió nada de eso.

### Desconectar, reconectar y desvincular

- **E27** **Dado** dos dispositivos en espejo, **cuando** se toca «Desconectar» en uno, **entonces** los
  dos dicen «Desconectado» y lo que se toca en uno ya no pasa en el otro.
- **E28** **Dado** dos dispositivos desconectados, **cuando** la persona sale y vuelve a entrar en los
  dos, **entonces** siguen «Desconectado».
- **E29** **Dado** dos dispositivos desconectados en pantallas distintas, **cuando** se toca
  «Reconectar» en el celular, **entonces** el celular va a la pantalla de la computadora.
- **E30** **Dado** dos dispositivos vinculados, **cuando** se toca «Desvincular» en uno, **entonces** pide
  confirmación; al confirmar, los dos dicen «Sin vincular» y cada uno sigue en su pantalla; al
  cancelar, no cambia nada.

### El espejo

- **E31** **Dado** dos dispositivos en espejo, **cuando** en el celular se abre Auditoría, **entonces** la
  computadora abre Auditoría, con su forma de computadora.
- **E32** **Dado** dos dispositivos en espejo, **cuando** en la computadora se abre el detalle de una
  persona en Usuarios, **entonces** el celular muestra el mismo detalle abierto.
- **E33** **Dado** dos dispositivos en espejo, **cuando** se escribe en un buscador de la computadora,
  **entonces** el texto y los resultados aparecen en el celular, y el celular no le pide nada al
  servidor por esa búsqueda.
- **E34** **Dado** dos dispositivos «Directo», **cuando** se toca algo en uno, **entonces** se ve en el
  otro en menos de 50 ms.
- **E35** **Dado** una computadora con Ferrebress en dos pestañas y el celular vinculado, **cuando** se
  usa la segunda pestaña, **entonces** el celular espeja la segunda.

### Sin conexión

- **E36** **Dado** un celular que entró sin conexión con la huella (capítulo 15), **cuando** lee el
  código de vincular, **entonces** no se vincula hasta que el servidor confirme su entrada.

### Seguridad

- **E37** **Dado** un celular con otra persona adentro, **cuando** lee el código de vincular de una
  computadora, **entonces** no se vincula y dice «Este código es de otra cuenta. Entrá con la misma
  cuenta en los dos».
- **E38** **Dado** un dispositivo que no está vinculado, **cuando** intenta mandarle algo a otro por el
  servidor o pedirle que lo presente, **entonces** el servidor lo rechaza.
- **E39** **Dado** un vínculo que ya se terminó, **cuando** uno de los dos dispositivos intenta
  conectarse con el otro, **entonces** no se conectan y los dos dicen «Sin vincular».
- **E40** **Dado** un celular sin sesión, **cuando** lee el código de vincular, **entonces** no se vincula
  y el celular lleva a la entrada.

### Lo que queda anotado

- **E41** **Dado** dos dispositivos que se vinculan, se desvinculan o cuyo vínculo vence, **cuando** un
  Administrador mira la auditoría, **entonces** ve cada cosa con quién, qué dispositivos y, si terminó
  solo, por qué.
- **E42** **Dado** dos dispositivos que se desconectan, se reconectan o pasan de directo a por el
  servidor, **cuando** se mira la auditoría, **entonces** no aparece nada de eso.
