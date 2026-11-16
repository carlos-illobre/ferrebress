// Lo que abre el indicador, encima de la pantalla: el detalle (con el código para vincular, en la
// computadora), la lectura del código en el celular y la confirmación de desvincular. Llega con el
// vínculo, con sus íconos. Lo que hace cada cosa está en el modelo (useLinkDetail).

import { useLinkDetail } from '../../../../modules/device-link/model.ts';
import { addShapes } from '../../../../ui/icon/Icon.tsx';
import { linkShapes } from '../../../../ui/icon/link-shapes.tsx';
import { ConfirmUnpair } from '../Confirm/Confirm.tsx';
import { Read } from '../Read/Read.tsx';
import { Detail } from './Detail.tsx';

addShapes(linkShapes);

// Lo que pone el marco: nada mientras no hay sesión o el vínculo no llegó.
export function Layer() {
  const model = useLinkDetail();
  if (!model.shown) return null;
  return (
    <>
      {model.open && (
        <Detail
          view={model.view}
          onAct={model.act}
          onClose={model.close}
          code={model.code && { onBack: model.code.back, onPaired: model.code.paired }}
        />
      )}
      {model.read && (
        <Read code={model.read.code} onPaired={model.readPaired} onClose={model.closeReading} />
      )}
      {model.asking && model.view.pairing && (
        <ConfirmUnpair
          side={model.view.pairing.side}
          other={model.view.pairing.other.label}
          onCancel={model.cancelUnpair}
          onUnpair={model.unpair}
        />
      )}
    </>
  );
}
