// Los textos de Anomalías (06 · pantalla 2, R9): largos en la computadora, que explican, y cortos en el
// celular, que dicen lo mismo (00 · R1.5).
import type { AnomalyKind, AnomalyStatus } from '@ferrebress/shared/contracts/anomalies';

export const texts = {
  title: 'Anomalías',
  parent: 'Administración',
  about: {
    long: 'Lo que el sistema encontró y alguien tiene que mirar. Al revisar una se la marca «Revisada», con una nota si se quiere; algunas se cierran solas.',
    short: 'Lo que alguien tiene que mirar.',
  },
  kinds: {
    'price-list-unreadable': 'No se pudo leer la lista',
    'price-list-skipped-rows': 'Filas salteadas',
  } satisfies Record<AnomalyKind, string>,
  statuses: {
    open: 'Abiertas',
    reviewed: 'Revisadas',
    closed: 'Cerradas',
  } satisfies Record<AnomalyStatus, string>,
  allKinds: 'Todas',
  filterStatus: 'Estado',
  filterKind: 'Tipo',
  noSupplier: 'Sin proveedor todavía',
  skipped: (n: number) => (n === 1 ? 'Salteó 1 fila' : `Salteó ${n.toLocaleString('es-AR')} filas`),
  reason: (n: number, why: string) => `${n.toLocaleString('es-AR')} ${why}`,
  when: (since: string) => `Pasó ${since}`,
  reviewedBy: (who: string, since: string) => `Revisada por ${who} ${since}`,
  someone: 'otra persona',
  closedAt: (since: string) => `Se cerró sola ${since}`,
  open: 'Ver el detalle',
  close: 'Cerrar el detalle',
  // El nombre accesible de cada una: su tipo y qué hace tocarla.
  headLabel: (kind: string, open: boolean) =>
    `${kind}: ${open ? 'Cerrar el detalle' : 'Ver el detalle'}`,
  rows: 'Las filas salteadas',
  rowsNeedCosts: 'Lo que traía cada fila lo ve quien tiene «Ver costos».',
  rowsFailed: 'No se pudieron traer las filas.',
  noRows: 'Ya no se guardan las filas de esta lista.',
  rowReason: (why: string) => `Salteada: ${why}`,
  more: 'Ver más',
  note: 'Nota (si querés)',
  review: 'Marcar revisada',
  reopen: 'Volver a abrir',
  reviewed: 'Marcada revisada',
  reopened: 'Volvió a las abiertas',
  changed: 'Otra persona la cambió recién: así está ahora.',
  failed: 'No se pudo guardar. Probá de nuevo.',
  empty: 'No hay nada para revisar.',
  emptyFiltered: 'No hay anomalías con ese filtro.',
  loading: 'Cargando las anomalías…',
  loadFailed: 'No se pudieron traer las anomalías.',
  retry: 'Reintentar',
  offline: (at: string) => ({
    long: `Sin conexión: es lo último que se vio, a las ${at}. Con conexión se puede marcar.`,
    short: `Sin conexión · ${at}`,
  }),
};
