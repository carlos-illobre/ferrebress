// Las cuentas de lo que muestra Administración (diseño de 06, § 7): cómo se escribe cada valor y lo
// que muestra cada opción antes de tocarla (el día de mostrador, el vencimiento del vínculo). Puras,
// sin pedidos.
import type { SettingKey, Settings } from '@ferrebress/shared/contracts/administration';
import { businessFormat } from '@ferrebress/shared/time/business';
import { texts } from './texts.ts';

const thousands = (n: number) => n.toLocaleString('es-AR');
export const pesos = (n: number) => `$ ${thousands(n)}`;

export function shown<K extends SettingKey>(key: K, value: Settings[K]): string {
  const { units } = texts;
  if (key === 'roundingStep') return value === 0 ? 'Sin redondeo' : pesos(value as number);
  if (key === 'quickMargins') return `${(value as number[]).join(' · ')} %`;
  if (key === 'sessionIdle') return units.minutes(value as number);
  if (key === 'sessionMax') return units.hours(value as number);
  return units.days(value as number);
}

export { thousands };

// «12:10», sin día: el día de mostrador va de 8:00 a 8:00.
const clock = (minutes: number) => {
  const m = ((Math.round(minutes) % 1440) + 1440) % 1440;
  return `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;
};

// Un día en el mostrador (R6): entró a las 8:00, se fue a almorzar a las 12:10 y volvió a las 13:30.
const start = 8 * 60;
const lunch = 12 * 60 + 10;
const back = 13 * 60 + 30;
export function counterDay(idle: number, max: number) {
  const closes = lunch + idle;
  const end = start + max * 60;
  return {
    closesAtLunch: closes < back ? clock(closes) : undefined,
    endsAt: clock(end),
    // Antes del cierre del local, a las 19:30.
    endsWhileOpen: end <= 19 * 60 + 30,
    // Dónde cae cada cosa en una tira de 24 horas desde las 8:00, de 0 a 1.
    at: {
      lunch: (lunch - start) / 1440,
      back: (back - start) / 1440,
      close: (19.5 * 60 - start) / 1440,
    },
    idleUntil: (Math.min(closes, back) - start) / 1440,
    maxUntil: Math.min(max / 24, 1),
  };
}

export const maxEnds = (max: number) => clock(start + max * 60);

const day = 24 * 60 * 60_000;
// El día en que vence un vínculo que se espeja hoy por última vez (R7.1).
export const expiresOn = (days: number, now: number) =>
  businessFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }).format(
    new Date(now + days * day),
  );

// Las semanas del calendario del vínculo: hoy, las que vive entero y la que vence.
export function weeks(days: number, count: number): ('today' | 'lives' | 'ends' | '')[] {
  return Array.from({ length: count }, (_, i) => {
    if (i === 0) return 'today';
    if ((i + 1) * 7 <= days) return 'lives';
    return i * 7 < days ? 'ends' : '';
  });
}
