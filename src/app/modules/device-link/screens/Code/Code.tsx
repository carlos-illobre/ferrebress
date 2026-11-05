// El código para vincular, en la computadora (R1.3): el QR de /pair#<código>, que se renueva cada 60
// segundos y sirve una vez. Escucha el tema `device-link.code` solo mientras está en pantalla; cuando
// el celular lo lee, el servidor avisa por ahí con el vínculo nuevo. Alt O vuelve al detalle.
import type { PairingView } from '@ferrebress/shared/contracts/pairing';
import { useEffect, useState } from 'preact/hooks';
import { useTopic } from '../../../../platform/realtime/use-topic.ts';
import isotype from '../../../../styles/brand/isotype.svg';
import { Button } from '../../../../ui/button/Button.tsx';
import { Icon } from '../../../../ui/icon/Icon.tsx';
import { pairUrl } from '../../pair.ts';
import { detailTexts } from '../Detail/texts.ts';
import './Code.css';

type Draw = typeof import('../../../../platform/camera/qr-draw.ts')['qrPath'];
let drawing: Promise<Draw> | undefined;

// El dibujo del código de ahora; el dibujante se baja una sola vez, con el primer código.
function useQr(code: string | undefined) {
  const [qr, setQr] = useState<{ size: number; d: string }>();
  useEffect(() => {
    if (!code) return;
    drawing ??= import('../../../../platform/camera/qr-draw.ts').then((loaded) => loaded.qrPath);
    void drawing.then((qrPath) => setQr(qrPath(pairUrl(code))));
  }, [code]);
  return qr;
}

// Los segundos que le quedan al código de ahora.
function useLeft(since: number): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  return Math.max(0, 60 - Math.floor((now - since) / 1000));
}

type Props = {
  other: string | undefined;
  onPaired: (pairing: PairingView) => void;
  onBack: () => void;
};

export function Code({ other, onPaired, onBack }: Props) {
  const [code, setCode] = useState<{ value: string; since: number }>();
  const [read, setRead] = useState(false);
  useTopic('device-link.code', {
    onEvent: (data) => {
      const event = data as { code?: string; paired?: PairingView };
      if (event.code) setCode({ value: event.code, since: Date.now() });
      if (event.paired) {
        setRead(true);
        onPaired(event.paired);
      }
    },
  });
  const qr = useQr(code?.value);
  const left = useLeft(code?.since ?? Date.now());
  const t = detailTexts.code;
  return (
    <div class="link-code">
      <div class="link-head">
        <Button
          look="plain"
          size="small"
          icon="arrow-left"
          shortcut="o"
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
          <span>{code ? t.renews(left) : t.renewsFull}</span>
        </div>
        <div class="qr-rail">
          <b style={{ transform: `scaleX(${left / 60})` }} />
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
