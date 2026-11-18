// Los roles de una persona en su tarjeta (R7.5; maqueta users-person-roles, variante 1 en la
// computadora y la 2 en el celular): tildar los que tiene y, debajo, lo que va a poder, de qué rol le
// viene cada cosa. Se guarda con «Guardar», al menos uno. Solo con «Administrar roles».

import type { PersonRow } from '@ferrebress/shared/contracts/users';
import { personRoleTexts as t, usePersonRoles } from '../../../../modules/users/model.ts';
import { useNarrow } from '../../../../platform/view/narrow.ts';
import { privateProps } from '../../../../platform/view/private.ts';
import { Button } from '../../ui/button/Button.tsx';
import { Icon } from '../../ui/icon/Icon.tsx';
import { Problem } from './Problem.tsx';
import { RolePicker } from './RolePicker.tsx';
import './PersonRoles.css';

type Roles = ReturnType<typeof usePersonRoles>;

// Lo que va a poder con esos roles, y de cuáles le viene cada permiso.
function Abilities({ abilities }: { abilities: Roles['abilities'] }) {
  return (
    <ul class="person-abilities">
      {abilities.map((one) => (
        <li key={one.id} class={one.on ? 'on' : undefined}>
          <Icon name={one.on ? 'check' : 'ban'} size="small" />
          <span>{one.name}</span>
          <small class="person-from">{one.from}</small>
        </li>
      ))}
    </ul>
  );
}

export function PersonRoles({ person }: { person: PersonRow }) {
  return useNarrow() ? <PhoneRoles person={person} /> : <DesktopRoles person={person} />;
}

// La computadora (variante 1): la lista para tildar y, debajo, lo que va a poder.
function DesktopRoles({ person }: { person: PersonRow }) {
  const roles = usePersonRoles(person);
  return (
    <section id="users-roles" class="person-roles" aria-label={roles.title}>
      <h3 {...privateProps()}>
        {roles.title} <small>{t.hint}</small>
      </h3>
      <RolePicker picks={roles.picks} label={roles.title} toggle={roles.toggle} />
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
      <Abilities abilities={roles.abilities} />
    </section>
  );
}

// El celular (variante 2, con interruptores de roles): «¿Qué puede hacer…?», «Igual que alguien»,
// lo que va a poder y el pie fijo con lo que cambia y «Guardar».
function PhoneRoles({ person }: { person: PersonRow }) {
  const roles = usePersonRoles(person);
  return (
    <section id="users-roles" class="person-roles phone" aria-label={roles.question}>
      <h3 {...privateProps()}>{roles.question}</h3>
      <label class="person-like" {...privateProps()}>
        <span>{t.like}</span>
        <select value="" onChange={(event) => roles.like(event.currentTarget.value)}>
          <option value="">{t.likeWho}</option>
          {roles.others.map((one) => (
            <option key={one.id} value={one.id}>
              {one.name}
            </option>
          ))}
        </select>
      </label>
      <RoleSwitches roles={roles} />
      <h4>{t.willDo}</h4>
      <Abilities abilities={roles.abilities} />
      <Problem text={roles.error} />
      {roles.changed && <PhoneFoot roles={roles} />}
    </section>
  );
}

// Un interruptor por rol, con su descripción.
function RoleSwitches({ roles }: { roles: Roles }) {
  return (
    <fieldset class="person-switches">
      <legend class="visually-hidden">{roles.question}</legend>
      {roles.picks.map((role) => (
        <div key={role.id} class={role.on ? 'person-switch on' : 'person-switch'}>
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
            aria-checked={role.on}
            aria-label={role.name}
            onClick={() => roles.toggle(role.id)}
          />
        </div>
      ))}
    </fieldset>
  );
}

// Lo que cambia («Eso es»: lo que gana y lo que pierde), que dar pide confirmar, y «Guardar».
function PhoneFoot({ roles }: { roles: Roles }) {
  return (
    <div class="person-foot">
      <p class="person-diff">
        {t.thatIs}
        {roles.diff.added.map((one) => (
          <span key={one.id} class="users-pill pine">
            <Icon name="shield-check" size="small" />
            {one.name}
          </span>
        ))}
        {roles.diff.removed.map((one) => (
          <span key={one.id} class="users-pill gone">
            {one.name}
          </span>
        ))}
      </p>
      {roles.diff.confirm && (
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
