// Lo que las vistas usan de las listas de precios (ADR-019): los modelos de sus pantallas, sus textos y
// las cuentas que muestran. Las vistas no importan nada más del módulo.
export { groupsOf, type ReaderGroup, type Readers, readerLines, useReaders } from './readers.ts';
export { readersTexts } from './texts-readers.ts';
