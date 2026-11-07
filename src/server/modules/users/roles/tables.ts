// Las tablas de los roles y sus columnas (diseño de 02, § 15), para leerlas y escribirlas.
import type { DB } from '../tables.generated.ts';

export type RolesTables = Pick<
  DB,
  | 'users.users'
  | 'users.roles'
  | 'users.role_permissions'
  | 'users.user_roles'
  | 'users.known_permissions'
>;

export type Role = {
  id: string;
  name: string;
  description: string | null;
  system: boolean;
  version: number;
};

export const roleColumns = ['id', 'name', 'description', 'system', 'version'] as const;
