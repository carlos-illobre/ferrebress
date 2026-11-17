// Los atajos de la pantalla de un proveedor (08 · pantalla 4): uno para cada parte, subir una lista,
// agregar un descuento, mover el elegido con Alt ↑ ↓ y reintentar sin conexión.
import { defineShortcuts } from '@ferrebress/keyboard';
import type { Part, Supplier } from '../supplier/supplier.ts';

const show = (model: Supplier, part: Part) => model.parts.includes(part) && model.choose(part);
const editingTerms = (model: Supplier) => model.part === 'terms' && model.editable;

export const shortcuts = defineShortcuts<Supplier>('price-lists-supplier', {
  retry: (model) => (model.failed || !model.live) && model.retry(),
  data: (model) => show(model, 'data'),
  terms: (model) => show(model, 'terms'),
  lists: (model) => show(model, 'lists'),
  items: (model) => show(model, 'items'),
  upload: (model) => model.canUpload && model.pick(),
  addDiscount: (model) => editingTerms(model) && !model.adding && model.startAdding(),
  up: (model) =>
    editingTerms(model) &&
    !!model.chosenDiscount &&
    void model.moveDiscount(model.chosenDiscount, -1),
  down: (model) =>
    editingTerms(model) &&
    !!model.chosenDiscount &&
    void model.moveDiscount(model.chosenDiscount, 1),
});
