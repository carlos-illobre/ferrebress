// La primera vez que entra con Google en un celular, se le ofrece una sola vez entrar con la huella
// la próxima (R2.2; E06 a E09). Se muestra encima del marco, al llegar. «Sí» abre directo el lector
// del celular y, vinculada la huella, la hoja se cierra sin avisar (R2.11).

import { texts, useOffer } from '../../../../modules/sign-in/model.ts';
import { Sheet } from '../../ui/sheet/Sheet.tsx';
import { SheetButton, SheetIcon } from './pieces.tsx';

export function OfferSheet() {
  const offer = useOffer();
  if (!offer.shown) return null;
  const { step, close } = offer;
  return (
    <Sheet title={texts.offer.title} onClose={close}>
      {step === 'ask' ? (
        <>
          <SheetIcon name="fingerprint" />
          <h2>{texts.offer.title}</h2>
          <p class="sheet-sub" data-private="">
            {texts.offer.detail(offer.email)}
          </p>
          <SheetButton look="orange" doing={texts.signingIn} onPress={offer.accept}>
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
