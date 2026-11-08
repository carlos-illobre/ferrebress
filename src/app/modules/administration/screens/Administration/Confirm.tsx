// La confirmación del redondeo (R3.4, E18): cuántos precios cambian, con «Cambiar N precios» y
// «Cancelar»; si el recálculo no se pudo, lo dice y deja reintentar (R3.5, E22).
import { Dialog } from '../../../../ui/dialog/Dialog.tsx';
import { shown, thousands } from '../../logic.ts';
import { texts } from '../../texts.ts';
import type { Administration, Confirm as Asked } from '../../useAdministration.ts';

export function Confirm({ view, asked }: { view: Administration; asked: Asked }) {
  const t = texts.rounding;
  const title = t.confirmTitle(shown('roundingStep', asked.step));
  const prices = thousands(asked.prices);
  return (
    <Dialog label={title} className="admin-confirm">
      <h2>{title}</h2>
      <p class="admin-detail">{t.confirmDetail}</p>
      <p class="admin-confirm-count">
        {t.changing(prices, thousands(view.prices?.total ?? asked.prices))}
      </p>
      {asked.failed && (
        <p class="admin-note admin-note-failed" role="alert">
          {t.recalcFailed}
        </p>
      )}
      <div class="admin-confirm-actions">
        <button
          type="button"
          class="admin-cancel"
          data-key={asked.failed ? 'a' : 'c'}
          data-close=""
          data-mark=""
          onClick={view.cancel}
        >
          {asked.failed ? t.later : t.cancel}
          <kbd>{asked.failed ? 'A' : 'C'}</kbd>
        </button>
        <button
          type="button"
          class="admin-do"
          data-key={asked.failed ? 'r' : 'p'}
          data-primary=""
          data-mark=""
          onClick={view.confirmStep}
        >
          {asked.failed ? texts.retry : t.confirm(prices)}
          <kbd>{asked.failed ? 'R' : 'P'}</kbd>
        </button>
      </div>
    </Dialog>
  );
}
