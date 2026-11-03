// Arriba de la lista (R4.9): cuántas acciones hubo en el período, cuántos rechazos y cuánto borró o
// sacó, que también filtran; y en la computadora, el día en una tira, una raya por acción, que abre
// la cinta en esa acción (R4.11).
import type { StripMark } from '@ferrebress/shared/contracts/audit-log';
import { Icon } from '../../../ui/icon/Icon.tsx';
import { nearestMark, stripScale, summaryDay } from '../logic.ts';
import { useAuditLogContext } from '../state.ts';
import { texts } from '../texts.ts';
import './Summary.css';

function totalLabel(dates: ReturnType<typeof useAuditLogContext>['filters']['dates']) {
  if (!dates) return texts.total.today;
  return 'range' in dates ? texts.total[dates.range] : texts.total.days;
}

export function Summary({ today }: { today: string }) {
  const log = useAuditLogContext();
  const { summary, strip } = log.summary;
  if (!summary) return null;
  const kind = log.filters.kind;
  const on = (tone: 'amber' | 'red') => !!kind && 'tone' in kind && kind.tone === tone;
  const number = (tone: 'amber' | 'red', count: number, label: string, icon: 'ban' | 'trash-2') => (
    <button
      type="button"
      class={`surface audit-number audit-${tone}`}
      aria-pressed={on(tone)}
      data-mark=""
      onClick={() => log.byTone(on(tone) ? undefined : tone)}
    >
      <Icon name={icon} />
      <span>
        <b>{count}</b>
        {label}
      </span>
    </button>
  );
  return (
    <div class="audit-summary">
      <button
        type="button"
        class="surface audit-number"
        data-mark=""
        onClick={() => log.byTone(undefined)}
      >
        <Icon name="history" />
        <span>
          <b>{summary.total}</b>
          {totalLabel(log.filters.dates)}
        </span>
      </button>
      {number('amber', summary.amber, texts.refused, 'ban')}
      {number('red', summary.red, texts.removed, 'trash-2')}
      {log.wide && strip && <Strip strip={strip} today={today} />}
    </div>
  );
}

function Strip({ strip, today }: { strip: StripMark[]; today: string }) {
  const log = useAuditLogContext();
  const day = summaryDay(log.filters.dates, today);
  if (strip.length === 0) return null;
  const scale = stripScale(strip.map((mark) => mark.at));
  // Toda la tira se toca: abre la cinta en la acción más cercana a donde se tocó; con el teclado,
  // en la más nueva.
  const open = (event: MouseEvent) => {
    const rail = (event.currentTarget as HTMLElement).querySelector('.audit-rail') as HTMLElement;
    const box = rail.getBoundingClientRect();
    const mark = event.detail
      ? nearestMark(strip, scale.place, (event.clientX - box.left) / box.width)
      : (strip.at(-1) as StripMark);
    log.openTape(day, mark.id);
  };
  return (
    <button type="button" class="audit-strip" aria-label={texts.stripOpen} onClick={open}>
      <span class="audit-strip-title">
        {texts.stripTitle}
        <small>{texts.stripHint}</small>
      </span>
      <span class="audit-rail" aria-hidden="true">
        {strip.map((mark) => (
          <i
            key={mark.id}
            class={`audit-tick audit-${mark.tone}`}
            style={{ left: `${scale.place(mark.at) * 100}%` }}
          />
        ))}
      </span>
      <span class="audit-hours" aria-hidden="true">
        {scale.hours.map((hour) => (
          <span key={hour}>{hour}</span>
        ))}
      </span>
    </button>
  );
}
