// El atajo de «Todos los pasos»: volver al paso a paso (00 · R6.7).
import { defineShortcuts } from '@ferrebress/keyboard';
import type { ManualScreen } from '../useManualScreen.ts';

export const shortcuts = defineShortcuts<ManualScreen>('manual-all-steps', {
  close: (model) => !!model.view && model.view.act({ type: 'closeAllSteps' }),
});
