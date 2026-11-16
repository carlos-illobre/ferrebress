// Los atajos de la lista de roles (02 · R7.12, 00 · R2.8): un rol nuevo. Las teclas están en
// keyboard/shortcuts/keymap.ts.
import { defineShortcuts } from '@ferrebress/keyboard';
import type { RoleListModel } from '../roles/useRoles.ts';

export const shortcuts = defineShortcuts<RoleListModel>('users-roles', {
  newRole: (model) => model.online && model.openNew(),
});
