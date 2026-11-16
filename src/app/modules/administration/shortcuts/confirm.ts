// Los atajos de la confirmación del redondeo (06 · R3.4): cambiar los precios o cancelar; si el
// recálculo falló, reintentar o dejarlo para después.
import { defineShortcuts } from '@ferrebress/keyboard';
import type { Administration } from '../useAdministration.ts';

const failed = (model: Administration) => !!model.asked?.failed;

export const shortcuts = defineShortcuts<Administration>('administration-confirm', {
  confirm: (model) => !failed(model) && model.confirmStep(),
  cancel: (model) => !failed(model) && model.cancel(),
  retry: (model) => failed(model) && model.confirmStep(),
  later: (model) => failed(model) && model.cancel(),
});
