// El borrador de un rol (02 · R7.13; diseño de 02, § 20): lo que se va armando en la pantalla del
// rol hasta «Guardar rol». Reglas sin pantalla: sale de un rol, de nada o de duplicar otro; cambia
// con funciones puras; dice si hay algo para guardar, lo que ya se sabe que no se puede (R7.3,
// R7.5, E56) y arma el pedido con solo lo que cambió, así no pisa lo que otro cambió mientras tanto.
import {
  type PermissionId,
  permissionOf,
  withIncluded,
} from '@ferrebress/shared/contracts/permissions';
import type { RoleRow } from '@ferrebress/shared/contracts/roles';

type Fields = { name: string; description: string; permissions: PermissionId[] };

export type Draft = Fields & {
  // Sin id, es nuevo.
  id: string | null;
  version: number;
  system: boolean;
  original: Fields & { holders: string[] };
  give: string[];
  take: string[];
};

const fresh = (fields: Fields, holders: string[] = []): Draft['original'] => ({
  ...fields,
  holders,
});

export const emptyDraft = (name = ''): Draft => {
  const fields = { name, description: '', permissions: [] };
  return {
    ...fields,
    id: null,
    version: 0,
    system: false,
    original: fresh({ name: '', description: '', permissions: [] }),
    give: [],
    take: [],
  };
};

export const fromRole = (role: RoleRow, holders: string[]): Draft => {
  const fields = {
    name: role.name,
    description: role.description ?? '',
    permissions: [...role.permissions],
  };
  return {
    ...fields,
    id: role.id,
    version: role.version,
    system: role.system,
    original: fresh(fields, holders),
    give: [],
    take: [],
  };
};

// Duplicar (E38): sus permisos y su descripción, sin personas, con un nombre para cambiar.
export const duplicateOf = (role: RoleRow): Draft => ({
  ...emptyDraft(`Copia de ${role.name}`),
  description: role.description ?? '',
  permissions: [...role.permissions],
});

// Los permisos tildados que incluyen a este (R7.1): mientras estén, no se destilda.
export const tiedBy = (draft: Draft, id: PermissionId): PermissionId[] =>
  draft.permissions.filter((other) =>
    (permissionOf(other).includes as readonly string[]).includes(id),
  );

export function toggle(draft: Draft, id: PermissionId): Draft {
  const on = draft.permissions.includes(id);
  if (on && tiedBy(draft, id).length > 0) return draft;
  const permissions = on
    ? draft.permissions.filter((one) => one !== id)
    : withIncluded([...draft.permissions, id]);
  return { ...draft, permissions: [...permissions].sort() };
}

const without = (list: string[], id: string) => list.filter((one) => one !== id);

export const give = (draft: Draft, userId: string): Draft =>
  draft.original.holders.includes(userId)
    ? { ...draft, take: without(draft.take, userId) }
    : { ...draft, give: [...without(draft.give, userId), userId] };

export const take = (draft: Draft, userId: string): Draft =>
  draft.original.holders.includes(userId)
    ? { ...draft, take: [...without(draft.take, userId), userId] }
    : { ...draft, give: without(draft.give, userId) };

// Deshacer lo que se marcó de una persona: vuelve a como estaba.
export const undo = (draft: Draft, userId: string): Draft => ({
  ...draft,
  give: without(draft.give, userId),
  take: without(draft.take, userId),
});

// Quiénes lo van a tener al guardar.
export const holdersOf = (draft: Draft): string[] => [
  ...draft.original.holders.filter((id) => !draft.take.includes(id)),
  ...draft.give,
];

const clean = (text: string) => text.replace(/\s+/g, ' ').trim();
const same = (a: readonly string[], b: readonly string[]) =>
  [...a].sort().join() === [...b].sort().join();

const changed = (draft: Draft) => ({
  name: clean(draft.name) !== draft.original.name,
  description: clean(draft.description) !== draft.original.description,
  permissions: !same(draft.permissions, draft.original.permissions),
});

// Hay algo para guardar: un duplicado, recién copiado, ya lo tiene.
export const isDirty = (draft: Draft): boolean =>
  Object.values(changed(draft)).some(Boolean) || draft.give.length > 0 || draft.take.length > 0;

type CreateRequest = {
  name: string;
  description: string | null;
  permissions: PermissionId[];
  give?: string[];
};
type ChangeRequest = {
  version: number;
  name?: string;
  description?: string | null;
  permissions?: PermissionId[];
  give?: string[];
  take?: string[];
};

const people = (draft: Draft) => ({
  ...(draft.give.length > 0 && { give: draft.give }),
  ...(draft.take.length > 0 && { take: draft.take }),
});

// El pedido: para uno nuevo, todo; para uno que existe, solo lo que cambió (diseño de 02, § 18).
export function toRequest(draft: Draft): CreateRequest | ChangeRequest {
  const description = clean(draft.description) || null;
  if (!draft.id)
    return {
      name: clean(draft.name),
      description,
      permissions: draft.permissions,
      ...people(draft),
    };
  const what = changed(draft);
  return {
    version: draft.version,
    ...(what.name && { name: clean(draft.name) }),
    ...(what.description && { description }),
    ...(what.permissions && { permissions: draft.permissions }),
    ...people(draft),
  };
}

// 409 changed: el rol como quedó, con lo que cambió el borrador encima (diseño de 02, § 19).
export function reapply(draft: Draft, role: RoleRow, holders: string[]): Draft {
  const base = fromRole(role, holders);
  const what = changed(draft);
  const added = draft.permissions.filter((id) => !draft.original.permissions.includes(id));
  const removed = draft.original.permissions.filter((id) => !draft.permissions.includes(id));
  const permissions = withIncluded([
    ...base.permissions.filter((id) => !removed.includes(id)),
    ...added,
  ]);
  const merged = draft.give.reduce(give, draft.take.reduce(take, base));
  return {
    ...merged,
    ...(what.name && { name: draft.name }),
    ...(what.description && { description: draft.description }),
    permissions: [...permissions].sort(),
  };
}

// Lo que impide darle o sacarle el rol a una persona (E65).
export type PersonError = 'no-roles' | 'person-inactive' | 'person-missing' | 'too-many-roles';

// Lo que se sabe sin preguntarle al servidor (R7.3, R7.5, E56); el servidor tiene la última palabra.
export type DraftErrors = {
  name?: 'role-no-name' | 'role-name-taken';
  permissions?: true;
  people?: Record<string, PersonError>;
  self?: 'roles.manage' | 'users.manage';
};

type Context = { roles: RoleRow[]; me: string; roleIdsOf: Record<string, string[]> };

const nameError = (draft: Draft, roles: RoleRow[]) => {
  const name = clean(draft.name).toLocaleLowerCase();
  if (!name) return 'role-no-name';
  const taken = roles.some((one) => one.id !== draft.id && one.name.toLocaleLowerCase() === name);
  return taken ? 'role-name-taken' : undefined;
};

// Quien se quedaría sin roles: tiene solo este y se lo sacan.
const orphans = (draft: Draft, roleIdsOf: Record<string, string[]>) =>
  Object.fromEntries(
    draft.take
      .filter((id) => (roleIdsOf[id] as string[]).every((roleId) => roleId === draft.id))
      .map((id) => [id, 'no-roles' as const]),
  );

// Los permisos de quien guarda, antes y después de este borrador.
function selfLoss(draft: Draft, { roles, me, roleIdsOf }: Context) {
  const mine = roleIdsOf[me] ?? [];
  const granted = (keep: (role: RoleRow) => readonly string[]) =>
    new Set(roles.filter((role) => mine.includes(role.id)).flatMap(keep));
  const before = granted((role) => role.permissions);
  const holds = holdersOf(draft).includes(me);
  const after = granted((role) =>
    role.id !== draft.id ? role.permissions : holds ? draft.permissions : [],
  );
  return (['roles.manage', 'users.manage'] as const).find((id) => before.has(id) && !after.has(id));
}

export function validate(draft: Draft, context: Context): DraftErrors {
  const name = nameError(draft, context.roles);
  const people = orphans(draft, context.roleIdsOf);
  const self = draft.id ? selfLoss(draft, context) : undefined;
  return {
    ...(name && { name }),
    ...(draft.permissions.length === 0 && { permissions: true as const }),
    ...(Object.keys(people).length > 0 && { people }),
    ...(self && { self }),
  };
}

export const hasErrors = (errors: DraftErrors) => Object.keys(errors).length > 0;

// Lo que da acceso al guardar, para decirlo al confirmar (R3.8; diseño de 02, § 20).
export const givesAccess = (draft: Draft) => ({
  people: draft.give,
  permissions: draft.permissions.filter((id) => !draft.original.permissions.includes(id)),
  isNew: !draft.id,
});
