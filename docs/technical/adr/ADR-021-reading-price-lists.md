# ADR-021: Leer las listas de precios: SheetJS para abrir, lectores encerrados en QuickJS

**Estado:** propuesto

## Contexto

Las listas de precios llegan como Excel (`.xlsx` y `.xls`) o CSV (08 · R4.2), cada proveedor con su
formato, que cambia sin aviso. El capítulo 08 pide:

- **Abrir cualquiera de los tres formatos** que mande un proveedor, de hasta 100 MB (06 · R8.3), sin
  que un archivo dañado o armado para hacer daño tumbe el servidor.
- **Lectores que se suman sin reiniciar** (R5.9): uno por formato de cada proveedor, escritos por un
  programador, por el lector automático o, en la etapa b, por una IA.
- **Que un lector no pueda hacer otra cosa que leer** (R5.10): sin la base, la red, los archivos ni
  las claves, con un tope de tiempo y de memoria, y que uno que no termina no frene al servidor (E52,
  E53). Vale también para los que escribe un programador: en la etapa b los escribe una IA, y no
  conviene tener dos caminos.

## Decisión

**Abrir el archivo con SheetJS (Community Edition), en un hilo aparte.** Convierte los tres formatos en
lo mismo: hojas, filas y celdas, cada celda con su valor y el texto que se ve. Las fórmulas no se
calculan: se toma el último valor que guardó Excel, y si no tiene, la celda queda como texto (E68). El
hilo (`worker_threads`) tiene tope de memoria (`resourceLimits`) y de tiempo: si el archivo pide más
(un ZIP que se infla, un XML que se repite), se corta el hilo, la lista queda «No se pudo leer» y el
servidor sigue.

- **Se instala desde el sitio de SheetJS**, con la versión fija y su suma de comprobación en el
  `pnpm-lock.yaml`: el paquete `xlsx` del registro de npm quedó en la 0.18.5, sin arreglos de
  seguridad desde 2022.

**Un lector es código JavaScript que corre en QuickJS compilado a WebAssembly**
(`quickjs-emscripten`), dentro del mismo hilo aparte.

- **No tiene nada que no se le dé:** QuickJS es otro motor de JavaScript, sin `require`, sin `fetch`,
  sin `process` ni acceso al disco. El lector recibe las celdas como datos y devuelve datos; no se le
  pasa ninguna función del servidor.
- **Topes:** memoria por corrida (`setMemoryLimit`, 64 MB de arranque) y tiempo (un corte por
  instrucciones que mira el reloj, 5 segundos de arranque por planilla). Si se pasa, se corta esa
  corrida y se sigue con el lector siguiente (R5.2). Si el hilo entero no responde, se lo termina.
- **Se guarda como texto en la base,** con su versión, y se carga en cada lectura: uno nuevo o
  desactivado vale desde la planilla siguiente (R5.9). Los que escribe un programador viven en el
  repositorio y se copian a la base al arrancar.
- **Lo que devuelve no se cree:** se valida su forma y se comprueba contra la planilla (R5.4) en el
  servidor, fuera de QuickJS.

## Opciones descartadas

- **El paquete `xlsx` de npm:** quedó viejo y con vulnerabilidades conocidas (contaminar prototipos,
  expresiones regulares lentas).
- **ExcelJS:** bueno para `.xlsx`, pero no abre `.xls`, que mandan varios proveedores.
- **Un lector que se describe con datos** (qué columna es qué), sin código: alcanza para el lector
  automático, pero no para las planillas raras (dos precios por fila, la marca en el título de cada
  hoja) ni para lo que escribe una IA en la etapa b. El lector automático sí arma su lector de esa
  forma, como una plantilla fija con sus datos (diseño de 08, § 1).
- **`vm` de Node:** no separa: un lector puede salir con `this.constructor.constructor('return
  process')()`. La documentación de Node lo dice.
- **`isolated-vm`:** V8 aparte, más rápido, pero es un complemento nativo que se compila para cada
  versión de Node y de sistema, y ya cortó versiones de Node más de una vez.
- **Un proceso aparte con el modelo de permisos de Node** (`--permission`): separa bien, pero cada
  lectura arranca un proceso de Node (cientos de milisegundos y decenas de MB), y hay que cuidar a
  mano el entorno (las claves están en variables de entorno).
- **Un servicio aparte o un contenedor por lectura:** más piezas que desplegar para una ferretería.

## Consecuencias

- Dos dependencias nuevas en el servidor: SheetJS y `quickjs-emscripten`, con sus versiones fijas.
- Leer una planilla de 10.000 filas en QuickJS es más lento que en V8, pero entra en la meta de 10
  segundos (08 · R4.9): la mayor parte del tiempo es abrir el archivo, que no corre en QuickJS.
- Un lector de un programador se escribe y se prueba como JavaScript común, con sus pruebas en el
  repositorio, y corre igual que los demás.
- La etapa b no cambia esto: lo que escribe la IA es un lector más.
