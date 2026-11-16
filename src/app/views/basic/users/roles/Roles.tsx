// La pestaña Roles (02 · R7.12, R7.13; diseño de 02, § 20), que se baja recién al abrirla. Cada vista
// tiene su dirección: /users/roles la lista, /users/roles/new el rol nuevo (también al duplicar o al
// crear con lo buscado) y /users/roles/<id> uno que existe. Las dos ocupan la pestaña, nunca a la vez.

import {
  rolesTexts as t,
  useNewRole,
  useOpenedRole,
  useRolesTab,
} from '../../../../modules/users/model.ts';
import { addShapes } from '../../ui/icon/Icon.tsx';
import { rolesShapes } from '../../ui/icon/roles-shapes.tsx';
import { LoadState } from '../../ui/load-state/LoadState.tsx';
import { RoleList } from './list/RoleList.tsx';
import { RoleScreen } from './role/RoleScreen.tsx';
import './Roles.css';

addShapes(rolesShapes);

function NewRole() {
  return <RoleScreen start={useNewRole()} />;
}

function OpenedRole({ id }: { id: string }) {
  const start = useOpenedRole(id);
  return start ? <RoleScreen start={start} /> : null;
}

export function Roles() {
  const { loaded, failed, retry, opened, newKey } = useRolesTab();
  if (!loaded)
    return <LoadState look="roles-tab roles-empty" failed={failed} texts={t} retry={retry} />;
  if (!opened)
    return (
      <div class="roles-tab">
        <RoleList />
      </div>
    );
  return (
    <div class="roles-tab">
      {opened === 'new' ? <NewRole key={newKey} /> : <OpenedRole key={opened} id={opened} />}
    </div>
  );
}
