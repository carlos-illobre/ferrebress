// Los tipos de acción de Roles (capítulo 02, etapa b) en Quién hizo qué.
import { difference, type Entry, listOf, named, type ToneInput, text, whom } from './kinds.ts';

// Rojo si saca algo: un rol a una persona, o permisos a un rol (05 · R4.4, E21).
const redIfRemoved =
  (field: string) =>
  ({ changes }: ToneInput) =>
    changes?.[field] && difference(changes[field].before, changes[field].after).removed.length
      ? 'red'
      : 'plain';

export const rolesTypes = {
  'user.roles-changed': {
    group: 'roles',
    tone: redIfRemoved('roles'),
    icon: 'user-cog',
    name: 'Cambió los roles de alguien',
    shows: ['save'],
    says: (e) => {
      const { added, removed } = difference(e.changes.roles?.before, e.changes.roles?.after);
      if (added.length && !removed.length) return [text(`Le dio ${roles(added)} a `), whom(e)];
      if (removed.length && !added.length) return [text(`Le sacó ${roles(removed)} a `), whom(e)];
      return [text('Le cambió los roles a '), whom(e)];
    },
  },
  'role.created': {
    group: 'roles',
    tone: 'plain',
    icon: 'shield-plus',
    name: 'Creó un rol',
    shows: ['save'],
    says: (e) => [text('Creó el rol '), named(e, 'role', 'nuevo')],
  },
  'role.changed': {
    group: 'roles',
    tone: redIfRemoved('permissions'),
    icon: 'shield-ellipsis',
    name: 'Cambió un rol',
    shows: ['save'],
    says: (e) => {
      const role = named(e, 'role', 'un rol');
      if (e.changes.name) return [text('Le cambió el nombre al rol '), role];
      if (e.changes.permissions) return [text('Cambió los permisos del rol '), role];
      return [text('Cambió la descripción del rol '), role];
    },
  },
  'role.deleted': {
    group: 'roles',
    tone: 'red',
    icon: 'shield-minus',
    name: 'Borró un rol',
    shows: [],
    says: (e) => [text('Borró el rol '), named(e, 'role', 'que ya no está')],
  },
  'role.permissions-added': {
    group: 'roles',
    tone: 'plain',
    icon: 'shield-check',
    name: 'Sumó permisos nuevos al Administrador',
    shows: ['permissions'],
    says: () => [text('Le sumó al rol Administrador los permisos nuevos')],
  },
} satisfies Record<string, Entry>;

const roles = (names: string[]) =>
  names.length === 1 ? `el rol ${names[0]}` : `los roles ${listOf(names)}`;
