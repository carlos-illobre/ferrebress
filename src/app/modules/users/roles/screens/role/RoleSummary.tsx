// El resumen del rol en el celular, debajo del título (pedido de Carlos): cuántos permisos da y
// cuántas personas lo van a tener, con sus iniciales. Cada pastilla lleva a su paso.
import type { PersonRow } from '@ferrebress/shared/contracts/users';
import { Icon } from '../../../../../ui/icon/Icon.tsx';
import { useUsersContext } from '../../../state.ts';
import { type Draft, holdersOf } from '../../draft.ts';
import { rolesTexts as t } from '../../texts.ts';
import { Faces } from '../list/RoleRow.tsx';

const goTo = (id: string) => () => document.getElementById(id)?.scrollIntoView({ block: 'start' });

export function RoleSummary({ draft }: { draft: Draft }) {
  const people = useUsersContext().people as PersonRow[];
  const holders = holdersOf(draft).map((id) => people.find((one) => one.id === id) as PersonRow);
  const count = draft.permissions.length;
  return (
    <nav class="role-summary phone-only" aria-label={t.summary}>
      <button type="button" class="roles-stat" onClick={goTo('role-permissions')}>
        <Icon name="key-round" size="small" />
        <b>{count}</b>
        <span>{t.permissionsWord(count)}</span>
      </button>
      <button type="button" class="roles-stat" onClick={goTo('role-who')} data-private="">
        {holders.length > 0 ? (
          <Faces people={holders} max={2} />
        ) : (
          <Icon name="users" size="small" />
        )}
        <b>{holders.length}</b>
        <span>{t.peopleWord(holders.length)}</span>
      </button>
    </nav>
  );
}
