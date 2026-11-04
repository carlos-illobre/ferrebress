// Lo que abre el indicador, encima de la pantalla: el detalle y la confirmación de desvincular. Se
// baja aparte del arranque, con sus íconos, la primera vez que se abre.
import { useState } from 'preact/hooks';
import { useStore } from '../../../../platform/store.ts';
import { addShapes } from '../../../../ui/icon/Icon.tsx';
import { linkShapes } from '../../../../ui/icon/link-shapes.tsx';
import { linkActions } from '../../actions.ts';
import { linkRuntime } from '../../current.ts';
import { detailOpen } from '../../detail.ts';
import { useLinkView } from '../../use-link.ts';
import { ConfirmUnpair } from '../Confirm/Confirm.tsx';
import type { Act } from './Actions.tsx';
import { Detail } from './Detail.tsx';

addShapes(linkShapes);

export function Over() {
  const view = useLinkView();
  const runtime = useStore(linkRuntime);
  const [asking, setAsking] = useState(false);
  if (!runtime || view.hidden) return null;
  const actions = linkActions(runtime);
  const onAct = (act: Act) => {
    if (act === 'unpair') return setAsking(true);
    // Vincular abre el código (computadora) o la cámara (celular): sus pantallas, aparte.
    if (act === 'pair') return undefined;
    return actions[act]();
  };
  return (
    <>
      <Detail view={view} onAct={onAct} onClose={() => detailOpen.set(false)} />
      {asking && view.pairing && (
        <ConfirmUnpair
          side={view.pairing.side}
          other={view.pairing.other.label}
          onCancel={() => setAsking(false)}
          onUnpair={async () => {
            if (await actions.unpair()) setAsking(false);
          }}
        />
      )}
    </>
  );
}
