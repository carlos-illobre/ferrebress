// El código QR de la computadora (R2.5, diseño de 01, § 5): abre su pantalla en el servidor y
// escucha el canal, que le manda un código nuevo cada 60 segundos, «leído», «cancelado» y, cuando el
// celular pone la huella, el permiso que cambia por su sesión. El canal está abierto solo mientras
// la entrada está a la vista: con la pestaña escondida se cierra, y se vuelve a abrir al volver.
import { useEffect, useState } from 'preact/hooks';
import { createProofKey } from '../../platform/proof-key.ts';
import { type ChannelEvent, openChannel } from '../../platform/realtime.ts';
import { signInApi } from './api.ts';
import { finish } from './useSignIn.ts';

export type ComputerCode = { code?: string; read: boolean; since: number };

const channelPath = '/api/realtime/sign-in-codes';

async function open(signal: AbortSignal): Promise<Response> {
  await signInApi.openScreen();
  return fetch(channelPath, { signal });
}

export function useComputerCode(enabled: boolean): ComputerCode {
  const [state, setState] = useState<ComputerCode>({ read: false, since: Date.now() });

  useEffect(() => {
    if (!enabled) return;
    const onEvent = ({ type, data }: ChannelEvent) => {
      const event = data as { code?: string; permit?: string };
      if (type === 'code') setState({ code: event.code as string, read: false, since: Date.now() });
      else if (type === 'read' || type === 'cancelled')
        setState((now) => ({ ...now, read: type === 'read' }));
      else if (type === 'approved') void claim(event.permit as string);
    };
    let close: (() => void) | undefined;
    const follow = () => {
      close?.();
      close = document.visibilityState === 'visible' ? openChannel({ open, onEvent }) : undefined;
    };
    follow();
    document.addEventListener('visibilitychange', follow);
    return () => {
      document.removeEventListener('visibilitychange', follow);
      close?.();
    };
  }, [enabled]);

  return state;
}

async function claim(permit: string): Promise<void> {
  finish(await signInApi.claim(permit, await createProofKey()));
}
