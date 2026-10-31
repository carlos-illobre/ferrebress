// La cabecera de Usuarios: el título, «Se perdió un celular» y «Autorizar a alguien», y las
// pestañas Usuarios · Auditoría (Auditoría es del capítulo 05: en pruebas con «Pronto»; en
// producción no está, 00 · R1.3). En el celular
// «Se perdió un celular» va arriba de la lista y «Autorizar a alguien», abajo (maqueta).
import { Button } from '../../../../ui/button/Button.tsx';
import { Icon } from '../../../../ui/icon/Icon.tsx';
import { showToast } from '../../../../ui/toast/Toast.tsx';
import { useUsersContext } from '../../state.ts';
import { texts } from '../../texts.ts';
import './Head.css';

export function AuthorizeButton() {
  const users = useUsersContext();
  return (
    <Button
      look="action"
      icon="user-plus"
      shortcut="z"
      doing={texts.authorize}
      onPress={() => users.open({ kind: 'authorize' })}
      disabled={!users.online}
    >
      {texts.authorize}
    </Button>
  );
}

export function Head({ testing }: { testing: boolean }) {
  const users = useUsersContext();
  return (
    <>
      <header class="users-head">
        <h1 class="users-title">{texts.title}</h1>
        <div class="users-actions desktop-only">
          <Button
            icon="smartphone"
            shortcut="i"
            doing={texts.lost}
            onPress={() => users.open({ kind: 'lost' })}
            disabled={!users.online}
          >
            {texts.lost}
          </Button>
          <AuthorizeButton />
        </div>
      </header>
      <nav class="users-tabs" aria-label={texts.tabs}>
        <span class="users-tab" aria-current="page">
          {texts.title}
        </span>
        {testing && (
          <button
            type="button"
            class="users-tab soon"
            onClick={() => showToast(`${texts.audit} · pronto. Todavía no está.`)}
          >
            {texts.audit}
            <span class="users-soon">{texts.soon}</span>
          </button>
        )}
      </nav>
    </>
  );
}

// «Se perdió un celular» en el celular: un renglón propio, rojo suave y con borde, que se distingue
// de las personas (maqueta aprobada).
export function LostRow() {
  const users = useUsersContext();
  return (
    <button
      type="button"
      class="users-lost phone-only"
      disabled={!users.online}
      onClick={() => users.open({ kind: 'lost' })}
    >
      <span class="users-lost-icon">
        <Icon name="smartphone" />
      </span>
      <span>
        <b>{texts.lost}</b>
        <small>{texts.lostDetail}</small>
      </span>
      <Icon name="chevron-right" />
    </button>
  );
}
