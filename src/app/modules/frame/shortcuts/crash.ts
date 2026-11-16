// Los atajos de «Algo salió mal» (00 · R9.5): seguir sin avisar y avisar y seguir. Las teclas están
// en keyboard/shortcuts/keymap.ts.
import { defineShortcuts } from '@ferrebress/keyboard';
import type { useCrash } from '../notices-model.ts';

export const shortcuts = defineShortcuts<ReturnType<typeof useCrash>>('crash', {
  goOn: (model) => model.close(),
  report: (model) => model.report(),
});
