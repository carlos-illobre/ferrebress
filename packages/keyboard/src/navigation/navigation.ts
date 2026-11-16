// La capa de la navegación con el teclado: las flechas, Enter, Esc, / y las páginas, con las mismas
// reglas en toda la aplicación. Las pantallas no escuchan
// teclas, solo marcan en su HTML qué se puede recorrer, y esta capa lo hace andar:
//   data-layer   una capa (la pantalla, o lo que se abre encima): solo vale la de más arriba
//   data-mark    lo que recorren las flechas y activa Enter; → abre lo que tiene
//                aria-expanded, como Más, y ← cierra lo que se abrió encima
//   data-close   lo que hace Esc en esa capa
//   data-arrows  una capa que recorre pasos: ← y → tocan sus botones data-arrow="previous" y
//                "next", salvo con el cursor en una caja con texto (el manual)
//   data-slash   la caja a la que lleva / ; data-clear, la que Esc vacía antes de cerrar nada
//   data-page    los botones de una lista por páginas: RePág toca "previous" y AvPág, "next"
//   data-letters una región con letras propias, como el menú: con la marca adentro, la letra sola
//                toca su botón data-key; una combinación (toMenu, Alt+0) lleva la marca ahí, a lo
//                que tiene aria-current
// Cada vez que la marca cambia, avisa con el evento «mark» en document, para el rótulo del menú.
// En el celular no hay atajos ni marca.
import { layers, lettersOf, topLayer, visible } from '../layers.ts';
import { comboOf } from '../shortcuts/combo.ts';

const markedClass = 'marked';
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

// En una caja con texto, ← y → mueven el cursor salvo en el principio o el final.
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

const isTextBox = (target: EventTarget | null): target is HTMLInputElement =>
  target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement;

const sideways: Record<string, string> = { ArrowLeft: 'previous', ArrowRight: 'next' };
const pages: Record<string, string> = { PageUp: 'previous', PageDown: 'next' };

// ← y → en una capa que recorre pasos: con texto en la caja son del cursor; si no, pasan de paso.
function layerArrow(event: KeyboardEvent): boolean {
  const direction = sideways[event.key];
  if (!direction || !topLayer().hasAttribute('data-arrows')) return false;
  if (isTextBox(event.target) && event.target.value !== '') return true;
  topLayer().querySelector<HTMLElement>(`[data-arrow="${direction}"]`)?.click();
  event.preventDefault();
  return true;
}

function slash(event: KeyboardEvent): void {
  const box = topLayer().querySelector<HTMLElement>('[data-slash]');
  if (!box || isTextBox(event.target)) return;
  event.preventDefault();
  box.focus();
}

// Esc en una caja data-clear con texto la vacía, y avisa como si se hubiera borrado.
function clearBox(event: KeyboardEvent): boolean {
  const box = event.target;
  if (!isTextBox(box) || !box.hasAttribute('data-clear') || box.value === '') return false;
  box.value = '';
  box.dispatchEvent(new Event('input', { bubbles: true }));
  return true;
}

function onEscape(event: KeyboardEvent): void {
  if (clearBox(event)) return;
  if (somethingOnTop()) closeTop();
  else unmark();
}

const onArrow = (event: KeyboardEvent) => {
  if (!layerArrow(event) && !caretKeepsArrow(event)) arrow(event);
};

const onPage = (event: KeyboardEvent) =>
  topLayer().querySelector<HTMLElement>(`[data-page="${pages[event.key]}"]`)?.click();

// La región con letras propias donde está la marca, o la capa de arriba si es una.
function lettersHere(): Element | undefined {
  const top = topLayer();
  if (top.hasAttribute('data-letters')) return top;
  const current = marked();
  return current && top.contains(current) ? lettersOf(current) : undefined;
}

// Una letra o un número sin Alt en una región con letras propias: toca su botón.
function letter(event: KeyboardEvent): boolean {
  const region = lettersHere();
  const key = /^(Key|Digit)(.)$/.exec(event.code)?.[2]?.toLowerCase();
  // Escribiendo en una caja, las letras son del texto.
  if (!region || !key || event.ctrlKey || event.metaKey || isTextBox(event.target)) return false;
  const button = [
    ...region.querySelectorAll<HTMLElement>(`[data-key="${key}"]:not([disabled])`),
  ].find(visible);
  if (!button) return false;
  event.preventDefault();
  // Como Enter: la marca queda donde estaba, y lo que abre algo encima marca lo primero de adentro.
  if (button.getAttribute('aria-expanded') === 'false') open(button);
  else button.click();
  return true;
}

// Lleva la marca a la primera región con letras propias de la capa de arriba (el menú): a lo que
// está abierto (aria-current) o, si no hay, a lo primero.
function toLetters(event: KeyboardEvent): void {
  const region = topLayer().querySelector('[data-letters]');
  if (!region) return;
  event.preventDefault();
  mark(region.querySelector<HTMLElement>('[data-mark][aria-current]') ?? marks(region)[0]);
}

// Lo que hace cada tecla sin Alt; las demás no hacen nada.
const actions: Record<string, (event: KeyboardEvent) => void> = {
  ...Object.fromEntries(Object.keys(steps).map((key) => [key, onArrow])),
  ...Object.fromEntries(Object.keys(pages).map((key) => [key, onPage])),
  Enter: () => marked()?.click(),
  Escape: onEscape,
  '/': slash,
};

// Prende la navegación; devuelve cómo apagarla. Sin teclado físico (un celular), no hace nada.
// `toMenu`: la combinación que lleva la marca al menú («Alt+0»); sin ella, no hay.
export function startNavigation({
  touchOnly = false,
  toMenu,
}: { touchOnly?: boolean; toMenu?: string } = {}): () => void {
  if (touchOnly) return () => {};
  const onKeyDown = (event: KeyboardEvent) => {
    if (toMenu && comboOf(event) === toMenu) toLetters(event);
    else if (!(event.altKey || letter(event))) actions[event.key]?.(event);
  };
  const listeners: [string, EventListener][] = [
    ['keydown', onKeyDown as EventListener],
    ['mousemove', unmark],
  ];
  for (const [type, listener] of listeners) addEventListener(type, listener);
  return () => {
    for (const [type, listener] of listeners) removeEventListener(type, listener);
  };
}
