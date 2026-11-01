// Lo que comparten las pruebas de la pestaña Roles: un rol más que el Administrador, «Encargado de
// turno», que tiene Lucía; abrir la pestaña en la lista, o directo en un rol.
import { act, fireEvent, screen, within } from '@testing-library/preact';
import { navigate } from '../../platform/router.ts';
import { graciela, openUsers, person, roleRows, roles, ruben } from './users-test-kit.tsx';

export const shift = {
  id: 'enc',
  name: 'Encargado de turno',
  description: 'Abre y cierra el local',
};
export const lucia = person({ id: 'lucia', displayName: 'Lucía Fernández', roleIds: ['enc'] });
export const martin = person({ id: 'martin', displayName: 'Martín Sosa' });
export const encRow = {
  ...shift,
  system: false,
  version: 3,
  permissions: ['users.cut', 'users.view'],
};
export const everyone = [ruben, graciela, lucia, martin];
export const all = { roles: [...roles, shift], people: everyone };
export const rolesRoute = { body: { roles: [...roleRows, encRow] } };

export const openRoles = async (routes = {}, path = '/users/roles') => {
  navigate(path, { replace: true, force: true });
  const server = openUsers({ '/api/users': { body: all }, '/api/roles': rolesRoute, ...routes });
  await screen.findByText(path === '/users/roles' ? 'Encargado de turno' : 'Información del rol');
  return server;
};

// La pantalla del rol abierto y sus botones.
export const role = () => within(document.querySelector('.role-screen') as HTMLElement);
export const saveButton = () =>
  role().getAllByRole('button', { name: /Guardar rol|Crear el rol/ })[0] as HTMLButtonElement;
export const typeIn = (label: string, value: string) =>
  fireEvent.input(role().getByLabelText(new RegExp(label)), { target: { value } });
export const settle = () => act(async () => {});
