// El atajo de «Hay que actualizar para seguir» (00 · R5.5): actualizar. La tecla está en
// keyboard/shortcuts/keymap.ts.
import { defineShortcuts } from '@ferrebress/keyboard';
import type { useUpdateRequired } from '../notices-model.ts';

export const shortcuts = defineShortcuts<ReturnType<typeof useUpdateRequired>>('update-required', {
  update: (model) => model.update(),
});
