// Qué capítulos de la lista del manual están abiertos (00 · R6.8, R6.9): al empezar, el de la tarea
// que se lee (o el primero escrito), y se abre solo el de la tarea que se abre desde el buscador o la
// dirección. No se guarda.
import { useEffect, useRef, useState } from 'preact/hooks';
import type { View } from './view.ts';

export type Folds = { isOpen: (id: string) => boolean; toggle: (id: string) => void };

// El grupo de los capítulos que faltan, que también se pliega.
export const soonId = 'soon';

export function useFolds(view: View): Folds {
  const first = view.index.chapters.find((entry) => entry.tasks)?.id;
  // local: lo desplegado del índice.
  const [open, setOpen] = useState(() => new Set([view.state.chapter ?? first]));
  // Solo cuando cambia la tarea que se lee: si no, volvería a abrir el que se acaba de plegar.
  const { chapter, task } = view.state;
  const reading = chapter && task ? `${chapter}/${task}` : undefined;
  const last = useRef(reading);
  useEffect(() => {
    if (!chapter || reading === last.current) return;
    last.current = reading;
    setOpen((now) => new Set(now).add(chapter));
  }, [reading]);
  return {
    isOpen: (id) => open.has(id),
    toggle: (id) =>
      setOpen((now) => {
        const next = new Set(now);
        if (!next.delete(id)) next.add(id);
        return next;
      }),
  };
}
