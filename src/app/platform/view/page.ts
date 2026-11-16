// Lo que la vista necesita de la página y no puede hacer sola (ADR-019): ir a una parte de la
// pantalla, seguir lo que marca el teclado y lo que frena todo encima de la aplicación. Es el único
// lugar de la vista que toca document.
import type { RefObject } from 'preact';
import { useEffect } from 'preact/hooks';
import { isPhone } from '../device/device.ts';
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

// Dónde se dibuja lo que va encima de todo.
export const pageTop = (): HTMLElement => document.body;

// Mientras lo de `box` está abierto, la aplicación de atrás queda inerte: ni el mouse ni Tab llegan
// (00 · R5.5). En la computadora el cursor arranca en su caja principal (data-autofocus, 00 · R2.2)
// o en su botón principal (data-primary), así Enter lo toca; en el celular no (00 · R2.12).
export function useModal(box: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const app = document.getElementById('app') as HTMLElement;
    app.inert = true;
    const first = box.current?.querySelector<HTMLElement>('[data-autofocus]');
    if (!isPhone()) (first ?? box.current?.querySelector<HTMLElement>('[data-primary]'))?.focus();
    return () => {
      app.inert = false;
    };
  }, []);
}
