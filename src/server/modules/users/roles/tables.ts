// Las tablas de los roles y sus columnas (diseño de 02, § 15), para leerlas y escribirlas.
import type { Generated } from 'kysely';
import type { UsersTables } from '../data.ts';

export type RolesTables = UsersTables & {
  'users.roles': {
    id: string;
    name: string;
    description: string | null;
    system: Generated<boolean>;
    version: Generated<number>;
    created_at: Generated<Date>;
  };
  'users.role_permissions': { role_id: string; permission: string };
  'users.user_roles': { user_id: string; role_id: string };
  'users.known_permissions': { permission: string };
};

export type Role = {
  id: string;
  name: string;
  description: string | null;
  system: boolean;
  version: number;
};

export const roleColumns = ['id', 'name', 'description', 'system', 'version'] as const;
