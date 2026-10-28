// La primera vez que entra con Google en un celular, se le ofrece una sola vez entrar con la huella
// la próxima (R2.2; E06 a E09). Se muestra encima del marco, al llegar. «Sí» abre directo el lector
// del celular y, vinculada la huella, la hoja se cierra sin avisar (R2.11).
import { useState } from 'preact/hooks';
import { useStore } from '../../../../platform/store.ts';
import { Sheet } from '../../../../ui/sheet/Sheet.tsx';
import { signInApi } from '../../api.ts';
import { createPasskey } from '../../passkeys/webauthn.ts';
import { offered, offerPasskey, passkeyLinked, person } from '../../session.ts';
import { texts } from '../../texts.ts';
import { SheetButton, SheetIcon } from './pieces.tsx';

type Step = 'ask' | 'other-account';
type Linked = Step | 'linked' | undefined;

async function link(): Promise<Linked> {
  const options = await signInApi.linkOptions();
  if (!options.ok) return undefined;
  const response = await createPasskey(options.data);
  if (!response) return undefined;
  const result = await signInApi.link(response);
  if (result.ok) passkeyLinked();
  if (result.ok) return 'linked';
  return result.error === 'phone-has-other-account' ? 'other-account' : undefined;
}

export function OfferSheet() {
  const open = useStore(offerPasskey);
  const who = useStore(person);
  const [step, setStep] = useState<Step>('ask');
  if (!open || !who) return null;
  const close = () => {
    setStep('ask');
    offered(who.userId);
    offerPasskey.set(false);
  };
  return (
    <Sheet title={texts.offer.title} onClose={close}>
      {step === 'ask' ? (
        <>
          <SheetIcon name="fingerprint" />
          <h2>{texts.offer.title}</h2>
          <p class="sheet-sub" data-private="">
            {texts.offer.detail(who.email)}
          </p>
          <SheetButton
            look="orange"
            doing={texts.signingIn}
            onPress={async () => {
              const linked = await link();
              if (linked === 'linked') close();
              else setStep(linked ?? 'ask');
            }}
          >
            {texts.offer.yes}
          </SheetButton>
          <SheetButton look="plain" doing={texts.cancel} onPress={close} closes>
            {texts.offer.no}
          </SheetButton>
        </>
      ) : (
        <>
          <SheetIcon name="triangle-alert" />
          <h2>{texts.offer.otherAccount}</h2>
          <SheetButton look="green" doing={texts.cancel} onPress={close} closes>
            {texts.offer.ok}
          </SheetButton>
        </>
      )}
    </Sheet>
  );
}
