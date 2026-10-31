// Lo que hacen los botones de los roles (02 · R7.3, R7.5): llaman al servidor, ponen la lista y los
// roles como quedaron y lo dicen. Dar algo puede pedir confirmar quién es (R3.8): al confirmar, se
// repite solo. Después de cada cambio se vuelven a pedir la lista y los roles, que cambian juntos.
import type { PersonRow } from '@ferrebress/shared/contracts/users';
import { showToast } from '../../ui/toast/Toast.tsx';
import { type RoleDraft, usersApi } from './api.ts';
import { roleTexts } from './role-texts.ts';
import { confirmFirst, refused, type Users } from './state.ts';

type Result =
  | Awaited<ReturnType<typeof usersApi.changeRole>>
  | Awaited<ReturnType<typeof usersApi.setRoles>>;

// Si salió, vuelve a traer todo y lo dice; si no, confirma (lo que da algo, `again`) o dice por
// qué. Dice si salió.
async function settle(users: Users, result: Result, done: string, again?: () => unknown) {
  if (!result.ok) {
    if (!again || !confirmFirst(users, result, again)) {
      refused(users, result);
      await users.reload();
    }
    return false;
  }
  await users.reload();
  showToast(done, 'shield-check');
  return true;
}

// Los roles de una persona (R7.5), con su versión de ahora.
export async function saveRoles(users: Users, person: PersonRow, roles: string[]) {
  const again = () => saveRoles(users, person, roles);
  const result = await usersApi.setRoles(person.id, person.version, roles);
  return settle(users, result, roleTexts.saved(person.displayName), again);
}

// Crear un rol (también duplicar, R7.3). Devuelve el nuevo, para elegirlo.
export async function createRole(users: Users, draft: RoleDraft): Promise<string | undefined> {
  const result = await usersApi.createRole(draft);
  const again = async () => {
    const id = await createRole(users, draft);
    if (id) users.setRoleCard(id);
  };
  if (!(await settle(users, result, roleTexts.created(draft.name), again))) return undefined;
  return (result as Extract<typeof result, { ok: true }>).data.role.id;
}

export async function changeRole(
  users: Users,
  role: { id: string; version: number },
  change: Partial<RoleDraft>,
) {
  const again = () => changeRole(users, role, change);
  const result = await usersApi.changeRole(role.id, role.version, change);
  return settle(users, result, roleTexts.changed, again);
}

export async function removeRole(
  users: Users,
  role: { id: string; version: number; name: string },
) {
  const result = await usersApi.deleteRole(role.id, role.version);
  const ok = await settle(users, result as Result, roleTexts.deleted(role.name));
  if (ok) users.setRoleCard(undefined);
}
