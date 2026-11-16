// El atajo de «Sin permiso» (02 · R7.7): copiar el pedido. La tecla está en
// keyboard/shortcuts/keymap.ts.
import { defineShortcuts } from '@ferrebress/keyboard';
import type { NoPermissionModel } from '../permission.ts';

export const shortcuts = defineShortcuts<NoPermissionModel>('no-permission', {
  copy: (model) => model.copy(),
});
