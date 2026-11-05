// Minimizar y agrandar el menú de la computadora (00 · R1.6), con la animación de la maqueta: 240 ms
// con transform y opacity, y sin animar con «reducir movimiento». Siempre arranca agrandado: no se
// guarda nada.
import { useEffect, useRef, useState } from 'preact/hooks';
import { frameSettings } from '../settings.ts';

export type CollapsePhase = 'closing' | 'opening' | undefined;

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export function useCollapse() {
  // local: el menú minimizado es del dispositivo (00 · R1.6).
  const [collapsed, setCollapsed] = useState(false);
  // local: la animación de minimizar.
  const [phase, setPhase] = useState<CollapsePhase>(undefined);
  const done = useRef<() => void>(undefined);

  // Lo que hay que hacer al terminar corre ya con el menú dibujado en su estado nuevo.
  useEffect(() => {
    if (phase || !done.current) return;
    done.current();
    done.current = undefined;
  }, [collapsed, phase]);

  function animate(collapse: boolean): void {
    if (!collapse) setCollapsed(false);
    setPhase(collapse ? 'closing' : 'opening');
    setTimeout(
      () => {
        setPhase(undefined);
        setCollapsed(collapse);
      },
      collapse ? frameSettings.collapseMs : frameSettings.collapseMs + 100,
    );
  }

  function toggle(onDone: () => void): void {
    if (phase || done.current) return;
    done.current = onDone;
    if (reducedMotion()) setCollapsed(!collapsed);
    else animate(!collapsed);
  }

  return { collapsed, phase, toggle };
}
