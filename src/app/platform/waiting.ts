// Las esperas (00 · R7): lo que tarda menos de 300 ms no muestra nada; pasado ese tiempo, lo que se
// tocó muestra su marca, y pasados 2 segundos una barra dice qué se está haciendo. Mientras tanto,
// volver a tocarlo no hace nada, para que nada se mande dos veces.
import { useEffect, useRef, useState } from 'preact/hooks';
import { createStore } from './store.ts';

export const waitSettings = { markAfterMs: 300, barAfterMs: 2000 };

export type WaitPhase = 'idle' | 'quiet' | 'mark' | 'bar';

// Lo que dice la barra; la muestra el marco, una sola para toda la aplicación.
export const waitBar = createStore<string | undefined>(undefined);

export function useWaiting() {
  const [phase, setPhase] = useState<WaitPhase>('idle');
  const running = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const stop = () => {
    for (const timer of timers.current) clearTimeout(timer);
    timers.current = [];
  };
  useEffect(() => stop, []);

  // Corre la tarea con sus esperas; si ya hay una corriendo, no hace nada y devuelve undefined.
  async function run<T>(doing: string, task: () => Promise<T>): Promise<T | undefined> {
    if (running.current) return undefined;
    running.current = true;
    setPhase('quiet');
    timers.current = [
      setTimeout(() => setPhase('mark'), waitSettings.markAfterMs),
      setTimeout(() => {
        setPhase('bar');
        waitBar.set(doing);
      }, waitSettings.barAfterMs),
    ];
    try {
      return await task();
    } finally {
      stop();
      if (waitBar.get() === doing) waitBar.set(undefined);
      running.current = false;
      setPhase('idle');
    }
  }

  return { phase, busy: phase !== 'idle', run };
}
