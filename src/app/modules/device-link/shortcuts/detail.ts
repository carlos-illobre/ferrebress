// Los atajos de lo que abre el indicador del vínculo (03 · R4.2, 00 · R2.8): las acciones del detalle
// según su estado, cerrar, volver desde el código y la confirmación de desvincular. Las teclas están
// en keyboard/shortcuts/keymap.ts.
import { defineShortcuts } from '@ferrebress/keyboard';
import { type Act, choicesOf } from '../detail/choices.ts';
import type { LinkDetail } from '../detail/useLinkDetail.ts';
import { onPhone } from '../view.ts';

// Solo las acciones que el detalle muestra ahora; «Probar» no mientras se prueba.
const choice = (act: Act) => (model: LinkDetail) =>
  choicesOf(model.view, onPhone(model.view)).some((one) => one.act === act) &&
  !(act === 'probe' && model.view.probe === 'trying') &&
  void model.act(act);

export const shortcuts = defineShortcuts<LinkDetail>('link-detail', {
  probe: choice('probe'),
  pause: choice('pause'),
  resume: choice('resume'),
  pair: choice('pair'),
  unpair: choice('unpair'),
  close: (model) => model.close(),
});
