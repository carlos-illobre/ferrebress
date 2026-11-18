// «Se perdió un celular» (R5.7): de quién es, cuál de sus celulares (si tiene uno solo, ya está
// elegido) y «Cortar», que cierra sus sesiones ahí y le quita la huella, sin confirmación. Dice
// qué cortó.

import {
  type Owner,
  dialogTexts as t,
  useLost,
  useUsersContext,
} from '../../../../modules/users/model.ts';
import { Button } from '../../ui/button/Button.tsx';
import { Dialog } from '../../ui/dialog/Dialog.tsx';
import { Icon } from '../../ui/icon/Icon.tsx';
import './Overlays.css';
import { privateProps } from '../../../../platform/view/private.ts';

type Owners = ReturnType<typeof useLost>['owners'];

function Who({ owners, choose }: { owners: Owners; choose: (owner: Owner) => void }) {
  return (
    <div class="users-options" {...privateProps()}>
      {owners.map((one) => (
        <button
          key={one.owner.userId}
          type="button"
          class="users-item users-option"
          data-mark=""
          onClick={() => choose(one.owner)}
        >
          <span class="users-item-icon">
            <Icon name="users" />
          </span>
          <span class="users-item-text">
            <b>{one.name}</b>
            <span>{one.phones}</span>
          </span>
          <Icon name="chevron-right" />
        </button>
      ))}
    </div>
  );
}

type Phones = ReturnType<typeof useLost>['phones'];

function Which({
  phones,
  chosen,
  choose,
}: {
  phones: Phones;
  chosen: string | undefined;
  choose: (id: string) => void;
}) {
  return (
    <div class="users-options">
      {phones.map((phone) => (
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
            <b>{phone.device}</b>
            <span>{phone.detail}</span>
          </span>
          <span class="users-radio" aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

export function Lost() {
  const users = useUsersContext();
  const { owners, owner, phones, chosen, title, lead, choose, pick, cut } = useLost(users);
  return (
    <Dialog label={title} className="users-dialog">
      <h2 {...privateProps()}>{title}</h2>
      <p class="users-lead">{lead}</p>
      {owner ? (
        <Which phones={phones} chosen={chosen} choose={pick} />
      ) : (
        <Who owners={owners} choose={choose} />
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
