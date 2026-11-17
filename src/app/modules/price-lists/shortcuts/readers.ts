// Los atajos de Lectores (08 · pantalla 5): reintentar sin conexión. El buscador se alcanza con «/» y
// los lectores se recorren con las flechas (la navegación).
import { defineShortcuts } from '@ferrebress/keyboard';
import type { Readers } from '../readers.ts';

export const shortcuts = defineShortcuts<Readers>('price-lists-readers', {
  retry: (model) => (model.failed || !(model.fresh && model.online)) && model.retry(),
});
