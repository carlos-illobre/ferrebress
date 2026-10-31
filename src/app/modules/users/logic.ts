// Lo que la pantalla de Usuarios decide sobre la lista que trae del servidor (diseño de 02, § 8): el
// orden de R3.1, el buscador, los filtros, las cuentas de arriba y cómo se dice cuándo pasó algo,
// con la hora del servidor. Sin pantallas: lo prueban las pruebas de la lógica.
import type { PersonRow, Way } from '@ferrebress/shared/contracts/users';
import { serverNow } from '../../platform/server/clock.ts';

export type Filter = 'all' | 'active' | 'never' | 'off';

const byName = (a: PersonRow, b: PersonRow) =>
  a.displayName.localeCompare(b.displayName, 'es', { sensitivity: 'base' });
const rank = (person: PersonRow) => (person.self ? 0 : person.active ? 1 : 2);

// R3.1: la propia, después las activas y al final las dadas de baja, cada grupo por nombre.
export const ordered = (people: PersonRow[]) =>
  [...people].sort((a, b) => rank(a) - rank(b) || byName(a, b));

// Sin mayúsculas ni tildes: «lucia» encuentra a «Lucía».
const plain = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

const inFilter: Record<Filter, (person: PersonRow) => boolean> = {
  all: () => true,
  active: (person) => person.active,
  never: (person) => person.active && person.neverSignedIn,
  off: (person) => !person.active,
};

export function visible(people: PersonRow[], filter: Filter, search: string): PersonRow[] {
  const wanted = plain(search.trim());
  return ordered(people).filter(
    (person) =>
      inFilter[filter](person) && plain(`${person.displayName} ${person.email}`).includes(wanted),
  );
}

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

// Las dos letras del círculo: de su nombre o, sin nombre, de su correo.
export const initialsOf = (person: PersonRow) =>
  (person.displayName === person.email
    ? person.email.slice(0, 2)
    : person.displayName
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0])
        .join('')
  ).toUpperCase();

// Ahora, con la hora del servidor (diseño de 02, § 8); antes de su primera respuesta, la del dispositivo.
export const nowMs = () => (serverNow() ?? new Date()).getTime();

const minute = 60_000;
const hour = 60 * minute;
const day = 24 * hour;
const two = (n: number) => String(n).padStart(2, '0');
const clock = (at: Date) => `${at.getHours()}:${two(at.getMinutes())}`;
const startOfDay = (at: Date) => new Date(at.getFullYear(), at.getMonth(), at.getDate()).getTime();

// La fecha corta: «12/10», o con el año si no es el de ahora.
export function dateOf(at: number, now: number): string {
  const when = new Date(at);
  const year = when.getFullYear() === new Date(now).getFullYear() ? '' : `/${when.getFullYear()}`;
  return `${two(when.getDate())}/${two(when.getMonth() + 1)}${year}`;
}

// Cuándo pasó, como lo dice la gente: «recién», «hace 5 min», «hace 2 horas», «hoy 7:58»,
// «ayer 8:02», «hace 3 días» o «el 12/10».
export function sinceOf(at: number, now: number): string {
  const ago = Math.max(0, now - at);
  const days = Math.round((startOfDay(new Date(now)) - startOfDay(new Date(at))) / day);
  if (ago < minute) return 'recién';
  if (ago < hour) return `hace ${Math.floor(ago / minute)} min`;
  if (ago < 6 * hour)
    return Math.floor(ago / hour) === 1 ? 'hace 1 hora' : `hace ${Math.floor(ago / hour)} horas`;
  if (days === 0) return `hoy ${clock(new Date(at))}`;
  if (days === 1) return `ayer ${clock(new Date(at))}`;
  if (days < 7) return `hace ${days} días`;
  return `el ${dateOf(at, now)}`;
}

export const wayNames: Record<Way, string> = {
  google: 'Google',
  passkey: 'Huella',
  qr: 'Código QR',
  offline: 'Sin conexión',
};
