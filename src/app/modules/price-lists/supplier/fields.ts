// Cambiar un dato del proveedor (08 · R1.7, R2.1): se guarda al cambiarlo, con el valor que se vio, y
// «Deshacer» lo vuelve a como estaba. Lo que no vale se dice en el lugar; si otra persona lo cambió
// antes, se muestra el de ahora.
import {
  type FieldChanged,
  type SupplierField,
  type SupplierResponse,
  supplierValue,
} from '@ferrebress/shared/contracts/price-lists';
import { notify } from '../../../platform/view/notify.ts';
import { suppliersApi } from '../api.ts';
import { priceListsSettings } from '../settings.ts';
import { supplierTexts as texts } from './texts.ts';

export type FieldDeps = {
  id: string;
  now: () => SupplierResponse | undefined;
  put: (supplier: SupplierResponse) => void;
  say: (field: SupplierField, text: string | undefined) => void;
};

const invalidOf = (field: SupplierField) =>
  field === 'name'
    ? texts.invalid.name
    : field === 'email'
      ? texts.invalid.email
      : texts.invalid.other;

const refusedText = (refusal: { error: string; value?: string | null }) => {
  if (refusal.error === 'field-changed') return texts.fieldChanged(refusal.value ?? texts.empty);
  if (refusal.error === 'supplier-exists' || refusal.error === 'supplier-inactive')
    return texts.exists;
  return texts.failed;
};

export async function changeField(
  deps: FieldDeps,
  field: SupplierField,
  raw: string,
  undoing = false,
): Promise<void> {
  const supplier = deps.now() as SupplierResponse;
  const before = supplier[field] ?? null;
  const value = supplierValue(field, raw);
  if (value === undefined) return deps.say(field, invalidOf(field));
  deps.say(field, undefined);
  if (value === before) return;
  const result = await suppliersApi.change(deps.id, { field, before, value });
  if (!result.ok) {
    const refusal = result as unknown as FieldChanged & { error: string };
    if (refusal.error === 'field-changed')
      deps.put({ ...supplier, [field]: refusal.value ?? undefined });
    return deps.say(field, refusedText(refusal));
  }
  deps.put(result.data);
  if (undoing) return;
  notify(texts.saved(texts.fields[field]), 'check', {
    label: texts.undo,
    ms: priceListsSettings.undoMs,
    run: () => void changeField(deps, field, before ?? '', true),
  });
}
