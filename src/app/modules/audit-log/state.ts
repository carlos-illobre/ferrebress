// El estado de Quién hizo qué (diseño de 05, § 8): los filtros, la página, lo que trajo el servidor,
// la acción elegida y la cinta abierta. Pide al servidor cuando la persona toca algo (al abrir, al
// filtrar, al pasar de página) y, con «Actualizar solo» prendido, al llegar un aviso (R4.6, live.ts):
// esa puesta al día no cambia lo que se ve en el otro dispositivo ni la acción elegida. No guarda nada
// en el dispositivo.
import type { AuditPage, AuditPerson, Summary } from '@ferrebress/shared/contracts/audit-log';
import { createContext } from 'preact';
import { useContext, useEffect, useRef, useState } from 'preact/hooks';
import * as z from 'zod/mini';
import { useLatest } from '../../platform/latest.ts';
import { useMirrored } from '../../platform/mirror/use-mirrored.ts';
import { isNarrow } from '../../platform/narrow.ts';
import { online as onlineStore } from '../../platform/server/api.ts';
import { useStore } from '../../platform/store.ts';
import { auditApi } from './api.ts';
import { useLive } from './live.ts';
import {
  type Asked,
  type Auto,
  askedText,
  autoLoads,
  first,
  ledger,
  type Now,
  readAsked,
  useFresh,
} from './loading.ts';
import { type Dates, type Filters, noFilters, paramsOf } from './logic.ts';

// Lo que trajo el servidor, de este dispositivo: la página, el resumen y la tira, y «3 nuevas».
function useShown() {
  // local: lo que trae el servidor lo pide cada dispositivo, con su tamaño de página.
  const [page, setPage] = useState<AuditPage>();
  // local: del servidor, como la página.
  const [summary, setSummary] = useState<{
    summary?: Summary | undefined;
    strip?: AuditPage['strip'] | undefined;
  }>({});
  const [newOnes, setNewOnes] = useState(0); // local: «3 nuevas», de este dispositivo
  const show = (data: AuditPage, dates: boolean) => {
    setPage(data);
    setNewOnes(0);
    if (dates) setSummary({ summary: data.summary, strip: data.strip });
  };
  return { page, summary, newOnes, setNewOnes, show };
}

// Pedir lo que pidió la persona (abrir, filtrar, pasar de página): si se pide de nuevo antes de que
// llegue la respuesta, vale la del último pedido. En la computadora queda elegida la primera, sola, y
// eso no viaja; con «3 nuevas», queda la que estaba y lo nuevo se marca.
function useLoad(
  deps: Omit<Auto, 'setNewOnes'> & { choose: (id: string | null, o: { auto: true }) => void },
) {
  const { now, wide, params, show, mark, choose } = deps;
  const latest = useLatest();
  const [failed, setFailed] = useState(false); // local: el pedido de este dispositivo
  async function load(of: Asked) {
    const markFrom = now.current.markFrom;
    now.current.markFrom = undefined;
    now.current.loading = true;
    const result = await latest(
      auditApi.page(params(of, { summary: of.dates, strip: of.dates && wide })),
    );
    if (!result) return;
    now.current.loading = false;
    setFailed(!result.ok);
    if (!result.ok) return;
    show(result.data, of.dates);
    if (wide && !markFrom) choose(result.data.events[0]?.id ?? null, { auto: true });
    mark(result.data, markFrom);
  }
  return { load, failed };
}

// Lo que trajo el servidor y cómo se pide: una página con esos filtros y, con `dates`, también el
// resumen y la tira de ese período.
function useLoading(wide: boolean) {
  const size = wide ? 20 : 10;
  const [text, setText] = useMirrored('audit-log.list.asked', JSON.stringify(first), askedText);
  const asked = readAsked(text);
  const [chosen, choose] = useMirrored('audit-log.list.selected', null, z.nullable(eventId));
  const { fresh, mark } = useFresh();
  const { page, summary, newOnes, setNewOnes, show } = useShown();
  // Lo de ahora, para lo que llega después: si cambió la vista mientras tanto, no se usa.
  const now = useRef<Now>({ text, page, loading: false, markFrom: undefined });
  now.current.text = text;
  now.current.page = page;
  const params = (of: Asked, extra: { summary: boolean; strip: boolean }) =>
    paramsOf(of.filters, { page: of.page, size }, extra);
  const { load, failed } = useLoad({ now, wide, params, show, mark, choose });
  useEffect(() => void load(asked), [text]);
  const ask = (filters: Filters, number: number, dates: boolean) =>
    setText(JSON.stringify({ filters, page: number, dates, round: asked.round + 1 }));
  return {
    filters: asked.filters,
    page,
    summary,
    failed,
    newOnes,
    fresh,
    selected: chosen ?? undefined,
    select: (id: string | undefined) => choose(id ?? null),
    ask,
    ...autoLoads({ now, wide, params, show, mark, setNewOnes }),
    // «3 nuevas»: a la página 1, arriba de todo, con lo nuevo marcado.
    showNew: () => {
      now.current.markFrom = page?.latest;
      ledger()?.scrollTo({ top: 0 });
      ask(asked.filters, 1, true);
    },
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
  const { ask, atTop, refresh, count, ...loaded } = useLoading(wide);
  const { filters, page } = loaded;
  const [tape, setTape] = useMirrored('audit-log.tape', null, z.nullable(tapeAt));
  const live = useLive({
    wide,
    withToday: page?.withToday ?? false,
    tapeOpen: tape !== null,
    atTop,
    refresh,
    count,
    lost: () => void refresh(),
  });
  const online = useStore(onlineStore);
  const datesChanged = (next: Filters) =>
    JSON.stringify(next.dates) !== JSON.stringify(filters.dates);
  return {
    ...loaded,
    live,
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
