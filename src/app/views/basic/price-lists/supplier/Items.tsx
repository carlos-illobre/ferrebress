// Los productos de un proveedor (R8): los que vienen o los dados de baja (con desde cuándo), con un
// buscador, de a 50, cada costo con su cuenta.
import { type Supplier, supplierTexts as texts } from '../../../../modules/price-lists/model.ts';
import { ScreenSearch } from '../ScreenSearch.tsx';

export function Items({ view }: { view: Supplier }) {
  const items = view.items;
  return (
    <div class="supplier-items">
      <div class="review-chips">
        <button
          type="button"
          class="lists-chip"
          data-mark=""
          aria-pressed={!items.discontinued}
          onClick={() => items.setDiscontinued(false)}
        >
          {texts.current}
        </button>
        <button
          type="button"
          class="lists-chip"
          data-mark=""
          aria-pressed={items.discontinued}
          onClick={() => items.setDiscontinued(true)}
        >
          {texts.discontinued}
        </button>
      </div>
      <ScreenSearch look="supplier-search" words={texts.search} view={items} />
      {items.shown.length === 0 ? (
        <p class="supplier-muted">{texts.noItems}</p>
      ) : (
        <ul class="supplier-rows">
          {items.shown.map((item, index) => (
            <li key={item.code}>
              <b>{item.code}</b>
              <span>{item.description}</span>
              {item.brand && <small>{item.brand}</small>}
              {item.gone && <small>{item.gone}</small>}
              <b>{item.cost}</b>
              <button
                type="button"
                class="supplier-link"
                data-mark=""
                onClick={() => items.toggleCost(index)}
              >
                {items.costLabel(index)}
              </button>
              {items.isOpen(index) && (
                <ol class="review-steps">
                  {item.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              )}
            </li>
          ))}
        </ul>
      )}
      {items.hasMore && (
        <button type="button" class="lists-button" data-mark="" onClick={() => void items.more()}>
          {texts.more}
        </button>
      )}
    </div>
  );
}
