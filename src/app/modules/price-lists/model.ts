// Lo que las vistas usan de las listas de precios (ADR-019): los modelos de sus pantallas, sus textos y
// las cuentas que muestran. Las vistas no importan nada más del módulo.

export {
  fileLines,
  inUse,
  type ListFiles,
  type ListFileView,
  megabytes,
  useListFiles,
} from './files.ts';
export { groupsOf, type ReaderGroup, type Readers, readerLines, useReaders } from './readers.ts';
export { filesTexts } from './texts-files.ts';
export { readersTexts } from './texts-readers.ts';
