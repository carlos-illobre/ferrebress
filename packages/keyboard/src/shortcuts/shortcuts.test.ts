// El motor de los atajos (00 · R2.8 a R2.10): cada pantalla declara sus comandos, el mapa les pone la
// tecla y vale solo la pantalla de arriba; un comando que hoy no se puede usar deja pasar la tecla.
import { afterEach, describe, expect, it } from 'vitest';
import { defineShortcuts } from './define.ts';
import { type ShortcutHints, startShortcuts } from './shortcuts.ts';

type Model = { saved: string[]; dirty: boolean };

const press = (code: string, extra: KeyboardEventInit = {}) =>
  window.dispatchEvent(
    new KeyboardEvent('keydown', { key: code.slice(-1), code, cancelable: true, ...extra }),
  );

const role = defineShortcuts<Model>('role', {
  save: (model) => model.dirty && model.saved.push('role.save') > 0,
  back: (model) => model.saved.push('role.back') > 0,
});
const discard = defineShortcuts<Model>('role-discard', {
  discard: (model) => model.saved.push('discard') > 0,
});

describe('el motor de los atajos', () => {
  let stop = () => {};
  afterEach(() => stop());

  it('app-E12, E13: Alt más la tecla del mapa hace el comando de la pantalla de arriba', () => {
    const model: Model = { saved: [], dirty: false };
    let top = 'role';
    let hints: ShortcutHints = {};
    stop = startShortcuts({
      declared: [role, discard],
      keymap: { 'role.save': 'Alt+G', 'role.back': 'Alt+L', 'role-discard.discard': 'Alt+T' },
      topScreen: () => ({ name: top, model: () => model }),
      publishHints: (shown) => {
        hints = shown;
      },
    });
    expect(hints).toEqual({ role: { save: 'G', back: 'L' }, 'role-discard': { discard: 'T' } });
    // Sin cambios, guardar no se puede: la tecla sigue de largo.
    expect(press('KeyG', { altKey: true })).toBe(true);
    model.dirty = true;
    expect(press('KeyG', { altKey: true })).toBe(false);
    press('KeyT', { altKey: true });
    top = 'role-discard';
    press('KeyL', { altKey: true });
    press('KeyT', { altKey: true });
    expect(model.saved).toEqual(['role.save', 'discard']);
  });

  it('sin pantalla arriba no hace nada, y al apagarse no deja teclas para mostrar', () => {
    let hints: ShortcutHints = { x: {} };
    stop = startShortcuts({
      declared: [role],
      keymap: {},
      topScreen: () => undefined,
      publishHints: (shown) => {
        hints = shown;
      },
    });
    expect(press('KeyG', { altKey: true })).toBe(true);
    stop();
    stop = () => {};
    expect(hints).toEqual({});
  });
});
