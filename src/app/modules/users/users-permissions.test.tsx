// Usuarios según los permisos de quien mira (02 · R7.5, R7.7, R7.11; E41 a E43, E46, E54, E58): los
// roles de una persona en su tarjeta, el filtro por rol, y lo que no aparece sin el permiso o sobre
// quien tiene más.
import type { Person } from '@ferrebress/shared/contracts/sign-in';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/preact';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { person as me } from '../sign-in/index.ts';
import {
  access,
  graciela,
  inCard,
  openUsers,
  person,
  roleRows,
  roles,
  row,
  ruben,
  toast,
  viewer,
} from './users-test-kit.tsx';

const admin = roles[0]?.id as string;
const shift = { id: 'enc', name: 'Encargado de turno', description: null };
const shiftRow = { ...shift, system: false, version: 1, permissions: ['users.view'], holders: [] };
const lucia = person({ id: 'lucia', displayName: 'Lucía Fernández', roleIds: ['enc'] });
const all = { body: { roles: [...roles, shift], people: [ruben, graciela, lucia] } };
const choose = async (name: RegExp) => {
  await screen.findByText('Rubén Paredes');
  fireEvent.click(row(name));
};
const as = (permissions: Person['permissions']) => me.set({ ...viewer, permissions });

describe('Usuarios según los permisos', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    me.set(undefined);
  });

  it('users-E54: el filtro por rol muestra solo a quienes lo tienen', async () => {
    openUsers({ '/api/users': all });
    await screen.findByText('Rubén Paredes');
    const chips = document.querySelector('.users-role-chips') as HTMLElement;
    fireEvent.click(within(chips).getByRole('button', { name: /Encargado de turno 1/ }));
    expect(screen.queryByText('Rubén Paredes')).toBeNull();
    expect(screen.getByText('Lucía Fernández')).toBeTruthy();
    fireEvent.click(within(chips).getByRole('button', { name: 'Todos los roles' }));
    expect(screen.getByText('Rubén Paredes')).toBeTruthy();
  });

  it('users-E43, R7.5: tildar sus roles, deshacer, al menos uno, y guardar con lo que va a poder', async () => {
    const server = openUsers({
      '/api/users': all,
      '/api/roles': { body: { roles: [...roleRows, shiftRow] } },
      '/api/users/lucia/access': { body: access },
      '/api/users/lucia/roles': { body: { roles: [admin] } },
    });
    await choose(/Lucía/);
    await new Promise((r) => setTimeout(r, 300));
    console.log('CARD', document.querySelector('.users-card')?.textContent);
    const picker = await inCard().findByRole('group', { name: 'Roles de Lucía' });
    const abilities = () =>
      (document.querySelector('.person-abilities') as HTMLElement).textContent;
    expect(abilities()).toContain('Ver las personasEncargado de turno');
    fireEvent.click(within(picker).getByRole('checkbox', { name: /Encargado/ }));
    fireEvent.click(inCard().getByRole('button', { name: /Guardar los roles/ }));
    expect((await inCard().findByRole('alert')).textContent).toContain('al menos un rol');
    fireEvent.click(within(picker).getByRole('checkbox', { name: /Administrador/ }));
    expect(abilities()).toContain('Administrar rolesAdministrador');
    fireEvent.click(inCard().getByRole('button', { name: /Deshacer/ }));
    expect(inCard().queryByRole('button', { name: /Guardar los roles/ })).toBeNull();
    fireEvent.click(within(picker).getByRole('checkbox', { name: /Administrador/ }));
    fireEvent.click(within(picker).getByRole('checkbox', { name: /Encargado/ }));
    fireEvent.click(inCard().getByRole('button', { name: /Guardar los roles/ }));
    await waitFor(() => expect(toast()).toBe('Roles de Lucía Fernández guardados'));
    expect(server.bodies('/api/users/lucia/roles')).toEqual([{ version: 1, roles: [admin] }]);
  });

  it('users-E42: autorizar no se manda sin ningún rol tildado', async () => {
    const server = openUsers();
    await screen.findByText('Rubén Paredes');
    fireEvent.click(
      screen.getAllByRole('button', { name: /Autorizar a alguien/ })[0] as HTMLElement,
    );
    const dialog = screen.getByRole('alertdialog');
    fireEvent.input(within(dialog).getByRole('textbox', { name: /Correo/ }), {
      target: { value: 'nueva@example.com' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: /^Autorizar/ }));
    expect((await within(dialog).findByRole('alert')).textContent).toContain('al menos un rol');
    fireEvent.click(within(dialog).getByRole('checkbox', { name: /Administrador/ }));
    expect(within(dialog).queryByRole('alert')).toBeNull();
    fireEvent.click(within(dialog).getByRole('checkbox', { name: /Administrador/ }));
    expect(server.bodies('/api/users')).toHaveLength(1);
  });

  it('users-E41, E46: con «Ver las personas» solo, se ve todo y no se cambia nada', async () => {
    as(['users.view']);
    openUsers({ '/api/users/graciela/access': { body: access } });
    await choose(/Graciela/);
    await inCard().findByText('Chrome en Windows');
    expect(screen.queryByRole('button', { name: /Autorizar a alguien/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /Se perdió un celular/ })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Roles$/ })).toBeNull();
    expect(inCard().queryByRole('button', { name: /Cambiar el nombre/ })).toBeNull();
    expect(inCard().queryByRole('button', { name: /Cerrar todas/ })).toBeNull();
    expect(inCard().queryByRole('button', { name: /Dar de baja/ })).toBeNull();
    expect(inCard().queryByRole('group', { name: /Roles de/ })).toBeNull();
  });

  it('users-E58: sobre quien tiene más, sin cambiarle el correo, darla de baja ni cortarle', async () => {
    as(['users.view', 'users.manage', 'users.cut']);
    const above = { ...graciela, outranks: true };
    const never = person({
      id: 'nuevo',
      displayName: 'Nuevo',
      lastSignInAt: null,
      neverSignedIn: true,
      outranks: true,
    });
    const off = person({ id: 'baja', displayName: 'De baja', active: false, outranks: true });
    openUsers({
      '/api/users': { body: { roles, people: [ruben, above, never, off] } },
      '/api/users/graciela/access': { body: access },
    });
    await choose(/Graciela/);
    await inCard().findByText('Chrome en Windows');
    expect(inCard().getByRole('button', { name: /Cambiar el nombre/ })).toBeTruthy();
    expect(inCard().queryByRole('button', { name: /Cerrar todas/ })).toBeNull();
    expect(inCard().queryByRole('button', { name: /Dar de baja/ })).toBeNull();
    fireEvent.click(document.querySelector('.users-back') as HTMLElement);
    fireEvent.click(row(/Nuevo/));
    expect(inCard().queryByRole('button', { name: /Cambiar el correo/ })).toBeNull();
    // R7.11: tampoco se borra su alta.
    expect(inCard().queryByRole('button', { name: /Borrar/ })).toBeNull();
    fireEvent.click(document.querySelector('.users-back') as HTMLElement);
    fireEvent.click(row(/De baja/));
    expect(inCard().queryByRole('button', { name: /Dar de alta/ })).toBeNull();
    await act(async () => {});
  });

  it('users-E43, R7.5: en el celular, interruptores de roles, «Igual que alguien» y el pie con «Guardar»', async () => {
    // Angosto: lo de la computadora no, lo del celular sí.
    const phone = (query: string) => ({ matches: query.includes('max-width'), media: query });
    const server = openUsers({
      '/api/users': all,
      '/api/roles': { body: { roles: [...roleRows, shiftRow] } },
      '/api/users/lucia/access': { body: access },
      '/api/users/lucia/roles': { body: { roles: [admin] } },
    });
    vi.stubGlobal('matchMedia', phone);
    await choose(/Lucía/);
    const roles = await inCard().findByRole('group', { name: '¿Qué puede hacer Lucía?' });
    expect(inCard().queryByRole('button', { name: /^Guardar$/ })).toBeNull();
    const like = inCard().getByRole('combobox', { name: /Igual que alguien/ });
    fireEvent.change(like, { target: { value: '' } });
    fireEvent.change(like, { target: { value: 'graciela' } });
    expect(
      within(roles).getByRole('switch', { name: 'Administrador' }).getAttribute('aria-checked'),
    ).toBe('true');
    const foot = document.querySelector('.person-foot') as HTMLElement;
    expect(foot.textContent).toContain('Darle un rol pide confirmar que sos vos');
    expect(foot.querySelector('.gone')?.textContent).toBe('Encargado de turno');
    fireEvent.click(within(roles).getByRole('switch', { name: 'Administrador' }));
    fireEvent.click(within(foot).getByRole('button', { name: /^Guardar$/ }));
    expect((await inCard().findByRole('alert')).textContent).toContain('al menos un rol');
    fireEvent.click(within(roles).getByRole('switch', { name: 'Administrador' }));
    fireEvent.click(inCard().getByRole('button', { name: /^Guardar$/ }));
    await waitFor(() =>
      expect(server.bodies('/api/users/lucia/roles')).toEqual([{ version: 1, roles: [admin] }]),
    );
  });

  it('en la computadora, el número de un rol lo tilda con el cursor en la lista', async () => {
    openUsers({
      '/api/users': all,
      '/api/roles': { body: { roles: [...roleRows, shiftRow] } },
      '/api/users/lucia/access': { body: access },
    });
    await choose(/Lucía/);
    const picker = await inCard().findByRole('group', { name: 'Roles de Lucía' });
    const first = within(picker).getByRole('checkbox', {
      name: /Administrador/,
    }) as HTMLInputElement;
    fireEvent.keyDown(first, { key: '1' });
    expect(first.checked).toBe(true);
    fireEvent.keyDown(first, { key: '1', altKey: true });
    fireEvent.keyDown(first, { key: 'x' });
    expect(first.checked).toBe(true);
  });
});
