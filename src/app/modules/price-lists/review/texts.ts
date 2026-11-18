// Los textos de ver qué cambia y aplicar (08 · pantalla 3): largos en la computadora, que explican, y
// cortos en el celular, que dicen lo mismo (00 · R1.5).

const n = (count: number) => count.toLocaleString('es-AR');
const plural = (count: number, one: string, many: string) => (count === 1 ? one : many);

export const reviewTexts = {
  title: 'Ver qué cambia',
  back: 'Listas',
  of: (supplier: string) => `Lista de ${supplier}`,
  noSupplier: 'Sin proveedor todavía',
  date: (date: string) => `Fecha de la lista: ${date}`,
  noDate: 'Sin fecha',
  full: 'Lista completa',
  partial: 'Solo cambios: no da de baja nada',
  uploaded: (who: string, when: string) => `La subió ${who} ${when}`,
  someone: 'alguien',
  newReader: {
    long: 'Lector nuevo: revisala antes de aplicar. Es la primera vez que se lee este formato.',
    short: 'Lector nuevo: revisala.',
  },
  // El resumen (R6.2): cada número filtra el detalle.
  chips: {
    review: (count: number) => `${n(count)} para revisar`,
    new: (count: number) => `${n(count)} ${plural(count, 'nuevo', 'nuevos')}`,
    changed: (count: number, average: string) =>
      `${n(count)} ${plural(count, 'cambia', 'cambian')} de costo${average ? ` (${average} en promedio)` : ''}`,
    same: (count: number) => `${n(count)} ${plural(count, 'queda igual', 'quedan igual')}`,
    gone: (count: number) => `${n(count)} ya no ${plural(count, 'viene', 'vienen')}`,
    skipped: (count: number) => `${n(count)} ${plural(count, 'fila salteada', 'filas salteadas')}`,
  },
  all: 'Todos',
  reviewNote: {
    long: 'Para revisar: los costos que cambian más que el porcentaje del ajuste. Una columna mal leída puede cambiar mil costos de golpe.',
    short: 'Cambian más que el porcentaje del ajuste.',
  },
  goneWarning: (count: number) => ({
    long: `Ojo: da de baja ${n(count)} productos de este proveedor, más que el porcentaje del ajuste.`,
    short: `Da de baja ${n(count)} productos.`,
  }),
  tooOld: {
    long: 'No se puede aplicar: su fecha es anterior a la de la última lista aplicada de este proveedor. Se puede descartar.',
    short: 'Es más vieja que la última aplicada: no se aplica.',
  },
  search: { long: 'Buscar por código, descripción o marca', short: 'Buscar' },
  // El botón dice lo que va a pasar (R6.5).
  apply: (numbers: { new: number; changed: number; gone: number }) =>
    `Aplicar: ${n(numbers.new)} ${plural(numbers.new, 'nuevo', 'nuevos')}, ${n(numbers.changed)} ${plural(numbers.changed, 'costo', 'costos')}, ${n(numbers.gone)} ${plural(numbers.gone, 'baja', 'bajas')}`,
  applyAndDrop: (gone: number) => `Aplicar y dar de baja ${n(gone)} productos`,
  applying: (done: number, total?: number) =>
    total ? `Aplicando: ${n(done)} de ${n(total)} filas` : `Aplicando: ${n(done)} filas`,
  applied: (result: { created: number; changed: number; gone: number }) =>
    `Aplicada: ${n(result.created)} ${plural(result.created, 'producto creado', 'productos creados')}, ${n(result.changed)} ${plural(result.changed, 'costo cambiado', 'costos cambiados')}, ${n(result.gone)} ${plural(result.gone, 'dado de baja', 'dados de baja')}.`,
  numbersChanged: 'Cambió algo desde que se abrió: el botón dice ahora lo que va a pasar.',
  alreadyApplying: 'Otra persona la está aplicando.',
  alreadyApplied: 'Ya se aplicó.',
  closed: 'Esta lista ya no está en espera.',
  applyFailed: (why: string) => `No se aplicó: ${why}. La lista sigue en espera.`,
  failed: 'No se pudo. Probá de nuevo.',
  discard: 'Descartar',
  discarded: 'Lista descartada',
  cancel: 'Cancelar',
  download: 'Bajar el archivo',
  noFile: 'Ya no se guarda el archivo',
  // El detalle (R6.3).
  previousCost: (amount: string) => `Antes ${amount}`,
  newCost: (amount: string) => `Ahora ${amount}`,
  noPrevious: 'Nuevo',
  gone: 'Ya no viene',
  flaggedTitle: 'Para revisar',
  allTitle: 'Todos',
  allFlagged: 'Ver todos los para revisar',
  howCost: 'Ver la cuenta',
  hideCost: 'Ocultar la cuenta',
  // Como en E17: «Precio de lista $ 2.314,00», «− 25 % General = $ 1.735,50».
  steps: {
    list: (amount: string) => `Precio de lista ${amount}`,
    vat: (vat: string, amount: string) => `− ${vat} % IVA = ${amount}`,
    discount: (name: string, percent: string, amount: string) =>
      `− ${percent} % ${name} = ${amount}`,
    date: (date: string) => `De la lista del ${date}`,
  },
  skippedRow: (why: string) => `Salteada: ${why}`,
  more: 'Ver más',
  empty: 'Ningún producto con eso.',
  rowsFailed: 'No se pudieron traer los productos.',
  loading: 'Cargando la lista…',
  loadFailed: 'No se pudo traer la lista.',
  retry: 'Reintentar',
  offline: (at: string) => ({
    long: `Sin conexión: es lo último que se vio, a las ${at}. Con conexión se puede aplicar.`,
    short: `Sin conexión · ${at}`,
  }),
  statuses: {
    applied: 'Aplicada',
    discarded: 'Descartada',
    unreadable: 'No se pudo leer',
    reading: 'Todavía se está leyendo',
    queued: 'Esperando su turno para leerse',
  },
};
