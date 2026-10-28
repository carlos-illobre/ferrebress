# Entrar · celular oscuro: maqueta final

Una propuesta para la entrada del celular: la de la referencia de Carlos (`../reference.png`), sobre la
entrada aprobada (`../../sign-in/adapted/`) con el lugar del botón de Google mientras carga
(`../../sign-in-google-loading/final/`, «El hilo»). Es una sola página para los dos anchos: desde 900 px
se ve la computadora aprobada, **sin cambios**; debajo, el celular oscuro. Si Carlos no la elige,
queda la entrada actual.

Capturas (390 × 844, sin las herramientas de la maqueta): `screenshot-phone.png` (normal),
`screenshot-phone-google-loading.png` (Google tarda, pasados 2 s), `screenshot-phone-google-failed.png`
(Google no respondió), `screenshot-phone-offline.png`, `screenshot-phone-limit.png` (demasiados
intentos), `screenshot-phone-denied.png` (cuenta no autorizada), `screenshot-phone-session-ended.png`
(sesión vencida; la cerrada desde otro dispositivo es igual, con su título) y
`screenshot-phone-entering.png` (Entrando con Google).

Arriba a la izquierda, las herramientas de la maqueta: el momento de Google (en vivo o fijo),
«Repetir» y el estado de la entrada (también con `?estado=` y `?google=` en la dirección).

## Lo que se tomó de la referencia

- **La foto oscura a pantalla completa con un degradado encima**: más oscuro arriba, con un tinte
  verde, y abajo, donde está el mostrador de madera.
- **Arriba, el logo blanco** (`logo-on-dark-large.webp`, copiado del proyecto) y debajo «TU
  FERRETERÍA, SIEMPRE EN ORDEN» en mayúsculas espaciadas, en verde claro.
- **«Iniciá sesión»** y «Accedé a tu cuenta para gestionar precios, ventas y stock desde cualquier
  lugar.», cortado en las mismas tres líneas.
- **«Continuar con Google» blanco y redondeado**: el botón de Google con su tema blanco (`theme:
  'outline'`, `shape: 'pill'`, `size: 'large'`): la G sin círculo y el texto gris oscuro de Google.
- **Las dos líneas con «o»**, finas y más cortas que el botón.
- **La huella**: un círculo verde hondo (#034A3A) con un borde claro, el ícono en blanco y debajo
  «Ingresar con huella» / «Rápido y seguro».
- **Escanear**: un círculo oscuro y transparente con borde gris, el recuadro con una raya y debajo
  «Escanear código QR» / «Ingresá desde tu computadora». El círculo y su texto son un solo botón.
- **Abajo de todo**, «¿No tenés cuenta? Contactá a tu administrador.».
- **La letra, los tamaños y los colores son los de la imagen**, medidos sobre ella (la pantalla de
  la referencia mide 305 px de ancho; se pasó a 390): el logo de 209 px, el lema de 11 px con
  0,29 em de espacio, el título de 38 px, el subtítulo de 16,5 px, los nombres de 16 px, sus
  detalles de 14,5 px, el pie de 13,5 px y los círculos de 74 px, en las mismas alturas que la
  referencia. Blanco para los títulos; #DCDCD6 para el subtítulo, la «o» y el pie; #CFD0CA para los
  detalles; #9CCAB3 para el lema.

## Por directivas de Carlos

- **Solo el celular:** todo lo nuevo está en la parte del celular de `sign-in.css` (debajo de 900 px)
  y en el final de `loading.css`. La computadora se ve igual que en la entrada aprobada.
- **No es consistente con la computadora ni con «Mostrador», a propósito:** fondo oscuro, letra,
  colores e íconos de la referencia. Contradice el lenguaje visual «Mostrador» en: el fondo oscuro
  de base, la letra (Google Sans en lugar de Manrope), mayúsculas en todo el lema, textos de menos de
  14 px (el lema, 11 px, y el pie, 13,5 px) y la huella sin el naranja de acción.
- **La letra es Google Sans** (licencia OFL), bajada de Google Fonts al proyecto
  (`fonts/google-sans-latin.woff2`, 36 kB, solo latín, pesos 400 a 700): no se pide a ninguna red.
  Es la que más se parece a la de la imagen: la «a» de dos pisos, la «t» cortada en diagonal, las
  curvas redondas y anchas; además, es la letra del botón de Google, así que el botón y la pantalla
  se leen iguales. Lleva el nombre `"Google Sans Local"` para que la computadora no la tome y siga
  con la suya.
- **Los íconos están dibujados como los de la referencia** (`extra-icons.js`): la huella con arcos
  parejos, uno dentro del otro, con trazo fino (`fingerprint-arches`), y el recuadro de escanear con
  una raya en el medio (`scan-frame`). Los de Lucide no se parecen: su huella es despareja y su
  recuadro tiene las esquinas más redondas.
- **Las palabras son las de la referencia, solo acá:** «Iniciá sesión», «Ingresar con huella»,
  «Escanear código QR» e «Ingresá desde tu computadora». El resto de la aplicación sigue diciendo
  «Entrar».
- **Sin «Sin contraseñas»** ni las tres ventajas, ni la onda naranja y verde del pie. Queda «¿No
  tenés cuenta? Contactá a tu administrador.», como texto: no lleva a ningún lado.
- **La foto es la que pasó Carlos**: una ferretería con estantes y el mostrador de madera adelante,
  desenfocada (así la quiere: que se lea como fondo, no como foto nítida). Se achicó a 780 × 1170 px
  en WebP (`background-phone.webp`, 33 kB), lo justo para un celular con pantalla densa, porque se
  baja con datos. Encima va el degradado, más claro que con la foto anterior para que se vea la
  ferretería, y los textos siguen leyéndose bien.

## Lo que se mantiene de la entrada aprobada

- **Los mismos estados, sobre el fondo oscuro:** normal; sin conexión (todo apagado, «Para entrar
  hace falta internet» y «Sin conexión» arriba a la derecha); demasiados intentos (Google y la huella
  apagados, con la cuenta regresiva); cuenta no autorizada; sesión vencida o cerrada desde otro
  dispositivo; Entrando; las hojas de la huella la primera vez y del código de la computadora (R2.2,
  R2.5); la ventana de Google y la cámara. Los avisos son los mismos, claros, que sobre lo oscuro se
  leen con sol; con un aviso, el botón de Google se acerca y la pantalla puede correrse un poco para
  ver el pie.
- **El lugar del botón de Google mientras carga («El hilo», R2.1):** el mismo comportamiento y los
  mismos textos, en claro: la línea en blanco translúcido con el tramo blanco; al llegar Google, se
  completa en blanco (el color del botón) y el botón aparece desde ella. «Conectando con Google…» y
  «Sin internet, Google no carga» en gris claro; «Google no responde · Reintentar», con la línea y
  el texto en ámbar y «Reintentar» en blanco.
- **Entrando:** la misma pantalla de espera de la entrada aprobada, sobre la misma foto oscura, con
  el logo blanco y los textos en blanco y gris claro; el local, en el círculo verde de la huella.
- **Los apagados** (sin conexión, intentos) bajan la opacidad, sin el gris de la entrada clara, que
  sobre lo oscuro se perdía.

## Por las reglas

- **01 · R3.5:** se agregó el estado «Sesión vencida» («Tu sesión venció» / «Entrá de nuevo para
  seguir donde estabas.»), que la regla pide y la maqueta aprobada no mostraba. Usa el mismo aviso
  que la sesión cerrada desde otro dispositivo. Está también en la computadora, sin otro cambio.
- **00 · R2:** en el celular no hay atajos ni marca; «Reintentar» lleva Alt R solo en la computadora.
- **Contraste con sol:** medido contra lo más claro de la foto detrás de cada texto, todos pasan
  7:1 (el lema 7,2; el subtítulo 7,2; los detalles 7,4 a 9,7; el pie 8,8; los títulos más de 11).
  Para eso el degradado es más oscuro que el de la referencia arriba y sobre el mostrador, y los
  grises algo más claros.
- **Sin correos en la maqueta:** la cuenta no autorizada dice «Esta cuenta (Cuenta de prueba)…»,
  como en la maqueta aprobada de Google cargando.

## Lo que contradice una regla

- **01 · R2.11** nombra el botón «Entrar con la huella»; acá dice «Ingresar con huella», por
  directiva de Carlos. Si se elige, la regla tiene que nombrar el texto de esta pantalla.
- **01 · R7.1 y E38:** la entrada se ve como `sign-in/adapted/`. Si se elige esta, la regla tiene que
  apuntar a esta maqueta para el celular.
- **El botón de Google no puede medir lo de la referencia (01 · R2.1):** en la imagen mide unos
  57 px de alto; el botón de verdad lo dibuja Google en su propio marco y su tamaño más grande es de
  40 px. La maqueta usa los 40 px y lo centra en la misma altura que la referencia. El ancho y el
  texto sí coinciden.

## Por la tecnología

- **Todo se anima solo con `transform` y `opacity`**, y con «reducir movimiento» no hay
  transiciones, como en la entrada aprobada. El círculo se achica un poco al tocarlo (`transform`).
- **Nada se pide a la red:** la letra, el logo, la foto y los íconos están en la carpeta de la maqueta.
- **Probada en Chrome** (computadora y celular, 390 × 844), sin errores en la consola. No hay
  Firefox en el entorno para mirarla; no usa nada que Firefox no tenga (`:is()`, `dvh`, `inset`).
