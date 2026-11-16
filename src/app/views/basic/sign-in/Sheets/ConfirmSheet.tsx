// Volver a confirmar quién es sin salir (02 · R3.8; diseño de 02, § 13): autorizar a alguien y dar de
// alta lo piden si la entrada con Google o la huella fue hace más de 5 minutos. Lo abre otro módulo
// con lo que hay que repetir; al confirmar, se cierra y lo repite solo. Google, con su botón en su
// propio marco, como en la entrada; la huella, solo en un celular que la tiene.
import { useEffect, useRef } from 'preact/hooks';
import {
  confirmTexts,
  googleFramePath,
  texts,
  useConfirm,
} from '../../../../modules/sign-in/model.ts';
import { Button } from '../../../../ui/button/Button.tsx';
import { Dialog } from '../../../../ui/dialog/Dialog.tsx';
import { Icon } from '../../../../ui/icon/Icon.tsx';
import './confirm.css';

const t = confirmTexts;

// `what`: lo que da lo que se va a guardar, en palabras, para que no pase escondido (02 · R3.8).
type Props = { onConfirmed: () => unknown; onClose: () => void; what?: string[] };

// El botón de Google, que lo dibuja Google en su propio marco.
function GoogleConfirm({ show }: { show: (element: HTMLIFrameElement) => () => void }) {
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => show(frame.current as HTMLIFrameElement), []);
  return <iframe ref={frame} class="confirm-google" src={googleFramePath} title={texts.google} />;
}

export function ConfirmSheet({ onConfirmed, onClose, what = [] }: Props) {
  const confirm = useConfirm(onConfirmed, onClose);
  return (
    <Dialog label={t.title} className="confirm-sheet">
      <span class="confirm-icon" aria-hidden="true">
        <Icon name="shield-check" size="large" />
      </span>
      <h2>{t.title}</h2>
      <p>{t.lead}</p>
      {what.length > 0 && (
        <ul class="confirm-what" data-private="">
          {what.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      )}
      <GoogleConfirm show={confirm.showGoogle} />
      {confirm.canPasskey && (
        <Button look="dark" icon="fingerprint" doing={t.checking} onPress={confirm.withPasskey}>
          {t.passkey}
        </Button>
      )}
      {confirm.failed && (
        <p class="confirm-failed" role="alert">
          {t.failed}
        </p>
      )}
      <Button look="plain" doing={t.cancel} onPress={onClose} closes>
        {t.cancel}
      </Button>
    </Dialog>
  );
}
