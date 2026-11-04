// La cabecera de Usuarios: el título, «Se perdió un celular» y «Autorizar a alguien», y las
// pestañas Usuarios · Roles · Quién hizo qué (del capítulo 05), cada una con su permiso. En el celular
// «Se perdió un celular» va arriba de la lista y «Autorizar a alguien», abajo (maqueta).
import { Button } from '../../../../ui/button/Button.tsx';
import { Icon } from '../../../../ui/icon/Icon.tsx';
import { PhoneLight, PhoneLink } from '../../../frame/index.ts';
import { useUsersContext } from '../../state.ts';
import { texts } from '../../texts.ts';
import './Head.css';

export function AuthorizeButton() {
  const users = useUsersContext();
  if (!users.may.authorize) return null;
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

// Buscar en el celular: un botón «Buscar usuario» que abre el diálogo con la caja y los filtros
// (pedido de Carlos); un punto dice que hay una búsqueda o un filtro puestos.
function SearchButton() {
  const users = useUsersContext();
  // En la pestaña Roles no hay nada que buscar.
  if (users.tab === 'roles') return null;
  const on = users.search.trim() !== '' || users.filter !== 'all';
  return (
    <button
      type="button"
      class="users-tool phone-only"
      onClick={() => users.open({ kind: 'search' })}
    >
      <Icon name="search" size="small" />
      {texts.searchUser}
      {on && <span class="users-tool-dot" aria-hidden="true" />}
    </button>
  );
}

export function Head() {
  const users = useUsersContext();
  return (
    <>
      <header class="users-head">
        <div class="users-heading">
          <div class="title-row">
            <h1 class="users-title">{texts.title}</h1>
            <PhoneLink />
          </div>
          <div class="users-subrow">
            <PhoneLight />
            <SearchButton />
          </div>
        </div>
        <div class="users-actions desktop-only">
          {users.tab === 'people' && (
            <>
              {users.may.cut && (
                <Button
                  icon="smartphone"
                  shortcut="i"
                  doing={texts.lost}
                  onPress={() => users.open({ kind: 'lost' })}
                  disabled={!users.online}
                >
                  {texts.lost}
                </Button>
              )}
              <AuthorizeButton />
            </>
          )}
        </div>
      </header>
      <nav class="users-tabs" aria-label={texts.tabs}>
        <button
          type="button"
          class="users-tab"
          aria-current={users.tab === 'people' ? 'page' : undefined}
          onClick={() => users.setTab('people')}
        >
          <Icon name="users" size="small" />
          {texts.title}
        </button>
        {users.may.roles && (
          <button
            type="button"
            class="users-tab"
            aria-current={users.tab === 'roles' ? 'page' : undefined}
            onClick={() => users.setTab('roles')}
          >
            <Icon name="shield-check" size="small" />
            {texts.rolesTab}
          </button>
        )}
        {users.may.audit && (
          <button
            type="button"
            class="users-tab"
            aria-current={users.tab === 'audit' ? 'page' : undefined}
            onClick={() => users.setTab('audit')}
          >
            <Icon name="file-text" size="small" />
            {texts.audit}
          </button>
        )}
      </nav>
    </>
  );
}

// «Se perdió un celular» en el celular: un botón secundario, neutro, al lado de «Autorizar a
// alguien» en la barra de abajo; no es un aviso, así que no va en rojo (pedido de Carlos).
export function LostButton() {
  const users = useUsersContext();
  if (!users.may.cut) return null;
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
