// «Se perdió un celular» (R5.7): de quién es, cuál de sus celulares (si tiene uno solo, ya está
// elegido) y «Cortar», que cierra sus sesiones ahí y le quita la huella, sin confirmación. Dice
// qué cortó.
import type { LostPhone, LostPhonesResponse } from '@ferrebress/shared/contracts/users';
import { useEffect, useState } from 'preact/hooks';
import { Button } from '../../../../ui/button/Button.tsx';
import { Dialog } from '../../../../ui/dialog/Dialog.tsx';
import { Icon } from '../../../../ui/icon/Icon.tsx';
import { showToast } from '../../../../ui/toast/Toast.tsx';
import { usersApi } from '../../api.ts';
import { nowMs, sinceOf } from '../../logic.ts';
import { refused, type Users, useUsersContext } from '../../state.ts';
import { doneTexts, somethingFailed, dialogTexts as t } from '../../texts.ts';
import './Overlays.css';

type Owner = LostPhonesResponse['people'][number];

async function cut(users: Users, owner: Owner, phoneId: string) {
  const phone = owner.phones.find((one) => one.id === phoneId) as LostPhone;
  const result = await usersApi.cut(owner.userId, phoneId, 'lost');
  users.close();
  if (!result.ok) return refused(users, result);
  const { sessions, passkey } = result.data;
  if (!sessions && !passkey) return showToast(doneTexts.nothingToCut, 'smartphone');
  users.recount(owner.userId, sessions, passkey ? 1 : 0);
  if (users.selected === owner.userId) await users.loadAccess(owner.userId);
  showToast(doneTexts.cut(phone.deviceLabel, owner.displayName, sessions, passkey), 'power');
}

function Who({ people, choose }: { people: Owner[]; choose: (owner: Owner) => void }) {
  return (
    <div class="users-options" data-private="">
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
              <b>{phone.deviceLabel}</b>
              <span>{detail.join(' · ')}</span>
            </span>
            <span class="users-radio" aria-hidden="true" />
          </button>
        );
      })}
    </div>
  );
}

const leadOf = (people: Owner[] | 'failed' | undefined) =>
  people === 'failed' ? somethingFailed : people?.length === 0 ? t.lostNobody : t.lostWhoLead;

export function Lost() {
  const users = useUsersContext();
  // `failed`: no se pudo preguntar; vacío: nadie tiene celulares para cortar.
  const [people, setPeople] = useState<Owner[] | 'failed'>();
  const [owner, setOwner] = useState<Owner>();
  const [chosen, setChosen] = useState<string>();
  useEffect(() => {
    void usersApi
      .lostPhones()
      .then((result) => setPeople(result.ok ? result.data.people : 'failed'));
  }, []);
  const choose = (picked: Owner) => {
    setOwner(picked);
    setChosen(picked.phones.length === 1 ? picked.phones[0]?.id : undefined);
  };
  const one = owner?.phones.length === 1;
  const title = !owner
    ? t.lostWho
    : one
      ? t.lostOne(owner.displayName)
      : t.lostWhich(owner.displayName);
  const lead = owner ? t.lostLead : leadOf(people);
  return (
    <Dialog label={title} className="users-dialog">
      <h2 data-private="">{title}</h2>
      <p class="users-lead">{lead}</p>
      {owner ? (
        <Which owner={owner} chosen={chosen} choose={setChosen} />
      ) : (
        <Who people={Array.isArray(people) ? people : []} choose={choose} />
      )}
      <div class="users-dialog-foot">
        <Button look="plain" doing={t.cancel} onPress={users.close} closes>
          {t.cancel}
        </Button>
        {owner && (
          <Button
            look="red"
            icon="power"
            doing={t.cut}
            disabled={!chosen}
            primary
            onPress={() => cut(users, owner, chosen as string)}
          >
            {t.cut}
          </Button>
        )}
      </div>
    </Dialog>
  );
}
