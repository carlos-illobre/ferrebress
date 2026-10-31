import type { PermissionId } from '@ferrebress/shared/contracts/permissions';
import type { IconName } from '../../ui/icon/Icon.tsx';

// El ícono de cada permiso, el mismo en la pestaña Roles.
export const permissionIcons: Record<PermissionId, IconName> = {
  'users.view': 'eye',
  'users.manage': 'users',
  'users.cut': 'ban',
  'roles.manage': 'shield',
  'offline.work': 'wifi-off',
};
