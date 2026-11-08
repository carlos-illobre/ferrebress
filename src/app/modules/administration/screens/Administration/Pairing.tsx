// El panel de los días del vínculo (R7): escribirlos, elegirlos o deslizarlos, con el día en que
// vence y el calendario.
import { useState } from 'preact/hooks';
import { useNarrow } from '../../../../platform/narrow.ts';
import { serverNow } from '../../../../platform/server/clock.ts';
import { expiresOn, weeks } from '../../logic.ts';
import { administrationSettings } from '../../settings.ts';
import { groupOf, names, texts, what } from '../../texts.ts';
import { Heading, Said, Subhead } from './Heading.tsx';
import { locked, type PanelProps } from './look.ts';

const typedIn = (event: Event) => (event.target as HTMLInputElement).value;

// Lo escrito, como lo escribió; los días, solo si es un número que se puede mostrar (lo que no vale lo
// dice la validación al guardar, R2.2).
type Days = {
  text: string;
  days: number;
  locked: boolean;
  type: (text: string) => void;
  save: (text: string) => void;
};

// Escribir los días o elegir uno de los de siempre; lo escrito se guarda al salir o con Enter.
function DaysField({ text, locked: off, type, save, chosen }: Days & { chosen: number }) {
  return (
    <div class="admin-days">
      <label class="admin-days-field">
        <input
          inputMode="numeric"
          aria-label={names.pairingDays}
          value={text}
          readOnly={off}
          onInput={(event) => type(typedIn(event))}
          onBlur={() => save(text)}
          onKeyDown={(event) => event.key === 'Enter' && (event.target as HTMLInputElement).blur()}
        />
        <span>{texts.pairing.days}</span>
      </label>
      {[7, 15, 30, 90, 365].map((n) => (
        <button
          key={n}
          type="button"
          class="admin-chip"
          aria-pressed={chosen === n}
          disabled={off}
          onClick={() => save(String(n))}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

// El deslizador, que se guarda al soltarlo (con el dedo, el mouse o la tecla, no en cada paso), y el
// calendario de semanas.
function Slider({ days, locked: off, type, save }: Days) {
  const weeksShown = useNarrow()
    ? administrationSettings.weeks.narrow
    : administrationSettings.weeks.wide;
  return (
    <>
      <input
        type="range"
        class="admin-slider"
        min={1}
        max={365}
        value={days}
        aria-label={names.pairingDays}
        disabled={off}
        onInput={(event) => type(typedIn(event))}
        onPointerUp={(event) => save(typedIn(event))}
        onKeyUp={(event) => save(typedIn(event))}
      />
      <div class="admin-weeks" aria-hidden="true">
        {weeks(days, weeksShown).map((kind, i) => (
          <i key={i} class={kind && `admin-week-${kind}`} />
        ))}
      </div>
      <p class="admin-detail">{texts.pairing.weeks}</p>
    </>
  );
}

export function PairingPanel({ view, settings }: PanelProps) {
  const t = texts.pairing;
  // local: lo que se escribe o se desliza, hasta guardarlo; lo guardado viaja con el aviso.
  const [typed, setTyped] = useState<string | undefined>();
  const text = typed ?? String(settings.pairingDays);
  const asNumber = Number(text);
  const shows = Number.isInteger(asNumber) && asNumber >= 1 && asNumber <= 365;
  const days = shows ? asNumber : settings.pairingDays;
  const props: Days = {
    text,
    days,
    locked: locked(view),
    type: setTyped,
    save: (value) => {
      setTyped(undefined);
      if (value !== String(settings.pairingDays)) void view.save('pairingDays', Number(value));
    },
  };
  return (
    <>
      <Heading
        group={groupOf.pairingDays}
        icon="link"
        title={t.title}
        subtitle={`${what.pairingDays.long}. ${t.subtitle}`}
        locked={props.locked}
        big={{
          label: t.expires,
          value: expiresOn(days, (serverNow() as Date).getTime()),
          looking: days !== settings.pairingDays,
        }}
      />
      <Subhead>{t.howMany}</Subhead>
      <DaysField {...props} chosen={settings.pairingDays} />
      <Said note={view.said} keys={['pairingDays']} />
      <Slider {...props} />
    </>
  );
}
