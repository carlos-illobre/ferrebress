// El código para vincular, en la computadora, sin HTML (R1.3): escucha el tema `device-link.code`
// solo mientras se muestra; el servidor manda el código de ahora, que se renueva cada 60 segundos, y
// cuando el celular lo lee, el vínculo nuevo. Lo que llega se valida: viene del servidor, pero por
// la red, y el vínculo entra a la máquina. Da el dibujo del QR (el dibujante se baja una sola vez,
// con el primer código) y los segundos que le quedan.
import type { PairingView } from '@ferrebress/shared/contracts/pairing';
import { useState } from 'preact/hooks';
import { useQr } from '../../../platform/camera/use-qr.ts';
import { useCountdown } from '../../../platform/countdown.ts';
import { useTopic } from '../../../platform/realtime/use-topic.ts';
import { pairingShape } from '../runtime/topic.ts';
import { deviceLinkSettings } from '../settings.ts';
import { pairUrl } from './pair.ts';

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
  const left = useCountdown(code?.since ?? Date.now(), deviceLinkSettings.codeLastsSeconds);
  return {
    hasCode: !!code,
    qr: useQr(code ? pairUrl(code.value) : undefined),
    read,
    left,
    // Cuánto del tiempo del código queda, de 0 a 1.
    share: left / deviceLinkSettings.codeLastsSeconds,
  };
}
