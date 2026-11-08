// El panel de los márgenes rápidos (R4): las cinco teclas, que se escriben y se guardan al salir.
import { roundUp } from '@ferrebress/shared/pricing/rounding';
import { pesos, shown, thousands } from '../../logic.ts';
import { groupOf, texts, what } from '../../texts.ts';
import { Heading, Said, Subhead } from './Heading.tsx';
import { locked, type PanelProps } from './look.ts';

// El costo de ejemplo con el que cada tecla dice a cuánto vende (maqueta final).
const exampleCost = 4000;

export function MarginsPanel({ view, settings }: PanelProps) {
  const t = texts.margins;
  // Lo escrito se guarda al salir de la caja o con Enter (diseño de 06, § 7).
  const write = (index: number, text: string) => {
    const typed = Number(text.replace(/\./g, ''));
    const next = settings.quickMargins.map((margin, i) => (i === index ? typed : margin));
    if (typed !== settings.quickMargins[index]) void view.save('quickMargins', next);
  };
  return (
    <>
      <Heading
        group={groupOf.quickMargins}
        icon="percent"
        title={t.title}
        subtitle={`${what.quickMargins.long}. ${t.subtitle}`}
        locked={locked(view)}
      />
      <Subhead>{t.touch}</Subhead>
      <div class="admin-margins">
        {settings.quickMargins.map((margin, i) => (
          <label key={`${i}-${margin}`} class="admin-margin">
            <span class="admin-margin-key">{i + 1}</span>
            <input
              inputMode="numeric"
              aria-label={t.key(i + 1)}
              defaultValue={thousands(margin)}
              readOnly={locked(view)}
              onBlur={(event) => write(i, (event.target as HTMLInputElement).value)}
              onKeyDown={(event) =>
                event.key === 'Enter' && (event.target as HTMLInputElement).blur()
              }
            />
            <span>%</span>
            <span class="admin-margin-sells">
              {t.sells}{' '}
              <b>{pesos(roundUp(exampleCost * (1 + margin / 100), settings.roundingStep))}</b>
            </span>
          </label>
        ))}
      </div>
      <p class="admin-detail">
        {t.example(pesos(exampleCost), shown('roundingStep', settings.roundingStep))}
      </p>
      <Said note={view.said} keys={['quickMargins']} />
    </>
  );
}
