// Arriba de la lista (R4.9): cuántas acciones hubo en el período, cuántos rechazos y cuánto borró o
// sacó, que también filtran; y en la computadora, el día en una tira, una raya por acción, que abre
// la cinta en esa acción (R4.11).
import { Icon } from '../../../ui/icon/Icon.tsx';
import { stripDay, stripScale } from '../logic.ts';
import { useAuditLogContext } from '../state.ts';
import { texts } from '../texts.ts';

function totalLabel(dates: ReturnType<typeof useAuditLogContext>['filters']['dates']) {
  if (!dates) return texts.total.today;
  return 'range' in dates ? texts.total[dates.range] : texts.total.days;
}

export function Summary() {
  const log = useAuditLogContext();
  const { summary, strip } = log.summary;
  if (!summary) return null;
  const kind = log.filters.kind;
  const on = (tone: 'amber' | 'red') => !!kind && 'tone' in kind && kind.tone === tone;
  const number = (tone: 'amber' | 'red', count: number, label: string, icon: 'ban' | 'trash-2') => (
    <button
      type="button"
      class={`audit-number audit-${tone}`}
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
      <button type="button" class="audit-number" data-mark="" onClick={() => log.byTone(undefined)}>
        <Icon name="history" />
        <span>
          <b>{summary.total}</b>
          {totalLabel(log.filters.dates)}
        </span>
      </button>
      {number('amber', summary.amber, texts.refused, 'ban')}
      {number('red', summary.red, texts.removed, 'trash-2')}
      {log.wide && strip && <Strip />}
    </div>
  );
}

function Strip() {
  const log = useAuditLogContext();
  const { strip = [] } = log.summary;
  const day = stripDay(log.filters.dates, log.page?.today ?? '');
  if (strip.length === 0) return null;
  const scale = stripScale(strip.map((mark) => mark.at));
  const clock = (seconds: number) =>
    `${Math.floor(seconds / 3600)}:${String(Math.floor((seconds % 3600) / 60)).padStart(2, '0')}`;
  return (
    <div class="audit-strip">
      <span class="audit-strip-title">
        {texts.stripTitle}
        <small>{texts.stripHint}</small>
      </span>
      <div class="audit-rail">
        {strip.map((mark) => (
          <button
            key={mark.id}
            type="button"
            class={`audit-tick audit-${mark.tone}`}
            style={{ left: `${scale.place(mark.at) * 100}%` }}
            aria-label={clock(mark.at)}
            onClick={() => log.openTape(day, mark.id)}
          />
        ))}
      </div>
      <div class="audit-hours" aria-hidden="true">
        {scale.hours.map((hour) => (
          <span key={hour}>{hour}</span>
        ))}
      </div>
    </div>
  );
}
