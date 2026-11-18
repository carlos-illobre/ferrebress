// La cinta (R4.11; maqueta users-who-did-what, variante 3, «La cinta»): un día como una grabación, a
// pantalla completa. Una fila por persona, un punto por acción y la línea de quién a quién; el
// cabezal, que se arrastra, se pasa con ← → o los botones, o recorre solo con «Reproducir el día»;
// tocar una fila aísla a esa persona. La acción del cabezal se lee abajo, como un subtítulo.
import type { AuditDay } from '@ferrebress/shared/contracts/audit-log';
import { useRef } from 'preact/hooks';
import {
  lanesOf,
  shortDateOf,
  swipeOf,
  type TapeState,
  texts,
  useAuditLogContext,
  useTapeScreen,
} from '../../../modules/audit-log/model.ts';
import { useBackStep } from '../../../platform/view/back-step.ts';
import { useShortcutHints } from '../../../platform/view/shortcut-hints.ts';
import { Button } from '../ui/button/Button.tsx';
import { Icon } from '../ui/icon/Icon.tsx';
import { DetailBody } from './Detail.tsx';
import { TapeBoard } from './TapeBoard.tsx';
import './Tape.css';

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

function Controls({ tape }: { tape: TapeState }) {
  const { play, index, steps, go } = tape;
  const keys = useShortcutHints('audit-tape');
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
          keyHint={keys.play}
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
      {tape.currentDetail && (
        <div class="tape-subtitle" aria-live="polite">
          <DetailBody lines={tape.currentDetail} />
        </div>
      )}
    </>
  );
}

// Deslizar de lado en el celular pasa de a una (R4.11).
function useSwipe(tape: TapeState) {
  // vista: dónde se apoyó el dedo, para el deslizar de la cinta.
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
  const tape = useTapeScreen(log.wide, log.tape as { date: string; at?: string });
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
