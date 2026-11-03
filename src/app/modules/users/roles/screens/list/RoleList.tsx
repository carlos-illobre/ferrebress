// La lista de roles (02 · R7.12; maqueta users-roles/final): el buscador, «Nuevo rol» y una tarjeta
// por rol. Se filtra mientras se escribe, con lo que ya está cargado; sin coincidencias, lo dice y
// ofrece crear un rol con lo escrito como nombre.
import type { RoleRow as Row } from '@ferrebress/shared/contracts/roles';
import type { PersonRow } from '@ferrebress/shared/contracts/users';
import { useMemo, useState } from 'preact/hooks';
import { isPhone } from '../../../../../platform/device/device.ts';
import { navigate, route } from '../../../../../platform/router.ts';
import { useStore } from '../../../../../platform/store.ts';
import { Button } from '../../../../../ui/button/Button.tsx';
import { Icon } from '../../../../../ui/icon/Icon.tsx';
import { Search } from '../../../../../ui/search/Search.tsx';
import { useUsersContext } from '../../../state.ts';
import { type NewState, newPath } from '../../paths.ts';
import { filterRoles, searchIndex } from '../../search.ts';
import { rolesTexts as t } from '../../texts.ts';
import { RoleRow } from './RoleRow.tsx';

const openNew = (state: NewState = {}) => navigate(newPath, { state });

// En la computadora el cursor arranca en el buscador; en el celular no (00 · R2.12).
const focusOnDesktop = (input: HTMLInputElement | null) => {
  if (input && !isPhone() && document.activeElement === document.body) input.focus();
};

// Enter sin nada marcado abre el primero, o crea uno con lo escrito (00 · R2.6).
const openFirst = () =>
  (
    document.querySelector('.roles-rows [data-mark], .roles-nothing [data-mark]') as HTMLElement
  ).click();

function SearchBox({ query, setQuery }: { query: string; setQuery: (query: string) => void }) {
  return (
    <Search
      look="roles-search"
      masked
      icon={<Icon name="search" size="small" />}
      aria-label={t.search}
      placeholder={{ long: t.search, short: t.searchShort }}
      value={query}
      onText={setQuery}
      data-slash=""
      data-clear=""
      ref={focusOnDesktop}
      onKeyDown={(event) => event.key === 'Enter' && openFirst()}
    />
  );
}

export function RoleList() {
  const users = useUsersContext();
  const [query, setQuery] = useState('');
  // La lista se muestra con las personas y los roles ya traídos (Roles.tsx).
  const people = users.people as PersonRow[];
  const roles = users.roleRows as Row[];
  const index = useMemo(() => searchIndex(roles, people), [roles, people]);
  const shown = filterRoles(index, query);
  const arriving = (useStore(route).state as { arriving?: string } | null)?.arriving;
  const wanted = query.trim();
  return (
    <section class="roles-list" aria-label={t.list}>
      <div class="roles-bar">
        <SearchBox query={query} setQuery={setQuery} />
        <Button
          look="action"
          icon="plus"
          shortcut="o"
          doing={t.newRole}
          onPress={() => openNew()}
          disabled={!users.online}
        >
          {t.newRole}
        </Button>
      </div>
      {shown.length === 0 ? (
        <div class="roles-nothing">
          <Icon name="search" size="large" />
          <b data-private="">{t.nothing(wanted)}</b>
          <p>{t.nothingHint}</p>
          <Button
            icon="plus"
            doing={t.createNamed(wanted)}
            onPress={() => openNew({ name: wanted })}
            disabled={!users.online}
          >
            <span data-private="">{t.createNamed(wanted)}</span>
          </Button>
        </div>
      ) : (
        <ul class="roles-rows">
          {shown.map((role) => (
            <li key={role.id}>
              <RoleRow role={role} people={people} arriving={role.id === arriving} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
