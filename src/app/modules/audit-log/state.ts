// El estado de Quién hizo qué (diseño de 05, § 8): los filtros, la página, lo que trajo el servidor,
// la acción elegida y la cinta abierta. Pide al servidor solo cuando la persona toca algo: al abrir,
// al filtrar, al pasar de página o con «Actualizar» (R4.6). No guarda nada en el dispositivo.
import type { AuditPage, AuditPerson, Summary } from '@ferrebress/shared/contracts/audit-log';
import { createContext } from 'preact';
import { useContext, useEffect, useState } from 'preact/hooks';
import { online as onlineStore } from '../../platform/server/api.ts';
import { useStore } from '../../platform/store.ts';
import { auditApi } from './api.ts';
import { type Dates, type Filters, noFilters, paramsOf } from './logic.ts';

// En la computadora, de a 20 y con la tira; en lo angosto, de a 10 (R4.3).
export const isWide = () => !matchMedia('(max-width: 899px)').matches;

// Lo que trajo el servidor y cómo se pide: una página con esos filtros y, con `dates`, también el
// resumen y la tira de ese período.
function useLoading(wide: boolean) {
  const size = wide ? 20 : 10;
  const [filters, setFilters] = useState<Filters>(noFilters);
  const [page, setPage] = useState<AuditPage>();
  const [summary, setSummary] = useState<{
    summary?: Summary | undefined;
    strip?: AuditPage['strip'] | undefined;
  }>({});
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<string>();
  async function load(next: Filters, number: number, dates: boolean) {
    const result = await auditApi.page(
      paramsOf(next, { page: number, size }, { summary: dates, strip: dates && wide }),
    );
    setFailed(!result.ok);
    if (!result.ok) return;
    setFilters(next);
    setPage(result.data);
    setSelected(wide ? result.data.events[0]?.id : undefined);
    if (dates) setSummary({ summary: result.data.summary, strip: result.data.strip });
  }
  return { filters, page, summary, failed, selected, select: setSelected, load };
}

export function useAuditLog() {
  const wide = isWide();
  const { load, ...loaded } = useLoading(wide);
  const { filters, page } = loaded;
  const [people, setPeople] = useState<AuditPerson[]>([]);
  const [tape, setTape] = useState<{ date: string; at?: string }>();
  const online = useStore(onlineStore);
  useEffect(() => {
    void auditApi.people().then((result) => result.ok && setPeople(result.data.people));
    void load(noFilters, 1, true);
  }, []);
  const datesChanged = (next: Filters) =>
    JSON.stringify(next.dates) !== JSON.stringify(filters.dates);
  return {
    ...loaded,
    wide,
    people,
    online,
    tape,
    // Cambiar un filtro vuelve a la página 1 (E31).
    filter: (change: Partial<Filters>) => {
      const next = { ...filters, ...change };
      return load(next, 1, datesChanged(next));
    },
    clear: () => load(noFilters, 1, filters.dates !== undefined),
    goTo: (number: number) => load(filters, number, false),
    refresh: () => load(filters, page?.page ?? 1, true),
    retry: () => load(filters, 1, true),
    // Un número del resumen: su período como fecha, y ese color como tipo (R4.9, E35c).
    byTone: (tone: 'amber' | 'red' | undefined) => {
      const dates: Dates = filters.dates ?? { range: 'today' };
      const next = { ...filters, dates, kind: tone && { tone } };
      return load(next, 1, datesChanged(next));
    },
    openTape: (date: string, at?: string) => setTape({ date, ...(at && { at }) }),
    closeTape: () => setTape(undefined),
  };
}

export type AuditLogState = ReturnType<typeof useAuditLog>;
export const AuditLogContext = createContext<AuditLogState | undefined>(undefined);
export const useAuditLogContext = () => useContext(AuditLogContext) as AuditLogState;
