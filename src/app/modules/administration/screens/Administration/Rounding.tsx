// El panel del redondeo (R3): el paso, cuántos precios cambian con cada uno y cómo quedan unos
// ejemplos con el paso que se mira.
import { roundingSteps } from '@ferrebress/shared/contracts/administration';
import { roundUp } from '@ferrebress/shared/pricing/rounding';
import { pesos, shown, thousands } from '../../logic.ts';
import { groupOf, names, texts, what } from '../../texts.ts';
import { Heading, Said, Subhead } from './Heading.tsx';
import { locked, looked, onLook, type PanelProps } from './look.ts';
import { Options } from './Options.tsx';

// El precio de ejemplo de la regla, cuando todavía no hay precios (§ 12, 1).
const example = { name: texts.rounding.example, calculated: 15_001 };

// Cómo quedan unos precios con el paso que se mira; sin precios, el ejemplo de la regla.
function Showcase({ view, step, now }: { view: PanelProps['view']; step: number; now: number }) {
  const t = texts.rounding;
  const examples = view.prices?.examples.length ? view.prices.examples : [example];
  const seeing = step !== now;
  return (
    <>
      <Subhead>{seeing ? t.showWith(shown('roundingStep', step)) : t.showToday}</Subhead>
      {!view.prices?.examples.length && <p class="admin-detail">{t.noPrices}</p>}
      <ul class="admin-showcase">
        {examples.map((one) => {
          const after = roundUp(one.calculated, step);
          const changes = seeing && after !== roundUp(one.calculated, now);
          return (
            <li key={one.name} class={changes ? 'admin-changes' : ''}>
              <span class="admin-showcase-name">{one.name}</span>
              <span class="admin-detail">{t.calculated(pesos(one.calculated))}</span>
              <b class="admin-price">{pesos(after)}</b>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export function RoundingPanel({ view, settings }: PanelProps) {
  const t = texts.rounding;
  const now = settings.roundingStep;
  const step = looked(view, 'roundingStep') ?? now;
  const prices = view.prices;
  const changes = (value: number) => prices?.changes[String(value)] ?? 0;
  const seeing = step !== now;
  return (
    <>
      <Heading
        group={groupOf.roundingStep}
        icon="calculator"
        title={t.title}
        subtitle={`${what.roundingStep.long}. ${t.subtitle}`}
        locked={locked(view)}
        big={{
          label: seeing
            ? t.ifChosen(shown('roundingStep', step))
            : t.now(shown('roundingStep', now)),
          value: seeing
            ? changes(step)
              ? t.change(thousands(changes(step)))
              : t.noChange
            : t.prices(thousands(prices?.total ?? 0)),
          looking: seeing,
        }}
      />
      <Subhead>{t.choose}</Subhead>
      <Options
        label={names.roundingStep}
        look="admin-options-seven"
        values={roundingSteps}
        chosen={now}
        initial={1000}
        disabled={locked(view)}
        text={(value) => (value ? pesos(value) : 'Sin')}
        effect={(value) => (value === now ? t.current : thousands(changes(value)))}
        onLook={onLook(view, 'roundingStep')}
        onChoose={view.chooseStep}
      />
      <Said note={view.said} keys={['roundingStep']} />
      <Showcase view={view} step={step} now={now} />
    </>
  );
}
