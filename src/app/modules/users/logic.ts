// Lo que la pantalla de Usuarios decide sobre la lista que trae del servidor (diseño de 02, § 8): el
// orden de R3.1, el buscador, los filtros, las cuentas de arriba y cómo se dice cuándo pasó algo,
// con la hora del servidor. Sin pantallas: lo prueban las pruebas de la lógica.
import type { PersonRow, Way } from '@ferrebress/shared/contracts/users';
import { initials, plain } from '../../platform/text.ts';

export { dateOf, nowMs, sinceOf } from '../../platform/time.ts';

export type Filter = 'all' | 'active' | 'never' | 'off';

const byName = (a: PersonRow, b: PersonRow) =>
  a.displayName.localeCompare(b.displayName, 'es', { sensitivity: 'base' });
const rank = (person: PersonRow) => (person.self ? 0 : person.active ? 1 : 2);

// R3.1: la propia, después las activas y al final las dadas de baja, cada grupo por nombre.
export const ordered = (people: PersonRow[]) =>
  [...people].sort((a, b) => rank(a) - rank(b) || byName(a, b));

const inFilter: Record<Filter, (person: PersonRow) => boolean> = {
  all: () => true,
  active: (person) => person.active,
  never: (person) => person.active && person.neverSignedIn,
  off: (person) => !person.active,
};

// `role`: solo quienes tienen ese rol (E54); sin él, todos.
export function visible(
  people: PersonRow[],
  filter: Filter,
  search: string,
  role?: string,
): PersonRow[] {
  const wanted = plain(search.trim());
  return ordered(people).filter(
    (person) =>
      inFilter[filter](person) &&
      (!role || person.roleIds.includes(role)) &&
      plain(`${person.displayName} ${person.email}`).includes(wanted),
  );
}

// Cuántas personas tiene cada rol, para su filtro.
export const holdersOf = (people: PersonRow[], role: string) =>
  people.filter((person) => person.roleIds.includes(role)).length;

// Las cuentas de arriba y de los filtros: las sesiones y los celulares, de las activas.
export function counts(people: PersonRow[]) {
  const active = people.filter((person) => person.active);
  const sum = (key: 'sessions' | 'phones') => active.reduce((n, person) => n + person[key], 0);
  return {
    all: people.length,
    active: active.length,
    never: active.filter((person) => person.neverSignedIn).length,
    off: people.length - active.length,
    sessions: sum('sessions'),
    phones: sum('phones'),
  };
}

// Qué va al pie de la tarjeta (R4, R7.11): la nota de la propia; dar de alta a quien está de baja,
// borrar el alta de quien nunca entró o dar de baja, con «Administrar personas» y no sobre quien
// tiene más. Nada, si no puede.
export type Foot = 'self' | 'activate' | 'delete' | 'deactivate' | undefined;

export function footOf(
  person: PersonRow,
  may: { manageOver: (person: PersonRow) => boolean },
): Foot {
  if (person.self) return 'self';
  if (!may.manageOver(person)) return undefined;
  if (!person.active) return 'activate';
  return person.neverSignedIn ? 'delete' : 'deactivate';
}

// Las dos letras del círculo: de su nombre o, sin nombre, de su correo.
export const initialsOf = (person: PersonRow) =>
  initials(person.displayName === person.email ? '' : person.displayName, person.email);

export const wayNames: Record<Way, string> = {
  google: 'Google',
  passkey: 'Huella',
  qr: 'Código QR',
  offline: 'Sin conexión',
};

// Cómo se llama un dispositivo (04 · R9.1), la regla común.
export { shownName as deviceOf } from '@ferrebress/shared/contracts/device-settings';
