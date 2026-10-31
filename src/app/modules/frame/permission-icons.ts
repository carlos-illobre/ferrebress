// El ícono de cada permiso (02 · R7.1): el mismo en «Sin permiso» y en la pestaña Roles.
import type { PermissionId } from '@ferrebress/shared/contracts/permissions';
import type { IconName } from '../../ui/icon/Icon.tsx';

export const permissionIcons: Record<PermissionId, IconName> = {
  'users.view': 'eye',
  'users.manage': 'users',
  'users.cut': 'ban',
  'roles.manage': 'shield',
  'offline.work': 'wifi-off',
};
