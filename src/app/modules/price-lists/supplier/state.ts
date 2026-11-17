// Dar de baja un proveedor y reactivarlo (08 · R2.4, R2.5, R2.6): dar de baja se confirma siempre con
// cuántos productos pierden su costo y cuántos quedan dados de baja; mientras una lista suya se
// aplica, no se puede.
import { notify } from '../../../platform/view/notify.ts';
import { suppliersApi } from '../api.ts';
import { supplierTexts as texts } from './texts.ts';

export type Dropping = { costs: number; discontinued: number };

export type StateDeps = {
  id: string;
  name: () => string;
  reload: () => void;
  say: (text: string | undefined) => void;
  ask: (dropping: Dropping | null) => void;
};

export async function deactivate(deps: StateDeps, confirmed?: Dropping) {
  deps.say(undefined);
  const result = await suppliersApi.deactivate(deps.id, confirmed);
  if (result.ok) {
    deps.ask(null);
    deps.reload();
    return notify(texts.deactivated(deps.name()), 'check');
  }
  const refusal = result as unknown as { error: string } & Dropping;
  if (refusal.error === 'confirm-deactivate')
    return deps.ask({ costs: refusal.costs, discontinued: refusal.discontinued });
  deps.ask(null);
  deps.say(refusal.error === 'list-applying' ? texts.applying : texts.failed);
}

export async function reactivate(deps: StateDeps) {
  const result = await suppliersApi.reactivate(deps.id);
  if (!result.ok) return deps.say(texts.failed);
  deps.reload();
  notify(texts.reactivated(deps.name()), 'check');
}
