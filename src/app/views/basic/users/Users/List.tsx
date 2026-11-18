// La lista (R3.1): en grupos, «Pueden entrar» y «Dadas de baja», cada persona con su nombre, su
// correo, sus roles, cuándo entró y sus cantidades. Tocarla abre su tarjeta. Una dada de baja
// se ve con el borde punteado y sin fondo, sin leer la letra chica.
import { type PersonLines, texts, useUsersContext } from '../../../../modules/users/model.ts';
import { privateProps } from '../../../../platform/view/private.ts';
import { Icon } from '../../ui/icon/Icon.tsx';
import { Say } from '../../ui/say/Say.tsx';
import './List.css';

export function Avatar({ person, large }: { person: PersonLines; large?: boolean }) {
  const classes = [
    'users-avatar',
    `tone-${person.tone}`,
    large && 'large',
    !person.active && 'off',
  ];
  return (
    <span class={classes.filter(Boolean).join(' ')} aria-hidden="true">
      {person.initials ?? <Icon name="ban" {...(!large && { size: 'small' })} />}
    </span>
  );
}

// Sus roles, una pastilla por cada uno (R3.1).
export function RolePills({ person }: { person: PersonLines }) {
  return (
    <span class="users-roles">
      {person.roles.map((role) => (
        <span key={role.id} class={person.active ? 'users-pill pine' : 'users-pill pine off'}>
          <Icon name="shield-check" size="small" />
          {role.name}
        </span>
      ))}
    </span>
  );
}

export function LastSignIn({ person }: { person: PersonLines }) {
  if (person.last.never)
    return (
      <span class="users-last never">
        <Icon name="hourglass" size="small" />
        {person.last.text}
      </span>
    );
  return <span class="users-last">{person.last.text}</span>;
}

function Counts({ person }: { person: PersonLines }) {
  return (
    <span class="users-counts">
      {person.sessions && (
        <span title={texts.sessionsCount}>
          <Icon name="monitor" size="small" />
          {person.sessions}
        </span>
      )}
      {person.phones && (
        <span title={texts.phonesCount}>
          <Icon name="fingerprint" size="small" />
          {person.phones}
        </span>
      )}
    </span>
  );
}

function Row({ person }: { person: PersonLines }) {
  const users = useUsersContext();
  const chosen = users.selected === person.id;
  const classes = ['surface', 'users-row', !person.active && 'off', chosen && 'chosen'];
  return (
    <button
      type="button"
      class={classes.filter(Boolean).join(' ')}
      data-mark=""
      aria-current={chosen ? 'true' : undefined}
      onClick={() => users.select(person.id)}
    >
      <Avatar person={person} />
      <span class="users-row-body" {...privateProps()}>
        <span class="users-name">
          <em>{person.name}</em>
          {person.self && <span class="users-pill you">{texts.you}</span>}
          {!person.active && <span class="users-pill off">{texts.deactivated}</span>}
        </span>
        <span class="users-email">
          {person.noName ? <Say words={person.noName} /> : person.email}
        </span>
      </span>
      <span class="users-row-meta">
        <RolePills person={person} />
        <span class="users-dot phone-only">·</span>
        <LastSignIn person={person} />
      </span>
      <Counts person={person} />
      <Icon name="chevron-right" />
    </button>
  );
}

function Empty({ empty }: { empty: { title: string; hint: string | undefined } }) {
  return (
    <div class="users-empty">
      <Icon name="search" size="large" />
      <b>{empty.title}</b>
      {empty.hint && <span>{empty.hint}</span>}
    </div>
  );
}

export function List() {
  const users = useUsersContext();
  if (users.empty) return <Empty empty={users.empty} />;
  return (
    <div class="users-list">
      {users.groups.map((group) => (
        <section key={group.title} aria-label={group.title}>
          <h2 class="users-group">
            {group.title} <span>{group.people.length}</span>
          </h2>
          {group.people.map((person) => (
            <Row key={person.id} person={person} />
          ))}
        </section>
      ))}
    </div>
  );
}
