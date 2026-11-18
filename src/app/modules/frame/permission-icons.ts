// El ícono de cada permiso y de cada parte (02 · R7.1): el mismo en «Sin permiso» y en la pestaña
// Roles (maqueta users-roles/final).
import type { PermissionGroup, PermissionId } from '@ferrebress/shared/contracts/permissions';
import type { IconName } from '../../platform/view/icon-name.ts';

export const permissionIcons: Record<PermissionId, IconName> = {
  'users.view': 'eye',
  'users.manage': 'user-cog',
  'users.cut': 'scissors',
  'roles.manage': 'shield',
  'audit-log.view': 'file-text',
  'offline.work': 'wifi-off',
  'settings.change': 'sliders-horizontal',
  'anomalies.review': 'triangle-alert',
  'price-lists.costs': 'tag',
  'price-lists.suppliers': 'store',
  'price-lists.load': 'package',
  'catalog.margins': 'badge-percent',
  'catalog.products': 'ruler',
};

export const groupIcons: Record<PermissionGroup, IconName> = {
  users: 'users',
  offline: 'wifi-off',
  catalog: 'tags',
  administration: 'sliders-horizontal',
};
