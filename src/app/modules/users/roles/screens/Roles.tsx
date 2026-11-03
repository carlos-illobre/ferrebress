// La pestaña Roles (02 · R7.12, R7.13; diseño de 02, § 20), que se baja recién al abrirla. Cada vista
// tiene su dirección: /users/roles la lista, /users/roles/new el rol nuevo (también al duplicar o al
// crear con lo buscado) y /users/roles/<id> uno que existe. Las dos ocupan la pestaña, nunca a la vez.
import type { PersonRow } from '@ferrebress/shared/contracts/users';
import { useEffect } from 'preact/hooks';
import { navigate, route } from '../../../../platform/router.ts';
import { useStore } from '../../../../platform/store.ts';
import { addShapes } from '../../../../ui/icon/Icon.tsx';
import { rolesShapes } from '../../../../ui/icon/roles-shapes.tsx';
import { LoadState } from '../../../../ui/load-state/LoadState.tsx';
import { showToast } from '../../../../ui/toast/Toast.tsx';
import { useUsersContext } from '../../state.ts';
import { duplicateOf, emptyDraft, fromRole } from '../draft.ts';
import { activeHolders, ids, listPath, type NewState } from '../paths.ts';
import { rolesTexts as t } from '../texts.ts';
import { RoleList } from './list/RoleList.tsx';
import { RoleScreen } from './role/RoleScreen.tsx';
import './Roles.css';

addShapes(rolesShapes);

// Uno nuevo: vacío, con el nombre buscado, o la copia del que se duplica (E38).
function NewRole() {
  const users = useUsersContext();
  const asked = (useStore(route).state ?? {}) as NewState;
  const source = users.roleRows?.find((one) => one.id === asked.duplicate);
  useEffect(() => {
    if (source) showToast(t.copied(source.name), 'copy');
  }, []);
  return <RoleScreen start={source ? duplicateOf(source) : emptyDraft(asked.name ?? '')} />;
}

function OpenedRole({ id }: { id: string }) {
  const users = useUsersContext();
  const role = users.roleRows?.find((one) => one.id === id);
  // Ya no está (lo borraron, o la dirección es vieja): la lista.
  useEffect(() => {
    if (!role) navigate(listPath, { replace: true, force: true });
  }, [role]);
  return role ? (
    <RoleScreen start={fromRole(role, ids(activeHolders(users.people as PersonRow[], id)))} />
  ) : null;
}

export function Roles() {
  const users = useUsersContext();
  const { path, state } = useStore(route);
  if (!users.roleRows || !users.people)
    return (
      <LoadState
        look="roles-tab roles-empty"
        failed={users.rolesFailed && !users.roleRows}
        texts={t}
        retry={users.loadRoles}
      />
    );
  const opened = path.startsWith(`${listPath}/`)
    ? decodeURIComponent(path.slice(listPath.length + 1))
    : undefined;
  if (!opened)
    return (
      <div class="roles-tab">
        <RoleList />
      </div>
    );
  return (
    <div class="roles-tab">
      {opened === 'new' ? (
        <NewRole key={JSON.stringify(state)} />
      ) : (
        <OpenedRole key={opened} id={opened} />
      )}
    </div>
  );
}
