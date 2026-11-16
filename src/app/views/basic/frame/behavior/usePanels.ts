// Lo que se abre desde el marco, de a uno por vez: Más, la tarjeta de la persona minimizada y lo
// pendiente al costado del menú, y la hoja de lo pendiente del celular. Tocar afuera, cambiar el tamaño de la
// ventana o abrir otro lo cierra.
import { useRef, useState } from 'preact/hooks';
import { useOutside } from '../../../../platform/view/page.ts';

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
  // vista: lo que se abre del marco cambia de forma entre la computadora y el celular (un panel al costado, una hoja); viaja la dirección.
  const [open, setOpen] = useState<{ panel: Panel; place?: Place }>();
  // vista: de dónde sale cada panel, para abrirlo también desde otro lado (el camino de Más).
  const anchors = useRef(new Map<Panel, Element>());

  // Tocar afuera de lo abierto (o de lo que abre algo) o cambiar el tamaño de la ventana lo cierra.
  useOutside(!!open, '[data-panel], [aria-haspopup]', () => setOpen(undefined));

  return {
    open: open?.panel,
    place: open?.place,
    toggle(panel: Panel, from?: Element) {
      const anchor = from ?? anchors.current.get(panel);
      setOpen(
        open?.panel === panel ? undefined : { panel, ...(anchor && { place: beside(anchor) }) },
      );
    },
    // El botón de donde sale el panel se anota al dibujarse.
    anchor: (panel: Panel) => (element: Element | null) => {
      if (element) anchors.current.set(panel, element);
    },
    close: () => setOpen(undefined),
  };
}
