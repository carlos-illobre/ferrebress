// Los botones para entrar: Google en los dos anchos (R2.1, R7.1) y, en el celular, la huella (R2.3)
// y «Escanear el código de la computadora» (R2.7). El de Google lo dibuja Google adentro de su
// lugar; si Google no carga, queda el lugar vacío y apagado.
import { useEffect, useRef } from 'preact/hooks';
import { Icon } from '../../../../ui/icon/Icon.tsx';
import { showGoogleButton } from '../../google.ts';
import { texts } from '../../texts.ts';
import { withGoogle, withPasskey } from '../../useSignIn.ts';
import { limited, offline, useEntrance } from './context.ts';

export function GoogleButton() {
  const entrance = useEntrance();
  const place = useRef<HTMLDivElement>(null);
  const { googleClientId, googleNonce, googleScriptUrl } = entrance.start;
  useEffect(() => {
    const element = place.current as HTMLDivElement;
    if (!googleNonce) return;
    void showGoogleButton(element, {
      scriptUrl: googleScriptUrl,
      clientId: googleClientId,
      nonce: googleNonce,
      width: Math.min(400, element.clientWidth || 400),
      onCredential: (credential) => entrance.attempt(() => withGoogle(credential)),
    });
  }, [googleClientId, googleNonce]);
  return <div ref={place} class={limited(entrance) ? 'google off' : 'google'} />;
}

export function FingerButton() {
  const entrance = useEntrance();
  const off = limited(entrance);
  return (
    <button
      type="button"
      class={off ? 'finger phone-only off' : 'finger phone-only'}
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
    <button
      type="button"
      class={off ? 'scan phone-only off' : 'scan phone-only'}
      disabled={off}
      onClick={entrance.scan}
    >
      <Icon name="scan-qr" stroke={1.8} />
      <span>
        <strong>{texts.scan}</strong>
        <small>{texts.scanDetail}</small>
      </span>
    </button>
  );
}
