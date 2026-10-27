# Entrar · maqueta adaptada: el logotipo

Capturas: `screenshot-desktop.png` y `screenshot-phone.png`; en el celular, las hojas del código de
la computadora: `screenshot-phone-qr-ask.png`, `screenshot-phone-qr-done.png` y
`screenshot-phone-other-network.png`.

## Por directivas de Carlos

- **El logotipo se ve igual en toda la aplicación:** la entrada usa el juego de `common/brand/`, el
  mismo del marco, en lugar de copias propias: `logo-on-dark.png` sobre el fondo verde de la
  computadora, `logo-on-light.png` en el celular y al pie de la tarjeta, e `isotype.svg` en el
  centro del QR. En los dos logotipos «errebress» va pegado a la F (18 px menos en el original de
  208 px de alto), para que se lea como una sola palabra.
- **Lo demás se ve igual:** la computadora fija el alto del logotipo, así que la F queda del mismo
  tamaño; en el celular el ancho pasa de 252 a 246 px, lo que mide de menos el logotipo nuevo, para
  que la F tampoco cambie de tamaño.

## Por las reglas (R2.5, E13 y E13b)

- **El celular no muestra ciudades:** la hoja que pregunta antes de la huella dice «¿Entrar en
  Chrome en Windows?» y la de confirmación «Chrome en Windows ya tiene tu sesión…».
- **Celular y computadora en la misma red:** si el celular lee el código desde otra red, no pide la
  huella. La misma hoja muestra un ícono de Wi-Fi, «Para entrar a la computadora, conectá este
  celular al mismo Wi-Fi» y el botón «Entendido» (atajo Alt+E, capítulo 00, R2.8); la computadora
  sigue con su código. Se ve con el estado «Leyó el QR desde otra red» del selector
  (`?estado=otra-red`).
