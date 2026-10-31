# El manual

El manual de Ferrebress para quien atiende la ferretería: un capítulo por módulo, escrito en el
paso 9 de cada uno (constitución). La aplicación lo arma desde estos archivos; cómo, en el
[diseño técnico](../technical/modules/manual.md).

## Cómo se escribe

- **El orden** de los capítulos es el de la lista de abajo. Para cambiarlo, se mueve el renglón:
  nada más.
- **Un renglón** tiene, separados por «·», el identificador (el nombre del módulo, en inglés), el
  nombre, el ícono y, al final, el archivo del capítulo si está escrito. Sin archivo, el capítulo
  falta: dice «Pronto». Con `→ <capítulo>: <tarea> (<dispositivo>), …`,
  lleva a esas tareas de otro capítulo, una por dispositivo.
- **Un capítulo** tiene su título (el mismo nombre que en la lista), la introducción de cada
  dispositivo y sus tareas, en el orden en que salen. La forma de cada tarea está en
  [sign-in.md](sign-in.md).
- **El título de cada tarea es una pregunta** que orienta a quien lee, y la tarea es su respuesta:
  «¿Cómo se autoriza a un usuario?». El lector rechaza un título que no empieza con «¿» y termina
  con «?».
- **Cada paso tiene su captura** de la aplicación: es lo que le da contexto a quien lee. Lo que pasa
  fuera de Ferrebress (Google, la cámara, el dedo) se dice en el paso que tiene la pantalla. El
  lector rechaza un paso sin captura.
- **Las capturas** (`media/`) no se hacen a mano: las saca `pnpm manual:media` de la aplicación.

## Los capítulos, en orden

- sign-in · Entrar · log-in · sign-in.md
- sales · Vender · shopping-cart
- catalog · Productos · tags
- price-lists · Listas de precios · file-text
- stock · Stock · package
- purchases · Compras · truck
- stock-counts · Contar · list-checks
- business-overview · Números del negocio · chart-column
- users · Personas · user-round · users.md
- audit-log · Auditoría · history
- processes · Procesos · workflow
- tickets · Mejoras y errores · bug
- device-settings · Configuración · settings
- device-link · Celular y computadora · smartphone
- administration · Administración · sliders-horizontal
- customers · Clientes · users
- offline · Trabajar sin conexión · wifi-off · → sign-in: no-internet (computadora), offline (celular)
