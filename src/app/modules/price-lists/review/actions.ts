// Aplicar o descartar una lista en espera (08 · R6.5, R6.6, R6.9, R6.10, R6.11): con los números que
// vio quien aplica; si cambiaron, otra persona la aplica o ya no está en espera, se dice.
import type { ListState, ListSummary } from '@ferrebress/shared/contracts/price-lists';
import { numbersOf } from '@ferrebress/shared/contracts/price-lists';
import { notify } from '../../../platform/view/notify.ts';
import { listsApi } from '../api.ts';
import { openSuppliers } from '../pages.ts';
import { reviewTexts as texts } from './texts.ts';

type Deps = {
  listId: string;
  put: (state: ListState) => void;
  reload: () => void;
  say: (text: string | undefined) => void;
};

const refusals: Record<string, string> = {
  'numbers-changed': texts.numbersChanged,
  'list-applying': texts.alreadyApplying,
  'list-applied': texts.alreadyApplied,
  'list-closed': texts.closed,
  'list-too-old': texts.tooOld.short,
};

export async function apply(deps: Deps, summary: ListSummary) {
  deps.say(undefined);
  const result = await listsApi.apply(deps.listId, numbersOf(summary));
  if (result.ok) return deps.put(result.data);
  deps.say(refusals[result.error] ?? texts.failed);
  if (result.error in refusals) deps.reload();
}

export async function discard(deps: Deps) {
  const result = await listsApi.discard(deps.listId);
  if (!result.ok) return deps.say(refusals[result.error] ?? texts.failed);
  deps.put(result.data);
  notify(texts.discarded, 'check');
  openSuppliers();
}

// Mientras se aplica, cancelar: se deshace todo y vuelve a esperar (R4.11); sigue por el tema.
export async function cancelApply(deps: Deps) {
  const result = await listsApi.cancel(deps.listId);
  if (!result.ok) deps.say(texts.failed);
}
