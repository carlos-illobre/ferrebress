// Lo que hace cada botón de Usuarios: llama al servidor, pone la lista y la tarjeta como quedaron
// y lo dice con una tostada (maquetas de 02). Un rechazo lo atiende `refused`, salvo los del correo,
// que se devuelven para avisarlos junto al campo (R3.3).
import type { PersonRow, SessionRow } from '@ferrebress/shared/contracts/users';
import { showToast } from '../../ui/toast/Toast.tsx';
import { usersApi } from './api.ts';
import { confirmFirst, refused, type Users } from './state.ts';
import { doneTexts } from './texts.ts';

// Los rechazos que se dicen junto al campo del correo, sin tostada.
const besideEmail = ['email-taken', 'bad-request'];

// `again`: lo que repite el pedido después de confirmar quién es, con el diálogo todavía abierto,
// así un correo repetido se dice junto al campo (R3.3).
export async function authorize(
  users: Users,
  name: string,
  email: string,
  again: () => unknown,
): Promise<string | undefined> {
  const result = await usersApi.authorize(email.trim(), name.trim());
  if (!result.ok) {
    if (besideEmail.includes(result.error)) return result.error;
    if (!confirmFirst(users, result, again)) refused(users, result);
    return undefined;
  }
  users.put(result.data.person);
  users.setFilter('all');
  users.setSearch('');
  users.select(result.data.person.id);
  users.close();
  showToast(doneTexts.authorized, 'user-check');
  return undefined;
}

// Cambiar el nombre (vacío vuelve al de Google, R3.5) o el correo (solo si nunca entró, R3.6).
// Cambiar el correo pide confirmar quién es (R3.8): la caja ya se cerró, así que al repetirlo
// (`again`) lo que iría junto al campo se dice en una tostada.
export async function change(
  users: Users,
  person: PersonRow,
  field: 'name' | 'email',
  value: string,
  again = false,
): Promise<string | undefined> {
  const text = value.trim();
  const result = await usersApi.change(
    person.id,
    person.version,
    field === 'name' ? { name: text || null } : { email: text },
  );
  if (!result.ok) {
    if (field === 'email' && besideEmail.includes(result.error) && !again) return result.error;
    if (!confirmFirst(users, result, () => change(users, person, field, value, true)))
      refused(users, result, person.id);
    return undefined;
  }
  users.put(result.data.person);
  showToast(changedSaying(person, field, text), 'check');
  return undefined;
}

const changedSaying = (person: PersonRow, field: 'name' | 'email', text: string) =>
  field === 'email'
    ? doneTexts.emailSaved
    : text
      ? doneTexts.nameSaved
      : doneTexts.nameCleared(person.neverSignedIn);

// Borrar, solo a quien nunca entró, sin confirmación (R3.7).
export async function remove(users: Users, person: PersonRow) {
  const result = await usersApi.remove(person.id, person.version);
  if (!result.ok) return refused(users, result, person.id);
  users.select(undefined);
  users.drop(person.id);
  showToast(doneTexts.deleted(person.email), 'trash-2');
}

// Dar de baja (con confirmación, R4.1): se le cierra todo, así que sus cantidades quedan en cero.
export async function deactivate(users: Users, person: PersonRow) {
  const result = await usersApi.deactivate(person.id, person.version);
  users.close();
  if (!result.ok) return refused(users, result, person.id);
  users.put(result.data.person);
  users.patch(person.id, { sessions: 0, phones: 0 });
  users.select(person.id);
  showToast(doneTexts.deactivated(person.displayName), 'user-x');
}

export async function activate(users: Users, person: PersonRow) {
  const result = await usersApi.activate(person.id, person.version);
  if (!result.ok) {
    if (!confirmFirst(users, result, () => activate(users, person)))
      refused(users, result, person.id);
    return;
  }
  users.put(result.data.person);
  showToast(doneTexts.activated(person.displayName), 'user-check');
}

// «Cerrar», sin confirmación (R5.3).
export async function closeSession(users: Users, person: PersonRow, session: SessionRow) {
  const result = await usersApi.closeSession(person.id, session.id);
  if (!result.ok) return refused(users, result);
  users.recount(person.id, result.data.closed, 0);
  await users.loadAccess(person.id);
  showToast(
    result.data.closed ? doneTexts.sessionClosed(session.deviceLabel) : doneTexts.nothingToClose,
    'log-out',
  );
}

// «Cerrar todas», con confirmación (R5.4).
export async function closeAll(users: Users, person: PersonRow) {
  const result = await usersApi.closeAll(person.id);
  users.close();
  if (!result.ok) return refused(users, result);
  users.recount(person.id, result.data.closed, 0);
  await users.loadAccess(person.id);
  showToast(doneTexts.closedAll(result.data.closed), 'log-out');
}

// «Quitar» un celular con huella, sin confirmación (R5.6).
export async function removePhone(users: Users, person: PersonRow, phoneId: string) {
  const result = await usersApi.cut(person.id, phoneId, 'card');
  if (!result.ok) return refused(users, result);
  const { sessions, passkey } = result.data;
  users.recount(person.id, sessions, passkey ? 1 : 0);
  await users.loadAccess(person.id);
  if (!sessions && !passkey) showToast(doneTexts.nothingToCut, 'smartphone');
  else showToast(doneTexts.phoneRemoved(sessions > 0), 'fingerprint');
}
