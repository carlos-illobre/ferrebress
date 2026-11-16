// Las teclas de Usuarios en la computadora (00 · R2.8; diseño de 02, § 8).
import { act, fireEvent, screen, waitFor } from '@testing-library/preact';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { startKeyboard } from '../../testing/keyboard.ts';
import { keyShown } from '../../views/basic/kit.ts';
import {
  access,
  choose,
  graciela,
  inCard,
  openUsers,
  pedro,
  roles,
  sofia,
  toast,
} from '../../views/basic/users/users-test-kit.tsx';

const lost = (phones: object[]) => ({
  body: {
    roles,
    people: [{ userId: 'graciela', displayName: 'Graciela Benítez', self: false, phones }],
  },
});

describe('las teclas de Usuarios en la computadora (00 · R2.8)', () => {
  it('Alt Z autoriza, Alt I «Se perdió un celular» y / busca', async () => {
    const stop = startKeyboard();
    openUsers({ '/api/lost-phones': lost([]) });
    await screen.findByText('Rubén Paredes');
    const alt = (key: string) =>
      act(() => {
        dispatchEvent(
          new KeyboardEvent('keydown', { key, code: `Key${key.toUpperCase()}`, altKey: true }),
        );
      });
    alt('z');
    expect(screen.getByRole('alertdialog', { name: 'Autorizar a alguien' })).toBeTruthy();
    act(() => {
      dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    alt('i');
    expect(screen.getByRole('alertdialog', { name: '¿De quién es el celular?' })).toBeTruthy();
    stop();
  });
});

const altKey = (letter: string) =>
  fireEvent.keyDown(window, { key: letter, code: `Key${letter}`, altKey: true });

describe('las teclas de la tarjeta de una persona (00 · R2.8)', () => {
  let stop: () => void;
  beforeEach(() => {
    stop = startKeyboard();
  });
  afterEach(() => stop());

  it('Alt L da de alta a quien está dada de baja, y el botón muestra su tecla', async () => {
    openUsers({
      '/api/users/sofia/activate': {
        body: { person: { ...sofia, active: true, deactivatedAt: null, version: 2 } },
      },
    });
    await choose(/Sofía/);
    const button = await inCard().findByRole('button', { name: /Dar de alta/ });
    expect(keyShown(button)).toBe('L');
    altKey('L');
    await waitFor(() => expect(toast()).toBe('Sofía Blanco puede entrar otra vez'));
  });

  it('Alt B borra el alta de quien nunca entró', async () => {
    openUsers({ '/api/users/pedro/delete': { body: { removed: true } } });
    await choose(/pedro/);
    await inCard().findByRole('button', { name: /Borrar el alta/ });
    altKey('B');
    await waitFor(() => expect(toast()).toBe(`Se borró el alta de ${pedro.displayName}`));
  });

  it('Alt B pregunta antes de dar de baja y Alt D antes de cerrar todas sus sesiones', async () => {
    openUsers({ '/api/users/graciela/access': { body: access } });
    await choose(/Graciela/);
    await inCard().findByRole('button', { name: /Cerrar todas/ });
    altKey('B');
    expect(
      screen.getByRole('alertdialog', { name: `¿Dar de baja a ${graciela.displayName}?` }),
    ).toBeTruthy();
    act(() => {
      dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    altKey('D');
    expect(
      screen.getByRole('alertdialog', { name: '¿Cerrar las 2 sesiones de Graciela Benítez?' }),
    ).toBeTruthy();
  });
});
