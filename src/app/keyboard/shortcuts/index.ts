// La capa de los atajos (00 · R2.8 a R2.11, ADR-019): el motor es el paquete @ferrebress/keyboard;
// acá se le pasan los atajos que declara cada pantalla (modules/<module>/shortcuts/), el mapa de
// teclas, qué pantalla está arriba y dónde dejar las teclas para que la vista las muestre. La
// encuentra main.ts sola (ADR-020); borrar esta carpeta y las carpetas shortcuts/ de los módulos la
// saca sin romper nada.
import { type ScreenShortcuts, startShortcuts } from '@ferrebress/keyboard';
import { isPhone } from '../../platform/device/device.ts';
import { topScreen } from '../../platform/screens.ts';
import { shortcutHints } from '../../platform/view/shortcut-hints.ts';
import { keymap } from './keymap.ts';

export const declared = Object.values(
  import.meta.glob<{ shortcuts: ScreenShortcuts }>(
    ['../../modules/*/shortcuts/*.ts', '!**/*.test.ts'],
    { eager: true },
  ),
).map((file) => file.shortcuts);

export const start = () =>
  startShortcuts({
    declared,
    keymap,
    topScreen,
    publishHints: (hints) => shortcutHints.set(hints),
    touchOnly: isPhone(),
  });
