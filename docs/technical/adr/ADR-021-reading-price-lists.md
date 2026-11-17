# ADR-021: Leer las listas de precios: SheetJS para abrir, lectores encerrados en QuickJS

**Estado:** aceptado

## Contexto

Las listas de precios llegan como Excel (`.xlsx` y `.xls`) o CSV (08 · R4.2), cada proveedor con su
formato, que cambia sin aviso. El capítulo 08 pide:

- **Abrir cualquiera de los tres formatos** que mande un proveedor, de hasta 100 MB (06 · R8.3), sin
  tope de filas (R4.12), y sin que un archivo dañado o armado para hacer daño tumbe el servidor.
- **Lectores que se suman sin reiniciar** (R5.9): uno por formato de cada proveedor, escritos por un
  programador, por el lector automático o, en la etapa b, por una IA.
- **Que un lector no pueda hacer otra cosa que leer** (R5.10): sin la base, la red, los archivos ni
  las claves, con un tope de tiempo y de memoria por bloque, y que uno que no termina no frene al
  servidor (E52, E53). Vale también para los que escribe un programador: en la etapa b los escribe una
  IA, y no conviene tener dos caminos.

## Decisión

**Se lee en un proceso aparte, con tope de memoria del sistema y el entorno vacío.** El servidor
mantiene dos procesos lectores vivos, los reusa y reemplaza el que muere. Un hilo (`worker_threads`)
no alcanza: su tope de memoria (`resourceLimits`) no cuenta los `Buffer`, que es donde un ZIP se
descomprime, y un hilo que se queda sin memoria se lleva al proceso entero (revisión de seguridad de 08,
punto 1). El proceso recibe el identificador de la lista, lee el archivo del almacén y devuelve lo leído
de a bloques; no recibe ninguna variable de entorno (la clave de la base no llega).

**Abrir el archivo con SheetJS (Community Edition).** Convierte los tres formatos en lo mismo: hojas,
filas y celdas, cada celda con su valor y el texto que se ve. Con las opciones cerradas: sin fórmulas
(se toma el último valor que guardó Excel, E68), sin HTML ni archivos adjuntos.

**Un CSV se lee de a partes, sin SheetJS.** SheetJS abre el archivo entero y arma todas sus celdas:
con un CSV del tamaño máximo de arranque (30 MB, unas 600.000 filas) el proceso lector se quedaba sin
memoria. Un CSV es texto, renglón por renglón, así que se recorre como flujo: se cuenta una vez (para el
aviso de las planillas grandes, 08 · R4.12) y después se entregan los bloques de a uno, cada uno con sus
filas anteriores. La memoria no crece con el archivo. Se lee en UTF-8 si lo es y, si no, en
Windows-1252; el separador es el que más aparece al principio; un campo larguísimo (64 KB) no es una
lista. Cada celda queda como texto, igual que con SheetJS. Un Excel (`.xlsx`, `.xls`) se sigue abriendo
entero: un `.xls` no pasa de 65.536 filas por hoja; un `.xlsx` grande podría leerse con un lector SAX de
su XML, si alguna lista real no entra.

**La comprobación de un bloque mira solo lo que vio el lector:** el bloque y sus filas anteriores. Una
celda señalada fuera de eso no existe.

- **Antes de SheetJS se mira el índice del ZIP** de un `.xlsx`: cuántas partes, que cada una declare su
  tamaño, que la suma no pase un tope razonable frente al tamaño del archivo y que las cabeceras
  coincidan. Con el tamaño declarado, SheetJS descomprime dentro de ese espacio y no crece: un archivo
  que miente no consigue más memoria.
- **Se baja del sitio de SheetJS y se guarda en el repositorio** (`src/server/vendor/`), con la
  versión fija y su suma de comprobación en el `pnpm-lock.yaml` (instalado desde una dirección, el
  lockfile no la guarda; desde un archivo, sí), como recomienda SheetJS: el paquete `xlsx` del registro
  de npm quedó en la 0.18.5, sin arreglos de seguridad desde 2022. Así construir la imagen no depende de
  su sitio. Como no viene del registro, `pnpm audit` no lo mira: sus avisos se revisan al actualizarlo.

**Un lector es código JavaScript que corre en QuickJS compilado a WebAssembly**
(`quickjs-emscripten-core`, con una sola variante), dentro del proceso lector.

- **No tiene nada que no se le dé:** QuickJS es otro motor de JavaScript, sin `require`, sin `fetch`,
  sin `process` ni acceso al disco. Cada corrida usa un contexto nuevo, sin ninguna función del
  servidor: el lector recibe las celdas como datos y devuelve datos.
- **Devuelve posiciones, no valores:** qué es cada fila y en qué celda está cada dato (diseño de 08,
  § 4). El servidor lee esas celdas: un lector no puede inventar un precio.
- **Topes por bloque:** la planilla se le pasa de a bloques de filas, y cada bloque tiene su tope de
  memoria (`setMemoryLimit`), de pila (`setMaxStackSize`) y de tiempo (un corte por instrucciones que
  mira el reloj). Así una planilla enorme se lee entera, y un lector que no termina un bloque se corta.
  Si el proceso entero no responde, se lo termina.
- **Se guarda en la base y se carga en cada lectura:** uno nuevo o desactivado vale desde la planilla
  siguiente (R5.9). Los que escribe un programador viven en el repositorio, por formato, y se copian a la
  base al arrancar si cambiaron. El automático guarda solo sus datos; su código es una plantilla fija
  del repositorio.

## Opciones descartadas

- **El paquete `xlsx` de npm:** quedó viejo y con vulnerabilidades conocidas (contaminar prototipos,
  expresiones regulares lentas).
- **ExcelJS:** bueno para `.xlsx`, pero no abre `.xls`, que mandan varios proveedores.
- **Un lector que se describe solo con datos** (qué columna es qué), sin código: alcanza para el lector
  automático, que es así, pero no para las planillas raras (dos precios por fila, la marca en el título
  de cada hoja) ni para lo que escribe una IA en la etapa b.
- **`vm` de Node:** no separa: un lector puede salir con `this.constructor.constructor('return
  process')()`. La documentación de Node lo dice.
- **`isolated-vm`:** V8 aparte, más rápido, pero es un complemento nativo que se compila para cada
  versión de Node y de sistema, y ya cortó versiones de Node más de una vez.
- **Un hilo en lugar de un proceso:** más liviano, pero no corta la memoria de los `Buffer` y su falla
  se lleva al servidor.
- **Un proceso nuevo por lectura:** cientos de milisegundos y decenas de MB cada vez; con dos procesos
  vivos y reusados se paga una sola vez.
- **Un servicio aparte o un contenedor por lectura:** más piezas que desplegar para una ferretería.

## Consecuencias

- Dos dependencias nuevas en el servidor: SheetJS y `quickjs-emscripten-core`, con sus versiones fijas.
- Leer en QuickJS es más lento que en V8, pero sobra: con una planilla inventada de 10.000 filas (1,5
  MB), abrirla con SheetJS tardó 175 ms y clasificar sus filas con un lector en QuickJS, de a bloques de
  5.000 y con sus topes, 133 ms, en la máquina de desarrollo. La meta es 10 segundos (08 · R4.9). La
  prueba de performance del módulo (`pnpm perf`) lo vuelve a medir: 10.000 filas en 1,2 s y un CSV de 30
  MB (623.000 filas) en 35 s, con la memoria del proceso lector sin crecer.
- Un lector de un programador se escribe como JavaScript común y sus pruebas corren también en QuickJS.
- El contenedor del servidor lleva un tope de memoria, así un error que quede no se lleva la máquina.
- La etapa b no cambia esto: lo que escribe la IA es un lector más.
