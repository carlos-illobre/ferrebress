// El panel del redondeo (R3): el paso, cuántos precios cambian con cada uno y cómo quedan unos
// ejemplos con el paso que se mira.
import {
  groupOf,
  names,
  roundingSteps,
  settingInitials,
  texts,
  what,
} from '../../../modules/administration/model.ts';
import { Heading, Said, Subhead } from './Heading.tsx';
import { locked, onLook, type PanelProps } from './look.ts';
import { Options } from './Options.tsx';

type Lines = NonNullable<PanelProps['view']['rounding']>;

// Cómo quedan unos precios con el paso que se mira; sin precios, el ejemplo de la regla.
function Showcase({ showcase }: { showcase: Lines['showcase'] }) {
  return (
    <>
      <Subhead>{showcase.title}</Subhead>
      {showcase.noPrices && <p class="admin-detail">{texts.rounding.noPrices}</p>}
      <ul class="admin-showcase">
        {showcase.rows.map((one) => (
          <li key={one.name} class={one.changes ? 'admin-changes' : ''}>
            <span class="admin-showcase-name">{one.name}</span>
            <span class="admin-detail">{one.calculated}</span>
            <b class="admin-price">{one.price}</b>
          </li>
        ))}
      </ul>
    </>
  );
}

export function RoundingPanel({ view }: PanelProps) {
  const t = texts.rounding;
  const lines = view.rounding as Lines;
  return (
    <>
      <Heading
        group={groupOf.roundingStep}
        icon="calculator"
        title={t.title}
        subtitle={`${what.roundingStep.long}. ${t.subtitle}`}
        locked={locked(view)}
        big={lines.big}
      />
      <Subhead>{t.choose}</Subhead>
      <Options
        label={names.roundingStep}
        look="admin-options-steps"
        values={roundingSteps}
        chosen={lines.now}
        initial={settingInitials.roundingStep}
        disabled={locked(view)}
        text={lines.optionText}
        effect={lines.optionEffect}
        onLook={onLook(view, 'roundingStep')}
        onChoose={view.chooseStep}
      />
      <Said note={view.said} keys={['roundingStep']} />
      <Showcase showcase={lines.showcase} />
    </>
  );
}
