// Los textos de subir una lista (08 · pantalla 2): largos en la computadora, que explican, y cortos en
// el celular, que dicen lo mismo (00 · R1.5).

export const uploadsTexts = {
  title: 'Listas que se suben',
  upload: 'Subir lista',
  drop: 'Soltá el archivo para subirlo',
  // R4.2: se rechaza antes de subir.
  notSheet: (name: string) => `${name}: no es una planilla de Excel ni un CSV.`,
  tooBig: (name: string, mb: number) => `${name}: pasa el tamaño máximo de ${mb} MB.`,
  sending: (percent: number) => `Subiendo… ${percent} %`,
  queued: 'Esperando su turno para leerse',
  applyingFirst: 'Otra lista de este proveedor se está aplicando: esta espera su turno.',
  reading: (read: string, total?: string) =>
    total ? `Leyendo: ${read} de ${total} filas` : `Leyendo: ${read} filas`,
  read: (rows: string) => `Leída: ${rows} filas`,
  // R4.12: una planilla muy grande.
  big: (rows: string) => ({
    long: `Tiene ${rows} filas: leerla puede tardar varios minutos.`,
    short: `${rows} filas: puede tardar.`,
  }),
  readAnyway: 'Leer igual',
  // R4.3: de quién es.
  supplierIs: (name: string) => `De ${name}`,
  isIt: (name: string) => `¿Es de ${name}?`,
  yes: 'Sí',
  notThis: 'No, es de otro',
  change: 'Cambiar',
  whose: '¿De qué proveedor es?',
  searchSupplier: 'Buscar el proveedor',
  newSupplier: 'Proveedor nuevo',
  newName: 'Nombre del proveedor nuevo',
  createAndUse: 'Dar de alta y usar',
  exists: 'Ya hay un proveedor con ese nombre.',
  existsInactive: 'Ese proveedor está dado de baja: reactivalo desde Listas.',
  invalidName: 'El nombre va de 1 a 80 letras.',
  // R4.7.
  full: 'Lista completa',
  partial: 'Solo cambios',
  partialSays: 'Una lista de solo cambios no da de baja nada.',
  // R4.8.
  replaces: 'Reemplaza la lista de este proveedor que estaba en espera.',
  // R4.6.
  unreadable: (why: string) => ({
    long: `No se pudo leer: ${why}. La lista quedó guardada y hay una anomalía para que alguien la mire.`,
    short: `No se pudo leer: ${why}.`,
  }),
  discarded: 'Se descartó.',
  cancel: 'Cancelar',
  cancelled: 'Cancelada',
  close: 'Cerrar',
  review: 'Ver qué cambia',
  failed: 'No se pudo subir. Probá de nuevo.',
  saveFailed: 'No se pudo guardar. Probá de nuevo.',
  formats: 'Se aceptan planillas de Excel (.xlsx, .xls) y CSV.',
};
