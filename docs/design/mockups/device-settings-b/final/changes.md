# Más → Configuración · Lo tuyo (04 · etapa b) · maqueta final: en qué se diferencia de lo del director

Base: la variante 2 «Por dispositivo» (`../desktop/variant-2-devices/`, `../phone/variant-2-devices/`
y lo compartido de `../shared/`: `base.js`, `base.css`, `v2.js`, `v2.css`), con el recibo de lo
cortado de la variante 1 (`../shared/v1.js`, `../shared/v1.css`). Las preferencias son las de la final
aprobada de la etapa a (`../../device-settings-a/final/`). Esta carpeta no depende de las variantes:
`settings.css`, `settings.js` e `icons-extra.js` son copias con los cambios de abajo.

Todo lo que no figura acá es igual a lo del director:
- este dispositivo dibujado, con su nombre en la pantalla que se escribe letra por letra, el brillo al
  guardar, las ideas de nombre, la cuenta «13/30» y el aviso ámbar de nombre repetido;
- «Tus otros dispositivos», con el resumen «Sesiones abiertas · Con tu huella» y «Cerrar todas»;
- una tarjeta por dispositivo, con la sesión y la huella como fichas con su ×, y colgadas, las
  computadoras que hizo entrar con su código;
- al apuntar «Se me perdió» o la × de la huella, lo que se corta se pone rojo con «Se cierra / Se
  quita», y al tocar cae girando, una tras otra;
- el botón «Casos» (no es parte del diseño).

Capturas:
- `screenshot.png` y `screenshot-phone.png`: la pantalla al abrir.
- `screenshot-lost-aim.png`: el mouse sobre «Se me perdió»: lo que se corta, en rojo.
- `screenshot-lost-receipt.png` y `screenshot-phone-receipt.png`: el recibo después de «Se me perdió».
- `screenshot-name.png`: poniéndole un nombre que ya usa otro dispositivo.
- `screenshot-alt.png`: con Alt apretado.
- `screenshot-keyboard.png`: la marca del teclado en «Se me perdió», con lo que se corta en rojo.
- `screenshot-close-all.png`: la confirmación de «Cerrar todas».
- `screenshot-prefs-changed.png`: las animaciones apagadas y «a. m./p. m.», con «Volver a como viene».
- `screenshot-system-quiet.png`: el sistema pide no animar.
- `screenshot-phone-others.png`: los otros dispositivos, en el celular.
- `screenshot-phone-no-fingerprint.png`: después de quitar la huella de este celular: «Trabajar sin
  conexión» apagada y sin poder prenderse.
- `screenshot-phone-other-fingerprint.png`: el celular tiene la huella de otra persona.
- `screenshot-phone-offline.png`: sin conexión.

## Por directivas de Carlos

- **El recibo de lo cortado es el de la variante 1:** rojo suave, con las tijeras, «Cortaste Motorola
  viejo», «Nadie puede entrar con él.», un tilde por cada cosa cortada («Su sesión», «La sesión de
  Chrome en macOS, que entró con su código», «Su huella») y «Listo» para cerrarlo. Entra con el rebote
  corto de la 1. Reemplaza a la tarjeta punteada de la 2 y va donde iba ella: arriba de las tarjetas,
  debajo del resumen. Como la tarjeta de la 2, aparece también al quitar la huella de otro celular
  («Quitaste la huella de …»), que corta lo mismo; si se corta más de uno, quedan uno arriba del otro.

## Por las reglas aprobadas

- **Las preferencias son las de la etapa a aprobada** (R1.2: cada una dice en una línea qué cambia;
  R2, R3, R4, R5). La variante las había resumido en tres renglones sin explicación («Animaciones»,
  «Hora», «Con su ícono»). Ahora, dentro de la tarjeta de este dispositivo, bajo «Cómo la usás vos
  acá»:
  - «Animaciones», con su línea, la muestra que se mueve, «La espera gira siempre» (en la
    computadora) y, si el sistema pide no animar, el aviso «Este dispositivo ya pide no animar…»
    (R2.3). En la tarjeta, que es más angosta que la lista de la etapa a, «La espera gira siempre» va
    debajo de la leyenda de la muestra.
  - «Formato de la hora», con su línea, dos fichas con la hora de ahora («14:30 · 24 horas», «2:30 p.
    m. · a. m./p. m.») y, en la computadora, «Se ve así en Quién hizo qué».
  - «Instalar en este dispositivo» con los casos de R4 (puede, ya instalada, iPhone, abierta desde el
    ícono, el navegador no sabe) y el pedido del navegador simulado. La variante decía «Con su ícono»
    y pasaba a «Instalada» sin el pedido.
  - En el celular, «Trabajar sin conexión» (R5), que la variante no tenía: con la huella propia se
    prende y se apaga; sin huella dice «Para usarla, primero vinculá tu huella en este celular»; con
    la de otra persona, «Este celular tiene la huella de otra persona: solo ella puede trabajar sin
    conexión acá.»; sin el permiso no está; sin conexión no se puede prender.
- **El formato de la hora tiene dos opciones, no tres** (R3.1, R3.4): la final de la etapa a tenía
  además «Como el sistema», que la regla ya no tiene. Arranca en «24 horas».
- **«Volver a como viene»** (R1.11, E33, E34), que la variante no tenía: a la derecha del título, como
  en la etapa a («Como viene» en el celular), con Alt O. Deja las animaciones prendidas y «24 horas»;
  no toca «Trabajar sin conexión» ni instalar. Ya como viene, no aparece.
- **«Así la tenés»** como en la etapa a (R1.10): la hora con su formato en la computadora («14:30 · 24
  horas»), «Trabajar sin conexión» en el celular, y en el celular cada pastilla lleva a su renglón.
- **Quitar la huella de este celular le apaga «Trabajar sin conexión»** (R6.2, E42). En la variante
  solo dejaba de entrar con la huella.
- **Cada huella dice su último uso** (R6.1): «Huella desde 3 mar. · Último uso 4 nov. 19:20», y la de
  este celular, «Último uso hoy 10:15». La variante decía solo desde cuándo.
- **La ficha de la sesión dice cuándo entró** (R7.1): «Con la huella · entró 4 nov. 19:20». En la
  variante la hora iba sin decir de qué era.
- **El texto de debajo del nombre tiene forma larga y corta** (00 · R3.2): en la computadora «Es de la
  computadora, no tuyo: lo ven todos en las sesiones, el vínculo, Quién hizo qué y al entrar.» (suma
  la entrada, R9.4); en el celular, «Es del celular: lo ven todos».
- **El teclado** (00 · R2):
  - Las teclas se ven solo con Alt apretado. Son las de la variante (Alt A, Alt H, Alt I, Alt D,
    Alt T), más Alt O («Volver a como viene»), Alt L (el indicador del vínculo, como en las otras
    finales), Alt B («Borrar» el nombre) y Alt 1, 2 y 3 (las ideas de nombre, mientras se escribe).
  - «Se me perdió», las × de cada ficha y «Listo» del recibo no llevan Alt (son uno por dispositivo,
    como «Cerrar» y «Quitar» en la tarjeta de Usuarios, 02 · R5.8): ↑ ↓ los recorren con la marca
    naranja y Enter toca el marcado. Al llegar a «Se me perdió», lo que se corta se pone rojo, igual
    que con el mouse (R1.8).
  - Esc cierra la confirmación, deja de editar el nombre o saca la marca.
- **El marco, como en las otras finales:** al pie del lateral, «Aplicación: 0 KB/min» en la tarjeta
  del vínculo; en el celular, la pastilla del vínculo con lo que gasta y, sin conexión, la luz al lado
  («Sin conexión · 0 por enviar», 00 · R4.1). El menú no lleva a otras maquetas: son botones sin
  destino, como en las otras finales (la variante cargaba `navigate.js`).
- **El dibujo de este dispositivo tiene el borde gris claro** (`--borde-fuerte`), no negro: el
  lenguaje visual deja lo oscuro solo para lo que la tarea pide. El director ya lo había anotado como
  lo más flojo de la 2.
- **«Listo» al escribir el nombre es naranja** (`btn-accion`), no pino lleno, por la misma regla: es
  lo que sigue, no un botón de escanear. «Vincular este celular con mi huella» sigue oscuro, porque es
  leer la huella.
- **Ningún texto gris claro de menos de 14 px:** la cuenta de letras, «Entró con su código» y el
  navegador debajo del nombre en el dibujo eran de 13 px.

## Por la tecnología

- **Una sola página para los dos** (ADR-002): las variantes eran el mismo archivo en dos carpetas.
  Ahora es un `index.html` que cambia a celular debajo de 900 px. Este dispositivo es la computadora
  arriba del corte y «Celu de Rubén» debajo; en el código lo decide el tipo de dispositivo, no el
  ancho (R5.4, R6.3).
- **En el celular no hay «apuntar»:** lo que se corta se pone rojo mientras el dedo está apoyado en
  «Se me perdió», y se corta al soltarlo. Es lo más parecido a R1.8 sin un segundo toque, que R8.1 no
  permite.
- **Solo `transform` y `opacity`:** el rojo de lo que se corta cambia sin transición; lo que se mueve
  (caer, el latido de las letras, el brillo, el recibo, la llave) usa solo esas dos propiedades.
- **Si el sistema cambia «reducir movimiento» con la pantalla abierta, se nota al momento**
  (`matchMedia`), como en la etapa a.
- **Nada consulta la red:** la hora corre con un temporizador local cada 5 segundos.
- **Se probó en Chromium**: computadora a 1366 × 768, celular a 390 × 844 y dentro del visor, sin
  errores en la consola. No hubo Firefox para probarla. En el celular, el campo del nombre ocupa todo
  el ancho con `:has()`; un Firefox anterior al 121 lo deja al costado del dibujo, más angosto.

## Para llevarla al código

- Una clase por pieza, con los tokens de `common.css`:
  - `.hero`, la tarjeta de este dispositivo (`.aparato`, el dibujo; `.hero-nombre`; `.nombre-edit`,
    el campo; `.hero-huella`);
  - `.ajuste`, `.llave`, `.muestra`, `.formato`, `.asi-pastilla` y `.como-viene`, como en la etapa a;
  - `.fam`, la tarjeta de otro dispositivo (`.ficha`, la sesión o la huella, con `.ficha-x`;
    `.hijos` y `.hijo`, lo que hizo entrar con su código; `.se-corta`, la etiqueta roja);
  - `.recibo`, lo cortado;
  - `.marca-tecla`, la marca del teclado.
- La regla está en `settings.js`:
  - `loQueCorta(id)`: lo que corta «Se me perdió» o «Quitar» en otro celular (su sesión, las de las
    computadoras que hizo entrar y su huella); se usa para pintar el rojo antes y el recibo después.
  - `quitar(id)`: en este celular, solo la huella y «Trabajar sin conexión»; en otro, como
    «Se me perdió».
  - `raices()`: una computadora que entró con el código de un celular cuelga de él mientras ese
    celular tenga sesión o huella; si no, va suelta.
  - `repetido(nombre)`: avisa si otro dispositivo de la ferretería ya se llama igual, sin impedirlo.
