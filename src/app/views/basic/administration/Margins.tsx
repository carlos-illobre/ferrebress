// El panel de los márgenes rápidos (R4): las cinco teclas, que se escriben y se guardan al salir.
import {
  exampleCost,
  groupOf,
  pesos,
  sellsAt,
  shown,
  texts,
  thousands,
  what,
} from '../../../modules/administration/model.ts';
import { Heading, Said, Subhead } from './Heading.tsx';
import { locked, type PanelProps } from './look.ts';

export function MarginsPanel({ view, settings }: PanelProps) {
  const t = texts.margins;
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
              onBlur={(event) => view.typeMargin(i, (event.target as HTMLInputElement).value)}
              data-commit=""
            />
            <span>%</span>
            <span class="admin-margin-sells">
              {t.sells} <b>{pesos(sellsAt(margin, settings.roundingStep))}</b>
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
