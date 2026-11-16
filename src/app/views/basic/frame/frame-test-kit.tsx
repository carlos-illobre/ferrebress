// Lo que comparten las pruebas del marco: una persona de ejemplo, el ancho y el movimiento que
// contesta matchMedia, abrir el marco y las teclas.
import { render, screen, within } from '@testing-library/preact';
import { type Mock, vi } from 'vitest';
import { moreOptions, type Option } from '../../../modules/frame/model.ts';
import { stubMedia } from '../../../testing/media.ts';
import { administrator } from '../../../testing/person.ts';
import { Toasts } from '../ui/toast/Toast.tsx';
import { Frame, type FrameProps } from './Frame/Frame.tsx';

export const person = {
  userId: 'u1',
  name: 'Rubén Paredes',
  email: 'ruben@example.com',
  ...administrator,
};

// Lo que contesta matchMedia: el ancho (celular o computadora) y si se pidió reducir movimiento.
export function media({ phone = false, reduced = false } = {}) {
  stubMedia((query) => (query.includes('max-width') ? phone : reduced));
}

export function open({
  testing = true,
  onSignOut = vi.fn<() => unknown>(),
  screens,
  who = person,
}: {
  who?: FrameProps['person'];
  testing?: boolean;
  onSignOut?: Mock<() => unknown>;
  screens?: FrameProps['screens'];
} = {}): { onSignOut: Mock<() => unknown>; side: HTMLElement } {
  render(
    <>
      <Frame person={who} testing={testing} onSignOut={onSignOut} screens={screens} />
      <Toasts />
    </>,
  );
  return { onSignOut, side: screen.getAllByRole('navigation', { name: 'Menú' })[0] as HTMLElement };
}

export const alt = (key: string) => {
  window.dispatchEvent(
    new KeyboardEvent('keydown', { key, code: `Key${key.toUpperCase()}`, altKey: true }),
  );
};
export const press = (key: string) => {
  window.dispatchEvent(new KeyboardEvent('keydown', { key }));
};
// Alt 0, que lleva la marca al menú, y la letra sola de una opción (00 · R2.13).
export const toMenu = () => {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: '0', code: 'Digit0', altKey: true }));
};
export const letter = (key: string) => {
  window.dispatchEvent(new KeyboardEvent('keydown', { key, code: `Key${key.toUpperCase()}` }));
};

// Una opción del menú que, para la prueba, ya existe (o deja de existir, con `undefined`).
export function withPath(option: Option, path: string | undefined, run: () => void): void {
  const before = option.path;
  if (path === undefined) delete option.path;
  else option.path = path;
  try {
    run();
  } finally {
    if (before === undefined) delete option.path;
    else option.path = before;
  }
}

// Como si ninguna opción tuviera pantalla todavía (ni Usuarios ni Configuración).
export function withoutScreens(run: () => void): void {
  const [users, settings, administration] = ['users', 'deviceSettings', 'administration'].map(
    (id) => moreOptions.find((option) => option.id === id) as Option,
  );
  withPath(users as Option, undefined, () =>
    withPath(settings as Option, undefined, () =>
      withPath(administration as Option, undefined, run),
    ),
  );
}

// Los roles que se ven tachados («Ya no tenés permiso»): los que le sacaron.
export const goneRoles = (dialog: HTMLElement) => [...dialog.querySelectorAll('.pill-gone')];

// El nombre que muestra cada parte del menú.
export const partName = (button: Element) => button.querySelector('.part-name')?.textContent;
// El cartel del ambiente de pruebas.
export const testBanner = () => document.querySelector('.test-banner')?.textContent;
// Si una parte del menú dice que no está acá (se sacude y lo dice).
export const isNotHere = (button: Element) => button.classList.contains('not-here');
// El marco y sus estados: minimizado, Más abierto en el celular.
export const frameElement = () => document.querySelector('.frame') as HTMLElement;
export const moreOpenOnPhone = () => frameElement().classList.contains('more-open');
// El rótulo o el globo que aparece junto al menú, y si hay alguno.
export const tipLabel = () => document.querySelector('.tip.label')?.textContent;
export const tipShown = () => document.querySelector('.tip') !== null;
// Si lo que sale al costado del menú es un panel, y si está abierto.
export const isSidePanel = (element: Element) => element.classList.contains('side-panel');
export const isOpen = (element: Element) => element.classList.contains('open');
// Más en el celular: sus grupos, los nombres del primero y si una opción está marcada como urgente.
export const phoneGroups = (more: Element) => [...more.querySelectorAll('.phone-more-group')];
export const firstGroupNames = (more: Element) =>
  within(phoneGroups(more)[0] as HTMLElement)
    .getAllByRole('button')
    .map((button) => button.querySelector('b')?.textContent);
export const isUrgent = (option: Element) =>
  option.querySelector('.phone-more-icon.urgent') !== null;
// El logotipo y la luz de la conexión, arriba en el celular.
export const phoneLogoShown = () => document.querySelector('.phone-logo') !== null;
export const phoneLight = () => document.querySelector('.phone-light') as HTMLElement;
// El camino de Más en una pantalla: «Más» en la computadora y «‹ Más» en el celular; y Más en el menú.
export const crumbMore = () => document.querySelector('.more-crumbs button') as HTMLElement;
export const backToMore = () => document.querySelector('.more-back') as HTMLElement;
export const moreInMenu = (side: Element) => side.querySelector('.part.more') as HTMLElement;
