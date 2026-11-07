// Cómo se describe un tipo de acción en el catálogo de Quién hizo qué (diseño de 05, § 4): su grupo,
// su color, su ícono, su nombre, los datos que se pueden mostrar y su texto, en trozos. Lo comparten
// el servidor (el color al anotar, qué sale) y la aplicación (lo demás).
import type { AuditView, TargetView, ToneName } from '../contracts/audit-log.ts';

export const groups = {
  'sign-in': 'Entrar',
  users: 'Usuarios',
  roles: 'Roles',
  offline: 'Sin conexión',
  'device-link': 'Celular y computadora',
  'device-settings': 'Configuración',
  refused: 'Rechazos',
  other: 'Otros',
} as const;
export type Group = keyof typeof groups;

// Lo que el servidor sabe de una acción al anotarla, para calcular su color.
export type ToneInput = {
  actor: { kind: string; userId?: string };
  targets?: readonly { kind: string; id: string }[];
  changes?: Record<string, { before: unknown; after: unknown }>;
  data?: Record<string, unknown>;
};

// Un trozo del texto: palabras, una persona (que se toca para filtrar) o una cosa por su nombre.
export type Piece = { text: string } | { person: TargetView } | { thing: string };

export type Entry = {
  group: Group;
  tone: ToneName | ((event: ToneInput) => ToneName);
  icon: string;
  name: string;
  shows: readonly string[];
  says: (event: AuditView) => Piece[];
};

export const text = (value: string): Piece => ({ text: value });
export const thing = (value: string): Piece => ({ thing: value });

// La primera persona a quien se le hizo la acción; si no se sabe, «alguien».
export function whom(event: AuditView): Piece {
  const person = event.targets.find((target) => target.kind === 'person');
  return person ? { person } : text('alguien');
}

// El nombre de la primera cosa de ese tipo (un rol), o lo que se diga si no está.
export const named = (event: AuditView, kind: string, otherwise: string): Piece =>
  thing(event.targets.find((target) => target.kind === kind)?.name ?? otherwise);

// Una lista en castellano: «A», «A y B», «A, B y C».
export const listOf = (items: readonly string[]): string =>
  items.length < 2 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} y ${items.at(-1)}`;

// Lo que se agregó y lo que se sacó entre dos listas.
export function difference(before: unknown, after: unknown) {
  const [was, is] = [asList(before), asList(after)];
  return {
    added: is.filter((one) => !was.includes(one)),
    removed: was.filter((one) => !is.includes(one)),
  };
}
const asList = (value: unknown): string[] => (Array.isArray(value) ? value.map(String) : []);

// Rojo si a otra persona (cerrar sesiones de otro: 05 · R4.4).
export const redIfOther = ({ actor, targets }: ToneInput): ToneName =>
  targets?.some((target) => target.kind === 'person' && target.id !== actor.userId)
    ? 'red'
    : 'plain';
