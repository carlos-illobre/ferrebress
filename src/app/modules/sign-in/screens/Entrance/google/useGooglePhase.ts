// En qué momento está el lugar del botón de Google (01 · R2.1, «El hilo»; docs/design/mockups/
// sign-in-google-loading/final/), con las esperas de 00 · R7: nada antes de 300 ms; después, el
// hilo; pasados 2 s, «Conectando con Google…»; a los 8 s sin el botón, «Google no responde ·
// Reintentar». Sin conexión, lo dice. Al volver la conexión, o con «Reintentar», se pide de nuevo.
import { useEffect, useRef, useState } from 'preact/hooks';
import { waitSettings } from '../../../../../platform/waiting.ts';

export const googleFailAfterMs = 8000;

export type GooglePhase = 'empty' | 'loading' | 'slow' | 'failed' | 'ready' | 'offline';

type Waiting = Exclude<GooglePhase, 'ready' | 'offline'>;

export function useGooglePhase(drawn: boolean, online: boolean, retry: () => void) {
  const [waiting, setWaiting] = useState<Waiting>('empty');
  const [attempt, setAttempt] = useState(0);
  // Si el hilo llegó a verse, al llegar el botón se completa y el botón se infla desde él.
  const seen = useRef(false);
  const [arrived, setArrived] = useState(false);

  useEffect(() => {
    setWaiting('empty');
    setArrived(drawn && seen.current);
    if (drawn || !online) return;
    seen.current = false;
    const at = (phase: Waiting, ms: number) =>
      setTimeout(() => {
        seen.current = true;
        setWaiting(phase);
      }, ms);
    const timers = [
      at('loading', waitSettings.markAfterMs),
      at('slow', waitSettings.barAfterMs),
      at('failed', googleFailAfterMs),
    ];
    return () => {
      for (const timer of timers) clearTimeout(timer);
    };
  }, [drawn, online, attempt]);

  // Al volver la conexión sin el botón, Google se pide de nuevo solo.
  const wasOnline = useRef(online);
  useEffect(() => {
    if (online && !wasOnline.current && !drawn) again();
    wasOnline.current = online;
  }, [online]);

  function again() {
    retry();
    setAttempt((n) => n + 1);
  }

  const phase: GooglePhase = drawn ? 'ready' : online ? waiting : 'offline';
  return { phase, arrived, again };
}
