// Lo que comparten las pruebas de la pestaña Roles: un rol más que el Administrador, Lucía que lo
// tiene, y abrir la pestaña con el primero elegido.
import { act, fireEvent, screen, waitFor, within } from '@testing-library/preact';
import { expect } from 'vitest';
import { graciela, openUsers, person, roleRows, roles, ruben } from './users-test-kit.tsx';

export const shift = {
  id: 'enc',
  name: 'Encargado de turno',
  description: 'Abre y cierra el local',
};
export const lucia = person({ id: 'lucia', displayName: 'Lucía Fernández', roleIds: ['enc'] });
export const encRow = {
  ...shift,
  system: false,
  version: 3,
  permissions: ['users.cut', 'users.view'],
  holders: ['lucia'],
};
export const all = { roles: [...roles, shift], people: [ruben, graciela, lucia] };
export const rolesRoute = { body: { roles: [...roleRows, encRow] } };

export const openRoles = async (routes = {}) => {
  const server = openUsers({ '/api/users': { body: all }, '/api/roles': rolesRoute, ...routes });
  await screen.findByText('Rubén Paredes');
  fireEvent.click(screen.getByRole('button', { name: /^Roles$/ }));
  await screen.findByText('Los roles del negocio');
  // El primero queda elegido solo.
  await waitFor(() => expect(document.querySelector('.role-card')).toBeTruthy());
  return server;
};
export const roleCard = () => within(document.querySelector('.role-card') as HTMLElement);
export const settle = () => act(async () => {});
