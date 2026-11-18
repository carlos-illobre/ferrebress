// Las sesiones abiertas y los celulares con huella de la tarjeta (R5): cada uno con «Cerrar» o
// «Quitar», sin confirmación; «Cerrar todas», con confirmación. En la propia no figura la sesión que
// se usa (R5.2); sus celulares sí, como en Configuración (R5.5). «Cerrar» y «Quitar» no llevan tecla: se recorren con
// las flechas y se tocan con Enter (R5.8).
import type { PersonRow } from '@ferrebress/shared/contracts/users';
import {
  type AccessLines,
  closeSession,
  removePhone,
  cardTexts as t,
  texts,
  useUsersContext,
} from '../../../../modules/users/model.ts';
import { notify } from '../../../../platform/view/notify.ts';
import { useShortcutHints } from '../../../../platform/view/shortcut-hints.ts';
import { Button } from '../../ui/button/Button.tsx';
import { Icon } from '../../ui/icon/Icon.tsx';
import { Say } from '../../ui/say/Say.tsx';
import './Access.css';

type Lines = AccessLines;

function Session({
  person,
  one,
  cut,
}: {
  person: PersonRow;
  one: Lines['sessions'][number];
  cut: boolean;
}) {
  const users = useUsersContext();
  return (
    <li class="users-item">
      <span class="users-item-icon">
        <Icon name={one.phone ? 'smartphone' : 'monitor'} />
      </span>
      <span class="users-item-text">
        <b>{one.device}</b>
        <span>{one.line}</span>
        <span>{one.used}</span>
      </span>
      {cut && (
        <Button
          look="soft"
          size="small"
          doing={t.close}
          onPress={() => closeSession(users, person, one.session)}
        >
          {t.close}
        </Button>
      )}
    </li>
  );
}

function Phone({
  person,
  one,
  cut,
}: {
  person: PersonRow;
  one: Lines['phones'][number];
  cut: boolean;
}) {
  const users = useUsersContext();
  return (
    <li class="users-item">
      <span class="users-item-icon">
        <Icon name="fingerprint" />
      </span>
      <span class="users-item-text">
        <b>{one.device}</b>
        <span>{one.linked}</span>
        <span>{one.used}</span>
      </span>
      {cut && (
        <Button
          look="soft"
          size="small"
          doing={t.remove}
          onPress={() => removePhone(users, person, one.phone)}
        >
          {t.remove}
        </Button>
      )}
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

function Sessions({ person, lines }: { person: PersonRow; lines: Lines }) {
  const users = useUsersContext();
  const keys = useShortcutHints('users');
  return (
    <section class="users-section" id="users-sessions">
      <div class="users-section-head">
        <h3>
          {texts.sessionsCount} <span>{lines.sessions.length}</span>
        </h3>
        <Soon className="users-history phone-only" name={t.history} />
        {lines.closeAll && (
          <Button
            size="small"
            icon="log-out"
            keyHint={keys.closeAll}
            doing={t.closeAll}
            onPress={() => users.open({ kind: 'close-all', person })}
          >
            {t.closeAll}
          </Button>
        )}
      </div>
      {lines.sessions.length > 0 ? (
        <ul class="users-items">
          {lines.sessions.map((one) => (
            <Session key={one.session.id} person={person} one={one} cut={lines.cut} />
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

function Phones({ person, lines }: { person: PersonRow; lines: Lines }) {
  return (
    <section class="users-section" id="users-phones">
      <div class="users-section-head">
        <h3>
          {texts.phonesCount} <span>{lines.phones.length}</span>
        </h3>
      </div>
      {lines.phones.length > 0 ? (
        <ul class="users-items">
          {lines.phones.map((one) => (
            <Phone key={one.phone.id} person={person} one={one} cut={lines.cut} />
          ))}
        </ul>
      ) : (
        <p class="users-nothing">{t.noPhones}</p>
      )}
    </section>
  );
}

export function Access({ person }: { person: PersonRow }) {
  const { accessLines } = useUsersContext();
  if (!accessLines)
    return (
      <p class="users-nothing" aria-busy="true">
        {t.loading}
      </p>
    );
  return (
    <>
      <Sessions person={person} lines={accessLines} />
      <Phones person={person} lines={accessLines} />
    </>
  );
}

// Lo que todavía no está (el historial es la Auditoría, capítulo 05): lo dice al tocarlo.
export function Soon({ name, className }: { name: string; className: string }) {
  return (
    <button type="button" class={className} onClick={() => notify(t.soon(name))}>
      {name}
      <Icon name="chevron-right" size="small" />
    </button>
  );
}

export { Note };
