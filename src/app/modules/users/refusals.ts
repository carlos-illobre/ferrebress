// Lo que se hace con un rechazo del servidor en Usuarios: pedir confirmar quién es y repetir, poner
// la persona como quedó o sacarla, y decirlo con su texto.
import type { PersonRow } from '@ferrebress/shared/contracts/users';
import type { ApiResult } from '../../platform/server/api.ts';
import { showToast } from '../../ui/toast/Toast.tsx';
import type { Users } from './state.ts';
import { refusalTexts, somethingFailed } from './texts.ts';

type Failed = Extract<ApiResult<unknown>, { ok: false }>;

// Autorizar y dar de alta pueden pedir confirmar quién es (R3.8): se abre la hoja, que al confirmar
// repite lo que se estaba haciendo. Dice si era eso.
function confirmFirst(users: Users, result: Failed, retry: () => unknown): boolean {
  if (result.error !== 'confirm-first') return false;
  users.askToConfirm(retry);
  return true;
}

// Cualquier otro rechazo: con una versión vieja, la persona como quedó; si ya no está (`target`: en
// las rutas de una sesión o un celular, un 404 puede ser solo de ellos), se saca; y se dice.
export function refused(users: Users, result: Failed, target?: string): void {
  const person = (result as { person?: PersonRow }).person;
  if (person) users.put(person);
  if (result.error === 'not-found' && target) {
    users.select(undefined);
    users.drop(target);
  }
  showToast(refusalText(result.error), 'triangle-alert');
}

// Lo que pide confirmar quién es abre la hoja, que al confirmar repite `again`; cualquier otro
// rechazo se atiende con `refused`. Dice si se abrió la hoja.
export function confirmOrRefuse(
  users: Users,
  result: Failed,
  again: () => unknown,
  target?: string,
): boolean {
  if (confirmFirst(users, result, again)) return true;
  refused(users, result, target);
  return false;
}

// El texto de un rechazo; uno que no tiene el suyo, el de siempre.
export const refusalText = (error: string) =>
  refusalTexts[error as keyof typeof refusalTexts] ?? somethingFailed;
