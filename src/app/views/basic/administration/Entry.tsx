// El panel de la entrada (R11): las horas para entrar sin conexión, de una lista, y los tres números
// de intentos, que se escriben como los de las listas de precios.
import {
  entryAttempts,
  groupOf,
  names,
  offlineHoursOptions,
  settingInitials,
  texts,
  what,
} from '../../../modules/administration/model.ts';
import { Heading, Said, Subhead } from './Heading.tsx';
import { NumberField } from './Lists.tsx';
import { locked, onLook, type PanelProps } from './look.ts';
import { Options } from './Options.tsx';

export function EntryPanel({ view, settings }: PanelProps) {
  const t = texts.entry;
  const now = settings.offlineHours;
  return (
    <>
      <Heading
        group={groupOf.entry}
        icon="fingerprint"
        title={t.title}
        subtitle={t.subtitle}
        locked={locked(view)}
      />
      <section>
        <Subhead>{names.offlineHours}</Subhead>
        <p class="admin-detail">{what.offlineHours.long}</p>
        <Options
          label={names.offlineHours}
          values={offlineHoursOptions}
          chosen={now}
          initial={settingInitials.offlineHours}
          disabled={locked(view)}
          text={texts.units.hours}
          effect={(v) => (v === now ? texts.rounding.current : '')}
          onLook={onLook(view, 'offlineHours')}
          onChoose={(v) => void view.save('offlineHours', v)}
        />
        <Said note={view.said} keys={['offlineHours']} />
      </section>
      <section>
        <Subhead>{t.attempts}</Subhead>
        <div class="admin-two">
          {entryAttempts.map((name) => (
            <NumberField key={name} view={view} settings={settings} name={name} />
          ))}
        </div>
      </section>
    </>
  );
}
