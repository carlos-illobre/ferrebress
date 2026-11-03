// Los tipos de acción de Sin conexión (capítulo 15) en Quién hizo qué.
import { type Entry, text, whom } from './kinds.ts';

const entry = ['signedAt', 'lastContactAt', 'result', 'reason'];

export const offlineTypes = {
  'sign-in.offline-confirmed': {
    group: 'offline',
    tone: 'plain',
    icon: 'wifi-off',
    name: 'Entró sin conexión',
    shows: entry,
    says: () => [text('Entró sin conexión')],
  },
  'sign-in.offline-rejected': {
    group: 'offline',
    tone: 'amber',
    icon: 'cloud-off',
    name: 'No se confirmó una entrada sin conexión',
    shows: entry,
    says: (e) =>
      e.actor.kind === 'person'
        ? [text('No se pudo confirmar su entrada sin conexión')]
        : [text('No se pudo confirmar una entrada sin conexión de '), whom(e)],
  },
  'sign-in.offline-repeated': {
    group: 'refused',
    tone: 'amber',
    icon: 'copy',
    name: 'Repitió una entrada sin conexión',
    shows: [],
    says: (e) => [text('Repitió una entrada sin conexión de '), whom(e)],
  },
} satisfies Record<string, Entry>;
