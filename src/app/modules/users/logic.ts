// Lo que la pantalla de Usuarios decide sobre la lista que trae del servidor (diseño de 02, § 8): el
// orden de R3.1, el buscador, los filtros, las cuentas de arriba y cómo se dice cuándo pasó algo,
// con la hora del servidor. Sin pantallas: lo prueban las pruebas de la lógica.
import type { PersonRow, Way } from '@ferrebress/shared/contracts/users';
import { businessDateOf } from '@ferrebress/shared/time/business';
import { serverNow } from '../../platform/server/clock.ts';
import { initials, plain } from '../../platform/text.ts';
import { formatTime } from '../../platform/time.ts';

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

// Ahora, con la hora del servidor (diseño de 02, § 8); antes de su primera respuesta, la del dispositivo.
export const nowMs = () => (serverNow() ?? new Date()).getTime();

const minute = 60_000;
const hour = 60 * minute;
const day = 24 * hour;
// El día del negocio, como lo usan las fechas: [año, mes, día] (00 · R8.4).
const dayOf = (at: number) => businessDateOf(new Date(at)).split('-');
const daysBetween = (from: number, to: number) =>
  (Date.parse(businessDateOf(new Date(to))) - Date.parse(businessDateOf(new Date(from)))) / day;

// La fecha corta: «12/10», o con el año si no es el de ahora.
export function dateOf(at: number, now: number): string {
  const [year, month, date] = dayOf(at);
  return `${date}/${month}${year === dayOf(now)[0] ? '' : `/${year}`}`;
}

// Cuándo pasó, como lo dice la gente: «recién», «hace 5 min», «hace 2 horas», «hoy 07:58»,
// «ayer 08:02», «hace 3 días» o «el 12/10».
export function sinceOf(at: number, now: number): string {
  const ago = Math.max(0, now - at);
  const days = daysBetween(at, now);
  if (ago < minute) return 'recién';
  if (ago < hour) return `hace ${Math.floor(ago / minute)} min`;
  if (ago < 6 * hour)
    return Math.floor(ago / hour) === 1 ? 'hace 1 hora' : `hace ${Math.floor(ago / hour)} horas`;
  if (days === 0) return `hoy ${formatTime(at)}`;
  if (days === 1) return `ayer ${formatTime(at)}`;
  if (days < 7) return `hace ${days} días`;
  return `el ${dateOf(at, now)}`;
}

export const wayNames: Record<Way, string> = {
  google: 'Google',
  passkey: 'Huella',
  qr: 'Código QR',
  offline: 'Sin conexión',
};

// Cómo se llama un dispositivo: el nombre que le pusieron o, sin nombre, su navegador y su sistema
// (04 · R9.1).
export const deviceOf = (row: { deviceLabel: string; deviceName?: string }) =>
  row.deviceName ?? row.deviceLabel;
