// El código para vincular, en la computadora, sin HTML (R1.3): escucha el tema `device-link.code`
// solo mientras se muestra; el servidor manda el código de ahora, que se renueva cada 60 segundos, y
// cuando el celular lo lee, el vínculo nuevo. Lo que llega se valida: viene del servidor, pero por
// la red, y el vínculo entra a la máquina. Da el dibujo del QR (el dibujante se baja una sola vez,
// con el primer código) y los segundos que le quedan.
import type { PairingView } from '@ferrebress/shared/contracts/pairing';
import { useEffect, useState } from 'preact/hooks';
import { useTopic } from '../../../platform/realtime/use-topic.ts';
import { pairingShape } from '../runtime/topic.ts';
import { deviceLinkSettings } from '../settings.ts';
import { pairUrl } from './pair.ts';

type Draw = typeof import('../../../platform/camera/qr-draw.ts')['qrPath'];
let drawing: Promise<Draw> | undefined;

function useQr(code: string | undefined) {
  // local: el dibujo del código.
  const [qr, setQr] = useState<{ size: number; d: string }>();
  useEffect(() => {
    if (!code) return;
    drawing ??= import('../../../platform/camera/qr-draw.ts').then((loaded) => loaded.qrPath);
    void drawing.then((qrPath) => setQr(qrPath(pairUrl(code))));
  }, [code]);
  return qr;
}

// Los segundos que le quedan al código de ahora.
function useLeft(since: number): number {
  // local: el reloj de la cuenta regresiva.
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), deviceLinkSettings.codeTickMs);
    return () => clearInterval(timer);
  }, []);
  const lasts = deviceLinkSettings.codeLastsSeconds;
  return Math.max(0, lasts - Math.floor((now - since) / 1000));
}

export function usePairCode(onPaired: (pairing: PairingView) => void) {
  // local: el código es de esta computadora.
  const [code, setCode] = useState<{ value: string; since: number }>();
  // local: el tilde de leído, de esta computadora.
  const [read, setRead] = useState(false);
  useTopic('device-link.code', {
    onEvent: (data) => {
      const event = (data ?? {}) as { code?: unknown; paired?: unknown };
      if (typeof event.code === 'string' && event.code.length <= 64)
        setCode({ value: event.code, since: Date.now() });
      const paired = pairingShape.safeParse(event.paired);
      if (paired.success) {
        setRead(true);
        onPaired(paired.data);
      }
    },
  });
  const left = useLeft(code?.since ?? Date.now());
  return {
    hasCode: !!code,
    qr: useQr(code?.value),
    read,
    left,
    // Cuánto del tiempo del código queda, de 0 a 1.
    share: left / deviceLinkSettings.codeLastsSeconds,
  };
}
