// Guardar los roles de una persona (02 · R7.5): llama al servidor, pone la lista y los roles como
// quedaron y lo dice. Dar algo puede pedir confirmar quién es (R3.8): al confirmar, se repite solo.
// La pestaña Roles guarda lo suyo en roles/actions.ts.
import type { PersonRow } from '@ferrebress/shared/contracts/users';
import { showToast } from '../../ui/toast/Toast.tsx';
import { usersApi } from './api.ts';
import { roleTexts } from './person-roles-texts.ts';
import { confirmOrRefuse, type Users } from './state.ts';

type Result = Awaited<ReturnType<typeof usersApi.setRoles>>;

// Si salió, vuelve a traer todo y lo dice; si no, confirma (lo que da algo, `again`) o dice por
// qué. Dice si salió.
async function settle(users: Users, result: Result, done: string, again: () => unknown) {
  if (!result.ok) {
    if (!confirmOrRefuse(users, result, again)) await users.reload();
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
