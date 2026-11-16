import { describe, expect, it } from 'vitest';
import type { ScreenShortcuts } from './define.ts';
import { keymap } from './keymap.ts';

const declared = Object.values(
  import.meta.glob<{ shortcuts: ScreenShortcuts }>(
    ['../../modules/*/shortcuts/*.ts', '!**/*.test.ts'],
    { eager: true },
  ),
).map((file) => file.shortcuts);
const commands = new Set(
  declared.flatMap(({ screen, commands: all }) =>
    Object.keys(all).map((name) => `${screen}.${name}`),
  ),
);
// Las que el navegador no deja tomar a una página, o que son de editar texto (00 · R2.11).
const reserved = [
  'Ctrl+T',
  'Ctrl+W',
  'Ctrl+N',
  'Ctrl+Tab',
  'F5',
  'Ctrl+R',
  'Ctrl+C',
  'Ctrl+V',
  'Ctrl+X',
  'Ctrl+Z',
  'Ctrl+A',
];

describe('el mapa de los atajos', () => {
  it('cada tecla del mapa es de un comando que existe', () => {
    expect(Object.keys(keymap).filter((command) => !commands.has(command))).toEqual([]);
  });

  it('ninguna tecla es de las que reserva el navegador o la edición de texto', () => {
    expect(Object.values(keymap).filter((combo) => reserved.includes(combo))).toEqual([]);
  });

  it('una tecla de toda la aplicación no se repite en ninguna pantalla', () => {
    const app = Object.entries(keymap).filter(([command]) => command.startsWith('app.'));
    const clashes = Object.entries(keymap).filter(
      ([command, combo]) =>
        !command.startsWith('app.') && app.some(([, appCombo]) => appCombo === combo),
    );
    expect(clashes).toEqual([]);
  });
});
