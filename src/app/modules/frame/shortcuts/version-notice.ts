// Los atajos de «Hay una versión nueva» (00 · R5.3, R5.4): ahora no y actualizar. Las teclas están en
// keyboard/shortcuts/keymap.ts.
import { defineShortcuts } from '@ferrebress/keyboard';
import type { useVersionNotice } from '../notices-model.ts';

export const shortcuts = defineShortcuts<ReturnType<typeof useVersionNotice>>('version-notice', {
  later: (model) => model.later(),
  update: (model) => model.update(),
});
