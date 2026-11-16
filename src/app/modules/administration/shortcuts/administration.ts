// Los atajos de Administración (06 · R1.8, 00 · R2.8): elegir cada ajuste y reintentar. Las teclas
// están en keyboard/shortcuts/keymap.ts.
import { defineShortcuts } from '@ferrebress/keyboard';
import type { Administration } from '../useAdministration.ts';

// «Reintentar» está solo si lo que se ve no está al día (sin conexión, o falló el pedido).
const stale = (model: Administration) => model.failed || !(model.fresh && model.online);

export const shortcuts = defineShortcuts<Administration>('administration', {
  retry: (model) => stale(model) && model.retry(),
  roundingStep: (model) => !!model.data && model.choose('roundingStep'),
  quickMargins: (model) => !!model.data && model.choose('quickMargins'),
  zone: (model) => !!model.data && model.choose('zone'),
  sessionIdle: (model) => !!model.data && model.choose('session'),
  sessionMax: (model) => !!model.data && model.choose('session'),
  pairingDays: (model) => !!model.data && model.choose('pairingDays'),
});
