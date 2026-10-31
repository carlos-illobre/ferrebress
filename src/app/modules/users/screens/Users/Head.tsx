// La cabecera de Usuarios: el título, «Se perdió un celular» y «Autorizar a alguien», y las
// pestañas Usuarios · Auditoría (Auditoría es del capítulo 05: con «Pronto», 00 · R1.3). En el celular
// «Se perdió un celular» va arriba de la lista y «Autorizar a alguien», abajo (maqueta).
import { Button } from '../../../../ui/button/Button.tsx';
import { Icon } from '../../../../ui/icon/Icon.tsx';
import { showToast } from '../../../../ui/toast/Toast.tsx';
import { PhoneLight } from '../../../frame/index.ts';
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

// El buscador y los filtros en el celular: dos íconos redondos al lado del título que abren cada uno
// su parte debajo; un punto dice que hay un filtro o una búsqueda puestos.
function PhoneTools() {
  const users = useUsersContext();
  const tool = (
    which: 'search' | 'filters',
    icon: 'search' | 'sliders-horizontal',
    label: string,
    on: boolean,
  ) => (
    <button
      type="button"
      class="users-tool"
      aria-label={label}
      aria-expanded={users.tools === which}
      onClick={() => users.toggleTools(which)}
    >
      <Icon name={icon} />
      {on && <span class="users-tool-dot" aria-hidden="true" />}
    </button>
  );
  return (
    <div class="users-tools phone-only">
      {tool('search', 'search', texts.searchLabel, users.search.trim() !== '')}
      {tool('filters', 'sliders-horizontal', texts.filtersLabel, users.filter !== 'all')}
    </div>
  );
}

export function Head() {
  const users = useUsersContext();
  return (
    <>
      <header class="users-head">
        <div class="users-heading">
          <h1 class="users-title">{texts.title}</h1>
          <PhoneLight />
        </div>
        <PhoneTools />
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
          <Icon name="users" size="small" />
          {texts.title}
        </span>
        <button
          type="button"
          class="users-tab soon"
          onClick={() => showToast(`${texts.audit} · pronto. Todavía no está.`)}
        >
          <Icon name="file-text" size="small" />
          {texts.audit}
          <span class="users-soon">{texts.soon}</span>
        </button>
      </nav>
    </>
  );
}

// «Se perdió un celular» en el celular: un botón secundario, neutro, al lado de «Autorizar a
// alguien» en la barra de abajo; no es un aviso, así que no va en rojo (pedido de Carlos).
export function LostButton() {
  const users = useUsersContext();
  return (
    <Button
      icon="smartphone"
      doing={texts.lost}
      onPress={() => users.open({ kind: 'lost' })}
      disabled={!users.online}
    >
      {texts.lost}
    </Button>
  );
}
