// Las reglas de la navegación para las cajas de texto y los grupos, iguales en toda la aplicación,
// para que ninguna vista escuche teclas (ADR-019). La vista solo marca su HTML:
//   data-commit  Enter en esta caja la deja, y se guarda lo escrito como al salir de ella
//   data-default lo que hace Enter con el cursor en una caja y nada marcado (00 · R2.6): la acción
//                principal de la pantalla, o abrir lo primero de la lista
//   data-close   dentro de un formulario, lo que hace Esc con el cursor en una de sus cajas
//   un formulario: Enter en una de sus cajas lo manda, salvo con su botón de mandar apagado
//   data-roving  un grupo de opciones: ← y → llevan el cursor de una a otra, sin elegir
//   role=option, row o gridcell: Espacio lo elige, como el clic
//   data-autofocus la caja principal: al aparecer, el cursor va ahí si no está en otra caja
//                (00 · R2.2); en el celular la navegación no corre, así no se abre el teclado
import { topLayer, visible } from '../layers.ts';

const textTypes = new Set(['text', 'search', 'email', 'number', 'tel', 'url', 'password']);

// Una caja donde se escribe: las letras, Enter y las flechas son del texto.
export const isTextBox = (
  target: EventTarget | null,
): target is HTMLInputElement | HTMLTextAreaElement =>
  target instanceof HTMLTextAreaElement ||
  (target instanceof HTMLInputElement && textTypes.has(target.type));

const first = (root: ParentNode, selector: string) =>
  [...root.querySelectorAll<HTMLElement>(`${selector}:not([disabled])`)].find(visible);

// Enter en la caja de un formulario lo manda, como el navegador, salvo con su botón apagado.
function submit(event: KeyboardEvent, form: HTMLFormElement): boolean {
  event.preventDefault();
  const button = form.querySelector<HTMLButtonElement>('button[type="submit"]');
  if (!button?.disabled) form.requestSubmit();
  return true;
}

// Enter en una caja de un renglón, sin nada marcado.
export function enterInBox(event: KeyboardEvent): boolean {
  const box = event.target;
  if (!(box instanceof HTMLInputElement) || !isTextBox(box)) return false;
  if (box.form) return submit(event, box.form);
  const target = box.hasAttribute('data-commit') ? box : first(topLayer(), '[data-default]');
  if (!target) return false;
  event.preventDefault();
  if (target === box) box.blur();
  else target.click();
  return true;
}

// Esc en una caja de un formulario que se puede cancelar.
export function escapeInForm(event: KeyboardEvent): boolean {
  const box = event.target;
  const cancel = isTextBox(box) && box.form && first(box.form, '[data-close]');
  if (!cancel) return false;
  event.preventDefault();
  cancel.click();
  return true;
}

// ← y → con el cursor en una opción de un grupo data-roving.
export function roving(event: KeyboardEvent): boolean {
  const here = event.target;
  if (!(here instanceof HTMLElement) || isTextBox(here)) return false;
  const group = here.parentElement?.closest('[data-roving]');
  if (!group || here.parentElement !== group) return false;
  const all = [...group.children].filter(
    (one): one is HTMLElement => one instanceof HTMLElement && !one.hasAttribute('disabled'),
  );
  const next = all[all.indexOf(here) + (event.key === 'ArrowRight' ? 1 : -1)];
  event.preventDefault();
  next?.focus();
  return true;
}

const choosable = new Set(['option', 'row', 'gridcell']);

// Espacio con el cursor en un renglón que se elige.
export function space(event: KeyboardEvent): void {
  const here = event.target;
  if (!(here instanceof HTMLElement) || !choosable.has(here.getAttribute('role') ?? '')) return;
  event.preventDefault();
  here.click();
}

// El cursor a la caja principal que acaba de aparecer, una sola vez por caja.
function autofocus(): void {
  if (isTextBox(document.activeElement)) return;
  const box = first(topLayer(), '[data-autofocus]:not([data-autofocused])');
  if (!box) return;
  box.setAttribute('data-autofocused', '');
  box.focus();
}

// Mira lo que aparece en la página; devuelve cómo dejar de mirar.
export function watchAutofocus(): () => void {
  const observer = new MutationObserver(autofocus);
  observer.observe(document.body, { childList: true, subtree: true });
  autofocus();
  return () => observer.disconnect();
}
