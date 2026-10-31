// La pantalla de Usuarios (capítulo 02; maquetas users-a/final): la cabecera con sus pestañas, las
// cuentas, el buscador con los filtros y la lista, con la tarjeta de la persona elegida al costado
// en la computadora y en su lugar en lo angosto. Sin conexión se ve gris, con lo último que trajo,
// y vuelve sola (R2.2).
import { useEffect, useState } from 'preact/hooks';
import { useBackStep } from '../../../../platform/back-step.ts';
import { Button } from '../../../../ui/button/Button.tsx';
import { addShapes, Icon } from '../../../../ui/icon/Icon.tsx';
import { peopleShapes } from '../../../../ui/icon/people-shapes.tsx';
import { loadConfirmSheet } from '../../../sign-in/index.ts';
import { UsersContext, useUsers, useUsersContext } from '../../state.ts';
import { texts } from '../../texts.ts';
import { Card } from '../Card/Card.tsx';
import { Authorize } from '../Overlays/Authorize.tsx';
import { ConfirmCloseAll, ConfirmDeactivate } from '../Overlays/Confirm.tsx';
import { Lost } from '../Overlays/Lost.tsx';
import { AuthorizeButton, Head, LostRow } from './Head.tsx';
import { List } from './List.tsx';
import { Filters, Stats } from './Summary.tsx';
import './Users.css';

addShapes(peopleShapes);

type Sheet = Awaited<ReturnType<typeof loadConfirmSheet>>['ConfirmSheet'];

// La hoja de volver a confirmar quién es, que se baja recién ahora.
function Confirm({ retry, close }: { retry: () => unknown; close: () => void }) {
  const [sheet, setSheet] = useState<{ Sheet: Sheet }>();
  useEffect(() => {
    void loadConfirmSheet().then((loaded) => setSheet({ Sheet: loaded.ConfirmSheet }));
  }, []);
  return sheet ? <sheet.Sheet onConfirmed={retry} onClose={close} /> : null;
}

function Overlays() {
  const users = useUsersContext();
  const overlay = users.overlay;
  if (!overlay) return null;
  if (overlay.kind === 'authorize') return <Authorize />;
  if (overlay.kind === 'lost') return <Lost />;
  if (overlay.kind === 'deactivate') return <ConfirmDeactivate person={overlay.person} />;
  if (overlay.kind === 'close-all') return <ConfirmCloseAll person={overlay.person} />;
  return <Confirm retry={overlay.retry} close={users.close} />;
}

// En lo angosto, la tarjeta abierta es un paso del historial: atrás vuelve a la lista.
function CardStep() {
  const users = useUsersContext();
  useBackStep(() => users.select(undefined));
  return null;
}

function Body() {
  const users = useUsersContext();
  if (!users.people)
    return users.failed ? (
      <div class="users-empty">
        <Icon name="triangle-alert" size="large" />
        <b>{texts.loadFailed}</b>
        <Button icon="refresh-cw" doing={texts.retry} onPress={users.load}>
          {texts.retry}
        </Button>
      </div>
    ) : (
      <p class="users-empty" aria-busy="true">
        {texts.loading}
      </p>
    );
  return (
    <div class="users-body">
      <div class="users-left">
        <Stats />
        <LostRow />
        <Filters />
        <List />
      </div>
      <Card />
    </div>
  );
}

export function Users({ testing }: { testing: boolean }) {
  const users = useUsers();
  const narrow = matchMedia('(max-width: 899px)').matches;
  return (
    <UsersContext.Provider value={users}>
      <section
        class={users.selected ? 'users with-card' : 'users'}
        aria-label={texts.title}
        data-off={users.online ? undefined : ''}
      >
        <Head testing={testing} />
        {!users.online && (
          <p class="users-offline" role="status">
            <Icon name="wifi-off" size="small" />
            {texts.offline}
          </p>
        )}
        <div class="users-content" inert={!users.online}>
          <Body />
        </div>
        <div class="users-bar phone-only">
          <AuthorizeButton />
        </div>
      </section>
      {narrow && users.selected && <CardStep />}
      <Overlays />
    </UsersContext.Provider>
  );
}
