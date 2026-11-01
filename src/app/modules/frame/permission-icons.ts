// El ícono de cada permiso y de cada parte (02 · R7.1): el mismo en «Sin permiso» y en la pestaña
// Roles (maqueta users-roles/final).
import type { PermissionGroup, PermissionId } from '@ferrebress/shared/contracts/permissions';
import type { IconName } from '../../ui/icon/Icon.tsx';

export const permissionIcons: Record<PermissionId, IconName> = {
  'users.view': 'eye',
  'users.manage': 'user-cog',
  'users.cut': 'scissors',
  'roles.manage': 'shield',
  'offline.work': 'wifi-off',
};

export const groupIcons: Record<PermissionGroup, IconName> = {
  users: 'users',
  offline: 'wifi-off',
};
