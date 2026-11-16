// El código para vincular, en la computadora (R1.3): el QR de /pair#<código>, que se renueva cada 60
// segundos y sirve una vez. Escucha el tema `device-link.code` solo mientras está en pantalla; cuando
// el celular lo lee, el servidor avisa por ahí con el vínculo nuevo. Alt O vuelve al detalle.
import type { PairingView } from '@ferrebress/shared/contracts/pairing';
import { detailTexts, usePairCode } from '../../../../modules/device-link/model.ts';
import { useShortcutHints } from '../../../../platform/view/shortcut-hints.ts';
import isotype from '../../styles/brand/isotype.svg';
import { Button } from '../../ui/button/Button.tsx';
import { Icon } from '../../ui/icon/Icon.tsx';
import './Code.css';

type Props = {
  other: string | undefined;
  onPaired: (pairing: PairingView) => void;
  onBack: () => void;
};

export function Code({ other, onPaired, onBack }: Props) {
  const { hasCode, qr, read, left, share } = usePairCode(onPaired);
  const keys = useShortcutHints('link-code');
  const t = detailTexts.code;
  return (
    <div class="link-code">
      <div class="link-head">
        <Button
          look="plain"
          size="small"
          icon="arrow-left"
          keyHint={keys.back}
          closes
          doing={t.back}
          onPress={onBack}
        >
          {t.back}
        </Button>
        <h2 class="link-title link-code-title">{t.title}</h2>
      </div>
      <div class={read ? 'qr-box read' : 'qr-box'} role="img" aria-label={t.qr}>
        {qr && (
          <svg
            viewBox={`0 0 ${qr.size} ${qr.size}`}
            shape-rendering="crispEdges"
            aria-hidden="true"
          >
            <path fill="#1a1d1b" d={qr.d} />
          </svg>
        )}
        <span class="qr-mark">
          <img src={isotype} alt="" />
        </span>
        <span class="qr-done" aria-hidden={!read}>
          <Icon name="check" size="huge" />
        </span>
      </div>
      <div class="qr-renews">
        <div class="qr-renews-row">
          <span>{t.once}</span>
          <span>{hasCode ? t.renews(left) : t.renewsFull}</span>
        </div>
        <div class="qr-rail">
          <b style={{ transform: `scaleX(${share})` }} />
        </div>
      </div>
      <ol class="link-steps">
        {t.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      {other && <p class="link-failed">{t.replaces(other)}</p>}
      <p class="link-waiting">
        <span class="link-dot" />
        {t.waiting}
      </p>
    </div>
  );
}
