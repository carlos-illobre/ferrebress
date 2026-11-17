// Los textos de Archivos de listas (06 · pantalla 3, R10): largos en la computadora, que explican, y
// cortos en el celular, que dicen lo mismo (00 · R1.5).

export const filesTexts = {
  title: 'Archivos de listas',
  parent: 'Administración',
  about: {
    long: 'Los archivos originales de las listas que se subieron. Los más viejos se borran solos cuando no entran en el espacio; acá se puede bajar o borrar uno.',
    short: 'Los originales de las listas subidas.',
  },
  // «80 MB de 100 MB» (E55).
  used: (used: string, limit: string) => `${used} de ${limit}`,
  usedLabel: 'Ocupan',
  megabytes: (mb: string) => `${mb} MB`,
  stored: (when: string) => `Subido ${when}`,
  noSupplier: 'Sin proveedor todavía',
  download: 'Bajar',
  downloadFailed: 'No se pudo bajar el archivo. Probá de nuevo.',
  fileGone: 'Ese archivo ya no se guarda.',
  tooMany: 'Ya se están bajando dos archivos: esperá que termine uno.',
  remove: 'Borrar',
  removed: 'Archivo borrado',
  undo: 'Deshacer',
  restored: 'El archivo volvió',
  failed: 'No se pudo borrar. Probá de nuevo.',
  // E54: el de una lista que se lee o se aplica no se borra, y se dice por qué.
  inUse: 'Su lista se está leyendo o aplicando: no se puede borrar ahora.',
  noPermission: 'Para borrar un archivo hace falta «Cambiar los ajustes».',
  noCosts: 'Para ver los archivos de las listas hace falta «Ver costos».',
  empty: 'No hay archivos guardados.',
  more: 'Ver más',
  loading: 'Cargando los archivos…',
  loadFailed: 'No se pudieron traer los archivos.',
  retry: 'Reintentar',
  offline: (at: string) => ({
    long: `Sin conexión: es lo último que se vio, a las ${at}. Con conexión se puede bajar o borrar.`,
    short: `Sin conexión · ${at}`,
  }),
};
