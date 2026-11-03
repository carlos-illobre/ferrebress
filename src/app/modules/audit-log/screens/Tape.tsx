// La cinta (R4.11; maqueta users-who-did-what, variante 3, «La cinta»): un día como una grabación, a
// pantalla completa. Una fila por persona, un punto por acción y la línea de quién a quién; el
// cabezal, que se arrastra, se pasa con ← → o los botones, o recorre solo con «Reproducir el día»;
// tocar una fila aísla a esa persona. La acción del cabezal se lee abajo, como un subtítulo.
import type { AuditDay, AuditView } from '@ferrebress/shared/contracts/audit-log';
import { useEffect, useMemo, useRef, useState } from 'preact/hooks';
import { useBackStep } from '../../../platform/back-step.ts';
import { useLatest } from '../../../platform/latest.ts';
import { Button } from '../../../ui/button/Button.tsx';
import { Icon } from '../../../ui/icon/Icon.tsx';
import { auditApi } from '../api.ts';
import { shortDateOf } from '../logic.ts';
import { useAuditLogContext } from '../state.ts';
import { lanesOf, stepMs, swipeOf, visibleOf } from '../tape.ts';
import { texts } from '../texts.ts';
import { DetailBody } from './Detail.tsx';
import { TapeBoard } from './TapeBoard.tsx';
import './Tape.css';

function useDay(first: { date: string; at?: string }) {
  const [day, setDay] = useState<AuditDay>();
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

function Week({ day, load }: { day: AuditDay; load: (date: string) => unknown }) {
  return (
    <div class="tape-week">
      {day.week.map((one) => (
        <button
          key={one.date}
          type="button"
          class="tape-day"
          aria-pressed={one.date === day.date}
          onClick={() => load(one.date)}
        >
          <span>
            {one.date === day.today ? texts.total.today : shortDateOf(`${one.date}T15:00:00Z`)}
          </span>
          <b>{one.total}</b>
          {one.red + one.amber > 0 && (
            <small class="tape-day-marks">
              {one.red > 0 && <i class="audit-red" />}
              {one.amber > 0 && <i class="audit-amber" />}
            </small>
          )}
        </button>
      ))}
    </div>
  );
}

// «Reproducir»: un paso por acción, hasta la última o hasta que se toque algo.
function usePlay(
  steps: AuditView[],
  at: string | undefined,
  setAt: (id: string) => void,
  wide: boolean,
) {
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
type TapeState = ReturnType<typeof useTape>;

function Controls({ tape }: { tape: TapeState }) {
  const { play, index, steps, go } = tape;
  return (
    <div class="tape-controls">
      <button
        type="button"
        class="tape-step"
        data-arrow="previous"
        aria-label={texts.previousAction}
        disabled={index <= 0}
        onClick={() => go(-1)}
      >
        <Icon name="skip-back" />
      </button>
      <span data-play="">
        <Button
          look="action"
          icon={play.playing ? 'pause' : 'play'}
          shortcut="r"
          doing={texts.play}
          onPress={play.toggle}
        >
          {play.playing ? texts.pause : texts.play}
        </Button>
      </span>
      <button
        type="button"
        class="tape-step"
        data-arrow="next"
        aria-label={texts.nextAction}
        disabled={index >= steps.length - 1}
        onClick={() => go(1)}
      >
        <Icon name="skip-forward" />
      </button>
    </div>
  );
}

function Recording({ tape, wide }: { tape: TapeState; wide: boolean }) {
  const { day, events, current } = tape;
  if (day?.tooMany !== undefined) return <p class="tape-message">{texts.tooMany(day.tooMany)}</p>;
  if (day?.events && events.length === 0) return <p class="tape-message">{texts.noActions}</p>;
  if (!day || events.length === 0) return null;
  return (
    <>
      <TapeBoard
        events={events}
        lanes={lanesOf(events)}
        current={current}
        isolated={tape.isolated}
        move={tape.move}
        isolate={tape.isolate}
        vertical={!wide}
      />
      <Controls tape={tape} />
      {current && (
        <div class="tape-subtitle" aria-live="polite">
          <DetailBody event={current} today={day.today} />
        </div>
      )}
    </>
  );
}

// Deslizar de lado en el celular pasa de a una (R4.11).
function useSwipe(tape: TapeState) {
  const start = useRef<{ x: number; y: number }>(undefined);
  return {
    onPointerDown: (event: PointerEvent) => {
      start.current = { x: event.clientX, y: event.clientY };
    },
    onPointerUp: (event: PointerEvent) => {
      if (!start.current) return;
      const step = swipeOf(event.clientX - start.current.x, event.clientY - start.current.y);
      start.current = undefined;
      if (step) tape.go(step);
    },
  };
}

export function Tape() {
  const log = useAuditLogContext();
  const tape = useTape(log.wide, log.tape as { date: string; at?: string });
  const swipe = useSwipe(tape);
  useBackStep(log.closeTape);
  return (
    <section
      class={log.wide ? 'tape' : 'tape vertical'}
      role="dialog"
      aria-modal="true"
      aria-label={texts.tapeTitle}
      data-layer=""
      data-arrows=""
      onPointerDownCapture={(event) => {
        if (!(event.target as HTMLElement).closest('[data-play]')) tape.play.stop();
      }}
      {...(!log.wide && swipe)}
    >
      <header class="tape-top">
        <Button
          look="plain"
          icon="x"
          closes={!tape.isolated}
          doing={texts.close}
          onPress={log.closeTape}
        >
          {texts.close}
        </Button>
        <h1>{texts.title}</h1>
        {tape.day && <Week day={tape.day} load={(date) => tape.load(date)} />}
      </header>
      <Recording tape={tape} wide={log.wide} />
    </section>
  );
}
