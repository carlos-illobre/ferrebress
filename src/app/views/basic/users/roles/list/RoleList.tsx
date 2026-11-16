// La lista de roles (02 · R7.12; maqueta users-roles/final): el buscador, «Nuevo rol» y una tarjeta
// por rol. Se filtra mientras se escribe, con lo que ya está cargado; sin coincidencias, lo dice y
// ofrece crear un rol con lo escrito como nombre.

import { rolesTexts as t, useRoleList } from '../../../../../modules/users/model.ts';
import { privateProps } from '../../../../../platform/view/private.ts';
import { useShortcutHints } from '../../../../../platform/view/shortcut-hints.ts';
import { Button } from '../../../ui/button/Button.tsx';
import { Icon } from '../../../ui/icon/Icon.tsx';
import { Search } from '../../../ui/search/Search.tsx';
import { RoleRow } from './RoleRow.tsx';

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
      // En la computadora el cursor arranca acá (00 · R2.2), y Enter abre el primero de la lista o
      // crea uno con lo escrito (00 · R2.6): lo hace la navegación del teclado.
      data-autofocus=""
    />
  );
}

export function RoleList() {
  const list = useRoleList();
  const keys = useShortcutHints('users-roles');
  const { query, setQuery, people, shown, wanted, arriving, openNew } = list;
  return (
    <section class="roles-list" aria-label={t.list}>
      <div class="roles-bar">
        <SearchBox query={query} setQuery={setQuery} />
        <Button
          look="action"
          icon="plus"
          keyHint={keys.newRole}
          doing={t.newRole}
          onPress={() => openNew()}
          disabled={!list.online}
        >
          {t.newRole}
        </Button>
      </div>
      {shown.length === 0 ? (
        <div class="roles-nothing">
          <Icon name="search" size="large" />
          <b {...privateProps()}>{t.nothing(wanted)}</b>
          <p>{t.nothingHint}</p>
          <Button
            icon="plus"
            doing={t.createNamed(wanted)}
            onPress={() => openNew({ name: wanted })}
            disabled={!list.online}
            enterDoes
          >
            <span {...privateProps()}>{t.createNamed(wanted)}</span>
          </Button>
        </div>
      ) : (
        <ul class="roles-rows">
          {shown.map((role, index) => (
            <li key={role.id}>
              <RoleRow
                role={role}
                people={people}
                arriving={role.id === arriving}
                first={index === 0}
                open={() => list.openRole(role.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
