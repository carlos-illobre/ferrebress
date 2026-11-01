# Lo que Carlos prefiere: lecciones de las comparaciones

Cuando Carlos compara las variantes del director de arte con una versión hecha afuera (por
ejemplo, con Copilot) y explica por qué una es mejor, la lección se anota acá. El director de arte
la lee antes de diseñar: son el gusto de Carlos, no reglas de una pantalla. Las imágenes de cada
caso están en `docs/design/references/<pantalla>/`.

## Principios

1. **Lo más importante ocupa la mayor parte de la pantalla.** Primero se pregunta qué viene a hacer
   la persona a esta pantalla, y eso va en el centro y en grande. Lo demás (cuentas, resúmenes,
   gráficos) entra solo si ayuda a esa tarea; si no aporta, no va, aunque quede lindo.
2. **Lo que se edita junto se ve junto.** Una cosa y sus partes en un mismo lugar (el rol, su
   descripción y sus permisos, en una sola vista), no una lista ancha y el detalle en un panel
   angosto al costado.
3. **Se entiende sin explicarla.** Al verla por primera vez, la persona sabe qué hace la pantalla
   y por dónde empieza. Ayudan los pasos numerados («1 Información», «2 Permisos») y una vista
   previa que muestra cómo queda lo que se arma.
4. **Lo principal está a la vista, no detrás de un botón.** Si para ver el formulario hay que tocar
   «Nuevo» y aparece en un rincón, la pantalla no explica su uso.
5. **Pensada para cuando crezca.** Se diseña para la cantidad real que va a haber (los permisos de
   todos los módulos, no los cinco de hoy): grupos que se pliegan, con su ícono y su contador
   («3 de 5»), y casillas en dos columnas adentro.
6. **Armonía.** Columnas proporcionadas, alineadas, con el mismo aire entre bloques. Nada que
   quede chico al lado de un espacio vacío.

## Casos

### Roles de Usuarios

- **La nuestra** (`ours-edit.png`, `ours-new.png`): arriba, las cuentas y «Quién puede qué»; abajo, la
  lista de roles; el rol elegido, en un panel angosto a la derecha. El rol nuevo aparece en ese
  mismo panel al tocar «Nuevo rol».
- **La de Copilot** (`copilot.webp`), que Carlos prefirió: una sola vista para crear o editar el
  rol, con dos columnas.
  - A la izquierda, «1 Información del rol» (nombre y descripción, con «98/200») y «2 Asignar
    permisos». Los permisos van por grupos que se pliegan, cada uno con su ícono, su detalle y
    «3 de 5», y con las casillas en dos columnas adentro.
  - A la derecha, la vista previa del rol: su ícono, su nombre, su descripción y, por grupo,
    cuántos permisos da, con una marca verde o gris.
- **Por qué es mejor, con palabras de Carlos:** «en un solo lugar ya está todo lo importante y bien
  distribuido, de manera armónica, y los permisos están junto al rol, lo que hace que sea más
  intuitivo aprender a usar esa pantalla». De la nuestra: «lo más importante de la pantalla ocupa
  un 25 % del espacio y el resto no aporta nada».
- **Lo que no se toma de Copilot:** su menú (el de la aplicación es otro) y el guardado general.
