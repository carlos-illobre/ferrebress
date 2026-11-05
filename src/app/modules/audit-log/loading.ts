// Cómo se pide la lista de Quién hizo qué (diseño de 05, §§ 7.2 y 8): lo pedido, como viaja al otro
// dispositivo; la marca de lo que entra; y lo que se pide solo con «Actualizar solo» (R4.6).
import type { AuditPage } from '@ferrebress/shared/contracts/audit-log';
import { useEffect, useRef, useState } from 'preact/hooks';
import * as z from 'zod/mini';
import { auditApi } from './api.ts';
import { type Outcome, outcomeOf } from './live.ts';
import { type Filters, isNewer, noFilters } from './logic.ts';
import { auditLogSettings } from './settings.ts';

// Lo que se pidió, como viaja al otro dispositivo (diseño de 03, § 5.1, `refetch`): los filtros, la
// página, si trae el resumen y una vuelta, para que «3 nuevas» vuelva a pedir lo mismo. Cada uno
// pide con su tamaño de página, su sesión y su permiso. Va como texto: los filtros tienen partes que
// pueden faltar, y el servidor valida lo que se le pide.
export type Asked = { filters: Filters; page: number; dates: boolean; round: number };
export const askedText = z.string().check(z.maxLength(2000));
export const first: Asked = { filters: noFilters, page: 1, dates: true, round: 0 };

export function readAsked(text: string): Asked {
  try {
    return { ...first, ...(JSON.parse(text) as Partial<Asked>) };
  } catch {
    return first;
  }
}

// Si está arriba de todo (la página 1, sin haber bajado: R4.6), y cómo volver. Lo que se desplaza no
// es siempre la lista: en la pantalla de Usuarios se desplaza todo su contenido. Se miran la lista y
// todo lo que la contiene.
function scrollers(): HTMLElement[] {
  const found: HTMLElement[] = [];
  for (let el = document.querySelector<HTMLElement>('.audit-ledger'); el; el = el.parentElement)
    found.push(el);
  return found;
}
const scrolledTop = () => scrollers().every((el) => el.scrollTop < auditLogSettings.live.topPx);
export function toTop(): void {
  for (const el of scrollers()) el.scrollTop = 0;
}

// Lo que entra se marca un momento (R4.6, E50): las filas que llegaron después de la foto anterior.
export function useFresh() {
  const [fresh, setFresh] = useState<ReadonlySet<string>>(new Set()); // local: un momento
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const mark = (data: AuditPage, since: string | undefined) => {
    const ids = since
      ? data.events.filter((one) => isNewer(one.id, since)).map((one) => one.id)
      : [];
    if (ids.length === 0) return;
    setFresh(new Set(ids));
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setFresh(new Set()), auditLogSettings.live.markMs);
  };
  return { fresh, mark };
}

export type Now = {
  text: string;
  page: AuditPage | undefined;
  loading: boolean;
  markFrom?: string | undefined;
  // Cuándo llegó la última lista: el aviso del alta no la vuelve a pedir si es reciente.
  loadedAt: number;
};
export type Auto = {
  now: { current: Now };
  wide: boolean;
  params: (
    of: Asked,
    extra: { summary: boolean; strip: boolean },
  ) => Record<string, string | number | undefined>;
  show: (data: AuditPage, dates: boolean) => void;
  mark: (data: AuditPage, since: string | undefined) => void;
  setNewOnes: (count: number) => void;
};

// Lo que se pide solo, con un aviso (R4.6): arriba de todo, la lista con el resumen y la tira, sin
// tocar la acción elegida; más abajo, cuántas nuevas con los filtros (E51). Una respuesta que llega
// con otra vista, o con la persona ya más abajo, no se usa; mientras se trae lo que pidió la persona,
// el aviso espera (`busy`). `byHand`: al prender el selector, que es un toque: la lista donde esté.
export function autoLoads({ now, wide, params, show, mark, setNewOnes }: Auto) {
  const atTop = () => readAsked(now.current.text).page === 1 && scrolledTop();
  async function refresh(byHand = false): Promise<Outcome> {
    if (now.current.loading) return 'busy';
    const { text: before, page: shown } = now.current;
    const of = readAsked(before);
    const result = await auditApi.page(params(of, { summary: true, strip: wide }), !byHand);
    if (now.current.text !== before || now.current.loading) return 'busy';
    if (!result.ok) return outcomeOf(result);
    if (!byHand && !atTop()) return 'moved';
    show(result.data, true);
    mark(result.data, shown?.latest);
    return 'done';
  }
  async function count(): Promise<Outcome> {
    if (now.current.loading) return 'busy';
    const { text: before } = now.current;
    // Hay aviso solo con la lista ya traída: dice si incluye hoy.
    const shown = now.current.page as AuditPage;
    const {
      page: _page,
      size: _size,
      ...filters
    } = params(readAsked(before), {
      summary: false,
      strip: false,
    });
    const result = await auditApi.newOnes({ ...filters, since: shown.latest });
    if (now.current.text !== before) return 'busy';
    if (!result.ok) return outcomeOf(result);
    setNewOnes(result.data.count);
    return 'done';
  }
  return { atTop, refresh, count };
}
