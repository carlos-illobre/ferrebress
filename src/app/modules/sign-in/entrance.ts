// El modelo de la entrada (ADR-019) y lo que comparten sus piezas: si hay conexión, el aviso, cómo
// intentar entrar (con su espera, 00 · R7; si el nonce de Google venció, pide otro) y qué está apagado
// (R2.8: sin conexión, todo; R2.9: con demasiados intentos, Google y la huella).
import type { StartResponse } from '@ferrebress/shared/contracts/sign-in';
import { createContext } from 'preact';
import { useContext } from 'preact/hooks';
import { isPhone } from '../../platform/device/device.ts';
import { navigate } from '../../platform/router.ts';
import { useScreen } from '../../platform/screens.ts';
import { online as onlineStore, sessionClosed } from '../../platform/server/api.ts';
import { useStore } from '../../platform/store.ts';
import { useWaiting } from '../../platform/waiting.ts';
import { manualPath } from '../manual/index.ts';
import type { EntranceState } from './entrance-state.ts';
import { useGoogleButton } from './google/useGoogleButton.ts';
import { useNotice } from './notice.ts';
import { useOfflineEntry } from './offline/useOfflineEntry.ts';
import { texts } from './texts.ts';
import { entering } from './useSignIn.ts';

export const EntranceContext = createContext<EntranceModel | undefined>(undefined);

// Lo que comparten las piezas: el estado, y el modelo entero para el botón de Google y el manual.
export const useEntrance = () => (useContext(EntranceContext) as EntranceModel).state;
export const useEntranceModelContext = () => useContext(EntranceContext) as EntranceModel;

export type EntranceProps = {
  start: StartResponse;
  onScan: () => void;
  signInFirst: boolean;
  // El nonce de Google ya no sirve: hay que pedir otro a /api/start.
  onStale: () => void;
};

export function useEntranceModel({ start, onScan, signInFirst, onStale }: EntranceProps) {
  const online = useStore(onlineStore);
  const closed = useStore(sessionClosed);
  const { notice, setNotice } = useNotice();
  const { run } = useWaiting();
  // El celular tiene su entrada oscura; la computadora con la ventana angosta sigue con la clara.
  const phone = isPhone();
  const state: EntranceState = {
    start,
    online,
    notice,
    closed,
    attempt: (task) =>
      void run(texts.signingIn, task).then((next) => {
        setNotice(next);
        if (next?.kind === 'expired') onStale();
      }),
    scan: onScan,
    signInFirst,
    offlineUntil: useOfflineEntry(online, phone),
  };
  const model = {
    state,
    phone,
    way: useStore(entering),
    google: useGoogleButton(state),
    // «Ver el manual», sin haber entrado (R7.2): «Volver» vuelve acá.
    openManual: () => navigate(manualPath, { state: { from: 'entrance' } }),
  };
  useScreen('sign-in', model);
  return model;
}

export type EntranceModel = ReturnType<typeof useEntranceModel>;

export { type EntranceState, fingerOff, limited, offline } from './entrance-state.ts';
