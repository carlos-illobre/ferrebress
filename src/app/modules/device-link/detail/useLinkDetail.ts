// Lo que abre el indicador del vínculo, sin HTML (R1, R4.2, R5): el detalle, el código para vincular
// en la computadora, la lectura del código en el celular y la confirmación de desvincular. Qué hace
// cada botón según el lado, los avisos al pie y, cuando el celular lee el código, cerrar el detalle
// después del tilde. Se anuncia para las capas: el detalle, el código y la confirmación.
import type { PairingView } from '@ferrebress/shared/contracts/pairing';
import { useEffect, useRef, useState } from 'preact/hooks';
import { useScreen } from '../../../platform/screens.ts';
import { useStore } from '../../../platform/store.ts';
import { notify } from '../../../platform/view/notify.ts';
import { linkActions } from '../actions.ts';
import { linkRuntime } from '../current.ts';
import type { Runtime } from '../runtime.ts';
import { deviceLinkSettings } from '../settings.ts';
import { useLinkView } from '../use-link.ts';
import { type LinkView, onPhone } from '../view.ts';
import type { Act } from './choices.ts';
import { detailOpen, reading, unpairAsked } from './open.ts';
import { detailTexts } from './texts.ts';

// El código para vincular de la computadora: abierto o no, y qué hacer cuando el celular lo lee.
function useCode(runtime: Runtime | undefined) {
  // local: el código para vincular, solo en la computadora.
  const [shown, setShown] = useState(false);
  const page = {
    back: () => setShown(false),
    paired: (pairing: PairingView) => {
      notify(detailTexts.toast.pairedComputer, 'check');
      runtime?.dispatch({ type: 'serverSaid', pairing });
      // Vinculados: después del tilde, el detalle se cierra (pedido de Carlos): ya no hace falta.
      setTimeout(() => {
        setShown(false);
        detailOpen.set(false);
      }, deviceLinkSettings.doneMs);
    },
  };
  return {
    page: shown ? page : undefined,
    show: () => setShown(true),
    hide: () => setShown(false),
  };
}

// Desconectar y reconectar se avisan al pie, con el texto de su lado.
function tellAct(act: Act, phone: boolean): void {
  if (act === 'pause') notify(detailTexts.toast.paused, 'unplug');
  if (act === 'resume') notify(detailTexts.toast.resumed[phone ? 'phone' : 'computer'], 'check');
}

// Cuando «Probar conexión directa» sale bien, lo dice (E19).
function useDirectNotice(view: LinkView) {
  const trying = useRef(false);
  useEffect(() => {
    if (trying.current && view.status === 'direct') notify(detailTexts.toast.direct, 'zap');
    trying.current = view.probe === 'trying';
  }, [view.status, view.probe]);
}

// Lo que se hace desde el detalle y la confirmación.
function acts(runtime: Runtime, view: LinkView, code: ReturnType<typeof useCode>) {
  const actions = linkActions(runtime);
  return {
    act(act: Act) {
      if (act === 'unpair') return unpairAsked.set(true);
      tellAct(act, onPhone(view));
      if (act !== 'pair') return actions[act]();
      // Vincular: la computadora muestra el código; el celular abre la cámara.
      if (!onPhone(view)) return code.show();
      detailOpen.set(false);
      return reading.set({});
    },
    close() {
      code.hide();
      detailOpen.set(false);
    },
    cancelUnpair: () => unpairAsked.set(false),
    async unpair() {
      if (!(await actions.unpair())) return;
      unpairAsked.set(false);
      notify(detailTexts.toast.unpaired, 'unlink');
    },
    // El celular leyó el código y el servidor vinculó: la máquina se entera y la lectura se cierra.
    readPaired(pairing: PairingView) {
      runtime.dispatch({ type: 'serverSaid', pairing });
      reading.set(undefined);
    },
    closeReading: () => reading.set(undefined),
  };
}

export function useLinkDetail() {
  const view = useLinkView();
  const runtime = useStore(linkRuntime);
  const open = useStore(detailOpen);
  const asking = useStore(unpairAsked);
  const read = useStore(reading);
  const code = useCode(runtime);
  useDirectNotice(view);
  // Nada mientras no hay sesión o el vínculo no llegó.
  const shown = !!runtime && !view.hidden;
  const model = {
    shown,
    view,
    open: shown && open,
    code: code.page,
    read: shown ? read : undefined,
    asking: shown && asking && !!view.pairing,
    ...(runtime ? acts(runtime, view, code) : ({} as ReturnType<typeof acts>)),
  };
  useScreen('link-detail', model, model.open && !model.code);
  useScreen('link-code', model, model.open && !!model.code);
  useScreen('link-unpair', model, model.asking);
  return model;
}

export type LinkDetail = ReturnType<typeof useLinkDetail>;
