// Las dos capas del teclado prendidas a la vez, como en la aplicación, para las pruebas que usan las
// dos; devuelve cómo apagarlas.
import { afterEach, beforeEach } from 'vitest';
import { start as startNavigation } from '../keyboard/navigation/index.ts';
import { start as startShortcuts } from '../keyboard/shortcuts/index.ts';

export function startKeyboard(): () => void {
  const stops = [startNavigation(), startShortcuts()];
  return () => {
    for (const stop of stops) stop();
  };
}

// Las dos capas prendidas en cada prueba del bloque: para las pantallas cuyas teclas (Enter y Esc en
// las cajas, los grupos) son de la navegación del teclado (ADR-019).
export function keyboardForEachTest(): void {
  let stop: () => void;
  beforeEach(() => {
    stop = startKeyboard();
  });
  afterEach(() => stop());
}
