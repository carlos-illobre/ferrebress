// Una lista como la guarda la base, y cómo se la lee.
import type {
  ListReason,
  ListRefusal,
  ListResult,
  ListScope,
  ListStatus,
  SupplierFrom,
} from '@ferrebress/shared/contracts/price-lists';
import { sql } from 'kysely';
import { type Db, dateText } from './db.ts';

export type ListRecord = {
  id: string;
  supplierId: string | null;
  supplierFrom: SupplierFrom | null;
  supplierConfirmed: boolean;
  status: ListStatus;
  waitingFor: 'supplier' | 'size' | null;
  scope: ListScope;
  fileSha: string | null;
  fileDeleting: boolean;
  fileName: string;
  listDate: string | null;
  dateFrom: string | null;
  readerId: string | null;
  newReader: boolean;
  rowsTotal: number | null;
  rowsRead: number | null;
  attempts: number;
  reason: ListReason | null;
  readAt: Date | null;
  sizeConfirmed: boolean;
  uploadedBy: string;
  uploadedAt: Date;
  decidedBy: string | null;
  decidedAt: Date | null;
  // Lo que hizo al aplicarse, o por cuánto se pasaba del tope si no se aplicó.
  result: ListResult | ListRefusal | null;
};

export type NewList = {
  id: string;
  fileSha: string;
  size: number;
  fileName: string;
  scope: ListScope;
  supplierId: string | null;
  by: string;
  at: Date;
};

export const hex = (sha: string) => Buffer.from(sha, 'hex');

export const columns = (db: Db) =>
  db.selectFrom('price_lists.lists').select([
    ...(['id', 'supplier_id as supplierId', 'supplier_from as supplierFrom'] as const),
    ...([
      'supplier_confirmed as supplierConfirmed',
      'status',
      'waiting_for as waitingFor',
    ] as const),
    ...([
      'scope',
      'file_name as fileName',
      'date_from as dateFrom',
      'reader_id as readerId',
    ] as const),
    ...(['new_reader as newReader', 'rows_total as rowsTotal', 'rows_read as rowsRead'] as const),
    ...(['attempts', 'reason', 'read_at as readAt', 'size_confirmed as sizeConfirmed'] as const),
    ...(['uploaded_by as uploadedBy', 'uploaded_at as uploadedAt'] as const),
    ...(['decided_by as decidedBy', 'decided_at as decidedAt', 'result'] as const),
    sql<string | null>`encode(file_sha256, 'hex')`.as('fileSha'),
    // Borrado a mano, esperando el «Deshacer» (06 · R10.2): ya no se ofrece.
    sql<boolean>`exists (select 1 from price_lists.files f where f.sha256 = file_sha256
        and f.deleting_at is not null)`.as('fileDeleting'),
    dateText('list_date').as('listDate'),
  ]);
