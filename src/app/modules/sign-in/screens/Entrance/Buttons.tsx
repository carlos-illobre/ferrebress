// Los botones para entrar del celular: la huella (R2.2) y «Escanear código QR»
// (R2.7). El de Google, en los dos anchos, está aparte (google/GoogleButton.tsx).
import { Icon, type IconName } from '../../../../ui/icon/Icon.tsx';
import { withOfflinePasskey } from '../../offline/enter.ts';
import { texts } from '../../texts.ts';
import { withPasskey } from '../../useSignIn.ts';
import { fingerOff, offline, useEntrance } from './context.ts';

// En el celular, cada forma de entrar es un círculo con su ícono y debajo qué es: todo es el botón.
function RoundWay({
  kind,
  icon,
  title,
  detail,
  off,
  onPress,
}: {
  kind: 'finger' | 'scan';
  icon: IconName;
  title: string;
  detail: string;
  off: boolean;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      class={`round-way ${kind}${off ? ' off' : ''}`}
      disabled={off}
      onClick={onPress}
    >
      <span class="round-way-circle">
        <Icon name={icon} stroke={kind === 'finger' ? 1.3 : 1.6} />
      </span>
      <strong>{title}</strong>
      <small>{detail}</small>
    </button>
  );
}

export function FingerButton() {
  const entrance = useEntrance();
  return (
    <RoundWay
      kind="finger"
      icon="fingerprint-arches"
      title={texts.finger}
      detail={texts.fingerDetail}
      off={fingerOff(entrance)}
      onPress={() => entrance.attempt(entrance.online ? withPasskey : withOfflinePasskey)}
    />
  );
}

export function ScanButton() {
  const entrance = useEntrance();
  return (
    <RoundWay
      kind="scan"
      icon="scan-frame"
      title={texts.scan}
      detail={texts.scanDetail}
      off={offline(entrance)}
      onPress={entrance.scan}
    />
  );
}
