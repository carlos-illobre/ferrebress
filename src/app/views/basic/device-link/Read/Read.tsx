// Leer el código para vincular, en el celular (R1.3 a R1.7): la cámara común, lo que dice el servidor
// y, si alguno ya estaba vinculado, la pregunta de reemplazar. Lo que no vincula lo dice en una hoja,
// sin ofrecer cambiar de cuenta (R1.6); un código vencido ofrece leer el nuevo (E04).
import type { PairingView } from '@ferrebress/shared/contracts/pairing';
import { detailTexts, useReadCode } from '../../../../modules/device-link/model.ts';
import { Button } from '../../ui/button/Button.tsx';
import { Camera } from '../../ui/camera/Camera.tsx';
import { Dialog } from '../../ui/dialog/Dialog.tsx';

type Props = {
  code: string | undefined;
  onPaired: (pairing: PairingView) => void;
  onClose: () => void;
};

const notices = {
  'other-account': detailTexts.reading.otherAccount,
  expired: detailTexts.reading.expired,
  offline: detailTexts.reading.offline,
  failed: detailTexts.reading.failed,
};

function Replace({
  was,
  onYes,
  onNo,
}: {
  was: string | undefined;
  onYes: () => unknown;
  onNo: () => void;
}) {
  const t = detailTexts.replace;
  const title = was ? t.phone(was) : t.computer;
  return (
    <Dialog label={title} className="link-confirm">
      <h2>{title}</h2>
      <p>{t.detail}</p>
      <div class="link-confirm-foot">
        <Button look="plain" closes doing={t.cancel} onPress={onNo}>
          {t.cancel}
        </Button>
        <Button look="action" primary doing={t.yes} onPress={onYes}>
          {t.yes}
        </Button>
      </div>
    </Dialog>
  );
}

function Notice({
  kind,
  onAgain,
  onClose,
}: {
  kind: keyof typeof notices;
  onAgain: () => void;
  onClose: () => void;
}) {
  const t = detailTexts.reading;
  const notice = notices[kind];
  return (
    <Dialog label={notice.title} className="link-confirm">
      <h2>{notice.title}</h2>
      <p>{notice.detail}</p>
      <div class="link-confirm-foot">
        {kind === 'expired' ? (
          <>
            <Button look="plain" closes doing={t.cancel} onPress={onClose}>
              {t.cancel}
            </Button>
            <Button look="action" icon="scan-qr-code" primary doing={t.again} onPress={onAgain}>
              {t.again}
            </Button>
          </>
        ) : (
          <Button primary closes doing={t.ok} onPress={onClose}>
            {t.ok}
          </Button>
        )}
      </div>
    </Dialog>
  );
}

export function Read({ code, onPaired, onClose }: Props) {
  const reading = useReadCode(code, onPaired);
  const { step } = reading;
  if (step.kind === 'camera')
    return (
      <Camera
        texts={detailTexts.camera}
        read={reading.codeOf}
        onCode={reading.read}
        onClose={onClose}
      />
    );
  if (step.kind === 'asking') return null;
  if (step.kind === 'replace')
    return <Replace was={step.was} onNo={onClose} onYes={reading.replace} />;
  return <Notice kind={step.kind} onAgain={reading.again} onClose={onClose} />;
}
