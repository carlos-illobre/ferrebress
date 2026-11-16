// Los atajos de Quién hizo qué (05 · R4.5, R4.6): cada filtro, sacar los filtros, «Actualizar solo» y
// «3 nuevas». Las teclas están en keyboard/shortcuts/keymap.ts.
import { defineShortcuts } from '@ferrebress/keyboard';
import type { Which } from '../filter-options.ts';
import { hasFilters } from '../logic.ts';
import type { AuditLogState } from '../state.ts';

// Los filtros se ven con la lista ya traída.
const filter = (which: Which) => (log: AuditLogState) => !!log.page && log.toggleFilter(which);

export const shortcuts = defineShortcuts<AuditLogState>('audit-log', {
  by: filter('by'),
  to: filter('to'),
  dates: filter('dates'),
  kind: filter('kind'),
  clearFilters: (log) => !!log.page && hasFilters(log.filters) && void log.clear(),
  live: (log) => log.live.shown && log.online && log.live.toggle(),
  newOnes: (log) => log.live.on && log.live.shown && log.newOnes > 0 && log.showNew(),
});
