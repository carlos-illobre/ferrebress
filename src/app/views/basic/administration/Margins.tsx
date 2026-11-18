// El panel de los márgenes rápidos (R4): las cinco teclas, que se escriben y se guardan al salir.
import { groupOf, texts, what } from '../../../modules/administration/model.ts';
import { Heading, Said, Subhead } from './Heading.tsx';
import { locked, type PanelProps } from './look.ts';

export function MarginsPanel({ view }: PanelProps) {
  const t = texts.margins;
  const lines = view.margins as NonNullable<PanelProps['view']['margins']>;
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
        {lines.keys.map((one, i) => (
          <label key={`${i}-${one.value}`} class="admin-margin">
            <span class="admin-margin-key">{one.number}</span>
            <input
              inputMode="numeric"
              aria-label={one.label}
              defaultValue={one.value}
              readOnly={locked(view)}
              onBlur={(event) => view.typeMargin(i, (event.target as HTMLInputElement).value)}
              data-commit=""
            />
            <span>{t.unit}</span>
            <span class="admin-margin-sells">
              {t.sells} <b>{one.sells}</b>
            </span>
          </label>
        ))}
      </div>
      <p class="admin-detail">{lines.example}</p>
      <Said note={view.said} keys={['quickMargins']} />
    </>
  );
}
