# 08 · Listas de precios: pantallas

Qué muestra cada pantalla y qué se puede hacer en ella, por su funcionalidad. No dice cómo se ve:
la vista es provisoria y se puede cambiar sin tocar la lógica (constitución, «Cómo se trabaja»).
Las reglas están en [rules.md](rules.md); acá se nombran por su número.

Valen para todas, salvo que se diga otra cosa:

- **En el celular y en la computadora,** con las mismas reglas y los mismos textos (largos en la
  computadora, resumidos en el celular). En la computadora todo se hace con el teclado; en el
  celular, con una mano y sin desplazarse al costado.
- **Los estados de siempre:** cargando (00 · R7), sin conexión (gris con lo último que se vio y
  «Reintentar», R1.5), sin permiso (00 · R2, 02 · R7.7) y vacía (dice qué hacer).
- **Se espejan** con el celular y la computadora vinculados (R1.6).
- **Lo que no se puede usar no se ve:** cada acción aparece solo para quien tiene su permiso
  (R1.2).

## 1. Catálogo → Listas

Los proveedores y la entrada para subir una lista. **Maqueta de referencia:** «La mesa de entrada»
([computadora](../../design/mockups/price-lists-suppliers/desktop/variant-1-desk/) y
[celular](../../design/mockups/price-lists-suppliers/phone/variant-1-desk/)), ajustada a estas
reglas; para el avance de la lectura, la escena de «El estante»
([computadora](../../design/mockups/price-lists-suppliers/desktop/variant-3-shelf/)). La vista es
provisoria.

**Muestra:**

- Arriba, cuántos proveedores hay, cuántos tienen una lista en espera y cuántos una que no se pudo
  leer. Los dos últimos filtran la lista al tocarlos; tocar de nuevo saca el filtro.
- Un buscador de proveedores, que filtra mientras se escribe, sin distinguir acentos ni mayúsculas
  (R1.1).
- Los proveedores, en orden alfabético, cada uno con:
  - su nombre, su vendedor, su teléfono o WhatsApp, su correo y su nota (los ve cualquiera, R1.3);
  - la fecha de su última lista aplicada y hace cuántos días, o «Sin listas todavía» (con «Ver
    costos»);
  - si tiene algo pendiente: «En espera» (con un acceso a ver qué cambia) o «No se pudo leer» (con
    el motivo), con «Ver costos»;
  - «Subir lista» de ese proveedor (con «Cargar listas»).
- Los proveedores dados de baja no están en la lista: se ven con un filtro aparte, «Dados de baja»,
  cada uno con «Reactivar» (R2.5).

**Se puede:**

- Subir una lista sin decir de quién es (pantalla 2), con «Cargar listas». En la computadora,
  también soltando el archivo sobre la pantalla.
- Subir la lista de un proveedor en particular, desde su renglón: no se pregunta de quién es (R4.3).
- Dar de alta un proveedor con solo su nombre, con «Administrar proveedores» (R2.2); al subir una
  lista, también con «Cargar listas». El nombre
  repetido se rechaza en el lugar (E10).
- Abrir un proveedor (pantalla 4).

**Vacía:** sin proveedores, dice que el primer paso es subir la primera lista (o dar de alta un
proveedor, según los permisos de quien mira).

**Teclado (computadora):** un atajo para subir una lista, otro para dar de alta un proveedor y otro
para ir al buscador; ↑ ↓ recorren los proveedores sin sacar el cursor del buscador; Enter abre el
elegido.

## 2. Subir una lista

Se abre desde la pantalla 1 o desde la de un proveedor, sin salir de ella: lo que se está
subiendo se sigue viendo mientras se trabaja en otra cosa.

**El recorrido:**

1. Se elige el archivo (o se suelta). Si no es Excel o CSV, o pasa el tamaño máximo, se rechaza
   ahí mismo diciendo por qué, sin subirlo (R4.2).
2. Se ve el avance de la subida y, después, el de la lectura: cuántas filas leyó de cuántas
   (R4.9).
3. De quién es (R4.3): si lo reconoció su lector, se ve el proveedor con «Cambiar», sin
   preguntar; si se dedujo por el nombre, «¿Es de Bulonera Centro?», con «Sí» y «No, es de otro».
   Con «No», con «Cambiar» o si no se dedujo ninguno, se elige de una lista con buscador y
   «Proveedor nuevo», que deja escribir el nombre y, si se quiere, los demás datos (R2.2). La
   lectura sigue mientras tanto.
4. «Lista completa» (de arranque) o «Solo cambios», que se puede cambiar mientras sube y lee, con
   la aclaración de que una lista de solo cambios no da de baja nada (R4.7).
5. Si el proveedor ya tenía una lista en espera, se avisa que esta la reemplaza (R4.8).
6. Al terminar de leer, se pasa a ver qué cambia (pantalla 3).

**Se puede:** cancelar mientras sube o lee; la lista queda descartada y su archivo, guardado
(R4.11). Subir otras listas mientras tanto, de otros proveedores: cada una con su avance (R4.10).

**El avance de la lectura** se muestra como en la escena de lectura de la maqueta «El estante»: la
planilla que se lee fila por fila, con cuántas filas leyó de cuántas.

**Si no se pudo leer:** dice por qué, que la lista quedó guardada y que hay una anomalía para que
alguien la mire (R4.6). No pregunta qué columna es qué.

## 3. Ver qué cambia y aplicar

Una lista en espera, antes de aplicarla. Se llega al terminar de subirla o desde el estado «En
espera» de un proveedor.

**Muestra:**

- De quién es, su fecha, el nombre del archivo, si es completa o de solo cambios, quién la subió y
  cuándo (R6.2). Si la leyó un lector nuevo, «Lector nuevo: revisala» bien a la vista (R5.7).
- El resumen: nuevos, cambian de costo (con la variación promedio), quedan igual, ya no vienen y
  filas salteadas. Cada número filtra el detalle al tocarlo.
- «Para revisar», arriba de todo: los costos que cambian más que el porcentaje del ajuste (R6.4).
- El detalle, producto por producto: código, descripción, marca, costo anterior y nuevo, y cuánto
  cambia; los que cambian primero. Cada costo deja ver su cuenta (R3.4). Se busca por código o
  palabras, y se baja de a partes (R6.3).
- Las filas salteadas, cada una con lo que traía y su motivo.
- Si da de baja más que el porcentaje del ajuste, el aviso arriba (R6.5).
- Si la fecha es anterior a la última aplicada, por qué no se puede aplicar (R6.10).

**Se puede:**

- Aplicar, con «Cargar listas». El botón dice lo que va a pasar («Aplicar: 4 nuevos, 31 costos, 2
  bajas», o «Aplicar y dar de baja 812 productos»). Mientras se aplica se ve el avance; al
  terminar, cuántos productos se crearon, cuántos costos cambiaron y cuántos se dieron de baja
  (R6.6, E60). Si falla, dice por qué y la lista sigue en espera, con «Reintentar».
- Descartar, con «Cargar listas» (R6.11).
- Bajar el archivo original.

**Teclado (computadora):** un atajo para aplicar y otro para descartar; ↑ ↓ recorren el detalle;
Enter abre la cuenta del costo elegido.

## 4. El proveedor

Todo lo de un proveedor. Se llega desde la pantalla 1.

**Muestra, en partes:**

- **Datos:** nombre, vendedor, teléfono o WhatsApp, correo y nota (R2.1). Los ve cualquiera.
- **Cómo cobra** (con «Ver costos»): si sus precios incluyen IVA, sus descuentos en orden (nombre,
  porcentaje y si valen para todas las marcas o para una), su IVA de arranque y qué pasa con los
  costos al cambiar esto (R3.2).
- **Listas** (con «Ver costos»): todas, de la más nueva a la más vieja, con su fecha, su estado,
  quién la subió y quién la aplicó o descartó, cuándo, y su archivo para bajar (R6.7). La que está
  en espera lleva a la pantalla 3.
- **Productos** (con «Ver costos»): código, descripción, marca y costo con su cuenta, en orden
  alfabético, con un buscador; los dados de baja aparte, con desde qué lista dejaron de venir (R8).

**Se puede:**

- Cambiar cada dato y cómo cobra, con «Administrar proveedores»: se guarda al cambiarlo, con
  «Deshacer» (R1.7). Agregar, quitar y ordenar descuentos. Si el cambio recalcula costos, antes se
  ve cuántos cambian y se confirma (R3.5).
- Subir una lista de este proveedor, con «Cargar listas» (pantalla 2).
- Dar de baja el proveedor, con «Administrar proveedores», viendo antes cuántos productos pierden
  su costo y cuántos quedan dados de baja (R2.4); o reactivarlo si está dado de baja (R2.5).

**Teclado (computadora):** un atajo para cada parte y para subir una lista; en los descuentos, uno
para agregar y ↑ ↓ con Alt para cambiar el orden.

## 5. Más → Administración → Lectores

Los lectores de todos los proveedores (R5.8). Se llega desde Administración.

**Muestra:** cada proveedor con sus lectores; de cada lector, de dónde salió (escrito por un
programador, automático o generado por IA), desde cuándo existe, qué lista leyó por última vez y si
está activo. Se busca por proveedor.

**Se puede:** desactivar un lector y volver a activarlo, con «Cambiar los ajustes» (06 · R1.4),
con «Deshacer». La ve cualquiera con sesión, como Administración.

## Lo que se agrega a Administración

Las pantallas de Administración están en el [capítulo 06](../06-administration/screens.md): los
tres ajustes de las listas (06 · R8) y la pantalla de anomalías (06 · R9).
