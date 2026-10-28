// Más en el celular es una pantalla entera (maqueta del marco): reemplaza la cabecera y el área de
// trabajo, y el menú de abajo queda a la vista con Más elegida. Abrirla suma un paso al historial,
// así el botón atrás del celular la cierra y vuelve a donde se estaba.
import { useEffect, useState } from 'preact/hooks';

export function usePhoneMore() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const back = () => setOpen(false);
    addEventListener('popstate', back);
    return () => removeEventListener('popstate', back);
  }, [open]);

  return {
    open,
    show() {
      if (open) return;
      history.pushState({ more: true }, '');
      setOpen(true);
    },
    // Solo se llama con Más a la vista: vuelve como el botón atrás.
    hide() {
      history.back();
    },
  };
}
