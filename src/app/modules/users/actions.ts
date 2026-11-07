// Lo que hace cada botón de Usuarios: llama al servidor, pone la lista y la tarjeta como quedaron
// y lo dice con una tostada (maquetas de 02). Un rechazo lo atiende `refused`, salvo los del correo,
// que se devuelven para avisarlos junto al campo (R3.3).
import type {
  CutResponse,
  PersonRow,
  PhoneRow,
  SessionRow,
} from '@ferrebress/shared/contracts/users';
import { showToast } from '../../ui/toast/Toast.tsx';
import * as access from '../sign-in/index.ts';
import { usersApi } from './api.ts';
import { deviceOf } from './logic.ts';
import { confirmOrRefuse, refused } from './refusals.ts';
import type { Users } from './state.ts';
import { doneTexts } from './texts.ts';

// Los rechazos que se dicen junto al campo del correo, sin tostada.
const besideEmail = ['email-taken', 'bad-request'];

// `again`: lo que repite el pedido después de confirmar quién es, con el diálogo todavía abierto,
// así un correo repetido se dice junto al campo (R3.3).
export async function authorize(
  users: Users,
  given: { name: string; email: string; roles: string[] },
  again: () => unknown,
): Promise<string | undefined> {
  const result = await usersApi.authorize(given.email.trim(), given.name.trim(), given.roles);
  if (!result.ok) {
    if (besideEmail.includes(result.error)) return result.error;
    confirmOrRefuse(users, result, again);
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
    confirmOrRefuse(users, result, () => change(users, person, field, value, true), person.id);
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
  if (!result.ok)
    return void confirmOrRefuse(users, result, () => activate(users, person), person.id);
  users.put(result.data.person);
  showToast(doneTexts.activated(person.displayName), 'user-check');
}

// «Cerrar», «Cerrar todas» y «Quitar», con la lógica común (sign-in, diseño de 04b, § 5); acá se
// ponen al día las cuentas de la lista y la tarjeta.
const then = <T>(users: Users, id: string, counts: (data: T) => [number, number]) => ({
  refuse: (result: access.Refused) => refused(users, result),
  update: async (data: T) => {
    users.recount(id, ...counts(data));
    await users.loadAccess(id);
  },
});

// «Cerrar», sin confirmación (R5.3).
export const closeSession = (users: Users, person: PersonRow, session: SessionRow) =>
  access.closeSession(
    { userId: person.id },
    { id: session.id, device: deviceOf(session) },
    then(users, person.id, ({ closed }: { closed: number }) => [closed, 0]),
  );

// «Cerrar todas», con confirmación (R5.4).
export function closeAll(users: Users, person: PersonRow) {
  users.close();
  return access.closeAllSessions(
    { userId: person.id },
    then(users, person.id, ({ closed }: { closed: number }) => [closed, 0]),
  );
}

// «Quitar» un celular con huella, sin confirmación (R5.6). El que se está usando, en la tarjeta
// propia, como en Configuración: sigue adentro, sin huella ni «Trabajar sin conexión» (04 · R6.2).
export function removePhone(users: Users, person: PersonRow, phone: PhoneRow) {
  const counts = then(users, person.id, (cut: CutResponse) => [cut.sessions, cut.passkey ? 1 : 0]);
  return phone.here
    ? access.removeHere(counts)
    : access.cutPhone({ userId: person.id }, { key: phone.id, how: 'remove' }, counts);
}
