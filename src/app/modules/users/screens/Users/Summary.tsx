// Las cuentas de arriba (maqueta): cuántas pueden entrar, sus sesiones, sus celulares con huella y,
// en la computadora, cuántas no entraron todavía; y el buscador con los filtros, que en el celular
// van en el diálogo de «Buscar usuario» (pedido de Carlos).
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

// La caja para buscar, por nombre o correo, sin mayúsculas ni tildes.
export function SearchBox({ slash }: { slash?: boolean }) {
  const users = useUsersContext();
  return (
    <label class="users-search" data-private="">
      <Icon name="search" />
      <span class="visually-hidden">{texts.searchLabel}</span>
      <input
        type="search"
        value={users.search}
        placeholder={narrow() ? texts.search.short : texts.search.long}
        data-slash={slash ? '' : undefined}
        data-clear=""
        data-autofocus={slash ? undefined : ''}
        autocomplete="off"
        onInput={(event) => users.setSearch(event.currentTarget.value)}
      />
      {slash && <kbd>/</kbd>}
    </label>
  );
}

// Los filtros: todas, activas, sin entrar y de baja, con cuántas hay.
export function Chips() {
  const users = useUsersContext();
  const n = counts(users.people as PersonRow[]);
  return (
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
  );
}

// En la computadora, el buscador y los filtros arriba de la lista; en el celular, en un diálogo.
export function Filters() {
  return (
    <div class="users-filters desktop-only">
      <SearchBox slash />
      <Chips />
    </div>
  );
}
