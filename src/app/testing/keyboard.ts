// Las dos capas del teclado prendidas a la vez, como en la aplicación, para las pruebas que usan las
// dos; devuelve cómo apagarlas.
import { start as startNavigation } from '../keyboard/navigation/index.ts';
import { start as startShortcuts } from '../keyboard/shortcuts/index.ts';

export function startKeyboard(): () => void {
  const stops = [startNavigation(), startShortcuts()];
  return () => {
    for (const stop of stops) stop();
  };
}
