// Lo que hacen los botones de la pantalla del rol (02 · R7.3, R7.13): guardar todo junto en un solo
// pedido y borrar. Lo que el servidor rechaza vuelve como los errores del borrador, para mostrarlo en
// su lugar; los que no son de un lugar (sin conexión, otro motivo) los dice un aviso.

import type { RoleResponse } from '@ferrebress/shared/contracts/roles';
import { api } from '../../../platform/server/api.ts';
import { type Draft, type DraftErrors, toRequest } from './draft.ts';

export type SaveOutcome =
  | { ok: true; id: string }
  | { ok: false; kind: 'confirm-first' }
  | { ok: false; kind: 'changed' }
  | { ok: false; kind: 'errors'; errors: DraftErrors }
  | { ok: false; kind: 'other'; error: string };

const at = (id: string) => `/api/roles/${encodeURIComponent(id)}`;

// Un rechazo del servidor, en el lugar que corresponde (diseño de 02, § 18).
function placed(error: string, detail: Record<string, unknown>): DraftErrors | undefined {
  const userId = detail.userId as string | undefined;
  if (error === 'role-name-taken') return { name: 'role-name-taken' };
  if (error === 'self') return { self: detail.permission as 'roles.manage' | 'users.manage' };
  if (userId && (error === 'no-roles' || error === 'person-inactive' || error === 'person-missing'))
    return { people: { [userId]: error } };
  return undefined;
}

export async function saveDraft(draft: Draft): Promise<SaveOutcome> {
  const result = await api<RoleResponse>(draft.id ? at(draft.id) : '/api/roles', toRequest(draft));
  if (result.ok) return { ok: true, id: result.data.role.id };
  const { error, ...detail } = result;
  if (error === 'confirm-first') return { ok: false, kind: error };
  if (error === 'changed') return { ok: false, kind: error };
  const errors = placed(error, detail);
  return errors ? { ok: false, kind: 'errors', errors } : { ok: false, kind: 'other', error };
}

export async function removeRole(role: { id: string; version: number }) {
  return api<{ removed: true }>(`${at(role.id)}/delete`, { version: role.version });
}
