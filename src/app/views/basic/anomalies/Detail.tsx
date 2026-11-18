// El detalle de una anomalía (06 · R9.2, R9.4): las filas salteadas con lo que traía cada una (con «Ver
// costos»), la nota y «Marcar revisada», o «Volver a abrir» si ya está revisada.
import { type Anomalies, type AnomalyView, texts } from '../../../modules/anomalies/model.ts';
import { useShortcutHints } from '../../../platform/view/shortcut-hints.ts';
import { Button } from '../ui/button/Button.tsx';

type SkippedRows = Anomalies['rows'];

function SkippedRows({ rows }: { rows: SkippedRows }) {
  if (!rows.rows) return null;
  if (rows.rows.gone) return <p class="anomaly-muted">{texts.noRows}</p>;
  return (
    <>
      <ul class="anomaly-rows" aria-label={texts.rows}>
        {rows.lines.map((line) => (
          <li key={line.key}>
            <span>{line.cells}</span>
            {line.reason && <small>{line.reason}</small>}
          </li>
        ))}
      </ul>
      {rows.rows.failed && <p class="anomaly-muted">{texts.rowsFailed}</p>}
      {rows.hasMore && (
        <button type="button" class="lists-button anomaly-more" data-mark="" onClick={rows.more}>
          {texts.more}
        </button>
      )}
    </>
  );
}

export function Detail({ view, anomaly }: { view: Anomalies; anomaly: AnomalyView }) {
  const keys = useShortcutHints('anomalies');
  const can = view.actionsOf(anomaly);
  return (
    <div class="anomaly-detail">
      {can.rows === 'show' && <SkippedRows rows={view.rows} />}
      {can.rows === 'needs-costs' && <p class="anomaly-muted">{texts.rowsNeedCosts}</p>}
      {anomaly.note && <p class="anomaly-note">«{anomaly.note}»</p>}
      {can.review && (
        <div class="anomaly-review">
          <label>
            {texts.note}
            <textarea
              maxLength={view.noteMax}
              rows={2}
              value={view.noteOf(anomaly.id)}
              onInput={(event) =>
                view.write(anomaly.id, (event.target as HTMLTextAreaElement).value)
              }
            />
          </label>
          <Button
            doing={texts.review}
            icon="check"
            look="action"
            keyHint={keys.review}
            onPress={() => view.review(anomaly)}
          >
            {texts.review}
          </Button>
        </div>
      )}
      {can.reopen && (
        <Button doing={texts.reopen} icon="rotate-ccw" onPress={() => view.reopen(anomaly)}>
          {texts.reopen}
        </Button>
      )}
    </div>
  );
}
