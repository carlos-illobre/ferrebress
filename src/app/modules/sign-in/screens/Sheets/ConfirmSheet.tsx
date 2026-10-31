// Volver a confirmar quién es sin salir (02 · R3.8; diseño de 02, § 13): autorizar a alguien y dar de
// alta lo piden si la entrada con Google o la huella fue hace más de 5 minutos. Lo abre otro módulo
// con lo que hay que repetir; al confirmar, se cierra y lo repite solo. Google, con su botón en su
// propio marco, como en la entrada; la huella, solo en un celular que la tiene.
import { useEffect, useRef, useState } from 'preact/hooks';
import { isPhone } from '../../../../platform/device/device.ts';
import { Button } from '../../../../ui/button/Button.tsx';
import { Dialog } from '../../../../ui/dialog/Dialog.tsx';
import { Icon } from '../../../../ui/icon/Icon.tsx';
import { signInApi } from '../../api.ts';
import { connectGoogleFrame } from '../../google/connect.ts';
import { googleFramePath } from '../../google/messages.ts';
import { signWithPasskey } from '../../passkeys/webauthn.ts';
import { hasPasskey } from '../../session.ts';
import { texts } from '../../texts.ts';
import { confirmTexts } from './confirm-texts.ts';
import './confirm.css';

const t = confirmTexts;

type Props = { onConfirmed: () => unknown; onClose: () => void };

// El botón de Google: pide un nonce nuevo y, con el pase, confirma.
function GoogleConfirm({ confirm }: { confirm: (credential: string) => void }) {
  const frame = useRef<HTMLIFrameElement>(null);
  useEffect(() => {
    const element = frame.current as HTMLIFrameElement;
    const connection = connectGoogleFrame(element, { drawn: () => {}, credential: confirm });
    void signInApi.start().then((start) => {
      if (!start.ok || !start.data.googleNonce) return;
      connection.show({
        scriptUrl: start.data.googleScriptUrl,
        clientId: start.data.googleClientId,
        nonce: start.data.googleNonce,
        width: Math.min(320, element.clientWidth || 320),
        theme: 'filled_blue',
      });
    });
    return connection.stop;
  }, []);
  return <iframe ref={frame} class="confirm-google" src={googleFramePath} title={texts.google} />;
}

async function withPasskey(): Promise<boolean> {
  const options = await signInApi.confirmPasskeyOptions();
  const response = options.ok ? await signWithPasskey(options.data) : undefined;
  return !!response && (await signInApi.confirmPasskey(response)).ok;
}

export function ConfirmSheet({ onConfirmed, onClose }: Props) {
  const [failed, setFailed] = useState(false);
  const done = async (ok: boolean) => {
    setFailed(!ok);
    if (ok) {
      onClose();
      await onConfirmed();
    }
  };
  return (
    <Dialog label={t.title} className="confirm-sheet">
      <span class="confirm-icon" aria-hidden="true">
        <Icon name="shield-check" size="large" />
      </span>
      <h2>{t.title}</h2>
      <p>{t.lead}</p>
      <GoogleConfirm
        confirm={(credential) =>
          void signInApi.confirmGoogle(credential).then((result) => done(result.ok))
        }
      />
      {isPhone() && hasPasskey() && (
        <Button
          look="dark"
          icon="fingerprint"
          doing={t.checking}
          onPress={async () => done(await withPasskey())}
        >
          {t.passkey}
        </Button>
      )}
      {failed && (
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
