// Los atajos de un rol (02 · R7.13, 00 · R2.8): volver a la lista, duplicar, borrar, guardar y
// darle el rol a alguien. Las teclas están en keyboard/shortcuts/keymap.ts.
import { defineShortcuts } from '@ferrebress/keyboard';
import type { RoleScreenModel } from '../roles/useRole.ts';

const existing = (model: RoleScreenModel) => !!model.draft.id && model.online;

export const shortcuts = defineShortcuts<RoleScreenModel>('role', {
  back: (model) => model.back(),
  duplicate: (model) => existing(model) && model.duplicate(),
  remove: (model) => existing(model) && !model.draft.system && model.remove(),
  // Sin cambios o sin conexión, guardar no hace nada (y la tecla sigue de largo).
  save: (model) => model.save(),
  giveTo: (model) => model.openPicker(),
});
