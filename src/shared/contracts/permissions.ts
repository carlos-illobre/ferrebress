// Los permisos (02 · R7.1): una lista fija que define cada capítulo para lo suyo, con su nombre y
// qué deja hacer, agrupados por parte de la aplicación. La comparten el servidor (que controla cada
// pedido) y la aplicación (que muestra solo lo que se puede usar). Un capítulo nuevo suma sus filas.

export const permissionGroups = {
  users: { name: 'Usuarios', detail: 'Las personas, sus roles, sesiones y huellas' },
  offline: { name: 'Sin conexión', detail: 'Entrar con la huella sin internet' },
} as const;

export type PermissionGroup = keyof typeof permissionGroups;

export const permissions = [
  {
    id: 'users.view',
    group: 'users',
    name: 'Ver las personas',
    explanation:
      'Abrir Usuarios: la lista y la tarjeta de cada persona, con sus sesiones y sus celulares con huella.',
    includes: [],
  },
  {
    id: 'users.manage',
    group: 'users',
    name: 'Administrar personas',
    explanation:
      'Cambiar el nombre y el correo, borrar, dar de baja y de alta. Con «Administrar roles», autorizar.',
    includes: ['users.view'],
  },
  {
    id: 'users.cut',
    group: 'users',
    name: 'Cortar sesiones y huellas',
    explanation:
      'Cerrar una sesión o todas, quitar un celular con huella y «Se perdió un celular» de cualquier persona.',
    includes: ['users.view'],
  },
  {
    id: 'roles.manage',
    group: 'users',
    name: 'Administrar roles',
    explanation:
      'Abrir la pestaña Roles, armar los roles y darles o quitarles roles a las personas.',
    includes: ['users.view'],
  },
  {
    id: 'offline.work',
    group: 'offline',
    name: 'Trabajar sin conexión',
    explanation: 'Prender en su celular la entrada con la huella sin internet, desde Más.',
    includes: [],
  },
] as const satisfies readonly {
  id: string;
  group: PermissionGroup;
  name: string;
  explanation: string;
  includes: readonly string[];
}[];

export type PermissionId = (typeof permissions)[number]['id'];
export type Permission = (typeof permissions)[number];

const byId = new Map<string, Permission>(permissions.map((one) => [one.id, one]));

export const permissionIds: PermissionId[] = permissions.map((one) => one.id);

export const isPermission = (value: unknown): value is PermissionId =>
  typeof value === 'string' && byId.has(value);

export const permissionOf = (id: PermissionId): Permission => byId.get(id) as Permission;

// Lo elegido más lo que eso incluye, sin repetir y en orden: así se guarda un rol (02 · R7.1).
export function withIncluded(ids: readonly PermissionId[]): PermissionId[] {
  const all = new Set<PermissionId>(ids);
  for (const id of ids) for (const included of permissionOf(id).includes) all.add(included);
  return [...all].sort();
}

// Si la persona puede: la usan el marco y las pantallas para mostrar solo lo permitido (R7.7).
export const can = (
  person: { permissions: readonly string[] } | undefined,
  id: PermissionId,
): boolean => person?.permissions.includes(id) ?? false;

// La huella de los permisos de alguien (8 letras): la lleva la cabecera de cada respuesta, y la
// aplicación la compara con la de la persona que tiene para saber que cambiaron (R7.8). FNV-1a.
export function permissionsHash(ids: readonly string[]): string {
  let hash = 0x811c9dc5;
  for (const char of [...ids].sort().join(',')) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, '0');
}
