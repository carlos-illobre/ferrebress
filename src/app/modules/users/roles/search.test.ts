import type { RoleRow } from '@ferrebress/shared/contracts/roles';
import type { PersonRow } from '@ferrebress/shared/contracts/users';
import { describe, expect, it } from 'vitest';
import { filterRoles, searchIndex } from './search.ts';

const role = (
  id: string,
  name: string,
  description: string | null,
  permissions: RoleRow['permissions'],
) => ({ id, name, description, system: false, version: 1, permissions }) as RoleRow;
const person = (id: string, displayName: string, email: string, roleIds: string[], active = true) =>
  ({ id, displayName, email, roleIds, active }) as PersonRow;

const roles = [
  role('e', 'Encargado', 'Abre y cierra el local', ['users.cut', 'users.view']),
  role('c', 'Cajero', null, ['offline.work']),
];
const people = [
  person('l', 'Lucía Fernández', 'lucia@example.com', ['e']),
  person('m', 'Martín Sosa', 'martin@example.com', ['c']),
  person('b', 'Beatriz Baja', 'bea@example.com', ['c'], false),
];
const names = (query: string) =>
  filterRoles(searchIndex(roles, people), query).map((one) => one.name);

describe('buscar un rol (02 · R7.12)', () => {
  it('users-E61: por el nombre o la descripción, sin mayúsculas ni tildes', () => {
    expect(names('encar')).toEqual(['Encargado']);
    expect(names('LOCAL')).toEqual(['Encargado']);
  });

  it('users-E61: por el nombre de un permiso', () => {
    expect(names('cortar sesiones')).toEqual(['Encargado']);
    expect(names('sin conexion')).toEqual(['Cajero']);
  });

  it('users-E61: por el nombre o el correo de alguien activo que lo tiene', () => {
    expect(names('lucia')).toEqual(['Encargado']);
    expect(names('martin@')).toEqual(['Cajero']);
    expect(names('beatriz')).toEqual([]);
  });

  it('users-E61: vacío, todos; algo que nadie tiene, ninguno', () => {
    expect(names('  ')).toEqual(['Encargado', 'Cajero']);
    expect(names('zapatos')).toEqual([]);
  });
});
