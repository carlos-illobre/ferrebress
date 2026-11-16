// El botón de Google de la entrada, sin HTML (R2.1): el marco que lo dibuja (Google dibuja el botón en
// su propio marco, así que la vista le da el elemento), qué mostrar mientras tanto (phase.ts) y,
// con la credencial, el intento de entrar. Cada intento (`frameKey`) es un marco nuevo.
import { useEffect, useRef, useState } from 'preact/hooks';
import { isPhone } from '../../../platform/device/device.ts';
import { type EntranceState, offline } from '../entrance-state.ts';
import { signInSettings } from '../settings.ts';
import { withGoogle } from '../useSignIn.ts';
import { connectGoogleFrame } from './connect.ts';
import { useGooglePhase } from './phase.ts';

// El marco de Google: lo conecta, le manda qué dibujar cuando hay nonce y avisa cuándo quedó
// dibujado. Cada intento (`frameKey`) es un marco nuevo.
function useGoogleFrame(
  entrance: EntranceState,
  frameKey: number,
  setDrawn: (drawn: boolean) => void,
) {
  const frame = useRef<HTMLIFrameElement>(null);
  const connection = useRef<ReturnType<typeof connectGoogleFrame>>(undefined);
  const attempt = useRef(entrance.attempt);
  attempt.current = entrance.attempt;
  const signInFirst = useRef(entrance.signInFirst);
  signInFirst.current = entrance.signInFirst;
  const { googleClientId, googleNonce, googleScriptUrl } = entrance.start;
  useEffect(() => {
    const opened = connectGoogleFrame(frame.current as HTMLIFrameElement, {
      drawn: () => setDrawn(true),
      credential: (credential) =>
        attempt.current(() => withGoogle(credential, !signInFirst.current)),
    });
    connection.current = opened;
    return opened.stop;
  }, [frameKey]);
  useEffect(() => {
    const element = frame.current as HTMLIFrameElement;
    if (!googleNonce) return;
    connection.current?.show({
      scriptUrl: googleScriptUrl,
      clientId: googleClientId,
      nonce: googleNonce,
      width: Math.min(
        signInSettings.google.maxWidth,
        element.clientWidth || signInSettings.google.maxWidth,
      ),
      // En la entrada oscura del celular, el botón blanco.
      theme: isPhone() ? 'outline' : 'filled_blue',
    });
  }, [googleClientId, googleNonce, frameKey]);
  return frame;
}

export function useGoogleButton(entrance: EntranceState) {
  const [drawn, setDrawn] = useState(false);
  const [frameKey, setFrameKey] = useState(0);
  const { phase, arrived, again } = useGooglePhase(drawn, !offline(entrance), () => {
    setDrawn(false);
    setFrameKey((n) => n + 1);
  });
  const frame = useGoogleFrame(entrance, frameKey, setDrawn);
  return { frame, frameKey, drawn, phase, arrived, again };
}
