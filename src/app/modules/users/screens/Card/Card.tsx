// La tarjeta de una persona (maquetas de 02): quién es, con el nombre y el correo para cambiar; si
// nunca entró o está dada de baja, qué quiere decir; si no, sus sesiones y sus celulares; y abajo,
// dar de baja, borrar el alta o dar de alta. En la computadora va al costado de la lista; en lo
// angosto la reemplaza, entrando desde la derecha, y el botón atrás vuelve a la lista.
import type { PersonRow } from '@ferrebress/shared/contracts/users';
import { Button } from '../../../../ui/button/Button.tsx';
import { Icon } from '../../../../ui/icon/Icon.tsx';
import { activate, change, remove } from '../../actions.ts';
import { dateOf, nowMs } from '../../logic.ts';
import { useUsersContext } from '../../state.ts';
import { cardTexts as t, texts } from '../../texts.ts';
import { Avatar, LastSignIn, Role } from '../Users/List.tsx';
import { Access, Note } from './Access.tsx';
import { Editable } from './Edit.tsx';
import './Card.css';

function Who({ person }: { person: PersonRow }) {
  const users = useUsersContext();
  return (
    <div class="users-who" data-private="">
      <Editable
        className="users-who-name"
        value={person.name ?? ''}
        shown={person.displayName}
        label={t.editName}
        placeholder={t.namePlaceholder(person.neverSignedIn)}
        save={(value) => change(users, person, 'name', value)}
      />
      {person.neverSignedIn ? (
        <Editable
          className="users-who-email"
          value={person.email}
          shown={person.email}
          label={t.editEmail}
          placeholder="correo@gmail.com"
          save={(value) => change(users, person, 'email', value)}
        />
      ) : (
        <div class="users-who-email">
          <span>{person.email}</span>
          <span class="users-bound" title={t.bound}>
            <Icon name="lock-keyhole" size="small" />
            <span class="visually-hidden">{t.bound}</span>
          </span>
        </div>
      )}
    </div>
  );
}

function Pills({ person }: { person: PersonRow }) {
  const when = person.deactivatedAt
    ? t.deactivatedAt(dateOf(person.deactivatedAt, nowMs()))
    : t.authorizedAt(dateOf(person.authorizedAt, nowMs()));
  return (
    <div class="users-pills">
      {person.self && <span class="users-pill you">{texts.you}</span>}
      <Role person={person} />
      {!person.active && <span class="users-pill off">{texts.deactivated}</span>}
      <span class="users-when">
        <LastSignIn person={person} /> · {when}
      </span>
    </div>
  );
}

function Middle({ person }: { person: PersonRow }) {
  if (!person.active)
    return (
      <p class="users-notice pine">
        <Icon name="info" />
        <span>{t.offHint}</span>
      </p>
    );
  if (person.neverSignedIn)
    return (
      <p class="users-notice urgent" data-private="">
        <Icon name="info" />
        <span>{t.neverHint(person.email)}</span>
      </p>
    );
  return <Access person={person} />;
}

function Foot({ person }: { person: PersonRow }) {
  const users = useUsersContext();
  if (person.self) return <Note>{t.selfNote}</Note>;
  if (!person.active)
    return (
      <Button
        icon="user-check"
        shortcut="l"
        doing={t.activate}
        onPress={() => activate(users, person)}
        disabled={!users.online}
      >
        {t.activate}
      </Button>
    );
  if (person.neverSignedIn)
    return (
      <>
        <Button
          look="danger"
          icon="trash-2"
          shortcut="b"
          doing={t.delete}
          onPress={() => remove(users, person)}
        >
          {t.delete}
        </Button>
        <span class="users-foot-hint">{t.deleteHint}</span>
      </>
    );
  return (
    <Button
      look="danger"
      icon="user-x"
      shortcut="b"
      doing={t.deactivate}
      onPress={() => users.open({ kind: 'deactivate', person })}
    >
      {t.deactivate}
    </Button>
  );
}

export function Card() {
  const users = useUsersContext();
  const person = users.person;
  if (!person)
    return (
      <aside class="users-card empty">
        <Icon name="users" size="large" />
        <b>{t.choose}</b>
        <span>{t.chooseHint}</span>
      </aside>
    );
  return (
    <aside class="users-card" aria-label={person.displayName} key={person.id}>
      <button type="button" class="users-back phone-only" onClick={() => users.select(undefined)}>
        <Icon name="chevron-left" />
        {t.back}
      </button>
      <div class="users-card-head">
        <Avatar person={person} large />
        <Who person={person} />
      </div>
      <Pills person={person} />
      <Middle person={person} />
      <div class="users-card-foot">
        <Foot person={person} />
      </div>
    </aside>
  );
}
