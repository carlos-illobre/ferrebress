// Los rechazos del servidor en la tarjeta (diseño de 02, § 4): una versión vieja, alguien que ya
// no está y un error cualquiera.
import { fireEvent, screen, waitFor } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { googleFrame, startReply } from '../sign-in/sign-in-test-kit.ts';
import { access, inCard, openUsers, row, ruben, toast } from './users-test-kit.tsx';

const choose = async (name: RegExp) => {
  await screen.findByText('Rubén Paredes');
  fireEvent.click(row(name));
};
const press = (input: HTMLElement, key: string) => fireEvent.keyDown(input, { key });

describe('los rechazos en la tarjeta', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('users-E30: con una versión vieja, la trae como quedó; si ya no está, la saca; si no, lo dice', async () => {
    const changed = { ...ruben, displayName: 'Rubén P.', version: 5 };
    openUsers({
      '/api/users/ruben/access': { body: { sessions: [], phones: [] } },
      '/api/users/ruben': [
        { status: 409, body: { error: 'changed', person: changed } },
        { status: 500, body: { error: 'internal' } },
      ],
      '/api/users/sofia/activate': { status: 404, body: { error: 'not-found' } },
    });
    await choose(/Rubén/);
    fireEvent.click(inCard().getByRole('button', { name: 'Cambiar el nombre' }));
    let input = inCard().getByRole('textbox') as HTMLInputElement;
    input.value = 'Otro';
    press(input, 'Enter');
    await waitFor(() => expect(toast()).toContain('Alguien la cambió recién'));
    expect(row(/Rubén P\./)).toBeTruthy();
    fireEvent.click(inCard().getByRole('button', { name: 'Cambiar el nombre' }));
    input = inCard().getByRole('textbox') as HTMLInputElement;
    input.value = 'Otro';
    press(input, 'Enter');
    await waitFor(() => expect(toast()).toBe('No se pudo. Probá de nuevo.'));
    fireEvent.click(row(/Sofía/));
    fireEvent.click(inCard().getByRole('button', { name: /Dar de alta/ }));
    await waitFor(() => expect(toast()).toContain('Ya no está'));
    expect(screen.queryByText('Sofía Blanco')).toBeNull();
  });

  it('si el servidor falla, cada botón lo dice y la persona sigue como estaba', async () => {
    const failed = { status: 500, body: { error: 'internal' } };
    const server = openUsers({
      '/api/users/graciela/access': { body: access },
      '/api/users/graciela/sessions/s1/close': failed,
      '/api/users/graciela/sessions/close': failed,
      '/api/users/graciela/phones/f1/cut': failed,
      '/api/users/graciela/deactivate': failed,
      '/api/users/pedro/delete': failed,
    });
    await choose(/Graciela/);
    await inCard().findByText('Chrome en Windows');
    const fails = async (path: string, press: () => void) => {
      press();
      await waitFor(() => expect(server.bodies(path)).toHaveLength(1));
      await waitFor(() => expect(toast()).toBe('No se pudo. Probá de nuevo.'));
    };
    const last = (name: RegExp) => screen.getAllByRole('button', { name }).at(-1) as HTMLElement;
    await fails('/api/users/graciela/sessions/s1/close', () =>
      fireEvent.click(inCard().getAllByRole('button', { name: 'Cerrar' })[0] as HTMLElement),
    );
    await fails('/api/users/graciela/phones/f1/cut', () =>
      fireEvent.click(inCard().getAllByRole('button', { name: 'Quitar' })[0] as HTMLElement),
    );
    fireEvent.click(inCard().getByRole('button', { name: /Cerrar todas/ }));
    await fails('/api/users/graciela/sessions/close', () => fireEvent.click(last(/Cerrar todas/)));
    fireEvent.click(inCard().getByRole('button', { name: /Dar de baja/ }));
    await fails('/api/users/graciela/deactivate', () => fireEvent.click(last(/Dar de baja/)));
    fireEvent.click(row(/pedro/));
    await fails('/api/users/pedro/delete', () =>
      fireEvent.click(inCard().getByRole('button', { name: /Borrar el alta/ })),
    );
    expect(row(/Graciela/).classList.contains('off')).toBe(false);
    expect(row(/pedro/)).toBeTruthy();
  });

  it('users-R3.8: cambiar el correo pide confirmar y lo repite solo; un correo repetido lo dice', async () => {
    const frame = googleFrame();
    const server = openUsers({
      '/api/users/pedro': [
        { status: 403, body: { error: 'confirm-first' } },
        { status: 409, body: { error: 'email-taken' } },
      ],
      '/api/start': startReply(),
      '/api/session/confirm/google': {},
    });
    await choose(/pedro/);
    fireEvent.click(inCard().getByRole('button', { name: 'Cambiar el correo' }));
    const input = inCard().getByRole('textbox') as HTMLInputElement;
    input.value = 'graciela@example.com';
    press(input, 'Enter');
    await screen.findByRole('alertdialog', { name: 'Confirmá que sos vos' });
    frame.ready();
    await waitFor(() => expect(server.bodies('/api/start')).toHaveLength(1));
    frame.credential('pase');
    await waitFor(() => expect(server.bodies('/api/users/pedro')).toHaveLength(2));
    await waitFor(() => expect(toast()).toContain('ya está cargado'));
  });
});
