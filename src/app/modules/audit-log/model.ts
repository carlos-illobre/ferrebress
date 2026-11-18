// Lo que las vistas usan de este módulo (ADR-019): sus modelos, sus textos y las cuentas que
// muestran. Las vistas no importan nada más del módulo; index.ts es lo que va en el arranque.
export type { DetailLines } from './detail-lines.ts';
export { optionsOf, shownValue, type Which } from './filter-options.ts';
export { ledgerScroll } from './loading.ts';
export {
  browserOf,
  businessDay,
  byDay,
  dayTitle,
  hasFilters,
  initials,
  nearestMark,
  shortDateOf,
  stripScale,
  summaryDay,
  timeOf,
} from './logic.ts';
export type { RowLines } from './row-lines.ts';
export { auditLogSettings } from './settings.ts';
export { AuditLogContext, useAuditLog, useAuditLogContext } from './state.ts';
export { type Lane, lanesFor, lanesOf, nearest, swipeOf, timeline, visibleOf } from './tape.ts';
export { texts } from './texts.ts';
export { type TapeState, useTapeScreen } from './useTape.ts';
