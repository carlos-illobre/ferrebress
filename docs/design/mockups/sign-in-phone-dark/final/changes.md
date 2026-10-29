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
(sesión vencida; la cerrada desde otro dispositivo es igual, con su título),
`screenshot-phone-entering.png` (Entrando con Google), `screenshot-phone-offline-finger.png` (sin
conexión, con la huella) y `screenshot-phone-not-confirmed.png` (no se pudo confirmar la entrada sin
conexión).

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
- **La foto es la que pasó Carlos, generada con Microsoft Copilot**: una ferretería genérica con
  estantes y el mostrador de madera adelante, sin marcas ni un local real. Microsoft no reclama las
  imágenes que genera; Carlos lo consultó y decidió usarla, también en producción. La foto:
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

## Lo que pidió Carlos después

- **El lema** pasa a ser «Vendé, contá y cobrá desde el mostrador o el depósito.» en lugar de «Tu
  ferretería, siempre en orden».
- **«Escanear código QR»** dice debajo «Entrá en la computadora con su código», en lugar de «Ingresá
  desde tu computadora», que se podía entender al revés.
- **Con un aviso en pantalla, el pie queda abajo del borde:** está bien así.
- **Los textos chicos:** Carlos eligió, de las tres opciones de `text-sizes-comparison.webp`, el lema
  a 15 px en minúsculas (con la frase larga se lee de un vistazo) y el pie a 14 px.

## Lo que pidió Carlos al probarla

Vale sobre lo de arriba; la maqueta ya tiene estos valores, los mismos de la aplicación.

- **El lema** vuelve a ser «Tu ferretería, siempre en orden», en minúsculas y a 16,5 px: «Vendé,
  contá y cobrá…» repetía lo que dice el subtítulo de «Iniciá sesión».
- **La letra, un poco más grande:** el lema a 16,5 px, el subtítulo a 18 px, los nombres de la huella
  y de escanear a 17,5 px, sus detalles a 15,5 px, la «o» a 14 px y el pie a 15,5 px. El título
  queda en 38 px.
- **Los espacios** arriba del logo (70 px), debajo del logo (15 px) y entre el lema e «Iniciá
  sesión» (50 px) son los de la maqueta aprobada cuando la pantalla tiene lugar. En un celular más
  bajo, o con las barras del navegador a la vista, los espacios grandes se achican en proporción,
  lo justo para que se vea todo hasta «¿No tenés cuenta?» sin correr la pantalla (en la aplicación;
  la maqueta queda con los de siempre). Sin conexión, el logo no sube, para que la pastilla no lo
  tape.
- **El botón de Google, un 20 % más grande en el celular:** Google lo dibuja de 40 px de alto como
  mucho; la aplicación se lo pide más angosto y lo agranda, así mide unos 48 px y ocupa el mismo
  ancho.

## Entrar sin conexión (15 · etapa a)

Dos estados más, solo en el celular (la computadora no entra sin conexión, 15 · R1.1), en el
selector de la maqueta y en `?estado=`:

- **«Sin conexión, con la huella»** (`?estado=sin-conexion-huella`, 15 · R2.1): la huella queda
  prendida, como en el estado normal; Google («Sin internet, Google no carga») y «Escanear código QR»
  apagados, como sin conexión; «Sin conexión» arriba a la derecha; y en lugar de «Para entrar hace
  falta internet», el aviso «Sin conexión: podés entrar con la huella hasta **el martes 9:40**», con
  el día y la hora en negrita, como la cuenta regresiva de demasiados intentos.
  - **El tono del aviso:** no es un error ni algo que frena, así que no usa el ámbar de los avisos
    que impiden entrar (sin conexión, intentos, sesión terminada) ni el rojo de la cuenta no
    autorizada. Va en verde claro (`--pino-suave` con el texto en `--pino-texto`, el par que ya usa
    la maqueta para «La forma más rápida»), con el mismo ícono de wifi tachado y la misma forma que
    los otros avisos. Contraste 6,2:1, más que el de los avisos ámbar (5,9:1).
- **«No se pudo confirmar»** (`?estado=no-confirmada`, 15 · R3.2): con conexión, todo prendido y
  el aviso de arriba de la sesión vencida, con el título «No se pudo confirmar tu entrada sin
  conexión» y debajo «Entrá de nuevo para seguir donde estabas.».
- **«Sin conexión»** queda igual: es el de 15 · R2.4 (sin la opción, vencido, reloj atrasado, sesión
  cerrada desde otro dispositivo o sin huella vinculada).
- **Para llevarla al código:** los dos estados sin conexión marcan `body[data-net="offline"]`, que es
  lo que muestra «Sin conexión» arriba, apaga el lugar de Google y frena el QR. Lo que se apaga en
  cada estado sale de `data-off-when` (`offline` apaga todo; `offline-finger`, todo menos la huella).

## Lo que queda sin resolver

- **Tocar la huella sin conexión** muestra en la maqueta la misma pantalla de Entrando que con
  conexión («Ahora Ferrebress abre tu sesión»). En la aplicación no: por 15 · R2.6 se llega directo
  al marco con la luz en «Sin conexión» (lo decidió Carlos). La maqueta no tiene el marco.
