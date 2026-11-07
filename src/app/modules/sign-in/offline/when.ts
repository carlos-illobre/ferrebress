// Hasta cuándo se puede entrar sin conexión, como lo lee la persona (15 · R2.1).
import { businessDateOf, businessTimeZone } from '@ferrebress/shared/time/business';
import { formatTime } from '../../../platform/time.ts';

const day = 24 * 60 * 60_000;

// «hoy 21:40», «mañana 09:05» o «el martes 09:40»: en la zona del negocio, como toda hora (00 · R8.4),
// y con el formato que eligió la persona (04 · R3).
export function whenText(until: Date, now = new Date()): string {
  const time = formatTime(until);
  const days = (Date.parse(businessDateOf(until)) - Date.parse(businessDateOf(now))) / day;
  if (days === 0) return `hoy ${time}`;
  if (days === 1) return `mañana ${time}`;
  const weekday = until.toLocaleDateString('es-AR', {
    weekday: 'long',
    timeZone: businessTimeZone,
  });
  return `el ${weekday} ${time}`;
}
