// La primera vez que entra con Google en un celular, se le ofrece una sola vez entrar con la huella
// la próxima (R2.2; E06 a E09). Se muestra encima del marco, al llegar.
import { useState } from 'preact/hooks';
import { useStore } from '../../../../platform/store.ts';
import { Sheet } from '../../../../ui/sheet/Sheet.tsx';
import { signInApi } from '../../api.ts';
import { offered, offerPasskey, passkeyLinked, person } from '../../session.ts';
import { texts } from '../../texts.ts';
import { createPasskey } from '../../webauthn.ts';
import { SheetButton, SheetIcon } from './pieces.tsx';

type Step = 'ask' | 'done' | 'other-account';

async function link(): Promise<Step | undefined> {
  const options = await signInApi.linkOptions();
  if (!options.ok) return undefined;
  const response = await createPasskey(options.data);
  if (!response) return undefined;
  const result = await signInApi.link(response);
  if (result.ok) passkeyLinked();
  if (result.ok) return 'done';
  return result.error === 'phone-has-other-account' ? 'other-account' : undefined;
}

export function OfferSheet() {
  const open = useStore(offerPasskey);
  const who = useStore(person);
  const [step, setStep] = useState<Step>('ask');
  if (!open || !who) return null;
  const close = () => {
    setStep('ask');
    offered();
    offerPasskey.set(false);
  };
  return (
    <Sheet title={texts.offer.title} onClose={close}>
      {step === 'ask' ? (
        <>
          <SheetIcon name="fingerprint" />
          <h2>{texts.offer.title}</h2>
          <p class="sheet-sub">{texts.offer.detail(who.email)}</p>
          <SheetButton
            look="orange"
            doing={texts.signingIn}
            onPress={async () => setStep((await link()) ?? 'ask')}
          >
            {texts.offer.yes}
          </SheetButton>
          <SheetButton look="plain" doing={texts.cancel} onPress={close} closes>
            {texts.offer.no}
          </SheetButton>
        </>
      ) : (
        <Answer step={step} close={close} />
      )}
    </Sheet>
  );
}

function Answer({ step, close }: { step: Step; close: () => void }) {
  const done = step === 'done';
  return (
    <>
      <SheetIcon name={done ? 'check' : 'triangle-alert'} {...(done && { look: 'done' })} />
      <h2>{done ? texts.offer.done : texts.offer.otherAccount}</h2>
      {done && <p class="sheet-sub">{texts.offer.doneDetail}</p>}
      <SheetButton look="green" doing={texts.cancel} onPress={close} closes>
        {texts.offer.ok}
      </SheetButton>
    </>
  );
}
