// Las dos capas prendidas a la vez, sin atajos declarados, para las pruebas del paquete; devuelve
// cómo apagarlas.
import { startNavigation } from './navigation/navigation.ts';
import { startShortcuts } from './shortcuts/shortcuts.ts';

export function startKeyboard(touchOnly = false): () => void {
  const stops = [
    startNavigation({ touchOnly, toMenu: 'Alt+0' }),
    startShortcuts({
      declared: [],
      keymap: {},
      topScreen: () => undefined,
      publishHints: () => undefined,
      touchOnly,
    }),
  ];
  return () => {
    for (const stop of stops) stop();
  };
}
