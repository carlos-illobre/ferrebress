// «Se perdió un celular» (R5.7): de quién es, cuál de sus celulares (si tiene uno solo, ya está
// elegido) y «Cortar», que cierra sus sesiones ahí y le quita la huella, sin confirmación. Dice
// qué cortó.

import {
  deviceOf,
  nowMs,
  type Owner,
  sinceOf,
  dialogTexts as t,
  useLost,
  useUsersContext,
} from '../../../../modules/users/model.ts';
import { Button } from '../../ui/button/Button.tsx';
import { Dialog } from '../../ui/dialog/Dialog.tsx';
import { Icon } from '../../ui/icon/Icon.tsx';
import './Overlays.css';
import { privateProps } from '../../../../platform/view/private.ts';

function Who({ people, choose }: { people: Owner[]; choose: (owner: Owner) => void }) {
  return (
    <div class="users-options" {...privateProps()}>
      {people.map((owner) => (
        <button
          key={owner.userId}
          type="button"
          class="users-item users-option"
          data-mark=""
          onClick={() => choose(owner)}
        >
          <span class="users-item-icon">
            <Icon name="users" />
          </span>
          <span class="users-item-text">
            <b>{owner.self ? t.lostYou(owner.displayName) : owner.displayName}</b>
            <span>{t.phonesOf(owner.phones.length)}</span>
          </span>
          <Icon name="chevron-right" />
        </button>
      ))}
    </div>
  );
}

function Which({
  owner,
  chosen,
  choose,
}: {
  owner: Owner;
  chosen: string | undefined;
  choose: (id: string) => void;
}) {
  const now = nowMs();
  return (
    <div class="users-options">
      {owner.phones.map((phone) => {
        const detail = [
          phone.sessions > 0 && t.openSessions(phone.sessions),
          phone.passkey && t.withPasskey,
          phone.lastUsedAt !== null && `usado ${sinceOf(phone.lastUsedAt, now)}`,
        ].filter(Boolean);
        return (
          <button
            key={phone.id}
            type="button"
            class="users-item users-option"
            aria-pressed={chosen === phone.id}
            data-mark=""
            onClick={() => choose(phone.id)}
          >
            <span class="users-item-icon">
              <Icon name="smartphone" />
            </span>
            <span class="users-item-text">
              <b>{deviceOf(phone)}</b>
              <span>{detail.join(' · ')}</span>
            </span>
            <span class="users-radio" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}

export function Lost() {
  const users = useUsersContext();
  const { people, owner, chosen, title, lead, choose, pick, cut } = useLost(users);
  return (
    <Dialog label={title} className="users-dialog">
      <h2 {...privateProps()}>{title}</h2>
      <p class="users-lead">{lead}</p>
      {owner ? (
        <Which owner={owner} chosen={chosen} choose={pick} />
      ) : (
        <Who people={people} choose={choose} />
      )}
      <div class="users-dialog-foot">
        <Button look="plain" doing={t.cancel} onPress={users.close} closes>
          {t.cancel}
        </Button>
        {owner && (
          <Button look="red" icon="power" doing={t.cut} disabled={!chosen} primary onPress={cut}>
            {t.cut}
          </Button>
        )}
      </div>
    </Dialog>
  );
}
