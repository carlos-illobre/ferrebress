// Lo que se abre encima de una pantalla entera (la cámara) suma un paso al historial mientras está
// abierto: el botón atrás del celular lo cierra y vuelve a la pantalla de abajo, en lugar de
// salir de la aplicación. Si se cierra de otra forma, se saca ese paso (si sigue siendo el de ahora).
import { useEffect } from 'preact/hooks';
import { useCurrent } from './current.ts';

export function useBackStep(close: () => void): void {
  const current = useCurrent(close);
  useEffect(() => {
    const step = crypto.randomUUID();
    history.pushState({ step }, '');
    addEventListener('popstate', current);
    return () => {
      removeEventListener('popstate', current);
      if ((history.state as { step?: string } | null)?.step === step) history.back();
    };
  }, []);
}

// Lo mismo, pero solo mientras `open`: el paso se suma al abrirse y se saca al cerrarse de otra forma.
export function useBackStepWhile(open: boolean, close: () => void): void {
  const current = useCurrent(close);
  useEffect(() => {
    if (!open) return undefined;
    const step = crypto.randomUUID();
    history.pushState({ step }, '');
    addEventListener('popstate', current);
    return () => {
      removeEventListener('popstate', current);
      if ((history.state as { step?: string } | null)?.step === step) history.back();
    };
  }, [open]);
}

// Volver como el botón atrás.
export const goBack = () => history.back();
