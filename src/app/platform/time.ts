// Cómo se escribe una hora en la aplicación: siempre la de la zona del negocio (00 · R8.4), con el
// formato que eligió la persona, 24 horas o a. m./p. m. (04 · R3). Es el único lugar que escribe
// horas: `pnpm lint` no deja hacerlo en otro (diseño de 04, § 4).
import { businessTimeZone } from '@ferrebress/shared/time/business';
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
