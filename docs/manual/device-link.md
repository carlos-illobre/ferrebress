# Celular y computadora

- Computadora: Vinculá tu celular con esta computadora y usalo como control remoto: lo que tocás en uno se ve en el otro. Por el Wi-Fi del local van directo y no gastan internet. Tiene que ser la misma persona en los dos.
- Celular: Vinculá tu celular con la computadora y usalo como control remoto: lo que tocás en uno se ve en el otro. Por el Wi-Fi del local van directo y no gastan datos. Tiene que ser la misma persona en los dos.

## ¿Cómo se vincula el celular?

- Id: pair
- Dispositivo: computadora
- Ícono: qr-code
- Clip: device-link-pair

1. Abajo, a la izquierda, tocá la tarjeta del vínculo: dice «Sin vincular». También con Alt L.
   Captura: desktop-link-unpaired · indicator · El vínculo
2. Tocá «Vincular el celular».
   Captura: desktop-link-unpaired · pair · Vincular el celular
3. Aparece un código. Leelo con el celular: sirve una vez y se renueva cada minuto. Cuando el celular lo lee, el detalle se cierra solo y el celular viene a esta pantalla.
   Captura: desktop-link-code · code · El código

> Si la computadora ya estaba vinculada con otro celular, el celular pregunta antes de reemplazarlo.

## ¿Cómo sé si están conectados?

- Id: status
- Dispositivo: computadora
- Ícono: circle-check

1. La tarjeta del vínculo dice cómo están: «Directo» (por el Wi-Fi, sin gastar internet), «Por el servidor» (por internet), «Esperando al celular», «Desconectado» o «Sin internet». Debajo, si ya se envió todo y, en «Aplicación», cuánto manda el servidor por su cuenta por minuto.
   Captura: desktop-link-direct · indicator · Cómo están
2. Tocala para ver el detalle. Arriba, por dónde van y cuánto tarda lo que tocás en llegar al otro.
   Captura: desktop-link-direct · route · Por dónde van
3. La tira dice cuánto estuvieron juntos hoy: en verde, directo; en amarillo, por el servidor.
   Captura: desktop-link-direct · today · Hoy juntos
4. Abajo, con qué celular está vinculada y hasta cuándo dura sin usarse. Cada vez que se usan juntos, vuelve a contar 30 días.
   Captura: desktop-link-direct · facts · Cuánto dura

> «Esperando al celular» quiere decir que el celular no tiene Ferrebress a la vista: cuando lo abras, se encuentran solos.

## ¿Cómo se trabaja un rato cada uno por su lado?

- Id: pause
- Dispositivo: computadora
- Ícono: refresh-cw

1. En el detalle del vínculo, tocá «Desconectar». Siguen vinculados, pero cada uno muestra lo suyo.
   Captura: desktop-link-direct · pause · Desconectar
2. Para volver a mostrar lo mismo, tocá «Reconectar», en la computadora o en el celular.
   Captura: desktop-link-paused · resume · Reconectar

> Sigue desconectado aunque salgas y vuelvas a entrar, hasta que alguien toque «Reconectar».

## ¿Cómo se desvincula?

- Id: unpair
- Dispositivo: computadora
- Ícono: x

1. En el detalle del vínculo, tocá «Desvincular».
   Captura: desktop-link-direct · unpair · Desvincular
2. Confirmalo. Se termina para los dos; para usarlos juntos otra vez, hay que volver a vincularlos.
   Captura: desktop-link-unpair · confirm · Confirmar

## ¿Cómo se vincula con la computadora?

- Id: pair
- Dispositivo: celular
- Ícono: qr-code
- Clip: device-link-pair

1. En la computadora, tocá la tarjeta del vínculo y «Vincular el celular»: aparece un código. En el celular, debajo del título, tocá «Sin vincular».
   Captura: phone-link-unpaired · pill · El vínculo
2. Tocá «Leer el código».
   Captura: phone-link-sheet · read · Leer el código
3. Apuntá al código de la computadora. Cuando lo lee, quedan vinculados y el celular va a la pantalla de la computadora.
   Captura: phone-link-camera · frame · El código

> También lo podés leer con la cámara del teléfono, sin abrir Ferrebress: abre Ferrebress y quedan vinculados igual.

## ¿Cómo sé si están conectados?

- Id: status
- Dispositivo: celular
- Ícono: circle-check

1. Debajo del título está el vínculo: dice cómo están y, en un renglón, cuánto manda el servidor por su cuenta por minuto. Tocalo. Arriba, por dónde van y cuánto tarda lo que tocás en llegar a la computadora.
   Captura: phone-link-direct · route · Por dónde van
2. La tira dice cuánto estuvieron juntos hoy: en verde, directo por el Wi-Fi, sin gastar datos; en amarillo, por internet.
   Captura: phone-link-direct · today · Hoy juntos

## ¿Cómo se desconecta o se desvincula?

- Id: pause
- Dispositivo: celular
- Ícono: refresh-cw

1. En el vínculo, «Desconectar» deja de mostrar lo mismo: siguen vinculados, cada uno por su lado, hasta que alguien toque «Reconectar».
   Captura: phone-link-direct · pause · Desconectar
2. «Desvincular» lo termina para los dos. Para usarlos juntos otra vez, hay que volver a vincularlos.
   Captura: phone-link-direct · unpair · Desvincular
