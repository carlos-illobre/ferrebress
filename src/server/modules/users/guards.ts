// Lo que comparten las rutas de las personas y las de los roles: el límite de cambios por sesión, el
// estado HTTP de cada rechazo, en una sola tabla completa, y si se confirmó quién es hace poco.
import type { UsersErrorCode } from '@ferrebress/shared/contracts/errors';
import type { Context } from 'hono';
import { createGuards } from '../../platform/guards.ts';
import type { Platform } from '../../platform/modules.ts';
import { sessionOf } from '../../platform/session.ts';
import { usersSettings } from './settings.ts';

export type Rejection = UsersErrorCode | 'not-found' | 'bad-request' | 'forbidden';

// Cada rechazo tiene el suyo: uno nuevo no compila hasta que se lo agrega acá.
export const statusOf: Record<Rejection, 400 | 403 | 404 | 409> = {
  'not-found': 404,
  'bad-request': 400,
  'no-roles': 400,
  forbidden: 403,
  'confirm-first': 403,
  outranked: 403,
  'email-taken': 409,
  'already-entered': 409,
  self: 409,
  'last-administrator': 409,
  changed: 409,
  'role-name-taken': 409,
  'role-in-use': 409,
  'system-role': 409,
  'too-many-roles': 409,
  'person-inactive': 409,
  'person-missing': 409,
};

// Las marcas comunes de una ruta de Usuarios: anotar y frenar con el tema `users`, y el límite de
// cambios por sesión como paso.
export function usersGuards(platform: Platform) {
  const guards = createGuards(platform, { topic: 'users', window: usersSettings.throttledAudit });
  const limited = guards.limit((c) => [`users:session:${sessionOf(c).id}`], usersSettings.changes);
  return { guards, limited };
}

// R3.8: con Google o la huella de los últimos minutos.
export function confirmed(platform: Platform, c: Context) {
  const at = sessionOf(c).confirmedAt;
  return !!at && platform.clock.now().getTime() - at.getTime() < usersSettings.confirmWithinMs;
}
