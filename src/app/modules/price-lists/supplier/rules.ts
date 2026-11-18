// Lo que muestra la pantalla de un proveedor (08 · pantalla 4), resuelto para cualquier vista: sus
// datos, cómo cobra, sus listas y sus productos. Sin pedidos.
import {
  type SupplierField,
  type SupplierItem,
  type SupplierList,
  type SupplierResponse,
  supplierFields,
  type Terms,
} from '@ferrebress/shared/contracts/price-lists';
import { formatPesos } from '@ferrebress/shared/money/money';
import { nowMs, shownDate, sinceOf } from '../../../platform/time.ts';
import { stepsLines } from '../review/rules.ts';
import { listReasonTexts, listStatusTexts } from '../texts-status.ts';
import { percentText } from './terms-rules.ts';
import { supplierTexts as texts } from './texts.ts';

const since = (at: string) => sinceOf(Date.parse(at), nowMs());

// Sus datos (R2.1), cada uno con su nombre y lo que tiene.
export const fieldsOf = (supplier: SupplierResponse) =>
  supplierFields.map((field: SupplierField) => ({
    field,
    label: texts.fields[field],
    value: supplier[field] ?? '',
    // El vendedor, el teléfono y el correo son de alguien de afuera (R9.1).
    personal: field === 'seller' || field === 'phone' || field === 'email',
    // La nota va en varias líneas.
    multiline: field === 'note',
  }));

// Cómo cobra (R3.2), en palabras.
export const termsLines = (terms: Terms) => ({
  vatIncluded: terms.vatIncluded,
  discounts: terms.discounts.map((discount, index) => ({
    id: discount.id,
    name: discount.name,
    percent: percentText(discount.percent),
    brand: discount.brand ?? '',
    applies: discount.brand ? texts.onlyBrand(discount.brand) : texts.allBrands,
    first: index === 0,
    last: index === terms.discounts.length - 1,
  })),
  vats: [210, 105, 270].map((vat) => ({
    value: vat as Terms['defaultVat'],
    label: texts.vats[vat] as string,
    checked: terms.defaultVat === vat,
  })),
  onChanges: (['recalculate', 'next'] as const).map((value) => ({
    value,
    label: value === 'recalculate' ? texts.recalculate : texts.next,
    checked: terms.onChange === value,
  })),
});

// Una lista del proveedor (R6.7): su fecha, su estado, quién la subió y quién la aplicó o descartó.
export function listLines(list: SupplierList) {
  const decided =
    list.decidedAt &&
    (list.status === 'applied' || list.status === 'discarded') &&
    texts.decidedBy(
      list.status === 'applied' ? texts.appliedBy : texts.discardedBy,
      list.decidedBy ?? texts.someone,
      since(list.decidedAt),
    );
  return {
    id: list.id,
    title: list.listDate ? texts.listOf(shownDate(list.listDate)) : texts.noDate,
    status: listStatusTexts[list.status],
    reason: list.reason ? listReasonTexts[list.reason] : undefined,
    uploaded: texts.uploadedBy(list.uploadedBy ?? texts.someone, since(list.uploadedAt)),
    decided: decided || undefined,
    fileName: list.fileName,
    file: list.file,
    reviewable: list.status === 'pending',
  };
}

// Desde cuándo no viene (R8.2): desde una lista, o porque se dio de baja al proveedor.
function goneOf(gone: SupplierItem['goneSince']) {
  if (!gone) return undefined;
  if (!gone.listId) return texts.goneWithSupplier;
  return texts.goneSince(gone.listDate ? shownDate(gone.listDate) : texts.noDate);
}

// Un producto (R8.1, R8.2): su costo con su cuenta y, dado de baja, desde cuándo.
export const itemLines = (item: SupplierItem) => ({
  code: item.code,
  description: item.description,
  brand: item.brand,
  cost: formatPesos(BigInt(item.cost)),
  steps: stepsLines(item.basis),
  gone: goneOf(item.goneSince),
});
