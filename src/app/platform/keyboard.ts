// El teclado de la computadora (00 · R2): las pantallas no escuchan teclas, solo marcan en su HTML
// qué se puede hacer, y este motor lo hace andar:
//   data-layer   una capa (la pantalla, o una hoja encima): solo vale la de más arriba (R2.10)
//   data-key     el atajo de un botón, Alt más esa tecla (R2.8); la tecla se ve con Alt (R2.9)
//   data-mark    lo que recorren las flechas (R2.4) y activa Enter (R2.6)
//   data-close   lo que hace Esc en esa capa (R2.7)
// En el celular no hay atajos ni marca.
import { isPhone } from './device.ts';

const showKeysClass = 'show-keys';
const markedClass = 'marked';

const topLayer = (): Element => {
  const layers = document.querySelectorAll('[data-layer]');
  return layers[layers.length - 1] ?? document.body;
};

const marks = (layer: Element) => [
  ...layer.querySelectorAll<HTMLElement>('[data-mark]:not([disabled])'),
];
const marked = (layer: Element) => layer.querySelector<HTMLElement>(`.${markedClass}`);

function unmark(): void {
  for (const element of document.querySelectorAll(`.${markedClass}`))
    element.classList.remove(markedClass);
}

function move(step: 1 | -1): void {
  const layer = topLayer();
  const items = marks(layer);
  if (items.length === 0) return;
  const current = marked(layer);
  const index = current ? items.indexOf(current) + step : step === 1 ? 0 : items.length - 1;
  unmark();
  const next = items[Math.min(Math.max(index, 0), items.length - 1)] as HTMLElement;
  next.classList.add(markedClass);
  next.scrollIntoView?.({ block: 'nearest' });
}

// En una caja con texto, ← y → mueven el cursor salvo en el principio o el final (R2.3).
function caretKeepsArrow(event: KeyboardEvent): boolean {
  const target = event.target as HTMLInputElement;
  if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') return false;
  if (event.key === 'ArrowLeft') return Number(target.selectionStart) > 0;
  if (event.key === 'ArrowRight') return Number(target.selectionEnd) < target.value.length;
  return false;
}

const arrows: Record<string, 1 | -1> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };

function onKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Alt') {
    document.body.classList.add(showKeysClass);
    event.preventDefault();
    return;
  }
  if (event.altKey) {
    shortcut(event);
    return;
  }
  const step = arrows[event.key];
  if (step && !caretKeepsArrow(event)) {
    move(step);
    event.preventDefault();
  } else if (event.key === 'Enter') {
    marked(topLayer())?.click();
  } else if (event.key === 'Escape') {
    closeOrUnmark();
  }
}

// Alt más la tecla del botón (R2.8): la letra o el número, sin importar la distribución del teclado.
function shortcut(event: KeyboardEvent): void {
  const key = event.code.replace(/^(Key|Digit)/, '').toLowerCase();
  const button = topLayer().querySelector<HTMLElement>(
    `[data-key="${CSS.escape(key)}"]:not([disabled])`,
  );
  if (!button) return;
  event.preventDefault();
  button.click();
}

function closeOrUnmark(): void {
  const layer = topLayer();
  if (marked(layer)) unmark();
  else layer.querySelector<HTMLElement>('[data-close]')?.click();
}

const onKeyUp = (event: KeyboardEvent) => {
  if (event.key === 'Alt') document.body.classList.remove(showKeysClass);
};

// Prende el teclado en la computadora; devuelve cómo apagarlo.
export function startKeyboard(): () => void {
  if (isPhone()) return () => {};
  const listeners: [string, EventListener][] = [
    ['keydown', onKeyDown as EventListener],
    ['keyup', onKeyUp as EventListener],
    ['mousemove', unmark],
    ['blur', () => document.body.classList.remove(showKeysClass)],
  ];
  for (const [type, listener] of listeners) addEventListener(type, listener);
  return () => {
    for (const [type, listener] of listeners) removeEventListener(type, listener);
  };
}
