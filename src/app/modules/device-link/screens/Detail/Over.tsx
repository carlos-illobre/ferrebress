// Lo que abre el indicador, encima de la pantalla: el detalle (con el código para vincular, en la
// computadora), la lectura del código en el celular y la confirmación de desvincular. Llega con el
// vínculo, con sus íconos.
import type { PairingView } from '@ferrebress/shared/contracts/pairing';
import { useEffect, useRef, useState } from 'preact/hooks';
import { useStore } from '../../../../platform/store.ts';
import { addShapes } from '../../../../ui/icon/Icon.tsx';
import { linkShapes } from '../../../../ui/icon/link-shapes.tsx';
import { showToast } from '../../../../ui/toast/Toast.tsx';
import { linkActions } from '../../actions.ts';
import { linkRuntime } from '../../current.ts';
import { detailOpen, reading, unpairAsked } from '../../detail.ts';
import type { Runtime } from '../../runtime.ts';
import { deviceLinkSettings } from '../../settings.ts';
import { useLinkView } from '../../use-link.ts';
import { type LinkView, onPhone } from '../../view.ts';
import { ConfirmUnpair } from '../Confirm/Confirm.tsx';
import { Read } from '../Read/Read.tsx';
import type { Act } from './Actions.tsx';
import { Detail } from './Detail.tsx';
import { detailTexts } from './texts.ts';

addShapes(linkShapes);

// El código para vincular de la computadora: abierto o no, y qué hacer cuando el celular lo lee.
function useCode(runtime: Runtime) {
  // local: el código para vincular, solo en la computadora.
  const [shown, setShown] = useState(false);
  const page = {
    onBack: () => setShown(false),
    onPaired: (pairing: PairingView) => {
      showToast(detailTexts.toast.pairedComputer, 'check');
      runtime.dispatch({ type: 'serverSaid', pairing });
      setTimeout(() => setShown(false), deviceLinkSettings.doneMs);
    },
  };
  return {
    page: shown ? page : undefined,
    show: () => setShown(true),
    hide: () => setShown(false),
  };
}

function Reader({ runtime }: { runtime: Runtime }) {
  const read = useStore(reading);
  if (!read) return null;
  return (
    <Read
      code={read.code}
      onPaired={(pairing) => {
        runtime.dispatch({ type: 'serverSaid', pairing });
        reading.set(undefined);
      }}
      onClose={() => reading.set(undefined)}
    />
  );
}

export function Over({ runtime }: { runtime: Runtime }) {
  const view = useLinkView();
  const open = useStore(detailOpen);
  const asking = useStore(unpairAsked);
  const setAsking = (on: boolean) => unpairAsked.set(on);
  const code = useCode(runtime);
  const actions = linkActions(runtime);
  const onAct = (act: Act) => {
    if (act === 'unpair') return setAsking(true);
    if (act === 'pause') showToast(detailTexts.toast.paused, 'unplug');
    if (act === 'resume') showToast(detailTexts.toast.resumed, 'check');
    if (act !== 'pair') return actions[act]();
    // Vincular: la computadora muestra el código; el celular abre la cámara.
    if (!onPhone(view)) return code.show();
    detailOpen.set(false);
    return reading.set({});
  };
  const close = () => {
    code.hide();
    detailOpen.set(false);
  };
  return (
    <>
      {open && <Detail view={view} onAct={onAct} onClose={close} code={code.page} />}
      <Reader runtime={runtime} />
      {asking && view.pairing && (
        <ConfirmUnpair
          side={view.pairing.side}
          other={view.pairing.other.label}
          onCancel={() => setAsking(false)}
          onUnpair={async () => {
            if (!(await actions.unpair())) return;
            setAsking(false);
            showToast(detailTexts.toast.unpaired, 'unlink');
          }}
        />
      )}
    </>
  );
}

// Cuando «Probar conexión directa» sale bien, lo dice (E19).
function useDirectNotice(view: LinkView) {
  const trying = useRef(false);
  useEffect(() => {
    if (trying.current && view.status === 'direct') showToast(detailTexts.toast.direct, 'zap');
    trying.current = view.probe === 'trying';
  }, [view.status, view.probe]);
}

// Lo que pone el marco: nada mientras no hay sesión o el vínculo no llegó.
export function Layer() {
  const view = useLinkView();
  const runtime = useStore(linkRuntime);
  useDirectNotice(view);
  if (!runtime || view.hidden) return null;
  return <Over runtime={runtime} />;
}
