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
import { Problem } from './Problem.tsx';
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

// Lo elegido, el aviso sin roles y guardar: lo comparten la computadora y el celular.
function useChosen(person: PersonRow) {
  const users = useUsersContext();
  const [chosen, setChosen] = useState(person.roleIds);
  const [error, setError] = useState<string>();
  return {
    chosen,
    error,
    changed: !same(chosen, person.roleIds),
    choose: (next: string[]) => {
      setChosen(next);
      setError(undefined);
    },
    undo: () => setChosen(person.roleIds),
    save: async () => {
      if (chosen.length === 0) return setError(refusalTexts['no-roles']);
      return saveRoles(users, person, chosen);
    },
  };
}

const narrow = () => matchMedia('(max-width: 899px)').matches;

export function PersonRoles({ person }: { person: PersonRow }) {
  return narrow() ? <PhoneRoles person={person} /> : <DesktopRoles person={person} />;
}

// La computadora (variante 1): la lista para tildar y, debajo, lo que va a poder.
function DesktopRoles({ person }: { person: PersonRow }) {
  const users = useUsersContext();
  const roles = useChosen(person);
  const title = t.title(firstName(person));
  return (
    <section id="users-roles" class="person-roles" aria-label={title}>
      <h3 data-private="">
        {title} <small>{t.hint}</small>
      </h3>
      <RolePicker roles={users.roles} chosen={roles.chosen} label={title} onChange={roles.choose} />
      <Problem text={roles.error} />
      {roles.changed && (
        <div class="person-roles-save">
          <Button look="plain" doing={t.undo} onPress={roles.undo}>
            {t.undo}
          </Button>
          <Button look="action" icon="shield-check" doing={t.save} onPress={roles.save} primary>
            {t.save}
          </Button>
        </div>
      )}
      <h4>{t.willDo}</h4>
      <Abilities chosen={roles.chosen} />
    </section>
  );
}

// El celular (variante 2, con interruptores de roles): «¿Qué puede hacer…?», «Igual que alguien»,
// lo que va a poder y el pie fijo con lo que cambia y «Guardar».
function PhoneRoles({ person }: { person: PersonRow }) {
  const users = useUsersContext();
  const roles = useChosen(person);
  // La tarjeta se abre con la lista ya traída.
  const others = (users.people as PersonRow[]).filter((one) => one.id !== person.id && one.active);
  const title = t.question(firstName(person));
  return (
    <section id="users-roles" class="person-roles phone" aria-label={title}>
      <h3 data-private="">{title}</h3>
      <label class="person-like" data-private="">
        <span>{t.like}</span>
        <select
          value=""
          onChange={(event) => {
            const like = others.find((one) => one.id === event.currentTarget.value);
            if (like) roles.choose(like.roleIds);
          }}
        >
          <option value="">{t.likeWho}</option>
          {others.map((one) => (
            <option key={one.id} value={one.id}>
              {one.displayName}
            </option>
          ))}
        </select>
      </label>
      <RoleSwitches chosen={roles.chosen} onChange={roles.choose} label={title} />
      <h4>{t.willDo}</h4>
      <Abilities chosen={roles.chosen} />
      <Problem text={roles.error} />
      {roles.changed && <PhoneFoot person={person} roles={roles} />}
    </section>
  );
}

// Un interruptor por rol, con su descripción.
function RoleSwitches(props: {
  chosen: string[];
  onChange: (next: string[]) => void;
  label: string;
}) {
  const { roles } = useUsersContext();
  const toggle = (id: string) =>
    props.onChange(
      props.chosen.includes(id) ? props.chosen.filter((one) => one !== id) : [...props.chosen, id],
    );
  return (
    <fieldset class="person-switches">
      <legend class="visually-hidden">{props.label}</legend>
      {roles.map((role) => (
        <div
          key={role.id}
          class={props.chosen.includes(role.id) ? 'person-switch on' : 'person-switch'}
        >
          <span class="person-switch-icon">
            <Icon name="shield-check" />
          </span>
          <span>
            <b class="person-switch-name">{role.name}</b>
            {role.description && <small class="person-switch-detail">{role.description}</small>}
          </span>
          <button
            type="button"
            role="switch"
            class="role-switch"
            aria-checked={props.chosen.includes(role.id)}
            aria-label={role.name}
            onClick={() => toggle(role.id)}
          />
        </div>
      ))}
    </fieldset>
  );
}

// Lo que cambia («Eso es»: lo que gana y lo que pierde), que dar pide confirmar, y «Guardar».
function PhoneFoot({ person, roles }: { person: PersonRow; roles: ReturnType<typeof useChosen> }) {
  const users = useUsersContext();
  const name = (id: string) => users.roles.find((role) => role.id === id)?.name;
  const added = roles.chosen.filter((id) => !person.roleIds.includes(id));
  const removed = person.roleIds.filter((id) => !roles.chosen.includes(id));
  return (
    <div class="person-foot">
      <p class="person-diff">
        {t.thatIs}
        {added.map((id) => (
          <span key={id} class="users-pill pine">
            <Icon name="shield-check" size="small" />
            {name(id)}
          </span>
        ))}
        {removed.map((id) => (
          <span key={id} class="users-pill gone">
            {name(id)}
          </span>
        ))}
      </p>
      {added.length > 0 && (
        <p class="person-confirm">
          <Icon name="lock" size="small" />
          {t.confirmHint}
        </p>
      )}
      <Button look="dark" doing={t.saveShort} onPress={roles.save} primary>
        {t.saveShort}
      </Button>
    </div>
  );
}
