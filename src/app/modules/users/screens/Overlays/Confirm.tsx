// Las dos confirmaciones (R4.1, R5.4): dar de baja, con todo lo que le pasa, y «Cerrar todas», con
// cada sesión que se cierra.
import type { AccessResponse, PersonRow } from '@ferrebress/shared/contracts/users';
import { Button } from '../../../../ui/button/Button.tsx';
import { Dialog } from '../../../../ui/dialog/Dialog.tsx';
import { Icon, type IconName } from '../../../../ui/icon/Icon.tsx';
import { closeAll, deactivate } from '../../actions.ts';
import { nowMs, sinceOf } from '../../logic.ts';
import { useUsersContext } from '../../state.ts';
import { cardTexts, dialogTexts as t } from '../../texts.ts';
import './Overlays.css';

type Line = { icon: IconName; text: string };

function Ask(props: {
  title: string;
  lead: string;
  lines: Line[];
  yes: string;
  icon: IconName;
  act: () => unknown;
}) {
  const users = useUsersContext();
  return (
    <Dialog label={props.title} className="users-dialog">
      <h2 data-private="">{props.title}</h2>
      <p class="users-lead">{props.lead}</p>
      <ul class="users-consequences" data-private="">
        {props.lines.map((line, index) => (
          <li key={index}>
            <Icon name={line.icon} />
            <span>{line.text}</span>
          </li>
        ))}
      </ul>
      <div class="users-dialog-foot">
        <Button look="plain" doing={t.cancel} onPress={users.close} closes>
          {t.cancel}
        </Button>
        <Button look="red" icon={props.icon} doing={props.yes} onPress={props.act} primary>
          {props.yes}
        </Button>
      </div>
    </Dialog>
  );
}

export function ConfirmDeactivate({ person }: { person: PersonRow }) {
  const users = useUsersContext();
  return (
    <Ask
      title={t.deactivateTitle(person.displayName)}
      lead={t.deactivateLead}
      lines={[
        { icon: 'log-out', text: t.deactivateSessions(person.sessions) },
        { icon: 'fingerprint', text: t.deactivatePhones(person.phones) },
        { icon: 'ban', text: t.deactivateEntry },
      ]}
      yes={cardTexts.deactivate}
      icon="user-x"
      act={() => deactivate(users, person)}
    />
  );
}

export function ConfirmCloseAll({ person }: { person: PersonRow }) {
  const users = useUsersContext();
  // Se abre desde la tarjeta, con sus sesiones ya traídas.
  const { sessions } = users.access as AccessResponse;
  const now = nowMs();
  return (
    <Ask
      title={t.closeAllTitle(sessions.length, person.displayName)}
      lead={t.closeAllLead(person.self)}
      lines={sessions.map((session) => ({
        icon: session.isPhone ? 'smartphone' : 'monitor',
        text: `${session.deviceLabel} · ${cardTexts.usedSession(sinceOf(session.lastUsedAt, now))}`,
      }))}
      yes={cardTexts.closeAll}
      icon="log-out"
      act={() => closeAll(users, person)}
    />
  );
}
