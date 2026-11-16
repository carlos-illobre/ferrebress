// La capa de los atajos (00 · R2.8 a R2.11, ADR-019 y ADR-020). Cada pantalla declara sus comandos
// en modules/<module>/shortcuts/ y keymap.ts les pone la tecla; la capa los encuentra sola, y al
// apretar una combinación ejecuta el comando de la pantalla de más arriba sobre su modelo (R2.10).
// Mientras Alt está apretado se ven las teclas (R2.9). Las pantallas que todavía no declararon sus
// comandos dicen la tecla de cada botón con data-key, y la capa lo toca.
import { isPhone } from '../../platform/device/device.ts';
import { topScreen } from '../../platform/screens.ts';
import { topLayer, visible } from '../../platform/view/layers.ts';
import { type ShortcutHints, shortcutHints } from '../../platform/view/shortcut-hints.ts';
import { comboOf, shownKey } from './combo.ts';
import type { ScreenShortcuts } from './define.ts';
import { keymap } from './keymap.ts';

const declared = Object.values(
  import.meta.glob<{ shortcuts: ScreenShortcuts }>(
    ['../../modules/*/shortcuts/*.ts', '!**/*.test.ts'],
    { eager: true },
  ),
).map((file) => file.shortcuts);

const showKeysClass = 'show-keys';

type Run = ScreenShortcuts['commands'][string];

// Por pantalla: cada combinación y sus comandos, en el orden de su archivo.
function byScreen(): Map<string, Map<string, Run[]>> {
  const screens = new Map<string, Map<string, Run[]>>();
  for (const { screen, commands } of declared) {
    const combos = new Map<string, Run[]>();
    for (const [name, run] of Object.entries(commands)) {
      // Un comando sin tecla en el mapa queda bajo «undefined», que ninguna tecla apretada da.
      const combo = String(keymap[`${screen}.${name}`]);
      combos.set(combo, [...(combos.get(combo) ?? []), run]);
    }
    screens.set(screen, combos);
  }
  return screens;
}

function hints(): ShortcutHints {
  const shown: ShortcutHints = {};
  for (const [command, combo] of Object.entries(keymap)) {
    const [screen, name] = command.split('.') as [string, string];
    shown[screen] = { ...shown[screen], [name]: shownKey(combo) };
  }
  return shown;
}

let commands = new Map<string, Map<string, Run[]>>();

// El primer comando de la pantalla de arriba para esta combinación que se puede usar ahora.
function declaredCommand(event: KeyboardEvent): boolean {
  const top = topScreen();
  const runs = (top && commands.get(top.name)?.get(comboOf(event))) ?? [];
  const done = runs.some((run) => run((top as NonNullable<typeof top>).model() as never) !== false);
  if (done) event.preventDefault();
  return done;
}

// Alt más la tecla de un botón con data-key (R2.8), en las pantallas que todavía no declararon sus
// comandos: va primero, porque una de esas puede estar encima de una que ya los declaró.
function shortcut(event: KeyboardEvent): boolean {
  const key = event.code.replace(/^(Key|Digit)/, '').toLowerCase();
  const button = [
    ...topLayer().querySelectorAll<HTMLElement>(`[data-key="${CSS.escape(key)}"]:not([disabled])`),
  ].find(visible);
  if (!button) return false;
  event.preventDefault();
  button.click();
  return true;
}

function onKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Alt') {
    topLayer().classList.add(showKeysClass);
    event.preventDefault();
  } else if (!(event.altKey && shortcut(event))) declaredCommand(event);
}

function hideKeys(): void {
  for (const element of document.querySelectorAll(`.${showKeysClass}`))
    element.classList.remove(showKeysClass);
}

const onKeyUp = (event: KeyboardEvent) => {
  if (event.key === 'Alt') hideKeys();
};

// Prende los atajos en la computadora; devuelve cómo apagarlos.
export function startShortcuts(): () => void {
  if (isPhone()) return () => {};
  commands = byScreen();
  shortcutHints.set(hints());
  const listeners: [string, EventListener][] = [
    ['keydown', onKeyDown as EventListener],
    ['keyup', onKeyUp as EventListener],
    ['blur', hideKeys],
  ];
  for (const [type, listener] of listeners) addEventListener(type, listener);
  return () => {
    for (const [type, listener] of listeners) removeEventListener(type, listener);
    shortcutHints.set({});
  };
}
