// El panel de los márgenes rápidos (R4): las cinco teclas, que se escriben y se guardan al salir.
import { thousands } from '../../logic.ts';
import { groupOf, texts, what } from '../../texts.ts';
import { Heading, Said, Subhead } from './Heading.tsx';
import { locked, type PanelProps } from './look.ts';

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
          </label>
        ))}
      </div>
      <Said note={view.said} keys={['quickMargins']} />
    </>
  );
}
