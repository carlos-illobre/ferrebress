// Ofrecer entrar con la huella, sin HTML (R2.2; E06 a E09): la primera vez que entra con Google en un
// celular, una sola vez. «Sí» abre directo el lector; vinculada la huella, se cierra sin avisar
// (R2.11); con la huella de otra cuenta, lo dice.
import { useState } from 'preact/hooks';
import { useStore } from '../../../platform/store.ts';
import { offered, offerPasskey, person } from '../session.ts';
import { linkHere } from './link.ts';

export function useOffer() {
  const open = useStore(offerPasskey);
  const who = useStore(person);
  const [step, setStep] = useState<'ask' | 'other-account'>('ask'); // local: la hoja de este celular
  const close = () => {
    setStep('ask');
    offered((who as NonNullable<typeof who>).userId); // cerrar solo se puede con la hoja a la vista
    offerPasskey.set(false);
  };
  return {
    shown: open && !!who,
    email: who?.email ?? '',
    step,
    close,
    async accept() {
      const linked = await linkHere();
      if (linked === 'linked') close();
      else setStep(linked ?? 'ask');
    },
  };
}
