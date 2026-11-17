// Los atajos de ver qué cambia (08 · pantalla 3): aplicar, descartar y reintentar sin conexión. ↑ ↓
// recorren el detalle y Enter abre la cuenta del costo elegido (la navegación).
import { defineShortcuts } from '@ferrebress/keyboard';
import type { Review } from '../review/review.ts';

export const shortcuts = defineShortcuts<Review>('price-lists-review', {
  retry: (model) => (model.failed || !model.live) && model.retry(),
  apply: (model) => model.canApply && void model.apply(),
  discard: (model) => model.canDiscard && void model.discard(),
});
