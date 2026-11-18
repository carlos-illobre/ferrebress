// El detalle de una lista (R6.3): cada producto con su costo de antes y el nuevo, cuánto cambia y, al
// tocarlo, su cuenta (R3.4); las salteadas, con lo que traían y su motivo.
import {
  type Review,
  type RowLines,
  reviewTexts as texts,
} from '../../../../modules/price-lists/model.ts';

function Row({ view, row, at }: { view: Review; row: RowLines; at: string }) {
  const open = view.isOpen(at);
  return (
    <li class="review-row">
      <div class="review-product">
        <b>{row.code}</b>
        <span>{row.description}</span>
        {row.brand && <small>{row.brand}</small>}
        {row.cells && <small>{row.cells}</small>}
      </div>
      {row.skipped ? (
        <span class="review-skipped">{row.skipped}</span>
      ) : (
        <div class="review-costs">
          {row.previous && <span>{row.previous}</span>}
          <b>{row.cost}</b>
          {row.variation && <span class="review-variation">{row.variation}</span>}
          {row.steps && (
            <button type="button" data-mark="" onClick={() => view.toggleCost(at)}>
              {view.costLabel(at)}
            </button>
          )}
        </div>
      )}
      {open && row.steps && (
        <ol class="review-steps">
          {row.steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      )}
    </li>
  );
}

// «Para revisar», aparte y arriba de todo (R6.4, E57).
function Flagged({ view }: { view: Review }) {
  if (view.flagged.length === 0) return null;
  return (
    <section class="review-flagged">
      <h3>{texts.flaggedTitle}</h3>
      <ul class="review-rows">
        {view.flagged.map((row, index) => (
          <Row key={`f${index}-${row.code}`} view={view} row={row} at={`f${index}`} />
        ))}
      </ul>
      {view.moreFlagged && (
        <button type="button" class="lists-button" data-mark="" onClick={view.allFlagged}>
          {texts.allFlagged}
        </button>
      )}
      <h3>{texts.allTitle}</h3>
    </section>
  );
}

export function Rows({ view }: { view: Review }) {
  if (view.rows.length === 0) return <p class="review-empty">{texts.empty}</p>;
  return (
    <>
      <Flagged view={view} />
      <ul class="review-rows">
        {view.rows.map((row, index) => (
          <Row key={`${index}-${row.code}`} view={view} row={row} at={String(index)} />
        ))}
      </ul>
      {view.hasMore && (
        <button type="button" class="lists-button" data-mark="" onClick={() => void view.more()}>
          {texts.more}
        </button>
      )}
    </>
  );
}
