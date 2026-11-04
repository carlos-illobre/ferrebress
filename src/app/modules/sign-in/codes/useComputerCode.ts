// El código QR de la computadora (R2.5, diseño de 01, § 5): abre su pantalla en el servidor y
// escucha el tema `sign-in.codes` del canal común (diseño de 03, § 3), que le manda un código nuevo
// cada 60 segundos, «leído», «cancelado» y, cuando el celular pone la huella, el permiso que cambia
// por su sesión. El canal está abierto solo mientras la entrada está a la vista: con la pestaña
// escondida se cierra y el servidor suelta la pantalla; al volver, el tema se rechaza y se abre otra.
import { useEffect, useState } from 'preact/hooks';
import { createProofKey } from '../../../platform/device/proof-key.ts';
import { useTopic } from '../../../platform/realtime/use-topic.ts';
import { signInApi } from '../api.ts';
import { enteringWith, finish } from '../useSignIn.ts';

export type ComputerCode = { code?: string; read: boolean; since: number };

type ScreenEvent = { type: string; code?: string; permit?: string };

export function useComputerCode(enabled: boolean): ComputerCode {
  const [state, setState] = useState<ComputerCode>({ read: false, since: Date.now() });
  // Cada pantalla abierta es un tema distinto para el canal: una nueva se vuelve a pedir.
  const [screen, setScreen] = useState(0);
  const [opened, setOpened] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (!enabled) return;
    let current = true;
    void signInApi.openScreen().then((result) => {
      if (current && result.ok) setOpened(screen);
    });
    return () => {
      current = false;
    };
  }, [enabled, screen]);

  useTopic(enabled && opened === screen ? `sign-in.codes:${screen}` : undefined, {
    onEvent: (data) => {
      const event = data as ScreenEvent;
      if (event.type === 'code')
        setState({ code: event.code as string, read: false, since: Date.now() });
      else if (event.type === 'read' || event.type === 'cancelled')
        setState((now) => ({ ...now, read: event.type === 'read' }));
      else if (event.type === 'approved') void claim(event.permit as string);
    },
    // La pantalla ya no está (la pestaña estuvo escondida): se abre otra.
    onRefused: () => setScreen((n) => n + 1),
  });

  return state;
}

// El celular ya puso la huella: la computadora muestra la espera mientras abre su sesión.
async function claim(permit: string): Promise<void> {
  finish(await enteringWith('phone', async () => signInApi.claim(permit, await createProofKey())));
}
