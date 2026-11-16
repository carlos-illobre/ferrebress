// Los atajos de la confirmación de desvincular (03 · R5): cancelar o desvincular.
import { defineShortcuts } from '@ferrebress/keyboard';
import type { LinkDetail } from '../detail/useLinkDetail.ts';

export const shortcuts = defineShortcuts<LinkDetail>('link-unpair', {
  cancel: (model) => model.cancelUnpair(),
  unpair: (model) => void model.unpair(),
});
