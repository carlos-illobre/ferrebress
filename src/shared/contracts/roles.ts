// La forma de lo que entra y sale de las rutas de roles (02 · R7; diseño de 02, § 18). Estricta: un
// campo que no está (`system`, por ejemplo) no se acepta. Las listas, sin repetidos y con tope.
import * as z from 'zod/mini';
import { isPermission, type PermissionId, permissions } from './permissions.ts';

const version = z.int().check(z.minimum(1), z.maximum(2 ** 31 - 1));
const distinct = <T>(list: T[]) => new Set(list).size === list.length;

export const maxRoleName = 40;
export const maxRoleDescription = 200;
export const maxRolesPerPerson = 50;
// Cuántos roles puede tener el negocio (revisión de seguridad, 38).
export const maxRoles = 100;

const roleName = z.string().check(z.minLength(1), z.maxLength(maxRoleName));
const description = z.nullable(z.string().check(z.maxLength(maxRoleDescription)));
const permissionList = z
  .array(z.string().check(z.refine(isPermission)))
  .check(z.minLength(1), z.maxLength(permissions.length), z.refine(distinct));

// A quiénes se les da o se les saca el rol al guardarlo (R7.13): solo lo que cambia, sin repetidos
// y sin la misma persona en las dos listas.
export const maxHoldersPerSave = 200;
const people = z.array(z.uuid()).check(z.maxLength(maxHoldersPerSave), z.refine(distinct));
const apart = (body: { give?: string[] | undefined; take?: string[] | undefined }) =>
  !(body.give ?? []).some((id) => (body.take ?? []).includes(id));

export const createRoleBody = z.strictObject({
  name: roleName,
  description: z.optional(description),
  permissions: permissionList,
  give: z.optional(people),
});

export const changeRoleBody = z
  .strictObject({
    version,
    name: z.optional(roleName),
    description: z.optional(description),
    permissions: z.optional(permissionList),
    give: z.optional(people),
    take: z.optional(people),
  })
  .check(z.refine(apart));

// Vacía pasa el contrato: la ruta la rechaza con su motivo, `no-roles` (R7.5).
export const roleIds = z.array(z.uuid()).check(z.maxLength(maxRolesPerPerson), z.refine(distinct));

export const versionOnly = z.strictObject({ version });

// Los roles de una persona (R7.5): al menos uno.
export const userRolesBody = z.strictObject({ version, roles: roleIds });

// Un rol como lo ve la pestaña Roles. Quiénes lo tienen sale de la lista de Usuarios (R4.3, E60).
export type RoleRow = {
  id: string;
  name: string;
  description: string | null;
  system: boolean;
  version: number;
  permissions: PermissionId[];
};

export type RolesResponse = { roles: RoleRow[] };
export type RoleResponse = { role: RoleRow };

// Un rol como lo muestran la lista de Usuarios y las pastillas (R3.1).
export type RoleSummary = { id: string; name: string; description: string | null };

// «Sin permiso» (R7.7): los roles que lo tienen, con los nombres de quienes los tienen, y quiénes
// pueden darlo. Nunca correos.
export type HoldersResponse = {
  roles: { id: string; name: string; people: string[] }[];
  grantedBy: string[];
};
