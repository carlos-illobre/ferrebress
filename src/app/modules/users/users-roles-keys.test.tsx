import { act, fireEvent, screen, within } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { navigate, route } from '../../platform/router.ts';
import { online } from '../../platform/server/api.ts';
import { all, openRoles, role, rolesRoute, typeIn } from './users-roles-kit.tsx';
import { openUsers } from './users-test-kit.tsx';

const _rowOf = (name: string) => screen.getByRole('button', { name: `Abrir «${name}»` });
const search = (text: string) =>
  fireEvent.input(screen.getByRole('searchbox', { name: /Buscá un rol/ }), {
    target: { value: text },
  });

describe('la pestaña Roles con el teclado, sin conexión y al salir (02 · R7.13, E64)', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('teclado: el cursor arranca en el buscador; Enter abre el primero; Alt O, un rol nuevo', async () => {
    await openRoles();
    const box = screen.getByRole('searchbox', { name: /Buscá un rol/ });
    expect(document.activeElement).toBe(box);
    expect(box.hasAttribute('data-slash')).toBe(true);
    expect(screen.getByRole('button', { name: /Nuevo rol/ }).getAttribute('data-key')).toBe('o');
    search('encar');
    fireEvent.keyDown(box, { key: 'a' });
    fireEvent.keyDown(box, { key: 'Enter' });
    await screen.findByText('Información del rol');
    expect(route.get().path).toBe('/users/roles/enc');
    expect(
      role().getByRole('button', { name: 'Volver a los roles' }).getAttribute('data-key'),
    ).toBe('l');
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
});
