// Los roles de una persona en su tarjeta (R7.5; maqueta users-person-roles, variante 1 en la
// computadora y la 2 en el celular): tildar los que tiene y, debajo, lo que va a poder, de qué rol le
// viene cada cosa. Se guarda con «Guardar», al menos uno. Solo con «Administrar roles».
import { permissions } from '@ferrebress/shared/contracts/permissions';
import type { PersonRow } from '@ferrebress/shared/contracts/users';
import { useState } from 'preact/hooks';
import { Button } from '../../../../ui/button/Button.tsx';
import { Icon } from '../../../../ui/icon/Icon.tsx';
import { saveRoles } from '../../role-actions.ts';
import { personRoleTexts as t } from '../../role-texts.ts';
import { useUsersContext } from '../../state.ts';
import { refusalTexts } from '../../texts.ts';
import { RolePicker } from './RolePicker.tsx';
import './PersonRoles.css';

const firstName = (person: PersonRow) => person.displayName.split(/[\s@]/)[0] as string;
const same = (a: string[], b: string[]) => a.length === b.length && a.every((id) => b.includes(id));

// Lo que va a poder con esos roles, y de cuáles le viene cada permiso.
function Abilities({ chosen }: { chosen: string[] }) {
  const { roleRows = [] } = useUsersContext();
  const giving = roleRows.filter((role) => chosen.includes(role.id));
  return (
    <ul class="person-abilities">
      {permissions.map((one) => {
        const from = giving.filter((role) => (role.permissions as string[]).includes(one.id));
        return (
          <li key={one.id} class={from.length > 0 ? 'on' : undefined}>
            <Icon name={from.length > 0 ? 'check' : 'ban'} size="small" />
            <span>{one.name}</span>
            <small class="person-from">{from.map((role) => role.name).join(' · ')}</small>
          </li>
        );
      })}
    </ul>
  );
}

export function PersonRoles({ person }: { person: PersonRow }) {
  const users = useUsersContext();
  const [chosen, setChosen] = useState(person.roleIds);
  const [error, setError] = useState<string>();
  const save = async () => {
    if (chosen.length === 0) return setError(refusalTexts['no-roles']);
    return saveRoles(users, person, chosen);
  };
  return (
    <section id="users-roles" class="person-roles" aria-label={t.title(firstName(person))}>
      <h3>
        {t.title(firstName(person))} <small>{t.hint}</small>
      </h3>
      <RolePicker
        roles={users.roles}
        chosen={chosen}
        label={t.title(firstName(person))}
        onChange={(next) => {
          setChosen(next);
          setError(undefined);
        }}
      />
      {error && (
        <p class="users-field-error" role="alert">
          <Icon name="triangle-alert" size="small" />
          {error}
        </p>
      )}
      {!same(chosen, person.roleIds) && (
        <div class="person-roles-save">
          <Button look="plain" doing={t.undo} onPress={() => setChosen(person.roleIds)}>
            {t.undo}
          </Button>
          <Button look="action" icon="shield-check" doing={t.save} onPress={save} primary>
            {t.save}
          </Button>
        </div>
      )}
      <h4>{t.willDo}</h4>
      <Abilities chosen={chosen} />
    </section>
  );
}
