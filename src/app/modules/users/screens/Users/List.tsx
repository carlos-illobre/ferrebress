// La lista (R3.1): en grupos, «Pueden entrar» y «Dadas de baja», cada persona con su nombre, su
// correo, «Administrador», cuándo entró y sus cantidades. Tocarla abre su tarjeta. Una dada de baja
// se ve con el borde punteado y sin fondo, sin leer la letra chica.
import type { PersonRow } from '@ferrebress/shared/contracts/users';
import { Icon } from '../../../../ui/icon/Icon.tsx';
import { Say } from '../../../../ui/say/Say.tsx';
import { initialsOf, nowMs, sinceOf } from '../../logic.ts';
import { useUsersContext } from '../../state.ts';
import { texts } from '../../texts.ts';
import './List.css';

// Dos tonos que se alternan por persona, siempre el mismo para cada una (maqueta).
const toneOf = (id: string) => [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 2;

export function Avatar({ person, large }: { person: PersonRow; large?: boolean }) {
  const classes = [
    'users-avatar',
    `tone-${toneOf(person.id)}`,
    large && 'large',
    !person.active && 'off',
  ];
  return (
    <span class={classes.filter(Boolean).join(' ')} aria-hidden="true">
      {person.active ? initialsOf(person) : <Icon name="ban" {...(!large && { size: 'small' })} />}
    </span>
  );
}

export function Role({ person }: { person: PersonRow }) {
  return (
    <span class={person.active ? 'users-pill pine' : 'users-pill pine off'}>
      <Icon name="shield-check" size="small" />
      {texts.role}
    </span>
  );
}

export function LastSignIn({ person }: { person: PersonRow }) {
  if (person.lastSignInAt === null)
    return (
      <span class="users-last never">
        <Icon name="hourglass" size="small" />
        {texts.neverSignedIn}
      </span>
    );
  return <span class="users-last">{texts.signedIn(sinceOf(person.lastSignInAt, nowMs()))}</span>;
}

function Counts({ person }: { person: PersonRow }) {
  return (
    <span class="users-counts">
      {person.sessions > 0 && (
        <span title={texts.sessionsCount}>
          <Icon name="monitor" size="small" />
          {person.sessions}
        </span>
      )}
      {person.phones > 0 && (
        <span title={texts.phonesCount}>
          <Icon name="fingerprint" size="small" />
          {person.phones}
        </span>
      )}
    </span>
  );
}

function Row({ person }: { person: PersonRow }) {
  const users = useUsersContext();
  const noName = person.displayName === person.email;
  const classes = ['users-row', !person.active && 'off', users.selected === person.id && 'chosen'];
  return (
    <button
      type="button"
      class={classes.filter(Boolean).join(' ')}
      data-mark=""
      aria-current={users.selected === person.id ? 'true' : undefined}
      onClick={() => users.select(person.id)}
    >
      <Avatar person={person} />
      <span class="users-row-body" data-private="">
        <span class="users-name">
          <em>{person.displayName}</em>
          {person.self && <span class="users-pill you">{texts.you}</span>}
          {!person.active && <span class="users-pill off">{texts.deactivated}</span>}
        </span>
        <span class="users-email">{noName ? <Say words={texts.noName} /> : person.email}</span>
      </span>
      <span class="users-row-meta">
        <Role person={person} />
        <span class="users-dot phone-only">·</span>
        <LastSignIn person={person} />
      </span>
      <Counts person={person} />
      <Icon name="chevron-right" />
    </button>
  );
}

function Empty() {
  const users = useUsersContext();
  return (
    <div class="users-empty">
      <Icon name="search" size="large" />
      <b>{users.search.trim() ? texts.nobody(users.search.trim()) : texts.nobodyHere}</b>
      {users.search.trim() && <span>{texts.nobodyHint}</span>}
    </div>
  );
}

export function List() {
  const users = useUsersContext();
  const groups = [
    { title: texts.canEnter, people: users.shown.filter((person) => person.active) },
    { title: texts.deactivatedGroup, people: users.shown.filter((person) => !person.active) },
  ].filter((group) => group.people.length > 0);
  if (groups.length === 0) return <Empty />;
  return (
    <div class="users-list">
      {groups.map((group) => (
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
