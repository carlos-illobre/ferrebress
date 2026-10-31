// Lo que la tarjeta suma en el celular (referencia de Carlos): tres botones arriba (cortar sus
// sesiones, quitar su huella y cambiar el rol, que llega con la etapa b) y tres renglones abajo (su
// huella, sus dispositivos y su historial, que llega con la Auditoría). Hacen lo mismo que la tarjeta
// de la computadora: no hay ninguna acción nueva.
import type { PersonRow } from '@ferrebress/shared/contracts/users';
import type { ComponentChildren } from 'preact';
import { Icon, type IconName } from '../../../../ui/icon/Icon.tsx';
import { showToast } from '../../../../ui/toast/Toast.tsx';
import { removePhone } from '../../actions.ts';
import { useUsersContext } from '../../state.ts';
import { cardTexts as t } from '../../texts.ts';
import './Phone.css';

const scrollTo = (id: string) =>
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

type Tile = {
  icon: IconName;
  name: string;
  tone: string;
  act: () => unknown;
  off?: boolean;
  soon?: boolean;
};

function TileButton({ tile }: { tile: Tile }) {
  return (
    <button type="button" class={`users-tile ${tile.tone}`} disabled={tile.off} onClick={tile.act}>
      <Icon name={tile.icon} />
      <span>{tile.name}</span>
      {tile.soon && <small>Pronto</small>}
    </button>
  );
}

export function Tiles({ person }: { person: PersonRow }) {
  const users = useUsersContext();
  const sessions = users.access?.sessions ?? [];
  const phones = users.access?.phones ?? [];
  // Con un solo celular, «Quitar huella» lo quita; con más, lleva a la lista para elegir cuál.
  const removeOne = () =>
    phones.length === 1
      ? removePhone(users, person, (phones[0] as { id: string }).id)
      : scrollTo('users-phones');
  const all: Tile[] = [
    {
      icon: 'lock',
      name: t.cutSessions,
      tone: 'red',
      act: () => users.open({ kind: 'close-all', person }),
      off: sessions.length === 0 || !users.online,
    },
    {
      icon: 'fingerprint',
      name: t.removePasskey,
      tone: 'orange',
      act: removeOne,
      off: phones.length === 0 || !users.online,
    },
    {
      icon: 'user-check',
      name: t.changeRole,
      tone: 'green',
      act: () => showToast(t.soon(t.changeRole)),
      soon: true,
    },
  ];
  const tiles = all.filter((tile) => users.testing || !tile.soon);
  return (
    <div class="users-tiles phone-only">
      {tiles.map((tile) => (
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
    <div class="users-link-rows phone-only">
      <Row icon="fingerprint" name={t.passkeyRow} act={() => scrollTo('users-phones')}>
        {t.passkeys(phones)}
      </Row>
      <Row icon="monitor" name={t.devicesRow} act={() => scrollTo('users-sessions')}>
        {t.devices(sessions)}
      </Row>
      {users.testing && (
        <Row icon="clock" name={t.historyRow} act={() => showToast(t.soon(t.historyRow))}>
          Pronto
        </Row>
      )}
    </div>
  );
}
