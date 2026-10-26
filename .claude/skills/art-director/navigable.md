# Encargo: que la maqueta se pueda navegar

Carlos abre las maquetas de `docs/design/mockups/`. Te pasan qué variantes hacer navegables. Quiere que **funcionen los enlaces y
los botones que abren pantallas, diálogos u hojas, o que agregan elementos ficticios**, para ver
cómo funciona visualmente. No hace falta lógica de verdad: que se vea lo que pasaría.

## Dónde
- Tu pantalla está en `docs/design/mockups/<screen>/`, con `desktop/` y `phone/` y una carpeta
  por variante. Trabajás **solo ahí**: los `index.html` de cada variante (y `states.html` si
  hay), más un `.js` o `.css` propio de la pantalla si hace falta, con nombre en inglés.
- No toques `docs/design/common/` ni otras pantallas. No uses git (ni add, ni commit). No publiques nada.
- Antes de empezar, leé `art-director-notes.md` de tu pantalla (dice cómo se mueve cada
  interacción) y `docs/design/visual-language.md`.

## Qué hacer en cada variante (computadora y celular)
1. **Navegación entre pantallas.** Agregá `<script src="../../../../common/navigate.js" defer></script>`
   (leelo: explica el contrato). Marcá con `data-ir="<screen>"` cada elemento del marco que lleva
   a otra pantalla: el menú, la barra de abajo, las pestañas de la parte y los botones que en la
   idea llevan a otra pantalla. Las pantallas son las carpetas de `docs/design/mockups/`. Una
   pestaña o un filtro propio que se llama igual que otra pantalla lleva `data-no-ir`.
2. **Lo que abre algo:** diálogos, hojas que suben, paneles, la ficha de un renglón, el detalle
   de una venta, la cámara, un menú: que se abra al tocarlo y se cierre con su botón, tocando
   afuera y con Escape. Si el diálogo no existe todavía en la maqueta, armalo con el lenguaje
   común y datos verosímiles.
3. **Lo que agrega:** «Agregar», escanear, sumar a la venta o al pedido, autorizar a alguien,
   etc.: agrega un elemento ficticio verosímil (nombres reales de ferretería, «un.», pesos con
   punto de miles) y actualiza los totales visibles que dependen de él.
4. **Lo que confirma o guarda** (Cobrar, Guardar, Aplicar, Anular…): muestra el estado de después
   (aviso, pantalla de listo, renglón tachado), como lo describe el notas.
5. **Pestañas, filtros, segmentos y conmutadores** de la propia pantalla: cambian lo que se ve.
6. Movimiento: el que describe `notas.md`, corto y solo con transform y opacity; respetá
   `prefers-reduced-motion`.
- **Quieta, la maqueta se tiene que ver igual que hoy**: no rediseñes ni muevas nada.
- JavaScript simple al pie de la página (sin librerías ni internet). Nada de `alert`.
- Lo que no tenga sentido simular (por ejemplo, la cámara real), se simula con una imagen o una
  animación.

## Reusá, no repitas
- Antes de programar, mirá `docs/design/common/` y una pantalla ya navegable (las `v2`):
  el menú «Más», los avisos, los diálogos y las hojas ya están hechos; copiá o enlazá, no rehagas.
- Si te falta un ícono, mirá primero `docs/design/common/icons/` y los de las otras pantallas.

## Sin pruebas
No escribas pruebas ni compares capturas. Abrí cada variante una vez en Chromium y
mirá que la consola no tenga errores; nada más.

## Respuesta final
Corta y en castellano: por variante, qué se puede tocar y qué hace, y lo que quedó sin simular.
