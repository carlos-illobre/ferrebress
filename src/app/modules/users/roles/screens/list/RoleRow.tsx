// Una tarjeta de la lista de roles (02 · R7.12): su ícono, nombre, descripción, cuántos permisos da,
// cuántas personas lo tienen y sus iniciales. En el celular, los dos números en grande, cada uno en
// su recuadro, y como mucho dos círculos (pedido de Carlos).
import type { RoleRow as Row } from '@ferrebress/shared/contracts/roles';
import type { PersonRow } from '@ferrebress/shared/contracts/users';
import { navigate } from '../../../../../platform/router.ts';
import { Icon } from '../../../../../ui/icon/Icon.tsx';
import { initialsOf } from '../../../logic.ts';
import { activeHolders, rolePath } from '../../paths.ts';
import { rolesTexts as t } from '../../texts.ts';
import './RoleRow.css';

const tones = 5;

// Las iniciales de quienes lo tienen: con más de las que entran, las primeras y «+N».
export function Faces({ people, max }: { people: PersonRow[]; max: number }) {
  const room = people.length > max ? max - 1 : max;
  return (
    <span class="roles-faces" aria-hidden="true">
      {people.slice(0, room).map((one, index) => (
        <span key={one.id} class={`roles-face tone-${index % tones}`}>
          {initialsOf(one)}
        </span>
      ))}
      {people.length > room && <span class="roles-face more">+{people.length - room}</span>}
    </span>
  );
}

export function RoleRow({
  role,
  people,
  arriving,
}: {
  role: Row;
  people: PersonRow[];
  arriving: boolean;
}) {
  const holders = activeHolders(people, role.id);
  const count = role.permissions.length;
  return (
    <button
      type="button"
      class={arriving ? 'surface roles-row arriving' : 'surface roles-row'}
      aria-label={t.open(role.name)}
      data-mark=""
      onClick={() => navigate(rolePath(role.id))}
    >
      <span class="roles-icon">
        <Icon name={role.system ? 'shield-check' : 'users'} />
      </span>
      <span class="roles-main">
        <b>{role.name}</b>
        {role.description && <span>{role.description}</span>}
      </span>
      <span class="roles-stats">
        <span class="roles-stat">
          <Icon name="key-round" size="small" />
          <b>{count}</b>
          <span>{t.permissionsWord(count)}</span>
        </span>
        <span class={holders.length ? 'roles-stat' : 'roles-stat empty'} data-private="">
          {holders.length > 0 ? (
            <>
              <span class="desktop-only">
                <Faces people={holders} max={4} />
                <span>{t.holders(holders.length)}</span>
              </span>
              <span class="phone-only">
                <Faces people={holders} max={2} />
                <b>{holders.length}</b>
                <span>{t.peopleWord(holders.length)}</span>
              </span>
            </>
          ) : (
            <>
              <Icon name="users" size="small" />
              <span>{t.nobody}</span>
            </>
          )}
        </span>
      </span>
      <Icon name="chevron-right" />
    </button>
  );
}
