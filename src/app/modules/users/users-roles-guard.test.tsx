import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Dialogs, discardWork, halfDone, watchCrashes } from '../frame/index.ts';
import { reportCrash } from '../frame/notices/crash/crash.ts';
import { openRoles, role, saveButton, typeIn } from './users-roles-kit.tsx';
import { roleRows, toast } from './users-test-kit.tsx';

const holder = (name: string) => within(role().getByText(name).closest('li') as HTMLElement);
const give = async (name: string) => {
  fireEvent.click(role().getByRole('button', { name: /Darle este rol a…/ }));
  const picker = await screen.findByRole('alertdialog', { name: 'Darle este rol a…' });
  fireEvent.click(within(picker).getByText(name));
};

describe('lo que no se puede guardar ni dejar a medias en un rol (02 · E39, E56, E65; seguridad 42, 46)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('users-E56: sacarse «Administrar roles» se marca en el permiso; sacarse el rol, en su renglón, con «Vos»', async () => {
    const server = await openRoles({}, `/users/roles/${roleRows[0]?.id}`);
    const mine = holder('Rubén Paredes');
    expect(mine.getByText('Vos')).toBeTruthy();
    fireEvent.click(mine.getByRole('button', { name: 'Sacárselo' }));
    fireEvent.click(saveButton());
    expect(
      await screen.findByText(/Corregí lo que está marcado en rojo: «Administrar roles», tu rol\./),
    ).toBeTruthy();
    expect(holder('Rubén Paredes').getByText(/Te sacarías «Administrar roles»/)).toBeTruthy();
    fireEvent.click(holder('Rubén Paredes').getByRole('button', { name: 'Deshacer' }));
    fireEvent.click(role().getByRole('checkbox', { name: /^Administrar roles/ }));
    expect(role().getAllByText(/Te sacarías «Administrar roles»/)).toHaveLength(1);
    expect(server.bodies(`/api/roles/${roleRows[0]?.id}`)).toEqual([]);
  });

  it('quien ya tiene 50 roles: el servidor lo dice y va a su renglón', async () => {
    await openRoles(
      { '/api/roles/enc': { status: 409, body: { error: 'too-many-roles', userId: 'martin' } } },
      '/users/roles/enc',
    );
    await give('Martín Sosa');
    fireEvent.click(saveButton());
    expect(await screen.findByText(/Martín Sosa ya tiene 50 roles/)).toBeTruthy();
  });

  it('seguridad 46: si entra otra persona, el rol a medio armar se descarta y vuelve a la lista', async () => {
    await openRoles({}, '/users/roles/enc');
    typeIn('Descripción', 'A medio armar');
    expect(halfDone()).toBe(true);
    act(() => discardWork());
    await screen.findByRole('button', { name: 'Abrir «Encargado de turno»' });
    expect(halfDone()).toBe(false);
  });

  it('seguridad 42: «Algo salió mal» no guarda los nombres que se tocan en el rol', async () => {
    const stop = watchCrashes();
    await openRoles({}, '/users/roles/enc');
    fireEvent.click(holder('Lucía Fernández').getByRole('button', { name: 'Sacárselo' }));
    fireEvent.click(holder('Lucía Fernández').getByRole('button', { name: 'Deshacer' }));
    await give('Martín Sosa');
    render(<Dialogs />);
    await act(() => reportCrash());
    const dialog = screen.getAllByRole('alertdialog').at(-1) as HTMLElement;
    expect(dialog.textContent).not.toMatch(/Lucía|Martín/);
    stop();
  });

  it('users-E39: un rol que tiene una persona dice quién antes de borrar', async () => {
    await openRoles({}, '/users/roles/enc');
    fireEvent.click(role().getAllByRole('button', { name: /Borrar el rol/ })[0] as HTMLElement);
    await waitFor(() =>
      expect(toast()).toBe(
        'No se puede borrar: lo tiene Lucía Fernández. Primero hay que sacárselo.',
      ),
    );
  });
});
