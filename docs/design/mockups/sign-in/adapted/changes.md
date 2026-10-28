# Entrar · maqueta adaptada: el logotipo

Capturas: `screenshot-desktop.png` y `screenshot-phone.png`; en el celular, las hojas del código de
la computadora: `screenshot-phone-qr-ask.png` y `screenshot-phone-other-network.png`. Entrando:
`screenshot-phone-entering.png` (con Google) y `screenshot-desktop-entering.png` (con el celular).

## Por directivas de Carlos

- **El logotipo se ve igual en toda la aplicación:** la entrada usa el juego de `common/brand/`, el
  mismo del marco, en lugar de copias propias: `logo-on-dark.png` sobre el fondo verde de la
  computadora, `logo-on-light.png` en el celular y al pie de la tarjeta, e `isotype.svg` en el
  centro del QR. En los dos logotipos «errebress» va pegado a la F (18 px menos en el original de
  208 px de alto), para que se lea como una sola palabra.
- **Lo demás se ve igual:** la computadora fija el alto del logotipo, así que la F queda del mismo
  tamaño; en el celular el ancho pasa de 252 a 246 px, lo que mide de menos el logotipo nuevo, para
  que la F tampoco cambie de tamaño.
- **Los menos pasos posibles para poner la huella:** el celular ya muestra su propio lector, así
  que Ferrebress no suma una hoja antes ni un aviso después.
  - «Entrar con la huella» abre directo el lector del sistema; la maqueta no lo simula, porque lo
    dibuja Android o iOS.
  - Sin «Entraste» ni «La computadora entró» ni «Listo»: que entró se ve solo, porque aparece el
    marco (o entra la computadora que la persona tiene adelante). Queda la espera, «Entrando…».
  - La hoja de la huella la primera vez (R2.2) y la del código de la computadora (R2.5) quedan,
    porque preguntan algo que el sistema no dice: si se quiere usar la huella y qué computadora
    pide entrar. Su botón naranja abre directo el lector, sin el círculo de la huella que imitaba
    al del sistema. Además, el navegador solo abre el lector después de un toque.
- **Entrando, como en la primera versión:** mientras se abre la sesión, la entrada se reemplaza por
  una pantalla propia, en los dos anchos, en lugar del giro sobre la entrada apagada. El logotipo, el
  título según cómo entra («Conectando tu cuenta de Google», «Entrando con tu huella» o «Entrando con
  tu celular») y qué pasa; un camino de lo que confirmó quién es (la G de Google, la huella o el
  celular) a la F de Ferrebress, que gira mientras abre la sesión, y al local, adonde se llega; y dos
  pasos: el ya hecho («Cuenta de Google verificada», «Huella confirmada»…) y «Abriendo tu sesión».
  Solo giran el anillo y la marca del paso en curso (`transform`); con «reducir movimiento», nada
  gira. Se ve con los estados «Entrando con…» del selector.
- **«Ver el manual» en la computadora (R7.2):** una pastilla naranja debajo de los tres puntos de
  la marca, como el «Ver tutorial» de la primera versión, con el ícono del libro de Más → Manual.
  Mientras el manual no exista lleva «Pronto», y al tocarlo dice «Manual · pronto. Todavía no
  está.». Atajo: Alt M. En el celular no está: el manual se abre desde Más.
- **Solo el código QR de Ferrebress (R2.6):** sin el estado «Con Bluetooth» ni la ventana del
  navegador que pedía el celular cercano.

## Por las reglas (R2.5, E13 y E13b)

- **El celular no muestra ciudades:** la hoja que pregunta antes de la huella dice «¿Entrar en
  Chrome en Windows?».
- **Celular y computadora en la misma red:** si el celular lee el código desde otra red, no pide la
  huella. La misma hoja muestra un ícono de Wi-Fi, «Para entrar a la computadora, conectá este
  celular al mismo Wi-Fi» y el botón «Entendido», sin atajo: en el celular no hay atajos (capítulo 00, R2); la computadora
  sigue con su código. Se ve con el estado «Leyó el QR desde otra red» del selector
  (`?estado=otra-red`).
