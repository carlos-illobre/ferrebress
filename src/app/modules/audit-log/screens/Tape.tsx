// La cinta (R4.11; maqueta users-who-did-what, variante 3, «La cinta»): un día como una grabación, a
// pantalla completa. Una fila por persona, un punto por acción y la línea de quién a quién; el
// cabezal, que se arrastra, se pasa con ← → o los botones, o recorre solo con «Reproducir el día»;
// tocar una fila aísla a esa persona. La acción del cabezal se lee abajo, como un subtítulo.
import type { AuditDay, AuditView } from '@ferrebress/shared/contracts/audit-log';
import { useEffect, useRef, useState } from 'preact/hooks';
import { useBackStep } from '../../../platform/back-step.ts';
import { Button } from '../../../ui/button/Button.tsx';
import { Icon } from '../../../ui/icon/Icon.tsx';
import { auditApi } from '../api.ts';
import { initials, shortDateOf, timeOf } from '../logic.ts';
import { useAuditLogContext } from '../state.ts';
import { type Lane, lanesFor, lanesOf, stepMs, timeline, visibleOf } from '../tape.ts';
import { texts } from '../texts.ts';
import { DetailBody } from './Detail.tsx';
import './Tape.css';

function useDay(first: { date: string; at?: string }) {
  const [day, setDay] = useState<AuditDay>();
  const [at, setAt] = useState<string | undefined>(first.at);
  const load = async (date: string, focus?: string) => {
    const result = await auditApi.day(date);
    if (!result.ok) return;
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
          <span>{one.date === day.today ? 'Hoy' : shortDateOf(`${one.date}T15:00:00Z`)}</span>
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

function Board(props: {
  events: AuditView[];
  lanes: Lane[];
  current: AuditView | undefined;
  isolated: string | undefined;
  move: (id: string) => void;
  isolate: (id: string) => void;
  vertical: boolean;
}) {
  const { events, lanes, current, isolated } = props;
  const where = timeline(events);
  const laneIndex = (id: string) => lanes.findIndex((lane) => lane.id === id);
  const lane = (id: string) => (laneIndex(id) + 0.5) / lanes.length;
  // En el celular el tiempo va hacia abajo: se dan vuelta los ejes.
  const point = (at: number, across: number) =>
    props.vertical ? `${across * 1000} ${at * 1000}` : `${at * 1000} ${across * 1000}`;
  const bend = (at: number, across: number) => point(at + 0.04, across);
  const shown = new Set(visibleOf(events, isolated).map((event) => event.id));
  return (
    <div class="tape-board" style={{ '--lanes': lanes.length }}>
      <div class="tape-lanes">
        {lanes.map((lane) => (
          <button
            key={lane.id}
            type="button"
            class="tape-lane"
            data-mark=""
            data-private=""
            aria-pressed={isolated === lane.id}
            aria-label={texts.isolate(lane.name)}
            onClick={() => props.isolate(lane.id)}
          >
            <span class="tape-avatar">{initials(lane.name)}</span>
            <span class="tape-lane-name">
              {lane.name}
              <small>{`${lane.made} · ${lane.got}`}</small>
            </span>
          </button>
        ))}
      </div>
      <div class="tape-track">
        <svg
          class="tape-lines"
          viewBox="0 0 1000 1000"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {events.flatMap((event) => {
            const { from, to } = lanesFor(event);
            const at = where(event);
            return to.map((target) => {
              const on = current?.id === event.id;
              return (
                <path
                  key={`${event.id}:${target}`}
                  class={`tape-line audit-${event.tone}${on ? ' on' : ''}${shown.has(event.id) ? '' : ' off'}`}
                  d={`M${point(at, lane(from))} C ${bend(at, lane(from))}, ${bend(at, lane(target))}, ${point(at, lane(target))}`}
                />
              );
            });
          })}
        </svg>
        {events.map((event) => (
          <button
            key={event.id}
            type="button"
            class={`tape-dot audit-${event.tone}${current?.id === event.id ? ' on' : ''}${shown.has(event.id) ? '' : ' off'}`}
            style={{ '--at': where(event), '--lane': lane(lanesFor(event).from) }}
            aria-label={timeOf(event.at)}
            onClick={() => props.move(event.id)}
          />
        ))}
        {current && <div class="tape-head" style={{ '--at': where(current) }} aria-hidden="true" />}
      </div>
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

export function Tape() {
  const log = useAuditLogContext();
  const tape = log.tape as { date: string; at?: string };
  const { day, at, setAt, load } = useDay(tape);
  const [isolated, setIsolated] = useState<string>();
  const events = day?.events ?? [];
  const steps = visibleOf(events, isolated);
  const play = usePlay(steps, at, setAt, log.wide);
  useBackStep(log.closeTape);
  const current = events.find((event) => event.id === at);
  const index = steps.findIndex((event) => event.id === at);
  const go = (step: 1 | -1) => {
    const next = steps[index + step] ?? (index < 0 ? steps[0] : undefined);
    if (next) setAt(next.id);
  };
  const isolate = (id: string) => {
    const next = isolated === id ? undefined : id;
    setIsolated(next);
    const visible = visibleOf(events, next);
    if (!visible.some((event) => event.id === at) && visible[0]) setAt(visible[0].id);
  };
  return (
    <section
      class={log.wide ? 'tape' : 'tape vertical'}
      role="dialog"
      aria-modal="true"
      aria-label={texts.tapeTitle}
      data-layer=""
      data-arrows=""
      onPointerDownCapture={(event) => {
        if (!(event.target as HTMLElement).closest('[data-play]')) play.stop();
      }}
    >
      <header class="tape-top">
        <Button look="plain" icon="x" closes doing={texts.close} onPress={log.closeTape}>
          {texts.close}
        </Button>
        <h1>{texts.title}</h1>
        {day && <Week day={day} load={(date) => load(date)} />}
      </header>
      {day?.tooMany !== undefined && <p class="tape-message">{texts.tooMany(day.tooMany)}</p>}
      {day?.events && events.length === 0 && <p class="tape-message">{texts.noActions}</p>}
      {events.length > 0 && (
        <>
          <Board
            events={events}
            lanes={lanesOf(events)}
            current={current}
            isolated={isolated}
            move={setAt}
            isolate={isolate}
            vertical={!log.wide}
          />
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
          {current && day && (
            <div class="tape-subtitle" aria-live="polite">
              <DetailBody event={current} today={day.today} />
            </div>
          )}
        </>
      )}
    </section>
  );
}
