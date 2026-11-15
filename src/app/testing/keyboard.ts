// Las dos capas del teclado prendidas a la vez, como en la aplicación, para las pruebas que usan las
// dos; devuelve cómo apagarlas.
import { startNavigation } from '../keyboard/navigation/navigation.ts';
import { startShortcuts } from '../keyboard/shortcuts/shortcuts.ts';

export function startKeyboard(): () => void {
  const stops = [startNavigation(), startShortcuts()];
  return () => {
    for (const stop of stops) stop();
  };
}
