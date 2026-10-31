// Las cuentas de arriba (maqueta): cuántas pueden entrar, sus sesiones, sus celulares con huella y,
// en la computadora, cuántas no entraron todavía; y el buscador con los filtros, que en el celular
// bajan de renglón en lugar de correrse al costado (pedido de Carlos).
import type { PersonRow } from '@ferrebress/shared/contracts/users';
import { Icon, type IconName } from '../../../../ui/icon/Icon.tsx';
import { counts, type Filter } from '../../logic.ts';
import { useUsersContext } from '../../state.ts';
import { texts } from '../../texts.ts';
import './Summary.css';

function Stat({
  icon,
  n,
  label,
  tone,
}: {
  icon: IconName;
  n: number;
  label: string;
  tone: string;
}) {
  return (
    <div class={`users-stat ${tone}`}>
      <span class="users-stat-icon">
        <Icon name={icon} />
      </span>
      <div>
        <b>{n}</b>
        <span>{label}</span>
      </div>
    </div>
  );
}

export function Stats() {
  const users = useUsersContext();
  const n = counts(users.people as PersonRow[]);
  return (
    <div class="users-stats">
      <Stat icon="users" n={n.active} label={texts.stats.active} tone="green" />
      <Stat icon="monitor" n={n.sessions} label={texts.stats.sessions} tone="amber" />
      <Stat icon="fingerprint" n={n.phones} label={texts.stats.phones} tone="orange" />
      <Stat icon="hourglass" n={n.never} label={texts.stats.never} tone="urgent desktop-only" />
    </div>
  );
}

const filters: Filter[] = ['all', 'active', 'never', 'off'];
// El texto de adentro no se puede cambiar con el CSS: se elige al dibujarlo (00 · R3.2).
const narrow = () => matchMedia('(max-width: 899px)').matches;

export function Filters() {
  const users = useUsersContext();
  const n = counts(users.people as PersonRow[]);
  return (
    <div class="users-filters">
      <label class="users-search" data-private="">
        <Icon name="search" />
        <span class="visually-hidden">{texts.searchLabel}</span>
        <input
          type="search"
          value={users.search}
          placeholder={narrow() ? texts.search.short : texts.search.long}
          data-slash=""
          data-clear=""
          autocomplete="off"
          onInput={(event) => users.setSearch(event.currentTarget.value)}
        />
        <kbd>/</kbd>
      </label>
      <fieldset class="users-chips">
        <legend class="visually-hidden">{texts.filtersLabel}</legend>
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            class="users-chip"
            aria-pressed={users.filter === filter}
            onClick={() => users.setFilter(filter)}
          >
            {texts.filters[filter]} <span>{n[filter]}</span>
          </button>
        ))}
      </fieldset>
    </div>
  );
}
