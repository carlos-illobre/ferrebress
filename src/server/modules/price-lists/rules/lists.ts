// Cómo se muestra una lista (08 · R4.9, R6.7), sin tecnología: su avance y su estado.
import type {
  ListProgress,
  ListState,
  SupplierFrom,
} from '@ferrebress/shared/contracts/price-lists';
import type { ListRecord } from '../data/reading.ts';

export const progressOf = (list: ListRecord): ListProgress => ({
  status: list.status,
  rowsRead: list.rowsRead ?? 0,
  ...(list.waitingFor && { waitingFor: list.waitingFor }),
  ...(list.rowsTotal !== null && { rowsTotal: list.rowsTotal }),
  ...(list.reason && { reason: list.reason }),
  ...(list.result && 'over' in list.result && { over: list.result.over }),
});

export function stateOf(list: ListRecord, supplierName: string | undefined): ListState {
  return {
    id: list.id,
    ...progressOf(list),
    fileName: list.fileName,
    scope: list.scope,
    ...(list.supplierId &&
      supplierName !== undefined && {
        supplier: {
          id: list.supplierId,
          name: supplierName,
          // Se fija junto con el proveedor.
          from: list.supplierFrom as SupplierFrom,
          confirmed: list.supplierConfirmed,
        },
      }),
    ...(list.listDate && { listDate: list.listDate }),
    ...(list.dateFrom && { dateFrom: list.dateFrom }),
    ...(list.newReader && { newReader: true as const }),
    uploadedAt: list.uploadedAt.toISOString(),
    file: list.fileSha !== null && !list.fileDeleting,
  };
}

// De qué lista es una anomalía (06 · R9): el mismo nombre al abrirla y al cerrarla.
export const subjectOf = (listId: string) => `price-lists:list:${listId}`;
