// Las teclas de Usuarios en la computadora (00 · R2.8; diseño de 02, § 8).
import { act, screen, waitFor } from '@testing-library/preact';
import { describe, expect, it } from 'vitest';
import { startKeyboard } from '../../platform/keyboard.ts';
import { openUsers } from './users-test-kit.tsx';

const lost = (phones: object[]) => ({
  body: { people: [{ userId: 'graciela', displayName: 'Graciela Benítez', self: false, phones }] },
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
