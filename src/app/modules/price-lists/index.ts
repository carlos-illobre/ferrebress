// Las listas de precios (capítulo 08): a los demás módulos les dan cómo se dicen los motivos de una
// lista y sus filas salteadas, para las anomalías (06 · R9, 08 · R9.2). Lo que usan las vistas está en
// model.ts (ADR-019), y sus pantallas, en cada vista (views/<view>/price-lists/).
export { skippedRows } from './api.ts';
export { listReasonTexts, skipReasonTexts } from './texts-status.ts';
