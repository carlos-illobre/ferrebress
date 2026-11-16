// Los globos al costado del menú de la computadora: el rótulo con el nombre de un ícono solo (al
// pasar el mouse o al llegar con la marca, R1.6) y el que explica que algo todavía no está (R1.3),
// que se va solo a los 2,6 segundos.
import { useState } from 'preact/hooks';
import { frameSettings } from '../../../../modules/frame/model.ts';
import { useLater } from '../../../../platform/view/later.ts';
import { useMarked } from '../../../../platform/view/page.ts';
import { beside, type Place } from './usePanels.ts';

export type Tip = Place & { kind: 'label' | 'notYet'; name: string; detail?: string };

export function useTip(labelled: (element: HTMLElement) => boolean) {
  // vista: el globo al pasar el mouse.
  const [tip, setTip] = useState<Tip>();
  const later = useLater();

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

  // Llegar con la marca a algo del menú dice su nombre; sacar la marca saca el rótulo.
  useMarked((element) => {
    if (element) label(element);
    else setTip((current) => (current?.kind === 'label' ? undefined : current));
  });

  return {
    tip,
    label,
    hide: () => setTip(undefined),
    notYet(element: HTMLElement, name: string) {
      setTip({ kind: 'notYet', name, ...beside(element) });
      later(frameSettings.tipMs, () => setTip(undefined));
    },
  };
}
