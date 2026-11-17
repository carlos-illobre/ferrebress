// Lo que las vistas usan de las listas de precios (ADR-019): los modelos de sus pantallas, sus textos y
// las cuentas que muestran. Las vistas no importan nada más del módulo.

export {
  fileLines,
  inUse,
  type ListFiles,
  type ListFileView,
  megabytes,
  useListFiles,
} from './admin/files.ts';
export {
  groupsOf,
  type ReaderGroup,
  type Readers,
  readerLines,
  useReaders,
} from './admin/readers.ts';
export { filesTexts } from './admin/texts-files.ts';
export { readersTexts } from './admin/texts-readers.ts';
export { type CatalogPage, openReview, openSupplier, useCatalogPage } from './pages.ts';
export { type Review, useReview } from './review/review.ts';
export type { RowLines } from './review/rules.ts';
export { reviewTexts } from './review/texts.ts';
export { type Part, type Supplier, useSupplier } from './supplier/supplier.ts';
export { supplierTexts } from './supplier/texts.ts';
export { type Suppliers, useSuppliers } from './suppliers/suppliers.ts';
export type { SupplierFilter, SupplierLines } from './suppliers/suppliers-rules.ts';
export { suppliersTexts } from './suppliers/texts-suppliers.ts';
export type { UploadLines } from './uploads/rules.ts';
export { useAnyUpload } from './uploads/store.ts';
export { uploadsTexts } from './uploads/texts.ts';
export { type Uploads, useUploads } from './uploads/use-uploads.ts';
