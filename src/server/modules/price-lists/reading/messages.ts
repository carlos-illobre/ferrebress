// Lo que se dicen el servidor y el proceso lector (ADR-021): el trabajo de leer una lista y lo que el
// proceso va contando. Viaja por el canal del proceso, con `serialization: 'advanced'` (los precios
// son `bigint`).
import type { Head } from '@ferrebress/shared/contracts/price-lists';
import type { AutoParams } from '../rules/auto.ts';
import type { ProductRow, SkippedRow } from '../rules/check.ts';
import type { ListDate } from '../rules/deduce.ts';
import type { SandboxLimits } from './sandbox.ts';

// Un lector guardado: el de un programador o uno automático ya activo.
export type JobReader = { id: string; supplierId: string | null; code: string; params: unknown };

export type Job = {
  listId: string;
  attempt: number;
  path: string;
  fileName: string;
  // El proveedor, si ya se sabe (desde su pantalla, elegido o confirmado).
  supplierId: string | null;
  // Los activos, del más nuevo al más viejo; los de proveedores dados de baja no vienen.
  readers: JobReader[];
  suppliers: { id: string; nameKey: string }[];
  today: string;
  // Desde cuántas filas se pregunta antes de leer (06 · R8.5); `null`, ya se confirmó.
  confirmRows: number | null;
  autoCode: string;
  limits: SandboxLimits;
};

export type ChosenReader = { id: string } | { template: 'auto-1'; params: AutoParams };

export type UnreadableReason =
  | 'too-big'
  | 'damaged'
  | 'empty'
  | 'no-reader'
  | 'auto-unsure'
  | 'reader-failed'
  | 'crashed';

export type JobMessage =
  | { type: 'opened'; rows: number }
  | { type: 'size'; rows: number }
  | {
      type: 'chosen';
      reader: ChosenReader;
      supplier: { id: string; from: 'reader' | 'name' } | null;
      date: ListDate;
      head: Head;
    }
  | { type: 'block'; products: ProductRow[]; skipped: SkippedRow[]; rowsRead: number }
  | { type: 'done' }
  | { type: 'failed'; reason: UnreadableReason };
