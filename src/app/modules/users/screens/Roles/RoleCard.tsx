// La tarjeta de un rol (R7.3; maqueta users-roles, variante 1): su nombre y su descripción, que se
// cambian con el lápiz; qué deja hacer, que se prende y se apaga al tocarlo; quiénes lo tienen, con
// «Sacárselo» y «Darle este rol»; duplicarlo y borrarlo si nadie lo tiene. El Administrador no se
// borra. Cada cambio se guarda solo.
import type { RoleRow } from '@ferrebress/shared/contracts/roles';
import type { PersonRow } from '@ferrebress/shared/contracts/users';
import { Button } from '../../../../ui/button/Button.tsx';
import { Icon } from '../../../../ui/icon/Icon.tsx';
import { changeRole, removeRole, saveRoles } from '../../role-actions.ts';
import { useUsersContext } from '../../state.ts';
import { refusalTexts, roleTexts as t } from '../../texts.ts';
import { Editable } from '../Card/Edit.tsx';
import { Permissions, toggled } from './Permissions.tsx';

// Cambiar el nombre o la descripción: lo que no se puede usar se dice junto al campo.
function useSave(role: RoleRow) {
  const users = useUsersContext();
  return async (field: 'name' | 'description', value: string) => {
    const text = value.trim();
    if (field === 'name' && !text) return 'role-no-name';
    await changeRole(users, role, { [field]: field === 'name' ? text : text || null });
    return undefined;
  };
}

function Head({ role }: { role: RoleRow }) {
  const save = useSave(role);
  return (
    <div class="role-card-head">
      <span class="role-card-icon">
        <Icon name={role.system ? 'shield-check' : 'shield'} size="large" />
      </span>
      <div>
        <Editable
          className="role-card-name"
          value={role.name}
          shown={role.name}
          label={t.editName}
          placeholder={t.namePlaceholder}
          save={(value) => save('name', value)}
        />
        <small>{t.summary(role.permissions.length, role.holders.length)}</small>
        <Editable
          className="role-card-description"
          value={role.description ?? ''}
          shown={role.description ?? t.noDescription}
          label={t.editDescription}
          placeholder={t.descriptionPlaceholder}
          save={(value) => save('description', value)}
        />
      </div>
    </div>
  );
}

// Quiénes lo tienen (personas activas, R4.3), con «Sacárselo», y a quién dárselo.
function Holders({ role }: { role: RoleRow }) {
  const users = useUsersContext();
  // La pestaña se abre con la lista ya traída.
  const people = users.people as PersonRow[];
  const holders = people.filter((one) => role.holders.includes(one.id));
  const others = people.filter((one) => one.active && !one.roleIds.includes(role.id));
  const take = (person: PersonRow) =>
    saveRoles(
      users,
      person,
      person.roleIds.filter((id) => id !== role.id),
    );
  return (
    <section class="role-holders" aria-label={t.whoHasIt}>
      <h4>{t.whoHasIt}</h4>
      {holders.length === 0 && <p class="role-none">{t.nobody}</p>}
      {holders.map((person) => (
        <div key={person.id} class="role-holder" data-private="">
          <span>{person.displayName}</span>
          {person.roleIds.length === 1 ? (
            <small>{t.onlyRole}</small>
          ) : (
            <Button size="small" doing={t.take} onPress={() => take(person)}>
              {t.take}
            </Button>
          )}
        </div>
      ))}
      {others.length > 0 && (
        <label class="role-give">
          <span>{t.giveTo}</span>
          <select
            value=""
            onChange={(event) => {
              const person = others.find((one) => one.id === event.currentTarget.value);
              if (person) void saveRoles(users, person, [...person.roleIds, role.id]);
            }}
          >
            <option value="">{t.give}</option>
            {others.map((person) => (
              <option key={person.id} value={person.id}>
                {person.displayName}
              </option>
            ))}
          </select>
        </label>
      )}
    </section>
  );
}

export function RoleCard({ role }: { role: RoleRow }) {
  const users = useUsersContext();
  const duplicate = () => {
    users.setDraft({
      name: t.copyOf(role.name),
      description: role.description,
      permissions: [...role.permissions],
    });
    users.setRoleCard('new');
  };
  return (
    <aside class="role-card" aria-label={role.name} key={role.id}>
      <Head role={role} />
      <h4 class="role-what">{t.whatItDoes}</h4>
      <Permissions
        chosen={role.permissions}
        disabled={!users.online}
        onToggle={(id) => changeRole(users, role, { permissions: toggled(role.permissions, id) })}
      />
      <Holders role={role} />
      <div class="role-card-foot">
        <Button icon="copy" doing={t.duplicate} onPress={duplicate}>
          {t.duplicate}
        </Button>
        {!role.system && (
          <Button
            look="danger"
            icon="trash-2"
            doing={t.remove}
            onPress={() => removeRole(users, role)}
          >
            {t.remove}
          </Button>
        )}
      </div>
      {role.system && <p class="role-note">{refusalTexts['system-role']}</p>}
    </aside>
  );
}
