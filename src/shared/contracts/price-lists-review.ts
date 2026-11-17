// Ver qué cambia y aplicar una lista (08 · R6), los productos de un proveedor (R8), los lectores (R5.8)
// y los archivos de las listas (06 · R10): lo que piden y devuelven sus rutas.
import * as z from 'zod/mini';
import type { CostBasis } from '../pricing/basis.ts';
import type { ListReason, ListStatus, SkipReason } from './price-lists-reader.ts';

// El resumen (R6.2) y los números del botón (R6.5).
export type ListSummary = {
  new: number;
  changed: number;
  same: number;
  // Los que el proveedor tenía y la lista completa no trae (R7.4); en una de solo cambios, 0.
  gone: number;
  skipped: number;
  reasons: Partial<Record<SkipReason, number>>;
  // La variación promedio de los que cambian, en por ciento con un decimal.
  averageChange: number | null;
  // Los que cambian más que el porcentaje para revisar (R6.4).
  review: number;
  // Si da de baja más que el porcentaje de bajas (R6.5).
  goneWarning: boolean;
  // La última aplicada del proveedor es más nueva (R6.10).
  tooOld: boolean;
};

export type ListNumbers = { new: number; changed: number; gone: number };

// Los números del botón de aplicar (R6.5): los que vio quien aplica deben ser los de ahora (E64).
export const numbersOf = (summary: ListSummary): ListNumbers => ({
  new: summary.new,
  changed: summary.changed,
  gone: summary.gone,
});

// Lo que hizo al aplicarse (E60).
export type ListResult = { created: number; changed: number; gone: number; restored: number };

export const rowsShows = ['changed', 'new', 'same', 'review', 'skipped', 'gone'] as const;
export type RowsShow = (typeof rowsShows)[number];
export const rowsPageSize = 50;

export const rowsQuery = z.strictObject({
  show: z.optional(z.enum(rowsShows)),
  q: z.optional(z.string().check(z.maxLength(80))),
  after: z.optional(z.string().check(z.regex(/^[0-9a-zA-Z.:_-]{1,120}$/))),
});
export type RowsQuery = z.infer<typeof rowsQuery>;

// Una fila del detalle (R6.3): lo que trae, el costo que tenía y el nuevo, con su cuenta.
export type ListRow = {
  code: string | null;
  description: string | null;
  brand?: string;
  change?: 'new' | 'changed' | 'same';
  cost?: string;
  previous?: string;
  // En por ciento con un decimal.
  variation?: number;
  basis?: CostBasis;
  skipped?: SkipReason;
  cells?: string[];
};
export type RowsPage = { rows: ListRow[]; next?: string };

export const applyBody = z.strictObject({
  expected: z.strictObject({
    new: z.int().check(z.minimum(0)),
    changed: z.int().check(z.minimum(0)),
    gone: z.int().check(z.minimum(0)),
  }),
});
export type ApplyBody = z.infer<typeof applyBody>;
export type NumbersChanged = { error: 'numbers-changed'; numbers: ListNumbers };

// --- Las listas de un proveedor (R6.7) y sus productos (R8) ---

export type SupplierList = {
  id: string;
  status: ListStatus;
  fileName: string;
  listDate?: string;
  uploadedAt: string;
  uploadedBy?: string;
  decidedBy?: string;
  decidedAt?: string;
  reason?: ListReason;
  result?: ListResult;
  file: boolean;
};
export type SupplierListsPage = { lists: SupplierList[]; next?: string };

export const itemsQuery = z.strictObject({
  q: z.optional(z.string().check(z.maxLength(80))),
  discontinued: z.optional(z.enum(['true', 'false'])),
  after: z.optional(z.string().check(z.maxLength(400))),
});
export const itemsPageSize = 50;

// Un artículo de un proveedor (R8.1, R8.2): con su costo y su cuenta.
export type SupplierItem = {
  code: string;
  description: string;
  brand?: string;
  cost: string;
  basis: CostBasis;
  discontinued: boolean;
  // Desde qué lista dejó de venir (R8.2); sin lista, se dio de baja al proveedor.
  goneSince?: { listId?: string; listDate?: string };
};
export type ItemsPage = { items: SupplierItem[]; next?: string };

// --- Lectores (R5.8) ---

export type ReaderOrigin = 'programmer' | 'auto' | 'ai';
export type ReaderView = {
  id: string;
  origin: ReaderOrigin;
  supplier?: { id: string; name: string };
  active: boolean;
  createdAt: string;
  // La última lista que leyó.
  lastList?: { id: string; fileName: string; listDate?: string };
};
export type ReadersResponse = { readers: ReaderView[] };
export const readerActiveBody = z.strictObject({ active: z.boolean() });
export const readerSupplierBody = z.strictObject({
  supplierId: z.string().check(z.regex(/^[0-9a-f-]{36}$/)),
});

// --- Archivos de listas (06 · R10) ---

export type ListFileView = {
  sha256: string;
  size: number;
  storedAt: string;
  // Marcado para borrar, esperando el «Deshacer» (R10.2).
  deleting: boolean;
  // Las listas que lo usan, con su proveedor y su estado.
  lists: { id: string; fileName: string; status: ListStatus; supplier?: string }[];
};
export type FilesPage = {
  files: ListFileView[];
  next?: string;
  // Cuánto ocupan entre todos, contra el ajuste (06 · R8.6).
  totalBytes: number;
  limitBytes: number;
};
export const filesQuery = z.strictObject({
  after: z.optional(z.string().check(z.regex(/^\d{1,16}_[0-9a-f]{64}$/))),
});
