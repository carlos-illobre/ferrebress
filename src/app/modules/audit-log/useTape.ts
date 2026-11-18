// La cinta de Quién hizo qué, sin HTML (R4.11): el día que trae el servidor (si se cambia de día antes
// de que llegue el anterior, vale el último), el cabezal, aislar a una persona (que lleva el cabezal a
// su primera acción) y «Reproducir el día», que se frena al ocultar la pestaña. Todo es de cada
// dispositivo (diseño de 03, § 5.1). Se anuncia para las capas.
import type { AuditDay, AuditView } from '@ferrebress/shared/contracts/audit-log';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { useLatest } from '../../platform/latest.ts';
import { useScreen } from '../../platform/screens.ts';
import { auditApi } from './api.ts';
import { detailLines } from './detail-lines.ts';
import { stepMs, visibleOf } from './tape.ts';

function useDay(first: { date: string; at?: string }) {
  // local: el día que trae el servidor lo pide cada dispositivo.
  const [day, setDay] = useState<AuditDay>();
  // local: el cabezal de la cinta es de cada dispositivo (diseño de 03, § 5.1).
  const [at, setAt] = useState<string | undefined>(first.at);
  const latest = useLatest();
  // Si se cambia de día antes de que llegue el anterior, vale el último.
  const load = async (date: string, focus?: string) => {
    const result = await latest(auditApi.day(date));
    if (!result?.ok) return;
    setDay(result.data);
    setAt(focus ?? result.data.events?.[0]?.id);
  };
  useEffect(() => {
    void load(first.date, first.at);
  }, []);
  return { day, at, setAt, load };
}

// «Reproducir»: un paso por acción, hasta la última o hasta que se toque algo.
function usePlay(
  steps: AuditView[],
  at: string | undefined,
  setAt: (id: string) => void,
  wide: boolean,
) {
  // local: reproducir corre en cada dispositivo.
  const [playing, setPlaying] = useState(false);
  const position = useRef(at);
  position.current = at;
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(
      () => {
        const index = steps.findIndex((event) => event.id === position.current);
        const next = steps[index + 1];
        if (next) setAt(next.id);
        else setPlaying(false);
      },
      stepMs(steps.length, wide),
    );
    const stop = () => document.hidden && setPlaying(false);
    document.addEventListener('visibilitychange', stop);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', stop);
    };
  }, [playing, steps]);
  return { playing, toggle: () => setPlaying(!playing), stop: () => setPlaying(false) };
}

// Lo que pasa en la cinta: el día, el cabezal, la persona aislada y «Reproducir».
function useTape(wide: boolean, first: { date: string; at?: string }) {
  const { day, at, setAt, load } = useDay(first);
  // local: lo resaltado al pasar el dedo o el mouse.
  const [isolated, setIsolated] = useState<string>();
  const events = useMemo(() => day?.events ?? [], [day]);
  const steps = useMemo(() => visibleOf(events, isolated), [events, isolated]);
  const play = usePlay(steps, at, setAt, wide);
  const index = steps.findIndex((event) => event.id === at);
  return {
    day,
    load,
    events,
    steps,
    play,
    index,
    isolated,
    current: events.find((event) => event.id === at),
    // Lo que se dice de la que está en el cabezal, resuelto.
    currentDetail: currentOf(events, at, day?.today),
    move: setAt,
    // En los extremos no hace nada: los botones se apagan y deslizar no se pasa.
    go(step: 1 | -1) {
      const next = steps[index + step];
      if (next) setAt(next.id);
    },
    // Aislar a alguien que no está en el cabezal lleva el cabezal a su primera acción.
    isolate(id: string) {
      const next = isolated === id ? undefined : id;
      setIsolated(next);
      const visible = visibleOf(events, next);
      if (!visible.some((event) => event.id === at) && visible[0]) setAt(visible[0].id);
    },
  };
}

// La cinta como pantalla: se anuncia mientras está abierta.
// La del cabezal, con lo que se dice de ella.
function currentOf(events: AuditView[], at: string | undefined, today: string | undefined) {
  const found = events.find((event) => event.id === at);
  return found && today ? detailLines(found, today) : undefined;
}

export function useTapeScreen(wide: boolean, first: { date: string; at?: string }) {
  const tape = useTape(wide, first);
  useScreen('audit-tape', tape);
  return tape;
}

export type TapeState = ReturnType<typeof useTape>;
