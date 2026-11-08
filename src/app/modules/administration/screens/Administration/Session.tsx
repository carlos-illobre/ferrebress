// El panel de los tiempos de la sesión (R6): las dos listas y un día en el mostrador con lo que
// harían.
import { sessionIdleOptions, sessionMaxOptions } from '@ferrebress/shared/contracts/administration';
import { counterDay, maxEnds } from '../../logic.ts';
import { groupOf, names, texts, what } from '../../texts.ts';
import { Heading, Said, Subhead } from './Heading.tsx';
import { locked, looked, onLook, type PanelProps } from './look.ts';
import { Options } from './Options.tsx';

// Un día en el mostrador con lo que harían los dos tiempos que se miran.
function CounterDay({ idle, max }: { idle: number; max: number }) {
  const t = texts.session;
  const day = counterDay(idle, max);
  return (
    <>
      <Subhead>{t.day}</Subhead>
      <div class="admin-day" aria-hidden="true">
        <span class="admin-day-max" style={{ transform: `scaleX(${day.maxUntil})` }} />
        <span
          class="admin-day-idle"
          style={{
            left: `${day.at.lunch * 100}%`,
            transform: `scaleX(${day.idleUntil - day.at.lunch})`,
          }}
        />
      </div>
      <ul class="admin-says">
        <li>{day.closesAtLunch ? t.closesAtLunch(day.closesAtLunch) : t.staysAtLunch}</li>
        <li>{day.endsWhileOpen ? t.endsWhileOpen(day.endsAt) : t.endsAfterClosing(day.endsAt)}</li>
      </ul>
    </>
  );
}

// Una de las dos listas, con su nombre, qué cambia y lo que haría cada opción.
function Times({ view, settings, kind }: PanelProps & { kind: 'sessionIdle' | 'sessionMax' }) {
  const t = texts.session;
  const now = settings[kind];
  const idle = kind === 'sessionIdle';
  const effect = (v: number) => {
    if (v === now) return texts.rounding.current;
    if (!idle) return t.at(maxEnds(v));
    return v < now ? t.shorter : t.longer;
  };
  return (
    <div>
      <Subhead>{names[kind]}</Subhead>
      <p class="admin-detail">{what[kind].long}</p>
      <Options
        label={names[kind]}
        values={idle ? sessionIdleOptions : sessionMaxOptions}
        chosen={now}
        initial={idle ? 60 : 8}
        disabled={locked(view)}
        text={idle ? texts.units.minutes : texts.units.hours}
        effect={effect}
        onLook={onLook(view, kind)}
        onChoose={(v) => void view.save(kind, v)}
      />
      <Said note={view.said} keys={[kind]} />
    </div>
  );
}

export function SessionPanel({ view, settings }: PanelProps) {
  const t = texts.session;
  return (
    <>
      <Heading
        group={groupOf.session}
        icon="timer"
        title={t.title}
        subtitle={t.subtitle}
        locked={locked(view)}
      />
      <div class="admin-two">
        <Times view={view} settings={settings} kind="sessionIdle" />
        <Times view={view} settings={settings} kind="sessionMax" />
      </div>
      <CounterDay
        idle={looked(view, 'sessionIdle') ?? settings.sessionIdle}
        max={looked(view, 'sessionMax') ?? settings.sessionMax}
      />
    </>
  );
}
