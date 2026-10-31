// Las sesiones abiertas y los celulares con huella de la tarjeta (R5): cada uno con «Cerrar» o
// «Quitar», sin confirmación; «Cerrar todas», con confirmación. En la propia no figuran la sesión
// que se usa ni sus celulares (R5.2, R5.5). «Cerrar» y «Quitar» no llevan tecla: se recorren con
// las flechas y se tocan con Enter (R5.8).
import type { PersonRow, PhoneRow, SessionRow } from '@ferrebress/shared/contracts/users';
import { Button } from '../../../../ui/button/Button.tsx';
import { Icon } from '../../../../ui/icon/Icon.tsx';
import { Say } from '../../../../ui/say/Say.tsx';
import { showToast } from '../../../../ui/toast/Toast.tsx';
import { closeSession, removePhone } from '../../actions.ts';
import { dateOf, nowMs, sinceOf, wayNames } from '../../logic.ts';
import { useUsersContext } from '../../state.ts';
import { cardTexts as t, texts } from '../../texts.ts';
import './Access.css';

function Session({ person, session }: { person: PersonRow; session: SessionRow }) {
  const users = useUsersContext();
  return (
    <li class="users-item">
      <span class="users-item-icon">
        <Icon name={session.isPhone ? 'smartphone' : 'monitor'} />
      </span>
      <span class="users-item-text">
        <b>{session.deviceLabel}</b>
        <span>{t.sessionLine(wayNames[session.way], sinceOf(session.createdAt, nowMs()))}</span>
        <span>{t.usedSession(sinceOf(session.lastUsedAt, nowMs()))}</span>
      </span>
      <Button
        look="soft"
        size="small"
        doing={t.close}
        onPress={() => closeSession(users, person, session)}
      >
        {t.close}
      </Button>
    </li>
  );
}

function Phone({ person, phone }: { person: PersonRow; phone: PhoneRow }) {
  const users = useUsersContext();
  const used = phone.lastUsedAt === null ? undefined : sinceOf(phone.lastUsedAt, nowMs());
  return (
    <li class="users-item">
      <span class="users-item-icon">
        <Icon name="fingerprint" />
      </span>
      <span class="users-item-text">
        <b>{phone.deviceLabel}</b>
        <span>{t.linked(dateOf(phone.createdAt, nowMs()))}</span>
        <span>{t.usedPhone(used)}</span>
      </span>
      <Button
        look="soft"
        size="small"
        doing={t.remove}
        onPress={() => removePhone(users, person, phone.id)}
      >
        {t.remove}
      </Button>
    </li>
  );
}

function Note({ children }: { children: preact.ComponentChildren }) {
  return (
    <p class="users-note">
      <Icon name="info" size="small" />
      <span>{children}</span>
    </p>
  );
}

function Sessions({ person, sessions }: { person: PersonRow; sessions: SessionRow[] }) {
  const users = useUsersContext();
  return (
    <section class="users-section" id="users-sessions">
      <div class="users-section-head">
        <h3>
          {texts.sessionsCount} <span>{sessions.length}</span>
        </h3>
        <Soon className="users-history phone-only" name={t.history} />
        {sessions.length > 0 && (
          <Button
            size="small"
            icon="log-out"
            shortcut="d"
            doing={t.closeAll}
            onPress={() => users.open({ kind: 'close-all', person })}
          >
            {t.closeAll}
          </Button>
        )}
      </div>
      {sessions.length > 0 ? (
        <ul class="users-items">
          {sessions.map((session) => (
            <Session key={session.id} person={person} session={session} />
          ))}
        </ul>
      ) : (
        <p class="users-nothing">{t.noSessions}</p>
      )}
      {person.self && (
        <Note>
          <Say words={t.ownSession} />
        </Note>
      )}
    </section>
  );
}

function Phones({ person, phones }: { person: PersonRow; phones: PhoneRow[] }) {
  return (
    <section class="users-section" id="users-phones">
      <div class="users-section-head">
        <h3>
          {texts.phonesCount} {!person.self && <span>{phones.length}</span>}
        </h3>
      </div>
      {person.self ? (
        <Note>{t.ownPhones}</Note>
      ) : phones.length > 0 ? (
        <ul class="users-items">
          {phones.map((phone) => (
            <Phone key={phone.id} person={person} phone={phone} />
          ))}
        </ul>
      ) : (
        <p class="users-nothing">{t.noPhones}</p>
      )}
    </section>
  );
}

export function Access({ person }: { person: PersonRow }) {
  const { access } = useUsersContext();
  if (!access)
    return (
      <p class="users-nothing" aria-busy="true">
        {t.loading}
      </p>
    );
  return (
    <>
      <Sessions person={person} sessions={access.sessions} />
      <Phones person={person} phones={access.phones} />
    </>
  );
}

// Lo que todavía no está (el historial es la Auditoría, capítulo 05): lo dice al tocarlo.
export function Soon({ name, className }: { name: string; className: string }) {
  return (
    <button type="button" class={className} onClick={() => showToast(t.soon(name))}>
      {name}
      <Icon name="chevron-right" size="small" />
    </button>
  );
}

export { Note };
