// Lo que se abre encima de una pantalla entera (la cámara) suma un paso al historial mientras está
// abierto: el botón atrás del celular lo cierra y vuelve a la pantalla de abajo, en lugar de
// salir de la aplicación. Si se cierra de otra forma, se saca ese paso (si sigue siendo el de ahora).
import { useEffect } from 'preact/hooks';

export function useBackStep(close: () => void): void {
  useEffect(() => {
    const step = crypto.randomUUID();
    history.pushState({ step }, '');
    addEventListener('popstate', close);
    return () => {
      removeEventListener('popstate', close);
      if ((history.state as { step?: string } | null)?.step === step) history.back();
    };
  }, []);
}
