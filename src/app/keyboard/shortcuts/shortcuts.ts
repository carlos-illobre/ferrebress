// La capa de los atajos (00 · R2.8 a R2.11, ADR-019 y ADR-020): Alt más la tecla de un botón lo
// toca, y mientras Alt está apretado se ven las teclas (R2.9). Hoy cada botón dice su tecla con
// data-key; solo vale en la capa de más arriba (R2.10).
import { isPhone } from '../../platform/device/device.ts';
import { topLayer, visible } from '../../platform/view/layers.ts';

const showKeysClass = 'show-keys';

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

function onKeyDown(event: KeyboardEvent): void {
  if (event.key === 'Alt') {
    topLayer().classList.add(showKeysClass);
    event.preventDefault();
  } else if (event.altKey) shortcut(event);
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
  const listeners: [string, EventListener][] = [
    ['keydown', onKeyDown as EventListener],
    ['keyup', onKeyUp as EventListener],
    ['blur', hideKeys],
  ];
  for (const [type, listener] of listeners) addEventListener(type, listener);
  return () => {
    for (const [type, listener] of listeners) removeEventListener(type, listener);
  };
}
