// Los botones para entrar: Google en los dos anchos (R2.1, R7.1) y, en el celular, la huella (R2.3)
// y «Escanear el código de la computadora» (R2.7). El de Google lo dibuja Google en su propio marco
// (google/messages.ts), que aparece cuando quedó dibujado; si Google no carga, el lugar queda vacío.
import { useEffect, useRef, useState } from 'preact/hooks';
import { Icon } from '../../../../ui/icon/Icon.tsx';
import { connectGoogleFrame } from '../../google/connect.ts';
import { googleFramePath } from '../../google/messages.ts';
import { texts } from '../../texts.ts';
import { withGoogle, withPasskey } from '../../useSignIn.ts';
import { limited, offline, useEntrance } from './context.ts';

export function GoogleButton() {
  const entrance = useEntrance();
  const frame = useRef<HTMLIFrameElement>(null);
  const connection = useRef<ReturnType<typeof connectGoogleFrame>>(undefined);
  const [drawn, setDrawn] = useState(false);
  const attempt = useRef(entrance.attempt);
  attempt.current = entrance.attempt;
  const signInFirst = useRef(entrance.signInFirst);
  signInFirst.current = entrance.signInFirst;
  const { googleClientId, googleNonce, googleScriptUrl } = entrance.start;
  useEffect(() => {
    const opened = connectGoogleFrame(frame.current as HTMLIFrameElement, {
      drawn: () => setDrawn(true),
      credential: (credential) =>
        attempt.current(() => withGoogle(credential, !signInFirst.current)),
    });
    connection.current = opened;
    return opened.stop;
  }, []);
  useEffect(() => {
    const element = frame.current as HTMLIFrameElement;
    if (!googleNonce) return;
    connection.current?.show({
      scriptUrl: googleScriptUrl,
      clientId: googleClientId,
      nonce: googleNonce,
      width: Math.min(400, element.clientWidth || 400),
    });
  }, [googleClientId, googleNonce]);
  return (
    <div class={limited(entrance) ? 'google off' : 'google'} data-drawn={drawn ? '' : undefined}>
      <iframe ref={frame} src={googleFramePath} title={texts.google} />
    </div>
  );
}

export function FingerButton() {
  const entrance = useEntrance();
  const off = limited(entrance);
  return (
    <button
      type="button"
      class={off ? 'finger off' : 'finger'}
      disabled={off}
      onClick={() => entrance.attempt(withPasskey)}
    >
      <Icon name="fingerprint" stroke={1.8} />
      <span>
        <strong>{texts.finger}</strong>
        <small>{texts.fingerDetail}</small>
      </span>
    </button>
  );
}

export function ScanButton() {
  const entrance = useEntrance();
  const off = offline(entrance);
  return (
    <button type="button" class={off ? 'scan off' : 'scan'} disabled={off} onClick={entrance.scan}>
      <Icon name="scan-qr" stroke={1.8} />
      <span>
        <strong>{texts.scan}</strong>
        <small>{texts.scanDetail}</small>
      </span>
    </button>
  );
}
