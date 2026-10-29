// Las capturas de la tarea abierta (diseño del manual, § 5): se bajan con fetch y se guardan como
// blob: mientras la tarea está abierta (la del paso siguiente, un paso antes), así pasar de paso o
// volver no las pide de nuevo aunque el servidor diga no-store. Al cambiar de tarea se sueltan. Lo
// que no llegó por falta de red se pide de nuevo al volver la conexión (R4.6).
import { manualFiles, type Task } from '@ferrebress/shared/contracts/manual';
import { useEffect, useRef, useState } from 'preact/hooks';
import { load } from './api.ts';

// Cada escena: su dirección blob:, o «offline» si no se pudo bajar (se muestra gris).
export type Captures = Record<string, string>;

const scenesOf = (task: Task, from: number) => [
  ...new Set(task.steps.slice(from).flatMap((step) => step.capture?.scene ?? [])),
];

function useOnline(): number {
  const [times, setTimes] = useState(0);
  useEffect(() => {
    const again = () => setTimes((count) => count + 1);
    addEventListener('online', again);
    return () => removeEventListener('online', again);
  }, []);
  return times;
}

export function useCaptures(task: Task, step: number): Captures {
  const [captures, setCaptures] = useState<Captures>({});
  const kept = useRef<Captures>({});
  const online = useOnline();
  useEffect(() => {
    kept.current = {};
    setCaptures({});
    return () => {
      for (const url of Object.values(kept.current)) URL.revokeObjectURL(url);
    };
  }, [task]);
  useEffect(() => {
    let alive = true;
    const wanted = scenesOf(task, step)
      .slice(0, 2)
      .filter((scene) => !kept.current[scene]);
    for (const scene of wanted)
      void load(manualFiles.media(`${scene}.webp`)).then(async (response) => {
        if (!alive) return;
        if (typeof response === 'string')
          return setCaptures((now) => ({ ...now, [scene]: 'offline' }));
        const url = URL.createObjectURL(await response.blob());
        kept.current[scene] = url;
        setCaptures((now) => ({ ...now, [scene]: url }));
      });
    return () => {
      alive = false;
    };
  }, [task, step, online]);
  return captures;
}
