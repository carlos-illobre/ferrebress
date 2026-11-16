// Más en el celular es una pantalla entera (maqueta del marco): reemplaza la cabecera y el área de
// trabajo, y el menú de abajo queda a la vista con Más elegida. Abrirla suma un paso al historial,
// así el botón atrás del celular la cierra y vuelve a donde se estaba.
import { useState } from 'preact/hooks';
import { type Option, openOption } from '../../../../modules/frame/model.ts';
import { goBack, useBackStepWhile } from '../../../../platform/view/back-step.ts';

export function usePhoneMore() {
  // vista: Más es una pantalla solo del celular, con su paso en el historial de este dispositivo.
  const [open, setOpen] = useState(false);

  useBackStepWhile(open, () => setOpen(false));

  return {
    open,
    show: () => setOpen(true),
    // Solo se llama con Más a la vista: vuelve como el botón atrás.
    hide: goBack,
    // Abre una opción en lugar de Más: reemplaza su paso del historial.
    leave(option: Option) {
      setOpen(false);
      openOption(option, 'more', true);
    },
  };
}
