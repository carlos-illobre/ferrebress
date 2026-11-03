// El catálogo de Quién hizo qué (diseño de 05, § 4): junta los tipos de acción de cada módulo. Cada
// archivo es del módulo que nombra; este, del código común.
import type { AuditView, ToneName } from '../contracts/audit-log.ts';
import { auditLogTypes } from './audit-log.ts';
import { type Entry, type Group, groups, type ToneInput, text } from './kinds.ts';
import { offlineTypes } from './offline.ts';
import { platformTypes } from './platform.ts';
import { rolesTypes } from './roles.ts';
import { signInTypes } from './sign-in.ts';
import { usersTypes } from './users.ts';

export type { Entry, Group, Piece, ToneInput } from './kinds.ts';
export { groups } from './kinds.ts';

export const catalog: Record<string, Entry> = {
  ...signInTypes,
  ...usersTypes,
  ...rolesTypes,
  ...offlineTypes,
  ...platformTypes,
  ...auditLogTypes,
};

// Un tipo que no está (de una versión más nueva, o uno que se dejó de usar): genérico, en «Otros».
const unknown: Entry = {
  group: 'other',
  tone: 'plain',
  icon: 'circle-help',
  name: 'Otra acción',
  shows: [],
  says: () => [text('Hizo una acción que esta versión no conoce')],
};

export const entryOf = (type: string): Entry => catalog[type] ?? unknown;

// El color de una acción, al anotarla.
export function toneOf(type: string, event: ToneInput): ToneName {
  const { tone } = entryOf(type);
  return typeof tone === 'function' ? tone(event) : tone;
}

// Los tipos de un grupo, para filtrar.
export const typesOf = (group: Group): string[] =>
  Object.keys(catalog).filter((type) => catalog[type]?.group === group);

export const isGroup = (name: string): name is Group => Object.hasOwn(groups, name);

// Solo los datos que el tipo dice que se muestran (§ 2.2): lo demás no sale del servidor.
export function shownData(type: string, data: Record<string, unknown> = {}) {
  const { shows } = entryOf(type);
  return Object.fromEntries(Object.entries(data).filter(([key]) => shows.includes(key)));
}

export type { AuditView };
