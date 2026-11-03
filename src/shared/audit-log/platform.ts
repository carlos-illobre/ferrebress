// Los tipos de acción que anota la plataforma, para cualquier módulo, en Quién hizo qué: los
// pedidos frenados por un límite, los que no venían de la aplicación y los permisos que faltaron.
import { permissions } from '../contracts/permissions.ts';
import { type Entry, text } from './kinds.ts';

const topics: Record<string, string> = {
  'sign-in': ' para entrar',
  users: ' en Usuarios',
  'audit-log': ' en Quién hizo qué',
};

export const platformTypes = {
  'request.throttled': {
    group: 'refused',
    tone: 'amber',
    icon: 'hourglass',
    name: 'Llegó a un límite de intentos',
    shows: ['topic', 'by'],
    says: (e) => [text(`Llegó al límite de intentos${topics[String(e.data.topic)] ?? ''}`)],
  },
  'request.rejected': {
    group: 'refused',
    tone: 'amber',
    icon: 'shield-x',
    name: 'Un pedido que no venía de la aplicación',
    shows: ['reason', 'path'],
    says: () => [text('Se rechazó un pedido que no venía de la aplicación')],
  },
  'permission.denied': {
    group: 'refused',
    tone: 'amber',
    icon: 'lock',
    name: 'Quiso usar algo sin permiso',
    shows: ['permission'],
    says: (e) => {
      const permission = permissions.find((one) => one.id === e.data.permission);
      return [text(`Quiso usar algo sin el permiso «${permission?.name ?? 'que hace falta'}»`)];
    },
  },
} satisfies Record<string, Entry>;
