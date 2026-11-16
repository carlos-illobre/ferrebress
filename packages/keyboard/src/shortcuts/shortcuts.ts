// La capa de los atajos. Cada pantalla declara sus comandos sobre su modelo (define.ts) y un mapa de
// teclas les pone la combinación; al apretarla, se ejecuta el comando de la pantalla de más arriba.
// Mientras Alt está apretado, la página de arriba lleva la clase show-keys, para que la vista
// muestre las teclas. Las teclas de los botones no se escriben en el HTML; las letras sin Alt de una
// región como el menú son de la navegación (data-letters).
import { topLayer } from '../layers.ts';
import { comboOf, shownKey } from './combo.ts';
import type { ScreenShortcuts } from './define.ts';

type Run = ScreenShortcuts['commands'][string];

// Por pantalla, el comando y lo que se muestra de su tecla («R», «1»).
export type ShortcutHints = Record<string, Record<string, string>>;

export type ShortcutsSetup = {
  // Los atajos que declaró cada pantalla.
  declared: readonly ScreenShortcuts[];
  // «<pantalla>.<comando>» y su combinación: «Alt+R».
  keymap: Readonly<Record<string, string>>;
  // La pantalla de más arriba y su modelo de ahora, si hay.
  topScreen: () => { name: string; model: () => unknown } | undefined;
  // Dónde dejar qué tecla tiene cada atajo, para que la vista la muestre; al apagarse, vacío.
  publishHints: (hints: ShortcutHints) => void;
  // Sin teclado físico (un celular), no hace nada.
  touchOnly?: boolean;
};

const showKeysClass = 'show-keys';

// Por pantalla: cada combinación y sus comandos, en el orden de su archivo.
function byScreen(setup: ShortcutsSetup): Map<string, Map<string, Run[]>> {
  const screens = new Map<string, Map<string, Run[]>>();
  for (const { screen, commands } of setup.declared) {
    const combos = new Map<string, Run[]>();
    for (const [name, run] of Object.entries(commands)) {
      // Un comando sin tecla en el mapa queda bajo «undefined», que ninguna tecla apretada da.
      const combo = String(setup.keymap[`${screen}.${name}`]);
      combos.set(combo, [...(combos.get(combo) ?? []), run]);
    }
    screens.set(screen, combos);
  }
  return screens;
}

export function hintsOf(keymap: Readonly<Record<string, string>>): ShortcutHints {
  const shown: ShortcutHints = {};
  for (const [command, combo] of Object.entries(keymap)) {
    const [screen, name] = command.split('.') as [string, string];
    shown[screen] = { ...shown[screen], [name]: shownKey(combo) };
  }
  return shown;
}

function hideKeys(): void {
  for (const element of document.querySelectorAll(`.${showKeysClass}`))
    element.classList.remove(showKeysClass);
}

// Prende los atajos; devuelve cómo apagarlos.
export function startShortcuts(setup: ShortcutsSetup): () => void {
  if (setup.touchOnly) return () => {};
  const commands = byScreen(setup);
  setup.publishHints(hintsOf(setup.keymap));
  // El primer comando de la pantalla de arriba para esta combinación que se puede usar ahora.
  const declaredCommand = (event: KeyboardEvent) => {
    const top = setup.topScreen();
    const runs = (top && commands.get(top.name)?.get(comboOf(event))) ?? [];
    const done = runs.some((run) => run((top as NonNullable<typeof top>).model() as never) !== false);
    if (done) event.preventDefault();
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Alt') {
      topLayer().classList.add(showKeysClass);
      event.preventDefault();
    } else declaredCommand(event);
  };
  const onKeyUp = (event: KeyboardEvent) => {
    if (event.key === 'Alt') hideKeys();
  };
  const listeners: [string, EventListener][] = [
    ['keydown', onKeyDown as EventListener],
    ['keyup', onKeyUp as EventListener],
    ['blur', hideKeys],
  ];
  for (const [type, listener] of listeners) addEventListener(type, listener);
  return () => {
    for (const [type, listener] of listeners) removeEventListener(type, listener);
    setup.publishHints({});
  };
}
