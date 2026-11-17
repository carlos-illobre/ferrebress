// Los textos de Catálogo → Listas (08 · pantalla 1): largos en la computadora, que explican, y cortos
// en el celular, que dicen lo mismo (00 · R1.5).

export const suppliersTexts = {
  title: 'Listas',
  suppliers: (n: number) => (n === 1 ? '1 proveedor' : `${n.toLocaleString('es-AR')} proveedores`),
  waiting: (n: number) => (n === 1 ? '1 en espera' : `${n.toLocaleString('es-AR')} en espera`),
  unreadableCount: (n: number) =>
    n === 1 ? '1 no se pudo leer' : `${n.toLocaleString('es-AR')} no se pudieron leer`,
  inactive: 'Dados de baja',
  search: { long: 'Buscar un proveedor', short: 'Buscar' },
  lastList: (date: string, ago: string) => `Última lista: ${date} · ${ago}`,
  daysAgo: (n: number) => (n === 0 ? 'hoy' : n === 1 ? 'ayer' : `hace ${n} días`),
  noLists: 'Sin listas todavía',
  statuses: {
    queued: 'Esperando su turno para leerse',
    reading: 'Leyéndose',
    pending: 'En espera',
    applying: 'Aplicándose',
  },
  unreadable: (why: string) => `No se pudo leer: ${why}`,
  review: 'Ver qué cambia',
  phone: 'Llamar',
  whatsapp: 'WhatsApp',
  email: 'Correo',
  // Alta (R2.2): con solo el nombre.
  add: 'Proveedor nuevo',
  name: 'Nombre del proveedor',
  create: 'Dar de alta',
  cancel: 'Cancelar',
  created: (name: string) => `${name}: dado de alta`,
  exists: 'Ya hay un proveedor con ese nombre.',
  existsInactive: 'Ese proveedor está dado de baja.',
  invalidName: 'El nombre va de 1 a 80 letras.',
  reactivate: 'Reactivar',
  reactivated: (name: string) => `${name}: reactivado`,
  failed: 'No se pudo guardar. Probá de nuevo.',
  empty: {
    load: {
      long: 'Todavía no hay proveedores. El primer paso es subir la primera lista: el proveedor se da de alta solo.',
      short: 'Todavía no hay proveedores: subí la primera lista.',
    },
    manage: {
      long: 'Todavía no hay proveedores. El primer paso es dar de alta uno.',
      short: 'Todavía no hay proveedores: dá de alta uno.',
    },
    none: {
      long: 'Todavía no hay proveedores.',
      short: 'Todavía no hay proveedores.',
    },
  },
  noMatch: 'Ningún proveedor con ese nombre.',
  noInactive: 'No hay proveedores dados de baja.',
  noFiltered: 'Ningún proveedor con eso pendiente.',
  loading: 'Cargando los proveedores…',
  loadFailed: 'No se pudieron traer los proveedores.',
  retry: 'Reintentar',
  offline: (at: string) => ({
    long: `Sin conexión: es lo último que se vio, a las ${at}. Con conexión se puede cambiar.`,
    short: `Sin conexión · ${at}`,
  }),
};
