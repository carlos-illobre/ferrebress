# 08 · Listas de precios: resumen

Los proveedores y sus listas, de donde salen los productos, en Catálogo → Listas. En tres etapas:
**a. la lista a mano**, **b. los lectores generados por IA** y **c. otros formatos y ofertas**.
Reglas completas de la etapa a en [rules.md](rules.md).

**Estado:** etapa a, reglas a aprobar por Carlos; etapas b y c, por escribir.

## Cada regla en una línea (etapa a)

- **La pantalla y los permisos:** en el celular y en la computadora; «Ver costos», «Administrar
  proveedores» y «Cargar listas» (los dos últimos incluyen el primero); sin permiso se ven solo los
  datos de contacto de los proveedores; todo necesita conexión; cada dato se guarda al cambiarlo, con
  «Deshacer» (R1).
- **Los proveedores:** nombre único, vendedor, teléfono, correo y nota; darlo de baja quita su costo
  de sus productos y da de baja los que solo traía él, después de ver cuántos y confirmar; se puede
  reactivar (R2).
- **Cómo cobra:** si sus precios incluyen IVA, sus descuentos en orden (para todas las marcas o para
  una), su IVA de arranque y qué pasa al cambiar esto: recalcular con la última lista, después de ver
  cuántos costos cambian, o desde la próxima. El costo es lo que se paga por una unidad, sin IVA, con
  los descuentos uno sobre otro; no se redondea y deja ver su cuenta (R3).
- **Subir una lista:** un archivo Excel o CSV, sin decir nada más; el sistema reconoce de quién es y,
  si no puede, lo pregunta una vez; el archivo se guarda siempre; la fecha es la de la planilla o, si
  no la dice, la del servidor; completa o de solo cambios; una en espera por proveedor; el avance
  siempre a la vista (R4).
- **Los lectores:** uno por cada formato de planilla de cada proveedor; cada uno dice si una
  planilla es suya; si ninguno la reconoce, el lector automático intenta leerla solo y, si lo logra,
  queda guardado; todo resultado se comprueba; si no se puede leer, no se pregunta nada: la lista
  espera a un lector y queda una anomalía; se ven y se desactivan en Administración → Lectores; un
  lector nuevo vale desde la planilla siguiente, sin reiniciar nada, y corre encerrado (R5).
- **Ver qué cambia y aplicar:** nada se guarda hasta aplicar; el resumen y el detalle con el costo
  anterior y el nuevo; aparte, los costos que cambian más que un porcentaje; aplicar dice lo que va a
  pasar y avisa si da de baja demasiado; todo o nada; no se aplica dos veces ni se deshace; una lista
  más vieja que la última no se aplica (R6).
- **Lo que hace una lista:** crea los productos nuevos (sin margen, «un.»), actualiza los que ya
  existían sin tocar lo cambiado a mano, da de baja los que ya no trae ningún proveedor y trae de
  vuelta los que reaparecen, con su margen (R7).
- **Los productos de un proveedor:** una lista simple con código, descripción, marca y costo, hasta
  que exista el catálogo (R8).
- **El registro:** cada cambio a Quién hizo qué, con el costo anterior y el nuevo de cada producto;
  las listas que no se pudieron leer y las filas salteadas, a las anomalías (R9).
- **Afuera:** alta y baja de productos a mano, listas escritas en la aplicación, listas que llegan
  solas, el aviso para remarcar, los bultos, el precio sugerido y marcar las columnas a mano.

## Lo confirmado de la etapa b (los lectores generados por IA)

- **Cuándo:** cuando ningún lector entiende una planilla y el lector automático duda, una IA escribe
  el lector: el código que lee ese formato. Queda guardado, y las planillas siguientes con ese
  formato no pasan por la IA. La IA decide sola qué columna es qué (por ejemplo, cuál es el precio
  por unidad).
- **Si la IA tiene una duda, se la pregunta a quien subió la lista,** como en un chat: pregunta todo
  lo que necesite y la persona le contesta ahí mismo.
- **La IA no lee los precios ni calcula nada:** solo escribe el lector. Lo que el lector devuelve
  pasa la misma comprobación que cualquier otro; si no la pasa, se le devuelven los errores para que
  lo corrija, hasta la cantidad de intentos que fija un Administrador, y si tampoco, la lista no se
  lee y queda la anomalía.
- **La primera lista de un lector generado espera a que alguien la revise;** las siguientes entran
  como cualquiera.
- **El servicio:** Vercel AI Gateway, con el modelo y la clave puestos en Administración, para poder
  usar un modelo gratuito y cambiarlo sin programar. A Carlos no le importa si lo que se manda se usa
  para entrenar modelos.
- **La clave:** nunca se vuelve a mostrar (solo sus últimos 4 caracteres, con «Cambiar», «Quitar» y
  «Probar»), se guarda cifrada y no llega a la aplicación. La cambia solo quien tiene un permiso
  propio, que no se suma al rol Administrador: lo tiene un rol nuevo, «Superadministrador», con todo
  lo del Administrador más ese permiso, que al instalar recibe el primer Administrador.
- **Sin clave** no se generan lectores: lo que no se puede leer da el error y la anomalía.

## Lo que falta decidir

Nada de la etapa a. De la etapa b, sobre el chat con la IA:

1. ¿La IA pregunta solo cuando no puede decidir sola, o también quien subió la lista puede
   escribirle primero (por ejemplo, «leíste mal la marca: corregilo») al ver qué cambia?
2. Si quien subió la lista no contesta o cierra la pantalla, ¿la lista espera con la pregunta
   abierta, y la puede contestar otra persona con «Cargar listas»?
3. ¿Lo conversado queda guardado con el lector, para ver después por qué lee como lee?
