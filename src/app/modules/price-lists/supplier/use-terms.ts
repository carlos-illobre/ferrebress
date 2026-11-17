// Editar cómo cobra un proveedor (08 · R3.2): cada cambio arma cómo queda entero y lo guarda (R3.5).
// Lo que se escribe de un descuento nuevo y lo que se dice al intentar son de quien edita.
import type {
  SupplierResponse,
  Terms,
  TermsDiscount,
} from '@ferrebress/shared/contracts/price-lists';
import { useState } from 'preact/hooks';
import { type Asked, saveTerms, type TermsDeps } from './terms.ts';
import {
  canAdd,
  type DiscountDraft,
  discountOf,
  moved,
  percentText,
  replaced,
  withDiscount,
  withoutDiscount,
} from './terms-rules.ts';
import { supplierTexts as texts } from './texts.ts';

const blank: DiscountDraft = { name: '', percent: '', brand: '' };
let ids = 0;
const newId = () => `d${Date.now().toString(36)}${(++ids).toString(36)}`;

const draftOf = (discount: TermsDiscount): DiscountDraft => ({
  name: discount.name,
  percent: percentText(discount.percent),
  brand: discount.brand ?? '',
});

export function useTerms(
  id: string,
  now: () => SupplierResponse | undefined,
  put: TermsDeps['put'],
) {
  const [said, say] = useState<string>(); // local: lo que pasó al guardar
  const [asked, ask] = useState<Asked | null>(null); // local: los costos que cambian, por confirmar
  const [adding, setAdding] = useState<DiscountDraft | null>(null); // local: el descuento nuevo
  const deps: TermsDeps = { id, now, put, say, ask };
  // Se edita con el proveedor a la vista: tiene cómo cobra.
  const terms = () => ((now() as SupplierResponse).terms as { value: Terms }).value;
  const save = (next: Terms) => saveTerms(deps, next);
  return {
    termsSaid: said,
    asked,
    adding,
    setVatIncluded: (vatIncluded: boolean) => save({ ...terms(), vatIncluded }),
    setDefaultVat: (defaultVat: Terms['defaultVat']) => save({ ...terms(), defaultVat }),
    setOnChange: (onChange: Terms['onChange']) => save({ ...terms(), onChange }),
    // Un dato de un descuento, al salir de su caja: si queda inválido, se dice y no se guarda.
    editDiscount: (discountId: string, change: Partial<DiscountDraft>) => {
      const before = terms().discounts.find((one) => one.id === discountId) as TermsDiscount;
      const edited = discountOf({ ...draftOf(before), ...change }, discountId);
      if (!edited) return say(texts.badDiscount);
      return save(replaced(terms(), edited));
    },
    removeDiscount: (discountId: string) => save(withoutDiscount(terms(), discountId)),
    moveDiscount: (discountId: string, by: -1 | 1) => save(moved(terms(), discountId, by)),
    startAdding: () => (canAdd(terms()) ? setAdding(blank) : say(texts.maxDiscounts)),
    // Se escribe con el descuento nuevo abierto.
    typeDraft: (change: Partial<DiscountDraft>) =>
      setAdding({ ...(adding as DiscountDraft), ...change }),
    stopAdding: () => setAdding(null),
    addDiscount: async () => {
      const discount = discountOf(adding as DiscountDraft, newId());
      if (!discount) return say(texts.badDiscount);
      setAdding(null);
      await save(withDiscount(terms(), discount));
    },
    confirmCosts: () => asked && saveTerms(deps, asked.terms, asked.costs),
    cancelCosts: () => ask(null),
  };
}
