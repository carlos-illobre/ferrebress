// El estado de Quién hizo qué (diseño de 05, § 8): los filtros, la página, lo que trajo el servidor,
// la acción elegida y la cinta abierta. Pide al servidor solo cuando la persona toca algo: al abrir,
// al filtrar, al pasar de página o con «Actualizar» (R4.6). No guarda nada en el dispositivo.
import type { AuditPage, AuditPerson, Summary } from '@ferrebress/shared/contracts/audit-log';
import { createContext } from 'preact';
import { useContext, useEffect, useState } from 'preact/hooks';
import * as z from 'zod/mini';
import { useLatest } from '../../platform/latest.ts';
import { useMirrored } from '../../platform/mirror/use-mirrored.ts';
import { isNarrow } from '../../platform/narrow.ts';
import { online as onlineStore } from '../../platform/server/api.ts';
import { useStore } from '../../platform/store.ts';
import { auditApi } from './api.ts';
import { type Dates, type Filters, noFilters, paramsOf } from './logic.ts';

// Lo que se pidió, como viaja al otro dispositivo (diseño de 03, § 5.1, `refetch`): los filtros, la
// página, si trae el resumen y una vuelta, para que «Actualizar» vuelva a pedir lo mismo. Cada uno
// pide con su tamaño de página, su sesión y su permiso. Va como texto: los filtros tienen partes que
// pueden faltar, y el servidor valida lo que se le pide.
type Asked = { filters: Filters; page: number; dates: boolean; round: number };
const askedText = z.string().check(z.maxLength(2000));
const first: Asked = { filters: noFilters, page: 1, dates: true, round: 0 };

function readAsked(text: string): Asked {
  try {
    return { ...first, ...(JSON.parse(text) as Partial<Asked>) };
  } catch {
    return first;
  }
}

// Lo que trajo el servidor y cómo se pide: una página con esos filtros y, con `dates`, también el
// resumen y la tira de ese período.
function useLoading(wide: boolean) {
  const size = wide ? 20 : 10;
  const [text, setText] = useMirrored('audit-log.list.asked', JSON.stringify(first), askedText);
  const asked = readAsked(text);
  // local: lo que trae el servidor lo pide cada dispositivo, con su tamaño de página.
  const [page, setPage] = useState<AuditPage>();
  // local: del servidor, como la página.
  const [summary, setSummary] = useState<{
    summary?: Summary | undefined;
    strip?: AuditPage['strip'] | undefined;
  }>({});
  const [failed, setFailed] = useState(false); // local: el pedido de este dispositivo
  const [chosen, choose] = useMirrored('audit-log.list.selected', null, z.nullable(eventId));
  const latest = useLatest();
  // Si se filtra o se pasa de página antes de que llegue la respuesta, vale la del último pedido.
  async function load({ filters, page: number, dates }: Asked) {
    const result = await latest(
      auditApi.page(
        paramsOf(filters, { page: number, size }, { summary: dates, strip: dates && wide }),
      ),
    );
    if (!result) return;
    setFailed(!result.ok);
    if (!result.ok) return;
    setPage(result.data);
    // En la computadora queda elegida la primera, sola: eso no viaja.
    if (wide) choose(result.data.events[0]?.id ?? null, { auto: true });
    if (dates) setSummary({ summary: result.data.summary, strip: result.data.strip });
  }
  useEffect(() => void load(asked), [text]);
  const ask = (filters: Filters, number: number, dates: boolean) =>
    setText(JSON.stringify({ filters, page: number, dates, round: asked.round + 1 }));
  const select = (id: string | undefined) => choose(id ?? null);
  return {
    filters: asked.filters,
    page,
    summary,
    failed,
    selected: chosen ?? undefined,
    select,
    ask,
  };
}

// En la computadora, de a 20 y con la tira; en lo angosto, de a 10 (R4.3). Se decide al abrir: girar
// el celular no cambia el tamaño de la página a mitad de camino.
export function useAuditLog() {
  const [wide] = useState(() => !isNarrow()); // local: el ancho de este dispositivo, al abrir
  const [people, setPeople] = useState<AuditPerson[]>([]); // local: del servidor
  // Las personas se piden antes que la primera página.
  useEffect(() => {
    void auditApi.people().then((result) => result.ok && setPeople(result.data.people));
  }, []);
  const { ask, ...loaded } = useLoading(wide);
  const { filters, page } = loaded;
  const [tape, setTape] = useMirrored('audit-log.tape', null, z.nullable(tapeAt));
  const online = useStore(onlineStore);
  const datesChanged = (next: Filters) =>
    JSON.stringify(next.dates) !== JSON.stringify(filters.dates);
  return {
    ...loaded,
    wide,
    people,
    online,
    tape: tape ? { date: tape.date, ...(tape.at && { at: tape.at }) } : undefined,
    // Cambiar un filtro vuelve a la página 1 (E31).
    filter: (change: Partial<Filters>) => {
      const next = { ...filters, ...change };
      return ask(next, 1, datesChanged(next));
    },
    clear: () => ask(noFilters, 1, filters.dates !== undefined),
    goTo: (number: number) => ask(filters, number, false),
    refresh: () => ask(filters, page?.page ?? 1, true),
    retry: () => ask(filters, 1, true),
    // Un número del resumen: su período como fecha, y ese color como tipo (R4.9, E35c).
    byTone: (tone: 'amber' | 'red' | undefined) => {
      const dates: Dates = filters.dates ?? { range: 'today' };
      const next = { ...filters, dates, kind: tone && { tone } };
      return ask(next, 1, datesChanged(next));
    },
    openTape: (date: string, at?: string) => setTape({ date, at: at ?? null }),
    closeTape: () => setTape(null),
  };
}

const eventId = z.string().check(z.maxLength(64));
const tapeAt = z.object({ date: z.string().check(z.maxLength(10)), at: z.nullable(eventId) });

export type AuditLogState = ReturnType<typeof useAuditLog>;
export const AuditLogContext = createContext<AuditLogState | undefined>(undefined);
export const useAuditLogContext = () => useContext(AuditLogContext) as AuditLogState;
