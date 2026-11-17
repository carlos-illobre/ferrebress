// Los atajos de Archivos de listas (06 · pantalla 3): reintentar sin conexión y borrar el archivo
// elegido (el que tiene el cursor; los archivos se recorren con las flechas, la navegación).
import { defineShortcuts } from '@ferrebress/keyboard';
import type { ListFiles } from '../admin/files.ts';

export const shortcuts = defineShortcuts<ListFiles>('price-lists-files', {
  retry: (model) => (model.failed || !(model.fresh && model.online)) && model.retry(),
  remove: (model) => model.editable && !!model.chosenFile && void model.remove(model.chosenFile),
});
