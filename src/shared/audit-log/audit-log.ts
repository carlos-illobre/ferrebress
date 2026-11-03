// Los tipos de acción de Quién hizo qué (capítulo 05).
import { type Entry, text } from './kinds.ts';

export const auditLogTypes = {
  // Una vez por sesión y por día (R1.3): si alguien usa la sesión de otro para mirar, queda el rastro.
  'audit-log.opened': {
    group: 'users',
    tone: 'plain',
    icon: 'eye',
    name: 'Abrió Quién hizo qué',
    shows: [],
    says: () => [text('Abrió Quién hizo qué')],
  },
} satisfies Record<string, Entry>;
