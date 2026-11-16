// El teclado de una aplicación web, en dos capas independientes: la navegación y los atajos. Ver
// README.md.
export { startNavigation } from './navigation/navigation.ts';
export { comboOf, shownKey } from './shortcuts/combo.ts';
export { type Command, defineShortcuts, type ScreenShortcuts } from './shortcuts/define.ts';
export {
  hintsOf,
  type ShortcutHints,
  type ShortcutsSetup,
  startShortcuts,
} from './shortcuts/shortcuts.ts';
