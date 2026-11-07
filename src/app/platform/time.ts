// Cómo se escribe una hora en la aplicación: siempre la de la zona del negocio (00 · R8.4), con el
// formato que eligió la persona, 24 horas o a. m./p. m. (04 · R3), y cuándo pasó algo, como lo dice
// la gente. Es el único lugar que escribe horas: `pnpm lint` no deja hacerlo en otro (diseño de 04,
// § 4).
import { businessDateOf, businessTimeZone } from '@ferrebress/shared/time/business';
import { serverNow } from './server/clock.ts';
import { createStore } from './store.ts';

export type TimeFormat = 'h24' | 'h12';

// Lo pone quien guarda la elección de la persona; de arranque, 24 horas (04 · R3.1).
export const timeFormat = createStore<TimeFormat>('h24');

const cycles = { h24: 'h23', h12: 'h12' } as const;

// Armar un formateador es caro y una lista escribe muchas horas: uno por forma, y se reusa.
const made = new Map<string, Intl.DateTimeFormat>();
function formatter(withMinutes: boolean, format: TimeFormat, zone = businessTimeZone) {
  const key = `${format}${withMinutes}${zone}`;
  const found = made.get(key);
  if (found) return found;
  const fresh = new Intl.DateTimeFormat('es-AR', {
    timeZone: zone,
    hour: 'numeric',
    ...(withMinutes && { minute: '2-digit' }),
    hourCycle: cycles[format],
  });
  made.set(key, fresh);
  return fresh;
}

// «14:30» o «2:30 p. m.».
export const formatTime = (instant: Date | number) =>
  formatter(true, timeFormat.get()).format(instant);

// En un formato dado, aunque no sea el elegido: para mostrar cómo se vería (04 · R3.1).
export const formatTimeAs = (instant: Date | number, format: TimeFormat) =>
  formatter(true, format).format(instant);

// Solo la hora, para las marcas de una tira: «14» o «2 p. m.».
export const formatHour = (instant: Date | number) =>
  formatter(false, timeFormat.get()).format(instant);

// Una hora del día que ya está en la zona del negocio (de 0 a 24): «9» o «9 a. m.».
export const formatHourOfDay = (hour: number) =>
  formatter(false, timeFormat.get(), 'UTC').format(Date.UTC(2000, 0, 1, hour % 24));

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
