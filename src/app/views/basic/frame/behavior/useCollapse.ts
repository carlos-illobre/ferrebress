// Minimizar y agrandar el menú de la computadora (00 · R1.6), con la animación de la maqueta: 240 ms
// con transform y opacity, y sin animar si se apagaron las animaciones o el sistema pide no animar
// (04 · R2). Siempre arranca agrandado: no se
// guarda nada.
import { useEffect, useRef, useState } from 'preact/hooks';
import { frameSettings } from '../../../../modules/frame/model.ts';
import { useLater } from '../../../../platform/view/later.ts';
import { still } from '../../../../platform/view/motion.ts';

export type CollapsePhase = 'closing' | 'opening' | undefined;

export function useCollapse() {
  // vista: el menú minimizado es del dispositivo (00 · R1.6).
  const [collapsed, setCollapsed] = useState(false);
  // vista: la animación de minimizar.
  const [phase, setPhase] = useState<CollapsePhase>(undefined);
  // vista: lo que hay que hacer al terminar la animación.
  const done = useRef<() => void>(undefined);
  const later = useLater();

  // Lo que hay que hacer al terminar corre ya con el menú dibujado en su estado nuevo.
  useEffect(() => {
    if (phase || !done.current) return;
    done.current();
    done.current = undefined;
  }, [collapsed, phase]);

  function animate(collapse: boolean): void {
    if (!collapse) setCollapsed(false);
    setPhase(collapse ? 'closing' : 'opening');
    later(collapse ? frameSettings.collapseMs : frameSettings.collapseMs + 100, () => {
      setPhase(undefined);
      setCollapsed(collapse);
    });
  }

  function toggle(onDone: () => void): void {
    if (phase || done.current) return;
    done.current = onDone;
    if (still()) setCollapsed(!collapsed);
    else animate(!collapsed);
  }

  return { collapsed, phase, toggle };
}
