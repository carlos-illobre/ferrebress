// Lo que comparten las piezas de la entrada: si hay conexión, el aviso, cómo intentar entrar y
// qué está apagado (R2.8: sin conexión, todo; R2.9: con demasiados intentos, Google y la huella).
import type { StartResponse } from '@ferrebress/shared/contracts/sign-in';
import { createContext } from 'preact';
import { useContext } from 'preact/hooks';
import type { Notice } from '../../notice.ts';

export type EntranceState = {
  start: StartResponse;
  online: boolean;
  notice: Notice | undefined;
  closed: string | undefined;
  // Corre un intento de entrar con su espera (00 · R7) y muestra el aviso que devuelva.
  attempt: (run: () => Promise<Notice | undefined>) => void;
  scan: () => void;
  // El celular leyó el código de una computadora y tiene que entrar primero (R2.7).
  signInFirst: boolean;
};

export const EntranceContext = createContext<EntranceState | undefined>(undefined);

export const useEntrance = () => useContext(EntranceContext) as EntranceState;

export const offline = (state: EntranceState) => !state.online;
export const limited = (state: EntranceState) => !state.online || state.notice?.kind === 'too-many';
