// La tarjeta de una persona (maquetas de 02): quién es, con el nombre y el correo para cambiar; si
// nunca entró o está dada de baja, qué quiere decir; si no, sus sesiones y sus celulares; y abajo,
// dar de baja, borrar el alta o dar de alta. En la computadora va al costado de la lista; en lo
// angosto la reemplaza, entrando desde la derecha, y el botón atrás vuelve a la lista.
import type { PersonRow } from '@ferrebress/shared/contracts/users';
import {
  activate,
  change,
  type PersonLines,
  remove,
  cardTexts as t,
  texts,
  type Users,
  useUsersContext,
} from '../../../../modules/users/model.ts';

type CardLines = NonNullable<Users['cardLines']>;

import { useShortcutHints } from '../../../../platform/view/shortcut-hints.ts';
import { Button } from '../../ui/button/Button.tsx';
import { Icon } from '../../ui/icon/Icon.tsx';
import { PersonRoles } from '../PersonRoles/PersonRoles.tsx';
import { Avatar, LastSignIn, RolePills } from '../Users/List.tsx';
import { Access, Note } from './Access.tsx';
import { Editable } from './Edit.tsx';
import { Rows, Tiles } from './Phone.tsx';
import './Card.css';
import { privateProps } from '../../../../platform/view/private.ts';

// El nombre se cambia con «Administrar personas»; el correo, además, si nunca entró y no tiene más
// permisos que quien mira (R7.11).
function Who({ person, card }: { person: PersonRow; card: CardLines }) {
  const users = useUsersContext();
  return (
    <div class="users-who" {...privateProps()}>
      {card.nameEditable ? (
        <Editable
          className="users-who-name"
          value={person.name ?? ''}
          shown={person.displayName}
          label={t.editName}
          placeholder={card.namePlaceholder}
          save={(value) => change(users, person, 'name', value)}
        />
      ) : (
        <div class="users-who-name">
          <span>{person.displayName}</span>
        </div>
      )}
      {card.email === 'fixed' ? (
        <div class="users-who-email">
          <span>{person.email}</span>
        </div>
      ) : card.email === 'editable' ? (
        <Editable
          className="users-who-email"
          value={person.email}
          shown={person.email}
          label={t.editEmail}
          placeholder={t.emailExample}
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

function Pills({ person, card }: { person: PersonLines; card: CardLines }) {
  return (
    <div class="users-pills">
      {person.self && <span class="users-pill you">{texts.you}</span>}
      <RolePills person={person} />
      {!person.active && <span class="users-pill off">{texts.deactivated}</span>}
      <span class="users-when">
        <LastSignIn person={person} /> · {card.when}
      </span>
    </div>
  );
}

function Middle({ person, card }: { person: PersonRow; card: CardLines }) {
  if (card.middle === 'off')
    return (
      <p class="users-notice pine">
        <Icon name="info" />
        <span>{t.offHint}</span>
      </p>
    );
  if (card.middle === 'never')
    return (
      <p class="users-notice urgent" {...privateProps()}>
        <Icon name="info" />
        <span>{card.neverHint}</span>
      </p>
    );
  return (
    <>
      <Tiles person={person} />
      <Access person={person} />
      <Rows />
    </>
  );
}

// Dar de alta, borrar el alta o dar de baja.
function Foot({ person, foot }: { person: PersonRow; foot: CardLines['foot'] }) {
  const users = useUsersContext();
  const keys = useShortcutHints('users');
  if (foot === 'self') return <Note>{t.selfNote}</Note>;
  if (foot === 'activate')
    return (
      <Button
        icon="user-check"
        keyHint={keys.activate}
        doing={t.activate}
        onPress={() => activate(users, person)}
        disabled={!users.online}
      >
        {t.activate}
      </Button>
    );
  if (foot === 'delete')
    return (
      <>
        <Button
          look="danger"
          icon="trash-2"
          keyHint={keys.remove}
          doing={t.delete}
          onPress={() => remove(users, person)}
        >
          {t.delete}
        </Button>
        <span class="users-foot-hint">{t.deleteHint}</span>
      </>
    );
  if (!foot) return null;
  return (
    <Button
      look="danger"
      icon="user-x"
      keyHint={keys.deactivate}
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
  const lines = users.personLines;
  const card = users.cardLines;
  if (!person || !lines || !card)
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
        <Avatar person={lines} large />
        <Who person={person} card={card} />
      </div>
      <Pills person={lines} card={card} />
      <Middle person={person} card={card} />
      {users.may.roles && <PersonRoles person={person} />}
      <div class="users-card-foot">
        <Foot person={person} foot={card.foot} />
      </div>
    </aside>
  );
}
