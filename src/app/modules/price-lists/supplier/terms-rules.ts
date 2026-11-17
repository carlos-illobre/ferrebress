// Los cambios a cómo cobra un proveedor (08 · R3.2), sin pedidos: cada uno devuelve cómo queda
// entero, que es lo que se guarda (con su versión). Un porcentaje se escribe como en la ferretería,
// «2,5», y se guarda en centésimos de por ciento (250).
import {
  discountLimits,
  maxDiscounts,
  type Terms,
  type TermsDiscount,
} from '@ferrebress/shared/contracts/price-lists';

// «2,5» o «2.5» → 250; vacío, con más de dos decimales o fuera de 0 a 100 (sin incluirlos), nada.
export function percentOf(text: string): number | undefined {
  const clean = text.trim().replace(',', '.');
  if (!/^\d{1,2}(\.\d{1,2})?$/.test(clean)) return undefined;
  const value = Math.round(Number(clean) * 100);
  const { min, max } = discountLimits.percent;
  return value >= min && value <= max ? value : undefined;
}

export const percentText = (value: number) =>
  (value / 100).toLocaleString('es-AR', { maximumFractionDigits: 2 });

export type DiscountDraft = { name: string; percent: string; brand: string };

// Un descuento escrito, si vale (R3.2): con nombre, porcentaje y, si se quiere, una marca.
export function discountOf(draft: DiscountDraft, id: string): TermsDiscount | undefined {
  const name = draft.name.trim();
  const percent = percentOf(draft.percent);
  const brand = draft.brand.trim();
  if (!name || name.length > discountLimits.name || percent === undefined) return undefined;
  if (brand.length > discountLimits.brand) return undefined;
  return { id, name, percent, brand: brand || null };
}

export const canAdd = (terms: Terms) => terms.discounts.length < maxDiscounts;

export const withDiscount = (terms: Terms, discount: TermsDiscount): Terms => ({
  ...terms,
  discounts: [...terms.discounts, discount],
});

export const withoutDiscount = (terms: Terms, id: string): Terms => ({
  ...terms,
  discounts: terms.discounts.filter((discount) => discount.id !== id),
});

export const replaced = (terms: Terms, discount: TermsDiscount): Terms => ({
  ...terms,
  discounts: terms.discounts.map((one) => (one.id === discount.id ? discount : one)),
});

// Cambia el orden (los descuentos van uno sobre otro, R3.3): uno más arriba (-1) o más abajo (+1).
export function moved(terms: Terms, id: string, by: -1 | 1): Terms {
  const at = terms.discounts.findIndex((discount) => discount.id === id);
  const to = at + by;
  if (at < 0 || to < 0 || to >= terms.discounts.length) return terms;
  const discounts = [...terms.discounts];
  [discounts[at], discounts[to]] = [discounts[to] as TermsDiscount, discounts[at] as TermsDiscount];
  return { ...terms, discounts };
}

export const sameTerms = (a: Terms, b: Terms) => JSON.stringify(a) === JSON.stringify(b);
