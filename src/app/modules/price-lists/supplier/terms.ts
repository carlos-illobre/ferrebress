// Guardar cómo cobra un proveedor (08 · R3.5): entero, con la versión que se vio. Si cambian costos,
// antes se ve cuántos y se confirma; si no cambia ninguno, se guarda con «Deshacer» (R1.7). Si otra
// persona lo cambió antes, se muestra como está ahora.
import type {
  ConfirmCosts,
  SupplierResponse,
  Terms,
  TermsChanged,
} from '@ferrebress/shared/contracts/price-lists';
import { notify } from '../../../platform/view/notify.ts';
import { suppliersApi } from '../api.ts';
import { priceListsSettings } from '../settings.ts';
import { sameTerms } from './terms-rules.ts';
import { supplierTexts as texts } from './texts.ts';

export type Asked = { terms: Terms; costs: number };

export type TermsDeps = {
  id: string;
  now: () => SupplierResponse | undefined;
  put: (supplier: SupplierResponse) => void;
  say: (text: string | undefined) => void;
  ask: (asked: Asked | null) => void;
};

const refusals: Record<string, string> = {
  'list-applying': texts.applying,
  'recalc-failed': texts.recalcFailed,
};

export async function saveTerms(deps: TermsDeps, next: Terms, confirmed?: number, undoing = false) {
  const supplier = deps.now() as SupplierResponse;
  const current = supplier.terms as { value: Terms; version: number };
  deps.ask(null);
  if (sameTerms(current.value, next)) return;
  deps.say(undefined);
  const result = await suppliersApi.terms(deps.id, {
    terms: next,
    version: current.version,
    ...(confirmed !== undefined && { confirmed }),
  });
  if (result.ok) {
    deps.put({ ...supplier, terms: { value: result.data.value, version: result.data.version } });
    if (result.data.costs > 0 || undoing) return notify(texts.termsSaved, 'check');
    return notify(texts.termsSaved, 'check', {
      label: texts.undo,
      ms: priceListsSettings.undoMs,
      run: () => void saveTerms(deps, current.value, undefined, true),
    });
  }
  refused(deps, supplier, next, result as unknown as { error: string });
}

function refused(
  deps: TermsDeps,
  supplier: SupplierResponse,
  next: Terms,
  refusal: { error: string },
) {
  if (refusal.error === 'confirm-costs')
    return deps.ask({ terms: next, costs: (refusal as ConfirmCosts).costs });
  if (refusal.error === 'terms-changed') {
    const now = refusal as TermsChanged;
    deps.put({ ...supplier, terms: { value: now.value, version: now.version } });
    return deps.say(texts.termsChanged);
  }
  deps.say(refusals[refusal.error] ?? texts.failed);
}
