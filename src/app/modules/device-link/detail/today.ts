// La tira del día del vínculo, sin HTML (R4.4): la tira de la persona, que se vuelve a medir cada
// minuto con el detalle abierto, y las horas en punto que se marcan debajo.
import { useEffect, useState } from 'preact/hooks';
import { useStore } from '../../../platform/store.ts';
import { linkStrip } from '../current.ts';
import { deviceLinkSettings } from '../settings.ts';
import type { Lane, StripView } from '../strip.ts';

export const lanes: Lane[] = ['direct', 'relayed', 'apart'];
const hour = 3_600_000;

export function useStrip(): StripView | undefined {
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
