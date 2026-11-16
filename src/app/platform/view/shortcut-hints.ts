// Qué tecla tiene cada atajo de una pantalla, para que la vista lo muestre con Alt (00 · R2.9). Lo
// llena la capa de los atajos al prenderse (keyboard/shortcuts/); sin la capa, no hay ninguno y la
// vista no muestra teclas (ADR-019).
import { createStore, useStore } from '../store.ts';

// Por pantalla, el comando y lo que se muestra de su tecla («R», «1»).
export type ShortcutHints = Record<string, Record<string, string>>;

export const shortcutHints = createStore<ShortcutHints>({});

export function useShortcutHints(screen: string): Record<string, string> {
  return useStore(shortcutHints)[screen] ?? {};
}
