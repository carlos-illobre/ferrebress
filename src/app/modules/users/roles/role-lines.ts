// Lo que se dice en la pantalla de un rol (02 · R7.1, R7.3, R7.5, R7.13; maqueta users-roles/final),
// resuelto para cualquier vista: qué hay que corregir y el motivo de cada cosa, quiénes lo tienen y
// qué les pasa al guardar, cada grupo de permisos con lo tildado y lo que queda atado, la vista previa
// y el resumen del celular.
import {
  type PermissionGroup,
  type PermissionId,
  permissionGroups,
  permissionOf,
  permissions,
} from '@ferrebress/shared/contracts/permissions';
import { maxRoleDescription, maxRoleName } from '@ferrebress/shared/contracts/roles';
import type { PersonRow } from '@ferrebress/shared/contracts/users';
import { initialsOf } from '../logic.ts';
import { type Draft, type DraftErrors, holdersOf, type PersonError, tiedBy } from './draft.ts';
import { facesOf } from './lines.ts';
import { rolesTexts as t } from './texts.ts';

const groups = Object.keys(permissionGroups) as PermissionGroup[];
const quoted = (ids: PermissionId[]) => ids.map((id) => `«${permissionOf(id).name}»`);

export const nameProblem = (error: DraftErrors['name']) =>
  error === 'role-name-taken' ? t.nameTaken : t.noName;

// Una que ya no está (la borraron mientras se armaba el rol) no tiene nombre para mostrar.
function personProblem(error: PersonError, person: PersonRow | undefined) {
  if (error === 'person-missing') return t.missing;
  const name = (person as PersonRow).displayName;
  if (error === 'no-roles') return t.lastRole(name);
  return error === 'too-many-roles' ? t.tooMany(name) : t.inactive(name);
}

const selfProblem = (permission: string) => t.self(permissionOf(permission as never).name);

// Qué hay que corregir, en una línea: el nombre, los permisos, el permiso propio y cada persona.
export function problemsOf(errors: DraftErrors | undefined, people: readonly PersonRow[]) {
  if (!errors) return undefined;
  const nameOf = (id: string) => {
    const person = people.find((one) => one.id === id);
    if (!person) return t.someoneGone;
    return person.self ? t.yourRole : person.displayName;
  };
  const shown = [
    ...(errors.name ? [t.theName] : []),
    ...(errors.permissions ? [t.thePermissions] : []),
    ...(errors.self ? [`«${permissionOf(errors.self).name}»`] : []),
    ...Object.keys(errors.people ?? {}).map(nameOf),
  ];
  return shown.length > 0 ? t.problems(shown.join(', ')) : undefined;
}

// Una que lo tiene o a quien se le da: qué le pasa al guardar (o su correo) y su motivo si no se puede.
function holderLine(person: PersonRow, draft: Draft, errors: DraftErrors | undefined) {
  const given = draft.give.includes(person.id);
  const taken = draft.take.includes(person.id);
  const error = errors?.people?.[person.id];
  return {
    id: person.id,
    initials: initialsOf(person),
    name: person.displayName,
    self: person.self,
    state: given ? ('given' as const) : taken ? ('taken' as const) : undefined,
    note: given ? t.willGet : taken ? t.willLose : person.email,
    error: error && personProblem(error, person),
    // Se sacaría a sí misma lo que la deja administrar (E56): el motivo va en su renglón.
    selfError: person.self && taken && errors?.self ? selfProblem(errors.self) : undefined,
  };
}

// Quiénes lo tienen: las activas que lo tienen y a quienes se les da, cada una con qué le pasa al
// guardar y su motivo si no se puede; las dadas de baja, aparte; y a quiénes se les puede dar.
export function holdersLines(
  draft: Draft,
  people: readonly PersonRow[],
  errors: DraftErrors | undefined,
) {
  const shown = [...draft.original.holders, ...draft.give]
    .map((id) => people.find((one) => one.id === id))
    .filter((one): one is PersonRow => !!one);
  const inactive = draft.id
    ? people.filter((one) => !one.active && one.roleIds.includes(draft.id as string))
    : [];
  const holding = holdersOf(draft);
  return {
    people: shown.map((person) => holderLine(person, draft, errors)),
    nobody: shown.length === 0,
    inactive:
      inactive.length > 0
        ? t.alsoInactive(inactive.map((one) => one.displayName).join(', '))
        : undefined,
    candidates: people.filter((one) => one.active && !holding.includes(one.id)),
  };
}

// Cada grupo de permisos con cuántos da y cada permiso: tildado, atado a otro tildado (E36) o con el
// motivo si quien guarda se lo sacaría (E56). El grupo de ese permiso se despliega solo.
export function permissionLines(draft: Draft, errors: DraftErrors | undefined) {
  return {
    noPermissions: errors?.permissions ? t.noPermissionsError : undefined,
    selfGroup: errors?.self ? permissionOf(errors.self).group : undefined,
    groups: groups.map((group) => {
      const items = permissions.filter((one) => one.group === group);
      const count = items.filter((one) => draft.permissions.includes(one.id)).length;
      return {
        group,
        name: permissionGroups[group].name,
        detail: permissionGroups[group].detail,
        some: count > 0,
        count: t.ofTotal(count, items.length),
        items: items.map((one) => {
          const on = draft.permissions.includes(one.id);
          const tied = on ? tiedBy(draft, one.id) : [];
          return {
            id: one.id,
            name: one.name,
            explanation: one.explanation,
            on,
            tied:
              tied.length > 0
                ? {
                    long: t.tiedLong(quoted(tied), tied.length > 1),
                    short: t.tiedShort(quoted(tied)),
                  }
                : undefined,
            error: errors?.self === one.id && !on ? selfProblem(one.id) : undefined,
          };
        }),
      };
    }),
  };
}

// La vista previa: cómo se ve el rol y, por parte de la aplicación, si da algo.
export function previewLines(draft: Draft) {
  return {
    name: draft.name.trim() || t.name,
    description: draft.description.trim() || undefined,
    lead: draft.id ? t.previewLead : t.previewLeadNew,
    groups: groups.map((group) => {
      const count = permissions.filter(
        (one) => one.group === group && draft.permissions.includes(one.id),
      ).length;
      return {
        group,
        name: permissionGroups[group].name,
        on: count > 0,
        text: count ? t.permissions(count) : t.noPermissions,
      };
    }),
  };
}

// El resumen del celular: cuántos permisos y cuántas personas lo van a tener, con sus iniciales.
export function summaryLines(draft: Draft, people: readonly PersonRow[]) {
  const holders = holdersOf(draft).map((id) => people.find((one) => one.id === id) as PersonRow);
  const count = draft.permissions.length;
  return {
    permissions: { count, word: t.permissionsWord(count) },
    holders: { count: holders.length, word: t.peopleWord(holders.length), ...facesOf(holders, 2) },
  };
}

// Lo de «Información del rol»: los largos, el motivo del nombre y cuánto lleva la descripción.
export const infoLines = (draft: Draft, errors: DraftErrors | undefined) => ({
  limits: { name: maxRoleName, description: maxRoleDescription },
  nameError: errors?.name ? nameProblem(errors.name) : undefined,
  count: t.count(draft.description.length, maxRoleDescription),
  descriptionFull: draft.description.length >= maxRoleDescription,
});
