import { act, fireEvent, screen, waitFor, within } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { navigate, route } from '../../platform/router.ts';
import { online } from '../../platform/server/api.ts';
import { startKeyboard } from '../../testing/keyboard.ts';
import {
  all,
  openRoles,
  role,
  rolesRoute,
  typeIn,
} from '../../views/basic/users/users-roles-kit.tsx';
import { openUsers, roleRows, toast } from '../../views/basic/users/users-test-kit.tsx';

const alt = (letter: string) =>
  fireEvent.keyDown(window, { key: letter, code: `Key${letter}`, altKey: true });
const search = (text: string) =>
  fireEvent.input(screen.getByRole('searchbox', { name: /Buscá un rol/ }), {
    target: { value: text },
  });

describe('la pestaña Roles con el teclado, sin conexión y al salir (02 · R7.13, E64)', () => {
  let stop: (() => void) | undefined;
  afterEach(() => {
    stop?.();
    stop = undefined;
    vi.unstubAllGlobals();
  });

  it('teclado: el cursor arranca en el buscador; Enter abre el primero; Alt L vuelve; Alt O, un rol nuevo', async () => {
    stop = startKeyboard();
    await openRoles();
    const box = screen.getByRole('searchbox', { name: /Buscá un rol/ });
    expect(document.activeElement).toBe(box);
    expect(box.hasAttribute('data-slash')).toBe(true);
    expect(
      screen.getByRole('button', { name: /Nuevo rol/ }).querySelector('kbd')?.textContent,
    ).toBe('O');
    search('encar');
    fireEvent.keyDown(box, { key: 'a' });
    fireEvent.keyDown(box, { key: 'Enter' });
    await screen.findByText('Información del rol');
    expect(route.get().path).toBe('/users/roles/enc');
    alt('L');
    await screen.findByRole('button', { name: /Nuevo rol/ });
    expect(route.get().path).toBe('/users/roles');
    alt('O');
    await screen.findByText('Información del rol');
    expect(route.get().path).toBe('/users/roles/new');
  });

  it('teclado: en un rol, Alt R elige a quién darlo, Alt G guarda y Alt T descarta al salir', async () => {
    stop = startKeyboard();
    const server = await openRoles(
      { '/api/roles/enc': [{ status: 409, body: { error: 'role-name-taken' } }] },
      '/users/roles/enc',
    );
    alt('R');
    expect(await screen.findByRole('alertdialog', { name: 'Darle este rol a…' })).toBeTruthy();
    act(() => {
      dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    // Sin cambios, Alt G no manda nada; Alt B no borra un rol que alguien tiene, y lo dice.
    alt('G');
    alt('B');
    await waitFor(() => expect(toast()).toContain('No se puede borrar'));
    expect(server.bodies('/api/roles/enc')).toEqual([]);
    typeIn('Nombre del rol', 'Cajero');
    alt('G');
    await waitFor(() => expect(server.bodies('/api/roles/enc')).toHaveLength(1));
    navigate('/users');
    await screen.findByRole('alertdialog', { name: '¿Descartar los cambios del rol?' });
    alt('T');
    await waitFor(() => expect(route.get().path).toBe('/users'));
  });

  it('teclado: Alt U duplica el rol', async () => {
    stop = startKeyboard();
    await openRoles({}, '/users/roles/enc');
    alt('U');
    await waitFor(() => expect(route.get().path).toBe('/users/roles/new'));
    expect(route.get().state).toEqual({ duplicate: 'enc' });
  });

  it('si no se pudieron traer los roles, lo dice y deja reintentar', async () => {
    navigate('/users/roles', { replace: true, force: true });
    openUsers({
      '/api/users': { body: all },
      '/api/roles': [{ status: 500, body: { error: 'x' } }, rolesRoute],
    });
    fireEvent.click(await screen.findByRole('button', { name: /Reintentar/ }));
    expect(await screen.findByRole('button', { name: 'Abrir «Encargado de turno»' })).toBeTruthy();
  });

  it('sin conexión, el rol dice que se guarda cuando vuelva', async () => {
    await openRoles({}, '/users/roles/enc');
    act(() => online.set(false));
    expect(role().getByText('Sin conexión: se guarda cuando vuelva.')).toBeTruthy();
    act(() => online.set(true));
  });

  it('users-E64: salir de un rol nuevo con algo escrito avisa que todavía no se creó', async () => {
    await openRoles({}, '/users/roles/new');
    typeIn('Nombre del rol', 'Caja');
    navigate('/users');
    const ask = await screen.findByRole('alertdialog', { name: '¿Descartar los cambios del rol?' });
    expect(
      within(ask).getByText('El rol nuevo todavía no se creó. Si descartás, no queda nada.'),
    ).toBeTruthy();
  });

  it('en el celular: la barra de arriba con borrar, duplicar y «Guardar», y el resumen lleva a su paso', async () => {
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    await openRoles({}, '/users/roles/enc');
    const bar = within(document.querySelector('.role-phone-bar') as HTMLElement);
    expect(bar.getByRole('button', { name: 'Borrar' })).toBeTruthy();
    expect(bar.getByRole('button', { name: 'Duplicar' })).toBeTruthy();
    expect((bar.getByRole('button', { name: /^Guardar/ }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    const summary = within(screen.getByRole('navigation', { name: 'Resumen del rol' }));
    fireEvent.click(summary.getByRole('button', { name: /2 permisos/ }));
    fireEvent.click(summary.getByRole('button', { name: /1 persona/ }));
    expect(scroll).toHaveBeenCalledTimes(2);
    fireEvent.click(document.querySelector('.role-crumbs .role-back') as HTMLElement);
    await screen.findByRole('button', { name: 'Abrir «Encargado de turno»' });
  });

  it('en el celular, el Administrador no muestra borrar, pero sí duplicar', async () => {
    await openRoles({}, `/users/roles/${roleRows[0]?.id}`);
    const bar = () => within(document.querySelector('.role-phone-bar') as HTMLElement);
    expect(bar().queryByRole('button', { name: 'Borrar' })).toBeNull();
    expect(bar().getByRole('button', { name: 'Duplicar' })).toBeTruthy();
  });
});
