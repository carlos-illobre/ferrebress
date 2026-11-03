// Los tipos de acción de Usuarios (capítulo 02, etapa a) en Quién hizo qué.
import { type Entry, listOf, text, whom } from './kinds.ts';

const refusals: Record<string, string> = {
  self: 'no se puede sobre uno mismo',
  'last-administrator': 'es la última persona que administra',
  changed: 'otra persona lo cambió antes',
  'confirm-first': 'faltaba confirmar con Google o la huella',
  outranked: 'esa persona tiene permisos que no tiene quien lo pidió',
  'email-taken': 'el correo ya lo tiene otra persona',
  'already-entered': 'esa persona ya entró',
  'not-found': 'no existe',
  'no-roles': 'le faltaba algún rol',
  'role-name-taken': 'ya hay un rol con ese nombre',
  'role-in-use': 'alguien tiene ese rol',
  'system-role': 'el rol Administrador no se borra',
  'too-many-roles': 'ya hay demasiados roles',
  'person-inactive': 'esa persona está dada de baja',
  'person-missing': 'esa persona no existe',
};

export const usersTypes = {
  'user.authorized': {
    group: 'users',
    tone: 'plain',
    icon: 'user-plus',
    name: 'Autorizó a alguien',
    shows: ['roles'],
    says: (e) => {
      const roles = Array.isArray(e.data.roles) ? e.data.roles.map(String) : [];
      return [
        text('Autorizó a '),
        whom(e),
        ...(roles.length ? [text(` con ${listOf(roles)}`)] : []),
      ];
    },
  },
  'user.renamed': {
    group: 'users',
    tone: 'plain',
    icon: 'pencil',
    name: 'Cambió el nombre de alguien',
    shows: [],
    says: (e) => [text('Le cambió el nombre a '), whom(e)],
  },
  'user.email-changed': {
    group: 'users',
    tone: 'plain',
    icon: 'at-sign',
    name: 'Cambió el correo de alguien',
    shows: [],
    says: (e) => [text('Le cambió el correo a '), whom(e)],
  },
  'user.activated': {
    group: 'users',
    tone: 'plain',
    icon: 'user-check',
    name: 'Dio de alta a alguien',
    shows: [],
    says: (e) => [text('Dio de alta a '), whom(e)],
  },
  'user.deactivated': {
    group: 'users',
    tone: 'red',
    icon: 'user-minus',
    name: 'Dio de baja a alguien',
    shows: [],
    says: (e) => [text('Dio de baja a '), whom(e)],
  },
  'user.deleted': {
    group: 'users',
    tone: 'red',
    icon: 'user-x',
    name: 'Borró a alguien',
    shows: [],
    says: (e) => [text('Borró a '), whom(e)],
  },
  'users.rejected': {
    group: 'refused',
    tone: 'amber',
    icon: 'ban',
    name: 'Un cambio en Usuarios que no se hizo',
    shows: ['reason'],
    says: (e) => {
      const why = refusals[String(e.data.reason)];
      return e.targets.some((target) => target.kind === 'person')
        ? [text('No se pudo cambiar a '), whom(e), ...(why ? [text(`: ${why}`)] : [])]
        : [text(`No se pudo hacer un cambio en Usuarios${why ? `: ${why}` : ''}`)];
    },
  },
} satisfies Record<string, Entry>;
