// El tablero de la cinta (R4.11): una fila por persona, que se toca para aislarla; un punto por
// acción, que lleva el cabezal ahí; y las líneas de quién a quién, la del cabezal resaltada. En el
// celular el tiempo va hacia abajo: se dan vuelta los ejes.
import type { AuditView } from '@ferrebress/shared/contracts/audit-log';
import { initials, timeOf } from '../logic.ts';
import { type Lane, lanesFor, timeline, visibleOf } from '../tape.ts';
import { texts } from '../texts.ts';

type Props = {
  events: AuditView[];
  lanes: Lane[];
  current: AuditView | undefined;
  isolated: string | undefined;
  move: (id: string) => void;
  isolate: (id: string) => void;
  vertical: boolean;
};

function Lanes({ lanes, isolated, isolate }: Pick<Props, 'lanes' | 'isolated' | 'isolate'>) {
  return (
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
          onClick={() => isolate(lane.id)}
        >
          <span class="tape-avatar">{initials(lane.name)}</span>
          <span class="tape-lane-name">
            {lane.name}
            <small>{`${lane.made} · ${lane.got}`}</small>
          </span>
        </button>
      ))}
    </div>
  );
}

// Dónde va cada cosa: el tiempo de 0 a 1 y la fila de 0 a 1; para las líneas, en un lienzo de 1000.
function geometry({ events, lanes, vertical }: Props) {
  const where = timeline(events);
  const lane = (id: string) => (lanes.findIndex((one) => one.id === id) + 0.5) / lanes.length;
  const point = (at: number, across: number) =>
    vertical ? `${across * 1000} ${at * 1000}` : `${at * 1000} ${across * 1000}`;
  const curve = (at: number, from: number, to: number) =>
    `M${point(at, from)} C ${point(at + 0.04, from)}, ${point(at + 0.04, to)}, ${point(at, to)}`;
  return { where, lane, curve };
}

const classes = (base: string, on: boolean, shown: boolean) =>
  `${base}${on ? ' on' : ''}${shown ? '' : ' off'}`;

export function TapeBoard(props: Props) {
  const { events, lanes, current } = props;
  const { where, lane, curve } = geometry(props);
  const shown = new Set(visibleOf(events, props.isolated).map((event) => event.id));
  return (
    <div class="tape-board" style={{ '--lanes': lanes.length }}>
      <Lanes lanes={lanes} isolated={props.isolated} isolate={props.isolate} />
      <div class="tape-track">
        <svg
          class="tape-lines"
          viewBox="0 0 1000 1000"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {events.flatMap((event) => {
            const { from, to } = lanesFor(event);
            return to.map((target) => (
              <path
                key={`${event.id}:${target}`}
                class={classes(
                  `tape-line audit-${event.tone}`,
                  current?.id === event.id,
                  shown.has(event.id),
                )}
                d={curve(where(event), lane(from), lane(target))}
              />
            ));
          })}
        </svg>
        {events.map((event) => (
          <button
            key={event.id}
            type="button"
            class={classes(
              `tape-dot audit-${event.tone}`,
              current?.id === event.id,
              shown.has(event.id),
            )}
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
