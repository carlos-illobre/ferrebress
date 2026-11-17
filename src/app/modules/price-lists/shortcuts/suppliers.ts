// Los atajos de Catálogo → Listas (08 · pantalla 1): subir una lista, dar de alta un proveedor y
// reintentar sin
// conexión. El buscador se alcanza con «/» y los proveedores se recorren con las flechas (la
// navegación).
import { defineShortcuts } from '@ferrebress/keyboard';
import type { Suppliers } from '../suppliers/suppliers.ts';

export const shortcuts = defineShortcuts<Suppliers>('price-lists-suppliers', {
  retry: (model) => (model.failed || !model.live) && model.retry(),
  add: (model) => model.canAdd && !model.adding && model.startAdding(),
  upload: (model) => model.canUpload && model.pick(),
});
