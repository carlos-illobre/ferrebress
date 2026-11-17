// Los atajos de Anomalías (06 · pantalla 2): reintentar sin conexión y marcar revisada la elegida (la
// que tiene el cursor; se recorren con las flechas y Enter abre su detalle, la navegación).
import { defineShortcuts } from '@ferrebress/keyboard';
import type { Anomalies } from '../anomalies.ts';

export const shortcuts = defineShortcuts<Anomalies>('anomalies', {
  retry: (model) => (model.failed || !(model.fresh && model.online)) && model.retry(),
  review: (model) =>
    !!model.chosenOne &&
    model.chosenOne.status === 'open' &&
    model.live &&
    void model.review(model.chosenOne),
});
