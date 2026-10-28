// Los botones para entrar del celular: la huella (R2.2) y «Escanear el código de la computadora»
// (R2.7). El de Google, en los dos anchos, está aparte (google/GoogleButton.tsx).
import { Icon } from '../../../../ui/icon/Icon.tsx';
import { texts } from '../../texts.ts';
import { withPasskey } from '../../useSignIn.ts';
import { limited, offline, useEntrance } from './context.ts';

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
