// Lo que puede hacer quien mira en Usuarios, según sus permisos.
import { can } from '@ferrebress/shared/contracts/can';
import type { PersonRow } from '@ferrebress/shared/contracts/users';
import { useStore } from '../../platform/store.ts';
import { person as me } from '../sign-in/index.ts';

// Lo que puede hacer quien mira (R7.7, R7.11): lo demás no aparece; el servidor igual lo rechaza.
export function useMay() {
  const who = useStore(me);
  const has = (id: Parameters<typeof can>[1]) => can(who, id);
  const over = (target: PersonRow) => !target.outranks;
  return {
    authorize: has('users.manage') && has('roles.manage'),
    manage: has('users.manage'),
    // Cambiar el correo, dar de baja y de alta: no sobre quien tiene más.
    manageOver: (target: PersonRow) => has('users.manage') && over(target),
    cutOver: (target: PersonRow) => has('users.cut') && over(target),
    cut: has('users.cut'),
    roles: has('roles.manage'),
    audit: has('audit-log.view'),
  };
}
