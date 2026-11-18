// Los modelos de la pestaña Roles (02 · R7.12, R7.13; diseño de 02, § 20), sin HTML. Cada vista tiene
// su dirección: /users/roles la lista, /users/roles/new el rol nuevo (también al duplicar o al crear
// con lo buscado) y /users/roles/<id> uno que existe. Las dos ocupan la pestaña, nunca a la vez.
import type { RoleRow } from '@ferrebress/shared/contracts/roles';
import type { PersonRow } from '@ferrebress/shared/contracts/users';
import { useEffect, useMemo } from 'preact/hooks';
import * as z from 'zod/mini';
import { useMirrored } from '../../../platform/mirror/use-mirrored.ts';
import { navigate, route } from '../../../platform/router.ts';
import { useScreen } from '../../../platform/screens.ts';
import { useStore } from '../../../platform/store.ts';
import { notify } from '../../../platform/view/notify.ts';
import { useUsersContext } from '../state.ts';
import { duplicateOf, emptyDraft, fromRole } from './draft.ts';
import { roleRowLines } from './lines.ts';
import { activeHolders, ids, listPath, type NewState, newPath, rolePath } from './paths.ts';
import { filterRoles, searchIndex } from './search.ts';
import { rolesTexts as t } from './texts.ts';

// Qué se ve en la pestaña: cargando, la lista o un rol, según la dirección.
export function useRolesTab() {
  const users = useUsersContext();
  const { path, state } = useStore(route);
  const opened = path.startsWith(`${listPath}/`)
    ? decodeURIComponent(path.slice(listPath.length + 1))
    : undefined;
  return {
    loaded: !!users.roleRows && !!users.people,
    failed: users.rolesFailed && !users.roleRows,
    retry: users.loadRoles,
    opened,
    // Cada pedido de un rol nuevo (vacío, con nombre o copia) arranca de cero.
    newKey: JSON.stringify(state),
  };
}

// Uno nuevo: vacío, con el nombre buscado, o la copia del que se duplica (E38).
export function useNewRole() {
  const users = useUsersContext();
  const asked = (useStore(route).state ?? {}) as NewState;
  const source = users.roleRows?.find((one) => one.id === asked.duplicate);
  useEffect(() => {
    if (source) notify(t.copied(source.name), 'copy');
  }, []);
  return source ? duplicateOf(source) : emptyDraft(asked.name ?? '');
}

// Uno que existe; si ya no está (lo borraron, o la dirección es vieja), a la lista.
export function useOpenedRole(id: string) {
  const users = useUsersContext();
  const role = users.roleRows?.find((one) => one.id === id);
  useEffect(() => {
    if (!role) navigate(listPath, { replace: true, force: true });
  }, [role]);
  return role && fromRole(role, ids(activeHolders(users.people as PersonRow[], id)));
}

// La lista: lo buscado viaja al otro dispositivo; se filtra con lo que ya está cargado.
export function useRoleList() {
  const users = useUsersContext();
  const [query, setQuery] = useMirrored(
    'users.roles.search',
    '',
    z.string().check(z.maxLength(200)),
  );
  // La lista se muestra con las personas y los roles ya traídos (useRolesTab).
  const people = users.people as PersonRow[];
  const roles = users.roleRows as RoleRow[];
  const index = useMemo(() => searchIndex(roles, people), [roles, people]);
  const shown = filterRoles(index, query);
  const model = {
    query,
    setQuery,
    people,
    online: users.online,
    shown,
    rows: shown.map((role) => roleRowLines(role, people)),
    wanted: query.trim(),
    arriving: (useStore(route).state as { arriving?: string } | null)?.arriving,
    openNew: (state: NewState = {}) => navigate(newPath, { state }),
    openRole: (id: string) => navigate(rolePath(id)),
  };
  useScreen('users-roles', model);
  return model;
}

export type RoleListModel = ReturnType<typeof useRoleList>;
