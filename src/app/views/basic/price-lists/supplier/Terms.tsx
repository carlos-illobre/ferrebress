// Cómo cobra un proveedor (R3.2): si sus precios incluyen IVA, sus descuentos en orden (cada dato se
// guarda al salir de su caja; se agregan, se quitan y se ordenan), su IVA de arranque y qué pasa con
// los costos al cambiar esto. Si cambian costos, antes se confirma cuántos (R3.5).
import { type Supplier, supplierTexts as texts } from '../../../../modules/price-lists/model.ts';
import { useShortcutHints } from '../../../../platform/view/shortcut-hints.ts';
import { Button } from '../../ui/button/Button.tsx';

type Props = { view: Supplier };

type Line = NonNullable<Supplier['terms']>['discounts'][number];

// Un descuento: cada dato se guarda al salir de su caja; se sube, se baja o se quita.
function Discount({ view, discount }: { view: Supplier; discount: Line }) {
  const edit = (field: 'name' | 'percent' | 'brand') => (event: FocusEvent) =>
    void view.editDiscount(discount.id, { [field]: (event.target as HTMLInputElement).value });
  return (
    <li onFocusCapture={() => view.chooseDiscount(discount.id)}>
      <input
        aria-label={texts.discountName}
        defaultValue={discount.name}
        readOnly={!view.editable}
        onBlur={edit('name')}
      />
      <input
        aria-label={texts.discountPercent}
        inputMode="decimal"
        defaultValue={discount.percent}
        readOnly={!view.editable}
        onBlur={edit('percent')}
      />
      <span>{texts.percentUnit}</span>
      <input
        aria-label={texts.discountBrand}
        placeholder={texts.allBrands}
        defaultValue={discount.brand}
        readOnly={!view.editable}
        onBlur={edit('brand')}
      />
      {view.editable && <Move view={view} discount={discount} />}
    </li>
  );
}

function Move({ view, discount }: { view: Supplier; discount: Line }) {
  return (
    <span class="supplier-discount-actions">
      {!discount.first && (
        <button type="button" data-mark="" onClick={() => void view.moveDiscount(discount.id, -1)}>
          {texts.up}
        </button>
      )}
      {!discount.last && (
        <button type="button" data-mark="" onClick={() => void view.moveDiscount(discount.id, 1)}>
          {texts.down}
        </button>
      )}
      <button type="button" data-mark="" onClick={() => void view.removeDiscount(discount.id)}>
        {texts.remove}
      </button>
    </span>
  );
}

function Discounts({ view }: Props) {
  const terms = view.terms as NonNullable<Supplier['terms']>;
  if (terms.discounts.length === 0) return <p class="supplier-muted">{texts.noDiscounts}</p>;
  return (
    <ol class="supplier-discounts">
      {terms.discounts.map((discount) => (
        <Discount
          key={`${discount.id}-${discount.name}-${discount.percent}-${discount.brand}`}
          view={view}
          discount={discount}
        />
      ))}
    </ol>
  );
}

function Adding({ view }: Props) {
  const keys = useShortcutHints('price-lists-supplier');
  const draft = view.adding;
  if (!view.editable) return null;
  if (!draft)
    return (
      <button type="button" class="lists-button" data-mark="" onClick={view.startAdding}>
        {texts.addDiscount}
        {keys.addDiscount && <kbd>{keys.addDiscount}</kbd>}
      </button>
    );
  return (
    <form
      class="supplier-adding"
      onSubmit={(event) => {
        event.preventDefault();
        void view.addDiscount();
      }}
    >
      <input
        aria-label={texts.discountName}
        value={draft.name}
        onInput={(event) => view.typeDraft({ name: (event.target as HTMLInputElement).value })}
      />
      <input
        aria-label={texts.discountPercent}
        inputMode="decimal"
        value={draft.percent}
        onInput={(event) => view.typeDraft({ percent: (event.target as HTMLInputElement).value })}
      />
      <input
        aria-label={texts.discountBrand}
        value={draft.brand}
        onInput={(event) => view.typeDraft({ brand: (event.target as HTMLInputElement).value })}
      />
      <button type="submit" class="lists-button">
        {texts.add}
      </button>
      <button type="button" class="lists-button" onClick={view.stopAdding}>
        {texts.cancel}
      </button>
    </form>
  );
}

function Options({ view }: Props) {
  const terms = view.terms as NonNullable<Supplier['terms']>;
  return (
    <>
      <label class="supplier-check">
        <input
          type="checkbox"
          checked={terms.vatIncluded}
          disabled={!view.editable}
          onChange={(event) => void view.setVatIncluded((event.target as HTMLInputElement).checked)}
        />
        {texts.vatIncluded}
      </label>
      <fieldset class="supplier-choice" disabled={!view.editable}>
        <legend>{texts.defaultVat}</legend>
        {terms.vats.map((vat) => (
          <label key={vat.value}>
            <input
              type="radio"
              name="default-vat"
              checked={vat.checked}
              onChange={() => void view.setDefaultVat(vat.value)}
            />
            {vat.label}
          </label>
        ))}
      </fieldset>
      <fieldset class="supplier-choice" disabled={!view.editable}>
        <legend>{texts.onChange}</legend>
        {terms.onChanges.map((option) => (
          <label key={option.value}>
            <input
              type="radio"
              name="on-change"
              checked={option.checked}
              onChange={() => void view.setOnChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </fieldset>
    </>
  );
}

// Se ve con «Ver costos»: el proveedor trae cómo cobra.
export function Terms({ view }: Props) {
  return (
    <div class="supplier-terms">
      <Options view={view} />
      <h3>{texts.discounts}</h3>
      <Discounts view={view} />
      <Adding view={view} />
      {view.termsSaid && (
        <p class="supplier-said" role="alert">
          {view.termsSaid}
        </p>
      )}
      {view.asked && (
        <div
          class="supplier-confirm"
          role="alertdialog"
          aria-label={texts.confirmCosts(view.asked.costs)}
        >
          <p>{texts.confirmCostsSays(view.asked.costs)}</p>
          <Button
            doing={texts.confirmCosts(view.asked.costs)}
            look="action"
            onPress={view.confirmCosts}
          >
            {texts.confirmCosts(view.asked.costs)}
          </Button>
          <Button doing={texts.cancel} closes onPress={view.cancelCosts}>
            {texts.cancel}
          </Button>
        </div>
      )}
    </div>
  );
}
