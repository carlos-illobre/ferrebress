// La lista de Administración (06 · pantalla 1), resuelta para cualquier vista: los ajustes en grupos,
// cada uno con su panel, su nombre, su valor como se muestra y su atajo; y las páginas de abajo, cada
// una con su nombre, qué tiene y, la de Anomalías, cuántas hay abiertas (R9.5).
import type { Settings } from '@ferrebress/shared/contracts/administration';
import { useMenuCount } from '../frame/index.ts';
import { shown } from './logic.ts';
import { useAdminLinks } from './pages.ts';
import { names, type Panel, pagesTexts } from './texts.ts';

// command: el atajo que lo elige (shortcuts/administration.ts).
type Row = {
  panel: Panel;
  name: string;
  command: string;
  value: (s: Settings, clock: string) => string;
};

const groups: { title: string; rows: Row[] }[] = [
  {
    title: 'Precios',
    rows: [
      {
        panel: 'roundingStep',
        name: names.roundingStep,
        command: 'roundingStep',
        value: (s) => shown('roundingStep', s.roundingStep),
      },
      {
        panel: 'quickMargins',
        name: names.quickMargins,
        command: 'quickMargins',
        value: (s) => `${s.quickMargins[0]} a ${s.quickMargins[4]} %`,
      },
    ],
  },
  {
    title: 'Listas de precios',
    rows: [
      {
        panel: 'lists',
        name: names.reviewPercent,
        command: 'lists',
        value: (s) => shown('reviewPercent', s.reviewPercent),
      },
      {
        panel: 'lists',
        name: names.maxFileMb,
        command: 'lists-upload',
        value: (s) => shown('maxFileMb', s.maxFileMb),
      },
      {
        panel: 'lists',
        name: names.filesMb,
        command: 'lists-files',
        value: (s) => shown('filesMb', s.filesMb),
      },
    ],
  },
  {
    title: 'Negocio',
    rows: [{ panel: 'zone', name: names.zone, command: 'zone', value: (_, clock) => clock }],
  },
  {
    title: 'Acceso',
    rows: [
      {
        panel: 'session',
        name: names.sessionIdle,
        command: 'sessionIdle',
        value: (s) => shown('sessionIdle', s.sessionIdle),
      },
      {
        panel: 'session',
        name: names.sessionMax,
        command: 'sessionMax',
        value: (s) => shown('sessionMax', s.sessionMax),
      },
      {
        panel: 'pairingDays',
        name: names.pairingDays,
        command: 'pairingDays',
        value: (s) => shown('pairingDays', s.pairingDays),
      },
    ],
  },
];

// Los ajustes con su valor de ahora; `clock`, la hora del negocio como se muestra.
export const settingGroups = (settings: Settings, clock: string) =>
  groups.map((group) => ({
    title: group.title,
    rows: group.rows.map((row) => ({ ...row, value: row.value(settings, clock) })),
  }));

// Las páginas que la persona puede abrir, con lo que dicen y su número.
export function useAdminLinkRows() {
  const anomalies = useMenuCount('anomalies');
  return useAdminLinks().map((page) => ({
    page,
    name: pagesTexts[page].name,
    detail: pagesTexts[page].detail,
    count: page === 'anomalies' ? anomalies : undefined,
  }));
}
