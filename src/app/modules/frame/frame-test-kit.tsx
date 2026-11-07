// Lo que comparten las pruebas del marco: una persona de ejemplo, el ancho y el movimiento que
// contesta matchMedia, abrir el marco y las teclas.
import { render, screen } from '@testing-library/preact';
import { type Mock, vi } from 'vitest';
import { stubMedia } from '../../testing/media.ts';
import { administrator } from '../../testing/person.ts';
import { Toasts } from '../../ui/toast/Toast.tsx';
import { Frame, type FrameProps } from './index.ts';
import { moreOptions, type Option } from './menu.ts';

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
  const [users, settings] = ['users', 'deviceSettings'].map(
    (id) => moreOptions.find((option) => option.id === id) as Option,
  );
  withPath(users as Option, undefined, () => withPath(settings as Option, undefined, run));
}
