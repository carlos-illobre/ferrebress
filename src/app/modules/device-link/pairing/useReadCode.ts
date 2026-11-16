// Leer el código para vincular, en el celular, sin HTML (R1.3 a R1.7): primero la cámara (o el código
// que trajo la dirección), después lo que dice el servidor y, si alguno ya estaba vinculado, la
// pregunta de reemplazar. Lo que no vincula queda como aviso; un código vencido deja volver a leer.
import type { PairingView } from '@ferrebress/shared/contracts/pairing';
import { useEffect, useState } from 'preact/hooks';
import { notify } from '../../../platform/view/notify.ts';
import { detailTexts } from '../detail/texts.ts';
import { acceptTicket, pairCodeOf, type Reading, readCode } from './pair.ts';

export type ReadStep =
  | { kind: 'camera' }
  | { kind: 'asking' }
  | Exclude<Reading, { kind: 'paired' }>;

export function useReadCode(code: string | undefined, onPaired: (pairing: PairingView) => void) {
  // local: la cámara y lo que leyó son del celular.
  const [step, setStep] = useState<ReadStep>(code ? { kind: 'asking' } : { kind: 'camera' });
  const settle = (reading: Reading) => {
    if (reading.kind !== 'paired') return setStep(reading);
    notify(detailTexts.toast.pairedPhone, 'check');
    onPaired(reading.pairing);
  };
  const read = (value: string) => {
    setStep({ kind: 'asking' });
    void readCode(value).then(settle);
  };
  useEffect(() => {
    if (code) read(code);
  }, []);
  return {
    step,
    // Lo que se lee con la cámara: solo un código de vincular.
    codeOf: pairCodeOf,
    read,
    // Solo con la pregunta de reemplazar a la vista.
    replace: async () =>
      settle(await acceptTicket((step as Extract<ReadStep, { kind: 'replace' }>).ticket)),
    again: () => setStep({ kind: 'camera' }),
  };
}
