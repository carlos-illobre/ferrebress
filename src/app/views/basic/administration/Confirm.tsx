// La confirmación del redondeo (R3.4, E18): cuántos precios cambian, con «Cambiar N precios» y
// «Cancelar»; si el recálculo no se pudo, lo dice y deja reintentar (R3.5, E22).

import { roundUp } from '@ferrebress/shared/pricing/rounding';
import type { Administration, Confirm as Asked } from '../../../modules/administration/model.ts';
import { pesos, shown, texts, thousands } from '../../../modules/administration/model.ts';
import { useShortcutHints } from '../../../platform/view/shortcut-hints.ts';
import { Dialog } from '../ui/dialog/Dialog.tsx';

export function Confirm({ view, asked }: { view: Administration; asked: Asked }) {
  const t = texts.rounding;
  const title = t.confirmTitle(shown('roundingStep', asked.step));
  const prices = thousands(asked.prices);
  const keys = useShortcutHints('administration-confirm');
  const cancelKey = asked.failed ? keys.later : keys.cancel;
  const doKey = asked.failed ? keys.retry : keys.confirm;
  return (
    <Dialog label={title} className="admin-confirm">
      <h2>{title}</h2>
      <p class="admin-detail">{t.confirmDetail}</p>
      <p class="admin-confirm-count">
        {t.changing(prices, thousands(view.prices?.total ?? asked.prices))}
      </p>
      <ul class="admin-confirm-examples">
        {(view.prices?.examples ?? []).slice(0, 3).map((one) => (
          <li key={one.name}>
            <span>{one.name}</span>
            <b>
              {pesos(
                roundUp(
                  one.calculated,
                  (view.data as NonNullable<typeof view.data>).settings.roundingStep.value,
                ),
              )}{' '}
              → {pesos(roundUp(one.calculated, asked.step))}
            </b>
          </li>
        ))}
      </ul>
      {asked.failed && (
        <p class="admin-note admin-note-failed" role="alert">
          {t.recalcFailed}
        </p>
      )}
      <div class="admin-confirm-actions">
        <button type="button" class="admin-cancel" data-close="" data-mark="" onClick={view.cancel}>
          {asked.failed ? t.later : t.cancel}
          {cancelKey && <kbd>{cancelKey}</kbd>}
        </button>
        <button
          type="button"
          class="admin-do"
          data-primary=""
          data-mark=""
          onClick={view.confirmStep}
        >
          {asked.failed ? texts.retry : t.confirm(prices)}
          {doKey && <kbd>{doKey}</kbd>}
        </button>
      </div>
    </Dialog>
  );
}
