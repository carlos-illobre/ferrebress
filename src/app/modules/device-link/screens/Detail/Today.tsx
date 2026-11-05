// La tira del día (R4.4): desde la primera conexión del día hasta ahora, un tramo por estado, con
// cuánto fue cada uno y qué parte del tiempo juntos fue directo. Se lee de la tira de la persona.
import { useEffect, useState } from 'preact/hooks';
import { useStore } from '../../../../platform/store.ts';
import { linkStrip } from '../../current.ts';
import { deviceLinkSettings } from '../../settings.ts';
import type { Lane, StripView } from '../../strip.ts';
import { clock, detailTexts, duration } from './texts.ts';

const lanes: Lane[] = ['direct', 'relayed', 'apart'];
const hour = 3_600_000;

function useStrip(): StripView | undefined {
  const strip = useStore(linkStrip).of?.();
  // local: la tira es de cada dispositivo (R4.4).
  const [view, setView] = useState(strip?.view());
  useEffect(() => {
    if (!strip) return;
    const update = () => setView(strip.view());
    update();
    // Ahora avanza: cada minuto se vuelve a medir.
    const timer = setInterval(update, deviceLinkSettings.todayEveryMs);
    const stop = strip.subscribe(update);
    return () => {
      clearInterval(timer);
      stop();
    };
  }, [strip]);
  return view;
}

// Las horas en punto entre el principio y ahora: como mucho cuatro (en un día largo, cada dos o más
// horas), y ninguna en el último sexto, donde va «Ahora»: así no se pisan.
const maxMarks = 4;
export function hours(from: number, to: number): number[] {
  const step = Math.max(1, Math.ceil((to - from) / hour / maxMarks)) * hour;
  const marks: number[] = [];
  for (let at = Math.ceil(from / hour) * hour; at < to - (to - from) / 6; at += step)
    marks.push(at);
  return marks;
}

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
            {clock(mark)}
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
