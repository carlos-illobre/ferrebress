// El teclado de la computadora (00 · R2): las pantallas no escuchan teclas, solo marcan en su HTML
// qué se puede hacer, y este motor lo hace andar:
//   data-layer   una capa (la pantalla, o lo que se abre encima): solo vale la de más arriba (R2.10),
//                y con Alt solo se ven sus teclas (R2.9)
//   data-key     el atajo de un botón, Alt más esa tecla (R2.8)
//   data-mark    lo que recorren las flechas (R2.4) y activa Enter (R2.6); → abre lo que tiene
//                aria-expanded, como Más, y ← cierra lo que se abrió encima
//   data-close   lo que hace Esc en esa capa (R2.7)
// Cada vez que la marca cambia, avisa con el evento «mark» en document, para el rótulo del menú.
// En el celular no hay atajos ni marca.
import { isPhone } from './device/device.ts';

const showKeysClass = 'show-keys';
const markedClass = 'marked';

const visible = (element: Element) => element.checkVisibility();
const layers = () => [...document.querySelectorAll('[data-layer]')].filter(visible);
const topLayer = (): Element => layers().at(-1) ?? document.body;
const somethingOnTop = () => layers().length > 1;

const marks = (layer: Element) =>
  [...layer.querySelectorAll<HTMLElement>('[data-mark]:not([disabled])')].filter(visible);
const marked = () => document.querySelector<HTMLElement>(`.${markedClass}`);

// Lo que abrió la capa de arriba con el teclado: al cerrarla, la marca vuelve ahí.
let opener: HTMLElement | undefined;

function mark(element: HTMLElement | undefined): void {
  marked()?.classList.remove(markedClass);
  element?.classList.add(markedClass);
  element?.scrollIntoView?.({ block: 'nearest' });
  document.dispatchEvent(new CustomEvent('mark', { detail: element }));
}

const unmark = () => {
  if (marked()) mark(undefined);
};

function move(step: 1 | -1): void {
  const items = marks(topLayer());
  if (items.length === 0) return;
  const current = marked();
  const index =
    current && items.includes(current) ? items.indexOf(current) + step : step === 1 ? 0 : -1;
  mark(items.at(Math.min(index, items.length - 1)));
}

function open(element: HTMLElement): void {
  opener = element;
  element.click();
  // La capa nueva se dibuja después del clic: recién ahí se marca lo primero de adentro.
  setTimeout(() => mark(marks(topLayer())[0]));
}

function closeTop(): void {
  const wasMarkedInside = topLayer().contains(marked());
  topLayer().querySelector<HTMLElement>('[data-close]')?.click();
  const back = opener?.isConnected ? opener : undefined;
  opener = undefined;
  if (wasMarkedInside) setTimeout(() => mark(back));
}

// En una caja con texto, ← y → mueven el cursor salvo en el principio o el final (R2.3).
function caretKeepsArrow(event: KeyboardEvent): boolean {
  const target = event.target as HTMLInputElement;
  if (target.tagName !== 'INPUT' && target.tagName !== 'TEXTAREA') return false;
  if (event.key === 'ArrowLeft') return Number(target.selectionStart) > 0;
  if (event.key === 'ArrowRight') return Number(target.selectionEnd) < target.value.length;
  return false;
}

const steps: Record<string, 1 | -1> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };

function arrow(event: KeyboardEvent): void {
  const current = marked();
  if (event.key === 'ArrowRight' && current?.getAttribute('aria-expanded') === 'false')
    open(current);
  else if (event.key === 'ArrowLeft' && somethingOnTop()) closeTop();
  else move(steps[event.key] as 1 | -1);
  event.preventDefault();
}

function onKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Alt') {
    topLayer().classList.add(showKeysClass);
    event.preventDefault();
  } else if (event.altKey) {
    shortcut(event);
  } else if (event.key in steps) {
    if (!caretKeepsArrow(event)) arrow(event);
  } else if (event.key === 'Enter') {
    marked()?.click();
  } else if (event.key === 'Escape') {
    if (somethingOnTop()) closeTop();
    else unmark();
  }
}

// Alt más la tecla del botón (R2.8): la letra o el número, sin importar la distribución del teclado.
function shortcut(event: KeyboardEvent): void {
  const key = event.code.replace(/^(Key|Digit)/, '').toLowerCase();
  const button = [
    ...topLayer().querySelectorAll<HTMLElement>(`[data-key="${CSS.escape(key)}"]:not([disabled])`),
  ].find(visible);
  if (!button) return;
  event.preventDefault();
  button.click();
}

function hideKeys(): void {
  for (const element of document.querySelectorAll(`.${showKeysClass}`))
    element.classList.remove(showKeysClass);
}

const onKeyUp = (event: KeyboardEvent) => {
  if (event.key === 'Alt') hideKeys();
};

// Prende el teclado en la computadora; devuelve cómo apagarlo.
export function startKeyboard(): () => void {
  if (isPhone()) return () => {};
  const listeners: [string, EventListener][] = [
    ['keydown', onKeyDown as EventListener],
    ['keyup', onKeyUp as EventListener],
    ['mousemove', unmark],
    ['blur', hideKeys],
  ];
  for (const [type, listener] of listeners) addEventListener(type, listener);
  return () => {
    for (const [type, listener] of listeners) removeEventListener(type, listener);
  };
}
