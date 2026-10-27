// Los globos al costado del menú de la computadora: el rótulo con el nombre de un ícono solo (al
// pasar el mouse o al llegar con la marca, R1.6) y el que explica que algo todavía no está (R1.3),
// que se va solo a los 2,6 segundos.
import { useEffect, useRef, useState } from 'preact/hooks';
import { beside, type Place } from './usePanels.ts';

export const notYetMs = 2600;

export type Tip = Place & { kind: 'label' | 'notYet'; name: string; detail?: string };

export function useTip(labelled: (element: HTMLElement) => boolean) {
  const [tip, setTip] = useState<Tip>();
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const label = (element: HTMLElement) => {
    if (!labelled(element)) return setTip(undefined);
    const { left, top } = beside(element);
    const middle = top + element.getBoundingClientRect().height / 2;
    const { name = '', detail } = element.dataset;
    setTip({
      kind: 'label',
      name,
      ...(detail && { detail }),
      left,
      top: middle,
    });
  };

  useEffect(() => {
    const follow = (event: Event) => {
      const element = (event as CustomEvent<HTMLElement | undefined>).detail;
      if (element) label(element);
      else setTip((current) => (current?.kind === 'label' ? undefined : current));
    };
    document.addEventListener('mark', follow);
    return () => document.removeEventListener('mark', follow);
  });

  return {
    tip,
    label,
    hide: () => setTip(undefined),
    notYet(element: HTMLElement, name: string) {
      clearTimeout(timer.current);
      setTip({ kind: 'notYet', name, ...beside(element) });
      timer.current = setTimeout(() => setTip(undefined), notYetMs);
    },
  };
}
