// Los permisos (02 · R7.1): una lista fija que define cada capítulo para lo suyo, con su nombre y
// qué deja hacer, agrupados por parte de la aplicación. La comparten el servidor (que controla cada
// pedido) y la aplicación (que muestra solo lo que se puede usar). Un capítulo nuevo suma sus filas.

export const permissionGroups = {
  users: { name: 'Usuarios', detail: 'Las personas, sus roles, sesiones y huellas' },
  offline: { name: 'Sin conexión', detail: 'Entrar con la huella sin internet' },
  administration: { name: 'Administración', detail: 'Los ajustes que valen para todos' },
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
    id: 'audit-log.view',
    group: 'users',
    name: 'Ver quién hizo qué',
    explanation: 'Abrir Quién hizo qué y ver todas las acciones de todos, con su detalle.',
    includes: ['users.view'],
  },
  {
    id: 'offline.work',
    group: 'offline',
    name: 'Trabajar sin conexión',
    explanation: 'Prender en su celular la entrada con la huella sin internet, desde Más.',
    includes: [],
  },
  {
    id: 'settings.change',
    group: 'administration',
    name: 'Cambiar los ajustes',
    explanation:
      'Cambiar en Administración el redondeo, los márgenes rápidos, los tiempos de la sesión y los días del vínculo.',
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
