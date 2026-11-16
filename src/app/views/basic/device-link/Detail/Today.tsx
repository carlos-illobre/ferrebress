// La tira del día (R4.4): desde la primera conexión del día hasta ahora, un tramo por estado, con
// cuánto fue cada uno y qué parte del tiempo juntos fue directo. Se lee de la tira de la persona.

import {
  clock,
  detailTexts,
  duration,
  hours,
  lanes,
  useStrip,
} from '../../../../modules/device-link/model.ts';
import { formatHour } from '../../../../platform/view/time.ts';

export function Today() {
  const view = useStrip();
  const first = view?.segments[0];
  const last = view?.segments.at(-1);
  if (!view || !first || !last) return null;
  const [from, to] = [first.from, last.to];
  const at = (when: number) => `${(((when - from) / Math.max(1, to - from)) * 100).toFixed(3)}%`;
  const t = detailTexts.today;
  const lengths = lanes.map((lane) => duration(view.totals[lane]));
  return (
    <section class="today" aria-label={t.together}>
      <p class="today-head">
        <span>
          {t.together} <b>{duration(view.together)}</b>
        </span>
        <span>{t.direct(view.directShare)}</span>
      </p>
      <div
        class="today-strip"
        role="img"
        aria-label={t.summary(clock(from), clock(to), ...(lengths as [string, string, string]))}
      >
        {view.segments.map((segment) => (
          <span
            key={segment.from}
            class="today-segment"
            data-lane={segment.lane}
            style={{ '--from': at(segment.from), '--length': at(from + segment.to - segment.from) }}
          />
        ))}
      </div>
      <div class="today-hours" aria-hidden="true">
        {hours(from, to).map((mark) => (
          <span key={mark} style={{ '--at': at(mark) }}>
            {formatHour(mark)}
          </span>
        ))}
        <span>{t.now}</span>
      </div>
      <ul class="today-legend">
        {lanes.map((lane, i) => (
          <li key={lane} data-lane={lane}>
            {t.lanes[lane]} <b>{lengths[i]}</b>
          </li>
        ))}
      </ul>
    </section>
  );
}
