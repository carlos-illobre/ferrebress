// El atajo de «¿Descartar los cambios del rol?» (02 · R7.13, E64): descartar. «Seguir editando» es
// Esc, de la navegación. La tecla está en keyboard/shortcuts/keymap.ts.
import { defineShortcuts } from '@ferrebress/keyboard';
import type { RoleScreenModel } from '../roles/useRole.ts';

export const shortcuts = defineShortcuts<RoleScreenModel>('role-discard', {
  discard: (model) => model.leave(),
});
