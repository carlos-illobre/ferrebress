// Lo que la vista necesita de la página y no puede hacer sola (ADR-019): ir a una parte de la
// pantalla y seguir lo que marca el teclado. Es el único lugar de la vista que toca document.
import { useEffect } from 'preact/hooks';
import { still } from '../motion.ts';

// Lleva a la vista la parte con ese id: deslizando salvo con el movimiento reducido (04 · R2.2), o de
// un salto (`smooth: false`), y alineada arriba si se pide (`block`).
export function showPart(
  id: string,
  { smooth = true, block }: { smooth?: boolean; block?: ScrollLogicalPosition } = {},
): void {
  document.getElementById(id)?.scrollIntoView({
    ...(smooth && { behavior: still() ? 'auto' : 'smooth' }),
    ...(block && { block }),
  });
}

// Cada vez que la navegación del teclado marca algo con data-id, avisa su id. Sin la capa del
// teclado nunca avisa.
export function useMarkedId(follow: (id: string) => void, deps: unknown[]): void {
  useEffect(() => {
    const listener = (event: Event) => {
      const id = (event as CustomEvent<HTMLElement | undefined>).detail?.dataset.id;
      if (id) follow(id);
    };
    document.addEventListener('mark', listener);
    return () => document.removeEventListener('mark', listener);
  }, deps);
}
