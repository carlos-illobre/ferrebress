// Lo que la tarjeta suma en el celular (referencia de Carlos): tres botones arriba (cortar sus
// sesiones, quitar su huella y cambiar sus roles, que lleva a «Roles de…») y tres renglones abajo (su
// huella, sus dispositivos y su historial, que llega con la Auditoría). Hacen lo mismo que la tarjeta
// de la computadora: no hay ninguna acción nueva.
import type { PersonRow } from '@ferrebress/shared/contracts/users';
import type { ComponentChildren } from 'preact';
import { removePhone, cardTexts as t, useUsersContext } from '../../../../modules/users/model.ts';
import { notify } from '../../../../platform/view/notify.ts';
import { showPart } from '../../../../platform/view/page.ts';
import { Icon, type IconName } from '../../ui/icon/Icon.tsx';
import './Phone.css';

type Tile = {
  icon: IconName;
  name: string;
  tone: string;
  act: () => unknown;
  off?: boolean;
  // Sin el permiso no aparece (R7.7); `off` es que no hay nada que hacer.
  allowed: boolean;
};

function TileButton({ tile }: { tile: Tile }) {
  return (
    <button
      type="button"
      class={`surface users-tile ${tile.tone}`}
      disabled={tile.off}
      onClick={tile.act}
    >
      <Icon name={tile.icon} />
      <span>{tile.name}</span>
    </button>
  );
}

export function Tiles({ person }: { person: PersonRow }) {
  const users = useUsersContext();
  const lines = users.accessLines;
  // Con un solo celular, «Quitar huella» lo quita; con más, lleva a la lista para elegir cuál.
  const removeOne = () =>
    lines?.onlyPhone ? removePhone(users, person, lines.onlyPhone) : showPart('users-phones');
  const tiles: Tile[] = [
    {
      icon: 'lock',
      name: t.cutSessions,
      tone: 'red',
      act: () => users.open({ kind: 'close-all', person }),
      ...(lines?.tiles.cut ?? { allowed: false, off: true }),
    },
    {
      icon: 'fingerprint',
      name: t.removePasskey,
      tone: 'orange',
      act: removeOne,
      ...(lines?.tiles.passkey ?? { allowed: false, off: true }),
    },
    {
      icon: 'user-check',
      name: t.changeRole,
      tone: 'green',
      act: () => showPart('users-roles'),
      allowed: users.may.roles,
    },
  ];
  return (
    <div class="users-tiles phone-only">
      {tiles
        .filter((tile) => tile.allowed)
        .map((tile) => (
          <TileButton key={tile.name} tile={tile} />
        ))}
    </div>
  );
}

function Row(props: {
  icon: IconName;
  name: string;
  children: ComponentChildren;
  act: () => unknown;
}) {
  return (
    <button type="button" class="users-link-row" onClick={props.act}>
      <Icon name={props.icon} />
      <span>{props.name}</span>
      <small>{props.children}</small>
      <Icon name="chevron-right" size="small" />
    </button>
  );
}

export function Rows() {
  const users = useUsersContext();
  const sessions = users.access?.sessions.length ?? 0;
  const phones = users.access?.phones.length ?? 0;
  return (
    <div class="surface users-link-rows phone-only">
      <Row icon="fingerprint" name={t.passkeyRow} act={() => showPart('users-phones')}>
        {t.passkeys(phones)}
      </Row>
      <Row icon="monitor" name={t.devicesRow} act={() => showPart('users-sessions')}>
        {t.devices(sessions)}
      </Row>
      <Row icon="clock" name={t.historyRow} act={() => notify(t.soon(t.historyRow))}>
        {t.soonShort}
      </Row>
    </div>
  );
}
