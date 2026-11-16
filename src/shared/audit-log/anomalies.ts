// Los tipos de acción de las anomalías (06 · R9.7) en Quién hizo qué, en el grupo de Administración:
// marcar una revisada, con la nota, y volver a abrirla.
import type { AnomalyKind } from '../contracts/anomalies.ts';
import { type Entry, text, thing } from './kinds.ts';

const kinds: Record<AnomalyKind, string> = {
  'price-list-unreadable': 'una lista que no se pudo leer',
  'price-list-skipped-rows': 'las filas salteadas de una lista',
};
const kindOf = (raw: unknown): string =>
  Object.hasOwn(kinds, String(raw)) ? kinds[raw as AnomalyKind] : 'una anomalía';

export const anomaliesTypes = {
  'anomalies.reviewed': {
    group: 'administration',
    tone: 'plain',
    icon: 'clipboard-check',
    name: 'Marcó revisada una anomalía',
    shows: ['kind', 'note'],
    says: (e) => [
      text(`Marcó revisada ${kindOf(e.data.kind)}`),
      ...(typeof e.data.note === 'string' ? [text(': '), thing(e.data.note)] : []),
    ],
  },
  'anomalies.reopened': {
    group: 'administration',
    tone: 'plain',
    icon: 'clipboard-list',
    name: 'Volvió a abrir una anomalía',
    shows: ['kind'],
    says: (e) => [text(`Volvió a abrir ${kindOf(e.data.kind)}`)],
  },
} satisfies Record<string, Entry>;
