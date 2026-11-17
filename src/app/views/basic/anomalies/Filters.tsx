// Los filtros de Anomalías (R9.2): por estado y por tipo, como los da el modelo.
import { type Anomalies, texts } from '../../../modules/anomalies/model.ts';

export function Filters({ view }: { view: Anomalies }) {
  return (
    <div class="anomalies-filters">
      <fieldset>
        <legend class="visually-hidden">{texts.filterStatus}</legend>
        {view.filters.statuses.map((option) => (
          <button
            key={option.value}
            type="button"
            data-mark=""
            aria-pressed={option.pressed}
            onClick={() => view.filterBy({ status: option.value })}
          >
            {option.label}
          </button>
        ))}
      </fieldset>
      <fieldset>
        <legend class="visually-hidden">{texts.filterKind}</legend>
        {view.filters.kinds.map((option) => (
          <button
            key={option.value ?? 'all'}
            type="button"
            data-mark=""
            aria-pressed={option.pressed}
            onClick={() => view.filterBy({ kind: option.value })}
          >
            {option.label}
          </button>
        ))}
      </fieldset>
    </div>
  );
}
