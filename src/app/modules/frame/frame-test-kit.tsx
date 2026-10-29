// Lo que comparten las pruebas del marco: una persona de ejemplo, el ancho y el movimiento que
// contesta matchMedia, abrir el marco y las teclas.
import { render, screen } from '@testing-library/preact';
import { type Mock, vi } from 'vitest';
import { Toasts } from '../../ui/toast/Toast.tsx';
import { Frame, type SettingRow } from './index.ts';

export const person = {
  userId: 'u1',
  name: 'Rubén Paredes',
  email: 'ruben@example.com',
  role: 'Administrador',
};

// Lo que contesta matchMedia: el ancho (celular o computadora) y si se pidió reducir movimiento.
export function media({ phone = false, reduced = false } = {}) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('max-width') ? phone : reduced,
  }));
}

export function open({
  testing = true,
  onSignOut = vi.fn<() => unknown>(),
  setting,
}: {
  testing?: boolean;
  onSignOut?: Mock<() => unknown>;
  setting?: SettingRow;
} = {}): { onSignOut: Mock<() => unknown>; side: HTMLElement } {
  render(
    <>
      <Frame person={person} testing={testing} onSignOut={onSignOut} setting={setting} />
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
