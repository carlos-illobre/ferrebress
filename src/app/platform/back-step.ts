// Lo que se abre encima de una pantalla entera (la cámara) suma un paso al historial mientras está
// abierto: el botón atrás del celular lo cierra y vuelve a la pantalla de abajo, en lugar de
// salir de la aplicación. El paso se suma en el toque que lo abre (`pushStep`): Chrome en Android
// saltea con el botón atrás los pasos que se suman sin un toque de la persona. Si se cierra de otra
// forma, se saca ese paso, si sigue siendo el de ahora.
import { useEffect } from 'preact/hooks';

type Step = { step?: string };

const currentStep = () => (history.state as Step | null)?.step;

export function pushStep(): void {
  history.pushState({ step: crypto.randomUUID() }, '');
}

export function useBackStep(close: () => void): void {
  useEffect(() => {
    // Si no lo abrió un toque que sumó el paso, lo suma ahora.
    if (!currentStep()) pushStep();
    const step = currentStep();
    addEventListener('popstate', close);
    return () => {
      removeEventListener('popstate', close);
      if (currentStep() === step) history.back();
    };
  }, []);
}
