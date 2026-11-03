// La tarjeta de una persona muestra solo lo de quien está elegido (02 · R5.1): si se elige a otra
// persona mientras llegaba lo de la anterior, eso no pisa la tarjeta.
import { fireEvent, screen, waitFor } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { held } from '../../testing/fake-server.ts';
import { access, inCard, openUsers, row, toast } from './users-test-kit.tsx';

const choose = async (name: RegExp) => {
  await screen.findByText('Rubén Paredes');
  fireEvent.click(row(name));
};

describe('la tarjeta, con respuestas que llegan tarde', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('la tarjeta es de quien está elegido: lo de otra persona que llega tarde no se muestra', async () => {
    const late = held({ body: access });
    const closing = held({ body: { closed: 1 } });
    const none = { body: { sessions: [], phones: [] } };
    openUsers({
      '/api/users/graciela/access': [{ body: access }, late.reply],
      '/api/users/graciela/sessions/s1/close': closing.reply,
      '/api/users/ruben/access': none,
    });
    await choose(/Graciela/);
    await inCard().findByText('Chrome en Windows');
    // Cerrar una sesión de Graciela y, antes de que conteste, elegir a Rubén.
    fireEvent.click(inCard().getAllByRole('button', { name: 'Cerrar' })[0] as HTMLElement);
    fireEvent.click(row(/Rubén/));
    await inCard().findByText('Sin sesiones abiertas en otros dispositivos.');
    closing.release();
    await waitFor(() => expect(toast()).toBe('Sesión cerrada · Chrome en Windows'));
    // Volver a Graciela y enseguida a Rubén: lo de Graciela llega último y no pisa a Rubén.
    fireEvent.click(row(/Graciela/));
    fireEvent.click(row(/Rubén/));
    await inCard().findByText('Sin sesiones abiertas en otros dispositivos.');
    late.release();
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(inCard().queryByText('Chrome en Windows')).toBeNull();
  });
});
