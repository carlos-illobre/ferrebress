// Desvincular pide confirmación (R5.3): un diálogo al centro en la computadora, una hoja en el
// celular. Alt C cancela y Alt X desvincula; el cursor arranca en «Desvincular».
import type { Side } from '@ferrebress/shared/contracts/pairing';
import { Button } from '../../../../ui/button/Button.tsx';
import { Dialog } from '../../../../ui/dialog/Dialog.tsx';
import { detailTexts } from '../Detail/texts.ts';

type Props = { side: Side; other: string; onCancel: () => void; onUnpair: () => Promise<unknown> };

export function ConfirmUnpair({ side, other, onCancel, onUnpair }: Props) {
  const t = detailTexts.unpair;
  return (
    <Dialog label={t.title[side]} className="link-confirm">
      <h2>{t.title[side]}</h2>
      <p>
        <b>{other}</b> {t.detail[side]}
      </p>
      <div class="link-confirm-foot">
        <Button shortcut="c" closes doing={t.cancel} onPress={onCancel}>
          {t.cancel}
        </Button>
        <Button look="red" icon="unlink" shortcut="x" primary doing={t.yes} onPress={onUnpair}>
          {t.yes}
        </Button>
      </div>
    </Dialog>
  );
}
