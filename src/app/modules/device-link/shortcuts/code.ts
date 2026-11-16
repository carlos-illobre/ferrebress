// El atajo del código para vincular (03 · R1.3): volver al detalle.
import { defineShortcuts } from '@ferrebress/keyboard';
import type { LinkDetail } from '../detail/useLinkDetail.ts';

export const shortcuts = defineShortcuts<LinkDetail>('link-code', {
  back: (model) => model.code?.back(),
});
