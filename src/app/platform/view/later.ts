// Hacer algo un rato después, en una vista (una animación que termina, un globo que se va solo):
// cada pedido nuevo cancela el anterior, y al desmontarse no queda nada pendiente. Parte del
// contrato de las vistas (ADR-019): las vistas no usan temporizadores sueltos.
import { useEffect, useRef } from 'preact/hooks';

export function useLater(): (ms: number, run: () => void) => void {
  // vista: lo que está esperando.
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (ms, run) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(run, ms);
  };
}
