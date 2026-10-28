// Lo que se abre desde el marco, de a uno por vez: Más, la tarjeta de la persona minimizada y lo
// pendiente al costado del menú, y la hoja de lo pendiente del celular. Tocar afuera, cambiar el tamaño de la
// ventana o abrir otro lo cierra.
import { useEffect, useState } from 'preact/hooks';

export type Panel = 'more' | 'person' | 'pending' | 'phonePending';

// Dónde se dibuja lo que sale al costado del menú: a 8 px de lo tocado o del borde del menú.
export type Place = { left: number; top: number };

// Preact 11 ya no le agrega «px» a los números de style.
export const px = (value: number) => `${value}px`;

export function beside(anchor: Element): Place {
  const side = anchor.closest('nav') as Element;
  const box = anchor.getBoundingClientRect();
  return { left: Math.max(box.right, side.getBoundingClientRect().right) + 8, top: box.top };
}

export function usePanels() {
  const [open, setOpen] = useState<{ panel: Panel; place?: Place }>();

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(undefined);
    const outside = (event: Event) => {
      const target = event.target as Element;
      if (!target.closest('[data-panel], [aria-haspopup]')) close();
    };
    addEventListener('resize', close);
    document.addEventListener('click', outside);
    return () => {
      removeEventListener('resize', close);
      document.removeEventListener('click', outside);
    };
  }, [open]);

  return {
    open: open?.panel,
    place: open?.place,
    toggle(panel: Panel, anchor?: Element) {
      setOpen(
        open?.panel === panel ? undefined : { panel, ...(anchor && { place: beside(anchor) }) },
      );
    },
    close: () => setOpen(undefined),
  };
}
