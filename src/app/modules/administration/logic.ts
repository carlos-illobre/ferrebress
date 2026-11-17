// Las cuentas de lo que muestra Administración (diseño de 06, § 7): cómo se escribe cada valor y lo
// que muestra cada opción antes de tocarla (el día de mostrador, el vencimiento del vínculo). Puras,
// sin pedidos.
import {
  confirmRowsRange,
  filesMbRange,
  goneWarnPercentRange,
  maxFileMbRange,
  reviewPercentRange,
  roundingSteps,
  type SettingKey,
  type Settings,
  sessionIdleOptions,
  sessionMaxOptions,
  settingList,
  unappliedFileDaysRange,
} from '@ferrebress/shared/contracts/administration';
import { roundUp } from '@ferrebress/shared/pricing/rounding';
import { businessFormat } from '@ferrebress/shared/time/business';
import { texts } from './texts.ts';

const thousands = (n: number) => n.toLocaleString('es-AR');
export const pesos = (n: number) => `$ ${thousands(n)}`;

// Cómo se escribe cada valor.
const formats: Record<SettingKey, (value: never) => string> = {
  roundingStep: (value: number) => (value === 0 ? 'Sin redondeo' : pesos(value)),
  quickMargins: (value: number[]) => `${value.join(' · ')} %`,
  sessionIdle: (value: number) => texts.units.minutes(value),
  sessionMax: (value: number) => texts.units.hours(value),
  pairingDays: (value: number) => texts.units.days(value),
  reviewPercent: (value: number) => texts.units.percent(value),
  goneWarnPercent: (value: number) => texts.units.percent(value),
  maxFileMb: (value: number) => texts.units.mb(thousands(value)),
  confirmRows: (value: number) => texts.units.rows(thousands(value)),
  filesMb: (value: number) => texts.units.mb(thousands(value)),
  unappliedFileDays: (value: number) => texts.units.days(value),
};

export const shown = <K extends SettingKey>(key: K, value: Settings[K]): string =>
  (formats[key] as (value: Settings[K]) => string)(value);

export { thousands };

// Los ajustes de las listas de precios (R8), en el orden del panel, cada uno con su rango.
export const listSettings = {
  reviewPercent: reviewPercentRange,
  goneWarnPercent: goneWarnPercentRange,
  maxFileMb: maxFileMbRange,
  confirmRows: confirmRowsRange,
  filesMb: filesMbRange,
  unappliedFileDays: unappliedFileDaysRange,
} as const;
export type ListSetting = keyof typeof listSettings;

// El panel de las listas (R8): sus tres partes, en orden, y la unidad de cada número.
export const listParts: { title: string; keys: ListSetting[] }[] = [
  { title: texts.lists.review, keys: ['reviewPercent', 'goneWarnPercent'] },
  { title: texts.lists.upload, keys: ['maxFileMb', 'confirmRows'] },
  { title: texts.lists.files, keys: ['filesMb', 'unappliedFileDays'] },
];
export const listUnits: Record<ListSetting, string> = {
  reviewPercent: '%',
  goneWarnPercent: '%',
  maxFileMb: 'MB',
  confirmRows: 'filas',
  filesMb: 'MB',
  unappliedFileDays: 'días',
};

// Las opciones de cada ajuste que se elige de una lista (R3, R6).
export { roundingSteps, sessionIdleOptions, sessionMaxOptions };

// El precio redondeado para arriba con un paso (R3.1).
export const roundedTo = (price: number, step: number) => roundUp(price, step);

// El costo de ejemplo con el que cada margen rápido dice a cuánto vende (R4, maqueta final).
export const exampleCost = 4000;
export const sellsAt = (margin: number, step: number) =>
  roundUp(exampleCost * (1 + margin / 100), step);

// El valor de arranque de un ajuste, como se escribe («De arranque, 50 %»).
export const initialOf = (key: ListSetting) => shown(key, settingList[key].initial);

// Lo escrito en una caja, como número: sin los puntos de miles; vacío no es un número (NaN), y lo que
// no vale lo dice al guardar (R2.2).
export function typedNumber(text: string): number {
  const clean = text.replace(/\./g, '').trim();
  return clean === '' ? Number.NaN : Number(clean);
}
export const isListSetting = (key: SettingKey): key is ListSetting => key in listSettings;

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
