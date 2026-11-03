// Las cuentas de arriba (maqueta): cuántas pueden entrar, sus sesiones, sus celulares con huella y,
// en la computadora, cuántas no entraron todavía; y el buscador con los filtros, que en el celular
// van en el diálogo de «Buscar usuario» (pedido de Carlos).
import type { PersonRow } from '@ferrebress/shared/contracts/users';
import { Icon, type IconName } from '../../../../ui/icon/Icon.tsx';
import { Search } from '../../../../ui/search/Search.tsx';
import { counts, type Filter, holdersOf } from '../../logic.ts';
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
// La caja para buscar, por nombre o correo, sin mayúsculas ni tildes.
export function SearchBox({ slash }: { slash?: boolean }) {
  const users = useUsersContext();
  return (
    <Search
      look="users-search"
      masked
      icon={<Icon name="search" />}
      aria-label={texts.searchLabel}
      placeholder={texts.search}
      value={users.search}
      onText={users.setSearch}
      data-slash={slash ? '' : undefined}
      data-clear=""
      data-autofocus={slash ? undefined : ''}
    >
      {slash && <kbd>/</kbd>}
    </Search>
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

// El filtro por rol (E54): todos, o los que tienen cada uno, con cuántas personas.
export function RoleChips() {
  const users = useUsersContext();
  const people = users.people as PersonRow[];
  return (
    <fieldset class="users-chips users-role-chips">
      <legend class="visually-hidden">{texts.rolesLabel}</legend>
      <button
        type="button"
        class="users-chip"
        aria-pressed={!users.role}
        onClick={() => users.setRole(undefined)}
      >
        {texts.allRoles}
      </button>
      {users.roles.map((role) => (
        <button
          key={role.id}
          type="button"
          class="users-chip"
          aria-pressed={users.role === role.id}
          onClick={() => users.setRole(role.id)}
        >
          {role.name} <span>{holdersOf(people, role.id)}</span>
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
      <RoleChips />
    </div>
  );
}
