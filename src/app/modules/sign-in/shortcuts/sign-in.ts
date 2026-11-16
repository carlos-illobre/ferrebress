// Los atajos de la entrada (01 · R7.1, R7.2): «Ver el manual», en la computadora y con conexión, y
// «Reintentar» el botón de Google cuando no cargó.
import { defineShortcuts } from '@ferrebress/keyboard';
import type { EntranceModel } from '../entrance.ts';

export const shortcuts = defineShortcuts<EntranceModel>('sign-in', {
  manual: (model) => !model.phone && model.state.online && model.openManual(),
  retryGoogle: (model) => model.google.phase === 'failed' && model.google.again(),
});
