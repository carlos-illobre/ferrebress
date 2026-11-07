// Las tablas del esquema `users` como las dejan sus migraciones. Lo genera `pnpm db:types`
// (ADR-018) y `pnpm check` controla que esté al día: no se edita a mano.
import type { ColumnType } from "kysely";

export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export interface UsersKnownPermissions {
  permission: string;
}

export interface UsersRolePermissions {
  permission: string;
  role_id: string;
}

export interface UsersRoles {
  created_at: Generated<Timestamp>;
  description: string | null;
  id: string;
  name: string;
  system: Generated<boolean>;
  version: Generated<number>;
}

export interface UsersUserRoles {
  role_id: string;
  user_id: string;
}

export interface UsersUsers {
  active: Generated<boolean>;
  authorized_by: string | null;
  created_at: Generated<Timestamp>;
  deactivated_at: Timestamp | null;
  email: string;
  google_name: string | null;
  google_subject: string | null;
  id: string;
  last_sign_in_at: Timestamp | null;
  name: string | null;
  roles_changed_at: Timestamp | null;
  roles_changed_by: string | null;
  version: Generated<number>;
}

export interface DB {
  "users.known_permissions": UsersKnownPermissions;
  "users.role_permissions": UsersRolePermissions;
  "users.roles": UsersRoles;
  "users.user_roles": UsersUserRoles;
  "users.users": UsersUsers;
}
